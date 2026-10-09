export const isFreeDsp=(d:{vendorId:number;productId:number}|null)=>!!d&&d.vendorId===0x35d8&&d.productId===0x1496;
// Official App policy, not a firmware range or clipping-safety guarantee.
export const freeDspGainRange={min:-16,max:6} as const;
const genericGainRange={min:-12,max:12} as const;
export function gainRangeFor(device:Pick<HIDDevice,'vendorId'|'productId'>|null){
 return isFreeDsp(device)?freeDspGainRange:genericGainRange;
}
export function validateFreeDspGain(value:number,index:number){
 if(!Number.isFinite(value)||value<freeDspGainRange.min||value>freeDspGainRange.max)
   throw new Error(`FreeDSP Band${index+1} gain ${value} dB is outside official App policy -16..+6 dB; setting rejected without automatic clamping.`);
 return value;
}
