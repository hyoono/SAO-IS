#!/usr/bin/env bash
#
# SAO-IS Automated Deployment Script
# ===================================
# Installs all prerequisites and deploys SAO-IS on a bare metal Ubuntu server.
#
# Usage:
#   chmod +x scripts/deploy.sh
#   sudo ./scripts/deploy.sh
#
# Options:
#   --skip-ollama     Skip Ollama/AI installation (saves 10GB disk + 6GB RAM)
#   --hostname NAME   Set custom hostname (default: sao-is)
#   --db-pass PASS    Set MySQL password (default: prompted)
#
# Requirements:
#   - Ubuntu 22.04 or 24.04 LTS
#   - Root/sudo access
#   - Internet connection (for package downloads)
#

set -euo pipefail

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# ── Defaults ──
HOSTNAME="sao-is"
SKIP_OLLAMA=false
DB_PASS=""
APP_DIR="/var/www/sao-is"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# ── Helper functions ──
log()   { echo -e "${GREEN}[✓]${NC} $1"; }
info()  { echo -e "${BLUE}[i]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
step()  { echo -e "\n${CYAN}${BOLD}═══ $1 ═══${NC}\n"; }

# ── Parse arguments ──
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-ollama) SKIP_OLLAMA=true; shift ;;
        --hostname)    HOSTNAME="$2"; shift 2 ;;
        --db-pass)     DB_PASS="$2"; shift 2 ;;
        -h|--help)
            echo "Usage: sudo $0 [--skip-ollama] [--hostname NAME] [--db-pass PASS]"
            exit 0
            ;;
        *) error "Unknown option: $1" ;;
    esac
done

# ── Pre-flight checks ──
if [[ $EUID -ne 0 ]]; then
    error "This script must be run as root. Use: sudo $0"
fi

if ! grep -qiE 'ubuntu' /etc/os-release 2>/dev/null; then
    error "This script is designed for Ubuntu. Detected: $(cat /etc/os-release | grep PRETTY_NAME)"
fi

# Detect Ubuntu version and PHP version
UBUNTU_VERSION=$(lsb_release -rs 2>/dev/null || echo "22.04")
if dpkg --compare-versions "$UBUNTU_VERSION" ge "24.04" 2>/dev/null; then
    PHP_VERSION="8.3"
else
    PHP_VERSION="8.2"
fi

info "Detected Ubuntu ${UBUNTU_VERSION}, will use PHP ${PHP_VERSION}"

# Prompt for DB password if not provided
if [[ -z "$DB_PASS" ]]; then
    echo -e "${YELLOW}"
    read -sp "Enter MySQL password for sao_user (will not echo): " DB_PASS
    echo -e "${NC}"
    if [[ -z "$DB_PASS" ]]; then
        error "Database password cannot be empty."
    fi
fi

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║       SAO-IS Deployment Summary          ║${NC}"
echo -e "${BOLD}╠══════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║${NC}  Hostname:    ${CYAN}${HOSTNAME}${NC}"
echo -e "${BOLD}║${NC}  PHP Version: ${CYAN}${PHP_VERSION}${NC}"
echo -e "${BOLD}║${NC}  App Dir:     ${CYAN}${APP_DIR}${NC}"
echo -e "${BOLD}║${NC}  Ollama AI:   ${CYAN}$([ "$SKIP_OLLAMA" = true ] && echo "Skipped" || echo "Will install")${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""
read -p "Proceed with deployment? (y/N) " -n 1 -r
echo ""
[[ $REPLY =~ ^[Yy]$ ]] || exit 0


# ═══════════════════════════════════════════
# STEP 1: System packages
# ═══════════════════════════════════════════
step "Step 1/8: Installing system packages"

apt-get update -qq
apt-get upgrade -y -qq

apt-get install -y -qq \
    nginx \
    mysql-server \
    "php${PHP_VERSION}-fpm" \
    "php${PHP_VERSION}-mysql" \
    "php${PHP_VERSION}-mbstring" \
    "php${PHP_VERSION}-xml" \
    "php${PHP_VERSION}-curl" \
    "php${PHP_VERSION}-zip" \
    "php${PHP_VERSION}-gd" \
    "php${PHP_VERSION}-bcmath" \
    "php${PHP_VERSION}-intl" \
    "php${PHP_VERSION}-readline" \
    unzip \
    git \
    curl \
    avahi-daemon

log "System packages installed"

# Install Composer
if ! command -v composer &>/dev/null; then
    info "Installing Composer..."
    curl -sS https://getcomposer.org/installer | php -- --quiet
    mv composer.phar /usr/local/bin/composer
    log "Composer installed"
else
    log "Composer already installed"
fi

# Install Node.js 20
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
    info "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
    apt-get install -y -qq nodejs
    log "Node.js $(node -v) installed"
else
    log "Node.js $(node -v) already installed"
fi


# ═══════════════════════════════════════════
# STEP 2: MySQL
# ═══════════════════════════════════════════
step "Step 2/8: Configuring MySQL"

# Start MySQL if not running
systemctl start mysql
systemctl enable mysql

# Create database and user (idempotent)
mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS sao_is CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'sao_user'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER 'sao_user'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON sao_is.* TO 'sao_user'@'localhost';
FLUSH PRIVILEGES;
SQL

log "MySQL database 'sao_is' and user 'sao_user' configured"


# ═══════════════════════════════════════════
# STEP 3: Ollama (optional)
# ═══════════════════════════════════════════
step "Step 3/8: Ollama AI Engine"

if [[ "$SKIP_OLLAMA" = true ]]; then
    warn "Skipping Ollama installation (--skip-ollama flag)"
    warn "AI features will show 'AI Service unavailable'"
else
    if ! command -v ollama &>/dev/null; then
        info "Installing Ollama..."
        curl -fsSL https://ollama.com/install.sh | sh
        log "Ollama installed"
    else
        log "Ollama already installed"
    fi

    systemctl enable ollama
    systemctl start ollama

    # Wait for Ollama to be ready
    info "Waiting for Ollama to start..."
    for i in $(seq 1 30); do
        if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
            break
        fi
        sleep 1
    done

    # Pull model if not present
    if ! ollama list 2>/dev/null | grep -q "gemma4:e4b"; then
        info "Pulling gemma4:e4b model (~10 GB, this will take a while)..."
        ollama pull gemma4:e4b
        log "Model gemma4:e4b pulled"
    else
        log "Model gemma4:e4b already available"
    fi

    # Create custom SAO-IS model using the repo's Modelfile
    if ! ollama list 2>/dev/null | grep -q "sao-is"; then
        if [[ -f "$APP_DIR/Modelfile" ]]; then
            info "Creating custom sao-is model from repo Modelfile..."
            ollama create sao-is -f "$APP_DIR/Modelfile"
            log "Custom sao-is model created from Modelfile"
        else
            warn "Modelfile not found at $APP_DIR/Modelfile — skipping custom model"
            warn "You can create it later: ollama create sao-is -f /path/to/Modelfile"
        fi
    else
        log "Custom sao-is model already exists"
    fi
fi


# ═══════════════════════════════════════════
# STEP 4: Deploy application files
# ═══════════════════════════════════════════
step "Step 4/8: Deploying application files"

if [[ -d "$PROJECT_ROOT/backend" && -d "$PROJECT_ROOT/frontend" ]]; then
    # Script is being run from within the project
    if [[ "$PROJECT_ROOT" != "$APP_DIR" ]]; then
        info "Copying project to ${APP_DIR}..."
        mkdir -p "$APP_DIR"
        rsync -a --exclude='node_modules' --exclude='vendor' --exclude='.env' \
              "$PROJECT_ROOT/" "$APP_DIR/"
        log "Application files deployed to ${APP_DIR}"
    else
        log "Already running from ${APP_DIR}"
    fi
else
    error "Cannot find project files. Run this script from within the SAO-IS repository."
fi

# Set permissions
chown -R www-data:www-data "$APP_DIR"
chmod -R 775 "$APP_DIR/backend/storage"
chmod -R 775 "$APP_DIR/backend/bootstrap/cache"
log "File permissions set"


# ═══════════════════════════════════════════
# STEP 5: Laravel backend
# ═══════════════════════════════════════════
step "Step 5/8: Configuring Laravel backend"

cd "$APP_DIR/backend"

# Install Composer dependencies
sudo -u www-data composer install --no-dev --optimize-autoloader --no-interaction 2>&1 | tail -3

# Create .env if it doesn't exist
if [[ ! -f .env ]]; then
    if [[ -f .env.example ]]; then
        cp .env.example .env
    else
        touch .env
    fi
fi

# Write production .env values
cat > .env <<ENVFILE
APP_NAME=SAO-IS
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_TIMEZONE=Asia/Manila
APP_URL=http://${HOSTNAME}

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sao_is
DB_USERNAME=sao_user
DB_PASSWORD=${DB_PASS}

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=${HOSTNAME}

SANCTUM_STATEFUL_DOMAINS=${HOSTNAME},${HOSTNAME}.local

CACHE_STORE=file
QUEUE_CONNECTION=sync
LOG_CHANNEL=single
LOG_LEVEL=warning

OLLAMA_API_URL=http://localhost:11434
OLLAMA_TEXT_MODEL=sao-is
OLLAMA_VISION_MODEL=sao-is
ENVFILE

chown www-data:www-data .env
chmod 600 .env

# Generate app key
sudo -u www-data php artisan key:generate --force
log "Application key generated"

# Run migrations
sudo -u www-data php artisan migrate --force
log "Database migrations complete"

# Seed data
sudo -u www-data php artisan db:seed --force
log "Database seeded"

# Create storage symlink
sudo -u www-data php artisan storage:link 2>/dev/null || true

# Cache for production
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache
log "Laravel caches built"


# ═══════════════════════════════════════════
# STEP 6: Frontend build
# ═══════════════════════════════════════════
step "Step 6/8: Building frontend"

cd "$APP_DIR/frontend"
npm ci --silent 2>&1 | tail -3
npm run build
log "Frontend built to dist/"


# ═══════════════════════════════════════════
# STEP 7: Nginx configuration
# ═══════════════════════════════════════════
step "Step 7/8: Configuring Nginx"

PHP_SOCK="/var/run/php/php${PHP_VERSION}-fpm.sock"

cat > /etc/nginx/sites-available/sao-is <<NGINX
server {
    listen 80;
    server_name ${HOSTNAME} ${HOSTNAME}.local;

    # ─── Frontend (React SPA) ───
    root ${APP_DIR}/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # ─── Backend API ───
    location ~ ^/(api|sanctum)/ {
        root ${APP_DIR}/backend/public;
        try_files \$uri /index.php\$is_args\$args;
    }

    # ─── PHP-FPM ───
    location ~ \\.php\$ {
        root ${APP_DIR}/backend/public;
        fastcgi_pass unix:${PHP_SOCK};
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
    }

    # ─── Storage ───
    location /storage {
        alias ${APP_DIR}/backend/storage/app/public;
    }

    # ─── Security ───
    location ~ /\\.(?!well-known) {
        deny all;
    }

    client_max_body_size 50M;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1024;

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)\$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

# Enable site
ln -sf /etc/nginx/sites-available/sao-is /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart
nginx -t
systemctl restart nginx
systemctl restart "php${PHP_VERSION}-fpm"
log "Nginx configured and restarted"


# ═══════════════════════════════════════════
# STEP 8: Hostname / mDNS
# ═══════════════════════════════════════════
step "Step 8/8: Setting hostname to '${HOSTNAME}'"

hostnamectl set-hostname "$HOSTNAME"

# Add to /etc/hosts if not present
if ! grep -q "127.0.1.1.*${HOSTNAME}" /etc/hosts; then
    echo "127.0.1.1  ${HOSTNAME}" >> /etc/hosts
fi

# Configure Avahi for mDNS (.local discovery)
if [[ -f /etc/avahi/avahi-daemon.conf ]]; then
    cat > /etc/avahi/avahi-daemon.conf <<AVAHI
[server]
host-name=${HOSTNAME}
domain-name=local
use-ipv4=yes
use-ipv6=no

[publish]
publish-addresses=yes
publish-workstation=no

[wide-area]
enable-wide-area=yes

[rlimits]
AVAHI
    systemctl restart avahi-daemon
    systemctl enable avahi-daemon
    log "Avahi mDNS configured — accessible as http://${HOSTNAME}.local/"
fi

log "Hostname set to '${HOSTNAME}'"


# ═══════════════════════════════════════════
# Done!
# ═══════════════════════════════════════════
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║        SAO-IS Deployment Complete! 🎉            ║${NC}"
echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}${BOLD}║${NC}"
echo -e "${GREEN}${BOLD}║${NC}  Access the application:"
echo -e "${GREEN}${BOLD}║${NC}    Local:   ${CYAN}http://localhost/${NC}"
echo -e "${GREEN}${BOLD}║${NC}    LAN:     ${CYAN}http://${HOSTNAME}.local/${NC}"
echo -e "${GREEN}${BOLD}║${NC}"
echo -e "${GREEN}${BOLD}║${NC}  Default admin login:"
echo -e "${GREEN}${BOLD}║${NC}    Email:    ${CYAN}2022jfevasco@live.mcl.edu.ph${NC}"
echo -e "${GREEN}${BOLD}║${NC}    Password: ${CYAN}MMCLSAO2026${NC}"
echo -e "${GREEN}${BOLD}║${NC}"
echo -e "${GREEN}${BOLD}║${NC}  ${YELLOW}⚠  Change the admin password immediately!${NC}"
echo -e "${GREEN}${BOLD}║${NC}"
echo -e "${GREEN}${BOLD}║${NC}  Services:"
echo -e "${GREEN}${BOLD}║${NC}    Nginx:    $(systemctl is-active nginx)"
echo -e "${GREEN}${BOLD}║${NC}    PHP-FPM:  $(systemctl is-active "php${PHP_VERSION}-fpm")"
echo -e "${GREEN}${BOLD}║${NC}    MySQL:    $(systemctl is-active mysql)"
if [[ "$SKIP_OLLAMA" = false ]]; then
echo -e "${GREEN}${BOLD}║${NC}    Ollama:   $(systemctl is-active ollama)"
fi
echo -e "${GREEN}${BOLD}║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# Quick health check
if curl -s http://localhost/api/v1/health | grep -q '"ok"'; then
    log "Health check passed — API is responding"
else
    warn "Health check failed — check 'sudo nginx -t' and Laravel logs"
    warn "Logs: tail -20 ${APP_DIR}/backend/storage/logs/laravel.log"
fi
