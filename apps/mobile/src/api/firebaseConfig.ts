import Constants from 'expo-constants';

type SoulSyncExpoExtra = {
  firebaseNativeReady?: boolean;
};

const extra = Constants.expoConfig?.extra as SoulSyncExpoExtra | undefined;

export const hasFirebaseNativeConfig = extra?.firebaseNativeReady === true;

export const hasFirebasePublicConfig = Boolean(
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY &&
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET &&
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID
);

export const hasFirebaseConfig = hasFirebasePublicConfig && hasFirebaseNativeConfig;

export const firebaseSetupMessage =
  'Firebase is not configured on this build. Add apps/mobile/.env values and apps/mobile/google-services.json, then rebuild the Android app.';

export function requireFirebaseConfig() {
  if (!hasFirebaseConfig) {
    throw new Error(firebaseSetupMessage);
  }
}
