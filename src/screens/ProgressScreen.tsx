import { PageWrapper } from '../components/layout/PageWrapper';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SimpleTrendChart } from '../components/charts/SimpleTrendChart';
import { getAverageRpe, getBodyMetricTrend, getCompletionRate, getMovingAveragePoints } from '../lib/analytics';
import { todayIso } from '../lib/date';
import { getLatestBodyMetric } from '../lib/program';
import type { BodyMetricEntry, DayPlan, PhotoCheckIn, PhotoCheckInView, ProgressMap, UserProfile } from '../types';

type MuscleGroup = 'push' | 'pull' | 'legs';
type RecoveryView = 'results' | 'recovery';
type BodyView = 'front' | 'back';

interface ProgressScreenProps {
  plan: DayPlan[];
  progress: ProgressMap;
  profile: UserProfile;
  bodyMetrics: BodyMetricEntry[];
  onSaveMetric: (entry: BodyMetricEntry, previousDate?: string) => void;
  onDeleteMetric: (date: string) => void;
  photoCheckIns: PhotoCheckIn[];
  onSavePhotoCheckIn: (entry: PhotoCheckIn) => void;
  onUpdatePhotoCheckIn: (key: string, entry: PhotoCheckIn) => void;
  onDeletePhotoCheckIn: (key: string) => void;
}

function photoKey(entry: PhotoCheckIn) {
  return `${entry.date}-${entry.imageDataUrl.slice(0, 32)}`;
}

function parseSetCount(raw: string) {
  const match = raw.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function getMuscleGroup(pattern: string): MuscleGroup {
  const normalized = pattern.toLowerCase();
  if (normalized.includes('push') || normalized.includes('arms') || normalized.includes('incline')) {
    return 'push';
  }
  if (normalized.includes('pull') || normalized.includes('hinge')) {
    return 'pull';
  }
  return 'legs';
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getTrendMeta(values: number[]) {
  if (values.length < 2) {
    return { direction: 'flat' as const, label: 'stable' };
  }

  const delta = values[values.length - 1] - values[0];
  if (delta > 0.5) {
    return { direction: 'up' as const, label: 'rising' };
  }
  if (delta < -0.5) {
    return { direction: 'down' as const, label: 'dropping' };
  }

  return { direction: 'flat' as const, label: 'stable' };
}

function MiniSparkline({ values }: { values: number[] }) {
  if (!values.length) {
    return null;
  }

  const width = 120;
  const height = 34;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const path = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 8) - 4;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mini-sparkline" role="img" aria-label="Trend">
      <path d={path} fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BodyFocusMap({ view, push, pull, legs }: { view: BodyView; push: number; pull: number; legs: number }) {
  const pushActive = push > 0;
  const pullActive = pull > 0;
  const legsActive = legs > 0;

  if (view === 'front') {
    return (
      <svg viewBox="0 0 220 400" className="body-map" role="img" aria-label="Front body focus map">
        <path d="M110 14 C101 14 96 23 96 34 C96 44 102 52 110 52 C118 52 124 44 124 34 C124 23 118 14 110 14 Z" className="body-map-base" />
        <path d="M80 60 C88 53 98 52 110 52 C122 52 132 53 140 60 C147 67 149 78 147 92 C145 107 138 118 132 126 C126 134 122 145 122 156 L122 184 L98 184 L98 156 C98 145 94 134 88 126 C82 118 75 107 73 92 C71 78 73 67 80 60 Z" className="body-map-base" />
        <path d="M74 84 C66 86 61 94 60 105 C59 117 63 129 69 136 C75 143 80 149 84 155 L84 182 C76 178 69 171 64 164 C57 154 52 138 52 123 C52 108 58 93 70 86 Z" className="body-map-base" />
        <path d="M146 84 C154 86 159 94 160 105 C161 117 157 129 151 136 C145 143 140 149 136 155 L136 182 C144 178 151 171 156 164 C163 154 168 138 168 123 C168 108 162 93 150 86 Z" className="body-map-base" />
        <path d="M90 120 C96 114 103 112 110 112 C117 112 124 114 130 120 L126 142 C121 146 115 148 110 148 C105 148 99 146 94 142 Z" className={pushActive ? 'body-map-accent' : 'body-map-faded'} />
        <path d="M92 150 C98 146 103 146 110 146 C117 146 122 146 128 150 L126 176 C121 180 116 182 110 182 C104 182 99 180 94 176 Z" className={pushActive ? 'body-map-accent' : 'body-map-faded'} />
        <path d="M88 190 C95 186 102 185 110 185 C118 185 125 186 132 190 L130 224 C123 229 116 232 110 232 C104 232 97 229 90 224 Z" className={pushActive ? 'body-map-accent' : 'body-map-faded'} />
        <path d="M89 234 C84 244 82 258 82 279 C82 304 84 329 89 353 C92 367 96 374 102 381 C95 382 88 380 83 374 C78 368 74 357 71 341 C67 321 66 300 66 279 C66 257 68 241 74 229 Z" className={legsActive ? 'body-map-accent' : 'body-map-faded'} />
        <path d="M131 234 C136 244 138 258 138 279 C138 304 136 329 131 353 C128 367 124 374 118 381 C125 382 132 380 137 374 C142 368 146 357 149 341 C153 321 154 300 154 279 C154 257 152 241 146 229 Z" className={legsActive ? 'body-map-accent' : 'body-map-faded'} />
        <path d="M84 354 C90 350 95 350 102 354 C103 365 102 374 98 382 C93 392 86 394 79 390 C74 387 73 378 75 371 C77 363 80 358 84 354 Z" className="body-map-base" />
        <path d="M136 354 C130 350 125 350 118 354 C117 365 118 374 122 382 C127 392 134 394 141 390 C146 387 147 378 145 371 C143 363 140 358 136 354 Z" className="body-map-base" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 220 400" className="body-map" role="img" aria-label="Back body focus map">
      <path d="M110 14 C101 14 96 23 96 34 C96 44 102 52 110 52 C118 52 124 44 124 34 C124 23 118 14 110 14 Z" className="body-map-base" />
      <path d="M80 60 C88 54 98 52 110 52 C122 52 132 54 140 60 C148 67 150 80 147 96 C143 117 130 130 124 145 C122 151 122 157 122 166 L98 166 C98 157 98 151 96 145 C90 130 77 117 73 96 C70 80 72 67 80 60 Z" className="body-map-base" />
      <path d="M69 88 C61 92 56 103 56 118 C56 132 60 147 67 157 C71 163 76 170 82 176 L82 150 C77 141 72 132 70 120 C68 109 68 97 69 88 Z" className="body-map-base" />
      <path d="M151 88 C159 92 164 103 164 118 C164 132 160 147 153 157 C149 163 144 170 138 176 L138 150 C143 141 148 132 150 120 C152 109 152 97 151 88 Z" className="body-map-base" />
      <path d="M86 106 C94 100 101 98 110 98 C119 98 126 100 134 106 C131 124 125 138 118 150 C115 155 113 161 112 168 L108 168 C107 161 105 155 102 150 C95 138 89 124 86 106 Z" className={pullActive ? 'body-map-accent' : 'body-map-faded'} />
      <path d="M86 170 C92 166 99 164 110 164 C121 164 128 166 134 170 L131 198 C124 204 117 207 110 207 C103 207 96 204 89 198 Z" className={pullActive ? 'body-map-accent' : 'body-map-faded'} />
      <path d="M88 210 C84 222 82 240 82 266 C82 294 84 320 88 344 C91 360 95 370 101 378 C95 380 89 379 84 374 C79 369 75 360 72 346 C67 323 66 296 66 266 C66 237 68 218 74 204 Z" className={legsActive ? 'body-map-accent' : 'body-map-faded'} />
      <path d="M132 210 C136 222 138 240 138 266 C138 294 136 320 132 344 C129 360 125 370 119 378 C125 380 131 379 136 374 C141 369 145 360 148 346 C153 323 154 296 154 266 C154 237 152 218 146 204 Z" className={legsActive ? 'body-map-accent' : 'body-map-faded'} />
      <path d="M84 346 C90 342 96 342 101 346 C102 357 101 366 98 374 C94 385 86 388 80 384 C75 381 73 372 75 365 C76 357 79 351 84 346 Z" className="body-map-base" />
      <path d="M136 346 C130 342 124 342 119 346 C118 357 119 366 122 374 C126 385 134 388 140 384 C145 381 147 372 145 365 C144 357 141 351 136 346 Z" className="body-map-base" />
    </svg>
  );
}

export function ProgressScreen({ plan, progress, profile, bodyMetrics, onSaveMetric, onDeleteMetric, photoCheckIns, onSavePhotoCheckIn, onUpdatePhotoCheckIn, onDeletePhotoCheckIn }: ProgressScreenProps) {
  const [recoveryView, setRecoveryView] = useState<RecoveryView>('results');
  const [bodyView, setBodyView] = useState<BodyView>('front');
  const completion = getCompletionRate(plan, progress);
  const averageRpe = getAverageRpe(progress, plan);
  const completedDays = plan.filter((day) => progress[day.dateIso]?.sessionComplete);
  const latestMetric = getLatestBodyMetric(bodyMetrics);
  const trend = getBodyMetricTrend(bodyMetrics);
  const [metricDate, setMetricDate] = useState(todayIso());
  const [weightLbs, setWeightLbs] = useState(latestMetric?.weightLbs ? String(latestMetric.weightLbs) : '');
  const [waistInches, setWaistInches] = useState(latestMetric?.waistInches ? String(latestMetric.waistInches) : '');
  const [bodyFatPercent, setBodyFatPercent] = useState(latestMetric?.bodyFatPercent ? String(latestMetric.bodyFatPercent) : '');
  const [note, setNote] = useState('');
  const [editingMetricDate, setEditingMetricDate] = useState<string | null>(null);
  const [photoDate, setPhotoDate] = useState(todayIso());
  const [photoNote, setPhotoNote] = useState('');
  const [photoView, setPhotoView] = useState<PhotoCheckInView>('front');
  const [editingPhotoKey, setEditingPhotoKey] = useState<string | null>(null);
  const [editingPhotoDataUrl, setEditingPhotoDataUrl] = useState<string | null>(null);

  const sortedMetrics = useMemo(
    () => [...bodyMetrics].sort((left, right) => right.date.localeCompare(left.date)).slice(0, 6),
    [bodyMetrics],
  );
  const sortedPhotos = useMemo(
    () => [...photoCheckIns].sort((left, right) => right.date.localeCompare(left.date)).slice(0, 6),
    [photoCheckIns],
  );
  const weightPoints = useMemo(
    () => [...bodyMetrics].sort((left, right) => left.date.localeCompare(right.date)).slice(-6).map((entry) => ({ label: entry.date.slice(5), value: entry.weightLbs })),
    [bodyMetrics],
  );
  const waistPoints = useMemo(
    () => [...bodyMetrics].sort((left, right) => left.date.localeCompare(right.date)).slice(-6).map((entry) => ({ label: entry.date.slice(5), value: entry.waistInches })),
    [bodyMetrics],
  );
  const bodyFatPoints = useMemo(
    () => [...bodyMetrics]
      .sort((left, right) => left.date.localeCompare(right.date))
      .filter((entry) => typeof entry.bodyFatPercent === 'number')
      .slice(-6)
      .map((entry) => ({ label: entry.date.slice(5), value: entry.bodyFatPercent as number })),
    [bodyMetrics],
  );
  const weightMovingAveragePoints = useMemo(
    () => getMovingAveragePoints(bodyMetrics, 'weightLbs').slice(-6),
    [bodyMetrics],
  );
  const waistMovingAveragePoints = useMemo(
    () => getMovingAveragePoints(bodyMetrics, 'waistInches').slice(-6),
    [bodyMetrics],
  );
  const adherencePoints = useMemo(
    () => plan.map((day) => ({ label: day.dayName.slice(0, 3), value: progress[day.dateIso]?.sessionComplete ? 100 : 0 })),
    [plan, progress],
  );
  const rpePoints = useMemo(
    () => plan.filter((day) => progress[day.dateIso]).map((day) => ({ label: day.dayName.slice(0, 3), value: progress[day.dateIso].rpe })),
    [plan, progress],
  );

  const weeklySetSummary = useMemo(() => {
    const groups: Record<MuscleGroup, { targetSets: number; completedSets: number; formScores: number[]; trend: number[] }> = {
      push: { targetSets: 0, completedSets: 0, formScores: [], trend: [] },
      pull: { targetSets: 0, completedSets: 0, formScores: [], trend: [] },
      legs: { targetSets: 0, completedSets: 0, formScores: [], trend: [] },
    };

    plan.forEach((day) => {
      if (day.session.kind !== 'strength') {
        return;
      }

      day.session.exercises.forEach((exercise) => {
        const group = getMuscleGroup(exercise.pattern);
        groups[group].targetSets += parseSetCount(exercise.sets);
        const log = progress[day.dateIso]?.exerciseLogs?.[exercise.id];
        if (!log) {
          return;
        }
        groups[group].completedSets += log.setsCompleted;
        groups[group].formScores.push(log.formScore);
        groups[group].trend.push(log.loadLbs || 0);
      });
    });

    const totalTarget = groups.push.targetSets + groups.pull.targetSets + groups.legs.targetSets;
    const totalCompleted = groups.push.completedSets + groups.pull.completedSets + groups.legs.completedSets;
    const allFormScores = [...groups.push.formScores, ...groups.pull.formScores, ...groups.legs.formScores];
    const avgForm = allFormScores.length
      ? allFormScores.reduce((sum, value) => sum + value, 0) / allFormScores.length
      : 3;
    const completionRate = totalTarget > 0 ? totalCompleted / totalTarget : 0;
    const overallStrength = Math.round(clamp(35 + completionRate * 35 + ((avgForm - 1) / 4) * 30, 0, 100));

    return {
      groups,
      totalTarget,
      totalCompleted,
      completionPercent: Math.round(clamp(completionRate * 100, 0, 100)),
      overallStrength,
    };
  }, [plan, progress]);

  const weeklyGoalDays = 4;
  const calendarDays = useMemo(() => {
    const base = plan.map((day) => {
      const date = new Date(`${day.dateIso}T00:00:00`);
      const minutes = day.session.durationMinutes;
      return {
        iso: day.dateIso,
        label: day.dayName.slice(0, 2).toUpperCase(),
        dayOfMonth: date.getDate(),
        minutes,
        complete: Boolean(progress[day.dateIso]?.sessionComplete),
      };
    });
    return base;
  }, [plan, progress]);

  const weeklyCompletedDays = calendarDays.filter((day) => day.complete).length;

  function saveMetric() {
    const parsedWeight = Number(weightLbs);
    const parsedWaist = Number(waistInches);
    const parsedBodyFat = Number(bodyFatPercent);

    if (!Number.isFinite(parsedWeight) || !Number.isFinite(parsedWaist)) {
      return;
    }

    onSaveMetric({
      date: metricDate,
      weightLbs: parsedWeight,
      waistInches: parsedWaist,
      bodyFatPercent: Number.isFinite(parsedBodyFat) ? parsedBodyFat : undefined,
      note,
    }, editingMetricDate ?? undefined);
    setNote('');
    setEditingMetricDate(null);
  }

  function startMetricEdit(entry: BodyMetricEntry) {
    setEditingMetricDate(entry.date);
    setMetricDate(entry.date);
    setWeightLbs(String(entry.weightLbs));
    setWaistInches(String(entry.waistInches));
    setBodyFatPercent(typeof entry.bodyFatPercent === 'number' ? String(entry.bodyFatPercent) : '');
    setNote(entry.note);
  }

  function cancelMetricEdit() {
    setEditingMetricDate(null);
    setMetricDate(todayIso());
    setWeightLbs(latestMetric?.weightLbs ? String(latestMetric.weightLbs) : '');
    setWaistInches(latestMetric?.waistInches ? String(latestMetric.waistInches) : '');
    setBodyFatPercent(latestMetric?.bodyFatPercent ? String(latestMetric.bodyFatPercent) : '');
    setNote('');
  }

  function handlePhotoSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageDataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!imageDataUrl) {
        return;
      }

      onSavePhotoCheckIn({
        date: photoDate,
        imageDataUrl,
        note: photoNote,
        view: photoView,
      });
      setPhotoNote('');
      setPhotoView('front');
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  }

  function startPhotoEdit(entry: PhotoCheckIn) {
    setEditingPhotoKey(photoKey(entry));
    setEditingPhotoDataUrl(entry.imageDataUrl);
    setPhotoDate(entry.date);
    setPhotoNote(entry.note);
    setPhotoView(entry.view ?? 'other');
  }

  function savePhotoEdit() {
    if (!editingPhotoKey || !editingPhotoDataUrl) {
      return;
    }

    onUpdatePhotoCheckIn(editingPhotoKey, {
      date: photoDate,
      imageDataUrl: editingPhotoDataUrl,
      note: photoNote,
      view: photoView,
    });
    setEditingPhotoKey(null);
    setEditingPhotoDataUrl(null);
    setPhotoDate(todayIso());
    setPhotoNote('');
    setPhotoView('front');
  }

  function cancelPhotoEdit() {
    setEditingPhotoKey(null);
    setEditingPhotoDataUrl(null);
    setPhotoDate(todayIso());
    setPhotoNote('');
    setPhotoView('front');
  }

  function confirmDeleteMetric(date: string) {
    if (!window.confirm(`Delete body metric entry for ${date}?`)) {
      return;
    }

    onDeleteMetric(date);
  }

  function confirmDeletePhoto(key: string, view: PhotoCheckInView | undefined, date: string) {
    if (!window.confirm(`Delete ${view ?? 'photo'} check-in from ${date}?`)) {
      return;
    }

    onDeletePhotoCheckIn(key);
  }

  return (
    <PageWrapper
      title="Progress"
      eyebrow="Progress"
      description="Track adherence, perceived effort, and body-composition trends over the current week."
    >
      <section className="summary-strip three-col">
        <article className="summary-box">
          <span className="card-kicker">Completed</span>
          <strong>{completion.completed}/{completion.total}</strong>
        </article>
        <article className="summary-box">
          <span className="card-kicker">Adherence</span>
          <strong>{completion.percent}%</strong>
        </article>
        <article className="summary-box">
          <span className="card-kicker">Average RPE</span>
          <strong>{averageRpe || '0.0'}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="segmented-toggle" role="tablist" aria-label="Progress mode">
          <button type="button" className={recoveryView === 'results' ? 'segmented-toggle-button active' : 'segmented-toggle-button'} onClick={() => setRecoveryView('results')} role="tab" aria-selected={recoveryView === 'results'}>
            Results
          </button>
          <button type="button" className={recoveryView === 'recovery' ? 'segmented-toggle-button active' : 'segmented-toggle-button'} onClick={() => setRecoveryView('recovery')} role="tab" aria-selected={recoveryView === 'recovery'}>
            Recovery
          </button>
        </div>

        {recoveryView === 'results' ? (
          <div className="strength-overview">
            <div className="strength-score-head">
              <h2 className="section-title">Overall Strength</h2>
              <strong className="strength-score-value">{weeklySetSummary.overallStrength}</strong>
            </div>
            <div className="strength-bars" aria-hidden="true">
              {Array.from({ length: 10 }).map((_, index) => {
                const active = index < Math.round((weeklySetSummary.overallStrength / 100) * 10);
                return <span key={`bar-${index}`} className={active ? 'strength-bar active' : 'strength-bar'} />;
              })}
            </div>
            <div className="muscle-score-grid">
              {(['push', 'pull', 'legs'] as MuscleGroup[]).map((group) => {
                const entry = weeklySetSummary.groups[group];
                const ratio = entry.targetSets > 0 ? entry.completedSets / entry.targetSets : 0;
                const score = Math.round(clamp(ratio * 100, 0, 100));
                const trendMeta = getTrendMeta(entry.trend.slice(-6));
                return (
                  <article className="muscle-score-card" key={`score-${group}`}>
                    <div>
                      <div className="muscle-card-head">
                        <span className="card-kicker">{group === 'push' ? 'Push Muscles' : group === 'pull' ? 'Pull Muscles' : 'Leg Muscles'}</span>
                        <span className={`trend-badge ${trendMeta.direction}`}>{trendMeta.direction === 'up' ? '↗' : trendMeta.direction === 'down' ? '↘' : '→'}</span>
                      </div>
                      <h3 className="exercise-name">{score} mSTR</h3>
                      <p className="exercise-note">{entry.completedSets} / {entry.targetSets} sets · {trendMeta.label}</p>
                    </div>
                    <MiniSparkline values={entry.trend.slice(-6)} />
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="recovery-overview">
            <div className="summary-strip three-col">
              <article className="summary-box">
                <span className="card-kicker">Days Since Last Workout</span>
                <strong>{completion.completed ? Math.max(0, plan.length - completion.completed) : 3}</strong>
              </article>
              <article className="summary-box">
                <span className="card-kicker">Fresh Muscle Groups</span>
                <strong>{3}</strong>
              </article>
            </div>
            <div className="body-map-toggle-row">
              <button type="button" className={bodyView === 'front' ? 'segmented-toggle-button active' : 'segmented-toggle-button'} onClick={() => setBodyView('front')}>Front</button>
              <button type="button" className={bodyView === 'back' ? 'segmented-toggle-button active' : 'segmented-toggle-button'} onClick={() => setBodyView('back')}>Back</button>
            </div>
            <BodyFocusMap
              view={bodyView}
              push={weeklySetSummary.groups.push.completedSets}
              pull={weeklySetSummary.groups.pull.completedSets}
              legs={weeklySetSummary.groups.legs.completedSets}
            />
          </div>
        )}
      </section>

      <section className="panel">
        <header className="section-header">
          <div>
            <span className="panel-kicker">Weekly set targets</span>
            <h2 className="section-title">{weeklySetSummary.completionPercent}%</h2>
          </div>
        </header>
        <div className="summary-strip three-col">
          {(['push', 'pull', 'legs'] as MuscleGroup[]).map((group) => {
            const entry = weeklySetSummary.groups[group];
            const remaining = Math.max(0, entry.targetSets - entry.completedSets);
            return (
              <article className="summary-box" key={`target-${group}`}>
                <span className="card-kicker">{group === 'push' ? 'Push Muscles' : group === 'pull' ? 'Pull Muscles' : 'Leg Muscles'}</span>
                <strong>{entry.completedSets} / {entry.targetSets} sets</strong>
                <p className="exercise-note">{remaining} to go</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="summary-strip three-col">
        <article className="summary-box">
          <span className="card-kicker">Latest weight</span>
          <strong>{latestMetric ? `${latestMetric.weightLbs} lb` : 'Not logged'}</strong>
        </article>
        <article className="summary-box">
          <span className="card-kicker">Latest waist</span>
          <strong>{latestMetric ? `${latestMetric.waistInches} in` : 'Not logged'}</strong>
        </article>
        <article className="summary-box">
          <span className="card-kicker">Latest body fat</span>
          <strong>{latestMetric && typeof latestMetric.bodyFatPercent === 'number' ? `${latestMetric.bodyFatPercent}%` : 'Not logged'}</strong>
        </article>
      </section>

      <section className="summary-strip three-col">
        <article className="summary-box">
          <span className="card-kicker">Trend</span>
          <strong>{trend ? `${trend.weightDelta} lb · ${trend.waistDelta} in${typeof trend.bodyFatDelta === 'number' ? ` · ${trend.bodyFatDelta}%` : ''}` : 'Need 2 entries'}</strong>
        </article>
        <article className="summary-box">
          <span className="card-kicker">Weight average</span>
          <strong>{weightMovingAveragePoints.length ? `${weightMovingAveragePoints[weightMovingAveragePoints.length - 1].value} lb` : 'Need 3 entries'}</strong>
        </article>
        <article className="summary-box">
          <span className="card-kicker">Waist average</span>
          <strong>{waistMovingAveragePoints.length ? `${waistMovingAveragePoints[waistMovingAveragePoints.length - 1].value} in` : 'Need 3 entries'}</strong>
        </article>
        <article className="summary-box">
          <span className="card-kicker">Interpretation</span>
          <strong>{trend ? 'Compare averages before reacting to a single weigh-in.' : 'Start with two to three consistent check-ins.'}</strong>
        </article>
      </section>

      <section className="content-stack second-row">
        <section className="panel">
          <header className="section-header">
            <div>
              <span className="panel-kicker">Session log</span>
              <h2 className="section-title">Completed entries</h2>
            </div>
          </header>
          <div className="exercise-list">
            {completedDays.length ? completedDays.map((day) => (
              <article className="exercise-card" key={day.dateIso}>
                <span className="card-kicker">{day.dayName}</span>
                <h3 className="exercise-name">{day.sessionLabel}</h3>
                <p className="exercise-note">RPE {progress[day.dateIso].rpe} · {progress[day.dateIso].notes || 'No note logged.'}</p>
              </article>
            )) : <article className="exercise-card"><h3 className="exercise-name">No completed sessions yet</h3><p className="exercise-note">Use the Today screen to log the first session of the week.</p></article>}
          </div>
        </section>

        <section className="tracker-panel">
          <header className="tracker-header">
            <div>
              <span className="panel-kicker">Interpretation</span>
              <h2 className="tracker-title">What to watch</h2>
            </div>
          </header>
          <ul className="detail-list">
            <li>The best fat-loss weeks usually keep performance stable while adherence stays high.</li>
            <li>High RPE without better reps often signals fatigue rather than progress.</li>
            <li>Missing recovery blocks repeatedly usually shows up first on lower-body days.</li>
            <li>Zone 2 compliance supports Sunday interval quality more than adding random extra intensity.</li>
          </ul>
        </section>
      </section>

      <section className="panel log-style-panel">
        <header className="log-profile-head">
          <button type="button" className="round-icon-button" aria-label="Share progress">↥</button>
          <h2 className="section-title">{profile.name}</h2>
          <div className="log-profile-actions">
            <button type="button" className="round-icon-button" aria-label="Milestones">⌂</button>
            <button type="button" className="round-icon-button" aria-label="Settings">⚙</button>
          </div>
        </header>

        <div className="summary-strip three-col">
          <article className="summary-box">
            <span className="card-kicker">Workouts</span>
            <strong>{Object.keys(progress).filter((date) => progress[date]?.sessionComplete).length}</strong>
          </article>
          <article className="summary-box">
            <span className="card-kicker">Weekly goal</span>
            <strong>{weeklyCompletedDays}/{weeklyGoalDays} days</strong>
          </article>
          <article className="summary-box">
            <span className="card-kicker">Current streak</span>
            <strong>{Math.max(0, weeklyCompletedDays - 1)} weeks</strong>
          </article>
        </div>

        <article className="report-banner">
          <button type="button" className="report-banner-close" aria-label="Dismiss">×</button>
          <h3>Your Weekly Workout Report is ready!</h3>
          <p>See your week over week progress and updated muscle strength and volume.</p>
          <a href="#progress-charts" className="report-link">View Your Report</a>
        </article>

        <section className="calendar-strip">
          <header className="section-header">
            <h3 className="section-title">Calendar</h3>
            <span className="status-pill">{new Date().toLocaleString('en-US', { month: 'short' })}</span>
          </header>
          <div className="calendar-grid">
            {calendarDays.map((day) => (
              <article className={day.complete ? 'calendar-cell complete' : 'calendar-cell'} key={`cal-${day.iso}`}>
                <span className="card-kicker">{day.label}</span>
                <strong>{day.dayOfMonth}</strong>
                <p>{day.minutes}m</p>
              </article>
            ))}
          </div>
        </section>

        <section className="exercise-list">
          <header className="section-header">
            <h3 className="section-title">Past Workouts</h3>
          </header>
          {completedDays.slice(0, 3).map((day) => (
            <article className="exercise-card" key={`past-${day.dateIso}`}>
              <span className="card-kicker">{day.dayName}</span>
              <h4 className="exercise-name">{day.sessionLabel}</h4>
              <p className="exercise-note">{progress[day.dateIso]?.notes || 'No notes logged.'}</p>
            </article>
          ))}
        </section>

        <div className="workout-start-wrap log-start-wrap">
          <Link className="workout-start-button" to="/today">Start Workout</Link>
        </div>
      </section>

      <section className="content-stack second-row">
        <section className="panel">
          <div id="progress-charts" />
          <header className="section-header">
            <div>
              <span className="panel-kicker">Trend charts</span>
              <h2 className="section-title">Weekly visual signals</h2>
            </div>
          </header>
          <div className="chart-grid">
            <SimpleTrendChart title="Weight" points={weightPoints} colorClass="cyan" unit=" lb" />
            <SimpleTrendChart title="Weight moving average" points={weightMovingAveragePoints} colorClass="cyan" unit=" lb" />
            <SimpleTrendChart title="Waist" points={waistPoints} colorClass="gold" unit=" in" />
            <SimpleTrendChart title="Waist moving average" points={waistMovingAveragePoints} colorClass="gold" unit=" in" />
            <SimpleTrendChart title="Body fat" points={bodyFatPoints} colorClass="gold" unit="%" />
            <SimpleTrendChart title="Adherence" points={adherencePoints} colorClass="cyan" unit="%" />
            <SimpleTrendChart title="RPE" points={rpePoints} colorClass="gold" />
          </div>
        </section>

        <section className="tracker-panel">
          <header className="tracker-header">
            <div>
              <span className="panel-kicker">Photo check-ins</span>
              <h2 className="tracker-title">Visual consistency</h2>
            </div>
          </header>
          <div className="form-stack">
            <label className="field-label" htmlFor="photo-date">Photo date</label>
            <input id="photo-date" className="select-input" type="date" value={photoDate} onChange={(event) => setPhotoDate(event.target.value)} />
            <label className="field-label" htmlFor="photo-note">Note</label>
            <textarea id="photo-note" className="notes-field" value={photoNote} onChange={(event) => setPhotoNote(event.target.value)} placeholder="Front/side comparison, lighting, pump, travel week, etc." />
            <label className="field-label" htmlFor="photo-view">Photo angle</label>
            <select id="photo-view" className="select-input" value={photoView} onChange={(event) => setPhotoView(event.target.value as PhotoCheckInView)}>
              <option value="front">Front</option>
              <option value="side">Side</option>
              <option value="back">Back</option>
              <option value="other">Other</option>
            </select>
            {editingPhotoKey ? (
              <div className="cta-grid">
                <button className="install-button" onClick={savePhotoEdit}>Save photo details</button>
                <button className="secondary-action" onClick={cancelPhotoEdit}>Cancel</button>
              </div>
            ) : (
              <>
                <label className="secondary-action file-button" htmlFor="photo-file">Choose photo</label>
                <input id="photo-file" className="visually-hidden" type="file" accept="image/*" onChange={handlePhotoSelection} />
              </>
            )}
          </div>
          <div className="photo-grid">
            {sortedPhotos.length ? sortedPhotos.map((entry) => (
              <article className="photo-card" key={photoKey(entry)}>
                <img src={entry.imageDataUrl} alt={`Check-in from ${entry.date}`} className="photo-thumb" />
                <span className="card-kicker">{entry.date} · {(entry.view ?? 'other').toUpperCase()}</span>
                <p className="exercise-note">{entry.note || 'No note logged.'}</p>
                <div className="card-actions">
                  <button className="secondary-action compact-action" onClick={() => startPhotoEdit(entry)}>Edit</button>
                  <button className="secondary-action compact-action danger-action" onClick={() => confirmDeletePhoto(photoKey(entry), entry.view, entry.date)}>Delete</button>
                </div>
              </article>
            )) : <article className="exercise-card"><h3 className="exercise-name">No photo check-ins yet</h3><p className="exercise-note">Add periodic photos under similar lighting to compare body-composition change honestly.</p></article>}
          </div>
        </section>
      </section>

      <section className="content-stack second-row">
        <section className="panel form-stack">
          <header className="section-header">
            <div>
              <span className="panel-kicker">Body metrics</span>
              <h2 className="section-title">Log weight and waist</h2>
            </div>
          </header>
          <div className="metric-grid">
            <div>
              <label className="field-label" htmlFor="metric-date">Date</label>
              <input id="metric-date" className="select-input" type="date" value={metricDate} onChange={(event) => setMetricDate(event.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="metric-weight">Weight (lb)</label>
              <input id="metric-weight" className="select-input" type="number" inputMode="decimal" value={weightLbs} onChange={(event) => setWeightLbs(event.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="metric-waist">Waist (in)</label>
              <input id="metric-waist" className="select-input" type="number" inputMode="decimal" value={waistInches} onChange={(event) => setWaistInches(event.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="metric-bodyfat">Body fat (%)</label>
              <input id="metric-bodyfat" className="select-input" type="number" inputMode="decimal" value={bodyFatPercent} onChange={(event) => setBodyFatPercent(event.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="metric-note">Note</label>
            <textarea id="metric-note" className="notes-field" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Morning weigh-in, travel week, sodium swing, great sleep, etc." />
          </div>
          <div className="cta-grid single-action">
            <button className="install-button" onClick={saveMetric}>{editingMetricDate ? 'Update metric' : 'Save metric'}</button>
            {editingMetricDate ? <button className="secondary-action" onClick={cancelMetricEdit}>Cancel edit</button> : null}
          </div>
        </section>

        <section className="panel">
          <header className="section-header">
            <div>
              <span className="panel-kicker">Recent trend points</span>
              <h2 className="section-title">Latest check-ins</h2>
            </div>
          </header>
          <div className="exercise-list">
            {sortedMetrics.length ? sortedMetrics.map((entry) => (
              <article className="exercise-card" key={entry.date}>
                <span className="card-kicker">{entry.date}</span>
                <h3 className="exercise-name">{entry.weightLbs} lb · {entry.waistInches} in{typeof entry.bodyFatPercent === 'number' ? ` · ${entry.bodyFatPercent}%` : ''}</h3>
                <p className="exercise-note">{entry.note || 'No note logged.'}</p>
                <div className="card-actions">
                  <button className="secondary-action compact-action" onClick={() => startMetricEdit(entry)}>Edit</button>
                  <button className="secondary-action compact-action danger-action" onClick={() => confirmDeleteMetric(entry.date)}>Delete</button>
                </div>
              </article>
            )) : <article className="exercise-card"><h3 className="exercise-name">No body metrics yet</h3><p className="exercise-note">Log two or more check-ins to start comparing trend direction.</p></article>}
          </div>
        </section>
      </section>
    </PageWrapper>
  );
}