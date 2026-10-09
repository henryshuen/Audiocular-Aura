import {describe,it,expect,vi} from 'vitest';
import ts from 'typescript';
// @ts-expect-error Offline VM only.
import {runInNewContext} from 'node:vm';
import {configureFreeDspControlNotes} from '../../src/freedsp/controls.ts';
import {isFreeDsp} from '../../src/freedsp/capabilities.ts';
import {freeDspOverwriteWarning} from '../../src/freedsp/deviceState.ts';
import {freeDspDefaultBands} from '../../src/freedsp/editor.ts';
import {ReadbackSlots} from '../../src/freedsp/readbackSlots.ts';
import {gainRangeFor} from '../../src/freedsp/capabilities.ts';
import fn from '../../src/fn.ts?raw';
import main from '../../src/main.ts?raw';
import helpers from '../../src/helpers.ts?raw';
import dsp from '../../src/dsp.ts?raw';
import imports from '../../src/importExport.ts?raw';
import html from '../../index.html?raw';
import editor from '../../src/freedsp/editor.ts?raw';
import policy from '../../src/freedsp/capabilities.ts?raw';
import controls from '../../src/freedsp/controls.ts?raw';
import state from '../../src/freedsp/deviceState.ts?raw';
import transport from '../../src/freedsp/nativeTransport.ts?raw';
import ram from '../../src/freedsp/cafRam.ts?raw';
import slots from '../../src/freedsp/readbackSlots.ts?raw';
function extract(name:string,source:string){const ast=ts.createSourceFile('s.ts',source,ts.ScriptTarget.ES2022,true);const n=ast.statements.find(x=>ts.isFunctionDeclaration(x)&&x.name?.text===name)!;return ts.transpileModule(n.getText(ast).replace('export ',''),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;}
class Element {
 textContent='upstream';innerText='';title='';hidden=true;disabled=false;checked=true;
 style={display:'',width:''};attrs=new Map([['data-i18n','upstream_key']]);
 getAttribute(k:string){return k==='title'?(this.title||null):this.attrs.get(k)??null;}setAttribute(k:string,v:string){if(k==='title')this.title=v;else this.attrs.set(k,v);}removeAttribute(k:string){if(k==='title')this.title='';else this.attrs.delete(k);}
 classList={add:vi.fn(),remove:vi.fn()};
}
describe('Final production UX — offline only',()=>{
 it('hides only FreeDSP preamp space, restoring the original display for other devices',()=>{
  const preamp=new Element();preamp.style.display='flex';const doc={getElementById:(id:string)=>id==='preampControls'?preamp:null} as unknown as Document;
  configureFreeDspControlNotes(true,doc);expect(preamp.style.display).toBe('none');configureFreeDspControlNotes(true,doc);configureFreeDspControlNotes(false,doc);expect(preamp.style.display).toBe('flex');
 });
 it('relabels editor/readback and local counter, English under retranslation, then restores original other-DAC labels',()=>{
  const nodes=Object.fromEntries(['lastAppliedEqLabel','infoSlotsLabel','infoSampleRateLabel','preampStepIndicator','micMonitorStatus'].map(id=>[id,new Element()]));
  const doc={getElementById:(id:string)=>nodes[id]??null} as unknown as Document;
  configureFreeDspControlNotes(true,doc);expect(nodes.lastAppliedEqLabel.textContent).toBe('EDITOR / READBACK:');expect(nodes.infoSlotsLabel.textContent).toBe('Local Nonzero Bands:');
  expect(nodes.infoSlotsLabel.title).toContain('not hardware');expect(nodes.lastAppliedEqLabel.getAttribute('data-i18n')).toBeNull();
  configureFreeDspControlNotes(true,doc);configureFreeDspControlNotes(false,doc);
  expect(nodes.lastAppliedEqLabel.textContent).toBe('upstream');expect(nodes.lastAppliedEqLabel.getAttribute('data-i18n')).toBe('upstream_key');expect(nodes.infoSlotsLabel.title).toBe('');
 });
 it('FreeDSP shows unknown active rate and firmware; generic device retains upstream values',()=>{
  for(const exact of [true,false]){
   const nodes=Object.fromEntries(['infoSampleRate','infoFirmware','infoVid','infoPid'].map(id=>[id,new Element()]));
   const d={vendorId:0x35d8,productId:exact?0x1496:1,collections:[]};
   const context={document:{getElementById:(id:string)=>nodes[id]??null},activeDacs:[],isFreeDsp,log:vi.fn(),getProtocol:()=> 'CONEXANT',VID_COMTRUE:1,VID_FIIO:2,VID_SAVITECH:3,VID_SAVITECH_ALT:4,VID_SAVITECH_OFFICIAL:5,VID_AUDIOCULAR:6,t:()=>''};
   runInNewContext(extract('identifyConnectedDac',fn)+'\nidentifyConnectedDac(d)',{...context,d});
   expect(nodes.infoSampleRate.innerText).toBe(exact?'Unknown':'48 kHz');expect(nodes.infoFirmware.innerText).toBe(exact?'Unknown':'Active');
  }
 });
 it('hides false FreeDSP Level Matched claim and preserves other-DAC comparison behavior',()=>{
  for(const exact of [true,false]){
   const note=new Element();
   const context={isFreeDsp,getActiveProtocol:()=>exact?'CONEXANT':'SAVITECH',window:{device:{vendorId:0x35d8,productId:exact?0x1496:1},isCompareActive:()=>true,getSlotAGain:()=>-2,getSlotBGain:()=>-4},document:{getElementById:(id:string)=>id==='preampAppliedNote'?note:null}};
   runInNewContext(extract('updateGlobalGainUI',helpers)+'\nupdateGlobalGainUI(0)',context);
   expect(note.style.display).toBe(exact?'none':'block');expect(note.innerText).toBe(exact?'':'(Level Matched to -4.0 dB)');
  }
 });
 it('counter uses locally enabled nonzero gains rather than pretending to measure hardware enabled flags',()=>{
  const bands=freeDspDefaultBands().map((b,i)=>({...b,gain:i===8?0:-1,enabled:i!==7})),counter=new Element();
  const context={isFreeDsp,device:{vendorId:0x35d8,productId:0x1496},getEqState:()=>bands,freeDspReadbackSlots:new ReadbackSlots(),configureFreeDspControlNotes:vi.fn(),updateSlotLabel:vi.fn(),gainRangeFor,
   globalGainState:0,bassTiltState:0,trebleTiltState:0,manualPreampState:0,localStorage:{setItem:vi.fn()},document:{getElementById:(id:string)=>id==='infoSlots'?counter:null,querySelector:()=>null}};
  runInNewContext(extract('renderUI',fn)+'\nrenderUI([])',context);expect(counter.innerText).toBe('7 / 9');
 });
 it('actual FreeDSP reset confirmation is English, describes RAM-only semantics, and Cancel prevents changes',async()=>{
  const confirm=vi.fn(()=>false),write=vi.fn();const ctx={device:{vendorId:0x35d8,productId:0x1496},isFreeDsp,confirm,freeDspOverwriteWarning,finishFreeDspLocalReset:write};
  for(const name of ['resetToDefaults','resetToFlat'])await runInNewContext(extract(name,fn)+`\n${name}()`,ctx);
  expect(write).not.toHaveBeenCalled();for(const call of confirm.mock.calls as unknown as [string][]){expect(call[0]).not.toMatch(/[\u3400-\u9fff]/);expect(call[0]).toContain('do not save Flash');expect(call[0]).toContain('Overwrite both channels in RAM');}
 });
 it('late successful or failed Flash UI callback cannot replace offline/new-connection status',async()=>{
  for(const failed of [false,true]){
   let finish!:(v:boolean)=>void,reject!:(e:Error)=>void,attempt=0;const status={textContent:''},button={disabled:false};
   const ctx={getConnectionAttempt:()=>attempt,getDevice:()=>null,isFreeDsp,document:{getElementById:()=>button},setFreeDspRamStatus:(s:string)=>status.textContent=s,flashToFlash:()=>new Promise<boolean>((r,j)=>{finish=r;reject=j;}),log:vi.fn()};
   const run=runInNewContext(extract('saveFreeDspFlash',main)+'\nsaveFreeDspFlash',ctx);const pending=run();attempt++;status.textContent='Offline';if(failed)reject(Error('late error'));else finish(true);await pending;
   expect(status.textContent).toBe('Offline');expect(ctx.log).not.toHaveBeenCalled();expect(button.disabled).toBe(true);
  }
 });
 it('profile preamp is ignored only for FreeDSP; imports remain local and generic devices retain gain/sync',async()=>{
  for(const exact of [true,false]){
   const set=vi.fn(),update=vi.fn(),sync=vi.fn(),log=vi.fn();
   const context={getDevice:()=>({vendorId:0x35d8,productId:exact?0x1496:1}),isFreeDsp,parseTextProfile:()=>({bands:freeDspDefaultBands(),globalGain:-5}),getEqState:freeDspDefaultBands,setEqState:vi.fn(),setGlobalGainState:set,updateGlobalGain:update,renderUI:vi.fn(),setLastAppliedEqName:vi.fn(),isCompareActive:()=>false,initSlots:vi.fn(),syncToDevice:sync,window:{},document:{getElementById:()=>null},log,console:{error:vi.fn()}};
   await runInNewContext(extract('loadProfileFromText',imports)+'\nloadProfileFromText("fixture","Fixture")',context);
   expect(set).toHaveBeenCalledWith(exact?0:-5);expect(update).toHaveBeenCalledWith(exact?0:-5);expect(sync).toHaveBeenCalledTimes(exact?0:1);if(exact){expect(log.mock.calls.join()).toContain('preamp ignored');expect(log.mock.calls.join()).not.toContain('Synced:');}
  }
 });
 it('all introduced production string literals are English; no debug link/card or obsolete capability claims',()=>{
  for(const source of [fn,main,dsp,imports,editor,policy,controls,state,transport,ram,slots]){
   const ast=ts.createSourceFile('s.ts',source,ts.ScriptTarget.ES2022,true);
   const visit=(n:ts.Node)=>{if(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n)||ts.isTemplateHead(n)||ts.isTemplateMiddle(n)||ts.isTemplateTail(n))expect(n.text).not.toMatch(/[\u3400-\u9fff]/);ts.forEachChild(n,visit);};visit(ast);
  }
  expect(html).not.toContain('freedsp-ram-debug.html');expect(html).not.toContain('freeDspReadbackPreview');expect(html).not.toContain('沒有PEQ讀回');expect(fn).not.toContain('持久性尚未硬體驗證');
 });
});
