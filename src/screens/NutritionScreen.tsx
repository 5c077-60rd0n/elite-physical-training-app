import { PageWrapper } from '../components/layout/PageWrapper';
import { getReadinessGuidance, getReadinessScore } from '../lib/health';
import { buildProgramSnapshot } from '../lib/program';
import type { BodyMetricEntry, DayPlan, HealthMetricEntry, UserProfile } from '../types';

interface NutritionScreenProps {
  day: DayPlan;
  profile: UserProfile;
  bodyMetrics: BodyMetricEntry[];
  healthMetrics: HealthMetricEntry[];
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

export function NutritionScreen({ day, profile, bodyMetrics, healthMetrics }: NutritionScreenProps) {
  const snapshot = buildProgramSnapshot(profile, day, bodyMetrics);
  const nutrition = snapshot.nutritionTargets;
  const todayHealth = healthMetrics.find((entry) => entry.date === day.dateIso) ?? null;
  const stepRange = nutrition ? getStepRange(nutrition.stepTarget) : null;
  const remainingSteps = todayHealth && stepRange ? Math.max(0, stepRange.min - todayHealth.steps) : null;
  const readiness = getReadinessScore(healthMetrics, day.dateIso);
  const readinessGuidance = getReadinessGuidance(healthMetrics, day.dateIso);

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
                <span className="card-kicker">Imported step progress</span>
                <h3 className="exercise-name">{todayHealth ? `${todayHealth.steps.toLocaleString()} steps` : 'No Apple Health steps for today'}</h3>
                <p className="exercise-note">
                  {todayHealth && stepRange
                    ? remainingSteps === 0
                      ? 'Step target met. Keep the rest of the day easy and consistent.'
                      : `${(remainingSteps ?? 0).toLocaleString()} steps left to hit the floor of today\'s target range.`
                    : 'Import Apple Health data on the Health screen to compare real steps against today\'s target.'}
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
          {nutrition && todayHealth ? (
            <div className="summary-box nutrition-box">
              <span className="card-kicker">Adherence signal</span>
              <strong>
                {stepRange && todayHealth.steps >= stepRange.min
                  ? 'Movement target is on pace, so the calorie target can stay modest and stable.'
                  : 'If steps stay low, tighten food precision rather than forcing extra interval work.'}
              </strong>
            </div>
          ) : null}
          {nutrition && readiness && readinessGuidance ? (
            <div className="summary-box nutrition-box">
              <span className="card-kicker">Recovery-informed adjustment</span>
              <strong>Readiness {readiness.score}/100 ({readiness.band})</strong>
              <p className="exercise-note">{readinessGuidance.calorieAdjustment}</p>
              <p className="exercise-note">{readinessGuidance.trainingAdjustment}</p>
              <p className="exercise-note">{readinessGuidance.recoveryFocus}</p>
            </div>
          ) : null}
        </section>
      </section>
    </PageWrapper>
  );
}