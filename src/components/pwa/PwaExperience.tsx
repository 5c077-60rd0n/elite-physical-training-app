interface PwaExperienceProps {
  canInstall: boolean;
  onInstall: () => void | Promise<void>;
}

export function PwaExperience({ canInstall, onInstall }: PwaExperienceProps) {
  return (
    <div className="pwa-stack" aria-live="polite">
      {canInstall ? (
        <div className="pwa-toast">
          <p>Install Physical Climb for fast access and a full-screen training console.</p>
          <div className="pwa-actions">
            <button className="install-button" onClick={onInstall}>
              Install App
            </button>
          </div>
        </div>
      ) : null}

      <div className="pwa-toast muted">
        <p>Offline mode is ready. Training plans and logs stay available without internet.</p>
      </div>
    </div>
  );
}