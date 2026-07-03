import { PageWrapper } from '../components/layout/PageWrapper';
import { buildBackupPayload, downloadBackup, downloadMetricsCsv, downloadSessionCsv, parseBackupPayload } from '../lib/backup';
import type { BodyMetricEntry, PhotoCheckIn, ProgressMap, UserProfile } from '../types';

interface BackupScreenProps {
  profile: UserProfile;
  progress: ProgressMap;
  bodyMetrics: BodyMetricEntry[];
  photoCheckIns: PhotoCheckIn[];
  onImport: (payload: {
    profile: UserProfile;
    progress: ProgressMap;
    bodyMetrics: BodyMetricEntry[];
    photoCheckIns: PhotoCheckIn[];
  }) => void;
}

export function BackupScreen({ profile, progress, bodyMetrics, photoCheckIns, onImport }: BackupScreenProps) {
  function exportBackup() {
    downloadBackup(buildBackupPayload(profile, progress, bodyMetrics, photoCheckIns));
  }

  function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const raw = typeof reader.result === 'string' ? reader.result : '';
      const parsed = parseBackupPayload(raw);
      if (!parsed) {
        event.target.value = '';
        return;
      }

      onImport({
        profile: parsed.profile,
        progress: parsed.progress,
        bodyMetrics: parsed.bodyMetrics,
        photoCheckIns: parsed.photoCheckIns,
      });
      event.target.value = '';
    };
    reader.readAsText(file);
  }

  return (
    <PageWrapper
      title="Backup"
      eyebrow="Data"
      description="Export or restore your full local training console, including body metrics, progress logs, and photo check-ins."
    >
      <section className="content-stack second-row">
        <section className="panel form-stack">
          <header className="section-header">
            <div>
              <span className="panel-kicker">Export</span>
              <h2 className="section-title">Download local backup</h2>
            </div>
          </header>
          <p className="panel-subtitle">Creates a JSON backup of profile, progress, body metrics, and photos stored on this device.</p>
          <div className="cta-grid">
            <button className="install-button" onClick={exportBackup}>Export backup</button>
            <button className="secondary-action" onClick={() => downloadMetricsCsv(bodyMetrics)}>Export metrics CSV</button>
            <button className="secondary-action" onClick={() => downloadSessionCsv(progress)}>Export sessions CSV</button>
          </div>
        </section>

        <section className="tracker-panel form-stack">
          <header className="tracker-header">
            <div>
              <span className="panel-kicker">Import</span>
              <h2 className="tracker-title">Restore from file</h2>
            </div>
          </header>
          <p className="panel-subtitle">Importing replaces the current local data with the backup file contents.</p>
          <label className="secondary-action file-button" htmlFor="backup-file">Choose backup file</label>
          <input id="backup-file" className="visually-hidden" type="file" accept="application/json" onChange={handleImport} />
        </section>
      </section>
    </PageWrapper>
  );
}