import { sciencePrinciples, trainingPhases, weeklyFocuses } from '../data/science';
import { todayIso } from './date';
import type { BodyMetricEntry, DayPlan, NutritionTargets, ProgramSnapshot, SessionSegment, TrainingPhase, UserProfile } from '../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getTrainingPhases() {
  return trainingPhases;
}

export function getSciencePrinciples() {
  return sciencePrinciples;
}

export function getCurrentWeek(profile: UserProfile, anchorDate = todayIso()) {
  const start = new Date(`${profile.programStartDate}T00:00:00`);
  const anchor = new Date(`${anchorDate}T00:00:00`);
  const elapsedDays = Math.max(0, Math.floor((anchor.getTime() - start.getTime()) / MS_PER_DAY));
  return (Math.floor(elapsedDays / 7) % 12) + 1;
}

export function getCurrentPhase(week: number): TrainingPhase {
  return trainingPhases.find((phase) => week >= phase.weekRange[0] && week <= phase.weekRange[1]) ?? trainingPhases[0];
}

export function getWeeklyFocus(week: number) {
  return weeklyFocuses.find((entry) => entry.week === week) ?? weeklyFocuses[0];
}

export function getLatestBodyMetric(bodyMetrics: BodyMetricEntry[]) {
  return [...bodyMetrics].sort((left, right) => right.date.localeCompare(left.date))[0] ?? null;
}

function getActivityMultiplier(activityLevel: UserProfile['activityLevel']) {
  return {
    sedentary: 1.2,
    light: 1.35,
    moderate: 1.5,
    high: 1.7,
  }[activityLevel];
}

function estimateMaintenanceCalories(profile: UserProfile, latestMetric: BodyMetricEntry) {
  const weightKg = latestMetric.weightLbs * 0.453592;
  const heightCm = profile.heightInches * 2.54;
  const sexAdjustment = profile.biologicalSex === 'male' ? 5 : -161;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * profile.age + sexAdjustment;
  return Math.round(bmr * getActivityMultiplier(profile.activityLevel));
}

export function buildNutritionTargets(profile: UserProfile, day: DayPlan, latestMetric: BodyMetricEntry | null): NutritionTargets | null {
  if (!latestMetric?.weightLbs) {
    return null;
  }

  const maintenance = estimateMaintenanceCalories(profile, latestMetric);
  const proteinLow = Math.round(latestMetric.weightLbs * 0.8);
  const proteinHigh = Math.round(latestMetric.weightLbs * 1.0);
  const strengthDay = day.session.kind === 'strength';
  const calorieLow = Math.round(maintenance * (strengthDay ? 0.84 : 0.78));
  const calorieHigh = Math.round(maintenance * (strengthDay ? 0.9 : 0.84));
  const carbLow = Math.round(latestMetric.weightLbs * (strengthDay ? 1.0 : 0.7));
  const carbHigh = Math.round(latestMetric.weightLbs * (strengthDay ? 1.35 : 0.95));
  const fatLow = Math.round(latestMetric.weightLbs * 0.3);
  const fatHigh = Math.round(latestMetric.weightLbs * 0.4);
  const fiberTarget = Math.max(25, Math.round(latestMetric.weightLbs * 0.14));
  const steps = strengthDay ? '8,000-10,000 steps' : '10,000-12,000 steps';

  return {
    maintenanceCalories: `${maintenance} kcal`,
    calories: `${calorieLow}-${calorieHigh} kcal`,
    proteinGrams: `${proteinLow}-${proteinHigh} g`,
    carbs: `${carbLow}-${carbHigh} g`,
    fats: `${fatLow}-${fatHigh} g`,
    fiberGrams: `${fiberTarget}+ g`,
    stepTarget: steps,
    mealTiming: strengthDay
      ? [
          { label: 'Morning', guidance: 'Protein-forward breakfast with hydration and creatine.' },
          { label: 'Pre-training', guidance: 'Protein plus easy carbs 60-120 minutes before lifting if appetite allows.' },
          { label: 'Post-training', guidance: 'Protein shake or meal within a few hours to support recovery and lean-mass retention.' },
          { label: 'Evening', guidance: 'High-satiety dinner with fiber and magnesium routine to support adherence and sleep.' },
        ]
      : [
          { label: 'Morning', guidance: 'Protein-forward breakfast, hydration, and steady caffeine use if desired.' },
          { label: 'Cardio window', guidance: 'Keep cardio easy; carbs are optional unless the run is interval-based or appetite is low.' },
          { label: 'Midday', guidance: 'Use a high-fiber meal to manage hunger through the afternoon.' },
          { label: 'Evening', guidance: 'Finish with protein, vegetables, and a low-friction meal structure you can repeat.' },
        ],
    hydration: strengthDay ? '3-4 L fluid, plus electrolytes if sweat loss is high' : '3+ L fluid across the day',
    rationale: strengthDay
      ? 'Strength days hold a smaller deficit so training output and lean mass stay protected while body fat trends down.'
      : 'Cardio-focused days can run a slightly larger deficit while keeping protein high to support fat loss without compromising recovery.',
  };
}

function buildSegments(day: DayPlan, phaseName: string): SessionSegment[] {
  const prepBlock: SessionSegment = {
    id: `${day.dateIso}-prep`,
    name: 'Preparation',
    durationMinutes: 8,
    notes: 'Joint prep, light ramp-up sets, and breathing to match the day\'s demand.',
  };

  if (day.session.kind === 'cardio') {
    return [
      prepBlock,
      {
        id: `${day.dateIso}-aerobic`,
        name: 'Primary cardio block',
        durationMinutes: day.session.durationMinutes,
        notes: day.session.coaching,
      },
      {
        id: `${day.dateIso}-downshift`,
        name: 'Recovery and logging',
        durationMinutes: 10,
        notes: `Use phase guidance from ${phaseName} and log perceived exertion before finishing.`,
      },
    ];
  }

  return [
    prepBlock,
    {
      id: `${day.dateIso}-primary`,
      name: 'Primary strength block',
      durationMinutes: 32,
      notes: 'Prioritize the first two movement patterns while freshest. Keep technical reps crisp.',
    },
    {
      id: `${day.dateIso}-secondary`,
      name: 'Accessory and trunk work',
      durationMinutes: 18,
      notes: 'Use accessory work to accumulate high-quality volume without grinding.',
    },
    {
      id: `${day.dateIso}-review`,
      name: 'Recovery and review',
      durationMinutes: 10,
      notes: 'Complete recovery work, protein, hydration, and a short training note.',
    },
  ];
}

export function buildProgramSnapshot(profile: UserProfile, day: DayPlan, bodyMetrics: BodyMetricEntry[] = []): ProgramSnapshot {
  const week = getCurrentWeek(profile, day.dateIso);
  const phase = getCurrentPhase(week);
  const weeklyFocus = getWeeklyFocus(week);
  const latestMetric = getLatestBodyMetric(bodyMetrics);

  return {
    week,
    phase,
    weeklyFocus,
    todaySegments: buildSegments(day, phase.name),
    weeklyTargets: [
      'Maintain strength performance on the first two movement patterns while body weight trends down slowly.',
      'Complete at least one full Zone 2 session at true conversational pace to support fat loss without extra fatigue.',
      'Hit protein, hydration, sleep, and recovery targets on at least five days.',
    ],
    nutritionTargets: buildNutritionTargets(profile, day, latestMetric),
  };
}