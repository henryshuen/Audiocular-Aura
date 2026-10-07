// Transport-neutral CAF codec. Report ID is always separate from WebHID data.
export const CTRL = 0xb32d2300;
export type Log = (line: string) => void;
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
