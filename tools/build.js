// Unisce anagrafica + geocodifica e produce i file dati della PWA.
const fs = require('fs');
const path = require('path');
const { cleanName } = require('./lib');

const dataDir = process.argv[2];
const outDir = process.argv[3];
const pad = s => String(s).padStart(6, '0');
const rd = f => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'));

fs.mkdirSync(outDir, { recursive: true });

/* ---------- scuole ---------- */

const raw = rd('schools_raw.json');
const cache = fs.existsSync(path.join(dataDir, 'geocache.json')) ? rd('geocache.json') : {};

// Centroidi comunali, usati come riserva quando Nominatim non risolve l'indirizzo.
// MIUR identifica il comune col codice catastale (Belfiore), che va tradotto in codice ISTAT.
const geoIdx = new Map(rd('italy_geo.json').map(g => [pad(g.istat), g]));
const catastaleToIstat = new Map(
    rd('comuni_geo.json').map(c => [String(c.codiceCatastale).toUpperCase(), pad(c.codice)]));
const centroid = catastale => {
    const istat = catastaleToIstat.get(String(catastale).toUpperCase());
    const g = istat && geoIdx.get(istat);
    return g ? { lat: +g.lat, lon: +g.lng, viaFallback: true } : null;
};

let precise = 0, viaComune = 0, missing = 0;
const scuole = [];

for (const s of raw) {
    let g = cache[s.id];
    if (!g || g.error || typeof g.lat !== 'number') g = centroid(s.istatComune);
    if (!g || typeof g.lat !== 'number') { missing++; continue; }
    if (g.viaFallback) viaComune++; else precise++;

    scuole.push({
        id: s.id,
        nome: s.nome,
        indirizzi: s.indirizzi,
        statale: s.statale ? 1 : 0,
        via: s.via,
        cap: s.cap,
        comune: s.comune,
        provincia: s.provincia,
        email: s.email || '',
        sito: s.sito || '',
        lat: +g.lat.toFixed(5),
        lon: +g.lon.toFixed(5),
        approx: g.viaFallback ? 1 : 0
    });
}

const annoScolastico = '2026/27';
const scuoleOut = {
    meta: {
        annoScolastico,
        regione: 'Lombardia',
        generato: new Date().toISOString().slice(0, 10),
        fonte: 'Ministero dell\'Istruzione e del Merito - dati.istruzione.it',
        geocoding: 'OpenStreetMap / Nominatim',
        totale: scuole.length
    },
    scuole
};
fs.writeFileSync(path.join(outDir, 'scuole.json'), JSON.stringify(scuoleOut));

/* ---------- comuni ---------- */

const comuniAll = rd('comuni_geo.json');
const geo = rd('italy_geo.json');
const extra = fs.existsSync(path.join(dataDir, 'comuni_extra.json')) ? rd('comuni_extra.json') : {};
const gmap = new Map(geo.map(g => [pad(g.istat), g]));

const comuni = [];
let comuniMissing = [];
for (const c of comuniAll) {
    if (c.regione.nome !== 'Lombardia') continue;
    const code = pad(c.codice);
    const g = gmap.get(code);
    const e = extra[code];
    const lat = g ? +g.lat : (e ? e.lat : null);
    const lon = g ? +g.lng : (e ? e.lon : null);
    if (lat == null || lon == null || Number.isNaN(lat) || Number.isNaN(lon)) {
        comuniMissing.push(c.nome);
        continue;
    }
    comuni.push({
        nome: c.nome,
        provincia: c.provincia.nome,
        lat: +lat.toFixed(5),
        lon: +lon.toFixed(5)
    });
}
comuni.sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
fs.writeFileSync(path.join(outDir, 'comuni.json'),
    JSON.stringify({ meta: { regione: 'Lombardia', totale: comuni.length }, comuni }));

/* ---------- report ---------- */

const size = f => (fs.statSync(path.join(outDir, f)).size / 1024).toFixed(0) + ' KB';
console.log('SCUOLE');
console.log('  scritte:            ', scuole.length, '/', raw.length);
console.log('  indirizzo preciso:  ', precise);
console.log('  centro del comune:  ', viaComune);
console.log('  senza coordinate:   ', missing);
console.log('  statali/paritarie:  ', scuole.filter(s => s.statale).length, '/', scuole.filter(s => !s.statale).length);
console.log('  scuole.json:        ', size('scuole.json'));
console.log('COMUNI');
console.log('  scritti:            ', comuni.length);
console.log('  senza coordinate:   ', comuniMissing.length, comuniMissing.slice(0, 12).join(', '));
console.log('  comuni.json:        ', size('comuni.json'));

const provs = new Map();
for (const s of scuole) provs.set(s.provincia, (provs.get(s.provincia) || 0) + 1);
console.log('PROVINCE');
for (const [k, v] of [...provs.entries()].sort((a, b) => b[1] - a[1])) {
    console.log('  ' + String(v).padStart(4), k);
}
