// No verified complete readback. Local profiles must never stand in for device EQ.
export const freeDspUnknown='Device EQ Unknown — Local Editor';
export const freeDspStale='Device EQ Stale / Offline — Local Editor';
export const freeDspOverwriteWarning='Active RAM state is unverified. This action overwrites device settings. The local editor and readback-derived slots are not an exact hardware backup.';
export function showFreeDspDeviceState(connected:boolean,doc:Document=document){
 const display=doc.getElementById('lastAppliedEqDisplay');
 if(display)display.textContent=connected?freeDspUnknown:freeDspStale;
 const status=doc.getElementById('freeDspRamStatus');
 if(status){status.hidden=false;status.textContent=connected?freeDspUnknown:freeDspStale;}
}
