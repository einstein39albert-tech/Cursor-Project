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

## Health check

Use this endpoint for reverse proxy or process monitoring checks:

```bash
curl http://127.0.0.1:3000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

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
7. Set `TRUST_PROXY=true` when running behind Nginx or Apache

## Production deployment files included

The repository now includes ready-to-use deployment helpers:

- `deploy/nginx/uorms.conf` - Nginx reverse proxy sample
- `deploy/apache/uorms.conf` - Apache reverse proxy sample
- `deploy/systemd/uorms.service` - systemd service sample
- `ecosystem.config.js` - PM2 process configuration
- `scripts/deploy.sh` - basic Linux deployment helper
- `scripts/backup.sh` - database and uploads backup helper
- `scripts/reset-password.js` - secure CLI password reset helper
- `scripts/post-deploy-check.sh` - post-deployment verification helper
- `DEPLOY_ETHIO_TELECOM.md` - copy-paste deployment guide for your server

## Recommended deployment path on your server

### Option A: systemd + Nginx

1. Install Node.js and Nginx
2. Copy the project to `/var/www/uorms`
3. Create `.env`
4. Run:

   ```bash
   npm install --omit=dev
   ```

5. Copy:

   - `deploy/systemd/uorms.service` to `/etc/systemd/system/uorms.service`
   - `deploy/nginx/uorms.conf` to your Nginx sites config

6. Edit the paths/domain values
7. Enable and start:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable uorms
   sudo systemctl start uorms
   sudo systemctl status uorms
   ```

8. Enable Nginx config and reload Nginx

### Option B: PM2 + Nginx

1. Install PM2 globally:

   ```bash
   npm install -g pm2
   ```

2. Start:

   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   ```

3. Put Nginx in front of it using `deploy/nginx/uorms.conf`

### Option C: Apache reverse proxy

If your server uses Apache instead of Nginx:

1. Enable required modules:

   ```bash
   sudo a2enmod proxy proxy_http headers rewrite
   ```

2. Copy `deploy/apache/uorms.conf` into your Apache sites configuration
3. Replace the example domain name
4. Reload Apache:

   ```bash
   sudo systemctl reload apache2
   ```

## Example production `.env`

```bash
NODE_ENV=production
PORT=3000
BASE_URL=https://your-domain.example
APP_SECRET=replace-this-with-a-long-random-secret
COOKIE_NAME=uorms_session
SESSION_TTL_DAYS=7
DEFAULT_LOCALE=en
TRUST_PROXY=true
SECURE_COOKIES=true
UPLOAD_DIR=src/public/uploads
DATABASE_PATH=data/uorms.sqlite
```

## Basic production checklist

- set the real domain name
- enable HTTPS
- set `APP_SECRET`
- set `SECURE_COOKIES=true`
- set `TRUST_PROXY=true`
- change all seeded passwords
- update organization settings in the dashboard
- configure a cron job for `scripts/backup.sh`
- verify `/health`

## Change default passwords safely

Do not edit the SQLite database manually. Use the included CLI helper:

```bash
npm run reset-password -- admin NewStrongPassword123
```

If you omit the password, a strong random one is generated and printed:

```bash
npm run reset-password -- admin
```

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