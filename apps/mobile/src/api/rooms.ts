import { http } from './http';
import type { ChatMessage, MediaSource, RoomMode, RoomVisibility, WatchRoom } from '../types';

export async function createRoom(input: {
  title: string;
  mode: RoomMode;
  visibility: RoomVisibility;
  password?: string;
  media?: MediaSource;
}) {
  const { data } = await http.post<{ room: WatchRoom }>('/rooms', input);
  return data.room;
}

export async function joinRoom(roomIdOrCode: string, password?: string) {
  const { data } = await http.post<{ room: WatchRoom }>(`/rooms/${roomIdOrCode}/join`, { password });
  return data.room;
}

export async function listPublicRooms() {
  const { data } = await http.get<{ rooms: WatchRoom[] }>('/rooms');
  return data.rooms;
}

export async function getRoom(roomId: string) {
  const { data } = await http.get<{ room: WatchRoom }>(`/rooms/${roomId}`);
  return data.room;
}

export async function getRoomMessages(roomId: string) {
  const { data } = await http.get<{ messages: ChatMessage[] }>(`/rooms/${roomId}/messages`);
  return data.messages;
}
