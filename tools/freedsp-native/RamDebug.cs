using System.Text.Json;
using System.Text.Json.Serialization;
namespace FreeDspNative;

public sealed record DebugBand([property:JsonRequired] int Index, [property:JsonRequired] double Freq, [property:JsonRequired] double Gain, [property:JsonRequired] double Q, [property:JsonRequired] string Type, [property:JsonRequired] bool Enabled);
public sealed record RamDebugRequest([property:JsonRequired] string Action, [property:JsonRequired] int UiIndex, [property:JsonRequired] DebugBand[] Bands)
{
    public static RamDebugRequest Parse(string json)
    {
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true, UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow };
        try {
            var r = JsonSerializer.Deserialize<RamDebugRequest>(json, options) ?? throw new InvalidOperationException("Missing request");
            r.Validate(); return r;
        } catch (JsonException error) { throw new InvalidOperationException("Invalid/missing JSON fields",error); }
    }
    public void Validate()
    {
        if (Action is not ("applyBand" or "restoreBand" or "syncNine" or "restoreNine") || UiIndex is < 0 or > 8 || Bands is null || Bands.Length != 9)
            throw new InvalidOperationException("Explicit action, UI0..8 and exactly nine bands required");
        for (int i = 0; i < Bands.Length; i++)
        {
            var b = Bands[i];
            if (b is null || b.Index != i || b.Type != "PK" || !double.IsFinite(b.Freq) || !double.IsFinite(b.Gain) || !double.IsFinite(b.Q)
                || b.Freq < 20 || b.Freq > 20000 || b.Gain < GainPolicy.MinDb || b.Gain > GainPolicy.MaxDb || b.Q < .1 || b.Q > 10)
                throw new InvalidOperationException("Position/index mismatch or unsupported band; PK20..20000Hz/official App -16..6dB/Q0.1..10 only; not firmware or safety limits");
        }
    }
}

public static class RamDebug
{
    public static int Wire(int uiIndex) => uiIndex is >= 0 and <= 8 ? uiIndex + 1 : throw new InvalidOperationException("UI index outside0..8");
    public static SafeCoefficients Calculate(int sampleHz, DebugBand b, bool restore)
    {
        if (!SafeRam.Rates.Contains(sampleHz) || b.Freq >= sampleHz / 2.0) throw new InvalidOperationException("Unknown rate/Nyquist; no fallback");
        // Validated inputs before Java-style narrowing; no wrap. JNI uses frequencyU16,Q*256U16,gain*256S16,precision24.
        int freq = (int)b.Freq, qRaw = (int)(b.Q * 256), gainRaw = (int)(b.Gain * 256);
        float[] f;
        if (restore || !b.Enabled || gainRaw == 0) f = [1,0,0,0,0];
        else {
            double w = 2 * Math.PI * freq / (float)sampleHz, sin = Math.Sin(w), cos = Math.Cos(w), x = 128.0 / qRaw;
            float bw = (float)(Math.Log(x + Math.Sqrt(1 + x*x)) * (2 / Math.Log(2)));
            double alpha = sin * Math.Sinh((w / sin) * bw * (Math.Log(2) / 2));
            double a = Math.Pow(1.0592537251772889, gainRaw / 256.0), d = 1 + alpha / a;
            f = [(float)((1+alpha*a)/d),(float)(-2*cos/d),(float)((1-alpha*a)/d),(float)(2*cos/d),(float)(-(1-alpha/a)/d)];
        }
        int e = (int)Math.Floor(Math.Log(f.Max(v => Math.Abs(v))) / Math.Log(2)) + 1, gain = e+2, scale = 1 << (25-gain);
        int[] words = f.Select(c => checked((int)Math.Floor((double)(float)(c*scale)+.5))).ToArray();
        if (words.Any(c => c < -8388608 || c > 8388607)) throw new InvalidOperationException("Signed24 overflow");
        double a1 = -(double)words[3]/scale, a2 = -(double)words[4]/scale;
        if (!(Math.Abs(a2)<1 && 1+a1+a2>0 && 1-a1+a2>0)) throw new InvalidOperationException("Unstable quantized filter");
        return new(sampleHz,f,e,gain,scale,words);
    }
    // Finite quantized-response grid estimate; not firmware headroom or a continuous-maximum proof.
    public static (double PeakDb, double PositiveSumDb) Safety(DebugBand[] bands)
    {
        double sum=bands.Where(b=>b.Enabled).Sum(b=>Math.Max(0,b.Gain)), peak=0;
        foreach(int hz in SafeRam.Rates) {
            var coeffs=bands.Select(b=>Calculate(hz,b,false)).ToArray();
            var frequencies=Enumerable.Range(0,2049).Select(i=>20*Math.Pow(1000,i/2048.0))
                .Concat(new double[]{0,hz/2.0}).Concat(bands.Select(b=>b.Freq));
            foreach(double freq in frequencies) {
                double w=2*Math.PI*freq/hz, cr=Math.Cos(w), sr=Math.Sin(w), c2=Math.Cos(2*w), s2=Math.Sin(2*w), db=0;
                foreach(var c in coeffs) {
                    var x=c.Words.Select(v=>(double)v/c.Scale).ToArray();
                    double nr=x[0]+x[1]*cr+x[2]*c2, ni=-x[1]*sr-x[2]*s2;
                    double dr=1-x[3]*cr-x[4]*c2, di=x[3]*sr+x[4]*s2;
                    double ratio=(nr*nr+ni*ni)/(dr*dr+di*di);
                    if(!double.IsFinite(ratio)||ratio<=0)throw new InvalidOperationException("Nonfinite quantized response; no SET");
                    db+=10*Math.Log10(ratio);
                }
                peak=Math.Max(peak,db);
            }
        }
        return (peak,sum);
    }
    // Stopwatch timings are host API-call boundaries, not USB bus timestamps.
    sealed class TimingHid(IQueryHid inner, TextWriter log, System.Diagnostics.Stopwatch timer, string tag) : IQueryHid
    {
        public HidCallResult SetOutputReport(byte[] buffer) {
            double begin=timer.Elapsed.TotalMilliseconds;
            try { var result=inner.SetOutputReport(buffer);log.WriteLine($"TIMING {tag} SET start_ms={begin:F3} end_ms={timer.Elapsed.TotalMilliseconds:F3} success={result.Success}");return result; }
            catch { log.WriteLine($"TIMING {tag} SET start_ms={begin:F3} end_ms={timer.Elapsed.TotalMilliseconds:F3} exception");throw; }
        }
        public HidCallResult GetInputReport(byte[] buffer) {
            double begin=timer.Elapsed.TotalMilliseconds;
            try { var result=inner.GetInputReport(buffer);log.WriteLine($"TIMING {tag} GET start_ms={begin:F3} end_ms={timer.Elapsed.TotalMilliseconds:F3} success={result.Success}");return result; }
            catch { log.WriteLine($"TIMING {tag} GET start_ms={begin:F3} end_ms={timer.Elapsed.TotalMilliseconds:F3} exception");throw; }
        }
        public void Dispose() { } // Borrowed session; caller owns lifetime.
    }
    public static byte[] Packet(int uiIndex, SafeCoefficients c, int path=0)
    {
        if(path is not (0 or 1))throw new InvalidOperationException("M2Q paths0/1 only");
        return SafeRam.Encode(190,[path,Wire(uiIndex),c.Gain,..c.Words,0,0,0,0,0]);
    }
    public static int[] Selected(RamDebugRequest r) => r.Action is "syncNine" or "restoreNine" ? Enumerable.Range(0,9).ToArray() : [r.UiIndex];
    public static int Run(IQueryHid hid, RamDebugRequest r, TextWriter log, List<byte[]> allowed, Func<IPollClock>? clocks = null)
    {
        r.Validate(); clocks ??= () => new PollClock();
        bool restore = r.Action is "restoreBand" or "restoreNine";
        if(!restore) {
            var selected=Selected(r).Select(i=>r.Bands[i]).ToArray();
            var safety=Safety(selected);
            log.WriteLine($"SAFETY predicted_quantized_grid_peak_db={safety.PeakDb:F3} positive_budget_db={safety.PositiveSumDb:F3}; metrics only, temporary development cap removed");
        }
        var timer=System.Diagnostics.Stopwatch.StartNew();
        // Preflight every known-rate plan before ANY SET; matching346 chooses the current plan.
        // A filter unsafe at any supported rate is rejected before device commands.
        var plans=SafeRam.Rates.ToDictionary(hz=>hz,hz=>Selected(r).SelectMany(i=>{
            var coeff=Calculate(hz,r.Bands[i],restore);
            return new[]{0,1}.Select(path=>(Index:i,Path:path,Coeff:coeff,Tx:Packet(i,coeff,path)));
        }).ToArray());
        log.WriteLine($"M2R action={r.Action}; all five known-rate plans validated before SET; path0 LEFT/path1 RIGHT are M2P hardware-derived labels; RAM only; no90/220/Flash/preamp; nearest quantizer1LSB uncertainty");
        foreach(var (cmd,tx) in new[] {(188,SafeRam.Enable()),(187,SafeRam.Bypass())})
            if (SafeRam.Exchange(hid,cmd,tx,log,clocks(),false) is null) return 7;
        var rate = SafeRam.Exchange(hid,346,Caf346.CreateQuery(),log,clocks(),true);
        if (rate?.SampleHz is not int hz) { log.WriteLine("STOP unknown/missing346 rate; no190"); return 7; }
        var packets=plans[hz];
        foreach(var item in packets) {
            byte[] tx = item.Tx; allowed.Add(tx);
            string channel=item.Path==0?"LEFT":"RIGHT";
            log.WriteLine($"WIRE{Wire(item.Index)} {channel} BEGIN path{item.Path} {r.Action}");
            log.WriteLine($"UI Band{item.Index+1} index={item.Index} -> wire{Wire(item.Index)} currentHz={hz} Gain={item.Coeff.Gain} scale={item.Coeff.Scale} integers=[{string.Join(",",item.Coeff.Words)}]");
            double exchangeStart=timer.Elapsed.TotalMilliseconds;
            using var timed=new TimingHid(hid,log,timer,$"WIRE{Wire(item.Index)} {channel} path{item.Path}");
            var response=SafeRam.Exchange(timed,190,tx,log,clocks(),false,tx);
            log.WriteLine($"TIMING WIRE{Wire(item.Index)} {channel} exchange_start_ms={exchangeStart:F3} exchange_end_ms={timer.Elapsed.TotalMilliseconds:F3} duration_ms={timer.Elapsed.TotalMilliseconds-exchangeStart:F3} matched={response is not null}");
            if (response is null) { log.WriteLine($"WIRE{Wire(item.Index)} {channel} FAIL path{item.Path}"); log.WriteLine("STOP partial operation; no rollback/retry; stereo may be unequal and some selected paths may remain active"); return 7; }
            log.WriteLine($"WIRE{Wire(item.Index)} {channel} PASS");
        }
        log.WriteLine($"RESULT: PROTOCOL COMPLETE bands={packets.Length/2} paths=2 writes190={packets.Length}; stereo/audible validation PENDING; unity is not prior-EQ backup; no persistence claim");
        return 0;
    }
}
