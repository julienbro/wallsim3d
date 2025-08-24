# 🎨 SYSTÈME DE PINCEAU DE MATÉRIAU - WallSim3D

## Vue d'ensemble
Le système de pinceau de matériau permet aux utilisateurs de sélectionner un matériau puis de cliquer directement sur des éléments de construction (briques, blocs, etc.) pour changer leur apparence instantanément.

## Fonctionnalités

### ✨ Mode Pinceau
- **Activation** : Clic sur l'icône pinceau 🖌️ à côté de chaque matériau
- **Raccourci clavier** : Touche `P` pour activer/désactiver le mode
- **Curseur personnalisé** : Curseur "pinceau" pendant l'utilisation
- **Sortie** : Touche `Échap` ou bouton "Quitter"

### 🎯 Application des Matériaux
- **Clic direct** : Un simple clic sur un élément pour le peindre
- **Confirmation visuelle** : Animation verte lors de l'application
- **Notification** : Affichage du nom du matériau appliqué
- **Son de confirmation** : Retour sonore lors de l'application

### 🖱️ Interface Utilisateur

#### Boutons de Pinceau
- **Position** : Coin supérieur gauche de chaque élément de matériau
- **Visibilité** : Apparition au survol
- **Style** : Icône pinceau bleue en cercle
- **Animation** : Effet de survol avec agrandissement

#### Barre de Statut
- **Position** : Centre en haut de l'écran
- **Contenu** : 
  - Icône pinceau
  - Statut du mode ("actif" ou "inactif")  
  - Nom du matériau sélectionné
  - Bouton de sortie
- **Style** : Barre bleue semi-transparente avec effet flou

#### Notifications
- **Position** : Coin supérieur droit
- **Types** :
  - **Info** (bleu) : Activation du mode
  - **Succès** (vert) : Application réussie
  - **Avertissement** (jaune) : Aucun élément trouvé
  - **Erreur** (rouge) : Problème d'application
- **Durée** : 3 secondes avec animation d'entrée/sortie

## Utilisation

### 🚀 Activation Rapide
1. **Sélection directe** : Cliquer sur l'icône pinceau d'un matériau
2. **Mode global** : Utiliser le bouton "Pinceau" dans la barre d'outils
3. **Raccourci** : Appuyer sur `P`

### 🎨 Application de Matériaux
1. **Activer le mode pinceau** avec un matériau
2. **Cliquer sur un élément** de la scène 3D
3. **Observer la confirmation** visuelle et sonore
4. **Continuer** à peindre d'autres éléments
5. **Sortir** avec `Échap` ou le bouton de sortie

### ⌨️ Raccourcis Clavier
- `P` : Activer/désactiver le mode pinceau
- `Échap` : Sortir du mode pinceau
- `Clic` : Appliquer le matériau à l'élément ciblé

## Architecture Technique

### Classes Principales

#### MaterialPainter
- **Fichier** : `js/material-painter.js`
- **Responsabilités** :
  - Gestion du mode pinceau
  - Détection des clics sur éléments
  - Application des matériaux
  - Interface utilisateur du mode pinceau

#### ExtendedMaterialManager (étendu)
- **Fichier** : `js/extended-material-manager.js`  
- **Nouvelles fonctionnalités** :
  - Boutons de pinceau sur les éléments de matériau
  - Intégration avec MaterialPainter
  - Notifications d'activation

### Intégrations

#### SceneManager
- **Raycasting** : Détection des éléments cliqués
- **Désactivation des contrôles** : Pendant le mode pinceau
- **Gestion des événements** : Capture des clics de souris

#### WallElement
- **Méthode setMaterial()** : Application du nouveau matériau
- **Animation** : Effet visuel de confirmation
- **Propriétés** : Sauvegarde du matériau précédent

## Avantages

### 🎯 Facilité d'Utilisation
- **Intuitive** : Clic direct sans naviguer dans des menus
- **Rapide** : Application instantanée des matériaux
- **Visuel** : Retour immédiat sur l'action

### 💡 Productivité
- **Workflow fluide** : Sélection et application en un geste
- **Mode persistant** : Peindre plusieurs éléments consécutivement
- **Raccourcis** : Accès clavier pour les utilisateurs avancés

### 🔧 Flexibilité
- **Intégration native** : Fonctionne avec tous les matériaux existants
- **Extensible** : Architecture modulaire pour nouvelles fonctionnalités
- **Compatible** : Préserve toutes les fonctionnalités existantes

## Personnalisation

### Curseurs
```css
.paint-cursor {
    cursor: url('data:image/svg+xml;base64,...') 16 16, auto;
}
```

### Couleurs du Mode
```css
.material-item.painting-selected {
    border-color: #f39c12;
    background: #fef9e7;
}
```

### Animations
```css
@keyframes pulse-paint {
    0% { box-shadow: 0 2px 4px rgba(243, 156, 18, 0.4); }
    50% { box-shadow: 0 4px 12px rgba(243, 156, 18, 0.8); }
    100% { box-shadow: 0 2px 4px rgba(243, 156, 18, 0.4); }
}
```

## Événements Émis

### materialChanged
- **Déclencheur** : Sélection d'un nouveau matériau
- **Données** : `{ materialId, material }`
- **Usage** : Synchronisation avec autres composants

### elementPainted  
- **Déclencheur** : Application d'un matériau à un élément
- **Données** : `{ elementId, element, oldMaterial, newMaterial }`
- **Usage** : Historique, analytics, intégrations

## Extensions Futures

### 🎨 Fonctionnalités Avancées
- **Sélection multiple** : Peindre plusieurs éléments simultanément
- **Historique** : Annuler/refaire les applications
- **Filtres** : Peindre seulement certains types d'éléments
- **Masques** : Zones de peinture restreintes

### 🔧 Améliorations Techniques
- **Cache des matériaux** : Optimisation des performances
- **Prévisualisation** : Survol pour voir le résultat
- **Validation** : Vérification de compatibilité matériau/élément
- **Synchronisation** : Mise à jour temps réel multi-utilisateur

---

*Le système de pinceau de matériau rend l'application de textures et couleurs aussi simple qu'un clic, transformant l'expérience utilisateur de WallSim3D en un workflow fluide et intuitif.*
