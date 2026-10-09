```markdown
Title: Add validated Moondrop FreeDSP stereo PEQ and persistence support

FreeDSP's existing Conexant path did not provide a validated stereo RAM workflow or reliable reply handling. This change isolates support for VID 0x35D8 / PID 0x1496, sends each of nine PEQ bands to both hardware paths, and uses the official Flash metadata/coefficient bank sequence with commit last. Henry verified stereo EQ/Restore and persistence after USB power removal.

CONNECT captures nine parameter and path0 coefficient replies and displays them in the original curve. Existing OFF/A/B controls preserve local work and a confirmed readback-derived baseline. Gain follows the official App policy of -16..+6 dB; reset operations respect nine bands. Editing and slot selection do not automatically write the device, and generic DAC behavior remains unchanged.

FreeDSP requires a Windows native HID helper for host-initiated Input GET_REPORT, which browser WebHID does not expose. The helper only handles transport and fixed read-only capture; coefficient generation and PEQ sequencing remain isolated in src/freedsp. The current tested workflow is scripts/dev.ps1 at http://localhost:5173/ with Node/npm and .NET 10 SDK.

Validation: 322 offline frontend/integration tests, 93 native mocks, TypeScript checks, production build and git diff --check passed; RAM18 and Flash56 golden sequences retained. Hardware evidence is separately documented. Readback Gain is integer dB, Q is raw/256, local enabled switches are declared assumptions, and active RAM/Flash origin, path1, original fractional Gain and same-tuple freshness remain unverified. Preamp, Tone Tilt and utility controls are excluded; positive gain does not imply verified clipping headroom.

Submission blocker: agree helper installation/distribution and supported deployment/origin handling. The current helper accepts only localhost5173, so the upstream GitHub Pages site and the static build alone cannot provide FreeDSP functionality. This draft is not a submitted PR or release; do not widen the origin gate as an incidental UI cleanup.
```
