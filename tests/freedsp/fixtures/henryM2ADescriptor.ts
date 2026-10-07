// Henry's supplied M2A summary (2026-10-07), NOT raw descriptor bytes or USB capture.
// Only reported primary fields are modeled as parsed metadata. Missing fields stay absent.
import type { FreeDSPMetadata } from "../../../src/freedsp/descriptor.ts";

export const henryM2ADescriptor: FreeDSPMetadata = {
	vendorId: 13784, productId: 5270, productName: "FreeDSP",
	collections: [{
		usagePage: 12, usage: 1,
		inputReports: [{ reportId: 1, items: [{ reportCount: 61, reportSize: 8 }] }],
		outputReports: [{ reportId: 1, items: [{ reportCount: 61, reportSize: 8 }] }],
	}],
};
// Secondary item widths/counts were not supplied; preserve only the reported total.
export const henrySecondaryInputSummary = { reportId: 2, totalBytes: 1 } as const;
