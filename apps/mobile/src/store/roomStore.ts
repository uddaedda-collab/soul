import { create } from 'zustand';
import { getRoomMessages } from '../api/rooms';
import { getSocket } from '../api/socket';
import { decryptText, encryptText, roomKeyFromSecret } from '../utils/crypto';
import type { ChatMessage, LiveReaction, MediaSource, PlaybackState, SyncEnvelope, WatchRoom } from '../types';

interface RoomState {
  room?: WatchRoom;
  playback?: PlaybackState;
  messages: ChatMessage[];
  reactions: LiveReaction[];
  serverOffsetMs: number;
  chatKey?: Uint8Array;
  typingUsers: Record<string, boolean>;
  connectRoom: (roomIdOrCode: string, password?: string) => Promise<WatchRoom>;
  leaveRoom: () => void;
  sendPlayback: (input: { status: PlaybackState['status']; positionMs: number; speed?: number }) => Promise<void>;
  sendSource: (media: MediaSource) => Promise<void>;
  pingSync: (clientPositionMs?: number) => Promise<SyncEnvelope | undefined>;
  sendMessage: (text: string) => Promise<void>;
  sendMediaMessage: (media: ChatMessage['media'], caption?: string) => Promise<void>;
  sendReaction: (emoji: string, positionMs: number) => void;
  setTyping: (isTyping: boolean) => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  messages: [],
  reactions: [],
  serverOffsetMs: 0,
  typingUsers: {},
  connectRoom: async (roomIdOrCode, password) => {
    const socket = getSocket();
    wireSocketEvents(set, get);
    const room = await emitWithAck<{ room: WatchRoom }>((ack) => {
      socket.emit('room:join', { roomIdOrCode, password }, ack);
    });
    const chatKey = await roomKeyFromSecret(room.room.id, room.room.inviteToken);
    const history = await getRoomMessages(room.room.id).catch(() => []);
    set({
      room: room.room,
      playback: room.room.playback,
      chatKey,
      messages: history.map((message) => decryptMessage(message, chatKey)),
      reactions: []
    });
    return room.room;
  },
  leaveRoom: () => {
    const room = get().room;
    if (room) {
      getSocket().emit('room:leave', { roomId: room.id });
    }
    set({ room: undefined, playback: undefined, messages: [], reactions: [], chatKey: undefined });
  },
  sendPlayback: async (input) => {
    const room = get().room;
    if (!room) {
      return;
    }
    const envelope = await emitWithAck<SyncEnvelope>((ack) => {
      getSocket().emit('sync:update', {
        roomId: room.id,
        status: input.status,
        positionMs: input.positionMs,
        speed: input.speed ?? get().playback?.speed ?? 1,
        clientSentAtMs: Date.now()
      }, ack);
    });
    setSyncEnvelope(set, envelope);
  },
  sendSource: async (media) => {
    const room = get().room;
    if (!room) {
      return;
    }
    const envelope = await emitWithAck<SyncEnvelope>((ack) => {
      getSocket().emit('media:set-source', {
        roomId: room.id,
        media,
        clientSentAtMs: Date.now()
      }, ack);
    });
    setSyncEnvelope(set, envelope);
  },
  pingSync: async (clientPositionMs) => {
    const room = get().room;
    if (!room) {
      return undefined;
    }
    const envelope = await emitWithAck<SyncEnvelope>((ack) => {
      getSocket().emit('sync:ping', { roomId: room.id, clientPositionMs }, ack);
    });
    setSyncEnvelope(set, envelope);
    return envelope;
  },
  sendMessage: async (text) => {
    const room = get().room;
    const key = get().chatKey;
    if (!room || !key || text.trim().length === 0) {
      return;
    }
    const encrypted = encryptText(text.trim(), key);
    const response = await emitWithAck<{ message: ChatMessage }>((ack) => {
      getSocket().emit('chat:send', {
        roomId: room.id,
        encryptedBody: encrypted.encryptedBody,
        nonce: encrypted.nonce,
        type: 'text'
      }, ack);
    });
    set((state) => ({
      messages: upsertMessage(state.messages, decryptMessage(response.message, key))
    }));
  },
  sendMediaMessage: async (media, caption = 'Shared media') => {
    const room = get().room;
    const key = get().chatKey;
    if (!room || !key || !media) {
      return;
    }
    const encrypted = encryptText(caption.trim() || 'Shared media', key);
    const response = await emitWithAck<{ message: ChatMessage }>((ack) => {
      getSocket().emit('chat:send', {
        roomId: room.id,
        encryptedBody: encrypted.encryptedBody,
        nonce: encrypted.nonce,
        type: 'media',
        media
      }, ack);
    });
    set((state) => ({
      messages: upsertMessage(state.messages, decryptMessage(response.message, key))
    }));
  },
  sendReaction: (emoji, positionMs) => {
    const room = get().room;
    if (!room) {
      return;
    }
    getSocket().emit('reaction:send', { roomId: room.id, emoji, positionMs });
  },
  setTyping: (isTyping) => {
    const room = get().room;
    if (room) {
      getSocket().emit('chat:typing', { roomId: room.id, isTyping });
    }
  }
}));

let wiredSocket: ReturnType<typeof getSocket> | null = null;

function wireSocketEvents(set: (partial: Partial<RoomState> | ((state: RoomState) => Partial<RoomState>)) => void, get: () => RoomState) {
  const socket = getSocket();
  if (wiredSocket === socket) {
    return;
  }
  wiredSocket = socket;

  socket.on('room:snapshot', ({ room, serverNowMs }) => {
    void roomKeyFromSecret(room.id, room.inviteToken).then((chatKey) => {
      set({
        room,
        playback: room.playback,
        chatKey,
        serverOffsetMs: serverNowMs - Date.now()
      });
    });
  });

  socket.on('room:participant:update', ({ participant }) => {
    set((state) => state.room
      ? {
          room: {
            ...state.room,
            participants: {
              ...state.room.participants,
              [participant.userId]: participant
            }
          }
        }
      : {});
  });

  socket.on('room:participant:left', ({ userId }) => {
    set((state) => {
      if (!state.room?.participants[userId]) {
        return {};
      }
      return {
        room: {
          ...state.room,
          participants: {
            ...state.room.participants,
            [userId]: {
              ...state.room.participants[userId],
              online: false,
              lastSeenAt: Date.now()
            }
          }
        }
      };
    });
  });

  socket.on('sync:state', (envelope) => {
    setSyncEnvelope(set, envelope);
  });

  socket.on('media:source', ({ playback }) => {
    set({ playback });
  });

  socket.on('chat:message', ({ message }) => {
    const key = get().chatKey;
    set((state) => ({
      messages: upsertMessage(state.messages, key ? decryptMessage(message, key) : message)
    }));
  });

  socket.on('chat:typing', ({ userId, isTyping }) => {
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [userId]: isTyping
      }
    }));
  });

  socket.on('reaction:live', ({ reaction }) => {
    set((state) => ({
      reactions: [...state.reactions, reaction].slice(-40)
    }));
  });
}

function setSyncEnvelope(
  set: (partial: Partial<RoomState> | ((state: RoomState) => Partial<RoomState>)) => void,
  envelope: SyncEnvelope
) {
  set((state) => ({
    playback: envelope.playback,
    serverOffsetMs: envelope.serverNowMs - Date.now(),
    room: state.room ? { ...state.room, playback: envelope.playback } : state.room
  }));
}

function emitWithAck<T>(emit: (ack: (response: T | { error: string }) => void) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    emit((response) => {
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

function decryptMessage(message: ChatMessage, key: Uint8Array): ChatMessage {
  return {
    ...message,
    decryptedBody: decryptText(message.encryptedBody, message.nonce, key)
  };
}

function upsertMessage(messages: ChatMessage[], next: ChatMessage[]) : ChatMessage[];
function upsertMessage(messages: ChatMessage[], next: ChatMessage) : ChatMessage[];
function upsertMessage(messages: ChatMessage[], next: ChatMessage | ChatMessage[]) {
  const additions = Array.isArray(next) ? next : [next];
  const map = new Map(messages.map((message) => [message.id, message]));
  for (const message of additions) {
    map.set(message.id, message);
  }
  return [...map.values()].sort((a, b) => a.createdAt - b.createdAt);
}
