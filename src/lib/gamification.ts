import { getTrainingStreak } from './analytics';
import { getWeeklyRecoverySummary } from './health';
import { getReadinessScore } from './health';
import type { BodyMetricEntry, DayPlan, GamificationSnapshot, HealthMetricEntry, PhotoCheckIn, ProgressMap, QuestProgress } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;
const SEASON_DAYS = 28;

function levelFloor(level: number) {
  return 100 * level * level;
}

function levelFromXp(totalXp: number) {
  let level = 1;
  while (levelFloor(level + 1) <= totalXp) {
    level += 1;
  }

  return {
    level,
    floorXp: levelFloor(level),
    nextXp: levelFloor(level + 1),
  };
}

function getCurrentSeasonStart(now: Date) {
  const todayEpoch = Math.floor(now.getTime() / DAY_MS);
  const seasonStartEpoch = todayEpoch - (todayEpoch % SEASON_DAYS);
  return new Date(seasonStartEpoch * DAY_MS).toISOString().slice(0, 10);
}

function xpForEntry(entry: ProgressMap[string] | undefined) {
  if (!entry?.sessionComplete) {
    return 0;
  }

  let xp = 100;
  if (entry.supplementsComplete) xp += 20;
  if (entry.recoveryComplete) xp += 20;
  if (entry.notes.trim()) xp += 10;
  if (entry.rpe >= 6 && entry.rpe <= 8) xp += 15;
  return xp;
}

export function getSessionRewardPreview(entry: ProgressMap[string] | undefined) {
  const xp = xpForEntry(entry);
  const bonusTags: string[] = [];

  if (entry?.supplementsComplete) bonusTags.push('Supplements locked in');
  if (entry?.recoveryComplete) bonusTags.push('Recovery complete');
  if (entry?.notes.trim()) bonusTags.push('Journaled session');
  if (entry?.rpe && entry.rpe >= 6 && entry.rpe <= 8) bonusTags.push('Target RPE hit');

  return {
    xp,
    qualityLabel:
      entry?.sessionComplete
        ? bonusTags.length >= 3
          ? 'High-quality session'
          : 'Session logged'
        : 'Session incomplete',
    bonusTags,
  };
}

function getSeasonTier(score: number): { tier: 'Bronze' | 'Silver' | 'Gold' | 'Elite'; nextTarget?: number } {
  if (score >= 1800) return { tier: 'Elite' };
  if (score >= 1200) return { tier: 'Gold', nextTarget: 1800 };
  if (score >= 700) return { tier: 'Silver', nextTarget: 1200 };
  return { tier: 'Bronze', nextTarget: 700 };
}

function computeWeeklyQuests(
  weeklyDates: string[],
  progress: ProgressMap,
  plan: DayPlan[],
  bodyMetrics: BodyMetricEntry[],
  photoCheckIns: PhotoCheckIn[],
  healthMetrics: HealthMetricEntry[],
): QuestProgress[] {
  const sessionCount = weeklyDates.filter((date) => progress[date]?.sessionComplete).length;
  const recoveryCount = weeklyDates.filter((date) => progress[date]?.recoveryComplete).length;
  const cardioCount = plan.filter((day) => day.session.kind === 'cardio' && progress[day.dateIso]?.sessionComplete).length;
  const qualitySessions = weeklyDates.filter((date) => {
    const entry = progress[date];
    return Boolean(entry?.sessionComplete && entry.supplementsComplete && entry.recoveryComplete && entry.rpe >= 6 && entry.rpe <= 8);
  }).length;
  const metricCount = bodyMetrics.filter((entry) => weeklyDates.includes(entry.date)).length;
  const photoCount = photoCheckIns.filter((entry) => weeklyDates.includes(entry.date)).length;
  const stepDays = healthMetrics.filter((entry) => weeklyDates.includes(entry.date) && entry.steps >= 8000).length;
  const recoverySummary = getWeeklyRecoverySummary(healthMetrics, weeklyDates);
  const readinessDays = weeklyDates
    .map((date) => getReadinessScore(healthMetrics, date))
    .filter((entry): entry is NonNullable<ReturnType<typeof getReadinessScore>> => entry !== null);
  const goodReadinessDays = readinessDays.filter((entry) => entry.band !== 'red').length;
  const avgReadinessScore = readinessDays.length
    ? readinessDays.reduce((sum, entry) => sum + entry.score, 0) / readinessDays.length
    : 0;

  return [
    {
      id: 'quality-4',
      name: 'Quality Week',
      description: 'Complete 4 quality sessions this week',
      progress: qualitySessions,
      target: 4,
      completed: qualitySessions >= 4,
    },
    {
      id: 'recovery-5',
      name: 'Recovery Keeper',
      description: 'Finish 5 recovery blocks this week',
      progress: recoveryCount,
      target: 5,
      completed: recoveryCount >= 5,
    },
    {
      id: 'cardio-3',
      name: 'Engine Builder',
      description: 'Complete 3 cardio sessions this week',
      progress: cardioCount,
      target: 3,
      completed: cardioCount >= 3,
    },
    {
      id: 'track-3',
      name: 'Data Discipline',
      description: 'Log 2 body check-ins and 1 photo this week',
      progress: Math.min(3, metricCount + Math.min(1, photoCount)),
      target: 3,
      completed: metricCount >= 2 && photoCount >= 1,
    },
    {
      id: 'consistency-5',
      name: 'Consistency Star',
      description: 'Complete 5 planned sessions this week',
      progress: sessionCount,
      target: 5,
      completed: sessionCount >= 5,
    },
    {
      id: 'steps-4',
      name: 'Move The Needle',
      description: 'Hit 8,000+ steps on 4 days this week',
      progress: stepDays,
      target: 4,
      completed: stepDays >= 4,
    },
    {
      id: 'recovery-green-4',
      name: 'Recovery Reader',
      description: 'Log 4 green or amber readiness days this week',
      progress: recoverySummary.greenDays + recoverySummary.amberDays,
      target: 4,
      completed: recoverySummary.greenDays + recoverySummary.amberDays >= 4,
    },
    {
      id: 'readiness-avg-70',
      name: 'Readiness Manager',
      description: 'Average readiness score of 70+ across tracked days this week',
      progress: Math.round(avgReadinessScore),
      target: 70,
      completed: avgReadinessScore >= 70,
    },
    {
      id: 'no-red-5',
      name: 'Fatigue Governor',
      description: 'Stack 5 days this week outside the red readiness zone',
      progress: goodReadinessDays,
      target: 5,
      completed: goodReadinessDays >= 5,
    },
  ];
}

export function getGamificationSnapshot(
  plan: DayPlan[],
  progress: ProgressMap,
  bodyMetrics: BodyMetricEntry[],
  photoCheckIns: PhotoCheckIn[],
  healthMetrics: HealthMetricEntry[] = [],
  now = new Date(),
): GamificationSnapshot {
  const sortedDates = Object.keys(progress).sort();
  const completedDates = sortedDates.filter((date) => progress[date]?.sessionComplete);
  const totalXp = sortedDates.reduce((sum, date) => sum + xpForEntry(progress[date]), 0) + bodyMetrics.length * 15 + photoCheckIns.length * 20;
  const { level, floorXp, nextXp } = levelFromXp(totalXp);
  const weekDates = plan.map((day) => day.dateIso);
  const weeklyQuests = computeWeeklyQuests(weekDates, progress, plan, bodyMetrics, photoCheckIns, healthMetrics);
  const northStarQualitySessions = weeklyQuests.find((quest) => quest.id === 'quality-4')?.progress ?? 0;
  const weeklyStepDays = weeklyQuests.find((quest) => quest.id === 'steps-4')?.progress ?? 0;
  const weeklyRecoveryDays = weeklyQuests.find((quest) => quest.id === 'recovery-green-4')?.progress ?? 0;
  const seasonStart = getCurrentSeasonStart(now);
  const seasonDates = sortedDates.filter((date) => date >= seasonStart);
  const seasonHealth = healthMetrics.filter((entry) => entry.date >= seasonStart);
  const seasonReadiness = seasonDates
    .map((date) => getReadinessScore(healthMetrics, date))
    .filter((entry): entry is NonNullable<ReturnType<typeof getReadinessScore>> => entry !== null);
  const seasonReadinessBonus = seasonReadiness.length
    ? seasonReadiness.reduce((sum, entry) => sum + (entry.band === 'green' ? 12 : entry.band === 'amber' ? 6 : 0), 0)
    : 0;
  const seasonScore = Math.round(
    seasonDates.reduce((sum, date) => {
      const entry = progress[date];
      if (!entry?.sessionComplete) return sum;
      const qualityScore = entry.supplementsComplete && entry.recoveryComplete ? 80 : entry.recoveryComplete || entry.supplementsComplete ? 68 : 55;
      return sum + qualityScore * 1.2 + xpForEntry(entry) * 0.2;
    }, 0) + seasonHealth.reduce((sum, entry) => sum + Math.min(30, Math.floor(entry.steps / 1000)), 0) + seasonReadinessBonus,
  );
  const tier = getSeasonTier(seasonScore);
  const streakDays = getTrainingStreak(progress);
  const strengthCount = plan.filter((day) => day.session.kind === 'strength' && progress[day.dateIso]?.sessionComplete).length;
  const cardioCount = plan.filter((day) => day.session.kind === 'cardio' && progress[day.dateIso]?.sessionComplete).length;
  const title = strengthCount > cardioCount ? 'Muscle Guardian' : cardioCount > strengthCount ? 'Engine Builder' : 'Physical Climber';
  const badges = [
    streakDays >= 7 ? 'Week Streak' : '',
    northStarQualitySessions >= 4 ? 'Consistency Star' : '',
    weeklyStepDays >= 4 ? 'Movement Engine' : '',
    weeklyRecoveryDays >= 4 ? 'Recovery Reader' : '',
    seasonReadiness.length >= 7 && seasonReadiness.every((entry) => entry.band !== 'red') ? 'Fatigue Governor' : '',
    bodyMetrics.length >= 6 ? 'Data Operator' : '',
    photoCheckIns.length >= 3 ? 'Visual Auditor' : '',
    completedDates.length >= 30 ? 'Volume Grinder' : '',
  ].filter(Boolean);
  const latestRewardXp = completedDates.length ? xpForEntry(progress[completedDates[completedDates.length - 1]]) : 0;

  return {
    totalXp,
    level,
    levelFloorXp: floorXp,
    nextLevelXp: nextXp,
    northStarQualitySessions,
    weeklyQuests,
    seasonTier: tier.tier,
    seasonScore,
    promotionGap: Math.max(0, (tier.nextTarget ?? seasonScore) - seasonScore),
    title,
    badges,
    streakDays,
    latestRewardXp,
  };
}