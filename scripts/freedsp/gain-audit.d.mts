export const gains:number[];
export const frequencies:number[];
export const qs:number[];
export function referenceShelf(type:string,frequency:number,gainDb:number,q:number,sampleHz:number):number[];
export function jury(f:number[]):{stable:boolean; margin:number};
export function responseDb(f:number[],frequency:number,sampleHz:number):number;
export function inspectFilter(type:string,frequency:number,gainDb:number,q:number,sampleHz:number):any;
export function audit():any;
