export interface Frame {reportId:number;prefix:number;count:number;command:number;reply:number;module:number;words:number[];capacityWords:number[]}
export interface Trace {command:number;wire:number;tx:Uint8Array;replies:Uint8Array[]}
export interface Capture {vendorId:number;productId:number;completeQuerySet:boolean;records:{command:number;wire:number;tx:string;rx:string|null;error:string|null}[]}
export interface Metadata {band:number;sampleRateRaw:number;frequency:number;qRaw:number;q:number;officialRoundedQ:number;typeRaw:number;gainDb:number;enabled:null;source:'UNKNOWN'}
export function frame(bytes:Uint8Array):Frame;
export function logQueries(log:string):Trace[];
export function analyzeCapture(capture:Capture,log:string):{querySets:number;getBuffers:number;metadata:Metadata[];failureAnalysis:null|{frame:Frame;exactCurrentTxEcho:boolean;differsFromCurrentTxAt:number[];equalsPreviousTx:boolean;equalsPreviousRx:boolean;jsonRetainsFailedRx:boolean};completeQuerySet:boolean;productionEligible:false;source:'UNKNOWN'};
export function simulateReadOnlyWait(tx:Uint8Array,arrivals:{atMs:number;bytes:Uint8Array}[],timeoutMs?:number):{result:string;sets:number;gets:number};
