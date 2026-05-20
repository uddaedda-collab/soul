import { Router } from 'express';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { roomStore } from '../services/roomStore.js';

export const mediaRouter = Router();

mediaRouter.use(requireAuth);

mediaRouter.post('/shared', async (req, res, next) => {
  try {
    const body = z.object({
      roomId: z.string(),
      storagePath: z.string(),
      downloadUrl: z.string().url(),
      mimeType: z.string(),
      sizeBytes: z.number().nonnegative()
    }).parse(req.body);

    const room = await roomStore.getRoom(body.roomId);
    if (!room || !room.participants[req.user!.id]) {
      res.status(403).json({ error: 'ROOM_MEMBERSHIP_REQUIRED' });
      return;
    }

    const media = await roomStore.addSharedMedia({
      id: nanoid(),
      roomId: room.id,
      senderId: req.user!.id,
      storagePath: body.storagePath,
      downloadUrl: body.downloadUrl,
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
      createdAt: Date.now()
    });
    res.status(201).json({ media });
  } catch (error) {
    next(error);
  }
});
