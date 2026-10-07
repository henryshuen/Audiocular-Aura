import { describe, expect, it, vi } from "vitest";
import { inspectFreeDSPDescriptor, requireMatchingReport, selectFreeDSPForInspection } from "../../src/freedsp/descriptor.ts";

const metadata = (collections: HIDCollectionInfo[]) => ({ vendorId: 0x35d8, productId: 0x1496, productName: "Fake FreeDSP", collections });

describe("read-only browser metadata inspection", () => {
	it("shows recursive collections and calculates bits from size times count", () => {
		const device = { ...metadata([{ usagePage: 0xff00, children: [{
			outputReports: [{ reportId: 1, items: [{ reportSize: 8, reportCount: 61 }] }],
			inputReports: [{ reportId: 2, items: [{ reportSize: 16, reportCount: 3 }] }],
			featureReports: [{ reportId: 1, items: [{ reportSize: 8, reportCount: 62 }] }],
		}] }]), open: vi.fn(), sendReport: vi.fn(), sendFeatureReport: vi.fn(), receiveFeatureReport: vi.fn() };
		const snapshot = inspectFreeDSPDescriptor(device);
		expect(snapshot.reports.map((report) => [report.kind, report.bytes])).toEqual([["input", 6], ["output", 61], ["feature", 62]]);
		expect(snapshot.reports[1].bits).toBe(488);
		expect(snapshot.reports[1].path).toBe("collections/0/0");
		for (const method of [device.open, device.sendReport, device.sendFeatureReport, device.receiveFeatureReport]) expect(method).not.toHaveBeenCalled();
	});
	it("sums multiple items including constant padding without treating count as bytes", () => {
		const report = inspectFreeDSPDescriptor(metadata([{ outputReports: [{ reportId: 1, items: [
			{ reportSize: 1, reportCount: 4 }, { reportSize: 1, reportCount: 4, isConstant: true },
		] }] }])).reports[0];
		expect(report.bits).toBe(8);
		expect(report.bytes).toBe(1);
	});
	it("leaves missing dimensions and non-byte-aligned reports unknown", () => {
		const snapshot = inspectFreeDSPDescriptor(metadata([{ outputReports: [
			{ reportId: 1, items: [{ reportCount: 61 }] },
			{ reportId: 2, items: [{ reportSize: 1, reportCount: 7 }] },
			{ items: [] },
		] }]));
		expect(snapshot.reports.map((report) => report.bytes)).toEqual([null, null, null]);
		expect(snapshot.reports[2].reportId).toBeNull();
	});
	it("allows exact length only; blocks mismatches, missing and ambiguous reports", () => {
		const report = { reportId: 1, items: [{ reportSize: 8, reportCount: 61 }] };
		expect(() => requireMatchingReport(metadata([{ outputReports: [report] }]), "output", 61)).not.toThrow();
		expect(() => requireMatchingReport(metadata([{ outputReports: [report] }]), "output", 62)).toThrow("Blocked");
		expect(() => requireMatchingReport(metadata([]), "output", 61)).toThrow("Blocked");
		expect(() => requireMatchingReport(metadata([{ outputReports: [report, report] }]), "output", 61)).toThrow("unambiguous");
	});
	it("rejects a non-FreeDSP device", () => {
		expect(() => inspectFreeDSPDescriptor({ ...metadata([]), productId: 0x11d })).toThrow("Only FreeDSP");
	});
	it("requests only the exact device on an explicit call, without opening or sending", async () => {
		const device = { ...metadata([]), open: vi.fn(), sendReport: vi.fn(), sendFeatureReport: vi.fn() } as unknown as HIDDevice;
		const hid = { requestDevice: vi.fn().mockResolvedValue([device]) };
		expect(hid.requestDevice).not.toHaveBeenCalled();
		expect(await selectFreeDSPForInspection(hid)).toBe(device);
		expect(hid.requestDevice).toHaveBeenCalledExactlyOnceWith({ filters: [{ vendorId: 0x35d8, productId: 0x1496 }] });
		expect(device.open).not.toHaveBeenCalled();
		expect(device.sendReport).not.toHaveBeenCalled();
		expect(device.sendFeatureReport).not.toHaveBeenCalled();
	});
	it("handles cancellation and refuses to guess among multiple interfaces", async () => {
		expect(await selectFreeDSPForInspection({ requestDevice: vi.fn().mockResolvedValue([]) })).toBeNull();
		await expect(selectFreeDSPForInspection({ requestDevice: vi.fn().mockResolvedValue([metadata([]), metadata([])]) })).rejects.toThrow("exactly one");
	});
});
