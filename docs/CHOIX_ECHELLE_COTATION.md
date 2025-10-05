# Choix de l'échelle de cotation

## 📏 Description

Cette fonctionnalité permet à l'utilisateur de choisir l'échelle à laquelle il souhaite coter (1/20 ou 1/50) lors de l'activation de l'outil de mesure. Selon l'échelle choisie, la taille des éléments de cotation (têtes de flèches, textes, lignes) est automatiquement adaptée pour une meilleure lisibilité sur les plans.

## ✨ Fonctionnalité

### Modale de sélection d'échelle

Lorsque l'utilisateur clique sur l'outil de mesure pour la première fois, une modale s'affiche avec deux options :

1. **Échelle 1/20** - Pour les détails agrandis
   - Éléments de cotation plus grands (×1.5)
   - Idéal pour les plans de détail
   
2. **Échelle 1/50** - Pour les vues d'ensemble
   - Éléments de cotation de taille standard
   - Idéal pour les plans d'ensemble

### Adaptation automatique des tailles

Une fois l'échelle choisie, tous les éléments de cotation sont automatiquement dimensionnés :

#### Échelle 1/50 (taille standard)
- **Texte** : Scale = 30, Height = 8
- **Offset d'étiquette de dimension** : 2.0
- **Offset d'étiquette de mesure** : 1.5
- **Taille des flèches** : 2.5
- **Épaisseur des lignes** : 4

#### Échelle 1/20 (taille agrandie ×1.5)
- **Texte** : Scale = 45, Height = 12
- **Offset d'étiquette de dimension** : 3.0
- **Offset d'étiquette de mesure** : 2.25
- **Taille des flèches** : 3.75
- **Épaisseur des lignes** : 4

## 🎯 Utilisation

### Première utilisation
1. Cliquer sur l'outil de mesure (icône règle ou touche `M`)
2. Une modale s'affiche avec le choix de l'échelle
3. Sélectionner l'échelle souhaitée (1/20 ou 1/50)
4. L'outil de mesure s'active avec les paramètres de l'échelle choisie

### Changement d'échelle
- Pour changer d'échelle en cours d'utilisation, l'utilisateur peut :
  - Désactiver puis réactiver l'outil (la modale ne s'affichera plus, l'échelle précédente sera conservée)
  - Une future amélioration pourrait ajouter un bouton pour forcer le changement d'échelle

## 📝 Implémentation technique

### Fichiers modifiés

#### 1. `index.html`
Ajout de la modale HTML juste avant la modale de sélection de briques :

```html
<!-- Modale de sélection d'échelle pour l'outil de mesure -->
<div id="measurementScaleModal" class="modal" style="display: none;">
    <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
            <h2><i class="fas fa-ruler"></i> Échelle de cotation</h2>
        </div>
        <div class="modal-body" style="text-align: center; padding: 30px;">
            <p>Choisissez l'échelle à laquelle vous allez coter :</p>
            <div style="display: flex; gap: 15px;">
                <button class="btn btn-primary scale-choice-btn" data-scale="20">
                    1/20 - Détails agrandis
                </button>
                <button class="btn btn-primary scale-choice-btn" data-scale="50">
                    1/50 - Vue d'ensemble
                </button>
            </div>
        </div>
    </div>
</div>
```

#### 2. `js/measurement-tool.js`

**Ajout de propriétés** :
```javascript
// Échelle de cotation (1:20 ou 1:50)
this.currentScale = null; // null = pas encore choisi, 20 ou 50

// Valeurs de base pour échelle 1/50 (plus petites)
this.baseTextScale = 30;
this.baseTextHeight = 8;
this.baseDimensionLabelOffset = 2.0;
this.baseMeasureLabelOffset = 1.5;
this.baseArrowSize = 2.5;
this.baseLineWidth = 4;
```

**Modification de `activate()`** :
```javascript
activate() {
    // Afficher la modale de sélection d'échelle si pas encore définie
    if (this.currentScale === null) {
        this.showScaleSelectionModal();
        return;
    }
    
    // Si l'échelle est déjà définie, activer directement l'outil
    this.activateAfterScaleSelection();
}
```

**Nouvelles méthodes** :
- `showScaleSelectionModal()` : Affiche la modale et gère les événements
- `setScale(scale)` : Définit l'échelle et adapte les tailles
- `activateAfterScaleSelection()` : Active l'outil après le choix de l'échelle
- `changeScale()` : Permet de changer l'échelle (future utilisation)

#### 3. `styles/main.css`

Ajout des styles pour la modale d'échelle :
```css
/* Modale de sélection d'échelle pour l'outil de mesure */
#measurementScaleModal .modal-content {
    max-width: 400px;
}

#measurementScaleModal .scale-choice-btn {
    flex: 1;
    padding: 20px;
    font-size: 18px;
    font-weight: bold;
    background: linear-gradient(135deg, #007acc 0%, #005a9e 100%);
    border: 2px solid rgba(100, 150, 200, 0.5);
    border-radius: 8px;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
}

#measurementScaleModal .scale-choice-btn:hover {
    background: linear-gradient(135deg, #0098ff 0%, #007acc 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 122, 204, 0.4);
}
```

## 🎨 Interface utilisateur

### Modale
- Design moderne avec fond sombre semi-transparent
- Deux boutons clairs et distincts
- Icônes pour faciliter la compréhension
- Texte explicatif
- Fermeture possible avec la touche `Escape`

### Boutons d'échelle
- Visuellement distincts avec gradient bleu
- Effet de survol avec animation
- Indication claire de l'usage (détails vs. vue d'ensemble)

## 🔄 Évolutions possibles

1. **Bouton de changement d'échelle** : Ajouter un bouton dans les contrôles de l'outil de mesure pour permettre de changer l'échelle sans désactiver l'outil

2. **Mémorisation** : Sauvegarder le choix d'échelle dans les préférences utilisateur

3. **Plus d'échelles** : Ajouter d'autres échelles courantes (1/10, 1/25, 1/100, etc.)

4. **Adaptation dynamique** : Adapter automatiquement l'échelle selon le niveau de zoom de la caméra

5. **Indicateur d'échelle** : Afficher l'échelle active dans l'interface de l'outil

## ✅ Avantages

- **Lisibilité améliorée** : Les cotations sont adaptées à l'échelle du plan
- **Flexibilité** : L'utilisateur peut choisir l'échelle appropriée selon le contexte
- **Standards respectés** : Utilisation des échelles standard en architecture (1/20, 1/50)
- **Expérience utilisateur** : Interface intuitive et claire
- **Professionnalisme** : Plans plus professionnels avec des cotations correctement dimensionnées

## 📋 Tests suggérés

1. **Test de première activation**
   - Cliquer sur l'outil de mesure
   - Vérifier que la modale s'affiche
   - Choisir l'échelle 1/20
   - Créer une cotation et vérifier la taille des éléments

2. **Test de changement d'échelle**
   - Désactiver puis réactiver l'outil
   - Vérifier que l'échelle précédente est conservée

3. **Test visuel**
   - Créer des cotations avec l'échelle 1/50
   - Comparer visuellement avec des cotations en 1/20
   - Vérifier que les éléments sont bien proportionnés (×1.5)

4. **Test d'annulation**
   - Ouvrir la modale
   - Appuyer sur `Escape`
   - Vérifier que l'outil ne s'active pas

## 🐛 Points d'attention

- La modale doit être fermée avant de permettre l'interaction avec la scène 3D
- Le choix d'échelle est conservé pendant toute la session
- Les cotations existantes ne sont pas mises à jour lors du changement d'échelle (comportement normal)
- L'échelle choisie s'applique à toutes les nouvelles cotations créées

---

**Date de création** : 2 octobre 2025  
**Auteur** : GitHub Copilot  
**Version** : 1.0
