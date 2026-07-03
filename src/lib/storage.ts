import { useEffect, useState } from 'react';
import type { BodyMetricEntry, PhotoCheckIn, ProgressEntry, ProgressMap, UserProfile } from '../types';

const PROGRESS_STORAGE_KEY = 'elite-physical-training-progress';
const PROFILE_STORAGE_KEY = 'elite-physical-training-profile';
const BODY_METRICS_STORAGE_KEY = 'elite-physical-training-body-metrics';
const PHOTO_CHECKINS_STORAGE_KEY = 'elite-physical-training-photo-checkins';

export function createDefaultProfile(): UserProfile {
  return {
    name: 'Scott',
    city: 'Fitchburg, MA',
    programStartDate: new Date().toISOString().slice(0, 10),
    onboardingComplete: false,
    dailyReminderTime: '06:30',
    reminderEnabled: false,
    preferredSessionWindow: 'evening',
    biologicalSex: 'male',
    age: 45,
    heightInches: 70,
    activityLevel: 'moderate',
    rewardSoundEnabled: true,
    rewardHapticsEnabled: true,
  };
}

export function createDefaultProgressEntry(): ProgressEntry {
  return {
    sessionComplete: false,
    supplementsComplete: false,
    recoveryComplete: false,
    rpe: 7,
    notes: '',
    exerciseLogs: {},
  };
}

function readProgress(): ProgressMap {
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as ProgressMap;
    return Object.fromEntries(
      Object.entries(parsed).map(([date, entry]) => [
        date,
        {
          ...createDefaultProgressEntry(),
          ...entry,
          exerciseLogs: entry.exerciseLogs ?? {},
        },
      ]),
    );
  } catch {
    return {};
  }
}

function readProfile(): UserProfile {
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      return createDefaultProfile();
    }

    return { ...createDefaultProfile(), ...(JSON.parse(raw) as Partial<UserProfile>) };
  } catch {
    return createDefaultProfile();
  }
}

function readBodyMetrics(): BodyMetricEntry[] {
  try {
    const raw = window.localStorage.getItem(BODY_METRICS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    return JSON.parse(raw) as BodyMetricEntry[];
  } catch {
    return [];
  }
}

function readPhotoCheckIns(): PhotoCheckIn[] {
  try {
    const raw = window.localStorage.getItem(PHOTO_CHECKINS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    return JSON.parse(raw) as PhotoCheckIn[];
  } catch {
    return [];
  }
}

export function useStoredProgress() {
  const [progress, setProgress] = useState<ProgressMap>(() => readProgress());

  useEffect(() => {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  return [progress, setProgress] as const;
}

export function useStoredProfile() {
  const [profile, setProfile] = useState<UserProfile>(() => readProfile());

  useEffect(() => {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  return [profile, setProfile] as const;
}

export function useStoredBodyMetrics() {
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetricEntry[]>(() => readBodyMetrics());

  useEffect(() => {
    window.localStorage.setItem(BODY_METRICS_STORAGE_KEY, JSON.stringify(bodyMetrics));
  }, [bodyMetrics]);

  return [bodyMetrics, setBodyMetrics] as const;
}

export function useStoredPhotoCheckIns() {
  const [photoCheckIns, setPhotoCheckIns] = useState<PhotoCheckIn[]>(() => readPhotoCheckIns());

  useEffect(() => {
    window.localStorage.setItem(PHOTO_CHECKINS_STORAGE_KEY, JSON.stringify(photoCheckIns));
  }, [photoCheckIns]);

  return [photoCheckIns, setPhotoCheckIns] as const;
}