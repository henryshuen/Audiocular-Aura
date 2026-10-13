using System.Diagnostics;
using System.Text.Json;
using FreeDspNative;
using Microsoft.AspNetCore.Builder;

namespace AuraPEQ.Portable;

public static class Launcher
{
    public const string Version="v0.1.2";
    private record Owner(int Pid,long StartUtcTicks,string Path,string Instance,string Version);
    private static string OwnerFile=>Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"AuraPEQ FreeDSP Edition","owner.json");
    public static async Task<int> RunAsync(bool openBrowser,bool smoke)
    {
        if(!OperatingSystem.IsWindowsVersionAtLeast(10,0,22000)||!Environment.Is64BitProcess||System.Runtime.InteropServices.RuntimeInformation.OSArchitecture!=System.Runtime.InteropServices.Architecture.X64){Console.Error.WriteLine("Windows 11 x64 is required.");return 2;}
        if(!Console.IsOutputRedirected)Console.Title="AuraPEQ FreeDSP Edition";
        using var lease=new InstanceLease();
        if(!lease.Acquired){try{await OpenExisting(openBrowser);return 0;}catch(Exception e){return Fail(e);}}
        using var stop=new CancellationTokenSource();
        if(smoke)stop.CancelAfter(TimeSpan.FromSeconds(45));
        Console.CancelKeyPress+=(_,e)=>{e.Cancel=true;stop.Cancel();};
        WebApplication? site=null;Task? bridge=null;
        string instance=Guid.NewGuid().ToString("N");
        try {
            JobProtection.Install();
            string root=Path.Combine(AppContext.BaseDirectory,"www");
            VerifyAssets(root);
            var bridgeReady=new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
            bridge=DebugBridge.RunAsync(PortableChild.RunAsync,stop.Token,started:_=>bridgeReady.TrySetResult(),diagnostics:false);
            site=StaticSite.Create(root,instance);
            await site.StartAsync(stop.Token);
            await Task.WhenAny(bridge,bridgeReady.Task).WaitAsync(TimeSpan.FromSeconds(15));
            if(bridge.IsCompleted)await bridge; // Propagate bind failures; never reuse an unknown port owner.
            await bridgeReady.Task.WaitAsync(TimeSpan.FromSeconds(15));
            await Ready(instance);
            using(var process=Process.GetCurrentProcess()){
                Directory.CreateDirectory(Path.GetDirectoryName(OwnerFile)!);
                await File.WriteAllTextAsync(OwnerFile,JsonSerializer.Serialize(new Owner(process.Id,process.StartTime.ToUniversalTime().Ticks,Environment.ProcessPath!,instance,Version)));
            }
            Console.WriteLine($"READY {Version} {StaticSite.Url}");
            Console.WriteLine("Keep this launcher window open. Press Enter or close it to stop. FreeDSP operations require explicit browser actions.");
            if(openBrowser){try{OpenBrowser();}catch(Exception error){Console.Error.WriteLine(error.Message+" Keep this launcher open; the local services are ready.");}}
            _=Task.Run(()=>{if(Console.ReadLine() is not null)stop.Cancel();});
            await Task.WhenAny(bridge,Task.Delay(Timeout.Infinite,stop.Token));
            if(bridge.IsCompleted&&!stop.IsCancellationRequested)await bridge;
            return 0;
        } catch(Exception error) {
            // Stop partial startup before waiting for the user to dismiss an error.
            stop.Cancel();if(site is not null){try{await site.StopAsync();}catch{}}
            if(bridge is not null){try{await bridge.WaitAsync(TimeSpan.FromSeconds(5));}catch{}}
            return Fail(error);
        }
        finally {
            stop.Cancel();
            if(site is not null){try{await site.StopAsync();}catch{}await site.DisposeAsync();}
            if(bridge is not null){try{await bridge.WaitAsync(TimeSpan.FromSeconds(5));}catch{}}
            try {if(File.Exists(OwnerFile)&&JsonSerializer.Deserialize<Owner>(await File.ReadAllTextAsync(OwnerFile))?.Instance==instance)File.Delete(OwnerFile);}catch{}
            Console.WriteLine("STOPPED — local services closed.");
        }
    }
    public static void VerifyAssets(string root)
    {
        using var manifest=JsonDocument.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory,"package-manifest.json")));
        if(manifest.RootElement.GetProperty("version").GetString()!=Version)throw new InvalidOperationException("Package version mismatch. Extract the complete ZIP again.");
        foreach(var f in manifest.RootElement.GetProperty("assets").EnumerateObject()){
            string? path=StaticSite.Resolve(root,"/"+f.Name);
            if(path is null||Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(File.ReadAllBytes(path)))!=f.Value.GetString())throw new InvalidOperationException($"Missing or changed asset: {f.Name}. Extract the complete ZIP again.");
        }
        string html=File.ReadAllText(Path.Combine(root,"index.html"));
        if(!html.Contains("__AURAPEQ_PORTABLE__")||html.Contains("@vite/client")||!File.Exists(Path.Combine(root,"assets","index.js")))throw new InvalidOperationException("Production website is missing. Extract the complete ZIP again.");
    }
    private static async Task Ready(string instance)
    {
        using var http=new HttpClient(new HttpClientHandler {UseProxy=false}){Timeout=TimeSpan.FromSeconds(5)};
        using var health=JsonDocument.Parse(await http.GetStringAsync(StaticSite.Url+"__edition/health"));
        if(health.RootElement.GetProperty("instance").GetString()!=instance)throw new InvalidOperationException("Local website identity mismatch; startup stopped.");
        using var request=new HttpRequestMessage(HttpMethod.Get,"http://127.0.0.1:5174/session");request.Headers.Add("Origin",DebugBridge.Origin);
        using var response=await http.SendAsync(request);response.EnsureSuccessStatusCode();
        using var session=JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        if(session.RootElement.GetProperty("mode").GetString()!="M2S CAF TRANSPORT")throw new InvalidOperationException("Helper readiness mismatch.");
    }
    private static async Task OpenExisting(bool browser)
    {
        // A second click only opens a validated owned instance. Never connect to
        // an arbitrary website/helper that happens to occupy our ports.
        for(int attempt=0;attempt<30;attempt++){
            try {
                var owner=JsonSerializer.Deserialize<Owner>(await File.ReadAllTextAsync(OwnerFile))!;
                using var p=Process.GetProcessById(owner.Pid);
                if(owner.Version!=Version||p.HasExited||p.StartTime.ToUniversalTime().Ticks!=owner.StartUtcTicks||!string.Equals(p.MainModule?.FileName,owner.Path,StringComparison.OrdinalIgnoreCase))throw new InvalidOperationException("Owned launcher identity mismatch.");
                await Ready(owner.Instance);Console.WriteLine("AuraPEQ is already running; reusing its owned services.");if(browser)OpenBrowser();return;
            }catch when(attempt<29){await Task.Delay(500);}
        }
        throw new InvalidOperationException("Another instance is starting or unavailable. Close its launcher, then start again. No process was terminated.");
    }
    private static void OpenBrowser()=>BrowserLauncher.Open();
    private static int Fail(Exception error)
    {
        Console.Error.WriteLine("AuraPEQ could not start: "+error.Message);
        Console.Error.WriteLine("Close any older AuraPEQ/dev launcher using ports5173/5174, or extract the full ZIP again. No automatic device command or retry was issued.");
        if(!Console.IsInputRedirected){Console.Error.WriteLine("Press Enter to close.");Console.ReadLine();}
        return 1;
    }
}

internal sealed class InstanceLease:IDisposable
{
    private readonly ManualResetEventSlim release=new(false);
    private readonly Thread thread;
    public bool Acquired {get;}
    public InstanceLease()
    {
        var ready=new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        thread=new Thread(()=>{
            using var mutex=new Mutex(false,@"Local\AuraPEQ.FreeDSP.Edition.5173");bool owned;
            try{owned=mutex.WaitOne(0);}catch(AbandonedMutexException){owned=true;}
            ready.SetResult(owned);if(!owned)return;
            try{release.Wait();}finally{mutex.ReleaseMutex();}
        }){IsBackground=true};thread.Start();Acquired=ready.Task.GetAwaiter().GetResult();
    }
    public void Dispose(){release.Set();thread.Join();release.Dispose();}
}
