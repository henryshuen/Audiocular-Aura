# AuraPEQ FreeDSP Roadmap

## M0 - Local reproducible baseline — COMPLETE
- [x] fork / upstream configured：Round 0.5 已確認 origin 分支可讀取且與本機 HEAD 相同。
- [x] dependencies install：未修改的 package-lock.json，npm ci 成功。
- [x] build succeeds：upstream baseline 的 tsc && vite build 成功。
- [x] PowerShell scripts：語法解析、setup、verify、dev 啟動及 strictPort 失敗路徑驗證通過。
- [x] localhost server：127.0.0.1 與 localhost 的直接 HTTP GET 均回傳 200。

基準 commit：af0bcf7057860307bf81b00746f0cbdb93366514。
日期：2026-10-07（Asia/Taipei）。Node v24.16.0 / npm 11.13.0。
branch：fix/freedsp-conexant。
origin：https://github.com/henryshuen/Audiocular-Aura.git。
upstream：https://github.com/mandy321/Audiocular-Aura.git。
Round 0 當時 gh auth status 回報權杖無效，fork 查詢回報 Repository not found；
因此當時以 upstream clone 到專案根目錄，未建立巢狀目錄。
Round 0.5：Henry 已建立 fork；git ls-remote origin refs/heads/fix/freedsp-conexant
確認遠端 SHA 為 af0a73c45db495f0b7a9cb6d6c70c04af4d1f647，與本機 HEAD 相同。
此提交包含 Round 0 四份文件及三支 PowerShell 腳本。
本機追蹤 origin/fix/freedsp-conexant，ahead/behind 為 0/0；Round 0.5 開始時工作目錄乾淨。
npm ci 回報 5 vulnerabilities（1 moderate、4 high）；未執行 audit fix 或升級依賴。
M0 與 M1 已完成；M2A descriptor 已由 Henry 檢查，未送 RAM。M2B 完成離線重建調查；正確格式仍未證明。
Round 0 結束時 dev server 正在執行，僅監聽 127.0.0.1:5173。
HTTP 以 curl.exe --noproxy '*' 驗證；一般 Invoke-WebRequest 曾回傳 404，
直接請求已確認 Vite 頁面正確，未改動系統代理設定。
HTTP 驗證只證明文件可提供，不證明瀏覽器 UI 或 WebHID 行為。

## M1 - Packet-level test harness — COMPLETE (software characterization)
- 遵守 GENERAL 的永久 FreeDSP-only scope 與 DECISIONS D008；新增實作優先放在 src/freedsp/。
- [x] isolate Conexant packet construction：src/freedsp/，保留原封包函式本體。
- [x] deterministic packet serialization tests：13 個 packet/Q22 測試。
- [x] mock HID transport：3 個成功、fallback、雙重失敗測試。
- [x] 固定 RAM 190、Flash 220、mode 90 來源碼 fixture。
- 實際日誌 fixture 尚無來源可建立；目前 fixture 不是硬體擷取或正確協定證據。
- [x] NO hardware behavior assumptions；沒有裝置存取，也未開始 M2。

## M2 - Single-band RAM proof — NOT PROVEN
Goal: Make ONE intentionally obvious attenuation PEQ change work in FreeDSP RAM.
Use attenuation, not dangerous boost, for initial real-hardware testing.
Example: PK / 1000 Hz / -12 dB / Q around 0.7-1.0.
Success: Henry can clearly hear the difference while all other variables remain fixed.

### M2A — descriptor inspection COMPLETE; RAM NOT TESTED
- [x] 精確 current / candidate byte map 與長度推導。
- [x] 開發模式的獨立 descriptor inspection 頁，無自動連線或檢查階段寫入。
- [x] 唯一候選 CANDIDATE_NO_EMBEDDED_REPORT_ID，正常同步仍使用原始 builder。
- [x] 手動 framing switch，預設 CURRENT；RAM-only Flat / attenuation 控制。
- [x] Descriptor gate：容量必須恰好匹配，不能容納 62 bytes 時停用候選寫入。
- [x] 完整 TX/status/fallback logs 與 fake HID tests。
- [x] Henry 提供實際 descriptor 摘要：output data=61 bytes；62-byte 候選未送。
- [ ] RAM 聽感與實際 TX 驗證；M2 成功尚未成立。

### M2B — 61-byte protocol reconstruction — offline investigation COMPLETE
- [x] 原始碼、提交歷史、Issue #3 與原始 Android logcat 證據調查。
- [x] 61-byte descriptor fixture、63/62-byte 矛盾與兩個 61-byte 離線假說測試。
- [ ] 最終正確封包格式；尚缺已知正常的完整 USB bytes 或 native serialization 結構。
- 不送任何候選，不更換 runtime builder，不開始硬體 RAM 測試。

## M3 - Full 9-band real-time PEQ — PENDING
- all 9 bands
- realtime editing
- correct sample-rate behavior
- repeatable RAM writes

## M4 - A/B application — PENDING
- confirm Slot A/B UI actually causes different profiles to be applied to the active DSP path
- do not assume these are physical hardware slots unless proven

## M5 - Flash persistence — PENDING
- save known profile
- disconnect
- reconnect / Android playback
- verify persistence

## M6 - Device readback — PENDING
- read actual FreeDSP state instead of displaying local flat defaults
- verify against profile written by official Moondrop app

## M7 - Global preamp — PENDING
- determine whether FreeDSP exposes a real hardware/DSP master preamp command
- if supported, implement and test
- if unsupported, document clearly instead of faking it

## M8 - Upstream-quality cleanup — PENDING
- regression tests
- documentation
- concise commits
- prepare PR to mandy321/Audiocular-Aura

## Round 0 read-only code audit
以下行號以基準 commit 為準，僅證明程式路徑，不能證明硬體協定正確。

### Detection / layout — VERIFIED source
src/dsp.ts:121 偵測 0x35D8 / 0x1496 為 CONEXANT（前面仍有 override 路徑）。
src/fn.ts:1159-1171 在目前 band 數不等於 9 時建立九段本機預設值，並非裝置回讀。

### H1 — VERIFIED source; hardware capability unknown
src/dsp.ts:1175-1179 的 setGlobalGainConexant 只有 console.debug，
沒有 HID 傳輸或係數修改；它本身也沒有寫入 state，僅日誌稱 stored in state。
src/dsp.ts:231-232 會呼叫此函式，但 789-804 的專用 RAM sync 不呼叫 preamp。
不能從 UI 數值或 README 推論 FreeDSP 已套用硬體 preamp。

### H2 — VERIFIED source; actual readback not implemented
src/dsp.ts:381-460 的 readDeviceParams 只有 FIIO_JA11、MOONDROP 專用讀取分支。
CONEXANT 會落入 462-510 的 Savitech version/gain/settings/band 查詢，
不是安全地完全略過傳輸。setupListener 在 613-615 對 CONEXANT 直接 return，
不解析其回應；因此 Configuration loaded 並不證明回讀成功。
src/fn.ts:836、1107 連線路徑會呼叫 readDeviceParams。

### H3 — VERIFIED framing evidence; defect remains a hypothesis
src/dsp.ts:1100-1130 配置 61 bytes，packet[0] = 1，註解為 Report ID；
transaction ID 從 offset 1、header 從 3、CTRL module ID 從 7、words 從 11 開始。
src/dsp.ts:1137-1146 同時將 reportId=1 與整個 packet 傳給 sendReport，
失敗則同樣傳給 sendFeatureReport，沒有 slice。
WebHID API 將 reportId 與 data 分開，規範的 data 不含 Report ID：
https://wicg.github.io/webhid/#dom-hiddevice-sendreport 。
這支持 Report ID 重複／偏移的疑慮；尚無實機 descriptor、已知正確原始傳輸與日誌，
不能認定第一個 1 一定不是廠商 payload 欄位，Round 0 不修正。

另有可直接由程式計算的長度問題：所有這些呼叫傳入 13 words，
目前佈局需要 11 + 13*4 = 63 bytes，卻只配置 61。
第 13 個 word 在 offset 59-62，其中 61-62 超出 Uint8Array 範圍，不會被保存。
目前相關呼叫的尾端 words 為零，但宣告長度、padding 與硬體影響仍待 M1 驗證。

### H4 — VERIFIED software path; audible application unknown
src/main.ts:1170-1172 按鈕呼叫 setABCompareState。
src/fn.ts:373-467 複製本機 slotA/slotB 的 EQ/gain，再呼叫 syncToDevice。
只有 MOONDROP 有提前返回分支；CONEXANT 走一般軟體設定交換。
src/dsp.ts:789-804 每次重寫 bands，最後 switchEQModeConexant(device, 0)。
因此目前 Conexant A/B 是軟體設定交換加寫入同一 mode 0；不是實體 A/B 槽證據。

### RAM / Flash / mode — VERIFIED source only
- src/dsp.ts:1072-1078 列出 44.1/48/96/192/384 kHz 對應索引 4..8。
- 1084-1094 計算 b0,b1,b2,-a1,-a2，乘 2^22 並 round。
- 1186-1248：band.index+1；RAM 每 band 以 command 190 寫五組取樣率係數，data[2]=3。
- 1157-1169：command 90，13 words，data[0]=90、data[1]=mode index。
- 875-891、1192-1221：Flash command 220 寫 metadata 與五組係數，
  最後 command 220 的 data[0]=-1 commit；未實際執行。
- 789-804：RAM sync 完成後只顯示 Sync Complete，沒有裝置狀態或音訊驗證。

未證明：RAM 音效、取樣率實際對應、A/B 聽感、Flash 持久性、回讀、硬體 preamp。
Round 0 不建立封包測試或 mock HID harness，這些屬於待核准的 M1。

## Round 0.5 scope
僅更新 GENERAL、ROADMAP、DECISIONS、DONE，加入 FreeDSP 隔離規則及每輪 scope/regression 回報。
不修改 src 或協定程式碼，不操作硬體，不開始 M1。
verify.ps1 已通過（exit 0）；沒有 test script，單元測試為 SKIP。
本輪 HTTP 檢查確認 localhost 無法連線，伺服器目前未執行。
Round 0.5 四份文件修改尚未提交或推送；Round 0 原有提交已確認在 origin。

## M1 findings — 2026-10-07
基準 HEAD：4329bc6（Round 0.5）；開始時工作目錄乾淨、分支 fix/freedsp-conexant。
來源修改前 verify.ps1 通過 build；當時沒有 test script，測試為 SKIP。
M1 最終 npm ci 成功，verify.ps1 通過應用程式 build、測試型別檢查與 16 個測試。
原有應用程式鎖定套件 entries 不變；Vitest 4.1.11 的新版 Vite/PostCSS 等只在測試依賴樹使用。
npm ci 仍回報原有 5 vulnerabilities（1 moderate、4 high），未做 audit fix。

### VERIFIED — current source and fixtures
零起算 byte offset：

| Offset | Current contents |
| --- | --- |
| 0 | 01，原註解稱為 Report ID |
| 1..2 | 固定 transaction ID 1：01 00 |
| 3 | data.length & 0xff，13 words 為 0d |
| 4 | 00 |
| 5..6 | commandId & 0xfff，小端序；190=be 00、220=dc 00、90=5a 00 |
| 7..10 | CTRL 常數 0xB32D2300，小端序 00 23 2d b3 |
| 11 onward | signed 32-bit words，小端序 |

所有封包固定 61 bytes。RAM fixture 首 11 bytes：01 01 00 0d 00 be 00 00 23 2d b3。
13 words 在目前佈局需要 11+13*4=63 bytes；最後 word 的 offset 61、62 超出容量。
截斷測試以末 word 0x12345678 證明只留下 offset 59、60 的 78 56，丟失 34 12。
真實呼叫目前尾端為零；測試用非零 sentinel 是用來顯示容量限制，不是新的硬體命令。
Q22 保留乘 4194304、Math.round、b0/b1/b2/-a1/-a2 次序及正負符號。

Fake transport 實際記錄 sendReport(1, packet)：61 bytes、同一 Uint8Array 物件，
沒有移除首位 1。output failure 後 sendFeatureReport(1, packet) 使用相同物件；
兩者失敗時傳遞 feature-report error。未實際呼叫 HIDDevice。

### VERIFIED — descriptor assumption provenance
基準 src/dsp.ts:35-36 與 50-58 註解聲稱 navigator.hid 曾確認
outputReports[0].reportId=1、reportCount=61 bytes；歷史提交 c7c95fa 也以此為改成 61 的理由。
這是儲存庫既有描述，不是本輪讀取 descriptor 的證據。
沒有原始 descriptor、reportSize、report items 或對應 raw log，不能由此獨立重建實際 report 佈局。

### HYPOTHESIS — framing, not fixed
WebHID sendReport 與 sendFeatureReport 分開接受 reportId/data，data 不應再包含 Report ID。
來源：https://wicg.github.io/webhid/#dom-hiddevice-sendreport 。
目前 offset 0 的 1 若真是 Report ID，就可能重複 ID 並使 vendor payload 位移；
它是否其實是廠商自訂欄位尚未證明，故沒有 slice、縮放長度或調整 command payload。
沒有資料支持直接改成 60、62 或 63 bytes；目前 61 的描述與 63 的程式容量需求不能互相取代。

### Scope / regression check
- FreeDSP-specific files changed: src/freedsp/conexantPacket.ts、conexantTransport.ts、tests/freedsp/。
- Shared files changed: src/dsp.ts（僅 FreeDSP 連接）、package.json、package-lock.json、
  scripts/verify.ps1、vitest.config.ts、tsconfig.tests.json、四份 docs。
- Non-FreeDSP protocol code changed: NO。
來源比對確認抽取區域外程式不變；packet builder 本體與基準相同。
未驗證：硬體行為、真實 RAM EQ、Flash persistence、readback、preamp 或取樣率實際套用。
伺服器本輪未啟動；HTTP 檢查 localhost 無法連線。

## M2A evidence and byte maps — 2026-10-07
基準 6665470，分支 fix/freedsp-conexant，來源修改前工作目錄乾淨。
基準 build 與 16 個測試通過；沙箱暫存 rename EPERM 需一般檔案權限，非測試邏輯故障。

### VERIFIED source bytes vs HYPOTHESIS meanings
下表 offsets 與 bytes 均是 VERIFIED software behavior。
packet[0] 真正的硬體意義、CTRL 常數是否正確及 command/word 在裝置端的解讀仍屬 HYPOTHESIS。
範例 RAM 使用 rateIndex=5、band=1、第三 word=3；coefficients 用基準 Q22，尾 words 為零。

| Current offset | Candidate offset | Field | Size / current retained | Example | Evidence |
| --- | --- | --- | --- | --- | --- |
| 0 | absent | presumed embedded report ID | 1 / 1 | 01 | bytes VERIFIED; meaning HYPOTHESIS |
| 1..2 | 0..1 | transaction ID | 2 / 2 | 01 00 | VERIFIED source |
| 3..4 | 2..3 | count low byte + zero | 2 / 2 | 0d 00 | VERIFIED source |
| 5..6 | 4..5 | commandId & 0xfff | 2 / 2 | be 00 (190) | VERIFIED source |
| 7..10 | 6..9 | CTRL constant | 4 / 4 | 00 23 2d b3 | VERIFIED source |
| 11..14 | 10..13 | word 0: sample-rate index | 4 / 4 | 05 00 00 00 | VERIFIED source |
| 15..18 | 14..17 | word 1: band index | 4 / 4 | 01 00 00 00 | VERIFIED source |
| 19..22 | 18..21 | word 2: current constant | 4 / 4 | 03 00 00 00 | VERIFIED source |
| 23..26 | 22..25 | word 3: b0 Q22 | 4 / 4 | signed LE32 | VERIFIED source |
| 27..30 | 26..29 | word 4: b1 Q22 | 4 / 4 | signed LE32 | VERIFIED source |
| 31..34 | 30..33 | word 5: b2 Q22 | 4 / 4 | signed LE32 | VERIFIED source |
| 35..38 | 34..37 | word 6: -a1 Q22 | 4 / 4 | signed LE32 | VERIFIED source |
| 39..42 | 38..41 | word 7: -a2 Q22 | 4 / 4 | signed LE32 | VERIFIED source |
| 43..46 | 42..45 | word 8 | 4 / 4 | 00 00 00 00 | VERIFIED source |
| 47..50 | 46..49 | word 9 | 4 / 4 | 00 00 00 00 | VERIFIED source |
| 51..54 | 50..53 | word 10 | 4 / 4 | 00 00 00 00 | VERIFIED source |
| 55..58 | 54..57 | word 11 | 4 / 4 | 00 00 00 00 | VERIFIED source |
| 59..62 | 58..61 | word 12 | 4 / only 2 current | sentinel 78 56 34 12 | VERIFIED fixture |
| 61..62 | n/a | out-of-range current writes | 2 / 0 | sentinel 34 12 lost | VERIFIED test |

Current 需要 1+2+4+4+13*4=63，但配置 61；packet[61]、[62] 不會保存。
Candidate 只移除 presumed ID，長度由 2+4+4+13*4=62 推得，完整保留末 word。
這不是把舊 Uint8Array slice(1) 得到的 60 bytes；那樣無法復原既有截斷。
兩者第一 byte 都可能是 01，但候選的 01 是 transaction ID low；不能只看首 byte 判斷是否重複 ID。

Current 首 10 bytes：01 01 00 0d 00 be 00 00 23 2d；完整 module 最後 b3 在 offset 10。
Candidate 首 10 bytes：01 00 0d 00 be 00 00 23 2d b3。
WebHID 兩者皆另外傳 reportId=1；data 分別 61/62 bytes。
規範：https://hid.spec.whatwg.org/#dom-hiddevice-sendreport 。

### Descriptor / framing limitations
診斷顯示 WebHID parsed collections、input/output/feature reports、每個 item 的 size/count。
bytes = sum(reportSize * reportCount) / 8，含常數 padding；缺少欄位或非 byte alignment 不猜 byte 數。
只能檢查 browser 暴露的資料，沒有 raw descriptor bytes，也不是 DSP state readback。
同 reportId 的多筆項目若不明確，先停止，不自行合併推論。
inspect 階段不 open、不 sendReport/sendFeatureReport/receiveFeatureReport。

### Manual gate and exact sequence
1. PowerShell cd D:\Henry\Documents\ChatGPT\AuraPEQ，執行 .\scripts\dev.ps1（若伺服器已在執行，不要重複啟動）。
2. FreeDSP 拔除時開 http://localhost:5173/，點「FreeDSP M2A 診斷（手動選取／RAM）」；
   同頁導航到 freedsp-debug.html。先關閉其他 AuraPEQ 頁籤，避免其自動連線。
3. 停用 Equalizer APO、Windows 音量極低，第一次套用時不要佩戴 IEM。
4. 插入 FreeDSP，點「1. 手動選取 FreeDSP（僅檢查）」並手動授權。
5. 複製 descriptor 輸出，先看 output reportId=1 的 bytes。
6. 只有唯一且完整的 output report=62 bytes 才選 CANDIDATE_NO_EMBEDDED_REPORT_ID；
   若為 61、unknown、重複不明或其他長度，候選被阻擋，本輪先回報 metadata，不做候選 RAM 測試。
7. 取樣率選單與 Windows 播放格式一致；勾選測試條件。
8. 保持同一 framing / 取樣率，先點「套用 Flat（僅 RAM）」，完成且無錯誤後，
   點「套用單段 −12 dB（僅 RAM）」；先檢查日誌，不把 SUCCESS 當作聽感證明。
9. 音量仍極低，確認沒有異常後由 Henry 比較同一播放來源的 Flat / attenuation，
   最多再手動回 Flat 作確認；不寫 Flash、不試正增益、不掃描其他 sample rates。
10. 回報 audible difference YES/NO、metadata、完整 TX 日誌與 browser/device error；任何錯誤立即停止。

實際 report 若為 61 bytes，CURRENT 可保留作原始行為對照，但本輪不要求為了對照另做硬體寫入。
仍未證明：候選格式正確、RAM 聽感、取樣率映射、mode 0 生效、Flash、preamp 或 readback。

### M2A automated verification / delivery state
verify.ps1 最終 exit 0：TypeScript、Vite 4.5.14 build、測試型別檢查、5 files / 38 tests 通過。
其中原始 M1 16 tests 未修改，新增 22 tests 覆蓋候選、metadata、RAM gate 與 fake transport。
PK / 1000 Hz / -12 dB / Q 0.7 / 48 kHz 的 Q22 固定 fixture：
[3701688, -7012371, 3371192, 7012371, -2878576]，由基準 dsp.ts PK 計算取得。
本輪以純 HTTP GET 確認 root、診斷 HTML 與 debugPage.ts 轉譯回傳 200。
沒有執行 browser GUI、瀏覽器 JavaScript 或任何實體硬體操作；UI 實際點擊／顯示尚待 Henry 驗證。
開發伺服器交付時正在 127.0.0.1:5173 執行，網址 http://localhost:5173/。
此狀態是本輪快照，不表示之後仍在執行。
未 commit、push 或建立 PR；M2A 為 PREPARED，不是硬體成功。

### M2A Scope / regression check
- FreeDSP-specific files changed: src/freedsp/conexantCandidate.ts、descriptor.ts、ramProbe.ts、debugPage.ts；
  tests/freedsp/conexantCandidate.test.ts、descriptor.test.ts、ramProbe.test.ts；freedsp-debug.html。
- Shared files changed: src/main.ts（僅 DEV 診斷連結）、四份 docs。
- Non-FreeDSP protocol code changed: NO。
src/dsp.ts、M1 builder/transport、package/lockfile 與 scripts/verify.ps1 均與基準相同。

## M2B investigation — 2026-10-07
開始時 HEAD=652099eed2ba87e1d43c60713985e001e349878a（M2A 已提交），
branch=fix/freedsp-conexant，工作目錄乾淨，origin tracking ahead/behind=0/0（本機 refs）。
origin=https://github.com/henryshuen/Audiocular-Aura.git；upstream=https://github.com/mandy321/Audiocular-Aura.git。
基準 verify.ps1 exit 0：應用程式 build、測試型別檢查、5 files / 38 tests。
下列是本輪現況；前面 M2A PREPARED／未取得 descriptor 的記錄保留為歷史。

### M2A real descriptor result
來源：Henry 本輪提供的實體裝置檢查摘要；不是 Codex 本輪存取裝置，也不是 raw USB capture。
- vendorId=13784=0x35D8；productId=5270=0x1496；productName=FreeDSP。
- Primary collection usagePage=12、usage=1。
- Input reportId=1、reportCount=61、reportSize=8：488 bits=61 data bytes。
- Output reportId=1、reportCount=61、reportSize=8：488 bits=61 data bytes。
- Secondary input reportId=2：1 byte；摘要未提供它的各 item dimensions，fixture 不自行補造。
- WebHID reportId 是 data 以外的參數，61 不是「ID 1 + payload 60」。
- 62-byte 候選未傳送，沒有執行 RAM 測試。Henry 的 feature reports 未提供，不能推定支援 fallback。

### Current contradiction
CURRENT：ID-like byte 0；transaction 1..2；count/zero 3..4；command 5..6；CTRL 7..10；
13 LE32 words 從 11 開始，需要 11+52=63 bytes，配置只有 61。
末 word 邊界 59..62，實際丟失 61..62；非零 sentinel 0x12345678 只留下 78 56。
M2A 去除 presumed embedded ID 後，需要 10+52=62，仍超過真實容量 61。
不改成 63、不送 62、不截斷、不虛構 padding。只移除 Report ID 無法解決全部差距。

### Evidence sources and confidence
| Source | Verified observation | Confidence / limit |
| --- | --- | --- |
| Henry 的 M2A 摘要及 tests/freedsp/fixtures/henryM2ADescriptor.ts | primary size/count、VID/PID、61 data bytes | 高：使用者實機回報；fixture 是摘要轉錄，非 raw descriptor |
| [WebHID specification](https://hid.spec.whatwg.org/#dom-hiddevice-sendreport) | reportId/data 分開；reportSize 是 bits，reportCount 是項目數 | 高：API 規範；不定義 vendor packet layout |
| [dc76a3b](https://github.com/mandy321/Audiocular-Aura/commit/dc76a3b642d2685bd0791e0bd1e1a4360fa4ddaa) | 早期 reportId/count61 記錄，當時仍是 Moondrop 路徑 | 高：提交內容；不是 Conexant native 格式 |
| [e7da5b5](https://github.com/mandy321/Audiocular-Aura/commit/e7da5b51199538e20a6442190e501ec26b29e2a2) | 首次 Conexant builder 就是 11-byte header、13 words，卻配置 62 | 高：原始碼；此版已不足 63，未附 native struct/capture |
| [c7c95fa](https://github.com/mandy321/Audiocular-Aura/commit/c7c95fa9c356b4e462cf52439fdae52931e18699) | 只將 allocation 62 改成 61，沒有調整欄位 | 高：diff；不能證明正確 layout |
| [Issue #3 descriptor](https://github.com/mandy321/Audiocular-Aura/issues/3#issuecomment-4856465603) | 另一位回報者提供相同 primary size/count/id | 中高：公開 parsed JSON；不是 Henry 本輪原始資料 |
| [Issue #3 APK claim](https://github.com/mandy321/Audiocular-Aura/issues/3#issuecomment-4857382348) | 作者聲稱分析 APK/JNI、CTRL、Q22、190/220 | 低：未提供 native serialization 或完整已知正常封包，不能驗證欄位寬度 |
| [Issue #3 length explanation](https://github.com/mandy321/Audiocular-Aura/issues/3#issuecomment-4867348708) | 作者把 61 解釋為 ID 1 + data 60 | 其 WebHID 解釋與 descriptor/規範不符；所述 OS 原因未獨立證實 |
| [Original Android logcat](https://github.com/user-attachments/files/29552424/log.txt), linked in [Issue #3](https://github.com/mandy321/Audiocular-Aura/issues/3#issuecomment-4855191555) | FreemanCnxtUsbDevice 列印 rate/band/coefficients 與 save result | 中：應用程式日誌；不是原始 USB 封包，未提供 header bytes/struct；CafCmdHelper 僅出現在 logcat 篩選命令 |
| [Author's ASR reference](https://www.audiosciencereview.com/forum/index.php?threads/any-software-or-electrical-engineers-on-the-forum-familiar-with-the-usb-spec.51608/#post-2038285) | 本輪工具取得論壇首頁，未取得指定 post | 無可用 layout 證據；未把論壇推測當成事實 |

本機 git log --all、-S Conexant、-S 61、相關 blame/diff、README 與 tracked file 清單已檢查。
未找到 native/JNI source、CAF struct 或已知正常 USB packet fixture；README 的即時 RAM/Flash 宣稱不等於硬體證據。
Issue 的 Aura TX hex 是這份 builder 產生的資料，不能當成官方程式的正常封包。

### A–K reconstruction questions
| Question | Verified source behavior | Hardware conclusion / evidence needed |
| --- | --- | --- |
| A: packet[0] 是否 vendor data？ | byte=1，註解稱 Report ID；WebHID ID 是外部參數 | 未定；native serialization 或完整 capture 才能辨識是否 vendor prefix |
| B: transaction 是否 2 bytes？ | source 固定 01 00 | 未定；未觀察可變 transaction 或 native type |
| C: count 是否 2 bytes？ | source mask 0xff，只賦值低 8 bits，下一 byte=0 | 可能是 U8+reserved，也可能 U16/bitfield；不能直接刪零 |
| D: command 是否 2 bytes？ | source mask 0xfff、左移 16，佔兩 bytes | 12-bit 值是 source 行為，非硬體型別；190/220/90 都小於 256，不能證明 U8 |
| E: CTRL 是否 4 bytes且此位置？ | source 0xB32D2300、LE32 在 7..10 | native CafId 實作與 field offset 未取得 |
| F: 是否 13 payload words？ | runtime 配 13，RAM 8 個非 padding 欄位加 5 個零尾 words | 13 是 app 陣列長度，未證明 native 定長/count 語意 |
| G: 是否全為 32-bit？ | builder 每個 item 寫 4 bytes | native metadata packing 未取得，Q22 也不證明 metadata 全為 int32 |
| H: 是否 implicit/header-packed？ | app 明確序列化每個 item | 未定；無資料支持省略特定 word |
| I: first word 是否 duplicated？ | RAM first=rate index；mode first=90，與 command90 相同 | mode 的數值重複不能推廣到 RAM190；需 native command schema |
| J: native190 是否 12 words？ | 只有 JS 的 13 words 可核對 | 未取得 native 定義；改為 12 也只是 10+48=58 或 11+48=59，不會自行變成61 |
| K: JNI 是否 append fields？ | 作者聲稱 JNI 架構；沒有 native source | 未定；需 Java/native 邊界及底層 serialize code，不能把推測列為完成 |

### 61-byte reconstruction candidates — OFFLINE, UNVERIFIED
若保留 13 個 LE32 words=52 bytes，header 必須為 9 bytes。以下只建立可檢驗的兩種假說，
不聲稱為完整候選空間；vendor prefix、packed metadata 或不同 native word count 仍可能成立。

| Candidate | Header offsets (zero-based) | Header / payload / fields / total | Changes vs CURRENT | Evidence / confidence / uncertainty |
| --- | --- | --- | --- | --- |
| COUNT_U8 | txn U16 0..1; count U8 2; command U16 3..4; CTRL U32 5..8; words 9..60 | 9 / 52 / 13 / 61 | 移除 presumed ID、count 區 2→1 | source count mask 0xff，原高 byte 固定0；調查優先1，硬體信心低，該 byte 可能必須保留為 reserved |
| TRANSACTION_U8 | txn U8 0; count/command U32 1..4; CTRL U32 5..8; words 9..60 | 9 / 52 / 13 / 61 | 移除 presumed ID、transaction 2→1 | source txn 固定1，沒有高 byte 動態證據；調查優先2，硬體信心更低，native type 未知 |

兩者保留 source command 的12-bit上限、完整 module 常數與13個signed words，reportId=1另存於 envelope。
不加任意 padding；超過欄位寬度、非整數或 words 不等於13即拒絕，不能 silent truncation。
src/freedsp/conexantReconstruction.ts 只由測試匯入；正常 app、診斷頁與 RAM probe 均未連接它。
尺寸匹配只證明算術與序列化，不證明 descriptor 允許的內容可被 DSP 正確解讀。

### Problem / hypothesis / next action
Observed problem:
- CURRENT 63-byte semantic layout 被61-byte buffer截斷；去除 presumed ID 仍為62；實機容量61。
Verified facts:
- Henry descriptor output reportId1/count61/size8=488bits=61 data bytes；62-byte候選未送，沒有RAM測試。
- 原始 Conexant 提交就存在容量不足；後續只改buffer長度，沒有native格式證據。
- 原始 Android logcat 無完整 on-wire header；兩個離線假說可以完整保留13words而恰為61。
Possible causes (ranked HYPOTHESES):
1. Header 重建有誤：presumed embedded ID加上count/reserved區的寬度解讀錯誤。
2. Transaction 欄位寬度／是否為wire欄位有誤；固定01 00不足以判定。
3. Native payload長度、metadata packing/implicit欄位，或JNI邊界加入額外欄位造成JS重建過長。
Ruled out / weakened:
- 改buffer63或送62都超過descriptor；Report ID alone無法消除全部差距。
- 12 words alone不能解出61；刪零或invent padding沒有證據。
- Sync Complete、README、作者implementation宣稱與應用層success不能證明DSP套用或native layout。
Next validation:
- 優先取得官方 app 的 CafCmdHelper/native serializer：transaction type、count/command bitfields、
  CafId/CTRL、command190 native參數陣列及HID reportId prefix加入位置；索取作者當時使用的精確APK版本／函式片段。
- 若原始碼不足，另輪經Henry指示才從官方app已知正常操作取得完整USB擷取，包含descriptor、
  endpoint/control setup、reportId與實際data長度，及對應rate/band/五係數；至少比較兩個band/rate辨認欄位。
- 本輪不開始擷取、不要求現在RAM操作、不送候選；先比對native結構或既有capture。
Possible fix direction:
- 僅在 native/USB 證據確認後修改 src/freedsp/ 的明確欄位寬度或packing，加入已知正常bytes fixture；
  保持external reportId及descriptor gate。若native words非13，依schema修正呼叫者，不能單純縮buffer。

## Evidence for upstream / Issue #3
- Hardware: Henry 的 Moondrop FreeDSP / CONEXANT Freeman，VID35D8/PID1496。
- Descriptor: usagePage12/usage1，input/output reportId1，count61×size8=488bits=61 data bytes；secondaryinputid2=1byte。
- WebHID reportId外傳，61不可解釋為「ID+60」。
- Current: 11+13×4=63塞進61，末word丟失bytes61..62；移除embeddedID仍62。
- Tested: 純軟體descriptor fixture、截斷sentinel、兩種9+52=61離線假說及原有軟體回歸。
- NOT tested: 62-byte候選未送，沒有RAM/Flash/聽感/preamp/readback或新candidate硬體操作。
- Hypotheses: header widths/reserved、implicit/packed字段或JNI/native邊界重建錯誤；均未證實。
- Needed: 作者的native serialize code／精確APK與完整known-good USB bytes，而非目前Aura生成的TX日誌。
- 本輪沒有發表GitHub留言。

### M2B Scope / regression check
- FreeDSP-specific files changed: src/freedsp/conexantReconstruction.ts、tests/freedsp/conexantReconstruction.test.ts、tests/freedsp/fixtures/henryM2ADescriptor.ts。
- Shared files changed: docs/GENERAL.md、ROADMAP.md、DECISIONS.md、DONE.md；共享runtime無修改。
- Non-FreeDSP protocol code changed: NO。

### M2B automated verification / delivery
verify.ps1 exit 0：TypeScript、Vite 4.5.14 production build、測試型別檢查，6 files / 47 tests。
原有38tests均通過，新增9tests驗證descriptor容量、原始截斷、62-byte gate、兩種61-byte完整序列化、
external reportId及拒絕超出field width／缺少或過多words；沒有呼叫實體WebHID。
git diff --check 通過；本輪產生的dist建置差異還原，原runtime/package/scripts均未修改。
未commit/push、未發Issue留言；停止於M2B，M2 RAM proof仍NOT PROVEN。
交付前確認既有AuraPEQ Vite程序PID8048監聽127.0.0.1:5173，localhost純HTTP GET=200；
本輪沒有啟動新server、開瀏覽器或執行browser JavaScript。這是當下狀態快照。
固定網址 http://localhost:5173/；啟動命令 .\scripts\dev.ps1（已在執行時不要重複啟動）。
