/* Carnet de Tir Cible — fiches de réglage par arc : variantes datées, choix à la nouvelle séance.
   Script classique : partage ses variables avec les autres fichiers de js/ (voir l'ordre dans index.html). */
'use strict';

/* Une fiche = un arc ; elle contient des variantes datées (la plus récente est proposée par défaut).
   Chaque séance garde une copie de la variante choisie (s.setup), donc l'historique reste fidèle
   même si la fiche est modifiée ensuite. */
const getSheets = () => { const l = store.get(KEYS.sheets, []); return Array.isArray(l) ? l : []; };
const saveSheets = l => store.set(KEYS.sheets, l);
const sheetKey = (sh, v) => `${sh.id}|${v.id}`;
const sortedVariants = sh => [...sh.variants].sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
const fmtMm = v => String(v).replace('.', ',');

function findVariant(key) {
  if (!key) return null;
  const [sid, vid] = String(key).split('|');
  const sheet = getSheets().find(x => x.id === sid);
  const variant = sheet && sheet.variants.find(v => v.id === vid);
  return variant ? { sheet, variant } : null;
}
/* Variante par défaut : la plus récente (date du jour ou avant) de la fiche de l'arc du profil ;
   s'il n'y a qu'une seule fiche, c'est elle ; sinon aucune. */
function defaultSheetKey() {
  const sheets = getSheets().filter(sh => sh.variants.length);
  const bow = (store.get(KEYS.profile, {}).bow || '').trim().toLowerCase();
  const sh = sheets.find(x => bow && x.bow.trim().toLowerCase() === bow) || (sheets.length === 1 ? sheets[0] : null);
  if (!sh) return '';
  const now = today(), vs = sortedVariants(sh);
  return sheetKey(sh, vs.find(v => v.date <= now) || vs[vs.length - 1]);
}
function variantInfo(v) {
  return [v.arrowMm > 0 ? `flèches Ø ${fmtMm(v.arrowMm)} mm` : '', v.quiver > 0 ? `${v.quiver} flèches numérotées` : '',
    v.poundage ? `${v.poundage} lb` : '', v.brace ? `corde ${v.brace}` : ''].filter(Boolean).join(' · ');
}

/* Liste déroulante de « Nouvelle séance » */
function renderSheetSelect() {
  const sel = $('#cfg-sheet'), sheets = getSheets().filter(sh => sh.variants.length);
  $('#cfg-sheet-wrap').hidden = !sheets.length;
  sel.innerHTML = '<option value="">Aucune fiche</option>' + sheets.map(sh =>
    `<optgroup label="${esc(sh.bow)}">${sortedVariants(sh).map(v => `<option value="${esc(sheetKey(sh, v))}">${esc(fmtDate(v.date + 'T12:00:00', true).replace(/, ?\d{2}:\d{2}$/, ''))}${v.label ? ' · ' + esc(v.label) : ''}</option>`).join('')}</optgroup>`).join('');
  sel.value = defaultSheetKey();
}

/* ---------- Réglages : liste des fiches ---------- */
function renderSheets() {
  const box = $('#sheet-list'), sheets = getSheets();
  box.innerHTML = sheets.length ? sheets.map(sh => `<div class="sheet"><div class="row between"><b>${esc(sh.bow)}</b>
      <div class="row"><button class="btn sm" data-action="var-new" data-sheet="${esc(sh.id)}"><span data-i="plus"></span>Variante</button><button class="btn sm icon-only danger" data-action="sheet-del" data-sheet="${esc(sh.id)}" aria-label="Supprimer la fiche"><span data-i="trash"></span></button></div></div>
      ${sortedVariants(sh).map(v => `<div class="rec"><div><b>${esc(fmtDate(v.date + 'T12:00:00', true).replace(/, ?\d{2}:\d{2}$/, ''))}</b>${v.label ? ' · ' + esc(v.label) : ''}<div class="muted" style="font-size:13px">${esc(variantInfo(v)) || 'Aucun détail'}</div></div>
        <div class="row"><button class="btn sm" data-action="var-edit" data-sheet="${esc(sh.id)}" data-id="${esc(v.id)}">Modifier</button><button class="btn sm icon-only danger" data-action="var-del" data-sheet="${esc(sh.id)}" data-id="${esc(v.id)}" aria-label="Supprimer la variante"><span data-i="trash"></span></button></div></div>`).join('')}</div>`).join('')
    : '<p class="muted" style="margin:6px 0 0;font-size:13px">Aucune fiche pour l\'instant.</p>';
  hydrateIcons(box);
}

/* ---------- Fenêtre de saisie d'une variante ---------- */
const VAR_FIELDS = [['arrowMm', 'v-arrow', 'num'], ['quiver', 'v-quiver', 'int'], ['poundage', 'v-pound', 'str'], ['brace', 'v-brace', 'str'], ['nock', 'v-nock', 'str'],
  ['tiller', 'v-tiller', 'str'], ['arrowLen', 'v-alen', 'str'], ['spine', 'v-spine', 'str'], ['point', 'v-point', 'str'], ['fletch', 'v-fletch', 'str'], ['notes', 'v-notes', 'str']];
function varOpen(sheetId, variantId, copyFrom) {
  const sh = getSheets().find(x => x.id === sheetId);
  const src = sh && (sh.variants.find(v => v.id === (variantId || copyFrom)) || (!variantId && !copyFrom ? sortedVariants(sh)[0] : null));
  app.varEdit = { sheetId: sh ? sh.id : null, id: variantId || null };
  $('#var-title').textContent = !sh ? 'Nouvelle fiche de réglage' : variantId ? 'Modifier la variante' : 'Nouvelle variante';
  $('#v-bow-wrap').hidden = !!sh;
  $('#v-bow').value = sh ? sh.bow : (store.get(KEYS.profile, {}).bow || '');
  $('#v-date').value = variantId && src ? src.date : today();
  $('#v-label').value = variantId && src ? (src.label || '') : '';
  VAR_FIELDS.forEach(([k, id]) => { $('#' + id).value = src && src[k] !== undefined ? src[k] : ''; });   // une nouvelle variante repart de la précédente
  $('#dlg-var').showModal();
}
function varSave() {
  const ed = app.varEdit, list = getSheets();
  let sh = list.find(x => x.id === ed.sheetId);
  if (!sh) {
    const bow = $('#v-bow').value.trim().slice(0, 40);
    if (!bow) { toast("Indiquez le nom de l'arc."); return; }
    sh = list.find(x => x.bow.trim().toLowerCase() === bow.toLowerCase());
    if (!sh) { sh = { id: 'f' + Date.now(), bow, variants: [] }; list.push(sh); }
  }
  const v = ed.id ? sh.variants.find(x => x.id === ed.id) : null, o = v || { id: 'v' + Date.now() };
  o.date = $('#v-date').value || today();
  const label = $('#v-label').value.trim().slice(0, 40);
  if (label) o.label = label; else delete o.label;
  VAR_FIELDS.forEach(([k, id, type]) => {
    const raw = $('#' + id).value.trim().replace(',', '.');
    const val = type === 'num' ? parseFloat(raw) : type === 'int' ? parseInt(raw, 10) : raw.slice(0, k === 'notes' ? 300 : 30);
    if (type === 'str' ? val : val > 0) o[k] = type === 'str' ? $('#' + id).value.trim().slice(0, k === 'notes' ? 300 : 30) : (type === 'int' ? Math.min(24, val) : Math.min(20, val)); else delete o[k];
  });
  if (!v) sh.variants.push(o);
  saveSheets(list);
  $('#dlg-var').close();
  renderSheets(); renderSheetSelect();
  toast('Fiche enregistrée.');
}
async function varDel(sheetId, id) {
  if (!(await askConfirm('Supprimer cette variante ? Les séances déjà enregistrées gardent une copie de leurs réglages.', 'Supprimer'))) return;
  const list = getSheets(), sh = list.find(x => x.id === sheetId);
  if (!sh) return;
  sh.variants = sh.variants.filter(v => v.id !== id);
  saveSheets(sh.variants.length ? list : list.filter(x => x !== sh));
  renderSheets(); renderSheetSelect();
}
async function sheetDel(sheetId) {
  if (!(await askConfirm('Supprimer cette fiche et toutes ses variantes ? Les séances déjà enregistrées gardent une copie de leurs réglages.', 'Supprimer'))) return;
  saveSheets(getSheets().filter(x => x.id !== sheetId));
  renderSheets(); renderSheetSelect();
}
