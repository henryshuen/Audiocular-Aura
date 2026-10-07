/// <reference types="vite/client" />
import { inspectFreeDSPDescriptor, selectFreeDSPForInspection, requireMatchingReport } from "./descriptor.ts";
import { applyRamProbe } from "./ramProbe.ts";
import type { FramingMode, ProbeProfile } from "./ramProbe.ts";

// Independent page: never imports main/fn/dsp or registers connection listeners.
if (import.meta.env.DEV) {
	const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
	const status = element<HTMLParagraphElement>("status");
	const select = element<HTMLButtonElement>("select-device");
	const inspect = element<HTMLButtonElement>("inspect");
	const framing = element<HTMLSelectElement>("framing");
	const rate = element<HTMLSelectElement>("sample-rate");
	const safety = element<HTMLInputElement>("safety");
	const flat = element<HTMLButtonElement>("flat");
	const attenuation = element<HTMLButtonElement>("attenuation");
	const descriptor = element<HTMLPreElement>("descriptor");
	const output = element<HTMLTextAreaElement>("log");
	let device: HIDDevice | null = null;
	let busy = false;
	const log = (line: string) => { output.value += `${line}\n`; output.scrollTop = output.scrollHeight; console.info(`[FreeDSP M2A] ${line}`); };
	const update = () => {
		select.disabled = busy || !navigator.hid;
		inspect.disabled = busy || !device;
		framing.disabled = rate.disabled = safety.disabled = busy;
		let reason = "先手動選取 FreeDSP，並確認測試條件。";
		let valid = false;
		if (device) {
			try { requireMatchingReport(device, "output", framing.value === "CURRENT" ? 61 : 62); valid = true; reason = "Descriptor 長度符合，可在確認測試條件後手動套用 RAM。"; }
			catch (error) { reason = String(error); }
		}
		flat.disabled = attenuation.disabled = busy || !valid || !safety.checked;
		if (!busy) status.textContent = reason;
	};
	const showDescriptor = () => {
		if (!device) return;
		const snapshot = inspectFreeDSPDescriptor(device);
		descriptor.textContent = JSON.stringify(snapshot, null, 2);
		log(`INSPECT ONLY ${JSON.stringify(snapshot)}`);
		update();
	};
	select.addEventListener("click", async () => {
		busy = true; device = null; safety.checked = false; update();
		try {
			device = await selectFreeDSPForInspection(navigator.hid);
			if (device) showDescriptor(); else log("Selection cancelled; no open or report sent.");
		} catch (error) { log(`SELECT ERROR ${String(error)}`); }
		finally { busy = false; update(); }
	});
	inspect.addEventListener("click", showDescriptor);
	for (const control of [framing, rate, safety]) control.addEventListener("change", update);
	const apply = async (profile: ProbeProfile) => {
		if (busy || !device || !safety.checked) return;
		busy = true; update();
		try { await applyRamProbe(device, profile, framing.value as FramingMode, Number(rate.value), log); }
		catch (error) { log(`STOP ${String(error)}; do not retry or change framing blindly.`); }
		finally { busy = false; update(); }
	};
	flat.addEventListener("click", () => void apply("FLAT"));
	attenuation.addEventListener("click", () => void apply("ATTENUATION"));
	element<HTMLDivElement>("controls").hidden = false;
	update();
	if (!navigator.hid) status.textContent = "WebHID 不可用；請使用支援 WebHID 的 Chrome/Edge localhost。";
} else {
	document.getElementById("status")!.textContent = "診斷頁僅限 Vite 開發模式；production 不啟用 WebHID 操作。";
}
