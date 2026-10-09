# Controlled nine-band FreeDSP read-only comparison

Status: READY FOR CONTROLLED READ-ONLY VALIDATION. Full Device EQ Readback and CONNECT automatic loading remain BLOCKED.

## Fixed scope and stopping rules

Run `scripts/query-freedsp-nine-eq.ps1` once, without arguments. Exact35D8:1496 unique MI03 CAF usage0x0c/1, input/output62 and reportID1 gate is shared with the existing diagnostic. The opened handle is revalidated. The new operation is isolated from CONNECT and normal HTTP/write transport.

Fixed order: nine446 requests `[0,wire,0x11]`, wire1..9, then nine477 requests `[band,0x12]`, band1..9. These are the same byte-exact queries already collected/derived from SDK; no346, mode90,190,220, alternate paths, scanning or arbitrary arguments. Maximum18 SET attempts, exactlyone per request. 477 has no path/mode/bank argument; path0 applies ONLY to446. The second family supplies contemporaneous parameter evidence for the zero-gain question, not a claim to read Flash.

Each exchange has1s total budget including SET andGET,5ms interval/max201GET. Only structurally supported reply0 request echo/cleared payload continues GET-only. For446: pendingcount13,path0,slot0-or-requested,allotherwords0. For477: pendingcount13,firstword0-or-requestedband,allotherwords0. Other pending forms STOP conservatively; this does not prove them firmware-invalid. No SET retry. Reply1 must matchID1,prefix0,CTRL,command and exact logicalcount;446 requires path0/wire/count8,scaling0..25 and signed24container representation;477 requires matchingband/count6,knownrate4..8,positivefrequency/Q. Unknown477type/gain signedwords are preserved raw,not silently coerced or clamped. Representation guards are diagnostic acceptance boundaries,not new hardware limits.

Wrong command/module/path/wire/count,stale earlier-band reply,malformed data,disconnect,API failure,error or timeout stops the entire plan immediately. A synchronous Win32 call cannot be cancelled by the inner1s timer; owned child has45s outer deadline and Ctrl+C finallycleanup where PowerShell permits. No unrelated process is killed. A late reply is recorded but rejected. No subsequent query/rollback/restore.

## Capture outputs

Unique absolute directory normally `C:\Users\Henry\AppData\Local\Temp\AuraPEQ\nine-eq-<GUID>\` (actual path comes from Windows TEMP and is printed):
- `nine-eq.log`: auto-flushed rawhex/API/UTC/query-relative elapsed times,decoded coefficient words and477 fields.
- `nine-eq.json`: finalrecords,TX and everyRX Base64,perquerySET/GET counts/times/outcome/correlation,overallcompleteQuerySet flag. Nine446 rawwords are `[path,wire,scaling,B0,B1,B2,A0,A1]`; these names come from existing coefficient evidence,not an inverse Frequency/Q/Gain reconstruction. Signed24containers remain raw;no existing coefficient encoder changed.
- `nine-eq.partial.json`: incrementally saved query-tagged observations and completedrecords,alwaysINCOMPLETE/noPASS;use alongside log if interrupted/hard timeout. Each observation carriescommand/wire plusraw/timing/API/correlation. An API-failed buffer is unconfirmed.

A matching set is `MATCHING_QUERY_SET_SOURCE_FRESHNESS_UNVERIFIED`,nothardwareReadbackPASS. Same-command/path/wire stale frames cannot be excluded without a verified nonce. Path1/stereo,enabled/currentmode,currentrate of446 and physical RAM/Flash origin remainunknown. Queries are sequential,not an atomic snapshot. No editor reconstruction orinversecoefficients conversion.

## Controlled official App comparison — one read-only session

1. Keep the already-established nonflat device state. Record last RAM Apply/Restore/Flash/reconnect actions andtimes,known source profile/export andknownsample rate if available. Do NOT Apply/Restore/Save/reset/switchmode solely for this test. If no exactlast-appliedprofile/history exists,markitUNKNOWN;this limits source inference.
2. Beforequery,recordofficialAppnineindividualFrequency/Gain/Q/Type values andtime,notjustcurve. Do not press anyediting/Apply/Saveaction. CloseApp,devserver andotherCAF readers beforethequery. Record anyAppautoload/autowrite evidence;ifunknown,labelpossibleconfound.
3. Executeonce. Preservealloutputs. FirstfailuremeansSTOP,noautomaticrerun. Nohardwareoperation byCodex.
4. Afterdiagnosticexit,reopenAppwithoutediting,recordsame ninevalues/time andallinterveningactions. App launch/read mayitselfchange state;post-launchsnapshotisnotproof of query-timeRAM unlessthisconfound isexcluded.
5. Compareperwire446rawcoefficients againstlastknownRAMpacket snapshot usingexistingencoder/model OFFLINE andtheexactrecordedsamplerate,withsigned24container normalization only. Do not assume477rate is446'scurrentrate. Missingprofile/rate/historymeanscomparisonnotdecisive. Also compare477fields againstknownFlashmetadata/App values accountingforintegergain andQ/256 versusApp2decimalrounding.

## Interpretations and source discrimination

- Nonunity446 versuszeroGain477 in the same no-edit session strengthens distinct coefficient/parameter-store semantics;it doesnotalone prove446=RAM or477=Flash. Offsets/zeroGain alonecannotprove defaultbank,staleness orwrongmode.
- Exact446 match to a known recentRAMprofile,withstable recordedstate/rate anddifferentknownpersistentprofile, supports currentRAM interpretation. If active andpersistedprofiles are identical,agreement cannotdistinguishRAM fromFlash-loadedstate. Do not create a newdifference inthisread-onlyround.
- 477 match toknownsavedmetadata while446matchestheknownactiveprofile strengthens persistentmetadata interpretation. 477 maystillbeanotherbank/cache. OfficialgetEQParamsFromFlash names supportintent,notphysicalstorageproof;getEQMode346[90]wasanobservabilitystep,not a477bankargument/setter. This tooldeliberatelyomits346 tokeep18knownfixedreads;mode/rate certaintycannotbeclaimed.
- OfficialAppnonflatcurve alone isinsufficient;individualvalues,operationtimeline andlaunchsideeffects determinewhethercomparison ismeaningful. No claim of persistencefailure orrevision toverifiedRAM190/Flash220/power-cyclePASS.

## New hardware report and offline verification

Henry reports prior single-wiretoolSET1/GET1,446/path0/wire2/count8/reply1/nonunitycoefficients,MATCHING_FRAME_FRESHNESS_UNVERIFIED. This confirms one matchingwire2frame in thatsession. FirstGETsuccess does NOT validate GETpollingasfix for theearlierreply0. Rawnewcapture notsupplied/ingestedhere;provenance isHenry'sreport.

92native/offline/mocktestsPASS,including6newnine-plan groups:exact18queries/allowlist/order,noHTTPexposure;matchingrawcapture;pendingthenmatching/timeout;stale/wrongframeSTOP;477matching/pending;disconnect/SETfailure/exception/lateGET. ExistingWire2/RAM18/Flash56/mockregressionsPASS. Testbuildzeroerrors/warnings. PowerShellASTcheckPASS;actualhardwarelauncher NOT run. Fullreadback/CONNECT staysBLOCKED.
