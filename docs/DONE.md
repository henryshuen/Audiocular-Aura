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
