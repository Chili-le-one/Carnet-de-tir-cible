/* Carnet de Tir Cible — navigation entre onglets et table des actions (boutons).
   Script classique : partage ses variables avec les autres fichiers de js/ (voir l'ordre dans index.html). */
'use strict';

/* ---------- Navigation ---------- */
function switchTab(tab) {
  endReorder();
  app.tab = tab;
  applyQuick();
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

/* ---------- Actions (délégation d'événements) ---------- */

const APP_VERSION = 'v29 · 11 nov. 2026';
let deferredInstall = null;

const actions = {
  'timer-pref': () => {
    const p = getPrefs();
    store.set(KEYS.prefs, Object.assign({}, p, { timer: !p.timer }));
    const b = $('.ord-bar[data-for="minuteur"] [data-action="timer-pref"]');
    if (b) b.textContent = p.timer ? 'Afficher' : 'Masquer';
    timerRender();
  },
  'timer-hide': () => { store.set(KEYS.prefs, Object.assign({}, getPrefs(), { timer: false })); timerRender(); toast('Minuteur masqué : réaffichez-le dans Réglages ou en mode Disposition.'); },
  'timer-toggle': () => timerToggle(),
  'timer-reset': () => timerReset(),
  'hist-fold': d => Array.from($$('#history-list details')).forEach(el => { el.open = d.open === '1'; }),
  'contest-open': () => contestOpen(),
  'contest-edit': d => contestOpen(d.id),
  'ct-mode': d => { ct.mode = d.m; ctRender(); },
  'ct-cell': d => { ct.sel = { e: +d.e, i: +d.i }; ctRenderGrid(); },
  'ct-key': d => ctKey(d.v),
  'ct-save': () => ctSave(),
  'cal-prev': () => calMove(-1),
  'cal-next': () => calMove(1),
  'cal-day': d => { app.cal.sel = d.d; renderCalendar(); },
  'cal-contest-add': d => contestAdd(d.d),
  'cal-contest-del': d => contestDel(d.d),
  'copy-restore': d => restoreCopy(d.ts),
  'restore-open': () => { renderCopies(); $('#dlg-restore').showModal(); },
  'copies-clear': () => clearCopies(),
  'share-app': () => shareApp(),
  'qr-open': () => qrOpen(),
  'month-prev': () => monthMove(-1),
  'month-next': () => monthMove(1),
  'ord-start': d => startReorder(d.tab),
  'ord-move': (d, b) => moveBlock(app.reorder, b.closest('.ord-bar').dataset.for, +d.dir),
  'ord-end': () => endReorder(),
  'ord-reset': () => { store.del(KEYS.order); applyOrder(); toast('Ordre par défaut rétabli.'); },
  'edit-arrow': d => openEdit(+d.e, +d.i),
  'edit-set': d => applyEdit(d.v),
  'share-image': () => app.summarySession && shareSummaryImage(app.summarySession),
  'print-session': () => app.summarySession && printSession(app.summarySession),
  'num-pick': d => pickNum(+d.n),
  'edit-num': d => editNum(+d.n),
  'sheet-new': () => varOpen(null, null),
  'var-new': d => varOpen(d.sheet, null),
  'var-edit': d => varOpen(d.sheet, d.id),
  'var-save': () => varSave(),
  'var-del': d => varDel(d.sheet, d.id),
  'sheet-del': d => sheetDel(d.sheet),
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
  'tpl-start': d => { const c = templateCfg(d.id); if (c) startSession(c); },
  'tpl-save': () => tplSave(),
  'tpl-up': d => tplMove(d.id, -1),
  'tpl-down': d => tplMove(d.id, 1),
  'tpl-del': d => tplDel(d.id),
  'tpl-reset': () => tplReset(),
  'quick-toggle': () => quickToggle(),
  'en-feel': d => { endNotesFeel = endNotesFeel === +d.v ? 0 : +d.v; $$('#en-feel button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.v === endNotesFeel))); },
  'endnotes-save': () => endNotesClose(true),
  'endnotes-skip': () => endNotesClose(false),
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
