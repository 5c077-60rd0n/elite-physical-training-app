import { PageWrapper } from '../components/layout/PageWrapper';
import { WeeklyView } from '../components/WeeklyView';
import { buildProgramSnapshot } from '../lib/program';
import type { DayPlan, ProgressMap, UserProfile } from '../types';

interface WeeklyScheduleScreenProps {
  plan: DayPlan[];
  selectedDate: string;
  onSelect: (dateIso: string) => void;
  progress: ProgressMap;
  profile: UserProfile;
}

export function WeeklyScheduleScreen({ plan, selectedDate, onSelect, progress, profile }: WeeklyScheduleScreenProps) {
  const selectedDay = plan.find((day) => day.dateIso === selectedDate) ?? plan[0];
  const snapshot = buildProgramSnapshot(profile, selectedDay);

  return (
    <PageWrapper
      title="Weekly Schedule"
      eyebrow="Week"
      description={`${snapshot.phase.name} · ${snapshot.weeklyFocus.weeklyFocus}`}
    >
      <section className="content-stack">
        <WeeklyView plan={plan} progress={progress} selectedDate={selectedDate} onSelect={onSelect} />
        <section className="panel">
          <header className="section-header">
            <div>
              <span className="panel-kicker">Selected routine</span>
              <h2 className="section-title">{selectedDay.sessionLabel}</h2>
              <p className="panel-subtitle">{selectedDay.dayName} · {selectedDay.dateIso}</p>
            </div>
          </header>

          <div className="summary-strip three-col">
            <article className="summary-box">
              <span className="card-kicker">Session type</span>
              <strong>{selectedDay.session.kind === 'strength' ? 'Strength' : 'Cardio'}</strong>
            </article>
            <article className="summary-box">
              <span className="card-kicker">Supplements</span>
              <strong>{selectedDay.supplements.length} blocks</strong>
            </article>
            <article className="summary-box">
              <span className="card-kicker">Recovery</span>
              <strong>{selectedDay.recovery.length} modules</strong>
            </article>
          </div>

          {selectedDay.session.kind === 'strength' ? (
            <div className="exercise-list compact-list">
              {selectedDay.session.exercises.map((exercise) => (
                <article className="exercise-card" key={exercise.id}>
                  <span className="card-kicker">{exercise.pattern}</span>
                  <h3 className="exercise-name">{exercise.exercise}</h3>
                  <p className="exercise-note">{exercise.sets} · {exercise.reps} · Rest {exercise.rest}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="exercise-list compact-list">
              <article className="exercise-card">
                <span className="card-kicker">{selectedDay.session.templateName}</span>
                <h3 className="exercise-name">{selectedDay.session.durationMinutes} minute treadmill session</h3>
                <p className="exercise-note">{selectedDay.session.intensity}</p>
                <ul className="detail-list">
                  {selectedDay.session.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </article>
            </div>
          )}
        </section>
        <section className="panel">
          <header className="section-header">
            <div>
              <span className="panel-kicker">Phase guidance</span>
              <h2 className="section-title">{snapshot.phase.name}</h2>
            </div>
          </header>
          <p className="panel-subtitle">{snapshot.phase.goal}</p>
          <ul className="detail-list">
            {snapshot.phase.primaryAdaptations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="summary-box">
            <span className="card-kicker">Recovery priority</span>
            <strong>{snapshot.phase.recoveryPriority}</strong>
          </div>
        </section>
      </section>
    </PageWrapper>
  );
}