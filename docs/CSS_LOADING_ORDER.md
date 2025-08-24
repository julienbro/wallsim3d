# 📋 GUIDE D'ORDRE DE CHARGEMENT CSS - WALSIM3D

## 🎯 **Ordre Recommandé pour l'Uniformité du Design**

Pour garantir une cohérence parfaite du design, charger les fichiers CSS dans cet ordre précis :

### 1. **Thème de base (OBLIGATOIRE EN PREMIER)**
```html
<link rel="stylesheet" href="styles/theme-unified.css">
```
☁️ *Variables CSS globales, couleurs, espacements, transitions*

### 2. **Composants unifiés**
```html
<link rel="stylesheet" href="styles/unified-components.css">
```
🔧 *Boutons, champs, panneaux, dialogues standardisés*

### 3. **Interface moderne**
```html
<link rel="stylesheet" href="styles/modern-interface.css">
```
🎨 *Header, menu, layout principal*

### 4. **Styles principaux**
```html
<link rel="stylesheet" href="styles/main.css">
```
📱 *Onglets, grilles, éléments spécifiques*

### 5. **Modules spécialisés** (dans l'ordre)
```html
<link rel="stylesheet" href="styles/materials-extended.css">
<link rel="stylesheet" href="styles/library-preview-3d.css">
<link rel="stylesheet" href="styles/edit-menu-styles.css">
<link rel="stylesheet" href="styles/file-menu-dialogs.css">
<link rel="stylesheet" href="styles/assise-improvements.css">
<link rel="stylesheet" href="styles/joints-control.css">
<link rel="stylesheet" href="styles/linteau_styles.css">
<link rel="stylesheet" href="styles/presentation.css">
```

### 6. **Corrections finales (OBLIGATOIRE EN DERNIER)**
```html
<link rel="stylesheet" href="styles/fixes-uniformity.css">
```
🔧 *Corrections des couleurs hardcodées, uniformité forcée*

---

## ⚡ **Exemple Complet dans HTML**

```html
<!DOCTYPE html>
<html>
<head>
    <!-- THÈME UNIFIÉ (BASE) -->
    <link rel="stylesheet" href="styles/theme-unified.css">
    
    <!-- COMPOSANTS UNIFIÉS -->
    <link rel="stylesheet" href="styles/unified-components.css">
    
    <!-- INTERFACE MODERNE -->
    <link rel="stylesheet" href="styles/modern-interface.css">
    
    <!-- STYLES PRINCIPAUX -->
    <link rel="stylesheet" href="styles/main.css">
    
    <!-- MODULES SPÉCIALISÉS -->
    <link rel="stylesheet" href="styles/materials-extended.css">
    <link rel="stylesheet" href="styles/library-preview-3d.css">
    <link rel="stylesheet" href="styles/edit-menu-styles.css">
    <link rel="stylesheet" href="styles/file-menu-dialogs.css">
    <link rel="stylesheet" href="styles/assise-improvements.css">
    <link rel="stylesheet" href="styles/joints-control.css">
    <link rel="stylesheet" href="styles/linteau_styles.css">
    <link rel="stylesheet" href="styles/presentation.css">
    
    <!-- CORRECTIONS FINALES (IMPORTANT!) -->
    <link rel="stylesheet" href="styles/fixes-uniformity.css">
</head>
```

---

## 🎨 **Améliorations Effectuées**

### ✅ **Variables CSS Unifiées**
- Suppression des duplications dans `modern-interface.css`
- Centralisation dans `theme-unified.css`
- Variables pour couleurs, espacements, transitions

### ✅ **Couleurs Hardcodées Éliminées**
- Remplacement de `#333`, `#fff`, `#888` par les variables
- Thème sombre cohérent partout
- Couleurs d'état standardisées

### ✅ **Composants Standardisés**
- Boutons uniformes (`.btn`, `.walsim-btn`)
- Champs de saisie cohérents
- Panneaux et sections harmonisés

### ✅ **Fichiers de Correction**
- `fixes-uniformity.css` pour forcer la cohérence
- Corrections spécifiques avec `!important`
- Thème sombre appliqué partout

---

## 🚀 **Classes Utilitaires Disponibles**

### **Couleurs de Texte**
- `.text-primary` - Texte principal blanc
- `.text-secondary` - Texte secondaire gris clair  
- `.text-muted` - Texte discret
- `.text-disabled` - Texte désactivé

### **Couleurs de Fond**
- `.bg-primary` - Fond principal sombre
- `.bg-secondary` - Fond secondaire
- `.bg-tertiary` - Fond tertiaire

### **Boutons**
- `.walsim-btn` - Bouton standard
- `.walsim-btn-primary` - Bouton principal bleu
- `.btn-success` - Bouton vert
- `.btn-warning` - Bouton orange
- `.btn-error` - Bouton rouge

### **Matériaux**
- `.material-brick` - Couleur brique
- `.material-block` - Couleur bloc
- `.material-joint` - Couleur joint
- `.material-linteau` - Couleur linteau

---

## 📝 **Notes Importantes**

1. **NE PAS** modifier `theme-unified.css` sans raison valable
2. **TOUJOURS** charger `fixes-uniformity.css` en dernier
3. **UTILISER** les variables CSS au lieu des couleurs hardcodées
4. **TESTER** sur plusieurs navigateurs après modifications

---

*Dernière mise à jour: Juillet 2025*
*Créé pour WallSim3D v3.0*
