import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { roomStore } from '../services/roomStore.js';
import { sendRoomInviteNotification } from '../services/notificationService.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.post('/room-invite', async (req, res, next) => {
  try {
    const body = z.object({
      roomId: z.string().min(1),
      targetUserId: z.string().min(1)
    }).parse(req.body);

    const room = await roomStore.getRoom(body.roomId);
    if (!room) {
      res.status(404).json({ error: 'ROOM_NOT_FOUND' });
      return;
    }
    if (!room.participants[req.user!.id]) {
      res.status(403).json({ error: 'ROOM_MEMBERSHIP_REQUIRED' });
      return;
    }

    const result = await sendRoomInviteNotification({
      room,
      fromDisplayName: req.user!.displayName,
      targetUserId: body.targetUserId
    });
    res.json({ result });
  } catch (error) {
    next(error);
  }
});
