# Sélection des Modèles GLB dans WallSim3D

## 🎯 Vue d'ensemble

Cette fonctionnalité permet de sélectionner les modèles GLB importés avec l'outil de sélection pour afficher leurs propriétés détaillées et les inclure dans le métré.

## 🔧 Fonctionnement

### Sélection des Modèles GLB

1. **Mode Sélection** : Basculez en mode sélection avec l'outil de sélection (icône curseur)
2. **Clic sur le Modèle** : Cliquez sur n'importe quelle partie du modèle GLB importé
3. **Affichage des Propriétés** : Les propriétés s'affichent automatiquement dans l'onglet Propriétés

### Propriétés Affichées

Les propriétés suivantes sont affichées pour les modèles GLB sélectionnés :

- **Nom du modèle** : Nom du fichier sans extension
- **Fichier** : Nom complet du fichier GLB
- **ID** : Identifiant unique dans la scène
- **Dimensions** : Longueur × Largeur × Hauteur en cm
- **Position** : Coordonnées X, Y, Z dans la scène
- **Échelle** : Facteur d'agrandissement/réduction appliqué
- **Volume** : Volume calculé en m³
- **Masse** : Masse par défaut (1 kg)
- **Date d'import** : Date d'importation du modèle
- **Rotation** : Angles de rotation X, Y, Z en degrés

### Métré des Modèles GLB

Les modèles GLB sélectionnés sont automatiquement inclus dans le métré :

1. **Onglet Métré** : Visible dans la liste des éléments
2. **Filtrage** : Option "Modèles 3D" dans le filtre par type
3. **Groupement** : Regroupés par nom de modèle
4. **Quantification** : Comptabilisés avec volume et masse

## 🎨 Effets Visuels

### Surbrillance des Modèles GLB

Quand un modèle GLB est sélectionné :
- **Émission verte** : Le modèle émet une légère lueur verte
- **Intensité émissive** : 0.3 pour une surbrillance subtile
- **Préservation** : Les matériaux originaux sont sauvegardés et restaurés

### Messages Console

Le système affiche des messages informatifs :
```
✨ Modèle GLB surbrillance activée: Hourdis13_60n.glb
🎯 Sélection d'élément spécial: glb GLB_Hourdis13_60n_1737023423123_abc123
🔄 Modèle GLB surbrillance désactivée: Hourdis13_60n.glb
```

## 🔄 Intégration Système

### Scene Manager

Les modèles GLB sont intégrés dans le système de sélection :
- **Détection** : Reconnus par le raycaster comme éléments sélectionnables
- **Gestion** : Traités par le système de highlight/déhighlight
- **Événements** : Émission d'événements `elementSelected`

### Tab Manager

L'affichage des propriétés est géré spécifiquement :
- **Fonction dédiée** : `displayGLBProperties()`
- **Interface adaptée** : Propriétés spécialisées pour les modèles 3D
- **Style visuel** : Icône 🎯 et couleurs appropriées

### Construction Tools

Compatible avec le système de construction :
- **Mode sélection** : Basculement automatique vers l'onglet propriétés
- **Pas de suggestions** : Aucune suggestion de placement pour les GLB
- **Coexistence** : N'interfère pas avec les outils de construction

## 📊 Données Techniques

### Structure des Données GLB

Chaque modèle GLB contient :
```javascript
{
    id: "glb_1737023423123_abc123",
    type: "glb",
    isGLBModel: true,
    glbFileName: "Hourdis13_60n.glb",
    boundingBox: Box3,
    dimensions: { length, width, height },
    getVolume: function(),
    getMass: function(),
    userData: {
        type: "imported_model",
        fileName: "Hourdis13_60n.glb",
        importedAt: "2025-01-16T10:30:23.123Z",
        isGLB: true
    }
}
```

### Configuration des Meshes

Chaque mesh enfant du modèle GLB :
```javascript
mesh.userData = {
    element: gltfScene, // Référence vers le parent GLB
    isGLBMesh: true
}
```

## 🚀 Avantages

1. **Intégration Complète** : Les modèles GLB font partie intégrante du projet
2. **Propriétés Détaillées** : Informations complètes sur chaque modèle
3. **Métré Automatique** : Inclusion automatique dans les calculs
4. **Interface Unifiée** : Même système de sélection que les autres éléments
5. **Feedback Visuel** : Surbrillance claire des éléments sélectionnés

## 🔧 Dépannage

### Modèle Non Sélectionnable

Si un modèle GLB ne peut pas être sélectionné :
1. Vérifiez que l'importation s'est bien déroulée
2. Contrôlez la console pour des erreurs
3. Assurez-vous d'être en mode sélection
4. Vérifiez que le modèle a bien des meshes visibles

### Propriétés Manquantes

Si certaines propriétés ne s'affichent pas :
1. Le modèle pourrait avoir des dimensions nulles
2. La bounding box pourrait être invalide
3. Rechargez le modèle si nécessaire

### Performance

Pour optimiser les performances avec de nombreux modèles GLB :
1. Les modèles complexes peuvent ralentir la sélection
2. Utilisez des modèles optimisés quand possible
3. Le système gère automatiquement les matériaux pour l'éclairage

## 📝 Notes de Version

- **Version 1.0** : Sélection de base et affichage des propriétés
- **Version 1.1** : Intégration au métré et filtrage
- **Version 1.2** : Surbrillance visuelle et optimisations
