/* Carnet de Tir Cible — version, ordre des blocs (mode Disposition).
   Script classique : partage ses variables avec les autres fichiers de js/ (voir l'ordre dans index.html). */
'use strict';

/* ---------- Ordre des fenêtres (pages Saisie et Stats) ---------- */
const ORD_LABELS = {
  statut: 'Résumé', volee: 'Volée en cours', minuteur: 'Minuteur', mode: 'Boutons Clavier / Cible', saisie: 'Saisie des flèches', notes: 'Notes de la séance', feuille: 'Feuille de marque',
  kpis: 'Chiffres clés', objectif: 'Objectif', evolution: 'Évolution', regularite: 'Régularité', repartition: 'Répartition', numeros: 'Numéros de flèches',
  carte: 'Carte des impacts', volees: 'Cartographie par volée', records: 'Records', volume: "Volume d'entraînement", mois: 'Bilan du mois', periodes: 'Comparaison de périodes'
};
const ordRoot = tab => tab === 'stats' ? $('#tab-stats') : $('#shoot-main');
const ordBlocks = tab => $$('[data-ord]', ordRoot(tab));
const ordIds = tab => ordBlocks(tab).sort((a, b) => a.style.order - b.style.order).map(el => el.dataset.ord);

function applyOrder() {
  const saved = store.get(KEYS.order, {});
  const ids = saved.shoot || [];            // ancien ordre enregistré : les boutons de mode se placent juste avant la saisie
  if (ids.includes('saisie') && !ids.includes('mode')) ids.splice(ids.indexOf('saisie'), 0, 'mode');
  if (ids.includes('volee') && !ids.includes('minuteur')) ids.splice(ids.indexOf('volee') + 1, 0, 'minuteur');   // nouveau bloc : juste après la volée en cours
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
  timerRender();                                  // le minuteur reste visible (estompé s'il est désactivé) pour pouvoir le placer
  document.body.classList.add('reorder');
  applyQuick();
  $('#ord-top').hidden = false;
  ordBlocks(tab).forEach(el => {
    const bar = document.createElement('div');
    bar.className = 'ord-bar';
    bar.dataset.for = el.dataset.ord;
    bar.innerHTML = `<span>${esc(ORD_LABELS[el.dataset.ord] || el.dataset.ord)}</span><span class="row">` +
      (el.dataset.ord === 'minuteur' ? `<button class="btn sm" data-action="timer-pref">${getPrefs().timer ? 'Masquer' : 'Afficher'}</button>` : '') +
      `<button class="btn sm icon-only" data-action="ord-move" data-dir="-1" aria-label="Monter">↑</button>` +
      `<button class="btn sm icon-only" data-action="ord-move" data-dir="1" aria-label="Descendre">↓</button></span>`;
    el.parentNode.insertBefore(bar, el);
  });
  applyOrder();
}
function endReorder() {
  if (!app.reorder) return;
  app.reorder = null;
  timerRender();
  $$('.ord-bar').forEach(b => b.remove());
  $('#ord-top').hidden = true;
  document.body.classList.remove('reorder');
  applyQuick();
}
