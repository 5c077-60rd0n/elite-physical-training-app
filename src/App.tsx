import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { BottomNav } from './components/layout/BottomNav';
import { Header } from './components/layout/Header';
import { PwaExperience } from './components/pwa/PwaExperience';
import { buildWeekPlan } from './lib/training';
import { isSameIsoDate, todayIso } from './lib/date';
import { mergeHealthWeightsIntoBodyMetrics } from './lib/health';
import { getHealthKitBridge } from './native/healthKitBridge';
import { syncDailyTrainingReminder } from './native/nativeNotifications';
import { createDefaultProgressEntry, useStoredBodyMetrics, useStoredHealthMetrics, useStoredPhotoCheckIns, useStoredProfile, useStoredProgress } from './lib/storage';
import { DashboardScreen } from './screens/DashboardScreen';
import { BackupScreen } from './screens/BackupScreen';
import { HealthBridgeScreen } from './screens/HealthBridgeScreen';
import { MoreScreen } from './screens/MoreScreen';
import { NutritionScreen } from './screens/NutritionScreen';
import { Onboarding } from './screens/Onboarding';
import { ProgressScreen } from './screens/ProgressScreen';
import { ScienceScreen } from './screens/ScienceScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { TodaySessionScreen } from './screens/TodaySessionScreen';
import { WeeklyScheduleScreen } from './screens/WeeklyScheduleScreen';
import type { BodyMetricEntry, HealthMetricEntry, PhotoCheckIn, ProgressEntry } from './types';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface HealthSyncStatus {
  lastSyncAt: string | null;
  lastSource: 'xml-import' | 'native-foreground' | 'native-manual' | null;
  importedDays: number;
  lastError: string | null;
}

export default function App() {
  const [profile, setProfile] = useStoredProfile();
  const [progress, setProgress] = useStoredProgress();
  const [bodyMetrics, setBodyMetrics] = useStoredBodyMetrics();
  const [photoCheckIns, setPhotoCheckIns] = useStoredPhotoCheckIns();
  const [healthMetrics, setHealthMetrics] = useStoredHealthMetrics();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [healthSyncStatus, setHealthSyncStatus] = useState<HealthSyncStatus>({
    lastSyncAt: null,
    lastSource: null,
    importedDays: 0,
    lastError: null,
  });

  const plan = useMemo(() => buildWeekPlan(new Date()), []);
  const healthKitBridge = useMemo(() => getHealthKitBridge(), []);
  const today = todayIso();
  const currentDay = plan.find((day) => isSameIsoDate(day.dateIso, today)) ?? plan[0];
  const [trackedDate, setTrackedDate] = useState(currentDay.dateIso);

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  useEffect(() => {
    if (!plan.some((day) => day.dateIso === trackedDate)) {
      setTrackedDate(currentDay.dateIso);
    }
  }, [currentDay.dateIso, plan, trackedDate]);

  useEffect(() => {
    void syncDailyTrainingReminder(profile.reminderEnabled, profile.dailyReminderTime);
  }, [profile.dailyReminderTime, profile.reminderEnabled]);

  useEffect(() => {
    if (!profile.onboardingComplete) {
      return;
    }

    let disposed = false;

    async function syncNativeHealthOnForeground() {
      try {
        const nativeAvailable = await healthKitBridge.isNativeAvailable();
        if (!nativeAvailable || disposed) {
          return;
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 13);
        const entries = await healthKitBridge.readDailySummaries(
          startDate.toISOString().slice(0, 10),
          new Date().toISOString().slice(0, 10),
        );

        if (disposed || !entries.length) {
          setHealthSyncStatus((current) => ({
            ...current,
            lastSyncAt: new Date().toISOString(),
            lastSource: 'native-foreground',
            importedDays: 0,
            lastError: null,
          }));
          return;
        }

        setHealthMetrics((current) => {
          const byDate = new Map(current.map((entry) => [entry.date, entry]));
          entries.forEach((entry) => byDate.set(entry.date, entry));
          return [...byDate.values()].sort((left, right) => right.date.localeCompare(left.date));
        });
        setBodyMetrics((current) => mergeHealthWeightsIntoBodyMetrics(current, entries));
        setHealthSyncStatus({
          lastSyncAt: new Date().toISOString(),
          lastSource: 'native-foreground',
          importedDays: entries.length,
          lastError: null,
        });
      } catch (error) {
        if (!disposed) {
          setHealthSyncStatus((current) => ({
            ...current,
            lastSyncAt: new Date().toISOString(),
            lastSource: 'native-foreground',
            importedDays: 0,
            lastError: error instanceof Error ? error.message : 'Native foreground sync failed.',
          }));
        }
      }
    }

    function handleVisibilityOrFocus() {
      if (document.visibilityState === 'hidden') {
        return;
      }
      void syncNativeHealthOnForeground();
    }

    void syncNativeHealthOnForeground();
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      disposed = true;
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [healthKitBridge, profile.onboardingComplete, setBodyMetrics, setHealthMetrics]);

  const updateProgress = (dateIso: string, partial: Partial<ProgressEntry>) => {
    setProgress((current) => ({
      ...current,
      [dateIso]: {
        ...(current[dateIso] ?? createDefaultProgressEntry()),
        ...partial,
      },
    }));
  };

  const updateBodyMetric = (entry: BodyMetricEntry, previousDate?: string) => {
    setBodyMetrics((current) => {
      const next = current.filter((item) => item.date !== (previousDate ?? entry.date));
      next.push(entry);
      return next.sort((left, right) => right.date.localeCompare(left.date));
    });
  };

  const deleteBodyMetric = (date: string) => {
    setBodyMetrics((current) => current.filter((item) => item.date !== date));
  };

  const photoKey = (entry: PhotoCheckIn) => `${entry.date}-${entry.imageDataUrl.slice(0, 32)}`;

  const savePhotoCheckIn = (entry: PhotoCheckIn) => {
    setPhotoCheckIns((current) => {
      const next = current.filter((item) => !(item.date === entry.date && item.imageDataUrl === entry.imageDataUrl));
      next.push(entry);
      return next.sort((left, right) => right.date.localeCompare(left.date));
    });
  };

  const updatePhotoCheckIn = (key: string, entry: PhotoCheckIn) => {
    setPhotoCheckIns((current) => {
      const next = current.filter((item) => photoKey(item) !== key);
      next.push(entry);
      return next.sort((left, right) => right.date.localeCompare(left.date));
    });
  };

  const deletePhotoCheckIn = (key: string) => {
    setPhotoCheckIns((current) => current.filter((item) => photoKey(item) !== key));
  };

  const importHealthMetrics = (entries: HealthMetricEntry[], source: HealthSyncStatus['lastSource']) => {
    setHealthMetrics((current) => {
      const byDate = new Map(current.map((entry) => [entry.date, entry]));
      entries.forEach((entry) => byDate.set(entry.date, entry));
      return [...byDate.values()].sort((left, right) => right.date.localeCompare(left.date));
    });
    setBodyMetrics((current) => mergeHealthWeightsIntoBodyMetrics(current, entries));
    setHealthSyncStatus({
      lastSyncAt: new Date().toISOString(),
      lastSource: source,
      importedDays: entries.length,
      lastError: null,
    });
  };

  const reportHealthSyncError = (source: HealthSyncStatus['lastSource'], message: string) => {
    setHealthSyncStatus((current) => ({
      ...current,
      lastSyncAt: new Date().toISOString(),
      lastSource: source,
      importedDays: 0,
      lastError: message,
    }));
  };

  const importBackup = (payload: {
    profile: typeof profile;
    progress: typeof progress;
    bodyMetrics: typeof bodyMetrics;
    photoCheckIns: typeof photoCheckIns;
  }) => {
    setProfile(payload.profile);
    setProgress(payload.progress);
    setBodyMetrics(payload.bodyMetrics);
    setPhotoCheckIns(payload.photoCheckIns);
  };

  const promptInstall = async () => {
    if (!installEvent) {
      return;
    }

    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  return (
    <BrowserRouter>
      <div className="app-shell app-shell-routed">
        <Header progress={progress} />
        <div className="route-frame">
          <Routes>
            {!profile.onboardingComplete ? (
              <>
                <Route path="/onboarding" element={<Onboarding profile={profile} onComplete={setProfile} />} />
                <Route path="*" element={<Navigate to="/onboarding" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<DashboardScreen day={currentDay} plan={plan} progress={progress} profile={profile} bodyMetrics={bodyMetrics} photoCheckIns={photoCheckIns} healthMetrics={healthMetrics} />} />
                <Route path="/today" element={<TodaySessionScreen day={currentDay} entry={progress[currentDay.dateIso] ?? createDefaultProgressEntry()} profile={profile} bodyMetrics={bodyMetrics} healthMetrics={healthMetrics} onChange={(partial) => updateProgress(currentDay.dateIso, partial)} />} />
                <Route path="/schedule" element={<WeeklyScheduleScreen plan={plan} selectedDate={trackedDate} onSelect={setTrackedDate} progress={progress} profile={profile} />} />
                <Route path="/progress" element={<ProgressScreen plan={plan} progress={progress} bodyMetrics={bodyMetrics} onSaveMetric={updateBodyMetric} onDeleteMetric={deleteBodyMetric} photoCheckIns={photoCheckIns} onSavePhotoCheckIn={savePhotoCheckIn} onUpdatePhotoCheckIn={updatePhotoCheckIn} onDeletePhotoCheckIn={deletePhotoCheckIn} />} />
                <Route path="/nutrition" element={<NutritionScreen day={currentDay} profile={profile} bodyMetrics={bodyMetrics} healthMetrics={healthMetrics} />} />
                <Route path="/health" element={<HealthBridgeScreen healthMetrics={healthMetrics} healthSyncStatus={healthSyncStatus} onImportHealthMetrics={importHealthMetrics} onReportSyncError={reportHealthSyncError} />} />
                <Route path="/science" element={<ScienceScreen />} />
                <Route path="/backup" element={<BackupScreen profile={profile} progress={progress} bodyMetrics={bodyMetrics} photoCheckIns={photoCheckIns} onImport={importBackup} />} />
                <Route path="/settings" element={<SettingsScreen profile={profile} onChange={setProfile} healthSyncStatus={healthSyncStatus} />} />
                <Route path="/more" element={<MoreScreen />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </div>
        {profile.onboardingComplete ? <BottomNav /> : null}
        <PwaExperience canInstall={Boolean(installEvent)} onInstall={promptInstall} />
      </div>
    </BrowserRouter>
  );
}