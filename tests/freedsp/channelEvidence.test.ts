import {describe,it,expect} from 'vitest';
import nineText from './fixtures/officialNineSlotStaticEvidence.json?raw';
import namesText from './fixtures/officialPathNameEvidence.json?raw';
import dump from './fixtures/officialAppUsbHelperDump.txt?raw';
import {parseHelperDump} from '../../scripts/freedsp/analyze-dump.mjs';
type Instruction={offset:number;op:string;args:string};
const methods=JSON.parse(nineText).methods as {name:string;instructions:Instruction[]}[];
const instruction=(name:string,offset:number)=>methods.find(m=>m.name===name)!.instructions.find(i=>i.offset===offset)!;
describe('M2P pinned static path evidence, not stereo proof',()=>{
 it('official initializer sends same slot/unity to0then1; two190 calls inside slotloop',()=>{
   for(const [offset,args] of [[62,'v4, v3, v0'],[70,'v6, v3, v8'],[176,'v2, v0, v22'],[180,'v6, v0, v8'],[188,'v13, v0, v12']] as const)
     expect(instruction('setDefaultAvailable',offset).args).toBe(args);
   expect(instruction('setDefaultAvailable',58).args).toBe('v4, 0');
   expect(instruction('setDefaultAvailable',172).args).toBe('v2, 1');
   expect(instruction('setDefaultAvailable',86).args).toBe('v13, 4194304');
   expect(instruction('setDefaultAvailable',146).args).toBe('v4, 190');
   expect(instruction('setDefaultAvailable',150).args).toContain('getCmd');
   expect(instruction('setDefaultAvailable',216).args).toContain('v4, v2, v0');
   expect(instruction('setDefaultAvailable',234).args).toBe('v1, v1, 1');
 });
 it('official runtime setter/getter use0; do not fabricate a paired negative190 capture',()=>{
   expect(instruction('setFreeman3EQ',172).args).toBe('v4, 0');
   expect(instruction('setFreeman3EQ',176).args).toBe('v4, v0, v1');
   expect(instruction('getFreeman3EQParam',8).args).toBe('v1, 0');
   expect(instruction('getFreeman3EQParam',14).args).toBe('v1, v0, v3');
   const packets=parseHelperDump(dump).filter(p=>p.direction==='TX');
   expect(packets.filter(p=>p.command===190)).toHaveLength(0);
   expect([...new Set(packets.filter(p=>p.command===220).map(p=>p.words[0]))].sort((a,b)=>a-b)).toEqual([0,4,5,6,7,8,255]);
 });
 it('bounded APK name search has no EQ Left/Right field mapping and no extra literal190 methods',()=>{
   const names=JSON.parse(namesText.replace(/^\uFEFF/,''));
   expect(names.apkSha256).toBe(JSON.parse(nineText).apkSha256);
   expect(names.freemanMethodsWithLiteral190).toEqual(['setDefaultAvailable','setFreeman3EQ']);
   expect(names.matches.filter((m:{class:string})=>m.class.includes('FreemanCnxtUsbDevice'))).toEqual([]);
   expect(names.matches.some((m:{field:string})=>m.field==='mLeftGain')).toBe(true); // ANC, not a190 channel name.
 });
});
