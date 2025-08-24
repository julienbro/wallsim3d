# Menu Flottant d'Assise - Documentation

## 🎛️ Vue d'ensemble

Le menu flottant d'assise est une interface rapide et intuitive située à gauche de la barre latérale gauche qui permet de gérer efficacement les assises sans avoir besoin d'ouvrir l'onglet Assise complet.

## 📍 Localisation

- **Position** : Fixe, à gauche de la barre latérale gauche
- **Coordonnées** : 85px du bord gauche, centré verticalement
- **Z-index** : 9999 (au-dessus de la plupart des éléments)

## ✨ Fonctionnalités

### 1. Affichage de l'Assise Active
- **Type et numéro** : Affiche le type d'assise (M65, M50, etc.) et le numéro
- **Hauteur** : Indique la hauteur en centimètres
- **Statut** : Montre si l'assise est active avec le nombre d'éléments

### 2. Sélection d'Assise
- **Menu déroulant** : Liste toutes les assises disponibles pour le type actuel
- **Sélection rapide** : Clic pour basculer instantanément
- **Synchronisation** : Met à jour automatiquement l'onglet Assise

### 3. Ajout d'Assise
- **Bouton ➕** : Crée une nouvelle assise
- **Auto-activation** : Bascule automatiquement vers la nouvelle assise
- **Notification** : Confirme la création avec un message

### 4. Suppression d'Assise
- **Bouton ➖** : Supprime l'assise active
- **Protection** : Impossible de supprimer la dernière assise
- **Confirmation** : Demande confirmation si l'assise contient des éléments

### 5. Mode Sélection Spécial 🎯
- **Activation** : Bouton "📍 Sélectionner Assise"
- **Fonctionnement** : 
  - Désactive temporairement les restrictions d'assise
  - Permet de cliquer sur n'importe quel élément du mur
  - Place l'élément sélectionné dans l'assise active
- **Indicateurs visuels** :
  - Curseur en forme de croix
  - Bouton devient rouge "🎯 Mode Sélection ON"
- **Sortie** : Touche Échap ou re-clic sur le bouton

### 6. Réduction/Expansion
- **Bouton ←/→** : Réduit le menu à une icône compacte
- **Mode réduit** : 50px × 50px, seul le bouton d'expansion reste visible
- **Animation fluide** : Transition en douceur

## 🔧 Intégration Technique

### Synchronisation avec AssiseManager
```javascript
// Écoute les événements d'AssiseManager
document.addEventListener('assiseChanged', (e) => {
    this.updateDisplay();
});

document.addEventListener('assiseTypeChanged', (e) => {
    this.updateDisplay();
});
```

### Synchronisation avec TabManager
```javascript
// Bascule automatiquement vers l'onglet Assise
if (window.TabManager && window.TabManager.currentMainTab !== 'assise') {
    window.TabManager.switchMainTab('assise');
}
```

### Mode Sélection Sans Restriction
```javascript
// Sauvegarde et remplace temporairement la fonction canSelectElement
this.originalCanSelectElement = window.AssiseManager.canSelectElement.bind(window.AssiseManager);
window.AssiseManager.canSelectElement = () => true;
```

## 🎨 Design et Style

### Thème Moderne
- **Gradient de fond** : Dégradé sombre avec transparence
- **Bordures lumineuses** : Bleu avec effet de lueur
- **Backdrop filter** : Effet de flou en arrière-plan

### Animations
- **Hover effects** : Survol avec élévation et lueur
- **Transitions** : Cubic-bezier pour des mouvements naturels
- **Effets lumineux** : Passages de lumière sur les boutons

### Responsive
- **Écrans larges** : Position fixe centrée
- **Écrans moyens** : Repositionnement en haut à gauche
- **Adaptation mobile** : Taille réduite sur petits écrans

## 🚀 Utilisation

### Workflow Typique
1. **Placer des éléments** dans l'assise 0
2. **Ajouter une nouvelle assise** avec ➕
3. **Basculer entre assises** via le menu déroulant
4. **Utiliser le mode sélection** pour réorganiser facilement
5. **Réduire le menu** si besoin d'espace

### Mode Sélection Avancé
1. Cliquer sur "📍 Sélectionner Assise"
2. Le curseur devient une croix
3. Cliquer sur n'importe quel élément (brique, bloc, etc.)
4. L'élément est automatiquement déplacé vers l'assise active
5. Presser Échap pour sortir du mode

## ⚠️ Limitations

- **Un seul type d'assise** : Fonctionne avec le type d'assise actuel d'AssiseManager
- **Éléments 3D uniquement** : Le raycasting ne fonctionne qu'avec les objets mesh
- **Pas de multi-sélection** : Un élément à la fois en mode sélection

## 🔍 Débogage

### Console Logs
- `🎛️ Menu flottant d'assise initialisé`
- `🎯 Sélection assise X depuis le menu flottant`
- `🎯 Mode sélection d'assise activé/désactivé`
- `🔄 Élément X déplacé vers l'assise Y`

### Vérifications
```javascript
// Vérifier si le menu est disponible
console.log(window.FloatingAssiseMenu);

// État du mode sélection
console.log(window.FloatingAssiseMenu.isInSelectMode());

// Informations sur l'assise courante
console.log(window.FloatingAssiseMenu.getCurrentAssiseInfo());
```

## 🎯 Avantages

1. **Rapidité** : Accès immédiat aux fonctions d'assise
2. **Efficacité** : Pas besoin d'ouvrir l'onglet complet
3. **Flexibilité** : Mode sélection sans restrictions
4. **Visibilité** : Toujours visible et accessible
5. **Intégration** : Synchronisé avec tous les autres composants

Ce menu flottant améliore significativement l'expérience utilisateur en rendant la gestion des assises plus intuitive et accessible.
