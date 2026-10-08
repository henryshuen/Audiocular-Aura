// Windows local-helper adapter. No coefficient math, PEQ sequencing or safety policy here.
import {CTRL,parseCaf} from './cafCodec.ts';
import type {CafCommand,CafTransport} from './cafRam.ts';
export class NativeCafTransport implements CafTransport {
 readonly supportsFlash=true;
 private token='';private controller:AbortController|null=null;private disposed=false;
 constructor(private log:(s:string)=>void,private fetcher:typeof fetch=globalThis.fetch.bind(globalThis)){}
 async connect(){
   if(this.disposed || this.controller)throw new Error('Native transport BUSY／已結束');
   try{const controller=new AbortController();this.controller=controller;const timer=setTimeout(()=>controller.abort(),35000);let s;
     try{const r=await this.fetcher('http://127.0.0.1:5174/session',{cache:'no-store',signal:controller.signal});if(!r.ok)throw new Error('session failed');s=await r.json();}finally{clearTimeout(timer);this.controller=null;}
     if(this.disposed)throw new Error('Native transport已結束');
     if(!['M2S CAF TRANSPORT','M2N RAM ONLY'].includes(s.mode)||!/^[A-F0-9]{64}$/.test(s.token))throw new Error('Helper session mismatch');this.token=s.token;
     await this.post('/connect',null);this.log('FreeDSP native HID adapter connected：唯一CAF metadata確認；無SET/GET。非browser-only。');
   }catch(e){this.token='';throw new Error('FreeDSP需要Windows原生HID helper；用 .\\scripts\\dev.ps1 啟動／重啟。'+String(e));}
 }
 private async post(path:string,body:unknown){
   if(this.disposed || this.controller || !this.token)throw new Error('Native transport未連線／BUSY／已結束');
   const controller=new AbortController();this.controller=controller;const timer=setTimeout(()=>controller.abort(),35000);
   try{const r=await this.fetcher('http://127.0.0.1:5174'+path,{method:'POST',headers:{'Content-Type':'application/json','X-AuraPEQ-Session':this.token},body:JSON.stringify(body),signal:controller.signal});const value=await r.json();
     if(value.log)this.log(value.log);if(value.logPath)this.log('Full log: '+value.logPath);
     if(!r.ok || value.ok!==true || value.exitCode!==0)throw new Error('Native HID exchange failed／STOP；沒有retry。');return value;
   }finally{clearTimeout(timer);this.controller=null;}
 }
 async exchange(command:CafCommand,data:Uint8Array){
   const tx=parseCaf(1,new DataView(data.buffer,data.byteOffset,data.byteLength));if(tx.command!==command || tx.reply!==0 || tx.module!==CTRL)throw new Error('CAF TX mismatch');
   const helper=new Uint8Array(62);helper[0]=1;helper.set(data,1); // Framing only; preserve shared serializer bytes exactly.
   const r=await this.post('/transport',{report:btoa(String.fromCharCode(...helper))});
   if(typeof r.reply!=='string')throw new Error('Missing native matching response');const rx=Uint8Array.from(atob(r.reply),c=>c.charCodeAt(0));if(rx.length!==62 || rx[0]!==1)throw new Error('Native RX framing mismatch');
   const reply=parseCaf(rx[0],new DataView(rx.buffer,rx.byteOffset+1,61));
   if(reply.command!==command || reply.reply!==1 || reply.module!==tx.module || (command===346 && reply.count<2))throw new Error('Native RX CAF mismatch；STOP');return reply;
 }
 dispose(){this.disposed=true;this.token='';this.controller?.abort();}
}
