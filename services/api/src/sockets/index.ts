import type { Server as HttpServer } from 'node:http';
import { nanoid } from 'nanoid';
import { Server, type Socket } from 'socket.io';
import { corsOrigins } from '../config/env.js';
import { userFromRequest } from '../middleware/auth.js';
import type { ChatMessage } from '../models/types.js';
import { roomStore } from '../services/roomStore.js';
import { buildPlaybackState, buildSyncEnvelope } from '../services/syncEngine.js';
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from './events.js';

export type SoulSyncSocket = Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>;

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>(httpServer, {
    cors: {
      origin: corsOrigins,
      credentials: true
    },
    pingInterval: 10_000,
    pingTimeout: 8_000,
    transports: ['websocket', 'polling']
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      const user = await userFromRequest({ headers: { authorization: token ? `Bearer ${token}` : undefined } });
      if (!user) {
        next(new Error('UNAUTHENTICATED'));
        return;
      }
      socket.data.userId = user.id;
      socket.data.displayName = user.displayName;
      socket.data.avatarUrl = user.avatarUrl;
      socket.data.isAdmin = user.isAdmin;
      next();
    } catch {
      next(new Error('INVALID_TOKEN'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('room:join', async (payload, ack) => {
      try {
        const user = socketUser(socket);
        const room = await roomStore.joinRoom(payload.roomIdOrCode, user, payload.password);
        await socket.join(room.id);
        io.to(room.id).emit('room:participant:update', {
          roomId: room.id,
          participant: room.participants[user.id]!
        });
        socket.emit('room:snapshot', { room, serverNowMs: Date.now() });
        ack({ room });
      } catch (error) {
        ack({ error: errorMessage(error) });
      }
    });

    socket.on('room:leave', async (payload, ack) => {
      const room = await roomStore.leaveRoom(payload.roomId, socket.data.userId);
      await socket.leave(payload.roomId);
      if (room) {
        io.to(room.id).emit('room:participant:left', { roomId: room.id, userId: socket.data.userId });
      }
      ack?.({ ok: true });
    });

    socket.on('sync:update', async (payload, ack) => {
      try {
        const room = await roomStore.getRoom(payload.roomId);
        if (!room) {
          ack({ error: 'ROOM_NOT_FOUND' });
          return;
        }
        if (!room.participants[socket.data.userId]) {
          ack({ error: 'ROOM_MEMBERSHIP_REQUIRED' });
          return;
        }
        if (!roomStore.canControl(room, socket.data.userId)) {
          socket.emit('sync:denied', { reason: 'HOST_CONTROLLED_ROOM' });
          ack({ error: 'HOST_CONTROLLED_ROOM' });
          return;
        }

        const nextPlayback = buildPlaybackState(room.playback, socket.data.userId, payload);
        await roomStore.updatePlayback(room.id, nextPlayback);
        const envelope = buildSyncEnvelope(nextPlayback);
        io.to(room.id).emit('sync:state', envelope);
        ack(envelope);
      } catch (error) {
        ack({ error: errorMessage(error) });
      }
    });

    socket.on('sync:ping', async (payload, ack) => {
      try {
        const room = await roomStore.getRoom(payload.roomId);
        if (!room) {
          ack({ error: 'ROOM_NOT_FOUND' });
          return;
        }
        ack(buildSyncEnvelope(room.playback, payload.clientPositionMs));
      } catch (error) {
        ack({ error: errorMessage(error) });
      }
    });

    socket.on('media:set-source', async (payload, ack) => {
      try {
        const room = await roomStore.getRoom(payload.roomId);
        if (!room) {
          ack({ error: 'ROOM_NOT_FOUND' });
          return;
        }
        if (!roomStore.canControl(room, socket.data.userId)) {
          ack({ error: 'HOST_CONTROLLED_ROOM' });
          return;
        }
        const playback = buildPlaybackState(
          room.playback,
          socket.data.userId,
          {
            status: 'paused',
            positionMs: 0,
            speed: 1,
            clientSentAtMs: payload.clientSentAtMs
          },
          payload.media
        );
        await roomStore.updatePlayback(room.id, playback);
        const envelope = buildSyncEnvelope(playback);
        io.to(room.id).emit('media:source', { roomId: room.id, playback });
        io.to(room.id).emit('sync:state', envelope);
        ack(envelope);
      } catch (error) {
        ack({ error: errorMessage(error) });
      }
    });

    socket.on('chat:send', async (payload, ack) => {
      try {
        const room = await roomStore.getRoom(payload.roomId);
        if (!room || !room.participants[socket.data.userId]) {
          ack({ error: 'ROOM_MEMBERSHIP_REQUIRED' });
          return;
        }
        const message: ChatMessage = {
          id: nanoid(),
          roomId: room.id,
          senderId: socket.data.userId,
          encryptedBody: payload.encryptedBody,
          nonce: payload.nonce,
          type: payload.type,
          replyToId: payload.replyToId,
          media: payload.media,
          reactions: {},
          createdAt: Date.now()
        };
        await roomStore.addMessage(message);
        io.to(room.id).emit('chat:message', { message });
        ack({ message });
      } catch (error) {
        ack({ error: errorMessage(error) });
      }
    });

    socket.on('chat:typing', (payload) => {
      socket.to(payload.roomId).emit('chat:typing', {
        roomId: payload.roomId,
        userId: socket.data.userId,
        isTyping: payload.isTyping
      });
    });

    socket.on('reaction:send', async (payload) => {
      const room = await roomStore.getRoom(payload.roomId);
      if (!room || !room.participants[socket.data.userId]) {
        return;
      }
      const reaction = await roomStore.addReaction({
        id: nanoid(),
        roomId: room.id,
        senderId: socket.data.userId,
        emoji: payload.emoji.slice(0, 16),
        positionMs: Math.max(0, payload.positionMs),
        createdAt: Date.now()
      });
      io.to(room.id).emit('reaction:live', { reaction });
    });

    socket.on('call:signal', (payload) => {
      const target = payload.toUserId ? findSocketByUser(io, payload.toUserId) : null;
      const event = {
        roomId: payload.roomId,
        fromUserId: socket.data.userId,
        toUserId: payload.toUserId,
        signal: payload.signal
      };
      if (target) {
        target.emit('call:signal', event);
      } else {
        socket.to(payload.roomId).emit('call:signal', event);
      }
    });

    socket.on('call:state', async (payload) => {
      await roomStore.updateParticipant(payload.roomId, socket.data.userId, {
        muted: payload.muted,
        cameraEnabled: payload.cameraEnabled
      });
      io.to(payload.roomId).emit('call:state', {
        roomId: payload.roomId,
        userId: socket.data.userId,
        muted: payload.muted,
        cameraEnabled: payload.cameraEnabled
      });
    });

    socket.on('disconnecting', async () => {
      for (const roomId of socket.rooms) {
        if (roomId === socket.id) {
          continue;
        }
        const room = await roomStore.leaveRoom(roomId, socket.data.userId);
        if (room) {
          socket.to(room.id).emit('room:participant:left', { roomId: room.id, userId: socket.data.userId });
        }
      }
    });
  });

  return io;
}

function socketUser(socket: SoulSyncSocket) {
  return {
    id: socket.data.userId,
    displayName: socket.data.displayName,
    avatarUrl: socket.data.avatarUrl,
    isAdmin: socket.data.isAdmin
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'UNKNOWN_ERROR';
}

function findSocketByUser(
  io: Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>,
  userId: string
): SoulSyncSocket | null {
  for (const socket of io.sockets.sockets.values()) {
    if (socket.data.userId === userId) {
      return socket;
    }
  }
  return null;
}
