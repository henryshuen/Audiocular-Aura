// One PEQ/safety/packet-plan implementation shared by native and diagnostic WebHID transports.
import type {Band} from '../main.ts';
import {encodeCaf} from './cafCodec.ts';
import type {CafResponse} from './cafCodec.ts';
import {modelWebBand,validateBands,analyzeSafety,unityPreset} from './webRam.ts';
export type CafCommand=188|187|346|190;
export interface CafTransport{exchange(command:CafCommand,data:Uint8Array):Promise<CafResponse>;dispose():void;}
const rates=[4,5,6,7,8];
export class CafRamSession {
 private busy=false;private stopped=false;private disposed=false;
 constructor(private transport:CafTransport,private log:(s:string)=>void){}
 dispose(){this.disposed=true;this.transport.dispose();}
 async sync(value:Band[],restore=false){
   if(this.busy || this.disposed || (this.stopped && !restore))throw new Error('FreeDSP BUSY／STOP；明確Restore或重新連線，不自動重試。');
   const bands=restore?unityPreset():validateBands(value);
   if(!restore){const s=analyzeSafety(bands);this.log(`FreeDSP每段±12dB；合成峰值估計=${s.peakDb.toFixed(3)}dB 正增益預算=${s.positiveSumDb.toFixed(3)}dB`);if(!s.allowed)throw new Error('FreeDSP硬性阻擋：正增益預算6dB／取樣峰值6.1dB；無Proceed Anyway。');}
   // Snapshot and precompute ALL packets for every known rate before initialization SET.
   const plans=new Map(rates.map(rate=>[rate,bands.flatMap(b=>[0,1].map(path=>({wire:b.index+1,path,report:modelWebBand(b,rate,restore,path).bytes.slice(1)})))]));
   this.busy=true;
   try{
     await this.transport.exchange(188,encodeCaf(188,[1,...Array(12).fill(0)]).data);
     await this.transport.exchange(187,encodeCaf(187,[0]).data);
     const r=await this.transport.exchange(346,encodeCaf(346,[62,...Array(12).fill(0)]).data);
     if(!plans.has(r.words[1]))throw new Error("Unknown matching346rate; no fallback/no190");
     for(const p of plans.get(r.words[1])!){await this.transport.exchange(190,p.report);this.log(`WIRE${p.wire} ${p.path===0?'LEFT':'RIGHT'} PASS`);}
     this.stopped=false;this.log('FreeDSP RAM protocol complete:18 command190；非readback／非Flash，聽感另行確認。');
   }catch(e){this.stopped=true;this.log('FreeDSP STOP：可能部分完成；無自動retry／rollback。'+String(e));throw e;}finally{this.busy=false;}
 }
}
