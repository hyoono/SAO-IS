# Phase 1 Reboot and Auto-Start Checklist

Date: 2026-04-23
Scope: Deferred Phase 1 deployment validation

Use this checklist after the application is otherwise working to confirm the Windows host and WSL services survive a reboot.

## Preconditions

- You already confirmed the app works locally and over LAN before reboot.
- You have administrator access on the Windows host.
- You know how the WSL services are started on this machine.

## 1) Confirm Host IP Stability

1. Verify the current Windows host IP address.
2. Make sure the LAN clients use a stable IP path for the app.
3. Preferred outcome:
   - DHCP reservation exists on the router, or
   - Windows host has a static IPv4 address configured.

## 2) Confirm WSL Auto-Start Method

1. Verify which method starts WSL and the app stack after sign-in or reboot.
2. Confirm the startup method launches the required services:
   - `nginx`
   - `php8.2-fpm`
   - `mysql`
3. Common acceptable methods:
   - Startup folder shortcut
   - Scheduled Task at logon
   - Manual startup script used consistently after reboot

## 3) Reboot Validation

1. Reboot the Windows host.
2. After login, confirm the startup method runs without manual intervention.
3. Verify the WSL services are running again.
4. Open the app root in a browser.
5. Open the API health endpoint.
6. Expected result:
   - Root URL loads successfully
   - `GET /api/v1/health` returns `200 OK`

## 4) LAN Recheck

1. From another device on the network, open the host IP.
2. Confirm the app still loads after reboot.
3. Confirm the API health endpoint still responds.

## Evidence to Capture

- Screenshot or copy of the host IP configuration
- Screenshot or copy of the startup method in use
- Screenshot of the app root after reboot
- Response from `GET /api/v1/health` after reboot
- Confirmation from a second LAN device
