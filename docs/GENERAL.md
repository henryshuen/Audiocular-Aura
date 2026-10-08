# AuraPEQ FreeDSP Development Rules

## 2026-10-08 — M2Q hardware PASS / 後續規則（取代先前 M2Q pending）
- Henry 回報全九段雙聲道 Apply／Restore 硬體 PASS：各 18 command190；雙耳等量變化、聲像置中、Restore 正常。path0 LEFT／path1 RIGHT 為硬體推導名稱，非官方 SDK 名稱。
- PK、20–20000Hz、−12..0dB、Q0.1..10 是 debug 安全範圍，不是已確認硬體限制；本輪不放寬正增益。
- 無效 editor 值只阻擋 Apply，不得鎖住明確 unity Restore；Restore 使用獨立有效快照。本地驗證失敗不設 transport fault，真正傳輸失敗仍 STOP、不自動重試或 rollback。
- 優先順序：A 正增益 PK 硬體驗證；B click/pop 調查；C 無效編輯／緊急 Restore UX（本輪離線修正）；D 之後才 production Web PEQ integration。無 preamp／Flash／其他濾波類型／persistence 或 readback 宣稱。
- 全九段手動確認按鈕最終正常啟用，不記為已確認按鈕 bug。Codex 不操作硬體。

## M2R long milestone rule — supersedes negative-only restriction for isolated/experimental PEQ
Positive PK coefficient support permits per-band −12..+12dB only after finite/signed24/stability validation. Hardware Apply additionally requires enabled positive-gain sum≤6dB and quantized-model sampled cascade peak≤6.1dB (nominal6dB budget,0.1 numerical allowance), across all five known rates before any SET. The sample-grid peak is an estimate, not a certified continuous bound or hardware/headroom limit. No Proceed Anyway and no automatic preamp.
The6dB budget does not guarantee unclipped audio: near-full-scale input with positive EQ may clip. Low Windows volume and IEM-out firstApply are the requested manual precautions, not proof of internal DSP headroom.
P1 Band5 only1000Hz/+6dB/Q1 bothpaths; P2 separated250/1000/4000Hz,+1dB/Q1 each, othersunity; never allnine+6. Observations optional for Restore. Local manual success gates main experimental native Sync; does not prove positive gain from mocks. Native bridge metadata connect and explicit unity restore remain distinct from validation state. Emergency Restore after protocol fault is a new explicit user action, never automatic retry/rollback; unknown device state remains until matching unity success.
Graphical FreeDSP session must not install a legacy WebHID device/realtime queue: drag/edit/profile/undo only local, explicit Sync prepares18writes. Exact35D8:1496 legacy manual/autoconnect blocked; other protocols untouched. Experimental UI is DEV localhost5173 only. Unsupported preamp/AutoPreamp/tilt/Flash/utilities disabled and not sent; imported nonzero unsupported state must block Sync.

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

## 2026-10-08 — M2M hardware COMPLETE / M2N start
Henry reports rawwire1..4 PK400Hz/-12dB/Q1 each protocolApply PASS、audibleApply YES、protocolRestore PASS、audibleRestore YES。Combined with priorwire5..9, allrawslots1..9 have individual reversible audible evidence. M2M hardware validation COMPLETE; no slot retest scheduled. SDK field semantics forwire1..4 remain UNKNOWN. M2N assigns editable UIposition0..8 to rawslot1..9, explicit position/index validation; debug Web RAM integration only, no production replacement/preamp/Flash.

## M2N current policy — Web RAM debug only
- M2M COMPLETE; rawslots1..9 individually hardware reversible. No CLI slot retest. UIposition/index0..8 maps raw1..9; SDK field meanings for raw1..4 not inferred.
- Debug page requires DEV localhost5173 and explicit metadata Connect plus writes; main DEV auto-connect skips exact35D8:1496 only. Normal Sync/production sender is not replaced.
- Startup .\scripts\dev.ps1 owns hidden127.0.0.1:5174 native bridge and Vite; no HID at startup/session. Main link opens isolated nine-row editor, optionally imports validated stored UI snapshot, never imports main runtime senders/tilt/preamp.
- PK negative-only20..20000Hz/-12..0dB/Q0.1..10; strictnine indices, currentmatching346 knownrate, selector0, native-derivedfloat/dynamicGain/signed24/stability guards. Disabled/Restore sends same-slot unity; no old-EQ backup/readback/persistence claim.
- Initial Web validation UI1/5/9 one at a time, matching protocol plus audibleApply/Restore manual confirmation. Restore retains editor values for repeat toggles; display is edited state, not device readback. Fullnine after three confirmations only; failure/timeouts STOP/partialunknown, no auto retry/rollback/restore.
- Only188/187/346/190, exact packet authorization per request, exactFreeDSP collection gate. Origin/Host/session/body/busy guards; bounded30s native child. Logs unique TEMP/AuraPEQ, no runtime logs committed.
- STOP at M2N Web validation READY. Positivegain, unsupportedtypes, preamp,Flash,EQreadback and productionintegration remain outside this round. Local URL always http://localhost:5173/.

## 2026-10-08 — M2O full-nine Web RAM validation policy
Henry verified M2N UI1/wire1, UI5/wire5 and UI9/wire9: protocol Apply/Restore PASS and audible Apply/Restore YES for each. Combined with prior individual native wire1..9 reversals, this opens the full-nine Web gate without retesting those bands. Simultaneous nine-band hardware behavior remains PENDING.
M2O remains isolated DEV RAM debug only, UI1..9 -> wire1..9. Explicit editor-only preset: PK/Q1 at250/400/630/1000/1600/2500/4000/6300/10000Hz with -3/-4/-5/-6/-7/-8/-9/-10/-12dB. First full-nine Apply with IEM out of ears, APO OFF, FreeDSP output and low volume; listen only after protocol success without abnormalities.
Prepare all selected coefficients AND packet bytes before first190; send each wire once in order, matching CAF required. Stop first failure, no retry/rollback/automatic restore. Existing explicit188/187/346 prerequisites unchanged and logged;190 is sole EQ write. Each wire has BEGIN/PASS and final protocol complete only after all nine pass.
Separate user-only audible Apply YES then audible Restore YES; no inferred audibility. Restore writes nine unity filters, keeps editor values, and is neither prior-EQ backup nor readback. No Flash/preamp/positive gain/nonPK/production sender replacement/non-FreeDSP changes. Codex performs no hardware actions. STOP at M2O READY pending Henry.

## M2P stereo correctness gate — 2026-10-08
Henry reports M2O full-nine protocol Apply/Restore PASS and audible effect/restoration YES, but stereo correctness FAIL / unresolved. Direct listening: current selector0 affects LEFT only; RIGHT unchanged; unity restores LEFT. Prior single-band audibility must not be called stereo-correct. M2O is NOT production-complete.
Stereo correctness is a required gate before any production integration. Treat path0/path1 as unnamed selectors until evidence confirms channel mapping; path1=Right remains UNVERIFIED. No automatic dual-path production/Web writes. M2P isolated manual entry scripts/test-freedsp-native-channel-path.ps1, no arguments: wire5 only PK400/-12/Q1, current matching346, RAM190. Preserve188/187 prerequisites and scoped exactpacket allowlist; no Flash/preamp/positivegain/readback/newtypes.
A/path0 and B/path1 each require explicit Apply, changed-ear/image observation, explicit same-path unityRestore and recoveryYES. Only A LEFT-only + B RIGHT-only + both recoveryYES unlock C, explicitly Apply0then1 and Restore0then1; both-ear equal-change/centered and recovery confirmations required. First Apply IEMout, low Windowsvolume, APOOFF/FreeDSP output/same music/no tone. Stop errors/Q/uncertainty; no automatic retry/rollback/restore. Runtime logs outside repository. Codex does not perform hardware testing.

## M2P 中文 toggle UX / baseline 優先 — 2026-10-08（取代先前觀察判讀與循序問卷關卡）
Henry 最初感到 Apply 使聲像右偏、左側減少；後來受控 path0 測試不一致，先前 RAM 狀態可能未清乾淨；之後明確 path0 Restore 在 BOTH 耳產生清楚可聽變化。因此不能沿用「selector0 已確認只影響 LEFT」或推定1=RIGHT；selector0/1 立體聲語義仍 UNRESOLVED，優先建立乾淨 baseline 後反覆切換。M2O protocol/可聽效果 PASS，但 stereo correctness FAIL／未解，仍非 production-complete。
新入口維持 scripts/test-freedsp-native-channel-path.ps1，完整繁體中文說明、主選單 U/0/1/B/Q；進入 path0/path1/both 後 A/R 可反覆切換，Enter/Q 返回持續主選單，O 才自願紀錄聽感。取消或錯誤觀察答案返回模式，不退出、不自動還原；問卷可用 RESTORE/CLEAN 明確選擇立即 Restore／雙pathunity。O 的 R 代表右側，U 代表不確定；不與主選單操作混用。
U 明確呼叫既有 M2PRestoreBoth：預算兩個 unity 封包，依 path0→path1 各190一次；保留188/187/346 prerequisites，失敗即停止，無重試／rollback。逐path顯示 RESTORE PASS/FAIL，只有整體成功才印 Baseline clean: path0 + path1 wire5 unity restored。僅wire5unity命令完成，不是全裝置還原、舊EQ備份或readback。
狀態依本次成功命令紀錄 APPLIED/UNITY，啟動與失敗 UNKNOWN；每個選單及結束摘要持續顯示各path狀態，返回／退出不隱藏仍套用或未知狀態。不強制問卷或宣稱聲道映射通過；Both 可由主選單明確選擇，取代先前依未可靠單側觀察設置的A/B→C關卡。首次Apply耳機離耳、APOOFF、FreeDSP輸出、Windows1–2/100；所有硬體動作均需明確A/R/U輸入。
變更僅PowerShell tester UX、其mock tests及文件；command190語義、native係數／固定wire5／PK400/-12/Q1／RAM流程、Web/M2O/production sender、dev生命週期、非FreeDSP均未修改。Codex未操作硬體。

## 2026-10-08 — M2P hardware COMPLETE / M2Q dual-channel Web preparation
Henry completed clean-baseline repeated wire5 PK400Hz/-12dB/Q1 toggles: baselinepath0unityPASS,path1unityPASS; Path0 Ear=L/Image=R; Path1 Ear=R/Image=L; Both Ear=B/Image=C, equal-ear change with centered image. Hardware-derived mapping: selector/path0=LEFT, selector/path1=RIGHT on this FreeDSP setup. Official SDK names remain unnamed; do not present these labels as recovered official field names. This newer controlled evidence supersedes the prior inconsistent/unclean-baseline observations.
Full log reviewed read-only: C:/Users/Henry/AppData/Local/Temp/AuraPEQ/freedsp-m2p-aa02128f24704c3284b5da2b9592719b.log; SHA25626d4efdf43b460874047257705577b4b119c1ec47a85bf5fa00f26d3f42e1c7e. Baseline completionline97; recorded Path0line471, Path1line1131, Bothline1643; all saved in log despite missing prior final aggregate. O may record recollected toggle effects afterRestore; this is Henry's reported listening validation, not an instrumented channel-amplitude measurement. Raw logs remain outsideGit.
M2O protocol/effect/recovery passed but stereo failed because Web190word0 was always0: onlyLEFT coefficient path updated. M2Q changes isolated debug RAM operations to identical path0/path1 pairs for each requested wire; no production replacement. Single-band2writes; full-nine18writes orderedwire1path0,wire1path1,...,wire9path1. Disabled andRestore unitybothpaths. FixednegativePKscope/math/current346 lookup preserved. Precompute/validate allfiveknownrateplans beforeANYSET; matching346 chooses oneplan; unsafeatanysupportedrate rejectsbeforecommands, unknownrate stopsno190. Existing188/187 prerequisites remainexplicit/logged. No retry/rollback; failure may leave unequalchannels andrequiresSTOP/review.
M2Q firstmanualWebgate: fillBand5=400/-12/Q1, explicitpairedApply/listen(bothears equal,center), pairedRestore/listen(bothbaseline), manualconfirmation. Freshpagegate requiredbeforefullnineApply; fullRestore remainsavailablefor explicitunity. Thenfillnegativefullninepreset, paired18Apply/listen/confirmation, paired18Restore/listen/confirmation. No Flash/preamp/positivegain/nonPK/persistence/EQreadback claims; hardwareandprotocolsuccessremainseparate. Codexdidnottesthardware. M2Q softwareREADY, WebstereogatesPENDING.

### M2R observation / Restore rule
Positive hardware outcome must be Henry-reported, never inferred from protocol PASS. Observation choices reset toU for each action; P1/P2/negative centered Apply/recovery records gate the experimental graphical session. Invalid editor/observations do not block explicit unity Restore; protocol faults STOP Apply but permit a separately requested emergency full-nine unity operation. No automatic retry/rollback.

## UPSTREAM-FIRST / MINIMAL DEVICE-SPECIFIC TRANSPORT
1. Always prefer upstream UI, abstractions and user workflows.
2. Prefer upstream WebHID transport when it can faithfully implement the device protocol.
3. If browser APIs lack a required protocol primitive, a minimal device-specific transport adapter is acceptable when supported by hardware evidence.
4. Such an adapter must remain below the shared protocol/business/UI layers.
5. Never degrade verified request/response semantics merely to force a device into a generic transport.
6. Never treat transport API success as device/DSP success.
7. Device-specific transport exceptions require evidence and documentation.
8. Avoid duplicate user-facing connection flows.

M2S real hardware evidence: chooser/open/VID35D8:1496/ONLINE PASS; command188 ID1/body61 sendReport PASS, matching inputreport NONE then bounded TIMEOUT/STOP, no retry and no190. Prior M2G also zero input events. Native HidD_GetInputReport matching responses previously hardware PASS. Pure WebHID is BLOCKED for the verified FreeDSP request/response flow; no fire-and-forget, skip-init or invented protocol workaround.
Normal CONNECT stays the only main entry. FreeDSP exact CAF selection dispatches to the Windows native transport helper; other DACs retain WebHID. Common TypeScript CAF serializer, coefficient/safety model and RAM sequencing own production candidate behavior. Native helper exposes metadata and bounded single-SET/Input-GET exchange only; legacy native coefficient/business tools are diagnostic references, not a second production PEQ implementation.
Default scripts/dev.ps1 manages helper plus Vite and validates owned process identity; -WebHidOnly skips helper for other DACs only. Windows/.NET10 SDK and localhost5173 origin are development dependencies; no browser-only FreeDSP or packaged desktop support claim. Sync/Restore remain explicit, RAM-only/current matching rate, paired18writes; local edits do not write, Flash/preamp/readback/persistence unsupported. Native main-page integration is now Henry-reported hardware PASS (latest M2S result); no readback/persistence claim.

### M2S main-page UX semantics
For connected FreeDSP, Hardware Memory Controls exposes RESTORE FREEDSP RAM TO UNITY independently of editor validity. SYNC TO RAM is the native transport candidate; SEND TO DEVICE disabled, Flash disabled. RESET TO FLAT and Slot A/B/OFF are local editor snapshots, never verified hardware banks. FreeDSP local default snapshot has9bands. Hardware Restore leaves editor unchanged; status must distinguish LOCAL EDITOR from FREEDSP RAM and protocol completion from readback.

## M2S hardware PASS / durable FreeDSP editor rules
Henry's normal main-page native adapter graphical9-band stereo RAM Sync/Restore/positive-negativePK/local separation are hardware PASS. Pure WebHID remains blocked. Per-bandPK−12..+12 verified; temporary M2R sum6/peak6.1 development gates removed in normal and diagnostic paths. Keep model validity/stability/quantization checks; combined boosts use main AuraPEQ warning/confirmation, never silently substitute another gain.
Exact FreeDSP main editor policy: clamp finite out-of-range gain immediately with page-log message and refresh displayed gain (e.g.+14→+12,−15→−12); apply to slider/numeric/graph/preset/history/Slot/saved state. Reject nonfinite direct edits; repair invalid snapshot gain to0 with notice; normalize nine bands/indices. No hidden hardware write on edit/import/undo/Slot/reset. Unsupported frequency/Q/filter types still fail Sync.
Restore Default Bands: local9 frequencies31/62/125/250/500/1000/2000/4000/8000Hz, gain0, Q.7, PK, enabled. Reset to Flat: preserve current9 frequency/Q/type/enabled; zero enabled gains; disabled values remain. Both reset local comparison bookkeeping only. SlotA/B/OFF remain local snapshots; B baseline uses Free nine defaults; no hardware bank mapping. Dedicated RAM Restore still ignores editor validity and does not modify local editor.
Main AUTO REDUCE for FreeDSP adjusts local positive band gains only, no preamp/no autoSync. Default scripts/dev.ps1 and npmdev show/bind http://localhost:5173/; helper exact Origin remainslocalhost5173. No CORS broadening.
Pop evidence revised: approximately18 quiet repeatable transients per full9x2 Apply/Restore, roughly per individual path update; non-blocking correlation only. Cause and smoothing/atomic update UNKNOWN. Next milestone Preamp, then balance, tilt, microphone/utilities, FlashLAST; generic commands are not FreeDSP evidence. Codex does not perform hardware testing.

## M2T permanent controls boundary
Preserve original main UI and other DAC behavior. Add FreeDSP controls only with proven interface/command/field/unit/sign/range/reply evidence. Preamp of either sign, balance and mic control mappings are UNKNOWN; current adapter Tone Tilt is unsupported. Auto Preamp depends on true hardware globalgain; never emulate preamp/balance with stacked user PEQ. No silent allocation of two of nine wires to shelves. Physical mic presence, generic math symbols or simulation meters are not control evidence. Explain and disable only FreeDSP unavailable controls, clear stale display/simulated meters, keep explicit PK Sync and editor-independent unity Restore. Henry's nine-default/structure-preserving Flat UX is hardware PASS. Flash/persistence remains LAST; no speculative commands or Codex hardware tests.

## UPSTREAM PR COMPATIBILITY RULE

1. Development/debug UX may temporarily differ from upstream to accelerate FreeDSP validation.
2. Before opening a PR, review every FreeDSP-specific UI/UX deviation against the original author's architecture and interaction semantics.
3. Prefer upstream behavior whenever it does not conflict with verified FreeDSP hardware requirements.
4. Isolate device-specific differences behind FreeDSP-specific branches/guards; do not globally change generic behavior.
5. Do not submit debug-only pages, temporary validation controls, redundant connection entry points, or local-only experimental UX unless genuinely necessary for production support.
6. For Reset Defaults, Reset to Flat, Tone Tilt, Preamp, Balance, Mic and storage, preserve upstream semantics for other DACs. Use FreeDSP-specific overrides only when required by verified hardware/protocol behavior.
7. Before PR creation, perform an explicit **upstream cleanup pass**: compare fork behavior against upstream, remove temporary debug surfaces, minimize FreeDSP-specific code, preserve original naming/style, and document unavoidable architectural exceptions.
8. The Windows native HID helper is currently a verified transport requirement for FreeDSP because browser WebHID lacks host-initiated Input GET_REPORT. Keep this exception minimal and well documented; the helper remains transport-only.

Current priorities: PEQ RAM is hardware PASS. Preamp is the highest-priority unresolved feature. Next research must seek a real FreeDSP global gain/preamp control, not emulate it with PEQ. Flash/persistence stays last.


## M2U real preamp evidence boundary — 2026-10-08
FreeDSP nine-band stereo PEQ RAM is Henry hardware PASS. Real global gain/preamp remains the highest-priority unresolved feature; Flash/persistence remains LAST. Never emulate preamp by modifying PEQ coefficients, allocating a PEQ slot, or silently changing Windows/app playback volume.
USB Audio endpoint volume and DSP preamp are different claims: a standard volume control requires exact device descriptors, entity/interface/channel permissions and range; preamp/headroom additionally requires evidence of placement before the PEQ cascade. Neither OS volume behavior nor generic UAC support proves that placement.
M2U found no HIGH/MEDIUM device-specific real-gain mapping. Keep normal Preamp/Auto Preamp disabled and native helper transport-only. No guessed CAF commands, Feature Unit IDs, brute-force USB requests or new hardware diagnostic are authorized by research alone.
The existing UPSTREAM PR COMPATIBILITY RULE remains mandatory: before PR compare against upstream, remove temporary debug surfaces/redundant entry points, preserve original semantics/style, isolate verified device exceptions and minimize the native helper surface. Never globally alter other DAC behavior for FreeDSP convenience.


## Control research budget — four rounds maximum (2026-10-08)
This rule supersedes open-ended unresolved-control research. Round1=exact USB AudioControl/Feature Unit; Round2=official app pregain exact-device call chain; Round3=remaining CAF/firmware candidates; Round4=cross-validation/final decision. Round4/4 COMPLETE; remaining budget0 rounds; control research CLOSED. No Round5. Do not extend beyond Round4 unless Henry explicitly changes this rule.
After Round4, unresolved Preamp/Balance/Mic/Tone controls are frozen as UNKNOWN/UNSUPPORTED and work moves directly to Flash/persistence, then release cleanup/upstream PR preparation. Do not start those later milestones automatically during an earlier round. PEQ RAM remains hardware PASS; real preamp is the highest control-research priority. Flash follows control-research closure.
Round1 specifically authorizes non-destructive hardware enumeration and standard descriptor reading. No CAF, class/vendor control guesses, SET_CUR/gain/volume writes, PEQ/Flash changes, driver replacement/reset or endpoint volume changes. Future hardware access needs its own authorized scope.
Exact captured UAC2 playback FU2: master Mute read/write, master Volume ABSENT; channels1LEFT/2RIGHT Volume read/write, per-channel Mute ABSENT. This is descriptor-supported USB volume, not proven preamp/headroom or verified gain behavior. Keep main Preamp/Balance/Mic/Tone disabled; no transport/UI changes from these findings.
Retain UPSTREAM PR COMPATIBILITY RULE: preserve original semantics/style, remove temporary debug surfaces/redundant connection paths before PR, isolate verified FreeDSP differences, minimize native transport-only dependency and leave other DAC behavior unchanged.

## Round2 permanent pregain evidence boundary
Official SPV/BLE pregain support is not exact FreeDSP support. The pinned official SPV sender requires a class3 HID interface with interrupt IN AND OUT; captured35D8:1496 has HID IN83 only. Never send recovered SPV0x23 or BLE0x0A packets through CAF based on matching gain terminology. SPV Q8.8 and BLE hundredths-dB are distinct. The official SPV setter defaults saveToFlash=true; it must not be reused as a RAM-only API. Representable numeric ranges are not verified device limits.
Round2 static call-chain research is COMPLETE, exact1496 pregain route not found, true preamp confidence LOW. Round1 descriptor-supported UAC L/R volume remains a separate candidate; it does not prove pre-PEQ placement/headroom. Keep Preamp/Balance/Mic/Tone disabled, no PEQ gain emulation. Two rounds remain; next separately authorized round is remaining CAF/firmware candidates. No Round3 or hardware access started here.

## Round3 permanent Freeman/capability boundary
Pinned official SDK XML explicitly lists35D8:1496 under Freeman3; family association does not prove every optional feature works. Known346 subkeys62/90/84/64 mean current sample rate/saved EQ mode/feature availability/enabled state. Source-named LRDetect is not Balance; unnamed bitmap bits and unparsed words must remain UNKNOWN, not invented controls. 190 Gain is coefficient exponent,477 gain is per-band,220 is persistence. No independent CAF globalgain/balance/mic/Tone mechanism recovered.
Round3 COMPLETE, one final round remains. Only descriptor-grounded UAC playback L/R Volume and capture mono Volume/master Mute survive as MEDIUM bounded control candidates (descriptor confidence HIGH); true Preamp and independent Tone remain LOW. Keep controls disabled until compatible backend/values/semantics are established. No new broad research/command guessing/PEQ emulation/slot allocation; no Round5. After Round4 freeze unresolved controls as UNKNOWN/UNSUPPORTED, then Flash/persistence, release and upstream cleanup. No Round4 started automatically.

## Round4 FINAL — frozen controls / isolated Windows diagnostic rule
This final decision supersedes earlier ongoing-preamp priority and remaining-round notes. Round1/2/3/4 COMPLETE; no Round5. Next milestone is FLASH / PERSISTENCE, then release cleanup, upstream compatibility cleanup and PR preparation; none starts automatically.
Exactly one final status per control: Preamp FROZEN-UNKNOWN; Balance DIAGNOSTIC-ONLY; Mic DIAGNOSTIC-ONLY; Global Tone FROZEN-UNSUPPORTED. All four production main controls remain disabled. PEQ RAM hardware PASS unchanged. No output-volume relabeling as Preamp, PEQ emulation, silent Tone band use or other-DAC overrides.
Exact FreeDSP Windows DeviceTopology hardware Volume/Mute current/ranges are read-only verified. KS node IDs are not UAC entity IDs; numeric FU2/FU5 correspondence is inferred from topology, not raw USB control evidence. Pre-PEQ placement/headroom remains unknown.
Temporary manual Windows diagnostic only: exact endpoint/adapter/part guards; original state saved before writes; modest attenuation only, CENTER restores original L/R; explicit capture mute/unmute and original restoration. First failure STOP, no retry/automatic rollback; saved snapshot allows explicit recovery. Muted/minimum playback baseline blocks attenuation, never automatically raises/unmutes it. Setter/ear/recording/restoration behavior remains pending Henry validation; read success is not write success. No new permanent page, native helper or production architecture changes. Remove validation-only tools/surfaces before PR; preserve upstream naming/semantics and minimal native transport exception.

## 2026-10-08 — FINAL FreeDSP production scope / shutdown checkpoint

| Feature / control | Final evidence / production decision |
|---|---|
|9-band stereo PEQ RAM|HARDWARE PASS, Henry-reported|
|Sync RAM|HARDWARE PASS, Henry-reported|
|Restore Unity|HARDWARE PASS, Henry-reported|
|Reset/default UX|PASS, Henry-reported|
|Channel Balance UAC L/R|HARDWARE MANUAL PASS, Henry-reported; DIAGNOSTIC-ONLY; no production integration|
|Mic UAC Volume/Mute|HARDWARE MANUAL PASS, Henry-reported; DIAGNOSTIC-ONLY; no production integration|
|Mic hardware range|-74..0dB, step0.5dB; positive boost unavailable through this control|
|Preamp|FROZEN-UNKNOWN; no proven pre-PEQ/headroom control|
|Global Tone|FROZEN-UNSUPPORTED in FreeDSP production adapter|

DO NOT integrate Channel Balance for FreeDSP: technically hardware-verified, but low product value for the current FreeDSP scope. DO NOT integrate Mic Volume/Mute: Henry needs microphone amplification, while this verified control provides attenuation only. Retain both diagnostics/evidence for future reference; validation-only runtime surfaces must still be reviewed/removed from the production PR. These are deliberate production exclusions, not failed hardware tests.
Henry's new manual PASS supersedes the earlier pending setter/listening/recording/restoration status for Balance/Mic; no new test was performed by Codex at this checkpoint. It does not establish pre-PEQ placement or convert inferred Windows-node/FU numeric correspondence into raw USB evidence. Control research Round1/2/3/4 COMPLETE; no Round5 and no reopening.

### Upstream audit finding / PR compatibility boundary
The inherited setDacBalance implementation uses Savitech command22 (src/dsp.ts). Its intended SAVITECH protocol device list (src/constants.ts) includes Audiocular Aura, TRN Black Pearl, Fosi Audio DS2 / iBasso DC04 Pro, JCally JM20, and JCally JM20 Pro / compatible Savitech. This is source-level protocol coverage, NOT per-model hardware validation.
The inherited UI change handler calls setDacBalance without a per-protocol capability gate (src/main.ts); the fork already guards exact FreeDSP in the sender. Current upstream source has no equivalent Balance implementation for MOONDROP, CONEXANT or FIIO/FIIO_JA11 families. Do not infer generic balance support from a visible slider.
Microphone Loopback Monitor meter animation uses Math.random and simulated peaks (src/main.ts), not real hardware microphone-level telemetry. Preserve upstream behavior for other devices; before PR ensure FreeDSP does not misleadingly expose excluded Balance/Mic, simulated microphone meters, frozen Preamp/Tone or other unsupported controls. No generic behavior changes are authorized by this checkpoint.

### Final FreeDSP production target / next milestone
1. Connect / minimal native transport
2. 9-band stereo PEQ
3. Sync RAM
4. Restore Unity / reset UX
5. FLASH / PERSISTENCE
6. Release cleanup
7. Upstream compatibility cleanup
8. PR preparation

NEXT MILESTONE = FLASH / PERSISTENCE. Flash is the only remaining hardware feature milestone before release work. Not started at this checkpoint. No Balance/Mic integration, control research, implementation or hardware operation is authorized here.

## 2026-10-08 — FINAL product scope and upstream strategy (authoritative)
This checkpoint supersedes earlier temporary reset policy and narrower feature lists. Documentation only: these are final product requirements, not newly implemented or hardware-tested behavior.

### Device / protocol scope
Current upstream KNOWN_DACS contains one CONEXANT device: Moondrop FreeDSP, VID0x35D8/PID0x1496, Conexant/Freeman DSP. Current CONEXANT-specific production branches therefore effectively target this FreeDSP only; this is not permission to generalize unverified devices or alter other protocols.

### Supported FreeDSP product scope
Keep normal CONNECT, verified Windows native HID transport,9-band stereo PEQ, Real-Time PEQ Response Curve, graphical/editor controls, RAM Sync, Restore Unity, local presets/import/export/undo/redo where applicable, Reset Defaults, Reset To Flat, and Flash/persistence once validated. Flash is not yet validated or started here.
Exclude FreeDSP production Preamp/Auto Preamp, Global Tone Tilt, utility Filter Type (DAC filter), Amp Mode, Gain Mode, Channel Balance, Microphone Gain and Microphone Loopback Monitor. The utility Filter Type exclusion is distinct from PEQ band filter types and is not permission to expand their verified scope. Preamp stays FROZEN-UNKNOWN; Global Tone stays FROZEN-UNSUPPORTED. Balance and Mic UAC Volume/Mute are Henry-reported HARDWARE MANUAL PASS but deliberately excluded from production; retain diagnostics/evidence. Mic range-74..0dB/step0.5 provides no positive boost. Four-round control research is closed; no Round5 or reopening unless new exact-device evidence appears and Henry authorizes reconsideration.

### Final reset semantics / upstream compatibility
- RESET DEFAULTS: exactly9 FreeDSP bands at31/62/125/250/500/1000/2000/4000/8000Hz, gain0dB, Q0.7, PK. Never expand FreeDSP to generic10bands.
- RESET TO FLAT: rebuild neutral bands at1000Hz/gain0dB/Q1.0 using the author's existing semantics, respecting active device count: generic10-band device gets10bands; FreeDSP gets9bands.
- This explicitly supersedes temporary FreeDSP development behavior that preserved frequency/Q layout while zeroing gains. The old behavior remains historical implementation evidence, not final product policy.
- Root bug: generic reset functions assume10bands instead of device-specific count. Fix FreeDSP count during the future cleanup milestone; do not globally change other DAC reset semantics. Local resets remain distinct from explicit hardware Restore Unity. No reset runtime changes made at this checkpoint; the final FreeDSP flat layout is still a cleanup requirement.

### Upstream audit / PR boundary
Upstream has a dedicated9-band CONEXANT path, but its partially reverse-engineered Conexant PEQ/Flash implementation is not fully hardware validated. Fork's verified RAM hardware results do not validate upstream Flash. setGlobalGainConexant is a no-op. Upstream Global Tone Tilt is software composition into effective PEQ gains, not independent FreeDSP hardware Tone.
Filter/Amp/Gain/Balance/Mic utility setters use Savitech commands, not FreeDSP implementations. Microphone Loopback meter uses Math.random/simulated peaks, not hardware telemetry. Source device/protocol coverage is not per-model hardware validation. Before PR, hide/disable unsupported FreeDSP utilities, remove debug/development-only surfaces, preserve upstream naming/interaction semantics where compatible, retain only minimal isolated transport exceptions and leave other DAC behavior unchanged.

### FINAL roadmap (supersedes earlier cleanup ordering)
1. FLASH / PERSISTENCE — the ONLY remaining hardware feature milestone.
2. Upstream/product cleanup: FreeDSP Reset Defaults9bands; Reset To Flat9 x1000Hz/Q1/0dB; hide/disable unsupported utilities; remove debug/development-only surfaces.
3. Final production build / release candidate.
4. Final regression verification.
5. Push final branch.
6. Upstream PR.

NEXT MILESTONE = FLASH / PERSISTENCE. No Flash, production implementation or hardware operations started in this documentation checkpoint.
