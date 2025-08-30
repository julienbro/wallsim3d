// Classe pour représenter un élément de construction (brique, bloc, isolant)
class WallElement {
    constructor(options = {}) {
        if (window.DEBUG_WALL_ELEMENT) {
            console.log('🏗️ WallElement: Création avec options:', options);
        }
        
        this.id = this.generateId();
        this.type = options.type || 'brick'; // brick, block, insulation
        this.material = options.material || this.getDefaultMaterial(options);
        this.position = {
            x: options.x || 0,
            y: options.y || 0,
            z: options.z || 0
        };
        this.dimensions = {
            length: options.length || 19, // cm
            width: options.width || 9,    // cm
            height: options.height || 5   // cm
        };
        
        if (window.DEBUG_WALL_ELEMENT) {
            console.log('🏗️ WallElement: Dimensions AVANT ajustement:', this.dimensions);
        }
        
        // ✅ CORRECTION: Ne plus appliquer de coupes automatiques
        // Les dimensions reçues de BrickSelector sont déjà correctes pour les types coupés
        // comme M65_HALF qui a déjà length: 9 (et non 19 * 0.5)
        
        if (window.DEBUG_WALL_ELEMENT) {
            console.log('🏗️ WallElement: Dimensions FINALES (sans ajustement):', this.dimensions);
        }
        
        this.rotation = options.rotation || 0; // rotation en Y (radians)
        this.mesh = null;
        this.selected = false;
        
        // Stocker les informations sur le type de bloc/brique pour déterminer le matériau
        this.blockType = options.blockType || null;
        this.brickType = options.brickType || null;
        
        if (window.DEBUG_WALL_ELEMENT) {
            console.log('🏗️ WallElement: Types stockés - blockType:', this.blockType, 'brickType:', this.brickType);
        }
        
        // Déterminer la coupe à partir du blockType
        this.cut = this.extractCutFromBlockType(this.blockType) || '1/1';
        
        this.createMesh();
    }

    // Méthode pour extraire la coupe à partir du blockType
    extractCutFromBlockType(blockType) {
        if (!blockType || typeof blockType !== 'string') {
            return '1/1';
        }
        
        // Correspondances des suffixes avec les coupes
        const cutMappings = {
            '1Q': '1/4',
            '1/2L': '1/2L',
            '1/2': '1/2',
            '3Q': '3/4'
        };
        
        // Chercher si le blockType se termine par un des suffixes de coupe
        for (const [suffix, cut] of Object.entries(cutMappings)) {
            if (blockType.endsWith(suffix)) {
                return cut;
            }
        }
        
        // Si aucun suffixe trouvé, c'est une brique/bloc entier
        return '1/1';
    }

    // Méthode pour déterminer le matériau par défaut selon les règles spécifiées
    getDefaultMaterial(options) {
        if (options.type === 'brick') {
            // Toutes les briques → brique rouge classique
            return 'brique-rouge-classique';
        } else if (options.type === 'block') {
            const blockType = options.blockType;
            if (blockType) {
                // Blocs terre cuite → brique rouge classique
                if (blockType.startsWith('TC_')) {
                    return 'brique-rouge-classique';
                }
                // Blocs béton cellulaire → béton cellulaire blanc
                else if (blockType.startsWith('BC_') || blockType.startsWith('BCA_')) {
                    return 'cellular-concrete';
                }
                // Blocs creux coupés (B9_HALF, B14_HALF, etc.) → béton gris
                else if (blockType.includes('_HALF') || blockType.includes('_3Q') || blockType.includes('_1Q')) {
                    return 'concrete';
                }
                // Blocs Argex → béton gris  
                else if (blockType.startsWith('ARGEX_')) {
                    return 'concrete';
                }
            }
            // Tous les autres blocs creux standard → béton gris
            return 'concrete';
        } else if (options.type === 'joint') {
            // Tous les joints → gris souris
            return 'joint-gris-souris';
        } else if (options.type === 'insulation') {
            // Utiliser le matériau spécifique selon le type d'isolant
            if (options.materialType) {
                return options.materialType;
            }
            // Si pas de type spécifique, différencier selon le baseType ou insulationType
            const baseType = options.baseType || (options.insulationType && options.insulationType.startsWith('LAINEROCHE') ? 'LAINEROCHE' : 'PUR');
            if (baseType === 'LAINEROCHE') {
                return 'rock-wool';
            }
            return 'insulation'; // PUR par défaut
        }
        
        // Défaut pour les cas non prévus → brique rouge classique
        return 'brique-rouge-classique';
    }

    generateId() {
        return 'element_' + Math.random().toString(36).substr(2, 9);
    }

    createMesh() {
        if (window.DEBUG_WALL_ELEMENT) {
            console.log('🔨 WallElement: createMesh() - Dimensions utilisées:', this.dimensions);
        }
        
        // Conversion cm vers unités Three.js (1 unité = 1cm)
        const geometry = new THREE.BoxGeometry(
            this.dimensions.length,
            this.dimensions.height,
            this.dimensions.width
        );
        
        if (window.DEBUG_WALL_ELEMENT) {
            console.log('🔨 WallElement: Géométrie créée avec:', {
                x: this.dimensions.length,
                y: this.dimensions.height, 
                z: this.dimensions.width
            });
        }

        let material = null;
        if (window.MaterialLibrary) {
            material = window.MaterialLibrary.getThreeJSMaterial(this.material);
            if (material) {
                // FORCER le matériau à être SOLIDE (pas wireframe)
                material.wireframe = false;
                
                // CORRECTION SPÉCIALE: Forcer l'opacité pour les isolants
                if (this.type === 'insulation' || this.material === 'rock-wool' || this.material === 'insulation') {
                    // console.log('🔧 CORRECTION ISOLANT: Forçage opacité pour', this.material, 'type:', this.type);
                    material.transparent = false;
                    material.opacity = 1.0;
                    material.alphaTest = 0.1;
                    material.side = THREE.DoubleSide;
                }
                
                material.needsUpdate = true;
                // console.log(`✅ Matériau '${this.material}' chargé avec succès (SOLID) pour l'élément ${this.id}`);
            } else {
                // console.log(`⚠️ Matériau '${this.material}' non trouvé, utilisation d'un matériau par défaut`);
            }
        } else {
            // console.log(`⚠️ MaterialLibrary non disponible pour l'élément ${this.id}`);
        }

        // Fallback: créer un matériau de base si aucun n'est trouvé
        if (!material) {
            // console.log(`🔧 Création d'un matériau de fallback rouge SOLIDE`);
            material = new THREE.MeshLambertMaterial({ 
                color: 0xff0000,
                wireframe: false,  // EXPLICITEMENT pas wireframe
                side: THREE.DoubleSide 
            });
        }
        
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Positionner la brique avec le curseur au coin inférieur gauche
        this.updateMeshPosition();
        
        // Référence vers l'élément pour le picking
        this.mesh.userData = { 
            element: this,
            blockType: this.blockType,
            type: this.type
        };
        
        // DEBUG: Log pour vérifier le chargement et l'assignation du blockType
        // console.log(`🔧 [WALL-ELEMENT] CRÉÉ avec blockType: "${this.blockType}" pour type: "${this.type}"`);
        
        // Ajouter les edges pour un meilleur rendu
        this.createEdges();
    }

    createEdges() {
        // Supprimer les anciens contours s'ils existent
        if (this.edgesMesh) {
            this.mesh.remove(this.edgesMesh);
            this.edgesMesh.geometry.dispose();
            this.edgesMesh.material.dispose();
            this.edgesMesh = null;
        }
        
        const edges = new THREE.EdgesGeometry(this.mesh.geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000, 
            linewidth: 1,
            opacity: 0.3,
            transparent: true
        });
        this.edgesMesh = new THREE.LineSegments(edges, lineMaterial);
        this.mesh.add(this.edgesMesh);
    }

    updatePosition(x, y, z) {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
        
        this.updateMeshPosition();
    }

    updateDimensions(length, width, height) {
        this.dimensions.length = length;
        this.dimensions.width = width;
        this.dimensions.height = height;
        
        // Recréer la géométrie
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.geometry = new THREE.BoxGeometry(
                this.dimensions.length,
                this.dimensions.height,
                this.dimensions.width
            );
            this.updatePosition(this.position.x, this.position.y, this.position.z);
            this.createEdges();
        }
    }

    setMaterial(materialId) {
        this.material = materialId;
        if (this.mesh) {
            this.mesh.material.dispose();
            const newMaterial = window.MaterialLibrary.getThreeJSMaterial(materialId);
            
            // CORRECTION SPÉCIALE: Forcer l'opacité pour les isolants lors du changement de matériau
            if (this.type === 'insulation' || materialId === 'rock-wool' || materialId === 'insulation') {
                // console.log('🔧 CORRECTION ISOLANT setMaterial: Forçage opacité pour', materialId, 'type:', this.type);
                newMaterial.transparent = false;
                newMaterial.opacity = 1.0;
                newMaterial.alphaTest = 0.1;
                newMaterial.side = THREE.DoubleSide;
                newMaterial.needsUpdate = true;
            }
            
            this.mesh.material = newMaterial;
        }
    }

    setRotation(angle) {
        this.rotation = angle;
        this.updateMeshPosition(); // Repositionner le mesh après rotation
    }

    setSelected(selected) {
        this.selected = selected;
        if (this.mesh) {
            if (selected) {
                this.mesh.material.emissive.setHex(0x444444);
            } else {
                this.mesh.material.emissive.setHex(0x000000);
            }
        }
    }

    // Calculs pour l'analyse
    getVolume() {
        // Volume en m³
        return (this.dimensions.length * this.dimensions.width * this.dimensions.height) / 1000000;
    }

    getSurfaceArea() {
        // Surface en m² (surface frontale)
        return (this.dimensions.length * this.dimensions.height) / 10000;
    }

    getMass() {
        // Masse en kg
        
        // Pour les blocs, vérifier s'il y a un poids spécifique défini
        if (this.type === 'block' && window.BlockSelector) {
            const blockWeight = this.getBlockSpecificWeight();
            if (blockWeight !== null) {
                return blockWeight;
            }
        }
        
        // Calcul standard basé sur la densité du matériau
        const materialData = window.MaterialLibrary.getMaterial(this.material);
        return this.getVolume() * materialData.density;
    }

    // Méthode pour obtenir le poids spécifique d'un bloc s'il est défini
    getBlockSpecificWeight() {
        if (this.type !== 'block' || !window.BlockSelector) {
            return null;
        }

        const { length, width, height } = this.dimensions;
        
        // Identifier le type de bloc par ses dimensions
        const blockTypes = window.BlockSelector.blockTypes;
        for (const [blockType, blockData] of Object.entries(blockTypes)) {
            if (Math.abs(length - blockData.length) <= 0.1 && 
                Math.abs(width - blockData.width) <= 0.1 && 
                Math.abs(height - blockData.height) <= 0.1) {
                
                if (blockData.weight !== undefined) {
                    // console.log(`🔧 Poids spécifique trouvé pour bloc ${blockType}: ${blockData.weight} kg`);
                    return blockData.weight;
                }
            }
        }
        
        return null; // Aucun poids spécifique trouvé
    }

    getCost() {
        // Coût en euros
        const materialData = window.MaterialLibrary.getMaterial(this.material);
        return materialData.price;
    }

    // Méthodes pour déterminer l'orientation technique selon la terminologie de maçonnerie
    getBrickOrientation() {
        if (this.type !== 'brick') return 'N/A';
        
        // Normaliser la rotation entre 0 et 2π
        const normalizedRotation = ((this.rotation % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
        
        // Déterminer si la brique est tournée (90° ou 270°)
        const isRotated = (normalizedRotation > Math.PI / 4 && normalizedRotation < 3 * Math.PI / 4) ||
                         (normalizedRotation > 5 * Math.PI / 4 && normalizedRotation < 7 * Math.PI / 4);
        
        // Déterminer si la brique est posée sur le côté (position rare)
        const isFlat = Math.abs(this.mesh.rotation.x) > Math.PI / 4 || Math.abs(this.mesh.rotation.z) > Math.PI / 4;
        
        if (isFlat) {
            return 'plat'; // Face 19x9 visible
        } else if (isRotated) {
            return 'boutisse'; // Face 9x5 visible (bout de la brique)
        } else {
            return 'panneresse'; // Face 19x5 visible (face normale)
        }
    }

    // Nouvelle méthode pour déterminer la face spécifique visible selon l'orientation et la rotation
    getSpecificFace() {
        if (this.type !== 'brick') return 'N/A';
        
        // Normaliser la rotation entre 0 et 2π
        const normalizedRotation = ((this.rotation % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
        
        // Vérifier si la brique est retournée (posée sur le côté)
        const xRot = this.mesh ? this.mesh.rotation.x : 0;
        const zRot = this.mesh ? this.mesh.rotation.z : 0;
        
        // Si la brique est retournée sur le côté (faces 19x9 visibles)
        if (Math.abs(xRot) > Math.PI / 4) {
            return xRot > 0 ? 'plat-superieur' : 'plat-inferieur';
        }
        
        if (Math.abs(zRot) > Math.PI / 4) {
            return zRot > 0 ? 'plat-superieur' : 'plat-inferieur';
        }
        
        // Sinon, déterminer selon la rotation Y (autour de l'axe vertical)
        // 0° = panneresse frontale, 90° = boutisse droite, 180° = panneresse dorsale, 270° = boutisse gauche
        const angle = normalizedRotation;
        
        if (angle < Math.PI / 4 || angle > 7 * Math.PI / 4) {
            return 'panneresse-frontale'; // Face 19x5 visible devant
        } else if (angle >= Math.PI / 4 && angle < 3 * Math.PI / 4) {
            return 'boutisse-droite'; // Face 9x5 visible à droite
        } else if (angle >= 3 * Math.PI / 4 && angle < 5 * Math.PI / 4) {
            return 'panneresse-dorsale'; // Face 19x5 visible derrière
        } else if (angle >= 5 * Math.PI / 4 && angle < 7 * Math.PI / 4) {
            return 'boutisse-gauche'; // Face 9x5 visible à gauche
        }
        
        return 'panneresse-frontale'; // Défaut
    }

    // Obtenir le nom complet de la face spécifique
    getSpecificFaceLabel() {
        const face = this.getSpecificFace();
        const labels = {
            'panneresse-frontale': 'Panneresse frontale (19×5)',
            'panneresse-dorsale': 'Panneresse dorsale (19×5)',
            'boutisse-droite': 'Boutisse droite (9×5)',
            'boutisse-gauche': 'Boutisse gauche (9×5)',
            'plat-inferieur': 'Plat inférieur (19×9)',
            'plat-superieur': 'Plat supérieur (19×9)',
            'N/A': 'N/A'
        };
        return labels[face] || 'N/A';
    }

    // Obtenir les dimensions de la face spécifique visible
    getSpecificFaceDimensions() {
        const face = this.getSpecificFace();
        
        switch (face) {
            case 'panneresse-frontale':
            case 'panneresse-dorsale':
                return {
                    width: this.dimensions.length,  // 19 cm
                    height: this.dimensions.height, // 5 cm
                    type: 'panneresse',
                    orientation: face.includes('frontale') ? 'frontale' : 'dorsale'
                };
            case 'boutisse-droite':
            case 'boutisse-gauche':
                return {
                    width: this.dimensions.width,   // 9 cm
                    height: this.dimensions.height, // 5 cm
                    type: 'boutisse',
                    orientation: face.includes('droite') ? 'droite' : 'gauche'
                };
            case 'plat-inferieur':
            case 'plat-superieur':
                return {
                    width: this.dimensions.length,  // 19 cm
                    height: this.dimensions.width,  // 9 cm
                    type: 'plat',
                    orientation: face.includes('superieur') ? 'superieur' : 'inferieur'
                };
            default:
                return {
                    width: this.dimensions.length,
                    height: this.dimensions.height,
                    type: 'panneresse',
                    orientation: 'frontale'
                };
        }
    }

    // Méthode pour obtenir toutes les faces de la brique avec leurs caractéristiques
    getAllFaces() {
        if (this.type !== 'brick') return [];
        
        return [
            {
                name: 'Panneresse frontale',
                dimensions: { width: this.dimensions.length, height: this.dimensions.height },
                size: `${this.dimensions.length}×${this.dimensions.height}`,
                area: (this.dimensions.length * this.dimensions.height) / 100, // cm²
                type: 'panneresse',
                orientation: 'frontale'
            },
            {
                name: 'Panneresse dorsale',
                dimensions: { width: this.dimensions.length, height: this.dimensions.height },
                size: `${this.dimensions.length}×${this.dimensions.height}`,
                area: (this.dimensions.length * this.dimensions.height) / 100, // cm²
                type: 'panneresse',
                orientation: 'dorsale'
            },
            {
                name: 'Boutisse droite',
                dimensions: { width: this.dimensions.width, height: this.dimensions.height },
                size: `${this.dimensions.width}×${this.dimensions.height}`,
                area: (this.dimensions.width * this.dimensions.height) / 100, // cm²
                type: 'boutisse',
                orientation: 'droite'
            },
            {
                name: 'Boutisse gauche',
                dimensions: { width: this.dimensions.width, height: this.dimensions.height },
                size: `${this.dimensions.width}×${this.dimensions.height}`,
                area: (this.dimensions.width * this.dimensions.height) / 100, // cm²
                type: 'boutisse',
                orientation: 'gauche'
            },
            {
                name: 'Plat inférieur',
                dimensions: { width: this.dimensions.length, height: this.dimensions.width },
                size: `${this.dimensions.length}×${this.dimensions.width}`,
                area: (this.dimensions.length * this.dimensions.width) / 100, // cm²
                type: 'plat',
                orientation: 'inferieur'
            },
            {
                name: 'Plat supérieur',
                dimensions: { width: this.dimensions.length, height: this.dimensions.width },
                size: `${this.dimensions.length}×${this.dimensions.width}`,
                area: (this.dimensions.length * this.dimensions.width) / 100, // cm²
                type: 'plat',
                orientation: 'superieur'
            }
        ];
    }

    getBrickOrientationLabel() {
        const orientation = this.getBrickOrientation();
        const labels = {
            'panneresse': 'Panneresse (19×5)',
            'boutisse': 'Boutisse (9×5)',
            'plat': 'Plat (19×9)',
            'N/A': 'N/A'
        };
        return labels[orientation] || 'N/A';
    }

    // Obtenir la face visible selon l'orientation (méthode mise à jour)
    getVisibleFace() {
        const specificFace = this.getSpecificFaceDimensions();
        
        return {
            width: specificFace.width,
            height: specificFace.height,
            type: specificFace.type,
            orientation: specificFace.orientation,
            label: this.getSpecificFaceLabel()
        };
    }

    // Détection de collision avec tolérance améliorée
    intersects(otherElement) {
        const thisBox = this.getBoundingBox();
        const otherBox = otherElement.getBoundingBox();
        
        // Tolérance minimale pour éviter les chevauchements réels (réduite pour placement précis)
        let tolerance = 0.01; // Tolérance très réduite (0.1mm) pour permettre placement à 1cm
        
        // Si les deux éléments sont du même type et à la même hauteur Y, tolérance légèrement plus grande
        if (this.type === otherElement.type && 
            Math.abs(this.position.y - otherElement.position.y) < 0.5) {
            tolerance = 0.05; // Tolérance très réduite (0.5mm) pour permettre placement côte à côte à 1cm
        }
        
        const intersectsX = !(thisBox.min.x >= otherBox.max.x - tolerance || 
                             thisBox.max.x <= otherBox.min.x + tolerance);
        const intersectsY = !(thisBox.min.y >= otherBox.max.y - tolerance || 
                             thisBox.max.y <= otherBox.min.y + tolerance);
        const intersectsZ = !(thisBox.min.z >= otherBox.max.z - tolerance || 
                             thisBox.max.z <= otherBox.min.z + tolerance);
        
        const hasCollision = intersectsX && intersectsY && intersectsZ;
        
        // DEBUG: Log temporaire pour identifier les collisions à 1cm
        if (hasCollision) {
            const distance = Math.sqrt(
                Math.pow(this.position.x - otherElement.position.x, 2) + 
                Math.pow(this.position.z - otherElement.position.z, 2)
            );
            // console.log(`🚫 COLLISION DÉTECTÉE entre ${this.id} et ${otherElement.id}:`, {
            //     distance: distance.toFixed(2) + 'cm',
            //     tolerance: tolerance.toFixed(2) + 'cm',
            //     thisPos: {x: this.position.x.toFixed(2), z: this.position.z.toFixed(2)},
            //     otherPos: {x: otherElement.position.x.toFixed(2), z: otherElement.position.z.toFixed(2)},
            //     intersectsX, intersectsY, intersectsZ
            // });
        }
                             
        return hasCollision;
    }

    getBoundingBox() {
        // IMPORTANT: this.position représente le coin inférieur gauche AVANT de la brique
        // Il faut calculer le vrai centre en tenant compte de la rotation
        
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        
        // Offset du centre par rapport au coin inférieur gauche AVANT
        let offsetX = this.dimensions.length / 2;  // vers la droite
        let offsetZ = -this.dimensions.width / 2;  // vers l'avant (face visible)
        
        // Appliquer la rotation à l'offset pour obtenir la vraie position du centre
        const rotatedOffsetX = offsetX * cos - offsetZ * sin;
        const rotatedOffsetZ = offsetX * sin + offsetZ * cos;
        
        // Position réelle du centre de la brique
        const centerX = this.position.x + rotatedOffsetX;
        const centerY = this.position.y; // Y est déjà le centre
        const centerZ = this.position.z + rotatedOffsetZ;
        
        // Calculer les dimensions projetées avec la rotation
        // Pour une rotation, les nouvelles dimensions sont les projections des coins
        const halfLength = this.dimensions.length / 2;
        const halfWidth = this.dimensions.width / 2;
        const halfHeight = this.dimensions.height / 2;
        
        // Calculer les 4 coins de la brique dans le plan XZ (avant rotation)
        const corners = [
            { x: -halfLength, z: -halfWidth },
            { x: halfLength, z: -halfWidth },
            { x: halfLength, z: halfWidth },
            { x: -halfLength, z: halfWidth }
        ];
        
        // Appliquer la rotation aux coins
        const rotatedCorners = corners.map(corner => ({
            x: corner.x * cos - corner.z * sin,
            z: corner.x * sin + corner.z * cos
        }));
        
        // Trouver les limites min/max des coins rotés
        const xCoords = rotatedCorners.map(c => c.x);
        const zCoords = rotatedCorners.map(c => c.z);
        
        const minX = Math.min(...xCoords);
        const maxX = Math.max(...xCoords);
        const minZ = Math.min(...zCoords);
        const maxZ = Math.max(...zCoords);
        
        return {
            min: {
                x: centerX + minX,
                y: centerY - halfHeight,
                z: centerZ + minZ
            },
            max: {
                x: centerX + maxX,
                y: centerY + halfHeight,
                z: centerZ + maxZ
            }
        };
    }

    // Sérialisation pour sauvegarde
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            material: this.material,
            position: this.position,
            dimensions: this.dimensions,
            rotation: this.rotation,
            isVerticalJoint: this.isVerticalJoint,
            isHorizontalJoint: this.isHorizontalJoint
        };
    }

    // Désérialisation
    static fromJSON(data) {
        const element = new WallElement({
            type: data.type,
            material: data.material,
            x: data.position.x,
            y: data.position.y,
            z: data.position.z,
            length: data.dimensions.length,
            width: data.dimensions.width,
            height: data.dimensions.height,
            rotation: data.rotation
        });
        
        // Restaurer les propriétés de joint
        element.isVerticalJoint = data.isVerticalJoint || false;
        element.isHorizontalJoint = data.isHorizontalJoint || false;
        
        return element;
    }

    // Calculer la position du mesh avec le curseur au coin inférieur gauche
    updateMeshPosition() {
        if (!this.mesh) return;
        
        // Le curseur doit être au coin inférieur gauche AVANT de la brique
        // En mode normal (0°): coin inférieur gauche avant = (-length/2, 0, +width/2) 
        // En mode 90°: le bon coin devient celui qui était à droite avant
        
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        
        // Offset du centre par rapport au coin inférieur gauche AVANT
        let offsetX = this.dimensions.length / 2;  // vers la droite
        let offsetZ = -this.dimensions.width / 2;  // vers l'avant (face visible)
        
        // Appliquer la rotation à l'offset
        const rotatedOffsetX = offsetX * cos - offsetZ * sin;
        const rotatedOffsetZ = offsetX * sin + offsetZ * cos;
        
        // Positionner le mesh (centre de la brique)
        this.mesh.position.set(
            this.position.x + rotatedOffsetX,
            this.position.y,  // CORRECTION: utiliser directement this.position.y (qui est déjà le centre)
            this.position.z + rotatedOffsetZ
        );
        
        this.mesh.rotation.y = this.rotation;
    }

    dispose() {
        if (this.mesh) {
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) this.mesh.material.dispose();
            if (this.edgesMesh) {
                if (this.edgesMesh.geometry) this.edgesMesh.geometry.dispose();
                if (this.edgesMesh.material) this.edgesMesh.material.dispose();
            }
        }
    }
}

// Rendre WallElement disponible globalement
if (typeof window !== 'undefined') {
    window.WallElement = WallElement;
}

