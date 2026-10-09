// Display policy only. Per-band limits and coefficient mathematics are independent.
export const defaultFreeDspGraphBounds={min:-20,max:9} as const;
export function freeDspGraphBounds(samples:number[]){
 let min:number=defaultFreeDspGraphBounds.min,max:number=defaultFreeDspGraphBounds.max,nonFinite=false;
 for(const value of samples){
  if(!Number.isFinite(value)){nonFinite=true;continue;}
  if(value<min)min=Math.floor(value-1);
  if(value>max)max=Math.ceil(value+1);
 }
 return {min,max,nonFinite};
}
