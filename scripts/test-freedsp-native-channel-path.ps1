$ErrorActionPreference = 'Stop'
if ($args.Count -ne 0) { throw 'M2P 不接受參數；固定 wire5、400Hz/-12dB/Q1。' }
$repo = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot)).TrimEnd([char[]]@('\','/'))
Import-Module (Join-Path $PSScriptRoot 'freedsp/BandValidation.psm1') -Force
Import-Module (Join-Path $PSScriptRoot 'freedsp/ChannelValidation.psm1') -Force
$directory = [IO.Path]::GetFullPath((Join-Path ([IO.Path]::GetTempPath()) 'AuraPEQ'))
if ($directory.Equals($repo,[StringComparison]::OrdinalIgnoreCase) -or $directory.StartsWith($repo+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'TEMP 必須位於 repository 外。' }
$null = [IO.Directory]::CreateDirectory($directory)
$logPath = Join-Path $directory ('freedsp-m2p-'+[guid]::NewGuid().ToString('N')+'.log')
$writer = [IO.StreamWriter]::new([IO.File]::Open($logPath,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::Read),[Text.UTF8Encoding]::new($false));$writer.AutoFlush=$true
$emit = {
    param($line)
    $writer.WriteLine($line) # Keep every native byte/diagnostic in the full log.
    if ($line -match '[\u4e00-\u9fff]|^PATH[01] (?:APPLY|RESTORE) (?:PASS|FAIL)$|^Baseline clean:') { Write-Host $line }
}.GetNewClosure()
try {
    & $emit "完整 log：$logPath。請先 Ctrl+C 停止 dev.ps1，測試時勿操作 Web RAM。啟動／建置不存取硬體。"
    $dotnet = (Get-Command dotnet.exe -ErrorAction Stop).Source
    # Separate output avoids the Web bridge Release DLL; no stale process termination here.
    $output = Join-Path $directory ('m2p-build-'+[guid]::NewGuid().ToString('N'))
    & $dotnet build (Join-Path $repo 'tools/freedsp-native/FreeDspQuery.csproj') --configuration Release --output $output --nologo --verbosity quiet 2>&1 | ForEach-Object { & $emit ([string]$_) }
    if ($LASTEXITCODE -ne 0) { throw 'M2P 建置失敗；未操作硬體。' }
    $dll = Join-Path $output 'FreeDspQuery.dll'
    $run = {param($operation,$emit) Invoke-FreeDspNativeCommand -Dotnet $dotnet -Dll $dll -Operation $operation -Emit $emit}.GetNewClosure()
    $null = Invoke-FreeDspChannelValidation -RunProtocol $run -ReadAnswer {param($prompt) Read-Host $prompt} -Emit $emit
} catch { & $emit ('STOP：'+$_.Exception.Message+'；不自動寫入或重試。中斷時完成狀態可能未知，wire5 可能仍有 EQ。') }
finally { $writer.Dispose();Write-Host "M2P 完整 log：$logPath";Write-Host '已返回 PowerShell 後，A/R/Y 不再控制測試；需要時請重新啟動測試。' }
