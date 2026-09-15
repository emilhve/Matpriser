# Matpriser

Matpriser er en enkel prototype for ukeplanlegging av middager. Brukeren velger hvor mange middager i uken som skal være kjøtt, kylling, fisk og vegetar. Appen ber Gemini lage 7 enkle norske hverdagsoppskrifter, søker etter ingrediensene i Kassalapp, og viser et estimat på hva hver middag koster basert på hvilke produkter man faktisk må kjøpe.

## Hvordan bruke prosjektet

### 1. Klargjør miljøet

Du trenger Node.js 20 eller nyere.

Kopier `.env.example` til `.env`:

```bash
copy .env.example .env
```

Legg inn API-nøklene dine i `.env`:

```bash
API_KEY=din-kassalapp-nokkel
GEMINI_API_KEY=din-gemini-nokkel
```

Resten av verdiene kan stå som de er i starten:

```bash
API_BASE_URL=https://kassal.app/api/v1
API_AUTH_HEADER=Authorization
API_AUTH_SCHEME=Bearer
API_TIMEOUT_MS=10000

GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_MAX_OUTPUT_TOKENS=2500
GEMINI_TEMPERATURE=0.9
PORT=3000
```

### 2. Start appen

```bash
npm.cmd start
```

Åpne deretter:

```text
http://localhost:3000
```

Hvis port `3000` allerede er i bruk, kan du starte på en annen port:

```powershell
$env:PORT=3001; npm.cmd start
```

### 3. Lag en middagsplan

På forsiden velger du hvor mange middager du vil ha av hver type:

- Meat
- Chicken
- Fish
- Vegetarian

Dropdownene passer på at totalen aldri kan bli mer enn 7. Knappen `Generate recipes` blir først aktiv når totalen er akkurat 7.

Når du trykker `Generate recipes`, gjør appen dette:

1. Sender fordelingen til lokal backend.
2. Backend ber Gemini lage 7 enkle oppskrifter.
3. Backend validerer svaret fra Gemini.
4. Backend søker etter ingrediensene i Kassalapp.
5. Backend legger til prisforslag og totalpris per middag.
6. Nettleseren går til oppskriftssiden.

Oppskriftene vises som restaurant-lignende order tickets. Hver oppskrift viser ingrediensene, valgt produktmatch, butikk og estimert pris for middagen.

Nederst på oppskriftssiden finnes knappen `Go to shoppinglist`. Den åpner en handleliste gruppert per butikk.

### 4. Handlelisten

Handlelisten bruker oppskriftene som allerede er generert og lagret i `sessionStorage` i nettleseren. Den grupperer produkter etter butikk og viser:

- hvilke produkter som skal kjøpes
- hvor mange pakker som trengs
- estimert kostnad per produkt
- hvilke oppskrifter produktet brukes i
- ingredienser som ikke fikk prismatch

Handlelisten er bare lagret i den aktive nettleserøkten. Den er ikke lagret i en database.

### 5. Kommandoer

Sjekk JavaScript-syntaks:

```bash
npm.cmd run check
```

Kjør tester:

```bash
npm.cmd test
```

Søk direkte i Kassalapp fra terminalen:

```bash
npm.cmd run cli melk
```

## Hva prosjektet er

Prosjektet er en lokal webapp og backend i samme Node.js-prosess. Det er ikke en full produksjonsapp ennå, men en fungerende prototype for å teste ideen:

> Kan vi lage en enkel ukemeny, finne relevante dagligvarer automatisk, og gi brukeren et prisestimat per middag?

Appen bruker to eksterne API-er:

- Gemini API for å generere oppskrifter.
- Kassalapp API for å søke etter norske dagligvarer og priser.

## Hvordan det fungerer

### Frontend

Frontend ligger i `public/` og er skrevet med vanlig HTML, CSS og JavaScript:

```text
public/
  index.html          Forsiden med valg av middagsfordeling
  app.js              Dropdown-logikk og kall til /api/meal-plan
  recipes.html        Oppskriftsside
  recipes.js          Renderer 7 order tickets
  shopping-list.html  Handleliste per butikk
  shopping-list.js    Grupperer matvarer etter butikk
  styles.css          Styling for alle sidene
```

Det brukes ingen frontend-rammeverk, ingen bundler og ingen build-step. Nettleseren laster filene direkte fra Node-serveren.

Den genererte middagsplanen lagres i `sessionStorage`, slik at `recipes.html` og `shopping-list.html` kan lese samme data uten database.

### Backend

Backend ligger i `src/` og bruker Node sin innebygde HTTP-server:

```text
src/
  server.js                    Lokal server og API-endepunkt
  config/env.js                Leser .env og miljøvariabler
  lib/apiClient.js             Felles HTTP-klient for Kassalapp
  services/gemini.js           Lager og validerer oppskrifter fra Gemini
  services/kassalapp.js        Kassalapp-endepunkter
  services/ingredientPricing.js Matcher ingredienser mot produkter og priser
  data/dinnerCategories.js     Relevante middagskategorier fra Kassalapp
  index.js                     Enkel CLI for Kassalapp-søk/healthcheck
```

Backend har ett hovedendepunkt:

```text
POST /api/meal-plan
```

Request-body er fordelingen av middager:

```json
{
  "meat": 2,
  "chicken": 2,
  "fish": 1,
  "vegetarian": 2
}
```

Responsen er en middagsplan med 7 oppskrifter. Hver ingrediens forsøkes beriket med en `productMatch` fra Kassalapp:

```js
{
  name: "ris",
  searchTerm: "ris",
  amount: 300,
  unit: "g",
  productMatch: {
    productId: 123,
    name: "Middagsris 1kg",
    storeName: "KIWI",
    storeCode: "KIWI",
    price: 29.9,
    unitPrice: 29.9,
    packageAmount: 1000,
    packageUnit: "g",
    packagesNeeded: 1,
    basketCost: 29.9,
    quantityEstimated: false
  }
}
```

### Gemini-flyten

`src/services/gemini.js` bygger en streng prompt som ber om:

- nøyaktig 7 oppskrifter
- riktig antall kjøtt/kylling/fisk/vegetar
- maks 5 ingredienser per oppskrift
- norske ingrediensnavn
- enkle `searchTerm`-verdier som fungerer bedre i Kassalapp
- vanlige dagligvarer, ikke ferdig tilberedte beskrivelser som `revet gulrot` eller `hardkokte egg`

Gemini blir bedt om strukturert JSON. Etterpå validerer backend svaret. Hvis Gemini returnerer noe som bryter reglene, prøver backend å få Gemini til å rette JSON-en. Den prøver maks 3 ganger.

### Kassalapp- og prismatching

`src/services/ingredientPricing.js` tar ingrediensene fra Gemini og søker etter produkter i Kassalapp.

Matcher-logikken bruker:

- `searchTerm` fra Gemini
- kategori-hints for vanlige varer
- aliaser for søkeord som ofte trenger mer presise varianter
- blokkeringslister for å unngå desserter, snacks, ferdigretter og kjente dårlige treff
- en relevansscore basert på produktnavn
- pris og pakningsstørrelse

Kostnaden regnes som faktisk handlekurv-kostnad, ikke brukt mengde. Hvis en oppskrift trenger `300 g ris`, og billigste relevante produkt er en pakke på `1 kg`, teller appen hele pakken. Hvis en oppskrift trenger mer enn én pakke, regnes antall pakker med `Math.ceil`.

Enheter som forsøkes normalisert:

- `g` og `kg`
- `ml`, `dl`, `l`
- `stk`, `piece`, `pcs`

Hvis mengden ikke kan sammenlignes trygt, velges fortsatt et produkt hvis mulig, men matchen markeres med `quantityEstimated: true`.

## Teknologier

- Node.js 20+
- ES modules
- Native `fetch`
- Node sin innebygde `http`-server
- Vanilla HTML, CSS og JavaScript
- Gemini Generative Language API
- Kassalapp API
- `node:test` for tester

Prosjektet har ingen runtime dependencies i `package.json` akkurat nå.

## Feil og mangler

Dette er fortsatt en prototype. Det viktigste som ikke er godt nok ennå:

### Produktmatching er ikke perfekt

Kassalapp-søk kan returnere irrelevante produkter, og matcher-logikken er heuristisk. Det finnes regler for mange vanlige feil, men listen er ikke komplett. Nye rare treff kan dukke opp når ingrediensene varierer.

Eksempler som tidligere måtte fikses:

- `rømme` kunne matche `Det Innerste Rommet`
- `ris` kunne matche produkter som bare inneholdt `ris` inne i et annet ord
- `brød` kunne matche `pølsebrød`
- `potetmos` kunne matche en ferdigrett

Dette er bedre nå, men ikke løst generelt for alle matvarer.

### Prisene er estimater

Prisene kommer fra Kassalapp-dataene appen får tilbake i øyeblikket. Appen sjekker ikke lagerstatus, lokale butikkforskjeller, kampanjer, medlemspriser eller om varen faktisk er praktisk å kjøpe.

### Billigst per ingrediens kan gi mange butikker

V1 velger billigste match per ingrediens på tvers av butikker. Det betyr at en middagsplan kan ende med varer fra flere butikker. Det er ikke nødvendigvis slik en ekte bruker ville handlet.

En senere versjon bør kunne optimalisere for én butikk, nærmeste butikk, foretrukne kjeder eller lavest totalpris med færrest butikkbesøk.

### Handlelisten optimaliserer ikke hele ukesforbruket godt nok

Oppskriftene regner kostnad per middag. Handlelisten grupperer like produktmatcher, men appen har ikke en full ukesoptimering som forstår rester, halvfulle pakker, alternative pakningsstørrelser eller at én stor pakke kan dekke flere middager billigere enn flere små.

### Mengder og enheter er begrenset

Matcher-logikken håndterer noen vanlige enheter, men ikke alt. Hvis Gemini eller Kassalapp bruker uklare mengder, blir antall pakker estimert. Det kan gi feil totalpris.

### Gemini kan fortsatt lage svake forslag

Prompten er streng, og backend validerer svaret, men Gemini kan fortsatt foreslå ingredienser som er vanskelige å søke etter, lite relevante for norske butikker, eller for like hverandre. Appen prøver å rette feil automatisk, men stopper etter 3 forsøk.

### Data lagres ikke permanent

Det finnes ingen brukerkonto, database eller historikk. Oppskriftene ligger bare i `sessionStorage` i nettleseren. Lukker du fanen eller åpner oppskriftssiden direkte uten å generere en plan først, finnes det ingen plan å vise.

### Ingen produksjonsoppsett

Serveren er laget for lokal utvikling. Den har ikke autentisering, rate limiting, logging, caching, deploy-oppsett eller robust feilhåndtering for produksjon.

## Videre arbeid

Naturlige neste steg:

- la brukeren velge butikk eller kjede
- forbedre produktmatching med flere kategorier og bedre scoring
- samle like ingredienser før prissøk
- optimalisere handlelisten på ukesnivå
- vise billigste butikk per hel handlekurv
- lagre planer i en database
- oversette UI-tekst konsekvent til norsk
