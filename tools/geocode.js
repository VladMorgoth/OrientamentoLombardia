// Geocodes schools via Nominatim, respecting the OSM usage policy (1 req/s, identifying UA).
// Results are cached on disk so the script is resume-safe and re-runs cost nothing.
const fs = require('fs');
const { curlJson } = require('./lib');

const inFile = process.argv[2];
const cacheFile = process.argv[3];

const UA = 'OrientamentoScuoleSuperiori/1.0 (progetto orientamento scolastico; contatto via GitHub vladmorgoth)';
const DELAY_MS = 1100;

const schools = JSON.parse(fs.readFileSync(inFile, 'utf8'));
const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : {};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function nominatim(q, attempt = 0) {
    const url = 'https://nominatim.openstreetmap.org/search'
        + '?format=json&limit=1&countrycodes=it&q=' + encodeURIComponent(q);
    const res = await curlJson(url, { ua: UA });
    if (res.error) {
        if (attempt < 2) { await sleep(4000 * (attempt + 1)); return nominatim(q, attempt + 1); }
        return { error: res.error };
    }
    const j = res.json;
    if (!Array.isArray(j) || !j.length) return null;
    const h = j[0];
    return {
        lat: +h.lat, lon: +h.lon,
        rank: h.place_rank, type: h.type, cls: h.class,
        display: h.display_name
    };
}

function save() {
    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 0));
}

(async () => {
    let done = 0, hits = 0, fallbacks = 0, fails = 0, requests = 0;
    const started = Date.now();

    for (const s of schools) {
        done++;
        if (cache[s.id] && !cache[s.id].error) {
            if (cache[s.id].viaFallback) fallbacks++; else hits++;
            continue;
        }

        if (requests > 0) await sleep(DELAY_MS);
        requests++;
        let r = await nominatim(s.geoQuery);

        // Street address unknown to OSM: fall back to the municipality centre
        if (!r || r.error || r.rank < 20) {
            await sleep(DELAY_MS);
            requests++;
            const f = await nominatim(s.geoFallback);
            if (f && !f.error) { r = { ...f, viaFallback: true }; fallbacks++; }
            else if (r && !r.error) { hits++; }
            else { fails++; r = { error: (r && r.error) || 'not found' }; }
        } else hits++;

        cache[s.id] = r;
        if (requests % 20 === 0) {
            save();
            const el = (Date.now() - started) / 1000;
            const rate = done / el;
            const eta = Math.round((schools.length - done) / Math.max(rate, 0.001) / 60);
            console.log(`[${done}/${schools.length}] precise=${hits} comune=${fallbacks} failed=${fails} eta=${eta}min`);
        }
    }

    save();
    console.log(`DONE total=${schools.length} precise=${hits} comune=${fallbacks} failed=${fails} requests=${requests}`);
})();
