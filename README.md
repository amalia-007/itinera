# Itinera — moteur de découverte de voyage

Donnez une ville de départ (+ envies), Itinera classe des destinations par
**prix de vol estimé**, compare le **coût de la vie** et indique **quand acheter**.
Si vous donnez aussi une ville d'arrivée, il propose les **meilleures escales**
sur la route.

## Lancer

```bash
npm install
npm run dev          # http://localhost:3000  (Next.js 16, Turbopack)
```

## Ce qui est RÉEL vs ESTIMÉ (transparence)

| Donnée | Source | Statut |
|---|---|---|
| Géocodage des villes | Open-Meteo Geocoding API | ✅ réel, sans clé |
| Climat / saison par mois | Archétypes climatologiques calibrés | ✅ modèle réaliste |
| Prix de vol (A/R, aller) | Modèle distance great-circle calibré | ⚠️ **estimation** (pas un tarif live) |
| Coût de la vie / jour | Index par ville/pays (base 100 = NYC) | ⚠️ ordre de grandeur |
| Bons plans / points | Conseils éditoriaux vérifiés | ✅ honnête (aucun faux code promo) |

> Règle du projet : **aucune donnée inventée n'est présentée comme un tarif
> réservable.** Les estimations sont étiquetées « estim. » dans l'UI.

## Architecture

```
src/
  data/destinations.ts   Catalogue de ~50 destinations (coords, coût, climat, vibes)
  lib/
    geocode.ts           Open-Meteo (serveur)
    geo.ts               Distance haversine
    climate.ts           Archétypes climat → température par mois + matching
    flights.ts           Estimateur de prix + meilleur moment pour acheter
    costOfLiving.ts      Budget/jour + ratio vs ville de départ
    scoring.ts           Classement pondéré (météo, vibes, budget, ambiance)
    stops.ts             Escales sur le corridor départ→arrivée (portion médiane)
  app/api/discover/route.ts   POST : géocode + classe + suggère escales
  components/            SearchForm, ResultCard, DealsGuide, Flag
  app/page.tsx           UI (client) : formulaire, résultats, tri, guide
```

Brancher un fournisseur de prix live (Amadeus self-service) = remplacer
`estimateFlight()` dans `src/lib/flights.ts` par un appel API de même signature.

## Prochaines étapes (parcours A → Z)

- Logements (filtres piscine, hostel, Airbnb, pet-sitting…)
- Activités + barre de recherche
- Infos pratiques sur place (SIM/eSIM, assurance, retrait d'espèces, applis)
- Vols **live** via Amadeus, comptes & voyages sauvegardés (Supabase)
