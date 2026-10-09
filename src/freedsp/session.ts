// Normal Aura device dispatch: FreeDSP native capability exception, all other DACs keep WebHID.
import {isCafDevice} from './webHid.ts';
import {NativeCafTransport} from './nativeTransport.ts';
import {CafRamSession} from './cafRam.ts';
const sessions=new WeakMap<HIDDevice,CafRamSession>();
const pending=new WeakMap<HIDDevice,NativeCafTransport>();
const versions=new WeakMap<HIDDevice,number>();
let serial=0;
export async function connectFreeDsp(device:HIDDevice,log:(s:string)=>void){
 if(!isCafDevice(device))throw new Error('FreeDSP CAF descriptor mismatch');
 const version=++serial;versions.set(device,version);
 pending.get(device)?.dispose();sessions.get(device)?.dispose();sessions.delete(device);
 // The chooser identifies the target; release any browser handle before native SET/GET ownership.
 if(device.opened)await device.close();
 if(versions.get(device)!==version)throw new Error('Stale FreeDSP CONNECT response ignored');
 const transport=new NativeCafTransport(log);
 pending.set(device,transport);
 try{
   await transport.connect();
   if(versions.get(device)!==version)throw new Error('Stale FreeDSP CONNECT response ignored');
   const session=new CafRamSession(transport,log);sessions.set(device,session);return session;
 }catch(e){transport.dispose();throw e;}finally{if(pending.get(device)===transport)pending.delete(device);}
}
export function getFreeDspSession(device:HIDDevice){const s=sessions.get(device);if(!s)throw new Error('FreeDSP native session unavailable; reconnect with CONNECT DAC.');return s;}
export function disconnectFreeDsp(device:HIDDevice){versions.set(device,++serial);pending.get(device)?.dispose();pending.delete(device);sessions.get(device)?.dispose();sessions.delete(device);}
