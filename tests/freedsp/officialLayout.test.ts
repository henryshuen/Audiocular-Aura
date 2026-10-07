/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import dump from "./fixtures/officialAppUsbHelperDump.txt?raw";
import staticText from "./fixtures/officialApkStaticEvidence.json?raw";
import { parseHelperDump } from "../../scripts/freedsp/analyze-dump.mjs";
import { asWebHidData, cafId, encodeOfficialBuffer } from "../../scripts/freedsp/official-layout.mjs";

const packets = parseHelperDump(dump);
const evidence = JSON.parse(staticText.replace(/^\uFEFF/, ""));

describe("official DEX serializer model, isolated from runtime", () => {
  it("replays every independently recorded TX and RX byte, including zero-count capacity", () => {
    for (const p of packets) {
      const buffer = encodeOfficialBuffer({ prefix: p.prefixU16, command: p.command, reply: p.responseBit ? 1 : 0, module: p.moduleU32, count: p.countU16, words: p.words });
      expect([...buffer], `source line ${p.line}`).toEqual(p.bytes);
      const envelope = asWebHidData(buffer);
      expect(envelope.reportId).toBe(1);
      expect(envelope.data.length).toBe(61);
      expect([envelope.reportId, ...envelope.data]).toEqual(p.bytes);
      expect(envelope.data[0]).toBe(0);
      expect([...envelope.data.slice(5, 9)]).toEqual([0, 35, 45, 179]);
    }
  });
  it("derives CTRL from the official six-bit character packing", () => {
    expect(cafId("CTRL")).toBe(0xb32d2300);
    expect(cafId("CTRL")).toBe(packets[0].moduleU32);
    expect(() => cafId("CT")).toThrow();
  });
  it("rejects previous boundary models against every recorded request", () => {
    for (const p of packets.filter(p => p.direction === "TX")) {
      // M2B COUNT_U8 deleted buffer byte3; TRANSACTION_U8 deleted buffer byte1.
      const countU8 = p.bytes.filter((_, i) => i !== 3);
      const txnU8 = p.bytes.filter((_, i) => i !== 1);
      const correct = p.bytes.slice(1);
      expect(countU8).not.toEqual(correct);
      expect(txnU8).not.toEqual(correct);
      expect(() => asWebHidData(Uint8Array.from(correct))).toThrow();
    }
  });
  it("distinguishes the source255 commit from -1 and preserves negative coefficient words", () => {
    const p = packets.find(p => p.direction === "TX" && p.command === 220 && p.words[0] === 255)!;
    expect([...encodeOfficialBuffer({command: 220, words: p.words})]).toEqual(p.bytes);
    expect([...encodeOfficialBuffer({command: 220, words: [-1, ...p.words.slice(1)]})]).not.toEqual(p.bytes);
    expect([...encodeOfficialBuffer({command: 220, words: [-1]}).slice(10)]).toEqual([255, 255, 255, 255]);
  });
  it("models variable command capacity without sending short commands", () => {
    const bypass = encodeOfficialBuffer({command: 187, words: [0]});
    expect(bypass.length).toBe(14);
    expect(bypass[2]).toBe(1);
    expect(() => asWebHidData(bypass)).toThrow("Descriptor");
    expect(encodeOfficialBuffer({command: 188, words: [1, ...Array(12).fill(0)]}).length).toBe(62);
    expect(() => encodeOfficialBuffer({command: 190, words: [], count: 256})).toThrow();
  });
  it("anchors the recovered model to a versioned official artifact and decisive instructions", () => {
    expect(evidence.apkSha256).toBe("04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5");
    expect(evidence.versionName).toBe("2.25.0c-260813ai");
    expect(evidence.deviceMappingXml).toContain('product_id="5270" vendor_id="13784"');
    const save = evidence.methods.find((m: {name: string}) => m.name === "saveEQParamsToFlash");
    expect(save.instructions.find((i: {offset: number}) => i.offset === 1026).args).toBe("v1, 255");
    const ram = evidence.methods.find((m: {name: string}) => m.name === "setFreeman3EQ");
    expect(ram.instructions.find((i: {offset: number}) => i.offset === 286).args).toBe("v1, 190");
    // This source consistency check does not claim APK execution or device acceptance.
  });
});
