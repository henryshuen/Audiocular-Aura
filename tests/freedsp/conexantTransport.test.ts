import { afterEach, describe, expect, it, vi } from "vitest";
import { buildConexantPacket } from "../../src/freedsp/conexantPacket.ts";
import { sendConexantReport } from "../../src/freedsp/conexantTransport.ts";

afterEach(() => vi.restoreAllMocks());

describe("FreeDSP transport with an in-memory fake only", () => {
	it("passes reportId 1 and the same 61-byte RAM packet unchanged", async () => {
		const device = { sendReport: vi.fn().mockResolvedValue(undefined), sendFeatureReport: vi.fn() };
		const logTx = vi.fn();
		const packet = buildConexantPacket(190, [5, 1, 3, 4194304, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
		await sendConexantReport(device, packet, logTx);
		expect(logTx).toHaveBeenCalledOnce();
		expect(logTx).toHaveBeenCalledWith(1, packet);
		expect(device.sendReport).toHaveBeenCalledOnce();
		expect(device.sendReport).toHaveBeenCalledWith(1, packet);
		expect(device.sendReport.mock.calls[0][1]).toBe(packet);
		expect(packet.length).toBe(61);
		expect(Array.from(packet.slice(0, 11))).toEqual([1, 1, 0, 13, 0, 190, 0, 0, 35, 45, 179]);
		expect(device.sendFeatureReport).not.toHaveBeenCalled();
	});
	it("retries the identical Flash packet as a feature report on output failure", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		const device = { sendReport: vi.fn().mockRejectedValue(new Error("output failed")), sendFeatureReport: vi.fn().mockResolvedValue(undefined) };
		const logTx = vi.fn();
		const packet = buildConexantPacket(220, [-1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
		await sendConexantReport(device, packet, logTx);
		expect(device.sendReport).toHaveBeenCalledOnce();
		expect(device.sendFeatureReport).toHaveBeenCalledOnce();
		expect(device.sendFeatureReport).toHaveBeenCalledWith(1, packet);
		expect(device.sendFeatureReport.mock.calls[0][1]).toBe(packet);
		expect(device.sendReport.mock.invocationCallOrder[0]).toBeLessThan(device.sendFeatureReport.mock.invocationCallOrder[0]);
		expect(logTx).toHaveBeenCalledOnce();
		expect(Array.from(packet.slice(0, 7))).toEqual([1, 1, 0, 13, 0, 220, 0]);
	});
	it("propagates the feature-report failure without swallowing it", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
		const featureError = new Error("feature failed");
		const device = { sendReport: vi.fn().mockRejectedValue(new Error("output failed")), sendFeatureReport: vi.fn().mockRejectedValue(featureError) };
		await expect(sendConexantReport(device, buildConexantPacket(90, [90, 0]), vi.fn())).rejects.toBe(featureError);
		expect(device.sendReport).toHaveBeenCalledOnce();
		expect(device.sendFeatureReport).toHaveBeenCalledOnce();
	});
});
