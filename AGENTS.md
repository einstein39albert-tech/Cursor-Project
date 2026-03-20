# AGENTS.md

## Cursor Cloud specific instructions

### Overview

UORMS (Unified Operations, Reporting & Management System) is a single-service Node.js/Express web app with an embedded SQLite database (`better-sqlite3`). No external database servers or services are required.

### Quick reference

| Action | Command |
|--------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (nodemon, port 3000) |
| Production start | `npm start` |
| Run tests | `npm test` |

### Environment setup

- Copy `.env.example` to `.env` and set `NODE_ENV=development` for local dev (auth is bypassed when `AUTH_ENABLED` is not explicitly `true` and `NODE_ENV` is not `production`).
- The SQLite database file is auto-created at `data/uorms.sqlite` on first startup. Seed data (admin user, sample branches, etc.) is inserted automatically.
- Default admin credentials (when auth is enabled): `admin` / `admin123`.

### Caveats

- The project uses Express 5 (not 4). Route error handling uses async-aware middleware built into Express 5.
- `better-sqlite3` is a native addon compiled during `npm install`. If Node.js major version changes, you must `rm -rf node_modules && npm install` to rebuild.
- Tests use Node's built-in test runner (`node --test`), not Jest or Mocha. The test database is stored at `/tmp/uorms-test.sqlite` (set via env var in `tests/app.test.js`).
- No linter is configured in this project (no ESLint/Prettier config files or lint scripts).
