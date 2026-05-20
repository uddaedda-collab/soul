# Android Build

## Local Dev

```powershell
cd apps/mobile
npm install
npx expo prebuild --platform android
npx expo run:android
```

For Windows PowerShell in this repo, prefer:

```powershell
npm.cmd run prebuild:android
npm.cmd run android
```

## Release

1. Install EAS CLI.
2. Set app identifiers and signing.
3. Build an AAB:

```powershell
npx eas build --platform android --profile production
```

## Required native steps

- Install Java/JDK and Android SDK/ADB, and make them available on PATH.
- Add `apps/mobile/google-services.json` for Firebase native Android features.
- Copy `apps/mobile/.env.example` to `apps/mobile/.env` and fill Firebase public values.
- Set `EXPO_PUBLIC_EAS_PROJECT_ID` in `apps/mobile/.env` before testing Expo push tokens.
- Configure Firebase Auth and Messaging.
- Register the Agora or Jitsi SDK keys if you enable live calls.
- Verify audio, camera, and notification permissions on Android 13+.

`app.config.js` conditionally enables the React Native Firebase native plugins only when `apps/mobile/google-services.json` exists. Dev auth and non-Firebase room flows can run before Firebase is configured; email auth and Firebase Storage upload require the Firebase files/env values.
