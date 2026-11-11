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
| `core.js` | Constantes, utilitaires, règles de score (dont règle de la flèche sur la ligne), volées d'essai, état, séances | 14 Ko |
| `saisie.js` | Saisie des flèches (essais, numéro de flèche), cible tactile, page Saisie, modification d'une flèche, nouvelle séance, modèles, saisie rapide | 21 Ko |
| `outils.js` | Notes de séance, écran allumé, minuteur, loupe | 9 Ko |
| `bilan.js` | Bilan de séance, aide au viseur, image partagée, impression | 14 Ko |
| `stats.js` | Onglet Stats : filtres, objectif, records, régularité, numéros de flèches, volume, bilan du mois, comparaison de périodes | 30 Ko |
| `cartes.js` | Onglet Stats : carte des impacts, ellipse, cartographie par volée, comparaison de deux volées | 13 Ko |
| `historique.js` | Onglet Historique : liste et calendrier | 8 Ko |
| `concours.js` | Saisie d'un score de concours sans la cible : score final seul (`s.manual`) ou toutes les flèches au clavier | 7 Ko |
| `sauvegarde.js` | Rappel, export/import (séances + fiches), copies automatiques, partage | 11 Ko |
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
- Fiches : clé `carnet_tir_fiches` (non incluse dans l'export JSON des séances ; chaque séance garde sa copie).

## Données ajoutées en v25
- `config.arrowNums` : numéros de flèches utilisés pendant la séance (liste triée, ex. `[4, 8, 10]`) ; absent = tous les numéros de 1 à `quiverSize`. Dernière liste mémorisée sous la clé `carnet_tir_flechesjour`.

## Données ajoutées en v26
- Sauvegarde JSON : si des fiches existent, le fichier est un objet `{ app, sessions, sheets }` (sinon un simple tableau de séances, comme avant). L'import accepte les deux formats, et un objet ne contenant que `sheets`. Les copies automatiques (IndexedDB) ont un champ `sheets` en plus de `data`.
- Aucune nouvelle clé de stockage : le bilan du mois et la comparaison de périodes sont calculés à partir des séances.

## Données ajoutées en v27
- `s.contest = { name }` : séance saisie comme concours (fenêtre « Score de concours »). Le jour est aussi ajouté à `carnet_tir_concours` (étoile du calendrier).
- `s.manual = { total, tens, xs }` : concours saisi par son score final seul ; `s.ends` est alors vide et `sessionStats()` (core.js) lit ce total. Si les flèches sont saisies, la séance est une séance normale (`s.ends`).
