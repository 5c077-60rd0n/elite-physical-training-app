import { Circle, Flame } from 'lucide-react';
import { getTrainingStreak } from '../../lib/analytics';
import type { ProgressMap } from '../../types';

interface HeaderProps {
  progress: ProgressMap;
}

export function Header({ progress }: HeaderProps) {
  const streak = getTrainingStreak(progress);

  return (
    <header className="console-bar sticky-header">
      <div className="console-brand">
        <img className="console-logo" src="/brand/flash-gordon-logo.png" alt="Flash Gordon Pool" />
        <p className="console-label">Physical Climb Training Console</p>
      </div>

      <div className="console-pills" aria-label="App status">
        <span className="console-pill console-pill-gold">
          <Flame size={16} />
          {streak}D
        </span>
        <span className="console-pill console-pill-cyan">
          <Circle size={14} fill="currentColor" />
          Synced
        </span>
      </div>
    </header>
  );
}