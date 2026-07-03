interface RewardCueOptions {
  xpEarned: number;
  leveledUp: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

function playRewardTone(frequency: number, durationMs: number, startTime: number, audioContext: AudioContext) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.06, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationMs / 1000);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + durationMs / 1000);
}

export function triggerRewardCue({ xpEarned, leveledUp, soundEnabled, hapticsEnabled }: RewardCueOptions) {
  if (hapticsEnabled && 'vibrate' in navigator) {
    navigator.vibrate(leveledUp ? [40, 30, 60] : xpEarned >= 140 ? [30, 20, 30] : [25]);
  }

  if (!soundEnabled) {
    return;
  }

  const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) {
    return;
  }

  const audioContext = new AudioCtor();
  const start = audioContext.currentTime;
  if (leveledUp) {
    playRewardTone(660, 130, start, audioContext);
    playRewardTone(880, 150, start + 0.12, audioContext);
    playRewardTone(1100, 190, start + 0.26, audioContext);
  } else {
    playRewardTone(520, 110, start, audioContext);
    playRewardTone(720, 140, start + 0.11, audioContext);
  }

  window.setTimeout(() => {
    void audioContext.close().catch(() => undefined);
  }, 800);
}