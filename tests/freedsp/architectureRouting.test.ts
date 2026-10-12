import {describe,it,expect} from 'vitest';
import evidence from './fixtures/architectureRoutingControl20261012.json';
import {decodeReadbackReply} from '../../src/freedsp/readback.ts';

// Actual native capture, NOT a browser event fixture or freshness proof.
const stream=evidence.observations.find(o=>o.api==='ReadFile')!;
const start=evidence.observations.find(o=>o.api==='ReadFile/start-before-output')!;
const output=evidence.observations.find(o=>o.api==='WriteFile')!;
const control=evidence.observations.find(o=>o.api==='HidD_GetInputReport/CONTROL_NOT_BROWSER')!;
const bytes=(raw:string)=>Uint8Array.from(atob(raw),c=>c.charCodeAt(0));

describe('Actual fixed446 routing control: native stream versus control',()=>{
 it('preserves one query/control GET and zero EQ writes',()=>{
  expect(evidence).toMatchObject({command:446,path:0,wire:2,outputs:1,controlGets:1,eqWrites:0});
  expect(output.txBase64).toBe('AQANAL4BACMtswAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
 });
 it('read is armed before completed Output; stream times out without bytes',()=>{
  expect(start.initial).toBe('PENDING');expect(start.elapsedMs).toBeLessThanOrEqual(output.elapsedMs!);
  expect(output.writeResult).toBe('COMPLETE');expect(stream).toMatchObject({result:'TIMEOUT',bytes:0,rawBase64:null});
  expect(stream.elapsedMs!-output.elapsedMs!).toBeGreaterThanOrEqual(1000);
 });
 it('subsequent control frame strictly decodes non-unity coefficients',()=>{
  expect(control.elapsedMs).toBeGreaterThan(stream.elapsedMs!);
  expect(control.ok).toBe(true);expect(control.verdict?.Result).toBe('MATCH');
  const rx=decodeReadbackReply(bytes(control.rawBase64!),446,2);
  expect(rx.kind).toBe('coefficients');
  if(rx.kind==='coefficients')expect(rx.coefficients.slice(1).some(c=>c!==0)).toBe(true);
 });
 it('does not convert native response into browser success, fresh data or RAM origin',()=>{
  expect(evidence.context).toBe('NATIVE_WIN32_CONTROL_EXPERIMENT_NOT_BROWSER');
  expect(evidence.browserHardwarePass).toBe(false);expect(evidence.freshnessVerified).toBe(false);
  expect(decodeReadbackReply(bytes(control.rawBase64!),446,2)).toMatchObject({source:'UNKNOWN',correlationVerified:false});
 });
 it('rejects query echo and other wire rather than inventing acknowledgments',()=>{
  expect(()=>decodeReadbackReply(bytes(output.txBase64!),446,2)).toThrow();
  expect(()=>decodeReadbackReply(bytes(control.rawBase64!),446,3)).toThrow();
 });
});
