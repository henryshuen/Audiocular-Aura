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
verify 執行 npm run build，日後若存在 test script 也執行 npm run test。
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
Round 0 僅 bootstrap；不改 Conexant 協定、不操作硬體、不寫 Flash、不建立 PR。
結束後等待 Henry 核准，再開始 M1。
