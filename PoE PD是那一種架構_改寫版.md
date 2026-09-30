---
title: PoE PD 是哪一種架構：PD 介面前端＋DC-DC 後級（含互動教學頁）
date: 2026-09-30
tags: [工作技術, 電源設計, PoE, PD, IEEE802.3af, IEEE802.3at, IEEE802.3bt, Flyback, ActiveClampForward, 教學素材]
---

# PoE PD 是哪一種架構

> **2026-09-30 改寫。** 原稿為 AI 對話產出的架構摘要；Ted 請 Claude Code 討論、修正並補充，同時做成四頁互動教學網站（PoE PD Series），並在 DC-DC 拓撲系列加上 05 Flyback、06 主動箝位 Forward 兩頁。
>
> **來源標示**：〔IEEE〕＝IEEE 802.3-2022 Clause 33（af／at）、Clause 145（bt）的 PD 端要求；〔TI〕〔ADI〕＝晶片廠規格書與產品資料（TI TPS2372／TPS2373、ADI LT4321）；〔補充〕＝Claude 依一般設計經驗整理，屬 AI 推論，使用前請以規範與晶片規格書為準。

## 一、互動教學頁

| 頁 | 內容 | 網址 |
|---|---|---|
| 首頁 | 電源鏈總覽、四頁入口、常見問題速查 | https://poe-pd-series.vercel.app/ |
| 01 架構總覽 | 可切換 ALT A／ALT B／4 對與極性，看電流走哪兩顆二極體；蕭特基 vs 主動整流橋損耗計算 | `architecture.html` |
| 02 握手狀態機 | PD 端 Vport／Iport 波形與狀態機同步播放；可選 Class 0–8、PSE Type 1–4；三種故障情境（偵測失敗、DC-DC 太早啟動、MPS 不足） | `handshake.html` |
| 03 功率預算 | PSE → 線損 → 整流橋 → hot-swap → DC-DC → 負載逐段算損耗，檢查 Class 功率、線對電流與 Vport 下限；AP／PTZ／IP Cam 範例 | `power-budget.html` |
| 04 DC-DC 拓撲選擇 | 依功率、隔離需求、輸出路數與成本／效率優先排出拓撲，附效率區間圖 | `dcdc-topology.html` |
| DC-DC 05 Flyback | 電路動畫＋同步波形（汲極電壓含 RCD 箝位突波、激磁電流、開關電流、次級二極體電流），CCM／DCM | https://dcdc-topology-series.vercel.app/flyback.html |
| DC-DC 06 ACF | 主動箝位 Forward：Q1／Q2 兩顆開關、激磁電流正負擺動（磁通雙向重置）、輸出電感電流 | https://dcdc-topology-series.vercel.app/acf.html |

**維護方式**：`_src/` 為產生器——`shell.html` 共用版型、`series.css`（沿用 DC-DC 系列樣式）＋`poe.css`、`common.js`（共用函式與 IEEE Class 資料表 `POE`），各頁內容是 `*.part.html`；執行 `python _src/build.py` 同時產生單檔版（`PoE-*_互動教學.html`）與 Vercel 網站（`_site/`）。

## 二、整體架構：兩段式

PoE PD（Powered Device，受電端設備）在硬體上不是單一電路，而是「**網路介面協議前端**」加上「**DC-DC 電源轉換後級**」的兩段式架構：

```
PSE（PoE Switch，44–57 V）
      │  網路線（100 m 迴路電阻造成 I²R 損耗）
      ▼
1. RJ45 ＋ 網路變壓器中心抽頭（Center Taps）
      ▼
2. 極性校正整流橋 ×2（ALT A 與 ALT B 各一組；蕭特基或主動 MOSFET 橋）
      ▼
3. TVS（≈58 V）＋ 偵測電容 0.05–0.12 µF
      ▼
4. PD 介面控制器：偵測 25 kΩ → 分級 Class → UVLO → 低側 hot-swap（VSS→RTN，限流充電）→ PG
      ▼
5. C_bulk（接在 RTN 之後）＋ DC-DC 轉換器（由 PG 啟動）
      ▼
6. 系統負載（12 V／5 V／3.3 V），依核准功率限載
```

## 三、三代標準與 Class 功率

| Class | PSE 輸出 | PD 可用 | 類型／標準 |
|---|---|---|---|
| 1 | 4.0 W | 3.84 W | Type 1 · af |
| 2 | 7.0 W | 6.49 W | Type 1 · af |
| 0／3 | 15.4 W | 12.95 W | Type 1 · af |
| 4 | 30 W | 25.5 W | Type 2 · at |
| 5 | 45 W | 40 W | Type 3 · bt（4 對） |
| 6 | 60 W | 51 W | Type 3 · bt |
| 7 | 75 W | 62 W | Type 4 · bt |
| 8 | 90 W | 71.3 W | Type 4 · bt |

**PD 端電壓範圍**〔IEEE〕：Type 1 為 37–57 V；Type 2／3 為 42.5–57 V；Type 4 為 41.1–57 V。PSE 端輸出：af 44–57 V，at／bt 50–57 V（Type 4 為 52–57 V）。原稿寫「37 V～57 V」只適用於 af。

**PSE 功率與 PD 功率的差額就是線損**：規範用「PSE 最低電壓 × 最大電流」減掉「最壞線材的 I²R」定出 PD 可用功率。

| 類型 | 計算 | 結果 |
|---|---|---|
| Type 1 | 44 V × 0.35 A = 15.4 W；線損 0.35² × 20 Ω = 2.45 W | 12.95 W |
| Type 2 | 50 V × 0.6 A = 30 W；線損 0.6² × 12.5 Ω = 4.5 W | 25.5 W |
| Type 3（Class 6） | 50 V × 1.2 A = 60 W；4 對並聯 6.25 Ω，線損 1.2² × 6.25 = 9 W | 51 W |
| Type 4（Class 8） | 52 V × 1.73 A = 90 W；線損 1.73² × 6.25 = 18.7 W | 71.3 W |

## 四、前端：PD 介面（IEEE 規範核心）

### 1. 線對與極性校正
- **ALT A** 走 1,2／3,6（資料線對），可能遇到 MDI／MDI-X 交叉，極性不固定；**ALT B** 走 4,5／7,8（備用線對），也可能反接。PD 必須兩種極性都能接受 → **兩組線對各需要一個整流橋**〔IEEE〕。
- 每組整流橋任何時候都只有兩顆二極體導通；不論極性，輸出 VDD 永遠是正、VSS 永遠是負。bt 四對線供電時，兩組橋並聯輸出、電流各分一半。
- **損耗**：蕭特基整流在電流路徑上永遠有兩顆二極體，損耗約 2·V_F·I。25.5 W 時約 0.5 A，損耗約 0.5 W；71 W 時約 1.4 A，損耗約 1.4 W，而且集中在小封裝上。**主動整流橋**（例如 ADI LT4321 理想二極體橋控制器驅動 MOSFET）把損耗降成 I²·R_DS(on)〔ADI〕。原稿「<13 W 用蕭特基」是業界習慣而非規範，用損耗算就知道何時需要主動橋。
- 蕭特基高溫漏電流會讓 25 kΩ 偵測特徵變小，選低漏電型號或改用主動整流〔補充〕。

### 2. PD 控制器握手狀態機

| 階段 | PD 端電壓 | PD 要做什麼 |
|---|---|---|
| Detection 偵測 | 2.7–10.1 V（PSE 量至少兩點，用 ΔV/ΔI） | 特徵電阻 23.75–26.25 kΩ（PSE 接受 19–26.5 kΩ），電容 ≤ 0.12 µF〔IEEE〕 |
| Classification 分級 | 14.5–20.5 V（PSE 輸出 15.5–20.5 V） | 分級電流：Class 0 為 1–4 mA、1 為 9–12、2 為 17–20、3 為 26–30、4 為 36–44 mA〔IEEE〕 |
| Mark 標記 | 6.9–10 V | 兩次分級事件之間，PD 吸 0.25–4 mA |
| Power-up／Inrush | 上升到 44–57 V | Vport 超過 UVLO 後以限流打開 hot-swap；PSE 上電限流約 400–450 mA、時間約 50–75 ms；PD 控制器常把 inrush 限在 100–200 mA，C_bulk 要在時間內充飽（t ≈ C·V／I） |
| Power on | 穩態 | C_bulk 充飽後送 **PG**，DC-DC 才啟動 |
| MPS 維持功率特徵 | — | Type 1／2 PSE：≥10 mA，每 325 ms 至少 75 ms〔TI〕；Type 3／4 PSE：短 MPS，脈衝約為十分之一（約 7 ms／318 ms），Class 5–8 門檻 16 mA〔TI〕 |
| Disconnect | — | MPS 消失約 300–400 ms 後 PSE 斷電 |

**UVLO**〔IEEE〕：規範要求 PD 在 Vport ≤ 42 V 前必須開啟、低於 30 V 必須關閉；中間的遲滯讓長線加負載壓降時不會反覆開關（原稿「約 36 V～42 V」混淆了開啟與關閉兩個門檻）。

**多事件分級與功率降級**：bt 的 Class 5–8 不定義新電流，而是用多次分級事件的組合表示——前兩次都回 Class 4，第 3 次起 Class 5 回 0、Class 6 回 1、Class 7 回 2、Class 8 回 3。bt PSE 的第一次分級事件特別長（88–105 ms），PD 可藉此判斷對方是 bt PSE。PD 靠**數分級事件的次數**知道 PSE 核准的功率：1 次最多 13 W、2 次 25.5 W、4 次最多 51 W、5 次最多 71.3 W；PSE 能力不足時次數變少，就是**降級（power demotion）**，系統要依此限制負載。

**Single-signature vs Dual-signature**：兩組線對共用一個偵測／分級特徵（single-signature，最常見），或兩組各自獨立偵測與分級（dual-signature）。這和「多事件分級」是兩件不同的事——原稿「802.3bt 支援多事件雙標記握手」把兩者混在一起。

### 3. PD 前端其他元件〔補充〕
- **TVS**：整流橋後、跨在 Vport 上（常見 SMAJ58A），緊貼 PD 控制器 VDD／VSS 腳，擋雷擊與熱插拔振鈴。
- **偵測電容**：Vport 端只放 0.05–0.12 µF；大電容一定要放在 hot-swap（RTN）之後，否則偵測失敗。
- **Bob Smith 終端**：網路變壓器中心抽頭的 75 Ω＋1 nF／2 kV 接機殼地，影響 EMI 與突波路徑；中心抽頭走線要能承載 PoE 電流。
- **外接變壓器（Aux）優先權**：PoE 與牆插同時存在時，常從 PD 控制器後端或 DC-DC 輸入以二極體 ORing 接入，並用控制器的 APD 腳讓 Aux 優先〔TI〕。
- **核准功率回報**：PD 控制器的 TPL／TPH（或 T2P）腳告訴系統 PSE 核准的等級，系統據此決定開多少負載（AP 關部分 radio、PTZ 限制加熱器）。
- **LLDP 功率協商**（Data Link Layer Classification，at 以後）可在上電後動態調整功率；**bt Autoclass** 讓 PSE 量測 PD 實際最大功耗，只保留真正需要的功率〔IEEE〕。

## 五、後端：DC-DC 拓撲（依安規與功率決定）

將 37–57 V 轉成板端低壓，分為**隔離式**與**非隔離式**：

| 拓撲 | 常見功率與情境 | 優點 | 缺點／考量 |
|---|---|---|---|
| **Flyback（二極體整流）**，最主流 | 3–25 W（af／at）：IP Cam、VoIP 話機、門禁 | 滿足隔離要求；元件少、容易多路輸出 | 漏感突波要靠 RCD 箝位吸收；低壓大電流時次級二極體損耗大 |
| **同步整流 Flyback**（PSR 或 SSR） | 10–45 W：中功率高效率設備 | 次級改用 MOSFET，效率與溫升明顯改善 | 需同步整流控制器；PSR（初級側調節）省光耦但調節精度較低 |
| **主動箝位 Forward（ACF）** | 25–90 W（bt）：Wi-Fi 6／7 AP、PTZ | 箝位電容與箝位開關讓激磁電流反向、磁通往負方向重置，用到磁化曲線第二象限，磁芯利用率比 RCD 或第三繞組重置的 Forward 高；Q1 應力 VIN／(1−D) 可預測、無漏感突波；效率常達 91–94%；D 可超過 50% | 兩顆主動開關（主開關＋箝位開關）與死區控制，控制晶片與周邊較複雜；多一顆輸出電感 |
| **非隔離 Buck** | 成本極限敏感、全封閉設備（無外露金屬、不外接周邊） | 成本最低、體積最小，沒有變壓器與光耦 | **不具電氣隔離**；外殼或介面（USB、外接感測器）被人體接觸時有安規與 ESD 擊穿風險；48 V → 3.3 V 佔空比很小，常需兩級 |

原稿 ACF 寫「雙向對稱磁化」不夠精確：主動箝位的激磁電流在正負之間擺動、磁通雙向重置，但磁化並非完全對稱。

**隔離要求**〔IEEE〕：PoE 介面與使用者可接觸的導體之間要有 1500 Vrms 等級的電氣隔離；只有整台設備完全封閉、沒有任何外露導體時才考慮非隔離。Layout 上只有變壓器、光耦與 Y 電容跨越隔離帶，隔離帶下方各層不鋪銅，依安規留爬電距離〔補充〕。

**PoE Flyback 設計值參考**〔補充〕：48 V → 12 V／2 A，匝比 4:1 時反射電壓約 49.6 V、D ≈ 51%、初級峰值約 1.44 A、次級峰值約 5.8 A，Q 承受約 98 V 再加漏感突波，常選 150–200 V MOSFET。
**PoE ACF 設計值參考**〔補充〕：48 V → 12 V／4 A，匝比 2:1 時 D ≈ 52%、Q1 峰值約 2.44 A、Q1 承受 VIN／(1−D) ≈ 99 V、箝位電容約 51 V。

## 六、常見故障除錯

| 症狀 | 卡在哪個狀態 | 常見原因 | 怎麼查 |
|---|---|---|---|
| PSE 完全不送電 | 偵測 | 特徵電阻不在 19–26.5 kΩ：整流橋或 TVS 漏電、大電容放在 hot-swap 前面、偵測電阻錯 | PD 不接 PSE，用電源量 4 V／8 V 的電流算 ΔV/ΔI；檢查 Vport 端電容 |
| 上電後反覆重啟 | 上電 | DC-DC 沒等 PG 就啟動（定功率抽電，電壓低時電流更大，撞到 PSE 限流）；C_bulk 太大；UVLO 遲滯不夠加長線壓降 | 同時量 Vport、Iport、PG；確認 DC-DC 的 EN／UVLO 由 PG 控制 |
| 只拿到 13 W 或 25.5 W | 分級 | PSE 只支援 af／at，或 bt PSE 預算不足造成降級；RCLS 選錯 | 讀 TPL／TPH／T2P；看 Switch 埠狀態與 LLDP |
| 待機一段時間後斷電 | MPS | 待機電流 < 10 mA（bt Class 5–8 為 16 mA）且沒有 MPS 脈衝 | 量待機電流；啟用 PD 控制器自動 MPS |
| 高功率或長線時斷電 | 供電 | 負載超過核准功率、CCA 劣質線或過長線造成 Vport 掉到 UVLO 關閉點 | 用 03 功率預算頁計算線損與 Vport |

## 相關筆記

- [[工作技術_DC-DC拓撲開關電流與輸入輸出電流關係_互動教學頁]]：DC-DC 拓撲系列（本次新增 05 Flyback、06 主動箝位 Forward）。
- [[工作技術_GaN與傳統MOS效率發熱對比_DC-DC應用分析]]：開關元件層面的效率與 Power Loop 佈局。
- [[工作技術_PCB_Layout與Gerber審查檢查清單]]：可把隔離帶、TVS 位置與 hot loop 加入審查項目。
- [[工作技術_Ethernet_1G至800G高速網路介面技術]]：乙太網路速率與線材背景。

參考：IEEE 802.3-2022 Clause 33／145；TI TPS2373 規格書（MPS）；bt 多事件分級組合參考 IEEE 802.3bt 工作小組資料與 poepower.smps.us。
