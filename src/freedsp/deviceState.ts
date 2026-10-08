// No verified complete readback. Local profiles must never stand in for device EQ.
export const freeDspUnknown='Device EQ Unknown — Local Editor';
export const freeDspStale='Device EQ Stale / Offline — Local Editor';
export const freeDspOverwriteWarning='Device EQ Unknown — Local Editor：裝置現有EQ未讀回。此操作會覆寫裝置設定，本地曲線不是裝置備份。';
export function showFreeDspDeviceState(connected:boolean,doc:Document=document){
 const display=doc.getElementById('lastAppliedEqDisplay');
 if(display)display.textContent=connected?freeDspUnknown:freeDspStale;
 const status=doc.getElementById('freeDspRamStatus');
 if(status){status.hidden=false;status.textContent=connected?freeDspUnknown:freeDspStale;}
}
