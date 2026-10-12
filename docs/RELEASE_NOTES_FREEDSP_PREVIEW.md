# AuraPEQ FreeDSP Edition v0.1.0-freedsp-preview

Windows11x64 portable preview candidate. This is an independent fork release, not an upstream PR or a pure browser-only FreeDSP implementation.

- Extract the ZIP and double-click **Start AuraPEQ FreeDSP Edition.exe**. The production website opens in your existing default browser after its loopback-only services are ready.
- Bundled self-contained .NET10 native transport: no developer tools or separately launched helper required.
- Original Moondrop FreeDSP VID35D8/PID1496: nine stereo PEQ bands, PK/LS/HS,−16..+6dB policy, verified RAM/Flash transaction formats.
- ORIGIN readback snapshot, editable EQ A reconstruction, Flat EQ B and dashed Origin comparison. Automatic recovery of replaced unsaved drafts; no unwanted native CONNECT confirmation.
- Explicit RAM Apply and persistent Flash Save, strict matching ACKs, no automatic retry, rollback or writes on launch.
- Strict localhost origin/Host/session-token helper checks, operation validation, owned-instance reuse and Windows job protection against orphan helper children.

## Known limitations

Chrome/Edge WebHID support is needed; unsupported default browsers must be switched manually. The helper is Windows-only. Readback precision/source/freshness/enabled/stereo/active RAM remain limited. No independent FreeDSP Preamp, Tone, utility-control or physical A/B-slot support is added. Coefficient updates may click/pop; gain limits do not certify listening safety. The binary is unsigned; SmartScreen/enterprise policy may warn or block it. No administrator requirement has been established.

Local extracted-package/loopback tests are not a clean-machine or new packaged-hardware PASS. Final manual Windows/browser/hardware acceptance is required before publication. This round does not publish a Release or tag.

License: GPL-3.0 with upstream acknowledgments, corresponding source archive and Microsoft runtime notices. Verify the accompanying SHA-256 checksum before running.
