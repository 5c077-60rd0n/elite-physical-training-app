import { PageWrapper } from '../components/layout/PageWrapper';
import { getSciencePrinciples, getTrainingPhases } from '../lib/program';

export function ScienceScreen() {
  const principles = getSciencePrinciples();
  const phases = getTrainingPhases();

  return (
    <PageWrapper
      title="Science Engine"
      eyebrow="Evidence"
      description="The training logic follows practical current best evidence on fat loss, muscle retention, aerobic work, recovery, and autoregulation."
    >
      <section className="content-stack">
        <section className="panel">
          <header className="section-header">
            <div>
              <span className="panel-kicker">Programming principles</span>
              <h2 className="section-title">Current best-evidence anchors</h2>
            </div>
          </header>
          <div className="exercise-list">
            {principles.map((item) => (
              <article className="exercise-card" key={item.title}>
                <span className="card-kicker">Principle</span>
                <h3 className="exercise-name">{item.title}</h3>
                <p className="exercise-note">{item.summary}</p>
                <ul className="detail-list">
                  {item.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <header className="section-header">
            <div>
              <span className="panel-kicker">Phase map</span>
              <h2 className="section-title">12-week repeating block</h2>
            </div>
          </header>
          <div className="exercise-list">
            {phases.map((phase) => (
              <article className="exercise-card" key={phase.id}>
                <span className="card-kicker">Weeks {phase.weekRange[0]}-{phase.weekRange[1]}</span>
                <h3 className="exercise-name">{phase.name}</h3>
                <p className="exercise-note">{phase.goal}</p>
                <ul className="detail-list">
                  {phase.primaryAdaptations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </section>
    </PageWrapper>
  );
}