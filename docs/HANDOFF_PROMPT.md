# SoulSync Handoff Prompt

Paste this into a new AI coding chat with the repo link/path.

```text
Continue the SoulSync project from this repository/path:
<PASTE_REPO_LINK_OR_LOCAL_PATH_HERE>

Read these files first:
- docs/PROGRESS.md
- docs/RESUME.md
- README.md

Important context:
- This is a React Native TypeScript Android app plus Node/Express/Socket.IO backend and Vite admin dashboard.
- Flutter was not used because Flutter/Dart were not available.
- The app goal is a premium long-distance couple watch party app: synchronized playback, chat, video/voice call, media sharing, private rooms, Firebase auth/storage, notifications, reports/admin.
- Do not restart from scratch.
- First run or inspect:
  - npm.cmd run typecheck
  - npm.cmd test --workspace services/api
  - npm.cmd run build --workspace services/api
  - npm.cmd run build --workspace apps/admin
- Then continue the next work queue in docs/PROGRESS.md.
- Use npm.cmd on Windows PowerShell.
- Never expose real API keys or Firebase private keys in chat.
- If asking for permissions, explain exactly which command needs it.

Current priority:
Make the Android app actually run properly on device/emulator, connect Firebase/Agora, test full create-room/join-room/synced-playback/chat/media/call/invite/report flow, then prepare APK/AAB.
```
