import {decodeReadbackReply} from './readback.ts';
import {encodeCaf} from './cafCodec.ts';
import {nativePeakFloat,nativeScaling,nativeWordIntervals,officialRateHz} from '../../scripts/freedsp/ram-semantics.mjs';

type Metadata = ReturnType<typeof decodeReadbackReply> & {kind:'metadata'};
type Coefficients = ReturnType<typeof decodeReadbackReply> & {kind:'coefficients'};
export type ReadbackPreview={bands:Metadata[];coefficients:Coefficients[];capturedUtc:string;source:'UNVERIFIED';sameEffectiveModel:boolean[];fullReadback:'BLOCKED'};
const object=(v:unknown):Record<string,any>=>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Malformed readback evidence');return v as Record<string,any>;};
const raw=(v:unknown)=>{if(typeof v!=='string')throw Error('Missing raw reply');const b=Uint8Array.from(atob(v),c=>c.charCodeAt(0));if(b.length!==62)throw Error('Wrong raw length');return b;};
export function validateReadbackPreview(value:unknown):ReadbackPreview{
 const r=object(value);
 if(r.vendorId!==0x35d8||r.productId!==0x1496||r.completeQuerySet!==true||r.outcome!=='MATCHING_QUERY_SET_SOURCE_FRESHNESS_UNVERIFIED'||!Array.isArray(r.records)||r.records.length!==18||!Number.isFinite(Date.parse(r.startedUtc)))throw Error('Incomplete/wrong-device readback');
 const parsed=r.records.map((item:unknown,i:number)=>{
  const q=object(item),command=i<9?446:477,wire=i%9+1;
  if(q.command!==command||q.wire!==wire||q.path!==(command===446?0:null)||q.sets!==1||q.exitCode!==0||q.outcome!=='MATCHING_FRAME_FRESHNESS_UNVERIFIED'||q.setResult?.Success!==true||!Array.isArray(q.observations)||q.gets!==q.observations.length||q.gets<1||q.gets>201)throw Error('Wrong query/correlation');
  const tx=raw(q.tx),expected=encodeCaf(command,command===446?[0,wire,...Array(11).fill(0)]:[wire,...Array(12).fill(0)]).helper;
  if(!tx.every((b:number,k:number)=>b===expected[k]))throw Error('Unexpected query bytes');
  let previous=-1;
  for(let k=0;k<q.observations.length;k++){
   const o=object(q.observations[k]);
   if(o.ApiSuccess!==true||o.Win32Error!==0||o.Attempt!==k+1||!Number.isFinite(o.StartedMs)||!Number.isFinite(o.ElapsedMs)||o.StartedMs<previous||o.ElapsedMs<o.StartedMs||o.ElapsedMs>=1000)throw Error('Failed/late evidence');
   previous=o.ElapsedMs;
   if(k<q.observations.length-1){
    const b=raw(o.RawBase64),v=new DataView(b.buffer),packed=v.getUint32(2,true),w=Array.from({length:13},(_,n)=>v.getInt32(10+n*4,true));
    const pending=command===446?w[0]===0&&(w[1]===0||w[1]===wire)&&w.slice(2).every(x=>x===0):(w[0]===0||w[0]===wire)&&w.slice(1).every(x=>x===0);
    if(o.Result!=='PENDING'||b[0]!==1||b[1]!==0||packed!==(13|(command<<16))||v.getUint32(6,true)!==0xb32d2300||!pending)throw Error('Wrong pending/stale response');
   }
  }
  const last=object(q.observations.at(-1));
  if(last.Result!=='MATCH'||last.EnvelopeMatched!==true||last.PathWireMatched!==true)throw Error('Unmatched reply');
  return decodeReadbackReply(raw(last.RawBase64),command,wire);
 });
 const bands=parsed.slice(9) as Metadata[],coefficients=parsed.slice(0,9) as Coefficients[];
 const sameEffectiveModel=bands.map((m,i)=>{
  if(m.filterTypeRaw!==0)return false;
  const f=nativePeakFloat({frequency:m.frequency,gainDb:m.gainDb,q:m.q,sampleHz:officialRateHz[m.sampleRateRaw]}).coefficients;
  const scale=nativeScaling(f),intervals=nativeWordIntervals(f,scale.scale);
  return coefficients[i].exponentByte===scale.gain&&coefficients[i].coefficients.every((w,k)=>w>=intervals[k].min&&w<=intervals[k].max);
 });
 return {bands,coefficients,capturedUtc:r.startedUtc,source:'UNVERIFIED',sameEffectiveModel,fullReadback:'BLOCKED'};
}
// Projection at metadata rate, not a claim to measure current active-rate/stereo response.
export function previewResponse(p:ReadbackPreview){
 const rates=p.bands.map(b=>b.sampleRateRaw);if(!rates.every(r=>r===rates[0]))throw Error('Mixed metadata rates; curve unavailable');
 const hz=officialRateHz[rates[0]];
 return Array.from({length:257},(_,i)=>{
  const frequency=20*1000**(i/256),w=2*Math.PI*frequency/hz,c=Math.cos(w),s=Math.sin(w),c2=Math.cos(2*w),s2=Math.sin(2*w);
  const db=p.coefficients.reduce((sum,b)=>{const scale=2**(25-b.exponentByte),[b0,b1,b2,p1,p2]=b.coefficients.map(x=>x/scale);
   const num=(b0+b1*c+b2*c2)**2+(b1*s+b2*s2)**2,den=(1-p1*c-p2*c2)**2+(p1*s+p2*s2)**2;
   if(!(Math.abs(p2)<1&&1-p1-p2>0&&1+p1-p2>0))throw Error('Unstable response');
   const value=10*Math.log10(num/den);if(!Number.isFinite(value))throw Error('Nonfinite response');return sum+value;},0);
  return {frequency,db};
 });
}
// UI uses the existing canvas; this module only validates and publishes a snapshot.
export function renderReadbackPreview(_p:ReadbackPreview,doc:Document=document){
 const status=doc.getElementById('freeDspRamStatus');if(status)status.textContent='Device EQ Readback — 9 Bands · Gain: integer dB; Q: raw/256; enabled unavailable. Saved-profile source; active RAM/stereo unverified.';
 const badge=doc.getElementById('lastAppliedEqDisplay');if(badge)badge.textContent='Device EQ Readback (not Active RAM proof)';
}
export async function loadReadbackPreview(read:()=>Promise<unknown>,current:()=>boolean,log:(s:string)=>void,doc:Document=document){
 if(!current())return;
 try{const p=validateReadbackPreview(await read());previewResponse(p);if(!current())return;renderReadbackPreview(p,doc);
  log('FreeDSP read-only snapshot loaded; source/fractional Gain/enabled/stereo unresolved. No editor replacement or writes.');return p;
 }catch(error){if(current()){for(const id of ['lastAppliedEqDisplay','freeDspRamStatus']){const e=doc.getElementById(id);if(e)e.textContent='Readback unavailable — Local Editor';}log('Readback unavailable — Local Editor: STOP, no retry. '+String(error));}}
}
