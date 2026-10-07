using System.ComponentModel;
using FreeDspNative;

// Reject arbitrary operations before any Windows HID call.
if (!SafeRam.IsOperation(args))
{
    Console.Error.WriteLine("Fixed operations: query346 or ApplyRemainingBand1..4 / RestoreRemainingBand1..4 or ApplyCandidateWire1..4 / RestoreCandidateWire1..4. Use test-freedsp-native-unresolved-slots.ps1 for M2M; no numeric band arguments.");
    return 2;
}
if (!OperatingSystem.IsWindows())
{
    Console.Error.WriteLine("Windows required; no query sent");
    return 2;
}
if (args[0] == "serveDebug") return await DebugBridge.RunAsync();
RamDebugRequest? debugRequest = null;
if (args[0] == "debugRam")
{
    try { debugRequest = RamDebugRequest.Parse(Console.In.ReadToEnd()); }
    catch (Exception error) { Console.Error.WriteLine("INVALID DEBUG REQUEST before discovery: " + error.Message); return 2; }
}
Console.WriteLine($"FreeDSP Native CAF diagnostic — {args[0]}");
Console.WriteLine("VID/PID: 0x35D8 / 0x1496; no Flash or driver changes");
if (args[0] == "query346") Console.WriteLine($"TX preview ({Caf346.ReportBytes} bytes): {Caf346.Hex(Caf346.CreateQuery())}");
Console.WriteLine("Discovery access=0; query access=GENERIC_READ|GENERIC_WRITE (0xC0000000), share=READ|WRITE (3), synchronous flags=0");
Console.WriteLine("HidD calls have no timeout parameter. Launcher limits process to30s; each exchange bounded1000ms,346 initial GET precedes clock; no SET resend.");
Console.Out.Flush();
try
{
    var found = NativeHid.Discover();
    Console.WriteLine($"Matching VID/PID HID paths: {found.Count}");
    foreach (var item in found)
    {
        Console.WriteLine($"Device path: {item.Path}");
        if (item.InspectionError is not null) Console.WriteLine($"Inspection failed: {item.InspectionError}");
        else Console.WriteLine($"VID/PID={item.VendorId:x4}/{item.ProductId:x4} usagePage=0x{item.UsagePage:x4} usage=0x{item.Usage:x4} input={item.InputBytes} output={item.OutputBytes} feature={item.FeatureBytes} CAF gate={item.IsCaf}");
    }
    var target = HidCollection.SelectUnique(found);
    Console.WriteLine($"Selected device path: {target.Path}");
    Console.WriteLine($"Input report bytes: {target.InputBytes}\nOutput report bytes: {target.OutputBytes}\nFeature report bytes: {target.FeatureBytes}");
    Console.WriteLine("Input1/Output1 confirmed by HidP_InitializeReportForID (preparsed data only)");
    Console.Out.Flush();
    if (args[0] == "debugInspect") { Console.WriteLine("CONNECTED: exact FreeDSP CAF collection verified; metadata only, no SET/GET"); return 0; }
    if (ChannelProbe.TryOperation(args[0],out _,out _))
    {
        var allowed=new List<byte[]> {SafeRam.Enable(),SafeRam.Bypass(),Caf346.CreateQuery()};
        using var scoped=NativeHid.OpenScoped(target,b=>allowed.Any(p=>p.AsSpan().SequenceEqual(b)));
        return ChannelProbe.Run(scoped,args[0],Console.Out,allowed);
    }
    if (debugRequest is not null)
    {
        var allowed = new List<byte[]> { SafeRam.Enable(), SafeRam.Bypass(), Caf346.CreateQuery() };
        using var scoped = NativeHid.OpenScoped(target, b => allowed.Any(p => p.AsSpan().SequenceEqual(b)));
        return RamDebug.Run(scoped, debugRequest, Console.Out, allowed);
    }
    using var hid = NativeHid.Open(target);
    if (args[0] == "query346") return Query346.Run(hid, Console.Out);
    if (SafeRam.TryCandidateOperation(args[0], out int wire, out bool candidateRestore))
        return SafeRam.Run(hid, candidateRestore, Console.Out, candidateWire: wire);
    SafeRam.TryRemainingOperation(args[0], out int sdkBand, out bool restore);
    return SafeRam.Run(hid, restore, Console.Out, sdkBand: sdkBand);
}
catch (Exception error) when (error is Win32Exception or InvalidOperationException)
{
    Console.WriteLine($"RESULT: DEVICE / DIAGNOSTIC FAILED\nReason: {error.Message}");
    if (error is Win32Exception native) Console.WriteLine($"Win32Error={native.NativeErrorCode}");
    Console.WriteLine("No alternate collection/access/driver fallback. Paste the complete output.");
    return 5;
}
