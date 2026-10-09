using System.Text.Json;

namespace FreeDspNative;

// Separate opt-in query, never invoked by CONNECT, HTTP, or EQ writes.
public static class Wire2Polling
{
    public const int BudgetMs = 1000, IntervalMs = 5, MaxGets = 201;
    public static byte[] Query() => SafeRam.Encode(446, [0, 2, .. new int[11]]);
    public static bool IsAllowed(byte[] bytes) => bytes.AsSpan().SequenceEqual(Query());
    public sealed record Verdict(string Result, string Reason, bool EnvelopeMatched, bool PathWireMatched);
    public sealed record Observation(int Attempt, long StartedMs, long ElapsedMs, bool ApiSuccess, int Win32Error,
        string RawBase64, string Result, string Reason, bool EnvelopeMatched, bool PathWireMatched);

    public static Verdict Classify(byte[] bytes)
    {
        var r = Caf346.Parse(bytes);
        if (!r.Valid && r.Reason != "Reply bit is not 1") return new("STOP", r.Reason, false, false);
        if (r.Command != 446) return new("STOP", "Wrong command / unrelated or stale frame", false, false);
        var w = r.CapacityWords;
        if (r.Reply == 0)
        {
            // Only source request echo and the observed cleared-payload shape.
            // slot0 here is pending/uninterpretable, not a completed slot0 reply.
            bool pending = r.Count == 13 && w[0] == 0 && (w[1] == 0 || w[1] == 2) && w.Skip(2).All(v => v == 0);
            return pending ? new("PENDING", "Reply0; no coefficient data accepted", true, w[1] == 2) :
                new("STOP", "Unexpected pending path/wire/payload", true, false);
        }
        bool correlated = w[0] == 0 && w[1] == 2;
        if (!correlated) return new("STOP", "Wrong path/wire / stale response candidate", true, false);
        if (r.Count != 8) return new("STOP", "Expected observed446 count8 format", true, true);
        // Conservative existing representation domain, not a firmware limit.
        if (w[2] < 0 || w[2] > 25) return new("STOP", "Unsupported scaling word", true, true);
        foreach (int coefficient in w.Skip(3).Take(5))
        {
            int signed24 = (coefficient << 8) >> 8;
            if (coefficient != signed24 && coefficient != (coefficient & 0xffffff))
                return new("STOP", "Unsupported signed24 container", true, true);
        }
        return new("MATCH", "446/path0/wire2/count8 coefficient frame; freshness NOT proven", true, true);
    }

    public static int Run(IQueryHid hid, TextWriter log, IPollClock? clock = null)
    {
        clock ??= new PollClock(); clock.Start();
        var observations = new List<Observation>();
        var startedUtc = DateTimeOffset.UtcNow;
        var tx = Query(); int sets = 0, gets = 0, code = 7;
        string outcome = "UNEXPECTED_ERROR";
        string? errorDetail = null;
        HidCallResult? setResult = null;
        try
        {
            log.WriteLine("READ ONLY wire2: one446[path0,wire2] SET, bounded GET only; no190/220/mode/reset.");
            log.WriteLine("TX " + Caf346.Hex(tx)); log.Flush();
            sets++; setResult = hid.SetOutputReport(tx);
            log.WriteLine($"SET elapsed_ms={clock.ElapsedMilliseconds} success={setResult.Value.Success} Win32Error={setResult.Value.Win32Error}"); log.Flush();
            if (!setResult.Value.Success) { outcome = "SET_FAILED"; return code; }
            while (gets < MaxGets && clock.ElapsedMilliseconds < BudgetMs)
            {
                long started = clock.ElapsedMilliseconds;
                byte[] rx = new byte[62]; rx[0] = 1; gets++;
                log.WriteLine($"GET {gets} start_ms={started}; invoking"); log.Flush();
                HidCallResult call;
                try { call = hid.GetInputReport(rx); }
                catch (Exception error)
                {
                    observations.Add(new(gets, started, clock.ElapsedMilliseconds, false, 0, Convert.ToBase64String(rx), "STOP", "GET exception: " + error.Message, false, false));
                    log.WriteLine("WIRE2_OBSERVATION_JSON=" + JsonSerializer.Serialize(observations[^1]));
                    log.WriteLine("RX (unconfirmed after exception) " + Caf346.Hex(rx)); throw;
                }
                long elapsed = clock.ElapsedMilliseconds;
                var verdict = call.Success ? Classify(rx) : new Verdict("STOP", "GET failed/disconnected; buffer unconfirmed", false, false);
                if (elapsed >= BudgetMs) verdict = verdict with { Result = "TIMEOUT", Reason = "GET returned after1s budget; not accepted" };
                observations.Add(new(gets, started, elapsed, call.Success, call.Win32Error, Convert.ToBase64String(rx), verdict.Result, verdict.Reason, verdict.EnvelopeMatched, verdict.PathWireMatched));
                log.WriteLine("WIRE2_OBSERVATION_JSON=" + JsonSerializer.Serialize(observations[^1]));
                log.WriteLine($"GET {gets} elapsed_ms={elapsed} success={call.Success} Win32Error={call.Win32Error}\nRX {Caf346.Hex(rx)}\n{verdict.Result}: {verdict.Reason}"); log.Flush();
                if (verdict.Result == "MATCH") { outcome = "MATCHING_FRAME_FRESHNESS_UNVERIFIED"; code = 0; return code; }
                if (verdict.Result != "PENDING") { outcome = verdict.Result; return code; }
                clock.Sleep(IntervalMs);
            }
            outcome = "TIMEOUT"; return code;
        }
        catch (Exception error)
        {
            errorDetail = error.GetType().Name + ": " + error.Message;
            log.WriteLine("STOP unexpected error: " + error.Message); return code;
        }
        finally
        {
            log.WriteLine($"RESULT {outcome}; SET attempts={sets}, GET attempts={gets}; fullReadback=BLOCKED.");
            log.WriteLine("WIRE2_POLL_JSON=" + JsonSerializer.Serialize(new {
                schemaVersion = 1, vendorId = 0x35D8, productId = 0x1496, command = 446, path = 0, wire = 2,
                tx = Convert.ToBase64String(tx), startedUtc, outcome, errorDetail, exitCode = code, sets, gets, setResult,
                elapsedMs = clock.ElapsedMilliseconds, budgetMs = BudgetMs, maxGets = MaxGets,
                freshnessVerified = false, productionEligible = false, observations }));
            log.Flush();
        }
    }
}
