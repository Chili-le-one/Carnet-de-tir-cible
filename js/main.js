/* Carnet de Tir Cible — démarrage de l'application.
   Script classique : partage ses variables avec les autres fichiers de js/ (voir l'ordre dans index.html). */
'use strict';

/* ---------- Démarrage ---------- */
function init() {
  app.sessions = loadSessions();
  app.mode = store.get(KEYS.mode, 'keys') === 'target' ? 'target' : 'keys';
  hydrateIcons();
  renderPresets();
  renderSheetSelect();
  bindEvents();
  applyOrder();
  applyTheme();
  renderBackupBanner();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  copiesAll().then(all => { if (app.sessions.length && (!all.length || Date.now() - all[0].ts > 20 * 3600e3)) copySave('quotidienne'); }).catch(() => {});
  $('#app-version').textContent = APP_VERSION;

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    const hadCtl = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadCtl) $('#update-banner').hidden = false; });
    navigator.serviceWorker.register('sw.js')
      .then(reg => { document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); }); return navigator.serviceWorker.ready; })
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
