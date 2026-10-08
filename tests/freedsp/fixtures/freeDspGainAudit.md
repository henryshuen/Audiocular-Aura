# FreeDSP gain limits audit — 2026-10-09

Scope: exact35D8:1496, documentation and offline analysis only. No USB/native execution,
SET_REPORT, RAM/Flash writes, reset, listening or positive-gain experiment. Production
runtime is unchanged. This is not a new feature or a reopening of frozen control research.

## Primary evidence and what it establishes

| Source | Observation | Established / not established |
|---|---|---|
| Henry's exact-device official App screenshot description | Gain range -16..+6dB | Reported App product range; not firmware/API or safe audible maximum. Screenshot bytes/version were not supplied in this audit. |
| Pinned official APK 2.25.0c-260813ai, SHA25604756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5 | Rehashed original cached APK; localized failure strings in libapp.so | Primary static bytes corroborate App-side restriction; exact Dart callback/device guard not recovered. |
| `officialGainStrings.json` (reproduce with inspect-gain-limits.py) | English range text fileoffset621579 (-16 starts there); Traditional Chinese -16 at713515; simplified Chinese at972599; Korean567745; Japanese635380 | Actual failure messages, not just method names. Offsets point to the matching -16 substring, not function entry addresses. Other family text -18..+12 also exists; do not treat all App device ranges as FreeDSP firmware rules. |
| `officialRamStaticEvidence.json`: handleSySendEqParams / setFreeman3EQ / Eq2Coeff | Handler stores double gain; Java gain*256 -> int, precision24 -> JNI; no -16/+6 clamp in these recovered bodies | App-to-SDK coefficient path and types. This does not prove all Dart entry paths enforce the range. |
| Native convertEQParamFromJni0x2194, gain store0x22e8 | Gain narrowed to16bits, signed interpretation in conversion | Signed Q8.8 arithmetic range -128..127.99609375dB, not firmware operating range. |
| Native CxAudioConvertEqParams2Coeffs0x2abc | Native pole checks; reverse-conversion gain tolerance uses +/-0x100 in Q8.8 (approximately1dB), at0x2c88..0x2cac | Native success involves numerical fidelity, not merely coefficient fit. No fixed -16/+6 check established in inspected conversion. Wrapper returns null on nonzero conversion result. |
| EqDesignFx / float-design / quantizer saved disassembly | Dynamic exponent, signed24;32 neighboring integer combinations; response/pole selection | Converter can represent many gains outside App range; current nearest rounding is not bit-exact official optimizer. No actual firmware accumulator/limiter disassembly available. |
| Full official saveEQParamsToFlash and57 helper pairs |9 integer-dB metadata +45 rate coefficients +commit; observed metadata gains -7,-9,-9,-7,-7,-5,-7,+2,-6 | One existing profile; no +6/+9/+12 hardware proof. Helper buffers are not separately captured bus transfers. |
| Refreshed upstream/main af0bcf7057860307bf81b00746f0cbdb93366514, dated2026-09-29 | Generic editor/graph uses +/-12; legacy Conexant Flash gain*256/fixed exponent path | Software-origin comparison, not upstream hardware validation. Fetch2026-10-09 returned same commit. |
| Henry's new report |56/56 matching Flash ACKs and persistent EQ after physical USB reconnection | Reported protocol/persistence hardware PASS for tested configuration. No audit raw log/exact gain profile supplied; cannot extend to fractional gain, every rate or +12dB safety. |

Official range classification: **A (application restriction) best supported** by screenshot
description and executable's failure strings. Exact enforcement callback remains unresolved.
**B/C not established** as a firmware/API or universal numerical boundary. **D plausible,
unproven** product/headroom policy. **E applies to the rationale and firmware range**.
Missing artifact for stronger attribution: original Dart source or a validated AOT
control-flow/object-pool reconstruction linking this message and min/max constants to the
exact FreeDSP editor and dispatch. A private firmware/API specification is separately
needed to establish hardware limits; string absence/presence cannot substitute.

## Current software limit inventory

Locations below are source function anchors at baseline414b7b9; no runtime edits in this audit.

| Area / source | Restriction, clamp or rounding | Meaning |
|---|---|---|
| fn.ts renderUI, gain slider/number inputs | min=-12/max=12/step=.1 | Inherited HTML UI range; number attributes alone are not a clamp. |
| freedsp/editor.ts freeDspEditorGain; fn.ts setEQ/updateState | Finite required; clamp[-12,12], logs clamp; numeric parseFloat | Exact FreeDSP application clamp. Typed fractions can be finer than.1; no mandatory.1 rounding here. Current log's "verified range" is too broad: it means accepted software range, not certified firmware/headroom range. |
| fn.ts setEqState/renderUI; normalizeFreeDspEditor | Nine bands; gain clamp, invalid/nonfinite snapshot gain replaced0 with log | Presets, import, undo/redo, local A/B and stored snapshots converge on same device guard. Generic disconnected editing does not enforce FreeDSP policy until normalized on connection/Sync. |
| importExport.ts JSON/text parsers, fn.ts profile loaders | Parsers have no gain range; connected FreeDSP setEqState/renderUI normalizes | Numeric+12 remains+12 because it is inside current policy, not a bypass. >12/-16 clamps to12/-12 with log. Text regex accepts unsigned positive digits or minus, not explicit '+'; literal `Gain +12` does not match a band, whereas `Gain 12` does. |
| importExport.ts exportProfile/exportProfileAsText | JSON snapshot retains numbers; text gain.toFixed(1), Q.toFixed(2), rounded frequency | Text roundtrip loses precision; export is not hardware validation. |
| fn.ts resetBand/resetToDefaults/resetToFlat | Reset gain0; FreeDSP Defaults9bands; current temporary Flat preserves enabled-band frequency/Q while zeroing gain | No hidden expansion of gain range. Final upstream-compatible Flat9x1k/Q1 decision remains pending separate cleanup; not implemented here. |
| peq.ts CONFIG/drag/calculateBiquad | Graph axis +/-12; drag clamps and rounds.1; FreeDSP PK float model visual48k | Curve is local unquantized float estimate, not device readback/current rate/actual clipping. Off-screen summed peaks can exceed the axis. |
| freedsp/webRam.ts validateBands/modelWebBand | Hard[-12,12],PK only,20..20000Hz,Q.1..10; signed24+finite+strict Jury poles | Real preflight; out-of-range raw imported snapshots do not reach packets. Model checks all5banks in cafRam.ts before any send. |
| ram-semantics.mjs nativePeakFloat | frequency truncU16; Qtrunc*256U16; dBtrunc*256S16; float32 normalized coefficients | Parameter quantization, not dB UI clamp. Intended offline wrapper can narrow/wrap extreme unvalidated arguments; production preflight rejects them first. |
| command190 / native TransportExchange.cs | path0/1,wire1..9,coefficientGain0..25,signed24five words,zero tail | No separate dB field. Coefficient exponent is not preamp; allowlist does not certify a requested dB range. |
| freedsp/flash.ts buildFlashPlan | Same[-12,12] and five-rate coefficient model; metadata trunc(dB),trunc(freq),trunc(Q*256) | RAM/Flash share current application range and coefficient conversion; metadata whole dB is different precision. Disabled uses0/unity. |
| native TransportExchange.cs command220 metadata | Hard integergain[-12,12],freq20..20000,Qraw25..2560,PK0 | Additional host-side application/shape guard, not discovered firmware limit.220 coefficients use exponent/signed24 like190. |
| native RamDebug.cs Validate/Calculate | Diagnostic[-12,12],PK,frequency/Q guards; same nearest float32 quantizer/Jury | Isolated debug executor, not production transport's PEQ logic. Current Safety logs metrics; historical6dB cap removed. |
| fn.ts isConfigurationUnsafe + main.ts safeSyncToDevice/safeFlashToFlash | Warns positive global gain, enabledband>10, generic48k/200-point peak>12, positive sum>15 | Heuristics/confirmation, not limiter. Proceed Anyway can continue. Ctrl+Shift+S calls flashToFlash directly, bypassing this warning wrapper (still has confirmation/preflight). Audit finding only; unchanged. |
| fn.ts reduceGainsSafely FreeDSP branch | Enabled positive band capped10; ifpositive sum>12, proportional reduction to sum12 | Local editor adjustment only; no independent preamp. Can still leave positive response and clipping risk; name is not a safety guarantee. |
| freedsp/webRam.ts analyzeSafety / cafRam.ts | Quantized five-rate grid inclcenters/DC/Nyquist, positive sum; allowed:true | Metrics and finite/stability checks, no hard headroom budget or verified limiter. |
| Legacy dsp.ts Conexant send/Flash; other protocol encoders | Genericeffectivegain[-12,12],oldgain*256/metadata scheme | Exact FreeDSP guard dispatches isolated cafRam/flash instead. Do not classify unrelated Comtrue/Moondrop clamps as active FreeDSP transport. |
| Historical scripts/freedsp/nine-band-model.mjs, ramProbe.ts, native SafeRam diagnostics | Negative-only[-12,0] or fixed400Hz/-12 presets | Offline/isolated earlier gates, not current production policy. |

No silent new hardware gain cap was discovered. Known conversions are deliberately
different: slider/graph.1dB, JSON raw numbers, text export.1dB, native parameter1/256dB,
Flash metadata1dB. Nonfinite editor recovery and explicit clamp are logged. Neither HTML
max nor safety warnings imply another +/-12 hard check in firmware.

## Numerical matrix and limitations

Reproduce `node scripts/freedsp/gain-audit.mjs`; saved `gainAuditAnalysis.json`.
Gains -16,-12,-6,0,+6,+9,+12; frequencies20,100,1000,6000,10000,20000Hz;
Q.1,.7,1,4,10; rates44100/48000/96000/192000/384000.
3150 cases:1050 native-float PK +1050 referenceLSQ +1050 referenceHSQ.
Shelves reproduce current generic UI formulas and are **not recovered native shelf
semantics or supported FreeDSP production filters**. Cookbook formula reference:
https://www.w3.org/TR/audio-eq-cookbook/ . No type support is added.

All3150 finite coefficient vectors fit dynamic signed24 representation. This says
nothing about input/output sample overflow. PK nearest-rounding stability failures:

| Gain dB | Cases | Quantized non-strict-stable | Float32 non-strict-stable |
|---|---:|---:|---:|
|-16|150|5|1|
|-12|150|6|1|
|-6|150|6|1|
|0|150|0|0|
|+6|150|6|1|
|+9|150|6|1|
|+12|150|6|1|

1050PK:35quantized failures (float failures are contained in these), predominantly
20Hz at384k; extreme20k/Q.1 at44.1k also degenerates. Including reference shelves,
110cases fail float or quantized checks; full parameter tuples retained. All ordinary
1k/Q1 tested gains at all5rates are stable with center response within0.1dB.
PK max absolute coefficient quantization error2.384185791015625e-7; shelf reference
max4.76837158203125e-7. Small coefficient error can mean LARGE transfer-function error
near poles at unit circle; gain limits alone do not solve this.

Example:20Hz/-12dB/Q1/192k is strictly stable after rounding, but center approximately
-7.751dB and DC+9.542dB. This is an offline current-model precision issue, **not a
measurement of the DSP**.20Hz/-16/Q.1/384k floats pass but nearest quantization has zero
Jury margin. A stable floor/floor+1 neighbor exists; do not say official32-neighbor
optimizer necessarily fails. Official inverse-gain tolerance is approximately1dB;
fork currently checks poles but does not reproduce the entire inverse-fidelity gate.
No bit-exact native success claim is made for extended gains or extreme parameters.

`Gain=e+2`,scale=2^(25-Gain),signed24[-8388608,8388607]. Feed-forward B signs are
retained; wire feedback words are -normalizeda1/-normalizeda2. Increasing exponent
trades precision for coefficient amplitude range. A valid stored coefficient set
does not specify sample/state/accumulator widths, saturation or available DSP headroom.

## DSP headroom, clipping and official protections

One ideal+12dB PK at its center multiplies sine amplitude by3.981. In a unity-full-scale
bounded sample stage with no earlier attenuation/headroom, input above approximately
-12dBFS at that frequency exceeds full scale. Even+6 needs approximately6dB sine
headroom. Two coincident+6PK give+12;9coincident+6 give+54;9coincident+12 give+108dB in
ideal unsaturated cascade arithmetic. These are examples, not predictions of actual
device output: real DSP may clip, saturate, limit or have headroom earlier.

Whole-cascade response peak bounds steady-state sine amplification; arbitrary signal
transients and intermediate filter-state peaks need separate analysis/margin. Internal
DSP clipping is different from final output-stage voltage/current saturation and from
listening level. Turning down a control located after PEQ can reduce listening level
without preventing earlier DSP clipping. Exact placement of Windows/UAC attenuation
relative to CAF PEQ is unknown; low volume alone cannot certify internal headroom.

No exact-FreeDSP verified independent preamp/limiter/automatic output compensation has
been recovered. Existing officialPreamp/Pregain evidence separates PCM software mixing,
BLE pregain and endpoint-incompatible SPV pregain from exact1496 CAF. App strings about
temporarily lowering/restoring SPV pregain are another path, not proven FreeDSP permanent
headroom. Static `limiter` word search has no standalone match; absence of that string
does not prove no firmware limiter. SDK numerical inverse-fidelity checks are not audio
amplitude protection. UAC/Mic/Balance evidence and frozen production exclusions remain.

## RAM versus Flash persistence

RAM190 embeds coefficients derived from gain truncated to1/256dB; it does not transmit
a dB metadata word. Flash220 embeds the same coefficient banks plus integer metadata.
For+6.75/-6.75, coefficient inputs are+6.75/-6.75 but metadata+6/-6. Fractional |gain|<1
becomes metadata0 although coefficients can remain non-unity. Frequency/Q quantization
is also distinct. Metadata has32-bit slots, so packet width alone establishes no +/-6
boundary. Host production220validator limits whole dB to[-12,12].

If firmware boots from stored coefficients, fractional EQ may persist intact while
reported metadata differs. If it redesigns from metadata, fractional gain may change
after reboot. If metadata is only UI/readback, mismatch may be cosmetic. These are
alternatives, not conclusions: no boot firmware source/trace establishes which occurs.
Henry's persistent-effect test does not resolve this without an exact fractional test
profile and objective before/after comparison. Integer profiles minimize this ambiguity.

## Production policy recommendation (no implementation)

| Option | Assessment |
|---|---|
|A -16..+6|Recommended FreeDSP-specific App-compatible target, subject to per-packet numerical/fidelity checks and headroom warnings. Product envelope, not hardware safety guarantee.|
|B -12..+12|Current inherited choice; no evidence justifies marketing extra positive range as hardware-supported/safe; also excludes official-16cut.|
|C extended range with verified policy|Not currently supportable: independent preamp, stage placement, headroom and limiter unverified. ACK/math alone insufficient.|
|D nonpositive-first / offline preview|Low-risk interim/manual alternative without asserting a safe numeric maximum; even negative profiles need quantized response/fidelity checks.|

Recommend match official[-16,+6] across exact-FreeDSP editor/graph/import/preflight,
Flashmetadataallowlist/debug validators in a **separate authorized implementation**;
keep otherDACs unchanged. Preserve explicit unity Restore regardless of invalid editor.
Do not silently rewrite imported+12: future range change should visibly reject/request
adjustment. Retain integer-metadata warning; do not invent scaling/reboot semantics.
Do not lift limits on the basis of this matrix or add shelves/preamp emulation.
Current+12 hardware processing range and clean full-scale behavior are **UNKNOWN**,
not confirmed supported and not proven universally rejected.

Future validation is not requested now. Lowest-risk next evidence is exact firmware/API
headroom/range/boot documentation or static official UI call-chain evidence. If Henry
separately approves hardware validation, use an objective low-level source/capture,
IEM disconnected, onePK within official range (+6 at most), known baseline and explicit
restoration; compare RAM vs post-reconnect fractional profile separately. Such a test
cannot certify+12 or arbitrary program-material safety; beyond+6 needs separate approval
and a justified measurement plan. No positive experiment is implied by this audit.

## Verified audit completion
Focused Vitest gainAudit/editorUx/flash:61tests across3files PASS. New gain audit15tests,
including deterministic3150-case reproduction, neighbor-vs-nearest distinction,
ordinary center gains, degraded negative-filter example, import clamps, coefficient/
metadata precision and existing packet-plan comparison. First test runner failed before
tests due sandbox Temp rename EPERM; workspace-local Temp resolved it. A test initially
assumed payload instead of serialized data; corrected to decode actual CAF bytes.
No production build, verify.ps1, native executable or hardware checks run. Diff check
and Git handoff recorded in DONE/ROADMAP. Runtime files are unchanged.
