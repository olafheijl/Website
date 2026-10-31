# Ideeën voor later

Deze lijst onderscheidt wat al werkt van mogelijke vervolgstappen.

## Bordspellen: gerealiseerd

Boter, kaas en eieren, 4 op een rij en Gomoku werken met twee mensen op één scherm en met twee browsers via een kamercode. De Python-server controleert de spelregels en deelt de spelstatus realtime via SSE. Alles blijft op localhost.

Een volgende stap is spelen tegen de computer. Die tegenstanders zijn nog niet gebouwd. Samen spelen vanaf verschillende computers of via internet is ook nog niet ingesteld.

## Algorithm Visualizer

Een interactief raster waarop de gebruiker start, eindpunt en obstakels tekent. A* zoekt het kortste pad en toont bezochte cellen en het gevonden pad. Houd het algoritme apart van tekenen en bediening, bijvoorbeeld in `public/assets/js/visualizer/`. Dit kan volledig in de browser werken. Zinvolle controles zijn een bereikbaar pad, een geblokkeerd eindpunt en opnieuw zoeken na het aanpassen van obstakels.

## Computer-visionwebapp

Een afbeelding uploaden en objectherkenning, segmentatie of classificatie proberen. Kies eerst één taak en een geschikt model. Bepaal daarna of het model lokaal in de browser kan draaien of een lokale Python-service nodig heeft. De browsercode krijgt een eigen modulemap `public/assets/js/vision/`. Modeldownloads en eventuele Python-dependencies documenteren we wanneer een model gekozen is.

## AI en POCTconnect-userdesk

Ook eigen AI-modellen en een testchatbot voor de userdesk blijven mogelijke projecten. Beslis bij uitwerking welke testgegevens nodig zijn en hoe antwoorden worden gecontroleerd. API-sleutels horen in een toekomstige backend, buiten `public/`.
