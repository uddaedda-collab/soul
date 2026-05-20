import { http } from './http';
import type { UserProfile } from '../types';

export async function getMyProfile() {
  const { data } = await http.get<{ profile: UserProfile }>('/users/me');
  return data.profile;
}

export async function updateMyProfile(input: {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  favoriteGenres?: string[];
  relationshipStatus?: UserProfile['relationshipStatus'];
}) {
  const { data } = await http.patch<{ profile: UserProfile }>('/users/me', input);
  return data.profile;
}

export async function registerPushToken(token: string) {
  const { data } = await http.post<{ profile: UserProfile }>('/users/me/push-token', { token });
  return data.profile;
}

export async function blockUser(targetUserId: string) {
  const { data } = await http.post<{ profile: UserProfile }>('/users/block', { targetUserId });
  return data.profile;
}

export async function unblockUser(targetUserId: string) {
  const { data } = await http.post<{ profile: UserProfile }>('/users/unblock', { targetUserId });
  return data.profile;
}

export async function reportSafetyIssue(input: {
  targetUserId?: string;
  roomId?: string;
  messageId?: string;
  reason: string;
}) {
  const { data } = await http.post<{ report: { id: string; status: string } }>('/users/reports', input);
  return data.report;
}
