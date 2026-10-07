$ErrorActionPreference = 'Stop'
try {
    Set-Location (Split-Path -Parent $PSScriptRoot)
    $nodeCommand = Get-Command node -ErrorAction Stop
    $npmCommand = Get-Command npm.cmd -ErrorAction Stop
    & $nodeCommand.Source --version
    if ($LASTEXITCODE -ne 0) { throw 'Node version check failed.' }
    & $npmCommand.Source --version
    if ($LASTEXITCODE -ne 0) { throw 'npm version check failed.' }
    if (Test-Path -LiteralPath 'package-lock.json') {
        & $npmCommand.Source ci
    } else {
        & $npmCommand.Source install
    }
    if ($LASTEXITCODE -ne 0) { throw "Dependency installation failed (exit $LASTEXITCODE)." }
    Write-Host '[PASS] Dependencies installed.'
    exit 0
} catch {
    [Console]::Error.WriteLine("[FAIL] Setup: $($_.Exception.Message)")
    exit 1
}
