# PoE PD 互動教學（PoE PD Series）

PoE 受電端設備（PD）的四個中英雙語互動教學頁：架構總覽、握手狀態機、功率預算、DC-DC 拓撲選擇。

- `_site/`：Vercel 部署的靜態網站（`index.html` 系列首頁＋四頁，共用 `assets/`）
- `_src/`：產生器。`shell.html` 共用版型，`series.css`（沿用 DC-DC 系列樣式）＋`poe.css`，`common.js` 放共用函式與 IEEE Class 資料表，各頁內容是 `*.part.html`
- 更新流程：修改 `_src/` → `python _src/build.py` → commit 並 push

內容依據：IEEE 802.3-2022 Clause 33（af／at）與 Clause 145（bt）的 PD 端要求；TI、ADI PD 控制器與整流橋控制器資料。Flyback 與主動箝位 Forward 的電路動畫在 [DC-DC 拓撲系列](https://dcdc-topology-series.vercel.app/)。頁面為教學模型，實際設計請以規範與晶片規格書為準。