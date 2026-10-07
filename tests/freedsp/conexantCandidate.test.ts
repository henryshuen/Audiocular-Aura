import { describe, expect, it, vi } from "vitest";
import { buildConexantPacket } from "../../src/freedsp/conexantPacket.ts";
import { buildConexantPacketCandidateNoEmbeddedReportId as candidate } from "../../src/freedsp/conexantCandidate.ts";
import { sendConexantReport } from "../../src/freedsp/conexantTransport.ts";

const words = [5, 1, 3, 0x12345678, -4194304, -1, 0, 0, 0, 0, 0, 0, 0x12345678];
const fixture = new Uint8Array([
	1, 0, 13, 0, 190, 0, 0, 35, 45, 179,
	5, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0,
	120, 86, 52, 18, 0, 0, 192, 255, 255, 255, 255, 255,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	120, 86, 52, 18,
]);

describe("one experimental no-embedded-ID framing", () => {
	it("derives length from the fields and preserves the entire fixed RAM fixture", () => {
		expect(fixture.length).toBe(62);
		expect(candidate(190, words)).toEqual(fixture);
		expect(candidate(190, []).length).toBe(10);
		expect(candidate(190, [0]).length).toBe(14);
	});
	it("keeps transaction/count/command fields at the candidate offsets", () => {
		expect(Array.from(candidate(190, words).slice(0, 6))).toEqual([1, 0, 13, 0, 190, 0]);
		expect(Array.from(candidate(0x1abc, [0]).slice(2, 6))).toEqual([1, 0, 188, 10]);
	});
	it("encodes CTRL at 6..9 and words at 10+4i including the final word", () => {
		const packet = candidate(190, words);
		expect(Array.from(packet.slice(6, 10))).toEqual([0, 35, 45, 179]);
		const view = new DataView(packet.buffer);
		words.forEach((word, index) => expect(view.getInt32(10 + index * 4, true)).toBe(word));
		expect(Array.from(packet.slice(58, 62))).toEqual([120, 86, 52, 18]);
	});
	it("preserves every overlapping current byte after excluding the embedded byte", () => {
		const current = buildConexantPacket(190, words);
		expect(Array.from(current.slice(0, 11))).toEqual([1, 1, 0, 13, 0, 190, 0, 0, 35, 45, 179]);
		expect(current.length).toBe(61);
		expect(candidate(190, words).slice(0, 60)).toEqual(current.slice(1));
	});
	it("passes candidate bytes separately from reportId to an in-memory fake", async () => {
		const device = { sendReport: vi.fn().mockResolvedValue(undefined), sendFeatureReport: vi.fn() };
		await sendConexantReport(device, candidate(190, words), vi.fn());
		expect(device.sendReport).toHaveBeenCalledExactlyOnceWith(1, fixture);
		expect(device.sendFeatureReport).not.toHaveBeenCalled();
	});
});
