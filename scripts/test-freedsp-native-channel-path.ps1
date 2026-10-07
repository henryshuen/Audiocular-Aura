$ErrorActionPreference = 'Stop'
if ($args.Count -ne 0) { throw 'M2P takes no arguments; fixed wire5 PK400/-12/Q1 only.' }
$repo = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot)).TrimEnd([char[]]@('\','/'))
Import-Module (Join-Path $PSScriptRoot 'freedsp/BandValidation.psm1') -Force
Import-Module (Join-Path $PSScriptRoot 'freedsp/ChannelValidation.psm1') -Force
$directory = [IO.Path]::GetFullPath((Join-Path ([IO.Path]::GetTempPath()) 'AuraPEQ'))
if ($directory.Equals($repo,[StringComparison]::OrdinalIgnoreCase) -or $directory.StartsWith($repo+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'TEMP must be outside repository.' }
$null = [IO.Directory]::CreateDirectory($directory)
$logPath = Join-Path $directory ('freedsp-m2p-'+[guid]::NewGuid().ToString('N')+'.log')
$writer = [IO.StreamWriter]::new([IO.File]::Open($logPath,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::Read),[Text.UTF8Encoding]::new($false));$writer.AutoFlush=$true
$emit = {param($line) $writer.WriteLine($line);Write-Host $line}.GetNewClosure()
try {
    & $emit "Full log: $logPath. Stop dev.ps1 with Ctrl+C first; no browser RAM operations during M2P. Initialization will not access hardware."
    $dotnet = (Get-Command dotnet.exe -ErrorAction Stop).Source
    # Separate output avoids the Web bridge Release DLL; no stale process termination here.
    $output = Join-Path $directory ('m2p-build-'+[guid]::NewGuid().ToString('N'))
    & $dotnet build (Join-Path $repo 'tools/freedsp-native/FreeDspQuery.csproj') --configuration Release --output $output --nologo --verbosity quiet 2>&1 | ForEach-Object { & $emit ([string]$_) }
    if ($LASTEXITCODE -ne 0) { throw 'M2P build failed; no hardware action' }
    $dll = Join-Path $output 'FreeDspQuery.dll'
    $run = {param($operation,$emit) Invoke-FreeDspNativeCommand -Dotnet $dotnet -Dll $dll -Operation $operation -Emit $emit}.GetNewClosure()
    $null = Invoke-FreeDspChannelValidation -RunProtocol $run -ReadAnswer {param($prompt) Read-Host $prompt} -Emit $emit
} catch { & $emit ('STOP: '+$_.Exception.Message+'; no automatic writes/retries. Completion may be unknown if interrupted.') }
finally { $writer.Dispose();Write-Host "M2P full log: $logPath" }
