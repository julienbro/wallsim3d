# Nouvelle Fonctionnalité - Joint Horizontal Automatique

## Description
Lorsque l'utilisateur effectue un **Ctrl+clic sur une brique**, le système propose maintenant automatiquement un **joint horizontal sous la brique** en plus des joints verticaux existants.

## Fonctionnement

### Activation
- **Ctrl+clic** sur n'importe quelle brique placée dans la scène
- Le système active le mode joints et affiche les suggestions

### Suggestions de joints générées
1. **Joints verticaux** (existant) :
   - Joint debout à droite de la brique (orange)
   - Joint debout à gauche de la brique (orange)

2. **Joint horizontal** (nouveau) :
   - Joint sous la brique avec la même surface au sol
   - Couleur bleue distinctive
   - Épaisseur = épaisseur du joint de l'assise courante

### Caractéristiques du joint horizontal

#### Dimensions
- **Longueur** : Identique à la longueur de la brique
- **Largeur** : Identique à la largeur de la brique  
- **Hauteur** : Épaisseur du joint de l'assise (par défaut 1.2 cm)

#### Position
- Centré sous la brique de référence
- Y = position brique - épaisseur_joint/2
- Même orientation (rotation) que la brique

#### Apparence
- **Couleur** : Bleu (#0088ff) pour le distinguer des joints verticaux
- **Transparence** : 50% (légèrement plus transparent que les joints verticaux)
- **Matériau final** : Beige clair une fois placé (comme tous les joints)

## Exemple d'utilisation

```
1. Placer une brique M65 (19×6.5×9 cm) dans la scène
2. Ctrl+clic sur cette brique
3. Le système affiche :
   - 2 joints verticaux orange (1×6.5×9 cm)
   - 1 joint horizontal bleu (19×9×1.2 cm)
4. Cliquer sur le joint horizontal bleu pour le placer
```

## Variables dynamiques

### Épaisseur du joint
L'épaisseur du joint horizontal s'adapte automatiquement :
- Lecture de `window.AssiseManager.jointHeight`
- Valeur par défaut : 1.2 cm si AssiseManager non disponible
- Peut être modifiée via l'interface "Hauteur joint (cm)" dans le panneau de contrôle

### Surface du joint
La surface du joint s'adapte au type de brique :
- Brique M50 : 19×9 cm → Joint horizontal 19×9×1.2 cm
- Brique M65 : 19×9 cm → Joint horizontal 19×9×1.2 cm  
- Brique M90 : 19×9 cm → Joint horizontal 19×9×1.2 cm
- Bloc B9 : 39×9 cm → Joint horizontal 39×9×1.2 cm
- etc.

## Code modifié

### Fichier : `construction-tools.js`
- **Méthode modifiée** : `createJointOnlySuggestions(element)`
- **Nouveau code** : Ajout automatique du joint horizontal
- **Méthode modifiée** : `createJointGhost(position, rotation, dimensions, isHorizontal)`
- **Nouveau paramètre** : `isHorizontal` pour différencier la couleur

### Logique ajoutée
```javascript
// Dimensions du joint horizontal - même surface au sol que la brique
const jointHorizontalDimensions = {
    length: dims.length, // Même longueur que la brique
    width: dims.width,   // Même largeur que la brique
    height: jointHorizontal // Épaisseur du joint de l'assise
};

// Position du joint horizontal - centré sous la brique
const jointHorizontalPosition = {
    x: brickCenter.x,
    y: brickCenter.y - jointHorizontal/2, // Positionné sous la brique
    z: brickCenter.z
};
```

## Intégration

### Aucune modification UI requise
- Utilise la modale de coupe personnalisée existante
- S'intègre au système de suggestions existant
- Compatible avec le système de placement existant

### Raccourcis clavier
- **Ctrl+clic** : Active le mode joints (vertical + horizontal)
- **Échap** : Annule le mode joints
- **Clic normal** : Place le joint sélectionné

## Tests recommandés

1. **Test basique** :
   - Placer une brique, Ctrl+clic, vérifier les 3 suggestions

2. **Test différentes briques** :
   - Tester avec M50, M65, M90 pour vérifier l'adaptation des dimensions

3. **Test rotation** :
   - Placer une brique en boutisse, vérifier que le joint horizontal suit la rotation

4. **Test épaisseur joint** :
   - Modifier la hauteur du joint dans l'interface, vérifier la mise à jour

5. **Test placement** :
   - Placer effectivement le joint horizontal et vérifier sa position/couleur

Cette fonctionnalité améliore significativement le workflow de construction en automatisant la création des joints horizontaux, éléments essentiels pour la réalisme de la construction.
