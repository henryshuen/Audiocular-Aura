import type {EQ} from '../main.ts';
import type {ReadbackPreview} from './readbackPreview.ts';
import {freeDspFilterName} from './filterTypes.ts';
import {freeDspDefaultBands,normalizeFreeDspEditor} from './editor.ts';
type Mode='Off'|'A'|'B';
type Points=Array<{frequency:number;db:number}>;
export type WriteRevision={id:number;epoch:number;mode:'A'|'B';signature:string;kind:'ram'|'flash'};
const copy=(b:EQ):EQ=>b.map(x=>({...x})),signature=(b:EQ)=>JSON.stringify(b);
const key='aura_freedsp_edition_drafts_v1';
export class FreeDspWorkspaces {
 mode:Mode='Off';
 private origin:EQ|null=null;private points:Points|null=null;
 private a:EQ|null=null;private b:EQ|null=null;private cleanA='';private cleanB='';
 private epoch=0;private counter=0;private pending:WriteRevision|null=null;
 private applied:WriteRevision|null=null;private flashState='';private connected=false;private utc='';
 private offDraft:EQ|null=null;private reconstructionError='';
 constructor(private storage:Pick<Storage,'getItem'|'setItem'>|undefined=typeof localStorage==='undefined'?undefined:localStorage){
  try{const saved=storage?.getItem(key);if(saved){const p=JSON.parse(saved);this.a=normalizeFreeDspEditor(p.a,()=>{});this.b=normalizeFreeDspEditor(p.b,()=>{});this.cleanA=p.cleanA;this.cleanB=p.cleanB;}}catch{this.a=null;this.b=null;}
 }
 private recover(){
  if(!this.unsaved)return;
  if(!this.storage)throw Error('Draft recovery unavailable. Export EQ A/B before reconnecting; drafts retained.');
  const profiles=JSON.parse(this.storage.getItem('aura_custom_profiles')??'[]');
  if(!Array.isArray(profiles))throw Error('Draft recovery failed: invalid Custom Profiles storage. Export drafts first.');
  const stamp=new Date().toISOString();
  for(const [name,bands,clean] of [['A',this.a,this.cleanA],['B',this.b,this.cleanB]] as const){
   if(bands&&signature(bands)!==clean){let label=`FreeDSP recovered EQ ${name} ${stamp}`,n=1;while(profiles.some(p=>p.name===label))label=`FreeDSP recovered EQ ${name} ${stamp} (${n++})`;profiles.push({name:label,globalGain:0,bands:copy(bands)});}
  }
  const saved=JSON.stringify(profiles);this.storage.setItem('aura_custom_profiles',saved);
  if(this.storage.getItem('aura_custom_profiles')!==saved)throw Error('Draft recovery could not be verified. Export drafts first; replacement stopped.');
 }
 private persist(){this.storage?.setItem(key,JSON.stringify({a:this.a,b:this.b,cleanA:this.cleanA,cleanB:this.cleanB}));}
 get unsaved(){return !!((this.a&&signature(this.a)!==this.cleanA)||(this.b&&signature(this.b)!==this.cleanB));}
 get readOnly(){return this.mode==='Off'||this.pending!==null;}
 get writable(){return !this.readOnly&&this.connected&&this.origin!==null;}
 get available(){return this.a!==null&&this.b!==null;}
 get busy(){return this.pending!==null;}
 get originUnavailable(){return this.mode==='Off'&&!this.origin;}
 get curve(){return this.mode==='Off'?this.points?.map(p=>({...p}))??null:null;}
 get referenceCurve(){return this.mode!=='Off'?this.points?.map(p=>({...p}))??null:null;}
 get compared(){return null;}
 get active(){return this.mode!=='Off';}
 get label(){return this.mode==='Off'?'ORIGIN':`EQ ${this.mode}`;}
 get view(){return copy(this.mode==='Off'?this.origin??[]:this.mode==='A'?this.a??[]:this.b??[]);}
 draft(editor:EQ){return copy(this.offDraft??editor);}
 get disconnectedDraft(){return copy(this.offDraft??[]);}
 observe(editor:EQ){
  if(this.readOnly)return;
  if(this.mode==='A')this.a=copy(editor);else this.b=copy(editor);
  this.persist();
 }
 capture(p:ReadbackPreview,points:Points,editor:EQ,_legacyConfirm?:(s:string)=>boolean){
  if(p.bands.length!==9||p.bands.some(b=>!freeDspFilterName(b.filterTypeRaw)))throw Error('Readback unavailable: unsupported band type.');
  const origin=p.bands.map((b,index)=>({index,freq:b.frequency,gain:b.gainDb,q:b.q,type:freeDspFilterName(b.filterTypeRaw)!,enabled:true}));
  normalizeFreeDspEditor(origin,()=>{});
  const invalid=origin.some(b=>![b.freq,b.gain,b.q].every(Number.isFinite)||b.freq<20||b.freq>20000||b.q<=0);
  const conflict=origin.every(b=>b.gain===0)&&points.some(p=>Math.abs(p.db)>0.1);
  const problem=invalid?'EQ A reconstruction unavailable: invalid readback parameters.':conflict?'EQ A reconstruction unavailable: flat parameters conflict with non-flat coefficient snapshot. No Flat substitution.':'';
  if(!this.offDraft)this.offDraft=copy(editor);
  // Preserve an existing pre-Edition draft rather than silently discarding it.
  if(!this.a&&!this.b&&editor.length===9&&signature(editor)!==signature(freeDspDefaultBands())){
   this.a=copy(editor);this.b=freeDspDefaultBands();this.cleanA='';this.cleanB=signature(this.b);
  }
  this.recover();
  const nextA=problem?null:copy(origin),nextB=freeDspDefaultBands();
  if(this.storage){const encoded=JSON.stringify({a:nextA,b:nextB,cleanA:signature(nextA??[]),cleanB:signature(nextB)});this.storage.setItem(key,encoded);if(this.storage.getItem(key)!==encoded)throw Error('Workspace storage failed; old drafts retained. Export them before reconnecting.');}
  this.epoch++;this.connected=true;this.origin=copy(origin);this.points=points.map(p=>({...p}));this.utc=p.capturedUtc;this.applied=null;
  this.reconstructionError=problem;this.a=nextA;this.b=nextB;this.cleanA=signature(this.a??[]);this.cleanB=signature(this.b);
  // A fresh session supersedes old write callbacks. Keep the counters monotonic.
  this.mode='Off';this.pending=null;this.flashState='';return this.view;
 }
 select(mode:Mode,editor:EQ,_confirm?:(s:string)=>boolean):EQ|null{
  if(this.pending)throw Error('FreeDSP operation in progress.');
  this.observe(editor);
  if(mode!=='Off'&&!this.available)throw Error('Device EQ unavailable; connect and read again.');
  this.mode=mode;return this.mode==='Off'&&!this.origin?copy(editor):this.view;
 }
 disconnect(initialDraft?:EQ){if(!this.offDraft&&initialDraft)this.offDraft=copy(initialDraft);this.epoch++;this.connected=false;this.origin=null;this.points=null;this.applied=null;this.utc='';this.reconstructionError='';this.mode='Off';this.persist();}
 begin(kind:'ram'|'flash',editor:EQ){
  if(!this.writable)throw Error('Select EQ A or EQ B after a successful CONNECT readback. ORIGIN is read-only.');
  this.observe(editor);const revision:WriteRevision={id:++this.counter,epoch:this.epoch,mode:this.mode as 'A'|'B',signature:signature(editor),kind};
  this.pending=revision;if(kind==='flash'){this.flashState='Saving Flash…';this.applied=null;}return revision;
 }
 finish(r:WriteRevision,ok:boolean){
  if(this.pending?.id!==r.id)return;this.pending=null;
  if(r.kind==='ram'){if(r.epoch===this.epoch&&this.connected)this.applied=ok?r:null;return;}
  // A validated final commit ACK remains evidence even if USB disconnected while it was in flight.
  if(ok){
   if(r.epoch===this.epoch||!this.connected){
    this.flashState='Flash save acknowledged; reconnect to read device EQ.';
    if(r.mode==='A'&&this.a&&signature(this.a)===r.signature)this.cleanA=r.signature;
    if(r.mode==='B'&&this.b&&signature(this.b)===r.signature)this.cleanB=r.signature;
   }
  }else if(r.epoch===this.epoch||!this.connected){
   this.flashState='Flash incomplete; saved state unknown. No retry.';
   // Never discard the attempted profile after an uncertain persistent transaction.
   if(r.mode==='A')this.cleanA='';else this.cleanB='';
  }
  this.persist();
 }
 get status(){
  if(this.reconstructionError)return this.reconstructionError+' ORIGIN coefficient snapshot remains available; no writes.';
  if(this.pending)return this.pending.kind==='flash'?'Saving Flash…':'Applying RAM…';
  const ram=this.applied?`RAM: EQ ${this.applied.mode} applied${signature(this.applied.mode==='A'?this.a??[]:this.b??[])!==this.applied.signature?' (edited since Apply)':''}`:'RAM: unknown';
  return `${this.label}${this.mode==='Off'?(this.origin?' — readback snapshot':' — unavailable'): ' — local editor'} · ${ram}${this.flashState?' · '+this.flashState:''}`;
 }
 get details(){return `Readback: ${this.utc||'unavailable'}. ORIGIN is a captured path0 coefficient curve at the metadata rate, not a Flash backup or confirmed active RAM. EQ A is an approximate parameter reconstruction and may differ from raw ORIGIN: integer gain and Q raw/256; enabled states are assumed ON locally. Source, freshness and stereo remain unverified. RAM status records matching write acknowledgments for a submitted revision, not coefficient readback.`;}
}
