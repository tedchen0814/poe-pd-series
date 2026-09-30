**PoE PD（Powered Device，受電端設備）在硬體架構上並非單一電路，而是由「網路介面協議前端」與「DC-DC 電源轉換後級」所組成的兩段式混合架構。**

根據 IEEE 802.3af（Type 1, 15.4W）、802.3at（Type 2, 30W）以及 802.3bt（Type 3/4, 60W~90W）規範，PoE 輸入為 37V～57V DC 浮動電壓，標準架構流程如下：

```
乙太網路線 (RJ45) 
       │
       ▼
1. 網路變壓器抽頭 (Ethernet Magnetics Center Taps)
       │
       ▼
2. 極性校正 / 整流橋 (Diode Bridge 或 Active Bridge)
       │
       ▼
3. PD 介面控制器 (PD Interface Controller)
   [偵測 25kΩ -> 分級 Class -> 熱插拔 Pass Switch / Inrush 電流限制]
       │ (輸出 37V~57V Vport)
       ▼
4. DC-DC 轉換器 (DC-DC Converter Topology)
       │
       ▼
系統後端負載 (12V / 5V / 3.3V 等)

```

---

### 一、 前端：PD 介面架構（IEEE 規範核心）

前端電路負責與 PSE（供電端，如 PoE Switch）進行協議握手與上電控制：

1. **極性校正（Polarity Correction）：**
* 需支援 Alternative A（Data 線供電）與 Alternative B（Spare 線供電），且線路極性可能反接。
* **低功率（<13W）：** 採用蕭特基二極體整流橋（Schottky Bridge）。
* **高功率（802.3at/bt）：** 二極體壓降損耗過大，普遍改用主動式理想二極體控制器（Active FET Bridge）以提升散熱與轉換效率。


2. **PD 控制器握手狀態機：**
* **Detection（偵測）：** 提供精準的 **25kΩ** 特性阻抗供 PSE 確認接上有效 PD。
* **Classification（分級）：** 透過吸取特定電流等級（Class 0~8），向 PSE 宣告功率需求（802.3bt 支援多事件雙標記握手）。
* **Pass Switch（Hot-Swap 開關）：** 內部高壓 N-MOSFET，握手完成且電壓超過欠壓鎖定（UVLO，約 36V~42V）後平緩開啟，限制湧浪電流（Inrush Current），充飽後端大電容。



---

### 二、 後端：DC-DC 拓撲架構（依安規與功率決定）

將 37V~57V 的乙太網高壓轉換為板端低壓，主要分為**隔離式**與**非隔離式**兩大流派：

| 拓撲架構 | 適用功率與情境 | 優點 | 缺點 / 考量 |
| --- | --- | --- | --- |
| **隔離式 Flyback (返馳式)**<br>

<br>*(最主流架構)* | **< 30W** (802.3af / at)<br>

<br>IP Cam、VoIP 話機、門禁系統 | • 滿足 IEEE 802.3 嚴格的 1500Vrms 電氣隔離安規<br>

<br>• 元件少、支援多路輸出 | • 次級漏感突波大<br>

<br>• 大功率時變壓器與二極體損耗顯著 |
| **同步整流 Flyback**<br>

<br>*(PSR 或 SSR)* | **15W ~ 40W**<br>

<br>中功率高效率設備 | • 以 Secondary-Side MOSFET 取代蕭特基二極體，顯著提高效率並改善溫升 | • 需同步整流驅動電路，或採用 PSR（初級側調節）晶片降低光耦成本 |
| **主動箝位 Forward (正激式)**<br>

<br>*(Active-Clamp Forward)* | **30W ~ 90W** (802.3bt)<br>

<br>高效能 Wi-Fi 6/7 AP、PTZ 雲台攝影機 | • 變壓器磁芯利用率高（雙向對稱磁化）<br>

<br>• 效率極佳（常達 92%~95%），適合高電流輸出 | • 需兩個主動開關及精密死區控制，控制晶片與周邊複雜度高 |
| **非隔離 Buck (降壓式)** | **成本極限敏感、全封閉式設備**<br>

<br>(無外露金屬端口、完全不外接周邊) | • 成本極低、體積最小、無變壓器與光耦 | • **不具電氣隔離**，若外殼或介面（如 USB/外接感測器）遭人體接觸易有安規與 ESD 擊穿風險 |

---
