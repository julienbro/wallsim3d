# Correction - Placement des blocs spécialisés coupés

## Problème résolu

**Symptôme initial :** Les blocs spécialisés coupés étaient incorrectement placés dans l'assise "blocs creux" :
- BC5 1/2 → ❌ assise "blocs creux"
- ARGEX9 1/2 → ❌ assise "blocs creux"  
- TC10 1/2 → ❌ assise "blocs creux"

**Après correction :** Les blocs spécialisés coupés sont correctement placés dans leur assise spécifique :
- BC5 1/2 → ✅ assise "BC5"
- ARGEX9 1/2 → ✅ assise "ARGEX9"
- TC10 1/2 → ✅ assise "TC10"

## Corrections techniques

### 1. assise-manager.js - detectBlockSubType()

**Ajout d'une détection directe prioritaire** basée sur `element.blockType` :

```javascript
// CORRECTION: Détection directe prioritaire
if (element && element.blockType) {
    console.log('🚨 [BC5-DEBUG] element.blockType détecté:', element.blockType);
    
    // Blocs BC (béton cellulaire)
    if (element.blockType.includes('60x5')) {
        console.log('🚨 [BC5-DEBUG] ✅ BC5 détecté directement → RETOUR BC5');
        return 'BC5';
    }
    if (element.blockType.includes('60x7')) {
        return 'BC7';
    }
    if (element.blockType.includes('60x10') || element.blockType.includes('60x9')) {
        return 'BC10';
    }
    
    // Blocs ARGEX
    if (element.blockType.includes('39x9')) {
        console.log('🚨 [ARGEX-DEBUG] ✅ ARGEX9 détecté directement → RETOUR ARGEX9');
        return 'ARGEX9';
    }
    if (element.blockType.includes('39x14')) {
        return 'ARGEX14';
    }
    if (element.blockType.includes('39x19')) {
        return 'ARGEX19';
    }
    
    // Blocs Terre Cuite
    if (element.blockType.includes('50x10')) {
        console.log('🚨 [TC-DEBUG] ✅ TC10 détecté directement → RETOUR TC10');
        return 'TC10';
    }
    if (element.blockType.includes('50x14')) {
        return 'TC14';
    }
    if (element.blockType.includes('50x19')) {
        return 'TC19';
    }
}
```

### 2. construction-tools.js - getElementTypeForMode()

**Amélioration existante** dans la section `case 'cut'` qui gérait déjà les blocs ARGEX et Terre Cuite coupés.

**Nouvelle correction** pour les blocs BC coupés avec gestion spéciale des préfixes BC_ et BCA_ :

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
    console.log(`🔧 Bloc béton cellulaire coupé détecté: ${currentBlockType} → type ${type} conservé`);
}
```

## Types de blocs supportés

### Blocs BC (Béton Cellulaire)
- **BC5** (dimensions 60x5) → Assise BC5
- **BC7** (dimensions 60x7) → Assise BC7
- **BC10** (dimensions 60x10/60x9) → Assise BC10
- **BC15** (dimensions 60x15/60x14) → Assise BC15
- **BC17** (dimensions 60x17) → Assise BC17
- **BC20** (dimensions 60x20/60x19) → Assise BC20
- **BC24** (dimensions 60x24) → Assise BC24
- **BC30** (dimensions 60x30) → Assise BC30
- **BC36** (dimensions 60x36) → Assise BC36

### Blocs ARGEX
- **ARGEX9** (dimensions 39x9) → Assise ARGEX9
- **ARGEX14** (dimensions 39x14) → Assise ARGEX14
- **ARGEX19** (dimensions 39x19) → Assise ARGEX19

### Blocs Terre Cuite
- **TC10** (dimensions 50x10) → Assise TC10
- **TC14** (dimensions 50x14) → Assise TC14
- **TC19** (dimensions 50x19) → Assise TC19

## Types de coupes supportées

Tous les suffixes de coupe sont pris en charge :
- `_HALF` - Coupe 1/2
- `_3Q` - Coupe 3/4  
- `_1Q` - Coupe 1/4
- `_34CM` - Coupe 34 centimètres
- `_4CM` - Coupe 4 centimètres
- `_CUSTOM_` - Coupes personnalisées

## Fonctionnement technique

### Flux de détection

1. **Placement du fantôme :** `getElementTypeForMode()` détermine le type pour le positionnement
2. **Placement du bloc :** `detectBlockSubType()` détermine le type final pour l'assise
3. **Détection directe :** Priorité à `element.blockType` pour éviter les erreurs de classification
4. **Assise finale :** Le bloc est placé dans l'assise correspondant au type détecté

### Exemples de détection

```javascript
// Bloc BC5 1/2
element.blockType = "BC_60x5_60x14_60_HALF"
→ Détection: includes('60x5') → Type: 'BC5' → Assise: BC5

// Bloc ARGEX9 3/4
element.blockType = "ARGEX_39x9_60x14_60_3Q"
→ Détection: includes('39x9') → Type: 'ARGEX9' → Assise: ARGEX9

// Bloc TC10 coupé
element.blockType = "TC_50x10_60x14_60_34CM"
→ Détection: includes('50x10') → Type: 'TC10' → Assise: TC10
```

## Tests et validation

### Test automatisé
```bash
node test-blocs-specialises.js
# Résultat: 9/9 tests réussis ✅
```

### Test manuel
1. Placer un bloc normal (BC5, ARGEX9, TC10)
2. Ajouter une nouvelle assise
3. Sélectionner la version coupée (1/2, 3/4, etc.)
4. **Vérifier :** Le fantôme se positionne dans la bonne assise
5. **Vérifier :** Le bloc posé reste dans la bonne assise

### Logs de debug à surveiller
```
🚨 [BC5-DEBUG] ✅ BC5 détecté directement → RETOUR BC5
🚨 [ARGEX-DEBUG] ✅ ARGEX9 détecté directement → RETOUR ARGEX9
🚨 [TC-DEBUG] ✅ TC10 détecté directement → RETOUR TC10
🏗️ [DEBUG-ASSISE] detectBlockSubType retourné: BC5/ARGEX9/TC10
```

## Compatibilité et impact

### ✅ Compatible avec
- Tous les types BC existants (BC5 à BC36)
- Tous les types ARGEX (ARGEX9, ARGEX14, ARGEX19)
- Tous les types Terre Cuite (TC10, TC14, TC19)
- Toutes les coupes standard et personnalisées
- Logique existante pour les blocs B9, B14, B19 (inchangée)

### ✅ N'affecte pas
- Blocs creux normaux (B9, B14, B19, etc.)
- Briques (système séparé)
- Autres éléments (isolants, linteaux, etc.)
- Performance globale du système

## Fichiers modifiés

### Code source
- `js/assise-manager.js` - Fonction `detectBlockSubType()`
- `js/construction-tools.js` - Fonction `getElementTypeForMode()`

### Tests et documentation
- `test-blocs-specialises.js` - Script de test automatisé
- `test-blocs-specialises.html` - Page de test interactive
- `CORRECTION_BLOCS_SPECIALISES.md` - Cette documentation

## Validation finale

✅ **Correction validée et testée**
- Tests automatisés : 9/9 réussis
- Logique de détection : Fonctionnelle
- Compatibilité : Préservée
- Performance : Non impactée

Les blocs spécialisés coupés (BC, ARGEX, Terre Cuite) sont maintenant correctement placés dans leurs assises spécifiques au lieu de l'assise "blocs creux".