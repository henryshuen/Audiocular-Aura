import { describe, expect, it } from "vitest";
import { buildConexantPacket, quantizeConexantCoefficients } from "../../src/freedsp/conexantPacket.ts";

// Source-derived characterization fixtures, NOT captures from a physical device.
const bytes = (hex: string) => new Uint8Array(hex.trim().split(/\s+/).map((v) => Number.parseInt(v, 16)));
const ramFixture = bytes(`
  01 01 00 0d 00 be 00 00 23 2d b3
  05 00 00 00 01 00 00 00 03 00 00 00
  00 00 40 00 00 00 c0 ff 00 00 20 00 00 00 40 00 00 00 e0 ff
  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
`);
const flashFixture = bytes(`
  01 01 00 0d 00 dc 00 00 23 2d b3
  00 00 00 00 01 00 00 00 e8 03 00 00 00 01 00 00
  00 00 00 00 00 f4 ff ff
  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
`);
const modeFixture = bytes(`
  01 01 00 0d 00 5a 00 00 23 2d b3
  5a 00 00 00
  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
  00 00 00 00 00 00 00 00 00 00 00 00 00 00
`);

describe("current FreeDSP packet serialization", () => {
	it("always allocates 61 bytes, including for an empty payload", () => {
		expect(buildConexantPacket(190, []).length).toBe(61);
		expect(buildConexantPacket(190, Array(13).fill(0)).length).toBe(61);
	});
	it("preserves embedded report byte and fixed transaction ID", () => {
		expect(Array.from(buildConexantPacket(190, []).slice(0, 7)))
			.toEqual([1, 1, 0, 0, 0, 190, 0]);
		expect(Array.from(buildConexantPacket(190, []).slice(1, 3))).toEqual([1, 0]);
	});
	it("encodes word count at 3 and the masked 12-bit command at 5..6", () => {
		expect(Array.from(buildConexantPacket(0x1abc, [0]).slice(3, 7)))
			.toEqual([1, 0, 0xbc, 0x0a]);
	});
	it("encodes the current CTRL constant little-endian at 7..10", () => {
		expect(Array.from(buildConexantPacket(90, []).slice(7, 11)))
			.toEqual([0x00, 0x23, 0x2d, 0xb3]);
	});
	it("serializes integers deterministically starting at offset 11", () => {
		const values = [0, 1, 0x12345678, 0x7fffffff];
		const packet = buildConexantPacket(190, values);
		expect(Array.from(packet.slice(11, 27))).toEqual([
			0, 0, 0, 0, 1, 0, 0, 0, 0x78, 0x56, 0x34, 0x12, 0xff, 0xff, 0xff, 0x7f,
		]);
		expect(buildConexantPacket(190, values)).toEqual(packet);
		expect(values).toEqual([0, 1, 0x12345678, 0x7fffffff]);
	});
	it("preserves signed two's complement coefficient bytes", () => {
		expect(Array.from(buildConexantPacket(190, [-1, -4194304, -2147483648]).slice(11, 23)))
			.toEqual([255, 255, 255, 255, 0, 0, 192, 255, 0, 0, 0, 128]);
	});
	it("converts known coefficients to Q22 with the original feedback signs", () => {
		const coeffs = quantizeConexantCoefficients({ b0: 1, b1: -1, b2: 0.5, a1: -1, a2: 0.5 });
		expect(coeffs).toEqual([4194304, -4194304, 2097152, 4194304, -2097152]);
		expect(buildConexantPacket(190, [5, 1, 3, ...coeffs, 0, 0, 0, 0, 0])).toEqual(ramFixture);
	});
	it("preserves Math.round tie behavior including negative zero", () => {
		expect(quantizeConexantCoefficients({ b0: 0.5 / 4194304, b1: -0.5 / 4194304, b2: 0, a1: 0, a2: 0 }))
			.toEqual([1, -0, 0, -0, -0]);
	});
	it("matches a complete current RAM command 190 fixture", () => {
		expect(ramFixture.length).toBe(61);
		expect(buildConexantPacket(190, [5, 1, 3, 4194304, -4194304, 2097152, 4194304, -2097152, 0, 0, 0, 0, 0]))
			.toEqual(ramFixture);
	});
	it("matches a complete current Flash metadata command 220 fixture", () => {
		expect(flashFixture.length).toBe(61);
		expect(buildConexantPacket(220, [0, 1, 1000, 256, 0, -3072, 0, 0, 0, 0, 0, 0, 0]))
			.toEqual(flashFixture);
	});
	it("matches the current mode 0 command 90 fixture", () => {
		expect(modeFixture.length).toBe(61);
		expect(buildConexantPacket(90, [90, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))
			.toEqual(modeFixture);
	});
	it("preserves the Flash commit marker -1 at the first data word", () => {
		const packet = buildConexantPacket(220, [-1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
		expect(Array.from(packet.slice(0, 15))).toEqual([
			1, 1, 0, 13, 0, 220, 0, 0, 35, 45, 179, 255, 255, 255, 255,
		]);
	});
	it("exposes the truncated final word without changing framing", () => {
		const packet = buildConexantPacket(190, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x12345678]);
		expect(packet[3]).toBe(13);
		expect(Array.from(packet.slice(59))).toEqual([0x78, 0x56]);
		expect(packet[61]).toBeUndefined();
		expect(packet[62]).toBeUndefined();
	});
});
