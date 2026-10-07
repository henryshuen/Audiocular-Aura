// M2B OFFLINE hypotheses only. No HID adapter and no runtime imports of this file.
// Neither layout is supported by a known-good native structure or USB capture.
export type Offline61Layout = "COUNT_U8" | "TRANSACTION_U8";

function requireInteger(value: number, min: number, max: number, field: string): void {
	if (!Number.isInteger(value) || value < min || value > max) {
		throw new RangeError(`${field} is outside the hypothesis field width.`);
	}
}

export function buildOffline61ByteHypothesis(
	layout: Offline61Layout, commandId: number, words: readonly number[], transactionId = 1,
): { reportId: 1; data: Uint8Array } {
	if (layout !== "COUNT_U8" && layout !== "TRANSACTION_U8") throw new Error("Unknown offline layout.");
	if (words.length !== 13) throw new RangeError("Exactly 13 words required; no padding or truncation.");
	requireInteger(commandId, 0, 0xfff, "commandId");
	requireInteger(transactionId, 0, layout === "TRANSACTION_U8" ? 0xff : 0xffff, "transactionId");
	words.forEach((word) => requireInteger(word, -0x80000000, 0x7fffffff, "word"));
	// Both hypotheses remove the presumed embedded ID, then reduce one header byte.
	const data = new Uint8Array(9 + 13 * 4);
	const view = new DataView(data.buffer);
	if (layout === "COUNT_U8") {
		view.setUint16(0, transactionId, true);
		view.setUint8(2, words.length);
		view.setUint16(3, commandId, true);
	} else {
		view.setUint8(0, transactionId);
		view.setUint32(1, words.length | (commandId << 16), true);
	}
	view.setUint32(5, 0xb32d2300, true);
	words.forEach((word, index) => view.setInt32(9 + index * 4, word, true));
	// External WebHID argument modeled separately; never prepended to data.
	return { reportId: 1, data };
}
