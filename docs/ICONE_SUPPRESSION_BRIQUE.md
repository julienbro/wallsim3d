# Icône de Suppression de Brique - Documentation

## 🎯 Fonctionnalité

Lorsqu'on clique sur une brique pour afficher les briques adjacentes, une **icône de corbeille** apparaît près de la brique sélectionnée permettant de la supprimer ainsi que tous ses joints liés.

## ✨ Caractéristiques

### 🖱️ Activation
- **Déclencheur** : Clic sur une brique qui active les suggestions adjacentes
- **Position** : L'icône apparaît au-dessus et à droite de la brique sélectionnée
- **Visibilité** : L'icône suit les mouvements de la caméra et reste toujours visible

### 🎨 Apparence
- **Forme** : Icône ronde rouge avec bordure
- **Icône** : FontAwesome `fa-trash`
- **Animation** : Pulsation douce pour attirer l'attention
- **Survol** : Agrandissement et intensification de l'ombrage

### 🗑️ Suppression
- **Action** : Clic sur l'icône
- **Effet** : Supprime la brique ET tous ses joints liés automatiquement
- **Sécurité** : Vérifie les permissions (éléments d'assises inférieures protégés)
- **Notification** : Message de confirmation indiquant le nombre d'éléments supprimés

## 🔧 Implémentation Technique

### Fichiers Modifiés

#### `js/construction-tools.js`
**Nouvelles méthodes ajoutées :**
- `showDeleteIcon(element)` - Affiche l'icône près de la brique
- `updateDeleteIconPosition(element)` - Met à jour la position 2D de l'icône
- `hideDeleteIcon()` - Masque et supprime l'icône
- `deleteBrickWithJoints(element)` - Supprime la brique et ses joints
- `findAssociatedJoints(element)` - Trouve tous les joints liés à un élément
- `removeElementFromManagers(element, elementId)` - Supprime des différents managers
- `showNotification(message, type)` - Affiche une notification temporaire
- `setupDeleteIconListeners()` - Configure les listeners de mise à jour de position

**Méthodes modifiées :**
- `activateSuggestionsForBrick()` - Appelle `showDeleteIcon()`
- `clearSuggestions()` - Appelle `hideDeleteIcon()`
- `deactivateSuggestions()` - Appelle `hideDeleteIcon()`
- `init()` - Appelle `setupDeleteIconListeners()`

**Variables ajoutées :**
- `currentDeleteIcon` - Référence vers l'élément DOM de l'icône
- `currentDeleteIconElement` - Référence vers la brique associée
- `deleteIconUpdateListener` - Référence vers le listener de mise à jour

#### `styles/modern-interface.css`
**Nouveaux styles ajoutés :**
- `.brick-delete-icon` - Style principal de l'icône
- `.brick-delete-icon:hover` - Effet de survol
- `.brick-delete-icon:active` - Effet de clic
- `@keyframes brickDeletePulse` - Animation de pulsation
- `@keyframes brickDeleteAppear` - Animation d'apparition
- `.construction-notification-*` - Styles pour les notifications

## 🎮 Utilisation

### Pour l'Utilisateur
1. **Activer** : Cliquez sur une brique dans la scène 3D
2. **Observer** : L'icône de corbeille rouge apparaît près de la brique
3. **Supprimer** : Cliquez sur l'icône de corbeille
4. **Confirmer** : Une notification indique la suppression réussie

### Comportements
- **Suivi automatique** : L'icône suit la brique lors des mouvements de caméra
- **Désactivation** : L'icône disparaît quand on clique ailleurs ou sur le dos de la brique
- **Protection** : Impossible de supprimer les éléments d'assises inférieures
- **Nettoyage** : Suppression automatique de tous les joints liés

## 🛡️ Sécurité

### Vérifications
- **Permissions AssiseManager** : Vérification via `canSelectElement()`
- **Éléments valides** : Vérification de l'existence de l'élément et de son ID
- **Gestion d'erreurs** : Try-catch pour les opérations de suppression

### Limitations
- **Éléments protégés** : Les éléments d'assises inférieures ne peuvent pas être supprimés
- **Éléments système** : Les éléments de base de la scène sont protégés
- **Validation** : Vérification de l'intégrité avant suppression

## 📱 Responsive

### Adaptation
- **Position dynamique** : Calcul en temps réel des coordonnées 2D
- **Projection 3D→2D** : Utilisation de `vector.project()` de Three.js
- **Redimensionnement** : Mise à jour automatique lors du resize de la fenêtre
- **Débordement** : L'icône reste dans les limites de l'écran

## 🔄 Intégration

### Compatibilité
- **SceneManager** : Suppression des éléments de la scène
- **LayerManager** : Notification de suppression d'éléments
- **MetreTabManager** : Mise à jour automatique du métré
- **AssiseManager** : Respect des règles d'assises

### Événements
- **Désactivation automatique** : Lors de `clearSuggestions()` ou `deactivateSuggestions()`
- **Mise à jour position** : Lors des événements de caméra et de redimensionnement
- **Notifications** : Messages informatifs pour l'utilisateur

## 🎯 Avantages

### Ergonomie
- **Accès direct** : Suppression en un clic depuis la vue 3D
- **Contextuel** : L'icône n'apparaît que quand nécessaire
- **Intuitif** : Icône universelle de corbeille
- **Visuel** : Animation claire et feedback immédiat

### Fonctionnel
- **Suppression complète** : Brique + joints automatiquement
- **Sécurité** : Protections contre les suppressions accidentelles
- **Performance** : Mise à jour optimisée de la position
- **Intégration** : Compatible avec tous les systèmes existants

## 📊 Performance

### Optimisations
- **Projection unique** : Calcul de position seulement quand nécessaire
- **Événements throttled** : Mise à jour position avec délais appropriés
- **DOM minimal** : Une seule icône à la fois
- **Nettoyage automatique** : Suppression des listeners et références

## 🚀 Extensions Futures

### Améliorations Possibles
- **Multi-sélection** : Support de plusieurs briques simultanément
- **Animations avancées** : Effets visuels lors de la suppression
- **Confirmation modale** : Dialog de confirmation pour suppressions importantes
- **Raccourcis clavier** : Touche Suppr pour supprimer l'élément sélectionné

---

**Date de création :** 2 septembre 2025  
**Version :** 1.0  
**Statut :** ✅ Implémenté et testé
