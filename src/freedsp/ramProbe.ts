import { buildConexantPacket, quantizeConexantCoefficients } from "./conexantPacket.ts";
import { buildConexantPacketCandidateNoEmbeddedReportId } from "./conexantCandidate.ts";
import { assertFreeDSP, requireMatchingReport } from "./descriptor.ts";
import type { FreeDSPMetadata } from "./descriptor.ts";
import type { ConexantTransport } from "./conexantTransport.ts";

export const FRAMING_MODES = ["CURRENT", "CANDIDATE_NO_EMBEDDED_REPORT_ID"] as const;
export type FramingMode = typeof FRAMING_MODES[number];
export type ProbeProfile = "FLAT" | "ATTENUATION";
export const PROBE_SAMPLE_RATES = [[4, 44100], [5, 48000], [6, 96000], [7, 192000], [8, 384000]] as const;
export type ProbePacket = { commandId: 190 | 90; bandIndex: number | null; sampleRateIndex: number | null; data: Uint8Array };
export type ProbeDevice = FreeDSPMetadata & ConexantTransport & Pick<HIDDevice, "opened" | "open">;

// Copy of the existing normalized PK branch; no new EQ/preamp interpretation.
export function probePeakCoefficients(freq: number, gain: number, q: number, sampleRate: number) {
	const w0 = (2 * Math.PI * freq) / sampleRate;
	const alpha = Math.sin(w0) / (2 * q);
	const A = 10 ** (gain / 40);
	const cosw = Math.cos(w0);
	const invA0 = 1 / (1 + alpha / A);
	return quantizeConexantCoefficients({
		b0: (1 + alpha * A) * invA0, b1: (-2 * cosw) * invA0,
		b2: (1 - alpha * A) * invA0, a1: (-2 * cosw) * invA0, a2: (1 - alpha / A) * invA0,
	});
}

export function buildRamProbe(profile: ProbeProfile, framing: FramingMode = "CURRENT", sampleRate = 48000): ProbePacket[] {
	if (!FRAMING_MODES.includes(framing) || !["FLAT", "ATTENUATION"].includes(profile)) throw new Error("Unknown probe selection.");
	const rate = PROBE_SAMPLE_RATES.find((entry) => entry[1] === sampleRate);
	if (!rate) throw new Error("Unsupported sample rate.");
	const builder = framing === "CURRENT" ? buildConexantPacket : buildConexantPacketCandidateNoEmbeddedReportId;
	const frequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000];
	const packets: ProbePacket[] = frequencies.map((freq, index) => {
		const target = index === 0;
		const gain = profile === "ATTENUATION" && target ? -12 : 0;
		const coeffs = probePeakCoefficients(target ? 1000 : freq, gain, 0.7, sampleRate);
		return { commandId: 190, bandIndex: index + 1, sampleRateIndex: rate[0],
			data: builder(190, [rate[0], index + 1, 3, ...coeffs, 0, 0, 0, 0, 0]) };
	});
	// Preserve existing custom mode 0 activation, no Flash command 220.
	packets.push({ commandId: 90, bandIndex: null, sampleRateIndex: null,
		data: builder(90, [90, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) });
	return packets;
}

export function packetHex(data: Uint8Array): string {
	return Array.from(data, (byte) => byte.toString(16).padStart(2, "0")).join(" ");
}

// Invoked only by an explicit manual RAM action. Stop immediately on failure.
export async function applyRamProbe(
	device: ProbeDevice, profile: ProbeProfile, framing: FramingMode,
	sampleRate: number, log: (line: string) => void,
	wait: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
) {
	assertFreeDSP(device);
	const packets = buildRamProbe(profile, framing, sampleRate);
	// Validate before opening or sending even the first packet.
	for (const packet of packets) requireMatchingReport(device, "output", packet.data.length);
	if (!device.opened) await device.open();
	log(`START profile=${profile} framing=${framing} sampleRate=${sampleRate} count=${packets.length}; software transmission only, not proof of EQ.`);
	for (const packet of packets) {
		log(`TX framing=${framing} reportId=1 length=${packet.data.length} command=${packet.commandId} band=${packet.bandIndex ?? "n/a"} rateIndex=${packet.sampleRateIndex ?? "n/a"} hex=${packetHex(packet.data)}`);
		try {
			await device.sendReport(1, packet.data);
			log("sendReport SUCCESS fallback=NO");
		} catch (error) {
			log(`sendReport FAILURE: ${String(error)}`);
			try { requireMatchingReport(device, "feature", packet.data.length); }
			catch (descriptorError) { log(`fallback=SKIPPED ${String(descriptorError)}`); throw error; }
			log("fallback=sendFeatureReport (matching descriptor)");
			try { await device.sendFeatureReport(1, packet.data); log("sendFeatureReport SUCCESS"); }
			catch (featureError) { log(`sendFeatureReport FAILURE: ${String(featureError)}`); throw featureError; }
		}
		await wait(30);
	}
	log("END transmission completed; Henry must verify audible behavior. No Flash/preamp/readback.");
}
