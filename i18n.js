/* ===== Langue : français par défaut, anglais automatique si le téléphone n'est pas en français ===== */
(function () {
  'use strict';
  var pref = 'auto';
  try { var p = JSON.parse(localStorage.getItem('carnet_tir_prefs') || 'null'); if (p && p.lang) pref = p.lang; } catch (e) {}
  var nav = (navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language) || 'fr';
  var lang = (pref === 'fr' || pref === 'en') ? pref : (/^fr/i.test(nav) ? 'fr' : 'en');
  window.__LANG = lang;
  window.__LOCALE = lang === 'fr' ? 'fr-FR' : 'en-GB';
  document.documentElement.lang = lang;
  window.t = function (s) { return s; };
  if (lang === 'fr') return;

  var EXACT = {
    "5 à 1": "5 to 1",
    "Thème": "Theme", "Carnet de terrain (papier, encre bleue)": "Field notebook (paper, blue ink)",
    "Thème d'origine (clair ou nuit selon le téléphone)": "Original theme (light or dark, following the phone)",
    "Clair (d'origine)": "Light (original)", "Nuit (d'origine)": "Night (original)",
    "Chiffres clés": "Key figures", "Disposition": "Layout", "Résumé": "Summary", "Régularité": "Consistency", "Répartition": "Distribution",
    "Boutons Clavier / Cible": "Keypad / Target buttons", "Saisie des flèches": "Arrow entry", "Volée en cours": "Current end", "Page Saisie": "Scoring page", "Page Stats": "Stats page",
    "Choisissez l'ordre des fenêtres de chaque page avec les flèches ↑ ↓.": "Choose the order of the blocks on each page with the ↑ ↓ arrows.",
    "Rétablir l'ordre par défaut": "Restore default order", "Ordre par défaut rétabli.": "Default order restored.",
    "Touchez ↑ ↓ pour déplacer les fenêtres": "Tap ↑ ↓ to move the blocks", "Rétablir": "Reset", "Terminé": "Done",
    "Monter": "Move up", "Descendre": "Move down",
    "Démarrez ou ouvrez une séance pour réorganiser la page Saisie.": "Start or open a session to reorder the Scoring page.",
    "Terminez une séance pour réorganiser la page Stats.": "Finish a session to reorder the Stats page.",
    "Distance réelle :": "Actual distance:", "relâchez pour valider": "release to confirm",
    "Sauvegarde Carnet de Tir Cible": "Target Archery Logbook backup",
    "Viseur": "Sight", "Avec viseur": "With sight", "Sans viseur": "Without sight", "sans viseur": "no sight",
    "Aucune séance ce jour.": "No session on this day.", "Concours ajouté.": "Contest added.", "Concours retiré.": "Contest removed.",
    "Concours": "Contest", "★ Concours": "★ Contest", "Jour de concours": "Contest day", "★ jour de concours": "★ contest day",
    "★ Marquer comme jour de concours": "★ Mark as contest day", "Nom du concours (facultatif)": "Contest name (optional)",
    "Prochains concours": "Upcoming contests", "Mois précédent": "Previous month", "Mois suivant": "Next month",
    "aujourd'hui": "today", "demain": "tomorrow",
    "Copie restaurée.": "Copy restored.", "Copie illisible.": "Unreadable copy.", "Restaurer": "Restore", "Retirer": "Remove",
    "Supprimer les copies": "Delete the copies", "Supprimer toutes les copies automatiques de cet appareil ?": "Delete all automatic copies on this device?",
    "Sauvegarde automatique": "Automatic backup",
    "L'appli garde seule des copies de sécurité sur l'appareil : une par jour, une à la fin de chaque séance et une avant toute suppression (les 8 dernières). Elles permettent de récupérer une séance supprimée par erreur.": "The app keeps safety copies on the device by itself: one per day, one at the end of each session and one before any deletion (the last 8). They let you recover a session deleted by mistake.",
    "Enregistrer aussi un fichier dans les téléchargements à la fin de chaque séance": "Also save a file to the downloads at the end of each session",
    "Une appli web ne peut pas envoyer seule vos données vers un cloud : le fichier reste sur le téléphone. S'il est synchronisé (Google Drive, Syncthing…), il vous protège aussi si le téléphone est perdu.": "A web app cannot send your data to a cloud on its own: the file stays on the phone. If it is synced (Google Drive, Syncthing…), it also protects you if the phone is lost.",
    "Aucune copie pour l'instant : la première est faite à la fin de votre prochaine séance.": "No copy yet: the first one is made at the end of your next session.",
    "quotidienne": "daily", "fin de séance": "end of session", "avant suppression": "before deletion", "avant import": "before import",
    "avant effacement total": "before full erase", "avant restauration": "before restoring",
    "Minuteur de volée": "End timer", "Durée par flèche (secondes)": "Time per arrow (seconds)", "Sons et vibration du minuteur": "Timer sounds and vibration",
    "Réinitialiser le minuteur": "Reset the timer", "Démarrer": "Start", "Redémarrer": "Restart", "Temps écoulé !": "Time's up!",
    "Partager l'application": "Share the app", "Lien copié : collez-le dans un message.": "Link copied: paste it into a message.",
    "Carnet de Tir Cible : l'appli gratuite pour noter ses scores de tir à l'arc (volées, impacts, statistiques). Android : menu ⋮ puis « Installer l'application ». iPhone : Safari, Partager, puis « Sur l'écran d'accueil ».": "Target Archery Logbook: the free app to log your archery scores (ends, impacts, statistics). Android: ⋮ menu, then “Install app”. iPhone: Safari, Share, then “Add to Home Screen”.",
    "Minuteur": "Timer", "Masquer": "Hide", "Afficher": "Show",
    "Durée du minuteur (secondes)": "Timer duration (seconds)", "Durée du minuteur": "Timer duration",
    "Minuteur masqué : réaffichez-le dans Réglages ou en mode Disposition.": "Timer hidden: show it again in Settings or in Layout mode.",
    "Options avancées": "Advanced options", "Depuis un fichier de sauvegarde": "From a backup file", "Copies automatiques": "Automatic copies",
    "Supprimer les copies automatiques": "Delete the automatic copies",
    "L'appli fait aussi seule des copies de sécurité sur l'appareil : une par jour, une à la fin de chaque séance et une avant toute suppression.": "The app also makes safety copies on the device by itself: one per day, one at the end of each session and one before any deletion.",
    "Justesse": "Accuracy", "Groupement": "Grouping", "Ellipse": "Ellipse", "Justesse (cm)": "Accuracy (cm)", "Groupement (cm)": "Grouping (cm)",
    "rayon moyen autour du centre du groupement": "mean radius around the group center",
    "Justesse : position du point moyen par rapport au centre (← gauche, → droite, ↑ haut, ↓ bas).": "Accuracy: position of the average point relative to the center (← left, → right, ↑ up, ↓ down).",
    "Point rouge : centre du groupement.": "Red dot: group center.", "Ellipse : environ 2 flèches sur 3.": "Ellipse: about 2 arrows out of 3.",
    "Justesse : écart entre le centre du groupement et le centre de la cible.": "Accuracy: gap between the group center and the target center.",
    "Groupement : rayon moyen des impacts autour du centre du groupement.": "Grouping: mean radius of the impacts around the group center.",
    "Trop peu de volées pour observer une évolution (6 minimum).": "Too few ends to observe a trend (6 minimum).",
    "Cette tendance décrit les données, pas leur cause.": "This trend describes the data, not its cause.",
    "Mes modèles": "My templates", "Touchez un modèle pour démarrer tout de suite.": "Tap a template to start right away.",
    "Objectif de score (facultatif)": "Score goal (optional)", "Saisie rapide (écran réduit, notes à la fin)": "Quick scoring (reduced screen, notes at the end)",
    "Saisie rapide": "Quick scoring", "saisie rapide": "quick scoring", "Vue complète": "Full view",
    "Enregistrer comme modèle": "Save as template", "Nom du modèle": "Template name", "ex. Mon entraînement du mardi": "e.g. My Tuesday practice",
    "Modèles de séance": "Session templates", "Rétablir les modèles de départ": "Restore the starter templates",
    "Dans « Nouvelle séance », un modèle se lance d'un seul toucher. Pour en créer ou en modifier un, réglez la séance puis « Enregistrer comme modèle » (même nom : le modèle est remplacé).": "In “New session”, a template starts with a single tap. To create or change one, set up the session then “Save as template” (same name: the template is replaced).",
    "Modèle enregistré.": "Template saved.", "Modèle supprimé.": "Template deleted.", "Modèles de départ rétablis.": "Starter templates restored.",
    "Donnez un nom au modèle.": "Give the template a name.", "Aucun modèle pour l'instant.": "No template yet.",
    "Aucun modèle : réglez une séance puis « Enregistrer comme modèle ».": "No template: set up a session then “Save as template”.",
    "Notes de fin de séance": "End-of-session notes", "Conditions et remarques à noter maintenant (facultatif).": "Conditions and remarks to note now (optional).",
    "Passer": "Skip", "Enregistrer": "Save",
    "Abandonner": "Abandon", "Abandonner et démarrer": "Abandon and start", "Ajouter": "Add",
    "Android (Chrome) : menu ⋮ puis « Installer l'application ». iPhone (Safari) : Partager puis « Sur l'écran d'accueil ».": "Android (Chrome): ⋮ menu, then “Install app”. iPhone (Safari): Share, then “Add to Home Screen”.",
    "Android : dans Chrome, touchez le menu ⋮ puis « Installer l'application » (ou « Ajouter à l'écran d'accueil »).": "Android: in Chrome, tap the ⋮ menu then “Install app” (or “Add to Home screen”).",
    "iPhone / iPad : ouvrez cette page dans Safari, touchez Partager, puis « Sur l'écran d'accueil ».": "iPhone / iPad: open this page in Safari, tap Share, then “Add to Home Screen”.",
    "Annuler": "Cancel", "Annuler la dernière": "Undo last", "Annuler la dernière flèche": "Undo last arrow",
    "Application": "App", "Application installée.": "App installed.",
    "Arc": "Bow", "Arc classique": "Recurve", "Arc droit / traditionnel": "Traditional bow", "Arc nu (barebow)": "Barebow", "Arc à poulies": "Compound", "Archer": "Archer", "Longbow": "Longbow",
    "Au total": "All time", "Aucune": "None", "Tout": "All", "Tous": "All", "Toutes": "All",
    "Aucune séance en cours": "No session in progress",
    "Automatique (langue du téléphone)": "Automatic (phone language)",
    "Autre": "Other", "Autre distance…": "Other distance…",
    "Blason": "Target face",
    "Carnet de Tir Cible": "Target Archery Logbook",
    "Carte des impacts": "Impact map", "Carte des impacts de la séance": "Impact map of the session",
    "Cartographie par volée": "Map by end",
    "Ces informations sont enregistrées avec chaque nouvelle séance.": "This information is saved with each new session.",
    "Cette application a besoin de JavaScript pour fonctionner.": "This app needs JavaScript to run.",
    "Ce mois": "This month", "Cette semaine": "This week",
    "Changement": "Change", "Changement ajouté.": "Change added.",
    "Chaque point est une flèche.": "Each dot is an arrow.",
    "Choisissez la distance et le blason pour commencer à noter vos volées.": "Choose the distance and target face to start scoring your ends.",
    "Choisissez une distance et un blason pour fixer un objectif de score.": "Choose a distance and a target face to set a score goal.",
    "Cible": "Target", "Cible : touchez pour placer l'impact": "Target: tap to place the impact", "Cible : touchez pour replacer l'impact": "Target: tap to move the impact",
    "Clavier": "Keypad", "Conditions": "Conditions", "Confirmer": "Confirm",
    "Chaud": "Hot", "Froid": "Cold", "Nuageux": "Cloudy", "Pluie": "Rain", "Salle": "Indoor", "Soleil": "Sunny", "Vent": "Windy",
    "Consulter": "View", "Copier mes séances (texte JSON)": "Copy my sessions (JSON text)",
    "Corriger": "Edit", "Cumul": "Running total",
    "Courbe d'évolution": "Progress curve",
    "Densité": "Density", "Dernière flèche": "Last arrow", "Dernière séance": "Last session",
    "Dispers. (cm)": "Spread (cm)", "Dispersion moyenne": "Average spread", "Décalage (cm)": "Offset (cm)",
    "Décalage : position du point moyen par rapport au centre (← gauche, → droite, ↑ haut, ↓ bas).": "Offset: position of the average point relative to the center (← left, → right, ↑ up, ↓ down).",
    "Décalez-le de": "Shift it by", "vers la droite": "to the right", "vers la gauche": "to the left",
    "Montez le viseur de": "Raise the sight by", "Descendez le viseur de": "Lower the sight by",
    "Décrivez le changement de matériel.": "Describe the equipment change.",
    "Distance": "Distance", "Distance personnalisée": "Custom distance", "Distance réelle": "Actual distance",
    "Démarrer la séance": "Start session", "Démarrer une séance": "Start a session",
    "Efface toutes les séances de cet appareil. Cette action est définitive.": "Deletes all sessions on this device. This cannot be undone.",
    "Effacer": "Clear", "Effacer la volée": "Clear end", "Effacer toutes les flèches de cette volée ?": "Clear all arrows in this end?",
    "Entraînement 30 flèches": "Training 30 arrows", "Extérieur 72 flèches": "Outdoor 72 arrows", "Salle 2×30 flèches": "Indoor 2×30 arrows", "Trispot 18 m": "Triple spot 18 m",
    "English": "English", "Français": "Français",
    "Export CSV": "Export CSV", "Export JSON": "Export JSON",
    "Fenêtre, viseur, repère, point faible…": "Sight setup, anchor point, weak spots…",
    "Fermer": "Close", "Feuille de marque": "Scorecard", "Fin": "Done", "Filtrer l'analyse": "Filter the analysis",
    "Flèche manquée (hors cible)": "Missed arrow (off target)", "Flèches": "Arrows",
    "Flèches de référence pour les objectifs": "Reference arrows for goals", "Flèches par volée": "Arrows per end",
    "Flèches par semaine": "Arrows per week", "Flèches tirées par semaine (8 dernières semaines)": "Arrows shot per week (last 8 weeks)",
    "Formats rapides": "Quick formats",
    "Garder l'écran allumé pendant une séance": "Keep the screen on during a session",
    "Groupement centré : aucune correction nécessaire.": "Group centered: no correction needed.",
    "Haut-Droite": "Upper right", "Haut-Gauche": "Upper left", "Bas-Droite": "Lower right", "Bas-Gauche": "Lower left",
    "Haut": "High", "Bas": "Low", "Gauche": "Left", "Droite": "Right", "Plein centre": "Dead center",
    "Historique": "History", "Historique vide": "History empty", "Les séances terminées apparaissent ici.": "Finished sessions appear here.",
    "Hors ligne : se prépare au premier chargement en ligne.": "Offline: gets ready on the first online load.",
    "Fonctionne hors ligne : prête à être utilisée en salle sans réseau.": "Works offline: ready to use at the range without a network.",
    "Impacts": "Impacts", "Imprimer / PDF": "Print / PDF", "Impression indisponible sur cet appareil.": "Printing is not available on this device.",
    "Importer le texte collé": "Import pasted text", "Importer un fichier de sauvegarde": "Import a backup file",
    "Impossible de créer l'image.": "Could not create the image.", "Impossible de lire ce fichier.": "Could not read this file.",
    "Image enregistrée dans vos téléchargements.": "Image saved to your downloads.",
    "Indiquez de combien de cm bouge l'impact pour un clic : l'appli calcule la correction à faire.": "Enter how many cm the impact moves per click: the app calculates the correction to make.",
    "Installation automatique indisponible : suivez les étapes indiquées.": "Automatic install unavailable: follow the steps shown.",
    "Installer l'application": "Install the app", "Mettre à jour l'application": "Update the app", "Mise à jour en cours…": "Updating…",
    "Jamais": "Never", "Journal du matériel": "Equipment log",
    "Langue / Language": "Langue / Language", "Langue modifiée : rechargement…": "Language changed: reloading…",
    "M": "M", "X": "X", "manqué": "miss", "10 int.": "inner 10",
    "Meilleur score": "Best score", "Meilleure": "Best", "Meilleure volée": "Best end", "Plus faible": "Weakest",
    "Mode de saisie": "Input mode", "Moy.": "Avg.", "Moy. / flèche": "Avg. / arrow", "Moyenne par volée": "Average per end",
    "Navigation principale": "Main navigation", "Nombre de volées": "Number of ends", "Non précisé": "Not specified",
    "Notes de la séance": "Session notes", "note": "note",
    "Notez un changement (flèches, corde, repose-flèche…) : il apparaît sur la courbe d'évolution des statistiques.": "Log a change (arrows, string, arrow rest…): it appears on the progress curve in the stats.",
    "Aucun changement noté pour l'instant.": "No change logged yet.",
    "Nouvelle": "New", "Nouvelle séance": "New session",
    "Objectif": "Goal", "Objectif atteint !": "Goal reached!", "Objectif atteint, bravo !": "Goal reached, well done!", "Objectif de la semaine": "Weekly goal",
    "Objectif hebdomadaire (flèches par semaine)": "Weekly goal (arrows per week)",
    "Aucun objectif défini : saisissez un score pour suivre votre progression.": "No goal set: enter a score to track your progress.",
    "Pas encore assez de flèches pour projeter.": "Not enough arrows yet to project.",
    "(trop peu de flèches pour projeter)": "(too few arrows to project)",
    "Ou collez ici le contenu d'une sauvegarde": "Or paste the contents of a backup here",
    "Partager la sauvegarde": "Share backup", "Partager l'image": "Share image", "Sauvegarde partagée.": "Backup shared.",
    "Pas encore de statistiques": "No statistics yet", "Pensez à sauvegarder vos séances": "Remember to back up your sessions",
    "Plus tard": "Later", "Période": "Period",
    "Plus une zone est foncée, plus vous y avez tiré.": "The darker an area, the more you shot there.",
    "Point rouge : position moyenne.": "Red dot: average position.",
    "Ellipse : zone où tombent environ 2 flèches sur 3.": "Ellipse: area where about 2 arrows out of 3 land.",
    "Points": "Points", "Points moyens de chaque volée": "Average points of each end",
    "Posez le doigt, glissez pour viser, relâchez pour valider.": "Touch, drag to aim, release to confirm.",
    "Posez le doigt, glissez, relâchez pour valider.": "Touch, drag, release to confirm.",
    "Profil de tir": "Shooting profile", "Préférences": "Preferences",
    "Rappel de sauvegarde": "Backup reminder", "Records par format": "Records by format",
    "Terminez une séance complète pour voir vos records.": "Finish a full session to see your records.",
    "Regroupement": "Grouping", "grand × petit axe": "major × minor axis",
    "Replacer sur la cible": "Move on the target", "Reprendre": "Resume", "Rouvrir": "Reopen", "Remplacer": "Replace",
    "Rouvrir cette séance pour corriger la saisie ? Elle sera retirée de l'historique jusqu'à ce que vous la terminiez à nouveau.": "Reopen this session to fix the scoring? It will be removed from the history until you finish it again.",
    "Réglages": "Settings", "Réglages, remarques": "Setup, remarks", "Réglage du viseur": "Sight adjustment",
    "Règle classique : le viseur suit le groupement. Sur certains viseurs (réglage arrière) le sens est inversé : essayez d'abord avec un seul clic.": "Rule of thumb: the sight follows the group. On some sights (rear adjustment) the direction is reversed: try a single click first.",
    "Répartition des flèches": "Arrow distribution",
    "Régularité par volée": "Consistency by end",
    "Régulier du début à la fin de la séance.": "Consistent from start to finish.",
    "Score moyen par flèche pour chaque numéro de volée (séances filtrées).": "Average score per arrow for each end number (filtered sessions).",
    "Score total de chaque séance, de la plus ancienne à la plus récente.": "Total score of each session, from oldest to newest.",
    "Formats différents : la moyenne par flèche permet de les comparer.": "Different formats: the average per arrow lets you compare them.",
    "Saisie": "Scoring", "Sauvegarde": "Backup", "Sauvegarder": "Back up",
    "Scores, volées et statistiques": "Scores, ends and statistics",
    "Sensations (1 = difficile, 5 = excellent)": "Feel (1 = tough, 5 = excellent)",
    "Stats": "Stats", "Statistiques": "Statistics", "Séance": "Session", "séances": "sessions",
    "Séance en cours": "Session in progress", "Séance terminée": "Session finished", "Bilan de séance": "Session summary",
    "Terminer": "Finish", "Total": "Total", "Tout supprimer": "Delete everything", "Supprimer": "Delete", "Supprimer la séance": "Delete session",
    "Terminez une séance pour voir votre progression, la répartition de vos flèches et la carte de vos impacts.": "Finish a session to see your progress, your arrow distribution and your impact map.",
    "Toutes les 5 séances": "Every 5 sessions", "Toutes les 10 séances": "Every 10 sessions", "Toutes les 20 séances": "Every 20 sessions",
    "Toutes les séances (moyenne par n° de volée)": "All sessions (average by end number)",
    "Trispot 40 cm (zones 10 à 5)": "Triple spot 40 cm (zones 10 to 5)", "Trispot 40 cm": "Triple spot 40 cm",
    "Type d'arc": "Bow type", "Type d'affichage": "Display type",
    "Touchez des volées pour voir leurs impacts.": "Tap ends to see their impacts.",
    "Un point moyen par volée, de la première (bleu) à la dernière (rouge).": "One average point per end, from the first (blue) to the last (red).",
    "Valeur de la flèche": "Arrow value", "Valeur actuelle": "Current value", "Version": "Version",
    "Voir le bilan": "View summary", "Volée": "End",
    "Si la nouvelle valeur ne correspond plus à la position de l'impact, cette position est retirée.": "If the new value no longer matches the impact position, the position is removed.",
    "Volume d'entraînement": "Training volume",
    "Vos séances sont enregistrées uniquement sur cet appareil.": "Your sessions are stored on this device only.",
    "Votre nom": "Your name", "Zone sensible": "Danger zone",
    "· vos séances ne sont pas effacées par la mise à jour.": "· your sessions are not erased by the update.",
    "Évolution": "Progress", "Évolution du score": "Score progress", "Évolution de la moyenne par flèche": "Average per arrow progress",
    "Moyenne de toutes les séances filtrées pour chaque numéro de volée.": "Average of all filtered sessions for each end number.",
    "Aucune flèche à annuler.": "No arrow to undo.", "Aucune séance à copier.": "No session to copy.", "Aucune séance à exporter.": "No session to export.", "Aucune séance à sauvegarder.": "No session to back up.",
    "Aucune flèche saisie. Abandonner cette séance ?": "No arrows scored. Abandon this session?",
    "Abandonner la séance en cours ? Les flèches saisies seront perdues.": "Abandon the session in progress? The arrows scored will be lost.",
    "Une autre séance est en cours : elle sera remplacée. Continuer ?": "Another session is in progress: it will be replaced. Continue?",
    "Enregistrement impossible : le stockage du navigateur est plein ou bloqué.": "Cannot save: browser storage is full or blocked.",
    "Aucune sauvegarde effectuée pour l’instant.": "No backup made yet.",
    "Aucune séance trouvée dans cette sauvegarde.": "No session found in this backup.",
    "Texte illisible : ce n'est pas une sauvegarde JSON valide.": "Unreadable text: this is not a valid JSON backup.",
    "Texte placé dans la zone ci-dessous : copiez-le manuellement.": "Text placed in the box below: copy it manually.",
    "Séances copiées : collez-les où vous voulez les garder.": "Sessions copied: paste them wherever you want to keep them.",
    "Séance en cours reprise.": "Session in progress resumed.", "Séance rouverte : annulez une flèche pour corriger.": "Session reopened: undo an arrow to correct it.",
    "Séance supprimée.": "Session deleted.", "Toutes les données ont été supprimées.": "All data has been deleted.",
    "Supprimer définitivement TOUTES les séances de cet appareil ? Pensez à exporter une sauvegarde avant.": "Permanently delete ALL sessions on this device? Remember to export a backup first.",
    "Aucun impact enregistré : placez vos flèches en mode Cible pour obtenir la carte et la tendance de tir.": "No impact recorded: place your arrows in Target mode to get the map and shooting trend.",
    "Aucun impact enregistré pour ces filtres. Pour obtenir un point moyen par volée, placez vos flèches avec le mode « Cible » de l'onglet Saisie : le clavier n'enregistre pas la position des flèches.": "No impact recorded for these filters. To get an average point per end, place your arrows using “Target” mode on the Scoring tab: the keypad does not record arrow positions.",
    "Aucun impact placé : utilisez le mode Cible pour obtenir la carte et la tendance de tir.": "No impact placed: use Target mode to get the map and shooting trend.",
    "Tendance": "Trend",
    "ex. 300": "e.g. 300", "ex. 40 m": "e.g. 40 m", "ex. 71 m": "e.g. 71 m", "ex. Hoyt Formula, 38 lb": "e.g. Hoyt Formula, 38 lb",
    "ex. Nouvelles flèches": "e.g. New arrows", "ex. 0.5": "e.g. 0.5", "ex. 540": "e.g. 540",
    "10 et X": "10 and X", "de 10 et X": "of 10 and X"
  };

  function plural(n, one, many) { return n + ' ' + (parseFloat(n) === 1 ? one : many); }
  var PATTERNS = [
    [/^(v\d+) · (\d{1,2}) ([a-zéû]+)\.? (\d{4})$/i, function (m) { var M = { 'janv': 'Jan', 'févr': 'Feb', 'mars': 'Mar', 'avr': 'Apr', 'mai': 'May', 'juin': 'Jun', 'juil': 'Jul', 'août': 'Aug', 'sept': 'Sep', 'oct': 'Oct', 'nov': 'Nov', 'déc': 'Dec' }; return m[1] + ' · ' + m[2] + ' ' + (M[m[3].toLowerCase()] || m[3]) + ' ' + m[4]; }],
    [/^V(\d+) : ([\d.]+)$/, function (m) { return 'End ' + m[1] + ': ' + m[2]; }],
    [/^V(\d+)$/, function (m) { return 'E' + m[1]; }],
    [/^dans (\d+) jours$/, function (m) { return 'in ' + m[1] + ' days'; }],
    [/^(\d+) jours? de tir ce mois$/, function (m) { return m[1] + ' shooting day' + (m[1] === '1' ? '' : 's') + ' this month'; }],
    [/^Remplacer vos (\d+) séances actuelles par les (\d+) séances de la copie du (.+) \?$/, function (m) { return 'Replace your ' + m[1] + ' current sessions with the ' + m[2] + ' sessions from the copy of ' + m[3] + '?'; }],
    [/^Ellipse : zone où tombent environ 2 flèches sur 3 \(calculée dès (\d+) flèches\)\.$/, function (m) { return 'Ellipse: area where about 2 arrows out of 3 land (calculated from ' + m[1] + ' arrows).'; }],
    [/^Ellipse affichée à partir de (\d+) flèches placées \((\d+) pour l'instant\)\.$/, function (m) { return 'Ellipse shown from ' + m[1] + ' arrows placed (' + m[2] + ' so far).'; }],
    [/^Estimation provisoire \((\d+) flèches placées\) : fiable à partir de (\d+)\.$/, function (m) { return 'Provisional estimate (' + m[1] + ' arrows placed): reliable from ' + m[2] + '.'; }],
    [/^Estimation fiable \((\d+) flèches placées\)\.$/, function (m) { return 'Reliable estimate (' + m[1] + ' arrows placed).'; }],
    [/^Point rouge : centre du groupement \((\d+) impacts\)\.$/, function (m) { return 'Red dot: group center (' + m[1] + ' impacts).'; }],
    [/^Pas d'évolution nette entre le début et la fin de la séance \(écart observé : ([+−][\d.]+) pt par flèche\)\.$/, function (m) { return 'No clear change between the start and the end of the session (observed gap: ' + m[1] + ' pt per arrow).'; }],
    [/^Évolution observée : ([+−][\d.]+) pt par flèche sur le dernier tiers des volées par rapport au premier tiers\.$/, function (m) { return 'Observed change: ' + m[1] + ' pt per arrow over the last third of the ends compared with the first third.'; }],
    [/^Record du format · (\d+) flèches : (\d+) \((.+)\)$/, function (m) { return 'Format record · ' + m[1] + ' arrows: ' + m[2] + ' (' + m[3] + ')'; }],
    [/^Record par distance · moyenne ([\d.]+) par flèche \(≈ (\d+) sur (\d+)\)$/, function (m) { return 'Distance record · average ' + m[1] + ' per arrow (≈ ' + m[2] + ' over ' + m[3] + ')'; }],
    [/^Record sur (\d+) flèches : (\d+) \((.+)\)$/, function (m) { return 'Record over ' + m[1] + ' arrows: ' + m[2] + ' (' + m[3] + ')'; }],
    [/^Meilleure volée de (\d+) flèches? : (\d+)$/, function (m) { return 'Best end of ' + (m[1] === '1' ? '1 arrow' : m[1] + ' arrows') + ': ' + m[2]; }],
    [/^(Nouveau record|Meilleur résultat) personnel sur ce format : (\d+) pts \(précédent : (\d+)\)\.$/, function (m) { return (m[1] === 'Nouveau record' ? 'New personal record' : 'Best personal result') + ' on this format: ' + m[2] + ' pts (previous: ' + m[3] + ').'; }],
    [/^(Nouveau record|Meilleur résultat) à (.+) : moyenne ([\d.]+) par flèche \(précédent : ([\d.]+)\)\.$/, function (m) { return (m[1] === 'Nouveau record' ? 'New record' : 'Best result') + ' at ' + m[2] + ': average ' + m[3] + ' per arrow (previous: ' + m[4] + ').'; }],
    [/^(Nouveau record|Meilleur résultat) sur (\d+) flèches : (\d+) pts \(précédent : (\d+)\)\.$/, function (m) { return (m[1] === 'Nouveau record' ? 'New record' : 'Best result') + ' over ' + m[2] + ' arrows: ' + m[3] + ' pts (previous: ' + m[4] + ').'; }],
    [/^(\d+)×(\d+) flèches$/, function (m) { return m[1] + '×' + m[2] + ' arrows'; }],
    [/^objectif (\d+)$/, function (m) { return 'goal ' + m[1]; }],
    [/^(\d+) mètres(?: \(salle\))?$/, function (m) { return m[0].indexOf('salle') > -1 ? m[1] + ' meters (indoor)' : m[1] + ' meters'; }],
    [/^Blason (\d+) cm$/, function (m) { return m[1] + ' cm target face'; }],
    [/^Toutes les séances \((\d+)\)$/, function (m) { return 'All sessions (' + m[1] + ')'; }],
    [/^(\d+) dernières séances$/, function (m) { return 'Last ' + m[1] + ' sessions'; }],
    [/^(\d+(?:\.\d+)?) flèches?$/, function (m) { return plural(m[1], 'arrow', 'arrows'); }],
    [/^(\d+(?:\.\d+)?) séances?$/, function (m) { return plural(m[1], 'session', 'sessions'); }],
    [/^(\d+(?:\.\d+)?) volées?$/, function (m) { return plural(m[1], 'end', 'ends'); }],
    [/^(\d+(?:\.\d+)?) clics?$/, function (m) { return plural(m[1], 'click', 'clicks'); }],
    [/^(\d+\/\d+) flèches$/, function (m) { return m[1] + ' arrows'; }],
    [/^(\d+) volées de (\d+) flèches$/, function (m) { return m[1] + ' ends of ' + m[2] + ' arrows'; }],
    [/^(\d+) flèches tirées$/, function (m) { return m[1] + ' arrows shot'; }],
    [/^\((\d+) flèches tirées\)\.$/, function (m) { return '(' + m[1] + ' arrows shot).'; }],
    [/^Il reste (\d+) flèches?\.$/, function (m) { return plural(m[1], 'arrow', 'arrows') + ' to go.'; }],
    [/^(\d+) \/ (\d+) flèches$/, function (m) { return m[1] + ' / ' + m[2] + ' arrows'; }],
    [/^Volée (\d+)$/, function (m) { return 'End ' + m[1]; }],
    [/^Volée (\d+) : (\d+) points$/, function (m) { return 'End ' + m[1] + ': ' + m[2] + ' points'; }],
    [/^Volée (\d+) · flèche (\d+)$/, function (m) { return 'End ' + m[1] + ' · arrow ' + m[2]; }],
    [/^flèche (\d+)$/, function (m) { return 'arrow ' + m[1]; }],
    [/^Modifier la flèche (\d+) de la volée (\d+)$/, function (m) { return 'Edit arrow ' + m[1] + ' of end ' + m[2]; }],
    [/^Modifier la flèche (\d+)$/, function (m) { return 'Edit arrow ' + m[1]; }],
    [/^Flèche modifiée : (.+)$/, function (m) { return 'Arrow updated: ' + m[1]; }],
    [/^Moy\. (.+)$/, function (m, T) { return 'Avg. ' + T(m[1]); }],
    [/^moy\. (.+)$/, function (m, T) { return 'avg. ' + T(m[1]); }],
    [/^Moyenne : (.+)$/, function (m, T) { return 'Average: ' + T(m[1]); }],
    [/^10 et X : (\d+)$/, function (m) { return '10 and X: ' + m[1]; }],
    [/^X : (\d+)$/, function (m) { return 'X: ' + m[1]; }],
    [/^Score : (.+)$/, function (m, T) { return 'Score: ' + T(m[1]); }],
    [/^Notes : (.*)$/, function (m) { return 'Notes: ' + m[1]; }],
    [/^Distance réelle : (.*)$/, function (m) { return 'Actual distance: ' + m[1]; }],
    [/^réel (.+)$/, function (m) { return 'actual ' + m[1]; }],
    [/^forme (\d\/5)$/, function (m) { return 'feel ' + m[1]; }],
    [/^n° (\d+)$/, function (m) { return 'no. ' + m[1]; }],
    [/^pts$/, function () { return 'pts'; }],
    [/^Meilleur score \(sur (\d+)\)$/, function (m) { return 'Best score (out of ' + m[1] + ')'; }],
    [/^Objectif · (.+)$/, function (m, T) { return 'Goal · ' + T(m[1]); }],
    [/^Score visé sur (\d+) flèches$/, function (m) { return 'Target score over ' + m[1] + ' arrows'; }],
    [/^Valeur d'un clic à (.+) \(en cm\)$/, function (m) { return 'Value of one click at ' + m[1] + ' (in cm)'; }],
    [/^Meilleure projection : (\d+) · il manque (\d+) points$/, function (m) { return 'Best projection: ' + m[1] + ' · ' + m[2] + ' points to go'; }],
    [/^Objectif : (\d+) pts sur (\d+) flèches(?:, il manque (\d+) points| \(trop peu de flèches pour projeter\))\.$/, function (m) {
      return 'Goal: ' + m[1] + ' pts over ' + m[2] + ' arrows' + (m[3] !== undefined ? ', ' + m[3] + ' points to go.' : ' (too few arrows to project).'); }],
    [/^Objectif de (\d+) points \(sur (\d+) flèches\) atteint !$/, function (m) { return 'Goal of ' + m[1] + ' points (over ' + m[2] + ' arrows) reached!'; }],
    [/^Objectif hebdomadaire atteint : (\d+) \/ (\d+) flèches cette semaine\.$/, function (m) { return 'Weekly goal reached: ' + m[1] + ' / ' + m[2] + ' arrows this week.'; }],
    [/^(Nouveau record sur ce format|Meilleure séance de ce format) : (\d+) pts \(précédent : (\d+)\)\.$/, function (m) {
      return (m[1] === 'Nouveau record sur ce format' ? 'New record for this format' : 'Best session of this format') + ': ' + m[2] + ' pts (previous: ' + m[3] + ').'; }],
    [/^Projection sur (\d+) flèches :$/, function (m) { return 'Projection over ' + m[1] + ' arrows:'; }],
    [/^Projection sur (\d+) flèches : (\d+) pts$/, function (m) { return 'Projection over ' + m[1] + ' arrows: ' + m[2] + ' pts'; }],
    [/^Les séances plus courtes sont ramenées à (\d+) flèches \(ex\. 10 volées de 3 : score ×2\)\.$/, function (m) { return 'Shorter sessions are scaled to ' + m[1] + ' arrows (e.g. 10 ends of 3: score ×2).'; }],
    [/^Dernière séance : (\d+) projetés(?: \((\d+) réels\))?\.$/, function (m) { return 'Last session: ' + m[1] + ' projected' + (m[2] ? ' (' + m[2] + ' actual)' : '') + '.'; }],
    [/^Seules les séances d'au moins (\d+) flèches comptent\.$/, function (m) { return 'Only sessions of at least ' + m[1] + ' arrows count.'; }],
    [/^Point rouge : position moyenne de vos (\d+) impacts\.$/, function (m) { return 'Red dot: average position of your ' + m[1] + ' impacts.'; }],
    [/^Écart maximal entre deux volées : ([\d.]+) cm$/, function (m) { return 'Maximum gap between two ends: ' + m[1] + ' cm'; }],
    [/^Régularité : ±([\d.]+) pts par volée \(écart-type\)\.$/, function (m) { return 'Consistency: ±' + m[1] + ' pts per end (standard deviation).'; }],
    [/^Régularité : ±([\d.]+) pt par flèche \(écart-type\)\.$/, function (m) { return 'Consistency: ±' + m[1] + ' pt per arrow (standard deviation).'; }],
    [/^Baisse en fin de séance : ([\d.]+) pt par flèche de moins que sur les premières volées\.$/, function (m) { return 'Drop at the end of the session: ' + m[1] + ' pt per arrow lower than in the first ends.'; }],
    [/^Progression en cours de séance : ([\d.]+) pt par flèche de plus que sur les premières volées\.$/, function (m) { return 'Improvement during the session: ' + m[1] + ' pt per arrow higher than in the first ends.'; }],
    [/^([\d.]+) cm à (gauche|droite)$/, function (m) { return m[1] + ' cm to the ' + (m[2] === 'gauche' ? 'left' : 'right'); }],
    [/^([\d.]+) cm trop (haut|bas)$/, function (m) { return m[1] + ' cm too ' + (m[2] === 'haut' ? 'high' : 'low'); }],
    [/^Archer : (.*) \(modifiable dans Réglages\)$/, function (m, T) { return 'Archer: ' + T(m[1]) + ' (editable in Settings)'; }],
    [/^Dernière sauvegarde : (.*?)(?: \((\d+) séances? depuis\))?\.$/, function (m) { return 'Last backup: ' + m[1] + (m[2] ? ' (' + m[2] + ' session' + (m[2] === '1' ? '' : 's') + ' since)' : '') + '.'; }],
    [/^(\d+) séances? ne sont pas encore sauvegardées\.$/, function (m) { return m[1] + ' session' + (m[1] === '1' ? ' is' : 's are') + ' not backed up yet.'; }],
    [/^(\d+) séances? importées?(?:, (\d+) déjà présentes?)?(?:, (\d+) ignorées? \(format inconnu\))?\.$/, function (m) {
      var out = m[1] + ' session' + (m[1] === '1' ? '' : 's') + ' imported';
      if (m[2]) out += ', ' + m[2] + ' already present';
      if (m[3]) out += ', ' + m[3] + ' ignored (unknown format)';
      return out + '.'; }],
    [/^Supprimer définitivement la séance du (.+) \?$/, function (m) { return 'Permanently delete the session of ' + m[1] + '?'; }],
    [/^Terminer la séance maintenant \((\d+\/\d+) flèches\) et l'enregistrer dans l'historique \?$/, function (m) { return 'Finish the session now (' + m[1] + ' arrows) and save it to the history?'; }],
    [/^Une séance est en cours \((\d+) flèches\)\. Démarrer une nouvelle séance l'abandonnera\. Continuer \?$/, function (m) { return 'A session is in progress (' + m[1] + ' arrows). Starting a new one will abandon it. Continue?'; }],
    [/^(\d+) points en (\d+) flèches \(terminée avant la fin : (\d+\/\d+)\)\.$/, function (m) { return m[1] + ' points in ' + m[2] + ' arrows (finished early: ' + m[3] + ').'; }],
    [/^(\d+) points sur (\d+) en (\d+) flèches\.$/, function (m) { return m[1] + ' points out of ' + m[2] + ' in ' + m[3] + ' arrows.'; }],
    [/^(\d+) pts · (\d+\/\d+) flèches$/, function (m) { return m[1] + ' pts · ' + m[2] + ' arrows'; }],
    [/^\/ (\d+) pts$/, function (m) { return '/ ' + m[1] + ' pts'; }],
    [/^(\d+) points$/, function (m) { return m[1] + ' points'; }]
  ];

  var TOKENS = [
    [/(\d+(?:\.\d+)?) flèches?(?![A-Za-zÀ-ÿ])/g, function (m, n) { return plural(n, 'arrow', 'arrows'); }],
    [/(\d+(?:\.\d+)?) séances?(?![A-Za-zÀ-ÿ])/g, function (m, n) { return plural(n, 'session', 'sessions'); }],
    [/(\d+(?:\.\d+)?) volées?(?![A-Za-zÀ-ÿ])/g, function (m, n) { return plural(n, 'end', 'ends'); }],
    [/(\d+(?:\.\d+)?) clics?(?![A-Za-zÀ-ÿ])/g, function (m, n) { return plural(n, 'click', 'clicks'); }]
  ];
  function tokens(s) {
    if (!/\d/.test(s)) return s;
    var out = s;
    TOKENS.forEach(function (t) { out = out.replace(t[0], t[1]); });
    return out;
  }

  function norm(s) { return s.replace(/\s+/g, ' '); }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function tr1(c, d) {
    d = d || 0;
    if (d > 5) return c;
    var n = norm(c);
    if (has(EXACT, n)) return EXACT[n];
    if (n.indexOf('· ') === 0 && n.length > 2) return '· ' + tr1(n.slice(2), d + 1);
    for (var i = 0; i < PATTERNS.length; i++) {
      var m = n.match(PATTERNS[i][0]);
      if (m) return PATTERNS[i][1](m, function (x) { return tr1(x, d + 1); });
    }
    var seps = [' · ', ' — '];
    for (var j = 0; j < seps.length; j++) {
      if (n.indexOf(seps[j]) > -1) return n.split(seps[j]).map(function (x) { return tr1(x, d + 1); }).join(seps[j]);
    }
    var parts = [], last = 0, re = /([.!?])\s+(?=[A-ZÀ-ÝÉ«])/g, mm;
    while ((mm = re.exec(n))) { parts.push(n.slice(last, mm.index + 1)); last = re.lastIndex; }
    parts.push(n.slice(last));
    if (parts.length > 1) return parts.map(function (x) { return tr1(x, d + 1); }).join(' ');
    return tokens(n);
  }
  function tr(s) {
    if (typeof s !== 'string') return s;
    var m = s.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!m[2]) return s;
    return m[1] + tr1(m[2]) + m[3];
  }
  window.t = tr;

  var ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  function trNode(node) {
    var v = node.nodeValue;
    if (!v || !/[A-Za-zÀ-ÿ]/.test(v)) return;
    var par = node.parentElement;
    if (par && /^(SCRIPT|STYLE|TEXTAREA)$/.test(par.tagName)) return;
    var nv = (par && par.closest && par.closest('#btn-undo-target')) ? v.replace(/\S[\s\S]*\S|\S/, 'Undo') : tr(v);
    if (nv !== v) {
      if (par && par.tagName === 'OPTION' && !par.hasAttribute('value')) par.setAttribute('value', v.trim());
      node.nodeValue = nv;
    }
  }
  function trAttr(el, a) {
    var v = el.getAttribute(a);
    if (!v) return;
    var nv = tr(v);
    if (nv !== v) el.setAttribute(a, nv);
  }
  function walkChildren(el) {
    var c = el.firstChild, next;
    while (c) {
      next = c.nextSibling;
      if (c.nodeType === 3) trNode(c);
      else if (c.nodeType === 1 && !/^(SCRIPT|STYLE)$/.test(c.tagName)) {
        for (var i = 0; i < ATTRS.length; i++) if (c.hasAttribute(ATTRS[i])) trAttr(c, ATTRS[i]);
        walkChildren(c);
      }
      c = next;
    }
  }
  function walk(root) {
    if (root.nodeType === 3) { trNode(root); return; }
    if (root.nodeType !== 1 || /^(SCRIPT|STYLE)$/.test(root.tagName)) return;
    for (var i = 0; i < ATTRS.length; i++) if (root.hasAttribute(ATTRS[i])) trAttr(root, ATTRS[i]);
    walkChildren(root);
  }

  walk(document.documentElement);
  new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      if (m.type === 'characterData') trNode(m.target);
      else if (m.type === 'attributes') trAttr(m.target, m.attributeName);
      else m.addedNodes.forEach(walk);
    });
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
})();
