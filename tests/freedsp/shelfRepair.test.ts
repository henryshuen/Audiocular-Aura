import {describe,it,expect,vi} from 'vitest';
import capture from './fixtures/deviceShelfReadback20261012.json';
import {validateReadbackPreview,previewResponse} from '../../src/freedsp/readbackPreview.ts';
import {ReadbackSlots} from '../../src/freedsp/readbackSlots.ts';
import {freeDspDefaultBands} from '../../src/freedsp/editor.ts';
import {freeDspShelfFloat} from '../../src/freedsp/filterTypes.ts';
import {modelWebBand} from '../../src/freedsp/webRam.ts';
import {buildFlashPlan} from '../../src/freedsp/flash.ts';
import {parseCaf} from '../../src/freedsp/cafCodec.ts';
import {CafRamSession} from '../../src/freedsp/cafRam.ts';
import {nativeScaling,nativeWordIntervals} from '../../scripts/freedsp/ram-semantics.mjs';
import ts from 'typescript';
// @ts-expect-error Offline VM harness only.
import {runInNewContext} from 'node:vm';
import source from '../../src/fn.ts?raw';
const p=validateReadbackPreview(capture);
const editor=()=>freeDspDefaultBands().map(b=>({...b,gain:-3.5}));
function workspace(){const s=new ReadbackSlots();s.capture(p,previewResponse(p),editor());return s;}
const bands=()=>workspace().select('A',editor(),()=>true)!;

describe('device owner 2026-10-12 real nine-band shelf snapshot; offline repair',()=>{
 it('all eighteen actual matching replies decode; source/freshness/stereo/precision remain unknown',()=>{
  expect(p.bands).toHaveLength(9);expect(p.coefficients).toHaveLength(9);
  expect(p.bands.slice(7).map(b=>[b.frequency,b.gainDb,b.q,b.filterTypeRaw])).toEqual([[1800,-16,181/256,1],[1800,-16,181/256,2]]);
  expect(p.fullReadback).toBe('BLOCKED');expect(p.source).toBe('UNVERIFIED');expect(p.sameEffectiveModel.slice(7)).toEqual([true,true]);
  expect(previewResponse(p).some(v=>v.db<-12)).toBe(true);
 });
 it('confirmed A preserves both intentional shelves; B copies and detaches; OFF stays original',()=>{
  const s=workspace(),a=s.select('A',editor(),()=>true)!,b=s.select('B',a,()=>true)!;
  expect(a.slice(7).map(x=>[x.type,x.freq,x.gain,x.q])).toEqual([['LSQ',1800,-16,181/256],['HSQ',1800,-16,181/256]]);
  b[8].gain=-15;s.observe(b);expect(s.select('A',b,()=>true)).toEqual(a);expect(s.select('Off',a,()=>true)).toEqual(editor());
  expect(s.select('B',editor(),()=>true)).toEqual(b);expect(s.draft(b)).toEqual(editor());
 });
 it('cancel and unavailable readback never invent A or modify OFF',()=>{
  const s=workspace(),e=editor(),before=structuredClone(e),curve=s.curve;
  expect(s.select('A',e,()=>false)).toBeNull();expect(s.curve).toBe(curve);expect(s.mode).toBe('Off');expect(e).toEqual(before);
  expect(()=>new ReadbackSlots().select('A',e,()=>true)).toThrow('unavailable');
 });
 it('actual OFF/A/B handler preserves shelf settings with zero transport calls',async()=>{
  const ast=ts.createSourceFile('fn.ts',source,ts.ScriptTarget.ES2022,true),node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='setABCompareState')!;
  const code=ts.transpileModule(node.getText(ast).replace('export ',''),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  const write=vi.fn(),s=workspace(),ctx:any={device:{},isFreeDsp:()=>true,freeDspReadbackSlots:s,eqState:editor(),window:{confirm:()=>true},renderUI:vi.fn(),updateSlotLabel:vi.fn(),log:vi.fn(),syncToDevice:write};
  const select=runInNewContext(code+'\nsetABCompareState',ctx);
  await select('A');expect(ctx.eqState.slice(7).map((b:any)=>b.type)).toEqual(['LSQ','HSQ']);await select('B');await select('Off');expect(ctx.eqState).toEqual(editor());expect(write).not.toHaveBeenCalled();
 });
 it('shelf native float branches fit all ten actual signed24 words within documented neighbor intervals',()=>{
  for(const i of [7,8]){
   const b=bands()[i],f=freeDspShelfFloat(b.type as 'LSQ'|'HSQ',b.freq,b.gain,b.q,48000),s=nativeScaling(f),intervals=nativeWordIntervals(f,s.scale);
   expect(p.coefficients[i].exponentByte).toBe(s.gain);
   for(const [k,w] of p.coefficients[i].coefficients.entries())expect(w>=intervals[k].min&&w<=intervals[k].max).toBe(true);
  }
 });
 it('all captured bands pass unchanged strict Jury/range preflight at five banks, paired equal stereo packets',()=>{
  const before=bands();
  for(const rate of [4,5,6,7,8])for(const b of before){
   const left=modelWebBand(b,rate,false,0),right=modelWebBand(b,rate,false,1);
   expect(left.payload.slice(1)).toEqual(right.payload.slice(1));expect(left.nativeBitExact).toBe(false);
  }
  expect(before).toEqual(bands());
 });
 it('Flash retains type1/2 metadata instead of silently persisting Peak; shape/order/count unchanged',()=>{
  const plan=buildFlashPlan(bands());expect(plan.packets).toHaveLength(56);
  expect(plan.packets.slice(8,10).map(p=>parseCaf(1,new DataView(p.data.buffer,p.data.byteOffset,p.data.byteLength)).words.slice(1,6))).toEqual([[8,1800,181,1,-16],[9,1800,181,2,-16]]);
 });
 it('actual shared RAM session prepares the real shelf profile then sends eighteen paired updates; mocks only',async()=>{
  const exchange=vi.fn(async(command:number)=>({reportId:1,count:command===346?2:0,command,reply:1,module:0xb32d2300,words:command===346?[0,5]:[],capacityWords:[]}));
  const log=vi.fn(),b=bands(),before=structuredClone(b),session=new CafRamSession({exchange,dispose:vi.fn()},log);
  await session.sync(b);expect(exchange).toHaveBeenCalledTimes(21);expect(exchange.mock.calls.slice(0,3).map(c=>c[0])).toEqual([188,187,346]);
  // Runtime calls carry both command and bytes; type annotation retains mocked second argument.
  const calls=exchange.mock.calls as unknown as Array<[number,Uint8Array]>;
  for(let i=0;i<9;i++)for(const path of [0,1]){
   const [command,data]=calls[3+i*2+path];expect(command).toBe(190);expect(data).toEqual(modelWebBand(b[i],5,false,path).bytes.slice(1));
  }
  expect(b).toEqual(before);expect(log.mock.calls.at(-1)?.[0]).toContain('18 stereo band updates acknowledged');
 });
 it('nearest-quantization boundary error reports exact band/rate/words/Jury without any hardware call',async()=>{
  const bad=editor();bad[0]={...bad[0],freq:20,gain:-16,q:.1};
  expect(()=>modelWebBand(bad[0],8)).toThrow(/Band1 PK: 20 Hz, -16 dB, Q=0.1, rateIndex=8.*words=.*1\+a1\+a2=0/);
  const exchange=vi.fn(),session=new CafRamSession({exchange,dispose:vi.fn()},vi.fn());
  await expect(session.sync(bad)).rejects.toThrow('quantized instability');expect(exchange).not.toHaveBeenCalled();expect(bad[0].gain).toBe(-16);
 });
});
