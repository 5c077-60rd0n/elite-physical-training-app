const patternImageQueries: Record<string, string> = {
  horizontalPush: 'fitness,dumbbell,bench-press',
  horizontalPull: 'fitness,dumbbell,row',
  verticalPush: 'fitness,dumbbell,shoulder-press',
  verticalPull: 'fitness,lat-pulldown,back',
  arms: 'fitness,bicep-curl,triceps',
  core: 'fitness,core,plank',
  squat: 'fitness,goblet-squat,legs',
  hinge: 'fitness,romanian-deadlift',
  glutes: 'fitness,hip-thrust,glutes',
  singleLeg: 'fitness,split-squat,lunge',
  calves: 'fitness,calf-raise',
  inclinePush: 'fitness,incline-press,dumbbell',
  quadEmphasis: 'fitness,front-squat,quads',
  hingeVariation: 'fitness,kettlebell,hinge',
};

const exerciseOverrides: Array<{ includes: string; query: string }> = [
  { includes: 'bench press', query: 'fitness,dumbbell,bench-press' },
  { includes: 'bicep curl', query: 'fitness,bicep-curl,dumbbell' },
  { includes: 'bent over row', query: 'fitness,bent-over-row,dumbbell' },
  { includes: 'shoulder press', query: 'fitness,dumbbell,shoulder-press' },
  { includes: 'dumbbell fly', query: 'fitness,dumbbell,chest-fly' },
  { includes: 'superman', query: 'fitness,back-extension,core' },
  { includes: 'romanian deadlift', query: 'fitness,romanian-deadlift,dumbbell' },
  { includes: 'split squat', query: 'fitness,split-squat,dumbbell' },
  { includes: 'reverse lunge', query: 'fitness,reverse-lunge,dumbbell' },
  { includes: 'calf raise', query: 'fitness,calf-raise' },
  { includes: 'goblet squat', query: 'fitness,goblet-squat,dumbbell' },
  { includes: 'hip thrust', query: 'fitness,hip-thrust' },
  { includes: 'push-up', query: 'fitness,push-up' },
  { includes: 'plank', query: 'fitness,plank,core' },
  { includes: 'lat pulldown', query: 'fitness,lat-pulldown' },
  { includes: 'swing', query: 'fitness,kettlebell-swing' },
];

function toSourceImage(query: string, lock: number) {
  const encoded = query
    .split(',')
    .map((part) => encodeURIComponent(part.trim()))
    .join(',');
  return `https://source.unsplash.com/600x420/?${encoded}&sig=${lock}`;
}

export function getExerciseImageUrl(exerciseName: string, pattern?: string) {
  const normalized = exerciseName.toLowerCase();
  const override = exerciseOverrides.find((entry) => normalized.includes(entry.includes));
  const query = override?.query ?? (pattern ? patternImageQueries[pattern] : undefined) ?? 'fitness,workout,dumbbell';

  // Stable-ish image seed by exercise name length and char code sum.
  const hashSeed = Array.from(normalized).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 1000;
  return toSourceImage(query, hashSeed || 1);
}
