$ErrorActionPreference = 'Stop'
$bridgeProcess = $null
try {
    Set-Location (Split-Path -Parent $PSScriptRoot)
    $npmCommand = Get-Command npm.cmd -ErrorAction Stop
    $dotnet = (Get-Command dotnet.exe -ErrorAction Stop).Source
    & $dotnet build tools\freedsp-native\FreeDspQuery.csproj --configuration Release --nologo --verbosity quiet
    if ($LASTEXITCODE -ne 0) { throw 'FreeDSP debug bridge build failed; no hardware access attempted.' }
    $bridgeDll = Join-Path (Get-Location).Path 'tools\freedsp-native\bin\Release\net10.0\FreeDspQuery.dll'
    $logDir = [IO.Path]::GetFullPath((Join-Path ([IO.Path]::GetTempPath()) 'AuraPEQ'))
    $repo = [IO.Path]::GetFullPath((Get-Location).Path).TrimEnd([char[]]@('\','/'))
    if ($logDir.Equals($repo,[StringComparison]::OrdinalIgnoreCase) -or $logDir.StartsWith($repo+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'TEMP must be outside repository.' }
    $null = [IO.Directory]::CreateDirectory($logDir)
    $runId = [guid]::NewGuid().ToString('N')
    $bridgeProcess = Start-Process -FilePath $dotnet -ArgumentList ('"' + $bridgeDll + '" serveDebug') -WindowStyle Hidden -PassThru -WorkingDirectory (Get-Location).Path -RedirectStandardOutput (Join-Path $logDir ($runId+'-bridge-out.log')) -RedirectStandardError (Join-Path $logDir ($runId+'-bridge-error.log'))
    Start-Sleep -Milliseconds 700
    if ($bridgeProcess.HasExited) { throw 'FreeDSP bridge could not bind127.0.0.1:5174; inspect TEMP/AuraPEQ bridge-error.log. Do not reuse an unknown listener.' }
    Write-Host 'AuraPEQ: http://localhost:5173/ (Ctrl+C to stop Vite and owned FreeDSP bridge)'
    Write-Host 'FreeDSP RAM debug: DEV page only; no device discovery or writes until browser clicks.'
    & $npmCommand.Source run dev -- --host 127.0.0.1 --port 5173 --strictPort
    if ($LASTEXITCODE -ne 0) { throw "Dev server failed (exit $LASTEXITCODE)." }
} catch {
    [Console]::Error.WriteLine("[FAIL] Dev server: $($_.Exception.Message)")
    exit 1
} finally {
    if ($null -ne $bridgeProcess) {
        if (-not $bridgeProcess.HasExited) { & taskkill.exe /PID $bridgeProcess.Id /T /F | Out-Null; $bridgeProcess.WaitForExit() }
        $bridgeProcess.Dispose()
    }
}
