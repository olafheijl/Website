# Architectuur

## Uitgangspunten

De website draait uitsluitend lokaal met Python 3 en gewone HTML, CSS en JavaScript. Er is nog geen framework, buildstap of backend. Die voegen we pas toe als een concrete toepassing ze nodig heeft.

De browser krijgt alleen bestanden uit `public/`. `start.py`, tests, Git-metadata en documentatie blijven daarbuiten. Start de site vanuit de projectmap met `python start.py` op Windows of `python3 start.py` op macOS/Linux. De server bindt alleen aan `127.0.0.1` en vindt `public/` ook wanneer hij vanuit een andere werkmap wordt aangeroepen.

## Waar hoort een wijziging?

| Onderdeel | Locatie |
| --- | --- |
| Portfolio en projectkaarten | `public/index.html` |
| Overige pagina's | `public/pages/` |
| Gedeelde kleuren, typografie, navigatie en knoppen | `public/assets/css/base.css` |
| Stijl voor een enkele pagina | `public/assets/css/pages/<pagina>.css` |
| Scripts van een toepassing | `public/assets/js/<toepassing>/` |
| Afbeeldingen en iconen | `public/assets/images/` |
| Functionele browsertests | `tests/browser/` |
| Architectuur, werkafspraken en ideeën | `docs/` |

`public/assets/js/games/index.js` start de twee spellen. `memory.js` en `reaction.js` exporteren elk een initialisatiefunctie; toestand en helpers blijven binnen hun eigen functie. Daardoor delen de spellen geen globale variabelen. Andere pagina's laden deze spelcode niet.

CSS wordt opgebouwd uit een gedeeld basisbestand en één bestand per pagina. Responsieve regels staan bij de bijbehorende stijlen. HTML, CSS en JavaScript zijn geformatteerd als leesbare bronbestanden.

## Een toepassing toevoegen

Maak bijvoorbeeld `public/pages/visualizer.html`, `public/assets/css/pages/visualizer.css` en `public/assets/js/visualizer/index.js`. Gebruik `type="module"` om scripts te laden en imports om de toepassing op te splitsen. Vanuit pagina's in `pages/` verwijzen gedeelde bestanden met `../assets/` naar de assetsmap.

Voeg een link toe aan het portfolio en een relevante browsertest. Maak pas extra mappen wanneer er echte bestanden nodig zijn. Een toekomstige Python- of WebSocket-backend komt buiten `public/`, bijvoorbeeld in `server/`; tests daarvoor krijgen een eigen map onder `tests/`.

## Branches

- `Dev` (met hoofdletter D) is de ontwikkelbranch.
- `main` is de stabiele versie en wordt alleen na expliciete toestemming bijgewerkt.
- Controleer voor werk en voor een push de actieve branch met `git branch --show-current`.
- Test wijzigingen op `Dev`, commit ze en push met `git push origin Dev`.
- Gebruik later een pull request van `Dev` naar `main` om een versie te reviewen.

Lokaal starten en GitHub gebruiken als broncodeopslag vereisen geen GitHub Pages of GitHub-API-toegang.
