# Phase 1 Windows and LAN Verification Runbook

Date: 2026-04-21
Purpose: Verify the remaining Phase 1 acceptance items that require Windows/WSL host checks.

## Prerequisites

- Run Windows commands in PowerShell as Administrator when noted.
- WSL distro name assumed: Ubuntu-22.04
- Repository path assumed in WSL: /home/joshu/SAO-IS

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
