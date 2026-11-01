# Changelog — Carnet de Tir Cible

Historique des versions de l'application. Le numéro de version s'affiche dans **Réglages → Application**.
Les dates sont celles de la mise à disposition des fichiers.

**Fichiers de l'application :** `index.html`, `app.js`, `style.css`, `themes.css`, `i18n.js`, `sw.js`, `manifest.webmanifest` et trois icônes (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`).
À chaque mise à jour, le numéro de version de `sw.js` est augmenté pour que le téléphone recharge les fichiers.

---

## v22 — 30 octobre 2026
*Fichiers modifiés : `index.html`, `app.js`, `style.css`, `i18n.js`, `sw.js`.*

### Ajouts
- **Loupe sur la cible.** Pendant la visée au doigt, une bulle ronde affiche un zoom de la zone visée, avec le viseur au centre, la valeur de la zone et les flèches déjà posées. Elle se place au-dessus du viseur, ou sur le côté près du haut de l'écran, et disparaît au relâchement.
- **Réglages → Préférences** : interrupteur « Loupe sur la cible » et « Zoom de la loupe » (×2 à ×5, ×3 par défaut).

### Modifications
- **Saisie rapide adaptée à la taille de l'écran** (téléphone en portrait) : la page occupe exactement la hauteur disponible. Le score, la volée et les boutons tiennent sur une ligne, la volée en cours est resserrée, le minuteur et les boutons Clavier / Cible sont compacts, et le clavier ou la cible prend tout l'espace restant et se redimensionne. Sur un écran très petit, un défilement interne remplace le débordement.

### Corrections
- **Sélection de texte accidentelle bloquée** : plus de menu Copier / Tout sélectionner ni de menu d'appui long pendant la saisie, sauf dans les champs de saisie (notes, nom, texte collé) où l'on peut toujours écrire et coller.

---

## v21 — 29 octobre 2026
*Fichiers modifiés : `index.html`, `app.js`, `style.css`, `i18n.js`, `sw.js`.*

### Ajouts
- **Modèles de séance.** La liste « Mes modèles » remplace les formats rapides dans « Nouvelle séance » : un modèle se lance d'un seul toucher. Les quatre formats de départ en font partie.
- **Enregistrer comme modèle** : distance, blason, flèches par volée, nombre de volées, viseur, objectif et saisie rapide. Un nom déjà utilisé remplace l'ancien modèle.
- **Réglages → Modèles de séance** : réordonner, supprimer, rétablir les modèles de départ.
- **Objectif propre à la séance** (champ « Objectif de score »), qui n'écrase pas l'objectif défini dans Stats.
- **Saisie rapide.** Écran réduit pendant le tir : score et volée, cases de la volée, minuteur, boutons Clavier / Cible, et clavier ou cible qui occupe le reste de la hauteur. En-tête, notes et feuille de marque sont masqués. Un bouton bascule entre « Saisie rapide » et « Vue complète ».
- **Notes de fin de séance** : en saisie rapide, une fenêtre demande conditions, distance réelle, sensations et remarques avant le bilan (on peut passer).
- **Records par formats équivalents** : record personnel du format (même distance, même blason, même nombre de flèches), record par distance (meilleure moyenne par flèche, à partir de 30 flèches), record sur 30 et 60 flèches (meilleure série), meilleure volée. Annonce en fin de séance et liste dans Stats.

### Modifications
- **Vocabulaire de l'archerie.** Trois notions distinctes : **score**, **justesse** (écart entre le centre du groupement et le centre de la cible, en cm avec la direction) et **groupement** (rayon moyen autour du centre du groupement). La **régularité** désigne la stabilité d'une volée à l'autre. « Tendance » devient « Justesse » et « Dispersion moyenne » devient « Groupement » (bilan, Stats, tableau par volée, image partagée).
- **Ellipse** : méthode fixée (covariance d'échantillon, environ 2 flèches sur 3), affichée à partir de 9 flèches placées, estimation « provisoire » puis « fiable » à partir de 30 flèches. Ajoutée aussi au bilan de séance.
- **Fatigue → évolution observée** : comparaison du dernier tiers des volées au premier (6 volées minimum), avec un seuil de bruit (« pas d'évolution nette ») et la précision que la tendance décrit les données, pas leur cause.
- Traduction anglaise de tous les nouveaux textes.

---

## v20 — 27 octobre 2026
### Modifications
- **Sauvegarde simplifiée** : une seule carte avec deux gros boutons, **Sauvegarder** (partage du téléphone) et **Restaurer**.
- **Fenêtre Restaurer** : depuis un fichier de sauvegarde ou depuis une copie automatique.
- **Options avancées** (repliées) : rappel de sauvegarde, téléchargement automatique, export JSON et CSV, copie du texte, import de texte collé, suppression des copies automatiques.

---

## v19 — 26 octobre 2026
### Modifications
- **Minuteur indépendant des volées** : bloc à part, déplaçable dans Disposition, avec sa propre durée (2 minutes par défaut, de 0:20 à 5:00 au choix dans le bloc ou en secondes dans Réglages).
- Plus de remise à zéro quand une volée est complète (le score se saisit après la volée).
- Bouton **Masquer** dans le bloc ; réaffichage par Réglages ou par le mode Disposition.

---

## v18 — 26 octobre 2026
### Ajouts
- **Copies de sécurité automatiques** (IndexedDB) : une par jour, une à la fin de chaque séance, une avant toute suppression ou import ; les 8 dernières sont gardées et restaurables. Demande de stockage persistant au navigateur.
- **Téléchargement automatique** facultatif d'un fichier de sauvegarde à la fin de chaque séance (absent sur iPhone).
- **Minuteur de volée** (première version, durée par flèche), sons et vibrations à 30 secondes et à la fin.
- **Calendrier d'assiduité** (onglet Historique) : jours colorés selon le nombre de flèches, **jours de concours** ★ avec nom facultatif, prochains concours, étiquette « ★ Concours » dans l'historique.
- **Partager l'application** : bouton dans Réglages (partage du téléphone, ou copie du lien).

---

## v17 — 20 octobre 2026
### Ajouts
- **Avec ou sans viseur** dans « Nouvelle séance », mémorisé pour la séance suivante. Sans viseur, l'aide au réglage disparaît ; la mention « sans viseur » apparaît dans l'historique.

---

## v16 — 20 octobre 2026
### Modifications
- **Boutons Clavier / Cible séparés** de la saisie : nouveau bloc déplaçable indépendamment dans Disposition. L'ancien ordre enregistré est conservé.

---

## v15 — 20 octobre 2026
### Corrections
- Le service worker n'échoue plus en bloc si un fichier manque (une page sans style venait d'un `style.css` non mis en ligne).
- Dossier complet `carnet-tir-cible-complet.zip` pour mettre en ligne tous les fichiers d'un coup.

---

## v14 — 20 octobre 2026
### Modifications
- **Thème d'origine** rendu visible dans Réglages : « Thème d'origine (clair ou nuit selon le téléphone) », « Clair (d'origine) », « Nuit (d'origine) » et « Carnet de terrain ».

---

## v13 — 20 octobre 2026
### Modifications
- Traduction anglaise des textes de la personnalisation de l'ordre, de la version et des pastilles de volée.
- Titre du partage de la sauvegarde traduit.

---

## v12 — 20 octobre 2026
### Ajouts
- **Personnalisation de l'ordre des blocs** : Réglages → Disposition → « Page Saisie » et « Page Stats », avec des flèches ↑ ↓ sur chaque bloc ; bouton « Rétablir l'ordre par défaut ».
### Modifications
- **Découpage en fichiers** : la logique passe dans `app.js` et le style dans `style.css`, `index.html` devient léger.

---

## v11 — 20 octobre 2026
### Modifications
- Règles des thèmes déplacées dans `themes.css`.

---

## v10 — 20 octobre 2026
### Ajouts
- **Version anglaise** : traduction dans `i18n.js`. La langue est automatique (français sur un téléphone en français, anglais sur tous les autres) ; sélecteur « Langue / Language » dans Réglages.
- Dates, séparateurs et décimales de l'export CSV adaptés à la langue.
### Corrections
- Le partage de l'image du bilan appelait une fonction de traduction manquante.

---

## Avant v10 — du 13 au 19 octobre 2026
Reprise complète de l'application d'origine, renommée **Carnet de Tir Cible**, en un fichier autonome (sans bibliothèque externe, utilisable hors ligne). Principales étapes :

### Saisie et séance
- Saisie par **clavier** (X, 10 à 1, M) ou par **cible tactile** : le viseur est décalé au-dessus du doigt, on glisse pour viser et la flèche est validée au relâchement ; bouton **Annuler** pour retirer la dernière flèche.
- Cible Trispot (zones 10 à 5), blasons de 40 à 120 cm, **format libre** de 1 à 12 flèches par volée.
- Reprise automatique de la séance en cours, fin de séance anticipée, séance rouverte pour correction, **correction d'une flèche précise** (nouvelle valeur ou nouvelle position).
- Fenêtres de confirmation intégrées à la page (les confirmations natives étaient bloquées dans certains navigateurs).

### Bilan et statistiques
- Bilan de séance avec carte des impacts, tendance et dispersion, aide au **réglage du viseur** en clics, **partage du bilan en image**, **impression en PDF**.
- Onglet Stats : chiffres clés, évolution, répartition, **carte des impacts** (densité ou points, période au choix, point moyen, ellipse), **cartographie par volée** (un point moyen par volée), régularité par volée, records par format, **volume d'entraînement** et objectif hebdomadaire.
- **Objectif** de score avec **projection sur 60 flèches** (une séance plus courte est ramenée à 60 flèches).
- **Journal du matériel** repéré sur la courbe d'évolution.

### Données et confort
- **Profil de tir** (archer, arc, type d'arc), **notes de séance** (conditions, distance réelle, sensations, remarques).
- Historique avec consultation et suppression ; **exports** JSON et CSV, **import** (fichier ou texte collé), rappel de sauvegarde.
- **Application installable** (hors ligne, icône, plein écran), écran toujours allumé pendant une séance, bouton « Mettre à jour l'application ».
- **Thèmes** (Carnet de terrain par défaut, Clair, Nuit, Automatique).

---

## Pistes envisagées (non réalisées)
- Mode « réglage fin » de la loupe (le viseur bouge moins vite que le doigt).
- Détection des tirs et estimation de la vitesse des flèches avec le micro d'une oreillette Bluetooth.
- QR code pour faire connaître l'application.
- Séance de groupement sans score, comparaison de deux périodes, séance en plusieurs distances.
- Raccourci sur l'icône (« Nouvelle séance »), taille du texte réglable.
- Thème « Plein soleil » (contraste maximal), approuvé mais mis de côté.
