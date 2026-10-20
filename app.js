(() => {
'use strict';

/* =====================================================================
   Carnet de Tir Cible — application autonome (aucune dépendance externe)
   Les clés de stockage sont celles de l'ancienne version : vos séances
   existantes restent disponibles.
   ===================================================================== */

/* Traduction : t() vient du module de langue (chargé avant ce script). */
const t = window.t || (s => s);

const KEYS = {
  sessions: 'archery_app_sessions_v3',
  unfinished: 'archery_app_unfinished_v3',
  cfg: 'carnet_tir_derniere_config',
  mode: 'carnet_tir_mode',
  profile: 'carnet_tir_profil',
  prefs: 'carnet_tir_prefs',
  goals: 'carnet_tir_objectifs',
  backup: 'carnet_tir_sauvegarde',
  sight: 'carnet_tir_viseur',
  gear: 'carnet_tir_materiel',
  order: 'carnet_tir_ordre'
};

const PRESETS = [
  { label: 'Salle 2×30 flèches',   distance: '18m', target: '40',  ape: 3, ends: 20 },
  { label: 'Entraînement 30 flèches', distance: '18m', target: '40', ape: 3, ends: 10 },
  { label: 'Trispot 18 m',          distance: '18m', target: 'Trispot', ape: 3, ends: 20 },
  { label: 'Extérieur 72 flèches',  distance: '70m', target: '120', ape: 6, ends: 12 }
];

/* ---------- Utilitaires ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

const store = {
  get(k, fb) { try { const v = localStorage.getItem(k); return v === null ? fb : JSON.parse(v); } catch (e) { return fb; } },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { toast('Enregistrement impossible : le stockage du navigateur est plein ou bloqué.', 'error'); return false; }
  },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};

/* Confirmation intégrée à la page : le confirm() natif est bloqué dans certaines
   visionneuses et applications, ce qui rendait des boutons « muets ». */
function askConfirm(msg, ok = 'Confirmer') {
  return new Promise(resolve => {
    const dlg = $('#dlg-confirm'), yes = $('#confirm-yes'), no = $('#confirm-no');
    let answer = false;
    $('#confirm-msg').textContent = msg;
    yes.textContent = ok;
    yes.onclick = () => { answer = true; dlg.close(); };
    no.onclick = () => dlg.close();
    dlg.onclose = () => { dlg.onclose = null; resolve(answer); };
    dlg.showModal();
  });
}

let toastTimer;
function toast(msg, kind) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'show' + (kind === 'error' ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = ''; }, 2800);
}

/* ---------- Icônes (SVG intégrés, fonctionne hors ligne) ---------- */
const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  download: '<path d="M12 3v12m0 0-4-4m4 4 4-4M4 20h16"/>',
  upload: '<path d="M12 15V3m0 0L8 7m4-4 4 4M4 20h16"/>',
  flag: '<path d="M5 21V4m0 0h12l-2 4 2 4H5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
};
const icon = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;
function hydrateIcons(root = document) {
  $$('[data-i]', root).forEach(el => { el.innerHTML = icon(el.dataset.i); el.removeAttribute('data-i'); });
}

/* ---------- Règles de score & géométrie de la cible ---------- */
const rank = v => v === 'X' ? 11 : v === 'M' ? 0 : parseInt(v, 10);
const scoreOf = v => v === 'X' ? 10 : v === 'M' ? 0 : parseInt(v, 10);
const sumScore = arrows => arrows.reduce((s, a) => s + a.scoreVal, 0);
const targetLabel = t => t === 'Trispot' ? 'Trispot 40 cm' : `Blason ${t} cm`;

function zoneClass(v) {
  const n = scoreOf(v);
  return n >= 9 ? 'z-gold' : n >= 7 ? 'z-red' : n >= 5 ? 'z-blue' : n >= 3 ? 'z-black' : n >= 1 ? 'z-white' : 'z-miss';
}

/* Un anneau = 10 unités SVG ; le 10 intérieur (X) = 5 unités.
   Le trispot ne comporte que les zones 10 à 5. */
function face(cfg) {
  const tri = cfg.targetType === 'Trispot';
  return { tri, minRing: tri ? 5 : 1, extent: tri ? 60 : 100, diam: tri ? 40 : (parseInt(cfg.targetType, 10) || 40) };
}
const cmPerUnit = cfg => face(cfg).diam / 200;

function zoneAt(x, y, f) {
  const r = Math.hypot(x, y);
  if (r <= 5) return 'X';
  if (r > f.extent) return 'M';
  const ring = 11 - Math.ceil(r / 10);
  return ring < f.minRing ? 'M' : String(ring);
}

const RING_FILL = { 1: '#f6f6f6', 2: '#f6f6f6', 3: '#1c1c1c', 4: '#1c1c1c', 5: '#00A4E4', 6: '#00A4E4', 7: '#EE334E', 8: '#EE334E', 9: '#FFD100', 10: '#FFD100' };
const RING_LINE = { 1: '#8b95a3', 2: '#8b95a3', 3: '#8a8a8a', 4: '#8a8a8a', 5: '#0073a3', 6: '#0073a3', 7: '#a8203a', 8: '#a8203a', 9: '#a88a00', 10: '#a88a00' };

function drawFace(svg, f) {
  const pad = f.extent + 4;
  svg.setAttribute('viewBox', `${-pad} ${-pad} ${pad * 2} ${pad * 2}`);
  let h = '';
  for (let k = f.minRing; k <= 10; k++) {
    h += `<circle r="${(11 - k) * 10}" fill="${RING_FILL[k]}" stroke="${RING_LINE[k]}" stroke-width=".5"/>`;
  }
  h += `<circle r="5" fill="none" stroke="${RING_LINE[10]}" stroke-width=".4"/>`;
  h += `<path d="M-3 0H3M0 -3V3" stroke="rgba(0,0,0,.45)" stroke-width=".5"/>`;
  h += `<g data-layer="impacts"></g><g data-layer="extra"></g>`;
  svg.innerHTML = h;
  svg.dataset.face = f.tri ? 'tri' : 'std';
}

function dot(x, y, o = {}) {
  const { r = 3.2, n = null, fill = '#fff', stroke = '#111', op = 1 } = o;
  const txt = n !== null
    ? `<text x="${x}" y="${(+y + 1.6).toFixed(1)}" text-anchor="middle" font-size="4.6" font-weight="700" fill="#111">${n}</text>` : '';
  return `<g opacity="${op}"><circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>${txt}</g>`;
}

/* Ligne « Archer — Arc · Type » (bilan, image, feuille imprimée). */
const whoLine = s => [s.archer, [s.bow, s.bowType].filter(Boolean).join(' · ')].filter(Boolean).join(' — ');

/* ---------- Statistiques d'une séance ---------- */
const endsOf = s => (s.ends || []).filter(Boolean);
function sessionStats(s) {
  const arrows = endsOf(s).flat();
  const total = sumScore(arrows);
  const tens = arrows.filter(a => a.valStr === '10' || a.valStr === 'X').length;
  const xs = arrows.filter(a => a.valStr === 'X').length;
  const planned = s.config.arrowsPerEnd * s.config.totalEnds;
  return { arrows, count: arrows.length, total, tens, xs, planned, max: planned * 10,
           avg: arrows.length ? total / arrows.length : 0, complete: arrows.length >= planned };
}

function isValidSession(s) {
  return !!(s && s.config && Array.isArray(s.ends) && s.id
    && Number.isFinite(+s.config.arrowsPerEnd) && +s.config.arrowsPerEnd > 0
    && Number.isFinite(+s.config.totalEnds) && +s.config.totalEnds > 0
    && s.config.distance !== undefined && s.config.targetType !== undefined
    && s.ends.every(e => e === null || e === undefined || (Array.isArray(e) && e.every(a => a && typeof a.valStr === 'string' && Number.isFinite(+a.scoreVal)))));
}
function normalizeSession(s) {
  const c = s.config;
  c.arrowsPerEnd = parseInt(c.arrowsPerEnd, 10);
  c.totalEnds = parseInt(c.totalEnds, 10);
  c.distance = String(c.distance);
  c.targetType = String(c.targetType);
  s.currentEndIndex = Number.isFinite(+s.currentEndIndex) ? +s.currentEndIndex : 0;
  s.ends = s.ends.map(e => e || []);
  s.ends.forEach(e => e.forEach(a => {
    a.scoreVal = +a.scoreVal;
    a.x = Number.isFinite(+a.x) && a.x !== null && a.x !== '' ? +a.x : null;
    a.y = Number.isFinite(+a.y) && a.y !== null && a.y !== '' ? +a.y : null;
  }));
  return s;
}

/* ---------- État ---------- */
const app = {
  sessions: [],
  session: null,
  mode: 'keys',
  tab: 'shoot',
  pending: null,
  statsData: [],
  mapView: 'density',
  mapRange: 'all',
  endsSession: '',
  endsSel: new Set(),
  edit: null,
  summarySession: null,
  reorder: null
};

function loadSessions() {
  const raw = store.get(KEYS.sessions, []);
  return (Array.isArray(raw) ? raw : []).filter(isValidSession).map(normalizeSession);
}
const saveSessions = () => { const ok = store.set(KEYS.sessions, app.sessions); renderBackupBanner(); return ok; };
const loadUnfinished = () => { const u = store.get(KEYS.unfinished, null); return isValidSession(u) ? normalizeSession(u) : null; };
function persist() {
  if (app.session && !app.session.finished) store.set(KEYS.unfinished, app.session);
}
function archive(s) {
  const copy = JSON.parse(JSON.stringify(s));
  const i = app.sessions.findIndex(x => x.id === copy.id);
  if (i >= 0) app.sessions[i] = copy; else app.sessions.unshift(copy);
  saveSessions();
}

function createSession(cfg) {
  const pr = store.get(KEYS.profile, {});
  return {
    id: 'session_' + Date.now(),
    date: new Date().toISOString(),
    archer: pr.name || '', bow: pr.bow || '', bowType: pr.type || '',
    config: { distance: cfg.distance, targetType: cfg.target, arrowsPerEnd: cfg.ape, totalEnds: cfg.ends },
    currentEndIndex: 0,
    ends: []
  };
}
function setSession(s) {
  app.session = s;
  app.pending = null;
  renderShoot();
}

/* ---------- Saisie des flèches ---------- */
function addArrow(v, x = null, y = null) {
  const s = app.session;
  if (!s || s.finished) return;
  const f = face(s.config);
  if (f.tri && v !== 'M' && rank(v) < f.minRing) return;
  const idx = s.currentEndIndex;
  const end = s.ends[idx] || (s.ends[idx] = []);
  const max = s.config.arrowsPerEnd;
  if (end.length >= max) return;

  end.push({ valStr: v, scoreVal: scoreOf(v), x, y });
  app.pending = null;
  buzz(12);

  if (end.length >= max) {
    if (idx >= s.config.totalEnds - 1) {
      finishSession(false);
      return;
    }
    s.currentEndIndex++;
    buzz([20, 40, 20]);
    toast(`Volée ${idx + 1} : ${sumScore(end)} points`);
  }
  persist();
  renderShoot();
}

async function undo() {
  const s = app.session;
  if (!s) return;
  if (s.finished && !(await reopen())) return;
  let end = s.ends[s.currentEndIndex];
  if (!end || !end.length) {
    if (s.currentEndIndex === 0) { toast('Aucune flèche à annuler.'); return; }
    s.currentEndIndex--;
    end = s.ends[s.currentEndIndex];
  }
  end.pop();
  app.pending = null;
  persist();
  renderShoot();
}

async function clearEnd() {
  const s = app.session;
  if (!s || s.finished) return;
  const end = s.ends[s.currentEndIndex];
  if (!end || !end.length) return;
  if (end.length > 1 && !(await askConfirm('Effacer toutes les flèches de cette volée ?', 'Effacer'))) return;
  s.ends[s.currentEndIndex] = [];
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
  app.pending = null;
  renderShoot();
  buzz([30, 60, 30]);
  openSummary(s, true);
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
  s.ends.forEach((e, i) => { if (e && e.length) last = i; });
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
  for (let i = Math.min(s.currentEndIndex, s.ends.length - 1); i >= 0; i--) {
    const e = s.ends[i];
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
  if (!s) { updateWakeLock(); return; }

  const c = s.config, st = sessionStats(s), f = face(c);
  const idx = Math.min(s.currentEndIndex, c.totalEnds - 1);

  $('#chip-dist').textContent = c.distance;
  $('#chip-target').textContent = targetLabel(c.targetType);
  $('#btn-finish').hidden = !!s.finished;
  $('#s-total').textContent = st.total;
  $('#s-max').textContent = `/ ${st.max} pts`;
  const refN = refArrows(), pj = $('#s-proj');
  pj.hidden = !(st.count && st.count !== refN);
  if (!pj.hidden) pj.textContent = `Projection sur ${refN} flèches : ${projectedScore(s)} pts`;
  $('#s-end').textContent = s.finished ? 'Fin' : `${idx + 1}/${c.totalEnds}`;
  $('#s-avg').textContent = st.count ? st.avg.toFixed(1) : '–';
  $('#s-tens').textContent = st.tens;
  $('#s-x').textContent = st.xs;
  $('#s-bar').style.width = Math.min(100, st.count / st.planned * 100) + '%';

  // Volée en cours
  const cur = s.ends[idx] || [];
  $('#end-card').hidden = !!s.finished;
  $('#end-no').textContent = idx + 1;
  $('#end-sum').textContent = sumScore(cur);
  let slots = '';
  for (let i = 0; i < c.arrowsPerEnd; i++) {
    const a = cur[i];
    slots += a
      ? `<button class="slot ${zoneClass(a.valStr)}" data-action="edit-arrow" data-e="${idx}" data-i="${i}" aria-label="Modifier la flèche ${i + 1}">${a.valStr}</button>`
      : `<span class="slot empty${i === cur.length ? ' next' : ''}">${i + 1}</span>`;
  }
  $('#slots').innerHTML = slots;

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
  for (let e = 0; e < c.totalEnds; e++) {
    const end = s.ends[e] || [];
    const sum = sumScore(end);
    cumul += sum;
    const chips = end.map((a, i) => ({ a, i })).sort((p, q) => rank(q.a.valStr) - rank(p.a.valStr))
      .map(({ a, i }) => `<button class="sc ${zoneClass(a.valStr)}" data-action="edit-arrow" data-e="${e}" data-i="${i}" aria-label="Modifier la flèche ${i + 1} de la volée ${e + 1}">${a.valStr}</button>`).join('');
    const isCur = !s.finished && e === idx;
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
}

function renderImpactLayer() {
  const s = app.session;
  const layer = $('#svg-target [data-layer=impacts]');
  if (!s || !layer) return;
  let h = '';
  s.ends.forEach((end, i) => (end || []).forEach((a, j) => {
    if (a.x == null || a.y == null) return;
    h += (i === s.currentEndIndex && !s.finished)
      ? dot(a.x, a.y, { n: j + 1 })
      : dot(a.x, a.y, { r: 2.2, fill: '#111', stroke: '#fff', op: .45 });
  }));
  layer.innerHTML = h;
}

function renderPending() {
  const layer = $('#svg-target [data-layer=extra]');
  const info = $('#pending-info'), btn = $('#btn-undo-target');
  if (!layer || !app.session) return;
  const sess = app.session, p = app.pending;
  btn.disabled = !!sess.finished || sessionStats(sess).count === 0;
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
  const z = zoneAt(p.x, p.y, face(sess.config));
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
  info.innerHTML = `Zone <span class="zonebadge ${zoneClass(z)}">${z}</span> <span class="muted" style="font-size:13px">relâchez pour valider</span>`;
}

/* ---------- Notes de séance ---------- */
let notesTimer;
function renderNotes() {
  const s = app.session;
  if (!s) return;
  const n = s.notes || {};
  if (document.activeElement !== $('#n-text')) $('#n-text').value = n.text || '';
  if (document.activeElement !== $('#n-real')) $('#n-real').value = n.real || '';
  $('#n-weather').value = n.weather || '';
  $$('#n-feel button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.v === n.feel)));
  const bits = [n.weather, n.feel ? `${n.feel}/5` : '', n.text ? 'note' : ''].filter(Boolean);
  $('#notes-hint').textContent = bits.join(' · ');
}
function saveNotes(immediate) {
  clearTimeout(notesTimer);
  const run = () => {
    const s = app.session;
    if (!s) return;
    s.notes = { weather: $('#n-weather').value, real: $('#n-real').value.trim(), feel: (s.notes && s.notes.feel) || 0, text: $('#n-text').value };
    if (s.finished) archive(s); else persist();
    const n = s.notes;
    $('#notes-hint').textContent = [n.weather, n.feel ? `${n.feel}/5` : '', n.text ? 'note' : ''].filter(Boolean).join(' · ');
  };
  if (immediate) run(); else notesTimer = setTimeout(run, 350);
}
function setFeel(v) {
  const s = app.session;
  if (!s) return;
  s.notes = s.notes || {};
  s.notes.feel = s.notes.feel === v ? 0 : v;
  saveNotes(true);
  renderNotes();
}

/* ---------- Records & objectifs ---------- */
const formatKey = s => [s.config.distance, s.config.targetType, s.config.arrowsPerEnd * s.config.totalEnds].join('|');
const goalKey = c => `${c.distance}|${c.targetType}`;
const getGoals = () => store.get(KEYS.goals, {});
function setGoal(key, v) {
  const g = getGoals();
  if (v > 0) g[key] = v; else delete g[key];
  store.set(KEYS.goals, g);
}
function analyze(s) {
  const st = sessionStats(s), key = formatKey(s);
  const others = app.sessions.filter(x => x.id !== s.id && formatKey(x) === key && sessionStats(x).complete);
  const prevBest = others.length ? Math.max(...others.map(x => sessionStats(x).total)) : null;
  const goal = getGoals()[goalKey(s.config)] || 0;
  const projected = projectedScore(s);
  return { prevBest, record: st.complete && prevBest !== null && st.total > prevBest, goal, projected,
           goalReached: goal > 0 && reliableProjection(s) && projected >= goal };
}

/* ---------- Écran toujours allumé ---------- */
const getPrefs = () => Object.assign({ wake: true, backupEvery: 5, refArrows: 60, weeklyGoal: 0, lang: 'auto', theme: 'carnet' }, store.get(KEYS.prefs, {}));
const THEME_COLORS = { carnet: '#efe6cf', clair: '#ffffff', nuit: '#131d2f' };
function applyTheme() {
  const th = getPrefs().theme;
  document.documentElement.setAttribute('data-theme', th);
  const metas = $$('meta[name=theme-color]');
  const c = THEME_COLORS[th];
  if (metas[0]) metas[0].setAttribute('content', c || '#ffffff');
  if (metas[1]) metas[1].setAttribute('content', c || '#131d2f');
}
/* Projection : score ramené au nombre de flèches de référence (60 = 20 volées de 3).
   Exemple : 270 points sur 30 flèches → 540 projetés sur 60. */
const refArrows = () => Math.max(1, parseInt(getPrefs().refArrows, 10) || 60);
const projectedScore = s => { const st = sessionStats(s); return st.count ? Math.round(st.total / st.count * refArrows()) : 0; };
const reliableProjection = s => sessionStats(s).count >= Math.min(refArrows(), 12);
let wakeLock = null;
async function updateWakeLock() {
  const want = getPrefs().wake && app.session && !app.session.finished && document.visibilityState === 'visible';
  try {
    if (want && !wakeLock && 'wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!want && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch (e) { wakeLock = null; }
}

/* ---------- Rappel de sauvegarde ---------- */
const getBackup = () => Object.assign({ count: 0, snooze: 0, date: null }, store.get(KEYS.backup, {}));
function markBackedUp() {
  store.set(KEYS.backup, { count: app.sessions.length, snooze: 0, date: new Date().toISOString() });
  renderBackupBanner();
}
function renderBackupBanner() {
  const b = getBackup(), every = getPrefs().backupEvery;
  const unsaved = Math.max(0, app.sessions.length - b.count);
  const banner = $('#backup-banner');
  if (!banner) return;
  const show = every > 0 && unsaved >= every && app.sessions.length >= b.snooze;
  banner.hidden = !show;
  if (show) $('#backup-text').textContent = `${unsaved} séances ne sont pas encore sauvegardées.`;
  const st = $('#backup-status');
  if (st) st.textContent = b.date
    ? `Dernière sauvegarde : ${fmtDate(b.date, true)}${unsaved ? ` (${unsaved} séance${unsaved > 1 ? 's' : ''} depuis)` : ''}.`
    : 'Aucune sauvegarde effectuée pour l’instant.';
}
async function shareBackup() {
  if (!app.sessions.length) { toast('Aucune séance à sauvegarder.'); return; }
  const file = new File([JSON.stringify(app.sessions, null, 2)], `carnet_tir_cible_${today()}.json`, { type: 'application/json' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: t('Sauvegarde Carnet de Tir Cible') });
      markBackedUp();
      toast('Sauvegarde partagée.');
      return;
    }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  exportJSON();
}

/* ---------- Réglages ---------- */
function renderSettings() {
  const pr = store.get(KEYS.profile, {}), pf = getPrefs();
  $('#pf-name').value = pr.name || '';
  $('#pf-bow').value = pr.bow || '';
  $('#pf-type').value = pr.type || '';
  $('#pref-wake').checked = !!pf.wake;
  $('#pref-backup').value = String(pf.backupEvery);
  $('#pref-ref').value = pf.refArrows;
  $('#pref-weekly').value = pf.weeklyGoal || '';
  $('#pref-lang').value = pf.lang;
  $('#pref-theme').value = pf.theme;
  renderGear();
  renderBackupBanner();
}
function saveProfile() {
  store.set(KEYS.profile, { name: $('#pf-name').value.trim(), bow: $('#pf-bow').value.trim(), type: $('#pf-type').value });
}
function savePrefs() {
  store.set(KEYS.prefs, Object.assign({}, getPrefs(), {
    wake: $('#pref-wake').checked,
    backupEvery: parseInt($('#pref-backup').value, 10),
    refArrows: Math.max(6, Math.min(144, parseInt($('#pref-ref').value, 10) || 60)),
    weeklyGoal: Math.max(0, Math.min(5000, parseInt($('#pref-weekly').value, 10) || 0)),
    lang: $('#pref-lang').value,
    theme: $('#pref-theme').value
  }));
  applyTheme();
  if (app.session) renderShoot();
  renderBackupBanner();
  updateWakeLock();
}

/* ---------- Modifier une flèche déjà saisie ---------- */
function openEdit(e, i) {
  const s = app.session;
  const a = s && (s.ends[e] || [])[i];
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
      <h2 id="edit-title">Volée ${e + 1} · flèche ${i + 1}</h2>
      <button class="btn sm icon-only" data-action="close" data-target="dlg-edit" aria-label="Fermer">${icon('x')}</button>
    </div>
    <p style="margin:0">Valeur actuelle <span class="zonebadge ${zoneClass(a.valStr)}">${a.valStr}</span></p>
    <div class="keypad">${keys}</div>
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
  const a = s && ed && (s.ends[ed.e] || [])[ed.i];
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

/* ---------- Réglage du viseur ---------- */
const getSight = () => store.get(KEYS.sight, {});
function sightHtml(dist, dx, dy) {
  const v = getSight()[dist] || '';
  return `<div class="notice sight-box" data-dist="${esc(dist)}" data-dx="${dx.toFixed(2)}" data-dy="${dy.toFixed(2)}">
    <b>Réglage du viseur</b>
    <label>Valeur d'un clic à ${esc(dist)} (en cm)<input class="sight-input" data-dist="${esc(dist)}" type="number" inputmode="decimal" step="0.1" min="0" value="${v}" placeholder="ex. 0.5"></label>
    <div class="sight-out"></div>
  </div>`;
}
function updateSights() {
  $$('.sight-box').forEach(box => {
    const click = parseFloat(getSight()[box.dataset.dist]) || 0;
    const dx = +box.dataset.dx, dy = +box.dataset.dy, out = $('.sight-out', box);
    if (!click) {
      out.innerHTML = '<span class="muted" style="font-size:13px">Indiquez de combien de cm bouge l\'impact pour un clic : l\'appli calcule la correction à faire.</span>';
      return;
    }
    const clicks = v => { const c = Math.round(Math.abs(v) / click * 2) / 2; return c; };
    const lines = [];
    const cy = clicks(dy), cx = clicks(dx);
    if (cy >= 0.5) lines.push(`<p>${dy < 0 ? 'Montez' : 'Descendez'} le viseur de <b>${cy} clic${cy > 1 ? 's' : ''}</b></p>`);
    if (cx >= 0.5) lines.push(`<p>Décalez-le de <b>${cx} clic${cx > 1 ? 's' : ''}</b> vers la ${dx < 0 ? 'gauche' : 'droite'}</p>`);
    out.innerHTML = (lines.length ? lines.join('') : '<p>Groupement centré : aucune correction nécessaire.</p>') +
      '<p class="muted" style="font-size:12px">Règle classique : le viseur suit le groupement. Sur certains viseurs (réglage arrière) le sens est inversé : essayez d\'abord avec un seul clic.</p>';
  });
}

/* ---------- Partage du bilan en image ---------- */
async function shareSummaryImage(s) {
  const st = sessionStats(s), f = face(s.config), k = cmPerUnit(s.config);
  const W = 1080, H = 1350, FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  c.fillStyle = '#0e1a2b'; c.fillRect(0, 0, W, H);
  ['#FFD100', '#EE334E', '#00A4E4', '#151515', '#d5dce6'].forEach((col, i) => { c.fillStyle = col; c.fillRect(i * W / 5, 0, W / 5, 16); });
  c.textBaseline = 'alphabetic';
  c.fillStyle = '#fff'; c.font = `700 46px ${FONT}`; c.textAlign = 'left';
  c.fillText(t('Carnet de Tir Cible'), 60, 100);
  c.fillStyle = '#92a1b6'; c.font = `500 32px ${FONT}`; c.textAlign = 'right';
  c.fillText(fmtDate(s.date, true), W - 60, 100);
  c.textAlign = 'left';
  const who = whoLine(s);
  if (who) c.fillText(t(who), 60, 148);
  c.fillStyle = '#fff'; c.font = `800 220px ${FONT}`;
  c.fillText(String(st.total), 60, 390);
  const tw = c.measureText(String(st.total)).width;
  c.fillStyle = '#92a1b6'; c.font = `600 52px ${FONT}`;
  c.fillText(`/ ${st.max} pts`, 60 + tw + 24, 390);
  c.font = `600 38px ${FONT}`;
  c.fillText(t(`${s.config.distance} · ${targetLabel(s.config.targetType)} · ${st.count} flèches`), 60, 455);
  const boxes = [[t('Moy.'), st.count ? st.avg.toFixed(1) : '–'], [t('10 et X'), String(st.tens)], ['X', String(st.xs)]];
  boxes.forEach(([label, val], i) => {
    const x = 60 + i * 330;
    c.fillStyle = '#16233a'; c.beginPath(); c.roundRect ? c.roundRect(x, 490, 300, 120, 22) : c.rect(x, 490, 300, 120); c.fill();
    c.fillStyle = '#92a1b6'; c.font = `500 28px ${FONT}`; c.fillText(label, x + 24, 535);
    c.fillStyle = '#fff'; c.font = `800 52px ${FONT}`; c.fillText(val, x + 24, 590);
  });
  // cible
  const cx = W / 2, cy = 930, R = 300, sc = R / f.extent;
  c.fillStyle = '#fff'; c.beginPath(); c.arc(cx, cy, R + 16, 0, Math.PI * 2); c.fill();
  for (let kr = f.minRing; kr <= 10; kr++) {
    c.beginPath(); c.arc(cx, cy, (11 - kr) * 10 * sc, 0, Math.PI * 2);
    c.fillStyle = RING_FILL[kr]; c.fill(); c.strokeStyle = RING_LINE[kr]; c.lineWidth = 2; c.stroke();
  }
  const pts = st.arrows.filter(a => a.x != null && a.y != null);
  pts.forEach(a => {
    c.beginPath(); c.arc(cx + a.x * sc, cy + a.y * sc, 9, 0, Math.PI * 2);
    c.fillStyle = '#0b2f5e'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
  });
  if (pts.length) {
    const bias = biasOf(pts.map(a => ({ x: a.x, y: a.y, k })));
    if (pts.length >= 3) {
      const e = ellipseOf(pts);
      c.save(); c.translate(cx + e.mx * sc, cy + e.my * sc); c.rotate(e.ang * Math.PI / 180);
      c.beginPath(); c.ellipse(0, 0, e.rx * sc, e.ry * sc, 0, 0, Math.PI * 2);
      c.strokeStyle = '#fff'; c.lineWidth = 8; c.stroke();
      c.strokeStyle = '#111'; c.lineWidth = 3; c.setLineDash([14, 9]); c.stroke(); c.restore();
    }
    c.beginPath(); c.arc(cx + bias.mx * sc, cy + bias.my * sc, 17, 0, Math.PI * 2);
    c.fillStyle = '#dc2626'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 5; c.stroke();
    c.fillStyle = '#fff'; c.font = `600 34px ${FONT}`; c.textAlign = 'center';
    c.fillText(`${t('Tendance')} : ${t(bias.text)} · ${t('Dispersion moyenne')} ${bias.disp.toFixed(1)} cm`, W / 2, 1310);
  }
  const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
  if (!blob) { toast("Impossible de créer l'image.", 'error'); return; }
  const file = new File([blob], `bilan_tir_${today()}.png`, { type: 'image/png' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: t('Carnet de Tir Cible') });
      return;
    }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  download(file.name, blob, 'image/png');
  toast('Image enregistrée dans vos téléchargements.');
}

/* ---------- Impression / PDF d'une séance ---------- */
function printSession(s) {
  const st = sessionStats(s), f = face(s.config), k = cmPerUnit(s.config);
  let sheet = $('#print-sheet');
  if (!sheet) { sheet = document.createElement('div'); sheet.id = 'print-sheet'; document.body.appendChild(sheet); }
  let cumul = 0;
  const rows = Array.from({ length: s.config.totalEnds }, (_, e) => {
    const end = s.ends[e] || [], sum = sumScore(end);
    cumul += sum;
    return `<tr><td>${e + 1}</td><td>${end.map(a => a.valStr).join('  ') || ''}</td><td>${end.length ? sum : ''}</td><td>${end.length ? cumul : ''}</td></tr>`;
  }).join('');
  const who = whoLine(s);
  const n = s.notes || {};
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  drawFace(svg, f);
  const pts = st.arrows.filter(a => a.x != null && a.y != null);
  let h = pts.map(a => `<circle cx="${a.x}" cy="${a.y}" r="2.4" fill="#0b2f5e" stroke="#fff" stroke-width=".5"/>`).join('');
  if (pts.length) { const b = biasOf(pts.map(a => ({ x: a.x, y: a.y, k }))); h += `<circle cx="${b.mx.toFixed(1)}" cy="${b.my.toFixed(1)}" r="3.4" fill="#dc2626" stroke="#fff" stroke-width="1.2"/>`; }
  svg.querySelector('[data-layer=impacts]').innerHTML = h;
  sheet.innerHTML = `
    <h1>Carnet de Tir Cible</h1>
    <div class="ps-meta"><b>${esc(fmtDate(s.date, true))}</b> · ${esc(s.config.distance)} · ${esc(targetLabel(s.config.targetType))} · ${s.config.totalEnds} volées de ${s.config.arrowsPerEnd} flèches</div>
    ${who ? `<div class="ps-meta">${esc(who)}</div>` : ''}
    ${(n.weather || n.real) ? `<div class="ps-meta">${[n.weather, n.real ? 'Distance réelle : ' + n.real : ''].filter(Boolean).map(esc).join(' · ')}</div>` : ''}
    <table><thead><tr><th>Volée</th><th>Flèches</th><th>Total</th><th>Cumul</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="ps-meta"><b>Score : ${st.total} / ${st.max}</b> · Moyenne : ${st.count ? st.avg.toFixed(2) : '–'} · 10 et X : ${st.tens} · X : ${st.xs}</div>
    ${n.text ? `<div class="ps-meta">Notes : ${esc(n.text)}</div>` : ''}
    ${pts.length ? svg.outerHTML : ''}`;
  try { window.print(); } catch (e) { toast("Impression indisponible sur cet appareil.", 'error'); }
}

/* ---------- Journal du matériel ---------- */
const getGear = () => store.get(KEYS.gear, []);
function renderGear() {
  const d = $('#gear-date');
  if (!d.value) d.value = today();
  const list = [...getGear()].sort((a, b) => a.date < b.date ? 1 : -1);
  $('#gear-list').innerHTML = list.length ? list.map(g =>
    `<div class="rec"><div><b>${esc(fmtDate(g.date + 'T12:00:00', false))}</b> · ${esc(g.text)}</div><button class="btn sm danger" data-action="gear-del" data-id="${esc(g.id)}" aria-label="Supprimer">${icon('trash')}</button></div>`).join('')
    : '<p class="muted" style="margin:6px 0 0;font-size:13px">Aucun changement noté pour l\'instant.</p>';
}
function addGear() {
  const text = $('#gear-text').value.trim(), date = $('#gear-date').value || today();
  if (!text) { toast('Décrivez le changement de matériel.'); return; }
  const list = getGear();
  list.push({ id: 'g' + Date.now(), date, text: text.slice(0, 80) });
  store.set(KEYS.gear, list);
  $('#gear-text').value = '';
  renderGear();
  toast('Changement ajouté.');
}
function delGear(id) {
  store.set(KEYS.gear, getGear().filter(g => g.id !== id));
  renderGear();
}

/* ---------- Objectif hebdomadaire ---------- */
const mondayOf = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.getTime(); };
const arrowsThisWeek = () => app.sessions.filter(x => mondayOf(x.date) === mondayOf(new Date())).reduce((a, x) => a + sessionStats(x).count, 0);

/* ---------- Régularité par volée ---------- */
function renderRegularity(data) {
  const card = $('#regularity-card');
  const per = new Map(), endAvgs = [], apes = new Set();
  data.forEach(sess => (sess.ends || []).forEach((end, i) => {
    if (!end || !end.length) return;
    const sum = sumScore(end), g = per.get(i) || { sum: 0, n: 0 };
    g.sum += sum; g.n += end.length; per.set(i, g);
    if (end.length === sess.config.arrowsPerEnd) { endAvgs.push(sum / end.length); apes.add(sess.config.arrowsPerEnd); }
  }));
  const rows = [...per.entries()].sort((a, b) => a[0] - b[0]).map(([i, g]) => ({ i, avg: g.sum / g.n }));
  if (rows.length < 3 || endAvgs.length < 3) { card.hidden = true; return; }
  card.hidden = false;
  const mean = endAvgs.reduce((a, b) => a + b, 0) / endAvgs.length;
  const sd = Math.sqrt(endAvgs.reduce((a, b) => a + (b - mean) ** 2, 0) / endAvgs.length);
  const uni = apes.size === 1 ? [...apes][0] : 0;
  const best = rows.reduce((a, b) => b.avg > a.avg ? b : a), worst = rows.reduce((a, b) => b.avg < a.avg ? b : a);
  const third = Math.max(1, Math.floor(rows.length / 3));
  const avgOf = a => a.reduce((t, r) => t + r.avg, 0) / a.length;
  const delta = avgOf(rows.slice(-third)) - avgOf(rows.slice(0, third));
  const trend = Math.abs(delta) < 0.15 ? 'Régulier du début à la fin de la séance.'
    : delta < 0 ? `Baisse en fin de séance : ${Math.abs(delta).toFixed(1)} pt par flèche de moins que sur les premières volées.`
    : `Progression en cours de séance : ${delta.toFixed(1)} pt par flèche de plus que sur les premières volées.`;
  card.innerHTML = `<h3>Régularité par volée</h3>
    <p class="muted" style="margin:2px 0 8px;font-size:13px">Score moyen par flèche pour chaque numéro de volée (séances filtrées).</p>
    ${lineChart(rows.map(r => r.avg), rows.map(r => `V${r.i + 1}`), 1)}
    <div class="grid2" style="margin-top:10px">
      <div class="mini"><dt>Meilleure volée</dt><dd>n° ${best.i + 1}</dd><div class="muted" style="font-size:12px">moy. ${best.avg.toFixed(1)}</div></div>
      <div class="mini"><dt>Plus faible</dt><dd>n° ${worst.i + 1}</dd><div class="muted" style="font-size:12px">moy. ${worst.avg.toFixed(1)}</div></div>
    </div>
    <p style="margin:10px 0 0;font-weight:650">${trend}</p>
    <p class="muted" style="margin:6px 0 0;font-size:13px">Régularité : ${uni ? `±${(sd * uni).toFixed(1)} pts par volée` : `±${sd.toFixed(2)} pt par flèche`} (écart-type).</p>`;
}

/* ---------- Bilan de séance ---------- */
function biasOf(pts) {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  const disp = pts.reduce((s, p) => s + Math.hypot(p.x - mx, p.y - my) * p.k, 0) / n;
  const k = pts.reduce((s, p) => s + p.k, 0) / n;
  const v = my < -5 ? 'Haut' : my > 5 ? 'Bas' : '';
  const h = mx < -5 ? 'Gauche' : mx > 5 ? 'Droite' : '';
  const text = [v, h].filter(Boolean).join('-') || 'Plein centre';
  const dx = Math.abs(mx * k).toFixed(1), dy = Math.abs(my * k).toFixed(1);
  const detail = `${dx} cm à ${mx < 0 ? 'gauche' : 'droite'} · ${dy} cm ${my < 0 ? 'trop haut' : 'trop bas'}`;
  return { mx, my, disp, text, detail, k };
}

const biasMinis = b => `<div class="mini"><dt>Tendance</dt><dd>${b.text}</dd><div class="muted" style="font-size:12px">${b.detail}</div></div>
      <div class="mini"><dt>Dispersion moyenne</dt><dd>${b.disp.toFixed(1)} cm</dd></div>`;

function drawMapPoints(svg, pts, bary, r) {
  const layer = svg.querySelector('[data-layer=impacts]');
  let h = pts.map(p => dot(p.x, p.y, { r, fill: '#0284c7', stroke: '#fff', op: .85 })).join('');
  if (bary) h += `<circle cx="${bary.mx.toFixed(1)}" cy="${bary.my.toFixed(1)}" r="${r * 1.8}" fill="#dc2626" stroke="#fff" stroke-width="1.5"/>`;
  layer.innerHTML = h;
}

function openSummary(s, fresh = false) {
  const st = sessionStats(s), f = face(s.config), k = cmPerUnit(s.config);
  const pts = st.arrows.filter(a => a.x != null && a.y != null).map(a => ({ x: a.x, y: a.y, k }));
  const bias = pts.length ? biasOf(pts) : null;
  const info = analyze(s);
  let banner = '';
  if (info.record) banner += `<div class="notice win">${fresh ? 'Nouveau record sur ce format' : 'Meilleure séance de ce format'} : ${st.total} pts (précédent : ${info.prevBest}).</div>`;
  const ref = refArrows();
  if (st.count && st.count !== ref) banner += `<div class="notice">Projection sur ${ref} flèches : <b>${info.projected} pts</b> (${st.count} flèches tirées).</div>`;
  const wgoal = getPrefs().weeklyGoal || 0;
  if (fresh && wgoal > 0) {
    const wk = arrowsThisWeek();
    if (wk >= wgoal && wk - st.count < wgoal) banner += `<div class="notice win">Objectif hebdomadaire atteint : ${wk} / ${wgoal} flèches cette semaine.</div>`;
  }
  if (info.goalReached) banner += `<div class="notice win">Objectif de ${info.goal} points (sur ${ref} flèches) atteint !</div>`;
  else if (info.goal) banner += `<div class="notice">Objectif : ${info.goal} pts sur ${ref} flèches${reliableProjection(s) ? `, il manque ${Math.max(0, info.goal - info.projected)} points` : ' (trop peu de flèches pour projeter)'}.</div>`;
  const who = whoLine(s);

  $('#summary-body').innerHTML = `
    <div class="row between">
      <h2 id="sum-title">Bilan de séance</h2>
      <button class="btn sm icon-only" data-action="close" data-target="dlg-summary" aria-label="Fermer">${icon('x')}</button>
    </div>
    ${who ? `<div class="muted" style="font-size:13px;margin-top:-8px">${esc(who)}</div>` : ''}
    <div class="sum-score"><span class="big">${st.total}</span><span class="muted">/ ${st.max} pts</span></div>
    ${banner}
    <div class="minis">
      <div class="mini"><dt>Flèches</dt><dd>${st.count}</dd></div>
      <div class="mini"><dt>Moy.</dt><dd>${st.count ? st.avg.toFixed(1) : '–'}</dd></div>
      <div class="mini"><dt>10 et X</dt><dd>${st.tens}</dd></div>
      <div class="mini"><dt>X</dt><dd>${st.xs}</dd></div>
    </div>
    ${pts.length ? `
      <div class="target-wrap" style="width:100%"><svg id="svg-summary" class="map" role="img" aria-label="Carte des impacts de la séance"></svg></div>
      <div class="grid2">
        ${biasMinis(bias)}
      </div>
      ${pts.length >= 6 ? sightHtml(s.config.distance, bias.mx * bias.k, bias.my * bias.k) : ''}
      <p class="muted" style="margin:0;font-size:13px">Point rouge : position moyenne de vos ${pts.length} impacts.</p>`
    : `<p class="muted" style="margin:0">Aucun impact placé : utilisez le mode Cible pour obtenir la carte et la tendance de tir.</p>`}
    <div class="grid2">
      <button class="btn" data-action="share-image">${icon('upload')}Partager l'image</button>
      <button class="btn" data-action="print-session">${icon('list')}Imprimer / PDF</button>
    </div>
    <div class="grid2">
      <button class="btn" data-action="close" data-target="dlg-summary">Fermer</button>
      <button class="btn primary" data-action="summary-stats">${icon('chart')}Statistiques</button>
    </div>`;
  app.summarySession = s;

  if (pts.length) {
    const svg = $('#svg-summary');
    drawFace(svg, f);
    drawMapPoints(svg, pts, bias, 3);
  }
  updateSights();
  const dlg = $('#dlg-summary');
  if (!dlg.open) dlg.showModal();
}

/* ---------- Nouvelle séance ---------- */
function renderPresets() {
  $('#presets').innerHTML = PRESETS.map((p, i) => `<button class="preset" data-action="preset" data-i="${i}">${esc(p.label)}</button>`).join('');
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
}
function readSetup() {
  let distance = $('#cfg-distance').value;
  if (distance === 'Custom') {
    distance = $('#cfg-custom').value.trim() || 'Perso';
    if (/^\d+([.,]\d+)?$/.test(distance)) distance += 'm';
    distance = distance.replace(/\s+/g, '').slice(0, 12);
  }
  const ends = Math.max(1, Math.min(60, parseInt($('#cfg-ends').value, 10) || 10));
  return { distance, target: $('#cfg-target').value, ape: parseInt($('#cfg-ape').value, 10), ends };
}
function showSetup() {
  fillSetup(store.get(KEYS.cfg, { distance: '18m', target: '40', ape: 3, ends: 10 }));
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
async function startSession() {
  const cfg = readSetup();
  const u = loadUnfinished();
  if (u) {
    const st = sessionStats(u);
    if (st.count > 0 && !(await askConfirm(`Une séance est en cours (${st.count} flèches). Démarrer une nouvelle séance l'abandonnera. Continuer ?`, 'Abandonner et démarrer'))) return;
  }
  store.set(KEYS.cfg, cfg);
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

/* ---------- Navigation ---------- */
function switchTab(tab) {
  endReorder();
  app.tab = tab;
  ['shoot', 'stats', 'history', 'data'].forEach(t => { $('#tab-' + t).hidden = t !== tab; });
  $$('nav.tabs button').forEach(b => {
    if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  if (tab === 'stats') renderStats();
  if (tab === 'history') renderHistory();
  if (tab === 'data') renderSettings();
  window.scrollTo({ top: 0 });
}
function setMode(m) {
  app.mode = m;
  app.pending = null;
  store.set(KEYS.mode, m);
  renderShoot();
}

/* ---------- Statistiques ---------- */
const fmtDate = (iso, long) => new Date(iso).toLocaleDateString(window.__LOCALE || 'fr-FR',
  long ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: 'short' });

function fillFilters() {
  const dists = [...new Set(app.sessions.map(s => s.config.distance))].sort((a, b) => parseFloat(a) - parseFloat(b));
  const tgts = [...new Set(app.sessions.map(s => String(s.config.targetType)))];
  const fd = $('#f-dist'), ft = $('#f-target');
  const pd = fd.value || 'ALL', pt = ft.value || 'ALL';
  fd.innerHTML = '<option value="ALL">Toutes</option>' + dists.map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join('');
  ft.innerHTML = '<option value="ALL">Tous</option>' + tgts.map(t => `<option value="${esc(t)}">${esc(targetLabel(t))}</option>`).join('');
  fd.value = dists.includes(pd) ? pd : 'ALL';
  ft.value = tgts.includes(pt) ? pt : 'ALL';
  const bows = [...new Set(app.sessions.map(x => x.bow).filter(Boolean))];
  const fb = $('#f-bow'), pb = fb.value || 'ALL';
  fb.innerHTML = '<option value="ALL">Tous</option>' + bows.map(b => `<option value="${esc(b)}">${esc(b)}</option>`).join('');
  fb.value = bows.includes(pb) ? pb : 'ALL';
  $('#f-bow-wrap').hidden = bows.length < 2;
}

function lineChart(vals, labels, dec, marks = []) {
  const W = 320, H = 160, L = 34, R = 10, T = 12, B = 24;
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (lo === hi) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * .15;
  lo = Math.max(0, lo - pad); hi += pad;
  const x = i => vals.length === 1 ? L + (W - L - R) / 2 : L + i * (W - L - R) / (vals.length - 1);
  const y = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  let g = '';
  [lo, (lo + hi) / 2, hi].forEach(v => {
    g += `<line class="gl" x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="axt" x="${L - 5}" y="${(y(v) + 3).toFixed(1)}" text-anchor="end">${v.toFixed(dec)}</text>`;
  });
  const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const line = vals.length > 1 ? `<polyline class="ch-line" points="${pts.join(' ')}"/>` : '';
  const area = vals.length > 1 ? `<polygon class="ch-area" points="${x(0).toFixed(1)},${H - B} ${pts.join(' ')} ${x(vals.length - 1).toFixed(1)},${H - B}"/>` : '';
  const dots = vals.map((v, i) => `<circle class="ch-dot" cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="4"><title>${esc(labels[i])} : ${v.toFixed(dec)}</title></circle>`).join('');
  const mk = vals.length > 1 ? marks.map(m => {
    const mx = x(m.pos).toFixed(1);
    return `<line x1="${mx}" x2="${mx}" y1="${T}" y2="${H - B}" style="stroke:var(--muted)" stroke-width="1" stroke-dasharray="3 3"/>` +
      `<circle cx="${mx}" cy="${T}" r="7" style="fill:var(--ink)"/><text x="${mx}" y="${T + 3}" text-anchor="middle" font-size="9" font-weight="800" style="fill:var(--bg)">${m.n}</text>`;
  }).join('') : '';
  const first = `<text class="axt" x="${L}" y="${H - 6}" text-anchor="start">${esc(labels[0])}</text>`;
  const last = vals.length > 1 ? `<text class="axt" x="${W - R}" y="${H - 6}" text-anchor="end">${esc(labels[labels.length - 1])}</text>` : '';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Courbe d'évolution">${g}${mk}${area}${line}${dots}${first}${last}</svg>`;
}

/* Cartographie par volée : un seul point moyen par volée */
function endStatsFor(list) {
  const m = new Map();
  list.forEach(sess => {
    const k = cmPerUnit(sess.config);
    (sess.ends || []).forEach((end, i) => {
      if (!end || !end.length) return;
      const g = m.get(i) || { pts: [], scores: [] };
      end.forEach(a => {
        g.scores.push(a.scoreVal);
        if (a.x != null && a.y != null) g.pts.push({ x: a.x, y: a.y, k });
      });
      m.set(i, g);
    });
  });
  return [...m.entries()].filter(([, g]) => g.pts.length).sort((a, b) => a[0] - b[0]).map(([i, g]) => ({
    i, pts: g.pts, b: biasOf(g.pts), avg: g.scores.reduce((x, y) => x + y, 0) / g.scores.length
  }));
}

function renderEndsCard() {
  const card = $('#ends-card');
  const data = app.statsData || [];
  const withPts = data.filter(x => sessionStats(x).arrows.some(a => a.x != null && a.y != null));
  card.hidden = false;
  if (!withPts.length) {
    card.innerHTML = `<h3 style="margin-bottom:6px">Cartographie par volée</h3>
      <p class="muted" style="margin:0">Aucun impact enregistré pour ces filtres. Pour obtenir un point moyen par volée, placez vos flèches avec le mode « Cible » de l'onglet Saisie : le clavier n'enregistre pas la position des flèches.</p>`;
    return;
  }

  if (app.endsSession !== 'ALL' && !withPts.some(x => x.id === app.endsSession)) {
    app.endsSession = [...withPts].sort((a, b) => new Date(b.date) - new Date(a.date))[0].id;
  }
  const all = app.endsSession === 'ALL';
  const list = all ? withPts : withPts.filter(x => x.id === app.endsSession);
  const eps = endStatsFor(list);
  const color = j => `hsl(${Math.round(210 - 210 * (eps.length > 1 ? j / (eps.length - 1) : 0))} 80% 42%)`;
  const allTri = list.every(x => x.config.targetType === 'Trispot');

  let spread = 0;
  eps.forEach((a, i) => eps.slice(i + 1).forEach(b => {
    const k = (a.b.k + b.b.k) / 2;
    spread = Math.max(spread, Math.hypot(a.b.mx - b.b.mx, a.b.my - b.b.my) * k);
  }));

  const opts = `<option value="ALL"${all ? ' selected' : ''}>Toutes les séances (moyenne par n° de volée)</option>` +
    [...withPts].sort((a, b) => new Date(b.date) - new Date(a.date)).map(x =>
      `<option value="${esc(x.id)}"${x.id === app.endsSession ? ' selected' : ''}>${esc(fmtDate(x.date, true))} · ${esc(x.config.distance)} · ${sessionStats(x).total} pts</option>`).join('');

  const chips = eps.map((e, j) =>
    `<button class="endchip" style="--c:${color(j)}" data-action="end-toggle" data-e="${e.i}" aria-pressed="${app.endsSel.has(e.i)}" aria-label="Volée ${e.i + 1}">${e.i + 1}</button>`).join('');

  const rows = eps.map((e, j) => {
    const dx = e.b.mx * e.b.k, dy = e.b.my * e.b.k;
    return `<tr><td><span class="sc" style="background:${color(j)};color:#fff">${e.i + 1}</span></td><td>${e.avg.toFixed(1)}</td>` +
      `<td>${dx < 0 ? '←' : '→'} ${Math.abs(dx).toFixed(1)} · ${dy < 0 ? '↑' : '↓'} ${Math.abs(dy).toFixed(1)}</td><td>${e.b.disp.toFixed(1)}</td></tr>`;
  }).join('');

  card.innerHTML = `<h3 style="margin-bottom:4px">Cartographie par volée</h3>
    <p class="muted" style="margin:0 0 10px;font-size:13px">Un point moyen par volée, de la première (bleu) à la dernière (rouge).</p>
    <label>Séance<select id="e-session">${opts}</select></label>
    <div class="target-wrap" style="margin-top:12px"><svg id="svg-ends" class="map" role="img" aria-label="Points moyens de chaque volée"></svg></div>
    <div class="row between" style="margin-top:8px">
      <span class="muted" style="font-size:13px">Touchez des volées pour voir leurs impacts.</span>
      <span class="row"><button class="btn sm" data-action="ends-all">Tout</button><button class="btn sm" data-action="ends-none">Aucune</button></span>
    </div>
    <div class="chips">${chips}</div>
    ${eps.length > 1 ? `<p style="margin:0 0 8px;font-weight:650">Écart maximal entre deux volées : ${spread.toFixed(1)} cm</p>` : ''}
    <div class="table-wrap"><table>
      <thead><tr><th>Volée</th><th>Moy.</th><th>Décalage (cm)</th><th>Dispers. (cm)</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <p class="muted" style="margin:8px 0 0;font-size:13px">${all ? 'Moyenne de toutes les séances filtrées pour chaque numéro de volée. ' : ''}Décalage : position du point moyen par rapport au centre (← gauche, → droite, ↑ haut, ↓ bas).</p>`;

  const svg = $('#svg-ends');
  drawFace(svg, { tri: allTri, minRing: allTri ? 5 : 1, extent: allTri ? 60 : 100, diam: 40 });
  let h = '';
  if (eps.length > 1) {
    h += `<polyline points="${eps.map(e => `${e.b.mx.toFixed(1)},${e.b.my.toFixed(1)}`).join(' ')}" fill="none" stroke="#111" stroke-width=".7" stroke-dasharray="1.5 1.5" opacity=".55"/>`;
  }
  eps.forEach((e, j) => {
    if (app.endsSel.has(e.i)) e.pts.forEach(p => { h += `<circle cx="${p.x}" cy="${p.y}" r="1.9" fill="${color(j)}" stroke="#fff" stroke-width=".6"/>`; });
  });
  eps.forEach((e, j) => {
    h += `<circle cx="${e.b.mx.toFixed(1)}" cy="${e.b.my.toFixed(1)}" r="3.6" fill="${color(j)}" stroke="#fff" stroke-width="1"/>` +
      `<text x="${e.b.mx.toFixed(1)}" y="${(e.b.my + 1.5).toFixed(1)}" text-anchor="middle" font-size="4.2" font-weight="800" fill="#fff">${e.i + 1}</text>`;
  });
  svg.querySelector('[data-layer=impacts]').innerHTML = h;
}

/* Carte des impacts : densité (par défaut) ou points, sur une période au choix,
   avec point moyen et ellipse de regroupement. */
function ellipseOf(pts) {
  const n = pts.length;
  const mx = pts.reduce((t, p) => t + p.x, 0) / n, my = pts.reduce((t, p) => t + p.y, 0) / n;
  let sxx = 0, syy = 0, sxy = 0;
  pts.forEach(p => { const dx = p.x - mx, dy = p.y - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; });
  sxx /= n; syy /= n; sxy /= n;
  const tr = (sxx + syy) / 2, df = Math.sqrt(((sxx - syy) / 2) ** 2 + sxy * sxy);
  return { mx, my, rx: Math.max(1, 1.5 * Math.sqrt(tr + df)), ry: Math.max(1, 1.5 * Math.sqrt(Math.max(tr - df, 0))),
           ang: 0.5 * Math.atan2(2 * sxy, sxx - syy) * 180 / Math.PI };
}

function renderImpactMap() {
  const box = $('#map-box');
  const sorted = [...(app.statsData || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  const withPts = sorted.filter(x => sessionStats(x).arrows.some(a => a.x != null && a.y != null));
  if (!withPts.length) {
    box.innerHTML = '<p class="muted" style="margin:6px 0 0">Aucun impact enregistré : placez vos flèches en mode Cible pour obtenir la carte et la tendance de tir.</p>';
    return;
  }
  const count = app.mapRange === 'all' ? withPts.length : Math.min(parseInt(app.mapRange, 10), withPts.length);
  const list = withPts.slice(0, count);
  const pts = [];
  list.forEach(x => { const k = cmPerUnit(x.config); sessionStats(x).arrows.forEach(a => { if (a.x != null && a.y != null) pts.push({ x: a.x, y: a.y, k }); }); });
  const allTri = list.every(x => x.config.targetType === 'Trispot');
  const f = { tri: allTri, minRing: allTri ? 5 : 1, extent: allTri ? 60 : 100, diam: 40 };
  const bias = biasOf(pts);
  const view = app.mapView;
  const dists = new Set(list.map(x => x.config.distance));
  const sightBlock = (dists.size === 1 && pts.length >= 12) ? sightHtml([...dists][0], bias.mx * bias.k, bias.my * bias.k) : '';
  const ranges = [['all', `Toutes les séances (${withPts.length})`], ['10', '10 dernières séances'], ['5', '5 dernières séances'], ['1', 'Dernière séance']];

  box.innerHTML = `
    <div class="seg" role="group" aria-label="Type d'affichage">
      <button data-action="map-view" data-view="density" aria-pressed="${view === 'density'}">Densité</button>
      <button data-action="map-view" data-view="points" aria-pressed="${view === 'points'}">Points</button>
    </div>
    <label>Période<select id="m-range">${ranges.map(([v, l]) => `<option value="${v}"${v === app.mapRange ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
    <div class="target-wrap" style="margin-top:12px"><svg id="svg-stats-map" class="map" role="img" aria-label="Carte des impacts"></svg></div>
    <div class="grid2" style="margin-top:10px">
      ${biasMinis(bias)}
      <div class="mini"><dt>Impacts</dt><dd>${pts.length}</dd><div class="muted" style="font-size:12px">${count} séance${count > 1 ? 's' : ''}</div></div>
      <div class="mini" id="m-group"><dt>Regroupement</dt><dd>–</dd></div>
    </div>
    ${sightBlock}
    <p class="muted" style="margin:10px 0 0;font-size:13px">${view === 'density'
      ? 'Plus une zone est foncée, plus vous y avez tiré.' : 'Chaque point est une flèche.'}
      Point rouge : position moyenne. Ellipse : zone où tombent environ 2 flèches sur 3.</p>`;

  const svg = $('#svg-stats-map');
  drawFace(svg, f);
  const pad = f.extent + 4;
  // Léger voile clair : la cible garde ses couleurs, les impacts ressortent
  let h = `<rect x="${-pad}" y="${-pad}" width="${pad * 2}" height="${pad * 2}" fill="#fff" opacity=".12"/>`;
  if (view === 'density') {
    const op = Math.max(.08, Math.min(.55, 8 / Math.pow(pts.length, .8)));
    h += '<defs><filter id="blur-density" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>' +
      '<g filter="url(#blur-density)">' +
      pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="8" fill="#6d0fb8" opacity="${op.toFixed(3)}"/>`).join('') + '</g>';
  } else {
    h += pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="1.5" fill="#0b2f5e" stroke="#fff" stroke-width=".35" opacity=".8"/>`).join('');
  }
  if (pts.length >= 3) {
    const e = ellipseOf(pts);
    const tf = `rotate(${e.ang.toFixed(1)} ${e.mx.toFixed(1)} ${e.my.toFixed(1)})`;
    h += `<ellipse cx="${e.mx.toFixed(1)}" cy="${e.my.toFixed(1)}" rx="${e.rx.toFixed(1)}" ry="${e.ry.toFixed(1)}" transform="${tf}" fill="none" stroke="#fff" stroke-width="2.4"/>` +
      `<ellipse cx="${e.mx.toFixed(1)}" cy="${e.my.toFixed(1)}" rx="${e.rx.toFixed(1)}" ry="${e.ry.toFixed(1)}" transform="${tf}" fill="none" stroke="#111" stroke-width="1" stroke-dasharray="3 2"/>`;
    const w = (2 * Math.max(e.rx, e.ry) * bias.k).toFixed(0), hh = (2 * Math.min(e.rx, e.ry) * bias.k).toFixed(0);
    $('#m-group').innerHTML = `<dt>Regroupement</dt><dd>${w} × ${hh} cm</dd><div class="muted" style="font-size:12px">grand × petit axe</div>`;
  }
  h += `<circle cx="${bias.mx.toFixed(1)}" cy="${bias.my.toFixed(1)}" r="3.4" fill="#dc2626" stroke="#fff" stroke-width="1.5"/>`;
  svg.querySelector('[data-layer=impacts]').innerHTML = h;
  updateSights();
}

function renderGoal(data) {
  const card = $('#goal-card');
  const keys = [...new Set(data.map(x => goalKey(x.config)))];
  if (keys.length !== 1) {
    card.innerHTML = '<h3>Objectif</h3><p class="muted" style="margin:6px 0 0">Choisissez une distance et un blason pour fixer un objectif de score.</p>';
    return;
  }
  const key = keys[0], goal = getGoals()[key] || 0, ref = refArrows();
  const usable = data.filter(reliableProjection);
  const best = usable.length ? Math.max(...usable.map(projectedScore)) : 0;
  const last = [...data].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const pct = goal ? Math.min(100, best / goal * 100) : 0;
  const c = data[0].config;
  card.innerHTML = `<h3 style="margin-bottom:10px">Objectif · ${esc(c.distance)} · ${esc(targetLabel(c.targetType))}</h3>
    <label>Score visé sur ${ref} flèches<input id="g-input" data-key="${esc(key)}" type="number" inputmode="numeric" min="0" value="${goal || ''}" placeholder="ex. 540"></label>
    ${goal ? `<div class="progress" aria-hidden="true"><span style="width:${pct.toFixed(0)}%"></span></div>
      <p style="margin:8px 0 0;font-weight:650">${!usable.length ? 'Pas encore assez de flèches pour projeter.' : best >= goal ? 'Objectif atteint !' : `Meilleure projection : ${best} · il manque ${goal - best} points`}</p>`
      : '<p class="muted" style="margin:8px 0 0;font-size:13px">Aucun objectif défini : saisissez un score pour suivre votre progression.</p>'}
    <p class="muted" style="margin:8px 0 0;font-size:13px">Les séances plus courtes sont ramenées à ${ref} flèches (ex. 10 volées de 3 : score ×2). Dernière séance : ${projectedScore(last)} projetés${sessionStats(last).count === ref ? '' : ` (${sessionStats(last).total} réels)`}. Seules les séances d'au moins ${Math.min(ref, 12)} flèches comptent.</p>`;
}

function renderRecords(data) {
  const groups = {};
  data.forEach(x => {
    const st = sessionStats(x);
    if (!st.complete) return;
    const k = formatKey(x);
    const g = groups[k] || (groups[k] = { s: x, n: 0, best: -1, date: x.date, planned: st.planned });
    g.n++;
    if (st.total > g.best) { g.best = st.total; g.date = x.date; }
  });
  const rows = Object.values(groups).sort((a, b) => b.n - a.n).slice(0, 8);
  $('#records').innerHTML = rows.length
    ? rows.map(g => `<div class="rec"><div><b>${esc(g.s.config.distance)} · ${esc(targetLabel(g.s.config.targetType))}</b><div class="muted" style="font-size:13px">${g.planned} flèches · ${g.n} séance${g.n > 1 ? 's' : ''} · ${fmtDate(g.date)}</div></div><div class="h-score">${g.best}</div></div>`).join('')
    : '<p class="muted" style="margin:6px 0 0">Terminez une séance complète pour voir vos records.</p>';
}

function renderVolume() {
  const card = $('#volume-card');
  const all = [...app.sessions];
  const u = loadUnfinished();
  if (u && !all.some(x => x.id === u.id)) all.push(u);
  card.hidden = !all.length;
  if (!all.length) return;
  const monday = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.getTime(); };
  const thisWeek = monday(new Date());
  const WEEK = 7 * 864e5;
  const weeks = Array.from({ length: 8 }, (_, i) => ({ t: thisWeek - (7 - i) * WEEK, n: 0 }));
  const now = new Date();
  let month = 0, total = 0;
  all.forEach(x => {
    const n = sessionStats(x).count, d = new Date(x.date);
    total += n;
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) month += n;
    const w = weeks.find(k => monday(d) === k.t);
    if (w) w.n += n;
  });
  const max = Math.max(1, ...weeks.map(w => w.n));
  const bw = 30, gap = 8, H = 90;
  const bars = weeks.map((w, i) => {
    const h = Math.round(w.n / max * H), x = 4 + i * (bw + gap);
    return `<rect class="vbar${i === 7 ? ' cur' : ''}" x="${x}" y="${H - h + 14}" width="${bw}" height="${Math.max(h, w.n ? 2 : 0)}" rx="4"><title>${w.n} flèches</title></rect>` +
      `<text class="axt" x="${x + bw / 2}" y="${H - h + 10}" text-anchor="middle">${w.n || ''}</text>` +
      `<text class="axt" x="${x + bw / 2}" y="${H + 28}" text-anchor="middle">${i === 0 || i === 7 ? new Date(w.t).toLocaleDateString(window.__LOCALE || 'fr-FR', { day: '2-digit', month: '2-digit' }) : ''}</text>`;
  }).join('');
  const wg = getPrefs().weeklyGoal || 0, wk = weeks[7].n;
  const goalBlock = wg > 0 ? `<div style="margin-top:12px"><div class="row between"><b>Objectif de la semaine</b><span class="${wk >= wg ? '' : 'muted'}">${wk} / ${wg} flèches</span></div><div class="progress"><span style="width:${Math.min(100, wk / wg * 100).toFixed(0)}%"></span></div>${wk >= wg ? '<p style="margin:6px 0 0;font-weight:650">Objectif atteint, bravo !</p>' : `<p class="muted" style="margin:6px 0 0;font-size:13px">Il reste ${wg - wk} flèches.</p>`}</div>` : '';
  card.innerHTML = `<h3 style="margin-bottom:10px">Volume d'entraînement</h3>
    <div class="minis" style="grid-template-columns:repeat(3,1fr);margin-top:0">
      <div class="mini"><dt>Cette semaine</dt><dd>${weeks[7].n}</dd></div>
      <div class="mini"><dt>Ce mois</dt><dd>${month}</dd></div>
      <div class="mini"><dt>Au total</dt><dd>${total}</dd></div>
    </div>
    ${goalBlock}
    <p class="muted" style="margin:10px 0 4px;font-size:13px">Flèches tirées par semaine (8 dernières semaines)</p>
    <svg class="chart" viewBox="0 0 ${8 * (bw + gap) + 4} ${H + 34}" role="img" aria-label="Flèches par semaine">${bars}</svg>`;
}

function renderStats() {
  fillFilters();
  renderVolume();
  const d = $('#f-dist').value, t = $('#f-target').value, bw = $('#f-bow').value;
  const data = app.sessions.filter(s => (d === 'ALL' || s.config.distance === d) && (t === 'ALL' || String(s.config.targetType) === t) && (bw === 'ALL' || s.bow === bw));
  $('#stats-empty').hidden = data.length > 0;
  $('#stats-body').hidden = data.length === 0;
  if (!data.length) return;

  let arrowsN = 0, scoreSum = 0, endsN = 0, tens = 0, best = 0;
  const dist = { '10 et X': 0, '9': 0, '8': 0, '7': 0, '6': 0, '5 à 1': 0, 'M': 0 };
  const maxes = new Set();
  data.forEach(s => {
    const st = sessionStats(s);
    best = Math.max(best, st.total);
    maxes.add(st.max);
    endsN += endsOf(s).filter(e => e.length).length;
    st.arrows.forEach(a => {
      arrowsN++; scoreSum += a.scoreVal;
      if (a.valStr === 'X' || a.valStr === '10') { tens++; dist['10 et X']++; }
      else if (a.valStr === 'M') dist['M']++;
      else if (a.scoreVal >= 6) dist[a.valStr]++;
      else dist['5 à 1']++;
    });
  });

  $('#kpis').innerHTML = `
    <div class="kpi"><b>${best}</b><span>Meilleur score${maxes.size === 1 ? ` (sur ${[...maxes][0]})` : ''}</span></div>
    <div class="kpi"><b>${endsN ? (scoreSum / endsN).toFixed(1) : '–'}</b><span>Moyenne par volée</span></div>
    <div class="kpi"><b>${arrowsN ? Math.round(tens / arrowsN * 100) : 0}%</b><span>de 10 et X</span></div>
    <div class="kpi"><b>${data.length}</b><span>séance${data.length > 1 ? 's' : ''} · ${arrowsN} flèches</span></div>`;

  renderGoal(data);
  renderRecords(data);
  app.statsData = data;
  renderEndsCard();

  // Évolution : total si les séances ont le même format, sinon moyenne par flèche
  const asc = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  const useTotal = maxes.size === 1;
  const vals = asc.map(s => { const st = sessionStats(s); return useTotal ? st.total : st.avg; });
  $('#evo-title').textContent = useTotal ? 'Évolution du score' : 'Évolution de la moyenne par flèche';
  $('#evo-note').textContent = useTotal ? 'Score total de chaque séance, de la plus ancienne à la plus récente.'
    : 'Formats différents : la moyenne par flèche permet de les comparer.';
  const ts = asc.map(x => new Date(x.date).getTime());
  const marks = [];
  if (asc.length > 1) {
    [...getGear()].sort((a, b) => a.date < b.date ? -1 : 1).forEach(g => {
      const t = ts.filter(v => v < new Date(g.date + 'T00:00:00').getTime()).length;
      if (t >= 1) marks.push({ pos: Math.min(t - 0.5, asc.length - 1), g });
    });
  }
  const shown = marks.slice(-9);
  shown.forEach((m, i) => { m.n = i + 1; });
  $('#evo-chart').innerHTML = lineChart(vals, asc.map(s => fmtDate(s.date)), useTotal ? 0 : 1, shown);
  $('#evo-gear').innerHTML = shown.map(m => `<div class="muted" style="font-size:13px;margin-top:4px"><b style="color:var(--ink)">${m.n}</b> · ${esc(fmtDate(m.g.date + 'T12:00:00'))} — ${esc(m.g.text)}</div>`).join('');
  renderRegularity(data);

  // Répartition
  const colors = { '10 et X': 'var(--gold)', '9': 'var(--gold)', '8': 'var(--red)', '7': 'var(--red)', '6': 'var(--blue)', '5 à 1': '#6b7686', 'M': 'var(--danger)' };
  $('#dist-bars').innerHTML = Object.entries(dist).map(([k, n]) => {
    const pct = arrowsN ? n / arrowsN * 100 : 0;
    return `<div class="bar-row"><span class="bar-lbl">${k}</span><div class="bar-track"><div class="bar-fill" style="width:${pct.toFixed(1)}%;background:${colors[k]}"></div></div><span>${n} · ${Math.round(pct)}%</span></div>`;
  }).join('');

  app.statsData = data;
  renderImpactMap();
}

/* ---------- Historique ---------- */
function metaLine(s) {
  const n = s.notes || {};
  const bits = [[s.bow, s.bowType].filter(Boolean).join(' · '), n.weather, n.real ? `réel ${n.real}` : '', n.feel ? `forme ${n.feel}/5` : '']
    .filter(Boolean).map(esc).join(' · ');
  const text = n.text ? `<div style="font-size:13px;margin-top:4px;font-style:italic">${esc(n.text.length > 90 ? n.text.slice(0, 90) + '…' : n.text)}</div>` : '';
  return (bits ? `<div class="muted" style="font-size:13px;margin-top:4px">${bits}</div>` : '') + text;
}
function renderHistory() {
  const list = $('#history-list');
  if (!app.sessions.length) {
    list.innerHTML = `<div class="card empty"><h2>Historique vide</h2><p>Les séances terminées apparaissent ici.</p></div>`;
    return;
  }
  const bestByFormat = {};
  const fmtKey = s => [s.config.distance, s.config.targetType, s.config.arrowsPerEnd * s.config.totalEnds].join('|');
  app.sessions.forEach(s => {
    const k = fmtKey(s), st = sessionStats(s);
    if (!(k in bestByFormat) || st.total > bestByFormat[k]) bestByFormat[k] = st.total;
  });
  const counts = {};
  app.sessions.forEach(s => { const k = fmtKey(s); counts[k] = (counts[k] || 0) + 1; });

  list.innerHTML = app.sessions.map(s => {
    const st = sessionStats(s), k = fmtKey(s);
    const isBest = counts[k] > 1 && st.total === bestByFormat[k] && st.complete;
    return `<article class="card hitem">
      <div>
        <div class="h-score">${st.total} <small>${st.complete ? `/ ${st.max}` : `pts · ${st.count}/${st.planned} flèches`}</small></div>
        <div class="muted" style="font-size:13px;margin:2px 0 6px">${fmtDate(s.date, true)}</div>
        <div class="row"><span class="chip">${esc(s.config.distance)}</span><span class="chip">${esc(targetLabel(s.config.targetType))}</span>${isBest ? '<span class="chip gold">Meilleure</span>' : ''}</div>
        <div class="muted" style="font-size:13px;margin-top:6px">Moy. ${st.count ? st.avg.toFixed(1) : '–'} · 10 et X : ${st.tens}</div>${metaLine(s)}
      </div>
      <div style="display:grid;gap:8px">
        <button class="btn sm" data-action="open-session" data-id="${esc(s.id)}">Consulter</button>
        <button class="btn sm danger" data-action="delete-session" data-id="${esc(s.id)}" aria-label="Supprimer la séance">${icon('trash')}</button>
      </div>
    </article>`;
  }).join('');
}
function openSession(id) {
  const found = app.sessions.find(s => s.id === id);
  if (!found) return;
  const copy = JSON.parse(JSON.stringify(found));
  copy.finished = true;
  setSession(copy);
  switchTab('shoot');
}
async function deleteSession(id) {
  const s = app.sessions.find(x => x.id === id);
  if (!s) return;
  if (!(await askConfirm(`Supprimer définitivement la séance du ${fmtDate(s.date, true)} ?`, 'Supprimer'))) return;
  app.sessions = app.sessions.filter(x => x.id !== id);
  saveSessions();
  if (app.session && app.session.id === id && app.session.finished) setSession(null);
  renderHistory();
  toast('Séance supprimée.');
}

/* ---------- Export / import ---------- */
function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const today = () => new Date().toISOString().slice(0, 10);

function exportJSON() {
  if (!app.sessions.length) { toast('Aucune séance à exporter.'); return; }
  download(`carnet_tir_cible_${today()}.json`, JSON.stringify(app.sessions, null, 2), 'application/json');
  markBackedUp();
}
function exportCSV() {
  if (!app.sessions.length) { toast('Aucune séance à exporter.'); return; }
  const EN = window.__LANG === 'en', SEP = EN ? ',' : ';';
  const num = v => v == null ? '' : (EN ? String(v) : String(v).replace('.', ','));
  const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""').replace(/\s*\n\s*/g, ' ') + '"';
  let csv = EN ? 'Session,Date,Archer,Bow,Bow type,Distance,Actual distance,Target face,Conditions,Feel,Notes,End,Arrow,Score,Zone,X (cm),Y (cm)\n' : 'Séance;Date;Archer;Arc;Type d\'arc;Distance;Distance réelle;Blason;Conditions;Sensations;Notes;Volée;Flèche;Score;Zone;X (cm);Y (cm)\n';
  app.sessions.forEach(s => {
    const k = cmPerUnit(s.config);
    s.ends.forEach((end, e) => (end || []).forEach((a, i) => {
      const n = s.notes || {};
      csv += [s.id, s.date, q(s.archer), q(s.bow), q(s.bowType), s.config.distance, q(n.real), s.config.targetType, q(n.weather), n.feel || '', q(n.text), e + 1, i + 1, a.scoreVal, a.valStr,
        num(a.x == null ? null : +(a.x * k).toFixed(1)), num(a.y == null ? null : +(a.y * k).toFixed(1))].join(SEP) + '\n';
    }));
  });
  download(`carnet_tir_cible_${today()}.csv`, '\uFEFF' + csv, 'text/csv;charset=utf-8');
}
function importFromText(text) {
  const status = $('#import-status');
  const say = (m, err) => {
    status.textContent = m; status.hidden = false;
    status.style.color = err ? 'var(--danger)' : 'var(--ink)';
    toast(m, err ? 'error' : undefined);
  };
  let data;
  try { data = JSON.parse(String(text).replace(/^\uFEFF/, '').trim()); }
  catch (e) { say("Texte illisible : ce n'est pas une sauvegarde JSON valide.", true); return; }
  if (data && !Array.isArray(data)) data = Array.isArray(data.sessions) ? data.sessions : [data];
  if (!Array.isArray(data) || !data.length) { say('Aucune séance trouvée dans cette sauvegarde.', true); return; }

  const known = new Set(app.sessions.map(x => x.id));
  const fresh = []; let dup = 0, bad = 0;
  data.forEach((raw, i) => {
    if (!raw || typeof raw !== 'object') { bad++; return; }
    if (!raw.id) raw.id = 'import_' + Date.now() + '_' + i;
    if (!raw.date) raw.date = new Date().toISOString();
    if (raw.currentEndIndex === undefined) raw.currentEndIndex = 0;
    if (!isValidSession(raw)) { bad++; return; }
    if (known.has(raw.id)) { dup++; return; }
    known.add(raw.id);
    const sess = normalizeSession(raw);
    sess.finished = true;
    fresh.push(sess);
  });
  if (fresh.length) {
    app.sessions = [...app.sessions, ...fresh].sort((x, y) => new Date(y.date) - new Date(x.date));
    saveSessions();
  }
  const parts = [`${fresh.length} séance${fresh.length > 1 ? 's' : ''} importée${fresh.length > 1 ? 's' : ''}`];
  if (dup) parts.push(`${dup} déjà présente${dup > 1 ? 's' : ''}`);
  if (bad) parts.push(`${bad} ignorée${bad > 1 ? 's' : ''} (format inconnu)`);
  say(parts.join(', ') + '.', !fresh.length && bad > 0);
  if (fresh.length) $('#paste-json').value = '';
}
function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => importFromText(reader.result);
  reader.onerror = () => { const st = $('#import-status'); st.hidden = false; st.style.color = 'var(--danger)'; st.textContent = 'Impossible de lire ce fichier.'; };
  reader.readAsText(file);
}
async function copyJSON() {
  if (!app.sessions.length) { toast('Aucune séance à copier.'); return; }
  const txt = JSON.stringify(app.sessions);
  try { await navigator.clipboard.writeText(txt); markBackedUp(); toast('Séances copiées : collez-les où vous voulez les garder.'); }
  catch (e) {
    const ta = $('#paste-json'); ta.value = txt; ta.focus(); ta.select();
    toast('Texte placé dans la zone ci-dessous : copiez-le manuellement.');
  }
}
async function resetAll() {
  if (!(await askConfirm('Supprimer définitivement TOUTES les séances de cet appareil ? Pensez à exporter une sauvegarde avant.', 'Tout supprimer'))) return;
  [KEYS.sessions, KEYS.unfinished].forEach(store.del);
  app.sessions = [];
  setSession(null);
  toast('Toutes les données ont été supprimées.');
}

/* ---------- Actions (délégation d'événements) ---------- */
const APP_VERSION = 'v16 · 20 oct. 2026';
let deferredInstall = null;
/* ---------- Ordre des fenêtres (pages Saisie et Stats) ---------- */
const ORD_LABELS = {
  statut: 'Résumé', volee: 'Volée en cours', mode: 'Boutons Clavier / Cible', saisie: 'Saisie des flèches', notes: 'Notes de la séance', feuille: 'Feuille de marque',
  kpis: 'Chiffres clés', objectif: 'Objectif', evolution: 'Évolution', regularite: 'Régularité', repartition: 'Répartition',
  carte: 'Carte des impacts', volees: 'Cartographie par volée', records: 'Records', volume: "Volume d'entraînement"
};
const ordRoot = tab => tab === 'stats' ? $('#tab-stats') : $('#shoot-main');
const ordBlocks = tab => $$('[data-ord]', ordRoot(tab));
const ordIds = tab => ordBlocks(tab).sort((a, b) => a.style.order - b.style.order).map(el => el.dataset.ord);

function applyOrder() {
  const saved = store.get(KEYS.order, {});
  const ids = saved.shoot || [];            // ancien ordre enregistré : les boutons de mode se placent juste avant la saisie
  if (ids.includes('saisie') && !ids.includes('mode')) ids.splice(ids.indexOf('saisie'), 0, 'mode');
  ['shoot', 'stats'].forEach(tab => ordBlocks(tab).forEach((el, i) => {
    const k = (saved[tab] || []).indexOf(el.dataset.ord);
    el.style.order = k < 0 ? 1000 + i : k;       // fenêtres inconnues : à la fin, dans l'ordre d'origine
  }));
  $$('.ord-bar').forEach(b => { b.style.order = b.nextElementSibling.style.order; b.hidden = b.nextElementSibling.hidden; });
}
function moveBlock(tab, id, dir) {
  const ids = ordIds(tab), shown = k => !$(`[data-ord="${k}"]`, ordRoot(tab)).hidden;
  const i = ids.indexOf(id);
  let j = i + dir;
  while (j >= 0 && j < ids.length && !shown(ids[j])) j += dir;   // saute les fenêtres masquées
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  const saved = store.get(KEYS.order, {});
  saved[tab] = ids;
  store.set(KEYS.order, saved);
  applyOrder();
  const bar = $(`.ord-bar[data-for="${id}"]`);
  if (bar) bar.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
function startReorder(tab) {
  if (tab === 'shoot' && !app.session) { toast('Démarrez ou ouvrez une séance pour réorganiser la page Saisie.'); return; }
  if (tab === 'stats' && !app.sessions.length) { toast('Terminez une séance pour réorganiser la page Stats.'); return; }
  switchTab(tab);
  app.reorder = tab;
  document.body.classList.add('reorder');
  $('#ord-top').hidden = false;
  ordBlocks(tab).forEach(el => {
    const bar = document.createElement('div');
    bar.className = 'ord-bar';
    bar.dataset.for = el.dataset.ord;
    bar.innerHTML = `<span>${esc(ORD_LABELS[el.dataset.ord] || el.dataset.ord)}</span><span class="row">` +
      `<button class="btn sm icon-only" data-action="ord-move" data-dir="-1" aria-label="Monter">↑</button>` +
      `<button class="btn sm icon-only" data-action="ord-move" data-dir="1" aria-label="Descendre">↓</button></span>`;
    el.parentNode.insertBefore(bar, el);
  });
  applyOrder();
}
function endReorder() {
  if (!app.reorder) return;
  app.reorder = null;
  $$('.ord-bar').forEach(b => b.remove());
  $('#ord-top').hidden = true;
  document.body.classList.remove('reorder');
}

const actions = {
  'ord-start': d => startReorder(d.tab),
  'ord-move': (d, b) => moveBlock(app.reorder, b.closest('.ord-bar').dataset.for, +d.dir),
  'ord-end': () => endReorder(),
  'ord-reset': () => { store.del(KEYS.order); applyOrder(); toast('Ordre par défaut rétabli.'); },
  'edit-arrow': d => openEdit(+d.e, +d.i),
  'edit-set': d => applyEdit(d.v),
  'share-image': () => app.summarySession && shareSummaryImage(app.summarySession),
  'print-session': () => app.summarySession && printSession(app.summarySession),
  'gear-add': () => addGear(),
  'gear-del': d => delGear(d.id),
  'map-view': d => { app.mapView = d.view; renderImpactMap(); },
  'refresh-app': async () => {
    try {
      const regs = navigator.serviceWorker ? await navigator.serviceWorker.getRegistrations() : [];
      await Promise.all(regs.map(r => r.unregister()));
      if (window.caches) { const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k))); }
    } catch (e) {}
    toast('Mise à jour en cours…');
    setTimeout(() => location.reload(), 700);
  },
  tab: d => switchTab(d.tab),
  new: () => showSetup(),
  start: () => startSession(),
  resume: () => resumeSession(),
  discard: async () => {
    if (!(await askConfirm('Abandonner la séance en cours ? Les flèches saisies seront perdues.', 'Abandonner'))) return;
    store.del(KEYS.unfinished);
    if (app.session && !app.session.finished) setSession(null);
    $('#resume-box').hidden = true;
  },
  close: d => $('#' + d.target).close(),
  preset: d => { const p = PRESETS[+d.i]; fillSetup({ distance: p.distance, target: p.target, ape: p.ape, ends: p.ends }); },
  score: d => addArrow(d.v),
  undo: () => undo(),
  'clear-end': () => clearEnd(),
  mode: d => setMode(d.mode),
  'finish-early': () => finishEarly(),
  summary: () => app.session && openSummary(app.session),
  'summary-stats': () => { $('#dlg-summary').close(); switchTab('stats'); },
  reopen: async () => { if (await reopen()) toast('Séance rouverte : annulez une flèche pour corriger.'); },
  'open-session': d => openSession(d.id),
  'delete-session': d => deleteSession(d.id),
  'export-json': () => exportJSON(),
  'export-csv': () => exportCSV(),
  'copy-json': () => copyJSON(),
  'share-backup': () => shareBackup(),
  'snooze-backup': () => { const b = getBackup(); b.snooze = app.sessions.length + 3; store.set(KEYS.backup, b); renderBackupBanner(); },
  feel: d => setFeel(+d.v),
  'end-toggle': d => { const n = +d.e; if (app.endsSel.has(n)) app.endsSel.delete(n); else app.endsSel.add(n); renderEndsCard(); },
  'ends-all': () => { endStatsFor(app.endsSession === 'ALL' ? app.statsData : app.statsData.filter(x => x.id === app.endsSession)).forEach(e => app.endsSel.add(e.i)); renderEndsCard(); },
  'ends-none': () => { app.endsSel.clear(); renderEndsCard(); },
  install: async () => {
    if (!deferredInstall) {
      // Le navigateur ne propose pas l'installation automatique : on guide l'utilisateur.
      $('#install-help').style.cssText = 'margin:10px 0 0;font-size:15px;font-weight:650;color:var(--ink)';
      $('#install-help').scrollIntoView({ block: 'center' });
      toast("Installation automatique indisponible : suivez les étapes indiquées.");
      return;
    }
    deferredInstall.prompt();
    try { await deferredInstall.userChoice; } catch (e) {}
    deferredInstall = null;
  },
  'import-text': () => importFromText($('#paste-json').value),
  reset: () => resetAll()
};

function bindEvents() {
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-action]');
    if (!b || b.disabled) return;
    const fn = actions[b.dataset.action];
    if (fn) fn(b.dataset, b, e);
  });

  // Cible : toucher pour placer, glisser pour ajuster, relâcher pour valider
  const svg = $('#svg-target');
  let dragging = false;
  const place = e => { const p = pointerToSvg(e); setPending(p.x, p.y, p.touch ? { x: p.fx, y: p.fy } : null); };
  svg.addEventListener('pointerdown', e => {
    if (app.mode !== 'target' || !app.session || app.session.finished) return;
    e.preventDefault();
    dragging = true;
    try { svg.setPointerCapture(e.pointerId); } catch (err) {}
    place(e);
  });
  svg.addEventListener('pointermove', e => { if (dragging) place(e); });
  // Relâcher le doigt valide la flèche ; une interruption (appel, geste système) l'annule.
  svg.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    confirmPending();
  });
  svg.addEventListener('pointercancel', () => {
    dragging = false;
    app.pending = null;
    renderPending();
  });

  $('#cfg-distance').addEventListener('change', e => { $('#cfg-custom-wrap').hidden = e.target.value !== 'Custom'; });
  $('#f-dist').addEventListener('change', renderStats);
  $('#f-target').addEventListener('change', renderStats);
  $('#f-bow').addEventListener('change', renderStats);
  document.addEventListener('change', e => {
    if (e.target.classList && e.target.classList.contains('sight-input')) {
      const g = getSight(), v = parseFloat(e.target.value);
      if (v > 0) g[e.target.dataset.dist] = v; else delete g[e.target.dataset.dist];
      store.set(KEYS.sight, g);
      updateSights();
      return;
    }
    if (e.target.id === 'm-range') {
      app.mapRange = e.target.value;
      renderImpactMap();
      return;
    }
    if (e.target.id === 'e-session') {
      app.endsSession = e.target.value;
      app.endsSel.clear();
      renderEndsCard();
      return;
    }
    if (e.target.id === 'g-input') {
      setGoal(e.target.dataset.key, Math.max(0, parseInt(e.target.value, 10) || 0));
      renderStats();
    }
  });
  ['pf-name', 'pf-bow'].forEach(id => $('#' + id).addEventListener('input', saveProfile));
  $('#pf-type').addEventListener('change', saveProfile);
  $('#pref-wake').addEventListener('change', savePrefs);
  $('#pref-backup').addEventListener('change', savePrefs);
  $('#pref-ref').addEventListener('change', savePrefs);
  $('#pref-weekly').addEventListener('change', savePrefs);
  $('#pref-theme').addEventListener('change', savePrefs);
  $('#pref-lang').addEventListener('change', () => {
    savePrefs();
    toast('Langue modifiée : rechargement…');
    setTimeout(() => location.reload(), 600);
  });
  ['n-weather', 'n-real', 'n-text'].forEach(id => $('#' + id).addEventListener('input', () => saveNotes(false)));
  $('#n-weather').addEventListener('change', () => saveNotes(true));
  document.addEventListener('visibilitychange', updateWakeLock);
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
  window.addEventListener('appinstalled', () => { deferredInstall = null; $('#btn-install').hidden = true; toast('Application installée.'); });
  $('#file-import').addEventListener('change', e => {
    const f = e.target.files[0];
    if (f) importJSON(f);
    e.target.value = '';
  });

  // Fermeture des dialogues en touchant l'arrière-plan
  $$('dialog').forEach(dlg => dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); }));

  // Raccourcis clavier (ordinateur) : 1-9, 0 = 10, X, M, Retour arrière = annuler
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.querySelector('dialog[open]')) return;
    if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (app.tab !== 'shoot' || !app.session || app.session.finished || app.mode !== 'keys') return;
    const k = e.key.toLowerCase();
    if (k === 'backspace') { e.preventDefault(); undo(); return; }
    const v = k === 'x' ? 'X' : k === 'm' ? 'M' : k === '0' ? '10' : /^[1-9]$/.test(k) ? k : null;
    if (v) addArrow(v);
  });
}

/* ---------- Démarrage ---------- */
function init() {
  app.sessions = loadSessions();
  app.mode = store.get(KEYS.mode, 'keys') === 'target' ? 'target' : 'keys';
  hydrateIcons();
  renderPresets();
  bindEvents();
  applyOrder();
  applyTheme();
  renderBackupBanner();
  $('#app-version').textContent = APP_VERSION;

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then(() => { $('#pwa-status').textContent = 'Fonctionne hors ligne : prête à être utilisée en salle sans réseau.'; })
      .catch(() => {});
  }
  if (window.matchMedia && matchMedia('(display-mode: standalone)').matches) {
    $('#pwa-status').textContent = 'Application installée.';
    $('#btn-install').hidden = true;
    $('#install-help').hidden = true;
  } else {
    const ua = navigator.userAgent;
    const help = $('#install-help');
    if (/iphone|ipad|ipod/i.test(ua)) help.textContent = 'iPhone / iPad : ouvrez cette page dans Safari, touchez Partager, puis « Sur l\'écran d\'accueil ».';
    else if (/android/i.test(ua)) help.textContent = 'Android : dans Chrome, touchez le menu ⋮ puis « Installer l\'application » (ou « Ajouter à l\'écran d\'accueil »).';
  }

  const u = loadUnfinished();
  if (u) {
    setSession(u);
    toast('Séance en cours reprise.');
  } else {
    renderShoot();
    showSetup();
  }
}
init();

})();
