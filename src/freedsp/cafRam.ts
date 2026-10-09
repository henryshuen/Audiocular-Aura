// One PEQ/safety/packet-plan implementation shared by native and diagnostic WebHID transports.
import type {Band} from '../main.ts';
import {freeDspGainRange} from './capabilities.ts';
import {encodeCaf} from './cafCodec.ts';
import type {CafResponse} from './cafCodec.ts';
import {modelWebBand,validateBands,analyzeSafety,unityPreset} from './webRam.ts';
import {buildFlashPlan,executeFlashPlan,saveFlashRecovery} from './flash.ts';
export type CafCommand=188|187|346|190|90|220;
export interface CafTransport{readonly supportsFlash?:boolean;exchange(command:CafCommand,data:Uint8Array):Promise<CafResponse>;readback?():Promise<unknown>;dispose():void;}
const rates=[4,5,6,7,8];
export class CafRamSession {
 private busy=false;private stopped=false;private disposed=false;
 constructor(private transport:CafTransport,private log:(s:string)=>void){}
 dispose(){this.disposed=true;this.transport.dispose();}
 async readback(){
   if(this.busy || this.disposed || !this.transport.readback)throw new Error('FreeDSP readback BUSY/unavailable');
   this.busy=true;
   try{const r=await this.transport.readback();if(this.disposed)throw new Error('Stale readback');return r;}finally{this.busy=false;}
 }
 async flash(value:Band[],save=saveFlashRecovery){
   if(this.busy || this.disposed || this.stopped)throw new Error('FreeDSP BUSY or STOP; Flash cannot retry. Reconnect first.');
   if(this.transport.supportsFlash!==true)throw new Error('Native Flash transport required');
   const plan=buildFlashPlan(value);
   save(plan); // Exact local editor + known unity plan retained before first hardware SET.
   this.log('FLASH snapshot/unity recovery plan saved; RAM state not read back. Metadata gain is integer dB (official truncation); no Tone/Preamp.');
   this.busy=true;
   try{await executeFlashPlan(this.transport,plan,this.log);}catch(e){this.stopped=true;throw e;}finally{this.busy=false;}
 }
 async sync(value:Band[],restore=false){
   if(this.busy || this.disposed || (this.stopped && !restore))throw new Error('FreeDSP BUSY or STOP; explicitly Restore or reconnect. No automatic retry.');
   const bands=restore?unityPreset():validateBands(value);
   if(!restore){const s=analyzeSafety(bands);this.log(`FreeDSP official App policy ${freeDspGainRange.min}..+${freeDspGainRange.max} dB; not a safety guarantee. Estimated combined peak=${s.peakDb.toFixed(3)} dB; positive gain sum=${s.positiveSumDb.toFixed(3)} dB`);}
   // Snapshot and precompute ALL packets for every known rate before initialization SET.
   const plans=new Map(rates.map(rate=>[rate,bands.flatMap(b=>[0,1].map(path=>({wire:b.index+1,path,report:modelWebBand(b,rate,restore,path).bytes.slice(1)})))]));
   this.busy=true;
   try{
     await this.transport.exchange(188,encodeCaf(188,[1,...Array(12).fill(0)]).data);
     await this.transport.exchange(187,encodeCaf(187,[0]).data);
     const r=await this.transport.exchange(346,encodeCaf(346,[62,...Array(12).fill(0)]).data);
     if(!plans.has(r.words[1]))throw new Error("Unknown matching346rate; no fallback/no190");
     for(const p of plans.get(r.words[1])!){await this.transport.exchange(190,p.report);this.log(`WIRE${p.wire} ${p.path===0?'LEFT':'RIGHT'} PASS`);}
     this.stopped=false;this.log('FreeDSP RAM protocol complete: 18 stereo band updates acknowledged. This is not readback or a Flash save.');
   }catch(e){this.stopped=true;this.log('FreeDSP STOP: possibly partially applied; no automatic retry or rollback. '+String(e));throw e;}finally{this.busy=false;}
 }
}
