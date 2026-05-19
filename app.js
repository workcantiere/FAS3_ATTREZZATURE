const params = new URLSearchParams(location.search);
const posizione = params.get('posizione') || params.get('pos') || 'MAGAZZINO';
const $ = (id) => document.getElementById(id);
let currentTools = [];

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
  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(0, 4);
    const fields = [...document.querySelectorAll('.codeInput')];
    const isLast = fields[fields.length - 1] === input;
    if (input.value.length > 0 && isLast) addInput();
  });
  input.className = 'codeInput';
  wrap.appendChild(input);
  $('addFields').appendChild(wrap);
}

function render(data) {
  currentTools = data.attrezzi || [];
  $('title').textContent = data.posizione;
  $('subtitle').textContent = 'Link operativo per aggiornare la lista attrezzatura';
  $('list').innerHTML = currentTools.length ? '' : '<p class="muted">Nessun attrezzo presente.</p>';
  currentTools.forEach(t => {
    const div = document.createElement('div');
    div.className = 'toolRow';
    div.innerHTML = `<strong>${t.codice}</strong><span>${t.tipo || ''}</span>`;
    $('list').appendChild(div);
  });
  $('removeFields').innerHTML = currentTools.length ? '' : '<p class="muted">Niente da rimuovere.</p>';
  currentTools.forEach(t => {
    const label = document.createElement('label');
    label.className = 'checkRow';
    label.innerHTML = `<input type="checkbox" value="${t.codice}"> <span><b>${t.codice}</b> - ${t.tipo || ''}</span>`;
    $('removeFields').appendChild(label);
  });
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
  const aggiunti = [...document.querySelectorAll('.codeInput')].map(i => i.value.trim()).filter(Boolean);
  const rimossi = [...document.querySelectorAll('#removeFields input:checked')].map(i => i.value);
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
    if (res.data) render(res.data);
    $('addFields').innerHTML = '';
    addInput();
  } catch (e) {
    $('message').textContent = 'Errore: ' + e.message;
  } finally {
    $('saveBtn').disabled = false;
  }
}

$('saveBtn').addEventListener('click', save);
addInput();
load();
