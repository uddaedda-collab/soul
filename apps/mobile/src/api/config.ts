export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080';
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? API_URL;
export const PUBLIC_APP_URL = process.env.EXPO_PUBLIC_APP_URL ?? 'https://soulsync.app';
export const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID ?? '';

export const isDevAuthEnabled = __DEV__;
