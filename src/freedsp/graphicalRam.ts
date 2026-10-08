import type {Band} from '../main.ts';
import {freeDspGainRange} from './capabilities.ts';
import {RamBridge,analyzeSafety,M2R_GATE_KEY,mixedPreset,unityPreset} from './webRam.ts';

let experimentalActive=false;
export const isExperimentalFreeDspActive=()=>experimentalActive;
export const isFreeDsp=(d:{vendorId:number;productId:number})=>d.vendorId===0x35d8 && d.productId===0x1496;
export function hasM2RGate(storage:Pick<Storage,'getItem'>){
  try{const r=JSON.parse(storage.getItem(M2R_GATE_KEY)||'null');return r?.version===1 && r?.validated===true;}catch{return false;}
}
// Separate native session: never install a legacy WebHID device or realtime write queue.
export class GraphicalRam {
  connected=false;busy=false;faulted=false;
  constructor(private bridge=new RamBridge(),private storage:Pick<Storage,'getItem'>=localStorage){}
  async connect(){
    if(!hasM2RGate(this.storage))throw new Error('先完成 M2R 隔離頁 P1／P2／負增益的聽感、置中與恢復紀錄；未開放圖形 Sync。');
    if(this.busy)throw new Error('BUSY');this.busy=true;experimentalActive=true;
    try{const r=await this.bridge.connect();this.connected=true;return r;}
    catch(e){this.connected=false;experimentalActive=false;throw e;}finally{this.busy=false;}
  }
  async sync(bands:Band[]){
    if(!hasM2RGate(this.storage))throw new Error('M2R gate missing');
    if(!this.connected || this.busy || this.faulted)throw new Error('未連線／BUSY／STOP');
    analyzeSafety(bands); // Validity only; retired development +6dB gate removed.
    this.busy=true;
    try{return await this.bridge.run('syncNine',0,bands);}catch(e){this.faulted=true;throw e;}finally{this.busy=false;}
  }
  async restore(){
    if(!this.connected || this.busy)throw new Error('尚未連線／BUSY');
    this.busy=true;
    try{const r=await this.bridge.run('restoreNine',0,unityPreset());this.faulted=false;return r;}catch(e){this.faulted=true;throw e;}finally{this.busy=false;}
  }
  disconnect(){if(this.busy)throw new Error('BUSY');this.connected=false;experimentalActive=false;}
}
export function mountGraphicalRam(options:{getBands:()=>Band[];setBands:(bands:Band[])=>void;getDevice:()=>HIDDevice|null;resetUnsupported:()=>void;unsupportedIsZero:()=>boolean;log:(s:string)=>void}){
  const c=new GraphicalRam(),panel=document.createElement('section');panel.className='control-card';panel.style.gridColumn='1 / -1';
  panel.innerHTML=`<h2>FreeDSP M2R 實驗圖形 RAM PEQ</h2>
  <p>先在隔離頁完成手動驗證 #1，再於此明確連線。拖曳／編輯只改本地；只有此處 Sync 或主頁 SYNC 才寫入18個190。PK／官方App每段政策${freeDspGainRange.min}..+${freeDspGainRange.max}dB，非硬體或安全保證。圖形為48kHz原生float模型示意，安全分析使用五種速率的量化係數，實際寫入只用matching346當前速率。無 preamp／tilt／Flash／utility／readback。</p>
  <p>曲線是編輯值，不是裝置讀回。Restore 不修改編輯器，只將兩側九段寫 unity；之後明確 Sync 會重新套用目前編輯值。全九段有18次寫入，失敗立即STOP、無自動重試／rollback；緊急Restore是另一個明確操作。</p>
  <p>正增益仍可能使接近滿刻度的訊號削波（clipping）；原6dB開發預算不是硬體限制，也不是無削波保證，現已移除。APO OFF、音量1–2/100、首次正增益Apply耳機離耳、只用音樂不用測試音；異常立即停止。</p>
  <p>單段增益範圍不限制合成曲線；重疊正增益可超出+6dB。暫時+6dB開發門檻已移除；本頁為歷史診斷入口，正常主頁使用既有警告／確認。</p>
  <button class="btn btn-secondary" id="freeConnect">連線 FreeDSP metadata（需 M2R gate）</button>
  <button class="btn btn-secondary" id="freeMixed">填入保守正負混合預設（只改編輯器）</button>
  <button class="btn btn-secondary" id="freePreview">檢查合成響應（不送出）</button>
  <button class="btn btn-primary" id="freeSync">明確 Sync 雙聲道 RAM</button>
  <button class="btn btn-danger" id="freeRestore">緊急 Restore 全九段雙聲道 unity</button>
  <button class="btn btn-secondary" id="freeDisconnect">結束 FreeDSP 圖形模式（不自動Restore）</button><p id="freeStatus">M2R gate 尚待確認；沒有硬體動作。</p>`;
  document.querySelector('main')?.prepend(panel);
  const button=(id:string)=>panel.querySelector<HTMLButtonElement>('#'+id)!;
  const status=panel.querySelector<HTMLParagraphElement>('#freeStatus')!;
  const update=()=>{
    button('freeConnect').disabled=c.busy || c.connected;
    for(const id of ['freeSync','freeMixed','freePreview'])button(id).disabled=!c.connected || c.busy || c.faulted;
    button('freeRestore').disabled=!c.connected || c.busy;button('freeDisconnect').disabled=c.busy;
    if(c.connected){
      document.querySelectorAll<HTMLInputElement|HTMLSelectElement>('#eqStrips input, #eqStrips select').forEach(el=>el.disabled=c.busy);
      for(const id of ['btnSync','btnSendToDevice']){const b=document.getElementById(id) as HTMLButtonElement|null;if(b)b.disabled=c.busy || c.faulted;}
    }
  };
  const perform=async(fn:()=>Promise<{log:string;logPath?:string}>)=>{
    try{const p=fn();update();const r=await p;options.log(r.log+(r.logPath?'\nFull log: '+r.logPath:''));status.textContent='協定完成；仍需 Henry 聽感確認。unity 不是原 EQ 備份；不宣稱持久保存。';}
    catch(e){options.log(String(e));status.textContent=String(e)+'；沒有自動重試／rollback。可明確選擇全九段 unity Restore。';}finally{update();}
  };
  const sync=()=>perform(async()=>{
    if(options.getDevice())throw new Error('先中斷其他 WebHID DAC，避免同時控制。');
    if(!options.unsupportedIsZero())throw new Error('此 FreeDSP 路徑尚未實作 preamp/AutoPreamp/tilt；請結束並重新連線此模式，勿將匯入的額外增益當作已套用。');
    const s=analyzeSafety(options.getBands());options.log(`FreeDSP composite predicted peak=${s.peakDb.toFixed(2)}dB positive budget=${s.positiveSumDb.toFixed(2)}dB; App policy ${freeDspGainRange.min}..+${freeDspGainRange.max}dB; not hardware/safety limits`);
    return c.sync(options.getBands());
  });
  button('freeConnect').addEventListener('click',()=>perform(async()=>{
    if(options.getDevice())throw new Error('先中斷其他 WebHID DAC。');
    const r=await c.connect();options.resetUnsupported();options.setBands(unityPreset());return r;
  }));
  button('freeMixed').addEventListener('click',()=>{if(!c.connected || c.busy || c.faulted)return;options.setBands(mixedPreset());options.log('混合預設填入：本地編輯，尚未送出。');update();});
  button('freePreview').addEventListener('click',()=>{try{const s=analyzeSafety(options.getBands());status.textContent=`官方App每段政策${freeDspGainRange.min}..+${freeDspGainRange.max}dB；五個已知 sample rates 合成峰值估計 ${s.peakDb.toFixed(2)}dB，正增益預算 ${s.positiveSumDb.toFixed(2)}dB；模型驗證通過；不代表聽力安全或硬體headroom。估計非響應量測，不含preamp/tilt。`;}catch(e){status.textContent=String(e);}});
  button('freeSync').addEventListener('click',sync);
  button('freeRestore').addEventListener('click',()=>perform(()=>c.restore()));
  button('freeDisconnect').addEventListener('click',()=>{c.disconnect();location.reload();});
  update();return {sync,active:()=>c.connected};
}
