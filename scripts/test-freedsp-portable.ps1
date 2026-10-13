param([string]$Zip = '../AuraPEQ-FreeDSP-releases/AuraPEQ-FreeDSP-v0.1.2-win-x64.zip')
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$zipPath = (Resolve-Path -LiteralPath $Zip).Path
$artifactRoot = Split-Path -Parent $zipPath
$extract = Join-Path $artifactRoot ('clean extraction ' + [Guid]::NewGuid().ToString('N'))
Expand-Archive -LiteralPath $zipPath -DestinationPath $extract
$root = (Get-ChildItem -LiteralPath $extract -Directory | Select-Object -First 1).FullName
$exe = Join-Path $root 'Start AuraPEQ FreeDSP Edition.exe'
$checks = [Collections.Generic.List[string]]::new()
$client = [Net.Http.HttpClient]::new([Net.Http.HttpClientHandler]@{UseProxy=$false})
$client.Timeout = [TimeSpan]::FromSeconds(3)
$owned = [Collections.Generic.List[Diagnostics.Process]]::new()
function Check($condition, $message) { if (-not $condition) { throw $message }; $checks.Add($message); Write-Host "[PASS] $message" }
function Start-Candidate([string[]]$arguments) {
    $info = [Diagnostics.ProcessStartInfo]::new($exe)
    $info.UseShellExecute = $false; $info.CreateNoWindow = $true
    $info.RedirectStandardInput = $true; $info.RedirectStandardOutput = $true; $info.RedirectStandardError = $true
    $info.WorkingDirectory = $extract # Not the project, and not the executable folder.
    $info.Environment['PATH'] = ''
    $info.Environment['DOTNET_ROOT'] = Join-Path $extract 'no-dotnet-installed'
    $info.Environment['DOTNET_ROOT_X64'] = $info.Environment['DOTNET_ROOT']
    $info.Environment['DOTNET_MULTILEVEL_LOOKUP'] = '0'
    $info.Environment['DOTNET_BUNDLE_EXTRACT_BASE_DIR'] = Join-Path $extract 'bundled runtime'
    foreach ($a in $arguments) { $info.ArgumentList.Add($a) }
    $p = [Diagnostics.Process]::Start($info); $owned.Add($p); return $p
}
function Request([string]$url, [string]$origin = '', [string]$token = '', [string]$method = 'GET', [string]$body = '') {
    $r = [Net.Http.HttpRequestMessage]::new([Net.Http.HttpMethod]::new($method), $url)
    if ($origin) { $r.Headers.Add('Origin', $origin) }
    if ($token) { $r.Headers.Add('X-AuraPEQ-Session', $token) }
    if ($method -eq 'POST') { $r.Content = [Net.Http.StringContent]::new($body, [Text.Encoding]::UTF8, 'application/json') }
    try { return $client.SendAsync($r).GetAwaiter().GetResult() } finally { $r.Dispose() }
}
function Wait-Ready($p) {
    for ($i = 0; $i -lt 100; $i++) {
        if ($p.HasExited) { throw ('Launcher exited: ' + $p.StandardOutput.ReadToEnd() + $p.StandardError.ReadToEnd()) }
        try { $r = Request 'http://localhost:5173/__edition/health'; if ($r.IsSuccessStatusCode) { return ($r.Content.ReadAsStringAsync().Result | ConvertFrom-Json) } } catch {} finally { if ($r) { $r.Dispose() } }
        Start-Sleep -Milliseconds 100
    }
    throw 'Readiness timeout.'
}
function Is-Open([int]$port) { $tcp=[Net.Sockets.TcpClient]::new();try {$task=$tcp.ConnectAsync('127.0.0.1',$port);return $task.Wait(200) -and $tcp.Connected}catch{return $false}finally{$tcp.Dispose()} }
function Wait-Stopped { for($i=0;$i -lt 50;$i++){if(-not (Is-Open 5173) -and -not (Is-Open 5174)){return};Start-Sleep -Milliseconds 100};throw 'Owned services did not close.' }
try {
    Check (-not (Is-Open 5173) -and -not (Is-Open 5174)) 'Ports are free before smoke; never terminate an existing listener'
    $checksum = (Get-Content -LiteralPath ($zipPath + '.sha256') -Raw).Split(' ')[0].Trim()
    Check ((Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash -eq $checksum) 'ZIP checksum matches'
    foreach($f in @('README.md','LICENSE.txt','ACKNOWLEDGMENTS.md','SOURCE.zip','RUNTIME-NOTICES','package-manifest.json')) { Check (Test-Path -LiteralPath (Join-Path $root $f)) "Package contains $f" }
    Check (-not (Test-Path -LiteralPath (Join-Path $root 'node_modules'))) 'No node_modules or developer server in package'
    $p = Start-Candidate @('--smoke','--no-browser'); $health = Wait-Ready $p
    Check ($health.version -eq 'v0.1.2') 'Extracted self-contained launcher ready with empty PATH and absent DOTNET_ROOT'
    $p.Refresh()
    $installedModules=@($p.Modules | Where-Object { $_.FileName.StartsWith((Join-Path $env:ProgramFiles 'dotnet'), [StringComparison]::OrdinalIgnoreCase) })
    Check ($health.framework -eq '.NET 10.0.12' -and $installedModules.Count -eq 0) 'Pinned single-file runtime active; no modules from installed dotnet'
    $r = Request 'http://localhost:5173/';$html=$r.Content.ReadAsStringAsync().Result
    Check ($r.IsSuccessStatusCode -and $html.Contains('__AURAPEQ_PORTABLE__') -and -not $html.Contains('@vite/client')) 'Production HTML, no Vite HMR'
    Check ($r.Headers.GetValues('X-Frame-Options') -contains 'DENY') 'Cross-origin framing blocked'; $r.Dispose()
    $r = Request 'http://localhost:5173/assets/index.js';$bytes=$r.Content.ReadAsByteArrayAsync().Result
    Check ($r.IsSuccessStatusCode -and [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes)) -eq (Get-FileHash -LiteralPath (Join-Path $root 'www/assets/index.js')).Hash) 'Served JS is byte-identical to packaged production bundle';$r.Dispose()
    foreach($origin in @('https://evil.example','null','http://localhost:5175')) { $r=Request 'http://127.0.0.1:5174/session' $origin;Check ([int]$r.StatusCode -eq 403 -and -not $r.Headers.Contains('Access-Control-Allow-Origin')) "Foreign Origin denied: $origin";$r.Dispose() }
    $r=Request 'http://127.0.0.1:5174/session';Check ([int]$r.StatusCode -eq 403) 'Missing Origin denied';$r.Dispose()
    $r=Request 'http://127.0.0.1:5174/session' 'http://localhost:5173';$session=$r.Content.ReadAsStringAsync().Result | ConvertFrom-Json
    Check ($r.IsSuccessStatusCode -and $session.token -match '^[A-F0-9]{64}$') 'Trusted Origin session succeeds without HID query';$r.Dispose()
    $r=Request 'http://127.0.0.1:5174/readback' 'http://localhost:5173' '' 'POST';Check ([int]$r.StatusCode -eq 403) 'Readback without token blocked before child';$r.Dispose()
    $r=Request 'http://127.0.0.1:5174/transport' 'http://localhost:5173' $session.token 'POST' '{}';Check ([int]$r.StatusCode -eq 400) 'Malformed transport rejected before native child';$r.Dispose()
    $r=Request 'http://127.0.0.1:5174/ram' 'http://localhost:5173' $session.token 'POST' '{}';Check ([int]$r.StatusCode -eq 404) 'Debug RAM endpoint excluded';$r.Dispose()
    $r=Request 'http://127.0.0.1:5173/';Check ([int]$r.StatusCode -eq 403) 'Alternate static Host denied';$r.Dispose()
    $r=Request 'http://localhost:5173/' 'https://evil.example';Check ([int]$r.StatusCode -eq 403) 'Foreign static fetch Origin denied';$r.Dispose()
    $r=Request 'http://localhost:5173/package-manifest.json';Check ([int]$r.StatusCode -eq 404) 'Files outside webroot not served';$r.Dispose()
    $dup=Start-Candidate @('--no-browser');Check ($dup.WaitForExit(15000) -and $dup.ExitCode -eq 0) 'Second launcher reuses owned instance without duplicate services'
    $same=Request 'http://localhost:5173/__edition/health';Check (($same.Content.ReadAsStringAsync().Result | ConvertFrom-Json).instance -eq $health.instance) 'Existing service identity unchanged';$same.Dispose()
    $p.StandardInput.WriteLine('');Check ($p.WaitForExit(10000) -and $p.ExitCode -eq 0) 'Enter stops launcher cleanly';Wait-Stopped
    $native=Start-Candidate @('--native','transportExchange');$native.StandardInput.Write('{}');$native.StandardInput.Close();Check ($native.WaitForExit(10000) -and $native.ExitCode -eq 2) 'Bundled native CLI runs without system .NET and rejects invalid payload before discovery'
    Check ($native.StandardError.ReadToEnd().Contains('INVALID TRANSPORT before discovery') -and -not $native.StandardOutput.ReadToEnd().Contains('FreeDSP Native CAF diagnostic')) 'No hardware discovery from native negative test'
    $p=Start-Candidate @('--smoke','--no-browser');$null=Wait-Ready $p;$p.Kill($true);$p.WaitForExit();Wait-Stopped;Check $true 'Abrupt termination releases owned services'
    foreach($port in 5173,5174){
        $block=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,$port);$block.Start()
        try{$failed=Start-Candidate @('--smoke','--no-browser');Check ($failed.WaitForExit(15000) -and $failed.ExitCode -eq 1) "Port $port conflict fails clearly"
            Check (Is-Open $port) 'Unrelated listener remains untouched'
            $other=if($port -eq 5173){5174}else{5173};Check (-not (Is-Open $other)) 'Partial startup services cleaned'}finally{$block.Stop()}
    }
    $asset=Join-Path $root 'www/assets/index.js';$original=[IO.File]::ReadAllBytes($asset)
    try{[IO.File]::AppendAllText($asset,'/*tamper test*/');$bad=Start-Candidate @('--smoke','--no-browser');Check ($bad.WaitForExit(10000) -and $bad.ExitCode -eq 1) 'Changed production asset blocks startup';Wait-Stopped;Check $true 'Integrity failure leaves no services'}finally{[IO.File]::WriteAllBytes($asset,$original)}
    $admin=([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    $receipt=[ordered]@{zip=$zipPath;sha256=$checksum;extraction=$root;os=[Environment]::OSVersion.VersionString;elevated=$admin;framework=$health.framework;installedDotnetModules=$installedModules.Count;checks=$checks;test='OFFLINE / LOOPBACK ONLY; no browser GUI or physical hardware operation';cleanMachine=$false;defaultBrowserVisual=$false}
    $receipt | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $artifactRoot 'portable-smoke.json') -Encoding utf8
    Write-Host "PASS: $($checks.Count) checks; receipt: $(Join-Path $artifactRoot 'portable-smoke.json')"
} finally {
    foreach($p in $owned){if(-not $p.HasExited){$p.Kill($true);$p.WaitForExit()};$p.Dispose()};$client.Dispose()
    # Keep the extracted tested candidate for device owner's manual acceptance.
}
