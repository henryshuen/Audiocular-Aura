# AuraPEQ FreeDSP Development Rules

## Hardware
- Original Moondrop FreeDSP
- VID 0x35D8, PID 0x1496
- Conexant / Freeman DSP
- Windows 11
- Henry 有實體裝置，可手動驗證。

## Permanent FreeDSP-only scope
This branch targets ONLY:
- Moondrop FreeDSP
- VID 0x35D8
- PID 0x1496
- CONEXANT / Freeman DSP

Do not intentionally modify behavior for:
- SAVITECH
- FIIO
- FIIO_JA11
- non-FreeDSP MOONDROP / Comtrue devices

Shared files may only be edited where strictly required to connect the FreeDSP-specific path.
Prefer putting NEW FreeDSP-specific implementation into src/freedsp/
rather than expanding unrelated protocol code inside shared files.
此規則適用於本分支所有後續開發輪次；共享檔案的必要連接修改也必須檢查其他協定是否受影響。

## Development philosophy
- Make the smallest change necessary.
- One hypothesis per experimental round where practical.
- Never claim hardware behavior from a successful Promise / "Sync Complete" alone.
- Transport success != DSP behavior success.
- Do not overwrite working protocol code without evidence.
- Do not repeatedly write Flash unless Flash behavior is the explicit test target.
- Prefer RAM tests before Flash tests.
- Keep tests reproducible.

## NO "THUNDER TESTING"
禁止「雷霆測試」：
不要做無必要的大範圍、長時間、重複、破壞性、高風險或窮舉式測試。
優先使用靜態分析、TypeScript build/typecheck、單元測試、packet serialization tests、
mock WebHID tests，以及 PowerShell 自動化驗證。
任何需要真實 FreeDSP、耳機、聽感、WebHID device permission 或實際 USB hardware
的測試，由 Henry 手動執行。

Do NOT automatically run dangerous hardware experiments.

## Testing responsibility
Codex 負責靜態分析、code review、自動測試、packet tests、mock HID tests、
TypeScript/build verification、PowerShell automation 與日誌解讀。

Henry 負責連接實體 FreeDSP、授予 WebHID 權限、在 Chrome/Edge 開啟 localhost、
聽辨 EQ 差異、拔插裝置、明確需要時的 Android 測試，以及回報 console/device logs。

## Computer Use
Do not use Computer Use. Do not automate GUI interaction.
Give Henry clear manual steps instead.

## Token / agent policy
- Default to a single agent.
- Agent Team may be used only when parallel work clearly saves time.
- Maximum recommended parallel agents: 2.
- Each agent must have a narrow, non-overlapping task.
- Do not recursively spawn agents.
- Do not have multiple agents inspect the same files without a specific reason.
- Stop agents once enough evidence is collected.
- Avoid exhaustive repository-wide reasoning when targeted search is sufficient.

## Reproducible local workflow
在專案根目錄執行：

```powershell
.\scripts\setup.ps1
.\scripts\verify.ps1
.\scripts\dev.ps1
```

setup 有 package-lock.json 時使用 npm ci；鎖定檔失效就停止，不默默改用 npm install。
verify 執行 npm run build，接著必須執行 npm run test；缺少 test script 即失敗。
M1 的 test script 先以 tsconfig.tests.json 檢查測試型別，再執行 vitest run。
測試僅涵蓋 tests/freedsp/，Node 環境、單一 worker、無 watch 或瀏覽器。
未來 test script 必須是有限時間、非 watch、無硬體存取的自動測試。
dev 綁定 127.0.0.1:5173，strictPort，不自動開啟瀏覽器。
網址：http://localhost:5173/ 。原始碼可能對曾授權的 HID 自動連線；
Round 0 頁面檢查請先拔除 FreeDSP，不授予 HID 權限。

## Every-round reporting requirement
每一輪結束必須更新 GENERAL、ROADMAP、DECISIONS、DONE 四份文件。
GENERAL 保存穩定規則；DECISIONS 只保存持續有效的決策；DONE 只記已驗證完成事項。
若沒有新增規則或決策，確認原文仍適用即可，不為更新而杜撰內容。

Codex 每輪必須回報：
1. What changed
2. Why it changed
3. Files changed
4. Automated tests run
5. Automated test results
6. What is NOT proven yet
7. Exact manual test for Henry, if required
8. Exact local web URL as a clickable URL
9. Current roadmap milestone
10. Documentation files updated

每輪報告必須包含以下區段：

### Scope / regression check
- FreeDSP-specific files changed:
- Shared files changed:
- Non-FreeDSP protocol code changed: YES / NO

Default must be: Non-FreeDSP protocol code changed: NO.
If YES, STOP and explain why before continuing.
若發現非 FreeDSP 協定程式碼需要修改或已被修改，立即停止並向 Henry 說明原因，
不得默默擴大範圍或繼續該修改。

Never finish a round without this report.

## Permanent experimental documentation rule
EVERY future experimental round must end with this section in its report and update it in ROADMAP.md:

### Problem / hypothesis / next action
- Observed problem: exact behavior observed this round.
- Verified facts: direct evidence from code, descriptor, logs, tests, or Henry's hardware result.
- Possible causes: ranked plausible causes, explicitly marked as hypotheses.
- Ruled out / weakened: explanations ruled out or weakened by current evidence.
- Next validation: the exact next experiment, code inspection, or capture required.
- Possible fix direction: conditional changes if a hypothesis is confirmed.

Never mix verified facts with hypotheses. DECISIONS.md contains only durable conclusions;
DONE.md contains only actually verified completed work. This is mandatory for every future experimental round.
M2B 的 61-byte 純函式只是離線假說，不能因為尺寸吻合就接到 HID 或取代 runtime。
WebHID reportId 是獨立參數；descriptor 的 data 容量不包含它。
Henry 已確認 output data=61 bytes，因此 M2A 的 62-byte 候選不得傳送。
後續硬體輪次須另獲 Henry 指示；M2B 不執行 RAM、Flash、preamp、readback 或聽感測試。

M2C 起的來源研究必須區分原始 serializer、app/helper buffer dump、host USB transfer capture、
以及程式自行生成的 TX 日誌／mock fixture。Signed byte dump 只可按二補數轉換，不刪 byte 或補欄位。
未取得 hook/transfer boundary 時，不能把 dump 長度或首位1定義為 WebHID data 長度或 Report ID。
每個來源記錄 URL、版本/commit/hash、取得日期與限制；同源重述不能當成獨立佐證。
不得因檔名叫 raw/capture 就認定為實機擷取；需檢查 byte 範圍、dump 層級及來源。
各 command 的 payload/count 語意分開驗證，不把90/220或固定buffer容量推廣到190。
研究輪次只保存證據，不以尺寸吻合提升候選信心，也不把不足的證據轉成硬體寫入測試。

長時間研究每個主要階段必須checkpoint到ROADMAP、DECISIONS與DONE，保存已查來源、facts、
hypotheses、排除項、未解欄位與下一目標；context compaction後從文件接續，不重新猜測先前結果。
APK只可從既有證據或官方直接來源取得並作靜態資料解析，固定hash/version，不安裝或執行。
來源證據恢復的serializer仍須與硬體效果分開報告；當輪禁止runtime變更時只新增離線分析／測試。
Henry明確指定remote Git交付的研究輪次，通過verify、scope與文件檢查後，由Codex自行stage intended files、commit、push並確認乾淨工作目錄。

Round 0 僅 bootstrap；不改 Conexant 協定、不操作硬體、不寫 Flash、不建立 PR。
結束後等待 Henry 核准，再開始 M1。

## Packet characterization rules
固定 bytes 的測試描述目前實作，不表示硬體協定正確；已知的截斷或 framing 疑慮也要保留測試。
fixture 必須標示來自原始碼或實際日誌，不可將自行組成的 fixture 稱為硬體擷取結果。
Pure packet tests 不載入 src/dsp.ts、UI、navigator.hid 或真實裝置。
傳輸測試只注入記憶體 fake，檢查 reportId、原始 data 與 fallback／錯誤傳遞。
測試環境基準為 Node 24；Vitest 4.1.11 的最低支援版本由其 engines 限制。

## Manual FreeDSP diagnostics / RAM probe
M2A 診斷只在 Vite 開發模式的 freedsp-debug.html 啟用，與主程式自動連線／回讀路徑隔離。
先拔除 FreeDSP，在 localhost 點「FreeDSP M2A 診斷（手動選取／RAM）」進入同一頁籤，
關閉其他 AuraPEQ 頁籤後才連接硬體。裝置只能透過手動 requestDevice 精確選取 VID/PID。
選取與 descriptor 檢查只讀取 browser metadata，不 open、不 send、不 receive。
WebHID reportSize 單位是 bits；data bytes 以所有 items 的 reportSize*reportCount 相加後除以 8。
不把單一 reportCount 當成 byte count；資訊缺少或報告分散／重複不明時停止，不猜數值。

Framing 預設 CURRENT，僅診斷探測可手動選 CANDIDATE_NO_EMBEDDED_REPORT_ID，
不保存選擇、不影響正常 sync、Flash 或其他協定。一次只測一個 framing 假設。
13 words 的候選需要 62 bytes；實際 output reportId=1 必須有唯一且相同長度的 descriptor。
若暴露容量為 61 bytes，候選按鈕停用，回報 descriptor 即停止；不截斷、補零或另改 words。
output failure 的 feature fallback 也須有唯一且同長度的 feature descriptor，否則停止。

RAM 測試固定第 1 段 PK / 1000 Hz / -12 dB / Q 0.7，其餘八段 0 dB。
Flat 與 attenuation 只對選定的一個取樣率送九組係數與既有 mode 0，共十個封包；
這是固定其餘變數，不是九段功能或多取樣率驗證。不能宣稱傳輸成功就是 RAM EQ 成功。
Henry 手動維持相同來源、Windows 極低音量、framing 與播放取樣率；停用 Equalizer APO，
第一次套用時不佩戴 IEM。不得寫 Flash、使用正增益或依賴 preamp；發生錯誤立即停止。
