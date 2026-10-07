import { describe, expect, it } from 'vitest';
import safe from '../../tools/freedsp-native/SafeRam.cs?raw';
import apply from '../../scripts/apply-freedsp-native-safe-test.ps1?raw';
import restore from '../../scripts/restore-freedsp-native-safe-test.ps1?raw';
import sourceText from './fixtures/officialResponseStaticEvidence.json?raw';
import nativeTests from '../../tools/freedsp-native/Tests/Program.cs?raw';
import { nativePeakFloat, nativeScaling, makeOfficialRamWords } from '../../scripts/freedsp/ram-semantics.mjs';

describe('M2K fixed native RAM diagnostic, offline only', () => {
  it('native golden matches independent M2E float32/scaling reconstruction', () => {
    const f = nativePeakFloat({ frequency: 400, gainDb: -12, q: 1, sampleHz: 48000 });
    const s = nativeScaling(f.coefficients);
    const words = f.coefficients.map((c: number) => Math.round(Math.fround(c * s.scale)));
    expect(s).toMatchObject({ exponent: 1, gain: 3, scale: 4194304 });
    expect(words).toEqual([4038384, -7961235, 3933777, 7961236, -3777857]);
    expect(makeOfficialRamWords(0, { gain: s.gain, words })).toEqual([0, 5, 3, ...words, 0, 0, 0, 0, 0]);
    expect(nativeTests).toContain('4038384,-7961235,3933777,7961236,-3777857');
    expect(safe).toContain('native final quantizer uncertainty1LSB, not bit-exact');
  });
  it('pinned official Freeman3 call chain and payload are the source of fixed operations', () => {
    const source = JSON.parse(sourceText.replace(/^\uFEFF/, ''));
    const method = (name: string) => source.methods.find((m: { name: string }) => m.name === name);
    const instructions = method('setEQParam').instructions;
    const byOffset = new Map<number, { args: string }>(instructions.map((i: { offset: number; args: string }) => [i.offset, i]));
    expect(byOffset.get(236)!.args).toContain('setFreeman3EQEnabled');
    expect(byOffset.get(242)!.args).toContain('setEQCFGIsBypass');
    expect(byOffset.get(248)!.args).toContain('setFreeman3EQ');
    expect(method('setFreeman3EQ').instructions.find((i: { offset: number }) => i.offset === 58).args).toContain('getCurSampleRate');
    expect(method('setEQCFGIsBypass').instructions.find((i: { offset: number }) => i.offset === 28).args).toContain('187');
    expect(safe).toContain('Encode(187, [0])');
    expect(safe).toContain('accepted in M2K');
  });
  it('both scripts expose a single fixed operation with one child and a watchdog', () => {
    for (const [text, operation] of [[apply, 'ApplySafeRamTest'], [restore, 'RestoreSafeRamTest']]) {
      expect(text).toContain('$args.Count -ne 0');
      expect(text).toContain('" ' + operation);
      expect(text.match(/\$child\.Start\(\)/g)).toHaveLength(1);
      expect(text).toContain('ElapsedMilliseconds -ge 30000');
      expect(text).not.toMatch(/RunAs|query220|query90|Invoke-Expression/);
    }
    expect(safe).toContain('TryRemainingOperation(args[0], out _, out _)');
    expect(safe).not.toMatch(/Encode\((?:90|220|259),/);
  });
});
