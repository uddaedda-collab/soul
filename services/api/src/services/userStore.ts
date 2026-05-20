import { nanoid } from 'nanoid';
import { getFirestore } from '../config/firebase.js';
import type { AuthUser, Report, UserProfile } from '../models/types.js';

const users = new Map<string, UserProfile>();
const reports = new Map<string, Report>();

export interface UpdateProfileInput {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  favoriteGenres?: string[];
  relationshipStatus?: UserProfile['relationshipStatus'];
}

export class UserStore {
  async getOrCreateProfile(user: AuthUser): Promise<UserProfile> {
    const existing = await this.getProfile(user.id);
    if (existing) {
      return existing;
    }

    const now = Date.now();
    const profile: UserProfile = {
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      email: user.email,
      isAdmin: user.isAdmin,
      favoriteGenres: [],
      online: true,
      pushTokens: [],
      blockedUserIds: [],
      watchStats: {
        totalMinutes: 0,
        roomsCreated: 0,
        reactionsSent: 0,
        currentStreakDays: 0
      },
      reminders: [],
      createdAt: now,
      updatedAt: now
    };
    await this.saveProfile(profile);
    return profile;
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const local = users.get(userId);
    if (local) {
      return local;
    }

    const firestore = getFirestore();
    if (!firestore) {
      return null;
    }

    const doc = await firestore.collection('Users').doc(userId).get();
    if (!doc.exists) {
      return null;
    }
    const profile = doc.data() as UserProfile;
    users.set(profile.id, profile);
    return profile;
  }

  async updateProfile(user: AuthUser, input: UpdateProfileInput): Promise<UserProfile> {
    const current = await this.getOrCreateProfile(user);
    const next: UserProfile = {
      ...current,
      displayName: input.displayName ?? current.displayName,
      avatarUrl: input.avatarUrl ?? current.avatarUrl,
      bio: input.bio ?? current.bio,
      favoriteGenres: input.favoriteGenres ?? current.favoriteGenres,
      relationshipStatus: input.relationshipStatus ?? current.relationshipStatus,
      updatedAt: Date.now()
    };
    await this.saveProfile(next);
    return next;
  }

  async setPushToken(user: AuthUser, token: string): Promise<UserProfile> {
    const current = await this.getOrCreateProfile(user);
    const next: UserProfile = {
      ...current,
      pushTokens: [...new Set([...current.pushTokens, token])],
      updatedAt: Date.now()
    };
    await this.saveProfile(next);
    return next;
  }

  async blockUser(user: AuthUser, targetUserId: string): Promise<UserProfile> {
    const current = await this.getOrCreateProfile(user);
    const next: UserProfile = {
      ...current,
      blockedUserIds: [...new Set([...current.blockedUserIds, targetUserId])],
      updatedAt: Date.now()
    };
    await this.saveProfile(next);
    return next;
  }

  async unblockUser(user: AuthUser, targetUserId: string): Promise<UserProfile> {
    const current = await this.getOrCreateProfile(user);
    const next: UserProfile = {
      ...current,
      blockedUserIds: current.blockedUserIds.filter((id) => id !== targetUserId),
      updatedAt: Date.now()
    };
    await this.saveProfile(next);
    return next;
  }

  async createReport(input: {
    reporterId: string;
    targetUserId?: string;
    roomId?: string;
    messageId?: string;
    reason: string;
  }): Promise<Report> {
    const report: Report = {
      id: nanoid(),
      reporterId: input.reporterId,
      targetUserId: input.targetUserId,
      roomId: input.roomId,
      messageId: input.messageId,
      reason: input.reason,
      status: 'open',
      createdAt: Date.now()
    };
    reports.set(report.id, report);

    const firestore = getFirestore();
    if (firestore) {
      await firestore.collection('Reports').doc(report.id).set(report);
    }
    return report;
  }

  async listReports(limit = 50): Promise<Report[]> {
    const local = [...reports.values()].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
    if (local.length > 0) {
      return local;
    }

    const firestore = getFirestore();
    if (!firestore) {
      return [];
    }
    const snapshot = await firestore.collection('Reports').orderBy('createdAt', 'desc').limit(limit).get();
    return snapshot.docs.map((doc) => doc.data() as Report);
  }

  private async saveProfile(profile: UserProfile): Promise<void> {
    users.set(profile.id, profile);
    const firestore = getFirestore();
    if (firestore) {
      await firestore.collection('Users').doc(profile.id).set(profile, { merge: true });
    }
  }
}

export const userStore = new UserStore();
