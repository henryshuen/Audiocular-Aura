// Isolated browser API inspection only: no device permission, open or transfer.
import {createServer} from 'node:http';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const run=promisify(execFile);
// Offline descriptor walk; a nonprotected interface would be a lead, not PASS.
export function configurationInterfaces(hex){
 if(!/^(?:[0-9a-f]{2})+$/i.test(hex))throw Error('Invalid configuration hex');
 const data=Buffer.from(hex,'hex');
 if(data.length<9||data[0]!==9||data[1]!==2||data.readUInt16LE(2)!==data.length)throw Error('Incomplete configuration');
 const interfaces=[];
 for(let offset=0;offset<data.length;){
  const size=data[offset];if(size<2||offset+size>data.length)throw Error('Malformed descriptor');
  if(data[offset+1]===4){if(size!==9)throw Error('Malformed interface');interfaces.push({number:data[offset+2],alternate:data[offset+3],classCode:data[offset+5],protectedClass:[1,3,8,9,11,14,16,224].includes(data[offset+5])});}
  offset+=size;
 }
 if(new Set(interfaces.map(i=>i.number)).size!==data[4])throw Error('Incomplete interface inventory');
 return interfaces;
}
export const probeHtml=`<!doctype html><meta charset="utf-8"><pre id="result"></pre><script>
const methods=name=>typeof window[name]==='function'?Object.getOwnPropertyNames(window[name].prototype).sort():[];
document.getElementById('result').textContent=JSON.stringify({
 secureContext:isSecureContext,userAgent:navigator.userAgent,
 hidAvailable:!!navigator.hid,usbAvailable:!!navigator.usb,
 hidMethods:methods('HIDDevice'),usbMethods:methods('USBDevice'),
 devicePermissionRequested:false,deviceOpened:false,deviceTransfers:0,
 limitation:'API surface only; not device discovery, descriptor or browser hardware PASS'
});</script>`;
export function parseProbe(dom){
 const match=dom.match(/<pre id="result">([^<]+)<\/pre>/);
 if(!match)throw Error('Browser did not produce an API result');
 const result=JSON.parse(match[1].replaceAll('&quot;','"').replaceAll('&amp;','&').replaceAll('&gt;','>').replaceAll('&lt;','<'));
 if(!result.secureContext||result.deviceTransfers!==0||result.devicePermissionRequested||result.deviceOpened)throw Error('Invalid API-only probe');
 return result;
}
export async function probeBrowser(executable,outputDirectory){
 const profile=mkdtempSync(resolve(outputDirectory,'browser-profile-'));
 const server=createServer((_req,res)=>res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(probeHtml));
 try{
  await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
  const args=['--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-sync','--disable-extensions',`--user-data-dir=${profile}`,'--dump-dom',`http://127.0.0.1:${server.address().port}/`];
  const {stdout}=await run(executable,args,{timeout:20000,maxBuffer:1024*1024,windowsHide:true});
  const result={...parseProbe(stdout),context:'Isolated headless profile on loopback secure context; no permission grant',capturedUtc:new Date().toISOString()};
  writeFileSync(resolve(profile,'api-result.json'),JSON.stringify(result,null,2));
  return result;
 }finally{if(server.listening)await new Promise(ok=>server.close(ok));}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{if(process.argv.length!==4)throw Error('Usage: node browser-surface-probe.mjs <installed browser exe> <existing output directory>');console.log(JSON.stringify(await probeBrowser(process.argv[2],process.argv[3]),null,2));}catch(error){console.error(String(error));process.exitCode=1;}
}
