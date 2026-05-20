import { http } from './http';

import type { AuthUser } from '../types';

export async function issueDevToken(displayName: string) {
  const { data } = await http.post<{ token: string; tokenType: 'Bearer'; user: AuthUser }>('/auth/dev-token', {
    displayName
  });
  return data;
}
