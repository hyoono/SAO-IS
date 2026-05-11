# SAO-IS Deployment Guide

## Overview

SAO-IS is designed for LAN-only deployment on an Ubuntu server (bare metal or WSL2). This guide covers the full production setup.

## Prerequisites

- Ubuntu 22.04 LTS (or newer)
- PHP 8.2 with extensions: mysql, mbstring, xml, curl, zip, bcmath, tokenizer, fileinfo
- Composer 2.x
- Node.js 20 LTS + npm
- MySQL 8.x
- Nginx

## Step 1: Install System Dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx mysql-server php8.2 php8.2-fpm php8.2-mysql \
  php8.2-mbstring php8.2-xml php8.2-curl php8.2-zip php8.2-bcmath \
  php8.2-tokenizer php8.2-fileinfo php8.2-gd composer unzip curl

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## Step 2: Configure MySQL

```sql
CREATE DATABASE sao_is CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'sao_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON sao_is.* TO 'sao_user'@'localhost';
FLUSH PRIVILEGES;
```

## Step 3: Deploy Application

```bash
# Clone repository
cd /var/www
sudo git clone <repository-url> sao-is
sudo chown -R www-data:www-data sao-is

# Backend setup
cd /var/www/sao-is/backend
cp .env.production .env
# Edit .env with your database credentials and server IP
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link

# Frontend build
cd /var/www/sao-is/frontend
npm ci
npm run build

# Copy frontend build to backend public directory
cp -r dist/* /var/www/sao-is/backend/public/
```

## Step 4: Configure Nginx

Create `/etc/nginx/sites-available/sao-is`:

```nginx
server {
    listen 80;
    server_name <YOUR_SERVER_IP>;
    root /var/www/sao-is/backend/public;
    index index.php index.html;

    # Max upload size (for document uploads)
    client_max_body_size 20M;

    # API and PHP routes
    location /api {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location /sanctum {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # SPA catch-all — serve index.html for all non-API routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Deny access to .env and hidden files
    location ~ /\.(?!well-known) {
        deny all;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/sao-is /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## Step 5: Laravel Production Optimizations

```bash
cd /var/www/sao-is/backend
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Step 6: Queue Worker (systemd)

Create `/etc/systemd/system/sao-is-worker.service`:

```ini
[Unit]
Description=SAO-IS Queue Worker
After=network.target mysql.service

[Service]
User=www-data
Group=www-data
Restart=always
RestartSec=5
WorkingDirectory=/var/www/sao-is/backend
ExecStart=/usr/bin/php artisan queue:work --sleep=3 --tries=3 --max-time=3600

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable sao-is-worker
sudo systemctl start sao-is-worker
```

## Step 7: Scheduler (Cron)

Add to crontab for www-data:

```bash
sudo crontab -u www-data -e
```

Add this line:

```
* * * * * cd /var/www/sao-is/backend && php artisan schedule:run >> /dev/null 2>&1
```

This runs the `ArchiveExpiredDocuments` job daily.

## Step 8: File Permissions

```bash
cd /var/www/sao-is/backend
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

## Step 9: Firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp  # if using SSL
sudo ufw enable
```

## Step 10: Backups

Use the provided backup script:

```bash
# Test the backup
sudo -u www-data bash /var/www/sao-is/scripts/backup.sh

# Add to cron (daily at 2am)
sudo crontab -u www-data -e
# Add: 0 2 * * * /var/www/sao-is/scripts/backup.sh >> /var/log/sao-is-backup.log 2>&1
```

## Environment Variables

See `.env.production` for the production environment template. Key values to configure:

| Variable | Description |
|----------|-------------|
| `APP_URL` | `http://<YOUR_SERVER_IP>` |
| `DB_PASSWORD` | Your MySQL password |
| `SESSION_DOMAIN` | `<YOUR_SERVER_IP>` |
| `SANCTUM_STATEFUL_DOMAINS` | `<YOUR_SERVER_IP>` |

## SSL/TLS (Optional)

For HTTPS with a self-signed certificate (LAN only):

```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/sao-is.key \
  -out /etc/ssl/certs/sao-is.crt

# Update Nginx to listen on 443 with SSL
# Add SESSION_SECURE_COOKIE=true to .env
```

## MS365 SSO (Optional)

Not configured by default. To enable:
1. Register an Azure AD application
2. Set `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID` in `.env`
3. Update `AZURE_REDIRECT_URI` to `https://<server>/api/v1/auth/ms365/callback`
4. Install `socialiteproviders/microsoft-azure` via Composer

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Check `php-fpm` is running: `sudo systemctl status php8.2-fpm` |
| Permission denied | Run `sudo chown -R www-data:www-data storage bootstrap/cache` |
| Session issues | Verify `SESSION_DOMAIN` matches your server IP |
| CSRF mismatch | Verify `SANCTUM_STATEFUL_DOMAINS` includes your server IP |
| Upload fails | Check `client_max_body_size` in Nginx and `upload_max_filesize` in php.ini |
