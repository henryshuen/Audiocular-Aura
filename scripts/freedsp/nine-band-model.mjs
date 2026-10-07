// Offline proposed UI adapter only. No transport, production imports or hardware authorization.
import { nativePeakFloat, nativeScaling, officialRateHz } from './ram-semantics.mjs';

export const proposedNineSlots = Object.freeze(Array.from({length:9}, (_, uiIndex) => Object.freeze({
  uiIndex, wire:uiIndex+1, sdkBand:uiIndex >= 4 ? uiIndex-4 : null,
  hardwareEvidence:uiIndex >= 4 ? 'SDK_SLOT_REVERSAL_VERIFIED' : 'UNVERIFIED_RAW_SLOT',
  uiAssignment:'PROPOSED_NOT_HARDWARE_VERIFIED',
})));

// Intentionally negative PK only. This returns nine offline models, never sends them.
export function modelNineBands(bands, rateIndex) {
  if (!Number.isInteger(rateIndex) || rateIndex < 4 || rateIndex > 8) throw new Error('Unknown rate; no fallback');
  if (!Array.isArray(bands) || bands.length !== 9) throw new Error('Exactly nine bands required; no truncation');
  const sampleHz = officialRateHz[rateIndex];
  return bands.map((b, position) => {
    if (b.index !== position || !Number.isInteger(b.index)) throw new Error('UI position/index mismatch');
    if (b.type !== 'PK' || typeof b.enabled !== 'boolean') throw new Error('Only explicit PK/enabled semantics supported');
    if (![b.freq,b.gain,b.q].every(Number.isFinite) || b.freq < 1 || b.freq > 65535 ||
        b.freq >= Math.floor(sampleHz/2) || b.gain < -12 || b.gain > 0 || b.q*256 < 1 || b.q*256 > 65535)
      throw new Error('Invalid or unsupported research parameter; no narrowing/wrapping');
    const f = b.enabled ? nativePeakFloat({frequency:b.freq,gainDb:b.gain,q:b.q,sampleHz}).coefficients : [1,0,0,0,0];
    const scaling = nativeScaling(f);
    const words = f.map(c => Math.round(Math.fround(c*scaling.scale)));
    if (words.some(w => !Number.isInteger(w) || w < -8388608 || w > 8388607)) throw new Error('Signed24 overflow');
    const a1 = -words[3]/scaling.scale, a2 = -words[4]/scaling.scale;
    if (!(Math.abs(a2)<1 && 1+a1+a2>0 && 1-a1+a2>0)) throw new Error('Unstable quantized filter');
    const slot = proposedNineSlots[position];
    const payload = [0,slot.wire,scaling.gain,...words,0,0,0,0,0];
    const report = new Uint8Array(62), view = new DataView(report.buffer);
    report[0] = 1; view.setUint32(2,0x00be000d,true); view.setUint32(6,0xb32d2300,true);
    payload.forEach((word,i) => view.setInt32(10+4*i,word,true));
    return {...slot,sampleHz,payload,report,offlineOnly:true,nativeBitExact:false};
  });
}
