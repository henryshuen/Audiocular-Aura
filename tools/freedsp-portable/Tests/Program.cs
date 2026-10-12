using AuraPEQ.Portable;
using System.Diagnostics;
using System.Reflection;

Process Self(string argument){
    var start=new ProcessStartInfo(Environment.ProcessPath!){UseShellExecute=false,CreateNoWindow=true,RedirectStandardOutput=true,RedirectStandardError=true};
    if(Path.GetFileNameWithoutExtension(Environment.ProcessPath)=="dotnet")start.ArgumentList.Add(Assembly.GetExecutingAssembly().Location);
    start.ArgumentList.Add(argument);return Process.Start(start)!;
}
if(args.SequenceEqual(new[]{"--wait-child"})){await Task.Delay(TimeSpan.FromSeconds(30));return 0;}
if(args.SequenceEqual(new[]{"--exit2"}))return 2;
if(args.SequenceEqual(new[]{"--job-parent"})){
    JobProtection.Install();using var child=Self("--wait-child");Console.WriteLine($"CHILD={child.Id}");
    string command=$"\"{Environment.ProcessPath}\" ";if(Path.GetFileNameWithoutExtension(Environment.ProcessPath)=="dotnet")command+=$"\"{Assembly.GetExecutingAssembly().Location}\" ";
    int detached=BrowserLauncher.Detached(Environment.ProcessPath!,command+"--wait-child");Console.WriteLine($"DETACHED={detached}");Console.Out.Flush();await Task.Delay(TimeSpan.FromSeconds(30));return 0;
}
int checks=0;
void Check(bool value,string message){if(!value)throw new Exception(message);checks++;Console.WriteLine("PASS "+message);}
foreach(string allowed in new[]{"debugInspect","pollNineEq","transportExchange"})Check(PortableChild.Allowed(allowed),"Fixed portable native operation "+allowed);
foreach(string denied in new[]{"debugRam","serveDebug","serveTransport","query346","ApplyCandidateWire1","","--help"})Check(!PortableChild.Allowed(denied),"Unsupported portable child operation rejected "+denied);
Check(StaticSite.AllowedHost("localhost:5173"),"Exact static Host");
foreach(string host in new[]{"127.0.0.1:5173","evil.example:5173","localhost:5175","localhost","localhost:5173.evil.example"})Check(!StaticSite.AllowedHost(host),"Alternate static Host rejected "+host);
string root=Path.Combine(Path.GetTempPath(),"AuraPEQ-portable-unit-"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(root);
try {
    await File.WriteAllTextAsync(Path.Combine(root,"index.html"),"production");await File.WriteAllTextAsync(Path.Combine(root,"secret.exe"),"not web content");
    Check(StaticSite.Resolve(root,"/index.html")==Path.Combine(root,"index.html"),"Static file allowed");
    foreach(string path in new[]{"/../index.html","/a/../../index.html","/%2e%2e/secret","/..\\index.html","/C:/Windows/a","/secret.exe","/missing.js"})Check(StaticSite.Resolve(root,path) is null,"Traversal/missing/non-web file rejected "+path);
    var app=StaticSite.Create(root,"offline-unit",0);await app.StartAsync();
    try {
        using var client=new HttpClient(new HttpClientHandler{UseProxy=false});string address=app.Urls.Single();
        using var good=new HttpRequestMessage(HttpMethod.Get,address+"/index.html");good.Headers.Host="localhost:5173";
        using var response=await client.SendAsync(good);Check(response.IsSuccessStatusCode&&await response.Content.ReadAsStringAsync()=="production","Actual static HTTP bytes");
        Check(response.Headers.GetValues("X-Frame-Options").Single()=="DENY","Actual framing guard");
        Check(response.Headers.CacheControl?.NoStore==true,"Production assets no-store");
        using var badOrigin=new HttpRequestMessage(HttpMethod.Get,address+"/index.html");badOrigin.Headers.Host="localhost:5173";badOrigin.Headers.Add("Origin","https://evil.example");
        using var denied=await client.SendAsync(badOrigin);Check((int)denied.StatusCode==403&&!denied.Headers.Contains("Access-Control-Allow-Origin"),"Foreign static Origin rejected without CORS");
        using var badHost=await client.GetAsync(address+"/index.html");Check((int)badHost.StatusCode==403,"Actual alternate Host rejected");
        using var post=new HttpRequestMessage(HttpMethod.Post,address+"/index.html");post.Headers.Host="localhost:5173";
        using var rejectedPost=await client.SendAsync(post);Check((int)rejectedPost.StatusCode==405,"Static POST has no effects");
    }finally{await app.StopAsync();await app.DisposeAsync();}
} finally {Directory.Delete(root,true);}
if(OperatingSystem.IsWindows()){
    string failedCommand=$"\"{Environment.ProcessPath}\" ";if(Path.GetFileNameWithoutExtension(Environment.ProcessPath)=="dotnet")failedCommand+=$"\"{Assembly.GetExecutingAssembly().Location}\" ";
    bool openerError=false;try{BrowserLauncher.Detached(Environment.ProcessPath!,failedCommand+"--exit2",wait:true);}catch(InvalidOperationException){openerError=true;}
    Check(openerError,"Failed detached opener reports actionable error without browser GUI");
    using var parent=Self("--job-parent");Process? child=null,detached=null;
    try{
        string? line=await parent.StandardOutput.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(10));
        Check(line?.StartsWith("CHILD=")==true,"Job-protected parent starts own mock child, no HID");
        child=Process.GetProcessById(int.Parse(line![6..]));Check(!child.HasExited,"Mock child alive before termination");
        string? detachedLine=await parent.StandardOutput.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(10));Check(detachedLine?.StartsWith("DETACHED=")==true,"Explicit browser breakaway mock created");detached=Process.GetProcessById(int.Parse(detachedLine![9..]));
        parent.Kill();await parent.WaitForExitAsync();
        await child.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(5));Check(child.HasExited,"Kill parent ONLY: Windows job kills inherited mock child");
        Check(!detached.HasExited,"Detached browser mock remains alive when helper job closes");
    }finally{if(!parent.HasExited)parent.Kill(true);if(child is not null){if(!child.HasExited)child.Kill();child.Dispose();}if(detached is not null){if(!detached.HasExited)detached.Kill();detached.Dispose();}}
}
Console.WriteLine($"Portable offline tests: {checks} passed; no browser GUI or physical hardware operations.");return 0;
