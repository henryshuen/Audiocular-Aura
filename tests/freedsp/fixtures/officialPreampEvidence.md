# M2U static preamp evidence

Source: official Moondrop APK 2.25.0c-260813ai102034, downloaded 2026-10-07 from
https://download.moondroplab.com/moondroplink/android-release.apk .
SHA256: `04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5`.
APK/native binaries are not committed or executed. No USB, HTTP bridge or hardware call occurs.

Reproduce with the existing M2D APK and static Python libraries (Androguard 4.1.3,
pyelftools, Capstone). From the repository, use these arguments with
`python scripts/freedsp/inspect-preamp.py`:

1. `APK_PATH PYTHON_LIBRARY_DIRECTORY`: all DEX boundary calls and arm64 ELF symbols/targeted ASCII strings.
2. `APK_PATH PYTHON_LIBRARY_DIRECTORY --follow-pcm`: PCM companion/JNI setter, native body and ELF PLT relocation targets.
3. `APK_PATH PYTHON_LIBRARY_DIRECTORY --freeman-cache M2D_EXTRA_METHODS_JSON`: reuse cached official Freeman extraction. The output records the cache hash. Nearest textual constants are not branch-aware analysis.

Outputs correspond to officialPreampBoundaryEvidence.json,
officialPreampPcmEvidence.json and officialPreampCommandEvidence.json.
The focused Vitest suite verifies meaningful provenance and classification boundaries;
it does not verify actual gain capability or firmware absence.

The JNI setter at0xaca0 tail-calls PLT0x144a0, resolved to
pcm_mixer_set_globle_gain. That body at0xb9e0 calls PLT0x14540, resolved to
powf, with10 andgain/20; result goes to float object+4. This setter updates
software PCM state, not a hardware register.

The five direct Java controlTransfer sites are two Comtrue vendor transfers,
one string-descriptor request and two generic HID forwarding methods. This
does not exclude USB requests from Dart/native code. In particular libapp.so
contains USB/BLE pregain strings whose exact-device call graph is unresolved.
No whole-binary semantic-decompilation claim is made.

No fixture contains a recovered exact1496 AudioControl topology, gain range or
dedicated preamp command. See ROADMAP M2U for source-pinned public comparisons,
UAC specifications, candidate confidence and the precise missing evidence.
