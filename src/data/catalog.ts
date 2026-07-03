import type {
  ExerciseDefinition,
  PatternId,
  RecoveryBlock,
  StrengthTemplateId,
} from '../types';

export const weeklyFlow: Array<{
  dayName: string;
  sessionLabel: string;
  type: 'strength' | 'cardio';
  templateId: StrengthTemplateId | 'zone2' | 'optionalZone2' | 'intervals';
}> = [
  { dayName: 'Monday', sessionLabel: 'Upper Body A', type: 'strength', templateId: 'upperA' },
  { dayName: 'Tuesday', sessionLabel: 'Lower Body A', type: 'strength', templateId: 'lowerA' },
  {
    dayName: 'Wednesday',
    sessionLabel: 'Zone 2 Treadmill Cardio',
    type: 'cardio',
    templateId: 'zone2',
  },
  { dayName: 'Thursday', sessionLabel: 'Upper Body B', type: 'strength', templateId: 'upperB' },
  { dayName: 'Friday', sessionLabel: 'Lower Body B', type: 'strength', templateId: 'lowerB' },
  {
    dayName: 'Saturday',
    sessionLabel: 'Optional Light Zone 2',
    type: 'cardio',
    templateId: 'optionalZone2',
  },
  {
    dayName: 'Sunday',
    sessionLabel: 'Interval Treadmill Cardio',
    type: 'cardio',
    templateId: 'intervals',
  },
];

export const strengthDayTemplates: Record<
  StrengthTemplateId,
  {
    title: string;
    coaching: string;
    emphasis: Array<{ pattern: PatternId; label: string }>;
    rotationOffset: number;
  }
> = {
  upperA: {
    title: 'Upper Body A',
    coaching: 'Open with the two largest patterns, then tighten rest periods as you move into arms and core.',
    rotationOffset: 0,
    emphasis: [
      { pattern: 'horizontalPush', label: 'Horizontal push' },
      { pattern: 'horizontalPull', label: 'Horizontal pull' },
      { pattern: 'verticalPush', label: 'Vertical push' },
      { pattern: 'verticalPull', label: 'Vertical pull' },
      { pattern: 'arms', label: 'Arms' },
      { pattern: 'core', label: 'Core' },
    ],
  },
  lowerA: {
    title: 'Lower Body A',
    coaching: 'Keep the squat and hinge crisp, then finish with glutes, single-leg balance, and ankle work.',
    rotationOffset: 1,
    emphasis: [
      { pattern: 'squat', label: 'Squat pattern' },
      { pattern: 'hinge', label: 'Hinge pattern' },
      { pattern: 'glutes', label: 'Glutes' },
      { pattern: 'singleLeg', label: 'Single-leg' },
      { pattern: 'calves', label: 'Calves' },
      { pattern: 'core', label: 'Core' },
    ],
  },
  upperB: {
    title: 'Upper Body B',
    coaching: 'Lead with the incline pattern, then alternate pull and press angles to keep shoulders fresh.',
    rotationOffset: 2,
    emphasis: [
      { pattern: 'inclinePush', label: 'Incline push' },
      { pattern: 'verticalPull', label: 'Vertical pull' },
      { pattern: 'verticalPush', label: 'Vertical push' },
      { pattern: 'horizontalPull', label: 'Horizontal pull' },
      { pattern: 'arms', label: 'Arms' },
      { pattern: 'core', label: 'Core' },
    ],
  },
  lowerB: {
    title: 'Lower Body B',
    coaching: 'Bias knee flexion early, then use a second hinge and single-leg pattern to round out the week.',
    rotationOffset: 3,
    emphasis: [
      { pattern: 'quadEmphasis', label: 'Quad emphasis' },
      { pattern: 'hingeVariation', label: 'Hinge variation' },
      { pattern: 'glutes', label: 'Glutes' },
      { pattern: 'singleLeg', label: 'Single-leg' },
      { pattern: 'calves', label: 'Calves' },
      { pattern: 'core', label: 'Core' },
    ],
  },
};

export const movementCatalog: Record<PatternId, ExerciseDefinition[]> = {
  horizontalPush: [
    { name: 'Dumbbell bench press', equipment: ['Dumbbells', 'Flat bench'], setup: 'Drive shoulder blades into the bench and lower with a 2-second eccentric.' },
    { name: 'Neutral-grip dumbbell press', equipment: ['Dumbbells', 'Flat bench'], setup: 'Keep elbows at 45 degrees and pause briefly at the bottom.' },
    { name: 'Stability ball dumbbell chest press', equipment: ['Dumbbells', 'Stability ball'], setup: 'Brace glutes and keep ribcage down while pressing.' },
    { name: 'Band-resisted push-up', equipment: ['Resistance bands'], setup: 'Keep body line locked in and press fast through the top.' },
  ],
  horizontalPull: [
    { name: 'Bench-supported dumbbell row', equipment: ['Dumbbells', 'Flat bench'], setup: 'Pull elbow toward hip and pause at peak retraction.' },
    { name: 'Kettlebell gorilla row', equipment: ['Kettlebell'], setup: 'Hinge hard and avoid twisting through the torso.' },
    { name: 'Seated band row', equipment: ['Resistance bands'], setup: 'Lead with the elbows and finish with shoulder blades.' },
    { name: 'Chest-supported rear-delt row', equipment: ['Dumbbells', 'Flat bench'], setup: 'Use a slight flare to hit upper-back tissue.' },
  ],
  verticalPush: [
    { name: 'Half-kneeling single-arm dumbbell press', equipment: ['Dumbbells'], setup: 'Squeeze the down-side glute and press straight overhead.' },
    { name: 'Standing kettlebell push press', equipment: ['Kettlebell'], setup: 'Use a small leg dip and finish with a stacked lockout.' },
    { name: 'Seated dumbbell shoulder press', equipment: ['Dumbbells', 'Flat bench'], setup: 'Stay tall through the torso and finish biceps by the ears.' },
    { name: 'Band overhead press', equipment: ['Resistance bands'], setup: 'Keep tension on the band through the entire rep.' },
  ],
  verticalPull: [
    { name: 'Tall-kneeling band lat pulldown', equipment: ['Resistance bands'], setup: 'Drive elbows to pockets without arching the lower back.' },
    { name: 'Stability ball band pulldown', equipment: ['Resistance bands', 'Stability ball'], setup: 'Press forearms down and keep the ribcage heavy.' },
    { name: 'Straight-arm dumbbell pullover', equipment: ['Dumbbells', 'Flat bench'], setup: 'Lower only as far as the ribs stay down.' },
    { name: 'Half-kneeling band pulldown', equipment: ['Resistance bands'], setup: 'Pause at the bottom and resist the band on the way back up.' },
  ],
  arms: [
    { name: 'Alternating dumbbell hammer curl', equipment: ['Dumbbells'], setup: 'Keep shoulders quiet and squeeze at the top.' },
    { name: 'Band overhead triceps extension', equipment: ['Resistance bands'], setup: 'Lock ribs down and fully straighten the elbow.' },
    { name: 'Cross-body dumbbell curl', equipment: ['Dumbbells'], setup: 'Control the lowering phase to keep tension on the biceps.' },
    { name: 'Bench skull crusher', equipment: ['Dumbbells', 'Flat bench'], setup: 'Lower behind the head and finish elbows straight.' },
  ],
  core: [
    { name: 'Stability ball stir-the-pot', equipment: ['Stability ball'], setup: 'Move slowly and keep hips level through the circle.' },
    { name: 'Band dead bug pulldown', equipment: ['Resistance bands'], setup: 'Flatten the low back into the floor as legs extend.' },
    { name: 'Slam ball hollow hold', equipment: ['Slam ball'], setup: 'Reach long and breathe out fully every rep window.' },
    { name: 'Tall plank shoulder tap', equipment: ['Resistance bands'], setup: 'Widen the feet and minimize hip sway.' },
  ],
  squat: [
    { name: 'Goblet squat', equipment: ['Dumbbells'], setup: 'Sit between the hips and keep elbows inside the knees.' },
    { name: 'Double dumbbell front squat', equipment: ['Dumbbells'], setup: 'Keep elbows high and stay stacked over mid-foot.' },
    { name: 'Bench box squat', equipment: ['Dumbbells', 'Flat bench'], setup: 'Tap the bench lightly, then drive up with intent.' },
    { name: 'Kettlebell goblet squat with pause', equipment: ['Kettlebell'], setup: 'Own a full 2-second pause at the bottom.' },
  ],
  hinge: [
    { name: 'Dumbbell Romanian deadlift', equipment: ['Dumbbells'], setup: 'Push the hips back and keep the weights close to the legs.' },
    { name: 'Kettlebell swing', equipment: ['Kettlebell'], setup: 'Explode through the hips and let the bell float.' },
    { name: 'Kickstand dumbbell RDL', equipment: ['Dumbbells'], setup: 'Load the front leg while the back foot stays light.' },
    { name: 'Band-resisted hip hinge', equipment: ['Resistance bands'], setup: 'Pull the hips through hard and stand tall.' },
  ],
  glutes: [
    { name: 'Dumbbell hip thrust', equipment: ['Dumbbells', 'Flat bench'], setup: 'Pause at lockout with ribs down and glutes tight.' },
    { name: 'Banded glute bridge', equipment: ['Resistance bands'], setup: 'Push knees out and finish with full hip extension.' },
    { name: 'Stability ball hip lift', equipment: ['Stability ball'], setup: 'Keep the pelvis steady as the hips drive up.' },
    { name: 'Bench-supported frog pump', equipment: ['Flat bench'], setup: 'Short range is fine as long as the glutes stay on.' },
  ],
  singleLeg: [
    { name: 'Rear-foot-elevated split squat', equipment: ['Dumbbells', 'Flat bench'], setup: 'Let the front knee travel and keep torso slightly forward.' },
    { name: 'Reverse lunge', equipment: ['Dumbbells'], setup: 'Step back long enough to keep the front heel planted.' },
    { name: 'Single-leg Romanian deadlift', equipment: ['Dumbbells'], setup: 'Reach long through the back heel and stay square.' },
    { name: 'Stability ball-assisted skater squat', equipment: ['Stability ball'], setup: 'Use the ball for balance, not momentum.' },
  ],
  calves: [
    { name: 'Standing dumbbell calf raise', equipment: ['Dumbbells'], setup: 'Pause hard at the top and lower with control.' },
    { name: 'Seated dumbbell calf raise', equipment: ['Dumbbells', 'Flat bench'], setup: 'Drive knees down into the load and own the stretch.' },
    { name: 'Band-resisted ankle plantar flexion', equipment: ['Resistance bands'], setup: 'Move through a full smooth range on every rep.' },
    { name: 'Single-leg calf raise', equipment: ['Flat bench'], setup: 'Use the bench for balance and reach full heel drop.' },
  ],
  inclinePush: [
    { name: 'Feet-elevated push-up', equipment: ['Flat bench'], setup: 'Set hands under shoulders and keep the body rigid.' },
    { name: 'Stability ball incline dumbbell press', equipment: ['Dumbbells', 'Stability ball'], setup: 'Set the torso on a slight incline and press evenly.' },
    { name: 'Low-to-high band press', equipment: ['Resistance bands'], setup: 'Arc upward through the press to emphasize the upper chest.' },
    { name: 'Close-grip bench press', equipment: ['Dumbbells', 'Flat bench'], setup: 'Keep a narrow elbow path and finish with full lockout.' },
  ],
  quadEmphasis: [
    { name: 'Heel-dominant goblet squat', equipment: ['Dumbbells'], setup: 'Stay tall and let the knees travel forward under control.' },
    { name: '1.5-rep front squat', equipment: ['Dumbbells'], setup: 'Use the half-rep to keep constant quad tension.' },
    { name: 'Front-foot-elevated split squat', equipment: ['Dumbbells', 'Flat bench'], setup: 'Use a low edge and drive the front knee over the toes.' },
    { name: 'Cycling-stance kettlebell squat', equipment: ['Kettlebell'], setup: 'Use a narrow stance and stay upright throughout.' },
  ],
  hingeVariation: [
    { name: 'Dumbbell sumo Romanian deadlift', equipment: ['Dumbbells'], setup: 'Keep knees pushed out and load the inner thighs.' },
    { name: 'Single-arm kettlebell swing', equipment: ['Kettlebell'], setup: 'Stay square and snap through the hips.' },
    { name: 'Single-leg kickstand RDL', equipment: ['Dumbbells'], setup: 'Shift weight into the working heel and keep the shin vertical.' },
    { name: 'Band morning hinge', equipment: ['Resistance bands'], setup: 'Drive the upper back into the band while hinging.' },
  ],
};

export const intervalTemplates = [
  {
    name: '45 / 75 cruise intervals',
    durationMinutes: 26,
    details: ['6-minute warm-up walk-jog', '10 rounds of 45 seconds fast and 75 seconds easy', '4-minute cooldown'],
    coaching: 'Run the fast interval at a controlled 8 out of 10 so form never breaks.',
  },
  {
    name: '60 / 60 balanced intervals',
    durationMinutes: 24,
    details: ['5-minute warm-up', '9 rounds of 60 seconds fast and 60 seconds easy', '5-minute cooldown'],
    coaching: 'Use the recovery minute to fully reset breathing before the next hard effort.',
  },
  {
    name: 'Fartlek speed play',
    durationMinutes: 28,
    details: ['6-minute warm-up', 'Alternate 1 minute quick, 2 minutes easy for 6 rounds', 'Finish with 4 relaxed strides and a cooldown walk'],
    coaching: 'Keep the quick segments playful and responsive rather than all-out.',
  },
  {
    name: 'Progression run',
    durationMinutes: 30,
    details: ['10 minutes easy', '10 minutes moderate steady build', '5 minutes strong finish', '5 minutes cooldown'],
    coaching: 'Progress speed gradually and save the strongest rhythm for the final 5 minutes.',
  },
];

export const upperRecoveryPool: RecoveryBlock[] = [
  {
    title: 'T-spine opener',
    duration: '4 minutes',
    steps: ['Foam roll upper back for 60 seconds', 'Stability ball wall rollout for 8 controlled reps', 'Banded shoulder traction for 10 reps per side'],
  },
  {
    title: 'Shoulder reset',
    duration: '5 minutes',
    steps: ['Foam roll lats and rear shoulder for 45 seconds per side', 'Band pull-apart ladder for 12, 10, and 8 reps', 'Tall-kneeling breathing reset for 5 deep breaths'],
  },
  {
    title: 'Pressing cooldown',
    duration: '4 minutes',
    steps: ['Stability ball prayer stretch for 45 seconds', 'Band face pull for 12 reps', 'Forearm wall slide for 8 reps'],
  },
  {
    title: 'Neck and ribcage downshift',
    duration: '3 minutes',
    steps: ['Foam roll pec minor gently for 30 seconds per side', 'Supine 90-90 breathing on ball for 5 breaths', 'Band external rotation for 12 reps'],
  },
];

export const lowerRecoveryPool: RecoveryBlock[] = [
  {
    title: 'Lower-body flush',
    duration: '5 minutes',
    steps: ['Foam roll quads and glutes for 60 seconds each', 'Stability ball hamstring curl for 10 slow reps', 'Half-kneeling hip flexor reach for 30 seconds per side'],
  },
  {
    title: 'Ankle and calf reset',
    duration: '4 minutes',
    steps: ['Foam roll calves for 45 seconds per side', 'Band ankle mobilization for 10 rocks per side', 'Seated tibialis raises against the wall for 15 reps'],
  },
  {
    title: 'Posterior chain decompression',
    duration: '4 minutes',
    steps: ['Supine band hamstring floss for 8 reps per side', 'Stability ball adductor squeeze for 6 breaths', 'Glute bridge hold for 30 seconds'],
  },
  {
    title: 'Hip capsule restore',
    duration: '4 minutes',
    steps: ['90-90 hip switches for 8 reps', 'Foam roll TFL for 30 seconds per side', 'Band lateral walk for 12 steps each way'],
  },
];

export const cardioRecoveryPool: RecoveryBlock[] = [
  {
    title: 'Post-treadmill unload',
    duration: '4 minutes',
    steps: ['Foam roll calves for 45 seconds per side', 'Standing calf stretch against bench for 30 seconds per side', 'Deep nasal breathing walk for 2 minutes'],
  },
  {
    title: 'Stride reset',
    duration: '5 minutes',
    steps: ['Band ankle mobilization for 10 reps per side', 'Stability ball hamstring bridge for 8 reps', 'Thoracic rotation open-book for 6 reps per side'],
  },
  {
    title: 'Lower-leg recovery',
    duration: '4 minutes',
    steps: ['Foam roll arches and shins lightly for 30 seconds', 'Band-resisted dorsiflexion for 12 reps per side', 'Supine feet-on-ball breathing for 5 breaths'],
  },
];

export const slamBallRecovery: RecoveryBlock = {
  title: 'Optional slam ball finisher',
  duration: '3 to 6 minutes',
  optional: true,
  steps: ['Run 4 to 6 rounds of 8 crisp slam ball reps', 'Rest 30 to 45 seconds between rounds', 'Skip if legs are heavy or recovery is the priority today'],
};