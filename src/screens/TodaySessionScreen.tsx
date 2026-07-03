import { useEffect, useRef, useState } from 'react';
import { Dashboard } from '../components/Dashboard';
import { PageWrapper } from '../components/layout/PageWrapper';
import { ProgressPanel } from '../components/ProgressPanel';
import { getSessionRewardPreview } from '../lib/gamification';
import { buildProgramSnapshot } from '../lib/program';
import { triggerRewardCue } from '../lib/rewardEffects';
import { createDefaultProgressEntry } from '../lib/storage';
import type { BodyMetricEntry, DayPlan, ExercisePerformanceLog, ProgressEntry, ProgressMap, UserProfile } from '../types';

interface TodaySessionScreenProps {
  day: DayPlan;
  entry: ProgressEntry;
  progress: ProgressMap;
  profile: UserProfile;
  bodyMetrics: BodyMetricEntry[];
  onChange: (partial: Partial<ProgressEntry>) => void;
  onExerciseLogChange: (exerciseId: string, partial: Partial<ExercisePerformanceLog>) => void;
}

function parseProgrammedValue(raw: string) {
  const match = raw.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function findPreviousLog(exerciseName: string, currentDate: string, progress: ProgressMap) {
  const dates = Object.keys(progress)
    .filter((date) => date < currentDate)
    .sort((left, right) => right.localeCompare(left));

  for (const date of dates) {
    const logs = progress[date]?.exerciseLogs ?? {};
    const previous = Object.values(logs).find((log) => log.exerciseName === exerciseName);
    if (previous) {
      return previous;
    }
  }

  return null;
}

function getProgressionHint(
  log: ExercisePerformanceLog | undefined,
  previousLog: ExercisePerformanceLog | null,
  programmedSets: number | null,
  programmedReps: number | null,
) {
  if (!log) {
    return 'Log this lift to unlock progression guidance.';
  }

  if (log.formScore <= 2) {
    return 'Form fell below target. Keep load steady or drop 5-10% and own technique next session.';
  }

  const hitSets = programmedSets === null || log.setsCompleted >= programmedSets;
  const hitReps = programmedReps === null || log.repsCompleted >= programmedReps;

  if (hitSets && hitReps && log.formScore >= 4) {
    return log.loadLbs > 0
      ? `Strong quality. Next time add ${Math.max(2.5, Math.round(log.loadLbs * 0.025 * 2) / 2)} lb if bar speed stays clean.`
      : 'Strong quality. Add a small load jump next session.';
  }

  if (previousLog && log.loadLbs > 0 && log.loadLbs > previousLog.loadLbs && log.formScore >= 3) {
    return 'Load increased versus last session. Keep the same load and add reps before jumping again.';
  }

  return 'Build consistency first: match prescribed sets/reps at clean form before adding load.';
}

function parseNumericTarget(raw: string) {
  const match = raw.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function getDisplayLoad(
  log: ExercisePerformanceLog | undefined,
  programmedSets: string,
  programmedReps: string,
) {
  if (log && log.loadLbs > 0) {
    return `${log.loadLbs} lb`;
  }

  return `${programmedSets} x ${programmedReps}`;
}

function getPatternBadge(pattern: string) {
  return pattern
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .slice(0, 2)
    .toUpperCase();
}

export function TodaySessionScreen({ day, entry, progress, profile, bodyMetrics, onChange, onExerciseLogChange }: TodaySessionScreenProps) {
  const snapshot = buildProgramSnapshot(profile, day, bodyMetrics);
  const progressEntry = entry ?? createDefaultProgressEntry();
  const strengthSession = day.session.kind === 'strength' ? day.session : null;
  const previousComplete = useRef(progressEntry.sessionComplete);
  const trackerSectionRef = useRef<HTMLElement | null>(null);
  const [celebration, setCelebration] = useState<{ xp: number; qualityLabel: string; bonusTags: string[] } | null>(null);
  const [warmupOffsetMinutes, setWarmupOffsetMinutes] = useState(2);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(strengthSession?.exercises[0]?.id ?? null);

  useEffect(() => {
    if (!previousComplete.current && progressEntry.sessionComplete) {
      const reward = getSessionRewardPreview(progressEntry);
      setCelebration(reward);
      triggerRewardCue({
        xpEarned: reward.xp,
        leveledUp: reward.xp >= 150,
        soundEnabled: profile.rewardSoundEnabled,
        hapticsEnabled: profile.rewardHapticsEnabled,
      });
      const timer = window.setTimeout(() => setCelebration(null), 4000);
      previousComplete.current = progressEntry.sessionComplete;
      return () => window.clearTimeout(timer);
    }

    previousComplete.current = progressEntry.sessionComplete;
    return undefined;
  }, [progressEntry, profile.rewardHapticsEnabled, profile.rewardSoundEnabled]);

  return (
    <PageWrapper
      title={day.sessionLabel}
      eyebrow="Today"
      description={`Week ${snapshot.week} · ${snapshot.phase.name} · body-fat reduction with lean-mass retention`}
    >
      {celebration ? (
        <section className="reward-toast" aria-live="polite">
          <p className="panel-kicker">Reward unlocked</p>
          <h2 className="section-title">+{celebration.xp} XP</h2>
          <p className="panel-subtitle">{celebration.qualityLabel}</p>
          {celebration.bonusTags.length ? (
            <div className="badge-row">
              {celebration.bonusTags.map((tag) => (
                <span key={tag} className="scan-tag">{tag}</span>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="content-stack">
        <Dashboard day={day} progress={progressEntry} enableRestTimer />
        <aside className="tracker-panel">
          <header className="tracker-header">
            <div>
              <span className="panel-kicker">Session structure</span>
              <h2 className="tracker-title">Evidence-based flow</h2>
            </div>
          </header>
          <div className="exercise-list">
            {snapshot.todaySegments.map((segment) => (
              <article className="exercise-card" key={segment.id}>
                <span className="card-kicker">{segment.durationMinutes} min</span>
                <h3 className="exercise-name">{segment.name}</h3>
                <p className="exercise-note">{segment.notes}</p>
              </article>
            ))}
          </div>
          {snapshot.nutritionTargets ? (
            <div className="summary-box nutrition-box">
              <span className="card-kicker">Fuel target</span>
              <strong>{snapshot.nutritionTargets.calories}</strong>
              <p className="exercise-note">Estimated maintenance: {snapshot.nutritionTargets.maintenanceCalories}</p>
              <p className="exercise-note">Protein: {snapshot.nutritionTargets.proteinGrams}</p>
              <p className="exercise-note">Carbs: {snapshot.nutritionTargets.carbs}</p>
              <p className="exercise-note">Fats: {snapshot.nutritionTargets.fats}</p>
              <p className="exercise-note">Hydration: {snapshot.nutritionTargets.hydration}</p>
              <p className="exercise-note">Manual metrics now drive this plan. Log body metrics and session output daily for tighter recommendations.</p>
            </div>
          ) : (
            <div className="summary-box nutrition-box">
              <span className="card-kicker">Fuel target</span>
              <strong>Log body weight in Progress to personalize calorie and protein guidance.</strong>
            </div>
          )}
        </aside>
      </section>

      <section className="content-stack second-row">
        <ProgressPanel day={day} entry={progressEntry} onChange={onChange} title="Log today" />
        <section className="panel">
          <header className="section-header">
            <div>
              <span className="panel-kicker">Coach note</span>
              <h2 className="section-title">{snapshot.weeklyFocus.theme}</h2>
            </div>
          </header>
          <p className="panel-subtitle">{snapshot.weeklyFocus.coachNote}</p>
          <div className="summary-box">
            <span className="card-kicker">Why it matters</span>
            <strong>{snapshot.weeklyFocus.evidenceNote}</strong>
          </div>
          <div className="summary-box">
            <span className="card-kicker">Recomp reminder</span>
            <strong>Keep lifting quality high. Cardio supports the deficit, but the strength work is what helps keep muscle on the way down.</strong>
          </div>
          <div className="summary-box">
            <span className="card-kicker">Movement adherence</span>
            <strong>Use Progress to log body-fat, weight, and workout quality; adjust cardio only after trend data confirms recovery is holding.</strong>
          </div>
        </section>
      </section>

      {strengthSession ? (
        <section className="panel workout-lane-panel">
          <header className="workout-lane-header">
            <div>
              <h2 className="workout-lane-title">Warm-up</h2>
            </div>
            <div className="workout-lane-time-control">
              <strong>+{warmupOffsetMinutes}m</strong>
              <div className="workout-lane-time-actions">
                <button
                  type="button"
                  className="secondary-action compact-action"
                  onClick={() => setWarmupOffsetMinutes((current) => Math.max(0, current - 1))}
                  aria-label="Decrease warm-up time"
                >
                  -
                </button>
                <button
                  type="button"
                  className="secondary-action compact-action"
                  onClick={() => setWarmupOffsetMinutes((current) => current + 1)}
                  aria-label="Increase warm-up time"
                >
                  +
                </button>
              </div>
            </div>
          </header>

          <div className="workout-lane-list" role="list" aria-label="Workout sequence">
            {strengthSession.exercises.map((exercise, index) => {
              const log = progressEntry.exerciseLogs[exercise.id];
              const programmedSets = parseNumericTarget(exercise.sets);
              const programmedReps = parseNumericTarget(exercise.reps);
              const completedSets = log?.setsCompleted ?? 0;
              const completedReps = log?.repsCompleted ?? 0;
              const completedTarget =
                (programmedSets === null || completedSets >= programmedSets)
                && (programmedReps === null || completedReps >= programmedReps)
                && Boolean(log);
              const isActive = activeExerciseId === exercise.id;

              return (
                <article
                  key={`lane-${exercise.id}`}
                  role="listitem"
                  className={isActive ? 'workout-lane-item active' : 'workout-lane-item'}
                  onClick={() => setActiveExerciseId(exercise.id)}
                >
                  <div className="workout-lane-rail" aria-hidden="true">
                    <div className="workout-lane-thumb">{index + 1}</div>
                    <div className="workout-lane-pattern">{getPatternBadge(exercise.pattern)}</div>
                    {index < strengthSession.exercises.length - 1 ? <span className="workout-lane-line" /> : null}
                  </div>

                  <div className="workout-lane-content">
                    <div className="workout-lane-meta">
                      <span className="workout-lane-kicker">{completedTarget ? 'Completed set target' : 'Focus exercise'}</span>
                      <button type="button" className="workout-lane-more" aria-label={`More options for ${exercise.exercise}`}>...</button>
                    </div>
                    <h3 className="workout-lane-name">{exercise.exercise}</h3>
                    <p className="workout-lane-stats">
                      {exercise.sets} sets · {exercise.reps} reps · {getDisplayLoad(log, exercise.sets, exercise.reps)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="workout-start-wrap">
            <button
              type="button"
              className="workout-start-button"
              onClick={() => trackerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              Start Workout
            </button>
          </div>
        </section>
      ) : null}

      {strengthSession ? (
        <section className="panel" ref={trackerSectionRef}>
          <header className="section-header">
            <div>
              <span className="panel-kicker">Lift tracker</span>
              <h2 className="section-title">Sets, reps, load, form</h2>
            </div>
          </header>
          <div className="exercise-list">
            {strengthSession.exercises.map((exercise) => {
              const log = progressEntry.exerciseLogs[exercise.id];
              const previousLog = findPreviousLog(exercise.exercise, day.dateIso, progress);
              const programmedSets = parseProgrammedValue(exercise.sets);
              const programmedReps = parseProgrammedValue(exercise.reps);
              const suggestion = getProgressionHint(log, previousLog, programmedSets, programmedReps);

              return (
                <article className="exercise-card" key={`log-${exercise.id}`}>
                  <span className="card-kicker">{exercise.pattern}</span>
                  <h3 className="exercise-name">{exercise.exercise}</h3>
                  <p className="exercise-note">Target: {exercise.sets} x {exercise.reps}</p>
                  <div className="metric-grid">
                    <div>
                      <label className="field-label" htmlFor={`${exercise.id}-sets`}>Sets</label>
                      <input
                        id={`${exercise.id}-sets`}
                        className="select-input"
                        type="number"
                        min="0"
                        value={log?.setsCompleted ?? ''}
                        onChange={(event) => onExerciseLogChange(exercise.id, {
                          exerciseName: exercise.exercise,
                          setsCompleted: Number(event.target.value) || 0,
                        })}
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`${exercise.id}-reps`}>Reps</label>
                      <input
                        id={`${exercise.id}-reps`}
                        className="select-input"
                        type="number"
                        min="0"
                        value={log?.repsCompleted ?? ''}
                        onChange={(event) => onExerciseLogChange(exercise.id, {
                          exerciseName: exercise.exercise,
                          repsCompleted: Number(event.target.value) || 0,
                        })}
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`${exercise.id}-load`}>Load (lb)</label>
                      <input
                        id={`${exercise.id}-load`}
                        className="select-input"
                        type="number"
                        min="0"
                        step="0.5"
                        value={log?.loadLbs ?? ''}
                        onChange={(event) => onExerciseLogChange(exercise.id, {
                          exerciseName: exercise.exercise,
                          loadLbs: Number(event.target.value) || 0,
                        })}
                      />
                    </div>
                  </div>
                  <div className="range-stack">
                    <label className="field-label" htmlFor={`${exercise.id}-form`}>Form quality ({log?.formScore ?? 3}/5)</label>
                    <input
                      id={`${exercise.id}-form`}
                      className="range-input"
                      type="range"
                      min="1"
                      max="5"
                      value={log?.formScore ?? 3}
                      onChange={(event) => onExerciseLogChange(exercise.id, {
                        exerciseName: exercise.exercise,
                        formScore: Number(event.target.value) || 3,
                      })}
                    />
                  </div>
                  <label className="field-label" htmlFor={`${exercise.id}-note`}>Lift note</label>
                  <textarea
                    id={`${exercise.id}-note`}
                    className="notes-field"
                    placeholder="Bar speed, stability, pain-free range, cue that worked."
                    value={log?.note ?? ''}
                    onChange={(event) => onExerciseLogChange(exercise.id, {
                      exerciseName: exercise.exercise,
                      note: event.target.value,
                    })}
                  />
                  <p className="exercise-note"><strong>Progression:</strong> {suggestion}</p>
                  {previousLog ? <p className="exercise-note">Last: {previousLog.setsCompleted} sets · {previousLog.repsCompleted} reps · {previousLog.loadLbs} lb · form {previousLog.formScore}/5</p> : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </PageWrapper>
  );
}