import {describe,it,expect,vi} from 'vitest';
import {freeDspDefaultBands,freeDspEditorGain,normalizeFreeDspEditor} from '../../src/freedsp/editor.ts';
import {isFreeDsp} from '../../src/freedsp/webHid.ts';
import fnSource from '../../src/fn.ts?raw';import mainSource from '../../src/main.ts?raw';import importSource from '../../src/importExport.ts?raw';import helpersSource from '../../src/helpers.ts?raw';import peqSource from '../../src/peq.ts?raw';
import devSource from '../../scripts/dev.ps1?raw';import viteSource from '../../vite.config.ts?raw';
import ts from 'typescript';
// @ts-expect-error Node VM in tests only.
import {runInNewContext} from 'node:vm';
function extract(name:string,source=fnSource){const ast=ts.createSourceFile('s.ts',source,ts.ScriptTarget.ES2022,true);const node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name)!;return ts.transpileModule(node.getText(ast).replace('export ',''),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;}
function editor(){
 const ctx={device:{vendorId:0x35d8,productId:0x1496},eqState:freeDspDefaultBands(),globalGainState:0,bassTiltState:0,trebleTiltState:0,manualPreampState:0,autoPreampEnabled:false,
   isFreeDsp,freeDspDefaultBands,freeDspEditorGain,normalizeFreeDspEditor,log:vi.fn(),window:{},document:{getElementById:()=>null,querySelector:()=>null},localStorage:{setItem:vi.fn()},
   setLastAppliedEqName:vi.fn(),initSlots:vi.fn(),pushHistory:vi.fn(),queueRealtimeBandWrite:vi.fn(),syncToDevice:vi.fn(),setGlobalGain:vi.fn(),updateUndoRedoButtons:vi.fn(),confirm:()=>true,
   undoStack:[] as {eqState:ReturnType<typeof freeDspDefaultBands>;globalGainState:number}[],redoStack:[] as {eqState:ReturnType<typeof freeDspDefaultBands>;globalGainState:number}[],slotA:null,slotB:null,activeSlot:'A',lastAppliedEqName:'test',getProtocol:()=> 'CONEXANT',updateSlotLabel:vi.fn(),t:()=> 'Flat'};
 const names=['getEqState','getDevice','setEqState','setEQ','renderUI','updateState','finishFreeDspLocalReset','resetToFlat','resetToDefaults','undo','redo','setABCompareState','reduceGainsSafely'];
 const f=runInNewContext(names.map(n=>extract(n)).join('\n')+'\n({'+names.join(',')+'})',ctx);
 return {ctx,f};
}
describe('FreeDSP main editor UX; local-only tests',()=>{
 for(const source of ['slider','numeric','graph'])for(const [input,expected] of [[12,12],[-12,-12],[12.1,12],[14,12],[-12.1,-12],[-15,-12]]){
  it(`${source}: ${input} displays and stores ${expected}, no hardware write`,async()=>{
   const {ctx,f}=editor();await f.updateState(4,'gain',source==='numeric'?String(input):input);expect(ctx.eqState[4].gain).toBe(expected);
   const gain={value:''},range={value:''};runInNewContext(extract('refreshStripUI',helpersSource)+'\nrefreshStripUI(eqState,4)',{eqState:ctx.eqState,document:{getElementById:(id:string)=>id==='num-gain-4'?gain:null,querySelector:(s:string)=>s.includes('input[type=range]')?range:null}});
   expect(gain.value).toBe(String(expected));expect(range.value).toBe(String(expected));expect(ctx.queueRealtimeBandWrite).not.toHaveBeenCalled();expect(ctx.syncToDevice).not.toHaveBeenCalled();expect(ctx.log.mock.calls.join()).toContain(input===expected?'':'已夾限');
  });
 }
 it('all real slider/numeric/graph callbacks use updateState; graph bounds remain±12',()=>{
   expect(fnSource).toContain("oninput=\"window.updateState(${i}, 'gain', this.value)\"");expect(fnSource).toContain("onchange=\"window.updateState(${i}, 'gain', this.value);");expect(fnSource).toContain('updateState(index, key, value)');expect(peqSource).toContain('minGain: -12');expect(peqSource).toContain('gainRange: 12');
 });
 for(const input of [12,-12,12.1,14,-12.1,-15])it(`real preset load + render honors visible gain rule for ${input}`,async()=>{
  const {ctx,f}=editor();const bands=freeDspDefaultBands();bands[4].gain=input;
  await runInNewContext(extract('loadProfileFromText',importSource)+'\nloadProfileFromText("fixture","fixture")',{...ctx,...f,parseTextProfile:()=>({bands,globalGain:0}),setGlobalGainState:vi.fn(),updateGlobalGain:vi.fn(),isCompareActive:()=>false,console});
  expect(ctx.eqState[4].gain).toBe(Math.max(-12,Math.min(12,input)));expect(ctx.syncToDevice).not.toHaveBeenCalled();
 });
 it('old undo/redo/Slot snapshots clamp consistently; Slot defaults9 are local states',async()=>{
  const {ctx,f}=editor();const high=freeDspDefaultBands();high[0].gain=14;const low=freeDspDefaultBands();low[0].gain=-15;
  ctx.undoStack=[{eqState:high,globalGainState:0},{eqState:low,globalGainState:0}];await f.undo();expect(ctx.eqState[0].gain).toBe(12);await f.redo();expect(ctx.eqState[0].gain).toBe(-12);
  await f.setABCompareState('B');expect(ctx.eqState.map(b=>b.freq)).toEqual([31,62,125,250,500,1000,2000,4000,8000]);await f.setABCompareState('A');expect(ctx.eqState[0].gain).toBe(-12);await f.setABCompareState('Off');expect(ctx.eqState[0].gain).toBe(-12);expect(ctx.syncToDevice).not.toHaveBeenCalled();
 });
 it('Restore Default Bands = nine enabled PK/Q.7/gain0; Reset Flat preserves structure/disabled values',async()=>{
  const {ctx,f}=editor();ctx.eqState[0]={...ctx.eqState[0],freq:400,q:2,type:'LSQ',gain:-3};ctx.eqState[1]={...ctx.eqState[1],enabled:false,gain:-5};const before=ctx.eqState.map(b=>({...b}));await f.resetToFlat();
  expect(ctx.eqState).toEqual(before.map(b=>({...b,gain:b.enabled?0:b.gain})));await f.resetToDefaults();expect(ctx.eqState).toEqual(freeDspDefaultBands());expect(ctx.syncToDevice).not.toHaveBeenCalled();
 });
 it('other DAC gain setter keeps original behavior',async()=>{const {ctx,f}=editor();ctx.device={vendorId:1,productId:1};f.setEQ(0,'gain',14);expect(ctx.eqState[0].gain).toBe(14);});
 it('other DAC Defaults and Flat preserve original ten-band/reset-and-Sync semantics',async()=>{
  const {ctx,f}=editor();ctx.device={vendorId:1,productId:1};Object.assign(ctx,{defaultEqState:()=>[31,62,125,250,500,1000,2000,4000,8000,16000].map((freq,index)=>({...freeDspDefaultBands()[0],index,freq,q:.75})),resetTiltState:vi.fn()});
  await f.resetToDefaults();expect(ctx.eqState).toHaveLength(10);expect(ctx.eqState[9].freq).toBe(16000);expect(ctx.eqState[0].q).toBe(.75);await f.resetToFlat();expect(ctx.eqState).toHaveLength(10);expect(ctx.eqState.every(b=>b.freq===1000&&b.q===1&&b.type==='PK'&&b.enabled&&b.gain===0)).toBe(true);expect(ctx.syncToDevice).toHaveBeenCalledTimes(2);
 });
 it('nonfinite direct gain is rejected visibly and Auto Reduce stays local without preamp',async()=>{
  const {ctx,f}=editor();await f.updateState(0,'gain','');expect(ctx.eqState[0].gain).toBe(0);expect(ctx.log.mock.calls.join()).toContain('未接受編輯');
  ctx.eqState=ctx.eqState.map(b=>({...b,gain:12}));await f.reduceGainsSafely();expect(ctx.eqState.reduce((n,b)=>n+b.gain,0)).toBeLessThanOrEqual(12.000001);expect(ctx.globalGainState).toBe(0);expect(ctx.syncToDevice).not.toHaveBeenCalled();
 });
 it('warning interrupts FreeDSP Sync until explicit Proceed; shared existing modal is used',async()=>{
  const sync=vi.fn(),warning=vi.fn(),ctx={getDevice:()=>({vendorId:0x35d8,productId:0x1496}),isFreeDsp,window:{isConfigurationUnsafe:()=>true},showSafetyModal:warning,syncFreeDspRam:sync};
  const safe=runInNewContext(extract('safeSyncToDevice',mainSource)+'\nsafeSyncToDevice',ctx);await safe();expect(warning).toHaveBeenCalledWith('sync');expect(sync).not.toHaveBeenCalled();
  const clicks=new Map<string,()=>Promise<void>>();const modalCtx={...ctx,safetyActionPending:'sync' as string|null,closeSafetyModal:()=>{modalCtx.safetyActionPending=null;},document:{getElementById:(id:string)=>({addEventListener:(_e:string,fn:()=>Promise<void>)=>clicks.set(id,fn)})}};
  const listeners=mainSource.slice(mainSource.indexOf('const btnCloseSafetyModal'),mainSource.indexOf('const globalSlider'));
  runInNewContext(ts.transpileModule(listeners,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,modalCtx);await clicks.get('btnSafetyProceed')!();expect(sync).toHaveBeenCalledOnce();expect(modalCtx.safetyActionPending).toBeNull();
  ctx.window.isConfigurationUnsafe=()=>false;await safe();expect(sync).toHaveBeenCalledTimes(2);
 });
 it('canonical clickable dev hostname is localhost, including npm dev',()=>{expect(devSource).toContain('--host localhost --port 5173 --strictPort');expect(viteSource).toContain('host: "localhost", port: 5173, strictPort: true');});
});
