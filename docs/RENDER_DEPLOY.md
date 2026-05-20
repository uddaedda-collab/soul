# Render Deploy

Use this for the free backend deployment.

## Recommended Path

1. Push this repo to GitHub.
2. In Render, choose **New > Web Service**.
3. Connect the GitHub repo.
4. If Render detects `render.yaml`, use the blueprint/service settings from the file.

## Manual Settings

If creating the service manually:

- Name: `soulsync-api`
- Runtime: `Node`
- Plan: `Free`
- Build Command: `npm install && npm run build:api`
- Start Command: `npm start`
- Health Check Path: `/health`

## Environment Variables

Set these in Render:

```text
NODE_ENV=production
PUBLIC_API_URL=https://soulsync-api.onrender.com
CORS_ORIGINS=http://localhost:5173,http://localhost:19006,https://soulsync-api.onrender.com
ROOM_CODE_ALPHABET=ABCDEFGHJKLMNPQRSTUVWXYZ23456789
```

Generate `JWT_SECRET` in Render. Do not commit real secrets.

Firebase Admin env vars can stay empty for the free private MVP. The API will use in-memory fallback storage until Firebase is configured:

```text
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
AGORA_APP_ID=
```

## Free Plan Note

Render Free web services may sleep after inactivity. The first request after sleep can take some time to wake up.
