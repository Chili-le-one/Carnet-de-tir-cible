/* Carnet de Tir Cible — onglet Historique : liste des séances et calendrier d'assiduité.
   Script classique : partage ses variables avec les autres fichiers de js/ (voir l'ordre dans index.html). */
'use strict';

/* ---------- Historique ---------- */
function metaLine(s) {
  const n = s.notes || {};
  const bits = [[s.bow, s.bowType].filter(Boolean).join(' · '), s.noSight ? 'sans viseur' : '', n.weather, n.real ? `réel ${n.real}` : '', n.feel ? `forme ${n.feel}/5` : '']
    .filter(Boolean).map(esc).join(' · ');
  const text = n.text ? `<div style="font-size:13px;margin-top:4px;font-style:italic">${esc(n.text.length > 90 ? n.text.slice(0, 90) + '…' : n.text)}</div>` : '';
  return (bits ? `<div class="muted" style="font-size:13px;margin-top:4px">${bits}</div>` : '') + text;
}
function renderHistory() {
  renderCalendar();
  const contestDays = new Set(store.get(KEYS.contests, []).map(c => c.date));
  const list = $('#history-list');
  if (!app.sessions.length) {
    list.innerHTML = `<div class="card empty"><h2>Historique vide</h2><p>Les séances terminées apparaissent ici.</p></div>`;
    return;
  }
  const bestByFormat = {};
  const fmtKey = s => [s.config.distance, s.config.targetType, s.config.arrowsPerEnd * s.config.totalEnds].join('|');
  app.sessions.forEach(s => {
    const k = fmtKey(s), st = sessionStats(s);
    if (!(k in bestByFormat) || st.total > bestByFormat[k]) bestByFormat[k] = st.total;
  });
  const counts = {};
  app.sessions.forEach(s => { const k = fmtKey(s); counts[k] = (counts[k] || 0) + 1; });

  list.innerHTML = app.sessions.map(s => {
    const st = sessionStats(s), k = fmtKey(s);
    const isBest = counts[k] > 1 && st.total === bestByFormat[k] && st.complete;
    return `<article class="card hitem">
      <div>
        <div class="h-score">${st.total} <small>${st.complete ? `/ ${st.max}` : `pts · ${st.count}/${st.planned} flèches`}</small></div>
        <div class="muted" style="font-size:13px;margin:2px 0 6px">${fmtDate(s.date, true)}</div>
        <div class="row"><span class="chip">${esc(s.config.distance)}</span><span class="chip">${esc(targetLabel(s.config.targetType))}</span>${isBest ? '<span class="chip gold">Meilleure</span>' : ''}${contestDays.has(dayKey(new Date(s.date))) ? '<span class="chip gold">★ Concours</span>' : ''}</div>
        <div class="muted" style="font-size:13px;margin-top:6px">Moy. ${st.count ? st.avg.toFixed(1) : '–'} · 10 et X : ${st.tens}</div>${metaLine(s)}
      </div>
      <div style="display:grid;gap:8px">
        <button class="btn sm" data-action="open-session" data-id="${esc(s.id)}">Consulter</button>
        <button class="btn sm danger" data-action="delete-session" data-id="${esc(s.id)}" aria-label="Supprimer la séance">${icon('trash')}</button>
      </div>
    </article>`;
  }).join('');
}
function openSession(id) {
  const found = app.sessions.find(s => s.id === id);
  if (!found) return;
  const copy = JSON.parse(JSON.stringify(found));
  copy.finished = true;
  setSession(copy);
  switchTab('shoot');
}
async function deleteSession(id) {
  const s = app.sessions.find(x => x.id === id);
  if (!s) return;
  if (!(await askConfirm(`Supprimer définitivement la séance du ${fmtDate(s.date, true)} ?`, 'Supprimer'))) return;
  copySave('avant suppression');
  app.sessions = app.sessions.filter(x => x.id !== id);
  saveSessions();
  if (app.session && app.session.id === id && app.session.finished) setSession(null);
  renderHistory();
  toast('Séance supprimée.');
}

/* ---------- Calendrier d'assiduité et jours de concours ---------- */
const dayKey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
function calMove(delta) {
  const d = new Date(app.cal.y, app.cal.m + delta, 1);
  app.cal.y = d.getFullYear(); app.cal.m = d.getMonth();
  renderCalendar();
}
function contestAdd(day) {
  const list = store.get(KEYS.contests, []);
  const input = $('#cal-name');
  if (!list.some(c => c.date === day)) list.push({ id: 'c' + Date.now(), date: day, name: input ? input.value.trim().slice(0, 60) : '' });
  store.set(KEYS.contests, list);
  toast('Concours ajouté.');
  renderHistory();
}
function contestDel(day) {
  store.set(KEYS.contests, store.get(KEYS.contests, []).filter(c => c.date !== day));
  toast('Concours retiré.');
  renderHistory();
}
function renderCalendar() {
  const card = $('#cal-card'), now = new Date(), todayKey = dayKey(now), loc = window.__LOCALE || 'fr-FR';
  if (!app.cal) app.cal = { y: now.getFullYear(), m: now.getMonth(), sel: todayKey };
  const { y, m } = app.cal;
  const arrows = {}, byDay = {};
  app.sessions.forEach(s => {
    const k = dayKey(new Date(s.date));
    arrows[k] = (arrows[k] || 0) + sessionStats(s).count;
    (byDay[k] = byDay[k] || []).push(s);
  });
  const contests = store.get(KEYS.contests, []), cmap = {};
  contests.forEach(c => { cmap[c.date] = c; });

  const first = new Date(y, m, 1), lead = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
  const wd = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(loc, { weekday: 'narrow' }));
  let cells = '<span></span>'.repeat(lead), monthDays = 0, monthArrows = 0;
  for (let d = 1; d <= days; d++) {
    const k = dayKey(new Date(y, m, d)), n = arrows[k] || 0, c = cmap[k];
    if (n) { monthDays++; monthArrows += n; }
    const label = new Date(y, m, d).toLocaleDateString(loc, { day: 'numeric', month: 'long' }) + (n ? ` — ${n} flèches` : '') + (c ? ' — ★' : '');
    cells += `<button class="cal-d d${n === 0 ? 0 : n < 30 ? 1 : n < 60 ? 2 : 3}${k === todayKey ? ' today' : ''}${k === app.cal.sel ? ' sel' : ''}" data-action="cal-day" data-d="${k}" aria-label="${label}">${d}${c ? '<i>★</i>' : ''}</button>`;
  }

  const up = contests.filter(c => c.date >= todayKey).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const upHtml = up.length ? `<div class="cal-up"><h3>Prochains concours</h3>${up.map(c => {
    const n = Math.round((new Date(c.date + 'T00:00:00') - new Date(todayKey + 'T00:00:00')) / 864e5);
    const when = n === 0 ? "aujourd'hui" : n === 1 ? 'demain' : `dans ${n} jours`;
    return `<div class="rec"><div><b>★ ${esc(c.name || 'Concours')}</b> <span class="muted">· ${new Date(c.date + 'T12:00:00').toLocaleDateString(loc, { day: 'numeric', month: 'short' })}</span></div><span class="chip">${when}</span></div>`;
  }).join('')}</div>` : '';

  const sel = app.cal.sel, ds = byDay[sel] || [], contest = cmap[sel];
  const selLabel = new Date(sel + 'T12:00:00').toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' });
  const selHtml = `<div class="cal-sel"><h3 style="text-transform:capitalize;margin-bottom:6px">${selLabel}</h3>` +
    (ds.length ? ds.map(s => { const st = sessionStats(s); return `<div class="rec"><div><b>${st.total} pts</b> <span class="muted">· ${esc(s.config.distance)} · ${st.count} flèches</span></div><button class="btn sm" data-action="open-session" data-id="${esc(s.id)}">Consulter</button></div>`; }).join('')
      : '<p class="muted" style="margin:6px 0">Aucune séance ce jour.</p>') +
    (contest
      ? `<div class="rec"><div><b>★ ${esc(contest.name || 'Jour de concours')}</b></div><button class="btn sm danger" data-action="cal-contest-del" data-d="${sel}">Retirer</button></div>`
      : `<div class="fields" style="margin-top:8px"><label>Nom du concours (facultatif)<input id="cal-name" maxlength="60" autocomplete="off"></label><button class="btn" data-action="cal-contest-add" data-d="${sel}">★ Marquer comme jour de concours</button></div>`) +
    '</div>';

  card.innerHTML = `<div class="cal-head">
      <button class="btn sm icon-only" data-action="cal-prev" aria-label="Mois précédent">‹</button>
      <h3 class="cal-title">${first.toLocaleDateString(loc, { month: 'long', year: 'numeric' })}</h3>
      <button class="btn sm icon-only" data-action="cal-next" aria-label="Mois suivant">›</button>
    </div>
    <div class="cal-grid">${wd.map(w => `<span class="cal-wd">${w}</span>`).join('')}${cells}</div>
    <p class="muted" style="margin:8px 0 0;font-size:13px">${monthDays} jours de tir ce mois · ${monthArrows} flèches · ★ jour de concours</p>
    ${upHtml}${selHtml}`;
}
