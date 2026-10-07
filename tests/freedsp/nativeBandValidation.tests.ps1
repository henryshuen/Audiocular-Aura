$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot '..\..\scripts\freedsp\BandValidation.psm1') -Force
$passed = 0
function Assert($condition, [string]$message) { if (-not $condition) { throw $message } }
function Test([string]$name, [scriptblock]$body) { & $body; $script:passed++; Write-Host ('PASS ' + $name) }
function Mock-Session([string[]]$Answers, [int[]]$Codes = @(0,0,0,0,0,0,0,0), [string]$StartSdkBand = '4', [string]$Profile = 'SdkRemaining') {
    $state=@{ Answers=[Collections.Generic.Queue[string]]::new(); Codes=[Collections.Generic.Queue[int]]::new();
        Calls=[Collections.Generic.List[string]]::new(); Lines=[Collections.Generic.List[string]]::new() }
    foreach($a in $Answers){$state.Answers.Enqueue($a)}; foreach($c in $Codes){$state.Codes.Enqueue($c)}
    $read={param($prompt) if($state.Answers.Count -eq 0){throw 'No mock answer'}; $state.Answers.Dequeue()}.GetNewClosure()
    $run={param($band,$restore,$emit) $state.Calls.Add("$band/$restore"); return $state.Codes.Dequeue()}.GetNewClosure()
    $emit={param($line)$state.Lines.Add([string]$line)}.GetNewClosure()
    $result=Invoke-FreeDspBandValidation $run $read $emit 'synthetic-not-written.log' -StartSdkBand $StartSdkBand -Profile $Profile
    return @{State=$state;Result=$result;Text=$state.Lines -join "`n"}
}
Test 'A sets APPLIED' {
    $m=Mock-Session @('A','Q'); Assert ($m.Text.Contains('===== STATE: APPLIED =====') -and $m.Result.ActiveBand -eq 9) 'Apply state'
}
Test 'R sets RESTORED' {
    $m=Mock-Session @('R','Q'); Assert ($m.Text.Contains('===== STATE: RESTORED =====') -and $m.Result.ActiveBand -eq 0) 'Restore state'
}
Test 'repeated A/R toggles work before confirmation' {
    $m=Mock-Session @('A','R','A','R','')
    Assert (($m.State.Calls -join ',') -eq '4/False,4/True,4/False,4/True') 'Four explicit operations'
    Assert ($m.Result.StopReason -eq '' -and $m.Text.Contains('RESULT wire9: VERIFIED')) 'Confirmed after toggling'
}
Test 'ENTER blocked until both operation types succeeded' {
    $m=Mock-Session @('','A','','Q')
    Assert (@($m.State.Lines | Where-Object {$_ -like 'Confirm blocked:*'}).Count -eq 2) 'Both required'
    Assert ($m.Result.Results[3].AudibleApply -ne 'YES') 'No false confirmation'
}
Test 'ENTER accepted after both succeed even if currently APPLIED; no later-band accumulation' {
    $m=Mock-Session -Answers @('R','A','') -StartSdkBand 2
    Assert ($m.Result.Results[1].AudibleApply -eq 'YES' -and $m.Result.Results[1].AudibleRestore -eq 'YES') 'Enter confirms'
    Assert ($m.State.Calls.Count -eq 2 -and $m.Text.Contains('wire7 may still have')) 'Warn and stop while applied'
}
Test 'N records no clear difference and stops; applied state warned' {
    $m=Mock-Session -Answers @('A','N') -StartSdkBand 2
    Assert ($m.State.Calls.Count -eq 1 -and $m.Result.Results[1].AudibleApply -eq 'NO') 'N stops'
    Assert ($m.Text.Contains('AUDIBLE VALIDATION FAILED / NO CLEAR DIFFERENCE') -and $m.Text.Contains('wire7 may still have')) 'N summary'
}
Test 'Q aborts immediately with no automatic restore' {
    foreach($answers in @(@('Q'),@('A','Q'))) {
        $m=Mock-Session $answers
        Assert ($m.State.Calls.Count -eq ($answers.Count-1) -and $m.Text.Contains('STOPPED FOR REVIEW')) 'Q no extra command'
        if($answers.Count -eq 2){Assert ($m.Text.Contains('wire9 may still have')) 'Active warning'}
    }
}
Test 'StartSdkBand2 starts wire7 and preserves same-band selection' {
    $m=Mock-Session -Answers @('A','R','','Q') -StartSdkBand 2
    Assert (($m.State.Calls -join ',') -eq '2/False,2/True') 'SDK2 pair only'
    Assert ($m.Text.Contains('Current band: SDK2 -> wire7') -and $m.Text.Contains('RESULT wire6: PREVIOUSLY VERIFIED')) 'Resume summary'
}
Test 'protocol failure still stops without listening or retry' {
    $m=Mock-Session -Answers @('A') -Codes @(7) -StartSdkBand 2
    Assert ($m.State.Calls.Count -eq 1 -and $m.Result.Results[1].ProtocolApply -eq 'FAIL') 'Fail stop'
    Assert ($m.Result.Results[2].ProtocolApply -eq 'NOT RUN') 'No later band'
}
Test 'M2M all four raw slots toggle one at a time; no verified slots retested' {
    $m=Mock-Session -Answers @('A','R','','A','R','','A','R','','A','R','') -StartSdkBand 1 -Profile WireCandidates
    Assert (($m.State.Calls -join ',') -eq '1/False,1/True,2/False,2/True,3/False,3/True,4/False,4/True') 'Eight explicit calls only'
    Assert (($m.Result.Results.Wire -join ',') -eq '1,2,3,4') 'Raw slots, not SDK+5'
    Assert ($m.Result.StopReason -eq '' -and $m.Result.ActiveBand -eq 0) 'No filter accumulated'
    Assert ($m.Text.Contains('SDK field UNKNOWN') -and $m.Text.Contains('wire5..9: VERIFIED')) 'Honest labels'
    Assert (-not $m.Text.Contains('SDK1 -> wire1')) 'No fictitious SDK mapping'
}
Test 'M2M blocked confirmation and repeated toggles' {
    $m=Mock-Session -Answers @('','A','','R','A','R','') -Profile WireCandidates
    Assert ($m.State.Calls.Count -eq 4 -and $m.Text.Contains('Confirm blocked')) 'Only explicit A/R'
    Assert ($m.Text.Contains('RESULT wire4: VERIFIED')) 'Confirmed candidate only'
}
Test 'M2M N or Q stops and warns without automatic restore' {
    foreach($end in @('N','Q')) {
        $m=Mock-Session -Answers @('A',$end) -StartSdkBand 1 -Profile WireCandidates
        Assert ($m.State.Calls.Count -eq 1 -and $m.Result.ActiveBand -eq 1) 'No extra command'
        Assert ($m.Text.Contains('wire1 may still have')) 'Active warning'
    }
}
Test 'M2M failure stops later candidates; no audible success claim' {
    foreach($codes in @(@(7),@(0,7))) {
        $m=Mock-Session -Answers @('A','R') -Codes $codes -StartSdkBand 1 -Profile WireCandidates
        Assert ($m.State.Calls.Count -eq $codes.Count -and $m.Result.Results[1].ProtocolApply -eq 'NOT RUN') 'Fail stop'
        Assert ($m.Result.Results[0].AudibleApply -ne 'YES') 'No false sound claim'
    }
}
Test 'M2M Enter while applied stops before accumulating another slot' {
    $m=Mock-Session -Answers @('R','A','') -StartSdkBand 1 -Profile WireCandidates
    Assert ($m.State.Calls.Count -eq 2 -and $m.Result.ActiveBand -eq 1 -and $m.Text.Contains('stopping before later bands')) 'Same safety gate'
}
Test 'M2M resume skips earlier slots without declaring them verified' {
    $m=Mock-Session -Answers @('Q') -StartSdkBand 3 -Profile WireCandidates
    Assert ($m.State.Calls.Count -eq 0 -and $m.Text.Contains('RESULT wire1: SKIPPED / STILL PENDING')) 'Honest skipped status'
}
Write-Host "PowerShell toggle focused tests: $passed passed; MOCK ONLY, no hardware access."
