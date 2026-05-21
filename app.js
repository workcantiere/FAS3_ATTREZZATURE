function valorePulito(v) {
  if (v === undefined || v === null) return '';
  v = String(v).trim();
  if (v.toLowerCase() === 'undefined') return '';
  if (v.toLowerCase() === 'null') return '';
  return v;
}

function render(data) {
  currentTools = data.attrezzi || [];

  $('title').textContent = data.posizione || posizione;
  $('subtitle').textContent = 'Link operativo per aggiornare la lista attrezzatura';

  $('list').innerHTML = currentTools.length ? '' : '<p class="muted">Nessun attrezzo presente.</p>';

  currentTools.forEach(t => {
    let codice = '';
    let tipo = '';

    if (Array.isArray(t)) {
      codice = valorePulito(t[0]);
      tipo = valorePulito(t[1] || t[2]);
    } else {
      codice = valorePulito(t.codice || t.CODICE || t.Codice || t.id || t.ID);
      tipo = valorePulito(t.tipo || t.TIPO_ATTREZZO || t.Tipo || t.descrizione || t.DESCRIZIONE);
    }

    const div = document.createElement('div');
    div.className = 'toolRow';
    div.innerHTML = `<strong>${codice}</strong><span>${tipo}</span>`;
    $('list').appendChild(div);
  });

  $('removeFields').innerHTML = currentTools.length ? '' : '<p class="muted">Niente da rimuovere.</p>';

  currentTools.forEach(t => {
    let codice = '';
    let tipo = '';

    if (Array.isArray(t)) {
      codice = valorePulito(t[0]);
      tipo = valorePulito(t[1] || t[2]);
    } else {
      codice = valorePulito(t.codice || t.CODICE || t.Codice || t.id || t.ID);
      tipo = valorePulito(t.tipo || t.TIPO_ATTREZZO || t.Tipo || t.descrizione || t.DESCRIZIONE);
    }

    const label = document.createElement('label');
    label.className = 'checkRow';
    label.innerHTML = `<input type="checkbox" value="${codice}"> <span><b>${codice}</b> - ${tipo}</span>`;
    $('removeFields').appendChild(label);
  });
}
$('saveBtn').addEventListener('click', save);
addInput();
load();
