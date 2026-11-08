/* Carnet de Tir Cible — saisie d'un score de concours, sans la cible :
   soit le score final seul (s.manual), soit toutes les flèches au clavier (s.ends classique).
   Script classique : partage ses variables avec les autres fichiers de js/ (voir l'ordre dans index.html). */
'use strict';

const ct = { mode: 'total', ends: [], sel: null, editId: null };
const CT_KEYS = ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'];

(function ctStyle() {
  const st = document.createElement('style');
  st.textContent = `
  .ct-end{display:flex;align-items:center;gap:6px;margin:6px 0}
  .ct-lbl{width:30px;font-size:12px;font-weight:700;opacity:.7}
  .ct-cell{min-width:42px;height:42px;border-radius:10px;border:1px solid rgba(128,128,128,.55);font:inherit;font-weight:700;background:transparent;color:inherit;padding:0}
  .ct-cell[aria-pressed="true"]{outline:3px solid var(--ink,#111);outline-offset:1px}
  .ct-sub{margin-left:auto;font-weight:700;white-space:nowrap}
  .ct-sub small{font-weight:400;opacity:.7}
  #ct-grid{max-height:34vh;overflow-y:auto}
  #ct-sum{font-weight:700;margin:6px 0}`;
  document.head.appendChild(st);
})();

const ctApe = () => parseInt($('#ct-ape').value, 10) || 3;
const ctNb = () => Math.max(1, Math.min(60, parseInt($('#ct-ends').value, 10) || 1));
const ctTri = () => $('#ct-target').value === 'Trispot';

function ctKeysState() {
  $$('#ct-keys .key').forEach(b => { const v = b.dataset.v; b.disabled = ctTri() && v !== 'M' && rank(v) < 5; });
}

function contestOpen(id) {
  const ex = id ? app.sessions.find(x => x.id === id) : null;
  const cfg = store.get(KEYS.cfg, { distance: '18m', target: '40', ape: 3, ends: 10 });
  $('#ct-distance').innerHTML = $('#cfg-distance').innerHTML;
  $('#ct-target').innerHTML = $('#cfg-target').innerHTML;
  $('#ct-ape').innerHTML = Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${i + 1} flèche${i ? 's' : ''}</option>`).join('');
  $('#ct-keys').innerHTML = CT_KEYS.map(v => `<button class="key ${zoneClass(v)}" data-action="ct-key" data-v="${v}">${v}</button>`).join('');
  const c = ex ? ex.config : { distance: cfg.distance, targetType: cfg.target, arrowsPerEnd: cfg.ape, totalEnds: cfg.ends };
  const known = [...$('#ct-distance').options].some(o => o.value === c.distance);
  $('#ct-distance').value = known ? c.distance : 'Custom';
  $('#ct-custom').value = known ? '' : c.distance;
  $('#ct-custom-wrap').hidden = known;
  $('#ct-target').value = c.targetType;
  $('#ct-ape').value = c.arrowsPerEnd;
  $('#ct-ends').value = c.totalEnds;
  $('#ct-date').value = dayKey(ex ? new Date(ex.date) : new Date());
  $('#ct-name').value = ex && ex.contest ? ex.contest.name || '' : '';
  const m = ex && ex.manual ? ex.manual : {};
  $('#ct-total').value = m.total !== undefined ? m.total : '';
  $('#ct-tens').value = m.tens || '';
  $('#ct-xs').value = m.xs || '';
  ct.editId = ex ? ex.id : null;
  ct.mode = ex && !ex.manual ? 'arrows' : 'total';
  ct.ends = ex && !ex.manual ? ex.ends.map(e => e.map(a => a.valStr)) : [];
  ct.sel = { e: 0, i: 0 };
  $('#ct-title').textContent = ex ? 'Modifier le concours' : 'Score de concours';
  ctKeysState();
  ctRender();
  if ($('#dlg-setup').open) $('#dlg-setup').close();
  $('#dlg-contest').showModal();
}

function ctRender() {
  $$('#ct-mode button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === ct.mode)));
  $('#ct-total-box').hidden = ct.mode !== 'total';
  $('#ct-arrows-box').hidden = ct.mode !== 'arrows';
  if (ct.mode === 'arrows') ctRenderGrid();
}

function ctRenderGrid() {
  const ape = ctApe(), n = ctNb();
  ct.ends = Array.from({ length: n }, (_, e) => Array.from({ length: ape }, (_, i) => (ct.ends[e] || [])[i] || ''));
  if (!ct.sel || ct.sel.e >= n || ct.sel.i >= ape) ct.sel = { e: 0, i: 0 };
  let run = 0, filled = 0;
  $('#ct-grid').innerHTML = ct.ends.map((end, e) => {
    const sub = end.reduce((s, v) => s + (v ? scoreOf(v) : 0), 0);
    run += sub; filled += end.filter(Boolean).length;
    return `<div class="ct-end"><span class="ct-lbl">V${e + 1}</span>${end.map((v, i) =>
      `<button class="ct-cell ${v ? zoneClass(v) : ''}" data-action="ct-cell" data-e="${e}" data-i="${i}" aria-pressed="${ct.sel.e === e && ct.sel.i === i}" aria-label="Volée ${e + 1}, flèche ${i + 1}">${v || '·'}</button>`).join('')}<span class="ct-sub">${sub} <small>(${run})</small></span></div>`;
  }).join('');
  $('#ct-sum').textContent = `Total : ${run} / ${ape * n * 10} · ${filled}/${ape * n} flèches`;
  const el = $('#ct-grid [aria-pressed="true"]');
  if (el) el.scrollIntoView({ block: 'nearest' });
}

function ctKey(v) {
  if (ct.mode !== 'arrows' || !ct.sel || !ct.ends[ct.sel.e]) return;
  const { e, i } = ct.sel;
  ct.ends[e][i] = v;
  if (v) {
    buzz(10);
    let ne = e, ni = i + 1;
    if (ni >= ctApe()) { ne++; ni = 0; }
    if (ne < ct.ends.length) ct.sel = { e: ne, i: ni };
  }
  ctRenderGrid();
}

function ctSave() {
  const day = $('#ct-date').value;
  if (!day) return toast('Choisissez la date du concours.', 'error');
  const dist = $('#ct-distance').value === 'Custom' ? $('#ct-custom').value.trim() : $('#ct-distance').value;
  if (!dist) return toast('Indiquez la distance.', 'error');
  const ape = ctApe(), nb = ctNb(), name = $('#ct-name').value.trim().slice(0, 60);
  const arrowsTotal = ape * nb;
  let manual = null, ends = null;
  if (ct.mode === 'total') {
    const total = parseInt($('#ct-total').value, 10), tens = parseInt($('#ct-tens').value, 10) || 0, xs = parseInt($('#ct-xs').value, 10) || 0;
    if (!Number.isFinite(total) || total < 0 || total > arrowsTotal * 10) return toast(`Le score doit être entre 0 et ${arrowsTotal * 10}.`, 'error');
    if (tens < 0 || tens > arrowsTotal || xs < 0 || xs > tens) return toast('Vérifiez le nombre de 10 (et de X, qui sont compris dans les 10).', 'error');
    manual = { total, tens, xs };
  } else {
    const missing = ct.ends.flat().filter(v => !v).length;
    if (missing) return toast(`Il reste ${missing} flèche${missing > 1 ? 's' : ''} à saisir.`, 'error');
    ends = ct.ends.map(end => end.map(v => ({ valStr: v, scoreVal: scoreOf(v), x: null, y: null })));
  }
  const old = ct.editId ? app.sessions.find(x => x.id === ct.editId) : null;
  const s = old ? JSON.parse(JSON.stringify(old)) : {};
  const pr = store.get(KEYS.profile, {});
  s.id = s.id || 'session_' + Date.now();
  s.date = new Date(day + 'T12:00:00').toISOString();
  if (!old) { s.archer = pr.name || ''; s.bow = pr.bow || ''; s.bowType = pr.type || ''; }
  s.config = Object.assign({}, s.config, { distance: dist, targetType: $('#ct-target').value, arrowsPerEnd: ape, totalEnds: nb });
  delete s.config.trialEnds; delete s.config.trackNums; delete s.trial; delete s.endedEarly;
  s.currentEndIndex = nb;
  s.finished = true;
  s.contest = { name };
  if (manual) { s.manual = manual; s.ends = []; } else { delete s.manual; s.ends = ends; }
  const list = store.get(KEYS.contests, []);
  if (!list.some(c => c.date === day)) { list.push({ id: 'c' + Date.now(), date: day, name }); store.set(KEYS.contests, list); }
  archive(s);
  copySave('concours');
  $('#dlg-contest').close();
  switchTab('history');
  toast('Concours enregistré.');
}

document.addEventListener('change', ev => {
  if (!$('#dlg-contest').open) return;
  const id = ev.target.id;
  if (id === 'ct-distance') $('#ct-custom-wrap').hidden = ev.target.value !== 'Custom';
  if (id === 'ct-ape' || id === 'ct-ends' || id === 'ct-target') { ctKeysState(); if (ct.mode === 'arrows') ctRenderGrid(); }
});
