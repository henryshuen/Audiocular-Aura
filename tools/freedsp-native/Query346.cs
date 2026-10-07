namespace FreeDspNative;

public readonly record struct HidCallResult(bool Success, int Win32Error);

public interface IQueryHid : IDisposable
{
    HidCallResult SetOutputReport(byte[] buffer);
    HidCallResult GetInputReport(byte[] buffer);
}

public interface IPollClock
{
    long ElapsedMilliseconds { get; }
    void Start();
    void Sleep(int milliseconds);
}

public sealed class PollClock : IPollClock
{
    private readonly System.Diagnostics.Stopwatch watch = new();
    public long ElapsedMilliseconds => watch.ElapsedMilliseconds;
    public void Start() => watch.Restart();
    public void Sleep(int milliseconds) => Thread.Sleep(milliseconds);
}

public static class Query346
{
    public const int OfficialBudgetMs = 1000;
    public const int OfficialSleepMs = 5;

    public static int Run(IQueryHid hid, TextWriter log, IPollClock? clock = null)
    {
        clock ??= new PollClock();
        byte[] tx = Caf346.CreateQuery();
        log.WriteLine($"TX ({tx.Length} bytes, report ID included):\n{Caf346.Hex(tx)}");
        log.WriteLine("SET_REPORT: API=HidD_SetOutputReport requestedLength=62; invoking once");
        log.Flush();
        var sent = hid.SetOutputReport(tx);
        log.WriteLine($"SET_REPORT: {(sent.Success ? "HOST SET_REPORT SUCCESS" : "FAILURE")} Win32Error={sent.Win32Error}");
        if (!sent.Success)
        {
            log.WriteLine("GET_INPUT_REPORT: NOT ATTEMPTED (SET failed)");
            log.WriteLine("RESULT: HOST SET_REPORT FAILED; TRANSPORT PROOF NOT ESTABLISHED");
            log.Flush();
            return 2;
        }
        log.WriteLine("Polling: initial GET then start1000ms budget; repeated GET then sleep5ms. SET is never resent.");
        log.WriteLine("Diagnostic differences: require matching346 instead of any replybit; stop on GET failure; fresh RX per attempt.");
        int attempts = 0;
        byte[]? first188 = null;
        bool allSame188 = true;
        (HidCallResult call, CafResponse? response) GetOnce()
        {
            byte[] rx = new byte[Caf346.ReportBytes]; rx[0] = 1;
            attempts++;
            log.WriteLine($"GET #{attempts}: API=HidD_GetInputReport requestedLength=62; invoking");
            log.Flush();
            var call = hid.GetInputReport(rx);
            log.WriteLine($"GET #{attempts}: {(call.Success ? "SUCCESS" : "FAILURE")} Win32Error={call.Win32Error}");
            log.WriteLine($"RX #{attempts} (entire buffer; actual transferred length not exposed by HidD API):\n{Caf346.Hex(rx)}");
            if (!call.Success)
            {
                log.WriteLine($"GET #{attempts}: GET FAILED; failed-call buffer is not a confirmed response");
                log.Flush(); return (call, null);
            }
            var response = Caf346.Parse(rx);
            log.WriteLine($"Parsed: reportId={response.ReportId} prefixHigh={response.PrefixHigh} packed=0x{response.Packed:x8}");
            log.WriteLine($"command={response.Command} reply={response.Reply} count={response.Count} module=0x{response.Module:x8}");
            log.WriteLine($"logical words=[{string.Join(",", response.Words)}] capacityWords=[{string.Join(",", response.CapacityWords)}]");
            string classification = response.Matching346 ? "MATCHING CAF346" : response.Valid ? "VALID CAF NON-MATCH" : "INVALID CAF";
            log.WriteLine($"GET #{attempts}: {classification}");
            if (!response.Valid) log.WriteLine($"Reason: {response.Reason}");
            if (response.Valid && response.Command == 188)
            {
                first188 ??= (byte[])rx.Clone();
                allSame188 &= first188.AsSpan().SequenceEqual(rx);
                log.WriteLine("CAF188 explicitly retained in log; NOT the requested346 response; no queue conclusion.");
            }
            else allSame188 = false;
            log.Flush(); return (call, response);
        }

        var current = GetOnce(); // Official initial GET is before its outer elapsed clock.
        clock.Start();
        while (current.call.Success && current.response?.Matching346 != true && clock.ElapsedMilliseconds < OfficialBudgetMs)
        {
            current = GetOnce(); // First repeated GET is immediate; sleep follows the GET.
            if (!current.call.Success) break; // Diagnostic fail-fast; official ignores completion return.
            clock.Sleep(OfficialSleepMs);
        }
        if (!current.call.Success)
        {
            log.WriteLine($"RESULT: GET_INPUT_REPORT FAILED at GET #{attempts}; no retry or SET resend");
            log.Flush(); return 3;
        }
        if (current.response?.Matching346 == true)
        {
            log.WriteLine($"sample-rate raw/index={current.response.SampleIndex} Hz={current.response.SampleHz?.ToString() ?? "UNKNOWN"}");
            log.WriteLine($"RESULT: VALID CAF346 RESPONSE / CAF346 QUERY VERIFIED at GET #{attempts}");
            log.WriteLine("This is query transport proof, not RAM/EQ or Flash persistence proof.");
            log.Flush(); return 0;
        }
        if (allSame188 && first188 is not null)
            log.WriteLine("All successful GETs returned identicalCAF188; report appears retained/stale during this window. FIFO/snapshot owner remains UNKNOWN.");
        log.WriteLine($"RESULT: CAF346 NOT VERIFIED; bounded polling expired, GETs={attempts}, elapsedMs={clock.ElapsedMilliseconds}");
        log.WriteLine("No DSP rejection conclusion; no more GETs, no SET resend or mutation.");
        log.Flush();
        return 4;
    }
}
