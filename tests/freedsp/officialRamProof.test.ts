/// <reference types="vite/client" />
import { afterEach, describe, expect, it, vi } from 'vitest';
import dump from './fixtures/officialAppUsbHelperDump.txt?raw';
import page from '../../freedsp-debug.html?raw';
import pageSource from '../../src/freedsp/debugPage.ts?raw';
import { parseHelperDump } from '../../scripts/freedsp/analyze-dump.mjs';
import { henryM2ADescriptor } from './fixtures/henryM2ADescriptor';
import { CTRL, encodeCaf, exchangeCaf, parseCaf, proofCoefficients, runRamProof, selectCustomMode } from '../../src/freedsp/officialRamProof.ts';
import type { ProofCommand } from '../../src/freedsp/officialRamProof.ts';

function fakeDevice(respond = true, rateIndex = 5) {
  const listeners = new Set<(e: HIDInputReportEvent) => void>();
  const emit = (command: number, words: number[] = [], count = words.length, reply = 1, module = CTRL, reportId = 1) => {
    const p = encodeCaf(command, words, reply, count, module);
    const event = { reportId, data: new DataView(p.data.buffer) } as HIDInputReportEvent;
    listeners.forEach(fn => fn(event));
  };
  const device = {
    ...henryM2ADescriptor, opened: false,
    open: vi.fn(async () => { device.opened = true; }),
    addEventListener: vi.fn((_type: string, fn: (e: HIDInputReportEvent) => void) => listeners.add(fn)),
    removeEventListener: vi.fn((_type: string, fn: (e: HIDInputReportEvent) => void) => listeners.delete(fn)),
    sendReport: vi.fn(async (_id: number, data: Uint8Array) => {
      const tx = parseCaf(1, new DataView(data.buffer, data.byteOffset, data.byteLength));
      if (respond) emit(tx.command, tx.command === 346 ? [62, rateIndex] : []);
    }),
  };
  return { device: device as unknown as HIDDevice, raw: device, listeners, emit };
}
const payload = () => proofCoefficients(48000, false).payload;
afterEach(() => vi.useRealTimers());

describe('M2F controlled RAM proof; mock transport only', () => {
  it('replays every114 independent official helper buffer byte without truncation', () => {
    const packets = parseHelperDump(dump); expect(packets).toHaveLength(114);
    for (const p of packets) {
      const encoded = encodeCaf(p.command, p.words, p.responseBit ? 1 : 0, p.countU16, p.moduleU32);
      expect([...encoded.helper]).toEqual(p.bytes);
      expect(encoded.reportId).toBe(1); expect(encoded.data).toHaveLength(61);
      const parsed = parseCaf(1, new DataView(encoded.data.buffer));
      expect(parsed.command).toBe(p.command); expect(parsed.count).toBe(p.countU16);
      expect(parsed.capacityWords).toEqual(p.words);
    }
  });
  it('round-trips190 all13 words, selector0/wire5/CTRL, preserving last word', () => {
    const words = [0, 5, 3, 1, -2, 3, -4, 5, 6, 7, 8, 9, 123456];
    const p = encodeCaf(190, words), parsed = parseCaf(1, new DataView(p.data.buffer));
    expect(parsed).toMatchObject({ command: 190, count: 13, module: CTRL, words });
    expect([...p.helper]).toEqual([1, ...p.data]); expect(p.data[0]).toBe(0);
    expect(() => encodeCaf(190, [...words, 14])).toThrow();
  });
  it('keeps187 logical count1 while clearly separating fixed transport padding', () => {
    const p = encodeCaf(187, [0]); expect(p.logicalHelperBytes).toBe(14);
    expect(p.data).toHaveLength(61); expect(p.helper).toHaveLength(62);
    expect(parseCaf(1, new DataView(p.data.buffer)).count).toBe(1);
    expect([...p.data.slice(13)]).toEqual(Array(48).fill(0));
  });
  it('accepts matching count0 write ACK and removes listener', async () => {
    const f = fakeDevice(), logs: string[] = [];
    const result = await exchangeCaf(f.device, 190, payload(), x => logs.push(x));
    expect(result).toMatchObject({ command: 190, reply: 1, count: 0, module: CTRL });
    expect(f.listeners.size).toBe(0); expect(f.raw.sendReport).toHaveBeenCalledTimes(1);
    expect(logs.some(s => s.startsWith('TX helper62'))).toBe(true);
    expect(logs.some(s => s.startsWith('RX parsed'))).toBe(true);
  });
  it.each(['command', 'reply', 'module'] as const)('rejects mismatched %s, never treating it as ACK', async field => {
    vi.useFakeTimers(); const f = fakeDevice(false);
    const result = exchangeCaf(f.device, 190, payload(), () => {}, 25);
    const failure = expect(result).rejects.toThrow('MISMATCH');
    await vi.advanceTimersByTimeAsync(0);
    f.emit(field === 'command' ? 188 : 190, [], 0, field === 'reply' ? 0 : 1, field === 'module' ? 0 : CTRL);
    await vi.advanceTimersByTimeAsync(25); await failure; expect(f.listeners.size).toBe(0);
  });
  it('times out a resolved host send with no reply; ignores secondary report2', async () => {
    vi.useFakeTimers(); const f = fakeDevice(false);
    const failure = expect(exchangeCaf(f.device, 190, payload(), () => {}, 25)).rejects.toThrow('TIMEOUT');
    await vi.advanceTimersByTimeAsync(0); f.emit(190, [], 0, 1, CTRL, 2);
    await vi.advanceTimersByTimeAsync(25); await failure; expect(f.listeners.size).toBe(0);
  });
  it('logs send failure and cleans listener without feature fallback', async () => {
    const f = fakeDevice(); f.raw.sendReport.mockRejectedValueOnce(new Error('transport denied'));
    await expect(exchangeCaf(f.device, 190, payload(), () => {})).rejects.toThrow('SEND ERROR');
    expect(f.listeners.size).toBe(0); expect(f.raw.sendReport).toHaveBeenCalledTimes(1);
  });
  it('times out even when host send remains pending and an early reply arrives', async () => {
    vi.useFakeTimers(); const f = fakeDevice(false);
    f.raw.sendReport.mockImplementationOnce(() => new Promise(() => {}));
    const failure = expect(exchangeCaf(f.device, 190, payload(), () => {}, 25)).rejects.toThrow('TIMEOUT');
    await vi.advanceTimersByTimeAsync(0); f.emit(190);
    await vi.advanceTimersByTimeAsync(25); await failure; expect(f.listeners.size).toBe(0);
  });
  it('rejects malformed responses including negative count, length and prefix', () => {
    const p = encodeCaf(190, [], 1), view = new DataView(p.data.buffer);
    expect(() => parseCaf(1, new DataView(new ArrayBuffer(60)))).toThrow('MISMATCH');
    view.setUint16(1, 65535, true); expect(() => parseCaf(1, view)).toThrow('count');
    view.setUint16(1, 0, true); view.setUint8(0, 1); expect(() => parseCaf(1, view)).toThrow('prefix');
  });
  it('honors DataView byte offsets instead of parsing its underlying buffer start', () => {
    const p = encodeCaf(190, payload(), 1), buffer = new Uint8Array(70);
    buffer.set(p.data, 4);
    expect(parseCaf(1, new DataView(buffer.buffer, 4, 61)).words).toEqual(payload());
  });
  it.each(['VID', 'PID', 'output', 'input'] as const)('blocks %s mismatch before open/send', async field => {
    const f = fakeDevice();
    if (field === 'VID') f.raw.vendorId = 0;
    else if (field === 'PID') f.raw.productId = 0;
    else f.raw.collections = [{ [field + 'Reports']: [{ reportId: 1, items: [{ reportSize: 8, reportCount: 62 }] }] }];
    await expect(runRamProof(f.device, false, () => {})).rejects.toThrow();
    expect(f.raw.open).not.toHaveBeenCalled(); expect(f.raw.sendReport).not.toHaveBeenCalled();
  });
  it('runs exactly188/187/346/190 for test and restore, one current rate, no90/noFlash', async () => {
    const f = fakeDevice();
    await runRamProof(f.device, false, () => {}); await runRamProof(f.device, true, () => {});
    const packets = f.raw.sendReport.mock.calls.map(([id, bytes]) => parseCaf(id, new DataView(bytes.buffer)));
    expect(packets.map(p => p.command)).toEqual([188, 187, 346, 190, 188, 187, 346, 190]);
    expect(packets[3].words).toEqual(payload());
    expect(packets[7].words).toEqual([0, 5, 3, 4194304, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });
  it('stops before190 for unknown current rate, without guessed fallback', async () => {
    const f = fakeDevice(true, 9);
    await expect(runRamProof(f.device, false, () => {})).rejects.toThrow('Unknown rate');
    expect(f.raw.sendReport).toHaveBeenCalledTimes(3);
  });
  it('stops after missing187 ACK without writing190', async () => {
    vi.useFakeTimers(); const f = fakeDevice();
    f.raw.sendReport.mockImplementation(async (_id, data) => {
      const p = parseCaf(1, new DataView(data.buffer)); if (p.command === 188) f.emit(188);
    });
    const failure = expect(runRamProof(f.device, false, () => {})).rejects.toThrow('TIMEOUT command=187');
    await vi.advanceTimersByTimeAsync(2500); await failure;
    expect(f.raw.sendReport).toHaveBeenCalledTimes(2); expect(f.listeners.size).toBe(0);
  });
  it('refuses Flash even if type checks are bypassed and isolates manual90', async () => {
    const f = fakeDevice();
    await expect(exchangeCaf(f.device, 220 as ProofCommand, Array(13).fill(0), () => {})).rejects.toThrow('no Flash');
    expect(f.raw.open).not.toHaveBeenCalled(); expect(f.raw.sendReport).not.toHaveBeenCalled();
    await selectCustomMode(f.device, () => {});
    expect(parseCaf(1, new DataView(f.raw.sendReport.mock.calls[0][1].buffer)).words).toEqual([90, ...Array(12).fill(0)]);
    expect(page).not.toContain('id="framing"'); expect(page).not.toContain('id="sample-rate"');
    expect(pageSource).not.toContain('ramProbe'); expect(pageSource).not.toContain('dsp.ts');
  });
  it('keeps quantized test stable and attenuation-only across all five supported rates', () => {
    for (const fs of [44100, 48000, 96000, 192000, 384000]) {
      const c = proofCoefficients(fs, false), [b0, b1, b2, feedback1, feedback2] = c.words.map(w => w / c.scale);
      const response = (w: number) => {
        const num = Math.hypot(b0 + b1 * Math.cos(w) + b2 * Math.cos(2*w), -b1 * Math.sin(w) - b2 * Math.sin(2*w));
        const den = Math.hypot(1 - feedback1 * Math.cos(w) - feedback2 * Math.cos(2*w), feedback1 * Math.sin(w) + feedback2 * Math.sin(2*w));
        return num / den;
      };
      expect(c.gainRaw).toBe(-3072); expect(c.qRaw).toBe(179);
      expect(c.scale).toBe(2 ** (25 - c.gain));
      expect(20 * Math.log10(response(2 * Math.PI * 1000 / fs))).toBeCloseTo(-12, 1);
      for (let i = 0; i <= 1024; i++) expect(response(Math.PI * i / 1024)).toBeLessThanOrEqual(1.002);
    }
  });
});
