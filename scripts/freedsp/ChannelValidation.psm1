function Get-FreeDspChannelHelp {
    @(
        '這個測試要確認 path0 / path1 / both 對聲音的影響；不預先命名左右聲道。'
        '固定 wire5：400 Hz / -12 dB / Q1，僅 RAM；Restore 是 unity，不是原 EQ 備份。'
        'APO 必須關閉；Windows 音量 1–2/100；輸出裝置選 FreeDSP。'
        '第一次 Apply 前先把耳機拿離耳朵，協定成功且無異常後才低音量聽。'
        'A = Apply 測試 EQ；R = Restore unity；A/R 可以反覆切換。'
        'Enter = 結束目前模式；Q = 退出目前模式（回主選單）。'
        'U = 緊急把 path0 + path1 的 wire5 都 Restore unity。'
        '0 = 測 path0；1 = 測 path1；B = 測 both；O = 自願紀錄聽感。'
        '如果腳本已經退出並回到 PS D:\...>，此時輸入 A/R/Y 等字母會被 PowerShell 當成指令，不會控制測試。'
    )
}
function Invoke-FreeDspChannelValidation {
    param([scriptblock]$RunProtocol,[scriptblock]$ReadAnswer,[scriptblock]$Emit)
    $states=@{Path0='UNKNOWN';Path1='UNKNOWN'}
    $results=[Collections.Generic.List[object]]::new();$stopReason=''
    $mode='';$pending=''
    $showState={
        & $Emit "目前 wire5 狀態（僅本次命令紀錄，非讀回）：path0=$($states.Path0)；path1=$($states.Path1)"
        if($states.Path0 -ne 'UNITY' -or $states.Path1 -ne 'UNITY') { & $Emit '注意：有路徑仍套用或狀態未知。返回選單不會還原；可明確按 R 或 U。' }
    }.GetNewClosure()
    try {
        foreach($line in (Get-FreeDspChannelHelp)){& $Emit $line}
        while($true){
            & $showState
            if(-not $mode){
                & $Emit '[主選單]'
                & $Emit 'U = 將 path0 + path1 的 wire5 都恢復 unity（建議每次測試前先按）'
                & $Emit '0 = 測試 path0；1 = 測試 path1；B = 測試 path0 + path1；Q = 離開'
                $answer=(& $ReadAnswer '請選 U / 0 / 1 / B / Q').Trim().ToUpperInvariant()
                & $Emit "主選單輸入=$answer"
                if($answer -eq 'Q'){break}
                if($answer -in @('0','1','B')){$mode=@{'0'='Path0';'1'='Path1';B='Both'}[$answer];continue}
                if($answer -ne 'U'){& $Emit '輸入無效，仍在主選單；未送命令。';continue}
            } else {
                & $Emit "[$mode 測試] A = Apply $mode 400Hz/-12dB/Q1；R = Restore $mode unity"
                & $Emit 'A/R 可反覆切換；O = 紀錄聽感；Enter / Q = 返回主選單；U = 雙 path 緊急 unity'
                if($pending){$answer=$pending;$pending=''}else{$answer=(& $ReadAnswer '請選 A / R / O / U，或 Enter / Q 返回').Trim().ToUpperInvariant()}
                & $Emit "$mode 輸入=$answer"
                if($answer -in @('','Q')){$mode='';continue}
                if($answer -eq 'O'){
                    $ear=(& $ReadAnswer '哪邊有變？L=左 / R=右 / B=兩邊 / N=沒有 / U=不確定；Enter取消；RESTORE立即恢復；CLEAN雙path unity').Trim().ToUpperInvariant()
                    & $Emit "聽感輸入 Ear=$ear"
                    if($ear -in @('RESTORE','CLEAN')){$pending=@{RESTORE='R';CLEAN='U'}[$ear];continue}
                    if($ear -notin @('L','R','B','N','U')){& $Emit '已取消紀錄；仍在測試模式，狀態未變，可按 R/U 恢復。';continue}
                    $image=(& $ReadAnswer '聲像？L=偏左 / R=偏右 / C=置中 / U=不確定；Enter取消；RESTORE立即恢復；CLEAN雙path unity').Trim().ToUpperInvariant()
                    & $Emit "聽感輸入 Image=$image"
                    if($image -in @('RESTORE','CLEAN')){$pending=@{RESTORE='R';CLEAN='U'}[$image];continue}
                    if($image -notin @('L','R','C','U')){& $Emit '已取消紀錄；仍在測試模式，狀態未變，可按 R/U 恢復。';continue}
                    $results.Add([pscustomobject]@{Path=$mode;Ear=$ear;Image=$image;Path0State=$states.Path0;Path1State=$states.Path1})
                    & $Emit "聽感已紀錄：$mode Ear=$ear Image=$image（不推定聲道映射已證實）";continue
                }
                if($answer -notin @('A','R','U')){& $Emit '輸入無效，仍在測試模式；未送命令，可按 R/U。';continue}
            }
            $target=if($answer -eq 'U'){'Both'}else{$mode}
            $verb=if($answer -eq 'A'){'APPLY'}else{'RESTORE'}
            $operation='M2P'+$(if($verb -eq 'APPLY'){'Apply'}else{'Restore'})+$target
            $paths=if($target -eq 'Both'){@('Path0','Path1')}else{@($target)}
            foreach($path in $paths){$states[$path]='UNKNOWN'}
            & $Emit "$target $verb 開始；只送一次，失敗停止，不自動重試／回復。"
            $actionEmit={param($line)
                & $Emit $line
                if($line -match '^PATH([01]) WIRE5 PASS$'){& $Emit "PATH$($Matches[1]) $verb PASS"}
                if($line -match '^PATH([01]) FAIL'){& $Emit "PATH$($Matches[1]) $verb FAIL"}
            }.GetNewClosure()
            $code=& $RunProtocol $operation $actionEmit
            if($code -ne 0){throw "$target $verb FAIL：協定失敗／可能部分完成；停止，不重試。完整 per-path 結果見 log。"}
            foreach($path in $paths){$states[$path]=$(if($verb -eq 'APPLY'){'APPLIED'}else{'UNITY'})}
            & $Emit "$target $verb 協定 PASS；聽感需自行確認。"
            if($answer -eq 'U'){& $Emit 'Baseline clean: path0 + path1 wire5 unity restored';& $Emit '兩個 path 的 wire5 unity 協定完成；不代表全裝置還原或聲道映射已證實。'}
            if($verb -eq 'APPLY'){& $Emit '協定成功且無異常才戴回耳機低音量聽；可反覆 A/R，不必回答觀察問題。'}
        }
    } catch {$stopReason=$_.Exception.Message}
    finally {
        & $Emit '[M2P 結束摘要]';& $showState
        foreach($r in $results){& $Emit "$($r.Path) Ear=$($r.Ear) Image=$($r.Image)（紀錄當時 path0=$($r.Path0State)，path1=$($r.Path1State)）"}
        if($stopReason){& $Emit "STOP：$stopReason"}
        & $Emit '退出／返回選單沒有自動 Restore；摘要彙整聽感，不自動判定新測試是否通過。'
    }
    return [pscustomobject]@{Results=$results.ToArray();StopReason=$stopReason;States=$states;MayRemainActive=($states.Path0 -ne 'UNITY' -or $states.Path1 -ne 'UNITY')}
}
Export-ModuleMember -Function Get-FreeDspChannelHelp,Invoke-FreeDspChannelValidation
