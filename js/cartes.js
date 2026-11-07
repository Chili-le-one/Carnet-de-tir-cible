/* Carnet de Tir Cible — onglet Stats : carte des impacts, ellipse, cartographie par volée.
   Script classique : partage ses variables avec les autres fichiers de js/ (voir l'ordre dans index.html). */
'use strict';

/* Cartographie par volée : un seul point moyen par volée */
function endStatsFor(list) {
  const m = new Map();
  list.forEach(sess => {
    const k = cmPerUnit(sess.config);
    (sess.ends || []).forEach((end, i) => {
      if (!end || !end.length) return;
      const g = m.get(i) || { pts: [], scores: [] };
      end.forEach(a => {
        g.scores.push(a.scoreVal);
        if (a.x != null && a.y != null) g.pts.push({ x: a.x, y: a.y, k });
      });
      m.set(i, g);
    });
  });
  return [...m.entries()].filter(([, g]) => g.pts.length).sort((a, b) => a[0] - b[0]).map(([i, g]) => ({
    i, pts: g.pts, b: biasOf(g.pts), n: g.scores.length, sum: g.scores.reduce((x, y) => x + y, 0), avg: g.scores.reduce((x, y) => x + y, 0) / g.scores.length
  }));
}

/* Comparaison de deux volées (celles que l'on a touchées) : moyenne, total, justesse, groupement. */
function compareEnds(a, b, all) {
  const sg = (v, dec) => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v).toFixed(dec);
  const dir = e => { const dx = e.b.mx * e.b.k, dy = e.b.my * e.b.k; return `${dx < 0 ? '←' : '→'} ${Math.abs(dx).toFixed(1)} · ${dy < 0 ? '↑' : '↓'} ${Math.abs(dy).toFixed(1)}`; };
  const gap = Math.hypot(a.b.mx - b.b.mx, a.b.my - b.b.my) * (a.b.k + b.b.k) / 2;
  const row = (l, x, y, d) => `<tr><td>${l}</td><td>${x}</td><td>${y}</td><td><b>${d}</b></td></tr>`;
  return `<div style="margin:0 0 10px"><h3 style="margin:0 0 6px">Comparaison de deux volées</h3>
    <div class="table-wrap"><table><thead><tr><th></th><th>V${a.i + 1}</th><th>V${b.i + 1}</th><th>Écart</th></tr></thead><tbody>
      ${row('Moyenne par flèche', a.avg.toFixed(2), b.avg.toFixed(2), sg(b.avg - a.avg, 2))}
      ${all ? '' : row('Total', a.sum, b.sum, sg(b.sum - a.sum, 0))}
      ${row('Justesse (cm)', dir(a), dir(b), '')}
      ${row('Groupement (cm)', a.b.disp.toFixed(1), b.b.disp.toFixed(1), sg(b.b.disp - a.b.disp, 1))}
    </tbody></table></div>
    <p style="margin:8px 0 0;font-weight:650">Distance entre les deux points moyens : ${gap.toFixed(1)} cm.</p>
    <p class="muted" style="margin:4px 0 0;font-size:13px">Écart : seconde volée moins première. Groupement : plus petit = plus serré.</p></div>`;
}

function renderEndsCard() {
  const card = $('#ends-card');
  const data = app.statsData || [];
  const withPts = data.filter(x => sessionStats(x).arrows.some(a => a.x != null && a.y != null));
  card.hidden = false;
  if (!withPts.length) {
    card.innerHTML = `<h3 style="margin-bottom:6px">Cartographie par volée</h3>
      <p class="muted" style="margin:0">Aucun impact enregistré pour ces filtres. Pour obtenir un point moyen par volée, placez vos flèches avec le mode « Cible » de l'onglet Saisie : le clavier n'enregistre pas la position des flèches.</p>`;
    return;
  }

  if (app.endsSession !== 'ALL' && !withPts.some(x => x.id === app.endsSession)) {
    app.endsSession = [...withPts].sort((a, b) => new Date(b.date) - new Date(a.date))[0].id;
  }
  const all = app.endsSession === 'ALL';
  const list = all ? withPts : withPts.filter(x => x.id === app.endsSession);
  const eps = endStatsFor(list);
  const color = j => `hsl(${Math.round(210 - 210 * (eps.length > 1 ? j / (eps.length - 1) : 0))} 80% 42%)`;
  const allTri = list.every(x => x.config.targetType === 'Trispot');

  let spread = 0;
  eps.forEach((a, i) => eps.slice(i + 1).forEach(b => {
    const k = (a.b.k + b.b.k) / 2;
    spread = Math.max(spread, Math.hypot(a.b.mx - b.b.mx, a.b.my - b.b.my) * k);
  }));

  const opts = `<option value="ALL"${all ? ' selected' : ''}>Toutes les séances (moyenne par n° de volée)</option>` +
    [...withPts].sort((a, b) => new Date(b.date) - new Date(a.date)).map(x =>
      `<option value="${esc(x.id)}"${x.id === app.endsSession ? ' selected' : ''}>${esc(fmtDate(x.date, true))} · ${esc(x.config.distance)} · ${sessionStats(x).total} pts</option>`).join('');

  const picked = eps.filter(e => app.endsSel.has(e.i));
  const chips = eps.map((e, j) =>
    `<button class="endchip" style="--c:${color(j)}" data-action="end-toggle" data-e="${e.i}" aria-pressed="${app.endsSel.has(e.i)}" aria-label="Volée ${e.i + 1}">${e.i + 1}</button>`).join('');

  const rows = eps.map((e, j) => {
    const dx = e.b.mx * e.b.k, dy = e.b.my * e.b.k;
    return `<tr><td><span class="sc" style="background:${color(j)};color:#fff">${e.i + 1}</span></td><td>${e.avg.toFixed(1)}</td>` +
      `<td>${dx < 0 ? '←' : '→'} ${Math.abs(dx).toFixed(1)} · ${dy < 0 ? '↑' : '↓'} ${Math.abs(dy).toFixed(1)}</td><td>${e.b.disp.toFixed(1)}</td></tr>`;
  }).join('');

  card.innerHTML = `<h3 style="margin-bottom:4px">Cartographie par volée</h3>
    <p class="muted" style="margin:0 0 10px;font-size:13px">Un point moyen par volée, de la première (bleu) à la dernière (rouge).</p>
    <label>Séance<select id="e-session">${opts}</select></label>
    <div class="target-wrap" style="margin-top:12px"><svg id="svg-ends" class="map" role="img" aria-label="Points moyens de chaque volée"></svg></div>
    <div class="row between" style="margin-top:8px">
      <span class="muted" style="font-size:13px">Touchez des volées pour voir leurs impacts.</span>
      <span class="row"><button class="btn sm" data-action="ends-all">Tout</button><button class="btn sm" data-action="ends-none">Aucune</button></span>
    </div>
    <div class="chips">${chips}</div>
    ${eps.length > 1 ? `<p style="margin:0 0 8px;font-weight:650">Écart maximal entre deux volées : ${spread.toFixed(1)} cm</p>` : ''}
    ${picked.length === 2 ? compareEnds(picked[0], picked[1], all) : '<p class="muted" style="margin:0 0 10px;font-size:13px">Pour comparer deux volées, touchez-en exactement deux.</p>'}
    <div class="table-wrap"><table>
      <thead><tr><th>Volée</th><th>Moy.</th><th>Justesse (cm)</th><th>Groupement (cm)</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <p class="muted" style="margin:8px 0 0;font-size:13px">${all ? 'Moyenne de toutes les séances filtrées pour chaque numéro de volée. ' : ''}Justesse : position du point moyen par rapport au centre (← gauche, → droite, ↑ haut, ↓ bas).</p>`;

  const svg = $('#svg-ends');
  drawFace(svg, { tri: allTri, minRing: allTri ? 5 : 1, extent: allTri ? 60 : 100, diam: 40 });
  let h = '';
  if (eps.length > 1) {
    h += `<polyline points="${eps.map(e => `${e.b.mx.toFixed(1)},${e.b.my.toFixed(1)}`).join(' ')}" fill="none" stroke="#111" stroke-width=".7" stroke-dasharray="1.5 1.5" opacity=".55"/>`;
  }
  eps.forEach((e, j) => {
    if (app.endsSel.has(e.i)) e.pts.forEach(p => { h += `<circle cx="${p.x}" cy="${p.y}" r="1.9" fill="${color(j)}" stroke="#fff" stroke-width=".6"/>`; });
  });
  eps.forEach((e, j) => {
    h += `<circle cx="${e.b.mx.toFixed(1)}" cy="${e.b.my.toFixed(1)}" r="3.6" fill="${color(j)}" stroke="#fff" stroke-width="1"/>` +
      `<text x="${e.b.mx.toFixed(1)}" y="${(e.b.my + 1.5).toFixed(1)}" text-anchor="middle" font-size="4.2" font-weight="800" fill="#fff">${e.i + 1}</text>`;
  });
  svg.querySelector('[data-layer=impacts]').innerHTML = h;
}

/* Carte des impacts : densité (par défaut) ou points, sur une période au choix,
   avec point moyen et ellipse de regroupement. */
/* Ellipse de covariance à 68 % : demi-axes = 1,51 × écart-type (covariance d'échantillon, n − 1) le long des axes principaux.
   Elle ne s'affiche qu'à partir de ELLIPSE_MIN flèches placées et l'estimation est jugée fiable à partir de RELIABLE_N. */
const ELLIPSE_K = 1.51, ELLIPSE_MIN = 9, RELIABLE_N = 30;

function ellipseOf(pts) {
  const n = pts.length;
  if (n < 3) return null;
  const mx = pts.reduce((t, p) => t + p.x, 0) / n, my = pts.reduce((t, p) => t + p.y, 0) / n;
  let sxx = 0, syy = 0, sxy = 0;
  pts.forEach(p => { const dx = p.x - mx, dy = p.y - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; });
  sxx /= n - 1; syy /= n - 1; sxy /= n - 1;
  const tr = (sxx + syy) / 2, df = Math.sqrt(((sxx - syy) / 2) ** 2 + sxy * sxy);
  return { mx, my, rx: Math.max(1, ELLIPSE_K * Math.sqrt(tr + df)), ry: Math.max(1, ELLIPSE_K * Math.sqrt(Math.max(tr - df, 0))),
           ang: 0.5 * Math.atan2(2 * sxy, sxx - syy) * 180 / Math.PI };
}

function ellipseMarkup(e) {
  const tf = `rotate(${e.ang.toFixed(1)} ${e.mx.toFixed(1)} ${e.my.toFixed(1)})`;
  const at = `cx="${e.mx.toFixed(1)}" cy="${e.my.toFixed(1)}" rx="${e.rx.toFixed(1)}" ry="${e.ry.toFixed(1)}" transform="${tf}" fill="none"`;
  return `<ellipse ${at} stroke="#fff" stroke-width="2.4"/><ellipse ${at} stroke="#111" stroke-width="1" stroke-dasharray="3 2"/>`;
}

const reliabNote = n => n < ELLIPSE_MIN ? `Ellipse affichée à partir de ${ELLIPSE_MIN} flèches placées (${n} pour l'instant).`
  : n < RELIABLE_N ? `Estimation provisoire (${n} flèches placées) : fiable à partir de ${RELIABLE_N}.`
  : `Estimation fiable (${n} flèches placées).`;

function renderImpactMap() {
  const box = $('#map-box');
  const sorted = [...(app.statsData || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  const withPts = sorted.filter(x => sessionStats(x).arrows.some(a => a.x != null && a.y != null));
  if (!withPts.length) {
    box.innerHTML = '<p class="muted" style="margin:6px 0 0">Aucun impact enregistré : placez vos flèches en mode Cible pour obtenir la carte et la tendance de tir.</p>';
    return;
  }
  const count = app.mapRange === 'all' ? withPts.length : Math.min(parseInt(app.mapRange, 10), withPts.length);
  const list = withPts.slice(0, count);
  const pts = [];
  list.forEach(x => { const k = cmPerUnit(x.config); sessionStats(x).arrows.forEach(a => { if (a.x != null && a.y != null) pts.push({ x: a.x, y: a.y, k }); }); });
  const allTri = list.every(x => x.config.targetType === 'Trispot');
  const f = { tri: allTri, minRing: allTri ? 5 : 1, extent: allTri ? 60 : 100, diam: 40 };
  const bias = biasOf(pts);
  const view = app.mapView;
  const dists = new Set(list.map(x => x.config.distance));
  const sightBlock = (dists.size === 1 && pts.length >= 12 && list.every(x => !x.noSight)) ? sightHtml([...dists][0], bias.mx * bias.k, bias.my * bias.k) : '';
  const ranges = [['all', `Toutes les séances (${withPts.length})`], ['10', '10 dernières séances'], ['5', '5 dernières séances'], ['1', 'Dernière séance']];

  box.innerHTML = `
    <div class="seg" role="group" aria-label="Type d'affichage">
      <button data-action="map-view" data-view="density" aria-pressed="${view === 'density'}">Densité</button>
      <button data-action="map-view" data-view="points" aria-pressed="${view === 'points'}">Points</button>
    </div>
    <label>Période<select id="m-range">${ranges.map(([v, l]) => `<option value="${v}"${v === app.mapRange ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
    <div class="target-wrap" style="margin-top:12px"><svg id="svg-stats-map" class="map" role="img" aria-label="Carte des impacts"></svg></div>
    <div class="grid2" style="margin-top:10px">
      ${biasMinis(bias)}
      <div class="mini"><dt>Impacts</dt><dd>${pts.length}</dd><div class="muted" style="font-size:12px">${count} séance${count > 1 ? 's' : ''}</div></div>
      <div class="mini" id="m-group"><dt>Ellipse</dt><dd>–</dd><div class="muted" style="font-size:12px">à partir de ${ELLIPSE_MIN} flèches</div></div>
    </div>
    ${sightBlock}
    <p class="muted" style="margin:10px 0 0;font-size:13px">${view === 'density'
      ? 'Plus une zone est foncée, plus vous y avez tiré.' : 'Chaque point est une flèche.'}
      Point rouge : centre du groupement. Ellipse : zone où tombent environ 2 flèches sur 3 (calculée dès ${ELLIPSE_MIN} flèches).</p>
    <p class="muted" style="margin:6px 0 0;font-size:13px">Justesse : écart entre le centre du groupement et le centre de la cible. Groupement : rayon moyen des impacts autour du centre du groupement.</p>
    <p style="margin:6px 0 0;font-weight:650">${reliabNote(pts.length)}</p>`;

  const svg = $('#svg-stats-map');
  drawFace(svg, f);
  const pad = f.extent + 4;
  // Léger voile clair : la cible garde ses couleurs, les impacts ressortent
  let h = `<rect x="${-pad}" y="${-pad}" width="${pad * 2}" height="${pad * 2}" fill="#fff" opacity=".12"/>`;
  if (view === 'density') {
    const op = Math.max(.08, Math.min(.55, 8 / Math.pow(pts.length, .8)));
    h += '<defs><filter id="blur-density" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>' +
      '<g filter="url(#blur-density)">' +
      pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="8" fill="#6d0fb8" opacity="${op.toFixed(3)}"/>`).join('') + '</g>';
  } else {
    h += pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="1.5" fill="#0b2f5e" stroke="#fff" stroke-width=".35" opacity=".8"/>`).join('');
  }
  if (pts.length >= ELLIPSE_MIN) {
    const e = ellipseOf(pts);
    h += ellipseMarkup(e);
    const w = (2 * Math.max(e.rx, e.ry) * bias.k).toFixed(0), hh = (2 * Math.min(e.rx, e.ry) * bias.k).toFixed(0);
    $('#m-group').innerHTML = `<dt>Ellipse</dt><dd>${w} × ${hh} cm</dd><div class="muted" style="font-size:12px">grand × petit axe</div>`;
  }
  h += `<circle cx="${bias.mx.toFixed(1)}" cy="${bias.my.toFixed(1)}" r="3.4" fill="#dc2626" stroke="#fff" stroke-width="1.5"/>`;
  svg.querySelector('[data-layer=impacts]').innerHTML = h;
  updateSights();
}
