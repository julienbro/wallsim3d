# Correction - Problème de saisie du caractère "R" dans les champs email

## Problème identifié
Le caractère "R" ne pouvait pas être saisi dans le champ email de démarrage de l'application à cause d'un conflit avec les raccourcis clavier.

## Cause
Le gestionnaire de raccourcis clavier (`KeyboardManager`) avait mappé la touche "R" pour faire tourner les éléments 3D. Même si le système était censé désactiver les raccourcis dans les champs de saisie, la logique de détection était incomplète.

## Solution appliquée
1. **Amélioration de la détection des champs de saisie** : Ajout d'une vérification directe dans `handleKeyDown()` pour détecter si l'utilisateur est dans un champ INPUT, TEXTAREA ou contentEditable.

2. **Correction des événements focusin/focusout** : Amélioration de la logique de désactivation/réactivation des raccourcis avec une détection plus robuste incluant la classe `email-input`.

3. **Logs de débogage** : Ajout de logs pour aider au débogage en cas de problèmes futurs.

## Fichiers modifiés
- `js/keyboard-manager.js` : Correction de la logique de gestion des raccourcis clavier

## Test
1. Ouvrir l'application
2. Aller dans le champ email au démarrage
3. Essayer de taper "R" - le caractère devrait maintenant s'afficher normalement
4. Vérifier que les autres caractères fonctionnent également

## Raccourcis clavier concernés
- **R** : Rotation d'élément (ne doit pas interférer avec la saisie)
- **Autres lettres** : Divers raccourcis qui pourraient causer des problèmes similaires

La correction garantit que tous les raccourcis clavier sont désactivés quand l'utilisateur saisit du texte dans n'importe quel champ de l'application.
