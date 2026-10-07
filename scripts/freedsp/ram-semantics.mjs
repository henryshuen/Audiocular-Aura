// Offline reconstruction from official DEX/ARM64. No USB APIs or runtime imports.
// Float/scaling model only; does not claim bit-exact native 32-candidate selection.
export const officialRateHz = [8000, 16000, 24000, 32000, 44100, 48000, 96000, 192000, 384000];

export function sdkRamBand(band) {
  if (!Number.isInteger(band) || band < 0 || band > 4) throw new Error('Official SDK RAM band must be0..4; nine-band mapping unproven');
  return band + 5;
}

export function selectRamSampleHz(index, fallbackHz = 48000) {
  return Number.isInteger(index) && index >= 4 && index <= 8 ? officialRateHz[index] : fallbackHz;
}

export function makeOfficialRamWords(band, coefficients) {
  const { gain, words } = coefficients;
  if (!Number.isInteger(gain) || gain < -128 || gain > 127 || words.length !== 5 || !words.every(w => Number.isInteger(w) && w >= -2147483648 && w <= 2147483647)) throw new Error('Invalid coefficient object');
  return [0, sdkRamBand(band), gain, ...words, 0, 0, 0, 0, 0];
}

function signed16(value) { return (value << 16) >> 16; }

export function nativePeakFloat({ frequency, gainDb, q, sampleHz }) {
  if (![frequency, gainDb, q, sampleHz].every(Number.isFinite) || q <= 0 || sampleHz <= 0) throw new Error('Invalid research parameter');
  // Java double-to-int truncation, then native packed U16/U16/U16/S16 struct.
  const freq = Math.trunc(frequency) & 65535;
  const qRaw = Math.trunc(q * 256) & 65535;
  const gainRaw = signed16(Math.trunc(gainDb * 256));
  if (gainRaw === 0 || qRaw === 0 || freq === 0 || freq >= Math.floor(sampleHz / 2)) return { gainRaw, qRaw, frequency: freq, coefficients: [1, 0, 0, 0, 0] };
  const w = 2 * Math.PI * freq / Math.fround(sampleHz);
  const sin = Math.sin(w), cos = Math.cos(w);
  const x = 128 / qRaw;
  const bandwidth = Math.fround(Math.log(x + Math.sqrt(1 + x * x)) * (2 / Math.LN2));
  const alpha = sin * Math.sinh((w / sin) * bandwidth * (Math.LN2 / 2));
  const A = Math.pow(1.0592537251772889, gainRaw / 256);
  const denominator = 1 + alpha / A;
  // EqDesign stores normalized results as float32 before fixed-point conversion.
  return { gainRaw, qRaw, frequency: freq, coefficients: [(1 + alpha * A) / denominator, -2 * cos / denominator, (1 - alpha * A) / denominator, 2 * cos / denominator, -(1 - alpha / A) / denominator].map(Math.fround) };
}

export function nativeScaling(coefficients, precision = 24) {
  const maxAbs = Math.max(...coefficients.map(Math.abs));
  if (!(maxAbs > 0) || !Number.isInteger(precision) || precision < 2 || precision > 30) throw new Error('Invalid scaling input');
  const exponent = Math.floor(Math.log(maxAbs) * Math.LOG2E) + 1;
  const gain = exponent + 2;
  const scale = 2 ** (precision - 1 - exponent);
  return { exponent, gain, scale, fractionalBits: precision + 1 - gain };
}

export function nativeWordIntervals(coefficients, scale) {
  // Native explores floor and floor+1, even when the scaled float is integral.
  // Feedback is negated AFTER choosing a neighbor, so reverse that interval.
  return coefficients.map((c, i) => {
    const scaled = Math.fround(c * scale);
    const nativeFloor = Math.floor(i < 3 ? scaled : -scaled);
    return { scaled, min: i < 3 ? nativeFloor : -nativeFloor - 1, max: i < 3 ? nativeFloor + 1 : -nativeFloor };
  });
}
