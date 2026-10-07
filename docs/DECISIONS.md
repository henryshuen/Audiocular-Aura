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

## D023 — Response transport is part of the protocol
188/187/190的sendCmd與346的getMsgByCmd皆同步SET_REPORT output1後GET_REPORT input1輪詢；不是interrupt response證據。
188/187的caller不以false阻擋後續，不表示helper沒有等reply。四個命令沒有來源支持SEND_SUCCESS_ONLY。
isExecuteSuccess讀unsigned16 count，>=0條件冗餘，主要測replybit；未比對command/module。後續matcher應明確說明較嚴格的條件。
RX使用fresh array及controlTransfer IN原地寫入；buffer capacity不等於actual read length。
July logger/hook不在current APK，不能把舊RX dump確定命名成interrupt ACK或排除hook mutation。

## D024 — M2G isolates inbound behavior without EQ writes
三次188 timeout只證host送出與current diagnostic無matching event；不證DSP accepted/rejected或EQ failure。
DEV頁只提供inspect/open及346 query，持續保存全部輸入；停止M2F write controls，本輪不前進190。
Candidate parser支持短logical response並保留unmatched/raw，但matching query須ID1/prefix0/reply1/346/CTRL及word1可用。
Query的Hz未知與transport無response分開報告；synthetic346 fixture必須明確標記，不能假冒已知captured response。
187Android短14-byte request已證，但61-byte WebHID padding的hardware等價性仍未知；本輪兩者皆不送。

## D025 — M2H browser transport boundary
Henry的M2G回報：listener在open/send前ACTIVE，346 ID1/data61 host完成；2.5秒後rawTotal=0/newEvents=0。
沒有事件進parser，晚註冊／ID filter／short rejection／parser mismatch不能解釋本次raw零輸入。
零輸入不證firmware拒絕或無回應；官方Input GET_REPORT沒有被WebHID passive events重現。
正常Windows Chrome網頁：WebHID沒有Input GET_REPORT；Feature GET不是Input GET。
WebUSB官方recipient=interface/index3指向受保護HID class，claim與control parameter檢查皆阻擋。
WebHID權限/handle不能借給WebUSB，endpoint0也不能省略interface claim；hybrid NOT FEASIBLE。
WinUSB binding不能解除HID class保護，不推薦Zadig或driver替換。只換HID功能可能保留audio但破壞WebHID；
誤換audio/composite parent可破壞音訊。兩者均非一般AuraPEQ使用者方案。
usb-unrestricted是有manifest權限的Isolated Web App例外，非一般localhost網頁可開啟的header；不把此例外說成平台永遠不可能。
Case C：不增加WebUSB inspection/query按鈕、不要求Henry再測browser。後續候選為Windows HidD_GetInputReport native helper/local bridge，
單一native owner序列化SET→GET；其FreeDSP相容性仍未測，本輪只作架構判斷。WebSerial無CDC/serial證據，不列可行替代。
依據：[WebHID](https://hid.spec.whatwg.org/)、[WebUSB](https://usb.spec.whatwg.org/)、
[Chrome WinUSB要求](https://developer.chrome.com/docs/capabilities/build-for-webusb)、
[Windows Input report API](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_getinputreport)。

## D026 — Success states and sample rate are evidence claims
後續production的狀態政策（M2H不修改UI）：
- HOST_SENT / Host write sent：OS/browser接受write；不是DSP成功。
- RESPONSE_UNAVAILABLE / Device response unavailable in WebHID：目前API/測試未取得官方回應，不能宣稱拒絕。
- ACCEPTANCE_UNVERIFIED / Device acceptance unverified：未取得匹配結果，不顯示Sync Complete。
- MATCHED_CAF_RESPONSE / Verified by matching CAF response：至少比對ID、command、module、reply及logical payload；
  這只驗證CAF回應，還須依命令結果語義判斷，不自動證EQ係數已套用、聽感或Flash持久化。
- VERIFIED_READBACK / Verified by readback：讀回指定設定並比對；RAM與重開機後Flash persistence另列。
346需取得實際response中的current-rate word；AudioContext、capture track、手動OS設定或cache只可標hint，不能假冒CAF查詢。
188/187/190/220官方helper都有GET polling。GET是否為mutation生效必要條件UNKNOWN；ignored bool不構成write-only可靠性證據。
write-only可以送出但不能truthfully verify DSP acceptance；未確認current rate亦不能安全推導當前bank。
不盲寫Flash、不為timeout延長等待後再原樣重試、不以parser改動代替缺失的transport。

## D027 — M2I native346 is an isolated transport experiment
tools/freedsp-native以C#/.NET10、P/Invoke既有Windows HID/SetupAPI，零外部套件、不改driver/admin/production。
CLI只接受query346；wrapper無參數。唯一TX是官方13words [62,0×12]／CTRL／command346，native62bytes包含ID1。
探索只開metadata access0並列matching paths/caps/errors；query handle固定GENERIC_READ|WRITE、SHARE_READ|WRITE、OPEN_EXISTING、flags0。
Windows MI_03 path + confirmed35D8/1496 + usage0C/1 + input/output62是保守collection gate；不硬猜Windows interface數字與path第一項等價。
任一matching path無法inspect、零/多個合格目標即停止；opened handle再次檢查identity/caps。
HidP_InitializeReportForID在preparsed data確認Input1/Output1存在；純本機parser工作，不送report。
SET選HidD_SetOutputReport（state/output IOCTL），不用WriteFile；GET選HidD_GetInputReport（state/input IOCTL），不用Feature GET。
這是最符合官方state SET→GET的Windows HID client API；USB HID control request由driver/minidriver處理，
本輪沒有physical USB setup capture，不能聲稱已驗證Henry裝置的exact21/09/0201/3與A1/01/0101/3。
Microsoft明示部分裝置不支持state API；因此只作一次346 probe，API失敗不改driver或重試排列組合。
API buffer[0]=ID1，長度由HIDP_CAPS核對為62；GET fresh buffer不能複製TX。Boolean success不提供actual transfer length。
單次SET→單次GET，不移植官方poll loop；未ready reply亦可能標unexpected，不能立刻判serializer/device錯誤。
同步HidD沒有timeout參數；script30秒process watchdog是主機等待限制，不是USB per-call1000ms，也不保證取消了driver內部完成。
輸出保留path/caps/access/API/Win32Error/TX/RX/header/logical words/capacity words，失敗不解析成已確認回應。
分類：VALID CAF346 RESPONSE；GET_INPUT_REPORT SUCCEEDED BUT RESPONSE UNEXPECTED；GET_INPUT_REPORT FAILED；DEVICE OPEN / ACCESS FAILED。
SET失敗另標HOST SET_REPORT FAILED／GET NOT ATTEMPTED，避免誤稱GET或open失敗；watchdog標COMPLETION UNKNOWN。
Valid須ID1/prefix0/reply1/command346/CTRL/count2..13；word1 index4..8映射已證五rates。Unknown index保留，Hz UNKNOWN。
比官方的replybit-only判斷更嚴格；count0即使capacity word1有值也不假冒完整logical reply，保留raw供後續研究。
Mock/serializer/build成功不代表native裝置相容性；硬體proof需Henry實際SET成功+GET成功+plausible matching CAF346。
成功亦只證query transport，不證RAM190、可聽效果或Flash persistence；STOP於M2I。
Sources: [SET API](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_setoutputreport)、
[Input GET API](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_getinputreport)、
[HIDP_CAPS](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/ns-hidpi-_hidp_caps)、
[Report ID parser validation](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidpi/nf-hidpi-hidp_initializereportforid)。

## D028 — CAF validity, command matching and proof levels are separate
Henry提供M2I實測：oneSET346 success/error0，oneGET success/error0，MI03 col01、usage0C/1、input/output62、feature0。
RX已知14byte prefix可解析CAF188/reply1/count1/CTRL/word0=1；不是matching346，也不是結構無效或transport failure。
完整buffer剩餘bytes與fullWindows path未貼出，不補零當hardware capture；native188離線案例尾部為明確synthetic padding。
- Level1 NATIVE HID TRANSPORT VERIFIED：Windows SET成功與GET成功，且取得有效CAF reply（188）；不聲稱fresh346被DSP接受。
- Level2 CAF346 QUERY VERIFIED：必須匹配346/reply1/CTRL/ID1及logical word1；未知index保留，Hz UNKNOWN。
- Level3 RAM/EQ VERIFIED：仍NOT VERIFIED，不屬M2J；Level1/2不等同聽感或persistence。
GenericCAF Valid只檢查ID/prefix/reply/CTRL/count容量，不要求command346或count>=2；Matching346另加query條件。
這修正M2I「有效188也算INVALID」的混淆；native GET成功但nonmatch不能證query完成。

## D029 — Official cadence with an explicit diagnostic matching correction
Pinned APK getMsgByCmd先GET@86，建立clock@102後，@120..136檢查buffer[5]replybit，等於1即return@254。
@140..148檢查elapsed>=1000；未到deadline才GET@168；sleep5@194..198，算elapsed@216..250，回loop@252。
沒有fixed retry count；firstGET不是無條件discard；首次reply188亦會立即返回，不會「忽略舊command直到346」。
isExecuteSuccess只nonnull/replybit1及unsignedcount>=0冗餘條件；不比command/module。getCurSampleRate只在success後讀offset14/word1，
不驗logicalcount>=2、不辨188，失敗回-1001。因此官方接受stale188時可能讀capacityword1，不可照抄成已驗證rate。
M2J依Henry要求修正匹配：oneSET→initialGET→start1000ms→while未matching且未deadline repeatGET→sleep5ms。
Valid非matching（含188）及invalidcandidate保留並在bound內繼續；matching判斷先於下一次deadline檢查，已開始的GET可晚回。
非官方差異明列：①matching346而非anyreply；②nativeGET失敗即停止（官方忽略return）；③freshRX每次、避免buffer殘留；
④Stopwatch monotonic而非Java wallclock；⑤Windows HidD沒有Android per-call1000ms，只能另有30sprocesswatchdog。
不是exact Android policy複製，亦不是任意retry參數；CLI不可調deadline/count，不reSET，不送188/187/190/90/220。
取得188→346支持立即oneGET不足及bounded synchronization有效，但不單憑此序列判FIFO（可能只是時間延遲更新）。
持續identical188至官方deadline標appears retained/stale，不再讀；GET error記exactattempt/code後停止。
Snapshot/retained response比FIFO更符合stateAPI描述，device/Windows持有者仍UNKNOWN。
Source: [Microsoft state vs read report semantics](https://learn.microsoft.com/en-us/windows-hardware/drivers/hid/obtaining-hid-reports)
及pinned officialResponseStaticEvidence.json完整bytecode；M2J再抽取12methods與fixture完全一致。

## D030 — M2J hardware levels / M2K fixed RAM diagnostic
M2J matching346在GET#1成立，word1=5對應48k；不表示多GET在這次硬體必要，也不證queue/snapshot來源。
採用官方188[1,0x12]/187[0]/346[62,0x12]/190[0,5,Gain,B0,B1,B2,A0,A1,0x5]。
官方188僅在enabled flag false時呼叫；獨立process沒有此flag，因此每次Apply/Restore明確送188。
官方sendCmd的188/187/190為SET→startouter1000ms→GET→sleep5ms；346先initialGET才startouter1000ms。
官方僅replybit判定，不matching；本診斷增加command/ID/prefix/CTRL/countcapacity matching、freshRX、GET error即停。
188成功bool存flag，187 bool被丟棄，190回bool；本診斷不沿用ignored prerequisite failure，所有matching都是下一SET的gate。
187 logical14無法由HidD_SetOutputReport以受支援的14byte API request重現；Windows contract要求caps62，hidapi相同API明確補零。
因此依Henry「unless Windows HID API behavior requires it」例外，採用14byte prefix＋48zero、count1、API62，無短長fallback試送。
此決定只證Windows適配有依據；firmware兼容及實際 USB 長度仍未驗證。matching187未取到禁止190，不用hostsuccess代替。
Sources: [Microsoft HidD_SetOutputReport](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/hidsdi/nf-hidsdi-hidd_setoutputreport),
[hidapi Windows hid_send_output_report](https://github.com/libusb/hidapi/blob/master/windows/hid.c) (examined 2026-10-07, function at raw lines1265..1305).
不增加IOCTL/WriteFile/WinUSB或driver替代；不宣稱可以faithfully發Android14byte USB transfer。
Flat來源：pinned officialRamStaticEvidence.json setDefaultAvailable直接190使用Gain3/B0=4194304/B1=B2=A0=A1=0；本工具只套selector0/wire5。
套此flat不執行官方setDefaultAvailable的多band/多selector loop；Restore不是previousEQ備份，enable/bypass state亦可能改變。
400Hz模型固定attenuation，nearest float32 rounding接續M2E，無native32candidate搜尋，所以1LSB uncertainty保留。
不自動90或Flash；protocol ACK與audible/restoration evidence分開。若成功但無效果，下一輪研究enable/bank/mapping/90，不放大或加band。

## 2026-10-07 — M2K real hardware result (Henry report)
VERIFIED: native bidirectional CAF transport、188 matching、Windows padded187 accepted、matching346 index5=48k、matchingRAM190。
SDK0→wire5 Apply PK400Hz/-12dB/Q1/selector0 有清楚可聽變化；同band unity Restore 有清楚可聽恢復。
Apply與Restore的190均觀察firstGET reply0→secondGET reply1；bounded GET justified，無reSET。
Henry描述air/ambience/reverberation減少，但未能定位400Hz；不聲稱tonal accuracy、bitexact、其他bands、九band、Flash或globalpreamp已驗證。
M2K SINGLE-BAND RAM AUDIO EFFECT / WIRE5 APPLY-RESTORE VERIFIED。
M2L開始：wire6–9 HARDWARE VALIDATION PENDING；Codex僅離線實作，不做實體測試。

## D031 — M2L controlled remaining-band validation
依HenryM2Kprotocol＋Apply/Restore可逆聽感回報，wire5 SINGLE-BAND RAM AUDIO EFFECT VERIFIED；不外推頻率定位、bitexact、全bands或Flash。
190 firstGET reply0→secondGET reply1在兩次write皆見，保留bounded GET，不reSET。padded187 accepted不等於Android USB transfer長度已擷取。
M2L唯一變數為wire6..9，SDK1..4官方+5 mapping已保存static evidence；filter/selector/ratequery/coeffmodel/transport完全沿用。
Native八個fixed operation names＋query346，不收numeric band；guard僅allow remainingbands固定cut/unity。wire5與舊M2K CLI退出本輪reachable write set。
每bandApply後須samebandRestore，再由Henry確認可聽恢復；restore N/P/Q或protocol error全停止，不累積filters。
ApplyN/S不是硬體VERIFIED，但仍容許人工確認同bandrestore；restoreYES後可進下一band，異常/不同結果附sections供review。
Q只停止，不自動write；這避免abort/disconnect/abnormal狀態追加未授權測試。可能殘留filter明列，不能宣稱Q會還原。
Logs用GetTempPath/AuraPEQ unique CreateNew＋AutoFlush，拒絕repo內TEMP；每bandmarkers/fullraw保留，摘要成功僅pass＋YES/YES才VERIFIED。
互動state machine用dependency-injected protocol/answers做offline tests；真實launcher只接受八個fixed names、onechild、30s watchdog、finallycleanup。
PS module屬隔離診斷helper，沒有新增projectdocs或production連接。GlobalPreamp/MasterGain另輪，禁止逐biquadscale模擬，不在M2L研究。

## 2026-10-07 — latest M2L hardware result (Henry report)
SDK0/wire5 previously VERIFIED M2K，未重測。
SDK1/wire6：Protocol Apply PASS、Audible Apply YES、Protocol Restore PASS、Audible Restore YES，fully VERIFIED。
SDK2/wire7：Protocol Apply/Restore PASS、Audible Apply YES；Henry分心，Restore聽感PARTIAL/UNCERTAIN。
wire7分類：PROTOCOL VERIFIED / AUDIBLE RESTORE UNCONFIRMED，不是failed。腳本正確在P後停止；SDK3/wire8、SDK4/wire9 NOT RUN / PENDING。
M2L Windows native evidence：input/output report bytes62、feature0，HidP_InitializeReportForID確認Input/Output ID1，SET成功並取得matchingCAF回應。
這與1byte reportID＋61byte reportdata一致；preparsed-data驗證/caps/hostAPI回應不是rawUSB transfer擷取，不能聲稱已證實rawUSB長度。

## D032 — targeted M2L resume is validation state, not protocol repair
Henry新證據將wire6升為fullyVERIFIED；wire7Apply可聽及Apply/Restore protocol都PASS，Restore聽感因分心未確認。
保留wire7 PROTOCOL VERIFIED / AUDIBLE RESTORE UNCONFIRMED；不標failed、不修改packet/native/coefficient去「修」未證實問題。
手動StartSdkBand只選既有controller中的後綴SDK1..4；預設1、nextStart2，validateset拒絕0/5/decimal/unknown。無OnlySdkBand複雜化。
Summary保留priorverifiedwire6及priorunconfirmedwire7，不把skippedverifiedband標not tested，也不把skip當證據。
Safety firstApply判斷從SDK1改為selectedfirstSDK；每次新run從指定band開始仍要求離耳及低volume。
Nativechildlauncher、operationnames、CAFflow/serializer/bandmapping/coefficient/math/payload及failurepolicy完全不變；僅manualtoolselection/summary/tests/doc變更。
Windowsinput/output62、feature0、preparsed-ID1、SETsuccess/matchingCAF支持1ID+61data interpretation，不能當rawUSB捕捉；此證據在ROADMAP保存。
GlobalPreamp仍另輪NOTVERIFIED；no Flash/90/220/production/nonFreeDSP changes。

## M2L Toggle — small manual UX patch
Observed problem: Henry可能錯過單次Apply/Restore的瞬間聽感變化。
Verified facts: 前次wire7Apply/Restore protocol成功；Restore聽感仍未確認，沒有已知protocoldefect。
Fix: 手動改為A=Apply、R=Restore，可反覆切換，顯示STATE APPLIED/RESTORED；本band兩種operation各成功至少一次才接受Enter確認。
N=no clear difference並停止；Q立即停止；不自動Restore。尚無本run操作時STATE UNKNOWN，不冒稱已還原。
若Enter確認時仍APPLIED，接受聽感確認但停止後續bands並警示，避免累積；建議R後Enter。
StartSdkBand1..4與TEMP完整log保留；native/CAF/190/math/mapping/payload/rate/Flash/90/220/production/nonFreeDSP未修改。
