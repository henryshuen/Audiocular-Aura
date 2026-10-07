using System.ComponentModel;
using FreeDspNative;

// Reject arbitrary operations before any Windows HID call.
if (!SafeRam.IsOperation(args))
{
    Console.Error.WriteLine("Usage: FreeDspQuery query346 | ApplySafeRamTest | RestoreSafeRamTest (fixed operations only)");
    return 2;
}
if (!OperatingSystem.IsWindows())
{
    Console.Error.WriteLine("Windows required; no query sent");
    return 2;
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
    using var hid = NativeHid.Open(target);
    return args[0] == "query346" ? Query346.Run(hid, Console.Out) :
        SafeRam.Run(hid, args[0] == "RestoreSafeRamTest", Console.Out);
}
catch (Exception error) when (error is Win32Exception or InvalidOperationException)
{
    Console.WriteLine($"RESULT: DEVICE / DIAGNOSTIC FAILED\nReason: {error.Message}");
    if (error is Win32Exception native) Console.WriteLine($"Win32Error={native.NativeErrorCode}");
    Console.WriteLine("No alternate collection/access/driver fallback. Paste the complete output.");
    return 5;
}
