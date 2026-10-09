> 2026-10-09 unit correction: pinned DEX getter divisor1132462080 is float256; saved metadata multiplier4643211215818981376 is double256. Historical Q*100 table text was derived incorrectly. This corrects documentation only; validated write algorithms are unchanged.

# Control Research Round 3/4 — bounded Freeman/CAF closure

Pinned official APK: v2.25.0c-260813ai102034, retrieved2026-10-07;
SHA25604756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5.
Source https://download.moondroplab.com/moondroplink/android-release.apk.
Reproduce `python -B scripts/freedsp/inspect-freeman-controls.py APK PYTHON_LIBS`.
Androguard4.1.3; selected DEX bodies/direct references and one resolved XML.
No target execution, USB access, speculative query, runtime or volume changes.

## Exact family association

R$xml.devicelist resource2132017153 (0x7f140001) resolves to res/qc.xml;
binary XML SHA256f778b2f61b1449db3884f0be5e77a21b0b6c4c424a485ee3a6e56002fd4ea620.
Freeman3 entry includes vendor13784/product5270, exactly35D8:1496, and six
neighboring PIDs. CnxtUsbFactory.createUsbDeviceBase loads this resource at
DEX218/222; identifyDeviceById compares decimal VID then PID at158..226;
matching Freeman3 branch constructs FreemanCnxtUsbDevice at446/450.
This is strong SDK family support, NOT verification every SDK feature works
on every listed device. It does not change Round2's SPV incompatibility.

## Known command constructors and source semantics

All offsets below refer to the app helper's returned byte buffer, NOT an
independently captured USB transfer. CTRL is the CAF module in these methods.
Zero-initialized array capacity/tail is not additional control evidence.

| Command | Caller / direction | Known request and interpreted response | Control classification / unresolved |
|---|---|---|---|
|90|switchEQMode setter; getEQMode getter uses346/90|setter words[90,modeIndex,0...]; query returns int at14|EQ mode selection; exact supported mode domain unknown, no gain field|
|187|setEQCFGIsBypass setter|one word[0], getCmd at32|EQ bypass configuration in source; other values unproven, not master mute|
|188|setFreeman3EQEnabled setter|[1,0...] getCmd at34; send result assigned local enabled flag|EQ enable prerequisite, not attenuation; no independent188 getter in recovered class|
|190|setDefaultAvailable and setFreeman3EQ setters|[path,slot,coefficientExponent,B0,B1,B2,A0,A1,0...]|per-slot coefficient writes; paths0/1 physical LEFT/RIGHT from Henry, not global gain|
|220|saveEQParamsToFlash setter|metadata[0,band,frequency,trunc(Q*256),filterType,trunc(bandGain),0...]; coefficient[rateIndex,band,exponent,B0,B1,B2,A0,A1,0...]; commit[255,0...]|EQ persistence; no global section. Noncustom branch skips coefficient loops and reaches commit; not gain|
|259|getDeviceChipCode / getFwVersion getters|chip query[1,0,0,0] -> int at10; firmware query13zero words -> four ints10/14/18/22|identity/version, no gain capability declaration|
|346|getCurSampleRate/getEQMode/getFeatureConfigFM3 getters|word0 subkey62/90/84/64; return at14|rate, saved mode, availability/enabled flags respectively; unknown bits/tail stay unknown|
|442|getFreeman3EQConfig getter|13zero words -> int at10 -> SAMPLE_RATE_ARRAY -> DEFAULT_FREEMAN3_SAMPLERATE|only sample-rate index interpreted; other returned words unknown, no named gain|
|446|getFreeman3EQParam and getF3EQCoefficientList getters|[0,slot,0...]; exponent byte18, B0/B1/B2/A0/A1 ints22/26/30/34/38|per-band coefficients. List enumerates raw1..9; single SDK getter uses band+5; feedback/24-bit conversions are coefficient semantics|
|477|getEQParamList getter|request[band1..9,0...]; response sampleRate10,band14,freq18,Q*256 at22,filterType26,signed bandGain30|nine EQParam entries; no master/global gain section|

getFreeman3EQParam feeds returned coefficients into CxAudioConvertCoeffs2EqParams
and derives filterType/frequency/Q/bandGain. getF3EQCoefficientList obtains
host OUTPUT_SAMPLE_RATE and converts returned32-bit coefficients to24-bit
representation; host sample rate is not a gain capability. Higher fields in
442/446/477 that the app does not parse have no recovered semantic names.
188/187/current346 and paired190 have prior exact-device hardware evidence;
other query/feature behavior is SDK/source evidence, not new hardware readback.
Legacy non-Freeman3 report/register fallbacks are present in this class, but
are not candidate mechanisms for1496 and are not transplanted.
Initializer also addresses slot0, whereas verified editable wires are1..9.
Slot0's physical purpose is UNKNOWN; its unity coefficient construction does
not establish a global gain stage. No slot0 trial or PEQ-based preamp proposed.

## Complete recovered346 subkeys / flag usage

| Subkey | Source method / construction | Parsed semantics |
|---|---|---|
|62|getCurSampleRate offsets10..40|int byte14 current rate|
|90|getEQMode offsets10..40|int byte14 saved EQ mode|
|84|getFeatureConfigFM3 offsets8/14/40|byte14 availability; bit0 FeatureCtrlEnabled; bit1 DiagnoseAvailable; bit2 HiFiFMAvailable; bit3 DongleLRDetectAvailable; bit4 LPMAvailable; bit5 EQInFWAvailable|
|64|same method offsets352/356/372|byte14 enabled bits1..5 with same feature names|

These four exhaust the subkeys recovered in FreemanCnxtUsbDevice, not the
firmware's possible private namespace. Availability bits6/7, enabled bits0/6/7,
all higher bytes, and actual1496 values were NOT classified/read. The offline
model preserves these bytes explicitly rather than dropping/naming them.
FeatureConfigFM3 fields are passed through parcel/service objects; reviewed
direct Conexant references expose no setter mapping to balance/gain/mic.
This direct SDK-package scope does not exhaust Dart/reflection consumers.
FreemanController.getFeatureConfigFM3 -> service builder -> executeCommand
-> device.getFeatureConfigFM3. LRDetect is a source-named detection feature,
not evidence of L/R level adjustment. HiFiFM/LPM/Diagnose names do not provide
documented gain, audio-unit, persistence or headroom semantics. EQInFW names
EQ presence/enabled state; it does not define global pregain.

## All57 helper pairs cross-check

Existing officialAppUsbHelperDump.txt and analyze-dump.mjs were re-analyzed.
Chronology: pair1 command90 [90,0]; pairs2..10 nine220 metadata writes;
pairs11..55 forty-five220 coefficients (five rate indices4..8 x nine bands);
pair56 command220 commit[255]; pair57 command259 firmware query.
All45 coefficient-log values match band/exponent/B0/B1/B2/A0/A1 exactly.
All TX word8..12 zero. Metadata gain belongs to EQParam.gain, not master gain.
No190/346/442/446/477 transfer, named gain/mic event, separate attenuation
transaction or feature-control setter occurs in this trace. RX firmware words
[9,7,14,1] are version data, not gain values. Mode switch and commit are the
only observed state changes outside individual coefficient/metadata blocks.
This observed save sequence does not exhaust every official app action.
62-entry helper buffers remain helper evidence, not fresh USB wire capture.

## Firmware/capability boundary

Targeted assets names yielded no firmware/config blob. Resolving the actual
resource table did recover the exact SDK device-list XML above; filename-only
search would have missed its obfuscated name. FirmwareParam contains device,
CRC, firmware partition/version, manufacturer/product/serial and USB VID/PID,
not gain/mic capability fields. CnxtUsbDeviceBase.getFirmwareParam claims a
firmware interface and calls FirmwareUpdate.getSynaDeviceInfo; only its static
copying of those fields was reviewed. Nothing was executed or requested.
Actual1496 firmware image/symbols, feature replies and gain-capability schema
are unavailable here. Empty asset inventory or absent SDK APIs cannot prove
silicon lacks private controls. No new native/firmware scan justified by a
concrete gain/mic call chain, no unknown-command expansion/brute force.

## Candidate ranking for final round

| Source -> command/field | Semantic evidence | Exact1496 applicability | Confidence | Blocker / decision |
|---|---|---|---|---|
|Round1 raw UAC -> FU2 Volume channels1/2|independent RW descriptor bits|exact captured1496|HIGH descriptor / MEDIUM bounded Balance candidate|CUR/RANGE, safe backend and behavior unknown; survives final decision|
|Round1 raw UAC -> FU5 mono Volume / master Mute|capture RW descriptor bits|exact captured1496|HIGH descriptor / MEDIUM basic Mic candidate|ranges/driver behavior unknown; no DSP mic/monitor semantics; survives|
|UAC FU2 -> true pre-PEQ Preamp|volume exists, PEQ placement unknown|exact control, not preamp placement|LOW preamp|no headroom proof; no implementation candidate|
|346/84/64 -> LRDetect bits|detection-named boolean only|SDK Freeman3 family matches1496; actualflags unread|REJECTED as Balance|no gain/attenuation payload, values or setter|
|190/446 Gain and477 bandGain|explicit band/coeff constructor/conversion|hardware190 validated and SDK queries|REJECTED as Preamp|per-band exponent/gain, not independent global stage|
|220 unused tail /442 unparsed words /346 unnamed bits|no named caller semantics|family only|LOW, not surviving|unknown is not a control; no experiment justified|
|FirmwareParam identity/partition|metadata fields only|generic firmware interface|REJECTED as gain capability|no gain/control field|
|Tone/mic monitor through known CAF families|no independent source-backed path found|not established|LOW, not surviving|no command/field/unit/control mapping|

Preamp LOW, Balance MEDIUM, Mic MEDIUM (basic UAC volume/mute only), Global
Tone LOW. No HIGH/MEDIUM new CAF gain/channel/mic candidate survives. Two UAC
mechanisms survive as descriptor-grounded final decisions, not permission to
write hardware or enable UI. Round3 COMPLETE; one final round remains. No
Round5; after4 freeze unresolved controls and proceed Flash/persistence,
release cleanup, upstream cleanup. No silently allocated PEQ shelves/preamp.
