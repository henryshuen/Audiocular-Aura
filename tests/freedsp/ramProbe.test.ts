import { describe, expect, it, vi } from "vitest";
import { applyRamProbe, buildRamProbe, probePeakCoefficients } from "../../src/freedsp/ramProbe.ts";

const fake = (bytes: number, feature = false) => ({
	vendorId: 0x35d8, productId: 0x1496, productName: "Fake FreeDSP", opened: false,
	collections: [{ outputReports: [{ reportId: 1, items: [{ reportSize: 8, reportCount: bytes }] }],
		featureReports: feature ? [{ reportId: 1, items: [{ reportSize: 8, reportCount: bytes }] }] : [] }],
	open: vi.fn().mockResolvedValue(undefined), sendReport: vi.fn().mockResolvedValue(undefined),
	sendFeatureReport: vi.fn().mockResolvedValue(undefined),
});

describe("bounded manual RAM probe, fake device only", () => {
	it("matches the existing PK calculation for the fixed attenuation target", () => {
		// Derived once from baseline dsp.ts::computeBiquadCoeffs, not from this helper.
		expect(probePeakCoefficients(1000, -12, 0.7, 48000))
			.toEqual([3701688, -7012371, 3371192, 7012371, -2878576]);
	});
	it("defaults to CURRENT, exactly nine RAM packets and mode 0; never Flash", () => {
		const packets = buildRamProbe("ATTENUATION");
		expect(packets).toHaveLength(10);
		expect(packets.map((packet) => packet.commandId)).toEqual([190, 190, 190, 190, 190, 190, 190, 190, 190, 90]);
		expect(packets.slice(0, 9).map((packet) => packet.bandIndex)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
		expect(packets.every((packet) => packet.data.length === 61)).toBe(true);
		expect(packets[0].sampleRateIndex).toBe(5);
		expect(Array.from(packets[9].data.slice(11, 19))).toEqual([90, 0, 0, 0, 0, 0, 0, 0]);
	});
	it("flat vs attenuation differs only in the first band's coefficients", () => {
		const flat = buildRamProbe("FLAT", "CANDIDATE_NO_EMBEDDED_REPORT_ID");
		const test = buildRamProbe("ATTENUATION", "CANDIDATE_NO_EMBEDDED_REPORT_ID");
		expect(flat.slice(1)).toEqual(test.slice(1));
		expect(flat[0].data).not.toEqual(test[0].data);
		const view = new DataView(test[0].data.buffer);
		expect(Array.from({ length: 5 }, (_, i) => view.getInt32(22 + i * 4, true)))
			.toEqual(probePeakCoefficients(1000, -12, 0.7, 48000));
		expect(test.every((packet) => packet.data.length === 62)).toBe(true);
	});
	it("uses only the explicitly chosen sample-rate index", () => {
		expect(buildRamProbe("FLAT", "CURRENT", 44100).slice(0, 9).every((packet) => packet.sampleRateIndex === 4)).toBe(true);
		expect(() => buildRamProbe("FLAT", "CURRENT", 12345)).toThrow("Unsupported sample rate");
	});
	it("does not open or send on a 61/62-byte descriptor mismatch", async () => {
		const device = fake(61);
		await expect(applyRamProbe(device, "ATTENUATION", "CANDIDATE_NO_EMBEDDED_REPORT_ID", 48000, vi.fn(), vi.fn())).rejects.toThrow("Blocked");
		expect(device.open).not.toHaveBeenCalled();
		expect(device.sendReport).not.toHaveBeenCalled();
		expect(device.sendFeatureReport).not.toHaveBeenCalled();
	});
	it("sends bounded candidate packets to a fake with matching descriptor and logs full bytes", async () => {
		const device = fake(62);
		const lines: string[] = [];
		await applyRamProbe(device, "ATTENUATION", "CANDIDATE_NO_EMBEDDED_REPORT_ID", 48000, (line) => lines.push(line), vi.fn());
		expect(device.open).toHaveBeenCalledOnce();
		expect(device.sendReport).toHaveBeenCalledTimes(10);
		for (const [id, data] of device.sendReport.mock.calls) { expect(id).toBe(1); expect(data.length).toBe(62); }
		expect(device.sendFeatureReport).not.toHaveBeenCalled();
		const tx = lines.find((line) => line.startsWith("TX"))!;
		expect(tx).toContain("framing=CANDIDATE_NO_EMBEDDED_REPORT_ID reportId=1 length=62 command=190 band=1 rateIndex=5");
		expect(tx.split("hex=")[1].split(" ")).toHaveLength(62);
		expect(lines.filter((line) => line === "sendReport SUCCESS fallback=NO")).toHaveLength(10);
	});
	it("fails once without feature fallback when no matching feature descriptor exists", async () => {
		const device = fake(61);
		device.sendReport.mockRejectedValue(new Error("output failure"));
		const log = vi.fn();
		await expect(applyRamProbe(device, "FLAT", "CURRENT", 48000, log, vi.fn())).rejects.toThrow("output failure");
		expect(device.sendReport).toHaveBeenCalledOnce();
		expect(device.sendFeatureReport).not.toHaveBeenCalled();
		expect(log.mock.calls.flat().join("\n")).toContain("fallback=SKIPPED");
	});
	it("uses one descriptor-checked fallback then stops on failure", async () => {
		const device = fake(62, true);
		device.sendReport.mockRejectedValue(new Error("output failure"));
		device.sendFeatureReport.mockRejectedValue(new Error("feature failure"));
		const log = vi.fn();
		await expect(applyRamProbe(device, "FLAT", "CANDIDATE_NO_EMBEDDED_REPORT_ID", 48000, log, vi.fn())).rejects.toThrow("feature failure");
		expect(device.sendReport).toHaveBeenCalledOnce();
		expect(device.sendFeatureReport).toHaveBeenCalledOnce();
		expect(log.mock.calls.flat().join("\n")).toContain("sendFeatureReport FAILURE");
	});
	it("can finish after a single matching feature fallback without repeating the output write", async () => {
		const device = fake(62, true);
		device.sendReport.mockRejectedValueOnce(new Error("output failure"));
		const log = vi.fn();
		await applyRamProbe(device, "FLAT", "CANDIDATE_NO_EMBEDDED_REPORT_ID", 48000, log, vi.fn());
		expect(device.sendReport).toHaveBeenCalledTimes(10);
		expect(device.sendFeatureReport).toHaveBeenCalledOnce();
		expect(device.sendFeatureReport.mock.calls[0][1]).toBe(device.sendReport.mock.calls[0][1]);
		expect(log.mock.calls.flat().join("\n")).toContain("sendFeatureReport SUCCESS");
	});
	it("rejects another product before any device operation", async () => {
		const device = { ...fake(61), productId: 0x11d };
		await expect(applyRamProbe(device, "FLAT", "CURRENT", 48000, vi.fn(), vi.fn())).rejects.toThrow("Only FreeDSP");
		expect(device.open).not.toHaveBeenCalled();
		expect(device.sendReport).not.toHaveBeenCalled();
	});
});
