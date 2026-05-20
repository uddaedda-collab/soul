import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { env } from '../config/env.js';
import { verifyFirebaseToken } from '../config/firebase.js';
import type { AuthUser } from '../models/types.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  try {
    req.user = await userFromRequest(req);
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    req.user = await userFromRequest(req);
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHENTICATED' });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: 'INVALID_TOKEN' });
  }
}

export async function userFromRequest(req: Pick<Request, 'headers'>): Promise<AuthUser | undefined> {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) {
    return undefined;
  }

  const firebaseUser = await verifyFirebaseToken(token);
  if (firebaseUser) {
    return {
      id: firebaseUser.uid,
      displayName: firebaseUser.name ?? firebaseUser.email ?? 'SoulSync User',
      avatarUrl: firebaseUser.picture,
      email: firebaseUser.email,
      isAdmin: firebaseUser.admin === true
    };
  }

  const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  return {
    id: String(decoded.sub),
    displayName: String(decoded.name ?? decoded.email ?? 'SoulSync User'),
    avatarUrl: decoded.picture ? String(decoded.picture) : undefined,
    email: decoded.email ? String(decoded.email) : undefined,
    isAdmin: decoded.admin === true
  };
}

export function issueDevToken(displayName: string, email?: string, isAdmin = false) {
  const userId = `dev_${nanoid(14)}`;
  const token = jwt.sign(
    {
      sub: userId,
      name: displayName,
      email,
      admin: isAdmin
    },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  const user: AuthUser = {
    id: userId,
    displayName,
    email,
    isAdmin
  };
  return {
    token,
    user
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: 'ADMIN_REQUIRED' });
    return;
  }
  next();
}
