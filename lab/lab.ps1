<#
.SYNOPSIS
  Helper CLI for the PCA study lab.
.DESCRIPTION
  Provides shortcuts for managing, checking, reloading, and testing the Prometheus stack.
.EXAMPLE
  .\lab.ps1 up
  .\lab.ps1 check
  .\lab.ps1 test
  .\lab.ps1 reload
#>

[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [ValidateSet("up", "down", "down-v", "ps", "logs", "restart", "reload", "check", "test", "help")]
  [string]$Command = "help",

  [Parameter(Position = 1)]
  [string]$Service = ""
)

$ErrorActionPreference = "Stop"
$LabDir = $PSScriptRoot

function Invoke-Up {
  Write-Host "Starting PCA lab containers..." -ForegroundColor Cyan
  podman compose -f "$LabDir\compose.yaml" up -d --build
}

function Invoke-Down {
  param([switch]$Volumes)
  Write-Host "Stopping PCA lab containers..." -ForegroundColor Cyan
  if ($Volumes) {
    podman compose -f "$LabDir\compose.yaml" down -v
  } else {
    podman compose -f "$LabDir\compose.yaml" down
  }
}

function Invoke-Ps {
  podman compose -f "$LabDir\compose.yaml" ps
}

function Invoke-Logs {
  param([string]$Svc)
  if ($Svc) {
    podman compose -f "$LabDir\compose.yaml" logs -f $Svc
  } else {
    podman compose -f "$LabDir\compose.yaml" logs --tail 50
  }
}

function Invoke-Restart {
  param([string]$Svc)
  if ($Svc) {
    podman compose -f "$LabDir\compose.yaml" restart $Svc
  } else {
    podman compose -f "$LabDir\compose.yaml" restart
  }
}

function Invoke-Reload {
  Write-Host "Reloading Prometheus config (POST http://localhost:9090/-/reload)..." -ForegroundColor Cyan
  try {
    $res1 = Invoke-WebRequest -Uri "http://localhost:9090/-/reload" -Method Post -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($res1.StatusCode -eq 200) {
      Write-Host "Prometheus reloaded successfully (HTTP 200)." -ForegroundColor Green
    } else {
      Write-Warning "Prometheus returned HTTP $($res1.StatusCode). (Is the container running?)"
    }
  } catch {
    Write-Warning "Could not reload Prometheus on localhost:9090 ($($_.Exception.Message)). (Is the container running?)"
  }

  Write-Host "Reloading Alertmanager config (POST http://localhost:9093/-/reload)..." -ForegroundColor Cyan
  try {
    $res2 = Invoke-WebRequest -Uri "http://localhost:9093/-/reload" -Method Post -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($res2.StatusCode -eq 200) {
      Write-Host "Alertmanager reloaded successfully (HTTP 200)." -ForegroundColor Green
    } else {
      Write-Warning "Alertmanager returned HTTP $($res2.StatusCode). (Is the container running?)"
    }
  } catch {
    Write-Warning "Could not reload Alertmanager on localhost:9093 ($($_.Exception.Message)). (Is the container running?)"
  }
}

function Invoke-Check {
  Write-Host "1. Checking Prometheus config..." -ForegroundColor Cyan
  podman run --rm --entrypoint promtool -v "$LabDir\prometheus:/etc/prometheus:ro" docker.io/prom/prometheus:v2.55.1 check config /etc/prometheus/prometheus.yml

  Write-Host "`n2. Checking Prometheus rules..." -ForegroundColor Cyan
  podman run --rm --entrypoint promtool -v "$LabDir\prometheus\rules:/rules:ro" docker.io/prom/prometheus:v2.55.1 check rules /rules/alerting.yml /rules/recording.yml

  Write-Host "`n3. Checking Alertmanager config..." -ForegroundColor Cyan
  podman run --rm --entrypoint amtool -v "$LabDir\alertmanager:/etc/alertmanager:ro" docker.io/prom/alertmanager:v0.27.0 check-config /etc/alertmanager/alertmanager.yml
}

function Invoke-Test {
  Write-Host "Running alerting rule unit tests (promtool test rules)..." -ForegroundColor Cyan
  podman run --rm --entrypoint promtool -v "$LabDir\prometheus:/etc/prometheus:ro" docker.io/prom/prometheus:v2.55.1 test rules /etc/prometheus/tests/alerting.test.yml
}

function Show-Help {
  Write-Host @"
PCA Lab Helper Script

Usage:
  .\lab.ps1 <command> [service]

Commands:
  up          Start the lab stack (podman compose up -d --build)
  down        Stop the lab stack (preserves TSDB data)
  down-v      Stop the lab stack and delete volumes (clean reset)
  ps          Show status of running lab containers
  logs        View logs (optional: .\lab.ps1 logs prometheus)
  restart     Restart containers (optional: .\lab.ps1 restart prometheus)
  reload      Trigger config reload via HTTP POST on :9090 and :9093
  check       Validate Prometheus configs, rules, and Alertmanager configs
  test        Run alerting rule unit tests with promtool
  help        Show this help message
"@ -ForegroundColor Yellow
}

switch ($Command) {
  "up"      { Invoke-Up }
  "down"    { Invoke-Down }
  "down-v"  { Invoke-Down -Volumes }
  "ps"      { Invoke-Ps }
  "logs"    { Invoke-Logs -Svc $Service }
  "restart" { Invoke-Restart -Svc $Service }
  "reload"  { Invoke-Reload }
  "check"   { Invoke-Check }
  "test"    { Invoke-Test }
  Default   { Show-Help }
}
