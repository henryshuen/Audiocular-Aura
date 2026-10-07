import {encodeCaf} from './cafCodec.ts';
import type { Band } from '../main.ts';
import { nativePeakFloat, nativeScaling, officialRateHz } from '../../scripts/freedsp/ram-semantics.mjs';
export type RamAction = 'applyBand' | 'restoreBand' | 'syncNine' | 'restoreNine';
export const fullNinePreset = ():Band[] => [250,400,630,1000,1600,2500,4000,6300,10000].map((freq,index)=>
  ({index,freq,gain:[-3,-4,-5,-6,-7,-8,-9,-10,-12][index],q:1,type:'PK',enabled:true}));
export const unityPreset=():Band[]=>fullNinePreset().map(b=>({...b,gain:0}));
export const positiveBandPreset=():Band[]=>unityPreset().map(b=>b.index===4?{...b,freq:1000,gain:6,q:1}:b);
export const positiveMultiPreset=():Band[]=>unityPreset().map(b=>[1,4,7].includes(b.index)
  ? {...b,freq:({1:250,4:1000,7:4000} as Record<number,number>)[b.index],gain:1,q:1}:b);
export const mixedPreset=():Band[]=>positiveMultiPreset().map(b=>b.index===0?{...b,freq:100,gain:-3,q:1}:b);
export const M2R_GATE_KEY='aura_freedsp_m2r_gate';
export const uiToWire = (index:number) => {
  if (!Number.isInteger(index) || index<0 || index>8) throw new Error('UI index 必須是0–8');
  return index+1;
};
export function validateBands(value:unknown):Band[] {
  if (!Array.isArray(value) || value.length!==9) throw new Error('必須完整九列；不截斷、不跳過');
  return value.map((b:Band,i)=>{
    if (!b || b.index!==i || b.type!=='PK' || typeof b.enabled!=='boolean' ||
        ![b.freq,b.gain,b.q].every(Number.isFinite) || b.freq<20 || b.freq>20000 || b.gain<-12 || b.gain>12 || b.q<.1 || b.q>10)
      throw new Error(`UI Band${i+1} 無效；僅支持PK、20–20000Hz、−12..+12dB、Q0.1–10`);
    return {index:i,freq:b.freq,gain:b.gain,q:b.q,type:'PK',enabled:b.enabled};
  });
}
// Independent offline parity model for the native executor, never a WebHID sender.
export function modelWebBand(b:Band,sampleIndex:number,restore=false,path=0) {
  if(path!==0 && path!==1)throw new Error('M2Q path 必須是0或1');
  validateBands(Array.from({length:9},(_,index)=>({...b,index})));
  const wire=uiToWire(b.index);
  if (!Number.isInteger(sampleIndex) || sampleIndex<4 || sampleIndex>8) throw new Error('未知sample rate；不fallback');
  const hz=officialRateHz[sampleIndex];
  if (b.freq>=hz/2) throw new Error('Nyquist violation');
  const f=restore || !b.enabled ? [1,0,0,0,0] : nativePeakFloat({frequency:b.freq,gainDb:b.gain,q:b.q,sampleHz:hz}).coefficients;
  const scale=nativeScaling(f), words=f.map(c=>Math.round(Math.fround(c*scale.scale)));
  if(words.some(w=>w<-8388608 || w>8388607))throw new Error('signed24 overflow');
  const a1=-words[3]/scale.scale,a2=-words[4]/scale.scale;
  if(!(Math.abs(a2)<1 && 1+a1+a2>0 && 1-a1+a2>0))throw new Error('quantized instability');
  const payload=[path,wire,scale.gain,...words,0,0,0,0,0];
  const bytes=encodeCaf(190,payload).helper;
  return {hz,payload,bytes,nativeBitExact:false};
}
export type BridgeReply={ok:boolean;log:string;logPath?:string;exitCode?:number};
// Quantized native-model response, not the main UI's generic RBJ/tilt/preamp curve.
// Finite grid is an estimate, not a proof of a continuous maximum or firmware headroom.
export function analyzeSafety(value:Band[]){
  const bands=validateBands(value);
  const positiveSumDb=bands.reduce((s,b)=>s+(b.enabled?Math.max(0,b.gain):0),0);
  let peakDb=0;
  for(const rate of [4,5,6,7,8]){
    const models=bands.map(b=>modelWebBand(b,rate));const hz=models[0].hz;
    const frequencies=[0,hz/2,...bands.map(b=>b.freq),...Array.from({length:2049},(_,i)=>20*1000**(i/2048))];
    for(const f of frequencies){
      const w=2*Math.PI*f/hz,c1=Math.cos(w),s1=Math.sin(w),c2=Math.cos(2*w),s2=Math.sin(2*w);
      let db=0;
      for(const m of models){
        const scale=2**(25-m.payload[2]),[b0,b1,b2,p1,p2]=m.payload.slice(3,8).map(v=>v/scale);
        const num=(b0+b1*c1+b2*c2)**2+(b1*s1+b2*s2)**2;
        const den=(1-p1*c1-p2*c2)**2+(p1*s1+p2*s2)**2;
        db+=10*Math.log10(num/den);
      }
      if(!Number.isFinite(db))throw new Error('Nonfinite composite response');
      peakDb=Math.max(peakDb,db);
    }
  }
  return {peakDb,positiveSumDb,allowed:positiveSumDb<=6 && peakDb<=6.1};
}
export class RamBridge {
  private token=''; private busy=false;
  // Native Window.fetch must keep its global receiver when called as this.fetcher().
  constructor(private fetcher:typeof fetch=globalThis.fetch.bind(globalThis)){}
  async connect():Promise<BridgeReply> {
    if(this.busy)throw new Error('BUSY');this.busy=true;
    try{
      const session=await this.fetcher('http://127.0.0.1:5174/session',{cache:'no-store'});
      if(!session.ok)throw new Error('無法連線bridge；使用 .\\scripts\\dev.ps1');
      const info=await session.json() as {token:string;mode:string};
      if(info.mode!=='M2N RAM ONLY' || !/^[A-F0-9]{64}$/.test(info.token))throw new Error('Bridge session mismatch');
      this.token=info.token;try{return await this.post('/connect',null);}catch(e){this.token='';throw e;}
    }finally{this.busy=false;}
  }
  async run(action:RamAction,uiIndex:number,bands:Band[]):Promise<BridgeReply>{
    if(this.busy || !this.token)throw new Error('尚未連線或BUSY');
    uiToWire(uiIndex);
    if(!['applyBand','restoreBand','syncNine','restoreNine'].includes(action))throw new Error('無效action');
    // Explicit unity Restore does not depend on potentially invalid editor values.
    const snapshot=action==='restoreBand' || action==='restoreNine'
      ? unityPreset() : validateBands(bands);
    if(action==='applyBand' || action==='syncNine'){
      const selected=action==='applyBand'?snapshot.map(b=>b.index===uiIndex?b:{...b,gain:0}):snapshot;
      const safety=analyzeSafety(selected);
      if(!safety.allowed)throw new Error(`SAFETY BLOCK: predicted peak ${safety.peakDb.toFixed(2)}dB; positive budget ${safety.positiveSumDb.toFixed(2)}dB exceeds6dB (grid numerical allowance0.1dB); no SET`);
    }
    this.busy=true;try{return await this.post('/ram',{action,uiIndex,bands:snapshot});}finally{this.busy=false;}
  }
  private async post(path:string,body:unknown):Promise<BridgeReply>{
    // Bridge enforces a30s native-child watchdog. Browser timeout is longer; never retries a write.
    const response=await this.fetcher('http://127.0.0.1:5174'+path,{method:'POST',
      headers:{'Content-Type':'application/json','X-AuraPEQ-Session':this.token},body:JSON.stringify(body),signal:AbortSignal.timeout(35000)});
    const result=await response.json() as BridgeReply;
    if(!response.ok || !result.ok)throw new Error(`${result.log || 'Bridge error'}\nLog: ${result.logPath || 'response only'}\n完成狀態可能未知；停止、不重試。`);
    return result;
  }
}
