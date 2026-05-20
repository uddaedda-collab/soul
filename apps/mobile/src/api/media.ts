import { http } from './http';
import type { SharedMedia } from '../types';

export async function registerSharedMedia(input: Omit<SharedMedia, 'id' | 'createdAt'>) {
  const { data } = await http.post<{ media: SharedMedia }>('/media/shared', input);
  return data.media;
}
