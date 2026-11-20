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

function readRecords(path) {
    const rows = parseCSV(require('fs').readFileSync(path, 'utf8'));
    const header = rows[0].map(h => h.trim());
    return rows.slice(1)
        .filter(r => r.length === header.length)
        .map(r => Object.fromEntries(header.map((h, i) => [h, (r[i] || '').trim()])));
}

// Plexus types that are NOT upper secondary (both statale and paritaria wording)
const NOT_UPPER = new Set([
    'SCUOLA PRIMARIA', 'SCUOLA INFANZIA', 'SCUOLA PRIMO GRADO',
    'ISTITUTO COMPRENSIVO', 'CENTRO TERRITORIALE',
    'CONVITTO ANNESSO', 'CONVITTO NAZIONALE', 'EDUCANDATO', 'SCUOLA MAGISTRALE',
    'SCUOLA INFANZIA NON STATALE', 'SCUOLA PRIMARIA NON STATALE',
    'SCUOLA SEC. PRIMO GRADO NON STATALE'
]);

// Legacy MIUR plexus type -> [modern label, affinity archetype]
const TIPOLOGIA_MAP = {
    'LICEO SCIENTIFICO': ['Liceo Scientifico', 'liceo_scientifico'],
    'LICEO CLASSICO': ['Liceo Classico', 'liceo_classico'],
    'LICEO ARTISTICO': ['Liceo Artistico', 'liceo_artistico'],
    "ISTITUTO D'ARTE": ['Liceo Artistico / Istituto d’Arte', 'liceo_artistico'],
    'ISTITUTO MAGISTRALE': ['Liceo delle Scienze Umane', 'liceo_scienze_umane'],
    'ISTITUTO TECNICO COMMERCIALE': ['Istituto Tecnico Economico', 'tecnico_economico'],
    'IST TEC COMMERCIALE E PER GEOMETRI': ['Istituto Tecnico Economico e Costruzioni', 'tecnico_economico'],
    'IST TECNICO ECONOMICO E TECNOLOGICO': ['Istituto Tecnico Economico e Tecnologico', 'tecnico_economico'],
    'ISTITUTO TECNICO PER GEOMETRI': ['Istituto Tecnico Costruzioni, Ambiente e Territorio', 'tecnico_cat'],
    'ISTITUTO TECNICO INDUSTRIALE': ['Istituto Tecnico Industriale', 'tecnico_industriale'],
    'ISTITUTO TECNICO AGRARIO': ['Istituto Tecnico Agrario', 'tecnico_agrario'],
    'ISTITUTO TECNICO PER IL TURISMO': ['Istituto Tecnico per il Turismo', 'tecnico_turismo'],
    'ISTITUTO TECNICO NAUTICO': ['Istituto Tecnico Trasporti e Logistica', 'tecnico_trasporti'],
    'ISTITUTO TECNICO AERONAUTICO': ['Istituto Tecnico Trasporti e Logistica (Aeronautico)', 'tecnico_trasporti'],
    "ISTITUTO TECNICO PER ATTIVITA' SOCIALI (GIA' ITF)": ['Istituto Tecnico Servizi Socio-Sanitari', 'prof_socio_sanitario'],
    'IST PROF INDUSTRIA E ARTIGIANATO': ['Istituto Professionale Industria e Artigianato', 'prof_industria'],
    "IST PROF INDUSTRIA E ATTIVITA' MARINARE": ['Istituto Professionale Industria e Attività Marinare', 'prof_industria'],
    'IST PROF INDUSTRIA E ARTIGIANATO PER SORDOMUTI': ['Istituto Professionale Industria e Artigianato', 'prof_industria'],
    'IST PROF INDUSTRIA E ARTIGIANATO PER CIECHI': ['Istituto Professionale Industria e Artigianato', 'prof_industria'],
    'IST PROF CINEMATOGRAFIA E TELEVISIONE': ['Istituto Professionale Audiovisivo e Multimediale', 'prof_industria'],
    'IST PROF PER I SERVIZI ALBERGHIERI E RISTORAZIONE': ['Istituto Professionale Enogastronomia e Ospitalità', 'prof_alberghiero'],
    'IST PROF ALBERGHIERO': ['Istituto Professionale Enogastronomia e Ospitalità', 'prof_alberghiero'],
    'IST PROF PER I SERVIZI COMMERCIALI': ['Istituto Professionale Servizi Commerciali', 'prof_commerciale'],
    'IST PROF PER I SERVIZI COMMERCIALI E TURISTICI': ['Istituto Professionale Servizi Commerciali e Turistici', 'prof_commerciale'],
    'IST PROF PER I SERVIZI TURISTICI': ['Istituto Professionale Servizi Turistici', 'prof_commerciale'],
    'IST PROF PER I SERVIZI COMM TUR E DELLA PUBB': ['Istituto Professionale Servizi Commerciali e Pubblicitari', 'prof_commerciale'],
    'IST PROF PER I SERVIZI PUBBLICITARI': ['Istituto Professionale Servizi Pubblicitari', 'prof_commerciale'],
    "IST PROF PER L'AGRICOLTURA E L'AMBIENTE": ['Istituto Professionale Agricoltura e Sviluppo Rurale', 'prof_agrario'],
    "IST PROF PER L'AGRICOLTURA": ['Istituto Professionale Agricoltura e Sviluppo Rurale', 'prof_agrario'],
    'IST PROF PER I SERVIZI SOCIALI': ['Istituto Professionale Servizi Socio-Sanitari', 'prof_socio_sanitario'],
    'ISTITUTO SUPERIORE': ['Istituto di Istruzione Superiore', 'generico'],
    'SCUOLA SEC. SECONDO GRADO NON STATALE': ['Scuola Secondaria di II Grado', 'generico']
};

// Extra indirizzi inferred from the plexus name, which often lists them
const NAME_HINTS = [
    [/LINGUIST|\bLINGUE\b/i, 'Liceo Linguistico', 'liceo_linguistico'],
    [/SCIENZE UMANE|\bUMANE\b|SOCIO.?PSICO|MAGISTRAL/i, 'Liceo delle Scienze Umane', 'liceo_scienze_umane'],
    [/MUSICAL|COREUTIC/i, 'Liceo Musicale e Coreutico', 'liceo_musicale'],
    [/SPORTIV/i, 'Liceo Scientifico Sportivo', 'liceo_sportivo'],
    [/SCIENZE APPLICATE|APPLICAT/i, 'Liceo Scientifico Scienze Applicate', 'liceo_scienze_applicate'],
    [/ECONOMICO.?SOCIAL|\bLES\b/i, 'Liceo Economico-Sociale', 'liceo_economico_sociale'],
    [/CLASSIC/i, 'Liceo Classico', 'liceo_classico'],
    [/SCIENTIFIC/i, 'Liceo Scientifico', 'liceo_scientifico'],
    [/ARTISTIC/i, 'Liceo Artistico', 'liceo_artistico'],
    [/ALBERGHIER|ENOGASTRONOM|RISTORAZION/i, 'Istituto Professionale Enogastronomia e Ospitalità', 'prof_alberghiero'],
    [/\bAGRAR|AGRICOL/i, 'Istituto Tecnico Agrario', 'tecnico_agrario'],
    [/TURISM/i, 'Istituto Tecnico per il Turismo', 'tecnico_turismo'],
    [/INFORMATIC/i, 'Istituto Tecnico Industriale', 'tecnico_industriale'],
    [/SOCIO.?SANITAR/i, 'Istituto Professionale Servizi Socio-Sanitari', 'prof_socio_sanitario']
];

const ACRONYMS = new Set(['IIS', 'IS', 'ITI', 'ITIS', 'ITE', 'ITC', 'ITG', 'ITCG', 'ITT', 'ITAS',
    'IPSIA', 'IPSSAR', 'IPSEOA', 'IPC', 'IPA', 'IP', 'LS', 'LC', 'LA', 'LL', 'CFP', 'SS',
    'I.I.S.', 'I.T.I.S.', 'I.T.C.', 'A.F.M.', 'C.A.T.', 'S.M.S.', 'O.D.A.']);

const SMALL_WORDS = new Set(['di', 'da', 'de', 'del', 'della', 'dello', 'dei', 'degli', 'delle',
    'e', 'ed', 'il', 'lo', 'la', 'i', 'gli', 'le', 'a', 'al', 'alla', 'per', 'con', 'su', 'in', 'd']);

// MIUR stores accents as a trailing apostrophe on ASCII vowels (CITTA' -> Città)
function fixAccents(s) {
    return s.replace(/([AEIOU])'(?=\s|$|[,.)\/-])/g, (m, v) =>
        ({ A: 'à', E: 'è', I: 'ì', O: 'ò', U: 'ù' })[v]);
}

function cleanName(s) {
    if (!s) return '';
    let out = fixAccents(s.replace(/\bN\?\s*/g, '').replace(/\s+/g, ' ').trim());
    out = out.split(' ').map(tok => {
        if (ACRONYMS.has(tok.toUpperCase())) return tok.toUpperCase();
        const lower = tok.toLowerCase();
        if (SMALL_WORDS.has(lower)) return lower;
        return lower.replace(/(^|[\s"'’(\-\/.])([a-zà-ÿ])/g, (m, p, c) => p + c.toUpperCase());
    }).join(' ');
    return out.replace(/^./, c => c.toUpperCase());
}

// Nominatim does better without MIUR's "N." / "N?" civic-number noise
function cleanAddress(s) {
    return fixAccents((s || '').replace(/\bN[?.°]?\s*(?=\d)/gi, '').replace(/\s+/g, ' ').trim());
}

// La fetch di node non attraversa il proxy aziendale (restituisce "Access denied"),
// mentre curl si': le richieste HTTP passano quindi da curl.
function curlJson(url, { ua, timeout = 25 } = {}) {
    return new Promise(resolve => {
        const args = ['-sS', '-m', String(timeout), '-H', 'Accept-Language: it'];
        if (ua) args.push('-A', ua);
        args.push('-w', '\n%{http_code}', url);
        require('child_process').execFile('curl', args, { maxBuffer: 8 << 20 },
            (err, stdout) => {
                if (err) return resolve({ error: 'curl: ' + (err.message || err) });
                const cut = stdout.lastIndexOf('\n');
                const status = +stdout.slice(cut + 1).trim();
                const body = stdout.slice(0, cut);
                if (status !== 200) return resolve({ error: 'http ' + status });
                try { resolve({ json: JSON.parse(body) }); }
                catch (e) { resolve({ error: 'json non valido: ' + body.slice(0, 60) }); }
            });
    });
}

module.exports = {
    parseCSV, readRecords, NOT_UPPER, TIPOLOGIA_MAP, NAME_HINTS,
    cleanName, cleanAddress, fixAccents, curlJson
};
