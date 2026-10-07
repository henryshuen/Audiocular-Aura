namespace FreeDspNative;

// M2P manual experiment only. Path1/right semantics remain unverified.
public static class ChannelProbe
{
    public static bool TryOperation(string operation, out int[] paths, out bool restore)
    {
        (paths,restore)=operation switch {
            "M2PApplyPath0" => ([0],false), "M2PRestorePath0" => ([0],true),
            "M2PApplyPath1" => ([1],false), "M2PRestorePath1" => ([1],true),
            "M2PApplyBoth" => ([0,1],false), "M2PRestoreBoth" => ([0,1],true),
            _ => (Array.Empty<int>(),false)
        };
        return paths.Length>0;
    }
    public static byte[] Packet(int path, SafeCoefficients c)
    {
        if(path is not (0 or 1))throw new InvalidOperationException("M2P paths0/1 only");
        return SafeRam.Encode(190,[path,5,c.Gain,..c.Words,0,0,0,0,0]);
    }
    public static int Run(IQueryHid hid,string operation,TextWriter log,List<byte[]> allowed,Func<IPollClock>? clocks=null)
    {
        if(!TryOperation(operation,out var paths,out bool restore))throw new InvalidOperationException("Unknown M2P operation before SET");
        clocks??=()=>new PollClock();
        log.WriteLine($"M2P {operation}: wire5 only; PK400/-12/Q1 or unity; path labels are selectors, not confirmed L/R. No Flash/preamp/90/220/readback.");
        foreach(var (cmd,tx) in new[]{(188,SafeRam.Enable()),(187,SafeRam.Bypass())})
            if(SafeRam.Exchange(hid,cmd,tx,log,clocks(),false) is null)return 7;
        var rate=SafeRam.Exchange(hid,346,Caf346.CreateQuery(),log,clocks(),true);
        if(rate?.SampleHz is not int hz){log.WriteLine("STOP unknown346; no190");return 7;}
        var c=SafeRam.Calculate(hz,restore);
        var packets=paths.Select(path=>(Path:path,Tx:Packet(path,c))).ToArray();
        foreach(var item in packets){
            allowed.Add(item.Tx);
            log.WriteLine($"PATH{item.Path} WIRE5 {(restore?"RESTORE":"APPLY")} BEGIN Hz={hz} Gain={c.Gain} words=[{string.Join(",",c.Words)}]");
            if(SafeRam.Exchange(hid,190,item.Tx,log,clocks(),false,item.Tx) is null){log.WriteLine($"PATH{item.Path} FAIL: STOP partial/unknown; no retry/rollback/automatic restore");return 7;}
            log.WriteLine($"PATH{item.Path} WIRE5 PASS");
        }
        log.WriteLine("M2P PROTOCOL COMPLETE; ear/image observation PENDING; unity is not previous-EQ backup");return 0;
    }
}
