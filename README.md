# Unified Operations, Reporting & Management System

This repository now contains a real merged full-stack application built from the two provided HTML prototypes:

- **Website A** was used as the base for operations modules such as branches, files, messaging, profiles, and organization settings.
- **Website B** was used as the basis for reporting, analytics, calendar context, coefficients, and performance dashboards.

The result is a **self-hosted Node.js application** designed for:

- public information pages
- secure internal login
- role-based dashboard access
- branch hierarchy management
- file upload and governance
- internal messaging
- dynamic profile registries
- reporting templates and indicator tracking
- audit logging
- English + Amharic support today
- future-ready multilingual expansion for Afaan Oromo, Sidama, Afar, Somali, Tigray, and more

## Stack

- Node.js
- Express
- EJS templates
- SQLite (`better-sqlite3`) for simple self-hosted deployment
- bcrypt password hashing
- secure HTTP-only cookies
- rate limiting
- CSRF validation on authenticated state-changing requests
- audit logging

## Default seeded internal accounts

These accounts are created automatically on first startup:

- `admin / admin123`
- `mainadmin / main123`
- `manager / manager123`
- `submanager / sub123`
- `director / director123`
- `user / user123`

Change these credentials immediately before production use.

## Quick start

1. Copy environment settings:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start in development:

   ```bash
   npm run dev
   ```

4. Start in production:

   ```bash
   npm start
   ```

The application runs on `http://localhost:3000` by default.

## Test

```bash
npm test
```

## Important deployment notes

Before deploying to your own server:

1. Set a strong `APP_SECRET`
2. Change all seeded passwords
3. Set `SECURE_COOKIES=true` behind HTTPS
4. Back up the SQLite database regularly, or migrate to PostgreSQL/MySQL later if your server requires it
5. Restrict file upload directory permissions appropriately
6. Put the app behind Nginx or Apache as a reverse proxy

## Recommended self-hosted deployment shape

For your own Ethio Telecom server, the simplest production path is:

- install Node.js
- run the app with `npm start`
- manage the process with `pm2` or `systemd`
- place Nginx or Apache in front of it
- enable HTTPS

## Current module coverage

- public home/features/contact
- login/logout
- dashboard overview
- branches
- files
- messages
- profiles
- reports
- internal users
- organization settings
- audit trail

## Future expansion already prepared for

- more languages
- database migration to a heavier production database
- more detailed report extraction workflows
- richer charting
- stronger compliance modules
- deeper admin/user lifecycle controls