'use strict';

const state = {
    screen: 'welcome',      // welcome | location | radius | quiz | results
    quizStep: 0,
    answers: {},
    position: null,         // { lat, lon, label, sub, source }
    radius: 30,
    sort: 'affinita',
    schools: null,
    comuni: null,
    dataError: null,
    archPct: null
};

const app = () => document.getElementById('app');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ======================= data ======================= */

async function loadData() {
    try {
        const [s, c] = await Promise.all([
            fetch('./data/scuole.json').then(r => { if (!r.ok) throw new Error('scuole ' + r.status); return r.json(); }),
            fetch('./data/comuni.json').then(r => { if (!r.ok) throw new Error('comuni ' + r.status); return r.json(); })
        ]);
        state.schools = s.scuole || s;
        state.comuni = c.comuni || c;
        state.meta = s.meta || null;
    } catch (e) {
        state.dataError = e.message || String(e);
    }
}

/* ======================= geo ======================= */

function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

function nearestComune(lat, lon) {
    let best = null, bestD = Infinity;
    for (const c of state.comuni) {
        const d = haversine(lat, lon, c.lat, c.lon);
        if (d < bestD) { bestD = d; best = c; }
    }
    return best ? { comune: best, dist: bestD } : null;
}

function schoolsInRadius() {
    if (!state.position || !state.schools) return [];
    const { lat, lon } = state.position;
    return state.schools
        .map(s => ({ ...s, dist: haversine(lat, lon, s.lat, s.lon) }))
        .filter(s => s.dist <= state.radius);
}

/* ======================= affinity ======================= */

function userProfile() {
    const p = {};
    for (const q of QUESTIONS) {
        if (q.type === 'multi') {
            for (const i of (state.answers[q.id] || [])) {
                for (const [k, v] of Object.entries(q.options[i].keys)) p[k] = (p[k] || 0) + v;
            }
        } else {
            const r = state.answers[q.id] || {};
            for (const [idx, val] of Object.entries(r)) {
                const factor = val / 4;
                for (const [k, v] of Object.entries(q.options[+idx].keys)) {
                    p[k] = (p[k] || 0) + v * factor;
                }
            }
        }
    }
    return p;
}

function archetypeScores() {
    const prof = userProfile();
    const out = {};
    for (const [key, arch] of Object.entries(ARCHETYPES)) {
        let score = 0, max = 0;
        for (const [k, w] of Object.entries(arch.w)) {
            if (w > 0) { score += (prof[k] || 0) * w; max += 5 * w; }
        }
        out[key] = max ? Math.min(Math.round(score / max * 100), 99) : 0;
    }
    const top = Math.max(...Object.values(out));
    if (top > 0 && top < 50) {
        const boost = 55 - top;
        for (const k of Object.keys(out)) out[k] = Math.min(out[k] + boost, 99);
    }
    return out;
}

function rankedResults() {
    const pct = state.archPct || (state.archPct = archetypeScores());
    const inRadius = schoolsInRadius();
    const scored = [], others = [];

    for (const s of inRadius) {
        let best = null;
        for (const ind of s.indirizzi) {
            if (!ARCHETYPES[ind.key]) continue;
            const p = pct[ind.key] || 0;
            if (!best || p > best.pct) best = { pct: p, key: ind.key, label: ind.label };
        }
        if (best) scored.push({ ...s, pct: best.pct, matchKey: best.key, matchLabel: best.label });
        else others.push(s);
    }

    const cmp = state.sort === 'distanza'
        ? (a, b) => a.dist - b.dist || b.pct - a.pct
        : (a, b) => b.pct - a.pct || a.dist - b.dist;
    scored.sort(cmp);
    others.sort((a, b) => a.dist - b.dist);
    return { scored, others, total: inRadius.length };
}

/* ======================= render ======================= */

function render() {
    const el = app();
    window.scrollTo(0, 0);
    if (state.dataError) return renderDataError(el);
    if (!state.schools) return renderLoading(el);
    switch (state.screen) {
        case 'welcome': return renderWelcome(el);
        case 'location': return renderLocation(el);
        case 'radius': return renderRadius(el);
        case 'quiz': return renderQuiz(el);
        case 'results': return renderResults(el);
    }
}

function renderLoading(el) {
    el.innerHTML = `<div class="card welcome">
        <div class="spinner"></div>
        <p style="color:var(--text-light)">Caricamento delle scuole...</p>
    </div>`;
}

function renderDataError(el) {
    el.innerHTML = `<div class="card">
        <h2 class="screen-title">Non riesco a caricare i dati</h2>
        <div class="error-box">
            L'elenco delle scuole non e' disponibile (${esc(state.dataError)}).<br>
            Se e' la prima volta che apri l'app, controlla la connessione e riprova.
        </div>
        <div class="nav-buttons">
            <button class="btn btn-primary" onclick="location.reload()">Riprova</button>
        </div>
    </div>`;
}

function renderWelcome(el) {
    const n = state.schools.length;
    el.innerHTML = `<div class="card welcome">
        <div class="icon-big">\u{1F393}</div>
        <h2>Quale scuola superiore scegliere?</h2>
        <p>
            Rispondi a <strong>9 domande</strong> sui tuoi interessi e scopri quali
            indirizzi di studio ti somigliano di piu, tra le
            <strong>${n} scuole della Lombardia</strong>.
        </p>
        <ul class="steps">
            <li><span class="num">1</span><span>Dici da dove parti, con il GPS o scegliendo il comune</span></li>
            <li><span class="num">2</span><span>Imposti quanti chilometri sei disposta/o a fare</span></li>
            <li><span class="num">3</span><span>Rispondi al questionario sui tuoi gusti</span></li>
            <li><span class="num">4</span><span>Ricevi la classifica delle scuole in zona</span></li>
        </ul>
        <button class="btn btn-primary btn-block" onclick="go('location')">Iniziamo \u{27A1}\u{FE0F}</button>
    </div>`;
}

/* ---------- location ---------- */

function renderLocation(el) {
    const p = state.position;
    el.innerHTML = `<div class="card">
        <h2 class="screen-title">Da dove parti?</h2>
        <div class="hint">Serve per cercare le scuole raggiungibili da casa tua</div>

        ${p ? `<div class="loc-chosen">
            <span class="lc-icon">${p.source === 'gps' ? '\u{1F4CD}' : '\u{1F3E0}'}</span>
            <div>
                <div class="lc-name">${esc(p.label)}</div>
                <div class="lc-sub">${esc(p.sub)}</div>
            </div>
        </div>` : ''}

        <button class="btn btn-primary btn-block" id="gps-btn" onclick="useGPS()">
            \u{1F4CD} Usa la mia posizione
        </button>

        <div class="loc-or">oppure</div>

        <div class="search-wrap">
            <input type="search" id="comune-input" placeholder="Cerca il tuo comune..."
                   autocomplete="off" oninput="onComuneInput(this.value)">
            <ul class="suggestions" id="comune-list"></ul>
        </div>

        <div id="loc-error"></div>

        <div class="nav-buttons">
            <button class="btn btn-secondary" onclick="go('welcome')">\u{2B05}\u{FE0F} Indietro</button>
            <button class="btn btn-primary" ${p ? '' : 'disabled'} onclick="go('radius')">
                Avanti \u{27A1}\u{FE0F}
            </button>
        </div>
    </div>`;
}

function onComuneInput(v) {
    const list = document.getElementById('comune-list');
    const q = v.trim().toLowerCase();
    if (q.length < 2) { list.innerHTML = ''; return; }
    const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const nq = norm(q);
    const matches = state.comuni
        .filter(c => norm(c.nome).includes(nq))
        .sort((a, b) => {
            const sa = norm(a.nome).startsWith(nq) ? 0 : 1;
            const sb = norm(b.nome).startsWith(nq) ? 0 : 1;
            return sa - sb || a.nome.localeCompare(b.nome);
        })
        .slice(0, 10);
    list.innerHTML = matches.map((c, i) => `
        <li onclick="pickComune(${state.comuni.indexOf(c)})">
            <span class="s-name">${esc(c.nome)}</span>
            <span class="s-prov">${esc(c.provincia)}</span>
        </li>`).join('');
}

function pickComune(idx) {
    const c = state.comuni[idx];
    if (!c) return;
    state.position = {
        lat: c.lat, lon: c.lon,
        label: c.nome, sub: `Provincia di ${c.provincia}`,
        source: 'comune'
    };
    render();
}

function useGPS() {
    const errBox = document.getElementById('loc-error');
    if (!navigator.geolocation) {
        errBox.innerHTML = `<div class="error-box">Il tuo browser non supporta la geolocalizzazione. Scegli il comune dall'elenco.</div>`;
        return;
    }
    const btn = document.getElementById('gps-btn');
    btn.disabled = true;
    btn.innerHTML = `\u{23F3} Rilevamento in corso...`;
    errBox.innerHTML = '';

    navigator.geolocation.getCurrentPosition(
        pos => {
            const { latitude: lat, longitude: lon } = pos.coords;
            const near = nearestComune(lat, lon);
            const inLombardia = near && near.dist < 25;
            state.position = {
                lat, lon,
                label: inLombardia ? near.comune.nome : 'Posizione rilevata',
                sub: inLombardia
                    ? `Provincia di ${near.comune.provincia} \u{2022} GPS`
                    : `Fuori dalla Lombardia \u{2022} ${lat.toFixed(3)}, ${lon.toFixed(3)}`,
                source: 'gps'
            };
            render();
            if (!inLombardia) {
                document.getElementById('loc-error').innerHTML =
                    `<div class="error-box">Sembri fuori dalla Lombardia. L'app conosce solo le scuole lombarde,
                     quindi potresti non trovare risultati: puoi comunque scegliere un comune dall'elenco.</div>`;
            }
        },
        err => {
            const msg = {
                1: "Hai negato l'accesso alla posizione. Puoi attivarlo dalle impostazioni del browser, oppure scegliere il comune dall'elenco.",
                2: 'Posizione non disponibile in questo momento. Prova a scegliere il comune dall\'elenco.',
                3: 'Rilevamento troppo lento. Prova di nuovo o scegli il comune dall\'elenco.'
            }[err.code] || 'Non riesco a rilevare la posizione. Scegli il comune dall\'elenco.';
            render();
            document.getElementById('loc-error').innerHTML = `<div class="error-box">${esc(msg)}</div>`;
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 }
    );
}

/* ---------- radius ---------- */

function renderRadius(el) {
    const found = schoolsInRadius().length;
    el.innerHTML = `<div class="card">
        <h2 class="screen-title">Quanto lontano puoi andare?</h2>
        <div class="hint">Distanza in linea d'aria da ${esc(state.position.label)}</div>

        <div class="radius-value">
            <span class="rv-num" id="rv-num">${state.radius}</span><span class="rv-unit"> km</span>
        </div>
        <input type="range" min="2" max="100" step="1" value="${state.radius}"
               oninput="onRadius(this.value)">
        <div class="range-ends"><span>2 km</span><span>100 km</span></div>

        <div class="found-box" id="found-box">
            <strong>${found}</strong>
            ${found === 1 ? 'scuola trovata in questo raggio' : 'scuole trovate in questo raggio'}
        </div>

        <div class="nav-buttons">
            <button class="btn btn-secondary" onclick="go('location')">\u{2B05}\u{FE0F} Indietro</button>
            <button class="btn btn-primary" ${found ? '' : 'disabled'} onclick="startQuiz()">
                Avanti \u{27A1}\u{FE0F}
            </button>
        </div>
        ${found ? '' : `<div class="error-box">Nessuna scuola in questo raggio: prova ad aumentare la distanza.</div>`}
    </div>`;
}

function onRadius(v) {
    state.radius = +v;
    document.getElementById('rv-num').textContent = v;
    const found = schoolsInRadius().length;
    document.getElementById('found-box').innerHTML =
        `<strong>${found}</strong> ${found === 1 ? 'scuola trovata in questo raggio' : 'scuole trovate in questo raggio'}`;
    const next = document.querySelector('.nav-buttons .btn-primary');
    if (next) next.disabled = !found;
}

/* ---------- quiz ---------- */

function startQuiz() { state.screen = 'quiz'; state.quizStep = 0; render(); }

function renderQuiz(el) {
    const q = QUESTIONS[state.quizStep];
    const progress = (state.quizStep / QUESTIONS.length * 100).toFixed(0);
    const body = q.type === 'multi' ? multiHTML(q) : ratingHTML(q);
    const ok = canProceed(q);
    const last = state.quizStep === QUESTIONS.length - 1;

    el.innerHTML = `
        <div class="progress-text">Domanda ${state.quizStep + 1} di ${QUESTIONS.length}</div>
        <div class="progress-bar-container"><div class="progress-bar-fill" style="width:${progress}%"></div></div>
        <div class="card">
            <h2 class="screen-title">${esc(q.text)}</h2>
            ${q.hint ? `<div class="hint">${esc(q.hint)}</div>` : ''}
            ${body}
        </div>
        <div class="nav-buttons">
            <button class="btn btn-secondary" onclick="quizBack()">\u{2B05}\u{FE0F} Indietro</button>
            <button class="btn btn-primary" ${ok ? '' : 'disabled'} onclick="quizNext()">
                ${last ? 'Vedi i risultati \u{1F389}' : 'Avanti \u{27A1}\u{FE0F}'}
            </button>
        </div>`;
}

function multiHTML(q) {
    const sel = state.answers[q.id] || [];
    return q.options.map((o, i) => `
        <div class="option${sel.includes(i) ? ' selected' : ''}"
             onclick="toggleMulti('${q.id}',${i},${q.maxSelect || 99})">
            <div class="check"></div>
            <span class="emoji">${o.emoji}</span>
            <span class="label">${esc(o.label)}</span>
        </div>`).join('');
}

function ratingHTML(q) {
    const r = state.answers[q.id] || {};
    const colors = ['#E57373', '#FFB74D', '#B0B8D9', '#81C784', '#5B6ABF'];
    const legend = `
        <div class="rating-legend">${RATING_LABELS.map(l => `<span>${l.short}</span>`).join('')}</div>
        <div class="rating-legend-mobile">${RATING_LABELS.map((l, i) =>
            `<span class="legend-item"><span class="legend-dot" style="background:${colors[i]}">${l.mini}</span>${esc(l.text)}</span>`
        ).join('')}</div>`;
    const rows = q.options.map((o, i) => `
        <div class="rating-row${r[i] !== undefined ? ' rated' : ''}">
            <div class="row-label">
                <span class="emoji">${o.emoji}</span>
                <span class="label-text">${esc(o.label)}</span>
            </div>
            <div class="rating-pills">
                ${RATING_LABELS.map((l, v) => `
                    <div class="pill${r[i] === v ? ' active' : ''}" data-val="${v}"
                         onclick="setRating('${q.id}',${i},${v})">
                        <span class="pill-full">${l.short}</span><span class="pill-mini">${l.mini}</span>
                    </div>`).join('')}
            </div>
        </div>`).join('');
    return legend + rows;
}

function canProceed(q) {
    if (q.type === 'multi') return (state.answers[q.id] || []).length > 0;
    return Object.keys(state.answers[q.id] || {}).length === q.options.length;
}

function toggleMulti(id, idx, max) {
    const a = state.answers[id] || (state.answers[id] = []);
    const at = a.indexOf(idx);
    if (at >= 0) a.splice(at, 1);
    else if (a.length < max) a.push(idx);
    state.archPct = null;
    render();
}

function setRating(id, idx, val) {
    (state.answers[id] || (state.answers[id] = {}))[idx] = val;
    state.archPct = null;
    render();
}

function quizBack() {
    if (state.quizStep > 0) { state.quizStep--; render(); }
    else go('radius');
}

function quizNext() {
    if (!canProceed(QUESTIONS[state.quizStep])) return;
    if (state.quizStep < QUESTIONS.length - 1) { state.quizStep++; render(); }
    else { state.archPct = null; go('results'); }
}

/* ---------- results ---------- */

function renderResults(el) {
    const { scored, others, total } = rankedResults();

    const svgPdf = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg>`;
    const svgWa = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

    el.innerHTML = `
        <div class="results-head">
            <h2>\u{1F31F} I tuoi risultati</h2>
            <p>${total} ${total === 1 ? 'scuola' : 'scuole'} entro ${state.radius} km da
               <strong>${esc(state.position.label)}</strong></p>
        </div>

        <div class="action-buttons">
            <button class="btn btn-pdf" onclick="downloadPDF()">${svgPdf} Scarica PDF</button>
            <button class="btn btn-whatsapp" onclick="shareWhatsApp()">${svgWa} Invia su WhatsApp</button>
        </div>

        ${scored.length > 1 ? `<div class="sort-toggle">
            <button class="${state.sort === 'affinita' ? 'active' : ''}" onclick="setSort('affinita')">Per affinita</button>
            <button class="${state.sort === 'distanza' ? 'active' : ''}" onclick="setSort('distanza')">Per distanza</button>
        </div>` : ''}

        <div id="results-area">
            ${scored.length ? scored.map((s, i) => schoolHTML(s, i)).join('')
                : `<div class="card empty-box">
                       <div class="eb-icon">\u{1F50D}</div>
                       Nessun indirizzo classificabile in questo raggio.<br>
                       Prova ad aumentare la distanza.
                   </div>`}

            ${others.length ? `<div class="other-section">
                <h3>Altre scuole in zona (${others.length})</h3>
                <p class="note">Per queste l'indirizzo preciso non e' indicato nei dati ufficiali,
                   quindi non possiamo calcolare l'affinita. Vale la pena controllare il loro sito.</p>
                ${others.map(s => schoolHTML(s, -1)).join('')}
            </div>` : ''}
        </div>

        <div class="nav-buttons">
            <button class="btn btn-secondary" onclick="go('radius')">\u{1F4CD} Cambia zona</button>
            <button class="btn btn-accent" onclick="restart()">\u{1F504} Rifai il test</button>
        </div>

        <div class="disclaimer">
            Test indicativo, pensato per farsi un'idea. Dati scuole: Ministero dell'Istruzione
            ${state.meta && state.meta.annoScolastico ? '(' + esc(state.meta.annoScolastico) + ')' : ''}.<br>
            Molte scuole offrono piu indirizzi di quelli elencati: verifica sempre sul sito
            della scuola e vai agli open day.
        </div>`;

    requestAnimationFrame(() => {
        document.querySelectorAll('.bar-fill').forEach(b => { b.style.width = b.dataset.w + '%'; });
    });
}

function schoolHTML(s, rank) {
    const cls = rank === 0 ? ' top-1' : rank === 1 ? ' top-2' : rank === 2 ? ' top-3' : '';
    const hasPct = s.pct !== undefined;
    const maps = `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lon}`;
    const extra = s.indirizzi.filter(i => i.key !== s.matchKey && ARCHETYPES[i.key]);
    return `<div class="school${cls}">
        <div class="school-top">
            ${hasPct ? `<div class="school-rank">${rank + 1}</div>` : ''}
            <div class="school-main">
                <div class="school-indirizzo">${esc(hasPct ? s.matchLabel : s.indirizzi[0].label)}</div>
                <div class="school-nome">${esc(s.nome)}</div>
            </div>
            ${hasPct ? `<div class="school-pct">${s.pct}%</div>` : ''}
        </div>
        ${hasPct ? `<div class="bar-track"><div class="bar-fill" style="width:0%" data-w="${s.pct}"></div></div>` : ''}
        <div class="school-meta">
            <span class="chip dist">\u{1F4CD} ${s.dist < 10 ? s.dist.toFixed(1) : Math.round(s.dist)} km</span>
            <span class="chip ${s.statale ? 'stat' : 'par'}">${s.statale ? 'Statale' : 'Paritaria'}</span>
            ${(ARCHETYPES[s.matchKey] ? ARCHETYPES[s.matchKey].tags : []).slice(0, 3)
                .map(t => `<span class="chip">${esc(t)}</span>`).join('')}
        </div>
        <div class="school-addr">${esc(s.via)}, ${esc(s.cap)} ${esc(s.comune)} (${esc(s.provincia)})</div>
        ${extra.length ? `<div class="school-addr">Nello stesso plesso anche:
            ${extra.map(i => esc(i.label)).join(', ')}</div>` : ''}
        <div class="school-links">
            ${s.sito ? `<a href="${esc(s.sito)}" target="_blank" rel="noopener">\u{1F310} Sito</a>` : ''}
            <a href="${maps}" target="_blank" rel="noopener">\u{1F5FA}\u{FE0F} Mappa</a>
            ${s.email ? `<a href="mailto:${esc(s.email)}">\u{2709}\u{FE0F} Email</a>` : ''}
        </div>
    </div>`;
}

function setSort(mode) { state.sort = mode; render(); }

/* ======================= export ======================= */

function answersSummary() {
    return QUESTIONS.map(q => {
        const out = { question: q.text, items: [] };
        if (q.type === 'multi') {
            for (const i of (state.answers[q.id] || [])) {
                out.items.push({ text: q.options[i].label, value: '' });
            }
        } else {
            const r = state.answers[q.id] || {};
            for (const [i, v] of Object.entries(r)) {
                out.items.push({ text: q.options[+i].label, value: RATING_LABELS[v].text });
            }
        }
        return out;
    });
}

function shareText() {
    const { scored } = rankedResults();
    let t = `I miei risultati - Orientamento Scuole Superiori\n`;
    t += `Entro ${state.radius} km da ${state.position.label}\n\n`;
    scored.slice(0, 5).forEach((s, i) => {
        const medal = ['\u{1F947}', '\u{1F948}', '\u{1F949}'][i] || '  ';
        t += `${medal} ${s.pct}% - ${s.matchLabel}\n     ${s.nome} (${s.comune}, ${Math.round(s.dist)} km)\n`;
    });
    t += `\nScopri anche tu la tua scuola ideale!`;
    return t;
}

function overlay(msg) {
    const d = document.createElement('div');
    d.className = 'overlay';
    d.id = 'ov';
    d.innerHTML = `<div class="overlay-box"><div class="spinner"></div><p>${esc(msg)}</p></div>`;
    document.body.appendChild(d);
}
function closeOverlay() { const o = document.getElementById('ov'); if (o) o.remove(); }

function downloadPDF() {
    if (!window.jspdf) { alert('Libreria PDF non ancora caricata: riprova tra un istante.'); return; }
    overlay('Generazione PDF...');
    setTimeout(() => {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            const W = 210, M = 16, CW = W - M * 2;
            let y = 20;
            const page = need => { if (y + need > 275) { doc.addPage(); y = 20; } };

            doc.setFillColor(91, 106, 191);
            doc.rect(0, 0, W, 30, 'F');
            doc.setTextColor(255, 255, 255).setFontSize(16).setFont('helvetica', 'bold');
            doc.text('Orientamento Scuole Superiori', W / 2, 13, { align: 'center' });
            doc.setFontSize(9).setFont('helvetica', 'normal');
            doc.text(`Entro ${state.radius} km da ${state.position.label}`, W / 2, 20, { align: 'center' });
            const now = new Date();
            doc.setFontSize(7.5);
            doc.text(now.toLocaleDateString('it-IT') + ' ' +
                now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
                W / 2, 26, { align: 'center' });
            y = 40;

            const { scored, others } = rankedResults();

            doc.setTextColor(61, 74, 138).setFontSize(13).setFont('helvetica', 'bold');
            doc.text('Classifica di affinita', M, y);
            y += 2.5;
            doc.setDrawColor(91, 106, 191).setLineWidth(.4).line(M, y, M + CW, y);
            y += 7;

            const colors = [[245, 166, 35], [148, 163, 184], [205, 127, 50]];
            scored.forEach((s, i) => {
                page(20);
                doc.setTextColor(45, 49, 66).setFontSize(10).setFont('helvetica', 'bold');
                doc.text(`${i + 1}.`, M, y);
                doc.text(doc.splitTextToSize(s.matchLabel, CW - 30)[0], M + 7, y);
                doc.setTextColor(91, 106, 191).setFontSize(12);
                doc.text(s.pct + '%', W - M, y, { align: 'right' });
                y += 3;
                doc.setFillColor(226, 230, 239).roundedRect(M + 7, y, CW - 7, 4, 1.5, 1.5, 'F');
                const c = colors[i] || [91, 106, 191];
                doc.setFillColor(c[0], c[1], c[2]);
                if (s.pct > 0) doc.roundedRect(M + 7, y, (CW - 7) * s.pct / 100, 4, 1.5, 1.5, 'F');
                y += 6.5;
                doc.setTextColor(107, 114, 128).setFontSize(8).setFont('helvetica', 'normal');
                const line = `${s.nome} - ${s.via}, ${s.cap} ${s.comune} (${s.provincia})`;
                for (const l of doc.splitTextToSize(line, CW - 7)) { page(6); doc.text(l, M + 7, y); y += 3.8; }
                doc.text(`${s.statale ? 'Statale' : 'Paritaria'} - ${Math.round(s.dist)} km`, M + 7, y);
                y += 7;
            });

            if (others.length) {
                page(18);
                y += 3;
                doc.setTextColor(61, 74, 138).setFontSize(11).setFont('helvetica', 'bold');
                doc.text(`Altre scuole in zona (${others.length})`, M, y);
                y += 6;
                doc.setTextColor(107, 114, 128).setFontSize(8).setFont('helvetica', 'normal');
                for (const s of others) {
                    page(6);
                    doc.text(doc.splitTextToSize(
                        `- ${s.nome} - ${s.comune} (${Math.round(s.dist)} km)`, CW)[0], M, y);
                    y += 4;
                }
                y += 4;
            }

            page(20);
            doc.setTextColor(61, 74, 138).setFontSize(13).setFont('helvetica', 'bold');
            doc.text('Le tue risposte', M, y);
            y += 2.5;
            doc.setDrawColor(91, 106, 191).line(M, y, M + CW, y);
            y += 7;

            for (const qs of answersSummary()) {
                page(16);
                doc.setTextColor(45, 49, 66).setFontSize(9.5).setFont('helvetica', 'bold');
                for (const l of doc.splitTextToSize(qs.question, CW)) { page(6); doc.text(l, M, y); y += 4.6; }
                y += 1;
                doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(107, 114, 128);
                for (const it of qs.items) {
                    page(6);
                    const txt = '  - ' + it.text + (it.value ? '  ->  ' + it.value : '');
                    for (const l of doc.splitTextToSize(txt, CW - 3)) { page(6); doc.text(l, M + 2, y); y += 4; }
                }
                y += 4;
            }

            page(16);
            y += 3;
            doc.setDrawColor(200, 200, 200).line(M, y, M + CW, y);
            y += 5;
            doc.setTextColor(156, 163, 175).setFontSize(7).setFont('helvetica', 'italic');
            doc.text('Test indicativo. Dati scuole: Ministero dell\'Istruzione. Molte scuole offrono piu indirizzi', W / 2, y, { align: 'center' });
            y += 3.4;
            doc.text('di quelli elencati: verifica sul sito della scuola e partecipa agli open day.', W / 2, y, { align: 'center' });

            doc.save('Orientamento_Scuole_Superiori.pdf');
        } catch (e) {
            console.error(e);
            alert('Errore nella generazione del PDF.');
        }
        closeOverlay();
    }, 80);
}

function shareWhatsApp() {
    const area = document.getElementById('results-area');
    if (!window.html2canvas || !area) { openWhatsAppText(); return; }
    overlay('Preparazione immagine...');
    setTimeout(() => {
        html2canvas(area, { scale: 2, backgroundColor: '#F4F6FB', useCORS: true, logging: false })
            .then(canvas => canvas.toBlob(blob => {
                closeOverlay();
                const file = new File([blob], 'Orientamento_Scuole.png', { type: 'image/png' });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    navigator.share({
                        title: 'I miei risultati - Orientamento Scuole Superiori',
                        text: shareText(), files: [file]
                    }).catch(() => downloadThenWhatsApp(canvas));
                } else downloadThenWhatsApp(canvas);
            }, 'image/png'))
            .catch(() => { closeOverlay(); openWhatsAppText(); });
    }, 150);
}

function downloadThenWhatsApp(canvas) {
    const a = document.createElement('a');
    a.download = 'Orientamento_Scuole.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
    setTimeout(openWhatsAppText, 500);
}

function openWhatsAppText() {
    window.open('https://wa.me/?text=' + encodeURIComponent(shareText()), '_blank');
}

/* ======================= nav ======================= */

function go(screen) { state.screen = screen; render(); }

function restart() {
    state.answers = {};
    state.archPct = null;
    state.quizStep = 0;
    state.sort = 'affinita';
    state.screen = 'quiz';
    render();
}

/* ======================= PWA ======================= */

let installEvent = null;
window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installEvent = e;
    if (sessionStorage.getItem('installDismissed')) return;
    const b = document.createElement('div');
    b.className = 'install-banner';
    b.id = 'install-banner';
    b.innerHTML = `<div class="ib-text">Installa l'app sul telefono per usarla anche offline</div>
        <button onclick="doInstall()">Installa</button>
        <button class="ib-close" onclick="dismissInstall()">\u{2715}</button>`;
    document.body.appendChild(b);
});

function doInstall() {
    if (installEvent) { installEvent.prompt(); installEvent = null; }
    dismissInstall();
}
function dismissInstall() {
    sessionStorage.setItem('installDismissed', '1');
    const b = document.getElementById('install-banner');
    if (b) b.remove();
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

/* ======================= boot ======================= */

(async () => {
    render();
    await loadData();
    render();
})();
