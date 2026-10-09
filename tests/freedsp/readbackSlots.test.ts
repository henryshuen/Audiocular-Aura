import {describe,it,expect,vi} from 'vitest';
import ts from 'typescript';
// @ts-expect-error Offline VM harness only.
import {runInNewContext} from 'node:vm';
import {ReadbackSlots,readbackConfirmation} from '../../src/freedsp/readbackSlots.ts';
import {validateReadbackPreview,previewResponse,loadReadbackPreview} from '../../src/freedsp/readbackPreview.ts';
import {freeDspDefaultBands} from '../../src/freedsp/editor.ts';
import capture from './fixtures/henryNineReadback20261009.json';
import fnSource from '../../src/fn.ts?raw';
import peqSource from '../../src/peq.ts?raw';
import mainSource from '../../src/main.ts?raw';
import html from '../../index.html?raw';
const local=()=>freeDspDefaultBands().map(b=>({...b,gain:-3.5,q:1.2}));
const p=validateReadbackPreview(capture);
function ready(){const s=new ReadbackSlots();s.capture(p,previewResponse(p),local());return s;}
function extract(name:string,source:string){const ast=ts.createSourceFile('s.ts',source,ts.ScriptTarget.ES2022,true);const n=ast.statements.find(x=>ts.isFunctionDeclaration(x)&&x.name?.text===name)!;return ts.transpileModule(n.getText(ast).replace('export ',''),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;}
describe('FreeDSP readback local workspace integration — no hardware',()=>{
 it('A is confirmed integer metadata reconstruction with explicitly local ON assumptions',()=>{
  const s=ready(),confirm=vi.fn(()=>true),a=s.select('A',local(),confirm)!;
  expect(confirm).toHaveBeenCalledWith(readbackConfirmation);expect(a.map(b=>b.freq)).toEqual(p.bands.map(b=>b.frequency));
  expect(a.every(b=>b.enabled)).toBe(true);expect(p.bands.every(b=>b.enabled===null)).toBe(true);
  expect(s.details).toContain('Enabled switches are local assumptions');expect(s.details).toContain('active RAM/Flash source');
 });
 it('B copies A, edits independently; OFF keeps snapshots and the original unsaved local editor',()=>{
  const s=ready(),a=s.select('A',local(),()=>true)!,b=s.select('B',a,()=>true)!;
  expect(b).toEqual(a);b[0].gain=-8;s.observe(b);expect(s.select('A',b,()=>true)).toEqual(a);
  expect(s.select('Off',a,()=>true)).toEqual(local());expect(s.select('B',local(),()=>{throw Error('Must not reconfirm');})).toEqual(b);
 });
 it('editing A through any editor entry point detaches B while preserving A',()=>{
  const s=ready(),a=s.select('A',local(),()=>true)!,original=structuredClone(a);a[0].q=4;s.observe(a);
  expect(s.mode).toBe('B');expect(s.select('A',a,()=>true)).toEqual(original);
 });
 it('Cancel preserves editor, curve, mode and source; unavailable/mismatched models never fabricate A',()=>{
  const s=ready(),editor=local(),before=structuredClone(editor),points=s.curve;
  expect(s.select('B',editor,()=>false)).toBeNull();expect(s.curve).toBe(points);expect(s.mode).toBe('Off');expect(editor).toEqual(before);
  expect(()=>new ReadbackSlots().select('A',editor,()=>true)).toThrow('unavailable');
  const mismatch=new ReadbackSlots();mismatch.capture({...p,sameEffectiveModel:Array(9).fill(false)},previewResponse(p),editor);
  const confirm=vi.fn(()=>true);expect(mismatch.select('B',editor,confirm)).toHaveLength(9);expect(confirm).toHaveBeenCalledWith(readbackConfirmation);expect(mismatch.details).toContain('may differ from raw coefficients');
  const unsupported=new ReadbackSlots();unsupported.capture({...p,bands:p.bands.map(b=>({...b,filterTypeRaw:1}))},previewResponse(p),editor);expect(()=>unsupported.select('A',editor,()=>true)).toThrow('unsupported');
 });
 it('reconnect and failed capture retain A/B and unsaved B, without silently replacing baseline',()=>{
  const s=ready(),a=s.select('A',local(),()=>true)!,b=s.select('B',a,()=>true)!;b[3].gain=-5;s.observe(b);s.disconnect();
  expect(s.curve).toBeNull();expect(s.select('A',b,()=>true)).toEqual(a);s.select('B',a,()=>true);
  const other={...p,capturedUtc:'2026-10-09T10:00:00Z',bands:p.bands.map(x=>({...x,gainDb:0}))};s.capture(other,previewResponse(other),b);
  expect(s.curve).toBeNull();expect(s.details).toContain(`Snapshot: ${other.capturedUtc}; A/B baseline: ${p.capturedUtc}`);
  expect(s.select('A',b,()=>true)).toEqual(a);expect(s.select('B',a,()=>true)).toEqual(b);
 });
 it('actual existing canvas draws raw path0 snapshot, hides unrelated local handles and suppresses dragging',()=>{
  const points=previewResponse(p),line=vi.fn(),stroke=vi.fn(),callback=vi.fn();
  const ctx={window:{getFreeDspReadbackCurve:()=>points},CONFIG:{padding:40},freqToX:(x:number)=>x,gainToY:(x:number)=>x,localBands:local(),
   calculateBiquad:()=>{throw Error('Must not fabricate enabled state');},onUpdateCallback:callback};
  const c={createLinearGradient:()=>({addColorStop:vi.fn()}),beginPath:vi.fn(),moveTo:vi.fn(),lineTo:line,stroke};
  const f=runInNewContext(['drawCurve','drawHandles','drawTooltip'].map(n=>extract(n,peqSource)).join('\n')+'\n({drawCurve,drawHandles,drawTooltip})',ctx);
  f.drawCurve(c,800,400);f.drawHandles(c,800,400);f.drawTooltip(c,800,400);expect(line).toHaveBeenCalledTimes(256);expect(stroke).toHaveBeenCalledOnce();expect(callback).not.toHaveBeenCalled();
 });
 it('actual slot handler has zero transport calls for OFF/A/B and Cancel, including keyboard cycle',async()=>{
  const s=ready(),write=vi.fn(),ctx={device:{},isFreeDsp:()=>true,freeDspReadbackSlots:s,eqState:local(),window:{confirm:()=>true},renderUI:vi.fn(),updateSlotLabel:vi.fn(),log:vi.fn(),syncToDevice:write};
  const f=runInNewContext(['setABCompareState','toggleABCompare'].map(n=>extract(n,fnSource)).join('\n')+'\n({setABCompareState,toggleABCompare})',ctx);
  await f.setABCompareState('A');await f.setABCompareState('B');await f.setABCompareState('Off');await f.toggleABCompare();expect(s.mode).toBe('B');expect(write).not.toHaveBeenCalled();
  const cancel={...ctx,eqState:local(),freeDspReadbackSlots:ready(),window:{confirm:()=>false},renderUI:vi.fn()};await runInNewContext(extract('setABCompareState',fnSource)+'\nsetABCompareState("A")',cancel);expect(cancel.renderUI).not.toHaveBeenCalled();expect(cancel.eqState).toEqual(local());
 });
 it('delayed old HTTP readback cannot replace a current snapshot; failure leaves source unavailable',async()=>{
  const nodes={lastAppliedEqDisplay:{textContent:''},freeDspRamStatus:{textContent:''}},doc={getElementById:(id:string)=>nodes[id as keyof typeof nodes]??null} as unknown as Document;
  let done!:(x:unknown)=>void,current=true;
  const stale=loadReadbackPreview(()=>new Promise(r=>done=r),()=>current,()=>{},doc);current=false;done(capture);expect(await stale).toBeUndefined();expect(nodes.freeDspRamStatus.textContent).toBe('');
  expect(await loadReadbackPreview(async()=>{throw Error('disconnect');},()=>true,()=>{},doc)).toBeUndefined();expect(nodes.freeDspRamStatus.textContent).toContain('unavailable');
 });
 it('English copy and existing layout only; development link and duplicate preview are removed',()=>{
  expect(readbackConfirmation).not.toMatch(/[\u3400-\u9fff]/);expect(ready().status).not.toMatch(/[\u3400-\u9fff]/);
  expect(html).not.toContain('freeDspReadbackPreview');expect(mainSource).not.toContain('freedsp-ram-debug.html');
  for(const id of ['btnCompareOff','btnCompareA','btnCompareB'])expect(html).toContain(id);
 });
 it('real click wiring, slot handler, renderUI and canvas draw stay coherent across snapshot/OFF/A/B',async()=>{
  const s=new ReadbackSlots(),points=previewResponse(p),writes=vi.fn(),paths:number[][]=[];
  const buttons=Object.fromEntries(['btnCompareOff','btnCompareA','btnCompareB'].map(id=>[id,{click:()=>Promise.resolve(),classList:{add:vi.fn(),remove:vi.fn()},addEventListener:(_name:string,f:()=>Promise<void>)=>{buttons[id].click=f;}}]));
  const status={textContent:'',title:''},badge={textContent:''};
  const c={createLinearGradient:()=>({addColorStop:vi.fn()}),beginPath:()=>paths.push([]),moveTo:(_x:number,y:number)=>paths.at(-1)!.push(y),lineTo:(_x:number,y:number)=>paths.at(-1)!.push(y),stroke:vi.fn(),setLineDash:vi.fn()};
  const canvas={listenersBound:true,getContext:()=>c};
  const ctx:any={device:{vendorId:0x35d8,productId:0x1496},isFreeDsp:()=>true,freeDspReadbackSlots:s,eqState:local(),localBands:[],window:{confirm:vi.fn(()=>true),alert:vi.fn(),getFreeDspReadbackCurve:()=>s.curve,getComparedEqState:()=>s.compared},
   document:{getElementById:(id:string)=>buttons[id]??(id==='eqCanvas'?canvas:id==='freeDspRamStatus'?status:id==='lastAppliedEqDisplay'?badge:null),querySelector:(q:string)=>q==='.canvas-wrapper-full'?{}:null},
   configureFreeDspControlNotes:vi.fn(),gainRangeFor:()=>({min:-16,max:6}),localStorage:{setItem:vi.fn()},globalGainState:0,bassTiltState:0,trebleTiltState:0,manualPreampState:0,onUpdateCallback:null,canvas:null,ctx:null,
   getEqState:()=>ctx.eqState,log:vi.fn(),syncToDevice:writes,flashToFlash:writes,CONFIG:{padding:40},freqToX:(x:number)=>x,gainToY:(x:number)=>x,xToFreq:(x:number)=>x,calculateBiquad:(b:any)=>b,getMagnitude:(_f:number,b:any[])=>b.reduce((n,x)=>n+x.gain,0)};
  ctx.draw=()=>functions.drawCurve(c,100,100);
  const names=['setABCompareState','renderUI','updateSlotLabel','updateLastAppliedEqUI'];
  const functions=runInNewContext(names.map(n=>extract(n,fnSource)).join('\n')+'\n'+['drawCurve','renderPEQ'].map(n=>extract(n,peqSource)).join('\n')+'\n({renderUI,drawCurve})',ctx);
  const ast=ts.createSourceFile('main.ts',mainSource,ts.ScriptTarget.ES2022,true),events=ast.statements.filter(n=>n.getText(ast).startsWith('const btnCompare')||/^btnCompare.*addEventListener/.test(n.getText(ast))).map(n=>n.getText(ast)).join('\n');
  runInNewContext(ts.transpileModule(events,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,ctx);
  const original=structuredClone(ctx.eqState);s.capture(p,points,ctx.eqState);functions.renderUI(ctx.eqState);
  expect(badge.textContent).toContain('Snapshot');expect(paths.at(-1)).toEqual(points.map(x=>x.db));expect(paths.at(-1)!.some(x=>Math.abs(x)>1)).toBe(true);
  ctx.window.confirm.mockReturnValueOnce(false);await buttons.btnCompareA.click();expect(s.mode).toBe('Off');expect(s.curve).toBe(points);expect(ctx.eqState).toEqual(original);
  await buttons.btnCompareA.click();expect(s.mode).toBe('A');expect(ctx.eqState.map((b:any)=>b.gain)).toEqual(p.bands.map(x=>x.gainDb));expect(s.curve).toBeNull();
  await buttons.btnCompareB.click();ctx.eqState[0].gain=-8;functions.renderUI(ctx.eqState);const edited=structuredClone(ctx.eqState);
  await buttons.btnCompareA.click();expect(ctx.eqState[0].gain).toBe(p.bands[0].gainDb);
  await buttons.btnCompareOff.click();expect(ctx.eqState).toEqual(original);expect(badge.textContent).toContain('Off');
  await buttons.btnCompareB.click();expect(ctx.eqState).toEqual(edited);expect(writes).not.toHaveBeenCalled();
 });
});
