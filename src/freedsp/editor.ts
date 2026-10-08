import type {Band} from '../main.ts';
import {freeDspGainRange,validateFreeDspGain} from './capabilities.ts';
export const freeDspDefaultBands=():Band[]=>[31,62,125,250,500,1000,2000,4000,8000].map((freq,index)=>({index,freq,gain:0,q:.7,type:'PK',enabled:true}));
export function freeDspEditorGain(value:number,index:number,log:(s:string)=>void){
 if(!Number.isFinite(value))throw new Error(`FreeDSP Band${index+1} gain必須是有限數值；未接受編輯。`);
 const gain=Math.max(freeDspGainRange.min,Math.min(freeDspGainRange.max,value));
 if(gain!==value)log(`FreeDSP Band${index+1} gain ${value} dB → ${gain} dB；已夾限至官方App政策−16..+6，非硬體安全保證；尚未Sync。`);
 return gain;
}
// Every main-page entry path shares this policy; unsupported frequency/Q/type still fail Sync preflight.
export function normalizeFreeDspEditor(bands:Band[],log:(s:string)=>void,validateGain=true){
 if(bands.length!==9)log(`FreeDSP LOCAL EDITOR調整為9段；多餘段不送出，缺少段補本地預設。`);
 return freeDspDefaultBands().map((fallback,index)=>{
   const b=bands[index];if(!b)return fallback;
   if(validateGain)validateFreeDspGain(b.gain,index);
   return {...b,index};
 });
}
