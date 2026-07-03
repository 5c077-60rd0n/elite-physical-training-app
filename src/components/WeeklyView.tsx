import { formatShortDate } from '../lib/date';
import type { DayPlan, ProgressMap } from '../types';

interface WeeklyViewProps {
  plan: DayPlan[];
  progress: ProgressMap;
  selectedDate: string;
  onSelect: (dateIso: string) => void;
  compact?: boolean;
}

export function WeeklyView({ plan, progress, selectedDate, onSelect, compact = false }: WeeklyViewProps) {
  return (
    <section className={compact ? 'week-grid compact' : 'week-grid'}>
      <header className="week-header">
        <div>
          <span className="panel-kicker">Weekly flow</span>
          <h2 className="week-title">Full training split</h2>
          <p className="week-subtitle">
            Strength rotates by movement pattern each week. Cardio stays treadmill-only and recovery is baked into every day.
          </p>
        </div>
      </header>

      <div className="week-list">
        {plan.map((day) => {
          const entry = progress[day.dateIso];
          const isSelected = day.dateIso === selectedDate;
          const summary =
            day.session.kind === 'strength'
              ? day.session.exercises.map((exercise) => exercise.pattern).join(' • ')
              : `${day.session.templateName} • ${day.session.durationMinutes} min`;

          return (
            <button
              type="button"
              key={day.dateIso}
              className={isSelected ? 'week-card selected' : 'week-card'}
              aria-pressed={isSelected}
              onClick={() => onSelect(day.dateIso)}
            >
              <div className="week-card-header">
                <div>
                  <span className="card-kicker">{formatShortDate(day.dateIso)}</span>
                  <h3>{day.dayName}</h3>
                </div>
                <span className={entry?.sessionComplete ? 'status-pill complete' : 'status-pill'}>
                  {entry?.sessionComplete ? 'Done' : isSelected ? 'Viewing' : 'Open'}
                </span>
              </div>
              <p className="week-summary">{day.sessionLabel}</p>
              <p className="week-summary">{summary}</p>
              <div className="week-tags">
                <span className="day-pill">{day.session.kind === 'strength' ? 'Strength' : 'Cardio'}</span>
                {day.session.kind === 'cardio' && day.session.optional ? (
                  <span className="optional-tag">Optional</span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}