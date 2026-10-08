import {describe,it,expect,vi} from 'vitest';
import {configureFreeDspControlNotes,freeDspControlEvidence} from '../../src/freedsp/controls.ts';
import proof from './fixtures/officialControlsEvidence.json';
import fnSource from '../../src/fn.ts?raw';
import mainSource from '../../src/main.ts?raw';
import {isFreeDsp} from '../../src/freedsp/webHid.ts';
import ts from 'typescript';
// @ts-expect-error Node VM is offline-test-only.
import {runInNewContext} from 'node:vm';
function extract(name:string,source=fnSource){
  const ast=ts.createSourceFile('source.ts',source,ts.ScriptTarget.ES2022,true);
  const node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name)!;
  return ts.transpileModule(node.getText(ast).replace('export ',''),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
}
class Element {
  hidden=true;disabled=false;checked=true;textContent='original';innerText='';value='';style={width:'80%'};
  attrs=new Map([['title','original title'],['data-i18n','original_key']]);
  classList={remove:vi.fn()};
  get title(){return this.attrs.get('title')??'';}set title(v:string){this.attrs.set('title',v);}
  getAttribute(key:string){return this.attrs.get(key)??null;}
  setAttribute(key:string,value:string){this.attrs.set(key,value);}
  removeAttribute(key:string){this.attrs.delete(key);}
}
describe('M2T evidence and exact-FreeDSP UI, offline only',()=>{
  it('pinned inventory covers both DEX files and does not establish a gain/mic/balance command',()=>{
    expect(proof.apkSha256).toBe('04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5');
    expect(proof.dexes.map(d=>[d.file,d.conexantClasses])).toEqual([['classes.dex',153],['classes2.dex',0]]);
    expect(proof.controlNameMethods.map(m=>m.method).sort()).toEqual(['convertGainIndex','convertGainIndex','convertIndexToDBGain','formatBandGainValue','getOriginalGainValue'].sort());
    expect(proof.methodInstructions.find(m=>m.method==='getFeatureConfigFM3')?.instructions.some(i=>i.args.includes('mIsDongleLRDetect'))).toBe(true);
    expect(proof.limitations).toContain('does not prove no hardware support');
    expect(proof.gainConversionCallers.map(c=>c.method)).toEqual(['convertGainIndex']);
    expect(proof.nativeLibraries.flatMap(l=>l.gainConversionFunctions).some(f=>f.instructions.length>0)).toBe(true);
    expect(freeDspControlEvidence.preamp.status).toBe('UNKNOWN');
  });
  it('disables unsupported controls, explains why, clears auto checkbox; restores other-DAC labels/titles',()=>{
    const ids=['freeDspControlNote','globalGainSlider','checkAutoPreamp','sliderBalance','slideBassTilt','slideTrebleTilt','toggleMicMonitor','sliderMicGain','preampStepIndicator','micMonitorStatus'];
    const nodes=new Map(ids.map(id=>[id,new Element()]));
    const doc={getElementById:(id:string)=>nodes.get(id)??null} as unknown as Document;
    configureFreeDspControlNotes(true,doc);configureFreeDspControlNotes(true,doc);
    expect(nodes.get('freeDspControlNote')!.hidden).toBe(false);
    for(const id of ids.slice(1,8)){expect(nodes.get(id)!.disabled).toBe(true);expect(nodes.get(id)!.title).toContain('FreeDSP');}
    expect(nodes.get('checkAutoPreamp')!.checked).toBe(false);
    expect(nodes.get('preampStepIndicator')!.textContent).toContain('UNKNOWN');
    configureFreeDspControlNotes(false,doc);
    expect(nodes.get('freeDspControlNote')!.hidden).toBe(true);
    expect(nodes.get('globalGainSlider')!.title).toBe('original title');
    expect(nodes.get('micMonitorStatus')!.textContent).toBe('original');
    expect(nodes.get('micMonitorStatus')!.getAttribute('data-i18n')).toBe('original_key');
  });
  it('late saved Auto Preamp initialization cannot re-enable FreeDSP or overwrite generic preferences',async()=>{
    const ctx={device:{vendorId:0x35d8,productId:0x1496},isFreeDsp,autoPreampEnabled:true,document:{getElementById:()=>new Element()},log:vi.fn(),localStorage:{setItem:vi.fn()},recalculateAutoPreamp:vi.fn(),updateGlobalGain:vi.fn()};
    await runInNewContext(extract('toggleAutoPreamp')+'\ntoggleAutoPreamp(true,true)',ctx);
    expect(ctx.autoPreampEnabled).toBe(false);expect(ctx.recalculateAutoPreamp).not.toHaveBeenCalled();expect(ctx.updateGlobalGain).not.toHaveBeenCalled();expect(ctx.localStorage.setItem).not.toHaveBeenCalled();
  });
  it('other DAC keeps Auto Preamp calculation/application semantics',async()=>{
    const ctx={device:{vendorId:1,productId:1},isFreeDsp,autoPreampEnabled:false,globalGainState:-2,manualPreampState:0,document:{getElementById:()=>new Element()},localStorage:{setItem:vi.fn()},recalculateAutoPreamp:vi.fn()};
    await runInNewContext(extract('toggleAutoPreamp')+'\ntoggleAutoPreamp(true,false)',ctx);
    expect(ctx.autoPreampEnabled).toBe(true);expect(ctx.recalculateAutoPreamp).toHaveBeenCalledWith(false);
  });
  it('FreeDSP connection resets displayed preamp and Tilt locally and stops fake mic animation',()=>{
    const ctx={showFreeDspDeviceState:vi.fn(),configureFreeDspControlNotes:vi.fn(),document:{getElementById:()=>null,querySelectorAll:()=>[]},setAutoPreampEnabled:vi.fn(),setGlobalGainState:vi.fn(),resetTiltState:vi.fn(),updateGlobalGainUI:vi.fn(),window:{stopFreeDspMicDisplay:vi.fn()}};
    runInNewContext(extract('configureFreeDspUI')+'\nconfigureFreeDspUI(true)',ctx);
    expect(ctx.resetTiltState).toHaveBeenCalledOnce();expect(ctx.updateGlobalGainUI).toHaveBeenCalledWith(0);expect(ctx.window.stopFreeDspMicDisplay).toHaveBeenCalledOnce();
  });
  it('FreeDSP mic animation guard cancels existing animation, clears both meters and never schedules random levels',()=>{
    const ctx={getDevice:()=>({vendorId:0x35d8,productId:0x1496}),isFreeDsp,micMeterAnimationId:42,toggleMicMonitor:new Element(),meterL:new Element(),meterR:new Element(),micMonitorStatus:new Element(),cancelAnimationFrame:vi.fn(),requestAnimationFrame:vi.fn()};
    runInNewContext(extract('stopFreeDspMicDisplay',mainSource)+extract('animateMicMeters',mainSource)+'\nanimateMicMeters()',ctx);
    expect(ctx.cancelAnimationFrame).toHaveBeenCalledWith(42);expect(ctx.micMeterAnimationId).toBeNull();expect(ctx.toggleMicMonitor.checked).toBe(false);expect(ctx.meterL.style.width).toBe('0%');expect(ctx.meterR.style.width).toBe('0%');expect(ctx.requestAnimationFrame).not.toHaveBeenCalled();
  });
  it('other-DAC mic animation remains unchanged',()=>{
    const ctx={getDevice:()=>({vendorId:1,productId:1}),isFreeDsp,micMeterAnimationId:null,toggleMicMonitor:new Element(),meterL:new Element(),meterR:new Element(),requestAnimationFrame:vi.fn(()=>7)};
    runInNewContext(extract('animateMicMeters',mainSource)+'\nanimateMicMeters()',ctx);
    expect(ctx.requestAnimationFrame).toHaveBeenCalledOnce();expect(ctx.micMeterAnimationId).toBe(7);
  });
  it('actual Tilt input handler returns before modifying bands, recalculating preamp or scheduling writes',async()=>{
    const start=mainSource.indexOf('const updateTiltUI = async');const end=mainSource.indexOf('\n\tslideBassTilt.addEventListener',start);
    const ctx={isFreeDsp,getDevice:()=>({vendorId:0x35d8,productId:0x1496}),log:vi.fn(),window:{resetTiltState:vi.fn(),queueRealtimeAllBandsWrite:vi.fn(),setBassTiltState:vi.fn()},renderUI:vi.fn()};
    await runInNewContext(ts.transpileModule(mainSource.slice(start,end)+'\nupdateTiltUI()',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,ctx);
    expect(ctx.window.resetTiltState).toHaveBeenCalledOnce();expect(ctx.window.queueRealtimeAllBandsWrite).not.toHaveBeenCalled();expect(ctx.window.setBassTiltState).not.toHaveBeenCalled();expect(ctx.renderUI).not.toHaveBeenCalled();
  });
});
