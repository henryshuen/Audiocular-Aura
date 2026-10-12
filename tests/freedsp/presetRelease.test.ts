import {describe,it,expect,vi} from 'vitest';
import ts from 'typescript';
// @ts-expect-error Offline VM only.
import {runInNewContext} from 'node:vm';
import {parseFreeDspTextProfile,validateFreeDspImport} from '../../src/freedsp/presetImport.ts';
import {isFreeDsp} from '../../src/freedsp/webHid.ts';
import {FreeDspWorkspaces} from '../../src/freedsp/workspaces.ts';
import {freeDspDefaultBands} from '../../src/freedsp/editor.ts';
import {validateReadbackPreview,previewResponse} from '../../src/freedsp/readbackPreview.ts';
import capture from './fixtures/deviceShelfReadback20261012.json';
import example from './fixtures/freeDspReleasePreset.txt?raw';
import source from '../../src/importExport.ts?raw';
function extract(name:string){const ast=ts.createSourceFile('import.ts',source,ts.ScriptTarget.ES2022,true);const node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name)!;return ts.transpileModule(node.getText(ast).replace('export ',''),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;}
function context(mode:'A'|'B'|'Off',exact=true){
 const store=new Map<string,string>(),slots=new FreeDspWorkspaces({getItem:k=>store.get(k)??null,setItem:(k,v)=>{store.set(k,v);}});
 const preview=validateReadbackPreview(capture);slots.capture(preview,previewResponse(preview),freeDspDefaultBands());slots.select(mode,slots.view);
 let current=slots.view;const sync=vi.fn(),set=vi.fn((bands)=>{current=bands;}),render=vi.fn((bands)=>{if(exact)slots.observe(bands);});
 const ctx:any={parseFreeDspTextProfile,validateFreeDspImport,isFreeDsp,getDevice:()=>({vendorId:0x35d8,productId:exact?0x1496:1}),getEqState:()=>current,setEqState:set,renderUI:render,setGlobalGainState:vi.fn(),updateGlobalGain:vi.fn(),setLastAppliedEqName:vi.fn(),isCompareActive:()=>true,initSlots:vi.fn(),syncToDevice:sync,log:vi.fn(),console:{error:vi.fn()},window:{isFreeDspEditorReadOnly:()=>exact&&slots.readOnly},document:{getElementById:()=>null}};
 const snapshot=(mode:'A'|'B'|'Off')=>{const previous=slots.mode;const result=JSON.stringify(slots.select(mode,slots.view));slots.select(previous,slots.view);return result;};
 return {ctx,slots,set,sync,preview,snapshot,get:()=>current};
}
describe('Release preset compatibility — exact FreeDSP, offline only',()=>{
 it('parses all nine supplied bands exactly; shelves are not substituted, all five rate models pass',()=>{
  const bands=parseFreeDspTextProfile(example).bands;
  expect(bands.map(b=>b.freq)).toEqual([76,712,4901,6591,11147,9952,14788,1800,1800]);
  expect(bands.map(b=>b.gain)).toEqual([2,5,-2,4,2,-4,0,-16,-16]);
  expect(bands.map(b=>b.q)).toEqual([1.01,1.18,2.37,2.20,.44,6.35,.73,.71,.71]);
  expect(bands.map(b=>b.type)).toEqual(['PK','PK','PK','PK','PK','PK','PK','LSQ','HSQ']);
  expect(bands.every((b,i)=>b.index===i&&b.enabled)).toBe(true);expect(validateFreeDspImport(bands)).toEqual(bands);
 });
 it('preserves OFF, explicit positive sign, comments and sparse neutral slots',()=>{
  const p=parseFreeDspTextProfile('# local preset\nPreamp: -3 dB\nFilter 2: OFF LSQ Fc 100 Hz Gain +2 dB Q 1');
  expect(p.globalGain).toBe(-3);expect(p.bands[1]).toEqual({index:1,freq:100,gain:2,q:1,type:'LSQ',enabled:false});expect(p.bands[0].gain).toBe(0);
 });
 it.each([
  example.replace('ON PK','ON NOTCH'),example.replace('Gain 2 dB','Gain 2 garbage dB'),example.replace('Gain 2 dB','Gain 7 dB'),
  example.replace('Gain -16 dB','Gain -17 dB'),example+'\nFilter 10: ON PK Fc 1000 Hz Gain 0 dB Q 1',example+'\n'+example.split('\n')[0],
  'unrecognized format',example.replace('Fc 76 Hz','Fc 1 Hz'),example.replace('Q 1.01','Q 100'),
 ])('rejects unsupported/malformed/out-of-policy input atomically',async(text)=>{
  const f=context('A');const before=JSON.stringify(f.slots.view);await runInNewContext(['neutralBand','parseTextProfile','loadProfileFromText'].map(extract).join('\n')+'\nloadProfileFromText(input,"Rejected")',{...f.ctx,input:text});
  expect(f.set).not.toHaveBeenCalled();expect(JSON.stringify(f.slots.view)).toBe(before);expect(f.sync).not.toHaveBeenCalled();expect(f.ctx.log.mock.calls.join()).toContain('Error');
 });
 it('rejects invalid coefficient stability before editor mutation',()=>{
  const bands=freeDspDefaultBands();bands[0]={...bands[0],freq:20,gain:-16,q:10};expect(()=>validateFreeDspImport(bands)).toThrow(/instability/);
 });
 it.each(['A','B'] as const)('actual text-loader changes only selected EQ %s and never Syncs',async mode=>{
  const f=context(mode),origin=f.snapshot('Off'),other=f.snapshot(mode==='A'?'B':'A');
  await runInNewContext(['neutralBand','parseTextProfile','loadProfileFromText'].map(extract).join('\n')+'\nloadProfileFromText(input,"Reference")',{...f.ctx,input:example});
  expect(f.get()).toEqual(parseFreeDspTextProfile(example).bands);expect(f.snapshot('Off')).toBe(origin);expect(f.snapshot(mode==='A'?'B':'A')).toBe(other);expect(f.sync).not.toHaveBeenCalled();
 });
 it('actual file import updates selected B only; ORIGIN rejects before reading file',async()=>{
  for(const mode of ['B','Off'] as const){
   const f=context(mode),origin=f.snapshot('Off');let loaded:any;const read=vi.fn();
   class Reader{set onload(v:any){loaded=v;}readAsText(){read();}}
   const target={files:[{name:'Reference.txt'}],value:'Reference.txt'};
   await runInNewContext(['neutralBand','parseTextProfile','importProfile'].map(extract).join('\n')+'\nimportProfile(event)',{...f.ctx,FileReader:Reader,event:{target}});
   if(mode==='B'){await loaded({target:{result:example}});expect(f.get()[7].type).toBe('LSQ');expect(target.value).toBe('');}else{expect(read).not.toHaveBeenCalled();expect(f.set).not.toHaveBeenCalled();}
   expect(f.snapshot('Off')).toBe(origin);expect(f.sync).not.toHaveBeenCalled();
  }
 });
 it('FreeDSP JSON unknown type/ten bands is rejected; no editor mutation or hardware write',async()=>{
  for(const bands of [freeDspDefaultBands().map((b,i)=>i===0?{...b,type:'NOTCH'}:b),[...freeDspDefaultBands(),freeDspDefaultBands()[0]]]){
   const f=context('A');let loaded:any;class Reader{set onload(v:any){loaded=v;}readAsText(){}}
   await runInNewContext(['parseJsonProfile','importProfile'].map(extract).join('\n')+'\nimportProfile(event)',{...f.ctx,FileReader:Reader,event:{target:{files:[{name:'Invalid.json'}],value:'x'}}});
   await loaded({target:{result:JSON.stringify({bands})}});expect(f.set).not.toHaveBeenCalled();expect(f.sync).not.toHaveBeenCalled();
  }
 });
 it('generic DAC keeps inherited unknown-type normalization and automatic preset sync',async()=>{
  const f=context('B',false);await runInNewContext(['neutralBand','parseTextProfile','loadProfileFromText'].map(extract).join('\n')+'\nloadProfileFromText(input,"Generic")',{...f.ctx,input:'Filter 1: ON NOTCH Fc 1000 Hz Gain 0 dB Q 1'});
  expect(f.get()[0].type).toBe('PK');expect(f.sync).toHaveBeenCalledOnce();
 });
});
