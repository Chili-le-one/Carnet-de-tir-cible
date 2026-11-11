/* Carnet de Tir Cible — repères d'interface : bouton « i » (explications) et cartes dépliables de l'onglet Stats.
   Script classique : partage ses variables avec les autres fichiers de js/ (voir l'ordre dans index.html).
   Tout se fait tout seul : une explication marquée class="hint" est masquée et un « i » apparaît à côté du titre
   de sa carte ; les cartes des Stats se replient (sauf celles marquées data-fold="open"). */
'use strict';

const UI_SCOPE = '#tab-stats .card, #tab-history .card, #tab-data .card';

function uiDecorate() {
  $$(UI_SCOPE).forEach(card => {
    const h = card.querySelector('h2, h3');
    if (!h || h.closest('.card') !== card) return;

    // Bouton « i » : seulement si la carte contient des explications
    if (card.querySelector('.hint') && !h.querySelector('.info-btn')) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'info-btn';
      b.setAttribute('aria-label', 'Explication');
      b.setAttribute('aria-expanded', String(card.classList.contains('hints-on')));
      h.appendChild(b);
    }

    // Cartes dépliables : uniquement dans l'onglet Stats (la zone de filtres reste ouverte)
    if (!card.closest('#tab-stats') || card.classList.contains('ord-fixed')) return;
    const head = Array.from(card.children).find(c => c === h || c.contains(h));
    if (!head) return;
    if (!card.classList.contains('foldable')) {
      card.classList.add('foldable');
      if (card.dataset.fold !== 'open') card.classList.add('folded');
    }
    head.classList.add('fold-head');
    h.classList.add('fold-title');
    h.setAttribute('role', 'button');
    h.tabIndex = 0;
    h.setAttribute('aria-expanded', String(!card.classList.contains('folded')));
  });
}

function uiToggleFold(card) {
  card.classList.toggle('folded');
  const t = card.querySelector('.fold-title');
  if (t) t.setAttribute('aria-expanded', String(!card.classList.contains('folded')));
}

// Phase de capture : le « i » ne doit ni déplier une section (summary) ni déclencher une autre action.
document.addEventListener('click', e => {
  const info = e.target.closest('.info-btn');
  if (info) {
    e.preventDefault();
    e.stopPropagation();
    const card = info.closest('.card');
    card.classList.toggle('hints-on');
    const on = card.classList.contains('hints-on');
    card.querySelectorAll('.info-btn').forEach(b => b.setAttribute('aria-expanded', String(on)));
    return;
  }
  const head = e.target.closest('.card.foldable .fold-head');
  if (head && !e.target.closest('button, select, input, label, a')) uiToggleFold(head.closest('.card'));
}, true);

document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const t = e.target.closest && e.target.closest('.card.foldable .fold-title');
  if (!t || e.target !== t) return;
  e.preventDefault();
  uiToggleFold(t.closest('.card'));
});

// Les cartes sont réécrites à chaque affichage : on réapplique les repères juste après (avant l'affichage à l'écran).
const uiObserver = new MutationObserver(uiDecorate);
['#tab-stats', '#tab-history', '#tab-data'].forEach(sel => {
  const el = $(sel);
  if (el) uiObserver.observe(el, { childList: true, subtree: true });
});
uiDecorate();
