# M2G response transport provenance

Pinned source: official APK2.25.0c-260813ai, SHA256
04756b49acfea523758d86101c96c1824b7b209ae3a8836c07837088e795d2d5.
`inspect-response.py` saves full DEX method instructions, not execution or USB capture.
Optional research dependency: androguard4.1.3. Normal tests use saved JSON only.

## Exact official USB operations

| Operation | requestType | request | wValue | report type / ID | interface | requested length |
| --- | --- | --- | --- | --- | --- | --- |
| sendHIDReport |0x21 host→device/class/interface |9 SET_REPORT |0x0201 | output /1 |3 | TX array.length |
| receiveHIDReport |0xA1 device→host/class/interface |1 GET_REPORT |0x0101 | input /1 |3 | RX array.length |

13-word commands188/346/190 have helper lengths62. Command187 uses one word,
helper length14 for SET and GET alike. UsbHelper passes buffer.length and timeout1000ms
to Android controlTransfer on endpoint0. OUT returns an integer completion length;
it does not return protocol response bytes. A subsequent IN control transfer fills RX.
[Android API](https://developer.android.com/reference/android/hardware/usb/UsbDeviceConnection)
defines direction by requestType and distinguishes actual transferred length from buffer capacity.

## Full synchronous behavior and policy

| Command | Mechanism | Response expected / origin | Caller use | Policy |
| --- | --- | --- | --- | --- |
|188 `[1,0×12]` |sendCmd: SET then repeated GET |reply flag in GET input1 |stores bool mFreeman3EQEnabled; false does not prevent187/190 | MUST_ACK at lower helper |
|187 `[0]` |same synchronous sendCmd, length14 |same GET path |wait occurs; returned bool is discarded | MUST_ACK at lower helper |
|346 `[62,0×12]` |getMsgByCmd: SET, initial GET, repeated GET |input1 buffer, full-helper word1 at offset14 |isExecuteSuccess then reads word1; failure=-1001 | QUERY_RESPONSE_REQUIRED |
|190 selector0/band+5 |same synchronous sendCmd |same GET path |returns bool through setEQParam; service can drop error | MUST_ACK at lower helper |

No recovered command among these supports SEND_SUCCESS_ONLY. In particular, ignoring
the returned bool is not evidence of fire-and-forget: the function already waited.
M2G does not relax M2F gating or invoke its RAM sequence.

sendCmd allocates fresh zero RX at offset52 after TX and polls reply bit until its
outer time check reaches1000ms. Each blocking control call has timeout1000ms,
and loops sleep5ms. getMsgByCmd allocates fresh RX at66 and performs an initial GET
before starting its outer elapsed-time check; its wall time need not be exactly1s.
Both ignore the OUT completion integer and the receiveHIDReport return object.
The IN call mutates the passed RX array, so it is then examined in place.

receiveHIDReport returns the same passed array for a nonnegative transfer result,
including zero/short reads, or null for failure. It does not expose actual read length
to its caller; reused RX capacity may retain earlier bytes between polling iterations.
isExecuteSuccess checks count>=0 and reply1, not command/module equality. CommonUtil
from2ByteToInt masks BOTH bytes with255, so count is unsigned16 and the >=0 check is
redundant; it does not validate an error status or sensible count. The helper's effective
success predicate is reply1 in a nonnull buffer, not a robust matching vendor ACK.
The M2G matcher is intentionally stricter and requires meaningful count>=2 for346.
Source reads physical word1 even without explicitly requiring a positive logical count.
No actual346 response/count or188 response shape has been captured in project evidence.
Known count0 RX belongs to90/220; known count4 RX belongs to259, not346.

## July57 TX/RX pairs: origin limits

The current APK has no `UsbHelperDump` string or such array logging in these helpers.
The exact July APK/hook/log injection is unavailable. Therefore the old arrays are
helper RX observations, not proven interrupt packets or independently captured ACKs.

Ranked interpretations:
1. GET_REPORT-populated buffer is the best supported model for this CAF implementation:
   current source uses a fresh RX, independent of TX, with no memcpy/arraycopy from TX.
   Echo payload in a count0 buffer could be device response capacity beyond logical words.
2. July logger/hook could reuse or mutate request buffers; plausible but unverified,
   because its code is missing. Current source cannot exclude a different old instrumentation.
3. Current Java locally generates an echo/parser result: weakened by fresh zero RX,
   absence of TX copy, and direct controlTransfer input mutation.
4. RX from the same OUT control call or interrupt listener: contradicted for recovered source.

Do not treat all trailing RX capacity as meaningful returned data. Current helper fails
to record actual completion lengths, so source alone cannot certify all62 bytes arrived.

## WebHID and187 transport limits

M2F listener was on the sending HIDDevice, installed before send, removed at completion/
deadline. Byte offsets and report ID separation were correct. Strict61-byte parsing,
ID1 acceptance and nonpersistent lifecycle could hide a short/delayed/other-ID candidate;
however M2F logged every event received during its wait. Henry's representative logs
contain no RX line, so parser changes alone do not yet explain his missing event.

[WebHID specification](https://hid.spec.whatwg.org/#hiddevice-interface) exposes input events
and feature reads; it has no Input GET_REPORT method. Input event data excludes report ID.
Feature GET_REPORT uses a different report type and cannot be substituted for Input.

[Chromium Windows backend snapshot96d204c5](https://chromium.googlesource.com/chromium/src/+/96d204c5f08ced3357eb964d7b1dffa8ebd652b9/services/device/hid/hid_connection_win.cc)
resizes output buffers to collection maximum and uses WriteFile; input uses ReadFile.
This supports the need to distinguish OS report I/O from Android controlTransfer.
It does not prove Henry's browser revision or actual USB endpoint routing.

Strongest187 interpretation: Android requests a short14-byte control report despite
the descriptor's maximum capacity. That is source-proven request length, not measured
completion or proof of61-byte padding equivalence. WebHID itself does not mandate exact
data length in its send algorithm; platform/driver behavior differs. A shorter JS buffer
can still become a padded OS report in the cited Windows implementation. Do not switch
to short187 or claim padding correct without actual transport evidence. M2G sends neither.

## Fixtures / reproduction

`officialResponseStaticEvidence.json`: complete pinned source, deterministic extraction.
`schemaRate346.json`: explicitly SYNTHETIC count4/index5 scenario derived from word1 offset;
not an official346 capture. Existing July259/count4 and90/220/count0 buffers provide
independent parser checks. Mock events cannot prove device interrupt delivery.

Reproduce: `python scripts/freedsp/inspect-response.py <pinned-apk>` in the optional
androguard4.1.3 research environment. No APK/native code execution or hardware required.
