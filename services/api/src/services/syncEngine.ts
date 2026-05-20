import type { PlaybackState } from '../models/types.js';

export const HARD_DRIFT_MS = 500;
export const SOFT_DRIFT_MS = 180;
export const MAX_CLOCK_SKEW_MS = 15_000;

export interface ClientPlaybackUpdate {
  status: PlaybackState['status'];
  positionMs: number;
  speed?: number;
  clientSentAtMs: number;
  subtitleTrackId?: string | null;
  quality?: string;
  volume?: number;
}

export interface SyncEnvelope {
  playback: PlaybackState;
  serverNowMs: number;
  recommendedAction: 'none' | 'soft-correct' | 'hard-seek';
  expectedPositionMs: number;
  maxAllowedDriftMs: number;
}

export function projectedPosition(state: PlaybackState, nowMs = Date.now()): number {
  if (state.status !== 'playing') {
    return Math.max(0, state.positionMs);
  }
  const elapsedMs = Math.max(0, nowMs - state.updatedAtServerMs);
  return Math.max(0, state.positionMs + elapsedMs * state.speed);
}

export function buildPlaybackState(
  previous: PlaybackState,
  actorId: string,
  update: ClientPlaybackUpdate,
  media: PlaybackState['media'] = previous.media
): PlaybackState {
  const nowMs = Date.now();
  const skewMs = Math.abs(nowMs - update.clientSentAtMs);
  const transitCorrectionMs = skewMs <= MAX_CLOCK_SKEW_MS ? Math.max(0, nowMs - update.clientSentAtMs) : 0;
  const speed = clamp(update.speed ?? previous.speed ?? 1, 0.25, 2);
  const correctedPosition = update.status === 'playing'
    ? update.positionMs + transitCorrectionMs * speed
    : update.positionMs;

  return {
    ...previous,
    status: update.status,
    media,
    positionMs: Math.max(0, correctedPosition),
    speed,
    subtitleTrackId: update.subtitleTrackId ?? previous.subtitleTrackId ?? null,
    quality: update.quality ?? previous.quality,
    volume: update.volume ?? previous.volume,
    updatedAtServerMs: nowMs,
    updatedBy: actorId,
    version: previous.version + 1
  };
}

export function buildSyncEnvelope(playback: PlaybackState, clientPositionMs?: number): SyncEnvelope {
  const serverNowMs = Date.now();
  const expectedPositionMs = projectedPosition(playback, serverNowMs);
  const driftMs = typeof clientPositionMs === 'number'
    ? Math.abs(expectedPositionMs - clientPositionMs)
    : 0;

  let recommendedAction: SyncEnvelope['recommendedAction'] = 'none';
  if (driftMs > HARD_DRIFT_MS) {
    recommendedAction = 'hard-seek';
  } else if (driftMs > SOFT_DRIFT_MS && playback.status === 'playing') {
    recommendedAction = 'soft-correct';
  }

  return {
    playback,
    serverNowMs,
    recommendedAction,
    expectedPositionMs,
    maxAllowedDriftMs: HARD_DRIFT_MS
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
