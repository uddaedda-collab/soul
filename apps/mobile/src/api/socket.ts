import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './config';
import { useAuthStore } from '../store/authStore';
import type { ChatMessage, LiveReaction, SyncEnvelope, WatchRoom } from '../types';

type ServerEvents = {
  'room:snapshot': (payload: { room: WatchRoom; serverNowMs: number }) => void;
  'room:participant:update': (payload: { roomId: string; participant: WatchRoom['participants'][string] }) => void;
  'room:participant:left': (payload: { roomId: string; userId: string }) => void;
  'sync:state': (payload: SyncEnvelope) => void;
  'sync:denied': (payload: { reason: string }) => void;
  'chat:message': (payload: { message: ChatMessage }) => void;
  'chat:typing': (payload: { roomId: string; userId: string; isTyping: boolean }) => void;
  'reaction:live': (payload: { reaction: LiveReaction }) => void;
  'call:signal': (payload: { roomId: string; fromUserId: string; toUserId?: string; signal: unknown }) => void;
  'call:state': (payload: { roomId: string; userId: string; muted?: boolean; cameraEnabled?: boolean }) => void;
  'media:source': (payload: { roomId: string; playback: SyncEnvelope['playback'] }) => void;
  error: (payload: { error: string }) => void;
};

type ClientEvents = {
  'room:join': (
    payload: { roomIdOrCode: string; password?: string },
    ack: (response: { room: WatchRoom } | { error: string }) => void
  ) => void;
  'room:leave': (payload: { roomId: string }, ack?: (response: { ok: true }) => void) => void;
  'sync:update': (
    payload: {
      roomId: string;
      status: SyncEnvelope['playback']['status'];
      positionMs: number;
      speed?: number;
      clientSentAtMs: number;
      subtitleTrackId?: string | null;
      quality?: string;
      volume?: number;
    },
    ack: (response: SyncEnvelope | { error: string }) => void
  ) => void;
  'sync:ping': (
    payload: { roomId: string; clientPositionMs?: number },
    ack: (response: SyncEnvelope | { error: string }) => void
  ) => void;
  'media:set-source': (
    payload: { roomId: string; media: SyncEnvelope['playback']['media']; clientSentAtMs: number },
    ack: (response: SyncEnvelope | { error: string }) => void
  ) => void;
  'chat:send': (
    payload: {
      roomId: string;
      encryptedBody: string;
      nonce: string;
      type: ChatMessage['type'];
      replyToId?: string;
      media?: ChatMessage['media'];
    },
    ack: (response: { message: ChatMessage } | { error: string }) => void
  ) => void;
  'chat:typing': (payload: { roomId: string; isTyping: boolean }) => void;
  'reaction:send': (payload: { roomId: string; emoji: string; positionMs: number }) => void;
  'call:signal': (payload: { roomId: string; toUserId?: string; signal: unknown }) => void;
  'call:state': (payload: { roomId: string; muted?: boolean; cameraEnabled?: boolean }) => void;
};

let socket: Socket<ServerEvents, ClientEvents> | null = null;

export function getSocket() {
  const token = useAuthStore.getState().token;
  if (!socket || (socket.auth as { token?: string } | undefined)?.token !== token) {
    socket?.disconnect();
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4_000
    });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
