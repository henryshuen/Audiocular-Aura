import type {Band} from '../main.ts';
export const freeDspDefaultBands=():Band[]=>[31,62,125,250,500,1000,2000,4000,8000].map((freq,index)=>({index,freq,gain:0,q:.7,type:'PK',enabled:true}));
export function freeDspEditorGain(value:number,index:number,log:(s:string)=>void){
 if(!Number.isFinite(value))throw new Error(`FreeDSP Band${index+1} gain必須是有限數值；未接受編輯。`);
 const gain=Math.max(-12,Math.min(12,value));
 if(gain!==value)log(`FreeDSP Band${index+1} gain ${value} dB → ${gain} dB；已夾限至已驗證範圍−12..+12，LOCAL EDITOR已更新；尚未Sync。`);
 return gain;
}
// Every main-page entry path shares this policy; unsupported frequency/Q/type still fail Sync preflight.
export function normalizeFreeDspEditor(bands:Band[],log:(s:string)=>void){
 if(bands.length!==9)log(`FreeDSP LOCAL EDITOR調整為9段；多餘段不送出，缺少段補本地預設。`);
 return freeDspDefaultBands().map((fallback,index)=>{
   const b=bands[index];if(!b)return fallback;
   let gain:number;try{gain=freeDspEditorGain(b.gain,index,log);}catch(e){log(String(e)+' 快照gain改為0 dB。');gain=0;}
   return {...b,index,gain};
 });
}
