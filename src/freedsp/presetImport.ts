import type {Band} from '../main.ts';
import {validateBands,modelWebBand} from './webRam.ts';

// Exact-FreeDSP import policy. Generic DAC parsing remains in importExport.ts.
export function validateFreeDspImport(bands:unknown):Band[] {
 const validated=validateBands(bands);
 for(const band of validated)for(const rate of [4,5,6,7,8])modelWebBand(band,rate);
 return validated;
}
export function parseFreeDspTextProfile(content:string){
 const bands:Band[]=Array.from({length:9},(_,index)=>({index,freq:1000,gain:0,q:.71,type:'PK',enabled:true}));
 const seen=new Set<number>();let globalGain=0;
 const number='[+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)';
 const filter=new RegExp(`^Filter\\s+(\\d+):\\s+(ON|OFF)\\s+(PK|LSQ|HSQ|LS|HS|LSC|HSC)\\s+Fc\\s+(${number})\\s*(?:Hz)?\\s+Gain\\s+(${number})\\s*(?:dB)?\\s+Q\\s+(${number})\\s*$`,'i');
 const preamp=new RegExp(`^Preamp:\\s*(${number})\\s*(?:dB)?\\s*$`,'i');
 for(const line of content.split(/\r?\n/)){
  const text=line.trim();if(!text||text.startsWith('#'))continue;
  const p=text.match(preamp);if(p){globalGain=Number(p[1]);if(!Number.isFinite(globalGain))throw Error('Invalid FreeDSP preamp value.');continue;}
  const m=text.match(filter);if(!m)throw Error(`Unsupported FreeDSP preset line: ${text}. Use PK, LSQ or HSQ with Fc, Gain and Q.`);
  const index=Number(m[1])-1;if(index<0||index>8||seen.has(index))throw Error('FreeDSP import requires unique Filter numbers 1-9; no extra or duplicate bands.');
  seen.add(index);const type=m[3].toUpperCase();
  bands[index]={index,enabled:m[2].toUpperCase()==='ON',type:type.startsWith('LS')?'LSQ':type.startsWith('HS')?'HSQ':'PK',freq:Number(m[4]),gain:Number(m[5]),q:Number(m[6])};
 }
 if(!seen.size)throw Error('No supported FreeDSP filters found.');
 return {globalGain,bands:validateFreeDspImport(bands)};
}
