# Séparation des Joints de Briques et de Blocs

## 🎯 Objectif
Séparer la gestion des joints de briques des joints de blocs dans l'onglet "Joints" pour permettre un contrôle indépendant des paramètres.

## ✅ Modifications Apportées

### 1. Interface Utilisateur (HTML)
**Fichier : `index.html`**

L'onglet "Joints" a été réorganisé en trois sections distinctes :

#### 🧱 Section Joints de Briques
- **Épaisseur joint briques** : Contrôle spécifique (défaut : 10mm)
- **Couleur joints briques** : Sélecteur de couleur
- **Afficher joints briques** : Checkbox pour la visibilité
- **Joints briques automatiques** : Activation/désactivation

#### 🧊 Section Joints de Blocs
- **Épaisseur joint blocs** : Contrôle spécifique (défaut : 15mm)
- **Couleur joints blocs** : Sélecteur de couleur
- **Afficher joints blocs** : Checkbox pour la visibilité
- **Joints blocs automatiques** : Activation/désactivation

#### ⚙️ Section Paramètres Généraux
- **Afficher tous les joints** : Contrôle global de visibilité
- **Synchroniser les paramètres** : Option pour synchroniser briques et blocs
- **Réinitialiser** : Bouton pour revenir aux paramètres par défaut

### 2. Styles CSS
**Fichier : `styles/joints-control.css`**

Ajout de styles spécifiques :
- **Codes couleur différenciés** : Orange pour briques, bleu pour blocs, gris pour général
- **Icônes distinctes** : `fas fa-th` pour briques, `fas fa-cube` pour blocs
- **Styles pour les contrôles** : Inputs numériques, selects, boutons

### 3. Logique JavaScript
**Fichier : `js/tab-manager.js`**

#### Nouvelles méthodes dans `TabManager` :
- `synchronizeJointSettings()` : Synchronise les paramètres entre briques et blocs
- `updateGlobalJointVisibility()` : Met à jour la visibilité globale
- `toggleAllJoints()` : Active/désactive tous les joints
- `resetJointSettings()` : Remet les paramètres par défaut
- `initializeJointStates()` : Initialise les états au chargement

#### Gestionnaires d'événements séparés :
- Events pour les joints de briques (brickJoint*)
- Events pour les joints de blocs (blockJoint*)
- Events pour les paramètres généraux

### 4. Moteur de Construction
**Fichier : `js/construction-tools.js`**

#### Nouvelles propriétés :
```javascript
// Joints de briques
this.brickJointThickness = 10; // mm
this.brickJointColor = 'grey';
this.showBrickJoints = true;
this.autoBrickJoints = true;

// Joints de blocs
this.blockJointThickness = 15; // mm
this.blockJointColor = 'grey';
this.showBlockJoints = true;
this.autoBlockJoints = true;
```

#### Nouvelles méthodes :
- `setBrickJointThickness()`, `setBrickJointColor()`, `toggleBrickJoints()`, `setAutoBrickJoints()`
- `setBlockJointThickness()`, `setBlockJointColor()`, `toggleBlockJoints()`, `setAutoBlockJoints()`
- Méthodes utilitaires pour mettre à jour la scène par type d'élément
- Méthodes de compatibilité pour maintenir l'ancien système

#### Marquage des joints par type :
Les joints créés sont maintenant marqués avec `userData.parentElementType` pour identifier s'ils appartiennent à une brique ou un bloc.

## 🔧 Fonctionnalités

### Contrôle Indépendant
- **Épaisseur différente** : Les briques utilisent des joints de 10mm, les blocs de 15mm
- **Couleurs distinctes** : Possibilité d'avoir des couleurs différentes
- **Visibilité séparée** : Afficher/masquer les joints par type
- **Automatisation par type** : Activer les joints automatiques uniquement pour certains types

### Synchronisation Optionnelle
- **Mode synchronisé** : Option pour appliquer les mêmes paramètres aux deux types
- **Mise à jour en temps réel** : Les changements se propagent automatiquement si activé

### Compatibilité
- **Méthodes legacy** : Les anciennes méthodes continuent de fonctionner
- **Migration transparente** : Les joints existants restent fonctionnels

## 🎨 Interface Visuelle

### Identification par Couleur
- **🧱 Briques** : Barre latérale orange (#e67e22)
- **🧊 Blocs** : Barre latérale bleue (#3498db)
- **⚙️ Général** : Barre latérale grise (#95a5a6)

### Icônes
- **Briques** : Icône mosaïque (fas fa-th)
- **Blocs** : Icône cube (fas fa-cube)
- **Général** : Icône engrenages (fas fa-cogs)

## 🚀 Utilisation

### Configuration Séparée
1. Ouvrir l'onglet **Joints**
2. Configurer les paramètres pour les briques dans la section orange
3. Configurer les paramètres pour les blocs dans la section bleue
4. Utiliser la section générale pour les contrôles globaux

### Synchronisation
1. Cocher **"Synchroniser les paramètres"**
2. Modifier un paramètre dans une section
3. Les paramètres se synchronisent automatiquement

### Réinitialisation
- Cliquer sur **"Réinitialiser"** pour revenir aux valeurs par défaut
- Briques : 10mm, gris, visible, automatique
- Blocs : 15mm, gris, visible, automatique

## 🔄 Compatibilité Descendante

Les anciennes méthodes continuent de fonctionner :
- `setJointThickness()` → applique aux deux types
- `setJointColor()` → applique aux deux types
- `toggleJoints()` → applique aux deux types
- `setAutoJoints()` → applique aux deux types

## 📊 Bénéfices

### Pour l'Utilisateur
- **Contrôle précis** : Paramètres différenciés par type d'élément
- **Interface claire** : Séparation visuelle évidente
- **Flexibilité** : Synchronisation optionnelle

### Pour la Construction
- **Réalisme** : Différenciation des types de joints selon les matériaux
- **Précision** : Épaisseurs adaptées aux types d'éléments
- **Performance** : Filtrage efficace des joints par type

### Maintenance
- **Code organisé** : Séparation claire des responsabilités
- **Extensibilité** : Facilité d'ajout de nouveaux types
- **Debug** : Traçabilité des joints par type d'élément parent
