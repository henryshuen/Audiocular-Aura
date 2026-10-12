import {describe,it,expect} from 'vitest';
// @ts-expect-error Isolated Node research helper; never bundled into production.
import {parseProbe,probeHtml,configurationInterfaces} from '../../scripts/freedsp/browser-surface-probe.mjs';
import evidence from './fixtures/browserTransportAudit20261012.json';
import previous from './fixtures/freeDspUsbConfiguration.json';
describe('Measured browser/collection surface audit, not hardware CAF success',()=>{
 it('fresh full configuration equals prior physical bytes and covers every alternate',()=>{
  const cfg=evidence.device.configuration.configurations[0];expect(cfg.hex).toBe(previous.configurations[0].hex);expect(cfg.sha256).toBe(previous.configurations[0].sha256);
  const interfaces=configurationInterfaces(cfg.hex);expect(interfaces).toHaveLength(9);expect([...new Set(interfaces.map((i:any)=>i.number))]).toEqual([0,1,2,3]);
  expect(interfaces.every((i:any)=>i.protectedClass)).toBe(true);expect(interfaces.at(-1)).toEqual({number:3,alternate:0,classCode:3,protectedClass:true});
 });
 it('second real collection cannot carry a CAF62 frame and neither has Feature capacity',()=>{
  expect(evidence.device.collections.map(c=>[c.inputBytes,c.outputBytes,c.featureBytes])).toEqual([[62,62,0],[2,0,0]]);
  expect(evidence.device.bindings).toEqual({composite:'usbccgp',audio:'usbaudio2',hid:'HidUsb'});
 });
 it('both installed-browser API observations lack Input GET; Feature existence is not a report capability',()=>{
  expect(evidence.browsers).toHaveLength(2);
  for(const b of evidence.browsers){expect(b.secureContext).toBe(true);expect(b.hidMethods).toContain('receiveFeatureReport');expect(b.hidMethods).not.toContain('receiveReport');expect(b.hidMethods).not.toContain('getInputReport');expect(b.usbMethods).toContain('controlTransferIn');expect(b.deviceTransfers).toBe(0);expect(b.devicePermissionRequested).toBe(false);}
  expect(evidence.browserHardwarePass).toBe(false);expect(evidence.cafSets+evidence.cafGets+evidence.eqWrites).toBe(0);
 });
 it('probe reads API properties only, and refuses absent or unsafe observations',()=>{
  expect(probeHtml).not.toMatch(/\.(requestDevice|getDevices|open|sendReport|receiveFeatureReport|controlTransferIn)\s*\(/);
  const dom='<pre id="result">'+JSON.stringify(evidence.browsers[0])+'</pre>';expect(parseProbe(dom).deviceTransfers).toBe(0);
  expect(()=>parseProbe('<pre id="result"></pre>')).toThrow();expect(()=>parseProbe(dom.replace('"deviceTransfers":0','"deviceTransfers":1'))).toThrow();
 });
 it('incomplete inventory is rejected; hypothetical vendor interface is a lead only',()=>{
  const cfg=evidence.device.configuration.configurations[0].hex;expect(()=>configurationInterfaces(cfg.slice(0,-2))).toThrow();expect(()=>configurationInterfaces('zz')).toThrow();
  const hypothetical='0902120001010080320904000000ff000000';expect(configurationInterfaces(hypothetical)[0].protectedClass).toBe(false);expect(evidence.verdict).toBe('BLOCKED');
 });
 it('official modern-model registry is distinct from exact legacy5270',()=>{
  expect(evidence.officialWebsite.productionRegistryPids).not.toContain(5270);expect(evidence.officialWebsite.otherRegistryPids).not.toContain(5270);
  expect(evidence.officialWebsite.reportId).toBe(75);expect(evidence.officialWebsite.peqCount).toBe(8);
 });
});
