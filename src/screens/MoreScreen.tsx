import { Link } from 'react-router-dom';
import { PageWrapper } from '../components/layout/PageWrapper';

const links = [
  { to: '/nutrition', label: 'Nutrition', description: 'Calorie targets, meal timing, fiber, and step guidance.' },
  { to: '/science', label: 'Science Engine', description: 'Programming rationale and evidence anchors.' },
  { to: '/backup', label: 'Backup', description: 'Export or restore all local progress, metrics, and photos.' },
  { to: '/settings', label: 'Settings', description: 'Profile, reminder timing, and program start date.' },
];

export function MoreScreen() {
  return (
    <PageWrapper title="More" eyebrow="More" description="Supporting screens for science, settings, and planning context.">
      <section className="exercise-list">
        {links.map((entry) => (
          <Link key={entry.to} to={entry.to} className="more-link-card">
            <article className="exercise-card">
              <span className="card-kicker">Open</span>
              <h3 className="exercise-name">{entry.label}</h3>
              <p className="exercise-note">{entry.description}</p>
            </article>
          </Link>
        ))}
      </section>
    </PageWrapper>
  );
}