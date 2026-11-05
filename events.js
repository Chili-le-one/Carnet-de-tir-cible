/* Carnet de Tir Cible — écouteurs d'événements (bindEvents).
   Script classique : partage ses variables avec les autres fichiers de js/ (voir l'ordre dans index.html). */
'use strict';

function bindEvents() {
  loupeInit();
  // Pas de sélection de texte ni de menu d'appui long (sauf dans les champs de saisie)
  const editable = n => !!(n && n.closest && n.closest('input,textarea,[contenteditable]'));
  document.addEventListener('selectstart', e => { if (!editable(e.target.nodeType === 3 ? e.target.parentElement : e.target)) e.preventDefault(); });
  document.addEventListener('contextmenu', e => { if (!editable(e.target)) e.preventDefault(); });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-action]');
    if (!b || b.disabled) return;
    const fn = actions[b.dataset.action];
    if (fn) fn(b.dataset, b, e);
  });

  // Cible : toucher pour placer, glisser pour ajuster, relâcher pour valider
  const svg = $('#svg-target');
  let dragging = false;
  const place = e => { const p = pointerToSvg(e); setPending(p.x, p.y, p.touch ? { x: p.fx, y: p.fy } : null); loupeMove(p); };
  svg.addEventListener('pointerdown', e => {
    if (app.mode !== 'target' || !app.session || app.session.finished) return;
    e.preventDefault();
    dragging = true;
    try { svg.setPointerCapture(e.pointerId); } catch (err) {}
    loupeStart();
    place(e);
  });
  svg.addEventListener('pointermove', e => { if (dragging) place(e); });
  // Relâcher le doigt valide la flèche ; une interruption (appel, geste système) l'annule.
  svg.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    loupeStop();
    confirmPending();
  });
  svg.addEventListener('pointercancel', () => {
    dragging = false;
    loupeStop();
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
  $('#dlg-endnotes').addEventListener('close', () => { if (app.endNotesFor) endNotesClose(false); });
  $('#timer-dur').addEventListener('change', e => {
    if (timer.running) { timerFillDur(); return; }
    store.set(KEYS.prefs, Object.assign({}, getPrefs(), { timerEnd: +e.target.value }));
    timerReset();
  });
  ['pref-timer', 'pref-timer-end', 'pref-timer-sound', 'pref-autodl', 'pref-loupe', 'pref-loupe-zoom'].forEach(id => $('#' + id).addEventListener('change', savePrefs));
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
