// Experimental ONLY: remove the presumed embedded Report ID; preserve all words.
// 2-byte transaction + 4-byte count/command + 4-byte module + N * 4 bytes.
export function buildConexantPacketCandidateNoEmbeddedReportId(commandId: number, data: number[]): Uint8Array {
	const packet = new Uint8Array(10 + data.length * 4);
	const view = new DataView(packet.buffer);
	view.setUint16(0, 1, true);
	view.setUint32(2, (data.length & 0xff) | ((commandId & 0xfff) << 16), true);
	view.setUint32(6, 0xb32d2300, true);
	data.forEach((word, index) => view.setInt32(10 + index * 4, word, true));
	return packet;
}
