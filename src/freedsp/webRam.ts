import type { Band } from '../main.ts';
import { nativePeakFloat, nativeScaling, officialRateHz } from '../../scripts/freedsp/ram-semantics.mjs';
export type RamAction = 'applyBand' | 'restoreBand' | 'syncNine' | 'restoreNine';
export const uiToWire = (index:number) => {
  if (!Number.isInteger(index) || index<0 || index>8) throw new Error('UI index 必須是0–8');
  return index+1;
};
export function validateBands(value:unknown):Band[] {
  if (!Array.isArray(value) || value.length!==9) throw new Error('必須完整九列；不截斷、不跳過');
  return value.map((b:Band,i)=>{
    if (!b || b.index!==i || b.type!=='PK' || typeof b.enabled!=='boolean' ||
        ![b.freq,b.gain,b.q].every(Number.isFinite) || b.freq<20 || b.freq>20000 || b.gain<-12 || b.gain>0 || b.q<.1 || b.q>10)
      throw new Error(`UI Band${i+1} 無效；僅支持PK、20–20000Hz、−12–0dB、Q0.1–10`);
    return {index:i,freq:b.freq,gain:b.gain,q:b.q,type:'PK',enabled:b.enabled};
  });
}
// Independent offline parity model for the native executor, never a WebHID sender.
export function modelWebBand(b:Band,sampleIndex:number,restore=false) {
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
  const payload=[0,wire,scale.gain,...words,0,0,0,0,0];
  const bytes=new Uint8Array(62),view=new DataView(bytes.buffer);bytes[0]=1;
  view.setUint32(2,0x00be000d,true);view.setUint32(6,0xb32d2300,true);
  payload.forEach((word,i)=>view.setInt32(10+i*4,word,true));
  return {hz,payload,bytes,nativeBitExact:false};
}
export type BridgeReply={ok:boolean;log:string;logPath?:string;exitCode?:number};
export class RamBridge {
  private token=''; private busy=false;
  constructor(private fetcher:typeof fetch=fetch){}
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
    uiToWire(uiIndex);const snapshot=validateBands(bands);
    if(!['applyBand','restoreBand','syncNine','restoreNine'].includes(action))throw new Error('無效action');
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
