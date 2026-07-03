import { PageWrapper } from '../components/layout/PageWrapper';
import { buildProgramSnapshot } from '../lib/program';
import type { BodyMetricEntry, DayPlan, ProgressMap, UserProfile } from '../types';

interface NutritionScreenProps {
  day: DayPlan;
  profile: UserProfile;
  bodyMetrics: BodyMetricEntry[];
  progress: ProgressMap;
}

function getStepRange(stepTarget: string) {
  const matches = stepTarget.match(/[\d,]+/g) ?? [];
  const values = matches.map((value) => Number(value.replace(/,/g, ''))).filter(Number.isFinite);
  if (!values.length) {
    return null;
  }

  return {
    min: values[0],
    max: values[values.length - 1],
  };
}

export function NutritionScreen({ day, profile, bodyMetrics, progress }: NutritionScreenProps) {
  const snapshot = buildProgramSnapshot(profile, day, bodyMetrics);
  const nutrition = snapshot.nutritionTargets;
  const stepRange = nutrition ? getStepRange(nutrition.stepTarget) : null;
  const weeklyCompletedSessions = Object.entries(progress)
    .filter(([date, entry]) => date >= day.dateIso.slice(0, 8) && entry.sessionComplete)
    .length;

  return (
    <PageWrapper
      title="Nutrition"
      eyebrow="Fuel"
      description="Meal timing, calorie targets, protein, fiber, hydration, and steps built around fat loss with lean-mass retention."
    >
      <section className="content-stack second-row">
        <section className="panel">
          <header className="section-header">
            <div>
              <span className="panel-kicker">Daily targets</span>
              <h2 className="section-title">Today&apos;s fuel plan</h2>
            </div>
          </header>
          {nutrition ? (
            <div className="exercise-list">
              <article className="exercise-card">
                <span className="card-kicker">Estimated maintenance</span>
                <h3 className="exercise-name">{nutrition.maintenanceCalories}</h3>
                <p className="exercise-note">Calorie target: {nutrition.calories}</p>
              </article>
              <article className="exercise-card">
                <span className="card-kicker">Macros</span>
                <h3 className="exercise-name">Protein {nutrition.proteinGrams}</h3>
                <p className="exercise-note">Carbs {nutrition.carbs} · Fats {nutrition.fats}</p>
              </article>
              <article className="exercise-card">
                <span className="card-kicker">Hunger management</span>
                <h3 className="exercise-name">Fiber {nutrition.fiberGrams}</h3>
                <p className="exercise-note">Steps {nutrition.stepTarget} · Hydration {nutrition.hydration}</p>
              </article>
              <article className="exercise-card">
                <span className="card-kicker">Activity consistency</span>
                <h3 className="exercise-name">{weeklyCompletedSessions} logged sessions this week</h3>
                <p className="exercise-note">
                  {stepRange
                    ? `Use manual movement tracking to stay near ${stepRange.min.toLocaleString()}-${stepRange.max.toLocaleString()} daily steps.`
                    : 'Use manual movement tracking to keep non-exercise activity consistent.'}
                </p>
              </article>
            </div>
          ) : (
            <article className="exercise-card">
              <h3 className="exercise-name">Log body weight in Progress first</h3>
              <p className="exercise-note">Nutrition targets personalize once current weight is available.</p>
            </article>
          )}
        </section>

        <section className="tracker-panel">
          <header className="tracker-header">
            <div>
              <span className="panel-kicker">Meal timing</span>
              <h2 className="tracker-title">Repeatable structure</h2>
            </div>
          </header>
          <div className="exercise-list">
            {nutrition?.mealTiming.map((entry) => (
              <article className="exercise-card" key={entry.label}>
                <span className="card-kicker">{entry.label}</span>
                <h3 className="exercise-name">{entry.guidance}</h3>
              </article>
            ))}
          </div>
          {nutrition ? (
            <div className="summary-box nutrition-box">
              <span className="card-kicker">Why this works</span>
              <strong>{nutrition.rationale}</strong>
            </div>
          ) : null}
          {nutrition ? (
            <div className="summary-box nutrition-box">
              <span className="card-kicker">Adherence signal</span>
              <strong>
                {weeklyCompletedSessions >= 4
                  ? 'Session consistency is solid. Keep calories steady and avoid unnecessary cuts.'
                  : 'If training adherence is low, focus on consistency first before tightening calories.'}
              </strong>
            </div>
          ) : null}
          {nutrition ? (
            <div className="summary-box nutrition-box">
              <span className="card-kicker">Recovery-informed adjustment</span>
              <strong>Use manual form scores and session notes as recovery guardrails.</strong>
              <p className="exercise-note">If form quality trends down, hold load and keep calories near the top of range.</p>
              <p className="exercise-note">If form quality is stable with completed sets/reps, progress load gradually.</p>
            </div>
          ) : null}
        </section>
      </section>
    </PageWrapper>
  );
}