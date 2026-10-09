import {describe,it,expect,vi} from 'vitest';
import {buildFlashPlan,executeFlashPlan,flashTestPreset,saveFlashRecovery} from '../../src/freedsp/flash.ts';
import {CafRamSession} from '../../src/freedsp/cafRam.ts';
import {NativeCafTransport} from '../../src/freedsp/nativeTransport.ts';
import {encodeCaf,parseCaf} from '../../src/freedsp/cafCodec.ts';
import {modelWebBand,unityPreset} from '../../src/freedsp/webRam.ts';
import analysis from './fixtures/officialAppDumpAnalysis.json';
import source from './fixtures/officialFreemanControlStaticEvidence.json';
import mainSource from '../../src/main.ts?raw';
import dspSource from '../../src/dsp.ts?raw';
import ts from 'typescript';
import profileText from './fixtures/freeDspFlashTest.txt?raw';
import importSource from '../../src/importExport.ts?raw';
import savedFlashEvidence from './fixtures/officialFlashEvidence.json';
import {analyzeFlash} from '../../scripts/freedsp/analyze-flash.mjs';
// @ts-expect-error Node VM is test-only; no Node types in production project.
import {runInNewContext} from 'node:vm';
const parse=(data:Uint8Array)=>parseCaf(1,new DataView(data.buffer,data.byteOffset,61));
const ack=(command:number)=>parse(encodeCaf(command,[],1).data);
function mock(fail=0,mismatch=0){
 const reports:Uint8Array[]=[],logs:string[]=[];
 const transport={supportsFlash:true,dispose:vi.fn(),exchange:vi.fn(async(command:number,data:Uint8Array)=>{
   reports.push(data.slice());if(reports.length===fail)throw new Error('MOCK timeout');
   return ack(reports.length===mismatch?259:command);
 })};return {transport,reports,logs,log:(s:string)=>logs.push(s)};
}
describe('FreeDSP Flash evidence/plan; offline mocks only',()=>{
 it('reproduces saved55-pair evidence and imports the exact safe9-band test through existing parser',()=>{
   expect(analyzeFlash()).toEqual(savedFlashEvidence);
   const ast=ts.createSourceFile('import.ts',importSource,ts.ScriptTarget.ES2022,true);
   const bodies=ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&['neutralBand','parseTextProfile'].includes(n.name?.text||'')).map(n=>n.getText(ast)).join('\n');
   const parse=runInNewContext(ts.transpileModule(bodies,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText+'\nparseTextProfile',{getEqState:flashTestPreset});
   expect(parse(profileText)).toEqual({globalGain:0,bands:flashTestPreset()});
 });
 it('real FreeDSP Save dispatch never composes Tone/preamp or falls through generic sender',async()=>{
   const ast=ts.createSourceFile('dsp.ts',dspSource,ts.ScriptTarget.ES2022,true);
   const node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='flashToFlash')!;
   const bands=flashTestPreset(),f=mock(),session=new CafRamSession(f.transport,f.log),generic=vi.fn(),tilt=vi.fn();
   const save=runInNewContext(ts.transpileModule(node.getText(ast).replace('export ',''),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText+'\nflashToFlash',{
     getDevice:()=>({vendorId:0x35d8,productId:0x1496}),isFreeDsp:()=>true,confirm:()=>true,freeDspOverwriteWarning:'Device EQ Unknown',getEqState:()=>bands,
     attachFreeDsp:()=>({flash:(b:typeof bands)=>session.flash(b,()=>{})}),showSyncing:vi.fn(),hideSyncing:vi.fn(),log:vi.fn(),
     getProtocol:generic,sendConexantReport:generic,getTiltGainAtFreq:tilt,
   });
   expect(await save()).toBe(true);expect(f.reports).toHaveLength(56);expect(generic).not.toHaveBeenCalled();expect(tilt).not.toHaveBeenCalled();
   expect(bands).toEqual(flashTestPreset());
 });
 it('real non-FreeDSP permanent Save still takes unchanged Savitech command and local baseline flow',async()=>{
   const ast=ts.createSourceFile('dsp.ts',dspSource,ts.ScriptTarget.ES2022,true);
   const node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='flashToFlash')!;
   const send=vi.fn(),log=vi.fn(),baseline=vi.fn(),hide=vi.fn();
   const f=runInNewContext(ts.transpileModule(node.getText(ast).replace('export ',''),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText+'\nflashToFlash',{
     getDevice:()=>({vendorId:1,productId:1}),isFreeDsp:()=>false,confirm:()=>true,getProtocol:()=> 'SAVITECH',
     showSyncing:vi.fn(),hideSyncing:hide,sendPacketSavitech:send,log,updateBaselineFromActive:baseline,
     getLastAppliedEqName:()=>null,setLastAppliedEqName:vi.fn(),
     CMD_SAVI:{WRITE:1,FLASH:22,END:0},
   });
   await f();expect(send).toHaveBeenCalledOnce();expect(log).toHaveBeenCalledWith('Saved permanently to Flash.');expect(baseline).toHaveBeenCalledOnce();expect(hide).toHaveBeenCalledOnce();
   expect(mainSource).toContain('if(isFreeDsp(getDevice()))await saveFreeDspFlash();else await flashToFlash();');
 });
 it('official55 packets are9 metadata then45 band/rate coefficients then255 commit, RX count0',()=>{
   const observed=analysis.pairs.filter(p=>p.command===220);
   expect(observed).toHaveLength(55);
   expect(observed.slice(0,9).map(p=>p.txWords.slice(0,2))).toEqual(Array.from({length:9},(_,i)=>[0,i+1]));
   expect(observed.slice(9,54).map(p=>p.txWords.slice(0,2))).toEqual(Array.from({length:9},(_,i)=>[4,5,6,7,8].map(r=>[r,i+1])).flat());
   expect(observed.at(-1)!.txWords).toEqual([255,...Array(12).fill(0)]);
   expect(observed.every(p=>p.rxCount===0)).toBe(true);
   expect(analysis.pairs[0].txWords).toEqual([90,0,...Array(11).fill(0)]);
 });
 it('pinned full source uses gain directly, Q*256, literal255, rate4..8 and no hidden setup/post mode',()=>{
   const m=source.methods.find(m=>m.method==='saveEQParamsToFlash')!;
   const at=(offset:number)=>m.instructions.find(i=>i.offset===offset)!;
   expect(at(146).opcode).toBe('double-to-long');expect(at(206).opcode).toBe('double-to-long');
   expect(at(202).args).toContain('EQParam;->gain');expect(at(208).opcode).toBe('aput-wide');
   expect(at(436).args).toBe('v3, v12');expect(at(112).args).toBe('v12, 4');expect(at(438).args).toBe('v8, 8');
   expect(at(1026).args).toBe('v1, 255');
   expect(m.instructions.some(i=>/setFreeman3EQEnabled|setEQCFGIsBypass|getCurSampleRate|switchEQMode/.test(i.args))).toBe(false);
   expect(at(954).args).toContain('v7, v6');expect(at(906).args).toContain('v7, v7');
 });
 it('complete56 plan has official order, correct metadata signed integer dB, dynamic same RAM coefficients',()=>{
   const b=flashTestPreset();b[4].gain=-6.75;b[4].q=.7;
   const plan=buildFlashPlan(b),r=plan.packets.map(p=>parse(p.data));
   expect(r.map(r=>r.command)).toEqual([90,...Array(55).fill(220)]);
   expect(r[5].words).toEqual([0,5,1000,179,0,-6,...Array(7).fill(0)]);
   expect(r.slice(10,55).map(r=>r.words.slice(0,2))).toEqual(Array.from({length:9},(_,i)=>[4,5,6,7,8].map(rate=>[rate,i+1])).flat());
   for(let band=0;band<9;band++)for(let i=0;i<5;i++){
     expect(r[10+band*5+i].words.slice(2)).toEqual(modelWebBand(b[band],4+i).payload.slice(2));
   }
   expect(r.at(-1)!.words).toEqual([255,...Array(12).fill(0)]);
   expect([...plan.packets.at(-1)!.data.slice(9,13)]).toEqual([255,0,0,0]);
   expect(b[4].gain).toBe(-6.75);
 });
 it('disabled band persists metadata gain0 and identity in all five banks',()=>{
   const b=flashTestPreset();b[4].enabled=false;const p=buildFlashPlan(b);
   expect(parse(p.packets[5].data).words[5]).toBe(0);
   for(const packet of p.packets.slice(30,35))expect(parse(packet.data).words.slice(2,8)).toEqual([3,4194304,0,0,0,0]);
   expect(p.editor[4]).toMatchObject({gain:-6,enabled:false});
 });
 it('exact56 ACKs including commit complete; no RAM190/prerequisites/other utilities',async()=>{
   const f=mock();await executeFlashPlan(f.transport,buildFlashPlan(flashTestPreset()),f.log);
   expect(f.reports).toHaveLength(56);expect(f.logs.at(-1)).toContain('not independently checked');
   expect(f.reports.every(p=>[90,220].includes(parse(p).command))).toBe(true);
 });
 it('failure at any request stops exactly there; no automatic retry/rollback/commit after failure',async()=>{
   for(let n=1;n<=56;n++){
     const f=mock(n);await expect(executeFlashPlan(f.transport,buildFlashPlan(flashTestPreset()),f.log)).rejects.toThrow('timeout');
     expect(f.reports).toHaveLength(n);expect(f.logs.at(-1)).toContain(`ACKED=${n-1}/56`);
     expect(f.logs.join()).not.toContain('protocol complete');
   }
 });
 it('mismatched command/module/reply/count stops before next request',async()=>{
   const f=mock(0,4);await expect(executeFlashPlan(f.transport,buildFlashPlan(flashTestPreset()),f.log)).rejects.toThrow('mismatch');expect(f.reports).toHaveLength(4);
   for(const response of [{...ack(90),module:1},{...ack(90),reply:0},{...ack(90),count:1}]){
     const g=mock();g.transport.exchange=vi.fn(async()=>response);
     await expect(executeFlashPlan(g.transport,buildFlashPlan(flashTestPreset()),g.log)).rejects.toThrow('mismatch');expect(g.transport.exchange).toHaveBeenCalledOnce();
   }
 });
 it('invalid editor/storage failure/busy/STOP produces zero extra Flash writes; snapshot immutable',async()=>{
   const f=mock(),s=new CafRamSession(f.transport,f.log),save=vi.fn();
   for(const key of ['gain','q','freq'] as const){const b=flashTestPreset();b[8][key]=NaN;await expect(s.flash(b,save)).rejects.toThrow();}
   await expect(s.flash(flashTestPreset(),()=>{throw new Error('storage failed');})).rejects.toThrow('storage');
   expect(save).not.toHaveBeenCalled();expect(f.reports).toHaveLength(0);
   const stored=vi.fn();const b=flashTestPreset(),before=structuredClone(b);saveFlashRecovery(buildFlashPlan(b),{setItem:stored});
   expect(JSON.parse(stored.mock.calls[0][1]).editor).toEqual(before);expect(JSON.parse(stored.mock.calls[0][1]).unityPlan).toHaveLength(56);
   b[4].gain=-2;expect(JSON.parse(stored.mock.calls[0][1]).editor[4].gain).toBe(-6);
   const g=mock(2),c=new CafRamSession(g.transport,g.log);await expect(c.flash(before,()=>{})).rejects.toThrow();await expect(c.flash(before,()=>{})).rejects.toThrow('STOP');expect(g.reports).toHaveLength(2);
 });
 it('unsupported browser transport cannot perform Flash',async()=>{
   const f=mock();f.transport.supportsFlash=false;
   await expect(new CafRamSession(f.transport,f.log).flash(unityPreset(),()=>{})).rejects.toThrow('Native');expect(f.reports).toHaveLength(0);
 });
 it('Flash and RAM share one BUSY gate; saved snapshot is fixed before the first exchange',async()=>{
   const f=mock();let finish!:()=>void;
   f.transport.exchange.mockImplementationOnce(async()=>new Promise(resolve=>{finish=()=>resolve(ack(90));}));
   const s=new CafRamSession(f.transport,f.log),b=flashTestPreset(),saved=vi.fn();
   const pending=s.flash(b,saved);expect(saved).toHaveBeenCalledOnce();b[4].gain=-1;
   await expect(s.sync([],true)).rejects.toThrow('BUSY');await expect(s.flash(b,()=>{})).rejects.toThrow('BUSY');
   finish();await pending;
   expect(parse(f.reports[4]).words[5]).toBe(-6); // mock's first held mode exchange is not added to reports.
 });
 it('native HTTP primitive preserves every Flash helper byte and rejects mismatched response',async()=>{
   const reports:Uint8Array[]=[];let bad=false;
   const fetcher=vi.fn(async(url:unknown,init?:RequestInit)=>{
     if(String(url).endsWith('/session'))return Response.json({token:'A'.repeat(64),mode:'M2S CAF TRANSPORT'});
     if(String(url).endsWith('/connect'))return Response.json({ok:true,exitCode:0});
     const tx=Uint8Array.from(atob(JSON.parse(init!.body as string).report),c=>c.charCodeAt(0));reports.push(tx);
     const r=encodeCaf(bad?259:parse(tx.slice(1)).command,[],1).helper;
     return Response.json({ok:true,exitCode:0,reply:btoa(String.fromCharCode(...r))});
   }) as unknown as typeof fetch;
   const t=new NativeCafTransport(()=>{},fetcher);await t.connect();
   const p=buildFlashPlan(flashTestPreset());await executeFlashPlan(t,p,()=>{});
   expect(reports.map(b=>[...b.slice(1)])).toEqual(p.packets.map(p=>[...p.data]));
   bad=true;await expect(executeFlashPlan(t,p,()=>{})).rejects.toThrow('mismatch');expect(reports).toHaveLength(57);t.dispose();
 });
});
