import { formatFullDate } from '../lib/date';
import type { DayPlan, ProgressEntry } from '../types';

interface DashboardProps {
  day: DayPlan;
  progress: ProgressEntry;
}

export function Dashboard({ day, progress }: DashboardProps) {
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