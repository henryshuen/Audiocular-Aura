import {describe,it,expect,vi} from 'vitest';
import ts from 'typescript';
// @ts-expect-error Node VM is used only by offline tests.
import {runInNewContext} from 'node:vm';
import fnSource from '../../src/fn.ts?raw';
import mainSource from '../../src/main.ts?raw';
import peqSource from '../../src/peq.ts?raw';
import {freeDspDefaultBands,normalizeFreeDspEditor} from '../../src/freedsp/editor.ts';
import {isFreeDsp,gainRangeFor,freeDspGainRange} from '../../src/freedsp/capabilities.ts';
import {showFreeDspDeviceState,freeDspUnknown,freeDspStale} from '../../src/freedsp/deviceState.ts';
import {connectFreeDsp,disconnectFreeDsp,getFreeDspSession} from '../../src/freedsp/session.ts';
import capture from './fixtures/henryNineReadback20261009.json';
import {ReadbackSlots} from '../../src/freedsp/readbackSlots.ts';
import {loadReadbackPreview,previewResponse} from '../../src/freedsp/readbackPreview.ts';
import {selectCafDevice} from '../../src/freedsp/webHid.ts';
import {henryM2ADescriptor} from './fixtures/henryM2ADescriptor.ts';
import {freeDspGraphBounds} from '../../src/freedsp/graphScale.ts';
import {nativePeakFloat} from '../../scripts/freedsp/ram-semantics.mjs';
function extract(name:string,source=fnSource){
 const ast=ts.createSourceFile('s.ts',source,ts.ScriptTarget.ES2022,true);
 const node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name)!;
 return ts.transpileModule(node.getText(ast).replace('export ',''),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
}
describe('Final FreeDSP UX: DOM/event/HTTP mocks only; no hardware',()=>{
 it('actual graph response grid expands for nine overlapping bands and A/B comparison',()=>{
  const bands=freeDspDefaultBands().map(b=>({...b,freq:1000,gain:6,q:1}));
  const context={localBands:bands,freeDspPlotBounds:{min:-20,max:9,nonFinite:false},freeDspGraphBounds,nativePeakFloat,isFreeDsp,isExperimentalFreeDspActive:()=>false,
   CONFIG:{padding:40,minFreq:20,maxFreq:20000,gainRange:12},window:{device:{vendorId:0x35d8,productId:0x1496},getComparedEqState:()=>bands.map(b=>({...b,gain:-16}))}};
  runInNewContext(['updateFreeDspGraphBounds','xToFreq','calculateBiquad','getMagnitude'].map(n=>extract(n,peqSource)).join('\n')+'\nupdateFreeDspGraphBounds(800)',context);
  expect(context.freeDspPlotBounds.max).toBeGreaterThan(50);expect(context.freeDspPlotBounds.min).toBeLessThan(-100);
  expect(bands.every(b=>b.gain===6)).toBe(true);
 });
 it('actual CONNECT preserves custom local nine bands, ignores saved device profile name, and DISCONNECT marks stale',async()=>{
  const d={...henryM2ADescriptor,opened:false,open:vi.fn(),close:vi.fn(),sendReport:vi.fn()} as unknown as HIDDevice;
  const nodes=Object.fromEntries(['lastAppliedEqDisplay','freeDspRamStatus','statusBadge'].map(id=>[id,{textContent:'',innerText:'',hidden:true,classList:{add:vi.fn(),remove:vi.fn()}}]));
  const doc={getElementById:(id:string)=>nodes[id]??null};
  const ctx={device:null as HIDDevice|null,connectAttempt:0,freeDspStateStale:false,eqState:freeDspDefaultBands().map(b=>({...b,gain:-3,q:1.2})),globalGainState:0,autoPreampEnabled:false,
   window:{},document:doc,navigator:{hid:{requestDevice:vi.fn(async()=>[d])}},activeDacs:[],VID_AUDIOCULAR:1,VID_SAVITECH_OFFICIAL:2,VID_SAVITECH:3,VID_SAVITECH_ALT:4,VID_COMTRUE:5,VID_FIIO:6,
   isExperimentalFreeDspActive:()=>false,isFreeDsp,selectCafDevice,normalizeFreeDspEditor,showFreeDspDeviceState:(online:boolean)=>showFreeDspDeviceState(online,doc as unknown as Document),
   freeDspReadbackSlots:new ReadbackSlots(),configureFreeDspControlNotes:vi.fn(),previewResponse,loadReadbackPreview:vi.fn(async()=>{}),clearReadbackPreview:vi.fn(),connectFreeDsp:vi.fn(async()=>({})),disconnectFreeDsp:vi.fn(),log:vi.fn(),console:{debug:vi.fn()},localStorage:{getItem:vi.fn(()=> 'Stored nonflat device name'),setItem:vi.fn()},
   identifyConnectedDac:vi.fn(),getProtocol:()=> 'CONEXANT',enableControls:vi.fn(),configureFreeDspUI:(online:boolean)=>{if(online)showFreeDspDeviceState(true,doc as unknown as Document);},
   configurePreampUI:vi.fn(),setupListener:vi.fn(),setLastAppliedEqName:vi.fn(),renderUI:vi.fn(),lastAppliedEqName:'Flat Profile (Default)',t:()=> 'Last applied'};
  const names=['connectToDevice','disconnectDevice','adjustBandsForDevice','updateLastAppliedEqUI'];
  const f=runInNewContext(names.map(n=>extract(n)).join('\n')+'\n({'+names.join(',')+'})',ctx);
  const before=ctx.eqState.map(b=>({...b}));await f.connectToDevice();
  expect(ctx.eqState).toEqual(before);expect(ctx.device).toBe(d);expect(nodes.lastAppliedEqDisplay.textContent).toBe(freeDspUnknown);
  expect(nodes.statusBadge.innerText).toBe('ONLINE');expect(ctx.setLastAppliedEqName).not.toHaveBeenCalled();expect(d.sendReport).not.toHaveBeenCalled();expect(d.open).not.toHaveBeenCalled();
  await f.disconnectDevice();expect(ctx.eqState).toEqual(before);expect(ctx.device).toBeNull();expect(nodes.statusBadge.innerText).toBe('OFFLINE');expect(nodes.lastAppliedEqDisplay.textContent).toBe(freeDspStale);
  await f.connectToDevice();expect(ctx.eqState).toEqual(before);expect(nodes.lastAppliedEqDisplay.textContent).toBe(freeDspUnknown);expect(d.sendReport).not.toHaveBeenCalled();
  const preview={hidden:true,innerHTML:'',style:{display:'none'}};(nodes as any).freeDspReadbackPreview=preview;
  const readback=vi.fn(async()=>capture);(ctx as any).getFreeDspSession=()=>({readback});
  (ctx as any).loadReadbackPreview=async(read:()=>Promise<unknown>,current:()=>boolean,logger:(s:string)=>void)=>loadReadbackPreview(read,current,logger,doc as unknown as Document);
  await f.connectToDevice();expect(readback).toHaveBeenCalledOnce();expect(preview.innerHTML).toBe('');expect(ctx.freeDspReadbackSlots.curve).toHaveLength(257);expect(ctx.eqState).toEqual(before);expect(d.sendReport).not.toHaveBeenCalled();
  readback.mockRejectedValueOnce(new Error('offline read failure'));await f.connectToDevice();expect(ctx.eqState).toEqual(before);expect(ctx.freeDspReadbackSlots.curve).toBeNull();expect(nodes.freeDspRamStatus.textContent).toContain('unavailable');expect(d.sendReport).not.toHaveBeenCalled();

 });
 it('delayed metadata from old CONNECT cannot register over the reconnected session',async()=>{
  let resolveOld!:(r:Response)=>void;let connects=0;
  const fetcher=vi.fn(async(url:unknown)=>String(url).endsWith('/session')?Response.json({token:'A'.repeat(64),mode:'M2S CAF TRANSPORT'}):++connects===1?await new Promise<Response>(r=>{resolveOld=r;}):Response.json({ok:true,exitCode:0,log:'metadata'}));
  vi.stubGlobal('fetch',fetcher);const d={...henryM2ADescriptor,opened:false} as unknown as HIDDevice;
  try{
   const old=connectFreeDsp(d,()=>{});const rejected=expect(old).rejects.toThrow('Stale');
   await vi.waitFor(()=>expect(connects).toBe(1));disconnectFreeDsp(d);
   const current=await connectFreeDsp(d,()=>{});resolveOld(Response.json({ok:true,exitCode:0}));await rejected;
   expect(getFreeDspSession(d)).toBe(current);expect(fetcher.mock.calls.every(([url])=>!/transport/.test(String(url)))).toBe(true);
  }finally{disconnectFreeDsp(d);vi.unstubAllGlobals();}
 });
 it('disconnect while browser handle closes blocks stale metadata initialization',async()=>{
  let finish!:()=>void;const close=vi.fn(()=>new Promise<void>(r=>{finish=r;})),fetcher=vi.fn();
  vi.stubGlobal('fetch',fetcher);const d={...henryM2ADescriptor,opened:true,close} as unknown as HIDDevice;
  try{const p=connectFreeDsp(d,()=>{});const failure=expect(p).rejects.toThrow('Stale');disconnectFreeDsp(d);finish();await failure;expect(fetcher).not.toHaveBeenCalled();expect(()=>getFreeDspSession(d)).toThrow('CONNECT');}
  finally{disconnectFreeDsp(d);vi.unstubAllGlobals();}
 });
 it('cancel/disconnect while chooser is pending prevents an old selection from connecting',async()=>{
  let choose!:(d:HIDDevice[])=>void;const metadata=vi.fn();const d={...henryM2ADescriptor,opened:false} as unknown as HIDDevice;
  const ctx={device:null,connectAttempt:0,activeDacs:[],VID_AUDIOCULAR:1,VID_SAVITECH_OFFICIAL:2,VID_SAVITECH:3,VID_SAVITECH_ALT:4,VID_COMTRUE:5,VID_FIIO:6,
   isExperimentalFreeDspActive:()=>false,isFreeDsp,selectCafDevice,freeDspReadbackSlots:new ReadbackSlots(),configureFreeDspControlNotes:vi.fn(),previewResponse,loadReadbackPreview:vi.fn(async()=>{}),clearReadbackPreview:vi.fn(),connectFreeDsp:metadata,log:vi.fn(),console:{debug:vi.fn()},document:{getElementById:()=>null},navigator:{hid:{requestDevice:()=>new Promise<HIDDevice[]>(r=>{choose=r;})}}};
  const f=runInNewContext(extract('connectToDevice')+extract('disconnectDevice')+'\n({connectToDevice,disconnectDevice})',ctx);
  const p=f.connectToDevice();await f.disconnectDevice();choose([d]);await p;expect(metadata).not.toHaveBeenCalled();expect(ctx.device).toBeNull();
 });
 it('late successful RAM UI response cannot replace the disconnected stale status',async()=>{
  let finish!:(v:boolean)=>void,attempt=0;const status={textContent:''};
  const ctx={getConnectionAttempt:()=>attempt,setFreeDspRamStatus:(s:string)=>{status.textContent=s;},syncToDevice:()=>new Promise<boolean>(r=>{finish=r;}),log:vi.fn()};
  const sync=runInNewContext(extract('syncFreeDspRam',mainSource)+'\nsyncFreeDspRam',ctx);const p=sync();attempt++;status.textContent=freeDspStale;finish(true);await p;expect(status.textContent).toBe(freeDspStale);
 });
 it('actual slider and numeric HTML use exact-device limits; another PID keeps generic±12',()=>{
  for(const [pid,min,max] of [[0x1496,-16,6],[1,-12,12]]){
   const rows:{innerHTML:string}[]=[],strips={children:[],innerHTML:'',appendChild:(n:{innerHTML:string})=>rows.push(n)};
   const ctx={device:{vendorId:0x35d8,productId:pid},getEqState:freeDspDefaultBands,freeDspReadbackSlots:new ReadbackSlots(),configureFreeDspControlNotes:vi.fn(),updateSlotLabel:vi.fn(),isFreeDsp,gainRangeFor,localStorage:{setItem:vi.fn()},globalGainState:0,bassTiltState:0,trebleTiltState:0,manualPreampState:0,
    document:{getElementById:(id:string)=>id==='eqStrips'?strips:null,querySelector:()=>null,createElement:()=>({innerHTML:'',addEventListener:vi.fn()})},
    window:{scrollY:0,scrollTo:vi.fn()},focusedBandIndex:0,DEFAULT_LABELS:Array(9).fill('Band'),t:()=>'',isExperimentalFreeDspActive:()=>false};
   runInNewContext(extract('renderUI')+'\nrenderUI(bands)',{...ctx,bands:freeDspDefaultBands()});expect(rows).toHaveLength(9);
   for(const r of rows){expect(r.innerHTML).toContain(`min="${min}" max="${max}" step="0.1"`);expect(r.innerHTML).toContain(`step="0.1" min="${min}" max="${max}"`);}
  }
 });
 it('real canvas mouse drag clamps FreeDSP−16/+6 while plot defaults−20/+9; generic stays±12',()=>{
  for(const [pid,min,max] of [[0x1496,-20,9],[1,-12,12]]){
   const events=new Map<string,(e:{clientX:number;clientY:number})=>void>(),update=vi.fn();
   const canvas={logicalWidth:800,logicalHeight:400,parentElement:null,getContext:()=>null,getBoundingClientRect:()=>({left:0,top:0,width:800,height:400}),addEventListener:vi.fn()};
   const ctx={canvas:null,ctx:null,localBands:[],onUpdateCallback:null,draggingIndex:0,selectedIndex:null,hoveredIndex:null,
    freeDspPlotBounds:{min:-20,max:9,nonFinite:false},CONFIG:{padding:40,minFreq:20,maxFreq:20000,gainRange:12},isExperimentalFreeDspActive:()=>false,isFreeDsp,gainRangeFor,freeDspGainRange,
    window:{device:{vendorId:0x35d8,productId:pid},addEventListener:(name:string,f:(e:{clientX:number;clientY:number})=>void)=>events.set(name,f)},document:{getElementById:()=>canvas},ResizeObserver:class{},resizeCanvas:vi.fn(),draw:vi.fn(),handleUpdate:update,xToFreq:()=>1000};
   const names=['gainToY','yToGain','isFreeDspGraph','graphBounds','renderPEQ'];const f=runInNewContext(names.map(n=>extract(n,peqSource)).join('\n')+'\n({'+names.join(',')+'})',ctx);
   expect(f.graphBounds()).toMatchObject({min,max});expect(f.gainToY(max,400)).toBe(40);expect(f.gainToY(min,400)).toBe(360);
   f.renderPEQ({},freeDspDefaultBands(),vi.fn());events.get('mousemove')!({clientX:400,clientY:0});expect(update).toHaveBeenLastCalledWith(0,'gain',pid===0x1496?6:12);
   events.get('mousemove')!({clientX:400,clientY:400});expect(update).toHaveBeenLastCalledWith(0,'gain',pid===0x1496?-16:-12);
  }
 });
});
