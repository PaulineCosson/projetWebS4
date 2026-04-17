# Projet Web S4 - Meteo des plages

**Date :** 2026 **Auteur :** Pauline Cosson - **IMAC**

## Présentation du projet

Application front-end realisee avec Vue 3 et Vite, sous forme de Single Page Application. Ce projet a été réalisé dans le cadre du cours de Programmation Web 3 encadré par M. Libert.

Le projet permet de rechercher des plages autour d'une ville, consulter leur meteo, afficher les previsions sur 7 jours et gérer une liste de favoris persistante.

Je fais beaucoup de voile et j'ai tout de suite pensé à créer un site web qui permet de trouver les meilleures plages pour naviguer. Les différentes données mises en avant reflètent mes besoin quand je fais de la voile.

## Fonctionnalites principales

- Recherche d'une ville et geolocalisation via API.
- Affichage des plages autour de la ville sur une carte interactive (Leaflet).
- Ajustement du rayon de recherche avec un slider.
- Consultation de la meteo du jour pour chaque plage.
- Ecran de details avec previsions meteo decoupees par moments de la journee sur 7 jours.
- Gestion des favoris (ajout/suppression) avec sauvegarde locale.
- Tri et filtrage des favoris (vent, temperature, plages ensoleillees).
- Navigation multi-vues (carte, favoris, details) via Vue Router.
- Interface responsive desktop/mobile.

## Stack technique

- Vue 3
- Vite
- Vue Router
- Axios
- Leaflet
- Open Meteo

## Installation

```bash
npm install
```

## Lancer en developpement

```bash
npm run dev
```

## Build production

```bash
npm run build
```

## Verification / Qualite

```bash
npm run lint
```

## Apercu des scripts disponibles

- `npm run dev` : demarre le serveur de developpement.
- `npm run build` : genere la version de production.
- `npm run preview` : previsualise le build.
- `npm run lint` : verifie et corrige le code avec ESLint.
- `npm run format` : formate les fichiers source avec Prettier.
