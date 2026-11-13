# Carnet de Tir Cible — où se trouve quoi

Aucun fichier n'a besoin d'être compilé : on met tout le dossier en ligne tel quel.

## Fichiers
| Fichier | Contenu | Taille |
|---|---|---|
| `index.html` | Structure des pages et des fenêtres (textes en français) | 27 Ko |
| `style.css` | Mise en page et saisie rapide | 20 Ko |
| `themes.css` | Couleurs des thèmes | 2 Ko |
| `i18n.js` | Traduction anglaise (dictionnaire) | 41 Ko |
| `sw.js` | Mode hors ligne et mises à jour | 2 Ko |
| `manifest.webmanifest`, `icon-*.png`, `apple-touch-icon.png` | Installation sur l'écran d'accueil | |

## Dossier `js/` (la logique, un fichier par rôle)
| Fichier | Contenu | Taille |
|---|---|---|
| `core.js` | Constantes (dont `KEYS`), utilitaires, règles de score (dont règle de la flèche sur la ligne), volées d'essai, état, séances | 15 Ko |
| `saisie.js` | Saisie des flèches (essais, numéro de flèche), cible tactile, page Saisie, modification d'une flèche, nouvelle séance, modèles, saisie rapide | 21 Ko |
| `outils.js` | Notes de séance, écran allumé, minuteur, loupe | 9 Ko |
| `bilan.js` | Bilan de séance, aide au viseur, image partagée, impression | 14 Ko |
| `stats.js` | Onglet Stats : filtres, objectif, records, régularité, numéros de flèches, volume, bilan du mois, comparaison de périodes | 30 Ko |
| `cartes.js` | Onglet Stats : carte des impacts, ellipse, cartographie par volée, comparaison de deux volées | 13 Ko |
| `historique.js` | Onglet Historique : liste, calendrier, volumes de flèches sans score (`volumes()`, `volAdd`, `volDel`, `mergeVolumes`) | 11 Ko |
| `concours.js` | Saisie d'un score de concours sans la cible : score final seul (`s.manual`) ou toutes les flèches au clavier | 7 Ko |
| `sauvegarde.js` | Rappel, export/import (séances + fiches + volumes), copies automatiques, partage | 12 Ko |
| `qr.js` | Générateur de QR code (hors ligne) et fenêtre « QR code de l'application » | 8 Ko |
| `reglages.js` | Réglages : profil, préférences, matériel | 3 Ko |
| `fiches.js` | Fiches de réglage par arc : variantes datées, choix à la nouvelle séance, fusion à l'import | 8 Ko |
| `ordre.js` | Version et ordre des blocs (mode Disposition) | 4 Ko |
| `actions.js` | Navigation entre onglets et table des boutons | 6 Ko |
| `ui.js` | Bouton « i » (explications `.hint` d'une carte) et cartes dépliables de l'onglet Stats | 3 Ko |
| `events.js` | Écouteurs d'événements | 5 Ko |
| `main.js` | Démarrage | 2 Ko |

Les fichiers de `js/` sont des scripts classiques : ils partagent leurs variables et doivent rester dans l'ordre d'`index.html`.

## Pour une mise à jour
- **Numéro de version affiché** : `APP_VERSION` dans `js/actions.js`.
- **Après toute modification** : changer le numéro `carnet-tir-cible-vXX` dans `sw.js`, sinon le téléphone peut garder l'ancienne version.
- **Un nouveau texte à l'écran** : l'ajouter aussi dans `i18n.js` pour l'anglais.
- **Dans une demande, indiquer le ou les fichiers concernés** : seuls ceux-là sont relus et renvoyés.

## Historique des versions
- **v33 (13 nov. 2026)** : refonte de l'aspect, étape 2 (thème « Épuré », inclut la v32). Stats : « Filtrer l'analyse » devient une carte dépliable (`<details>` dans `index.html`) ; chiffres clés sur 3 colonnes sans cadre. Historique : lignes plus compactes, pastilles sans fond. Fichiers modifiés : `themes.css`, `index.html`, `js/actions.js`, `sw.js`, `STRUCTURE.md`.
- **v32 (13 nov. 2026)** : refonte de l'aspect, étape 1. Nouveau thème « Épuré » (`themes.css`, `data-theme="epure"`) : fond uni, cartes sans cadre avec séparateur fin, une seule couleur d'accent, onglets simplifiés ; à choisir dans Réglages > Préférences (le thème par défaut reste « Carnet de terrain »). Saisie : « Saisie rapide » et « Terminer » regroupés dans `<details class="opts">` « Options ⋯ » (`index.html`). Fichiers modifiés : `themes.css`, `index.html`, `js/actions.js`, `sw.js`. Étape 2 à venir : Historique et Stats.
- **v31 (12 nov. 2026)** : volumes de flèches sans score (la v30, jamais installée, est incluse). Dans le calendrier de l'Historique, le jour choisi permet d'ajouter un nombre de flèches (1 à 5000) avec une note facultative, et de le retirer. Compté dans le calendrier, le bloc Volume d'entraînement des Stats et l'objectif de la semaine ; jamais dans les scores, moyennes ni records. Inclus dans l'export/import JSON, les copies automatiques et l'effacement total. Fichiers modifiés : `core.js`, `historique.js`, `stats.js`, `actions.js`, `sauvegarde.js`, `sw.js`. Textes anglais à ajouter dans `i18n.js` (non fait).
- **v29 (11 nov. 2026)** : refonte de l'interface. Bande du haut supprimée (« Nouvelle séance » dans l'onglet Saisie) ; bouton « i » pour les explications ; Stats en cartes repliables ; Historique avec séances et calendrier réductibles (« Tout réduire / Tout déplier ») ; Réglages en 9 sous-menus. Nouveau fichier `js/ui.js`.
- **v28** : cache `carnet-tir-cible-v28` (numéro affiché resté à v27). Contenu à compléter : je n'ai pas le détail de cette version.
- v24 à v27 : voir « Données ajoutées » plus bas.

## Interface (v29)
- Une explication longue se marque `class="muted hint"` : elle est masquée et un bouton « i » apparaît à côté du titre de la carte (`ui.js`, automatique).
- Stats : toutes les cartes (sauf Évolution et Objectif, `data-fold="open"`) sont repliées au départ ; on touche le titre pour déplier.
- Réglages : chaque carte est un `<details class="card chev set-sec" name="set">` (un seul ouvert à la fois). Historique : séances et calendrier en `<details>`.

## Pour les tests (dossier `dev/`, ne pas mettre en ligne)
`dev/build_test.py` assemble une page de test, puis `node dev/<test>.js` (jsdom et fake-indexeddb à installer avec `npm i`).

## Données ajoutées en v24
- `s.trial` : volées d'essai (à part de `s.ends`, donc jamais comptées) ; `config.trialEnds` = leur nombre. `currentEndIndex` est un rang global (essais d'abord).
- `a.n` : numéro de la flèche ; `config.trackNums` active le suivi.
- `s.setup` : copie de la variante de fiche liée à la séance ; `config.arrowMm` : diamètre des flèches (règle de la ligne, dans `face()` / `zoneAt()`).
- Fiches : clé `carnet_tir_fiches` (incluses dans l'export JSON et les copies automatiques ; chaque séance garde aussi sa copie).
- Volumes : clé `carnet_tir_volumes` = liste de `{ id, date: 'AAAA-MM-JJ', arrows, note }`. Hors de `app.sessions` : aucun effet sur `sessionStats()`, les scores ni les records. Lus partout par `volumes()` (historique.js).

## Données ajoutées en v25
- `config.arrowNums` : numéros de flèches utilisés pendant la séance (liste triée, ex. `[4, 8, 10]`) ; absent = tous les numéros de 1 à `quiverSize`. Dernière liste mémorisée sous la clé `carnet_tir_flechesjour`.

## Données ajoutées en v26
- Sauvegarde JSON : si des fiches existent, le fichier est un objet `{ app, sessions, sheets }` (sinon un simple tableau de séances, comme avant). L'import accepte les deux formats, et un objet ne contenant que `sheets`. Les copies automatiques (IndexedDB) ont un champ `sheets` en plus de `data`.
- Aucune nouvelle clé de stockage : le bilan du mois et la comparaison de périodes sont calculés à partir des séances.

## Données ajoutées en v27
- `s.contest = { name }` : séance saisie comme concours (fenêtre « Score de concours »). Le jour est aussi ajouté à `carnet_tir_concours` (étoile du calendrier).
- `s.manual = { total, tens, xs }` : concours saisi par son score final seul ; `s.ends` est alors vide et `sessionStats()` (core.js) lit ce total. Si les flèches sont saisies, la séance est une séance normale (`s.ends`).
