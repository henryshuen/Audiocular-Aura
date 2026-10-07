/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import analysisText from "./fixtures/officialAppDumpAnalysis.json?raw";
import nativeText from "./fixtures/officialRamStaticEvidence.json?raw";
import { makeOfficialRamWords, nativePeakFloat, nativeScaling, nativeWordIntervals, officialRateHz, sdkRamBand, selectRamSampleHz } from "../../scripts/freedsp/ram-semantics.mjs";
import { buildConexantPacket } from "../../src/freedsp/conexantPacket";
import { asWebHidData, encodeOfficialBuffer } from "../../scripts/freedsp/official-layout.mjs";

const dump = JSON.parse(analysisText.replace(/^\uFEFF/, ""));
const source = JSON.parse(nativeText.replace(/^\uFEFF/, ""));
const metadata = new Map<number, number[]>(dump.pairs.filter((p: {family: string}) => p.family === "flash-metadata").map((p: {txWords: number[]}) => [p.txWords[1], p.txWords]));

describe("M2E official RAM semantics without hardware", () => {
  it("validates native Gain and all225 coefficient candidate intervals against45 recorded outputs", () => {
    const pairs = dump.pairs.filter((p: {family: string}) => p.family === "flash-coefficients");
    expect(pairs).toHaveLength(45);
    for (const p of pairs) {
      const m = metadata.get(p.txWords[1])!;
      const f = nativePeakFloat({frequency: m[2], q: m[3] / 256, gainDb: p.coefficientLog.gainDb, sampleHz: officialRateHz[p.txWords[0]]});
      const scaling = nativeScaling(f.coefficients);
      expect(scaling.gain).toBe(p.txWords[2]);
      const intervals = nativeWordIntervals(f.coefficients, scaling.scale);
      for (let i = 0; i < 5; i++) {
        expect(p.txWords[i + 3], `pair${p.pair}/word${i}`).toBeGreaterThanOrEqual(intervals[i].min);
        expect(p.txWords[i + 3], `pair${p.pair}/word${i}`).toBeLessThanOrEqual(intervals[i].max);
      }
    }
    // Independent old dump versus current source model; not a fabricated RAM capture.
    // Candidate intervals validate scaling/math/sign, not which neighbor native selected.
  });
  it("proves Q22/Gain3 is only one native exponent case", () => {
    expect(nativeScaling([1, 0, 0, 0, 0])).toMatchObject({gain: 3, scale: 2 ** 22});
    expect(nativeScaling([0.75, -0.9, 0.3, 0.9, -0.1])).toMatchObject({gain: 2, scale: 2 ** 23});
    const f = nativePeakFloat({frequency: 5900, gainDb: -7.2, q: 0.7, sampleHz: 44100});
    expect(f.qRaw).toBe(179);
    expect(f.gainRaw).toBe(-1843);
    expect(nativeScaling(f.coefficients).gain).toBe(2);
  });
  it("does not misclassify a coherent Q22/Gain3 pair as inherently silent", () => {
    const p = dump.pairs.find((p: {family: string; txWords: number[]}) => p.family === "flash-coefficients" && p.txWords[2] === 2);
    for (const nativeWord of p.txWords.slice(3, 8)) {
      const normalized = nativeWord / (2 ** 23);
      const q22Word = Math.round(normalized * (2 ** 22));
      expect(Math.abs(q22Word / (2 ** 22) - normalized)).toBeLessThanOrEqual(0.5 / (2 ** 22));
      expect(Math.abs(q22Word)).toBeLessThan(2 ** 23);
    }
    // Source inverse formula supports the numerical relationship. Device acceptance
    // is untested; dynamic official precision is preferable but mismatch alone is
    // not evidence for zero effect in a valid24bit attenuation profile.
  });
  it("maps only the proven SDK0..4 input range to5..9", () => {
    expect([0, 1, 2, 3, 4].map(sdkRamBand)).toEqual([5, 6, 7, 8, 9]);
    for (const invalid of [-1, 5, 8, 0.5]) expect(() => sdkRamBand(invalid)).toThrow("nine-band");
    expect(makeOfficialRamWords(0, {gain: 2, words: [1, -2, 3, -4, 5]})).toEqual([0, 5, 2, 1, -2, 3, -4, 5, 0, 0, 0, 0, 0]);
  });
  it("selects exactly one current rate with the official fallback", () => {
    expect([4, 5, 6, 7, 8].map(i => selectRamSampleHz(i))).toEqual([44100, 48000, 96000, 192000, 384000]);
    expect(selectRamSampleHz(-1001)).toBe(48000);
    expect(selectRamSampleHz(9, 96000)).toBe(96000);
    expect(source.freqSampleRate.slice(0, 9)).toEqual(officialRateHz);
    expect(source.freqSampleRate.slice(9)).toEqual([882000, 176000]);
  });
  it("shows current framing decodes as command13, not the requested190", () => {
    const words = makeOfficialRamWords(0, {gain: 3, words: [2 ** 22, 0, 0, 0, 0]});
    const current = buildConexantPacket(190, words);
    const currentView = new DataView(current.buffer);
    expect(currentView.getUint16(1, true)).toBe(1);
    expect(currentView.getUint16(3, true) & 0x7fff).toBe(13);
    expect(currentView.getUint32(5, true)).toBe(0x230000be);
    const corrected = asWebHidData(encodeOfficialBuffer({command: 190, words})).data;
    const view = new DataView(corrected.buffer);
    expect(view.getUint16(1, true)).toBe(13);
    expect(view.getUint16(3, true) & 0x7fff).toBe(190);
    expect(view.getUint32(5, true)).toBe(0xb32d2300);
    // This is a byte interpretation against source layout, not device execution.
  });
  it("anchors prerequisites, native arguments and bit operations to extracted source", () => {
    const method = (name: string) => source.javaMethods.find((m: {name: string; class: string}) => m.name === name && m.class.endsWith("/FreemanCnxtUsbDevice;"));
    expect(method("setEQParam").instructions).toContain("34: if-nez v0, +0c3h");
    expect(method("setEQParam").instructions.some((i: string) => i.startsWith("236:") && i.includes("setFreeman3EQEnabled"))).toBe(true);
    expect(method("setEQParam").instructions.some((i: string) => i.startsWith("242:") && i.includes("setEQCFGIsBypass"))).toBe(true);
    const callback = source.jniMethods.find((m: {name: string}) => m.name === "native_cxaudio_convert_eqparams_2_coeffs");
    expect(callback).toMatchObject({signature: "(ILjava/lang/Object;Ljava/lang/Object;I)I", callback: 0x27f4});
    const fx = source.nativeFunctions.find((f: {name: string}) => f.name.includes("EqDesignFx"));
    expect(fx.instructions).toContain("3758: neg v0.2s, v0.2s");
    const convert = source.nativeFunctions.find((f: {name: string}) => f.name.includes("CxAudioConvertEqParams2Coeff"));
    expect(convert.instructions).toContain("2bc8: add w9, w9, #2");
  });
  it("keeps bypass and asymmetric neighbor selection distinct from round-to-nearest", () => {
    expect(nativePeakFloat({frequency: 1000, gainDb: 0, q: 0.7, sampleHz: 48000}).coefficients).toEqual([1, 0, 0, 0, 0]);
    expect(nativeWordIntervals([1, 0, 0, 1, 0], 4)).toEqual([
      {scaled: 4, min: 4, max: 5}, {scaled: 0, min: 0, max: 1}, {scaled: 0, min: 0, max: 1}, {scaled: 4, min: 3, max: 4}, {scaled: 0, min: -1, max: 0}
    ]);
  });
});
