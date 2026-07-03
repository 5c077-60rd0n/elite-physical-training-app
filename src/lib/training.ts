import {
  cardioRecoveryPool,
  intervalTemplates,
  lowerRecoveryPool,
  movementCatalog,
  slamBallRecovery,
  strengthDayTemplates,
  upperRecoveryPool,
  weeklyFlow,
} from '../data/catalog';
import { addDays, startOfWeek, toIsoDate, weekSeedFor } from './date';
import type {
  CardioSession,
  DayPlan,
  PatternId,
  RecoveryBlock,
  StrengthExercise,
  StrengthSession,
  StrengthTemplateId,
  SupplementSlotPlan,
} from '../types';

const compoundPatterns = new Set<PatternId>([
  'horizontalPush',
  'horizontalPull',
  'verticalPush',
  'verticalPull',
  'squat',
  'hinge',
  'inclinePush',
  'quadEmphasis',
  'hingeVariation',
]);

const supportPatterns = new Set<PatternId>(['glutes', 'singleLeg', 'arms', 'calves']);

function schemeFor(pattern: PatternId, seed: number) {
  if (pattern === 'core') {
    const coreSchemes = [
      { sets: '3', reps: '8-10 controlled reps', rest: '30 sec' },
      { sets: '3', reps: '30-40 sec hold', rest: '30 sec' },
      { sets: '4', reps: '6-8 reps per side', rest: '20 sec' },
    ];
    return coreSchemes[seed % coreSchemes.length];
  }

  if (supportPatterns.has(pattern)) {
    const supportSchemes = [
      { sets: '3', reps: '10-12 reps', rest: '45 sec' },
      { sets: '3', reps: '12-15 reps', rest: '45 sec' },
      { sets: '4', reps: '8-10 reps', rest: '60 sec' },
    ];
    return supportSchemes[seed % supportSchemes.length];
  }

  if (compoundPatterns.has(pattern)) {
    const compoundSchemes = [
      { sets: '4', reps: '6-8 reps', rest: '90 sec' },
      { sets: '3', reps: '8-10 reps', rest: '75 sec' },
      { sets: '4', reps: '10-12 reps', rest: '60 sec' },
    ];
    return compoundSchemes[seed % compoundSchemes.length];
  }

  return { sets: '3', reps: '10-12 reps', rest: '45 sec' };
}

function buildStrengthSession(templateId: StrengthTemplateId, weekSeed: number): StrengthSession {
  const template = strengthDayTemplates[templateId];
  const exercises: StrengthExercise[] = template.emphasis.map((entry, index) => {
    const options = movementCatalog[entry.pattern];
    const choice = options[(weekSeed + template.rotationOffset + index) % options.length];
    const scheme = schemeFor(entry.pattern, weekSeed + index + template.rotationOffset);

    return {
      id: `${templateId}-${entry.pattern}-${index}`,
      pattern: entry.label,
      exercise: choice.name,
      equipment: choice.equipment,
      sets: scheme.sets,
      reps: scheme.reps,
      rest: scheme.rest,
      focus: choice.setup,
    };
  });

  return {
    kind: 'strength',
    templateId,
    title: template.title,
    patterns: template.emphasis.map((entry) => entry.label),
    exercises,
    coaching: template.coaching,
    durationMinutes: 58,
  };
}

function buildCardioSession(templateId: 'zone2' | 'optionalZone2' | 'intervals', weekSeed: number): CardioSession {
  if (templateId === 'intervals') {
    const template = intervalTemplates[weekSeed % intervalTemplates.length];
    return {
      kind: 'cardio',
      templateId,
      title: 'Interval Treadmill Cardio',
      templateName: template.name,
      durationMinutes: template.durationMinutes,
      intensity: 'High-quality speed surges with full recovery control.',
      details: template.details,
      optional: false,
      coaching: template.coaching,
    };
  }

  const zone2Durations = templateId === 'optionalZone2' ? [25, 30, 35] : [30, 35, 40, 45];
  const durationMinutes = zone2Durations[weekSeed % zone2Durations.length];
  const inclineNotes = [
    'Keep the pace conversational with a relaxed nasal breathing rhythm.',
    'Add a gentle incline for 5-minute blocks if you want more load without chasing speed.',
    'Settle into a pace you could repeat tomorrow without residual fatigue.',
  ];

  return {
    kind: 'cardio',
    templateId,
    title: templateId === 'optionalZone2' ? 'Optional Light Zone 2' : 'Zone 2 Treadmill Cardio',
    templateName: 'Treadmill Zone 2 base run',
    durationMinutes,
    intensity: 'Easy aerobic pace with even breathing and smooth mechanics.',
    details: [
      `Run or brisk-walk for ${durationMinutes} minutes at an easy effort.`,
      inclineNotes[weekSeed % inclineNotes.length],
      'Finish with a 2-minute cooldown walk before recovery work.',
    ],
    optional: templateId === 'optionalZone2',
    coaching: 'Stay disciplined on effort. Zone 2 only works if the pace remains genuinely easy.',
  };
}

function buildSupplements(isStrengthDay: boolean): SupplementSlotPlan[] {
  const plan: SupplementSlotPlan[] = [
    {
      slot: 'morning',
      label: 'Morning',
      items: [
        { name: 'Creatine' },
        { name: 'Caffeine', optional: true, note: 'Use only if energy or training timing calls for it.' },
        { name: 'Green tea extract' },
        { name: 'Omega-3' },
      ],
    },
  ];

  if (isStrengthDay) {
    plan.push({
      slot: 'preWorkout',
      label: 'Pre-workout',
      items: [
        { name: 'Caffeine', optional: true, note: 'Skip if the morning dose already covered it or if training late.' },
        { name: 'Creatine', note: 'Use here only if it was not taken earlier.' },
      ],
    });
  }

  plan.push({
    slot: 'postWorkout',
    label: 'Post-workout',
    items: [
      { name: 'Protein shake' },
      { name: 'Electrolytes', optional: true, note: 'Useful after sweaty sessions or treadmill intervals.' },
    ],
  });

  plan.push({
    slot: 'evening',
    label: 'Evening',
    items: [{ name: 'Magnesium glycinate' }],
  });

  return plan;
}

function selectRecovery(pool: RecoveryBlock[], weekSeed: number) {
  return [pool[weekSeed % pool.length], pool[(weekSeed + 1) % pool.length], slamBallRecovery];
}

function buildRecovery(sessionLabel: string, weekSeed: number) {
  if (sessionLabel.includes('Upper')) {
    return selectRecovery(upperRecoveryPool, weekSeed);
  }

  if (sessionLabel.includes('Lower')) {
    return selectRecovery(lowerRecoveryPool, weekSeed);
  }

  return selectRecovery(cardioRecoveryPool, weekSeed);
}

export function buildWeekPlan(anchorDate: Date): DayPlan[] {
  const weekStart = startOfWeek(anchorDate);
  const weekSeed = weekSeedFor(anchorDate);

  return weeklyFlow.map((entry, index) => {
    const date = addDays(weekStart, index);
    const session =
      entry.type === 'strength'
        ? buildStrengthSession(entry.templateId as StrengthTemplateId, weekSeed + index)
        : buildCardioSession(entry.templateId as 'zone2' | 'optionalZone2' | 'intervals', weekSeed + index);

    return {
      dateIso: toIsoDate(date),
      dayName: entry.dayName,
      sessionLabel: entry.sessionLabel,
      session,
      supplements: buildSupplements(entry.type === 'strength'),
      recovery: buildRecovery(entry.sessionLabel, weekSeed + index),
    };
  });
}