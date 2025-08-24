# Import de Modèles 3D GLB - WallSim3D

## 📋 Vue d'ensemble

WallSim3D prend désormais en charge l'importation de modèles 3D au format GLB/GLTF, permettant d'enrichir vos projets avec des éléments 3D complexes provenant d'applications de modélisation externes.

## 🎯 Fonctionnalités

### Formats Supportés
- **GLB** (Binary glTF) - Format binaire optimisé
- **GLTF** (Text glTF) - Format texte avec fichiers externes

### Caractéristiques
- **Import automatique** des matériaux et textures
- **Gestion des ombres** automatique
- **Repositionnement intelligent** au sol
- **Redimensionnement automatique** si nécessaire
- **Intégration complète** dans la scène 3D

## 🚀 Utilisation

### Importer un Modèle GLB

1. **Accéder au menu d'import**
   - Cliquer sur `Fichier` > `Importer`
   - Ou utiliser le raccourci clavier `Ctrl+O`

2. **Sélectionner le type de modèle**
   - Cliquer sur `Modèle 3D GLB`
   - Le bouton est identifié par l'icône cube 🧊

3. **Choisir le fichier**
   - Naviguer vers votre fichier `.glb` ou `.gltf`
   - Valider la sélection

4. **Chargement automatique**
   - Le modèle est analysé et optimisé
   - Positionnement automatique dans la scène
   - Activation des ombres et de l'éclairage

### Interface Utilisateur

```
📥 Importer
├── Projet complet
│   └── 📄 Projet WallSim3D (.json)
├── Éléments
│   └── ➕ Ajouter des éléments
├── Modèles 3D              <- NOUVEAU
│   └── 🧊 Modèle 3D GLB    <- NOUVEAU
└── Bibliothèque
    └── 📚 Importer bibliothèque
```

## ⚙️ Traitement Automatique

### Optimisations Appliquées

1. **Positionnement**
   - Calcul automatique de la bounding box
   - Centrage du modèle par rapport à son volume
   - Placement au niveau du sol (y = 0)

2. **Redimensionnement**
   - Détection des modèles trop volumineux (>100 unités)
   - Mise à l'échelle automatique si nécessaire
   - Conservation des proportions

3. **Matériaux**
   - Conversion des `MeshBasicMaterial` en `MeshLambertMaterial`
   - Activation de l'éclairage réaliste
   - Préservation des textures et couleurs

4. **Ombres**
   - Activation automatique de `castShadow`
   - Activation automatique de `receiveShadow`
   - Intégration dans le système d'éclairage global

### Métadonnées

Chaque modèle importé conserve ses informations :
```javascript
{
    type: 'imported_model',
    fileName: 'mon_modele.glb',
    importedAt: '2025-08-16T10:30:00.000Z',
    isGLB: true
}
```

## 🛠️ Implémentation Technique

### Chargement du GLTFLoader

Le système charge automatiquement le GLTFLoader de Three.js :

1. **Tentative ES6 moderne** (priorité)
   ```javascript
   import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
   ```

2. **Fallback UMD** (compatibilité)
   ```javascript
   // Script classique depuis CDN
   ```

### Architecture

```
FileMenuHandler
├── importGLB()           // Point d'entrée principal
├── loadGLTFLoader()      // Chargement dynamique du loader
├── processGLBFile()      // Traitement du fichier
└── addGLBToScene()       // Ajout à la scène 3D
```

### Gestion d'Erreurs

- **Fichier invalide** : Message d'erreur explicite
- **Loader indisponible** : Chargement automatique avec fallback
- **Mémoire insuffisante** : Gestion des erreurs WebGL
- **Format non supporté** : Validation du format

## 📊 Formats Recommandés

### GLB (Recommandé)
- ✅ Format binaire optimisé
- ✅ Tout-en-un (géométrie + textures)
- ✅ Chargement plus rapide
- ✅ Taille de fichier réduite

### GLTF (Supporté)
- ⚠️ Format texte + fichiers externes
- ⚠️ Nécessite tous les assets
- ⚠️ Plus lent à charger
- ✅ Plus facilement éditable

## 🎨 Conseils d'Utilisation

### Préparation des Modèles

1. **Optimisation**
   - Réduire le nombre de polygones si possible
   - Optimiser les textures (taille raisonnable)
   - Fusionner les matériaux similaires

2. **Échelle**
   - Modéliser à l'échelle réelle (1 unité = 1 cm)
   - Éviter les modèles gigantesques
   - Placer l'origine au centre de la base

3. **Matériaux**
   - Utiliser des matériaux compatibles PBR
   - Éviter les matériaux trop complexes
   - Tester l'éclairage dans WallSim3D

### Applications Sources

- **Blender** : Export GLB direct
- **3ds Max** : Plugin GLB/GLTF
- **Maya** : Plugin GLTF
- **SketchUp** : Via extensions
- **Fusion 360** : Export vers format intermédiaire

## 🔧 Dépannage

### Problèmes Courants

| Problème | Cause | Solution |
|----------|-------|----------|
| Modèle invisible | Échelle trop petite | Agrandir dans l'app source |
| Modèle trop grand | Échelle incorrecte | Redimensionnement auto activé |
| Pas d'ombres | Matériaux incompatibles | Conversion automatique |
| Chargement lent | Fichier volumineux | Optimiser le modèle |
| Erreur de format | Fichier corrompu | Ré-exporter depuis la source |

### Messages d'Erreur

- **"GLTFLoader non disponible"** : Problème de chargement du loader
- **"Erreur lors du chargement GLB"** : Fichier invalide ou corrompu
- **"Three.js non disponible"** : Three.js pas encore chargé
- **"SceneManager non disponible"** : Scène 3D non initialisée

## 📈 Performance

### Optimisations Intégrées

- **Chargement asynchrone** : Pas de blocage de l'interface
- **Gestion mémoire** : Nettoyage automatique des URLs temporaires
- **Cache intelligent** : Réutilisation du GLTFLoader
- **Traitement par lot** : Support futur pour imports multiples

### Limites Recommandées

- **Taille fichier** : < 50 MB par modèle
- **Polygones** : < 100k triangles par modèle
- **Textures** : < 2048x2048 px par texture
- **Modèles simultanés** : < 20 modèles complexes

## 🔄 Intégration Projet

### Sauvegarde

Les modèles GLB importés sont :
- ✅ Inclus dans les sauvegardes de projet
- ✅ Préservés lors des exports
- ✅ Compatibles avec le système d'historique
- ⚠️ Pas exportés au format STL/OBJ (limitation Three.js)

### Compatibilité

- ✅ Tous les navigateurs modernes
- ✅ WebGL 1.0 et 2.0
- ✅ Desktop et mobile
- ✅ Tous les systèmes d'exploitation

## 🚀 Évolutions Futures

### Fonctionnalités Prévues

- **Import par glisser-déposer** : Interface plus intuitive
- **Prévisualisation** : Aperçu avant import
- **Bibliothèque de modèles** : Collection intégrée
- **Édition basique** : Rotation, échelle, position
- **Animation** : Support des animations GLB
- **Optimisation auto** : Réduction automatique de polygones

---

## 📞 Support

Pour signaler des problèmes ou demander des améliorations concernant l'import GLB :

1. Vérifier les [problèmes connus](#dépannage)
2. Tester avec un modèle simple
3. Noter les messages d'erreur exact
4. Inclure les détails du fichier GLB (taille, source)

La fonctionnalité d'import GLB enrichit considérablement les possibilités créatives de WallSim3D en permettant l'intégration de modèles 3D professionnels dans vos projets de construction.
