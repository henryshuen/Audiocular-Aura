import {describe,it,expect,vi} from 'vitest';
import {RamBridge,validateBands,fullNinePreset} from '../../src/freedsp/webRam.ts';
import ts from 'typescript';
// @ts-expect-error Node VM is test-only; this repository deliberately excludes Node type declarations.
import {runInNewContext} from 'node:vm';
import html from '../../freedsp-ram-debug.html?raw';
import page from '../../src/freedsp/ramDebugPage.ts?raw';
class Element {
 children:Element[]=[];disabled=false;value='';textContent='';scrollTop=0;scrollHeight=0;
 listeners=new Map<string,()=>unknown>();
 append(...nodes:Element[]){this.children.push(...nodes);}
 replaceChildren(){this.children=[];}
 setAttribute(){}
 addEventListener(name:string,fn:()=>unknown){this.listeners.set(name,fn);}
 select(){}
}
function dom(){
 const nodes=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
 return {nodes,document:{getElementById:(id:string)=>nodes[id]||null,createElement:()=>new Element(),querySelectorAll:()=>[]}};
}
function startup(failConnect=false,Bridge?:new()=>RamBridge){
 const d=dom();let calls=0;
 const js=ts.transpileModule(page,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
   .replace(/^import .*$/gm,'').replace('import.meta.env.DEV','true');
 runInNewContext(js,{document:d.document,location:{hostname:'localhost',port:'5173',origin:'http://localhost:5173'},
   RamBridge:Bridge ?? class {async connect(){calls++;if(failConnect)throw new Error('MOCK session unavailable');return {ok:true,log:'MOCK metadata'};}},
   validateBands,fullNinePreset,console,Set,Date,Number});
 return {...d,calls:()=>calls};
}
describe('M2N frontend startup only; no bridge/HID',()=>{
 it('M2O failure stops the page without retry or automatic restore/confirmation',async()=>{
   const actions:string[]=[];
   class FailedBridge extends RamBridge {
     async connect(){return {ok:true,log:'MOCK metadata'};}
     async run(action:Parameters<RamBridge['run']>[0]):Promise<never>{actions.push(action);throw new Error('MOCK WIRE2 FAIL partial operation');}
   }
   const d=startup(false,FailedBridge);await d.nodes.connect.listeners.get('click')!();
   await d.nodes.sync.listeners.get('click')!();await d.nodes.sync.listeners.get('click')!();
   expect(actions).toEqual(['syncNine']);expect(d.nodes.status.textContent).toContain('STOP');
   expect(d.nodes.log.value).toContain('WIRE2 FAIL');expect(d.nodes.heardApply.disabled).toBe(true);
   expect(d.nodes.flat.disabled).toBe(true);expect(d.nodes.sync.disabled).toBe(true);
 });
 it('M2O uses prior gate, explicit preset/apply/restore and separate manual listening confirmations',async()=>{
   const actions:string[]=[];
   class MockBridge extends RamBridge {
     async connect(){return {ok:true,log:'MOCK metadata'};}
     async run(action:Parameters<RamBridge['run']>[0],_index:number,bands:Parameters<RamBridge['run']>[2]){
       actions.push(action);expect(bands).toEqual(fullNinePreset());return {ok:true,log:'MOCK PROTOCOL COMPLETE bands=9'};
     }
   }
   const d=startup(false,MockBridge);
   d.nodes.preset.listeners.get('click')!();expect(actions).toEqual([]);
   await d.nodes.connect.listeners.get('click')!();expect(d.nodes.sync.disabled).toBe(false);
   expect(d.nodes.heardApply.disabled).toBe(true);
   await d.nodes.sync.listeners.get('click')!();
   expect(d.nodes.log.value).not.toContain('Error');
   expect(actions).toEqual(['syncNine']);expect(d.nodes.heardApply.disabled).toBe(false);
   expect(d.nodes.heardRestore.disabled).toBe(true);
   d.nodes.heardApply.listeners.get('click')!();expect(d.nodes.log.value).toContain('audible Apply YES');
   await d.nodes.flat.listeners.get('click')!();
   expect(actions).toEqual(['syncNine','restoreNine']);expect(d.nodes.heardRestore.disabled).toBe(false);
   d.nodes.heardRestore.listeners.get('click')!();expect(d.nodes.log.value).toContain('audible Restore YES');
   expect(d.nodes.gate.textContent).toContain('Restore聽感YES');
 });
 it('renders all nine rows and enables Connect with zero startup fetch/session calls',()=>{
   const d=startup();expect(d.nodes.bands.children).toHaveLength(9);expect(d.nodes.selection.children).toHaveLength(9);
   expect(d.nodes.connect.disabled).toBe(false);expect(d.nodes.connect.listeners.has('click')).toBe(true);
   expect(d.nodes.apply.disabled).toBe(true);expect(d.calls()).toBe(0);expect(d.nodes.log.value).toContain('M2N UI READY');
 });
 it('bridge failure remains visible and retryable; editor never disappears',async()=>{
   const d=startup(true);await d.nodes.connect.listeners.get('click')!();
   expect(d.nodes.bands.children).toHaveLength(9);expect(d.nodes.log.value).toContain('MOCK session unavailable');
   expect(d.nodes.status.textContent).toContain('連線失敗');expect(d.nodes.connect.disabled).toBe(false);expect(d.nodes.apply.disabled).toBe(true);
 });
 it('real frontend Connect accepts exact debugInspect success with browser fetch receiver and enables RAM controls',async()=>{
   const calls:string[]=[];
   // Emulate browsers whose native Window.fetch rejects a foreign receiver.
   vi.stubGlobal('fetch',function(this:unknown,url:RequestInfo|URL){
     if(this!==globalThis)throw new TypeError("Failed to execute 'fetch' on 'Window': Illegal invocation");
     calls.push(String(url));
     return Promise.resolve(new Response(JSON.stringify(String(url).endsWith('/session')
       ? {token:'A'.repeat(64),mode:'M2N RAM ONLY'}
       : {ok:true,exitCode:0,log:'FreeDSP Native CAF diagnostic — debugInspect...'}),{status:200,headers:{'Content-Type':'application/json'}}));
   });
   try{
     const d=startup(false,RamBridge);await d.nodes.connect.listeners.get('click')!();
     expect(calls.map(url=>url.split('/').pop())).toEqual(['session','connect']);
     expect(d.nodes.status.textContent).toContain('metadata已確認');
     expect(d.nodes.apply.disabled).toBe(false);expect(d.nodes.restore.disabled).toBe(false);
     expect(d.nodes.log.value).toContain('FreeDSP Native CAF diagnostic — debugInspect...');
     expect(d.nodes.log.value).not.toContain('Illegal invocation');
   }finally{vi.unstubAllGlobals();}
 });
 it('127 loopback entry redirects to canonical localhost instead of silently skipping page initialization',()=>{
   const d=dom();let redirect='';
   const bootstrap=html.match(/<script type="module">([\s\S]*?)<\/script>/)![1];
   runInNewContext(bootstrap,{document:d.document,window:{addEventListener(){}},console,
     location:{hostname:'127.0.0.1',port:'5173',pathname:'/freedsp-ram-debug.html',search:'',hash:'',replace:(url:string)=>{redirect=url;}}});
   expect(redirect).toBe('http://localhost:5173/freedsp-ram-debug.html');
 });
 it('bootstrap logs module/runtime errors visibly instead of leaving a silent empty page',()=>{
   const d=dom(),listeners=new Map<string,(event:{reason:Error})=>void>();
   const bootstrap=html.match(/<script type="module">([\s\S]*?)<\/script>/)![1];
   runInNewContext(bootstrap,{document:d.document,window:{addEventListener:(name:string,fn:(event:{reason:Error})=>void)=>listeners.set(name,fn)},console:{error(){}},
     location:{hostname:'127.0.0.1',port:'5173',pathname:'/',search:'',hash:'',replace(){}},Error});
   listeners.get('unhandledrejection')!({reason:new Error('MOCK import failure')});
   expect(d.nodes.status.textContent).toContain('MOCK import failure');expect(d.nodes.log.value).toContain('UI STARTUP ERROR');
 });
});
