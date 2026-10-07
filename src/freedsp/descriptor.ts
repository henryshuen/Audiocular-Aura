export const FREEDSP_FILTER = { vendorId: 0x35d8, productId: 0x1496 } as const;
export type FreeDSPMetadata = Pick<HIDDevice, "vendorId" | "productId" | "productName" | "collections">;
export type ReportKind = "input" | "output" | "feature";
export type ReportSummary = {
	path: string;
	kind: ReportKind;
	reportId: number | null;
	items: HIDReportItem[];
	bits: number | null;
	bytes: number | null;
};

export function assertFreeDSP(device: Pick<HIDDevice, "vendorId" | "productId">): void {
	if (device.vendorId !== FREEDSP_FILTER.vendorId || device.productId !== FREEDSP_FILTER.productId) {
		throw new Error("Only FreeDSP VID 0x35D8 / PID 0x1496 is permitted.");
	}
}

// Metadata only: no open, receive, send, or feature request.
export function inspectFreeDSPDescriptor(device: FreeDSPMetadata) {
	assertFreeDSP(device);
	const reports: ReportSummary[] = [];
	const walk = (collections: HIDCollectionInfo[], parent: string) => {
		collections.forEach((collection, index) => {
			const path = `${parent}/${index}`;
			for (const kind of ["input", "output", "feature"] as const) {
				for (const report of collection[`${kind}Reports`] ?? []) {
					const items = report.items ?? [];
					const complete = items.length > 0 && items.every((item) =>
						Number.isSafeInteger(item.reportSize) && Number.isSafeInteger(item.reportCount)
						&& item.reportSize! > 0 && item.reportCount! > 0);
					const bits = complete ? items.reduce((total, item) => total + item.reportSize! * item.reportCount!, 0) : null;
					reports.push({ path, kind, reportId: report.reportId ?? null, items,
						bits, bytes: bits !== null && bits % 8 === 0 ? bits / 8 : null });
				}
			}
			walk(collection.children ?? [], path);
		});
	};
	walk(device.collections, "collections");
	return {
		vendorId: device.vendorId, productId: device.productId, productName: device.productName,
		collections: device.collections, reports,
		limitation: "Browser-exposed parsed metadata only; not raw descriptor or DSP readback. Missing sizes remain unknown. Report ID is separate from data bytes.",
	};
}

export function requireMatchingReport(device: FreeDSPMetadata, kind: ReportKind, bytes: number): void {
	const reports = inspectFreeDSPDescriptor(device).reports.filter((report) => report.kind === kind && report.reportId === 1);
	if (reports.length !== 1 || reports[0].bytes !== bytes) {
		throw new Error(`Blocked: ${kind} reportId=1 needs one unambiguous ${bytes}-byte descriptor; exposed sizes=${JSON.stringify(reports.map((report) => report.bytes))}. No padding or truncation attempted.`);
	}
}

export async function selectFreeDSPForInspection(hid: Pick<HID, "requestDevice">): Promise<HIDDevice | null> {
	const devices = await hid.requestDevice({ filters: [FREEDSP_FILTER] });
	if (devices.length === 0) return null;
	if (devices.length !== 1) throw new Error("Select exactly one FreeDSP HID interface; no interface guessed.");
	assertFreeDSP(devices[0]);
	return devices[0];
}
