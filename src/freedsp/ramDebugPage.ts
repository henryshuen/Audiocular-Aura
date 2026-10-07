import type {Band} from '../main.ts';
import {RamBridge,validateBands,fullNinePreset} from './webRam.ts';
if(import.meta.env.DEV && location.hostname==='localhost' && location.port==='5173'){
 const el=<T extends HTMLElement>(id:string)=>{
   const node=document.getElementById(id);if(!node)throw new Error(`Missing M2N HTML element #${id}`);return node as T;
 };
 const logBox=el<HTMLTextAreaElement>('log'),status=el<HTMLParagraphElement>('status'),select=el<HTMLSelectElement>('selection');
 const bridge=new RamBridge();let connected=false,busy=false,faulted=false;
 let bands:Band[]=[31,62,125,250,500,1000,2000,4000,8000].map((freq,index)=>({index,freq,gain:0,q:.7,type:'PK',enabled:true}));
 const active=new Set<number>(),applied=new Set<number>(),restored=new Set<number>(),confirmed=new Set<number>();
 let fullApplied=false,fullRestored=false,applyHeard=false,restoreHeard=false;
 const log=(line:string)=>{logBox.value+=`${new Date().toISOString()} ${line}\n`;logBox.scrollTop=logBox.scrollHeight;};
 // M2O adopts Henry's verified M2N UI1/5/9 Web gate; no repeated single-band gate.
 const update=()=>{
   for(const id of ['apply','restore'])el<HTMLButtonElement>(id).disabled=!connected || busy || faulted;
   el<HTMLButtonElement>('sync').disabled=!connected || busy || faulted;
   el<HTMLButtonElement>('flat').disabled=!connected || busy || faulted;
   el<HTMLButtonElement>('connect').disabled=busy || faulted;
   for(const id of ['safe','load','confirm','preset'])el<HTMLButtonElement>(id).disabled=busy || faulted;
   el<HTMLButtonElement>('heardApply').disabled=busy || faulted || !fullApplied || fullRestored || applyHeard;
   el<HTMLButtonElement>('heardRestore').disabled=busy || faulted || !fullRestored || !applyHeard || restoreHeard;
   document.querySelectorAll<HTMLInputElement>('#bands input').forEach(input=>input.disabled=busy || faulted);
   select.disabled=busy || faulted;
   el('gate').textContent=`M2N UI1/5/9 Web protocol＋可聽Apply/Restore已由Henry確認。M2O全九段：Apply聽感${applyHeard?'YES':'待確認'}／Restore聽感${restoreHeard?'YES':'待確認'}`;
 };
 const render=()=>{
   el('bands').replaceChildren();
   bands.forEach((b,i)=>{
     const row=document.createElement('tr'),label=document.createElement('td');label.textContent=`Band${i+1} → wire${i+1}`;row.append(label);
     for(const field of ['freq','gain','q'] as const){
       const td=document.createElement('td'),input=document.createElement('input');input.type='number';input.value=String(b[field]);
       input.min=field==='freq'?'20':field==='gain'?'-12':'.1';input.max=field==='freq'?'20000':field==='gain'?'0':'10';input.step=field==='freq'?'1':'.1';
       input.setAttribute('aria-label',`Band${i+1} ${field}`);input.addEventListener('input',()=>{b[field]=Number(input.value);confirmed.delete(i);applied.delete(i);restored.delete(i);update();});td.append(input);row.append(td);
     }
     const td=document.createElement('td'),enabled=document.createElement('input');enabled.type='checkbox';enabled.checked=b.enabled;enabled.setAttribute('aria-label',`Band${i+1} enabled`);
     enabled.addEventListener('change',()=>{b.enabled=enabled.checked;confirmed.delete(i);applied.delete(i);restored.delete(i);update();});td.append(enabled);row.append(td);
     const type=document.createElement('td');type.textContent=b.type;row.append(type);el('bands').append(row);
   });update();
 };
 render(); // Render editor and enable Connect before any explicit bridge request.
 log('M2N UI READY: nine editor rows rendered; no bridge/session request or hardware action yet.');
 status.textContent='九列編輯器已就緒；請按連線（僅metadata）。';
 for(let i=0;i<9;i++){const option=document.createElement('option');option.value=String(i);option.textContent=`UI Band${i+1} → wire${i+1}`;select.append(option);}
 el('connect').addEventListener('click',async()=>{
   busy=true;update();try{const r=await bridge.connect();log(r.log);if(r.logPath)log('Full log: '+r.logPath);connected=true;status.textContent='FreeDSP metadata已確認；沒有讀回EQ／沒有SET。選一段後手動Apply。';}
   catch(e){connected=false;const reason=String(e);log('CONNECT ERROR: '+reason);status.textContent='連線失敗；未啟用RAM操作。 '+reason;}finally{busy=false;update();}
 });
 el('safe').addEventListener('click',()=>{const i=Number(select.value);bands[i]={index:i,freq:400,gain:-12,q:1,type:'PK',enabled:true};confirmed.delete(i);applied.delete(i);restored.delete(i);render();log(`UI Band${i+1} test editor filled; no TX`);});
 el('preset').addEventListener('click',()=>{bands=fullNinePreset();render();log('M2O full-nine negative PK preset loaded into editor only; no TX. First Apply: IEM out of ears.');});
 el('heardApply').addEventListener('click',()=>{if(!fullApplied || fullRestored || busy || faulted)return;applyHeard=true;log('Henry manual confirmation: M2O full-nine audible Apply YES');update();});
 el('heardRestore').addEventListener('click',()=>{if(!fullRestored || !applyHeard || busy || faulted)return;restoreHeard=true;log('Henry manual confirmation: M2O full-nine audible Restore YES; both listening confirmations complete');update();});
 el('load').addEventListener('click',()=>{try{bands=validateBands(JSON.parse(localStorage.getItem('aura_active_eq_state') || 'null'));confirmed.clear();applied.clear();restored.clear();render();log('Loaded UI editor values only; no TX, no preamp/tilt');}catch(e){log(String(e));}});
 el('confirm').addEventListener('click',()=>{
   const i=Number(select.value);if(!applied.has(i) || !restored.has(i) || active.size){log('確認未接受：需本band成功Apply＋Restore，且所有本次測試band已還原。');return;}
   confirmed.add(i);log(`Henry manual confirmation: UI Band${i+1} audible change and recovery YES`);update();
 });
 const run=async(action:'applyBand'|'restoreBand'|'syncNine'|'restoreNine')=>{
   if(!connected || busy || faulted)return;const i=Number(select.value);
   if(action==='applyBand' && [...active].some(n=>n!==i)){log('先Restore本次已Apply的其他band，避免累積。');return;}
   busy=true;status.textContent='等待native matching CAF；不會自動重試。';update();
   try{
     const r=await bridge.run(action,i,bands);log(r.log);if(r.logPath)log('Full log: '+r.logPath);
     if(action==='applyBand' || action==='restoreBand'){fullApplied=false;fullRestored=false;applyHeard=false;restoreHeard=false;}
     if(action==='applyBand'){restored.delete(i);if(bands[i].enabled && bands[i].gain<0){applied.add(i);active.add(i);}else{applied.delete(i);active.delete(i);}}
     if(action==='restoreBand'){restored.add(i);active.delete(i);}
     if(action==='syncNine'){fullApplied=true;fullRestored=false;applyHeard=false;restoreHeard=false;bands.forEach((b,j)=>{if(b.enabled && b.gain<0)active.add(j);else active.delete(j);});}
     if(action==='restoreNine'){fullRestored=fullApplied;restoreHeard=false;active.clear();}
     status.textContent='協定完成；請確認聽感。Restore為unity；不代表原EQ備份或持久保存。';render();
   }catch(e){faulted=true;log(String(e));status.textContent='STOP：可能部分完成／狀態未知；不要重試。複製完整log供檢查。';}
   finally{busy=false;update();}
 };
 el('apply').addEventListener('click',()=>void run('applyBand'));el('restore').addEventListener('click',()=>void run('restoreBand'));
 el('sync').addEventListener('click',()=>run('syncNine'));el('flat').addEventListener('click',()=>run('restoreNine'));
 el('copy').addEventListener('click',()=>{logBox.select();void navigator.clipboard.writeText(logBox.value).catch(()=>{log('請手動全選複製。');});});render();
}else {
 const message='M2N UI STARTUP BLOCKED: 請使用Vite DEV http://localhost:5173/；目前origin='+location.origin;
 document.getElementById('status')!.textContent=message;
 (document.getElementById('log') as HTMLTextAreaElement).value+=message+'\n';
}
