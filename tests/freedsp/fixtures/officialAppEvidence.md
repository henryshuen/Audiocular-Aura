# Official-app helper dump provenance

- Source: https://github.com/user-attachments/files/29558901/freedsp_usb_raw_log.txt
- Posted by phucho2306: https://github.com/mandy321/Audiocular-Aura/issues/3#issuecomment-4857176508
- Issue comment timestamp: 2026-07-01T15:45:04Z; retrieved 2026-10-07 (Asia/Taipei).
- Saved verbatim as officialAppUsbHelperDump.txt: 60,438 bytes, original LF text.
- SHA256: f726e1a440d82ad495cf5d9ffeaa0db17f9bbfdc27f9334a8895517f4df6c4cf.
- Tests normalize CRLF to LF solely for Git checkout portability; signed byte numbers are preserved unchanged.
- The exact-path .gitattributes rule disables newline conversion and exempts the source's two original trailing spaces.
- Category: TESTER LOG, official Moondrop app provenance reported in the Issue conversation.
- Not supplied: exact APK version/hash, instrumentation source, original serializer, endpoint/setup,
  actual submitted/completed transfer length, reportId inclusion boundary, independent USB capture.
- 57 TX and 57 RX arrays, each 62 signed byte entries. Observed TX commands at dump offsets 4..5:
  90 (1), 220 (55), 259 (1). No 190 record.
- All TX arrays have [1,0,13,0] at offsets 0..3 and [0,35,45,-77] at 6..9.
  The 52 bytes at 10..61 can be read as 13 LE32 words; this does not prove the native ABI.
- RX firmware record has [4,0] at 2..3 and [9,7,14,1] as four LE32 payload values,
  while the dump array remains 62 entries. Buffer capacity and logical response length differ.
- Bytes match the existing M2A no-embedded-ID builder when fed the observed words.
  This does NOT authorize sending its 62 bytes through WebHID's 61-byte data boundary.
- No runtime code imports this artifact. No hardware writes or new packet hypotheses.
