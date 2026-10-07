export type ConexantTransport = Pick<HIDDevice, 'sendReport' | 'sendFeatureReport'>;
export type ConexantTxLogger = (reportId: number, packet: Uint8Array) => void;

export async function sendConexantReport(device: ConexantTransport, packet: Uint8Array, logTx: ConexantTxLogger) {
	const reportId = 1;
	logTx(reportId, packet);
	try {
		await device.sendReport(reportId, packet);
	} catch (err) {
		const errMsg = (err as Error).message || "";
		console.warn(`[Conexant TX] sendReport(id=${reportId}) failed: ${errMsg}. Retrying via sendFeatureReport...`);
		try {
			await device.sendFeatureReport(reportId, packet);
		} catch (featErr) {
			console.error(`[Conexant TX] sendFeatureReport(id=${reportId}) also failed:`, featErr);
			throw featErr;
		}
	}
}
