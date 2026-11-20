// Geocodifica solo i comuni lombardi assenti da italy_geo.json (fusioni recenti).
const fs = require('fs');
const path = require('path');
const { curlJson } = require('./lib');

const dataDir = process.argv[2];
const outFile = process.argv[3];

const UA = 'OrientamentoScuoleSuperiori/1.0 (progetto orientamento scolastico; contatto via GitHub vladmorgoth)';
const pad = s => String(s).padStart(6, '0');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const comuni = JSON.parse(fs.readFileSync(path.join(dataDir, 'comuni_geo.json'), 'utf8'));
const geo = JSON.parse(fs.readFileSync(path.join(dataDir, 'italy_geo.json'), 'utf8'));
const known = new Set(geo.map(g => pad(g.istat)));
const extra = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {};

const missing = comuni.filter(c =>
    c.regione.nome === 'Lombardia' && !known.has(pad(c.codice)) && !extra[pad(c.codice)]);

(async () => {
    console.log('comuni lombardi da geocodificare:', missing.length);
    for (const c of missing) {
        const q = `${c.nome}, ${c.provincia.nome}, Italia`;
        const res = await curlJson('https://nominatim.openstreetmap.org/search'
            + '?format=json&limit=1&countrycodes=it&q=' + encodeURIComponent(q), { ua: UA });
        if (res.error) {
            console.log('  errore', c.nome, res.error);
        } else if (res.json.length) {
            extra[pad(c.codice)] = { lat: +res.json[0].lat, lon: +res.json[0].lon };
            console.log('  ok', c.nome, res.json[0].lat, res.json[0].lon);
        } else {
            console.log('  NON TROVATO', c.nome);
        }
        await sleep(1100);
    }
    fs.writeFileSync(outFile, JSON.stringify(extra, null, 1));
    console.log('salvati', Object.keys(extra).length, 'comuni extra');
})();
