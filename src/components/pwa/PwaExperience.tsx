import { useState } from 'react';

interface PwaExperienceProps {
  canInstall: boolean;
  onInstall: () => void | Promise<void>;
}

export function PwaExperience({ canInstall, onInstall }: PwaExperienceProps) {
  const [offlineVisible, setOfflineVisible] = useState(true);
  const [installVisible, setInstallVisible] = useState(true);

  return (
    <div className="pwa-stack" aria-live="polite">
      {canInstall && installVisible ? (
        <div className="pwa-toast">
          <p>Install Physical Climb for fast access and a full-screen training console.</p>
          <div className="pwa-actions">
            <button className="install-button" onClick={onInstall}>
              Install App
            </button>
            <button className="secondary-button pwa-dismiss" onClick={() => setInstallVisible(false)}>
              Not now
            </button>
          </div>
        </div>
      ) : null}

      {offlineVisible ? (
        <div className="pwa-toast muted">
          <p>Offline mode is ready. Training plans and logs stay available without internet.</p>
          <div className="pwa-actions">
            <button className="secondary-button pwa-dismiss" onClick={() => setOfflineVisible(false)}>
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}