import { useCallback, useEffect, useRef } from 'react';
import type { MutableRefObject, RefObject } from 'react';
import type { AVPlaybackStatusSuccess, Video } from 'expo-av';
import { useRoomStore } from '../../store/roomStore';
import { projectedPositionMs } from '../../utils/time';
import type { PlaybackState } from '../../types';

const HARD_DRIFT_MS = 500;
const SOFT_DRIFT_MS = 180;
const SYNC_INTERVAL_MS = 2_000;

export function usePlaybackSync(videoRef: RefObject<Video>) {
  const playback = useRoomStore((state) => state.playback);
  const serverOffsetMs = useRoomStore((state) => state.serverOffsetMs);
  const sendPlayback = useRoomStore((state) => state.sendPlayback);
  const pingSync = useRoomStore((state) => state.pingSync);
  const lastRemoteVersion = useRef(0);
  const applyingRemote = useRef(false);

  useEffect(() => {
    if (!playback || playback.version === lastRemoteVersion.current) {
      return;
    }
    lastRemoteVersion.current = playback.version;
    void applyRemotePlayback(playback, serverOffsetMs, videoRef, applyingRemote);
  }, [playback, serverOffsetMs, videoRef]);

  useEffect(() => {
    const timer = setInterval(async () => {
      const status = await videoRef.current?.getStatusAsync();
      if (!status?.isLoaded) {
        return;
      }
      const envelope = await pingSync(status.positionMillis);
      if (!envelope) {
        return;
      }
      if (envelope.recommendedAction !== 'none') {
        await applyRemotePlayback(envelope.playback, envelope.serverNowMs - Date.now(), videoRef, applyingRemote);
      }
    }, SYNC_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [pingSync, videoRef]);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatusSuccess) => {
    if (applyingRemote.current || !status.isLoaded) {
      return;
    }
    const state = useRoomStore.getState().playback;
    if (!state) {
      return;
    }
    const expected = projectedPositionMs(state, useRoomStore.getState().serverOffsetMs);
    const drift = Math.abs(expected - status.positionMillis);
    if (drift > HARD_DRIFT_MS && state.status === 'playing') {
      void applyRemotePlayback(state, useRoomStore.getState().serverOffsetMs, videoRef, applyingRemote);
    }
  }, [videoRef]);

  const publish = useCallback(async (status: PlaybackState['status'], positionMs: number, speed = 1) => {
    await sendPlayback({ status, positionMs, speed });
  }, [sendPlayback]);

  return { onPlaybackStatusUpdate, publish };
}

async function applyRemotePlayback(
  playback: PlaybackState,
  serverOffsetMs: number,
  videoRef: RefObject<Video>,
  applyingRemote: MutableRefObject<boolean>
) {
  const video = videoRef.current;
  if (!video) {
    return;
  }
  const status = await video.getStatusAsync();
  if (!status.isLoaded) {
    return;
  }
  const expected = projectedPositionMs(playback, serverOffsetMs);
  const drift = Math.abs(status.positionMillis - expected);
  applyingRemote.current = true;
  try {
    if (drift > HARD_DRIFT_MS || playback.status !== (status.isPlaying ? 'playing' : 'paused')) {
      await video.setStatusAsync({
        positionMillis: expected,
        shouldPlay: playback.status === 'playing',
        rate: playback.speed,
        shouldCorrectPitch: true
      });
      return;
    }

    if (drift > SOFT_DRIFT_MS && playback.status === 'playing') {
      const rate = status.positionMillis < expected ? Math.min(1.08, playback.speed + 0.04) : Math.max(0.92, playback.speed - 0.04);
      await video.setRateAsync(rate, true);
      setTimeout(() => {
        void video.setRateAsync(playback.speed, true).catch(() => undefined);
      }, 900);
    }
  } finally {
    setTimeout(() => {
      applyingRemote.current = false;
    }, 160);
  }
}
