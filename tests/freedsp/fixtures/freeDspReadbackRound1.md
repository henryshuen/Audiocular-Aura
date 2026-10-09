# FreeDSP Readback Round 1 — hardware evidence and automatic preview

## Result and scope

CONNECT now automatically requests a fixed read-only capture and displays a separate nine-band parameter table and non-flat coefficient response preview. The local editor and local A/B slots are never replaced. No RAM Sync, Flash save, mode switch, reset or enabled-state invention. Full precision device-to-editor reconstruction remains BLOCKED; the useful read-only preview is delivered in this round, not another diagnostic preparation round.

Hardware evidence:
- Henry's capture: `nine-eq-38148eeed31c4f69b5a1d2d359fe0f9e`, UTC 2026-10-09 02:52:30.
- Codex standalone repeat: `nine-eq-4d9dfa2c248846e2af9359cc5649ca8a`, UTC 03:04:14;18SET/18GET, every firstGET matched.
- Codex authenticated production-helper HTTP check: `/session` -> `/connect` metadata -> `/readback`, UTC03:12:05,18 complete query records. Native exact VID35D8/PID1496/MI03CAF/usage0x0c:1/caps62/62 gate passed.
- All three captures have identical18rawRX buffers. Byte equality proves consistency across these reads, not nonce freshness or RAM/Flash source. It does not demonstrate polling was necessary: all completed atGET1.
- One existing command346[62] query returned index5/48000Hz. No mode query/setter added. Total Codex hardware actions this round:37 fixed read-only query SETs (18+1+18), no190/220/90/reset.
- Server processes started for HTTP validation were stopped; no pre-existing process was terminated. No Computer Use, official App automation, write experiments, PR or release.

Primary JSON, redactedTX/RX logs and hash provenance are fixtures `henryNineReadback20261009.*`, `codexNineReadback20261009.*`, `codexApiReadback20261009.*`; rate log is `codexRateReadback20261009.log`. JSON preserves all packet bytes; only HID instance paths were redacted from copied logs. Original HTTP child log path/hash is in API provenance. Negative EQ persistence evidence is not disturbed; reading positive metadata is not a new positive-gain write/listening experiment.

## Exact 477 decode

Every reply: reportID1,prefix0,CTRL0xB32D2300,command477,reply1,count6,matching band1..9,rateRaw5,typeRaw0. Fields at helper-buffer offsets10/14/18/22/26/30: rate/band/frequency/Qraw/type/Gainraw.

| Band | Frequency Hz | Gain dB | Gain raw hex | Q raw | Exact Q | Official rounded Q |
|---|---:|---:|---|---:|---:|---:|
| 1 |220|-1|00FFFFFF|256|1|1.00|
| 2 |750|+1|00000001|460|1.796875|1.80|
| 3 |1250|-2|00FFFFFE|640|2.5|2.50|
| 4 |2000|-1|00FFFFFF|256|1|1.00|
| 5 |3000|-2|00FFFFFE|512|2|2.00|
| 6 |4000|-2|00FFFFFE|512|2|2.00|
| 7 |6300|+1|00000001|1280|5|5.00|
| 8 |60|-7|00FFFFF9|102|0.3984375|0.40|
| 9 |4500|0|00000000|256|1|1.00|

PK/type0 agrees with existing exact-device coefficient use. Enabled is absent/unavailable. Band9 unity cannot distinguish zero-gain enabled from disabled. Do not fabricate nine true flags for automatic editor replacement.

Pinned SDK `getEQParamList` invokes `formatByteToSingedInt` at offset30, not a simple signed32 read. That utility combines signed Java bytes without unsigned masks. For the observed/policy integer range -16..+6 it yields the signed values above even with zero high container byte. New decoder accepts sign-extended32 or zero-extended24 containers, sign-extends24, then applies existing metadata policy. Offline tests compare Java byte-OR behavior over every policy integer; no general claim that the buggy-looking Java helper is a correct arbitrary int32 parser. Frequency/type/Q remain unsigned/nonnegative parameter words. The old signed32-only gain decoder incorrectly rejected these actual negative frames; corrected only in readback, not write encoders.

Q is exactly raw/256. App formatDecimal uses two-decimal HALF_UP; rounded display1.80/.40 is not the raw1.8/.4 edit. Gain is an integer dB field; no fractional bits. Stored metadata truncation is source-verified but no speculative .5 restoration.

## 446 cross-check

Nine matching path0/wire1..9/count8 replies. Each word2 scaling=3. Decode five coefficient words with signed24 extension; scale=2^(25-3)=4194304, feedback sign as existing verified coefficient model. Using477 parameters/rate5 and existing nativePeakFloat/nativeWordIntervals, all45 actual coefficient words lie in native floor/neighbor intervals, with at most1LSB from the nearest-float model; unity band9 exact.

Band4 actual coefficients fit2000Hz/-1dB/Q1. They do NOT fit-1.5dB (maximum27554LSB discrepancy). The earlier App-1.5 observation is not a synchronized proof of current active gain. This capture's two query families encode the same effective integer-gain profile; do not claim either retained -1.5, silently replace it, or say hardware ignores fractional writes.

Curve preview uses raw446path0 coefficients projected at477metadata rate. At this session346 independently confirmed48kHz; futureCONNECT does not automatically query346, so the UI labels the projection and leaves active-rate/stereo unverified. Graph is a coefficient response snapshot, not audio telemetry, not independent headroom/safe-volume proof.

## Source and precision decision

Official call chain `handleSyGetEqParamsFromFlash -> getEQParamsFromFlash -> getEQMode -> getEQParamList477` strongly identifies SDK saved/custom-profile intent. Physical firmware storage selection, cached/custom bank and activeRAM origin are not independently established.477 has no path/mode/bank argument.446 agreement cannot distinguish active state from a Flash-loaded copy when both profiles are identical. Earlier flat477 and this nonflat477 are different readout sessions; no controlled intervening history supports a stale/default-bank/failing-Flash conclusion.

UI title: `FreeDSP Device EQ — Readback Preview`. Explicit source-unconfirmed / integerGain / exactQ / enabled unavailable / path0-only / snapshot limitations. It is NOT labelled Active RAM or fully verified Saved Flash. Local editor remains separate, including unsaved values. No Slot A/B expansion. No invented fractional Gain or enabled flag. Read-only preview is the strongest supported capability now.

## CONNECT implementation and failure behavior

Authenticated `/readback` launches only fixed pollNineEq; callers cannot select arbitrary command/path/wire. Shared helper token/origin/BUSY/watchdog gates apply. Fixed plan nine446 thennine477, everySETonce, only knownreply0pendingforms GET-poll within1s/5ms; wrong/stale other-band or malformed response STOP, never SETresend or partialUI update. Native child30s watchdog remains unchanged. Payload/later API errors preserve native log and fail preview.

Browser validates all18TXbytes/plan/SETcounts/GETobservations/API/times/raw strict tuples before one DOM publication. Captured records are hardware evidence, not trusted merely because `ok=true`. Sessionbusy/dispose gates block overlappingRAM/Flash. Connection-attempt/device guards discard delayed responses ondisconnect/reconnect; preview cleared ondisconnect; failure keeps `Device EQ Unknown — Local Editor`. Same-tuple stale replies remain unidentifiable without a verified nonce and are explicitly not certified. Preview cannot overwrite editor/presets/localStorage or autosync.

## Round 2 boundary, only if needed

Material blockers for exact automatic editor reconstruction: absent independent enabled flag; missing original fractional metadata; source/same-tuple freshness andpath1 not independently identified. More repeats of the same state cannot resolve them.

One narrowly scoped follow-up: obtain a synchronized official App individual-nine-value snapshot and the exact already-existing lastRAM/Flash profile/action history, then one fixed read-onlycapture in unchanged state. Compare App values plus native inverse/model against raw446 and477; if a known existing active-vs-persisted difference exists, it discriminates source without writes. If no difference/history exists, report that source remains unidentifiable rather than create an unsafe contrast; noRAMchanges without separate authorization/restoration proof. Use at most this one further development round; do not resume broad command research. UsefulCONNECTpreview already ships now.

## Manual check

Start `cd D:\Henry\Documents\ChatGPT\AuraPEQ` then `.\scripts\dev.ps1`. Open `http://localhost:5173/`, normal CONNECT DAC and selectFreeDSP. Confirm new top-level preview has nine rows andnonflatgraph,including220Hz/-1 and60Hz/-7; compare currentofficialAppindividualvalues while accountingforintegerGain andQrounding. Editorbelow intentionallyretainslocalvalues. Do not press Sync/Save/Restore for thisread-onlycheck. Disconnect should hidepreview; reconnect retrievesnewcapture.
