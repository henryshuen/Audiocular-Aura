# FreeDSP Flash / persistence: READY / NOT YET HARDWARE PASS

2026-10-09. No physical operations performed by Codex. Control research stays closed.
Primary evidence: pinned official APK SHA256
04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5;
full saved FreemanCnxtUsbDevice.saveEQParamsToFlash/switchEQMode instructions in
officialFreemanControlStaticEvidence.json; serializer/writeGolemCmdToDevice in
officialApkStaticEvidence.json; all57 helper pairs in officialAppUsbHelperDump.txt.
July helper instrumentation/app version is unknown; these are buffers, not new USB
captures. Current pinned source and old bytes independently agree on layout/order.

Reproduce derived evidence (no APK/device dependency):
`node scripts/freedsp/analyze-flash.mjs > officialFlashEvidence.json`.
Saved JSON contains selected source offsets and all56 mode/Flash request heads.

## Evidence and complete packet plan

All requests: reportID1 separate from61 data bytes, helper62 with ID; prefix high0,
CTRL0xb32d2300, count13,13 LE32 words. Body tail zero. Sequential SET once then
Input GET_REPORT; no browser-only transport, feature fallback or fire-and-forget.

| Class | Words | Source / observations |
|---|---|---|
|Select custom|90 command `[90,0,zeros(11)]`|switchEQMode; first dump pair, before metadata|
|Metadata|220 `[0,wire,freqHz,trunc(Q*256),PK0,trunc(gainDb),zeros(7)]`|DEX140..232;9 observed wires1..9|
|Coefficients|220 `[rateIndex,wire,Gain,B0,B1,B2,A0,A1,zeros(5)]`|DEX386..878;45 observed, wire outer/rate inner|
|Commit/save option|220 `[255,zeros(12)]`|DEX1022..1054; observed FF000000, never FFFFFFFF|

Here `zeros(N)` denotes N zero32-bit words.
Exact order: custom0 -> metadata wire1..9 -> coefficients wire1 rate4..8,
wire2 rate4..8, ... wire9 rate4..8 -> commit255 LAST.56 requests total,
55 command220 (9+45+1). All known90/220 RX buffers: reply1/count0/CTRL/matching
command. Count0 capacity words are not status or PEQ readback. There is no named
transaction ID in this recovered framing; serialize one in-flight request and
match report/prefix/module/command/reply/count. No invented echoed-word requirement.

Rates4=44100,5=48000,6=96000,7=192000,8=384000 from official FREQ_SAMPLE_RATE;
not the separate44000 readback-table literal. UI index0..8 maps to wire1..9.
No band+5 here, and no per-path0/1 duplicate Flash writes. The saved schema has
one coefficient set per band/rate. Shared stereo boot configuration is the best
supported inference; firmware applying it equally to both sides remains manual
validation, not proven by RAM path0/1 or by the Flash ACK.

## Coefficients, disabled bands and differences from legacy sender

Reuse hardware-validated RAM PK float/scaling/quantized-pole-check model, with
all five rate plans validated before any SET. Same order/sign: B0/B1/B2,
A0=-normalized a1, A1=-normalized a2; signed24 words within32-bit slots,
scale=2^(25-Gain), dynamic Gain exponent. Gain is not dB or always3.
JNI parameter gain/Q truncate to Q8.8; native precision24 does not mean fixedQ24.
Model remains NOT bit-exact to native32-neighbor optimization; its RAM behavior
is hardware validated. Flash placement/boot behavior is not yet validated.

Metadata gain is whole dB truncated toward zero; coefficient conversion retains
Q8.8 dB. This source-proven discrepancy means fractional metadata reload/display
precision is unknown. Initial persistence test uses integer-6dB to avoid ambiguity.
Frequency truncates to integerHz as native input. Disabled bands keep validated
frequency/Q but metadata gain0 and identity coefficients in all five banks;
there is no persisted enabled flag in the recovered metadata. Zero gain native
converter returns identity. No Tone, preamp, Balance or Mic data is composed.

Legacy upstream differs: per-band interleaved metadata/coefficients, metadata
gain*256/roundedQ, fixedGain3/Q22, commit-1, generic Tone composition and unverified
send/fallback success. Exact FreeDSP uses new isolated plan/transport and does
not call that sender. Other DAC branches remain unchanged. RAM Sync still sends
188/187/346 +18 paired190; Flash adds no190,188,187 or346.

## Prerequisites / mode / safety

Full official save method claims/releases Android interface; it does not call
188/187/346, or90 after saving. Windows helper scopes the exact CAF handle instead.
Use the observed pre-save90 custom0. Do not append undocumented mode switches.
The manual session first verifies RAM EQ (thus existing enable setup). Persistence
of enabled state, boot mode and stereo effect is checked after full power removal.
Commit atomicity, wear limits and failure recovery are undocumented; no rollback
or factory-reset claims. Official first44 coefficient calls still SET then initial
GET, but skip extra polling via false flag; last coefficient and metadata/commit
enable polling. Official coefficient-call failures can be ignored; we never copy
that behavior. Native Flash rejects the first failed/mismatched GET immediately.

Validate all9 bands (existing PK20..20000Hz/+-12dB/Q0.1..10 editor envelope),
all five coefficient banks, finite/stable/signed24 limits, and complete unity plan.
This envelope is not a claim of firmware maximum limits. Before first SET store
exact local editor + packet plan + unity editor/plan under localStorage key
`aura_freedsp_flash_recovery`. Snapshot failure means ZERO writes. Snapshot is
local editor evidence, not a readback/backup of the old device Flash. Editor stays
unchanged. First failure logs ACKED n/56 and failed/unknown label; no later packet,
retry, rollback or factory reset. RAM and Flash share one BUSY/STOP session gate.
RAM Restore recovers live unity only; it cannot restore persistent state. Explicit
new Save of a validated unity editor is supported by the same official schema,
but unity persistence itself still requires validation. On failed Save inspect
the log and stop; no automatic recovery writes are launched.

## One manual session

1. Restart `scripts/dev.ps1` to load updated helper, open http://localhost:5173/,
   normal CONNECT; APO OFF, low Windows volume, normal familiar music, IEM out
   for first Apply and Save. Explicit RAM Restore establishes audible baseline.
2. Import freeDspFlashTest.txt via existing profile import:9PK/Q1/1000Hz,
   Band5=-6dB and all others0. Sync RAM once; confirm both ears change centered.
3. Existing SAVE FREEDSP TO FLASH (PERMANENT), confirm; check56 PASS entries:
   custom0,9metadata,45rate coefficients,COMMIT255. Stop on any failure.
4. Fully disconnect FreeDSP USB, wait5seconds, reconnect. Do NOT RAM Sync or Save;
   avoid Aura interaction until listening. Familiar music must retain the EQ in
   both ears with centered stereo. ACK alone is NOT persistence PASS.
5. If desired afterward CONNECT Aura, Reset Defaults (nine zero-gainPK bands),
   Sync RAM, then explicitly Save again to persist unity. This is a new profile
   save, not an automatic rollback. Report power-cycle persistence separately.

Final status READY FOR HARDWARE VALIDATION, NOT YET HARDWARE PASS. After Henry
reports successful unplug/replug persistence: upstream/product cleanup (including
final9 x1kHz/Q1 flat semantics), final build/release, regression, finalpush/PR.
This round does not perform broad cleanup or change current reset runtime.
