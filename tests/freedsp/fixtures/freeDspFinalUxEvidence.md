# FreeDSP final UX evidence — 2026-10-09

Scope: exact VID35D8/PID1496 connection state, per-band App gain policy, two Reset actions. Offline source review and mocked tests only. Henry's earlier stereo RAM PASS and 56/56 Flash acknowledgments plus persistence after physical reconnection remain recorded; this round does not repeat or extend hardware validation.

## Supplied screenshots

- `codex-clipboard-d1abdad3-101e-4eb9-9c88-2ca97d3a1705.jpg`: official Moondrop App modal explicitly says gain range −16~6dB. Primary visible App policy, consistent with cached APK strings. No firmware or safe clipping limit inferred.
- `codex-clipboard-1d8cc725-bf9a-457d-ad40-7a1db9d8287b.jpg`: official App displays a nonflat EQ. Screenshot alone does not establish which getter supplied it or whether the source is RAM, persistence, or App state.
- `codex-clipboard-9be0df5b-5b79-411a-919b-fa6e1620d7b4.png`: AuraPEQ ONLINE with nine flat local bands and misleading default last-applied label. This is the reported UX defect, not a captured hardware response.

## Readback boundary

Sources: `officialFreemanControlEvidence.md`, `officialRamEvidence.md`, `officialSerializerEvidence.md`, and the existing official 57 helper TX/RX pairs. These are pinned SDK/APK source reconstructions and derived fixture reports, not new physical GET_REPORT responses.

| Source | Verified source behavior | Missing evidence |
|---|---|---|
| 446 getFreeman3EQParam / getF3EQCoefficientList | request [0,slot,…]; exponent byte18; coefficients ints22/26/30/34/38; list raw slots1..9, single SDK getter band+5; native inverse conversion derives EQ parameters | actual exact-device reply, complete stereo interpretation, enabled state, RAM/persistent source, reliable inverse filter identification |
| 477 getEQParamList | requests band1..9; source parses rate10, band14, frequency18, Q*100 at22, type26, signed gain30 | actual exact-device response, per-band enabled state and configuration source; fidelity of fractional gain |
| 442 getFreeman3EQConfig | source interprets sample-rate index at10 | remaining response semantics and complete nine-band schema |
| 346 feature subkeys84/64 | source names global feature availability/enabled bits | no per-band enabled or current profile source mapping |
| 57 saved helper pairs | 90, nine220 metadata,45 coefficient writes,220 commit255,259 firmware | no446/477 replies at all |
| first getEQParam initializer | source may clear selector0/1 slots0..9 to unity190 for firmware string >=7.49.0.0 | not a read-only operation; must not be transplanted into CONNECT |

Decision: do not implement partial/fabricated readback or extend the native command allowlist. CONNECT remains existing metadata inspection only. Preserve local values, display `Device EQ Unknown — Local Editor`; DISCONNECT displays stale/offline and preserves editing state. No per-device saved name is presented as device EQ. Explicit Sync, Restore, Reset or Flash requires an unknown-state overwrite warning. Stale connect/session or late RAM status responses cannot replace the current connection state.

## App policy and Reset

- Central TS capability: −16..+6 dB for exact FreeDSP; generic −12..+12 unchanged. Direct edits visibly clamp; out-of-range presets/imports reject atomically without modifying values. Retained local state on CONNECT is not silently clipped; preflight rejects it until explicitly corrected.
- Existing RAM/Flash validation uses the same policy. Native debug request and Flash metadata allowlist use matching C# constants; those checks needed alignment for −16 to pass. No encoder, coefficient, packet order, transport HTTP/SET/GET behavior or filter choice changed.
- Curve axis is symmetric ±18 dB for FreeDSP so −16 is visible; generic remains ±12. This is display extent, not a combined-response cap or a safety guarantee.
- RESET DEFAULTS: exactly9 enabled PK bands at31/62/125/250/500/1000/2000/4000/8000Hz,0dB,Q0.7.
- RESET TO FLAT: exactly9, all gains0 including disabled rows; retain frequency/Q/type/enabled. This newest user decision supersedes the earlier planned nine1kHz/Q1 reconstruction and local-only development resets.
- Both require explicit confirmation of stereo RAM overwrite, then use the existing RAM Sync path. No Flash saving. Unsupported retained type/invalid frequency or Q still fails existing preflight, visibly, without a new filter implementation. Other DAC reset semantics stay unchanged.

## Manual acceptance pending — Henry only

1. CONNECT with a known nonflat device profile: local values remain, ONLINE is transport state, Unknown label appears. No automatic RAM/Flash write and no readback claim. Disconnect/reconnect keeps local values and shows stale then Unknown.
2. Check slider/numeric/drag −16/+6 boundaries; import out-of-range settings and confirm visible rejection with prior editor intact. This does not require Sync or a positive-gain hardware experiment.
3. When intentionally ready to overwrite RAM, test the two confirmed Reset actions in either order. Defaults has9 expected frequencies/Q.7; Flat retains frequency/Q/type/enabled and zeros every gain. Cancel causes no editor or hardware change. RAM failure must not be called success; neither saves Flash.

Automated checks exercise actual extracted DOM/event handlers, mocked HTTP session races, import atomicity, Reset sequencing, unchanged21 native-derived RAM golden packets and56 Flash packet plan. These checks do not prove current device EQ, clipping headroom, firmware gain limits or new hardware behavior.
