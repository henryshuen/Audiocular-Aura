/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import sourceText from "./fixtures/officialAppUsbHelperDump.txt?raw";
import savedAnalysis from "./fixtures/officialAppDumpAnalysis.json?raw";
import { analyzeHelperDump, parseHelperDump } from "../../scripts/freedsp/analyze-dump.mjs";

const packets = parseHelperDump(sourceText);
const analysis = analyzeHelperDump(sourceText);

describe("M2D exhaustive helper-buffer forensics without hardware access", () => {
  it("reproduces the machine-readable inventory of every byte and pair", () => {
    expect(analysis).toEqual(JSON.parse(savedAnalysis.replace(/^\uFEFF/, "")));
    expect(analysis.packetCount).toBe(114);
    expect(analysis.pairCount).toBe(57);
    expect(analysis.commands.map(c => [c.command, c.pairCount])).toEqual([[90, 1], [220, 55], [259, 1]]);
  });
  it("pairs TX/RX explicitly and rejects invalid or missing byte evidence", () => {
    expect(() => parseHelperDump(sourceText.replace("TX [1,", "TX [256,"))).toThrow("Invalid signed byte");
    expect(() => parseHelperDump(sourceText.replace("TX [1,", "TX ["))).toThrow("62-entry");
    expect(() => parseHelperDump(sourceText.replace("TX [1,", "RX [1,"))).toThrow("pairing");
    expect(() => parseHelperDump("no packets")).toThrow("Missing");
  });
  it("finds constant prefix, module and response bit throughout all families", () => {
    for (const packet of packets) {
      expect(packet.prefixU8).toBe(1);
      expect(packet.prefixU16).toBe(1);
      expect(packet.moduleU32).toBe(0xb32d2300);
      expect(packet.bytes[3]).toBe(0);
      expect(packet.responseBit).toBe(packet.direction === "RX");
    }
    // A transaction interpretation spanning offsets 0..3 is not independent of count:
    // a fixed transaction U32 cannot explain both request and response buffers.
    expect(new Set(packets.map(p => p.prefixU32))).toEqual(new Set([0x000d0001, 1, 0x00040001]));
    expect(analysis.structuralChecks.responseCommandEqualsTxOr8000).toBe(true);
  });
  it("separates response count from overwritten capacity and echo data", () => {
    for (const pair of analysis.pairs.slice(0, 56)) {
      expect(pair.txCount).toBe(13);
      expect(pair.rxCount).toBe(0);
      expect(pair.differingOffsets).toEqual([2, 5]);
      expect(pair.rxWords).toEqual(pair.txWords);
    }
    const firmware = analysis.pairs[56];
    expect(firmware.rxCount).toBe(4);
    expect(firmware.rxWords).toEqual([9, 7, 14, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(firmware.differingOffsets).toEqual([2, 5, 10, 14, 18, 22]);
    // Zero-count responses retain request words; those are not independent status results.
  });
  it("keeps distinct command220 metadata, coefficient and commit interpretations", () => {
    expect(analysis.families.map(f => [f.family, f.count])).toEqual([
      ["mode", 1], ["flash-metadata", 9], ["flash-coefficients", 45], ["flash-commit", 1], ["firmware-query", 1]
    ]);
    const coefficients = analysis.pairs.filter(p => p.family === "flash-coefficients");
    expect(new Set(coefficients.map(p => p.txWords[0]))).toEqual(new Set([4, 5, 6, 7, 8]));
    expect(new Set(coefficients.map(p => p.txWords[2]))).toEqual(new Set([2, 3]));
    for (const rate of [4, 5, 6, 7, 8]) expect(coefficients.filter(p => p.txWords[0] === rate).map(p => p.txWords[1])).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(coefficients.every(p => p.coefficientLogMatches)).toBe(true);
    expect(analysis.structuralChecks.coefficientLogCount).toBe(45);
  });
  it("distinguishes real signed32 words from the commit value255", () => {
    const commit = analysis.pairs.find(p => p.family === "flash-commit")!;
    expect(commit.txWords).toEqual([255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const commitTx = packets[(commit.pair - 1) * 2];
    expect(commitTx.bytes.slice(10, 14)).toEqual([255, 0, 0, 0]);
    const negativeMetadata = analysis.pairs.find(p => p.family === "flash-metadata" && p.txWords[5] < 0)!;
    const negativeTx = packets[(negativeMetadata.pair - 1) * 2];
    expect(negativeTx.bytes.slice(31, 34)).toEqual([255, 255, 255]);
    expect(analysis.structuralChecks.txNegativeWords).toBe(96);
    // Signed byte printing preserves all four raw bytes; it cannot explain this difference.
    // The dump alone cannot determine the source type; the APK separately proves long255.
  });
  it("measures offset variability and observed zero tail without asserting transfer length", () => {
    const flash = analysis.commands.find(c => c.command === 220)!;
    expect(flash.tx.offsetStats[3]).toEqual({ offset: 3, unique: [0], entropyBits: 0 });
    expect(flash.tx.offsetStats[22].entropyBits).toBeGreaterThan(4);
    expect(flash.tx.offsetStats.slice(42).every(s => s.entropyBits === 0 && s.unique[0] === 0)).toBe(true);
    expect(packets.every(p => p.bytes.slice(42).every(byte => byte === 0))).toBe(true);
    // U8 vs U16 at offsets0/2 and stripping byte0 are indistinguishable in this sample.
    // The helper dump therefore cannot certify physical USB bytes or a RAM190 schema.
  });
});
