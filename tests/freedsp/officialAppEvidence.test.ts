/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import sourceText from "./fixtures/officialAppUsbHelperDump.txt?raw";
import { buildConexantPacket } from "../../src/freedsp/conexantPacket.ts";
import { buildConexantPacketCandidateNoEmbeddedReportId } from "../../src/freedsp/conexantCandidate.ts";

// Public tester-supplied official-app UsbHelperDump; NOT a verified on-wire capture.
// No reportId interpretation, serializer, transport, or new candidate is introduced.
const text = sourceText.replace(/\r\n/g, "\n"); // Accommodate Git's Windows checkout newline conversion.
const packets = Array.from(text.matchAll(/^.*UsbHelperDump.*?: (TX|RX) \[([^\]]+)\]/gm), (match) => {
	const signed = match[2].split(",").map((value) => Number(value.trim()));
	return { direction: match[1], signed, bytes: Uint8Array.from(signed.map((value) => value & 0xff)) };
});
const tx = packets.filter((packet) => packet.direction === "TX");
const rx = packets.filter((packet) => packet.direction === "RX");
const viewOf = (bytes: Uint8Array) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

describe("M2C preserved official-app helper evidence, no hardware claims", () => {
	it("preserves the published attachment text with a stable source checksum", async () => {
		const hash = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
		expect(Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join(""))
			.toBe("f726e1a440d82ad495cf5d9ffeaa0db17f9bbfdc27f9334a8895517f4df6c4cf");
	});
	it("records 57 TX/RX pairs of 62 signed bytes with only observed commands", () => {
		expect(tx.length).toBe(57);
		expect(rx.length).toBe(57);
		for (const packet of packets) {
			expect(packet.signed.length).toBe(62);
			expect(packet.signed.every((value) => Number.isInteger(value) && value >= -128 && value <= 127)).toBe(true);
			expect(Array.from(packet.bytes.slice(0, 2))).toEqual([1, 0]);
			expect(Array.from(packet.bytes.slice(6, 10))).toEqual([0, 35, 45, 179]);
		}
		const commands = tx.map(({ bytes }) => viewOf(bytes).getUint16(4, true));
		expect(commands.filter((command) => command === 90).length).toBe(1);
		expect(commands.filter((command) => command === 220).length).toBe(55);
		expect(commands.filter((command) => command === 259).length).toBe(1);
		expect(commands).not.toContain(190);
	});
	it("retains the zero byte between count and command, and all 13 LE32 positions", () => {
		for (const { bytes } of tx) {
			expect(Array.from(bytes.slice(2, 4))).toEqual([13, 0]);
			expect((bytes.length - 10) / 4).toBe(13);
			const words = Array.from({ length: 13 }, (_, index) => viewOf(bytes).getInt32(10 + index * 4, true));
			expect(words.length).toBe(13);
			expect(words.slice(8)).toEqual([0, 0, 0, 0, 0]);
		}
		// All observed 90/220/259 TX arrays have the same count/capacity. This says
		// nothing about unobserved RAM190 or whether the tail is required on USB.
	});
	it("matches existing no-ID builder bytes without proving the WebHID boundary", () => {
		for (const { bytes } of tx) {
			const view = viewOf(bytes);
			const words = Array.from({ length: 13 }, (_, index) => view.getInt32(10 + index * 4, true));
			const command = view.getUint16(4, true);
			expect(buildConexantPacketCandidateNoEmbeddedReportId(command, words)).toEqual(bytes);
			// CURRENT contains an extra leading 1 before this helper representation.
			expect(buildConexantPacket(command, words).slice(1)).toEqual(bytes.slice(0, 60));
		}
	});
	it("preserves a coefficient record and the four-word firmware response", () => {
		const coeff = tx.find(({ bytes }) => viewOf(bytes).getUint16(4, true) === 220
			&& viewOf(bytes).getInt32(10, true) === 4 && viewOf(bytes).getInt32(14, true) === 1)!;
		expect(Array.from({ length: 5 }, (_, index) => viewOf(coeff.bytes).getInt32(22 + index * 4, true)))
			.toEqual([0x3fa528, 0xff813643 | 0, 0x3f25c5, 0x7ec9bc, 0xffc13513 | 0]);
		const firmware = rx[rx.length - 1].bytes;
		expect(Array.from(firmware.slice(2, 6))).toEqual([4, 0, 3, 129]);
		expect(Array.from({ length: 4 }, (_, index) => viewOf(firmware).getInt32(10 + index * 4, true)))
			.toEqual([9, 7, 14, 1]);
	});
});
