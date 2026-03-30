import type { SessionTime } from './types';

export function getSessionDuration(time: SessionTime | null) {
  if (time === '1-min') return 60;
  if (time === '2-min') return 120;
  if (time === '5-min') return 300;
  return null;
}

export function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getSessionTimerColor(remainingSeconds: number | null, totalSeconds: number | null, isUnlimited: boolean) {
  if (isUnlimited || totalSeconds === null || remainingSeconds === null) {
    return '#FFFFFF';
  }

  const ratio = remainingSeconds / totalSeconds;

  if (ratio > 0.6) return '#22C55E';
  if (ratio > 0.3) return '#FACC15';
  if (ratio > 0.1) return '#FB923C';
  return '#EF4444';
}

export function getCountdownColor(value: number) {
  if (value > 3) return '#22C55E';
  if (value > 1) return '#FACC15';
  return '#EF4444';
}
