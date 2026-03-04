[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$patterns = @(
  "*\\openclaw.mjs tui*",
  "*\\propai.mjs tui*",
  "*\\propaiclaw.mjs tui*",
  "*\\dist\\index.js gateway*",
  "*\\node_modules\\propaiclaw\\propai.mjs tui*",
  "*\\node_modules\\propaiclaw\\dist\\index.js gateway*"
)

$targets = @()
try {
  $targets = Get-CimInstance Win32_Process | Where-Object {
    if ($_.Name -ne "node.exe") {
      return $false
    }
    $cmd = $_.CommandLine
    if ([string]::IsNullOrWhiteSpace($cmd)) {
      return $false
    }
    foreach ($pattern in $patterns) {
      if ($cmd -like $pattern) {
        return $true
      }
    }
    return $false
  }
} catch {
  Write-Warning "Could not inspect running processes. Skipping stale-process cleanup."
  exit 0
}

if (-not $targets -or $targets.Count -eq 0) {
  Write-Host "No PropAI/OpenClaw TUI or gateway node processes found."
  exit 0
}

Write-Host "Stopping $($targets.Count) PropAI/OpenClaw process(es)..."
foreach ($proc in $targets) {
  try {
    Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
    Write-Host "  stopped PID $($proc.ProcessId)"
  } catch {
    Write-Warning "  failed to stop PID $($proc.ProcessId): $($_.Exception.Message)"
  }
}

exit 0
