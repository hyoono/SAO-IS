# SAO-IS Deployment Guide
## Bare Metal Ubuntu Server

> **Target:** Ubuntu 22.04 / 24.04 LTS — bare metal server on a local network  
> **Result:** SAO-IS accessible from any device on the LAN via `http://sao-is.local/`  
> **Stack:** Nginx + PHP-FPM + MySQL + Node.js + Ollama

---

## Quick Start (Automated)

The fastest way to deploy is with the included script. It installs everything, configures Nginx, sets up the database, builds the frontend, and enables mDNS hostname discovery — all in one command.

### 1. Clone the repository on the target server

```bash
git clone https://github.com/hyoono/SAO-IS.git /var/www/sao-is
cd /var/www/sao-is
```

### 2. Run the deploy script

```bash
chmod +x scripts/deploy.sh
sudo ./scripts/deploy.sh
```

The script will prompt you for a MySQL password and confirm before proceeding.

### 3. Access the application

| URL | Works on |
|-----|----------|
| `http://sao-is.local/` | Any device on the same LAN (Windows 10+, macOS, iOS, Linux) |
| `http://localhost/` | The server itself |

### Default admin login

| Field | Value |
|-------|-------|
| Email | `2022jfevasco@live.mcl.edu.ph` |
| Password | `MMCLSAO2026` |

> ⚠️ **Change the admin password immediately after first login.**

---

## Script Options

```bash
sudo ./scripts/deploy.sh [OPTIONS]
```

| Option | Description | Default |
|--------|-------------|---------|
| `--hostname NAME` | Set server hostname | `sao-is` |
| `--db-pass PASS` | Set MySQL password (skip prompt) | Interactive prompt |
| `--skip-ollama` | Skip Ollama AI installation (saves 10 GB disk + 6 GB RAM) | Installs Ollama |
| `-h, --help` | Show help | — |

### Examples

```bash
# Standard deployment
sudo ./scripts/deploy.sh

# Custom hostname, pre-set password
sudo ./scripts/deploy.sh --hostname mcl-sao --db-pass MySecurePass123

# Lightweight deployment (no AI features)
sudo ./scripts/deploy.sh --skip-ollama
```

---

## What the Script Does

The script executes these 8 steps automatically:

| Step | Action | Details |
|------|--------|---------|
| 1 | **System packages** | Installs Nginx, MySQL, PHP-FPM, Node.js 20, Composer, Avahi |
| 2 | **MySQL** | Creates `sao_is` database and `sao_user` with your password |
| 3 | **Ollama** | Installs Ollama, pulls `gemma4:e4b`, creates custom `sao-is` model from [`Modelfile`](../Modelfile) |
| 4 | **App files** | Copies project to `/var/www/sao-is`, sets permissions for `www-data` |
| 5 | **Laravel** | Installs Composer deps, writes `.env`, generates key, runs migrations + seeders, caches config |
| 6 | **Frontend** | Runs `npm ci` + `npm run build` → outputs to `frontend/dist/` |
| 7 | **Nginx** | Creates site config, serves React SPA + proxies `/api/*` to PHP-FPM |
| 8 | **Hostname** | Sets hostname, configures Avahi mDNS for `.local` discovery |

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| **RAM** | 4 GB | 8 GB (Ollama needs ~6 GB for the AI model) |
| **Disk** | 20 GB | 40 GB (AI model weights are ~10 GB) |
| **CPU** | 4 cores | 8 cores (AI inference is CPU-heavy without GPU) |
| **GPU** | Not required | NVIDIA GPU + CUDA for faster AI responses |
| **Network** | LAN access | Static IP recommended |

> If the server has < 6 GB free RAM, use `--skip-ollama`. The app works fully without AI — those features just show "AI Service unavailable."

---

## Hostname Options

The script uses **Option A (mDNS)** by default, giving you `http://sao-is.local/`. If you need `http://sao-is/` (without `.local`), choose Option B or C below.

### Option A: mDNS via Avahi (default — zero config)

**Done automatically by the script.** All devices on the LAN can access `http://sao-is.local/`.

| Platform | Support |
|----------|---------|
| Windows 10+ | ✅ Built-in |
| macOS / iOS | ✅ Native |
| Linux | ✅ With `avahi-daemon` |
| Android | ⚠️ May need Bonjour Browser app |

### Option B: Router DNS (for `http://sao-is/`)

1. Assign a **static IP** to the server in your router's DHCP settings
2. Add a **DNS entry**: `sao-is` → `192.168.1.100` (your server's IP)
3. Update the backend config:
   ```bash
   cd /var/www/sao-is/backend
   sudo sed -i 's/SESSION_DOMAIN=.*/SESSION_DOMAIN=sao-is/' .env
   sudo sed -i 's/SANCTUM_STATEFUL_DOMAINS=.*/SANCTUM_STATEFUL_DOMAINS=sao-is,sao-is.local/' .env
   sudo -u www-data php artisan config:cache
   ```

### Option C: Client hosts file (simplest fallback)

Add this line to each client device's hosts file:

```
# Windows: C:\Windows\System32\drivers\etc\hosts
# macOS/Linux: /etc/hosts

192.168.1.100   sao-is
```

---

## AI Model (Ollama)

The deploy script automatically:
1. Installs Ollama as a systemd service
2. Pulls `gemma4:e4b` (~10 GB)
3. Creates a custom `sao-is` model using the project's [`Modelfile`](../Modelfile)

The `Modelfile` contains MCL-specific system prompts (center names, roles, behavior rules). To update the AI persona after deployment:

```bash
# Edit the Modelfile
cd /var/www/sao-is
nano Modelfile

# Rebuild the model
ollama create sao-is -f Modelfile

# Clear cached AI responses
sudo -u www-data php artisan cache:clear
```

---

## Post-Deployment

### Verify services are running

```bash
sudo systemctl status nginx php8.2-fpm mysql ollama
```

### Test the API

```bash
curl -s http://localhost/api/v1/health
# → {"status":"ok","timestamp":"..."}
```

### View Laravel logs

```bash
tail -50 /var/www/sao-is/backend/storage/logs/laravel.log
```

---

## Updating the Application

```bash
cd /var/www/sao-is

# Pull latest code
git pull origin main

# Update backend
cd backend
sudo -u www-data composer install --no-dev --optimize-autoloader
sudo -u www-data php artisan migrate --force
sudo -u www-data php artisan optimize

# Rebuild frontend
cd ../frontend
npm ci
npm run build

# Restart services
sudo systemctl restart php8.2-fpm nginx
```

---

## Troubleshooting

### "502 Bad Gateway"
```bash
sudo systemctl restart php8.2-fpm
ls -la /var/run/php/php8.2-fpm.sock
```

### "Session store not set on request"
```bash
# SESSION_DOMAIN and SANCTUM_STATEFUL_DOMAINS must match the URL in the browser
cd /var/www/sao-is/backend
grep -E "SESSION_DOMAIN|SANCTUM" .env
# Fix them, then:
sudo -u www-data php artisan config:cache
```

### "AI Service unavailable"
```bash
sudo systemctl status ollama
curl http://localhost:11434/api/tags    # Should list sao-is model
ollama list                             # Verify model exists

# Clear cached failure responses
cd /var/www/sao-is/backend
sudo -u www-data php artisan cache:clear
```

### Permission errors (500)
```bash
sudo chown -R www-data:www-data /var/www/sao-is/backend/storage
sudo chown -R www-data:www-data /var/www/sao-is/backend/bootstrap/cache
sudo chmod -R 775 /var/www/sao-is/backend/storage
sudo chmod -R 775 /var/www/sao-is/backend/bootstrap/cache
```

### Login works but page keeps refreshing
```bash
# SESSION_DOMAIN must exactly match the hostname in the browser URL bar
cd /var/www/sao-is/backend
sudo nano .env    # Fix SESSION_DOMAIN
sudo -u www-data php artisan config:cache
```

### Changes to `.env` not taking effect
```bash
cd /var/www/sao-is/backend
sudo -u www-data php artisan config:clear
sudo -u www-data php artisan config:cache
```

---

## Maintenance Commands

```bash
cd /var/www/sao-is/backend

# Clear all caches
sudo -u www-data php artisan optimize:clear

# Re-cache for production
sudo -u www-data php artisan optimize

# Restart everything
sudo systemctl restart nginx php8.2-fpm mysql ollama
```

---

> **For competition demo:** The script-based deployment gets you from a fresh Ubuntu install to a working demo in under 15 minutes (plus model download time). Just tell the judges to open `http://sao-is.local/` on their device.
