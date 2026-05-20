import { describe, expect, it, vi } from 'vitest';
import { buildPlaybackState, buildSyncEnvelope, projectedPosition } from './syncEngine.js';
import type { PlaybackState } from '../models/types.js';

const baseState: PlaybackState = {
  status: 'paused',
  positionMs: 10_000,
  speed: 1,
  updatedAtServerMs: 1_000_000,
  updatedBy: 'host',
  version: 1
};

describe('syncEngine', () => {
  it('projects playing position using server time', () => {
    expect(projectedPosition({ ...baseState, status: 'playing' }, 1_003_000)).toBe(13_000);
  });

  it('increments version and corrects transit latency', () => {
    vi.setSystemTime(2_000_000);
    const next = buildPlaybackState(baseState, 'host', {
      status: 'playing',
      positionMs: 20_000,
      speed: 1,
      clientSentAtMs: 1_999_900
    });

    expect(next.version).toBe(2);
    expect(next.positionMs).toBe(20_100);
    expect(next.updatedBy).toBe('host');
  });

  it('recommends hard seek above allowed drift', () => {
    vi.setSystemTime(3_000_000);
    const envelope = buildSyncEnvelope({
      ...baseState,
      status: 'playing',
      positionMs: 50_000,
      updatedAtServerMs: 2_999_000
    }, 49_000);

    expect(envelope.recommendedAction).toBe('hard-seek');
  });
});
