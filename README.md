# Olaf — Portfolio & speelveld

Een Nederlandstalig portfolio en twee browsergames: Memory en een reactietest met een lokaal bewaard persoonlijk record. We ontwikkelen op **`Dev`**. `main` blijft de stabiele versie; wijzigingen gaan daar pas na review naartoe.

## Projectstructuur

```text
Website/
├── public/                       # Alleen deze map wordt door de server aangeboden
│   ├── index.html                # Portfolio
│   ├── pages/
│   │   └── games.html            # Speelveld
│   └── assets/
│       ├── css/
│       │   ├── base.css          # Gedeelde stijl, navigatie en knoppen
│       │   └── pages/            # Stijl per pagina
│       ├── js/
│       │   └── games/            # Pagina-entrypoint en een module per spel
│       └── images/               # Afbeeldingen en favicon
├── tests/browser/                # Functionele browsertests
├── docs/                         # Architectuur en toekomstige ideeën
├── start.py                      # Lokale server
├── AGENTS.md                     # Werkafspraken voor code-assistenten
└── README.md
```

Zie [architectuur](docs/architecture.md) voor plaatsingsregels en [projectideeën](docs/roadmap.md) voor latere uitbreidingen.

## Op je eigen computer starten

Deze versie draait lokaal. Python 3 is nodig; er zijn geen extra packages, API-sleutels of buildstappen nodig.

1. Selecteer op GitHub de branch **Dev**, download via **Code → Download ZIP** en pak uit. Of clone direct deze branch:

   ```sh
   git clone --branch Dev https://github.com/olafheijl/Website.git
   cd Website
   ```

   Heb je al een lokale checkout? Stap dan over op Dev:

   ```sh
   git fetch origin
   git switch Dev
   git pull --ff-only
   ```
2. Open een terminal in de map met `start.py`.
3. Start de server:

   **Windows:**
   ```sh
   python start.py
   ```

   **macOS / Linux:**
   ```sh
   python3 start.py
   ```

4. Open **http://localhost:8000** voor het portfolio of **http://localhost:8000/pages/games.html** voor de spellen. Houd de terminal open. Stop de server met Ctrl+C.

Als Windows alleen het commando `py` herkent, gebruik je `py start.py`. Start altijd via deze server: de spelcode gebruikt JavaScript-modules, die niet werken door de HTML rechtstreeks vanaf schijf te openen.

De server luistert uitsluitend op `127.0.0.1`, dus niet op het lokale netwerk. Als poort 8000 bezet is, voeg dan `--port 8001` toe en open `http://localhost:8001`.

Wanneer je de server in de cloudomgeving start, draait hij op de cloudcomputer. Dat maakt hem niet bereikbaar via localhost op je eigen computer.

Lettertypen, stijlen en spelcode worden lokaal geladen. Alleen de beste reactietijd wordt in `localStorage` opgeslagen. Er is geen backend, tracking of gebruikersaccount.

## GitHub is alleen de opslagplek

Voor lokaal draaien zijn GitHub Pages en toegang tot de GitHub-API niet nodig. Er wordt geen hosting of betaalde dienst ingesteld door deze code. Heb je Pages zelf al aangezet? Schakel die dan uit via **Settings → Pages → Unpublish site**. Deze repositorywijziging wijzigt geen instellingen op GitHub.

## Browsercontroles

In deze cloudomgeving zijn Playwright en Chromium beschikbaar:

```sh
node --test tests/browser/website.test.cjs
```

De tests starten zelf `start.py` op een tijdelijke poort en controleren de publieke bestanden, afscherming van ontwikkelbestanden, navigatie, mobiele weergave, een volledig Memory-spel, resetten tijdens een beurt, te vroeg reageren, een geldige reactie en het bewaren van het record. Buiten deze omgeving zijn Node.js, `playwright` en Chromium nodig; stel zo nodig `CHROMIUM_PATH` in op het browserpad. Deze hulpmiddelen zijn alleen nodig voor de tests, niet om de website te gebruiken.

## Verder bouwen

Elke pagina krijgt een eigen stylesheet en elk spel een eigen JavaScript-module. Nieuwe toepassingen krijgen hun eigen pagina en modulemap. De plannen voor multiplayer, een A*-visualizer en computer vision staan in `docs/roadmap.md`; ze zijn nog niet gebouwd.

Werk op `Dev` en push met `git push origin Dev`. Samenvoegen naar `main` gebeurt later via een pull request, na review. Een push naar `Dev` publiceert de website niet.
