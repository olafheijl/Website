# Ideeën voor later

Deze lijst onderscheidt wat al werkt van mogelijke vervolgstappen.

## Bordspellen: gerealiseerd

Boter, kaas en eieren, 4 op een rij en Gomoku werken met twee mensen op één scherm, met twee browsers via een kamercode en tegen een computertegenstander. De Python-server controleert de spelregels, berekent computerzetten en deelt de spelstatus realtime via SSE. Alles blijft op localhost.

De computer gebruikt minimax of begrensd alpha-beta zoeken, met winst- en dreigingsherkenning. Samen spelen vanaf verschillende computers of via internet is nog niet ingesteld.

## Algorithm Visualizer

Een interactief raster waarop de gebruiker start, eindpunt en obstakels tekent. A* zoekt het kortste pad en toont bezochte cellen en het gevonden pad. Houd het algoritme apart van tekenen en bediening, bijvoorbeeld in `public/assets/js/visualizer/`. Dit kan volledig in de browser werken. Zinvolle controles zijn een bereikbaar pad, een geblokkeerd eindpunt en opnieuw zoeken na het aanpassen van obstakels.

## Computer-visionwebapp

Een afbeelding uploaden en objectherkenning, segmentatie of classificatie proberen. Kies eerst één taak en een geschikt model. Bepaal daarna of het model lokaal in de browser kan draaien of een lokale Python-service nodig heeft. De browsercode krijgt een eigen modulemap `public/assets/js/vision/`. Modeldownloads en eventuele Python-dependencies documenteren we wanneer een model gekozen is.

## AI en POCTconnect-userdesk

Ook eigen AI-modellen en een testchatbot voor de userdesk blijven mogelijke projecten. Beslis bij uitwerking welke testgegevens nodig zijn en hoe antwoorden worden gecontroleerd. API-sleutels horen in een toekomstige backend, buiten `public/`.
