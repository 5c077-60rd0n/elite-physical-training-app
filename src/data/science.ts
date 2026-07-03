import type { SciencePrinciple, TrainingPhase, WeeklyFocus } from '../types';

export const trainingPhases: TrainingPhase[] = [
  {
    id: 1,
    name: 'Capacity and Skill Base',
    weekRange: [1, 3],
    goal: 'Build training consistency, groove technique, and raise weekly energy expenditure without burying recovery.',
    primaryAdaptations: ['Motor learning', 'Connective tissue tolerance', 'Aerobic efficiency'],
    recoveryPriority: 'Keep effort at 2 to 3 reps in reserve, maintain daily steps, and avoid hunger spikes created by too much intensity too soon.',
  },
  {
    id: 2,
    name: 'Progressive Overload',
    weekRange: [4, 6],
    goal: 'Maintain or build lean mass with measurable rep or load progression while body fat trends down.',
    primaryAdaptations: ['Mechanical tension', 'Progressive overload', 'Work capacity'],
    recoveryPriority: 'Use protein distribution, carbohydrate timing, and hydration to support performance in a modest calorie deficit.',
  },
  {
    id: 3,
    name: 'Strength and Power Blend',
    weekRange: [7, 9],
    goal: 'Preserve strength output, keep muscle-recruiting intensity high, and use intervals to improve total energy turnover.',
    primaryAdaptations: ['Rate of force development', 'Neuromuscular efficiency', 'VO2 support'],
    recoveryPriority: 'Keep optional conditioning truly optional so the deficit does not erode lower-body training quality.',
  },
  {
    id: 4,
    name: 'Fatigue Management and Re-test',
    weekRange: [10, 12],
    goal: 'Reduce accumulated fatigue, protect lean mass, and use performance plus waist-weight trends to steer the next block.',
    primaryAdaptations: ['Fitness expression', 'Autoregulation', 'Recovery sensitivity'],
    recoveryPriority: 'Pull volume down, keep key lifts crisp, and emphasize sleep, walking, protein intake, and tissue work.',
  },
];

export const weeklyFocuses: WeeklyFocus[] = [
  { week: 1, phase: 1, theme: 'Baseline movement audit', weeklyFocus: 'Establish stable lifting patterns and a repeatable weekly calorie-burning rhythm.', coachNote: 'Own range first. Load is only useful once the pattern is repeatable.', evidenceNote: 'Motor learning improves when technical reps are repeated under manageable fatigue.' },
  { week: 2, phase: 1, theme: 'Volume tolerance', weeklyFocus: 'Build tolerance to four lifting days and two to three treadmill exposures without losing recovery control.', coachNote: 'Leave a couple reps in reserve and exit every session feeling capable of repeating it.', evidenceNote: 'Moderate volume with submaximal effort is effective for hypertrophy and sustainable adherence.' },
  { week: 3, phase: 1, theme: 'Aerobic base lock-in', weeklyFocus: 'Make Zone 2 automatic so weekly calorie expenditure rises without interfering with strength.', coachNote: 'If speech breaks down, the day is no longer Zone 2.', evidenceNote: 'Low-intensity aerobic work supports mitochondrial adaptations and recovery between harder efforts.' },
  { week: 4, phase: 2, theme: 'Rep progression', weeklyFocus: 'Progress reps while body weight trends down slowly enough to preserve performance.', coachNote: 'Beat last week by one clean rep, not by technical slop.', evidenceNote: 'Double-progression models improve overload without forcing premature load jumps.' },
  { week: 5, phase: 2, theme: 'Protein and sleep emphasis', weeklyFocus: 'Use protein distribution and sleep consistency to preserve lean mass during fat loss.', coachNote: 'Treat recovery inputs as part of the training plan, not separate from it.', evidenceNote: 'Adequate protein distribution and sleep duration materially affect hypertrophy retention and performance.' },
  { week: 6, phase: 2, theme: 'Threshold control', weeklyFocus: 'Keep interval work hard enough to matter but short enough that it does not flatten lifting quality.', coachNote: 'Fast is useful; smoked is not.', evidenceNote: 'High-intensity intervals are effective when intensity is balanced against recoverability.' },
  { week: 7, phase: 3, theme: 'Explosive intent', weeklyFocus: 'Preserve fast force production while maintaining the strength signals that help keep muscle on.', coachNote: 'Move the load with intent even when the weight is moderate.', evidenceNote: 'Intent to move quickly can improve neural drive even without maximal velocity tools.' },
  { week: 8, phase: 3, theme: 'Single-leg quality', weeklyFocus: 'Use unilateral work to keep lower-body training stimulus high without requiring excessive loading.', coachNote: 'Make stability the limiter, not ego.', evidenceNote: 'Single-leg training supports lower-body strength symmetry and balance demands.' },
  { week: 9, phase: 3, theme: 'Cardio efficiency', weeklyFocus: 'Let Sunday intervals sharpen pace while Wednesday preserves the aerobic base that helps fat-loss adherence.', coachNote: 'Differentiate easy from hard clearly.', evidenceNote: 'Polarized cardio distributions often outperform the gray-zone middle.' },
  { week: 10, phase: 4, theme: 'Volume trim', weeklyFocus: 'Reduce fluff work and protect the highest-return sets when fatigue or deficit pressure rises.', coachNote: 'Fresh beats fried during assessment weeks.', evidenceNote: 'Short deload periods can restore readiness without meaningful detraining.' },
  { week: 11, phase: 4, theme: 'Re-test and compare', weeklyFocus: 'Judge success by strength retention, cardio quality, and body-composition trend together.', coachNote: 'Compare to your own logs, not to idealized expectations.', evidenceNote: 'Performance review is strongest when tied to consistent tracking conditions.' },
  { week: 12, phase: 4, theme: 'Reset the next block', weeklyFocus: 'Keep the exercises, cardio dosing, and recovery habits that best reduced body fat without performance collapse.', coachNote: 'Keep what worked. Replace what stalled.', evidenceNote: 'Autoregulated programming improves long-term adherence and progression.' },
];

export const sciencePrinciples: SciencePrinciple[] = [
  {
    title: 'Fat loss works best with a modest deficit',
    summary: 'Body fat comes down most sustainably when calorie intake is reduced enough to create progress but not so aggressively that training quality and recovery fall apart.',
    actions: ['Aim for a slow weekly body-weight trend rather than crash loss.', 'Use treadmill work to increase expenditure, not to justify random food swings.', 'If strength and energy crater together, the deficit is likely too aggressive.'],
  },
  {
    title: 'Hypertrophy works best with repeatable volume',
    summary: 'Most lifters progress with roughly 10 to 20 challenging sets per muscle group per week when technique and recovery stay stable.',
    actions: ['Accumulate clean sets before adding load.', 'Keep 1 to 3 reps in reserve on most work.', 'Use the tracker to spot sessions where RPE rises without better output.'],
  },
  {
    title: 'Strength needs progressive overload plus intent',
    summary: 'Load, reps, density, or execution quality must improve over time for strength to continue moving.',
    actions: ['Add a rep before adding load when equipment jumps are large.', 'Move every concentric rep with intent.', 'Do not let accessory fatigue sabotage the first two patterns of the day.'],
  },
  {
    title: 'Protein helps preserve lean mass during dieting',
    summary: 'Higher protein intake distributed through the day supports satiety, recovery, and muscle retention when calories are reduced.',
    actions: ['Use the protein shake after training as an anchor, not an afterthought.', 'Include protein across three to four feedings if possible.', 'Pair hard training days with the most reliable protein intake.'],
  },
  {
    title: 'Zone 2 is easy on purpose',
    summary: 'Aerobic base work supports recovery and endurance only when it stays below the threshold where breathing and mechanics break down.',
    actions: ['Keep treadmill pace conversational.', 'Use incline sparingly as a load tool.', 'Finish feeling better than you started.'],
  },
  {
    title: 'Recovery inputs are training variables',
    summary: 'Sleep, protein intake, hydration, and total stress meaningfully change whether a hard session creates adaptation or just fatigue.',
    actions: ['Aim for regular sleep timing.', 'Use the supplement routine as a compliance anchor, not a shortcut.', 'Treat foam rolling and breathing work as readiness tools, not punishment.'],
  },
];