import {describe,it,expect,vi} from 'vitest';
import {NativeCafTransport} from '../../src/freedsp/nativeTransport.ts';
import {CafRamSession} from '../../src/freedsp/cafRam.ts';
import {connectFreeDsp,getFreeDspSession,disconnectFreeDsp} from '../../src/freedsp/session.ts';
import {encodeCaf,parseCaf} from '../../src/freedsp/cafCodec.ts';
import {mixedPreset,unityPreset,modelWebBand} from '../../src/freedsp/webRam.ts';
import {henryM2ADescriptor} from './fixtures/henryM2ADescriptor.ts';
import vectors from './fixtures/nativeM2sVectors.json';
const token='A'.repeat(64);
const base64=(b:Uint8Array)=>btoa(String.fromCharCode(...b));
function mock(){
 const reports:Uint8Array[]=[],logs:string[]=[];let fail=0,rate=5,badReply=false;
 const fetcher=vi.fn(async(url:string|URL|Request,init?:RequestInit)=>{
   const path=String(url).split('5174')[1];
   if(path==='/session')return Response.json({token,mode:'M2S CAF TRANSPORT'});
   expect(init?.headers).toMatchObject({'X-AuraPEQ-Session':token});
   if(path==='/connect')return Response.json({ok:true,exitCode:0,log:'metadata only'});
   expect(path).toBe('/transport');const b=Uint8Array.from(atob(JSON.parse(init!.body as string).report),c=>c.charCodeAt(0));reports.push(b);
   const tx=parseCaf(b[0],new DataView(b.buffer,1,61));
   if(fail===reports.length)return Response.json({ok:false,exitCode:7,log:'MOCK GET FAILED'});
   return Response.json({ok:true,exitCode:0,reply:base64(encodeCaf(badReply?90:tx.command,tx.command===346?[62,rate]:[],1).helper)});
 }) as unknown as typeof fetch;
 const t=new NativeCafTransport(s=>logs.push(s),fetcher),c=new CafRamSession(t,s=>logs.push(s));
 return {fetcher,reports,logs,t,c,setFail:(n:number)=>{fail=n;},setRate:(n:number)=>{rate=n;},setBadReply:()=>{badReply=true;}};
}
describe('normal FreeDSP native transport; mocked HTTP only, no hardware',()=>{
 it('valid+6 bands and composite above+6 retain existing packet algorithm; +12 host profile rejected',async()=>{
   const f=mock();await f.t.connect();const b=unityPreset().map(x=>({...x,freq:1000,gain:6,q:1}));await f.c.sync(b);
   expect(f.reports).toHaveLength(21);for(let i=0;i<9;i++)expect([...f.reports[3+i*2]]).toEqual([...modelWebBand(b[i],5,false,0).bytes]);
   await expect(f.c.sync(b.map(x=>({...x,gain:12})))).rejects.toThrow('無效');expect(f.reports).toHaveLength(21);f.c.dispose();
 });
 it('metadata Connect sends no CAF; shared plan sends prerequisites then18 identical stereo packets',async()=>{
   const f=mock();await f.t.connect();expect(f.reports).toHaveLength(0);await f.c.sync(mixedPreset());
   const parsed=f.reports.map(b=>parseCaf(1,new DataView(b.buffer,1,61)));
   expect(parsed.map(r=>r.command)).toEqual([188,187,346,...Array(18).fill(190)]);
   expect(parsed.slice(3).map(r=>r.words.slice(0,2))).toEqual(Array.from({length:9},(_,i)=>[[0,i+1],[1,i+1]]).flat());
   for(let i=0;i<9;i++){expect(parsed[3+i*2].words.slice(2)).toEqual(parsed[4+i*2].words.slice(2));expect([...f.reports[3+i*2]]).toEqual([...modelWebBand(mixedPreset()[i],5,false,0).bytes]);}
   expect(f.logs.at(-1)).toContain('protocol complete');f.c.dispose();
 });
 it('preserves all21 actual native golden vector bytes exactly through primitive framing',async()=>{
   const f=mock();await f.t.connect();for(const v of vectors){const b=Uint8Array.from(atob(v.helper),c=>c.charCodeAt(0));await f.t.exchange(v.command as 188|187|346|190,b.slice(1));expect([...f.reports.at(-1)!]).toEqual([...b]);}f.c.dispose();
 });
 it('normal session closes browser ownership and Restore ignores invalid editor; never browser send/open',async()=>{
   const f=mock();vi.stubGlobal('fetch',f.fetcher);
   const d={...henryM2ADescriptor,opened:true,close:vi.fn(async()=>{}),open:vi.fn(),sendReport:vi.fn()} as unknown as HIDDevice;
   try{await connectFreeDsp(d,()=>{});expect(d.close).toHaveBeenCalledOnce();expect(f.reports).toHaveLength(0);
     const b=mixedPreset();b[0].q=NaN;const before=b.map(x=>({...x}));await getFreeDspSession(d).sync(b,true);
     expect(b).toEqual(before);expect(f.reports.slice(3)).toHaveLength(18);expect(f.reports.slice(3).every(b=>parseCaf(1,new DataView(b.buffer,1,61)).words.slice(3,8).join()==='4194304,0,0,0,0')).toBe(true);
     expect(d.sendReport).not.toHaveBeenCalled();expect(d.open).not.toHaveBeenCalled();disconnectFreeDsp(d);expect(()=>getFreeDspSession(d)).toThrow('CONNECT');
   }finally{disconnectFreeDsp(d);vi.unstubAllGlobals();}
 });
 it('unsafe editor blocks all transport packets; invalid final band blocks before initialization',async()=>{
   const f=mock();await f.t.connect();const b=unityPreset();b[8].gain=13;await expect(f.c.sync(b)).rejects.toThrow('無效');b[8].q=NaN;await expect(f.c.sync(b)).rejects.toThrow();expect(f.reports).toHaveLength(0);f.c.dispose();
 });
 it('unknown current rate stops before190 with no fallback',async()=>{const f=mock();f.setRate(9);await f.t.connect();await expect(f.c.sync(unityPreset())).rejects.toThrow('Unknown');expect(f.reports).toHaveLength(3);f.c.dispose();});
 it('first failure stops without retry/rollback; explicit Restore may recover',async()=>{
   const f=mock();await f.t.connect();f.setFail(5);await expect(f.c.sync(mixedPreset())).rejects.toThrow('STOP');expect(f.reports).toHaveLength(5);
   await expect(f.c.sync(mixedPreset())).rejects.toThrow('STOP');expect(f.reports).toHaveLength(5);expect(f.logs.join()).toContain('WIRE1 LEFT PASS');expect(f.logs.join()).not.toContain('WIRE1 RIGHT PASS');
   f.setFail(0);await f.c.sync([],true);expect(f.reports).toHaveLength(26);f.c.dispose();
 });
 it('HTTP ok without matching CAF is not protocol success',async()=>{const f=mock();await f.t.connect();f.setBadReply();await expect(f.c.sync(unityPreset())).rejects.toThrow('mismatch');expect(f.reports).toHaveLength(1);f.c.dispose();});
 it('wrong module rejects before POST; disposed session never writes',async()=>{
   const f=mock();await f.t.connect();await expect(f.t.exchange(188,encodeCaf(188,[1],0,1,1).data)).rejects.toThrow('TX');expect(f.reports).toHaveLength(0);f.c.dispose();await expect(f.c.sync([],true)).rejects.toThrow();
 });
 it('bounded request timeout aborts and never retries',async()=>{
   vi.useFakeTimers();try{const fetcher=vi.fn((_u:unknown,init:RequestInit)=>new Promise<Response>((_resolve,reject)=>init.signal!.addEventListener('abort',()=>reject(new Error('ABORT')))));
     const t=new NativeCafTransport(()=>{},fetcher as typeof fetch);const failure=expect(t.connect()).rejects.toThrow('ABORT');await vi.advanceTimersByTimeAsync(35001);await failure;expect(fetcher).toHaveBeenCalledOnce();t.dispose();
   }finally{vi.useRealTimers();}
 });
 it('dispose aborts in-flight exchange and stops later writes; HTTP success without exit/reply is rejected',async()=>{
   const f=mock();await f.t.connect();const abort=vi.fn((_u:unknown,init:RequestInit)=>new Promise<Response>((_resolve,reject)=>init.signal!.addEventListener('abort',()=>reject(new Error('DISCONNECT')))));
   // Dedicated adapter with metadata mocks followed by a pending exchange.
   let n=0;const fetcher=((u:unknown,i:RequestInit)=>++n<=2?f.fetcher(u as string,i):abort(u,i)) as typeof fetch;
   const t=new NativeCafTransport(()=>{},fetcher);await t.connect();const c=new CafRamSession(t,()=>{});const pending=c.sync(unityPreset());const failure=expect(pending).rejects.toThrow('DISCONNECT');c.dispose();await failure;expect(abort).toHaveBeenCalledOnce();
   for(const value of [{ok:true,log:'not enough'},{ok:true,exitCode:0}]){
     let calls=0;const g=new NativeCafTransport(()=>{},(async(u,i)=>++calls<=2?f.fetcher(u,i):Response.json(value)) as typeof fetch);await g.connect();await expect(g.exchange(188,encodeCaf(188,[1,...Array(12).fill(0)]).data)).rejects.toThrow();expect(calls).toBe(3);g.dispose();
   }f.c.dispose();
 });
});
