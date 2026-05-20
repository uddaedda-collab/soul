# Resume Instructions

Use this when continuing SoulSync after laptop restart, new chat, provider change, or fresh setup.

## Open Project

```powershell
cd C:\Users\shiv\Documents\Codex\SoulSync
```

If the repo is mounted elsewhere in a future session, use that path only if it actually exists in the environment.

## Install Dependencies

```powershell
npm.cmd install
```

Use `npm.cmd`, not `npm`, because PowerShell script execution may block `npm.ps1`.

## Environment Files

Copy examples:

```powershell
Copy-Item services\api\.env.example services\api\.env
Copy-Item apps\mobile\.env.example apps\mobile\.env
Copy-Item apps\admin\.env.example apps\admin\.env
```

Fill real values locally:

- Firebase project id/client email/private key in `services/api/.env`.
- Mobile Firebase public config in `apps/mobile/.env`.
- Agora app id in `apps/mobile/.env`.
- EAS project id in `apps/mobile/.env` as `EXPO_PUBLIC_EAS_PROJECT_ID` if testing Expo push tokens.
- Admin token in `apps/admin/.env`.

Never paste real secrets into chat.

Current Android blocker in this workspace:

- `apps/mobile/google-services.json` is not present yet
- `apps/mobile/.env` is not present yet
- Java/JDK is not available on PATH
- Android SDK/ADB is not available on PATH

Current Android config behavior:

- `apps/mobile/app.config.js` automatically enables React Native Firebase native plugins when `apps/mobile/google-services.json` exists.
- Without `google-services.json`, Android dev builds can still use dev auth and non-Firebase room flows.
- Email auth and Firebase Storage upload intentionally show a setup error until Firebase env values and native config are present.

## Verify Current State

```powershell
npm.cmd run typecheck
npm.cmd test --workspace services/api
npm.cmd run build --workspace services/api
npm.cmd run build --workspace apps/admin
```

## Run Backend

```powershell
npm.cmd run dev:api
```

Backend default: `http://localhost:8080`

## Run Admin Dashboard

```powershell
npm.cmd run dev:admin
```

Admin default: `http://localhost:5173`

## Run Mobile

```powershell
cd apps\mobile
npm.cmd run start
```

For Android native build:

```powershell
npm.cmd run prebuild:android
npm.cmd run android
```

## If Starting In A New Chat

Paste the repo link/path and the contents of `docs/HANDOFF_PROMPT.md`.

## If Laptop Was Off

You do not need to keep the laptop on. The project is saved in files. To resume:

1. Open terminal.
2. `cd C:\Users\shiv\Documents\Codex\SoulSync`
3. Run verification commands.
4. Continue from `docs/PROGRESS.md`.

## If API Key Or Provider Changes

Only update local `.env` files. Do not change source code unless the provider/API shape changed.
