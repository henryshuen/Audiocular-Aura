M2S UX final verification: focused16tests PASS; verify.ps1 once PASS (TypeScript/Vite build,21files/184tests); generateddist restored; git diff --check PASS. No hardware access.

## M2S main-page UX follow-up — ready
Henry reports original CONNECT DAC succeeded, identified exact FreeDSP/CONEXANT, ONLINE. This verifies chooser/open/identification; no new matching response or RAM-write evidence in this report.

### Research checkpoint
- Examined: Hardware Memory Controls markup, configureFreeDspUI visibility, main Restore handler, existing restoreFreeDspUnity, setABCompareState and resetToFlat.
- Verified source: existing Restore was hidden/displaynone by default and enabled onFreeDSP configure; long paragraph sat in nowrap flex action row. Exact cause of Henry's missing button cannot be proven by static inspection alone. Now explicit displayflex, wrapped FreeDSP row, description/status below actions. Actual DOM-model connect UI configuration test verifies visible/enabled Restore, disabled Send/Flash, and generic reconnect restoration.
- Verified source/mock: SlotA/B/OFF are local EQ/globalGain snapshots; FreeDSP skip sync. SlotB general default had10bands, nowFreeDSP-only9unity; otherDAC default10/sync unchanged. RESET TO FLAT localFreeDSP unchanged. Existing hardwareRestore ignoresinvalideditor, sends18paired190, leaveseditor untouched and firstfailureSTOP/no retry; handler updates explicit RAM status.
- Hypotheses: previous layout or stale page may explain missing control; neither confirmed.
- Discarded: ResetFlat=hardwareRestore; Slots=hardwarebanks; SendToDevice=provenFreeDSP action.
- Unresolved: browserCAF matching replies and WebHID RAM/listening outcome remainPENDING.
- Next target: Henry presses RESTORE FREEDSP RAM TO UNITY in existing Hardware Memory Controls. Timeout/error STOP and retainlog; no manual intermediate tests or Codex hardware actions.

### Problem / hypothesis / next action
Observed problem: ONLINE FreeDSP but no clear accessible RAM unity action; duplicate generic controls ambiguous.
Verified facts: existing WebHID Restore implementation, localSlot snapshots, FreeDSP9wire plan, no Flash/native inRestore.
Possible causes: hidden/display/layout or stale content; exact visual failure unconfirmed.
Ruled out / weakened: generic ResetFlat/Slot action as substitute forhardwareRestore.
Next validation: focused actual UI/handler/localSlot mocks then verify; Henry's next action is explicitRestore.
Possible fix direction: clear visiblebutton plus LOCAL EDITOR/FREEDSP RAM status; do not alter protocol.

## Evidence for upstream / Issue #3 — M2S UX increment
Henry confirms original chooser/open/identity/ONLINE. It does not establish CAF input events, matchingACKs orRAMwrites. Normal Hardware Memory Controls now exposes existingWebHID unityRestore; SEND TO DEVICE/Flash disabled forFreeDSP; localReset/A/B/OFF labelled local only. No serializer/transport/math changes. Offline UX/handler proof is distinct from pendingphysicalWebHIDRAM.

### Scope / regression check — M2S UX
- FreeDSP-specific: main-page visibility/status/capability branches; fourdocs.
- Analysis/tests: tests/freedsp/webHid.test.ts actualconfig/handler/Slot regression.
- Shared runtime: index.html,src/fn.ts,src/main.ts; exactFreeDSP-only behavior. NoDSP/transport/native edits.
- Non-FreeDSP protocol code changed: NO.

# M2S — upstream WebHID architecture checkpoint
Current: offline implementation READY; browser transport hardware PENDING. Henry reports M2R P1/P2 positive and negative-nine stereo PASS; quiet repeatable clicks non-blocking, exact cause UNKNOWN. No new raw hardware log supplied this round.

### Research checkpoint
- Examined: original fn CONNECT chooser/open/identification, dsp protocol dispatch/sendReport/input listener/realtime queue, main Sync/safety/Flash; M2G/H transport evidence; native Safety/codec/ACK rules; WebHID specification https://wicg.github.io/webhid/.
- Verified: WebHID report ID separate from61body; native buffer62includesID1. Original chooser prefers vendor-defined interfaces, but CAF is consumer usage12/1 with61input/output; exact FreeDSP selection must override generic collection preference only for this VID/PID. Generic dsp input listener ignoresCONEXANT; small adapter pending matcher belongs there. Existing profile/undo/drag call sync/queue, so FreeDSP must explicitly exclude implicit writes while preserving other DACs.
- Verified: M2G346 send success with zero input events; API has no Input GET_REPORT. Native success does NOT prove browser responses. A bounded event implementation can be prepared but cannot be declared transport-verified offline.
- Hypotheses: CAF event replies may remain unavailable on Henry's Windows Chrome. Native GET-only response is strongest existing evidence; no fallback or fabricated rate introduced.
- Discarded: blindly send62nativebytes; feature fallback; host send completion=protocol success; legacy90/Flash/tilt writes; forcing echo fields absent in native ACK0.
- Unresolved: event availability; stale same-command count0 ACK has no verified transaction/echo discriminator. Serialization, finite wait and pending ordering cannot prove causal freshness for indistinguishable ACKs; no new transaction bytes invented.
- Next target: deterministic WebHID mocks, native-export equivalence vectors, original UI wiring tests; one future user WebHID session stops at first missingresponse.

### Research checkpoint — implementation/test convergence
- Examined: normal CONNECT VM, actual Sync/edit VM, new WebHID adapter, sharedCAFcodec, C# exported21vectors and nativefixture drift check, optional dev native switch.
- Verified offline:56focused tests PASS; native65tests PASS including fixture parity. Original CONNECT registersCAFlistener beforeopen and sendsnothing. ExplicitSync writes188→187→346→18paired190; disabledunity; snapshot plans immutable afterfirstSET; unrelated/nonreply ignored; firstwritefailure/timeout STOP withno retry/rollback; invalideditorRestore canonicalunity. ThreePKprofiles/wire1,5,9/path0,1 +188/187/346 native vectors exactlyequal browserbody withID removed.
- Verified scope: FreeDSPdrag,typing,enable,undo/profile/import/reset staylocal; otherDAC update callback stillqueues. Flash andgenericutilities explicitlyguarded forFreeDSP, normalconnect andRestore use noHTTP/nativeprocess. dev.ps1 defaultVite only; -NativeDebug retains existingowned lifecycle.
- Hypotheses: event-return availability remains the transport risk, not resolved bythese mocks.
- Discarded: nativebridge needed tostartnormaldev; duplicate permanentFreeDSPconnect panel.
- Unresolved: physicalWebHIDacceptance/RX/delivery/listening; same-commandACK0freshness cannotbeestablished fromunverifiedtransactionfields.
- Next validation: oneHenrysessionbelow; onmissingreplySTOPandretainlog, no repeatedunchangedbrowserprobe.

## Evidence for upstream / Issue #3 — M2S
Hardware verified (Henry-reported): native190RAM,9wires,path0LEFT/path1RIGHT,equalstereoApply/Restore; M2R P1+6/P2controlledpositive/negative-nine PASS; quietrepeatableclicksnonblocking,causeUNKNOWN. Newrawlognotprovided.
Transport verified: nativeHidDSET/GET andreport62representation. BrowserdescriptorID1/body61 andM2Ghostsendverified; inputeventresponse NOTverified (priorqueryrawTotal0).
Offline verified: genericchooser/CAFselection/open/listener, explicitSync/free-onlylocaledit, sharedCAFbody and21nativefixturevectors, boundedmatcher/preflight/STOP/invalidRestore. ThisdoesNOTprovebrowserbus/RX/audio.
Inferred: sameCAFbodyshouldconveyidenticalcommands acrossAPIs; hostsend method andRXchannel differ, so hardwareoutcome cannotbeassumed.
Unknown: eventdelivery; staleindistinguishableACK0; officialpathnames; popcause; preamp/tilt/utilities/Flash.
Future validation: oneoriginalCONNECT→Restore→importmixed→Sync→edit→Sync→Restore session; timeoutSTOP with log, no nativefallback. Productionarchitecture-compatible status ONLY after realWebHIDPASS.

## M2S one manual WebHID session
Stop olddev Ctrl+C; `cd D:\Henry\Documents\ChatGPT\AuraPEQ`; `.\scripts\dev.ps1`; open **http://localhost:5173/**.
Original CONNECT DAC→chooseFreeDSP→normalconnectedmetadata. Click FreeDSP RAM Restore 全九段雙聲道unity. If timeout/error STOP, preserve mainlog; do NOT proceed/listen/retry or infer190waswritten.
If Restore protocol completes: existing Import Profile→docs/freedsp-m2s-mixed.json (globalGain0,100Hz−3 plus250/1000/4000Hz+1 each,Q1); inspectgraph. Import islocalonly. Explicit SYNC/SEND TO DEVICE→listen both ears/center/spectral effect, recordquiet/abnormalclicks. Drag/edit PK→verify noTXlogwhileediting→explicitSyncagain→listen→hardwareRestore→confirmbaseline. LocalRESET TO FLAT onlychangeseditor; hardwareRestore leaveseditorunchanged.
APOOFF,Windows1–2/100 initially,firstpositiveApplyIEMout,music/no testtones; abnormalnoise/loudnessstop. Exactlyonesession,nointermediatecodinground.

### Scope / regression check — M2S
- FreeDSP-specific: src/freedsp/cafCodec.ts,webHid.ts,officialRamProof.ts,webRam.ts; docs/freedsp-m2s-mixed.json; fourdocs.
- Analysis/tests: tests/freedsp/webHid.test.ts,nativeM2sVectors.json,graphicalRam.test.ts; nativeTests/Program.cs.
- Shared runtime: main/fn/dsp/peq/importExport,index.html onlyFreeDSPadapter/lifecycle/explicitSync/capabilityguards; scripts/dev.ps1 optionalnative diagnostic.
- Non-FreeDSP protocol code changed: NO. Existingprotocolsenderbranches unchanged; otherDACedit callback queue regression PASS.

### M2S automated verification / next milestones
Final verify.ps1 PASS (repeated after final FreeDSP-only Ctrl+S scope correction): TypeScript/Vite build,21files/181tests. Focused4files/56tests; native65tests including actual21vector fixture contract; PowerShell lifecycle mocks PASS. No physical hardware access or service termination. Build contained no127.0.0.1:5174 native API reference; generateddist restored and isolatedtestoutputs removed. git diff --check PASS on intended changes.
After actual WebHID session PASS only: classify RAM production architecture compatible, retire unused graphical native experiment; M2T real FreeDSP preamp/global-gain research → tone tilt → each utility classification → dedicated Flash220/persistence validation. Native diagnostics retained separately. No features in these later phases implemented now.

### Architecture decision
Original CONNECT DAC → exact CAF selection/listener-before-open → existing device identification/controls → dsp FreeDSP adapter → explicit Sync18paired190 at matching346rate. Native math reused via existing tested TS model; shared CAFcodec provides body/nativewrap. Original local profiles retained; normal main page has no bridge call/native connect workflow. Optional dev.ps1 -NativeDebug enables diagnostic bridge only; default dev requires Node/Vite only.

### Problem / hypothesis / next action
Observed problem: production-native dependency and duplicate connect UX conflict with upstream architecture; browser query previously had noevents.
Verified facts: native RAM/positive/stereo verified by Henry; WebHID framing proven, event response NOT verified.
Possible causes: control GET-only firmware replies versus interrupt-event mismatch.
Ruled out / weakened: fixing framing alone guarantees browser RX; nativepass impliesWebHIDpass.
Next validation: offline protocol/matcher/UI equivalence, then ONE user session; if timeout stop, no repeated unchanged tests.
Possible fix direction: normal architecture adapter with strict failure reporting; if existing transport limitation persists, document blocked production capability rather than falsely claiming WebHID support.

﻿# AuraPEQ FreeDSP Roadmap

> Current gate: M2R long milestone READY for Henry manual validation #1/#2. M2Q negative nine-band stereo Apply/Restore hardware PASS. Prepare positive PK, timing/observation panel and gated graphical explicit Sync in ONE build; exactly two future manual sessions. Positive gain and graphical integration hardware results remain PENDING. No preamp/Flash.

## M2R research checkpoint — preparation
- Examined: d5e1516 baseline; Henry's four screenshots and full milestone request; main/fn graph-edit callbacks, generic safety modal, native RamDebug and existing official RAM/SDK fixtures.
- Verified: per-band ±12dB does not bound cascade gain; existing generic peak calculation uses 200 log samples, RBJ coefficients and tilt; preamp is checked separately by the modal, not included in that peak. Gain-sum warning is a conservative heuristic, not a calculated cascade peak. Native model differs in float/scaling/Q conversion and is the required FreeDSP write model.
- Verified: official Java first-enable sequence188 `[1,0×12]`,187 `[0]`,346/current rate,190; setFreeman3EQ has no recovered automatic90 afterward. Official names setFreeman3EQEnabled/setEQCFGIsBypass do not prove187 is a transient-free update window. Historical57helperpairs contain no190. No confirmed smoothing/crossfade/bank/atomic-update mechanism in examined evidence.
- Hypotheses: one hot coefficient update per wire may produce one perceptual pop because stereo writes are close; approximately9 vs18 is not timestamp-correlated. DSP state, prerequisites and polling effects remain possible.
- Discarded: allnine+6dB as safe test; perband+12 implies combined+12; generic utility UI implies FreeDSP support; arbitrary mute/commit commands as a click fix.
- Unresolved: positive hardware behavior, pop cause, official channel names, exact native1LSB rounding, mid-operation sample-rate changes, Flash/preamp/utility semantics.
- Next target: paired positive-model tests, native preflight composite safety, monotonic190 logs; isolated observations/gate then main graphical local edits and explicit native Sync.

### Research checkpoint — graphical integration
- Examined: new src/freedsp/graphicalRam.ts session, main explicit Sync/modal routing, fn manual/autoconnect and rendered inputs, peq native float display branch.
- Verified offline: manual gate prevents metadata connect until user-reported local validation; bridge-only mode does not assign a legacy HID device. Actual updateState ran103 local edits in a VM without queue calls; mounted buttons perform only explicit Sync/Restore. Unsafe or unsupported gain/tilt state blocks transport. Other-mode RBJ coefficients unchanged; FreeDSP plot uses native float48k visual model, actual SET rate remainsmatching346.
- Hypotheses: graphical perceived PEQ should align with paired model but hardware proof is session#2, not these mocks.
- Discarded: debounce as sufficient protection from drag writes; generic Proceed Anyway bypassing FreeDSP hard policy; main curve as readback or exactcurrent-rate response.
- Unresolved: positive and graphical hardware outcome; click cause; native1LSB approximation.
- Next target: finish isolated observation panel/native timings andfocused tests, finalverify, then the two Henry sessions without another implementation round.

### Research checkpoint — M2R implementation ready
- Examined: final isolated observation UI, native Safety/TimingHid, paired packet mocks, main graphical mounted controls and actual local-edit callback.
- Verified offline: 31 focused frontend tests PASS; native64 mock/offline tests PASS. No automatic startup bridge calls; nine rows/Connect render first. Full-nine baseline Restore required before isolated Apply. Single-band accumulation guarded; all Apply plans and composite response checked before transport/SET. Observation selectors resetU after each operation, cannot imply hearing from protocol PASS.
- Verified: P1/P2/NEG each exact preset records Apply audibleY+stereoC and Restore recoveryY+stereoC before local gate; click/pop optionalU. Latest contradictory observation revokes gate; every hardware operation revokes old gate pending new confirmation. Invalid editor and protocol fault do not disable explicit full-nine Restore; fault prevents further Apply until successful full Restore. This is a new manual unity operation, not automatic rollback/retry.
- Hypotheses/unresolved: positive audibility/stereo and graphical behavior are PENDING hardware; pop cause remainsUNKNOWN. Host monotonic SET/GET/matching timing is not audio or USB bus capture.
- Discarded: automatic listening success, stale observation reuse, enabling graphical path on protocol success alone.
- Next search/validation target: Henry's TWO sessions below; no intermediate coding round or hardware action by Codex.

### M2R final automated verification
Focused frontend:3files/31tests PASS; test TypeScript compile PASS. Native:64 offline/mock tests PASS using isolated output because existing Henry dev bridge held Release DLL; no service stopped, no hardware touched; temporary output removed. Final verify.ps1 ONCE: TypeScript/Vite build PASS,20files/168tests PASS. Generated tracked dist restored; git diff --check PASS on intended source/docs. Native coefficient serializer/math remains the existing model, with positive validation/safety/timing in isolated executor only. Positive/graphical hardware tests remain PENDING.

## M2R manual validation — same build, two sessions
Restart old dev with Ctrl+C, then `cd D:\Henry\Documents\ChatGPT\AuraPEQ` and `.\scripts\dev.ps1`; open **http://localhost:5173/**.
1. Isolated session: click M2R debug link → metadata Connect → Emergency Restore full-nine. P1 fill Band5 1000Hz/+6/Q1 → Apply selected → listen/record audibleY orN/U, stereoC/L/R/U, popN/1/B/M/U → Restore selected → record recovery/stereo/pop. P2 fill three+1 preset → full-nine Apply/record → full-nine Restore/record. NEG fill existing negative-nine → full-nine Apply/record → full-nine Restore/record. Explicit observations only; never selectYES without hearing it. P1/P2/NEG successful centered/recovered records unlock local graphical gate; clicks canremainU.
2. Graphical session: return main page → gated FreeDSP metadata Connect → explicit Emergency Restore all unity → fill conservative mixed preset (local only) → drag/edit gain/Hz/Q/enable, PK only → check composite → explicit Sync → listen both ears/center → edit again → explicit Sync → Emergency Restore → confirm both sides baseline. Dragging never sends. Restore leaves editor unchanged; resync reapplies editor.
Safety both sessions: APO OFF, Windows1–2/100 initially, firstpositiveApply IEM out, music only/no test tones; abnormal loudness/noise/distortion stop. No preamp/Flash. Positive boost can clip;6dB budget is not certified headroom.

### Scope / regression check — M2R
- FreeDSP-specific files changed: src/freedsp/webRam.ts, graphicalRam.ts, ramDebugPage.ts; freedsp-ram-debug.html; tools/freedsp-native/RamDebug.cs; fourprojectdocs.
- Analysis/test files changed: tests/freedsp/webRam.test.ts, graphicalRam.test.ts, ramUiStartup.test.ts; tools/freedsp-native/Tests/Program.cs.
- Shared runtime files changed: src/main.ts, src/fn.ts, src/peq.ts strictly for FreeDSP routing/editor/native visual model. Generic protocol sender/math branch unchanged.
- Non-FreeDSP protocol code changed: NO.

## Evidence for upstream / Issue #3 — M2R offline increment
- Hardware VERIFIED (Henry): UI1..9→wire1..9; path0 LEFT/path1 RIGHT, hardware-derived names; M2Q negative full-nine Apply/Restore each18command190, equal-ear/center/recovery PASS. Invalid-editor explicit unity Restore regression verified offline.
- Offline implemented: PK±12 coefficient validation; identical stereo plans precomputed at allfive knownrates before ANY SET; matching346 selects one current rate. Positive budget≤6dB plus sampled quantized cascade peak≤6.1dB hard-block, no Proceed Anyway/preamp. +12 mathematical support does not authorize +12 Apply under this test budget.
- Positive and graphical hardware validation PENDING. Main GUI bridge-only gate prevents legacy HID sender and realtime drag writes; explicit Sync/Restore only. No readback/persistence claim.
- Click evidence: approximately9 transient sounds reported per18writes; no190 in historical57helper pairs. Recovered Java first-enable188→187→346→190 does not establish mute/smoothing/atomic commit. No extra protocol commands added. Host Stopwatch SET/GET/exchange logs are instrumentation, not USB/audio timestamps.
- UNKNOWN: exact pop cause, official SDK channel names, native1LSB rounding, preamp, persistence/Flash, generic utility-control support. Next evidence: one isolated positive/negative observation session, followed by gated graphical session in the same build.

## M2R future roadmap after both PEQ sessions pass
1. Preamp: investigate real global-gain protocol; old setGlobalGainConexant was a no-op. No biquad stacking emulation. Negative/positive gain, Auto Preamp and headroom require evidence.
2. Global Tone Tilt: determine native support versus translation to supported PEQ; neither assumed or implemented now.
3. Device Utility Controls: DAC filter/amp mode/gain mode/channel balance/mic loopback/mic gain/factory reset/refresh database/firmware version are UNKNOWN for the generic main controls' FreeDSP protocol support. debugInspect confirms only exact HID collection/metadata, no SET/GET and no firmware query. UI availability is not support evidence; no generic command sent.
4. Persistence/Flash: separate command220/official persistence study and explicit hardware validation plan only after RAM/controls stable; no Flash now.

### Problem / hypothesis / next action
Observed problem: M2Q stereo works but ~9 clicks per Apply/Restore; positive gain and graphical Sync remain unverified.
Verified facts: paired19018writes at current rate work for negative PK; invalid editor no longer blocks unity Restore. Graph drag callback currently queues only if legacy device exists.
Possible causes: hot replacement/state discontinuity, not established. Combined boost can greatly exceed each filter's gain.
Ruled out / weakened: path0-only as current paired-write issue; need for another implementation round between isolated and graphical manual sessions.
Next validation: software/mocks first; Henry session#1 P1/P2/negative Apply/Restore stereo/audible/click observations, then session#2 gated graphical mixed edits/Sync/Restore in same build.
Possible fix direction: one positive PK RAM pipeline, explicit-only updates, perband±12 plus conservative6dB positive budget and quantized-model sampledpeak≤6.1dB (0.1dB numerical allowance). Restore independent of editor/observations; no speculative hardware commands.

## 2026-10-08 — M2Q hardware evidence update / Restore UX
Henry 回報全九段 Apply／Restore 各 18 command190 PASS，雙耳等量、中心不偏、Restore 正常。負增益九段有預期強烈頻譜塑形；低頻手動塑形有 high-pass-like 聽感，支持 per-wire frequency/gain 行為，不等於頻率響應量測或 HP filter 驗證。本輪依使用者回報，未提供／檢查新 raw log，Codex 不操作硬體。
每次 Apply／Restore 約九個小 click/pop；原因未證實。PK／20–20000Hz／−12..0dB／Q0.1..10 是 debug 安全範圍，非已確認硬體限制。低於 −12dB 曾鎖住操作；重啟 dev.ps1 並 Restore 後恢復。全九段手動確認最終啟用正常，不能列為 confirmed button bug。

### Research checkpoint
- Examined: ramDebugPage.ts、webRam.ts、native RamDebug.cs 的 validator／failure／Restore／逐 path 寫入與既有測試。
- Verified: Restore 共用 editor 驗證；本地例外設 faulted 並鎖住 RAM。native restore 生成 unity；host 逐 wire/path190 沒有顯式 ramp 或原子 batch commit。
- Hypotheses: hot coefficient update／DSP state 突變可能造成 click；九次與九 wire 分組相符但未時間對齊，不能證明一對 190 一次瞬變。prerequisites／polling／state 亦未排除。
- Discarded: −12dB 是硬體極限、確認按鈕已確認故障、本地輸入錯誤等同 partial hardware failure。
- Unresolved: firmware smoothing／filter state、瞬變時間對應、正增益安全行為。
- Next target: A 獨立正增益 PK 規劃；B 未來同步音訊與 command timing 的單段／全九段比較。本輪不要求硬體操作或更改 pacing。

### Problem / hypothesis / next action
Observed problem: 全九段效果與 stereo 通過，但約九次 click/pop；無效 editor 原本阻擋 unity Restore。
Verified facts: Henry 雙耳等量／置中／恢復 PASS；本地 validator／faulted 鎖定已確認。固定合法 Restore 快照不需 editor 或讀回。
Possible causes: hot-update／state discontinuity，尚無音訊與封包時間對齊，不能指定 firmware 原因。
Ruled out / weakened: M2O path0-only stereo 缺陷由雙 path Web 驗證解決；不是 production completion；debug 範圍不是 hardware limit。
Next validation: mock 驗證無效 gain／freq／Q 不送 Apply、仍可明確 Restore；transport failure 不自動解鎖。後續 A→B→C→D，C 小修本輪處理。
Possible fix direction: 本輪只 editor preflight／獨立 unity 快照；未來依證據研究 smoothing／state，不盲加 mute／delay／重試。不開正增益、preamp 或 Flash。

## Evidence for upstream / Issue #3 — M2Q hardware increment
Henry reports full-nine Web RAM PASS: wire1..9 × path0 LEFT/path1 RIGHT, 18 command190 per Apply and unity Restore; equal-ear changes, centered stereo, normal restoration. Channel names are hardware-derived. Negative preset and manual low-frequency shaping support per-wire behavior, not response measurement/readback/persistence. About nine click/pop transients per operation; cause UNKNOWN. Debug bounds are safety policy, not device limits. Shared editor validation/fault previously blocked Restore; isolated frontend now uses fixed valid unity requests for explicit Restore. Native serializer/math/API/production unchanged. Positive-gain validation then click investigation before production; no preamp/Flash.

### Scope / regression check
- FreeDSP-specific files changed: src/freedsp/ramDebugPage.ts, src/freedsp/webRam.ts, freedsp-ram-debug.html; GENERAL/ROADMAP/DECISIONS/DONE.
- Analysis/test files changed: tests/freedsp/ramUiStartup.test.ts, tests/freedsp/webRam.test.ts.
- Shared runtime files changed: NONE.
- Non-FreeDSP protocol code changed: NO.

### M2Q hardware update / Restore UX automated verification
Focused webRam + ramUiStartup: 2 files／21 tests PASS；包含 gain<-12、NaN frequency、Q0 的 Apply 拒絕與明確 Restore 有效 unity snapshot、不修改 editor，UI invalid input 不設 transport fault；既有 transport-failure STOP 回歸仍通過。verify.ps1 本輪一次 exit0：TypeScript/Vite build + 19 files／158 tests PASS。git diff --check PASS；generated dist 還原。首次 sandbox 測試因 temp rename EPERM 未執行，正常權限重跑通過。未操作硬體，未改 native/protocol/math/production。

## M0 - Local reproducible baseline — COMPLETE
- [x] fork / upstream configured：Round 0.5 已確認 origin 分支可讀取且與本機 HEAD 相同。
- [x] dependencies install：未修改的 package-lock.json，npm ci 成功。
- [x] build succeeds：upstream baseline 的 tsc && vite build 成功。
- [x] PowerShell scripts：語法解析、setup、verify、dev 啟動及 strictPort 失敗路徑驗證通過。
- [x] localhost server：127.0.0.1 與 localhost 的直接 HTTP GET 均回傳 200。

基準 commit：af0bcf7057860307bf81b00746f0cbdb93366514。
日期：2026-10-07（Asia/Taipei）。Node v24.16.0 / npm 11.13.0。
branch：fix/freedsp-conexant。
origin：https://github.com/henryshuen/Audiocular-Aura.git。
upstream：https://github.com/mandy321/Audiocular-Aura.git。
Round 0 當時 gh auth status 回報權杖無效，fork 查詢回報 Repository not found；
因此當時以 upstream clone 到專案根目錄，未建立巢狀目錄。
Round 0.5：Henry 已建立 fork；git ls-remote origin refs/heads/fix/freedsp-conexant
確認遠端 SHA 為 af0a73c45db495f0b7a9cb6d6c70c04af4d1f647，與本機 HEAD 相同。
此提交包含 Round 0 四份文件及三支 PowerShell 腳本。
本機追蹤 origin/fix/freedsp-conexant，ahead/behind 為 0/0；Round 0.5 開始時工作目錄乾淨。
npm ci 回報 5 vulnerabilities（1 moderate、4 high）；未執行 audit fix 或升級依賴。
M0 與 M1 已完成；M2A descriptor 已由 Henry 檢查，未送 RAM。M2B 已提交；
M2C-Research 找到官方 app helper TX/RX dump；M2D-Deep已恢復官方Java serializer，62-byte HID buffer／61-byte WebHID data邊界HIGH confidence。
M2D只完成離線格式研究；runtime尚未修改，M2 RAM proof仍NOT PROVEN。
M2E已追到JNI/native數學、Gain/exponent、RAM band/rate及enable/service鏈；比較與離線模型完成，實機原因尚未隔離。
M2F單段官方格式診斷已實作；Henry手動硬體結果PENDING，正常production runtime未更換。
M2G：Henry回報三次188 host send成功／無matching RX／2.5秒timeout，187/346/190皆未送；無EQ效果結論。
M2H：M2G346實測rawTotal=0/newEvents=0已回報；正常Windows Chrome的官方Input GET_REPORT替代路徑不可行。
本輪僅四份docs，Case C不要求手動test；native transport屬後續另輪，M2 RAM proof仍NOT PROVEN。
M2I：Henry實測SET346/GET成功、有效CAF188回應，Level1 native transport VERIFIED；matchingCAF346 NOT YET VERIFIED。
M2J：Henry實測GET#1取得matching346，Level2 VERIFIED；當時index5=48k，不證明多GET必要或queue來源。
M2K：Henry實測 padded187 accepted，wire5 RAM190 Apply有明顯可聽變化、unity Restore清楚恢復；single-band RAM effect VERIFIED。
M2L：wire6由Henry完整驗證；wire7 protocol Apply/Restore PASS、Apply audibleYES，但Restore聽感未確認；wire8/9未測。
M2L-Resume：手動工具加入StartSdkBand1..4，預定從SDK2/wire7恢復，再測wire8/9；nativeprotocol不改。
Round 0 結束時 dev server 正在執行，僅監聽 127.0.0.1:5173。
HTTP 以 curl.exe --noproxy '*' 驗證；一般 Invoke-WebRequest 曾回傳 404，
直接請求已確認 Vite 頁面正確，未改動系統代理設定。
HTTP 驗證只證明文件可提供，不證明瀏覽器 UI 或 WebHID 行為。

## M1 - Packet-level test harness — COMPLETE (software characterization)
- 遵守 GENERAL 的永久 FreeDSP-only scope 與 DECISIONS D008；新增實作優先放在 src/freedsp/。
- [x] isolate Conexant packet construction：src/freedsp/，保留原封包函式本體。
- [x] deterministic packet serialization tests：13 個 packet/Q22 測試。
- [x] mock HID transport：3 個成功、fallback、雙重失敗測試。
- [x] 固定 RAM 190、Flash 220、mode 90 來源碼 fixture。
- 實際日誌 fixture 尚無來源可建立；目前 fixture 不是硬體擷取或正確協定證據。
- [x] NO hardware behavior assumptions；沒有裝置存取，也未開始 M2。

## M2 - Single-band RAM proof — VERIFIED for SDK0 / wire5 (M2K)
Goal: Make ONE intentionally obvious attenuation PEQ change work in FreeDSP RAM.
Use attenuation, not dangerous boost, for initial real-hardware testing.
Current M2K test: PK / 400 Hz / -12 dB / Q1.0 / SDK band0→wire5.
Success: Henry can clearly hear the difference while all other variables remain fixed.

### M2A — descriptor inspection COMPLETE; RAM NOT TESTED
- [x] 精確 current / candidate byte map 與長度推導。
- [x] 開發模式的獨立 descriptor inspection 頁，無自動連線或檢查階段寫入。
- [x] 唯一候選 CANDIDATE_NO_EMBEDDED_REPORT_ID，正常同步仍使用原始 builder。
- [x] 手動 framing switch，預設 CURRENT；RAM-only Flat / attenuation 控制。
- [x] Descriptor gate：容量必須恰好匹配，不能容納 62 bytes 時停用候選寫入。
- [x] 完整 TX/status/fallback logs 與 fake HID tests。
- [x] Henry 提供實際 descriptor 摘要：output data=61 bytes；62-byte 候選未送。
- [ ] RAM 聽感與實際 TX 驗證；M2 成功尚未成立。

### M2B — 61-byte protocol reconstruction — offline investigation COMPLETE
- [x] 原始碼、提交歷史、Issue #3 與原始 Android logcat 證據調查。
- [x] 61-byte descriptor fixture、63/62-byte 矛盾與兩個 61-byte 離線假說測試。
- [ ] 最終正確封包格式；尚缺已知正常的完整 USB bytes 或 native serialization 結構。
- 不送任何候選，不更換 runtime builder，不開始硬體 RAM 測試。

### M2C-Research — serializer provenance / protocol evidence — research COMPLETE
- [x] builder來源、Issue #3完整時間軸、ASR及其原始碼連結調查。
- [x] 找到並原樣保存官方app helper dump，離線證據測試。
- [ ] 權威native serializer／確定reportId與USB transfer邊界；不啟動RAM測試。

### M2D-Deep — serializer convergence — research COMPLETE
- [x] 全57TX/RX pairs逐offset分析，命令家族、entropy、count、echo與signedness可重現。
- [x] 官方APK hash/version/device mapping、Java serializer及USB controlTransfer完整邊界。
- [x] HIGH model精確重播114buffers；190有獨立來源，commit明確255；舊尺寸模型排除。
- [ ] 官方host實際completion capture、native係數數學、短187的WebHID適配及RAM/audio proof。
- 本輪不改runtime、不送硬體，停止於M2D-Deep。舊M2B/M2C條目保留歷史狀態，已被本輪來源證據更新。

### M2E — Official RAM/EQ Semantics Reconstruction — research COMPLETE
- [x] Flutter bridge→Java service→Freeman3→JNI→native參數/係數/Gain/符號/量化靜態追查。
- [x] 45個Gain、225coefficients候選區間、payload/band/rate/framing的隔離模型與測試。
- [x] Current AuraPEQ CORRECT/WRONG/UNSUPPORTED ASSUMPTION/UNKNOWN比較與零效果原因排序。
- [ ] 九段live mapping、Dart UI排程、native精確LSB portable quantizer、短187/legacyID4/5 WebHID支持。
- 不修改production runtime、不存取硬體；M2 RAM/audio proof仍NOT PROVEN。

### M2F — First controlled hardware RAM proof — implementation READY / hardware PENDING
- [x] 官方CAF61data／externalID1、reply parser、matching ACK/timeout、精確descriptor gate。
- [x] 單段selector0／SDKband0→wire5、current346、188/187/190、動態係數與same-band flat。
- [x] DEV診斷頁手動控制，移除舊九段framing探測；Flash/production paths未改。
- [ ] Henry connection/apply/listening/restore logs；RAM proof不可提前完成。
- Henry已回報三次188 timeout；未到190，M2F RAM proof仍NOT PROVEN。M2G取代頁面write controls。

### M2G — ACK / transport diagnosis — query trial COMPLETE / response NOT OBSERVED
- [x] 記錄三次實測、完整同步GET_REPORT來源與每command policy/caller差異。
- [x] Persistent raw listener、所有輸入保存、short candidate parser、唯一manual query346。
- [x] Henry回報：open/send前raw listener ACTIVE，346 host resolved，2.5秒timeout，rawTotal=0/newEvents=0。
- 無任何ID/長度inputreport；不是parser mismatch，不前進190；不要求原樣重試。

### M2H — response transport feasibility — research COMPLETE
- [x] 官方USB參數、HID interface3來源、WebHID/WebUSB/Windows限制與hybrid判斷。
- [x] write-only、sample-rate替代來源、native方向與truthful success states比較。
- [x] Case C：無新diagnostic或manual test；只四份docs，不進production implementation。
- [ ] native transport硬體response及RAM/audio proof：尚未實作/測試，非M2H完成條件。

### M2I — Windows native CAF346 transport proof — transport VERIFIED / CAF346 NOT YET VERIFIED
- [x] 固定62-byte官方query、Windows HID/SetupAPI collection gate、SET state API→Input state API。
- [x] 零外部套件C#/.NET10及one-script launcher；不修改driver、無EQ/Flash或production整合。
- [x] Synthetic/mock及CLI rejection測試，四份文件同步。
- [x] Henry一次query：SET346成功、GET成功，有效CAF188/reply1/count1/CTRL/word0=1。
- [ ] matchingCAF346未取得；RAM190仍未送。Level1與Level2分開，非transport失敗。

### M2J — Native CAF response synchronization — implementation READY / hardware PENDING
- [x] 官方firstGET/replybit-only/1000ms/5ms流程核對，明列diagnostic matching346 correction。
- [x] OneSET、bounded GET、全部raw分類、genericCAF parser及mock synchronization tests。
- [ ] Henry執行一次同步query，matching346前不能稱Level2完成；不進Level3 RAM/EQ。

## M3 - Full 9-band real-time PEQ — PENDING
- all 9 bands
- realtime editing
- correct sample-rate behavior
- repeatable RAM writes

## M4 - A/B application — PENDING
- confirm Slot A/B UI actually causes different profiles to be applied to the active DSP path
- do not assume these are physical hardware slots unless proven

## M5 - Flash persistence — PENDING
- save known profile
- disconnect
- reconnect / Android playback
- verify persistence

## M6 - Device readback — PENDING
- read actual FreeDSP state instead of displaying local flat defaults
- verify against profile written by official Moondrop app

## M7 - Global preamp — PENDING
- determine whether FreeDSP exposes a real hardware/DSP master preamp command
- if supported, implement and test
- if unsupported, document clearly instead of faking it

## M8 - Upstream-quality cleanup — PENDING
- regression tests
- documentation
- concise commits
- prepare PR to mandy321/Audiocular-Aura

## Round 0 read-only code audit
以下行號以基準 commit 為準，僅證明程式路徑，不能證明硬體協定正確。

### Detection / layout — VERIFIED source
src/dsp.ts:121 偵測 0x35D8 / 0x1496 為 CONEXANT（前面仍有 override 路徑）。
src/fn.ts:1159-1171 在目前 band 數不等於 9 時建立九段本機預設值，並非裝置回讀。

### H1 — VERIFIED source; hardware capability unknown
src/dsp.ts:1175-1179 的 setGlobalGainConexant 只有 console.debug，
沒有 HID 傳輸或係數修改；它本身也沒有寫入 state，僅日誌稱 stored in state。
src/dsp.ts:231-232 會呼叫此函式，但 789-804 的專用 RAM sync 不呼叫 preamp。
不能從 UI 數值或 README 推論 FreeDSP 已套用硬體 preamp。

### H2 — VERIFIED source; actual readback not implemented
src/dsp.ts:381-460 的 readDeviceParams 只有 FIIO_JA11、MOONDROP 專用讀取分支。
CONEXANT 會落入 462-510 的 Savitech version/gain/settings/band 查詢，
不是安全地完全略過傳輸。setupListener 在 613-615 對 CONEXANT 直接 return，
不解析其回應；因此 Configuration loaded 並不證明回讀成功。
src/fn.ts:836、1107 連線路徑會呼叫 readDeviceParams。

### H3 — VERIFIED framing evidence; defect remains a hypothesis
src/dsp.ts:1100-1130 配置 61 bytes，packet[0] = 1，註解為 Report ID；
transaction ID 從 offset 1、header 從 3、CTRL module ID 從 7、words 從 11 開始。
src/dsp.ts:1137-1146 同時將 reportId=1 與整個 packet 傳給 sendReport，
失敗則同樣傳給 sendFeatureReport，沒有 slice。
WebHID API 將 reportId 與 data 分開，規範的 data 不含 Report ID：
https://wicg.github.io/webhid/#dom-hiddevice-sendreport 。
這支持 Report ID 重複／偏移的疑慮；尚無實機 descriptor、已知正確原始傳輸與日誌，
不能認定第一個 1 一定不是廠商 payload 欄位，Round 0 不修正。

另有可直接由程式計算的長度問題：所有這些呼叫傳入 13 words，
目前佈局需要 11 + 13*4 = 63 bytes，卻只配置 61。
第 13 個 word 在 offset 59-62，其中 61-62 超出 Uint8Array 範圍，不會被保存。
目前相關呼叫的尾端 words 為零，但宣告長度、padding 與硬體影響仍待 M1 驗證。

### H4 — VERIFIED software path; audible application unknown
src/main.ts:1170-1172 按鈕呼叫 setABCompareState。
src/fn.ts:373-467 複製本機 slotA/slotB 的 EQ/gain，再呼叫 syncToDevice。
只有 MOONDROP 有提前返回分支；CONEXANT 走一般軟體設定交換。
src/dsp.ts:789-804 每次重寫 bands，最後 switchEQModeConexant(device, 0)。
因此目前 Conexant A/B 是軟體設定交換加寫入同一 mode 0；不是實體 A/B 槽證據。

### RAM / Flash / mode — VERIFIED source only
- src/dsp.ts:1072-1078 列出 44.1/48/96/192/384 kHz 對應索引 4..8。
- 1084-1094 計算 b0,b1,b2,-a1,-a2，乘 2^22 並 round。
- 1186-1248：band.index+1；RAM 每 band 以 command 190 寫五組取樣率係數，data[2]=3。
- 1157-1169：command 90，13 words，data[0]=90、data[1]=mode index。
- 875-891、1192-1221：Flash command 220 寫 metadata 與五組係數，
  最後 command 220 的 data[0]=-1 commit；未實際執行。
- 789-804：RAM sync 完成後只顯示 Sync Complete，沒有裝置狀態或音訊驗證。

未證明：RAM 音效、取樣率實際對應、A/B 聽感、Flash 持久性、回讀、硬體 preamp。
Round 0 不建立封包測試或 mock HID harness，這些屬於待核准的 M1。

## Round 0.5 scope
僅更新 GENERAL、ROADMAP、DECISIONS、DONE，加入 FreeDSP 隔離規則及每輪 scope/regression 回報。
不修改 src 或協定程式碼，不操作硬體，不開始 M1。
verify.ps1 已通過（exit 0）；沒有 test script，單元測試為 SKIP。
本輪 HTTP 檢查確認 localhost 無法連線，伺服器目前未執行。
Round 0.5 四份文件修改尚未提交或推送；Round 0 原有提交已確認在 origin。

## M1 findings — 2026-10-07
基準 HEAD：4329bc6（Round 0.5）；開始時工作目錄乾淨、分支 fix/freedsp-conexant。
來源修改前 verify.ps1 通過 build；當時沒有 test script，測試為 SKIP。
M1 最終 npm ci 成功，verify.ps1 通過應用程式 build、測試型別檢查與 16 個測試。
原有應用程式鎖定套件 entries 不變；Vitest 4.1.11 的新版 Vite/PostCSS 等只在測試依賴樹使用。
npm ci 仍回報原有 5 vulnerabilities（1 moderate、4 high），未做 audit fix。

### VERIFIED — current source and fixtures
零起算 byte offset：

| Offset | Current contents |
| --- | --- |
| 0 | 01，原註解稱為 Report ID |
| 1..2 | 固定 transaction ID 1：01 00 |
| 3 | data.length & 0xff，13 words 為 0d |
| 4 | 00 |
| 5..6 | commandId & 0xfff，小端序；190=be 00、220=dc 00、90=5a 00 |
| 7..10 | CTRL 常數 0xB32D2300，小端序 00 23 2d b3 |
| 11 onward | signed 32-bit words，小端序 |

所有封包固定 61 bytes。RAM fixture 首 11 bytes：01 01 00 0d 00 be 00 00 23 2d b3。
13 words 在目前佈局需要 11+13*4=63 bytes；最後 word 的 offset 61、62 超出容量。
截斷測試以末 word 0x12345678 證明只留下 offset 59、60 的 78 56，丟失 34 12。
真實呼叫目前尾端為零；測試用非零 sentinel 是用來顯示容量限制，不是新的硬體命令。
Q22 保留乘 4194304、Math.round、b0/b1/b2/-a1/-a2 次序及正負符號。

Fake transport 實際記錄 sendReport(1, packet)：61 bytes、同一 Uint8Array 物件，
沒有移除首位 1。output failure 後 sendFeatureReport(1, packet) 使用相同物件；
兩者失敗時傳遞 feature-report error。未實際呼叫 HIDDevice。

### VERIFIED — descriptor assumption provenance
基準 src/dsp.ts:35-36 與 50-58 註解聲稱 navigator.hid 曾確認
outputReports[0].reportId=1、reportCount=61 bytes；歷史提交 c7c95fa 也以此為改成 61 的理由。
這是儲存庫既有描述，不是本輪讀取 descriptor 的證據。
沒有原始 descriptor、reportSize、report items 或對應 raw log，不能由此獨立重建實際 report 佈局。

### HYPOTHESIS — framing, not fixed
WebHID sendReport 與 sendFeatureReport 分開接受 reportId/data，data 不應再包含 Report ID。
來源：https://wicg.github.io/webhid/#dom-hiddevice-sendreport 。
目前 offset 0 的 1 若真是 Report ID，就可能重複 ID 並使 vendor payload 位移；
它是否其實是廠商自訂欄位尚未證明，故沒有 slice、縮放長度或調整 command payload。
沒有資料支持直接改成 60、62 或 63 bytes；目前 61 的描述與 63 的程式容量需求不能互相取代。

### Scope / regression check
- FreeDSP-specific files changed: src/freedsp/conexantPacket.ts、conexantTransport.ts、tests/freedsp/。
- Shared files changed: src/dsp.ts（僅 FreeDSP 連接）、package.json、package-lock.json、
  scripts/verify.ps1、vitest.config.ts、tsconfig.tests.json、四份 docs。
- Non-FreeDSP protocol code changed: NO。
來源比對確認抽取區域外程式不變；packet builder 本體與基準相同。
未驗證：硬體行為、真實 RAM EQ、Flash persistence、readback、preamp 或取樣率實際套用。
伺服器本輪未啟動；HTTP 檢查 localhost 無法連線。

## M2A evidence and byte maps — 2026-10-07
基準 6665470，分支 fix/freedsp-conexant，來源修改前工作目錄乾淨。
基準 build 與 16 個測試通過；沙箱暫存 rename EPERM 需一般檔案權限，非測試邏輯故障。

### VERIFIED source bytes vs HYPOTHESIS meanings
下表 offsets 與 bytes 均是 VERIFIED software behavior。
packet[0] 真正的硬體意義、CTRL 常數是否正確及 command/word 在裝置端的解讀仍屬 HYPOTHESIS。
範例 RAM 使用 rateIndex=5、band=1、第三 word=3；coefficients 用基準 Q22，尾 words 為零。

| Current offset | Candidate offset | Field | Size / current retained | Example | Evidence |
| --- | --- | --- | --- | --- | --- |
| 0 | absent | presumed embedded report ID | 1 / 1 | 01 | bytes VERIFIED; meaning HYPOTHESIS |
| 1..2 | 0..1 | transaction ID | 2 / 2 | 01 00 | VERIFIED source |
| 3..4 | 2..3 | count low byte + zero | 2 / 2 | 0d 00 | VERIFIED source |
| 5..6 | 4..5 | commandId & 0xfff | 2 / 2 | be 00 (190) | VERIFIED source |
| 7..10 | 6..9 | CTRL constant | 4 / 4 | 00 23 2d b3 | VERIFIED source |
| 11..14 | 10..13 | word 0: sample-rate index | 4 / 4 | 05 00 00 00 | VERIFIED source |
| 15..18 | 14..17 | word 1: band index | 4 / 4 | 01 00 00 00 | VERIFIED source |
| 19..22 | 18..21 | word 2: current constant | 4 / 4 | 03 00 00 00 | VERIFIED source |
| 23..26 | 22..25 | word 3: b0 Q22 | 4 / 4 | signed LE32 | VERIFIED source |
| 27..30 | 26..29 | word 4: b1 Q22 | 4 / 4 | signed LE32 | VERIFIED source |
| 31..34 | 30..33 | word 5: b2 Q22 | 4 / 4 | signed LE32 | VERIFIED source |
| 35..38 | 34..37 | word 6: -a1 Q22 | 4 / 4 | signed LE32 | VERIFIED source |
| 39..42 | 38..41 | word 7: -a2 Q22 | 4 / 4 | signed LE32 | VERIFIED source |
| 43..46 | 42..45 | word 8 | 4 / 4 | 00 00 00 00 | VERIFIED source |
| 47..50 | 46..49 | word 9 | 4 / 4 | 00 00 00 00 | VERIFIED source |
| 51..54 | 50..53 | word 10 | 4 / 4 | 00 00 00 00 | VERIFIED source |
| 55..58 | 54..57 | word 11 | 4 / 4 | 00 00 00 00 | VERIFIED source |
| 59..62 | 58..61 | word 12 | 4 / only 2 current | sentinel 78 56 34 12 | VERIFIED fixture |
| 61..62 | n/a | out-of-range current writes | 2 / 0 | sentinel 34 12 lost | VERIFIED test |

Current 需要 1+2+4+4+13*4=63，但配置 61；packet[61]、[62] 不會保存。
Candidate 只移除 presumed ID，長度由 2+4+4+13*4=62 推得，完整保留末 word。
這不是把舊 Uint8Array slice(1) 得到的 60 bytes；那樣無法復原既有截斷。
兩者第一 byte 都可能是 01，但候選的 01 是 transaction ID low；不能只看首 byte 判斷是否重複 ID。

Current 首 10 bytes：01 01 00 0d 00 be 00 00 23 2d；完整 module 最後 b3 在 offset 10。
Candidate 首 10 bytes：01 00 0d 00 be 00 00 23 2d b3。
WebHID 兩者皆另外傳 reportId=1；data 分別 61/62 bytes。
規範：https://hid.spec.whatwg.org/#dom-hiddevice-sendreport 。

### Descriptor / framing limitations
診斷顯示 WebHID parsed collections、input/output/feature reports、每個 item 的 size/count。
bytes = sum(reportSize * reportCount) / 8，含常數 padding；缺少欄位或非 byte alignment 不猜 byte 數。
只能檢查 browser 暴露的資料，沒有 raw descriptor bytes，也不是 DSP state readback。
同 reportId 的多筆項目若不明確，先停止，不自行合併推論。
inspect 階段不 open、不 sendReport/sendFeatureReport/receiveFeatureReport。

### Manual gate and exact sequence
1. PowerShell cd D:\Henry\Documents\ChatGPT\AuraPEQ，執行 .\scripts\dev.ps1（若伺服器已在執行，不要重複啟動）。
2. FreeDSP 拔除時開 http://localhost:5173/，點「FreeDSP M2A 診斷（手動選取／RAM）」；
   同頁導航到 freedsp-debug.html。先關閉其他 AuraPEQ 頁籤，避免其自動連線。
3. 停用 Equalizer APO、Windows 音量極低，第一次套用時不要佩戴 IEM。
4. 插入 FreeDSP，點「1. 手動選取 FreeDSP（僅檢查）」並手動授權。
5. 複製 descriptor 輸出，先看 output reportId=1 的 bytes。
6. 只有唯一且完整的 output report=62 bytes 才選 CANDIDATE_NO_EMBEDDED_REPORT_ID；
   若為 61、unknown、重複不明或其他長度，候選被阻擋，本輪先回報 metadata，不做候選 RAM 測試。
7. 取樣率選單與 Windows 播放格式一致；勾選測試條件。
8. 保持同一 framing / 取樣率，先點「套用 Flat（僅 RAM）」，完成且無錯誤後，
   點「套用單段 −12 dB（僅 RAM）」；先檢查日誌，不把 SUCCESS 當作聽感證明。
9. 音量仍極低，確認沒有異常後由 Henry 比較同一播放來源的 Flat / attenuation，
   最多再手動回 Flat 作確認；不寫 Flash、不試正增益、不掃描其他 sample rates。
10. 回報 audible difference YES/NO、metadata、完整 TX 日誌與 browser/device error；任何錯誤立即停止。

實際 report 若為 61 bytes，CURRENT 可保留作原始行為對照，但本輪不要求為了對照另做硬體寫入。
仍未證明：候選格式正確、RAM 聽感、取樣率映射、mode 0 生效、Flash、preamp 或 readback。

### M2A automated verification / delivery state
verify.ps1 最終 exit 0：TypeScript、Vite 4.5.14 build、測試型別檢查、5 files / 38 tests 通過。
其中原始 M1 16 tests 未修改，新增 22 tests 覆蓋候選、metadata、RAM gate 與 fake transport。
PK / 1000 Hz / -12 dB / Q 0.7 / 48 kHz 的 Q22 固定 fixture：
[3701688, -7012371, 3371192, 7012371, -2878576]，由基準 dsp.ts PK 計算取得。
本輪以純 HTTP GET 確認 root、診斷 HTML 與 debugPage.ts 轉譯回傳 200。
沒有執行 browser GUI、瀏覽器 JavaScript 或任何實體硬體操作；UI 實際點擊／顯示尚待 Henry 驗證。
開發伺服器交付時正在 127.0.0.1:5173 執行，網址 http://localhost:5173/。
此狀態是本輪快照，不表示之後仍在執行。
未 commit、push 或建立 PR；M2A 為 PREPARED，不是硬體成功。

### M2A Scope / regression check
- FreeDSP-specific files changed: src/freedsp/conexantCandidate.ts、descriptor.ts、ramProbe.ts、debugPage.ts；
  tests/freedsp/conexantCandidate.test.ts、descriptor.test.ts、ramProbe.test.ts；freedsp-debug.html。
- Shared files changed: src/main.ts（僅 DEV 診斷連結）、四份 docs。
- Non-FreeDSP protocol code changed: NO。
src/dsp.ts、M1 builder/transport、package/lockfile 與 scripts/verify.ps1 均與基準相同。

## M2B investigation — 2026-10-07
開始時 HEAD=652099eed2ba87e1d43c60713985e001e349878a（M2A 已提交），
branch=fix/freedsp-conexant，工作目錄乾淨，origin tracking ahead/behind=0/0（本機 refs）。
origin=https://github.com/henryshuen/Audiocular-Aura.git；upstream=https://github.com/mandy321/Audiocular-Aura.git。
基準 verify.ps1 exit 0：應用程式 build、測試型別檢查、5 files / 38 tests。
下列是本輪現況；前面 M2A PREPARED／未取得 descriptor 的記錄保留為歷史。

### M2A real descriptor result
來源：Henry 本輪提供的實體裝置檢查摘要；不是 Codex 本輪存取裝置，也不是 raw USB capture。
- vendorId=13784=0x35D8；productId=5270=0x1496；productName=FreeDSP。
- Primary collection usagePage=12、usage=1。
- Input reportId=1、reportCount=61、reportSize=8：488 bits=61 data bytes。
- Output reportId=1、reportCount=61、reportSize=8：488 bits=61 data bytes。
- Secondary input reportId=2：1 byte；摘要未提供它的各 item dimensions，fixture 不自行補造。
- WebHID reportId 是 data 以外的參數，61 不是「ID 1 + payload 60」。
- 62-byte 候選未傳送，沒有執行 RAM 測試。Henry 的 feature reports 未提供，不能推定支援 fallback。

### Current contradiction
CURRENT：ID-like byte 0；transaction 1..2；count/zero 3..4；command 5..6；CTRL 7..10；
13 LE32 words 從 11 開始，需要 11+52=63 bytes，配置只有 61。
末 word 邊界 59..62，實際丟失 61..62；非零 sentinel 0x12345678 只留下 78 56。
M2A 去除 presumed embedded ID 後，需要 10+52=62，仍超過真實容量 61。
不改成 63、不送 62、不截斷、不虛構 padding。只移除 Report ID 無法解決全部差距。

### Evidence sources and confidence
| Source | Verified observation | Confidence / limit |
| --- | --- | --- |
| Henry 的 M2A 摘要及 tests/freedsp/fixtures/henryM2ADescriptor.ts | primary size/count、VID/PID、61 data bytes | 高：使用者實機回報；fixture 是摘要轉錄，非 raw descriptor |
| [WebHID specification](https://hid.spec.whatwg.org/#dom-hiddevice-sendreport) | reportId/data 分開；reportSize 是 bits，reportCount 是項目數 | 高：API 規範；不定義 vendor packet layout |
| [dc76a3b](https://github.com/mandy321/Audiocular-Aura/commit/dc76a3b642d2685bd0791e0bd1e1a4360fa4ddaa) | 早期 reportId/count61 記錄，當時仍是 Moondrop 路徑 | 高：提交內容；不是 Conexant native 格式 |
| [e7da5b5](https://github.com/mandy321/Audiocular-Aura/commit/e7da5b51199538e20a6442190e501ec26b29e2a2) | 首次 Conexant builder 就是 11-byte header、13 words，卻配置 62 | 高：原始碼；此版已不足 63，未附 native struct/capture |
| [c7c95fa](https://github.com/mandy321/Audiocular-Aura/commit/c7c95fa9c356b4e462cf52439fdae52931e18699) | 只將 allocation 62 改成 61，沒有調整欄位 | 高：diff；不能證明正確 layout |
| [Issue #3 descriptor](https://github.com/mandy321/Audiocular-Aura/issues/3#issuecomment-4856465603) | 另一位回報者提供相同 primary size/count/id | 中高：公開 parsed JSON；不是 Henry 本輪原始資料 |
| [Issue #3 APK claim](https://github.com/mandy321/Audiocular-Aura/issues/3#issuecomment-4857382348) | 作者聲稱分析 APK/JNI、CTRL、Q22、190/220 | 低：未提供 native serialization 或完整已知正常封包，不能驗證欄位寬度 |
| [Issue #3 length explanation](https://github.com/mandy321/Audiocular-Aura/issues/3#issuecomment-4867348708) | 作者把 61 解釋為 ID 1 + data 60 | 其 WebHID 解釋與 descriptor/規範不符；所述 OS 原因未獨立證實 |
| [Original Android logcat](https://github.com/user-attachments/files/29552424/log.txt), linked in [Issue #3](https://github.com/mandy321/Audiocular-Aura/issues/3#issuecomment-4855191555) | FreemanCnxtUsbDevice 列印 rate/band/coefficients 與 save result | 中：應用程式日誌；不是原始 USB 封包，未提供 header bytes/struct；CafCmdHelper 僅出現在 logcat 篩選命令 |
| [Author's ASR reference](https://www.audiosciencereview.com/forum/index.php?threads/any-software-or-electrical-engineers-on-the-forum-familiar-with-the-usb-spec.51608/#post-2038285) | 本輪工具取得論壇首頁，未取得指定 post | 無可用 layout 證據；未把論壇推測當成事實 |

本機 git log --all、-S Conexant、-S 61、相關 blame/diff、README 與 tracked file 清單已檢查。
未找到 native/JNI source、CAF struct 或已知正常 USB packet fixture；README 的即時 RAM/Flash 宣稱不等於硬體證據。
Issue 的 Aura TX hex 是這份 builder 產生的資料，不能當成官方程式的正常封包。

### A–K reconstruction questions
| Question | Verified source behavior | Hardware conclusion / evidence needed |
| --- | --- | --- |
| A: packet[0] 是否 vendor data？ | byte=1，註解稱 Report ID；WebHID ID 是外部參數 | 未定；native serialization 或完整 capture 才能辨識是否 vendor prefix |
| B: transaction 是否 2 bytes？ | source 固定 01 00 | 未定；未觀察可變 transaction 或 native type |
| C: count 是否 2 bytes？ | source mask 0xff，只賦值低 8 bits，下一 byte=0 | 可能是 U8+reserved，也可能 U16/bitfield；不能直接刪零 |
| D: command 是否 2 bytes？ | source mask 0xfff、左移 16，佔兩 bytes | 12-bit 值是 source 行為，非硬體型別；190/220/90 都小於 256，不能證明 U8 |
| E: CTRL 是否 4 bytes且此位置？ | source 0xB32D2300、LE32 在 7..10 | native CafId 實作與 field offset 未取得 |
| F: 是否 13 payload words？ | runtime 配 13，RAM 8 個非 padding 欄位加 5 個零尾 words | 13 是 app 陣列長度，未證明 native 定長/count 語意 |
| G: 是否全為 32-bit？ | builder 每個 item 寫 4 bytes | native metadata packing 未取得，Q22 也不證明 metadata 全為 int32 |
| H: 是否 implicit/header-packed？ | app 明確序列化每個 item | 未定；無資料支持省略特定 word |
| I: first word 是否 duplicated？ | RAM first=rate index；mode first=90，與 command90 相同 | mode 的數值重複不能推廣到 RAM190；需 native command schema |
| J: native190 是否 12 words？ | 只有 JS 的 13 words 可核對 | 未取得 native 定義；改為 12 也只是 10+48=58 或 11+48=59，不會自行變成61 |
| K: JNI 是否 append fields？ | 作者聲稱 JNI 架構；沒有 native source | 未定；需 Java/native 邊界及底層 serialize code，不能把推測列為完成 |

### 61-byte reconstruction candidates — OFFLINE, UNVERIFIED
若保留 13 個 LE32 words=52 bytes，header 必須為 9 bytes。以下只建立可檢驗的兩種假說，
不聲稱為完整候選空間；vendor prefix、packed metadata 或不同 native word count 仍可能成立。

| Candidate | Header offsets (zero-based) | Header / payload / fields / total | Changes vs CURRENT | Evidence / confidence / uncertainty |
| --- | --- | --- | --- | --- |
| COUNT_U8 | txn U16 0..1; count U8 2; command U16 3..4; CTRL U32 5..8; words 9..60 | 9 / 52 / 13 / 61 | 移除 presumed ID、count 區 2→1 | source count mask 0xff，原高 byte 固定0；調查優先1，硬體信心低，該 byte 可能必須保留為 reserved |
| TRANSACTION_U8 | txn U8 0; count/command U32 1..4; CTRL U32 5..8; words 9..60 | 9 / 52 / 13 / 61 | 移除 presumed ID、transaction 2→1 | source txn 固定1，沒有高 byte 動態證據；調查優先2，硬體信心更低，native type 未知 |

兩者保留 source command 的12-bit上限、完整 module 常數與13個signed words，reportId=1另存於 envelope。
不加任意 padding；超過欄位寬度、非整數或 words 不等於13即拒絕，不能 silent truncation。
src/freedsp/conexantReconstruction.ts 只由測試匯入；正常 app、診斷頁與 RAM probe 均未連接它。
尺寸匹配只證明算術與序列化，不證明 descriptor 允許的內容可被 DSP 正確解讀。

### Problem / hypothesis / next action
Observed problem:
- CURRENT 63-byte semantic layout 被61-byte buffer截斷；去除 presumed ID 仍為62；實機容量61。
Verified facts:
- Henry descriptor output reportId1/count61/size8=488bits=61 data bytes；62-byte候選未送，沒有RAM測試。
- 原始 Conexant 提交就存在容量不足；後續只改buffer長度，沒有native格式證據。
- 原始 Android logcat 無完整 on-wire header；兩個離線假說可以完整保留13words而恰為61。
Possible causes (ranked HYPOTHESES):
1. Header 重建有誤：presumed embedded ID加上count/reserved區的寬度解讀錯誤。
2. Transaction 欄位寬度／是否為wire欄位有誤；固定01 00不足以判定。
3. Native payload長度、metadata packing/implicit欄位，或JNI邊界加入額外欄位造成JS重建過長。
Ruled out / weakened:
- 改buffer63或送62都超過descriptor；Report ID alone無法消除全部差距。
- 12 words alone不能解出61；刪零或invent padding沒有證據。
- Sync Complete、README、作者implementation宣稱與應用層success不能證明DSP套用或native layout。
Next validation:
- 優先取得官方 app 的 CafCmdHelper/native serializer：transaction type、count/command bitfields、
  CafId/CTRL、command190 native參數陣列及HID reportId prefix加入位置；索取作者當時使用的精確APK版本／函式片段。
- 若原始碼不足，另輪經Henry指示才從官方app已知正常操作取得完整USB擷取，包含descriptor、
  endpoint/control setup、reportId與實際data長度，及對應rate/band/五係數；至少比較兩個band/rate辨認欄位。
- 本輪不開始擷取、不要求現在RAM操作、不送候選；先比對native結構或既有capture。
Possible fix direction:
- 僅在 native/USB 證據確認後修改 src/freedsp/ 的明確欄位寬度或packing，加入已知正常bytes fixture；
  保持external reportId及descriptor gate。若native words非13，依schema修正呼叫者，不能單純縮buffer。

## Evidence for upstream / Issue #3
- M2J hardware update (Henry-reported M2I): Windows SET346 and GET_INPUT_REPORT both SUCCESS/error0;
  selected MI_03 col01, usage0C/1, input/output62, feature0, two matching HID paths.
  RX knownprefix01 00 01 00 bc 80 00 23 2d b3 01 00 00 00 = valid CAF188/reply1/count1/CTRL/word0=1.
  Level1 native HID transport VERIFIED; Level2 CAF346 NOT YET VERIFIED. Full remaining bytes/path not supplied; no FIFO/cache-origin proof.
- Exact official polling stops on ANY replybit1, not matchingcommand; first188 would stop source helper too.
  M2J retains oneSET, initialGET then1000ms outerbudget and5ms afterrepeatGET, explicitly adds matching346/error-stop guards.
  No reSET/mutation. M2J hardware result PENDING; all changes diagnostic, production still unchanged.
- M2I implementation status: isolated Windows/.NET10 Query346; HID caps/MI03/usage gate, Input1/Output1 preparsed-data validation,
  HidD_SetOutputReport then HidD_GetInputReport, each once. No driver replacement, browser runtime or mutation changes.
  Serializer/parser/mock build evidence only; PENDING HENRY HARDWARE RESULT. Windows USB completion/setup not captured.
  M2G rawTotal=0 retained; M2H protected-interface and missing WebHID Input GET limitation retained; no unchanged browser retries.
- M2H update (Henry-reported M2G query): raw listener ACTIVE before open/send; command346 reportId1/data61 host send resolved;
  2.5s timeout, rawTotal=0/newEvents=0, no inputreport of any ID/size. Parser received nothing; no DSP acceptance/rejection conclusion.
- Official current APK explicitly selects HID class3/subclass0/protocol0/interface3; request setup confirmed again from bytecode:
  SET 21/09/0201/index3; GET A1/01/0101/index3; both length=array.length (62 for346), per-call timeout1000ms.
- Normal Windows Chrome web origins cannot request Input GET_REPORT through WebHID. WebUSB blocks protected HID class even with WinUSB;
  WebHID-write/WebUSB-read cannot borrow the claim. IWA usb-unrestricted is a privileged exception outside normal AuraPEQ deployment.
- Best supported direction: native Windows HID Input GET_REPORT through existing HID driver, one owner for SET→GET; device behavior remains untested.
  Host sent is not Sync Complete. No new browser trial requested; next evidence would be native346 completion/raw matched response in a separately authorized round.
- M2G hardware update (Henry reported): M2F Apply兩次、Restore一次，均在188 host send成功後timeout；descriptor gate通過。
  無matching input event記錄；187/346/190皆未送，不能推論188 accepted/rejected或EQ failure。
- M2G source update: SET_REPORT output1後同步GET_REPORT input1 (A1/01/0101/interface3/length62)，不是input endpoint listener。
  187的SET/GET request length14；188/190 helper均wait reply，187丟bool、188只存flag；失敗未必阻擋上層。
  新頁只query346並持續記錄全部input events，M2H已收到raw零事件結果；舊July logger/hook仍缺，RX不是已證interrupt ACK。
- Hardware: Henry 的 Moondrop FreeDSP / CONEXANT Freeman，VID35D8/PID1496。
- Descriptor: usagePage12/usage1，input/output reportId1，count61×size8=488bits=61 data bytes；secondaryinputid2=1byte。
- WebHID reportId外傳，61不可解釋為「ID+60」。
- Current: 11+13×4=63塞進61，末word丟失bytes61..62；移除embeddedID仍62。
- Tested: 純軟體descriptor fixture、截斷sentinel、兩種9+52=61離線假說及原有軟體回歸。
- NOT tested: 62-byte候選未送，沒有RAM/Flash/聽感/preamp/readback或新candidate硬體操作。
- Defect: JS前置額外ID並把完整U16 prefix保留，造成欄位偏移與截尾；不能只改allocation或刪count後00。
- M2C correction: Issue #3另有[官方app helper dump](https://github.com/user-attachments/files/29558901/freedsp_usb_raw_log.txt)，
  在[4857176508](https://github.com/mandy321/Audiocular-Aura/issues/3#issuecomment-4857176508)發布；M2B漏讀此附件。
  已保存114筆62-byte TX/RX arrays：90×1、220×55、259×1，各有RX，沒有190。
- Authoritative source recovered in M2D: [official APK](https://download.moondroplab.com/moondroplink/android-release.apk), version2.25.0c-260813ai,
  SHA25604756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5，res/qc.xml映射35D8/1496到Freeman3。
- CnxtUsbCommand.getUSBMessage: 10+4N bytes，U16 prefix=1，packed=(N&255)|(cmd<<16)|(reply<<31)，CTRL LE32，long[]低32bits LE。
  CafCmdHelper直接SET_REPORT(0x21,9,0x0201,index3)，UsbHelper傳整個buffer及buffer.length；非JNI後續serializer。
- Best model HIGH: helper62包含首位HID ID1，WebHID外部ID1/data61=helper[1..61]；data0=00、packed1..4、module5..8、words9..60。
  [HID1.11 §6.2.2.7](https://www.usb.org/sites/default/files/hid1_11.pdf)與[Android controlTransfer](https://developer.android.com/reference/android/hardware/usb/UsbDeviceConnection)支持此API邊界。
- All114 buffers exact replay；Flash commit在DEX是long常數255（FF000000），不是-1；190來自setFreeman3EQ，word1=band+5。
  同一serializer不代表同一payload：220分metadata/coefficients/commit，259讀firmware，187只有1word，188有13words。
- M2E native evidence: registered JNI callback0x27F4→CxAudioConvertEqParams2Coeffs0x2ABC→EqDesignFx0x3510。
  Gain=e+2、scale=2^(25-Gain)，A0/A1是負的normalized a1/a2；PK Q轉BW，float32後32個近鄰量化。
  45個Gain與225個官方words全部吻合模型的候選區間；尚非bit-exact final-neighbor converter。
- M2E RAM:190 `[0,band+5,Gain,B0,B1,B2,A0,A1,0×5]`，SDK band0..4→5..9，current-rate346查詢，單次write；
  Aura使用rate4..8、band1..9、五rate迴圈，且缺188/187。九段RAM mapping尚未證實，不能一律+5。
- Strongest zero-effect explanation: 現有data按官方布局解析為command13/count1/module0x230000BE，非190/CTRL。
  Host Sync Complete沒有vendor ACK/DSP效果證據。其次為word0錯selector及漏enable；沒有實機因果隔離。
-90payload `[90,0,...]`值有來源，但Java190鏈無post-write90，Aura每次追加90的必要性／覆蓋效果未證實。
- Remaining limits: 未取得July APK精確版本/hook、actual completion capture、nine-band live mapping；Dart UI排程與短187/ID4/5 WebHID適配未證實。
- ONE optional future capture: 官方app切EQ mode一次，只抓command90的SET_REPORT提交/完成與完整payload62；
  確認wValue0x0201/interface3、首01、61data邊界及實際長度。此輪不要求Henry執行，不送Aura候選。
- 本輪沒有發表GitHub留言。

### M2F controlled diagnostic evidence / hardware pending
- 新diagnostic codec與114個既有官方helper buffers逐byte相同；外部ID1/data61、packed1、CTRL5、words9。
- Exact sequence:188[1,0×12]→187[0]→346[62,0×12]→190[0,5,Gain,B0,B1,B2,A0,A1,0×5]。
  每步matching command/reply1/CTRL/count有效後才繼續；346要求word1 index4..8；只算一次current-rate。
-187是logical helper14，診斷保留count1並補零到固定61data；此WebHID傳輸適配是明確M2F實驗，尚未證實hardware等價性。
- Native-compatible float/BW/parameter trunc/Gain/scale/sign；最後32-neighbor optimizer尚未移植，以nearest rounding作診斷近似。
- 首次sequence不含90，也不含descriptor未知的legacyID4/5。control-transfer GET_REPORT與WebHID input event是否同樣提供reply未證實。
- Hardware result PENDING：沒有新packet由Codex送到硬體；ACK與聽感必須Henry實測。
- Upstream evidence只保存於repo，未發布Issue comment。

### M2B Scope / regression check
- FreeDSP-specific files changed: src/freedsp/conexantReconstruction.ts、tests/freedsp/conexantReconstruction.test.ts、tests/freedsp/fixtures/henryM2ADescriptor.ts。
- Shared files changed: docs/GENERAL.md、ROADMAP.md、DECISIONS.md、DONE.md；共享runtime無修改。
- Non-FreeDSP protocol code changed: NO。

## M2G — CAF response transport diagnosis
### Research checkpoint — source response origin / M2F hardware record
- Examined: pinned APK完整CafCmdHelper.sendCmd/getMsgByCmd、UsbHelper、188/187/346/190 callers；WebHID規範與Chromium Windows backend。
- Verified facts: Henry回報三次188 timeout、host send成功；無190，聽感無差異不構成EQ失敗證據。
  官方SET_REPORT後同步GET_REPORT輪詢，bmRequestTypeA1/request1/value0101/interface3；不是interrupt listener。
  fresh RX array獨立於TX，Android controlTransfer將IN資料寫入RX；receiveHIDReport傳回同array，caller直接讀已修改array。
  188確實wait reply，結果設enable flag；187 wait但丟掉bool；188false不阻擋官方後續187/190。346讀GET_REPORT word1。
- Hypotheses: control GET_REPORT-only回應未出現在WebHID inputreport是最強transport候選；Windows output途徑差異亦可能。
- Discarded hypotheses: 官方188完全fire-and-forget；M2F是在send後才註冊listener；未送190也能判斷EQ效果。
- Unresolved fields: 實機是否有任何interrupt events、query346實際count/words、July UsbHelperDump hook實作與complete transfer長度。
- Next search target: 持續raw listener、寬容candidate parser及只送346的manual diagnostic；本輪不進190。

### M2B automated verification / delivery
verify.ps1 exit 0：TypeScript、Vite 4.5.14 production build、測試型別檢查，6 files / 47 tests。
原有38tests均通過，新增9tests驗證descriptor容量、原始截斷、62-byte gate、兩種61-byte完整序列化、
external reportId及拒絕超出field width／缺少或過多words；沒有呼叫實體WebHID。
git diff --check 通過；本輪產生的dist建置差異還原，原runtime/package/scripts均未修改。
未commit/push、未發Issue留言；停止於M2B，M2 RAM proof仍NOT PROVEN。
交付前確認既有AuraPEQ Vite程序PID8048監聽127.0.0.1:5173，localhost純HTTP GET=200；
本輪沒有啟動新server、開瀏覽器或執行browser JavaScript。這是當下狀態快照。
固定網址 http://localhost:5173/；啟動命令 .\scripts\dev.ps1（已在執行時不要重複啟動）。

## M2C-Research — serializer provenance / protocol evidence — 2026-10-07
基準HEAD=2dfe0db1735da511275cd7c3e188b64bdc8b6368，branch=fix/freedsp-conexant；起始工作目錄乾淨。
git status、branch、log -5已核對；基準verify.ps1 exit0，6files/47tests。未改runtime或新增候選。

### Source trail and correction to M2B
已執行git log --all -- src/dsp.ts及-S buildConexantPacket/CafId/CTRL/command 190/Q22，
核對原始builder blame、前後提交、README與本機fixtures。完整builder各欄位第一次都在e7da5b5出現，
沒有更早的本機native struct或source citation。原始碼是JS重建；是否直接複製native signature無法確定。

| Commit | Direct source observation | Provenance limit |
| --- | --- | --- |
| 62054e4 / 7f692ab | 初期Moondrop容量與feature fallback嘗試 | 非Conexant serializer來源 |
| 4a77f8e | CT7601各取樣率UPDATE_EQ | 使用了後來被修正的裝置假設 |
| dc76a3b | FreeDSP reportId1/count61，但仍走Moondrop | descriptor證據不提供vendor結構 |
| e7da5b5, 2026-07-01T15:57:55Z | 增加txn2、packed field4、CTRL4、13words、Q22、190/220/90；allocation62 | 註解稱CafId，沒有實作或APK/native來源位置 |
| 152c012 / eb0a338 | README與發布分支重述上述協定 | 同源宣稱，不是獨立驗證 |
| 60d32e8 | 改用output失敗後feature fallback | 未補serializer證據，不能證明OS政策是原因 |
| c7c95fa, 2026-07-02T15:17:32Z | allocation62→61，唯一協定修改為此一行 | 仍11+52=63，沒有修正結構 |

M2B漏讀Issue #3第二個Android附件freedsp_usb_raw_log.txt，也未取得ASR指定文章；
以下新證據取代「所有已知Android附件都沒有bytes」的過度概括，但不推翻61-byte descriptor或63/62容量算術。

### Issue #3 chronological audit
來源：[Issue #3](https://github.com/mandy321/Audiocular-Aura/issues/3)及全部31則comments，時間為UTC。
分類標籤表示證據來源，不表示作者的因果推論已成立。

| Time / comment | Relevant evidence | Classification |
| --- | --- | --- |
| 2026-06-29, issue body | FreeDSP被判為MOONDROP，0x4B傳輸失敗 | TESTER LOG |
| 06-30, 4840743255 / 4840949211 | 以endpoint wMaxPacketSize64推論report需64，保留0x4B | AUTHOR INTERPRETATION；endpoint最大值不能取代report descriptor |
| 06-30, 4841065735 / 4845498373 | tester仍失敗；作者稱64 worked、轉查ID且表示沒有硬體 | TESTER LOG / AUTHOR INTERPRETATION，成功結論與tester結果不一致 |
| 07-01 13:03, [4855191555](https://github.com/mandy321/Audiocular-Aura/issues/3#issuecomment-4855191555) | 官方Moondrop app logcat：Eq2Coeff/Freeman/Flash操作 | TESTER LOG；不是USB capture |
| 07-01 14:28, 4856265847 | 作者仍稱CT7601，改各rate UPDATE_EQ，認為384k係數失敗 | AUTHOR INTERPRETATION；不是Conexant190/220原始定義 |
| 07-01 14:31–14:54, 4856317118 / [4856465603](https://github.com/mandy321/Audiocular-Aura/issues/3#issuecomment-4856465603) / 4856588938 | 索取parsed descriptor，tester回報outputid1/size8/count61；作者改ID/容量 | VERIFIED BY DEVICE（tester回報） / VERIFIED BY SOURCE CODE；OS因果說明仍為interpretation |
| 07-01 15:01, 4856662416 | MOONDROP TX可執行但tester沒有聽感差異 | TESTER LOG；不是正確EQ效果證據 |
| 07-01 15:09–15:19, 4856738224 / 4856849006 | 作者要求官方USB capture，附ASR連結 | AUTHOR INTERPRETATION／研究線索 |
| 07-01 15:45, [4857176508](https://github.com/mandy321/Audiocular-Aura/issues/3#issuecomment-4857176508) | 提供freedsp_usb_raw_log.txt，UsbHelperDump有TX/RX陣列 | TESTER LOG；hook層級/版本/USB setup不明 |
| 07-01 16:01, [4857382348](https://github.com/mandy321/Audiocular-Aura/issues/3#issuecomment-4857382348) | Conexant/Freeman、JNI、Caf/CTRL、Q22、190/220宣稱 | AUTHOR INTERPRETATION；native簽名與CafId實作UNSUPPORTED / UNCLEAR；dump可核對CTRL bytes與220/90，不能核對190 |
| 07-02, 4861632425 / 4862948457 / 4865770254 | Aura自己的Conexant TX失敗；feature fallback仍失敗 | TESTER LOG；不是官方app的正常封包 |
| 07-02 15:18, [4867348708](https://github.com/mandy321/Audiocular-Aura/issues/3#issuecomment-4867348708) | 把61解讀為ID1+payload60，buffer-only patch | AUTHOR INTERPRETATION（與WebHID定義不符） / VERIFIED BY SOURCE CODE |
| 10-06 11:57, [6015725221](https://github.com/mandy321/Audiocular-Aura/issues/3#issuecomment-6015725221) | Henry：Windows11/APO停用，同來源音量，Slot A/B Sync Complete但無聽感差異 | VERIFIED BY DEVICE（Henry結果） / TESTER LOG；不能只歸因preamp，程式本來無該傳輸 |

### Closest original evidence: official-app UsbHelperDump
來源：[公開附件](https://github.com/user-attachments/files/29558901/freedsp_usb_raw_log.txt)，
已原樣保存tests/freedsp/fixtures/officialAppUsbHelperDump.txt（60,438bytes）。
SHA256=f726e1a440d82ad495cf5d9ffeaa0db17f9bbfdc27f9334a8895517f4df6c4cf。
測試只容許Git checkout的CRLF→LF正規化；保留signed byte字面值，-77轉成0xB3，不重新生成附件。

- 57TX、57RX，每個dump都是62entries：TX90×1、220×55、259×1，沒有190。
- Dump offsets：0..1=01 00；2..3=0d 00；4..5=command LE16；6..9=00 23 2d b3；10..61可讀成13LE32。
  這是observed byte grouping，不是已確認native struct。
- 220包括9組metadata、45組5rates×9bands係數及1組commit。90是mode，259是firmware query。
- RX90/220在2..3為00 00；RX259為04 00，payload為9/7/14/1（旁邊app log稱FW9.7.14.1）；
  dump仍62entries。因此logical count和buffer capacity可以不同，不能由固定容量推論有效序列化長度。
- 係數dump與同一log印出的B0/B1/B2/A0/A1 hex完全對應，例如band1/rate4在offset22起：
  0x003fa528、0xff813643、0x003f25c5、0x007ec9bc、0xffc13513。
- Flash commit首payload四bytes=FF 00 00 00，當作LE32是255；目前JS的-1是FF FF FF FF。
  Metadata某些gain word為-7等整數，並非目前gain*256；不能在本輪推定單位或修改Flash。
- 原始source說pEQCoeff.Gain always3，但dump band9的係數marker為2；硬編碼3不可推廣成協定事實。
- 114筆dump沒有hook source、APK版本/hash、native type、UsbRequest/bulkTransfer/controlTransfer參數、
  requested/actual length、endpoint/setup或USBPcap/usbmon記錄。
- M2A no-ID builder與57筆TX的bytes全部吻合；CURRENT是它前面再加1並截尾。
  此比對只定位JS重建與helper表示的差異，不能授權把62 bytes送入WebHID61data bytes。
- 最接近的原始來源是這個tester提供的官方app buffer dump。提交時序與值相符支持「依它重建」的推論，
  但作者未提供工作紀錄，無法證實直接複製來源或native signature。沒有找到權威serializer。

### Linked source audit / circular evidence
- ASR目標[post2038285](https://www.audiosciencereview.com/forum/index.php?posts/2038285/)是2024年MAY辨識故障，非FreeDSP serializer。
  2024年[Tommy-Geenexus post1859388](https://www.audiosciencereview.com/forum/index.php?posts/1859388/)建議jadx逆向Link2.0，
  其連結是Dawn控制source，不是FreeDSP。
- 2026年[ASR post2629829](https://www.audiosciencereview.com/forum/index.php?posts/2629829/)由Mandy007介紹AuraPEQ，
  宣稱61不含ID但結尾表示未測試，連回同一Aura repo，沒有native/capture附件；屬同源重述，非獨立佐證。
- Tommy-Geenexus/usb-dongle-control目前tree的相關路徑是Dawn/Moonriver控制，未找到Freeman/Caf/FreeDSP serializer。
- ASR另一連結[devicePEQ](https://github.com/jeromeof/devicePEQ)現在有Conexant handler，
  核對固定HEAD0617f382e76629792a5933e6933e4b396a756a93；a1dfcdcf在2026-07-21新增。
  其[module](https://github.com/jeromeof/devicePEQ/blob/0617f382e76629792a5933e6933e4b396a756a93/devicePEQ/conexantUsbHidHandler.js)
  使用11byte header、0xB307B0、2^30、不同logical array counts，不附native來源。
  [FreeDSP capture JSON](https://github.com/jeromeof/devicePEQ/blob/0617f382e76629792a5933e6933e4b396a756a93/tests/captures/moondrop_freedsp_conexant.json)
  有896、1073741824、-2147483648等值且部分array62entries，不可能是原樣byte dump。
  無官方app捕捉來源／hook證據，不能用其mock tests提升協定信心；未複製此fixture。
- [官方Link下載頁](https://moondroplab.com/en/moondrop-link)提供APK/AppStore/GooglePlay，
  本輪未取得作者2026-07-01使用的精確APK/native source；未下載/安裝APK、jadx或capture driver。

### Field evidence matrix
Confidence指硬體欄位定義的可信度，source/dump字面bytes另外明確標示，不混用。

| Field | Current implementation | Evidence for width/value | Confidence | Missing evidence |
| --- | --- | --- | --- | --- |
| transaction | 固定U16=1，在CURRENT1..2 | helper0..1=01 00；可能含ReportID或vendor欄位 | UNKNOWN | native type、prefix/reportId邊界與動態transaction |
| packed command/count | U32=(N&ff)\|((cmd&fff)<<16) | helper2..5對應0d 00 DC/5A 00，259=03 01；RXcount0/4且high byte有80 | MEDIUM（grouping）；UNKNOWN（ABI/bit widths） | count8/16、reserved、12-bitmask、response flags的定義 |
| module ID | U32=0xB32D2300；source稱CafId(CTRL) | helper6..9值完全一致，所有TX/RX皆同值 | MEDIUM（value）；UNKNOWN（hash/handle定義） | CafId實作、module名對照、USB實際位置 |
| payload word count | 90/190/220一律13，零尾5words | helper90/220/259可分13LE32；RXlogical count不同；190未見 | MEDIUM（observed buffer）；UNKNOWN（native requirement） | per-command native length及實際submitted/completed長度 |
| report data length | 61 | Henry實體descriptor61×8=488bits，ID不含於data | HIGH | 容量無缺項；helper62與transfer boundary關係待確認 |
| reportId | 外部1，CURRENT另塞首位1 | Henrydescriptor，WebHID規範 | HIGH | ID值無缺項；helper首位1是否該ID未知 |

### 13 words / p1 / transaction / module conclusions
- 13不是僅JS憑空容量：此official-app dump也有count13與52bytes，但只有90/220/259，不能替190背書。
  它是SDK定長struct、JNI容量、padding或有效wire payload仍UNKNOWN；不能刪零或假設12words。
- Packed field中count後的0實際存在於dump；COUNT_U8刪除此byte的假說被削弱。
  259需要超過8bits的command值，但仍不能證明12bits而非16bits。
- txn=1無法判斷U8/U16/U32/padding/implicit；62-byte dump的首01可能是report prefix，不能用常數判寬度。
  TRANSACTION_U8也沒有新增native支持；本輪不改M2B候選或runtime。
- module四bytes與source匹配，但沒有CafId計算／enum定義，不能證明32-bit hash或native handle。
- Q22是upstream來源與作者解釋；dump提供固定係數值，不單獨證明普遍scale、Gain marker或全部filter規則。

### Problem / hypothesis / next action
Observed problem:
- CURRENT額外前置1/截尾；descriptordata61與official-app helper62之間的邊界仍不明。
Verified facts:
- 官方app來源由tester回報；57組TX/RX、modulebytes、count/command位置可核對，沒有RAM190。
- 原始JS在e7da5b5一次加入所有欄位；c7c95fa只改allocation；沒有native serializer/source citation。
- ReportID1/data61已由Henrydescriptor支持；M2B尺寸假說仍未被硬體證實。
Possible causes (ranked hypotheses):
1. JS把helper/native buffer與WebHID reportID/data邊界混淆，額外前置byte造成偏移。
2. helper62包含ReportID或未實際送出的容量，未見transfer參數而誤重建transaction/count。
3. command190長度/內容從220泛化，或metadata/commit/marker等值被誤轉；現有dump不支持全部runtime語意。
Ruled out / weakened:
- 「沒有任何官方app byte資料」被第二附件推翻；但未找到權威native serializer或獨立USB transfer capture。
- COUNT_U8的刪零缺乏支持，dump有該byte；所有commands一律13也不能由此確定。
- 另一repo的capture名稱、ASR自述、Sync Complete都不能取代正常USB擷取或DSP結果。
Next validation — ONE action:
- 另輪由Henry手動擷取官方app一次單段EQ衰減的完整host USB transfers，確認reportID與實際長度／bytes邊界。
Possible fix direction:
- 只在邊界證據確認後，以原始bytes建立精確離線fixture，再另輪決定FreeDSP serializer修正；本輪不湊61或送候選。

### Future manual capture plan — prepared only, NOT requested now
目標只有一個官方app動作：一段既定PEQ由0改為-3dB（例如1000Hz/Q0.7），不掃描bands/rates或另加Flash操作。
記錄app版本/hash、裝置/descriptor、band/frequency/gain/Q、時間；capture包含動作前後短區段及裝置enumeration。
保持不播放音訊可減少等時資料量；不依賴可聽差異作此capture成功條件。

1. 先確認「官方app實際USB host」。本輪原始來源為Android。PC只透過ADB連手機時，
   Windows USBPcap看不到手機OTG bus上的FreeDSP；不能擷取Windows Aura再稱為官方app。
2. 只有官方app已能在Windows同一USB host控制FreeDSP時，才使用既有USBPcap+Wireshark，
   選FreeDSP所在root hub，capture後按裝置address及HID interrupt/control transfer篩選，保存pcapng。
   本輪未證實這個Windows app路徑，不建議為此安裝模擬器或改USB driver。
3. Android host若已具備可讀取的usbmon binary interface與相容libpcap/tcpdump，可在該host擷取；
   先列capture interfaces（tcpdump -D），選實際usbmon bus，再使用tcpdump -i usbmonN -s 0 -w <output.pcap>。
   這是條件式命令模板，不是所有Android都能執行；本輪不執行、不root/unlock、不裝工具。
   若現有環境不具備這些條件，停止準備，不改手機，需先另輪選定可行host capture環境。
4. 手動只改上述一段一次，立即停止capture，保存完整URB提交/完成記錄；不再次送Aura的candidate。
5. Wireshark依VID35D8/PID1496的enumeration確定bus/address/interface；查看endpoint或control setup，
   記錄reportID、requested/actual lengths、完整payload、重複封包次序與回應。禁止把truncated preview當完整bytes。
   Software capture取得URB/host transfer，不是逐個物理USB packet；仍足以核對此序列化邊界。
依據：[Wireshark USB capture](https://wiki.wireshark.org/CaptureSetup/USB)、[Linux usbmon](https://www.kernel.org/doc/html/latest/usb/usbmon.html)。
未請Henry現在執行；不存在已排程的capture或RAM測試。

### M2C automated verification / scope
最終verify.ps1 exit0：TypeScript、Vite4.5.14 build、測試型別檢查，7files/52tests；原有47tests保留。
新增5個證據測試只讀public fixture並操作bytes；首次因node:fs/crypto型別未安裝而失敗，
改用既有Vite raw import與Node24提供的Web Crypto後通過，沒有新增依賴或修改test config。
- FreeDSP-specific files changed: tests/freedsp/officialAppEvidence.test.ts、fixtures/officialAppUsbHelperDump.txt、officialAppEvidence.md。
- Shared files changed: GENERAL、ROADMAP、DECISIONS、DONE、.gitattributes（只限定原始dump，停用換行轉換並保留原有兩處尾空格）；共享runtime無修改。
- Non-FreeDSP protocol code changed: NO。
沒有硬體寫入、browser/GUI操作、APK/driver安裝、GitHub留言、commit或push；停止於M2C-Research。
git diff --check與新增檔案差異檢查通過；原始dump的兩處尾空格依限定attributes原樣保留。
本輪verify產生的dist差異已還原，src/package/scripts/config差異為空。
交付前5173無監聽程序，server目前未執行；本輪未啟動它。
固定網址http://localhost:5173/；手動啟動命令.\scripts\dev.ps1。

## M2D-Deep — 2026-10-07
起始HEAD=2dfe0db；M2C八個檔案仍未提交，均為上一輪本對話已產生的docs/fixture/test，
完整保留並納入本輪自動Git交付。基準verify exit0，7files/52tests；branch與remotes正確。
Henry離開電腦，本輪不需要手動測試或Git動作。只使用一名helper處理dump，main負責APK與證據整合。

### Research checkpoint — phase 1 inventory / concrete APK lead
- Examined: 既有M2B/M2C證據、目前status/log、官方Link頁的直接APK連結、現有靜態工具。
- Verified facts: 官方頁直接指向https://download.moondroplab.com/moondroplink/app-release.apk；repo無APK/native材料。
  M2C工作尚未commit，未遺失；baseline52tests通過。原始dump已固定hash。
- Hypotheses: 此官方APK可能保留CafCmdHelper與UsbHelper，可直接解出report prefix、packed欄位與commit產生路徑。
- Discarded hypotheses: 不再把尺寸符合61的M2B候選當成可操作的格式證據。
- Unresolved fields: helper62/WebHID61邊界、transaction、packed count/command、190、commit FF000000。
- Next search target: 官方APK的DEX/native symbols及Java到USB呼叫鏈；helper平行逐對分析114arrays。

### Research checkpoint — phase 2 exhaustive dump / official APK recovered
- Examined: 全57pairs，以deterministic script逐offset unique values/entropy、TX/RX diff、payload分類及45筆係數log對照。
- Verified facts: 90×1、220=metadata9+coefficients45+commit1、259×1；114arrays長度62，prefix01 00、module固定。
  前56pairs只差offset2/5；最後firmware另差10/14/18/22。RX command=TX|8000，counts0/4。
  96個負TX words確實sign-extend；commit是255，不是numeric int32 -1。全部45coefficients逐字對上log。
- Hypotheses: reportID/internal prefix仍均可解釋首01；RX可能echo或buffer reuse，不能等同DSP state。
- Discarded hypotheses: 固定U32 transaction涵蓋0..3會跨入可變count；signed-byte日誌不能解釋commit anomaly；Gain always3錯誤。
- Unresolved fields: bytes0..1與report boundary、native count width與13容量、190；commit255的具體型別。
- Next search target: 英文頁APK HTTP500，但官方中文頁https://moondroplab.com/cn/moondrop-link指向android-release.apk，下載成功。
  110,710,316bytes，SHA25604756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5。
  只靜態解析，未安裝/執行；APK與parser依賴在TEMP，不納入Git。追查CafCmdHelper/UsbHelper call chain。

### Research checkpoint — phase 3 authoritative Java serializer
- Examined: 官方APK 2.25.0c-260813ai / versionCode102034的DEX，CnxtUsbCommand、CafCmdHelper、UsbHelper、FreemanCnxtUsbDevice。
- Verified facts: getUSBMessage配置10+4N bytes，prefix參數以U16 LE寫0..1，所有相關call site傳1；packed欄位2..5、CTRL6..9、long[]的低32bits LE由10起。
  sendCmd直接SET_REPORT(0x21,9,0x0201,3)，UsbHelper以buffer.length傳controlTransfer，沒有JNI重新序列化。
  report ID1之外仍有一個00 byte；WebHID正確data應為完整62-byte buffer去掉首位ID，得到61bytes。
  count encoder僅取低8bits，decoder讀U16；command decoder15bits、reply bit31，不是12-bit command mask。
  commit源碼明確const-wide/16 255，放long[13]的word0，FF000000不是byte logger或sign extension特例。
  setFreeman3EQ明確command190，13words：[0, band+5, signed-byte Gain promoted to long, B0,B1,B2,A0,A1,0×5]。
  native Eq2Coeff被要求precision24；native係數數學仍須獨立檢視，不能直接把24解釋成Q24。
  Flash220的metadata與coefficient分支不同；187只有1word，188有13words，推翻所有commands永遠13words。
- Hypotheses: 首位ID由HID規範、wValueID1、descriptor61與全部helper62共同支持；第二byte語意尚無名稱，只能確定是prefix高byte=0。
- Discarded hypotheses: helper前置非傳輸metadata、JNI之後才序列化、U8 transaction刪第二byte、COUNT_U8刪count後00、commit數值-1。
- Unresolved fields: July APK精確版本、USB actual completion lengths、native Gain/係數量化；不影響已恢復Java序列化邊界。
- Next search target: 保存可重現DEX抽取與精確offset evidence；用獨立離線模型replay全部114buffers；核對FreeDSP device dispatch與native precision。

### Research checkpoint — phase 4 convergence / reproducible evidence
- Examined: res/qc.xml、Freeman3 dispatch、Eq2Coeff JNI wrapper、HID1.11/Android API、upstream HEAD及Issue全部31comments/所有直接附件連結。
- Verified facts: APK將VID13784/PID5270映射Freeman3；190不是legacy Freeman的16byte/reportID4路徑。
  Java Gain是signed byte，但提升為long後仍寫32bits；所有payload words一律低32bits，commit是long255。
  官方USB helperRX使用fresh buffer；前56pairs的echo不能用同一TX array直接reuse解釋，但hook是否自改仍未知。
  模型對114buffers全部逐byte一致；13個forensics/layout tests及測試型別檢查通過。
  upstream HEAD仍af0bcf7；Issue仍31comments。log.txt/COPY.MSG.LOG.txt重新下載404，既有helper原樣fixture可重現。
- Hypotheses: 不再保留其他61-byte格式作候選；native coefficient precision24與Gain對數學scale的關係另立研究問題。
- Discarded hypotheses: 額外embeddedID、刪count zero、刪第二prefix byte、固定U32 transaction、12bit command mask、commit-1、所有commands定長13。
- Unresolved fields: vendor第二byte語意、July hook版本、實際USB completion長度、native係數數學、短187 WebHID容量策略。
- Next search target: 本輪完成驗證與自動Git保存；另輪授權後只修改FreeDSP-specific serializer，短命令與係數問題先保留gate。

### Comprehensive evidence inventory
Primary表示最接近其所述層級的原始資料，不代表實機效果。下表與前述M2C完整31comment時間軸共同構成來源清單。

| Source / date or commit | Level | Proves | Does NOT prove | Confidence |
| --- | --- | --- | --- | --- |
| Henry M2A descriptor / 2026-10-07 / henryM2ADescriptor.ts | Primary device report, copied fixture | ID1、61×8data、VID35D8/PID1496 | vendor layout/audio effect | HIGH capacity |
| Current src/freedsp/conexantPacket.ts / HEAD2dfe0db | Primary local source | 11byte header、61allocation、截尾與commit-1 | device接受或正確協定 | HIGH source |
| M1 fixtures/conexantPacket tests /6665470 | Derived characterization | currentJS固定輸出/Q22數學/mock fallback | known-good USB packet | HIGH software only |
| M2A/M2B candidates/tests /652099e/2dfe0db | Derived hypotheses | 62gate及兩種61byte算術 | 正確native格式；M2D已排除兩種刪byte假說 | HIGH characterization, rejected layout |
| Upstream history e7da5b5/c7c95fa /2026-07-01/02 | Primary commits | 欄位加入來源、62→61只改allocation | serializer native來源或實機成功 | HIGH source |
| Upstream HEADaf0bcf7 /2026-09-29, live refs2026-10-07 | Primary repository | 沒有較新upstream serializer修正 | firmware格式版本 | HIGH |
| README/comments/152c012/eb0a338 | Derived same-author claims | 190/220/90/Q22宣稱來源 | 獨立驗證 | LOW protocol authority |
| Issue #3 body/comments31 /2026-06-29–10-06 | Primary tester logs + derived interpretations | 時序、錯誤、descriptor回報、作者無硬體 | Sync Complete=EQ生效 | HIGH chronology |
| log.txt /29552424/4855191555 /2026-07-01 | Primary official app UI/helper logcat; M2B/M2C已讀 | rate/band/係數/Flash結果文字 | USB bytes/ABI；M2D重新下載404 | MEDIUM semantic log |
| freedsp_usb_raw_log.txt /29558901/4857176508 /2026-07-01 | Primary signed helper byte arrays | 114arrays/57pairs/90,220,259/係數與255 | exactJuly version、hook/source、actualcompletion/audio | HIGH observed bytes |
| COPY.MSG.LOG.txt /33104041/6015725221 /2026-10-06 | Primary Henry Aura console; direct link inventoried, fetch404 | 附件存在於comment；comment記錄Sync Complete無聽感差異 | 未重新取得內容，不把它當officialUSB資料 | LIMITED retrieval |
| Issue body images bbcae7a7…/dc24bee2…及Henry70262ffd… | Primary UI screenshots; direct links inventoried, current fetch unavailable | 螢幕證據連結存在 | 非rawUSB/struct；沒有用未讀圖片推論欄位 | LIMITED retrieval |
| Official APK /2.25.0c-260813ai/102034/HTTPmodified2026-09-16 | Primary static implementation | serializer/USBcall chain/190/commit/device mapping | July版本一致或實機效果 | HIGH source |
| DEXSHA532514c9… / officialApkStaticEvidence.json | Derived reproducible excerpts of pinned primary | 精確DEX byte offsets、types、method signatures | app執行或所有native數學 | HIGH traceability |
| Eq2Coeff JNI wrapper /official APK | Primary static source | native(I,Object,Object,I)只轉coeff；precision24；Gain B/coeff I | Q22/Q24完整公式、CAF native struct | HIGH signature, UNKNOWN math |
| HID1.11 §6.2.2.7/§7.2.2 & Android controlTransfer | Primary specifications | ID增加1byte；controlbuffer從0傳指定length | vendor第二byte語意/實際completion | HIGH API boundary |
| ASR posts2038285/1859388/2629829 | Derived external discussions | 偵測失敗、jadx研究建議、Aura作者同源介紹 | 獨立CAF serializer | LOW format evidence |
| devicePEQ0617f382… handler/captureJSON | Derived reverse-engineering claims | 另repo不同schema且capture含非法byte | authoritative rawcapture | REJECTED capture authority |
| MegaSuite/moondrop-link-desktop tree | External code lead | GAIA/Bluetooth研究方向，未找到本輪CAF byte source | FreeDSP Conexant serializer | LOW relevance |

附件完整連結：上述三個text URLs見M2C source table與Issue comments；圖片為
https://github.com/user-attachments/assets/bbcae7a7-139e-4c41-aad9-5fa33d063e5a、
https://github.com/user-attachments/assets/dc24bee2-7274-43f3-a816-3cc155b134d8、
https://github.com/user-attachments/assets/70262ffd-374d-4b18-a136-11e0d6fcf3f6。
無APK/pcap附件；本輪APK來自官方中文頁直接來源。失效附件沒有阻止HIGH serializer收斂，但不得稱已完整重讀。

### Every-packet structure / command findings

| Family | Pairs | TX physical capacity / logical count | RX logical count | Payload / variability |
| --- | --- | --- | --- | --- |
| 90 mode | 1 | 62 /13 | 0 | [90,mode,0×11]；此sample mode0 |
| 220 metadata | 9 | 62 /13 | 0 | [0,band,freq,Q×256 truncated,filter,gain truncated,0×7] |
| 220 coefficients | 45 | 62 /13 | 0 | [rateIndex4..8,band1..9,Gain2/3,B0,B1,B2,A0,A1,0×5] |
| 220 commit | 1 | 62 /13 | 0 | [255,0×12] |
| 259 firmware query | 1 | 62 /13 | 4 | TXallzero；RX[9,7,14,1]後zero |

114arrays首0..1=01 00、module6..9=00 23 2D B3，尾42..61全zero。
count offset2為TX13/RX0或4；offset3zero；command4..5含reply highbit。
前56pairs只差offset2/5；firmware另差10/14/18/22。fresh RX buffer並不把echo變成DSP readback。
全部45coefficients逐字吻合旁邊log；96negativeTX words保留二補數。每offset unique/entropy、nonzero range、word值與pairdiff見officialAppDumpAnalysis.json。

190在July dump缺席，但現在有獨立setFreeman3EQ來源：
[0, CommonUtil.shiftEQBandForFreeman3(band)=band+5, Gain, B0,B1,B2,A0,A1,0×5]，13words。
Gain原始Java signed-byte、coeff fields signed-int，轉long後寫低32bits，不能把marker常數3寫死。
legacy setFreemanEQ是另一16byte/reportID4路徑，不是本FreeDSP；沒有修改其他Freeman裝置。
187=[0]只有1word、188=[1,0×12]13words，是RAM首次enable前置操作；短187的WebHID適配尚未確認，本輪不做runtime候選。
CAF module由四字元ASCII減32後，各shift8/14/20/26 OR，CTRL=0xB32D2300，不是未明hash。

### Structural hypothesis scoring against all packets and source

| Hypothesis | Explains | Contradicts | Confidence / why |
| --- | --- | --- | --- |
| HIDID1 + remaining61data | 114buffers、descriptor、SETREPORTvalueID1、HIDspec、fullbuffertransfer | 無已知矛盾；actualcompletedbytes未捕捉 | HIGH, sole surviving serializer boundary |
| prefix是U16欄位且需全部放WebHIDdata | rawprefix01 00 | source整buffer已有HIDID、descriptor僅61；會重複ID | REJECTED as WebHID model；U16 source寫法本身是fact |
| 第一byte是internal metadata由下一層移除 | 靜態constant1 | helper直接controlTransferlength62，無strip/JNI中介 | REJECTED on recovered path |
| buffer只是nativeABI結構，USB另轉換 | olddump單獨可能 | Java byte[] builder與整buffercontrolTransfer | REJECTED |
| TRANSACTION_U8刪buffer第二byte | 61byte容量 | 丟掉WebHIDdata的00，仍含ID；全57TX不符正確data | REJECTED |
| COUNT_U8刪buffer第三offsetzero | 61byte容量 | 官方packedfield保留zero；全57TX不符 | REJECTED |
| 固定U32 transaction at0 | TXprefix可常數 | RXcount變0/4且source已分prefix/packed | REJECTED |
| 12bit command mask | 90/190/220/259可容納 | decoder明確15bits且replybit31 | WEAKENED；本round無高cmd硬體，但source不支持12bit |
| 所有命令13有效words | observed3families | RXcount0/4、1871word、generic10+4N | REJECTED universal rule |
| 末zero可刪成任意61bytes | dump tailzero | source以long[13]配置62，descriptordata61只扣ID，不刪word | REJECTED |
| commit=-1/signbyte logger | 首byteFF | 另外3bytes00 vsFF且sourceconstlong255 | REJECTED |
| command190由220直接泛化 | 大部分coeffpositions相似 | 190word0=0/word1=band+5，220rateIndex/band | REJECTED；共享serializer成立，payload不同 |

### Confidence-ranked surviving serializer model
1. **HIGH — Official CAF Java report buffer / external WebHID ID boundary.**
   Full13wordcontrolbuffer62：ID1at0、prefix高byte0at1、packedLE32at2、CTRLLE32at6、13low32LEwordsat10。
   WebHID externalID1/data61：0at0、packedat1、moduleat5、wordsat9。
   packed=(N&0xFF)|(cmd<<16)|(reply&1)<<31；bits8..15zero，decodercountU16/command15bits。
   TXN13來自long[13]callsite，不是serializer固定；module由CafId字元packing；word types依命令語意，傳輸統一32bits。
   Supports：官方hash/source/mapping、HIDspec、Henrydescriptor、114byte-for-bytereplays。
   Against/limits：沒有實測USBcompletion或DSP/audio；未知JulyAPK，不把當前source當舊hooksource。
   第二00的vendor名稱未知不影響layout，不能保留另一個無來源U8/U16 transaction候選。

### Signedness / Flash commit conclusion
確定是long常數255→low32bitsLE FF000000。不是8bit field專用serializer，不是unsigned logger轉換，不是-1 signextension錯誤。
Native Gain原始型別B但仍提升寫32bits；正常負coeff/metadata也用同一long[] serializer。
Flash word0的語意值與JS -1不同，是獨立於framing的confirmed implementation defect；本輪不修Flash路徑。

### Final serializer conclusion / one future experiment
**YES — serialization layout recovered with HIGH confidence for the target source path.**
這不表示整條RAM操作或DSP數學已完成。Missing artifacts不是layout收斂阻礙：July exact APK/hook與one hostcapture未取得；
native math/short187屬下一實作問題，不再為header提供額外LOW候選。
One optional future test：官方app只切mode一次，取command90SET_REPORT完整submitted/completedURB，
記錄0x21/9/0x0201/index3、requested/actual62與payload首01 00 0D 00 5A 00 00 23 2D B3。
剝ID後恰61；此一封包即可檢查actualboundary及舊hook/currentAPK一致性，無需Flash或EQ參數系列測試。
Android是officialUSBhost；只把PC透過ADB接手機不能讓USBPcap看到OTGbus。當輪無要求Henry手動操作。
下一coding輪可在src/freedsp/重建正確61data，不對舊截斷buffer直接slice；保持descriptor gate、先用fixture驗證。
RAM190 bandshift/Gain與187/188前置命令先明列依賴，native數學不憑precision24改成Q24。

### Problem / hypothesis / next action
Observed problem:
- CurrentJS重複ID/偏移/截尾，commit-1與官方255不同；尚無RAM/audio proof。
Verified facts:
- 官方Java buffer62包含ID1，WebHIDdata61；精確command190、CTRLpacking、255常數及114replays。
Possible causes:
- source已直接支持framing/commit缺陷；實機無EQ的其餘原因可能含band+5、Gain/native math、187/188前置操作，未做因果硬體隔離。
Ruled out / weakened:
- 刪countzero/第二prefixbyte、nontransmittedmetadata、JNI之後轉buffer、commit-1、所有commands13word、12bit command權威。
Next validation:
- 本輪verify與Git交付；未來唯一capture如上。先另輪授權實作FreeDSP-only serializer與fixture，不能當輪送RAM。
Possible fix direction:
- 完整重建9byteWebHIDdataheader+52payload，外部ID1；commit255、190獨立payload；短命令/係數另外解決，不擴張共享runtime。

### Automated verification / final checkpoint
- verify.ps1 exit0：TypeScript、Vite4.5.14 build、測試型別檢查、9files/65tests；原52tests+新增13。
- APK extraction reproducibility：相同pinned artifact再次抽取，22methods及全部metadata JSON結構完全一致。
- Analysis output determinism：all-pair JSON由測試重新生成並與保存artifact比較；源dump hash維持M2C原樣。
- 研究格式已收斂；runtime實作、native數學與短187適配未執行，M2 RAM proof仍NOT PROVEN。
- 只還原verify產生的三個tracked dist檔案；不還原既有M2C或本輪研究文件。
- Git自動交付依本輪remote-mode授權：stage intended files、review cached stat/check、commit、push、final clean status。

### Scope / regression check
- FreeDSP-specific files changed: 本輪scripts/freedsp/與tests/freedsp/離線研究檔案；保留前輪M2C fixture/test。
- Analysis/test files changed: analyze-dump.mjs/.d.mts、inspect-apk.py、official-layout.mjs/.d.mts；forensics.test.ts、officialLayout.test.ts；dump/APK JSON及來源說明。
- Shared runtime files changed: NONE。共享文件僅四份docs；.gitattributes只限定保留原樣dump。
- Non-FreeDSP protocol code changed: NO。
- 本輪不修改src、sync、RAM sender、Flash、preamp、readback、package/test config；不操作硬體。
- Current milestone: M2D-Deep — serializer convergence COMPLETE；M2 hardware RAM proof NOT PROVEN。
- 固定localhost URL：http://localhost:5173/；啟動命令.\scripts\dev.ps1。本輪不啟動server、不開browser。

## M2E — Official RAM/EQ Semantics Reconstruction — 2026-10-07
起始HEAD0b37c10，工作目錄乾淨，baseline verify通過9files/65tests；Henry remote mode，本輪不存取硬體。

### Research checkpoint — phase 1 current runtime / native lead
- Examined: M2D官方APK/hash、完整Java方法資料、AuraPEQ Conexant RAM/sync/math路徑、native exported strings。
- Verified facts: Aura RAM每band迴圈rate4..8，word0=rateIndex、word1=band.index+1、Gain固定3；沒有187/188，最後90mode0。
  官方setFreeman3EQ word0=0，band經shift+5，Gain由native回傳，native precision參數24。
  APK內libcxaudiodsplib_embca_jni.so保留CxAudioConvertEqParams2Coeffs、EqDesignFx、BandFxToFloat與JNI轉欄位symbols。
- Hypotheses: RAM把Flash slot/rate schema誤用；Gain是native係數縮放資訊而非固定值；band輸入範圍需由呼叫者驗證。
- Discarded hypotheses: 不把M2D已確定的61byte layout重新列成未定候選，不因Sync Complete認定DSP接受。
- Unresolved fields: Java band guard/producer、sample-rate查詢來源、Gain數學、native固定點與feedback符號、90與187/188順序。
- Next search target: 靜態ELF/ARM64解出native轉換與縮放，並追Java callers/constant arrays/輸入與enable分支。

### Research checkpoint — phase 2 JNI/native scaling / RAM guard
- Examined: pinned arm64 libcxaudiodsplib_embca_jni.so，JNI_OnLoad registration、callback0x27F4、CxAudioConvertEqParams2Coeffs0x2ABC、EqDesignFx0x3510、EqFxToFloat0x3800、Java callers/constants。
- Verified facts: native callback完整傳sampleHz/inputParam/outputCoeff/precision24；Java flags/frequency/Q×256/gain×256進native四個16bit欄位。
  native FX exponent e由log(maxAbsCoefficient)/ln2計算；輸出Gain=e+2，effective scale=2^(24-1-e)=2^(25-Gain)。Gain3→Q22，Gain2→Q23。
  native明確negate兩個denominator coefficients，B不反號；feedback符號方向與Aura相同，但固定Q22/Gain3不是一般公式。
  PK的Q會轉bandwidth再計算alpha；float32 coefficients經32種floor/floor+1近鄰選擇（整數仍可+1），不是單純Math.round。
  handleSySendEqParams直接把Flutter band交EQParam，沒有減1；Freeman3 set/getEQParam接受0..4，shift+5→5..9。
  不能把此5-band即時SDK API當成已證實9-band RAM mapping；setDefaultAvailable另外清0..9與word0=0/1。
  FREQ_SAMPLE_RATE包含44100；SAMPLE_RATE_ARRAY的index4卻寫44000，兩張表不同，不能混用。
  getCurSampleRate由command346 [62,0×12]回應word1取index；RAM只算一次/current，fallback為caller sampleRate48000。
- Hypotheses: 190word0可能channel/target selector（初始化用0/1），沒有field name，不命名成rateIndex。
- Discarded hypotheses: 190word0可直接使用Flash rate4..8、九band一律+5、Gain總為3、precision24等同Q24、全rate RAM更新。
- Unresolved fields: exact native最後LSB量化、nine-band live API、Dart UI呼叫次序、legacy EQ enable ID4/5在target descriptor的可用性。
- Next search target: 重建native量化並與45組官方係數比較；追SvcModClient/Service EQ enable與90路徑，保存可重現來源。

### Research checkpoint — phase 3 complete native boundary / independent replay
- Examined: Flutter UsbDeviceHandler→SvcModClient→FreemanController→FreemanSession→FreemanCnxtUsbDevice；native registration/JNI callback/struct/float design/exponent/32candidate quantizer。
- Verified facts: 45組Gain全部吻合離線模型；225係數全部位於native對應的兩個整數候選內，包括24bit signed feedback反號。
  實際native先floor與floor+1再反號，不能把整數只保留一個ceil/floor候選。
  現有builder按官方WebHID布局解讀，190會成command13、count1、module0x230000BE，並不是190/CTRL；新增byte解讀測試。
  Service的setEQ先getEQEnabled，必要時setEQEnabled(true)（legacyGETID5/SETID4），再進Freeman3CAF188/187/346/190。
  setEQParam路徑沒有post190的90；mode90由獨立Flutter preset方法/Service command提供。不能宣稱每次190後必須90。
  libapp.so為12,649,432byte Dart AOT，只有snapshot exports、無debug sections；UI事件先後未恢復。
- Hypotheses: selector0/1可能channel；90在每次write後可能重載preset，但firmware效果未證實，不作fact。
- Discarded hypotheses: 固定Gain3/Q22普遍正確、每rate更新RAM、現有Host Sync Complete=vendor ACK/DSP生效。
- Unresolved fields: native最後1LSB候選挑選尚未在portable helper逐bit重現；nine-band live mapping、legacyID4/5/短187的WebHIDdescriptor支持、Dart UI排程。
- Next search target: 完成逐項狀態表/零效果原因排序與具體fix plan，驗證後自動Git交付；不實作runtime。

### Full real-time EQ call chain and native arguments
完整方法與instruction addresses見tests/freedsp/fixtures/officialRamStaticEvidence.json及officialRamEvidence.md。
Source仍為M2D同一官方APK/hash；本輪不另外假設JNI CAF serializer。

Flutter handleSySendEqParams直接讀band/freq/gain/q，filterType=0，sampleRate fallback48000
→SvcModClient.getUsbEQ→FreemanController.setEQParam→FreemanSession.executeCommand
→getEQEnabled／必要時setEQEnabled(true)→FreemanCnxtUsbDevice.setEQParam。
Freeman3 branch接受band0..4；首次CAF enable順序188[1,0×12]、187[0]
→getCurSampleRate command346[62,0×12]（回應word1為index）
→native conversion→190[0,band+5,Gain,B0,B1,B2,A0,A1,0×5]→helper ACK。沒有Java post190的90。

Eq2Coeff native method `(I,Object,Object,I)I`＝sampleHz、EQBandParam input、CX2070xBandEQCoeffs output、precision24。
Registered callback0x27F4；native input struct是flagsU16/frequencyU16/QrawU16/gainRawS16（共8bytes），
Java先int(q×256)/int(gain×256)朝零截斷。JNI寫native coeff五signed-int及Gain byte，再由Java long[] serializer寫32bits。
Native C函式0x2ABC呼叫EqDesignFx、EqFxToFloat與pole check；Java遇conversion result非0回傳null。
輸出FX exponent e→Gain=e+2；scale=2^(24−1−e)=2^(25−Gain)。Gain3Q22、Gain2Q23。
Feedback A0/A1是−normalized a1/−normalized a2；native明確反號，B保留原符號，24bit負數向32bit延伸。

PK alpha不是Aura簡單sin(w)/(2Q)：native將Qraw/256轉BW=float32((2/ln2)asinh(1/(2Q)))，
alpha=sin(w)sinh((ln2/2)BW w/sin(w))，gainRaw/256進A=10^(g/40)，normalize後float32。
Quantizer對五coeff先float32×scale，再32種floor或floor+1組合，clip±(2^23−1)、穩定pole檢查及三probe響應評估；
反號在量化後。離線helper重建float/scale/候選區間，不宣稱精確重建最後候選挑選；全部225words均在兩候選內。
Q22/Gain3是自洽特例，較低精度本身不能解釋完全無效果；但大的boost/shelf係數可能超出signed24。

### Band / sample-rate / activation boundaries
- 官方即時SDK五band0..4→wire5..9，setter/getter guards一致；Flutter bridge沒有減1。
  Flash九band1..9與初始化slots0..9不等於九段live mapping。未知硬體mapping不能用「全部+5」取代。
-190word0固定0；初始化使用0/1，符合channel/target假說，但沒有權威欄位名稱；確定不能當Flash rate4..8。
- RAM只根據current index4..8選44100/48000/96000/192000/384000之一；query失敗或超範圍回caller48000。
  FREQ_SAMPLE_RATE實際為44100；另一張config/readback SAMPLE_RATE_ARRAY index4錯寫44000，不能混成一張表。
- Service的legacy enable：GET inputID5/6bytes；canUpdate最多三次檢查；enable SET outputID4/interface3
  `[04,40,01,11,C8,03]`。Henry descriptor未提供ID4/5支持，不能現在移植到WebHID。
- CAF188結果設enable flag；187的結果被忽略，source仍可能繼續190。FreemanSession亦丟掉setEQParam錯誤。
  不能把官方UI/service成功當成vendor ACK，後續實作須改善錯誤傳遞，而非照抄。
-90是獨立preset selection `[90,index,0×11]`；Flashsource確認0是custom。
  190路徑沒有呼叫90；Dart libapp.so是無debug的AOT snapshot，UI是否另排90未恢復。
  「90會重載Flash覆蓋RAM」只是候選解釋，沒有firmware或實機證據，不列為confirmed defect。
- First getEQParam可能query442並對較新FW做selector0/1、slots0..9 flat reset；不是每次同步必要操作，不能複製reset。

### Current AuraPEQ comparison
Status針對該列明確範圍。CORRECT只表示source/schema/數學一致，不表示硬體已通過。

| Area | Official app behavior | Current AuraPEQ | Status | Likely impact |
| --- | --- | --- | --- | --- |
| 精確VID/PID辨識 | res/qc.xml→Freeman3 | 35D8/1496→CONEXANT | CORRECT | 沒有走錯SAVITECH的正常FreeDSP分支 |
| Report ID/容量 | external1/data61 | external1/data61但內又含ID/U16 prefix | WRONG | 全部命令vendor欄位偏移，最高零效果候選 |
| RAM command number |190 |190呼叫值 | CORRECT | 正確opcode選擇；實際framing解讀不是190 |
| CTRL module數值/LE | B32D2300字元packing | 數值/LE相同，offset錯 | CORRECT value / WRONG placement | DSP dispatch可失敗 |
| RAMword0 | 固定0，初始化另有1 | Flash rate4..8 | WRONG | 寫錯target selector，可能全部忽略 |
| RAMband | SDK0..4→5..9 | Aura0..8→1..9 | WRONG for proven SDK path | 不同stage；九段完整對應仍UNKNOWN |
| rate Hz表4..8 |44100/48000/96000/192000/384000 | 相同 | CORRECT literals | 無須把44100改44000 |
| RAM rate選擇/次數 |346 current lookup、一次；fallback48000 | 不查current，五次 | WRONG | 無效selector或反覆覆蓋；不能稱更新所有rates |
| Gain來源/scale | native e+2，2^(25−Gain) |3及2^22 | UNSUPPORTED ASSUMPTION | 可自洽，但未動態防24bit溢位；不獨立證明零效果 |
| B/feedback符號 |B原號，A0=−a1/A1=−a2 |相同 | CORRECT | 不是「feedback少反號」問題 |
| signed word packing | native24bit係數sign-extended32 | JS int32 LE | CORRECT packing / UNKNOWN range safety | 不保證所有boost值在24bit內 |
| PK Q/math/rounding | Q/gain先trunc256；BW alpha；float32+32候選 | 原double Q/gain、普通RBJ alpha、Math.round | WRONG as exact SDK reconstruction | 曲線/LSB不同，較不像完全零效果 |
| filter enum PK/LS/HS | nativeflags0/1/2；Flutter即時入口只PK0 |0/1/2 metadata；RAM有PK/LSQ/HSQ math | CORRECT enum / UNKNOWN full math equivalence | 非PK尚未重建完整native量化 |
| RAM13words/零尾 |13words、尾5zero |相同 | CORRECT schema capacity | 不能修復header/selector |
| 首次188/187 |先188enable再187EQCFG，另有legacy enable |完全沒有 | WRONG omission relative to source | DSP可能仍bypass；WebHID適配未證實 |
|90payload/mode0 |[90,0,...]custom有來源 |同值 | CORRECT payload | framing仍錯 |
|90後置順序 |Java190路徑無post90；獨立preset入口 |sync尾與realtime batch尾強制90 | UNSUPPORTED ASSUMPTION | 可能重載preset，效果UNKNOWN |
|成功/ACK |lower CAF解析reply/count；上層service可能丟錯誤 |只await host send，Sync Complete | WRONG success interpretation | 無效payload也可能顯示完成 |
| output→feature fallback |CAF SET_REPORT outputID1 |失敗後無條件featureID1 | UNSUPPORTED ASSUMPTION | descriptor沒證明feature支持，不是vendorACK |
| preamp |本輪未追到Freeman3獨立master命令 |只存state | UNKNOWN command / CORRECT description as no-op | 不能調硬體preamp；不解釋非零band EQ完全無效 |
| readback |官方getEQParam/446、Flash477等 |從local state恢復，不解析DSP EQ | UNSUPPORTED ASSUMPTION if called device state | flat UI不代表DSP flat，未改readback |
| A/B |nativepreset有index，沒有Aura A/B硬體slot證據 |切localprofiles並sync | UNKNOWN physical slot semantics | 應以有效RAM更新驗證，不把UI切換當硬體slot切換 |
| Flash metadata |gain朝零截整數，Qtrunc256 |gain×256、Qround256 | WRONG | 影響保存metadata，非RAM零效果主因 |
| Flash rate/band/commit |rate4..8/band1..9，commit255 |same rate/band，但commit−1/Gain3 | CORRECT indices / WRONG commit / UNSUPPORTED fixed precision | 本輪不修Flash |

### Ranked explanations for zero audible effect
1. **最高：錯誤framing/dispatch。** 有確定byte證據：現有190在正確layout解讀為command13/count1/module0x230000BE；
   真正190/CTRL未在正確欄位。Host成功不等於DSP接受。沒有硬體因果實驗，因此稱最強候選，不稱已實測根因。
2. **高：RAMword0誤用Flash rate4..8。** 官方runtime0、初始化0/1；target selector非法可使全部寫入無效。
3. **中高：漏188/187及可能legacy EQ enable。** 直接缺少官方enable鏈，但ID4/5/187在WebHID可用性未知。
4. **中：band mapping不符與九band泛化。** 官方五band5..9，Aura1..9有部分重疊，不獨立證明全部無效。
5. **較低／未證實：post-write90重載preset。** Java無此步驟；firmware可能覆寫RAM，但無直接效果證據。
6. **較低：math/precision/active-rate差異。** 可改曲線或溢位；Q22/Gain3在attenuation範圍自洽，不能把差異當零效果根因。
Flashmetadata/commit與無preamp命令不列為本次RAM sync零效果的首要解釋。

### Exact future runtime fixes / remaining gates
本輪沒有實作下列production變更。未來只在FreeDSP path，新的邏輯放src/freedsp/，共享caller只接線：
1. 完整重建正確61data（0、packed、CTRL、13words），ReportID外傳；不裁切舊截尾buffer。
2. RAMword0固定已證實selector0；不要把Flash rate loop搬來；query346選一次currentHz，有明確fallback/error政策。
3. 已證實SDK五band用0..4→5..9。九段UI不能全部+5；需另證九段live mapping，未證實band拒絕/停用，不靜默丟段。
4. native-compatible conversion：參數trunc256、PK BW formula、float32、dynamicGain/scale、signed24 bounds、feedback符號、近鄰量化。
   exactLSB quantizer可依保存native instructions另port；PK之外也要獨立fixtures，不能改共享RBJ公式影響其他DAC。
5. 首次enable按188/187來源處理，但短187及legacyID4/5須先確認WebHID descriptor/transfer可行性；不猜padding/fallback。
6.90 preset selection與RAM寫入分開；沒有證據時不把post190強制90當必要commit，不宣稱mode0會/不會覆蓋RAM。
7.等待vendor reply，檢查command/module/reply/count及timeout，把host-write成功和DSP ACK分開；官方SDK丟錯誤不可照抄。
8. Flash的commit255/metadata gain修正屬另輪Flash範圍，本輪只記錄；preamp/readback不附帶擴張。

### Explicit answers
1. Command190 definitely correct? **YES for official Freeman3 RAM opcode**，不代表當前bytes被DSP辨成190。
2. Current Aura RAM190 payload correct? **NO**：word0、band mapping、current-rate策略與enable鏈不符，另有framing錯誤。
3. Band mapping correct? **NO for proven0..4→5..9 SDK API**；完整九段RAM mapping仍UNKNOWN。
4. Sample-rate mapping correct? **Hz literals YES；RAM selector/五rate loop NO**。current346查詢缺失。
5. Coefficient scaling/sign correct? **feedback sign YES；Q22/Gain3是自洽特例但普遍假設未證實；exact SDK math/rounding NO**。
6. Command90 activation correct? **opcode/payload/custom0 YES；framing NO；post190必要性/效果UNKNOWN**。
7. Single most likely zero-effect reason? **錯誤CAF framing，命令/module不是190/CTRL，而Sync Complete只證明host promise完成。**
8. Exact runtime fixes? 上述1–7；九段mapping、短187/ID4/5與native最後LSB保留明確gate，不能假裝全部已可安全實作。

### Problem / hypothesis / next action
Observed problem:
- Henry報告Sync Complete但無可聽差異；本輪不操作硬體。現有buffers與官方布局/190語意不符。
Verified facts:
- 完整Java→JNI/native鏈、SDKband0..4→5..9、單一current-rate、188/187、Gain/scale/sign、45Gain/225words、錯command13解讀。
Possible causes:
- 依上述排序：framing、wrongselector、漏enable、band泛化、post90、math；不是已測量的硬體因果排序。
Ruled out / weakened:
-190opcode本身不是錯；feedback反號方向相符；Gain3/Q22差異不能單獨證明無效；五rate RAM假說無來源支持。
Next validation:
- 本輪完成無硬體verify與自動commit/push；下一輪授權FreeDSP-specific實作前，先解九段mapping及短enable descriptor gate。
Possible fix direction:
- 優先修serializer/190selector及ACK，再依可證band/current-rate/native模型接FreeDSP-only path；不附帶Flash/preamp/readback或其他DAC改動。

### Research checkpoint — phase 4 verified offline delivery
- Examined: final comparison table、8explicit answers、production scope及全部自動驗證。
- Verified facts: verify.ps1 exit0；10files/73tests及TypeScript/build通過；8個新tests保留原有65tests。
  pinned APK再次抽取22Java methods、9native functions、4JNI registrations，保存JSON完全相同。
  45Gain/225係數候選區間來自既有官方Flash dump交叉驗證，不是新RAM190 capture。
- Hypotheses: framing/dispatch為最強零效果候選；未進行硬體因果驗證。
- Discarded hypotheses: 固定Q22/Gain3的差異本身足以證明完全無效果；SDK五band等於已證九段mapping。
- Unresolved fields: 九段live mapping、最終量化neighbor、Dart UI排程、ID4/5及短187的WebHID支持。
- Next search target: 本輪停止於M2E；下一輪須獲授權再處理FreeDSP-only runtime fixes與上述gates。
- Scope: docs及FreeDSP offline scripts/tests/fixtures；shared runtime NONE；non-FreeDSP protocol NO；no hardware access。

## M2F — First controlled RAM hardware proof — ready for Henry / proof PENDING
### Problem / hypothesis / next action
Observed problem:
- 正常sync只證host send，尚無正確190/CTRL ACK與可聽結果。M2F用單段診斷隔離，不修正常production。
Verified facts:
- 新codec逐byte重播114個官方helper buffers；13word190解讀回190/count13/CTRL，全部words保留。
- WebHID外部ID1、61data、helper62；input/output61descriptor gate在open/send前檢查。
- Safe test與flat均188→187→346→190；190固定word0=0、word1=5，單一current rate4..8；不自動90。
- ACK需ID1/61bytes/prefix0/有效count/reply1/同command/CTRL；346至少兩words，word1為rate index。
- 每command2500ms deadline，HOST SENT/ACK/MISMATCH/TIMEOUT/SEND ERROR分開；secondaryID不當CAF ACK；listener清理。
- 係數由M2E模型、參數trunc256、PK BW formula、dynamic Gain/scale/feedback sign產生；nearest rounding為明確近似。
- verify.ps1 exit0：11files/94tests、TypeScript/Vite build與test typecheck通過；新增21tests，原73tests保留。
- localhost root、freedsp-debug.html、兩個diagnostic TS modules及離線model HTTP200；只驗證可提供，不宣稱瀏覽器或硬體成功。
Possible causes:
-187短transfer與固定61padding未必等價；CAF控制GET_REPORT回應未必送到WebHID input event。
- 未加入ID4/5 legacy enable或獨立mode90，可能影響EQ active state；不為了聽感盲目加命令。
- Native最後1LSB選擇尚未完全移植；五rate離線quantized poles穩定，1000Hz接近-12dB，頻率網格無實質boost。
Ruled out / weakened:
- 新診斷190不再解析成13、不截尾、不寫Flash rate selector、不做九段/五rate迴圈；host完成不再當ACK。
Next validation:
- Henry低Windows音量、IEM先離耳、關閉其他control頁，開http://localhost:5173/freedsp-debug.html。
- 按Inspect/connect，核對descriptor後勾安全條件；按Apply SAFE TEST，完整ACK後低音量比較。
- 按Restore tested band to FLAT，完整ACK後以相同來源/音量比較。第一次不按獨立mode90；DO NOT USE FLASH。
- 任一STOP/TIMEOUT/MISMATCH停止，回報完整logs與聽感，勿自動重試或以拔插當保證restore。
Possible fix direction:
- 依第一個失敗command／ACK／聽感結果隔離transport、enable及RAM語意；本輪不繼續production fixes。

### Research checkpoint — diagnostic implementation / verified delivery
- Examined: M2E source、現有DEV頁、官方helper fixtures、mock input events與固定衰減響應。
- Verified facts: production14modules build未加入診斷；11files/94tests通過、HTTP route/module提供成功；Codex沒有硬體access。
- Hypotheses: 正確framing/selector/188187可讓單段RAM生效；187適配與WebHIDreply delivery待Henry驗證。
- Discarded hypotheses: 必須九段全寫、五rate全寫、自動post19090、host send即DSP success。
- Unresolved fields: hardware ACK/聽感/flat return、187 padding、GET_REPORT vs input events、legacyenable與exactnativeLSB。
- Next search target: 等Henry回報；硬體proof保持PENDING。

### Scope / regression check
- FreeDSP-specific files: src/freedsp/officialRamProof.ts、src/freedsp/debugPage.ts、freedsp-debug.html。
- Analysis/test files: tests/freedsp/officialRamProof.test.ts。
- Shared files: docs/GENERAL.md、ROADMAP.md、DECISIONS.md、DONE.md；shared runtime NONE。
- Production runtime changed: NO。
- Non-FreeDSP protocol code changed: NO。

## M2G — source synthesis / controlled inbound test

### Official response behavior
| Command | Official send mechanism | Response expected? | Where response comes from | Used to gate next step? |
| --- | --- | --- | --- | --- |
|188 count13 [1,0×12] |synchronous sendCmd SET_REPORT |MUST_ACK: helper waits reply1 |GET_REPORT input1 endpoint0, fresh62-byte RX |bool stored in enable flag; false does NOT stop187/190 |
|187 count1 [0] |same sendCmd, short14 bytes |MUST_ACK in helper; bool ignored by caller |GET_REPORT input1 length14 |waits, but caller ignores success/failure |
|346 count13 [62,0×12] |getMsgByCmd SET plus initial/repeated GET |QUERY_RESPONSE_REQUIRED |GET_REPORT input1 length62; reads full-helper word1/offset14 |checks helper success, else -1001; EQ caller may use its fallback rate |
|190 count13 RAM |synchronous sendCmd SET |MUST_ACK in helper |GET_REPORT input1 length62 |bool→setEQParam result; service may discard error |

- SET: requestType0x21/request9/wValue0x0201/output/reportId1/interface3.
- GET: requestType0xA1/request1/wValue0x0101/input/reportId1/interface3; separate IN control transaction, not same OUT response.
- UsbHelper passes array.length/timeout1000ms; OUT returns integer, IN mutates RX. Both helpers ignore OUT result and IN returned object.
- sendCmd allocates fresh RX52; getMsgByCmd allocates RX66; no TX copy. Poll reply bit with outer~1000ms and sleep5ms; blocking calls can extend wall time.
- isExecuteSuccess onlynonnull/replybit1 plus redundant count>=0: decoder masks both bytes and produces unsigned16. No command/module match or semantic status check.
-188 is NOT fire-and-forget. All four have response expectations; no source-supported SEND_SUCCESS_ONLY classification.
- Count0 is observed for90/220, not188;346 exact response count/data not captured. Source reads capacityword1 even without positive logical count check.
- New query policy is stricter: complete logical header/words, primaryID1/prefix0/reply1/command346/CTRL/count>=2; unknown index logs Hz UNKNOWN rather than transport failure.

### RX origin and short187 conclusion
Current source strongly supports device IN GET_REPORT-populated fresh RX; it does not generate a local TX echo.
It discards actual read length, so array capacity and trailing bytes cannot be called complete transferred bytes.
July57pairs use UsbHelperDump, whose tag/log implementation is absent from pinned APK. Exact hook is missing.
Rank: GET_REPORT buffer (strong current-source support; historical compatibility only medium), July hook reuse/mutation (possible/unknown),
currentJava parser-generated echo (weakened), sameOUT response/interrupt source (contradicted for recovered path).
Many count0 buffers retaining payload could be returned capacity beyond logical count; this alone cannot distinguish old hook mutation.

187: source-proven short SET/GET request14 despite descriptor61 data capacity; completion length unmeasured.
WebHID send algorithm has no exact-length mandate, but OS handling differs. Cited Chromium Windows snapshot pads to collection maximum,
uses WriteFile for output/ReadFile for input, not an exposed Input GET_REPORT API. This is backend evidence, not Henry's browser/USB trace.
Consequently neither explicit61 padding nor shortJS187 is proven equivalent to Android shortcontrol. M2G sends neither187 nor188.
Sources and full instruction offsets: tests/freedsp/fixtures/officialResponseEvidence.md / officialResponseStaticEvidence.json.

### M2F listener audit / M2G changes
- M2F was attached to the sending instance BEFORE send; immediate send reply timing and DataView offsets/reportId exclusion were correct.
- Listener was attached AFTER open and removed at deadline; early unsolicited/open-time or late events could be lost.
- During wait raw hex was logged before ID filtering; representative Henry log has no RX line, so parser rejection alone is a weaker explanation.
- M2F parser required61, accepted onlyID1; shorter/different-ID CAF candidates were rejected for ACK, though wait-time raw data would be logged.
- M2G attaches persistent listener BEFORE open; every report ID/length/time/fullhex/counter recorded. Parsing is observational; unknown/unmatched never erased.
- Parser uses DataView byteOffset; header9 required, short logical responses supported, truncated/partial words marked. report2 remains raw/candidate, never presumed CAF reply.
- Listener remains after timeout/success. Query matcher registered before send, exact instance checked; no feature GET fallback, no polling promise pretending to be Input GET_REPORT.
- Browser opens explicitly on connection without any TX; descriptor collections/raw counter visible. No new keyboard shortcuts or write controls.

### Root cause candidates ranked
1. Highest: response transport mismatch. Official relies on Input GET_REPORT; WebHID exposes passive input events and feature reads, no Input GET_REPORT method.
   Firmware may answer onlycontrol polling; actual device event behavior still unknown.
2. Medium: OS output transport/interface/collection behavior differs from Android SET_REPORT; host completion is not DSP processing proof.
   Backend WriteFile does not by itself prove interrupt-out or exactUSB setup on Henry's system.
3. Lower: open-time/late/different-ID/short events missed or rejected by M2F lifecycle. Persistent raw logging now tests this; no earlier wait-time RX line observed.
4. Unproven: firmware timing/state/188 prerequisites or unsupported command. No evidence yet establishes188 accepted/rejected/wrong.
187 padding, coefficient Gain/sign andEQ190 cannot explain the point where this test stopped, since187/190 were never sent.

### Problem / hypothesis / next action
Observed problem:
- Henry回報3次188 host send成功，無matching RX、約2.5秒timeout；187/346/190未送，沒有EQ效果結論。
Verified facts:
- Descriptor gate通過、host接受report；M2F send前listener存在。官方同步GET_REPORT input1與fresh RX已追出，caller policies不同。
- 新DEV頁只inspect/open與手動346；所有input events持續保存，查詢後也不自動改EQ。
Possible causes:
- GET_REPORT-only回應、OS transport差異、遲到／其他ID／short input、未確認的firmwarestate。
Ruled out / weakened:
- 不可把無聽感變化當190失敗；188不是官方fire-and-forget；send後才註冊listener假說排除；parser-alone原因較弱。
Next validation:
- Henry重新連線，確認RAW LISTENER ACTIVE，再按Query current sample rate only (346)一次；逾時後等約2秒保存完整log及counter。
- 首次不按Apply/Restore/90；頁面已移除入口。query取得回應與否都不能自動進190。
Possible fix direction:
- 若有raw inputs，依ID/length/fields定位parser/collection問題；若完全沒有，優先釐清Input GET_REPORT transport能力。
- 若需要native Input GET_REPORT證明，屬後續另外授權的transport實作；本輪不安裝driver、建native helper或改production。

### Scope / regression check
- FreeDSP-specific files: src/freedsp/cafTransportDiagnosis.ts、src/freedsp/debugPage.ts、freedsp-debug.html。
- Analysis/test files: inspect-response.py、cafTransportDiagnosis.test.ts、sourceJSON/evidence.md、synthetic schemaRate346.json。
- Shared files: GENERAL/ROADMAP/DECISIONS/DONE only；shared production runtime NONE。
- Production runtime changed: NO。
- Non-FreeDSP protocol code changed: NO。
- Codex硬體access、EQ/Flash寫入: NONE。

### Research checkpoint — M2G verified delivery
- Examined: complete source trace、20mock/source tests、DEV query-only route、production scope。
- Verified facts: verify.ps1 exit0，12files/114tests及TypeScript/build通過；source12methods重播與保存JSON完全相同。
  直接localhost HTTP200，query handler存在、RAM handler未載入；hidden dev.ps1啟動，沒有HID操作。
- Hypotheses: control GET_REPORT-only回應最符合當前來源與188無matching event，但尚非實機transport capture證明。
- Discarded hypotheses: ignored188/187 return就代表不需要RX；count>=0提供有效錯誤檢查。
- Unresolved fields: Henry346 input result、actualUSB transfer routing/length、July hook；新346 fixture為synthetic，非captured。
- Next search target: Henry一次query346完整raw log/counter；本輪停止，不改gating前進190。

## M2H — official response transport feasibility

### Research checkpoint — hardware record and source audit
- Examined: Henry提供的M2G結果、pinned APK、現有12method完整fixture、CnxtUsbDeviceBase介面選擇。
- Verified facts: 以下硬體結果是Henry回報，非Codex擷取：raw listener在open/send前ACTIVE；346 ID1/data61 host resolved；
  2.5秒timeout，rawTotal=0/newEvents=0，任何ID/長度的inputreport都未到，parser沒有收到資料。
- Verified facts: 12methods重新靜態抽取與保存JSON完全一致；APK SHA25604756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5。
- Hypotheses: firmware只在control GET_REPORT提供回應，最符合來源與本次結果；尚非physical USB capture證明。
- Discarded hypotheses: ACK已到但被parser／ID filter／short filter吞掉、send後才註冊listener，不能解釋本次raw零事件。
- Unresolved fields: DSP是否接受346、實際Windows USB transfer、native GET是否得到回應、July hook。
- Next search target: WebHID Input讀取能力、WebUSB保護及driver條件；不再要求同一WebHID測試。

### Exact official transfer parameters — rechecked bytecode
| Field | SET_REPORT | GET_REPORT |
| --- | --- | --- |
| requestType |0x21 = OUT / class / interface |0xA1 = IN / class / interface |
| request |9 (0x09) |1 (0x01) |
| value |513 = 0x0201 |257 = 0x0101 |
| report type / ID |Output (2) / 1 |Input (1) / 1 |
| index |3 |3 |
| length |TX array.length |fresh RX array.length = TX.length |
| known commands |188/346/190:62; 187:14 |same request capacities |
| per-call timeout |1000ms |1000ms |

sendCmd instruction byte offsets22/26/28/32/38 prove SET constants/call;
110/114/116/120/124 prove GET constants/call. getMsgByCmd SET34/38/40/44/52, initialGET70/74/76/80/86,
repeatedGET152/156/158/162/168. UsbHelper array-length offset0, timeout2, controlTransfer18.
These are buffer/request lengths, not captured successful USB completion lengths. Short187 padding remains unresolved.
Flash helper writeGolemCmdToDevice亦再次靜態核對：SET constants18/22/24/28、call34；fresh RX42，
initial GET46/50/52/56、call60；repeated GET122/126/128/132、call136，沿用相同Output1→Input1/interface3。
RX allocations52/66 are fresh arrays; helper polls replybit with sleep5ms/outer~1000ms, blocking control calls can extend wall time.
The existing JSON contains all these methods, not only selected instructions.

New static check, same APK: CnxtUsbDeviceBase.connectUsbDeviceByApplication()Z:
getInterfaceClass@36 → const3@44/compare46; subclass@50/zero check58; protocol@62/zero check70;
getId@74/compare3@82 selects interface3; claimInterface(interface,true)@152; stores mHidInterface@178.
This proves the official application targets a HID-class interface3, not an arbitrary vendor interface.
No Windows raw configuration was reread; WebUSB metadata visibility of Henry's interface3 is UNKNOWN, but visibility would not permit claiming it.

### Browser and OS capability audit
| API / layer | Capability | Required official operation |
| --- | --- | --- |
|WebHID sendReport |Output write, ID supplied separately; no raw USB setup parameters |Host send possible; exact Windows control route not captured |
|sendFeatureReport |Feature write |Wrong report type for official Output SET |
|receiveFeatureReport |Feature read, not selectable Input type |NO replacement for Input1 GET; no exposed Feature1 here |
|inputreport |Passive delivery of OS input reports |No explicit Input GET_REPORT; M2G observed zero events |
|WebUSB controlTransferIn |Can syntactically express class/interface request1/value0101/index3/length62 |Normal web origin cannot access protected HID interface |
|Windows HidD_GetInputReport |Native user-mode Input report request using existing HID driver |API exists; FreeDSP compatibility/response untested |

WebHID IDL has no receiveInputReport/GetInputReport. Feature1 does not become Input1 by reusing its numeric ID.
Chromium HidConnection::GetFeatureReport checks max_feature_report_size==0 and fails unsupported devices;
Windows PlatformGetFeatureReport uses IOCTL_HID_GET_FEATURE; input path uses ReadFile, output uses WriteFile.
These source snapshots explain the API distinction; they are not a capture of Henry's browser build or physical USB transfers.
Sources: [WebHID §7](https://hid.spec.whatwg.org/#hiddevice-interface),
[Chromium feature validation](https://chromium.googlesource.com/chromium/src/+/cc44e4fee54dcf1125de9f0f302aa79b84d4220e/services/device/hid/hid_connection.cc),
[Chromium Windows backend](https://chromium.googlesource.com/chromium/src/+/96d204c5f08ced3357eb964d7b1dffa8ebd652b9/services/device/hid/hid_connection_win.cc).

### WebUSB / hybrid decision — NOT FEASIBLE for normal Windows Chrome
Chromium exposes navigator.usb subject to secure context/policy; filters can express vendorId0x35D8/productId0x1496.
getDevices returns already-authorized devices; requestDevice requires user action. Neither selection nor visible configuration proves access.
WebUSB protects HID0x03 and Audio0x01. claimInterface rejects protected classes; class control setup checks the interface selected by wIndex,
and recipient=interface also requires that interface claimed. Endpoint0 does not bypass these checks.
Exact official GET cannot be sent by borrowing WebHID permission/handle, opening a different interface, or skipping claim.
Duplicate handles and cross-API ownership would be further OS concerns, not solutions to this prior security barrier.
Changing recipient to device or inventing a vendor request is not reproduction of official A1/01/0101/3 and is unsupported.
Sources: [WebUSB §§6.1/6.2/6.4/8.1](https://usb.spec.whatwg.org/),
[Chromium protected class policy](https://chromium.googlesource.com/chromium/src/+/3752c3d7bd3dc15f094cc57f2b2f2f26e8d6ea01/chrome/browser/usb/web_usb_service_impl.cc).

Windows WebUSB separately needs a usable WinUSB driver binding; existing HID/audio class drivers are not generic WebUSB ownership.
Replacing only HID's driver may preserve separate audio functionality but removes normal HID/WebHID access; replacing audio/parent can break audio.
Even HID→WinUSB replacement does not change bInterfaceClass3 or remove browser protection, so classification remains NOT FEASIBLE,
not FEASIBLE WITH UNACCEPTABLE DRIVER CHANGE. No Zadig/driver replacement is recommended or performed.
A separate vendor-class function, if one existed, would not authorize requests to protected interface3; no alternate FreeDSP protocol is evidenced.
Source: [Chrome device/Windows driver requirements](https://developer.chrome.com/docs/capabilities/build-for-webusb).
Privileged usb-unrestricted is an explicit Isolated Web App manifest exception. It is outside ordinary localhost Chrome deployment,
not a normal Permissions-Policy opt-in; platform/browser privilege plus Windows binding would need separate investigation.
This conclusion does not claim every privileged browser package or future firmware is universally incapable.

### Response necessity, sample rate and transport choices
Official helper polls Input GET for188/187/190/Flash220; ignoring its bool is distinct from firmware not needing GET.
Whether these mutations apply without GET is UNKNOWN. A query346, however, needs returned data: no response means no verified current index.
The source path reads word1 and failure−1001, not a cached OS rate. Flash also requires separate persistence evidence, not merely host completion.
| Option | Technically possible | Missing proof / reliability | Truthful Sync Complete? |
| --- | --- | --- | --- |
|A strict official SET→Input GET |Not in normal pure browser; native API candidate |Device compatibility, actual completion, matching command result |Only after defined result verification; not from host write |
|B WebHID write-only mutations |Host write API exists |Mutation application/prerequisites/current bank unknown; no official response |NO; Host write sent / acceptance unverified only |
|C cached/manual OS rate |Can retain a hint |May be stale, different route/player/exclusive mode; no CAF index proof |NO |
|D AudioContext/MediaDevices rate |Context/capture settings accessible |Processing/capture rate need not be active FreeDSP output clock |NO; not safe346 replacement |
|E full WebUSB / hybrid |Setup syntax exists; protected interface blocked |Normal Windows Chrome access fails before transfer |NO; NOT FEASIBLE |

Web Audio's default rate uses selected/default output-device information, but an explicitly different context rate must be resampled.
That is not an authoritative CAF DSP clock query, including while another application owns playback or OS resamples.
MediaDevices enumerates devices; capture track settings/capabilities are not current playback hardware rate (capture may also be processed).
No reviewed browser API exposes the required FreeDSP CAF active sample-rate selector. These sources cannot safely replace346.
Sources: [Web Audio AudioContext options](https://www.w3.org/TR/webaudio/#AudioContextOptions),
[Media Capture sources/settings](https://www.w3.org/TR/mediacapture-streams/#the-model-sources-sinks-constraints-and-settings).

Recommended future architecture: existing Windows HID driver + native companion/local bridge using HidD_GetInputReport,
one owner serializing SET→GET and recording actual completion/raw CAF fields, browser remaining UI. Native response still needs proof.
Do not split WebHID writer/native reader by assumption: handle sharing/concurrency is untested. Do not install/build helper this round.
Windows API buffer begins with ID1; allocate capability-defined InputReportByteLength (expected62 for ID1+61), verify actual collection.
Source: [HidD_GetInputReport](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_getinputreport).
WebSerial has no established CDC/serial endpoint; not a supported alternative. Upstream pure-web support requires a supported response mechanism,
or explicitly unverified writes; firmware/vendor interface changes are outside original-device evidence.

### Failed approaches / retry policy
| Attempt | Exact result | Why failed / unsupported | Retry? |
| --- | --- | --- | --- |
|M2F WebHID188 ACK gating:2Apply+1Restore |Host sent; ~2.5s timeout, no matching RX;187/346/190 never sent |Official GET response not observed; no complete all-event counter then |Do not retry unchanged |
|M2G persistent raw346 |Listener beforeopen/send; host resolved;2.5s/rawTotal0/newEvents0 |No input event, so parser has nothing; passive events do not reproduce official control polling |Do not retry unchanged |
|Feature GET instead of Input GET |Source/API audit only; not sent |Wrong type, no Feature1; missing Input API |NO |
|WebUSB/full or hybrid |Source/API audit only; not attempted |Protected HID and Windows driver boundary |NO browser test this round |
|Use browser/OS rate as346 |Source audit only; not implemented |Rate hints do not verify active DSP bank |NO as verified replacement |

### Problem / hypothesis / next action
Observed problem:
- WebHID346 host送出成功，rawTotal=0/newEvents=0，2.5秒逾時；沒有parser輸入。
Verified facts:
- Henry listener在open/send前active；官方用Input GET_REPORT control transfer；普通WebHID沒有此方法。
- 官方interface3為HID class；一般WebUSB受保護class及claim檢查阻擋，Feature不是Input。
Possible causes:
- 最符合證據：firmware以control GET回應而不主動送event；另有Windows output route/state/firmware因素尚未排除。
Ruled out / weakened:
- ACK被parser丟掉、晚註冊、ID filter、short input discarded不能解釋本次raw零；不以timeout判DSP拒絕。
- WinUSB換driver、hybrid借handle、endpoint0免claim、AudioContext等於DAC clock均不能成立為正常網頁替代方案。
Next validation:
- 本輪沒有手動測試。下一個另行授權的native transport round才考慮一次read-only346 SET→Input GET，
  記錄完成長度/raw bytes及matching CAF current-rate index，不送188/187/190/90/220；尚未實作或要求Henry執行。
Possible fix direction:
- Native companion/local bridge重現可驗證回應；production成功語義依D026改成host/response/readback分層，另輪才實作。
- 保留write-only為明確unverified能力，不用timeout繞過gating，不盲選rate或進Flash。

### Research checkpoint — capability synthesis
- Examined: current WebHID/WebUSB/Web Audio/Media Capture規格、Chromium source、Windows HID API及Chrome driver文件。
- Verified facts: ordinary Windows Chrome無Input GET API、protected HID使WebUSB及hybrid不可行；IWA是有條件例外。
- Hypotheses: native existing-HID-driver path可重現官方reply，尚未測裝置；mutation是否必須GET未知。
- Discarded hypotheses: Feature1替Input1、換driver即解除browser保護、context rate可當CAF active bank。
- Unresolved fields: native response/actual Windows transfers、187short adaptation、July hook、RAM/audio/persistence。
- Next search target: 後續另輪native只讀query proof；Case C，M2H停止，不新增diagnostic/code/docs files。

### Scope / regression check
- FreeDSP-specific code / analysis / tests changed: NONE。
- Shared runtime files changed: NONE。
- Documentation: GENERAL/ROADMAP/DECISIONS/DONE only；New documentation files created: NO。
- Production runtime changed: NO；Non-FreeDSP protocol code changed: NO；hardware access/writes: NONE。

### Research checkpoint — M2H verified delivery
- Examined: final four-doc diff、既有全部offline tests、TypeScript/production build、scope。
- Verified facts: verify.ps1 exit0；12files/114tests全部通過，TypeScript/build/test typecheck通過。
  12method pinned static replay相同；Flash helper response branch亦重新核對；無新增測試或synthetic成功資料。
- Hypotheses: native FreeDSP相容性未測，仍不是已完成硬體proof。
- Discarded hypotheses: 以build/test通過當作HID response或可聽EQ成功。
- Unresolved fields: actual device Input GET result、native completion、RAM/audio/persistence；不延伸本輪。
- Next search target: 停止M2H，等待Henry下一輪指示；本輪No manual test required this round。

## M2I — Windows native CAF346 query

### Research checkpoint — native implementation / offline validation
- Examined: Microsoft HID/SetupAPI/ReportID docs、本機SDK10.0.401、既有官方serializer及346 sample-rate來源。
- Verified facts: 已建立獨立C#/.NET10 console與query script，零外部套件；native build零warning/error，22項native offline tests通過。
- Verified facts: verify.ps1 exit0，13files/118tests通過；新4tests包含native golden與既有WebHID helper/data逐byte相同及production/CLI scope。
- Hypotheses: native state GET能取得官方回應；尚未探索/開啟裝置或執行Query346。
- Discarded hypotheses: host SET success可以當DSP acceptance、mock回應可以當實機proof。
- Unresolved fields: Windows caps/path/access實值、兩個API實際結果、matching CAF346、USB completion/setup。
- Next search target: Henry只執行一次query script並貼完整output；本輪不進EQ/Flash/production。

### Native helper and discovery
- tools/freedsp-native/FreeDspQuery.csproj，net10.0，no PackageReference，NuGet.Config清空sources；bin/obj局部ignore。
- SetupDiGetClassDevs/EnumDeviceInterfaces/GetDeviceInterfaceDetail列出HID；matching path先按35D8/1496篩選，
  access0 metadata handle用HidD_GetAttributes確認VID/PID，用HidD_GetPreparsedData/HidP_GetCaps讀usage與report lengths。
- 不取第一項：usagePage0x0C/usage1、MI_03與input/output62唯一才接受；不能讀取任一matching path也停止，避免未識別第二CAF。
- Windows path MI_03是USB interface number的保守識別；若driver不提供此標記就停止並保留paths，不依caps盲猜其他介面。
- HidP_InitializeReportForID在preparsed data本機核對Input1/Output1；不送任何USB command。
- 查詢handle固定GENERIC_READ|GENERIC_WRITE(0xC0000000)、shareREAD|WRITE(3)、OPEN_EXISTING(3)、同步flags0；再核對caps/identity。
- 不需要driver replacement或admin；實際permission/open仍PENDING。失敗時保留Win32Error，不換access/driver或試第二path。

### Fixed outgoing report and state APIs
Native62 = report ID1 + WebHID61，command346/count13/moduleB32D2300/words [62,0×12]。
完整TX（離線golden，非hardware capture）：
```text
01 00 0d 00 5a 01 00 23 2d b3 3e 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00
```
- SET: HidD_SetOutputReport(handle, tx, caps.OutputReportByteLength)，本輪gate要求62。
- GET: SET Boolean success後立即一次HidD_GetInputReport(handle, freshRX, caps.InputReportByteLength)，本輪要求62、RX[0]=1其餘0。
- 不用WriteFile、Feature GET或官方polling loop。這是Windows state report IOCTL API，USB transport由driver處理；
  沒有擷取Henry的USB setup，不能把API成功等同exact request params已在實體匯流排確認。
- 兩者只有Boolean/GetLastError及buffer，沒有timeout參數或actual byte-count。30s watchdog只限制childprocess，
  timeout標completion UNKNOWN，不宣稱DSP拒絕或driver transaction已取消。每個API呼叫前flush logs。
- CLI args僅query346；Native SET exact-buffer guard阻止其他TX，one SET/one GET，沒有mutation或retry入口。
Sources: [SET output](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_setoutputreport)、
[GET input](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_getinputreport)、
[HID caps](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/ns-hidpi-_hidp_caps)、
[ID validation](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_initializereportforid)。

### Response classification
| Result | Conditions / evidence limit |
| --- | --- |
|VALID CAF346 RESPONSE |SET andGET true; ID1/prefix0/reply1/command346/CTRL/count2..13；word1 present |
|GET_INPUT_REPORT SUCCEEDED BUT RESPONSE UNEXPECTED |GET true但header/count/identity不符；raw及capacity words保留，不稱DSP拒絕 |
|GET_INPUT_REPORT FAILED |GET false，保存error及buffer；failed buffer不當confirmed RX解析 |
|DEVICE OPEN / ACCESS FAILED |metadata、ambiguous collection、caps/ID gate或CreateFile失敗；沒有query |
|HOST SET_REPORT FAILED |SET false；GET NOT ATTEMPTED，另列prerequisite failure，避免誤判GET/open |
|NATIVE CALL TIMEOUT / COMPLETION UNKNOWN |launcher30s時限，終止其child；無額外query |

Parser：ID@0、prefix high@1、packed LE32@2（count U16、command bits16..30、reply31）、module@6、signedwords@10。
官方getCurSampleRate讀word1/full bufferoffset14；index4/5/6/7/8→44100/48000/96000/192000/384000。
未知index仍保存matching CAF transport且Hz UNKNOWN，不猜48000；valid query不證可用EQ bank或音訊效果。
實際346 reply count未captured。count>=2是比官方capacity-word讀取更嚴格的完整logical response要求，count0亦會保存fullraw供分析。
API success/RX buffer長度不提供actual transfer completeness或Flash/RAM成功；failed SET不是DSP rejection證明。

### Permanent failed-approach history
| Round | Attempt / result | Retry policy |
| --- | --- | --- |
|M2F |WebHID188 host success→timeout；190未達到 |不原樣重試 |
|M2G |WebHID346 persistent raw listener→host success，rawTotal0/newEvents0 |沒有parser input；不原樣重試 |
|M2H |WebUSB/hybrid source audit→normalChrome protected-interface path不實用 |不當正常部署方案、不換driver |
|M2I |Native346 implementation/build/mock ready |PENDING HENRY HARDWARE RESULT；本輪只一次query |

### Problem / hypothesis / next action
Observed problem:
- WebHID host成功而raw零輸入；官方使用browser未提供的Input GET。Native硬體結果尚未取得。
Verified facts:
- Query-only native helper已建置、22native tests與118project tests通過；沒有Codex device access、production或其他protocol變更。
- 已保留M2F/G/H結果，不能把parser更改或host send當作解決傳輸問題。
Possible causes:
- 若native失敗，暫定依實際stage/error排序：①state GET/SET支援或driver路徑差異；②handle權限/分享衝突；
  ③collection/caps映射不符（gate先阻止）；④single GET取得未ready/stale response，官方則會poll；⑤firmware/source版本或狀態差異。
- 尚無native failure觀測；不能先判是哪一項，實際Win32Error/raw reply才決定下一步。
Ruled out / weakened:
- WebHID parser漏ACK解釋本次零事件、Feature讀取替代、一般WebUSB hybrid、離線mock證明實機接受均不成立。
Next validation:
- Henry執行下方script一次，貼從build/header到RESULT的完整output，包含paths/caps/access/TX/SET/GET/errors/RX/parsed。
- 成功只成立native query transport；失敗停止，不改driver、不試多個排列組合，不前進190。
Possible fix direction:
- 若matching response成立，另輪才評估native bridge與production成功語義；若失敗依error/source追查，不在本輪重試或猜封包。

### Henry manual test — one query only
已安裝.NET10 SDK；script自動build，不需Git或admin。程式不需dev server。
```powershell
cd D:\Henry\Documents\ChatGPT\AuraPEQ
.\scripts\query-freedsp-native.ps1
```
貼完整output，不只RESULT。成功需同時看到HOST SET_REPORT SUCCESS、GET_INPUT_REPORT SUCCESS、VALID CAF346 RESPONSE，
以及command346/reply1/moduleB32D2300/word1 raw index；unknown index不假冒已知Hz。
Current milestone: M2I — Windows native CAF346 transport proof，implementation READY / hardware PENDING。STOP。

### Scope / regression check
- FreeDSP-specific native code: tools/freedsp-native/*.cs、project/config/ignore；scripts/query-freedsp-native.ps1。
- Tests: tools/freedsp-native/Tests/、tests/freedsp/nativeQueryScope.test.ts。
- Shared runtime files changed: NONE；Production runtime changed: NO；Non-FreeDSP protocol changed: NO。
- Documentation files: GENERAL/ROADMAP/DECISIONS/DONE only；New documentation files created: NO。
- Codex hardware access/RAM/Flash writes: NONE。

### Research checkpoint — M2I verified handoff
- Examined: final code/docs scope、nativebuild/22mock tests、完整verify13files/118tests、PowerShell syntax與launcher離線probe。
- Verified facts: 兩個build及全部tests通過；PowerShell逐行轉送stdout/stderr，用非法CLI argument測到usage/exit2且沒有HID探索。
  三個generated tracked dist已還原；production source/runtime/config無差異，git diff --check通過；new .md NONE。
- Hypotheses: native state346回應相容性仍未測，沒有mock或host成功冒充hardware proof。
- Discarded hypotheses: 子程序hidden就能保證Console輸出直接可見；已以explicit redirected log pump處理。
- Unresolved fields: PENDING HENRY HARDWARE RESULT；native paths/caps/SET/GET/CAF需實機output。
- Next search target: Henry一次script完整output；STOP，不進RAM190/production或自動retry。

## M2J — synchronized native CAF query

### Research checkpoint — M2I result and official control flow
- Examined: Henry的M2I實機摘要、current native code、pinned APK getMsgByCmd/isExecuteSuccess/getCurSampleRate、Microsoft state-report docs。
- Verified facts: Henry一次實測SET346/GET各success/error0；CAF188 header與logicalword1筆有效。2matching paths，MI03 col01/usage0C1/input/output62/feature0。
- Verified facts: source12methods本輪重新抽取與fixture相同；官方initialGET不是無條件discard，ANY replybit1即return，沒有command匹配。
- Hypotheses: retained/current188與新reply尚未ready最合理，但holder/producer/queue模型未確認。
- Discarded hypotheses: native transport全失敗、CAF188結構invalid、官方會自動略過188直到346。
- Unresolved fields: matching346、completeRX尾部/fullWindows path、188來源與持有者、actualUSB setup。
- Next search target: 在oneSET後用source時間bound做matching診斷poll；不送mutation或重複SET。

### M2I verified facts / proof levels
Henry-reported，非Codex硬體擷取：
- Native device discovery成功，two matching HID paths，唯一CAF目標MI_03 col01、usagePage000C/usage0001。
- Windows caps input62/output62/feature0；native report buffer含ID1。
- SET346返回true/Win32Error0；GET返回true/Win32Error0。
- 已提供RX prefix14bytes：01 00 01 00 bc 80 00 23 2d b3 01 00 00 00。
  packed80BC0001 → command188/reply1/count1，moduleB32D2300，word0=1。
- 此回應是structurally VALID CAF NON-MATCH，不是INVALID CAF或GET failure。完整尾部未提供，不能以零padding假冒capture。
- Level1 NATIVE HID TRANSPORT VERIFIED（API層bidirectional CAF觀測）；Level2 CAF346 QUERY NOT YET VERIFIED；Level3 RAM/EQ NOT VERIFIED。
- 無論188來源如何，M2I沒有matching346證據；不判host SET346等於DSP接受346，也不抹掉已成立的Level1。

### Why188 first? — ranked hypotheses, not findings
| Rank / hypothesis | Evidence supporting | Unresolved / discrimination | Confidence |
| --- | --- | --- | --- |
|1 C/A/F: current/retained188 snapshot，346尚未ready；device可能保留last reply |GetInputReport是state API；188有效而346剛送；官方也有GET/sleep輪詢 |單樣本不能判holder或producer；188→346也可能只是延遲更新，非FIFO |MEDIUM |
|2 D: SET346未產生新response（未處理/不支持/仍pending） |Host success不是DSP acceptance；只有188 |持續188不能區分pending/拒絕/未產生；matching346會削弱此假說 |MEDIUM |
|3 B: device response queue，firstGET取older188 |單次188與舊命令歷史相容 |沒有consume/order/depth證據；stateAPI不保證FIFO；多GET出現不同命令亦未必queue |LOW/MEDIUM |
|4 E: Windows HID cached/staged older state |Windows driver位於中間層，尚無actualUSB capture |沒有本機cache來源證據；不能把ReadFile ring-buffer規則套給GetInputReport |LOW |
|A的來源特定推論: exactly M2F188留下的reply |已知M2F曾送188；現在看到188 |沒有timestamp/transaction關聯，亦未排除其他producer；只算相容，不算歸因確認 |UNKNOWN |

Microsoft將HidD_GetInputReport用於current state；ReadFile/ring buffer的FIFO描述是不同路徑。
這削弱「原生GET必定consumes FIFO」推論，但不禁止vendor firmware自行queue。
Sources: [state vs read](https://learn.microsoft.com/en-us/windows-hardware/drivers/hid/obtaining-hid-reports)、
[Input report API](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_getinputreport)。

### Exact official346 polling — full bytecode trace
| Stage / instruction offsets | Verified behavior |
| --- | --- |
|getCurSampleRate0..40 |13long words[62,0×12]，command346，CTRL，reportID1，呼叫getMsgByCmd |
|getMsgByCmd52 |SET_REPORT一次，無loop resend |
|66..86 |分配一次freshRX，initialGET一次；之後poll沿用同RX |
|98..116 |initialGET完成後才建立wallclock起點，elapsed設0 |
|120..136 |先讀RX[5]bit7；等於1立即return254，firstGET不會無條件丟棄 |
|140..148 |若無reply，elapsed>=1000則return；沒有固定attemptcount |
|152..168 |時間未到則repeatGET一次，firstrepeat前沒有sleep |
|194..198 |每個repeatGET之後sleep5ms，包括之後發現reply那次 |
|216..252 |重算elapsed，再回到先reply後deadline的loop |
|UsbHelper0/2/18 |length=array.length，每個Android controlTransfer timeout1000ms；會超過outerwalltime |
|isExecuteSuccess8..42 |nonnull、replybit1、countU16>=0（冗餘），不比command/module或有效logicalword數 |
|getCurSampleRate48..90 |helper success後讀fullbufferoffset14/word1；failure−1001；不辨188或驗count>=2 |

因此官方收到本次188/reply1會立刻退出，不繼續等346；若caller認success，就讀capacityword1，並非188的logicalpayload。
沒有證據支持「官方丟firstGET」「固定N次」「nonmatch就reSET」或「官方檢查command/module」。
source：tests/freedsp/fixtures/officialResponseStaticEvidence.json完整instruction arrays，本輪靜態replay相同。

### Native synchronized flow / explicit differences
Original M2I: strict346 parser將188一起判invalid，oneGET立即停。
Updated M2J: genericCAF structural Valid與Matching346分開；oneSET→initialGET→startouter1000ms→
若未matching且未deadline，repeatGET→sleep5ms→檢查matching/deadline。每次header/raw/logicalwords/classification皆記錄。
每個GET標MATCHING CAF346／VALID CAF NON-MATCH／INVALID CAF／GET FAILED；188明列，不藏掉。
Match須ID1/prefix0/CTRL/reply1/command346/count2..13；word1（offset14）與mapping4..8不變，unknownHz不fallback。
明確不同於官方：
- stop條件增加matching346；source遇188會停，本診斷會在sourcebound內繼續。這是Henry要求的query修正，非source原樣。
- NativeGET false立刻停，不延續官方ignored return；保存attempt/error/fullbuffer，但不當confirmed response解析。
- 每GET用freshzeroed RX+ID1；官方reuseRX。本機避免carryover，無更改requestID/length或TX。
- 使用monotonic Stopwatch；Windows HidD沒有per-call1000ms，30slauncherwatchdog只是另層process限制。
沒有CLI tuning、不增加任意命令、沒有reSET、mutation/driver/production changes。沒有固定attempt上限；bound是官方1000ms。
理想mock zero-durationGET時最多initial1+200repeats（5ms×200），這是測試推導，不是官方fixed count或實機預期。
已在期限內開始的nativeGET可能晚回；若matching，reply判斷先於下次deadline，如source，不能宣稱API耗時一定<=1s。
持續相同188至bound標appears retained/stale，停止；不判FIFO、不繼續hammer。188→346僅支持bounded同步有效／立即oneGET不足。

### Failed approach history — current interpretation
| Round | Attempt / observed result | Next policy |
| --- | --- | --- |
|M2F |WebHID188 hostsuccess→timeout，190未送 |不原樣重試；本次188不能確定歸因M2F |
|M2G |WebHID346 persistent rawlistener→hostsuccess/rawTotal0/newEvents0 |無parser input；不原樣重試 |
|M2H |普通Chrome WebUSB/hybrid保護限制 |不當正常deployment，不換driver |
|M2I |NativeSET346 success＋GETsuccess＋validCAF188 |Level1 VERIFIED，oneGET insufficient for matching346；非transport failure |
|M2J |Bounded matching GET implementation，oneSET |HARDWARE PENDING，Henry只執行一次，不進190 |

### Problem / hypothesis / next action
Observed problem:
- NativeGET有有效CAF188，但沒有matching346；原本oneGET立即停。
Verified facts:
- Level1成立；官方replybit-only，first188亦會返回；1000msouterbound/5mspostGET/oneSET已追證。
Possible causes:
- retained/currentreply與新回應延遲；新346未產生；devicequeue或Windowsstaging。排序見表，沒有一項已被確認。
Ruled out / weakened:
- native GET全失敗、188結構無效、官方必定匹配346、單樣本FIFO、hostsuccess等於DSP接受346。
Next validation:
- Henry同一script只執行一次，貼所有GET #N/raw/parse/classifications與finalRESULT；不需localhost/listening/EQ/Git。
- 若188→346，確認Level2並保留時序；若identical188或error，停止並分析實際attempt/Win32Error，不自動改封包或重試。
Possible fix direction:
- 若Level2成立，下一輪再評估其他command的matching與nativebridge；本輪不進RAM190或production。

### Research checkpoint — synchronized implementation
- Examined: nativegenericCAF/parser、oneSET boundedrunner、sourcepolicy regressiontest、fake-clock cases。
- Verified facts: nativebuild0warnings/0errors；30offline tests通過，包括188→346、severalnonmatches、all188/deadline、invalid/failure、known/unknownrate、oneSET。
- Hypotheses: hardware同步是否取得346尚未知；tests全為synthetic/mock，不新增fake hardware capture。
- Discarded hypotheses: generalCAF Valid必須command346/count>=2；M2I nonmatch可直接叫transport failure。
- Unresolved fields: Level2 matching346與response origin；Level3RAM/EQ。
- Next search target: finalverify/scope/Git後停止，等待Henry一次M2Joutput。

### Research checkpoint — M2J verified handoff
- Examined: final nativediff、30fake-clock/mock tests、13files/119project tests、source12methods replay及scope。
- Verified facts: verify.ps1 exit0、nativebuild零warning/error、所有tests通過；git diff --check通過，tracked dist已還原。
- Hypotheses: M2J同步是否返回346尚未實測，queue/snapshot origin仍UNKNOWN。
- Discarded hypotheses: 將official reply-only stop命名為command matching；將mock188→346序列當hardware evidence。
- Unresolved fields: Level2 CAF346 pending；Level3 RAM/EQ untouched；完整M2I RX/path未提供。
- Next search target: commit/push後STOP，Henry執行一次現有query script並貼所有GET，不要求localhost/listening/Git。

### Scope / regression check
- FreeDSP native code: Caf346.cs、Query346.cs、Program.cs；tests: nativeTests/Program.cs、nativeQueryScope.test.ts。
- Shared runtime files changed: NONE；Production runtime changed: NO；Non-FreeDSP protocol code changed: NO。
- Documentation: GENERAL/ROADMAP/DECISIONS/DONE only；New documentation files created: NO。
- CLI硬體TX仍只有346，SET一次；Codex硬體操作/EQ/Flash writes: NONE。

## M2K — first native RAM190 hardware proof (PENDING HENRY TEST)
### Research checkpoint — M2J record and final source trace
- Examined: Henry M2J output；pinned response/ram static instruction fixtures；Microsoft API contract；hidapi Windows state-output adapter。
- Verified facts: native SET/GET success/error0；matching346在GET#1，reply1/count13/CTRL、words=[62,5,0,32,0,0,0,0,0,0,0,0,0]；當時48k。
- Verified facts: Level1 transport及Level2 query成立；188 count13[1,0x12] logical62，187 count1[0] logical14，346 count13[62,0x12] logical62，190 count13 logical62。
- Verified facts: 各command都GET；188/187/190 sendCmd僅replybit成功bool，188存flag、187忽略bool、190返回bool；346 getMsgByCmd initialGET後才計outer1000ms。
- Hypotheses: Windows padded187是否可被firmware接受、RAM190是否進active bank仍未驗證。
- Discarded hypotheses: 本次M2J證明需要多GET；CAF ACK即audio proof；caps62本身證明14byte padding等價。
- Unresolved fields: 187 firmware length interpretation；最終quantizer1LSB；Level3 audible EQ。
- Next search target: fixed nativeApply/Restore mock tests、verify、scope/Git；Henry一次controlled test。

### Official / native sequence comparison
|Command|Official payload / full logical length|Official response handling|M2K adapter|
|---|---|---|---|
|188|count13 [1,0x12],62|SET/GET, bool stored enabled flag; called if flag false|Each new process sends once; matching188 mandatory|
|187|count1 [0],14|SET/GET requested14, bool ignored|SET62=prefix14+48zero, GET62, matching187 mandatory|
|346|count13 [62,0x12],62|SET/initialGET/outer1000ms, reply-only; word1 at14|matching346/count>=2, knownindex4..8 only|
|190|count13 [0,5,Gain,B0,B1,B2,A0,A1,0x5],62|SET/GET, bool returned|matching190 mandatory; no90/220 appended|
sendCmd startsouterclock beforeinitialGET and sleeps5 aftereachGET；query346 startsclock afterinitialGET, repeatsGET then sleeps5。
M2K bounded synchronization follows this distinction, with M2J diagnostic matching/freshRX/failfast improvements, oneSET percommand。
API無percalltimeout；30s processwatchdog completionUNKNOWN。無transactionID，只matchingcommand不能單獨證明responsefreshness。
No return-word status definition has been proven; no invented status interpretation added.

### Command187 length gate
已在硬體執行前完成research：[Microsoft](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_setoutputreport)
要求ReportBufferLength=OutputReportByteLength；[hidapi Windows source](https://github.com/libusb/hidapi/blob/master/windows/hid.c)
hid_send_output_report明確說短於caps會ERROR_INVALID_PARAMETER，且實作memcpy+zero-pad後HidD_SetOutputReport。
依Henry的API-required exception採用Windows62 adapter，logical14/count1 unchanged，prefix=01 00 01 00 bb 00 00 23 2d b3 00 00 00 00。
不將14byte request直接試送、不猜driverfallback；此非bit-for-bit Android USB transaction。Firmware compatibility PENDING；187 nonmatch/error禁止190。

### Test / restore coefficients
Apply: PK400Hz/-12dB/Q1, SDK0→wire5,selector0,currentrate only; gainRaw=-3072,qRaw=256,precision24。
48k float32 [B0,B1,B2,A0,A1]=[0.9628257155418396,-1.8981064558029175,0.9378855228424072,1.8981064558029175,-0.9007112979888916]。
e=1,Gain=3,scale=4194304; nearest integers=[4038384,-7961235,3933777,7961236,-3777857]。
Payload=[0,5,3,4038384,-7961235,3933777,7961236,-3777857,0,0,0,0,0]。不是globalpreamp，預期400Hz低中頻/body/warmth減少，不是overall-12dB。
Restore: official flat floats=[1,0,0,0,0],e=1,Gain3,scale4194304,words=[4194304,0,0,0,0]。
Restore payload=[0,5,3,4194304,0,0,0,0,0,0,0,0,0]，只flat testedband，不restoreallpreviousEQ。
兩者都188→matchingGET→187→matchingGET→346→matchingknownrate→calculate→190→matchingGET；no90/Flash。
Final native quantizer 的 32 個候選選擇未重建；nearest 模型仍1LSB uncertainty，不宣稱bitexact。signed24/stability guards皆必須通過。

## Evidence for upstream / Issue #3
M2K update: native collection MI_03/col01 usagePage0C/usage1 input/output62feature0，reportID1；descriptor為61data bytes另加ID。
Henry M2J native SET346/GET成功error0，GET#1 matching346/reply1/count13/CTRL B32D2300；words=[62,5,0,32,0,0,0,0,0,0,0,0]，index5→48k。
WebHID raw input缺席不能用來否定DSP產生回應；native stateGET可取得matchingreply，但未證明所有browserfailure的單一firmware原因。
Pinned APK SHA04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5：Freeman3 path188→187→346→190，noautomatic90。
Native Windows適配必須將187logical14補至API62，count維持1；有Microsoft/hidapi依據，firmware接受尚待matching187。
RAM190 selector0/sdkband+5/dynamicGain/feedback符號已有static evidence；production尚未integrate，native1LSB finalquantizer未知。
M2K可供Henry單bandcontrolledApply/Restore，Level3 RAM/audible result PENDING；ACK不能證明audioeffect或Flashpersistence。

### Failed approach history — M2K update
M2F WebHID188 timeout，190未送；M2G WebHID346 hostsuccess/rawTotal0；M2H正常WindowsChrome GET替代不可行。
M2I native valid188 nonmatch→Level1verified；M2J matching346GET#1→Level2verified/48k；M2K nativeRAM190→PENDING HENRY TEST。

### Problem / hypothesis / next action
Observed problem:
- Native CAF346 works；RAM190/audible EQ及Restore尚未驗證，既有Sync Complete不能證明EQ已作用。
Verified facts:
- Level1/2 hardware verified；official188/187/346/190 schema已trace；187Windows API length requirement已查證；無Codex硬體寫入。
Possible causes:
- Browser receive API、enable/bypass、RAM bank、band/coefficient/activation semantics；只有transport/query部分已縮小問題。
Ruled out / weakened:
- 原生CAF完全不可用、346無reply、190ACK必等於EQ效果、每次盲用48k、zeroallcoefficients可當flat。
Next validation:
- Henry照ear-safety順序Apply一次；error停貼log不聽不retry；success無異常才低volume聽，再Restore一次，同曲同volume。
- 回報兩份完整logs與Apply obvious/subtle/nochange/abnormal、Restore returned/partial/nochange/abnormal。
Possible fix direction:
- 僅在protocol及audible/restore證據成立後另輪評估production；成功無聽感先查enable/bank/mapping/90，不增加attenuation/bands。

### Research checkpoint — M2K automated handoff
- Examined: complete native diff、fixed PS launchers、official APK static replay、40 native mock tests、14files/122 project tests、final scope。
- Verified facts: native build0warnings/0errors、40offline tests、verify.ps1 exit0、TypeScript/Vite/testtypecheck及122tests通過；PS三scripts語法通過。
- Verified facts: pinned APK12method replay與保存fixture完全一致；非法CLI在探索前拒絕；48k coefficient response離線400Hz為約-11.99998dB。
- Hypotheses: 187 padded representation firmware接受及Level3 audible effect仍PENDING；本輪沒有任何Codex hardware access。
- Discarded hypotheses: 用allzero coefficients當flat、ACK等於audioproof、queryfailure可fallback48k、sharedruntime是本輪必要變更。
- Unresolved fields: hardware187/190 matching及Apply/Restore聽感；nativefinal1LSB optimum、samecommandreplyfreshness。
- Next search target: intendedfiles commit/push後STOP；Henry一次Apply/Restore，依protocol gate及ear-safety回報。

### Scope / regression check
- FreeDSP-specific code: tools/freedsp-native/SafeRam.cs、NativeHid.cs、Program.cs。
- Native diagnostic scripts: apply-freedsp-native-safe-test.ps1、restore-freedsp-native-safe-test.ps1；existingqueryscript未改。
- Offline tests: native Tests/Program.cs、nativeQueryScope.test.ts、nativeSafeRamScope.test.ts。
- Shared runtime changed: NONE；Production runtime changed: NO；Non-FreeDSP protocol code changed: NO。
- Documentation: GENERAL/ROADMAP/DECISIONS/DONE only；New documentation files created: NO。
- verify產生的tracked dist已還原，只保留本輪intendedfiles；git diff --check通過。M2K hardware PENDING。

## 2026-10-07 — M2K real hardware result (Henry report)
VERIFIED: native bidirectional CAF transport、188 matching、Windows padded187 accepted、matching346 index5=48k、matchingRAM190。
SDK0→wire5 Apply PK400Hz/-12dB/Q1/selector0 有清楚可聽變化；同band unity Restore 有清楚可聽恢復。
Apply與Restore的190均觀察firstGET reply0→secondGET reply1；bounded GET justified，無reSET。
Henry描述air/ambience/reverberation減少，但未能定位400Hz；不聲稱tonal accuracy、bitexact、其他bands、九band、Flash或globalpreamp已驗證。
M2K SINGLE-BAND RAM AUDIO EFFECT / WIRE5 APPLY-RESTORE VERIFIED。
M2L開始：wire6–9 HARDWARE VALIDATION PENDING；Codex僅離線實作，不做實體測試。

## M2L — remaining official live-band validation
Implementation READY / HARDWARE VALIDATION PENDING。
|SDK band|Wire band|Current hardware status|
|---|---|---|
|0|5|VERIFIED M2K: matching protocol＋audible Apply/reversal|
|1|6|PENDING HENRY|
|2|7|PENDING HENRY|
|3|8|PENDING HENRY|
|4|9|PENDING HENRY|
控制變數只有wireband，固定PK400Hz/-12dB/Q1、selector0、M2K coefficient/current346rate/nativepath。
順序wire6 Apply→listen→wire6 Restore→confirm、wire7同樣、wire8同樣、wire9同樣；不重測wire5、不中途累積、不進unknownSDK5..8。
New entry: scripts/test-freedsp-native-band-map.ps1；internal scripts/freedsp/BandValidation.psm1維持互動與nativechildwatchdog。
Native old fixedwire5 operations rejected beforediscovery；八個remaining fixed operations無band/gain/freq/Q options。
完整raw transcript自動存TEMP/AuraPEQ/freedsp-band-map-yyyyMMdd-HHmmss-GUID.log，unique/CreateNew/AutoFlush、repo內TEMP拒絕。
Console顯示progress、protocolclassification/RESULT；fullhex/math/header均在log。Prompt與answers也保存，markers定位SDK/wire/APPLY/RESTORE。
ENTER確認；Apply N=no、S=uncertain；Restore N=no、P=partial；Qabort不autoRestore。restore未確認停止，不送laterband。
Failure/timeout/unknownrate/GET error停止，no listening/no reSET/no autoRestore；partialwrite可能active，summary明列。
成功摘要判定：ProtocolApplyPASS、AudibleApplyYES、ProtocolRestorePASS、AudibleRestoreYES四條件齊備才wireVERIFIED。
其餘protocol-only/nochange/uncertain/failed/aborted/notrun分開呈現；全四成功只貼summary，差異/矛盾/異常附相關bandsections。

### Research checkpoint — M2L implementation and offline evidence
- Examined: M2K Henry報告、officialshiftSDK0..4+5 fixture、nativefixedmodel/guard、interactivecontroller與logging/watchdog。
- Verified facts: 42nativeoffline tests passed；11PS mocktests在WindowsPowerShell通過；所有knownrates各band只word1不同。
- Verified facts: mock exactApply/Restorepairs、failurestop、Enter/N/S/P/Q、EOFabort、markers/compactsummary；native190 reply0→reply1 syntheticcase可matching完成。
- Hypotheses: wire6..9是否都有可逆可聽效果尚未實測；M2K subjective描述不等同頻率響應量測。
- Discarded hypotheses: wire5結果可代替allbands；protocolACK即audible；uncertainrestoration可繼續累積；Q可默默自動restore。
- Unresolved fields: wire6..9 hardwareeffects/reversal、nativefinal1LSB optimum、trueglobalpreamp。
- Next search target: finalverification/scope/Git後STOP；Henry一次interactivevalidation，不由Codex執行hardware。

## Global Preamp / Master Gain — separate FUTURE milestone
Status: UNRESOLVED / NOT VERIFIED。
現有AuraPEQ Conexant globalgain path不是已驗證的realFreeDSPpreamp，不能由本輪band成功外推。
禁止以乘上每個biquad的方式模擬preamp；本輪不研究、不實作。
Later questions: officialFreeman3是否暴露trueglobal/masterDSPgain？哪個CAFcommand/module？是否獨立PEQ？可否RAM、Flashpersistence、readback？
必須另輪官方app/static/native investigation，不綁M2Lbandvalidation。

## Evidence for upstream / Issue #3
M2K realhardware：188/187/346/190 matching，paddedWindows187accepted，346index5→48k。
190在Apply與Restore均firstGETreply0、secondGETreply1，支持boundedGET的重要性，無SETresend。
SDK0/wire5 selector0 PK400Hz/-12dB/Q1造成clear audiblechange，同band官方unity恢復前狀態。
這是RAM單band可逆audioeffect證據，不證frequencylocalization、nativebitexact、所有bands、Flash、globalpreamp。
M2L只SDK1..4→wire6..9，同coefficients只變word1，每段必須同bandrestore；implementationready、hardwarepending。
Browserrawinputabsence/hostsend不能判firmware沒reply；nativeCAF＋audible/reversal證據已成立。Production尚未integrate，nootherprotocolchanges。

### Problem / hypothesis / next action
Observed problem:
- wire5已證可逆audioeffect；其餘官方live slots還未實測，不能宣稱全五band可用。
Verified facts:
- M2K Apply/Restore matchingprotocol＋clear audiblereversal；padded187accepted；190reply0→reply1；officialSDK1..4+5mapping。
Possible causes:
- 若剩餘slot無效果：slot/bank/state/firmware差異或聽感不確定；本輪只controlwirefield，尚無實測失敗可歸因。
Ruled out / weakened:
- nativeRAM190完全無作用；padded187必被device拒絕；oneGET永遠足夠；wire5audible可外推allslots；globalgain已驗證。
Next validation:
- Henry只跑interactive script一次，逐bandApply/listen/Restore/confirm；全成功貼summary，異常貼對應sections，error停不retry。
Possible fix direction:
- 全部可逆後再另輪評估五bandproduction；若band差異則保持同filter分析該section，不加gain/bands、不進未知九band或preamp。

### Failed / verified history — current
M2F WebHID188timeout/190未送；M2G346hostsend/rawTotal0；M2Hbrowser官方GET替代不實用。
M2I nativevalidCAF；M2J matching346/48k；M2Kwire5 matching＋audibleApply/Restore→singlebandRAMVERIFIED。
M2Lwire6..9→PENDING HENRY，ImplementationREADY。

### Research checkpoint — M2L final offline handoff
- Examined: final native/model/CLI、interactivePSmodule、11mockcases、42nativecases、15files/125projecttests、realofflinechildstdoutpump、stagedscope準備。
- Verified facts: nativebuild0warnings/0errors；42native及11WindowsPowerShellmocktests通過；verify.ps1 exit0；git diff --check通過。
- Verified facts: realchildpump完整擷取OFFLINE Tests assembly43lines；production/src/dist無diff；新增文件只有code/tests，沒有.md或runtime log。
- Hypotheses: wire6–9hardwareeffects仍未知；不從mocksummary的VERIFIED字樣推論實體結果。
- Discarded hypotheses: EOF等於ENTER；logging/interruption後可把已跑hardware標NOTRUN；失敗可自動繼續或重試。
- Unresolved fields: wire6–9可聽及恢復、nativefinalquantizer1LSB、truepreamp另輪。
- Next search target: commit/push後STOP，Henry低volume按一次interactive流程，回傳compactsummary／必要bandsections。

### Scope / regression check
- FreeDSP-specific files: SafeRam.cs、Program.cs、nativeTests/Program.cs、nativeSafeRamScope.test.ts、nativeBandMapScope.test.ts、nativeBandValidation.tests.ps1。
- Interactive test script: scripts/test-freedsp-native-band-map.ps1；internal helper: scripts/freedsp/BandValidation.psm1。
- Shared runtime changed: NONE；Production runtime changed: NO；Non-FreeDSP protocol changed: NO。
- Documentation changed: GENERAL/ROADMAP/DECISIONS/DONE ONLY；New documentation files: NO；Runtime log files committed: NO。
- M2Kwire5 VERIFIED；M2LimplementationREADY，wire6–9 PENDING HENRY；no unknown9band/preamp/Flash work。

## 2026-10-07 — latest M2L hardware result (Henry report)
SDK0/wire5 previously VERIFIED M2K，未重測。
SDK1/wire6：Protocol Apply PASS、Audible Apply YES、Protocol Restore PASS、Audible Restore YES，fully VERIFIED。
SDK2/wire7：Protocol Apply/Restore PASS、Audible Apply YES；Henry分心，Restore聽感PARTIAL/UNCERTAIN。
wire7分類：PROTOCOL VERIFIED / AUDIBLE RESTORE UNCONFIRMED，不是failed。腳本正確在P後停止；SDK3/wire8、SDK4/wire9 NOT RUN / PENDING。
M2L Windows native evidence：input/output report bytes62、feature0，HidP_InitializeReportForID確認Input/Output ID1，SET成功並取得matchingCAF回應。
這與1byte reportID＋61byte reportdata一致；preparsed-data驗證/caps/hostAPI回應不是rawUSB transfer擷取，不能聲稱已證實rawUSB長度。

## M2L-Resume — targeted validation READY
|SDK / wire|Current evidence|Next action|
|---|---|---|
|SDK0/wire5|VERIFIED M2K|不重測|
|SDK1/wire6|VERIFIED M2L，Apply/Restore protocol＋audibleYES|Start2跳過，保留priorverifiedstatus|
|SDK2/wire7|PROTOCOL VERIFIED / AUDIBLE RESTORE UNCONFIRMED；Apply可聽|本次從此重驗|
|SDK3/wire8|NOT RUN / PENDING|wire7確認恢復後才繼續|
|SDK4/wire9|NOT RUN / PENDING|前一段確認恢復後才繼續|
手動入口-StartSdkBand 1..4（default1）；Start2→SDK2..4，Start3→SDK3..4，Start4→SDK4only。
無OnlySdkBand額外模式；既有nativeallowedoperation呼叫不變。只改manualselection、progress/summary、firstselectedApply安全提示。
本次runtime/math/protocol不變；wire7目前不是knownimplementationdefect。

### Research checkpoint — M2L-Resume implementation
- Examined: Henrywire6/7實測摘要、既有manualPSselection/summary/safety、WindowsHIDcaps/ID證據。
- Verified facts: wire6 fullyverified；wire7protocol雙PASS且ApplyaudibleYES、Restoreuncertain；wire8/9未送；原script正確停止。
- Verified facts: 16WindowsPowerShellmocktests通過，包括default1、Start2/3/4、invalidbinding、priorstatus、resumefail/uncertainstop。
- Hypotheses: attention/listening uncertainty是目前主要解釋，不據此判device缺陷；新的wire7恢復聽感仍待Henry。
- Discarded hypotheses: wire7Applyfailed、wire7Restoreprotocolfailed、P必等於firmware故障、resume需要改serializer/payload。
- Unresolved fields: wire7 audibleRestore、wire8/9可逆audioeffect。
- Next search target: verify/scope/Git後STOP；Henry低volumeStart2一次，逐段confirm，不由Codex測硬體。

## Evidence for upstream / Issue #3
M2L actualrun：SDK1/wire6 protocolApply/RestorePASS、audibleApply/RestoreYES→VERIFIED。
SDK2/wire7 protocolApply/RestorePASS、ApplyaudibleYES、Restore因Henry分心未確認→PROTOCOL VERIFIED / AUDIBLE RESTORE UNCONFIRMED，非failed。
P後controller正確停止，SDK3/wire8與SDK4/wire9未測；需targetedresume，不能用未測band宣稱支持或失敗。
Native HID Input/OutputReportByteLength62、Feature0，HidP_InitializeReportForID確認ID1路徑（preparsedmetadata）；HidD_SetOutputReportsuccess及matchingCAFreceived。
與ReportID1byte+61data bytes一致；未capture USB setup/data completion，不聲稱rawUSBtransferlayout/length已被實測證明。

### Problem / hypothesis / next action
Observed problem:
- wire7 Restore audible confirmation因Henry分心未取得；重跑全流程會不必要地重測已VERIFIED wire6。
Verified facts:
- wire6 fullyverified；wire7 Apply audible、Apply/Restore protocol bothPASS；wire7 audibleRestoreunconfirmed；wire8/9pending。
Possible causes:
- humanattention/listeninguncertainty目前為主要解釋；不能由此推導protocolfailure。
Ruled out / weakened:
- wire7Applyfailure、wire7Restoreprotocolfailure；既有腳本未停止或自動累積filters。
Next validation:
- Henry用-StartSdkBand 2從SDK2/wire7重驗；只有同段Restore聽感YES才繼續wire8/wire9。
Possible fix direction:
- none yet；這是validationstate，不是已知implementationdefect，不改CAF/native/coefficients/payload。

### Scope / regression check
- Manual tools changed: test-freedsp-native-band-map.ps1、BandValidation.psm1；offline tests兩份更新。
- Native protocol/serializer/190/bandmapping/coefficients/payload changed: NO。
- Shared/production runtime changed: NONE；Non-FreeDSP protocol changed: NO；Flash/90/220 changes: NO。
- Documentation changed: GENERAL/ROADMAP/DECISIONS/DONE ONLY；New documentation/runtime-log files committed: NO。

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

## 2026-10-07 — M2M research phase 1: nine-slot source evidence

### Research checkpoint
- Evidence examined: pinned official APK classes.dex (SHA256 04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5), getF3EQCoefficientList/getFreeman3EQParam/setDefaultAvailable; upstream e7da5b51199538e20a6442190e501ec26b29e2a2 and current nine-row UI/index flow; saved Issue #3 body/comments and July official helper dump provenance.
- Verified facts: Freeman3 getter446 directly iterates wire1..9, requests [0,slot,0,...,0] (13 words: eleven trailing zeros), saves unchanged slot to BandEQCoefficient.band, parses Gain plus five signed24 coefficients. Setter190 public SDK accepts only0..4 and shifts+5; initialization writes raw0..9 unity with word0=0/1. Henry verified SDK0..4/wire5..9 reversibly; M2L complete.
- Surviving hypotheses: wire1..9 are live coefficient slots; current UI position0..8 -> raw selector1..9 is a plausible proposed adapter. Physical independence/effect of raw1..4 remains unknown; five editable SDK slots coexist with nine coefficient slots.
- Rejected hypotheses: SDK0..8 -> wire5..13; Flash220 metadata alone proves RAM mapping; slot field is the sample-rate index (rate is separate346 and word0 remains0 in realtime path).
- Exact unresolved items: raw1..4 audible effect/reversal and independent accumulation; front-four/back-five partition meaning, word0=0/1 channel/bank meaning, equivalence of existing UI labels to official SDK band semantics. No confirmed raw190 cut capture for1..4 in existing logs.
- Next action: prepare fixed raw1..4 candidate A/R harness using proven188/187/346/190 only; preserve known native math/transport. No new hardware query446, no initialization loop, no runtime or Web integration before physical evidence.

## M2M — nine-band mapping: manual validation ready

本節 supersedes earlier M2L pending/resume sections。M2L COMPLETE；Henry最後報告SDK0..4/wire5..9均protocol Apply/Restore PASS＋audible reversal VERIFIED。

### Evidence inventory / source boundaries
|Source|Provenance|What it proves|What it does not prove|Confidence|
|---|---|---|---|---|
|Henry final M2L report|2026-10-07; user-provided physical observations|SDK0..4 → wire5..9 individually reversible with protocol and audible success|Nine UI state, full-nine iteration, slot independence under simultaneous filters, bit exact coefficients|HIGH for reported five-slot reversal|
|officialNineSlotStaticEvidence.json|Pinned APK SHA256 04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5; six exact DEX methods replayed|Freeman3 raw coefficient getter446 enumerates1..9; setter/getter SDK only0..4 shifted+5; initialization190 includes1..4|Current firmware physical effect/partition of1..4; actual wire captures; nine editable SDK bands|HIGH static / UNVERIFIED live1..4|
|official helper dump and existing deterministic analysis|Issue #3 July1 log.txt; 57 TX/RX pairs; primary helper buffers, derived offset reports|Flash220 metadata/coefficient use1..9; existing envelope/field evidence|No real-time190 filter capture for1..4; Flash is not RAM mapping proof|HIGH buffer contents / weak independent RAM inference|
|Current src/fn.ts / src/dsp.ts / upstream history|e7da5b51199538e20a6442190e501ec26b29e2a2, 2026-07-01; current source at aad01c7|Nine editable row positions0..8; production uses band.index+1; defaults31/62/125/250/500/1000/2000/4000/8000Hz|No independent source or hardware proof for that UI-to-wire convention|HIGH implementation provenance / mapping unverified|
|Issue #3 body/comments and attachments|Saved local issue-body/issue-comments (updated2026-10-06), original-log.txt; log.txt and COPY.MSG.LOG.txt attachments|History and known protocol assumptions; no recovered cut190 wire1..4 evidence in these artifacts|Current upstream issue state (live browser fetch unavailable); firmware internal slot topology|Historical primary logs; derived interpretations separately treated|
|Known WebHID descriptor + native M2K/M2L observations|reportId1; 61 data bytes; Windows caps62 input/output, feature0; matching native responses|Windows report format and native path already exercised|Raw USB completion length, browser GET equivalence, Flash persistence|HIGH descriptor/caps, limited transfer inference|

### Official slot-field interpretation
- getF3EQCoefficientList is explicitly gated to Freeman3 (offsets18–50), names MAX_BAND_INDEX=9, loops1..9 (160–168), word0=0 (186), word1=iterator (190–192), command446 (212), and stores unchanged iterator as BandEQCoefficient.band (268).
- Gain byte18, B0/B1/B2/A0/A1 byte22/26/30/34/38; signed24 expansion via shl8/arithmetic shr8 (556–632). Logical request has13 words. getFreeman3EQParam uses the same446 plus SDK+5 shift, supporting446 as counterpart to190 (190|0x100).
- setDefaultAvailable uses firmware string comparison against7.49.0.0 and raw0..9 unity190 for word0=0 and1. This is initialization evidence, not permission to execute the reset loop. slot0 and word0=1 remain outside this harness.
- The evidence names word1 a coefficient band/slot, not a Hz/rate index. It does NOT establish whether the slots span a cascade, channels, banks or a reserved/user partition. Public SDK exposes only the last five editable slots; no native artifact explains the front-four/back-five role.
- A nine-slot getter plus unity initialization establishes a slot domain. It cannot prove that a non-unity filter on1..4 affects the listening path or that multiple slots accumulate independently. Thus section9 of the request applies; complete UI mapping is not yet MEDIUM/HIGH as a physical-behavior claim.

### Explicit nine-row proposed mapping (not a final verified UI mapping)
|AuraPEQ UI band|Internal index|SDK field|wire selector|Evidence|Confidence|
|---|---:|---|---|---|---|
|1|0|UNKNOWN / not exposed by five-band SDK|Candidate1; final UNKNOWN|446 direct1..9;190 unity initialization; upstream index+1 only|HIGH slot existence; UNKNOWN live/UI mapping|
|2|1|UNKNOWN / not exposed by five-band SDK|Candidate2; final UNKNOWN|Same direct-slot evidence|HIGH slot existence; UNKNOWN live/UI mapping|
|3|2|UNKNOWN / not exposed by five-band SDK|Candidate3; final UNKNOWN|Same direct-slot evidence|HIGH slot existence; UNKNOWN live/UI mapping|
|4|3|UNKNOWN / not exposed by five-band SDK|Candidate4; final UNKNOWN|Same direct-slot evidence|HIGH slot existence; UNKNOWN live/UI mapping|
|5|4|SDK0 (target slot equivalence only)|Proposed5|SDK+5; Henry wire5 reversal; upstream index+1|HIGH wire5 reversal; proposed UI assignment|
|6|5|SDK1 (target slot equivalence only)|Proposed6|SDK+5; Henry wire6 reversal; upstream index+1|HIGH wire6 reversal; proposed UI assignment|
|7|6|SDK2 (target slot equivalence only)|Proposed7|SDK+5; Henry wire7 reversal; upstream index+1|HIGH wire7 reversal; proposed UI assignment|
|8|7|SDK3 (target slot equivalence only)|Proposed8|SDK+5; Henry wire8 reversal; upstream index+1|HIGH wire8 reversal; proposed UI assignment|
|9|8|SDK4 (target slot equivalence only)|Proposed9|SDK+5; Henry wire9 reversal; upstream index+1|HIGH wire9 reversal; proposed UI assignment|
UI labels/default frequencies are editable presets, not fixed hardware frequency slots. Internal index is not SDK band. Existing nine-element localStorage can retain stale/duplicate indices: future adapter must validate position===index, uniqueness and integer bounds, not just length.

### Implementation / smallest remaining experiment
- New entry: `scripts/test-freedsp-native-unresolved-slots.ps1`, default rawwire1..4; optional `-StartWire 1..4` for an explicitly selected resume. It never schedules5..9. Historical M2L entry/operations remain for provenance, not the current task.
- Fixed negative PK400Hz/-12dB/Q1, current known rate from matching346, word0=0, word1 rawcandidate1..4. Native math/encoder/transport timing are unchanged; the candidate packet differs from the proven SDK1/wire6 packet ONLY in word1.
- Exact fixed eight candidate CLI operation names; no numeric tuning/positive gain/arbitrary command. New allowlist extends only these fixed cut/unity packets at the five known rates. Invalid slot and ambiguous SDK+candidate fail before any SET.
- Each explicit A/R runs188 matching →187 matching →346 matching/knownHz →190 matching, once per command with bounded GET/no resend. No446 hardware reads,90,220,Flash, initialization loop or all-nine write.
- Controller keeps A/R repeat toggles, Enter requires both successful operations; N/Q/failure stops immediately. Enter while still APPLIED stops before another slot, warning it may remain active. R then Enter avoids accumulation. Unity Restore is not a backup of previous EQ. 188/187 enable/bypass have the same shared device-state side effects as the proven native procedure.
- Offline-only nine-band model is a proposed adapter/fixture generator, never a transport: all9 rows explicit; current rate, signed words/dynamic Gain, disabled same-slot unity, negative PK-only; fail closed on unsupported type/nonfinite data/mismatched index/extra or missing rows/Nyquist or packed-field overflow. Native quantizer1LSB uncertainty remains.
- Runtime Web integration remains BLOCKED on raw1..4 live reversal/slot role. After confirmation: isolated FreeDSP diagnostic RAM adapter first, explicit UI state normalization, no production sync/tilt/automatic90. Browser transport must resolve official polling through the proven native path; do not assume successful WebHID sendReport implies completion.
- Later production gate remains: two different UI bands independently reversible, full9 protocol success, no unexpected accumulation, reconnect not treated as Flash proof. These are not part of this four-candidate experiment.

### Research checkpoint
- Evidence examined: six-method pinned APK replay; UI/history trace; fixture/log/Issue chronology; candidate serializer and toggle controller; separate offline nine-band model.
- Verified facts: direct446 coefficient slots1..9; public SDK0..4+5; Henry five-slot reversal; focused tests cover only mock/synthetic hardware and deterministic data.
- Surviving hypotheses: raw1..4 are remaining editable live slots; nine UI positions can be assigned slot1..9 if physical behavior supports it.
- Rejected hypotheses: SDK5..8 are accepted; blindly+5 nine UI indices; Flash metadata alone proves RAM; a mock VERIFIED summary proves real audio; protocol matching alone proves audibility.
- Exact unresolved items: raw1..4 audible reversal/physical partition/independence, full-nine UI/native transport integration; native optimum1LSB.
- Next action: final automated verification + scoped commit/push; STOP for one four-candidate Henry A/R run, no additional offline guessing or Web production integration.

## Evidence for upstream / Issue #3
- Target FreeDSP35D8:1496, CONEXANT/Freeman3; reportID1+61 data, Windows input/output62/feature0 and native ID metadata verified. Raw transfer capture absent.
- Henry reports SDK0..4/wire5..9 Apply and Restore each protocol PASS and audible reversible: M2L COMPLETE. Native sequence188/187/346/190 works; replies must match after bounded GET, no automatic90/Flash needed for this test.
- NEW pinned APK source: Freeman3 `getF3EQCoefficientList` directly reads446 with [0,slot,eleven zeros] for slot1..9; stores slot as BandEQCoefficient.band, parses Gain plus signed24 coefficients. Initialization190 also addresses raw1..4 with unity. Public five-band setter/getter separately shiftsSDK+5. This supports raw1..4 candidates but does not prove their non-unity effect.
- July official helper arrays are not new RAM190 captures; metadata220 cannot settle physical RAM slot semantics. Upstream e7da5b5 added nine UI rows/index+1 without a documented mapping derivation.
- Current production remains different: five rate-index RAM writes rather than current-rate/selector0, fixed Gain/RBJ math, automatic90, enabled+tilt/type handling and stale index risks. This research does not replace that path.
- Prepared minimal raw1..4 reversible negative-PK native experiment; existing wire5..9 not retested. Web debug RAM integration and final nine-UI mapping pending physical evidence. No preamp/Flash/non-FreeDSP changes. No issue comment posted.

### Problem / hypothesis / next action
Observed problem:
- Five official editable live bands work; full nine UI mapping is still unverified and production sync does not use the proven native path.
Verified facts:
- Official446 direct nine-slot list,190 raw-slot unity initialization, SDK five-slot guard/+5, Henry reversible wire5..9. UI rows are editable positions; existing index+1 was introduced without independent provenance.
Possible causes:
- Front-four slots may be reserved/another bank or part of the same live cascade; public SDK may expose only a subset. Word0/channel/bank semantics remain unknown.
Ruled out / weakened:
- Five verified slots need another replay; no official evidence exists for raw1..4; arbitrary0/10..13 probing; nine SDK bands; preamp or Flash is required to validate PEQ.
Next validation:
- Henry one command, candidateswire1→2→3→4, A/R repeat at same low song/volume, R then Enter after audible reversal; N/Q/protocol error stop. No existing-slot retest.
Possible fix direction:
- If remaining slots reverse audibly, use explicit position→rawslot adapter and current-rate native serializer in isolated FreeDSP Web debug RAM path. Do not claim physical independence/full-nine completion until the later stated gate passes.

### Scope / regression check
- FreeDSP-specific changes: fixed candidate native operations/SafeRam/Program and reusable toggle profile.
- Analysis/test changes: six-method static extractor/fixture, offline nine-band model, focused Vitest/PowerShell/C# tests, candidate entry script.
- Shared runtime files changed: NONE; production src changed: NONE.
- Non-FreeDSP protocol code changed: NO.
- Docs: GENERAL/ROADMAP/DECISIONS/DONE only; no new Markdown or committed runtime logs.
- No hardware access by Codex. No Web server started; future localhost remains http://localhost:5173/ via .\scripts\dev.ps1.

### M2M final automated verification / research checkpoint
- Native production diagnostic build: success,0warnings/0errors; never run against a physical device. C# Tests assembly47 passed (synthetic/mock only).
- Windows PowerShell toggle controller15 passed (injected mock answers/protocol results only), covering all candidate1..4 and old controller regression.
- Six-method pinned APK static replay exactly matched committed fixture; no APK/native code executed.
- Focused Vitest3files/15tests passed; test TypeScript check passed. Initial sandbox Vitest cache rename EPERM occurred before test loading; normal-permission retry passed, no product defect inferred.
- Final verify.ps1 run once: exit0; production TypeScript/Vite build and16files/134tests passed. Generated dist files restored, no runtime source/dist scope changes retained.
- Next action: scoped Git commit/push, then STOP for Henry. M2M manual validation READY; rawwire1..4 still physically UNVERIFIED. Mock test VERIFIED labels are not actual device evidence.

## 2026-10-08 — M2M hardware COMPLETE / M2N start
Henry reports rawwire1..4 PK400Hz/-12dB/Q1 each protocolApply PASS、audibleApply YES、protocolRestore PASS、audibleRestore YES。Combined with priorwire5..9, allrawslots1..9 have individual reversible audible evidence. M2M hardware validation COMPLETE; no slot retest scheduled. SDK field semantics forwire1..4 remain UNKNOWN. M2N assigns editable UIposition0..8 to rawslot1..9, explicit position/index validation; debug Web RAM integration only, no production replacement/preamp/Flash.

### Research checkpoint — M2N transport design
- Evidence examined: current clean dc08a8d, prior WebHID missing-input/GET limitation, proven Windows native matching flow, current debug page and dev launcher.
- Verified facts: allnine raw slots individually reversible by Henry; UI uses editable position/index0..8; official446 enumerates1..9. UI->slot is an explicit stable app assignment, not SDK inference or fixed frequency labels.
- Surviving hypotheses: browser->loopback bridge->bounded native operation will preserve native behavior; Web end-to-end must still be manually validated.
- Rejected hypotheses: repeat slot harness, blindly use old rate-index RAM builder, browser send completion equals DSP success.
- Unresolved: Web UI plumbing, fullnine simultaneous behavior, native optimum1LSB.
- Next action: isolated negative-PK native-derived model, authenticated localhost bridge and DEV page; connect metadata only, writes on explicit buttons, serialized operations, no automatic retry/Flash/90.

### Research checkpoint — M2N implementation / focused validation
- Examined: isolated page/client, C# dynamic negative-PK model/scoped packets, Kestrel bridge/30s child watchdog, old startup behavior and failure pathways.
- Verified:18focused Vitest tests across3files;56native synthetic/mock tests, including a real loopback HTTP server with FAKE child only (no HID). Schema/token/origin/Host gates, BUSY409, exact request snapshots, allnine once, disabledunity, unknown-rate/partialfailure stop.
- Sandbox localhost socket10013 blocked the first HTTP mock test; normal-permission run passed. This was environment permission, not a device observation.
- Found and corrected: JSON missing-field defaults rejected; RestoreBand retains editor values for repeat toggles; edit invalidates prior confirmation; after fullnine sync, RestoreNine stays available even if editor confirmations are invalidated.
- Found startup issue: old main DEV auto-connect could execute auto-preamp behavior before user enters debug page. Exact VID/PID DEV guard skips FreeDSP auto-connect only; non-FreeDSP and production behavior preserved. Main link redirects to new isolated page.
- Unresolved: actual browser/native device end-to-end audibility, fullnine combined behavior, native optimum1LSB. Positive gains and non-PK types remain blocked.
- Next action: metadata-free startup/HTTP page smoke, final verification once, scoped commit/push, then Henry Web Band1/5/9 validation; no CLI slot retest.

## M2N — final UI mapping / Web RAM debug implementation

M2M hardware validation COMPLETE. Henry reports wire1..4 each protocolApply/Restore PASS and audibleApply/Restore YES for PK400Hz/-12dB/Q1; wire5..9 previously verified. All raw1..9 are individually reversible; do not schedule CLI slot retests.

### Final mapping for this application
|AuraPEQ UI band|Internal position/index|Raw FreeDSP wire slot|SDK field|Evidence / confidence|
|---|---:|---:|---|---|
|1|0|1|UNKNOWN / not inferred|HIGH application assignment + Henry raw1 reversal|
|2|1|2|UNKNOWN / not inferred|HIGH application assignment + Henry raw2 reversal|
|3|2|3|UNKNOWN / not inferred|HIGH application assignment + Henry raw3 reversal|
|4|3|4|UNKNOWN / not inferred|HIGH application assignment + Henry raw4 reversal|
|5|4|5|SDK0 target-slot equivalence|HIGH assignment + SDK+5 + Henry raw5 reversal|
|6|5|6|SDK1 target-slot equivalence|HIGH assignment + SDK+5 + Henry raw6 reversal|
|7|6|7|SDK2 target-slot equivalence|HIGH assignment + SDK+5 + Henry raw7 reversal|
|8|7|8|SDK3 target-slot equivalence|HIGH assignment + SDK+5 + Henry raw8 reversal|
|9|8|9|SDK4 target-slot equivalence|HIGH assignment + SDK+5 + Henry raw9 reversal|
This is a deterministic AuraPEQ assignment for nine editable positions, not a claim that the official five-band SDK edits nine bands or that slots have fixed frequency roles. Current UI row order/index0..8 and upstream index+1 align with official446 raw1..9 enumeration and190 initialization. Each raw slot is now physically usable. No evidence requires a permutation; we preserve current row order and validate position===index. Simultaneous independence/cascade topology/fullnine interaction is not yet proven by individual tests.

### Data flow / implementation
- `freedsp-ram-debug.html` and `src/freedsp/ramDebugPage.ts`: separate DEV-only nine-row Band editor using existing Band shape; starts flat editor values, NOT device readback. Main DEV link points here. Optional explicit load from aura_active_eq_state copies a validated nine-row snapshot only; unsupported types/positive gains/stale indices reject. No main sync/realtime sender is imported or called.
- `src/freedsp/webRam.ts`: explicit uiIndex+1, complete nine-state validation, strict negativePK bounds20..20000Hz/-12..0dB/Q0.1..10, independent offline native coefficient parity model, bridge client with in-memory session and no write retry. Disabled/restore yields unity on the same slot. All type-only imports disappear at runtime.
- `tools/freedsp-native/RamDebug.cs`: authoritative native execution. Fixed action names applyBand/restoreBand/syncNine/restoreNine, required JSON fields, unknown fields reject, exactlynine indices validated before discovery. Match188→187→346/knownrate before coefficients; current rate queried once per explicit operation, held for that operation (no atomicity or mid-stream rate-change immunity claimed).
- Java/JNI narrowing semantics preserved: frequencyU16 via truncation, Q*256U16, gain*256S16, precision24; float32 coefficient storage and product, feedback signs, dynamicGain/scale, signed24/stability guards. Hardware-proven400/-12/Q1 model matches across allfive known rates. Exact native32-candidate optimum remains1LSB uncertain; no bit-exact claim. Other valid negativePK parameters are source-derived/offline tested, not all individually hardware verified.
- Packet190: Windows62 includes reportID1, prefix0, count13/command190, CTRL, [0,rawslot,Gain,B0,B1,B2,A0,A1,0,0,0,0,0]. Only selected slot for Apply/Restore. Fullnine computes every selected packet BEFORE first190, iterates1..9 once, no skip/truncation. Stop at first failure, no resend/rollback; some slots may remain applied.
- NativeHid default fixed test allowlist preserved. Internal per-request scoped open authorizes exact prerequisite/query packets and ONLY the packets computed for that request, not arbitrary commands/payloads. No Feature/stream/driver fallback. Existing exact VID/PID/MI03/usage0C:1/caps62/ID1 gate retained.
- `DebugBridge.cs`: Windows/.NET10 with bundled ASP.NET shared framework; Kestrel binds127.0.0.1:5174 only. Session GET has no device access; exact Origin http://localhost:5173 and Host required; write endpoints additionally require random32-byte process session header. JSON size16KiB, single operation semaphore returns409 on concurrent requests, fixed child operations only.
- Connect launches bounded metadata-only debugInspect; no SET/GET. RAM action launches debugRam child via stdin validated twice.30s watchdog kills own child tree; logs full stdout/stderr/Win32 errors/matching fields; browser35s deadline longer. Runtime logs unique TEMP/AuraPEQ .log, not repo. Timeout/failure => STOP/unknown or partial completion, no listening-success claim.
- scripts/dev.ps1 builds and starts hidden owned bridge, runs Vite127.0.0.1:5173 strictPort; finally terminates own bridge process tree. No hardware at startup. Main DEV auto-connect skips ONLY35D8:1496 to prevent old auto-preamp/legacy sender effects before entering diagnostic page; other targets and production behavior unchanged.

### Debug validation gate / one Henry Web test
1. Close other FreeDSP control tabs/tools; APO OFF, outputFreeDSP, Windows1–2/100. Open http://localhost:5173/ via .\scripts\dev.ps1.
2. Click **FreeDSP M2N RAM debug（九段／手動）**; do not use normal main Connect/Sync/Flash. New page click **連線 FreeDSP（僅metadata）**.
3. Select **UI Band1** → **填入安全測試值400Hz／−12dB／Q1（不送出）** → **Apply選定band RAM**. FirstApply IEM out; only after matching success/no abnormal output listen at low unchanged song/volume.
4. **Restore選定band unity** → verify recovery → **確認本band可聽變化＋恢復**. Editor retains400/-12/Q1 for repeat toggles; Restore command ignores edited gain and sends unity. Do not confuse editor values with last device write.
5. Repeat the same Web flow for **UI Band5**, then **UI Band9**, restoring each before next. This validates new UI/bridge routing, not a rerun of the CLI slot harness.
6. Stop/paste result for these three. Fullnine buttons unlock only after their confirmations; optional later explicit Sync nine followed by Restore nine, not required for this first three-band handoff. Restore nine remains enabled after fullnine has run even if subsequent edits invalidate confirmations.
7. Any noise/distortion/imbalance/disconnect/error: stop, no retry. Copy entire page log, action/band and audible result plus Full log path; if startup failure, relevant TEMP bridge stderr. No automatic rollback; closing page/server does not restoreRAM.
No positive boost, LSQ/HSQ/NOTCH, mode90,Flash220, preamp or EQ readback. Connect/reconnect says metadata only, never saved/persistent/flat. Other slots' prior EQ is not backed up; unity replaces selected slot.

### Research checkpoint — startup / offline evidence
- Examined: production diagnostic build, HTTP handshake/routing with mock child, native dynamic coefficient models, PowerShell controller regressions, real dev launcher/HTML/module/session smoke.
- Verified:56native mock/synthetic tests,18focused Vitest tests in3files,15PowerShell mock tests. Real startup smoke: HTML200, transformed TS200, loopback session200; no /connect or /ram invoked and no HID discovery/write by Codex.
- Initial PowerShell Invoke-WebRequest smoke timed out although Vite ready; direct no-proxy .NET HttpClient passed. No system proxy settings changed; no claim of exact client timeout root cause.
- Hypotheses remaining: new browser/native end-to-end path should reproduce known effects; combinednine-slot interaction remains untested physically.
- Rejected: old WebHID send completion is sufficient; automatic main DEV FreeDSP connection is harmless; missingJSON properties may default; all9band hardware individual evidence means production ready.
- Unresolved: manualWeb1/5/9 reversal, fullnine simultaneous/error-free state, finalnativeLSB.
- Next action: full verify.ps1 once + diffcheck/scope review + commit/push; STOP at M2N Web validation ready.

## Evidence for upstream / Issue #3
- NEW Henry hardware report: rawwire1..4 each Apply/Restore protocol PASS＋audibleYES at400/-12/Q1; combined priorwire5..9 gives individual reversible RAM evidence for all1..9. M2M COMPLETE; no SDK meaning inferred for1..4.
- Official pinned APK446 raw1..9 list and190 initialization now agree with live usable slot domain. Final AuraPEQ mapping position/index0..8→wire1..9 is an explicit stable editable-slot assignment, preserving row order; not fixed frequency bands and not SDK0..8+5.
- M2N DEV Web RAM implementation ready offline: isolated nine-row editor→localhost bridge→exact FreeDSP native matching188/187/346/190. Current-rate/selector0/dynamicGain/feedback signs replace old builder only in debug path. No production sender replacement or non-FreeDSP protocol change.
- Wire descriptor ID1/61 data, native caps62 and responses remain supported; rawUSB completion and exactnative quantizer optimum not newly claimed. No Flash/preamp/readback/90.
- Remaining evidence needed: new Web UI1/5/9 audible reversals, later fullnine combined behavior and production gate. No GitHub issue comment posted.

### Problem / hypothesis / next action
Observed problem:
- Allrawslots now work individually, but old WebHID route cannot reproduce official synchronous GET behavior and production uses rate-index/fixedGain/automatic90 assumptions.
Verified facts:
- Henry individually reversed1..9; official446 enumeration; stable nine editable UI positions; proven native sequence, negative400PK coefficient model and62-byte Windows report. New isolated Web/native contract passes offline tests.
Possible causes:
- Any remaining new Web failure may involve bridge startup/session, index/state validation, changed rate, parameter-dependent quantization, native transport error or UI gate. No actual new Web failure attributed yet.
Ruled out / weakened:
- raw1..4 universally inaudible; nine SDK fields required; slot retest necessary; native send completion equals audible success; SDK+5 for allUI rows; preamp/Flash required for this gate.
Next validation:
- One localhost Web run: UI1→5→9, each negative400/-12/Q1 Apply and same-slot unityRestore, manual audible confirmation; error STOP/full log. Not CLI slot validation.
Possible fix direction:
- After successful Web routing, evaluate fullnine state/independence/accumulation and reconnect boundary before production FreeDSP RAM integration. Keep PK-only/current-rate/scoped packet guards; no other protocols or preamp/Flash.

### Scope / regression check
- FreeDSP-specific files: src/freedsp/webRam.ts,ramDebugPage.ts; freedsp-ram-debug.html; nativeRamDebug/DebugBridge and scoped NativeHid/Program/SafeRam/csproj support.
- Analysis/tests: webRam.test.ts, nativeTests/Program.cs, nativeQueryScope default-guard assertion; previous15PowerShell tests rerun unchanged.
- Shared runtime: src/main.ts DEV link only; src/fn.ts exactFreeDSP DEV auto-connect gate only. Shared script scripts/dev.ps1 owns debug bridge startup/shutdown. No src/dsp.ts or any other protocol code edited.
- Non-FreeDSP protocol code changed: NO. Production FreeDSP sender unchanged. No newMarkdown/runtime logs committed. Docs only GENERAL/ROADMAP/DECISIONS/DONE.

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

## 2026-10-08 — M2O full-nine Web RAM validation policy
Henry verified M2N UI1/wire1, UI5/wire5 and UI9/wire9: protocol Apply/Restore PASS and audible Apply/Restore YES for each. Combined with prior individual native wire1..9 reversals, this opens the full-nine Web gate without retesting those bands. Simultaneous nine-band hardware behavior remains PENDING.
M2O remains isolated DEV RAM debug only, UI1..9 -> wire1..9. Explicit editor-only preset: PK/Q1 at250/400/630/1000/1600/2500/4000/6300/10000Hz with -3/-4/-5/-6/-7/-8/-9/-10/-12dB. First full-nine Apply with IEM out of ears, APO OFF, FreeDSP output and low volume; listen only after protocol success without abnormalities.
Prepare all selected coefficients AND packet bytes before first190; send each wire once in order, matching CAF required. Stop first failure, no retry/rollback/automatic restore. Existing explicit188/187/346 prerequisites unchanged and logged;190 is sole EQ write. Each wire has BEGIN/PASS and final protocol complete only after all nine pass.
Separate user-only audible Apply YES then audible Restore YES; no inferred audibility. Restore writes nine unity filters, keeps editor values, and is neither prior-EQ backup nor readback. No Flash/preamp/positive gain/nonPK/production sender replacement/non-FreeDSP changes. Codex performs no hardware actions. STOP at M2O READY pending Henry.
### Problem / hypothesis / next action
Observed problem: individual slots and Web bands1/5/9 passed, but full-nine simultaneous Web Apply/Restore is not yet validated.
Verified facts: Henry reports all three M2N protocol and audible reversals PASS/YES. Existing native path selects all nine exactly once, stops first failure and requires matching CAF; packet preparation now completes before first190.
Possible causes: full-nine combined behavior may differ from individually tested slots; no such defect established.
Ruled out / weakened: need to repeat the completed M2N gate; protocol completion alone proves audible success; editor display is device readback.
Next validation: Henry explicitly loads M2O preset, full-nine Apply, listens/confirms, full-nine unity Restore, listens/confirms. Failure/uncertainty stops with full log; no automatic recovery.
Possible fix direction: only investigate a concrete full-nine failure after its evidence; no production integration in this round.

## Evidence for upstream / Issue #3 — M2O increment
Henry reports M2N Web UI1->wire1, UI5->wire5, UI9->wire9 each protocol Apply/Restore PASS and audible Apply/Restore YES, in addition to native individual wire1..9 reversible evidence. These establish isolated negative PK RAM effects, not simultaneous nine-band/Flash/preamp/readback or native bit-exact coefficients. M2O prepares an explicit negative-only nine-band preset and current-rate190 packets, preserves188/187/346 prerequisites and bounded matching responses. Full-nine hardware/audible result is PENDING; no new hardware evidence produced by Codex.

### Scope / regression check
- FreeDSP-specific files changed: isolated debug HTML, src/freedsp/webRam.ts, src/freedsp/ramDebugPage.ts, tools/freedsp-native/RamDebug.cs.
- Analysis/test files changed: tests/freedsp/webRam.test.ts, tests/freedsp/ramUiStartup.test.ts, tools/freedsp-native/Tests/Program.cs.
- Shared runtime files changed: NONE.
- Non-FreeDSP protocol code changed: NO.

### M2O final automated verification
Focused frontend2files/18tests PASS; native57synthetic/mock tests PASS (including exactnine190 packets, per-wire PASS/FAIL, stop-on-second-wirefailure, no retry/rollback/full-complete claim). verify.ps1 executed once at end: exit0, TypeScript/Vite build and18files/152tests PASS. Sandbox temp rename/loopback restrictions resolved by running offline tests in normal local environment; no physical device was used. Generateddist restored to initial state; intended-file git diff --check PASS. M2O remains READY pending Henry's full-nine listening result. Shared runtime files changed NONE; Non-FreeDSP protocol code changed NO.

## 2026-10-08 — dev.ps1 stale bridge lifecycle correction
Observed problem: Henry reports an old .NET Host locking Release/FreeDspQuery.dll; prior launcher built before cleaning any previous process and finally only knew the current run's PID.
Changed: project-specific lifecycle helper finds exact dotnet executable + this repository's absolute DLL path + sole serveDebug argument before build; rechecks PID/CreationDate/identity before scoped tree termination, waits up to5s for exit plus200ms, and aborts with PID/actionable error on failure. Normal foreground Vite/Ctrl+C remains; finally uses only saved owned bridge identity and disposes the process. Hard host termination can bypass finally; subsequent startup handles the leftover bridge. No PID-only/process-name-only kill, no unknown listener reuse, no hardware action.
Verification: Windows PowerShell focused mock scenarios PASS: stale-owned-stop/wait, unrelated/path/operation rejection, no stale, cleanup savedPID only, PID reuse rejection, failed-stop PID error, prebuild/finally wiring. Focused11Vitest tests PASS; verify.ps1 once exit0, TypeScript/Vite and152project tests PASS. Generateddist restored; git diff --check PASS. These are mocks/static/build evidence, not a live Ctrl+C interruption experiment.
Scope / regression check: scripts/dev.ps1 + scripts/freedsp/DevBridgeLifecycle.psm1, focused PowerShell test and one existing launcher assertion changed. Shared runtime/protocol files NONE; non-FreeDSP protocol code changed NO. Native API/190/math/mapping/RAM/M2O logic untouched. M2O remains READY awaiting Henry's manual result.

## M2P — 2026-10-08: channel/path research checkpoint
Henry hardware report reclassifies M2O: full-nine190 Apply wire1..9 PASS, Restore wire1..9 PASS, audible effect/restoration YES; stereo correctness FAIL / unresolved. NOT production-complete. Earlier single-band tests share reversible rightward imaging. Henry then directly checked ears: selector0 Apply changes LEFT only, RIGHT unchanged; unity restores LEFT. This is user listening evidence, not measured transfer/function naming. Path1 RIGHT is not confirmed.
Examined: pinned APK04756...2d5 nine-slot DEX fixture, RAM/APK fixtures, all57official helper TX/RX pairs, local recovered APK classes.dex, current native payload. Verified: initializer setDefaultAvailable offsets58/62→word0=0,172/176→word0=1; same slot v6 written70/180, sameGain3/B0=4194304 written80/92 and184/188; two190 calls150/216 per slot0..9, firmware>=7.49.0.0 string guard. Runtime setter172/176 only0 and one190; getter446 uses0. Helper dump has NO190 (90×1,220×55,259×1); no official captured paired negative190.
New pinned static name scan scripts/freedsp/inspect-paths.py: all com/conexant classes in classes.dex excluding generatedR resources; only setDefaultAvailable/setFreeman3EQ have literal190 in Freeman class. Left/Right names occur in ANC/ApplicationData, not mapped to190; notificationchannel/helperchannelcount do not name190 targets. Search does not reconstruct Dart AOT/firmware; cannot prove absence of other indirect routes.
Strong inference:190word0 selects distinct coefficient targets; selector0 has LEFT-only effect in Henry's current setup. Stereo channel interpretation now MEDIUM/HIGH support, exact path1/right UNKNOWN until experiment. Alternative bank/processing-target interpretation remains; official runtime0-only is counterevidence to claiming it always updates both. Do not infer a proven official pairednegative setter.
Next: isolated singlewire5 PK400/-12/Q1 current346 A/path0 and B/path1, each explicit unityRestore/listen. Record changedear andimage separately. C/both only after A LEFT-only/B RIGHT-only and both restoredYES; explicit samecoeff writes0then1, stopfirstfailure, no retry/rollback. No production/Web/M2O behavior replacement. No Codex hardware operations.

### Problem / hypothesis / next action
Observed problem: negative PK Apply changes only LEFT in Henry's direct ear check; RIGHT unchanged. Stereo image shifts right and unity restores normal. M2O protocol and audibility passed, stereo failed/unresolved.
Verified facts: every currentdebug190 has word0=0. Pinned official initializer emits same-slot/same-unity0then1; runtime190setter and446getter0 only. No190 capture in57pairs. Source names do not tie selector1 toRight.
Possible causes: word0 is a per-channel target and currentpath0 is LEFT; alternatively another processing path/bank produces the unilateral effect. Headphone/host channel routing is not objectively measured; phaseC can discriminate whether matched path writes restore symmetry.
Ruled out / weakened: selector0 affects both ears in current setup (contradicted byHenry), protocolPASS proves stereo correctness,220rateIndex carries the same190meaning, officialnegative190dualpathwrites alreadycaptured, selector1 is provenRight.
Next validation: A/path0 recordLEFT-only; explicitlyRestore0 andlisten. B/path1 recordear/image without assumingRight; explicitlyRestore1 andlisten. Only ALeft/BRight plusbothrecovered unlock C: samecut0then1, recordequalboth/centered, explicitlyunity0then1 andlisten. Onerror/Q stop, retainlog, no automaticrestore.
Possible fix direction: if A/B/C confirms complementary stereo targets, a later FreeDSP-only sender can explicitly pair190writes per slot with completepreflight/boundedfailure handling; requires separate integration and full-nine stereo gate. No such production change now.

### Command layout comparison
| Command/path | word0 | word1 | words2..7 | Remaining words | Evidence / limits |
|---|---|---|---|---|---|
| Official realtime190 | literal0 | SDKband+5 | Gain,B0,B1,B2,A0,A1 | fivezeros | pinnedDEX setter; one190, not captured negative transfer |
| Current Web/native190 | literal0 | UIindex+1/rawslot | sameGain/fivecoeff schema | fivezeros | current isolated runtime; Henry LEFT-only effect |
| Official initialization190 | 0 then1 for each slot | raw0..9 | 3,4194304,0,0,0,0 | fivezeros | pinnedDEX offsets150/216, unity-only; not generalreset permission |
| Official getter446 | literal0 | SDK+5 or raw1..9list | requestzeros | zero-filledcapacity | getterselects0; no device readback performed here |
| Official Flash220 coefficients | rateIndex4..8 | band1..9 | Gain,fivecoefficients | fivezeros | 45helperTX plusDEX; word0 is NOT190path semantics |
| Official Flash220 metadata/commit | 0/255 respectively | metadata band / unusedcommitzeros | command-family-specificmetadata / zeros | zero-filledcapacity | 9metadata+1commit helperTX; no channellabel evidence |

### Hypothesis ranking
| Hypothesis | Supports | Limits / contradicts | Confidence |
|---|---|---|---|
|190word0 selects coefficient processing target | same-slot0/1initialization;0-onlysetter/getter | fieldunnamed; firmware not inspected | HIGH as target inference, not namedABI |
|0 targetsLEFT in Henry's setup | directLEFT-onlychange/Restore, consistentrightwardimage | listeningreport, no instrumentedL/R measurement | HIGH for reported effect |
|1 targetsRIGHT | complementary0/1initialization plus0left effect | no path1hardware observation; possiblebank/pathsemantics | MEDIUM hypothesis, UNVERIFIED |
|0 broadcastsboth | none undercurrentnegativeexperiment | directRIGHTunchanged | REJECTED for currentsetup |
|190word0 isFlashrateIndex | superficialsimilar220layout | init0/1 vsrate4..8;currentrate queriedseparately346 | REJECTED |

## Evidence for upstream / Issue #3 — M2P stereo finding
Henryreports full-nineRAM protocolApply/Restore PASS and audibleYES, but stereoFAIL: selector0 negativeApply affectsLEFTonly, RIGHTunchanged; unityrestoresLEFT. Thisalsooccurredsingle-band. Current190=[0,rawSlot,Gain,B0,B1,B2,A0,A1,0x5]. PinnedAPK04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5 setDefaultAvailable emits identicalunity190perrawslot0..9 withword0=0then1 (getCmd150/216, sendCmd162/228). LiveSDKsetter stillwrites0only;446getter0only. Helperlog57TX contains90/220/259 andNO190;220rate4..8cannotbenamedRAMchannels. ExistingLeft/RightANCfieldsdo nottie190toLR. Path1/rightisUNVERIFIED. Isolatedsinglewire5A/BthenconditionallyC testprepared; no automaticdualchannelproductionintegration. Need explicitpath1earobservation andpairedpathcenteredreversal beforelaterstereointegration.

### Scope / regression check
- FreeDSP-specific files: newChannelProbe.cs, nativeCLI routing/operationallowlist only, isolatedPowerShellmanualharness/modules. Existing Web/M2O/production sender unchanged.
- Analysis/test files: pinnedname-searchscript/fixture, channelEvidence.test.ts, channelValidation.tests.ps1, native mock tests.
- Shared runtime files changed: native diagnosticProgram.cs/SafeRam.cs routing only; no production browser runtime changes.
- Non-FreeDSP protocol code changed: NO.

### M2P final automated verification
Focused3files/21Vitest tests PASS (pairedunitysource,0-onlysetter/getter,no190dump,220word0families,boundedAPKscan/existingWebcontract). Native61synthetic/mock tests PASS, including fixedpath0/1packetparity and globalpath1rejection, exactselectedpaths/prerequisites, invalid/unknownrate prevention and failureonfirst/secondpaired190withoutrollback. PowerShell7M2Pmockscenarios＋15existingtoggle regression scenarios PASS; manual launcher/module AST syntax PASS. verify.ps1 once exit0: TypeScript/Vite build and19files/155tests PASS. No physical discovery/SET/GET/connect endpoints invoked byCodex. Generateddist restored; intendedgitdiffcheckPASS. M2P isolated manual validation READY, resultNOTRUN; M2O stereoFAIL/unresolved andproductionintegrationstillblocked.

## M2P 中文 toggle UX / baseline 優先 — 2026-10-08（取代先前觀察判讀與循序問卷關卡）
Henry 最初感到 Apply 使聲像右偏、左側減少；後來受控 path0 測試不一致，先前 RAM 狀態可能未清乾淨；之後明確 path0 Restore 在 BOTH 耳產生清楚可聽變化。因此不能沿用「selector0 已確認只影響 LEFT」或推定1=RIGHT；selector0/1 立體聲語義仍 UNRESOLVED，優先建立乾淨 baseline 後反覆切換。M2O protocol/可聽效果 PASS，但 stereo correctness FAIL／未解，仍非 production-complete。
新入口維持 scripts/test-freedsp-native-channel-path.ps1，完整繁體中文說明、主選單 U/0/1/B/Q；進入 path0/path1/both 後 A/R 可反覆切換，Enter/Q 返回持續主選單，O 才自願紀錄聽感。取消或錯誤觀察答案返回模式，不退出、不自動還原；問卷可用 RESTORE/CLEAN 明確選擇立即 Restore／雙pathunity。O 的 R 代表右側，U 代表不確定；不與主選單操作混用。
U 明確呼叫既有 M2PRestoreBoth：預算兩個 unity 封包，依 path0→path1 各190一次；保留188/187/346 prerequisites，失敗即停止，無重試／rollback。逐path顯示 RESTORE PASS/FAIL，只有整體成功才印 Baseline clean: path0 + path1 wire5 unity restored。僅wire5unity命令完成，不是全裝置還原、舊EQ備份或readback。
狀態依本次成功命令紀錄 APPLIED/UNITY，啟動與失敗 UNKNOWN；每個選單及結束摘要持續顯示各path狀態，返回／退出不隱藏仍套用或未知狀態。不強制問卷或宣稱聲道映射通過；Both 可由主選單明確選擇，取代先前依未可靠單側觀察設置的A/B→C關卡。首次Apply耳機離耳、APOOFF、FreeDSP輸出、Windows1–2/100；所有硬體動作均需明確A/R/U輸入。
變更僅PowerShell tester UX、其mock tests及文件；command190語義、native係數／固定wire5／PK400/-12/Q1／RAM流程、Web/M2O/production sender、dev生命週期、非FreeDSP均未修改。Codex未操作硬體。

### Problem / hypothesis / next action
Observed problem: 強制英文問卷造成意外退出與未清楚還原；path0聽感後續不一致，明確Restore影響BOTH耳。
Verified facts: Henry已回報上述觀察；原生Both unity操作已預先建立0/1封包並依序送一次，遇錯停止；此輪保留該操作不改協定。
Possible causes: 前次RAM狀態未清、先前單側效果判讀不可靠；0/1仍可能是聲道／其他處理path，尚不可確認。
Ruled out / weakened: 先前LEFT-only足以定義0=LEFT；未建立baseline的逐耳聽感足以確認左右映射；protocolPASS等於立體聲正確。
Next validation: 先明確U確認雙pathwire5unityprotocol成功，再選0/1/B反覆A/R，同曲同音量；選O才記錄耳側／聲像及當時命令狀態。錯誤停止、保留log。
Possible fix direction: 先取得可重現乾淨baseline的觀察，再決定後續語義／production整合；本輪無production修正。

## Evidence for upstream / Issue #3 — M2P corrected listening classification
Earlier reported RIGHTward image / LEFT reduction is historical observation, not final channel attribution. Later path0 test was inconsistent with possible uncleared RAM; an explicit path0 unity Restore changed BOTH ears. Selector0/1 channel mapping remains unresolved. Static same-slot0/1 unity initialization remains valid; it does not settle the corrected hardware interpretation. Current manual tool establishes explicit both-path wire5 unity and repeatable isolated toggles, with optional timestamped ear/image observations and command-state labels; no new Codex hardware evidence.

### Scope / regression check
- FreeDSP-specific files changed: scripts/freedsp/ChannelValidation.psm1, scripts/test-freedsp-native-channel-path.ps1.
- Analysis/test files changed: tests/freedsp/channelValidation.tests.ps1.
- Shared runtime/native/protocol/process-lifecycle files changed: NONE.
- Non-FreeDSP protocol code changed: NO.

### M2P 中文 toggle 最終自動驗證
Windows PowerShell：11個toggle聚焦mock情境PASS（中文help/menu、U雙path成功／失敗、各模式反覆A/R、返回持續選單、無效／取消O不退出、RESTORE/CLEAN明確逃生、狀態警示、無自動寫入）；既有devBridgeLifecycle7個mock檢查PASS。三份PowerShellAST語法解析PASS。verify.ps1本輪一次exit0：TypeScript/Vite與19files/155testsPASS。Native/protocol/coefficients/mapping/Web/M2O/dev-process sources diff為空；未操作硬體。Generateddist已還原；gitdiffcheckPASS。立體聲mapping仍UNRESOLVED，下一步由Henry先U建立wire5雙pathunitybaseline，再自行反覆切換。

## 2026-10-08 — M2P hardware COMPLETE / M2Q dual-channel Web preparation
Henry completed clean-baseline repeated wire5 PK400Hz/-12dB/Q1 toggles: baselinepath0unityPASS,path1unityPASS; Path0 Ear=L/Image=R; Path1 Ear=R/Image=L; Both Ear=B/Image=C, equal-ear change with centered image. Hardware-derived mapping: selector/path0=LEFT, selector/path1=RIGHT on this FreeDSP setup. Official SDK names remain unnamed; do not present these labels as recovered official field names. This newer controlled evidence supersedes the prior inconsistent/unclean-baseline observations.
Full log reviewed read-only: C:/Users/Henry/AppData/Local/Temp/AuraPEQ/freedsp-m2p-aa02128f24704c3284b5da2b9592719b.log; SHA25626d4efdf43b460874047257705577b4b119c1ec47a85bf5fa00f26d3f42e1c7e. Baseline completionline97; recorded Path0line471, Path1line1131, Bothline1643; all saved in log despite missing prior final aggregate. O may record recollected toggle effects afterRestore; this is Henry's reported listening validation, not an instrumented channel-amplitude measurement. Raw logs remain outsideGit.
M2O protocol/effect/recovery passed but stereo failed because Web190word0 was always0: onlyLEFT coefficient path updated. M2Q changes isolated debug RAM operations to identical path0/path1 pairs for each requested wire; no production replacement. Single-band2writes; full-nine18writes orderedwire1path0,wire1path1,...,wire9path1. Disabled andRestore unitybothpaths. FixednegativePKscope/math/current346 lookup preserved. Precompute/validate allfiveknownrateplans beforeANYSET; matching346 chooses oneplan; unsafeatanysupportedrate rejectsbeforecommands, unknownrate stopsno190. Existing188/187 prerequisites remainexplicit/logged. No retry/rollback; failure may leave unequalchannels andrequiresSTOP/review.
M2Q firstmanualWebgate: fillBand5=400/-12/Q1, explicitpairedApply/listen(bothears equal,center), pairedRestore/listen(bothbaseline), manualconfirmation. Freshpagegate requiredbeforefullnineApply; fullRestore remainsavailablefor explicitunity. Thenfillnegativefullninepreset, paired18Apply/listen/confirmation, paired18Restore/listen/confirmation. No Flash/preamp/positivegain/nonPK/persistence/EQreadback claims; hardwareandprotocolsuccessremainseparate. Codexdidnottesthardware. M2Q softwareREADY, WebstereogatesPENDING.

### Problem / hypothesis / next action
Observed problem: M2N/M2O Web writes path0only, causing LEFT-only EQ and stereo image shift.
Verified facts: Henry's cleanbaseline M2P wire5 repeated toggles establishpath0 LEFT/path1 RIGHT, Both equal-and-centered. Same190coefflayout, channelword0 is onlypairedpacketdifference. Allthreeobservations saved in full log; priorCLI finalaggregation omission corrected.
Possible causes: omissionofpath1 fullyaccountsfortheobservedWebstereodefect given currenthardwaremapping; no newcoefficient/math defect established.
Ruled out / weakened: path0 broadcasts stereo,1notrightunderthissetup, protocolcompleteisfullstereovalidation,missingCLIaggregate meansBoth observationwaslost.
Next validation: Henry's isolatedWeb Band5 dualApply/Restore equal-ears/center/recovery gate, then full-nine18pairedwrites andunityRestore. Stopfailure/unequalresults,retainfullWeblog.
Possible fix direction: currentisolatedpairingimplementation; productionintegrationonlyafterseparateWebhardwarevalidation andlaterexplicitround. NoFlash/preamp/nonPK/positivegain.

## Evidence for upstream / Issue #3 — M2Q
CleanbaselineM2P wire5 PK400/-12/Q1 hardware:0changesLEFT/EarL/ImageR;1changesRIGHT/EarR/ImageL; pairedsameEQ changesboth/EarB/ImageC. UnitybaselinebothpathsPASS, repeatedreversibleoperationsPASS. Labelsarehardwarederived,notofficialSDKfieldnames. PinnedSDKunityinitialization0then1nowalignswithobservedcomplementarystereopaths; officialsingle190setterstill0only andhistorical57helperpairsstillNO190. PreviousWebbuilderonly0explainsM2Ostereodefect. IsolatedM2Q addswire1..9 paired0/1current-rate190,18writesfullstate,fullpreflight,boundedmatchingCAF,stopfirstfailure/noauto-retry/rollback. Native1LSBquantizeruncertaintyunchanged. WebBand5+fullnineM2QstereoverificationisPENDING; production/Flash/preampunchanged.

### Scope / regression check
- FreeDSP-specific files: tools/freedsp-native/RamDebug.cs, src/freedsp/webRam.ts, src/freedsp/ramDebugPage.ts, freedsp-ram-debug.html; optionalM2PCLIaggregate in scripts/freedsp/ChannelValidation.psm1.
- Analysis/test files: nativeTests/Program.cs, tests/freedsp/webRam.test.ts, ramUiStartup.test.ts, channelValidation.tests.ps1.
- Shared production runtime / bridge HTTP API / process lifecycle files changed: NONE.
- Non-FreeDSP protocol code changed: NO.

### M2Q final automated verification
Focusedfrontend2files/19testsPASS; native63synthetic/mocktestsPASS, includingexact2/18writes,currentratepairedcoeffparity,disabled/Restorebothunity,five-ratepreflightfailurebeforeanySET andfailureateachofthe18positionswithnoextraSET/rollback/falsecompletion. M2P12PowerShellmockscenariosPASS includingfinalsummaryaggregation. verify.ps1onceexit0: TypeScript/Vitebuild and19files/156testsPASS. Productionbrowserruntime,SafeRam/ChannelProbe/math,bridgeAPI,devprocesslifecycleunchanged. Generateddistrestored; intendedgitdiffcheckPASS. No physicaldiscovery/connect/SET/GETbyCodex. M2P hardware COMPLETE; M2Q softwareREADY withWebBand5＋fullnine18-writestereoreversalhardwarePENDING; no persistence/readback/productioncompletion claim.

## 2026-10-08 — M2S transport capability correction / native main-page candidate
### Research checkpoint
- Examined: Henry single real WebHID Restore result, existing M2G evidence, shared CAF/maths, exact native collection/SET/Input-GET implementation and owned dev lifecycle.
- Verified hardware evidence: original CONNECT/open/identity ONLINE PASS;188 sendReport PASS; matching inputreport NONE/TIMEOUT; STOP/no retry/no190. Prior native Input GET_REPORT response PASS. PEQ wire1..9/stereo/positive/negative hardware evidence is retained, not retested.
- Decision: pure WebHID BLOCKED; common TypeScript RAM protocol session with minimal native exchange transport is the normal-main-UI candidate. WebHID exchange retained for diagnostics/mocks only.
- Unresolved: native main-page end-to-end hardware gate and per-packet child startup timing; offline mocks cannot confirm them.
- Next validation: deterministic mock/parity/native offline tests, then Henry normal CONNECT/Restore/explicit mixed Sync/local edit/explicit Sync/Restore. No Codex hardware access.

### Problem / hypothesis / next action
Observed problem: original WebHID sends188 but no matching event, so first Restore stops before190.
Verified facts: safe STOP worked; Windows native host-initiated Input GET_REPORT previously works; same PEQ/mapping evidence retained.
Possible causes: browser transport capability gap; no evidence of a new coefficient/PEQ defect in this attempt.
Ruled out / weakened: sendReport success as DSP success, ACK weakening, automatic retry or skip188/187/346.
Next validation: one normal UI workflow over native transport candidate, after offline checks; Henry alone performs hardware validation.
Possible fix direction: common TypeScript serializer/math/safety/packet preflight -> CafTransport -> exact-scoped native SET once + bounded Input GET; preserve other DAC WebHID.

## Evidence for upstream / Issue #3 — M2S transport correction
Physical CAF remains ID1/61 data bytes (native62 including ID), exact35D8:1496/consumer0x0c:1/MI03. Single real browser Restore188 sends successfully but zero matching inputreport, timeout correctly stops with no190, matching earlier M2G zero events. Native HidD_GetInputReport has matching response evidence. Pure WebHID unsupported for this verified response flow. Main UI stays CONNECT/edit/explicit RAM Sync/Restore; shared TS serializer/math/safety/business, native metadata + per-packet transport primitive only. Windows/.NET10 development helper dependency is explicit; no browser-only/packaged production claim. Flash/preamp/EQ readback/persistence remain disabled/unsupported. Native main-page hardware validation pending.

### Research checkpoint — native adapter implementation / offline completion
- Implemented: CafRamSession common TypeScript preflight/safety/math/188->187->346->18 paired190; nativeTransport preserves shared bytes exactly and validates actual matching reply; session routes original CONNECT to metadata only. Browser handle released before native ownership. Other DAC open path preserved.
- Native serveTransport exposes session/connect/transport only; no /ram business endpoint, no coefficient calculation on primitive path. Exact62/ID1/module/command/field-shape gate before discovery, single exact scoped SET and existing bounded fresh-buffer Input GET. Native diagnostic math retained only as reference/fixture tooling.
- Lifecycle: default dev.ps1 owns hidden helper, exact DLL/path/creation-time/PID checks accept serveTransport/serveDebug; -WebHidOnly is other-DAC fallback. Session/exchange HTTP35s, native child30s kill-own-tree, polling1000ms (346 firstGET excludes clock as validated); first error stops without retry/rollback. Disconnect aborts HTTP but cannot undo an already-sent SET, so partial RAM state remains possible/unknown.
- Verified offline: focused33 frontend tests,69 native synthetic tests (including fake loopback HTTP), owned-process mocks and dev.ps1 parser PASS. Final verify.ps1 PASS: build +194 tests/22files. No real helper/service/device opened by Codex; isolated native build output only.
- Hardware gate PENDING: Henry restarts dev, original CONNECT, explicit18write Restore; safe band5 negative Sync/listen stereo, local edit produces no writes, explicit Sync then unityRestore. Stop first error. No browser-only claim; no Flash/preamp/readback/persistence.

### Scope / regression check
- FreeDSP-specific files changed: src/freedsp/cafRam.ts, nativeTransport.ts, session.ts, webHid.ts; tools/freedsp-native transport/bridge entry/exchange hook.
- Analysis/test files changed: FreeDSP frontend/native fixtures tests and lifecycle mocks.
- Shared files changed: src/fn.ts, src/dsp.ts, index.html (FreeDSP-only dispatch/status), scripts/dev.ps1/lifecycle (managed helper), four docs.
- Non-FreeDSP protocol code changed: NO. Other-DAC CONNECT open regression mock PASS. No CAF190/math/mapping changes; no hardware actions.

## 2026-10-08 — M2S main graphical PEQ hardware PASS / PEQ UX cleanup
Henry reports original CONNECT/native HID adapter, graphical local editing, nine-band stereo RAM Sync, unityRestore, positive/negative PK, centered stereo and local-editor/RAM separation all hardware PASS. This supersedes the previous native main-UI PENDING classification; pure WebHID remains BLOCKED. This is Henry-reported listening/protocol evidence, not instrumented readback or persistence proof.

### Research checkpoint
Examined: existing upstream/main fn.ts reset/default/A/B semantics; slider/numeric/graph callbacks; file/text/AutoEq/custom profile entry; saved state, undo/redo and Slot restores; normal safety modal, retired debug cap, Vite hostname.
Verified: HTML min/max alone did not clamp numeric gains; setEQ lacked gain guard; imports and snapshots bypassed that input. Generic Defaults rebuild10/Q.75 (JA11 own5); generic Flat rebuilds existing count at1000Hz/Q1/PK/enabled then Sync. Slots are host snapshots: A=current baseline, B=default flat, switching saves current side; OFF restoresA then clears comparison. They are not FreeDSP hardware banks.
Decision: exactFreeDSP only, one visible editor policy = finite gain clamp±12 with page-log notice. Nonfinite direct gain rejected; invalid old snapshot gain becomes0 with notice. All render/import/history/Slot paths normalize9 indices; Sync still rejects raw invalid values without hidden gain substitution. Free defaults31/62/125/250/500/1000/2000/4000/8000Hz, gain0/Q.7/PK/enabled. Free Flat preserves frequency/Q/type/enabled and zeros enabled gains only. Both are local-only, reset comparison state, no hardware TX.
Implementation: remove temporary+6 positiveSum/+6.1 sampledPeak caps from shared normal session and historical diagnostics. Keep finite/PK/range/frequency/Q/Nyquist/quantized stability/signed24 preflight. Main positive-response warnings use original modal thresholds (>10 single, >12 composite estimate, >15 positiveSum); Proceed explicitly Sync, Cancel noTX. AUTO REDUCE adapts FreeDSP local band gains only, no unsupported preamp/no autoTX. Limits are listening warnings, not hardware headroom limits.
Remaining: smoothing/atomic coefficient update UNKNOWN; no command/payload/ACK/math change. Next milestone Preamp research, not started this round.

### Problem / hypothesis / next action
Observed problem: temporary development cap blocked valid larger positive profiles; range handling/reset semantics differed between editor entry paths; clickable127.0.0.1 URL conflicted with helper exact localhost Origin.
Verified facts: normal native graphical PEQ hardware PASS. Approximately18 quiet repeatable pops per full Apply/Restore, roughly one per LEFT/RIGHT path write (9x2); not abnormally loud/non-blocking. Earlier about9-pop observation is superseded in precision.
Possible causes: hot coefficient/state update timing correlates with each190; causation and firmware smoothing remain UNKNOWN.
Ruled out / weakened: +6dB as proven hardware limit; generic10-band default for FreeDSP; Slot hardware-bank interpretation; send success as DSP/readback proof.
Next validation: offline editor/transport/native/parity mocks and canonical Vite HTTP; Henry may inspect updated UI normally. No Codex hardware access.
Possible fix direction: common FreeDSP editor normalization and local9 defaults, original warnings, localhost bind/display. No pop suppression/extra hardware commands without evidence.

## Evidence for upstream / Issue #3 — main PEQ PASS and UX cleanup
Native adapter under original CONNECT/graph/edit/explicitSync/Restore now Henry hardware PASS: wires1..9 paired path0LEFT/path1RIGHT, positive/negativePK, centered stereo, recovery, local/RAM separation. Verified per-band range remains−12..+12; development sum6/peak6.1 limits are removed, not hardware restrictions. All Free editor inputs clamp visibly to±12 and Sync never substitutes unseen gain; nine default layout and structure-preserving Flat are local-only. About18 quiet repeatable pops correlate with18 individual190 path updates; non-blocking, cause/smoothing/atomic update UNKNOWN. Pure browser WebHID reply flow still blocked; Windows native Input GET remains required. Flash/preamp/tilt/utilities unsupported or UNKNOWN pending their own evidence.

### Current roadmap (supersedes prior PEQ validation queues)
1. Preamp / global gain.
2. Channel Balance.
3. Global Tone Tilt Bass/Treble.
4. Microphone and remaining Device Utility Controls.
5. Flash / persistence LAST.
For each: SUPPORTED BY FREEDSP EVIDENCE / UNSUPPORTED / UNKNOWN. Do not reuse generic Aura commands by assumption. Tone Tilt remains disabled until researched. No future milestone implemented in this round.

### Research checkpoint — PEQ UX offline completion
- Focused frontend90 tests/6files PASS: endpoints±12, ±12.1/+14/−15 through slider/numeric/graph common callback, actual text preset loader/render, snapshots/undo/redo/Slot, default/flat, warning+Proceed, invalid-input rejection/localAutoReduce, existing other-DAC gain/reset behavior and native packet preservation above old+6 cap.
- Native69 synthetic/offline tests PASS; actual21-vector parity unchanged. PowerShell lifecycle mocks/parser PASS. Isolated Vite random-port localhost URL and HTML HTTP200 PASS; configured canonical localhost5173. No real helper or device started by Codex.
- Final verify.ps1 PASS: TypeScript/Vite build and227tests/23files. git diff --check PASS after generated build artifacts excluded. No hardware actions, no packet/ACK/transport/mapping/coefficient algorithm change.
- Remaining: Preamp is next milestone; channel balance/tilt/microphone/utilities/Flash require their own evidence. Quiet18-pop mechanism remains UNKNOWN.

### Scope / regression check
- FreeDSP-specific files changed: editor helper; shared FreeDSP RAM model/session; historical debug UI/native development-gate removal.
- Analysis/test files changed: FreeDSP editor/transport/diagnostic/frontend/native offline tests.
- Shared files changed: src/fn.ts and src/main.ts (FreeDSP guarded editor/reset/warning only), scripts/dev.ps1 and vite.config.ts (canonical localhost), existing four docs.
- Non-FreeDSP protocol code changed: NO. Original other-DAC gain/default/flat and generic Sync behavior tested unchanged.

## M2T controls — research checkpoint
Examined: upstream reset/tilt/preamp/mic source and history; pinned official APK Freeman3 device/controller/session/feature configuration and native symbol names; existing 57 helper pairs and Issue #3 evidence.
Verified: generic Tone Tilt has independent editor state and displayed shelves, but serializes center-frequency gain offsets into existing PEQ bands, not two additional hardware shelves. Mic meters use Math.random; the toggle has no actual loopback/capture implementation. Auto Preamp computes a gain then depends on the device global-gain sender. The old Conexant sender is a no-op. No new control command is established by these sources.
Hypotheses: FreeDSP may expose gain/mic controls through another interface or unexamined firmware; this is not implementation evidence.
Discarded: command190 coefficient Gain exponent as dB preamp; generic utility commands as FreeDSP evidence; LRDetect feature bits as balance; random meters as input levels.
Unresolved: true master/per-channel gain mapping, tone support independent of nine PK wires, mic gain/loopback/input reporting.
Next search target: reproducible all-DEX Freeman control inventory and complete conversion/config method instructions; clarify unavailable controls only for FreeDSP, no speculative writes.

## M2T controls milestone — classification and implementation

### Research checkpoint — official control boundaries
Examined: pinned official Moondrop Link APK v2.25.0c-260813ai, SHA256 04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5; all classes.dex/classes2.dex (153/0 com/conexant classes), complete Freeman Device/Controller/Session inventories, selected full Java conversion/config instructions and arm64 native symbols/JNI gain instructions. Reproduce with scripts/freedsp/inspect-controls.py APK PYTHON_LIBRARY_DIRECTORY; checked-in tests/freedsp/fixtures/officialControlsEvidence.json is static evidence, not hardware capture.
Verified: the only control-name methods are CommonUtil conversions. convertGainIndex(F,I) calls its native wrapper; native 0x26b0..0x2710 is pure arithmetic/return, no transport calls. Selector0 converts gain using 63/30 and offset63; selector1 uses (gain-40)*63/80+63 before integer conversion; other selectors return0. These are conversion selectors, NOT proven audio paths or a FreeDSP command. formatBandGainValue/getOriginalGainValue convert between dB and 2^6-scaled linear gain; these utilities alone establish no master-gain application path. No com/conexant DEX caller links them to setFreeman3EQ in this APK.
Verified: getFeatureConfigFM3 uses command346 with request words84/64 and returns EQInFW/HiFiFM/LPM/dongle LRDetect/diagnose flags; no globalgain/balance/mic map. getFreeman3EQConfig uses442 and reads sample-rate metadata. No queries were sent. MonitorButtonReport native symbols concern button reporting; CX2077x_MIC_BIQUAD conversion symbols concern generic math, not verified FreeDSP mic control. Existing 57 helper pairs (90/220/259) contain no identified mastergain/balance/mic transaction. Prior command190 Gain is the coefficient scaling exponent, not dB preamp.
Limitations: no firmware/Dart AOT/reflection/UAC Feature Unit descriptor audit or physical transfer capture this round. Absence from these inventories is UNKNOWN support, not proof hardware cannot support a feature. Manufacturer microphone presence does not prove gain/loopback/meter controls: https://moondroplab.com/en/products/freedsp (Microphone shielded cable).

| Control | Evidence / original behavior | FreeDSP classification | Implementation | Hardware validation |
|---|---|---|---|---|
| Negative/positive Preamp | Old Conexant sender introduced e7da5b5 is a no-op; APK conversions are not commands | UNKNOWN | Disabled with reason; no EQ stacking | No evidence-backed new test |
| Auto Preamp | Calculates sampled response peak, targets negative gain, then calls hardware global gain setter | UNKNOWN dependent command | Disabled, including delayed saved-state initialization; generic preferences preserved | Not eligible |
| Channel Balance | Generic utility packet on change; no FreeDSP dedicated/per-channel globalgain mapping | UNKNOWN | Disabled, no alteration of nine PEQ gains | Not eligible |
| Bass/Treble Tone Tilt | Independent host state; displayed105/8000Hz shelves; hardware uses band-center tilt offsets | UNSUPPORTED by current FreeDSP PK adapter; independent hardware support UNKNOWN | Disabled with reason; no user slots consumed | Not eligible |
| Microphone presence | Manufacturer product cable specification | SUPPORTED physical presence | No software capture claim | No new Codex hardware check |
| Mic gain / loopback / input levels | Generic gain packet is another protocol; main monitor toggle only animates Math.random levels | UNKNOWN FreeDSP controls; actual loopback/meter is unimplemented here | Disabled, animation canceled and meters cleared; unavailable label | Not eligible |
| Nine-band PK and unity Restore | Henry's normal native main-page positive/negative/stereo/18-write PASS | SUPPORTED | Existing explicit Sync/Restore unchanged | Already PASS |

### Original application and reset audit
Tone Tilt introduced b080ad8 (2026-06-16) changes separate host Bass/Treble state, not visible band gains. Graph renders LSQ/HSQ mathematical shelves; writeBand and generic Sync serialize existing band gain plus tilt at that band's center (clamped), not extra LSQ/HSQ filter allocations or dedicated tone commands. Input events can schedule realtime band writes on other DACs; it is not universally display-only until Sync. Thus graph shelves do not establish equivalent hardware shelves. FreeDSP guard prevents scheduling these writes; its nine PK plan has no Tilt implementation. No rapid new control writes added.
Preamp input normally applies immediately; Auto Preamp is host calculation plus device gain application. Balance and mic gain normally apply on change, and generic utilities may subsequently refresh storage. None are reused for FreeDSP. Generic monitor toggle has no actual USB/audio loopback operation.
Generic Defaults intentionally constructs10 frequency-spaced/Q.75 bands (JA11 has separate5). Flat constructs existing count at1000Hz/Q1/PK/enabled/gain0 and Syncs. Commit ea93274 (2026-06-09) explicitly implements that neutral reset: coded legacy/generic behavior, not a browser rendering failure; user-facing design rationale is not established, so not classified as a proven bug. Other DAC reset semantics unchanged. FreeDSP defaults9/Q.7 and Flat preserving frequency/Q/type/enabled with zero enabled gains remain local-only and now Henry hardware/UX PASS.

### Problem / hypothesis / next action
Observed problem: generic UI exposed controls without a verified FreeDSP command map and could display stale Tilt or simulated microphone levels after connection.
Verified facts: original main native transport/PK/stereo/defaults/flat hardware PASS; no validated mastergain/balance/mic command in reviewed evidence; Tone Tilt hardware serialization is band-center gain approximation. About18 quiet pops correlate with18 path writes; exact cause remains UNKNOWN.
Possible causes: additional controls may be implemented by unexamined firmware, Dart/FFI or USB Audio feature controls instead of the reviewed CAF API.
Ruled out / weakened: coefficient Gain exponent as preamp; LRDetect as balance; mic math exports/button monitoring as audio control; random meters as measured input; generic utility packets as FreeDSP commands.
Next validation: obtain a documented exact FreeDSP master/per-channel gain control or one actual official control transfer with interface/report/module/command/payload, units/sign/range and reply; for USB Audio controls, complete Feature Unit descriptors/entity IDs are needed. Without that artifact, listening tests with invented commands are not justified.
Possible fix direction: integrate proven commands in the existing main UI/shared adapter, preserving nine user PEQ slots and native transport-only responsibility. No additional hardware tests are eligible this round.

## Evidence for upstream / Issue #3 — M2T controls
Original main-page native transport, nine PK wires x two hardware-derived LEFT/RIGHT paths, positive/negative gains and unity Restore are Henry PASS; defaults9/Q.7 and structure-preserving Flat also PASS. Pure browser reply flow remains blocked; ID1 data61/native62 unchanged. Old Conexant globalgain is a no-op. Pinned official APK all-DEX Freeman API/config and native gain conversion inventory does not establish master/per-channel gain, tone or mic command mappings. command190 Gain is coefficient exponent; 346 LRDetect is not balance. Generic Aura Tilt separately renders shelves but serializes band-center gain offsets; generic mic meters are random animation, not input measurement. These controls are disabled only for FreeDSP, with explicit UNKNOWN/unsupported explanations. Need documented command/interface semantics or actual official control transfer/UAC descriptor evidence before new integration. No speculative packets, no Flash, no persistence/readback claim.

### Combined manual validation — one normal main-page session
Start .\scripts\dev.ps1 and open http://localhost:5173/; original CONNECT DAC. Confirm nine defaults, Preamp/Auto/Tilt/Balance/Mic disabled with the new explanation, zero Tilt/preamp display and no mic animation. Existing PK Sync/Restore remains available independently of invalid editor values. No new preamp/balance/tilt/mic hardware test is eligible: do not send experimental commands. If checking existing PEQ regression, use normal audio/low volume and one explicit safe negative PK Sync then unity Restore, both ears centered; this is optional regression, not new control validation. No test tones. Flash remains LAST/disabled.

### Research checkpoint — M2T verification and scope
Focused controls/editor/native-transport tests:51 PASS. Final verify.ps1: TypeScript/Vite production build +235tests/24files PASS (after updating an existing VM harness for new UI dependencies). Native69 synthetic tests PASS, including FAKE HTTP loopback only; isolated build output, no device/native discovery. Initial sandbox loopback restriction resolved with authorized mock-only execution. No new preamp/balance/tilt/mic implementation or hardware validation claimed.
### Scope / regression check
- FreeDSP-specific files changed: src/freedsp/controls.ts (evidence policy/notes only).
- Analysis/test files changed: pinned inspect-controls.py and officialControlsEvidence.json; controls.test.ts; existing webHid VM dependencies.
- Shared files changed: src/fn.ts, src/main.ts, index.html (exact-FreeDSP UI guards/display only); four project docs.
- Non-FreeDSP protocol code changed: NO.
- CAF/native transport, command190, coefficients, mapping, RAM plan and Flash behavior changed: NO. Other-DAC control/reset regression mocks PASS.

## M2U Preamp deep research — checkpoint 1
Examined: existing M2T pinned APK evidence/57 official helper pairs/HID-only metadata; fresh public upstream Issue #3 and fork list; commit-pinned FreeDSP Studio, devicePEQ Conexant handler/capture and DacVolumeFix USB Audio source; USB-IF Audio1.0 specification.
Verified: FreeDSP Studio routes35D8:1496 to gen1/baked preamp and scales an existing biquad numerator; its separate preamp register is gen2, not this device. This is excluded PEQ emulation, not a new global-gain command. devicePEQ capture contains non-byte integers and no replies, so its write-only claims are not primary USB capture evidence. Current local descriptor fixture is HID metadata only, not AudioControl/Feature Unit descriptors.
Hypotheses: USB Audio Feature Unit volume is the remaining plausible non-CAF route; device-specific entity/control support and placement relative to DSP are unproved.
Discarded: gen2 register transplant; public coefficient preamp as independent control; generic USB volume success as proof of pre-DSP headroom.
Unresolved: full FreeDSP AudioControl topology/control/range, dedicated master gain CAF command.
Next target: one additional targeted all-DEX call/data-flow and all-arm64 symbol/string scan, actual UAC topology evidence, upstream fork/history deltas. No hardware actions or speculative commands.


### Research checkpoint — M2U boundary and native data-flow complete
Examined: all DEX boundary calls (11,398 +487 classes), all36 arm64 ELF symbol/targeted-string inventories, nine Conexant JNI declarations; targeted PCM JNI/body/PLT resolution; cached Freeman command constructors and volume-button callbacks; refreshed upstream history/Issue3/forks; public implementations; USB-IF UAC1/UAC2 and Windows endpoint volume documentation.
Verified facts: 23 relevant Android API boundary calls, five direct USB controlTransfer sites. Two vendor transfers are Comtrue type0x43/0xC3, requests0xA0/0xA1, index0x09A0; one is string GET_DESCRIPTOR; two are generic HID forwarding wrappers. No direct getRawDescriptors invocation found by this DEX pass. No recovered UAC volume request in these direct sites. PCM setter calls powf(10,gain/20) then stores the software mixer float. HID volume keys dispatch IUsbKeyEventListener callbacks, not a gain setter.
Hypotheses: actual Feature Unit volume may offer independent attenuation; hidden Dart/FFI pregain routing may apply to a different supported device. Both lack an exact FreeDSP mapping.
Discarded: JNI gain conversion as hardware transmission; software PCM gain as CAF preamp; generation2 pregain transplant; biquad numerator scaling as real preamp; host volume as proof of pre-PEQ headroom.
Unresolved: exact1496 full USB Audio topology and writable controls; an official Dart-to-device pregain dispatch/call graph; firmware/SDK globalgain mapping.
Next search target: exact-device descriptor/control evidence or an official1496 gain-transfer mapping. No guessed packet or hardware test. All requested major evidence classes have been checked within the documented scope; absence of a mapping is not proof of absent firmware capability.

### M2U candidate evidence table
| Source | Control / transport | Payload / selector / gain representation | Strength for exact1496 real preamp | Remaining unknown / decision |
|---|---|---|---|---|
| USB-IF Audio1/2; exact device registered as USB audio in public host log | Feature Unit volume / endpoint0 class control | CS=2; wValue=(2<<8)|channel; wIndex=(unitID<<8)|ACinterface; signed16 LE dB/256 | LOW device-specific; HIGH standard definition | Missing bcdADC, topology, permissions, entity/interface/channel IDs, range and pre/post DSP position; no harness |
| Official libapp.so | setPreGain / getSpvPreGain / USB/BLE pregain debug strings; transport unassigned | No recovered exact1496 payload or scale | LOW | Dart AOT dispatch/dataflow unresolved; names alone not evidence of FreeDSP support |
| Official PCM JNI/ELF | setGlobalGain / in-process PCM mixer | JNI(long handle,float gain); 10^(gain/20), store object+4 | HIGH software classification; rejected hardware candidate | Setter has no USB/HID call; software playback gain is outside requested preamp |
| Official Conexant CommonUtilNative | convertGainIndex and fixed-point helpers / JNI arithmetic | Gain-index formulas / Q conversions, no transfer | HIGH rejected classification | No hardware command caller recovered; command190 Gain is coefficient exponent |
| FreeDSP Studio exact35D8:1496 gen1 | baked preamp / CAF coefficient write | Multiply a selected biquad numerator by10^(preamp/20) | HIGH excluded emulation | No independent global-gain register in this implementation; does not prove firmware absence |
| Hub_Moon Mini98D4/newer Hub; FreeDSP Studio gen2 | pregain / HID0x4B command0x23 | signed16 dB/256 in other-generation protocol | LOW for1496; reject transplant | Different IDs/report/protocol; no1496 mapping |
| Airoha SDK get/setMasterGain | leftGain float / Airoha payload object | Float field, not Freeman CAF | Rejected | Other chip family; no bridge to exact FreeDSP |
| DacVolumeFix generic USB Audio implementation | Feature Unit / class control | Parsed entities plus speculative fallbacks | LOW for1496 | Apple reports and expected CX31993 compatibility do not validate this FreeDSP; do not reuse brute-force fallbacks |
| devicePEQ Conexant handler and capture | EQ90/220; deviceHandlesPregain=false | Derived arrays include values outside byte range; no reply capture | No real gain mapping | Not primary transfer evidence; no AudioControl descriptor |

### Official CAF / packet inventory reviewed
All57 existing helper TX/RX pairs:90x1,220x55,259x1. They are helper buffers, not a USB Audio endpoint0 capture. No distinct globalgain exchange can be identified from them.
Cached official Freeman method constructors:187 bypass,188 EQ enable,190 per-path/per-slot RAM coefficient,220 EQ Flash,259 chip/firmware query,346 query subkeys62 currentrate and84/64 feature configuration,442 Freeman EQ configuration,446 Freeman per-band parameter query,477 older EQ parameter list,90 mode switch. Source methods and surrounding constants are stored in officialPreampCommandEvidence.json. Constant extraction is textual, not a branch-aware proof; method names alone do not exhaust firmware semantics. No globalgain setter recovered in these constructors. No packets sent; query recognition is not hardware readback verification.
190 [path,slot,Gain,B0,B1,B2,A0,A1,...] exponent/scaled coefficients remain unchanged. Initialization188/187/346 and18 paired190 writes are unchanged. Neither spare payload words nor unclassified firmware command space justify invented gain writes.

### Evidence inventory / provenance and search limits
- Pinned official APK2.25.0c-260813ai102034, SHA25604756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5, official download retrieved2026-10-07. M2U inspect-preamp.py reuses M2D extraction and adds all-DEX boundaries/all36 arm64 symbols/targeted strings plus targeted JNI disassembly. Static only, no app/native execution. Fixtures record original instructions and PLT targets.
- Official Conexant JNI declarations/config/gain conversion from M2T retained. Cx libraries expose no discovered independent mastergain symbol in reviewed inventory. libapp.so has53 pregain/volume-related strings, including /usbPeqPreGainDebug and /blePeqPreGainDebug; Dart AOT call graph was not reconstructed. Native libusb presence alone does not identify actual requests. This is a specific remaining analysis gap, not a claim all binary functions were semantically decompiled.
- Upstream [af0bcf7057860307bf81b00746f0cbdb93366514](https://github.com/mandy321/Audiocular-Aura/tree/af0bcf7057860307bf81b00746f0cbdb93366514),2026-09-29; DSP history retains setGlobalGainConexant no-op introduced ine7da5b5, not a removed working setter. Issue3 refreshed2026-10-08:31 comments/latest update2026-10-06; no actual gain control capture. Henry's old -20dB/no-effect report does not reveal a gain command.
- Four public forks examined including this fork:jo3tp6tw/phucho2306 no ahead commits at comparison; Ircama's two ahead commits only deployment workflow; our fork is known integration. No new gain mapping in those deltas.
- [FreeDSP Studio100c533](https://github.com/EffectiveEquivalent/FreeDSP-Studio/blob/100c533370a2ecde350a56d4fa04c2ac82e0bbfc/tools/app/src-tauri/src/dsp.rs),2026-09-21: exact1496 baked preamp; gen2 separate register does not transfer. [devicePEQ0617f38](https://github.com/jeromeof/devicePEQ/tree/0617f382e76629792a5933e6933e4b396a756a93),2026-08-26: inspected config/handler/capture/test, no real preamp. [DacVolumeFixb102f09](https://github.com/DeveshTone/DacVolumeFix/tree/b102f0921ea484037f1728caf36ef03805f1630f),2026-09-07: generic UAC code, not this device evidence.
- [Hub_Moon](https://github.com/MiyukiVigil/Hub_Moon/blob/main/moondrop_hub_reverse_engineering.md): different generation pregain. jgoodliffe/moondrop_macOS explicitly excludes Conexant FreeDSP. Conexant-authored CX2077x short marketing datasheet discusses volume buttons/mic gain/AGC but provides no exact FreeDSP firmware command table. Generic freeDSP/ADAU project search hits discarded as unrelated.
- [Public exactVID/PID host log](https://paste.cachyos.org/p/5f62904.log) identifies USB audio/HID interfaces but lacks AudioControl entity/range descriptors. linux-hardware exact-ID page was unavailable and was not treated as inspected evidence. No complete descriptor found in repository/fixtures/public sources reviewed.

### USB Audio control findings
[USB-IF Audio1.0](https://usb.org/sites/default/files/audio10.pdf) Feature Unit volume: channel0 master,1..n logical channels only if descriptor permits; SET_CUR request1, GET_CUR0x81/MIN0x82/MAX0x83/RES0x84; direction/type0x21/0xA1, two-byte signed1/256dB. [Audio2 with ECNs through2026-09-14](https://www.usb.org/sites/default/files/Audio2_with_Errata_and_ECN_through_Sep_14_2026.pdf): CUR1/RANGE2; volume permission bits3..2 per master/channel; 00absent/01read/11read-write,10reserved. RANGE describes MIN/MAX/RES. Device version/support cannot be inferred from VID/PID or HID descriptor.
Mixer/Processing/Extension units likewise require descriptors and supported control semantics; no recovered FreeDSP entities. The known reportID1/data61 and HID consumer usage are unrelated to these AudioControl descriptors. HID GET_REPORT is not UAC GET_CUR.
[Windows endpoint volume](https://learn.microsoft.com/en-us/windows/win32/coreaudio/endpoint-volume-controls) may use hardware or software, depending on endpoint capability; playback volume success would not prove physical Feature Unit support or pre-PEQ placement. No OS endpoint/device probe performed.

### Problem / hypothesis / next action
Observed problem: PEQ RAM is hardware PASS, but main-page Preamp has no proven real FreeDSP control and stays disabled; old Conexant setter is a no-op.
Verified facts: reviewed CAF APIs/packet families and JNI gain helpers provide no identified independent gain mapping; PCM globalgain is software; public exact-device preamp implementation uses excluded PEQ scaling; local descriptor is HID-only.
Possible causes: firmware may expose a UAC volume unit, an undocumented CAF control, or an exact-device Dart/FFI path absent from reviewed mappings. Endpoint volume might be post-DSP and therefore unsuitable for internal headroom.
Ruled out / weakened: coefficient exponent as preamp; software PCM/JNI arithmetic as transport; copied gen2/Comtrue/Airoha commands; PEQ emulation; Windows volume as proof of pre-DSP control.
Next validation: obtain exact35D8:1496 full USB configuration/AudioControl descriptors including source topology/bcdADC/control bits, then confirmed CUR/RANGE or MIN/MAX/RES evidence and gain location; alternatively official firmware/SDK or exact-device official pregain call/transfer with payload/reply. No hardware action requested this round.
Possible fix direction: only after exact mechanism evidence reaches MEDIUM/HIGH, use an isolated bounded negative-gain diagnostic or existing main Preamp UI respectively. Preserve shared TypeScript semantics/native transport-only split. No positive gain, Flash or speculative fallback.

## Evidence for upstream / Issue #3 — M2U real preamp
PEQ nine wires x LEFT/RIGHT RAM and native transport are Henry hardware PASS. Independent preamp remains unresolved; setGlobalGainConexant is a no-op. Pinned official APK boundary/arm64/targeted JNI research separates software PCM gain from USB controls; no independent1496 gain command established. Existing57 helper pairs cover90/220/259 only. FreeDSP Studio gen1 implements preamp through PEQ numerator scaling, excluded here; newer Hub pregain is another protocol. UAC Feature Unit volume is the best remaining research route, but full exact-device AudioControl descriptor/control/range and pre-DSP placement are missing. Dart USB/BLE pregain strings remain unassigned to exact1496. Need that primary evidence before a real Preamp implementation; no invented packets, no firmware-absence claim, Flash remains last.

### Scope / regression check — M2U
- FreeDSP-specific files changed: offline inspect-preamp.py and pinned forensic fixtures/test only.
- Shared runtime files changed: NONE.
- Non-FreeDSP protocol code changed: NO.
- Hardware actions, CAF/RAM transport/math/mapping changes: NONE.

### M2U automated verification
Focused preamp evidence tests:5 PASS. Final verify.ps1: TypeScript/production build PASS;240 tests across25 files PASS, no hardware. git diff --check PASS. No production runtime changes; analysis/test/docs only.


## Control Research Round1/4 — exact USB AudioControl / Feature Unit COMPLETE
Budget: Round1COMPLETE,3 rounds remaining. Round2 official pregain exact-device callchain; Round3 remaining CAF/firmware; Round4 cross-validation/finaldecision. Do not exceed4 without explicit Henry authorization. After4 unresolved controls freeze UNKNOWN/UNSUPPORTED; move to Flash/persistence then release cleanup/upstream PR. PEQ RAM hardware PASS; real preamp remains highest control priority. This round does not start Round2.

### Research checkpoint — exact physical descriptor acquisition
Examined: present Windows PnP exact35D8:1496, parent hub/port properties, Microsoft USBView/user-mode hub descriptor IOCTL documentation, complete device/configuration descriptors, UAC2 Feature Unit definition, exact audio-driver service/INF.
Verified facts: device online; standard hub reader verified VID/PID before descriptor request; one configuration422bytes/currentvalue1; bcdADC0200; interface0AudioControl,1playbackAS,2captureAS,3HID. Audio driver usbaudio2/usbaudio2.inf. Full raw bytes/hash/request log preserved in freeDspUsbConfiguration.json; parser output in freeDspAudioControlEvidence.json. Exactly one connection-info IOCTL and one standard configuration GET_DESCRIPTOR; no CAF/class/vendor/SET operation. No endpoint-volume changes.
Hypotheses: independently addressable playback L/R volume could support hardware volume/balance; useful preamp depends on placement relative to CAF PEQ.
Discarded: absence of all volume controls; existence of master Volume; assuming mute and volume permissions are identical; calling AudioControl topology proof of pre-PEQ headroom.
Unresolved: current dB/ranges/resolution, gain placement/actual control behavior, driver-safe raw class-read path.
Next target: Round2 exact-device official pregain callchain, only in a separately authorized next round. No additional descriptor access required now.

### Exact topology and permissions
UAC2 AC interface0 class/subclass/protocol01/01/20, bcdADC0x0200, class-specific total115bytes, category4(headset). One complete configuration, four interfaces.
Playback: USB streaming inputterminal1(type0101,clock9,2channels,channelbitmap0x3 FRONT_LEFT/FRONT_RIGHT) -> FeatureUnit2(source1) -> headset outputterminal3(type0402,clock9). Microphone inputterminal4(type0201,clock10,1channel,bitmap1) -> FeatureUnit5(source4) -> USB streaming outputterminal6(type0101,clock10). ClockSource9 and10 are distinct. Associated-terminal fields link3/4 but are not additional signal-flow sources.
No Mixer, Processing, Extension, Selector or Effect unit descriptors in this configuration. CAF PEQ is not represented by a separately named entity; its position inside the hardware path is unknown.

| Feature Unit / path | Channel | Bitmap | Volume selector2 | Mute selector1 | Classification |
|---|---|---|---|---|---|
| FU2 playback,interface0 | master0 | 0x00000003 | ABSENT | READ_WRITE | Master mute supported; master volume absent |
| FU2 playback,interface0 | logical1 LEFT | 0x0000000C | READ_WRITE | ABSENT | Volume SUPPORTED BY DESCRIPTOR |
| FU2 playback,interface0 | logical2 RIGHT | 0x0000000C | READ_WRITE | ABSENT | Volume SUPPORTED BY DESCRIPTOR |
| FU5 capture,interface0 | master0 | 0x00000003 | ABSENT | READ_WRITE | Capture master mute supported |
| FU5 capture,interface0 | logical1 mono | 0x0000000C | READ_WRITE | ABSENT | Capture volume SUPPORTED BY DESCRIPTOR |
Bass/Mid/Treble/InputGain controls absent in these Feature Unit bitmaps; this does not prove no private firmware tone/mic mechanism. LEFT/RIGHT here are UAC channel-cluster names, independently derived from descriptorbitmap3, not guessed official names for CAF payload selectors.
Streaming playback interface1 alt0(noendpoint),alt1/2/3 stereo16/24/32-bit formats OUTendpoint0x01; capture interface2 alt0,alt1/2 mono16/24-bit INendpoint0x81; HIDinterface3 endpoint0x83. No sample-rate changes or stream reconfiguration occurred.

### Read-only CUR / RANGE result and exact API blocker
Master Volume: ABSENT; no request eligible. LEFT/RIGHT: descriptor-readable but NOT_READ, raw current/range/resolution UNKNOWN.
Eligible UAC2 volume addressing would be bmRequestType0xA1 (class/interface IN), CURbRequest1/RANGE2, wValue0x0201 LEFT or0x0202 RIGHT, wIndex0x0200 (FU2/interface0). CUR signed16 LE dB/256; RANGE contains subrange count and MIN/MAX/RES. These are documented addresses only, not packets transmitted. No UAC1 GET_MIN/MAX/RES is applicable to this UAC2 device.
The [Windows USB_DESCRIPTOR_REQUEST API](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/usbioctl/ns-usbioctl-_usb_descriptor_request) overwrites request type/request with0x80/6; it cannot be repurposed to class CUR/RANGE. Exact audio function is bound to usbaudio2, whereas [WinUSB user API](https://learn.microsoft.com/en-us/windows-hardware/drivers/usbcon/winusb-architecture) requires Winusb.sys. No WinUsb_Initialize or driver replacement attempted. Existing HID adapter cannot forward UAC class requests. Therefore no raw-volume probe built/run through those incompatible backends. This is a blocker for the selected safe raw-USB path, not proof Windows has no alternative.
Read-only KS/DeviceTopology may expose driver-mapped volume/range, but this round stops at recovered/classified topology; those APIs are unimplemented/unverified here and their16.16dB values must not be mislabeled raw UAC replies. No endpoint volume read/write was used as a substitute.

### Preamp / Balance / Mic boundary
Hardware/USB volume candidate, preamp semantics unverified. Volume descriptor confidence HIGH; actual control behavior/read values untested. True preamp confidence LOW: nominal terminal1->FU2->terminal3 ordering does not locate CAF PEQ relative to the gain stage or establish internal digital headroom. Main Preamp stays disabled.
Independent descriptor-defined L/R Volume could support Channel Balance, but no writes/listening verification or implementation this round. Separate mono capture FU5 volume/mastermute provides a concrete microphone-control lead; DSP mic gain/monitor/AGC semantics and values unverified. No Mic integration.

### Problem / hypothesis / next action
Observed problem: Preamp remains unresolved despite PEQ RAM hardware PASS; M2U lacked AudioControl descriptors.
Verified facts: exact hardware now proves UAC2 independent playback L/R Volume RW and master Mute RW; master Volume absent; separate mono capture controls; no Mixer/Processing/Extension entities.
Possible causes: USB gain may be after the PEQ stage, or firmware may have a separate pregain path. Windows class-driver ownership prevents the selected raw CUR/RANGE backend.
Ruled out / weakened: no USB volume controls at all; guessed Feature Unit IDs; generic Windows endpoint volume as raw USB proof; topology alone as true preamp proof.
Next validation: Round2 official USB/BLE pregain exact1496 callchain. Preserve this descriptor evidence to cross-check any discovered gain path. No hardware trial or SET request requested.
Possible fix direction: exact-device mechanism and placement evidence first; existing main UI only if real preamp is proven. No PEQ emulation or extra native business logic. Flash follows control-research closure.

## Evidence for upstream / Issue #3 — Control Research Round1
Physical exact35D8:1496 full422-byte configuration recovered read-only via Windows USB hub IOCTL. UAC2 bcdADC0200,ACinterface0. Playback USBIT1 -> FU2 -> headsetOT3; masterbitmap3=MuteRW/noVolume, LEFT/RIGHT bitmap0xC=VolumeRW/noMute. Capture micIT4 -> monoFU5 -> USBOT6. No Mixer/Processing/Extension entity. Independent USB volume is now descriptor-supported, but raw CUR/RANGE and position relative to CAF PEQ remain unknown; current usbaudio2 binding/hub GET_DESCRIPTOR API does not provide selected raw class-read route. No driver change/CAF/volume/gain/PEQ/Flash write. PEQ remains hardware PASS, main Preamp disabled pending real headroom evidence; control research limited to4rounds then freeze unresolved controls.

### Scope / regression check — Control Research Round1
- FreeDSP-specific analysis files: descriptor-only reader, offline UAC2 parser, exact raw/decoded fixtures and offline Python tests.
- Shared runtime files changed: NONE.
- Non-FreeDSP protocol code changed: NO.
- Hardware operations: exact-device enumeration and standard descriptor reads only; no control writes, stream configuration, CAF/PEQ/Flash or volume changes.

### Round1 automated verification
Offline Python descriptor tests:7 PASS. Final verify.ps1: TypeScript/production build PASS;240 tests across25 files PASS. git diff --check PASS after excluding regenerated dist. Runtime/non-FreeDSP protocol changes NONE; physical access only enumerated identity and standard descriptor reads.

## Control Research Round2/4 — targeted pregain call-chain checkpoint
Examined: pinned official APK pregain-specific DEX references and Dart snapshot metadata; no hardware/descriptor/PCM rescan. Verified Java handleSetSpvPreGain -> task closure -> SPV protocol path constructs opcode35(0x23), then SpvCodecNative.buildSpvPacket and USB transmitter. This establishes a concrete non-CAF pregain path, not yet exact1496 support. Dart snapshot hash7a1ea3f6f5cf1089a7f6e55d7f20dbfd/compressed-pointers; NativeAssetsManifest empty. Hypothesis: this path is device-family restricted. Unresolved: exact device dispatch, Dart UI/protocol call edges, scale/body wrapper. Next target: static snapshot/object-pool decode and corresponding DEX transport/dispatch classes. No target binary execution or hardware actions.

### Research checkpoint — AOT/JNI/endpoint convergence
Examined: targeted Dart pool/function/direct-call recovery, selected DEX dispatcher/SPV worker and three SpvCodecNative JNI functions. Verified USB debug reads stored SPV pregain; setter crosses Flutter MethodChannel into SPV0x23, Q8.8 signed16 LE. BLE debug computes pregain from PEQ data; separate BLE setter uses0x0A/sub7 and hundredths-dB. SPV transmitter uses Android bulkTransfer on HID interrupt OUT, despite CTRL-OUT log wording. Its endpoint selector requires HID interrupt IN+OUT; exact saved1496 HID has IN83 only. Discarded hypothesis: this SPV implementation supplies a compatible exact1496 pregain transport. Unresolved: remote/cache device function-map and any distinct FreeDSP gain path; AOT17225 indirect calls unresolved, SDK profile UNVERIFIED. Next target after round closure: remaining CAF/firmware candidates, not more generic pregain scanning.

## Control Research Round2/4 — COMPLETE (2026-10-08)
Conclusion: exact35D8:1496 pregain routing NOT FOUND; true preamp confidence LOW. Generic SPV path/payload recovered, but structurally incompatible with captured exact-device endpoints. This closes the recovered SPV lead for implementation, not all possible hardware gain. No runtime changes or hardware operations; no Round3 started. Round2 complete leaves2 rounds within the hard4-round cap.

Evidence and reproducible instructions: tests/freedsp/fixtures/officialPregainEvidence.md, officialPregainProtocolEvidence.json, officialPregainAotEvidence.json; scripts/freedsp/inspect-pregain.py, inspect-pregain-aot.py. APK SHA04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5. dae-rs0.1.13 static parser uses matching snapshot hash but UNVERIFIED SDK profile; field types/decompiler branch structure not trusted. Direct ARM64 BL/JNI/DEX/pool literals cross-checked. No exhaustive dynamic call-graph claim or missing-xref-as-unreachable claim.

| Area | Recovered official behavior | Exact1496 implication |
|---|---|---|
| UI/state | USB debug read -> getSpvPreGain; SPV PEQ/profile/reset/factory callers -> setSpvPreGain | Generic SPV family, not identified FreeDSP route |
| Device dispatch | /spv,/spv5,/bluetrumusb,/jieliusb; UUID/version remote/cache function list | Exact1496 function-map artifact missing |
| Java/native | handleSetSpvPreGain -> Lns4.w -> Lha4.c/o -> SpvCodecNative | Distinct from CAF, PCM mixer and UAC |
| Logical payload | 4B 01 23 02 gainLo gainHi; endpoint-capacity padding afterward | No permission to transplant into CAF |
| Transport | Lbt4.k -> Lat4.call -> bulkTransfer on OUT; Lju2.j requires HID interrupt IN+OUT | Captured1496 HID has IN83 only: incompatible |
| Scale/sign | floor(dB*256+.5), signed16 LE read /256, step1/256dB | Arithmetic range -128..127.99609375, not hardware limit |
| Readback | SPV getter command35 -> response offset0 Q8.8 | Static only; no1496 reply |
| Persistence | Omitted saveToFlash defaults true; optional Lha4.m after setter | Official setter not safely RAM-only by default |
| BLE | Debug PEQ-derived calculation; distinct setter cmd0x0A/sub7 signed16 hundredths-dB | No exact1496 BLE association/envelope recovered |
| Master/LR | No channel field in SPV logical setter | No proof of FreeDSP stereo/master or pre-PEQ semantics |

### Problem / hypothesis / next action
Observed problem: PEQ RAM is hardware PASS; real preamp remains unresolved and generic pregain strings were not enough.
Verified facts: bounded UI/MethodChannel/DEX/JNI/USB call chain recovered; SPV endpoint requirement conflicts with exact1496 descriptors; separate BLE format and computed debug value distinguished; official default persistence flag identified.
Possible causes: exact1496 gain is exposed through UAC volume or a different CAF/firmware path; fetched capability map may route device UI differently. These are hypotheses, not confirmed implementation.
Ruled out / weakened: SPV0x23 as a compatible1496 implementation; CTRL-OUT log as proof of controlTransfer; shared SPV/BLE units; BLE debug calculation as hardware readback; generic gain names as device support; numeric representation as safe hardware range.
Next validation: separately authorized Round3 remaining CAF/firmware candidates. No further generic/APK-wide, PCM, descriptor or FreeDSPStudio rescan. No hardware test requested now.
Possible fix direction: only exact-device compatible transport/command plus position/headroom evidence could enable true Preamp. No PEQ emulation; retain main UI/upstream semantics and transport-only native helper. Flash after research closure.

## Evidence for upstream / Issue #3 — Control Research Round2
Pinned official APK SHA04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5 contains a concrete SPV pregain setter: Dart MethodChannel -> Java Lns4.w -> logical4B012302 + signed16 LE Q8.8 gain -> HID endpoint transfer. Getter decodes signed16/256. Android worker calls bulkTransfer, not UAC class/controlTransfer; HID selector requires interrupt IN+OUT. Captured35D8:1496 HIDinterface3 has interruptIN83 only (audioOUT01 is isochronous/class1), so that SPV sender is incompatible with this configuration. Exact1496 pregain dispatch not recovered; device function lists can be remote/cached. BLE pregain uses different0.01dB format; BLE debug derives gain from PEQ, not hardware-register readback. No SPV/BLE transplantation, hardware action or runtime change. UAC2 FU2 L/R Volume remains independently descriptor-supported, but CUR/RANGE and relation to CAF PEQ remain unknown. True preamp LOW; Round2/4 complete,2 rounds remain.

### Scope / regression check — Round2
- FreeDSP analysis/test files changed: targeted static extractors, offline endpoint/scale model, seven tests and evidence fixtures.
- Shared runtime files changed: NONE.
- Non-FreeDSP protocol code changed: NO.
- Hardware operations: NONE; no target binary execution, gain/volume/PEQ/Flash or GUI access.

### Round2 automated verification
Seven focused offline pregain tests PASS (endpoint incompatibility, audio-OUT exclusion, valid synthetic HID pair, malformed descriptors, signed Q8.8, raw ARM64 BL decoding and native signed conversion). Final verify.ps1: TypeScript/production build PASS;240 tests across25 files PASS. Regenerated dist excluded from this research commit. git diff --check PASS. Analysis fixtures reproducibly extracted from pinned APK; no runtime/device operations.
