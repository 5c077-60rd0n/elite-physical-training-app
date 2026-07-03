import { todayIso } from './date';
import type { BodyMetricEntry, DayPlan, ProgressMap } from '../types';

export function getTrainingStreak(progress: ProgressMap) {
  let streak = 0;
  let cursor = new Date(`${todayIso()}T00:00:00`);

  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    if (!progress[iso]?.sessionComplete) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getCompletionRate(plan: DayPlan[], progress: ProgressMap) {
  const completed = plan.filter((day) => progress[day.dateIso]?.sessionComplete).length;
  return {
    completed,
    total: plan.length,
    percent: Math.round((completed / plan.length) * 100),
  };
}

export function getAverageRpe(progress: ProgressMap, plan: DayPlan[]) {
  const entries = plan.map((day) => progress[day.dateIso]).filter(Boolean);
  if (!entries.length) {
    return 0;
  }

  const total = entries.reduce((sum, entry) => sum + entry.rpe, 0);
  return Number((total / entries.length).toFixed(1));
}

export function getBodyMetricTrend(bodyMetrics: BodyMetricEntry[]) {
  const sorted = [...bodyMetrics].sort((left, right) => left.date.localeCompare(right.date));
  if (sorted.length < 2) {
    return null;
  }

  const first = sorted[0];
  const latest = sorted[sorted.length - 1];

  return {
    weightDelta: Number((latest.weightLbs - first.weightLbs).toFixed(1)),
    waistDelta: Number((latest.waistInches - first.waistInches).toFixed(1)),
    startDate: first.date,
    endDate: latest.date,
  };
}

export function getMovingAveragePoints(
  bodyMetrics: BodyMetricEntry[],
  field: 'weightLbs' | 'waistInches',
  windowSize = 3,
) {
  const sorted = [...bodyMetrics].sort((left, right) => left.date.localeCompare(right.date));
  return sorted.map((entry, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const slice = sorted.slice(start, index + 1);
    const average = slice.reduce((sum, item) => sum + item[field], 0) / slice.length;
    return {
      label: entry.date.slice(5),
      value: Number(average.toFixed(1)),
    };
  });
}

export function getBlockAverageComparisons(bodyMetrics: BodyMetricEntry[], blockSize = 7) {
  const sorted = [...bodyMetrics].sort((left, right) => left.date.localeCompare(right.date));
  if (!sorted.length) {
    return [];
  }

  const blocks: Array<{
    label: string;
    weightAvg: number;
    waistAvg: number;
    count: number;
  }> = [];

  for (let end = sorted.length; end > 0 && blocks.length < 3; end -= blockSize) {
    const start = Math.max(0, end - blockSize);
    const slice = sorted.slice(start, end);
    if (!slice.length) {
      continue;
    }

    const weightAvg = slice.reduce((sum, item) => sum + item.weightLbs, 0) / slice.length;
    const waistAvg = slice.reduce((sum, item) => sum + item.waistInches, 0) / slice.length;
    blocks.unshift({
      label: `${slice[0].date.slice(5)}-${slice[slice.length - 1].date.slice(5)}`,
      weightAvg: Number(weightAvg.toFixed(1)),
      waistAvg: Number(waistAvg.toFixed(1)),
      count: slice.length,
    });
  }

  return blocks;
}

export function getMonthOverMonthSummaries(bodyMetrics: BodyMetricEntry[], progress: ProgressMap) {
  const metricsByMonth = new Map<string, BodyMetricEntry[]>();
  bodyMetrics.forEach((entry) => {
    const month = entry.date.slice(0, 7);
    metricsByMonth.set(month, [...(metricsByMonth.get(month) ?? []), entry]);
  });

  const progressByMonth = new Map<string, Array<{ rpe: number; completed: boolean }>>();
  Object.entries(progress).forEach(([date, entry]) => {
    const month = date.slice(0, 7);
    progressByMonth.set(month, [...(progressByMonth.get(month) ?? []), { rpe: entry.rpe, completed: entry.sessionComplete }]);
  });

  return [...new Set([...metricsByMonth.keys(), ...progressByMonth.keys()])]
    .sort()
    .map((month, index, allMonths) => {
      const metrics = metricsByMonth.get(month) ?? [];
      const progressEntries = progressByMonth.get(month) ?? [];
      const avgWeight = metrics.length ? Number((metrics.reduce((sum, item) => sum + item.weightLbs, 0) / metrics.length).toFixed(1)) : null;
      const avgWaist = metrics.length ? Number((metrics.reduce((sum, item) => sum + item.waistInches, 0) / metrics.length).toFixed(1)) : null;
      const completedSessions = progressEntries.filter((entry) => entry.completed).length;
      const avgRpe = progressEntries.length ? Number((progressEntries.reduce((sum, item) => sum + item.rpe, 0) / progressEntries.length).toFixed(1)) : null;
      const previousMonth = index > 0 ? allMonths[index - 1] : null;
      const previousMetrics = previousMonth ? metricsByMonth.get(previousMonth) ?? [] : [];
      const previousWeight = previousMetrics.length ? Number((previousMetrics.reduce((sum, item) => sum + item.weightLbs, 0) / previousMetrics.length).toFixed(1)) : null;
      const previousWaist = previousMetrics.length ? Number((previousMetrics.reduce((sum, item) => sum + item.waistInches, 0) / previousMetrics.length).toFixed(1)) : null;

      return {
        month,
        avgWeight,
        avgWaist,
        completedSessions,
        avgRpe,
        weightDeltaFromPrior: avgWeight !== null && previousWeight !== null ? Number((avgWeight - previousWeight).toFixed(1)) : null,
        waistDeltaFromPrior: avgWaist !== null && previousWaist !== null ? Number((avgWaist - previousWaist).toFixed(1)) : null,
      };
    })
    .slice(-4);
}