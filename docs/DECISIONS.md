# AuraPEQ FreeDSP Decisions

## D001
Do not change Conexant packet code before a reproducible local baseline exists.

## D002
RAM tuning is tested before Flash persistence.

## D003
Initial real-device PEQ tests use attenuation rather than large positive gain for hearing safety.

## D004
"Sync Complete" means only the application finished its transmission path;
it is not evidence that the FreeDSP DSP graph changed.

## D005
Hardware listening tests are manual and performed by Henry.
Automated tests must cover as much serialization/control logic as practical before physical testing.

## D006
Do not implement a fake "global preamp" by blindly multiplying every cascaded biquad coefficient.
A real preamp implementation requires evidence of the correct hardware/DSP control path.

## D007
把程式行為與硬體能力分開記錄。目前 preamp 無傳輸、readback 無 Conexant 解析、
A/B 寫回 mode 0 的證據詳見 ROADMAP；不能據此認定硬體本身不支援那些功能。
Report ID framing 與封包長度疑慮在 M1 以 deterministic tests、descriptor 與已知日誌驗證，
不在 Round 0 改封包。
