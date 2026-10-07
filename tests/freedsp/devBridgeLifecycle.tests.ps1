$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot '../../scripts/freedsp/DevBridgeLifecycle.psm1') -Force
$dll = 'D:\Henry\Documents\ChatGPT\AuraPEQ\tools\freedsp-native\bin\Release\net10.0\FreeDspQuery.dll'
$dotnetPath = 'C:\Program Files\dotnet\dotnet.exe'
function Candidate($id, $path = $dll, $operation = 'serveDebug') {
    [pscustomobject]@{ProcessId=$id;Name='dotnet.exe';ExecutablePath=$dotnetPath;CreationDate='2026-10-08T00:00:00';CommandLine=('"'+$dotnetPath+'" "'+$path+'" '+$operation)}
}
function Assert($ok, $message) { if (-not $ok) { throw $message } }
function Mocks($processes) {
    $state = @{Processes=@($processes);Stopped=@();Waited=@()}
    return @{
        State=$state
        Query={ $state.Processes }.GetNewClosure()
        Terminate={param($ownedId) $state.Stopped+= $ownedId; $state.Processes=@($state.Processes | Where-Object ProcessId -ne $ownedId)}.GetNewClosure()
        Wait={param($ownedId) $state.Waited+= $ownedId; return $true}.GetNewClosure()
    }
}
$owned = Candidate 21824
$other = Candidate 12345 'D:\Other\FreeDspQuery.dll'
$m = Mocks @($owned,$other)
Clear-AuraStaleBridge $dll $dotnetPath $m.Query $m.Terminate $m.Wait
Assert ($m.State.Stopped.Count -eq 1 -and $m.State.Stopped[0] -eq 21824) 'Stale owned bridge must stop, unrelated process must survive'
Assert ($m.State.Waited[0] -eq 21824 -and $m.State.Processes[0].ProcessId -eq 12345) 'Wait for owned exit before startup continues'
Write-Host 'PASS stale owned -> stop -> wait -> startup continues; unrelated dotnet survives'
foreach ($candidate in @($other,(Candidate 12 $dll 'debugInspect'),(Candidate 13 ($dll+'.backup')))) {
    $m = Mocks @($candidate)
    Clear-AuraStaleBridge $dll $dotnetPath $m.Query $m.Terminate $m.Wait
    Assert ($m.State.Stopped.Count -eq 0) 'Unrelated/wrong operation/path must never stop'
}
Write-Host 'PASS unrelated dotnet/path/operation never killed'
$m = Mocks @()
Clear-AuraStaleBridge $dll $dotnetPath $m.Query $m.Terminate $m.Wait
Assert ($m.State.Stopped.Count -eq 0 -and $m.State.Waited.Count -eq 0) 'No stale process normal startup'
Write-Host 'PASS no stale process normal startup'
$m = Mocks @($owned,(Candidate 55555))
Stop-AuraOwnedBridge $owned $dll $dotnetPath $m.Query $m.Terminate $m.Wait
Assert ($m.State.Stopped.Count -eq 1 -and $m.State.Stopped[0] -eq 21824 -and $m.State.Processes[0].ProcessId -eq 55555) 'Exit cleanup uses only saved owned PID'
Write-Host 'PASS exit cleanup uses owned PID only'
$reused = Candidate 21824
$reused.CreationDate = '2026-10-08T00:01:00'
$m = Mocks @($reused)
$failed=$false
try { Stop-AuraOwnedBridge $owned $dll $dotnetPath $m.Query $m.Terminate $m.Wait } catch { $failed=$_.Exception.Message -match '21824 changed identity' }
Assert ($failed -and $m.State.Stopped.Count -eq 0) 'Reused PID must not stop'
Write-Host 'PASS recycled PID rejected'
$m = Mocks @($owned)
$failed=$false
try { Clear-AuraStaleBridge $dll $dotnetPath $m.Query {param($ownedId) throw 'access denied'} $m.Wait } catch { $failed=$_.Exception.Message -match 'PID 21824.*access denied' }
Assert $failed 'Cannot stop must produce actionable PID error, not proceed to build'
Write-Host 'PASS failed stop identifies PID and aborts startup'
$source = Get-Content (Join-Path $PSScriptRoot '../../scripts/dev.ps1') -Raw
Assert ($source.IndexOf('Clear-AuraStaleBridge') -lt $source.IndexOf('& $dotnet build')) 'Cleanup must precede build'
Assert ($source -match '(?s)finally\s*\{.*Stop-AuraOwnedBridge -OwnedProcess \$ownedBridge') 'Owned cleanup must run in finally'
Write-Host 'PASS startup order and finally wiring; all mocks, no real process termination/hardware'

$nativeOwned = Candidate 21999 $dll 'serveTransport'
$m = Mocks @($nativeOwned,$other)
Clear-AuraStaleBridge $dll $dotnetPath $m.Query $m.Terminate $m.Wait
Assert ($m.State.Stopped.Count -eq 1 -and $m.State.Stopped[0] -eq 21999 -and $m.State.Processes[0].ProcessId -eq 12345) 'Normal transport helper ownership is exact; unrelated process survives'
Write-Host 'PASS serveTransport ownership, stale cleanup and unrelated process safety'
