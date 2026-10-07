import { describe, expect, it } from 'vitest';
import native from '../../tools/freedsp-native/SafeRam.cs?raw';
import wrapper from '../../scripts/test-freedsp-native-band-map.ps1?raw';
import module from '../../scripts/freedsp/BandValidation.psm1?raw';
import main from '../../src/main.ts?raw';
import sourceText from './fixtures/officialApkStaticEvidence.json?raw';

describe('M2L remaining-band diagnostic boundary', () => {
  it('fixed CLI and native guard permit only SDK1..4 and unity/fixedattenuation', () => {
    for (let band = 1; band <= 4; band++) {
      expect(native).toContain(`"ApplyRemainingBand${band}" => (${band}, false)`);
      expect(native).toContain(`"RestoreRemainingBand${band}" => (${band}, true)`);
    }
    expect(native).toContain('sdkBand is >= 1 and <= 4 ? sdkBand + 5');
    expect(native).not.toMatch(/Encode\((90|220|259),/);
    expect(native).toContain('Enumerable.Range(1, 4).Any');
    expect(main).not.toMatch(/freedsp-native|BandValidation|RemainingBand/);
  });
  it('official static SDK band shift proves the mapping, not hardware success', () => {
    const source = JSON.parse(sourceText.replace(/^\uFEFF/, ''));
    const shift = source.methods.find((m: { name: string }) => m.name === 'shiftEQBandForFreeman3');
    expect(JSON.stringify(shift.instructions)).toContain('add-int/lit8');
    expect(JSON.stringify(shift.instructions)).toMatch(/5/);
  });
  it('single entry script owns prompts, temp logs, safety gates and no wire5 default', () => {
    expect(wrapper).toContain('$args.Count -ne 0');
    expect(wrapper).toContain("[ValidateSet('1','2','3','4')][string]$StartSdkBand = '1'");
    expect(wrapper).toContain('-StartSdkBand $StartSdkBand');
    expect(wrapper).toContain('[System.IO.Path]::GetTempPath()');
    expect(wrapper).toContain('[System.IO.FileMode]::CreateNew');
    expect(wrapper).toContain('TEMP resolves inside repository');
    expect(wrapper).toContain('$writer.WriteLine($line)');
    expect(module).toContain('$results = @(1..4');
    expect(module).toContain('if ($code -ne 0)');
    expect(module).toContain('Confirm blocked: successful APPLY and RESTORE are required');
    expect(module).toContain('M2L BAND MAP SUMMARY');
    expect(module).toContain('FIRST APPLY with IEM OUT OF EARS');
    expect(module).not.toMatch(/ApplyRemainingBand0|ApplySafeRamTest|RunAs|Invoke-Expression/);
  });
});
