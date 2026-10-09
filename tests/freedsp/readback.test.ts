import {describe,it,expect} from 'vitest';
import evidence from './fixtures/officialReadbackStaticEvidence.json';
import {decodeReadbackReply,inspectNineMetadata} from '../../src/freedsp/readback.ts';
import {freeDspGraphBounds} from '../../src/freedsp/graphScale.ts';
import {modelWebBand,unityPreset} from '../../src/freedsp/webRam.ts';

// SYNTHETIC full-nine fixture, independently laid out from DEX offsets.
// This is not a hardware capture or a verified editable Device EQ fixture.
function reply(wire:number,command=477){
 const b=new Uint8Array(62),v=new DataView(b.buffer);b[0]=1;
 v.setUint32(2,0x80000000|(command<<16)|(command===477?6:8),true);v.setUint32(6,0xb32d2300,true);
 const words=command===477?[5,wire,wire*400,256+wire,0,-wire]:[0,wire,3,4194304,0,0,0,0];
 words.forEach((w,i)=>v.setInt32(10+4*i,w,true));return b;
}
describe('Readback static evidence / synthetic replies; offline only',()=>{
 it('pins actual getter/caller and Q256, not a derived report',()=>{
  expect(evidence.apkSha256).toBe('04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5');
  const m=evidence.methods.find(m=>m.method==='getEQParamList')!;
  expect(m.instructions).toContainEqual({offset:94,op:'const/16',args:'v7, 477'});
  expect(m.instructions).toContainEqual({offset:208,op:'const/high16',args:'v6, 1132462080'});
  const f=new Float32Array(new Uint32Array([1132462080]).buffer);expect(f[0]).toBe(256);
  expect(evidence.methods.find(m=>m.method==='handleSyGetEqParamsFromFlash')?.instructions.some(i=>i.args.includes('->getEQParamsFromFlash('))).toBe(true);
 });
 it('full-nine metadata decodes units but explicitly blocks production baseline',()=>{
  const r=inspectNineMetadata(Array.from({length:9},(_,i)=>reply(i+1)));
  expect(r.bands).toHaveLength(9);expect(r.bands[4]).toMatchObject({wire:5,frequency:2000,q:261/256,gainDb:-5,filterTypeRaw:0,enabled:null,source:'UNKNOWN'});
  expect(r.productionEligible).toBe(false);expect(r.blockers).toHaveLength(4);
 });
 it('rejects missing/partial, wrong command/module/ID, echo, error and stale band without editor mutation',()=>{
  const original=unityPreset(),before=structuredClone(original);
  expect(()=>inspectNineMetadata([reply(1)])).toThrow('Nine');
  for(const mutate of [
   (b:Uint8Array)=>b[0]=2,(b:Uint8Array)=>b[1]=1,(b:Uint8Array)=>b[6]=1,
   (b:Uint8Array)=>b[5]&=0x7f,(b:Uint8Array)=>b[4]=190,
   (b:Uint8Array)=>b[2]=5,(b:Uint8Array)=>{b[2]=255;b[3]=255;},
   (b:Uint8Array)=>b[14]=2,(b:Uint8Array)=>b.fill(0,18,22),
  ]){const b=reply(1);mutate(b);expect(()=>decodeReadbackReply(b,477,1)).toThrow();}
  expect(()=>decodeReadbackReply(reply(1).subarray(1),477,1)).toThrow();expect(original).toEqual(before);
 });
 it('446 preserves opaque header, sign extends signed24, and never calls scaling exponent EQ gain',()=>{
  const b=reply(5,446);new DataView(b.buffer).setUint32(26,0x00ffffff,true);
  const r=decodeReadbackReply(b,446,5);expect(r).toMatchObject({kind:'coefficients',coefficients:[4194304,-1,0,0,0],exponentByte:3,source:'UNKNOWN',correlationVerified:false});
  expect(r).not.toHaveProperty('gainDb');expect(r).not.toHaveProperty('frequency');
 });
 it('unity does not uniquely encode original frequency/Q/gain/enabled; no invented A/B baseline',()=>{
  const a={...unityPreset()[4],enabled:false,freq:400,q:1,gain:-12},b={...a,freq:8000,q:4,gain:6};
  expect(modelWebBand(a,5).bytes).toEqual(modelWebBand(b,5).bytes);
  expect(modelWebBand({...a,enabled:true},5,true).bytes).toEqual(modelWebBand({...b,enabled:true},5,true).bytes);
  expect(inspectNineMetadata(Array.from({length:9},(_,i)=>reply(i+1)))).not.toHaveProperty('slotA');
 });
});
describe('FreeDSP display scale only',()=>{
 it('default asymmetric−20/+9 and zero leave gain policy independent',()=>expect(freeDspGraphBounds([-16,0,6])).toEqual({min:-20,max:9,nonFinite:false}));
 it('expands both ends for cumulative response / comparison samples',()=>expect(freeDspGraphBounds([-45.2,54.1])).toEqual({min:-47,max:56,nonFinite:false}));
 it('explicit nonfinite indicator rather than silently clipping',()=>expect(freeDspGraphBounds([NaN,Infinity,0]).nonFinite).toBe(true));
});
