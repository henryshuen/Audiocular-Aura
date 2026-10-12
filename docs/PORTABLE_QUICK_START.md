# AuraPEQ FreeDSP Edition

An independent, FreeDSP-focused fork of [Audiocular-Aura by mandy321](https://github.com/mandy321/Audiocular-Aura). [Download this edition](https://github.com/henryshuen/Audiocular-Aura/releases).

Windows 11 x64: **v0.1.1**.

1. Download the Windows x64 ZIP and verify its SHA-256 if desired.
2. Extract the entire ZIP into a normal folder. Do not run from inside the ZIP.
3. Double-click **Start AuraPEQ FreeDSP Edition.exe**. Keep its window open.
4. Your default browser opens **http://localhost:5173/** after both local services are ready.
5. Use a WebHID-capable browser (current Chrome or Edge), click CONNECT DAC and choose the original Moondrop FreeDSP.
6. ORIGIN is a read-only snapshot. EQ A is an editable reconstruction; EQ B starts Flat. Switching is local. Apply changes RAM; Save to Flash explicitly replaces saved EQ.
7. Finish any write before closing the launcher. Press Enter or close its window to stop both services. Closing the browser alone does not stop the launcher.

No Node.js, .NET runtime/SDK, Python, Git, administrator access or PowerShell knowledge is required to run this package. The .NET runtime and native helper are bundled. If your default browser lacks WebHID, open the same URL in Chrome or Edge; this edition does not install a browser.

## Supported hardware

Original **Moondrop FreeDSP**, USB **VID35D8 / PID1496**, Conexant / Freeman DSP with the validated CAF HID collection. Nine stereo PEQ bands, PK/LS/HS, band gain policy−16..+6dB. Other variants are not validated by this Edition. Existing generic DAC support has not been expanded or revalidated here.

## Limitations and safety

- Windows native transport is required. This package is not pure browser-only FreeDSP support or a public HTTPS site.
- Readback is an approximate snapshot: integer Gain, Qraw/256, locally assumed enabled state. Source/freshness/stereo/active RAM and exact Flash backup remain unproven.
- Listen at low volume; take IEMs out before the first Apply. Click/pop transients may occur. Positive gain can clip without verified independent preamp attenuation.
- No FreeDSP Preamp, Tone Tilt, Balance, microphone utilities or physical A/B slots are added.
- Never close the launcher during RAM/Flash writing. Interrupted transactions may have partially changed the device. Failures stop; no automatic retry or rollback.
- Online device database/AutoEQ catalog features need internet. Local editing, presets and loopback services do not require a cloud USB service.
- The executable is unsigned. Windows SmartScreen or enterprise policy may warn/block it. Verify provenance and checksum; do not disable security protections. Code signing and clean-machine/browser acceptance remain future work.
- A writable user Temp and LocalAppData directory is required for bundled runtime extraction, logs and launcher ownership. Restrictive enterprise policies may block this preview; no administrator workaround is prescribed.
- This candidate was tested locally, not on a dependency-free clean Windows machine. device owner has confirmed packaged launch, CONNECT and ORIGIN/EQ A/EQ B on the original FreeDSP. This does not establish clean-machine compatibility or validate every imported preset.

## Troubleshooting

If ports5173/5174 are occupied, close your previous AuraPEQ/dev launcher and start again. This launcher never terminates an unrelated process. A second click reuses its verified owned instance.

If startup reports missing/changed files, extract the full ZIP again. Keep the launcher open while using the browser. Settings/presets use the browser's existing localhost5173 storage; use the same browser/profile and export important presets. Unsaved A/B replaced during CONNECT are recovered in Custom Profiles as `FreeDSP recovered EQ A/B ...`.

Helper logs are under `%TEMP%\AuraPEQ\freedsp-portable-*.log`. Launcher ownership is stored under `%LOCALAPPDATA%\AuraPEQ FreeDSP Edition\owner.json`; it is not a device-state backup. A hard kill can leave a harmless stale owner file, which a new launch replaces after taking ownership.

## License and source

GPL-3.0; see LICENSE.txt and ACKNOWLEDGMENTS.md. Corresponding application/build source is supplied in SOURCE.zip. The bundled Microsoft .NET runtime's licenses/notices are in RUNTIME-NOTICES/.

The browser INSTALL APP / PWA control does not replace this launcher. Full usage, approved screenshots and the supported preset example are in [USER_GUIDE.md](USER_GUIDE.md).

The original FreeDSP requires a Windows HID communication method that standard browser WebHID cannot fully access. This edition therefore includes a local helper to read and save EQ reliably. The download is larger because it bundles the required .NET runtime and application components, so users do not need to install developer tools separately.

Before Flash Save, remove earphones and lower output volume. A sudden loud sound has been reported after completion; its cause is unknown. Saving may take about 10–20 seconds. Continue acknowledges this warning; Cancel sends nothing. Progress counts 56 matching acknowledgments, including commit. Do not disconnect or close the launcher until a final result appears.
