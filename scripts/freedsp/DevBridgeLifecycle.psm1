function Test-AuraBridgeIdentity {
    param($Process, [string]$BridgeDll, [string]$DotnetPath)
    if ($null -eq $Process -or $Process.Name -ine 'dotnet.exe' -or
        $Process.ExecutablePath -ine $DotnetPath -or -not $Process.CreationDate) { return $false }
    $dll = [regex]::Escape($BridgeDll)
    # Require the entire invocation, not a substring or another repo's same-named DLL.
    return $Process.CommandLine -imatch ('^\s*(?:"[^"]+"|\S+)\s+(?:"' + $dll + '"|' + $dll + ')\s+serveDebug\s*$')
}

function Stop-AuraOwnedBridge {
    param($OwnedProcess, [string]$BridgeDll, [string]$DotnetPath,
        [scriptblock]$Query = { Get-CimInstance Win32_Process -Filter "Name = 'dotnet.exe'" },
        [scriptblock]$Terminate = {
            param($ownedId)
            # The validated bridge owns its bounded native children; never kill by process name.
            & taskkill.exe /PID $ownedId /T /F | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "taskkill failed (exit $LASTEXITCODE)" }
        },
        [scriptblock]$Wait = {
            param($ownedId)
            $process = Get-Process -Id $ownedId -ErrorAction SilentlyContinue
            if ($null -eq $process) { return $true }
            try { return $process.WaitForExit(5000) } finally { $process.Dispose() }
        })
    if (-not (Test-AuraBridgeIdentity $OwnedProcess $BridgeDll $DotnetPath)) { return }
    $ownedId = [int]$OwnedProcess.ProcessId
    $current = @(& $Query | Where-Object { $_.ProcessId -eq $ownedId })
    if ($current.Count -eq 0) { return }
    if ($current.Count -ne 1 -or $current[0].CreationDate -ne $OwnedProcess.CreationDate -or
        -not (Test-AuraBridgeIdentity $current[0] $BridgeDll $DotnetPath)) {
        throw "Owned bridge PID $ownedId changed identity; not stopped. Inspect that PID, close the old AuraPEQ dev window, then rerun .\scripts\dev.ps1."
    }
    try {
        & $Terminate $ownedId
        if (-not (& $Wait $ownedId)) { throw 'exit timed out after 5 seconds' }
        Start-Sleep -Milliseconds 200
    } catch {
        throw "Cannot stop AuraPEQ bridge PID $ownedId ($($_.Exception.Message)). Close its old dev window or stop that verified PID, then rerun .\scripts\dev.ps1; build was not retried."
    }
}

function Clear-AuraStaleBridge {
    param([string]$BridgeDll, [string]$DotnetPath,
        [scriptblock]$Query = { Get-CimInstance Win32_Process -Filter "Name = 'dotnet.exe'" },
        [scriptblock]$Terminate = {
            param($ownedId)
            & taskkill.exe /PID $ownedId /T /F | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "taskkill failed (exit $LASTEXITCODE)" }
        },
        [scriptblock]$Wait = {
            param($ownedId)
            $process = Get-Process -Id $ownedId -ErrorAction SilentlyContinue
            if ($null -eq $process) { return $true }
            try { return $process.WaitForExit(5000) } finally { $process.Dispose() }
        })
    foreach ($candidate in @(& $Query)) {
        if (Test-AuraBridgeIdentity $candidate $BridgeDll $DotnetPath) {
            Write-Host "Stopping previous AuraPEQ FreeDSP bridge PID $($candidate.ProcessId)."
            Stop-AuraOwnedBridge $candidate $BridgeDll $DotnetPath $Query $Terminate $Wait
        }
    }
}
Export-ModuleMember -Function Test-AuraBridgeIdentity, Stop-AuraOwnedBridge, Clear-AuraStaleBridge
