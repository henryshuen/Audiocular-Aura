$ErrorActionPreference = 'Stop'
try {
    Set-Location (Split-Path -Parent $PSScriptRoot)
    $npmCommand = Get-Command npm.cmd -ErrorAction Stop
    Write-Host 'AuraPEQ: http://localhost:5173/ (Ctrl+C to stop)'
    & $npmCommand.Source run dev -- --host 127.0.0.1 --port 5173 --strictPort
    if ($LASTEXITCODE -ne 0) { throw "Dev server failed (exit $LASTEXITCODE)." }
    exit 0
} catch {
    [Console]::Error.WriteLine("[FAIL] Dev server: $($_.Exception.Message)")
    exit 1
}
