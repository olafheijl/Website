# Ideeën voor later

Deze lijst beschrijft mogelijke uitbreidingen. De huidige wijziging ordent alleen het bestaande portfolio en de twee spellen; onderstaande functies zijn nog niet geïmplementeerd.

## Realtime multiplayer-minigame

Een klein spel met twee spelers die dezelfde spelstatus zien. Begin met een lokale lobby en een eenvoudige spelregel. Een volgende stap kan een WebSocket-server in `server/` zijn, met bijbehorende browsercode onder `public/assets/js/multiplayer/`. Bepaal dan hoe spelers verbinden en hoe de server spelacties controleert.

## Algorithm Visualizer

Een interactief raster waarop de gebruiker start, eindpunt en obstakels tekent. A* zoekt het kortste pad en toont bezochte cellen en het gevonden pad. Houd het algoritme apart van tekenen en bediening, bijvoorbeeld in `public/assets/js/visualizer/`. Dit kan volledig in de browser werken. Zinvolle controles zijn een bereikbaar pad, een geblokkeerd eindpunt en opnieuw zoeken na het aanpassen van obstakels.

## Computer-visionwebapp

Een afbeelding uploaden en objectherkenning, segmentatie of classificatie proberen. Kies eerst één taak en een geschikt model. Bepaal daarna of het model lokaal in de browser kan draaien of een lokale Python-service nodig heeft. De browsercode krijgt een eigen modulemap `public/assets/js/vision/`. Modeldownloads en eventuele Python-dependencies documenteren we wanneer een model gekozen is.

## AI en POCTconnect-userdesk

Ook eigen AI-modellen en een testchatbot voor de userdesk blijven mogelijke projecten. Beslis bij uitwerking welke testgegevens nodig zijn en hoe antwoorden worden gecontroleerd. API-sleutels horen in een toekomstige backend, buiten `public/`.
