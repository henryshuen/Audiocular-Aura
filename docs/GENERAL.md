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

RAM與Flash的selector/band/rate不得共用未核對的schema。SDK的band guard只證明該API範圍，
不等於硬體band上限；未知九段RAM mapping時不得把所有band直接+5。
固定點係數必須連同Gain/exponent一起檢查；「不同於官方量化」與「數學上無效」分開判斷，
不能把較低精度的自洽表示直接當成零效果原因。Host write完成、vendor ACK、DSP效果分開報告。
官方SDK也可能忽略錯誤或使用descriptor未確認的Report ID；後續FreeDSP實作不得盲目複製或繞過gate。

Round 0 僅 bootstrap；不改 Conexant 協定、不操作硬體、不寫 Flash、不建立 PR。
結束後等待 Henry 核准，再開始 M1。

## Packet characterization rules
固定 bytes 的測試描述目前實作，不表示硬體協定正確；已知的截斷或 framing 疑慮也要保留測試。
fixture 必須標示來自原始碼或實際日誌，不可將自行組成的 fixture 稱為硬體擷取結果。
Pure packet tests 不載入 src/dsp.ts、UI、navigator.hid 或真實裝置。
傳輸測試只注入記憶體 fake，檢查 reportId、原始 data 與 fallback／錯誤傳遞。
測試環境基準為 Node 24；Vitest 4.1.11 的最低支援版本由其 engines 限制。

## Historical M2A manual diagnostics / RAM probe
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

## Historical M2F controlled RAM proof
M2F取代診斷頁的舊CURRENT/candidate九段測試；正常production sync仍不變。
僅DEV頁、手動操作、精確VID35D8/PID1496及input/output ID1各61bytes；無連線自動命令。
只對selector0／SDKband0→wire5送PK1000Hz/-12dB/Q0.7或同段flat；不試未知bands、不寫Flash/preamp。
使用188→187→346→190，每步等待CAF matching reply，host send成功不能宣稱DSP成功。
本輪明確授權187適配實驗：保留官方count1與單word0，補零到固定61data，記錄logical helper14及transport helper62；
這不是已證明的官方短transfer等價性。若無matching ACK即停止，不改count、不猜framing或feature fallback。
不嘗試未確認ID4/5；不自動mode90。90只保留獨立手動診斷，第一次三步測試不按。
未知current rate不猜48000；係數dynamic Gain/scale，保留native最終neighbor未移植的限制。
Henry以低Windows音量、IEM先離耳測試，維持相同來源/音量；flat不是完整原設定備份。
硬體ACK、聽感與flat返回均須Henry回報；不得以mock tests提前標記RAM proof完成。

## Historical M2G transport diagnosis
Henry回報兩次Apply與一次Restore都在188 host send成功後約2.5秒timeout，187/346/190未送；無EQ效果結論。
本輪只診斷接收，DEV頁停用M2F Apply/Restore/90，唯一命令控制為346 query；不改production或非FreeDSP。
所有input events須保存timestamp/counter/reportId/byteLength/fullhex，包括短資料、其他ID及unmatched candidate。
Persistent listener在open/send前註冊，timeout後保留；connection只open接收，不自動TX。
官方GET_REPORT Input與WebHID input event不同；feature read不得假冒Input GET_REPORT。
命令lower-helper reply政策與caller丟棄結果分開判斷；ignored return不等於fire-and-forget。
沒有新證據不得把188降級成send-success-only，更不得因transport猜測自動前進190。
Query346 raw index未知時保留matching response並標Hz UNKNOWN，不猜fallback或宣稱RAM可用。

## Historical M2H response transport policy
Henry提供的M2G結果：raw listener在open/send前ACTIVE，ID1/data61的346 host send resolved，
等2.5秒後rawTotal=0/newEvents=0，沒有任何ID/長度的inputreport。這是Henry回報，非Codex硬體擷取。
本次parser沒有收到事件；不得宣稱DSP拒絕346、沒有回應或RAM失敗。不得要求重做descriptor或原樣重試WebHID346。
一般Windows Chrome網頁沒有WebHID Input GET_REPORT；Feature report不能替代Input report。
WebUSB受保護HID介面不能用正常網頁claim/control transfer；WinUSB換driver不解除瀏覽器class保護。
M2H只更新GENERAL/ROADMAP/DECISIONS/DONE四份文件，不新增.md、不新增無用診斷控制，不安裝driver或native helper。
需官方可驗證回應時，後續方向是保留Windows HID driver的native companion/local bridge，另輪授權及驗證；本輪不實作。
sendReport resolved僅能稱Host write sent／Device acceptance unverified，不能稱Sync Complete。
匹配CAF response、verified readback、可聽變化、Flash persistence須分開記錄；AudioContext/MediaDevices rate不是已驗證CAF current rate。
188/187/190/220是否不讀GET也能生效仍UNKNOWN，不以caller忽略結果推導可省略response。
本輪Case C：No manual test required this round。禁止RAM/Flash/90/Apply/Restore，停止於M2H。

## Historical M2I native query-only policy
M2F188 timeout未到190；M2G346 host success/raw零事件；M2H一般Chrome無官方Input GET替代路徑，保留歷史，不原樣重試。
M2I僅tools/freedsp-native的Windows C#/.NET10診斷，唯一CLI為query346；不整合production、不更換driver、不要求admin。
SetupAPI列出35D8/1496所有matching paths，HidD attributes核對；usagePage0C/usage1、MI_03及input/output caps各62bytes須唯一。
HidP_InitializeReportForID只用preparsed data驗證Input1/Output1；不是硬體GET。任何metadata失敗、模糊目標或caps不符即停止。
Windows report buffer含ID，固定官方62byte346；HidD_SetOutputReport一次成功後立即HidD_GetInputReport一次。
沒有WriteFile/Feature fallback、poll/retry或188/187/190/90/220；不因失敗試別的path/access/driver。
CLI先驗證args再探索；native SET另有exact346-buffer guard。RX未知index保留且Hz UNKNOWN，echo不能算reply。
兩個HidD API同步且無timeout參數；launcher只對新子程序設30秒watchdog，timeout標completion UNKNOWN並停止，不判DSP拒絕。
HidD沒有actual bytes-transferred輸出；62是requested/caps buffer length，不能當成已擷取的USB完成長度。
Codex僅build/mock/offline，不執行Query346或裝置探索；Henry執行一次script並貼完整output，M2I hardware proof保持PENDING。
文件仍僅GENERAL/ROADMAP/DECISIONS/DONE；本輪結束後停止，不進RAM190/production integration。

## Historical M2J synchronized native query policy
Henry實測M2I一次：2個matching HID paths，MI_03 col01、usage0C/1、input/output62、feature0；SET346與GET皆成功/error0。
RX已知prefix為01 00 01 00 bc 80 00 23 2d b3 01 00 00 00，CAF188/reply1/count1/CTRL/words=[1]，其餘bytes未提供。
Level1 native HID transport VERIFIED；Level2 CAF346 QUERY NOT YET VERIFIED；Level3 RAM/EQ NOT VERIFIED。不得稱M2I transport失敗。
官方getMsgByCmd：SET一次、initialGET一次，之後才開始outer1000ms；replybit1即返回，不匹配command/count/module。
若initial無reply，每次repeatGET後sleep5ms再檢查reply/deadline；無固定retry count，Android每call timeout1000ms。
M2J保留官方oneSET/cadence/deadline，明確修正為matching346才完成；官方會停在188，本工具繼續至matching/deadline。
每個GET保存完整RX與genericCAF分類，188是VALID CAF NON-MATCH；GET失敗立即停止，不reSET或送mutation。
Windows沒有per-call timeout參數，仍保留30s childwatchdog；freshRX及monotonic clock是診斷適配，不聲稱完全照抄Android。
Native GetInputReport是state API，不以單一188推論FIFO、Windowscache、priorM2F來源或「GET會消耗queue」。
硬體唯一TX仍346；Codex只做offline/build，Henry執行script一次；M2J結果PENDING，不進RAM190/Flash/production。

## Historical M2K policy — isolated native RAM proof
Henry M2J硬體回報：MI_03/col01，usagePage000C/usage0001，input/output62、feature0；SET/GET均success/error0。
Matching346在GET#1取得：reply1/count13/CTRL B32D2300，words=[62,5,0,32,0,0,0,0,0,0,0,0,0]。
Level1 NATIVE HID TRANSPORT VERIFIED；Level2 CAF346 QUERY VERIFIED；Level3 RAM190/EQ PENDING HENRY TEST。
48k只代表該次量測；每次Apply/Restore都重新188→187→346取得knownrate→190，每command須matching reply且無API error。
Native CLI僅query346 / ApplySafeRamTest / RestoreSafeRamTest。Apply固定PK400Hz/-12dB/Q1、SDK0→wire5、selector0；Restore同band unity。
僅native診斷，不整合production、不改其他DAC、不送90/220/Flash、不更換driver，不允許任意band/gain/rate/command參數。
187官方count1[0] logical14bytes；Windows state API要求OutputReportByteLength=62，保留14byte prefix、補48zero、count仍1。
此適配有Microsoft API contract及hidapi實作依據，不代表Android14與Windows62對firmware等價已證實；matching187失敗就停止。
Native最終quantizer仍1LSB uncertainty；用M2E float32模型、dynamic Gain=e+2、scale=2^(25-Gain)、官方feedback符號、signed24及stability guards。
僅known CAF346 rate indices4..8；unknown/failure不fallback、不算係數、不送190。所有TX/RX/API/error/分類皆記錄，SET不重送。
Matching response只是protocol criterion，未解碼未定義status、不證明可聽效果；缺少transactionID不能保證同command回應fresh。
Restore只把wire5設flat，不還原原本全部EQ；188/187會改enable/bypass state，並非完全無其他狀態變動。
Henry：APO OFF、outputFreeDSP、Windows1–2/100、首次Apply前IEM離耳、熟悉音樂、無tone；Apply/Restore各一次。
任何protocol error停止，先貼完整log、不聽不重試。成功且無異常才低音量聽；比較同曲同音量，突大聲/噪聲/失衡/失真/斷線立刻停止。
Codex本輪僅build/offline/mock，不做HID探索/硬體寫入。M2K hardware保持PENDING；Henry後續回報不自動修改docs，等待下一輪明確授權。
文件只更新GENERAL/ROADMAP/DECISIONS/DONE，不新增.md。本輪停在M2K，禁止自動production integration。

## 2026-10-07 — M2K real hardware result (Henry report)
VERIFIED: native bidirectional CAF transport、188 matching、Windows padded187 accepted、matching346 index5=48k、matchingRAM190。
SDK0→wire5 Apply PK400Hz/-12dB/Q1/selector0 有清楚可聽變化；同band unity Restore 有清楚可聽恢復。
Apply與Restore的190均觀察firstGET reply0→secondGET reply1；bounded GET justified，無reSET。
Henry描述air/ambience/reverberation減少，但未能定位400Hz；不聲稱tonal accuracy、bitexact、其他bands、九band、Flash或globalpreamp已驗證。
M2K SINGLE-BAND RAM AUDIO EFFECT / WIRE5 APPLY-RESTORE VERIFIED。
M2L開始：wire6–9 HARDWARE VALIDATION PENDING；Codex僅離線實作，不做實體測試。

## Historical M2L diagnostic policy — remaining official live bands
M2K wire5已由Henry證實可逆可聽作用；M2L僅SDK1/wire6、SDK2/wire7、SDK3/wire8、SDK4/wire9，硬體結果仍PENDING。
唯一手動入口scripts/test-freedsp-native-band-map.ps1，無CLI參數；不重測wire5，不接受任意numeric band/opcode/frequency/gain/Q。
Native只接受query346及固定ApplyRemainingBand1..4/RestoreRemainingBand1..4；舊M2K ApplySafeRamTest/RestoreSafeRamTest已在探索前拒絕。
沿用M2K400Hz/-12dB/Q1/current matching346 rate/selector0/native coefficient model；只改payload word1，不改數學，1LSB uncertainty保留。
每band必須Apply→聽感→同band unity Restore→確認恢復，再進下一band。任何protocol failure、Q、restore聽感N/P/Q立即停止整輪。
Apply聽感N/S仍先提供同bandRestore；成功且確認恢復後才能繼續；summary不把protocol-only或不確定當VERIFIED。
Q不自動追加restore或retry；已Apply/partialfailure時可能仍有測試filter，必須警示並停止review，不能宣稱全局恢復。
完整stdout/stderr、prompts/answers及summary寫到TEMP/AuraPEQ unique .log、AutoFlush；禁止TEMP解析到repo內，不commit runtime logs。
console顯示protocol進度，完整hex/header/math保留在log；SDK/wire APPLY/RESTORE BEGIN/END markers可定位單band。
全四band protocol與可逆聽感都pass時只貼M2L BAND MAP SUMMARY；error/timeout/disconnect/abnormal/contradictory/differing/uncertain須附相關sections。
初始APO OFF/outputFreeDSP/Windows1–2/100/首次Apply IEM離耳/熟悉music/no tone；protocol成功且無異常後才聽，同曲同比較音量。
第一安全round後可低volume繼續；突大聲/噪聲/失衡/失真/斷線立即Q（prompt）或Ctrl+C（command進行中），不連續試送。
NativeoneSET/boundedGET/30schildwatchdog/failurestop不變；188/187 enable/bypass副作用及unity僅testedband說明保留。
No Flash/220/90/production integration/non-FreeDSP changes；no unknown SDK5..8/九band研究；no preamp研究或實作。
Global Preamp/Master Gain屬另輪UNRESOLVED/NOT VERIFIED；禁止以每個biquad乘gain模擬preamp。

## 2026-10-07 — latest M2L hardware result (Henry report)
SDK0/wire5 previously VERIFIED M2K，未重測。
SDK1/wire6：Protocol Apply PASS、Audible Apply YES、Protocol Restore PASS、Audible Restore YES，fully VERIFIED。
SDK2/wire7：Protocol Apply/Restore PASS、Audible Apply YES；Henry分心，Restore聽感PARTIAL/UNCERTAIN。
wire7分類：PROTOCOL VERIFIED / AUDIBLE RESTORE UNCONFIRMED，不是failed。腳本正確在P後停止；SDK3/wire8、SDK4/wire9 NOT RUN / PENDING。
M2L Windows native evidence：input/output report bytes62、feature0，HidP_InitializeReportForID確認Input/Output ID1，SET成功並取得matchingCAF回應。
這與1byte reportID＋61byte reportdata一致；preparsed-data驗證/caps/hostAPI回應不是rawUSB transfer擷取，不能聲稱已證實rawUSB長度。

## Current M2L-Resume manual validation policy
唯一手動入口scripts/test-freedsp-native-band-map.ps1，新增-StartSdkBand 1..4，預設1；其他值在parameter binding拒絕。
Start2依序SDK2/wire7→SDK3/wire8→SDK4/wire9；Start3為wire8→wire9；Start4只有wire9；SDK0/wire5永遠不進此工具。
wire6是priorVERIFIED；以Start2跳過時summary列PREVIOUSLY VERIFIED (M2L prior run)，不是NOTTESTED。
wire7是PROTOCOL VERIFIED / AUDIBLE RESTORE UNCONFIRMED，不是failed；Henry分心是已提供的背景，不推導firmware缺陷。
摘要分prior evidence／skipped by Start／this-run tested／selectednotrun pending；跳過未完整驗證wire7不能將它升級VERIFIED。
恢復後的首段Apply仍IEM離耳，matchingprotocol成功且無異常後才低音量聽；同曲同volume，無tone/Flash。
依序同bandApply→listen→Restore→confirm；protocolfail或RestoreN/P/Q立即停止，不進下一band；S/N/Q含義及boundedGET不變。
OnlySdkBand不新增；保持單一resume參數與既有nativefixedoperation calls，沒有CAF/serializer/190/mapping/coefficients/payload變更。
Logs仍TEMP/AuraPEQ、unique/raw完整保存、markers與compactsummary；runtime logs不commit；nohardware由Codex執行。
文件仍僅GENERAL/ROADMAP/DECISIONS/DONE；此輪停在M2L-Resume ready，未知九band/preamp/production全部不開始。

## M2L Toggle — small manual UX patch
Observed problem: Henry可能錯過單次Apply/Restore的瞬間聽感變化。
Verified facts: 前次wire7Apply/Restore protocol成功；Restore聽感仍未確認，沒有已知protocoldefect。
Fix: 手動改為A=Apply、R=Restore，可反覆切換，顯示STATE APPLIED/RESTORED；本band兩種operation各成功至少一次才接受Enter確認。
N=no clear difference並停止；Q立即停止；不自動Restore。尚無本run操作時STATE UNKNOWN，不冒稱已還原。
若Enter確認時仍APPLIED，接受聽感確認但停止後續bands並警示，避免累積；建議R後Enter。
StartSdkBand1..4與TEMP完整log保留；native/CAF/190/math/mapping/payload/rate/Flash/90/220/production/nonFreeDSP未修改。

## 2026-10-07 — M2L COMPLETE (Henry final hardware report)
SDK0/wire5、SDK1/wire6、SDK2/wire7、SDK3/wire8、SDK4/wire9全部VERIFIED。
每個映射都有successful protocol Apply、audible EQ change、successful protocol Restore、audible restoration。
M2L官方五段live mapping已完成，不再排程重測wire5–9；不外推AuraPEQ九段UI完整mapping、bitexact或Flash。
新里程碑M2M：完整九段PEQ映射＋Web RAM debug integration；優先PEQ，不研究GlobalPreamp/MasterGain。

## M2M current policy — PEQ first / isolated unresolved-slot validation
- M2L COMPLETE: SDK0..4/wire5..9 are Henry-verified protocol+audible reversals. Do not schedule retesting them.
- Keep uiIndex, SDK band and raw wire slot distinct. Nine-row UI index is not a nine-band SDK field; SDK accepts0..4 only and shifts+5. Official446 lists1..9 directly, but raw1..4 live effects/partition remain unverified.
- Current manual entry is scripts/test-freedsp-native-unresolved-slots.ps1 (optional -StartWire1..4), wire1..4 only. Historical M2L entry is superseded for current work.
- Fixed negative PK400/-12/Q1 and same-slot unity only, known matching346 current rate, selector0, proven188/187/346/190. A/R repeated explicit toggles; R then Enter after audible restoration; no automatic retries/restores or later-slot accumulation on applied confirmation/failure. R is not old-EQ backup;188/187 have existing enable/bypass side effects.
- Offline nine-band model is explicitly proposed/non-transmitting, not a verified adapter. No production Web path or automatic sync until remaining physical evidence; future FreeDSP-only debug path before production.
- Finish PEQ first. No Global Preamp/Master Gain investigation/implementation and no Flash persistence work. Do not extrapolate unknownSDK5..8, raw0 or10..13.
- Docs remain these four existing files; runtime logs stay outside repo in unique TEMP/AuraPEQ files. Codex never tests physical hardware. Local web URL always http://localhost:5173/; start .\scripts\dev.ps1 when Web validation is actually ready.
