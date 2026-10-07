// M2G DEV diagnostics only. No EQ writes, feature fallback or USB control access.
import { CTRL, encodeCaf, guardProofDevice, hex } from './officialRamProof.ts';
import type { Log } from './officialRamProof.ts';

export type ResponsePolicy = 'MUST_ACK' | 'QUERY_RESPONSE_REQUIRED' | 'SEND_SUCCESS_ONLY' | 'UNKNOWN';
// Policy describes the recovered lower helper; caller continuation is separate.
export const officialResponsePolicy: Record<188 | 187 | 346 | 190, { policy: ResponsePolicy; caller: string }> = {
  188: { policy: 'MUST_ACK', caller: 'stores bool enable flag; false does not stop following187/190' },
  187: { policy: 'MUST_ACK', caller: 'waits in sendCmd; caller discards returned bool' },
  346: { policy: 'QUERY_RESPONSE_REQUIRED', caller: 'getMsgByCmd then isExecuteSuccess; word1 or error-1001' },
  190: { policy: 'MUST_ACK', caller: 'returns sendCmd bool; service may discard error' },
};

export type CafCandidate = {
  reportId: number; byteLength: number; prefixHigh: number; count: number;
  command: number; reply: number; module: number; words: number[]; capacityWords: number[];
  complete: boolean; warnings: string[];
};

// Candidate interpretation only: never add an embedded ID or silently pad RX.
// Raw events of every ID/size are preserved, including malformed/short packets.
export function parseCafCandidate(reportId: number, data: DataView): CafCandidate {
  if (data.byteLength < 9) throw new Error('Too short for CAF header9; raw bytes retained');
  const packed = data.getUint32(1, true), count = data.getUint16(1, true);
  const capacityWords = Array.from({ length: Math.floor((data.byteLength - 9) / 4) }, (_, i) => data.getInt32(9 + i * 4, true));
  const warnings: string[] = [];
  if (reportId !== 1) warnings.push('non-primary report ID; not accepted as query reply');
  if (data.getUint8(0) !== 0) warnings.push('unexpected prefix');
  if (count > 13) warnings.push('invalid count');
  if (count > capacityWords.length) warnings.push('truncated logical words');
  if ((data.byteLength - 9) % 4 !== 0) warnings.push('partial trailing word');
  return { reportId, byteLength: data.byteLength, prefixHigh: data.getUint8(0), count,
    command: (packed >>> 16) & 0x7fff, reply: packed >>> 31, module: data.getUint32(5, true),
    words: capacityWords.slice(0, count), capacityWords, complete: warnings.length === 0, warnings };
}

export type InputFrame = { timestamp: string; eventNumber: number; reportId: number; byteLength: number; rawHex: string; sameDevice: boolean; candidate: CafCandidate | null };

export class CafInputSession {
  readonly device: HIDDevice;
  eventCount = 0;
  active = true;
  querying = false;
  private observers = new Set<(frame: InputFrame) => void>();
  private log: Log;
  private receive: (event: HIDInputReportEvent) => void;

  constructor(device: HIDDevice, log: Log, onCount: (count: number) => void = () => {}) {
    guardProofDevice(device); this.device = device; this.log = log;
    this.receive = event => {
      const frame: InputFrame = { timestamp: new Date().toISOString(), eventNumber: ++this.eventCount,
        reportId: event.reportId, byteLength: event.data.byteLength,
        rawHex: hex(new Uint8Array(event.data.buffer, event.data.byteOffset, event.data.byteLength)),
        sameDevice: event.device === device, candidate: null };
      log(`RAW INPUT ${JSON.stringify(frame)}`);
      try { frame.candidate = parseCafCandidate(event.reportId, event.data); log(`CAF CANDIDATE ${JSON.stringify(frame.candidate)}`); }
      catch (error) { log(`CAF NOT PARSABLE ${String(error)}; raw preserved`); }
      onCount(this.eventCount);
      for (const observer of this.observers) observer(frame);
    };
    device.addEventListener('inputreport', this.receive);
    log('RAW LISTENER ACTIVE before open/send; every report ID/length retained; no automatic TX');
  }

  subscribe(observer: (frame: InputFrame) => void) {
    if (!this.active) throw new Error('Input session inactive');
    this.observers.add(observer); return () => { this.observers.delete(observer); };
  }

  dispose() {
    if (!this.active) return;
    this.active = false; this.device.removeEventListener('inputreport', this.receive);
    // Notify pending query without erasing any captured raw log.
    for (const observer of this.observers) observer({ timestamp: new Date().toISOString(), eventNumber: this.eventCount,
      reportId: -1, byteLength: 0, rawHex: '', sameDevice: true, candidate: null });
    this.observers.clear(); this.log(`RAW LISTENER INACTIVE totalEvents=${this.eventCount}`);
  }
}

export async function connectTransportInspection(device: HIDDevice, log: Log, onCount?: (count: number) => void) {
  const session = new CafInputSession(device, log, onCount);
  try {
    if (!device.opened) await device.open();
    log(`OPENED raw listener active; vendor=${device.vendorId} product=${device.productId}; no command sent`);
    return session;
  } catch (error) { session.dispose(); throw error; }
}

export async function querySampleRateOnly(session: CafInputSession, log: Log, timeoutMs = 2500) {
  if (!session.active || !session.device.opened) throw new Error('Reconnect/open with persistent raw listener first');
  if (session.querying) throw new Error('Query already pending');
  guardProofDevice(session.device);
  const packet = encodeCaf(346, [62, ...Array(12).fill(0)]), startCount = session.eventCount;
  session.querying = true;
  log(`QUERY346 ONLY policy=${officialResponsePolicy[346].policy}; no188/187/190/90/Flash; await input event, not GET_REPORT`);
  log(`TX reportId=1 bytes=61 command=346 count=13 module=0x${CTRL.toString(16)} words=${JSON.stringify([62, ...Array(12).fill(0)])}`);
  log(`TX data ${hex(packet.data)}`); log(`TX helper62 ${hex(packet.helper)}`);
  return new Promise<{ index: number; sampleHz: number | null; response: CafCandidate }>((resolve, reject) => {
    let done = false, sent = false, mismatch = false;
    let result: { index: number; sampleHz: number | null; response: CafCandidate } | null = null;
    let unsubscribe = () => {};
    const finish = (error?: Error) => {
      if (done) return; done = true; clearTimeout(timer); unsubscribe(); session.querying = false;
      if (error) { log(`${error.message}; rawTotal=${session.eventCount} newEvents=${session.eventCount - startCount}; no DSP acceptance/rejection conclusion`); reject(error); }
      else { log(`QUERY RESPONSE index=${result!.index} Hz=${result!.sampleHz ?? 'UNKNOWN'}; matching input event; no EQ sent`); resolve(result!); }
    };
    const timer = setTimeout(() => finish(new Error(`${mismatch ? 'MISMATCH' : 'TIMEOUT'} query346`)), timeoutMs);
    unsubscribe = session.subscribe(frame => {
      if (!session.active) { finish(new Error('CANCELLED input session detached')); return; }
      const c = frame.candidate;
      if (!frame.sameDevice || !c || c.reportId !== 1) return;
      if (!c.complete || c.command !== 346 || c.reply !== 1 || c.module !== CTRL || c.count < 2) {
        mismatch = true; log('UNMATCHED query candidate preserved; meaningful346 reply still required'); return;
      }
      const index = c.words[1];
      const rates: Record<number, number> = { 4: 44100, 5: 48000, 6: 96000, 7: 192000, 8: 384000 };
      if (!(index in rates)) log(`UNKNOWN query rate index=${index}; preserve matching transport response, no guessed fallback`);
      result = { index, sampleHz: rates[index] ?? null, response: c }; if (sent) finish();
    });
    // Matching observer and persistent raw listener both exist before send.
    try {
      void session.device.sendReport(1, packet.data).then(() => {
        if (done) return; sent = true; log('HOST SENT346; query result pending (not DSP success)'); if (result) finish();
      }, error => finish(new Error(`SEND ERROR ${String(error)}`)));
    } catch (error) { finish(new Error(`SEND ERROR ${String(error)}`)); }
  });
}
