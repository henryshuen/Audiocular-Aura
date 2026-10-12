// Official float-design branches at 0x32bc/0x3440/0x32c4 in the pinned APK.
// Type codes also corroborated by device owner's real 477/446 shelf capture.
export const freeDspFilterTypes = {PK:0,LSQ:1,HSQ:2} as const;
export function freeDspFilterName(raw:number){
 return (Object.keys(freeDspFilterTypes) as Array<keyof typeof freeDspFilterTypes>).find(t=>freeDspFilterTypes[t]===raw);
}
// Float32 design only. Existing nearest-word conversion is not the native
// 32-candidate optimizer and is never described as a bit-exact device backup.
export function freeDspShelfFloat(type:'LSQ'|'HSQ',frequency:number,gainDb:number,q:number,sampleHz:number){
 const freq=Math.trunc(frequency),qRaw=Math.trunc(q*256),gainRaw=Math.trunc(gainDb*256);
 if(![frequency,gainDb,q,sampleHz].every(Number.isFinite)||qRaw<=0||freq<=0||freq>=sampleHz/2)throw Error('Invalid FreeDSP shelf parameters');
 if(gainRaw===0)return [1,0,0,0,0];
 const w=2*Math.PI*freq/Math.fround(sampleHz),c=Math.cos(w),A=Math.pow(1.0592537251772889,gainRaw/256);
 // Native non-PK branch divides sin(w) by float32(qRaw / 128).
 const alpha=Math.sin(w)/Math.fround(qRaw/128),s=2*Math.sqrt(A)*alpha;
 let b0:number,b1:number,b2:number,a0:number,a1:number,a2:number;
 if(type==='LSQ'){
  b0=A*(A+1-(A-1)*c+s);b1=2*A*(A-1-(A+1)*c);b2=A*(A+1-(A-1)*c-s);
  a0=A+1+(A-1)*c+s;a1=-2*(A-1+(A+1)*c);a2=A+1+(A-1)*c-s;
 }else{
  b0=A*(A+1+(A-1)*c+s);b1=-2*A*(A-1+(A+1)*c);b2=A*(A+1+(A-1)*c-s);
  a0=A+1-(A-1)*c+s;a1=2*(A-1-(A+1)*c);a2=A+1-(A-1)*c-s;
 }
 return [b0/a0,b1/a0,b2/a0,-a1/a0,-a2/a0].map(Math.fround);
}
