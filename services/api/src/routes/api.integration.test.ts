import http, { type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = http.createServer(createApp());
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Could not start test server');
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
});

describe('api integration', () => {
  it('creates profile, room, message history, and report through HTTP', async () => {
    const token = await devToken('Maya');

    const profileResponse = await api<{ profile: { displayName: string } }>('/users/me', {
      token
    });
    expect(profileResponse.profile.displayName).toBe('Maya');

    const created = await api<{ room: { id: string; code: string; title: string } }>('/rooms', {
      token,
      method: 'POST',
      body: {
        title: 'Integration watch',
        mode: 'shared',
        visibility: 'private'
      }
    });
    expect(created.room.title).toBe('Integration watch');

    const joined = await api<{ room: { id: string } }>(`/rooms/${created.room.code}/join`, {
      token,
      method: 'POST',
      body: {}
    });
    expect(joined.room.id).toBe(created.room.id);

    const history = await api<{ messages: unknown[] }>(`/rooms/${created.room.id}/messages`, {
      token
    });
    expect(history.messages).toEqual([]);

    const report = await api<{ report: { status: string; roomId: string } }>('/users/reports', {
      token,
      method: 'POST',
      body: {
        roomId: created.room.id,
        reason: 'Integration safety report'
      }
    });
    expect(report.report.status).toBe('open');
    expect(report.report.roomId).toBe(created.room.id);
  });
});

async function devToken(displayName: string) {
  const response = await api<{ token: string }>('/auth/dev-token', {
    method: 'POST',
    body: { displayName }
  });
  return response.token;
}

async function api<T>(path: string, options: {
  token?: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
} = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const json = await response.json() as T & { error?: string };
  if (!response.ok) {
    throw new Error(json.error ?? `HTTP ${response.status}`);
  }
  return json;
}
