import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../components/layout/PageWrapper';
import { getCurrentPhase, getCurrentWeek } from '../lib/program';
import type { UserProfile } from '../types';

interface OnboardingProps {
  profile: UserProfile;
  onComplete: (profile: UserProfile) => void;
}

export function Onboarding({ profile, onComplete }: OnboardingProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(profile);
  const previewWeek = useMemo(() => getCurrentWeek({ ...draft, onboardingComplete: true }), [draft]);
  const previewPhase = useMemo(() => getCurrentPhase(previewWeek), [previewWeek]);

  function finish() {
    onComplete({ ...draft, onboardingComplete: true });
    navigate('/');
  }

  return (
    <PageWrapper
      title="Welcome to Physical Climb"
      eyebrow="Flash Gordon Pool System"
      description="An evidence-informed training console built to reduce body fat while maintaining muscle mass and performance."
    >
      <section className="panel">
        <p className="panel-kicker">Step {step} of 4</p>

        {step === 1 ? (
          <div className="form-stack">
            <h2 className="panel-title">Every session is a step toward stronger, fitter output.</h2>
            <p className="panel-subtitle">
              This app uses structured lifting, Zone 2 work, interval dosing, protein timing, and recovery compliance to drive fat loss while protecting lean mass.
            </p>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="form-stack">
            <label className="field-label" htmlFor="name">Name</label>
            <input id="name" className="select-input" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />

            <label className="field-label" htmlFor="city">Location</label>
            <input id="city" className="select-input" value={draft.city} onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))} />

            <label className="field-label" htmlFor="start">Program start date</label>
            <input id="start" className="select-input" type="date" value={draft.programStartDate} onChange={(event) => setDraft((current) => ({ ...current, programStartDate: event.target.value }))} />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="form-stack">
            <label className="field-label" htmlFor="sex">Biological sex</label>
            <select id="sex" className="select-input" value={draft.biologicalSex} onChange={(event) => setDraft((current) => ({ ...current, biologicalSex: event.target.value as UserProfile['biologicalSex'] }))}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>

            <div className="metric-grid">
              <div>
                <label className="field-label" htmlFor="age">Age</label>
                <input id="age" className="select-input" type="number" value={draft.age} onChange={(event) => setDraft((current) => ({ ...current, age: Number(event.target.value) || current.age }))} />
              </div>
              <div>
                <label className="field-label" htmlFor="height">Height (in)</label>
                <input id="height" className="select-input" type="number" value={draft.heightInches} onChange={(event) => setDraft((current) => ({ ...current, heightInches: Number(event.target.value) || current.heightInches }))} />
              </div>
              <div>
                <label className="field-label" htmlFor="activity">Activity</label>
                <select id="activity" className="select-input" value={draft.activityLevel} onChange={(event) => setDraft((current) => ({ ...current, activityLevel: event.target.value as UserProfile['activityLevel'] }))}>
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="form-stack">
            <label className="field-label" htmlFor="window">Preferred session window</label>
            <select id="window" className="select-input" value={draft.preferredSessionWindow} onChange={(event) => setDraft((current) => ({ ...current, preferredSessionWindow: event.target.value as UserProfile['preferredSessionWindow'] }))}>
              <option value="early">Early</option>
              <option value="midday">Midday</option>
              <option value="evening">Evening</option>
            </select>

            <label className="field-label" htmlFor="time">Reminder time</label>
            <input id="time" className="select-input" type="time" value={draft.dailyReminderTime} onChange={(event) => setDraft((current) => ({ ...current, dailyReminderTime: event.target.value }))} />

            <div className="toggle-row">
              <label>
                <span>Enable reminder</span>
                <span className="field-label">Browser notifications are optional and can be added later.</span>
              </label>
              <input className="checkbox" type="checkbox" checked={draft.reminderEnabled} onChange={(event) => setDraft((current) => ({ ...current, reminderEnabled: event.target.checked }))} />
            </div>

            <div className="summary-box">
              <span className="card-kicker">Calculated position</span>
              <strong>Week {previewWeek} · {previewPhase.name}</strong>
              <p className="panel-subtitle">{previewPhase.goal}</p>
            </div>
          </div>
        ) : null}

        <div className="onboarding-actions">
          <button className="secondary-action" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1}>
            Back
          </button>
          {step < 4 ? (
            <button className="install-button" onClick={() => setStep((current) => Math.min(4, current + 1))}>
              Continue
            </button>
          ) : (
            <button className="install-button" onClick={finish}>
              Enter Console
            </button>
          )}
        </div>
      </section>
    </PageWrapper>
  );
}