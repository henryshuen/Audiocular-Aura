/** Evidence policy, not a hardware capability probe. No commands are sent here. */
export const freeDspControlEvidence = {
  preamp: {status: 'UNKNOWN', reason: 'FreeDSP：正／負全域增益命令尚未確認；Auto Preamp 依賴此命令，兩者停用。'},
  balance: {status: 'UNKNOWN', reason: 'FreeDSP：尚未確認專用平衡或左右全域增益命令；不以九段 PEQ 模擬。'},
  tilt: {status: 'UNSUPPORTED', reason: 'FreeDSP：目前僅驗證九段 PK；尚無獨立 Bass／Treble 實作，不占用 PEQ 段位。'},
  microphone: {status: 'UNKNOWN', reason: 'FreeDSP：線材有麥克風；增益、監聽與電平控制尚未確認，泛用電平動畫不是量測。'},
} as const;

const originalTitles = new Map<HTMLElement, string | null>();
const originalLabels = new Map<HTMLElement, {text: string; i18n: string | null}>();
/** Called only when entering/leaving the exact FreeDSP UI. Other DACs keep their UI. */
export function configureFreeDspControlNotes(active: boolean, doc: Document = document) {
  const note = doc.getElementById('freeDspControlNote');
  if (note) note.hidden = !active;
  if (!active) {
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
  for (const [id, text] of [['preampStepIndicator', 'FreeDSP 全域增益／Auto Preamp：UNKNOWN，停用'],
                           ['micMonitorStatus', 'FreeDSP 監聽／電平：未驗證']] as const) {
    const element = doc.getElementById(id);
    if (!element) continue;
    if (!originalLabels.has(element)) originalLabels.set(element, {text: element.textContent ?? '', i18n: element.getAttribute('data-i18n')});
    element.removeAttribute('data-i18n'); element.textContent = text;
  }
  const auto = doc.getElementById('checkAutoPreamp') as HTMLInputElement | null;
  if (auto) auto.checked = false;
}
