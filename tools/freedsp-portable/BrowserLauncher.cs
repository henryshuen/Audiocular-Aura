using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Text;

namespace AuraPEQ.Portable;

public static class BrowserLauncher
{
    public static void Open()
    {
        // Use Windows' default URL association outside the helper job. /d disables
        // cmd AutoRun; the command contains a fixed URL and no user-derived data.
        string cmd=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"cmd.exe");
        Detached(cmd,$"\"{cmd}\" /d /c start \"\" \"{StaticSite.Url}\"",wait:true);
    }
    public static int Detached(string file,string commandLine,bool wait=false)
    {
        var startup=new StartupInfo{Size=Marshal.SizeOf<StartupInfo>()};
        if(!CreateProcess(file,new StringBuilder(commandLine),IntPtr.Zero,IntPtr.Zero,false,0x01000000|0x08000000,IntPtr.Zero,null,ref startup,out var process))throw new Win32Exception(Marshal.GetLastWin32Error(),"Could not open default browser. Open http://localhost:5173/ manually.");
        try{
            if(wait&&(WaitForSingleObject(process.Process,5000)!=0||!GetExitCodeProcess(process.Process,out uint code)||code!=0))throw new InvalidOperationException("Default browser opener failed or timed out. Open http://localhost:5173/ manually.");
            return (int)process.ProcessId;
        }finally{CloseHandle(process.Thread);CloseHandle(process.Process);}
    }
    [StructLayout(LayoutKind.Sequential,CharSet=CharSet.Unicode)] private struct StartupInfo {
        public int Size;public string? Reserved,Desktop,Title;public int X,Y,Width,Height,XChars,YChars,Fill,Flags;public short Show,ReservedSize;public IntPtr ReservedData,Input,Output,Error;
    }
    [StructLayout(LayoutKind.Sequential)] private struct ProcessInfo {public IntPtr Process,Thread;public uint ProcessId,ThreadId;}
    [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] private static extern bool CreateProcess(string application,StringBuilder command,IntPtr processAttributes,IntPtr threadAttributes,bool inherit,uint flags,IntPtr environment,string? directory,ref StartupInfo startup,out ProcessInfo process);
    [DllImport("kernel32.dll")] private static extern bool CloseHandle(IntPtr handle);
    [DllImport("kernel32.dll")] private static extern uint WaitForSingleObject(IntPtr handle,uint milliseconds);
    [DllImport("kernel32.dll")] private static extern bool GetExitCodeProcess(IntPtr handle,out uint exitCode);
}
