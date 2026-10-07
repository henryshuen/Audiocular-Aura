import {describe,it,expect,vi} from 'vitest';
import {RamBridge,validateBands,fullNinePreset,unityPreset,positiveBandPreset,positiveMultiPreset,analyzeSafety,M2R_GATE_KEY} from '../../src/freedsp/webRam.ts';
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
 const d=dom();let calls=0;const values=new Map<string,string>(),storage={getItem:(k:string)=>values.get(k)||null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)};
 const js=ts.transpileModule(page,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
   .replace(/^import .*$/gm,'').replace('import.meta.env.DEV','true');
 runInNewContext(js,{document:d.document,location:{hostname:'localhost',port:'5173',origin:'http://localhost:5173'},
   RamBridge:Bridge ?? class {async connect(){calls++;if(failConnect)throw new Error('MOCK session unavailable');return {ok:true,log:'MOCK metadata'};}},
   validateBands,fullNinePreset,unityPreset,positiveBandPreset,positiveMultiPreset,analyzeSafety,M2R_GATE_KEY,localStorage:storage,console,Set,Date,Number});
 return {...d,calls:()=>calls,storage};
}
describe('M2N frontend startup only; no bridge/HID',()=>{
 it('invalid gain disables Apply but keeps explicit Restore available without entering transport STOP',async()=>{
   const f=vi.fn(async(url:RequestInfo|URL)=>new Response(JSON.stringify(String(url).endsWith('/session')
     ? {token:'A'.repeat(64),mode:'M2N RAM ONLY'} : {ok:true,log:'MOCK unity complete'}),{status:200}));
   class MockBridge extends RamBridge{constructor(){super(f as typeof fetch);}}
   const d=startup(false,MockBridge);await d.nodes.connect.listeners.get('click')!();
   const gain=d.nodes.bands.children[0].children[2].children[0];gain.value='-13';gain.listeners.get('input')!();
   expect(d.nodes.apply.disabled).toBe(true);expect(d.nodes.restore.disabled).toBe(false);expect(d.nodes.flat.disabled).toBe(false);
   await d.nodes.apply.listeners.get('click')!();expect(f).toHaveBeenCalledTimes(2);
   expect(d.nodes.log.value).toContain('EDITOR VALIDATION');expect(d.nodes.status.textContent).not.toContain('STOP');
   await d.nodes.restore.listeners.get('click')!();await d.nodes.flat.listeners.get('click')!();
   expect(f).toHaveBeenCalledTimes(4);expect(d.nodes.restore.disabled).toBe(false);expect(d.nodes.flat.disabled).toBe(false);
   expect(d.nodes.bands.children[0].children[2].children[0].value).toBe('-13');
 });
 it('transport STOP blocks Apply, but explicit emergency unity Restore works; no auto retry',async()=>{
   const actions:string[]=[];let fail=true;
   class MockBridge extends RamBridge{async connect(){return {ok:true,log:'MOCK metadata'};}async run(action:Parameters<RamBridge['run']>[0]){actions.push(action);if(action==='applyBand'&&fail)throw new Error('WIRE2 FAIL');return {ok:true,log:'MOCK'};}}
   const d=startup(false,MockBridge);await d.nodes.connect.listeners.get('click')!();await d.nodes.flat.listeners.get('click')!();d.nodes.safe.listeners.get('click')!();
   await d.nodes.apply.listeners.get('click')!();await d.nodes.apply.listeners.get('click')!();expect(actions).toEqual(['restoreNine','applyBand']);expect(d.nodes.flat.disabled).toBe(false);expect(d.nodes.sync.disabled).toBe(true);
   fail=false;await d.nodes.flat.listeners.get('click')!();expect(actions).toEqual(['restoreNine','applyBand','restoreNine']);expect(d.nodes.apply.disabled).toBe(false);
 });
 it('one session P1/P2/NEG observations gate the graphical page only after manual audible/stereo/recovery',async()=>{
   const actions:string[]=[];
   class MockBridge extends RamBridge{async connect(){return {ok:true,log:'MOCK'};}async run(action:Parameters<RamBridge['run']>[0],_i:number,b:Parameters<RamBridge['run']>[2]){actions.push(action);if(action.startsWith('restore'))expect(b).toEqual(unityPreset());return {ok:true,log:'PROTOCOL COMPLETE'};}}
   const d=startup(false,MockBridge);await d.nodes.connect.listeners.get('click')!();expect(d.nodes.apply.disabled).toBe(true);await d.nodes.flat.listeners.get('click')!();
   const observe=(restore=false)=>{d.nodes.obsStereo.value='C';d.nodes.obsAudible.value='Y';d.nodes.obsRecovery.value=restore?'Y':'U';d.nodes.obsPop.value='U';d.nodes.record.listeners.get('click')!();};
   for(const [preset,apply,restore] of [['safe','apply','restore'],['positiveMulti','sync','flat'],['preset','sync','flat']]){
     d.nodes[preset].listeners.get('click')!();await d.nodes[apply].listeners.get('click')!();expect(d.storage.getItem(M2R_GATE_KEY)).toBeNull();observe();
     await d.nodes[restore].listeners.get('click')!();expect(d.nodes.obsStereo.value).toBe('U');observe(true);
   }
   expect(actions).toEqual(['restoreNine','applyBand','restoreBand','syncNine','restoreNine','syncNine','restoreNine']);expect(JSON.parse(d.storage.getItem(M2R_GATE_KEY)!)).toMatchObject({version:1,validated:true});
   d.nodes.obsStereo.value='R';d.nodes.record.listeners.get('click')!();expect(d.storage.getItem(M2R_GATE_KEY)).toBeNull();expect(d.nodes.flat.disabled).toBe(false);
 });
 it('rejects unsafe positive edits before transport and prevents accumulating single-band Apply',async()=>{
   const actions:string[]=[];class MockBridge extends RamBridge{async connect(){return {ok:true,log:'MOCK'};}async run(a:Parameters<RamBridge['run']>[0]){actions.push(a);return {ok:true,log:'MOCK'};}}
   const d=startup(false,MockBridge);await d.nodes.connect.listeners.get('click')!();await d.nodes.flat.listeners.get('click')!();d.nodes.safe.listeners.get('click')!();await d.nodes.apply.listeners.get('click')!();
   d.nodes.selection.value='0';await d.nodes.apply.listeners.get('click')!();expect(actions).toEqual(['restoreNine','applyBand']);
   await d.nodes.flat.listeners.get('click')!();const input=d.nodes.bands.children[0].children[2].children[0];input.value='13';input.listeners.get('input')!();await d.nodes.sync.listeners.get('click')!();expect(actions).toEqual(['restoreNine','applyBand','restoreNine']);expect(d.nodes.flat.disabled).toBe(false);
 });
 it('renders all nine rows and enables Connect with zero startup fetch/session calls',()=>{
   const d=startup();expect(d.nodes.bands.children).toHaveLength(9);expect(d.nodes.selection.children).toHaveLength(9);
   expect(d.nodes.connect.disabled).toBe(false);expect(d.nodes.connect.listeners.has('click')).toBe(true);
   expect(d.nodes.apply.disabled).toBe(true);expect(d.calls()).toBe(0);expect(d.nodes.log.value).toContain('M2R UI READY');
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
     expect(d.nodes.apply.disabled).toBe(true);expect(d.nodes.restore.disabled).toBe(false);
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
