import type {Band} from '../../src/main.ts';
import {describe,it,expect,vi} from 'vitest';
import {FreeDspWebHid,isFreeDsp,isCafDevice,selectCafDevice,detachFreeDsp} from '../../src/freedsp/webHid.ts';
import {encodeCaf,parseCaf} from '../../src/freedsp/cafCodec.ts';
import {freeDspDefaultBands} from '../../src/freedsp/editor.ts';
import {modelWebBand,unityPreset,mixedPreset} from '../../src/freedsp/webRam.ts';
import vectors from './fixtures/nativeM2sVectors.json';
import {henryM2ADescriptor} from './fixtures/henryM2ADescriptor.ts';
import fnSource from '../../src/fn.ts?raw';import dspSource from '../../src/dsp.ts?raw';import mainSource from '../../src/main.ts?raw';import devSource from '../../scripts/dev.ps1?raw';
import html from '../../index.html?raw';import helpersSource from '../../src/helpers.ts?raw';
import ts from 'typescript';
// @ts-expect-error Node VM only, no Node types in browser project.
import {runInNewContext} from 'node:vm';
function mock(){
 const listeners=new Set<(e:HIDInputReportEvent)=>void>(),sent:Uint8Array[]=[],logs:string[]=[];
 const d={...henryM2ADescriptor,opened:true,addEventListener:(_n:string,f:(e:HIDInputReportEvent)=>void)=>listeners.add(f),removeEventListener:(_n:string,f:(e:HIDInputReportEvent)=>void)=>listeners.delete(f),sendReport:vi.fn(async(id:number,data:Uint8Array)=>{expect(id).toBe(1);expect(data).toHaveLength(61);sent.push(data.slice());const tx=parseCaf(1,new DataView(data.buffer));emit(encodeCaf(tx.command,tx.command===346?[62,5]:[],1).data);})} as unknown as HIDDevice;
 const emit=(data:Uint8Array,reportId=1,device=d)=>listeners.forEach(f=>f({device,reportId,data:new DataView(data.buffer,data.byteOffset,data.byteLength)} as HIDInputReportEvent));
 return {d,emit,sent,logs,listeners,c:new FreeDspWebHid(d,s=>logs.push(s),25)};
}
function extracted(name:string,source:string){const ast=ts.createSourceFile('source.ts',source,ts.ScriptTarget.ES2022,true);const n=ast.statements.find(x=>ts.isFunctionDeclaration(x)&&x.name?.text===name)!;return ts.transpileModule(n.getText(ast).replace('export ',''),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;}
describe('M2S upstream WebHID mock only',()=>{
 it('actual C# native-export vectors equal WebHID body with only ID framing removed',()=>{
  expect(vectors).toHaveLength(21);
  for(const v of vectors){const native=Uint8Array.from(atob(v.helper),c=>c.charCodeAt(0));let report;
   if(v.command===190){const b=unityPreset()[v.index!];report=modelWebBand({...b,freq:1000,gain:v.gain!,q:1},5,false,v.path!).bytes;}
   else report=encodeCaf(v.command,v.command===188?[1,...Array(12).fill(0)]:v.command===187?[0]:[62,...Array(12).fill(0)]).helper;
   expect([...report]).toEqual([...native]);expect(native[0]).toBe(1);expect(report.slice(1)).toHaveLength(61);
  }
 });
 it('chooses exact consumer CAF collection, rejects ambiguity and unrelated device',()=>{
  const f=mock(),other={...f.d,collections:[{usagePage:0xff00}]} as HIDDevice;
  expect(selectCafDevice([other,f.d])).toBe(f.d);expect(()=>selectCafDevice([f.d,f.d])).toThrow();expect(isCafDevice(other)).toBe(false);expect(isFreeDsp({...f.d,productId:1})).toBe(false);f.c.dispose();
 });
 it('registers before send, handles synchronous reply race, sends18paired packets once at queried rate',async()=>{
  const f=mock(),b=mixedPreset();b[2].enabled=false;await f.c.sync(b);
  expect(f.sent).toHaveLength(21);expect(f.sent.slice(0,3).map(x=>parseCaf(1,new DataView(x.buffer)).command)).toEqual([188,187,346]);
  const writes=f.sent.slice(3).map(x=>parseCaf(1,new DataView(x.buffer)));
  expect(writes.map(x=>x.words.slice(0,2))).toEqual(Array.from({length:9},(_,i)=>[[0,i+1],[1,i+1]]).flat());
  for(let i=0;i<18;i+=2)expect(writes[i].words.slice(2)).toEqual(writes[i+1].words.slice(2));
  expect(writes[4].words.slice(3,8)).toEqual([4194304,0,0,0,0]);expect(f.logs.at(-1)).toContain('protocol complete');f.c.dispose();
 });
 it('precomputes snapshot before first SET, so later editor mutation never changes plan',async()=>{
  const f=mock(),b=mixedPreset(),expected=modelWebBand(b[8],5).bytes.slice(1),send=f.d.sendReport;
  f.d.sendReport=vi.fn(async(id,data)=>{b[8].gain=NaN;return send.call(f.d,id,data);});await f.c.sync(b);expect([...f.sent[19]]).toEqual([...expected]);f.c.dispose();
 });
 it('ignores nonreply, wrong ID/module/command/device and idle stale report before matching ACK',async()=>{
  const f=mock();f.emit(encodeCaf(188,[],1).data);const send=f.d.sendReport;
  f.d.sendReport=vi.fn(async(id,data)=>{const tx=parseCaf(1,new DataView((data as Uint8Array).buffer));f.emit(encodeCaf(tx.command,[],0).data);f.emit(encodeCaf(tx.command,[],1).data,2);f.emit(encodeCaf(90,[],1).data);f.emit(encodeCaf(tx.command,[],1,0,1).data);f.emit(encodeCaf(tx.command,[],1).data,1,{} as HIDDevice);return send.call(f.d,id,data);});
  await f.c.sync(unityPreset());expect(f.sent).toHaveLength(21);f.c.dispose();
 });
 it('timeout stops before subsequent SET, no retry, does not accept late old-send completion',async()=>{
  vi.useFakeTimers();try{const f=mock();f.d.sendReport=vi.fn(()=>Promise.resolve());const p=f.c.sync(unityPreset());const reject=expect(p).rejects.toThrow('TIMEOUT');await vi.advanceTimersByTimeAsync(30);await reject;expect(f.d.sendReport).toHaveBeenCalledTimes(1);await expect(f.c.sync(unityPreset())).rejects.toThrow('STOP');expect(f.logs.join()).not.toContain('protocol complete');f.c.dispose();}finally{vi.useRealTimers();}
 });
 it('unsafe/invalid final band blocks all SET; invalid editor never blocks explicit unity Restore',async()=>{
  const f=mock(),b=unityPreset();b[8].gain=13;await expect(f.c.sync(b)).rejects.toThrow('無效');expect(f.sent).toHaveLength(0);b[8].freq=NaN;await expect(f.c.sync(b)).rejects.toThrow();await f.c.sync(b,true);expect(f.sent).toHaveLength(21);expect(f.sent.slice(3).every(x=>parseCaf(1,new DataView(x.buffer)).words[3]===4194304)).toBe(true);f.c.dispose();
 });
 it('send failure stops, explicit unity recovery allowed, disconnect cancels pending and detaches listener',async()=>{
  const f=mock(),send=f.d.sendReport;f.d.sendReport=vi.fn(()=>Promise.reject(new Error('SENDFAIL')));await expect(f.c.sync(unityPreset())).rejects.toThrow('SENDFAIL');expect(f.d.sendReport).toHaveBeenCalledTimes(1);f.d.sendReport=send;await f.c.sync([],true);f.c.dispose();expect(f.listeners.size).toBe(0);await expect(f.c.sync([])).rejects.toThrow();
 });
 it('actual normal CONNECT chooser uses native metadata only and no auto commands/readback/preamp',async()=>{
  const f=mock();f.c.dispose();Object.defineProperty(f.d,"opened",{value:false,writable:true});const order:string[]=[];f.d.open=vi.fn(async()=>{order.push('open');Object.defineProperty(f.d,"opened",{value:true,writable:true});});
  const elements:Record<string,{style:Record<string,string>;classList:{remove:()=>void;add:()=>void};innerText?:string}>={};
  const ctx={device:null,window:{},document:{getElementById:(id:string)=>elements[id]||null},navigator:{hid:{requestDevice:vi.fn(async()=>[f.d])}},activeDacs:[],VID_AUDIOCULAR:1,VID_SAVITECH_OFFICIAL:2,VID_SAVITECH:3,VID_SAVITECH_ALT:4,VID_COMTRUE:5,VID_FIIO:6,
   isExperimentalFreeDspActive:()=>false,isFreeDsp,selectCafDevice,connectFreeDsp:async()=>{order.push('native metadata');},log:vi.fn(),console:{debug(){}},localStorage:{getItem:()=>null,setItem:vi.fn()},adjustBandsForDevice:vi.fn(),identifyConnectedDac:vi.fn(),getProtocol:()=> 'CONEXANT',enableControls:vi.fn(),configureFreeDspUI:vi.fn(),setupListener:vi.fn(),eqState:unityPreset(),renderUI:vi.fn(),autoPreampEnabled:false};
  await runInNewContext(extracted('connectToDevice',fnSource)+'\nconnectToDevice()',ctx);expect(order).toEqual(['native metadata']);expect(f.d.open).not.toHaveBeenCalled();expect(ctx.device).toBe(f.d);expect(f.sent).toHaveLength(0);expect(ctx.configureFreeDspUI).toHaveBeenCalledWith(true);expect(ctx.log.mock.calls.join()).not.toContain('Connection Error');detachFreeDsp(f.d);
  const other={...f.d,productId:1,open:vi.fn(async()=>{})} as unknown as HIDDevice;ctx.navigator.hid.requestDevice.mockResolvedValue([other]);ctx.device=null;Object.assign(ctx,{loadManualPreampState:vi.fn(),configurePreampUI:vi.fn(),globalGainState:0});
  await runInNewContext(extracted('connectToDevice',fnSource)+'\nconnectToDevice()',ctx);expect(other.open).toHaveBeenCalledOnce();expect(order).toEqual(['native metadata']);expect(ctx.device).toBe(other);
 });
 it('actual connected graph edit callback sends no realtime writes; other DAC callback retains queue',async()=>{
  const state=unityPreset(),queue=vi.fn(),ctx={device:mock().d,eqState:state,autoPreampEnabled:false,isFreeDsp,parseFloat,Math,Boolean,setEQ:(i:number,k:keyof Band,v:never)=>{state[i][k]=v;},renderUI:vi.fn(),setLastAppliedEqName:vi.fn(),queueRealtimeBandWrite:queue};
  const update=runInNewContext(extracted('updateState',fnSource)+'\nupdateState',ctx);await update(4,'gain','3');await update(4,'freq','900');await update(4,'q','2');expect(queue).not.toHaveBeenCalled();ctx.device={...ctx.device,productId:1} as HIDDevice;await update(4,'gain','2');expect(queue).toHaveBeenCalledTimes(1);
 });
 it('failure on second stereo write stops at wire1 RIGHT without any later SET or retry',async()=>{
  const f=mock(),send=f.d.sendReport;let calls=0;f.d.sendReport=vi.fn(async(id,data)=>{if(++calls===5)throw new Error('wire1RIGHT');return send.call(f.d,id,data);});await expect(f.c.sync(mixedPreset())).rejects.toThrow('wire1RIGHT');expect(f.d.sendReport).toHaveBeenCalledTimes(5);expect(f.logs.join()).toContain('WIRE1 LEFT PASS');expect(f.logs.join()).not.toContain('WIRE1 RIGHT PASS');expect(f.logs.join()).not.toContain('protocol complete');f.c.dispose();
 });
 it('actual generic Sync only calls adapter on explicit FreeDSP request, blocks unsupported local controls',async()=>{
  const f=mock(),sync=vi.fn(async()=>{}),ctx={getDevice:()=>f.d,getEqState:unityPreset,isFreeDsp,showSyncing:vi.fn(),hideSyncing:vi.fn(),getGlobalGainState:()=>0,getAutoPreampEnabled:()=>false,getBassTiltState:()=>0,getTrebleTiltState:()=>0,attachFreeDsp:()=>({sync}),localStorage:{setItem:vi.fn()},log:vi.fn()};
  const run=runInNewContext(extracted('syncToDevice',dspSource)+'\n syncToDevice',ctx);await run();expect(sync).not.toHaveBeenCalled();await run(true);expect(sync).toHaveBeenCalledTimes(1);ctx.getBassTiltState=()=>1;await expect(run(true)).rejects.toThrow('preamp/tilt');expect(sync).toHaveBeenCalledTimes(1);f.c.dispose();
 });
 it('connected FreeDSP exposes Restore in Hardware Memory Controls, disables aliases/Flash; disconnect restores generic controls',()=>{
  class Node{hidden=true;disabled=false;textContent='';style={display:'none',flexWrap:''};title='';attrs=new Map<string,string>();setAttribute(k:string,v:string){this.attrs.set(k,v);}removeAttribute(k:string){this.attrs.delete(k);}}
  const nodes=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Node()]));
  const ctx={configureFreeDspControlNotes:vi.fn(),resetTiltState:vi.fn(),updateGlobalGainUI:vi.fn(),window:{},document:{getElementById:(id:string)=>nodes[id]||null,querySelectorAll:(q:string)=>q.startsWith('.utility')?[]:[nodes.btnSync,nodes.btnSendToDevice,nodes.btnFlash]},setAutoPreampEnabled:vi.fn(),setGlobalGainState:vi.fn(),setBassTiltState:vi.fn(),setTrebleTiltState:vi.fn(),t:()=> 'SAVE TO FLASH'};
  const configure=runInNewContext(extracted('configureFreeDspUI',fnSource)+'\nconfigureFreeDspUI',ctx);configure(true);
  expect(nodes.btnFreeDspRestore.hidden).toBe(false);expect(nodes.btnFreeDspRestore.disabled).toBe(false);expect(nodes.btnFreeDspRestore.style.display).toBe('flex');expect(nodes.btnSendToDevice.disabled).toBe(true);expect(nodes.btnFlash.disabled).toBe(true);expect(nodes.freeDspStorageNote.hidden).toBe(false);expect(nodes.freeDspRamStatus.textContent).toContain('LOCAL EDITOR');expect(nodes.hardwareMemoryActions.style.flexWrap).toBe('wrap');
  expect(html).toContain('RESTORE FREEDSP RAM TO UNITY');expect(html).toMatch(/Hardware Memory Controls[\s\S]*?btnFreeDspRestore[\s\S]*?<\/div>\s*<p id="freeDspStorageNote"/);
  configure(false);const enable=runInNewContext(extracted('enableControls',helpersSource)+'\nenableControls',ctx);enable(true);expect(nodes.btnFreeDspRestore.hidden).toBe(true);expect(nodes.btnSendToDevice.disabled).toBe(false);expect(nodes.btnFlash.disabled).toBe(false);expect(nodes.hardwareMemoryActions.style.flexWrap).toBe('');
 });
 it('actual main Restore handler calls existing WebHID unity path with invalid editor untouched; errors STOP without retries',async()=>{
  const f=mock(),editor=mixedPreset();editor[0].q=NaN;const snapshot=editor.map(b=>({...b}));const listeners=new Map<string,()=>Promise<void>>(),button={disabled:false,addEventListener:(name:string,fn:()=>Promise<void>)=>listeners.set(name,fn)},status={textContent:''};
  const ctx={getDevice:()=>f.d,isFreeDsp,attachFreeDsp:()=>f.c,showSyncing:vi.fn(),hideSyncing:vi.fn(),log:(s:string)=>f.logs.push(s),document:{getElementById:(id:string)=>id==='btnFreeDspRestore'?button:status}};
  const restore=runInNewContext(extracted('restoreFreeDspUnity',dspSource)+'\nrestoreFreeDspUnity',ctx);runInNewContext(ts.transpileModule(mainSource.slice(mainSource.indexOf('function setFreeDspRamStatus')),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,{...ctx,restoreFreeDspUnity:restore});
  await listeners.get('click')!();expect(editor).toEqual(snapshot);const writes=f.sent.slice(3).map(b=>parseCaf(1,new DataView(b.buffer)));expect(writes).toHaveLength(18);expect(writes.map(x=>x.words.slice(0,2))).toEqual(Array.from({length:9},(_,i)=>[[0,i+1],[1,i+1]]).flat());expect(writes.every(x=>x.command===190&&x.words.slice(3,8).join()=== '4194304,0,0,0,0')).toBe(true);expect(status.textContent).toContain('LOCAL EDITOR未修改');expect(button.disabled).toBe(false);
  const failed=vi.fn(()=>Promise.reject(new Error('MOCK FAIL')));f.d.sendReport=failed;await listeners.get('click')!();expect(failed).toHaveBeenCalledTimes(1);expect(status.textContent).toContain('STOP');expect(button.disabled).toBe(false);expect(editor).toEqual(snapshot);f.c.dispose();
 });
 it('actual Slot A/B/OFF changes local snapshots only for FreeDSP and keeps its default at9; other DAC still syncs',async()=>{
  const f=mock(),sync=vi.fn(),ctx={device:f.d,getProtocol:()=> 'CONEXANT',eqState:mixedPreset(),globalGainState:0,lastAppliedEqName:'Mixed',slotA:null,slotB:null,activeSlot:'A',isFreeDsp,unityPreset,freeDspDefaultBands,defaultEqState:()=>Array.from({length:10},(_,index)=>({...unityPreset()[0],index})),renderUI:vi.fn(),setGlobalGain:vi.fn(),syncToDevice:sync,updateSlotLabel:vi.fn(),t:()=> 'Flat',localStorage:{setItem:vi.fn()},log:vi.fn()};
  Object.assign(ctx,{setEqState:(b:typeof ctx.eqState)=>{ctx.eqState=b;}});const set=runInNewContext(extracted('setABCompareState',fnSource)+'\nsetABCompareState',ctx);const before=ctx.eqState.map(b=>({...b}));await set('B');expect(ctx.eqState).toHaveLength(9);expect(ctx.eqState.every(b=>b.gain===0)).toBe(true);await set('A');expect(ctx.eqState).toEqual(before);await set('Off');expect(sync).not.toHaveBeenCalled();expect(f.sent).toHaveLength(0);
  ctx.device={...f.d,productId:1} as HIDDevice;await set('B');expect(sync).toHaveBeenCalledTimes(1);expect(ctx.eqState).toHaveLength(10);f.c.dispose();
 });
 it('normal UI has one CONNECT workflow, explicit Sync dispatch; helper managed by dev',()=>{
  expect(mainSource).not.toContain('mountGraphicalRam');expect(mainSource).toContain('await syncToDevice(true)');expect(dspSource).toContain('if(!explicit)return');expect(dspSource).toContain('if(isFreeDsp(device))return; // Explicit RAM Sync only');expect(devSource).toContain('[switch]$WebHidOnly');expect(devSource).toContain('if (-not $WebHidOnly)');expect(devSource).toContain('serveTransport');
 });
});
