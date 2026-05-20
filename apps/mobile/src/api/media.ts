import { http } from './http';
import type { SharedMedia } from '../types';

export async function registerSharedMedia(input: Omit<SharedMedia, 'id' | 'createdAt'>) {
  const { data } = await http.post<{ media: SharedMedia }>('/media/shared', input);
  return data.media;
}

export async function uploadSharedMedia(input: {
  roomId: string;
  name: string;
  mimeType: string;
  dataBase64: string;
}) {
  const { data } = await http.post<{ media: SharedMedia }>('/media/upload', input);
  return data.media;
}
