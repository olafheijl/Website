# Olaf — Portfolio & speelveld

Een Nederlandstalig portfolio (`index.html`) en twee browsergames (`games.html`): Memory en een reactietest met een lokaal bewaard persoonlijk record.

## Op je eigen computer starten

Deze versie draait lokaal. Python 3 is nodig; er zijn geen extra packages, API-sleutels of buildstappen nodig.

1. Download de repository via **Code → Download ZIP** en pak het ZIP-bestand uit. Of gebruik `git clone https://github.com/olafheijl/Website.git`. Heb je al een lokale checkout? Werk die bij met `git pull`.
2. Open een terminal in de map met `start.py`.
3. Start de server:

   **Windows:**
   ```sh
   py start.py
   ```

   **macOS / Linux:**
   ```sh
   python3 start.py
   ```

4. Open **http://localhost:8000** in de browser op dezelfde computer. Houd de terminal open. Stop de server met Ctrl+C.

De server luistert uitsluitend op `127.0.0.1`, dus niet op het lokale netwerk. Als poort 8000 bezet is, voeg dan `--port 8001` toe en open `http://localhost:8001`.

Wanneer je de server in de cloudomgeving start, draait hij op de cloudcomputer. Dat maakt hem niet bereikbaar via localhost op je eigen computer.

Lettertypen, stijlen en spelcode worden lokaal geladen. Alleen de beste reactietijd wordt in `localStorage` opgeslagen. Er is geen backend, tracking of gebruikersaccount.

## GitHub is alleen de opslagplek

Voor lokaal draaien zijn GitHub Pages en toegang tot de GitHub-API niet nodig. Er wordt geen hosting of betaalde dienst ingesteld door deze code. Heb je Pages zelf al aangezet? Schakel die dan uit via **Settings → Pages → Unpublish site**. Deze repositorywijziging wijzigt geen instellingen op GitHub.

## Browsercontroles

In deze cloudomgeving zijn Playwright en Chromium beschikbaar:

```sh
node --test tests/website.test.cjs
```

De tests starten zelf een tijdelijke HTTP-server en controleren navigatie, mobiele weergave, een volledig Memory-spel, resetten tijdens een beurt, te vroeg reageren, een geldige reactie en het bewaren van het record. Buiten deze omgeving zijn `playwright` en Chromium nodig; stel zo nodig `CHROMIUM_PATH` in op het browserpad.

## Verder bouwen

Teksten en projectkaarten staan in de HTML-bestanden, gedeelde vormgeving in `assets/style.css` en spelcode in `assets/games.js`. Het AI-project is voorlopig alleen een idee. Een chatbot of model kan later als aparte toepassing worden toegevoegd, met een eigen backend voor eventuele API-sleutels en expliciete keuzes over testgegevens.
