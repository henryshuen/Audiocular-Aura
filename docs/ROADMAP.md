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
M0 與 M1 已完成；M2A 軟體探測已準備，等待 Henry 手動 descriptor / RAM 驗證。
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

### M2A — framing validation / RAM-only probe — PREPARED, manual evidence pending
- [x] 精確 current / candidate byte map 與長度推導。
- [x] 開發模式的獨立 descriptor inspection 頁，無自動連線或檢查階段寫入。
- [x] 唯一候選 CANDIDATE_NO_EMBEDDED_REPORT_ID，正常同步仍使用原始 builder。
- [x] 手動 framing switch，預設 CURRENT；RAM-only Flat / attenuation 控制。
- [x] Descriptor gate：容量必須恰好匹配，不能容納 62 bytes 時停用候選寫入。
- [x] 完整 TX/status/fallback logs 與 fake HID tests。
- [ ] Henry 的實際 metadata、聽感與 TX 日誌；M2 成功尚未成立。

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
