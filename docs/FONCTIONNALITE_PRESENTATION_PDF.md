# Fonctionnalité de Présentation PDF - WallSim3D

## Description

La fonctionnalité "Présenter" permet d'exporter le projet 3D actuel en format PDF avec différentes vues du modèle. Le PDF généré est au format A4 paysage et comprend jusqu'à 6 pages selon les options sélectionnées.

## Accès à la fonctionnalité

Un bouton "Présenter" est disponible dans la barre de navigation principale, à droite du menu de navigation. Ce bouton ouvre une fenêtre modale avec toutes les options d'exportation.

## Options disponibles

### Informations du projet
- **Titre du projet** : Nom qui apparaîtra en en-tête de chaque page
- **Nom du dessinateur** : Nom qui apparaîtra en bas à gauche de chaque page

### Pages disponibles
1. **Vue perspective** : Vue 3D globale avec zoom automatique sur tous les éléments
2. **Vue orthogonale du dessus** : Vue du dessus avec fond blanc
3. **Vue orthogonale - Élévation principale** : Vue de face avec fond blanc
4. **Vue orthogonale - Élévation gauche** : Vue de côté gauche avec fond blanc
5. **Vue orthogonale - Élévation droite** : Vue de côté droit avec fond blanc
6. **Vue orthogonale - Élévation arrière** : Vue arrière avec fond blanc

### Paramètres d'échelle
- **Vue du dessus** : Échelle configurable (1:10 à 1:100)
- **Élévations** : Échelle configurable (1:10 à 1:100)

## Contenu des pages PDF

### En-tête de chaque page
- **Centre** : Titre du projet (configurable)
- **Gauche** : Nom du dessinateur (configurable)
- **Droite** : Date et heure de génération

### Corps de la page
- Image de la vue 3D capturée en haute résolution
- Fond blanc pour toutes les vues orthogonales
- Image centrée et redimensionnée pour s'adapter à la page

### Bas de page
- **Centre** : Nom de la vue (ex: "Vue Perspective", "Élévation principale")
- **Droite** : Échelle de la vue (uniquement pour les vues orthogonales)

### Pied de page
- **Gauche** : "WallSim3D v3.0 - Copyright 2025 Julien BROHEZ"
- **Droite** : Numéro de page (ex: "Page 1 sur 6")

## Utilisation

1. Cliquez sur le bouton "Présenter" dans la barre de navigation
2. Configurez les informations du projet (titre et dessinateur)
3. Sélectionnez les pages à inclure dans le PDF
4. Ajustez les échelles des vues orthogonales si nécessaire
5. Cliquez sur "Générer PDF"
6. Le PDF sera automatiquement téléchargé une fois généré

## Prérequis techniques

La fonctionnalité utilise :
- **jsPDF** : Génération du document PDF
- **html2canvas** : Capture des vues 3D
- **Three.js** : Rendu 3D (déjà présent dans l'application)

Ces bibliothèques sont automatiquement chargées depuis CDN lors de la première utilisation.

## Limitations actuelles

- Les vues "Élévation gauche", "Élévation droite" et "Élévation arrière" utilisent actuellement les mêmes vues de base que "Vue de côté" et "Vue de face"
- L'ajustement automatique des angles pour ces vues spéciales est en cours de développement
- La capture se fait sur la vue actuellement affichée dans l'application

## Dépannage

Si la génération échoue :
1. Vérifiez que le projet contient des éléments 3D
2. Assurez-vous que l'application est bien chargée (attendez quelques secondes après le chargement)
3. Vérifiez la console du navigateur pour les messages d'erreur
4. Essayez de réduire le nombre de pages à générer

## Fichiers associés

- `styles/presentation.css` : Styles de l'interface
- `js/presentation-manager.js` : Logique de génération PDF
- Bibliothèques CDN : jsPDF et html2canvas (chargées automatiquement)
