import {describe,it,expect,vi} from 'vitest';
import {FreeDspWorkspaces} from '../../src/freedsp/workspaces.ts';
import {freeDspDefaultBands} from '../../src/freedsp/editor.ts';
import {validateReadbackPreview,previewResponse} from '../../src/freedsp/readbackPreview.ts';
import {confirmFreeDspReset} from '../../src/freedsp/inPageConfirm.ts';
import capture from './fixtures/deviceShelfReadback20261012.json';
import fn from '../../src/fn.ts?raw';
import main from '../../src/main.ts?raw';
import peq from '../../src/peq.ts?raw';
import ts from 'typescript';
// @ts-expect-error Offline VM only.
import {runInNewContext} from 'node:vm';
import {nativePeakFloat} from '../../scripts/freedsp/ram-semantics.mjs';
import {loadReadbackPreview} from '../../src/freedsp/readbackPreview.ts';
import {normalizeFreeDspEditor} from '../../src/freedsp/editor.ts';
const p=validateReadbackPreview(capture),points=previewResponse(p);
const storage=()=>{const m=new Map<string,string>();return {getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>{m.set(k,v);}};};
function extract(name:string,source:string){const ast=ts.createSourceFile('x.ts',source,ts.ScriptTarget.ES2022,true);const node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name)!;return ts.transpileModule(node.getText(ast).replace('export ',''),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;}
describe('Edition initialization repair — recorded snapshot and offline UI only',()=>{
 it('actual CONNECT event order loads real pollNineEq fixture before actual A/B selection, with zero writes or native dialogs',async()=>{
  const store=storage(),s=new FreeDspWorkspaces(store),dev={vendorId:0x35d8,productId:0x1496,opened:true,collections:[]},writes=vi.fn(),native=vi.fn(()=>{throw Error('Native dialog prohibited');}),rendered:any[]=[];
  const session={readback:vi.fn(async()=>capture)},doc={getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[]};
  const ctx:any={device:null,eqState:freeDspDefaultBands(),connectAttempt:0,freeDspStateStale:false,freeDspReadbackSlots:s,window:{},document:doc,localStorage:store,navigator:{hid:{requestDevice:async()=>[dev]}},activeDacs:[],isFreeDsp:(d:any)=>d===dev,isExperimentalFreeDspActive:()=>false,selectCafDevice:()=>dev,connectFreeDsp:async()=>session,getFreeDspSession:()=>session,disconnectFreeDsp:vi.fn(),getProtocol:()=> 'CONEXANT',identifyConnectedDac:vi.fn(),enableControls:vi.fn(),configureFreeDspUI:vi.fn(),setupListener:vi.fn(),loadReadbackPreview:(read:any,current:any,log:any)=>loadReadbackPreview(read,current,log,doc as unknown as Document),previewResponse,loadCustomProfilesFromStorage:vi.fn(),renderCustomProfiles:vi.fn(),updateSlotLabel:vi.fn(),normalizeFreeDspEditor,log:vi.fn(),console:{debug:vi.fn()},autoPreampEnabled:false,confirm:native,alert:native,syncToDevice:writes};
  for(const name of ['VID_AUDIOCULAR','VID_SAVITECH_OFFICIAL','VID_SAVITECH','VID_SAVITECH_ALT','VID_COMTRUE','VID_FIIO'])ctx[name]=1;
  ctx.renderUI=(bands:any)=>rendered.push(bands.map((b:any)=>({...b})));
  const api=runInNewContext(['getEqState','adjustBandsForDevice','connectToDevice','setABCompareState'].map(n=>extract(n,fn)).join('\n')+'\n({connectToDevice,setABCompareState,getEqState})',ctx);
  await api.connectToDevice();expect(ctx.log.mock.calls.join()).not.toContain('Connection Error');expect(session.readback).toHaveBeenCalledOnce();expect(s.curve).toEqual(points);
  await api.setABCompareState('A');expect(rendered.at(-1)).toEqual(s.view);expect(api.getEqState().some((b:any)=>b.gain!==0)).toBe(true);expect(api.getEqState()[7].type).toBe('LSQ');
  await api.setABCompareState('B');expect(api.getEqState()).toEqual(freeDspDefaultBands());expect(writes).not.toHaveBeenCalled();expect(native).not.toHaveBeenCalled();
 });
 it('old Flat drafts + former OK callback cannot override non-Flat A; actual buttons/getter/renderPEQ receive shelf parameters',async()=>{
  const store=storage(),flat=freeDspDefaultBands();store.setItem('aura_freedsp_edition_drafts_v1',JSON.stringify({a:flat,b:flat,cleanA:'',cleanB:''}));
  const s=new FreeDspWorkspaces(store),native=vi.fn(()=>true);const selected=s.capture(p,points,flat,native);expect(native).not.toHaveBeenCalled();
  expect(JSON.parse(store.getItem('aura_custom_profiles')!)).toHaveLength(2);
  const buttons:any={};for(const id of ['btnCompareOff','btnCompareA','btnCompareB'])buttons[id]={addEventListener(_e:string,f:any){this.click=f;}};
  const graph:any[]=[];const ctx:any={eqState:selected,device:{},isFreeDsp:()=>true,freeDspReadbackSlots:s,window:{},document:{getElementById:(id:string)=>buttons[id]??null},log:vi.fn(),updateSlotLabel:vi.fn(),renderUI:(b:any)=>graph.push(b.map((x:any)=>({...x})))};
  const code=['getEqState','setABCompareState'].map(n=>extract(n,fn)).join('\n');runInNewContext(code,ctx);
  const ast=ts.createSourceFile('main.ts',main,ts.ScriptTarget.ES2022,true);const wiring=ast.statements.filter(n=>n.getText(ast).startsWith('const btnCompare')||/^btnCompare.*addEventListener/.test(n.getText(ast))).map(n=>n.getText(ast)).join('\n');runInNewContext(ts.transpileModule(wiring,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,ctx);
  await buttons.btnCompareA.click();expect(ctx.getEqState()).toEqual(p.bands.map((b,index)=>({index,freq:b.frequency,gain:b.gainDb,q:b.q,type:index===7?'LSQ':index===8?'HSQ':'PK',enabled:true})));expect(graph.at(-1)).toEqual(s.view);
  // Actual renderPEQ assignment and actual coefficient/response mathematics, without a browser or device.
  const draw:any={localBands:[],window:{device:{}},isFreeDsp:()=>true,isExperimentalFreeDspActive:()=>false,nativePeakFloat,document:{getElementById:()=>null}};
  const plot=runInNewContext(['renderPEQ','calculateBiquad','getMagnitude'].map(n=>extract(n,peq)).join('\n')+'\n({renderPEQ,calculateBiquad,getMagnitude})',draw);
  plot.renderPEQ({},graph.at(-1),()=>{});expect(draw.localBands).toEqual(s.view);const response=plot.getMagnitude(60,draw.localBands.map((b:any)=>plot.calculateBiquad(b)));expect(Math.abs(response)).toBeGreaterThan(.1);
  await buttons.btnCompareB.click();expect(ctx.getEqState()).toEqual(flat);await buttons.btnCompareA.click();expect(ctx.getEqState()[7].type).toBe('LSQ');await buttons.btnCompareOff.click();expect(s.curve).toEqual(points);
 });
 it('recovery profiles survive reload and existing presets are never overwritten',()=>{
  const store=storage(),s=new FreeDspWorkspaces(store);store.setItem('aura_custom_profiles',JSON.stringify([{name:'Existing',bands:freeDspDefaultBands(),globalGain:0}]));s.capture(p,points,freeDspDefaultBands());const a=s.select('A',s.view)!;a[0].gain=-4;s.observe(a);s.disconnect();const reload=new FreeDspWorkspaces(store);reload.capture(p,points,[]);const recovered=JSON.parse(store.getItem('aura_custom_profiles')!);expect(recovered[0].name).toBe('Existing');expect(recovered[1].bands[0].gain).toBe(-4);expect(reload.select('A',reload.view)![0].gain).toBe(p.bands[0].gainDb);
 });
 it.each(['quota','corrupt','ignored','workspace'])('failed %s recovery never replaces old drafts',failure=>{
  const store=storage(),s=new FreeDspWorkspaces(store);s.capture(p,points,freeDspDefaultBands());const a=s.select('A',s.view)!;a[0].gain=-4;s.observe(a);s.disconnect();
  if(failure==='corrupt')store.setItem('aura_custom_profiles','{}');else{const original=store.setItem;store.setItem=(k,v)=>{if(k===(failure==='workspace'?'aura_freedsp_edition_drafts_v1':'aura_custom_profiles')){if(failure==='ignored')return;throw Error('Quota');}original(k,v);};}
  expect(()=>s.capture(p,points,[])).toThrow();expect(s.select('A',[])![0].gain).toBe(-4);expect(s.writable).toBe(false);
 });
 it('non-Flat raw coefficient curve with all-zero parameters is explicit unavailable, never a Flat A',()=>{
  const s=new FreeDspWorkspaces(storage()),q={...p,bands:p.bands.map(b=>({...b,gainDb:0}))};s.capture(q,points,freeDspDefaultBands());expect(s.curve).toEqual(points);expect(s.status).toContain('reconstruction unavailable');expect(s.available).toBe(false);expect(()=>s.select('A',s.view)).toThrow('unavailable');
 });
 it('Reset uses existing in-page controls; Cancel/Escape do not write and original generic modal content is restored',async()=>{
  class Element extends EventTarget{hidden=false;textContent='Original';innerHTML='Reasons';classList={hidden:true,contains:()=>this.classList.hidden,add:()=>this.classList.hidden=true,remove:()=>this.classList.hidden=false};querySelector=(selector:string)=>elements[selector];}
  const elements:Record<string,Element>={};for(const id of ['modalSafetyWarning','btnSafetyProceed','btnSafetyCancel','btnCloseSafetyModal','btnSafetyAutoReduce','safetyWarningReasons','.modal-title','.modal-desc'])elements[id]=new Element();
  const doc=Object.assign(new EventTarget(),{getElementById:(id:string)=>elements[id]}) as unknown as Document;
  let pending=confirmFreeDspReset('Reset RAM? Flash unchanged.',doc);elements.btnSafetyCancel.dispatchEvent(new Event('click'));expect(await pending).toBe(false);expect(elements['.modal-title'].textContent).toBe('Original');expect(elements.btnSafetyAutoReduce.hidden).toBe(false);
  pending=confirmFreeDspReset('Reset RAM?',doc);elements.btnSafetyProceed.dispatchEvent(new Event('click'));expect(await pending).toBe(true);expect(elements.modalSafetyWarning.classList.hidden).toBe(true);
  pending=confirmFreeDspReset('Reset RAM?',doc);doc.dispatchEvent(Object.assign(new Event('keydown'),{key:'Escape'}));expect(await pending).toBe(false);
 });
});
