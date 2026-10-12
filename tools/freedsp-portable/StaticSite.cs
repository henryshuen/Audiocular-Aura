using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;

namespace AuraPEQ.Portable;

public static class StaticSite
{
    public const string Url="http://localhost:5173/";
    private static readonly Dictionary<string,string> Types=new(StringComparer.OrdinalIgnoreCase) {
        [".html"]="text/html; charset=utf-8",[".js"]="text/javascript; charset=utf-8",[".css"]="text/css; charset=utf-8",
        [".json"]="application/json",[".png"]="image/png",[".jpg"]="image/jpeg",[".svg"]="image/svg+xml",[".ico"]="image/x-icon",[".woff2"]="font/woff2",[".txt"]="text/plain; charset=utf-8"
    };
    public static bool AllowedHost(string host) => host=="localhost:5173";
    public static string? Resolve(string root,string path)
    {
        if(path.Contains('\\')||path.Contains('%')||path.Contains(':')||path.Split('/').Any(p=>p is "." or ".."))return null;
        string full=Path.GetFullPath(Path.Combine(root,path.TrimStart('/')));
        string prefix=Path.GetFullPath(root).TrimEnd(Path.DirectorySeparatorChar)+Path.DirectorySeparatorChar;
        if(!full.StartsWith(prefix,StringComparison.OrdinalIgnoreCase)||!File.Exists(full))return null;
        // Do not follow junctions/symlinks out of the package.
        for(string? node=full;node is not null&&node.Length>=root.Length;node=Path.GetDirectoryName(node))
            if((File.GetAttributes(node)&FileAttributes.ReparsePoint)!=0)return null;
        return Types.ContainsKey(Path.GetExtension(full))?full:null;
    }
    public static WebApplication Create(string root,string instance,int port=5173)
    {
        var builder=WebApplication.CreateSlimBuilder(Array.Empty<string>());builder.Logging.ClearProviders();
        builder.WebHost.ConfigureKestrel(options=>{options.Listen(IPAddress.Loopback,port);if(port!=0&&System.Net.Sockets.Socket.OSSupportsIPv6)options.Listen(IPAddress.IPv6Loopback,port);});
        var app=builder.Build();
        app.Run(async c=>{
            c.Response.Headers.CacheControl="no-store";c.Response.Headers["X-Content-Type-Options"]="nosniff";
            c.Response.Headers["Cross-Origin-Resource-Policy"]="same-origin";
            c.Response.Headers["X-Frame-Options"]="DENY";
            c.Response.Headers["Content-Security-Policy"]="frame-ancestors 'none'";
            if(!AllowedHost(c.Request.Host.ToString())||(c.Request.Headers.Origin.Count>0&&c.Request.Headers.Origin.ToString()!="http://localhost:5173")) {c.Response.StatusCode=403;return;}
            if(c.Request.Method is not ("GET" or "HEAD")){c.Response.StatusCode=405;return;}
            if(c.Request.Path=="/__edition/health") {await c.Response.WriteAsJsonAsync(new {product="AuraPEQ FreeDSP Edition",version=Launcher.Version,instance,framework=System.Runtime.InteropServices.RuntimeInformation.FrameworkDescription});return;}
            string? file=Resolve(root,c.Request.Path=="/"?"/index.html":c.Request.Path.Value??"");
            if(file is null){c.Response.StatusCode=404;return;}
            c.Response.ContentType=Types[Path.GetExtension(file)];c.Response.ContentLength=new FileInfo(file).Length;
            if(c.Request.Method=="GET")await c.Response.SendFileAsync(file,c.RequestAborted);
        });
        return app;
    }
}
