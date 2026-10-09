# Henry readback capture — 2026-10-09 offline analysis

Full Readback remains **BLOCKED**. This round did not access hardware, send or retry any query, change the diagnostic transport, or modify RAM190/Flash220.

## Evidence provenance / temporal limits

Original files were found at `C:\Users\Henry\AppData\Local\Temp\AuraPEQ\readback-3d3edbdaae6445949be15964a29f29af\readback.json` and `readback.log`. `henryReadback20261009.json` preserves the original JSON; `.log` preserves all query/RX bytes but redacts device-instance paths and normalizes line endings. Original SHA256 hashes are in `henryReadback20261009Provenance.json`. Failed RX is **only in the log**: JSON stores rx:null. The analyzer cross-checks every recorded TX and successful RX across both files.

Henry reports nonflat saved EQ and a09:37 official App screenshot with low-frequency and2–4kHz cuts. This is not a simultaneous capture; intervening RAM Apply/Restore/Flash/reconnect history is incomplete. Thus discrepancy is a reported observation across time, not proof of stale477, wrong bank, corrupted Flash or failed persistence. Earlier56/56ACK/power-cycle/cross-host hardware evidence is not revoked.

Pinned official APK SHA04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5 DEX/JNI evidence is retained in officialReadbackStaticEvidence.json. This round additionally extracted CommonUtil.formatDecimal to establish actual App rounding; no APK/native execution.

## Actual capture

Exactly12 query SETs and12 logged GET buffers:346, nine477,446wire1,446wire2; stopped at second446. All are62-byte **API buffers**, not proof of bus transfer length. VID/PID35D8:1496 MI03 col01 usage0x0c/1 caps62/62 passed the exact-device gate; col02 caps2/0 was rejected.

346 reply count13, words `[62,5,0,32,0,0,0,0,0,0,0,0,0]`. Known word1 index5→48kHz. Word3=32 remains opaque; do not infer enabled/mode/bank flags.

### 477 complete logical fields (nine independent matching band echoes)

Every reply: ID1,prefix0,CTRL0xB32D2300,command477,reply1,count6. Offsets include native report ID.

| Field | Word / byte | Actual value | What is verified / still limited |
|---|---|---|---|
| sampleRate |0 /10|5 for all9|SDK assigns sampleRate; consistent with known346 index5. Not independent proof of current coefficient bank or store origin.|
| band |1 /14|1..9|Each matches the requested band; no same-band freshness token.|
| frequency |2 /18|60,120,260,530,1100,2260,4680,9680,20000|SDK assigns EQParam.frequency (Hz); directly returned metadata, not an inverse estimate. Active coefficient/tonal agreement not demonstrated.|
| Q |3 /22|180 each|SDK divides by256→0.703125; formatDecimal rounds HALF_UP to2 decimals→0.70. Not Q1.8 or /100.|
| filterType |4 /26|0 each|Raw enum0, consistent with existing peak-family use; not enabled state. This capture does not validate other enum values.|
| gain |5 /30|0 each|SDK signed integer dB field; only zero is observed, not fractional/signed endpoint hardware validation.|
| enabled/path/source |absent|UNKNOWN|null/unavailable; no complete stereo source or active-state identification.|

These nine frequencies differ from AuraPEQ Defaults31/62/125/250/500/1000/2000/4000/8000 and generic Flat1000. They are **reported parameter centers**, not fixed hardware wire frequencies, sampling rates or nine coefficient values. Approximate octave spacing and Q≈0.7 make a preset/default-like metadata bank plausible, but do not prove factory defaults. No source-backed default array equality is established. Neutral gain0 leaves no audible center-frequency cue.

Q180 is not an exact reconstruction of an original0.7 edit:existing metadata truncation of0.7×256 yields179,while both179/256 and180/256 display0.70 after App rounding. Without the exact last written metadata and operation history,this one-LSB difference does not identify the store or prove an encoder defect. Write algorithms remain unchanged.

### 446 wire1

Count8,reply1,words `[0,1,3,4194304,0,0,0,0]`. Known scaling byte3 implies scale2^(25−3)=4194304; normalized coefficients `[1,0,0,0,0]` = unity. Word1 matches requested1 in this observation; the SDK list getter assigns its own loop band rather than validating this word, so one matching capture is not a complete echo specification. Request path0 is hardware-write LEFT mapping; read-path stereo semantics remain unresolved. Unity cannot reconstruct original frequency/Q/type/enabled.

## 446 wire2 failure: exact comparison

TX packed header0x01BE000D, request words `[0,2,0×11]`.
RX packed header0x01BE000D, words `[0×13]`.
Reply bit0,count13,command446,CTRL/ID/prefix correct. **Only byte14 differs:02→00**. Therefore:

- Not a byte-for-byte echo of the current request.
- Not equal to any earlier TX/RX in this captured session; in particular not the successful446wire1 response (reply1,count8,slot1,unity coefficients).
- Request-shaped, echo-like or pending data is plausible; it is **not a completed coefficient response** and must not be decoded as mute/disabled/path0/slot0 EQ. Its payload has no confirmed semantics while reply0.
- Cannot classify it as firmware error status: no reply1/error count; reply0 by itself is not a negative result code.
- Fresh native GET buffer initially contains only ID1; received nonzero command/count/CTRL cannot be explained by merely printing an untouched buffer. Native SET uses[In] and GET a separate fresh[In,Out] array. Source excludes simple client TX/RX reuse/aliasing, but not all driver/firmware issues.
- HidD_GetInputReport returns a Boolean, not actual transferred length. A short/header-only device response followed by zero-filled capacity cannot be excluded from this log. Request length62 and count13 are correct for source constructor; general61/62/report-ID/endianness errors are weakened by successful346/477/446wire1.

| Candidate | Evidence / ranking | Limits |
|---|---|---|
| Pending/intermediate output-command image read before completion |Strongest working explanation:reply0/request count13/current446 header and SDK explicitly polls reply0|No secondGET captured, no timestamps/bus length; delayed successful completion unproven.|
| Firmware/driver returns cached or partially processed command buffer |Plausible:current header but cleared slot/payload|Exact echo excluded; physical origin of changed byte14 cannot be identified.|
| Other reader consumes reply / unlogged stale report |Possible in principle|No concurrent-reader evidence. Replay of any **logged** previous frame excluded, all historic reports not excluded.|
| Slot2-specific unsupported/error behavior |Unresolved|Command446 is not globally unsupported becausewire1 returned expected fields; no completed error response forwire2.|
| Client packet builder or parser offset error |Weakened / specific mechanisms excluded|TX[0,2] agrees with SDK; byte14 really changed, not decoder misreading; parser correctly rejects reply0. Whole transport correctness not proven.|

## Official SDK versus native transport

Official readDataFromDevice:one SET at DEX46;fresh RX allocation54;firstGET74;byte5 bit7 test104..118;while reply0 and elapsed<1000ms, **another GET** at150 and sleep5ms at170..174. getMsgByCmd has analogous polling. No SET resend. isExecuteSuccess is called after waiting and requires reply1 plus nonnegative logical count. Official matching is weaker than our command/CTRL/count validation; do not copy it wholesale.

Current ReadbackQuery.Run:one SET,firstGET,Caf346.Parse,immediate STOP on !Valid. Missing replybit is invalid, so it never reaches its wrong-command polling branch. Existing SafeRam.Exchange / normal TransportExchange polls nonmatching frames under their existing policies; Flash fail-fast logic must stay unchanged. The observed failure is **diagnostic fail-fast policy versus SDK waiting**, not evidence of a RAM/Flash sender defect.

The log's generic startup banner says346 initialGET precedes the clock;that description belongs to the earlier helper path. ReadbackQuery actually starts its clock before SET. No timestamps or subsequent446GETs exist here,so timing cannot be measured from that banner.

Offline native replay reproduces precisely12SET/12GET and STOP even when a synthetic later validwire2 reply is queued. Separate offline candidate model uses only synthetic/log arrivals:one SET,reply0 ignored as pending,strict ID/prefix/CTRL/command/count guards,1s bound and expected slot candidate gate on reply1. Hypothetical reply0→valid succeeds after2GET;wrong module/stalewire1 stops;timeout never resends. This proves software feasibility, not future hardware success or same-slot freshness.

## Source / bank conclusions

- getEQParamsFromFlash calls getEQMode then getEQParamList and returns PersistEQParams. getEQMode sends **346[90]**, logs “saved EQ Mode”, returns byte14. It is not command90 mode selection.
- getEQParamList477 requests only `[band,0×12]`, no mode/bank/path argument. getEQParamsFromFlash stores the mode result but does not pass it into477 or issue a setter. Our capture omitted346[90]; that is a sequence/observability gap, **not evidence a mode-select write is necessary**. Do not add activation/bank switching.
- SDK saving distinguishes custom mode0 metadata/coefficient handling from other modes; this supports investigating separate saved custom metadata and presets. No captured saved mode exists here, so selected mode/default bank identity is unknown.
- Strongest source hypothesis remains477 persistent/custom metadata versus446 active coefficients, possibly a preset/default metadata bank. Neither physical origin is proven. App screenshot may be a later state/cache or another store; no temporal inference without the operation timeline. Flat477 plus only unity446wire1 is compatible with a neutral state in that query slice and does not compare the full later EQ.

## Next minimum controlled read-only validation (proposal only)

First isolate the transport question:Henry starts from an already-known nonflat state withwire2 genuinely affected,records profile/action history,time and existing App values,closes all other readers. Future opt-in diagnostic sends **one fixed446[path0,wire2] SET** and only bounded GETs at5ms spacing until reply1 or1s/maximum201GETs;whole child30s bound. Preserve raw buffers,timestamps,API results and rejected frames in JSON even on failure. Never resend SET;no190/220/90/188/187/reset,rollback or mode selection. Require correct envelope,count>=8 and candidate slot2 on completed reply;any contradiction stops. Repeated GET is waiting for the original read request, not reissuing it. This round does not implement or run this transport change.

Then, in the same recorded no-edit state and without power removal,source comparison can use346[62],346[90],nine477 and only446wire2 (12querySETs maximum). Query mode,do not select mode. Use a known existing active/persistent profile difference only if one already exists;otherwise do not create a new difference to “prove” RAM/Flash. After closing diagnostic,reopen App andrecord actual nine parameter values,time,any launch-side writes and all intervening actions; do not press Apply/Restore/Save. A curve screenshot alone is insufficient. If App auto-writes on launch,this is a confound requiring transfer evidence. Identical active/persistent values cannot discriminate source. This controlled session should be specified/approved in the next round,not automatically executed now.

## Reproduction / regression boundary

```powershell
cd D:\Henry\Documents\ChatGPT\AuraPEQ
node .\scripts\freedsp\analyze-readback.mjs .\tests\freedsp\fixtures\henryReadback20261009.json .\tests\freedsp\fixtures\henryReadback20261009.log
```

This command reads files only. Saved output:henryReadback20261009Analysis.json. Original capture/derived analysis/synthetic delayed-completion case are explicitly separate. Production and diagnostic runtime unchanged;no automatic CONNECT/A-B initialization. Missing provenance/enabled/stereo/freshness and failed remaining446 retain the full Readback BLOCKED gate.
