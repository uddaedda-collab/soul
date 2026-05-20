import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { issueDevToken } from '../api/auth';
import { hasFirebaseConfig, requireFirebaseConfig } from '../api/firebaseConfig';
import { getMyProfile, registerPushToken } from '../api/users';
import { registerForPushNotifications } from '../features/notifications/registerPush';
import type { AuthUser, UserProfile } from '../types';

interface AuthState {
  token?: string;
  user?: UserProfile | AuthUser;
  hydrated: boolean;
  signInDev: (displayName: string) => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  registerEmail: (displayName: string, email: string, password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      hydrated: false,
      signInDev: async (displayName) => {
        const session = await issueDevToken(displayName);
        set({ token: session.token, user: session.user });
        await syncProfileAndPush(set);
      },
      signInEmail: async (email, password) => {
        const firebaseAuth = getFirebaseAuth();
        const credential = await firebaseAuth.signInWithEmailAndPassword(email.trim(), password);
        const token = await credential.user.getIdToken();
        set({
          token,
          user: {
            id: credential.user.uid,
            displayName: credential.user.displayName ?? credential.user.email ?? 'SoulSync User',
            avatarUrl: credential.user.photoURL ?? undefined,
            email: credential.user.email ?? undefined
          }
        });
        await syncProfileAndPush(set);
      },
      registerEmail: async (displayName, email, password) => {
        const firebaseAuth = getFirebaseAuth();
        const credential = await firebaseAuth.createUserWithEmailAndPassword(email.trim(), password);
        await credential.user.updateProfile({ displayName });
        const token = await credential.user.getIdToken(true);
        set({
          token,
          user: {
            id: credential.user.uid,
            displayName,
            avatarUrl: credential.user.photoURL ?? undefined,
            email: credential.user.email ?? undefined
          }
        });
        await syncProfileAndPush(set);
      },
      refreshProfile: async () => {
        await syncProfileAndPush(set);
      },
      signOut: async () => {
        if (hasFirebaseConfig) {
          await getFirebaseAuth().signOut().catch(() => undefined);
        }
        set({ token: undefined, user: undefined });
      },
      setHydrated: (hydrated) => set({ hydrated })
    }),
    {
      name: 'soulsync-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      }
    }
  )
);

async function syncProfileAndPush(set: (state: Partial<AuthState>) => void) {
  const profile = await getMyProfile().catch(() => undefined);
  if (profile) {
    set({ user: profile });
  }
  const pushToken = await registerForPushNotifications().catch(() => null);
  if (pushToken) {
    const updated = await registerPushToken(pushToken).catch(() => undefined);
    if (updated) {
      set({ user: updated });
    }
  }
}

function getFirebaseAuth(): FirebaseAuthTypes.Module {
  requireFirebaseConfig();
  const authModule = require('@react-native-firebase/auth') as {
    default: () => FirebaseAuthTypes.Module;
  };
  return authModule.default();
}
