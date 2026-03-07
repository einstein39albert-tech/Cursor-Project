# Ethio Telecom Server Deployment Guide

This guide is for deploying the final merged **Unified Operations, Reporting & Management System (UORMS)** on your own self-hosted server.

The release ZIP you should use is:

- `uorms-release-17148db.zip`

This guide assumes:

- Linux server
- SSH access
- sudo access
- a domain or hostname already pointed to the server

---

## 1. Upload the ZIP to the server

From your local machine:

```bash
scp uorms-release-17148db.zip your-user@your-server-ip:/home/your-user/
```

---

## 2. SSH into the server

```bash
ssh your-user@your-server-ip
```

---

## 3. Install Node.js and required packages

For Ubuntu/Debian-like systems:

```bash
sudo apt update
sudo apt install -y curl unzip nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

If your server uses Apache instead of Nginx:

```bash
sudo apt update
sudo apt install -y curl unzip apache2
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 4. Create the application directory

```bash
sudo mkdir -p /var/www/uorms
sudo chown -R "$USER":"$USER" /var/www/uorms
cd /var/www/uorms
```

---

## 5. Unzip the release

```bash
unzip ~/uorms-release-17148db.zip -d /var/www/uorms
cd /var/www/uorms
```

---

## 6. Create the production environment file

```bash
cp .env.example .env
nano .env
```

Use values like this:

```bash
NODE_ENV=production
PORT=3000
APP_NAME=Unified Operations, Reporting & Management System
BASE_URL=https://your-real-domain-or-hostname
COOKIE_NAME=uorms_session
SESSION_TTL_DAYS=7
DEFAULT_LOCALE=en
APP_SECRET=replace-this-with-a-long-random-secret
TRUST_PROXY=true
UPLOAD_DIR=src/public/uploads
DATABASE_PATH=data/uorms.sqlite
SECURE_COOKIES=true
```

Important:

- replace `BASE_URL`
- replace `APP_SECRET`
- keep `TRUST_PROXY=true` when using Nginx or Apache reverse proxy
- keep `SECURE_COOKIES=true` only when HTTPS is enabled

---

## 7. Install dependencies

```bash
npm install --omit=dev
```

---

## 8. Start once manually to confirm boot

```bash
npm start
```

You should see:

```bash
Unified Operations, Reporting & Management System listening on port 3000
```

Press `Ctrl + C` after confirming it starts.

---

## 9. Set up systemd service

```bash
sudo mkdir -p /var/log/uorms
sudo cp deploy/systemd/uorms.service /etc/systemd/system/uorms.service
sudo nano /etc/systemd/system/uorms.service
```

Make sure these values are correct:

- `User=www-data` or your preferred service user
- `WorkingDirectory=/var/www/uorms`
- `ExecStart=/usr/bin/node /var/www/uorms/src/server.js`

Then enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable uorms
sudo systemctl start uorms
sudo systemctl status uorms --no-pager
```

---

## 10A. Nginx reverse proxy setup

If using Nginx:

```bash
sudo cp deploy/nginx/uorms.conf /etc/nginx/sites-available/uorms
sudo nano /etc/nginx/sites-available/uorms
```

Replace:

- `example.com`
- `www.example.com`

Then enable it:

```bash
sudo ln -s /etc/nginx/sites-available/uorms /etc/nginx/sites-enabled/uorms
sudo nginx -t
sudo systemctl reload nginx
```

---

## 10B. Apache reverse proxy setup

If using Apache instead:

```bash
sudo a2enmod proxy proxy_http headers rewrite
sudo cp deploy/apache/uorms.conf /etc/apache2/sites-available/uorms.conf
sudo nano /etc/apache2/sites-available/uorms.conf
```

Replace:

- `example.com`
- `www.example.com`

Then enable it:

```bash
sudo a2ensite uorms.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

---

## 11. Enable HTTPS

If using Nginx:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain -d www.your-domain
```

If using Apache:

```bash
sudo apt install -y certbot python3-certbot-apache
sudo certbot --apache -d your-domain -d www.your-domain
```

After HTTPS is active, make sure `.env` contains:

```bash
SECURE_COOKIES=true
TRUST_PROXY=true
```

Then restart the app:

```bash
sudo systemctl restart uorms
```

---

## 12. Verify health

```bash
curl http://127.0.0.1:3000/health
```

Expected:

```json
{"status":"ok", ...}
```

Also run:

```bash
bash scripts/post-deploy-check.sh
```

---

## 13. Change default passwords immediately

Example:

```bash
npm run reset-password -- admin NewStrongPassword123
npm run reset-password -- mainadmin NewStrongPassword456
```

Or generate a random password:

```bash
npm run reset-password -- admin
```

---

## 14. Back up the database regularly

Manual backup:

```bash
bash scripts/backup.sh
```

Example cron job:

```bash
crontab -e
```

Add:

```bash
0 2 * * * cd /var/www/uorms && /bin/bash scripts/backup.sh
```

---

## 15. Useful service commands

```bash
sudo systemctl restart uorms
sudo systemctl stop uorms
sudo systemctl start uorms
sudo systemctl status uorms
journalctl -u uorms -n 100 --no-pager
```

---

## 16. First login

Use one of the seeded accounts if you have not changed them yet:

- `admin / admin123`

Then immediately change passwords using the CLI helper.

---

## 17. After deployment

Inside the app:

1. update organization name
2. update contact information
3. create your real internal users
4. create real branch structure
5. upload files and reports
6. review roles and permissions

---

## 18. If something fails

Check:

```bash
sudo systemctl status uorms --no-pager
journalctl -u uorms -n 100 --no-pager
curl http://127.0.0.1:3000/health
ls -la /var/www/uorms/data
ls -la /var/www/uorms/src/public/uploads
```

---

## Best recommended path for you

For your setup, the best practical deployment path is:

- Node.js
- systemd
- Nginx
- HTTPS with Certbot
- SQLite initially

Later, if needed, the database can be upgraded to PostgreSQL or MySQL.
