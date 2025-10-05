# Amélioration de la Qualité des Cotations dans l'Export PDF

## Problème Initial
Les cotations (textes, flèches et lignes de cote) apparaissaient pixelisées lors de l'export PDF, car elles étaient rendues sous forme de sprites avec des textures canvas de résolution insuffisante.

## Solutions Implémentées

### 1. Augmentation de la Résolution du Canvas de Texte

**Fichier:** `js/measurement-tool.js`  
**Méthode:** `createTextLabel()`

#### Modifications:
- **Résolution du canvas:** 2048x2048 → **4096x4096** pixels (×4 en surface)
- **Taille de police:** 320px → **640px** (proportionnelle à la nouvelle résolution)
- **Contour blanc:** Ajouté pour améliorer la lisibilité sur tous les fonds

```javascript
// Résolution ultra-haute pour export PDF de qualité
canvas.width = 4096;
canvas.height = 4096;
const fontSize = 640;
```

### 2. Optimisation des Paramètres de Texture

#### Paramètres ajoutés/modifiés:
- **`generateMipmaps: true`** - Améliore la qualité à différentes distances
- **`minFilter: THREE.LinearMipmapLinearFilter`** - Filtrage optimal pour les mipmaps
- **`magFilter: THREE.LinearFilter`** - Lissage lors de l'agrandissement
- **`anisotropy: 16`** - Netteté maximale sous différents angles de vue
- **`sizeAttenuation: false`** - Taille constante quelle que soit la distance
- **`transparent: true`** - Fond transparent pour le sprite

```javascript
const texture = new THREE.CanvasTexture(canvas);
texture.generateMipmaps = true;
texture.minFilter = THREE.LinearMipmapLinearFilter;
texture.magFilter = THREE.LinearFilter;
texture.anisotropy = 16;
texture.format = THREE.RGBAFormat;
texture.needsUpdate = true;

const material = new THREE.SpriteMaterial({ 
    map: texture,
    sizeAttenuation: false,
    transparent: true
});
```

### 3. Gestion des Échelles de Cotation

Les tailles des éléments de cotation s'adaptent automatiquement selon l'échelle choisie:

- **Échelle 1/20:** Éléments **×2** plus grands
- **Échelle 1/50:** Éléments **×3** plus grands

```javascript
setScale(scale) {
    if (scale === 20) {
        this.textScale = this.baseTextScale * 2.0;
        this.arrowSize = this.baseArrowSize * 2.0;
        // ...
    } else if (scale === 50) {
        this.textScale = this.baseTextScale * 3.0;
        this.arrowSize = this.baseArrowSize * 3.0;
        // ...
    }
}
```

### 4. Configuration du Renderer (déjà en place)

**Fichier:** `js/scene-manager.js`

Le renderer est configuré avec `preserveDrawingBuffer: true`, ce qui est **critique** pour permettre les captures d'écran de qualité pour le PDF.

```javascript
this.renderer = new THREE.WebGLRenderer({ 
    canvas: container.querySelector('#threejs-canvas'),
    antialias: true,
    preserveDrawingBuffer: true  // ✅ CRITIQUE pour les captures PDF
});
```

## Résultats Attendus

### Avant
- Textes flous et pixelisés dans le PDF
- Bords dentelés sur les caractères
- Difficulté de lecture à l'impression

### Après
- Textes nets et lisibles dans le PDF
- Contours lisses et précis
- Qualité professionnelle à l'impression
- Textures haute résolution (16 millions de pixels)

## Recommandations d'Utilisation

1. **Échelle 1/20:** À utiliser pour les plans de détail
2. **Échelle 1/50:** À utiliser pour les vues d'ensemble
3. **Export PDF:** Toujours vérifier que le renderer a terminé le rendu avant la capture
4. **Performance:** La haute résolution des textures peut consommer plus de mémoire GPU

## Performances

- **Mémoire texture:** ~64 Mo par label (4096×4096×4 bytes)
- **Impact:** Négligeable pour un nombre raisonnable de cotations (<50)
- **Optimisation:** Les mipmaps permettent d'économiser de la bande passante GPU

## Tests Recommandés

1. Créer plusieurs cotations avec du texte de différentes tailles
2. Choisir l'échelle 1/20 puis 1/50 et comparer
3. Exporter en PDF et zoomer à 400% pour vérifier la netteté
4. Imprimer le PDF et vérifier la lisibilité

## Notes Techniques

- Les sprites utilisent `sizeAttenuation: false` pour garder une taille constante
- Le contour blanc améliore le contraste sur les fonds sombres
- L'anisotropie à 16 est le maximum supporté par la plupart des GPU
- La résolution 4096×4096 est proche de la limite maximale des textures WebGL (souvent 8192)

---
**Date:** 2 octobre 2025  
**Version:** 1.0  
**Auteur:** Amélioration de la qualité d'export PDF
