// Offline capture forensics only. No native calls, network, report sender or retry.
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export function frame(bytes){
 const b=Buffer.from(bytes);if(b.length!==62)throw Error('Expected62-byte API buffer');
 const packed=b.readUInt32LE(2),count=packed&65535;
 return {reportId:b[0],prefix:b[1],count,command:(packed>>>16)&32767,reply:packed>>>31,module:b.readUInt32LE(6),
  words:Array.from({length:Math.min(count,13)},(_,i)=>b.readInt32LE(10+i*4)),capacityWords:Array.from({length:13},(_,i)=>b.readInt32LE(10+i*4))};
}
export function logQueries(log){
 const rows=[];let current;
 for(const rawLine of log.split(/\r?\n/)){
  const line=rawLine.trimEnd();
  const tx=/^QUERY (\d+) wire(\d+) TX ([0-9a-f ]+)$/i.exec(line);
  if(tx){current={command:Number(tx[1]),wire:Number(tx[2]),tx:Buffer.from(tx[3].replaceAll(' ',''),'hex'),replies:[]};rows.push(current);}
  else if(line.startsWith('RX ')){if(!current)throw Error('Orphan RX');current.replies.push(Buffer.from(line.slice(3).replaceAll(' ',''),'hex'));}
 }
 return rows;
}
export function analyzeCapture(capture,log){
 if(capture.vendorId!==0x35d8||capture.productId!==0x1496)throw Error('Wrong capture device');
 const traces=logQueries(log);if(traces.length!==capture.records.length)throw Error('JSON/log query count mismatch');
 for(let i=0;i<traces.length;i++){
  const t=traces[i],r=capture.records[i];
  if(t.command!==r.command||t.wire!==r.wire||!t.tx.equals(Buffer.from(r.tx,'base64')))throw Error('JSON/log TX mismatch');
  if(r.rx!==null&&(!t.replies.length||!t.replies.at(-1).equals(Buffer.from(r.rx,'base64'))))throw Error('JSON/log RX mismatch');
 }
 const metadata=capture.records.filter(r=>r.command===477&&r.rx!==null).map(r=>{
  const f=frame(Buffer.from(r.rx,'base64'));
  if(f.reply!==1||f.command!==477||f.count!==6||f.module!==0xb32d2300||f.words[1]!==r.wire)throw Error('Unexpected477 reply');
  const [sampleRateRaw,band,frequency,qRaw,typeRaw,gainDb]=f.words;
  return {band,sampleRateRaw,frequency,qRaw,q:qRaw/256,officialRoundedQ:Math.round(qRaw/256*100)/100,typeRaw,gainDb,enabled:null,source:'UNKNOWN'};
 });
 const failure=traces.find(t=>capture.records[traces.indexOf(t)].error!==null);
 const failureRx=failure?.replies.at(-1);
 let failureAnalysis=null;
 if(failureRx){
  failureAnalysis={frame:frame(failureRx),exactCurrentTxEcho:failureRx.equals(failure.tx),
   differsFromCurrentTxAt:Array.from({length:62},(_,i)=>i).filter(i=>failureRx[i]!==failure.tx[i]),
   equalsPreviousTx:traces.slice(0,traces.indexOf(failure)).some(t=>failureRx.equals(t.tx)),
   equalsPreviousRx:traces.slice(0,traces.indexOf(failure)).some(t=>t.replies.some(rx=>failureRx.equals(rx))),
   jsonRetainsFailedRx: capture.records[traces.indexOf(failure)].rx!==null};
 }
 return {querySets:traces.length,getBuffers:traces.reduce((n,t)=>n+t.replies.length,0),metadata,failureAnalysis,
  completeQuerySet:capture.completeQuerySet,productionEligible:false,source:'UNKNOWN'};
}

// Offline candidate model, NOT a transplanted SDK implementation or sender.
// SDK continues GET until reply bit1, but has weaker command/slot validation.
// Proposed future diagnostic preserves strict envelope/slot checks and adds
// bounded GET-only waiting. Valid matching replies still do not prove freshness.
export function simulateReadOnlyWait(tx,arrivals,timeoutMs=1000){
 const request=frame(tx);let gets=0;
 for(const {atMs,bytes} of arrivals){
  if(atMs<0||atMs>=timeoutMs)break;gets++;
  const f=frame(bytes);
  if(f.reportId!==1||f.prefix!==0||f.module!==0xb32d2300||f.command!==request.command||f.count>13)return {result:'STOP',sets:1,gets};
  if(f.reply===0)continue; // pending, never usable coefficient data
  const slot=request.command===477?request.words[0]:request.words[1];
  if(f.count<(request.command===477?6:8)||f.words[1]!==slot)return {result:'STOP',sets:1,gets};
  return {result:'MATCH_NOT_FRESHNESS_PROOF',sets:1,gets};
 }
 return {result:'INCOMPLETE_OR_TIMEOUT',sets:1,gets};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv.length!==4)throw Error('Usage: node analyze-readback.mjs capture.json capture.log');
 console.log(JSON.stringify(analyzeCapture(JSON.parse(readFileSync(process.argv[2],'utf8')),readFileSync(process.argv[3],'utf8')),null,2));
}
