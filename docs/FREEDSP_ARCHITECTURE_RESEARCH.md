# FreeDSP transport architecture
The supported Windows edition uses a loopback native helper for host-initiated HID Input GET_REPORT. WebHID sendReport can send Output reports, but its inputreport event is an interrupt event, not a host Input GET_REPORT API. The validated CAF collection uses report ID 1 with 61 data bytes. Feature report support is absent from this collection.
Native exchanges preserve strict command/module/reply/count matching, exact VID 0x35D8 / PID 0x1496 and bounded read handling. Pure browser support is not claimed. Native probes do not establish browser capability.
