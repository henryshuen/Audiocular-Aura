// Normal Aura device dispatch: FreeDSP native capability exception, all other DACs keep WebHID.
import {isCafDevice} from './webHid.ts';
import {NativeCafTransport} from './nativeTransport.ts';
import {CafRamSession} from './cafRam.ts';
const sessions=new WeakMap<HIDDevice,CafRamSession>();
export async function connectFreeDsp(device:HIDDevice,log:(s:string)=>void){
 if(!isCafDevice(device))throw new Error('FreeDSP CAF descriptor mismatch');
 // The chooser identifies the target; release any browser handle before native SET/GET ownership.
 if(device.opened)await device.close();
 const transport=new NativeCafTransport(log);
 try{await transport.connect();sessions.get(device)?.dispose();sessions.set(device,new CafRamSession(transport,log));}catch(e){transport.dispose();throw e;}
}
export function getFreeDspSession(device:HIDDevice){const s=sessions.get(device);if(!s)throw new Error('FreeDSP native session未連線；請重新用CONNECT DAC。');return s;}
export function disconnectFreeDsp(device:HIDDevice){sessions.get(device)?.dispose();sessions.delete(device);}
