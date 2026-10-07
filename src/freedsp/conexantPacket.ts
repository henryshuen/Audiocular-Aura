// Characterization of current FreeDSP bytes; not a hardware-validated layout.
export function quantizeConexantCoefficients(coeffs: {
	b0: number; b1: number; b2: number; a1: number; a2: number;
}): number[] {
	const scale = 4194304; // Q22 = 2^22; preserve the original signs and Math.round.
	return [coeffs.b0, coeffs.b1, coeffs.b2, -coeffs.a1, -coeffs.a2]
		.map((c) => Math.round(c * scale));
}

export function buildConexantPacket(commandId: number, data: number[]): Uint8Array {
	const packet = new Uint8Array(61);
	packet[0] = 1; // Report ID = 1
	packet[1] = 1 & 0xff; // transaction ID low
	packet[2] = (1 >> 8) & 0xff; // transaction ID high

	const numWords = data.length;
	const p1_combined = (numWords & 0xff) | ((commandId & 0xfff) << 16);
	packet[3] = p1_combined & 0xff;
	packet[4] = (p1_combined >> 8) & 0xff;
	packet[5] = (p1_combined >> 16) & 0xff;
	packet[6] = (p1_combined >> 24) & 0xff;

	// Module ID = CafId("CTRL") = 0xB32D2300
	const moduleId = 0xB32D2300;
	packet[7] = moduleId & 0xff;
	packet[8] = (moduleId >> 8) & 0xff;
	packet[9] = (moduleId >> 16) & 0xff;
	packet[10] = (moduleId >> 24) & 0xff;

	// Write 32-bit data words
	for (let i = 0; i < numWords; i++) {
		const val = data[i];
		const offset = 11 + i * 4;
		packet[offset] = val & 0xff;
		packet[offset + 1] = (val >> 8) & 0xff;
		packet[offset + 2] = (val >> 16) & 0xff;
		packet[offset + 3] = (val >> 24) & 0xff;
	}

	return packet;
}
