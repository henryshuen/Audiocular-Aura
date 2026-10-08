// Offline audit ONLY. No runtime validation changes, USB, native loading or target execution.
import {nativePeakFloat,nativeScaling,officialRateHz} from './ram-semantics.mjs';
import {fileURLToPath} from 'node:url';
export const gains=[-16,-12,-6,0,6,9,12];
export const frequencies=[20,100,1000,6000,10000,20000];
export const qs=[.1,.7,1,4,10];

// Current generic UI RBJ shelf formulas, REFERENCE ONLY: not recovered native shelf math.
export function referenceShelf(type,frequency,gainDb,q,sampleHz){
  const w=2*Math.PI*frequency/sampleHz,c=Math.cos(w),A=10**(gainDb/40);
  const alpha=Math.sin(w)/(2*q),s=2*Math.sqrt(A)*alpha;
  let b0,b1,b2,a0,a1,a2;
  if(type==='LSQ'){
    b0=A*(A+1-(A-1)*c+s);b1=2*A*(A-1-(A+1)*c);b2=A*(A+1-(A-1)*c-s);
    a0=A+1+(A-1)*c+s;a1=-2*(A-1+(A+1)*c);a2=A+1+(A-1)*c-s;
  }else if(type==='HSQ'){
    b0=A*(A+1+(A-1)*c+s);b1=-2*A*(A-1+(A+1)*c);b2=A*(A+1+(A-1)*c-s);
    a0=A+1-(A-1)*c+s;a1=2*(A-1-(A+1)*c);a2=A+1-(A-1)*c-s;
  }else throw new Error('Reference shelves only');
  return [b0/a0,b1/a0,b2/a0,-a1/a0,-a2/a0].map(Math.fround);
}
export function jury(f){const a1=-f[3],a2=-f[4];return {stable:Math.abs(a2)<1&&1+a1+a2>0&&1-a1+a2>0,margin:Math.min(1-Math.abs(a2),1+a1+a2,1-a1+a2)};}
export function responseDb(f,frequency,sampleHz){
  const w=2*Math.PI*frequency/sampleHz,c=Math.cos(w),s=Math.sin(w),c2=Math.cos(2*w),s2=Math.sin(2*w);
  return 10*Math.log10(((f[0]+f[1]*c+f[2]*c2)**2+(f[1]*s+f[2]*s2)**2)/((1-f[3]*c-f[4]*c2)**2+(f[3]*s+f[4]*s2)**2));
}
export function inspectFilter(type,frequency,gainDb,q,sampleHz){
  const coefficients=type==='PK'?nativePeakFloat({frequency,gainDb,q,sampleHz}).coefficients:referenceShelf(type,frequency,gainDb,q,sampleHz);
  const finite=coefficients.every(Number.isFinite),scaling=finite?nativeScaling(coefficients):null;
  const words=scaling?coefficients.map(c=>Math.round(Math.fround(c*scaling.scale))):[];
  const decoded=scaling?words.map(v=>v/scaling.scale):[];
  const floatJury=finite?jury(coefficients):{stable:false,margin:null};
  const quantizedJury=scaling?jury(decoded):{stable:false,margin:null};
  // Probes include DC, Nyquist, exact center and a logarithmic audio grid. Estimate, not continuous proof.
  const probes=[0,sampleHz/2,frequency,...Array.from({length:257},(_,i)=>20*1000**(i/256))];
  const responses=scaling&&quantizedJury.stable?probes.map(hz=>responseDb(decoded,hz,sampleHz)):[];
  return {type,frequency,gainDb,q,sampleHz,finite,floatStable:floatJury.stable,floatMargin:floatJury.margin,
    quantizedStable:quantizedJury.stable,quantizedMargin:quantizedJury.margin,coefficientGain:scaling?.gain,
    signed24Fits:words.length===5&&words.every(w=>w>=-8388608&&w<=8388607),
    maxQuantizationError:scaling?Math.max(...coefficients.map((v,i)=>Math.abs(v-decoded[i]))):null,
    centerDb:scaling&&quantizedJury.stable?responseDb(decoded,frequency,sampleHz):null,
    sampledPeakDb:responses.length&&responses.every(Number.isFinite)?Math.max(...responses):null};
}
export function audit(){
  const rows=[];
  for(const type of ['PK','LSQ','HSQ'])for(const gainDb of gains)for(const frequency of frequencies)for(const q of qs)for(const sampleHz of officialRateHz.slice(4,9))rows.push(inspectFilter(type,frequency,gainDb,q,sampleHz));
  const summaries=['PK','LSQ','HSQ'].flatMap(type=>gains.map(gainDb=>{
    const group=rows.filter(r=>r.type===type&&r.gainDb===gainDb);
    return {type,gainDb,count:group.length,nonfinite:group.filter(r=>!r.finite).length,
      floatUnstable:group.filter(r=>!r.floatStable).length,quantizedUnstable:group.filter(r=>!r.quantizedStable).length,
      overflow:group.filter(r=>!r.signed24Fits).length,maxError:Math.max(...group.map(r=>r.maxQuantizationError??0)),
      maxSampledPeakDb:Math.max(...group.map(r=>r.sampledPeakDb??-Infinity)),
      worstSampledCase:group.filter(r=>r.sampledPeakDb!==null).sort((a,b)=>b.sampledPeakDb-a.sampledPeakDb)[0]};
  }));
  const composites=[[1,6],[1,12],[2,6],[9,6],[9,12]].map(([bands,gainDb])=>{
    const c=nativePeakFloat({frequency:1000,gainDb,q:1,sampleHz:48000}).coefficients;
    const sampledDb=bands*responseDb(c,1000,48000);
    return {bands,gainDb,frequency:1000,q:1,sampleHz:48000,centerDb:sampledDb,
      sinusoidalInputHeadroomDb:sampledDb,amplitudeMultiplier:10**(sampledDb/20)};
  });
  return {category:'DERIVED OFFLINE MODEL, not hardware capability/safety',rates:officialRateHz.slice(4,9),gains,frequencies,qs,
    limitations:['PK uses recovered native float math and current nearest float32 rounding, not native 32-neighbor optimizer.',
      'Shelves mirror generic UI reference math, unsupported by current FreeDSP preflight and NOT native or hardware validated.',
      'Matrix is finite sampling, not all parameters. Stable poles and fitting coefficients do not establish DSP accumulator/headroom/limiter or audible safety.',
      'Composite examples are steady-state sine response; transient/intermediate-stage peaks require additional margin and DSP implementation evidence.',
      'Metadata mismatch is arithmetic, not proof firmware reconstructs from metadata.'],
    summaries,failures:rows.filter(r=>!r.finite||!r.floatStable||!r.quantizedStable||!r.signed24Fits),
    composites,metadata:[-16,-12,-6.75,-.1,0,.1,6,6.75,9,12].map(gainDb=>({gainDb,coefficientInputDb:Math.trunc(gainDb*256)/256,flashMetadataDb:Math.trunc(gainDb)||0})),
    caseCount:rows.length};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])process.stdout.write(JSON.stringify(audit(),null,2)+'\n');
