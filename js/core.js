/* Carnet de Tir Cible — noyau : constantes, utilitaires, règles de score, état, séances.
   Script classique : partage ses variables avec les autres fichiers de js/ (voir l'ordre dans index.html). */
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
  order: 'carnet_tir_ordre',
  contests: 'carnet_tir_concours',
  templates: 'carnet_tir_modeles'
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
  play: '<path d="M7 4v16l13-8z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
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
    ...(cfg.sight === 'no' ? { noSight: true } : {}),   // séance sans viseur : pas d'aide au réglage
    ...(cfg.goal ? { goal: cfg.goal } : {}),             // objectif propre à la séance (modèle)
    ...(cfg.quick ? { quick: true } : {}),               // saisie rapide : écran réduit, notes à la fin
    currentEndIndex: 0,
    ends: []
  };
}
function setSession(s) {
  app.session = s;
  app.pending = null;
  renderShoot();
}

/* ---------- Statistiques ---------- */
const fmtDate = (iso, long) => new Date(iso).toLocaleDateString(window.__LOCALE || 'fr-FR',
  long ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: 'short' });
