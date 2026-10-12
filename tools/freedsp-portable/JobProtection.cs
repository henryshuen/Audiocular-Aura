using System.Runtime.InteropServices;
using System.ComponentModel;

namespace AuraPEQ.Portable;

public static class JobProtection
{
    // Intentionally retained for the entire process lifetime. Windows closes
    // it on normal exit, console close, crash or forced termination and kills
    // inherited helper children. Never close while the launcher itself is alive.
    private static IntPtr job;
    public static void Install()
    {
        job=CreateJobObject(IntPtr.Zero,null);
        if(job==IntPtr.Zero)throw new Win32Exception();
        var limits=new ExtendedLimits();limits.Basic.LimitFlags=0x2800; // KILL_ON_JOB_CLOSE + explicit BREAKAWAY_OK
        if(!SetInformationJobObject(job,9,ref limits,Marshal.SizeOf<ExtendedLimits>())||!AssignProcessToJobObject(job,GetCurrentProcess())) {
            int error=Marshal.GetLastWin32Error();CloseHandle(job);job=IntPtr.Zero;throw new Win32Exception(error,"Could not protect helper lifecycle; startup stopped.");
        }
    }
    [StructLayout(LayoutKind.Sequential)] private struct BasicLimits { public long ProcessTime,JobTime;public uint LimitFlags;public UIntPtr MinWorkingSet,MaxWorkingSet;public uint ActiveProcessLimit;public UIntPtr Affinity;public uint PriorityClass,SchedulingClass; }
    [StructLayout(LayoutKind.Sequential)] private struct IoCounters { public ulong ReadOperation,WriteOperation,OtherOperation,ReadTransfer,WriteTransfer,OtherTransfer; }
    [StructLayout(LayoutKind.Sequential)] private struct ExtendedLimits { public BasicLimits Basic;public IoCounters Io;public UIntPtr ProcessMemory,JobMemory,PeakProcessMemory,PeakJobMemory; }
    [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] private static extern IntPtr CreateJobObject(IntPtr attributes,string? name);
    [DllImport("kernel32.dll",SetLastError=true)] private static extern bool SetInformationJobObject(IntPtr handle,int kind,ref ExtendedLimits info,int length);
    [DllImport("kernel32.dll",SetLastError=true)] private static extern bool AssignProcessToJobObject(IntPtr handle,IntPtr process);
    [DllImport("kernel32.dll")] private static extern IntPtr GetCurrentProcess();
    [DllImport("kernel32.dll")] private static extern bool CloseHandle(IntPtr handle);
}
