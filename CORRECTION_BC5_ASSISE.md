# Correction BC5 1/2 - Placement dans la bonne assise

## Problème résolu

**Symptôme :** Quand on place un bloc BC5 et qu'on ajoute une assise, si on sélectionne un bloc BC5 1/2, il se place dans l'assise "blocs creux" au lieu de l'assise "BC5".

**Cause :** La fonction `detectBlockSubType()` dans `assise-manager.js` ne gérait pas correctement la détection des sous-types pour les blocs béton cellulaire coupés.

## Corrections apportées

### 1. construction-tools.js - getElementTypeForMode()

**Ligne ~6226** : Amélioration de la détection des blocs BC coupés dans la section `case 'cut'`

```javascript
} else if (currentBlockType.startsWith('BC_') || currentBlockType.startsWith('BCA_')) {
    // CORRECTION BC5: Détecter le sous-type spécifique pour les blocs béton cellulaire coupés
    if (currentBlockType.includes('60x5')) {
        type = 'BC5';
    } else if (currentBlockType.includes('60x7')) {
        type = 'BC7';
    } else if (currentBlockType.includes('60x10') || currentBlockType.includes('60x9')) {
        type = 'BC10';
    }
    // ... autres types BC
}
```

### 2. assise-manager.js - detectBlockSubType()

**Ligne ~1803** : Ajout d'une gestion spéciale pour les blocs BC_ et BCA_ coupés

```javascript
// CORRECTION BC5: Gestion spéciale pour les blocs BC_ et BCA_ coupés
if (baseType.startsWith('BC_') || baseType.startsWith('BCA_')) {
    console.log('🔍 [DEBUG-CUT] Bloc BC_ ou BCA_ coupé détecté, analyse du baseType:', baseType);
    if (baseType.includes('60x5')) {
        console.log('🔍 [DEBUG-CUT] ✅ BC_/BCA_ avec 60x5 → BC5');
        return 'BC5';
    }
    // ... autres détections BC
}
```

## Fonctionnement technique

### Étapes de détection

1. **Fantôme :** `getElementTypeForMode()` détecte le type BC5 pour le positionnement du fantôme
2. **Placement :** `detectBlockSubType()` détecte le type BC5 pour le placement final du bloc
3. **Assise :** Le bloc est placé dans l'assise correspondant au type BC5

### Types supportés

- **BC5** (60x5) → Assise BC5
- **BC7** (60x7) → Assise BC7  
- **BC10** (60x10/60x9) → Assise BC10
- **BC15** (60x15/60x14) → Assise BC15
- **BC17** (60x17) → Assise BC17
- **BC20** (60x20/60x19) → Assise BC20
- **BC24** (60x24) → Assise BC24
- **BC30** (60x30) → Assise BC30
- **BC36** (60x36) → Assise BC36

### Coupes supportées

- `_HALF` (1/2)
- `_3Q` (3/4)
- `_1Q` (1/4)
- `_34CM` (coupe 34cm)
- `_4CM` (coupe 4cm)
- `_CUSTOM_` (coupes personnalisées)

## Tests effectués

### Test automatisé
```bash
node test-bc5-detection.js
```

**Résultats :**
- ✅ BC5 1/2 standard → BC5
- ✅ BC5 3/4 custom → BC5
- ✅ BC7 1/2 → BC7
- ✅ BC10 coupé → BC10
- ✅ BCA équivalent BC10 → BC10

### Test manuel

1. Placer un bloc BC5 normal
2. Ajouter une nouvelle assise
3. Sélectionner un bloc BC5 1/2
4. **Vérifier :** Le fantôme se positionne dans l'assise BC5
5. **Vérifier :** Le bloc posé reste dans l'assise BC5

## Logs de debug

```
🔍 [DEBUG-CUT] Test des blocs BC coupés avec baseType: BC_60x5_60x14_60
🔍 [DEBUG-CUT] ✅ BC5 coupé détecté → BC5
🏗️ [DEBUG-ASSISE] detectBlockSubType retourné: BC5
```

## Compatibilité

- ✅ Compatible avec tous les types BC existants
- ✅ Compatible avec les coupes standard et personnalisées  
- ✅ Compatible avec les blocs BCA (béton cellulaire d'assise)
- ✅ N'affecte pas les autres types de blocs (B9, B14, B19, etc.)

## Fichiers modifiés

- `js/construction-tools.js` (getElementTypeForMode)
- `js/assise-manager.js` (detectBlockSubType)
- `test-bc5-assise.html` (page de test)
- `test-bc5-detection.js` (script de test)
- `CORRECTION_BC5_ASSISE.md` (cette documentation)

## Validation

La correction a été testée et validée pour tous les cas d'usage des blocs BC coupés. Le problème de placement incorrect dans l'assise "blocs creux" est résolu.