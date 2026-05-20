import type { ChatMessage, LiveReaction, PlaybackState, RoomParticipant, WatchRoom } from '../models/types.js';
import type { SyncEnvelope } from '../services/syncEngine.js';

export interface ServerToClientEvents {
  'room:snapshot': (payload: { room: WatchRoom; serverNowMs: number }) => void;
  'room:participant:update': (payload: { roomId: string; participant: RoomParticipant }) => void;
  'room:participant:left': (payload: { roomId: string; userId: string }) => void;
  'sync:state': (payload: SyncEnvelope) => void;
  'sync:denied': (payload: { reason: string }) => void;
  'chat:message': (payload: { message: ChatMessage }) => void;
  'chat:typing': (payload: { roomId: string; userId: string; isTyping: boolean }) => void;
  'reaction:live': (payload: { reaction: LiveReaction }) => void;
  'call:signal': (payload: { roomId: string; fromUserId: string; toUserId?: string; signal: unknown }) => void;
  'call:state': (payload: { roomId: string; userId: string; muted?: boolean; cameraEnabled?: boolean }) => void;
  'media:source': (payload: { roomId: string; playback: PlaybackState }) => void;
  'error': (payload: { error: string }) => void;
}

export interface ClientToServerEvents {
  'room:join': (payload: { roomIdOrCode: string; password?: string }, ack: Ack<{ room: WatchRoom }>) => void;
  'room:leave': (payload: { roomId: string }, ack?: Ack<{ ok: true }>) => void;
  'sync:update': (
    payload: {
      roomId: string;
      status: PlaybackState['status'];
      positionMs: number;
      speed?: number;
      clientSentAtMs: number;
      subtitleTrackId?: string | null;
      quality?: string;
      volume?: number;
    },
    ack: Ack<SyncEnvelope>
  ) => void;
  'sync:ping': (payload: { roomId: string; clientPositionMs?: number }, ack: Ack<SyncEnvelope>) => void;
  'media:set-source': (
    payload: {
      roomId: string;
      media: NonNullable<PlaybackState['media']>;
      clientSentAtMs: number;
    },
    ack: Ack<SyncEnvelope>
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
    ack: Ack<{ message: ChatMessage }>
  ) => void;
  'chat:typing': (payload: { roomId: string; isTyping: boolean }) => void;
  'reaction:send': (payload: { roomId: string; emoji: string; positionMs: number }) => void;
  'call:signal': (payload: { roomId: string; toUserId?: string; signal: unknown }) => void;
  'call:state': (payload: { roomId: string; muted?: boolean; cameraEnabled?: boolean }) => void;
}

export type Ack<T> = (response: T | { error: string }) => void;

export interface SocketData {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  isAdmin?: boolean;
}
