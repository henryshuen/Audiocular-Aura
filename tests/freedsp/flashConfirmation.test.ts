import html from '../../index.html?raw';
// @ts-expect-error Offline file loading only; Node types are intentionally not global.
import {readFileSync} from 'node:fs';
import main from '../../src/main.ts?raw';
import {JSDOM} from 'jsdom';
import {describe,it,expect,vi} from 'vitest';
import {confirmFreeDspReset} from '../../src/freedsp/inPageConfirm.ts';
import {FlashSaveGate,flashSafetyMessage} from '../../src/freedsp/flashUi.ts';
function page(){
 const dom=new JSDOM(html);
 const doc=dom.window.document;
 const style=doc.createElement('style');style.textContent=readFileSync('src/style.css','utf8');doc.head.append(style);
 const get=(id:string)=>doc.getElementById(id)!;
 const click=(id:string)=>get(id).dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true}));
 const acknowledge=(checked:boolean)=>{const input=get('freeDspFlashAcknowledgement') as HTMLInputElement;input.checked=checked;input.dispatchEvent(new dom.window.Event('change',{bubbles:true}));};
 return {dom,doc,get,click,acknowledge};
}
describe('FreeDSP Flash confirmation isolation',()=>{
 it('hides the button and entire reasons box through the important CSS rule, then restores the upstream dialog',async()=>{
  const {dom,doc,get,click}=page();const reduce=get('btnSafetyAutoReduce') as HTMLButtonElement;
  const box=doc.querySelector<HTMLElement>('.safety-reasons-box')!;
  const original=get('modalSafetyWarning').innerHTML;
  const pending=confirmFreeDspReset('Flash?',doc,true);
  for(const node of [reduce,box]){
   expect(node.classList.contains('hidden')).toBe(true);
   const sheet=doc.styleSheets[doc.styleSheets.length-1];
   const rule=Array.from(sheet.cssRules).find(r=>'selectorText' in r&&(r as CSSStyleRule).selectorText==='.hidden') as CSSStyleRule;
   expect(rule.style.getPropertyValue('display')).toBe('none');expect(rule.style.getPropertyPriority('display')).toBe('important');
  }
  expect(dom.window.getComputedStyle(reduce).display).toBe('none');
  expect(dom.window.getComputedStyle(box).display).toBe('none');
  expect(reduce.hidden).toBe(true);expect(reduce.disabled).toBe(true);
  click('btnSafetyCancel');expect(await pending).toBe(false);
  expect(get('modalSafetyWarning').innerHTML).toBe(original);
  expect(dom.window.getComputedStyle(reduce).display).toBe('inline-flex');
  expect(dom.window.getComputedStyle(box).display).not.toBe('none');dom.window.close();
 });
 it.each(['btnSafetyAutoReduce','btnSafetyCancel','btnCloseSafetyModal','Escape'])('%s cancels, settles and unlocks without invoking writes or generic handlers',async action=>{
  const {dom,doc,get,click,acknowledge}=page();const gate=new FlashSaveGate(),save=vi.fn(),lock=vi.fn(),generic=vi.fn();
  get('btnSafetyAutoReduce').addEventListener('click',generic);
  const pending=gate.run({snapshot:()=> 'same',confirm:()=>confirmFreeDspReset('Flash?',doc,true),save,lock});
  expect(gate.busy).toBe(true);acknowledge(true);
  if(action==='Escape')doc.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));else click(action);
  await pending;expect(save).not.toHaveBeenCalled();expect(generic).not.toHaveBeenCalled();expect(gate.busy).toBe(false);expect(lock.mock.calls).toEqual([[true],[false]]);
  expect(get('modalSafetyWarning').classList.contains('hidden')).toBe(true);expect(doc.getElementById('freeDspFlashAcknowledgement')).toBeNull();expect((get('btnSafetyProceed') as HTMLButtonElement).disabled).toBe(false);dom.window.close();
 });
 it('Continue settles once; repeated opening and closing leaves upstream listeners and prior flags intact',async()=>{
  const {dom,doc,get,click,acknowledge}=page();const generic=vi.fn();get('btnSafetyAutoReduce').addEventListener('click',generic);
  for(let i=0;i<3;i++){
   const gate=new FlashSaveGate(),save=vi.fn(async()=> 'saved');
   const pending=gate.run({snapshot:()=> 'same',confirm:()=>confirmFreeDspReset('Flash?',doc,true),save,lock:()=>{}});
   expect((get('freeDspFlashAcknowledgement') as HTMLInputElement).checked).toBe(false);
   expect((get('btnSafetyProceed') as HTMLButtonElement).disabled).toBe(true);acknowledge(true);
   click('btnSafetyProceed');click('btnSafetyProceed');expect(await pending).toBe('saved');expect(save).toHaveBeenCalledTimes(1);expect(gate.busy).toBe(false);
  }
  click('btnSafetyAutoReduce');expect(generic).toHaveBeenCalledTimes(1);
  const reduce=get('btnSafetyAutoReduce') as HTMLButtonElement,box=doc.querySelector<HTMLElement>('.safety-reasons-box')!;
  reduce.classList.add('hidden');reduce.hidden=true;reduce.disabled=true;box.classList.add('hidden');
  const pending=confirmFreeDspReset('Flash?',doc,true);click('btnSafetyCancel');await pending;
  expect(reduce.hidden&&reduce.disabled&&reduce.classList.contains('hidden')&&box.classList.contains('hidden')).toBe(true);dom.window.close();
 });
 it('requires a fresh acknowledgement; uncheck disables Continue and synthetic clicks never bypass the gate',async()=>{
  const {dom,doc,get,click,acknowledge}=page();const gate=new FlashSaveGate(),save=vi.fn(async()=> 'saved'),generic=vi.fn();get('btnSafetyProceed').addEventListener('click',generic);
  const run=()=>gate.run({snapshot:()=> 'same',confirm:()=>confirmFreeDspReset('Flash?',doc,true),save,lock:()=>{}});
  let pending=run();const proceed=get('btnSafetyProceed') as HTMLButtonElement;
  expect((get('freeDspFlashAcknowledgement') as HTMLInputElement).checked).toBe(false);expect(get('freeDspFlashAcknowledgement').parentElement?.textContent).toBe('I have removed my earphones and lowered the volume.');expect(proceed.disabled).toBe(true);expect((get('btnSafetyCancel') as HTMLButtonElement).disabled).toBe(false);
  expect(await run()).toBeUndefined();click('btnSafetyProceed');await Promise.resolve();expect(save).not.toHaveBeenCalled();expect(gate.busy).toBe(true);expect(generic).not.toHaveBeenCalled();
  acknowledge(true);expect(proceed.disabled).toBe(false);acknowledge(false);expect(proceed.disabled).toBe(true);
  click('btnSafetyProceed');await Promise.resolve();expect(save).not.toHaveBeenCalled();
  acknowledge(true);click('btnSafetyCancel');await pending;expect(save).not.toHaveBeenCalled();expect(gate.busy).toBe(false);
  pending=run();expect((get('freeDspFlashAcknowledgement') as HTMLInputElement).checked).toBe(false);expect(proceed.disabled).toBe(true);
  acknowledge(true);click('btnSafetyProceed');expect(await pending).toBe('saved');expect(save).toHaveBeenCalledTimes(1);expect(gate.busy).toBe(false);dom.window.close();
 });
 it('restores prior button states and leaves ordinary FreeDSP Reset without an acknowledgement',async()=>{
  const {dom,doc,get,click}=page();const proceed=get('btnSafetyProceed') as HTMLButtonElement,cancel=get('btnSafetyCancel') as HTMLButtonElement;proceed.disabled=true;cancel.disabled=true;
  let pending=confirmFreeDspReset('Flash?',doc,true);expect(cancel.disabled).toBe(false);click('btnSafetyCancel');expect(await pending).toBe(false);expect(proceed.disabled).toBe(true);expect(cancel.disabled).toBe(true);
  proceed.disabled=false;cancel.disabled=false;pending=confirmFreeDspReset('Reset?',doc);expect(doc.getElementById('freeDspFlashAcknowledgement')).toBeNull();expect(proceed.disabled).toBe(false);click('btnSafetyProceed');expect(await pending).toBe(true);dom.window.close();
 });
 it('preserves the Flash timing and reported loud sound warning',()=>{
  expect(flashSafetyMessage).toContain('sudden loud sound');expect(flashSafetyMessage).toContain('10–20 seconds');
 });
 it('only the Flash call opts in; generic upstream handlers and markup remain unchanged',()=>{
  expect(main).toContain('confirmFreeDspReset(flashSafetyMessage,document,true)');
  expect(main).toContain('reduceGainsSafely');
  const {dom,get,click}=page();const generic=vi.fn();get('btnSafetyAutoReduce').addEventListener('click',generic);click('btnSafetyAutoReduce');expect(generic).toHaveBeenCalledTimes(1);dom.window.close();
 });
});
