# Restriction des suggestions pour les blocs spécialisés

## Description de la modification

Cette modification implémente une restriction des suggestions de blocs fantômes pour les matériaux spécialisés :
- **Béton cellulaire** (BC_*)
- **Béton cellulaire d'assise** (BCA_*)  
- **Terre cuite** (TC_*, TERRE_CUITE)
- **Argex** (ARGEX*)

## Comportement

### Avant la modification
Tous les blocs proposaient :
- Positions de continuité (A, B)
- Positions perpendiculaires (C, D, E, F)
- Positions d'angle (G, H, I, J pour panneresse / S, T, U, V pour boutisse)

### Après la modification
Les blocs de matériaux spécialisés ne proposent que :
- **Positions de continuité adjacente uniquement** (A et B)
- **Aucune position perpendiculaire** ni d'angle

### Blocs non affectés
Les blocs creux (hollow - B9, B14, B19, B29) conservent leur comportement complet avec toutes les suggestions.

## Implémentation technique

### Nouvelle fonction utilitaire
```javascript
getBlockMaterialType(element)
```
Cette fonction détermine le type de matériau d'un bloc en analysant :
1. La propriété `blockType` de l'élément
2. Les données du `BlockSelector`
3. L'ID de l'élément pour extraction du type

### Modifications dans createPlacementSuggestions()

1. **Détection du matériau spécialisé** :
```javascript
const materialType = this.getBlockMaterialType(hoveredElement);
const isSpecializedMaterial = materialType && ['cellular', 'cellular-assise', 'argex', 'terracotta'].includes(materialType);
```

2. **Filtrage des positions de base** :
```javascript
if (isSpecializedMaterial) {
    localPositions = localPositions.filter(pos => 
        pos.type === 'continuation' && (pos.key === 'A' || pos.key === 'B')
    );
}
```

3. **Exclusion des suggestions d'angle** :
Les conditions des sections d'angle incluent maintenant `!isSpecializedMaterial` :
- Angles panneresse : `!isBoutisse && this.currentMode !== 'insulation' && !isSpecializedMaterial`
- Angles boutisse : `isBoutisse && this.currentMode !== 'insulation' && !isSpecializedMaterial`
- Remapping B29 boutisse : `isBoutisse && this.currentMode !== 'insulation' && !isSpecializedMaterial`

## Logs de diagnostic

La modification ajoute des logs informatifs :
```
🔧 RESTRICTION MATÉRIAU: Élément de type cellular détecté - suggestions limitées aux adjacents de continuité
🔧 FILTRAGE SPÉCIALISÉ: Application du filtre pour matériau cellular - positions limitées à la continuité  
🔧 FILTRAGE SPÉCIALISÉ: 8 suggestions → 2 suggestions (continuité uniquement)
```

## Tests

Pour tester la fonctionnalité :

1. Placer un bloc de béton cellulaire (BC_*) 
2. Cliquer dessus pour activer les suggestions
3. Vérifier que seules les positions A et B (continuité) sont proposées
4. Répéter avec les autres types (BCA_*, ARGEX*, TC_*)
5. Vérifier qu'un bloc creux (B9, B14, B19) conserve toutes les suggestions

## Fichiers modifiés

- `js/construction-tools.js` : Ajout de `getBlockMaterialType()` et modifications dans `createPlacementSuggestions()`

## Compatibilité

Cette modification est rétrocompatible et n'affecte que les nouveaux comportements de suggestion. Les blocs existants dans les projets ne sont pas impactés.