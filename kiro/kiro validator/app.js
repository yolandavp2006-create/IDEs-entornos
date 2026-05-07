/**
 * Ateneo Siglo XXI — Validador de Socios
 * Lógica de procesamiento CSV y validación de emails
 */

'use strict';

// ── Estado global ──────────────────────────────────────────────────────────
const state = {
  emails: [],       // Array de objetos { email, status, reason, row }
  filtered: [],     // Vista filtrada actual
  currentFilter: 'all',
};

// ── Regex de validación de email (RFC 5322 simplificado) ───────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// ── Inicialización ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupDragAndDrop();
  setupEnterKey();
});

function setupEnterKey() {
  document.getElementById('emailInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') validateEmail();
  });
}

// ── Drag & Drop ────────────────────────────────────────────────────────────
function setupDragAndDrop() {
  const zone = document.getElementById('uploadZone');

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  });

  zone.addEventListener('click', (e) => {
    // Evitar doble disparo si se hace clic en el botón
    if (e.target.tagName !== 'BUTTON') {
      document.getElementById('csvInput').click();
    }
  });

  document.getElementById('csvInput').addEventListener('change', (e) => {
    if (e.target.files[0]) processFile(e.target.files[0]);
  });
}

// ── Procesamiento del archivo CSV ──────────────────────────────────────────
function processFile(file) {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    showFileInfo('⚠️ El archivo debe tener extensión .csv', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target.result;
      parseCSV(text, file.name);
    } catch (err) {
      showFileInfo(`❌ Error al leer el archivo: ${err.message}`, 'error');
    }
  };
  reader.readAsText(file, 'UTF-8');
}

function parseCSV(text, filename) {
  // Detectar separador (coma, punto y coma o tabulador)
  const separator = detectSeparator(text);

  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) {
    showFileInfo('⚠️ El archivo está vacío o solo tiene encabezado.', 'error');
    return;
  }

  const headers = lines[0].split(separator).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  const emailCol = findEmailColumn(headers);

  if (emailCol === -1) {
    showFileInfo(
      '❌ No se encontró columna de email. Usa encabezados: email, correo, e-mail, mail o correo_electronico.',
      'error'
    );
    return;
  }

  const seen = new Set();
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i], separator);
    const raw  = (cols[emailCol] || '').trim().replace(/['"]/g, '');
    const email = raw.toLowerCase();

    if (!email) continue;

    let status, reason;

    if (!EMAIL_REGEX.test(email)) {
      status = 'invalid';
      reason = 'Formato incorrecto';
    } else if (seen.has(email)) {
      status = 'dupe';
      reason = 'Email duplicado';
    } else {
      status = 'valid';
      reason = '—';
      seen.add(email);
    }

    results.push({ email, status, reason, row: i });
  }

  state.emails   = results;
  state.filtered = [...results];
  state.currentFilter = 'all';

  showFileInfo(`✅ Archivo cargado: <strong>${filename}</strong> · ${results.length} registros procesados`, 'ok');
  renderStats();
  renderTable(results);
  document.getElementById('statsSection').classList.remove('hidden');
  document.getElementById('tableFilter').value = '';
}

function detectSeparator(text) {
  const firstLine = text.split(/\r?\n/)[0];
  const counts = {
    ',':  (firstLine.match(/,/g)  || []).length,
    ';':  (firstLine.match(/;/g)  || []).length,
    '\t': (firstLine.match(/\t/g) || []).length,
  };
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function findEmailColumn(headers) {
  const candidates = ['email', 'correo', 'e-mail', 'mail', 'correo_electronico', 'correo electrónico', 'e_mail'];
  for (const c of candidates) {
    const idx = headers.indexOf(c);
    if (idx !== -1) return idx;
  }
  // Búsqueda parcial
  return headers.findIndex(h => h.includes('mail') || h.includes('correo'));
}

// Maneja campos entre comillas con comas internas
function splitCSVLine(line, sep) {
  const result = [];
  let current  = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ── Renderizado de estadísticas ────────────────────────────────────────────
function renderStats() {
  const total   = state.emails.length;
  const valid   = state.emails.filter(e => e.status === 'valid').length;
  const invalid = state.emails.filter(e => e.status === 'invalid').length;
  const dupes   = state.emails.filter(e => e.status === 'dupe').length;

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-item stat-total">
      <div class="stat-num">${total}</div>
      <div class="stat-label">Total registros</div>
    </div>
    <div class="stat-item stat-valid">
      <div class="stat-num">${valid}</div>
      <div class="stat-label">Emails válidos</div>
    </div>
    <div class="stat-item stat-invalid">
      <div class="stat-num">${invalid}</div>
      <div class="stat-label">Inválidos</div>
    </div>
    <div class="stat-item stat-dupes">
      <div class="stat-num">${dupes}</div>
      <div class="stat-label">Duplicados</div>
    </div>
  `;
}

// ── Renderizado de tabla ───────────────────────────────────────────────────
function renderTable(data) {
  const tbody = document.getElementById('emailTableBody');

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:2rem;color:#aaa;">Sin resultados</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${escapeHtml(item.email)}</td>
      <td>${badgeHtml(item.status)}</td>
      <td class="reason-text">${escapeHtml(item.reason)}</td>
    </tr>
  `).join('');
}

function badgeHtml(status) {
  const map = {
    valid:   ['badge-valid',   '✔', 'Válido'],
    invalid: ['badge-invalid', '✘', 'Inválido'],
    dupe:    ['badge-dupe',    '⚠', 'Duplicado'],
  };
  const [cls, icon, label] = map[status] || ['badge-invalid', '?', 'Desconocido'];
  return `<span class="badge ${cls}">${icon} ${label}</span>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Filtros de tabla ───────────────────────────────────────────────────────
function filterTable() {
  const query = document.getElementById('tableFilter').value.toLowerCase().trim();
  applyFilters(query, state.currentFilter);
}

function filterByStatus(status) {
  state.currentFilter = status;
  const query = document.getElementById('tableFilter').value.toLowerCase().trim();
  applyFilters(query, status);
}

function applyFilters(query, status) {
  let data = [...state.emails];

  if (status !== 'all') {
    data = data.filter(e => e.status === status);
  }

  if (query) {
    data = data.filter(e => e.email.includes(query));
  }

  state.filtered = data;
  renderTable(data);
}

// ── Validación individual ──────────────────────────────────────────────────
function validateEmail() {
  const input = document.getElementById('emailInput').value.trim().toLowerCase();
  const box   = document.getElementById('searchResult');

  if (!input) {
    showResult(box, 'warning', '⚠️', 'Introduce un email para validar.');
    return;
  }

  if (!EMAIL_REGEX.test(input)) {
    showResult(box, 'not-found', '✘', `<strong>${escapeHtml(input)}</strong> no tiene un formato de email válido.`);
    return;
  }

  if (state.emails.length === 0) {
    // Sin CSV cargado: solo validar formato
    showResult(box, 'found', '✔', `El formato de <strong>${escapeHtml(input)}</strong> es correcto. Carga un CSV para verificar si es socio.`);
    return;
  }

  const match = state.emails.find(e => e.email === input);

  if (match) {
    if (match.status === 'valid') {
      showResult(box, 'found', '✔', `<strong>${escapeHtml(input)}</strong> está registrado como socio activo.`);
    } else if (match.status === 'dupe') {
      showResult(box, 'warning', '⚠️', `<strong>${escapeHtml(input)}</strong> aparece en el listado pero está marcado como duplicado.`);
    } else {
      showResult(box, 'not-found', '✘', `<strong>${escapeHtml(input)}</strong> aparece en el listado pero con formato inválido.`);
    }
  } else {
    showResult(box, 'not-found', '✘', `<strong>${escapeHtml(input)}</strong> no se encuentra en el listado de socios.`);
  }
}

function showResult(box, type, icon, message) {
  box.className = `result-box ${type}`;
  box.innerHTML = `<span class="result-icon">${icon}</span><span>${message}</span>`;
  box.classList.remove('hidden');
}

// ── Info del archivo ───────────────────────────────────────────────────────
function showFileInfo(html, type) {
  const el = document.getElementById('fileInfo');
  el.innerHTML = html;
  el.style.borderLeftColor = type === 'error' ? 'var(--rojo-andaluz)' : 'var(--verde-oliva)';
  el.classList.remove('hidden');
}

// ── Exportar resultados ────────────────────────────────────────────────────
function exportResults() {
  if (state.filtered.length === 0) return;

  const header = 'email,estado,motivo\n';
  const rows   = state.filtered.map(e =>
    `"${e.email}","${e.status}","${e.reason}"`
  ).join('\n');

  const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `ateneo_socios_validados_${datestamp()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function datestamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}
