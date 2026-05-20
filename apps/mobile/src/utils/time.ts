export function formatDuration(ms?: number) {
  if (!ms || ms < 0) {
    return '0:00';
  }
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function projectedPositionMs(input: {
  status: 'idle' | 'playing' | 'paused' | 'buffering' | 'ended';
  positionMs: number;
  speed: number;
  updatedAtServerMs: number;
}, serverOffsetMs = 0) {
  if (input.status !== 'playing') {
    return input.positionMs;
  }
  const serverNow = Date.now() + serverOffsetMs;
  return Math.max(0, input.positionMs + Math.max(0, serverNow - input.updatedAtServerMs) * input.speed);
}
