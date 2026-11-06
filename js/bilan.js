/* Carnet de Tir Cible — bilan de séance, aide au réglage du viseur, image partagée, impression.
   Script classique : partage ses variables avec les autres fichiers de js/ (voir l'ordre dans index.html). */
'use strict';

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
    c.fillText(`${t('Justesse')} : ${bias.dist.toFixed(1)} cm (${t(bias.text)}) · ${t('Groupement')} : ${bias.disp.toFixed(1)} cm`, W / 2, 1310);
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
  return { mx, my, disp, text, detail, k, dist: Math.hypot(mx, my) * k };
}

/* Trois notions distinctes :
   - Score : les points marqués.
   - Justesse : écart entre le centre du groupement et le centre de la cible.
   - Groupement : rayon moyen des impacts autour du centre du groupement. */
const biasMinis = b => `<div class="mini"><dt>Justesse</dt><dd>${b.dist.toFixed(1)} cm</dd><div class="muted" style="font-size:12px">${b.text} · ${b.detail}</div></div>
      <div class="mini"><dt>Groupement</dt><dd>${b.disp.toFixed(1)} cm</dd><div class="muted" style="font-size:12px">rayon moyen autour du centre du groupement</div></div>`;

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
  info.recs.forEach(r => {
    const nv = fresh ? 'Nouveau record' : 'Meilleur résultat';
    banner += r.type === 'format' ? `<div class="notice win">${nv} personnel sur ce format : ${r.v} pts (précédent : ${r.prev}).</div>`
      : r.type === 'distance' ? `<div class="notice win">${nv} à ${esc(s.config.distance)} : moyenne ${r.v.toFixed(2)} par flèche (précédent : ${r.prev.toFixed(2)}).</div>`
      : `<div class="notice win">${nv} sur ${r.n} flèches : ${r.v} pts (précédent : ${r.prev}).</div>`;
  });
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
      ${pts.length >= 6 && !s.noSight ? sightHtml(s.config.distance, bias.mx * bias.k, bias.my * bias.k) : ''}
      <p class="muted" style="margin:0;font-size:13px">Point rouge : centre du groupement (${pts.length} impacts).${pts.length >= ELLIPSE_MIN ? ' Ellipse : environ 2 flèches sur 3.' : ''} ${reliabNote(pts.length)}</p>`
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
    if (pts.length >= ELLIPSE_MIN) svg.querySelector('[data-layer=impacts]').insertAdjacentHTML('afterbegin', ellipseMarkup(ellipseOf(pts)));
  }
  updateSights();
  const dlg = $('#dlg-summary');
  if (!dlg.open) dlg.showModal();
}
