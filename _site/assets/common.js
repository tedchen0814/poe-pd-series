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
/* IEEE 802.3af/at/bt power classes: PSE output power, PD input power, PD type, class signature per event */
const POE = {
classes: [
{c:0, pse:15.4, pd:12.95, type:1},
{c:1, pse:4.0,  pd:3.84,  type:1},
{c:2, pse:7.0,  pd:6.49,  type:1},
{c:3, pse:15.4, pd:12.95, type:1},
{c:4, pse:30,   pd:25.5,  type:2},
{c:5, pse:45,   pd:40,    type:3},
{c:6, pse:60,   pd:51,    type:3},
{c:7, pse:75,   pd:62,    type:4},
{c:8, pse:90,   pd:71.3,  type:4}
],
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
