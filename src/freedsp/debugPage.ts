/// <reference types="vite/client" />
import { inspectFreeDSPDescriptor, selectFreeDSPForInspection } from './descriptor.ts';
import { guardProofDevice } from './officialRamProof.ts';
import { connectTransportInspection, querySampleRateOnly } from './cafTransportDiagnosis.ts';
import type { CafInputSession } from './cafTransportDiagnosis.ts';

// M2G DEV-only: connect/open is passive; the sole command button sends346.
if (import.meta.env.DEV) {
  const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const output = el<HTMLTextAreaElement>('log'), status = el<HTMLParagraphElement>('status');
  const select = el<HTMLButtonElement>('select-device'), inspect = el<HTMLButtonElement>('inspect');
  const query = el<HTMLButtonElement>('query-rate'), counter = el<HTMLParagraphElement>('rx-counter');
  let session: CafInputSession | null = null, busy = false;
  const log = (line: string) => { output.value += `${new Date().toISOString()} ${line}\n`; output.scrollTop = output.scrollHeight; console.info(`[M2G] ${line}`); };
  const update = () => {
    select.disabled = busy || !navigator.hid; inspect.disabled = busy || !session;
    query.disabled = busy || !session?.active || !session.device.opened;
    counter.textContent = `RAW listener: ${session?.active ? 'ACTIVE' : 'INACTIVE'} / input events: ${session?.eventCount ?? 0}`;
    status.textContent = busy ? '處理連線或等待346；所有input events持續記錄。' : session?.active ? '僅允許手動查詢346；M2F Apply/Restore/90已停用。' : '先手動Inspect/connect；開啟裝置但不送命令。';
  };
  const show = () => {
    if (!session) return;
    const snapshot = inspectFreeDSPDescriptor(session.device);
    el<HTMLPreElement>('descriptor').textContent = JSON.stringify(snapshot, null, 2);
    log(`DESCRIPTOR ${JSON.stringify(snapshot)}`);
  };
  select.addEventListener('click', async () => {
    busy = true; update();
    try {
      if (session) { const old = session; session = null; old.dispose(); if (old.device.opened) await old.device.close(); }
      const device = await selectFreeDSPForInspection(navigator.hid);
      if (!device) { log('Selection cancelled; no TX'); return; }
      const snapshot = inspectFreeDSPDescriptor(device);
      el<HTMLPreElement>('descriptor').textContent = JSON.stringify(snapshot, null, 2);
      log(`DESCRIPTOR ${JSON.stringify(snapshot)}`); guardProofDevice(device);
      session = await connectTransportInspection(device, log, () => update());
    } catch (error) { log(`CONNECT ERROR ${String(error)}`); }
    finally { busy = false; update(); }
  });
  inspect.addEventListener('click', show);
  query.addEventListener('click', async () => {
    if (busy || !session) return;
    busy = true; update();
    try { await querySampleRateOnly(session, log); }
    catch (error) { log(`STOP ${String(error)}; raw listener remains active. Copy complete log; do not run M2F Apply/Restore.`); }
    finally { busy = false; update(); }
  });
  window.addEventListener('pagehide', () => session?.dispose());
  el<HTMLDivElement>('controls').hidden = false; update();
  if (!navigator.hid) status.textContent = '請使用支援WebHID的Chrome/Edge localhost。';
} else document.getElementById('status')!.textContent = '診斷只在Vite DEV模式啟用。';
