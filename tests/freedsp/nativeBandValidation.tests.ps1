$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot '..\..\scripts\freedsp\BandValidation.psm1') -Force
$passed = 0
function Assert($condition, [string]$message) { if (-not $condition) { throw $message } }
function Test([string]$name, [scriptblock]$body) { & $body; $script:passed++; Write-Host ('PASS ' + $name) }
function Mock-Session([string[]]$Answers, [int[]]$Codes = @(0,0,0,0,0,0,0,0), [string]$StartSdkBand = '1') {
    $state = @{ Answers = [System.Collections.Generic.Queue[string]]::new(); Codes = [System.Collections.Generic.Queue[int]]::new();
        Calls = [System.Collections.Generic.List[string]]::new(); Lines = [System.Collections.Generic.List[string]]::new() }
    foreach($a in $Answers) { $state.Answers.Enqueue($a) }; foreach($c in $Codes) { $state.Codes.Enqueue($c) }
    $read = { param($prompt) if($state.Answers.Count -eq 0) { throw 'No mock answer left' }; return $state.Answers.Dequeue() }.GetNewClosure()
    $run = { param($sdkBand,$restore,$emit)
        $state.Calls.Add("$sdkBand/$restore")
        & $emit ("SYNTHETIC RAW OUTPUT sdk=$sdkBand restore=$restore 01 00 0d 00")
        return $state.Codes.Dequeue()
    }.GetNewClosure()
    $emit = { param($line) $state.Lines.Add([string]$line) }.GetNewClosure()
    $result = Invoke-FreeDspBandValidation $run $read $emit (Join-Path ([IO.Path]::GetTempPath()) 'AuraPEQ\synthetic-not-written.log') -StartSdkBand $StartSdkBand
    return @{ State = $state; Result = $result; Text = $state.Lines -join "`n" }
}
Test 'all ENTER: four bands, exact Apply/Restore pairs, no wire5, compact summary' {
    $m = Mock-Session -Answers (@('') * 16)
    Assert (($m.State.Calls -join ',') -eq '1/False,1/True,2/False,2/True,3/False,3/True,4/False,4/True') 'Pairs/order'
    Assert ($m.Result.StopReason -eq '' -and $m.Result.ActiveBand -eq 0) 'Completed/flat'
    foreach($wire in 6..9) { Assert ($m.Text.Contains("RESULT wire${wire}: VERIFIED")) 'All confirmed' }
    Assert ($m.Text.Contains('SDK0 -> wire5: PREVIOUSLY VERIFIED (M2K), not retested')) 'Known control retained'
    Assert ($m.Text.Contains('Paste only this summary')) 'Minimal paste-back'
    Assert (@($m.State.Lines | Where-Object { $_ -like 'SYNTHETIC RAW*' }).Count -eq 8) 'All raw mock output retained'
    foreach($band in 1..4) { foreach($phase in @('APPLY','RESTORE')) {
        Assert ($m.Text.Contains("===== SDK$band / wire$($band+5) $phase BEGIN =====")) 'Begin marker'
        Assert ($m.Text.Contains("===== SDK$band / wire$($band+5) $phase END =====")) 'End marker'
    } }
}
Test 'Apply protocol failure: no listening, restore or later band' {
    $m = Mock-Session @('') @(7)
    Assert ($m.State.Calls.Count -eq 1 -and $m.Result.Results[0].ProtocolApply -eq 'FAIL') 'Fail stop'
    Assert ($m.Result.Results[0].AudibleApply -eq 'NOT TESTED') 'No listen prompt'
    Assert ($m.Text.Contains('STOPPED FOR REVIEW') -and $m.Text.Contains('wire6 may still have')) 'Uncertain state stated'
}
Test 'Restore protocol failure: no next Apply' {
    $m = Mock-Session @('','','') @(0,7)
    Assert ($m.State.Calls.Count -eq 2 -and $m.Result.Results[0].ProtocolRestore -eq 'FAIL') 'Restore stop'
    Assert ($m.Result.Results[1].ProtocolApply -eq 'NOT RUN') 'Later round untouched'
}
Test 'N Apply: recorded, same-band Restore required; no false audible verification' {
    $m = Mock-Session @('','n','','','Q')
    Assert ($m.Result.Results[0].AudibleApply -eq 'NO' -and $m.State.Calls.Count -eq 2) 'No still restored'
    Assert ($m.Text.Contains('PROTOCOL-ONLY / NO AUDIBLE CHANGE / REVIEW REQUIRED')) 'Honest summary'
}
Test 'S Apply and P Restore: uncertain, stopped before next band' {
    $m = Mock-Session @('','s','','p')
    Assert ($m.Result.Results[0].AudibleApply -eq 'UNCERTAIN' -and $m.Result.Results[0].AudibleRestore -eq 'PARTIAL/UNCERTAIN') 'Choices'
    Assert ($m.State.Calls.Count -eq 2 -and $m.Text.Contains('STOPPED FOR REVIEW')) 'Unconfirmed restoration stops'
}
Test 'N Restore: stop before next band even when protocol passed' {
    $m = Mock-Session @('','','','N')
    Assert ($m.Result.Results[0].AudibleRestore -eq 'NO' -and $m.State.Calls.Count -eq 2) 'No restore audible proof'
}
Test 'Q at each first-band prompt aborts without unsolicited restore or later commands' {
    foreach($case in @(@('Q'),@('','Q'),@('','','Q'),@('','','','Q'))) {
        $m = Mock-Session $case
        $expected = switch ($case.Count) { 1 { 0 } 2 { 1 } 3 { 1 } 4 { 2 } }
        Assert ($m.State.Calls.Count -eq $expected -and $m.Text.Contains('STOPPED FOR REVIEW')) 'Abort exact stage'
        if($case.Count -in @(2,3)) { Assert ($m.Result.ActiveBand -eq 6) 'Warn active band' }
    }
}
Test 'invalid choice cannot silently confirm or send extra reports' {
    $m = Mock-Session @('wrong','Q')
    Assert ($m.State.Calls.Count -eq 0 -and $m.Text.Contains('Invalid choice')) 'Reprompt without hardware'
}
Test 'runner exception and missing exit code fail closed' {
    foreach($runner in @({ param($band,$restore,$emit) throw 'synthetic disconnect' }, { param($band,$restore,$emit) return $null })) {
        $lines=[System.Collections.Generic.List[string]]::new()
        $emit={param($line)$lines.Add($line)}.GetNewClosure()
        $result=Invoke-FreeDspBandValidation $runner { '' } $emit 'synthetic.log'
        Assert ($result.Results[0].ProtocolApply -eq 'FAIL' -and $result.Results[1].ProtocolApply -eq 'NOT RUN') 'Fail closed'
    }
}
Test 'EOF is abort, not ENTER' {
    $lines=[System.Collections.Generic.List[string]]::new()
    $emit={param($line)$lines.Add($line)}.GetNewClosure()
    $result=Invoke-FreeDspBandValidation { throw 'Must not run' } { return $null } $emit 'synthetic.log'
    Assert ($result.Results[0].ProtocolApply -eq 'NOT RUN' -and $result.StopReason.Contains('Aborted')) 'EOF no write'
}
Test 'real wrapper syntax/log/argument contract, without running wrapper or hardware' {
    $wrapperPath=Join-Path $PSScriptRoot '..\..\scripts\test-freedsp-native-band-map.ps1'
    $wrapper=Get-Content $wrapperPath -Raw
    Assert ($wrapper.Contains('[System.IO.Path]::GetTempPath()') -and $wrapper.Contains('[System.IO.FileMode]::CreateNew')) 'Outside repo unique log'
    Assert ($wrapper.Contains('$writer.AutoFlush = $true') -and $wrapper.Contains('$writer.WriteLine($line)')) 'Complete flushed log'
    Assert ($wrapper.Contains('$args.Count -ne 0') -and $wrapper.Contains("[ValidateSet('1','2','3','4')]")) 'Only allowlisted resume parameter'
    $errors=$null; $tokens=$null
    $null=[System.Management.Automation.Language.Parser]::ParseFile($wrapperPath,[ref]$tokens,[ref]$errors)
    Assert ($errors.Count -eq 0) 'Wrapper syntax'
    $module=Get-Content (Join-Path $PSScriptRoot '..\..\scripts\freedsp\BandValidation.psm1') -Raw
    Assert ($module.Contains('ElapsedMilliseconds -ge 30000') -and $module.Contains('finally {')) 'Native watchdog/cleanup'
    Assert (@([regex]::Matches($module,'\$child\.Start\(\)')).Count -eq 1) 'One child per operation'
}
Test 'StartSdkBand2/3/4 selects exact suffix, paired writes and first-Apply safety' {
    foreach($start in 2..4) {
        $m=Mock-Session -Answers (@('') * (4*(5-$start))) -StartSdkBand $start
        $expected=@($start..4 | ForEach-Object { "$_/False"; "$_/True" }) -join ','
        Assert (($m.State.Calls -join ',') -eq $expected) 'No earlier bands sent'
        Assert ($m.Text.Contains("=== Test 1/$((5-$start)): SDK$start -> wire$($start+5) ===")) 'Progress reflects selected count'
        Assert (@($m.State.Lines | Where-Object { $_ -like 'Protocol success: only if no abnormal*' }).Count -eq 1) 'First resumed Apply safety'
        Assert ($m.Result.StopReason -eq '' -and $m.Text.Contains('Run selection: StartSdkBand='+$start)) 'Resume logged/summarized'
    }
}
Test 'resume summary preserves wire6 verified and skipped-unconfirmed wire7 pending' {
    $m=Mock-Session -Answers (@('') * 12) -StartSdkBand 2
    $summary=$m.Text.Substring($m.Text.LastIndexOf('M2L BAND MAP SUMMARY'))
    $wire6=$summary.Substring($summary.IndexOf('SDK1 -> wire6:'),$summary.IndexOf('SDK2 -> wire7:')-$summary.IndexOf('SDK1 -> wire6:'))
    Assert ($wire6.Contains('PREVIOUSLY VERIFIED (M2L prior run)') -and $wire6.Contains('SKIPPED because StartSdkBand')) 'Previous verified skip'
    Assert (-not $wire6.Contains('NOT TESTED') -and -not $wire6.Contains('NOT RUN')) 'No misleading untested verified band'
    $later=Mock-Session -Answers (@('') * 8) -StartSdkBand 3
    Assert ($later.Text.Contains('PROTOCOL VERIFIED / AUDIBLE RESTORE UNCONFIRMED (prior run); STILL PENDING')) 'Skipped wire7 not promoted'
    Assert ($later.Text.Contains('RESULT wire8: VERIFIED') -and $later.Text.Contains('RESULT wire9: VERIFIED')) 'This run results'
}
Test 'resumed protocol Apply/Restore failures stop all later rounds' {
    foreach($case in @(@(''),@('','',''))) {
        $codes=$(if($case.Count -eq 1){@(7)}else{@(0,7)})
        $m=Mock-Session -Answers $case -Codes $codes -StartSdkBand 2
        Assert ($m.State.Calls.Count -eq $codes.Count -and $m.Result.Results[2].ProtocolApply -eq 'NOT RUN') 'No wire8 after failure'
        Assert ($m.Text.Contains('STOPPED FOR REVIEW')) 'Fail review'
    }
}
Test 'resumed uncertain Restore stops; selected remaining bands stay pending' {
    $m=Mock-Session -Answers @('','','','P') -StartSdkBand 2
    Assert (($m.State.Calls -join ',') -eq '2/False,2/True') 'Wire7 only'
    Assert ($m.Result.Results[1].ProtocolRestore -eq 'PASS' -and $m.Result.Results[1].AudibleRestore -eq 'PARTIAL/UNCERTAIN') 'Not protocol failure'
    Assert ($m.Text.Contains('SELECTED BUT NOT RUN / PENDING') -and $m.Text.Contains('STOPPED FOR REVIEW')) 'Wire8/9 pending'
}
Test 'invalid resume values fail parameter binding before prompt, log creation or hardware' {
    $wrapperPath=Join-Path $PSScriptRoot '..\..\scripts\test-freedsp-native-band-map.ps1'
    foreach($bad in @('0','5','-1','1.5','abc','')) {
        $caught=$false
        try { $null=Mock-Session -Answers @('Q') -StartSdkBand $bad } catch { $caught=$true }
        Assert $caught 'Internal resume validation'
        $caught=$false
        try { & $wrapperPath -StartSdkBand $bad } catch { $caught=$true }
        Assert $caught 'Public wrapper rejects before body runs'
    }
}
Write-Host "PowerShell band-validation offline tests: $passed passed; MOCK ONLY, no hardware access."
