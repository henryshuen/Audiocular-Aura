# M2D official APK evidence and reproduction

Source page: https://moondroplab.com/cn/moondrop-link

Direct official artifact: https://download.moondroplab.com/moondroplink/android-release.apk

Retrieved 2026-10-07. HTTP Last-Modified: 2026-09-16T12:00:56Z.
110,710,316 bytes; SHA256 `04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5`.
Package `com.moondroplab.moondrop.moondrop_app`, versionCode102034, versionName `2.25.0c-260813ai`.
This is the current official download, not the unidentified APK used in the July dump.
The English page's app-release.apk returned HTTP500; the Chinese official page provided the working link.

## Static extraction

The APK was never installed, launched, or loaded as application code. ZIP/AXML/DEX were read as data.
Optional Python tool `scripts/freedsp/inspect-apk.py` uses Androguard4.1.3 and refuses a different APK hash.
It emits selected DEX instructions with byte offsets, version, DEX/native hashes and device mapping.
The saved `officialApkStaticEvidence.json` is generated output, not a fabricated capture.
No APK or parser dependencies are committed. They remain in the user's temporary directory.

With Androguard4.1.3 available in a research Python environment:

```powershell
python .\scripts\freedsp\inspect-apk.py <official-apk-path> > officialApkStaticEvidence.json
node .\scripts\freedsp\analyze-dump.mjs > officialAppDumpAnalysis.json
npm test -- --run tests/freedsp/officialLayout.test.ts tests/freedsp/forensics.test.ts
```

Normal `verify.ps1` uses saved evidence and needs no APK, Python package, network or device.
JSON is compared structurally to avoid platform newline differences.

## Decisive instruction locations

All classes below have prefix `Lcom/conexant/`; offsets are bytes within the named DEX method.

| Class / method | Locations | Observation |
| --- | --- | --- |
| universalfunction/CnxtUsbCommand.getUSBMessage | 0–12 | buffer length is10+4N |
| same | 16–38 | argument low byte at0, argument shifted8 at1 |
| same | 42–68 | count&255, command<<16, reply&1<<31 |
| same | 120–166 | module LE32 at6 |
| same | 170–250 | Java long[] low32bits serialized LE at10+4i |
| CnxtUsbCommand.fromUSBMessage | 26,64–92,232–258 | count decodedU16, command15bits, reply1bit, min(count,13) payload words |
| cnxtusbcheadset/CafCmdHelper.sendCmd | 14–38 | entire getUSBMessage buffer passed to SET_REPORT, request33/9/value513/index3 |
| same | 50–52,110–124 | fresh RX buffer with same capacity, GET_REPORT161/1/value257/index3 |
| cnxtusbcheadset/UsbHelper.sendHIDReport | 0,18 | controlTransfer starts at0 and uses buffer.length |
| UsbHelper.receiveHIDReport | 0,18,28–32 | returns entire buffer after any nonnegative completion; does not expose actual length |
| FreemanCnxtUsbDevice.setFreeman3EQ | 164–168,176–270,286–302 | 13 long words, mode0/band+5/Gain/B0/B1/B2/A0/A1; command190; prefix1 |
| FreemanCnxtUsbDevice.saveEQParamsToFlash | 148–232 | separate metadata word mapping, command220 |
| same | 786–878 | rate index/band/Gain/five coefficient words, command220 |
| same | 1022–1054 | new long[13], word0 is literal255, command220 |
| FreemanCnxtUsbDevice.setEQCFGIsBypass | 2,28 | only1 payload word, command187 |
| FreemanCnxtUsbDevice.setFreeman3EQEnabled | 0–14,30 | 13words with word0=1, command188 |
| universalfunction/CommonUtil.shiftEQBandForFreeman3 | 0 | band+5 |
| cnxtusbcheadset/Eq2Coeff | wrapper/signature | JNI converts EQ parameters to coefficient object; does not serialize CAF/USB packet |

`res/qc.xml` maps decimal VID13784/PID5270 (0x35D8/0x1496) to Freeman3.
It also lists other PIDs; those are evidence of the SDK's broader scope, not authorization to modify them.

## Exact recovered boundary

HID control buffer for13words: 62bytes, starts `01 00`.
WebHID output: external reportId1 and61data bytes starting `00`.
Data offsets: byte0=prefix high byte0;1..4=packed field;5..8=CTRL module;9..60=13LE32 words.
The source writes a U16 argument; byte0 is identified as the HID ID using request wValue0x0201,
descriptor and HID1.11. The vendor meaning of the following00 remains unnamed.
All114 recorded buffers are replayed exactly by the independently implemented research model.
TX has count13; zero-count RX retains physical capacity and request payload bytes.
Replay of RX represents the observed response buffer; it does not claim the TX serializer generated RX.

## Limits and next implementation concerns

- No actual USB submission/completion capture or DSP audio result was collected.
- July hook source/app version remains unavailable. Static current source and old observed bytes agree.
- Native conversion receives precision24 and yields a signed byte Gain plus signed int coefficient fields.
  Gain is promoted to a long and serialized as one32-bit word. Precision24 alone does not prove Q24 or Q22.
- Native coefficient arithmetic, Gain semantics and sample-rate/band conventions need independent validation
  before changing coefficient computation. Command190's band+5 is source fact, not an untested band mapping guess.
- Official RAM setup calls188 and187 before190 on first enable. Short187 produces14bytes; fixed61-byte
  WebHID adaptation is not proven. Do not connect this short buffer to the current sender or pad it by assumption.
- Reply bit plus count only expresses app-level acknowledgement. Echo words are not PEQ readback.
- No runtime code, other DAC protocol, normal sync or Flash write path changed in M2D.
