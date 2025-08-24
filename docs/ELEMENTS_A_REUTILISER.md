# Fonctionnalité "Éléments à réutiliser"

## Vue d'ensemble

La nouvelle fonctionnalité "Éléments à réutiliser" permet aux utilisateurs de rapidement réutiliser les éléments qu'ils ont déjà placés dans leur construction. Cette fonctionnalité est accessible via un sous-onglet dans l'onglet Biblio.

## Structure de l'interface

### Onglet Biblio restructuré

L'onglet Biblio contient maintenant deux sous-onglets principaux :

1. **Bibliothèque** : Contient la bibliothèque d'éléments classique avec les sous-onglets :
   - Briques
   - Blocs 
   - Isolants
   - Linteaux

2. **Éléments à réutiliser** : Nouvelle section qui affiche :
   - Les briques utilisées
   - Les blocs utilisés
   - Les autres éléments utilisés
   - Des statistiques d'utilisation

## Fonctionnalités

### Ajout automatique d'éléments

Chaque fois qu'un utilisateur place un élément dans la construction, celui-ci est automatiquement ajouté à la liste des éléments à réutiliser. Le système :

- Regroupe les éléments identiques (même type et même coupe)
- Maintient un compteur du nombre d'utilisations
- Enregistre la dernière utilisation
- Affiche les dimensions de l'élément

### Interface utilisateur

#### Actions disponibles
- **Actualiser** : Met à jour la liste des éléments
- **Vider** : Efface tous les éléments de la liste

#### Affichage des éléments
Chaque élément affiché contient :
- Le nom et type de l'élément
- Le nombre d'utilisations (badge)
- Les dimensions
- Un aperçu visuel (icône)
- L'heure de dernière utilisation

#### Sélection d'éléments
- Clic sur un élément pour le sélectionner
- L'élément devient actif dans la bibliothèque
- L'interface bascule automatiquement vers l'onglet Bibliothèque
- La coupe appropriée est également sélectionnée

### Statistiques

Le système affiche en temps réel :
- Nombre de briques différentes utilisées
- Nombre de blocs différents utilisés  
- Nombre total d'éléments différents utilisés

## Implémentation technique

### Fichiers modifiés/créés

1. **index.html** : Restructuration de l'onglet Biblio
2. **styles/reusable-elements.css** : Styles pour la nouvelle interface
3. **js/tab-manager.js** : Logique de gestion des éléments à réutiliser
4. **js/scene-manager.js** : Intégration avec le système d'ajout d'éléments

### Classes et méthodes principales

#### TabManager
- `setupMainSubTabs()` : Configuration des sous-onglets principaux
- `switchMainSubTab()` : Basculement entre Bibliothèque et Éléments à réutiliser
- `addUsedElement()` : Ajout d'un élément à la liste de réutilisation
- `refreshReusableElements()` : Actualisation de l'affichage
- `clearReusableElements()` : Suppression de tous les éléments
- `selectReusableElement()` : Sélection d'un élément pour réutilisation

#### SceneManager
- `getElementDimensions()` : Récupération des dimensions d'un élément
- Intégration avec `addUsedElement()` lors de l'ajout d'éléments

### Structure des données

Les éléments à réutiliser sont stockés dans un objet `reusableElements` avec trois catégories :
- `briques` : Map des briques utilisées
- `blocs` : Map des blocs utilisés
- `autres` : Map des autres éléments (isolants, linteaux, etc.)

Chaque élément stocké contient :
```javascript
{
    type: string,           // Type d'élément (M65, B19, etc.)
    cut: string,            // Type de coupe ('1/1', '1/2', etc.)
    dimensions: string,     // Dimensions formatées
    count: number,          // Nombre d'utilisations
    firstUsed: Date,        // Première utilisation
    lastUsed: Date,         // Dernière utilisation
    data: object           // Données additionnelles
}
```

## Tests

Un script de test `test-reusable-elements.js` est fourni pour tester la fonctionnalité sans avoir à placer manuellement des éléments.

### Utilisation des tests
Dans la console du navigateur :
```javascript
// Simuler l'ajout d'éléments
testReusableElements();

// Vider la liste
clearReusableElements();

// Actualiser l'affichage
refreshReusableElements();
```

## Responsive Design

L'interface s'adapte aux différentes tailles d'écran :
- Grille flexible pour les éléments
- Sous-onglets empilés sur mobile
- Statistiques adaptatives

## Accessibilité

- Icônes descriptives pour chaque type d'élément
- Messages informatifs quand aucun élément n'est disponible
- Feedback visuel lors des interactions
- Navigation au clavier supportée

## Évolutions futures possibles

1. **Tri et filtrage** : Permettre le tri par utilisation, date, type
2. **Favoris** : Marquer certains éléments comme favoris
3. **Historique** : Voir l'historique d'utilisation détaillé
4. **Import/Export** : Sauvegarder et charger des listes d'éléments
5. **Suggestions** : Suggérer des éléments basés sur les habitudes d'utilisation
