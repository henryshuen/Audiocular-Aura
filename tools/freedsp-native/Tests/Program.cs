using System.Buffers.Binary;
using System.Runtime.InteropServices;
using FreeDspNative;

// All responses below are synthetic. No native/device calls in this test process.
int passed = 0;
void Check(bool ok, string message) { if (!ok) throw new Exception(message); }
void Test(string name, Action body) { body(); passed++; Console.WriteLine($"PASS {name}"); }
void Throws(Action body) { bool caught = false; try { body(); } catch (InvalidOperationException) { caught = true; } Check(caught, "Expected conservative stop"); }
byte[] Reply(int index = 5, ushort count = 2)
{
    var b = new byte[62]; b[0] = 1;
    BinaryPrimitives.WriteUInt32LittleEndian(b.AsSpan(2), (uint)count | (346u << 16) | 0x80000000);
    BinaryPrimitives.WriteUInt32LittleEndian(b.AsSpan(6), 0xB32D2300);
    BinaryPrimitives.WriteInt32LittleEndian(b.AsSpan(10), 62);
    BinaryPrimitives.WriteInt32LittleEndian(b.AsSpan(14), index);
    return b;
}
HidCollection Target(string path = @"\\?\hid#vid_35d8&pid_1496&mi_03&col01#synthetic") =>
    new(path, 0x35D8, 0x1496, 0x0c, 1, 62, 62, 0);
Test("exact62-byte official TX including ID; independent golden bytes", () => {
    byte[] expected = Convert.FromHexString("01000D005A0100232DB33E" + new string('0', 102));
    Check(Caf346.CreateQuery().SequenceEqual(expected), "Native TX must match recovered official envelope");
    Check(expected.Length == 62 && expected[0] == 1, "ID +61 data");
});
Test("fresh query buffers prevent changed command leakage", () => {
    var first = Caf346.CreateQuery(); first[4] = 190;
    Check(Caf346.CreateQuery()[4] == 0x5a, "No shared mutable command buffer");
});
Test("CAF346 reply extraction and native word1 offset14", () => {
    var r = Caf346.Parse(Reply());
    Check(r.Valid && r.ReportId == 1 && r.PrefixHigh == 0 && r.Packed == 0x815A0002 && r.Command == 346 &&
        r.Reply == 1 && r.Count == 2 && r.Module == 0xB32D2300 && r.Words.SequenceEqual(new[] {62,5}) &&
        r.SampleIndex == 5 && r.SampleHz == 48000, "Full native response fields");
});
Test("all five verified rate indices; no fallback", () => {
    foreach (var (index,hz) in new[] {(4,44100),(5,48000),(6,96000),(7,192000),(8,384000)})
        Check(Caf346.Parse(Reply(index)).SampleHz == hz, "Rate mapping");
    foreach (int index in new[] {-1001,0,3,9,int.MaxValue}) {
        var r = Caf346.Parse(Reply(index)); Check(r.Valid && r.SampleIndex == index && r.SampleHz is null, "Unknown index is retained");
    }
});
Test("echoed TX is not a reply", () => Check(!Caf346.Parse(Caf346.CreateQuery()).Valid, "Missing replybit rejected"));
Test("wrong report ID and prefix rejected", () => {
    var b=Reply(); b[0]=2; Check(!Caf346.Parse(b).Valid,"ID"); b=Reply(); b[1]=1; Check(!Caf346.Parse(b).Valid,"Prefix");
});
Test("other command and module rejected", () => {
    var b=Reply(); BinaryPrimitives.WriteUInt32LittleEndian(b.AsSpan(2),0x80BE0002); Check(!Caf346.Parse(b).Valid,"Command190");
    b=Reply(); b[6]=1; Check(!Caf346.Parse(b).Valid,"Module");
});
Test("logical count0/1/14/65535 rejected despite full physical capacity", () => {
    foreach(ushort count in new ushort[] {0,1,14,65535}) Check(!Caf346.Parse(Reply(5,count)).Valid,"Count");
});
Test("count2..13 accepted without assuming known captured count", () => {
    for(ushort count=2;count<=13;count++) Check(Caf346.Parse(Reply(5,count)).Valid,"Count capacity");
});
Test("bad physical lengths rejected", () => {
    foreach(int len in new[] {0,1,10,18,61,63}) Check(!Caf346.Parse(new byte[len]).Valid,"Length");
});
Test("negative capacity values preserved; trailing capacity not logical payload", () => {
    var b=Reply(); BinaryPrimitives.WriteInt32LittleEndian(b.AsSpan(58),-1);
    var r=Caf346.Parse(b); Check(r.Valid&&r.Words.Length==2&&r.CapacityWords[12]==-1,"Logical/capacity separation");
});
Test("sole CLI operation; mutation/custom arguments rejected before native discovery", () => {
    Check(Caf346.IsQueryOperation(new[] {"query346"}),"Query allowed");
    foreach(var args in new[] {Array.Empty<string>(),new[]{"190"},new[]{"query188"},new[]{"query187"},new[]{"query90"},
        new[]{"query220"},new[]{"query346","190"},new[]{"--command","346"},new[]{"--worker"}})
        Check(!Caf346.IsQueryOperation(args),"Unsupported args rejected");
});
Test("collection identity/caps/MI03 gate rejects wrong interface and devices", () => {
    var c=Target(); Check(c.IsCaf,"CAF target");
    foreach(var bad in new[] {c with {VendorId=1},c with {ProductId=1},c with {UsagePage=1},c with {Usage=2},
        c with {InputBytes=61},c with {OutputBytes=63},c with {Path=c.Path.Replace("mi_03","mi_04")},
        c with {Path=c.Path.Replace("mi_03","mi_030")},c with {Path="no interface identity"}})
        Check(!bad.IsCaf,"Wrong collection rejected");
});
Test("unique target selected by full gate rather than first", () => {
    var c=Target(); Check(HidCollection.SelectUnique(new[]{c with {Usage=2},c})==c,"Not first");
});
Test("zero, multiple or uninspected candidates stop", () => {
    Throws(()=>HidCollection.SelectUnique([]));
    Throws(()=>HidCollection.SelectUnique(new[]{Target(),Target("second&mi_03#synthetic")}));
    Throws(()=>HidCollection.SelectUnique(new[]{Target(),Target() with {InspectionError="Access denied"}}));
});
Test("invalid collection cannot reach native CreateFile", () => Throws(()=>NativeHid.Open(Target() with {Usage=2})));
Test("Win32 interop layout sizes and access flags", () => {
    Check(Marshal.SizeOf<NativeMethods.Caps>()==64,"HIDP_CAPS 64");
    Check(Marshal.SizeOf<NativeMethods.Attributes>()==12,"HIDD_ATTRIBUTES12");
    Check(Marshal.SizeOf<NativeMethods.DeviceInterfaceData>()==(IntPtr.Size==8?32:28),"SetupAPI layout");
    Check(NativeHid.QueryAccess==0xc0000000&&NativeHid.ShareAccess==3,"No admin/exclusive access");
});
Test("one fixed SET followed immediately by one fresh ID1 GET; mock only", () => {
    using var hid=new MockHid(Reply()); using var log=new StringWriter();
    Check(Query346.Run(hid,log)==0,"Valid mock");
    Check(hid.Calls.SequenceEqual(new[]{"SET","GET"}),"One transaction only");
    Check(hid.Tx!.SequenceEqual(Caf346.CreateQuery()),"Only346 sent");
    Check(hid.InitialRx![0]==1&&hid.InitialRx.Skip(1).All(b=>b==0),"Fresh RX independent fromTX");
    Check(log.ToString().Contains("HOST SET_REPORT SUCCESS")&&log.ToString().Contains("VALID CAF346 RESPONSE"),"Honest log");
});
Test("SET failure never reaches GET or alternate calls", () => {
    using var hid=new MockHid(Reply()) {SetResult=new(false,5)}; using var log=new StringWriter();
    Check(Query346.Run(hid,log)==2&&hid.Calls.SequenceEqual(new[]{"SET"}),"SET gating");
    Check(log.ToString().Contains("Win32Error=5")&&!log.ToString().Contains("VALID CAF346 RESPONSE"),"No false DSP success");
});
Test("GET failure retained, no parser/automatic retry", () => {
    using var hid=new MockHid(Reply()) {GetResult=new(false,31)}; using var log=new StringWriter();
    Check(Query346.Run(hid,log)==3&&hid.Calls.Count==2,"One failed GET");
    Check(log.ToString().Contains("GET_INPUT_REPORT FAILED")&&log.ToString().Contains("Win32Error=31"),"Error");
});
Test("successful GET with echo is unexpected, not DSP accepted", () => {
    using var hid=new MockHid(Caf346.CreateQuery()); using var log=new StringWriter();
    Check(Query346.Run(hid,log)==4&&log.ToString().Contains("GET_INPUT_REPORT SUCCEEDED BUT RESPONSE UNEXPECTED"),"No fake acceptance");
});
Test("unknown response rate prints UNKNOWN without discarding matching CAF", () => {
    using var hid=new MockHid(Reply(9)); using var log=new StringWriter();
    Check(Query346.Run(hid,log)==0&&log.ToString().Contains("index=9 Hz=UNKNOWN"),"No guessed48k");
});
Console.WriteLine($"Native offline tests: {passed} passed; SYNTHETIC / MOCK ONLY; no hardware access.");
return 0;

sealed class MockHid(byte[] reply) : IQueryHid
{
    public readonly List<string> Calls=[];
    public byte[]? Tx, InitialRx;
    public HidCallResult SetResult=new(true,0), GetResult=new(true,0);
    public HidCallResult SetOutputReport(byte[] buffer) { Calls.Add("SET"); Tx=(byte[])buffer.Clone(); return SetResult; }
    public HidCallResult GetInputReport(byte[] buffer) { Calls.Add("GET"); InitialRx=(byte[])buffer.Clone(); if(GetResult.Success)reply.CopyTo(buffer,0); return GetResult; }
    public void Dispose() { }
}
