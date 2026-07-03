import Foundation
import Capacitor
import HealthKit

@objc(PhysicalClimbHealthKitPlugin)
public class PhysicalClimbHealthKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PhysicalClimbHealthKitPlugin"
    public let jsName = "PhysicalClimbHealthKitBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isNativeAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestHealthPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readDailySummaries", returnType: CAPPluginReturnPromise)
    ]

    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current

    private func isSleepAsleepValue(_ value: Int) -> Bool {
        if #available(iOS 16.0, *) {
            return value == HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue ||
                value == HKCategoryValueSleepAnalysis.asleepCore.rawValue ||
                value == HKCategoryValueSleepAnalysis.asleepDeep.rawValue ||
                value == HKCategoryValueSleepAnalysis.asleepREM.rawValue
        }

        return value == HKCategoryValueSleepAnalysis.asleep.rawValue
    }

    @objc func isNativeAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": HKHealthStore.isHealthDataAvailable()])
    }

    @objc public func requestHealthPermissions(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve([
                "granted": false,
                "unavailableReason": "Health data is not available on this device."
            ])
            return
        }

        guard
            let stepType = HKObjectType.quantityType(forIdentifier: .stepCount),
            let bodyMassType = HKObjectType.quantityType(forIdentifier: .bodyMass),
            let activeEnergyType = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned),
            let restingHrType = HKObjectType.quantityType(forIdentifier: .restingHeartRate),
            let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis)
        else {
            call.reject("Unable to create HealthKit object types.")
            return
        }

        let typesToRead: Set<HKObjectType> = [stepType, bodyMassType, activeEnergyType, restingHrType, sleepType]

        healthStore.requestAuthorization(toShare: [], read: typesToRead) { success, error in
            if let error {
                call.reject("HealthKit authorization failed.", nil, error)
                return
            }

            call.resolve(["granted": success])
        }
    }

    @objc func readDailySummaries(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(["entries": []])
            return
        }

        let startDateString = call.getString("startDate") ?? ""
        let endDateString = call.getString("endDate") ?? ""
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]

        guard
            let startDate = formatter.date(from: startDateString),
            let endDate = formatter.date(from: endDateString),
            let stepType = HKObjectType.quantityType(forIdentifier: .stepCount),
            let bodyMassType = HKObjectType.quantityType(forIdentifier: .bodyMass),
            let activeEnergyType = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned),
            let restingHrType = HKObjectType.quantityType(forIdentifier: .restingHeartRate),
            let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis)
        else {
            call.reject("Invalid dates or unavailable HealthKit types.")
            return
        }

        var summaries: [String: [String: Any]] = [:]
        let group = DispatchGroup()

        func ensureEntry(for date: Date) -> String {
            let dateString = formatter.string(from: date)
            if summaries[dateString] == nil {
                summaries[dateString] = [
                    "date": dateString,
                    "steps": 0,
                    "source": "apple-health-import"
                ]
            }
            return dateString
        }

        func enumerateDates(from start: Date, to end: Date, handler: (Date) -> Void) {
            var current = start
            while current <= end {
                handler(current)
                current = calendar.date(byAdding: .day, value: 1, to: current) ?? end.addingTimeInterval(1)
            }
        }

        enumerateDates(from: startDate, to: endDate) { date in
            _ = ensureEntry(for: date)
        }

        func runStatisticsQuery(
            quantityType: HKQuantityType,
            options: HKStatisticsOptions,
            unit: HKUnit,
            key: String
        ) {
            group.enter()
            let predicate = HKQuery.predicateForSamples(withStart: startDate, end: calendar.date(byAdding: .day, value: 1, to: endDate), options: .strictStartDate)
            let interval = DateComponents(day: 1)
            let query = HKStatisticsCollectionQuery(quantityType: quantityType, quantitySamplePredicate: predicate, options: options, anchorDate: startDate, intervalComponents: interval)
            query.initialResultsHandler = { _, collection, error in
                defer { group.leave() }
                if error != nil {
                    return
                }

                collection?.enumerateStatistics(from: startDate, to: endDate) { statistics, _ in
                    let dateKey = ensureEntry(for: statistics.startDate)
                    let quantity: HKQuantity?
                    switch options {
                    case .cumulativeSum:
                        quantity = statistics.sumQuantity()
                    case .discreteAverage:
                        quantity = statistics.averageQuantity()
                    default:
                        quantity = statistics.sumQuantity() ?? statistics.averageQuantity()
                    }

                    if let quantity {
                        summaries[dateKey]?[key] = NumberFormatter.localizedString(from: NSNumber(value: quantity.doubleValue(for: unit)), number: .decimal)
                    }
                }
            }
            healthStore.execute(query)
        }

        runStatisticsQuery(quantityType: stepType, options: .cumulativeSum, unit: HKUnit.count(), key: "steps")
        runStatisticsQuery(quantityType: activeEnergyType, options: .cumulativeSum, unit: HKUnit.kilocalorie(), key: "activeEnergyKcal")
        runStatisticsQuery(quantityType: bodyMassType, options: .discreteAverage, unit: HKUnit.pound(), key: "weightLbs")
        runStatisticsQuery(quantityType: restingHrType, options: .discreteAverage, unit: HKUnit.count().unitDivided(by: HKUnit.minute()), key: "restingHeartRate")

        group.enter()
        let sleepPredicate = HKQuery.predicateForSamples(withStart: startDate, end: calendar.date(byAdding: .day, value: 1, to: endDate), options: .strictStartDate)
        let sleepQuery = HKSampleQuery(sampleType: sleepType, predicate: sleepPredicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
            defer { group.leave() }
            (samples as? [HKCategorySample])?.forEach { sample in
                let value = sample.value
                guard self.isSleepAsleepValue(value) else {
                    return
                }

                let dateKey = ensureEntry(for: sample.startDate)
                let hours = sample.endDate.timeIntervalSince(sample.startDate) / 3600
                let current = summaries[dateKey]?["sleepHours"] as? Double ?? 0
                summaries[dateKey]?["sleepHours"] = Double(round((current + hours) * 100) / 100)
            }
        }
        healthStore.execute(sleepQuery)

        group.notify(queue: .main) {
            let entries = summaries.keys.sorted().map { key -> [String: Any] in
                var entry = summaries[key] ?? [:]
                if let stepsString = entry["steps"] as? String, let stepsValue = Double(stepsString) {
                    entry["steps"] = Int(stepsValue.rounded())
                }
                if let energyString = entry["activeEnergyKcal"] as? String, let energyValue = Double(energyString) {
                    entry["activeEnergyKcal"] = Int(energyValue.rounded())
                }
                if let weightString = entry["weightLbs"] as? String, let weightValue = Double(weightString) {
                    entry["weightLbs"] = Double(round(weightValue * 10) / 10)
                }
                if let hrString = entry["restingHeartRate"] as? String, let hrValue = Double(hrString) {
                    entry["restingHeartRate"] = Double(round(hrValue * 10) / 10)
                }
                return entry
            }

            call.resolve(["entries": entries])
        }
    }
}