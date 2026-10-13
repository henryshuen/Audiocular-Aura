// Reuse the existing safety dialog. No browser-native dialogs or hardware operations.
export function confirmFreeDspReset(message:string,doc:Document=document,flash=false):Promise<boolean>{
 const modal=doc.getElementById('modalSafetyWarning');
 const proceed=doc.getElementById('btnSafetyProceed');
 const cancel=doc.getElementById('btnSafetyCancel');
 const close=doc.getElementById('btnCloseSafetyModal');
 const reduce=doc.getElementById('btnSafetyAutoReduce');
 const title=modal?.querySelector('.modal-title');
 const desc=modal?.querySelector('.modal-desc');
 const reasons=doc.getElementById('safetyWarningReasons');
 if(!modal||!proceed||!cancel||!close||!reduce||!title||!desc||!reasons||!modal.classList.contains('hidden'))return Promise.resolve(false);
 const reasonsBox=flash?modal.querySelector<HTMLElement>('.safety-reasons-box'):null;
 if(flash&&!reasonsBox)return Promise.resolve(false);
 return new Promise(resolve=>{
  const oldTitle=title.textContent,oldDesc=desc.textContent,oldProceed=proceed.textContent,oldReasons=reasons.innerHTML,oldHidden=reduce.hidden;
  const oldReduceClass=reduce.classList.contains('hidden'),oldDisabled=(reduce as HTMLButtonElement).disabled,oldBoxClass=reasonsBox?.classList.contains('hidden');
  const oldProceedDisabled=(proceed as HTMLButtonElement).disabled,oldCancelDisabled=(cancel as HTMLButtonElement).disabled;
  let acknowledgement:HTMLInputElement|null=null,acknowledgementLabel:HTMLLabelElement|null=null;
  const updateAcknowledgement=()=>{(proceed as HTMLButtonElement).disabled=!acknowledgement?.checked;};
  let finished=false;
  if(flash){reduce.classList.add('hidden');(reduce as HTMLButtonElement).disabled=true;reasonsBox!.classList.add('hidden');}
  title.textContent='FreeDSP Confirmation';desc.textContent=message;proceed.textContent='Continue';reasons.innerHTML='';reduce.hidden=true;
  if(flash){
   acknowledgement=doc.createElement('input');acknowledgement.type='checkbox';acknowledgement.id='freeDspFlashAcknowledgement';acknowledgement.checked=false;
   acknowledgementLabel=doc.createElement('label');acknowledgementLabel.htmlFor=acknowledgement.id;
   acknowledgementLabel.style.cssText='display:flex;align-items:flex-start;gap:10px;margin-top:15px;cursor:pointer';
   acknowledgementLabel.append(acknowledgement,doc.createTextNode('I have removed my earphones and lowered the volume.'));
   desc.insertAdjacentElement('afterend',acknowledgementLabel);
   acknowledgement.addEventListener('change',updateAcknowledgement);updateAcknowledgement();(cancel as HTMLButtonElement).disabled=false;
  }
  const finish=(ok:boolean)=>{if(finished)return;finished=true;modal.classList.add('hidden');title.textContent=oldTitle;desc.textContent=oldDesc;proceed.textContent=oldProceed;reasons.innerHTML=oldReasons;reduce.hidden=oldHidden;
   if(flash){acknowledgement?.removeEventListener('change',updateAcknowledgement);acknowledgementLabel?.remove();(proceed as HTMLButtonElement).disabled=oldProceedDisabled;(cancel as HTMLButtonElement).disabled=oldCancelDisabled;if(!oldReduceClass)reduce.classList.remove('hidden');(reduce as HTMLButtonElement).disabled=oldDisabled;if(!oldBoxClass)reasonsBox!.classList.remove('hidden');}
   for(const [node,handler] of bindings)node.removeEventListener('click',handler,{capture:true});doc.removeEventListener('keydown',key,{capture:true});resolve(ok);};
  const yes=(e:Event)=>{e.stopImmediatePropagation();if(flash&&!acknowledgement?.checked)return;finish(true);},no=(e:Event)=>{e.stopImmediatePropagation();finish(false);};
  const bindings:Array<[HTMLElement,EventListener]>=[[proceed,yes],[cancel,no],[close,no]];
  if(flash)bindings.push([reduce,no]);
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.stopImmediatePropagation();finish(false);}};
  for(const [node,handler] of bindings)node.addEventListener('click',handler,true);doc.addEventListener('keydown',key,true);modal.classList.remove('hidden');
 });
}
