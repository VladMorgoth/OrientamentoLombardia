# Orientamento Scuole Superiori — Analisi del progetto

Progetto di orientamento scolastico nato da un'esigenza concreta: aiutare una ragazza di terza
media a scegliere la scuola superiore. È evoluto in due applicativi distinti che condividono
lo stesso motore di affinità.

| | **v1 — Sondrio** | **v2 — Lombardia (PWA)** |
|---|---|---|
| Cartella | `../SceltaScuolaSondrio/` | `./app/` |
| Scuole | 11, curate a mano | 1165, da dati ministeriali |
| Copertura | città di Sondrio | tutta la Lombardia |
| Posizione | assente | GPS o ricerca comune + raggio in km |
| Distribuzione | file HTML singolo | PWA installabile, offline |
| Online | [vladmorgoth.github.io/OrientamentoScuolaSuperiore](https://vladmorgoth.github.io/OrientamentoScuolaSuperiore/) | da pubblicare |

---

## 1. Il motore di affinità

È il cuore condiviso dalle due versioni e non è cambiato nella sostanza: la v2 ne ha solo
ampliato il catalogo.

### Come funziona

1. **40 dimensioni di profilo.** Ogni risposta alimenta un vettore di punteggi su dimensioni
   come `mate`, `logica`, `empatia`, `pratica`, `orario_pomeriggio`.
2. **9 domande.** Due a scelta multipla (max 3 opzioni: materie, hobby), sette a scala di
   gradimento su 5 livelli *Per nulla → Molto*, valutate voce per voce.
3. **Pesatura graduata.** Una risposta a scala contribuisce in proporzione:
   `fattore = valore / 4`, quindi "Abbastanza" vale il 75% del peso pieno. È la modifica che
   ha reso i risultati molto più sfumati rispetto alla prima versione a risposta singola.
4. **Confronto con gli archetipi.** Per ogni indirizzo di studio:
   ```
   punteggio = Σ (profiloUtente[k] × peso[k])
   massimo   = Σ (5 × peso[k])        per ogni k con peso > 0
   affinità  = min(round(punteggio / massimo × 100), 99)
   ```
5. **Normalizzazione.** Se il punteggio migliore resta sotto il 50%, tutti i valori vengono
   alzati della stessa quantità (fino a 55%). Evita classifiche demoralizzanti del tipo
   "la tua scuola ideale: 23%" senza alterare l'ordine.

### Dai 11 profili ai 20 archetipi

La differenza architetturale chiave della v2: **l'affinità non è più legata alla singola
scuola ma all'indirizzo di studio**. Con 1165 scuole è impensabile scrivere un profilo a mano
per ognuna, mentre gli indirizzi sono un insieme chiuso e riutilizzabile.

Gli 11 profili della v1 sono stati riportati **con i pesi identici**, per non perdere un
comportamento già validato sul campo, e affiancati da 9 nuovi archetipi:

**Riportati dalla v1** — Liceo Scientifico, Scienze Applicate, Classico, Linguistico,
Scienze Umane, Sportivo, Artistico, Tecnico Economico, Tecnico Industriale,
Professionale Commerciale, Professionale Alberghiero

**Nuovi nella v2** — Liceo Musicale e Coreutico, Liceo Economico-Sociale, Tecnico Agrario,
Tecnico Turismo, Tecnico Costruzioni (CAT), Tecnico Trasporti e Logistica,
Professionale Industria e Artigianato, Professionale Agricoltura,
Professionale Socio-Sanitario

Una scuola può avere **più indirizzi**: la sua affinità è quella del suo indirizzo migliore,
e l'app mostra quale ha fatto il match più gli altri presenti nello stesso plesso.

---

## 2. Pipeline dati

Il punto più delicato del progetto. Nessuna fonte singola contiene "scuole superiori lombarde
con indirizzo di studio e coordinate": il dato va costruito incrociando quattro fonti.

```
         MIUR anagrafica                  comuni-json            italy_geo
    (nome, tipo, indirizzo, sito)    (catastale → ISTAT)      (ISTAT → lat/lon)
                 │                            │                      │
                 ▼                            └──────────┬───────────┘
          tools/extract.js                               │
    filtra Lombardia + II grado                          │  riserva:
    scarta i contenitori IIS                             │  centroide comunale
    mappa tipologia → archetipo                          │
    arricchisce dal nome del plesso                      │
                 │                                       │
                 ▼                                       │
        schools_raw.json (1165)                          │
                 │                                       │
                 ▼                                       │
         tools/geocode.js  ──── Nominatim / OSM ─────────┤  preferenza:
         (1 req/s, cache su disco)                       │  indirizzo civico
                 │                                       │
                 ▼                                       ▼
                        tools/build.js
                              │
                              ▼
              app/data/scuole.json  +  app/data/comuni.json
```

### Le fonti

| Fonte | Cosa fornisce | Note |
|---|---|---|
| `dati.istruzione.it` — `SCUANAGRAFESTAT20262720260901.csv` | 50.273 scuole statali italiane: nome, tipologia, via, CAP, comune, sito, email | anno scolastico 2026/27 |
| `dati.istruzione.it` — `SCUANAGRAFEPAR20262720260901.csv` | scuole paritarie | header diverso dal file statali |
| `matteocontrini/comuni-json` | 7904 comuni: nome, ISTAT, **codice catastale**, provincia, regione | serve come ponte fra i codici |
| `MatteoHenryChinaski/.../italy_geo.json` | coordinate per codice ISTAT | 2018, ma i centroidi non si spostano |
| Nominatim (OpenStreetMap) | geocodifica degli indirizzi civici | 1 req/s, User-Agent identificativo |

### Trappole incontrate (e risolte)

Documentate perché non sono ovvie e farebbero perdere tempo a chiunque riprenda il progetto.

1. **MIUR usa il codice catastale, non l'ISTAT.** `CODICECOMUNESCUOLA` per Sondrio vale
   `I829` (codice Belfiore), mentre i dataset geografici usano `014061`. Serve il passaggio
   intermedio catastale → ISTAT → coordinate. Senza di esso il join falliva su tutte le 1165
   righe.

2. **Le paritarie usano nomi di tipologia diversi.** Dove le statali dicono `LICEO SCIENTIFICO`,
   le paritarie dicono `SCUOLA SEC. SECONDO GRADO NON STATALE`. Il primo filtro, tarato sulle
   statali, lasciava passare **1612 scuole d'infanzia**.

3. **I 186 contenitori IIS duplicano i plessi.** Le righe con tipologia `ISTITUTO SUPERIORE`
   hanno `CODICESCUOLA == CODICEISTITUTORIFERIMENTO`: sono l'ente amministrativo ombrello,
   e i suoi indirizzi compaiono già come righe separate. Vanno scartate per non contare due
   volte la stessa scuola.

4. **I dati MIUR sono ASCII puro.** Gli accenti sono resi con apostrofo finale (`CITTA'`,
   `ATTIVITA'`) e si trovano artefatti come `VIA TONALE N? 14`, dove il `?` era un `°`
   corrotto a monte. `lib.js` normalizza entrambi i casi.

5. **`fetch` di node non attraversa il proxy aziendale.** Restituisce `fetch failed`; con
   `NODE_USE_ENV_PROXY=1` arriva al proxy ma riceve `Access denied`. `curl` passa senza
   problemi, quindi tutte le richieste HTTP degli script passano da `curl` tramite
   `lib.js → curlJson()`. Questo ha fatto fallire silenziosamente il primo giro di
   geocodifica (10 richieste, 10 errori, ETA stimata 47 ore).

### Risultato

**1165 scuole** — 790 statali, 375 paritarie.

| Provincia | Scuole | | Provincia | Scuole |
|---|---|---|---|---|
| Milano | 330 | | Como | 57 |
| Brescia | 162 | | Cremona | 46 |
| Bergamo | 158 | | Lecco | 45 |
| Varese | 125 | | Mantova | 44 |
| Monza e Brianza | 98 | | Lodi | 18 |
| Pavia | 64 | | Sondrio | 18 |

Più **1506 comuni** lombardi per la ricerca testuale (1495 da `italy_geo.json` + 11 fusioni
post-2018 geocodificate a parte).

### Qualità delle coordinate

Due livelli, con un campo `approx` che li distingue:

- **Civico esatto** (`approx: 0`) — Nominatim risolve l'indirizzo; spesso riconosce
  direttamente l'edificio scolastico. Esempio: il Donegani di Sondrio risolve a
  `46.17140, 9.88386` con `place_rank 30`.
- **Centro del comune** (`approx: 1`) — riserva quando l'indirizzo non è in OSM. Errore
  tipico di 1-3 km, irrilevante su un raggio di 30 km ma visibile su raggi piccoli e nelle
  grandi città, dove tutte le scuole collassano su un punto.

> **Stato attuale:** la geocodifica civico per civico è in corso in background
> (~1165 richieste a 1 req/s). Finché non termina, `build.js` usa i centroidi comunali per
> tutte le scuole: l'app è pienamente funzionante ma le distanze sono approssimate e le
> scuole dello stesso comune risultano a 0 km. Al termine basta rilanciare `build.js`.

---

## 3. Struttura del progetto

```
OrientamentoLombardia/
├── app/                          # la PWA, cartella pubblicabile così com'è
│   ├── index.html                # shell + tutto il CSS (20 KB)
│   ├── catalogo.js               # 9 domande + 20 archetipi con i pesi (28 KB)
│   ├── app.js                    # stato, geo, affinità, PDF, condivisione (32 KB)
│   ├── manifest.webmanifest      # installazione, icone, tema
│   ├── sw.js                     # service worker: offline + aggiornamento dati
│   ├── icon.svg / icon-maskable.svg
│   └── data/
│       ├── scuole.json           # 1165 scuole con coordinate (416 KB)
│       └── comuni.json           # 1506 comuni lombardi (108 KB)
│
├── tools/                        # pipeline dati, non viene pubblicata
│   ├── lib.js                    # CSV, mappa tipologie, pulizia testo, curlJson
│   ├── inspect.js                # esplorazione dei dataset grezzi
│   ├── extract.js                # MIUR → schools_raw.json
│   ├── geocode.js                # schools_raw → geocache (ripartenza sicura)
│   ├── geocode-comuni.js         # le 11 fusioni comunali mancanti
│   ├── build.js                  # tutto → app/data/*.json
│   ├── serve.js                  # server statico locale
│   └── test-logic.js             # test del motore di affinità
│
├── data_raw/                     # scaricati e intermedi (rigenerabili)
└── ANALISI_PROGETTO.md
```

Separazione volutamente netta: `app/` è autosufficiente e pubblicabile, `tools/` e `data_raw/`
servono solo a rigenerare i dati.

---

## 4. Architettura della PWA

### Flusso utente

```
Benvenuto → Posizione → Raggio → 9 domande → Risultati
              │           │                      │
         GPS o comune   2-100 km            PDF · WhatsApp
                      conteggio live      ordina per affinità
                                            o per distanza
```

### Scelte tecniche

- **Nessun framework, nessuna build.** Tre file statici. Si apre con doppio clic o si pubblica
  su GitHub Pages senza passaggi intermedi: coerente con il fatto che il progetto deve restare
  modificabile da una persona sola.
- **Percorsi relativi** (`./`) in tutto il codice, perché GitHub Pages serve da una
  sottocartella.
- **Dati inclusi nell'app, aggiornabili da remoto** (scelta "ibrida"). Il service worker usa
  *cache-first* per la shell — apertura istantanea e offline — e
  *stale-while-revalidate* per `data/`: mostra subito i dati in cache e nel frattempo scarica
  la versione aggiornata per la volta successiva.
- **Geolocalizzazione con ripiego esplicito.** Ogni errore del GPS (permesso negato, non
  disponibile, timeout) ha un messaggio dedicato che rimanda alla ricerca per comune. Se la
  posizione rilevata è a più di 25 km da qualunque comune lombardo, l'app avvisa che si è
  fuori copertura invece di mostrare zero risultati senza spiegazione.
- **Distanza in linea d'aria** (formula di Haversine). È una semplificazione dichiarata
  nell'interfaccia: in Valtellina o in Valcamonica la distanza stradale può essere molto
  maggiore di quella aerea.
- **Classifica ordinabile** per affinità o per distanza, con l'altra grandezza usata come
  criterio di spareggio.
- **Scuole non classificabili a parte.** Le 106 righe il cui indirizzo non è deducibile dai
  dati ufficiali finiscono in una sezione "Altre scuole in zona" senza percentuale, con una
  nota che spiega perché. Preferibile a escluderle in silenzio o a inventare un punteggio.

### Accorgimenti di interfaccia

- **Scale di gradimento su mobile.** La resa a 5 pulsanti con etichette testuali si
  sovrapponeva in verticale. Su schermi sotto i 600 px la riga diventa `display: block`: la
  domanda occupa tutta la larghezza, i cinque pulsanti stanno sotto mostrando solo il numero
  1-5, e una legenda colorata in cima traduce i numeri. Soluzione arrivata dopo tre iterazioni
  guidate da uno screenshot reale dal telefono.
- **Pulsanti di esportazione in alto**, sopra la classifica, perché in fondo alla pagina
  rischiavano di non essere visti.
- **PDF completo** con classifica, indirizzi, distanze *e* tutte le risposte date: serve a
  ragionarci in famiglia dopo il test.
- **Condivisione WhatsApp** via Web Share API con immagine su mobile; su desktop scarica il
  PNG e apre WhatsApp Web col testo della classifica.

---

## 5. Comandi

```bash
# --- rigenerare i dati (nell'ordine) ---
cd OrientamentoLombardia

# 1. scaricare l'anagrafica MIUR dell'anno corrente
#    gli URL si trovano su https://dati.istruzione.it/opendata/opendata/catalogo/elements1/?area=Scuole
curl -o data_raw/anagrafe_stat.csv "https://dati.istruzione.it/opendata/opendata/catalogo/elements1/leaf/SCUANAGRAFESTAT20262720260901.csv"
curl -o data_raw/anagrafe_par.csv  "https://dati.istruzione.it/opendata/opendata/catalogo/elements1/leaf/SCUANAGRAFEPAR20262720260901.csv"

# 2. estrarre e classificare (REGION=... per cambiare regione)
node tools/extract.js data_raw data_raw/schools_raw.json

# 3. geocodificare — lungo, ~25 min, con cache: si può interrompere e riprendere
node tools/geocode.js data_raw/schools_raw.json data_raw/geocache.json

# 4. produrre i file dell'app
node tools/build.js data_raw app/data

# --- sviluppo ---
node tools/serve.js app 8099      # poi http://127.0.0.1:8099/
node tools/test-logic.js app      # test del motore
```

### Test

`test-logic.js` esegue il **vero `app.js`** in un contesto `vm` con DOM finto, così verifica
il codice di produzione e non una copia. Due dettagli non ovvi: i `const` di primo livello non
diventano proprietà globali e vanno esposti con un secondo script nello stesso contesto;
e `fetch` è sostituito da una lettura da filesystem.

Controlla:
- integrità dati (coordinate nel riquadro Italia, indirizzi presenti, nessun archetipo ignoto)
- Haversine su distanza nota (Sondrio-Milano: 94,4 km, atteso ~95)
- tre profili sintetici danno i risultati attesi:
  scientifico → Scienze Applicate / Scientifico ·
  creativo → Artistico / Musicale ·
  sociale → Scienze Umane / Socio-Sanitario
- monotonia del conteggio al crescere del raggio
- testo di condivisione

Il rendering grafico **non** è coperto: va verificato a mano su browser e telefono.

---

## 6. Limiti noti

1. **La classificazione MIUR è quella storica.** I plessi portano denominazioni pre-riforma:
   `ISTITUTO MAGISTRALE` per il Liceo delle Scienze Umane, `IST TEC COMMERCIALE E PER GEOMETRI`
   per l'Economico. Indirizzi moderni come **Linguistico, Scienze Applicate, Sportivo,
   Musicale, Economico-Sociale non esistono** come tipologia a sé.

   Mitigazione: `NAME_HINTS` in `lib.js` li deduce dal nome del plesso, che spesso li elenca —
   "LICEI SCIENTIFICO UMANE LINGUE- DA VINCI" produce correttamente tre indirizzi. Funziona su
   120 scuole, ma resta un'euristica: il Polo Liceale di Sondrio offre 7 indirizzi e nei dati
   ministeriali ne risultano 2. Per questo ogni risultato espone il link al sito e l'app
   avvisa che l'elenco può essere incompleto.

2. **Distanza aerea, non stradale.** Penalizza le valli alpine, dove 20 km in linea d'aria
   possono essere un'ora di auto.

3. **Nessun dato su trasporti, costi, numero chiuso o esami di ammissione.** Il Liceo Musicale
   richiede un'ammissione che l'app non menziona; le paritarie hanno retta non indicata.

4. **I pesi degli archetipi sono un giudizio soggettivo**, non una validazione psicometrica.
   Vanno letti come uno spunto di riflessione, non come un responso.

5. **Solo Lombardia.** `extract.js` accetta `REGION` come variabile d'ambiente, quindi
   estendere è immediato, ma la geocodifica di un'altra regione richiede un nuovo giro da
   ~25 minuti.

6. **Icone solo SVG.** Chrome su Android le accetta, ma alcune piattaforme preferiscono PNG
   in più dimensioni.

---

## 7. Possibili sviluppi

In ordine di rapporto fra utilità e sforzo:

1. **Completare la geocodifica civico per civico** — già in corso; elimina il problema delle
   scuole sovrapposte nelle grandi città.
2. **Arricchire gli indirizzi dai siti scolastici.** Il campo `SITOWEBSCUOLA` è presente su
   tutte le 1165 scuole: una scansione delle pagine "offerta formativa" risolverebbe il
   limite 1, che è il più serio.
3. **Filtri nei risultati** — solo statali, solo licei, esclusione dei non classificabili.
4. **Salvataggio in `localStorage`** di posizione e risposte, per non ricominciare da capo.
5. **Preferiti e confronto** fra due o tre scuole affiancate.
6. **Tempo di viaggio reale** con un servizio di routing al posto della linea d'aria.
7. **Estensione nazionale**, regione per regione.
8. **Reel promozionale** — `../SceltaScuolaSondrio/reel.html` contiene già un'animazione
   verticale 1080×1920 da registrare per Instagram, da aggiornare con i numeri della v2.

---

*Documento aggiornato al 20 novembre 2026.*
