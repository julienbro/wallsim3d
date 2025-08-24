# Ajout du Poutrain Béton 12 - Documentation

## 📋 Vue d'ensemble

Le modèle GLB `poutrain_beton_12.glb` a été ajouté avec succès à la catégorie plancher de WallSim3D avec support complet de la variation de longueur, similaire aux hourdis.

## 🎯 Modifications apportées

### 1. Définition dans BrickSelector (`js/brick-selector.js`)

Ajout de la définition du poutrain béton dans les types de briques :

```javascript
'poutrain_beton_12': { 
    length: 120, 
    width: 12, 
    height: 12, 
    name: 'Poutrain béton 12', 
    category: 'glb', 
    customCut: true, 
    glbPath: 'assets/models/planchers/poutrain_beton_12.glb' 
}
```

**Propriétés :**
- **Dimensions par défaut** : 120×12×12 cm
- **Catégorie** : `glb` (modèle 3D)
- **Coupe personnalisée** : Activée (`customCut: true`)
- **Chemin du modèle** : `assets/models/planchers/poutrain_beton_12.glb`

### 2. Détection GLB (`js/glb-dpad-controller.js`)

Mise à jour de la fonction `isGLBElement` pour reconnaître le poutrain :

```javascript
element.type === 'poutrain_beton_12' ||
element.name?.includes('poutrain') ||
element.name?.includes('Poutrain') ||
element.userData?.glbInfo?.type === 'poutrain_beton_12'
```

### 3. Intégration Métré (`js/metre-tab-manager.js`)

Ajout de la détection et du traitement spécifique pour les poutrains :

```javascript
const isPoutrain = modelName.toLowerCase().includes('poutrain') || 
                  element.glbType?.toLowerCase().includes('poutrain') ||
                  element.userData?.glbInfo?.type?.toLowerCase().includes('poutrain') ||
                  element.type === 'poutrain_beton_12';
```

**Traitement spécialisé :**
- Format d'affichage : `Poutrain béton 12 (XXXcm)`
- Matériau : Béton (couleur `#8C7853`)
- Calcul de masse : 2400 kg/m³ (densité du béton)
- Format dimensions : `LongueurxLargeurxHauteur`

### 4. Contrôle de hauteur (`js/height-control-manager.js`)

Extension pour inclure les poutrains dans les éléments de plancher GLB :

```javascript
glbType && (glbType.includes('hourdis') || glbType.includes('poutrain')) ||
element.name && (element.name.includes('hourdis') || element.name.includes('poutrain')) ||
element.userData?.glbInfo?.type?.includes('poutrain') ||
element.type === 'poutrain_beton_12'
```

## 🔧 Fonctionnalités disponibles

### ✅ Variation de longueur

Le poutrain béton 12 supporte la variation de longueur avec :

- **Longueurs prédéfinies** : 100cm, 200cm, 300cm, 400cm
- **Longueur personnalisée** : De 50cm à 1000cm par pas de 10cm
- **Interface utilisateur** : Boutons de sélection + champ personnalisé
- **Mise à l'échelle** : Automatique selon la longueur sélectionnée

### ✅ Intégration complète

- **Bibliothèque** : Accessible depuis l'onglet GLB/Planchers
- **Placement** : Positionnement 3D avec contrôles directionnels
- **Sélection** : Sélectionnable avec affichage des propriétés
- **Métré** : Comptabilisation automatique avec calculs de volume/masse
- **Sauvegarde** : Inclus dans les projets WallSim3D

## 📊 Données techniques

### Spécifications par défaut

| Propriété | Valeur |
|-----------|--------|
| Longueur par défaut | 120 cm |
| Largeur | 12 cm |
| Hauteur | 12 cm |
| Matériau | Béton |
| Densité | 2400 kg/m³ |
| Volume unitaire (120cm) | 0.017 m³ |
| Masse unitaire (120cm) | 41.5 kg |

### Plage de longueurs

| Type | Valeurs |
|------|---------|
| Standard | 100, 200, 300, 400 cm |
| Personnalisé | 50-1000 cm (par pas de 10) |
| Recommandé | 100-400 cm |

## 🎨 Interface utilisateur

### Dans la bibliothèque

Le poutrain béton apparaît dans :
- **Onglet** : Bibliothèque > GLB/Planchers
- **Nom affiché** : "Poutrain béton 12"
- **Icône** : Icône 3D standard avec prévisualisation

### Contrôles de placement

- **Position** : Curseurs X, Y, Z
- **Longueur** : Boutons 100/200/300/400 + personnalisé
- **Rotation** : Contrôles directionnels NESW
- **Hauteur** : Contrôle Y libre (non contraint aux assises)

### Dans le métré

Affichage format :
```
Poutrain béton 12 (200cm)
Matériau: béton
Dimensions: 200x12x12
Volume: 0.029 m³
Masse: 69.1 kg
```

## 🔄 Comparaison avec les hourdis

| Caractéristique | Hourdis 13-60 | Hourdis 16-60 | Poutrain béton 12 |
|-----------------|---------------|---------------|-------------------|
| Dimensions défaut | 60×13×1 cm | 60×16×1 cm | 120×12×12 cm |
| Variation longueur | ✅ | ✅ | ✅ |
| Détection GLB | ✅ | ✅ | ✅ |
| Contrôles Y | ✅ | ✅ | ✅ |
| Métré spécialisé | ✅ | ✅ | ✅ |
| Matériau | Béton | Béton | Béton |

## 🚀 Utilisation

### Étapes de placement

1. **Sélection** : Onglet Bibliothèque > GLB > Poutrain béton 12
2. **Longueur** : Choisir 100/200/300/400cm ou personnalisé
3. **Placement** : Cliquer dans la scène 3D
4. **Ajustement** : Utiliser les curseurs X/Y/Z si nécessaire
5. **Validation** : L'élément apparaît automatiquement dans le métré

### Modification post-placement

- **Sélection** : Clic avec l'outil de sélection
- **Propriétés** : Affichage dans l'onglet Propriétés
- **Repositionnement** : Curseurs directionnels
- **Longueur** : Modification via l'interface GLB

## 📈 Performance

Le poutrain béton 12 :
- ✅ **Léger** : Modèle optimisé pour les performances
- ✅ **Responsive** : Variation de longueur fluide
- ✅ **Compatible** : Tous navigateurs modernes
- ✅ **Stable** : Intégration sans conflit avec les autres éléments

## 🎯 Cas d'usage

### Applications recommandées

1. **Planchers** : Poutrains de support pour dalles
2. **Charpente** : Éléments structurels béton
3. **Préfabrication** : Éléments industriels standards
4. **Dimensionnement** : Calculs de charge avec longueurs variables

### Exemple de projet type

```
Plancher étage 1:
- 8× Poutrain béton 12 (300cm) = 8 × 0.043 m³ = 0.35 m³
- 12× Poutrain béton 12 (250cm) = 12 × 0.036 m³ = 0.43 m³
Total: 0.78 m³ béton, 1872 kg
```

## 📞 Support

Pour toute question concernant le poutrain béton 12 :

1. **Test d'intégration** : `test-poutrain-integration.html`
2. **Logs console** : Vérifier les messages de détection GLB
3. **Métré** : Contrôler l'affichage des propriétés calculées
4. **Performance** : Surveiller la fluidité de placement

---

**Statut** : ✅ Intégré et fonctionnel  
**Version** : 1.0  
**Date** : Août 2025  
**Compatibilité** : WallSim3D v5.1+
