import { useEffect, useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { getNativeNotificationStatus, type NativeNotificationStatus } from '../native/nativeNotifications';
import type { UserProfile } from '../types';

interface SettingsScreenProps {
  profile: UserProfile;
  onChange: (profile: UserProfile) => void;
}

export function SettingsScreen({ profile, onChange }: SettingsScreenProps) {
  const [notificationStatus, setNotificationStatus] = useState<NativeNotificationStatus | null>(null);
  const [ageInput, setAgeInput] = useState(String(profile.age));
  const [heightInput, setHeightInput] = useState(String(profile.heightInches));

  useEffect(() => {
    void getNativeNotificationStatus().then(setNotificationStatus);
  }, [profile.dailyReminderTime, profile.reminderEnabled]);

  useEffect(() => {
    setAgeInput(String(profile.age));
  }, [profile.age]);

  useEffect(() => {
    setHeightInput(String(profile.heightInches));
  }, [profile.heightInches]);

  function handleWholeNumberInput(
    nextValue: string,
    assign: (value: number) => void,
    setInput: (value: string) => void,
  ) {
    if (nextValue === '') {
      setInput('');
      return;
    }

    if (!/^\d+$/.test(nextValue)) {
      return;
    }

    setInput(nextValue);
    assign(Number(nextValue));
  }

  return (
    <PageWrapper title="Settings" eyebrow="More" description="Adjust reminder timing and baseline program data.">
      <section className="panel form-stack">
        <label className="field-label" htmlFor="settings-name">Name</label>
        <input id="settings-name" className="select-input" value={profile.name} onChange={(event) => onChange({ ...profile, name: event.target.value })} />

        <div className="metric-grid">
          <div>
            <label className="field-label" htmlFor="settings-sex">Biological sex</label>
            <select id="settings-sex" className="select-input" value={profile.biologicalSex} onChange={(event) => onChange({ ...profile, biologicalSex: event.target.value as UserProfile['biologicalSex'] })}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="settings-age">Age</label>
            <input
              id="settings-age"
              className="select-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={ageInput}
              onChange={(event) => handleWholeNumberInput(event.target.value, (value) => onChange({ ...profile, age: value }), setAgeInput)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="settings-height">Height (in)</label>
            <input
              id="settings-height"
              className="select-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={heightInput}
              onChange={(event) => handleWholeNumberInput(event.target.value, (value) => onChange({ ...profile, heightInches: value }), setHeightInput)}
            />
          </div>
        </div>

        <label className="field-label" htmlFor="settings-activity">Activity level</label>
        <select id="settings-activity" className="select-input" value={profile.activityLevel} onChange={(event) => onChange({ ...profile, activityLevel: event.target.value as UserProfile['activityLevel'] })}>
          <option value="sedentary">Sedentary</option>
          <option value="light">Light</option>
          <option value="moderate">Moderate</option>
          <option value="high">High</option>
        </select>

        <label className="field-label" htmlFor="settings-start">Program start</label>
        <input id="settings-start" className="select-input" type="date" value={profile.programStartDate} onChange={(event) => onChange({ ...profile, programStartDate: event.target.value })} />

        <label className="field-label" htmlFor="settings-time">Reminder time</label>
        <input id="settings-time" className="select-input" type="time" value={profile.dailyReminderTime} onChange={(event) => onChange({ ...profile, dailyReminderTime: event.target.value })} />

        <div className="toggle-row">
          <label>
            <span>Reminder enabled</span>
            <span className="field-label">Stored locally only.</span>
          </label>
          <input className="checkbox" type="checkbox" checked={profile.reminderEnabled} onChange={(event) => onChange({ ...profile, reminderEnabled: event.target.checked })} />
        </div>

        {notificationStatus ? (
          <div className="summary-box">
            <span className="card-kicker">Native reminder status</span>
            <strong>
              {notificationStatus.isNative
                ? `Permission: ${notificationStatus.permission} · Scheduled: ${notificationStatus.scheduledCount}`
                : 'Web runtime only. Native notification status becomes available inside the iOS wrapper.'}
            </strong>
          </div>
        ) : null}

        <div className="summary-box">
          <span className="card-kicker">Manual tracking mode</span>
          <strong>Body metrics and workout progression stay fully local on this device.</strong>
          <p className="exercise-note">Use Progress for weight, waist, and body-fat entries.</p>
          <p className="exercise-note">Use Today to log sets, reps, load, and form quality.</p>
        </div>

        <div className="toggle-row">
          <label>
            <span>Reward sound</span>
            <span className="field-label">Play a short audio cue when a session reward is unlocked.</span>
          </label>
          <input className="checkbox" type="checkbox" checked={profile.rewardSoundEnabled} onChange={(event) => onChange({ ...profile, rewardSoundEnabled: event.target.checked })} />
        </div>

        <div className="toggle-row">
          <label>
            <span>Reward haptics</span>
            <span className="field-label">Use device vibration feedback on supported mobile installs.</span>
          </label>
          <input className="checkbox" type="checkbox" checked={profile.rewardHapticsEnabled} onChange={(event) => onChange({ ...profile, rewardHapticsEnabled: event.target.checked })} />
        </div>
      </section>
    </PageWrapper>
  );
}