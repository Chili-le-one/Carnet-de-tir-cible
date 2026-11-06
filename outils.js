/* Carnet de Tir Cible — notes de séance, écran allumé, minuteur de volée, loupe sur la cible.
   Script classique : partage ses variables avec les autres fichiers de js/ (voir l'ordre dans index.html). */
'use strict';

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

/* ---------- Écran toujours allumé ---------- */
const getPrefs = () => Object.assign({ wake: true, backupEvery: 5, refArrows: 60, weeklyGoal: 0, lang: 'auto', theme: 'carnet', timer: true, timerEnd: 120, timerSound: true, autoDl: false, loupe: true, loupeZoom: 3 }, store.get(KEYS.prefs, {}));
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

/* ---------- Minuteur de volée ---------- */
const timer = { sid: null, total: 0, left: 0, endAt: 0, running: false, iv: null, warned: false };
let audioCtx = null;
function audioUnlock() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx && AC) audioCtx = new AC();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) {}
}
function timerAlert(freq, ms, vib) {
  if (!getPrefs().timerSound) return;
  buzz(vib);
  if (!audioCtx) return;
  try {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = freq; g.gain.value = .25;
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + ms / 1000);
  } catch (e) {}
}
const timerTotal = () => getPrefs().timerEnd;      // durée totale d'une volée, indépendante du nombre de flèches et de la saisie
function timerStop() { clearInterval(timer.iv); timer.iv = null; timer.running = false; }
function timerReset() { timerStop(); timer.total = timer.left = timerTotal(); timer.warned = false; timerRender(); }
function timerToggle() {
  if (timer.running) {
    timer.left = Math.max(0, (timer.endAt - Date.now()) / 1000);
    timerStop();
  } else {
    if (timer.left <= 0) timer.left = timer.total;
    audioUnlock();
    timer.endAt = Date.now() + timer.left * 1000;
    timer.running = true;
    timer.iv = setInterval(timerTick, 250);
  }
  timerRender();
}
function timerTick() {
  timer.left = Math.max(0, (timer.endAt - Date.now()) / 1000);
  if (!timer.warned && timer.total > 45 && timer.left <= 30) { timer.warned = true; timerAlert(880, 150, 150); }
  if (timer.left <= 0) { timerStop(); timerAlert(440, 800, [300, 100, 300]); toast('Temps écoulé !'); }
  timerRender();
}
function timerFillDur() {
  const sel = $('#timer-dur'), cur = timerTotal();
  const fmt = n => Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0');
  const list = [...new Set([20, 30, 40, 60, 90, 120, 180, 240, 300, cur])].sort((a, b) => a - b);
  const sig = list.join(',');
  if (sel.dataset.sig !== sig) { sel.innerHTML = list.map(n => `<option value="${n}">${fmt(n)}</option>`).join(''); sel.dataset.sig = sig; }
  sel.value = String(cur);
  sel.disabled = timer.running;
}
function timerRender() {
  const s = app.session, box = $('#timer-box');
  timerFillDur();
  const on = !!(getPrefs().timer && s && !s.finished);
  const preview = app.reorder === 'shoot' && !!s;       // en mode « Disposition », on le montre même désactivé
  box.hidden = !(on || preview);
  box.classList.toggle('off', preview && !on);
  const fmt = n => Math.floor(Math.ceil(n) / 60) + ':' + String(Math.ceil(n) % 60).padStart(2, '0');
  if (!on) {
    timerStop(); timer.sid = null;
    if (preview) { $('#timer-time').textContent = fmt(timerTotal()); $('#timer-go-label').textContent = 'Démarrer'; $('#timer-go-ic').innerHTML = icon('play'); }
    return;
  }
  if (timer.sid !== s.id || (!timer.running && timer.total !== timerTotal())) {
    timerStop(); timer.sid = s.id; timer.total = timer.left = timerTotal(); timer.warned = false;
  }
  const sec = Math.ceil(timer.left), el = $('#timer-time');
  el.textContent = fmt(timer.left);
  el.className = 'timer-time' + (timer.running && sec <= 10 ? ' bad' : timer.running && sec <= 30 ? ' warn' : '');
  $('#timer-go-label').textContent = timer.running ? 'Pause' : (timer.left >= timer.total ? 'Démarrer' : (timer.left > 0 ? 'Reprendre' : 'Redémarrer'));
  $('#timer-go-ic').innerHTML = icon(timer.running ? 'pause' : 'play');
}

/* ---------- Loupe sur la cible (pendant la visée au doigt) ---------- */
const LOUPE_D = 124;                      // diamètre de la bulle, en pixels
let loupeEl = null, loupeSvg = null, loupeZone = null, loupeOn = false;
function loupeInit() {
  loupeEl = document.createElement('div');
  loupeEl.id = 'loupe'; loupeEl.hidden = true; loupeEl.setAttribute('aria-hidden', 'true');
  loupeEl.innerHTML = '<svg></svg><i class="lp-h"></i><i class="lp-v"></i><b class="lp-z"></b>';
  document.body.appendChild(loupeEl);
  loupeSvg = loupeEl.querySelector('svg');
  loupeZone = loupeEl.querySelector('.lp-z');
}
function loupeStart() {
  if (!getPrefs().loupe || !app.session) return;
  const src = $('#svg-target');
  // copie de la cible et des impacts déjà posés (sans le viseur)
  loupeSvg.setAttribute('viewBox', src.getAttribute('viewBox'));
  loupeSvg.innerHTML = [...src.children].filter(n => n.getAttribute('data-layer') !== 'extra').map(n => n.outerHTML).join('');
  loupeOn = true;
}
function loupeMove(pt) {
  if (!loupeOn || !app.session) return;
  const src = $('#svg-target'), ctm = src.getScreenCTM();
  if (!ctm) return;
  const half = LOUPE_D / 2 / (getPrefs().loupeZoom * ctm.a);          // demi-fenêtre en unités de la cible
  loupeSvg.setAttribute('viewBox', `${(pt.x - half).toFixed(2)} ${(pt.y - half).toFixed(2)} ${(2 * half).toFixed(2)} ${(2 * half).toFixed(2)}`);
  const q = src.createSVGPoint(); q.x = pt.x; q.y = pt.y;
  const s = q.matrixTransform(ctm), R = LOUPE_D / 2, W = window.innerWidth, H = window.innerHeight;
  let cx = s.x, cy = s.y - R - 26;                                      // au-dessus du viseur
  if (cy - R < 6) { cx = s.x + (s.x < W / 2 ? 1 : -1) * (R + 54); cy = s.y; }   // trop haut : sur le côté
  cx = Math.max(R + 6, Math.min(W - R - 6, cx));
  cy = Math.max(R + 6, Math.min(H - R - 6, cy));
  loupeEl.style.transform = `translate(${(cx - R).toFixed(0)}px, ${(cy - R).toFixed(0)}px)`;
  const z = zoneAt(pt.x, pt.y, face(app.session.config));
  loupeZone.textContent = z;
  loupeZone.className = 'lp-z ' + zoneClass(z);
  loupeEl.hidden = false;
}
function loupeStop() { loupeOn = false; if (loupeEl) loupeEl.hidden = true; }
