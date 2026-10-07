import type {Band} from '../main.ts';
import {RamBridge,validateBands,fullNinePreset,unityPreset,positiveBandPreset,positiveMultiPreset,analyzeSafety,M2R_GATE_KEY} from './webRam.ts';
if(import.meta.env.DEV && location.hostname==='localhost' && location.port==='5173'){
 const el=<T extends HTMLElement>(id:string)=>{const n=document.getElementById(id);if(!n)throw new Error(`Missing M2R element #${id}`);return n as T;};
 const bridge=new RamBridge(),logBox=el<HTMLTextAreaElement>('log'),status=el('status'),select=el<HTMLSelectElement>('selection');
 let bands:Band[]=unityPreset(),connected=false,busy=false,faulted=false,baseline=false;
 const active=new Set<number>();
 type Stage='P1'|'P2'|'NEG';
 type RecordItem={stage:Stage|null;restore:boolean;pop:string;stereo:string;audible:string;recovery:string};
 const records:RecordItem[]=[];let last:{stage:Stage|null;restore:boolean}|null=null;
 const log=(s:string)=>{logBox.value+=`${new Date().toISOString()} ${s}\n`;logBox.scrollTop=logBox.scrollHeight;};
 const revoke=()=>{localStorage.removeItem(M2R_GATE_KEY);};
 const presetStage=(action:string,i:number):Stage|null=>{
   const equal=(target:Band[])=>JSON.stringify(bands)===JSON.stringify(target);
   if(action==='applyBand' && i===4 && equal(positiveBandPreset()))return 'P1';
   if(action==='syncNine' && equal(positiveMultiPreset()))return 'P2';
   if(action==='syncNine' && equal(fullNinePreset()))return 'NEG';return null;
 };
 const update=()=>{
   let invalid=false;try{validateBands(bands);}catch{invalid=true;}
   for(const id of ['apply','sync'])el<HTMLButtonElement>(id).disabled=!connected || busy || faulted || invalid || !baseline;
   for(const id of ['restore','flat'])el<HTMLButtonElement>(id).disabled=!connected || busy;
   el<HTMLButtonElement>('connect').disabled=busy || connected;
   for(const id of ['safe','gatePreset','positiveMulti','load','preset'])el<HTMLButtonElement>(id).disabled=busy || faulted;
   for(const id of ['record','confirm','heardApply','heardRestore'])el<HTMLButtonElement>(id).disabled=busy || !last;
   document.querySelectorAll<HTMLInputElement>('#bands input').forEach(n=>n.disabled=busy || faulted);
   select.disabled=busy || faulted;
   if(invalid && connected && !busy)status.textContent='編輯值無效；Apply阻擋，仍可明確Restore。';
 };
 const render=()=>{
   el('bands').replaceChildren();bands.forEach((b,i)=>{
     const row=document.createElement('tr'),label=document.createElement('td');label.textContent=`Band${i+1} → wire${i+1}`;row.append(label);
     for(const field of ['freq','gain','q'] as const){const td=document.createElement('td'),input=document.createElement('input');input.type='number';input.value=String(b[field]);input.min=field==='freq'?'20':field==='gain'?'-12':'.1';input.max=field==='freq'?'20000':field==='gain'?'12':'10';input.step=field==='freq'?'1':'.1';input.setAttribute('aria-label',`Band${i+1} ${field}`);input.addEventListener('input',()=>{b[field]=Number(input.value);update();});td.append(input);row.append(td);}
     const td=document.createElement('td'),enabled=document.createElement('input');enabled.type='checkbox';enabled.checked=b.enabled;enabled.addEventListener('change',()=>{b.enabled=enabled.checked;update();});td.append(enabled);row.append(td);const type=document.createElement('td');type.textContent='PK';row.append(type);el('bands').append(row);
   });update();
 };
 render();log('M2R UI READY: nine editor rows rendered; no bridge/session request or hardware action yet.');
 for(let i=0;i<9;i++){const n=document.createElement('option');n.value=String(i);n.textContent=`UI Band${i+1} → wire${i+1}`;select.append(n);}select.value='4';
 el('connect').addEventListener('click',async()=>{if(busy || connected)return;busy=true;update();try{const r=await bridge.connect();log(r.log);connected=true;status.textContent='FreeDSP metadata已確認；先明確緊急Restore全九段建立unity baseline。';}catch(e){log('CONNECT ERROR: '+String(e));status.textContent='連線失敗：'+String(e);}finally{busy=false;update();}});
 const fill=(value:Band[],s:string)=>{bands=value;select.value='4';render();log(s+'；只改編輯器、沒有TX。');};
 el('safe').addEventListener('click',()=>fill(positiveBandPreset(),'P1 Band5 1000Hz/+6dB/Q1'));
 el('gatePreset').addEventListener('click',()=>fill(positiveBandPreset(),'P1 Band5 1000Hz/+6dB/Q1'));
 el('positiveMulti').addEventListener('click',()=>fill(positiveMultiPreset(),'P2 250/1000/4000Hz各+1dB/Q1'));
 el('preset').addEventListener('click',()=>fill(fullNinePreset(),'NEG full-nine負增益'));
 el('load').addEventListener('click',()=>{try{fill(validateBands(JSON.parse(localStorage.getItem('aura_active_eq_state')||'null')),'載入本地九段');}catch(e){log(String(e));}});
 const run=async(action:'applyBand'|'restoreBand'|'syncNine'|'restoreNine')=>{
   const restore=action==='restoreBand'||action==='restoreNine',i=Number(select.value);
   if(!connected || busy || (!restore && faulted))return;
   let stage:Stage|null=null;
   if(!restore){
     try{validateBands(bands);if(!baseline)throw new Error('先全九段unityRestore建立baseline');
       if(action==='applyBand' && [...active].some(n=>n!==i))throw new Error('先Restore已Apply的其他band，避免累積');
       const target=action==='applyBand'?bands.map(b=>b.index===i?b:{...b,gain:0}):bands;
       const s=analyzeSafety(target);log(`SAFETY peak=${s.peakDb.toFixed(3)}dB positiveSum=${s.positiveSumDb.toFixed(3)}dB`);
       stage=presetStage(action,i);
     }catch(e){log('EDITOR VALIDATION: '+String(e)+'；未送出，Restore仍可用。');update();return;}
   }else stage=last?.restore?null:last?.stage??null;
   busy=true;update();revoke();
   try{const r=await bridge.run(action,i,restore?unityPreset():bands);log(r.log);if(r.logPath)log('Full log: '+r.logPath);
     if(action==='syncNine'){active.clear();bands.forEach((b,j)=>{if(b.enabled && b.gain!==0)active.add(j);});}
     if(action==='applyBand'){if(bands[i].enabled && bands[i].gain!==0)active.add(i);else active.delete(i);}
     if(action==='restoreBand'){active.delete(i);stage=i===4 && stage==='P1'?stage:null;}
     if(action==='restoreNine'){active.clear();baseline=true;faulted=false;}
     last={stage,restore};for(const id of ['obsPop','obsStereo','obsAudible','obsRecovery'])el<HTMLSelectElement>(id).value='U';status.textContent='協定完成；請聽後記錄觀察。Restore為unity，不是原EQ備份。';
   }catch(e){faulted=true;last=null;baseline=false;log(String(e));status.textContent='STOP：可能部分完成／狀態未知；無自動重試／rollback。仍可明確緊急Restore全部unity。';}
   finally{busy=false;update();}
 };
 el('apply').addEventListener('click',()=>run('applyBand'));el('restore').addEventListener('click',()=>run('restoreBand'));el('sync').addEventListener('click',()=>run('syncNine'));el('flat').addEventListener('click',()=>run('restoreNine'));
 const record=()=>{
   if(busy || !last)return;
   const r:RecordItem={...last,pop:el<HTMLSelectElement>('obsPop').value,stereo:el<HTMLSelectElement>('obsStereo').value,audible:el<HTMLSelectElement>('obsAudible').value,recovery:el<HTMLSelectElement>('obsRecovery').value};
   records.push(r);log('Henry observation: '+JSON.stringify(r));
   // Only the latest observation of each exact preset/action counts; never infer listening from protocol PASS.
   const good=(stage:Stage,restore:boolean)=>{const a=records.filter(x=>x.stage===stage && x.restore===restore).at(-1);return !!a && a.stereo==='C' && (restore?a.recovery==='Y':a.audible==='Y');};
   const passed=['P1','P2','NEG'].every(s=>good(s as Stage,false)&&good(s as Stage,true)) && !active.size && !faulted;
   if(passed){localStorage.setItem(M2R_GATE_KEY,JSON.stringify({version:1,validated:true,at:new Date().toISOString(),records}));el('gate').textContent='M2R手動關卡已紀錄成功；同一build可返回主圖形頁進行驗證#2。';}
   else{revoke();el('gate').textContent='M2R待確認：P1／P2／NEG各Apply audible Y+stereo C，Restore recovery Y+stereo C。click/pop可U，不阻擋Restore。';}update();
 };
 for(const id of ['record','confirm','heardApply','heardRestore'])el(id).addEventListener('click',record);
 el('copy').addEventListener('click',()=>{logBox.select();void navigator.clipboard.writeText(logBox.value).catch(()=>log('請手動全選複製。'));});
}else{const m='M2R UI STARTUP BLOCKED: 請使用Vite DEV http://localhost:5173/；目前origin='+location.origin;document.getElementById('status')!.textContent=m;(document.getElementById('log') as HTMLTextAreaElement).value+=m+'\n';}
