# Architectuur

## Uitgangspunten

De website draait uitsluitend lokaal met Python 3 en gewone HTML, CSS en JavaScript. Er is geen framework, buildstap of externe dependency nodig. `server/` bevat een kleine backend voor de drie bordspellen: op één scherm, realtime met twee browsers en tegen de computer.

De browser krijgt alleen bestanden uit `public/`. `start.py`, tests, Git-metadata en documentatie blijven daarbuiten. Start de site vanuit de projectmap met `python start.py` op Windows of `python3 start.py` op macOS/Linux. De server bindt standaard aan `127.0.0.1`; met `--lan` aan `0.0.0.0` voor toegang vanaf apparaten op hetzelfde lokale netwerk. Hij vindt `public/` ook wanneer hij vanuit een andere werkmap wordt aangeroepen.

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
- `server/computer.py`: volledige minimax met memoization voor Boter, kaas en eieren; iteratief verdiepende alpha-beta-zoekalgoritmen voor 4 op een rij en Gomoku.
- `server/rooms.py`: twee spelers per livekamer, privétokens, één-schermmodus, rondes en opnieuw spelen. Een lock maakt aanvragen atomair. De ronde en het aantal zetten beschermen tegen dubbel verstuurde of verouderde zetten.
- `server/http.py`: JSON-acties via POST en live spelstatus via Server-Sent Events (SSE). Er is alleen verkeer tussen browser en lokale server. SSE gebruikt de browserfunctie EventSource voor herverbinden, zonder een extra WebSocket-package.
- `public/assets/js/multiplayer/connection.js`: aanvragen, EventSource en sessieopslag per tabblad.
- `public/assets/js/multiplayer/board.js`: toegankelijke borden, kolomknoppen en toetsenbordbediening.
- `public/assets/js/multiplayer/index.js`: lobby, één-schermmodus, kamerstatus en presentatie.

Op één scherm bedient dezelfde sessie beide spelers om de beurt. In een livekamer kan elk privétoken alleen voor zijn eigen speler zetten. De gedeelde status bevat geen tokens. Beide liveverbindingen moeten actief zijn voordat een zet wordt toegestaan. Expliciet verlaten sluit de kamer; een tijdelijk weggevallen verbinding behoudt de plaats en pauzeert het spel. Een nieuwe verbinding vervangt de oude zonder dat het sluiten van de oude verbinding de nieuwe offline markeert.

Kamers leven alleen in servergeheugen. Er is een limiet van 100 kamers; bij het aanmaken van een kamer worden kamers zonder activiteit gedurende twee uur opgeruimd. De pagina bewaart een token in sessionStorage om hetzelfde tabblad te kunnen herladen. Tokens in SSE-querystrings worden niet gelogd. POST-aanvragen vereisen JSON en staan geen afwijkende browser-Origin toe. Dit is een lokale ontwikkelserver, zonder internetpublicatie of accounts.

## Computertegenstanders

Een kamer met `mode: "computer"` heeft één menselijk token (speler 1) en een servergestuurde speler 2. Menselijke zetten tijdens de computerbeurt worden door de server geweigerd. Een computerpartij kan niet door een tweede mens worden overgenomen. Een rematch heeft alleen de instemming van de menselijke speler nodig; in ronde twee opent de computer zelf.

De server maakt een kopie van het bord, markeert `thinking` en rekent in een achtergrondthread. Het globale kamerlock wordt niet vastgehouden tijdens het zoeken. Voordat een resultaat wordt toegepast, worden kameridentiteit, gesloten status, ronde en aantal zetten gecontroleerd. Daardoor kan een late computerzet niet alsnog een verlaten partij veranderen. Herladen start geen tweede zoekopdracht. Een rekenfout wordt zichtbaar gemaakt en kan opnieuw geprobeerd worden zonder het bord te wissen.

De zoekalgoritmen gebruiken geen toeval. Boter, kaas en eieren doorzoekt alle mogelijke vervolgpartijen. De andere spellen zoeken standaard maximaal 0,65 seconde of 25.000 zoekknopen, tot zeven halve zetten bij 4 op een rij en vier bij Gomoku. Geforceerde verdedigingen kunnen de horizon verlengen. Na een limiet wordt het resultaat van de laatste volledig onderzochte diepte gebruikt.

Voor 4 op een rij worden alle legale kolommen onderzocht. Gomoku onderzoekt kruispunten binnen twee stappen van bestaande stenen, met maximaal zestien kandidaten aan de wortel en twaalf per verdere zoekknoop. Directe winst en directe blokkeerdreigingen worden vóór het beperken van kandidaten gecontroleerd. Scores gebruiken alle ononderbroken vensters van vier of vijf stenen; aantallen en scores worden bij het zoeken incrementeel bijgewerkt. De grotere spellen zijn begrensde heuristische zoekers en spelen niet gegarandeerd optimaal.

De servertests bewijzen voor Boter, kaas en eieren dat de computer als beide kleuren tegen iedere menselijke zettenreeks niet verliest. Voor de andere spellen zijn er tactische posities, een vooruitkijkval, dubbele dreigingen, een eenvoudige tegenstander, integriteitscontroles en limietcontroles. De browsertests controleren de menselijke beurt, automatische antwoorden, herladen, opnieuw spelen en het behouden van de scrollpositie.

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
