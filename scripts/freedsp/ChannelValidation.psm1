function Invoke-FreeDspChannelValidation {
    param([scriptblock]$RunProtocol,[scriptblock]$ReadAnswer,[scriptblock]$Emit)
    $results = [System.Collections.Generic.List[object]]::new()
    $active = $false; $stopReason = ''
    try {
        foreach ($phase in @('A','B','C')) {
            if ($phase -eq 'C' -and -not ($results.Count -eq 2 -and $results[0].Ear -eq 'L' -and $results[1].Ear -eq 'R' -and $results[0].Recovered -eq 'Y' -and $results[1].Recovered -eq 'Y')) {
                throw 'C BLOCKED: A must confirm LEFT only, B RIGHT only, and both unity restorations YES. No dual-path write.'
            }
            $pathLabel = @{A='Path0';B='Path1';C='Both'}[$phase]
            & $Emit "===== M2P $phase $pathLabel / wire5 ONLY ====="
            & $Emit 'RAM only PK400Hz/-12dB/Q1; same song/volume. IEM out before first Apply; Windows1-2/100, APO OFF, output FreeDSP. No tones/Flash/preamp.'
            $answer = (& $ReadAnswer "$phase : type A to Apply explicitly, Q to STOP (no automatic write)").Trim().ToUpperInvariant()
            & $Emit "ANSWER $phase Apply=$answer"
            if ($answer -ne 'A') { throw 'Apply not authorized / Q: STOP' }
            $active = $true # Failed/partial SET may still affect RAM.
            $code = & $RunProtocol ('M2PApply'+$pathLabel) $Emit
            if ($code -ne 0) { throw "$phase Apply protocol failure; STOP, no retry/restore" }
            & $Emit 'Apply protocol PASS. If no abnormality, listen quietly now; unexpected noise/distortion => Q and STOP.'
            $ear = (& $ReadAnswer "$phase changed ear: L=LEFT only, R=RIGHT only, B=both, N=neither, U=uncertain, Q=STOP").Trim().ToUpperInvariant()
            & $Emit "ANSWER $phase Ear=$ear"
            if ($ear -notin @('L','R','B','N','U')) { throw 'Observation Q/invalid: STOP; no automatic restore' }
            $image = (& $ReadAnswer "$phase image: L=leftward, R=rightward, C=center unchanged, U=uncertain, Q=STOP").Trim().ToUpperInvariant()
            & $Emit "ANSWER $phase Image=$image"
            if ($image -notin @('L','R','C','U')) { throw 'Image Q/invalid: STOP; no automatic restore' }
            $equal = 'NOT ASKED'
            if ($phase -eq 'C') {
                $equal = (& $ReadAnswer 'C: both ears change equally AND center remains normal? Y/N/U/Q').Trim().ToUpperInvariant()
                & $Emit "ANSWER C EqualCentered=$equal"
                if ($equal -notin @('Y','N','U')) { throw 'C Q/invalid: STOP; no automatic restore' }
            }
            $answer = (& $ReadAnswer "$phase : type R for explicit same-path unity Restore, Q to STOP").Trim().ToUpperInvariant()
            & $Emit "ANSWER $phase Restore=$answer"
            if ($answer -ne 'R') { throw 'Restore not authorized / Q: STOP; RAM may remain applied' }
            $code = & $RunProtocol ('M2PRestore'+$pathLabel) $Emit
            if ($code -ne 0) { throw "$phase Restore protocol failure; STOP, no retry" }
            $active = $false
            $recovered = (& $ReadAnswer "$phase : listen after Restore; normal sound/stereo restored? Y/N/U/Q").Trim().ToUpperInvariant()
            & $Emit "ANSWER $phase Recovered=$recovered"
            $results.Add([pscustomobject]@{Phase=$phase;Path=$pathLabel;ProtocolApply='PASS';Ear=$ear;Image=$image;EqualCentered=$equal;ProtocolRestore='PASS';Recovered=$recovered})
            if ($recovered -ne 'Y') { throw "$phase audible Restore unconfirmed: STOP" }
        }
    } catch { $stopReason = $_.Exception.Message }
    finally {
        & $Emit '===== M2P CHANNEL SUMMARY ====='
        foreach ($r in $results) { & $Emit "$($r.Phase) $($r.Path): Apply=$($r.ProtocolApply) Ear=$($r.Ear) Image=$($r.Image) EqualCentered=$($r.EqualCentered) Restore=$($r.ProtocolRestore) Recovered=$($r.Recovered)" }
        $verified = $results.Count -eq 3 -and $results[2].Ear -eq 'B' -and $results[2].Image -eq 'C' -and $results[2].EqualCentered -eq 'Y' -and $results[2].Recovered -eq 'Y'
        & $Emit "Stereo gate: $(if($verified){'PASS for this one-band experiment only'}else{'UNRESOLVED / NOT PASSED'})"
        if ($stopReason) { & $Emit "STOP: $stopReason" }
        if ($active) { & $Emit 'WARNING: applied/partial RAM may remain; no automatic restore/retry. Do not continue.' }
    }
    return [pscustomobject]@{Results=$results.ToArray();StopReason=$stopReason;MayRemainActive=$active}
}
Export-ModuleMember -Function Invoke-FreeDspChannelValidation
