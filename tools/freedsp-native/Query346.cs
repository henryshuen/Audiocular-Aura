namespace FreeDspNative;

public readonly record struct HidCallResult(bool Success, int Win32Error);

public interface IQueryHid : IDisposable
{
    HidCallResult SetOutputReport(byte[] buffer);
    HidCallResult GetInputReport(byte[] buffer);
}

public static class Query346
{
    public static int Run(IQueryHid hid, TextWriter log)
    {
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
        byte[] rx = new byte[Caf346.ReportBytes];
        rx[0] = 1;
        log.WriteLine("GET_INPUT_REPORT: API=HidD_GetInputReport requestedLength=62; invoking once immediately after SET");
        log.Flush();
        var received = hid.GetInputReport(rx);
        log.WriteLine($"GET_INPUT_REPORT: {(received.Success ? "SUCCESS" : "FAILURE")} Win32Error={received.Win32Error}");
        log.WriteLine($"RX (entire buffer; actual transferred length not exposed by HidD API):\n{Caf346.Hex(rx)}");
        if (!received.Success)
        {
            log.WriteLine("Parsed: unavailable; failed-call buffer is not a confirmed response");
            log.WriteLine("RESULT: GET_INPUT_REPORT FAILED");
            log.Flush();
            return 3;
        }
        var response = Caf346.Parse(rx);
        log.WriteLine($"Parsed: reportId={response.ReportId} prefixHigh={response.PrefixHigh} packed=0x{response.Packed:x8}");
        log.WriteLine($"command={response.Command} reply={response.Reply} count={response.Count} module=0x{response.Module:x8}");
        log.WriteLine($"words=[{string.Join(",", response.Words)}] capacityWords=[{string.Join(",", response.CapacityWords)}]");
        log.WriteLine($"sample-rate index={response.SampleIndex?.ToString() ?? "UNKNOWN"} Hz={response.SampleHz?.ToString() ?? "UNKNOWN"}");
        log.WriteLine($"RESULT: {(response.Valid ? "VALID CAF346 RESPONSE" : "GET_INPUT_REPORT SUCCEEDED BUT RESPONSE UNEXPECTED")}");
        if (!response.Valid) log.WriteLine($"Reason: {response.Reason}");
        log.WriteLine("This is a query transport result, not EQ application, listening or Flash persistence proof.");
        log.Flush();
        return response.Valid ? 0 : 4;
    }
}
