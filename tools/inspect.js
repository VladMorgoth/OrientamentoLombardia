const fs = require('fs');

function parseCSV(text) {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') { field += '"'; i++; }
                else inQuotes = false;
            } else field += c;
        } else if (c === '"') inQuotes = true;
        else if (c === ',') { row.push(field); field = ''; }
        else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
        else if (c !== '\r') field += c;
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    return rows;
}

const NOT_UPPER = new Set([
    'SCUOLA PRIMARIA', 'SCUOLA INFANZIA', 'SCUOLA PRIMO GRADO',
    'ISTITUTO COMPRENSIVO', 'CENTRO TERRITORIALE',
    'CONVITTO ANNESSO', 'CONVITTO NAZIONALE', 'EDUCANDATO', 'SCUOLA MAGISTRALE'
]);

const path = process.argv[2];
const raw = fs.readFileSync(path, 'utf8');
const rows = parseCSV(raw);
const header = rows[0].map(h => h.trim());
const recs = rows.slice(1).filter(r => r.length === header.length)
    .map(r => Object.fromEntries(header.map((h, i) => [h, (r[i] || '').trim()])));

const isUpper = r => !NOT_UPPER.has(r.DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA);
const isLomb = r => r.REGIONE === 'LOMBARDIA';
const lomb = recs.filter(r => isLomb(r) && isUpper(r));

console.log('total:', recs.length, '| Lombardia upper-secondary:', lomb.length);

console.log('\n=== TIPOLOGIE in Lombardia ===');
const m = new Map();
for (const r of lomb) {
    const k = r.DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA;
    m.set(k, (m.get(k) || 0) + 1);
}
for (const [k, v] of [...m.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(String(v).padStart(5), k);
}

console.log('\n=== "ISTITUTO SUPERIORE": e\' l\'ente ombrello? ===');
const iis = lomb.filter(r => r.DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA === 'ISTITUTO SUPERIORE');
const selfRef = iis.filter(r => r.CODICESCUOLA === r.CODICEISTITUTORIFERIMENTO).length;
console.log(`IIS totali: ${iis.length}, di cui CODICESCUOLA == CODICEISTITUTORIFERIMENTO: ${selfRef}`);

console.log('\n=== Province Lombardia ===');
const pm = new Map();
for (const r of lomb) pm.set(r.PROVINCIA, (pm.get(r.PROVINCIA) || 0) + 1);
for (const [k, v] of [...pm.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(String(v).padStart(5), k);
}

console.log('\n=== SONDRIO: tutte le righe upper-secondary ===');
for (const r of lomb.filter(r => r.PROVINCIA === 'SONDRIO')) {
    console.log(`${r.CODICESCUOLA} [ref ${r.CODICEISTITUTORIFERIMENTO}] ${r.DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA}`);
    console.log(`    ${r.DENOMINAZIONESCUOLA} -- ${r.INDIRIZZOSCUOLA}, ${r.CAPSCUOLA} ${r.DESCRIZIONECOMUNE}`);
}
