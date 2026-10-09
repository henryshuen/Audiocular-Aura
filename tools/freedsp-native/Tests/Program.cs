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
    foreach(var b in new[]{Nine()[0] with {Index=1},Nine()[0] with {Freq=double.NaN},Nine()[0] with {Gain=13},Nine()[0] with {Q=0},Nine()[0] with {Type="LSQ"}}) {
        var r=new RamDebugRequest("applyBand",0,Nine());r.Bands[0]=b;Throws(r.Validate);
        using var hid=new MockHid(Reply());using var log=new StringWriter();Throws(()=>RamDebug.Run(hid,r,log,[]));Check(hid.Calls.Count==0,"No SET");
    }
    Throws(()=>RamDebugRequest.Parse("{}"));
    string json=System.Text.Json.JsonSerializer.Serialize(new RamDebugRequest("applyBand",0,Nine()));
    Check(RamDebugRequest.Parse(json).Bands.Length==9,"Exact schema");
    string camel=System.Text.Json.JsonSerializer.Serialize(new RamDebugRequest("applyBand",0,Nine()),new System.Text.Json.JsonSerializerOptions {PropertyNamingPolicy=System.Text.Json.JsonNamingPolicy.CamelCase}); Check(RamDebugRequest.Parse(camel).Bands[0].Enabled,"Browser camelCase required fields");var missing=System.Text.Json.Nodes.JsonNode.Parse(json)!; missing["Bands"]![0]!.AsObject().Remove("Enabled"); Throws(()=>RamDebugRequest.Parse(missing.ToJsonString()));
});
Test("M2R positive PK preflight without temporary composite cap; Restore always unity",()=>{
    foreach(int hz in SafeRam.Rates) foreach(double gain in new[]{1.0,3.0,6.0,12.0}) foreach(double freq in new[]{400.0,1000.0,6000.0}) foreach(double q in new[]{.3,1,4}) {
        var b=Nine()[0] with {Freq=freq,Gain=gain,Q=q};var c=RamDebug.Calculate(hz,b,false);
        Check(c.Words.Length==5 && c.Floats.All(float.IsFinite) && c.Words.All(v=>v>=-8388608 && v<=8388607),"Finite signed24 positive coefficients");
        Check(RamDebug.Packet(0,c,0).Skip(14).SequenceEqual(RamDebug.Packet(0,c,1).Skip(14)),"Same coefficients");
    }
    foreach(double gain in new[]{3.0,6.0}) {
        var r=new RamDebugRequest("applyBand",0,Nine());r.Bands[0]=r.Bands[0] with {Freq=1000,Gain=gain};
        var safe=RamDebug.Safety([r.Bands[0]]);Check(safe.PositiveSumDb==gain && safe.PeakDb<=6.1,"Safe selected positive");
        using var hid=new MockHid(NonMatch(190));foreach(var b in new[]{NonMatch(188),NonMatch(187),Reply()})hid.Responses.Enqueue(b);
        using var log=new StringWriter();Check(RamDebug.Run(hid,r,log,[],()=>new FakeClock())==0&&hid.Transmissions.Count==5,"Selected only, not unrelated state");
        Check(log.ToString().Contains("SET start_ms=")&&log.ToString().Contains("GET start_ms=")&&log.ToString().Contains("exchange_end_ms="),"Per API call and matching timing");
    }
    var unsafeR=new RamDebugRequest("syncNine",0,Nine().Select(b=>b with {Freq=1000,Gain=3}).ToArray());
    using(var hid=new MockHid(NonMatch(190)))using(var log=new StringWriter()) {foreach(var b in new[]{NonMatch(188),NonMatch(187),Reply()})hid.Responses.Enqueue(b);Check(RamDebug.Run(hid,unsafeR,log,[],()=>new FakeClock())==0&&hid.Transmissions.Count==21,"Composite +6 development cap removed");}
    var highSingle=new RamDebugRequest("applyBand",0,Nine());highSingle.Bands[0]=highSingle.Bands[0] with {Gain=12};
    using(var hid=new MockHid(NonMatch(190)))using(var log=new StringWriter()) {Throws(()=>RamDebug.Run(hid,highSingle,log,[],()=>new FakeClock()));Check(hid.Transmissions.Count==0,"App policy rejects+12 before any SET");}
    var restoreR=unsafeR with {Action="restoreNine"};
    using(var hid=new MockHid(NonMatch(190)))using(var log=new StringWriter()) {
        foreach(var b in new[]{NonMatch(188),NonMatch(187),Reply()})hid.Responses.Enqueue(b);
        Check(RamDebug.Run(hid,restoreR,log,[],()=>new FakeClock())==0,"Unsafe positive state can Restore");
        Check(hid.Transmissions.Skip(3).All(b=>BinaryPrimitives.ReadInt32LittleEndian(b.AsSpan(22))==4194304),"Unity both paths");
    }
    var separated=new[]{250.0,1000.0,4000.0}.Select((f,i)=>new DebugBand(i,f,1,1,"PK",true)).ToArray();
    var separatedSafety=RamDebug.Safety(separated);
    Check(separatedSafety.PeakDb<=6.1 && separatedSafety.PositiveSumDb==3,"Three separated low boosts");
    var disabledSafety=RamDebug.Safety([Nine()[0] with {Gain=12,Enabled=false}]);
    Check(disabledSafety.PositiveSumDb==0 && disabledSafety.PeakDb==0,"Disabled positive band is unity");
});
Test("M2Q single-band48k uses matched346 and paired190; no90/220",()=>{
    foreach(int index in new[]{0,4,8}) foreach(string action in new[]{"applyBand","restoreBand"}) {
        var r=new RamDebugRequest(action,index,Nine());using var hid=new MockHid(NonMatch(190));
        foreach(var b in new[]{NonMatch(188),NonMatch(187),Reply(5)})hid.Responses.Enqueue(b);
        using var log=new StringWriter();var allowed=new List<byte[]>();
        Check(RamDebug.Run(hid,r,log,allowed,()=>new FakeClock())==0,"Complete");
        Check(hid.Transmissions.Count==5,"Three prerequisites+two190");
        for(int path=0;path<2;path++)Check(hid.Transmissions[3+path].SequenceEqual(RamDebug.Packet(index,RamDebug.Calculate(48000,r.Bands[index],action=="restoreBand"),path)),"Exact48k stereo packet");
        Check(allowed.Count==2,"Exact request authorization only");
    }
});
Test("M2Q fullnine eighteen writes in wire/path order; disabled andRestore both unity",()=>{
    foreach(string action in new[]{"syncNine","restoreNine"}) {
        var r=new RamDebugRequest(action,0,Nine());r.Bands[2]=r.Bands[2] with {Enabled=false};
        using var hid=new MockHid(NonMatch(190));foreach(var b in new[]{NonMatch(188),NonMatch(187),Reply()})hid.Responses.Enqueue(b);
        using var log=new StringWriter();Check(RamDebug.Run(hid,r,log,[],()=>new FakeClock())==0,"Full state");
        Check(hid.Transmissions.Count==21,"Three prerequisites+eighteen190 only");
        for(int wire=1;wire<=9;wire++)foreach(string channel in new[]{"LEFT","RIGHT"})Check(log.ToString().Contains($"WIRE{wire} {channel} PASS"),"Per-channel PASS");
        Check(hid.Transmissions.Skip(3).Select(b=>BinaryPrimitives.ReadInt32LittleEndian(b.AsSpan(14))).SequenceEqual(Enumerable.Range(1,9).SelectMany(w=>new[]{w,w})),"All slots in paired order");
        Check(hid.Transmissions.Skip(3).Select(b=>BinaryPrimitives.ReadInt32LittleEndian(b.AsSpan(10))).SequenceEqual(Enumerable.Range(1,9).SelectMany(_=>new[]{0,1})),"path0 thenpath1");
        for(int i=0;i<9;i++)Check(hid.Transmissions[3+i*2].Skip(14).SequenceEqual(hid.Transmissions[4+i*2].Skip(14)),"Identical coefficients each pair");
        Check(BinaryPrimitives.ReadInt32LittleEndian(hid.Transmissions[7].AsSpan(22))==4194304&&BinaryPrimitives.ReadInt32LittleEndian(hid.Transmissions[8].AsSpan(22))==4194304,"Disabled both unity");
        Check(log.ToString().Contains("writes190=18"),"Completion onlyafter18");
        if(action=="restoreNine")Check(hid.Transmissions.Skip(3).All(b=>BinaryPrimitives.ReadInt32LittleEndian(b.AsSpan(22))==4194304),"Allunity");
    }
});
  Test("M2O varied fullnine preset matches all nine precomputed packets",()=>{
      int[] frequencies=[250,400,630,1000,1600,2500,4000,6300,10000];
      int[] gains=[-3,-4,-5,-6,-7,-8,-9,-10,-12];
      var bands=Enumerable.Range(0,9).Select(i=>new DebugBand(i,frequencies[i],gains[i],1,"PK",true)).ToArray();
      foreach(string action in new[]{"syncNine","restoreNine"}) {
          using var hid=new MockHid(NonMatch(190));foreach(var b in new[]{NonMatch(188),NonMatch(187),Reply()})hid.Responses.Enqueue(b);
          using var log=new StringWriter();var allowed=new List<byte[]>();
          Check(RamDebug.Run(hid,new(action,0,bands),log,allowed,()=>new FakeClock())==0,"Complete preset");
          Check(allowed.Count==18,"Eighteen authorized packets");
          for(int i=0;i<9;i++)for(int path=0;path<2;path++)Check(hid.Transmissions[i*2+path+3].SequenceEqual(RamDebug.Packet(i,RamDebug.Calculate(48000,bands[i],action=="restoreNine"),path)),"Exact precomputed packet");
      }
  });
Test("M2N failed/unknown rate or partial190 aborts without retries/rollback",()=>{
    using var unknown=new MockHid(Reply(9));unknown.Responses.Enqueue(NonMatch(188));unknown.Responses.Enqueue(NonMatch(187));using var log=new StringWriter();
    Check(RamDebug.Run(unknown,new("syncNine",0,Nine()),log,[],()=>new FakeClock())==7&&unknown.Transmissions.Count==3,"No190");
    using var failed=new MockHid(NonMatch(190));foreach(var b in new[]{NonMatch(188),NonMatch(187),Reply(),NonMatch(190)})failed.Responses.Enqueue(b);
    for(int j=0;j<4;j++)failed.Results.Enqueue(new(true,0));failed.Results.Enqueue(new(false,31));
    Check(RamDebug.Run(failed,new("syncNine",0,Nine()),log,[],()=>new FakeClock())==7&&failed.Transmissions.Count==5,"First190 done, second fails, no later slot");
      Check(log.ToString().Contains("WIRE1 RIGHT FAIL")&&!log.ToString().Contains("RESULT: PROTOCOL COMPLETE"),"Failure log never claims full completion");
});
Test("M2Q quantized-unsafe final band rejects before any SET and invalidpath never builds",()=>{
    var r=new RamDebugRequest("syncNine",0,Nine());r.Bands[8]=r.Bands[8] with {Freq=20,Q=10};
    using var hid=new MockHid(Reply());using var log=new StringWriter();
    Throws(()=>RamDebug.Run(hid,r,log,[]));Check(hid.Transmissions.Count==0,"Allrate packet preflight precedes prerequisites");
    Throws(()=>RamDebug.Packet(0,SafeRam.Calculate(48000,false),2));
});
Test("M2Q failure at any one of eighteen190 packets stops with no laterwrite or rollback",()=>{
    for(int failedWrite=1;failedWrite<=18;failedWrite++){
        using var hid=new MockHid(NonMatch(190));foreach(var b in new[]{NonMatch(188),NonMatch(187),Reply()})hid.Responses.Enqueue(b);
        for(int i=0;i<3+failedWrite-1;i++)hid.Results.Enqueue(new(true,0));hid.Results.Enqueue(new(false,31));
        using var log=new StringWriter();Check(RamDebug.Run(hid,new("syncNine",0,Nine()),log,[],()=>new FakeClock())==7,"Failure propagated");
        Check(hid.Transmissions.Count==3+failedWrite&&!log.ToString().Contains("RESULT: PROTOCOL COMPLETE"),"No extraSET or falsecompletion");
    }
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
Test("M2P fixed path packets differ only inword0; default allowlist rejects path1",()=>{
    foreach(int hz in SafeRam.Rates)foreach(bool restore in new[]{false,true}){
        var c=SafeRam.Calculate(hz,restore);var p0=ChannelProbe.Packet(0,c);var p1=ChannelProbe.Packet(1,c);
        Check(p0.Length==62&&p1.Length==62&&p0[10]==0&&p1[10]==1,"Only path selector changes");
        p1[10]=0;Check(p0.SequenceEqual(p1),"Identical slot5/math/tails");
        Check(BinaryPrimitives.ReadInt32LittleEndian(p0.AsSpan(14))==5,"Fixed wire5");
        Check(!SafeRam.IsAllowedReport(ChannelProbe.Packet(1,c)),"No global path1 authorization");
    }
    Throws(()=>ChannelProbe.Packet(2,SafeRam.Calculate(48000,false)));
    foreach(string op in new[]{"M2PApplyPath2","M2PApplyPath01","M2PFlash","190"})Check(!SafeRam.IsOperation([op]),"Reject arbitrary operation");
    Check(!SafeRam.IsOperation(["M2PApplyBoth","extra"]),"No extra parameters");
});
Test("M2P all fixed operations use matching prerequisites and selected path only",()=>{
    foreach(string op in new[]{"M2PApplyPath0","M2PRestorePath0","M2PApplyPath1","M2PRestorePath1","M2PApplyBoth","M2PRestoreBoth"}){
        ChannelProbe.TryOperation(op,out var paths,out bool restore);
        using var hid=new MockHid(NonMatch(190));foreach(var b in new[]{NonMatch(188),NonMatch(187),Reply()})hid.Responses.Enqueue(b);
        using var log=new StringWriter();var allowed=new List<byte[]>();
        Check(ChannelProbe.Run(hid,op,log,allowed,()=>new FakeClock())==0,"Matching protocol");
        Check(hid.Transmissions.Count==3+paths.Length&&allowed.Count==paths.Length,"One190 per selected path; no retries");
        for(int i=0;i<paths.Length;i++)Check(hid.Transmissions[3+i].SequenceEqual(ChannelProbe.Packet(paths[i],SafeRam.Calculate(48000,restore))),"Exact fixed packet");
    }
});
Test("M2P invalid operation and unknown rate never reach190",()=>{
    using var hid=new MockHid(Reply(9));using var log=new StringWriter();
    Throws(()=>ChannelProbe.Run(hid,"bad",log,[]));Check(hid.Transmissions.Count==0,"Reject before SET");
    foreach(var b in new[]{NonMatch(188),NonMatch(187),Reply(9)})hid.Responses.Enqueue(b);
    Check(ChannelProbe.Run(hid,"M2PApplyPath1",log,[],()=>new FakeClock())==7&&hid.Transmissions.Count==3,"No fallback190");
});
Test("M2P path0 failure prevents path1 and any automaticrestore",()=>{
    using var hid=new MockHid(NonMatch(190));foreach(var b in new[]{NonMatch(188),NonMatch(187),Reply()})hid.Responses.Enqueue(b);
    for(int i=0;i<3;i++)hid.Results.Enqueue(new(true,0));hid.Results.Enqueue(new(false,31));
    using var log=new StringWriter();Check(ChannelProbe.Run(hid,"M2PApplyBoth",log,[],()=>new FakeClock())==7&&hid.Transmissions.Count==4,"Stop after failedfirst190");
    Check(!log.ToString().Contains("M2P PROTOCOL COMPLETE"),"No false completion");
    using var second=new MockHid(NonMatch(190));foreach(var b in new[]{NonMatch(188),NonMatch(187),Reply(),NonMatch(190)})second.Responses.Enqueue(b);
    for(int i=0;i<4;i++)second.Results.Enqueue(new(true,0));second.Results.Enqueue(new(false,31));
    using var partial=new StringWriter();Check(ChannelProbe.Run(second,"M2PApplyBoth",partial,[],()=>new FakeClock())==7&&second.Transmissions.Count==5,"Secondpathfailure does not rollbackfirstpath");
});
List<object> M2sVectors(){
 var vectors=new List<object>();
 foreach(int index in new[]{0,4,8})foreach(int path in new[]{0,1})foreach(double gain in new[]{0.0,-6.0,6.0}){
  var b=new DebugBand(index,1000,gain,1,"PK",true);var c=RamDebug.Calculate(48000,b,false);
  vectors.Add(new{command=190,index,path,gain,hz=48000,helper=RamDebug.Packet(index,c,path)});
 }
 vectors.Add(new{command=188,helper=SafeRam.Enable()});vectors.Add(new{command=187,helper=SafeRam.Bypass()});vectors.Add(new{command=346,helper=Caf346.CreateQuery()});return vectors;
}
Test("M2S native-generated21 vectors stay equal to browser equivalence fixture",()=>{
 var expected=System.Text.Json.Nodes.JsonNode.Parse(File.ReadAllText("tests/freedsp/fixtures/nativeM2sVectors.json"));
 var actual=System.Text.Json.Nodes.JsonNode.Parse(System.Text.Json.JsonSerializer.Serialize(M2sVectors()));
 Check(System.Text.Json.Nodes.JsonNode.DeepEquals(expected,actual),"Native/WebHID codec parity fixture drift");
});
Test("M2S primitive accepts actual21 vectors without native coefficient math",()=>{
 foreach(var v in M2sVectors()){
  using var doc=System.Text.Json.JsonDocument.Parse(System.Text.Json.JsonSerializer.Serialize(v));
  byte[] tx=Convert.FromBase64String(doc.RootElement.GetProperty("helper").GetString()!);
  var request=new TransportRequest(Convert.ToBase64String(tx));Check(request.Bytes().SequenceEqual(tx),"Preserve serializer bytes");
  int cmd=doc.RootElement.GetProperty("command").GetInt32();using var hid=new MockHid(cmd==346?Reply():NonMatch(cmd));using var log=new StringWriter();
  Check(TransportExchange.Run(hid,request,log,()=>new FakeClock())==0,"Matching primitive");
  Check(hid.Transmissions.Single().SequenceEqual(tx),"Exactly one unchanged SET");
  Check(log.ToString().Contains("CAF_NATIVE_REPLY="+Convert.ToBase64String(cmd==346?Reply():NonMatch(cmd))),"Actual raw matching reply preserved");
 }
});
Test("M2S primitive rejects unknown commands/fields before SET",()=>{
 var valid=RamDebug.Packet(4,RamDebug.Calculate(48000,new(4,1000,6,1,"PK",true),false),1);
 foreach(var mutation in new Action<byte[]>[]{b=>b[0]=2,b=>b[1]=1,b=>b[4]=220,b=>b[6]=1,b=>b[10]=2,b=>b[14]=10,b=>b[18]=26,b=>b[58]=1,b=>b[2]=12,b=>b[5]|=128}){
  var tx=(byte[])valid.Clone();mutation(tx);using var hid=new MockHid(NonMatch(190));using var log=new StringWriter();
  Throws(()=>TransportExchange.Run(hid,new(Convert.ToBase64String(tx)),log));Check(hid.Transmissions.Count==0,"No native SET after invalid shape");
 }
});
Test("M2S primitive nonmatch polling never resends; timeout/API failure yields no reply",()=>{
 using var hid=new MockHid(NonMatch(188));hid.Responses.Enqueue(NonMatch(190));using var log=new StringWriter();
 Check(TransportExchange.Run(hid,new(Convert.ToBase64String(SafeRam.Enable())),log,()=>new FakeClock())==0&&hid.Transmissions.Count==1,"GET nonmatch then matching, single SET");
 foreach(bool apiFail in new[]{false,true}){
  using var fail=new MockHid(NonMatch(190));if(apiFail)fail.GetResult=new(false,31);using var failLog=new StringWriter();
  Check(TransportExchange.Run(fail,new(Convert.ToBase64String(SafeRam.Enable())),failLog,()=>new FakeClock())==7&&fail.Transmissions.Count==1,"Bounded STOP no resend");
  Check(!failLog.ToString().Contains("CAF_NATIVE_REPLY="),"No fabricated matching response");
 }
});
Test("M2S minimal HTTP helper metadata/transport only; no business /ram endpoint",()=>RunTransportBridgeMock().GetAwaiter().GetResult());
async Task RunTransportBridgeMock(){
 using var cancellation=new CancellationTokenSource();var ready=new TaskCompletionSource<string>(TaskCreationOptions.RunContinuationsAsynchronously);
 var calls=new List<string>();var server=DebugBridge.RunAsync((op,json)=>{calls.Add(op);return Task.FromResult<object>(new{ok=true,exitCode=0,reply=Convert.ToBase64String(NonMatch(188)),log="FAKE ONLY"});},cancellation.Token,0,url=>ready.SetResult(url),diagnostics:false);
 try{
  string url=await ready.Task.WaitAsync(TimeSpan.FromSeconds(10));using var client=new HttpClient();client.DefaultRequestHeaders.Add("Origin",DebugBridge.Origin);
  using var session=System.Text.Json.JsonDocument.Parse(await client.GetStringAsync(url+"/session"));
  Check(session.RootElement.GetProperty("mode").GetString()=="M2S CAF TRANSPORT"&&calls.Count==0,"Session has no child");
  client.DefaultRequestHeaders.Add("X-AuraPEQ-Session",session.RootElement.GetProperty("token").GetString());
  Check((await client.PostAsync(url+"/connect",null)).IsSuccessStatusCode&&calls.Single()=="debugInspect","Metadata only");
  Check((int)(await client.PostAsync(url+"/ram",new StringContent("{}",System.Text.Encoding.UTF8,"application/json"))).StatusCode==404&&calls.Count==1,"No PEQ business endpoint");
  Check((int)(await client.PostAsync(url+"/transport",new StringContent("{}",System.Text.Encoding.UTF8,"application/json"))).StatusCode==400&&calls.Count==1,"Malformed request no child");
  string body=System.Text.Json.JsonSerializer.Serialize(new TransportRequest(Convert.ToBase64String(SafeRam.Enable())));
  var result=await client.PostAsync(url+"/transport",new StringContent(body,System.Text.Encoding.UTF8,"application/json"));
  Check(result.IsSuccessStatusCode&&calls.SequenceEqual(new[]{"debugInspect","transportExchange"}),"Only primitive child operation");
  using var response=System.Text.Json.JsonDocument.Parse(await result.Content.ReadAsStringAsync());Check(response.RootElement.GetProperty("reply").GetString()==Convert.ToBase64String(NonMatch(188)),"Raw response passed through");
 }finally{cancellation.Cancel();await server;}
}
if(args.Length==2 && args[0]=="--export-m2s")File.WriteAllText(args[1],System.Text.Json.JsonSerializer.Serialize(M2sVectors(),new System.Text.Json.JsonSerializerOptions{WriteIndented=true}));
byte[] FlashPacket(int command,int[] words){
 var b=new byte[62];b[0]=1;BinaryPrimitives.WriteUInt32LittleEndian(b.AsSpan(2),13u|((uint)command<<16));
 BinaryPrimitives.WriteUInt32LittleEndian(b.AsSpan(6),Caf346.Module);
 for(int i=0;i<words.Length;i++)BinaryPrimitives.WriteInt32LittleEndian(b.AsSpan(10+4*i),words[i]);return b;
}
byte[] FlashReply(int command){var b=NonMatch(command);b[2]=0;return b;}
Test("Flash primitive:56 requests, exact SET once / matching Input GET, commit255 last",()=>{
 var plan=new List<byte[]>{FlashPacket(90,[90,..new int[12]])};
 for(int wire=1;wire<=9;wire++)plan.Add(FlashPacket(220,[0,wire,1000,256,0,0,..new int[7]]));
 for(int wire=1;wire<=9;wire++)for(int rate=4;rate<=8;rate++)plan.Add(FlashPacket(220,[rate,wire,3,4194304,0,0,0,0,..new int[5]]));
 plan.Add(FlashPacket(220,[255,..new int[12]]));Check(plan.Count==56,"56 requests");
 foreach(var tx in plan){int cmd=tx[4];using var hid=new MockHid(FlashReply(cmd));using var log=new StringWriter();
   Check(TransportExchange.Run(hid,new(Convert.ToBase64String(tx)),log,()=>new FakeClock())==0,"Matching Flash response");
   Check(hid.Transmissions.Single().SequenceEqual(tx)&&hid.Calls.SequenceEqual(new[]{"SET","GET"}),"No retry unchanged SET/GET");}
 Check(BinaryPrimitives.ReadInt32LittleEndian(plan[^1].AsSpan(10))==255,"Commit unsigned255");
});
Test("Flash malformed class/commit/rate/metadata rejected before SET",()=>{
 foreach(var tx in new[]{FlashPacket(220,[-1,..new int[12]]),FlashPacket(220,[1,5,3,4194304,..new int[9]]),
   FlashPacket(220,[0,10,1000,256,0,-6,..new int[7]]),FlashPacket(220,[0,5,1000,256,0,-1536,..new int[7]]),
   FlashPacket(220,[0,5,1000,256,0,-17,..new int[7]]),FlashPacket(220,[0,5,1000,256,0,7,..new int[7]]),
   FlashPacket(90,[90,1,..new int[11]])}){
   using var hid=new MockHid(NonMatch(220));using var log=new StringWriter();
   Throws(()=>TransportExchange.Run(hid,new(Convert.ToBase64String(tx)),log));Check(hid.Transmissions.Count==0,"Invalid Flash never SET");}
});
Test("FreeDSP App gain policy endpoints; unchanged RAM/Flash bytes, offline only",()=>{
 foreach(int gain in new[]{-16,6}){
   var request=new RamDebugRequest("applyBand",0,Nine());request.Bands[0]=request.Bands[0] with {Freq=1000,Gain=gain};
   request.Validate();foreach(int hz in new[]{44100,48000,96000,192000,384000})_ = RamDebug.Calculate(hz,request.Bands[0],false);
   var tx=FlashPacket(220,[0,5,1000,256,0,gain,..new int[7]]);
   Check(new TransportRequest(Convert.ToBase64String(tx)).Bytes().SequenceEqual(tx),"Metadata policy accepts exact bytes without clamping");
 }
});
Test("Flash first bad response fails immediately without GET polling or SET retry",()=>{
 var tx=FlashPacket(220,[255,..new int[12]]);
 foreach(var rx in new[]{NonMatch(190),Reply(5),new byte[62]}){
   using var hid=new MockHid(rx);hid.Responses.Enqueue(rx);hid.Responses.Enqueue(FlashReply(220));using var log=new StringWriter();
   Check(TransportExchange.Run(hid,new(Convert.ToBase64String(tx)),log,()=>new FakeClock())==7,"Mismatch STOP");
   Check(hid.Calls.SequenceEqual(new[]{"SET","GET"}),"One SET one GET only");}
 var nonzero=NonMatch(220);nonzero[2]=1;using var bad=new MockHid(nonzero);using var badLog=new StringWriter();
 Check(TransportExchange.Run(bad,new(Convert.ToBase64String(tx)),badLog,()=>new FakeClock())==7&&bad.Calls.Count==2,"Unexpected count STOP");
});
Test("Readback exact fixed queries exclude every mutation and HTTP write transport",()=>{
 var plan=ReadbackQuery.Plan();Check(plan.Length==19,"19 fixed queries");
 foreach(var q in plan){Check(ReadbackQuery.IsAllowed(q.Bytes),"Fixed allowlist");
  if(q.Command!=346){Check(!SafeRam.IsAllowedReport(q.Bytes),"Old diagnostic allowlist unchanged");Throws(()=>new TransportRequest(Convert.ToBase64String(q.Bytes)).Bytes());}
  var changed=(byte[])q.Bytes.Clone();changed[61]=1;Check(!ReadbackQuery.IsAllowed(changed),"Padding mutation rejected");}
 Check(!ReadbackQuery.IsAllowed(SafeRam.Enable())&&!ReadbackQuery.IsAllowed(SafeRam.Bypass()),"No mode enable/bypass");
 Check(SafeRam.IsOperation(["readEqEvidence"])&&!SafeRam.IsOperation(["readEqEvidence","1"]),"Fixed CLI only");
});
byte[] ReadReply(ReadbackQuery.Request q){
 var rx=(byte[])q.Bytes.Clone();rx[5]|=128;rx[2]=(byte)(q.Command==346?2:q.Command==477?6:8);
 if(q.Command==346)BinaryPrimitives.WriteInt32LittleEndian(rx.AsSpan(14),5);
 if(q.Command==477)BinaryPrimitives.WriteInt32LittleEndian(rx.AsSpan(14),q.Wire);
 return rx;
}
Test("Full19 read-only synthetic capture sends each query once and never writes EQ",()=>{
 var plan=ReadbackQuery.Plan();using var hid=new MockHid(ReadReply(plan[^1]));
 foreach(var q in plan)hid.Responses.Enqueue(ReadReply(q));using var log=new StringWriter();
 Check(ReadbackQuery.Run(hid,log,()=>new FakeClock())==0,"All query responses accepted");
 Check(hid.Transmissions.Count==19&&hid.Transmissions.Zip(plan).All(pair=>pair.First.SequenceEqual(pair.Second.Bytes)),"Exact sequence once");
 Check(log.ToString().Contains("\"completeQuerySet\":true")&&log.ToString().Contains("\"productionEligible\":false"),"Not production readback");
});
Test("Readback malformed/partial/stale/wrong module replies stop and retain partial JSON",()=>{
 var plan=ReadbackQuery.Plan();var good=ReadReply(plan[0]);
 var partial=ReadReply(plan[1]);partial[2]=5;
 var stale=ReadReply(plan[1]);stale[14]=9;
 var module=ReadReply(plan[1]);module[6]=1;
 var error=ReadReply(plan[1]);error[2]=255;error[3]=255;
 foreach(var bad in new[]{partial,stale,module,error}){
  using var hid=new MockHid(bad);hid.Responses.Enqueue(good);using var log=new StringWriter();
  Check(ReadbackQuery.Run(hid,log,()=>new FakeClock())==7&&hid.Transmissions.Count==2,"Stop first failure no later wire");
  Check(log.ToString().Contains("\"completeQuerySet\":false"),"Partial capture retained");
 }
});
Test("Readback wrong-command timeout never resends and retains local state by isolation",()=>{
 using var hid=new MockHid(NonMatch(190));using var log=new StringWriter();
 Check(ReadbackQuery.Run(hid,log,()=>new FakeClock())==7&&hid.Transmissions.Count==1,"Bounded GET only, no SET resend");
 Check(hid.Calls.Count<=202,"1sec bound");
});
Test("Readback invalid device rejected by same mandatory discovery gate",()=>Throws(()=>HidCollection.SelectUnique([Target() with {ProductId=1}])));
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
