# Stringwalker — Journal des modifications

Calculateur de pianotage (string walking) pour l'arc barebow : palette ou gant, courbe polynôme, mode terrain, hors ligne.
Ancien nom : *Barebow Pianotage*.

Ce fichier suit le principe de [Keep a Changelog](https://keepachangelog.com/fr/) et le numéro de version `majeur.mineur.correctif`.
Pour publier une version : changer le numéro dans `index.html` (ligne `const INFO={version:…}`) **et** dans `version.json`, y ajouter les nouveautés (`notes`, en français et en anglais), puis redéployer. Les appareils qui ont une version plus ancienne affichent alors le popup de mise à jour.

Licence : CC BY-NC 4.0 (voir `LICENCE.txt`).

---

## [1.7.0] — 2026-10-24

### Ajouté
- **Sauvegarde et restauration par fichier** : « Sauvegarder (fichier) » télécharge `stringwalker-sauvegarde-AAAA-MM-JJ.json` (tous les profils, mesures et réglages). « Restaurer (fichier) » ouvre le sélecteur de fichiers, vérifie le contenu, affiche un résumé (profils, mesures) et demande confirmation avant de remplacer les données.
- **Export de l'aperçu des distances en image PNG** (page Palette ou Gant) : fond blanc, nom du profil, date, schéma de la corde, repère en gros et mm en petit.
- **Explications** en haut des onglets Calibrer et Mesures, et dans le guide : Mesures sert à saisir directement une position connue ; Calibrer part du calcul de l'appli et le corrige après les tirs.

### Modifié
- **Mode terrain** : boutons de distance **5, 10, 15, 20, 25, 30, 35, 40** et ajustement **− 1 m / + 1 m**. Montée, descente et pente sont inchangées.
- L'export CSV est maintenant un fichier à télécharger (`stringwalker-mesures-AAAA-MM-JJ.csv`) au lieu d'un texte à copier.
- Les anciennes sauvegardes en texte restent lisibles (à enregistrer dans un fichier `.json`).

---

## [1.6.0] — 2026-10-17

### Ajouté
- **Courbe polynôme** (méthode par défaut) : courbe « théorique » lissée, ajustée à l'ensemble des mesures (moindres carrés). Degré automatique (1 avec 2 mesures, 2 ensuite) ou choisi à la main (1, 2 ou 3).
- **Graphique théorique / réel** : courbe théorique en trait plein, courbe réelle (vos mesures) en pointillés, écart de chaque mesure en orange avec sa valeur, légende, « écart maximal ».
- Colonne **Écart** dans l'onglet Mesures.

### Modifié
- Les profils existants qui utilisaient la courbe monotone passent au polynôme (une seule fois). « Courbe monotone » et « Linéaire » restent disponibles dans Réglages.

---

## [1.5.0] — 2026-10-16

### Modifié
- **Nouveau nom : Stringwalker** et **nouveau logo** (en-tête, assistant de démarrage, icône d'installation, favicon, icône iPhone).
- Nouvelles icônes PNG (192 px, 512 px, version « maskable » pour Android, icône iPhone), l'ancienne icône SVG est supprimée.

---

## [1.4.1] — 2026-10-15

### Ajouté
- Auteur et **licence CC BY-NC 4.0** dans « Avertissements et mentions légales ». Fichier `LICENCE.txt` livré avec le site.

---

## [1.4.0] — 2026-10-15

### Modifié
- **Toutes les dimensions en mm sont arrondies à l'unité** : champs en nombres entiers, calculs, tableaux, schémas, calibration et corrections de pente.
- **Mode gant** : les doigts sont numérotés **1 à 4** et comptés à partir du zéro (avant le doigt 1). Entre le zéro et le doigt 1 : doigt 1 ; entre le doigt 1 et le doigt 2 : doigt 2 ; etc. Les repères « demi », « quart haut » et « quart bas » sont supprimés.
- Les distances des doigts doivent croître et ne peuvent pas laisser de doigt vide entre deux doigts renseignés.

---

## [1.3.1] — 2026-10-15

### Corrigé
- Le champ « Position (mm) » refusait certaines valeurs pré-remplies (par exemple 41,25), le navigateur affichant « Veuillez saisir une valeur valide ».
- Libellé de mi-chemin entre deux doigts plus clair. *(Remplacé par le comptage de la version 1.4.0.)*

---

## [1.3.0] — 2026-10-15

### Ajouté
- **Mode gant par doigts** : le gant n'a pas de coutures, l'appli demande la **distance de chaque doigt** (les doigts n'ont pas tous la même taille), obligatoire pour calculer.
- Repères en doigt, demi, quart haut et quart bas. Schéma du gant, page Gant, calibration par pas d'un quart d'écart. *(Simplifié en 1.4.0.)*

---

## [1.2.0] — 2026-10-15

### Ajouté
- **Choix de la protection des doigts par profil : palette ou gant**, dans Réglages et dans l'assistant de démarrage. L'onglet Palette devient « Gant » pour un profil au gant, avec le dessin des doigts sur la corde.

---

## [1.1.0] — 2026-10-15

### Ajouté
- **Guide d'utilisation** (9 sections, avec schéma de mesure des coutures), accessible depuis Réglages et l'assistant.
- **Bouton « Installer »** : barre en haut de l'écran, bouton dans Réglages et dans l'assistant ; mode d'emploi pour Android et iPhone quand l'installation directe n'est pas proposée.

---

## [1.0.0] — 2026-10-15

Première version numérotée, avec l'ensemble des fonctions suivantes.

### Calcul
- Calculateur de volée : distance → position (mm) et repère (couture), puces de distances mesurées, table de tir tous les 5 m.
- Interpolation par courbe monotone entre les mesures, extrapolation signalée au-delà de la plage mesurée.
- **Correction de pente** par niveaux (plat, faible, moyenne, forte) ou dénivelé estimé, montée ou descente, avec ajustement réglable.

### Mesure et réglage
- Calibration terrain (flèches trop hautes, trop basses, au centre ; pas d'une demi-couture) qui met à jour la mesure.
- Onglet Mesures : saisie, suppression, choix du repère dans la liste, export CSV, sauvegarde et restauration JSON.
- **Alertes de cohérence** (sens inversé, variation brutale, position hors règle) et **distances conseillées** pour calibrer.
- **Profils de matériel** (créer, dupliquer, supprimer), réglages des coutures (sens, positions, nombre).

### Affichage
- Schéma de la palette avec la position calculée, graphique distance → position, page Palette (aperçu de toutes les distances sur la corde, repère en gros et mm en petit).
- **Mode terrain** plein écran, gros boutons, écran maintenu allumé.
- Interface sobre (sombre ou claire selon l'appareil), **français et anglais**.

### Appli
- **Fonctionne hors ligne** (application web installable, service worker), état du cache visible dans Réglages.
- **Assistant de premier démarrage** (langue, avertissements à accepter, coutures, deux premières mesures), rejouable depuis Réglages.
- **Avertissements de sécurité et de responsabilité**, mentions sur les données personnelles (aucune donnée collectée).
- **Mises à jour** : vérification de `version.json`, popup avec les nouveautés (fermable pour ignorer), bouton de vérification manuelle.

---

## Idées pour les prochaines versions

- Niveaux de pente réglables par profil.
- Historique des calibrations (date, note, annulation de la dernière correction).
- Fiche de tir à imprimer en PDF.
- Pente apprise à partir des calibrations en montée et en descente.
- Mode terrain verrouillable contre les appuis accidentels.
- Lien avec le carnet de tir nature (repère affiché pour la distance de chaque cible).
