import type { DayPlan, ProgressEntry } from '../types';

interface ProgressPanelProps {
  day: DayPlan;
  entry: ProgressEntry;
  onChange: (partial: Partial<ProgressEntry>) => void;
  title: string;
}

export function ProgressPanel({ day, entry, onChange, title }: ProgressPanelProps) {
  const sessionLabel = day.session.kind === 'strength' ? 'Workout complete' : 'Cardio complete';

  return (
    <aside className="tracker-panel">
      <header className="tracker-header">
        <div>
          <span className="panel-kicker">Progress tracking</span>
          <h2 className="tracker-title">{title}</h2>
        </div>
        <div className="tracker-summary">
          <span className="field-label">Current RPE</span>
          <strong>{entry.rpe}</strong>
        </div>
      </header>

      <div className="tracker-grid">
        <div className="tracker-checks">
          <div className="toggle-row">
            <label>
              <span>{sessionLabel}</span>
              <span className="field-label">Mark the main training block done.</span>
            </label>
            <input
              className="checkbox"
              type="checkbox"
              checked={entry.sessionComplete}
              onChange={(event) => onChange({ sessionComplete: event.target.checked })}
            />
          </div>

          <div className="toggle-row">
            <label>
              <span>Supplements complete</span>
              <span className="field-label">Morning, post-workout, and evening routine.</span>
            </label>
            <input
              className="checkbox"
              type="checkbox"
              checked={entry.supplementsComplete}
              onChange={(event) => onChange({ supplementsComplete: event.target.checked })}
            />
          </div>

          <div className="toggle-row">
            <label>
              <span>Recovery complete</span>
              <span className="field-label">Mobility, tissue work, or optional conditioning.</span>
            </label>
            <input
              className="checkbox"
              type="checkbox"
              checked={entry.recoveryComplete}
              onChange={(event) => onChange({ recoveryComplete: event.target.checked })}
            />
          </div>
        </div>

        <div className="range-stack">
          <label className="field-label" htmlFor="rpe-range">
            Session RPE
          </label>
          <input
            id="rpe-range"
            className="range-input"
            type="range"
            min="1"
            max="10"
            value={entry.rpe}
            onChange={(event) => onChange({ rpe: Number(event.target.value) })}
          />
          <div className="range-caption">
            <span>1 easy</span>
            <span>10 maximal</span>
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor={`notes-${day.dateIso}`}>
            Notes
          </label>
          <textarea
            id={`notes-${day.dateIso}`}
            className="notes-field"
            placeholder="Log energy, treadmill pace, reps left in reserve, or recovery notes."
            value={entry.notes}
            onChange={(event) => onChange({ notes: event.target.value })}
          />
        </div>
      </div>
    </aside>
  );
}