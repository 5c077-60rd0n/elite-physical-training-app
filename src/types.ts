export type StrengthTemplateId = 'upperA' | 'lowerA' | 'upperB' | 'lowerB';
export type CardioTemplateId = 'zone2' | 'optionalZone2' | 'intervals';

export type PatternId =
  | 'horizontalPush'
  | 'horizontalPull'
  | 'verticalPush'
  | 'verticalPull'
  | 'arms'
  | 'core'
  | 'squat'
  | 'hinge'
  | 'glutes'
  | 'singleLeg'
  | 'calves'
  | 'inclinePush'
  | 'quadEmphasis'
  | 'hingeVariation';

export interface ExerciseDefinition {
  name: string;
  equipment: string[];
  setup: string;
}

export interface StrengthExercise {
  id: string;
  pattern: string;
  exercise: string;
  equipment: string[];
  sets: string;
  reps: string;
  rest: string;
  focus: string;
}

export interface StrengthSession {
  kind: 'strength';
  templateId: StrengthTemplateId;
  title: string;
  patterns: string[];
  exercises: StrengthExercise[];
  coaching: string;
  durationMinutes: number;
}

export interface CardioSession {
  kind: 'cardio';
  templateId: CardioTemplateId;
  title: string;
  templateName: string;
  durationMinutes: number;
  intensity: string;
  details: string[];
  optional: boolean;
  coaching: string;
}

export type WorkoutSession = StrengthSession | CardioSession;

export type SupplementSlot = 'morning' | 'preWorkout' | 'postWorkout' | 'evening';

export interface SupplementItem {
  name: string;
  optional?: boolean;
  note?: string;
}

export interface SupplementSlotPlan {
  slot: SupplementSlot;
  label: string;
  items: SupplementItem[];
}

export interface RecoveryBlock {
  title: string;
  duration: string;
  steps: string[];
  optional?: boolean;
}

export interface DayPlan {
  dateIso: string;
  dayName: string;
  sessionLabel: string;
  session: WorkoutSession;
  supplements: SupplementSlotPlan[];
  recovery: RecoveryBlock[];
}

export interface TrainingPhase {
  id: 1 | 2 | 3 | 4;
  name: string;
  weekRange: [number, number];
  goal: string;
  primaryAdaptations: string[];
  recoveryPriority: string;
}

export interface WeeklyFocus {
  week: number;
  phase: 1 | 2 | 3 | 4;
  theme: string;
  weeklyFocus: string;
  coachNote: string;
  evidenceNote: string;
}

export interface SciencePrinciple {
  title: string;
  summary: string;
  actions: string[];
}

export interface UserProfile {
  name: string;
  city: string;
  programStartDate: string;
  onboardingComplete: boolean;
  dailyReminderTime: string;
  reminderEnabled: boolean;
  preferredSessionWindow: 'early' | 'midday' | 'evening';
  biologicalSex: 'male' | 'female';
  age: number;
  heightInches: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'high';
  rewardSoundEnabled: boolean;
  rewardHapticsEnabled: boolean;
}

export interface BodyMetricEntry {
  date: string;
  weightLbs: number;
  waistInches: number;
  note: string;
}

export type PhotoCheckInView = 'front' | 'side' | 'back' | 'other';

export interface PhotoCheckIn {
  date: string;
  imageDataUrl: string;
  note: string;
  view?: PhotoCheckInView;
}

export interface HealthMetricEntry {
  date: string;
  steps: number;
  weightLbs?: number;
  activeEnergyKcal?: number;
  restingHeartRate?: number;
  sleepHours?: number;
  source: 'apple-health-import';
}

export interface NutritionTargets {
  maintenanceCalories: string;
  calories: string;
  proteinGrams: string;
  carbs: string;
  fats: string;
  fiberGrams: string;
  stepTarget: string;
  mealTiming: Array<{
    label: string;
    guidance: string;
  }>;
  hydration: string;
  rationale: string;
}

export interface SessionSegment {
  id: string;
  name: string;
  durationMinutes: number;
  notes: string;
}

export interface ProgramSnapshot {
  week: number;
  phase: TrainingPhase;
  weeklyFocus: WeeklyFocus;
  todaySegments: SessionSegment[];
  weeklyTargets: string[];
  nutritionTargets: NutritionTargets | null;
}

export interface QuestProgress {
  id: string;
  name: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
}

export interface GamificationSnapshot {
  totalXp: number;
  level: number;
  levelFloorXp: number;
  nextLevelXp: number;
  northStarQualitySessions: number;
  weeklyQuests: QuestProgress[];
  seasonTier: 'Bronze' | 'Silver' | 'Gold' | 'Elite';
  seasonScore: number;
  promotionGap: number;
  title: string;
  badges: string[];
  streakDays: number;
  latestRewardXp: number;
}

export interface ProgressEntry {
  sessionComplete: boolean;
  supplementsComplete: boolean;
  recoveryComplete: boolean;
  rpe: number;
  notes: string;
}

export type ProgressMap = Record<string, ProgressEntry>;