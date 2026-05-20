import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  PUBLIC_API_URL: z.string().url().default('http://localhost:8080'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:19006'),
  JWT_SECRET: z.string().min(16).default('dev-secret-change-me'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  AGORA_APP_ID: z.string().optional(),
  ROOM_CODE_ALPHABET: z.string().default('ABCDEFGHJKLMNPQRSTUVWXYZ23456789')
});

export const env = schema.parse(process.env);

export const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const isProduction = env.NODE_ENV === 'production';
