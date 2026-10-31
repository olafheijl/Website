# Olaf — Portfolio & speelveld

Een Nederlandstalig portfolio met Memory, een reactietest en drie bordspellen: Boter, kaas en eieren, 4 op een rij en Gomoku. Speel samen of tegen de computer. We ontwikkelen op **`dev`**. `main` blijft de stabiele versie; wijzigingen gaan daar pas na review naartoe.

## Projectstructuur

```text
Website/
├── public/                       # Alleen deze map wordt door de server aangeboden
│   ├── index.html                # Portfolio
│   ├── pages/
│   │   ├── games.html            # Speelveld
│   │   └── multiplayer.html      # Spellen voor twee spelers
│   └── assets/
│       ├── css/
│       │   ├── base.css          # Gedeelde stijl, navigatie en knoppen
│       │   └── pages/            # Stijl per pagina
│       ├── js/
│       │   ├── games/            # Memory en reactietest
│       │   └── multiplayer/      # Lobby, verbinding en interactieve borden
│       └── images/               # Afbeeldingen en favicon
├── server/                       # Spelregels, computerzoekalgoritmen, kamers en HTTP/SSE
├── tests/
│   ├── browser/                  # Functionele browsertests
│   └── server/                   # Spelregels en kamers testen
├── docs/                         # Architectuur en toekomstige ideeën
├── start.py                      # Lokale server
├── AGENTS.md                     # Werkafspraken voor code-assistenten
└── README.md
```

Zie [architectuur](docs/architecture.md) voor plaatsingsregels en [projectideeën](docs/roadmap.md) voor latere uitbreidingen.

## Op je eigen computer starten

Deze versie draait lokaal. Python 3 is nodig; er zijn geen extra packages, API-sleutels of buildstappen nodig.

1. Selecteer op GitHub de branch **dev**, download via **Code → Download ZIP** en pak uit. Of clone direct deze branch:

   ```sh
   git clone --branch dev https://github.com/olafheijl/Website.git
   cd Website
   ```

   Heb je al een lokale checkout? Stap dan over op dev:

   ```sh
   git fetch origin
   git switch dev
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

Lettertypen, stijlen en spelcode worden lokaal geladen. De beste reactietijd staat in `localStorage`. Het tabblad bewaart de toegang tot een spel in `sessionStorage`; borden en kamers staan alleen in het geheugen van de Python-server. Er zijn geen accounts, database, tracking of externe diensten.

## Met twee spelers spelen

Open het **Speelveld** en kies een van de nieuwe spellen, of ga direct naar **http://localhost:8000/pages/multiplayer.html**.

**Op één scherm (standaard):** kies een spel en klik op **Speel op één scherm**. Twee mensen plaatsen om de beurt een steen in dezelfde browser. De interface toont welke speler aan zet is. Na afloop kun je direct opnieuw spelen; de andere speler begint de volgende ronde.

**Tegen de computer:** kies een spel en klik op **Tegen de computer**. Jij bent speler 1, de computer is speler 2. De computer antwoordt automatisch. Tijdens **De computer denkt na…** kun je geen zet plaatsen, maar wel het spel verlaten. Na afloop start je direct een nieuwe ronde; wie begint wisselt per ronde. Herladen bewaart je bord en speelwijze zolang de server blijft draaien.

De computer kiest met spelalgoritmen in plaats van willekeurige zetten:

- **Boter, kaas en eieren:** rekent de volledige spelboom door en speelt optimaal; tegen deze computer kun je hooguit gelijkspelen.
- **4 op een rij:** kijkt meerdere zetten vooruit, kiest directe winst, blokkeert dreigingen en probeert sterke vervolgzetten op te bouwen.
- **Gomoku:** beoordeelt aanval en verdediging rond bestaande stenen, kijkt vooruit en zoekt onder meer naar dubbele dreigingen.

Voor de grotere borden is de zoektijd begrensd om de bediening vlot te houden. Deze tegenstanders zijn daarom niet onverslaanbaar. Alles wordt lokaal berekend; er zijn geen modeldownloads, AI-diensten of API-sleutels nodig.

**Met twee tabbladen of browsers:** open de optie voor een kamercode. Speler 1 maakt een kamer, speler 2 opent de multiplayerpagina in een ander tabblad of een andere browser op dezelfde computer en sluit aan met de code. Gebruik in beide browsers hetzelfde adres en dezelfde poort. Een kamer heeft precies twee plaatsen. Zetten verschijnen live op beide borden. Bij opnieuw spelen moeten beide spelers instemmen.

Spelregels:

- **Boter, kaas en eieren:** 3 × 3, drie dezelfde tekens op een rij.
- **4 op een rij:** 6 × 7, stenen vallen naar het laagste vrije vak in een kolom. Vier op een rij wint.
- **Gomoku:** plaats zwarte en witte stenen op de 15 × 15 kruispunten van het houten bord (14 × 14 vierkantjes). Coördinaten A–O en 15–1 helpen bij het aanwijzen van zetten. Een ringetje markeert de laatste zet; de winnende rij krijgt een goudkleurige rand. Vijf of meer op een rij wint (vrije variant, geen Renju-beperkingen). Veeg op kleine schermen horizontaal over het bord om de andere kolommen te zien.

Horizontaal, verticaal en diagonaal tellen. Een vol bord zonder winnaar is gelijkspel. Je kunt de borden bedienen met muis of toetsenbord: Tab, pijltjestoetsen en Enter/spatie. Voor 4 op een rij kies je een kolom met de knoppen boven het bord.

Herladen van hetzelfde tabblad behoudt je plek en bord zolang de server draait. Bij een verbroken liveverbinding pauzeert het spel; de browser probeert opnieuw te verbinden. Expliciet verlaten sluit de kamer voor beide spelers. Kamers vervallen na twee uur zonder spel- of verbindingsactiviteit en verdwijnen bij een serverherstart.

De server blijft uitsluitend bereikbaar op deze computer. Samen spelen vanaf twee verschillende apparaten of via internet is nog niet ingesteld.

Na een update: stop een nog draaiende server met **Ctrl+C**, haal de nieuwste `dev` op en start `python start.py` opnieuw. Zo wordt ook de nieuwe servercode geladen.

## GitHub is alleen de opslagplek

Voor lokaal draaien zijn GitHub Pages en toegang tot de GitHub-API niet nodig. Er wordt geen hosting of betaalde dienst ingesteld door deze code. Heb je Pages zelf al aangezet? Schakel die dan uit via **Settings → Pages → Unpublish site**. Deze repositorywijziging wijzigt geen instellingen op GitHub.

## Browsercontroles

In deze cloudomgeving zijn Playwright en Chromium beschikbaar:

```sh
python3 -m unittest discover -s tests/server -v
node --test tests/browser/website.test.cjs tests/browser/multiplayer.test.cjs
```

Op Windows gebruik je `python` in plaats van `python3` voor de servertests. De tests controleren spelregels, gelijktijdige zetten, kamers en herstarten van rondes. De computer wordt getest op winst, blokkeren, vooruitkijken, dubbele dreigingen en zoeklimieten. Voor Boter, kaas en eieren worden alle mogelijke menselijke vervolgzetten tegen de computer doorgelopen. De browser controleert ook automatische computerantwoorden, herladen en een nieuwe ronde met de computer als starter. Browsertests starten zelf `start.py` op een tijdelijke poort en controleren zowel de bestaande spellen als complete partijen van de drie nieuwe spellen op één scherm en met twee onafhankelijke browsersessies. Ook herladen, opnieuw spelen, mobiele weergave, afscherming van ontwikkelbestanden, ongeldige aanvragen en verbindingsverlies worden gecontroleerd. Buiten deze omgeving zijn Node.js, `playwright` en Chromium nodig; stel zo nodig `CHROMIUM_PATH` in op het browserpad. Deze hulpmiddelen zijn alleen nodig voor de tests, niet om de website te gebruiken.

## Verder bouwen

Elke pagina krijgt een eigen stylesheet en elke toepassing een eigen JavaScript-modulemap. De drie bordspellen delen een lobby en bordweergave; hun spelregels staan in `server/games.py` en de computerzoekalgoritmen in `server/computer.py`. Plannen voor een A*-visualizer en computer vision staan in `docs/roadmap.md`; die toepassingen zijn nog niet gebouwd.

Werk op `dev` en push met `git push origin dev`. Samenvoegen naar `main` gebeurt later via een pull request, na review. Een push naar `dev` publiceert de website niet.
