# Système de Joints Automatiques - Documentation

## Vue d'ensemble

Le système de joints automatiques utilise **exactement la même logique** que le système manuel existant. Il a été implémenté en copiant et adaptant le code des méthodes `createJointOnlySuggestions()` et `placeVerticalJoint()` du fichier `construction-tools.js`.

## Architecture

### 1. Méthode principale : `addAutomaticJoints(element)`

**Rôle :** Point d'entrée pour ajouter automatiquement des joints à un élément.

**Fonctionnement :**
- Vérifie que l'élément est de type 'brick' ou 'block'
- Appelle `calculateJointPositionsLikeManual()` pour obtenir les positions
- Crée chaque joint avec `createAutomaticJointFromSuggestion()`
- Retourne le nombre de joints créés

```javascript
addAutomaticJoints(element) {
    // Validation et calcul des positions
    const jointPositions = this.calculateJointPositionsLikeManual(element);
    
    // Création des joints
    jointPositions.forEach((jointData) => {
        this.createAutomaticJointFromSuggestion(jointData, element);
    });
}
```

### 2. Méthode de calcul : `calculateJointPositionsLikeManual(element)`

**Rôle :** Calcule les positions des joints en reproduisant exactement la logique de `createJointOnlySuggestions()`.

**Logique reproduite :**

#### A. Calcul du centre de la brique
```javascript
// Offset du centre par rapport au coin inférieur gauche AVANT
let centerOffsetX = dims.length / 2;  // vers la droite
let centerOffsetZ = -dims.width / 2;  // vers l'avant

// Application de la rotation
const rotatedCenterOffsetX = centerOffsetX * cos - centerOffsetZ * sin;
const rotatedCenterOffsetZ = centerOffsetX * sin + centerOffsetZ * cos;

// Position du centre
const brickCenter = {
    x: basePos.x + rotatedCenterOffsetX,
    y: basePos.y,
    z: basePos.z + rotatedCenterOffsetZ
};
```

#### B. Calcul des joints verticaux
- **Logique :** Toujours placer aux extrémités des panneresses (faces longues)
- **Dimensions :** `length: dims.width, width: 1cm, height: dims.height`
- **Positions locales :** 
  - Droite : `x: dims.length/2 + 0.5, z: 0`
  - Gauche : `x: -(dims.length/2 + 0.5), z: 0`
- **Rotation :** `rotation + π/2` (perpendiculaire à la brique)

#### C. Calcul du joint horizontal
- **Recherche de l'assise :** Parcours des `AssiseManager.elementsByType`
- **Calcul du plan zéro :** Hauteur cumulée des assises précédentes
- **Hauteur du joint :** Distance entre plan zéro et face inférieure de l'élément
- **Position Y :** `planZeroAssise + hauteurJoint/2`

### 3. Méthode de création : `createAutomaticJointFromSuggestion()`

**Rôle :** Crée physiquement le joint en reproduisant exactement la logique de `placeVerticalJoint()`.

**Étapes reproduites :**

#### A. Conversion position centre → coin inférieur gauche avant
```javascript
// Offset inverse de updateMeshPosition
let offsetX = -jointData.dimensions.length / 2;  // vers la gauche
let offsetZ = jointData.dimensions.width / 2;    // vers l'arrière

// Application de la rotation inverse
const rotatedOffsetX = offsetX * cos - offsetZ * sin;
const rotatedOffsetZ = offsetX * sin + offsetZ * cos;

// Position du coin
const cornerX = jointData.position.x + rotatedOffsetX;
const cornerZ = jointData.position.z + rotatedOffsetZ;
```

#### B. Calcul correct de la position Y pour joints verticaux
```javascript
if (jointData.isVerticalJoint) {
    // Calcul du plan zéro réel selon l'assise
    let planZeroReel = 0;
    for (let i = 1; i <= referenceAssiseIndex; i++) {
        const elementHeight = AssiseManager.getDefaultElementHeight(type);
        const jointHeight = AssiseManager.getJointHeightForAssise(type, i-1);
        planZeroReel += elementHeight + jointHeight;
    }
    
    // Hauteur totale du joint
    const sommeBlocY = referenceElement.position.y + referenceElement.dimensions.height / 2;
    const hauteurJointComplete = sommeBlocY - planZeroReel;
    
    // Position Y corrigée
    finalY = planZeroReel + hauteurJointComplete / 2;
    finalHeight = hauteurJointComplete;
}
```

#### C. Création et placement
- **Création :** `new WallElement()` avec position coin et dimensions exactes
- **Marquage :** `isVerticalJoint` / `isHorizontalJoint` flags
- **Assise :** Placement dans la même assise que l'élément de référence
- **Collision :** Vérification avant placement définitif

## Intégration automatique

### Modification de `SceneManager.addElement()`

```javascript
// Ajout automatique des joints si activé
if (window.ConstructionTools && 
    window.ConstructionTools.autoJoints && 
    (element.type === 'brick' || element.type === 'block') &&
    !element.isVerticalJoint && 
    !element.isHorizontalJoint) {
    
    setTimeout(() => {
        window.ConstructionTools.addAutomaticJoints(element);
    }, 50);
}
```

**Conditions :**
- Joints automatiques activés (`autoJoints = true`)
- Élément de type 'brick' ou 'block'
- L'élément n'est pas lui-même un joint
- Délai de 50ms pour s'assurer que l'élément est complètement ajouté

## Configuration

### Activation/Désactivation
```javascript
// Activer les joints automatiques
window.ConstructionTools.setAutoJoints(true);

// Désactiver les joints automatiques  
window.ConstructionTools.setAutoJoints(false);

// Vérifier l'état
console.log(window.ConstructionTools.autoJoints);
```

### Utilisation manuelle
```javascript
// Créer des joints pour un élément spécifique
window.ConstructionTools.addAutomaticJoints(element);

// Calculer seulement les positions (sans créer)
const positions = window.ConstructionTools.calculateJointPositionsLikeManual(element);

// Créer un joint à partir de données calculées
window.ConstructionTools.createAutomaticJointFromSuggestion(jointData, referenceElement);
```

## Tests et Validation

### Fichier de test : `test-joints-automatiques.html`

**Tests disponibles :**
1. **Placement d'une brique** - Vérifier la création des 3 joints (2 verticaux + 1 horizontal)
2. **Placement multiple** - Tester la performance avec plusieurs éléments
3. **Éléments mixtes** - Briques et blocs ensemble
4. **Comparaison manuelle** - Valider que automatique = manuel
5. **Nettoyage** - Vider la scène pour recommencer

**Script de test :** `test-joints-automatiques.ps1`
- Lance l'interface de test dans le navigateur
- Affiche les instructions et validations à effectuer

### Validation de la logique

**Points de contrôle :**
- ✅ Calcul du centre de brique identique
- ✅ Positions des joints verticaux identiques  
- ✅ Position du joint horizontal identique
- ✅ Gestion des assises et hauteurs identique
- ✅ Conversion centre → coin identique
- ✅ Calcul position Y pour joints verticaux identique

## Avantages

1. **Cohérence parfaite** : Utilise exactement la même logique que le système manuel
2. **Automatisation complète** : Aucune intervention manuelle nécessaire
3. **Configuration flexible** : Peut être activé/désactivé selon les besoins
4. **Performance** : Création immédiate des joints lors du placement
5. **Compatibilité** : Fonctionne avec tous les types d'éléments supportés (briques, blocs)

## Fichiers modifiés

- **`js/construction-tools.js`** : Ajout des 3 nouvelles méthodes
- **`js/scene-manager.js`** : Intégration dans `addElement()`
- **`test-joints-automatiques.html`** : Interface de test et validation
- **`test-joints-automatiques.ps1`** : Script de lancement des tests

Le système est prêt à l'emploi et reproduit fidèlement la logique du système manuel existant.
