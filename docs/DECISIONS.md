## 2026-10-09 — Accepted workflow, final labels and RC/PR boundary
Preserve Henry's accepted 05a8368 readback/OFF/A/B workflow without new controls, graph or architecture. FreeDSP labels reflect local editor/snapshot rather than last applied hardware. Nonzero-band count is local; rate/firmware remain Unknown when not actually tracked. FreeDSP generic preamp Level Matched is suppressed. Imported preamp is explicitly ignored for FreeDSP only; no headroom emulation and no accidental Sync claim.
Use English for all introduced FreeDSP dialogs/tooltips/messages. Remove obsolete development claims and raw command/test-phase explanations from production action copy, while retaining maintainer diagnostic logs/fixtures/scripts. Hardware persistence is an existing Henry-reported PASS; a future Save ACK is not independent per-operation persistence/readback proof. Add generation guard only to stale Flash UI status; no serializer/transport changes.
Henry now explicitly requires final Reset To Flat to preserve frequency/Q/type/local enabled flags while zeroing nine gains. This supersedes earlier nine-x1kHz roadmap instructions; Defaults remains31/62/125/250/500/1000/2000/4000/8000Hz/Q0.7/PK/on. Resets remain confirmed RAM writes, not Flash saves.
Native helper is necessary and verified for the Windows localhost workflow. Current origin gate is localhost5173 only. No installer/bundled helper exists in static dist; upstream GitHub Pages/defaultpreview4173 cannot use the helper. Keep security policy unchanged; mark upstream PR submission readiness BLOCKED pending maintainer-approved installation/distribution and deployment/origin design. Prepare draft only, do not create PR/release. Unknown exact readback fields remain declared limitations, not newly asserted hardware support.

## 2026-10-09 — Final readback UX / upstream compatibility
Decision: reuse existing curve and OFF/A/B, remove the duplicate readback card and main-page debug link. Keep strict fixed readonly capture and all verified write algorithms unchanged.
Initial curve uses actual path0 coefficient projection at metadata rate, without fabricated editable enabled data. First A/B requires existing window.confirm with source/precision/stereo caveats, explicit local ON assumption and unsaved-editor warning. Cancel mutates nothing. Confirmed A is an approximate metadata reconstruction (nine PK bands, integer Gain, exact Q raw/256), not exact device state. B copies A. A edits automatically start B instead of replacing the baseline. OFF returns preserved normal local editor without clearing either slot. Readback failure cannot create a baseline; an established A/B remains usable locally. Reconnect never overwrites baseline or unsaved B and new snapshot can be viewed separately.
No realtime FreeDSP edit writes; switching/import/undo edits local state. Deliberate existing Sync RAM, Save Flash, confirmed reset and Restore actions remain explicit hardware operations. Other DAC A/B/reset/transport semantics unchanged. Snapshots are page-session local, no hardware backup/persistence claim. New FreeDSP copy English only. Hardware enabled/source/freshness/path1 and original fractional Gain remain unresolved; full precision readback BLOCKED. This round adds no hardware evidence.


### Localhost smoke — Round1
- dev.ps1 running: Vite at http://localhost:5173/ andnativehelper127.0.0.1:5174. BrowsernavigationAccept:text/html rootHTTP200,previewmountpresent,fn/readbackPreview/nativeTransportmodulesHTTP200;sessionM2S CAF TRANSPORT/tokenshapePASS. NoGUIbrowserautomation;visualmanualconfirmationpendingHenry.
- An initialPowerShellHTTPrequestwithoutAcceptreturnedVite404;browsernavigationheaderverified200,notanapplicationroutingdefect. NoViteconfigurationchange.

### Final verification — Readback Round1
- Focused6files/65tests PASS; finalverify.ps1 PASS:TypeScript/productionbuild and31files/305tests. Nativeisolatedbuild zeroerrors/warnings;93offline/mocktestsPASSincludingfixedread-onlyHTTPtoken/BUSYgatesandexistingRAM18/Flash56goldens.
- Actualauthenticated/session/connect/readback physical chain PASS with18matchingframes. No190/220/mode/resetwrites. Exactnine-bandvalues replayvalidatedfromthreeactualcaptures;34648kHz confirmed separately.
- PowerShellsandbox initiallyblockedVitestTEMPrename andmockHTTPsockets;rancheckswithordinaryuser sandboxescape,noadministrator/ACLchange. Generateddist restoredtoHEAD because not a release;onlyown temporarytestbuild removed. gitdiffcheckPASS.
## Readback Round 1 — automatic truthful preview (2026-10-09)

### Problem / hypothesis / next action
Observed problem: normalCONNECT showed only local flat/editor values; older parser rejected negative477 gain in zero-extended24 containers; complete source/precision/enabled reconstruction was blocked.
Verified facts: Henrycapture and two Codex read-onlycaptures all18matching446/477 frames,byte-identical.477Hz220/750/1250/2000/3000/4000/6300/60/4500;Gain-1/+1/-2/-1/-2/-2/+1/-7/0;Qraw256/460/640/256/512/512/1280/102/256,divide256;PK0/rate5. SDKuses signedbyteGain parser; all45coefficientwords matchparameter model withinnativequantizationneighbors. One346query confirmed48kHz. Band4matches-1,not-1.5.
Possible causes: earlierflat477 maydifferentprofile/session/custom bank; notenoughhistoryforstaleness. SDKsaved-profile getterintentknown,physicalRAM/Flash/bank/freshness/path1 unconfirmed.
Ruled out / weakened: negative477 meanshugepositiveGain; 477alwaysflat; wire2unsupported; metadata/coefficientmismatch inthisstate; firstGETsuccessprovespollingrepair; capturecontainsoriginalfractionalGain/enabled flag.
Next validation: Henryopenslocalhost/normalCONNECT toverify nineparameterrowsandnonflatread-onlycoefficientprojection,localeditorseparate,noSync/Save. AtmostonefurtherRound2withsynchronizedAppninevalues/exactexistingRAM/Flashhistory andonefixedreadonlycapture;do not manufacture a statecontrast withunauthorizedwrites.
Possible fix direction: shipautomaticverifiedparameter/coefficientsPREVIEW now; neverclaimActiveRAM/source orreplaceeditorwithinventedenabled/fractionalGain. Fullprecisiondevice-editorreadbackandPRgate remainBLOCKED,automaticread-onlypreview isREADY. See tests/freedsp/fixtures/freeDspReadbackRound1.md.

### Research checkpoint
- ExaminedexistingSDKgetters/CommonUtil,signed containers,threeactualcaptures,normalCONNECT/nativehelper gates. No repeatedprotocolresearch.
- Codex37knownquerySETs total thisround:18standalone446/477 +1rate346 +18viaauthenticated/readback. Allreadonly,no190/220/mode/reset. ExistingRAM/Flashalgorithms untouched;noGUI/PR/release.
- Addedfixedauthenticated/readback endpoint reusingexistingpollNineEq,strictall18browservalidation,atomicread-onlycurve/table,sessionBUSY/dispose/connectiongeneration guards. Preservelocaleditor/presets/A-B andunknownfallback;hidepreviewondisconnect. Snapshotnotlivemonitoring.
- Hypotheses:SDKsaved/custommetadata mirrorspersistedprofile;446couldactivecopy. Neitherphysicalsourceproven. Missingoriginalfractionalmetadata/enabled/path1/nonce unresolved,notfabricated.
- Discarded:signed32-onlynegativeGain,automaticpartialEditorreplace,coefficientscalingwordasEQGain,knownSDKgetternamealoneprovesFlashorigin.
- Nexttarget: UIpreviewmanualconfirmation;onlyoneadditionalnarrowroundifexactsource/editoracceptance remainsrequired.

## Evidence for upstream / Issue #3 — Readback Round1
ExactFreeDSPquery446path0wire1..9 and477band1..9 nowthreeconsistenthardwarecaptures/all18matchingframes;Codexrate346index5=48kHz. NativeCAFonly/fixedread-onlycapture/noSETretry/firstfailureSTOP. Rawnegative477Gain00FFFFFF/00FFFFFE/00FFFFF9 requires signedcontainerdecodingconsistentwithSDKCommonUtil signedJava-byte getter atoffset30. Qraw/256;GainintegerdB,enabledabsent. Allnine446coefficientsets agree with477PKparams withinnative1LSBquantization;Band4-1vsApphistorical-1.5notcontemporaneous. OfficialgetEQParamsFromFlash chain provesSDKsavedprofileintent,notphysicalsource/currentRAM. ForknormalCONNECTnowautomaticallyshowsseparateread-onlyninebandparameter/curvepreview,strictcompletevalidation,noeditor/preset/A-Boverwrite/no190/220/modewrites. Clearonoffline/race;Unknownfallback. Source/freshness/stereo/fullfractional reconstructionBLOCKED;noPR/release.

### Scope / regression check
- FreeDSP files:readbackdecoder/newpreview,nativeadapterandread-onlysessionmethod;isolatedhelper/readback endpoint,diagnosticGainlogfix.
- Shared files:index.htmlonehiddenpreviewsection,src/fn.ts exactFreeDSPCONNECT/disconnectguards only. OtherDACprotocolimplementations unchanged.
- Non-FreeDSP protocol code changed:NO. RAM190/Flash220packetmath/order unchanged;existingregressions retained.
- Hardwareoperations:knownread-only446/477/346queries underHenry'sexplicitRound1authorizationonly;zeroEQ/mode/Flash/resetwrites.


## Controlled nine-band read-only comparison (2026-10-09)

### Research checkpoint
- Examined existingWire2Polling/Caf346/ReadbackQuery,actual earliercapture,477SDKfield assignments andfixedquerybytes;no protocol re-research.
- Henry reportsWire2SET1/GET1/reply1/count8/nonunity,matching446/path0/wire2. FirstGETsuccess doesnotproveboundedpolling repairedtheearlierreply0;newrawcapture not supplied here.
- Addedisolated pollNineEq / scripts/query-freedsp-nine-eq.ps1:446path0wire1..9 then477band1..9,max18SET,oneeach,strictmatching1sGET-onlywaiting/5ms,firstfailureSTOP. ExactFreeDSPCAFgate/scopedallowlist;no346/mode/190/220/reset/path1/scan/editorloading. ExistingWire2entryremainsfixedwire2;normaltransport/writesunchanged.
- Verifiedoffline:92native/mocktestsPASS,6newnine-plan groups,zero-warningtestbuild,PowerShellAST anddiffcheckPASS. Sandboxsocketrestriction requiredlocalhostmocktestoutside sandbox;fakechildonly,noHID/deviceaccess. Nohardwarequery executed byCodex.
- Hypotheses:446activecoefficients versus477persistent/default/custommetadata;neitherstoreproven. Same-tuplefreshness,currentrate/enabled/mode/stereoandatomicityunresolved.
- Discarded:singleWire2successprovespollingfix;477zeroGainmeansFlashbroken;matchingpacketprovescurrentRAM;Appcurvewithouttimelineisdecisive.
- Nexttarget:onecontrolledread-onlysessionwithAppindividualninevalues/timestamps,lastknownprofile/rate/actionhistory;fullguide tests/freedsp/fixtures/freeDspNineReadbackPolling.md. Do not manufacture RAM/Flashdifferencewithwrites thisround.

### Problem / hypothesis / next action
Observed problem:477 previouslyallzeroGainwhilelaterAppnonflat;firstcapture446incomplete. Wire2nowmatched once butfullninecoefficients/sourcecross-checkabsent.
Verified facts:existing477logicalfieldsrate/band/frequency/Q256/type/gain;existing446eightwords/path/wire/scaling/fivecoefficients. Newfixed18-querytoolrecordsallrawbuffers/time/correlationandsourcesUNKNOWN,partial/finalJSON.
Possible causes:distinctmetadata/activecoefficientstores,otherbank/cache,Appstate/timing/launchwrites;pending446 remainspossible,notconfirmedpollingrepair.
Ruled out / weakened:generalwire2unsupported weakenedbyHenry'snewmatch;noautomaticRAM/Flashsource/freshnessinference. Wrong/staleotherbandreplySTOP offlineverified.
Next validation:Henryrunsquery-freedsp-nine-eq.ps1once,read-only,nootherreaders/noedits;preservelog/JSONandbefore/afterAppvalues/actiontimeline. CompareagainstexistingknownRAMsnapshotandFlashmetadataofflineonly. Unknownrate/history oridenticalactive/persistentprofileslimitsdiscrimination.
Possible fix direction:onlyafterphysicalcross-validationconsiderreadbacksource/activationmodel;do notmodifyverifiedRAM190/Flash220orproductionCONNECT. CompleteReadbackandCONNECTauto-loadremainBLOCKED.

## Evidence for upstream / Issue #3 — controlled nine-band increment
Henry reports446path0wire2matchingnonunityframeSET1/GET1;thisdoesnotdemonstrateGETpollingrepair orfreshness. Forkaddsopt-infixednine446then nine477capture,max18one-shotSETs,strictreply/CTRL/command/path/wire/count/formatmatching,SDK-styleboundedGET-onlypendingwait,noSETresend;firstfailurestopsplan. Exact35D8:1496CAFonly. RawTX/RX,UTC/elapsed/API/correlation,allcoefficients/metadataretained;RAM/Flashsource/freshness/stereo/enabledstillUNKNOWN. Official477getterpersistentintentisnotfirmwarestorageproof. ComparewithAppindividualvaluesandrecordedlastknownRAM/Flashprofile/rate/history,avoidApplaunchwriteconfound. NohardwareaccessbyCodex/noPR/release;fullReadback/automaticCONNECTBLOCKED.

### Scope / regression check
- FreeDSP-specific files changed:isolatedNineReadbackPolling,read-onlyWire2pollingreuse,newPowerShelllauncher;nativeCLIregistrationonly.
- Analysis/testfiles changed:native6mockgroups,manualcaptureguide;GENERAL/ROADMAP/DECISIONS/DONEupdated.
- Sharedproductionfrontend/runtimefiles changed:NONE. Native productionCONNECT/HTTPtransport/CAFparser/RAM190/Flash220unchanged.
- Non-FreeDSPprotocolcodechanged:NO. READY FOR CONTROLLED READ-ONLY VALIDATION,notReadbackPASS.

## 2026-10-09 — Isolate single446 wire2 GET-only polling
- Offlinevalidation:86native/mock tests,isolatedbuild,PowerShellAST/partialJSONroundtrip anddiffcheck PASS. NoCodexhardwareaccess.
- Implement poll446Wire2 / scripts/query-freedsp-446-wire2.ps1 separatelyfromold19querydiagnosticandnormalCAFHTTPtransport. Exactdevicegate/scopedbyte-equal446[path0,wire2] allowlist,no arbitraryarguments orothercommands. Normaloperationbranches unchanged.
- Classifyonlyknownreply0 count13/path0/slot0-or2/zeroremainingpayload aspending. Do notparseitaseffect/coefficients. Reply1requirespath0/wire2/count8/supportedscaling0..25/signed24containers;conservativevalidationboundsarenotfirmwarelimits. Anywrongframe/error/disconnect STOP,noGETcontinuationexceptpending,noSETretry.
- Deadline1s includesSET andGET,5ms wait/max201GET;latecompletedreplyrecordedbutrejected. ExistinguncancellableWin32callhasownedlauncher30s limit. AutoFlushedlog andstreamedpartialobservations/finalJSON retainraw/timing/API/correlationevidence.
- Exit0/matchingframe doesnotprovefreshnessorDeviceEQsource. RecoveredCAFhasnoverifiednonce;samepath/wire stale replycannotbeuniquelydistinguished. Reportthisexplicitly;fullReadback/automaticCONNECT/deviceA-BstillBLOCKED.
- Henry invokesonceafterclosingotherreadersandrecordingknownEQ/history. NoCodexhardwareexecution,noApp/Editorupdate,mode/EQ/Flash/resetoperations. See tests/freedsp/fixtures/freeDspWire2Polling.md.

## 2026-10-09 — Henry first physical readback analysis
- Validation:297TS/Vitest tests,79native mocktests anddiffcheck PASS;onlyoffline/test/docs changes,fullReadbackBLOCKED.
- Save hash-provenanced capture JSON andTX/RX-preserving instance-path-redacted log;retain failed446 raw RX from log because original JSON storesrx:null. Offline analyzer cross-checks both andseparates actual/synthetic cases.
- Confirmed physical rows:477 all9 reply1/count6/band echo,Hz60/120/260/530/1100/2260/4680/9680/20000,Qraw180,type0,gain0,rateRaw5. New primary CommonUtil.formatDecimal is2decimal HALF_UP,soQ0.703125→0.70. These are returned field values,not full current/stereo Device EQ HARDWARE PASS.
- Confirmed446wire1 unity;failedwire2 reply0/count13/allzero payload differs fromcurrentTX onlybyte14(slot2→0),not equal toanylogged earlierTX/RX. Exactecho/previousrecordedreply replay excluded;pending/cached/short transfer/unknownstale/concurrent-reader/slot-specific causes unresolved.
- Official SDK waits for replybit1 with GET-only polling;currentdiagnostic aborts first invalidCAF,whileexisting normaltransport has its own boundedpolling. Native mock reproduces first-failure STOP. Leave allruntime unchanged;simulate prospective GET-only waiting offline withstrictguards,notSDK'sweakmatching.
- 477 SDKpersistent/custommetadata versus446 activecoefficients remains leading sourcehypothesis. SDKqueries savedmode346[90] before477 butdoesnotpassmode/bank orissueanysetter;missingmodequery isobservabilitygap,notpermissiontoselectmode. NoFlashfailure/persistence regressionclaim.
- Henry reports nonflat savedstate/later09:37Appscreenshot,butinterveningoperationhistoryincomplete. No synchronized mismatch proof orstaleness conclusion. Nextminimaltest proposal:knownnonflat/recordedhistory,single446wire2SET,boundedGET-only;thencontrolledmode/rate/477comparison,noedits/writes. Notimplementedorrunthisround.
- Automatic CONNECT / device-derived immutableA/editableB stillBLOCKED. See tests/freedsp/fixtures/freeDspReadbackCaptureAnalysis.md.

## 2026-10-09 — Device EQ readback is a required acceptance gate
- Henry requires exact-device complete nine-band readback before upstream PR/release, unless he explicitly revises this gate. Existing RAM/Flash/persistence and latest gain/reset/reconnect hardware results remain Henry-reported PASS; they do not prove our getters.
- Pinned official APK primary DEX confirms Flutter getEQParamsFromFlash→477 nine metadata fields and446 path0 coefficient getter. Q477 is /256; supersedes older derived Q*100 note. Gain metadata is integer dB; coefficient Gain is scaling exponent. SDK persistent getter naming is evidence of intent, not verified firmware provenance.
- Do not copy generic getEQParam first-connect initialization: it can issue unity190. Isolate only known fixed346[62],477[1..9],446[0,1..9] queries in opt-in readEqEvidence CLI, separate from existing HTTP transport and CONNECT. No mode/enable/reset/EQ writes or arbitrary scans. No Codex device access.
- Full editor readback and immutable device Slot A / editable copy B are BLOCKED: enabled/source/stereo/freshness are unresolved. Preserve Unknown/local editor and existing race guards. Do not promote synthetic fixture or native inverse output to original Device EQ. Unity inversion is nonunique.
- FreeDSP graph defaults−20..+9, expands to sampled active/comparison response, explicitly warns nonfinite response. This supersedes symmetric±18 display decision; editing policy−16..+6 and filter mathematics unchanged. Generic graph unchanged.
- See tests/freedsp/fixtures/freeDspReadbackEvidence.md for field matrix, source offsets, JNI chain and Henry's isolated read-only instructions.

- Offline validation:focused66tests,full29files/289tests,native78mock tests andPowerShell AST parse PASS;nohardwarequeryexecution. Normal write/HTTP allowlists unchanged.

### Research checkpoint
- Examined: pinned APK selected full Java getters/Flutter handler/service callers, parameter fields, JNI/native inverse disassembly; existing57 helper pairs and current CONNECT/A-B/write plans.
- Verified facts:477 six parsed words, Q256, no enabled field;446 raw path0 low24 coefficients; dangerous generic initializer; current native identity/transport gates.
- Hypotheses:477 persistent-intended store;446 active RAM coefficient source. Neither hardware-confirmed.
- Discarded:unique reconstruction of original disabled/unity parameters; treating exponent as dB; Q100 derived claim.
- Unresolved:exact device477/446 replies,source/freshness,enabled,stereo,current-rate interpretation and fractional metadata fidelity.
- Next search target:Henry's fixed read-only capture plus existing official App profile comparison; source-backed missing fields required before production.

# AuraPEQ FreeDSP Decisions

## 2026-10-09 — Final UX: truthful CONNECT, official App envelope and confirmed RAM Reset
Choose the explicit Unknown fallback over speculative readback. Source446/477 and screenshots do not establish all9 parameters plus enabled/source/stereo state on1496. No new query or native API extension. The official first-getEQParam call chain can initialize unity190; copying it would violate read-only CONNECT. Preserve local editor and mark stale on disconnect; no saved-name substitution, no stale session registration or late RAM status overwrite.

Implement exact-FreeDSP−16..+6 as product policy, supported by supplied official modal and cachedAPK strings. Direct edits visibly clamp; imports reject without partial update or silent clipping; explicit RAM/Flash preflight retains existing mathematical checks. A retained out-of-range local value is not altered on CONNECT and must be corrected before Apply. Restore remains editor independent. This does not declare firmware limits, safe positive gain or preamp/headroom support.

Use a central TS capability and equivalent isolated C# gain constants. Native debug validator and220 metadata allowlist previously rejected−16, so align these policy guards only. Do not modify coefficient generation, signed24/exponent handling, Flash metadata truncation, packet plan or HTTP/SET/GET behavior. Keep native transport exception and other DAC behavior unchanged.

Latest Henry instruction takes precedence: Flat zeros every gain including disabled bands and preserves frequency/Q/type/enabled; do not reconstruct1kHz. Defaults creates9 enabled PK bands at31/62/125/250/500/1000/2000/4000/8000Hz,Q.7. Both describe and require intentional stereo RAM overwrite, then call existing Sync; no automatic Flash. Unsupported retained type/invalid frequency/Q still rejects before transfer. No new filter choices. Generic upstream Reset unchanged.

Keep the FreeDSP response plot symmetric±18 to show−16; generic±12 retained. Combined response is not constrained to the per-band range. Prior RAM/Flash/persistence hardware evidence remains intact; new UX requires Henry's manual acceptance. Evidence: tests/freedsp/fixtures/freeDspFinalUxEvidence.md.

## 2026-10-09 — Gain limits audit recommendation; runtime unchanged
Accept Henry-reported56/56matchingFlashACKs plus EQ persistence after physicalUSB reconnection as tested-session hardwarePASS. Preserve earlier successful results without inferring+12gain safety/fractional fidelity/all-rate behavior.

Recommend optionA (-16..+6dB) as future exact-FreeDSP product envelope, matching reported officialApp and pinnedAPK failure messages. Application-policy recommendation, not firmware/safe-audible limit. ExactDartcallback and rationale UNKNOWN. Current±12 remains unchanged this round. OptionB lacks evidence for extra positive headroom; optionC lacks a verified safe-operating mechanism. Nonpositive/offline alternatives reduce exposure but still require numerical checks.

Separately authorized implementation should align editor/import/graph/TypeScript/native guards, visibly explain out-of-range imported presets, preserve independentunityRestore and otherDAC behavior. No preamp emulation, gain-field reinterpretation or Flash redesign.

3150offlinecases show finite/signed24fit does not imply stability/response fidelity; extreme cases fail inside both official and current ranges. Native32-neighbor optimization/inverse-fidelity checks differ from currentnearest rounding. Record a separate numerical-fidelity follow-up, not runtime changes. Native inversegain tolerance approximately1dB is not a limiter.

Flash integermetadata versusQ8.8coefficient inputs is confirmed arithmetic/source behavior; boot reconstruction from metadata remains a hypothesis. Existing persistencePASS does not resolve fractional precision. Current+12hardware processing/headroom is UNKNOWN, not confirmed supported or universally rejected.

Detailed source inventory, numerical results, evidence boundaries and future separately approved validation options: tests/freedsp/fixtures/freeDspGainAudit.md. No control-research reopening or hardware operations.



## 2026-10-08 — M2Q hardware evidence / Restore 不依賴 editor
接受 Henry 全九段雙路徑 18 command190 Apply／Restore 的協定、雙耳等量、置中與恢復 PASS；取代 M2Q Web pending，不代表 production／正增益／Flash／preamp 完成。
負增益九段的強烈頻譜變化與低頻 high-pass-like 聽感支持 per-wire frequency/gain 行為，不等於量測響應或 HP filter 實作。
每次約九個 click/pop 是觀察事實，原因未證實。isolated executor 逐 wire 送 path0/path1，沒有 host 係數漸變或原子批次提交；hot-update 僅是假說，不推定 firmware 沒有 smoothing。prerequisites／polling／DSP state 亦未排除。暫不加 delay／mute／新命令。
本地驗證先於 bridge 呼叫攔截且不設 fault；Restore 固定九列合法 gain0/PK 快照、保留 action/uiIndex，native 既有 Restore 分支生成 unity。保留 editor、不自動 TX。真正 bridge/native 失敗仍 STOP，不解鎖未知狀態重試。
debug 安全範圍不是 hardware limit；native/math/190/API/production/non-FreeDSP 不改；手動確認按鈕無已確認 bug。

## M2R preparation decision — one build / two manual sessions
Use existing native PK math/dynamicGain/signed24; extend validation, not protocol. Perband±12 and conservativepositivebudget6 are independent. Estimate combined response from quantized native-model coefficients at all5knownrates on a loggrid plusbandcenters/DC/Nyquist. Dense grid does not prove a continuous maximum; idealPKpositivegain sum provides an additional conservative budget, with0.1dB numerical allowance for estimated quantizedpeak. +12 coefficient representability can pass while actual Apply is blocked by6dB policy.
P1 onlyBand5+6/1000/Q1; P2 onlythree separated+1/Q1, never9×+6. Do not add undocumented mute/commit: examined official enable/bypass names and first-enable sequence do not establish click-free update semantics. Timing logs must distinguish SET start/end and matching reply/poll interval; no claimed physical USB timing accuracy.
Separate graphical native session from generic WebHID device state so drag and automatic profile/undo sync cannot emit190. Main explicit Sync hooks gated session only; exactFreeDSP legacyconnectionblocked, non-FreeDSP unchanged. Local storage manual gate is user-reported evidence, not device authentication or firmware validation; native body/preflight checks still apply. No PR, hardware access, preamp/tilt/Flash or generic utility commands.

## D001
Do not change Conexant packet code before a reproducible local baseline exists.

## D002
RAM tuning is tested before Flash persistence.

## D003
Initial real-device PEQ tests use attenuation rather than large positive gain for hearing safety.

## D004
"Sync Complete" means only the application finished its transmission path;
it is not evidence that the FreeDSP DSP graph changed.

## D005
Hardware listening tests are manual and performed by Henry.
Automated tests must cover as much serialization/control logic as practical before physical testing.

## D006
Do not implement a fake "global preamp" by blindly multiplying every cascaded biquad coefficient.
A real preamp implementation requires evidence of the correct hardware/DSP control path.

## D007
把程式行為與硬體能力分開記錄。目前 preamp 無傳輸、readback 無 Conexant 解析、
A/B 寫回 mode 0 的證據詳見 ROADMAP；不能據此認定硬體本身不支援那些功能。
Report ID framing 與封包長度疑慮在 M1 以 deterministic tests、descriptor 與已知日誌驗證，
不在 Round 0 改封包。

## D008 — FreeDSP isolation
fix/freedsp-conexant 分支只針對 Moondrop FreeDSP（VID 0x35D8、PID 0x1496、
CONEXANT / Freeman DSP）。不得刻意修改 SAVITECH、FIIO、FIIO_JA11 或非 FreeDSP 的
MOONDROP / Comtrue 裝置行為。
新增 FreeDSP 實作優先放在 src/freedsp/；共享檔案僅在嚴格必要的 FreeDSP 路徑連接處修改。
每輪必須列出 FreeDSP 專用與共享檔案變更，並回報 Non-FreeDSP protocol code changed。
預設 NO；若為 YES，停止並說明原因後才能繼續。此規則避免 FreeDSP 修正擴大到其他協定。

## D009 — Characterize before correcting framing
M1 將目前封包生成與 Q22 量化放在 src/freedsp/conexantPacket.ts，
最小 transport 放在 src/freedsp/conexantTransport.ts，日誌函式由共享層注入。
src/dsp.ts 保留取樣率、band、RAM/Flash/mode/preamp/readback 的控制路徑。
抽取必須保持 bytes 與 fallback 語意；61 bytes、首位 1 與末 word 截斷仍是目前行為。
固定 fixture 只作來源碼行為刻畫，沒有原始裝置日誌就不能宣稱為已知正確的硬體 bytes。
Framing 修正需要另輪明確授權與新證據；M1 不推進 M2。

## D010 — Hardware-free verification
只新增 Vitest 作為直接測試依賴；鎖定 4.1.11，測試用 Vite 依賴另行隔離，
保留原有應用程式全部鎖定套件。沒有新增 browser、UI 或 coverage 套件。
verify.ps1 的 build 與 FreeDSP test 都是必要關卡，失敗或缺少測試 script 時非零退出。
test 執行 TypeScript 測試型別檢查及有限範圍的 vitest run；自動測試不使用真實 HID adapter。

## D011 — One candidate with a descriptor gate
M2A 只測去除 presumed embedded Report ID 的假設。原始 builder 與正常同步路徑不替換。
候選 buildConexantPacketCandidateNoEmbeddedReportId 保留交易欄位、command、CTRL 與全部 words。
所需長度為 2+4+4+13*4=62 bytes；這是候選的數學需求，不是已證明的硬體 report 長度。
不把舊 61-byte 封包 slice(1) 當成完整候選，因為那樣已丟失末 word 高兩 bytes。
實際 descriptor 無法容納完整候選時停止，另輪取得證據後再決定，不混合其他 framing 修改。

## D012 — Separate inspection from manual writes
診斷頁不匯入 main/fn/dsp，不枚舉曾授權裝置，也不註冊 connect 自動連線。
手動選取階段只讀 collections；只有明確的 RAM 按鈕會在長度檢查後 open/send。
Report 資訊缺失、非 byte alignment、多個同 ID 不明或 bytes 不匹配時 fail closed。
新探測路徑只允許精確 FreeDSP VID/PID；feature fallback 必須檢查 feature descriptor。
現有 transport 與非 FreeDSP 路徑不改動。

## D013 — Bounded RAM comparison
只對 Henry 明確選取的單一取樣率寫入九段（第 1 段衰減、其餘 flat），再用既有 mode 0。
PK 計算沿用基準 computeBiquadCoeffs 的 PK 分支與 Q22 量化，不修改共享數學函式。
兩個比較 profiles 只在第 1 段係數不同；不寫 Flash，不修改 preamp，不實作 DSP readback。
每次最多十個封包，每個 output failure 最多一次有 descriptor 支持的 feature fallback；
任何失敗立即停止，不掃描長度／Report IDs，不做自動重試或硬體實驗。

## D014 — Separate facts, hypotheses, and next evidence
每個實驗輪次的報告與 ROADMAP 必須更新 Problem / hypothesis / next action 六個欄位，
依直接證據標記 facts、依可信度排序 hypotheses，不混用。DECISIONS 只收持續有效的結論，
DONE 只收已驗證的完成工作；格式能容納 61 bytes 不等於硬體格式正確。

## D015 — External report ID and offline reconstruction boundary
WebHID 的 reportId 與 data 分開，descriptor 的 data bits/count 不包含外部 ID 參數。
Henry 回報的61-byte output不能容納62-byte M2A候選；不得用截斷、任意padding或更大buffer繞過。
M2B hypotheses保留在src/freedsp/離線純函式與測試，不匯入正常runtime或診斷傳輸。
欄位寬度、native words與prefix意義須由native serialization或已知正常USB bytes確認後，
才在另輪授權範圍內修正；本輪不把任何一種假說定為正確protocol。

## D016 — Preserve provenance and transport boundaries
以原始附件/固定commit/hash保存來源。helper byte dump、native struct、host USB transfer與mock fixture
分開標示；未取得hook與transfer參數就不把buffer長度或首位byte當成WebHID邊界。
實際dump的byte值可驗證JS序列化差異，但不能因完全吻合就越過實機descriptor容量限制。
同源repo/論壇重述不是獨立佐證；各command的payload長度與語意不得跨命令無證據泛化。
沒有權威serializer時，下一輪先取得官方app的完整host transfer證據，再決定離線fixture與修正；
不把不確定欄位變成候選RAM寫入實驗。

## D017 — Long research checkpoints
長時間來源研究在每個主要階段將已查來源、verified facts、hypotheses、排除項、未解欄位及下一目標
保存於ROADMAP；DONE只收已執行的調查／驗證，DECISIONS只收持續有效的規則。
官方APK只作靜態資料，原始APK與工具置於暫存目錄；不執行、安裝或提交大型binary。

## D018 — Official Java buffer versus WebHID data
M2D官方APK的CnxtUsbCommand.getUSBMessage與UsbHelper.controlTransfer建立可追溯邊界：
13word命令傳入62-byte完整buffer，HID reportID1在首位；WebHID以外部reportId1與其餘61bytes表示。
不得再保留額外的embedded ID或刪除第二byte/count後zero來湊長度；第二byte固定00，其vendor語意不命名為transaction。
command190須依setFreeman3EQ獨立來源；commit須依官方long常數255，不以-1代替。
此次只建立離線證據，不變更runtime、不驗證硬體效果；短命令容量另行處理，不能一律推廣13words。

## D019 — Shared serialization does not imply shared command semantics
官方source的90/190/220/259共用getUSBMessage，但各command資料來源分開保存。
190的band+5、220的rateIndex/band、commit255與metadata Q×256/gain截整數不得互相替代。
Native Gain是signed byte、coeff fields是signed int，轉Java long後統一寫低32bits；不是mixed-width wire fields。
precision24這個JNI參數不單獨證明Q24或Q22；未確認native數學前不改共享係數公式。
187只有1word、188有13words，對短187不能憑容量補zero後宣稱WebHID已支持。

## D020 — RAM semantics require caller and native provenance
190使用官方即時caller的selector0、band0..4→5..9與current sampleHz；不能把Flash rate4..8/band1..9直接重用。
這個五band SDK限制不證明FreeDSP硬體只有五band，也不授權把九band通通加5。
native precision24搭配Gain=e+2，effective coefficient scale為2^(25-Gain)；固定Q22/Gain3只是一個特例。
Feedback反號與B原符號分開核對；native16bit參數與32bit傳輸word不得混為同一struct。

## D021 — Representation mismatch is not hardware causality
Q22/Gain3在native inverse scale公式與signed24範圍內可自洽；動態Gain2/Q23提高精度，
不能把與SDK不同就直接定為無效或零效果。固定Q22在大係數時可能超出24bit，需動態縮放/範圍檢查。
現有framing按官方布局解讀會成command13/count1/錯CTRL，是最強零效果候選，但仍非實機因果實驗。
188/187與current-rate190來自可追溯Java鏈；mode90是獨立preset入口，190後強制90的必要性與效果未證實。
Service legacyID4/5與短187的WebHID支持未知，未取得descriptor證據不得嘗試；first-read flat初始化不可盲目複製到sync。

## D022 — M2F is a controlled diagnostic, not production replacement
Henry已授權單段manual hardware test。診斷使用官方CAF envelope及selector0/wire5，不替換正常sync或Flash。
187固定report適配保留logical count1，以零padding補到61data；這是本輪明確實驗例外，
不是來源已證的Android短transfer等價性。matching reply缺失時停止，不改framing、不fallback feature、不重試。
WebHID input events與官方GET_REPORT結果是否相同亦待硬體證據；未確認legacyID4/5維持不送。
只採current-rate346有效index4..8；不猜fallback。Native最後neighbor未精確移植，nearest rounding明確標記，
以signed24/穩定pole與離線頻率響應測試約束固定衰減設定。Flat只清測試band，並非備份restore。
ACK不等同可聽EQ生效；Henry回報前M2F hardware proof保持PENDING。mode90獨立手動，首次測試不使用。

## D023 — Response transport is part of the protocol
188/187/190的sendCmd與346的getMsgByCmd皆同步SET_REPORT output1後GET_REPORT input1輪詢；不是interrupt response證據。
188/187的caller不以false阻擋後續，不表示helper沒有等reply。四個命令沒有來源支持SEND_SUCCESS_ONLY。
isExecuteSuccess讀unsigned16 count，>=0條件冗餘，主要測replybit；未比對command/module。後續matcher應明確說明較嚴格的條件。
RX使用fresh array及controlTransfer IN原地寫入；buffer capacity不等於actual read length。
July logger/hook不在current APK，不能把舊RX dump確定命名成interrupt ACK或排除hook mutation。

## D024 — M2G isolates inbound behavior without EQ writes
三次188 timeout只證host送出與current diagnostic無matching event；不證DSP accepted/rejected或EQ failure。
DEV頁只提供inspect/open及346 query，持續保存全部輸入；停止M2F write controls，本輪不前進190。
Candidate parser支持短logical response並保留unmatched/raw，但matching query須ID1/prefix0/reply1/346/CTRL及word1可用。
Query的Hz未知與transport無response分開報告；synthetic346 fixture必須明確標記，不能假冒已知captured response。
187Android短14-byte request已證，但61-byte WebHID padding的hardware等價性仍未知；本輪兩者皆不送。

## D025 — M2H browser transport boundary
Henry的M2G回報：listener在open/send前ACTIVE，346 ID1/data61 host完成；2.5秒後rawTotal=0/newEvents=0。
沒有事件進parser，晚註冊／ID filter／short rejection／parser mismatch不能解釋本次raw零輸入。
零輸入不證firmware拒絕或無回應；官方Input GET_REPORT沒有被WebHID passive events重現。
正常Windows Chrome網頁：WebHID沒有Input GET_REPORT；Feature GET不是Input GET。
WebUSB官方recipient=interface/index3指向受保護HID class，claim與control parameter檢查皆阻擋。
WebHID權限/handle不能借給WebUSB，endpoint0也不能省略interface claim；hybrid NOT FEASIBLE。
WinUSB binding不能解除HID class保護，不推薦Zadig或driver替換。只換HID功能可能保留audio但破壞WebHID；
誤換audio/composite parent可破壞音訊。兩者均非一般AuraPEQ使用者方案。
usb-unrestricted是有manifest權限的Isolated Web App例外，非一般localhost網頁可開啟的header；不把此例外說成平台永遠不可能。
Case C：不增加WebUSB inspection/query按鈕、不要求Henry再測browser。後續候選為Windows HidD_GetInputReport native helper/local bridge，
單一native owner序列化SET→GET；其FreeDSP相容性仍未測，本輪只作架構判斷。WebSerial無CDC/serial證據，不列可行替代。
依據：[WebHID](https://hid.spec.whatwg.org/)、[WebUSB](https://usb.spec.whatwg.org/)、
[Chrome WinUSB要求](https://developer.chrome.com/docs/capabilities/build-for-webusb)、
[Windows Input report API](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_getinputreport)。

## D026 — Success states and sample rate are evidence claims
後續production的狀態政策（M2H不修改UI）：
- HOST_SENT / Host write sent：OS/browser接受write；不是DSP成功。
- RESPONSE_UNAVAILABLE / Device response unavailable in WebHID：目前API/測試未取得官方回應，不能宣稱拒絕。
- ACCEPTANCE_UNVERIFIED / Device acceptance unverified：未取得匹配結果，不顯示Sync Complete。
- MATCHED_CAF_RESPONSE / Verified by matching CAF response：至少比對ID、command、module、reply及logical payload；
  這只驗證CAF回應，還須依命令結果語義判斷，不自動證EQ係數已套用、聽感或Flash持久化。
- VERIFIED_READBACK / Verified by readback：讀回指定設定並比對；RAM與重開機後Flash persistence另列。
346需取得實際response中的current-rate word；AudioContext、capture track、手動OS設定或cache只可標hint，不能假冒CAF查詢。
188/187/190/220官方helper都有GET polling。GET是否為mutation生效必要條件UNKNOWN；ignored bool不構成write-only可靠性證據。
write-only可以送出但不能truthfully verify DSP acceptance；未確認current rate亦不能安全推導當前bank。
不盲寫Flash、不為timeout延長等待後再原樣重試、不以parser改動代替缺失的transport。

## D027 — M2I native346 is an isolated transport experiment
tools/freedsp-native以C#/.NET10、P/Invoke既有Windows HID/SetupAPI，零外部套件、不改driver/admin/production。
CLI只接受query346；wrapper無參數。唯一TX是官方13words [62,0×12]／CTRL／command346，native62bytes包含ID1。
探索只開metadata access0並列matching paths/caps/errors；query handle固定GENERIC_READ|WRITE、SHARE_READ|WRITE、OPEN_EXISTING、flags0。
Windows MI_03 path + confirmed35D8/1496 + usage0C/1 + input/output62是保守collection gate；不硬猜Windows interface數字與path第一項等價。
任一matching path無法inspect、零/多個合格目標即停止；opened handle再次檢查identity/caps。
HidP_InitializeReportForID在preparsed data確認Input1/Output1存在；純本機parser工作，不送report。
SET選HidD_SetOutputReport（state/output IOCTL），不用WriteFile；GET選HidD_GetInputReport（state/input IOCTL），不用Feature GET。
這是最符合官方state SET→GET的Windows HID client API；USB HID control request由driver/minidriver處理，
本輪沒有physical USB setup capture，不能聲稱已驗證Henry裝置的exact21/09/0201/3與A1/01/0101/3。
Microsoft明示部分裝置不支持state API；因此只作一次346 probe，API失敗不改driver或重試排列組合。
API buffer[0]=ID1，長度由HIDP_CAPS核對為62；GET fresh buffer不能複製TX。Boolean success不提供actual transfer length。
單次SET→單次GET，不移植官方poll loop；未ready reply亦可能標unexpected，不能立刻判serializer/device錯誤。
同步HidD沒有timeout參數；script30秒process watchdog是主機等待限制，不是USB per-call1000ms，也不保證取消了driver內部完成。
輸出保留path/caps/access/API/Win32Error/TX/RX/header/logical words/capacity words，失敗不解析成已確認回應。
分類：VALID CAF346 RESPONSE；GET_INPUT_REPORT SUCCEEDED BUT RESPONSE UNEXPECTED；GET_INPUT_REPORT FAILED；DEVICE OPEN / ACCESS FAILED。
SET失敗另標HOST SET_REPORT FAILED／GET NOT ATTEMPTED，避免誤稱GET或open失敗；watchdog標COMPLETION UNKNOWN。
Valid須ID1/prefix0/reply1/command346/CTRL/count2..13；word1 index4..8映射已證五rates。Unknown index保留，Hz UNKNOWN。
比官方的replybit-only判斷更嚴格；count0即使capacity word1有值也不假冒完整logical reply，保留raw供後續研究。
Mock/serializer/build成功不代表native裝置相容性；硬體proof需Henry實際SET成功+GET成功+plausible matching CAF346。
成功亦只證query transport，不證RAM190、可聽效果或Flash persistence；STOP於M2I。
Sources: [SET API](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_setoutputreport)、
[Input GET API](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_getinputreport)、
[HIDP_CAPS](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/ns-hidpi-_hidp_caps)、
[Report ID parser validation](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_initializereportforid)。

## D028 — CAF validity, command matching and proof levels are separate
Henry提供M2I實測：oneSET346 success/error0，oneGET success/error0，MI03 col01、usage0C/1、input/output62、feature0。
RX已知14byte prefix可解析CAF188/reply1/count1/CTRL/word0=1；不是matching346，也不是結構無效或transport failure。
完整buffer剩餘bytes與fullWindows path未貼出，不補零當hardware capture；native188離線案例尾部為明確synthetic padding。
- Level1 NATIVE HID TRANSPORT VERIFIED：Windows SET成功與GET成功，且取得有效CAF reply（188）；不聲稱fresh346被DSP接受。
- Level2 CAF346 QUERY VERIFIED：必須匹配346/reply1/CTRL/ID1及logical word1；未知index保留，Hz UNKNOWN。
- Level3 RAM/EQ VERIFIED：仍NOT VERIFIED，不屬M2J；Level1/2不等同聽感或persistence。
GenericCAF Valid只檢查ID/prefix/reply/CTRL/count容量，不要求command346或count>=2；Matching346另加query條件。
這修正M2I「有效188也算INVALID」的混淆；native GET成功但nonmatch不能證query完成。

## D029 — Official cadence with an explicit diagnostic matching correction
Pinned APK getMsgByCmd先GET@86，建立clock@102後，@120..136檢查buffer[5]replybit，等於1即return@254。
@140..148檢查elapsed>=1000；未到deadline才GET@168；sleep5@194..198，算elapsed@216..250，回loop@252。
沒有fixed retry count；firstGET不是無條件discard；首次reply188亦會立即返回，不會「忽略舊command直到346」。
isExecuteSuccess只nonnull/replybit1及unsignedcount>=0冗餘條件；不比command/module。getCurSampleRate只在success後讀offset14/word1，
不驗logicalcount>=2、不辨188，失敗回-1001。因此官方接受stale188時可能讀capacityword1，不可照抄成已驗證rate。
M2J依Henry要求修正匹配：oneSET→initialGET→start1000ms→while未matching且未deadline repeatGET→sleep5ms。
Valid非matching（含188）及invalidcandidate保留並在bound內繼續；matching判斷先於下一次deadline檢查，已開始的GET可晚回。
非官方差異明列：①matching346而非anyreply；②nativeGET失敗即停止（官方忽略return）；③freshRX每次、避免buffer殘留；
④Stopwatch monotonic而非Java wallclock；⑤Windows HidD沒有Android per-call1000ms，只能另有30sprocesswatchdog。
不是exact Android policy複製，亦不是任意retry參數；CLI不可調deadline/count，不reSET，不送188/187/190/90/220。
取得188→346支持立即oneGET不足及bounded synchronization有效，但不單憑此序列判FIFO（可能只是時間延遲更新）。
持續identical188至官方deadline標appears retained/stale，不再讀；GET error記exactattempt/code後停止。
Snapshot/retained response比FIFO更符合stateAPI描述，device/Windows持有者仍UNKNOWN。
Source: [Microsoft state vs read report semantics](https://learn.microsoft.com/en-us/windows-hardware/drivers/hid/obtaining-hid-reports)
及pinned officialResponseStaticEvidence.json完整bytecode；M2J再抽取12methods與fixture完全一致。

## D030 — M2J hardware levels / M2K fixed RAM diagnostic
M2J matching346在GET#1成立，word1=5對應48k；不表示多GET在這次硬體必要，也不證queue/snapshot來源。
採用官方188[1,0x12]/187[0]/346[62,0x12]/190[0,5,Gain,B0,B1,B2,A0,A1,0x5]。
官方188僅在enabled flag false時呼叫；獨立process沒有此flag，因此每次Apply/Restore明確送188。
官方sendCmd的188/187/190為SET→startouter1000ms→GET→sleep5ms；346先initialGET才startouter1000ms。
官方僅replybit判定，不matching；本診斷增加command/ID/prefix/CTRL/countcapacity matching、freshRX、GET error即停。
188成功bool存flag，187 bool被丟棄，190回bool；本診斷不沿用ignored prerequisite failure，所有matching都是下一SET的gate。
187 logical14無法由HidD_SetOutputReport以受支援的14byte API request重現；Windows contract要求caps62，hidapi相同API明確補零。
因此依Henry「unless Windows HID API behavior requires it」例外，採用14byte prefix＋48zero、count1、API62，無短長fallback試送。
此決定只證Windows適配有依據；firmware兼容及實際 USB 長度仍未驗證。matching187未取到禁止190，不用hostsuccess代替。
Sources: [Microsoft HidD_SetOutputReport](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_setoutputreport),
[hidapi Windows hid_send_output_report](https://github.com/libusb/hidapi/blob/master/windows/hid.c) (examined 2026-10-07, function at raw lines1265..1305).
不增加IOCTL/WriteFile/WinUSB或driver替代；不宣稱可以faithfully發Android14byte USB transfer。
Flat來源：pinned officialRamStaticEvidence.json setDefaultAvailable直接190使用Gain3/B0=4194304/B1=B2=A0=A1=0；本工具只套selector0/wire5。
套此flat不執行官方setDefaultAvailable的多band/多selector loop；Restore不是previousEQ備份，enable/bypass state亦可能改變。
400Hz模型固定attenuation，nearest float32 rounding接續M2E，無native32candidate搜尋，所以1LSB uncertainty保留。
不自動90或Flash；protocol ACK與audible/restoration evidence分開。若成功但無效果，下一輪研究enable/bank/mapping/90，不放大或加band。

## 2026-10-07 — M2K real hardware result (Henry report)
VERIFIED: native bidirectional CAF transport、188 matching、Windows padded187 accepted、matching346 index5=48k、matchingRAM190。
SDK0→wire5 Apply PK400Hz/-12dB/Q1/selector0 有清楚可聽變化；同band unity Restore 有清楚可聽恢復。
Apply與Restore的190均觀察firstGET reply0→secondGET reply1；bounded GET justified，無reSET。
Henry描述air/ambience/reverberation減少，但未能定位400Hz；不聲稱tonal accuracy、bitexact、其他bands、九band、Flash或globalpreamp已驗證。
M2K SINGLE-BAND RAM AUDIO EFFECT / WIRE5 APPLY-RESTORE VERIFIED。
M2L開始：wire6–9 HARDWARE VALIDATION PENDING；Codex僅離線實作，不做實體測試。

## D031 — M2L controlled remaining-band validation
依HenryM2Kprotocol＋Apply/Restore可逆聽感回報，wire5 SINGLE-BAND RAM AUDIO EFFECT VERIFIED；不外推頻率定位、bitexact、全bands或Flash。
190 firstGET reply0→secondGET reply1在兩次write皆見，保留bounded GET，不reSET。padded187 accepted不等於Android USB transfer長度已擷取。
M2L唯一變數為wire6..9，SDK1..4官方+5 mapping已保存static evidence；filter/selector/ratequery/coeffmodel/transport完全沿用。
Native八個fixed operation names＋query346，不收numeric band；guard僅allow remainingbands固定cut/unity。wire5與舊M2K CLI退出本輪reachable write set。
每bandApply後須samebandRestore，再由Henry確認可聽恢復；restore N/P/Q或protocol error全停止，不累積filters。
ApplyN/S不是硬體VERIFIED，但仍容許人工確認同bandrestore；restoreYES後可進下一band，異常/不同結果附sections供review。
Q只停止，不自動write；這避免abort/disconnect/abnormal狀態追加未授權測試。可能殘留filter明列，不能宣稱Q會還原。
Logs用GetTempPath/AuraPEQ unique CreateNew＋AutoFlush，拒絕repo內TEMP；每bandmarkers/fullraw保留，摘要成功僅pass＋YES/YES才VERIFIED。
互動state machine用dependency-injected protocol/answers做offline tests；真實launcher只接受八個fixed names、onechild、30s watchdog、finallycleanup。
PS module屬隔離診斷helper，沒有新增projectdocs或production連接。GlobalPreamp/MasterGain另輪，禁止逐biquadscale模擬，不在M2L研究。

## 2026-10-07 — latest M2L hardware result (Henry report)
SDK0/wire5 previously VERIFIED M2K，未重測。
SDK1/wire6：Protocol Apply PASS、Audible Apply YES、Protocol Restore PASS、Audible Restore YES，fully VERIFIED。
SDK2/wire7：Protocol Apply/Restore PASS、Audible Apply YES；Henry分心，Restore聽感PARTIAL/UNCERTAIN。
wire7分類：PROTOCOL VERIFIED / AUDIBLE RESTORE UNCONFIRMED，不是failed。腳本正確在P後停止；SDK3/wire8、SDK4/wire9 NOT RUN / PENDING。
M2L Windows native evidence：input/output report bytes62、feature0，HidP_InitializeReportForID確認Input/Output ID1，SET成功並取得matchingCAF回應。
這與1byte reportID＋61byte reportdata一致；preparsed-data驗證/caps/hostAPI回應不是rawUSB transfer擷取，不能聲稱已證實rawUSB長度。

## D032 — targeted M2L resume is validation state, not protocol repair
Henry新證據將wire6升為fullyVERIFIED；wire7Apply可聽及Apply/Restore protocol都PASS，Restore聽感因分心未確認。
保留wire7 PROTOCOL VERIFIED / AUDIBLE RESTORE UNCONFIRMED；不標failed、不修改packet/native/coefficient去「修」未證實問題。
手動StartSdkBand只選既有controller中的後綴SDK1..4；預設1、nextStart2，validateset拒絕0/5/decimal/unknown。無OnlySdkBand複雜化。
Summary保留priorverifiedwire6及priorunconfirmedwire7，不把skippedverifiedband標not tested，也不把skip當證據。
Safety firstApply判斷從SDK1改為selectedfirstSDK；每次新run從指定band開始仍要求離耳及低volume。
Nativechildlauncher、operationnames、CAFflow/serializer/bandmapping/coefficient/math/payload及failurepolicy完全不變；僅manualtoolselection/summary/tests/doc變更。
Windowsinput/output62、feature0、preparsed-ID1、SETsuccess/matchingCAF支持1ID+61data interpretation，不能當rawUSB捕捉；此證據在ROADMAP保存。
GlobalPreamp仍另輪NOTVERIFIED；no Flash/90/220/production/nonFreeDSP changes。

## M2L Toggle — small manual UX patch
Observed problem: Henry可能錯過單次Apply/Restore的瞬間聽感變化。
Verified facts: 前次wire7Apply/Restore protocol成功；Restore聽感仍未確認，沒有已知protocoldefect。
Fix: 手動改為A=Apply、R=Restore，可反覆切換，顯示STATE APPLIED/RESTORED；本band兩種operation各成功至少一次才接受Enter確認。
N=no clear difference並停止；Q立即停止；不自動Restore。尚無本run操作時STATE UNKNOWN，不冒稱已還原。
若Enter確認時仍APPLIED，接受聽感確認但停止後續bands並警示，避免累積；建議R後Enter。
StartSdkBand1..4與TEMP完整log保留；native/CAF/190/math/mapping/payload/rate/Flash/90/220/production/nonFreeDSP未修改。

## 2026-10-07 — M2L COMPLETE (Henry final hardware report)
SDK0/wire5、SDK1/wire6、SDK2/wire7、SDK3/wire8、SDK4/wire9全部VERIFIED。
每個映射都有successful protocol Apply、audible EQ change、successful protocol Restore、audible restoration。
M2L官方五段live mapping已完成，不再排程重測wire5–9；不外推AuraPEQ九段UI完整mapping、bitexact或Flash。
新里程碑M2M：完整九段PEQ映射＋Web RAM debug integration；優先PEQ，不研究GlobalPreamp/MasterGain。

## 2026-10-07 — M2M: direct nine coefficient slots, physical gate before Web
### Problem / hypothesis / next action
Observed problem: M2L five-slot reversal is complete, but nine UI assignment and front-four slot effects are unverified.
Verified facts: pinned Freeman3 getF3EQCoefficientList loops1..9 with446/word0=0, preserves slot into BandEQCoefficient.band; same446 getter uses SDK+5; public setter accepts0..4. Official initialization190 writes raw0..9 unity for word0=0/1. These are static facts, not nine-slot audible proof.
Possible causes: front-four may be reserved/shared bank/other physical partition; source does not identify its purpose.
Ruled out / weakened: no official raw1..4 evidence, nine UI indices can pass SDK+5, Flash metadata is sufficient, hardware effects can be proven by static/native mocks.
Next validation: one explicit manual raw1..4 A/R sequence; known slots5..9 excluded. Fixed cut/unity profile and exact proven flow reused, no446/90/220 or initialization loop.
Possible fix direction: if remaining effects reverse, isolated FreeDSP current-rate debug Web adapter with explicit UI-index validation, disabled unity and supported PK semantics; later independent UI/full-nine gate still required.
Decision: select request CaseA. Treat physical UI assignments as unresolved even though coefficient-slot existence has strong source support. Do not introduce Web transport/production changes before that gate. Candidate native operations are separate from SDK operations, with exact allowlist; no inferred negative or out-of-range SDK field. Offline-only nine-row models/tests establish a proposed convention, not runtime authority. No preamp/Flash.

Validation boundary:47 native mock＋15 PowerShell mock＋134 project tests and pinned six-method replay passed. They validate fixed candidate packet construction/flow/guards/offline UI models, not wire1..4 audibility. The single manual entry remains the next evidence gate; no Web integration inferred from offline success.

## 2026-10-08 — M2M hardware COMPLETE / M2N start
Henry reports rawwire1..4 PK400Hz/-12dB/Q1 each protocolApply PASS、audibleApply YES、protocolRestore PASS、audibleRestore YES。Combined with priorwire5..9, allrawslots1..9 have individual reversible audible evidence. M2M hardware validation COMPLETE; no slot retest scheduled. SDK field semantics forwire1..4 remain UNKNOWN. M2N assigns editable UIposition0..8 to rawslot1..9, explicit position/index validation; debug Web RAM integration only, no production replacement/preamp/Flash.

## M2N decisions — direct raw slots / native loopback transport
- Adopt UIposition/index0..8→rawwire1..9 as stable application assignment: nine editable positions, official446 directenumeration/190initialization and Henryallnine reversiblehardware evidence align; no frequency-role or SDKfront-four inference needed.
- Use isolated DEV page with existing Band shape and validated explicit stored-state import. Do not redirect production Sync/realtime; reject unsupported/positive types rather than pretendingPK or silently dropping rows.
- Use Windows native bridge instead of retrying unsupported WebHID synchronousGET. Standard .NET10 ASP.NET shared framework only; no externalNuGetpackages/admin/driver changes. Bridge starts withdev.ps1 and bindsloopback; session is non-device, Connectmetadata-only, eachRAM action is a boundedchild.
- Preserve exact native-target gate and default fixedreportallowlist. New scopedopen permits only exactpacket values generated for request; avoid a general190 or command API. JSONrequired/unmapped/size/origin/host/session/busy guards protect explicit operations; watchdog killsownchild only.
- Source-derived negativePK parameter model with nativefloat/dynamicGain/nearestapproximation;1LSB optimumuncertainty retained. Disabled andexplicitRestore unity; preserve editor testvalues for repeatApply, do not label as live/device readback.
- Small shared runtime edits justified: DEVentrylink + exactFreeDSPDEVauto-connectskip preventoldsender/auto-preamp startup effects. No otherDAC/productionprotocol behavior changed.
- Initial gate UI1/5/9 reversals; then explicitfullnine operation, no autoall9sync. Individualrawslot evidence does not establish simultaneousindependence/fullnine correctness. No preamp/Flash/persistence/readback/90; STOP pendingWebmanual validation.

## 2026-10-08 — M2O full-nine Web RAM validation policy
Henry verified M2N UI1/wire1, UI5/wire5 and UI9/wire9: protocol Apply/Restore PASS and audible Apply/Restore YES for each. Combined with prior individual native wire1..9 reversals, this opens the full-nine Web gate without retesting those bands. Simultaneous nine-band hardware behavior remains PENDING.
M2O remains isolated DEV RAM debug only, UI1..9 -> wire1..9. Explicit editor-only preset: PK/Q1 at250/400/630/1000/1600/2500/4000/6300/10000Hz with -3/-4/-5/-6/-7/-8/-9/-10/-12dB. First full-nine Apply with IEM out of ears, APO OFF, FreeDSP output and low volume; listen only after protocol success without abnormalities.
Prepare all selected coefficients AND packet bytes before first190; send each wire once in order, matching CAF required. Stop first failure, no retry/rollback/automatic restore. Existing explicit188/187/346 prerequisites unchanged and logged;190 is sole EQ write. Each wire has BEGIN/PASS and final protocol complete only after all nine pass.
Separate user-only audible Apply YES then audible Restore YES; no inferred audibility. Restore writes nine unity filters, keeps editor values, and is neither prior-EQ backup nor readback. No Flash/preamp/positive gain/nonPK/production sender replacement/non-FreeDSP changes. Codex performs no hardware actions. STOP at M2O READY pending Henry.
Decision: carry forward the reported M2N gate; do not persist automatic listening approvals. Full-nine confirmations are local to the explicit Apply/Restore cycle and reset after another Apply or single-band hardware action. Keep command/math/serializer logic unchanged; materialize packet bytes before sending and add per-wire markers only.

## M2P — 2026-10-08: channel/path research checkpoint
Henry hardware report reclassifies M2O: full-nine190 Apply wire1..9 PASS, Restore wire1..9 PASS, audible effect/restoration YES; stereo correctness FAIL / unresolved. NOT production-complete. Earlier single-band tests share reversible rightward imaging. Henry then directly checked ears: selector0 Apply changes LEFT only, RIGHT unchanged; unity restores LEFT. This is user listening evidence, not measured transfer/function naming. Path1 RIGHT is not confirmed.
Examined: pinned APK04756...2d5 nine-slot DEX fixture, RAM/APK fixtures, all57official helper TX/RX pairs, local recovered APK classes.dex, current native payload. Verified: initializer setDefaultAvailable offsets58/62→word0=0,172/176→word0=1; same slot v6 written70/180, sameGain3/B0=4194304 written80/92 and184/188; two190 calls150/216 per slot0..9, firmware>=7.49.0.0 string guard. Runtime setter172/176 only0 and one190; getter446 uses0. Helper dump has NO190 (90×1,220×55,259×1); no official captured paired negative190.
New pinned static name scan scripts/freedsp/inspect-paths.py: all com/conexant classes in classes.dex excluding generatedR resources; only setDefaultAvailable/setFreeman3EQ have literal190 in Freeman class. Left/Right names occur in ANC/ApplicationData, not mapped to190; notificationchannel/helperchannelcount do not name190 targets. Search does not reconstruct Dart AOT/firmware; cannot prove absence of other indirect routes.
Strong inference:190word0 selects distinct coefficient targets; selector0 has LEFT-only effect in Henry's current setup. Stereo channel interpretation now MEDIUM/HIGH support, exact path1/right UNKNOWN until experiment. Alternative bank/processing-target interpretation remains; official runtime0-only is counterevidence to claiming it always updates both. Do not infer a proven official pairednegative setter.
Next: isolated singlewire5 PK400/-12/Q1 current346 A/path0 and B/path1, each explicit unityRestore/listen. Record changedear andimage separately. C/both only after A LEFT-only/B RIGHT-only and both restoredYES; explicit samecoeff writes0then1, stopfirstfailure, no retry/rollback. No production/Web/M2O behavior replacement. No Codex hardware operations.

M2P decision: static same-slot unity0/1 + Henry's direct unilateralLEFT effect justifies a controlled two-target experiment; it does NOT prove1=Right or authorize production dualwrites. Preserve pathlabels in code/logs. Fixwire5 to retain provenSDK0anchor, useexistingPK400/-12/Q1/current346math, no rawslot0reset/no Flash220. Scope path1exactpacketauthorization to this explicit native operation, keep default/global allowlist rejectingpath1 and unchangedWeb bridgeAPI/M2O. OnlymanualALEFT/BRight/recovery gatesunlockexplicitC. Bothwritesprecomputed; eachmatching190once, stopfirstfailure; no automaticretry/rollback/restore. LaterpairingrequirescompletehardwareA/B/C andseparateproductionround; full-nine stereo remainsrequired. LogsTEMP/AuraPEQ; standalonebuildTEMPoutputavoidsReleaseWebDLLlock, startwithoutdeviceaccess. No tuningCLIargs/newgainfields.

## M2P 中文 toggle UX / baseline 優先 — 2026-10-08（取代先前觀察判讀與循序問卷關卡）
Henry 最初感到 Apply 使聲像右偏、左側減少；後來受控 path0 測試不一致，先前 RAM 狀態可能未清乾淨；之後明確 path0 Restore 在 BOTH 耳產生清楚可聽變化。因此不能沿用「selector0 已確認只影響 LEFT」或推定1=RIGHT；selector0/1 立體聲語義仍 UNRESOLVED，優先建立乾淨 baseline 後反覆切換。M2O protocol/可聽效果 PASS，但 stereo correctness FAIL／未解，仍非 production-complete。
新入口維持 scripts/test-freedsp-native-channel-path.ps1，完整繁體中文說明、主選單 U/0/1/B/Q；進入 path0/path1/both 後 A/R 可反覆切換，Enter/Q 返回持續主選單，O 才自願紀錄聽感。取消或錯誤觀察答案返回模式，不退出、不自動還原；問卷可用 RESTORE/CLEAN 明確選擇立即 Restore／雙pathunity。O 的 R 代表右側，U 代表不確定；不與主選單操作混用。
U 明確呼叫既有 M2PRestoreBoth：預算兩個 unity 封包，依 path0→path1 各190一次；保留188/187/346 prerequisites，失敗即停止，無重試／rollback。逐path顯示 RESTORE PASS/FAIL，只有整體成功才印 Baseline clean: path0 + path1 wire5 unity restored。僅wire5unity命令完成，不是全裝置還原、舊EQ備份或readback。
狀態依本次成功命令紀錄 APPLIED/UNITY，啟動與失敗 UNKNOWN；每個選單及結束摘要持續顯示各path狀態，返回／退出不隱藏仍套用或未知狀態。不強制問卷或宣稱聲道映射通過；Both 可由主選單明確選擇，取代先前依未可靠單側觀察設置的A/B→C關卡。首次Apply耳機離耳、APOOFF、FreeDSP輸出、Windows1–2/100；所有硬體動作均需明確A/R/U輸入。
變更僅PowerShell tester UX、其mock tests及文件；command190語義、native係數／固定wire5／PK400/-12/Q1／RAM流程、Web/M2O/production sender、dev生命週期、非FreeDSP均未修改。Codex未操作硬體。

## 2026-10-08 — M2P hardware COMPLETE / M2Q dual-channel Web preparation
Henry completed clean-baseline repeated wire5 PK400Hz/-12dB/Q1 toggles: baselinepath0unityPASS,path1unityPASS; Path0 Ear=L/Image=R; Path1 Ear=R/Image=L; Both Ear=B/Image=C, equal-ear change with centered image. Hardware-derived mapping: selector/path0=LEFT, selector/path1=RIGHT on this FreeDSP setup. Official SDK names remain unnamed; do not present these labels as recovered official field names. This newer controlled evidence supersedes the prior inconsistent/unclean-baseline observations.
Full log reviewed read-only: C:/Users/Henry/AppData/Local/Temp/AuraPEQ/freedsp-m2p-aa02128f24704c3284b5da2b9592719b.log; SHA25626d4efdf43b460874047257705577b4b119c1ec47a85bf5fa00f26d3f42e1c7e. Baseline completionline97; recorded Path0line471, Path1line1131, Bothline1643; all saved in log despite missing prior final aggregate. O may record recollected toggle effects afterRestore; this is Henry's reported listening validation, not an instrumented channel-amplitude measurement. Raw logs remain outsideGit.
M2O protocol/effect/recovery passed but stereo failed because Web190word0 was always0: onlyLEFT coefficient path updated. M2Q changes isolated debug RAM operations to identical path0/path1 pairs for each requested wire; no production replacement. Single-band2writes; full-nine18writes orderedwire1path0,wire1path1,...,wire9path1. Disabled andRestore unitybothpaths. FixednegativePKscope/math/current346 lookup preserved. Precompute/validate allfiveknownrateplans beforeANYSET; matching346 chooses oneplan; unsafeatanysupportedrate rejectsbeforecommands, unknownrate stopsno190. Existing188/187 prerequisites remainexplicit/logged. No retry/rollback; failure may leave unequalchannels andrequiresSTOP/review.
M2Q firstmanualWebgate: fillBand5=400/-12/Q1, explicitpairedApply/listen(bothears equal,center), pairedRestore/listen(bothbaseline), manualconfirmation. Freshpagegate requiredbeforefullnineApply; fullRestore remainsavailablefor explicitunity. Thenfillnegativefullninepreset, paired18Apply/listen/confirmation, paired18Restore/listen/confirmation. No Flash/preamp/positivegain/nonPK/persistence/EQreadback claims; hardwareandprotocolsuccessremainseparate. Codexdidnottesthardware. M2Q softwareREADY, WebstereogatesPENDING.

M2Q decision: promote0=LEFT/1=RIGHT tohardwarevalidatedmapping for thisFreeDSPtarget,notofficialnames. Paireveryisolateddebugrequestperwire,calculatecoeffonce/reuseboth,fullfive-ratepreflightbeforeanySETtofulfillwrite-preparationrequirementwithoutassumingcurrentrate. Conservativelyrejectfilterunsafeatanyknownrate;346selectsactualrate,no fallback andnotfive-ratewrite-loop. Exactpacketperrequest allowlist andglobalSafeRam.IsAllowedReport remainunchanged. GatefullnineApplyonfreshBand5Webstereoreversal; pairedRestoreavailablewithoutgateforunitycleanup. PreserveproductionSync/bridgeAPI/188187/currentrate/math andnegativePKlimits. OptionalCLIaggregateprintsallrecordedobservationswithoutinferingnewpass. Do notpromoteM2Qtohardwarecompletefrommocks.

### M2R manual evidence gate
LocalStorage gate is user-reported evidence, not device readback or authentication. Exact P1/P2/negative Apply and Restore records plus centered/recovery confirmation are required; latest contradiction and new hardware operations revoke old approval. Full-nine explicit Restore remains available after STOP, is a distinct unity request, and never an automatic failed-packet retry.

## M2S — use upstream WebHID, keep native diagnostic
Normal FreeDSP connection uses existing chooser/open/device registry and dsp Sync abstraction; exact CAF collection chosen before open. No permanent native metadata/experimental Connect panel. Native62 versus WebHID61 is framing only; shared TS CAF codec and native-generated fixture test payload equivalence without claiming hardware event delivery. Native debug is optional -NativeDebug, never production dependency. M2G/H Input GET_REPORT limitation retained. Match report1/header/reply/command/CTRL; command346 requires known rate, count0 ACK accepted without invented echo. Sequential operations and STOP reduce stale risks but indistinguishable same-command ACK cannot be proven fresh; no unsupported transaction field introduced. No Flash/preamp/utility/implicit drag writes.

## M2S UX follow-up — distinct local and RAM controls
Keep upstream Hardware Memory Controls and existing tested restoreFreeDspUnity WebHID path. Explicitly show Restore after FreeDSP connect; keep long explanation outside action flex row and allow FreeDSP row wrap. SEND TO DEVICE disabled forFreeDSP, no alias semantics assumed. Source setABCompareState uses in-memory EQ/globalGain snapshots and skips sync onFreeDSP; A/B/OFF preserved as local states, withFreeDSP-only9band default. RESET TO FLAT remains local; unity Restore is independent action. No transport/serializer/coefficient changes.

## 2026-10-08 — M2S native transport exception, one normal UI
Henry's one real188 WebHID transaction produced no matching input event and stopped before190, consistent with M2G. Native Input GET_REPORT was already hardware validated. This is concrete evidence for a transport capability exception, superseding the previous pure WebHID candidate. Never weaken reply validation or redo validated PEQ research to bypass it.
Common TypeScript owns serializer, coefficients, safety and precomputed stereo RAM sequencing. Native production-candidate helper accepts only exact CAF packet primitives188/187/346/190; metadata Connect does no SET/GET; no /ram business endpoint in normal serveTransport mode. Diagnostic tools remain separate references. One original CONNECT chooser identifies FreeDSP, releases browser ownership and confirms unique native CAF metadata, then original explicit Sync/Restore dispatches below UI. Other DAC protocols unchanged. dev.ps1 owns helper lifecycle, including serveTransport identity; Windows/.NET10 required; native main UI gate pending Henry.

## 2026-10-08 — PEQ UX after hardware PASS
Accept Henry-reported normal graphical/native RAM/stereo/Restore/positive-negativePK PASS. Remove temporary M2R+6/+6.1 gates; retain±12 per-band/range/finite/stability/quantization preflight and existing main warning/confirmation. FreeDSP AUTO REDUCE cannot compensate with unsupported preamp; local enabled positive gains are reduced only (per-band10 then proportional positive budget12 as a conservative user-selected adjustment, not a new hardware cap), requires a new explicit Sync.
Choose immediate logged gain clamp at editor boundaries, not hidden sender clamp. Apply across imports/render/history/Slots/connect and direct setter; reject nonfinite direct gain, invalid stored gain0 with log. Keep non-FreeDSP semantics unchanged.
Upstream Defaults generic10/Q.75 (JA11own5), Flat resets currentcount to1000Hz/Q1/PK/enabled and genericSync; Free early-return branches instead local9/Q.7 spread defaults or preserve structure and zero enabled gain. Slots remain host snapshots, OFF restoresA; Free B uses local9 defaults. No hardware TX or ten-wire Free plan.
Bind Vite/dev localhost so printed clickable URL matches helper Origin, rather than broaden host/CORS permission.18 quiet repeated pops are temporal correlation with18 path writes, not proven190 causation; no smoothing workaround/extra command without evidence. Preamp next; no implementation of future controls here.

## M2T research checkpoint — evidence threshold
New controls require a verified FreeDSP command/interface mapping, field units/sign/range and response semantics before integration. Bounded APK method/symbol absence means UNKNOWN, not proof of absent hardware support. Generic utility commands, mic biquad math exports and dongle LRDetect flags do not satisfy that threshold. Preserve original other-DAC behavior and all nine verified user PEQ slots.

## M2T durable controls policy
Preamp (negative and positive), per-channel globalgain/balance and mic gain/loopback/levels remain UNKNOWN; current FreeDSP adapter does not support Tone Tilt. Do not infer a master gain from command190 Gain, a balance command from LRDetect, or mic controls from generic CX2077x conversion exports/button monitoring. Pinned all-DEX/static native inventory is reproducible, but not firmware/UAC/capture evidence. Auto Preamp depends on a working hardware gain command; do not enable it as a supposed software-only feature. Preserve all nine user PK slots; no shelf allocation or nine-band balance emulation.
Only exact35D8:1496 UI is restricted. Clear stale local Tilt/preamp display on connect, block delayed Auto Preamp activation, cancel random mic animations and explain unavailable controls. No production sender/transport/coefficients changes. UNKNOWN controls have no hardware test in the combined session; future implementation requires interface/module/command/field/sign/range/reply evidence. Original generic Flat's1000Hz collapse is explicit ea93274 behavior; retain it for other DACs. Henry reports Free nine defaults/structure-preserving Flat PASS. Flash/persistence LAST.

## 2026-10-08 — UPSTREAM PR COMPATIBILITY RULE

Decision: temporary development/debug UX differences are permitted to accelerate FreeDSP validation, but they are not automatically suitable for an upstream PR.

1. Before opening a PR, review every FreeDSP-specific UI/UX deviation against the original author's architecture and interaction semantics.
2. Prefer upstream behavior unless verified FreeDSP hardware requirements conflict.
3. Keep device-specific overrides behind FreeDSP-specific branches/guards rather than changing generic behavior globally.
4. Exclude debug-only pages, temporary validation controls, redundant connection entry points and local-only experimental UX unless genuinely necessary for production support.
5. Preserve other DAC semantics for Reset Defaults, Reset to Flat, Tone Tilt, Preamp, Balance, Mic and storage. FreeDSP overrides require verified hardware/protocol justification.
6. Perform an explicit **upstream cleanup pass** before PR creation: compare fork/upstream behavior, remove temporary debug surfaces, minimize FreeDSP-specific code, preserve original naming/style and document unavoidable architectural exceptions.
7. Retain the minimal, documented Windows native HID transport exception: FreeDSP requires host-initiated Input GET_REPORT, which browser WebHID does not expose. This requirement is verified for the current FreeDSP response flow; the helper remains transport-only.

Priority decision: PEQ RAM is hardware PASS. Preamp remains the highest-priority unresolved feature; seek a real FreeDSP global gain/preamp control rather than PEQ emulation. Flash/persistence remains last.


## M2U — real preamp remains blocked; distinguish endpoint volume from DSP headroom
Decision: no production or diagnostic gain writes this round. PEQ RAM hardware PASS is unchanged; real preamp research has highest priority and persistence stays last. Preamp must not be synthesized through PEQ.
Verified static path: official APK PCM JNI setGlobalGain -> pcm_mixer_set_globle_gain -> powf(10,gain/20) -> float at mixer-object offset4. This setter updates software PCM state, not a CAF/USB register. Airoha master gain and newer Moondrop Hub pregain belong to other protocol/device families. FreeDSP Studio's exact1496 gen1 preamp is explicitly baked into a biquad, therefore excluded.
USB Audio Feature Unit volume is a valid standard mechanism but LOW/unknown for this device: no complete AudioControl topology, permissions, range or pre-DSP placement has been recovered. No speculative entity-ID probe. Master/per-channel output attenuation would not automatically establish a true PEQ headroom control.
Dart AOT libapp.so contains USB/BLE pregain names; strings lack an exact1496 dispatcher/payload association. This remains an unresolved static lead, not a verified command and not proof hardware lacks preamp.
Before PR the existing upstream cleanup rule applies to all FreeDSP UX and the verified Windows Input GET_REPORT transport exception: preserve author semantics/style, remove debug-only surfaces, minimize isolated overrides/helper dependency, preserve other DACs. M2U adds analysis/evidence only, no architecture/transport/runtime change.


## Control Research Round1/4 — descriptor-supported volume, preamp unverified
Decision: close Round1 after exact-device topology acquisition; no control writes, main UI integration or driver replacement. Native/CAF/PEQ runtime unchanged.
Primary evidence: Windows hub connection-info exactVID35D8/PID1496 device descriptor and one complete422-byte configuration, standard GET_DESCRIPTOR only. UAC2 bcdADC0200, ACinterface0. Playback USB inputterminal1 -> FU2 -> headset outputterminal3; input cluster2channels/bitmap3 names LEFT/RIGHT. FU2 masterbitmap3 has Mute RW/Volume absent; logical1/2 bitmap0xC each has Volume RW/Mute absent. Capture microphone4 -> monoFU5 -> USBoutput6 is independent. No Mixer/Processing/Extension entities in this configuration.
Do not conflate descriptor Volume support with a pre-PEQ gain stage or with CAF path selectors. Physical CAF DSP placement is not described. No CUR/RANGE values obtained: selected hub API forces standard GET_DESCRIPTOR and audio function is usbaudio2, not WinUSB. Do not replace class driver or substitute Windows endpoint volume as raw USB evidence. KS/DeviceTopology read-only access may expose driver-mapped values but was not implemented/tested and would need a separate evidence distinction.
Research is limited to4 rounds total:1AudioControl/FU (COMPLETE),2official pregain exact-device chain,3remaining CAF/firmware candidates,4cross-validation/finaldecision. After4 freeze unresolved controls as UNKNOWN/UNSUPPORTED, proceed Flash/persistence then release/upstream cleanup; further control research requires Henry's explicit change. PEQ hardware PASS and preamp highest priority retained; preserve upstream UI semantics/style and minimal native transport-only exception.

## Control Research Round2/4 — close incompatible official SPV lead
Decision: no production pregain implementation. Exact1496 route not found, true Preamp confidence LOW. Official SPV logical setter0x23/Q8.8 is concretely recovered, but Lju2.j/Lbt4 require HID interrupt IN+OUT and captured1496 HID has only IN83. Audio isochronous OUT cannot substitute. The misleading CTRL-OUT log does not change actual bulkTransfer call. This excludes the recovered SPV transmitter for this configuration, not every unknown firmware/API route.
Separate BLE0x0A/sub7/hundredths-dB and PEQ-derived BLE debug pregain do not establish1496 hardware support. SPV omitted saveToFlash=true forbids assuming its setter is RAM-only. No format transplantation, PEQ emulation, OS-volume substitute or hardware probe.
Static AOT profile is UNVERIFIED; only bounded recovered names/pool literals cross-checked against ARM64 direct BL and DEX/JNI are used. Do not infer field layout from inaccurate type labels or claim an exhaustive graph with17225 unresolved indirect calls. Remote/cached exact-device function map was unavailable.
Round2 COMPLETE,2 rounds remain. Round3 remaining CAF/firmware candidates only, separately authorized; after4 freeze unresolved controls. Round1 UAC L/R volume/capture controls remain independent descriptor candidates, with real pre-PEQ headroom unknown. Main controls remain disabled, native helper/runtime/otherDACs unchanged, Flash last and upstream cleanup rule retained.

## Control Research Round3/4 — close known CAF control space
Exact SDK XML/factory association35D8:1496 -> Freeman3 is HIGH source evidence. This does not validate optional firmware flags/queries. All10 observed/source-backed families classified;346 additionally has saved-mode subkey90 alongside62/84/64. No independent globalgain/Balance/Mic/Tone command discovered. LRDetect boolean is not Balance,190 Gain is exponent and477 gain is per-band. Unnamed bits/words stay UNKNOWN, never become speculative writes or probes.
No new HIGH/MEDIUM CAF control candidate survives. Preamp LOW (UAC placement unknown); Balance MEDIUM via exact FU2 L/R Volume; Mic MEDIUM via exact FU5 mono Volume/masterMute; independent Tone LOW. HIGH descriptor support is separated from unverified ranges/values/backend/behavior. Keep all these main controls disabled; no runtime integration, PEQ emulation or silent Tone shelf allocation.
Round3 COMPLETE,1 final round remains. Round4 only final cross-validation and bounded implementation decisions; no new broad research or Round5. After4 freeze unresolved controls UNKNOWN/UNSUPPORTED, then Flash/persistence/release/upstream cleanup. No physical access or Round4 automatically authorized by this analysis. Preserve upstream semantics and minimal transport-only native helper.

## Control Research Round4/4 FINAL — Windows hardware getters / production freeze
Decision: close all four control research rounds; no Round5. The two surviving descriptor candidates have a documented driver-backed access route without replacing usbaudio2: exact matched adapter IPart.Activate(IAudioVolumeLevel/IAudioMute). Direct hardware interfaces and endpoint hardware mask3 agree. This is stronger than generic endpoint-volume evidence but not a returned USB bUnitID/raw CUR/RANGE.

| Control | Final confidence | Final status | Hardware validation | Decision |
|---|---|---|---|---|
|Preamp|LOW pre-PEQ/headroom semantics|FROZEN-UNKNOWN|Placement/headroom unproven|Do not call hardware attenuation Preamp or emulate with PEQ|
|Balance|HIGH hardware path/read/range; FU correspondence inferred|DIAGNOSTIC-ONLY|Read PASS; setter/listening/restoration pending|Temporary guarded original-state CLI only; main UI disabled|
|Mic|HIGH mono hardware Volume/Mute/read/range; FU correspondence inferred|DIAGNOSTIC-ONLY|Read PASS; setter/recording/restoration pending|Basic capture controls only; no sidetone/loopback/AGC; main UI disabled|
|Global Tone|LOW independent mechanism|FROZEN-UNSUPPORTED|No independent control validated|Unsupported in current adapter; not proof of silicon absence; no PEQ allocation|

Playback original -74/-74dB and muted; capture0dB/unmuted; ranges-74..0dB, step.5. No setters executed by Codex. Known current playback cannot qualify for attenuation; Henry must choose a low audible baseline before a future manual session. Explicit tests never boost beyond original values; center restores original asymmetry. Each action revalidates identity/range and all target levels before first write; first failure stops with original snapshot retained. Restore behavior is supported by documented setters and prepared code, not yet hardware-validated.
Next FLASH / PERSISTENCE, then release/upstream cleanup/PR. Pending known-interface manual checks do not reopen research or authorize production integration. Preserve upstream semantics for other DACs and transport-only native helper. Evidence and concise manual sequence: tests/freedsp/fixtures/freeDspWindowsAudioEvidence.md.

## 2026-10-08 — FINAL FreeDSP production scope / shutdown checkpoint

| Feature / control | Final evidence / production decision |
|---|---|
|9-band stereo PEQ RAM|HARDWARE PASS, Henry-reported|
|Sync RAM|HARDWARE PASS, Henry-reported|
|Restore Unity|HARDWARE PASS, Henry-reported|
|Reset/default UX|PASS, Henry-reported|
|Channel Balance UAC L/R|HARDWARE MANUAL PASS, Henry-reported; DIAGNOSTIC-ONLY; no production integration|
|Mic UAC Volume/Mute|HARDWARE MANUAL PASS, Henry-reported; DIAGNOSTIC-ONLY; no production integration|
|Mic hardware range|-74..0dB, step0.5dB; positive boost unavailable through this control|
|Preamp|FROZEN-UNKNOWN; no proven pre-PEQ/headroom control|
|Global Tone|FROZEN-UNSUPPORTED in FreeDSP production adapter|

DO NOT integrate Channel Balance for FreeDSP: technically hardware-verified, but low product value for the current FreeDSP scope. DO NOT integrate Mic Volume/Mute: Henry needs microphone amplification, while this verified control provides attenuation only. Retain both diagnostics/evidence for future reference; validation-only runtime surfaces must still be reviewed/removed from the production PR. These are deliberate production exclusions, not failed hardware tests.
Henry's new manual PASS supersedes the earlier pending setter/listening/recording/restoration status for Balance/Mic; no new test was performed by Codex at this checkpoint. It does not establish pre-PEQ placement or convert inferred Windows-node/FU numeric correspondence into raw USB evidence. Control research Round1/2/3/4 COMPLETE; no Round5 and no reopening.

### Upstream audit finding / PR compatibility boundary
The inherited setDacBalance implementation uses Savitech command22 (src/dsp.ts). Its intended SAVITECH protocol device list (src/constants.ts) includes Audiocular Aura, TRN Black Pearl, Fosi Audio DS2 / iBasso DC04 Pro, JCally JM20, and JCally JM20 Pro / compatible Savitech. This is source-level protocol coverage, NOT per-model hardware validation.
The inherited UI change handler calls setDacBalance without a per-protocol capability gate (src/main.ts); the fork already guards exact FreeDSP in the sender. Current upstream source has no equivalent Balance implementation for MOONDROP, CONEXANT or FIIO/FIIO_JA11 families. Do not infer generic balance support from a visible slider.
Microphone Loopback Monitor meter animation uses Math.random and simulated peaks (src/main.ts), not real hardware microphone-level telemetry. Preserve upstream behavior for other devices; before PR ensure FreeDSP does not misleadingly expose excluded Balance/Mic, simulated microphone meters, frozen Preamp/Tone or other unsupported controls. No generic behavior changes are authorized by this checkpoint.

### Final FreeDSP production target / next milestone
1. Connect / minimal native transport
2. 9-band stereo PEQ
3. Sync RAM
4. Restore Unity / reset UX
5. FLASH / PERSISTENCE
6. Release cleanup
7. Upstream compatibility cleanup
8. PR preparation

NEXT MILESTONE = FLASH / PERSISTENCE. Flash is the only remaining hardware feature milestone before release work. Not started at this checkpoint. No Balance/Mic integration, control research, implementation or hardware operation is authorized here.

## 2026-10-08 — FINAL product scope and upstream strategy (authoritative)
This checkpoint supersedes earlier temporary reset policy and narrower feature lists. Documentation only: these are final product requirements, not newly implemented or hardware-tested behavior.

### Device / protocol scope
Current upstream KNOWN_DACS contains one CONEXANT device: Moondrop FreeDSP, VID0x35D8/PID0x1496, Conexant/Freeman DSP. Current CONEXANT-specific production branches therefore effectively target this FreeDSP only; this is not permission to generalize unverified devices or alter other protocols.

### Supported FreeDSP product scope
Keep normal CONNECT, verified Windows native HID transport,9-band stereo PEQ, Real-Time PEQ Response Curve, graphical/editor controls, RAM Sync, Restore Unity, local presets/import/export/undo/redo where applicable, Reset Defaults, Reset To Flat, and Flash/persistence once validated. Flash is not yet validated or started here.
Exclude FreeDSP production Preamp/Auto Preamp, Global Tone Tilt, utility Filter Type (DAC filter), Amp Mode, Gain Mode, Channel Balance, Microphone Gain and Microphone Loopback Monitor. The utility Filter Type exclusion is distinct from PEQ band filter types and is not permission to expand their verified scope. Preamp stays FROZEN-UNKNOWN; Global Tone stays FROZEN-UNSUPPORTED. Balance and Mic UAC Volume/Mute are Henry-reported HARDWARE MANUAL PASS but deliberately excluded from production; retain diagnostics/evidence. Mic range-74..0dB/step0.5 provides no positive boost. Four-round control research is closed; no Round5 or reopening unless new exact-device evidence appears and Henry authorizes reconsideration.

### Final reset semantics / upstream compatibility
- RESET DEFAULTS: exactly9 FreeDSP bands at31/62/125/250/500/1000/2000/4000/8000Hz, gain0dB, Q0.7, PK. Never expand FreeDSP to generic10bands.
- RESET TO FLAT: rebuild neutral bands at1000Hz/gain0dB/Q1.0 using the author's existing semantics, respecting active device count: generic10-band device gets10bands; FreeDSP gets9bands.
- This explicitly supersedes temporary FreeDSP development behavior that preserved frequency/Q layout while zeroing gains. The old behavior remains historical implementation evidence, not final product policy.
- Root bug: generic reset functions assume10bands instead of device-specific count. Fix FreeDSP count during the future cleanup milestone; do not globally change other DAC reset semantics. Local resets remain distinct from explicit hardware Restore Unity. No reset runtime changes made at this checkpoint; the final FreeDSP flat layout is still a cleanup requirement.

### Upstream audit / PR boundary
Upstream has a dedicated9-band CONEXANT path, but its partially reverse-engineered Conexant PEQ/Flash implementation is not fully hardware validated. Fork's verified RAM hardware results do not validate upstream Flash. setGlobalGainConexant is a no-op. Upstream Global Tone Tilt is software composition into effective PEQ gains, not independent FreeDSP hardware Tone.
Filter/Amp/Gain/Balance/Mic utility setters use Savitech commands, not FreeDSP implementations. Microphone Loopback meter uses Math.random/simulated peaks, not hardware telemetry. Source device/protocol coverage is not per-model hardware validation. Before PR, hide/disable unsupported FreeDSP utilities, remove debug/development-only surfaces, preserve upstream naming/interaction semantics where compatible, retain only minimal isolated transport exceptions and leave other DAC behavior unchanged.

### FINAL roadmap (supersedes earlier cleanup ordering)
1. FLASH / PERSISTENCE — the ONLY remaining hardware feature milestone.
2. Upstream/product cleanup: FreeDSP Reset Defaults9bands; Reset To Flat9 x1000Hz/Q1/0dB; hide/disable unsupported utilities; remove debug/development-only surfaces.
3. Final production build / release candidate.
4. Final regression verification.
5. Push final branch.
6. Upstream PR.

NEXT MILESTONE = FLASH / PERSISTENCE. No Flash, production implementation or hardware operations started in this documentation checkpoint.

## FreeDSP Flash / persistence — READY / NOT YET HARDWARE PASS (2026-10-09)
This milestone authorizes only exact35D8:1496 FreeDSP PEQ persistence, not reopened control research or broader cleanup. Existing Save to Flash workflow now dispatches through native transport and the isolated complete plan; never browser-only send/fallback. Existing RAM188/187/346 +18paired190 sequence and other DAC protocol implementations unchanged.
Official source/dump plan:90 custom0 ->9metadata ->45band/rate coefficients ->220 commit255 last (56exchanges,55command220). Metadata gain=trunc(dB),Q=trunc(Q*256),frequency integerHz,PK0. Coefficients use same RAM-validated dynamic scaling/sign/stability model; rates4..8 (44100/48000/96000/192000/384000). Flash first word is class/rate bank, NOT RAM L/R path; no invented stereo duplicates. Source stores one coefficient set per band/rate; stereo boot application remains unvalidated. No extra188/187/346 or post-save90. Partial commit atomicity/boot activation/fractional metadata reload precision unknown.
Validate all9bands and all45coefficient packets plus complete unity recovery before first SET. Disabled persists metadata gain0 and identity coefficients, no enabled flag claim. No Tone/Preamp/Balance/Mic data. Exact local editor/plan/unity plan saved in localStorage aura_freedsp_flash_recovery before writes; storage failure means zero writes. This is not previous-device-Flash readback/backup. Shared BUSY/STOP gate prevents RAM/Flash overlap. Each packet once SET -> Input GET -> matching ID/prefix/CTRL/command/reply/count0; first mismatch/error STOP immediately, no retry/rollback/factory reset. Log exact ACKED n/56 and failed/unknown label. Explicit RAM Restore is live only; persistent unity requires a separately confirmed new Save.
UI clearly distinguishes RAM Sync and SAVE FREEDSP TO FLASH (PERMANENT); completion is protocol ACKs only, never persistence PASS. The old FreeDSP Flash-disabled rule is superseded only for this evidence-derived explicit Save candidate. Native helper remains transport-only; changes add bounded90 custom0/three220shape allowlists and strict response matching, not coefficient math/business sequencing.
Evidence/reproduction/manual steps: tests/freedsp/fixtures/officialFlashEvidence.md/json and scripts/freedsp/analyze-flash.mjs. Importable safe test profile freeDspFlashTest.txt: ninePK/1000Hz/Q1;Band5=-6dB,others0. Before test use normal CONNECT, APO OFF, low Windows volume and explicit RAM unity baseline; Sync negative profile once, then Save. Check all56matching ACKs including commit. Fully remove USB power,wait5seconds,reconnect WITHOUT new RAM Sync/Save; both ears must retain centered EQ. Only Henry's report of that result permits HARDWARE PASS. No hardware access by Codex.
Final reset decisions unchanged: Defaults9specifiedfrequencies/Q0.7/0dB/PK, final Flat9 x1kHz/Q1/0dB; implementation of the latter remains future cleanup, no global other-DAC reset changes here. After hardware persistence PASS: upstream/product cleanup -> final build/release -> regression -> finalpush/upstream PR. No PR created this round.
