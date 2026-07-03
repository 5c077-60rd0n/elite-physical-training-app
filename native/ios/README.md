# iOS Wrapper Scaffold

This folder documents the intended native wrapper path for true HealthKit integration.

Planned stack:
- Capacitor iOS shell around the existing React/Vite app
- HealthKit bridge plugin for steps, body mass, resting heart rate, active energy, and sleep duration
- Local sync into the existing web app stores so nutrition and recovery screens can use native data

Suggested next commands after installing Capacitor packages:
- `npm install @capacitor/core @capacitor/cli @capacitor/ios`
- `npx cap init`
- `npm run build`
- `npm run native:sync`
- `npm run native:open:ios`

Suggested plugin surface:
- `requestHealthPermissions()`
- `readStepCount(startDate, endDate)`
- `readBodyMass(startDate, endDate)`
- `readSleepAnalysis(startDate, endDate)`
- `readRestingHeartRate(startDate, endDate)`

Important limitation:
- The current web PWA cannot directly access HealthKit. This wrapper path is required for real Apple Health integration.