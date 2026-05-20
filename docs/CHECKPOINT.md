# Checkpoint Routine

Use this routine after each meaningful batch of work.

```powershell
cd C:\Users\shiv\Documents\Codex\SoulSync
npm.cmd run typecheck
npm.cmd test --workspace services/api
npm.cmd run build --workspace services/api
npm.cmd run build --workspace apps/admin
```

If all pass, update `docs/PROGRESS.md` with:

- What changed.
- What was verified.
- What remains next.

Then commit to Git or push to GitHub.

## Latest Checkpoint

2026-05-20:

- `npm.cmd run typecheck` passed.
- `npm.cmd test --workspace services/api` passed, including Socket.IO integration coverage.
- `npm.cmd run build --workspace services/api` passed.
- `npm.cmd run build --workspace apps/admin` passed.
- Native Android launch remains blocked until Java/JDK, Android SDK/ADB, `apps/mobile/.env`, and `apps/mobile/google-services.json` are available locally.
