/* Carnet de Tir Cible — réglages : profil, préférences, journal du matériel.
   Script classique : partage ses variables avec les autres fichiers de js/ (voir l'ordre dans index.html). */
'use strict';

/* ---------- Réglages ---------- */
function renderSettings() {
  const pr = store.get(KEYS.profile, {}), pf = getPrefs();
  $('#pf-name').value = pr.name || '';
  $('#pf-bow').value = pr.bow || '';
  $('#pf-type').value = pr.type || '';
  $('#pref-wake').checked = !!pf.wake;
  $('#pref-timer').checked = !!pf.timer;
  $('#pref-timer-end').value = pf.timerEnd;
  $('#pref-timer-sound').checked = !!pf.timerSound;
  $('#pref-loupe').checked = !!pf.loupe;
  $('#pref-loupe-zoom').value = String(pf.loupeZoom);
  $('#pref-autodl').checked = !!pf.autoDl;
  $('#autodl-wrap').hidden = IS_IOS;
  renderCopies();
  renderTemplates();
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
    timer: $('#pref-timer').checked,
    timerEnd: Math.max(10, Math.min(900, parseInt($('#pref-timer-end').value, 10) || 120)),
    timerSound: $('#pref-timer-sound').checked,
    loupe: $('#pref-loupe').checked,
    loupeZoom: Math.max(2, Math.min(5, parseInt($('#pref-loupe-zoom').value, 10) || 3)),
    autoDl: $('#pref-autodl').checked,
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
  timerRender();
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
