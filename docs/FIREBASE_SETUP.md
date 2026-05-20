# Firebase Setup

1. Create a Firebase project.
2. Enable Authentication providers:
   - Email/password
   - Google
   - Phone
3. Create Firestore, Storage, and Realtime Database.
4. Copy the rules from `infra/firebase`.
5. Add a service account JSON path to the backend environment via:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
6. Add Firebase config values to `apps/mobile/.env`.
7. Place Android `google-services.json` in the native Android project after Expo prebuild.

Notes:

- Firestore is used for durable room and message storage.
- Realtime Database is optional for presence.
- Storage is intended for avatars and shared media uploads.
