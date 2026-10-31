# Architectuur

## Uitgangspunten

De website draait uitsluitend lokaal met Python 3 en gewone HTML, CSS en JavaScript. Er is geen framework, buildstap of externe dependency nodig. `server/` bevat een kleine backend voor de drie bordspellen, zowel op één scherm als realtime met twee browsers.

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
| Spelregels, kamers en HTTP/SSE-routes | `server/` |
| Tests voor spelregels en kamers | `tests/server/` |
| Architectuur, werkafspraken en ideeën | `docs/` |

`public/assets/js/games/index.js` start de twee spellen. `memory.js` en `reaction.js` exporteren elk een initialisatiefunctie; toestand en helpers blijven binnen hun eigen functie. Daardoor delen de spellen geen globale variabelen. Andere pagina's laden deze spelcode niet.

CSS wordt opgebouwd uit een gedeeld basisbestand en één bestand per pagina. Responsieve regels staan bij de bijbehorende stijlen. HTML, CSS en JavaScript zijn geformatteerd als leesbare bronbestanden.

## Bordspellen en realtime verbinding

- `server/games.py`: bordconfiguraties, beurtcontrole, geldige zetten, zwaartekracht, winst en gelijkspel. Python is de bron van waarheid; de browser beslist niet of een zet geldig is.
- `server/rooms.py`: twee spelers per livekamer, privétokens, één-schermmodus, rondes en opnieuw spelen. Een lock maakt aanvragen atomair. De ronde en het aantal zetten beschermen tegen dubbel verstuurde of verouderde zetten.
- `server/http.py`: JSON-acties via POST en live spelstatus via Server-Sent Events (SSE). Er is alleen verkeer tussen browser en lokale server. SSE gebruikt de browserfunctie EventSource voor herverbinden, zonder een extra WebSocket-package.
- `public/assets/js/multiplayer/connection.js`: aanvragen, EventSource en sessieopslag per tabblad.
- `public/assets/js/multiplayer/board.js`: toegankelijke borden, kolomknoppen en toetsenbordbediening.
- `public/assets/js/multiplayer/index.js`: lobby, één-schermmodus, kamerstatus en presentatie.

Op één scherm bedient dezelfde sessie beide spelers om de beurt. In een livekamer kan elk privétoken alleen voor zijn eigen speler zetten. De gedeelde status bevat geen tokens. Beide liveverbindingen moeten actief zijn voordat een zet wordt toegestaan. Expliciet verlaten sluit de kamer; een tijdelijk weggevallen verbinding behoudt de plaats en pauzeert het spel. Een nieuwe verbinding vervangt de oude zonder dat het sluiten van de oude verbinding de nieuwe offline markeert.

Kamers leven alleen in servergeheugen. Er is een limiet van 100 kamers; bij het aanmaken van een kamer worden kamers zonder activiteit gedurende twee uur opgeruimd. De pagina bewaart een token in sessionStorage om hetzelfde tabblad te kunnen herladen. Tokens in SSE-querystrings worden niet gelogd. POST-aanvragen vereisen JSON en staan geen afwijkende browser-Origin toe. Dit is een lokale ontwikkelserver, zonder internetpublicatie of accounts.

## Een toepassing toevoegen

Maak bijvoorbeeld `public/pages/visualizer.html`, `public/assets/css/pages/visualizer.css` en `public/assets/js/visualizer/index.js`. Gebruik `type="module"` om scripts te laden en imports om de toepassing op te splitsen. Vanuit pagina's in `pages/` verwijzen gedeelde bestanden met `../assets/` naar de assetsmap.

Voeg een link toe aan het portfolio of speelveld en een relevante browsertest. Maak pas extra mappen wanneer er echte bestanden nodig zijn. Nieuwe backendcode blijft in `server/`, buiten `public/`; bijbehorende tests staan in `tests/server/`.

## Branches

- `dev` (kleine letters) is de ontwikkelbranch.
- `main` is de stabiele versie en wordt alleen na expliciete toestemming bijgewerkt.
- Controleer voor werk en voor een push de actieve branch met `git branch --show-current`.
- Test wijzigingen op `dev`, commit ze en push met `git push origin dev`.
- Gebruik later een pull request van `dev` naar `main` om een versie te reviewen.

Lokaal starten en GitHub gebruiken als broncodeopslag vereisen geen GitHub Pages of GitHub-API-toegang.
