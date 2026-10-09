import type {EQ} from '../main.ts';
import type {ReadbackPreview} from './readbackPreview.ts';

export const readbackConfirmation = 'Load readback parameters into local A/B slots? Gain is integer dB; Q is raw/256. Enabled states, active RAM source, stereo and freshness are unverified. The editable reconstruction may differ from the raw coefficient snapshot. Band switches start ON as a local assumption. OFF keeps your local edits. Editing A starts B. No device write will occur.';
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
  this.points=this.mode==='Off'?points:null;
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
   if(!p||p.bands.length!==9||p.bands.some(b=>b.filterTypeRaw!==0||!Number.isFinite(b.gainDb)||b.gainDb<-16||b.gainDb>6||!Number.isFinite(b.frequency)||b.frequency<20||b.frequency>20000||!Number.isFinite(b.q)||b.q<.1||b.q>10))throw Error('Readback unavailable or unsupported — Local Editor preserved; no hardware baseline created.');
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
  if(this.points)return 'Readback snapshot shown; select OFF for local edits or A/B to confirm a local copy.';
  if(this.mode!=='Off')return `Local ${this.mode}: readback-derived copy; edits and selection do not write the device.`;
  return this.latest?'Local Editor; readback available for A/B.':'Readback unavailable; Local Editor and existing A/B preserved.';
 }
 get details(){return `Snapshot: ${this.latest?.capturedUtc??'unavailable'}; A/B baseline: ${this.baselineUtc||'not initialized'}. Gain: integer dB; Q: raw/256. Enabled switches are local assumptions; path1, active RAM/Flash source and freshness are unverified. Parameter reconstruction may differ from raw coefficients; not an exact hardware backup.`;}
}
export const freeDspReadbackSlots=new ReadbackSlots();
