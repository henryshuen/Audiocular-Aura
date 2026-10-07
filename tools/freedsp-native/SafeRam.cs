using System.Buffers.Binary;
using System.Globalization;

namespace FreeDspNative;

// Fixed offline model only. M2E native final candidate selection remains uncertain by 1 LSB.
public sealed record SafeCoefficients(int SampleHz, float[] Floats, int Exponent, int Gain, int Scale, int[] Words)
{
    public int[] Payload(int sdkBand) => [0, SafeRam.WireBand(sdkBand), Gain, .. Words, 0, 0, 0, 0, 0];
    public int[] CandidatePayload(int wire) => [0, SafeRam.CandidateWire(wire), Gain, .. Words, 0, 0, 0, 0, 0];
}

public static class SafeRam
{
    public static IReadOnlyList<int> Rates { get; } = Array.AsReadOnly(new[] {44100, 48000, 96000, 192000, 384000});
    public static bool IsOperation(string[] args) => args.Length == 1 &&
        (args[0] == "query346" || TryRemainingOperation(args[0], out _, out _) || TryCandidateOperation(args[0], out _, out _));
    public static bool TryRemainingOperation(string operation, out int sdkBand, out bool restore)
    {
        (sdkBand, restore) = operation switch {
            "ApplyRemainingBand1" => (1, false), "RestoreRemainingBand1" => (1, true),
            "ApplyRemainingBand2" => (2, false), "RestoreRemainingBand2" => (2, true),
            "ApplyRemainingBand3" => (3, false), "RestoreRemainingBand3" => (3, true),
            "ApplyRemainingBand4" => (4, false), "RestoreRemainingBand4" => (4, true),
            _ => (0, false)
        };
        return sdkBand is >= 1 and <= 4;
    }
    public static int WireBand(int sdkBand) => sdkBand is >= 1 and <= 4 ? sdkBand + 5 :
        throw new InvalidOperationException("M2L permits SDK1..4 / wire6..9 only; no arbitrary band or wire5 retest");

    // Raw coefficient slot candidates, NOT SDK band numbers. Official446 lists1..9;
    // reversible live effect remains unverified for1..4. No arbitrary CLI tuning.
    public static bool TryCandidateOperation(string operation, out int wire, out bool restore)
    {
        (wire, restore) = operation switch {
            "ApplyCandidateWire1" => (1, false), "RestoreCandidateWire1" => (1, true),
            "ApplyCandidateWire2" => (2, false), "RestoreCandidateWire2" => (2, true),
            "ApplyCandidateWire3" => (3, false), "RestoreCandidateWire3" => (3, true),
            "ApplyCandidateWire4" => (4, false), "RestoreCandidateWire4" => (4, true),
            _ => (0, false)
        };
        return wire is >= 1 and <= 4;
    }
    public static int CandidateWire(int wire) => wire is >= 1 and <= 4 ? wire :
        throw new InvalidOperationException("M2M permits unresolved wire1..4 only; no verified slot retest");

    public static SafeCoefficients Calculate(int sampleHz, bool restore)
    {
        if (!Rates.Contains(sampleHz)) throw new InvalidOperationException("Unknown rate; no fallback");
        float[] f;
        if (restore) f = [1, 0, 0, 0, 0];
        else
        {
            // Official PK: frequency U16=400, Q U16=256, gain S16=-3072; precision=24.
            double w = 2 * Math.PI * 400 / (float)sampleHz;
            double sin = Math.Sin(w), cos = Math.Cos(w), x = 128.0 / 256;
            float bandwidth = (float)(Math.Log(x + Math.Sqrt(1 + x * x)) * (2 / Math.Log(2)));
            double alpha = sin * Math.Sinh((w / sin) * bandwidth * (Math.Log(2) / 2));
            double a = Math.Pow(1.0592537251772889, -12);
            double denominator = 1 + alpha / a;
            f = [(float)((1 + alpha * a) / denominator), (float)(-2 * cos / denominator),
                (float)((1 - alpha * a) / denominator), (float)(2 * cos / denominator),
                (float)(-(1 - alpha / a) / denominator)];
        }
        int exponent = (int)Math.Floor(Math.Log(f.Max(v => Math.Abs(v))) / Math.Log(2)) + 1;
        int gain = exponent + 2, scale = 1 << (25 - gain);
        // JS Math.round equivalent, with float32 product; no claim of native 32-candidate optimum.
        int[] words = f.Select(c => checked((int)Math.Floor((double)(float)(c * scale) + .5))).ToArray();
        if (words.Any(c => c < -8388608 || c > 8388607)) throw new InvalidOperationException("Signed24 overflow");
        double a1 = -(double)words[3] / scale, a2 = -(double)words[4] / scale;
        if (!(Math.Abs(a2) < 1 && 1 + a1 + a2 > 0 && 1 - a1 + a2 > 0))
            throw new InvalidOperationException("Quantized filter unstable; no RAM write");
        return new(sampleHz, f, exponent, gain, scale, words);
    }

    private static byte[] Encode(int command, int[] words)
    {
        byte[] b = new byte[62]; b[0] = 1;
        BinaryPrimitives.WriteUInt32LittleEndian(b.AsSpan(2), (uint)words.Length | ((uint)command << 16));
        BinaryPrimitives.WriteUInt32LittleEndian(b.AsSpan(6), Caf346.Module);
        for (int i = 0; i < words.Length; i++) BinaryPrimitives.WriteInt32LittleEndian(b.AsSpan(10 + 4 * i), words[i]);
        return b;
    }
    public static byte[] Enable() => Encode(188, [1, .. new int[12]]);
    // Official logical14 bytes preserved; Windows caps-length adapter adds48 zero bytes, count stays1.
    // Microsoft HidD_SetOutputReport contract + hidapi/windows/hid.c hid_send_output_report.
    public static byte[] Bypass() => Encode(187, [0]);
    public static byte[] Ram(int sampleHz, bool restore, int sdkBand = 1) => Encode(190, Calculate(sampleHz, restore).Payload(sdkBand));
    public static byte[] CandidateRam(int sampleHz, bool restore, int wire) => Encode(190, Calculate(sampleHz, restore).CandidatePayload(wire));
    public static bool IsAllowedReport(byte[] b) => b.AsSpan().SequenceEqual(Caf346.CreateQuery()) ||
        b.AsSpan().SequenceEqual(Enable()) || b.AsSpan().SequenceEqual(Bypass()) ||
        Enumerable.Range(1, 4).Any(band => Rates.Any(rate =>
            b.AsSpan().SequenceEqual(Ram(rate, false, band)) || b.AsSpan().SequenceEqual(Ram(rate, true, band)) ||
            b.AsSpan().SequenceEqual(CandidateRam(rate, false, band)) || b.AsSpan().SequenceEqual(CandidateRam(rate, true, band))));

    public static int Run(IQueryHid hid, bool restore, TextWriter log, Func<IPollClock>? clocks = null, int sdkBand = 1, int? candidateWire = null)
    {
        if (candidateWire.HasValue && sdkBand != 1) throw new InvalidOperationException("Ambiguous SDK/candidate selection");
        int wire = candidateWire.HasValue ? CandidateWire(candidateWire.Value) : WireBand(sdkBand); // Validate before any SET, even for internal callers.
        string label = candidateWire.HasValue ? $"CANDIDATE raw slot / wire{wire} (SDK field unknown)" : $"SDK band{sdkBand} / wire{wire}";
        clocks ??= () => new PollClock();
        log.WriteLine(restore ? $"RESTORE: flat/unity on {label} only; NOT a backup of previous EQ" :
            $"TEST: PK 400 Hz / -12 dB / Q1.0 / single {label}; NOT global preamp");
        log.WriteLine("No Flash, no220, no automatic90. Protocol failure: STOP; do not listen or retry.");
        log.WriteLine(restore ? "Expected: body/warmth returns at SAME song/volume; only tested band is made flat." :
            "Expected: less low-mid/body/warmth around400Hz; NOT an overall12dB volume reduction.");
        log.WriteLine("187: official14-byte logical report; Windows62 API bytes with48 zero padding accepted in M2K. Exact Android USB length equivalence not claimed; matching187 mandatory.");
        foreach (var (command, tx) in new[] { (188, Enable()), (187, Bypass()) })
        {
            if (Exchange(hid, command, tx, log, clocks(), false) is null) return Failed(log, command);
        }
        var rateReply = Exchange(hid, 346, Caf346.CreateQuery(), log, clocks(), true);
        if (rateReply?.SampleHz is not int hz)
        {
            log.WriteLine("346 missing/unknown rate: no coefficient calculation, no190; no fallback");
            return Failed(log, 346);
        }
        var coefficients = Calculate(hz, restore);
        log.WriteLine($"Verified rate source: matching346 word1={rateReply.SampleIndex}; sampleHz={hz}");
        log.WriteLine("Floats [B0,B1,B2,A0,A1]=[" + string.Join(",", coefficients.Floats.Select(v => v.ToString("R", CultureInfo.InvariantCulture))) + "]");
        log.WriteLine($"exponent={coefficients.Exponent} Gain={coefficients.Gain} scale={coefficients.Scale}; integers=[{string.Join(",", coefficients.Words)}]");
        log.WriteLine($"RAM190 count13 payload=[{string.Join(",", (candidateWire.HasValue ? coefficients.CandidatePayload(wire) : coefficients.Payload(sdkBand)))}]; native final quantizer uncertainty1LSB, not bit-exact");
        if (Exchange(hid, 190, (candidateWire.HasValue ? CandidateRam(hz, restore, wire) : Ram(hz, restore, sdkBand)), log, clocks(), false) is null) return Failed(log, 190);
        log.WriteLine(restore ? "RESULT: PROTOCOL RESTORE VERIFIED / LISTENING PENDING" : "RESULT: PROTOCOL APPLY VERIFIED / LISTENING PENDING");
        log.WriteLine("Matching CAF replies do not prove audible EQ; restore covers this band only.");
        log.Flush(); return 0;
    }

    private static int Failed(TextWriter log, int command)
    {
        log.WriteLine($"RESULT: TRANSPORT/PROTOCOL FAILED or RESPONSE UNEXPECTED at command{command}; STOP, no later SET, no retry/listening");
        log.Flush(); return 7;
    }

    public static CafResponse? Exchange(IQueryHid hid, int expected, byte[] tx, TextWriter log, IPollClock clock, bool queryTiming)
    {
        // Only fixed diagnostic reports; this is not a public arbitrary-command transport.
        int txCommand = (int)((BinaryPrimitives.ReadUInt32LittleEndian(tx.AsSpan(2)) >> 16) & 0x7fff);
        if (expected != txCommand || !IsAllowedReport(tx)) throw new InvalidOperationException("Report outside fixed diagnostic allowlist");
        log.WriteLine($"Command{expected} TX requestedLength={tx.Length} logicalLength={(expected == 187 ? 14 : 62)}:\n{Caf346.Hex(tx)}");
        log.WriteLine("SET API=HidD_SetOutputReport once; invoking"); log.Flush();
        var sent = hid.SetOutputReport(tx);
        log.WriteLine($"SET success={sent.Success} Win32Error={sent.Win32Error}"); log.Flush();
        if (!sent.Success) return null;
        int attempt = 0;
        if (!queryTiming) clock.Start(); // official sendCmd includes initial GET in outer budget
        while (true)
        {
            byte[] rx = new byte[62]; rx[0] = 1; attempt++;
            log.WriteLine($"Command{expected} GET #{attempt} API=HidD_GetInputReport requestedLength=62; invoking"); log.Flush();
            var call = hid.GetInputReport(rx);
            log.WriteLine($"GET #{attempt} success={call.Success} Win32Error={call.Win32Error}\nRX entire62-byte buffer (API exposes no actual transferred length):\n{Caf346.Hex(rx)}");
            if (!call.Success) { log.WriteLine("GET FAILED; buffer not a confirmed response"); log.Flush(); return null; }
            var r = Caf346.Parse(rx);
            bool matching = r.Valid && r.Command == expected && (expected != 346 || r.Matching346);
            log.WriteLine($"command={r.Command} reply={r.Reply} count={r.Count} module={r.Module:x8}; logicalwords=[{string.Join(",", r.Words)}] capacityWords=[{string.Join(",", r.CapacityWords)}]");
            log.WriteLine(matching ? "MATCHING CAF RESPONSE" : r.Valid ? "VALID CAF NON-MATCH" : $"INVALID CAF: {r.Reason}"); log.Flush();
            if (queryTiming && attempt == 1) clock.Start();
            if (!queryTiming || attempt > 1) clock.Sleep(5);
            if (matching) return r; // A matching reply is transport evidence, not a decoded undocumented result code.
            if (clock.ElapsedMilliseconds >= 1000) { log.WriteLine("RESPONSE UNEXPECTED: bounded polling expired; no SET resend"); log.Flush(); return null; }
        }
    }
}
