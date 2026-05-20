import admin from 'firebase-admin';
import { env } from './env.js';

let initialized = false;

export function getFirebaseApp(): admin.app.App | null {
  if (initialized) {
    return admin.app();
  }

  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    return null;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }),
    storageBucket: `${env.FIREBASE_PROJECT_ID}.appspot.com`
  });
  initialized = true;
  return admin.app();
}

export function getFirestore(): admin.firestore.Firestore | null {
  const app = getFirebaseApp();
  return app ? admin.firestore(app) : null;
}

export async function verifyFirebaseToken(idToken?: string) {
  const app = getFirebaseApp();
  if (!app || !idToken) {
    return null;
  }

  return admin.auth(app).verifyIdToken(idToken);
}
