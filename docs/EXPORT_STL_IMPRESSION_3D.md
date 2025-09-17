# Export STL pour Impression 3D - WallSim3D

## 📖 Description

Cette fonctionnalité ajoute une nouvelle option d'export "Export impr 3D" dans le menu fichier de WallSim3D. Cette option génère des fichiers STL optimisés pour l'impression 3D en excluant automatiquement tous les éléments non imprimables tels que les annotations, textes, flèches, cotations et autres éléments d'interface.

## 🎯 Objectif

L'export STL standard de WallSim3D exporte tous les objets de la scène 3D, ce qui inclut des éléments non compatibles avec l'impression 3D. La nouvelle fonctionnalité "Export impr 3D" résout ce problème en exportant uniquement les éléments de construction physiques.

## 🔧 Implémentation

### Fichiers modifiés

1. **`js/file-menu-handler.js`**
   - Ajout du bouton "Export impr 3D" dans le dialogue d'export
   - Ajout du case `'stl-print'` dans `performExport()`
   - Ajout de la méthode `exportSTLForPrinting()`

2. **`js/scene-manager-extensions.js`**
   - Ajout de la méthode `SceneManager.exportSTLForPrinting()`
   - Ajout de la méthode `SceneManager.isConstructionElement()`

### Nouvelles fonctions

#### `exportSTLForPrinting()`
```javascript
window.SceneManager.exportSTLForPrinting = function() {
    // Utilise SceneManager.elements pour n'exporter que les éléments insérés
    // Filtre uniquement les éléments de construction
    // Génère un fichier STL propre pour l'impression 3D
}
```

#### `isConstructionElement(element)`
```javascript
window.SceneManager.isConstructionElement = function(element) {
    // Vérifie si l'élément est un type de construction valide
    // Types acceptés: 'brick', 'block', 'insulation', 'linteau', 'beam'
    return constructionTypes.includes(element.type);
}
```

## 🚀 Utilisation

1. Ouvrir le menu **Fichier**
2. Cliquer sur **Exporter**
3. Dans la section "Format 3D", cliquer sur **Export impr 3D (STL optimisé)**
4. Le fichier généré aura le suffixe `_print.stl`

## ✅ Éléments inclus dans l'export

- ✅ Briques (`brick`)
- ✅ Blocs (`block`) 
- ✅ Isolation (`insulation`)
- ✅ Linteaux (`linteau`)
- ✅ Poutres (`beam`)

## ❌ Éléments exclus de l'export

- ❌ Annotations textuelles
- ❌ Lignes de cotation
- ❌ Flèches et marqueurs
- ❌ Textes 3D (sprites)
- ❌ Lignes et segments
- ❌ Helpers et indicateurs
- ❌ Objets temporaires
- ❌ Éléments d'interface

## 🔍 Différences avec l'export STL standard

| Fonctionnalité | Export STL standard | Export impr 3D |
|---|---|---|
| **Source des données** | Parcours de `scene.traverse()` | Utilise `SceneManager.elements` |
| **Filtrage** | Tous les objets avec géométrie | Uniquement éléments de construction |
| **Annotations** | ✅ Incluses | ❌ Exclues |
| **Cotations** | ✅ Incluses | ❌ Exclues |
| **Compatibilité impression** | ⚠️ Partielle | ✅ Optimale |
| **Nom de fichier** | `_export.stl` | `_print.stl` |

## 🧪 Tests

Un fichier de test `test-export-stl-print.html` est disponible pour vérifier :
- ✅ Présence du bouton dans le menu
- ✅ Fonctionnement de la fonction d'export
- ✅ Fonctionnement du filtrage

## 🐛 Dépannage

### Le bouton n'apparaît pas
- Vérifier que `file-menu-handler.js` est chargé
- Vérifier la console pour des erreurs JavaScript

### L'export ne fonctionne pas
- Vérifier que `scene-manager-extensions.js` est chargé
- Vérifier que des éléments de construction sont présents dans la scène
- Ouvrir la console développeur pour voir les logs détaillés

### Fichier STL vide
- Vérifier qu'il y a des éléments dans `SceneManager.elements`
- Les éléments doivent avoir un type valide (`brick`, `block`, etc.)
- Vérifier que les éléments ont un mesh attaché

## 📝 Notes techniques

- La fonction utilise `SceneManager.elements` qui est une Map contenant uniquement les éléments réellement placés dans la scène
- Chaque élément est cloné avant l'export pour éviter de modifier l'original
- Les transformations de matrice sont appliquées à la géométrie avant l'export
- Le filtrage est basé sur la propriété `type` de l'élément

## 🔄 Améliorations futures possibles

- [ ] Options de filtrage personnalisées (choix des types à inclure)
- [ ] Prévisualisation des éléments qui seront exportés
- [ ] Export par couches/assises
- [ ] Optimisation de la géométrie (fusion des maillages)
- [ ] Support des matériaux pour impression multi-couleur
