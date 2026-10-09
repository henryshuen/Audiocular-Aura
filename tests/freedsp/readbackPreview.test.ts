import {describe,it,expect,vi} from 'vitest';
import capture from './fixtures/henryNineReadback20261009.json';
import repeat from './fixtures/codexNineReadback20261009.json';
import api from './fixtures/codexApiReadback20261009.json';
import sdk from './fixtures/officialReadbackStaticEvidence.json';
import {decodeReadbackReply,signed24Container} from '../../src/freedsp/readback.ts';
import {validateReadbackPreview,previewResponse,loadReadbackPreview} from '../../src/freedsp/readbackPreview.ts';
import {NativeCafTransport} from '../../src/freedsp/nativeTransport.ts';
import {CafRamSession} from '../../src/freedsp/cafRam.ts';
import {nativePeakFloat,nativeScaling} from '../../scripts/freedsp/ram-semantics.mjs';
const clone=()=>structuredClone(capture);
function documentStub(){const nodes=Object.fromEntries(['freeDspReadbackPreview','freeDspRamStatus','lastAppliedEqDisplay'].map(id=>[id,{hidden:true,innerHTML:'',textContent:'Device EQ Unknown — Local Editor',style:{display:'none'}}]));return {nodes,doc:{getElementById:(id:string)=>nodes[id]} as unknown as Document};}
describe('live captured readback and CONNECT preview — offline replay only',()=>{
 it('both actual captures match all18 raw replies, eachSET1/GET1, without freshness inference',()=>{
  const p=validateReadbackPreview(capture),q=validateReadbackPreview(repeat);expect(p.bands).toEqual(q.bands);expect(validateReadbackPreview(api).bands).toEqual(p.bands);expect(p.coefficients).toEqual(q.coefficients);
  expect(capture.records.every(r=>r.sets===1&&r.gets===1)).toBe(true);expect(p.source).toBe('UNVERIFIED');expect(p.fullReadback).toBe('BLOCKED');
 });
 it('revalidates477 SDK offsets and signedJava-byte getter against actualnegative24containers',()=>{
  const getter=sdk.methods.find(m=>m.method==='getEQParamList')!;expect(getter.instructions).toContainEqual({offset:246,op:'invoke-static',args:'v3, v5, Lcom/conexant/universalfunction/CommonUtil;->formatByteToSingedInt([B I)I'});
  const sign=sdk.methods.find(m=>m.method==='formatByteToSingedInt')!;expect(sign.instructions.filter(i=>i.op==='aget-byte')).toHaveLength(4);
  for(let value=-16;value<=6;value++){const w=value&0xffffff,b=[w&255,(w>>>8)&255,(w>>>16)&255,(w>>>24)&255],signed=(n:number)=>(n<<24)>>24;const java=signed(b[0])|(signed(b[1])<<8)|(signed(b[2])<<16)|(signed(b[3])<<24);expect(java).toBe(value);expect(signed24Container(w)).toBe(value);}
  const p=validateReadbackPreview(capture);expect(p.bands.map(b=>b.frequency)).toEqual([220,750,1250,2000,3000,4000,6300,60,4500]);expect(p.bands.map(b=>b.gainDb)).toEqual([-1,1,-2,-1,-2,-2,1,-7,0]);expect(p.bands.map(b=>b.qRaw)).toEqual([256,460,640,256,512,512,1280,102,256]);expect(p.bands.every(b=>b.filterTypeRaw===0&&b.enabled===null)).toBe(true);
  expect(p.bands[1].q).toBe(1.796875);expect(p.bands[7].q).toBe(.3984375);expect(()=>signed24Container(0x1000000)).toThrow();
 });
 it('allnine coefficient models agree withinnativequantization; band4 cannot justify-1.5',()=>{
  const p=validateReadbackPreview(capture);expect(p.sameEffectiveModel).toEqual(Array(9).fill(true));
  const f=nativePeakFloat({frequency:2000,gainDb:-1.5,q:1,sampleHz:48000}).coefficients,scale=nativeScaling(f);expect(Math.max(...p.coefficients[3].coefficients.map((v,i)=>Math.abs(v-Math.round(Math.fround(f[i]*scale.scale)))))).toBe(27554);
  const points=previewResponse(p);expect(points).toHaveLength(257);expect(points.every(p=>Number.isFinite(p.db))).toBe(true);expect(Math.min(...points.map(p=>p.db))).toBeLessThan(-6);
 });
 it('partial/malformed/wrongdevice/wire/path/command/module/stale/late inputs never yieldpartialpreview',()=>{
  for(const mutate of [(r:any)=>r.records.pop(),(r:any)=>r.completeQuerySet=false,(r:any)=>r.vendorId=1,(r:any)=>r.records[1]=r.records[0],(r:any)=>r.records[0].sets=2,(r:any)=>r.records[0].observations[0].ElapsedMs=1000,
   (r:any)=>{const b=Uint8Array.from(atob(r.records[0].observations[0].RawBase64),c=>c.charCodeAt(0));b[10]=1;r.records[0].observations[0].RawBase64=btoa(String.fromCharCode(...b));},
   (r:any)=>{const b=Uint8Array.from(atob(r.records[9].observations[0].RawBase64),c=>c.charCodeAt(0));b[6]=1;r.records[9].observations[0].RawBase64=btoa(String.fromCharCode(...b));}]){const r=clone();mutate(r);expect(()=>validateReadbackPreview(r)).toThrow();}
  const raw=Uint8Array.from(atob(capture.records[0].observations[0].RawBase64),c=>c.charCodeAt(0));raw[2]=9;expect(()=>decodeReadbackReply(raw,446,1)).toThrow();
 });
 it('publishes validated snapshot to existing UI without duplicate graph or local edits',async()=>{
  const {nodes,doc}=documentStub(),local=[{gain:-3.5,freq:999}],before=structuredClone(local),read=vi.fn(async()=>capture),log=vi.fn();
  const p=await loadReadbackPreview(read,()=>true,log,doc);expect(p?.bands).toHaveLength(9);expect(nodes.freeDspReadbackPreview.innerHTML).toBe('');expect(local).toEqual(before);expect(read).toHaveBeenCalledOnce();
  expect(nodes.lastAppliedEqDisplay.textContent).toContain('not Active RAM');expect(nodes.freeDspRamStatus.textContent).toContain('enabled unavailable');
 });
 it('disconnect/reconnect race discards old results; failed read preservesUnknown andlocaleditor',async()=>{
  const {nodes,doc}=documentStub();let resolve!:(x:unknown)=>void,current=true;const old=loadReadbackPreview(()=>new Promise(r=>{resolve=r;}),()=>current,vi.fn(),doc);
  current=false;resolve(capture);await old;expect(nodes.freeDspReadbackPreview.hidden).toBe(true);
  await loadReadbackPreview(async()=>({...capture,records:[]}),()=>true,vi.fn(),doc);expect(nodes.lastAppliedEqDisplay.textContent).toBe('Readback unavailable — Local Editor');expect(nodes.freeDspReadbackPreview.hidden).toBe(true);
 });
 it('nativepreviewonlycallsfixedauthenticatedreadbackendpoint,noRAM/Flash/modeexchange',async()=>{
  const requests:string[]=[],fetcher=vi.fn(async(url:unknown,init?:RequestInit)=>{const path=String(url).split('5174')[1];requests.push(path);if(path==='/session')return Response.json({token:'A'.repeat(64),mode:'M2S CAF TRANSPORT'});expect(init?.headers).toMatchObject({'X-AuraPEQ-Session':'A'.repeat(64)});return Response.json({ok:true,exitCode:0,readback:capture});});
  const t=new NativeCafTransport(()=>{},fetcher as typeof fetch),session=new CafRamSession(t,()=>{});await t.connect();const p=validateReadbackPreview(await session.readback());expect(p.bands).toHaveLength(9);expect(requests).toEqual(['/session','/connect','/readback']);session.dispose();await expect(session.readback()).rejects.toThrow();
 });
 it('sharedsessionbusyanddisposegatesblockoverlap andstalereturnwithoutwrite',async()=>{
  let finish!:(v:unknown)=>void;const exchange=vi.fn(),transport={exchange,dispose:vi.fn(),readback:()=>new Promise<unknown>(r=>{finish=r;})};const session=new CafRamSession(transport,()=>{}),read=session.readback();await expect(session.readback()).rejects.toThrow('BUSY');await expect(session.sync([],true)).rejects.toThrow('BUSY');session.dispose();finish(capture);await expect(read).rejects.toThrow('Stale');expect(exchange).not.toHaveBeenCalled();
 });
});
