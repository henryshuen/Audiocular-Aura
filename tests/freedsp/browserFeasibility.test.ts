import {describe,it,expect,vi} from 'vitest';
import ts from 'typescript';
// @ts-expect-error Offline VM only.
import {runInNewContext} from 'node:vm';
import source from '../../src/freedsp/webHid.ts?raw';
import {encodeCaf,parseCaf,CTRL,hex} from '../../src/freedsp/cafCodec.ts';
import {decodeReadbackReply} from '../../src/freedsp/readback.ts';
import {henryM2ADescriptor} from './fixtures/henryM2ADescriptor.ts';
import capture from './fixtures/henryNineReadback20261009.json';
import vectors from './fixtures/nativeM2sVectors.json';
import {buildFlashPlan} from '../../src/freedsp/flash.ts';
import {freeDspDefaultBands} from '../../src/freedsp/editor.ts';
import {isCafDevice} from '../../src/freedsp/webHid.ts';
// Reuse existing bounded event transport in a VM. No production dispatch changes.
const ast=ts.createSourceFile('webHid.ts',source,ts.ScriptTarget.ES2022,true);
const declaration=ast.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='WebHidExchange')!;
const Exchange=runInNewContext(ts.transpileModule(declaration.getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText+'\nWebHidExchange',{parseCaf,CTRL,hex,isCafDevice,rates:[4,5,6,7,8],setTimeout,clearTimeout});
function fake(){let receive:any;const d={...henryM2ADescriptor,opened:true,sendReport:vi.fn(async()=>{}),receiveFeatureReport:vi.fn(),addEventListener:(_s:string,f:any)=>receive=f,removeEventListener:vi.fn()};
 return {d,event:(helper:Uint8Array)=>receive({device:d,reportId:helper[0],data:new DataView(helper.buffer,helper.byteOffset+1,helper.length-1)}),transport:new Exchange(d,()=>{},15)};}
const bytes=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
describe('Browser feasibility: synthetic events/native replay are NOT browser hardware evidence',()=>{
 for(const command of [190,220,446,477] as const)it(`command${command}: host send alone times out, with exactly one Output and no Feature read`,async()=>{
  const f=fake(),query=command===190?bytes(vectors[0].helper).slice(1):command===220?buildFlashPlan(freeDspDefaultBands()).packets[1].data:bytes(capture.records.find(r=>r.command===command&&r.wire===2)!.tx).slice(1);
  await expect(f.transport.exchange(command,query)).rejects.toThrow('TIMEOUT');
  expect(f.d.sendReport).toHaveBeenCalledExactlyOnceWith(1,query);expect(query).toHaveLength(61);expect(f.d.receiveFeatureReport).not.toHaveBeenCalled();f.transport.dispose();
 });
 for(const command of [446,477] as const)it(`command${command}: native captured RX works only when a mock supplies the missing input event`,async()=>{
  const record=capture.records.find(r=>r.command===command&&r.wire===2)!;
  const f=fake(),pending=f.transport.exchange(command,bytes(record.tx).slice(1));
  f.event(bytes(record.observations.at(-1)!.RawBase64));const r=await pending;
  expect(r.command).toBe(command);expect(decodeReadbackReply(bytes(record.observations.at(-1)!.RawBase64),command,2).wire).toBe(2);
  expect(f.d.sendReport).toHaveBeenCalledOnce();f.transport.dispose();
 });
 it('an echoed request is not success; malformed/unrelated events cannot bypass bounded failure',async()=>{
  const f=fake(),request=encodeCaf(446,[0,2]),pending=f.transport.exchange(446,request.data);
  f.event(request.helper);f.event(encodeCaf(477,[2]).helper);
  await expect(pending).rejects.toThrow('TIMEOUT');expect(f.d.sendReport).toHaveBeenCalledOnce();f.transport.dispose();
 });
 it('command-only event matching is insufficient for readback: strict decoder rejects wrong path/wire',()=>{
  const record=capture.records[1],raw=bytes(record.observations.at(-1)!.RawBase64);
  for(const [offset,value] of [[10,1],[14,1]]){const wrong=raw.slice();new DataView(wrong.buffer).setInt32(offset,value,true);expect(()=>decodeReadbackReply(wrong,446,2)).toThrow('path/wire');}
 });
});
