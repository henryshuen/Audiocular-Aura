import {describe,it,expect} from 'vitest';
// @ts-expect-error Offline JS model has no runtime TypeScript dependency.
import {modelNineBands,proposedNineSlots} from '../../scripts/freedsp/nine-band-model.mjs';
import evidenceText from './fixtures/officialNineSlotStaticEvidence.json?raw';
import wrapper from '../../scripts/test-freedsp-native-unresolved-slots.ps1?raw';
import runtime from '../../src/main.ts?raw';
const bands=()=>Array.from({length:9},(_,index)=>({index,freq:400,gain:-12,q:1,type:'PK',enabled:true}));
const evidence=JSON.parse(evidenceText.replace(/^\uFEFF/,''));
const method=(name:string)=>evidence.methods.find((m:{name:string})=>m.name===name);
const at=(name:string,offset:number)=>method(name).instructions.find((i:{offset:number})=>i.offset===offset);

describe('M2M nine-slot evidence and OFFLINE proposed UI mapping',()=>{
 it('pinned Freeman3 getter directly lists1..9 with command446; no SDK shift',()=>{
   expect(evidence.methods).toHaveLength(6);
   expect(at('getF3EQCoefficientList',160).args).toContain('1');
   expect(at('getF3EQCoefficientList',164).args).toContain('9');
   expect(at('getF3EQCoefficientList',168).op).toBe('if-gt');
   expect(at('getF3EQCoefficientList',212).args).toContain('446');
   expect(at('getF3EQCoefficientList',268).args).toContain('BandEQCoefficient;->band');
   expect(JSON.stringify(method('getF3EQCoefficientList'))).not.toContain('shiftEQBandForFreeman3');
 });
 it('getter counterpart and unity initialization distinguish raw slots from five editable SDK slots',()=>{
   expect(JSON.stringify(method('getFreeman3EQParam'))).toContain('446');
   expect(JSON.stringify(method('getFreeman3EQParam'))).toContain('shiftEQBandForFreeman3');
   expect(at('setDefaultAvailable',38).args).toContain('0');
   expect(at('setDefaultAvailable',42).args).toContain('9');
   expect(JSON.stringify(method('setDefaultAvailable'))).toContain('4194304');
   expect(at('shiftEQBandForFreeman3',0).args).toContain('5');
 });
 it('nine planned selectors unique1..9; first four SDK fields remain UNKNOWN',()=>{
   expect(proposedNineSlots.map((s:{wire:number})=>s.wire)).toEqual([1,2,3,4,5,6,7,8,9]);
   expect(proposedNineSlots.map((s:{sdkBand:number|null})=>s.sdkBand)).toEqual([null,null,null,null,0,1,2,3,4]);
   expect(proposedNineSlots.every((s:{uiAssignment:string})=>s.uiAssignment==='PROPOSED_NOT_HARDWARE_VERIFIED')).toBe(true);
 });
 it('all nine iterated once without silent skip; selector0 and signedLE coefficient schema',()=>{
   const plan=modelNineBands(bands(),5);
   expect(plan).toHaveLength(9);
   for(const p of plan){
     expect(p.offlineOnly).toBe(true);expect(p.payload.length).toBe(13);
     expect(p.payload).toEqual([0,p.wire,3,4038384,-7961235,3933777,7961236,-3777857,0,0,0,0,0]);
     expect(p.report.length).toBe(62);expect(new DataView(p.report.buffer).getInt32(26,true)).toBe(-7961235);
   }
 });
 it('current rate recomputes coefficients once per slot; unknown rate fails closed',()=>{
   const plans=[4,5,6,7,8].map(i=>modelNineBands(bands(),i));
   expect(new Set(plans.map(p=>p[0].payload.join(','))).size).toBe(5);
   for(const p of plans)expect(new Set(p.map((b:{sampleHz:number})=>b.sampleHz)).size).toBe(1);
   for(const i of [-1,0,3,9,5.1,NaN])expect(()=>modelNineBands(bands(),i)).toThrow();
 });
 it('disabled band is same-slot unity; no tilt or unsupported filter disguise',()=>{
   const b=bands();b[2].enabled=false;
   expect(modelNineBands(b,5)[2].payload).toEqual([0,3,3,4194304,0,0,0,0,0,0,0,0,0]);
   b[2].type='NOTCH';expect(()=>modelNineBands(b,5)).toThrow();
 });
 it('rejects duplicate, stale, fractional indices and missing/extra bands',()=>{
   for(const value of [-1,1,9,0.5]){const b=bands();b[0].index=value;expect(()=>modelNineBands(b,5)).toThrow();}
   expect(()=>modelNineBands(bands().slice(0,8),5)).toThrow();expect(()=>modelNineBands([...bands(),bands()[0]],5)).toThrow();
 });
 it('rejects nonfinite, wrapping, positive gain and Nyquist-invalid parameters',()=>{
   for(const [key,value] of [['freq',NaN],['gain',Infinity],['gain',1],['q',0],['q',256],['freq',65536],['freq',24000]] as const){
     const b=bands();b[0][key]=value;expect(()=>modelNineBands(b,5)).toThrow();
   }
 });
 it('manual entry exposes raw candidate1..4 only; production has no new imports',()=>{
   expect(wrapper).toContain("[ValidateSet('1','2','3','4')][string]$StartWire = '1'");
   expect(wrapper).toContain('-Profile WireCandidates');expect(wrapper).toContain('CandidateWire');
   expect(wrapper).not.toContain('RemainingBand');
   expect(runtime).not.toMatch(/nine-band-model|CandidateWire|unresolved-slots/);
 });
});
