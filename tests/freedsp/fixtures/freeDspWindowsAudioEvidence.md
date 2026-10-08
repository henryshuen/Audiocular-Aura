# Round4 FINAL: Windows hardware controls and four-round closure

2026-10-08 read-only Core Audio COM query; exact adapter35D8:1496/MI00,
service usbaudio2 / INF usbaudio2.inf, no driver replacement. Live evidence:
freeDspWindowsAudioEvidence.json. ABI read/diagnostic slots were checked
against Microsoft SDK headers; hashes/URLs in windowsAudioReadAbiEvidence.json.
No setters or stream creation were executed by Codex, no CAF/PEQ/Flash, raw
USB/KS request, driver/reset, endpoint-volume or Windows-setting change.

## Supported API and evidence levels

[DeviceTopology](https://learn.microsoft.com/en-us/windows/win32/coreaudio/devicetopology-api)
exposes adapter subunits along endpoint paths. The reader first resolves
IConnector.GetDeviceIdConnectedTo and requires exact VID/PID in adapter ID.
Only matched endpoint paths receive control reads. Metadata enumeration of
other endpoints identifies/excludes them; no unrelated control setters exist.

[IAudioVolumeLevel](https://learn.microsoft.com/en-us/windows/win32/api/devicetopology/nn-devicetopology-iaudiovolumelevel)
activated on IPart is a hardware control interface, using per-channel dB
current/ranges. [IAudioMute](https://learn.microsoft.com/en-us/windows/win32/api/devicetopology/nn-devicetopology-iaudiomute)
is the hardware mute interface. These were successfully activated on each
matched path, rather than treating ordinary Windows endpoint volume as proof.
[QueryHardwareSupport](https://learn.microsoft.com/en-us/windows/win32/api/endpointvolume/nf-endpointvolume-iaudioendpointvolume-queryhardwaresupport)
returned3 (hardware Volume+Mute) for both endpoints; endpoint getters agreed
with the direct topology controls. Software fallback is possible in general,
so the hardware topology interface/path checks are the stronger evidence.

Windows KS node IDs and part IDs are NOT USB entity IDs.
[IPart local IDs](https://learn.microsoft.com/en-us/windows/win32/coreaudio/using-the-ikscontrol-interface-to-access-audio-properties)
contain KS node IDs in low16bits; no claim node0=FU0 or node2=FU2. Matching
playback2channel/capture1channel hardware nodes to sole UAC FU2/FU5 on saved
descriptor paths is a strong topology correlation, not a directly returned
USB bUnitID or raw CUR/RANGE packet. No undocumented KS EntityID request used.
No additional raw class request is needed for this bounded Windows-level test.

## Read-only results (time-specific)

| Path | Hardware node | Current | Range / step | Mute |
|---|---|---|---|---|
|Playback|Volume local131072 / KS0, two channels|ch0=-74dB,ch1=-74dB|-74..0dB / .5dB|true, Mute KS1|
|Capture|Volume local131074 / KS2, one channel|0dB|-74..0dB / .5dB|false, Mute KS3|

Endpoint IDs, adapter IDs, individual global part IDs and original values
are preserved in JSON. At capture time playback is muted and both channels
at minimum. Further attenuation is impossible from that baseline. The plan
must refuse it; never auto-unmute/raise gain. Range units are driver/Core Audio
dB; NOT original signed16 UAC reply bytes, and not proof of pre-PEQ placement.
These are current read observations, not behavior/listening validation.
E_NOINTERFACE on non-control parts and no adjacent parts at graph endpoints
are expected; both desired hardware-control paths completed without errors.

## Temporary bounded manual diagnostic

scripts/freedsp/windows-control-diagnostic.py is a Henry-operated CLI only.
No permanent page or production UI/native helper modification. Hardware
getters are isolated in read-windows-audio.py (read-only allowlist), numerical
plans in windows-control-plan.py. Diagnostic exposes explicit hardware
IAudioVolumeLevel.SetLevel and IAudioMute.SetMute only; no endpoint-volume
setter, software PCM gain, CAF command or PEQ emulation.

It captures/revalidates both exact endpoints and hardware part identity,
channel count/current/ranges, saves original state BEFORE writes to
%LOCALAPPDATA%/AuraPEQ/control-diagnostic/original-UUID.json, and uses only
reported range/step and original-or-lower levels. Targets are precomputed.
Each selected absolute value is written once and confirmed with driver getter;
first failure stops, no retry/rollback. Partial state is possible; original
file supports explicit --restore recovery, exact IDs/ranges required.
Q explicitly restores saved Volume/Mute on both paths then exits; Ctrl+C/error
does not silently perform extra writes. No restoration success is claimed
until setters/getters and Henry behavior test pass.

Balance test attenuates Windows logical channel0 or1 by at most3dB, leaves the
other at its original value, and CENTER restores original pair (including
any preexisting asymmetry). The expected Windows stereo channel0LEFT/1RIGHT
assignment follows two-channel layout and saved FL/FR descriptor; Henry must
verify ear direction. This is NOT CAF path0/path1 indexing.
Mic test sets mono capture hardware volume to exactly-12dB, explicit
mute/unmute unchanged, and restores saved original level/mute (normally0dB).
Verified range-74..0dB provides attenuation only: positive hardware gain is
unavailable through this UAC control; no mic-up +12dB. If-12dB is above the
saved baseline or outside the reported range, mic-down is blocked. Writing,
recorded attenuation/mute and restoration remain PENDING hardware validation;
changing this diagnostic does not establish a hardware PASS.
This is basic capture volume; no mic DSP, meter/peak query,
sidetone, loopback/monitor/AGC or persistence claim.

One manual session, only when convenient:
1. APO OFF, no test tones, normal music; before starting set a low audible
   unmuted Windows FreeDSP baseline (the captured minimum/muted state cannot
   qualify). Codex does not change this baseline.
2. Run `python -B scripts/freedsp/windows-control-diagnostic.py` in repository.
   Check saved original path and available actions. Any blocked action stays
   blocked; do not test unsupported controls.
3. `center`, `attenuate-left` (expect right bias), `center`, `attenuate-right`
   (expect left bias), `center`. Confirm actual ear direction/restoration.
4. With a working mic and a recording app at baseline, `mic-down`,
   `mic-restore`, `mic-mute`, `mic-unmute`, `mic-restore`. Check recorded signal
   attenuation/mute/recovery; diagnostic does not open a recording stream.
5. `q` restores original pair and capture state. On failure STOP and use the
   printed explicit --restore command; report driver/behavior result, no retry.
No unsupported Preamp/Tone test, no new control research round.

## Final production decisions

| Control | Evidence confidence | Final status | Hardware validation | Reason |
|---|---|---|---|---|
|Preamp|LOW true pre-PEQ semantics|FROZEN-UNKNOWN|No headroom/placement proof|Hardware output/capture attenuation is not Preamp; no PEQ substitute|
|Balance|HIGH Windows hardware path/read/range; numeric FU correspondence inferred|DIAGNOSTIC-ONLY|Read-only PASS; setter/listening/restore PENDING|Bounded original-state CLI ready; main UI remains disabled|
|Mic|HIGH Windows mono hardware Volume/Mute/read/range; numeric FU correspondence inferred|DIAGNOSTIC-ONLY|Read-only PASS; recording/setter/restore PENDING|Only basic capture controls; main UI remains disabled|
|Global Tone|LOW independent mechanism|FROZEN-UNSUPPORTED|No independent hardware control validated|Unsupported in adapter; no assertion silicon cannot implement it; no user PEQ allocation|

Round1/2/3/4 COMPLETE. Control research CLOSED; no Round5. Diagnostic follow-up
is manual validation of known interfaces, not permission for more research
or automatic production integration. Unresolved production controls remain
disabled/frozen. Next milestone MUST be FLASH / PERSISTENCE, then release
cleanup, upstream compatibility cleanup, PR preparation. None started here.
Before PR remove this temporary diagnostic, other debug-only surfaces and
redundant entry points; preserve upstream naming/UX/otherDAC semantics and
minimal documented native transport exception. No new architecture dependency.
