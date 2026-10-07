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

## 2026-10-07 — M2B offline reconstruction investigation
- 起始HEAD=652099eed2ba87e1d43c60713985e001e349878a，M2A已提交；分支fix/freedsp-conexant，
  起始工作目錄乾淨，origin tracking ahead/behind=0/0（本機refs），remotes未改動。
- 基準verify.ps1通過build、測試型別檢查及5files/38tests。
- 轉錄Henry實機descriptor摘要作fixture：VID35D8/PID1496、primaryusage12/1、input/outputid1、
  61×8bits=488bits=61data bytes；secondary inputid2=1byte只保存摘要，不補造item定義。
- 記錄Henry回報：未送62-byte候選，未做RAM測試。這不是Codex本輪操作硬體的結果。
- 核對Conexant提交歷史、相關blame/diff、README、Issue #3與原始Androidlogcat；
  發現首次builder配置62卻需要63，c7c95fa只改allocation到61。
  作者的「61包含ID」解釋與WebHID定義不符；未取得native struct或known-good USB packet。
- ASR指定post未取得，沒有當成格式證據；完整來源與A–K問題限制記於ROADMAP。
- 新增離線COUNT_U8與TRANSACTION_U8假說，各header9+13×4=61，所有word完整保留。
  拒絕超出欄位寬度或非13words；reportId是獨立envelope欄位；沒有連接任何HID sender。
- GENERAL新增永久Problem / hypothesis / next action規則；ROADMAP完成六欄、候選表與Issue #3證據摘要；
  DECISIONS新增D014/D015，只記錄證據分層及離線邊界，沒有指定正確硬體格式。
- 最終verify.ps1 exit0：TypeScript、Vite4.5.14 build、測試型別檢查、6files/47tests，新增9tests。
- Scope / regression check：FreeDSP-specific為新純函式/測試/fixture；shared僅四份docs；
  Non-FreeDSP protocol code changed: NO。現有runtime builder、sync、RAM/Flash/mode/preamp/readback均未修改。
- 不操作GUI/browser或實體HID，不開始聽感/RAM測試，不發GitHub留言，不commit/push。
- 完成的是M2B離線調查與軟體驗證；RAM EQ、Flash persistence、readback、preamp、最終正確61-byte格式仍未證明。
- git diff --check通過；還原本輪verify產生的dist，runtime/package/scripts差異為空。
- 既有Vite程序PID8048監聽127.0.0.1:5173；純HTTP GET回傳200，本輪未啟動新server或開瀏覽器。
  網址http://localhost:5173/，啟動命令.\scripts\dev.ps1。狀態僅代表交付前快照。

## 2026-10-07 — M2C-Research source recovery
- 起始HEAD2dfe0db1735da511275cd7c3e188b64bdc8b6368，工作目錄乾淨，分支fix/freedsp-conexant。
  基準verify通過6files/47tests；核對git status、branch與log -5。
- 追查指定-S searches、原始builder blame、e7da5b5及c7c95fa前後相關提交、README與所有31則Issue #3 comments。
  builder欄位一次在e7da5b5加入；c7c95fa只改buffer；沒有取得native serializer來源或CafId實作。
- 找到M2B漏讀的freedsp_usb_raw_log.txt，原樣保存60,438bytes與SHA256、來源URL及限制。
  57組TX/RX arrays均62entries，TX90×1/220×55/259×1，未見190。
- 證據測試確認modulebytes、count後zero、係數LE32、firmware response、及舊62-byte builder對所有57筆TX一致。
  保存Flash commit FF000000的觀察；沒有把helper表示或app success宣稱成正確on-wire transfer。
- 讀取ASR原帖與linked repos；指定舊帖非serializer，Aura介紹帖是未實測同源自述。
  devicePEQ固定HEAD的capture JSON含非法byte值，未採納為權威擷取；未複製、執行其程式。
- 更新四份docs：來源時間軸、六欄matrix、六欄problem/hypothesis、Issue #3摘要及條件式未來manual capture plan。
  沒有要求Henry當輪capture或送RAM；沒有找到authoritative serializer。
- 新增5個保留來源證據的測試，最終verify.ps1 exit0：build/typecheck、7files/52tests。
  首次node module型別檢查失敗已修正為既有raw import/Web Crypto；未加套件或改harness。
- FreeDSP-specific：一份test及兩份fixture/provenance檔；shared為四份docs與.gitattributes。
  attributes僅限定原樣dump，停用換行轉換並保留來源原有兩處尾空格；使用.txt避免.log忽略規則遺漏證據。
  Non-FreeDSP protocol code changed: NO；runtime framing/sync/mode/RAM/Flash/preamp/readback均未修改。
- 未操作GUI/browser或硬體、未下載安裝APK/driver、未發布Issue留言、未commit/push；停止於M2C-Research。
- git diff --check與新增檔案check通過，原樣dump的尾空格依限定attributes保留。
  verify產生的dist已還原；src/runtime、package、scripts與test config無差異。
- 交付前5173沒有監聽程序，server未執行，也未自動啟動；網址http://localhost:5173/，命令.\scripts\dev.ps1。

## 2026-10-07 — M2D research checkpoints
- Phase1：核對並保留未提交的M2C檔案；baseline verify通過52tests；確認官方APK直接來源連結與repo無APK。
- Phase2：完成57pairs deterministic分析、45組coeff/log一致性、96個sign-extended負words及commit255觀察。
  7個forensics tests/typecheck通過；官方中文頁直接APK已下載到TEMP並保存hash，未執行APK。
- Phase3：靜態恢復Java getUSBMessage與controlTransfer完整呼叫鏈、190的獨立payload、commit的255常數及187/188的不同容量。
  官方APK版本與SHA已記錄；USB transfer成功長度與硬體效果尚未測量，未執行APK或任何硬體操作。
- Phase4：核對官方APK res/qc.xml的VID35D8/PID1496→Freeman3、JNI coefficient wrapper與HID/Android規範。
  新增inspect-apk.py靜態抽取、official-layout離線模型、兩份machine-readable分析與來源說明。
  57pairs/114buffers逐byte重播一致；再次APK抽取22methods與保存JSON結構完全相同。
  upstream live HEAD仍af0bcf7，Issue仍31comments；完整列出所有直接附件，兩個text附件重新下載404，未假裝已重新取得。
- M2D-Deep研究收斂為一個HIGH serializer model；官方Java layout與ID邊界已恢復，runtime/硬體效果未修改或測試。
  最終verify.ps1 exit0：TypeScript、Vite4.5.14 build、測試型別檢查、9files/65tests；原52tests保留，新增13tests。
  GENERAL/ROADMAP/DECISIONS/DONE已更新，來源inventory、命令差異、排除模型與Issue evidence pack已保存。
  本輪無硬體access/RAM/Flash寫入、GUI、自動同步、GitHub留言或非FreeDSP protocol修改。

## 2026-10-07 — M2E research checkpoints
- Phase1：起始git乾淨，baseline verify9files/65tests通過；核對現有RAM迴圈/word0/band/Gain/activation與官方Java差異。
  官方native library保留係數函式symbols，已找到可直接靜態解析的具體入口；未載入/執行APK或native library。
- Phase2：靜態追出JNI native callback、參數16bit布局、Gain=e+2與2^(25-Gain) scale、feedback negation、Java0..4band guard、current-rate查詢與兩張不一致rate tables。
  已定位PK設計與native floor/floor+1量化；所有結論來自instructions，不執行native library。
- Phase3：保存inspect-eq.py與Java/JNI/ARM64來源fixture；追完整service/enable鏈與獨立mode90入口。
  offline float/scaling模型吻合45個Gain及225個係數的兩候選區間；沒有稱為bit-exact native converter或RAM硬體capture。
  Byte解讀確認舊190buffer會被官方layout讀為command13/count1/錯module；runtime沒有修改。
- Phase4：完整verify.ps1 exit0，TypeScript/Vite build與test typecheck通過，10files/73tests（新增8tests）。
  再次靜態抽取22Java methods、9native functions、4JNI registrations，與保存JSON完全相同。
  GENERAL/ROADMAP/DECISIONS/DONE與逐項比較、原因排序、明確限制、Issue #3 evidence pack已更新。
  無APK/native執行、硬體access、RAM/Flash寫入、聆聽測試、production runtime或非FreeDSP protocol變更。

## 2026-10-07 — M2F controlled diagnostic implementation
- Baseline起始working tree乾淨、fix/freedsp-conexant、M2E69c5532；verify10files/73tests通過。
- 新增FreeDSP專用officialRamProof codec、CAF RX parser與ACK/timeout transport，診斷頁改為單段manual test/flat。
- Wire schema固定selector0/band5；188/187/346/190依序ACK gating，無五rate loop、無自動90/Flash/legacyID4/5。
- 新增114buffers獨立重播、mock ACK/mismatch/timeout/scope tests、五rate穩定pole與衰減頻率響應檢查。
- GENERAL/ROADMAP/DECISIONS/DONE記錄187固定report實驗、native最後neighbor限制與Henry hardware結果PENDING。
- Codex未連接或寫入硬體、未做聆聽測試；production DSP與non-FreeDSP protocol無變更。
- 最終verify.ps1 exit0：11files/94tests（新增21tests）、TypeScript/build/test typecheck全部通過。
- 既有dev.ps1已啟動localhost:5173；root/debug HTML/diagnostic TS modules/model HTTP200。
  HTTP檢查不觸發HID，沒有稱為瀏覽器互動或硬體proof；等待Henry手動回報。

## 2026-10-07 — M2G hardware record / transport implementation
- Henry回報M2F三次：Apply兩次、Restore一次，descriptor gate通過，188 host send成功後約2.5秒timeout；沒有matching RX記錄。
  187/346/190皆未送，故無可聽差異不能判為EQ失敗；沒有把188判為accepted/rejected。
- 起始git乾淨、fix/freedsp-conexant、0ca80b5；baseline verify11files/94tests通過。
- 完整靜態追出sendCmd/getMsgByCmd的SET/GET控制傳輸、fresh RX配置、caller回應使用及unsignedcount檢查。
  新增inspect-response.py、完整來源JSON與證據說明；APK/native程式皆未執行。
- 診斷頁只提供inspect/open與query346，persistent raw listener、event counter、所有ID/長度保存與短candidate解析；M2F Apply/Restore/90無控制入口。
- 新增20項mock/source tests，與synthetic346/count4 fixture明確區分實際259/count4、90/220/count0證據。
- GENERAL/ROADMAP/DECISIONS/DONE記錄三次實測結果與當前限制；Codex沒有硬體access或EQ/Flash寫入，production與non-FreeDSP不改。
- 最終verify.ps1 exit0：12files/114tests、TypeScript/Vite build與test typecheck通過，原94tests保留，新增20tests。
- inspect-response再次抽取12methods，保存JSON完全一致；currentAPK的UsbHelperDump tag absent。
- 已以hidden dev.ps1啟動localhost:5173，root/M2G頁及兩個診斷TS模組直接HTTP200；僅驗證可提供，無瀏覽器/HID操作。
- 還原本輪生成dist後，git diff --check通過，production source/舊M2F helper/config/package無差異。

## 2026-10-07 — M2H response transport feasibility
- 起始working tree乾淨，fix/freedsp-conexant追蹤origin，HEAD ebc34b7；origin/upstream設定正確。
- 已記錄Henry的M2G結果：open/send前raw listener ACTIVE；346 ID1/data61 host send resolved；2.5秒後rawTotal=0/newEvents=0，無任何inputreport。
  沒有parser輸入，不能判DSP接受/拒絕，沒有RAM/audio proof；Codex未存取硬體。
- 本輪重播pinned APK完整12methods，與officialResponseStaticEvidence.json完全一致。
- 靜態確認CnxtUsbDeviceBase.connectUsbDeviceByApplication選class3/subclass0/protocol0/interface3並claim；SET/GET參數及array.length再次核對。
- 已查WebHID/WebUSB規格、Chromium HID/USB實作、Chrome Windows WinUSB要求、Windows Input report API、Web Audio/Media Capture規格。
- 正常Windows Chrome網頁不能顯式Input GET_REPORT，Feature讀取不等價；protected HID class阻擋WebUSB及hybrid官方回應路徑。
- 四份指定文件保存參數、限制、方案比較、失敗歷史、upstream證據及成功狀態政策；無新增文件或程式修改。
- 本輪Case C，不新增診斷按鈕、不安裝driver/helper、不要求Henry重做WebHID346/descriptor；No manual test required this round。
- 最終verify.ps1 exit0：12files/114tests全部通過，TypeScript/Vite build/test typecheck通過；未新增測試或fake success fixture。
- Flash helper writeGolemCmdToDevice的SET/GET constants/call亦再次靜態核對；未送Flash命令。
- 還原本輪生成的三個tracked dist files後，只四份指定docs有差異；git diff --check通過。
