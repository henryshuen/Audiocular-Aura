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
  expect(s.status).toContain('hardware enabled unknown');expect(s.status).toContain('Active RAM/stereo unverified');
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
  expect(()=>mismatch.select('B',editor,()=>true)).toThrow('unsupported');expect(mismatch.mode).toBe('Off');
 });
 it('reconnect and failed capture retain A/B and unsaved B, without silently replacing baseline',()=>{
  const s=ready(),a=s.select('A',local(),()=>true)!,b=s.select('B',a,()=>true)!;b[3].gain=-5;s.observe(b);s.disconnect();
  expect(s.curve).toBeNull();expect(s.select('A',b,()=>true)).toEqual(a);s.select('B',a,()=>true);
  const other={...p,bands:p.bands.map(x=>({...x,gainDb:0}))};s.capture(other,previewResponse(other),b);
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
});
