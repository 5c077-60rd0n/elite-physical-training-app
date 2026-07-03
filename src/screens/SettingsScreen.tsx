import { useEffect, useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { getNativeNotificationStatus, type NativeNotificationStatus } from '../native/nativeNotifications';
import type { UserProfile } from '../types';

type HealthSyncSource = 'xml-import' | 'native-foreground' | 'native-manual' | null;

interface HealthSyncStatus {
  lastSyncAt: string | null;
  lastSource: HealthSyncSource;
  importedDays: number;
  lastError: string | null;
}

interface SettingsScreenProps {
  profile: UserProfile;
  onChange: (profile: UserProfile) => void;
  healthSyncStatus: HealthSyncStatus;
}

export function SettingsScreen({ profile, onChange, healthSyncStatus }: SettingsScreenProps) {
  const [notificationStatus, setNotificationStatus] = useState<NativeNotificationStatus | null>(null);

  useEffect(() => {
    void getNativeNotificationStatus().then(setNotificationStatus);
  }, [profile.dailyReminderTime, profile.reminderEnabled]);

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
            <input id="settings-age" className="select-input" type="number" value={profile.age} onChange={(event) => onChange({ ...profile, age: Number(event.target.value) || profile.age })} />
          </div>
          <div>
            <label className="field-label" htmlFor="settings-height">Height (in)</label>
            <input id="settings-height" className="select-input" type="number" value={profile.heightInches} onChange={(event) => onChange({ ...profile, heightInches: Number(event.target.value) || profile.heightInches })} />
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
          <span className="card-kicker">Health sync status</span>
          <strong>{healthSyncStatus.lastSyncAt ? new Date(healthSyncStatus.lastSyncAt).toLocaleString() : 'No sync yet'}</strong>
          <p className="exercise-note">Source: {healthSyncStatus.lastSource ?? 'n/a'} · Imported days: {healthSyncStatus.importedDays}</p>
          <p className="exercise-note">Last error: {healthSyncStatus.lastError ?? 'none'}</p>
        </div>

        <div className="summary-box">
          <span className="card-kicker">On-device HealthKit check</span>
          <strong>Run from the Health screen on your iPhone build</strong>
          <p className="exercise-note">1) Request HealthKit access</p>
          <p className="exercise-note">2) Sync native HealthKit</p>
          <p className="exercise-note">3) Run native diagnostics and confirm same-day read count</p>
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