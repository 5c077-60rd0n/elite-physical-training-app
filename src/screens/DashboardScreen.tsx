import { Link } from 'react-router-dom';
import { SimpleTrendChart } from '../components/charts/SimpleTrendChart';
import { Dashboard } from '../components/Dashboard';
import { PageWrapper } from '../components/layout/PageWrapper';
import { getBlockAverageComparisons, getCompletionRate, getMonthOverMonthSummaries } from '../lib/analytics';
import { getGamificationSnapshot } from '../lib/gamification';
import { getReadinessGuidance, getReadinessScore } from '../lib/health';
import { buildProgramSnapshot, getSciencePrinciples } from '../lib/program';
import type { BodyMetricEntry, DayPlan, HealthMetricEntry, PhotoCheckIn, ProgressEntry, ProgressMap, UserProfile } from '../types';

interface DashboardScreenProps {
  day: DayPlan;
  plan: DayPlan[];
  progress: ProgressMap;
  profile: UserProfile;
  bodyMetrics: BodyMetricEntry[];
  photoCheckIns: PhotoCheckIn[];
  healthMetrics: HealthMetricEntry[];
}

export function DashboardScreen({ day, plan, progress, profile, bodyMetrics, photoCheckIns, healthMetrics }: DashboardScreenProps) {
  const snapshot = buildProgramSnapshot(profile, day, bodyMetrics);
  const completion = getCompletionRate(plan, progress);
  const science = getSciencePrinciples()[0];
  const blockComparisons = getBlockAverageComparisons(bodyMetrics);
  const monthSummaries = getMonthOverMonthSummaries(bodyMetrics, progress);
  const game = getGamificationSnapshot(plan, progress, bodyMetrics, photoCheckIns, healthMetrics);
  const readiness = getReadinessScore(healthMetrics, day.dateIso);
  const readinessGuidance = getReadinessGuidance(healthMetrics, day.dateIso);
  const weeklyStepDays = plan.filter((item) => {
    const health = healthMetrics.find((entry) => entry.date === item.dateIso);
    return Boolean(health && health.steps >= 8000);
  }).length;
  const recentHealth = [...healthMetrics]
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-7);
  const weightBlockPoints = blockComparisons.map((block) => ({ label: block.label, value: block.weightAvg }));
  const waistBlockPoints = blockComparisons.map((block) => ({ label: block.label, value: block.waistAvg }));
  const sleepPoints = recentHealth
    .filter((entry) => typeof entry.sleepHours === 'number')
    .map((entry) => ({ label: entry.date.slice(5), value: Number((entry.sleepHours ?? 0).toFixed(1)) }));
  const restingHrPoints = recentHealth
    .filter((entry) => typeof entry.restingHeartRate === 'number')
    .map((entry) => ({ label: entry.date.slice(5), value: Number((entry.restingHeartRate ?? 0).toFixed(1)) }));
  const levelProgress = game.nextLevelXp > game.levelFloorXp
    ? ((game.totalXp - game.levelFloorXp) / (game.nextLevelXp - game.levelFloorXp)) * 100
    : 0;
  const entry: ProgressEntry = progress[day.dateIso] ?? { sessionComplete: false, supplementsComplete: false, recoveryComplete: false, rpe: 7, notes: '' };

  return (
    <PageWrapper
      title={`Welcome back, ${profile.name}`}
      eyebrow="Home"
      description={`${snapshot.phase.name} · Week ${snapshot.week} · ${snapshot.weeklyFocus.theme}`}
    >
      <section className="content-stack home-grid">
        <section className="panel hero-panel compact-hero">
          <div className="hero-grid">
            <div className="hero-copy-block">
              <p className="eyebrow">This week&apos;s focus</p>
              <h2 className="page-title">{snapshot.weeklyFocus.weeklyFocus}</h2>
              <p className="hero-copy">Primary objective: burn fat, preserve muscle, and keep strength performance steady while recovery stays intact.</p>
            </div>
            <div className="hero-stats">
              <article className="stat-card accent-blue">
                <span>Completion</span>
                <strong>{completion.percent}%</strong>
              </article>
              <article className="stat-card accent-orange">
                <span>Today</span>
                <strong>{day.sessionLabel}</strong>
              </article>
              <article className="stat-card accent-gold">
                <span>RPE target</span>
                <strong>{entry.rpe}/10</strong>
              </article>
            </div>
          </div>
        </section>

        <section className="panel quick-panel">
          <header className="section-header">
            <div>
              <span className="panel-kicker">Program snapshot</span>
              <h2 className="section-title">Week {snapshot.week}</h2>
            </div>
          </header>
          <ul className="detail-list">
            {snapshot.weeklyTargets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="cta-grid">
            <Link className="action-link action-link-primary" to="/today">Start today</Link>
            <Link className="action-link" to="/schedule">Open week view</Link>
          </div>
          {snapshot.nutritionTargets ? (
            <div className="summary-box nutrition-box">
              <span className="card-kicker">Today&apos;s nutrition target</span>
              <strong>{snapshot.nutritionTargets.calories} · {snapshot.nutritionTargets.proteinGrams}</strong>
              <p className="panel-subtitle">{snapshot.nutritionTargets.rationale}</p>
            </div>
          ) : null}
        </section>
      </section>

      <section className="content-stack home-grid second-row">
        <Dashboard day={day} progress={entry} />

        <aside className="tracker-panel">
          <header className="tracker-header">
            <div>
              <span className="panel-kicker">Science brief</span>
              <h2 className="tracker-title">{science.title}</h2>
            </div>
          </header>
          <p className="panel-subtitle">{science.summary}</p>
          <ul className="detail-list">
            {science.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
          <div className="summary-box">
            <span className="card-kicker">Body-composition note</span>
            <strong>Use scale trend, waist trend, and gym performance together. Fast scale drops are not the goal if training output falls apart.</strong>
          </div>
        </aside>
      </section>

      <section className="content-stack second-row">
        <section className="panel">
          <header className="section-header">
            <div>
              <span className="panel-kicker">Training game</span>
              <h2 className="section-title">Level {game.level} · {game.title}</h2>
            </div>
            <span className="status-pill">{game.seasonTier}</span>
          </header>
          <div className="summary-box">
            <span className="card-kicker">XP progress</span>
            <strong>{game.totalXp} XP</strong>
            <div className="xp-bar"><span style={{ width: `${Math.max(0, Math.min(100, levelProgress))}%` }} /></div>
            <p className="panel-subtitle">{Math.max(0, game.nextLevelXp - game.totalXp)} XP to level {game.level + 1}</p>
          </div>
          <div className="summary-strip three-col">
            <article className="summary-box">
              <span className="card-kicker">Streak</span>
              <strong>{game.streakDays} days</strong>
            </article>
            <article className="summary-box">
              <span className="card-kicker">Quality sessions</span>
              <strong>{game.northStarQualitySessions}</strong>
            </article>
            <article className="summary-box">
              <span className="card-kicker">Season score</span>
              <strong>{game.seasonScore}</strong>
            </article>
            <article className="summary-box">
              <span className="card-kicker">Step days</span>
              <strong>{weeklyStepDays}</strong>
            </article>
          </div>
          <div className="badge-row">
            {game.badges.length ? game.badges.map((badge) => <span key={badge} className="scan-tag">{badge}</span>) : <span className="panel-subtitle">Complete quality sessions and check-ins to unlock badges.</span>}
          </div>
          <div className="exercise-list compact-list">
            {game.weeklyQuests.map((quest) => (
              <article className="exercise-card" key={quest.id}>
                <span className="card-kicker">{quest.progress}/{quest.target}</span>
                <h3 className="exercise-name">{quest.name}</h3>
                <p className="exercise-note">{quest.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="tracker-panel">
          <header className="tracker-header">
            <div>
              <span className="panel-kicker">Recovery trends</span>
              <h2 className="tracker-title">Sleep and resting HR</h2>
            </div>
          </header>
          <div className="chart-grid">
            <SimpleTrendChart title="Sleep hours" points={sleepPoints} colorClass="cyan" unit=" h" />
            <SimpleTrendChart title="Resting heart rate" points={restingHrPoints} colorClass="gold" unit=" bpm" />
          </div>
          {readiness && readinessGuidance ? (
            <div className="summary-box">
              <span className="card-kicker">Today&apos;s readiness</span>
              <strong>{readiness.score}/100 ({readiness.band})</strong>
              <p className="exercise-note">{readinessGuidance.trainingAdjustment}</p>
              <p className="exercise-note">{readinessGuidance.recoveryFocus}</p>
            </div>
          ) : null}
        </section>
      </section>

      <section className="content-stack second-row">
        <section className="panel">
          <header className="section-header">
            <div>
              <span className="panel-kicker">Multi-week dashboard</span>
              <h2 className="section-title">Recent block comparison</h2>
            </div>
          </header>
          <div className="chart-grid">
            <SimpleTrendChart title="Weight block average" points={weightBlockPoints} colorClass="cyan" unit=" lb" />
            <SimpleTrendChart title="Waist block average" points={waistBlockPoints} colorClass="gold" unit=" in" />
          </div>
          <div className="exercise-list">
            {blockComparisons.length ? blockComparisons.map((block) => (
              <article className="exercise-card" key={block.label}>
                <span className="card-kicker">{block.label}</span>
                <h3 className="exercise-name">{block.weightAvg} lb · {block.waistAvg} in</h3>
                <p className="exercise-note">Based on {block.count} check-ins. Compare blocks rather than reacting to one noisy measurement.</p>
              </article>
            )) : <article className="exercise-card"><h3 className="exercise-name">Need more check-ins</h3><p className="exercise-note">Log several weigh-ins across multiple weeks to compare rolling body-composition blocks.</p></article>}
          </div>
        </section>

        <section className="tracker-panel">
          <header className="tracker-header">
            <div>
              <span className="panel-kicker">Month over month</span>
              <h2 className="tracker-title">Performance correlation</h2>
            </div>
          </header>
          <div className="exercise-list">
            {monthSummaries.length ? monthSummaries.map((month) => (
              <article className="exercise-card" key={month.month}>
                <span className="card-kicker">{month.month}</span>
                <h3 className="exercise-name">{month.avgWeight ?? '--'} lb · {month.avgWaist ?? '--'} in</h3>
                <p className="exercise-note">Completed sessions: {month.completedSessions} · Avg RPE: {month.avgRpe ?? '--'}</p>
                <p className="exercise-note">Vs prior month: {month.weightDeltaFromPrior ?? '--'} lb · {month.waistDeltaFromPrior ?? '--'} in</p>
              </article>
            )) : <article className="exercise-card"><h3 className="exercise-name">Need more monthly data</h3><p className="exercise-note">As your check-ins span multiple calendar months, this panel will compare body-composition change against training output.</p></article>}
          </div>
        </section>
      </section>
    </PageWrapper>
  );
}