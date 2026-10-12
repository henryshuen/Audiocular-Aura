# AuraPEQ FreeDSP Edition v0.1.0

A Windows 11 x64 portable release for the original Moondrop FreeDSP, VID `0x35D8` / PID `0x1496`. This independent fork of [Audiocular-Aura by mandy321](https://github.com/mandy321/Audiocular-Aura) is not maintained or endorsed by the upstream author or hardware vendors.

## Download and start

Download `AuraPEQ-FreeDSP-v0.1.0-win-x64.zip` and its `.sha256` file, extract all files, and double-click **Start AuraPEQ FreeDSP Edition.exe**. Keep the launcher open. Use WebHID-capable Chrome or Edge at **http://localhost:5173/** and click **CONNECT DAC**.

The Windows native helper and .NET runtime are bundled. No separate developer tools, SDK or runtime installation is required. This is a local browser UI supported by a Windows helper, **not browser-only FreeDSP support**. INSTALL APP / PWA does not replace the launcher.

## Hardware acceptance

device owner tested the Windows Portable ZIP downloaded from GitHub and reported PASS for:

- ZIP extraction and launcher startup without installing developer tools.
- FreeDSP connection, EQ readback and ORIGIN / EQ A / EQ B behavior.
- Nine-band Peak / Low Shelf / High Shelf preset import.
- Stereo RAM Apply: 18/18 matching write acknowledgments and audible EQ change.
- Flash Save: 56/56 matching acknowledgments, including the final commit.
- Persistence after USB power removal, reconnection and launcher shutdown/restart.

No critical malfunction was reported. Testing was performed on one Windows PC; no second PC was available. This limits compatibility coverage but is not treated as a blocker for this release. Isolated clean-machine compatibility is not claimed.

## Flash saving

Flash saving may take approximately **10–20 seconds**, based on current observations. Timing can vary. Do not disconnect FreeDSP or close the launcher during the transaction; wait for the final completion or failure message.

Do not assume elapsed time alone means the save completed. Failure stops without automatic retry or rollback. An interrupted operation can leave partially changed state.

## Archive and source revision

This release reuses the exact hardware-tested Preview archive bytes under a stable download filename. It does not rebuild or alter the executable, frontend, native helper, RAM190, Flash220 or coefficients. Internal package/version labels remain `v0.1.0-freedsp-preview`.

- Binary and bundled `SOURCE.zip` source commit: `13c3e148d1327e61c4f2198698020c321d7c51c6`.
- Stable tag `v0.1.0`: the final documentation-only revision on `fix/freedsp-conexant`; executable/frontend/protocol build inputs are unchanged from the binary source commit.
- GitHub's stable tag source archive includes the newer README and stable notes. The ZIP's embedded Preview documentation/source are retained intact.
- Preview release and tag `v0.1.0-freedsp-preview` remain unchanged.

SHA-256 of the unchanged portable ZIP:

```text
18DA5B547011C46DA30156B73F44A383E8BB64F5B13AFD24EDC101D5C40B7236
```

## Supported scope and limitations

Nine stereo PEQ bands support PK/LSQ/HSQ with application gain policy −16 to +6 dB. ORIGIN is read-only; EQ A is an approximate reconstruction and EQ B starts Flat. Editing/import/workspace switching are local; RAM Apply, confirmed resets and Flash Save are explicit hardware actions.

Readback is approximate: whole-dB Gain, Q raw/256 and locally assumed enabled state. RAM/Flash source, freshness, active rate and stereo completeness remain unconfirmed; it is not a bit-exact hardware backup. Preamp/Auto Preamp, Tone Tilt and hardware utility modes are excluded. Balance and microphone controls remain outside production scope.

The executable is unsigned; SmartScreen or enterprise policy may warn or block it. Verify provenance and checksum rather than disabling security protections. Gain limits do not establish DSP headroom or safe listening volume; positive boosts can clip and updates can click/pop. Start at low volume and remove IEMs before the first Apply. Other hardware revisions and operating systems are not validated targets.

## License and acknowledgments

GPL-3.0. The unchanged ZIP contains the license, upstream acknowledgments, illustrated user guide, buildable corresponding `SOURCE.zip` and Microsoft runtime notices. No official APK or firmware is redistributed.
