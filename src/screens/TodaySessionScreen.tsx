import { useEffect, useRef, useState } from 'react';
import { Dashboard } from '../components/Dashboard';
import { PageWrapper } from '../components/layout/PageWrapper';
import { ProgressPanel } from '../components/ProgressPanel';
import { getSessionRewardPreview } from '../lib/gamification';
import { getRecoveryReadinessSummary } from '../lib/health';
import { buildProgramSnapshot } from '../lib/program';
import { triggerRewardCue } from '../lib/rewardEffects';
import { createDefaultProgressEntry } from '../lib/storage';
import type { BodyMetricEntry, DayPlan, HealthMetricEntry, ProgressEntry, UserProfile } from '../types';

interface TodaySessionScreenProps {
  day: DayPlan;
  entry: ProgressEntry;
  profile: UserProfile;
  bodyMetrics: BodyMetricEntry[];
  healthMetrics: HealthMetricEntry[];
  onChange: (partial: Partial<ProgressEntry>) => void;
}

export function TodaySessionScreen({ day, entry, profile, bodyMetrics, healthMetrics, onChange }: TodaySessionScreenProps) {
  const snapshot = buildProgramSnapshot(profile, day, bodyMetrics);
  const progressEntry = entry ?? createDefaultProgressEntry();
  const previousComplete = useRef(progressEntry.sessionComplete);
  const [celebration, setCelebration] = useState<{ xp: number; qualityLabel: string; bonusTags: string[] } | null>(null);
  const todayHealth = healthMetrics.find((item) => item.date === day.dateIso) ?? null;
  const readiness = getRecoveryReadinessSummary(healthMetrics, day.dateIso);

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
        <Dashboard day={day} progress={progressEntry} />
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
              <p className="exercise-note">
                {todayHealth
                  ? `Apple Health steps today: ${todayHealth.steps.toLocaleString()}. Keep the day moving so the deficit is supported by activity, not only restriction.`
                  : 'Import Apple Health steps to tie food and movement adherence together.'}
              </p>
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
            <strong>
              {todayHealth
                ? `${todayHealth.steps.toLocaleString()} imported steps today. Let low-intensity movement carry more of the fat-loss workload.`
                : 'No imported step data yet. If daily movement is low, do not over-rely on hard cardio to make up the gap.'}
            </strong>
          </div>
          {readiness ? (
            <div className="summary-box">
              <span className="card-kicker">Recovery readiness</span>
              <strong>{readiness.readiness.toUpperCase()}</strong>
              <ul className="detail-list compact-detail-list">
                {readiness.notes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </section>
    </PageWrapper>
  );
}