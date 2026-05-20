# SoulSync

SoulSync is a production-oriented watch party starter kit for long-distance couples. It combines synchronized playback, realtime chat and reactions, WebRTC/Agora-ready calling, Firebase auth/storage, private rooms, and an admin dashboard.

## What Is Included

- `apps/mobile`: React Native + TypeScript Android app using Expo dev tooling.
- `services/api`: Node.js, Express, Socket.IO, Firebase Admin, Redis-ready realtime backend.
- `apps/admin`: Vite React admin dashboard for rooms, users, reports, and analytics.
- `infra/firebase`: Firestore, Storage, and Realtime Database rules.
- `infra/docker`: Docker and compose files for deployment.
- `docs`: Architecture, Firebase setup, sync engine, deployment, and Play Store build notes.

Flutter is not scaffolded because this machine does not have Flutter/Dart installed. The mobile app uses React Native TypeScript, which was one of the requested stack options and can build Android APK/AAB through Expo EAS or native prebuild.

## Quick Start

```powershell
cd C:\Users\shiv\Documents\Codex\SoulSync
npm install
npm run dev:api
npm run dev:admin
npm run dev:mobile
```

Copy the `.env.example` files before running.

## Build Android

```powershell
cd apps/mobile
npm install
npx expo prebuild --platform android
npx expo run:android
```

For Play Store builds, use EAS:

```powershell
npx eas build --platform android --profile production
```

See [docs/ANDROID_BUILD.md](docs/ANDROID_BUILD.md) for signing and release steps.
