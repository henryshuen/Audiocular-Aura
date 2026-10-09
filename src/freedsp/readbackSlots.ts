import type {EQ} from '../main.ts';
import type {ReadbackPreview} from './readbackPreview.ts';

export const readbackConfirmation = 'Load device readback into local A/B slots? Gain precision is limited to 1 dB; enabled states, active RAM source and stereo are unverified. Local band switches will start ON as an editable assumption, not a hardware reading. Your unsaved local edits will be kept in OFF; the visible editor will change. Editing A starts a separate local B copy. No device write will occur.';
const copy=(bands:EQ):EQ=>bands.map(b=>({...b}));
const equal=(a:EQ,b:EQ)=>JSON.stringify(a)===JSON.stringify(b);

// Local workspace only: no transport dependencies, no hardware enabled-state inference.
export class ReadbackSlots {
 mode:'Off'|'A'|'B'='Off';
 private latest:ReadbackPreview|null=null;
 private baseline:EQ|null=null;
 private working:EQ|null=null;
 private off:EQ|null=null;
 private observed:EQ|null=null;
 private points:Array<{frequency:number;db:number}>|null=null;
 private baselineUtc='';
 capture(p:ReadbackPreview,points:Array<{frequency:number;db:number}>,editor:EQ){
  this.latest=p;
  // Reconnect must not replace an established A/B workspace or unsaved edits.
  this.points=points;
  this.observed=copy(editor);
 }
 disconnect(){this.latest=null;this.points=null;}
 get curve(){return this.points;}
 get compared(){return this.mode==='Off'?null:copy((this.mode==='A'?this.working:this.baseline)!);}
 get active(){return this.baseline!==null&&this.mode!=='Off';}
 observe(editor:EQ){
  if((this.mode==='A'&&this.baseline&&!equal(editor,this.baseline))||(this.observed&&!equal(editor,this.observed))){
   this.points=null;
   // All editor entry points (drag, import, reset, undo) detach A instead of mutating it.
   if(this.mode==='A')this.mode='B';
  }
  if(this.mode==='B')this.working=copy(editor);
  this.observed=copy(editor);
 }
 select(mode:'Off'|'A'|'B',editor:EQ,confirm:(message:string)=>boolean):EQ|null{
  if(mode!=='Off'&&!this.baseline){
   const p=this.latest;
   if(!p||!p.sameEffectiveModel.every(Boolean)||p.bands.some(b=>b.filterTypeRaw!==0))throw Error('Readback unavailable or unsupported — Local Editor preserved; no hardware baseline created.');
   if(!confirm(readbackConfirmation))return null;
   this.baseline=p.bands.map((b,index)=>({index,freq:b.frequency,gain:b.gainDb,q:b.q,type:'PK',enabled:true}));
   this.working=copy(this.baseline);this.baselineUtc=p.capturedUtc;
  }
  if(this.mode==='Off')this.off=copy(editor);
  if(this.mode==='B')this.working=copy(editor);
  this.mode=mode;this.points=null;
  const result=copy(mode==='Off'?this.off??editor:mode==='A'?this.baseline!:this.working!);
  this.observed=copy(result);return result;
 }
 get status(){
  if(this.points)return 'Device EQ Readback — 9 Bands · path0 coefficient snapshot at metadata rate; saved-profile source, active RAM/stereo and freshness unverified. Local Editor preserved; select OFF to edit. Gain: integer dB; Q: raw/256; enabled unavailable.';
  if(this.mode!=='Off')return `LOCAL SLOT ${this.mode} · readback-derived ${this.baselineUtc} · Gain: integer dB; Q: raw/256; switches are local assumptions, hardware enabled unknown. Active RAM/stereo unverified. Editing A starts B; edits and slot selection do not write hardware.`;
  return this.latest?'LOCAL EDITOR · readback available for A/B; existing baseline is preserved. No automatic device write.':'Readback unavailable — Local Editor; existing local A/B snapshots preserved.';
 }
}
export const freeDspReadbackSlots=new ReadbackSlots();
