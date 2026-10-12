using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text.Json;
using Microsoft.Win32.SafeHandles;
using FreeDspNative;

// Standalone native control experiment, NEVER a browser transport or production route.
// Exact validated query only. No generic command/report arguments or retry.
if(args.Length==1&&args[0]=="offline-tests")return OfflineChecks.Run();
if(args.Length!=1 || args[0]!="fixed446Wire2") {Console.Error.WriteLine("Only fixed446Wire2 is permitted");return 2;}
if(!OperatingSystem.IsWindows())return 2;
var observations=new List<object>();var watch=Stopwatch.StartNew();int outputs=0,gets=0;
string outcome="ERROR";
try {
 var target=HidCollection.SelectUnique(NativeHid.Discover());
 if(target.FeatureBytes!=0)throw new InvalidOperationException("Unexpected collection capabilities; STOP");
 byte[] query=Wire2Polling.Query();
 if(!Wire2Polling.IsAllowed(query)||query.Length!=62)throw new InvalidOperationException("Fixed query validation failed");
 using(var handle=NativeMethods.CreateFile(target.Path,NativeHid.QueryAccess,NativeHid.ShareAccess,IntPtr.Zero,3,0x40000000,IntPtr.Zero)){
  if(handle.IsInvalid)throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
  var attributes=new NativeMethods.Attributes{Size=(uint)Marshal.SizeOf<NativeMethods.Attributes>()};
  if(!NativeMethods.HidD_GetAttributes(handle,ref attributes)||attributes.VendorId!=0x35d8||attributes.ProductId!=0x1496)throw new InvalidOperationException("Opened device identity mismatch");
  using var read=new Transfer(handle,62);
  var initial=read.StartRead();observations.Add(new{api="ReadFile/start-before-output",elapsedMs=watch.ElapsedMilliseconds,initial});
  if(initial=="COMPLETE"){observations.Add(new{api="ReadFile/prequery",rawBase64=Convert.ToBase64String(read.Bytes()),classification="PREQUERY_NOT_CORRELATED"});outcome="PREQUERY_FRAME_STOP";}
  else {
   using var write=new Transfer(handle,query.Length);write.Fill(query);
   outputs++;var writeStart=write.StartWrite();var writeResult=write.Wait(1000);
   observations.Add(new{api="WriteFile",elapsedMs=watch.ElapsedMilliseconds,writeStart,writeResult,txBase64=Convert.ToBase64String(query)});
   if(writeResult!="COMPLETE"||write.Count!=62)throw new InvalidOperationException("Output failed/short/timed out; STOP");
   var received=read.Wait(1000);observations.Add(new{api="ReadFile",elapsedMs=watch.ElapsedMilliseconds,result=received,bytes=read.Count,rawBase64=received=="COMPLETE"?Convert.ToBase64String(read.Bytes()):null});
   if(received=="COMPLETE"){
    var verdict=read.Count==62?Wire2Polling.Classify(read.Bytes()):new Wire2Polling.Verdict("STOP","Short input",false,false);
    observations.Add(new{api="ReadFile/classify",verdict});outcome=ResearchPolicy.StreamOutcome(read.Bytes(),read.Count);
   }else if(received=="TIMEOUT")outcome="STREAM_TIMEOUT";
   else throw new InvalidOperationException("Read error; STOP");
  }
 }
 // Control measurement only after the stream handle/read has been cancelled/closed.
 if(ResearchPolicy.AllowsControl(outcome)){
  using var control=NativeMethods.CreateFile(target.Path,NativeHid.QueryAccess,NativeHid.ShareAccess,IntPtr.Zero,3,0,IntPtr.Zero);
  if(control.IsInvalid)throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
  byte[] raw=new byte[62];raw[0]=1;gets++;
  bool ok=NativeMethods.HidD_GetInputReport(control,raw,62);int error=ok?0:Marshal.GetLastWin32Error();
  var verdict=ok?Wire2Polling.Classify(raw):new Wire2Polling.Verdict("STOP","Control GET failed",false,false);
  observations.Add(new{api="HidD_GetInputReport/CONTROL_NOT_BROWSER",elapsedMs=watch.ElapsedMilliseconds,ok,error,rawBase64=Convert.ToBase64String(raw),verdict});
  outcome=verdict.Result=="MATCH"?"WRITEFILE_THEN_CONTROL_MATCH_STREAM_TIMEOUT":"CONTROL_NOT_MATCHING";
 }
}catch(Exception error){observations.Add(new{error=error.Message,elapsedMs=watch.ElapsedMilliseconds});outcome="ERROR_STOP";}
Console.WriteLine(JsonSerializer.Serialize(new{schema=1,context="NATIVE_WIN32_CONTROL_EXPERIMENT_NOT_BROWSER",capturedUtc=DateTimeOffset.UtcNow,command=446,path=0,wire=2,outputs,controlGets=gets,eqWrites=0,browserHardwarePass=false,freshnessVerified=false,outcome,observations},new JsonSerializerOptions{WriteIndented=true}));
return outcome is "NATIVE_STREAM_MATCH_BROWSER_UNVERIFIED" or "WRITEFILE_THEN_CONTROL_MATCH_STREAM_TIMEOUT"?0:7;

static class ResearchPolicy {
 public static bool AllowsControl(string outcome)=>outcome=="STREAM_TIMEOUT";
 public static string StreamOutcome(byte[] raw,uint count)=>count==62&&raw.Length==62&&Wire2Polling.Classify(raw).Result=="MATCH"?"NATIVE_STREAM_MATCH_BROWSER_UNVERIFIED":"STREAM_FRAME_STOP";
}
static class OfflineChecks {
 public static int Run(){
  int passed=0;void Check(bool ok,string name){if(!ok)throw new Exception(name);Console.WriteLine("PASS "+name);passed++;}
  byte[] query=Wire2Polling.Query();
  Check(Convert.ToBase64String(query)=="AQANAL4BACMtswAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=","Independent fixed446/path0/wire2 golden; only query");
  var fixture=JsonDocument.Parse(File.ReadAllText("tests/freedsp/fixtures/deviceNineReadback20261009.json"));
  var record=fixture.RootElement.GetProperty("records").EnumerateArray().First(r=>r.GetProperty("command").GetInt32()==446&&r.GetProperty("wire").GetInt32()==2);
  byte[] rx=Convert.FromBase64String(record.GetProperty("observations")[0].GetProperty("RawBase64").GetString()!);
  Check(ResearchPolicy.StreamOutcome(rx,62)=="NATIVE_STREAM_MATCH_BROWSER_UNVERIFIED","Actual native RX replay is stream-shaped, NOT browser PASS");
  Check(ResearchPolicy.StreamOutcome(query,62)=="STREAM_FRAME_STOP","Echo/pending is never matching; no fallback");
  Check(ResearchPolicy.StreamOutcome(rx,61)=="STREAM_FRAME_STOP","Short stream STOP");
  foreach(int offset in new[]{4,6,10,14}){var bad=(byte[])rx.Clone();bad[offset]^=1;Check(ResearchPolicy.StreamOutcome(bad,62)=="STREAM_FRAME_STOP","Wrong command/module/path/wire offset"+offset);}
  Check(ResearchPolicy.AllowsControl("STREAM_TIMEOUT"),"Exactly no-event timeout permits labeled control");
  foreach(var state in new[]{"ERROR_STOP","PREQUERY_FRAME_STOP","STREAM_FRAME_STOP","NATIVE_STREAM_MATCH_BROWSER_UNVERIFIED"})Check(!ResearchPolicy.AllowsControl(state),"No GET after "+state);
  Console.WriteLine($"Offline research tests: {passed} passed; no Windows/HID access");return 0;
 }
}

sealed class Transfer:IDisposable {
 readonly SafeFileHandle handle;readonly IntPtr buffer,overlapped;readonly SafeWaitHandle signal;
 bool pending;public uint Count{get;private set;}
 public Transfer(SafeFileHandle handle,int length){this.handle=handle;Length=length;buffer=Marshal.AllocHGlobal(length);Marshal.Copy(new byte[length],0,buffer,length);signal=Interop.CreateEvent(IntPtr.Zero,true,false,null);if(signal.IsInvalid)throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());overlapped=Marshal.AllocHGlobal(Marshal.SizeOf<Overlapped>());Marshal.StructureToPtr(new Overlapped{Event=signal.DangerousGetHandle()},overlapped,false);}
 public int Length{get;} public void Fill(byte[] bytes){if(bytes.Length!=Length||!Wire2Polling.IsAllowed(bytes))throw new InvalidOperationException("Only fixed446 query allowed");Marshal.Copy(bytes,0,buffer,Length);}
 public string StartRead()=>Start(false);public string StartWrite()=>Start(true);
 string Start(bool write){bool ok=write?Interop.WriteFile(handle,buffer,(uint)Length,IntPtr.Zero,overlapped):Interop.ReadFile(handle,buffer,(uint)Length,IntPtr.Zero,overlapped);int error=ok?0:Marshal.GetLastWin32Error();if(!ok&&error!=997)throw new System.ComponentModel.Win32Exception(error);pending=true;return ok?Complete():"PENDING";}
 string Complete(){if(!Interop.GetOverlappedResult(handle,overlapped,out uint count,false))throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());Count=count;pending=false;return "COMPLETE";}
 public string Wait(uint ms){if(!pending)return "COMPLETE";uint result=Interop.WaitForSingleObject(signal,ms);if(result==258)return "TIMEOUT";if(result!=0)throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());return Complete();}
 public byte[] Bytes(){var result=new byte[Length];Marshal.Copy(buffer,result,0,Length);return result;}
 public void Dispose(){if(pending){Interop.CancelIoEx(handle,overlapped);if(Interop.WaitForSingleObject(signal,1000)!=0){Environment.FailFast("Owned I/O cancellation did not complete; do not free active buffers");}pending=false;}Marshal.FreeHGlobal(overlapped);Marshal.FreeHGlobal(buffer);signal.Dispose();}
 [StructLayout(LayoutKind.Sequential)]struct Overlapped {public nuint Internal,InternalHigh;public uint Offset,OffsetHigh;public IntPtr Event;}
}
static class Interop {
 [DllImport("kernel32.dll",EntryPoint="CreateEventW",SetLastError=true)]public static extern SafeWaitHandle CreateEvent(IntPtr attributes,[MarshalAs(UnmanagedType.Bool)]bool manual,[MarshalAs(UnmanagedType.Bool)]bool initial,string? name);
 [DllImport("kernel32.dll",SetLastError=true)][return:MarshalAs(UnmanagedType.Bool)]public static extern bool ReadFile(SafeFileHandle h,IntPtr data,uint size,IntPtr count,IntPtr overlapped);
 [DllImport("kernel32.dll",SetLastError=true)][return:MarshalAs(UnmanagedType.Bool)]public static extern bool WriteFile(SafeFileHandle h,IntPtr data,uint size,IntPtr count,IntPtr overlapped);
 [DllImport("kernel32.dll",SetLastError=true)][return:MarshalAs(UnmanagedType.Bool)]public static extern bool GetOverlappedResult(SafeFileHandle h,IntPtr overlapped,out uint count,[MarshalAs(UnmanagedType.Bool)]bool wait);
 [DllImport("kernel32.dll",SetLastError=true)]public static extern uint WaitForSingleObject(SafeWaitHandle h,uint ms);
 [DllImport("kernel32.dll",SetLastError=true)][return:MarshalAs(UnmanagedType.Bool)]public static extern bool CancelIoEx(SafeFileHandle h,IntPtr overlapped);
}
