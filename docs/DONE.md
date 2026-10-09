## 2026-10-09 — Final upstream UI cleanup / offline checkpoint
- Recorded Henry's manual acceptance of CONNECT readback in original curve, OFF/A/B retention, gain/reset workflow at05a8368; retained previously reported stereo RAM and Flash persistence hardware PASS. No new hardware operations in this round.
- Changed misleading Last Applied/local counter/rate/firmware labels to accurate English FreeDSP status; hid false Level Matched claim. Kept accepted slot/editor/reset/gain/graph behavior.
- Translated FreeDSP dialogs/tooltips/errors/results, removed obsolete development descriptions. Supported profile imports stay local and explicitly ignore unsupported preamp; other DAC preamp/sync retained. Protected Flash status against stale connection callbacks.
- Audited refreshed upstream/main af0bcf7 production changes and retained necessary exact-device guards/native GET_REPORT exception. Native/RAM/Flash numeric algorithms and readback decoder unchanged.
- Final verify.ps1 PASS: TypeScript, production build and 33 test files / 322 tests, including eight new release UX tests. Native93 offline mocks PASS; native build zero errors/warnings. git diff --check PASS. Identified concrete upstream deployment blocker: helper accepts only localhost5173 and static deployment does not install/distribute it. No PR/release submitted.

## 2026-10-09 — Final Readback UX implementation / offline checkpoint
- Removed the main-page duplicate preview card/graph/table and development debug link; retained original curve and OFF/A/B controls.
- Integrated fixed CONNECT readback into existing canvas using raw path0 coefficient projection. Preserved local editor and rejected stale/failing capture.
- Added confirmed nine-band approximate local A/B with explicit local ON assumption; immutable A, B copy/edit detachment, OFF preservation and reconnect preservation.
- New UI strings are English. No protocol/native transport/RAM190/Flash220/coefficient changes; no hardware operations, PR or release this round.
- Focused 41 tests PASS, native 93 synthetic/mock tests PASS, isolated native build zero warnings/errors. Final verify.ps1 PASS: TypeScript/production build and 32 files / 314 tests; git diff --check PASS. Expanded editor/reset/import focused tests: 68 PASS. Manual UI acceptance remains pending Henry; no new hardware PASS inferred.


### Localhost smoke — Round1
- dev.ps1 running: Vite at http://localhost:5173/ andnativehelper127.0.0.1:5174. BrowsernavigationAccept:text/html rootHTTP200,previewmountpresent,fn/readbackPreview/nativeTransportmodulesHTTP200;sessionM2S CAF TRANSPORT/tokenshapePASS. NoGUIbrowserautomation;visualmanualconfirmationpendingHenry.
- An initialPowerShellHTTPrequestwithoutAcceptreturnedVite404;browsernavigationheaderverified200,notanapplicationroutingdefect. NoViteconfigurationchange.

### Final verification — Readback Round1
- Focused6files/65tests PASS; finalverify.ps1 PASS:TypeScript/productionbuild and31files/305tests. Nativeisolatedbuild zeroerrors/warnings;93offline/mocktestsPASSincludingfixedread-onlyHTTPtoken/BUSYgatesandexistingRAM18/Flash56goldens.
- Actualauthenticated/session/connect/readback physical chain PASS with18matchingframes. No190/220/mode/resetwrites. Exactnine-bandvalues replayvalidatedfromthreeactualcaptures;34648kHz confirmed separately.
- PowerShellsandbox initiallyblockedVitestTEMPrename andmockHTTPsockets;rancheckswithordinaryuser sandboxescape,noadministrator/ACLchange. Generateddist restoredtoHEAD because not a release;onlyown temporarytestbuild removed. gitdiffcheckPASS.
## 2026-10-09 — Readback Round1 implemented and physically queried
- Threeactualnine-bandcaptures(Henry+Codexstandalone+authenticatedHTTP)each18matchingframes,allrawRXequal. One346queryconfirmed48kHz. Codexonly37fixedquerySETs,noRAM/Flash/mode/resetwrites.
- CorrectreadbacknegativeGaincontainerdecoding;SDKsigned-byte getter andactual477fields revalidated. Nineparameter/45coefficientwordsoffline agreewithinmodelquantizationneighbors;Band4matches-1not-1.5. FulloriginalfractionalGain/enabled/source/stereo notclaimed.
- ImplementautomaticnormalCONNECTread-onlypreview:fixedauthenticated/readback,nativeexactdevicegate,all18raw/correlation/timingvalidation,atomicnine-rowtable/nonflatprojection,localEditor/presets/A-Bpreserved,firstfailureUnknownfallback,race/disconnectguards. NoautomaticSync/Flash;verifiedwritealgorithmsunchanged.
- HardwareHTTP/session/connect/readbackchainPASS. Focused65testsand93native/mocktestsPASS;zero-warningnativebuild. Finalverify/diffchecktrackedintheverificationappendix. NoComputerUse/PR/release. FullpreciseeditorReadbackBLOCKED;usefulpreviewREADY.

## 2026-10-09 — Controlled nine-band read-only tool ready
- Implementedisolated scripts/query-freedsp-nine-eq.ps1 / pollNineEq withfixed446path0wire1..9 then477band1..9,max18SETonceeach,strictper-querymatching/pendingGET-onlydeadline,firstfailureSTOP. Exactdevice/CAFgateandbyteallowlist,no mode/writes/productionCONNECTchanges.
- Addedraw/timing/API/correlation/query-contextcapturewithpartial/finalJSON,source/freshness/stereo/productionflagsunverified. ProvidedcontrolledAppcomparisonmanualguide,includingoperationtimelineandlaunchconfounds.
- Henry-reportedone446wire2nonunitymatchingframeSET1/GET1recordedassingle-sessionevidence,notpollingfixorfullReadbackPASS. Newrawcapture not supplied here.
- Offlinebuildzeroerrors/warnings;92native/mocktestsPASSincluding6newninegroupsandexistingWire2/RAM18/Flash56regressions;PowerShellAST/diffcheckPASS. NoCodexhardwareoperations. FullReadbackandCONNECTautomaticloadingBLOCKED. NoPR/release.


### Offline verification / scope — controlled wire2 polling
- Isolated native testbuild PASS;86offline/mock tests PASS(7newwire2 groups). IncludesexistingRAM18/Flash56/normalHTTP/oldreadbackgolden/mock regressions;nohardwareaccess.
- Initialnewwrong-commandtest changedonly446'slowbyte(also190);corrected tofullcommandfield. Rerun86testsPASS. No production defect inferred from that test-fixture mistake.
- PowerShelllauncherAST parse andpartialJSON/StreamWriterroundtrip PASS. Actualhardwarelauncher notexecuted;no devserver/buildrelease/PR/release.
- FreeDSP-specific files changed:isolatedWire2Polling andnewlauncher;nativeProgram/SafeRam onlyopt-in fixedCLI registration/conditionaldiagnosticbanner.
- Analysis/test files changed:7nativewire2mockgroups andfreeDspWire2Polling.md;fourdocs/Issue3pack updated.
- Sharedfrontend/runtime files changed:NONE. Native normalHTTP/CAFparser/oldreadback/transportexchange/RAM190/Flash220/writealgorithms unchanged.
- Non-FreeDSP protocol code changed:NO. FullReadback/source/enabled/stereo/freshness/CONNECTbaseline remainBLOCKED. READY FOR SINGLE HARDWARE QUERY only.

## 2026-10-09 — Controlled single446 wire2 diagnostic implemented offline
- Added Wire2Polling fixedquery/classifier/GET-only loop andexactCLI registration. Preservedexistingexactdevice nativeHIDgate,oldreadback,normalHTTP,CONNECT andRAM190/Flash220 flows.
- Added separate no-argumentPowerShelllauncher withisolatedhelperbuild,ownedchildtimeout,AutoFlushlog,incrementalpartialJSON andfinalJSONpaths. Actualscript/hardwarequerynotexecutedbyCodex.
- Added7nativeoffline testgroups coveringactualpending→syntheticmatch,repeatedpendingtimeout,strictincorrect/stale tuple/format rejection,disconnect/API/exception/latecompletion,byte-exactallowlist andnormalHTTP rejection. NohardwareReadbackPASSclaim.
- Status:READY FOR SINGLE HARDWARE QUERY;fullReadback remainsBLOCKED. Fourdocs/Issue3pack updated.


### Offline verification / scope — physical capture analysis
- Focused3files/30tests PASS(capture8,staticreadback8,Flash14);complete npm test PASS:TypeScript test check and30files/297tests. Native isolated testbuild/79mock tests PASS including actual-capture replay;localhostHTTPmock/fakechild only,noHID access.
- Initial analysis-tool/test integration exposed Windows newline normalization andtest-extension discovery issues;normalizedredactedlog/matchedconfigured.test.ts pattern. Hash/TX/RX consistency,redaction andall8capturetests subsequentlyPASS.
- No verify.ps1/buildrelease/devserver/hardware operation performed in this analysis round. Existing RAM18/Flash56goldens passed;no new hardware readback/source PASS claimed.
- FreeDSP-specific files changed:static evidence extractor andoffline capture analyzer/declaration only.
- Analysis/test files changed:primary hashedJSON,TX/RX-preserving redactedlog/provenance/derivedanalysis,detailedreport,capture8tests andnative mockreplay.
- Shared runtime files changed:NONE. Native/diagnostic/HTTP transport,CAFparser,RAM190,Flash220 andproductionUI unchanged.
- Non-FreeDSP protocol code changed:NO. Fourdocs/Issue3pack updated;fullReadback/automaticCONNECT/device-baselineA-B remainBLOCKED. NoPR/release.

## 2026-10-09 — Physical readback analyzed offline
- Located Henry'sactualreadback files,hashedoriginalJSON/log,preservedJSONbytes,redacteddeviceinstancepaths onlyandnormalizedloglineendings. Cross-checked12TX/12GETbuffers,extracted failedRX omittedbyJSON.
- Added deterministic offline captureanalyzer/typedinterface/savedanalysisand8capturetests;extendedpinnedstaticextractorwithofficialQdecimalroundingmethod. Verified477ninefullrows,446wire1unity,andfailed446byte14difference againsteveryloggedTX/RX.
- Added native mockreplayofactualcapture;reproducesSTOPat12thquery/firstreply0,withsyntheticlaterreplyleftunread. Nohardwarecommandsorproduction/diagnostic runtimechanges.
- Recorded Henry'snonflatstate/later09:37Appscreenshotasuserobservationwithtimingconfound. UpdatedfourdocsandIssue3pack;fullReadback/DeviceA-Bgate remainsBLOCKED.


### Automated verification / scope — required readback round
- Focused4files/66tests PASS:static getter/units,synthetic nine replies,malformed/stale band/opaque446/source ambiguity,nonunique unity,actual canvas active/A-B response extension,connection races/no auto writes/gain/reset/RAM/Flash regression.
- Native isolated build PASS;78offline/mock tests PASS including19fixedqueries,mutation/HTTP allowlist rejection,partial/error/stale477/timeout andwrong-device gate. Initial loopback socket10013 sandbox failure resolved with permission forlocalhost mock/fakechild only;noHID access.
- PowerShell diagnostic launcher AST parse PASS;launcher hardware execution deliberately not performed.
- Final verify.ps1 PASS:TypeScript/Vite,29files/289tests. Existing RAM18/Flash56golden plans andgain/reset assertions PASS. Generated dist and isolated .tmp/readback output excluded from delivery.
- FreeDSP-specific files changed:graphScale/offline readback parser andisolated native ReadbackQuery/CLI registration.
- Analysis/test files changed:static APK inspection/script,raw evidence/field matrix,read-only launcher,focused TS/native mocks andprior derived Q-unit reference correction.
- Shared runtime files changed:src/peq.ts,FreeDSP graph-only guard/display transforms. Native Program/SafeRam addfixed opt-in operation;normal HTTP transport andwrite allowlist unchanged.
- Non-FreeDSP protocol code changed:NO. Coefficient math,RAM190/Flash220serialization and18/56write plans unchanged. No hardware operations,PR orrelease.
- Production automatic readback/device-derived immutable Slot A andeditable copy B:BLOCKED until enabled/source/stereo/freshness evidence andhardware acceptance;not an implementation PASS.

## 2026-10-09 — Required readback research and isolated offline diagnostic
- Re-extracted pinned official APK DEX/ARM64 evidence without executing it; saved reproducible inspection script and full selected method/caller/field/native traces. Traced Flutter getEQParamsFromFlash service chain and446 JNI inverse; corrected old derived Q100 note to primary /256.
- Published freeDspReadbackEvidence.md field/source/encoding/ambiguity matrix and exact Henry read-only diagnostic instructions. Proved canonical unity metadata inversion is nonunique using existing unchanged offline RAM model.
- Implemented opt-in exact-device fixed19-query evidence capture,1s polling/30s launcher bound, failure STOP/no resend, raw/partial logs/JSON. Normal HTTP transport allowlist and all RAM/Flash write paths unchanged. No hardware access performed.
- Added offline477/446 decoder preserving UNKNOWN source and unavailable enabled/stereo/freshness; synthetic full-nine fixture explicitly rejects production eligibility. Automatic CONNECT readback and device-baseline A/B were not implemented because evidence gates are incomplete.
- FreeDSP graph defaults−20..+9 with sampled active/comparison extent expansion and nonfinite indication. Generic plot/gain bounds unchanged; coefficient mathematics unchanged.
- Henry's reported RAM/Flash/power-cycle/cross-host App/gain/reset/editor persistence results recorded as user hardware evidence; no new readback HARDWARE PASS claimed.

## 2026-10-09 — Final FreeDSP UX implemented offline
- Reviewed supplied screenshots, official446/477/442/346 source evidence,57 saved helper pairs and dangerous first-getEQParam unity initializer. Published freeDspFinalUxEvidence.md with precise readback limitations and manual acceptance steps.
- CONNECT retains local editor and displays Device EQ Unknown — Local Editor; no new readback/auto-write. DISCONNECT preserves local values and labels stale/offline. Saved device name cannot masquerade as readback. Stale metadata/session and late RAM UI completions are guarded.
- Exact35D8:1496 gain policy−16..+6 implemented centrally for slider/numeric/drag/preset/import and existing RAM/Flash preflight. Direct-edit clamp is visible; invalid imports reject atomically. Matching isolated native policy guards updated; no coefficient/serializer/packet plan changes. Generic DAC±12 unchanged.
- Defaults is9 enabled PK/Q.7 at expected frequencies; Flat retains frequency/Q/type/enabled and zeros all9 gains. Both require accurate confirmation and use existing stereo RAM Sync, never automatic Flash. Cancel and failure reporting tested; other DAC Reset retained.
- Focused7files/106tests plus3files/32 regression tests PASS (10files/138 total), including DOM gain bounds, actual drag callback, disconnect/reconnect and delayed metadata/chooser, Reset both orders/cancel/failure, JSON/text import rejection,21 native-derived RAM golden vectors and existing56 Flash plan tests. New UX hardware acceptance is pending; no new HARDWARE PASS claimed.
- Native isolated test build PASS,73offline/mock tests PASS. Initial sandbox loopback socket denial resolved with loopback permission; fake child only, no HID discovery/open. First full frontend verification exposed missing new imports in extracted-function test contexts and obsolete+12 policy expectations; corrected those tests and reran verification.
- Final verify.ps1 PASS: TypeScript/Vite build and28files/280tests. Existing diagnostic range labels also align with current policy; no new debug controls. Generated dist and this round's isolated temporary output are excluded from delivery.
- Prior Henry stereo RAM and56/56 Flash/persistence PASS preserved. No physical device access, new filters/controls, native API extension, production release or PR.

### Scope / regression check
- FreeDSP-specific files changed: capabilities/deviceState/editor/session/WebHID dispatch/Web RAM validation/CAF log and existing diagnostic range labels; isolated native gain-policy guards.
- Analysis/test files changed: focused DOM/import/connection/Reset/gain/RAM/Flash regression tests, native mock endpoints and freeDspFinalUxEvidence.md.
- Shared runtime files changed: src/fn.ts, src/main.ts, src/peq.ts, src/importExport.ts, src/dsp.ts; necessary exact-FreeDSP UI hooks and overwrite confirmations only.
- Non-FreeDSP protocol code changed: NO. Other DAC gain ranges, packet senders and Reset semantics retained; regression mocks pass. Coefficient/CAF serialization/RAM18-write plan/Flash56-write plan/transport API unchanged.
- All4docs and Issue3pack updated; git diff --check PASS after generated-output cleanup. Authorized commit/push follows; no new hardware acceptance claim.

## 2026-10-09 — gain limits audit completed (offline only)
- Recorded Henry-reported56/56matchingFlashACKs and EQ persistence after physicalUSB reconnection as tested-session hardwarePASS. No+12/fractional/all-rate validation claimed.
- Inventoried all current/upstream gain entry/clamp/rounding/reset/curve/safety/190/220/native boundaries; fetched upstreammainaf0bcf7057860307bf81b00746f0cbdb93366514. Runtime unchanged.
- Rehashed cached officialAPK SHA04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5; reproducibly extracted localized-16..+6failure strings/fileoffsets; cross-checked saved SDK/JNI/quantizer evidence and documented extraction limits.
- Added deterministic offline3150-case matrix:7gains/6frequencies/5Qs/5rates, native-floatPK plus clearly labeled unsupported reference shelves. Retained failures, centerfidelity, quantizationerror, stable-neighbor distinction, composite sine gain and metadata truncation.
- Published freeDspGainAudit.md detailed inventory/evidence/results/options; updated all4docs and Issue3pack; recorded future-16..+6recommendation without implementation.
- Focused3files/61tests PASS (gainAudit15, editorUx32, Flash14). InitialTempEPERM resolved using workspace-local Temp; corrected new test to decode actual serializedCAF bytes. No verify.ps1, build, native execution, hardware access or PR.
- Scope: documentation/offline scripts/tests/fixtures only; sharedruntime NONE; non-FreeDSP protocol code changed NO. Final git diff --check PASS; authorized commit/push follows.


M2S UX final verification: focused16tests PASS; verify.ps1 once PASS (TypeScript/Vite build,21files/184tests); generateddist restored; git diff --check PASS. No hardware access.

## M2S main-page UX completed offline
- Henry reports normalCONNECT FreeDSP35D8:1496 identifiedCONEXANT/ONLINE; nohardwareRAMresponse claim added.
- Hardware Memory Controls exposes RESTORE FREEDSP RAM TO UNITY with explicitFreeDSP display/wrap; description outsidebuttonrow and LOCAL EDITOR/FREEDSP RAM status. SEND TO DEVICE andFlash disabled forFreeDSP.
- ExistingRestore path unchanged:18paired190,canonicalunity,invalideditor independent,noeditor modification,firstfailureSTOP/no retry/rollback. Actualmainhandler mock verifies these facts.
- SlotA/B/OFF code uses localEQ snapshots andskips FreeDSPsync. FreeDSPSlotB default now9unity; otherDAC10/defaultsync regression retained. ResetFlat not repurposed.
- FocusedWebHID/UX16testsPASS; nohardware/native/transport/protocolmath edits.

# M2S completed offline work — hardware browser transport pending
- Henry reportsM2RpositiveP1/P2andnegative-nine/stereo/RestorehardwarePASS; quietrepeatableclicksnonblocking,causeunconfirmed. Codexdidnotaccesshardwareornewrawlog.
- Addedupstream-first permanentrule, native diagnosticclassification, originalCONNECT CAFselection/listener-before-open, dspadapterexplicitRAMSync, paired18writes,invalideditorunityRestore, Flash/unsupportedutilityguards.
- Normalmainno nativeHTTP/connectpanel; defaultdev.ps1doesnotrequire.NET orstartbridge; optional-NativeDebug retainsnative diagnostic/lifecycle.
- SharedCAFcodecusedbybrowser/runtime andoldTSDiagnostics. NativeC#export21vectorsverifiedmatchingWebHIDbody withreportID separated; nativefixture drift testadded.
- 56focusedfrontendtestsPASS;65nativeoffline/mocktestsPASS; PowerShellownedlifecyclemockstestsPASS. No physicalHIDcalled. No PR created.
- Finalverify.ps1 PASS（最後Ctrl+S限定FreeDSP修正後重跑）：TypeScript/Vite build、21files/181tests；generateddist還原、隔離testoutputs移除、git diff --check PASS。Normalproductionbundle沒有localhostnativeAPI引用。
- Browserinputresponseavailability andM2SphysicalhardwarePASS haveNOTbeenestablished; M2Gzeroeventsretained. No productioncompletionclaim.

﻿# AuraPEQ FreeDSP Verified Work

## 2026-10-08 — M2Q 全九段雙聲道硬體 PASS / Restore UX
- Henry 回報 Apply／Restore 各 18 command190 PASS，雙耳等量、聲像置中、Restore 正常；取代前輪 M2Q pending，不宣稱 production 完成。
- 負增益九段有預期強烈頻譜塑形；手動低頻塑形有 high-pass-like 聽感。使用者聽感證據，不是量測曲線或 HP filter 驗證。
- Henry 觀察每次約九個小 click/pop，原因未確認；低於 −12dB 曾鎖住操作，重啟 dev.ps1 並 Restore 恢復。全九段確認按鈕最終正常，未確認按鈕 bug。
- 原本 Restore 共用 editor 驗證，頁面將本地例外設 faulted。已將 Apply 驗證移至傳輸前且不設 fault；Restore 用固定合法 unity 快照，無效值不鎖住本段／全九段 Restore。
- 安全範圍不是硬體限制；正增益/native/係數/production/preamp/Flash 未修改；Codex 未操作硬體。
- 本輪驗證：聚焦 2 files／21 tests PASS；verify.ps1 一次 exit0，TypeScript/Vite build 與 19 files／158 tests PASS；git diff --check PASS。首次 sandbox Vitest 因暫存 rename EPERM 未執行測試，正常權限重跑通過。僅 Restore UX 離線驗證，不新增硬體結論。

## 2026-10-08 — M2R long milestone offline implementation
- 基準 d5e1516；Henry 指定一次備妥隔離驗證與主圖形驗證，後續兩個手動 session。本輪沒有硬體操作；正增益／圖形硬體結果仍 PENDING。
- webRam validator 支援 PK 每段−12..+12dB，保留 frequency/Q/index/schema checks；另加五個速率量化係數的合成響應估計與6dB正增益預算硬阻擋。Restore 不依賴 editor 或 Apply safety。
- P1 Band5=1000Hz/+6dB/Q1，其餘unity；P2 三段250/1000/4000Hz各+1/Q1，其餘unity；混合圖形預設再加100Hz/-3/Q1。沒有9×+6預設。
- 新 graphicalRam bridge-only session 在本地手動關卡之前拒絕連線，從未設置 legacy HID device。主頁明確Sync路由到native；拖曳／數值／profile／undo 維持本地。預檢先於 request，18writes執行由native負責；fault鎖Apply，明確全九段unityRestore仍可用。
- main/fn/peq 的共享修改限於 FreeDSP session掛接、exact35D8:1496 legacy連線阻擋、編輯器解鎖及原生float圖形分支；其他模式保留原RBJ，非FreeDSP協定程式未修改。FreeDSP GUI48k只是視覺模型；matching346才是實際write rate。
- 聚焦 mock 已執行真實 updateState 103次本地編輯、mounted connect/mixed/sync/restore、手動gate、unsafe阻擋與faultRestore；沒有硬體存取。四份文件保留 M2Q 負增益硬體PASS與 M2R 未驗證界線。

- Native RamDebug 正增益／五速率量化合成預檢與190單調SET/GET/exchange計時完成；64項離線/mock測試PASS。原Release DLL被既有dev bridge鎖住，測試改用隔離輸出，未停止服務；測試輸出已清理。

- M2R隔離面板完成P1/P2/NEG、每次觀察重設U、最近紀錄確認／矛盾撤銷gate、先unitybaseline及單段累積防護；明確Restore不受invalid/觀察/fault限制。frontend三檔31項focused PASS；TypeScript test compile PASS。

- 最終verify.ps1本輪一次PASS：TypeScript/Vite build、20files/168tests；native64 PASS。generated dist還原、測試暫存移除、git diff --check PASS。四份docs完成；未操作硬體／沒有PR／沒有Flash/preamp或非FreeDSP協定修改。

## 2026-10-07 — Round 0
- 確認開始時專案目錄為空，尚非 Git repository。
- 從 upstream clone 到 D:\Henry\Documents\ChatGPT\AuraPEQ，沒有額外巢狀目錄。
- 基準 commit：af0bcf7057860307bf81b00746f0cbdb93366514。
- 建立本機分支 fix/freedsp-conexant。
- 設定 upstream 為 mandy321/Audiocular-Aura.git，origin 為 henryshuen/Audiocular-Aura.git。
  這只驗證本機設定；不表示遠端 fork 已存在。
- 驗證 gh 已安裝但權杖無效，公開 fork 查詢回報 Repository not found。
- Node v24.16.0、npm 11.13.0；以原有 package-lock.json 完成 npm ci。
- 在新增任何專案檔案前，原始 upstream 的 npm run build 成功：tsc + Vite 4.5.14，12 modules。
- 完成 FreeDSP 路徑唯讀稽核，證據與未確定事項記入 ROADMAP。
- 新增四份持續維護文件及 setup/verify/dev 三支 PowerShell 腳本。
- PowerShell 語法解析三支腳本成功；使用 Windows PowerShell 5.1.26100.9549
  實際執行 setup.ps1 成功（exit 0）。
- verify.ps1 實際執行成功（exit 0），TypeScript 與 production build 通過。
  package.json 尚無 test script，明確列為 SKIP，沒有聲稱單元或封包測試通過。
- dev.ps1 啟動 Vite，監聽 127.0.0.1:5173；直接 HTTP GET 到
  http://127.0.0.1:5173/ 與 http://localhost:5173/ 均為 200，回應含 AuraPEQ HTML。
- 5173 已被本輪伺服器占用時，再執行 dev.ps1 回報 Port 5173 is already in use，
  腳本以非零退出，沒有自動改用其他埠或開啟瀏覽器。
- 還原本輪 build 產生的已追蹤 dist 差異；確認 src、package.json、package-lock.json、
  dist 與基準無差異。最終僅新增 docs/ 與 scripts/，未 commit、push 或建立 PR。
- 未執行任何實體 HID、RAM、Flash、聽感或 Android 測試；沒有硬體成果列為完成。

- Native RamDebug 正增益／五速率量化合成預檢與190單調SET/GET/exchange計時完成；64項離線/mock測試PASS。原Release DLL被既有dev bridge鎖住，測試改用隔離輸出，未停止服務；測試輸出已清理。

## 2026-10-07 — Round 0.5
- 開始時 git status 乾淨；目前分支 fix/freedsp-conexant。
- origin 為 https://github.com/henryshuen/Audiocular-Aura.git；
  upstream 為 https://github.com/mandy321/Audiocular-Aura.git。
- 確認 Round 0 四份文件及三支腳本已包含在提交
  af0a73c45db495f0b7a9cb6d6c70c04af4d1f647（chore: bootstrap FreeDSP development workflow）。
- 以 git ls-remote 確認 origin/fix/freedsp-conexant 的遠端 SHA 與本機 HEAD 相同。
  本機追蹤分支為 origin/fix/freedsp-conexant，ahead/behind 為 0/0。
- GENERAL 新增永久 FreeDSP-only scope、src/freedsp/ 優先隔離規則與每輪 Scope / regression check。
- DECISIONS 新增 D008；ROADMAP 將 M0 標為 COMPLETE，M1 仍為 PENDING，未開始。
- 以 Windows PowerShell 執行 scripts/verify.ps1，exit 0：TypeScript + Vite build 通過。
  沒有 test script，單元測試為 SKIP；未新增或聲稱完成 M1 測試。
- 還原本輪建置產生的 dist 差異；確認 src、scripts、package.json、package-lock.json、dist 無變更。
- Scope / regression check：FreeDSP-specific source files changed: none；shared source files changed: none；
  Non-FreeDSP protocol code changed: NO。僅四份 docs 文件變更，未操作任何硬體。
- 本輪 localhost HTTP 檢查無法連線；伺服器目前未執行，也未自動啟動。
  固定網址 http://localhost:5173/；啟動命令 .\scripts\dev.ps1。
- Round 0.5 文件修改保留為未提交工作目錄變更；本輪未 commit、push 或建立 PR。

## 2026-10-07 — M1 packet-level test harness
- 開始時分支 fix/freedsp-conexant、HEAD 4329bc6、工作目錄乾淨；remotes 未變更。
- 修改來源前執行 verify.ps1，build 通過，當時尚無 test script，測試為 SKIP。
- 新增 src/freedsp/conexantPacket.ts（封包及 Q22）與 conexantTransport.ts（注入 logger 的最小 transport）。
  封包函式本體與基準相同；原始 Conexant 邏輯抽取區域以外的共享來源比對通過。
- 新增 tests/freedsp/conexantPacket.test.ts 與 conexantTransport.test.ts，合計 16 個有限範圍測試。
- 固定來源碼 fixtures 覆蓋 RAM 190、Flash 220、mode 90；驗證長度、header、transaction ID、
  CTRL 常數、command 位置、整數、負值、Q22 及末 word 截斷。
- Fake transport 證明 reportId=1、61-byte 原物件、不移除首位 1、feature fallback 及失敗傳遞。
  測試只操作記憶體 fake，沒有載入瀏覽器、requestDevice 或實際 USB 傳輸。
- 只新增直接測試依賴 Vitest 4.1.11；保留既有 package-lock packages entries 與原有依賴版本，
  測試工具所需版本隔離於 Vitest 依賴樹。最終 npm ci 成功。
- 新增 vitest.config.ts、tsconfig.tests.json，test script 先檢查測試型別再 vitest run。
  verify.ps1 將 test 設為必要關卡，不再默默略過；失敗時非零退出。
- 最終 verify.ps1 通過（exit 0）：TypeScript + Vite 4.5.14 build、測試 TypeScript、
  2 test files / 16 tests。沙箱執行曾因 Vitest 暫存 rename EPERM 失敗並正確退出 1，
  使用正常檔案權限後同一軟體驗證通過。
- descriptor/reportCount=61 僅確認為既有儲存庫註解，未宣稱本輪取得真實 descriptor；
  沒有硬體日誌 fixtures，相關限制與 framing hypothesis 記入 ROADMAP。
- Scope / regression check：Non-FreeDSP protocol code changed: NO。
  沒有改 RAM/Flash/mode/preamp/readback 語意；沒有硬體寫入或聽感測試。
- 四份 docs 均已更新；M1 軟體框架完成，M2 未開始。
- localhost HTTP 檢查無法連線，未啟動伺服器；固定網址 http://localhost:5173/，
  啟動命令 .\scripts\dev.ps1。
- 本輪未 commit、push 或建立 PR；變更保留在工作目錄。

## 2026-10-07 — M2A prepared, hardware evidence pending
- 開始時分支 fix/freedsp-conexant、HEAD 6665470、工作目錄乾淨。
- 在來源修改前 verify.ps1 通過 build 與 M1 16 tests（一般檔案權限）；
  沙箱暫存 rename EPERM 屬環境限制，沒有將未執行測試列為成功。
- 完成 current/candidate 的 header 與每個 payload word boundary map，記入 ROADMAP。
- 保留原 builder 不變；唯一候選去除 presumed embedded ID，13 words 的資料長度為 62 bytes。
- 新增開發模式獨立診斷頁與 FreeDSP-only 選取工具；測試確認 descriptor 檢查不 open／send／receive。
- Metadata 顯示完整 browser collections 與各 report/item size/count，計算可確定的 bit/byte 長度；
  不完整、非 byte alignment、同 ID 多筆不明或長度不符時停止，不猜 reportCount 的單位。
- 新增只供探測的 framing switch（預設 CURRENT）及手動 Flat / -12 dB RAM 按鈕。
  只使用選定取樣率，共九段係數與既有 mode 0；Flat / attenuation 只差第 1 段。
- 加入 descriptor 長度 gate：candidate 若與 output 62 bytes 不符，在 open/send 前即阻擋；
  feature fallback 也要求相同長度 descriptor。自動測試只使用 fake device。
- 日誌包含 profile/framing/reportId/length/完整 hex/command/band/rateIndex，
  sendReport 成功或失敗、fallback 使用與 feature 結果；失敗立即停止，不自動重試。
- 最終 verify.ps1 exit 0：TypeScript + Vite build、測試型別檢查、5 files / 38 tests 通過。
- 保留原 M1 16 tests，新增 22 tests；其中固定 PK Q22 fixture 由基準計算得到。
- 純 HTTP GET 確認 localhost root、freedsp-debug.html、Vite 轉譯 debugPage.ts 均回傳 200。
  未操作瀏覽器或 GUI，未自動選取／連接 FreeDSP，也未執行實體 RAM 或 Flash 寫入。
- 原 src/dsp.ts、conexantPacket.ts、conexantTransport.ts、package/lockfile、verify.ps1 均未變更。
  共享 src/main.ts 僅新增 DEV 診斷連結，Non-FreeDSP protocol code changed: NO。
- 四份 docs 已更新；尚無實機 descriptor／聽感結果，M2 不列為完成，也未開始 M3。
- 交付時 dev server 正在執行，http://localhost:5173/；啟動命令 .\scripts\dev.ps1。
- 本輪變更未 commit、push 或建立 PR；停止等待 Henry 的 descriptor 與手動測試結果。

## 2026-10-07 — M2B offline reconstruction investigation
- 起始HEAD=652099eed2ba87e1d43c60713985e001e349878a，M2A已提交；分支fix/freedsp-conexant，
  起始工作目錄乾淨，origin tracking ahead/behind=0/0（本機refs），remotes未改動。
- 基準verify.ps1通過build、測試型別檢查及5files/38tests。
- 轉錄Henry實機descriptor摘要作fixture：VID35D8/PID1496、primaryusage12/1、input/outputid1、
  61×8bits=488bits=61data bytes；secondary inputid2=1byte只保存摘要，不補造item定義。
- 記錄Henry回報：未送62-byte候選，未做RAM測試。這不是Codex本輪操作硬體的結果。
- 核對Conexant提交歷史、相關blame/diff、README、Issue #3與原始Androidlogcat；
  發現首次builder配置62卻需要63，c7c95fa只改allocation到61。
  作者的「61包含ID」解釋與WebHID定義不符；未取得native struct或known-good USB packet。
- ASR指定post未取得，沒有當成格式證據；完整來源與A–K問題限制記於ROADMAP。
- 新增離線COUNT_U8與TRANSACTION_U8假說，各header9+13×4=61，所有word完整保留。
  拒絕超出欄位寬度或非13words；reportId是獨立envelope欄位；沒有連接任何HID sender。
- GENERAL新增永久Problem / hypothesis / next action規則；ROADMAP完成六欄、候選表與Issue #3證據摘要；
  DECISIONS新增D014/D015，只記錄證據分層及離線邊界，沒有指定正確硬體格式。
- 最終verify.ps1 exit0：TypeScript、Vite4.5.14 build、測試型別檢查、6files/47tests，新增9tests。
- Scope / regression check：FreeDSP-specific為新純函式/測試/fixture；shared僅四份docs；
  Non-FreeDSP protocol code changed: NO。現有runtime builder、sync、RAM/Flash/mode/preamp/readback均未修改。
- 不操作GUI/browser或實體HID，不開始聽感/RAM測試，不發GitHub留言，不commit/push。
- 完成的是M2B離線調查與軟體驗證；RAM EQ、Flash persistence、readback、preamp、最終正確61-byte格式仍未證明。
- git diff --check通過；還原本輪verify產生的dist，runtime/package/scripts差異為空。
- 既有Vite程序PID8048監聽127.0.0.1:5173；純HTTP GET回傳200，本輪未啟動新server或開瀏覽器。
  網址http://localhost:5173/，啟動命令.\scripts\dev.ps1。狀態僅代表交付前快照。

## 2026-10-07 — M2C-Research source recovery
- 起始HEAD2dfe0db1735da511275cd7c3e188b64bdc8b6368，工作目錄乾淨，分支fix/freedsp-conexant。
  基準verify通過6files/47tests；核對git status、branch與log -5。
- 追查指定-S searches、原始builder blame、e7da5b5及c7c95fa前後相關提交、README與所有31則Issue #3 comments。
  builder欄位一次在e7da5b5加入；c7c95fa只改buffer；沒有取得native serializer來源或CafId實作。
- 找到M2B漏讀的freedsp_usb_raw_log.txt，原樣保存60,438bytes與SHA256、來源URL及限制。
  57組TX/RX arrays均62entries，TX90×1/220×55/259×1，未見190。
- 證據測試確認modulebytes、count後zero、係數LE32、firmware response、及舊62-byte builder對所有57筆TX一致。
  保存Flash commit FF000000的觀察；沒有把helper表示或app success宣稱成正確on-wire transfer。
- 讀取ASR原帖與linked repos；指定舊帖非serializer，Aura介紹帖是未實測同源自述。
  devicePEQ固定HEAD的capture JSON含非法byte值，未採納為權威擷取；未複製、執行其程式。
- 更新四份docs：來源時間軸、六欄matrix、六欄problem/hypothesis、Issue #3摘要及條件式未來manual capture plan。
  沒有要求Henry當輪capture或送RAM；沒有找到authoritative serializer。
- 新增5個保留來源證據的測試，最終verify.ps1 exit0：build/typecheck、7files/52tests。
  首次node module型別檢查失敗已修正為既有raw import/Web Crypto；未加套件或改harness。
- FreeDSP-specific：一份test及兩份fixture/provenance檔；shared為四份docs與.gitattributes。
  attributes僅限定原樣dump，停用換行轉換並保留來源原有兩處尾空格；使用.txt避免.log忽略規則遺漏證據。
  Non-FreeDSP protocol code changed: NO；runtime framing/sync/mode/RAM/Flash/preamp/readback均未修改。
- 未操作GUI/browser或硬體、未下載安裝APK/driver、未發布Issue留言、未commit/push；停止於M2C-Research。
- git diff --check與新增檔案check通過，原樣dump的尾空格依限定attributes保留。
  verify產生的dist已還原；src/runtime、package、scripts與test config無差異。
- 交付前5173沒有監聽程序，server未執行，也未自動啟動；網址http://localhost:5173/，命令.\scripts\dev.ps1。

## 2026-10-07 — M2D research checkpoints
- Phase1：核對並保留未提交的M2C檔案；baseline verify通過52tests；確認官方APK直接來源連結與repo無APK。
- Phase2：完成57pairs deterministic分析、45組coeff/log一致性、96個sign-extended負words及commit255觀察。
  7個forensics tests/typecheck通過；官方中文頁直接APK已下載到TEMP並保存hash，未執行APK。
- Phase3：靜態恢復Java getUSBMessage與controlTransfer完整呼叫鏈、190的獨立payload、commit的255常數及187/188的不同容量。
  官方APK版本與SHA已記錄；USB transfer成功長度與硬體效果尚未測量，未執行APK或任何硬體操作。
- Phase4：核對官方APK res/qc.xml的VID35D8/PID1496→Freeman3、JNI coefficient wrapper與HID/Android規範。
  新增inspect-apk.py靜態抽取、official-layout離線模型、兩份machine-readable分析與來源說明。
  57pairs/114buffers逐byte重播一致；再次APK抽取22methods與保存JSON結構完全相同。
  upstream live HEAD仍af0bcf7，Issue仍31comments；完整列出所有直接附件，兩個text附件重新下載404，未假裝已重新取得。
- M2D-Deep研究收斂為一個HIGH serializer model；官方Java layout與ID邊界已恢復，runtime/硬體效果未修改或測試。
  最終verify.ps1 exit0：TypeScript、Vite4.5.14 build、測試型別檢查、9files/65tests；原52tests保留，新增13tests。
  GENERAL/ROADMAP/DECISIONS/DONE已更新，來源inventory、命令差異、排除模型與Issue evidence pack已保存。
  本輪無硬體access/RAM/Flash寫入、GUI、自動同步、GitHub留言或非FreeDSP protocol修改。

## 2026-10-07 — M2E research checkpoints
- Phase1：起始git乾淨，baseline verify9files/65tests通過；核對現有RAM迴圈/word0/band/Gain/activation與官方Java差異。
  官方native library保留係數函式symbols，已找到可直接靜態解析的具體入口；未載入/執行APK或native library。
- Phase2：靜態追出JNI native callback、參數16bit布局、Gain=e+2與2^(25-Gain) scale、feedback negation、Java0..4band guard、current-rate查詢與兩張不一致rate tables。
  已定位PK設計與native floor/floor+1量化；所有結論來自instructions，不執行native library。
- Phase3：保存inspect-eq.py與Java/JNI/ARM64來源fixture；追完整service/enable鏈與獨立mode90入口。
  offline float/scaling模型吻合45個Gain及225個係數的兩候選區間；沒有稱為bit-exact native converter或RAM硬體capture。
  Byte解讀確認舊190buffer會被官方layout讀為command13/count1/錯module；runtime沒有修改。
- Phase4：完整verify.ps1 exit0，TypeScript/Vite build與test typecheck通過，10files/73tests（新增8tests）。
  再次靜態抽取22Java methods、9native functions、4JNI registrations，與保存JSON完全相同。
  GENERAL/ROADMAP/DECISIONS/DONE與逐項比較、原因排序、明確限制、Issue #3 evidence pack已更新。
  無APK/native執行、硬體access、RAM/Flash寫入、聆聽測試、production runtime或非FreeDSP protocol變更。

## 2026-10-07 — M2F controlled diagnostic implementation
- Baseline起始working tree乾淨、fix/freedsp-conexant、M2E69c5532；verify10files/73tests通過。
- 新增FreeDSP專用officialRamProof codec、CAF RX parser與ACK/timeout transport，診斷頁改為單段manual test/flat。
- Wire schema固定selector0/band5；188/187/346/190依序ACK gating，無五rate loop、無自動90/Flash/legacyID4/5。
- 新增114buffers獨立重播、mock ACK/mismatch/timeout/scope tests、五rate穩定pole與衰減頻率響應檢查。
- GENERAL/ROADMAP/DECISIONS/DONE記錄187固定report實驗、native最後neighbor限制與Henry hardware結果PENDING。
- Codex未連接或寫入硬體、未做聆聽測試；production DSP與non-FreeDSP protocol無變更。
- 最終verify.ps1 exit0：11files/94tests（新增21tests）、TypeScript/build/test typecheck全部通過。
- 既有dev.ps1已啟動localhost:5173；root/debug HTML/diagnostic TS modules/model HTTP200。
  HTTP檢查不觸發HID，沒有稱為瀏覽器互動或硬體proof；等待Henry手動回報。

## 2026-10-07 — M2G hardware record / transport implementation
- Henry回報M2F三次：Apply兩次、Restore一次，descriptor gate通過，188 host send成功後約2.5秒timeout；沒有matching RX記錄。
  187/346/190皆未送，故無可聽差異不能判為EQ失敗；沒有把188判為accepted/rejected。
- 起始git乾淨、fix/freedsp-conexant、0ca80b5；baseline verify11files/94tests通過。
- 完整靜態追出sendCmd/getMsgByCmd的SET/GET控制傳輸、fresh RX配置、caller回應使用及unsignedcount檢查。
  新增inspect-response.py、完整來源JSON與證據說明；APK/native程式皆未執行。
- 診斷頁只提供inspect/open與query346，persistent raw listener、event counter、所有ID/長度保存與短candidate解析；M2F Apply/Restore/90無控制入口。
- 新增20項mock/source tests，與synthetic346/count4 fixture明確區分實際259/count4、90/220/count0證據。
- GENERAL/ROADMAP/DECISIONS/DONE記錄三次實測結果與當前限制；Codex沒有硬體access或EQ/Flash寫入，production與non-FreeDSP不改。
- 最終verify.ps1 exit0：12files/114tests、TypeScript/Vite build與test typecheck通過，原94tests保留，新增20tests。
- inspect-response再次抽取12methods，保存JSON完全一致；currentAPK的UsbHelperDump tag absent。
- 已以hidden dev.ps1啟動localhost:5173，root/M2G頁及兩個診斷TS模組直接HTTP200；僅驗證可提供，無瀏覽器/HID操作。
- 還原本輪生成dist後，git diff --check通過，production source/舊M2F helper/config/package無差異。

## 2026-10-07 — M2H response transport feasibility
- 起始working tree乾淨，fix/freedsp-conexant追蹤origin，HEAD ebc34b7；origin/upstream設定正確。
- 已記錄Henry的M2G結果：open/send前raw listener ACTIVE；346 ID1/data61 host send resolved；2.5秒後rawTotal=0/newEvents=0，無任何inputreport。
  沒有parser輸入，不能判DSP接受/拒絕，沒有RAM/audio proof；Codex未存取硬體。
- 本輪重播pinned APK完整12methods，與officialResponseStaticEvidence.json完全一致。
- 靜態確認CnxtUsbDeviceBase.connectUsbDeviceByApplication選class3/subclass0/protocol0/interface3並claim；SET/GET參數及array.length再次核對。
- 已查WebHID/WebUSB規格、Chromium HID/USB實作、Chrome Windows WinUSB要求、Windows Input report API、Web Audio/Media Capture規格。
- 正常Windows Chrome網頁不能顯式Input GET_REPORT，Feature讀取不等價；protected HID class阻擋WebUSB及hybrid官方回應路徑。
- 四份指定文件保存參數、限制、方案比較、失敗歷史、upstream證據及成功狀態政策；無新增文件或程式修改。
- 本輪Case C，不新增診斷按鈕、不安裝driver/helper、不要求Henry重做WebHID346/descriptor；No manual test required this round。
- 最終verify.ps1 exit0：12files/114tests全部通過，TypeScript/Vite build/test typecheck通過；未新增測試或fake success fixture。
- Flash helper writeGolemCmdToDevice的SET/GET constants/call亦再次靜態核對；未送Flash命令。
- 還原本輪生成的三個tracked dist files後，只四份指定docs有差異；git diff --check通過。

## 2026-10-07 — M2I native query implementation (hardware pending)
- 起始working tree乾淨，fix/freedsp-conexant與origin同步，M2H commit6d34de3。
- 新增FreeDSP-only C#/.NET10 console、SetupAPI/HID interop、固定346 serializer/parser、單次SET→Input GET runner及PowerShell launcher。
- 無外部套件；NuGet sources清空，build outputs局部ignore；production/browser/runtime/package/config未修改。
- Native build成功，0warnings/0errors；22項synthetic/mock tests通過，未呼叫裝置探索或hardware report APIs。
- Launcher PowerShell語法解析通過；實際built CLI的query190非法參數在探索前拒絕，exit2，沒有硬體存取。
- 四份文件保留M2F/G/H結果、native成功標準、capability/path gate、失敗停止政策；沒有新增.md。
- 原生Query346硬體結果PENDING HENRY HARDWARE RESULT，沒有把offline結果當成transport/RAM/audio proof。
- 最終verify.ps1 exit0：13files/118tests、TypeScript/Vite build/test typecheck全部通過；新增4項native golden/scope tests。
- Launcher改為stdout/stderr逐行轉送；以in-memory非法CLI probe驗證完整build/launch/log pump及exit2，沒有執行query346或裝置探索。
- 最終native build零warning/error、22項offline tests通過；還原tracked dist後git diff --check通過，無production差異。

## 2026-10-07 — M2J M2I hardware record / synchronized implementation
- 起始git乾淨，fix/freedsp-conexant，M2I c88abcf與origin同步。
- Henry回報M2I只執行一次：matching HID paths2，MI_03 col01、usage0C/1、input/output62、feature0，SET346/GET均SUCCESS/error0。
- 回傳已知prefix14bytes：01 00 01 00 bc 80 00 23 2d b3 01 00 00 00；解析command188/reply1/count1/CTRL/words=[1]。
- 已成立Level1 native HID transport；CAF346 matching未取得，RAM/EQ仍未驗證；沒有把M2I判transport失敗或推論FIFO。
- 已重播pinned APK12methods與保存fixture完全一致，逐instruction核對initialGET、replybit stop、1000ms及5ms輪詢。
- Native parser區分structuralCAF與Matching346；runner SET一次、bounded GET，每次RX/分類保存，nonmatch188明列，error停止。
- Native build0warnings/0errors；30項deterministic fake-clock/mock tests通過，無device exploration/report calls。
- GENERAL/ROADMAP/DECISIONS/DONE記錄官方reply-only stop與診斷matching correction，沒有新增.md。
- M2J HARDWARE RESULT PENDING；Codex沒有硬體操作、mutation、driver或production變更。
- 最終verify.ps1 exit0：13files/119tests及TypeScript/Vite build/test typecheck通過；native build0warnings/0errors、30項mock tests通過。
- 還原generated tracked dist後，git diff --check通過；僅四docs、native診斷及offline tests有差異，無新增文件或production變更。

## 2026-10-07 — M2J hardware confirmation / M2K implementation checkpoint
- Henry提供M2J：MI_03/col01 usage0C/1 input/output62feature0，SET/GET success/error0，GET#1 matching346/reply1/count13/CTRL。
- 回報words=[62,5,0,32,0,0,0,0,0,0,0,0,0]，該次index5=48000Hz；Level1/2 VERIFIED，Level3 RAM/EQ PENDING HENRY TEST。
- 已核對保存的官方instruction arrays：188/187/346/190 count/payload、GET及callerbool handling、sendCmd與getMsgByCmd initialGET clock差異。
- 已查閱Microsoft HidD_SetOutputReport contract及hidapi Windows hid_send_output_report，短report須補至caps長度。
- 新增固定nativeApply/Restore模型與runner，官方187logical14prefix＋48zero Windows62adapter、count1，mandatorymatching187 gate。
- native CLI僅query346/ApplySafeRamTest/RestoreSafeRamTest；transport guard只允許固定reports，無任意opcode/band/rate/gain。
- 新增兩個無參數PS launchers、30s childwatchdog，未執行任何HID探索或deviceAPI。
- Native build成功0warnings/0errors；40項offline synthetic/mock測試通過，包括400Hzgolden、flat、動態 rate、signed words、187padding、error/mismatch/timeout gates。
- 只更新四份既有docs，沒有新增.md；src/production/非FreeDSP code未修改。
- 最終verify.ps1 exit0：14files/122tests及TypeScript/Vite/testtypecheck通過；nativebuild0warnings/0errors、40mocktests通過。
- 官方pinned APK12method static replay與fixture完全一致；PS三scripts語法解析通過；非法CLI在裝置探索前拒絕。
- 400Hz quantized transfer function離線計算：48k約-11.99998dB，其他knownrates約-12dB；這是數學驗證，無聽感證據。
- 已還原本輪build產生的tracked dist；git diff --check通過，production/非FreeDSP差異NONE，M2K hardware仍PENDING。

## 2026-10-07 — M2K real hardware result (Henry report)
VERIFIED: native bidirectional CAF transport、188 matching、Windows padded187 accepted、matching346 index5=48k、matchingRAM190。
SDK0→wire5 Apply PK400Hz/-12dB/Q1/selector0 有清楚可聽變化；同band unity Restore 有清楚可聽恢復。
Apply與Restore的190均觀察firstGET reply0→secondGET reply1；bounded GET justified，無reSET。
Henry描述air/ambience/reverberation減少，但未能定位400Hz；不聲稱tonal accuracy、bitexact、其他bands、九band、Flash或globalpreamp已驗證。
M2K SINGLE-BAND RAM AUDIO EFFECT / WIRE5 APPLY-RESTORE VERIFIED。
M2L開始：wire6–9 HARDWARE VALIDATION PENDING；Codex僅離線實作，不做實體測試。

## 2026-10-07 — M2L remaining-band implementation / offline verification
- 新增唯一互動入口test-freedsp-native-band-map.ps1與隔離BandValidation.psm1 helper。
- Nativepayload/runner改為SDK1..4→wire6..9，固定八個Apply/Restore operation names；wire5/oldM2Koperations在探索前拒絕。
- 係數數學未改：400Hz/-12dB/Q1、selector0/current346rate、dynamicGain/scale、feedbacksign、nearestquantization及1LSB限制。
- 每段Apply後同段Restore；任何protocolfail/Q/restore聽感未確認停整輪；fullmarkers/prompts/answers與selfcontainedsummary已實作。
- Runtime log使用TEMP/AuraPEQ unique/CreateNew/AutoFlush，拒絕TEMP解析至repo；沒有runtime log committed。
- Native42離線tests通過，包括allrate/allbandonlyword1diff、fixedallowlist、reply0→reply1，以及既有M2Kfailure/math/tests。
- WindowsPowerShell11mocktests通過，涵蓋exactpairing、allENTER、N/S/P/Q、failure/EOF/noexitcode、summary/markers/pathcontract。
- verify.ps1 exit0：15files/125tests、TypeScript/Vite build及testtypecheck全部通過；新增scope/staticSDKmappingchecks。
- 以OFFLINE nativeTests assembly測試真實childstdoutpump，捕捉完整42test結果；未執行hardware helper。
- Codex無device/HID操作；src/production/non-FreeDSP code沒有變更。M2Lwire6..9 hardware全部PENDING HENRY。
- GENERAL/ROADMAP/DECISIONS/DONE四文件已更新；未新增.md，preamp另輪NOTVERIFIED milestone已保留。

## 2026-10-07 — latest M2L hardware result (Henry report)
SDK0/wire5 previously VERIFIED M2K，未重測。
SDK1/wire6：Protocol Apply PASS、Audible Apply YES、Protocol Restore PASS、Audible Restore YES，fully VERIFIED。
SDK2/wire7：Protocol Apply/Restore PASS、Audible Apply YES；Henry分心，Restore聽感PARTIAL/UNCERTAIN。
wire7分類：PROTOCOL VERIFIED / AUDIBLE RESTORE UNCONFIRMED，不是failed。腳本正確在P後停止；SDK3/wire8、SDK4/wire9 NOT RUN / PENDING。
M2L Windows native evidence：input/output report bytes62、feature0，HidP_InitializeReportForID確認Input/Output ID1，SET成功並取得matchingCAF回應。
這與1byte reportID＋61byte reportdata一致；preparsed-data驗證/caps/hostAPI回應不是rawUSB transfer擷取，不能聲稱已證實rawUSB長度。

## 2026-10-07 — M2L-Resume targeted manual tooling
- 新增StartSdkBand1..4（default1），Start2只測SDK2..4、Start3只測SDK3..4、Start4只測SDK4；參數binding拒絕invalidvalue。
- 摘要保留wire5/wire6priorverified、wire7priorprotocolverified/restoreunconfirmed，區分selectedtested、skipped與pending。
- 首次Apply離耳提示改為本run的firstselectedSDK，Apply/Restorepairing及failure/uncertainstop不變。
- 16WindowsPowerShelloffline mocktests通過，含default1/Start2/3/4、invalid0/5/negative/decimal/text/empty、priorstatus、resumefailure/uncertainrestore。
- verify.ps1 exit0：15files/125tests、TypeScript/Vite build及testtypecheck通過。
- 沒有改nativeC#、CAFserializer/190/bandmapping/coefficient/payload、Flash/90/220、production或nonFreeDSPprotocol。
- 四份文件記錄Henry的新wire6/7hardware證據及Windowscaps/metadata的解讀限制；沒有新增.md或commit runtime log。
- Codex本輪沒有實體HID探索或寫入；wire7 audibleRestore、wire8/9仍待Henry測試。

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

## 2026-10-07 — M2M offline research and unresolved-slot harness
- Recovered and directly replayed six selected methods from hash-pinned official APK; added deterministic static extractor and fixture for direct446 slot list, SDK+5 and190 unity initialization. No APK/native execution.
- Traced nine editable AuraPEQ row/index defaults and upstream e7da5b5 provenance; documented full nine-row table with unknown SDK fields and separate physical evidence status.
- Added fixed ApplyCandidateWire1..4/RestoreCandidateWire1..4 operations and strict cut/unity report allowlist; reused existing negative PK/current-rate math, serializer,188/187/346/190 matching/polling/target gates.
- Added scripts/test-freedsp-native-unresolved-slots.ps1 and candidate toggle profile; only raw1..4, no wire5..9 selection. A/R repeats, confirmation/failure/abort/active-slot gates and complete external TEMP logging retained.
- Added offline-only nine-band model with explicit candidate labels, exact index/length checks, PK/rate/packed-range/stability guards, disabled same-slot unity and non-transmitting reports. It is not imported by production runtime.
- Expanded offline C#/PowerShell/Vitest tests. No hardware discovery/write or listening by Codex; no preamp/Flash/shared production/non-FreeDSP changes.
- Updated exactly GENERAL/ROADMAP/DECISIONS/DONE. Web runtime integration was not implemented. Current handoff: M2M manual validation ready, remaining physical evidence pending.

### M2M automated verification completed
- C# diagnostic build0warnings/0errors;47 Native synthetic/mock tests;15 PowerShell mock tests; pinned APK six-method static replay identical.
- Focused Vitest3files/15tests; final verify.ps1 once exit0, TypeScript/Vite build＋16files/134tests passed.
- Generated dist restored; no retained production source/dist change. Git diff whitespace/scope review completed before save. No physical device APIs executed by Codex.

## 2026-10-08 — M2M hardware COMPLETE / M2N start
Henry reports rawwire1..4 PK400Hz/-12dB/Q1 each protocolApply PASS、audibleApply YES、protocolRestore PASS、audibleRestore YES。Combined with priorwire5..9, allrawslots1..9 have individual reversible audible evidence. M2M hardware validation COMPLETE; no slot retest scheduled. SDK field semantics forwire1..4 remain UNKNOWN. M2N assigns editable UIposition0..8 to rawslot1..9, explicit position/index validation; debug Web RAM integration only, no production replacement/preamp/Flash.

## M2N implemented offline / Web validation ready
- Recorded Henryallnine individually reversiblehardware evidence; M2MhardwareCOMPLETE. Added finalnine-row UIassignmenttable with SDKfront-fourUNKNOWN.
- Added isolatedDEVnine-row negativePK RAM editor/client, exactindex/range/type validation, disabledunity, safe400/-12/Q1 fill, perbandApply/Restore/manualconfirmation and guardednine-band actions. OptionalmanualstoredUIstate import; no runtimesender imports.
- Added native dynamicnegativePK calculation/serialization/currentrate/selectedslot runner, exactscopedNativeHid packets, metadata-onlyConnect, requiredJSONschema, loopbackKestrel session/origin/host/busy guards and30s childwatchdog. Logs outside repo, no arbitrarycommand API.
- dev.ps1 builds/owns bridge andVite; minimalmainDEVlink/exactFreeDSPauto-connectgate added. No productionSync/dsp.ts/non-FreeDSP changes.
- Focused18Vitest tests passed;56native mock/synthetic tests including FAKE-child HTTP server passed; previous15PowerShell mock tests passed; TypeScript testscheck passed.
- Actualdevstartup/staticHTML/transformedTS/session smoke passed with directno-proxy.NET client; no connect/ram endpoints or HID APIs invoked by Codex. Own smokeprocesses stopped.
- UpdatedGENERAL/ROADMAP/DECISIONS/DONE only; no newMarkdown/runtime logs. No physicalwrites/listening/preamp/Flash/EQreadback performed.

### M2N final automated verification
- verify.ps1 executed once at end, exit0: production TypeScript/Vite build, test TypeScript and17files/144Vitest tests passed.
- Native56synthetic/mock tests passed, including browser camelCase required-schema contract and FAKE-child loopback HTTP;15PowerShell mock regression tests passed.
- Real dev launcher smoke/staticHTML/transformedmodule/session passed; no physical device connect/ram endpoint called by Codex. Initial PowerShellHTTP client timeout did not recur with no-proxy.NET client.
- Generateddist changes restored; git diff --check passed after generated files removed from scope. Runtime protocols untouched outside exactFreeDSPDEVconnectiongate/link. No newMarkdown/runtime log commits.
- Git handoff next: intended files only, required M2Nfeatcommit andpush; STOP for manualWebUI1/5/9 validation. Productioncompletion,fullninecombinedhardware,positivegain/nonPK/nativeexactLSB remain unverified.

## M2N frontend startup correction — 2026-10-08
Henry reports staticHTML but no rows/working buttons; no hardware action. DirectHTTP foundHTML/page/dependencyJS200 andsession200; canonicallocalhost DOM simulation renders9rows/Connectenabled with0startupfetch. Reproduced matching empty/inertUI at127.0.0.1 because hostnameguard skips initialization (buttons have no handlers, not necessarily disabled). Actual Henry browser origin/module error is not captured; do not assert it as confirmed origin.
Frontendonly: HTMLbootstrap redirects127 tocanonicallocalhost preserving bridgeOrigin policy; catches import/runtime/unhandledrejection with visiblepage status/log. Page validatesHTML IDs and renders9rows/Connect before any bridge request; explicitUIREADY marker; blockedstartup nowlogged. Mocksession failure leaves9rows/Connectretryavailable, RAMdisabled. No native/CAF/190/mapping/coefficient/productionSync/preamp/Flash/nonFreeDSP edits.
Focused2files/14tests passed: canonicalstartup9rows,0fetch,Connectenabled; failingconnectvisible/retryable;127redirect; visiblebootstraperror. HTTPHTML/bootstrapproxy/pageJS/session200 verified withoutconnect/ram endpoints. Final verify.ps1 follows, then scopedcommit/push andHenryrestart; no physical writes.

Startup correction final verification: verify.ps1 exit0,18files/148tests andTypeScript/Vite passed. Initialtest-only node:vm typing failure corrected withoutaddingdependencies; requiredverification rerunpassed. Generateddist restored; diffcheck/scope reviewpassed; native/protocol/math/mapping files unchanged.

## M2N frontend Connect correction — 2026-10-08
Henry independently verified session/token/debugInspect backend success. Supplied {ok:true,exitCode:0,log:...} matches existing frontend schema; no backend change. Found defaultnativefetch stored as instance member and invoked withRamBridge receiver. Regression reproduces Illegalinvocation with a Window-receiver-enforcing fetch, beforeJSONhandling, and fails oldcode. Henry subsequently supplied actualpage log: repeated TypeError: Failed to execute fetch on Window: Illegal invocation whiledev.ps1wasrunning. This confirms the reproducedfrontendreceiver defect. The separate nine-row importvalidation error is unrelated toConnect; itsguard is unchanged.
Fix frontend only: bind defaultfetch toglobalThis; preserve injectedfetch mocks. FailedConnect now clearsconnected state and shows actualreason inpage status/log. One integratedtest uses realRamBridge, mocksession andexactsuccessfuldebugInspectJSON, asserting clickedConnect enablesApply/Restore, connectedstatus andsuccesslog; no optionallogPath required. No hardware/connect endpoint invoked byCodex; no native/CAF/190/mapping/coefficient/Flash/preamp/productionSync/nonFreeDSP changes.

Connect correction final verification: focused2files/15tests passed; verify.ps1 once exit0,18files/149tests＋TypeScript/Vite passed. Exact successfuldebugInspect response now leads toconnectedstatus, Apply/Restoreenabled andsuccesslog inintegratedfrontendmock test. Native/protocol filesunchanged, no hardware calls. Generateddist restored; gitdiffcheckpassed.

## 2026-10-08 — M2N Web gate COMPLETE / M2O preparation
Henry reports Web UI1/wire1, UI5/wire5 and UI9/wire9 each protocol Apply PASS, audible Apply YES, protocol Restore PASS, audible Restore YES. Record as user hardware evidence; no Codex hardware action.
M2O implementation: deterministic nine-row negative-only PK/Q1 preset, prior gate carried forward; separate full-nine audible Apply and Restore confirmations. Native executor materializes all selected packet bytes before first190, logs each wire BEGIN/PASS, preserves matching-response success and first-failure stop with no retries/rollback. Restore retains editor values and writes unity only. Existing188/187/346 prerequisites, serializer, coefficients and mapping unchanged; no production/non-FreeDSP/Flash/preamp changes.
M2O full-nine hardware validation is READY / NOT RUN, not completed or audibly verified. Next action is Henry's explicit full-nine Apply/listen/confirmation then Restore/listen/confirmation using http://localhost:5173/ and .\scripts\dev.ps1.

### M2O final automated verification
Focused frontend2files/18tests PASS; native57synthetic/mock tests PASS (including exactnine190 packets, per-wire PASS/FAIL, stop-on-second-wirefailure, no retry/rollback/full-complete claim). verify.ps1 executed once at end: exit0, TypeScript/Vite build and18files/152tests PASS. Sandbox temp rename/loopback restrictions resolved by running offline tests in normal local environment; no physical device was used. Generateddist restored to initial state; intended-file git diff --check PASS. M2O remains READY pending Henry's full-nine listening result. Shared runtime files changed NONE; Non-FreeDSP protocol code changed NO.

## 2026-10-08 — dev.ps1 stale bridge lifecycle correction
Observed problem: Henry reports an old .NET Host locking Release/FreeDspQuery.dll; prior launcher built before cleaning any previous process and finally only knew the current run's PID.
Changed: project-specific lifecycle helper finds exact dotnet executable + this repository's absolute DLL path + sole serveDebug argument before build; rechecks PID/CreationDate/identity before scoped tree termination, waits up to5s for exit plus200ms, and aborts with PID/actionable error on failure. Normal foreground Vite/Ctrl+C remains; finally uses only saved owned bridge identity and disposes the process. Hard host termination can bypass finally; subsequent startup handles the leftover bridge. No PID-only/process-name-only kill, no unknown listener reuse, no hardware action.
Verification: Windows PowerShell focused mock scenarios PASS: stale-owned-stop/wait, unrelated/path/operation rejection, no stale, cleanup savedPID only, PID reuse rejection, failed-stop PID error, prebuild/finally wiring. Focused11Vitest tests PASS; verify.ps1 once exit0, TypeScript/Vite and152project tests PASS. Generateddist restored; git diff --check PASS. These are mocks/static/build evidence, not a live Ctrl+C interruption experiment.
Scope / regression check: scripts/dev.ps1 + scripts/freedsp/DevBridgeLifecycle.psm1, focused PowerShell test and one existing launcher assertion changed. Shared runtime/protocol files NONE; non-FreeDSP protocol code changed NO. Native API/190/math/mapping/RAM/M2O logic untouched. M2O remains READY awaiting Henry's manual result.

## M2P — 2026-10-08: recorded evidence and isolated preparation
Henry hardware report: M2O nine-wire Apply/Restore protocol PASS, audible effect/restoration YES, stereo correctness FAIL / unresolved. Direct per-ear listening: current selector0 changes LEFT only; RIGHT unchanged; unity restores LEFT. M2O NOT production-complete. These are Henry's listening observations, not measured physical channel attribution. Selector1/right has not been hardware-tested in this round.
Pinned APK static facts: setDefaultAvailable writes identical same-slot unity190 twice with word0=0then1; immediate setter and446getter use0. No190 exists in57helper TX/RX pairs. RecoveredAPK classes.dex scan produced officialPathNameEvidence.json; literal190 inFreeman onlysetDefaultAvailable/setFreeman3EQ; no direct left/right EQ field naming in reviewed methods. Static extraction is not a USB capture.
Prepared isolated scripts/test-freedsp-native-channel-path.ps1 and ChannelProbe native operations: fixedwire5/PK400/-12/Q1 orunity, currentmatching346, same188/187 prerequisites; scoped exact190 packets only. A/B require manual Apply/listen/Restore/recovery, C gated on LEFT-only/RIGHT-only opposites with confirmed recovery; C records both-ear equality and centered image. No automatic writes at startup, retries/rollback/restore; full logs TEMP/AuraPEQ. Production/Web/M2O runtime unchanged; no Codex hardware operation. M2P manual result NOT RUN / PENDING.

### M2P final automated verification
Focused3files/21Vitest tests PASS (pairedunitysource,0-onlysetter/getter,no190dump,220word0families,boundedAPKscan/existingWebcontract). Native61synthetic/mock tests PASS, including fixedpath0/1packetparity and globalpath1rejection, exactselectedpaths/prerequisites, invalid/unknownrate prevention and failureonfirst/secondpaired190withoutrollback. PowerShell7M2Pmockscenarios＋15existingtoggle regression scenarios PASS; manual launcher/module AST syntax PASS. verify.ps1 once exit0: TypeScript/Vite build and19files/155tests PASS. No physical discovery/SET/GET/connect endpoints invoked byCodex. Generateddist restored; intendedgitdiffcheckPASS. M2P isolated manual validation READY, resultNOTRUN; M2O stereoFAIL/unresolved andproductionintegrationstillblocked.

## M2P 中文 toggle UX / baseline 優先 — 2026-10-08（取代先前觀察判讀與循序問卷關卡）
Henry 最初感到 Apply 使聲像右偏、左側減少；後來受控 path0 測試不一致，先前 RAM 狀態可能未清乾淨；之後明確 path0 Restore 在 BOTH 耳產生清楚可聽變化。因此不能沿用「selector0 已確認只影響 LEFT」或推定1=RIGHT；selector0/1 立體聲語義仍 UNRESOLVED，優先建立乾淨 baseline 後反覆切換。M2O protocol/可聽效果 PASS，但 stereo correctness FAIL／未解，仍非 production-complete。
新入口維持 scripts/test-freedsp-native-channel-path.ps1，完整繁體中文說明、主選單 U/0/1/B/Q；進入 path0/path1/both 後 A/R 可反覆切換，Enter/Q 返回持續主選單，O 才自願紀錄聽感。取消或錯誤觀察答案返回模式，不退出、不自動還原；問卷可用 RESTORE/CLEAN 明確選擇立即 Restore／雙pathunity。O 的 R 代表右側，U 代表不確定；不與主選單操作混用。
U 明確呼叫既有 M2PRestoreBoth：預算兩個 unity 封包，依 path0→path1 各190一次；保留188/187/346 prerequisites，失敗即停止，無重試／rollback。逐path顯示 RESTORE PASS/FAIL，只有整體成功才印 Baseline clean: path0 + path1 wire5 unity restored。僅wire5unity命令完成，不是全裝置還原、舊EQ備份或readback。
狀態依本次成功命令紀錄 APPLIED/UNITY，啟動與失敗 UNKNOWN；每個選單及結束摘要持續顯示各path狀態，返回／退出不隱藏仍套用或未知狀態。不強制問卷或宣稱聲道映射通過；Both 可由主選單明確選擇，取代先前依未可靠單側觀察設置的A/B→C關卡。首次Apply耳機離耳、APOOFF、FreeDSP輸出、Windows1–2/100；所有硬體動作均需明確A/R/U輸入。
變更僅PowerShell tester UX、其mock tests及文件；command190語義、native係數／固定wire5／PK400/-12/Q1／RAM流程、Web/M2O/production sender、dev生命週期、非FreeDSP均未修改。Codex未操作硬體。

### M2P 中文 toggle 最終自動驗證
Windows PowerShell：11個toggle聚焦mock情境PASS（中文help/menu、U雙path成功／失敗、各模式反覆A/R、返回持續選單、無效／取消O不退出、RESTORE/CLEAN明確逃生、狀態警示、無自動寫入）；既有devBridgeLifecycle7個mock檢查PASS。三份PowerShellAST語法解析PASS。verify.ps1本輪一次exit0：TypeScript/Vite與19files/155testsPASS。Native/protocol/coefficients/mapping/Web/M2O/dev-process sources diff為空；未操作硬體。Generateddist已還原；gitdiffcheckPASS。立體聲mapping仍UNRESOLVED，下一步由Henry先U建立wire5雙pathunitybaseline，再自行反覆切換。

## 2026-10-08 — M2P hardware COMPLETE / M2Q dual-channel Web preparation
Henry completed clean-baseline repeated wire5 PK400Hz/-12dB/Q1 toggles: baselinepath0unityPASS,path1unityPASS; Path0 Ear=L/Image=R; Path1 Ear=R/Image=L; Both Ear=B/Image=C, equal-ear change with centered image. Hardware-derived mapping: selector/path0=LEFT, selector/path1=RIGHT on this FreeDSP setup. Official SDK names remain unnamed; do not present these labels as recovered official field names. This newer controlled evidence supersedes the prior inconsistent/unclean-baseline observations.
Full log reviewed read-only: C:/Users/Henry/AppData/Local/Temp/AuraPEQ/freedsp-m2p-aa02128f24704c3284b5da2b9592719b.log; SHA25626d4efdf43b460874047257705577b4b119c1ec47a85bf5fa00f26d3f42e1c7e. Baseline completionline97; recorded Path0line471, Path1line1131, Bothline1643; all saved in log despite missing prior final aggregate. O may record recollected toggle effects afterRestore; this is Henry's reported listening validation, not an instrumented channel-amplitude measurement. Raw logs remain outsideGit.
M2O protocol/effect/recovery passed but stereo failed because Web190word0 was always0: onlyLEFT coefficient path updated. M2Q changes isolated debug RAM operations to identical path0/path1 pairs for each requested wire; no production replacement. Single-band2writes; full-nine18writes orderedwire1path0,wire1path1,...,wire9path1. Disabled andRestore unitybothpaths. FixednegativePKscope/math/current346 lookup preserved. Precompute/validate allfiveknownrateplans beforeANYSET; matching346 chooses oneplan; unsafeatanysupportedrate rejectsbeforecommands, unknownrate stopsno190. Existing188/187 prerequisites remainexplicit/logged. No retry/rollback; failure may leave unequalchannels andrequiresSTOP/review.
M2Q firstmanualWebgate: fillBand5=400/-12/Q1, explicitpairedApply/listen(bothears equal,center), pairedRestore/listen(bothbaseline), manualconfirmation. Freshpagegate requiredbeforefullnineApply; fullRestore remainsavailablefor explicitunity. Thenfillnegativefullninepreset, paired18Apply/listen/confirmation, paired18Restore/listen/confirmation. No Flash/preamp/positivegain/nonPK/persistence/EQreadback claims; hardwareandprotocolsuccessremainseparate. Codexdidnottesthardware. M2Q softwareREADY, WebstereogatesPENDING.

### M2Q final automated verification
Focusedfrontend2files/19testsPASS; native63synthetic/mocktestsPASS, includingexact2/18writes,currentratepairedcoeffparity,disabled/Restorebothunity,five-ratepreflightfailurebeforeanySET andfailureateachofthe18positionswithnoextraSET/rollback/falsecompletion. M2P12PowerShellmockscenariosPASS includingfinalsummaryaggregation. verify.ps1onceexit0: TypeScript/Vitebuild and19files/156testsPASS. Productionbrowserruntime,SafeRam/ChannelProbe/math,bridgeAPI,devprocesslifecycleunchanged. Generateddistrestored; intendedgitdiffcheckPASS. No physicaldiscovery/connect/SET/GETbyCodex. M2P hardware COMPLETE; M2Q softwareREADY withWebBand5＋fullnine18-writestereoreversalhardwarePENDING; no persistence/readback/productioncompletion claim.

## 2026-10-08 — M2S reported real WebHID result
Henry reports normal CONNECT chooser/open/exact FreeDSP identity/ONLINE PASS. One Restore began188 ID1/body61 and sendReport succeeded; no matching inputreport arrived; bounded TIMEOUT STOP occurred, no retry, no190 PEQ writes. Pure WebHID hardware gate BLOCKED. Previous native PEQ hardware results remain recorded; this attempt does not add native main-page hardware validation. Codex performed no hardware actions.

### M2S native main-page transport candidate implemented / offline PASS
Added common TypeScript CAF RAM session and native primitive adapter below the original CONNECT/Sync/Restore UI; diagnostic event transport uses the same business session. Transport primitive preserves all21 actual native golden vectors, exact matching reply validation,18 paired wire/path writes, preflight-before-SET, invalid-editor-independent unityRestore, first-failure STOP/no retry/rollback. Metadata connect does no SET/GET; normal mode does not expose /ram. Shared fn/dsp dispatch only exact FreeDSP; other DAC protocols unchanged. Default dev owns native helper; serveTransport process identity and cleanup covered by mocks.
Validation PASS: focused33 frontend tests,69 native synthetic tests including fake HTTP, PowerShell lifecycle mocks/parser; final verify.ps1 build +194 tests/22files. Codex did not start a real hardware helper, connect to a device or perform writes. Native normal-main-page integration hardware validation remains PENDING Henry; no production-ready/browser-only/readback/persistence claim.

## 2026-10-08 — Henry main graphical PEQ hardware PASS
Henry reports normal CONNECT, native HID adapter, graphical editing,9-band stereo Sync to RAM, unityRestore, positive/negativePK, centered stereo, local-editor/RAM separation PASS. Supersedes prior native main-page PENDING. No Flash/readback/persistence validation is added.
Henry reports approximately18 quiet repeatable/non-blocking pops for full9x2 Apply/Restore, roughly per individual LEFT/RIGHT update. This replaces prior approximate9-pop count in precision; records timing correlation only. No proven causal mechanism is recorded.

### PEQ UX cleanup implemented / offline PASS
Removed temporary M2R sum6/peak6.1 hard caps in normal/historical diagnostic paths; kept±12 PK validity/finite/stability/signed24 preflight and main warning/confirmation. Main FreeDSP edits clamp visibly/logged(+14→+12,−15→−12), direct nonfinite edits reject; imports/render/history/Slots/saved state normalize nine. Restore Default Bands uses31/62/125/250/500/1000/2000/4000/8000Hz/Q.7/PK/gain0/enabled; Flat preserves frequency/Q/type/enabled and zeros enabled gains. Both local-only. Main AUTO REDUCE local gains only/no preamp/no autoSync. Vite/dev clickable hostname localhost matches helper Origin without widening CORS.
Verification PASS: focused90 frontend tests;69 native synthetic tests/parity; lifecycle mocks and PS parser; isolated localhost Vite HTTP200; final verify.ps1 build+227tests/23files; git diff --check. No Codex hardware access. Non-FreeDSP protocol code unchanged. Next milestone Preamp; not started.

## M2T research checkpoint — verified source facts
Henry reports FreeDSP nine-band defaults and structure-preserving Reset to Flat hardware/UX PASS. Source inspection verified independent generic Tone Tilt state with band-center gain serialization; generic mic levels are random animation and its toggle has no actual capture/loopback call. No hardware action performed by Codex.

## M2T completed software research / controls classification
- Added pinned static APK control inspector and fixture: both DEX inventories, Freeman config/conversion instructions, gain conversion callers and three arm64 libraries including JNI arithmetic disassembly. No app/native code executed by the inspector.
- Verified original Tone Tilt independent host state and band-center gain serialization; original mic monitor uses random animation without actual audio capture/loopback; Auto Preamp depends on device gain setter.
- Added FreeDSP-only main-page unavailable-control note/titles, reset visible Tilt/preamp on connect, prevent delayed Auto Preamp enabling and stop simulated mic meters. Other DAC controls retained; no new hardware commands.
- Recorded Henry's FreeDSP default9/structure-preserving Flat hardware/UX PASS, and original generic reset source/history evidence. No new control hardware validation claimed. Codex performed no hardware operations.
- Final offline verification: focused51 frontend tests PASS; final verify.ps1 build+235tests/24files PASS; native69 synthetic tests PASS. Existing VM test dependencies updated for new UI functions. Native loopback used FAKE child only, no hardware. Non-FreeDSP protocol changes: NO.


## M2U — preamp research completed within documented static scope, 2026-10-08
- Preserved Henry's nine-band stereo PEQ RAM hardware PASS and native transport PASS. No new preamp hardware result or implementation claimed. Preamp remains highest-priority unresolved feature; Flash remains last.
- Added pinned offline inspect-preamp.py: both DEX files (11,398/487 classes),23 Android API boundary calls,five direct USB controlTransfer sites,nine Conexant native declarations,all36 arm64 ELF symbol/targeted-string inventories. Stored original instructions/library hashes in fixtures.
- Followed PCM setGlobalGain companion -> JNI -> pcm_mixer_set_globle_gain -> resolved powf PLT call -> software object+4 store. Recorded Airoha mastergain as a different API family and unassigned Dart USB/BLE pregain strings as an explicitly incomplete call graph.
- Reviewed cached Freeman constructors187/188/190/220/259/346/442/446/477/90, HID volume-key callbacks and all57 existing helper pairs. No new packet semantics or hardware access introduced.
- Checked current upstream history/Issue3/available fork deltas; public FreeDSP Studio/devicePEQ/DacVolumeFix/Hub research; USB-IF UAC1/UAC2 standards and Microsoft endpoint-volume semantics. Recorded exact-device descriptor/control evidence gap and static-analysis limits in ROADMAP.
- Reinforced upstream cleanup/isolated-device/native transport-only rule and real preamp versus PEQ/OS-volume boundary in GENERAL/DECISIONS. Production source unchanged; no diagnostic writes or hardware tests prepared.

### M2U automated verification
Focused preamp evidence tests:5 PASS. Final verify.ps1: TypeScript/production build PASS;240 tests across25 files PASS, no hardware. git diff --check PASS. No production runtime changes; analysis/test/docs only.


## Control Research Round1/4 COMPLETE — 2026-10-08
- Read exact present FreeDSP35D8:1496 through Windows PnP and standard hub connection-info/configuration GET_DESCRIPTOR. Captured device descriptor plus all422 configuration bytes with SHA256/request log; currentconfiguration1.
- Decoded UAC2 bcdADC0200/ACinterface0, playbackAS1/captureAS2/HID3, terminal1/3 playback and4/6 capture, FeatureUnits2/5 and ClockSources9/10. Playback2channels bitmap3; separate capturemono. No Mixer/Processing/Extension descriptors.
- Verified descriptor permissions: FU2 master Mute RW/Volume absent; LEFT/RIGHT Volume RW/Mute absent. FU5 mono channel Volume RW and master Mute RW. No main UI or hardware control implementation.
- Exact Windows AudioControl service/INF is usbaudio2/usbaudio2.inf. Recorded selected raw CUR/RANGE API blocker; no raw values obtained, no class request/driver replacement or endpoint-volume substitute. No CAF, PEQ, gain, volume, Flash or stream changes.
- Added descriptor-only collector/offline parser and7 offline tests; preserved raw/decoded fixtures. No repeated APK scan.
- Recorded four-round research cap, Round1 COMPLETE and3 remaining; retained PEQ RAM hardware PASS/preamp priority/upstream cleanup rule/Flash after closure. No Round2 work started.

### Round1 automated verification
Offline Python descriptor tests:7 PASS. Final verify.ps1: TypeScript/production build PASS;240 tests across25 files PASS. git diff --check PASS after excluding regenerated dist. Runtime/non-FreeDSP protocol changes NONE; physical access only enumerated identity and standard descriptor reads.

## Control Research Round2/4 — official pregain static trace complete
- Recovered pinned official APK USB debug getter, SPV setter direct ARM64/MethodChannel edges and selected Java/JNI/protocol/USB transport chain; preserved raw instruction/byte fixtures and reproduction scripts.
- Recorded concrete logical SPV setter4B012302 + Q8.8 signed16LE and native floor(dB*256+.5)/read scaling. Recorded getter decoding and official saveToFlash omitted-default=true. No calls were executed.
- Verified selected SPV worker uses Android bulkTransfer on HID OUT and endpoint enumeration requires class3 interrupt IN+OUT. Existing exact1496 fixture has HID IN83 only; offline incompatibility test passes and excludes audio isochronous OUT as substitute.
- Distinguished BLE debug PEQ-derived calculation from separate BLE0x0A/sub7/hundredths-dB setter. Recorded lack of exact1496 route and unavailable remote/cached device-function-map artifact.
- Recorded static AOT UNVERIFIED SDK/indirect-call limits; cross-checked selected direct calls against raw ARM64 and selected JNI/DEX. No exhaustive callgraph claim.
- Updated round budget to2/4 COMPLETE,2 remaining; no Round3, runtime code, non-FreeDSP protocol changes, target binary execution or hardware operations.
- Verification:7 focused offline tests PASS; final verify.ps1 build and240 tests/25files PASS; git diff --check PASS. Build-generated dist excluded from research changes.

## Control Research Round3/4 — known Freeman/CAF families classified
- Extracted targeted Freeman/FeatureConfig/controller/factory/firmware metadata bodies and direct SDK references from pinned official APK; no full APK/native/AOT rescan.
- Resolved R$xml.devicelist through resources.arsc to res/qc.xml and preserved decoded XML/hash. Exact35D8:1496 listed as Freeman3; factory compares VID/PID and constructs Freeman device.
- Classified source callers/directions/known fields for90/187/188/190/220/259/346/442/446/477. Recorded346 subkeys62/90/84/64 and exact named feature-bit map; preserved unclassified bits/tail in offline model.
- Re-analyzed all57 existing helper pairs;90x1/220x55/259x1,9 metadata/45 coefficient/1 commit; all45 coefficient logs match. No new hardware transfer or readback produced.
- Recorded firmware metadata identity/version/CRC/partition fields and absence of a targeted bundled firmware artifact; retained limits on private firmware absence claims.
- Completed candidate ranking: no new HIGH/MEDIUM CAF control survivor; exact UAC playback/capture mechanisms retained for final bounded decisions. Round3/4 COMPLETE,1 round remains; no Round4/runtime/hardware/non-FreeDSP protocol changes.
- Verification:5 focused offline tests PASS;57helper-pair reanalysis matches saved fixture; verify.ps1 build and240tests/25files PASS. Regenerated dist excluded; git diff --check PASS.

## Control Research Round4/4 COMPLETE — 2026-10-08
- Read exact FreeDSP Windows audio function service/INF usbaudio2/usbaudio2.inf; retained class driver.
- Successfully activated documented direct hardware IAudioVolumeLevel/IAudioMute on exact adapter playback/capture paths. Captured unique2-channel playback and1-channel capture nodes; all current/range/mute values and exact endpoint/part IDs preserved in primary JSON.
- Read playback-74/-74dB/muted; capture0dB/unmuted; ranges-74..0dB/step.5. Endpoint hardware mask3 and endpoint getters agree with direct hardware controls. No raw USB CUR/RANGE claim or numeric FU-ID read claim.
- Audited read and temporary diagnostic COM vtable/IID against Microsoft SDK headers; preserved source URLs/hashes. Added deterministic offline plans, identity/range guards and temporary Henry-operated original-state CLI. Codex executed no setter, listening/recording or hardware restoration test.
- Final decisions documented: Preamp FROZEN-UNKNOWN, Balance DIAGNOSTIC-ONLY, Mic DIAGNOSTIC-ONLY, Global Tone FROZEN-UNSUPPORTED; production controls unchanged/disabled. Current muted/minimum playback blocks attenuation without auto-adjustment.
- Round1 COMPLETE; Round2 COMPLETE; Round3 COMPLETE; Round4 COMPLETE. Control research CLOSED; no Round5. Next milestone FLASH / PERSISTENCE, then release/upstream cleanup/PR; none started here.
- Updated all four docs and Issue3 evidence summary; production/runtime/native helper/non-FreeDSP protocol unchanged.

### Round4 automated verification
9 focused offline Python tests PASS (no COM/device calls); diagnostic --help PASS without hardware activation. Final verify.ps1: TypeScript/production build PASS;240 tests across25files PASS. No setter/listening/recording/restoration test executed by Codex. Build-generated dist excluded from research commit. git diff --check PASS.

## 2026-10-08 — documentation-only production-scope checkpoint
Recorded Henry's final hardware results and production decisions (manual evidence reported by Henry; not a new Codex hardware test):

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

- Balance is deliberately excluded from production due to low current product value. Mic Volume/Mute is deliberately excluded because attenuation cannot meet Henry's microphone amplification requirement. Diagnostics/evidence retained; no production integration performed.
- Updated upstream audit findings: inherited Savitech command22 Balance coverage/device list and missing generic UI protocol gate; no per-model hardware PASS inferred. Recorded absence of an equivalent source Balance implementation for Moondrop/Conexant/FiiO and simulated Math.random mic meter peaks; preserve other DAC behavior and audit FreeDSP exclusions before PR.
- Updated all four docs; recorded four-round research closed, no Round5. Final scope: Connect/native transport,9-band stereo PEQ,Sync RAM,Unity Restore/reset UX,Flash/persistence,release cleanup,upstream cleanup,PR preparation.
- NEXT MILESTONE FLASH / PERSISTENCE is the only remaining hardware feature milestone. Not started. No code change, Balance implementation or hardware operation at this checkpoint.
- Verification for this documentation-only checkpoint: git diff --check PASS; no tests/build/hardware checks run.

## 2026-10-08 — final product / upstream strategy documentation checkpoint
- Updated GENERAL/ROADMAP/DECISIONS/DONE only; no production implementation, Flash work or hardware operations.
- Recorded exact35D8:1496 Moondrop FreeDSP as sole current KNOWN_DACS CONEXANT device; current CONEXANT production branches effectively target FreeDSP only.
- Recorded supported product scope: normal CONNECT/native HID transport,9-band PEQ/real-time curve/editor, RAM Sync,Unity Restore, local presets/import/export/undo/redo where applicable, Reset Defaults/To Flat; Flash once validated.
- Recorded production exclusions: Preamp/Auto Preamp, Global Tone Tilt, DAC utility Filter Type,Amp/Gain Mode,Balance,Mic Gain/Loopback. Retained Henry-reported manual UAC Balance/Mic PASS and evidence without production integration; mic-74..0dB/step0.5 cannot boost. Four-round research closed.
- Recorded final reset decision: FreeDSP defaults31/62/125/250/500/1000/2000/4000/8000Hz,0dB,Q0.7,PK; flat9 x1000Hz/0dB/Q1.0. Generic10-band semantics preserved. This supersedes temporary preserve-frequency/Q flat policy; runtime changes remain pending cleanup, not implemented/PASS here.
- Recorded inherited audit boundaries: dedicated9-band CONEXANT path; partially reverse-engineered/unvalidated PEQ/Flash; no-op globalgain; software-composed Tone; Savitech utility commands; simulated Math.random mic meters. Other DAC behavior preserved; unsupported FreeDSP utilities/debug surfaces require pre-PR cleanup.
- Final roadmap recorded: FLASH / PERSISTENCE -> upstream/product cleanup -> production build/release candidate -> regression verification -> final branch push -> upstream PR. Flash is the ONLY remaining hardware feature milestone, not started.
- Documentation verification: git diff --check PASS only; no tests/build/hardware verification run.

## FreeDSP Flash milestone — software implementation completed; hardware pending (2026-10-09)
- Cross-checked full saved official saveEQParamsToFlash/switchEQMode instructions and all55command220 pairs; added deterministic analysis script/derived JSON and evidence note. Confirmed observed order90custom0,9metadata,45band/rate coefficients,commit255; metadata gain integerdB/Qtrunc256; preserved source/dump versus hardware evidence limits.
- Implemented complete isolated56-packet plan and unity plan, reusing same RAM coefficient model, fullband/rate stability/range preflight, disabled unity and exact local snapshot beforeSET. No Tone/Preamp/Balance/Mic content.
- Integrated existing Save permanent workflow for exactFreeDSP with native transport; added shape-limited90/220 and immediate first-response mismatchSTOP. Native helper remains transport-only; no native coefficient/business implementation. RAM sequence and otherDAC senders unchanged.
- Added perpacketSTART/PASS/ACK-count/failure logs, sharedBUSY/STOP, no retry/rollback/reset; saved editor is not deviceFlash backup. Completion labels do not claim persistence or readback.
- Added importable negative-only9-band test profile and one power-removal/reconnect manual sequence. No hardware operations by Codex. READY FOR HARDWARE VALIDATION / NOT YET HARDWARE PASS.
- Retained final9-band Defaults/Flat cleanup decisions without reset runtime changes; future cleanup/release/regression/PR awaits Henry persistence result.

### Flash offline verification completed
Focused4files/73tests PASS (including14Flash tests, actual generic Save regression and existing profile parser). Native72mock tests PASS, including exact56primitive exchanges/shape rejection/immediate first mismatchSTOP; no hardware calls. verify.ps1 once PASS: TypeScript/production build,254tests/26files. Derived official Flash JSON reproduces savedsource/dump and importable safe profile matches generator. git diff --check PASS. Build-generated dist excluded; no release packaging/PR or hardware validation performed.
