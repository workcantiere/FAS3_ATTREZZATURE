const params = new URLSearchParams(location.search);
const posizione = params.get('posizione') || params.get('pos') || 'MAGAZZINO';
const $ = (id) => document.getElementById(id);

let currentTools = [];
let removeMode = false;

function apiGet(action, extra = {}) {
  const url = new URL(window.FAS3_API_URL);
  url.searchParams.set('action', action);
  Object.entries(extra).forEach(([k, v]) => url.searchParams.set(k, v));
  return fetch(url).then(r => r.json());
}

function apiPost(payload) {
  return fetch(window.FAS3_API_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
  }).then(r => r.json());
}

function addInput(value = '') {
  const wrap = document.createElement('div');
  wrap.className = 'inputRow';

  const input = document.createElement('input');
  input.maxLength = 4;
  input.inputMode = 'numeric';
  input.placeholder = 'Ultime 4 cifre';
  input.value = value;
  input.className = 'codeInput';

  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(0, 4);
    const fields = [...document.querySelectorAll('.codeInput')];
    const isLast = fields[fields.length - 1] === input;
    if (input.value.length > 0 && isLast) addInput();
  });

  wrap.appendChild(input);
  $('addFields').appendChild(wrap);
}

function valorePulito(v) {
  if (v === undefined || v === null) return '';
  v = String(v).trim();
  if (v.toLowerCase() === 'undefined') return '';
  if (v.toLowerCase() === 'null') return '';
  return v;
}

function getCodice(t) {
  return valorePulito(t.codice || t.CODICE || t.Codice || t.id || t.ID);
}

function getTipo(t) {
  return valorePulito(t.tipo || t.TIPO_ATTREZZO || t.Tipo || t.descrizione || t.DESCRIZIONE);
}

function render(data) {
  currentTools = data.attrezzi || [];

  $('title').textContent = data.posizione || posizione;
  $('subtitle').textContent = 'Link operativo per aggiornare la lista attrezzatura';

  $('list').innerHTML = currentTools.length ? '' : '<p class="muted">Nessun attrezzo presente.</p>';

  currentTools.forEach(t => {
    const codice = getCodice(t);
    const tipo = getTipo(t);

    const div = document.createElement('div');
    div.className = 'toolRow';

    if (removeMode) {
      div.innerHTML = `
        <label class="checkRow">
          <input type="checkbox" class="removeCheck" value="${codice}">
          <span><b>${codice}</b> - ${tipo}</span>
        </label>
      `;
    } else {
      div.innerHTML = `<strong>${codice}</strong><span>${tipo}</span>`;
    }

    $('list').appendChild(div);
  });

  const help = $('removeHelp');
  const btn = $('toggleRemoveBtn');

  if (help) help.style.display = removeMode ? 'block' : 'none';
  if (btn) btn.textContent = removeMode ? 'ANNULLA SELEZIONE RIMOZIONE' : 'SELEZIONA ATTREZZI DA RIMUOVERE';
}

async function load() {
  $('message').textContent = 'Caricamento...';

  try {
    const data = await apiGet('getLocationData', { posizione });

    if (!data.ok) throw new Error(data.error || 'Errore caricamento');

    render(data);
    $('message').textContent = '';

  } catch (e) {
    $('message').textContent = 'Errore: ' + e.message;
  }
}

async function save() {
  const aggiunti = [...document.querySelectorAll('.codeInput')]
    .map(i => i.value.trim())
    .filter(Boolean);

  const rimossi = [...document.querySelectorAll('.removeCheck:checked')]
    .map(i => i.value)
    .filter(Boolean);

  const payload = {
    action: 'saveEmployeeUpdate',
    posizione,
    operatore: $('operatore').value.trim(),
    note: $('note').value.trim(),
    aggiunti,
    rimossi
  };

  $('saveBtn').disabled = true;
  $('message').textContent = 'Salvataggio...';

  try {
    const res = await apiPost(payload);

    if (res.errors && res.errors.length) {
      $('message').innerHTML = 'Attenzione:<br>' + res.errors.map(e => '• ' + e).join('<br>');
    } else {
      $('message').textContent = 'Salvato correttamente.';
    }

    removeMode = false;

    if (res.data) {
      render(res.data);
    } else {
      await load();
    }

    $('addFields').innerHTML = '';
    addInput();

  } catch (e) {
    $('message').textContent = 'Errore: ' + e.message;
  } finally {
    $('saveBtn').disabled = false;
  }
}

$('saveBtn').addEventListener('click', save);

$('toggleRemoveBtn').addEventListener('click', () => {
  removeMode = !removeMode;
  render({ posizione, attrezzi: currentTools });
});

addInput();
load();
