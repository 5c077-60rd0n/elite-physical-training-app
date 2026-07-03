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