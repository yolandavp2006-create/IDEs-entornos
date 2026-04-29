// ===== Ateneo Siglo XXI — Email Validator =====
document.addEventListener('DOMContentLoaded', () => {

    // --- Elements ---
    const uploadZone = document.getElementById('upload-zone');
    const csvInput = document.getElementById('csv-input');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const btnRemoveFile = document.getElementById('btn-remove-file');
    const btnValidate = document.getElementById('btn-validate');
    const loading = document.getElementById('loading');
    const progressBar = document.getElementById('progress-bar');
    const resultsSection = document.getElementById('results-section');
    const uploadSection = document.getElementById('upload-section');
    const totalCount = document.getElementById('total-count');
    const validCount = document.getElementById('valid-count');
    const invalidCount = document.getElementById('invalid-count');
    const duplicateCount = document.getElementById('duplicate-count');
    const tabCountAll = document.getElementById('tab-count-all');
    const tabCountValid = document.getElementById('tab-count-valid');
    const tabCountInvalid = document.getElementById('tab-count-invalid');
    const tabCountDuplicate = document.getElementById('tab-count-duplicate');
    const resultsBody = document.getElementById('results-body');
    const searchInput = document.getElementById('search-input');
    const noResults = document.getElementById('no-results');
    const filterTabs = document.getElementById('filter-tabs');
    const btnExportAll = document.getElementById('btn-export-all');
    const btnExportValid = document.getElementById('btn-export-valid');
    const btnExportInvalid = document.getElementById('btn-export-invalid');
    const btnNewValidation = document.getElementById('btn-new-validation');

    // --- State ---
    let emails = [];
    let emailResults = [];
    let currentFilter = 'all';

    // --- Upload: click on zone opens file dialog ---
    // We stop propagation so clicking the zone doesn't trigger twice
    uploadZone.addEventListener('click', (e) => {
        // Only trigger if the click wasn't on the hidden input itself
        if (e.target !== csvInput) {
            csvInput.click();
        }
    });
    uploadZone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); csvInput.click(); }
    });

    // Drag & Drop
    uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.name.toLowerCase().endsWith('.csv')) handleFile(file);
    });

    // File input change
    csvInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
    });

    btnRemoveFile.addEventListener('click', (e) => { e.stopPropagation(); resetUpload(); });
    btnValidate.addEventListener('click', runValidation);
    btnNewValidation.addEventListener('click', () => {
        resetUpload();
        resultsSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
    });

    // Tabs
    filterTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab');
        if (!tab) return;
        filterTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        renderResults();
    });

    // Search
    searchInput.addEventListener('input', () => renderResults());

    // Export
    btnExportAll.addEventListener('click', () => exportCSV('all'));
    btnExportValid.addEventListener('click', () => exportCSV('valid'));
    btnExportInvalid.addEventListener('click', () => exportCSV('invalid'));

    // ===== Functions =====

    function handleFile(file) {
        fileName.textContent = file.name;
        fileSize.textContent = formatSize(file.size);
        fileInfo.classList.remove('hidden');
        uploadZone.classList.add('hidden');
        btnValidate.disabled = false;

        const reader = new FileReader();
        reader.onload = (e) => parseCSV(e.target.result);
        reader.readAsText(file, 'UTF-8');
    }

    function parseCSV(text) {
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length === 0) return;

        const delimiter = lines[0].includes(';') ? ';' : ',';
        const allValues = [];

        // Parse all cells from every row (including the header)
        for (const line of lines) {
            const cells = parseLine(line, delimiter);
            for (const cell of cells) {
                const trimmed = cell.trim();
                if (trimmed) allValues.push(trimmed);
            }
        }

        // Filter only values that look like they could be emails (contain @)
        emails = allValues.filter(v => v.includes('@'));

        // If no emails found with @, just take all non-header values
        if (emails.length === 0) {
            const headers = parseLine(lines[0], delimiter);
            for (let i = 1; i < lines.length; i++) {
                const cells = parseLine(lines[i], delimiter);
                for (const cell of cells) {
                    const trimmed = cell.trim();
                    if (trimmed) emails.push(trimmed);
                }
            }
        }
    }

    function parseLine(line, delimiter) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                inQuotes = !inQuotes;
            } else if (ch === delimiter && !inQuotes) {
                result.push(current.replace(/^["']|["']$/g, ''));
                current = '';
            } else {
                current += ch;
            }
        }
        result.push(current.replace(/^["']|["']$/g, ''));
        return result;
    }

    function resetUpload() {
        csvInput.value = '';
        fileInfo.classList.add('hidden');
        uploadZone.classList.remove('hidden');
        btnValidate.disabled = true;
        emails = [];
        emailResults = [];
    }

    async function runValidation() {
        if (emails.length === 0) return;

        loading.classList.remove('hidden');
        progressBar.style.width = '0%';
        emailResults = [];

        const seen = new Map();

        for (let i = 0; i < emails.length; i++) {
            const email = emails[i].trim();
            progressBar.style.width = ((i + 1) / emails.length * 100) + '%';

            if (!email) {
                emailResults.push({ email: '(vacío)', status: 'invalid', reason: 'Campo vacío' });
            } else if (seen.has(email.toLowerCase())) {
                emailResults.push({ email, status: 'duplicate', reason: 'Duplicado de #' + (seen.get(email.toLowerCase()) + 1) });
            } else {
                seen.set(email.toLowerCase(), i);
                const v = validateEmail(email);
                emailResults.push({ email, status: v.valid ? 'valid' : 'invalid', reason: v.reason });
            }

            if (i % 80 === 0) await sleep(20);
        }

        await sleep(300);
        loading.classList.add('hidden');
        showResults();
    }

    function validateEmail(email) {
        const e = email.trim();
        if (!e) return { valid: false, reason: 'Campo vacío' };
        if (e.length > 254) return { valid: false, reason: 'Demasiado largo' };
        if (!e.includes('@')) return { valid: false, reason: 'Falta @' };

        const parts = e.split('@');
        if (parts.length !== 2) return { valid: false, reason: 'Múltiples @' };
        const [local, domain] = parts;

        if (!local) return { valid: false, reason: 'Parte local vacía' };
        if (local.length > 64) return { valid: false, reason: 'Parte local demasiado larga' };
        if (!domain) return { valid: false, reason: 'Dominio vacío' };
        if (local.startsWith('.') || local.endsWith('.')) return { valid: false, reason: 'Punto al inicio/final' };
        if (local.includes('..')) return { valid: false, reason: 'Puntos consecutivos' };
        if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return { valid: false, reason: 'Caracteres inválidos' };
        if (!domain.includes('.')) return { valid: false, reason: 'Dominio sin punto' };
        if (domain.startsWith('.') || domain.endsWith('.')) return { valid: false, reason: 'Dominio mal formado' };
        if (domain.startsWith('-') || domain.endsWith('-')) return { valid: false, reason: 'Dominio con guión inválido' };

        const dp = domain.split('.');
        if (dp[dp.length - 1].length < 2) return { valid: false, reason: 'TLD demasiado corto' };
        if (!/^[a-zA-Z0-9.-]+$/.test(domain)) return { valid: false, reason: 'Caracteres inválidos en dominio' };
        for (const p of dp) {
            if (!p || p.length > 63) return { valid: false, reason: 'Parte del dominio inválida' };
        }

        return { valid: true, reason: 'Formato válido' };
    }

    function showResults() {
        const valid = emailResults.filter(r => r.status === 'valid');
        const invalid = emailResults.filter(r => r.status === 'invalid');
        const dups = emailResults.filter(r => r.status === 'duplicate');

        animateNum(totalCount, emailResults.length);
        animateNum(validCount, valid.length);
        animateNum(invalidCount, invalid.length);
        animateNum(duplicateCount, dups.length);

        tabCountAll.textContent = emailResults.length;
        tabCountValid.textContent = valid.length;
        tabCountInvalid.textContent = invalid.length;
        tabCountDuplicate.textContent = dups.length;

        currentFilter = 'all';
        filterTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.getElementById('tab-all').classList.add('active');
        searchInput.value = '';

        uploadSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        renderResults();
    }

    function renderResults() {
        const q = searchInput.value.toLowerCase().trim();
        let list = emailResults;
        if (currentFilter !== 'all') list = list.filter(r => r.status === currentFilter);
        if (q) list = list.filter(r => r.email.toLowerCase().includes(q));

        resultsBody.innerHTML = '';
        if (list.length === 0) { noResults.classList.remove('hidden'); return; }
        noResults.classList.add('hidden');

        const labels = { valid: '✓ Válido', invalid: '✗ Inválido', duplicate: '⟲ Duplicado' };
        list.forEach((r, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td>' + (i + 1) + '</td>' +
                '<td style="font-family:monospace;font-size:0.82rem;color:var(--text)">' + esc(r.email) + '</td>' +
                '<td><span class="status-badge status-' + r.status + '">' + labels[r.status] + '</span></td>' +
                '<td style="font-size:0.78rem">' + esc(r.reason) + '</td>';
            resultsBody.appendChild(tr);
        });
    }

    function exportCSV(type) {
        let data = emailResults;
        if (type === 'valid') data = data.filter(r => r.status === 'valid');
        else if (type === 'invalid') data = data.filter(r => r.status === 'invalid');

        const rows = ['Correo,Estado,Motivo'];
        data.forEach(r => rows.push('"' + r.email + '","' + r.status + '","' + r.reason + '"'));

        const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'ateneo_correos_' + type + '_' + new Date().toISOString().slice(0, 10) + '.csv';
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function animateNum(el, target) {
        let cur = 0;
        const step = Math.max(1, Math.ceil(target / 25));
        const iv = setInterval(() => {
            cur += step;
            if (cur >= target) { cur = target; clearInterval(iv); }
            el.textContent = cur;
        }, 30);
    }

    function formatSize(b) {
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(1) + ' MB';
    }

    function esc(s) {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
});
