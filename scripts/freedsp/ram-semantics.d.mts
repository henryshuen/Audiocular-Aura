export const officialRateHz: number[];
export function sdkRamBand(band: number): number;
export function selectRamSampleHz(index: number, fallbackHz?: number): number;
export function makeOfficialRamWords(band: number, coefficients: {gain: number; words: number[]}): number[];
export function nativePeakFloat(input: {frequency: number; gainDb: number; q: number; sampleHz: number}): {gainRaw: number; qRaw: number; frequency: number; coefficients: number[]};
export function nativeScaling(coefficients: number[], precision?: number): {exponent: number; gain: number; scale: number; fractionalBits: number};
export function nativeWordIntervals(coefficients: number[], scale: number): {scaled: number; min: number; max: number}[];
