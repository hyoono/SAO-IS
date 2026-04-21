param(
    [string]$Distro = "Ubuntu-22.04",
    [switch]$ConfigurePortProxy
)

$ErrorActionPreference = "Stop"

function Test-IsAdmin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Write-Result {
    param(
        [string]$Label,
        [string]$Status,
        [string]$Details
    )

    Write-Host ("[{0}] {1} - {2}" -f $Status, $Label, $Details)
}

Write-Host "=== SAO-IS Phase 1 Windows Verification ==="

$hostIp = $null

$defaultRoute = Get-NetRoute -AddressFamily IPv4 -DestinationPrefix "0.0.0.0/0" |
    Where-Object { $_.InterfaceAlias -notmatch 'vEthernet|Loopback|WSL|Virtual' } |
    Sort-Object RouteMetric |
    Select-Object -First 1

if ($defaultRoute) {
    $hostIp = Get-NetIPAddress -InterfaceIndex $defaultRoute.InterfaceIndex -AddressFamily IPv4 |
        Where-Object {
            $_.IPAddress -notmatch '^169\.254\.' -and
            $_.IPAddress -ne '127.0.0.1'
        } |
        Select-Object -First 1 -ExpandProperty IPAddress
}

if (-not $hostIp) {
    $hostIp = Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object {
            $_.IPAddress -notmatch '^169\.254\.' -and
            $_.IPAddress -ne '127.0.0.1' -and
            $_.InterfaceAlias -notmatch 'vEthernet|Loopback|WSL|Virtual'
        } |
        Select-Object -First 1 -ExpandProperty IPAddress
}

if (-not $hostIp) {
    Write-Result -Label "Host IP" -Status "FAIL" -Details "Could not detect a usable host IPv4 address."
    exit 1
}

Write-Result -Label "Host IP" -Status "PASS" -Details $hostIp

$wslIpRaw = wsl -d $Distro -e bash -lc "hostname -I | cut -d ' ' -f1" 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($wslIpRaw)) {
    Write-Result -Label "WSL IP" -Status "FAIL" -Details "Could not read WSL IP from distro $Distro."
    exit 1
}

$wslIp = $wslIpRaw.Trim()

Write-Result -Label "WSL IP" -Status "PASS" -Details $wslIp

if ($ConfigurePortProxy) {
    if (-not (Test-IsAdmin)) {
        Write-Result -Label "Port Proxy" -Status "FAIL" -Details "Run PowerShell as Administrator to configure port proxy."
        exit 1
    }

    netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=80 | Out-Null
    netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=80 connectaddress=$wslIp connectport=80 | Out-Null
    Write-Result -Label "Port Proxy" -Status "PASS" -Details "Configured 0.0.0.0:80 -> $wslIp:80"
} else {
    Write-Result -Label "Port Proxy" -Status "INFO" -Details "Skipped configure step. Use -ConfigurePortProxy in admin shell if needed."
}

$proxyRows = (netsh interface portproxy show v4tov4) -join "`n"
if ($proxyRows -match "0.0.0.0\s+80") {
    Write-Result -Label "Port Proxy Rule Present" -Status "PASS" -Details "Found listener 0.0.0.0:80"
} else {
    Write-Result -Label "Port Proxy Rule Present" -Status "WARN" -Details "No 0.0.0.0:80 listener found."
}

try {
    $rootResp = Invoke-WebRequest -Uri ("http://" + $hostIp) -UseBasicParsing -TimeoutSec 10
    Write-Result -Label "HTTP Root" -Status "PASS" -Details ("StatusCode=" + $rootResp.StatusCode)
}
catch {
    Write-Result -Label "HTTP Root" -Status "FAIL" -Details $_.Exception.Message
}

try {
    $healthResp = Invoke-RestMethod -Uri ("http://" + $hostIp + "/api/v1/health") -TimeoutSec 10
    if ($healthResp.status -eq "ok") {
        Write-Result -Label "API Health" -Status "PASS" -Details ("/api/v1/health status=" + $healthResp.status)
    } else {
        Write-Result -Label "API Health" -Status "FAIL" -Details "Unexpected payload returned from /api/v1/health."
    }
}
catch {
    try {
        $fallbackResp = Invoke-WebRequest -Uri ("http://" + $hostIp + "/up") -UseBasicParsing -TimeoutSec 10
        Write-Result -Label "API Health" -Status "WARN" -Details ("/api/v1/health failed, but /up responded with StatusCode=" + $fallbackResp.StatusCode)
    }
    catch {
        Write-Result -Label "API Health" -Status "FAIL" -Details "Both /api/v1/health and /up failed."
    }
}

Write-Host ""
Write-Host "Manual pending: verify http://$hostIp from another LAN device."
Write-Host "Deferred: reboot and auto-start validation."
