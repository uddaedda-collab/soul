import admin from 'firebase-admin';
import { getFirebaseApp } from '../config/firebase.js';
import type { WatchRoom } from '../models/types.js';
import { userStore } from './userStore.js';

export interface NotificationResult {
  sent: number;
  skipped: number;
  reason?: string;
}

export async function sendRoomInviteNotification(input: {
  room: WatchRoom;
  fromDisplayName: string;
  targetUserId: string;
}): Promise<NotificationResult> {
  const target = await userStore.getProfile(input.targetUserId);
  if (!target || target.pushTokens.length === 0) {
    return { sent: 0, skipped: 1, reason: 'NO_PUSH_TOKENS' };
  }

  const app = getFirebaseApp();
  if (!app) {
    return { sent: 0, skipped: target.pushTokens.length, reason: 'FIREBASE_NOT_CONFIGURED' };
  }

  const response = await admin.messaging(app).sendEachForMulticast({
    tokens: target.pushTokens,
    notification: {
      title: `${input.fromDisplayName} invited you`,
      body: `Join "${input.room.title}" in SoulSync.`
    },
    data: {
      type: 'room_invite',
      roomId: input.room.id,
      roomCode: input.room.code
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'watch-invites',
        color: '#ff4f8b'
      }
    }
  });

  return {
    sent: response.successCount,
    skipped: response.failureCount
  };
}
