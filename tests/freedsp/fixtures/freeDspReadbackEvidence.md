# FreeDSP required Device EQ readback gate — 2026-10-09

Status: production readback / device-derived immutable Slot A baseline **BLOCKED**.
Opt-in fixed read-only query capture is implemented offline; no hardware access was performed.
Henry reports nine-band stereo RAM, Flash/power-cycle persistence, cross-host official App EQ, gain policy, both resets and local-editor reconnect retention PASS. These results do not validate our getter or prove an enabled/source field.

## Primary evidence and reproduction

Official APK 2.25.0c-260813ai, SHA256 `04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5`. Existing cached bytes:
`C:\Users\Henry\AppData\Local\Temp\aurapeq-m2d-static\moondroplink-official.apk`.
`scripts/freedsp/inspect-readback.py` pins this hash, parses DEX and ARM64 ELF without executing either, and emits `officialReadbackStaticEvidence.json`. The latter preserves full selected method bodies, callers, struct fields, native inverse disassembly and PLT symbol targets. Source evidence is stronger than older derived summaries. The original 57 helper pairs contain90/220/259, **no446/477 responses**.

Reproduce static extraction (offline, optional; cached dependencies required):
```powershell
cd D:\Henry\Documents\ChatGPT\AuraPEQ
python -B .\scripts\freedsp\inspect-readback.py C:\Users\Henry\AppData\Local\Temp\aurapeq-m2d-static\moondroplink-official.apk C:\Users\Henry\AppData\Local\Temp\aurapeq-m2d-static\python-libs > .\tests\freedsp\fixtures\officialReadbackStaticEvidence.json
```

### Exact official chains

- Flutter `UsbDeviceHandler.handleSyGetEqParamsFromFlash` calls `SvcModClient.getUsbEQ()` then `IEqualizer.getEQParamsFromFlash(PersistEQParams)`. It returns `presetEQModeIndex`, `bandArray`, `freqArray`, `gainArray`, `qArray`, `filterArray`, each array nine entries; no enabled array. Success/error handling is visible in DEX, not inferred from UI screenshots. Exact Dart connection-event timing is not established by this Java trace.
- `FreemanController.getEQParamsFromFlash` / `FreemanSession.bldCmdGetEQParamsFromFlash` / session dispatcher reach `FreemanCnxtUsbDevice.getEQParamsFromFlash`: claim interface, **query** getEQMode, getEQParamList, store PersistEQParams, release interface. No setter in this getter chain. The mode query is346 subkey90, **not** command90 activation. The isolated diagnostic intentionally omits it because mode cannot establish per-band enabled/source.
- Freeman3 `getEQParamList` loops1..9, sends477 `[band,0×12]` to CTRL, helper report prefix1, rejects failed exchanges. Offsets146..256 parse the six fields below. Q divisor DEX208 bit pattern1132462080 = IEEE754 `256.0`. Earlier derived `Q*100` readback text was wrong and is corrected; current write coefficients/Flash Q encoding are unchanged.
- Freeman3 `getF3EQCoefficientList` loops1..9, sends446 `[0,slot,0×11]`; records sample rate from Android `AudioManager.PROPERTY_OUTPUT_SAMPLE_RATE`, not a queried rate bank. The loop supplies the output band number; it does not verify a returned slot echo. Gain byte18 and five integers22..38 are copied; instructions556..632 perform `(word<<8)>>8` to sign-extend low24, **not** division by256. Only path0 is source-backed for this getter; path1 query semantics remain unknown.
- Single `getFreeman3EQParam` uses446 `[0,SDKband+5,...]`, then JNI `Eq2Coeff.CxAudioConvertCoeffs2EqParams(DEFAULT_FREEMAN3_SAMPLERATE, coeffs, 24)`. JNI `(ILjava/lang/Object;Ljava/lang/Object;I)I` copies coefficient fields, calls native `CxAudioConvertCoeffs2EqParams`, copies Freq_Hz/QFactor/Gain_dB/flags back. Native inverse calls `EqFxToFloat`, then `EqParEx`; gain scaling byte affects exponent. Java uses flags&15 as type, QFactor/256, Gain_dB/256 then float-to-int, losing fractional dB. Default rate is not proof of active device rate. Native wrapper returns0 after EqParEx without propagating its result: wrapper success is not unique/accurate reconstruction proof.
- Generic `getEQParam` is **unsafe to reproduce**: its first-connect Freeman3 branch runs `setDefaultAvailable`, writing unity190 to both paths. Bare477/446 query builders do not call this initializer. Never copy this CONNECT sequence.
- `CafCmdHelper.getMsgByCmd` / `readDataFromDevice` build13 words then Android output SET_REPORT (`0x21,9,0x0201`, interface3) and Input GET_REPORT (`0xa1,1,0x0101`, interface3), bounded polling. A query SET is not an EQ write: the pinned getters have no190/220/enable/reset call. This is static semantic evidence; exact-device getter hardware confirmation remains pending.

## Field evidence matrix

Offsets include the native62-byte buffer report ID; WebHID61-byte data offsets would be one smaller. Logical count must cover the required words; padding is not data.

| Field | Query / response | Encoding | Source / independent validation / ambiguity |
|---|---|---|---|
| Band |477 word1 byte14|LE32 integer1..9|SDK source; no captured exact-device response. Reject other-band reply; same-band freshness not proven.|
| Frequency |477 word2 byte18|LE32 Hz|Persistent-intended getter; source hardware confirmation pending.|
| Q |477 word3 byte22|LE32 /256, then App decimal formatting|Static unit verified; retain raw division in offline parser, no invented precision.|
| Filter type |477 word4 byte26|LE32 raw enum|App passes enum; preserve raw value. Not enabled; no new filter types or guessed conversion.|
| Gain |477 word5 byte30|signed integer dB|No fractional metadata. CommonUtil signed-byte OR helper is not a general correct LE decoder; proper signed LE32 used offline. Within−16..+6 integers agree.|
| Rate |477 word0 byte10|raw integer|Getter does not establish units/current-rate relation; retained raw, not defaulted.|
| Active rate |346 key62, word1 byte14|indices4/5/6/7/8→44100/48000/96000/192000/384000|Existing rate-query evidence; no new capture this round. Not proof477 store bank.|
| Coefficient scaling |446 word2 byte18 low byte|Gain exponent byte, **not filter dB**|Static parser/inverse verified; RAM-active intent plausible, hardware origin not independently verified.|
| B0/B1/B2/A0/A1 |446 words3..7 bytes22/26/30/34/38|LE32 container→signed24 low bits|Source verified; no getter captures; exact wire echo/freshness unresolved.|
| Per-band enabled |none in EQParam/BandEQCoefficient/Flutter arrays|unavailable|null; unity cannot distinguish disabled versus enabled neutral/reconstructed filter.|
| Stereo channels |446 query path0 only;477 no path argument|no proven complete stereo encoding|Write path0=LEFT/path1=RIGHT hardware PASS does not prove getter symmetry.|
| RAM versus Flash |getter named getEQParamsFromFlash + PersistEQParams;446 coefficient getter|no explicit verified provenance field|477 strongest persistent-intended model;446 active-RAM candidate. Neither label promoted to hardware fact.|
| Freshness / transaction |CAF prefix/command/reply/CTRL/count;477 band echo|no recovered changing transaction token|Wrong command bounded rejection; different-band477 rejected; same-band477 and446 stale matching frames remain unresolvable.|

## Reconstruction limits

Coefficient-to-parameter inversion estimates a transfer function, not original editable metadata. Disabled filters with arbitrary frequency/Q/gain and canonical Restore Unity generate identical coefficient bytes. Thus an inverse cannot uniquely recover those editor values or enabled state. Filter family classification via EqParEx/flags does not restore absent provenance or stereo information. Do not fabricate a full editable fixture or Device EQ baseline from a successful nineteen-query run.

The new full-nine fixture is explicitly **synthetic**, tests known477 field layout only, and intentionally returns `productionEligible=false`. Unsupported fields remain null/raw/UNKNOWN. The offline parser has no transport/editor mutation import. CONNECT remains metadata-only, Device EQ Unknown — Local Editor; existing race guards preserve edits. Existing A/B states are local editor comparisons, not hardware slots or an immutable readback baseline. New device-baseline A/B behavior is blocked with readback; no automatic hardware writes are added.

## Henry's separate read-only capture

1. Stop `scripts/dev.ps1` with Ctrl+C and close other native CAF diagnostics so no concurrent reader consumes responses. Keep the known persistent nonflat profile; do not Sync/Restore/Flash/reset for this test.
2. In PowerShell:
```powershell
cd D:\Henry\Documents\ChatGPT\AuraPEQ
& D:\Henry\Documents\ChatGPT\AuraPEQ\scripts\query-freedsp-eq-readback.ps1
```
3. Script builds an isolated helper into `%TEMP%\AuraPEQ\readback-<GUID>\helper` and prints **absolute** `readback.log` / `readback.json` paths. Save both and compare nine metadata rows to the official App's existing EQ, including a known noninteger gain/Q if already present. No profile edits are necessary. A timeout or pre-discovery error may leave only the log; that is not a complete capture.

Fixed order:346[62],477 bands1..9,446[path0,wire1..9] =19 query SETs maximum, one each. Input GET uses the existing native HID API and62-byte buffers; it exposes no actual transfer length. Each exchange has1s polling bound, whole child30s hard limit. Wrong report/CTRL/reply/count/477 band/346 key or unknown rate stops; wrong-command replies poll boundedly, never resend SET. No190,220,90,188,187, reset, arbitrary command or path1 probing. Normal HTTP transport allowlist stays unchanged. Logs retain attempted/partial evidence; same-command stale replies remain a documented blocker, not falsely certified freshness.

This capture can validate returned field layout and agreement with existing stored App values. If RAM and persistent EQ already differ, note that fact before running; otherwise identical values cannot prove source. It cannot alone prove enabled semantics, path1 equivalence, or same-slot freshness. Missing source-backed protocol evidence for these fields requires further exact-device evidence or Henry's explicit gate revision. No release/PR until resolved.

## Graph / regression scope

FreeDSP graph defaults−20..+9, sampled active and local comparison response/handles expand bounds with1dB margin; nonfinite samples show an explicit unavailable warning. Sampling covers exactly the drawn pixel grid, not a certified continuous peak or measured hardware response. Mouse gain clamps remain−16..+6. Other DAC graph stays±12. Filter math, RAM18, Flash56, reset, existing native HTTP API and other protocols unchanged.
