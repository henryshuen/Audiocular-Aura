// Strict evidence decoder. No editor mutation or unproven source inference.
export function signed24Container(word:number){
 const s=(word<<8)>>8;
 if(word!==s && word!==(word&0xffffff))throw Error('Malformed signed24 container');
 return s;
}
export function decodeReadbackReply(bytes: Uint8Array, command: 477 | 446, wire: number) {
 if(bytes.length!==62||bytes[0]!==1||bytes[1]!==0||wire<1||wire>9||!Number.isInteger(wire))throw Error('Malformed frame/wire');
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),packed=v.getUint32(2,true),count=packed&0xffff;
 if((packed>>>31)!==1||((packed>>>16)&0x7fff)!==command||v.getUint32(6,true)!==0xb32d2300)throw Error('Wrong reply/module');
 if(count!==(command===477?6:8))throw Error('Partial/error logical count');
 const words=Array.from({length:count},(_,i)=>v.getInt32(10+i*4,true));
 if(command===477){
  if(words[1]!==wire)throw Error('Wrong/stale band');
  const result={wire,sampleRateRaw:words[0],frequency:words[2],q:words[3]/256,filterTypeRaw:words[4],gainDb:signed24Container(words[5]),gainRaw:words[5],qRaw:words[3],enabled:null,source:'UNKNOWN' as const};
  if(![4,5,6,7,8].includes(result.sampleRateRaw))throw Error('Unknown metadata sample rate');
  if(result.frequency<20||result.frequency>20000||result.q<0.1||result.q>10||result.gainDb< -16||result.gainDb>6)throw Error('Out-of-policy metadata');
  return {...result,kind:'metadata' as const,correlationVerified:false};
 }
 if(words[0]!==0||words[1]!==wire||words[2]<0||words[2]>25)throw Error('Wrong path/wire/scaling');
 return {kind:'coefficients' as const,wire,pathRequested:0,opaqueWords:words.slice(0,2),exponentByte:bytes[18],
  coefficients:words.slice(3,8).map(signed24Container),rawWords:words,enabled:null,source:'UNKNOWN' as const,correlationVerified:false};
}

export function inspectNineMetadata(replies:Uint8Array[]){
 if(replies.length!==9)throw Error('Nine complete replies required; no partial editor replacement');
 const bands=replies.map((reply,i)=>decodeReadbackReply(reply,477,i+1));
 // Even nine valid synthetic/real477 frames cannot prove enabled, active source,
 // same-slot freshness, or both stereo paths. Never return an editor baseline.
 return {bands,productionEligible:false as const,blockers:['enabled unavailable','RAM/Flash source unverified','stereo completeness unverified','freshness unverified']};
}
