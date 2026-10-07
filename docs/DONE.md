# AuraPEQ FreeDSP Verified Work

## 2026-10-07 — Round 0
- 確認開始時專案目錄為空，尚非 Git repository。
- 從 upstream clone 到 D:\Henry\Documents\ChatGPT\AuraPEQ，沒有額外巢狀目錄。
- 基準 commit：af0bcf7057860307bf81b00746f0cbdb93366514。
- 建立本機分支 fix/freedsp-conexant。
- 設定 upstream 為 mandy321/Audiocular-Aura.git，origin 為 henryshuen/Audiocular-Aura.git。
  這只驗證本機設定；不表示遠端 fork 已存在。
- 驗證 gh 已安裝但權杖無效，公開 fork 查詢回報 Repository not found。
- Node v24.16.0、npm 11.13.0；以原有 package-lock.json 完成 npm ci。
- 在新增任何專案檔案前，原始 upstream 的 npm run build 成功：tsc + Vite 4.5.14，12 modules。
- 完成 FreeDSP 路徑唯讀稽核，證據與未確定事項記入 ROADMAP。
- 新增四份持續維護文件及 setup/verify/dev 三支 PowerShell 腳本。
- PowerShell 語法解析三支腳本成功；使用 Windows PowerShell 5.1.26100.9549
  實際執行 setup.ps1 成功（exit 0）。
- verify.ps1 實際執行成功（exit 0），TypeScript 與 production build 通過。
  package.json 尚無 test script，明確列為 SKIP，沒有聲稱單元或封包測試通過。
- dev.ps1 啟動 Vite，監聽 127.0.0.1:5173；直接 HTTP GET 到
  http://127.0.0.1:5173/ 與 http://localhost:5173/ 均為 200，回應含 AuraPEQ HTML。
- 5173 已被本輪伺服器占用時，再執行 dev.ps1 回報 Port 5173 is already in use，
  腳本以非零退出，沒有自動改用其他埠或開啟瀏覽器。
- 還原本輪 build 產生的已追蹤 dist 差異；確認 src、package.json、package-lock.json、
  dist 與基準無差異。最終僅新增 docs/ 與 scripts/，未 commit、push 或建立 PR。
- 未執行任何實體 HID、RAM、Flash、聽感或 Android 測試；沒有硬體成果列為完成。

## 2026-10-07 — Round 0.5
- 開始時 git status 乾淨；目前分支 fix/freedsp-conexant。
- origin 為 https://github.com/henryshuen/Audiocular-Aura.git；
  upstream 為 https://github.com/mandy321/Audiocular-Aura.git。
- 確認 Round 0 四份文件及三支腳本已包含在提交
  af0a73c45db495f0b7a9cb6d6c70c04af4d1f647（chore: bootstrap FreeDSP development workflow）。
- 以 git ls-remote 確認 origin/fix/freedsp-conexant 的遠端 SHA 與本機 HEAD 相同。
  本機追蹤分支為 origin/fix/freedsp-conexant，ahead/behind 為 0/0。
- GENERAL 新增永久 FreeDSP-only scope、src/freedsp/ 優先隔離規則與每輪 Scope / regression check。
- DECISIONS 新增 D008；ROADMAP 將 M0 標為 COMPLETE，M1 仍為 PENDING，未開始。
- 以 Windows PowerShell 執行 scripts/verify.ps1，exit 0：TypeScript + Vite build 通過。
  沒有 test script，單元測試為 SKIP；未新增或聲稱完成 M1 測試。
- 還原本輪建置產生的 dist 差異；確認 src、scripts、package.json、package-lock.json、dist 無變更。
- Scope / regression check：FreeDSP-specific source files changed: none；shared source files changed: none；
  Non-FreeDSP protocol code changed: NO。僅四份 docs 文件變更，未操作任何硬體。
- 本輪 localhost HTTP 檢查無法連線；伺服器目前未執行，也未自動啟動。
  固定網址 http://localhost:5173/；啟動命令 .\scripts\dev.ps1。
- Round 0.5 文件修改保留為未提交工作目錄變更；本輪未 commit、push 或建立 PR。

## 2026-10-07 — M1 packet-level test harness
- 開始時分支 fix/freedsp-conexant、HEAD 4329bc6、工作目錄乾淨；remotes 未變更。
- 修改來源前執行 verify.ps1，build 通過，當時尚無 test script，測試為 SKIP。
- 新增 src/freedsp/conexantPacket.ts（封包及 Q22）與 conexantTransport.ts（注入 logger 的最小 transport）。
  封包函式本體與基準相同；原始 Conexant 邏輯抽取區域以外的共享來源比對通過。
- 新增 tests/freedsp/conexantPacket.test.ts 與 conexantTransport.test.ts，合計 16 個有限範圍測試。
- 固定來源碼 fixtures 覆蓋 RAM 190、Flash 220、mode 90；驗證長度、header、transaction ID、
  CTRL 常數、command 位置、整數、負值、Q22 及末 word 截斷。
- Fake transport 證明 reportId=1、61-byte 原物件、不移除首位 1、feature fallback 及失敗傳遞。
  測試只操作記憶體 fake，沒有載入瀏覽器、requestDevice 或實際 USB 傳輸。
- 只新增直接測試依賴 Vitest 4.1.11；保留既有 package-lock packages entries 與原有依賴版本，
  測試工具所需版本隔離於 Vitest 依賴樹。最終 npm ci 成功。
- 新增 vitest.config.ts、tsconfig.tests.json，test script 先檢查測試型別再 vitest run。
  verify.ps1 將 test 設為必要關卡，不再默默略過；失敗時非零退出。
- 最終 verify.ps1 通過（exit 0）：TypeScript + Vite 4.5.14 build、測試 TypeScript、
  2 test files / 16 tests。沙箱執行曾因 Vitest 暫存 rename EPERM 失敗並正確退出 1，
  使用正常檔案權限後同一軟體驗證通過。
- descriptor/reportCount=61 僅確認為既有儲存庫註解，未宣稱本輪取得真實 descriptor；
  沒有硬體日誌 fixtures，相關限制與 framing hypothesis 記入 ROADMAP。
- Scope / regression check：Non-FreeDSP protocol code changed: NO。
  沒有改 RAM/Flash/mode/preamp/readback 語意；沒有硬體寫入或聽感測試。
- 四份 docs 均已更新；M1 軟體框架完成，M2 未開始。
- localhost HTTP 檢查無法連線，未啟動伺服器；固定網址 http://localhost:5173/，
  啟動命令 .\scripts\dev.ps1。
- 本輪未 commit、push 或建立 PR；變更保留在工作目錄。

## 2026-10-07 — M2A prepared, hardware evidence pending
- 開始時分支 fix/freedsp-conexant、HEAD 6665470、工作目錄乾淨。
- 在來源修改前 verify.ps1 通過 build 與 M1 16 tests（一般檔案權限）；
  沙箱暫存 rename EPERM 屬環境限制，沒有將未執行測試列為成功。
- 完成 current/candidate 的 header 與每個 payload word boundary map，記入 ROADMAP。
- 保留原 builder 不變；唯一候選去除 presumed embedded ID，13 words 的資料長度為 62 bytes。
- 新增開發模式獨立診斷頁與 FreeDSP-only 選取工具；測試確認 descriptor 檢查不 open／send／receive。
- Metadata 顯示完整 browser collections 與各 report/item size/count，計算可確定的 bit/byte 長度；
  不完整、非 byte alignment、同 ID 多筆不明或長度不符時停止，不猜 reportCount 的單位。
- 新增只供探測的 framing switch（預設 CURRENT）及手動 Flat / -12 dB RAM 按鈕。
  只使用選定取樣率，共九段係數與既有 mode 0；Flat / attenuation 只差第 1 段。
- 加入 descriptor 長度 gate：candidate 若與 output 62 bytes 不符，在 open/send 前即阻擋；
  feature fallback 也要求相同長度 descriptor。自動測試只使用 fake device。
- 日誌包含 profile/framing/reportId/length/完整 hex/command/band/rateIndex，
  sendReport 成功或失敗、fallback 使用與 feature 結果；失敗立即停止，不自動重試。
- 最終 verify.ps1 exit 0：TypeScript + Vite build、測試型別檢查、5 files / 38 tests 通過。
- 保留原 M1 16 tests，新增 22 tests；其中固定 PK Q22 fixture 由基準計算得到。
- 純 HTTP GET 確認 localhost root、freedsp-debug.html、Vite 轉譯 debugPage.ts 均回傳 200。
  未操作瀏覽器或 GUI，未自動選取／連接 FreeDSP，也未執行實體 RAM 或 Flash 寫入。
- 原 src/dsp.ts、conexantPacket.ts、conexantTransport.ts、package/lockfile、verify.ps1 均未變更。
  共享 src/main.ts 僅新增 DEV 診斷連結，Non-FreeDSP protocol code changed: NO。
- 四份 docs 已更新；尚無實機 descriptor／聽感結果，M2 不列為完成，也未開始 M3。
- 交付時 dev server 正在執行，http://localhost:5173/；啟動命令 .\scripts\dev.ps1。
- 本輪變更未 commit、push 或建立 PR；停止等待 Henry 的 descriptor 與手動測試結果。
