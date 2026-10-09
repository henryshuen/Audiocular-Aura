using System.Text.Json;

namespace FreeDspNative;

// Opt-in evidence capture only. Never called by CONNECT or the HTTP transport.
public static class ReadbackQuery
{
    public sealed record Request(int Command, int Wire, byte[] Bytes);
    public static Request[] Plan() => [new(346, 0, Caf346.CreateQuery()),
        .. Enumerable.Range(1, 9).Select(w => new Request(477, w, SafeRam.Encode(477, [w, .. new int[12]]))),
        .. Enumerable.Range(1, 9).Select(w => new Request(446, w, SafeRam.Encode(446, [0, w, .. new int[11]])))];
    public static bool IsAllowed(byte[] bytes) => Plan().Any(r => r.Bytes.AsSpan().SequenceEqual(bytes));

    public static int Run(IQueryHid hid, TextWriter log, Func<IPollClock>? clocks = null)
    {
        clocks ??= () => new PollClock();
        var records = new List<object>();
        bool complete = false;
        try
        {
            log.WriteLine("READ ONLY: fixed346/477/446 queries; no190/220/90/188/187/reset. No retry. No editor reconstruction.");
            foreach (var query in Plan())
            {
                byte[]? matched = null;
                string? error = null;
                var clock = clocks(); clock.Start();
                log.WriteLine($"QUERY {query.Command} wire{query.Wire} TX {Caf346.Hex(query.Bytes)}"); log.Flush();
                if (!hid.SetOutputReport(query.Bytes).Success) error = "SET failed";
                while (error is null && matched is null)
                {
                    var rx = new byte[62]; rx[0] = 1;
                    if (!hid.GetInputReport(rx).Success) { error = "GET failed"; break; }
                    log.WriteLine("RX " + Caf346.Hex(rx)); log.Flush();
                    var reply = Caf346.Parse(rx);
                    if (!reply.Valid) { error = "Malformed reply: " + reply.Reason; break; }
                    if (reply.Command == query.Command)
                    {
                        int minimum = query.Command == 477 ? 6 : query.Command == 446 ? 8 : 2;
                        if (reply.Count < minimum) error = "Partial logical payload";
                        else if (query.Command == 477 && reply.Words[1] != query.Wire) error = "Wrong/stale477 band";
                        else if (query.Command == 346 && (reply.Words[0] != 62 || reply.SampleHz is null)) error = "Unknown346 rate/key";
                        else matched = rx;
                        break;
                    }
                    clock.Sleep(5);
                    if (clock.ElapsedMilliseconds >= 1000) error = "Wrong-command timeout; no SET resend";
                }
                records.Add(new { command = query.Command, wire = query.Wire, tx = Convert.ToBase64String(query.Bytes),
                    rx = matched is null ? null : Convert.ToBase64String(matched), error,
                    correlationVerified = false });
                // 477 band echo rejects different slots, but same-slot freshness is not proven.
                // 446 has no source-verified echo/transaction token: cannot certify freshness.
                if (error is not null) { log.WriteLine("STOP: " + error); return 7; }
            }
            complete = true;
            log.WriteLine("QUERY SET COMPLETE; hardware readback/source/stereo/enabled validation PENDING, not production PASS.");
            return 0;
        }
        finally
        {
            log.WriteLine("READBACK_EVIDENCE_JSON=" + JsonSerializer.Serialize(new {
                schemaVersion = 1, vendorId = 0x35D8, productId = 0x1496, completeQuerySet = complete,
                source = "UNKNOWN", productionEligible = false, records }));
            log.Flush();
        }
    }
}
