# M2E official RAM/EQ semantics evidence

Pinned official APK: `2.25.0c-260813ai`, SHA256
`04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5`.
Source: https://download.moondroplab.com/moondroplink/android-release.apk

This extends M2D. `officialRamStaticEvidence.json` is deterministic extraction output,
not a RAM transfer capture. Native ELF code was read/disassembled, never loaded or executed.
Optional tools live only in TEMP; project dependencies and production runtime are unchanged.

## Complete recovered source path

1. `UsbDeviceHandler.handleSySendEqParams`: Flutter arguments `band/freq/gain/q` become
   EQParam directly, filterType0 (PK), fallback sampleRate48000. Band is not decremented.
2. `SvcModClient.getUsbEQ` gets the device controller. `FreemanController.setEQParam`
   builds the service command without changing EQParam; Parcel preserves its fields.
3. `FreemanSession.executeCommand`: checks `getEQEnabled`; if false, calls
   `setEQEnabled(true)`, then `FreemanCnxtUsbDevice.setEQParam`.
   The service discards the returned setEQParam error and returns true. This is a source
   limitation in the official SDK; do not copy its success reporting.
4. Freeman3 setEQParam accepts bands0..4. If first CAF enable, it calls188 then187;
   otherwise it goes directly to setFreeman3EQ. It does not invoke90 afterward.
5. setFreeman3EQ fills EQBandParam, queries current rate via346, calls Eq2Coeff, then190.
6. `Eq2Coeff.CxAudioConvertEqParams2Coeffs` calls the registered static native method
   `(ILjava/lang/Object;Ljava/lang/Object;I)I` with sampleHz/input/output/precision24.
7. JNI callback0x27F4 calls convertEQParamFromJni (PLT0x6BC0), then
   CxAudioConvertEqParams2Coeffs (PLT0x6BF0), then writes five Java ints and one byte.
   The Java wrapper returns null for any nonzero conversion result.
8. Native converter0x2ABC calls EqDesignFx0x3510, EqFxToFloat0x3800 and a pole check.
   It maps B0/B1/B2/A0/A1 and stores Gain=e+2. Java promotes them to long,
   then CAF serializer writes their low32bits little endian.
9. CAF sendCmd checks reply/count at the lower layer. Aura currently checks only host
   send promises; its Sync Complete is not a vendor acknowledgement or DSP proof.

## Parameter ABI and output fields

| Native parameter offset | Source | Width / interpretation |
| --- | --- | --- |
| 0 | filterType / flags | low16bits, low4 filter bits consumed |
| 2 | frequency | U16 Hz |
| 4 | Java int(q*256), truncation toward zero | U16 |
| 6 | Java int(gainDb*256), truncation toward zero | S16 |

Native output offsets0/4/8/12/16 are signed32 B0/B1/B2/A0/A1; offset20 is Gain byte.
Java `CX2070xBandEQCoeffs.Gain` is a signed byte. The wire representation remains32bits
after promotion to long; native ABI widths are not the CAF payload layout.

## Exact190 schema / mapping boundary

13words: `[0, band+5, Gain, B0, B1, B2, A0, A1, 0,0,0,0,0]`.
Proven Java input bands0..4 map to wire5..9; both setter guard and getter agree.
This does NOT establish the mapping for Aura's nine bands. The SDK also initializes
slots0..9 with selector0 and1, and Flash uses bands1..9. These are different paths.
Word0 is a fixed0 in real-time writes; channel/target interpretation is plausible
from initialization0/1, but unnamed. It is not demonstrated to be a sample-rate slot.

## Sample rate

`getCurSampleRate`: command346, request `[62,0×12]`; response word1 at full-buffer14
is the index. Only indices4..8 override caller fallback via FREQ_SAMPLE_RATE.
Mapping:4=44100,5=48000,6=96000,7=192000,8=384000. One conversion/write per edit.
The fallback caller sets48000. There is no five-rate RAM loop in this source path.
Separate SAMPLE_RATE_ARRAY has index4=44000; FREQ_SAMPLE_RATE has44100.
The former is used by getFreeman3EQConfig/default readback math, not current RAM lookup.
Extra FREQ_SAMPLE_RATE literals882000/176000 are preserved as source facts, not corrected guesses.

## Native mathematics and precision

For PK, Java/native quantized Q and dB are used, rather than original unrounded doubles.
Let Q=Qraw/256, g=Gain_dBraw/256, w=2*pi*f/fs, A=10^(g/40).
The source converts Q to bandwidth, rounds bandwidth to float32, then computes:

`BW = float32((2/ln2)*asinh(1/(2Q)))`

`alpha = sin(w)*sinh((ln2/2)*BW*w/sin(w))`

The resulting normalized RBJ-style coefficients are stored as float32. A zero gain
uses direct identity `[1,0,0,0,0]`. Aura's alpha=sin(w)/(2Q) differs, especially at high f/fs.

EqDesignFx takes M=max(abs(a1,a2,b0,b1,b2)); e=floor(log2(M))+1.
For precisionP=24, scale=2^(P-1-e), Gain=e+2, therefore scale=2^(25-Gain).
Gain3 is Q22, Gain2 is Q23; precision24 is not a constant Q24 format.
EqFxToFloat and reverse CxAudioConvertCoeffs2EqParams independently implement this relationship.

The internal quantizer0x63AC tries32 floor/floor+1 combinations, clips to signed24 limits,
rejects unstable poles and evaluates responses at three probe frequencies. PK uses
w/2,w,1.2w; other filters adjust probe positions. It is not ordinary Math.round.
Feedback terms are negated after selecting the integer neighbors (EqDesignFx0x3758),
while B terms keep their signs. A0/A1 here correspond to -normalized a1/-normalized a2,
not the conventional denominator a0=1.

The isolated model validates45 recorded Gain values and all225 coefficient neighbor
intervals from the July official Flash dump, whose native conversion is the same as RAM.
It does not reproduce exact native final-neighbor selection or claim those are captured190 writes.

**Do not overstate the Q22 finding:** a coherent Q22/Gain3 pair decodes correctly within
the signed24 range, with lower precision than Q23/Gain2. Native inverse math supports this.
Its difference from SDK output alone does not explain complete silence for attenuation.
Fixed Q22 can overflow signed24 for coefficients of magnitude2 or more; dynamic scaling avoids it.

## Enable / preset / post-write limits

- Service legacy getEQEnabled uses GET_REPORT inputID5,6byte buffer, tests response byte1 bit1.
- setEQEnabled(true) first calls canUpdate (ID5, up to3 checks), then writes
  `[04,40,01,11,C8,03]` via SET_REPORT outputID4/interface3. Disable ends01.
  Actual support of IDs4/5 is not present in Henry's available WebHID descriptor evidence;
  do not fabricate a WebHID write or transplant these operations without a valid descriptor.
- First CAF enable:188 `[1,0×12]`, then187 `[0]`.188 result sets the Java enable flag;
 187 result is ignored. The recovered code can continue even if enabling fails.
- Then346 query, native conversion,190 write/ACK. No post-write90 in this chain.
-90 uses `[90,index,0×11]`, supplied by a separate preset-selection method.
  Flash source identifies preset0 as custom. The APK does not show an automatic90 after
  every190 in Java; whether Dart UI schedules it separately is not reconstructed.
- First getEQParam can query442 and, for firmware>=7.49.0.0 (string comparison), clear
  selector0/1 slots0..9 to identity190. This is first-connect read initialization,
  not a requirement to clear every profile during real-time sync. Do not copy the reset.
- Dart libapp.so is stripped AOT: only snapshot exports, no debug sections. UI event scheduling,
  nine-band live mapping and firmware effects of repeated90 remain unresolved.

## Reproduction

Optional static tool: `python scripts/freedsp/inspect-eq.py <pinned-apk-path>`.
It requires androguard4.1.3, pyelftools0.32 and capstone5.0.6 in a separate research environment.
Normal verify uses saved JSON and Node/Vitest only; no APK, native tool, network or device required.
