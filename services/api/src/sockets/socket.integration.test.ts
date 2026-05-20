import http, { type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { io as createClient, type Socket as ClientSocket } from 'socket.io-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import type { ChatMessage, PlaybackState, WatchRoom } from '../models/types.js';
import { createSocketServer } from './index.js';

let server: HttpServer;
let baseUrl: string;

beforeAll(async () => {
  server = http.createServer(createApp());
  createSocketServer(server);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Could not start socket test server');
  }
  baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
});

describe('socket integration', () => {
  it('runs the live room flow over Socket.IO', async () => {
    const hostToken = await devToken('Maya');
    const guestToken = await devToken('Noah');
    const created = await api<{ room: WatchRoom }>('/rooms', {
      token: hostToken,
      method: 'POST',
      body: {
        title: 'Socket watch',
        mode: 'shared',
        visibility: 'private'
      }
    });

    const host = await connectSocket(hostToken);
    const guest = await connectSocket(guestToken);

    try {
      const guestParticipantUpdate = onceEvent<{ participant: { displayName: string } }>(guest, 'room:participant:update');
      const hostJoin = await emitAck<{ room: WatchRoom }>(host, 'room:join', {
        roomIdOrCode: created.room.id
      });
      expect(hostJoin.room.id).toBe(created.room.id);

      const guestJoin = await emitAck<{ room: WatchRoom }>(guest, 'room:join', {
        roomIdOrCode: created.room.code
      });
      expect(guestJoin.room.participants).toHaveProperty(hostJoin.room.hostId);
      const guestParticipant = Object.values(guestJoin.room.participants).find((participant) => participant.displayName === 'Noah');
      expect(guestParticipant).toBeDefined();
      expect((await guestParticipantUpdate).participant.displayName).toBe('Noah');

      const mediaSource = {
        id: 'hls-test',
        provider: 'external' as const,
        title: 'HLS test stream',
        uri: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        mimeType: 'application/x-mpegURL'
      };
      const hostMediaEvent = onceEvent<{ playback: PlaybackState }>(host, 'media:source');
      const guestSourceSyncEvent = onceEvent<{ playback: PlaybackState }>(guest, 'sync:state');
      const sourceAck = await emitAck<{ playback: PlaybackState }>(host, 'media:set-source', {
        roomId: created.room.id,
        media: mediaSource,
        clientSentAtMs: Date.now()
      });
      expect(sourceAck.playback.media?.id).toBe(mediaSource.id);
      expect((await hostMediaEvent).playback.media?.uri).toBe(mediaSource.uri);
      expect((await guestSourceSyncEvent).playback.media?.id).toBe(mediaSource.id);

      const guestSyncEvent = onceEvent<{ playback: PlaybackState }>(guest, 'sync:state');
      const syncAck = await emitAck<{ playback: PlaybackState }>(host, 'sync:update', {
        roomId: created.room.id,
        status: 'playing',
        positionMs: 12_000,
        speed: 1,
        clientSentAtMs: Date.now()
      });
      expect(syncAck.playback.status).toBe('playing');
      expect((await guestSyncEvent).playback.status).toBe('playing');

      const hostChatEvent = onceEvent<{ message: ChatMessage }>(host, 'chat:message');
      const chatAck = await emitAck<{ message: ChatMessage }>(guest, 'chat:send', {
        roomId: created.room.id,
        encryptedBody: 'ciphertext',
        nonce: 'nonce',
        type: 'text'
      });
      expect(chatAck.message.senderId).toBe(guestParticipant!.userId);
      expect((await hostChatEvent).message.encryptedBody).toBe('ciphertext');

      const hostTypingEvent = onceEvent<{ isTyping: boolean }>(host, 'chat:typing');
      guest.emit('chat:typing', { roomId: created.room.id, isTyping: true });
      expect((await hostTypingEvent).isTyping).toBe(true);

      const hostReactionEvent = onceEvent<{ reaction: { positionMs: number } }>(host, 'reaction:live');
      guest.emit('reaction:send', { roomId: created.room.id, emoji: '<3', positionMs: 12_500 });
      expect((await hostReactionEvent).reaction.positionMs).toBe(12_500);

      const hostCallSignal = onceEvent<{ signal: unknown }>(host, 'call:signal');
      guest.emit('call:signal', {
        roomId: created.room.id,
        toUserId: hostJoin.room.hostId,
        signal: { type: 'offer' }
      });
      expect((await hostCallSignal).signal).toEqual({ type: 'offer' });

      const hostLeaveEvent = onceEvent<{ roomId: string }>(host, 'room:participant:left');
      const leaveAck = await emitAck<{ ok: true }>(guest, 'room:leave', {
        roomId: created.room.id
      });
      expect(leaveAck.ok).toBe(true);
      expect((await hostLeaveEvent).roomId).toBe(created.room.id);
    } finally {
      host.disconnect();
      guest.disconnect();
    }
  });
});

async function connectSocket(token: string) {
  const socket = createClient(baseUrl, {
    auth: { token },
    transports: ['websocket'],
    forceNew: true
  });
  await onceClientConnect(socket);
  return socket;
}

function onceClientConnect(socket: ClientSocket) {
  return new Promise<void>((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
  });
}

function onceEvent<T>(socket: ClientSocket, event: string) {
  return new Promise<T>((resolve) => {
    socket.once(event, resolve);
  });
}

function emitAck<T>(socket: ClientSocket, event: string, payload: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (response: T | { error: string }) => {
      if (isErrorResponse(response)) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });
  });
}

function isErrorResponse<T>(response: T | { error: string }): response is { error: string } {
  return typeof response === 'object' && response !== null && 'error' in response;
}

async function devToken(displayName: string) {
  const response = await api<{ token: string }>('/auth/dev-token', {
    method: 'POST',
    body: { displayName }
  });
  return response.token;
}

async function api<T>(path: string, options: {
  token?: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
} = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const json = await response.json() as T & { error?: string };
  if (!response.ok) {
    throw new Error(json.error ?? `HTTP ${response.status}`);
  }
  return json;
}
