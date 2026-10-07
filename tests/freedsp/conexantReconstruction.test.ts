import { describe, expect, it } from "vitest";
import { buildConexantPacket } from "../../src/freedsp/conexantPacket.ts";
import { buildConexantPacketCandidateNoEmbeddedReportId } from "../../src/freedsp/conexantCandidate.ts";
import { buildOffline61ByteHypothesis, type Offline61Layout } from "../../src/freedsp/conexantReconstruction.ts";
import { inspectFreeDSPDescriptor, requireMatchingReport } from "../../src/freedsp/descriptor.ts";
import { henryM2ADescriptor, henrySecondaryInputSummary } from "./fixtures/henryM2ADescriptor.ts";

// Deliberately nonzero final bytes expose truncation hidden by runtime zero tail words.
const words = [5, 1, 3, 0x12345678, -4194304, -1, 0, 0x7fffffff, -0x80000000, 9, 10, 11, 0x12345678];

describe("M2B descriptor and size contradiction", () => {
	it("records Henry's primary 488-bit input/output as 61 data bytes excluding ID", () => {
		expect([henryM2ADescriptor.vendorId, henryM2ADescriptor.productId]).toEqual([0x35d8, 0x1496]);
		expect(inspectFreeDSPDescriptor(henryM2ADescriptor).reports.map(({ kind, reportId, bits, bytes }) =>
			[kind, reportId, bits, bytes])).toEqual([["input", 1, 488, 61], ["output", 1, 488, 61]]);
		expect(henrySecondaryInputSummary).toEqual({ reportId: 2, totalBytes: 1 });
	});
	it("shows current 63-byte semantics losing offsets 61 and 62 in a 61-byte buffer", () => {
		expect(11 + words.length * 4).toBe(63);
		const current = buildConexantPacket(190, words);
		expect(current.length).toBe(61);
		expect(Array.from(current.slice(59))).toEqual([0x78, 0x56]);
		expect([current[61], current[62]]).toEqual([undefined, undefined]);
	});
	it("shows the intact old 62-byte candidate still fails Henry's descriptor gate", () => {
		const old = buildConexantPacketCandidateNoEmbeddedReportId(190, words);
		expect(10 + words.length * 4).toBe(62);
		expect(old.length).toBe(62);
		expect(Array.from(old.slice(58))).toEqual([0x78, 0x56, 0x34, 0x12]);
		expect(() => requireMatchingReport(henryM2ADescriptor, "output", old.length)).toThrow("Blocked");
	});
});

describe.each<Offline61Layout>(["COUNT_U8", "TRANSACTION_U8"])("offline hypothesis %s", (layout) => {
	it("preserves all 13 signed words, including the final four bytes, within exactly 61", () => {
		const { data, reportId } = buildOffline61ByteHypothesis(layout, 190, words);
		expect(reportId).toBe(1);
		expect(data.length).toBe(9 + 52);
		expect(() => requireMatchingReport(henryM2ADescriptor, "output", data.length)).not.toThrow();
		const view = new DataView(data.buffer);
		words.forEach((word, index) => expect(view.getInt32(9 + 4 * index, true)).toBe(word));
		expect(Array.from(data.slice(57))).toEqual([0x78, 0x56, 0x34, 0x12]);
	});
	it("keeps external reportId separate and records the explicit hypothesis header", () => {
		const envelope = buildOffline61ByteHypothesis(layout, 190, words, 0x7a);
		expect(envelope.reportId).toBe(1);
		expect(Array.from(envelope.data.slice(0, 9))).toEqual(layout === "COUNT_U8"
			? [0x7a, 0, 13, 190, 0, 0, 35, 45, 179]
			: [0x7a, 13, 0, 190, 0, 0, 35, 45, 179]);
	});
	it("rejects incomplete/extra payload and out-of-width values instead of coercing", () => {
		for (const count of [12, 14]) expect(() => buildOffline61ByteHypothesis(layout, 190, Array(count).fill(0))).toThrow("Exactly 13");
		for (const command of [-1, 0x1000, 1.5]) expect(() => buildOffline61ByteHypothesis(layout, command, words)).toThrow("commandId");
		const oversized = [...words]; oversized[12] = 0x80000000;
		expect(() => buildOffline61ByteHypothesis(layout, 190, oversized)).toThrow("word");
		expect(() => buildOffline61ByteHypothesis(layout, 190, words, layout === "COUNT_U8" ? 0x10000 : 0x100)).toThrow("transactionId");
	});
});
