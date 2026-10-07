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
Test("other command structurally valid but nonmatching; wrong module invalid", () => {
    var b=Reply(); BinaryPrimitives.WriteUInt32LittleEndian(b.AsSpan(2),0x80BE0002);
    Check(Caf346.Parse(b).Valid&&!Caf346.Parse(b).Matching346,"Command190 is not346");
    b=Reply(); b[6]=1; Check(!Caf346.Parse(b).Valid,"Module");
});
Test("logical count0/1 structurally valid but unusable for346; overcapacity invalid", () => {
    foreach(ushort count in new ushort[] {0,1}) Check(Caf346.Parse(Reply(5,count)).Valid&&!Caf346.Parse(Reply(5,count)).Matching346,"Missing logicalword1");
    foreach(ushort count in new ushort[] {14,65535}) Check(!Caf346.Parse(Reply(5,count)).Valid,"Count");
});
Test("count2..13 accepted without assuming known captured count", () => {
    for(ushort count=2;count<=13;count++) Check(Caf346.Parse(Reply(5,count)).Matching346,"Count capacity");
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
    Check(Query346.Run(hid,log,new FakeClock())==0,"Valid mock");
    Check(hid.Calls.SequenceEqual(new[]{"SET","GET"}),"One transaction only");
    Check(hid.Tx!.SequenceEqual(Caf346.CreateQuery()),"Only346 sent");
    Check(hid.InitialRx![0]==1&&hid.InitialRx.Skip(1).All(b=>b==0),"Fresh RX independent fromTX");
    Check(log.ToString().Contains("HOST SET_REPORT SUCCESS")&&log.ToString().Contains("VALID CAF346 RESPONSE"),"Honest log");
});
Test("SET failure never reaches GET or alternate calls", () => {
    using var hid=new MockHid(Reply()) {SetResult=new(false,5)}; using var log=new StringWriter();
    Check(Query346.Run(hid,log,new FakeClock())==2&&hid.Calls.SequenceEqual(new[]{"SET"}),"SET gating");
    Check(log.ToString().Contains("Win32Error=5")&&!log.ToString().Contains("VALID CAF346 RESPONSE"),"No false DSP success");
});
Test("GET failure retained, no parser/automatic retry", () => {
    using var hid=new MockHid(Reply()) {GetResult=new(false,31)}; using var log=new StringWriter();
    Check(Query346.Run(hid,log,new FakeClock())==3&&hid.Calls.Count==2,"One failed GET");
    Check(log.ToString().Contains("GET_INPUT_REPORT FAILED")&&log.ToString().Contains("Win32Error=31"),"Error");
});
Test("successful GET with echo is unexpected, not DSP accepted", () => {
    using var hid=new MockHid(Caf346.CreateQuery()); using var log=new StringWriter();
    Check(Query346.Run(hid,log,new FakeClock())==4&&log.ToString().Contains("INVALID CAF")&&log.ToString().Contains("bounded polling expired"),"No fake acceptance");
});
Test("unknown response rate prints UNKNOWN without discarding matching CAF", () => {
    using var hid=new MockHid(Reply(9)); using var log=new StringWriter();
    Check(Query346.Run(hid,log,new FakeClock())==0&&log.ToString().Contains("index=9 Hz=UNKNOWN"),"No guessed48k");
});
byte[] NonMatch(int command=188)
{
    var b=Reply(); BinaryPrimitives.WriteUInt32LittleEndian(b.AsSpan(2),0x80000000|((uint)command<<16)|1);
    BinaryPrimitives.WriteInt32LittleEndian(b.AsSpan(10),1);
    Array.Clear(b,14,48); return b; // Synthetic padding; Henry supplied prefix only, not full capture.
}
Test("M2I188 prefix is valid CAF with one logicalword; NOT a346 reply", () => {
    var r=Caf346.Parse(NonMatch());
    Check(r.Valid&&!r.Matching346&&r.Command==188&&r.Reply==1&&r.Count==1&&r.Module==0xb32d2300&&r.Words.SequenceEqual(new[]{1}),"CAF188 structure");
    Check(Caf346.Hex(NonMatch()).StartsWith("01 00 01 00 bc 80 00 23 2d b3 01 00 00 00"),"Henry-reported prefix only");
});
Test("first188 then346: one SET, two GETs, classify both without hiding188", () => {
    using var hid=new MockHid(Reply()); hid.Responses.Enqueue(NonMatch());
    using var log=new StringWriter(); var clock=new FakeClock();
    Check(Query346.Run(hid,log,clock)==0&&hid.Calls.SequenceEqual(new[]{"SET","GET","GET"}),"Sync sequence");
    Check(clock.Sleeps.SequenceEqual(new[]{5}),"No delay before secondGET; delay after it");
    Check(log.ToString().Contains("GET #1: VALID CAF NON-MATCH")&&log.ToString().Contains("command=188")&&log.ToString().Contains("GET #2: MATCHING CAF346"),"Every candidate visible");
});
Test("several nonmatches then matching within official time budget", () => {
    using var hid=new MockHid(Reply());
    foreach(var b in new[]{NonMatch(),NonMatch(259),NonMatch()}) hid.Responses.Enqueue(b);
    using var log=new StringWriter(); var clock=new FakeClock();
    Check(Query346.Run(hid,log,clock)==0&&hid.Calls.Count(c=>c=="SET")==1&&hid.Calls.Count(c=>c=="GET")==4,"OneSET only");
    Check(clock.ElapsedMilliseconds==15&&clock.Sleeps.All(n=>n==5),"5ms per repeatedGET");
});
Test("identical188 stops at deadline; no SET resend, further GET or FIFO assertion", () => {
    using var hid=new MockHid(NonMatch()); using var log=new StringWriter(); var clock=new FakeClock();
    Check(Query346.Run(hid,log,clock)==4,"No346");
    Check(hid.Calls.Count(c=>c=="SET")==1&&hid.Calls.Count(c=>c=="GET")==201&&clock.ElapsedMilliseconds==1000,"InitialGET plus zero-duration fake GETs until5ms sleeps consume1000ms");
    Check(log.ToString().Contains("appears retained/stale")&&log.ToString().Contains("FIFO/snapshot owner remains UNKNOWN"),"Bounded observation not queue proof");
});
Test("GET failure after nonmatch logs exact attempt and error then stops", () => {
    using var hid=new MockHid(NonMatch()); hid.Results.Enqueue(new(true,0)); hid.Results.Enqueue(new(false,31));
    using var log=new StringWriter(); var clock=new FakeClock();
    Check(Query346.Run(hid,log,clock)==3&&hid.Calls.SequenceEqual(new[]{"SET","GET","GET"}),"Fail-fast");
    Check(log.ToString().Contains("GET #2: GET FAILED")&&log.ToString().Contains("Win32Error=31")&&clock.Sleeps.Count==0,"Failure preserved");
});
Test("invalid CAF then matching; invalid raw not erased", () => {
    using var hid=new MockHid(Reply()); var bad=Reply(); bad[1]=1; hid.Responses.Enqueue(bad);
    using var log=new StringWriter();
    Check(Query346.Run(hid,log,new FakeClock())==0&&log.ToString().Contains("GET #1: INVALID CAF")&&log.ToString().Contains(Caf346.Hex(bad)),"Invalid candidate logging");
});
Test("initial blockingGET excluded from official outer clock; repeatedGET time included", () => {
    var clock=new FakeClock(); using var hid=new MockHid(NonMatch()) {OnGet=()=>clock.TimeMs+=1200};
    using var log=new StringWriter();
    Check(Query346.Run(hid,log,clock)==4&&hid.Calls.Count(c=>c=="GET")==2&&clock.ElapsedMilliseconds==1205,"No perAPI timeout pretended");
});
Test("repeatedGET started within budget may return matching after deadline", () => {
    var clock=new FakeClock(); using var hid=new MockHid(Reply()) {OnGet=()=>clock.TimeMs+=1200}; hid.Responses.Enqueue(NonMatch());
    using var log=new StringWriter();
    Check(Query346.Run(hid,log,clock)==0&&hid.Calls.Count(c=>c=="GET")==2,"Reply check precedes next deadline check, as source");
});
Test("fixed remaining-band CLI rejects extra arguments and opcodes", () => {
    foreach(var op in new[]{"query346","ApplyRemainingBand1","RestoreRemainingBand4"}) Check(SafeRam.IsOperation([op]),"Fixed operation");
    foreach(var op in new[]{"190","220","90","apply","query187","query190"}) Check(!SafeRam.IsOperation([op]),"No arbitrary CLI");
    Check(!SafeRam.IsOperation([])&&!SafeRam.IsOperation(["ApplyRemainingBand1","48000"]),"No tuning");
});
Test("400Hz minus12 Q1 at48k exact M2E float32 model and nearest integers", () => {
    var c=SafeRam.Calculate(48000,false);
    Check(c.Floats.SequenceEqual(new float[]{.9628257155418396f,-1.8981064558029175f,.9378855228424072f,1.8981064558029175f,-.9007112979888916f}),"Float golden");
    Check(c.Exponent==1&&c.Gain==3&&c.Scale==4194304,"Dynamic scaling");
    Check(c.Words.SequenceEqual(new[]{4038384,-7961235,3933777,7961236,-3777857}),"Nearest approximation, NOT captured/native optimum");
    Check(c.Payload(1).SequenceEqual(new[]{0,6,3,4038384,-7961235,3933777,7961236,-3777857,0,0,0,0,0}),"Selector0 wire6 plus13words");
});
Test("all known rates recomputed and stable; unknown rate rejected", () => {
    var words=new List<string>();
    foreach(int hz in SafeRam.Rates) { var c=SafeRam.Calculate(hz,false); Check(c.Gain==c.Exponent+2&&c.Scale==(1<<(25-c.Gain)),"Scale formula"); Check(c.Words[1]<0&&c.Words[3]>0&&c.Words[4]<0,"Official feedback signs"); words.Add(string.Join(",",c.Words)); }
    Check(words.Distinct().Count()==5,"No cached48k"); Throws(()=>SafeRam.Calculate(8000,false));
});
Test("official short187 prefix preserved; justified Windows padding does not inflate logical count", () => {
    var b=SafeRam.Bypass(); Check(b.Length==62,"Windows API length");
    Check(b.Take(14).SequenceEqual(Convert.FromHexString("01000100BB0000232DB300000000")),"Exact official14byte command187");
    Check(b.Skip(14).All(v=>v==0),"Only48zero padding");
});
Test("flat restore is unity not zero/mute and changes only wire6", () => {
    foreach(int hz in SafeRam.Rates) { var c=SafeRam.Calculate(hz,true); Check(c.Gain==3&&c.Scale==4194304&&c.Payload(1).SequenceEqual(new[]{0,6,3,4194304,0,0,0,0,0,0,0,0,0}),"Official flat representation"); }
});
Test("command190 byte order count13 signedwords and strict report allowlist", () => {
    var b=SafeRam.Ram(48000,false); Check(b.Length==62&&b[0]==1&&BinaryPrimitives.ReadUInt32LittleEndian(b.AsSpan(2))==0x00be000d,"Envelope");
    Check(BinaryPrimitives.ReadInt32LittleEndian(b.AsSpan(26))==-7961235,"B1 signedLE atword4");
    foreach(var tx in new[]{Caf346.CreateQuery(),SafeRam.Enable(),SafeRam.Bypass(),b,SafeRam.Ram(48000,true)}) Check(SafeRam.IsAllowedReport(tx),"Known report");
    foreach(int command in new[]{90,220,259,191}) { var bad=(byte[])b.Clone(); BinaryPrimitives.WriteUInt32LittleEndian(bad.AsSpan(2),13u|((uint)command<<16)); Check(!SafeRam.IsAllowedReport(bad),"Forbidden command"); }
    b[14]=5; Check(!SafeRam.IsAllowedReport(b),"No other band"); b=SafeRam.Ram(48000,false); b[10]=5; Check(!SafeRam.IsAllowedReport(b),"No Flash rate selector");
});
Test("Apply andRestore require matching188187346190; query precedes dynamic calculation", () => {
    foreach(bool restore in new[]{false,true}) {
        using var hid=new MockHid(NonMatch(190)); foreach(var b in new[]{NonMatch(188),NonMatch(187),Reply(6)}) hid.Responses.Enqueue(b);
        using var log=new StringWriter(); Check(SafeRam.Run(hid,restore,log,()=>new FakeClock())==0,"Matching chain");
        Check(hid.Transmissions.Select(b=>(int)((BinaryPrimitives.ReadUInt32LittleEndian(b.AsSpan(2))>>16)&0x7fff)).SequenceEqual(new[]{188,187,346,190}),"Only exact sequence once");
        Check(hid.Transmissions.Last().SequenceEqual(SafeRam.Ram(96000,restore)),"Use returned96k");
        var output=log.ToString(); Check(output.IndexOf("command=346")<output.IndexOf("Floats ["),"Query before calculate"); Check(output.Contains(restore?"PROTOCOL RESTORE VERIFIED / LISTENING PENDING":"PROTOCOL APPLY VERIFIED / LISTENING PENDING"),"No audible claim");
    }
});
Test("any prerequisite error stops laterSET; failed/unknown346 never sends190", () => {
    for(int failed=0; failed<3; failed++) {
        using var hid=new MockHid(Reply()); foreach(var b in new[]{NonMatch(188),NonMatch(187)}) hid.Responses.Enqueue(b);
        for(int i=0;i<failed;i++) hid.Results.Enqueue(new(true,0)); hid.Results.Enqueue(new(false,31));
        using var log=new StringWriter(); Check(SafeRam.Run(hid,false,log,()=>new FakeClock())==7,"Stop"); Check(hid.Transmissions.Count==failed+1,"No later SET"); Check(!log.ToString().Contains("Floats ["),"No calculation on failed query");
    }
    using var unknown=new MockHid(Reply(9)); unknown.Responses.Enqueue(NonMatch(188)); unknown.Responses.Enqueue(NonMatch(187));
    using var unknownLog=new StringWriter(); Check(SafeRam.Run(unknown,false,unknownLog,()=>new FakeClock())==7&&unknown.Transmissions.Count==3,"Unknown not48k fallback");
});
Test("mismatch synchronization bounded; no reSET; all raw replies retained", () => {
    using var hid=new MockHid(NonMatch(187)); hid.Responses.Enqueue(NonMatch(259)); using var log=new StringWriter(); var clock=new FakeClock();
    Check(SafeRam.Exchange(hid,187,SafeRam.Bypass(),log,clock,false)?.Command==187,"Match after wrong259");
    Check(hid.Transmissions.Count==1&&hid.Calls.Count(c=>c=="GET")==2&&log.ToString().Contains("VALID CAF NON-MATCH"),"OneSET boundedGET");
    using var stuck=new MockHid(NonMatch(188)); using var stuckLog=new StringWriter(); var bounded=new FakeClock();
    Check(SafeRam.Exchange(stuck,187,SafeRam.Bypass(),stuckLog,bounded,false) is null&&bounded.TimeMs==1000&&stuck.Transmissions.Count==1,"Deadline no resend");
});
Test("190 failedGET never labels protocol verified or retries", () => {
    using var hid=new MockHid(NonMatch(190)); foreach(var b in new[]{NonMatch(188),NonMatch(187),Reply()}) hid.Responses.Enqueue(b);
    foreach(var r in new[]{new HidCallResult(true,0),new(true,0),new(true,0),new(false,31)}) hid.Results.Enqueue(r);
    using var log=new StringWriter(); Check(SafeRam.Run(hid,false,log,()=>new FakeClock())==7&&hid.Transmissions.Count==4&&!log.ToString().Contains("PROTOCOL APPLY VERIFIED"),"Failure gate");
});
Test("M2L exact SDK1..4 mapping; same math and bytes except band word", () => {
    foreach(int hz in SafeRam.Rates) foreach(bool restore in new[]{false,true}) {
        var reference=SafeRam.Ram(hz,restore,1);
        for(int band=1;band<=4;band++) {
            Check(SafeRam.WireBand(band)==band+5,"Official SDK offset");
            var b=SafeRam.Ram(hz,restore,band); Check(SafeRam.IsAllowedReport(b),"Allowed fixed band");
            Check(BinaryPrimitives.ReadInt32LittleEndian(b.AsSpan(14))==band+5,"Wire field");
            Array.Clear(b,14,4); var expected=(byte[])reference.Clone(); Array.Clear(expected,14,4);
            Check(b.SequenceEqual(expected),"Only band field differs, all coefficient/header bytes identical");
        }
    }
    foreach(int band in new[]{-1,0,5,6,8,100}) Throws(()=>SafeRam.Ram(48000,false,band));
    foreach(string op in new[]{"ApplySafeRamTest","RestoreSafeRamTest","ApplyRemainingBand0","ApplyRemainingBand5","ApplyRemainingBand01","ApplyRemainingBand9"}) Check(!SafeRam.IsOperation([op]),"No wire5 or unknown band exposed");
    for(int band=1;band<=4;band++) foreach(bool restore in new[]{false,true}) {
        string op=(restore?"Restore":"Apply")+"RemainingBand"+band;
        Check(SafeRam.TryRemainingOperation(op,out int sdk,out bool flat)&&sdk==band&&flat==restore,"Fixed operation decoding");
    }
});
Test("M2L each band runs identical proven flow with its own190 payload", () => {
    for(int band=1;band<=4;band++) foreach(bool restore in new[]{false,true}) {
        using var hid=new MockHid(NonMatch(190)); foreach(var b in new[]{NonMatch(188),NonMatch(187),Reply()}) hid.Responses.Enqueue(b);
        // Reproduce reported190 reply0 followed by reply1 with explicit synthetic buffers.
        var pending=NonMatch(190); pending[5]&=0x7f; hid.Responses.Enqueue(pending);
        using var log=new StringWriter(); Check(SafeRam.Run(hid,restore,log,()=>new FakeClock(),band)==0,"Success");
        Check(hid.Transmissions.Count==4&&hid.Transmissions.Last().SequenceEqual(SafeRam.Ram(48000,restore,band)),"Selected band only");
        Check(log.ToString().Contains("INVALID CAF: Reply bit is not 1")&&log.ToString().Contains("GET #2"),"reply0 then reply1 boundedGET, not resend");
    }
    using var invalid=new MockHid(Reply()); using var invalidLog=new StringWriter();
    Throws(()=>SafeRam.Run(invalid,false,invalidLog,()=>new FakeClock(),0)); Check(invalid.Calls.Count==0,"Reject band before anySET");
});
Test("M2M raw candidate slots1..4, NOT SDK indices; exact allowlist", () => {
    foreach(int hz in SafeRam.Rates) foreach(bool flat in new[]{false,true}) for(int wire=1;wire<=4;wire++) {
        var b=SafeRam.CandidateRam(hz,flat,wire);
        Check(SafeRam.IsAllowedReport(b)&&b.Length==62,"Only fixed reports");
        Check(BinaryPrimitives.ReadInt32LittleEndian(b.AsSpan(14))==wire,"Raw selector unchanged");
        var reference=SafeRam.Ram(hz,flat,1); Array.Clear(b,14,4); Array.Clear(reference,14,4);
        Check(b.SequenceEqual(reference),"Only selector differs from hardware-proven flow");
    }
    foreach(int wire in new[]{-1,0,5,6,9,10,13,100}) Throws(()=>SafeRam.CandidateRam(48000,false,wire));
    for(int wire=1;wire<=4;wire++) foreach(bool flat in new[]{false,true}) {
        string op=(flat?"Restore":"Apply")+"CandidateWire"+wire;
        Check(SafeRam.IsOperation([op])&&SafeRam.TryCandidateOperation(op,out int result,out bool restore)&&result==wire&&restore==flat,"Fixed CLI");
    }
    foreach(string op in new[]{"ApplyCandidateWire0","ApplyCandidateWire5","ApplyCandidateWire01","190","446"}) Check(!SafeRam.IsOperation([op]),"No arbitrary or verified selector");
    Check(!SafeRam.IsOperation(["ApplyCandidateWire1","2"]),"No numeric tuning");
});
Test("M2M each candidate uses known current rate and proven matching chain only", () => {
    for(int wire=1;wire<=4;wire++) foreach(bool flat in new[]{false,true}) foreach(int rateIndex in Enumerable.Range(4,5)) {
        using var hid=new MockHid(NonMatch(190)); foreach(var b in new[]{NonMatch(188),NonMatch(187),Reply(rateIndex)}) hid.Responses.Enqueue(b);
        using var log=new StringWriter(); Check(SafeRam.Run(hid,flat,log,()=>new FakeClock(),candidateWire:wire)==0,"Synthetic matching flow");
        Check(hid.Transmissions.Count==4&&hid.Transmissions.Last().SequenceEqual(SafeRam.CandidateRam(SafeRam.Rates[rateIndex-4],flat,wire)),"No multirate RAM and no90/220/446");
        Check(log.ToString().Contains("SDK field unknown"),"No invented SDK index");
    }
});
Test("M2M invalid or ambiguous slot fails before any SET", () => {
    using var hid=new MockHid(Reply()); using var log=new StringWriter();
    foreach(int wire in new[]{0,5,9}) Throws(()=>SafeRam.Run(hid,false,log,candidateWire:wire));
    Throws(()=>SafeRam.Run(hid,false,log,sdkBand:2,candidateWire:1)); Check(hid.Calls.Count==0,"No hardware calls");
});
Test("M2M candidate report mutations fail closed", () => {
    var reference=SafeRam.CandidateRam(48000,false,1);
    foreach(int offset in new[]{0,1,2,4,6,10,14,18,22,26,42,61}) {
        var bad=(byte[])reference.Clone(); bad[offset]^=0x40;
        Check(!SafeRam.IsAllowedReport(bad),"No arbitrary values, rate selector or tail padding");
    }
});
Test("M2M candidate prerequisite and rate failures stop before190", () => {
    using var hid=new MockHid(Reply(9)); hid.Responses.Enqueue(NonMatch(188)); hid.Responses.Enqueue(NonMatch(187));
    using var log=new StringWriter(); Check(SafeRam.Run(hid,false,log,()=>new FakeClock(),candidateWire:1)==7&&hid.Transmissions.Count==3,"Unknown not guessed48k");
    using var failed=new MockHid(Reply()) {SetResult=new(false,5)};
    Check(SafeRam.Run(failed,false,log,()=>new FakeClock(),candidateWire:1)==7&&failed.Transmissions.Count==1,"No laterSET");
});
DebugBand[] Nine() => Enumerable.Range(0,9).Select(i=>new DebugBand(i,400,-12,1,"PK",true)).ToArray();
Test("M2N final UI index0..8 maps raw1..9; no SDK inference",()=>{
    for(int i=0;i<9;i++) Check(RamDebug.Wire(i)==i+1,"Direct stable assignment");
    foreach(int i in new[]{-1,9,13})Throws(()=>RamDebug.Wire(i));
});
Test("M2N model equals hardware-proven fixed profile at every known rate",()=>{
    foreach(int hz in SafeRam.Rates) foreach(bool flat in new[]{false,true}) {
        var c=RamDebug.Calculate(hz,Nine()[0],flat);var fixedC=SafeRam.Calculate(hz,flat);
        Check(c.Floats.SequenceEqual(fixedC.Floats)&&c.Words.SequenceEqual(fixedC.Words)&&c.Gain==fixedC.Gain,"Same proven math");
        for(int i=0;i<9;i++) {
            var b=RamDebug.Packet(i,c);Check(b.Length==62&&b[0]==1,"No truncation");
            Check(BinaryPrimitives.ReadInt32LittleEndian(b.AsSpan(10))==0&&BinaryPrimitives.ReadInt32LittleEndian(b.AsSpan(14))==i+1,"Selector0 andrawslot");
            Check(BinaryPrimitives.ReadUInt32LittleEndian(b.AsSpan(2))==0x00be000d&&b.Skip(42).All(x=>x==0),"Only190,count13,zeros");
        }
    }
});
Test("M2N disabled unity and varied negative PK parameters/rates",()=>{
    var b=Nine()[0] with {Enabled=false};Check(RamDebug.Calculate(48000,b,false).Words.SequenceEqual(new[]{4194304,0,0,0,0}),"Unity");
    Check(RamDebug.Calculate(48000,b with {Enabled=true,Gain=0},false).Words.SequenceEqual(new[]{4194304,0,0,0,0}),"Zero PK unity");
    foreach(double f in new[]{20.0,400,1000,20000}) foreach(double q in new[]{.1,1,10}) {
        var r=new RamDebugRequest("applyBand",0,Nine());r.Bands[0]=r.Bands[0] with {Freq=f,Q=q};r.Validate();
        Check(RamDebug.Calculate(48000,r.Bands[0],false).Words.Length==5,"Supported finite coefficients");
    }
    Throws(()=>RamDebug.Calculate(8000,Nine()[0],false));
});
Test("M2N invalid full-state/action data rejected before HID",()=>{
    foreach(string action in new[]{"220","90","readback","flash","preamp"})Throws(()=>new RamDebugRequest(action,0,Nine()).Validate());
    foreach(int index in new[]{-1,9})Throws(()=>new RamDebugRequest("applyBand",index,Nine()).Validate());
    Throws(()=>new RamDebugRequest("syncNine",0,Nine().Take(8).ToArray()).Validate());
    foreach(var b in new[]{Nine()[0] with {Index=1},Nine()[0] with {Freq=double.NaN},Nine()[0] with {Gain=1},Nine()[0] with {Q=0},Nine()[0] with {Type="LSQ"}}) {
        var r=new RamDebugRequest("applyBand",0,Nine());r.Bands[0]=b;Throws(r.Validate);
        using var hid=new MockHid(Reply());using var log=new StringWriter();Throws(()=>RamDebug.Run(hid,r,log,[]));Check(hid.Calls.Count==0,"No SET");
    }
    Throws(()=>RamDebugRequest.Parse("{}"));
    string json=System.Text.Json.JsonSerializer.Serialize(new RamDebugRequest("applyBand",0,Nine()));
    Check(RamDebugRequest.Parse(json).Bands.Length==9,"Exact schema");
    string camel=System.Text.Json.JsonSerializer.Serialize(new RamDebugRequest("applyBand",0,Nine()),new System.Text.Json.JsonSerializerOptions {PropertyNamingPolicy=System.Text.Json.JsonNamingPolicy.CamelCase}); Check(RamDebugRequest.Parse(camel).Bands[0].Enabled,"Browser camelCase required fields");var missing=System.Text.Json.Nodes.JsonNode.Parse(json)!; missing["Bands"]![0]!.AsObject().Remove("Enabled"); Throws(()=>RamDebugRequest.Parse(missing.ToJsonString()));
});
Test("M2N single-band48k uses matched346 and one190; no90/220",()=>{
    foreach(int index in new[]{0,4,8}) foreach(string action in new[]{"applyBand","restoreBand"}) {
        var r=new RamDebugRequest(action,index,Nine());using var hid=new MockHid(NonMatch(190));
        foreach(var b in new[]{NonMatch(188),NonMatch(187),Reply(5)})hid.Responses.Enqueue(b);
        using var log=new StringWriter();var allowed=new List<byte[]>();
        Check(RamDebug.Run(hid,r,log,allowed,()=>new FakeClock())==0,"Complete");
        Check(hid.Transmissions.Count==4&&hid.Transmissions.Last().SequenceEqual(RamDebug.Packet(index,RamDebug.Calculate(48000,r.Bands[index],action=="restoreBand"))),"Exact48k selected packet");
        Check(allowed.Count==1,"Exact request authorization only");
    }
});
Test("M2N fullnine iterates exactly once; disabled slot unity; restoreNine allunity",()=>{
    foreach(string action in new[]{"syncNine","restoreNine"}) {
        var r=new RamDebugRequest(action,0,Nine());r.Bands[2]=r.Bands[2] with {Enabled=false};
        using var hid=new MockHid(NonMatch(190));foreach(var b in new[]{NonMatch(188),NonMatch(187),Reply()})hid.Responses.Enqueue(b);
        using var log=new StringWriter();Check(RamDebug.Run(hid,r,log,[],()=>new FakeClock())==0,"Full state");
        Check(hid.Transmissions.Count==12,"Three prerequisites+nine190 only");
        Check(hid.Transmissions.Skip(3).Select(b=>BinaryPrimitives.ReadInt32LittleEndian(b.AsSpan(14))).SequenceEqual(Enumerable.Range(1,9)),"All slots unique");
        Check(BinaryPrimitives.ReadInt32LittleEndian(hid.Transmissions[5].AsSpan(22))==4194304,"Disabled B0 unity");
        if(action=="restoreNine")Check(hid.Transmissions.Skip(3).All(b=>BinaryPrimitives.ReadInt32LittleEndian(b.AsSpan(22))==4194304),"Allunity");
    }
});
Test("M2N failed/unknown rate or partial190 aborts without retries/rollback",()=>{
    using var unknown=new MockHid(Reply(9));unknown.Responses.Enqueue(NonMatch(188));unknown.Responses.Enqueue(NonMatch(187));using var log=new StringWriter();
    Check(RamDebug.Run(unknown,new("syncNine",0,Nine()),log,[],()=>new FakeClock())==7&&unknown.Transmissions.Count==3,"No190");
    using var failed=new MockHid(NonMatch(190));foreach(var b in new[]{NonMatch(188),NonMatch(187),Reply(),NonMatch(190)})failed.Responses.Enqueue(b);
    for(int j=0;j<4;j++)failed.Results.Enqueue(new(true,0));failed.Results.Enqueue(new(false,31));
    Check(RamDebug.Run(failed,new("syncNine",0,Nine()),log,[],()=>new FakeClock())==7&&failed.Transmissions.Count==5,"First190 done, second fails, no later slot");
});
Test("M2N bridge origin/host constraints reject external, null,127UI and other ports",()=>{
    Check(DebugBridge.AllowedOrigin("http://localhost:5173","127.0.0.1:5174"),"Exact origins");
    foreach(string origin in new[]{"null","https://evil.example","http://127.0.0.1:5173","http://localhost:5175"})Check(!DebugBridge.AllowedOrigin(origin,"127.0.0.1:5174"),"No external writes");
    Check(!DebugBridge.AllowedOrigin(DebugBridge.Origin,"evil.example:5174"),"Host gate");
});
Test("M2N HTTP loopback integration with FAKE child only; handshake/token/schema/busy",()=>{
    RunBridgeMock().GetAwaiter().GetResult();
});
async Task RunBridgeMock()
{
    using var cancellation=new CancellationTokenSource();var ready=new TaskCompletionSource<string>(TaskCreationOptions.RunContinuationsAsynchronously);
    var calls=new System.Collections.Concurrent.ConcurrentQueue<string>();var hold=new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
    bool wait=false;
    var server=DebugBridge.RunAsync(async (operation,json)=>{calls.Enqueue(operation);if(wait)await hold.Task;return new {ok=true,log="FAKE CHILD ONLY",logPath="synthetic-not-written.log"};},cancellation.Token,0,url=>ready.SetResult(url));
    try {
        string url=await ready.Task.WaitAsync(TimeSpan.FromSeconds(10));using var client=new HttpClient();client.DefaultRequestHeaders.Add("Origin",DebugBridge.Origin);
        var handshake=await client.GetAsync(url+"/session");Check(handshake.IsSuccessStatusCode&&calls.Count==0,"No hardware/child on session");
        using var doc=System.Text.Json.JsonDocument.Parse(await handshake.Content.ReadAsStringAsync());string token=doc.RootElement.GetProperty("token").GetString()!;
        Check(token.Length==64,"Fresh secret");
        var bad=await client.PostAsync(url+"/connect",null);Check((int)bad.StatusCode==403&&calls.Count==0,"Missing token no child");
        client.DefaultRequestHeaders.Add("X-AuraPEQ-Session",token);
        var invalid=await client.PostAsync(url+"/ram",new StringContent("{}",System.Text.Encoding.UTF8,"application/json"));Check((int)invalid.StatusCode==400&&calls.Count==0,"Invalid schema no child");
        var connect=await client.PostAsync(url+"/connect",null);Check(connect.IsSuccessStatusCode&&calls.Single()=="debugInspect","Metadata only action");
        string body=System.Text.Json.JsonSerializer.Serialize(new RamDebugRequest("applyBand",0,Nine()));
        wait=true;var pending=client.PostAsync(url+"/ram",new StringContent(body,System.Text.Encoding.UTF8,"application/json"));
        for(int j=0;j<100&&calls.Count<2;j++)await Task.Delay(5);
        var busy=await client.PostAsync(url+"/ram",new StringContent(body,System.Text.Encoding.UTF8,"application/json"));Check((int)busy.StatusCode==409&&calls.Count==2,"No queued duplicate write");
        hold.SetResult();Check((await pending).IsSuccessStatusCode&&calls.Last()=="debugRam","Bounded fixed child request");
        client.DefaultRequestHeaders.Remove("Origin");client.DefaultRequestHeaders.Add("Origin","https://evil.example");
        Check((int)(await client.GetAsync(url+"/session")).StatusCode==403,"Foreign session blocked");
    }finally{hold.TrySetResult();cancellation.Cancel();await server;}
}
Console.WriteLine($"Native offline tests: {passed} passed; SYNTHETIC / MOCK ONLY; no hardware access.");
return 0;

sealed class MockHid(byte[] reply) : IQueryHid
{
    public readonly List<string> Calls=[];
    public readonly List<byte[]> Transmissions=[];
    public byte[]? Tx, InitialRx;
    public HidCallResult SetResult=new(true,0), GetResult=new(true,0);
    public readonly Queue<byte[]> Responses=[];
    public readonly Queue<HidCallResult> Results=[];
    public Action? OnGet;
    public HidCallResult SetOutputReport(byte[] buffer) { Calls.Add("SET"); Tx=(byte[])buffer.Clone(); Transmissions.Add(Tx); return SetResult; }
    public HidCallResult GetInputReport(byte[] buffer)
    {
        Calls.Add("GET"); InitialRx=(byte[])buffer.Clone(); OnGet?.Invoke();
        var result=Results.Count>0?Results.Dequeue():GetResult;
        if(result.Success)(Responses.Count>0?Responses.Dequeue():reply).CopyTo(buffer,0);
        return result;
    }
    public void Dispose() { }
}

sealed class FakeClock : IPollClock
{
    public long TimeMs;
    public readonly List<int> Sleeps=[];
    public long ElapsedMilliseconds=>TimeMs;
    public void Start()=>TimeMs=0;
    public void Sleep(int milliseconds) { Sleeps.Add(milliseconds); TimeMs+=milliseconds; }
}
