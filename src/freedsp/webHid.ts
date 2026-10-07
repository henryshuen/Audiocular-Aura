import type {Band} from '../main.ts';
import {requireMatchingReport} from './descriptor.ts';
import {CTRL,encodeCaf,parseCaf,hex} from './cafCodec.ts';
import {modelWebBand,validateBands,analyzeSafety,unityPreset} from './webRam.ts';
export const isFreeDsp=(d:{vendorId:number;productId:number}|null)=>!!d && d.vendorId===0x35d8 && d.productId===0x1496;
export function isCafDevice(d:HIDDevice){
 if(!isFreeDsp(d))return false;
 try{requireMatchingReport(d,'input',61);requireMatchingReport(d,'output',61);
   return d.collections.some(c=>c.usagePage===12 && c.usage===1 && c.inputReports?.some(r=>r.reportId===1) && c.outputReports?.some(r=>r.reportId===1));
 }catch{return false;}
}
export function selectCafDevice(devices:HIDDevice[]){const candidates=devices.filter(isCafDevice);if(candidates.length!==1)throw new Error(`FreeDSP CAF collection需要唯一匹配；找到${candidates.length}，不猜測其他interface。`);return candidates[0];}
type Command=188|187|346|190;
const rates=[4,5,6,7,8];
export class FreeDspWebHid {
 private pending:{command:Command;sent:boolean;response:ReturnType<typeof parseCaf>|null;resolve:(r:ReturnType<typeof parseCaf>)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}|null=null;
 private busy=false;private stopped=false;private disposed=false;
 private receive=(e:HIDInputReportEvent)=>{
   if(e.device!==this.device)return;this.log(`FreeDSP RX id=${e.reportId} ${hex(new Uint8Array(e.data.buffer,e.data.byteOffset,e.data.byteLength))}`);
   const p=this.pending;if(!p)return;
   try{const r=parseCaf(e.reportId,e.data);if(r.reply!==1 || r.module!==CTRL || r.command!==p.command)return;
     if(p.command===346 && (r.count<2 || !rates.includes(r.words[1])))return;
     // Native write ACKs may have count0. No undocumented echoed fields required.
     if(p.response)return;p.response=r;if(p.sent)this.finish();
   }catch{ /* unrelated/malformed report: retain bounded wait */ }
 };
 constructor(readonly device:HIDDevice,private log:(s:string)=>void,private timeoutMs=2500){if(!isCafDevice(device))throw new Error('Invalid FreeDSP CAF descriptor');device.addEventListener('inputreport',this.receive);}
 private finish(error?:Error){const p=this.pending;if(!p)return;clearTimeout(p.timer);this.pending=null;if(error){this.stopped=true;p.reject(error);}else p.resolve(p.response!);}
 dispose(){this.disposed=true;this.finish(new Error('FreeDSP disconnected；STOP，無重試。'));this.device.removeEventListener('inputreport',this.receive);}
 private exchange(command:Command,data:Uint8Array){
   if(this.disposed || !this.device.opened || this.pending)throw new Error('FreeDSP未open／已disconnect／BUSY');
   return new Promise<ReturnType<typeof parseCaf>>((resolve,reject)=>{
     const timer=setTimeout(()=>this.finish(new Error(`FreeDSP command${command} TIMEOUT：無matching inputreport；WebHID無Input GET_REPORT。STOP，不重試／不宣稱Sync成功。`)),this.timeoutMs);
     const pending={command,sent:false,response:null,resolve,reject,timer};this.pending=pending;
     this.log(`FreeDSP TX command${command} reportId=1 bytes=61 ${hex(data)}`);
     try{void this.device.sendReport(1,data).then(()=>{const p=this.pending;if(p!==pending)return;p.sent=true;if(p.response)this.finish();},e=>{if(this.pending===pending)this.finish(new Error('FreeDSP SEND FAILED: '+String(e)));});}catch(e){this.finish(new Error('FreeDSP SEND FAILED: '+String(e)));}
   });
 }
 async sync(value:Band[],restore=false){
   if(this.busy || this.disposed || (this.stopped && !restore))throw new Error('FreeDSP BUSY／STOP；明確Restore或重新連線，不自動重試。');
   const bands=restore?unityPreset():validateBands(value);
   if(!restore){const s=analyzeSafety(bands);this.log(`FreeDSP每段±12dB；合成峰值估計=${s.peakDb.toFixed(3)}dB 正增益預算=${s.positiveSumDb.toFixed(3)}dB`);if(!s.allowed)throw new Error('FreeDSP硬性阻擋：正增益預算6dB／取樣峰值6.1dB；無Proceed Anyway。');}
   // Snapshot and precompute ALL packets for every known rate before initialization SET.
   const plans=new Map(rates.map(rate=>[rate,bands.flatMap(b=>[0,1].map(path=>({wire:b.index+1,path,report:modelWebBand(b,rate,restore,path).bytes.slice(1)})))]));
   this.busy=true;
   try{
     await this.exchange(188,encodeCaf(188,[1,...Array(12).fill(0)]).data);
     await this.exchange(187,encodeCaf(187,[0]).data);
     const r=await this.exchange(346,encodeCaf(346,[62,...Array(12).fill(0)]).data);
     for(const p of plans.get(r.words[1])!){await this.exchange(190,p.report);this.log(`WIRE${p.wire} ${p.path===0?'LEFT':'RIGHT'} PASS`);}
     this.stopped=false;this.log('FreeDSP RAM protocol complete:18 command190；非readback／非Flash，聽感另行確認。');
   }catch(e){this.stopped=true;this.log('FreeDSP STOP：可能部分完成；無自動retry／rollback。'+String(e));throw e;}finally{this.busy=false;}
 }
}
const sessions=new WeakMap<HIDDevice,FreeDspWebHid>();
export function attachFreeDsp(device:HIDDevice,log:(s:string)=>void){let s=sessions.get(device);if(!s){s=new FreeDspWebHid(device,log);sessions.set(device,s);}return s;}
export function detachFreeDsp(device:HIDDevice){sessions.get(device)?.dispose();sessions.delete(device);}
