# Werkafspraken

- Werk standaard op de branch `dev` (kleine letters). Controleer de branch voor edits en pushes. Push of merge niet naar `main` zonder expliciet verzoek.
- Gebruik de bestaande checkout. Maak geen extra worktree tenzij de gebruiker daarom vraagt.
- De website blijft voorlopig uitsluitend lokaal draaien. Configureer of publiceer geen hosting zonder verzoek.
- Alleen `public/` wordt geserveerd. Houd scripts voor ontwikkeling, tests, documentatie en toekomstige backendcode daarbuiten.
- Houd gedeelde CSS in `public/assets/css/base.css`, paginastijlen in `public/assets/css/pages/` en JavaScript-modules per toepassing in `public/assets/js/`.
- Start lokaal met `python3 start.py` (Windows: `python start.py`). Gebruik de browser via de server, niet via `file://`.
- Controleer serverwijzigingen met `python3 -m unittest discover -s tests/server -v` en de browser met `node --test tests/browser/website.test.cjs tests/browser/multiplayer.test.cjs`. Hiervoor zijn Playwright en Chromium beschikbaar in de cloudomgeving; de tests starten zelf de server.
- De spellen voor twee spelers ondersteunen één scherm (standaard) en twee lokale browsers via kamercodes. De Python-code in `server/` bepaalt spelregels en kamerstatus. Voeg geen computertegenstanders toe zonder verzoek.
- `docs/roadmap.md` bevat ideeën, geen opdracht om die alvast te implementeren.
