import {describe,it,expect,vi} from 'vitest';
import {GraphicalRam,isExperimentalFreeDspActive,isFreeDsp,hasM2RGate,mountGraphicalRam} from '../../src/freedsp/graphicalRam.ts';
import {RamBridge,unityPreset,mixedPreset,M2R_GATE_KEY} from '../../src/freedsp/webRam.ts';
import fnSource from '../../src/fn.ts?raw';
import mainSource from '../../src/main.ts?raw';
import peqSource from '../../src/peq.ts?raw';
import {nativePeakFloat} from '../../scripts/freedsp/ram-semantics.mjs';
import ts from 'typescript';
// @ts-expect-error Node VM is test-only.
import {runInNewContext} from 'node:vm';
function mock(){
 const actions:string[]=[];let fail=false;
 class Bridge extends RamBridge{
   async connect(){actions.push('metadata');return {ok:true,log:'MOCK metadata'};}
   async run(action:Parameters<RamBridge['run']>[0],index:number,bands:Parameters<RamBridge['run']>[2]){
     actions.push(action);expect(index).toBe(0);expect(bands).toHaveLength(9);
     if(fail)throw new Error('STOP WIRE1 RIGHT');return {ok:true,log:'MOCK18 complete'};
   }
 }
 let gate=false;const storage={getItem:(key:string)=>key===M2R_GATE_KEY && gate?JSON.stringify({version:1,validated:true}):null};
 return {c:new GraphicalRam(new Bridge(),storage),actions,setGate:()=>{gate=true;},setFail:(v:boolean)=>{fail=v;}};
}
describe('FreeDSP M2R graphical session; mocks only',()=>{
 it('mounted graphical buttons consume the manual gate and keep edit/unsafe/unsupported state away from transport',async()=>{
   class Node{disabled=false;textContent='';style={gridColumn:''};className='';nodes:Record<string,Node>={};listeners=new Map<string,()=>Promise<void>>();
     set innerHTML(html:string){for(const m of html.matchAll(/id="([^"]+)"/g))this.nodes[m[1]]=new Node();}
     querySelector(id:string){return this.nodes[id.slice(1)];}addEventListener(name:string,fn:()=>Promise<void>){this.listeners.set(name,fn);}prepend(){}
   }
   const panel=new Node();let gate=false,unsupported=false,bands=unityPreset();const native=vi.spyOn(RamBridge.prototype,'run').mockResolvedValue({ok:true,log:'MOCK18'});
   vi.spyOn(RamBridge.prototype,'connect').mockResolvedValue({ok:true,log:'MOCK metadata'});
   vi.stubGlobal('localStorage',{getItem:()=>gate?JSON.stringify({version:1,validated:true}):null});
   vi.stubGlobal('document',{createElement:()=>panel,querySelector:()=>new Node(),querySelectorAll:()=>[],getElementById:()=>null});
   try{
     const view=mountGraphicalRam({getBands:()=>bands,setBands:b=>{bands=b;},getDevice:()=>null,resetUnsupported:()=>{unsupported=false;},unsupportedIsZero:()=>!unsupported,log:vi.fn()});
     const click=(id:string)=>panel.nodes[id].listeners.get('click')!();
     await click('freeConnect');expect(view.active()).toBe(false);expect(native).not.toHaveBeenCalled();
     gate=true;await click('freeConnect');expect(view.active()).toBe(true);expect(panel.nodes.freeSync.disabled).toBe(false);
     await click('freeMixed');bands[4].freq=900;expect(native).not.toHaveBeenCalled();
     await view.sync();expect(native).toHaveBeenCalledTimes(1);expect(native.mock.calls[0][0]).toBe('syncNine');
     unsupported=true;await view.sync();expect(native).toHaveBeenCalledTimes(1);
     bands[0].gain=NaN;await click('freeRestore');expect(native).toHaveBeenCalledTimes(2);expect(native.mock.calls[1][0]).toBe('restoreNine');
   }finally{new GraphicalRam().disconnect();vi.restoreAllMocks();vi.unstubAllGlobals();}
 });
 it('graph uses native float only in FreeDSP mode and leaves generic RBJ behavior intact',()=>{
   const source=ts.createSourceFile('peq.ts',peqSource,ts.ScriptTarget.ES2022,true);
   const node=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='calculateBiquad')!;
   const js=ts.transpileModule(node.getText(source),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
   const b={...unityPreset()[4],freq:1000,gain:6,q:1};let active=false;
   const calculate=runInNewContext(js+'\ncalculateBiquad',{Math,Number,nativePeakFloat,isFreeDsp:()=>false,window:{},isExperimentalFreeDspActive:()=>active}) as (band:typeof b)=>Record<string,number>;
   const generic=calculate(b);active=true;const actual=calculate(b),c=nativePeakFloat({frequency:1000,gainDb:6,q:1,sampleHz:48000}).coefficients;
   expect(actual).toEqual({b0:c[0],b1:c[1],b2:c[2],a1:-c[3],a2:-c[4]});expect(actual.b0).not.toBe(generic.b0);
   active=false;expect(calculate(b)).toEqual(generic);
 });
 it('manual gate required; metadata connect never syncs; explicit mixed Sync and unity Restore only',async()=>{
   const f=mock();await expect(f.c.connect()).rejects.toThrow('M2R');expect(f.actions).toEqual([]);
   f.setGate();await f.c.connect();expect(f.actions).toEqual(['metadata']);expect(isExperimentalFreeDspActive()).toBe(true);
   await f.c.sync(mixedPreset());await f.c.restore();expect(f.actions).toEqual(['metadata','syncNine','restoreNine']);f.c.disconnect();
 });
 it('invalid/unsafe editor blocks Sync before transport but explicit emergency Restore remains possible',async()=>{
   const f=mock();f.setGate();await f.c.connect();const bad=unityPreset();bad[4].gain=12;
   await expect(f.c.sync(bad)).rejects.toThrow('硬性阻擋');expect(f.actions).toEqual(['metadata']);
   bad[0].freq=NaN;await expect(f.c.sync(bad)).rejects.toThrow();await f.c.restore();expect(f.actions).toEqual(['metadata','restoreNine']);f.c.disconnect();
 });
 it('protocol failure locks Apply without auto retry/rollback; explicit unity recovery is available',async()=>{
   const f=mock();f.setGate();await f.c.connect();f.setFail(true);await expect(f.c.sync(mixedPreset())).rejects.toThrow('STOP');
   await expect(f.c.sync(mixedPreset())).rejects.toThrow('STOP');expect(f.actions).toEqual(['metadata','syncNine']);
   f.setFail(false);await f.c.restore();expect(f.c.faulted).toBe(false);expect(f.actions).toEqual(['metadata','syncNine','restoreNine']);f.c.disconnect();
 });
 it('graph updateState executes many local edits with no native or legacy writes in bridge mode',async()=>{
   const source=ts.createSourceFile('fn.ts',fnSource,ts.ScriptTarget.ES2022,true);
   const node=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='updateState')!;
   const js=ts.transpileModule(node.getText(source).replace('export ',''),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
   const state=unityPreset(),queue=vi.fn(),render=vi.fn();
   const context={device:null,eqState:state,autoPreampEnabled:false,parseFloat,Math,Boolean,
     setEQ:(index:number,key:keyof typeof state[number],value:never)=>{state[index][key]=value;},
     renderUI:render,setLastAppliedEqName:vi.fn(),queueRealtimeBandWrite:queue};
   const update=runInNewContext(js+'\nupdateState',context) as (i:number,k:string,v:unknown)=>Promise<void>;
   for(let i=0;i<100;i++)await update(4,'gain',String(-3+i/100));
   await update(4,'freq','800');await update(4,'q','2');await update(4,'enabled',false);
   expect(state[4]).toMatchObject({freq:800,q:2,enabled:false});expect(render).toHaveBeenCalledTimes(103);expect(queue).not.toHaveBeenCalled();
 });
 it('FreeDSP-only legacy gate and explicit Sync hook leave other VID/PIDs outside native mode',()=>{
   expect(isFreeDsp({vendorId:0x35d8,productId:0x1496})).toBe(true);expect(isFreeDsp({vendorId:0x35d8,productId:1})).toBe(false);
   expect(hasM2RGate({getItem:()=>'{bad'})).toBe(false);expect(mainSource).not.toContain('mountGraphicalRam');expect(mainSource).toContain('await syncToDevice(true)');
   expect(fnSource.indexOf('attachFreeDsp(dev,log)')).toBeLessThan(fnSource.indexOf('await dev.open()'));
 });
});
