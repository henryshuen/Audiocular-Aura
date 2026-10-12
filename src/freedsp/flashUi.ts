import type {FlashProgress} from './flash.ts';
export const flashSafetyMessage='Remove your earphones and lower the output volume before saving. A sudden loud sound has been reported after Flash completion. Saving may take about 10–20 seconds. Do not disconnect FreeDSP or close AuraPEQ until it finishes.';
export class FlashSaveGate {
 busy=false;
 async run(context:{snapshot:()=>string|null;confirm:()=>Promise<boolean>;save:(progress:(p:FlashProgress)=>void)=>Promise<unknown>;lock:(busy:boolean)=>void}){
  if(this.busy)return;
  const snapshot=context.snapshot();if(snapshot===null)return;
  this.busy=true;context.lock(true);
  try{
   if(!await context.confirm()||context.snapshot()!==snapshot)return;
   return await context.save(p=>{if(context.snapshot()===snapshot) this.progress?.(p);});
  }finally{this.busy=false;context.lock(false);}
 }
 progress?: (p:FlashProgress)=>void;
}
