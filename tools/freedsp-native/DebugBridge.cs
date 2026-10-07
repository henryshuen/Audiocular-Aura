using System.Diagnostics;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Hosting;
namespace FreeDspNative;

// DEV localhost only. Native HID calls run in a separate bounded child, never in the HTTP service.
public static class DebugBridge
{
    public const string Origin = "http://localhost:5173";
    public static bool AllowedOrigin(string? origin, string? host, int port = 5174) => origin == Origin && host == $"127.0.0.1:{port}";
    public static async Task<int> RunAsync(Func<string,string,Task<object>>? runner = null, CancellationToken cancellation = default, int port = 5174, Action<string>? started = null, bool diagnostics = true)
    {
        runner ??= Child;
        var builder = WebApplication.CreateSlimBuilder(Array.Empty<string>());
        builder.Logging.ClearProviders();
        builder.WebHost.ConfigureKestrel(o => { o.Listen(IPAddress.Loopback,port); o.Limits.MaxRequestBodySize = 16384; });
        var app = builder.Build();
        string token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        using var gate = new SemaphoreSlim(1,1);
        app.Run(async context => {
            var request = context.Request; var response = context.Response;
            response.Headers.CacheControl = "no-store";
            if (!AllowedOrigin(request.Headers.Origin.ToString(),request.Host.ToString(),context.Connection.LocalPort)) { response.StatusCode=403; return; }
            response.Headers.AccessControlAllowOrigin = Origin;
            response.Headers.AccessControlAllowMethods = "GET,POST,OPTIONS";
            response.Headers.AccessControlAllowHeaders = "Content-Type,X-AuraPEQ-Session";
            if (request.Method == "OPTIONS") { response.StatusCode=204; return; }
            if (request.Method == "GET" && request.Path == "/session") { await response.WriteAsJsonAsync(new {token,mode=diagnostics?"M2N RAM ONLY":"M2S CAF TRANSPORT"}); return; }
            if (request.Method != "POST" || request.Headers["X-AuraPEQ-Session"].ToString() != token) { response.StatusCode=403; return; }
            if (request.Path != "/connect" && request.Path != "/transport" && !(diagnostics && request.Path == "/ram")) { response.StatusCode=404; return; }
            if (!await gate.WaitAsync(0)) { response.StatusCode=409; await response.WriteAsJsonAsync(new {ok=false,log="BUSY; no queued write"}); return; }
            try {
                string json = "";
                if (request.Path == "/ram" || request.Path == "/transport") {
                    if (request.ContentType?.StartsWith("application/json",StringComparison.OrdinalIgnoreCase) != true) throw new InvalidOperationException("JSON required");
                    using var reader = new StreamReader(request.Body,Encoding.UTF8);
                    json = await reader.ReadToEndAsync();
                    if (Encoding.UTF8.GetByteCount(json)>16384) throw new InvalidOperationException("Oversized request");
                    if(request.Path=="/transport")_ = TransportRequest.Parse(json);else _ = RamDebugRequest.Parse(json); // validate before spawning/discovery
                }
                var result = await runner(request.Path == "/connect" ? "debugInspect" : request.Path=="/transport"?"transportExchange":"debugRam",json);
                await response.WriteAsJsonAsync(result);
            } catch(Exception error) { response.StatusCode=400; await response.WriteAsJsonAsync(new {ok=false,log=error.Message}); }
            finally { gate.Release(); }
        });
        Console.WriteLine(diagnostics?"Diagnostic bridge: metadata/RAM debug; explicit clicks only.":"FreeDSP minimal CAF transport helper127.0.0.1:5174; metadata/exchange only; no PEQ business logic.");
        try { await app.StartAsync(cancellation); started?.Invoke(app.Urls.Single()); await app.WaitForShutdownAsync(cancellation); return 0; }
        finally { await app.DisposeAsync(); }
    }
    public static async Task<object> Child(string operation, string json)
    {
        if (operation is not ("debugInspect" or "debugRam" or "transportExchange")) throw new InvalidOperationException("Fixed child operation only");
        var start = new ProcessStartInfo(Path.GetFileNameWithoutExtension(Environment.ProcessPath) == "dotnet" ? Environment.ProcessPath! : "dotnet") {
            UseShellExecute=false,CreateNoWindow=true,RedirectStandardInput=true,RedirectStandardOutput=true,RedirectStandardError=true
        };
        start.ArgumentList.Add(typeof(DebugBridge).Assembly.Location); start.ArgumentList.Add(operation);
        using var child = Process.Start(start) ?? throw new InvalidOperationException("Failed to launch bounded child");
        var stdout = child.StandardOutput.ReadToEndAsync(); var stderr = child.StandardError.ReadToEndAsync();
        bool timeout = false;
        try {
            await child.StandardInput.WriteAsync(json); child.StandardInput.Close();
            using var deadline = new CancellationTokenSource(TimeSpan.FromSeconds(30));
            try { await child.WaitForExitAsync(deadline.Token); }
            catch(OperationCanceledException) { timeout=true; child.Kill(entireProcessTree:true); await child.WaitForExitAsync(); }
        } finally { if (!child.HasExited) { child.Kill(entireProcessTree:true); await child.WaitForExitAsync(); } }
        string log = await stdout + "\nSTDERR:\n" + await stderr;
        if(timeout) log += "\nTIMEOUT / COMPLETION UNKNOWN; no retry/automatic restore. Some RAM may remain active.";
        string directory = Path.GetFullPath(Path.Combine(Path.GetTempPath(),"AuraPEQ"));
        string cwd = Path.GetFullPath(Directory.GetCurrentDirectory()).TrimEnd(Path.DirectorySeparatorChar);
        if (directory == cwd || directory.StartsWith(cwd+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("TEMP must be outside repository; log retained in response only");
        Directory.CreateDirectory(directory);
        string logPath = Path.Combine(directory,"freedsp-web-"+DateTime.UtcNow.ToString("yyyyMMdd-HHmmss")+"-"+Guid.NewGuid().ToString("N")+".log");
        using(var file = new FileStream(logPath,FileMode.CreateNew,FileAccess.Write,FileShare.Read))
        using(var writer = new StreamWriter(file,new UTF8Encoding(false))) await writer.WriteAsync(log);
        string? reply=log.Split('\n').FirstOrDefault(line=>line.StartsWith("CAF_NATIVE_REPLY=",StringComparison.Ordinal))?.Trim()["CAF_NATIVE_REPLY=".Length..];
        return new {ok=!timeout && child.ExitCode==0,exitCode=timeout?6:child.ExitCode,log,logPath,reply};
    }
}
