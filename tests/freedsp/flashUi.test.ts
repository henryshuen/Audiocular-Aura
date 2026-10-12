import {describe,it,expect,vi} from 'vitest';
import {FlashSaveGate,flashSafetyMessage} from '../../src/freedsp/flashUi.ts';
import {executeFlashPlan,buildFlashPlan,flashTestPreset} from '../../src/freedsp/flash.ts';
import {encodeCaf,parseCaf} from '../../src/freedsp/cafCodec.ts';
const ack=(command:number)=>{const data=encodeCaf(command,[],1).data;return parseCaf(1,new DataView(data.buffer,data.byteOffset,61));};
describe('Flash UI safety and real acknowledgments',()=>{
 it('cancel sends nothing; duplicate intent is blocked while confirmation is pending',async()=>{
  const gate=new FlashSaveGate(),save=vi.fn(),lock=vi.fn();let cancel!:(ok:boolean)=>void;
  const confirm=vi.fn(()=>new Promise<boolean>(r=>cancel=r)),snapshot=()=> 'session A';
  const pending=gate.run({snapshot,confirm,save,lock});
  await gate.run({snapshot,confirm,save,lock});expect(confirm).toHaveBeenCalledOnce();
  cancel(false);await pending;expect(save).not.toHaveBeenCalled();expect(gate.busy).toBe(false);expect(lock.mock.calls).toEqual([[true],[false]]);
 });
 it('changed session/editor while confirming sends nothing',async()=>{
  const gate=new FlashSaveGate(),save=vi.fn();let state='A';
  await gate.run({snapshot:()=>state,confirm:async()=>{state='B';return true;},save,lock:()=>{}});
  expect(save).not.toHaveBeenCalled();
 });
 it('duplicate save intent stays blocked; stale progress is ignored',async()=>{
  const gate=new FlashSaveGate(),progress=vi.fn();gate.progress=progress;let state='A',finish!:()=>void;
  const context={snapshot:()=>state,confirm:async()=>true,lock:()=>{},save:vi.fn(async cb=>{cb({acknowledged:1,total:56});state='B';cb({acknowledged:2,total:56});await new Promise<void>(r=>finish=r);})};
  const pending=gate.run(context);await Promise.resolve();await gate.run(context);expect(context.save).toHaveBeenCalledOnce();expect(progress).toHaveBeenCalledOnce();finish();await pending;
 });
 it('reports ACK progress only; holds at55 until commit acknowledged',async()=>{
  let release!:()=>void;const progress:number[]=[],packets=buildFlashPlan(flashTestPreset());let sends=0;
  const transport={supportsFlash:true,dispose:()=>{},exchange:async(command:number)=>{sends++;if(sends===56)await new Promise<void>(r=>release=r);return ack(command);}};
  const pending=executeFlashPlan(transport,packets,()=>{},p=>progress.push(p.acknowledged));
  for(let n=0;n<60;n++)await Promise.resolve();
  expect(progress).toEqual(Array.from({length:56},(_,n)=>n));release();await pending;
  expect(progress.at(-1)).toBe(56);expect(sends).toBe(56);
 });
 it('timeout at every operation never advances without its ACK or retries',async()=>{
  for(let fail=1;fail<=56;fail++){let sent=0;const progress:number[]=[];
   const transport={supportsFlash:true,dispose:()=>{},exchange:async(command:number)=>{if(++sent===fail)throw Error('timeout');return ack(command);}};
   await expect(executeFlashPlan(transport,buildFlashPlan(flashTestPreset()),()=>{},p=>progress.push(p.acknowledged))).rejects.toThrow('timeout');
   expect(progress.at(-1)).toBe(fail-1);expect(sent).toBe(fail);
  }
 });
 it('observer errors do not change packets, order or ACK requirements',async()=>{
  const plan=buildFlashPlan(flashTestPreset()),bytes:Uint8Array[]=[];
  const transport={supportsFlash:true,dispose:()=>{},exchange:async(command:number,data:Uint8Array)=>{bytes.push(data.slice());return ack(command);}};
  await executeFlashPlan(transport,plan,()=>{},()=>{throw Error('view disposed');});
  expect(bytes).toEqual(plan.packets.map(p=>p.data));
 });
 it('uses English hearing/timing precaution without a restart causality claim',()=>{
  expect(flashSafetyMessage).toContain('Remove your earphones');expect(flashSafetyMessage).toContain('lower the output volume');expect(flashSafetyMessage).toContain('10–20 seconds');expect(flashSafetyMessage).not.toContain('restarts');
 });
});
