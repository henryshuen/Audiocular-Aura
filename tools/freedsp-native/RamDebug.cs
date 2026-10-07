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
                || b.Freq < 20 || b.Freq > 20000 || b.Gain < -12 || b.Gain > 0 || b.Q < .1 || b.Q > 10)
                throw new InvalidOperationException("Position/index mismatch or unsupported band; negative PK20..20000Hz/-12..0dB/Q0.1..10 only");
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
    public static byte[] Packet(int uiIndex, SafeCoefficients c) => SafeRam.Encode(190,[0,Wire(uiIndex),c.Gain,..c.Words,0,0,0,0,0]);
    public static int[] Selected(RamDebugRequest r) => r.Action is "syncNine" or "restoreNine" ? Enumerable.Range(0,9).ToArray() : [r.UiIndex];
    public static int Run(IQueryHid hid, RamDebugRequest r, TextWriter log, List<byte[]> allowed, Func<IPollClock>? clocks = null)
    {
        r.Validate(); clocks ??= () => new PollClock();
        log.WriteLine($"M2N action={r.Action}; RAM only; no90/220/Flash/preamp; native quantizer nearest approximation,1LSB uncertainty");
        foreach(var (cmd,tx) in new[] {(188,SafeRam.Enable()),(187,SafeRam.Bypass())})
            if (SafeRam.Exchange(hid,cmd,tx,log,clocks(),false) is null) return 7;
        var rate = SafeRam.Exchange(hid,346,Caf346.CreateQuery(),log,clocks(),true);
        if (rate?.SampleHz is not int hz) { log.WriteLine("STOP unknown/missing346 rate; no190"); return 7; }
        bool restore = r.Action is "restoreBand" or "restoreNine";
        // Prepare ALL selected packets before first190; no silent skip/truncation or partial invalid model.
        var packets = Selected(r).Select(i => {
            var coeff = Calculate(hz,r.Bands[i],restore);
            return (Index:i, Coeff:coeff, Tx:Packet(i,coeff));
        }).ToArray();
        foreach(var item in packets) {
            byte[] tx = item.Tx; allowed.Add(tx);
            log.WriteLine($"WIRE{Wire(item.Index)} {r.Action} BEGIN");
            log.WriteLine($"UI Band{item.Index+1} index={item.Index} -> wire{Wire(item.Index)} currentHz={hz} Gain={item.Coeff.Gain} scale={item.Coeff.Scale} integers=[{string.Join(",",item.Coeff.Words)}]");
            if (SafeRam.Exchange(hid,190,tx,log,clocks(),false,tx) is null) { log.WriteLine($"WIRE{Wire(item.Index)} {r.Action} FAIL"); log.WriteLine("STOP partial operation; no rollback/retry; some selected bands may remain active"); return 7; }
            log.WriteLine($"WIRE{Wire(item.Index)} {r.Action} PASS");
        }
        log.WriteLine($"RESULT: PROTOCOL COMPLETE bands={packets.Length}; audible validation PENDING; unity is not prior-EQ backup; no persistence claim");
        return 0;
    }
}
