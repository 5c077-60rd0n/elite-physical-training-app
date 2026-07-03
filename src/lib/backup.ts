import type { BodyMetricEntry, PhotoCheckIn, ProgressMap, UserProfile } from '../types';

export interface AppBackupPayload {
  version: 1;
  exportedAt: string;
  profile: UserProfile;
  progress: ProgressMap;
  bodyMetrics: BodyMetricEntry[];
  photoCheckIns: PhotoCheckIn[];
}

export function buildBackupPayload(
  profile: UserProfile,
  progress: ProgressMap,
  bodyMetrics: BodyMetricEntry[],
  photoCheckIns: PhotoCheckIn[],
): AppBackupPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile,
    progress,
    bodyMetrics,
    photoCheckIns,
  };
}

export function downloadBackup(payload: AppBackupPayload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `physical-climb-backup-${payload.exportedAt.slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadTextFile(contents: string, filename: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadMetricsCsv(bodyMetrics: BodyMetricEntry[]) {
  const header = ['date', 'weight_lbs', 'waist_inches', 'body_fat_percent', 'note'];
  const rows = bodyMetrics.map((entry) => [
    entry.date,
    String(entry.weightLbs),
    String(entry.waistInches),
    typeof entry.bodyFatPercent === 'number' ? String(entry.bodyFatPercent) : '',
    JSON.stringify(entry.note),
  ]);
  const csv = [header, ...rows].map((row) => row.join(',')).join('\n');
  downloadTextFile(csv, `physical-climb-body-metrics-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
}

export function downloadSessionCsv(progress: ProgressMap) {
  const header = ['date', 'session_complete', 'supplements_complete', 'recovery_complete', 'rpe', 'exercise_logs', 'notes'];
  const rows = Object.entries(progress)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, entry]) => [
      date,
      String(entry.sessionComplete),
      String(entry.supplementsComplete),
      String(entry.recoveryComplete),
      String(entry.rpe),
      String(Object.keys(entry.exerciseLogs ?? {}).length),
      JSON.stringify(entry.notes),
    ]);
  const csv = [header, ...rows].map((row) => row.join(',')).join('\n');
  downloadTextFile(csv, `physical-climb-session-log-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
}

export function parseBackupPayload(raw: string): AppBackupPayload | null {
  try {
    const parsed = JSON.parse(raw) as Partial<AppBackupPayload>;
    if (parsed.version !== 1 || !parsed.profile || !parsed.progress || !parsed.bodyMetrics || !parsed.photoCheckIns) {
      return null;
    }

    return parsed as AppBackupPayload;
  } catch {
    return null;
  }
}