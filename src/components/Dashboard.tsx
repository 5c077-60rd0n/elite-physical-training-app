import { useEffect, useMemo, useState } from 'react';
import { formatFullDate } from '../lib/date';
import type { DayPlan, ProgressEntry } from '../types';

interface DashboardProps {
  day: DayPlan;
  progress: ProgressEntry;
  enableRestTimer?: boolean;
}

function parseRestSeconds(rest: string) {
  const match = rest.match(/(\d+)/);
  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  if (!Number.isFinite(value)) {
    return null;
  }

  return /min/i.test(rest) ? value * 60 : value;
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function Dashboard({ day, progress, enableRestTimer = false }: DashboardProps) {
  const [activeRestExerciseId, setActiveRestExerciseId] = useState<string | null>(null);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(0);

  useEffect(() => {
    if (!activeRestExerciseId || restSecondsRemaining <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setRestSecondsRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeRestExerciseId, restSecondsRemaining]);

  const activeRestExercise = useMemo(
    () => (day.session.kind === 'strength' ? day.session.exercises.find((exercise) => exercise.id === activeRestExerciseId) ?? null : null),
    [activeRestExerciseId, day.session],
  );

  function startRestTimer(exerciseId: string, rest: string) {
    const seconds = parseRestSeconds(rest);
    if (!seconds) {
      return;
    }

    setActiveRestExerciseId(exerciseId);
    setRestSecondsRemaining(seconds);
  }

  function clearRestTimer() {
    setActiveRestExerciseId(null);
    setRestSecondsRemaining(0);
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <span className="panel-kicker">Daily dashboard</span>
          <h2 className="panel-title">{day.sessionLabel}</h2>
          <p className="panel-subtitle">{formatFullDate(day.dateIso)}</p>
        </div>
        <span className={progress.sessionComplete ? 'status-pill complete' : 'status-pill'}>
          {progress.sessionComplete ? 'Completed' : 'Planned'}
        </span>
      </header>

      <div className="summary-strip">
        <article className="summary-box">
          <span className="card-kicker">Session focus</span>
          <strong>{day.session.kind === 'strength' ? 'Strength' : 'Cardio'}</strong>
        </article>
        <article className="summary-box">
          <span className="card-kicker">RPE target</span>
          <strong>{progress.rpe}/10</strong>
        </article>
      </div>

      <div className="pill-row">
        <article className="meta-pill">
          <span>Supplements</span>
          <strong>{day.supplements.length} timing blocks</strong>
        </article>
        <article className="meta-pill">
          <span>Recovery</span>
          <strong>{day.recovery.length} guided options</strong>
        </article>
      </div>

      {enableRestTimer && day.session.kind === 'strength' ? (
        <section className="summary-box rest-timer-box" aria-live="polite">
          <span className="card-kicker">Rest timer</span>
          <strong>
            {activeRestExercise && restSecondsRemaining > 0
              ? `${formatCountdown(restSecondsRemaining)} · ${activeRestExercise.exercise}`
              : 'Ready when you are'}
          </strong>
          <p className="exercise-note">
            {activeRestExercise && restSecondsRemaining > 0
              ? `Auto-loaded from ${activeRestExercise.rest}. Reset or start another exercise to switch timers.`
              : 'Tap Start rest on any exercise to launch the programmed countdown.'}
          </p>
          {activeRestExercise && restSecondsRemaining > 0 ? (
            <div className="card-actions compact-actions-row">
              <button className="secondary-action compact-action" type="button" onClick={() => startRestTimer(activeRestExercise.id, activeRestExercise.rest)}>
                Restart
              </button>
              <button className="secondary-action compact-action" type="button" onClick={clearRestTimer}>
                Clear
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {day.session.kind === 'strength' ? (
        <section className="exercise-list">
          {day.session.exercises.map((exercise) => (
            <article className="exercise-card" key={exercise.id}>
              <span className="card-kicker">{exercise.pattern}</span>
              <h3 className="exercise-name">{exercise.exercise}</h3>
              <p className="exercise-note">{exercise.focus}</p>
              <div className="exercise-meta">
                <div>
                  <span className="list-caption">Sets</span>
                  <strong>{exercise.sets}</strong>
                </div>
                <div>
                  <span className="list-caption">Reps</span>
                  <strong>{exercise.reps}</strong>
                </div>
                <div>
                  <span className="list-caption">Rest</span>
                  <strong>{exercise.rest}</strong>
                </div>
              </div>
              <p className="list-caption">Equipment: {exercise.equipment.join(', ')}</p>
              {enableRestTimer ? (
                <div className="card-actions compact-actions-row">
                  <button className="secondary-action compact-action" type="button" onClick={() => startRestTimer(exercise.id, exercise.rest)}>
                    Start rest
                  </button>
                  {activeRestExerciseId === exercise.id && restSecondsRemaining > 0 ? (
                    <span className="rest-chip">{formatCountdown(restSecondsRemaining)}</span>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </section>
      ) : (
        <section className="exercise-list">
          <article className="exercise-card">
            <span className="card-kicker">{day.session.templateName}</span>
            <h3 className="exercise-name">{day.session.durationMinutes} minute treadmill session</h3>
            <p className="exercise-note">{day.session.intensity}</p>
            <ul className="detail-list">
              {day.session.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            {day.session.optional ? <span className="optional-tag">Optional day</span> : null}
          </article>
        </section>
      )}

      <section className="supplement-grid">
        {day.supplements.map((slot) => (
          <article className="supplement-card" key={slot.slot}>
            <span className="card-kicker">Supplement timing</span>
            <h3>{slot.label}</h3>
            <ul className="supplement-items">
              {slot.items.map((item) => (
                <li key={`${slot.slot}-${item.name}`}>
                  {item.name}
                  {item.optional ? ' (optional)' : ''}
                  {item.note ? <span className="supplement-note"> {item.note}</span> : null}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="recovery-grid">
        {day.recovery.map((block) => (
          <article className="recovery-card" key={block.title}>
            <span className="card-kicker">Recovery module</span>
            <h3>{block.title}</h3>
            <p className="recovery-note">{block.duration}</p>
            <ul className="recovery-steps">
              {block.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
            {block.optional ? <span className="optional-tag">Optional</span> : null}
          </article>
        ))}
      </section>
    </section>
  );
}