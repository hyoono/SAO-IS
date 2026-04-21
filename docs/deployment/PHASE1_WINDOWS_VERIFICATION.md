# Phase 1 Windows and LAN Verification Runbook

Date: 2026-04-21
Purpose: Verify the remaining Phase 1 acceptance items that require Windows/WSL host checks.

## Prerequisites

- Run Windows commands in PowerShell as Administrator when noted.
- WSL distro name assumed: Ubuntu-22.04
- Repository path assumed in WSL: /home/joshu/SAO-IS

## Quick Scripted Option

Instead of running each command manually, use the helper scripts:

1. In WSL:

```bash
bash /home/joshu/SAO-IS/scripts/verify-phase1-wsl.sh
```

2. In Windows PowerShell (Run as Administrator):

```powershell
powershell -ExecutionPolicy Bypass -File "\\wsl$\Ubuntu-22.04\home\joshu\SAO-IS\scripts\verify-phase1-windows.ps1" -ConfigurePortProxy
```

3. For read-only Windows checks (no proxy changes), omit -ConfigurePortProxy.

## 1) Confirm Windows Host IP

Run in Windows PowerShell:

```powershell
ipconfig
```

Expected:
- Active adapter shows IPv4 Address (example: 192.168.1.200)
- This is the IP users should access on LAN

## 2) Confirm WSL Services Are Running

Run in WSL:

```bash
sudo service nginx status
sudo service php8.2-fpm status
sudo service mysql status
```

Expected:
- Each service reports active/running

## 3) Refresh Port Proxy Rule (Windows Admin PowerShell)

Run in Windows PowerShell as Admin:

```powershell
# Optional: remove existing listener on 80 first
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=80

# Read current WSL IP
$wslIp = (wsl -d Ubuntu-22.04 -e bash -lc "hostname -I | awk '{print $1}'").Trim()

# Add proxy from Windows :80 to WSL :80
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=80 connectaddress=$wslIp connectport=80

# Show current rules
netsh interface portproxy show v4tov4
```

Expected:
- A row exists for 0.0.0.0:80 -> <WSL-IP>:80

## 4) Verify Nginx Response via Windows Host IP

Run in Windows PowerShell:

```powershell
$hostIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
  $_.InterfaceAlias -notmatch 'vEthernet|Loopback|WSL' -and $_.IPAddress -notmatch '^169\.254\.'
} | Select-Object -First 1 -ExpandProperty IPAddress)

Invoke-WebRequest -Uri ("http://" + $hostIp) -UseBasicParsing | Select-Object StatusCode
```

Expected:
- StatusCode = 200 (or redirect to app route that ultimately returns 200)

## 5) Verify API Health Endpoint Through Host IP

Run in Windows PowerShell:

```powershell
Invoke-RestMethod -Uri ("http://" + $hostIp + "/api/v1/health")
```

Expected:
- JSON with status: ok and a timestamp

## 6) Verify Access from Another LAN Device

From a different machine on same network:

- Open browser: http://<windows-host-ip>
- Open API URL: http://<windows-host-ip>/api/v1/health

Expected:
- Login page loads for root URL
- Health endpoint returns JSON

## 7) Optional Firewall Confirmation (WSL)

Run in WSL:

```bash
sudo ufw status
```

Expected:
- Only allowed inbound ports required by plan (typically 80 and 22)

## Evidence to Capture

- Screenshot or copied output of ipconfig showing chosen host IPv4
- netsh portproxy show output
- Invoke-WebRequest status output
- /api/v1/health JSON output
- Photo/screenshot of second-device LAN access

## Deferred Check

- Reboot and auto-start validation is deferred until final deployment stage.

## Troubleshooting

### API health returns 404 but Laravel route exists

Symptom:
- `http://127.0.0.1/api/v1/health` returns `404 Not Found` from nginx.
- `php artisan route:list` shows `GET|HEAD api/v1/health` exists.

Likely cause:
- Active nginx site is still Debian default (`/var/www/html`) with no `/api` pass-through.

Fix (run in WSL with sudo):

```bash
cat <<'EOF' > /tmp/sao-is-nginx
server {
  listen 80;
  server_name _;
  root /home/joshu/SAO-IS/backend/public;
  index index.php index.html;

  location / {
    try_files $uri $uri/ /index.php?$query_string;
  }

  location /api {
    try_files $uri $uri/ /index.php?$query_string;
  }

  location ~ \.php$ {
    fastcgi_pass unix:/run/php/php8.2-fpm.sock;
    fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
    include fastcgi_params;
  }

  location ~ /\.(?!well-known).* {
    deny all;
  }
}
EOF

sudo cp /tmp/sao-is-nginx /etc/nginx/sites-available/sao-is
sudo ln -sfn /etc/nginx/sites-available/sao-is /etc/nginx/sites-enabled/sao-is
sudo rm -f /etc/nginx/sites-enabled/default
sudo usermod -aG joshu www-data
sudo chmod 750 /home/joshu
sudo nginx -t
sudo service nginx reload

curl -i http://127.0.0.1/api/v1/health
```

Expected after fix:
- `HTTP/1.1 200 OK`
- JSON payload includes `status: ok`.

### API health returns 500 with Sanctum middleware class missing

Symptom:
- `http://127.0.0.1/api/v1/health` returns `500`.
- `backend/storage/logs/laravel.log` includes: `Target class [Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful] does not exist`.

Likely cause:
- `statefulApi` middleware is enabled in Laravel bootstrap, but `laravel/sanctum` dependency is missing.

Fix:

```bash
cd /home/joshu/SAO-IS/backend
composer require laravel/sanctum:^4.0 --no-interaction --no-progress
curl -i http://127.0.0.1/api/v1/health
```

Expected after fix:
- `HTTP/1.1 200 OK`
- JSON payload includes `status: ok` and `timestamp`.

### Nginx error says "Primary script unknown"

Symptom:
- `/api/v1/health` returns `404` with body `File not found.`
- Nginx error log includes `FastCGI sent in stderr: "Primary script unknown"`.

Likely cause:
- `www-data` was added to `joshu` group, but `php8.2-fpm` workers were not restarted, so workers still run without supplementary group access.

Fix:

```bash
id www-data
ps -eo pid,user,group,comm,args | grep -E 'php-fpm8.2|php-fpm: pool' | grep -v grep

sudo service php8.2-fpm restart

# Verify worker group list now includes gid of joshu (usually 1000)
for p in $(pgrep -f "php-fpm: pool www" | head -n 2); do
  echo "PID $p"
  grep '^Groups:' /proc/$p/status
done

curl -i http://127.0.0.1/api/v1/health
```

Fallback if restart is not possible immediately:

```bash
chmod 755 /home/joshu
```

Then retest `/api/v1/health`.
