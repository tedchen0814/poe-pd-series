const NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const fx = (v, d = 2) => (Math.abs(v) < 1e-9 ? 0 : v).toFixed(d);
const REDUCED = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
function svgEl(tag, attrs, parent, text){
  const e = document.createElementNS(NS, tag);
  for (const a in attrs) e.setAttribute(a, attrs[a]);
  if (text != null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}
function segGroup(id, cb){
  const g = $(id);
  g.addEventListener('click', e => {
    const b = e.target.closest('button[data-v]'); if (!b) return;
    setSeg(id, b.dataset.v); cb(b.dataset.v);
  });
}
function setSeg(id, v){ $(id).querySelectorAll('button[data-v]').forEach(o => o.setAttribute('aria-pressed', o.dataset.v === String(v))); }
function sliders(defs, P, box, onChange){
  defs.forEach(d => {
    const w = document.createElement('div'); w.className = 'param';
    w.innerHTML = `<div class="top"><label for="p_${d.k}">${d.zh}<span class="en">${d.en}</span></label><output id="o_${d.k}"></output></div>
      <input type="range" id="p_${d.k}" min="${d.min}" max="${d.max}" step="${d.step}">`;
    box.appendChild(w);
    $('p_' + d.k).addEventListener('input', e => { P[d.k] = parseFloat(e.target.value); sync(); onChange(d.k); });
  });
  function sync(){ defs.forEach(d => { $('p_' + d.k).value = P[d.k]; $('o_' + d.k).textContent = d.fmt(P[d.k]); }); }
  sync();
  return sync;
}
/* glossary of abbreviations: key -> [full English name, 中文說明] */
const GLOSS = {
  "PoE":["Power over Ethernet", "乙太網路供電"],
  "PSE":["Power Sourcing Equipment", "供電設備，通常是 PoE Switch 或中跨供電器（Midspan injector）"],
  "PD":["Powered Device", "受電設備，例如 AP、IP Cam、話機"],
  "MPS":["Maintain Power Signature", "維持供電特徵：PD 上電後必須持續吸取的最小電流，PSE 靠它判斷 PD 還接著"],
  "LLDP":["Link Layer Discovery Protocol", "鏈結層探索協定：PD 上電後用它跟 PSE 重新協商功率（見 06 頁）"],
  "Autoclass":["Autoclass", "bt 選用功能：PD 上電後刻意吃滿功率，讓 PSE 實測後只保留實際需要的功率"],
  "DC-DC":["DC-to-DC Converter", "直流轉直流轉換器：把 37–57 V 轉成板上電壓"],
  "IEEE":["Institute of Electrical and Electronics Engineers", "電機電子工程師學會，制定 802.3 乙太網路與 PoE 規範"],
  "ALT A／B":["Alternative A / Alternative B", "PSE 端兩組供電線對：A 是 1-2／3-6（訊號線對），B 是 4-5／7-8（備用線對）"],
  "RJ45":["Registered Jack 45", "8 針網路接頭"],
  "PHY":["Physical Layer Transceiver", "乙太網路實體層晶片，經由變壓器接到線對"],
  "TVS":["Transient Voltage Suppressor", "暫態電壓抑制二極體，吸收突波與 ESD"],
  "PG":["Power Good", "電源就緒訊號：PD 控制器確認湧浪完成後才拉起，用來啟動 DC-DC"],
  "UVLO":["Under-Voltage Lockout", "欠壓鎖定：電壓低於門檻時不讓電路啟動或強制關閉"],
  "EN":["Enable", "致能腳位，控制轉換器開啟或關閉"],
  "VDD／VSS":["Positive / Negative Supply Pin", "PD 控制器的正、負電源輸入腳位"],
  "RTN":["Return", "PD 控制器 hot-swap 開關之後的負端回路，DC-DC 的地接在這裡"],
  "HS":["Hot-Swap (switch)", "熱插拔開關：PD 控制器內的 MOSFET，負責湧浪限流與上電"],
  "RCLS":["Classification Resistor", "分級電阻：設定 PD 在分級事件時吸取的電流，也就是要求的 Class"],
  "DEN":["Detection and Enable", "TI PD 控制器的偵測腳位：接 24.9 kΩ 偵測電阻，拉低可關閉 PD 介面"],
  "TPL／TPH":["Allocated Power Indicator (Low / High)", "TI bt PD 控制器的輸出腳位，以高低組合回報 PSE 核准的功率等級"],
  "T2P":["Type 2 PSE Indicator", "TI at PD 控制器的輸出腳位，表示偵測到 2 次分級事件（對方是 Type 2 PSE）"],
  "APD":["Auxiliary Power Detect", "外接電源偵測腳位：偵測到牆插變壓器時讓外接電源優先"],
  "ORing":["OR-ing (Diode OR)", "用二極體或 MOSFET 讓兩個電源擇一供電的電路"],
  "MOSFET":["Metal-Oxide-Semiconductor Field-Effect Transistor", "金氧半場效電晶體，當開關或同步整流用"],
  "FET":["Field-Effect Transistor", "場效電晶體"],
  "R<sub>DS(on)</sub>":["Drain-Source On-Resistance", "MOSFET 導通時汲極與源極之間的電阻，決定 I²R 損耗"],
  "V<sub>F</sub>":["Forward Voltage", "二極體順向壓降"],
  "I²R":["Current² × Resistance", "電流平方乘電阻：線材或元件的導通損耗"],
  "AWG":["American Wire Gauge", "美國線規：數字越大線越細，24 AWG 約 84 Ω／km"],
  "Cat3／Cat5e／Cat6":["Category 3 / 5e / 6 Cable", "網路線等級，等級越高頻寬越大、通常線徑也越粗"],
  "CCA":["Copper-Clad Aluminum", "銅包鋁線，電阻約純銅 1.5 倍以上，不符合 Cat 規格"],
  "EMI":["Electromagnetic Interference", "電磁干擾"],
  "PCB":["Printed Circuit Board", "印刷電路板"],
  "IC":["Integrated Circuit", "積體電路"],
  "RCD":["Resistor-Capacitor-Diode Clamp", "電阻－電容－二極體箝位電路，吸收 Flyback 漏感突波"],
  "SR":["Synchronous Rectification", "同步整流：用 MOSFET 取代整流二極體降低損耗"],
  "PSR":["Primary-Side Regulation", "初級側調節：從初級繞組回授，不用光耦"],
  "ACF":["Active Clamp Forward", "主動箝位順向式轉換器"],
  "AP":["Access Point", "無線基地台"],
  "PTZ":["Pan-Tilt-Zoom", "可轉動、可變焦的攝影機"],
  "USB":["Universal Serial Bus", "通用序列匯流排"]
};
function glossary(box, keys){
  box.innerHTML = '<div class="scroll-x"><table class="gloss"><thead><tr><th>縮寫</th><th>完整英文名稱</th><th>中文意思與說明</th></tr></thead><tbody>' +
    keys.map(k => `<tr><td>${k}</td><td>${GLOSS[k][0]}</td><td>${GLOSS[k][1]}</td></tr>`).join('') + '</tbody></table></div>';
}
/* IEEE 802.3af/at/bt power classes: PSE output power, PD input power, PD type, class signature per event */
const POE = {
  classes: [
    {c:0, pse:15.4, pd:12.95, type:1, vmin:37},
    {c:1, pse:4.0,  pd:3.84,  type:1, vmin:37},
    {c:2, pse:7.0,  pd:6.49,  type:1, vmin:37},
    {c:3, pse:15.4, pd:12.95, type:1, vmin:37},
    {c:4, pse:30,   pd:25.5,  type:2, vmin:42.5},
    {c:5, pse:45,   pd:40,    type:3, vmin:44.4},
    {c:6, pse:60,   pd:51,    type:3, vmin:42.5},
    {c:7, pse:75,   pd:62,    type:4, vmin:42.9},
    {c:8, pse:90,   pd:71.3,  type:4, vmin:41.1}
  ],
  // vmin: minimum PD input voltage for the assigned class (V_PSE,min with worst-case channel at full class power;
  //       Class 0–3 per Clause 33 Type 1 at 20 Ω, Class 7/8 per Clause 145: 42.9 / 41.1 V)
  sigMA: [2.5, 10.5, 18.5, 28, 40],            // mid-range class signature current (PD side 1–4, 9–12, 17–20, 26–30, 36–44 mA)
  sigRange: ['1–4', '9–12', '17–20', '26–30', '36–44'],
  types: {
    1: {std:'802.3af', vpse:[44, 57], vpd:37,   icable:0.35,  pairs:2, maxEv:1},
    2: {std:'802.3at', vpse:[50, 57], vpd:42.5, icable:0.60,  pairs:2, maxEv:2},
    3: {std:'802.3bt', vpse:[50, 57], vpd:42.5, icable:0.60,  pairs:4, maxEv:4},
    4: {std:'802.3bt', vpse:[52, 57], vpd:41.1, icable:0.96,  pairs:4, maxEv:5}
  },
  // class signature the PD shows at class event n (1-based)
  sig(c, n){ if (c <= 4) return c; return n <= 2 ? 4 : c - 5; },
  // class events a PD of class c needs to be granted its full power
  needEv(c){ return c <= 3 ? 1 : c === 4 ? 2 : c <= 6 ? 4 : 5; },
  // power the PD may draw after n class events (power demotion)
  grant(c, n){
    const want = POE.classes[c].pd;
    const cap = n >= 5 ? 71.3 : n >= 4 ? 51 : n >= 2 ? 25.5 : 12.95;
    return Math.min(want, cap);
  }
};
