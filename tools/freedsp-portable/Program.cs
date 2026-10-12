using AuraPEQ.Portable;
using FreeDspNative;

// Embedded, unchanged native CLI. Only the three production bridge operations
// can reach it. This is also the self-contained helper child executable.
if (args.Length == 2 && args[0] == "--native")
{
    if (!PortableChild.Allowed(args[1])) return 2;
    var result = typeof(DebugBridge).Assembly.EntryPoint!.Invoke(null, new object[] { new[] { args[1] } });
    return result is Task<int> task ? await task : (int)result!;
}
if (args.Any(a => a is not ("--no-browser" or "--smoke")))
{
    Console.Error.WriteLine("Unsupported launcher argument. Double-click the launcher without arguments.");
    return 2;
}
return await Launcher.RunAsync(!args.Contains("--no-browser"), args.Contains("--smoke"));
