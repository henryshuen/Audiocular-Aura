// Deterministic offline source/dump cross-check. No device/native calls.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {analyzeHelperDump} from './analyze-dump.mjs';
export function analyzeFlash(){
  const source=JSON.parse(readFileSync(new URL('../../tests/freedsp/fixtures/officialFreemanControlStaticEvidence.json',import.meta.url),'utf8'));
  const dump=analyzeHelperDump(readFileSync(new URL('../../tests/freedsp/fixtures/officialAppUsbHelperDump.txt',import.meta.url),'utf8'));
  const method=source.methods.find(m=>m.method==='saveEQParamsToFlash');
  const offsets=[140,144,146,156,174,184,188,198,202,206,208,436,438,544,792,802,812,822,832,842,854,866,894,898,906,954,1026,1030,1054];
  const packets=dump.pairs.filter(p=>p.command===90||p.command===220);
  return {category:'DERIVED cross-check of saved official DEX and helper buffers, not a new USB capture',
    apkSha256:source.apkSha256,method:method.method,selectedInstructions:method.instructions.filter(i=>offsets.includes(i.offset)),
    requestCount:packets.length,command220Count:packets.filter(p=>p.command===220).length,
    order:packets.map(p=>({pair:p.pair,kind:p.family,command:p.command,head:p.txWords.slice(0,6),rxCount:p.rxCount})),
    limits:['No separate stereo selectors in220; shared saved configuration inferred, boot stereo application pending.',
      'Metadata gain truncates whole dB; coefficients use Q8.8 parameter quantization and dynamic coefficient Gain.',
      'No proof of commit atomicity, persistence, wear limits, fractional metadata reload precision or PEQ readback.']};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])process.stdout.write(JSON.stringify(analyzeFlash(),null,2)+'\n');
