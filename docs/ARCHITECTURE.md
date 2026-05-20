# Architecture

## Client Apps

- `apps/mobile`: Android-first React Native app with synchronized playback, calls, chat, reactions, and encrypted room messaging.
- `apps/admin`: Vite dashboard for moderation and room visibility.

## Backend

- `services/api`: Express + Socket.IO realtime API.
- Firebase Admin: auth, Firestore, Storage, and optional Realtime Database presence.

## Realtime Model

- Rooms are created with a host, invite token, and room code.
- Playback state includes status, position, speed, media, subtitle track, volume, version, and the last server update timestamp.
- Every control event is stamped on the server and broadcast with ack-based envelopes.
- Drift over 500 ms triggers hard resync; smaller drift triggers soft correction while playing.

## Room Modes

- `host`: only the host can control playback.
- `shared`: both participants can control playback.

## Chat Security

- Chat payloads are encrypted on-device before socket transmission.
- The backend stores ciphertext and nonce only.

## Current Source Support

- Direct video URLs
- Local file URIs
- Upload-ready media payloads
- YouTube / Drive / Netflix are represented in the source model and UI, but provider-specific DRM or API integrations must be implemented separately for production compliance.
