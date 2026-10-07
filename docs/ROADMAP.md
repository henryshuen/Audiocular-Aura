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
M0 已完成；M1 軟體測試框架已完成，M2 尚未開始，等待 Henry 核准。
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

## M2 - Single-band RAM proof — PENDING
Goal: Make ONE intentionally obvious attenuation PEQ change work in FreeDSP RAM.
Use attenuation, not dangerous boost, for initial real-hardware testing.
Example: PK / 1000 Hz / -12 dB / Q around 0.7-1.0.
Success: Henry can clearly hear the difference while all other variables remain fixed.

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
