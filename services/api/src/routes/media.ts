import { Router } from 'express';
import { nanoid } from 'nanoid';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { roomStore } from '../services/roomStore.js';

export const mediaRouter = Router();

mediaRouter.use(requireAuth);

const maxUploadBytes = 20 * 1024 * 1024;

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

mediaRouter.post('/upload', async (req, res, next) => {
  try {
    const body = z.object({
      roomId: z.string(),
      name: z.string().min(1).max(160),
      mimeType: z.string().min(1).max(120),
      dataBase64: z.string().min(1)
    }).parse(req.body);

    const room = await roomStore.getRoom(body.roomId);
    if (!room || !room.participants[req.user!.id]) {
      res.status(403).json({ error: 'ROOM_MEMBERSHIP_REQUIRED' });
      return;
    }

    const buffer = Buffer.from(body.dataBase64, 'base64');
    if (buffer.byteLength > maxUploadBytes) {
      res.status(413).json({ error: 'UPLOAD_TOO_LARGE', maxBytes: maxUploadBytes });
      return;
    }

    const extension = safeExtension(body.name);
    const id = `${Date.now()}-${nanoid(8)}${extension}`;
    const roomDir = path.join(process.cwd(), 'uploads', room.id);
    await fs.mkdir(roomDir, { recursive: true });
    const storagePath = `uploads/${room.id}/${id}`;
    await fs.writeFile(path.join(roomDir, id), buffer);

    const media = await roomStore.addSharedMedia({
      id: nanoid(),
      roomId: room.id,
      senderId: req.user!.id,
      storagePath,
      downloadUrl: `${env.PUBLIC_API_URL.replace(/\/$/, '')}/${storagePath}`,
      mimeType: body.mimeType,
      sizeBytes: buffer.byteLength,
      createdAt: Date.now()
    });

    res.status(201).json({ media });
  } catch (error) {
    next(error);
  }
});

function safeExtension(name: string) {
  const extension = path.extname(name).toLowerCase().replace(/[^a-z0-9.]/g, '');
  return extension.length <= 12 ? extension : '';
}
