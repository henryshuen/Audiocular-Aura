import {describe,it,expect,vi} from 'vitest';
import ts from 'typescript';
// @ts-expect-error Offline VM only.
import {runInNewContext} from 'node:vm';
// @ts-expect-error Static artifact helper is Node-only JavaScript.
import {localPageAssets} from '../../scripts/verify-pages.mjs';
import {ReadbackSlots} from '../../src/freedsp/readbackSlots.ts';
import {freeDspDefaultBands} from '../../src/freedsp/editor.ts';
import {isFreeDsp,gainRangeFor} from '../../src/freedsp/capabilities.ts';
import {validateReadbackPreview,previewResponse} from '../../src/freedsp/readbackPreview.ts';
import capture from './fixtures/henryNineReadback20261009.json';
import source from '../../src/fn.ts?raw';
import workflow from '../../.github/workflows/pages-staging.yml?raw';
const preview=validateReadbackPreview(capture);
function extract(name:string){const ast=ts.createSourceFile('f.ts',source,ts.ScriptTarget.ES2022,true);const n=ast.statements.find(x=>ts.isFunctionDeclaration(x)&&x.name?.text===name)!;return ts.transpileModule(n.getText(ast).replace('export ',''),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;}
function context(){
 const original=freeDspDefaultBands();original[3]={...original[3],freq:317,gain:3.3,q:.8};
 const store=new Map<string,string>(),write=vi.fn(),slots=new ReadbackSlots();
 const ctx:any={device:{vendorId:0x35d8,productId:0x1496,opened:false},eqState:original,freeDspReadbackSlots:slots,isFreeDsp,gainRangeFor,configureFreeDspControlNotes:vi.fn(),updateSlotLabel:vi.fn(),getEqState:()=>ctx.eqState,
  localStorage:{setItem:(k:string,v:string)=>store.set(k,v),getItem:(k:string)=>store.get(k)??null},document:{querySelector:()=>null,getElementById:()=>null},window:{confirm:()=>true},globalGainState:0,bassTiltState:0,trebleTiltState:0,manualPreampState:0,log:vi.fn(),syncToDevice:write,flashToFlash:write};
 const api=runInNewContext(['renderUI','setABCompareState'].map(extract).join('\n')+'\n({renderUI,setABCompareState})',ctx);
 return {ctx,api,store,slots,write,original:structuredClone(original)};
}
describe('OFF draft persistence and fork-only static staging',()=>{
 it('actual renderer persists OFF Band4 while A/B render their own state; reload is local with no capture or write',async()=>{
  const f=context();f.api.renderUI(f.ctx.eqState);f.slots.capture(preview,previewResponse(preview),f.ctx.eqState);
  await f.api.setABCompareState('A');expect(f.ctx.eqState[3].gain).toBe(preview.bands[3].gainDb);
  await f.api.setABCompareState('B');f.ctx.eqState[3].gain=-8;f.api.renderUI(f.ctx.eqState);
  expect(JSON.parse(f.store.get('aura_active_eq_state')!)).toEqual(f.original);
  const ast=ts.createSourceFile('fn.ts',source,ts.ScriptTarget.ES2022,true);
  const startup=ast.statements.filter(n=>ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>['savedEq','eqState'].includes(d.name.getText(ast)))).map(n=>n.getText(ast)).join('\n');
  const reloaded=runInNewContext(ts.transpileModule(startup,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText+'\neqState',{localStorage:f.ctx.localStorage,defaultEqState:freeDspDefaultBands});
  expect(reloaded[3]).toEqual(f.original[3]);expect(new ReadbackSlots().mode).toBe('Off');expect(()=>new ReadbackSlots().select('A',reloaded,()=>true)).toThrow('unavailable');
  await f.api.setABCompareState('Off');expect(f.ctx.eqState).toEqual(f.original);expect(f.write).not.toHaveBeenCalled();
 });
 it('disconnect from edited B restores OFF before generic rendering, without losing confirmed A/B',async()=>{
  const f=context();f.slots.capture(preview,previewResponse(preview),f.ctx.eqState);await f.api.setABCompareState('B');f.ctx.eqState[3].gain=-8;f.api.renderUI(f.ctx.eqState);const b=structuredClone(f.ctx.eqState);
  Object.assign(f.ctx,{connectAttempt:0,freeDspStateStale:false,getProtocol:()=> 'CONEXANT',disconnectFreeDsp:vi.fn(),configureFreeDspUI:vi.fn(),adjustBandsForDevice:vi.fn(),enableControls:vi.fn(),configurePreampUI:vi.fn(),showFreeDspDeviceState:vi.fn()});
  await runInNewContext(extract('disconnectDevice')+'\ndisconnectDevice()',f.ctx);
  expect(f.slots.mode).toBe('Off');expect(f.ctx.eqState).toEqual(f.original);expect(JSON.parse(f.store.get('aura_active_eq_state')!)).toEqual(f.original);
  const a=f.slots.select('A',f.ctx.eqState,()=>{throw Error('No baseline replacement');})!;expect(f.slots.select('B',a,()=>true)).toEqual(b);expect(f.write).not.toHaveBeenCalled();
 });
 it('generic renderer keeps upstream active-state persistence',()=>{
  const f=context();f.ctx.device={vendorId:1,productId:1};f.api.renderUI(f.ctx.eqState);expect(JSON.parse(f.store.get('aura_active_eq_state')!)).toEqual(f.ctx.eqState);
 });
 it('subdirectory assets resolve while root escapes and missing built modules fail',()=>{
  const html='<script src="/Audiocular-Aura/assets/index.js"></script><link href="./assets/index.css"><link href="./manifest.json?v=4">';
  expect(localPageAssets(html)).toEqual(['assets/index.js','assets/index.css','manifest.json']);expect(()=>localPageAssets(html.replace('./assets/index.css','/assets/index.css'))).toThrow('escapes');expect(()=>localPageAssets('<script src="./x.js"></script>')).toThrow('Missing');
 });
 it('staging is manual, exact fork/branch gated, explicitly acknowledged and never enables Pages settings',()=>{
  expect(workflow).toContain('workflow_dispatch:');expect(workflow).not.toMatch(/^\s+(push|pull_request|schedule):/m);
  expect(workflow).toContain("github.repository == 'henryshuen/Audiocular-Aura'");expect(workflow).toContain("github.ref == 'refs/heads/fix/freedsp-conexant'");expect(workflow).toContain('inputs.acknowledge_static_only');expect(workflow).toContain('default: false');
  expect(workflow).toContain('--base=/Audiocular-Aura/');expect(workflow).not.toContain('enablement: true');expect(workflow).not.toContain('dotnet');expect(workflow).not.toContain('query-freedsp');
 });
});
