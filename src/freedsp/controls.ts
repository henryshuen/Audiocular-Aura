/** Evidence policy, not a hardware capability probe. No commands are sent here. */
export const freeDspControlEvidence = {
  preamp: {status: 'UNKNOWN', reason: 'FreeDSP: global gain and Auto Preamp are unavailable; hardware headroom is unverified.'},
  balance: {status: 'EXCLUDED', reason: 'FreeDSP: channel balance is excluded from production support; the diagnostic UAC control is not used here.'},
  tilt: {status: 'UNSUPPORTED', reason: 'FreeDSP: Tone Tilt is unsupported; it does not alter the nine PEQ bands.'},
  microphone: {status: 'EXCLUDED', reason: 'FreeDSP: microphone controls are excluded. The diagnostic volume control attenuates only; no positive boost or level telemetry is provided.'},
} as const;

const originalTitles = new Map<HTMLElement, string | null>();
const originalLabels = new Map<HTMLElement, {text: string; i18n: string | null}>();
const originalDisplays = new Map<HTMLElement,string>();
/** Called only when entering/leaving the exact FreeDSP UI. Other DACs keep their UI. */
export function configureFreeDspControlNotes(active: boolean, doc: Document = document) {
  const note = doc.getElementById('freeDspControlNote');
  if (note) note.hidden = !active;
  if (!active) {
    for(const [element,display] of originalDisplays)element.style.display=display;
    originalDisplays.clear();
    for (const [element, title] of originalTitles) {
      if (title === null) element.removeAttribute('title'); else element.setAttribute('title', title);
    }
    for (const [element, value] of originalLabels) {
      element.textContent = value.text;
      if (value.i18n === null) element.removeAttribute('data-i18n'); else element.setAttribute('data-i18n', value.i18n);
    }
    originalTitles.clear(); originalLabels.clear();
    return;
  }
  const preamp=doc.getElementById('preampControls');
  if(preamp){if(!originalDisplays.has(preamp))originalDisplays.set(preamp,preamp.style.display);preamp.style.display='none';}
  for (const [ids, reason] of [
    [['globalGainSlider', 'checkAutoPreamp'], freeDspControlEvidence.preamp.reason],
    [['sliderBalance'], freeDspControlEvidence.balance.reason],
    [['slideBassTilt', 'slideTrebleTilt'], freeDspControlEvidence.tilt.reason],
    [['toggleMicMonitor', 'sliderMicGain'], freeDspControlEvidence.microphone.reason],
  ] as const) {
    for (const id of ids) {
      const element = doc.getElementById(id) as HTMLInputElement | null;
      if (!element) continue;
      if (!originalTitles.has(element)) originalTitles.set(element, element.getAttribute('title'));
      element.disabled = true; element.title = reason;
    }
  }
  for (const [id, text] of [['preampStepIndicator', 'FreeDSP global gain / Auto Preamp: UNKNOWN; disabled'],
                           ['micMonitorStatus', 'FreeDSP microphone monitoring / levels: unavailable'],
                           ['lastAppliedEqLabel', 'EDITOR / READBACK:'],
                           ['infoSampleRateLabel', 'Active RAM Rate:'],
                           ['infoSlotsLabel', 'Local Nonzero Bands:']] as const) {
    const element = doc.getElementById(id);
    if (!element) continue;
    if (!originalLabels.has(element)) originalLabels.set(element, {text: element.textContent ?? '', i18n: element.getAttribute('data-i18n')});
    element.removeAttribute('data-i18n'); element.textContent = text;
  }
  const slots=doc.getElementById('infoSlotsLabel');
  if(slots){if(!originalTitles.has(slots))originalTitles.set(slots,slots.getAttribute('title'));slots.title='Counts locally enabled bands with nonzero gain; not hardware enabled-state telemetry.';}
  const auto = doc.getElementById('checkAutoPreamp') as HTMLInputElement | null;
  if (auto) auto.checked = false;
}
