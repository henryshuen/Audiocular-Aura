// Official custom Flash layout; one shared coefficient set per rate, NOT RAM path0/1.
import type {Band} from '../main.ts';
import {CTRL,encodeCaf} from './cafCodec.ts';
import type {CafTransport} from './cafRam.ts';
import {validateBands,modelWebBand,unityPreset} from './webRam.ts';

export type FlashPacket={command:90|220;label:string;data:Uint8Array};
export type FlashPlan={editor:Band[];packets:FlashPacket[]};
export const flashTestPreset=():Band[]=>unityPreset().map(b=>({...b,freq:1000,q:1,gain:b.index===4?-6:0}));
export function buildFlashPlan(value:unknown):FlashPlan {
  const editor=validateBands(value); // Entire editor validated before generating any packet.
  const effective=editor.map(b=>({...b,gain:b.enabled?b.gain:0}));
  // Reuse the SAME hardware-validated RAM float/scaling/stability model for all five banks.
  const coefficients=effective.flatMap(b=>[4,5,6,7,8].map(rate=>{
    const model=modelWebBand(b,rate);
    return {command:220 as const,label:`FLASH WIRE${b.index+1} RATE${rate}`,
      data:encodeCaf(220,[rate,b.index+1,...model.payload.slice(2)]).data};
  }));
  const metadata=effective.map(b=>({command:220 as const,label:`FLASH WIRE${b.index+1} METADATA`,
    data:encodeCaf(220,[0,b.index+1,Math.trunc(b.freq),Math.trunc(b.q*256),0,Math.trunc(b.gain),...Array(7).fill(0)]).data}));
  return {editor,packets:[
    {command:90,label:'FLASH SELECT CUSTOM0',data:encodeCaf(90,[90,0,...Array(11).fill(0)]).data},
    ...metadata,...coefficients,
    {command:220,label:'FLASH COMMIT255',data:encodeCaf(220,[255,...Array(12).fill(0)]).data},
  ]};
}
export function saveFlashRecovery(plan:FlashPlan,storage:Pick<Storage,'setItem'>=localStorage){
  // Failure to preserve this exact snapshot blocks ALL writes. Unity is a new explicit save,
  // not rollback/factory reset/readback of the previous persistent profile.
  const unity=buildFlashPlan(unityPreset());
  storage.setItem('aura_freedsp_flash_recovery',JSON.stringify({created:new Date().toISOString(),
    editor:plan.editor,plan:plan.packets.map(p=>({...p,data:[...p.data]})),
    unityEditor:unity.editor,unityPlan:unity.packets.map(p=>({...p,data:[...p.data]}))}));
}
export async function executeFlashPlan(transport:CafTransport,plan:FlashPlan,log:(s:string)=>void){
  if(transport.supportsFlash!==true)throw new Error('FreeDSP Flash requires native Input GET_REPORT transport');
  // Rebuild from the saved editor, not caller-supplied mutable packet arrays.
  const packets=buildFlashPlan(plan.editor).packets;
  let completed=0;
  for(const p of packets){
    log(`${p.label} START (${completed+1}/56)`);
    try{
      const r=await transport.exchange(p.command,p.data);
      if(r.reportId!==1 || r.command!==p.command || r.reply!==1 || r.module!==CTRL || r.count!==0)
        throw new Error('Flash CAF response mismatch');
      completed++;log(`${p.label} PASS (${completed}/56)`);
    }catch(e){
      log(`FLASH STOP: ACKED=${completed}/56; FAILED/UNKNOWN=${p.label}; later requests not sent. Partial persistent state UNKNOWN; no retry/rollback/factory reset. ${String(e)}`);
      throw e;
    }
  }
  log('FreeDSP Flash protocol complete:90 + 55 command220 including COMMIT255 PASS; persistence NOT YET HARDWARE PASS. Full USB power-cycle without RAM Sync is required.');
}
