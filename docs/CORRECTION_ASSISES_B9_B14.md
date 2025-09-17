# 🔧 CORRECTION ASSISES B9/B14 - Séparation par sous-types

## 📋 Problème identifié
Quand on posait un bloc B9, B14, B19 ou B29, il était automatiquement placé dans une assise générique **"CREUX"** au lieu d'être placé dans une assise spécifique à son sous-type (B9, B14, etc.).

## ✅ Solution implémentée

### 1. **Ajout des nouveaux sous-types de blocs**

**Fichier modifié :** `js/assise-manager.js` (ligne ~17)

```javascript
// AVANT
this.blockSubTypes = ['CREUX', 'CELLULAIRE', 'ARGEX', 'TERRE_CUITE'];

// APRÈS
this.blockSubTypes = ['CREUX', 'CELLULAIRE', 'ARGEX', 'TERRE_CUITE', 'B9', 'B14', 'B19', 'B29'];
```

### 2. **Ajout des hauteurs par défaut pour les nouveaux types**

**Fichier modifié :** `js/assise-manager.js` (lignes ~1207-1214)

```javascript
// Sous-types de blocs creux spécifiques par largeur
'B9': 19,         // Blocs creux B9 (largeur 9cm) - hauteur 19 cm
'B14': 19,        // Blocs creux B14 (largeur 14cm) - hauteur 19 cm
'B19': 19,        // Blocs creux B19 (largeur 19cm) - hauteur 19 cm
'B29': 19,        // Blocs creux B29 (largeur 29cm) - hauteur 19 cm
```

### 3. **Modification de la détection des sous-types**

**Fichier modifié :** `js/assise-manager.js` (fonction `detectBlockSubType`, lignes ~1285-1310)

```javascript
switch (category) {
    case 'hollow':
        // Blocs creux entiers : déterminer le type spécifique selon l'ID
        if (currentBlock.id) {
            if (currentBlock.id.startsWith('B9')) return 'B9';
            if (currentBlock.id.startsWith('B14')) return 'B14';
            if (currentBlock.id.startsWith('B19')) return 'B19';
            if (currentBlock.id.startsWith('B29')) return 'B29';
        }
        // Fallback vers le type générique
        return 'CREUX';
    case 'cut':
        // Pour les blocs coupés, déterminer le type selon l'origine
        if (currentBlock.id) {
            // Vérifier d'abord les blocs creux spécifiques (B9, B14, B19, B29)
            if (currentBlock.id.startsWith('B9')) return 'B9';
            if (currentBlock.id.startsWith('B14')) return 'B14';
            if (currentBlock.id.startsWith('B19')) return 'B19';
            if (currentBlock.id.startsWith('B29')) return 'B29';
            // ... autres types
        }
        // Fallback vers le type générique creux
        return 'CREUX';
}
```

### 4. **Modification du mapping dans BlockSelector**

**Fichier modifié :** `js/block-selector.js` (fonction `setBlock`, lignes ~416-430)

```javascript
// AVANT
case 'hollow':
case 'cut':
    assiseType = 'CREUX';
    break;

// APRÈS
case 'hollow':
case 'cut':
    // Déterminer le type spécifique selon l'ID du bloc
    if (type.startsWith('B9')) {
        assiseType = 'B9';
    } else if (type.startsWith('B14')) {
        assiseType = 'B14';
    } else if (type.startsWith('B19')) {
        assiseType = 'B19';
    } else if (type.startsWith('B29')) {
        assiseType = 'B29';
    } else {
        // Fallback vers le type générique CREUX
        assiseType = 'CREUX';
    }
    break;
```

### 5. **🔧 CORRECTION CRITIQUE dans ConstructionTools**

**Fichier modifié :** `js/construction-tools.js` (lignes ~4370-4390)

⚠️ **Problème identifié :** Une ancienne logique dans `construction-tools.js` écrasait notre correction en mappant tous les blocs `'hollow'` vers `'CREUX'`.

```javascript
// AVANT
case 'hollow':
    type = 'CREUX';
    break;

// APRÈS
case 'hollow':
    // Déterminer le type spécifique selon l'ID du bloc
    if (currentBlockType && currentBlockType.startsWith('B9')) {
        type = 'B9';
    } else if (currentBlockType && currentBlockType.startsWith('B14')) {
        type = 'B14';
    } else if (currentBlockType && currentBlockType.startsWith('B19')) {
        type = 'B19';
    } else if (currentBlockType && currentBlockType.startsWith('B29')) {
        type = 'B29';
    } else {
        type = 'CREUX'; // Fallback pour les blocs creux non spécifiques
    }
    break;
case 'cut':
    // Pour les blocs coupés, déterminer le type selon l'origine
    if (currentBlockType && currentBlockType.startsWith('B9')) {
        type = 'B9';
    } else if (currentBlockType && currentBlockType.startsWith('B14')) {
        type = 'B14';
    } // ... autres types B19, B29, etc.
```

### 6. **Correction de la sélection automatique**

**Fichier modifié :** `js/assise-manager.js` (fonction `selectDefaultObjectForType`, lignes ~628-635)

🔧 **Problème identifié :** La fonction forçait toujours la sélection du bloc "B14" par défaut.

```javascript
// AVANT
const defaultBlock = 'B14';

// APRÈS
let defaultBlock;
if (type === 'B9') {
    defaultBlock = 'B9';
} else if (type === 'B14') {
    defaultBlock = 'B14';
} else if (type === 'B19') {
    defaultBlock = 'B19';
} else if (type === 'B29') {
    defaultBlock = 'B29';
} else {
    // Fallback vers B14 pour les types génériques
    defaultBlock = 'B14';
}
```

### 7. **Ajout des labels pour les nouvelles assises**

**Fichier modifié :** `js/assise-manager.js` (fonction `getAssiseTypeLabelForType`, lignes ~4195-4205)

```javascript
// Sous-types de blocs creux spécifiques
'B9': 'Assise B9',
'B14': 'Assise B14',
'B19': 'Assise B19',
'B29': 'Assise B29'
```

## 🎯 Résultats attendus

Maintenant, quand on sélectionne et pose :

- **Un bloc B9** (entier ou coupé) → Il va dans l'**Assise B9**
- **Un bloc B14** (entier ou coupé) → Il va dans l'**Assise B14**  
- **Un bloc B19** (entier ou coupé) → Il va dans l'**Assise B19**
- **Un bloc B29** (entier ou coupé) → Il va dans l'**Assise B29**

Les blocs d'autres types (béton cellulaire, argex, etc.) continuent d'aller dans leurs assises respectives (CELLULAIRE, ARGEX, etc.).

## 🧪 Test de validation

Un fichier de test a été créé : `test-assise-correction.html`

Pour tester la correction :
1. Ouvrir l'application
2. Sélectionner un bloc B9, B14, B19 ou B29
3. Vérifier que l'assise active correspond au type du bloc sélectionné
4. Placer le bloc et confirmer qu'il apparaît dans la bonne assise

## 📝 Compatibilité

✅ **Rétrocompatibilité préservée :** Les blocs existants et les autres types continuent de fonctionner normalement.  
✅ **Interface utilisateur :** Aucune modification de l'interface nécessaire.  
✅ **Systèmes existants :** Points d'accrochage, joints, export STL inchangés.

## 🔄 Rollback possible

Si nécessaire, il suffit de :
1. Retirer `'B9', 'B14', 'B19', 'B29'` de `blockSubTypes`
2. Supprimer leurs entrées dans `defaultHeights`
3. Restaurer le mapping simple dans `block-selector.js`

La correction est **modulaire** et **réversible**.
