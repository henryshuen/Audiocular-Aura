import { describe, expect, it } from 'vitest';
import native from '../../tools/freedsp-native/NativeHid.cs?raw';
import main from '../../tools/freedsp-native/Program.cs?raw';
import cli from '../../tools/freedsp-native/Caf346.cs?raw';
import launcher from '../../scripts/query-freedsp-native.ps1?raw';
import production from '../../src/main.ts?raw';
import nativeTests from '../../tools/freedsp-native/Tests/Program.cs?raw';
import { encodeCaf } from '../../src/freedsp/officialRamProof.ts';

describe('M2I native diagnostic deployment boundary; no hardware', () => {
  it('native independent golden equals the already tested official WebHID helper62', () => {
    const golden = nativeTests.match(/Convert.FromHexString\("([0-9A-F]+)" \+ new string\('0', (\d+)\)\)/)!;
    const hex = golden[1] + '0'.repeat(Number(golden[2]));
    const bytes = Uint8Array.from(hex.match(/../g)!.map(pair => parseInt(pair, 16)));
    const web = encodeCaf(346, [62, ...Array(12).fill(0)]);
    expect([...bytes]).toEqual([...web.helper]);
    expect([...bytes.slice(1)]).toEqual([...web.data]);
  });
  it('only HID state SET/INPUT GET imports, without feature/stream-write/driver fallback', () => {
    const imports = [...native.matchAll(/extern\s+(?:bool|void|int|IntPtr|SafeFileHandle)\s+(\w+)\(/g)].map(m => m[1]);
    expect(imports).toContain('HidD_SetOutputReport');
    expect(imports).toContain('HidD_GetInputReport');
    expect(imports.some(x => /WriteFile|SetFeature|GetFeature|Install|Remove|Restart|WinUsb/.test(x))).toBe(false);
    expect(native).toContain('SequenceEqual(Caf346.CreateQuery())');
  });
  it('validates sole query CLI before discovery; native helper has no browser production import', () => {
    expect(main.indexOf('IsQueryOperation(args)')).toBeLessThan(main.indexOf('NativeHid.Discover()'));
    expect(cli).toContain('args.Length == 1 && args[0] == "query346"');
    expect(production).not.toMatch(/freedsp-native|FreeDspQuery|NativeHid/);
  });
  it('launcher exposes no command/path options, elevation or relaunch; watchdog limits child only', () => {
    expect(launcher).toContain('$args.Count -ne 0');
    expect(launcher).toContain('" query346');
    expect(launcher).toContain('ElapsedMilliseconds -ge 30000');
    expect(launcher).toContain('RedirectStandardOutput = $true');
    expect(launcher).toContain('RedirectStandardError = $true');
    expect(launcher.match(/\$child\.Start\(\)/g)).toHaveLength(1);
    expect(launcher).not.toMatch(/RunAs|query190|query188|query187|query220|query90/);
  });
});
