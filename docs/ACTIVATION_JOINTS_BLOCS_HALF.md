# Activation Automatique des Joints Verticaux pour les Blocs 1/2

## Description

Cette fonctionnalité active automatiquement les joints verticaux lorsqu'un bloc 1/2 est placé à partir du système de proposition. Le bloc 1/2 est alors considéré comme adjacent au bloc d'origine et le joint vertical approprié s'active automatiquement.

## Fonctionnement

### Détection des Blocs 1/2

Le système détecte les blocs 1/2 par plusieurs critères :

1. **Par blockType** : Éléments avec `_HALF` dans le nom (ex: `B14_HALF`)
2. **Par type** : Éléments avec `_HALF` dans le type
3. **Par id** : Éléments avec `_HALF` dans l'identifiant
4. **Par userData** : Vérification dans `userData.blockType`
5. **Par dimensions** : Blocs avec une longueur de 19cm (standard pour les blocs 1/2)
6. **Via BlockSelector** : Bloc actuellement sélectionné contenant `_HALF`

### Activation des Joints

Quand un bloc 1/2 est placé via le système de proposition :

1. **Détection automatique** : Le système détecte qu'un bloc 1/2 a été placé
2. **Calcul de position** : Détermine la position relative par rapport au bloc d'origine
3. **Détermination du côté** : Calcule si le joint doit être à gauche ou à droite
4. **Activation des joints** : 
   - Active le joint vertical sur le bloc d'origine (côté approprié)
   - Active le joint vertical sur le bloc 1/2 (côté opposé)
5. **Interface utilisateur** : Active automatiquement le toggle switch correspondant

### Logique de Détermination du Côté

Le système utilise plusieurs méthodes pour déterminer quel côté activer :

1. **Position relative** : Compare les positions X et Z dans le référentiel local
2. **Lettre de suggestion** : Utilise la lettre de la suggestion (A, B, C, etc.)
3. **Mapping des lettres** :
   - **Côté gauche** : C, D, H, M, P, V
   - **Côté droit** : E, F, I, N, Q, S, U

### Activation de l'Interface

Le système active également l'interface de contrôle correspondante :

```html
<div class="joint-option" data-joint="right">
    <div class="joint-toggle">
        <div class="toggle-switch">
            <span class="toggle-slider"></span>
        </div>
    </div>
    <div class="joint-info">
        <span class="joint-title">Joint debout droite</span>
        <span class="joint-description">Contrôle l'affichage du joint vertical droit</span>
    </div>
    <div class="joint-icon">
        <i class="fas fa-grip-lines-vertical"></i>
    </div>
</div>
```

## Cas d'Usage

### 1. Placement via Suggestion

```
1. Placer un bloc entier (ex: B14)
2. Cliquer sur le bloc pour voir les suggestions
3. Sélectionner un bloc 1/2 (ex: B14_HALF) 
4. Placer le bloc 1/2 à partir d'une position de suggestion
→ Les joints verticaux s'activent automatiquement
```

### 2. Placement Direct

```
1. Sélectionner un bloc 1/2 dans le sélecteur
2. Placer le bloc directement dans la scène
3. Si un bloc adjacent est détecté (< 50cm), les joints s'activent
4. Sinon, les joints gauche et droite s'activent par défaut
```

## Code Implémenté

### Méthodes Principales

1. **`isHalfBlock(element)`** : Détecte si un élément est un bloc 1/2
2. **`activateVerticalJointForHalfBlock(halfBlock, originalBlock, suggestionType, suggestionLetter)`** : Active les joints pour un bloc 1/2
3. **`activateJointControlInterface(side)`** : Active l'interface de contrôle
4. **`findClosestAdjacentBlock(halfBlock)`** : Trouve le bloc adjacent le plus proche

### Points d'Intégration

1. **Placement avec animation** : Dans `animateSuggestionPlacement` callback
2. **Placement sans animation** : Dans le fallback de placement
3. **Placement direct** : Dans la méthode `addElement`

## Avantages

1. **Automatisation complète** : Plus besoin d'activer manuellement les joints
2. **Détection intelligente** : Reconnaît automatiquement les blocs 1/2
3. **Interface synchronisée** : L'interface utilisateur reflète l'état réel
4. **Compatibilité** : Fonctionne avec tous les types de blocs 1/2
5. **Robustesse** : Multiples méthodes de détection pour plus de fiabilité

## Exemples de Blocs Supportés

- `B9_HALF` : Bloc creux B9 1/2
- `B14_HALF` : Bloc creux B14 1/2  
- `B19_HALF` : Bloc creux B19 1/2
- `B29_HALF` : Bloc creux B29 1/2
- Tous les autres blocs avec suffix `_HALF`

## Debug et Logs

Le système génère des logs détaillés pour le debug :

```
🔧 Bloc 1/2 détecté via système de proposition - Activation automatique du joint vertical
🔧 Activation joint vertical pour bloc 1/2: {halfBlockId: "...", originalBlockId: "..."}
🔧 Côté de joint déterminé: right {localDx: "12.34", localDz: "5.67", suggestionLetter: "A"}
✅ Joint vertical droit activé sur le bloc original
✅ Joint vertical gauche activé sur le bloc 1/2
✅ Interface de contrôle du joint right activée
```

## Tests Recommandés

1. **Test placement suggestion** : Placer un bloc entier, puis un bloc 1/2 via suggestion
2. **Test placement direct** : Placer directement un bloc 1/2 près d'un bloc existant
3. **Test différents blocs** : Tester avec B9_HALF, B14_HALF, B19_HALF, etc.
4. **Test interface** : Vérifier que les toggles s'activent correctement
5. **Test orientations** : Tester avec différentes rotations de blocs

Cette fonctionnalité améliore significativement l'expérience utilisateur en automatisant l'activation des joints verticaux pour les blocs 1/2, rendant le processus de construction plus fluide et intuitif.
