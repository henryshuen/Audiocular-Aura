using System.Diagnostics;
using System.Text;
using System.Text.Json;

namespace AuraPEQ.Portable;

public static class PortableChild
{
    public static bool Allowed(string operation) => operation is "debugInspect" or "pollNineEq" or "transportExchange";
    public static async Task<object> RunAsync(string operation, string json)
    {
        if (!Allowed(operation)) throw new InvalidOperationException("Production operation required; no diagnostics or arbitrary CLI commands.");
        var start = new ProcessStartInfo(Environment.ProcessPath!) {
            UseShellExecute=false, CreateNoWindow=true, RedirectStandardInput=true,
            RedirectStandardOutput=true, RedirectStandardError=true
        };
        start.ArgumentList.Add("--native"); start.ArgumentList.Add(operation);
        using var child = Process.Start(start) ?? throw new InvalidOperationException("Bundled helper could not start.");
        var stdout = child.StandardOutput.ReadToEndAsync(); var stderr = child.StandardError.ReadToEndAsync();
        bool timeout=false;
        try {
            await child.StandardInput.WriteAsync(json); child.StandardInput.Close();
            using var deadline=new CancellationTokenSource(TimeSpan.FromSeconds(30));
            try { await child.WaitForExitAsync(deadline.Token); }
            catch(OperationCanceledException) { timeout=true; child.Kill(entireProcessTree:true); await child.WaitForExitAsync(); }
        } finally { if (!child.HasExited) { child.Kill(entireProcessTree:true); await child.WaitForExitAsync(); } }
        string log=await stdout+"\nSTDERR:\n"+await stderr;
        if(timeout)log+="\nTIMEOUT / COMPLETION UNKNOWN; no retry/automatic restore. Some RAM may remain active.";
        string directory=Path.Combine(Path.GetTempPath(),"AuraPEQ");Directory.CreateDirectory(directory);
        string logPath=Path.Combine(directory,"freedsp-portable-"+Guid.NewGuid().ToString("N")+".log");
        await File.WriteAllTextAsync(logPath,log,new UTF8Encoding(false));
        string? reply=log.Split('\n').FirstOrDefault(line=>line.StartsWith("CAF_NATIVE_REPLY=",StringComparison.Ordinal))?.Trim()["CAF_NATIVE_REPLY=".Length..];
        JsonElement? readback=null;
        if(operation=="pollNineEq") {
            string? row=log.Split('\n').SingleOrDefault(line=>line.StartsWith("NINE_POLL_JSON=",StringComparison.Ordinal));
            if(row is not null){using var doc=JsonDocument.Parse(row["NINE_POLL_JSON=".Length..]);readback=doc.RootElement.Clone();}
        }
        return new {ok=!timeout&&child.ExitCode==0,exitCode=timeout?6:child.ExitCode,log,logPath,reply,readback};
    }
}
