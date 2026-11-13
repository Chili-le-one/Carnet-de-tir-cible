/* Carnet de Tir Cible — saisie des flèches, cible tactile, affichage de la page Saisie, modification d'une flèche, nouvelle séance, saisie rapide.
   Script classique : partage ses variables avec les autres fichiers de js/ (voir l'ordre dans index.html). */
'use strict';

/* ---------- Numéro de flèche ---------- */
/* Nombre de flèches numérotées : celui de la fiche de réglage, sinon 6 (ou plus si la volée est plus longue). */
const quiverSize = s => Math.max(1, Math.min(24, +(s.setup && s.setup.quiver) || Math.max(6, s.config.arrowsPerEnd)));
/* Numéro proposé pour la prochaine flèche : il avance tout seul (1, 2, 3…, puis retour à 1) et se corrige d'un toucher. */
/* Flèches du jour : numéros réellement utilisés (ex. 4, 8, 10). La liste est gardée dans la séance (config.arrowNums)
   et mémorisée pour la séance suivante. Sans liste : tous les numéros de 1 à quiverSize. */
const NUMS_KEY = 'carnet_tir_flechesjour';
function numList(s) {
  const c = s.config;
  if (!Array.isArray(c.arrowNums) && !s.finished) {
    const saved = store.get(NUMS_KEY, null);
    const ok = Array.isArray(saved) ? [...new Set(saved.map(Number))].filter(n => Number.isInteger(n) && n >= 1 && n <= 24).sort((p, q) => p - q) : [];
    if (ok.length) c.arrowNums = ok;
  }
  if (Array.isArray(c.arrowNums) && c.arrowNums.length) return c.arrowNums;
  return Array.from({ length: quiverSize(s) }, (_, i) => i + 1);
}
/* Numéro qui suit n dans la liste (retour au premier après le dernier). */
const nextInList = (s, n) => { const l = numList(s); return l.find(k => k > n) || l[0]; };
function currentNum(s) {
  const list = numList(s);
  if (app.numFor !== s.id) {
    let last = 0;
    [...(s.trial || []), ...s.ends].forEach(e => (e || []).forEach(a => { if (a.n) last = a.n; }));
    app.nextNum = last ? nextInList(s, last) : list[0];
    app.numFor = s.id;
  }
  if (!list.includes(app.nextNum)) app.nextNum = list.find(k => k >= app.nextNum) || list[0];
  return app.nextNum;
}
function pickNum(n) {
  const s = app.session;
  if (!s || !s.config.trackNums) return;
  app.nextNum = Math.max(1, Math.min(24, n));
  app.numFor = s.id;
  renderNumRow();
}
/* Fenêtre « Mes flèches du jour » (réutilise la fenêtre de modification #dlg-edit). */
function numsCfgRender() {
  const s = app.session, box = $('#nums-cfg');
  if (!s || !box) return;
  const on = new Set(numList(s));
  box.innerHTML = Array.from({ length: app.numsMax || 12 }, (_, i) => i + 1).map(n =>
    `<button class="numb${on.has(n) ? ' on' : ''}" data-action="num-tog" data-n="${n}" aria-pressed="${on.has(n)}">${n}</button>`).join('');
}
function numsCfgOpen() {
  const s = app.session;
  if (!s || !s.config.trackNums) return;
  app.numsMax = Math.min(24, Math.max(quiverSize(s), 12, ...numList(s)));
  $('#edit-body').innerHTML = `
    <div class="row between">
      <h2 id="edit-title">Mes flèches du jour</h2>
      <button class="btn sm icon-only" data-action="close" data-target="dlg-edit" aria-label="Fermer">${icon('x')}</button>
    </div>
    <p class="muted" style="margin:0;font-size:13px">Touchez les numéros des flèches que vous tirez aujourd'hui : seuls ceux-là seront proposés.</p>
    <div class="numrow" id="nums-cfg"></div>
    <div class="row"><button class="btn" data-action="num-all">Toutes (1 à ${app.numsMax})</button></div>`;
  numsCfgRender();
  const dlg = $('#dlg-edit');
  if (!dlg.open) dlg.showModal();
}
function numsSet(s, arr) {
  s.config.arrowNums = [...new Set(arr)].sort((p, q) => p - q);
  store.set(NUMS_KEY, s.config.arrowNums);
  persist();
  numsCfgRender();
  renderNumRow();
}
function numsToggle(n) {
  const s = app.session;
  if (!s) return;
  const cur = new Set(numList(s));
  if (cur.has(n)) { if (cur.size <= 1) { toast('Gardez au moins une flèche.'); return; } cur.delete(n); } else cur.add(n);
  numsSet(s, [...cur]);
}
function numsAll() {
  const s = app.session;
  if (s) numsSet(s, Array.from({ length: app.numsMax || 12 }, (_, i) => i + 1));
}
/* Écouteur propre à ces boutons (phase de capture : les autres écouteurs ne les voient pas). */
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-action="num-cfg"],[data-action="num-tog"],[data-action="num-all"]');
  if (!b) return;
  ev.preventDefault(); ev.stopImmediatePropagation();
  const a = b.dataset.action;
  if (a === 'num-cfg') numsCfgOpen(); else if (a === 'num-tog') numsToggle(+b.dataset.n); else numsAll();
}, true);
function renderNumRow() {
  const s = app.session, row = $('#num-row');
  const on = !!(s && s.config.trackNums && !s.finished);
  row.hidden = !on;
  if (!on) return;
  const cur = currentNum(s);
  $('#num-btns').innerHTML = numList(s).map(n =>
    `<button class="numb${n === cur ? ' on' : ''}" data-action="num-pick" data-n="${n}" aria-pressed="${n === cur}" aria-label="Flèche numéro ${n}">${n}</button>`).join('') +
    `<button class="numb cfg" data-action="num-cfg" aria-label="Choisir mes flèches du jour">Mes flèches</button>`;
}

/* ---------- Saisie des flèches ---------- */
function addArrow(v, x = null, y = null) {
  const s = app.session;
  if (!s || s.finished) return;
  const f = face(s.config);
  if (f.tri && v !== 'M' && rank(v) < f.minRing) return;
  const idx = s.currentEndIndex;
  const end = ensureEnd(s, idx);
  const max = s.config.arrowsPerEnd;
  if (end.length >= max) return;

  const a = { valStr: v, scoreVal: scoreOf(v), x, y };
  if (s.config.trackNums) { a.n = currentNum(s); app.nextNum = nextInList(s, a.n); }
  end.push(a);
  app.pending = null;
  buzz(12);

  if (end.length >= max) {
    if (idx >= allEnds(s) - 1) {
      finishSession(false);
      return;
    }
    s.currentEndIndex++;
    buzz([20, 40, 20]);
    if (isTrialIdx(s, idx)) toast(`${endLabel(s, idx)} : ${sumScore(end)} points (non comptés)${idx === trialN(s) - 1 ? ' · la séance commence' : ''}`);
    else toast(`${endLabel(s, idx)} : ${sumScore(end)} points`);
  }
  persist();
  renderShoot();
}

async function undo() {
  const s = app.session;
  if (!s) return;
  if (s.finished && !(await reopen())) return;
  let end = getEnd(s, s.currentEndIndex);
  if (!end || !end.length) {
    if (s.currentEndIndex === 0) { toast('Aucune flèche à annuler.'); return; }
    s.currentEndIndex--;
    end = getEnd(s, s.currentEndIndex);
  }
  if (!end || !end.length) { persist(); renderShoot(); return; }
  const gone = end.pop();
  if (gone && gone.n) { app.nextNum = gone.n; app.numFor = s.id; }   // le numéro annulé redevient le prochain
  app.pending = null;
  persist();
  renderShoot();
}

async function clearEnd() {
  const s = app.session;
  if (!s || s.finished) return;
  const end = getEnd(s, s.currentEndIndex);
  if (!end || !end.length) return;
  if (end.length > 1 && !(await askConfirm(isTrialIdx(s, s.currentEndIndex) ? "Effacer toutes les flèches de cet essai ?" : 'Effacer toutes les flèches de cette volée ?', 'Effacer'))) return;
  const first = end.find(a => a.n);
  if (first) { app.nextNum = first.n; app.numFor = s.id; }
  setEnd(s, s.currentEndIndex, []);
  app.pending = null;
  persist();
  renderShoot();
}

function finishSession(early) {
  const s = app.session;
  s.finished = true;
  if (early) s.endedEarly = true; else delete s.endedEarly;
  archive(s);
  store.del(KEYS.unfinished);
  if (getPrefs().autoDl && !IS_IOS) autoDownload();
  copySave('fin de séance');
  app.pending = null;
  renderShoot();
  buzz([30, 60, 30]);
  if (s.quick) endNotesOpen(s); else openSummary(s, true);
}

async function finishEarly() {
  const s = app.session;
  if (!s || s.finished) return;
  const st = sessionStats(s);
  if (st.count === 0) {
    if (await askConfirm('Aucune flèche saisie. Abandonner cette séance ?', 'Abandonner')) {
      store.del(KEYS.unfinished);
      setSession(null);
      showSetup();
    }
    return;
  }
  if (!(await askConfirm(`Terminer la séance maintenant (${st.count}/${st.planned} flèches) et l'enregistrer dans l'historique ?`, 'Terminer'))) return;
  finishSession(true);
}

async function reopen() {
  const s = app.session;
  if (!s || !s.finished) return false;
  if (!(await askConfirm("Rouvrir cette séance pour corriger la saisie ? Elle sera retirée de l'historique jusqu'à ce que vous la terminiez à nouveau.", 'Rouvrir'))) return false;
  const u = loadUnfinished();
  if (u && u.id !== s.id && sessionStats(u).count > 0 && !(await askConfirm('Une autre séance est en cours : elle sera remplacée. Continuer ?', 'Remplacer'))) return false;
  app.sessions = app.sessions.filter(x => x.id !== s.id);
  saveSessions();
  s.finished = false;
  delete s.endedEarly;
  let last = 0;
  (s.trial || []).forEach((e, i) => { if (e && e.length) last = Math.max(last, i); });
  s.ends.forEach((e, i) => { if (e && e.length) last = Math.max(last, i + trialN(s)); });
  s.currentEndIndex = last;
  persist();
  renderShoot();
  return true;
}

/* ---------- Saisie sur cible (placer, ajuster, valider) ---------- */
function setPending(x, y, finger = null) {
  app.pending = { x, y, finger };
  renderPending();
}
function confirmPending() {
  const p = app.pending, s = app.session;
  app.pending = null;
  if (!p || !s || s.finished) { renderPending(); return; }
  const f = face(s.config);
  addArrow(zoneAt(p.x, p.y, f), Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10);
  renderPending();
}
function lastArrowOf(s) {
  for (let i = Math.min(s.currentEndIndex, allEnds(s) - 1); i >= 0; i--) {
    const e = getEnd(s, i);
    if (e && e.length) return e[e.length - 1];
  }
  return null;
}
/* Au toucher, le viseur est placé ~60 px AU-DESSUS du doigt pour rester visible.
   Il suffit de glisser : le viseur suit le doigt avec ce même décalage. */
const FINGER_OFFSET_PX = 60;
function pointerToSvg(e, svg = $('#svg-target')) {
  const ctm = svg.getScreenCTM();
  const pt = svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  const finger = pt.matrixTransform(ctm.inverse());
  const dy = e.pointerType === 'mouse' ? 0 : FINGER_OFFSET_PX / ctm.a;
  const lim = face(app.session.config).extent * 1.1;
  const clamp = v => Math.max(-lim, Math.min(lim, v));
  return { x: clamp(finger.x), y: clamp(finger.y - dy), fx: finger.x, fy: finger.y, touch: dy > 0 };
}

/* ---------- Rendu : onglet Saisie ---------- */
function renderShoot() {
  const s = app.session;
  $('#shoot-empty').hidden = !!s;
  $('#shoot-main').hidden = !s;
  if (!s) { updateWakeLock(); timerRender(); applyQuick(); return; }

  const c = s.config, st = sessionStats(s), f = face(c);
  const T = trialN(s), idx = Math.min(s.currentEndIndex, allEnds(s) - 1), inTrial = idx < T;

  $('#chip-dist').textContent = c.distance;
  $('#chip-target').textContent = targetLabel(c.targetType);
  $('#chip-ends').textContent = `${allEnds(s) - T} volées × ${c.arrowsPerEnd}`;
  $('#btn-finish').hidden = !!s.finished;
  $('#s-total').textContent = st.total;
  $('#s-max').textContent = `/ ${st.max} pts`;
  const refN = refArrows(), pj = $('#s-proj');
  pj.hidden = !(st.count && st.count !== refN);
  if (!pj.hidden) pj.textContent = `Projection sur ${refN} flèches : ${projectedScore(s)} pts`;
  $('#s-end').textContent = s.finished ? 'Fin' : inTrial ? `Essai ${idx + 1}/${T}` : `${idx - T + 1}/${c.totalEnds}`;
  $('#s-avg').textContent = st.count ? st.avg.toFixed(1) : '–';
  $('#s-tens').textContent = st.tens;
  $('#s-x').textContent = st.xs;
  $('#s-bar').style.width = Math.min(100, st.count / st.planned * 100) + '%';

  // Volée en cours
  const cur = getEnd(s, idx) || [];
  $('#end-card').hidden = !!s.finished;
  $('#end-lbl').textContent = inTrial ? 'Essai' : 'Volée';
  $('#end-no').textContent = inTrial ? idx + 1 : idx - T + 1;
  $('#end-trial').hidden = !inTrial;
  $('#end-sum').textContent = sumScore(cur);
  let slots = '';
  for (let i = 0; i < c.arrowsPerEnd; i++) {
    const a = cur[i];
    slots += a
      ? `<button class="slot ${zoneClass(a.valStr)}" data-action="edit-arrow" data-e="${idx}" data-i="${i}" aria-label="Modifier la flèche ${i + 1}">${a.valStr}${a.n ? `<i class="sn">${a.n}</i>` : ''}</button>`
      : `<span class="slot empty${i === cur.length ? ' next' : ''}">${i + 1}</span>`;
  }
  $('#slots').innerHTML = slots;
  renderNumRow();

  // Panneaux de saisie
  const done = !!s.finished;
  $('#seg').hidden = done;
  $('#panel-keys').hidden = done || app.mode !== 'keys';
  $('#panel-target').hidden = done || app.mode !== 'target';
  $('#panel-done').hidden = !done;
  $$('#seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === app.mode)));
  $$('#panel-keys .key').forEach(k => { k.disabled = f.tri && k.dataset.v !== 'M' && rank(k.dataset.v) < f.minRing; });

  if (done) {
    $('#done-text').textContent = s.endedEarly
      ? `${st.total} points en ${st.count} flèches (terminée avant la fin : ${st.count}/${st.planned}).`
      : `${st.total} points sur ${st.max} en ${st.count} flèches.`;
  }

  // Feuille de marque
  let html = '', cumul = 0;
  const chipsOf = (end, g) => end.map((a, i) => ({ a, i })).sort((p, q) => rank(q.a.valStr) - rank(p.a.valStr))
    .map(({ a, i }) => `<button class="sc ${zoneClass(a.valStr)}" data-action="edit-arrow" data-e="${g}" data-i="${i}" aria-label="Modifier la flèche ${i + 1} de ${endLabel(s, g).toLowerCase()}">${a.valStr}</button>`).join('');
  for (let g = 0; g < T; g++) {   // volées d'essai : grisées, jamais dans le cumul
    const end = getEnd(s, g) || [], isCur = !s.finished && g === idx;
    html += `<tr class="trial${isCur ? ' cur' : ''}"${isCur ? ' aria-current="true"' : ''}><td title="Essai ${g + 1}">E${g + 1}</td><td>${chipsOf(end, g) || '<span class="muted">–</span>'}</td><td>${end.length ? sumScore(end) : ''}</td><td>${end.length ? '–' : ''}</td></tr>`;
  }
  for (let e = 0; e < c.totalEnds; e++) {
    const end = s.ends[e] || [];
    const sum = sumScore(end);
    cumul += sum;
    const chips = chipsOf(end, e + T);
    const isCur = !s.finished && e + T === idx;
    html += `<tr class="${isCur ? 'cur' : ''}"${isCur ? ' aria-current="true"' : ''}><td>${e + 1}</td><td>${chips || '<span class="muted">–</span>'}</td><td>${end.length ? sum : ''}</td><td>${end.length ? cumul : ''}</td></tr>`;
  }
  $('#scorecard').innerHTML = html;

  // Cible
  const svg = $('#svg-target');
  if (svg.dataset.face !== (f.tri ? 'tri' : 'std')) drawFace(svg, f);
  renderImpactLayer();
  renderPending();
  renderNotes();
  updateWakeLock();
  timerRender();
  applyQuick();
}

function renderImpactLayer() {
  const s = app.session;
  const layer = $('#svg-target [data-layer=impacts]');
  if (!s || !layer) return;
  let h = '';
  for (let g = 0; g < allEnds(s); g++) {
    const cur = g === s.currentEndIndex && !s.finished;
    if (isTrialIdx(s, g) && !cur) continue;      // les essais passés n'encombrent pas la cible
    (getEnd(s, g) || []).forEach((a, j) => {
      if (a.x == null || a.y == null) return;
      h += cur ? dot(a.x, a.y, { n: j + 1 }) : dot(a.x, a.y, { r: 2.2, fill: '#111', stroke: '#fff', op: .45 });
    });
  }
  layer.innerHTML = h;
}

function renderPending() {
  const layer = $('#svg-target [data-layer=extra]');
  const info = $('#pending-info'), btn = $('#btn-undo-target');
  if (!layer || !app.session) return;
  const sess = app.session, p = app.pending;
  btn.disabled = !!sess.finished || arrowCount(sess) === 0;
  if (!p) {
    layer.innerHTML = '';
    const last = lastArrowOf(sess);
    if (last) {
      info.className = '';
      info.innerHTML = `Dernière flèche <span class="zonebadge ${zoneClass(last.valStr)}">${last.valStr}</span>`;
    } else {
      info.className = 'muted';
      info.textContent = 'Posez le doigt, glissez pour viser, relâchez pour valider.';
    }
    return;
  }
  const fc = face(sess.config), z = zoneAt(p.x, p.y, fc);
  const onLine = fc.arrowU > 0 && z !== zoneAt(p.x, p.y, Object.assign({}, fc, { arrowU: 0 }));
  const x = p.x.toFixed(1), y = p.y.toFixed(1);
  const guide = p.finger
    ? `<line x1="${x}" y1="${y}" x2="${p.finger.x.toFixed(1)}" y2="${p.finger.y.toFixed(1)}" stroke="#111" stroke-width=".7" stroke-dasharray="1.5 1.5" opacity=".6"/>` +
      `<circle cx="${p.finger.x.toFixed(1)}" cy="${p.finger.y.toFixed(1)}" r="2" fill="#111" opacity=".35"/>` : '';
  layer.innerHTML = guide +
    `<circle cx="${x}" cy="${y}" r="4.5" fill="none" stroke="#fff" stroke-width="2.4"/>` +
    `<circle cx="${x}" cy="${y}" r="4.5" fill="none" stroke="#111" stroke-width="1" stroke-dasharray="2 1.5"/>` +
    `<path d="M${x - 9} ${y}H${+x + 9}M${x} ${y - 9}V${+y + 9}" stroke="#fff" stroke-width="2.2"/>` +
    `<path d="M${x - 9} ${y}H${+x + 9}M${x} ${y - 9}V${+y + 9}" stroke="#111" stroke-width=".8"/>`;
  info.className = '';
  info.innerHTML = `Zone <span class="zonebadge ${zoneClass(z)}">${z}</span> <span class="pi-hint"${onLine ? ` title="Flèche de ${String(sess.config.arrowMm).replace('.', ',')} mm : la ligne compte pour la zone supérieure"` : ''}>${onLine ? 'sur la ligne · relâchez' : 'relâchez pour valider'}</span>`;
}

/* ---------- Modifier une flèche déjà saisie ---------- */
function openEdit(e, i) {
  const s = app.session;
  const a = s && (getEnd(s, e) || [])[i];
  if (!a) return;
  app.edit = { e, i, pos: null };
  const f = face(s.config);
  const keys = ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'].map(v => {
    const dis = f.tri && v !== 'M' && rank(v) < f.minRing;
    const sub = v === 'X' ? '<small>10 int.</small>' : v === 'M' ? '<small>manqué</small>' : '';
    return `<button class="key ${zoneClass(v)}" data-action="edit-set" data-v="${v}"${dis ? ' disabled' : ''}>${v}${sub}</button>`;
  }).join('');
  $('#edit-body').innerHTML = `
    <div class="row between">
      <h2 id="edit-title">${endLabel(s, e)} · flèche ${i + 1}</h2>
      <button class="btn sm icon-only" data-action="close" data-target="dlg-edit" aria-label="Fermer">${icon('x')}</button>
    </div>
    <p style="margin:0">Valeur actuelle <span class="zonebadge ${zoneClass(a.valStr)}">${a.valStr}</span></p>
    <div class="keypad">${keys}</div>
    ${s.config.trackNums ? `<div class="lbl">N° de la flèche<div class="numrow" id="edit-nums">${[...new Set([...numList(s), ...(a.n ? [a.n] : [])])].sort((p, q) => p - q).map(k => `<button class="numb${a.n === k ? ' on' : ''}" data-action="edit-num" data-n="${k}" aria-pressed="${a.n === k}">${k}</button>`).join('')}</div></div>` : ''}
    ${a.x != null ? '<p class="muted" style="margin:0;font-size:13px">Si la nouvelle valeur ne correspond plus à la position de l\'impact, cette position est retirée.</p>' : ''}
    <details>
      <summary class="btn">Replacer sur la cible</summary>
      <div class="target-wrap" style="margin-top:12px"><svg id="svg-edit" class="map" style="touch-action:none" role="img" aria-label="Cible : touchez pour replacer l'impact"></svg></div>
      <p class="muted" style="margin:8px 0 0;font-size:13px">Posez le doigt, glissez, relâchez pour valider.</p>
    </details>`;

  const svg = $('#svg-edit');
  drawFace(svg, f);
  if (a.x != null) svg.querySelector('[data-layer=impacts]').innerHTML = dot(a.x, a.y, { r: 2.6, fill: '#111', stroke: '#fff', op: .6 });
  let drag = false;
  const move = ev => {
    const p = pointerToSvg(ev, svg);
    app.edit.pos = { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 };
    const x = p.x.toFixed(1), y = p.y.toFixed(1);
    svg.querySelector('[data-layer=extra]').innerHTML =
      `<circle cx="${x}" cy="${y}" r="4.5" fill="none" stroke="#fff" stroke-width="2.4"/>` +
      `<circle cx="${x}" cy="${y}" r="4.5" fill="none" stroke="#111" stroke-width="1" stroke-dasharray="2 1.5"/>`;
  };
  svg.addEventListener('pointerdown', ev => { ev.preventDefault(); drag = true; try { svg.setPointerCapture(ev.pointerId); } catch (err) {} move(ev); });
  svg.addEventListener('pointermove', ev => { if (drag) move(ev); });
  svg.addEventListener('pointerup', () => {
    if (!drag || !app.edit.pos) return;
    drag = false;
    const { x, y } = app.edit.pos;
    applyEdit(zoneAt(x, y, f), x, y);
  });
  svg.addEventListener('pointercancel', () => { drag = false; });
  $('#dlg-edit').showModal();
}
function applyEdit(v, x, y) {
  const s = app.session, ed = app.edit;
  const a = s && ed && (getEnd(s, ed.e) || [])[ed.i];
  if (!a) return;
  a.valStr = v;
  a.scoreVal = scoreOf(v);
  if (x !== undefined) { a.x = x; a.y = y; }
  else if (a.x != null && zoneAt(a.x, a.y, face(s.config)) !== v) { a.x = null; a.y = null; }
  if (s.finished) archive(s); else persist();
  $('#dlg-edit').close();
  renderShoot();
  toast(`Flèche modifiée : ${v}`);
}

function editNum(n) {
  const s = app.session, ed = app.edit;
  const a = s && ed && (getEnd(s, ed.e) || [])[ed.i];
  if (!a) return;
  a.n = a.n === n ? undefined : n;
  if (a.n === undefined) delete a.n;
  if (s.finished) archive(s); else persist();
  $$('#edit-nums .numb').forEach(b => { const on = +b.dataset.n === a.n; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  renderShoot();
}

/* ---------- Nouvelle séance ---------- */
/* Modèles de séance : les quatre formats de départ + ceux que l'archer enregistre. */
const getTemplates = () => {
  const t = store.get(KEYS.templates, null);
  return Array.isArray(t) ? t : PRESETS.map((p, i) => ({ id: 'p' + (i + 1), name: p.label, distance: p.distance, target: p.target, ape: p.ape, ends: p.ends }));
};
const tplInfo = t => `${esc(t.distance)} · ${esc(targetLabel(t.target))} · ${t.ends}×${t.ape} flèches${t.trial > 0 ? ` · ${t.trial} essai${t.trial > 1 ? 's' : ''}` : ''}${t.nums ? ' · n° de flèche' : ''}${t.sight === 'no' ? ' · sans viseur' : ''}${t.goal ? ` · objectif ${t.goal}` : ''}${t.quick ? ' · saisie rapide' : ''}`;
const saveTemplates = list => store.set(KEYS.templates, list);
const templateCfg = id => {
  const t = getTemplates().find(x => x.id === id);
  return t ? { distance: t.distance, target: t.target, ape: t.ape, ends: t.ends, sight: t.sight || store.get(KEYS.cfg, {}).sight || 'yes', goal: t.goal || 0, quick: !!t.quick, trial: t.trial || 0, nums: !!t.nums } : null;
};
function renderPresets() {
  const list = getTemplates();
  $('#presets').innerHTML = list.length
    ? list.map(t => `<button class="preset" data-action="tpl-start" data-id="${esc(t.id)}">${esc(t.name)}</button>`).join('')
    : '<span class="muted" style="font-size:13px">Aucun modèle : réglez une séance puis « Enregistrer comme modèle ».</span>';
}
function tplSave() {
  const name = $('#tpl-name').value.trim().slice(0, 30);
  if (!name) { toast('Donnez un nom au modèle.'); return; }
  const c = readSetup(), list = getTemplates();
  const item = { id: 'm' + Date.now(), name, distance: c.distance, target: c.target, ape: c.ape, ends: c.ends, sight: c.sight, goal: c.goal, quick: c.quick, trial: c.trial, nums: c.nums };
  const i = list.findIndex(x => x.name.toLowerCase() === name.toLowerCase());
  if (i >= 0) { item.id = list[i].id; list[i] = item; } else list.push(item);
  saveTemplates(list);
  $('#tpl-name').value = '';
  renderPresets(); renderTemplates();
  toast('Modèle enregistré.');
}
function tplMove(id, dir) {
  const list = getTemplates(), i = list.findIndex(x => x.id === id), k = i + dir;
  if (i < 0 || k < 0 || k >= list.length) return;
  [list[i], list[k]] = [list[k], list[i]];
  saveTemplates(list); renderPresets(); renderTemplates();
}
function tplDel(id) { saveTemplates(getTemplates().filter(x => x.id !== id)); renderPresets(); renderTemplates(); toast('Modèle supprimé.'); }
function tplReset() { store.del(KEYS.templates); renderPresets(); renderTemplates(); toast('Modèles de départ rétablis.'); }
function renderTemplates() {
  const box = $('#tpl-list');
  if (!box) return;
  const list = getTemplates();
  box.innerHTML = list.length ? list.map(t => `<div class="rec"><div><b>${esc(t.name)}</b><div class="muted" style="font-size:13px">${tplInfo(t)}</div></div>
      <div class="row"><button class="btn sm icon-only" data-action="tpl-up" data-id="${esc(t.id)}" aria-label="Monter">↑</button><button class="btn sm icon-only" data-action="tpl-down" data-id="${esc(t.id)}" aria-label="Descendre">↓</button><button class="btn sm icon-only danger" data-action="tpl-del" data-id="${esc(t.id)}" aria-label="Supprimer">${icon('trash')}</button></div></div>`).join('')
    : '<p class="muted" style="margin:6px 0 0;font-size:13px">Aucun modèle pour l\'instant.</p>';
}

/* ---------- Saisie rapide : écran réduit pendant le tir, notes à la fin ---------- */
function applyQuick() {
  const s = app.session, on = !!(s && s.quick && !s.finished && !app.reorder);
  $('#shoot-main').classList.toggle('quick', on);
  document.body.classList.toggle('quick-on', on && app.tab === 'shoot');
  const b = $('#btn-quick');
  b.hidden = !s || !!s.finished;
  b.textContent = s && s.quick ? 'Vue complète' : 'Saisie rapide';
}
function quickToggle() {
  const s = app.session;
  if (!s || s.finished) return;
  if (s.quick) delete s.quick; else s.quick = true;
  persist(); renderShoot();
}
let endNotesFeel = 0;
function endNotesOpen(s) {
  app.endNotesFor = s;
  const n = s.notes || {};
  $('#en-weather').value = n.weather || '';
  $('#en-real').value = n.real || '';
  $('#en-text').value = n.text || '';
  endNotesFeel = n.feel || 0;
  $$('#en-feel button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.v === endNotesFeel)));
  $('#dlg-endnotes').showModal();
}
function endNotesClose(save) {
  const s = app.endNotesFor;
  app.endNotesFor = null;
  if (s && save) {
    s.notes = { weather: $('#en-weather').value, real: $('#en-real').value.trim(), feel: endNotesFeel, text: $('#en-text').value };
    archive(s);
  }
  $('#dlg-endnotes').close();
  if (s) openSummary(s, true);
}

function fillSetup(cfg) {
  const sel = $('#cfg-distance');
  const known = $$('option', sel).some(o => o.value === cfg.distance && o.value !== 'Custom');
  sel.value = known ? cfg.distance : 'Custom';
  $('#cfg-custom').value = known ? '' : (cfg.distance === 'Perso' ? '' : cfg.distance);
  $('#cfg-custom-wrap').hidden = known;
  $('#cfg-target').value = cfg.target;
  $('#cfg-ape').value = String(cfg.ape);
  $('#cfg-ends').value = cfg.ends;
  if (cfg.sight) $('#cfg-sight').value = cfg.sight;   // les modèles gardent le choix du viseur
  if ('goal' in cfg) $('#cfg-goal').value = cfg.goal || '';
  if ('quick' in cfg) $('#cfg-quick').checked = !!cfg.quick;
  $('#cfg-trial').value = cfg.trial > 0 ? cfg.trial : 0;
  $('#cfg-nums').checked = !!cfg.nums;
}
function readSetup() {
  let distance = $('#cfg-distance').value;
  if (distance === 'Custom') {
    distance = $('#cfg-custom').value.trim() || 'Perso';
    if (/^\d+([.,]\d+)?$/.test(distance)) distance += 'm';
    distance = distance.replace(/\s+/g, '').slice(0, 12);
  }
  const ends = Math.max(1, Math.min(60, parseInt($('#cfg-ends').value, 10) || 10));
  return { distance, target: $('#cfg-target').value, ape: parseInt($('#cfg-ape').value, 10), ends, sight: $('#cfg-sight').value, goal: Math.max(0, parseInt($('#cfg-goal').value, 10) || 0), quick: $('#cfg-quick').checked,
    trial: Math.max(0, Math.min(10, parseInt($('#cfg-trial').value, 10) || 0)), nums: $('#cfg-nums').checked, sheet: $('#cfg-sheet').value };
}
function showSetup() {
  fillSetup(store.get(KEYS.cfg, { distance: '18m', target: '40', ape: 3, ends: 10, sight: 'yes' }));
  renderSheetSelect();
  const pr = store.get(KEYS.profile, {});
  const who = [pr.name, [pr.bow, pr.type].filter(Boolean).join(' · ')].filter(Boolean).join(' — ');
  const pl = $('#setup-profile');
  pl.hidden = !who;
  pl.textContent = who ? `Archer : ${who} (modifiable dans Réglages)` : '';
  const u = loadUnfinished();
  const box = $('#resume-box');
  if (u && sessionStats(u).count > 0) {
    const st = sessionStats(u);
    $('#resume-info').textContent = `${u.config.distance} · ${targetLabel(u.config.targetType)} · ${st.count}/${st.planned} flèches · ${st.total} pts`;
    box.hidden = false;
  } else {
    box.hidden = true;
  }
  const dlg = $('#dlg-setup');
  if (!dlg.open) dlg.showModal();
}
async function startSession(cfgOverride) {
  const cfg = cfgOverride || readSetup();
  const u = loadUnfinished();
  if (u) {
    const st = sessionStats(u);
    if (st.count > 0 && !(await askConfirm(`Une séance est en cours (${st.count} flèches). Démarrer une nouvelle séance l'abandonnera. Continuer ?`, 'Abandonner et démarrer'))) return;
  }
  store.set(KEYS.cfg, Object.assign({}, cfg, { goal: 0 }));   // l'objectif ne se reporte pas d'une séance à l'autre
  const s = createSession(cfg);
  store.set(KEYS.unfinished, s);
  setSession(s);
  $('#dlg-setup').close();
  switchTab('shoot');
}
function resumeSession() {
  const u = loadUnfinished();
  if (!u) return;
  setSession(u);
  $('#dlg-setup').close();
  switchTab('shoot');
}
