const SYMPTOMS = [
    { label: 'Headache', icon: '🤕' }, { label: 'Fatigue', icon: '😴' }, { label: 'Nausea', icon: '🤢' },
    { label: 'Stomach Pain', icon: '😣' }, { label: 'Anxiety', icon: '😰' }, { label: 'Chest Tightness', icon: '💢' },
    { label: 'Dizziness', icon: '💫' }, { label: 'Back Pain', icon: '🦴' }, { label: 'Fever', icon: '🌡️' },
    { label: 'Shortness of Breath', icon: '😮‍💨' }, { label: 'Joint Pain', icon: '🦵' }, { label: 'Skin Rash', icon: '🔴' },
];

const INT_COLORS = ['', '#d1fae5', '#a7f3d0', '#6ee7b7', '#fef3c7', '#fde68a', '#fcd34d', '#fce7f3', '#fbcfe8', '#f9a8d4', '#ec4899'];
let entries = JSON.parse(localStorage.getItem('symptomlog') || '[]');
let selectedSymptoms = [];

function initSymptoms() {
    document.getElementById('symptomGrid').innerHTML = SYMPTOMS.map(s => `
    <div class="sym-chip" id="sc-${s.label}" onclick="toggleSym('${s.label}')">
      <span class="sym-icon">${s.icon}</span>${s.label}
    </div>`).join('');
}

function toggleSym(label) {
    const chip = document.getElementById('sc-' + label);
    if (selectedSymptoms.includes(label)) {
        selectedSymptoms = selectedSymptoms.filter(s => s !== label);
        chip.classList.remove('selected');
    } else {
        selectedSymptoms.push(label);
        chip.classList.add('selected');
    }
}

function updateIntensity() {
    const v = document.getElementById('intensity').value;
    document.getElementById('intensityVal').textContent = v + ' / 10';
}

function logEntry() {
    const custom = document.getElementById('customSym').value.trim();
    const allSyms = [...selectedSymptoms, ...(custom ? [custom] : [])];
    if (!allSyms.length) { alert('Please select or type at least one symptom.'); return; }
    
    const entry = {
        id: Date.now(),
        date: document.getElementById('logDate').value || new Date().toISOString().split('T')[0],
        time: document.getElementById('logTime').value || new Date().toTimeString().slice(0, 5),
        symptoms: allSyms,
        intensity: +document.getElementById('intensity').value,
        sleep: document.getElementById('logSleep').value,
        eat: document.getElementById('logEat').value,
        stress: document.getElementById('logStress').value,
        water: document.getElementById('logWater').value,
        notes: document.getElementById('logNotes').value.trim(),
    };
    
    entries.unshift(entry);
    save(); renderEntries(); analyzePatterns();
    
    // Reset Form
    selectedSymptoms = [];
    document.querySelectorAll('.sym-chip').forEach(c => c.classList.remove('selected'));
    document.getElementById('customSym').value = '';
    document.getElementById('logNotes').value = '';
    document.getElementById('intensity').value = 5;
    updateIntensity();
    showToast('Entry logged ✓');
}

function save() { localStorage.setItem('symptomlog', JSON.stringify(entries)); }

function renderEntries() {
    const list = document.getElementById('entriesList');
    document.getElementById('entryCount').textContent = entries.length + ' entries';
    
    if (!entries.length) {
        list.innerHTML = '<div class="empty"><div class="empty-icon">🌿</div><div class="empty-text">Your journal is empty</div></div>';
        return;
    }
    
    list.innerHTML = entries.map(e => {
        const col = INT_COLORS[Math.min(e.intensity, 10)];
        return `<div class="entry-card">
      <div class="entry-dot" style="background:${col}"></div>
      <div class="entry-body">
        <div class="entry-time">${e.date} · ${e.time}</div>
        <div class="entry-sym">${e.symptoms.join(', ')}</div>
        <div class="entry-meta">
            <span class="entry-tag teal">Intensity ${e.intensity}/10</span>
            ${e.sleep ? `<span class="entry-tag">😴 ${e.sleep}</span>` : ''}
        </div>
        ${e.notes ? `<div class="entry-note">"${e.notes}"</div>` : ''}
      </div>
      <button class="entry-del" onclick="deleteEntry(${e.id})">✕</button>
    </div>`;
    }).join('');
}

function deleteEntry(id) { entries = entries.filter(e => e.id !== id); save(); renderEntries(); analyzePatterns(); }
function clearLog() { if (confirm('Clear all symptom entries?')) { entries = []; save(); renderEntries(); analyzePatterns(); } }

function analyzePatterns() {
    const card = document.getElementById('patternsCard');
    const show = document.getElementById('patternToggle')?.classList.contains('on') !== false;
    if (!show || entries.length < 3) { card.style.display = 'none'; return; }
    
    const insights = [];
    const symCount = {};
    entries.forEach(e => e.symptoms.forEach(s => { symCount[s] = (symCount[s] || 0) + 1; }));
    const topSym = Object.entries(symCount).sort((a, b) => b[1] - a[1])[0];
    
    if (topSym) insights.push(`<div class="pattern-insight">📊 <strong>${topSym[0]}</strong> is your most logged symptom.</div>`);
    
    document.getElementById('patternsInner').innerHTML = insights.join('') || '<div class="pattern-insight">Keep logging for more patterns.</div>';
    card.style.display = 'block';
}

function openSettings() { document.getElementById('settingsOverlay').classList.add('open') }
function closeSettingsOutside(e) { if (e.target === document.getElementById('settingsOverlay')) document.getElementById('settingsOverlay').classList.remove('open') }
function toggleTheme() {
    const t = document.getElementById('themeToggle');
    t.classList.toggle('on');
    document.documentElement.dataset.theme = t.classList.contains('on') ? 'dark' : '';
}
function togglePatterns() { document.getElementById('patternToggle').classList.toggle('on'); analyzePatterns(); }

function showToast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'toast';
        t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:var(--purple);color:white;padding:12px 24px;border-radius:100px;font-family:var(--sans);font-size:13px;font-weight:700;z-index:9999;transition:all 0.3s';
        document.body.appendChild(t);
    }
    t.textContent = msg; t.style.opacity = '1';
    setTimeout(() => { t.style.opacity = '0'; }, 2500);
}

function exportLog() {
    if (!entries.length) { alert('No entries to export!'); return; }
    const text = entries.map(e => `[${e.date}] ${e.symptoms.join(', ')} (Intensity: ${e.intensity})`).join('\n');
    navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard ✓'));
}

// Initialization
const now = new Date();
document.getElementById('logDate').value = now.toISOString().split('T')[0];
document.getElementById('logTime').value = now.toTimeString().slice(0, 5);
initSymptoms(); renderEntries(); analyzePatterns();