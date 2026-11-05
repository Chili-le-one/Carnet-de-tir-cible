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
| `core.js` | Constantes, utilitaires, règles de score, état, séances | 12 Ko |
| `saisie.js` | Saisie des flèches, cible tactile, page Saisie, modification d'une flèche, nouvelle séance, modèles, saisie rapide | 21 Ko |
| `outils.js` | Notes de séance, écran allumé, minuteur, loupe | 9 Ko |
| `bilan.js` | Bilan de séance, aide au viseur, image partagée, impression | 14 Ko |
| `stats.js` | Onglet Stats : filtres, objectif, records, régularité, volume | 20 Ko |
| `cartes.js` | Onglet Stats : carte des impacts, ellipse, cartographie par volée | 12 Ko |
| `historique.js` | Onglet Historique : liste et calendrier | 8 Ko |
| `sauvegarde.js` | Rappel, export/import, copies automatiques, partage | 11 Ko |
| `reglages.js` | Réglages : profil, préférences, matériel | 3 Ko |
| `ordre.js` | Version et ordre des blocs (mode Disposition) | 4 Ko |
| `actions.js` | Navigation entre onglets et table des boutons | 6 Ko |
| `events.js` | Écouteurs d'événements | 5 Ko |
| `main.js` | Démarrage | 2 Ko |

Les fichiers de `js/` sont des scripts classiques : ils partagent leurs variables et doivent rester dans l'ordre d'`index.html`.

## Pour une mise à jour
- **Numéro de version affiché** : `APP_VERSION` dans `js/actions.js`.
- **Après toute modification** : changer le numéro `carnet-tir-cible-vXX` dans `sw.js`, sinon le téléphone peut garder l'ancienne version.
- **Un nouveau texte à l'écran** : l'ajouter aussi dans `i18n.js` pour l'anglais.
- **Dans une demande, indiquer le ou les fichiers concernés** : seuls ceux-là sont relus et renvoyés.

## Pour les tests (dossier `dev/`, ne pas mettre en ligne)
`dev/build_test.py` assemble une page de test, puis `node dev/<test>.js` (jsdom et fake-indexeddb à installer avec `npm i`).
