$ErrorActionPreference = 'Stop'
try {
    Set-Location (Split-Path -Parent $PSScriptRoot)
    $npmCommand = Get-Command npm.cmd -ErrorAction Stop
    & $npmCommand.Source run build
    if ($LASTEXITCODE -ne 0) { throw "Build failed (exit $LASTEXITCODE)." }
    Write-Host '[PASS] TypeScript and production build.'
    $package = Get-Content -LiteralPath 'package.json' -Raw | ConvertFrom-Json
    if ($package.scripts.PSObject.Properties.Name -contains 'test') {
        & $npmCommand.Source run test
        if ($LASTEXITCODE -ne 0) { throw "Tests failed (exit $LASTEXITCODE)." }
        Write-Host '[PASS] Automated tests.'
    } else {
        Write-Host '[SKIP] No test script exists yet (M1 pending).'
    }
    Write-Host '[PASS] Safe automated verification complete.'
    exit 0
} catch {
    [Console]::Error.WriteLine("[FAIL] Verification: $($_.Exception.Message)")
    exit 1
}
