# Fonctionnalité de Coupes d'Assises - WallSim3D

## 🎯 Vue d'ensemble

La fonctionnalité de coupes d'assises permet de générer des vues en plan au niveau supérieur de chaque assise sélectionnée dans le document PDF de présentation. Cette fonction est particulièrement utile pour visualiser la répartition des éléments (briques, blocs, isolants, etc.) à différents niveaux de construction.

## 📍 Accès à la fonctionnalité

1. Cliquez sur le bouton **"Présenter"** dans la barre de navigation principale
2. La fenêtre modale d'exportation PDF s'ouvre
3. Faites défiler vers le bas pour trouver la section **"Coupes d'assises"**

## ✨ Interface utilisateur

### Section "Coupes d'assises"

L'interface se compose de trois parties principales :

#### 1. **Assises disponibles** (panneau de gauche)
- Affiche toutes les assises qui contiennent des éléments
- Chaque assise est représentée par :
  - Un badge coloré indiquant le type (Brique, Bloc, Isolant, Linteau)
  - Le numéro de l'assise (Assise 1, Assise 2, etc.)
  - La hauteur de l'assise en centimètres
  - Le nombre d'éléments présents

#### 2. **Contrôles de transfert** (centre)
- **→** : Ajouter les assises sélectionnées à l'export
- **←** : Retirer les assises sélectionnées de l'export  
- **⇒** : Ajouter toutes les assises à l'export
- **⇐** : Retirer toutes les assises de l'export

#### 3. **Assises à exporter** (panneau de droite)
- Affiche les assises sélectionnées pour la génération PDF
- Ces assises généreront des pages de coupe dans le PDF final

## 🖱️ Utilisation

### Méthode 1 : Drag & Drop
1. **Glissez** une assise du panneau de gauche vers le panneau de droite pour l'ajouter à l'export
2. **Glissez** une assise du panneau de droite vers le panneau de gauche pour la retirer de l'export

### Méthode 2 : Sélection + Boutons
1. **Cliquez** sur une ou plusieurs assises pour les sélectionner (elles deviennent colorées)
2. **Utilisez les boutons de transfert** pour déplacer les assises sélectionnées

### Méthode 3 : Transfert global
- **Bouton "⇒"** : Ajouter toutes les assises disponibles à l'export
- **Bouton "⇐"** : Retirer toutes les assises de l'export

## 📄 Génération PDF

### Pages générées
Pour chaque assise sélectionnée, une page supplémentaire sera ajoutée au PDF avec :
- **Titre** : "Coupe Assise X - [Type]" (ex: "Coupe Assise 2 - Brique M65")
- **Vue en plan** : Vue du dessus centrée sur les éléments de cette assise
- **Informations** : Hauteur de l'assise et nombre d'éléments
- **Échelle** : Vue optimisée pour la lisibilité

### Position dans le PDF
Les pages de coupes d'assises sont insérées :
- Après toutes les vues standard (perspective, élévations, etc.)
- Avant la page de projet (si sélectionnée)
- Dans l'ordre croissant des numéros d'assises

## 🎨 Types d'assises supportés

La fonctionnalité reconnaît et affiche différents types d'assises avec des badges colorés :

- **🔴 Briques** (M50, M57, M60, M65, M90) - Badge rouge
- **🔵 Blocs** - Badge bleu  
- **🟡 Isolants** - Badge orange
- **🟣 Linteaux** - Badge violet

## 💡 Conseils d'utilisation

### Optimisation de la sélection
- Sélectionnez uniquement les assises importantes pour éviter un PDF trop volumineux
- Les assises vides (sans éléments) ne sont pas affichées automatiquement
- Privilégiez les assises avec un nombre significatif d'éléments

### Visualisation optimale
- Les coupes sont générées avec une vue du dessus optimisée
- Le zoom est automatiquement ajusté pour centrer sur les éléments de l'assise
- La vue est nettoyée des aides visuelles (grilles, marqueurs, etc.)

### Cas d'usage typiques
1. **Documentation technique** : Montrer la répartition des matériaux par niveau
2. **Vérification de pose** : Contrôler l'alignement des éléments sur chaque assise
3. **Présentation client** : Expliquer la construction étage par étage

## 🔧 Intégration technique

### Données utilisées
- Utilise l'`AssiseManager` pour récupérer les informations d'assises
- Compatible avec tous les types d'éléments supportés par WallSim3D
- Respecte la structure multi-types des assises

### Performance
- Génération optimisée avec sauvegarde/restauration de l'état de la scène
- Calcul automatique du centre géométrique pour le cadrage
- Gestion intelligente des erreurs de capture

## 🐛 Dépannage

### Assises non visibles
- Vérifiez que l'assise contient des éléments non-joints
- Assurez-vous que les éléments sont correctement assignés à l'assise

### Erreur de capture
- Peut se produire si la scène est complexe ou la mémoire insuffisante
- Une page d'erreur sera générée avec un message explicatif

### Performance lente
- Limitez le nombre d'assises sélectionnées
- Fermez les autres applications gourmandes en mémoire

## 📋 Checklist avant export

- [ ] Au moins une assise est sélectionnée pour l'export
- [ ] Les assises sélectionnées contiennent les éléments souhaités
- [ ] Le projet est sauvegardé (recommandé)
- [ ] Les autres paramètres PDF sont configurés

---

Cette fonctionnalité enrichit considérablement les possibilités de documentation de vos projets WallSim3D en permettant une analyse détaillée niveau par niveau de vos constructions.
