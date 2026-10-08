# Control Research Round 2/4: official pregain static evidence

Source: official Moondrop APK v2.25.0c-260813ai102034, retrieved 2026-10-07
from https://download.moondroplab.com/moondroplink/android-release.apk.
SHA256: `04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5`.
No APK/native target execution, device access, volume change or protocol write.

## Reproduction and provenance

`inspect-pregain.py APK PYTHON_LIBS` extracts selected classes.dex methods and
three libutils-lib.so JNI functions with raw code and Capstone instructions.
`inspect-pregain-aot.py APK PYTHON_LIBS DAE_EXE` extracts eight pinned ARM64
functions plus targeted object-pool/caller queries. Dependencies: Androguard
4.1.3, pyelftools, Capstone; dae-rs 0.1.13 compiled from locked crates.
Tool source: https://github.com/ejfkdev/dae and
https://docs.rs/crate/dae-rs/0.1.13. Analysis fixtures include binary hashes.

Snapshot hash `7a1ea3f6f5cf1089a7f6e55d7f20dbfd`: product, compressed pointers,
arm64 Android. dae selects Dart 3.14.0-95.1.beta with matching version hash,
but marks SDK status **UNVERIFIED**. Recovered class field/type labels have
inconsistencies and are not evidence. Raw ARM64 direct calls, selected DEX,
JNI instructions and pool literals establish the bounded findings below.
There are 17,225 unresolved indirect calls; direct caller lists are NOT a
complete call graph. Missing direct xrefs do not establish unreachable UI.
No exact-device remote/cached function-map response was available.

## USB UI, state and family dispatch

USB debug `_readPreGain` body 0x952924 directly calls
`FlutterNative.getSpvPreGain` 0x71c960 at 0x952994. Page pool text explicitly
describes stored USB PreGain read through SPV. This page is a reader.
`FlutterNative.setSpvPreGain` 0x7137ac passes gain/saveToFlash map and method
name setSpvPreGain through `com.moondroplab.moondrop.MethodChannel`;
direct call to invokeMethod at 0x71388c -> 0xb7f35c.

Eleven recovered direct setter call sites belong to SPV PEQ apply/profile,
resetSpvPeq, factory test closures and listening-preference SPV apply. The
factory closures use -1.5, -9.5 and 0; these are not hardware range limits.
`usesSpvUsbPeqProtocol` 0x8e5460 compares normalized device route strings
against /spv, /spv5, /bluetrumusb, /jieliusb. None establishes 35D8:1496.
Device-grid loader 0x76a1bc calls HttpUtils.getDeviceFunc 0x4d3a08;
function lists depend on UUID/version and remote/cache `cachedDeviceFunc_`.
An exact1496 capability/route response was not recovered. Separate legacy
`com.conexant.usb/usb` channel exists; SPV cannot be relabeled CAF.

## USB protocol, native format and transport

UsbDeviceHandler.handleSetSpvPreGain -> task closure
handleSetSpvPreGain$lambda$0 -> Lns4.w(double,boolean) -> Lha4.c(1,35)
-> Lha4.o(buffer,4,gain) -> SpvCodecNative.buildSpvPacket -> Lbt4.k
-> Lat4.call default SPV arm -> UsbDeviceConnection.bulkTransfer.
The setter's omitted saveToFlash argument defaults **true** in Java.
After transfer, Lns4.w waits 100 ms and conditionally invokes Lha4.m;
this generic official call is NOT a safe RAM-only API to transplant.

Unpadded logical bytes: `4B 01 23 02 gainLo gainHi`.
Lha4.c zeros the logical buffer and sets magic/operation/command;
writeQ88 at 0x79080 uses 256.0, adds 0.5, FCVTMS floor and STRH.
buildSpvPacket at 0x78f90 sets byte3 = logicalCount - 4 and returns
logicalCount bytes (six here). Transport pads to endpoint packet capacity.
Read JNI 0x79140 uses LDRSH then SCVTF /256; signed16 LE Q8.8.
Representable arithmetic range -128..127.99609375 dB, step1/256 dB;
neither this range nor actual accepted min/max is confirmed for FreeDSP.
Getter calls Lha4.k(command35) and decodes response offset0 after checking
at least two bytes. No reply was obtained; framing/readback behavior is static.
No channel field occurs in this six-byte SPV setter; that does not prove
FreeDSP master gain, stereo linkage, signal placement or headroom.

The `[SPV][CTRL-OUT]` log label is misleading: selected worker calls
bulkTransfer on the OUT UsbEndpoint, not controlTransfer or SET_REPORT.
Lju2.j enumerates class3 HID interfaces, filters endpoint type3 interrupt,
and requires BOTH IN and OUT before creating a connection candidate.
Lbt4.c also requires its OUT endpoint. Exact captured FreeDSP configuration
has HID interface3 / IN83 ONLY. Audio OUT01 is isochronous in class1 and
cannot satisfy this selection. Therefore this concrete SPV transmitter is
structurally incompatible with the captured 35D8:1496 configuration.
This does not prove no other firmware/API path or app route exists.

## BLE distinction

BLE debug `_readPreGain` 0x93d370 calls sendGetPEQ and updateGraphView;
page text says it computes PreGain from PEQ data. This is not a hardware
pregain register readback. Distinct BleEqProtocolApi.setPreGain 0x976908
passes preGainDb/preGainRaw; Java handler accepts raw -12800..12799.
BleEqProtocolClient.setPreGain uses SET_PEQ_PREGAIN enum ID10 (0x0A),
payload subselector7 followed by signed16 LE raw, units0.01dB, through
executeTyped BLE command executor. BLE framing/GATT and exact1496 routing
are not established. No BLE or SPV mechanism may be transplanted to CAF.

## Decision and missing evidence

Exact1496 pregain routing **not found**. True FreeDSP preamp confidence LOW.
Generic SPV serialization is strongly supported, but cannot qualify as the
exact-device candidate. Remaining gap: exact-device function-map/dispatch
and a compatible distinct control path, plus location relative to CAF PEQ.
Round1 descriptor-supported UAC playback L/R Volume and mono capture volume
remain independent candidates; CUR/RANGE and pre-PEQ placement remain unknown.
BLE mic-gain methods have no exact1496 association; no new balance/mic proof.
Round3 should inspect remaining CAF/firmware candidates only. No hardware
trial, runtime implementation or claim that all hardware preamp is absent.
