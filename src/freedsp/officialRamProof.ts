// M2F diagnostic only; never imported by the normal DSP path.
import { requireMatchingReport } from './descriptor.ts';
import { makeOfficialRamWords, nativePeakFloat, nativeScaling, officialRateHz } from '../../scripts/freedsp/ram-semantics.mjs';

export const CTRL = 0xb32d2300;
export type Log = (line: string) => void;
export type ProofCommand = 188 | 187 | 346 | 190 | 90;
export type CafResponse = { reportId: number; count: number; command: number; reply: number; module: number; words: number[]; capacityWords: number[] };
export const hex = (bytes: Uint8Array) => [...bytes].map(b => b.toString(16).padStart(2, '0')).join(' ');

// Generic codec for fixture replay; exchange has a separate command allowlist.
export function encodeCaf(command: number, words: number[], reply = 0, count = words.length, module = CTRL) {
  if (!Number.isInteger(command) || command < 0 || command > 0x7fff || ![0, 1].includes(reply)
    || !Number.isInteger(count) || count < 0 || count > 13 || words.length > 13
    || !words.every(w => Number.isInteger(w) && w >= -0x80000000 && w <= 0xffffffff)) throw new Error('Invalid CAF fields');
  const data = new Uint8Array(61), view = new DataView(data.buffer);
  view.setUint32(1, count | (command << 16) | (reply << 31), true);
  view.setUint32(5, module, true);
  words.forEach((w, i) => view.setUint32(9 + i * 4, w >>> 0, true));
  const helper = new Uint8Array(62); helper[0] = 1; helper.set(data, 1);
  return { reportId: 1, data, helper, logicalHelperBytes: 10 + words.length * 4 };
}

export function parseCaf(reportId: number, data: DataView): CafResponse {
  if (reportId !== 1 || data.byteLength !== 61) throw new Error(`MISMATCH reportId=${reportId} length=${data.byteLength}`);
  const count = data.getUint16(1, true), packed = data.getUint32(1, true);
  if (data.getUint8(0) !== 0 || count > 13) throw new Error('MISMATCH prefix/count');
  const capacityWords = Array.from({ length: 13 }, (_, i) => data.getInt32(9 + i * 4, true));
  return { reportId, count, command: (packed >>> 16) & 0x7fff, reply: packed >>> 31,
    module: data.getUint32(5, true), words: capacityWords.slice(0, count), capacityWords };
}

export function guardProofDevice(device: HIDDevice) {
  requireMatchingReport(device, 'output', 61); requireMatchingReport(device, 'input', 61);
}

function guardCommand(command: number, words: number[]) {
  if (![188, 187, 346, 190, 90].includes(command)) throw new Error('Blocked: no Flash or arbitrary command in M2F');
  if (command === 187 && (words.length !== 1 || words[0] !== 0)) throw new Error('Invalid187');
  if (command === 188 && (words.length !== 13 || words[0] !== 1 || words.slice(1).some(w => w !== 0))) throw new Error('Invalid188');
  if (command === 346 && (words.length !== 13 || words[0] !== 62 || words.slice(1).some(w => w !== 0))) throw new Error('Invalid346');
  if (command === 90 && (words.length !== 13 || words[0] !== 90 || words.slice(1).some(w => w !== 0))) throw new Error('Only custom mode0 permitted');
  if (command === 190 && (words.length !== 13 || words[0] !== 0 || words[1] !== 5 || words.slice(8).some(w => w !== 0)
    || words.slice(3, 8).some(w => Math.abs(w) > 0x7fffff))) throw new Error('Only selector0/wire5/signed24 RAM permitted');
}

export async function exchangeCaf(device: HIDDevice, command: ProofCommand, words: number[], log: Log, timeoutMs = 2500): Promise<CafResponse> {
  guardProofDevice(device); guardCommand(command, words);
  const packet = encodeCaf(command, words);
  if (!device.opened) await device.open();
  log(`TX reportId=1 dataBytes=61 command=${command} count=${words.length} module=0x${CTRL.toString(16)} words=${JSON.stringify(words)}`);
  log(`TX data ${hex(packet.data)}`); log(`TX helper62 ${hex(packet.helper)}`);
  if (command === 187) log('EXPERIMENTAL187: logical helper14; count1 retained, zero padding to fixed WebHID61. Compatibility unproven; ACK required.');
  return new Promise((resolve, reject) => {
    let settled = false, mismatch = false, sent = false, response: CafResponse | null = null;
    const finish = (error?: Error) => {
      if (settled) return; settled = true;
      clearTimeout(timer); device.removeEventListener('inputreport', receive);
      if (error) { log(error.message); reject(error); }
      else { log(`ACK command=${command}; vendor response only, audible effect unproven`); resolve(response!); }
    };
    const receive = (event: HIDInputReportEvent) => {
      log(`RX reportId=${event.reportId} dataBytes=${event.data.byteLength} hex=${hex(new Uint8Array(event.data.buffer, event.data.byteOffset, event.data.byteLength))}`);
      if (event.reportId !== 1) { log('RX ignored non-CAF report ID'); return; }
      try {
        const parsed = parseCaf(event.reportId, event.data); log(`RX parsed ${JSON.stringify(parsed)}`);
        if (parsed.command !== command || parsed.reply !== 1 || parsed.module !== CTRL) throw new Error('MISMATCH command/reply/module');
        // Official isExecuteSuccess requires reply1/nonnegative count. Count0
        // write ACKs are observed; do not require returned words to echo the TX.
        if (command === 346 && parsed.count < 2) throw new Error('MISMATCH346 missing rate word1');
        response = parsed; if (sent) finish();
      } catch (error) { mismatch = true; log(String(error)); }
    };
    const timer = setTimeout(() => finish(new Error(`${mismatch ? 'MISMATCH' : 'TIMEOUT'} command=${command}; sequence stopped`)), timeoutMs);
    device.addEventListener('inputreport', receive);
    try {
      void device.sendReport(1, packet.data).then(() => { if (settled) return; sent = true; log(`HOST SENT command=${command}; not DSP success`); if (response) finish(); }, error => finish(new Error(`SEND ERROR ${String(error)}`)));
    } catch (error) { finish(new Error(`SEND ERROR ${String(error)}`)); }
  });
}

export function proofCoefficients(sampleHz: number, flat: boolean) {
  if (!officialRateHz.slice(4, 9).includes(sampleHz)) throw new Error('Unknown current sample rate; no RAM write');
  const floats = nativePeakFloat({ frequency: 1000, gainDb: flat ? 0 : -12, q: 0.7, sampleHz });
  const scaling = nativeScaling(floats.coefficients);
  // Explicit approximation: exact native 32-candidate final selection is not ported.
  const words = flat ? [2 ** 22, 0, 0, 0, 0] : floats.coefficients.map(c => Math.round(Math.fround(c * scaling.scale)));
  if (words.some(w => Math.abs(w) > 0x7fffff)) throw new Error('signed24 overflow');
  const a1 = -words[3] / scaling.scale, a2 = -words[4] / scaling.scale;
  if (!(Math.abs(a2) < 1 && 1 + a1 + a2 > 0 && 1 - a1 + a2 > 0)) throw new Error('Unstable quantized poles');
  return { sampleHz, flat, ...floats, ...scaling, words, payload: makeOfficialRamWords(0, { gain: scaling.gain, words }) };
}

export async function runRamProof(device: HIDDevice, flat: boolean, log: Log) {
  guardProofDevice(device);
  log(`M2F ${flat ? 'RESTORE FLAT' : 'SAFE TEST -12dB'} selector0 SDKband0→wire5; RAM only; no90/noFlash`);
  await exchangeCaf(device, 188, [1, ...Array(12).fill(0)], log);
  await exchangeCaf(device, 187, [0], log);
  const rate = await exchangeCaf(device, 346, [62, ...Array(12).fill(0)], log);
  const index = rate.words[1];
  if (!Number.isInteger(index) || index < 4 || index > 8) throw new Error(`Unknown rate index=${index}; no190 sent (no guessed fallback)`);
  const coefficients = proofCoefficients(officialRateHz[index], flat);
  log(`COEFFICIENTS rateIndex=${index} ${JSON.stringify(coefficients)} rounding=nearest diagnostic approximation; native final LSB unknown`);
  const [B0, B1, B2, A0, A1] = coefficients.words;
  log(`INTEGER COEFFICIENTS ${JSON.stringify({ B0, B1, B2, A0, A1, Gain: coefficients.gain, scale: coefficients.scale })}; A0=-normalized a1/A1=-normalized a2`);
  await exchangeCaf(device, 190, coefficients.payload, log);
  log('SEQUENCE ACKED; Henry listening result pending. No Flash or automatic preset switch.');
}

export async function selectCustomMode(device: HIDDevice, log: Log) {
  log('MANUAL90 custom0: independent preset operation; RAM overwrite effect unknown');
  await exchangeCaf(device, 90, [90, ...Array(12).fill(0)], log);
}
