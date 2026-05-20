import { http } from './http';

export async function sendRoomInvite(input: { roomId: string; targetUserId: string }) {
  const { data } = await http.post<{ result: { sent: number; skipped: number; reason?: string } }>('/notifications/room-invite', input);
  return data.result;
}
