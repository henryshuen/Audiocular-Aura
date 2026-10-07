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

## D014 — Separate facts, hypotheses, and next evidence
每個實驗輪次的報告與 ROADMAP 必須更新 Problem / hypothesis / next action 六個欄位，
依直接證據標記 facts、依可信度排序 hypotheses，不混用。DECISIONS 只收持續有效的結論，
DONE 只收已驗證的完成工作；格式能容納 61 bytes 不等於硬體格式正確。

## D015 — External report ID and offline reconstruction boundary
WebHID 的 reportId 與 data 分開，descriptor 的 data bits/count 不包含外部 ID 參數。
Henry 回報的61-byte output不能容納62-byte M2A候選；不得用截斷、任意padding或更大buffer繞過。
M2B hypotheses保留在src/freedsp/離線純函式與測試，不匯入正常runtime或診斷傳輸。
欄位寬度、native words與prefix意義須由native serialization或已知正常USB bytes確認後，
才在另輪授權範圍內修正；本輪不把任何一種假說定為正確protocol。

## D016 — Preserve provenance and transport boundaries
以原始附件/固定commit/hash保存來源。helper byte dump、native struct、host USB transfer與mock fixture
分開標示；未取得hook與transfer參數就不把buffer長度或首位byte當成WebHID邊界。
實際dump的byte值可驗證JS序列化差異，但不能因完全吻合就越過實機descriptor容量限制。
同源repo/論壇重述不是獨立佐證；各command的payload長度與語意不得跨命令無證據泛化。
沒有權威serializer時，下一輪先取得官方app的完整host transfer證據，再決定離線fixture與修正；
不把不確定欄位變成候選RAM寫入實驗。

## D017 — Long research checkpoints
長時間來源研究在每個主要階段將已查來源、verified facts、hypotheses、排除項、未解欄位及下一目標
保存於ROADMAP；DONE只收已執行的調查／驗證，DECISIONS只收持續有效的規則。
官方APK只作靜態資料，原始APK與工具置於暫存目錄；不執行、安裝或提交大型binary。

## D018 — Official Java buffer versus WebHID data
M2D官方APK的CnxtUsbCommand.getUSBMessage與UsbHelper.controlTransfer建立可追溯邊界：
13word命令傳入62-byte完整buffer，HID reportID1在首位；WebHID以外部reportId1與其餘61bytes表示。
不得再保留額外的embedded ID或刪除第二byte/count後zero來湊長度；第二byte固定00，其vendor語意不命名為transaction。
command190須依setFreeman3EQ獨立來源；commit須依官方long常數255，不以-1代替。
此次只建立離線證據，不變更runtime、不驗證硬體效果；短命令容量另行處理，不能一律推廣13words。

## D019 — Shared serialization does not imply shared command semantics
官方source的90/190/220/259共用getUSBMessage，但各command資料來源分開保存。
190的band+5、220的rateIndex/band、commit255與metadata Q×256/gain截整數不得互相替代。
Native Gain是signed byte、coeff fields是signed int，轉Java long後統一寫低32bits；不是mixed-width wire fields。
precision24這個JNI參數不單獨證明Q24或Q22；未確認native數學前不改共享係數公式。
187只有1word、188有13words，對短187不能憑容量補zero後宣稱WebHID已支持。

## D020 — RAM semantics require caller and native provenance
190使用官方即時caller的selector0、band0..4→5..9與current sampleHz；不能把Flash rate4..8/band1..9直接重用。
這個五band SDK限制不證明FreeDSP硬體只有五band，也不授權把九band通通加5。
native precision24搭配Gain=e+2，effective coefficient scale為2^(25-Gain)；固定Q22/Gain3只是一個特例。
Feedback反號與B原符號分開核對；native16bit參數與32bit傳輸word不得混為同一struct。

## D021 — Representation mismatch is not hardware causality
Q22/Gain3在native inverse scale公式與signed24範圍內可自洽；動態Gain2/Q23提高精度，
不能把與SDK不同就直接定為無效或零效果。固定Q22在大係數時可能超出24bit，需動態縮放/範圍檢查。
現有framing按官方布局解讀會成command13/count1/錯CTRL，是最強零效果候選，但仍非實機因果實驗。
188/187與current-rate190來自可追溯Java鏈；mode90是獨立preset入口，190後強制90的必要性與效果未證實。
Service legacyID4/5與短187的WebHID支持未知，未取得descriptor證據不得嘗試；first-read flat初始化不可盲目複製到sync。

## D022 — M2F is a controlled diagnostic, not production replacement
Henry已授權單段manual hardware test。診斷使用官方CAF envelope及selector0/wire5，不替換正常sync或Flash。
187固定report適配保留logical count1，以零padding補到61data；這是本輪明確實驗例外，
不是來源已證的Android短transfer等價性。matching reply缺失時停止，不改framing、不fallback feature、不重試。
WebHID input events與官方GET_REPORT結果是否相同亦待硬體證據；未確認legacyID4/5維持不送。
只採current-rate346有效index4..8；不猜fallback。Native最後neighbor未精確移植，nearest rounding明確標記，
以signed24/穩定pole與離線頻率響應測試約束固定衰減設定。Flat只清測試band，並非備份restore。
ACK不等同可聽EQ生效；Henry回報前M2F hardware proof保持PENDING。mode90獨立手動，首次測試不使用。
