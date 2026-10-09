import {ReadbackSlots} from '../../src/freedsp/readbackSlots.ts';
import {describe,it,expect,vi} from 'vitest';
import {freeDspDefaultBands,freeDspEditorGain,normalizeFreeDspEditor} from '../../src/freedsp/editor.ts';
import {isFreeDsp} from '../../src/freedsp/webHid.ts';
import {gainRangeFor,freeDspGainRange} from '../../src/freedsp/capabilities.ts';
import {freeDspOverwriteWarning} from '../../src/freedsp/deviceState.ts';
import fnSource from '../../src/fn.ts?raw';import mainSource from '../../src/main.ts?raw';import importSource from '../../src/importExport.ts?raw';import helpersSource from '../../src/helpers.ts?raw';import peqSource from '../../src/peq.ts?raw';
import devSource from '../../scripts/dev.ps1?raw';import viteSource from '../../vite.config.ts?raw';
import ts from 'typescript';
// @ts-expect-error Node VM in tests only.
import {runInNewContext} from 'node:vm';
function extract(name:string,source=fnSource){const ast=ts.createSourceFile('s.ts',source,ts.ScriptTarget.ES2022,true);const node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name)!;return ts.transpileModule(node.getText(ast).replace('export ',''),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;}
function editor(){
 const ctx={device:{vendorId:0x35d8,productId:0x1496},connectAttempt:0,eqState:freeDspDefaultBands(),globalGainState:0,bassTiltState:0,trebleTiltState:0,manualPreampState:0,autoPreampEnabled:false,
   freeDspReadbackSlots:new ReadbackSlots(),configureFreeDspControlNotes:vi.fn(),isFreeDsp,gainRangeFor,freeDspGainRange,freeDspOverwriteWarning,freeDspDefaultBands,freeDspEditorGain,normalizeFreeDspEditor,log:vi.fn(),window:{},document:{getElementById:()=>null,querySelector:()=>null},localStorage:{setItem:vi.fn()},
   setLastAppliedEqName:vi.fn(),initSlots:vi.fn(),pushHistory:vi.fn(),queueRealtimeBandWrite:vi.fn(),syncToDevice:vi.fn(),setGlobalGain:vi.fn(),updateUndoRedoButtons:vi.fn(),confirm:()=>true,
   undoStack:[] as {eqState:ReturnType<typeof freeDspDefaultBands>;globalGainState:number}[],redoStack:[] as {eqState:ReturnType<typeof freeDspDefaultBands>;globalGainState:number}[],slotA:null,slotB:null,activeSlot:'A',lastAppliedEqName:'test',getProtocol:()=> 'CONEXANT',updateSlotLabel:vi.fn(),t:()=> 'Flat'};
 const names=['getEqState','getDevice','setEqState','setEQ','renderUI','updateState','finishFreeDspLocalReset','resetToFlat','resetToDefaults','undo','redo','setABCompareState','reduceGainsSafely'];
 const f=runInNewContext(names.map(n=>extract(n)).join('\n')+'\n({'+names.join(',')+'})',ctx);
 return {ctx,f};
}
describe('FreeDSP main editor UX; local-only tests',()=>{
 for(const source of ['slider','numeric','graph'])for(const [input,expected] of [[6,6],[-16,-16],[6.1,6],[14,6],[-16.1,-16],[-15,-15]]){
  it(`${source}: ${input} displays and stores ${expected}, no hardware write`,async()=>{
   const {ctx,f}=editor();await f.updateState(4,'gain',source==='numeric'?String(input):input);expect(ctx.eqState[4].gain).toBe(expected);
   const gain={value:''},range={value:''};runInNewContext(extract('refreshStripUI',helpersSource)+'\nrefreshStripUI(eqState,4)',{eqState:ctx.eqState,document:{getElementById:(id:string)=>id==='num-gain-4'?gain:null,querySelector:(s:string)=>s.includes('input[type=range]')?range:null}});
   expect(gain.value).toBe(String(expected));expect(range.value).toBe(String(expected));expect(ctx.queueRealtimeBandWrite).not.toHaveBeenCalled();expect(ctx.syncToDevice).not.toHaveBeenCalled();expect(ctx.log.mock.calls.join()).toContain(input===expected?'':'clamped');
  });
 }
 it('all real slider/numeric/graph callbacks use updateState; generic graph bounds remain±12',()=>{
   expect(fnSource).toContain("oninput=\"window.updateState(${i}, 'gain', this.value)\"");expect(fnSource).toContain("onchange=\"window.updateState(${i}, 'gain', this.value);");expect(fnSource).toContain('updateState(index, key, value)');expect(peqSource).toContain('minGain: -12');expect(peqSource).toContain('gainRange: 12');
 });
 for(const input of [6,-16,12,14,-16.1,-15])it(`real preset load accepts valid gain or atomically rejects invalid ${input}`,async()=>{
  const {ctx,f}=editor();const bands=freeDspDefaultBands();bands[4].gain=input;
  const logger={error:vi.fn(),log:vi.fn()};
  await runInNewContext(extract('loadProfileFromText',importSource)+'\nloadProfileFromText("fixture","fixture")',{...ctx,...f,parseTextProfile:()=>({bands,globalGain:0}),setGlobalGainState:vi.fn(),updateGlobalGain:vi.fn(),isCompareActive:()=>false,console:logger});
  const valid=input>=-16&&input<=6;expect(ctx.eqState[4].gain).toBe(valid?input:0);expect(logger.error.mock.calls.length).toBe(valid?0:1);expect(bands[4].gain).toBe(input);expect(ctx.syncToDevice).not.toHaveBeenCalled();
 });
 it('actual JSON file import rejects+12 before editor/DOM changes, accepts−16 exactly and never auto Syncs',async()=>{
  for(const gain of [12,-16]){
   const {ctx,f}=editor();const bands=freeDspDefaultBands();bands[0].gain=gain;const strips={innerHTML:'prior rows'};
   let load!:(e:{target:{result:string}})=>Promise<void>;
   class Reader{set onload(fn:typeof load){load=fn;}readAsText(){}}
   const fileTarget={files:[{name:'fixture.json'}],value:'fixture.json'};
   await runInNewContext(extract('importProfile',importSource)+'\nimportProfile(event)',{...ctx,...f,FileReader:Reader,event:{target:fileTarget},parseJsonProfile:()=>({bands,globalGain:0}),
    document:{getElementById:()=>strips},setGlobalGainState:vi.fn(),updateGlobalGain:vi.fn(),isCompareActive:()=>false,console:{error:vi.fn()}});
   await load({target:{result:'{}'}});expect(ctx.eqState[0].gain).toBe(gain===12?0:-16);expect(strips.innerHTML).toBe(gain===12?'prior rows':'');expect(ctx.syncToDevice).not.toHaveBeenCalled();expect(fileTarget.value).toBe('');
  }
 });
 it('valid undo/redo retain exact gain; unavailable readback preserves editor instead of fabricating slots',async()=>{
  const {ctx,f}=editor();const high=freeDspDefaultBands();high[0].gain=6;const low=freeDspDefaultBands();low[0].gain=-15;
  ctx.undoStack=[{eqState:high,globalGainState:0},{eqState:low,globalGainState:0}];await f.undo();expect(ctx.eqState[0].gain).toBe(6);await f.redo();expect(ctx.eqState[0].gain).toBe(-15);
  await f.setABCompareState('B');expect(ctx.eqState.map(b=>b.freq)).toEqual([31,62,125,250,500,1000,2000,4000,8000]);await f.setABCompareState('A');expect(ctx.eqState[0].gain).toBe(-15);await f.setABCompareState('Off');expect(ctx.eqState[0].gain).toBe(-15);expect(ctx.syncToDevice).not.toHaveBeenCalled();expect(ctx.log.mock.calls.join()).toContain('no hardware baseline created');
 });
 it('Defaults nine PK/Q.7; Flat preserves structure/enabled but zeros every gain; both explicitly Sync RAM',async()=>{
  const {ctx,f}=editor();ctx.eqState[0]={...ctx.eqState[0],freq:400,q:2,type:'LSQ',gain:-3};ctx.eqState[1]={...ctx.eqState[1],enabled:false,gain:-5};const before=ctx.eqState.map(b=>({...b}));await f.resetToFlat();
  expect(ctx.eqState).toEqual(before.map(b=>({...b,gain:0})));await f.resetToDefaults();expect(ctx.eqState).toEqual(freeDspDefaultBands());expect(ctx.syncToDevice).toHaveBeenCalledTimes(2);expect(ctx.syncToDevice).toHaveBeenLastCalledWith(true,true);
 });
 for(const order of [['resetToDefaults','resetToFlat'],['resetToFlat','resetToDefaults']])it(`Reset order ${order.join(' then ')} stays nine bands and Syncs only after RAM confirmation`,async()=>{
  const {ctx,f}=editor();const confirm=vi.fn(()=>true);ctx.confirm=confirm;
  for(const name of order){await f[name]();expect(ctx.eqState).toHaveLength(9);expect(ctx.eqState.every(b=>b.gain===0)).toBe(true);}
  expect(ctx.syncToDevice).toHaveBeenCalledTimes(2);for(const [message] of confirm.mock.calls as unknown as [string][])expect(message).toMatch(/Active RAM state is unverified[\s\S]*Overwrite both channels in RAM[\s\S]*do not save Flash/);
 });
 it('cancelled Reset preserves editor, sends nothing; failed explicit Reset does not claim device success',async()=>{
  const {ctx,f}=editor();ctx.eqState[0].gain=-5;const before=ctx.eqState.map(b=>({...b}));ctx.confirm=()=>false;
  await f.resetToDefaults();await f.resetToFlat();expect(ctx.eqState).toEqual(before);expect(ctx.syncToDevice).not.toHaveBeenCalled();
  ctx.confirm=()=>true;ctx.syncToDevice.mockRejectedValue(new Error('MOCK TIMEOUT'));await f.resetToFlat();expect(ctx.syncToDevice).toHaveBeenCalledOnce();expect(ctx.log.mock.calls.join()).toContain('Reset incomplete');expect(ctx.log.mock.calls.join()).not.toContain('stereo bands acknowledged');
 });
 it('other DAC gain setter keeps original behavior',async()=>{const {ctx,f}=editor();ctx.device={vendorId:1,productId:1};f.setEQ(0,'gain',14);expect(ctx.eqState[0].gain).toBe(14);});
 it('other DAC Defaults and Flat preserve original ten-band/reset-and-Sync semantics',async()=>{
  const {ctx,f}=editor();ctx.device={vendorId:1,productId:1};Object.assign(ctx,{defaultEqState:()=>[31,62,125,250,500,1000,2000,4000,8000,16000].map((freq,index)=>({...freeDspDefaultBands()[0],index,freq,q:.75})),resetTiltState:vi.fn()});
  await f.resetToDefaults();expect(ctx.eqState).toHaveLength(10);expect(ctx.eqState[9].freq).toBe(16000);expect(ctx.eqState[0].q).toBe(.75);await f.resetToFlat();expect(ctx.eqState).toHaveLength(10);expect(ctx.eqState.every(b=>b.freq===1000&&b.q===1&&b.type==='PK'&&b.enabled&&b.gain===0)).toBe(true);expect(ctx.syncToDevice).toHaveBeenCalledTimes(2);
 });
 it('nonfinite direct gain is rejected visibly and Auto Reduce stays local without preamp',async()=>{
  const {ctx,f}=editor();await f.updateState(0,'gain','');expect(ctx.eqState[0].gain).toBe(0);expect(ctx.log.mock.calls.join()).toContain('edit rejected');
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
