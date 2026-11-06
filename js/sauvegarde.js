/* Carnet de Tir Cible — rappel, export/import, copies automatiques, partage de l'application.
   Script classique : partage ses variables avec les autres fichiers de js/ (voir l'ordre dans index.html). */
'use strict';

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
  let csv = EN ? 'Session,Date,Archer,Bow,Bow type,Distance,Actual distance,Target face,Conditions,Feel,Notes,End,Arrow,Score,Zone,X (cm),Y (cm),Arrow no.\n' : 'Séance;Date;Archer;Arc;Type d\'arc;Distance;Distance réelle;Blason;Conditions;Sensations;Notes;Volée;Flèche;Score;Zone;X (cm);Y (cm);N° de flèche\n';
  app.sessions.forEach(s => {
    const k = cmPerUnit(s.config);
    s.ends.forEach((end, e) => (end || []).forEach((a, i) => {
      const n = s.notes || {};
      csv += [s.id, s.date, q(s.archer), q(s.bow), q(s.bowType), s.config.distance, q(n.real), s.config.targetType, q(n.weather), n.feel || '', q(n.text), e + 1, i + 1, a.scoreVal, a.valStr,
        num(a.x == null ? null : +(a.x * k).toFixed(1)), num(a.y == null ? null : +(a.y * k).toFixed(1)), a.n || ''].join(SEP) + '\n';
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
    copySave('avant import');
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
  reader.onload = () => { importFromText(reader.result); $('#dlg-restore').close(); };
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
  copySave('avant effacement total');
  [KEYS.sessions, KEYS.unfinished].forEach(store.del);
  app.sessions = [];
  setSession(null);
  toast('Toutes les données ont été supprimées.');
}

/* ---------- Copies de sécurité automatiques (IndexedDB) ---------- */
const IS_IOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
function idbOpen() {
  return new Promise((res, rej) => {
    if (!window.indexedDB) { rej(new Error('IndexedDB indisponible')); return; }
    const r = indexedDB.open('carnet_tir', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('copies', { keyPath: 'ts' });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function copiesAll() {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const q = db.transaction('copies').objectStore('copies').getAll();
    q.onsuccess = () => res(q.result.sort((a, b) => b.ts - a.ts));
    q.onerror = () => rej(q.error);
  });
}
/* À appeler AVANT le changement : l'état est figé tout de suite, l'écriture se fait ensuite. */
async function copySave(reason) {
  if (!app.sessions.length) return;
  const data = JSON.stringify(app.sessions), count = app.sessions.length;
  try {
    const old = await copiesAll();
    const db = await idbOpen();
    const os = db.transaction('copies', 'readwrite').objectStore('copies');
    os.put({ ts: Math.max(Date.now(), old.length ? old[0].ts + 1 : 0), reason, count, data });
    old.slice(7).forEach(c => os.delete(c.ts));
  } catch (e) {}
}
async function renderCopies() {
  const box = $('#copies-list');
  let all = [];
  try { all = await copiesAll(); } catch (e) {}
  box.innerHTML = all.length
    ? all.map(c => `<div class="rec"><div><b>${fmtDate(new Date(c.ts).toISOString(), true)}</b><div class="muted" style="font-size:13px">${c.count} séances · ${esc(c.reason)}</div></div><button class="btn sm" data-action="copy-restore" data-ts="${c.ts}">Restaurer</button></div>`).join('')
    : '<p class="muted" style="margin:6px 0 0">Aucune copie pour l\'instant : la première est faite à la fin de votre prochaine séance.</p>';
}
async function restoreCopy(ts) {
  let c;
  try { c = (await copiesAll()).find(x => String(x.ts) === String(ts)); } catch (e) {}
  if (!c) return;
  let data;
  try { data = JSON.parse(c.data).filter(isValidSession).map(normalizeSession); } catch (e) { toast('Copie illisible.', 'error'); return; }
  const when = fmtDate(new Date(c.ts).toISOString(), true);
  if (!(await askConfirm(`Remplacer vos ${app.sessions.length} séances actuelles par les ${data.length} séances de la copie du ${when} ?`, 'Restaurer'))) return;
  await copySave('avant restauration');
  app.sessions = data.map(x => Object.assign(x, { finished: true }));
  saveSessions();
  if (app.session && app.session.finished) setSession(null);
  $('#dlg-restore').close();
  renderHistory();
  toast('Copie restaurée.');
}
async function clearCopies() {
  if (!(await askConfirm('Supprimer toutes les copies automatiques de cet appareil ?', 'Supprimer'))) return;
  try { (await idbOpen()).transaction('copies', 'readwrite').objectStore('copies').clear(); } catch (e) {}
  setTimeout(renderCopies, 150);
}
function autoDownload() {
  const d = new Date(), hm = String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0');
  download(`carnet_tir_cible_${today()}_${hm}.json`, JSON.stringify(app.sessions, null, 2), 'application/json');
  markBackedUp();
}

/* ---------- Partager l'application ---------- */
async function shareApp() {
  const url = new URL('./', location.href).href;
  const text = t("Carnet de Tir Cible : l'appli gratuite pour noter ses scores de tir à l'arc (volées, impacts, statistiques). Android : menu ⋮ puis « Installer l'application ». iPhone : Safari, Partager, puis « Sur l'écran d'accueil ».");
  try {
    if (navigator.share) { await navigator.share({ title: t('Carnet de Tir Cible'), text, url }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(text + '\n' + url); toast('Lien copié : collez-le dans un message.'); }
  catch (e) { toast(url); }
}
