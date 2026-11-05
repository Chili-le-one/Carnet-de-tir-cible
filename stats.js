/* Carnet de Tir Cible — onglet Stats : filtres, objectif, records, régularité, volume d'entraînement.
   Script classique : partage ses variables avec les autres fichiers de js/ (voir l'ordre dans index.html). */
'use strict';

/* ---------- Records & objectifs ---------- */
const formatKey = s => [s.config.distance, s.config.targetType, s.config.arrowsPerEnd * s.config.totalEnds].join('|');

const goalKey = c => `${c.distance}|${c.targetType}`;

const getGoals = () => store.get(KEYS.goals, {});

function setGoal(key, v) {
  const g = getGoals();
  if (v > 0) g[key] = v; else delete g[key];
  store.set(KEYS.goals, g);
}
/* Records : on ne compare que des séances de même distance et de même blason.
   - Record du format : même nombre de flèches, meilleur total.
   - Record par distance : meilleure moyenne par flèche (séances d'au moins RECORD_MIN flèches).

   - Record sur N flèches : meilleure série de N flèches consécutives (30 et 60). */
const RECORD_MIN = 30, SERIES = [30, 60];

function seriesBest(s, n) {
  const a = sessionStats(s).arrows;
  if (a.length < n) return null;
  let sum = 0, best = -1;
  for (let i = 0; i < a.length; i++) {
    sum += a[i].scoreVal;
    if (i >= n) sum -= a[i - n].scoreVal;
    if (i >= n - 1 && sum > best) best = sum;
  }
  return best;
}

function recordsOf(list) {
  const r = { formats: {}, avg: null, series: {}, ends: {} };
  list.forEach(x => {
    const st = sessionStats(x);
    if (st.complete && (!r.formats[st.planned] || st.total > r.formats[st.planned].v)) r.formats[st.planned] = { v: st.total, date: x.date };
    if (st.count >= RECORD_MIN && (!r.avg || st.avg > r.avg.v)) r.avg = { v: st.avg, date: x.date };
    SERIES.forEach(n => { const b = seriesBest(x, n); if (b !== null && (!r.series[n] || b > r.series[n].v)) r.series[n] = { v: b, date: x.date }; });
    (x.ends || []).forEach(end => {
      if (!end || end.length !== x.config.arrowsPerEnd) return;
      const v = sumScore(end), ape = x.config.arrowsPerEnd;
      if (!r.ends[ape] || v > r.ends[ape].v) r.ends[ape] = { v, date: x.date };
    });
  });
  return r;
}

function analyze(s) {
  const st = sessionStats(s), key = formatKey(s);
  const others = app.sessions.filter(x => x.id !== s.id && formatKey(x) === key && sessionStats(x).complete);
  const prevBest = others.length ? Math.max(...others.map(x => sessionStats(x).total)) : null;
  const goal = s.goal || getGoals()[goalKey(s.config)] || 0;
  const projected = projectedScore(s);
  const same = app.sessions.filter(x => x.id !== s.id && goalKey(x.config) === goalKey(s.config));
  const prev = recordsOf(same), cur = recordsOf([s]), recs = [];
  if (st.complete && prevBest !== null && st.total > prevBest) recs.push({ type: 'format', v: st.total, prev: prevBest });
  if (cur.avg && prev.avg && cur.avg.v > prev.avg.v) recs.push({ type: 'distance', v: cur.avg.v, prev: prev.avg.v });
  SERIES.forEach(n => { if (cur.series[n] && prev.series[n] && cur.series[n].v > prev.series[n].v) recs.push({ type: 'serie', n, v: cur.series[n].v, prev: prev.series[n].v }); });
  return { prevBest, record: recs.some(r => r.type === 'format'), recs, goal, projected,
           goalReached: goal > 0 && reliableProjection(s) && projected >= goal };
}

/* ---------- Objectif hebdomadaire ---------- */
const mondayOf = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.getTime(); };

const arrowsThisWeek = () => app.sessions.filter(x => mondayOf(x.date) === mondayOf(new Date())).reduce((a, x) => a + sessionStats(x).count, 0);

/* ---------- Régularité par volée ---------- */
function renderRegularity(data) {
  const card = $('#regularity-card');
  const per = new Map(), endAvgs = [], apes = new Set();
  data.forEach(sess => (sess.ends || []).forEach((end, i) => {
    if (!end || !end.length) return;
    const sum = sumScore(end), g = per.get(i) || { sum: 0, n: 0 };
    g.sum += sum; g.n += end.length; per.set(i, g);
    if (end.length === sess.config.arrowsPerEnd) { endAvgs.push(sum / end.length); apes.add(sess.config.arrowsPerEnd); }
  }));
  const rows = [...per.entries()].sort((a, b) => a[0] - b[0]).map(([i, g]) => ({ i, avg: g.sum / g.n }));
  if (rows.length < 3 || endAvgs.length < 3) { card.hidden = true; return; }
  card.hidden = false;
  const mean = endAvgs.reduce((a, b) => a + b, 0) / endAvgs.length;
  const sd = Math.sqrt(endAvgs.reduce((a, b) => a + (b - mean) ** 2, 0) / endAvgs.length);
  const uni = apes.size === 1 ? [...apes][0] : 0;
  const best = rows.reduce((a, b) => b.avg > a.avg ? b : a), worst = rows.reduce((a, b) => b.avg < a.avg ? b : a);
  const third = Math.max(1, Math.floor(rows.length / 3));
  const avgOf = a => a.reduce((t, r) => t + r.avg, 0) / a.length;
  const delta = avgOf(rows.slice(-third)) - avgOf(rows.slice(0, third));
  let trend;
  if (rows.length < 6) trend = 'Trop peu de volées pour observer une évolution (6 minimum).';
  else {
    const fi = new Set(rows.slice(0, third).map(r => r.i)), la = new Set(rows.slice(-third).map(r => r.i));
    const A = [], B = [];
    data.forEach(sess => (sess.ends || []).forEach((end, i) => {
      if (!end || !end.length) return;
      const v = sumScore(end) / end.length;
      if (fi.has(i)) A.push(v); else if (la.has(i)) B.push(v);
    }));
    const mean_ = x => x.reduce((p, q) => p + q, 0) / x.length;
    const var_ = x => x.length > 1 ? x.reduce((p, q) => p + (q - mean_(x)) ** 2, 0) / (x.length - 1) : 0;
    const d2 = mean_(B) - mean_(A), se = Math.sqrt(var_(A) / A.length + var_(B) / B.length);
    const sg = (d2 >= 0 ? '+' : '−') + Math.abs(d2).toFixed(1);
    trend = Math.abs(d2) < Math.max(0.15, 1.5 * se)
      ? `Pas d'évolution nette entre le début et la fin de la séance (écart observé : ${sg} pt par flèche).`
      : `Évolution observée : ${sg} pt par flèche sur le dernier tiers des volées par rapport au premier tiers. Cette tendance décrit les données, pas leur cause.`;
  }
  card.innerHTML = `<h3>Régularité par volée</h3>
    <p class="muted" style="margin:2px 0 8px;font-size:13px">Score moyen par flèche pour chaque numéro de volée (séances filtrées).</p>
    ${lineChart(rows.map(r => r.avg), rows.map(r => `V${r.i + 1}`), 1)}
    <div class="grid2" style="margin-top:10px">
      <div class="mini"><dt>Meilleure volée</dt><dd>n° ${best.i + 1}</dd><div class="muted" style="font-size:12px">moy. ${best.avg.toFixed(1)}</div></div>
      <div class="mini"><dt>Plus faible</dt><dd>n° ${worst.i + 1}</dd><div class="muted" style="font-size:12px">moy. ${worst.avg.toFixed(1)}</div></div>
    </div>
    <p style="margin:10px 0 0;font-weight:650">${trend}</p>
    <p class="muted" style="margin:6px 0 0;font-size:13px">Régularité : ${uni ? `±${(sd * uni).toFixed(1)} pts par volée` : `±${sd.toFixed(2)} pt par flèche`} (écart-type).</p>`;
}

function fillFilters() {
  const dists = [...new Set(app.sessions.map(s => s.config.distance))].sort((a, b) => parseFloat(a) - parseFloat(b));
  const tgts = [...new Set(app.sessions.map(s => String(s.config.targetType)))];
  const fd = $('#f-dist'), ft = $('#f-target');
  const pd = fd.value || 'ALL', pt = ft.value || 'ALL';
  fd.innerHTML = '<option value="ALL">Toutes</option>' + dists.map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join('');
  ft.innerHTML = '<option value="ALL">Tous</option>' + tgts.map(t => `<option value="${esc(t)}">${esc(targetLabel(t))}</option>`).join('');
  fd.value = dists.includes(pd) ? pd : 'ALL';
  ft.value = tgts.includes(pt) ? pt : 'ALL';
  const bows = [...new Set(app.sessions.map(x => x.bow).filter(Boolean))];
  const fb = $('#f-bow'), pb = fb.value || 'ALL';
  fb.innerHTML = '<option value="ALL">Tous</option>' + bows.map(b => `<option value="${esc(b)}">${esc(b)}</option>`).join('');
  fb.value = bows.includes(pb) ? pb : 'ALL';
  $('#f-bow-wrap').hidden = bows.length < 2;
}

function lineChart(vals, labels, dec, marks = []) {
  const W = 320, H = 160, L = 34, R = 10, T = 12, B = 24;
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (lo === hi) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * .15;
  lo = Math.max(0, lo - pad); hi += pad;
  const x = i => vals.length === 1 ? L + (W - L - R) / 2 : L + i * (W - L - R) / (vals.length - 1);
  const y = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  let g = '';
  [lo, (lo + hi) / 2, hi].forEach(v => {
    g += `<line class="gl" x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="axt" x="${L - 5}" y="${(y(v) + 3).toFixed(1)}" text-anchor="end">${v.toFixed(dec)}</text>`;
  });
  const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const line = vals.length > 1 ? `<polyline class="ch-line" points="${pts.join(' ')}"/>` : '';
  const area = vals.length > 1 ? `<polygon class="ch-area" points="${x(0).toFixed(1)},${H - B} ${pts.join(' ')} ${x(vals.length - 1).toFixed(1)},${H - B}"/>` : '';
  const dots = vals.map((v, i) => `<circle class="ch-dot" cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="4"><title>${esc(labels[i])} : ${v.toFixed(dec)}</title></circle>`).join('');
  const mk = vals.length > 1 ? marks.map(m => {
    const mx = x(m.pos).toFixed(1);
    return `<line x1="${mx}" x2="${mx}" y1="${T}" y2="${H - B}" style="stroke:var(--muted)" stroke-width="1" stroke-dasharray="3 3"/>` +
      `<circle cx="${mx}" cy="${T}" r="7" style="fill:var(--ink)"/><text x="${mx}" y="${T + 3}" text-anchor="middle" font-size="9" font-weight="800" style="fill:var(--bg)">${m.n}</text>`;
  }).join('') : '';
  const first = `<text class="axt" x="${L}" y="${H - 6}" text-anchor="start">${esc(labels[0])}</text>`;
  const last = vals.length > 1 ? `<text class="axt" x="${W - R}" y="${H - 6}" text-anchor="end">${esc(labels[labels.length - 1])}</text>` : '';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Courbe d'évolution">${g}${mk}${area}${line}${dots}${first}${last}</svg>`;
}

function renderGoal(data) {
  const card = $('#goal-card');
  const keys = [...new Set(data.map(x => goalKey(x.config)))];
  if (keys.length !== 1) {
    card.innerHTML = '<h3>Objectif</h3><p class="muted" style="margin:6px 0 0">Choisissez une distance et un blason pour fixer un objectif de score.</p>';
    return;
  }
  const key = keys[0], goal = getGoals()[key] || 0, ref = refArrows();
  const usable = data.filter(reliableProjection);
  const best = usable.length ? Math.max(...usable.map(projectedScore)) : 0;
  const last = [...data].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const pct = goal ? Math.min(100, best / goal * 100) : 0;
  const c = data[0].config;
  card.innerHTML = `<h3 style="margin-bottom:10px">Objectif · ${esc(c.distance)} · ${esc(targetLabel(c.targetType))}</h3>
    <label>Score visé sur ${ref} flèches<input id="g-input" data-key="${esc(key)}" type="number" inputmode="numeric" min="0" value="${goal || ''}" placeholder="ex. 540"></label>
    ${goal ? `<div class="progress" aria-hidden="true"><span style="width:${pct.toFixed(0)}%"></span></div>
      <p style="margin:8px 0 0;font-weight:650">${!usable.length ? 'Pas encore assez de flèches pour projeter.' : best >= goal ? 'Objectif atteint !' : `Meilleure projection : ${best} · il manque ${goal - best} points`}</p>`
      : '<p class="muted" style="margin:8px 0 0;font-size:13px">Aucun objectif défini : saisissez un score pour suivre votre progression.</p>'}
    <p class="muted" style="margin:8px 0 0;font-size:13px">Les séances plus courtes sont ramenées à ${ref} flèches (ex. 10 volées de 3 : score ×2). Dernière séance : ${projectedScore(last)} projetés${sessionStats(last).count === ref ? '' : ` (${sessionStats(last).total} réels)`}. Seules les séances d'au moins ${Math.min(ref, 12)} flèches comptent.</p>`;
}

function renderRecords(data) {
  const groups = {};
  data.forEach(x => { (groups[goalKey(x.config)] = groups[goalKey(x.config)] || []).push(x); });
  const ref = refArrows();
  const rows = Object.values(groups).map(list => ({ list, r: recordsOf(list) }))
    .filter(g => Object.keys(g.r.formats).length || g.r.avg || Object.keys(g.r.series).length)
    .sort((a, b) => b.list.length - a.list.length).slice(0, 6);
  $('#records').innerHTML = rows.length ? rows.map(({ list, r }) => {
    const c = list[0].config, lines = [];
    Object.keys(r.formats).map(Number).sort((a, b) => b - a).forEach(n => lines.push(`Record du format · ${n} flèches : ${r.formats[n].v} (${fmtDate(r.formats[n].date)})`));
    if (r.avg) lines.push(`Record par distance · moyenne ${r.avg.v.toFixed(2)} par flèche (≈ ${Math.round(r.avg.v * ref)} sur ${ref})`);
    SERIES.forEach(n => { if (r.series[n]) lines.push(`Record sur ${n} flèches : ${r.series[n].v} (${fmtDate(r.series[n].date)})`); });
    Object.keys(r.ends).map(Number).sort((a, b) => a - b).forEach(a => lines.push(`Meilleure volée de ${a} flèche${a > 1 ? 's' : ''} : ${r.ends[a].v}`));
    return `<div class="rec"><div><b>${esc(c.distance)} · ${esc(targetLabel(c.targetType))}</b>${lines.map(l => `<div class="muted" style="font-size:13px">${l}</div>`).join('')}</div></div>`;
  }).join('') : '<p class="muted" style="margin:6px 0 0">Terminez une séance complète pour voir vos records.</p>';
}

function renderVolume() {
  const card = $('#volume-card');
  const all = [...app.sessions];
  const u = loadUnfinished();
  if (u && !all.some(x => x.id === u.id)) all.push(u);
  card.hidden = !all.length;
  if (!all.length) return;
  const monday = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.getTime(); };
  const thisWeek = monday(new Date());
  const WEEK = 7 * 864e5;
  const weeks = Array.from({ length: 8 }, (_, i) => ({ t: thisWeek - (7 - i) * WEEK, n: 0 }));
  const now = new Date();
  let month = 0, total = 0;
  all.forEach(x => {
    const n = sessionStats(x).count, d = new Date(x.date);
    total += n;
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) month += n;
    const w = weeks.find(k => monday(d) === k.t);
    if (w) w.n += n;
  });
  const max = Math.max(1, ...weeks.map(w => w.n));
  const bw = 30, gap = 8, H = 90;
  const bars = weeks.map((w, i) => {
    const h = Math.round(w.n / max * H), x = 4 + i * (bw + gap);
    return `<rect class="vbar${i === 7 ? ' cur' : ''}" x="${x}" y="${H - h + 14}" width="${bw}" height="${Math.max(h, w.n ? 2 : 0)}" rx="4"><title>${w.n} flèches</title></rect>` +
      `<text class="axt" x="${x + bw / 2}" y="${H - h + 10}" text-anchor="middle">${w.n || ''}</text>` +
      `<text class="axt" x="${x + bw / 2}" y="${H + 28}" text-anchor="middle">${i === 0 || i === 7 ? new Date(w.t).toLocaleDateString(window.__LOCALE || 'fr-FR', { day: '2-digit', month: '2-digit' }) : ''}</text>`;
  }).join('');
  const wg = getPrefs().weeklyGoal || 0, wk = weeks[7].n;
  const goalBlock = wg > 0 ? `<div style="margin-top:12px"><div class="row between"><b>Objectif de la semaine</b><span class="${wk >= wg ? '' : 'muted'}">${wk} / ${wg} flèches</span></div><div class="progress"><span style="width:${Math.min(100, wk / wg * 100).toFixed(0)}%"></span></div>${wk >= wg ? '<p style="margin:6px 0 0;font-weight:650">Objectif atteint, bravo !</p>' : `<p class="muted" style="margin:6px 0 0;font-size:13px">Il reste ${wg - wk} flèches.</p>`}</div>` : '';
  card.innerHTML = `<h3 style="margin-bottom:10px">Volume d'entraînement</h3>
    <div class="minis" style="grid-template-columns:repeat(3,1fr);margin-top:0">
      <div class="mini"><dt>Cette semaine</dt><dd>${weeks[7].n}</dd></div>
      <div class="mini"><dt>Ce mois</dt><dd>${month}</dd></div>
      <div class="mini"><dt>Au total</dt><dd>${total}</dd></div>
    </div>
    ${goalBlock}
    <p class="muted" style="margin:10px 0 4px;font-size:13px">Flèches tirées par semaine (8 dernières semaines)</p>
    <svg class="chart" viewBox="0 0 ${8 * (bw + gap) + 4} ${H + 34}" role="img" aria-label="Flèches par semaine">${bars}</svg>`;
}

function renderStats() {
  fillFilters();
  renderVolume();
  const d = $('#f-dist').value, t = $('#f-target').value, bw = $('#f-bow').value;
  const data = app.sessions.filter(s => (d === 'ALL' || s.config.distance === d) && (t === 'ALL' || String(s.config.targetType) === t) && (bw === 'ALL' || s.bow === bw));
  $('#stats-empty').hidden = data.length > 0;
  $('#stats-body').hidden = data.length === 0;
  if (!data.length) return;

  let arrowsN = 0, scoreSum = 0, endsN = 0, tens = 0, best = 0;
  const dist = { '10 et X': 0, '9': 0, '8': 0, '7': 0, '6': 0, '5 à 1': 0, 'M': 0 };
  const maxes = new Set();
  data.forEach(s => {
    const st = sessionStats(s);
    best = Math.max(best, st.total);
    maxes.add(st.max);
    endsN += endsOf(s).filter(e => e.length).length;
    st.arrows.forEach(a => {
      arrowsN++; scoreSum += a.scoreVal;
      if (a.valStr === 'X' || a.valStr === '10') { tens++; dist['10 et X']++; }
      else if (a.valStr === 'M') dist['M']++;
      else if (a.scoreVal >= 6) dist[a.valStr]++;
      else dist['5 à 1']++;
    });
  });

  $('#kpis').innerHTML = `
    <div class="kpi"><b>${best}</b><span>Meilleur score${maxes.size === 1 ? ` (sur ${[...maxes][0]})` : ''}</span></div>
    <div class="kpi"><b>${endsN ? (scoreSum / endsN).toFixed(1) : '–'}</b><span>Moyenne par volée</span></div>
    <div class="kpi"><b>${arrowsN ? Math.round(tens / arrowsN * 100) : 0}%</b><span>de 10 et X</span></div>
    <div class="kpi"><b>${data.length}</b><span>séance${data.length > 1 ? 's' : ''} · ${arrowsN} flèches</span></div>`;

  renderGoal(data);
  renderRecords(data);
  app.statsData = data;
  renderEndsCard();

  // Évolution : total si les séances ont le même format, sinon moyenne par flèche
  const asc = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  const useTotal = maxes.size === 1;
  const vals = asc.map(s => { const st = sessionStats(s); return useTotal ? st.total : st.avg; });
  $('#evo-title').textContent = useTotal ? 'Évolution du score' : 'Évolution de la moyenne par flèche';
  $('#evo-note').textContent = useTotal ? 'Score total de chaque séance, de la plus ancienne à la plus récente.'
    : 'Formats différents : la moyenne par flèche permet de les comparer.';
  const ts = asc.map(x => new Date(x.date).getTime());
  const marks = [];
  if (asc.length > 1) {
    [...getGear()].sort((a, b) => a.date < b.date ? -1 : 1).forEach(g => {
      const t = ts.filter(v => v < new Date(g.date + 'T00:00:00').getTime()).length;
      if (t >= 1) marks.push({ pos: Math.min(t - 0.5, asc.length - 1), g });
    });
  }
  const shown = marks.slice(-9);
  shown.forEach((m, i) => { m.n = i + 1; });
  $('#evo-chart').innerHTML = lineChart(vals, asc.map(s => fmtDate(s.date)), useTotal ? 0 : 1, shown);
  $('#evo-gear').innerHTML = shown.map(m => `<div class="muted" style="font-size:13px;margin-top:4px"><b style="color:var(--ink)">${m.n}</b> · ${esc(fmtDate(m.g.date + 'T12:00:00'))} — ${esc(m.g.text)}</div>`).join('');
  renderRegularity(data);

  // Répartition
  const colors = { '10 et X': 'var(--gold)', '9': 'var(--gold)', '8': 'var(--red)', '7': 'var(--red)', '6': 'var(--blue)', '5 à 1': '#6b7686', 'M': 'var(--danger)' };
  $('#dist-bars').innerHTML = Object.entries(dist).map(([k, n]) => {
    const pct = arrowsN ? n / arrowsN * 100 : 0;
    return `<div class="bar-row"><span class="bar-lbl">${k}</span><div class="bar-track"><div class="bar-fill" style="width:${pct.toFixed(1)}%;background:${colors[k]}"></div></div><span>${n} · ${Math.round(pct)}%</span></div>`;
  }).join('');

  app.statsData = data;
  renderImpactMap();
}
