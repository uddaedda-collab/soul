import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { roomStore } from '../services/roomStore.js';

export const roomsRouter = Router();

roomsRouter.use(requireAuth);

roomsRouter.get('/', async (_req, res, next) => {
  try {
    const rooms = await roomStore.listPublicRooms();
    res.json({ rooms });
  } catch (error) {
    next(error);
  }
});

roomsRouter.post('/', async (req, res, next) => {
  try {
    const body = z.object({
      title: z.string().min(1).max(80),
      mode: z.enum(['host', 'shared']).default('host'),
      visibility: z.enum(['private', 'public']).default('private'),
      password: z.string().min(4).max(64).optional(),
      media: z.object({
        id: z.string(),
        provider: z.enum(['youtube', 'netflix', 'drive', 'local', 'external', 'upload']),
        title: z.string(),
        uri: z.string(),
        thumbnailUrl: z.string().optional(),
        durationMs: z.number().optional(),
        mimeType: z.string().optional()
      }).optional(),
      theme: z.object({
        id: z.string(),
        name: z.string(),
        primary: z.string(),
        accent: z.string(),
        background: z.string()
      }).optional()
    }).parse(req.body);

    const room = await roomStore.createRoom({
      ...body,
      host: req.user!
    });
    res.status(201).json({ room });
  } catch (error) {
    next(error);
  }
});

roomsRouter.get('/:roomId', async (req, res, next) => {
  try {
    const room = await roomStore.getRoom(req.params.roomId);
    if (!room) {
      res.status(404).json({ error: 'ROOM_NOT_FOUND' });
      return;
    }
    res.json({ room });
  } catch (error) {
    next(error);
  }
});

roomsRouter.post('/:roomId/join', async (req, res, next) => {
  try {
    const body = z.object({
      password: z.string().optional()
    }).parse(req.body);
    const room = await roomStore.joinRoom(req.params.roomId, req.user!, body.password);
    res.json({ room });
  } catch (error) {
    next(error);
  }
});

roomsRouter.get('/:roomId/messages', async (req, res, next) => {
  try {
    const room = await roomStore.getRoom(req.params.roomId);
    if (!room) {
      res.status(404).json({ error: 'ROOM_NOT_FOUND' });
      return;
    }
    if (!room.participants[req.user!.id]) {
      res.status(403).json({ error: 'ROOM_MEMBERSHIP_REQUIRED' });
      return;
    }
    const messages = await roomStore.listMessages(room.id);
    res.json({ messages });
  } catch (error) {
    next(error);
  }
});
