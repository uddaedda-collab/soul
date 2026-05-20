# Deployment

## Backend

Build the API container with Docker or deploy `services/api` to a Node host.

## Admin

Build `apps/admin` and host on Firebase Hosting or any static host.

## Mobile

Use Expo EAS for Android release builds.

## Environment

- `services/api/.env`
- `apps/mobile/.env`
- `apps/admin/.env`

## Production checks

- Replace dev auth with Firebase Auth or another production identity provider.
- Wire actual media provider integrations where licensing permits.
- Configure moderation, reporting, and push notifications before launch.
