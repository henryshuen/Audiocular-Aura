using System.Buffers.Binary;

namespace FreeDspNative;

// Query346 only. No command/word arguments or general purpose packet builder.
public static class Caf346
{
    public const int ReportBytes = 62;
    public const uint Module = 0xB32D2300;

    public static bool IsQueryOperation(string[] args) =>
        args.Length == 1 && args[0] == "query346";

    public static byte[] CreateQuery()
    {
        var bytes = new byte[ReportBytes];
        bytes[0] = 1;
        BinaryPrimitives.WriteUInt32LittleEndian(bytes.AsSpan(2), 13u | (346u << 16));
        BinaryPrimitives.WriteUInt32LittleEndian(bytes.AsSpan(6), Module);
        BinaryPrimitives.WriteInt32LittleEndian(bytes.AsSpan(10), 62);
        return bytes;
    }

    public static CafResponse Parse(byte[] bytes)
    {
        if (bytes.Length != ReportBytes)
            return new(false, $"Expected {ReportBytes} buffer bytes, got {bytes.Length}", null, null,
                null, null, null, null, [], [], null, null);
        uint packed = BinaryPrimitives.ReadUInt32LittleEndian(bytes.AsSpan(2));
        int count = (int)(packed & 0xffff), command = (int)((packed >> 16) & 0x7fff);
        int reply = (int)(packed >> 31);
        uint module = BinaryPrimitives.ReadUInt32LittleEndian(bytes.AsSpan(6));
        var capacity = Enumerable.Range(0, 13)
            .Select(i => BinaryPrimitives.ReadInt32LittleEndian(bytes.AsSpan(10 + 4 * i))).ToArray();
        int[] words = capacity.Take(Math.Min(count, 13)).ToArray();
        var errors = new List<string>();
        if (bytes[0] != 1) errors.Add("Report ID is not 1");
        if (bytes[1] != 0) errors.Add("Prefix high byte is not 0");
        if (reply != 1) errors.Add("Reply bit is not 1");
        if (module != Module) errors.Add("Module is not CTRL");
        if (count > 13) errors.Add("Logical count exceeds capacity13");
        bool valid = errors.Count == 0;
        bool matching = valid && command == 346 && count >= 2;
        int? index = matching ? words[1] : null;
        int? hz = index switch { 4 => 44100, 5 => 48000, 6 => 96000, 7 => 192000, 8 => 384000, _ => null };
        // A matching transport response with unknown index does not prove a known active rate.
        return new(valid, string.Join("; ", errors), bytes[0], bytes[1], packed, count, command,
            reply, words, capacity, module, index) { SampleHz = hz };
    }

    public static string Hex(byte[] bytes) => string.Join(" ", bytes.Select(b => b.ToString("x2")));
}

public sealed record CafResponse(bool Valid, string Reason, int? ReportId, int? PrefixHigh,
    uint? Packed, int? Count, int? Command, int? Reply, int[] Words, int[] CapacityWords,
    uint? Module, int? SampleIndex)
{
    public int? SampleHz { get; init; }
    // Structural CAF validity is separate from satisfaction of Query346.
    public bool Matching346 => Valid && Command == 346 && Count >= 2;
}

public sealed record HidCollection(string Path, ushort VendorId, ushort ProductId, ushort UsagePage,
    ushort Usage, ushort InputBytes, ushort OutputBytes, ushort FeatureBytes, string? InspectionError = null)
{
    public bool IsCaf => InspectionError is null && VendorId == 0x35D8 && ProductId == 0x1496 &&
        UsagePage == 0x0c && Usage == 1 && InputBytes == Caf346.ReportBytes && OutputBytes == Caf346.ReportBytes &&
        System.Text.RegularExpressions.Regex.IsMatch(Path, @"(?:&|#)mi_03(?:&|#)",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);

    public static HidCollection SelectUnique(IEnumerable<HidCollection> collections)
    {
        var all = collections.ToArray();
        if (all.Any(c => c.InspectionError is not null))
            throw new InvalidOperationException("Some matching HID paths could not be inspected. No query sent; cannot establish unique CAF collection.");
        var candidates = all.Where(c => c.IsCaf).ToArray();
        if (candidates.Length != 1)
            throw new InvalidOperationException($"Expected one CAF collection; found {candidates.Length}. No query sent; no alternate-path retry.");
        return candidates[0];
    }
}
