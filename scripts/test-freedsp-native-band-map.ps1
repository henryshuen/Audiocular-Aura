[CmdletBinding()]
param([ValidateSet('1','2','3','4')][string]$StartSdkBand = '1')
$ErrorActionPreference = 'Stop'
if ($args.Count -ne 0) { throw 'Only -StartSdkBand 1..4 is supported; no other test parameters.' }
$projectRoot = Split-Path -Parent $PSScriptRoot
Import-Module (Join-Path $PSScriptRoot 'freedsp\BandValidation.psm1') -Force
# Runtime logs are outside the repository; unique CreateNew never overwrites an earlier test.
$logDirectory = Join-Path ([System.IO.Path]::GetTempPath()) 'AuraPEQ'
$logDirectory = [System.IO.Path]::GetFullPath($logDirectory)
$repoDirectory = [System.IO.Path]::GetFullPath($projectRoot).TrimEnd([char[]]@('\','/'))
if ($logDirectory.Equals($repoDirectory, [StringComparison]::OrdinalIgnoreCase) -or
    $logDirectory.StartsWith($repoDirectory + [System.IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'TEMP resolves inside repository; refusing runtime log/hardware run. Use a TEMP directory outside the repository.'
}
$null = [System.IO.Directory]::CreateDirectory($logDirectory)
$logPath = Join-Path $logDirectory ('freedsp-band-map-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N') + '.log')
$stream = [System.IO.File]::Open($logPath, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write, [System.IO.FileShare]::Read)
$writer = [System.IO.StreamWriter]::new($stream, [System.Text.UTF8Encoding]::new($false)); $writer.AutoFlush = $true
$validationStarted = $false
$emit = {
    param([string]$line)
    $writer.WriteLine($line) # Complete raw stdout/stderr, prompts, answers and final summary.
    # Full hex/float/header data remain in the log; console shows useful protocol progress.
    if ($line -notmatch '^(?:[0-9a-f]{2}(?: [0-9a-f]{2}){10,}|Floats |exponent=|RAM190 count13|command=|RX entire)') { Write-Host $line }
}.GetNewClosure()
try {
    & $emit ('Full log saved to: ' + $logPath)
    & $emit 'Starting M2L offline build; no hardware command until you press ENTER at APPLY.'
    $dotnet = (Get-Command dotnet.exe -ErrorAction Stop).Source
    $project = Join-Path $projectRoot 'tools\freedsp-native\FreeDspQuery.csproj'
    $dll = Join-Path $projectRoot 'tools\freedsp-native\bin\Release\net10.0\FreeDspQuery.dll'
    & $dotnet build $project --configuration Release --nologo --verbosity quiet 2>&1 | ForEach-Object { & $emit ([string]$_) }
    if ($LASTEXITCODE -ne 0) { throw 'Native build failed; no hardware access attempted' }
    $run = {
        param($sdkBand, $restore, $emit)
        $operation = $(if ($restore) { 'RestoreRemainingBand' } else { 'ApplyRemainingBand' }) + $sdkBand
        Invoke-FreeDspNativeCommand -Dotnet $dotnet -Dll $dll -Operation $operation -Emit $emit
    }.GetNewClosure()
    $read = { param($prompt) Read-Host $prompt }
    $validationStarted = $true
    $null = Invoke-FreeDspBandValidation -RunProtocol $run -ReadAnswer $read -Emit $emit -LogPath $logPath -StartSdkBand $StartSdkBand
} catch {
    if ($validationStarted) {
        Write-Host ('STOPPED FOR REVIEW: interrupted/logging error; hardware completion may be UNKNOWN: ' + $_.Exception.Message)
        Write-Host ('Inspect partial log: ' + $logPath + '; do not retry or continue.')
    } else {
        $notRun = @(1..4 | ForEach-Object { [pscustomobject]@{
            SdkBand=$_; Wire=$_+5; ProtocolApply='NOT RUN'; AudibleApply='NOT TESTED'; ProtocolRestore='NOT RUN'; AudibleRestore='NOT TESTED'
        } })
        foreach($line in (Get-FreeDspSummary $notRun $logPath ('Startup/build error: ' + $_.Exception.Message) 0 ([int]$StartSdkBand))) { & $emit $line }
    }
} finally { $writer.Dispose() }
