import { Router } from 'express';
import { z } from 'zod';
import { isProduction } from '../config/env.js';
import { issueDevToken } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/dev-token', (req, res) => {
  if (isProduction) {
    res.status(404).json({ error: 'NOT_FOUND' });
    return;
  }

  const body = z.object({
    displayName: z.string().min(1).max(60),
    email: z.string().email().optional(),
    admin: z.boolean().optional()
  }).parse(req.body);

  res.json({
    ...issueDevToken(body.displayName, body.email, body.admin),
    tokenType: 'Bearer'
  });
});
