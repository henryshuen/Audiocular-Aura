import {describe,it,expect} from 'vitest';
// @ts-expect-error Node filesystem is test-only; no Node types in production project.
import {readFileSync} from 'node:fs';
import {audit,inspectFilter,jury,responseDb,referenceShelf} from '../../scripts/freedsp/gain-audit.mjs';
import {nativePeakFloat,nativeScaling,nativeWordIntervals} from '../../scripts/freedsp/ram-semantics.mjs';
import {freeDspDefaultBands,normalizeFreeDspEditor} from '../../src/freedsp/editor.ts';
import {validateBands,modelWebBand} from '../../src/freedsp/webRam.ts';
import {buildFlashPlan} from '../../src/freedsp/flash.ts';
import {parseCaf} from '../../src/freedsp/cafCodec.ts';

describe('gain audit offline evidence, never opens a device',()=>{
 it('reproduces all 3150 cases across seven gains, five banks, six frequencies, five Qs and three labeled models',()=>{
  const result=audit();
  expect(result).toEqual(JSON.parse(readFileSync(new URL('./fixtures/gainAuditAnalysis.json',import.meta.url),'utf8')));
  expect(result.caseCount).toBe(3150);expect(result.rates).toEqual([44100,48000,96000,192000,384000]);
  expect(result.summaries.every((s:any)=>s.count===150&&s.nonfinite===0&&s.overflow===0)).toBe(true);
  expect(result.summaries.filter((s:any)=>s.type==='PK').map((s:any)=>s.quantizedUnstable)).toEqual([5,6,6,0,6,6,6]);
 });
 for(const gainDb of [-16,-12,-6,0,6,9,12])it(`ordinary PK ${gainDb}dB has correct center gain and stable representable coefficients`,()=>{
  for(const sampleHz of [44100,48000,96000,192000,384000]){
   const r=inspectFilter('PK',1000,gainDb,1,sampleHz);
   expect(r.finite&&r.signed24Fits&&r.quantizedStable).toBe(true);
   expect(r.centerDb).toBeCloseTo(gainDb,1);
  }
 });
 it('representability does not imply stability: 20Hz/-16/Q.1/384k is rejected by nearest quantization',()=>{
  const r=inspectFilter('PK',20,-16,.1,384000);
  expect(r.finite&&r.signed24Fits&&r.floatStable).toBe(true);expect(r.quantizedStable).toBe(false);expect(r.quantizedMargin).toBe(0);
  const f=nativePeakFloat({frequency:20,gainDb:-16,q:.1,sampleHz:384000}).coefficients;
  const scaling=nativeScaling(f),intervals=nativeWordIntervals(f,scaling.scale);
  // A stable neighbor exists: do not mislabel our nearest-rounding failure as official native failure.
  const stable=Array.from({length:32},(_,mask)=>intervals.map((v:any,i:number)=>((mask>>i)&1?v.max:v.min)/scaling.scale)).some(v=>jury(v).stable);
  expect(stable).toBe(true);
 });
 it('stable negative PK can have distorted DC response at extreme frequency/rate ratio',()=>{
  const r=inspectFilter('PK',20,-12,1,192000);
  expect(r.quantizedStable).toBe(true);expect(r.centerDb).toBeCloseTo(-7.751,2);expect(r.sampledPeakDb).toBeCloseTo(9.5424,3);
 });
 it('shelf references obey their asymptotic gains; FreeDSP still rejects unsupported types',()=>{
  for(const type of ['LSQ','HSQ']){
   const f=referenceShelf(type,1000,6,.7,48000);
   expect(responseDb(f,type==='LSQ'?0:24000,48000)).toBeCloseTo(6,3);
   const bands=freeDspDefaultBands();bands[0].type=type;expect(()=>validateBands(bands)).toThrow();
  }
 });
 it('new official App policy rejects +12 import unchanged and accepts -16; offline matrix remains historical math evidence',()=>{
  const bands=freeDspDefaultBands(),logs:string[]=[];bands[0].gain=12;bands[1].gain=13;bands[2].gain=-16;
  expect(()=>normalizeFreeDspEditor(bands,s=>logs.push(s))).toThrow('沒有自動夾限');
  expect(bands.slice(0,3).map(b=>b.gain)).toEqual([12,13,-16]);
  bands[0].gain=-16;bands[1].gain=6;expect(validateBands(bands)[0].gain).toBe(-16);
 });
 it('RAM coefficients retain fractional dB while Flash metadata truncates toward zero; Flash coefficients are identical to RAM',()=>{
  const bands=freeDspDefaultBands();bands[0].gain=-6.75;bands[1].gain=5.75;
  const plan=buildFlashPlan(bands);
  const words=(data:Uint8Array)=>parseCaf(1,new DataView(data.buffer,data.byteOffset,data.byteLength)).words;
  expect(words(plan.packets[1].data)[5]).toBe(-6);expect(words(plan.packets[2].data)[5]).toBe(5);
  const coefficient=plan.packets[10]; // after90 and9metadata
  expect(words(coefficient.data).slice(2)).toEqual(modelWebBand(bands[0],4).payload.slice(2));
  expect(audit().metadata.find((x:any)=>x.gainDb===6.75)).toEqual({gainDb:6.75,coefficientInputDb:6.75,flashMetadataDb:6});
 });
 it('two overlapping +6 filters require approximately 12dB sine headroom; no limiter or safety inferred',()=>{
  const x=audit().composites.find((c:any)=>c.bands===2&&c.gainDb===6);
  expect(x.centerDb).toBeCloseTo(12,3);expect(x.amplitudeMultiplier).toBeCloseTo(10**(.6),3);
 });
 it('pinned APK strings support app restriction, without pretending strings are firmware specifications',()=>{
  const x=JSON.parse(readFileSync(new URL('./fixtures/officialGainStrings.json',import.meta.url),'utf8'));
  expect(x.apkSha256).toBe('04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5');
  expect(x.findings.some((f:any)=>f.entries.some((e:any)=>e.context.includes('gain range is -16dB~6dB')))).toBe(true);
  expect(x.limitations).toContain('do not prove');
 });
});
