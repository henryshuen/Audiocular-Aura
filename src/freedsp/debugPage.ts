/// <reference types="vite/client" />
import { inspectFreeDSPDescriptor, selectFreeDSPForInspection } from './descriptor.ts';
import { guardProofDevice, runRamProof, selectCustomMode } from './officialRamProof.ts';

// Independent DEV page; no production imports or automatic sends.
if (import.meta.env.DEV) {
  const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const output = el<HTMLTextAreaElement>('log'), status = el<HTMLParagraphElement>('status');
  const select = el<HTMLButtonElement>('select-device'), inspect = el<HTMLButtonElement>('inspect');
  const safe = el<HTMLInputElement>('safety'), apply = el<HTMLButtonElement>('attenuation');
  const flat = el<HTMLButtonElement>('flat'), mode = el<HTMLButtonElement>('custom-mode');
  let device: HIDDevice | null = null, busy = false;
  const log = (line: string) => { output.value += `${new Date().toISOString()} ${line}\n`; output.scrollTop = output.scrollHeight; console.info(`[M2F] ${line}`); };
  const update = () => {
    select.disabled = busy || !navigator.hid; inspect.disabled = busy || !device; safe.disabled = busy;
    let valid = false, reason = '先手動選取並檢查FreeDSP；連線不傳送命令。';
    if (device) {
      try { guardProofDevice(device); valid = true; reason = 'VID/PID及input/output ID1容量符合；勾選安全條件後才可手動測試。'; }
      catch (error) { reason = String(error); }
    }
    apply.disabled = flat.disabled = mode.disabled = busy || !valid || !safe.checked;
    status.textContent = busy ? '等待CAF回應；請勿操作其他Aura頁籤。' : reason;
  };
  const show = () => {
    if (!device) return;
    const snapshot = inspectFreeDSPDescriptor(device);
    el<HTMLPreElement>('descriptor').textContent = JSON.stringify(snapshot, null, 2);
    log(`INSPECT ONLY ${JSON.stringify(snapshot)}`); update();
  };
  select.addEventListener('click', async () => {
    busy = true; safe.checked = false; device = null; update();
    try { device = await selectFreeDSPForInspection(navigator.hid); if (device) show(); else log('Selection cancelled'); }
    catch (error) { log(`SELECT ERROR ${String(error)}`); }
    finally { busy = false; update(); }
  });
  inspect.addEventListener('click', show); safe.addEventListener('change', update);
  const action = async (kind: 'test' | 'flat' | 'mode') => {
    if (busy || !device || !safe.checked) return;
    busy = true; update();
    try { if (kind === 'mode') await selectCustomMode(device, log); else await runRamProof(device, kind === 'flat', log); }
    catch (error) { log(`STOP ${String(error)}; no automatic retry. Save logs; do not guess another framing.`); }
    finally { busy = false; update(); }
  };
  apply.addEventListener('click', () => void action('test'));
  flat.addEventListener('click', () => void action('flat'));
  mode.addEventListener('click', () => void action('mode'));
  el<HTMLDivElement>('controls').hidden = false; update();
  if (!navigator.hid) status.textContent = '請使用支援WebHID的Chrome/Edge localhost。';
} else document.getElementById('status')!.textContent = '診斷只在Vite DEV模式啟用。';
