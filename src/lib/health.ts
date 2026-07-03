import type { BodyMetricEntry, HealthMetricEntry } from '../types';

type ReadinessBand = 'green' | 'amber' | 'red';

interface ReadinessScore {
  score: number;
  band: ReadinessBand;
  signals: string[];
}

export function parseAppleHealthExport(raw: string): HealthMetricEntry[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, 'application/xml');
  const records = Array.from(doc.getElementsByTagName('Record'));
  const byDate = new Map<string, HealthMetricEntry>();
  const restingHeartRateCounts = new Map<string, number>();

  records.forEach((record) => {
    const type = record.getAttribute('type');
    const value = Number(record.getAttribute('value'));
    const startDate = record.getAttribute('startDate');
    const endDate = record.getAttribute('endDate');
    if (!startDate) {
      return;
    }

    const date = startDate.slice(0, 10);
    const current = byDate.get(date) ?? { date, steps: 0, source: 'apple-health-import' as const };

    if (type === 'HKQuantityTypeIdentifierStepCount' && Number.isFinite(value)) {
      current.steps += Math.round(value);
    }

    if (type === 'HKQuantityTypeIdentifierBodyMass' && Number.isFinite(value)) {
      current.weightLbs = Number((value * 2.20462).toFixed(1));
    }

    if (type === 'HKQuantityTypeIdentifierActiveEnergyBurned' && Number.isFinite(value)) {
      current.activeEnergyKcal = Number(((current.activeEnergyKcal ?? 0) + value).toFixed(0));
    }

    if (type === 'HKQuantityTypeIdentifierRestingHeartRate' && Number.isFinite(value)) {
      const count = (restingHeartRateCounts.get(date) ?? 0) + 1;
      const prior = current.restingHeartRate ?? 0;
      current.restingHeartRate = Number(((prior * (count - 1) + value) / count).toFixed(1));
      restingHeartRateCounts.set(date, count);
    }

    if (type === 'HKCategoryTypeIdentifierSleepAnalysis' && endDate) {
      const categoryValue = record.getAttribute('value') ?? '';
      if (categoryValue.toLowerCase().includes('asleep')) {
        const durationMs = new Date(endDate).getTime() - new Date(startDate).getTime();
        if (Number.isFinite(durationMs) && durationMs > 0) {
          current.sleepHours = Number((((current.sleepHours ?? 0) + durationMs / 3_600_000)).toFixed(2));
        }
      }
    }

    byDate.set(date, current);
  });

  return [...byDate.values()].sort((left, right) => right.date.localeCompare(left.date));
}

export function mergeHealthWeightsIntoBodyMetrics(
  currentBodyMetrics: BodyMetricEntry[],
  importedHealthMetrics: HealthMetricEntry[],
): BodyMetricEntry[] {
  const byDate = new Map(currentBodyMetrics.map((entry) => [entry.date, entry]));

  importedHealthMetrics.forEach((entry) => {
    if (typeof entry.weightLbs !== 'number') {
      return;
    }

    const existing = byDate.get(entry.date);
    byDate.set(entry.date, {
      date: entry.date,
      weightLbs: entry.weightLbs,
      waistInches: existing?.waistInches ?? 0,
      note: existing?.note ? `${existing.note} | Weight refreshed from Apple Health` : 'Weight imported from Apple Health',
    });
  });

  return [...byDate.values()].sort((left, right) => right.date.localeCompare(left.date));
}

export function getRecoveryReadinessSummary(healthMetrics: HealthMetricEntry[], dateIso: string) {
  const today = healthMetrics.find((entry) => entry.date === dateIso);
  if (!today) {
    return null;
  }

  const baselineRhrValues = healthMetrics
    .filter((entry) => entry.date < dateIso && typeof entry.restingHeartRate === 'number')
    .slice(0, 7)
    .map((entry) => entry.restingHeartRate as number);

  const baselineRhr = baselineRhrValues.length
    ? baselineRhrValues.reduce((sum, value) => sum + value, 0) / baselineRhrValues.length
    : null;

  const notes: string[] = [];
  let readiness: ReadinessBand = 'green';

  if (typeof today.sleepHours === 'number') {
    if (today.sleepHours < 6.5) {
      readiness = 'red';
      notes.push(`Sleep was ${today.sleepHours.toFixed(1)} h, so keep expectations conservative.`);
    } else if (today.sleepHours < 7.5) {
      readiness = 'amber';
      notes.push(`Sleep was ${today.sleepHours.toFixed(1)} h, so prioritize execution quality.`);
    } else {
      notes.push(`Sleep was ${today.sleepHours.toFixed(1)} h, which supports normal training quality.`);
    }
  }

  if (typeof today.restingHeartRate === 'number' && baselineRhr !== null) {
    const delta = today.restingHeartRate - baselineRhr;
    if (delta >= 6) {
      readiness = 'red';
      notes.push(`Resting HR is ${delta.toFixed(1)} bpm above baseline, suggesting extra fatigue.`);
    } else if (delta >= 3) {
      readiness = 'amber';
      notes.push(`Resting HR is ${delta.toFixed(1)} bpm above baseline, so cap intensity if needed.`);
    } else {
      notes.push('Resting HR is near baseline.');
    }
  }

  if (typeof today.activeEnergyKcal === 'number') {
    notes.push(`Apple Health shows ${today.activeEnergyKcal} active kcal so far today.`);
  }

  const readinessScore = getReadinessScore(healthMetrics, dateIso);

  return {
    readiness,
    readinessScore,
    notes,
    today,
  };
}

export function getReadinessScore(healthMetrics: HealthMetricEntry[], dateIso: string): ReadinessScore | null {
  const today = healthMetrics.find((entry) => entry.date === dateIso);
  if (!today) {
    return null;
  }

  const baselineRhrValues = healthMetrics
    .filter((entry) => entry.date < dateIso && typeof entry.restingHeartRate === 'number')
    .slice(0, 7)
    .map((entry) => entry.restingHeartRate as number);
  const baselineSleepValues = healthMetrics
    .filter((entry) => entry.date < dateIso && typeof entry.sleepHours === 'number')
    .slice(0, 7)
    .map((entry) => entry.sleepHours as number);

  const baselineRhr = baselineRhrValues.length
    ? baselineRhrValues.reduce((sum, value) => sum + value, 0) / baselineRhrValues.length
    : null;
  const baselineSleep = baselineSleepValues.length
    ? baselineSleepValues.reduce((sum, value) => sum + value, 0) / baselineSleepValues.length
    : null;

  let score = 100;
  const signals: string[] = [];

  if (typeof today.sleepHours === 'number') {
    if (today.sleepHours < 6) {
      score -= 30;
      signals.push(`Low sleep (${today.sleepHours.toFixed(1)} h)`);
    } else if (today.sleepHours < 7) {
      score -= 16;
      signals.push(`Sub-target sleep (${today.sleepHours.toFixed(1)} h)`);
    } else if (today.sleepHours >= 7.5) {
      signals.push('Sleep duration supports normal output');
    }

    if (baselineSleep !== null) {
      const sleepDelta = today.sleepHours - baselineSleep;
      if (sleepDelta <= -1.2) {
        score -= 14;
        signals.push('Sleep dropped below personal baseline');
      }
    }
  }

  if (typeof today.restingHeartRate === 'number' && baselineRhr !== null) {
    const delta = today.restingHeartRate - baselineRhr;
    if (delta >= 7) {
      score -= 28;
      signals.push(`Resting HR high (+${delta.toFixed(1)} bpm)`);
    } else if (delta >= 4) {
      score -= 14;
      signals.push(`Resting HR elevated (+${delta.toFixed(1)} bpm)`);
    } else {
      signals.push('Resting HR is near baseline');
    }
  }

  if (typeof today.activeEnergyKcal === 'number') {
    if (today.activeEnergyKcal >= 900) {
      score -= 12;
      signals.push(`High recent output (${today.activeEnergyKcal} active kcal)`);
    } else if (today.activeEnergyKcal >= 700) {
      score -= 6;
      signals.push(`Moderate-high output (${today.activeEnergyKcal} active kcal)`);
    }
  }

  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const band: ReadinessBand = clamped >= 75 ? 'green' : clamped >= 55 ? 'amber' : 'red';
  return {
    score: clamped,
    band,
    signals,
  };
}

export function getReadinessGuidance(healthMetrics: HealthMetricEntry[], dateIso: string) {
  const readiness = getReadinessScore(healthMetrics, dateIso);
  if (!readiness) {
    return null;
  }

  if (readiness.band === 'green') {
    return {
      calorieAdjustment: 'Hold calorie target steady.',
      recoveryFocus: 'Normal recovery block. Keep breathing and mobility crisp.',
      trainingAdjustment: 'Run the full planned session. Keep RPE in the target lane.',
    };
  }

  if (readiness.band === 'amber') {
    return {
      calorieAdjustment: 'Keep calories stable; bias food quality and hydration.',
      recoveryFocus: 'Add 10-15 extra minutes of easy walking and early wind-down.',
      trainingAdjustment: 'Cap top sets at RPE 7-8 and remove one optional accessory.',
    };
  }

  return {
    calorieAdjustment: 'Avoid aggressive deficit today; keep protein high and eat at the top of your target range.',
    recoveryFocus: 'Prioritize sleep extension and low-intensity movement over intensity.',
    trainingAdjustment: 'Switch to recovery-focused session or cut volume by 25-35%.',
  };
}

export function getWeeklyRecoverySummary(healthMetrics: HealthMetricEntry[], dates: string[]) {
  const daily = dates
    .map((date) => ({ date, summary: getRecoveryReadinessSummary(healthMetrics, date) }))
    .filter((entry) => entry.summary !== null) as Array<{
    date: string;
    summary: NonNullable<ReturnType<typeof getRecoveryReadinessSummary>>;
  }>;

  const greenDays = daily.filter((entry) => entry.summary.readiness === 'green').length;
  const amberDays = daily.filter((entry) => entry.summary.readiness === 'amber').length;
  const redDays = daily.filter((entry) => entry.summary.readiness === 'red').length;

  return {
    greenDays,
    amberDays,
    redDays,
    loggedDays: daily.length,
    daily,
  };
}