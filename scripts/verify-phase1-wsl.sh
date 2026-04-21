#!/usr/bin/env bash

set -u

echo "=== SAO-IS Phase 1 WSL Verification ==="

check_php_fpm_access_hint() {
  local home_gid home_mode worker_pid worker_groups

  home_mode=$(stat -c "%a" /home/joshu 2>/dev/null || echo "")
  home_gid=$(id -g joshu 2>/dev/null || echo "")
  worker_pid=$(pgrep -f "php-fpm: pool www" | head -n 1 || true)

  if [ -z "$worker_pid" ] || [ -z "$home_gid" ] || [ -z "$home_mode" ]; then
    return
  fi

  worker_groups=$(awk '/^Groups:/ {for (i=2;i<=NF;i++) print $i}' "/proc/$worker_pid/status" 2>/dev/null || true)

  # If /home/joshu is not world-executable and php-fpm worker does not include joshu group,
  # PHP cannot traverse the path and nginx/php-fpm may report "Primary script unknown".
  if [ "$home_mode" != "755" ] && [ "$home_mode" != "775" ] && [ "$home_mode" != "777" ]; then
    if ! echo "$worker_groups" | grep -qx "$home_gid"; then
      echo "[WARN] php-fpm worker group mismatch detected for /home/joshu access"
      echo "       Suggested fix: run 'sudo service php8.2-fpm restart' and re-run this check"
      echo "       If still failing, use: chmod 755 /home/joshu or ensure www-data has joshu group access"
    fi
  fi
}

check_service() {
  local svc="$1"

  if command -v systemctl >/dev/null 2>&1; then
    if systemctl is-active --quiet "$svc"; then
      echo "[PASS] Service $svc is active"
      return
    fi
  fi

  if command -v service >/dev/null 2>&1; then
    if service "$svc" status >/dev/null 2>&1; then
      echo "[PASS] Service $svc is running"
      return
    fi
  fi

  echo "[WARN] Service $svc is not confirmed running"
}

check_http() {
  local label="$1"
  local url="$2"

  if command -v curl >/dev/null 2>&1; then
    if curl -fsS --max-time 8 "$url" >/dev/null; then
      echo "[PASS] $label reachable at $url"
    else
      echo "[WARN] $label not reachable at $url"
    fi
  else
    echo "[WARN] curl not installed; skipped $label check"
  fi
}

check_api_health() {
  local api_url="http://127.0.0.1/api/v1/health"
  local fallback_url="http://127.0.0.1/up"

  if ! command -v curl >/dev/null 2>&1; then
    echo "[WARN] curl not installed; skipped API health checks"
    return
  fi

  if curl -fsS --max-time 8 "$api_url" >/dev/null; then
    echo "[PASS] API Health reachable at $api_url"
    return
  fi

  if curl -fsS --max-time 8 "$fallback_url" >/dev/null; then
    echo "[WARN] API Health endpoint $api_url failed, but framework health is reachable at $fallback_url"
    return
  fi

  echo "[WARN] API health check failed for both $api_url and $fallback_url"
}

check_service "nginx"
check_service "php8.2-fpm"
check_service "mysql"
check_php_fpm_access_hint

check_http "Root URL" "http://127.0.0.1"
check_api_health

echo ""
echo "Manual pending: Windows host IP and LAN device checks."
echo "Deferred: reboot and auto-start validation."
