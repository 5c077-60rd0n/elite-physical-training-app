import { useMemo, useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { parseAppleHealthExport } from '../lib/health';
import { getHealthKitBridge } from '../native/healthKitBridge';
import type { HealthMetricEntry } from '../types';

type HealthSyncSource = 'xml-import' | 'native-foreground' | 'native-manual' | null;

interface HealthSyncStatus {
  lastSyncAt: string | null;
  lastSource: HealthSyncSource;
  importedDays: number;
  lastError: string | null;
}

interface NativeDiagnostics {
  nativeAvailable: boolean;
  permissionsGranted: boolean;
  testReadCount: number;
  checkedAt: string;
  error: string | null;
}

interface HealthBridgeScreenProps {
  healthMetrics: HealthMetricEntry[];
  healthSyncStatus: HealthSyncStatus;
  onImportHealthMetrics: (entries: HealthMetricEntry[], source: Exclude<HealthSyncSource, null>) => void;
  onReportSyncError: (source: Exclude<HealthSyncSource, null>, message: string) => void;
}

export function HealthBridgeScreen({ healthMetrics, healthSyncStatus, onImportHealthMetrics, onReportSyncError }: HealthBridgeScreenProps) {
  const [status, setStatus] = useState('');
  const [nativeStatus, setNativeStatus] = useState('');
  const [diagnostics, setDiagnostics] = useState<NativeDiagnostics | null>(null);
  const recentHealth = useMemo(() => healthMetrics.slice(0, 10), [healthMetrics]);
  const nativeBridge = getHealthKitBridge();

  function formatSyncTime(value: string | null) {
    if (!value) {
      return 'No sync yet';
    }
    return new Date(value).toLocaleString();
  }

  function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const raw = typeof reader.result === 'string' ? reader.result : '';
      const parsed = parseAppleHealthExport(raw);
      onImportHealthMetrics(parsed, 'xml-import');
      setStatus(parsed.length ? `Imported ${parsed.length} daily Apple Health entries.` : 'No compatible Apple Health records found.');
      event.target.value = '';
    };
    reader.readAsText(file);
  }

  async function requestNativeHealthAccess() {
    try {
      const result = await nativeBridge.requestHealthPermissions();
      setNativeStatus(result.granted ? 'HealthKit permission granted in native wrapper.' : result.unavailableReason ?? 'HealthKit permission not granted.');
      if (!result.granted) {
        onReportSyncError('native-manual', result.unavailableReason ?? 'HealthKit permission not granted.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not request HealthKit permission.';
      setNativeStatus(message);
      onReportSyncError('native-manual', message);
    }
  }

  async function syncNativeHealth() {
    try {
      const nativeAvailable = await nativeBridge.isNativeAvailable();
      if (!nativeAvailable) {
        const message = 'Native HealthKit bridge is not available in this runtime.';
        setNativeStatus(message);
        onReportSyncError('native-manual', message);
        return;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 13);
      const entries = await nativeBridge.readDailySummaries(startDate.toISOString().slice(0, 10), new Date().toISOString().slice(0, 10));
      onImportHealthMetrics(entries, 'native-manual');
      setNativeStatus(entries.length ? `Synced ${entries.length} HealthKit day summaries from native iOS.` : 'No native HealthKit entries were returned.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Native HealthKit sync failed.';
      setNativeStatus(message);
      onReportSyncError('native-manual', message);
    }
  }

  async function runNativeDiagnostics() {
    try {
      const nativeAvailable = await nativeBridge.isNativeAvailable();
      if (!nativeAvailable) {
        setDiagnostics({
          nativeAvailable: false,
          permissionsGranted: false,
          testReadCount: 0,
          checkedAt: new Date().toISOString(),
          error: 'Native iOS bridge unavailable in current runtime.',
        });
        return;
      }

      const permission = await nativeBridge.requestHealthPermissions();
      let testReadCount = 0;
      let error: string | null = null;

      if (permission.granted) {
        const today = new Date().toISOString().slice(0, 10);
        const entries = await nativeBridge.readDailySummaries(today, today);
        testReadCount = entries.length;
      } else {
        error = permission.unavailableReason ?? 'Permission denied.';
      }

      setDiagnostics({
        nativeAvailable: true,
        permissionsGranted: permission.granted,
        testReadCount,
        checkedAt: new Date().toISOString(),
        error,
      });
    } catch (error) {
      setDiagnostics({
        nativeAvailable: true,
        permissionsGranted: false,
        testReadCount: 0,
        checkedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Diagnostics run failed.',
      });
    }
  }

  return (
    <PageWrapper
      title="Apple Health Bridge"
      eyebrow="Health"
      description="Direct HealthKit sync is not available to a standard web PWA. This bridge imports Apple Health export data locally so steps and body-mass history can still inform the app."
    >
      <section className="content-stack second-row">
        <section className="panel form-stack">
          <header className="section-header">
            <div>
              <span className="panel-kicker">Import</span>
              <h2 className="section-title">Apple Health export.xml</h2>
            </div>
          </header>
          <p className="panel-subtitle">Export your Apple Health data from the Health app, then choose the XML file here. The import stays local on this device.</p>
          <div className="cta-grid">
            <button className="secondary-action" onClick={() => void requestNativeHealthAccess()}>Request HealthKit access</button>
            <button className="secondary-action" onClick={() => void syncNativeHealth()}>Sync native HealthKit</button>
            <button className="secondary-action" onClick={() => void runNativeDiagnostics()}>Run native diagnostics</button>
          </div>
          <label className="secondary-action file-button" htmlFor="health-file">Choose Apple Health XML</label>
          <input id="health-file" className="visually-hidden" type="file" accept=".xml,text/xml,application/xml" onChange={handleImport} />
          {status ? <div className="summary-box"><span className="card-kicker">Status</span><strong>{status}</strong></div> : null}
          {nativeStatus ? <div className="summary-box"><span className="card-kicker">Native sync</span><strong>{nativeStatus}</strong></div> : null}
          <div className="summary-box">
            <span className="card-kicker">Last health sync</span>
            <strong>{formatSyncTime(healthSyncStatus.lastSyncAt)}</strong>
            <p className="exercise-note">Source: {healthSyncStatus.lastSource ?? 'n/a'} · Imported days: {healthSyncStatus.importedDays}</p>
            <p className="exercise-note">Last error: {healthSyncStatus.lastError ?? 'none'}</p>
          </div>
          <div className="summary-box">
            <span className="card-kicker">Native bridge status</span>
            <strong>{nativeBridge instanceof Object ? 'Web fallback active unless a native bridge injects HealthKit methods.' : 'Bridge unavailable'}</strong>
          </div>
          {diagnostics ? (
            <div className="summary-box">
              <span className="card-kicker">Device validation checklist</span>
              <strong>{new Date(diagnostics.checkedAt).toLocaleString()}</strong>
              <p className="exercise-note">Bridge available: {diagnostics.nativeAvailable ? 'yes' : 'no'}</p>
              <p className="exercise-note">Permissions granted: {diagnostics.permissionsGranted ? 'yes' : 'no'}</p>
              <p className="exercise-note">Same-day read count: {diagnostics.testReadCount}</p>
              <p className="exercise-note">Diagnostic error: {diagnostics.error ?? 'none'}</p>
            </div>
          ) : null}
        </section>

        <section className="tracker-panel">
          <header className="tracker-header">
            <div>
              <span className="panel-kicker">Recent health data</span>
              <h2 className="tracker-title">Imported entries</h2>
            </div>
          </header>
          <div className="exercise-list">
            {recentHealth.length ? recentHealth.map((entry) => (
              <article className="exercise-card" key={entry.date}>
                <span className="card-kicker">{entry.date}</span>
                <h3 className="exercise-name">{entry.steps.toLocaleString()} steps</h3>
                <p className="exercise-note">{entry.weightLbs ? `${entry.weightLbs} lb imported weight` : 'No weight record for this day.'}</p>
                <p className="exercise-note">{typeof entry.restingHeartRate === 'number' ? `${entry.restingHeartRate} bpm resting HR` : 'No resting HR record.'}</p>
                <p className="exercise-note">{typeof entry.sleepHours === 'number' ? `${entry.sleepHours.toFixed(1)} h sleep` : 'No sleep record.'}</p>
              </article>
            )) : <article className="exercise-card"><h3 className="exercise-name">No Apple Health data yet</h3><p className="exercise-note">Direct browser sync is not possible, but XML imports let you pull in step and weight history locally.</p></article>}
          </div>
        </section>
      </section>

      <section className="panel">
        <header className="section-header">
          <div>
            <span className="panel-kicker">Native wrapper plan</span>
            <h2 className="section-title">Path to real HealthKit integration</h2>
          </div>
        </header>
        <div className="exercise-list">
          <article className="exercise-card">
            <span className="card-kicker">1. Wrap the app</span>
            <h3 className="exercise-name">Use Capacitor or React Native WebView</h3>
            <p className="exercise-note">Keep the current React app, but ship it inside an iOS shell so the app can request native HealthKit permissions.</p>
          </article>
          <article className="exercise-card">
            <span className="card-kicker">2. Request HealthKit reads</span>
            <h3 className="exercise-name">Read steps, active energy, weight, resting heart rate, and sleep</h3>
            <p className="exercise-note">Those are the highest-value signals for recovery, calorie budgeting, and readiness adjustments in this app.</p>
          </article>
          <article className="exercise-card">
            <span className="card-kicker">3. Sync into local stores</span>
            <h3 className="exercise-name">Map HealthKit data into the existing local models</h3>
            <p className="exercise-note">Step totals can feed nutrition adherence, body-mass can update check-ins, and sleep or RHR can drive readiness messaging.</p>
          </article>
          <article className="exercise-card">
            <span className="card-kicker">4. Device verification</span>
            <h3 className="exercise-name">Run checklist on a physical iPhone in Xcode</h3>
            <p className="exercise-note">Simulator compile confirms plugin wiring, but live HealthKit permissions and records must be verified on a real device.</p>
          </article>
          <article className="exercise-card">
            <span className="card-kicker">Contract</span>
            <h3 className="exercise-name">Use the typed bridge in src/native/healthKitBridge.ts</h3>
            <p className="exercise-note">The native shell should inject window.PhysicalClimbHealthKitBridge with permission requests and daily summary reads so the web app can move beyond XML import cleanly.</p>
          </article>
        </div>
      </section>
    </PageWrapper>
  );
}