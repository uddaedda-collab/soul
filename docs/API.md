# API

## Auth

- `POST /auth/dev-token` - local-only development token issuance.

## Rooms

- `GET /rooms` - public room listing.
- `POST /rooms` - create room.
- `GET /rooms/:roomId` - room details.
- `POST /rooms/:roomId/join` - join room.
- `GET /rooms/:roomId/messages` - room message history.

## Media

- `POST /media/shared` - register shared media payload.

## Users

- `GET /users/me` - current profile.
- `PATCH /users/me` - update profile.
- `POST /users/me/push-token` - register push token.
- `POST /users/block` - block a user.
- `POST /users/unblock` - unblock a user.
- `POST /users/reports` - create safety report.

## Notifications

- `POST /notifications/room-invite` - send Firebase room invite push.

## Admin

- `GET /admin/overview` - metrics and active room snapshot.
