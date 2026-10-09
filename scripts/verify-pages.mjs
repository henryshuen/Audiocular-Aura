// Static assets and local subdirectory HTTP smoke only. Never runs page JS or HID.
import {readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createServer} from 'node:http';
export const pagesBase='/Audiocular-Aura/';
export function localPageAssets(html){
 const assets=[];
 for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  const value=match[1];if(/^(?:https?:|data:|mailto:|#)/.test(value))continue;
  const url=new URL(value,'https://static.invalid'+pagesBase);
  if(url.origin!=='https://static.invalid'||!url.pathname.startsWith(pagesBase))throw Error('Asset escapes Pages base: '+value);
  const path=decodeURIComponent(url.pathname.slice(pagesBase.length));
  if(!path||path.includes('..')||path.includes('\\'))throw Error('Invalid asset path: '+value);
  assets.push(path);
 }
 if(!assets.includes('assets/index.js')||!assets.includes('assets/index.css'))throw Error('Missing built module/style');
 return [...new Set(assets)];
}
export async function verifyPages(directory){
 const root=resolve(directory),html=readFileSync(join(root,'index.html'),'utf8');
 const files=['index.html',...localPageAssets(html),'manifest.json','sw.js','icon-192.png','icon-512.png','screenshots/desktop.jpg','screenshots/mobile.jpg'];
 for(const file of files)if(!existsSync(join(root,file)))throw Error('Missing Pages artifact: '+file);
 const manifest=JSON.parse(readFileSync(join(root,'manifest.json'),'utf8'));
 if(manifest.start_url!=='./'||manifest.scope!=='./')throw Error('Manifest subdirectory scope mismatch');
 const server=createServer((req,res)=>{
  const url=new URL(req.url,'http://local.invalid');
  const file=url.pathname===pagesBase?'index.html':url.pathname.slice(pagesBase.length);
  if(!url.pathname.startsWith(pagesBase)||!files.includes(file)){res.writeHead(404).end();return;}
  res.writeHead(200);res.end(readFileSync(join(root,file)));
 });
 try{
  await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
  const port=server.address().port;
  for(const file of [...new Set(files)]){
   const response=await fetch(`http://127.0.0.1:${port}${pagesBase}${file==='index.html'?'':file}`,{signal:AbortSignal.timeout(5000)});
   if(response.status!==200||!(await response.arrayBuffer()).byteLength)throw Error('Subdirectory HTTP failed: '+file);
  }
  return {base:pagesBase,files:[...new Set(files)].length,result:'LOCAL_STATIC_ASSET_PASS',publicDeployment:'UNVERIFIED',freeDspBrowserOnly:'BLOCKED'};
 }finally{if(server.listening)await new Promise(ok=>server.close(ok));}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{console.log(JSON.stringify(await verifyPages(process.argv[2]??'dist')));}catch(error){console.error(String(error));process.exitCode=1;}
}
