using System.Text.Json;

namespace FreeDspNative;

// Separate opt-in evidence collection. No mode/rate query or setter, no editor loading.
public static class NineReadbackPolling
{
    public static ReadbackQuery.Request[] Plan() => [
        .. Enumerable.Range(1, 9).Select(w => new ReadbackQuery.Request(446, w, Wire2Polling.QueryFor(446, w))),
        .. Enumerable.Range(1, 9).Select(w => new ReadbackQuery.Request(477, w, Wire2Polling.QueryFor(477, w)))];
    public static bool IsAllowed(byte[] bytes) => Plan().Any(q => q.Bytes.AsSpan().SequenceEqual(bytes));
    public static int Run(IQueryHid hid, TextWriter log, Func<IPollClock>? clocks = null)
    {
        clocks ??= () => new PollClock();
        var records = new List<JsonElement>();
        int code = 7;
        var startedUtc = DateTimeOffset.UtcNow;
        try
        {
            log.WriteLine("FIXED PLAN: 446 path0 wire1..9 then477 band1..9; max18SET, no resend. First failure STOP.");
            foreach (var query in Plan())
            {
                log.WriteLine($"NINE_QUERY_JSON={JsonSerializer.Serialize(new { command = query.Command, wire = query.Wire, startedUtc = DateTimeOffset.UtcNow })}");
                using var tee = new CaptureWriter(log);
                int result = Wire2Polling.RunFor(hid, tee, query.Command, query.Wire, clocks());
                var summary = tee.Summary ?? throw new InvalidOperationException("Missing exchange summary");
                records.Add(summary);
                log.WriteLine("NINE_RECORD_JSON=" + summary.GetRawText()); log.Flush();
                if (result != 0) return code;
                var last = summary.GetProperty("observations").EnumerateArray().Last();
                var words = Caf346.Parse(Convert.FromBase64String(last.GetProperty("RawBase64").GetString()!)).Words;
                log.WriteLine(query.Command == 446 ?
                    $"446 path0 wire{query.Wire}: rawWords=[{string.Join(",", words)}]; source UNKNOWN" :
                    $"477 band{query.Wire}: rateRaw={words[0]} frequencyHz={words[2]} qRaw={words[3]} q={words[3]/256.0} typeRaw={words[4]} gainDb={words[5]}; source UNKNOWN");
            }
            code = 0;
            return code;
        }
        finally
        {
            log.WriteLine("NINE_POLL_JSON=" + JsonSerializer.Serialize(new {
                schemaVersion = 1, vendorId = 0x35D8, productId = 0x1496, startedUtc,
                outcome = code == 0 ? "MATCHING_QUERY_SET_SOURCE_FRESHNESS_UNVERIFIED" : "STOP_INCOMPLETE",
                completeQuerySet = code == 0, path = 0, stereoVerified = false,
                source = "UNKNOWN: RAM/Flash/bank not established", freshnessVerified = false,
                productionEligible = false, fullReadback = "BLOCKED", records })); log.Flush();
        }
    }
    private sealed class CaptureWriter(TextWriter output) : TextWriter
    {
        public override System.Text.Encoding Encoding => output.Encoding;
        public JsonElement? Summary;
        public override void WriteLine(string? value)
        {
            output.WriteLine(value); output.Flush();
            if (value?.StartsWith("WIRE2_POLL_JSON=") == true)
            {
                using var doc = JsonDocument.Parse(value["WIRE2_POLL_JSON=".Length..]);
                Summary = doc.RootElement.Clone();
            }
        }
        public override void Flush() => output.Flush();
    }
}
