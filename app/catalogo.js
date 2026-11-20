// Domande del questionario e profili di affinita per ogni indirizzo di studio.
// I pesi degli 11 indirizzi originali sono quelli validati nella versione Sondrio.

const RATING_LABELS = [
    { text: 'Per nulla', short: 'Per nulla', mini: '1' },
    { text: 'Poco', short: 'Poco', mini: '2' },
    { text: 'Neutrale', short: 'Neutrale', mini: '3' },
    { text: 'Abbastanza', short: 'Abba-stanza', mini: '4' },
    { text: 'Molto', short: 'Molto', mini: '5' }
];

const QUESTIONS = [
    {
        id: 'materie',
        text: 'Quali materie ti piacciono o ti incuriosiscono di piu?',
        hint: 'Puoi selezionare fino a 3 risposte',
        type: 'multi', maxSelect: 3,
        options: [
            { label: 'Matematica e Fisica', emoji: '\u{1F4D0}', keys: { mate: 4, fisi: 4 } },
            { label: 'Italiano e Letteratura', emoji: '\u{1F4DA}', keys: { lett: 5 } },
            { label: 'Lingue Straniere', emoji: '\u{1F30D}', keys: { ling: 5 } },
            { label: 'Scienze (Biologia, Chimica)', emoji: '\u{1F52C}', keys: { scie: 5 } },
            { label: 'Informatica e Tecnologia', emoji: '\u{1F4BB}', keys: { info: 5 } },
            { label: 'Arte e Disegno', emoji: '\u{1F3A8}', keys: { arte: 5 } },
            { label: 'Economia e Diritto', emoji: '\u{1F4C8}', keys: { econ: 5 } },
            { label: 'Psicologia e Scienze Sociali', emoji: '\u{1F9E0}', keys: { psic: 5 } },
            { label: 'Cucina e Alimentazione', emoji: '\u{1F373}', keys: { cuci: 5 } }
        ]
    },
    {
        id: 'attivita',
        text: 'Quanto ti piacciono queste attivita?',
        hint: 'Indica il tuo gradimento per ciascuna',
        type: 'rating',
        options: [
            { label: 'Ragionare e risolvere problemi logici', emoji: '\u{1F9E9}', keys: { logica: 5 } },
            { label: 'Leggere, scrivere e comunicare', emoji: '\u{270D}️', keys: { comunicare: 5 } },
            { label: 'Creare con le mani (disegnare, costruire)', emoji: '\u{1F3AD}', keys: { creare: 5 } },
            { label: 'Lavorare con il computer', emoji: '\u{1F5A5}️', keys: { computer: 5 } },
            { label: 'Organizzare, gestire, pianificare', emoji: '\u{1F4CB}', keys: { organizzare: 5 } },
            { label: 'Stare a contatto con le persone', emoji: '\u{1F91D}', keys: { persone: 5 } }
        ]
    },
    {
        id: 'futuro',
        text: 'Dopo il diploma, quanto ti attraggono queste strade?',
        hint: 'Indica il tuo gradimento per ciascuna',
        type: 'rating',
        options: [
            { label: 'Andare all\'universita per una laurea', emoji: '\u{1F393}', keys: { uni: 5 } },
            { label: 'Entrare subito nel mondo del lavoro', emoji: '\u{1F4BC}', keys: { lavoro: 5 } },
            { label: 'Avere un diploma che apra piu porte possibili', emoji: '\u{1F511}', keys: { uni: 2, lavoro: 2 } }
        ]
    },
    {
        id: 'studio',
        text: 'Quanto ti piacciono questi modi di imparare?',
        hint: 'Indica il tuo gradimento per ciascuno',
        type: 'rating',
        options: [
            { label: 'Studiare sui libri e approfondire la teoria', emoji: '\u{1F4D6}', keys: { studio: 5 } },
            { label: 'Fare esercizi pratici e laboratori', emoji: '\u{1F528}', keys: { pratica: 5 } }
        ]
    },
    {
        id: 'qualita',
        text: 'Quanto ti riconosci in queste qualita?',
        hint: 'Indica quanto ciascuna ti rappresenta',
        type: 'rating',
        options: [
            { label: 'Curiosita scientifica', emoji: '\u{1F50D}', keys: { curiosita: 5 } },
            { label: 'Sensibilita artistica', emoji: '\u{1F308}', keys: { artistica: 5 } },
            { label: 'Abilita nel comunicare', emoji: '\u{1F4AC}', keys: { comunicativa: 5 } },
            { label: 'Spirito pratico e tecnico', emoji: '\u{2699}️', keys: { tecnico: 5 } },
            { label: 'Senso degli affari', emoji: '\u{1F4B0}', keys: { affari: 5 } },
            { label: 'Empatia e attenzione agli altri', emoji: '\u{2764}️', keys: { empatia: 5 } }
        ]
    },
    {
        id: 'hobby',
        text: 'Quali sono i tuoi hobby preferiti?',
        hint: 'Puoi selezionare fino a 3 risposte',
        type: 'multi', maxSelect: 3,
        options: [
            { label: 'Leggere libri e racconti', emoji: '\u{1F4DA}', keys: { libri: 4 } },
            { label: 'Programmare o giocare ai videogiochi', emoji: '\u{1F3AE}', keys: { prog: 4 } },
            { label: 'Disegnare, dipingere o creare', emoji: '\u{1F58C}️', keys: { disegno: 4 } },
            { label: 'Fare sport', emoji: '\u{26BD}', keys: { sport: 3 } },
            { label: 'Cucinare e sperimentare ricette', emoji: '\u{1F9C1}', keys: { cucina: 4 } },
            { label: 'Viaggiare e scoprire posti nuovi', emoji: '\u{2708}️', keys: { viaggio: 4 } },
            { label: 'Fare volontariato o aiutare gli altri', emoji: '\u{1F49A}', keys: { volontariato: 4 } }
        ]
    },
    {
        id: 'ambiente',
        text: 'Quanto ti piacciono questi ambienti scolastici?',
        hint: 'Indica il tuo gradimento per ciascuno',
        type: 'rating',
        options: [
            { label: 'Aula tradizionale con molte ore di lezione', emoji: '\u{1F3EB}', keys: { tradizionale: 5 } },
            { label: 'Laboratorio scientifico o informatico', emoji: '\u{1F9EA}', keys: { laboratorio: 5 } },
            { label: 'Atelier artistico o creativo', emoji: '\u{1F3A8}', keys: { atelier: 5 } },
            { label: 'Aula con dibattiti e confronti', emoji: '\u{1F5E3}️', keys: { dibattito: 5 } },
            { label: 'Stage in azienda e pratica sul campo', emoji: '\u{1F3ED}', keys: { stage: 5 } }
        ]
    },
    {
        id: 'orario',
        text: 'Che tipo di organizzazione oraria preferiresti?',
        hint: 'Indica il tuo gradimento per ciascuna opzione',
        type: 'rating',
        options: [
            { label: 'Solo mattina (8:00-13:00) con il sabato a scuola', emoji: '\u{1F305}', keys: { orario_mattina: 5 } },
            { label: 'Sabato libero, anche se ci sono rientri pomeridiani', emoji: '\u{1F389}', keys: { orario_sablibero: 5 } },
            { label: 'Giornate piu lunghe (fino alle 14:00) ma meno giorni', emoji: '\u{1F552}', keys: { orario_lungo: 5 } },
            { label: 'Pomeriggi a scuola per laboratori e attivita pratiche', emoji: '\u{1F52C}', keys: { orario_pomeriggio: 5 } }
        ]
    },
    {
        id: 'interesse',
        text: 'Quanto ti affascinano questi argomenti?',
        hint: 'Indica il tuo gradimento per ciascuno',
        type: 'rating',
        options: [
            { label: 'Come funziona l\'universo e la natura', emoji: '\u{1F30C}', keys: { mate: 2, fisi: 3, scie: 3, curiosita: 2 } },
            { label: 'Le civilta antiche e la filosofia', emoji: '\u{1F3DB}️', keys: { lett: 3, comunicare: 2, libri: 2 } },
            { label: 'Le lingue e le culture del mondo', emoji: '\u{1F5FA}️', keys: { ling: 3, viaggio: 2, comunicativa: 2 } },
            { label: 'Computer, robot e intelligenza artificiale', emoji: '\u{1F916}', keys: { info: 3, computer: 3, prog: 2 } },
            { label: 'Come funziona l\'economia e le aziende', emoji: '\u{1F3E2}', keys: { econ: 3, affari: 3, organizzare: 2 } },
            { label: 'L\'arte in tutte le sue forme', emoji: '\u{1F5BC}️', keys: { arte: 3, artistica: 3, disegno: 2 } },
            { label: 'La mente umana e le relazioni sociali', emoji: '\u{1F9E0}', keys: { psic: 3, empatia: 3, persone: 2 } },
            { label: 'Gastronomia, ristorazione e ospitalita', emoji: '\u{1F37D}️', keys: { cuci: 3, cucina: 3, persone: 2 } }
        ]
    }
];

const ARCHETYPES = {
    liceo_scientifico: {
        label: 'Liceo Scientifico',
        desc: 'Matematica, fisica e scienze con solida base umanistica e latino. Ottima preparazione per facolta scientifiche, ingegneria e medicina.',
        tags: ['Matematica', 'Fisica', 'Scienze', 'Universita'],
        w: {
            mate: 5, fisi: 5, scie: 4, info: 2, lett: 2, ling: 1, arte: 0, econ: 0, psic: 0, cuci: 0,
            logica: 5, comunicare: 1, creare: 1, computer: 2, organizzare: 1, persone: 0,
            uni: 5, lavoro: 0, studio: 5, pratica: 2,
            curiosita: 5, artistica: 0, comunicativa: 1, tecnico: 2, affari: 0, empatia: 0,
            libri: 3, prog: 2, disegno: 0, sport: 2, cucina: 0, viaggio: 1, volontariato: 0,
            tradizionale: 4, laboratorio: 3, atelier: 0, dibattito: 2, stage: 0,
            orario_mattina: 5, orario_sablibero: 1, orario_lungo: 2, orario_pomeriggio: 1
        }
    },
    liceo_scienze_applicate: {
        label: 'Liceo Scientifico - Scienze Applicate',
        desc: 'Come lo Scientifico ma con piu informatica e laboratorio, senza latino. Ideale per chi ama scienza e tecnologia applicata.',
        tags: ['Informatica', 'Laboratorio', 'Scienze', 'Universita'],
        w: {
            mate: 4, fisi: 4, scie: 5, info: 4, lett: 1, ling: 1, arte: 0, econ: 0, psic: 0, cuci: 0,
            logica: 5, comunicare: 1, creare: 2, computer: 4, organizzare: 1, persone: 0,
            uni: 4, lavoro: 1, studio: 3, pratica: 4,
            curiosita: 5, artistica: 0, comunicativa: 0, tecnico: 4, affari: 0, empatia: 0,
            libri: 2, prog: 5, disegno: 0, sport: 2, cucina: 0, viaggio: 1, volontariato: 0,
            tradizionale: 2, laboratorio: 5, atelier: 0, dibattito: 1, stage: 1,
            orario_mattina: 5, orario_sablibero: 1, orario_lungo: 2, orario_pomeriggio: 2
        }
    },
    liceo_classico: {
        label: 'Liceo Classico',
        desc: 'Latino, greco antico, filosofia e letteratura. Sviluppa pensiero critico e capacita di analisi, apre a tutte le facolta.',
        tags: ['Latino', 'Greco', 'Filosofia', 'Letteratura'],
        w: {
            mate: 2, fisi: 1, scie: 1, info: 0, lett: 5, ling: 3, arte: 1, econ: 0, psic: 2, cuci: 0,
            logica: 3, comunicare: 5, creare: 1, computer: 0, organizzare: 1, persone: 2,
            uni: 5, lavoro: 0, studio: 5, pratica: 1,
            curiosita: 3, artistica: 1, comunicativa: 4, tecnico: 0, affari: 0, empatia: 2,
            libri: 5, prog: 0, disegno: 0, sport: 1, cucina: 0, viaggio: 2, volontariato: 1,
            tradizionale: 5, laboratorio: 0, atelier: 0, dibattito: 4, stage: 0,
            orario_mattina: 5, orario_sablibero: 1, orario_lungo: 2, orario_pomeriggio: 0
        }
    },
    liceo_linguistico: {
        label: 'Liceo Linguistico',
        desc: 'Tre lingue straniere con madrelingua, scambi culturali e letteratura internazionale. Per chi ama comunicare e scoprire culture.',
        tags: ['Lingue', 'Culture', 'Comunicazione', 'Universita'],
        w: {
            mate: 1, fisi: 0, scie: 1, info: 0, lett: 4, ling: 5, arte: 1, econ: 1, psic: 1, cuci: 0,
            logica: 1, comunicare: 5, creare: 1, computer: 0, organizzare: 2, persone: 3,
            uni: 4, lavoro: 1, studio: 4, pratica: 2,
            curiosita: 2, artistica: 1, comunicativa: 5, tecnico: 0, affari: 1, empatia: 2,
            libri: 4, prog: 0, disegno: 0, sport: 1, cucina: 0, viaggio: 5, volontariato: 2,
            tradizionale: 3, laboratorio: 0, atelier: 0, dibattito: 4, stage: 1,
            orario_mattina: 5, orario_sablibero: 1, orario_lungo: 2, orario_pomeriggio: 0
        }
    },
    liceo_scienze_umane: {
        label: 'Liceo delle Scienze Umane',
        desc: 'Psicologia, pedagogia, sociologia e antropologia. Per chi vuole capire le persone e lavorare nel sociale o nell\'educazione.',
        tags: ['Psicologia', 'Pedagogia', 'Sociale', 'Universita'],
        w: {
            mate: 1, fisi: 0, scie: 1, info: 0, lett: 3, ling: 2, arte: 1, econ: 1, psic: 5, cuci: 0,
            logica: 2, comunicare: 4, creare: 1, computer: 0, organizzare: 2, persone: 5,
            uni: 4, lavoro: 1, studio: 4, pratica: 2,
            curiosita: 2, artistica: 1, comunicativa: 3, tecnico: 0, affari: 0, empatia: 5,
            libri: 3, prog: 0, disegno: 0, sport: 1, cucina: 0, viaggio: 1, volontariato: 5,
            tradizionale: 3, laboratorio: 0, atelier: 0, dibattito: 5, stage: 2,
            orario_mattina: 5, orario_sablibero: 1, orario_lungo: 2, orario_pomeriggio: 0
        }
    },
    liceo_economico_sociale: {
        label: 'Liceo Economico-Sociale',
        desc: 'Diritto, economia, sociologia e due lingue straniere. Per chi vuole capire come funziona la societa e il mondo economico.',
        tags: ['Economia', 'Diritto', 'Societa', 'Lingue'],
        w: {
            mate: 2, fisi: 0, scie: 1, info: 1, lett: 3, ling: 3, arte: 1, econ: 4, psic: 4, cuci: 0,
            logica: 2, comunicare: 4, creare: 0, computer: 1, organizzare: 4, persone: 4,
            uni: 4, lavoro: 1, studio: 4, pratica: 2,
            curiosita: 2, artistica: 0, comunicativa: 4, tecnico: 0, affari: 3, empatia: 4,
            libri: 3, prog: 0, disegno: 0, sport: 1, cucina: 0, viaggio: 3, volontariato: 4,
            tradizionale: 3, laboratorio: 0, atelier: 0, dibattito: 5, stage: 2,
            orario_mattina: 5, orario_sablibero: 1, orario_lungo: 2, orario_pomeriggio: 0
        }
    },
    liceo_sportivo: {
        label: 'Liceo Scientifico Sportivo',
        desc: 'Scienze motorie, discipline sportive individuali e di squadra, diritto ed economia dello sport, su base scientifica.',
        tags: ['Sport', 'Scienze Motorie', 'Economia', 'Universita'],
        w: {
            mate: 3, fisi: 3, scie: 4, info: 1, lett: 1, ling: 1, arte: 0, econ: 2, psic: 1, cuci: 0,
            logica: 3, comunicare: 1, creare: 1, computer: 1, organizzare: 3, persone: 3,
            uni: 3, lavoro: 2, studio: 2, pratica: 5,
            curiosita: 3, artistica: 0, comunicativa: 1, tecnico: 2, affari: 1, empatia: 2,
            libri: 1, prog: 1, disegno: 0, sport: 5, cucina: 0, viaggio: 2, volontariato: 1,
            tradizionale: 1, laboratorio: 3, atelier: 0, dibattito: 1, stage: 3,
            orario_mattina: 3, orario_sablibero: 2, orario_lungo: 3, orario_pomeriggio: 5
        }
    },
    liceo_artistico: {
        label: 'Liceo Artistico',
        desc: 'Discipline pittoriche, scultura, design, architettura e storia dell\'arte. Per chi ha talento creativo e vuole esprimersi.',
        tags: ['Arte', 'Design', 'Creativita', 'Progettazione'],
        w: {
            mate: 1, fisi: 0, scie: 0, info: 1, lett: 2, ling: 1, arte: 5, econ: 0, psic: 1, cuci: 0,
            logica: 1, comunicare: 2, creare: 5, computer: 1, organizzare: 1, persone: 1,
            uni: 3, lavoro: 2, studio: 2, pratica: 5,
            curiosita: 1, artistica: 5, comunicativa: 2, tecnico: 2, affari: 0, empatia: 1,
            libri: 1, prog: 1, disegno: 5, sport: 0, cucina: 0, viaggio: 2, volontariato: 0,
            tradizionale: 1, laboratorio: 2, atelier: 5, dibattito: 1, stage: 2,
            orario_mattina: 1, orario_sablibero: 3, orario_lungo: 3, orario_pomeriggio: 5
        }
    },
    liceo_musicale: {
        label: 'Liceo Musicale e Coreutico',
        desc: 'Studio di uno strumento, teoria musicale, storia della musica o danza, insieme alle materie liceali. Richiede esame di ammissione.',
        tags: ['Musica', 'Danza', 'Esecuzione', 'Creativita'],
        w: {
            mate: 1, fisi: 1, scie: 0, info: 1, lett: 3, ling: 2, arte: 4, econ: 0, psic: 1, cuci: 0,
            logica: 2, comunicare: 3, creare: 5, computer: 1, organizzare: 2, persone: 3,
            uni: 3, lavoro: 2, studio: 3, pratica: 5,
            curiosita: 1, artistica: 5, comunicativa: 3, tecnico: 1, affari: 0, empatia: 2,
            libri: 2, prog: 0, disegno: 2, sport: 1, cucina: 0, viaggio: 2, volontariato: 1,
            tradizionale: 2, laboratorio: 1, atelier: 5, dibattito: 1, stage: 1,
            orario_mattina: 2, orario_sablibero: 3, orario_lungo: 3, orario_pomeriggio: 5
        }
    },
    tecnico_economico: {
        label: 'Istituto Tecnico Economico',
        desc: 'Economia aziendale, diritto, marketing e informatica gestionale. Prepara a carriere in azienda, banca, commercio e amministrazione.',
        tags: ['Economia', 'Diritto', 'Marketing', 'Azienda'],
        w: {
            mate: 2, fisi: 0, scie: 0, info: 2, lett: 1, ling: 2, arte: 0, econ: 5, psic: 0, cuci: 0,
            logica: 3, comunicare: 3, creare: 0, computer: 2, organizzare: 5, persone: 2,
            uni: 2, lavoro: 4, studio: 3, pratica: 3,
            curiosita: 1, artistica: 0, comunicativa: 3, tecnico: 2, affari: 5, empatia: 1,
            libri: 1, prog: 1, disegno: 0, sport: 1, cucina: 0, viaggio: 3, volontariato: 0,
            tradizionale: 2, laboratorio: 2, atelier: 0, dibattito: 3, stage: 5,
            orario_mattina: 2, orario_sablibero: 4, orario_lungo: 4, orario_pomeriggio: 2
        }
    },
    tecnico_industriale: {
        label: 'Istituto Tecnico Industriale',
        desc: 'Informatica, elettronica, meccanica, chimica ed energia. Per chi vuole progettare, costruire e innovare con la tecnologia.',
        tags: ['Informatica', 'Elettronica', 'Meccanica', 'Tecnologia'],
        w: {
            mate: 4, fisi: 3, scie: 2, info: 5, lett: 0, ling: 0, arte: 0, econ: 1, psic: 0, cuci: 0,
            logica: 4, comunicare: 0, creare: 3, computer: 5, organizzare: 2, persone: 0,
            uni: 2, lavoro: 4, studio: 2, pratica: 5,
            curiosita: 3, artistica: 0, comunicativa: 0, tecnico: 5, affari: 1, empatia: 0,
            libri: 1, prog: 5, disegno: 1, sport: 1, cucina: 0, viaggio: 0, volontariato: 0,
            tradizionale: 1, laboratorio: 5, atelier: 0, dibattito: 0, stage: 4,
            orario_mattina: 2, orario_sablibero: 4, orario_lungo: 4, orario_pomeriggio: 3
        }
    },
    tecnico_cat: {
        label: 'Istituto Tecnico Costruzioni, Ambiente e Territorio',
        desc: 'Progettazione edilizia, topografia, disegno tecnico e CAD. L\'ex Geometri: per chi vuole progettare edifici e gestire il territorio.',
        tags: ['Costruzioni', 'Disegno Tecnico', 'Territorio', 'Progettazione'],
        w: {
            mate: 4, fisi: 3, scie: 2, info: 2, lett: 0, ling: 0, arte: 2, econ: 2, psic: 0, cuci: 0,
            logica: 4, comunicare: 1, creare: 4, computer: 3, organizzare: 3, persone: 1,
            uni: 2, lavoro: 4, studio: 2, pratica: 5,
            curiosita: 2, artistica: 2, comunicativa: 1, tecnico: 5, affari: 2, empatia: 0,
            libri: 1, prog: 2, disegno: 4, sport: 1, cucina: 0, viaggio: 1, volontariato: 0,
            tradizionale: 1, laboratorio: 4, atelier: 2, dibattito: 1, stage: 5,
            orario_mattina: 2, orario_sablibero: 4, orario_lungo: 4, orario_pomeriggio: 3
        }
    },
    tecnico_agrario: {
        label: 'Istituto Tecnico Agrario',
        desc: 'Agronomia, viticoltura, zootecnia e gestione sostenibile del territorio. Molta pratica in campo, serra e cantina.',
        tags: ['Agraria', 'Ambiente', 'Scienze', 'Territorio'],
        w: {
            mate: 2, fisi: 1, scie: 5, info: 1, lett: 0, ling: 1, arte: 0, econ: 3, psic: 0, cuci: 2,
            logica: 2, comunicare: 1, creare: 2, computer: 1, organizzare: 3, persone: 2,
            uni: 2, lavoro: 4, studio: 2, pratica: 5,
            curiosita: 4, artistica: 0, comunicativa: 1, tecnico: 4, affari: 2, empatia: 1,
            libri: 1, prog: 0, disegno: 0, sport: 2, cucina: 2, viaggio: 1, volontariato: 2,
            tradizionale: 1, laboratorio: 5, atelier: 0, dibattito: 1, stage: 5,
            orario_mattina: 2, orario_sablibero: 4, orario_lungo: 4, orario_pomeriggio: 3
        }
    },
    tecnico_turismo: {
        label: 'Istituto Tecnico per il Turismo',
        desc: 'Tre lingue straniere, geografia turistica, economia e marketing del territorio. Per chi vuole lavorare nel turismo e nell\'accoglienza.',
        tags: ['Turismo', 'Lingue', 'Economia', 'Territorio'],
        w: {
            mate: 1, fisi: 0, scie: 1, info: 2, lett: 2, ling: 5, arte: 2, econ: 4, psic: 1, cuci: 1,
            logica: 1, comunicare: 4, creare: 1, computer: 2, organizzare: 5, persone: 4,
            uni: 2, lavoro: 4, studio: 3, pratica: 3,
            curiosita: 1, artistica: 1, comunicativa: 5, tecnico: 1, affari: 4, empatia: 2,
            libri: 2, prog: 0, disegno: 0, sport: 1, cucina: 1, viaggio: 5, volontariato: 1,
            tradizionale: 2, laboratorio: 2, atelier: 0, dibattito: 3, stage: 5,
            orario_mattina: 2, orario_sablibero: 4, orario_lungo: 4, orario_pomeriggio: 2
        }
    },
    tecnico_trasporti: {
        label: 'Istituto Tecnico Trasporti e Logistica',
        desc: 'Conduzione di mezzi navali o aerei, logistica e meccanica dei trasporti. Molta pratica tecnica e simulazione.',
        tags: ['Trasporti', 'Logistica', 'Meccanica', 'Tecnologia'],
        w: {
            mate: 4, fisi: 4, scie: 2, info: 3, lett: 0, ling: 2, arte: 0, econ: 2, psic: 0, cuci: 0,
            logica: 4, comunicare: 1, creare: 2, computer: 3, organizzare: 4, persone: 1,
            uni: 2, lavoro: 4, studio: 2, pratica: 5,
            curiosita: 3, artistica: 0, comunicativa: 1, tecnico: 5, affari: 2, empatia: 0,
            libri: 1, prog: 2, disegno: 1, sport: 2, cucina: 0, viaggio: 4, volontariato: 0,
            tradizionale: 1, laboratorio: 5, atelier: 0, dibattito: 1, stage: 4,
            orario_mattina: 2, orario_sablibero: 4, orario_lungo: 4, orario_pomeriggio: 3
        }
    },
    prof_industria: {
        label: 'Istituto Professionale Industria e Artigianato',
        desc: 'Manutenzione, meccanica, elettrotecnica e produzioni artigianali. Officina e laboratorio dal primo anno, stage in azienda.',
        tags: ['Officina', 'Manutenzione', 'Pratica', 'Lavoro'],
        w: {
            mate: 2, fisi: 2, scie: 1, info: 2, lett: 0, ling: 0, arte: 1, econ: 1, psic: 0, cuci: 0,
            logica: 2, comunicare: 0, creare: 5, computer: 2, organizzare: 2, persone: 1,
            uni: 0, lavoro: 5, studio: 1, pratica: 5,
            curiosita: 2, artistica: 1, comunicativa: 0, tecnico: 5, affari: 1, empatia: 0,
            libri: 0, prog: 2, disegno: 2, sport: 1, cucina: 0, viaggio: 0, volontariato: 0,
            tradizionale: 0, laboratorio: 5, atelier: 1, dibattito: 0, stage: 5,
            orario_mattina: 1, orario_sablibero: 4, orario_lungo: 4, orario_pomeriggio: 5
        }
    },
    prof_commerciale: {
        label: 'Istituto Professionale Servizi Commerciali',
        desc: 'Amministrazione, vendite, comunicazione e promozione commerciale. Formazione pratica con stage in azienda dal terzo anno.',
        tags: ['Commercio', 'Stage', 'Servizi', 'Lavoro'],
        w: {
            mate: 1, fisi: 0, scie: 1, info: 1, lett: 1, ling: 1, arte: 0, econ: 2, psic: 2, cuci: 0,
            logica: 1, comunicare: 2, creare: 2, computer: 1, organizzare: 3, persone: 4,
            uni: 0, lavoro: 5, studio: 1, pratica: 5,
            curiosita: 1, artistica: 0, comunicativa: 2, tecnico: 3, affari: 2, empatia: 3,
            libri: 0, prog: 1, disegno: 0, sport: 1, cucina: 0, viaggio: 0, volontariato: 3,
            tradizionale: 0, laboratorio: 3, atelier: 0, dibattito: 1, stage: 5,
            orario_mattina: 2, orario_sablibero: 4, orario_lungo: 4, orario_pomeriggio: 4
        }
    },
    prof_alberghiero: {
        label: 'Istituto Professionale Enogastronomia e Ospitalita',
        desc: 'Cucina, pasticceria, sala-bar e accoglienza turistica. Per chi sogna il mondo della ristorazione e dell\'ospitalita.',
        tags: ['Cucina', 'Ristorazione', 'Turismo', 'Ospitalita'],
        w: {
            mate: 0, fisi: 0, scie: 1, info: 0, lett: 1, ling: 2, arte: 1, econ: 1, psic: 0, cuci: 5,
            logica: 0, comunicare: 2, creare: 3, computer: 0, organizzare: 3, persone: 5,
            uni: 0, lavoro: 5, studio: 1, pratica: 5,
            curiosita: 1, artistica: 2, comunicativa: 2, tecnico: 1, affari: 2, empatia: 2,
            libri: 0, prog: 0, disegno: 0, sport: 0, cucina: 5, viaggio: 3, volontariato: 0,
            tradizionale: 0, laboratorio: 4, atelier: 0, dibattito: 0, stage: 5,
            orario_mattina: 2, orario_sablibero: 4, orario_lungo: 4, orario_pomeriggio: 4
        }
    },
    prof_agrario: {
        label: 'Istituto Professionale Agricoltura e Sviluppo Rurale',
        desc: 'Coltivazioni, allevamento, trasformazione dei prodotti e valorizzazione del territorio rurale. Molto lavoro pratico in campo.',
        tags: ['Agricoltura', 'Ambiente', 'Pratica', 'Lavoro'],
        w: {
            mate: 1, fisi: 0, scie: 4, info: 0, lett: 0, ling: 0, arte: 0, econ: 2, psic: 0, cuci: 2,
            logica: 1, comunicare: 1, creare: 3, computer: 0, organizzare: 2, persone: 2,
            uni: 0, lavoro: 5, studio: 1, pratica: 5,
            curiosita: 3, artistica: 0, comunicativa: 1, tecnico: 4, affari: 2, empatia: 1,
            libri: 0, prog: 0, disegno: 0, sport: 2, cucina: 2, viaggio: 0, volontariato: 2,
            tradizionale: 0, laboratorio: 4, atelier: 0, dibattito: 0, stage: 5,
            orario_mattina: 1, orario_sablibero: 4, orario_lungo: 4, orario_pomeriggio: 5
        }
    },
    prof_socio_sanitario: {
        label: 'Istituto Professionale Servizi Socio-Sanitari',
        desc: 'Assistenza alla persona, puericultura, psicologia e igiene. Per chi vuole lavorare con bambini, anziani o persone con disabilita.',
        tags: ['Sanita', 'Assistenza', 'Sociale', 'Lavoro'],
        w: {
            mate: 1, fisi: 0, scie: 4, info: 0, lett: 2, ling: 1, arte: 1, econ: 1, psic: 5, cuci: 1,
            logica: 1, comunicare: 3, creare: 2, computer: 0, organizzare: 3, persone: 5,
            uni: 1, lavoro: 5, studio: 2, pratica: 5,
            curiosita: 2, artistica: 1, comunicativa: 3, tecnico: 1, affari: 0, empatia: 5,
            libri: 1, prog: 0, disegno: 0, sport: 1, cucina: 1, viaggio: 0, volontariato: 5,
            tradizionale: 1, laboratorio: 3, atelier: 0, dibattito: 3, stage: 5,
            orario_mattina: 2, orario_sablibero: 4, orario_lungo: 4, orario_pomeriggio: 4
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RATING_LABELS, QUESTIONS, ARCHETYPES };
}
