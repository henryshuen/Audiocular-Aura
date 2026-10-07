$ErrorActionPreference='Stop'
Import-Module (Join-Path $PSScriptRoot '../../scripts/freedsp/ChannelValidation.psm1') -Force
function Assert($ok,$message){if(-not $ok){throw $message}}
function Mock([string[]]$Answers,[int[]]$Codes=@(0,0,0,0,0,0,0,0,0,0)) {
    $state=@{Answers=[Collections.Generic.Queue[string]]::new();Codes=[Collections.Generic.Queue[int]]::new();Calls=[Collections.Generic.List[string]]::new();Lines=[Collections.Generic.List[string]]::new()}
    foreach($a in $Answers){$state.Answers.Enqueue($a)};foreach($c in $Codes){$state.Codes.Enqueue($c)}
    $read={param($prompt)$state.Lines.Add('PROMPT '+$prompt);$state.Answers.Dequeue()}.GetNewClosure()
    $run={param($operation,$emit)
        $state.Calls.Add($operation);$code=$state.Codes.Dequeue()
        if($code -eq 0){
            if($operation.EndsWith('Path0') -or $operation.EndsWith('Both')){& $emit 'PATH0 WIRE5 PASS'}
            if($operation.EndsWith('Path1') -or $operation.EndsWith('Both')){& $emit 'PATH1 WIRE5 PASS'}
        } else { & $emit 'PATH0 FAIL: mock; no later path'; }
        return $code
    }.GetNewClosure()
    $emit={param($line)$state.Lines.Add([string]$line)}.GetNewClosure()
    $r=Invoke-FreeDspChannelValidation $run $read $emit
    return @{Result=$r;State=$state;Text=$state.Lines -join "`n"}
}
$m=Mock @('Q')
foreach($text in @('APO 必須關閉','音量 1–2/100','400 Hz / -12 dB / Q1','第一次 Apply','PowerShell 當成指令','[主選單]','U / 0 / 1 / B / Q')){Assert ($m.Text.Contains($text)) 'Chinese help/menu must be complete'}
Assert ($m.State.Calls.Count -eq 0) 'Startup must never write'
Write-Host 'PASS Chinese startup/menu and zero startup writes'
$m=Mock @('U','Q')
Assert (($m.State.Calls -join ',') -eq 'M2PRestoreBoth') 'U invokes only existing bounded two-path unity operation'
Assert ($m.Text.Contains('PATH0 RESTORE PASS') -and $m.Text.Contains('PATH1 RESTORE PASS')) 'Per-path result markers'
Assert ($m.Text.Contains('Baseline clean: path0 + path1 wire5 unity restored') -and -not $m.Result.MayRemainActive) 'Only both-success baseline is clean'
Write-Host 'PASS U restores both unity with per-path PASS'
$m=Mock @('U') @(7)
Assert ($m.State.Calls.Count -eq 1 -and -not $m.Text.Contains('Baseline clean:') -and $m.Text.Contains('PATH0 RESTORE FAIL')) 'Failed baseline stops, no retry or false success'
Write-Host 'PASS U failure stops without clean claim or retries'
$m=Mock @('U','0','A','R','A','R','','1','A','R','Q','B','A','R','','Q')
Assert (($m.State.Calls -join ',') -eq 'M2PRestoreBoth,M2PApplyPath0,M2PRestorePath0,M2PApplyPath0,M2PRestorePath0,M2PApplyPath1,M2PRestorePath1,M2PApplyBoth,M2PRestoreBoth') 'Repeat toggles and return to main menu'
Assert ($m.Result.StopReason -eq '' -and -not $m.Result.MayRemainActive -and $m.Result.Results.Length -eq 0) 'No forced observations/gates'
Write-Host 'PASS repeated A/R for0/1/B and persistent menu, optional observation only'
$m=Mock @('U','0','A','O','INVALID','R','','Q')
Assert (($m.State.Calls -join ',') -eq 'M2PRestoreBoth,M2PApplyPath0,M2PRestorePath0') 'Invalid observation never blocks explicit Restore'
Assert ($m.Text.Contains('path0=APPLIED') -and $m.Text.Contains('已取消紀錄') -and -not $m.Result.MayRemainActive) 'Applied state visible and restored'
Write-Host 'PASS invalid ear answer preserves visible state and Restore availability'
$m=Mock @('U','1','A','O','R','INVALID','R','','Q')
Assert ($m.State.Calls[2] -eq 'M2PRestorePath1' -and -not $m.Result.MayRemainActive) 'Invalid image answer stays in mode'
Write-Host 'PASS invalid image answer does not exit'
$m=Mock @('U','0','A','O','RESTORE','O','L','C','','Q')
Assert ($m.State.Calls[2] -eq 'M2PRestorePath0' -and $m.Result.Results[0].Path0State -eq 'UNITY') 'Explicit Restore from observation and captured command state'
Assert (-not $m.Text.Contains('Stereo gate: PASS')) 'Observation does not prove mapping'
Write-Host 'PASS observation Restore escape and optional recording'
$m=Mock @('U','1','A','O','R','CLEAN','','Q')
Assert ($m.State.Calls[2] -eq 'M2PRestoreBoth' -and -not $m.Result.MayRemainActive) 'Emergency clean from image question'
Write-Host 'PASS observation emergency-clean escape'
$m=Mock @('0','A','Q','Q')
Assert ($m.State.Calls.Count -eq 1 -and $m.Result.MayRemainActive -and $m.Text.Contains('path0=APPLIED')) 'Q returns menu, final exit warns; never automaticRestore'
Write-Host 'PASS leaving applied mode is visible, no hidden automatic write'
$m=Mock @('0','A') @(7)
Assert ($m.State.Calls.Count -eq 1 -and $m.Result.MayRemainActive -and $m.Result.StopReason) 'Failure stops with UNKNOWN state'
Write-Host 'PASS failure stops without retries/rollback'
$module=Get-Content (Join-Path $PSScriptRoot '../../scripts/freedsp/ChannelValidation.psm1') -Raw
Assert ($module -notmatch 'Stop-Process|taskkill|Get-CimInstance|Get-Process') 'Toggle UX never touches process ownership'
Write-Host 'PASS unrelated process behavior untouched'
$m=Mock @('U','0','A','O','L','R','R','','1','A','O','R','L','R','','B','A','O','B','C','R','','Q')
foreach($entry in @('Path0 Ear=L Image=R','Path1 Ear=R Image=L','Both Ear=B Image=C')){Assert ($m.Text -match ('(?m)^'+[regex]::Escape($entry))) 'Final summary aggregates saved observations'}
Assert ($m.Result.Results.Length -eq 3) 'All observations retained'
Write-Host 'PASS final summary aggregates path0/path1/both observations'
Write-Host 'M2P Chinese toggle: 12 focused mock scenarios PASS; no hardware operations'
