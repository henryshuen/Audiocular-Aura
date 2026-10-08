import {describe,it,expect} from 'vitest';
import {uiToWire,validateBands,modelWebBand,RamBridge,fullNinePreset,positiveBandPreset,positiveMultiPreset,analyzeSafety} from '../../src/freedsp/webRam.ts';
import type {Band} from '../../src/main.ts';
import nativeDebug from '../../tools/freedsp-native/RamDebug.cs?raw';
import page from '../../src/freedsp/ramDebugPage.ts?raw';
import main from '../../src/main.ts?raw';
import stateSource from '../../src/fn.ts?raw';
import dev from '../../scripts/dev.ps1?raw';
const bands=():Band[]=>Array.from({length:9},(_,index)=>({index,freq:400,gain:-12,q:1,type:'PK',enabled:true}));
const response=(json:unknown,status=200)=>new Response(JSON.stringify(json),{status,headers:{'Content-Type':'application/json'}});
function fakeBridge(){
 const calls:{url:string;init?:RequestInit}[]=[];
 let fail=false,hold:Promise<Response>|null=null;
 const fetcher=(async(url:RequestInfo|URL,init?:RequestInit)=>{
   calls.push({url:String(url),init});
   if(String(url).endsWith('/session'))return response({token:'A'.repeat(64),mode:'M2N RAM ONLY'});
   if(hold)return hold;
   return response(fail?{ok:false,log:'STOP partial190',logPath:'temp.log'}:{ok:true,log:'MOCK no hardware'});
 }) as typeof fetch;
 return {bridge:new RamBridge(fetcher),calls,setFail:()=>{fail=true;},setHold:(p:Promise<Response>)=>{hold=p;}};
}
describe('M2N Web/native RAM contract; no physical HID',()=>{
 it('positive coefficients remain finite/stable/representable and identical for both paths',()=>{
   expect(()=>modelWebBand({...bands()[4],gain:12},5)).toThrow('官方App政策');
   for(const gain of [1,3,6])for(const freq of [400,1000,6000])for(const q of [.3,1,4])for(const rate of [4,5,6,7,8]){
     const b={...bands()[4],gain,freq,q};const left=modelWebBand(b,rate,false,0),right=modelWebBand(b,rate,false,1);
     expect(left.payload.slice(1)).toEqual(right.payload.slice(1));
     expect(left.payload.slice(3,8).every(v=>Number.isInteger(v) && v>=-8388608 && v<=8388607)).toBe(true);
   }
 });
 it('composite metrics retain overlap estimate but temporary development cap is removed',async()=>{
   expect(analyzeSafety(positiveBandPreset()).allowed).toBe(true);
   const p2=analyzeSafety(positiveMultiPreset());expect(p2.allowed).toBe(true);expect(p2.positiveSumDb).toBe(3);expect(p2.peakDb).toBeLessThan(3.1);
   const unsafe=fullNinePreset().map(b=>({...b,freq:1000,gain:6}));const safety=analyzeSafety(unsafe);
   expect(safety.allowed).toBe(true);expect(safety.peakDb).toBeGreaterThan(50);
   const f=fakeBridge();await f.bridge.connect();await f.bridge.run('syncNine',0,unsafe);expect(f.calls).toHaveLength(3);
   await f.bridge.run('restoreNine',0,unsafe);expect(f.calls).toHaveLength(4);
 });
 it('explicit Restore ignores invalid editor values and sends only a valid unity snapshot',async()=>{
   const f=fakeBridge();await f.bridge.connect();const b=bands();b[0].gain=-13;b[1].freq=NaN;b[2].q=0;
   for(const action of ['applyBand','syncNine'] as const)await expect(f.bridge.run(action,4,b)).rejects.toThrow();
   expect(f.calls).toHaveLength(2);
   for(const action of ['restoreBand','restoreNine'] as const)await f.bridge.run(action,4,b);
   const bodies=f.calls.slice(2).map(c=>JSON.parse(c.init!.body as string));
   expect(bodies.map(b=>[b.action,b.uiIndex])).toEqual([['restoreBand',4],['restoreNine',4]]);
   for(const body of bodies){expect(validateBands(body.bands)).toHaveLength(9);expect(body.bands.every((b:Band)=>b.gain===0)).toBe(true);}
   expect(b[0].gain).toBe(-13);expect(b[1].freq).toBeNaN();
 });
 it('M2Q pairs18 offline packets and both-pathunity; coefficients differ only bypath',()=>{
   for(const rate of [4,5,6,7,8])for(const restore of [false,true]){
     const models=fullNinePreset().flatMap(b=>[0,1].map(path=>modelWebBand(b,rate,restore,path)));
     expect(models.map(m=>m.payload.slice(0,2))).toEqual(Array.from({length:9},(_,i)=>[[0,i+1],[1,i+1]]).flat());
     for(let i=0;i<18;i+=2){
       expect(models[i].payload.slice(1)).toEqual(models[i+1].payload.slice(1));
       expect(models[i].bytes.slice(14)).toEqual(models[i+1].bytes.slice(14));
       if(restore)expect(models[i].payload.slice(2,8)).toEqual([3,4194304,0,0,0,0]);
     }
   }
   expect(()=>modelWebBand(bands()[0],5,false,2)).toThrow('path');
   const disabled={...bands()[0],enabled:false};
   for(const path of [0,1])expect(modelWebBand(disabled,5,false,path).payload.slice(2,8)).toEqual([3,4194304,0,0,0,0]);
 });
 it('M2O distinguishable negative PK preset validates all nine packets at every known rate',()=>{
   const b=validateBands(fullNinePreset());
   expect(b.map(v=>v.freq)).toEqual([250,400,630,1000,1600,2500,4000,6300,10000]);
   expect(b.map(v=>v.gain)).toEqual([-3,-4,-5,-6,-7,-8,-9,-10,-12]);
   for(const rate of [4,5,6,7,8]){
     const models=b.map(v=>modelWebBand(v,rate));
     expect(models.map(m=>m.payload[1])).toEqual([1,2,3,4,5,6,7,8,9]);
     expect(new Set(models.map(m=>m.payload.slice(2,8).join(','))).size).toBe(9);
     expect(b.map(v=>modelWebBand(v,rate,true).payload.slice(2,8))).toEqual(Array(9).fill([3,4194304,0,0,0,0]));
   }
 });
 it('UI0..8 direct raw1..9 mapping; rejects noninteger/out-of-range',()=>{
   expect(Array.from({length:9},(_,i)=>uiToWire(i))).toEqual([1,2,3,4,5,6,7,8,9]);
   for(const i of [-1,9,13,NaN,.5])expect(()=>uiToWire(i)).toThrow();
 });
 it('validates exactly nine rows with matching indices and explicit PK/enabled',()=>{
   expect(validateBands(bands())).toEqual(bands());
   expect(()=>validateBands(bands().slice(1))).toThrow();expect(()=>validateBands([...bands(),bands()[0]])).toThrow();
   for(const b of [{index:1},{type:'LSQ'},{type:'NOTCH'},{enabled:undefined},{freq:NaN},{gain:13},{q:0},{freq:65536}]){
     const state=bands();Object.assign(state[0],b);expect(()=>validateBands(state)).toThrow();
   }
 });
 it('48k negative400PK golden matches fixed native profile;62 bytes includes ID1',()=>{
   const m=modelWebBand(bands()[0],5);expect(m.hz).toBe(48000);
   expect(m.payload).toEqual([0,1,3,4038384,-7961235,3933777,7961236,-3777857,0,0,0,0,0]);
   expect(m.bytes.length).toBe(62);expect(m.bytes[0]).toBe(1);
   expect(new DataView(m.bytes.buffer).getInt32(26,true)).toBe(-7961235);
   expect(new DataView(m.bytes.buffer).getUint32(2,true)).toBe(0x00be000d);
 });
 it('disabled is unity on same slot; all9 iterate with no truncation or duplicates',()=>{
   const b=bands();b[4].enabled=false;
   const models=b.map(v=>modelWebBand(v,5));expect(models.map(m=>m.payload[1])).toEqual([1,2,3,4,5,6,7,8,9]);
   expect(models[4].payload).toEqual([0,5,3,4194304,0,0,0,0,0,0,0,0,0]);
   expect(models.every(m=>m.bytes.length===62 && m.payload.length===13)).toBe(true);
   for(const v of b)expect(modelWebBand(v,5,true).payload[3]).toBe(4194304);
 });
 it('sample rate affects coefficients; no unknown-rate fallback',()=>{
   expect(new Set([4,5,6,7,8].map(i=>modelWebBand(bands()[0],i).payload.join(','))).size).toBe(5);
   for(const i of [0,3,9,NaN])expect(()=>modelWebBand(bands()[0],i)).toThrow();
 });
 it('connect handshake and metadata only; no RAM before explicit action',async()=>{
   const f=fakeBridge();await expect(f.bridge.run('applyBand',0,bands())).rejects.toThrow();expect(f.calls).toHaveLength(0);
   await f.bridge.connect();expect(f.calls.map(c=>c.url.split('/').pop())).toEqual(['session','connect']);
   expect(f.calls[1].init?.headers).toEqual({'Content-Type':'application/json','X-AuraPEQ-Session':'A'.repeat(64)});
 });
 it('UI Band1/5/9 snapshots reach exact action/index; full9 and restore requests preserve all rows',async()=>{
   const f=fakeBridge();await f.bridge.connect();
   for(const i of [0,4,8]){await f.bridge.run('applyBand',i,bands());await f.bridge.run('restoreBand',i,bands());}
   await f.bridge.run('syncNine',0,bands());await f.bridge.run('restoreNine',0,bands());
   const bodies=f.calls.slice(2).map(c=>JSON.parse(c.init!.body as string));
   expect(bodies.map(b=>b.action)).toEqual(['applyBand','restoreBand','applyBand','restoreBand','applyBand','restoreBand','syncNine','restoreNine']);
   expect(bodies.slice(0,6).map(b=>b.uiIndex)).toEqual([0,0,4,4,8,8]);expect(bodies.every(b=>b.bands.length===9)).toBe(true);
 });
 it('invalid data never reaches bridge and a failed write is never retried',async()=>{
   const f=fakeBridge();await f.bridge.connect();const b=bands();b[0].gain=13;
   await expect(f.bridge.run('applyBand',0,b)).rejects.toThrow();expect(f.calls).toHaveLength(2);
   f.setFail();await expect(f.bridge.run('applyBand',0,bands())).rejects.toThrow('STOP partial190');expect(f.calls).toHaveLength(3);
 });
 it('BUSY prevents concurrent duplicate requests',async()=>{
   const f=fakeBridge();await f.bridge.connect();let release!:(r:Response)=>void;
   f.setHold(new Promise(r=>{release=r;}));const pending=f.bridge.run('applyBand',0,bands());
   await expect(f.bridge.run('applyBand',1,bands())).rejects.toThrow('BUSY');expect(f.calls).toHaveLength(3);
   release(response({ok:true,log:'MOCK'}));await pending;
 });
 it('isolated DEV entry and native model have no Flash/old runtime sender',()=>{
   expect(page).toContain('import.meta.env.DEV');expect(page).toContain("location.hostname==='localhost'");
   expect(page).not.toMatch(/syncToDevice|queueRealtimeBandWrite|exchangeCaf|navigator.hid/);
   expect(nativeDebug).not.toMatch(/Encode\((?:90|220)|ReadDevice|FlashTo/);
   expect(main).toContain('./freedsp-ram-debug.html');expect(main).not.toContain("from './freedsp/webRam");
   expect(stateSource).toContain('import.meta.env.DEV && dev.vendorId === 0x35d8 && dev.productId === 0x1496');
   expect(dev).toContain('-WindowStyle Hidden');expect(dev).toContain('Stop-AuraOwnedBridge -OwnedProcess $ownedBridge');
 });
});
