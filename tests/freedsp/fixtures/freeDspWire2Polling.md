# Controlled446 path0 / wire2 polling — READY FOR SINGLE HARDWARE QUERY

2026-10-09. Implementation/offline tests only; no Codex hardware access. Full Device EQ Readback remains **BLOCKED**.

## Isolated opt-in entry

Script: `D:\Henry\Documents\ChatGPT\AuraPEQ\scripts\query-freedsp-446-wire2.ps1`.
Native CLI operation `poll446Wire2` accepts no arguments. Program uses existing exact35D8:1496 MI03 CAF unique collection gate,usage0x0c/1,caps62/62,ID1 validation and opened-handle reinspection. Its scoped output allowlist permits only the byte-exact13-word446 query `[0,2,0×11]`. No supporting346/477,mode change190/220/90/188/187/reset or scan. Normal HTTP allowlist/CONNECT,old nineteen-query readback behavior and RAM/Flash exchange logic unchanged.

## Waiting and correlation

- ONE SET attempt, no resends. Deadline1000ms starts before SET; each GET uses a fresh62-byte ID1 buffer,5ms waits,max201GET attempts. Calls that return after the deadline are recorded but cannot succeed. Win32 HID calls cannot be cancelled by this deadline;launcher stops its owned child after30s if blocked.
- Completed reply requires ID1,prefix0,CTRL0xB32D2300,command446,reply1,word0=0 andword1=2,count exactly8,scaling word0..25,and five signed24 containers (sign-extended or zero-extended low24). Scaling/count restrictions are conservative known-format diagnostic bounds,not firmware limits. Unparsed capacity tail stays raw,not new semantic fields. Wrong command/module/path/wire,malformed/unsupported format,API error/disconnect orunexpected exception stops without laterGET/SET.
- reply0 is pending **only** for the known request-shaped count13/path0/slot0-or2/allremainingwordszero. slot0/payloadclearing is not interpreted as coefficients. This handles Henry's actual failed frame and a byte-exact query echo;other pending shapes fail closed. Official SDK polls reply0 with weaker matching;we do not copy that weak acceptance.
- Per observation records raw base64/API result/Win32 error/start andfinishelapsedms/EnvelopeMatched/PathWireMatched/result/reason. Each JSON observation is streamed separately,so thelauncher retains partial evidence while the child runs. Final JSON includes originalTX,UTC start,query tuple,SET/GETcounts,overall elapsed/outcome,allobservations andexplicit `freshnessVerified=false`, `productionEligible=false`.
- `MATCHING_FRAME_FRESHNESS_UNVERIFIED` /exit0 means a tuple/format-matching frame arrived within budget,**not** transaction freshness,active-RAM/Flash source,enabled state orcomplete/stereo readback. No recovered transaction token distinguishes an unknown oldsame-path/wire frame. Known stalewire1 andwrongpath/command replies are rejected. This limitation is not concealed by a protocol success label.

## Henry's single manual invocation (do not auto-repeat)

1. Retain an already-known EQ state;record the latestApply/Restore/Flash/reconnect history andtime. Do not change EQ solely to run this query.
2. Ctrl+C the AuraPEQ dev server andclose other native CAF diagnostics/officialApp/readers. This script does not kill unrelated processes orauto-drain device reports.
3. Run once:

```powershell
cd D:\Henry\Documents\ChatGPT\AuraPEQ
& D:\Henry\Documents\ChatGPT\AuraPEQ\scripts\query-freedsp-446-wire2.ps1
```

The script builds into `%TEMP%\AuraPEQ\wire2-poll-<GUID>\helper`,avoiding production DLL locks. It prints full absolute paths to `wire2-poll.log`, `wire2-poll.json` and,if observations exist, `wire2-poll.partial.json`. Log AutoFlush andincrementalpartialJSON preserve completed observations if a laterHID call blocks. Partial JSON always saysINCOMPLETE,even if a MATCH observation appears;onlyfinalJSON statescompleted diagnostic outcome. MissingfinalJSON means completionunconfirmed. Theparent timeout kills only its newlystartedchild,no retry.

Send log andfinal/partialJSON. Do not rerun ontimeout/mismatch orpressRestore/Save aspartofthisvalidation. A laterAppcomparison isseparateandmustrecordinterveningactions;noApp/UI/Editorreconstructiondonebydiagnostic.

## Offline evidence

Native tests replay Henry's actual reply0 then a **synthetic**,notcaptured,wire2unityreply. TheyverifyoneSET/twoGET,rawretention,timingsandunverifiedfreshness. Repeatedactualpending/echo reaches1s withoneSET;wrongcommand/module/path/wire/stalewire1/count/exponent/container/ID/prefix/pendingpayload stopsfirstGET. SET/GETerrors,disconnect,unexpectedexceptionandlatevalidreply stopwithpartialrecords. NormalHTTPrejectsnewquery;otherdevicesfailmandatoryidentitygate. ExistingRAM18/Flash56mock regressionsincluded.

PowerShelllauncherASTandpartialJSON/StreamWriterroundtrip arecheckedoffline;theactualhardwarelauncher wasnotexecutedbyCodex. No Readback HARDWARE PASS,PR orrelease.
