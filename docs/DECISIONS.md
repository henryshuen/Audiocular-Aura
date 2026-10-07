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

## D008 — FreeDSP isolation
fix/freedsp-conexant 分支只針對 Moondrop FreeDSP（VID 0x35D8、PID 0x1496、
CONEXANT / Freeman DSP）。不得刻意修改 SAVITECH、FIIO、FIIO_JA11 或非 FreeDSP 的
MOONDROP / Comtrue 裝置行為。
新增 FreeDSP 實作優先放在 src/freedsp/；共享檔案僅在嚴格必要的 FreeDSP 路徑連接處修改。
每輪必須列出 FreeDSP 專用與共享檔案變更，並回報 Non-FreeDSP protocol code changed。
預設 NO；若為 YES，停止並說明原因後才能繼續。此規則避免 FreeDSP 修正擴大到其他協定。

## D009 — Characterize before correcting framing
M1 將目前封包生成與 Q22 量化放在 src/freedsp/conexantPacket.ts，
最小 transport 放在 src/freedsp/conexantTransport.ts，日誌函式由共享層注入。
src/dsp.ts 保留取樣率、band、RAM/Flash/mode/preamp/readback 的控制路徑。
抽取必須保持 bytes 與 fallback 語意；61 bytes、首位 1 與末 word 截斷仍是目前行為。
固定 fixture 只作來源碼行為刻畫，沒有原始裝置日誌就不能宣稱為已知正確的硬體 bytes。
Framing 修正需要另輪明確授權與新證據；M1 不推進 M2。

## D010 — Hardware-free verification
只新增 Vitest 作為直接測試依賴；鎖定 4.1.11，測試用 Vite 依賴另行隔離，
保留原有應用程式全部鎖定套件。沒有新增 browser、UI 或 coverage 套件。
verify.ps1 的 build 與 FreeDSP test 都是必要關卡，失敗或缺少測試 script 時非零退出。
test 執行 TypeScript 測試型別檢查及有限範圍的 vitest run；自動測試不使用真實 HID adapter。

## D011 — One candidate with a descriptor gate
M2A 只測去除 presumed embedded Report ID 的假設。原始 builder 與正常同步路徑不替換。
候選 buildConexantPacketCandidateNoEmbeddedReportId 保留交易欄位、command、CTRL 與全部 words。
所需長度為 2+4+4+13*4=62 bytes；這是候選的數學需求，不是已證明的硬體 report 長度。
不把舊 61-byte 封包 slice(1) 當成完整候選，因為那樣已丟失末 word 高兩 bytes。
實際 descriptor 無法容納完整候選時停止，另輪取得證據後再決定，不混合其他 framing 修改。

## D012 — Separate inspection from manual writes
診斷頁不匯入 main/fn/dsp，不枚舉曾授權裝置，也不註冊 connect 自動連線。
手動選取階段只讀 collections；只有明確的 RAM 按鈕會在長度檢查後 open/send。
Report 資訊缺失、非 byte alignment、多個同 ID 不明或 bytes 不匹配時 fail closed。
新探測路徑只允許精確 FreeDSP VID/PID；feature fallback 必須檢查 feature descriptor。
現有 transport 與非 FreeDSP 路徑不改動。

## D013 — Bounded RAM comparison
只對 Henry 明確選取的單一取樣率寫入九段（第 1 段衰減、其餘 flat），再用既有 mode 0。
PK 計算沿用基準 computeBiquadCoeffs 的 PK 分支與 Q22 量化，不修改共享數學函式。
兩個比較 profiles 只在第 1 段係數不同；不寫 Flash，不修改 preamp，不實作 DSP readback。
每次最多十個封包，每個 output failure 最多一次有 descriptor 支持的 feature fallback；
任何失敗立即停止，不掃描長度／Report IDs，不做自動重試或硬體實驗。
