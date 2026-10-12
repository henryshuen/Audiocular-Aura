import {describe,it,expect,vi} from 'vitest';
import {FreeDspWorkspaces} from '../../src/freedsp/workspaces.ts';
import {freeDspDefaultBands} from '../../src/freedsp/editor.ts';
import {validateReadbackPreview,previewResponse,loadReadbackPreview} from '../../src/freedsp/readbackPreview.ts';
import capture from './fixtures/deviceShelfReadback20261012.json';
import {CafRamSession} from '../../src/freedsp/cafRam.ts';
import {NativeCafTransport} from '../../src/freedsp/nativeTransport.ts';
import {encodeCaf} from '../../src/freedsp/cafCodec.ts';
import ts from 'typescript';
// @ts-expect-error Node VM only in offline tests.
import {runInNewContext} from 'node:vm';
import fn from '../../src/fn.ts?raw';
import dsp from '../../src/dsp.ts?raw';
import peq from '../../src/peq.ts?raw';
import main from '../../src/main.ts?raw';
const p=validateReadbackPreview(capture),points=previewResponse(p);
function ready(storage?:any){if(!storage){const m=new Map<string,string>();storage={getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>m.set(k,v)};}const s=new FreeDspWorkspaces(storage);s.capture(p,points,freeDspDefaultBands(),()=>{throw Error('No clean initialization dialog');});return s;}
function extract(name:string,source:string){const ast=ts.createSourceFile('x.ts',source,ts.ScriptTarget.ES2022,true);const n=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name)!;return ts.transpileModule(n.getText(ast).replace('export ',''),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;}
function modelTransport(failAt=0){let n=0;return {supportsFlash:true,dispose:vi.fn(),exchange:vi.fn(async(command:number)=>{if(++n===failAt)throw Error('MOCK FAILED ACK');return {reportId:1,command,reply:1,count:command===346?2:0,module:0xb32d2300,words:command===346?[0,5]:[],capacityWords:[]};})};}
function actualWrites(s:FreeDspWorkspaces,transport=modelTransport()){
 const session=new CafRamSession(transport,vi.fn()),ctx:any={window:{freeDspWorkspaces:s,isFreeDspEditorReadOnly:()=>s.readOnly},getDevice:()=>({}),isFreeDsp:()=>true,getEqState:()=>s.view,getGlobalGainState:()=>0,getAutoPreampEnabled:()=>false,getBassTiltState:()=>0,getTrebleTiltState:()=>0,attachFreeDsp:()=>({sync:(b:any)=>session.sync(b),flash:(b:any)=>session.flash(b,()=>{})}),showSyncing:vi.fn(),hideSyncing:vi.fn(),localStorage:{setItem:vi.fn()},confirm:vi.fn(()=>true),log:vi.fn()};
 const api=runInNewContext(extract('syncToDevice',dsp)+'\n'+extract('flashToFlash',dsp)+'\n({syncToDevice,flashToFlash})',ctx);
 return {api,ctx,transport,session};
}

describe('FreeDSP Edition lifecycle; real capture replay + synthetic writes ONLY',()=>{
 it('CONNECT P automatically initializes immutable ORIGIN, editable A=P, B=9-band defaults without dialog',()=>{
  const s=ready();expect(s.label).toBe('ORIGIN');expect(s.curve).toEqual(points);expect(s.readOnly).toBe(true);
  const origin=s.view;origin[7].gain=0;expect(s.view[7].gain).toBe(-16);
  const a=s.select('A',s.view)!;expect(a.slice(7).map(b=>b.type)).toEqual(['LSQ','HSQ']);expect(s.referenceCurve).toEqual(points);
  expect(s.select('B',a)).toEqual(freeDspDefaultBands());expect(s.details).toContain('not a Flash backup');
 });
 it('edit A to Q, switch B/A; Q retained, ORIGIN P untouched and no initialization confirmations',()=>{
  const s=ready(),a=s.select('A',s.view)!;a[3].gain=-3;s.observe(a);
  const b=s.select('B',a)!;b[0].gain=-2;s.observe(b);expect(s.select('A',b)![3].gain).toBe(-3);
  expect(s.select('Off',s.view)![3].gain).toBe(p.bands[3].gainDb);expect(s.select('B',s.view)![0].gain).toBe(-2);
 });
 it('Origin blocks RAM/Flash and all actual editor/reset/undo entry points before effects',async()=>{
  const s=ready(),f=actualWrites(s);await expect(f.api.syncToDevice(true)).rejects.toThrow('read-only');await expect(f.api.flashToFlash()).rejects.toThrow('read-only');expect(f.ctx.confirm).not.toHaveBeenCalled();expect(f.transport.exchange).not.toHaveBeenCalled();
  for(const name of ['setEQ','setEqState','updateState','resetBand','toggleBandEnabled','undo','redo','resetToDefaults','resetToFlat','loadCustomProfile']){
   const effect=vi.fn(),ctx:any={window:{isFreeDspEditorReadOnly:()=>true},eqState:s.view,confirm:effect,syncToDevice:effect,undoStack:[],redoStack:[]};
   const call=runInNewContext(extract(name,fn)+'\n'+name,ctx);
   if(name==='setEqState')expect(()=>call(freeDspDefaultBands())).toThrow('read-only');else await call(0,'gain',3);
   expect(ctx.eqState).toEqual(s.view);expect(effect).not.toHaveBeenCalled();
  }
 });
 it('actual RAM wrapper + session obtains 18 matching mock ACKs; ORIGIN remains P, revision becomes dirty after edit',async()=>{
  const s=ready(),a=s.select('A',s.view)!;a[3].gain=-3;s.observe(a);const f=actualWrites(s);await f.api.syncToDevice(true);
  expect(f.transport.exchange).toHaveBeenCalledTimes(21);expect(f.ctx.confirm).not.toHaveBeenCalled();expect(s.status).toContain('RAM: EQ A applied');
  a[3].gain=-4;s.observe(a);expect(s.status).toContain('edited since Apply');expect(s.select('Off',a)![3].gain).toBe(p.bands[3].gainDb);
 });
 it('confirmed Flash has 56 mock ACKs including commit; next fresh readback refreshes Origin/A and Flat B safely',async()=>{
  const s=ready(),a=s.select('A',s.view)!;a[3].gain=-3;s.observe(a);const f=actualWrites(s);await f.api.flashToFlash();expect(f.ctx.confirm).not.toHaveBeenCalled();expect(f.transport.exchange).toHaveBeenCalledTimes(56);
  expect(s.status).toContain('Flash save acknowledged');s.disconnect();expect(s.status).toContain('reconnect');
  const q={...p,capturedUtc:'2026-10-12T06:00:00Z',bands:p.bands.map(b=>({...b,gainDb:0}))};s.capture(q,points.map(x=>({...x,db:0})),a,()=>{throw Error('Saved revision is not unsaved');});
  expect(s.view.every(b=>b.gain===0)).toBe(true);expect(s.select('A',s.view)!.every(b=>b.gain===0)).toBe(true);expect(s.select('B',s.view)).toEqual(freeDspDefaultBands());
 });
 it('failed Flash never marks saved/acknowledged; no retry or rollback; Origin and unsaved draft remain',async()=>{
  const s=ready(),a=s.select('A',s.view)!;a[3].gain=-3;s.observe(a);const f=actualWrites(s,modelTransport(12));
  await expect(f.api.flashToFlash()).rejects.toThrow('FAILED ACK');expect(f.transport.exchange).toHaveBeenCalledTimes(12);expect(s.status).toContain('unknown');expect(s.status).not.toContain('acknowledged');expect(s.unsaved).toBe(true);
 });
 it('failed Flash protects even an initially clean attempted profile from silent replacement',async()=>{
  const s=ready();s.select('A',s.view);expect(s.unsaved).toBe(false);const f=actualWrites(s,modelTransport(12));await expect(f.api.flashToFlash()).rejects.toThrow('FAILED ACK');expect(s.unsaved).toBe(true);s.disconnect();const confirm=vi.fn(()=>false);s.capture(p,points,[],confirm);expect(confirm).not.toHaveBeenCalled();
 });
 it('disconnect + reload safely retains unsaved A/B; automatic recovery precedes fresh Origin/A/FlatB',()=>{
  const store=new Map<string,string>(),storage={getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>store.set(k,v)},s=ready(storage);
  const a=s.select('A',s.view)!;a[0].gain=-4;s.observe(a);const b=s.select('B',a)!;b[2].gain=-6;s.observe(b);s.disconnect();expect(s.curve).toBeNull();expect(s.status).toContain('unknown');
  const restored=new FreeDspWorkspaces(storage),confirm=vi.fn(()=>false);restored.capture(p,points,b,confirm);expect(confirm).not.toHaveBeenCalled();expect(restored.select('A',restored.view)![0].gain).toBe(p.bands[0].gainDb);expect(restored.select('B',restored.view)).toEqual(freeDspDefaultBands());const saved=JSON.parse(store.get('aura_custom_profiles')!);expect(saved.map((x:any)=>x.bands[0].gain)).toContain(-4);expect(saved.map((x:any)=>x.bands[2].gain)).toContain(-6);
 });
 it('failed/partial capture cannot fabricate Origin; stale RAM completion after disconnect cannot update claim',()=>{
  const s=ready();s.select('A',s.view);const token=s.begin('ram',s.view);s.disconnect();s.finish(token,true);expect(s.status).toContain('unknown');expect(s.originUnavailable).toBe(true);
  s.select('Off',s.view);expect(s.originUnavailable).toBe(true);expect(s.curve).toBeNull();
  expect(()=>s.capture({...p,bands:p.bands.slice(1)},points,s.view)).toThrow('unavailable');expect(s.curve).toBeNull();
 });
 it('confirmed final commit after disconnect remains acknowledged, without inventing reconnect or new Origin',()=>{
  const s=ready();s.select('A',s.view);const token=s.begin('flash',s.view);s.disconnect();s.finish(token,true);expect(s.status).toContain('acknowledged');expect(s.writable).toBe(false);expect(s.curve).toBeNull();
 });
 it('fresh successful CONNECT supersedes any old Flash callback without replacing its new Origin or status',()=>{
  const s=ready();s.select('A',s.view);const old=s.begin('flash',s.view);s.disconnect();const q={...p,capturedUtc:'2026-10-12T07:00:00Z'};s.capture(q,points,s.view,()=>true);const status=s.status;s.finish(old,true);expect(s.status).toBe(status);expect(s.busy).toBe(false);expect(s.details).toContain(q.capturedUtc);
 });
 it('actual Origin getter returns a detached copy, not mutable module or baseline storage',()=>{
  const s=ready(),state=s.view,get=runInNewContext(extract('getEqState',fn)+'\ngetEqState',{device:{},isFreeDsp:()=>true,freeDspReadbackSlots:s,eqState:state});
  get()[8].gain=0;expect(state[8].gain).toBe(-16);expect(s.view[8].gain).toBe(-16);
  s.disconnect(state);expect(get()).toEqual([]);expect(s.disconnectedDraft).toHaveLength(9);
 });
 it('unrelated unsaved B survives Flash A and reconnect in recovery profiles before Flat B replaces it',()=>{
  const s=ready();s.select('B',s.view);const b=s.view;b[2].gain=-5;s.observe(b);s.select('A',b);const r=s.begin('flash',s.view);s.finish(r,true);s.disconnect();const confirm=vi.fn(()=>false);s.capture(p,points,[],confirm);expect(confirm).not.toHaveBeenCalled();expect(s.select('B',s.view)).toEqual(freeDspDefaultBands());
 });
 it('cached drafts remain local on failed reconnect and cannot reach hardware without a new valid snapshot',async()=>{
  const store=new Map<string,string>(),storage={getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>store.set(k,v)},old=ready(storage);old.select('A',old.view);const a=old.view;a[2].gain=-3;old.observe(a);old.disconnect();
  const s=new FreeDspWorkspaces(storage);expect(s.curve).toBeNull();s.select('A',[]);expect(s.view[2].gain).toBe(-3);const f=actualWrites(s);await expect(f.api.syncToDevice(true)).rejects.toThrow('successful CONNECT');expect(f.transport.exchange).not.toHaveBeenCalled();
 });
 it('a delayed old readback cannot replace a new session snapshot through the actual loader',async()=>{
  const s=ready();let active=true,resolve!:(v:unknown)=>void;const log=vi.fn();
  const pending=loadReadbackPreview(()=>new Promise(r=>resolve=r),()=>active,log,{getElementById:()=>null} as unknown as Document);
  active=false;const q={...p,capturedUtc:'2026-10-12T08:00:00Z'};s.capture(q,points,s.view,()=>true);resolve(capture);const old=await pending;if(old)s.capture(old,previewResponse(old),s.view);
  expect(old).toBeUndefined();expect(log).not.toHaveBeenCalled();expect(s.details).toContain(q.capturedUtc);
 });
 it('explicit Flash executes without a native dialog, preserving editor and requiring 56 ACKs',async()=>{
  const s=ready();s.select('A',s.view);const before=s.view,f=actualWrites(s);f.ctx.confirm.mockReturnValue(false);expect(await f.api.flashToFlash()).toBe(true);expect(f.ctx.confirm).not.toHaveBeenCalled();expect(f.transport.exchange).toHaveBeenCalledTimes(56);expect(s.view).toEqual(before);expect(s.busy).toBe(false);
 });
 it('actual canvas uses raw Origin dashed reference independently from the active editor curve; Origin has no handles',()=>{
  const s=ready(),dash=vi.fn(),stroke=vi.fn(),line=vi.fn(),arc=vi.fn(),c:any={createLinearGradient:()=>({addColorStop:vi.fn()}),beginPath:vi.fn(),moveTo:vi.fn(),lineTo:line,stroke,setLineDash:dash,arc};
  const ctx:any={window:{getFreeDspReadbackCurve:()=>s.curve,getFreeDspOriginCurve:()=>s.referenceCurve,isFreeDspEditorReadOnly:()=>s.readOnly},CONFIG:{padding:1},freqToX:(x:number)=>x,gainToY:(x:number)=>x,xToFreq:()=>1000,localBands:s.view,calculateBiquad:()=>({}),getMagnitude:()=>0};
  const draw=runInNewContext(extract('drawCurve',peq)+'\n'+extract('drawHandles',peq)+'\n({drawCurve,drawHandles})',ctx);draw.drawCurve(c,6,100);draw.drawHandles(c,6,100);expect(stroke).toHaveBeenCalledOnce();expect(arc).not.toHaveBeenCalled();
  s.select('B',s.view);draw.drawCurve(c,6,100);expect(dash).toHaveBeenCalledWith([6,5]);expect(stroke).toHaveBeenCalledTimes(3);
 });
 it('actual button/event/render wiring sets Edition labels and readonly controls; A/B switch without writes',async()=>{
  const s=ready(),buttons:any={},inputs=[{disabled:false}],writes=vi.fn();for(const id of ['btnCompareOff','btnCompareA','btnCompareB','btnSync','btnFlash','btnReset','btnResetFlat','btnImport'])buttons[id]={textContent:id,disabled:false,classList:{remove:vi.fn(),add:vi.fn()},addEventListener(_e:string,f:()=>Promise<void>){this.click=f;}};
  const strips={children:[{}],hidden:false};
  const ctx:any={freeDspReadbackSlots:s,device:{},eqState:s.view,isFreeDsp:()=>true,gainRangeFor:()=>({min:-16,max:6}),refreshStripUI:vi.fn(),document:{getElementById:(id:string)=>id==='eqStrips'?strips:buttons[id]??null,querySelector:()=>null,querySelectorAll:()=>inputs},window:{confirm:vi.fn(()=>{throw Error('No selection dialog');})},localStorage:{setItem:vi.fn()},getEqState:()=>ctx.eqState,configureFreeDspControlNotes:vi.fn(),globalGainState:0,bassTiltState:0,trebleTiltState:0,manualPreampState:0,log:vi.fn(),syncToDevice:writes};
  const api=runInNewContext(['setABCompareState','renderUI','updateSlotLabel','updateLastAppliedEqUI'].map(n=>extract(n,fn)).join('\n')+'\n({renderUI,updateSlotLabel})',ctx);
  const ast=ts.createSourceFile('main.ts',main,ts.ScriptTarget.ES2022,true),events=ast.statements.filter(n=>n.getText(ast).startsWith('const btnCompare')||/^btnCompare.*addEventListener/.test(n.getText(ast))).map(n=>n.getText(ast)).join('\n');runInNewContext(ts.transpileModule(events,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,ctx);
  api.renderUI(ctx.eqState);expect(buttons.btnCompareOff.textContent).toBe('ORIGIN');expect(buttons.btnSync.disabled).toBe(true);expect(inputs[0].disabled).toBe(true);
  await buttons.btnCompareA.click();expect(s.mode).toBe('A');expect(buttons.btnSync.disabled).toBe(false);expect(inputs[0].disabled).toBe(false);await buttons.btnCompareB.click();expect(ctx.eqState).toEqual(freeDspDefaultBands());await buttons.btnCompareOff.click();expect(writes).not.toHaveBeenCalled();
  s.disconnect();api.renderUI(ctx.eqState);expect(strips.hidden).toBe(true);
  buttons.btnCompareA.disabled=true;buttons.btnCompareOff.originalFreeDspI18n='compare_off';ctx.t=()=> 'OFF localized';ctx.isFreeDsp=()=>false;ctx.slotA=null;ctx.slotB=null;ctx.activeSlot='Off';api.updateSlotLabel();api.renderUI(ctx.eqState);expect(strips.hidden).toBe(false);expect(buttons.btnCompareOff.textContent).toBe('OFF localized');expect(buttons.btnCompareA.disabled).toBe(false);expect(buttons.btnCompareOff.title).toBe('');
 });
 it('actual Flash button + dispatcher preserve final ACK through disconnect and never auto-reconnect',async()=>{
  const s=ready();s.select('A',s.view);const a=s.view;a[3].gain=-3;s.observe(a);let device:any={},attempt=0,n=0;
  const t=modelTransport();const exchange=t.exchange.mockImplementation(async(command:number)=>{
   if(++n===56){s.disconnect();device=null;attempt++;f.session.dispose();}
   return {reportId:1,command,reply:1,count:0,module:0xb32d2300,words:[],capacityWords:[]};
  });
  const f=actualWrites(s,t),button:any={disabled:false,addEventListener(_e:string,cb:()=>Promise<void>){this.click=cb;}},status={textContent:'',hidden:true},auto=vi.fn();
  Object.assign(f.ctx,{getDevice:()=>device,isFreeDsp:(d:any)=>!!d,getConnectionAttempt:()=>attempt,document:{getElementById:(id:string)=>id==='btnFlash'?button:status},setFreeDspRamStatus:(v:string)=>status.textContent=v,autoConnectDevice:auto});
  const ast=ts.createSourceFile('main.ts',main,ts.ScriptTarget.ES2022,true),events=ast.statements.filter(node=>node.getText(ast).startsWith('const btnFlash')||/^btnFlash.*addEventListener/.test(node.getText(ast))).map(node=>node.getText(ast)).join('\n');
  runInNewContext(extract('saveFreeDspFlash',main)+'\n'+extract('safeFlashToFlash',main)+'\n'+ts.transpileModule(events,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,f.ctx);
  await button.click();expect(exchange).toHaveBeenCalledTimes(56);expect(f.ctx.confirm).not.toHaveBeenCalled();expect(status.textContent).toContain('Flash save acknowledged');expect(status.hidden).toBe(false);expect(auto).not.toHaveBeenCalled();expect(s.curve).toBeNull();
 });
});

describe('Native final commit disconnect: bounded existing HTTP mock only',()=>{
 for(const valid of [true,false])it(`disconnect in final commit does not abort ACK retrieval; valid=${valid}`,async()=>{
  let resolve!:(r:Response)=>void,signal:AbortSignal|undefined;
  const fetcher=vi.fn(async(url:string|URL|Request,init?:RequestInit)=>{
   if(String(url).endsWith('/session'))return Response.json({token:'A'.repeat(64),mode:'M2S CAF TRANSPORT'});
   if(String(url).endsWith('/connect'))return Response.json({ok:true,exitCode:0});signal=init!.signal as AbortSignal;
   return await new Promise<Response>(r=>resolve=r);
  }) as unknown as typeof fetch;
  const t=new NativeCafTransport(vi.fn(),fetcher);await t.connect();const pending=t.exchange(220,encodeCaf(220,[255,...Array(12).fill(0)]).data);t.dispose();expect(signal!.aborted).toBe(false);
  const reply=encodeCaf(valid?220:190,[],1).helper;resolve(Response.json({ok:true,exitCode:0,reply:btoa(String.fromCharCode(...reply))}));
  if(valid)expect((await pending).command).toBe(220);else await expect(pending).rejects.toThrow('mismatch');await expect(t.exchange(190,encodeCaf(190,[]).data)).rejects.toThrow('disposed');
 });
 it('non-commit exchange still aborts on disconnect',async()=>{
  let signal:AbortSignal|undefined;
  const fetcher=vi.fn(async(url:string|URL|Request,init?:RequestInit)=>{
   if(String(url).endsWith('/session'))return Response.json({token:'A'.repeat(64),mode:'M2S CAF TRANSPORT'});
   if(String(url).endsWith('/connect'))return Response.json({ok:true,exitCode:0});signal=init!.signal as AbortSignal;
   return await new Promise<Response>((_r,reject)=>signal!.addEventListener('abort',()=>reject(Error('MOCK disconnect'))));
  }) as unknown as typeof fetch;
  const t=new NativeCafTransport(vi.fn(),fetcher);await t.connect();const p=t.exchange(346,encodeCaf(346,[62]).data);t.dispose();expect(signal!.aborted).toBe(true);await expect(p).rejects.toThrow('disconnect');
 });
});
