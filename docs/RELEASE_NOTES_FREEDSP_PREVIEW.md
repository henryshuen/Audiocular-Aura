# AuraPEQ FreeDSP Edition — Windows Preview v0.1.0

An independent, FreeDSP-focused fork of [Audiocular-Aura by mandy321](https://github.com/mandy321/Audiocular-Aura). This unofficial preview is maintained at [henryshuen/Audiocular-Aura](https://github.com/henryshuen/Audiocular-Aura); it is not endorsed by the original maintainer or hardware vendors.

## Download and start

Download `AuraPEQ-FreeDSP-v0.1.0-freedsp-preview-win-x64.zip`, extract all files, then double-click **Start AuraPEQ FreeDSP Edition.exe**. Keep the launcher running. Your default browser opens **http://localhost:5173/**; use WebHID-capable Chrome or Edge and click **CONNECT DAC**.

The .NET runtime and Windows native helper are bundled. No separate developer tools or runtime installation is needed. The browser INSTALL APP / PWA control does not replace the launcher. A checksum file accompanies the ZIP.

## Included

- Original Moondrop FreeDSP, VID `0x35D8` / PID `0x1496`, on Windows 11 x64.
- Nine stereo PEQ bands: Peak, Low Shelf and High Shelf, with application gain policy −16 to +6 dB.
- Read-only ORIGIN device snapshot, editable reconstructed EQ A, and Flat EQ B with ORIGIN comparison.
- Explicit stereo RAM Apply and persistent Flash Save, with strict acknowledgments and no automatic retry or rollback.
- Local presets, import/export, graphical editing, undo/redo and the accepted reset workflow.
- Strict FreeDSP preset parsing: PK/LSQ/HSQ preserved, invalid input rejected before local changes, all-rate coefficient preflight, and no hardware writes on import.
- Production web assets, loopback services, session/origin validation, owned-instance reuse and cleanup of owned helper children.

device owner confirmed packaged launch, CONNECT and ORIGIN/EQ A/EQ B using an original FreeDSP. Earlier hardware validation established stereo RAM EQ and Flash persistence after USB power removal. Automated offline tests do not validate every imported profile on hardware.

## Limitations

This is a Windows local browser application with a bundled helper, **not** pure browser-only FreeDSP support. Standard Windows browser WebHID cannot provide the required host-initiated Input GET_REPORT replies.

Readback is approximate: integer dB Gain, Q raw/256 and locally assumed enabled state. Its precise RAM/Flash source, freshness, active sample rate and stereo completeness remain unconfirmed. ORIGIN and EQ A are not bit-exact hardware backups.

Global Preamp/Auto Preamp, Tone Tilt and hardware utility modes are excluded. Balance and microphone controls remain outside product scope. Positive boosts can clip without verified independent headroom; gain limits do not establish safe listening volume. Coefficient updates can click/pop. Start at low volume, remove IEMs before the first Apply and do not interrupt a write.

The executable is **unsigned**. SmartScreen or enterprise policy may warn or block it; verify provenance and the SHA-256 checksum rather than disabling security protections. Isolated clean-machine compatibility remains untested. Other FreeDSP revisions and operating systems are not validated release targets.

## Source and license

GPL-3.0. The ZIP includes the quick start, illustrated user guide, GPL license, upstream acknowledgments, corresponding buildable `SOURCE.zip` and Microsoft runtime license/third-party notices. No official APK or firmware is redistributed.

**Release type:** Pre-release · **Version:** `v0.1.0-freedsp-preview` · **Target:** final verified `fix/freedsp-conexant` commit.
