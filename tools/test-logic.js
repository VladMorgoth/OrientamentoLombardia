// Esegue il vero app.js in un contesto con DOM finto e verifica il motore di affinita.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appDir = process.argv[2];
const elStub = () => ({
    innerHTML: '', textContent: '', disabled: false, value: '', style: {},
    appendChild() {}, remove() {}, addEventListener() {}, classList: { add() {}, remove() {} }
});

const ctx = {
    console,
    setTimeout, clearTimeout, requestAnimationFrame: fn => fn(),
    document: {
        getElementById: elStub,
        querySelector: elStub,
        querySelectorAll: () => [],
        createElement: elStub,
        body: { appendChild() {} },
        addEventListener() {}
    },
    window: { addEventListener() {}, scrollTo() {}, open() {} },
    navigator: {},
    sessionStorage: { getItem: () => null, setItem() {} },
    location: { reload() {} },
    alert: m => console.log('ALERT:', m),
    async fetch(url) {
        const file = path.join(appDir, url.replace(/^\.\//, ''));
        if (!fs.existsSync(file)) return { ok: false, status: 404 };
        const body = fs.readFileSync(file, 'utf8');
        return { ok: true, status: 200, json: async () => JSON.parse(body) };
    }
};
ctx.globalThis = ctx;
ctx.self = ctx;
vm.createContext(ctx);

for (const f of ['catalogo.js', 'app.js']) {
    vm.runInContext(fs.readFileSync(path.join(appDir, f), 'utf8'), ctx, { filename: f });
}
// I const di primo livello vivono nello scope lessicale globale, condiviso fra gli script
// dello stesso contesto: un secondo script puo' leggerli ed esporli.
vm.runInContext(
    'globalThis.state = state; globalThis.QUESTIONS = QUESTIONS;'
    + 'globalThis.ARCHETYPES = ARCHETYPES; globalThis.RATING_LABELS = RATING_LABELS;',
    ctx, { filename: 'expose.js' });

function answerAll(profile) {
    const a = {};
    for (const q of ctx.QUESTIONS) {
        if (q.type === 'multi') a[q.id] = profile.multi[q.id] || [0];
        else {
            a[q.id] = {};
            q.options.forEach((o, i) => { a[q.id][i] = profile.rate(q.id, i, o); });
        }
    }
    return a;
}

// Profilo "scientifico/tecnologico": logica, computer, universita, teoria
const nerd = {
    multi: { materie: [0, 4], hobby: [1, 0] },
    rate: (qid, i, o) => {
        const k = Object.keys(o.keys);
        const hi = ['logica', 'computer', 'uni', 'studio', 'curiosita', 'tecnico',
            'prog', 'laboratorio', 'orario_mattina', 'mate', 'fisi', 'info'];
        return k.some(x => hi.includes(x)) ? 4 : 1;
    }
};

// Profilo "creativo/artistico": creare, arte, atelier, pratica
const artist = {
    multi: { materie: [5, 1], hobby: [2, 0] },
    rate: (qid, i, o) => {
        const k = Object.keys(o.keys);
        const hi = ['creare', 'artistica', 'atelier', 'pratica', 'arte', 'disegno',
            'orario_pomeriggio', 'comunicare'];
        return k.some(x => hi.includes(x)) ? 4 : 1;
    }
};

// Profilo "sociale/assistenziale": persone, empatia, volontariato
const carer = {
    multi: { materie: [7, 1], hobby: [6, 0] },
    rate: (qid, i, o) => {
        const k = Object.keys(o.keys);
        const hi = ['persone', 'empatia', 'volontariato', 'psic', 'dibattito',
            'comunicare', 'lavoro', 'stage', 'pratica'];
        return k.some(x => hi.includes(x)) ? 4 : 1;
    }
};

(async () => {
    await ctx.loadData();
    if (ctx.state.dataError) { console.log('DATA ERROR:', ctx.state.dataError); process.exit(1); }

    const S = ctx.state;
    console.log('scuole caricate:', S.schools.length, '| comuni:', S.comuni.length);

    // Integrita dati
    const badGeo = S.schools.filter(s => !(s.lat > 35 && s.lat < 48 && s.lon > 6 && s.lon < 19));
    const noInd = S.schools.filter(s => !s.indirizzi || !s.indirizzi.length);
    const unknownArch = new Set();
    for (const s of S.schools) for (const i of s.indirizzi)
        if (i.key !== 'generico' && !ctx.ARCHETYPES[i.key]) unknownArch.add(i.key);
    console.log('coordinate fuori range:', badGeo.length,
        '| senza indirizzi:', noInd.length,
        '| archetipi sconosciuti:', [...unknownArch].join(',') || 'nessuno');

    // Distanza nota: Sondrio -> Milano ~ 95 km in linea d'aria
    const so = S.comuni.find(c => c.nome === 'Sondrio');
    const mi = S.comuni.find(c => c.nome === 'Milano');
    console.log('check haversine Sondrio-Milano:',
        ctx.haversine(so.lat, so.lon, mi.lat, mi.lon).toFixed(1), 'km (atteso ~95)');

    for (const [name, prof] of [['SCIENTIFICO/TECH', nerd], ['CREATIVO/ARTE', artist], ['SOCIALE/CURA', carer]]) {
        S.position = { lat: so.lat, lon: so.lon, label: 'Sondrio', sub: '', source: 'comune' };
        S.radius = 30;
        S.answers = answerAll(prof);
        S.archPct = null;
        S.sort = 'affinita';

        const { scored, others, total } = ctx.rankedResults();
        console.log(`\n--- ${name} | Sondrio 30km | ${total} scuole (${scored.length} valutate, ${others.length} altre)`);
        for (const s of scored.slice(0, 5)) {
            console.log(`   ${String(s.pct).padStart(3)}%  ${s.matchLabel}`);
            console.log(`         ${s.nome} - ${s.comune} (${s.dist.toFixed(1)} km)`);
        }
        const pct = ctx.archetypeScores();
        const top3 = Object.entries(pct).sort((a, b) => b[1] - a[1]).slice(0, 3);
        console.log('   archetipi migliori:', top3.map(([k, v]) => `${k}=${v}%`).join(', '));
    }

    // Raggio: deve crescere in modo monotono
    S.position = { lat: so.lat, lon: so.lon, label: 'Sondrio', sub: '', source: 'comune' };
    console.log('\n--- crescita per raggio da Sondrio ---');
    let prev = -1, mono = true;
    for (const r of [5, 10, 20, 30, 50, 80, 120]) {
        S.radius = r;
        const n = ctx.schoolsInRadius().length;
        if (n < prev) mono = false;
        console.log(`   ${String(r).padStart(4)} km -> ${n} scuole`);
        prev = n;
    }
    console.log('monotono:', mono ? 'OK' : 'ERRORE');

    // Testo di condivisione
    S.radius = 30; S.answers = answerAll(nerd); S.archPct = null;
    console.log('\n--- shareText() ---');
    console.log(ctx.shareText());
})();
