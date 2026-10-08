using System.Buffers.Binary;
using System.Text.Json;
using System.Text.Json.Serialization;
namespace FreeDspNative;
// Minimal primitive: exact CAF SET once + bounded Input GET. No EQ/math/safety/business sequencing.
public sealed record TransportRequest([property:JsonRequired] string Report)
{
 public byte[] Bytes(){
   var b=Convert.FromBase64String(Report);if(b.Length!=62 || b[0]!=1 || b[1]!=0)throw new InvalidOperationException("Expected native62/ID1 CAF framing");
   uint packed=BinaryPrimitives.ReadUInt32LittleEndian(b.AsSpan(2));int cmd=(int)((packed>>16)&0x7fff),count=(int)(packed&0xffff);
   if((packed>>31)!=0 || BinaryPrimitives.ReadUInt32LittleEndian(b.AsSpan(6))!=Caf346.Module || cmd is not (188 or 187 or 346 or 190 or 90 or 220))throw new InvalidOperationException("CAF output allowlist violation; no arbitrary utility");
   int[] w=Enumerable.Range(0,13).Select(i=>BinaryPrimitives.ReadInt32LittleEndian(b.AsSpan(10+i*4))).ToArray();
   bool valid=cmd switch{
     188=>count==13&&w[0]==1&&w.Skip(1).All(v=>v==0),
     187=>count==1&&w.All(v=>v==0),
     346=>count==13&&w[0]==62&&w.Skip(1).All(v=>v==0),
     190=>count==13&&w[0] is 0 or 1&&w[1] is >=1 and <=9&&w[2] is >=0 and <=25&&w.Skip(3).Take(5).All(v=>v>=-8388608&&v<=8388607)&&w.Skip(8).All(v=>v==0),
     90=>count==13&&w[0]==90&&w.Skip(1).All(v=>v==0),
     220=>count==13&&(
       (w[0]==255&&w.Skip(1).All(v=>v==0))||
       (w[0]==0&&w[1] is >=1 and <=9&&w[2] is >=20 and <=20000&&w[3] is >=25 and <=2560&&w[4]==0&&w[5]>=GainPolicy.MinDb&&w[5]<=GainPolicy.MaxDb&&w.Skip(6).All(v=>v==0))||
       (w[0] is >=4 and <=8&&w[1] is >=1 and <=9&&w[2] is >=0 and <=25&&w.Skip(3).Take(5).All(v=>v>=-8388608&&v<=8388607)&&w.Skip(8).All(v=>v==0))),
     _=>false};
   if(!valid)throw new InvalidOperationException("CAF field/packet shape violation");return b;
 }
 public static TransportRequest Parse(string json){var r=JsonSerializer.Deserialize<TransportRequest>(json,new JsonSerializerOptions{PropertyNameCaseInsensitive=true,UnmappedMemberHandling=JsonUnmappedMemberHandling.Disallow})??throw new InvalidOperationException("Missing report");_ = r.Bytes();return r;}
}
public static class TransportExchange
{
 public static int Run(IQueryHid hid,TransportRequest request,TextWriter log,Func<IPollClock>? clocks=null){
   byte[] tx=request.Bytes();int cmd=(int)((BinaryPrimitives.ReadUInt32LittleEndian(tx.AsSpan(2))>>16)&0x7fff);byte[]? received=null;
   var timer=System.Diagnostics.Stopwatch.StartNew();
   var reply=SafeRam.Exchange(hid,cmd,tx,log,(clocks??(()=>new PollClock()))(),cmd==346,cmd is 190 or 90 or 220?tx:null,rx=>received=(byte[])rx.Clone());
   log.WriteLine($"TRANSPORT elapsed_ms={timer.Elapsed.TotalMilliseconds:F3}; SET once / Input GET_REPORT; no PEQ business logic");
   if(reply is null || received is null)return 7;
   log.WriteLine("CAF_NATIVE_REPLY="+Convert.ToBase64String(received));return 0;
 }
}
