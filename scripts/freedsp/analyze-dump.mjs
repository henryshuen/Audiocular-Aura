// Offline helper-buffer forensics only. No device APIs or serialization claims.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function parseHelperDump(text) {
  const packets = [];
  let coefficient = null;
  for (const [index, line] of text.replace(/\r\n/g, '\n').split('\n').entries()) {
    const coeff = line.match(/band:(\d+) & param\.gain:([\d.-]+) & pEQCoeff\.Gain:(\d+) & B0:([a-f\d]+) & B1:([a-f\d]+) & B2:([a-f\d]+) & A0:([a-f\d]+) & A1:([a-f\d]+)/i);
    if (coeff) coefficient = { band: Number(coeff[1]), gainDb: Number(coeff[2]), gainMarker: Number(coeff[3]), words: coeff.slice(4).map(value => parseInt(value, 16) | 0) };
    const match = line.match(/UsbHelperDump.*?: (TX|RX) \[([^\]]+)\]/);
    if (!match) continue;
    const signed = match[2].split(',').map(value => Number(value.trim()));
    if (!signed.every(value => Number.isInteger(value) && value >= -128 && value <= 127)) throw new Error(`Invalid signed byte at line ${index + 1}`);
    if (signed.length !== 62) throw new Error(`Expected observed 62-entry helper buffer at line ${index + 1}`);
    const bytes = signed.map(value => value & 255);
    const view = new DataView(Uint8Array.from(bytes).buffer);
    const commandRaw = view.getUint16(4, true);
    packets.push({ line: index + 1, direction: match[1], bytes, prefixU8: bytes[0], prefixU16: view.getUint16(0, true), prefixU32: view.getUint32(0, true), countU16: view.getUint16(2, true), commandRaw, command: commandRaw & 0x7fff, responseBit: Boolean(commandRaw & 0x8000), moduleU32: view.getUint32(6, true), words: Array.from({ length: 13 }, (_, i) => view.getInt32(10 + i * 4, true)), coefficient: match[1] === 'TX' && (commandRaw & 0x7fff) === 220 && coefficient ? coefficient : null });
    if (match[1] === 'TX') coefficient = null;
  }
  if (packets.length === 0 || packets.length % 2) throw new Error('Missing or unpaired helper packets');
  for (let i = 0; i < packets.length; i += 2) {
    if (packets[i].direction !== 'TX' || packets[i + 1].direction !== 'RX' || packets[i].command !== packets[i + 1].command) throw new Error(`Invalid TX/RX pairing at pair ${i / 2 + 1}`);
  }
  return packets;
}

function unique(values) { return [...new Set(values)].sort((a, b) => a - b); }
function offsetStats(packets) {
  return Array.from({ length: 62 }, (_, offset) => {
    const counts = new Map();
    for (const packet of packets) counts.set(packet.bytes[offset], (counts.get(packet.bytes[offset]) ?? 0) + 1);
    const entropy = [...counts.values()].reduce((sum, count) => { const p = count / packets.length; return sum - p * Math.log2(p); }, 0);
    return { offset, unique: [...counts.keys()].sort((a, b) => a - b), entropyBits: Number(entropy.toFixed(6)) };
  });
}
function family(packet) {
  if (packet.command === 90) return 'mode';
  if (packet.command === 259) return 'firmware-query';
  if (packet.command === 220 && packet.words[0] === 255) return 'flash-commit';
  if (packet.command === 220 && packet.words[0] === 0) return 'flash-metadata';
  if (packet.command === 220 && packet.words[0] >= 4 && packet.words[0] <= 8) return 'flash-coefficients';
  return 'unclassified';
}
export function analyzeHelperDump(text) {
  const packets = parseHelperDump(text);
  const pairs = Array.from({ length: packets.length / 2 }, (_, index) => {
    const tx = packets[index * 2], rx = packets[index * 2 + 1];
    const differingOffsets = tx.bytes.flatMap((byte, offset) => byte !== rx.bytes[offset] ? [offset] : []);
    return { pair: index + 1, txLine: tx.line, rxLine: rx.line, command: tx.command, family: family(tx), txCount: tx.countU16, rxCount: rx.countU16, differingOffsets, txWords: tx.words, rxWords: rx.words, coefficientLogMatches: tx.coefficient ? tx.words[1] === tx.coefficient.band && tx.words[2] === tx.coefficient.gainMarker && tx.words.slice(3, 8).every((word, i) => word === tx.coefficient.words[i]) : null, coefficientLog: tx.coefficient };
  });
  const commands = unique(packets.map(p => p.command)).map(command => {
    const group = packets.filter(p => p.command === command);
    return { command, pairCount: group.length / 2, tx: summarize(group.filter(p => p.direction === 'TX')), rx: summarize(group.filter(p => p.direction === 'RX')) };
  });
  function summarize(group) {
    return { lengths: unique(group.map(p => p.bytes.length)), prefixU8: unique(group.map(p => p.prefixU8)), prefixU16: unique(group.map(p => p.prefixU16)), prefixU32: unique(group.map(p => p.prefixU32)), counts: unique(group.map(p => p.countU16)), commandRaw: unique(group.map(p => p.commandRaw)), modules: unique(group.map(p => p.moduleU32)), lastNonzeroOffsets: unique(group.map(p => p.bytes.findLastIndex(byte => byte !== 0))), offsetStats: offsetStats(group) };
  }
  const tx = packets.filter(p => p.direction === 'TX');
  const familyNames = [...new Set(pairs.map(p => p.family))];
  return { category: 'Official-app helper buffers; not independently captured USB transfers', packetCount: packets.length, pairCount: pairs.length, commands, families: familyNames.map(name => ({ family: name, count: pairs.filter(p => p.family === name).length, txWordValues: Array.from({ length: 13 }, (_, i) => unique(tx.filter(p => family(p) === name).map(p => p.words[i]))) })), structuralChecks: { constantFirstByte1: packets.every(p => p.bytes[0] === 1), constantSecondByte0: packets.every(p => p.bytes[1] === 0), constantCountHighByte0: packets.every(p => p.bytes[3] === 0), constantModuleB32D2300: packets.every(p => p.moduleU32 === 0xb32d2300), responseCommandEqualsTxOr8000: pairs.every(p => packets[(p.pair - 1) * 2 + 1].commandRaw === (p.command | 0x8000)), allTxCount13: tx.every(p => p.countU16 === 13), allTxTailWords8to12Zero: tx.every(p => p.words.slice(8).every(word => word === 0)), allCoefficientLogsMatch: pairs.filter(p => p.coefficientLogMatches !== null).every(p => p.coefficientLogMatches), coefficientLogCount: pairs.filter(p => p.coefficientLogMatches !== null).length, txNegativeWords: tx.flatMap(p => p.words).filter(word => word < 0).length }, pairs };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const source = process.argv[2] ?? new URL('../../tests/freedsp/fixtures/officialAppUsbHelperDump.txt', import.meta.url);
  process.stdout.write(`${JSON.stringify(analyzeHelperDump(readFileSync(source, 'utf8')), null, 2)}\n`);
}
