# Control Research Round 1/4: exact USB descriptors

Primary hardware evidence: freeDspUsbConfiguration.json, captured2026-10-08.
Contains enumerated device descriptor, full422-byte configuration, hash, actual
hub IOCTL request headers/returned counts and exact audio-driver service.
Decoded output: freeDspAudioControlEvidence.json.

Collector: scripts/freedsp/collect-usb-descriptors.py. Windows only, stdlib ctypes.
Given exact parent hub PnP instance/port, it locates that hub interface and checks
35D8:1496 before any standard configuration descriptor request. Only two IOCTLs
are allowed: connection information EX and GET_DESCRIPTOR. The latter permits
configuration descriptors only. Opening the hub with access flags required by
the IOCTL is not sending an audio/control OUT transaction.

Re-acquisition is a hardware read and needs the applicable round's authorization;
do not run it as an automatic test. Parent instance/port must be obtained from
current read-only PnP data, not reused after relocation. No driver replacement,
reset, stream configuration, CAF, volume/gain/SET or Flash operation is implemented.

Offline reproduction:

```powershell
python -B scripts/freedsp/parse-usb-audio.py tests/freedsp/fixtures/freeDspUsbConfiguration.json
python -B -m unittest discover -s tests/freedsp -p test_usb_audio_descriptors.py -v
```

UAC2 interface0, playbackIT1->FU2->headsetOT3; clocks9/10.
FU2 has masterbitmap3 (mute read/write, volume absent) and L/Rbitmap0xC
(volume read/write, mute absent). Input terminal clusterbitmap3 supplies
LEFT/RIGHT names. Capture micIT4->monoFU5->USBOT6 is separate.

No raw volume CUR/RANGE was sent/read. These controls are supported by the
descriptor, not yet verified by control replies or listening. Their position
relative to CAF PEQ is unknown; no true preamp or hardware balance claim.

Windows API limit: hub descriptor IOCTL forces standard request0x80/6 and cannot
carry UAC CUR/RANGE. Audio function uses usbaudio2, not Winusb.sys. No alternate
KS/DeviceTopology backend or driver replacement attempted; this does not prove
all Windows read-only volume access is impossible. See ROADMAP for the blocker
and four-round budget.

Primary references:
- [Microsoft USB hub descriptor API](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/usbioctl/ns-usbioctl-_usb_descriptor_request)
- [Microsoft WinUSB architecture](https://learn.microsoft.com/en-us/windows-hardware/drivers/usbcon/winusb-architecture)
- [USB-IF Audio2 specification](https://www.usb.org/sites/default/files/Audio2_with_Errata_and_ECN_through_Sep_14_2026.pdf), Feature Unit4.7.2.8 and Volume5.2.5.7.2.
