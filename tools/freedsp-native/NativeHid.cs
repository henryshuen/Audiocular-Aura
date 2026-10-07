using System.ComponentModel;
using System.Runtime.InteropServices;
using Microsoft.Win32.SafeHandles;

namespace FreeDspNative;

// No driver changes, WriteFile, Feature reports or alternate report/command fallback.
public sealed class NativeHid : IQueryHid
{
    private readonly SafeFileHandle handle;
    private readonly Func<byte[], bool> allowReport;
    private NativeHid(SafeFileHandle handle, Func<byte[], bool> allowReport) { this.handle = handle; this.allowReport = allowReport; }
    public const uint QueryAccess = 0x80000000 | 0x40000000; // GENERIC_READ | GENERIC_WRITE
    public const uint ShareAccess = 1 | 2; // FILE_SHARE_READ | FILE_SHARE_WRITE

    public static NativeHid Open(HidCollection target) => OpenScoped(target, SafeRam.IsAllowedReport);

    // Internal debug request authorizes only exact packets computed for that request.
    internal static NativeHid OpenScoped(HidCollection target, Func<byte[], bool> allowReport)
    {
        if (!target.IsCaf) throw new InvalidOperationException("Collection does not pass CAF identity/caps/interface gate");
        var handle = NativeMethods.CreateFile(target.Path, QueryAccess, ShareAccess, IntPtr.Zero, 3, 0, IntPtr.Zero);
        if (handle.IsInvalid)
        {
            int error = Marshal.GetLastWin32Error(); handle.Dispose();
            throw new Win32Exception(error, "CreateFile query handle failed");
        }
        try
        {
            var confirmed = Inspect(target.Path, handle);
            if (!confirmed.IsCaf) throw new InvalidOperationException("Opened collection identity/caps changed; no query sent");
            return new NativeHid(handle, allowReport);
        }
        catch { handle.Dispose(); throw; }
    }

    public static List<HidCollection> Discover()
    {
        NativeMethods.HidD_GetHidGuid(out Guid guid);
        IntPtr info = NativeMethods.SetupDiGetClassDevs(ref guid, null, IntPtr.Zero, 0x12); // PRESENT | DEVICEINTERFACE
        if (info == new IntPtr(-1)) throw new Win32Exception(Marshal.GetLastWin32Error(), "SetupDiGetClassDevs failed");
        var found = new List<HidCollection>();
        try
        {
            for (uint i = 0; ; i++)
            {
                var data = new NativeMethods.DeviceInterfaceData { Size = (uint)Marshal.SizeOf<NativeMethods.DeviceInterfaceData>() };
                if (!NativeMethods.SetupDiEnumDeviceInterfaces(info, IntPtr.Zero, ref guid, i, ref data))
                {
                    int error = Marshal.GetLastWin32Error();
                    if (error == 259) break; // NO_MORE_ITEMS
                    throw new Win32Exception(error, "SetupDiEnumDeviceInterfaces failed");
                }
                bool sized = NativeMethods.SetupDiGetDeviceInterfaceDetail(info, ref data, IntPtr.Zero, 0, out uint needed, IntPtr.Zero);
                int sizeError = Marshal.GetLastWin32Error();
                if (sized || sizeError != 122 || needed < 6 || needed > 65536)
                    throw new Win32Exception(sizeError, "Unexpected interface detail size response");
                IntPtr detail = Marshal.AllocHGlobal((int)needed);
                try
                {
                    // SP_DEVICE_INTERFACE_DETAIL_DATA_W: cbSize8 on x64,6 on x86; path starts offset4 on both.
                    Marshal.WriteInt32(detail, IntPtr.Size == 8 ? 8 : 6);
                    if (!NativeMethods.SetupDiGetDeviceInterfaceDetail(info, ref data, detail, needed, out _, IntPtr.Zero))
                        throw new Win32Exception(Marshal.GetLastWin32Error(), "SetupDiGetDeviceInterfaceDetail failed");
                    string path = Marshal.PtrToStringUni(IntPtr.Add(detail, 4)) ?? throw new InvalidOperationException("Empty HID path");
                    if (!path.Contains("vid_35d8&pid_1496", StringComparison.OrdinalIgnoreCase)) continue;
                    using var inspection = NativeMethods.CreateFile(path, 0, ShareAccess, IntPtr.Zero, 3, 0, IntPtr.Zero);
                    if (inspection.IsInvalid)
                    {
                        int error = Marshal.GetLastWin32Error();
                        found.Add(new(path, 0, 0, 0, 0, 0, 0, 0, $"CreateFile metadata failed Win32Error={error}"));
                        continue;
                    }
                    try { found.Add(Inspect(path, inspection)); }
                    catch (Exception error) when (error is Win32Exception or InvalidOperationException)
                    {
                        string reason = error is Win32Exception native
                            ? $"{error.Message} Win32Error={native.NativeErrorCode}" : error.Message;
                        found.Add(new(path, 0, 0, 0, 0, 0, 0, 0, reason));
                    }
                }
                finally { Marshal.FreeHGlobal(detail); }
            }
            return found;
        }
        finally { NativeMethods.SetupDiDestroyDeviceInfoList(info); }
    }

    private static HidCollection Inspect(string path, SafeFileHandle handle)
    {
        var attributes = new NativeMethods.Attributes { Size = (uint)Marshal.SizeOf<NativeMethods.Attributes>() };
        if (!NativeMethods.HidD_GetAttributes(handle, ref attributes))
            throw new Win32Exception(Marshal.GetLastWin32Error(), "HidD_GetAttributes failed");
        if (!NativeMethods.HidD_GetPreparsedData(handle, out IntPtr parsed))
            throw new Win32Exception(Marshal.GetLastWin32Error(), "HidD_GetPreparsedData failed");
        try
        {
            int status = NativeMethods.HidP_GetCaps(parsed, out var caps);
            if (status != 0x00110000) throw new InvalidOperationException($"HidP_GetCaps NTSTATUS=0x{status:x8}");
            var collection = new HidCollection(path, attributes.VendorId, attributes.ProductId, caps.UsagePage, caps.Usage,
                caps.InputBytes, caps.OutputBytes, caps.FeatureBytes);
            if (collection.IsCaf)
            {
                // Pure preparsed-data validation; no device report is requested here.
                int inputId = NativeMethods.HidP_InitializeReportForID(0, 1, parsed, new byte[caps.InputBytes], caps.InputBytes);
                int outputId = NativeMethods.HidP_InitializeReportForID(1, 1, parsed, new byte[caps.OutputBytes], caps.OutputBytes);
                if (inputId != 0x00110000 || outputId != 0x00110000)
                    throw new InvalidOperationException($"Report ID1 validation failed: input NTSTATUS=0x{inputId:x8}, output NTSTATUS=0x{outputId:x8}");
            }
            return collection;
        }
        finally { NativeMethods.HidD_FreePreparsedData(parsed); }
    }

    public HidCallResult SetOutputReport(byte[] buffer)
    {
        if (!allowReport(buffer))
            throw new InvalidOperationException("Only fixed Query346 / safe RAM test reports are permitted");
        bool ok = NativeMethods.HidD_SetOutputReport(handle, buffer, (uint)buffer.Length);
        return new(ok, ok ? 0 : Marshal.GetLastWin32Error());
    }
    public HidCallResult GetInputReport(byte[] buffer)
    {
        if (buffer.Length != Caf346.ReportBytes || buffer[0] != 1 || buffer.AsSpan(1).ContainsAnyExcept((byte)0))
            throw new InvalidOperationException("Input request must be a fresh62-byte ID1 buffer");
        bool ok = NativeMethods.HidD_GetInputReport(handle, buffer, (uint)buffer.Length);
        return new(ok, ok ? 0 : Marshal.GetLastWin32Error());
    }
    public void Dispose() => handle.Dispose();
}

public static class NativeMethods
{
    [StructLayout(LayoutKind.Sequential)]
    public struct DeviceInterfaceData { public uint Size; public Guid InterfaceClassGuid; public uint Flags; public IntPtr Reserved; }
    [StructLayout(LayoutKind.Sequential)]
    public struct Attributes { public uint Size; public ushort VendorId, ProductId, Version; }
    [StructLayout(LayoutKind.Sequential)]
    public struct Caps
    {
        public ushort Usage, UsagePage, InputBytes, OutputBytes, FeatureBytes;
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 17)] public ushort[] Reserved;
        public ushort LinkNodes, InputButtonCaps, InputValueCaps, InputDataIndices;
        public ushort OutputButtonCaps, OutputValueCaps, OutputDataIndices;
        public ushort FeatureButtonCaps, FeatureValueCaps, FeatureDataIndices;
    }
    [DllImport("hid.dll")] public static extern void HidD_GetHidGuid(out Guid guid);
    [DllImport("setupapi.dll", EntryPoint = "SetupDiGetClassDevsW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern IntPtr SetupDiGetClassDevs(ref Guid guid, string? enumerator, IntPtr hwnd, uint flags);
    [DllImport("setupapi.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetupDiEnumDeviceInterfaces(IntPtr info, IntPtr deviceInfo, ref Guid guid, uint index, ref DeviceInterfaceData data);
    [DllImport("setupapi.dll", EntryPoint = "SetupDiGetDeviceInterfaceDetailW", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetupDiGetDeviceInterfaceDetail(IntPtr info, ref DeviceInterfaceData data, IntPtr detail, uint size, out uint needed, IntPtr deviceInfo);
    [DllImport("setupapi.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetupDiDestroyDeviceInfoList(IntPtr info);
    [DllImport("kernel32.dll", EntryPoint = "CreateFileW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern SafeFileHandle CreateFile(string name, uint access, uint share, IntPtr security, uint creation, uint flags, IntPtr template);
    [DllImport("hid.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.U1)]
    public static extern bool HidD_GetAttributes(SafeFileHandle handle, ref Attributes attributes);
    [DllImport("hid.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.U1)]
    public static extern bool HidD_GetPreparsedData(SafeFileHandle handle, out IntPtr data);
    [DllImport("hid.dll")] [return: MarshalAs(UnmanagedType.U1)]
    public static extern bool HidD_FreePreparsedData(IntPtr data);
    [DllImport("hid.dll")] public static extern int HidP_GetCaps(IntPtr data, out Caps caps);
    [DllImport("hid.dll")] public static extern int HidP_InitializeReportForID(int type, byte reportId, IntPtr data, [Out] byte[] buffer, uint size);
    [DllImport("hid.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.U1)]
    public static extern bool HidD_SetOutputReport(SafeFileHandle handle, [In] byte[] buffer, uint size);
    [DllImport("hid.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.U1)]
    public static extern bool HidD_GetInputReport(SafeFileHandle handle, [In, Out] byte[] buffer, uint size);
}
