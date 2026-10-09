import {describe,it,expect} from 'vitest';
// @ts-expect-error Node builtins are used only by offline tests.
import {readFileSync} from 'node:fs';
// @ts-expect-error Node builtins are used only by offline tests.
import {createHash} from 'node:crypto';
// @ts-expect-error Node builtins are used only by offline tests.
import {Buffer} from 'node:buffer';
import {analyzeCapture,frame,logQueries,simulateReadOnlyWait} from '../../scripts/freedsp/analyze-readback.mjs';
const load=(name:string)=>readFileSync(new URL('./fixtures/'+name,import.meta.url),'utf8');
const capture=JSON.parse(load('henryReadback20261009.json')),log=load('henryReadback20261009.log');
const queries=logQueries(log),failure=queries.at(-1)!,bad=failure.replies[0];
const analysis=analyzeCapture(capture,log);
describe('Henry physical capture analyzed offline; no hardware or resend',()=>{
 it('preserves hashed original JSON and every TX/RX after device-path redaction',()=>{
  const p=JSON.parse(load('henryReadback20261009Provenance.json'));
  expect(createHash('sha256').update(load('henryReadback20261009.json')).digest('hex')).toBe(p.jsonSha256);
  expect(analysis.querySets).toBe(12);expect(analysis.getBuffers).toBe(12);expect(log).not.toContain('8&762722c');
 });
 it('477 six words and all9 bands/Hz/Q/type/gain exactly agree with SDK offsets',()=>{
  expect(analysis.metadata.map(r=>r.frequency)).toEqual([60,120,260,530,1100,2260,4680,9680,20000]);
  expect(analysis.metadata.map(r=>r.band)).toEqual([1,2,3,4,5,6,7,8,9]);
  for(const r of analysis.metadata)expect(r).toMatchObject({sampleRateRaw:5,qRaw:180,q:0.703125,officialRoundedQ:0.70,gainDb:0,typeRaw:0,enabled:null,source:'UNKNOWN'});
  // Nominal0.7 truncates to179 in the existing metadata encoder; both raw
  // values round to0.70 in App display. Display alone cannot identify raw Q.
  expect(Math.trunc(0.7*256)).toBe(179);expect(Math.round(179/256*100)/100).toBe(0.70);
  expect(analysis.productionEligible).toBe(false);expect(analysis.completeQuerySet).toBe(false);
 });
 it('346 contains13 words: proven rate only; extra word3=32 is opaque',()=>{
  const f=frame(queries[0].replies[0]);expect(f.words).toEqual([62,5,0,32,0,0,0,0,0,0,0,0,0]);
 });
 it('446 wire1 returns unity: exponent3,B0=4194304,others0; cannot recover metadata',()=>{
  expect(frame(queries[10].replies[0]).words).toEqual([0,1,3,4194304,0,0,0,0]);
  expect(4194304/(2**(25-3))).toBe(1);
 });
 it('failed446 is neither exact current echo nor replay of any previous TX/RX',()=>{
  expect(analysis.failureAnalysis).toMatchObject({exactCurrentTxEcho:false,equalsPreviousTx:false,equalsPreviousRx:false,differsFromCurrentTxAt:[14],jsonRetainsFailedRx:false});
  expect(frame(bad)).toMatchObject({reply:0,count:13,command:446,module:0xb32d2300,capacityWords:Array(13).fill(0)});
 });
 it('hypothetical delayed446 completion uses one SET and2 GETs only; not observed on hardware',()=>{
  const synthetic=Buffer.from(queries[10].replies[0]);synthetic.writeInt32LE(2,14);
  expect(simulateReadOnlyWait(failure.tx,[{atMs:0,bytes:bad},{atMs:5,bytes:synthetic}])).toEqual({result:'MATCH_NOT_FRESHNESS_PROOF',sets:1,gets:2});
 });
 it('waiting stays bounded and rejects stale wire1/wrong module rather than accepting a reply bit',()=>{
  expect(simulateReadOnlyWait(failure.tx,[{atMs:0,bytes:bad},{atMs:1000,bytes:bad}])).toEqual({result:'INCOMPLETE_OR_TIMEOUT',sets:1,gets:1});
  expect(simulateReadOnlyWait(failure.tx,[{atMs:5,bytes:queries[10].replies[0]}]).result).toBe('STOP');
  const changed=Buffer.from(bad);changed[6]=1;expect(simulateReadOnlyWait(failure.tx,[{atMs:0,bytes:changed}]).result).toBe('STOP');
 });
 it('source validates SDK replybit polling and Q decimal HALF_UP without altering native transport',()=>{
  const e=JSON.parse(load('officialReadbackStaticEvidence.json'));
  const poll=e.methods.find((m:{method:string})=>m.method==='readDataFromDevice').instructions;
  expect(poll).toContainEqual({offset:118,op:'if-eq',args:'v1, v0, +038h'});
  expect(poll).toContainEqual({offset:150,op:'invoke-static/range',args:'v7 ... v12, Lcom/conexant/cnxtusbcheadset/UsbHelper;->receiveHIDReport(Landroid/hardware/usb/UsbDeviceConnection; I I I I [B)[B'});
  const decimal=e.methods.find((m:{method:string})=>m.method==='formatDecimal').instructions;
  expect(decimal.some((i:{args:string})=>i.args.includes('HALF_UP'))).toBe(true);expect(decimal).toContainEqual({offset:10,op:'const/4',args:'v0, 2'});
 });
});
