import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { userStore } from '../services/userStore.js';

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get('/me', async (req, res, next) => {
  try {
    const profile = await userStore.getOrCreateProfile(req.user!);
    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

usersRouter.patch('/me', async (req, res, next) => {
  try {
    const body = z.object({
      displayName: z.string().min(1).max(60).optional(),
      avatarUrl: z.string().url().optional(),
      bio: z.string().max(160).optional(),
      favoriteGenres: z.array(z.string().min(1).max(32)).max(12).optional(),
      relationshipStatus: z.enum(['dating', 'engaged', 'married', 'private']).optional()
    }).parse(req.body);
    const profile = await userStore.updateProfile(req.user!, body);
    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

usersRouter.post('/me/push-token', async (req, res, next) => {
  try {
    const body = z.object({
      token: z.string().min(12).max(512)
    }).parse(req.body);
    const profile = await userStore.setPushToken(req.user!, body.token);
    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

usersRouter.post('/block', async (req, res, next) => {
  try {
    const body = z.object({
      targetUserId: z.string().min(1)
    }).parse(req.body);
    const profile = await userStore.blockUser(req.user!, body.targetUserId);
    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

usersRouter.post('/unblock', async (req, res, next) => {
  try {
    const body = z.object({
      targetUserId: z.string().min(1)
    }).parse(req.body);
    const profile = await userStore.unblockUser(req.user!, body.targetUserId);
    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

usersRouter.post('/reports', async (req, res, next) => {
  try {
    const body = z.object({
      targetUserId: z.string().optional(),
      roomId: z.string().optional(),
      messageId: z.string().optional(),
      reason: z.string().min(4).max(500)
    }).parse(req.body);
    const report = await userStore.createReport({
      reporterId: req.user!.id,
      ...body
    });
    res.status(201).json({ report });
  } catch (error) {
    next(error);
  }
});
