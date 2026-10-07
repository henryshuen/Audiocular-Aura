/// <reference types="vite/client" />
import { afterEach, describe, expect, it, vi } from 'vitest';
import dump from './fixtures/officialAppUsbHelperDump.txt?raw';
import sourceText from './fixtures/officialResponseStaticEvidence.json?raw';
import derivedText from './fixtures/schemaRate346.json?raw';
import page from '../../freedsp-debug.html?raw';
import ui from '../../src/freedsp/debugPage.ts?raw';
import { parseHelperDump } from '../../scripts/freedsp/analyze-dump.mjs';
import { henryM2ADescriptor } from './fixtures/henryM2ADescriptor';
import { CTRL, encodeCaf, parseCaf } from '../../src/freedsp/officialRamProof.ts';
import { connectTransportInspection, officialResponsePolicy, parseCafCandidate, querySampleRateOnly } from '../../src/freedsp/cafTransportDiagnosis.ts';

const source = JSON.parse(sourceText.replace(/^\uFEFF/, ''));
const derived = JSON.parse(derivedText);
const queryBytes = () => Uint8Array.from(derived.shortData);
function fake() {
  const listeners = new Set<(event: HIDInputReportEvent) => void>(), order: string[] = [];
  const raw = { ...henryM2ADescriptor, opened: false,
    open: vi.fn(async () => { order.push('open'); raw.opened = true; }),
    addEventListener: vi.fn((_type: string, fn: (e: HIDInputReportEvent) => void) => { order.push('listen'); listeners.add(fn); }),
    removeEventListener: vi.fn((_type: string, fn: (e: HIDInputReportEvent) => void) => listeners.delete(fn)),
    sendReport: vi.fn(async (_id: number, _bytes: Uint8Array) => { order.push('send'); }),
  };
  const device = raw as unknown as HIDDevice;
  const emit = (id: number, bytes: Uint8Array, otherDevice = device) => {
    const storage = new Uint8Array(bytes.length + 8); storage.set(bytes, 4);
    const event = { device: otherDevice, reportId: id, data: new DataView(storage.buffer, 4, bytes.length) } as HIDInputReportEvent;
    listeners.forEach(fn => fn(event));
  };
  const logs: string[] = [], log = (line: string) => logs.push(line);
  return { device, raw, order, emit, listeners, logs, log };
}
afterEach(() => vi.useRealTimers());

describe('M2G persistent raw RX / query only; mock devices', () => {
  it('registers before open and captures an immediate input, with zero automatic TX', async () => {
    const f = fake(); f.raw.open.mockImplementationOnce(async () => { f.order.push('open'); f.raw.opened = true; f.emit(2, Uint8Array.of(128)); });
    const s = await connectTransportInspection(f.device, f.log);
    expect(f.order).toEqual(['listen', 'open']); expect(s.eventCount).toBe(1);
    expect(f.raw.sendReport).not.toHaveBeenCalled(); expect(f.logs.some(x => x.includes('"rawHex":"80"'))).toBe(true);
    s.dispose(); expect(f.listeners.size).toBe(0);
  });
  it('preserves every ID/length, unmatched command and malformed short input with timestamp/counter', async () => {
    const f = fake(), counts: number[] = [], s = await connectTransportInspection(f.device, f.log, n => counts.push(n));
    f.emit(2, Uint8Array.of(7)); f.emit(7, new Uint8Array(0));
    f.emit(1, encodeCaf(188, [], 1).data); f.emit(1, Uint8Array.of(0, 1, 2));
    expect(counts).toEqual([1, 2, 3, 4]); expect(s.eventCount).toBe(4);
    expect(f.logs.filter(x => x.startsWith('RAW INPUT'))).toHaveLength(4);
    const frames = f.logs.filter(x => x.startsWith('RAW INPUT')).map(x => JSON.parse(x.slice(10)));
    expect(frames.map(x => [x.reportId, x.byteLength])).toEqual([[2, 1], [7, 0], [1, 61], [1, 3]]);
    expect(frames.every(x => /^\d{4}-\d\d-\d\dT/.test(x.timestamp))).toBe(true);
    expect(f.logs.some(x => x.includes('"command":188'))).toBe(true); s.dispose();
  });
  it('parses real captured count0 and count4 buffers independently of query fixture', () => {
    const packets = parseHelperDump(dump).filter(p => p.direction === 'RX');
    for (const count of [0, 4]) {
      const p = packets.find(p => p.countU16 === count)!;
      const c = parseCafCandidate(1, new DataView(Uint8Array.from(p.bytes.slice(1)).buffer));
      expect(c).toMatchObject({ count, reply: 1, command: p.command, module: CTRL, complete: true });
      expect(c.words).toEqual(p.words.slice(0, count));
    }
  });
  it('parses labelled synthetic346 short response without assuming61 bytes or embedded ID', () => {
    expect(derived.category).toContain('NOT an official captured');
    const c = parseCafCandidate(1, new DataView(queryBytes().buffer));
    expect(c).toMatchObject({ command: 346, count: 4, words: derived.expectedWords, complete: true });
    expect(c.byteLength).toBe(25); expect(() => parseCaf(1, new DataView(queryBytes().buffer))).toThrow('length');
  });
  it('marks truncation, bad count/prefix, partial word and non-primary ID without hiding candidate', () => {
    const bytes = queryBytes();
    expect(parseCafCandidate(1, new DataView(bytes.buffer, 0, 17)).warnings).toContain('truncated logical words');
    expect(parseCafCandidate(2, new DataView(bytes.buffer)).complete).toBe(false);
    bytes[0] = 1; bytes[1] = 255;
    const c = parseCafCandidate(1, new DataView(bytes.buffer, 0, 24));
    expect(c.warnings).toEqual(expect.arrayContaining(['unexpected prefix', 'invalid count', 'partial trailing word']));
    expect(() => parseCafCandidate(1, new DataView(new ArrayBuffer(8)))).toThrow('Too short');
  });
  it('subscribes before send, accepts immediate meaningful346, sends exactly one query', async () => {
    const f = fake(), s = await connectTransportInspection(f.device, f.log);
    f.raw.sendReport.mockImplementationOnce(async () => { f.order.push('send'); f.emit(1, queryBytes()); });
    const result = await querySampleRateOnly(s, f.log);
    expect(result).toMatchObject({ index: 5, sampleHz: 48000 }); expect(f.order).toEqual(['listen', 'open', 'send']);
    expect(f.raw.sendReport).toHaveBeenCalledTimes(1);
    const [id, bytes] = f.raw.sendReport.mock.calls[0];
    expect(parseCaf(id, new DataView(bytes.buffer))).toMatchObject({ command: 346, count: 13, words: [62, ...Array(12).fill(0)] });
    expect(s.active).toBe(true); expect(f.listeners.size).toBe(1); s.dispose();
  });
  it('keeps passive listener after query timeout and logs delayed input', async () => {
    vi.useFakeTimers(); const f = fake(), s = await connectTransportInspection(f.device, f.log);
    const failure = expect(querySampleRateOnly(s, f.log, 25)).rejects.toThrow('TIMEOUT');
    await vi.advanceTimersByTimeAsync(25); await failure;
    expect(s.active).toBe(true); expect(s.querying).toBe(false); expect(f.listeners.size).toBe(1);
    f.emit(1, queryBytes()); expect(s.eventCount).toBe(1);
    expect(f.logs.some(x => x.startsWith('QUERY RESPONSE'))).toBe(false); s.dispose();
  });
  it.each(['command', 'reply', 'module', 'count0', 'short'] as const)('preserves %s but refuses query success', async field => {
    vi.useFakeTimers(); const f = fake(), s = await connectTransportInspection(f.device, f.log);
    const bytes = field === 'short' ? Uint8Array.of(0, 1) : encodeCaf(field === 'command' ? 188 : 346,
      [62, 5], field === 'reply' ? 0 : 1, field === 'count0' ? 0 : 2, field === 'module' ? 0 : CTRL).data;
    const failure = expect(querySampleRateOnly(s, f.log, 25)).rejects.toThrow(field === 'short' ? 'TIMEOUT' : 'MISMATCH');
    f.emit(1, bytes); await vi.advanceTimersByTimeAsync(25); await failure;
    expect(s.eventCount).toBe(1); expect(f.logs.some(x => x.startsWith('RAW INPUT'))).toBe(true); s.dispose();
  });
  it('distinguishes unknown rate semantics from a valid matching transport response', async () => {
    const f = fake(), s = await connectTransportInspection(f.device, f.log);
    f.raw.sendReport.mockImplementationOnce(async () => f.emit(1, encodeCaf(346, [62, 9], 1).data));
    expect(await querySampleRateOnly(s, f.log)).toMatchObject({ index: 9, sampleHz: null });
    expect(f.logs.some(x => x.includes('UNKNOWN query rate'))).toBe(true); s.dispose();
  });
  it('records report2 and a different-device candidate, accepts neither as346 response', async () => {
    vi.useFakeTimers(); const f = fake(), s = await connectTransportInspection(f.device, f.log);
    const failure = expect(querySampleRateOnly(s, f.log, 25)).rejects.toThrow('TIMEOUT');
    f.emit(2, queryBytes()); f.emit(1, queryBytes(), {} as HIDDevice);
    await vi.advanceTimersByTimeAsync(25); await failure; expect(s.eventCount).toBe(2); s.dispose();
  });
  it('cleans pending query on detach and prevents query without active/open listener', async () => {
    const f = fake(), s = await connectTransportInspection(f.device, f.log);
    const failure = expect(querySampleRateOnly(s, f.log)).rejects.toThrow('CANCELLED'); s.dispose(); await failure;
    expect(f.listeners.size).toBe(0); await expect(querySampleRateOnly(s, f.log)).rejects.toThrow('Reconnect');
  });
  it('prevents concurrent queries and supports explicit later query without re-registering listener', async () => {
    const f = fake(), s = await connectTransportInspection(f.device, f.log);
    const first = querySampleRateOnly(s, f.log);
    await expect(querySampleRateOnly(s, f.log)).rejects.toThrow('already pending'); f.emit(1, queryBytes()); await first;
    f.raw.sendReport.mockImplementationOnce(async () => f.emit(1, queryBytes())); await querySampleRateOnly(s, f.log);
    expect(f.raw.addEventListener).toHaveBeenCalledTimes(1); expect(f.raw.sendReport).toHaveBeenCalledTimes(2); s.dispose();
  });
  it('cleans failed open; descriptor mismatch never opens or sends', async () => {
    const f = fake(); f.raw.open.mockRejectedValueOnce(new Error('open denied'));
    await expect(connectTransportInspection(f.device, f.log)).rejects.toThrow('open denied'); expect(f.listeners.size).toBe(0);
    f.raw.vendorId = 0; await expect(connectTransportInspection(f.device, f.log)).rejects.toThrow('Only FreeDSP');
    expect(f.raw.open).toHaveBeenCalledTimes(1); expect(f.raw.sendReport).not.toHaveBeenCalled();
  });
  it('requires response only for query; passive connection has no ACK timer; no source-supported SEND_SUCCESS_ONLY', async () => {
    vi.useFakeTimers(); const f = fake(), s = await connectTransportInspection(f.device, f.log);
    await vi.advanceTimersByTimeAsync(10000); expect(f.logs.some(x => x.includes('TIMEOUT'))).toBe(false);
    expect(officialResponsePolicy[346].policy).toBe('QUERY_RESPONSE_REQUIRED');
    for (const command of [188, 187, 190] as const) expect(officialResponsePolicy[command].policy).toBe('MUST_ACK');
    expect(Object.values(officialResponsePolicy).some(x => x.policy === 'SEND_SUCCESS_ONLY')).toBe(false); s.dispose();
  });
  it('anchors fresh RX allocation, GET_REPORT arguments and ignored return to complete source', () => {
    const method = (name: string) => source.methods.find((m: { name: string }) => m.name === name);
    expect(method('sendCmd').instructions).toContainEqual({ offset: 52, op: 'new-array', args: 'v12, v13, [B' });
    expect(method('getMsgByCmd').instructions).toContainEqual({ offset: 66, op: 'new-array', args: 'v12, v13, [B' });
    expect(method('sendCmd').instructions).toContainEqual({ offset: 110, op: 'const/16', args: 'v10, 257' });
    expect(method('sendCmd').instructions).toContainEqual({ offset: 116, op: 'const/16', args: 'v8, 161' });
    expect(method('getCurSampleRate').instructions).toContainEqual({ offset: 80, op: 'const/16', args: 'v0, 14' });
    expect(method('receiveHIDReport').instructions).toContainEqual({ offset: 32, op: 'return-object', args: 'v5' });
    expect(method('from2ByteToInt').instructions).toContainEqual({ offset: 16, op: 'and-int/lit16', args: 'v1, v1, 255' });
    expect(source.usbHelperDumpTagPresent).toBe(false);
  });
  it('exposes onlyquery346 and inspection; no RAM/90/Flash buttons or handlers', () => {
    expect(page).toContain('id="query-rate"');
    for (const id of ['attenuation', 'flat', 'custom-mode']) expect(page).not.toContain(`id="${id}"`);
    expect(ui).not.toContain('runRamProof'); expect(ui).not.toContain('selectCustomMode');
    expect(ui).toContain('querySampleRateOnly');
  });
});
