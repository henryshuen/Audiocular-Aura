// Research model derived from the pinned official DEX. Never imported by runtime.
// Produces helper/control-transfer buffers, not a hardware sender.
export function cafId(name) {
  if (name.length !== 4) throw new Error('CAF name requires four characters');
  return [...name].reduce((value, char, i) => value | ((char.charCodeAt(0) - 32) << (8 + 6 * i)), 0) >>> 0;
}

export function encodeOfficialBuffer({ prefix = 1, command, reply = 0, module = cafId('CTRL'), words, count = words.length }) {
  if (!Number.isInteger(command) || command < 0 || command > 0x7fff || ![0, 1].includes(reply)) throw new Error('Invalid command/reply');
  if (!Number.isInteger(count) || count < 0 || count > 255 || !Number.isInteger(prefix) || prefix < 0 || prefix > 0xffff) throw new Error('Invalid count/prefix');
  if (!words.every(word => Number.isSafeInteger(word))) throw new Error('Invalid research word');
  // RX helper capacity can exceed logical count; preserve all observed words.
  const buffer = new Uint8Array(10 + 4 * words.length);
  const view = new DataView(buffer.buffer);
  view.setUint16(0, prefix, true);
  view.setUint32(2, (count & 255) | (command << 16) | (reply << 31), true);
  view.setUint32(6, module, true);
  words.forEach((word, i) => view.setUint32(10 + 4 * i, word >>> 0, true));
  return buffer;
}

export function asWebHidData(buffer, expectedDataBytes = 61) {
  if (buffer[0] !== 1 || buffer.length !== expectedDataBytes + 1) throw new Error('Descriptor/report ID mismatch');
  return { reportId: 1, data: buffer.slice(1) };
}
