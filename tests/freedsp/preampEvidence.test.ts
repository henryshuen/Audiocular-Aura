import {describe, expect, it} from 'vitest';
import boundary from './fixtures/officialPreampBoundaryEvidence.json';
import pcm from './fixtures/officialPreampPcmEvidence.json';
import commands from './fixtures/officialPreampCommandEvidence.json';

describe('M2U static preamp evidence boundaries; no device access', () => {
  it('covers both DEX files and every arm64 library in the pinned APK', () => {
    expect(boundary.dexes).toEqual([{file:'classes.dex', classes:11398}, {file:'classes2.dex', classes:487}]);
    expect(boundary.arm64Libraries).toHaveLength(36);
    expect(boundary.conexantNativeDeclarations).toHaveLength(9);
    expect(new Set([boundary.apkSha256, pcm.apkSha256, commands.apkSha256]).size).toBe(1);
    expect(boundary.apkSha256).toBe('04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5');
  });
  it('distinguishes vendor Comtrue transfers from Audio Class volume requests', () => {
    const sites=boundary.boundaryCalls.filter(c=>c.call.args.includes('->controlTransfer('));
    expect(sites.map(c=>c.method).sort()).toEqual(['call','getDeviceString','receiveHIDReport','run','sendHIDReport']);
    for (const [owner,type,request] of [['Lba4;',67,160],['Lom0;',195,161]] as const) {
      const body=sites.find(c=>c.class===owner)!.instructions;
      expect(body.some(i=>i.args===`v2, ${type}`)).toBe(true);
      expect(body.some(i=>i.args===`v3, ${request}`)).toBe(true);
      expect(type & 0x60).toBe(0x40); // Vendor type, not class type 0x20.
    }
    expect(boundary.boundaryCalls.some(c=>c.call.args.includes('->getRawDescriptors('))).toBe(false);
  });
  it('resolves the PCM JNI tail call and power conversion rather than inferring from names', () => {
    expect(pcm.pltTargets.find(p=>p.address===0x144a0)?.symbol).toBe('pcm_mixer_set_globle_gain');
    expect(pcm.pltTargets.find(p=>p.address===0x14540)?.symbol).toBe('powf');
    const body=pcm.functions.find(f=>f.name==='pcm_mixer_set_globle_gain')!.instructions.join('\n');
    expect(body).toContain('fdiv s1, s0, s1');
    expect(body).toContain('str s0, [x19, #4]');
    expect(body).toContain('bl #0x14540');
    expect(pcm.pcmGainCallers.map(c=>c.method)).toEqual(['setGlobalGain']);
  });
  it('retains unresolved Dart pregain leads without calling them FreeDSP controls', () => {
    const strings=boundary.arm64Libraries.find(l=>l.file.endsWith('/libapp.so'))!.controlStrings;
    expect(strings).toContain('/usbPeqPreGainDebug');
    expect(strings).toContain('/blePeqPreGainDebug');
    expect(boundary.limitations).toContain('dynamic Dart AOT call graph');
  });
  it('keeps known CAF families separate from a nonexistent recovered master-gain mapping', () => {
    const ids=commands.calls.map(c=>Number(c.commandConstant!.split(', ')[1]));
    expect([...new Set(ids)].sort((a,b)=>a-b)).toEqual([90,187,188,190,220,259,346,442,446,477]);
    expect(commands.limitations).toContain('not branch-aware dataflow');
    const callbacks=commands.buttonMethods.find(m=>m.name==='onKeyEvent')!.instructions;
    expect(callbacks.some(i=>i.args.includes('IUsbKeyEventListener;->onKeyEvent'))).toBe(true);
    expect(callbacks.some(i=>i.args.includes('CafCmdHelper'))).toBe(false);
  });
});
