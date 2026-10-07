Set-StrictMode -Version Latest

function Read-FreeDspChoice {
    param([scriptblock]$ReadAnswer, [scriptblock]$Emit, [string]$Prompt, [string[]]$Allowed)
    while ($true) {
        & $Emit ('PROMPT: ' + $Prompt)
        $answer = (& $ReadAnswer $Prompt)
        if ($null -eq $answer) { $answer = 'Q' } # EOF/cancel is never an implicit ENTER.
        $answer = ([string]$answer).Trim().ToUpperInvariant()
        & $Emit ('ANSWER: ' + $(if ($answer -eq '') { '<ENTER>' } else { $answer }))
        if ($answer -in $Allowed) { return $answer }
        & $Emit 'Invalid choice; no command sent. Use the displayed choices.'
    }
}

function Get-FreeDspSummary {
    param($Results, [string]$LogPath, [string]$StopReason, [int]$ActiveBand, [ValidateRange(1,4)][int]$StartSdkBand = 1)
    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.Add('==================================================')
    $lines.Add('M2L BAND MAP SUMMARY')
    $lines.Add('Filter: PK400Hz / -12dB / Q1.0; selector0; current rate from matching346')
    $lines.Add('SDK0 -> wire5: PREVIOUSLY VERIFIED (M2K), not retested')
    $lines.Add("Run selection: StartSdkBand=$StartSdkBand; SDK$StartSdkBand through SDK4")
    foreach ($r in $Results) {
        $lines.Add('')
        $lines.Add(('SDK{0} -> wire{1}:' -f $r.SdkBand, $r.Wire))
        if ($r.SdkBand -eq 1) { $lines.Add('Prior evidence: PREVIOUSLY VERIFIED (M2L prior run)') }
        if ($r.SdkBand -eq 2) { $lines.Add('Prior evidence: PROTOCOL VERIFIED / AUDIBLE RESTORE UNCONFIRMED; Apply audible YES (M2L prior run)') }
        if ($r.SdkBand -lt $StartSdkBand) {
            $lines.Add('This run: SKIPPED because StartSdkBand was used')
            $lines.Add($(if ($r.SdkBand -eq 1) { 'RESULT wire6: PREVIOUSLY VERIFIED (M2L prior run)' }
                elseif ($r.SdkBand -eq 2) { 'RESULT wire7: PROTOCOL VERIFIED / AUDIBLE RESTORE UNCONFIRMED (prior run); STILL PENDING' }
                else { "RESULT wire$($r.Wire): SKIPPED / STILL PENDING" }))
            continue
        }
        $lines.Add($(if ($r.ProtocolApply -eq 'NOT RUN') { 'This run: SELECTED BUT NOT RUN / PENDING' } else { 'This run: TESTED' }))
        $lines.Add('Protocol Apply: ' + $r.ProtocolApply)
        $lines.Add('Audible Apply: ' + $r.AudibleApply)
        $lines.Add('Protocol Restore: ' + $r.ProtocolRestore)
        $lines.Add('Audible Restore: ' + $r.AudibleRestore)
        $classification = 'NOT TESTED / PENDING'
        if ($r.ProtocolApply -eq 'FAIL' -or $r.ProtocolRestore -eq 'FAIL') { $classification = 'FAILED / REVIEW REQUIRED' }
        elseif ($r.AudibleApply -eq 'NO') { $classification = 'AUDIBLE VALIDATION FAILED / NO CLEAR DIFFERENCE' }
        elseif ($r.ProtocolApply -eq 'PASS' -and $r.ProtocolRestore -eq 'PASS') {
            if ($r.AudibleApply -eq 'YES' -and $r.AudibleRestore -eq 'YES') { $classification = 'VERIFIED' }
            elseif ($r.AudibleApply -eq 'NO') { $classification = 'PROTOCOL-ONLY / NO AUDIBLE CHANGE / REVIEW REQUIRED' }
            else { $classification = 'PROTOCOL-ONLY / AUDIBLE UNCONFIRMED / REVIEW REQUIRED' }
        }
        elseif ($r.ProtocolApply -eq 'PASS') { $classification = 'APPLIED / RESTORE UNCONFIRMED / REVIEW REQUIRED' }
        $lines.Add(('RESULT wire{0}: {1}' -f $r.Wire, $classification))
    }
    $lines.Add('')
    $lines.Add('RESULT: ' + $(if ($StopReason) { 'STOPPED FOR REVIEW: ' + $StopReason } else { 'COMPLETED' }))
    if ($ActiveBand -gt 0) { $lines.Add("WARNING: wire$ActiveBand may still have the test filter; no automatic restore or retry was sent.") }
    $selected = @($Results | Where-Object { $_.SdkBand -ge $StartSdkBand })
    $allClear = @($selected | Where-Object {
        $_.ProtocolApply -ne 'PASS' -or $_.ProtocolRestore -ne 'PASS' -or $_.AudibleApply -ne 'YES' -or $_.AudibleRestore -ne 'YES'
    }).Count -eq 0
    $lines.Add($(if ($allClear) { 'Paste only this summary; selected bands passed protocol and audible reversal. Skipped/pending bands retain prior status.' }
        else { 'Paste this summary plus relevant SDK/wire APPLY/RESTORE log sections for failed, uncertain, contradictory or differing results.' }))
    $lines.Add('Full log saved to:')
    $lines.Add($LogPath)
    $lines.Add('==================================================')
    return $lines.ToArray()
}

# RunProtocol and ReadAnswer are dependency seams for offline mocks, not script/CLI parameters.
function Invoke-FreeDspBandValidation {
    param([scriptblock]$RunProtocol, [scriptblock]$ReadAnswer, [scriptblock]$Emit, [string]$LogPath,
        [ValidateSet('1','2','3','4')][string]$StartSdkBand = '1')
    $firstBand = [int]$StartSdkBand
    $results = @(1..4 | ForEach-Object { [pscustomobject]@{
        SdkBand = $_; Wire = $_ + 5; ProtocolApply = 'NOT RUN'; AudibleApply = 'NOT TESTED';
        ProtocolRestore = 'NOT RUN'; AudibleRestore = 'NOT TESTED'
    } })
    $stopReason = ''; $activeBand = 0; $firstApply = $true
    try {
        & $Emit 'FreeDSP M2L Remaining Band Validation; SDK0/wire5 VERIFIED in M2K, not retested.'
        & $Emit "StartSdkBand=$firstBand; testing SDK$firstBand/wire$($firstBand+5) through SDK4/wire9, one at a time."
        & $Emit 'Prior evidence: SDK1/wire6 VERIFIED; SDK2/wire7 protocol passed, audible Restore unconfirmed. Skipped bands are not retested.'
        & $Emit 'Safety: APO OFF; Windows output=FreeDSP; initial volume1-2/100; FIRST APPLY with IEM OUT OF EARS.'
        & $Emit 'Familiar music, no tone; SAME song and SAME comparison volume; no Flash/90/220.'
        & $Emit 'Sudden loudness/noise/distortion/imbalance/disconnect: STOP immediately. Q at prompts; Ctrl+C during a command.'
        & $Emit 'Q never auto-restores; if already applied, the test band may remain active. Do not retry or test later bands.'
        foreach ($r in ($results | Where-Object { $_.SdkBand -ge $firstBand })) {
            & $Emit ("=== Test {0}/{1}: SDK{2} -> wire{3} ===" -f ($r.SdkBand-$firstBand+1), (5-$firstBand), $r.SdkBand, $r.Wire)
            $state = 'UNKNOWN (no operation in this run yet)'
            $applied = $false; $restored = $false
            while ($true) {
                & $Emit "Current band: SDK$($r.SdkBand) -> wire$($r.Wire); STATE: $state"
                $answer = Read-FreeDspChoice $ReadAnswer $Emit 'A=APPLY; R=RESTORE; ENTER=CONFIRM VERIFIED; N=NO CLEAR DIFFERENCE; Q=ABORT.' @('A','R','','N','Q')
                if ($answer -eq 'Q') { $stopReason = "Aborted at wire$($r.Wire)"; break }
                if ($answer -eq 'N') {
                    $r.AudibleApply = 'NO'; $r.AudibleRestore = 'UNCONFIRMED'
                    $stopReason = "wire$($r.Wire) audible validation failed / no clear difference"; break
                }
                if ($answer -eq '') {
                    if (-not $applied -or -not $restored) {
                        & $Emit 'Confirm blocked: successful APPLY and RESTORE are required at least once in this band.'
                        continue
                    }
                    $r.AudibleApply = 'YES'; $r.AudibleRestore = 'YES'
                    if ($activeBand -gt 0) { $stopReason = "Confirmed wire$($r.Wire), but still APPLIED; stopping before later bands to avoid accumulating filters" }
                    break
                }
                $isRestore = $answer -eq 'R'
                $phase = $(if ($isRestore) { 'RESTORE' } else { 'APPLY' })
                if (-not $isRestore) { $activeBand = $r.Wire }
                $marker = "SDK$($r.SdkBand) / wire$($r.Wire) $phase"
                & $Emit "===== $marker BEGIN ====="
                try {
                    $code = & $RunProtocol $r.SdkBand $isRestore $Emit
                    if ($null -eq $code -or $code -isnot [int]) { throw 'Protocol runner returned no valid exit code' }
                } catch { $code = 7; & $Emit ('ERROR: ' + $_.Exception.Message) }
                finally { & $Emit "===== $marker END =====" }
                $pass = $(if ($code -eq 0) { 'PASS' } else { 'FAIL' })
                if ($isRestore) { $r.ProtocolRestore = $pass } else { $r.ProtocolApply = $pass }
                if ($code -ne 0) { $stopReason = "$phase protocol failure: $marker; do not listen, retry or continue"; break }
                if ($isRestore) { $restored = $true; $state = 'RESTORED'; $activeBand = 0 }
                else {
                    $applied = $true; $state = 'APPLIED'
                    if ($firstApply) {
                        & $Emit 'Protocol success: only if no abnormal output, wear IEM and listen at low volume; keep comparison volume fixed.'
                        $firstApply = $false
                    }
                }
                & $Emit "===== STATE: $state ====="
                & $Emit 'Listen now at SAME song/volume. Toggle A/R as needed; no automatic operation follows.'
            }
            if ($stopReason) { break }
        }
    } catch { $stopReason = 'Interrupted/error: ' + $_.Exception.Message }
    finally {
        foreach ($line in (Get-FreeDspSummary $results $LogPath $stopReason $activeBand $firstBand)) { & $Emit $line }
    }
    return [pscustomobject]@{ Results = $results; StopReason = $stopReason; ActiveBand = $activeBand }
}

function Invoke-FreeDspNativeCommand {
    param([string]$Dotnet, [string]$Dll,
        [ValidateSet('ApplyRemainingBand1','RestoreRemainingBand1','ApplyRemainingBand2','RestoreRemainingBand2',
            'ApplyRemainingBand3','RestoreRemainingBand3','ApplyRemainingBand4','RestoreRemainingBand4')][string]$Operation,
        [scriptblock]$Emit)
    $start = [System.Diagnostics.ProcessStartInfo]::new()
    $start.FileName = $Dotnet; $start.Arguments = '"' + $Dll + '" ' + $Operation
    $start.UseShellExecute = $false; $start.CreateNoWindow = $true
    $start.RedirectStandardOutput = $true; $start.RedirectStandardError = $true
    $child = [System.Diagnostics.Process]::new(); $child.StartInfo = $start
    $started = $false
    try {
        $started = $child.Start()
        if (-not $started) { throw 'Native helper failed to start' }
        $clock = [System.Diagnostics.Stopwatch]::StartNew()
        $stdout = $child.StandardOutput.ReadLineAsync(); $stderr = $child.StandardError.ReadLineAsync()
        $timeout = $false
        while ($true) {
            if ($null -ne $stdout -and $stdout.IsCompleted) {
                $line = $stdout.GetAwaiter().GetResult()
                if ($null -eq $line) { $stdout = $null }
                else { & $Emit $line; $stdout = $child.StandardOutput.ReadLineAsync() }
            }
            if ($null -ne $stderr -and $stderr.IsCompleted) {
                $line = $stderr.GetAwaiter().GetResult()
                if ($null -eq $line) { $stderr = $null }
                else { & $Emit ('STDERR: ' + $line); $stderr = $child.StandardError.ReadLineAsync() }
            }
            if (-not $timeout -and $clock.ElapsedMilliseconds -ge 30000 -and -not $child.HasExited) {
                $timeout = $true
                try { $child.Kill() } catch { if (-not $child.HasExited) { throw } }
                $null = $child.WaitForExit(2000)
            }
            if ($child.HasExited -and $null -eq $stdout -and $null -eq $stderr) { break }
            if ($timeout -and $clock.ElapsedMilliseconds -ge 32000) { break }
            Start-Sleep -Milliseconds 5
        }
        if ($timeout) { & $Emit 'RESULT: NATIVE CALL TIMEOUT / COMPLETION UNKNOWN; no retry'; return 6 }
        return [int]$child.ExitCode
    } finally {
        if ($started -and -not $child.HasExited) { $child.Kill() }
        $child.Dispose()
    }
}

Export-ModuleMember -Function Invoke-FreeDspBandValidation, Get-FreeDspSummary, Invoke-FreeDspNativeCommand
