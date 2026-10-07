$ErrorActionPreference='Stop'
Import-Module (Join-Path $PSScriptRoot '../../scripts/freedsp/ChannelValidation.psm1') -Force
function Assert($ok,$message){if(-not $ok){throw $message}}
function Mock([string[]]$Answers,[int[]]$Codes=@(0,0,0,0,0,0)) {
    $state=@{Answers=[Collections.Generic.Queue[string]]::new();Codes=[Collections.Generic.Queue[int]]::new();Calls=[Collections.Generic.List[string]]::new();Lines=[Collections.Generic.List[string]]::new()}
    foreach($a in $Answers){$state.Answers.Enqueue($a)};foreach($c in $Codes){$state.Codes.Enqueue($c)}
    $read={param($prompt)$state.Answers.Dequeue()}.GetNewClosure()
    $run={param($operation,$emit)$state.Calls.Add($operation);$state.Codes.Dequeue()}.GetNewClosure()
    $emit={param($line)$state.Lines.Add([string]$line)}.GetNewClosure()
    $r=Invoke-FreeDspChannelValidation $run $read $emit
    return @{Result=$r;State=$state;Text=$state.Lines -join "`n"}
}
$m=Mock @('A','L','R','R','Y','A','R','L','R','Y','A','B','C','Y','R','Y')
Assert (($m.State.Calls -join ',') -eq 'M2PApplyPath0,M2PRestorePath0,M2PApplyPath1,M2PRestorePath1,M2PApplyBoth,M2PRestoreBoth') 'Exactly six explicit operations, only after recorded A/B'
Assert ($m.Text.Contains('Stereo gate: PASS') -and -not $m.Result.MayRemainActive) 'Full single-band stereo result'
Write-Host 'PASS A left/B right/recovery gates unlock explicit C; exact operations and observations'
$m=Mock @('A','L','R','R','Y','A','L','R','R','Y')
Assert ($m.State.Calls.Count -eq 4 -and $m.Result.StopReason.Contains('C BLOCKED')) 'Both paths same side must block C'
Write-Host 'PASS same-ear B blocks dual-path test C'
$m=Mock @('A','L','R','R','U')
Assert ($m.State.Calls.Count -eq 2 -and $m.Result.Results[0].Recovered -eq 'U') 'Uncertain restoration must stop before B'
Write-Host 'PASS uncertain Restore stops later stages'
$m=Mock @('A') @(7)
Assert ($m.State.Calls.Count -eq 1 -and $m.Result.MayRemainActive) 'Failure no retry/automatic restore'
Write-Host 'PASS protocol failure stops with partial RAM warning'
$m=Mock @('A','Q')
Assert ($m.State.Calls.Count -eq 1 -and $m.Result.MayRemainActive) 'Q must not automatically restore'
Write-Host 'PASS Q stops without hidden operations'
$m=Mock @('Q')
Assert ($m.State.Calls.Count -eq 0) 'No hardware without explicit A'
Write-Host 'PASS no startup writes'
$m=Mock @('A','L','R','R','Y','A','R','L','R','Y','A','B','R','N','R','Y')
Assert ($m.State.Calls.Count -eq 6 -and $m.Text.Contains('Stereo gate: UNRESOLVED')) 'C image shift cannot pass despite protocol/recovery'
Write-Host 'PASS unequal/off-center C never claims stereo gate passed'
Write-Host 'Channel validation: 7 focused mock scenarios PASS; no real process/HID calls'
