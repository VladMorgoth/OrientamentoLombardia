const fs = require('fs');
const path = require('path');
const { readRecords, NOT_UPPER, TIPOLOGIA_MAP, NAME_HINTS, cleanName, cleanAddress } = require('./lib');

const REGION = (process.env.REGION || 'LOMBARDIA').toUpperCase();
const dataDir = process.argv[2];
const outFile = process.argv[3];

function load(file, statale) {
    const p = path.join(dataDir, file);
    if (!fs.existsSync(p)) { console.warn('missing:', p); return []; }
    return readRecords(p).map(r => ({ ...r, _statale: statale }));
}

const all = [...load('anagrafe_stat.csv', true), ...load('anagrafe_par.csv', false)];

const regional = all.filter(r =>
    r.REGIONE === REGION && !NOT_UPPER.has(r.DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA));

// Umbrella IIS entities (statali) duplicate their member plexuses: drop them
const umbrella = r => r._statale
    && r.DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA === 'ISTITUTO SUPERIORE'
    && r.CODICESCUOLA === r.CODICEISTITUTORIFERIMENTO;

const plexuses = regional.filter(r => !umbrella(r));

const unmapped = new Map();
const schools = plexuses.map(r => {
    const tip = r.DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA;
    const mapped = TIPOLOGIA_MAP[tip];
    if (!mapped) unmapped.set(tip, (unmapped.get(tip) || 0) + 1);

    const indirizzi = [];
    const seen = new Set();
    const push = (label, key) => {
        if (!seen.has(key)) { seen.add(key); indirizzi.push({ label, key }); }
    };
    if (mapped && mapped[1] !== 'generico') push(mapped[0], mapped[1]);

    const name = r.DENOMINAZIONESCUOLA || '';
    for (const [re, label, key] of NAME_HINTS) {
        if (re.test(name)) push(label, key);
    }
    if (!indirizzi.length) push(mapped ? mapped[0] : cleanName(tip), 'generico');

    const via = cleanAddress(r.INDIRIZZOSCUOLA);
    const comune = cleanName(r.DESCRIZIONECOMUNE);
    return {
        id: r.CODICESCUOLA,
        nome: cleanName(name),
        tipologia: tip,
        indirizzi,
        statale: r._statale,
        via: cleanName(via),
        cap: r.CAPSCUOLA || '',
        comune,
        istatComune: r.CODICECOMUNESCUOLA || '',
        provincia: cleanName(r.PROVINCIA),
        email: (r.INDIRIZZOEMAILSCUOLA || '').toLowerCase(),
        sito: (r.SITOWEBSCUOLA || '').trim().replace(/^(?!https?:\/\/)(.+)$/, 'https://$1'),
        geoQuery: [via, r.CAPSCUOLA, comune, 'Italia'].filter(Boolean).join(', '),
        geoFallback: [comune, cleanName(r.PROVINCIA), 'Italia'].filter(Boolean).join(', ')
    };
});

// Deduplicate identical plexus codes (defensive)
const byId = new Map();
for (const s of schools) if (!byId.has(s.id)) byId.set(s.id, s);
const out = [...byId.values()].sort((a, b) =>
    a.provincia.localeCompare(b.provincia) || a.comune.localeCompare(b.comune) || a.nome.localeCompare(b.nome));

fs.writeFileSync(outFile, JSON.stringify(out, null, 1));

console.log(`region ${REGION}`);
console.log(`  regional upper-secondary rows: ${regional.length}`);
console.log(`  umbrella IIS dropped:          ${regional.length - plexuses.length}`);
console.log(`  plexuses written:              ${out.length}`);
console.log(`  statali ${out.filter(s => s.statale).length} | paritarie ${out.filter(s => !s.statale).length}`);
console.log(`  with website: ${out.filter(s => s.sito).length}`);

const archCount = new Map();
for (const s of out) for (const i of s.indirizzi) archCount.set(i.key, (archCount.get(i.key) || 0) + 1);
console.log('\n=== archetipi assegnati ===');
for (const [k, v] of [...archCount.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(String(v).padStart(5), k);
}
console.log('\n  multi-indirizzo:', out.filter(s => s.indirizzi.length > 1).length);

if (unmapped.size) {
    console.log('\n=== TIPOLOGIE NON MAPPATE ===');
    for (const [k, v] of unmapped) console.log(String(v).padStart(5), k);
}

console.log('\n=== esempio Sondrio ===');
for (const s of out.filter(s => s.provincia === 'Sondrio').slice(0, 8)) {
    console.log(`  ${s.nome} [${s.indirizzi.map(i => i.key).join(', ')}]`);
    console.log(`     ${s.geoQuery}`);
}
