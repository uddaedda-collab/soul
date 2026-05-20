import crypto from 'node:crypto';
import { customAlphabet, nanoid } from 'nanoid';
import { env } from '../config/env.js';
import { getFirestore } from '../config/firebase.js';
import type {
  AuthUser,
  ChatMessage,
  CoupleTheme,
  LiveReaction,
  MediaSource,
  PlaybackState,
  RoomMode,
  RoomParticipant,
  RoomVisibility,
  SharedMedia,
  WatchRoom
} from '../models/types.js';

const makeCode = customAlphabet(env.ROOM_CODE_ALPHABET, 6);

const defaultTheme: CoupleTheme = {
  id: 'midnight-rose',
  name: 'Midnight Rose',
  primary: '#ff4f8b',
  accent: '#7c5cff',
  background: '#050509'
};

export interface CreateRoomInput {
  title: string;
  host: AuthUser;
  mode: RoomMode;
  visibility: RoomVisibility;
  password?: string;
  media?: MediaSource;
  theme?: CoupleTheme;
}

export class RoomStore {
  private rooms = new Map<string, WatchRoom>();
  private roomCodeIndex = new Map<string, string>();
  private messages = new Map<string, ChatMessage[]>();
  private sharedMedia = new Map<string, SharedMedia[]>();
  private reactions = new Map<string, LiveReaction[]>();

  async createRoom(input: CreateRoomInput): Promise<WatchRoom> {
    const now = Date.now();
    const id = nanoid();
    const code = this.uniqueCode();
    const playback: PlaybackState = {
      status: input.media ? 'paused' : 'idle',
      positionMs: 0,
      speed: 1,
      media: input.media,
      subtitleTrackId: null,
      volume: 1,
      updatedAtServerMs: now,
      updatedBy: input.host.id,
      version: 1
    };
    const hostParticipant = participantFromUser(input.host, now);
    const room: WatchRoom = {
      id,
      code,
      title: input.title,
      hostId: input.host.id,
      mode: input.mode,
      visibility: input.visibility,
      passwordHash: input.password ? hashPassword(input.password) : undefined,
      inviteToken: nanoid(32),
      createdAt: now,
      updatedAt: now,
      participants: {
        [input.host.id]: hostParticipant
      },
      playback,
      theme: input.theme ?? defaultTheme
    };

    this.rooms.set(id, room);
    this.roomCodeIndex.set(code, id);
    await persistRoom(room);
    return room;
  }

  async getRoom(roomIdOrCode: string): Promise<WatchRoom | null> {
    const byCode = this.roomCodeIndex.get(roomIdOrCode.toUpperCase());
    const id = byCode ?? roomIdOrCode;
    const local = this.rooms.get(id);
    if (local) {
      return local;
    }

    const firestore = getFirestore();
    if (!firestore) {
      return null;
    }

    const byId = await firestore.collection('Rooms').doc(id).get();
    if (byId.exists) {
      const room = byId.data() as WatchRoom;
      this.cacheRoom(room);
      return room;
    }

    const byCodeSnapshot = await firestore.collection('Rooms').where('code', '==', roomIdOrCode.toUpperCase()).limit(1).get();
    if (!byCodeSnapshot.empty) {
      const room = byCodeSnapshot.docs[0]!.data() as WatchRoom;
      this.cacheRoom(room);
      return room;
    }

    return null;
  }

  async listPublicRooms(limit = 24): Promise<WatchRoom[]> {
    const local = [...this.rooms.values()]
      .filter((room) => room.visibility === 'public')
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit);

    if (local.length > 0) {
      return local;
    }

    const firestore = getFirestore();
    if (!firestore) {
      return [];
    }

    const snapshot = await firestore.collection('Rooms')
      .where('visibility', '==', 'public')
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .get();
    return snapshot.docs.map((doc) => doc.data() as WatchRoom);
  }

  async joinRoom(roomIdOrCode: string, user: AuthUser, password?: string): Promise<WatchRoom> {
    const room = await this.getRoom(roomIdOrCode);
    if (!room) {
      throw new Error('ROOM_NOT_FOUND');
    }
    const alreadyParticipant = Boolean(room.participants[user.id]);
    if (!alreadyParticipant && room.passwordHash && !verifyPassword(password ?? '', room.passwordHash)) {
      throw new Error('ROOM_PASSWORD_REQUIRED');
    }

    const now = Date.now();
    room.participants[user.id] = {
      ...(room.participants[user.id] ?? participantFromUser(user, now)),
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      lastSeenAt: now,
      online: true
    };
    room.updatedAt = now;
    await this.saveRoom(room);
    return room;
  }

  async leaveRoom(roomId: string, userId: string): Promise<WatchRoom | null> {
    const room = await this.getRoom(roomId);
    if (!room) {
      return null;
    }

    const participant = room.participants[userId];
    if (participant) {
      participant.online = false;
      participant.lastSeenAt = Date.now();
      room.updatedAt = Date.now();
      await this.saveRoom(room);
    }
    return room;
  }

  async updateParticipant(roomId: string, userId: string, patch: Partial<RoomParticipant>): Promise<WatchRoom | null> {
    const room = await this.getRoom(roomId);
    if (!room || !room.participants[userId]) {
      return null;
    }

    room.participants[userId] = {
      ...room.participants[userId],
      ...patch,
      lastSeenAt: Date.now()
    };
    room.updatedAt = Date.now();
    await this.saveRoom(room);
    return room;
  }

  async updatePlayback(roomId: string, playback: PlaybackState): Promise<WatchRoom> {
    const room = await this.getRoom(roomId);
    if (!room) {
      throw new Error('ROOM_NOT_FOUND');
    }
    room.playback = playback;
    room.updatedAt = Date.now();
    await this.saveRoom(room);
    return room;
  }

  canControl(room: WatchRoom, userId: string): boolean {
    return room.mode === 'shared' || room.hostId === userId;
  }

  async addMessage(message: ChatMessage): Promise<ChatMessage> {
    const list = this.messages.get(message.roomId) ?? [];
    list.push(message);
    this.messages.set(message.roomId, list.slice(-200));
    const firestore = getFirestore();
    if (firestore) {
      await firestore.collection('Messages').doc(message.id).set(message);
    }
    return message;
  }

  async listMessages(roomId: string, limit = 80): Promise<ChatMessage[]> {
    const local = this.messages.get(roomId);
    if (local) {
      return local.slice(-limit);
    }

    const firestore = getFirestore();
    if (!firestore) {
      return [];
    }

    const snapshot = await firestore.collection('Messages')
      .where('roomId', '==', roomId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return snapshot.docs.map((doc) => doc.data() as ChatMessage).reverse();
  }

  async addSharedMedia(media: SharedMedia): Promise<SharedMedia> {
    const list = this.sharedMedia.get(media.roomId) ?? [];
    list.push(media);
    this.sharedMedia.set(media.roomId, list.slice(-80));
    const firestore = getFirestore();
    if (firestore) {
      await firestore.collection('SharedMedia').doc(media.id).set(media);
    }
    return media;
  }

  async addReaction(reaction: LiveReaction): Promise<LiveReaction> {
    const list = this.reactions.get(reaction.roomId) ?? [];
    list.push(reaction);
    this.reactions.set(reaction.roomId, list.slice(-250));
    const firestore = getFirestore();
    if (firestore) {
      await firestore.collection('Reactions').doc(reaction.id).set(reaction);
    }
    return reaction;
  }

  async saveRoom(room: WatchRoom): Promise<void> {
    this.cacheRoom(room);
    await persistRoom(room);
  }

  private cacheRoom(room: WatchRoom): void {
    this.rooms.set(room.id, room);
    this.roomCodeIndex.set(room.code, room.id);
  }

  private uniqueCode(): string {
    for (let i = 0; i < 10; i += 1) {
      const code = makeCode();
      if (!this.roomCodeIndex.has(code)) {
        return code;
      }
    }
    throw new Error('ROOM_CODE_COLLISION');
  }
}

export const roomStore = new RoomStore();

function participantFromUser(user: AuthUser, now: number): RoomParticipant {
  return {
    userId: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    joinedAt: now,
    lastSeenAt: now,
    online: true,
    muted: false,
    cameraEnabled: true
  };
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [algorithm, salt, expected] = stored.split(':');
  if (algorithm !== 'scrypt' || !salt || !expected) {
    return false;
  }
  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  if (actual.length !== expected.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

async function persistRoom(room: WatchRoom): Promise<void> {
  const firestore = getFirestore();
  if (!firestore) {
    return;
  }
  await firestore.collection('Rooms').doc(room.id).set(room, { merge: true });
}
