// Classe pour représenter un élément de construction (brique, bloc, isolant)
class WallElement {
    constructor(options = {}) {
        // console.log('🏗️ WallElement: Constructeur appelé avec options:', options);
        // console.log('🏗️ WallElement: Type:', options.type, 'BlockType:', options.blockType, 'Material:', options.material);
        
        if (window.DEBUG_WALL_ELEMENT) {
            console.log('🏗️ WallElement: Création avec options:', options);
        }
        
        this.id = this.generateId();
        this.type = options.type || 'brick'; // brick, block, insulation
        this.material = options.material || this.getDefaultMaterial(options);
        
        console.log('🔧 WallElement constructor - Material final:', this.material, '(passé:', options.material, ')');
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
        
        // Ajout conditionnel des propriétés directes SEULEMENT si elles n'existent pas déjà
        if (options.width !== undefined) this.width = this.dimensions.width;
        if (options.height !== undefined) this.height = this.dimensions.height;
        if (options.length !== undefined) this.length = this.dimensions.length;
        if (options.width !== undefined) this.depth = this.dimensions.width;
        
    // Nouveau: nom d'assise (ex: "M65 Assise 2" ou "M65 #2") si fourni
    this.assiseName = options.assiseName || null;
        
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
    // Spécifiques poutres
    this.beamType = options.beamType || null;
    this.beamLengthCm = options.beamLengthCm || null;
        
        // Stocker les informations sur le type de bloc/brique pour déterminer le matériau
        this.blockType = options.blockType || null;
        this.brickType = options.brickType || null;
        // Séparer les types pour l'isolant
        this.insulationType = options.insulationType || null;
        if (this.type === 'insulation' && this.blockType) {
            console.warn('🔒 Sécurité: blockType fourni pour un isolant - suppression pour éviter une mauvaise détection', this.blockType);
            this.blockType = null;
        }
        
    // Nouveau: Détecter si c'est un élément GLB
    this.isGLBElement = this.checkIfGLBElement(options);
    this.glbPath = options.glbPath || null;
    // Échelle cible persistée (utile pour recharger après import, appliquée après chargement GLB)
    this._targetScale = options.meshScale || null;
        
        if (window.DEBUG_WALL_ELEMENT) {
            console.log('🏗️ WallElement: Types stockés - blockType:', this.blockType, 'brickType:', this.brickType);
            console.log('🏗️ WallElement: Élément GLB:', this.isGLBElement, 'Path:', this.glbPath);
        }
        
        // Déterminer la coupe à partir du blockType
        console.log('🔧 CUT EXTRACTION - blockType reçu dans constructeur:', this.blockType);
        console.log('🔧 CUT EXTRACTION - ID de l\'élément:', this.id);
        this.cut = this.extractCutFromBlockType(this.blockType, this.id) || '1/1';
        console.log('🔧 CUT EXTRACTION - cut finale attribuée:', this.cut);
        
        // Créer le mesh approprié (GLB ou géométrie standard)
        if (this.isGLBElement) {
            this.createGLBMesh();
        } else {
            this.createMesh();
        }
    }

    // Méthode pour extraire la coupe à partir du blockType ou de l'ID
    extractCutFromBlockType(blockType, elementId) {
        console.log('🔧 CUT EXTRACTION - Analyse démarrée pour blockType:', blockType, 'elementId:', elementId);
        
        // Correspondances des suffixes avec les coupes
        const cutMappings = {
            '_HALF': '1/2',
            '_1Q': '1/4', 
            '_3Q': '3/4',
            'HALF': '1/2',
            '1Q': '1/4',
            '1/2L': '1/2L',
            '1/2': '1/2',
            '3Q': '3/4'
        };
        
        // 1. Essayer d'abord avec le blockType
        if (blockType && typeof blockType === 'string') {
            for (const [suffix, cut] of Object.entries(cutMappings)) {
                if (blockType.includes(suffix)) {
                    console.log('🔧 CUT EXTRACTION - Trouvé suffixe dans blockType:', suffix, '→ coupe:', cut);
                    return cut;
                }
            }
        }
        
        // 2. Si blockType ne donne rien, essayer avec l'ID de l'élément
        if (elementId && typeof elementId === 'string') {
            console.log('🔧 CUT EXTRACTION - Tentative avec ID:', elementId);
            for (const [suffix, cut] of Object.entries(cutMappings)) {
                if (elementId.includes(suffix)) {
                    console.log('🔧 CUT EXTRACTION - Trouvé suffixe dans ID:', suffix, '→ coupe:', cut);
                    return cut;
                }
            }
        }
        
        // 3. Vérifier si le sélecteur actuel a des informations de coupe
        if (window.BlockSelector && window.BlockSelector.getCurrentBlockData) {
            try {
                const blockData = window.BlockSelector.getCurrentBlockData();
                console.log('🔧 CUT EXTRACTION - Données BlockSelector:', blockData);
                if (blockData && blockData.type && typeof blockData.type === 'string') {
                    for (const [suffix, cut] of Object.entries(cutMappings)) {
                        if (blockData.type.includes(suffix)) {
                            console.log('🔧 CUT EXTRACTION - Trouvé suffixe dans BlockSelector.type:', suffix, '→ coupe:', cut);
                            return cut;
                        }
                    }
                }
            } catch (error) {
                console.log('🔧 CUT EXTRACTION - Erreur lors de l\'accès à BlockSelector:', error);
            }
        }
        
        console.log('🔧 CUT EXTRACTION - Aucun suffixe trouvé, retour 1/1');
        // Si aucun suffixe trouvé, c'est une brique/bloc entier
        return '1/1';
    }

    // Méthode pour détecter si l'élément devrait être un GLB
    checkIfGLBElement(options) {
        // Vérifier si le type est explicitement GLB
        if (options.type && (options.type.includes('hourdis') || options.type.includes('poutrain') || options.type.includes('claveau'))) {
            return true;
        }
        
        // Vérifier dans BrickSelector si le type a une catégorie GLB
        if (options.type && window.BrickSelector && window.BrickSelector.brickTypes) {
            const brickData = window.BrickSelector.brickTypes[options.type];
            if (brickData && brickData.category === 'glb') {
                // Stocker le chemin GLB depuis BrickSelector
                this.glbPath = brickData.glbPath;
                return true;
            }
        }
        
        // Vérifier si un chemin GLB est fourni directement
        if (options.glbPath) {
            return true;
        }
        
        return false;
    }

    // Méthode pour créer un mesh GLB
    createGLBMesh() {
        console.log('🎯 Création GLB mesh pour:', this.type, 'Path:', this.glbPath);
        
        if (!this.glbPath) {
            console.warn('❌ Pas de chemin GLB défini, fallback vers géométrie standard');
            this.createMesh();
            return;
        }
        
        // Vérifier que GLTFLoader est disponible
        let GLTFLoaderClass = null;
        
        if (window.THREE && window.THREE.GLTFLoader) {
            GLTFLoaderClass = window.THREE.GLTFLoader;
        } else if (window.GLTFLoader) {
            GLTFLoaderClass = window.GLTFLoader;
        } else {
            console.warn('❌ GLTFLoader non disponible, fallback vers géométrie standard');
            this.createMesh();
            return;
        }
        
        try {
            const loader = new GLTFLoaderClass();
            loader.load(
                this.glbPath,
                (gltf) => {
                    console.log('✅ GLB chargé avec succès:', this.type);
                    
                    // Utiliser le modèle GLB comme mesh
                    this.mesh = gltf.scene;
                    this.mesh.userData = { 
                        element: this,
                        blockType: this.blockType,
                        type: this.type,
                        isGLB: true,
                        glbPath: this.glbPath
                    };

                    // Appliquer une échelle persistée si définie
                    if (this._targetScale) {
                        try {
                            this.mesh.scale.set(
                                this._targetScale.x ?? 1,
                                this._targetScale.y ?? 1,
                                this._targetScale.z ?? 1
                            );
                        } catch (e) { /* no-op */ }
                    }
                    
                    // Positionner le mesh
                    this.updateMeshPosition();
                    
                    console.log('🎯 GLB mesh créé et positionné pour:', this.type);

                    // Prévenir le système que le mesh GLB est prêt (utile pour l'import différé)
                    try {
                        const evt = new CustomEvent('glbMeshReady', { detail: { element: this } });
                        document.dispatchEvent(evt);
                    } catch (_) { /* no-op */ }
                },
                (progress) => {
                    // console.log(`📊 Chargement GLB: ${(progress.loaded / progress.total * 100)}%`);
                },
                (error) => {
                    console.error('❌ Erreur chargement GLB:', error);
                    console.log('🔄 Fallback vers géométrie standard');
                    this.createMesh();
                }
            );
        } catch (error) {
            console.error('❌ Erreur création loader GLB:', error);
            this.createMesh();
        }
    }

    // Méthode pour déterminer le matériau par défaut selon les règles spécifiées
    getDefaultMaterial(options) {
        // console.log('🔧 getDefaultMaterial appelée avec:', options);
        
        if (options.type === 'brick') {
            // Toutes les briques → brique rouge classique
            // console.log('🔧 Type brique détecté → brique-rouge-classique');
            return 'brique-rouge-classique';
        } else if (options.type === 'block') {
            const blockType = options.blockType || '';
            // Préférer une texture dédiée pour les blocs standard
            if (blockType) {
                // Terre cuite
                if (blockType.startsWith('TC_') || blockType === 'TERRE_CUITE' || blockType.startsWith('TC')) {
                    return 'terracotta';
                }
                // Béton cellulaire
                if (blockType.startsWith('BC_') || blockType.startsWith('BCA_') || blockType === 'CELLULAIRE') {
                    return 'cellular-concrete';
                }
                // Blocs béton creux usuels
                const upper = blockType.toUpperCase();
                if (upper.startsWith('B9') || upper.startsWith('B14') || upper.startsWith('B19') || upper.startsWith('B29')) {
                    return 'tex-blocbeton';
                }
            }
            // Fallback générique pour bloc (éviter une texture brique par défaut)
            return 'concrete';
        } else if (options.type === 'slab') {
            // Dalles personnalisées → béton
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
        // Utiliser timestamp + random + compteur pour garantir l'unicité
        if (!WallElement.idCounter) {
            WallElement.idCounter = 0;
        }
        WallElement.idCounter++;
        return 'element_' + Date.now() + '_' + WallElement.idCounter + '_' + Math.random().toString(36).substr(2, 6);
    }

    createMesh() {
        if (window.DEBUG_WALL_ELEMENT) {
            console.log('🔨 WallElement: createMesh() - Dimensions utilisées:', this.dimensions);
        }
        
        let geometry;
        let customGroup = null;
        // Si c'est une poutre, créer une géométrie extrudée à partir du profil
        if (this.type === 'beam' && window.BeamProfiles && window.BeamProfiles.getProfile) {
            const beamType = this.beamType || 'IPE80';
            const p = window.BeamProfiles.getProfile(beamType);
            const lengthCm = this.beamLengthCm || this.dimensions.length;
            if (p) {
                const mmToCm = (mm) => mm / 10;
                const H = mmToCm(p.h);
                const B = mmToCm(p.b);
                const hasThickness = (p.tw && p.tf) || p.t; // L utilise p.t
                const TW = p.tw ? mmToCm(p.tw) : (p.t ? mmToCm(p.t) : 1);
                const TF = p.tf ? mmToCm(p.tf) : (p.t ? mmToCm(p.t) : 1);
                const T = p.t ? mmToCm(p.t) : null; // épaisseur cornière
                const R = p.r ? mmToCm(p.r) : 0;
                const halfH = H / 2;
                const halfB = B / 2;
                const halfTW = TW / 2;

                let shape;
                if (beamType.startsWith('UPN')) {
                    const xWebInner = halfB - TW;
                    shape = new THREE.Shape();
                    shape.moveTo(-halfB,  halfH);
                    shape.lineTo( halfB,  halfH);
                    shape.lineTo( halfB, -halfH);
                    shape.lineTo(-halfB, -halfH);
                    shape.lineTo(-halfB, -halfH + TF);
                    shape.lineTo(xWebInner, -halfH + TF);
                    shape.lineTo(xWebInner,  halfH - TF);
                    shape.lineTo(-halfB,  halfH - TF);
                    shape.lineTo(-halfB,  halfH);
                    shape.closePath();
                } else if (beamType.startsWith('L') && T) {
                        // Forme en L orientée: aile horizontale en bas (face au sol)
                        shape = new THREE.Shape();
                        shape.moveTo(-halfB, -halfH);        // bas gauche
                        shape.lineTo( halfB, -halfH);        // bas droite (extrémité aile)
                        shape.lineTo( halfB, -halfH + T);    // monter épaisseur aile
                        shape.lineTo(-halfB + T, -halfH + T);// aller vers intérieur
                        shape.lineTo(-halfB + T,  halfH);    // monter jambe verticale intérieure
                        shape.lineTo(-halfB,  halfH);        // haut gauche
                        shape.lineTo(-halfB, -halfH);        // retour origine
                        shape.closePath();
                } else {
                    shape = new THREE.Shape();
                    shape.moveTo(-halfB,  halfH);
                    shape.lineTo( halfB,  halfH);
                    shape.lineTo( halfB,  halfH - TF);
                    if (R > 0) { shape.lineTo( halfTW + R, halfH - TF); shape.quadraticCurveTo( halfTW, halfH - TF,  halfTW, halfH - TF - R); } else { shape.lineTo( halfTW, halfH - TF); }
                    if (R > 0) { shape.lineTo( halfTW, -halfH + TF + R); shape.quadraticCurveTo( halfTW, -halfH + TF,  halfTW + R, -halfH + TF); } else { shape.lineTo( halfTW, -halfH + TF); }
                    shape.lineTo( halfB, -halfH + TF);
                    shape.lineTo( halfB, -halfH);
                    shape.lineTo(-halfB, -halfH);
                    shape.lineTo(-halfB, -halfH + TF);
                    if (R > 0) { shape.lineTo(-halfTW - R, -halfH + TF); shape.quadraticCurveTo(-halfTW, -halfH + TF, -halfTW, -halfH + TF + R); } else { shape.lineTo(-halfTW, -halfH + TF); }
                    if (R > 0) { shape.lineTo(-halfTW,  halfH - TF - R); shape.quadraticCurveTo(-halfTW,  halfH - TF, -halfTW - R,  halfH - TF); } else { shape.lineTo(-halfTW,  halfH - TF); }
                    shape.lineTo(-halfB,  halfH - TF);
                    shape.lineTo(-halfB,  halfH);
                    shape.closePath();
                }

                geometry = new THREE.ExtrudeGeometry(shape, { steps: 1, depth: Math.max(1, lengthCm), bevelEnabled: false });
            }
        }

        // Profil aluminium (PROFIL_*): créer un tube carré creux 6.5×6.5
        if (!geometry && this.blockType && typeof this.blockType === 'string' && this.blockType.toUpperCase().startsWith('PROFIL')) {
            try {
                const side = Math.min(this.dimensions.length, this.dimensions.width);
                const height = this.dimensions.height;
                const t = Math.max(0.4, Math.min(1.0, side * 0.12)); // épaisseur des parois ~12% (bornes 0.4–1.0cm)

                const half = side / 2;
                const innerHalf = Math.max(0, half - t);

                const shape = new THREE.Shape();
                // carré extérieur (CCW)
                shape.moveTo(-half,  half);
                shape.lineTo( half,  half);
                shape.lineTo( half, -half);
                shape.lineTo(-half, -half);
                shape.lineTo(-half,  half);

                // trou intérieur (CW)
                const hole = new THREE.Path();
                hole.moveTo(-innerHalf,  innerHalf);
                hole.lineTo( innerHalf,  innerHalf);
                hole.lineTo( innerHalf, -innerHalf);
                hole.lineTo(-innerHalf, -innerHalf);
                hole.lineTo(-innerHalf,  innerHalf);
                shape.holes = shape.holes || [];
                shape.holes.push(hole);

                const extrude = new THREE.ExtrudeGeometry(shape, {
                    steps: 1,
                    depth: Math.max(1, height),
                    bevelEnabled: false
                });
                // Centrer sur l'axe d'extrusion (Z) puis faire tourner pour aligner la profondeur avec Y
                extrude.translate(0, 0, -height / 2);
                extrude.rotateX(-Math.PI / 2);

                geometry = extrude;
            } catch (e) {
                console.warn('⚠️ Création géométrie PROFIL échouée, fallback BoxGeometry. Raison:', e);
            }
        }

        // Fallback box si pas une poutre ou si profil indisponible
        if (!geometry) {
            geometry = new THREE.BoxGeometry(
                this.dimensions.length,
                this.dimensions.height,
                this.dimensions.width
            );
        }
        
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
            console.log('🔧 WallElement.createMesh() - Matériau demandé:', this.material, '→ trouvé:', !!material);
            console.log('🔧 Type élément:', this.type, '- blockType:', this.blockType);
            if (material && material.map) {
                console.log('🔧 Texture du matériau:', material.map.image?.src || 'pas encore chargée');
            }
            // console.log('🔧 MaterialLibrary.getThreeJSMaterial:', this.material, '→', material ? 'trouvé' : 'NON TROUVÉ');
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
            // Déterminer la couleur appropriée selon le type d'élément
            let fallbackColor = 0xff0000; // rouge par défaut (pour debug)
            
            if (this.type === 'block') {
                fallbackColor = 0x8B4513; // marron pour les blocs
            } else if (this.type === 'brick') {
                fallbackColor = 0xD2691E; // orange terre cuite pour les briques
            } else if (this.type === 'insulation') {
                fallbackColor = 0xf0ebe2; // beige pour les isolants
            }
            
            // console.log(`🔧 Création d'un matériau de fallback pour type ${this.type} couleur ${fallbackColor.toString(16)}`);
            // console.log(`🔧 Création d'un matériau de fallback pour type ${this.type} couleur ${fallbackColor.toString(16)}`);
            material = new THREE.MeshLambertMaterial({ 
                color: fallbackColor,
                wireframe: false,  // EXPLICITEMENT pas wireframe
                side: THREE.DoubleSide 
            });
        }
        
        this.mesh = new THREE.Mesh(geometry, material);

        // Si poutre: orienter la longueur selon X (ExtrudeGeometry extrude en +Z), donc rotation Y = PI/2
        if (this.type === 'beam') {
            this.mesh.rotation.y = Math.PI / 2;
        }
        
        // Positionner la brique avec le curseur au coin inférieur gauche
        this.updateMeshPosition();
        
        // Référence vers l'élément pour le picking
        this.mesh.userData = { 
            element: this,
            blockType: this.blockType,
            type: this.type,
            material: this.material
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

        // Afficher le nom d'assise (mini label) si disponible
    if (false && this.assiseName && this.type !== 'beam') {
            if (this.assiseLabel) {
                this.mesh.remove(this.assiseLabel);
                if (this.assiseLabel.material) this.assiseLabel.material.dispose();
                if (this.assiseLabel.geometry) this.assiseLabel.geometry.dispose();
            }
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 256; canvas.height = 64;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.fillRect(0,0,256,64);
                ctx.fillStyle = '#000';
                ctx.font = '28px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.assiseName, 128, 32);
                const texture = new THREE.CanvasTexture(canvas);
                const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
                const sprite = new THREE.Sprite(mat);
                sprite.scale.set(10, 2.5, 1); // taille raisonnable
                sprite.position.set(0, this.dimensions.height + 1, 0); // au-dessus
                this.assiseLabel = sprite;
                this.mesh.add(sprite);
            } catch(e) { /* ignore */ }
        }
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
            if (this.type === 'beam' && window.BeamProfiles && window.BeamProfiles.getProfile) {
                const beamType = this.beamType || 'IPE80';
                const p = window.BeamProfiles.getProfile(beamType);
                // IMPORTANT: pour les poutres, la longueur passée en paramètre doit être l'autorité
                // afin que le fantôme reflète immédiatement le clic 100/200/300/400/P.
                // On synchronise aussi this.beamLengthCm pour la sérialisation et les futures reconstructions.
                const lengthCm = length; // utiliser la longueur demandée
                this.beamLengthCm = lengthCm;
                if (p) {
                    const mmToCm = (mm) => mm / 10;
                    const H = mmToCm(p.h);
                    const B = mmToCm(p.b);
                    const TW = mmToCm(p.tw);
                    const TF = mmToCm(p.tf);
                    const R = p.r ? mmToCm(p.r) : 0;
                    const halfH = H / 2;
                    const halfB = B / 2;
                    const halfTW = TW / 2;
                    const shape = new THREE.Shape();
                    if (beamType.startsWith('UPN')) {
                        const xWebOuter = -halfB + TW;
                        shape.moveTo( halfB,  halfH);
                        shape.lineTo(xWebOuter,  halfH);
                        if (R > 0) { shape.lineTo(xWebOuter,  halfH - TF - R); shape.quadraticCurveTo(xWebOuter, halfH - TF, xWebOuter + R, halfH - TF); } else { shape.lineTo(xWebOuter,  halfH - TF); }
                        shape.lineTo( halfB,  halfH - TF);
                        shape.lineTo( halfB, -halfH + TF);
                        if (R > 0) { shape.lineTo(xWebOuter + R, -halfH + TF); shape.quadraticCurveTo(xWebOuter, -halfH + TF, xWebOuter, -halfH + TF + R); } else { shape.lineTo(xWebOuter, -halfH + TF); }
                        shape.lineTo(xWebOuter, -halfH);
                        shape.lineTo( halfB, -halfH);
                        shape.closePath();
                    } else if (beamType.startsWith('L') && T) {
                        // Forme en L (cornière) plein (union de deux rectangles)
                        shape.moveTo(-halfB,  halfH);
                        shape.lineTo( halfB,  halfH);
                        shape.lineTo( halfB,  halfH - T);
                        shape.lineTo(-halfB + T, halfH - T);
                        shape.lineTo(-halfB + T, -halfH);
                        shape.lineTo(-halfB, -halfH);
                        shape.closePath();
                    } else {
                        shape.moveTo(-halfB,  halfH);
                        shape.lineTo( halfB,  halfH);
                        shape.lineTo( halfB,  halfH - TF);
                        if (R > 0) { shape.lineTo( halfTW + R, halfH - TF); shape.quadraticCurveTo( halfTW, halfH - TF,  halfTW, halfH - TF - R); } else { shape.lineTo( halfTW, halfH - TF); }
                        if (R > 0) { shape.lineTo( halfTW, -halfH + TF + R); shape.quadraticCurveTo( halfTW, -halfH + TF,  halfTW + R, -halfH + TF); } else { shape.lineTo( halfTW, -halfH + TF); }
                        shape.lineTo( halfB, -halfH + TF);
                        shape.lineTo( halfB, -halfH);
                        shape.lineTo(-halfB, -halfH);
                        shape.lineTo(-halfB, -halfH + TF);
                        if (R > 0) { shape.lineTo(-halfTW - R, -halfH + TF); shape.quadraticCurveTo(-halfTW, -halfH + TF, -halfTW, -halfH + TF + R); } else { shape.lineTo(-halfTW, -halfH + TF); }
                        if (R > 0) { shape.lineTo(-halfTW,  halfH - TF - R); shape.quadraticCurveTo(-halfTW,  halfH - TF, -halfTW - R,  halfH - TF); } else { shape.lineTo(-halfTW,  halfH - TF); }
                        shape.lineTo(-halfB,  halfH - TF);
                        shape.lineTo(-halfB,  halfH);
                        shape.closePath();
                    }
                    this.mesh.geometry = new THREE.ExtrudeGeometry(shape, { steps: 1, depth: Math.max(1, lengthCm), bevelEnabled: false });
                    // Déplacer la géométrie pour que le coin inférieur "début" (x=min, y=min, longueur début) soit le pivot (0,0,0)
                    // Avant rotation: shape centré sur (0,0), extrudé de z=0 à z=length.
                    // Coin voulu avant rotation: (x = -B/2, y = -H/2, z = 0)
                    // Translation nécessaire: (+B/2, +H/2, 0)
                    this.mesh.geometry.translate(B/2, H/2, 0);
                    // Appliquer la rotation pour aligner la longueur sur X
                    this.mesh.rotation.y = Math.PI / 2;
                    // Edges seront recréés par createEdges()
                } else {
                    this.mesh.geometry = new THREE.BoxGeometry(
                        this.dimensions.length,
                        this.dimensions.height,
                        this.dimensions.width
                    );
                }
            } else if (this.blockType && typeof this.blockType === 'string' && this.blockType.toUpperCase().startsWith('PROFIL')) {
                // Conserver la géométrie de tube carré creux pour les PROFIL_*
                try {
                    const side = Math.min(this.dimensions.length, this.dimensions.width);
                    const h = this.dimensions.height;
                    const t = Math.max(0.4, Math.min(1.0, side * 0.12));

                    const half = side / 2;
                    const innerHalf = Math.max(0, half - t);

                    const shape = new THREE.Shape();
                    // carré extérieur (CCW)
                    shape.moveTo(-half,  half);
                    shape.lineTo( half,  half);
                    shape.lineTo( half, -half);
                    shape.lineTo(-half, -half);
                    shape.lineTo(-half,  half);

                    // trou intérieur (CW)
                    const hole = new THREE.Path();
                    hole.moveTo(-innerHalf,  innerHalf);
                    hole.lineTo( innerHalf,  innerHalf);
                    hole.lineTo( innerHalf, -innerHalf);
                    hole.lineTo(-innerHalf, -innerHalf);
                    hole.lineTo(-innerHalf,  innerHalf);
                    shape.holes = shape.holes || [];
                    shape.holes.push(hole);

                    const extrude = new THREE.ExtrudeGeometry(shape, {
                        steps: 1,
                        depth: Math.max(1, h),
                        bevelEnabled: false
                    });
                    // Centrer et orienter comme dans createMesh()
                    extrude.translate(0, 0, -h / 2);
                    extrude.rotateX(-Math.PI / 2);
                    this.mesh.geometry = extrude;
                } catch (e) {
                    console.warn('⚠️ updateDimensions PROFIL: échec création géométrie, fallback BoxGeometry. Raison:', e);
                    this.mesh.geometry = new THREE.BoxGeometry(
                        this.dimensions.length,
                        this.dimensions.height,
                        this.dimensions.width
                    );
                }
            } else {
                this.mesh.geometry = new THREE.BoxGeometry(
                    this.dimensions.length,
                    this.dimensions.height,
                    this.dimensions.width
                );
            }
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
                newMaterial.transparent = false;
                newMaterial.opacity = 1.0;
                newMaterial.alphaTest = 0.1;
                newMaterial.side = THREE.DoubleSide;
                newMaterial.needsUpdate = true;
            }

            // Sécurité visibilité pour toutes matières
            newMaterial.depthWrite = true;
            newMaterial.depthTest = true;
            newMaterial.alphaTest = newMaterial.alphaTest ?? 0.0;
            newMaterial.side = newMaterial.side ?? THREE.DoubleSide;
            newMaterial.transparent = false;
            newMaterial.opacity = 1.0;
            newMaterial.needsUpdate = true;

            this.mesh.material = newMaterial;
            // S'assurer que le mesh est bien visible
            this.mesh.visible = true;
            this.mesh.castShadow = true;
            this.mesh.receiveShadow = true;
        }
    }

    setRotation(angle) {
        this.rotation = angle;
        this.updateMeshPosition(); // Repositionner le mesh après rotation
    }

    setSelected(selected) {
        this.selected = selected;
        if (this.mesh) {
            const mat = this.mesh.material;
            // Sécuriser: certains matériaux peuvent ne pas avoir d'emissive (ex: MeshBasicMaterial)
            if (mat && mat.emissive) {
                if (selected) {
                    // Sauvegarder l'émissive originale si non encore sauvé
                    if (!this.mesh.userData._originalEmissive) {
                        this.mesh.userData._originalEmissive = mat.emissive.clone();
                    }
                    // Appliquer une surbrillance bleu vive pour une sélection claire
                    mat.emissive.setHex(0x3b82f6); // blue-500
                    mat.emissiveIntensity = Math.max(mat.emissiveIntensity || 0.5, 0.6);
                    mat.needsUpdate = true;
                } else {
                    // Restaurer l'émissive originale si disponible
                    if (this.mesh.userData._originalEmissive) {
                        mat.emissive.copy(this.mesh.userData._originalEmissive);
                        delete this.mesh.userData._originalEmissive;
                    } else {
                        mat.emissive.setHex(0x000000);
                    }
                    mat.needsUpdate = true;
                }
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
        const data = {
            id: this.id,
            type: this.type,
            material: this.material,
            position: this.position,
            dimensions: this.dimensions,
            rotation: this.rotation,
            blockType: this.blockType || undefined,
            brickType: this.brickType || undefined,
            insulationType: this.insulationType || undefined,
            beamType: this.beamType || undefined,
            beamLengthCm: this.beamLengthCm || undefined,
            assiseName: this.assiseName || undefined,
            isVerticalJoint: this.isVerticalJoint,
            isHorizontalJoint: this.isHorizontalJoint
        };

        // Conserver des métadonnées utiles pour reconstruire correctement les joints après rechargement
        if (this.isVerticalJoint || this.isHorizontalJoint) {
            if (typeof this.originalBrickHeight === 'number') {
                data.originalBrickHeight = this.originalBrickHeight;
            }
            if (this.referenceAssiseType !== undefined) {
                data.referenceAssiseType = this.referenceAssiseType;
            }
            if (this.referenceAssiseIndex !== undefined) {
                data.referenceAssiseIndex = this.referenceAssiseIndex;
            }
        }

        // Inclure les métadonnées GLB si applicable
        if (this.isGLBElement || this.glbPath) {
            data.isGLBElement = true;
            data.glbPath = this.glbPath || undefined;
            // Sauvegarder l'échelle si le mesh existe
            if (this.mesh && this.mesh.scale) {
                data.meshScale = {
                    x: this.mesh.scale.x,
                    y: this.mesh.scale.y,
                    z: this.mesh.scale.z
                };
            }
        }

        return data;
    }

    // Désérialisation
    static fromJSON(data) {
        // Compatibilité matériaux: éviter de charger des blocs avec des textures de briques
        let material = data.material;
        const blockType = data.blockType || '';
        if (data.type === 'block') {
            const matId = (material || '').toString();
            const unknownInLib = (function(id){
                try { return !window.MaterialLibrary || !window.MaterialLibrary.materials || !window.MaterialLibrary.materials[id]; }
                catch(_) { return true; }
            })(matId);
            const looksLikeBrick = matId.includes('brique') || matId.includes('brick');
            if (!material || looksLikeBrick || unknownInLib) {
                const bt = (blockType || '').toUpperCase();
                if (bt.startsWith('BC_') || bt.startsWith('BCA_') || data.insulationType === 'CELLULAIRE' || bt === 'CELLULAIRE') {
                    material = 'cellular-concrete';
                } else if (bt.startsWith('B9') || bt.startsWith('B14') || bt.startsWith('B19') || bt.startsWith('B29')) {
                    material = 'tex-blocbeton';
                } else if (bt.startsWith('TC_') || bt === 'TERRE_CUITE' || bt.startsWith('TC')) {
                    material = 'terracotta';
                } else {
                    material = 'concrete';
                }
                // console.log('🔧 Compat matériaux: bloc importé avec matériau brick → corrigé en', material, 'pour blockType', blockType);
            }
        }

        const element = new WallElement({
            type: data.type,
            material,
            x: data.position.x,
            y: data.position.y,
            z: data.position.z,
            length: data.dimensions.length,
            width: data.dimensions.width,
            height: data.dimensions.height,
            rotation: data.rotation,
            blockType: data.blockType,
            brickType: data.brickType,
            insulationType: data.insulationType,
            beamType: data.beamType,
            beamLengthCm: data.beamLengthCm,
            assiseName: data.assiseName,
            // GLB
            glbPath: data.glbPath,
            meshScale: data.meshScale
        });
        
        // Restaurer les propriétés de joint
        element.isVerticalJoint = data.isVerticalJoint || false;
        element.isHorizontalJoint = data.isHorizontalJoint || false;
        // Restaurer les métadonnées utilisées pour recalculer les joints
        if (data.originalBrickHeight !== undefined) element.originalBrickHeight = data.originalBrickHeight;
        if (data.referenceAssiseType !== undefined) element.referenceAssiseType = data.referenceAssiseType;
        if (data.referenceAssiseIndex !== undefined) element.referenceAssiseIndex = data.referenceAssiseIndex;
        
        return element;
    }

    // Calculer la position du mesh avec le curseur au coin inférieur gauche
    updateMeshPosition() {
        if (!this.mesh) return;
        
        // Le curseur doit être au coin inférieur gauche AVANT de la brique
        // En mode normal (0°): coin inférieur gauche avant = (-length/2, 0, +width/2) 
        // En mode 90°: le bon coin devient celui qui était à droite avant
    // IMPORTANT: Pour les poutres, la géométrie est tournée de +90° (PI/2) autour de Y
    // afin d'aligner la longueur sur X. Il faut donc utiliser cette rotation finale
    // pour calculer l'offset du centre, sinon le point d'accroche sera décalé.
    const finalRotationY = (this.type === 'beam') ? (this.rotation + Math.PI / 2) : this.rotation;
    const cos = Math.cos(finalRotationY);
    const sin = Math.sin(finalRotationY);
        
        if (this.type === 'beam') {
            // Pour les poutres: pivot déjà placé au coin début inférieur (après translation géométrie).
            // Donc position.x / y / z = coin voulu.
            this.mesh.rotation.y = finalRotationY;
            // Calculer le coin min réel après rotation pour aligner précisément le pivot
            if (!this.mesh.geometry.boundingBox) {
                this.mesh.geometry.computeBoundingBox();
            }
            const bb = this.mesh.geometry.boundingBox;
            // bb min/max sont dans l'espace local (après rotation appliquée via matrix lors du rendu, donc on corrige en positionnant)
            // On veut que le coin min (x,y,z) corresponde exactement à this.position
            // Actuellement, le mesh est centré/pivot sur (0,0,0) ou déjà translaté; on applique un offset par rapport à bb.min
            const offsetX = -bb.min.x;
            const offsetY = -bb.min.y;
            const offsetZ = -bb.min.z;
            this.mesh.position.set(
                this.position.x + offsetX,
                this.position.y + offsetY,
                this.position.z + offsetZ
            );
        } else {
            // Offset du centre par rapport au coin inférieur gauche AVANT
            let offsetX = this.dimensions.length / 2;  // vers la droite
            let offsetZ = -this.dimensions.width / 2;  // vers l'avant (face visible)
            // Appliquer la rotation à l'offset
            const rotatedOffsetX = offsetX * cos - offsetZ * sin;
            const rotatedOffsetZ = offsetX * sin + offsetZ * cos;
            // Positionner le mesh (centre)
            this.mesh.position.set(
                this.position.x + rotatedOffsetX,
                this.position.y,
                this.position.z + rotatedOffsetZ
            );
            this.mesh.rotation.y = finalRotationY;
        }
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

