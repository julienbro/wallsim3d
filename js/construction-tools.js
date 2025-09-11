// Outils de construction et de manipulation - Version CORRIGÉE 10/08/2025

// NOUVEAU: Variable globale pour contrôler l'affichage des lettres de proposition adjacente
window.showAdjacentProposalLetters = false;


// Test de vérification des corrections
window.testJointCorrections = function() {
        if (window.AssiseManager && window.AssiseManager.calculateAssiseHeightForType) {
        const test1 = window.AssiseManager.calculateAssiseHeightForType('M65', 1);
        const test2 = window.AssiseManager.calculateAssiseHeightForType('M65', 2); 
        const test3 = window.AssiseManager.calculateAssiseHeightForType('M65', 3);
        console.log('🧪 calculateAssiseHeightForType M65:', {
            'index 1': test1 + ' cm',
            'index 2': test2 + ' cm', 
            'index 3': test3 + ' cm (devrait être 24.3)'
        });
        return test3 === 24.3;
    } else {
                return false;
    }
};

// Test complet de placement et vérification des joints
window.testJointPlacement = function() {
        
    // 1. Compter les joints existants
    const jointsBefore = Array.from(window.SceneManager.elements.values()).filter(el => el.type === 'joint');
    
    // 2. Vérifier qu'on est sur l'assise 3
    if (window.AssiseManager.currentAssiseByType.get('M65') !== 2) {
        console.log('⚠️  Activez d\'abord l\'assise 3 pour tester !');
        return false;
    }
    
    // 3. Placer une brique test
    console.log('🧱 Placement d\'une brique test sur assise 3...');
    const testBrick = new WallElement({
        type: 'brick',
        material: 'brique-rouge-classique',
        x: Math.random() * 20 - 10, // Position aléatoire
        y: 19.85, // Position calculée pour assise 3
        z: Math.random() * 20 - 10,
        length: 19,
        width: 9,
        height: 6.5
    });
    
    window.SceneManager.addElement(testBrick);
    console.log('✅ Brique test placée:', testBrick.id);
    
    // 4. Attendre et vérifier les nouveaux joints
    setTimeout(() => {
        const jointsAfter = Array.from(window.SceneManager.elements.values()).filter(el => el.type === 'joint');
        const newJointsCount = jointsAfter.length - jointsBefore.length;
        
        if (newJointsCount > 0) {
            const newJoints = jointsAfter.slice(-newJointsCount);
            let correctJoints = 0;
            
            newJoints.forEach((joint, i) => {
                const expectedY = 24.3; // Hauteur attendue pour assise 3
                const actualY = joint.position.y;
                const isCorrect = Math.abs(actualY - expectedY) < 0.5; // Tolérance 5mm
                
                if (isCorrect) correctJoints++;
                
                console.log(`🆕 Joint ${i+1}: Y=${actualY}cm`, isCorrect ? '✅' : `❌ (attendu: ${expectedY}cm)`);
            });
            
            const success = correctJoints === newJointsCount;
            console.log(success ? '🎉 TEST RÉUSSI ! Tous les joints sont correctement positionnés' : 
                                 `❌ TEST ÉCHOUÉ ! ${correctJoints}/${newJointsCount} joints corrects`);
            return success;
        } else {
            console.log('❌ Aucun joint créé - vérifiez que les joints automatiques sont activés');
            return false;
        }
    }, 1000);
    
    return true;
};

// Test rapide pour vérifier le nombre de joints
window.countJoints = function() {
    const joints = Array.from(window.SceneManager.elements.values()).filter(el => el.type === 'joint');
    joints.forEach((joint, i) => {
        console.log(`  Joint ${i+1}: Y=${joint.position.y.toFixed(1)}cm (${joint.id})`);
    });
    return joints.length;
};

// Test de nettoyage pour supprimer tous les joints
window.clearAllJoints = function() {
    const joints = Array.from(window.SceneManager.elements.values()).filter(el => el.type === 'joint');
    console.log(`🧹 Suppression de ${joints.length} joints...`);
    joints.forEach(joint => {
        window.SceneManager.removeElement(joint.id);
    });
    console.log('✅ Tous les joints supprimés');
    return true;
};

// INTERCEPTEUR GLOBAL pour traquer toutes les créations de joints
window.originalCreateElement = null;
window.originalAddElement = null;
window.originalElements = new Map(); // Stocker les éléments originaux
window.trackJointCreation = function() {
        
    // Intercepter SceneManager.createElement
    if (window.SceneManager && window.SceneManager.createElement && !window.originalCreateElement) {
        window.originalCreateElement = window.SceneManager.createElement;
        window.SceneManager.createElement = function(type, position, rotation, dimensions, material, layerId) {
            if ((layerId && layerId.includes('joint')) || type === 'joint') {
                console.log('🕵️ JOINT CRÉÉ via createElement:', {
                    type: type,
                    layerId: layerId,
                    position: position,
                    dimensions: dimensions,
                    stack: new Error().stack.split('\n')[2].trim()
                });
            }
            return window.originalCreateElement.call(this, type, position, rotation, dimensions, material, layerId);
        };
    }
    
    // Intercepter SceneManager.addElement
    if (window.SceneManager && window.SceneManager.addElement && !window.originalAddElement) {
        window.originalAddElement = window.SceneManager.addElement;
        window.SceneManager.addElement = function(element) {
            if (element && ((element.id && element.id.includes('joint')) || element.type === 'joint')) {
                console.log('🕵️ JOINT CRÉÉ via addElement:', {
                    id: element.id,
                    type: element.type || element.userData?.type,
                    position: element.position,
                    dimensions: element.dimensions,
                    y: element.position ? element.position.y : 'undefined',
                    stack: new Error().stack.split('\n')[2].trim()
                });
            }
            return window.originalAddElement.call(this, element);
        };
    }
    
    // Intercepter WallElement constructor si possible
    if (window.WallElement && !window.WallElement._tracked) {
        const originalWallElement = window.WallElement;
        window.WallElement = function(config) {
            if (config && config.type === 'joint') {
                console.log('🕵️ JOINT CRÉÉ via WallElement constructor:', {
                    config: config,
                    y: config.y,
                    stack: new Error().stack.split('\n')[2].trim()
                });
            }
            const element = new originalWallElement(config);
            return element;
        };
        // Copier toutes les propriétés statiques
        Object.setPrototypeOf(window.WallElement, originalWallElement);
        Object.assign(window.WallElement, originalWallElement);
        window.WallElement._tracked = true;
    }
    
    console.log('🕵️ Intercepteurs installés - WallElement, SceneManager.createElement et addElement');
    
    // NOUVEAU: Intercepter aussi les ajouts directs aux éléments SceneManager
    if (window.SceneManager && window.SceneManager.elements && !window.SceneManager._elementsIntercepted) {
        const originalSet = window.SceneManager.elements.set;
        window.SceneManager.elements.set = function(key, element) {
            if (element && element.type === 'joint') {
                console.log('🕵️ JOINT CRÉÉ via SceneManager.elements.set:', {
                    id: key,
                    element: element,
                    position: element.position,
                    y: element.position ? element.position.y : 'undefined',
                    stack: new Error().stack.split('\n')[2].trim()
                });
            }
            return originalSet.call(this, key, element);
        };
        window.SceneManager._elementsIntercepted = true;
    }
    
    // Afficher l'aide des fonctions de test disponibles
    console.log('');
    console.log('🧪 FONCTIONS DE TEST DISPONIBLES:');
    console.log('  window.testJointCorrections()  - Teste les calculs de hauteur d\'assise');
    console.log('  window.testJointPlacement()    - Teste le placement automatique des joints');
    console.log('  window.countJoints()           - Compte et liste tous les joints');
    console.log('  window.clearAllJoints()        - Supprime tous les joints existants');
    console.log('  window.trackJointCreation()    - Active le suivi des créations de joints');
    console.log('');
};
class ConstructionTools {
    constructor() {
        this.currentMode = 'brick';
        this.currentMaterial = 'brique-rouge-classique';
        this.isPlacementMode = false;
        this.previewElement = null;
        this.ghostElement = null; // Élément fantôme permanent
        this.supportElement = null; // Élément support pour l'empilage vertical
        this.snapToGrid = true;
        this.autoStack = true; // Empilage automatique
        this.showGhost = true; // Afficher l'élément fantôme
        this.isInitialized = false;
        
        // Système de suggestions de placement
        this.suggestionGhosts = []; // Array pour stocker les fantômes de suggestion
        this.showSuggestions = true; // Activer/désactiver les suggestions
        this.activeBrickForSuggestions = null; // Brique sélectionnée pour suggestions
        
        // 🆕 NOUVEAU: Système de blocage des suggestions après désactivation par interface
        this.suggestionsDisabledByInterface = false; // Flag pour bloquer la réapparition automatique
        
        // Système de rotation manuelle
        this.hasManualRotation = false; // Tracker si une rotation manuelle a été effectuée
        this.manualRotation = 0; // Valeur de rotation manuelle

        // Système d'animation des points snap sur la grille
        this.gridSnapPoints = []; // Array pour les points de snap animés
    // Désactivation par défaut: évite l'affichage du curseur (anneau animé) immédiatement au démarrage
    // L'utilisateur pourra l'activer via toggleGridSnapPoints() ou une action UI explicite
    this.showGridSnap = false; // (était true) Afficher/masquer les points snap
        this.snapAnimationId = null; // ID de l'animation en cours
        this.snapGridSpacing = 19; // Espacement de la grille snap (19cm par défaut)
        this.cursorSnapPoint = null; // Point snap qui suit le curseur
        
        // Protection contre les boucles infinies
        this._updateQueue = new Set(); // Queue des mises à jour en attente
        this._isUpdating = false; // Flag pour éviter les mises à jour concurrentes
        this._updateDebounceTimer = null; // Timer pour debounce les mises à jour
        this._positionUpdateThrottle = null; // Timer pour throttling des positions
        this._heightUpdateThrottle = null; // Timer pour throttling de la hauteur
        this._lastGhostPosition = null; // Dernière position du fantôme pour éviter les recalculs

        // Système de joints automatiques (legacy)
        this.autoJoints = true; // Joints automatiques activés par défaut
        this.jointThickness = 10; // Épaisseur des joints verticaux en mm (par défaut 10mm = 1cm)
        
        // Nouveaux systèmes de joints séparés
        // Joints de briques (utilise le matériau joint-gris-souris par défaut)
        this.brickJointThickness = 12; // mm - 1.2cm par défaut pour briques classiques
        this.brickJointColor = '#9E9E9E'; // Couleur gris souris (correspond au matériau joint-gris-souris)
        this.showBrickJoints = true;
        this.autoBrickJoints = true;
        
        // Joints de blocs (utilise le matériau joint-gris-souris par défaut)
        this.blockJointThickness = 10; // mm - 1cm pour blocs creux B par défaut
        this.blockJointColor = '#9E9E9E'; // Couleur gris souris (correspond au matériau joint-gris-souris)
        this.showBlockJoints = true;
        this.autoBlockJoints = true;
        
        // Joints spécifiques par type de matériau
        this.materialJointSettings = {
            // Isolants : pas de joints
            'insulation': {
                createJoints: false,
                horizontalThickness: 0,
                verticalThickness: 0
            },
            // Béton cellulaire : joints variables selon l'assise (voir getJointSettingsForElement)
            'cellular-concrete': {
                createJoints: true, // Sera déterminé dynamiquement selon l'assise
                horizontalThickness: 12, // Assise 1: 1.2cm (joint au sol), assises 2+: 2mm (colle)
                verticalThickness: 0     // 0mm - PAS de joints verticaux pour béton cellulaire (TOUTES assises)
            },
            // Béton cellulaire assise : joints variables selon l'assise (voir getJointSettingsForElement)
            'cellular-assise': {
                createJoints: true, // Sera déterminé dynamiquement selon l'assise
                horizontalThickness: 12, // Assise 1: 1.2cm (joint au sol), assises 2+: 2mm (colle)
                verticalThickness: 0     // 0mm - PAS de joints verticaux pour béton cellulaire (TOUTES assises)
            }
        };

        // Debug: vérifier les valeurs par défaut dans ConstructionTools
        /* console.log('🔍 ConstructionTools - Valeurs par défaut initialisées:', {
            brickJointColor: this.brickJointColor,
            blockJointColor: this.blockJointColor
        }); */

        // Gestion de l'icône de suppression
        this.currentDeleteIcon = null; // Référence vers l'icône de suppression actuelle
        this.currentDeleteIconElement = null; // Référence vers l'élément associé à l'icône
        this.deleteIconUpdateListener = null; // Référence vers le listener de mise à jour

        this.setupEventListeners();
        this.setupAssiseEventListeners(); // Écouter les événements d'AssiseManager
        
        // 🆕 NOUVEAU: Configurer la surveillance des menus de façon permanente
        this.setupMenuHoverListener();
        
        // Ne pas créer l'élément fantôme immédiatement
    }

    // Méthode utilitaire pour mettre à jour les éléments DOM en toute sécurité
    safeUpdateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        } else {
            console.warn(`Élément DOM avec l'ID '${elementId}' non trouvé`);
        }
    }

    // Méthode d'initialisation appelée après que la scène soit prête
    init() {
        if (this.isInitialized) return;
        
        this.createGhostElement();
        this.updateThreeJsVersion(); // Afficher la version de Three.js
        this.setupDeleteIconListeners(); // Configurer les listeners pour l'icône de suppression
        this.isInitialized = true;
    }

    // Mettre à jour l'affichage de la version Three.js dans la barre de statut
    updateThreeJsVersion() {
        const versionElement = document.getElementById('threejsVersion');
        if (versionElement) {
            if (typeof THREE !== 'undefined' && THREE.REVISION) {
                versionElement.textContent = `r${THREE.REVISION}`;
            } else {
                versionElement.textContent = 'Non détectée';
            }
        }
    }

    // Configurer les listeners pour mettre à jour la position de l'icône de suppression
    setupDeleteIconListeners() {
        // Mettre à jour la position de l'icône lors des événements de caméra
        if (window.SceneManager && window.SceneManager.controls) {
            const updateIconPosition = () => {
                if (this.currentDeleteIconElement) {
                    this.updateDeleteIconPosition(this.currentDeleteIconElement);
                }
            };
            
            // Écouter les événements de changement de la caméra
            window.SceneManager.controls.addEventListener('change', updateIconPosition);
            
            // Stocker la référence pour pouvoir supprimer les listeners plus tard
            this.deleteIconUpdateListener = updateIconPosition;
        }
        
        // Mettre à jour lors du redimensionnement de la fenêtre
        window.addEventListener('resize', () => {
            if (this.currentDeleteIconElement) {
                setTimeout(() => {
                    this.updateDeleteIconPosition(this.currentDeleteIconElement);
                }, 100); // Délai pour permettre le redimensionnement
            }
        });
    }

    createGhostElement() {
        // Vérifier que la scène est disponible
        if (!window.SceneManager || !window.SceneManager.scene) {
            console.warn('SceneManager non disponible, report de la création de l\'élément fantôme');
            return;
        }

        // Créer un élément fantôme permanent qui suit le curseur
        this.removeGhostElement(); // Supprimer l'ancien s'il existe
        
        // Vérifier s'il y a des informations GLB temporaires
        if (window.tempGLBInfo) {
            // 🔧 PROTECTION: Éviter la création multiple de fantômes GLB
            if (this.ghostElement) {
                return;
            }
            
            this.createGLBGhostElement(window.tempGLBInfo);
            return;
        }
        
        // CORRECTION: Utiliser les dimensions selon le mode actuel
        let length, width, height;
        if (this.currentMode === 'brick' && window.BrickSelector) {
            // Pour les briques, utiliser BrickSelector
            const currentBrick = window.BrickSelector.getCurrentBrick();
            length = currentBrick.length;
            width = currentBrick.width;
            height = currentBrick.height;
            
            // ✅ CORRECTION: Ne PAS appliquer de coupe - les dimensions sont déjà correctes
            // Les types comme M65_HALF ont déjà les bonnes dimensions dans BrickSelector
            
            if (window.DEBUG_CONSTRUCTION) {
                // console.log('🧱 Fantôme: Données BrickSelector:', currentBrick);
                // console.log('🧱 Fantôme: Type actuel:', currentBrick.type || 'unknown');
                // console.log('🧱 Fantôme: Dimensions extraites:', {length, width, height});
            }
        } else if (this.currentMode === 'block' && window.BlockSelector) {
            // Pour les blocs, utiliser BlockSelector
            const currentBlock = window.BlockSelector.getCurrentBlockData();
            length = currentBlock.length;
            width = currentBlock.width;
            height = currentBlock.height;
            // IMPORTANT: ne pas réappliquer de ratio ici (BlockSelector donne déjà la longueur exacte pour HALF / 3Q / 1Q / personnalisés)
        } else if (this.currentMode === 'insulation' && window.InsulationSelector) {
            // Pour les isolants, récupérer l'objet déjà ajusté (coupe appliquée dedans)
            const currentInsulation = (typeof window.InsulationSelector.getCurrentInsulationWithCutObject === 'function'
                ? window.InsulationSelector.getCurrentInsulationWithCutObject()
                : window.InsulationSelector.getCurrentInsulationData());
            length = currentInsulation.length;
            width = currentInsulation.width;
            height = currentInsulation.height;

            // IMPORTANT: ne pas réappliquer un ratio ici, la méthode getCurrentInsulationWithCutObject l'a déjà fait.
            // (Ancienne logique supprimée pour éviter une double réduction donnant 1/4 au lieu de 1/2.)
    } else if (this.currentMode === 'linteau' && window.LinteauSelector) {
            // Pour les linteaux, utiliser LinteauSelector avec détection de coupe
            const currentLinteau = window.LinteauSelector.getCurrentLinteauData();
            length = currentLinteau.length;
            width = currentLinteau.width;
            height = currentLinteau.height;
            
            // Appliquer les coupes si détectées
            const elementTypeWithCut = this.getElementTypeForMode(this.currentMode);
            if (elementTypeWithCut && typeof elementTypeWithCut === 'string' && elementTypeWithCut.includes('_')) {
                const cutSuffix = elementTypeWithCut.split('_')[1];
                const ratio = this.getCutRatio(cutSuffix);
                if (ratio && ratio !== 1) {
                    length = Math.round(length * ratio);
                }
            }
        } else if (this.currentMode === 'beam' && window.BeamProfiles) {
            // Poutres acier procédurales (pivot coin inférieur début)
            const lengthCmExact = Math.max(1, Math.round(this.currentBeamLengthCm || 100));
            const p = window.BeamProfiles.getProfile ? window.BeamProfiles.getProfile(this.currentBeamType || 'IPE80') : null;
            const hCm = p ? (p.h / 10) : 8;
            const bCm = p ? (p.b / 10) : 5;
            length = lengthCmExact; // le long de X
            width = Math.max(3, Math.round(bCm));
            height = Math.max(3, Math.round(hCm));
        } else {
            // Pour les autres cas ou si les sélecteurs ne sont pas disponibles, utiliser les champs HTML
            length = parseInt(document.getElementById('elementLength').value);
            width = parseInt(document.getElementById('elementWidth').value);
            height = parseInt(document.getElementById('elementHeight').value);
        }

        // console.log('Création élément fantôme:', {
        //     type: this.currentMode,
        //     material: this.getAutoMaterial(),
        //     dimensions: { length, width, height },
        //     source: this.currentMode === 'brick' && window.BrickSelector ? 'BrickSelector' : 'HTML fields'
        // });

        // console.log('🔧 DEBUG Création du WallElement avec dimensions:', { length, width, height });

        // Déterminer le type correct de l'élément
        let elementTypeForMode;
        
        if (this.currentMode === 'brick' && window.BrickSelector) {
            // ✅ CORRECTION FANTÔME: Pour les briques, utiliser directement le type du BrickSelector
            // qui a déjà les bonnes dimensions
            const currentBrick = window.BrickSelector.getCurrentBrick();
            elementTypeForMode = currentBrick ? currentBrick.type : 'M65';
            if (window.DEBUG_CONSTRUCTION) {
                // console.log('🔧 Fantôme: Type brique depuis BrickSelector =', elementTypeForMode);
            }
        } else {
            // Pour les autres modes, utiliser la fonction standard
            elementTypeForMode = this.getElementTypeForMode(this.currentMode);
            if (window.DEBUG_CONSTRUCTION) {
                console.log('🔧 Fantôme: Type autre depuis getElementTypeForMode =', elementTypeForMode);
            }
        }
        
        if (window.DEBUG_CONSTRUCTION) {
            // console.log('🔧 Fantôme: currentMode =', this.currentMode);
        }
        
        // ✅ CORRECTION: Utiliser le bon type selon le mode
        let wallElementOptions = {
            material: this.getAutoMaterial(),
            x: 0,
            y: 0,
            z: 0,
            length,
            width,
            height
        };
        
        if (this.currentMode === 'brick') {
            wallElementOptions.type = 'brick';
            wallElementOptions.brickType = elementTypeForMode;
            if (window.DEBUG_CONSTRUCTION) {
                // console.log('🧱 Fantôme: Options pour brique:', wallElementOptions);
            }
        } else if (this.currentMode === 'block') {
            wallElementOptions.type = 'block';
            wallElementOptions.blockType = elementTypeForMode;
            if (window.DEBUG_CONSTRUCTION) {
                console.log('🧊 Fantôme: Options pour bloc:', wallElementOptions);
            }
        } else if (this.currentMode === 'insulation') {
            wallElementOptions.type = 'insulation';
            wallElementOptions.insulationType = elementTypeForMode;
            if (window.DEBUG_CONSTRUCTION) {
                console.log('🧥 Fantôme: Options pour isolant:', wallElementOptions);
            }
        } else if (this.currentMode === 'linteau') {
            wallElementOptions.type = 'linteau';
            wallElementOptions.linteauType = elementTypeForMode;
            if (window.DEBUG_CONSTRUCTION) {
                console.log('🏗️ Fantôme: Options pour linteau:', wallElementOptions);
            }
        } else if (this.currentMode === 'beam') {
            wallElementOptions.type = 'beam';
            wallElementOptions.beamType = this.currentBeamType || 'IPE80';
            wallElementOptions.beamLengthCm = this.currentBeamLengthCm || Math.max(100, wallElementOptions.length);
            if (window.DEBUG_CONSTRUCTION) {
                console.log('🏗️ Fantôme: Options pour poutre:', wallElementOptions);
            }
        } else {
            // Fallback pour les autres modes
            wallElementOptions.type = elementTypeForMode;
            wallElementOptions.blockType = elementTypeForMode;
            if (window.DEBUG_CONSTRUCTION) {
                console.log('🔧 Fantôme: Options pour autre élément:', wallElementOptions);
            }
        }

        this.ghostElement = new WallElement(wallElementOptions);
        if (this.currentMode === 'beam') {
            // Pour la poutre: position.y doit être la base. Créer initialement à y=0 base.
            this.ghostElement.position.y = 0;
            this.ghostElement.updateMeshPosition();
        }
        
        if (window.DEBUG_CONSTRUCTION) {
            console.log('👻 Fantôme créé - Dimensions mesh:', {
                x: this.ghostElement.mesh.scale.x,
                y: this.ghostElement.mesh.scale.y, 
                z: this.ghostElement.mesh.scale.z
            });
        }

        // console.log('🔧 DEBUG WallElement créé:', !!this.ghostElement);

        // Rendre l'élément fantôme très transparent
        this.ghostElement.mesh.material = this.ghostElement.mesh.material.clone();
        this.ghostElement.mesh.material.transparent = true;
        this.ghostElement.mesh.material.opacity = 0.3;
        this.ghostElement.mesh.material.wireframe = false;
        
        // Ajouter un effet de brillance
        this.ghostElement.mesh.material.emissive.setHex(0x222222);

        // Si des sous-maillages existent (ex: poutre visuelle), appliquer aussi la transparence
        if (this.ghostElement.mesh && this.ghostElement.mesh.children && this.ghostElement.mesh.children.length) {
            this.ghostElement.mesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material = child.material.clone();
                    child.material.transparent = true;
                    child.material.opacity = 0.3;
                    if (child.material.emissive) child.material.emissive.setHex(0x222222);
                }
            });
        }
        
        // Masquer par défaut - ne pas afficher si on est en mode suggestions
        this.ghostElement.mesh.visible = this.showGhost && !this.activeBrickForSuggestions;
        
        window.SceneManager.scene.add(this.ghostElement.mesh);
        // console.log('Élément fantôme créé');
    }

    removeGhostElement() {
        if (this.ghostElement) {
            window.SceneManager.scene.remove(this.ghostElement.mesh);
            this.ghostElement.dispose();
            this.ghostElement = null;
            
            // Masquer le D-pad GLB si c'était un élément GLB
            if (window.glbDPadController) {
                window.glbDPadController.hideDPad();
            }
        }
        
        // 🔧 CORRECTION: Ne PAS nettoyer tempGLBInfo automatiquement
        // pour permettre le placement continu des objets GLB
        // La suppression de tempGLBInfo doit être gérée manuellement
        // quand l'utilisateur change d'outil ou d'élément
    }

    /**
     * Nettoyer les informations GLB temporaires et supprimer le fantôme
     * À utiliser seulement quand l'utilisateur change délibérément d'outil
     */
    clearGLBMode() {
        if (window.tempGLBInfo) {
            // Nettoyage complet mode GLB
            window.tempGLBInfo = null;
        }
        
        this.removeGhostElement();
        
        // Forcer la mise à jour de l'onglet Outils pour afficher lastPlacedGLBInfo si disponible
        if (window.ToolsTabManager && window.ToolsTabManager.updateActiveElementPreview) {
            setTimeout(() => {
                window.ToolsTabManager.updateActiveElementPreview();
            }, 100);
        }
        
        // Masquer le D-pad GLB
        if (window.glbDPadController) {
            window.glbDPadController.hideDPad();
        }
        
        // 🔧 CORRECTION: Créer un nouveau fantôme de brique normale après nettoyage GLB
        
        // 🔥 NOUVEAU: Mettre à jour l'aperçu 3D après nettoyage GLB
        if (window.ToolsTabManager && window.ToolsTabManager.updateActiveElementPreview) {
            window.ToolsTabManager.updateActiveElementPreview();
        }
        
        // Utiliser une référence directe pour éviter les problèmes de contexte
        setTimeout(() => {
            // Forcer l'appel via window.ConstructionTools
            if (window.ConstructionTools && typeof window.ConstructionTools.createGhostElement === 'function') {
                try {
                    window.ConstructionTools.createGhostElement();
                } catch (error) {
                    console.error('🧹 DEBUG ERREUR lors appel createGhostElement:', error);
                }
            } else {
                console.error('🧹 DEBUG ERREUR: window.ConstructionTools.createGhostElement non disponible!', {
                    windowConstructionTools: window.ConstructionTools,
                    hasFunction: window.ConstructionTools && typeof window.ConstructionTools.createGhostElement
                });
            }
        }, 100); // Petit délai pour s'assurer que le nettoyage est terminé
    }
    createGLBGhostElement(glbInfo) {
        
        // Vérifier que GLTFLoader est disponible
        let GLTFLoaderClass = null;
        
        if (window.THREE && window.THREE.GLTFLoader) {
            GLTFLoaderClass = window.THREE.GLTFLoader;
        } else if (window.GLTFLoader) {
            GLTFLoaderClass = window.GLTFLoader;
        } else {
            console.warn('❌ GLTFLoader non disponible pour fantôme GLB');
            return;
        }
        
        try {
            const loader = new GLTFLoaderClass();
            loader.load(
                glbInfo.path,
                (gltf) => {
                    // 🔧 PROTECTION: Vérifier que tempGLBInfo existe encore avant de créer le fantôme
                    if (!window.tempGLBInfo) {
                        return;
                    }
                    
                    const gltfScene = gltf.scene;
                    
                    // Configurer comme élément fantôme
                    gltfScene.name = `GLB_Ghost_${glbInfo.type}`;
                    gltfScene.userData = {
                        type: 'glb_ghost',
                        originalType: glbInfo.type,
                        isGhost: true
                    };
                    
                    // Propriétés pour l'intégration
                    gltfScene.type = 'glb';
                    gltfScene.isGLBModel = true;
                    gltfScene.glbFileName = glbInfo.type;
                    
                    // Appliquer l'échelle
                    if (glbInfo.scale) {
                        gltfScene.scale.set(glbInfo.scale.x, glbInfo.scale.y, glbInfo.scale.z);
                    }
                    
                    // GLB: Marquer le mesh comme fantôme GLB pour la détection dans scene-manager
                    gltfScene.userData = gltfScene.userData || {};
                    gltfScene.userData.isGLBGhost = true;
                    gltfScene.userData.glbInfo = glbInfo;
                    
                    // HOURDIS: Position forcée au niveau du sol ABSOLU (Y=0)
                    const isHourdis = glbInfo && (glbInfo.type.includes('hourdis') || glbInfo.name.includes('Hourdis'));
                    if (isHourdis) {
                        const hourdisHeight = glbInfo.dimensions ? glbInfo.dimensions.height : 13;
                        const yPosition = 0; // FORCER Y=0 pour que la BASE du hourdis touche le sol
                        gltfScene.position.set(0, yPosition, 0); // Position initiale au sol
                    }
                    
                    // Rendre transparent et fantomatique + ajouter wireframe
                    gltfScene.traverse((child) => {
                        if (child.isMesh && child.material) {
                            // Cloner le matériau pour éviter d'affecter l'original
                            if (Array.isArray(child.material)) {
                                child.material = child.material.map(mat => {
                                    const clonedMat = mat.clone();
                                    clonedMat.transparent = true;
                                    clonedMat.opacity = 0.3;
                                    clonedMat.emissive.setHex(0x222222);
                                    return clonedMat;
                                });
                            } else {
                                child.material = child.material.clone();
                                child.material.transparent = true;
                                child.material.opacity = 0.3;
                                child.material.emissive.setHex(0x222222);
                            }
                            
                            // Ajouter edges pour voir les arêtes principales (plus propre que wireframe)
                            if (child.geometry) {
                                const edgesGeometry = new THREE.EdgesGeometry(child.geometry);
                                const edgesMaterial = new THREE.LineBasicMaterial({ 
                                    color: 0x00ff00, // Vert pour les arêtes
                                    transparent: true,
                                    opacity: 0.9,
                                    linewidth: 2 // Plus épais pour mieux voir
                                });
                                const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
                                
                                // Copier la transformation du mesh pour un alignement parfait
                                edges.position.copy(child.position);
                                edges.rotation.copy(child.rotation);
                                edges.scale.copy(child.scale);
                                
                                edges.userData = { isWireframe: true };
                                child.parent.add(edges);
                            }
                        }
                    });
                    
                    // Stocker comme élément fantôme
                    this.ghostElement = {
                        mesh: gltfScene,
                        dispose: () => {
                            // Nettoyage spécifique GLB
                            gltfScene.traverse((child) => {
                                if (child.isMesh) {
                                    if (child.geometry) child.geometry.dispose();
                                    if (child.material) {
                                        if (Array.isArray(child.material)) {
                                            child.material.forEach(mat => mat.dispose());
                                        } else {
                                            child.material.dispose();
                                        }
                                    }
                                }
                                // Nettoyer aussi les wireframes
                                if (child.userData && child.userData.isWireframe) {
                                    if (child.geometry) child.geometry.dispose();
                                    if (child.material) child.material.dispose();
                                }
                            });
                        }
                    };
                    
                    // Masquer par défaut - ne pas afficher si on est en mode suggestions
                    this.ghostElement.mesh.visible = this.showGhost && !this.activeBrickForSuggestions;
                    
                    // S'assurer que le fantôme GLB est créé mais INVISIBLE au début
                    this.showGhost = true;
                    this.ghostElement.mesh.visible = false; // Invisible jusqu'au premier mouvement de souris
                    
                    window.SceneManager.scene.add(this.ghostElement.mesh);
                    
                    if (window.DEBUG_CONSTRUCTION) {
                        console.log('✅ Fantôme GLB créé (invisible) et ajouté à la scène:', glbInfo.type);
                    }
                },
                (progress) => {
                    // Progression du chargement (silencieuse)
                },
                (error) => {
                    // Erreur lors du chargement GLB fantôme
                    console.error('❌ Erreur chargement GLB fantôme:', error);
                }
            );
        } catch (error) {
            // Erreur lors de la création de l'instance GLTFLoader pour fantôme
            console.error('❌ Erreur création GLTFLoader fantôme:', error);
        }
    }

    updateGhostElement() {
        // Mode Diba: aucun fantôme nécessaire
        if (this.currentMode === 'diba') {
            if (this.ghostElement && this.ghostElement.mesh) {
                try { window.SceneManager.scene.remove(this.ghostElement.mesh); } catch(e){}
            }
            this.ghostElement = null;
            return;
        }
        // Système de debounce pour éviter les mises à jour trop fréquentes
        if (this._updateDebounceTimer) {
            clearTimeout(this._updateDebounceTimer);
        }
        
        this._updateDebounceTimer = setTimeout(() => {
            this._performActualGhostUpdate();
        }, 100); // 100ms de debounce pour réduire les lags
    }
    
    _performActualGhostUpdate() {
        // Protection contre les mises à jour concurrentes
        if (this._isUpdating) {
            console.log('🔧 updateGhostElement: mise à jour déjà en cours, ignoré');
            return;
        }
        this._isUpdating = true;
        
        if (this.ghostElement) {
            // Vérifier si c'est un élément GLB fantôme
            if (this.ghostElement.mesh && this.ghostElement.mesh.userData && this.ghostElement.mesh.userData.type === 'glb_ghost') {
                // Pour les GLB, juste s'assurer que la visibilité est correcte
                this.ghostElement.mesh.visible = this.showGhost && !this.activeBrickForSuggestions;
                
                this._isUpdating = false;
                return;
            }
            // CORRECTION: Utiliser les dimensions selon le mode actuel
            let length, width, height;
            if (this.currentMode === 'brick' && window.BrickSelector) {
                // Pour les briques, utiliser BrickSelector
                const currentBrick = window.BrickSelector.getCurrentBrick();
                length = currentBrick.length;
                width = currentBrick.width;
                height = currentBrick.height;
                
                // ✅ CORRECTION: Ne PAS appliquer de coupe - BrickSelector a déjà les bonnes dimensions
                // Les types comme M65_HALF ont déjà les bonnes dimensions dans BrickSelector
                // console.log(`🔧 Mise à jour fantôme: Dimensions depuis BrickSelector: ${length}×${width}×${height} (type: ${currentBrick.type})`);
            } else if (this.currentMode === 'block' && window.BlockSelector) {
                // Pour les blocs, utiliser BlockSelector
                const currentBlock = window.BlockSelector.getCurrentBlockData();
                length = currentBlock.length;
                width = currentBlock.width;
                height = currentBlock.height;
                // IMPORTANT: ne pas ré-appliquer de ratio ici.
                // BlockSelector fournit déjà les dimensions ajustées (B9_3Q, B9_HALF, etc.)
                // L'ancien recalcul causait des longueurs erronées pour le fantôme (ex: B9 affiché différent).
            } else if (this.currentMode === 'insulation' && window.InsulationSelector) {
                // Pour les isolants: dimensions déjà ajustées dans getCurrentInsulationWithCutObject (éviter double ratio)
                const currentInsulation = (typeof window.InsulationSelector.getCurrentInsulationWithCutObject === 'function'
                    ? window.InsulationSelector.getCurrentInsulationWithCutObject()
                    : window.InsulationSelector.getCurrentInsulationData());
                length = currentInsulation.length;
                width = currentInsulation.width;
                height = currentInsulation.height;
                // Pas de recalcul de ratio ici (ancienne logique supprimée)
            } else if (this.currentMode === 'beam' && window.BeamProfiles) {
                const lengthCmExact = Math.max(1, Math.round(this.currentBeamLengthCm || 100));
                const p = window.BeamProfiles.getProfile ? window.BeamProfiles.getProfile(this.currentBeamType || 'IPE80') : null;
                const hCm = p ? (p.h / 10) : 8;
                const bCm = p ? (p.b / 10) : 5;
                length = lengthCmExact;
                width = Math.max(3, Math.round(bCm));
                height = Math.max(3, Math.round(hCm));
            } else {
                // Pour linteaux, ou si les sélecteurs ne sont pas disponibles, utiliser les champs HTML
                length = parseInt(document.getElementById('elementLength').value);
                width = parseInt(document.getElementById('elementWidth').value);
                height = parseInt(document.getElementById('elementHeight').value);
                
                // Appliquer les coupes pour linteaux
                if (this.currentMode === 'linteau') {
                    const elementTypeWithCut = this.getElementTypeForMode(this.currentMode);
                    if (elementTypeWithCut && typeof elementTypeWithCut === 'string' && elementTypeWithCut.includes('_')) {
                        const cutSuffix = elementTypeWithCut.split('_')[1];
                        const ratio = this.getCutRatio(cutSuffix);
                        if (ratio && ratio !== 1) {
                            length = Math.round(length * ratio);
                        }
                    }
                }
            }
            
            // Mettre à jour les dimensions
            // console.log(`🔧 AVANT updateDimensions: ghostElement.dimensions = ${this.ghostElement.dimensions.length}x${this.ghostElement.dimensions.width}x${this.ghostElement.dimensions.height}`);
            // console.log(`🔧 APPEL updateDimensions avec: ${length}x${width}x${height}`);
            this.ghostElement.updateDimensions(length, width, height);
            // console.log(`🔧 APRÈS updateDimensions: ghostElement.dimensions = ${this.ghostElement.dimensions.length}x${this.ghostElement.dimensions.width}x${this.ghostElement.dimensions.height}`);
            
            // console.log(`🔍 Fantôme mis à jour avec dimensions: ${length}x${width}x${height}`);
            
            // IMPORTANT: S'assurer que le fantôme est visible après la mise à jour
            if (this.ghostElement && this.ghostElement.mesh) {
                this.ghostElement.mesh.visible = this.showGhost && !this.activeBrickForSuggestions;
                // console.log(`🔍 Visibilité du fantôme: ${this.ghostElement.mesh.visible} (showGhost: ${this.showGhost}, activeBrickForSuggestions: ${this.activeBrickForSuggestions})`);
                
                // NOUVEAU: Vérifications supplémentaires pour le debug
                // console.log(`🔍 Position fantôme: x=${this.ghostElement.position.x}, y=${this.ghostElement.position.y}, z=${this.ghostElement.position.z}`);
                // console.log(`🔍 Dimensions fantôme réelles: ${this.ghostElement.dimensions.length}x${this.ghostElement.dimensions.width}x${this.ghostElement.dimensions.height}`);
                // console.log(`🔍 Opacité fantôme: ${this.ghostElement.mesh.material.opacity}, transparent: ${this.ghostElement.mesh.material.transparent}`);
                
                // S'assurer que le matériau est bien configuré pour être visible
                this.ghostElement.mesh.material.opacity = 0.5; // Plus opaque pour être plus visible
                this.ghostElement.mesh.material.transparent = true;
            }
            
            // Mettre à jour le matériau automatiquement
            this.ghostElement.setMaterial(this.getAutoMaterial());
            
            // Rendre transparent à nouveau
            this.ghostElement.mesh.material.transparent = true;
            this.ghostElement.mesh.material.opacity = 0.3;
            this.ghostElement.mesh.material.emissive.setHex(0x222222);
            
            // CORRECTION FANTÔME: Repositionner le fantôme à la bonne hauteur d'assise après les changements
            if (window.AssiseManager && window.AssiseManager.currentType) {
                const elementType = this.getElementTypeForMode(this.currentMode);
                let assiseType = elementType;
                
                // Pour les briques coupées, utiliser le type de base pour l'assise
                if (elementType && typeof elementType === 'string' && elementType.includes('_')) {
                    assiseType = elementType.split('_')[0];
                }
                // Normaliser les types d'isolants spécifiques (PUR5, XPS30, etc.) vers 'insulation'
                if (this.currentMode === 'insulation' || (typeof assiseType === 'string' && ['PUR','LAINEROCHE','XPS','PSE','FB','LV','ISOLANT','ISOLATION'].some(p => assiseType.toUpperCase().startsWith(p)))) {
                    if (assiseType !== 'insulation') {
                        if (window._isoGhostLog) window._isoGhostLog('ASSISE_TYPE_NORMALIZE_GHOST_UPDATE', { from: assiseType, to: 'insulation' });
                    }
                    assiseType = 'insulation';
                }
                // Fallback si le type n'est pas connu dans AssiseManager
                if (window.AssiseManager && assiseType !== 'insulation' && !window.AssiseManager.currentAssiseByType.has(assiseType) && this.currentMode === 'insulation') {
                    if (window._isoGhostLog) window._isoGhostLog('ASSISE_TYPE_FALLBACK_GHOST_UPDATE', { unknown: assiseType, fallback: 'insulation' });
                    assiseType = 'insulation';
                }
                
                const currentAssiseForType = window.AssiseManager.currentAssiseByType.get(assiseType);
                const assiseHeight = window.AssiseManager.getAssiseHeightForType(assiseType, currentAssiseForType);
                const newY = assiseHeight + this.ghostElement.dimensions.height / 2;
                
                // // console.log(`🔧 CORRECTION Fantôme repositionné après mise à jour:`);
                // console.log(`   - Type assise: ${assiseType}`);
                // console.log(`   - Hauteur assise: ${assiseHeight} cm`);
                // console.log(`   - Nouvelle position Y: ${newY} cm`);
                
                // Repositionner le fantôme seulement si on n'est pas en mode suggestions
                if (!this.activeBrickForSuggestions) {
                    this.ghostElement.updatePosition(
                        this.ghostElement.position.x,
                        newY,
                        this.ghostElement.position.z
                    );
                }
            }
        }
        
        // Réinitialiser le flag de mise à jour
        this._isUpdating = false;
    }

    updateGhostPosition(x, z) {
        // Ne pas mettre à jour le fantôme si on est en mode sélection
        if (this.activeBrickForSuggestions) {
            return;
        }
        
        // Mise à jour immédiate de la position pour une réactivité maximale
        if (this.ghostElement && this.showGhost) {
            // Vérifier si c'est un élément GLB fantôme
            if (this.ghostElement.mesh && this.ghostElement.mesh.userData && this.ghostElement.mesh.userData.type === 'glb_ghost') {
                // 🔧 PROTECTION PLANCHERS: Forcer la position Y pour les éléments de plancher AU SOL ABSOLU
                const glbInfo = window.tempGLBInfo;
                const isHourdis = glbInfo && (glbInfo.type.includes('hourdis') || glbInfo.name.includes('Hourdis'));
                const isPoutrain = glbInfo && (glbInfo.type.includes('poutrain') || glbInfo.name.includes('Poutrain'));
                const isClaveau = glbInfo && (glbInfo.type.includes('claveau') || glbInfo.name.includes('Claveau'));
                
                let yPosition = this.ghostElement.mesh.position.y;
                if (isHourdis || isPoutrain || isClaveau) {
                    const elementHeight = glbInfo.dimensions ? glbInfo.dimensions.height : 12;
                    yPosition = 0; // FORCER Y=0 pour que la BASE de l'élément touche le sol
                    
                    // PLANCHERS: Accrochage PARFAIT au curseur - pas de seuil de tolérance
                    this.ghostElement.mesh.position.set(x, yPosition, z);
                    this._lastGhostPosition = { x, z };
                    return;
                }
                
                // Pour les autres GLB, appliquer le seuil de tolérance normal
                if (this._lastGhostPosition && 
                    Math.abs(this._lastGhostPosition.x - x) < 0.5 && 
                    Math.abs(this._lastGhostPosition.z - z) < 0.5) {
                    return;
                }
                
                // Pour les GLB non-hourdis, mettre à jour directement la position du mesh
                this.ghostElement.mesh.position.set(x, yPosition, z);
                this._lastGhostPosition = { x, z };
                return;
            }
            
            // Pour les éléments classiques, appliquer le seuil de tolérance
            if (this._lastGhostPosition && 
                Math.abs(this._lastGhostPosition.x - x) < 0.5 && 
                Math.abs(this._lastGhostPosition.z - z) < 0.5) {
                return;
            }
            
            // Mise à jour immédiate de la position X,Z pour une réactivité parfaite (éléments classiques)
            this.ghostElement.updatePosition(x, this.ghostElement.position.y, z);
            this._lastGhostPosition = { x, z };
            
            // Throttling seulement pour les calculs lourds (hauteur d'assise)
            if (this._heightUpdateThrottle) {
                clearTimeout(this._heightUpdateThrottle);
            }
            
            this._heightUpdateThrottle = setTimeout(() => {
                this._updateGhostHeight(x, z);
            }, 8); // Seulement 8ms de délai pour la hauteur
        }
    }
    
    _updateGhostHeight(x, z) {
        if (this.ghostElement && this.showGhost) {
            // 🔧 PROTECTION HOURDIS: Vérifier d'abord si c'est un hourdis (GLB ou autre)
            const glbInfo = window.tempGLBInfo;
            const isHourdis = glbInfo && (glbInfo.type.includes('hourdis') || glbInfo.name.includes('Hourdis'));
            
            // AUSSI vérifier si le fantôme existant est un GLB hourdis (via userData)
            const isGLBHourdis = this.ghostElement.mesh && 
                               this.ghostElement.mesh.userData && 
                               this.ghostElement.mesh.userData.type === 'glb_ghost' &&
                               glbInfo && (glbInfo.type.includes('hourdis') || glbInfo.name.includes('Hourdis'));
            
            if (isHourdis || isGLBHourdis) {
                // HOURDIS: TOUJOURS forcer au niveau du sol, ignorer tout auto-stacking
                const hourdisHeight = glbInfo && glbInfo.dimensions ? glbInfo.dimensions.height : 13;
                const y = 0; // FORCER Y=0 pour que la BASE du hourdis touche le sol
                
                console.log(`🔧 HOURDIS FANTÔME BASE AU SOL: Y=0 (base), hauteur=${hourdisHeight}`);
                
                if (this.ghostElement.mesh && this.ghostElement.mesh.userData && this.ghostElement.mesh.userData.type === 'glb_ghost') {
                    this.ghostElement.mesh.position.y = y;
                } else if (this.ghostElement.updatePosition) {
                    this.ghostElement.updatePosition(this.ghostElement.position.x, y, this.ghostElement.position.z);
                }
                return; // SORTIR IMMÉDIATEMENT - pas d'auto-stacking pour les hourdis
            }
            
            // NOUVEAU: Calculer la hauteur d'assise pour éléments classiques (briques, blocs, isolants)
            // POUTRES: pas d'empilement -> base au sol (Y = 0) car pivot = coin inférieur
            if (this.currentMode === 'beam' && this.ghostElement && this.ghostElement.dimensions) {
                const targetY = 0; // base exactement au sol
                const tolerance = 0.05;
                if (!this.ghostElement.position || Math.abs(this.ghostElement.position.y - targetY) > tolerance) {
                    this.ghostElement.updatePosition(this.ghostElement.position.x, targetY, this.ghostElement.position.z);
                    // console.log(`🔧 GHOST HEIGHT UPDATE (beam base=0): y=${targetY}cm`); // log désactivé
                }
                return; // ignorer logique d'assise empilée
            }
            if (window.AssiseManager && window.AssiseManager.currentType) {
                const elementType = this.getElementTypeForMode(this.currentMode);
                let assiseType = elementType;
                
                // Pour les briques coupées, utiliser le type de base pour l'assise
                if (elementType && typeof elementType === 'string' && elementType.includes('_')) {
                    assiseType = elementType.split('_')[0];
                }
                // Normaliser les types d'isolants spécifiques (PUR5, XPS30, etc.) vers 'insulation'
                if (this.currentMode === 'insulation' || (typeof assiseType === 'string' && ['PUR','LAINEROCHE','XPS','PSE','FB','LV'].some(p => assiseType.toUpperCase().startsWith(p)))) {
                    assiseType = 'insulation';
                }
                
                const currentAssiseForType = window.AssiseManager.currentAssiseByType.get(assiseType);
                const assiseHeight = window.AssiseManager.getAssiseHeightForType(assiseType, currentAssiseForType);
                const newY = assiseHeight + this.ghostElement.dimensions.height / 2;
                
                // Protection contre les mises à jour répétitives
                const tolerance = 0.1; // Tolérance en cm
                if (this.ghostElement.position && Math.abs(this.ghostElement.position.y - newY) < tolerance) {
                    return; // Pas besoin de mise à jour si la position est déjà correcte
                }
                
                // console.log(`🔧 GHOST HEIGHT UPDATE: mode=${this.currentMode}, assiseType=${assiseType}, assiseIndex=${currentAssiseForType}, assiseHeight=${assiseHeight}cm, newY=${newY}cm`); // log désactivé
                
                this.ghostElement.updatePosition(this.ghostElement.position.x, newY, this.ghostElement.position.z);
            }
            
            // Vérifier si c'est un élément GLB fantôme (non-hourdis)
            if (this.ghostElement.mesh && this.ghostElement.mesh.userData && this.ghostElement.mesh.userData.type === 'glb_ghost') {
                // Pour les GLB non-hourdis, utiliser la logique normale
                let y = 0;
                
                if (window.AssiseManager && window.AssiseManager.currentType) {
                    const assiseHeight = window.AssiseManager.getAssiseHeightForType('brique', window.AssiseManager.currentAssiseByType.get('brique'));
                    y = assiseHeight;
                } else {
                    y = 2.5; // Hauteur par défaut
                }
                
                // Mise à jour de la hauteur du mesh GLB
                this.ghostElement.mesh.position.y = y;
                return;
            }
            
            let y = 0;
            
            // CORRECTION: Toujours utiliser la hauteur d'assise en priorité
            if (window.AssiseManager && window.AssiseManager.currentType) {
                // Utiliser l'assise active du type d'élément approprié
                const elementType = this.getElementTypeForMode(this.currentMode);
                
                // CORRECTION: Pour les briques coupées, utiliser le type de base pour l'assise
                let assiseType = elementType;
                // S'assurer que elementType est une chaîne avant d'utiliser includes()
                if (elementType && typeof elementType === 'string' && elementType.includes('_')) {
                    const baseType = elementType.split('_')[0];
                    // // console.log(`🔧 ConstructionTools: Brique coupée détectée (${elementType}), utilisation du type de base (${baseType}) pour l'assise`);
                    assiseType = baseType;
                }
                // Normalisation isolant étendue (support 'Isolant ...')
                if (this.currentMode === 'insulation' || (typeof assiseType === 'string' && ['PUR','LAINEROCHE','XPS','PSE','FB','LV','ISOLANT','ISOLATION'].some(p => assiseType.toUpperCase().startsWith(p)))) {
                    if (assiseType !== 'insulation') {
                        if (window._isoGhostLog) window._isoGhostLog('ASSISE_TYPE_NORMALIZE_GHOST_MOVE', { from: assiseType, to: 'insulation' });
                    }
                    assiseType = 'insulation';
                }
                if (window.AssiseManager && assiseType !== 'insulation' && !window.AssiseManager.currentAssiseByType.has(assiseType) && this.currentMode === 'insulation') {
                    if (window._isoGhostLog) window._isoGhostLog('ASSISE_TYPE_FALLBACK_GHOST_MOVE', { unknown: assiseType, fallback: 'insulation' });
                    assiseType = 'insulation';
                }
                
                const currentAssiseForType = window.AssiseManager.currentAssiseByType.get(assiseType);
                const assiseHeight = window.AssiseManager.getAssiseHeightForType(assiseType, currentAssiseForType);
                const elementHeight = this.ghostElement.dimensions.height;
                y = assiseHeight + elementHeight / 2;

                // LOG DEBUG ISOLATION GHOST (position calculée)
                if (assiseType === 'insulation' && window._isoGhostLog) {
                    window._isoGhostLog('GHOST_MOVE_COMPUTE', {
                        mode: this.currentMode,
                        assiseType,
                        assiseIndex: currentAssiseForType,
                        assiseHeight,
                        elementHeight,
                        targetY: y,
                        currentGhostY: this.ghostElement.position.y
                    });
                }
                
                // NOTE: Logs de debug supprimés pour éviter le spam dans la console
                // Le fantôme est correctement positionné à la hauteur de l'assise active
            } else if (this.autoStack) {
                // Fallback à l'auto-stacking si AssiseManager n'est pas disponible
                const stackingResult = this.findStackingHeight(x, z);
                y = stackingResult.height || 0;
                // // console.log(`📦 Fantôme auto-stacking: Y=${y}cm`);
            } else {
                // Fallback final: hauteur minimale pour éviter Y=0
                y = 2.5; // Demi-hauteur d'une brique standard (5cm)
                // console.log(`⚠️ Fantôme fallback: Y=${y}cm (AssiseManager non disponible)`);
            }
            
            // Mise à jour de la hauteur seulement (X,Z déjà mis à jour instantanément)
            // Vérifier si c'est un élément GLB fantôme
            if (this.ghostElement.mesh && this.ghostElement.mesh.userData && this.ghostElement.mesh.userData.type === 'glb_ghost') {
                this.ghostElement.mesh.position.y = y;
            } else {
                this.ghostElement.updatePosition(this.ghostElement.position.x, y, this.ghostElement.position.z);
            }

            // LOG après mise à jour réelle
            if (window._isoGhostLog && this.currentMode === 'insulation') {
                // Throttle: log max 1 fois / 200ms pour éviter le spam
                const now = performance.now();
                if (!this._lastIsoGhostAppliedLog || (now - this._lastIsoGhostAppliedLog) > 200) {
                    this._lastIsoGhostAppliedLog = now;
                    window._isoGhostLog('GHOST_MOVE_APPLIED', {
                        newY: this.ghostElement.position.y,
                        expectedY: y,
                        delta: Math.round((this.ghostElement.position.y - y)*100)/100
                    });
                }
            }
            
            // Rotation manuelle seulement
            // Plus de rotation automatique lors du survol d'une face de brique
            // Seules les touches R et flèche droite permettent la rotation
            if (this.hasManualRotation) {
                // Appliquer la rotation manuelle
                const isGLBElement = (this.ghostElement.userData && (this.ghostElement.userData.isGLB || this.ghostElement.userData.isGLBGhost)) || 
                                     (this.ghostElement.mesh && this.ghostElement.mesh.userData && this.ghostElement.mesh.userData.isGLBGhost);
                
                if (isGLBElement) {
                    // Pour les éléments GLB, utiliser la rotation Three.js directe
                    const ghostObject = this.ghostElement.mesh || this.ghostElement;
                    ghostObject.rotation.y = this.manualRotation;
                } else {
                    // Pour les briques classiques, utiliser la méthode existante
                    this.ghostElement.setRotation(this.manualRotation);
                }
                this.updateRotationDisplay();
            } else {
                // Rotation par défaut (panneresse) - pas de détection automatique
                const isGLBElement = (this.ghostElement.userData && (this.ghostElement.userData.isGLB || this.ghostElement.userData.isGLBGhost)) || 
                                     (this.ghostElement.mesh && this.ghostElement.mesh.userData && this.ghostElement.mesh.userData.isGLBGhost);
                
                if (isGLBElement) {
                    // Pour les éléments GLB, utiliser la rotation Three.js directe
                    const ghostObject = this.ghostElement.mesh || this.ghostElement;
                    ghostObject.rotation.y = 0;
                } else {
                    // Pour les briques classiques, utiliser la méthode existante
                    this.ghostElement.setRotation(0);
                }
                this.updateRotationDisplay();
            }
            
            // Mettre à jour le point snap du curseur (utiliser x,z du curseur, pas du fantôme)
            this.updateCursorSnapPoint(x, 0, z);  // Y = 0 pour le sol
            
            // Forcer la visibilité seulement si on n'est pas en mode suggestions ET qu'il n'y a pas de suggestions actives
            if (!this.activeBrickForSuggestions && this.suggestionGhosts.length === 0) {
                this.ghostElement.mesh.visible = true;
            } else {
                // DEBUG: Log pourquoi le ghost n'est pas affiché
                if (this.activeBrickForSuggestions) {
                    // console.log('🔍 Ghost masqué - activeBrickForSuggestions:', this.activeBrickForSuggestions.id);
                }
                if (this.suggestionGhosts.length > 0) {
                    // console.log('🔍 Ghost masqué - suggestions actives:', this.suggestionGhosts.length);
                }
                this.ghostElement.mesh.visible = false;
            }
        }
    }

    hideGhostElement() {
        // Masquer le fantôme principal
        if (this.ghostElement) {
            this.ghostElement.mesh.visible = false;
        }
        
        // Masquer toutes les briques de suggestion
        if (this.suggestionGhosts && this.suggestionGhosts.length > 0) {
            this.suggestionGhosts.forEach(ghost => {
                if (ghost && ghost.mesh) {
                    ghost.mesh.visible = false;
                }
            });
        }
        
        // Masquer aussi le point snap du curseur
        if (this.cursorSnapPoint) {
            this.cursorSnapPoint.visible = false;
        }
        
        // Émettre un événement pour le monitoring
        document.dispatchEvent(new CustomEvent('ghostElementHidden'));
    }

    showGhostElement() {
        // Ne pas afficher le fantôme si on est en mode sélection de suggestions OU s'il y a des suggestions actives
        if (this.ghostElement && !this.activeBrickForSuggestions && this.suggestionGhosts.length === 0) {
            this.ghostElement.mesh.visible = this.showGhost;
        }
        
        // Réafficher les briques de suggestion SEULEMENT si elles ne sont pas bloquées par l'interface
        if (this.suggestionGhosts && this.suggestionGhosts.length > 0) {
            if (!this.suggestionsDisabledByInterface) {
                this.suggestionGhosts.forEach(ghost => {
                    if (ghost && ghost.mesh) {
                        ghost.mesh.visible = true;
                    }
                });
            }
        }
        
        // Afficher aussi le point snap du curseur si les snap points sont actifs
        if (this.cursorSnapPoint && this.showGridSnap && !this.activeBrickForSuggestions && this.suggestionGhosts.length === 0) {
            this.cursorSnapPoint.visible = true;
        }
        
        // Émettre un événement pour le monitoring
        document.dispatchEvent(new CustomEvent('ghostElementShown'));
    }

    setupEventListeners() {
        // Modes de construction
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // S'assurer qu'on récupère le bouton et non un élément enfant
                const button = e.currentTarget;
                const mode = button.dataset.mode;
                if (mode) {
                    // Si c'est le mode brique, ouvrir le sélecteur de briques ET activer le mode
                    if (mode === 'brick') {
                        this.setMode(mode); // Activer le mode brique d'abord
                        this.updateToolButtons();
                        this.updateModeInterface('brick');
                        
                        if (window.BrickSelector) {
                            window.BrickSelector.showModal();
                        }
                        return;
                    }
                    
                    // Si c'est le mode bloc, ouvrir le sélecteur de blocs ET activer le mode
                    if (mode === 'block') {
                        this.setMode(mode); // Activer le mode bloc d'abord
                        this.updateToolButtons();
                        this.updateModeInterface('block');
                        
                        if (window.BlockSelector) {
                            window.BlockSelector.showModal();
                        }
                        return;
                    }
                    
                    // Si c'est le mode linteau, ouvrir le sélecteur de linteaux ET activer le mode
                    if (mode === 'linteau') {
                        this.setMode(mode); // Activer le mode linteau d'abord
                        this.updateToolButtons();
                        this.updateModeInterface('linteau');
                        
                        if (window.LinteauSelector) {
                            window.LinteauSelector.showModal();
                        }
                        return;
                    }
                    
                    this.setMode(mode);
                    this.updateToolButtons();
                    this.updateModeInterface(mode);
                }
            });
        });

        // Sélection de matériau
        document.getElementById('materialSelect').addEventListener('change', (e) => {
            this.setMaterial(e.target.value);
        });

        // Dimensions
        ['elementLength', 'elementWidth', 'elementHeight'].forEach(id => {
            const input = document.getElementById(id);
            
            // Événement change pour la validation finale
            input.addEventListener('change', () => {
                this.updateGhostElement();
                if (this.previewElement) {
                    this.updatePreview();
                }
            });
            
            // Événement input pour la mise à jour en temps réel
            input.addEventListener('input', () => {
                this.updateGhostElement();
                if (this.previewElement) {
                    this.updatePreview();
                }
            });
        });

        // Actions
        document.getElementById('placeElement').addEventListener('click', () => {
            this.togglePlacementMode();
        });

        document.getElementById('deleteElement').addEventListener('click', () => {
            this.deleteSelectedElement();
        });

        document.getElementById('clearAll').addEventListener('click', () => {
            this.clearAll();
        });

        // Écouter les événements de la scène
        document.addEventListener('cursorMove', (e) => {
            this.updateGhostPosition(e.detail.x, e.detail.z);
            if (this.previewElement) {
                this.updatePreviewPosition(e.detail.x, e.detail.z);
            }
        });

        document.addEventListener('elementSelected', (e) => {
            this.onElementSelected(e.detail.element);
        });

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });

        // Clic droit pour rotation de 90° du fantôme
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Empêcher le menu contextuel par défaut
            this.rotateGhostElement();
        });
    }

    // Écouter les événements d'AssiseManager pour les points snap
    setupAssiseEventListeners() {
        // Écouter les changements d'assise pour recréer les points snap
        document.addEventListener('assiseTypeChanged', (e) => {
            if (this.showGridSnap) {
                // console.log('🎯 Type d\'assise changé, recréation des points snap');
                this.createGridSnapPoints();
            }
        });

        // Écouter les changements d'assise active
        document.addEventListener('assiseChanged', (e) => {
            if (this.showGridSnap) {
                // console.log('🎯 Assise active changée, recréation des points snap');
                this.createGridSnapPoints();
            }
        });

        // Écouter l'activation/désactivation des grilles d'assise
        document.addEventListener('assiseGridsToggled', (e) => {
            if (this.showGridSnap) {
                if (window.AssiseManager && window.AssiseManager.showAssiseGrids) {
                    // console.log('🎯 Grilles d\'assise activées, création des points snap');
                    this.createGridSnapPoints();
                } else {
                    // console.log('🎯 Grilles d\'assise désactivées, suppression des points snap');
                    this.clearGridSnapPoints();
                }
            }
        });
    }

    setMode(mode, preserveDimensions = false) {
        // console.log('🔧 DEBUG setMode appelée:', { oldMode: this.currentMode, newMode: mode, preserveDimensions });
        
        // Masquer les aides contextuelles lors du changement de mode de construction
        if (window.TabManager && window.TabManager.hideAllContextualHelp) {
            window.TabManager.hideAllContextualHelp();
        }
        
        const oldMode = this.currentMode;
        this.currentMode = mode;
        this.updateUI();
        this.updateToolButtons(); // Mettre à jour les boutons d'outils
        
        // Réinitialiser tempGLBInfo si on quitte le mode GLB
        if (mode !== 'glb' && window.tempGLBInfo && oldMode !== mode) {
            this.clearGLBMode();
        }
        
        // 🔧 NOUVEAU: Forcer la suppression du fantôme GLB si on passe à un mode non-GLB
        if (oldMode === 'glb' && mode !== 'glb' && this.ghostElement) {
            console.log('🧹 Suppression forcée du fantôme GLB lors passage vers mode:', mode);
            this.removeGhostElement();
        }
        
        // Réinitialiser la rotation manuelle lors du changement de mode
        this.resetManualRotation();
        
        // Réinitialiser le matériau selon le nouveau mode pour éviter les conflits
        if (!preserveDimensions) {
            this.currentMaterial = null; // Forcer l'utilisation du matériau par défaut du mode
        }
        
        // Basculer automatiquement vers le type d'assise correspondant
        if (window.AssiseManager) {
            const elementType = this.getElementTypeForMode(mode);
            
            // CORRECTION: Pour les briques, vérifier d'abord si TabManager a un élément spécifique sélectionné
            let specificType = elementType;
            if (mode === 'brick' && window.TabManager && window.TabManager.selectedLibraryItem) {
                const selectedBrick = window.TabManager.selectedLibraryItem;
                // Extraire le type de base (ex: M50_3Q -> M50)
                const baseType = selectedBrick.split('_')[0];
                const brickSubTypes = ['M50', 'M57', 'M60', 'M65', 'M90'];
                if (brickSubTypes.includes(baseType)) {
                    specificType = baseType;
                    // console.log(`🔧 ConstructionTools: Utilisation du type spécifique sélectionné: ${specificType} (depuis TabManager.selectedLibraryItem: ${selectedBrick})`);
                }
            }
            
            // Normalisation: si on passe au mode isolant, forcer le type d'assise générique 'insulation'
            const normalizedType = (mode === 'insulation') ? 'insulation' : specificType;
            if (window.AssiseManager.currentType !== normalizedType) {
                window.AssiseManager.setCurrentType(normalizedType, true); // skipToolChange = true pour éviter la boucle
                // console.log(`Basculement automatique vers le type d'assise: ${normalizedType}`);
            }
        }
        
        // Ajuster les dimensions par défaut selon le mode seulement si on ne préserve pas
        if (!preserveDimensions) {
            this.setDefaultDimensions(mode);
        }
        
        // Mettre à jour l'élément fantôme seulement si initialisé
        if (this.isInitialized) {
            this.createGhostElement();
            
            // Si on préserve les dimensions, mettre à jour le fantôme après sa création
            if (preserveDimensions) {
                this.updateGhostElement();
            }
        } else {
            console.log('🚫 ConstructionTools pas encore initialisé, createGhostElement ignoré');
        }
        
        const currentModeElement = document.getElementById('currentMode');
        if (currentModeElement) {
            currentModeElement.textContent = this.getModeDisplayName(mode);
        }
        
        // Mettre à jour l'affichage de l'orientation selon le mode
        this.updateOrientationDisplay();
    }

    setMaterial(materialId) {
        this.currentMaterial = materialId;
        const materialData = window.MaterialLibrary.getMaterial(materialId);
        
        const currentMaterialElement = document.getElementById('currentMaterial');
        if (currentMaterialElement) {
            currentMaterialElement.textContent = materialData.name;
        }
        
        // Mettre à jour l'élément fantôme
        if (this.ghostElement) {
            this.ghostElement.setMaterial(materialId);
            // Maintenir la transparence
            this.ghostElement.mesh.material.transparent = true;
            this.ghostElement.mesh.material.opacity = 0.3;
            this.ghostElement.mesh.material.emissive.setHex(0x222222);
        }
        
        if (this.previewElement) {
            this.previewElement.setMaterial(materialId);
        }
    }

    setDefaultDimensions(mode) {
        const defaults = {
            'brick': { length: 19, width: 9, height: 6.5 }, // M65 par défaut
            'block': { length: 39, width: 19, height: 19 },
            'insulation': { length: 120, width: 5, height: 60 }, // PUR5 par défaut
            'linteau': { length: 120, width: 14, height: 19 }, // L120 par défaut
            'diba': { length: 100, width: 0.5, height: 15 } // largeur (épaisseur) ~0.5cm, hauteur d'extrusion par défaut 15cm
        };

        const dims = defaults[mode] || defaults['brick'];
        document.getElementById('elementLength').value = dims.length;
        document.getElementById('elementWidth').value = dims.width;
        document.getElementById('elementHeight').value = dims.height;
    }

    getModeDisplayName(mode) {
        const names = {
            'brick': 'Brique',
            'block': 'Bloc',
            'insulation': 'Isolant',
            'linteau': 'Linteau',
            'diba': 'Étanchéité'
        };
        return names[mode] || 'Brique';
    }

    updateToolButtons() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === this.currentMode) {
                btn.classList.add('active');
            }
        });
    }

    updateModeInterface(mode) {
        // Gérer l'affichage des informations selon le mode
        const brickInfo = document.querySelector('.selected-brick-info');
        const blockInfo = document.querySelector('.selected-block-info');
        const insulationInfo = document.querySelector('.selected-insulation-info');
        const linteauInfo = document.querySelector('.selected-linteau-info');
        
        if (mode === 'brick') {
            if (brickInfo) brickInfo.style.display = 'block';
            if (blockInfo) blockInfo.style.display = 'none';
            if (insulationInfo) insulationInfo.style.display = 'none';
            if (linteauInfo) linteauInfo.style.display = 'none';
        } else if (mode === 'block') {
            if (brickInfo) brickInfo.style.display = 'none';
            if (blockInfo) blockInfo.style.display = 'block';
            if (insulationInfo) insulationInfo.style.display = 'none';
            if (linteauInfo) linteauInfo.style.display = 'none';
        } else if (mode === 'insulation') {
            if (brickInfo) brickInfo.style.display = 'none';
            if (blockInfo) blockInfo.style.display = 'none';
            if (insulationInfo) insulationInfo.style.display = 'block';
            if (linteauInfo) linteauInfo.style.display = 'none';
        } else if (mode === 'linteau') {
            if (brickInfo) brickInfo.style.display = 'none';
            if (blockInfo) blockInfo.style.display = 'none';
            if (insulationInfo) insulationInfo.style.display = 'none';
            if (linteauInfo) linteauInfo.style.display = 'block';
        } else {
            // Autres modes
            if (brickInfo) brickInfo.style.display = 'none';
            if (blockInfo) blockInfo.style.display = 'none';
            if (insulationInfo) insulationInfo.style.display = 'none';
            if (linteauInfo) linteauInfo.style.display = 'none';
        }
    }

    togglePlacementMode() {
        this.isPlacementMode = !this.isPlacementMode;
        const btn = document.getElementById('placeElement');
        
        if (this.isPlacementMode) {
            btn.textContent = 'Annuler Placement';
            btn.classList.remove('btn-success');
            btn.classList.add('btn-warning');
            this.createPreviewElement();
        } else {
            btn.textContent = 'Placer Élément';
            btn.classList.remove('btn-warning');
            btn.classList.add('btn-success');
            this.removePreviewElement();
        }
    }

    createPreviewElement() {
        if (!window.SceneManager || !window.SceneManager.scene) {
            console.warn('SceneManager non disponible');
            return;
        }
        
        if (this.previewElement) {
            this.removePreviewElement();
        }

        // CORRECTION: Utiliser les dimensions selon le mode actuel
        let length, width, height;
        if (this.currentMode === 'brick' && window.BrickSelector) {
            // Pour les briques, utiliser BrickSelector
            const currentBrick = window.BrickSelector.getCurrentBrick();
            length = currentBrick.length;
            width = currentBrick.width;
            height = currentBrick.height;
        } else if (this.currentMode === 'linteau' && window.LinteauSelector) {
            // Pour les linteaux, utiliser LinteauSelector avec support des coupes
            const currentLinteau = window.LinteauSelector.getCurrentLinteauWithCut();
            if (currentLinteau) {
                length = currentLinteau.length;
                width = currentLinteau.width;
                height = currentLinteau.height;
                console.log('🔧 Dimensions linteau pour createPreview:', length + 'x' + width + 'x' + height);
            } else {
                // Fallback vers champs HTML
                length = parseInt(document.getElementById('elementLength').value);
                width = parseInt(document.getElementById('elementWidth').value);
                height = parseInt(document.getElementById('elementHeight').value);
            }
        } else if (this.currentMode === 'beam' && window.BeamProfiles) {
            const p = window.BeamProfiles.getProfile ? window.BeamProfiles.getProfile(this.currentBeamType || 'IPE80') : null;
            const defaultLen = this.currentBeamLengthCm || parseInt(document.getElementById('elementLength').value) || 100;
            length = defaultLen;
            if (p) {
                width = Math.round((p.b / 10));
                height = Math.round((p.h / 10));
            } else {
                width = parseInt(document.getElementById('elementWidth').value);
                height = parseInt(document.getElementById('elementHeight').value);
            }
        } else {
            // Pour les blocs et isolants, ou si les sélecteurs ne sont pas disponibles, utiliser les champs HTML
            length = parseInt(document.getElementById('elementLength').value);
            width = parseInt(document.getElementById('elementWidth').value);
            height = parseInt(document.getElementById('elementHeight').value);
        }

        // Déterminer le type correct de l'élément
        const elementType = this.getElementTypeForMode(this.currentMode);

        this.previewElement = new WallElement({
            type: elementType, // Utiliser le type correct au lieu de this.currentMode
            blockType: this.getElementTypeForMode(this.currentMode), // CORRECTION: Ajouter le blockType spécifique
            material: this.getAutoMaterial(),
            x: 0,
            y: 0,
            z: 0,
            length,
            width,
            height,
            ...(this.currentMode === 'beam' ? {
                beamType: this.currentBeamType || 'IPE80',
                beamLengthCm: this.currentBeamLengthCm || length
            } : {})
        });

        // Rendre l'élément semi-transparent
        this.previewElement.mesh.material = this.previewElement.mesh.material.clone();
        this.previewElement.mesh.material.transparent = true;
        this.previewElement.mesh.material.opacity = 0.6;

        window.SceneManager.scene.add(this.previewElement.mesh);
    }

    removePreviewElement() {
        if (this.previewElement && window.SceneManager && window.SceneManager.scene) {
            window.SceneManager.scene.remove(this.previewElement.mesh);
            this.previewElement.dispose();
            this.previewElement = null;
        }
    }

    updatePreview() {
        if (this.previewElement) {
            // CORRECTION: Utiliser les dimensions selon le mode actuel
            let length, width, height;
            if (this.currentMode === 'brick' && window.BrickSelector) {
                // Pour les briques, utiliser BrickSelector
                const currentBrick = window.BrickSelector.getCurrentBrick();
                length = currentBrick.length;
                width = currentBrick.width;
                height = currentBrick.height;
            } else if (this.currentMode === 'linteau' && window.LinteauSelector) {
                // Pour les linteaux, utiliser LinteauSelector avec support des coupes
                const currentLinteau = window.LinteauSelector.getCurrentLinteauWithCut();
                if (currentLinteau) {
                    length = currentLinteau.length;
                    width = currentLinteau.width;
                    height = currentLinteau.height;
                    console.log('🔧 Dimensions linteau pour updatePreview:', length + 'x' + width + 'x' + height);
                } else {
                    // Fallback vers champs HTML
                    length = parseInt(document.getElementById('elementLength').value);
                    width = parseInt(document.getElementById('elementWidth').value);
                    height = parseInt(document.getElementById('elementHeight').value);
                }
            } else {
                // Pour les blocs et isolants, ou si les sélecteurs ne sont pas disponibles, utiliser les champs HTML
                length = parseInt(document.getElementById('elementLength').value);
                width = parseInt(document.getElementById('elementWidth').value);
                height = parseInt(document.getElementById('elementHeight').value);
            }
            
            this.previewElement.updateDimensions(length, width, height);
        }
    }

    updatePreviewPosition(x, z) {
        if (this.previewElement) {
            let y = 0;
            this.supportElement = null; // Reset support element
            
            // Auto-stacking: trouver la hauteur appropriée
            if (this.autoStack) {
                const stackingResult = this.findStackingHeight(x, z);
                y = stackingResult.height;
                this.supportElement = stackingResult.supportElement;
            }
            
            this.previewElement.updatePosition(x, y, z);
        }
    }

    findStackingHeight(x, z) {
        let maxHeight = 0;
        let supportElement = null;
        const elements = window.SceneManager.getAllElements();
        
        if (!elements || elements.length === 0) {
            return { height: 0, supportElement: null };
        }
        
        const currentElement = this.ghostElement || this.previewElement;
        if (!currentElement) {
            return { height: 0, supportElement: null };
        }
        
        const tolerance = currentElement.dimensions.length / 4; // Tolérance pour l'empilage
        
        elements.forEach(element => {
            const distance = Math.sqrt(
                Math.pow(element.position.x - x, 2) + 
                Math.pow(element.position.z - z, 2)
            );
            
            if (distance < tolerance) {
                const elementTop = element.position.y + element.dimensions.height;
                if (elementTop > maxHeight) {
                    maxHeight = elementTop;
                    supportElement = element; // Mémoriser l'élément le plus haut trouvé
                }
            }
        });
        
        return { height: maxHeight, supportElement: supportElement };
    }

    placeElementAtCursor(x = null, z = null) {
        if (window.DEBUG_CONSTRUCTION) {
            console.log('🚨 PLACEMENT DEBUG: placeElementAtCursor appelé avec paramètres:', {x, z});
        }
        
        // Vérifier en priorité si on doit placer un élément GLB
        if (window.tempGLBInfo) {
            this.placeGLBElementAtCursor();
            return;
        }
        
        if (!this.previewElement) return;

        // CORRECTION: Nettoyer les suggestions avant de placer manuellement
        // Cela permet de s'assurer que le ghost principal redevient visible
        this.clearSuggestions();

        // Utiliser les coordonnées fournies ou celles du previewElement
        const finalX = x !== null ? x : this.previewElement.position.x;
        const finalZ = z !== null ? z : this.previewElement.position.z;
        let finalY = this.previewElement.position.y;
        
        if (window.DEBUG_CONSTRUCTION) {
            console.log('🚨 PLACEMENT DEBUG: Coordonnées finales:', {finalX, finalZ, finalY});
        }
        
        // NOUVELLE FONCTIONNALITÉ: Gestion spéciale pour les briques sur chant avec hauteur personnalisée
        if (this.currentMode === 'brick' && window.BrickSelector) {
            const currentBrickType = window.BrickSelector.getCurrentBrick();
            if (currentBrickType && window.BrickSelector.isBrickOnChant && window.BrickSelector.isBrickOnChant(window.BrickSelector.currentBrick)) {
                // Vérifier si une hauteur personnalisée a été définie
                if (typeof window.chantBrickHeight !== 'undefined') {
                    const customHeight = window.chantBrickHeight;
                    const elementHeight = this.previewElement.dimensions.height;
                    // Calculer la position Y : hauteur du bas + demi-hauteur de l'élément
                    finalY = customHeight + (elementHeight / 2);
                    console.log(`🎯 Placement brique sur chant à hauteur personnalisée: ${customHeight}cm (Y=${finalY})`);
                    
                    // Réinitialiser la variable après utilisation
                    delete window.chantBrickHeight;
                }
            }
        }

        // ✅ CORRECTION FINALE: Utiliser directement BrickSelector au lieu de previewElement.dimensions
        // car previewElement.dimensions peut être obsolète quand on change de coupe
        let finalLength, finalWidth, finalHeight, finalBlockType;
        
        if (this.currentMode === 'brick' && window.BrickSelector) {
            const currentBrick = window.BrickSelector.getCurrentBrick();
            
            console.log('🧱 Placement: Récupération des dimensions depuis BrickSelector:', {
                type: currentBrick?.type,
                length: currentBrick?.length,
                width: currentBrick?.width,
                height: currentBrick?.height
            });
            
            if (currentBrick) {
                finalLength = currentBrick.length;
                finalWidth = currentBrick.width;
                finalHeight = currentBrick.height;
                finalBlockType = currentBrick.type; // ✅ UTILISER le type exact du BrickSelector
            } else {
                // Fallback vers previewElement si BrickSelector n'est pas disponible
                finalLength = this.previewElement.dimensions.length;
                finalWidth = this.previewElement.dimensions.width;
                finalHeight = this.previewElement.dimensions.height;
                finalBlockType = this.getElementTypeForMode(this.currentMode);
            }
        } else {
            // Pour les modes non-brick, utiliser previewElement
            finalLength = this.previewElement.dimensions.length;
            finalWidth = this.previewElement.dimensions.width;
            finalHeight = this.previewElement.dimensions.height;
            finalBlockType = this.getElementTypeForMode(this.currentMode);
        }
        
        console.log('🧱 Placement: Dimensions finales pour WallElement:', {
            blockType: finalBlockType,
            length: finalLength,
            width: finalWidth,
            height: finalHeight
        });
        
        const element = new WallElement({
            type: this.currentMode,
            blockType: finalBlockType, // ✅ UTILISER le type exact avec bonnes dimensions
            material: this.getAutoMaterial(),
            x: finalX,
            y: finalY,
            z: finalZ,
            length: finalLength,
            width: finalWidth,
            height: finalHeight
        });

        // Déterminer si on fait de l'empilage vertical sur un élément support
        const allowVerticalStacking = this.supportElement !== null;
        
        // ❌ SYSTÈME DE COLLISION COMPLÈTEMENT DÉSACTIVÉ - PLACEMENT LIBRE
        if (true) { // !window.SceneManager.checkCollisions(element, allowVerticalStacking, this.supportElement)) {
            window.SceneManager.addElement(element);
            
            // Intégration avec le système de calques
            if (window.LayerManager) {
                const elementType = element.userData?.type || this.currentMode || 'unknown';
                console.log('🎨 Assignation au calque:', {
                    elementId: element.id,
                    userData: element.userData,
                    currentMode: this.currentMode,
                    elementType: elementType
                });
                window.LayerManager.onElementAdded(element, elementType);
            } else {
                console.warn('⚠️ LayerManager non disponible lors de l\'ajout d\'élément');
            }
            
            // Réinitialiser les variables de support après placement réussi
            this.supportElement = null;
            
            // Réinitialiser la rotation manuelle après placement réussi
            this.resetManualRotation();
            
            // Jouer le son de placement
            // Son supprimé
            
            // Continuer le placement ou arrêter
            if (!this.isPlacementMode) {
                this.removePreviewElement();
            }
        } else {
            element.dispose();
            console.warn('Collision détectée, placement annulé');
            
            // Jouer le son d'erreur
            // Son supprimé
        }
    }

    /**
     * Placer un élément GLB à la position du curseur
     */
    placeGLBElementAtCursor() {
        if (!window.tempGLBInfo || !this.ghostElement) {
            console.warn('❌ Impossible de placer GLB: tempGLBInfo ou ghostElement manquant');
            return;
        }

        const glbInfo = window.tempGLBInfo;
        
        // 🔧 CORRECTION: Faire une copie IMMÉDIATEMENT pour éviter la perte des données
        const glbInfoCopy = JSON.parse(JSON.stringify(window.tempGLBInfo));
        
        // Récupérer la position du fantôme
        const x = this.ghostElement.mesh.position.x;
        let y = this.ghostElement.mesh.position.y;
        let z = this.ghostElement.mesh.position.z;
        
        // CORRECTION PLANCHERS: Forcer le placement au niveau du sol ABSOLU (Y=0) pour hourdis, poutrains et claveaux
        const isHourdis = glbInfo && (glbInfo.type.includes('hourdis') || glbInfo.name.includes('Hourdis'));
        const isPoutrain = glbInfo && (glbInfo.type.includes('poutrain') || glbInfo.name.includes('Poutrain'));
        const isClaveau = glbInfo && (glbInfo.type.includes('claveau') || glbInfo.name.includes('Claveau'));
        
        if (isHourdis || isPoutrain || isClaveau) {
            const elementHeight = glbInfo.dimensions ? glbInfo.dimensions.height : (isPoutrain || isClaveau ? 12 : 13);
            y = 0; // FORCER Y=0 pour que la BASE de l'élément touche le sol
            z = this.ghostElement.mesh.position.z; // Garder la position Z du curseur
        }
        
        // Supprimer le fantôme avant de placer l'élément réel
        this.removeGhostElement();
        
        // Utiliser le système d'import GLB existant avec l'échelle personnalisée
        if (window.FileMenuHandler) {
            // Sauvegarder l'échelle pour l'import
            window.tempGLBScale = glbInfo.scale;
            
            // Créer un objet File simulé pour l'import
            const fileName = glbInfo.path.split('/').pop();
            
            // Charger et placer le GLB via XMLHttpRequest
            const xhr = new XMLHttpRequest();
            xhr.open('GET', glbInfo.path, true);
            xhr.responseType = 'arraybuffer';
            
            xhr.onload = () => {
                if (xhr.status === 200) {
                    // Créer un blob à partir de la réponse
                    const blob = new Blob([xhr.response]);
                    const file = new File([blob], fileName, { type: 'model/gltf-binary' });
                    
                    // Traiter le fichier GLB avec position personnalisée
                    window.tempGLBPosition = { x, y, z };
                    
                    // 🔧 GLB: Transférer les informations d'échelle pour le placement réel
                    if (glbInfo.scale) {
                        window.tempGLBScale = {
                            x: glbInfo.scale.x,
                            y: glbInfo.scale.y,
                            z: glbInfo.scale.z
                        };
                    }
                    
                    window.FileMenuHandler.processGLBFile(file);
                    
                    // 📦 Préserver les infos GLB pour l'aperçu dans l'onglet Outils
                    if (window.tempGLBInfo) {
                        window.lastPlacedGLBInfo = { ...window.tempGLBInfo };
                        
                        // Déclencher la mise à jour de l'aperçu dans l'onglet Outils
                        if (window.ToolsTabManager && window.ToolsTabManager.updateActiveElementPreview) {
                            setTimeout(() => {
                                window.ToolsTabManager.updateActiveElementPreview();
                            }, 200);
                        }
                    }
                    
                    // 🔧 CORRECTION: Utiliser la copie créée au début de la fonction
                    
                    // Marquer qu'on est en train de placer pour éviter les doublons
                    window.isPlacingGLB = true;
                    
                    // 🔧 CORRECTION: Ne PAS supprimer tempGLBInfo pour permettre le placement continu
                    // delete window.tempGLBInfo;
                    
                    // Écouter la fin du placement via file-menu-handler
                    const handleGLBPlaced = () => {
                        // Supprimer l'ancien fantôme avant de créer le nouveau
                        this.removeGhostElement();
                        
                        // 🔧 CORRECTION: Maintenir lastPlacedGLBInfo pour préserver l'aperçu
                        if (window.tempGLBInfo) {
                            window.lastPlacedGLBInfo = { ...window.tempGLBInfo };
                        }
                        
                        // Restaurer les infos GLB pour le placement continu
                        window.tempGLBInfo = glbInfoCopy;
                        window.isPlacingGLB = false;
                        
                        // Déclencher la mise à jour de l'aperçu des outils
                        if (window.ToolsTabManager && window.ToolsTabManager.updateActiveElementPreview) {
                            window.ToolsTabManager.updateActiveElementPreview();
                        }
                        
                        this.createGhostElement(); // Créer un nouveau fantôme GLB
                        
                        // 🔧 CORRECTION: Ne pas vérifier immédiatement le fantôme car le chargement GLB est asynchrone
                        // Le fantôme sera créé dans le callback de succès du loader
                        
                        document.removeEventListener('elementPlaced', handleGLBPlaced);
                    };
                    
                    document.addEventListener('elementPlaced', handleGLBPlaced);
                    
                } else {
                    console.error('❌ Erreur lors du chargement du fichier GLB:', xhr.status);
                }
            };
            
            xhr.onerror = () => {
                console.error('❌ Erreur réseau lors du chargement du fichier GLB');
            };
            
            xhr.send();
        } else {
            console.error('❌ FileMenuHandler non disponible pour le placement GLB');
        }
    }

    deleteSelectedElement() {
        if (window.SceneManager.selectedElement) {        // 🔒 BLOCAGE CRITIQUE: Vérifier si l'élément peut être supprimé (assises)
        if (window.AssiseManager && !window.AssiseManager.canSelectElement(window.SceneManager.selectedElement.id, true)) {
            console.log(`🔒 BLOCAGE SUPPRESSION: Élément ${window.SceneManager.selectedElement.id} d'assise inférieure - suppression refusée`);
            return;
        }
            
            window.SceneManager.removeElement(window.SceneManager.selectedElement.id);
            
            // Jouer le son de suppression
            // Son supprimé
        }
    }

    clearAll() {
        // Suppression directe de tous les éléments sans confirmation
        window.SceneManager.clearAll();
        this.removePreviewElement();
        this.isPlacementMode = false;
            
        // Nettoyer les points snap de grille
        this.clearGridSnapPoints();
        
        this.updateUI();
        
        // Jouer le son de suppression
        // Son supprimé
    }

    onDimensionsChanged() {
        // Recréer l'élément fantôme avec les nouvelles dimensions
        if (this.isInitialized && this.showGhost) {
            this.createGhostElement();
        }
        
        // Si on a des suggestions actives, les recréer aussi
        if (this.activeBrickForSuggestions) {
            if (this.currentMode !== 'diba') {
                this.createPlacementSuggestions(this.activeBrickForSuggestions);
            }
        }
    }

    onElementSelected(element) {
        // Si on est en mode sélection, basculer automatiquement en mode placement
        // MAIS seulement pour les éléments de construction, pas pour les annotations/mesures/textes
        if (window.toolbarManager && window.toolbarManager.interactionMode === 'selection') {
            // Vérifier si c'est un élément de construction
            const isConstructionElement = element.type && 
                !['annotation', 'measurement', 'textleader'].includes(element.type) &&
                !['annotation', 'measurement', 'textleader'].includes(element.toolType);
                
            if (isConstructionElement) {
                // console.log('🔄 Élément sélectionné dans la bibliothèque - Bascule du mode sélection vers le mode placement');
                window.toolbarManager.setInteractionMode('placement');
            } else {
                // console.log('📝 Élément d\'annotation/mesure/texte sélectionné - Maintien du mode sélection');
                // Rester en mode sélection pour les annotations/mesures/textes
                return;
            }
        }
        
        // Réinitialiser la rotation manuelle lors de la sélection d'un élément
        // pour permettre à l'utilisateur de profiter de la rotation intelligente
        this.resetManualRotation();
        
        // Mettre à jour l'interface avec les propriétés de l'élément sélectionné
        // Mais seulement pour les éléments de construction (pas les annotations/cotations)
        const isConstructionElement = (element.dimensions && 
            element.type !== 'measurement' && element.toolType !== 'measurement' &&
            !['annotation', 'textleader'].includes(element.type) &&
            !['annotation', 'textleader'].includes(element.toolType)) ||
            (element.type === 'glb' || element.isGLBModel); // Inclure les modèles GLB
            
        if (isConstructionElement) {
            // Pour les modèles GLB, ne pas mettre à jour les contrôles de construction traditionnels
            if (element.type === 'glb' || element.isGLBModel) {
                // Laisser le système d'affichage des propriétés gérer les modèles GLB
                console.log('🎯 Modèle GLB sélectionné:', element.glbFileName || element.name);
            } else {
                // Gestion normale pour les éléments de construction traditionnels
                document.getElementById('elementLength').value = element.dimensions.length;
                document.getElementById('elementWidth').value = element.dimensions.width;
                document.getElementById('elementHeight').value = element.dimensions.height;
                document.getElementById('materialSelect').value = element.material;
                
                this.setMode(element.type, true); // Préserver les dimensions
                this.setMaterial(element.material);
            }
        }
        
        this.updateToolButtons();
        
        // Afficher l'orientation de l'élément sélectionné dans la barre de statut
        if (element.type === 'brick') {
            const orientationLabel = element.getSpecificFaceLabel();
            this.safeUpdateElement('currentOrientation', orientationLabel);
        }
        
        // Mettre à jour l'élément fantôme pour refléter l'élément sélectionné
        // MAIS seulement pour les éléments de construction
        if (this.isInitialized && isConstructionElement) {
            // console.log('Mise à jour de l\'élément fantôme suite à la sélection:', {
            //     type: element.type,
            //     material: element.material,
            //     dimensions: element.dimensions
            // });
            this.updateGhostElement();
        }
    }

    handleKeyPress(event) {
        // Ignorer les raccourcis si on est dans un champ de saisie
        const target = event.target;
        const isInputField = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.contentEditable === 'true' ||
                           target.isContentEditable ||
                           target.hasAttribute('contenteditable');
                           
        if (isInputField) {
            return;
        }
        
        // Raccourcis clavier
        switch(event.key) {
            case 'Escape':
                if (this.isPlacementMode) {
                    this.togglePlacementMode();
                }
                break;
            case 'Delete':
                this.deleteSelectedElement();
                break;
            case ' ':
                if (this.isPlacementMode && this.previewElement) {
                    event.preventDefault();
                    this.placeElementAtCursor();
                }
                break;
            case '1':
                this.setMode('brick');
                this.updateToolButtons();
                break;
            case '2':
                this.setMode('block');
                this.updateToolButtons();
                break;
            case '3':
                this.setMode('insulation');
                this.updateToolButtons();
                break;
            case '4':
                this.setMode('linteau');
                this.updateToolButtons();
                break;
            case 'g':
            case 'G':
                // Activer/désactiver les points snap de grille
                event.preventDefault();
                this.toggleGridSnapPoints();
                break;
            case 'r':
            case 'R':
            case 'ArrowRight':
                // Rotation manuelle du fantôme ou de l'élément sélectionné
                // Seules les touches R et flèche droite permettent la rotation
                event.preventDefault(); // Empêcher le comportement par défaut de la flèche
                if (this.ghostElement && this.showGhost && !this.activeBrickForSuggestions) {
                    this.rotateGhostElement();
                } else if (window.SceneManager.selectedElement) {
                    this.rotateSelectedElement();
                }
                break;
        }
    }

    rotateSelectedElement() {
        if (window.SceneManager.selectedElement) {        // 🔒 BLOCAGE CRITIQUE: Vérifier si l'élément peut être tourné (assises)
        if (window.AssiseManager && !window.AssiseManager.canSelectElement(window.SceneManager.selectedElement.id, true)) {
            console.log(`🔒 BLOCAGE ROTATION: Élément ${window.SceneManager.selectedElement.id} d'assise inférieure - rotation refusée`);
            return;
        }
            
            // Vérifier si l'élément sélectionné est un GLB et a une méthode setRotation
            if (window.SceneManager.selectedElement.setRotation) {
                const currentRotation = window.SceneManager.selectedElement.rotation;
                const newRotation = currentRotation + Math.PI / 2;
                window.SceneManager.selectedElement.setRotation(newRotation);
            } else if (window.SceneManager.selectedElement.userData && window.SceneManager.selectedElement.userData.isGLB) {
                // Pour les éléments GLB, utiliser la rotation Three.js directe
                const currentRotation = window.SceneManager.selectedElement.rotation.y;
                const newRotation = currentRotation + Math.PI / 2;
                window.SceneManager.selectedElement.rotation.y = newRotation;
            }
        }
    }

    // Rotation du fantôme de 90° (clic droit et touche R)
    rotateGhostElement() {
        if (this.ghostElement && this.showGhost && !this.activeBrickForSuggestions) {
            // Gérer la rotation différemment selon le type d'élément
            // Pour les GLB, vérifier soit userData.isGLB soit userData.isGLBGhost soit l'existence de mesh
            const isGLBElement = (this.ghostElement.userData && (this.ghostElement.userData.isGLB || this.ghostElement.userData.isGLBGhost)) || 
                                 (this.ghostElement.mesh && this.ghostElement.mesh.userData && this.ghostElement.mesh.userData.isGLBGhost);
            
            if (isGLBElement) {
                // Pour les éléments GLB, utiliser la rotation Three.js directe
                const ghostObject = this.ghostElement.mesh || this.ghostElement;
                const currentRotation = ghostObject.rotation.y;
                const newRotation = (currentRotation + Math.PI / 2) % (Math.PI * 2);
                
                ghostObject.rotation.y = newRotation;
                
                // Marquer qu'une rotation manuelle a été effectuée
                this.hasManualRotation = true;
                this.manualRotation = newRotation;
            } else {
                // Pour les briques classiques, utiliser la méthode existante
                const currentRotation = this.ghostElement.rotation;
                const newRotation = (currentRotation + Math.PI / 2) % (Math.PI * 2);
                
                // Marquer qu'une rotation manuelle a été effectuée
                this.hasManualRotation = true;
                this.manualRotation = newRotation;
                
                this.ghostElement.setRotation(newRotation);
            }
            
            this.updateRotationDisplay();
            
            // Jouer un son de rotation si disponible
            // Son supprimé
        }
    }

    // Réinitialiser la rotation manuelle
    resetManualRotation() {
        this.hasManualRotation = false;
        this.manualRotation = 0;
    }

    // Fonctions avancées de construction
    createWallBetweenPoints(startX, startZ, endX, endZ, height = 240) {
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endZ - startZ, 2));
        const angle = Math.atan2(endZ - startZ, endX - startX);
        
        const elementLength = parseInt(document.getElementById('elementLength').value);
        const elementHeight = parseInt(document.getElementById('elementHeight').value);
        
        const numElements = Math.ceil(distance / elementLength);
        const numRows = Math.ceil(height / elementHeight);
        
        for (let row = 0; row < numRows; row++) {
            for (let i = 0; i < numElements; i++) {
                const offset = row % 2 === 0 ? 0 : elementLength / 2; // Décalage pour le motif brique
                const x = startX + (i * elementLength + offset) * Math.cos(angle);
                const z = startZ + (i * elementLength + offset) * Math.sin(angle);
                const y = row * elementHeight;
                
                if (Math.sqrt(Math.pow(x - startX, 2) + Math.pow(z - startZ, 2)) <= distance) {
                    const element = new WallElement({
                        type: this.currentMode,
                        material: this.getAutoMaterial(),
                        x,
                        y,
                        z,
                        length: elementLength,
                        width: parseInt(document.getElementById('elementWidth').value),
                        height: elementHeight,
                        rotation: angle
                    });
                    
                    // ❌ SYSTÈME DE COLLISION COMPLÈTEMENT DÉSACTIVÉ - PLACEMENT LIBRE
                    if (true) { // !window.SceneManager.checkCollisions(element)) {
                        window.SceneManager.addElement(element);
                        
                        // Intégration avec le système de calques
                        if (window.LayerManager) {
                            window.LayerManager.onElementAdded(element, element.userData?.type || this.currentMode);
                        }
                    } else {
                        element.dispose();
                    }
                }
            }
        }
    }





    updateUI() {
        const placeBtn = document.getElementById('placeElement');
        if (!this.isPlacementMode) {
            placeBtn.textContent = 'Placer Élément';
            placeBtn.classList.remove('btn-warning');
            placeBtn.classList.add('btn-success');
        }
   }

    // Mettre à jour l'affichage de la rotation dans la barre de statut
    updateRotationDisplay() {
        if (this.ghostElement) {
            const degrees = Math.round((this.ghostElement.rotation * 180) / Math.PI);
            this.safeUpdateElement('currentRotation', `${degrees}°`);
            
            // Mettre à jour l'affichage de l'orientation technique
            if (this.ghostElement.type === 'brick') {
                const orientationLabel = this.ghostElement.getSpecificFaceLabel();
                this.safeUpdateElement('currentOrientation', orientationLabel);
            } else {
                this.safeUpdateElement('currentOrientation', 'N/A');
            }
        }
    }

    // Mettre à jour l'affichage de l'orientation selon le mode
    updateOrientationDisplay() {
        if (this.currentMode === 'brick' && this.ghostElement && this.ghostElement.getSpecificFaceLabel) {
            const orientationLabel = this.ghostElement.getSpecificFaceLabel();
            document.getElementById('currentOrientation').textContent = orientationLabel;
        } else {
            document.getElementById('currentOrientation').textContent = 'N/A';
        }
    }

    // Détecter l'orientation recommandée basée sur l'élément directement sous le curseur
    // MÉTHODE DÉSACTIVÉE - Plus de rotation automatique au survol
    // Seules les touches R et flèche droite permettent la rotation à 90°
    detectSmartRotation(x, z) {
        // Cette méthode est maintenant désactivée pour éviter la rotation 
        // automatique lors du survol des faces de briques
        // Seule la rotation manuelle via R ou flèche droite est autorisée
        return 0; // Toujours retourner la rotation par défaut (panneresse)
        
        /*
        // ANCIEN CODE DÉSACTIVÉ:
        if (!window.SceneManager || !window.SceneManager.raycaster || !window.SceneManager.mouse) {
            return 0;
        }

        // Utiliser le raycaster existant du SceneManager
        const elementMeshes = Array.from(window.SceneManager.elements.values()).map(el => el.mesh);
        window.SceneManager.raycaster.setFromCamera(window.SceneManager.mouse, window.SceneManager.camera);
        const intersects = window.SceneManager.raycaster.intersectObjects(elementMeshes);

        if (intersects.length > 0) {
            const hoveredElement = intersects[0].object.userData.element;
            
            // 🔒 BLOCAGE CRITIQUE: Vérifier si l'élément peut être utilisé pour la rotation intelligente (assises)
            // Pas de log pour éviter le spam, juste retourner la rotation par défaut
            if (window.AssiseManager && !window.AssiseManager.canSelectElement(hoveredElement.id)) {
                // Pas de rotation intelligente sur les briques d'assises inférieures
                return 0; // Rotation par défaut
            }
            
            // Ne créer les suggestions que si cette brique est active pour suggestions
            // (pas automatiquement au survol)
            
            // Vérifier que c'est une brique ou un bloc
            if (hoveredElement.type === 'brick' || hoveredElement.type === 'block') {
                // Analyser l'orientation de l'élément survolé
                const elementRotation = hoveredElement.rotation;
                // Normaliser la rotation entre 0 et 2π
                const normalizedRotation = ((elementRotation % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
                
                // Considérer qu'un élément est en boutisse s'il est tourné d'environ 90° ou 270°
                const isElementInBoutisse = (normalizedRotation > Math.PI / 4 && normalizedRotation < 3 * Math.PI / 4) ||
                                          (normalizedRotation > 5 * Math.PI / 4 && normalizedRotation < 7 * Math.PI / 4);
                
                // Log réduit pour éviter le spam
                if (Math.random() < 0.01) { // Seulement 1% des survolages
                    console.log('Élément survolé:', {
                        type: hoveredElement.type,
                        rotation: elementRotation,
                        normalizedRotation: normalizedRotation,
                        rotationDegrees: (normalizedRotation * 180) / Math.PI,
                        isBoutisse: isElementInBoutisse
                    });
                }
                
                // Si l'élément survolé est en boutisse (tourné à 90°), 
                // proposer orientation panneresse (normale)
                if (isElementInBoutisse) {
                    return 0; // Orientation normale (panneresse)
                } else {
                    // Si l'élément survolé est en panneresse (normal),
                    // proposer orientation boutisse (90°)
                    return Math.PI / 2; // Rotation 90° (boutisse)
                }
            }
        }

        return 0; // Orientation par défaut (panneresse)
        */
    }

    // Créer des suggestions de placement autour d'un élément survolé
    createPlacementSuggestions(hoveredElement) {
        // Blocage global mode diba: aucune suggestion adjacente
        if (this.currentMode === 'diba') {
            // Pas de log verbeux pour ne pas polluer la console
            return;
        }
        // 🔒 BLOCAGE PRIORITAIRE: Vérifier si la toolbar est active
        if (window.isToolbarBlocking && window.isToolbarBlocking()) {
            console.log('🔒 BLOCAGE TOOLBAR: Suggestions désactivées car toolbar active');
            return;
        }
        
        // 🔒 NOUVEAU BLOCAGE: Vérifier si les suggestions ont été désactivées par l'interface
        if (this.suggestionsDisabledByInterface) {
            console.log('🔒 BLOCAGE INTERFACE: Suggestions bloquées après désactivation par interface');
            return;
        }
        
        if (!this.showSuggestions || !hoveredElement || !this.isInitialized) {
            console.log('🔒 createPlacementSuggestions - conditions non remplies:', {
                showSuggestions: this.showSuggestions,
                hoveredElement: !!hoveredElement,
                isInitialized: this.isInitialized
            });
            return;
        }
        
        // 🔒 BLOCAGE CRITIQUE: Vérifier si l'élément peut être utilisé pour les suggestions (assises)
        if (window.AssiseManager && !window.AssiseManager.canSelectElement(hoveredElement.id, true)) {
            console.log(`🔒 BLOCAGE SUGGESTIONS: Élément ${hoveredElement.id} d'assise inférieure - aucune suggestion créée`);
            return;
        }
        
        // console.log('🎯 createPlacementSuggestions appelée pour élément:', hoveredElement.type, hoveredElement.id);
        
        this.clearSuggestions();
        
        // Masquer immédiatement l'élément fantôme principal pendant les suggestions
        if (this.ghostElement && this.ghostElement.mesh) {
            this.ghostElement.mesh.visible = false;
        }
        
        const suggestions = [];
        const basePos = hoveredElement.position;
        const dims = hoveredElement.dimensions;
        const rotation = hoveredElement.rotation;
        
        // Paramètres de joints spécifiques au matériau de l'élément survolé
        const jointVertical = this.getJointVerticalThickness(hoveredElement); // Épaisseur selon le type d'élément
        const jointHorizontal = 1.2; // 1.2cm par défaut
        
        // Calculer les positions de suggestion selon l'orientation de la brique survolée
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        
        // Calculer les vecteurs directionels dans le repère mondial
        const frontVector = { x: -sin, z: cos }; // Vecteur vers l'avant (panneresse frontale)
        const backVector = { x: sin, z: -cos }; // Vecteur vers l'arrière (panneresse dorsale)
        const rightVector = { x: cos, z: sin }; // Vecteur vers la droite
        const leftVector = { x: -cos, z: -sin }; // Vecteur vers la gauche
        
        // Détecter si l'élément est une boutisse (tourné à 90°)
        const normalizedRotation = ((rotation % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
        const isBoutisse = (normalizedRotation > Math.PI / 4 && normalizedRotation < 3 * Math.PI / 4) ||
                          (normalizedRotation > 5 * Math.PI / 4 && normalizedRotation < 7 * Math.PI / 4);
        
        // Calculs proportionnels aux dimensions actuelles pour les suggestions perpendiculaires
        const perpOffsetX = Math.min(9, dims.length * 0.47); // Minimum 9cm ou 47% de la longueur
        const perpOffsetReverse = Math.max(19, dims.length * 1.0); // Minimum 19cm ou 100% de la longueur
        const perpAdjustment = Math.max(14, dims.length * 0.74); // Minimum 14cm ou 74% de la longueur
        
        // SYSTÈME ADAPTATIF: Calculs et numérotation selon le type de brique
        // IMPORTANT: Utiliser les dimensions de l'élément ACTUELLEMENT SÉLECTIONNÉ, pas celui survolé
        let currentElementLength = 19; // Valeur par défaut pour briques
        let elementFullLength = 19; // Longueur standard pour briques
        let brickType = 'entiere'; // Type de brique pour numérotation
        
        if (this.currentMode === 'brick' && window.BrickSelector) {
            // Pour les briques, utiliser BrickSelector
            const currentBrick = window.BrickSelector.getCurrentBrick();
            currentElementLength = currentBrick.length;
            elementFullLength = 19; // Longueur d'une brique entière standard (19cm)
            
            // Déterminer le type de brique selon sa longueur
            if (currentElementLength === 19) {
                brickType = 'entiere'; // Brique entière
            } else if (currentElementLength >= 14 && currentElementLength <= 15) {
                brickType = '3/4'; // Brique 3/4 (14-15cm)
            } else if (currentElementLength >= 9 && currentElementLength <= 10) {
                brickType = '1/2'; // Brique 1/2 (9-10cm)
            } else if (currentElementLength >= 4 && currentElementLength <= 5) {
                brickType = '1/4'; // Brique 1/4 (4-5cm)
            } else {
                brickType = 'custom'; // Brique dimension personnalisée
            }
        } else if (this.currentMode === 'block') {
            // Pour les blocs, utiliser les champs HTML
            currentElementLength = parseInt(document.getElementById('elementLength').value) || 39;
            elementFullLength = 39; // Longueur d'un bloc entier standard (39cm)
            brickType = 'block';
        } else {
            // Fallback sur les champs HTML pour autres types
            currentElementLength = parseInt(document.getElementById('elementLength').value) || 19;
            elementFullLength = this.currentMode === 'block' ? 39 : 19;
            brickType = 'other';
        }
        
        // Calculs spécifiques selon le type de brique
        let lengthAdjustment = 0;
        let positionOffsets = { E: 0, F: 0, I: 0, J: 0 }; // Décalages spécifiques par position
        
        switch (brickType) {
            case 'entiere':
                // Brique entière (19cm) - aucun ajustement nécessaire
                lengthAdjustment = 0;
                positionOffsets = { E: 0, F: 0, I: 0, J: 0 };
                break;
                
            case '3/4':
                // Brique 3/4 (14-15cm) - ajustement modéré
                lengthAdjustment = elementFullLength - currentElementLength; // ~4-5cm
                positionOffsets = { 
                    E: lengthAdjustment * 0.8, // 80% de l'ajustement
                    F: lengthAdjustment * 0.8, 
                    I: lengthAdjustment * 0.6, // 60% de l'ajustement pour angles
                    J: lengthAdjustment * 0.6 
                };
                break;
                
            case '1/2':
                // Brique 1/2 (9-10cm) - ajustement important
                lengthAdjustment = elementFullLength - currentElementLength; // ~9-10cm
                positionOffsets = { 
                    E: lengthAdjustment, // Ajustement complet
                    F: lengthAdjustment, 
                    I: lengthAdjustment * 0.8, // 80% de l'ajustement pour angles
                    J: lengthAdjustment * 0.8 
                };
                break;
                
            case '1/4':
                // Brique 1/4 (4-5cm) - ajustement maximal
                lengthAdjustment = elementFullLength - currentElementLength; // ~14-15cm
                positionOffsets = { 
                    E: lengthAdjustment * 1.2, // 120% de l'ajustement (dépassement)
                    F: lengthAdjustment * 1.2, 
                    I: lengthAdjustment, // Ajustement complet pour angles
                    J: lengthAdjustment 
                };
                break;
                
            default:
                // Autres types (blocs, custom, etc.)
                lengthAdjustment = elementFullLength - currentElementLength;
                positionOffsets = { E: lengthAdjustment, F: lengthAdjustment, I: lengthAdjustment, J: lengthAdjustment };
        }
        
        // Log informatif sur le type et ajustements appliqués
        const elementType = this.currentMode === 'brick' ? 'BRIQUE' : this.currentMode === 'block' ? 'BLOC' : this.currentMode.toUpperCase();
        // console.log(`🔧 ${elementType} ${brickType.toUpperCase()}: longueur=${currentElementLength}cm, ajustements E/F=${positionOffsets.E}cm, I/J=${positionOffsets.I}cm`);
        
        // SYSTÈME DE COMPATIBILITÉ: Déterminer les types de brique de référence et à placer
        let referenceBrickType = 'entiere'; // Type de la brique de référence (survolée)
        const refLength = hoveredElement.dimensions.length;
        
        if (refLength === 19) {
            referenceBrickType = 'entiere';
        } else if (refLength >= 14 && refLength <= 15) {
            referenceBrickType = '3/4';
        } else if (refLength >= 9 && refLength <= 10) {
            referenceBrickType = '1/2';
        } else if (refLength >= 4 && refLength <= 5) {
            referenceBrickType = '1/4';
        } else {
            referenceBrickType = 'custom';
        }
        
        // Définir les positions exclues selon la compatibilité
        const getExcludedPositions = (refType, placeType) => {
            const exclusionRules = {
                // Brique de référence ENTIÈRE (19cm)
                'entiere': {
                    '3/4': [], // Toutes positions autorisées - pas d'exclusion des perpendiculaires
                    '1/2': [], // Toutes positions autorisées - AUTORISER les perpendiculaires pour brique 1/2 sur entière
                    '1/4': [], // Toutes positions autorisées - pas d'exclusion des perpendiculaires
                    'custom': [] // Toutes positions autorisées - pas d'exclusion des perpendiculaires
                },
                // Brique de référence 3/4 (14-15cm)
                '3/4': {
                    'entiere': [], // Toutes positions autorisées - pas d'exclusion des perpendiculaires
                    '1/2': [], // Toutes positions autorisées - AUTORISER les perpendiculaires pour brique 1/2 sur 3/4
                    '1/4': [] // Toutes positions autorisées - pas d'exclusion des perpendiculaires
                },
                // Brique de référence 1/2 (9-10cm)
                '1/2': {
                    'entiere': [], // Toutes positions autorisées - pas d'exclusion des perpendiculaires
                    '3/4': [], // Toutes positions autorisées - pas d'exclusion des perpendiculaires
                    '1/4': [] // Toutes positions autorisées
                },
                // Brique de référence 1/4 (4-5cm)
                '1/4': {
                    'entiere': [], // Toutes positions autorisées - pas d'exclusion des perpendiculaires
                    '3/4': [], // Toutes positions autorisées - pas d'exclusion des perpendiculaires
                    '1/2': [] // Toutes positions autorisées
                }
            };
            
            // Retourner uniquement les exclusions de base selon la compatibilité
            const baseExclusions = exclusionRules[refType]?.[placeType] || [];
            return baseExclusions; // Plus d'exclusion automatique de BB, AA, RR, CC, DD
        };
        
        const excludedPositions = getExcludedPositions(referenceBrickType, brickType);
        // console.log(`🚫 EXCLUSIONS: Référence ${referenceBrickType} → Placement ${brickType}: positions exclues [${excludedPositions.join(', ')}]`);
        
        // SYSTÈME DE NUMÉROTATION ADAPTATIF avec filtrage des positions incompatibles
        const getLetterForPosition = (basePosition, isBoutisse, placementBrickType, referenceBrickType) => {
            // Exclusions spécifiques par identifiant à 3 caractères
            const specificExclusions = ['EHD', 'EHF', 'THD', 'THF', 'HHD', 'HHF', 'HHJ', 'HHH', 'HHI', 'HHG', 'QHD', 'QHF', 'QQJ', 'QQH', 'QQE', 'QQC', 'QQI', 'QQF', 'QQD', 'QQG', 'HQJ', 'HQG', 'HQC', 'HQE', 'HQI', 'HQD', 'HQF', 'HQH', 'TQD', 'TQF', 'TQI', 'TQG', 'TQC', 'TQE', 'TQH', 'TQJ', 'EQD', 'EQF', 'EQC', 'EQE', 'HEU', 'HET', 'HEV', 'HES', 'QES', 'QEU', 'QET', 'QEV', 'HTS', 'HTU', 'HTT', 'HTV', 'QTV', 'QTT', 'QTS', 'QTU', 'HHS', 'HHU', 'HHT', 'HHV', 'QHS', 'QHU', 'QHV', 'QHT', 'HQS', 'HQU', 'HQV', 'HQT', 'QQS', 'QQU', 'QQV', 'QQT']; // Positions spécifiquement exclues
            
            // Vérifier si cette position est exclue (lettres de base)
            if (excludedPositions.includes(basePosition)) {
                return null; // Position exclue - ne pas créer de suggestion
            }
            
            // Déterminer l'orientation basée sur la clé de position elle-même, pas sur l'élément de référence
            // A-J = panneresse, S-V = boutisse
            const orientation = ['S', 'T', 'U', 'V'].includes(basePosition) ? 'boutisse' : 'panneresse';
            
            // Système de numérotation combiné selon la référence ET le placement
            const combinedLetteringSystems = {
                // Brique ENTIÈRE sur référence ENTIÈRE
                'entiere_entiere': {
                    panneresse: { A: 'EEA', B: 'EEB', C: 'EEC', D: 'EED', E: 'EEE', F: 'EEF', G: 'EEG', H: 'EEH', I: 'EEI', J: 'EEJ' },
                    boutisse: { S: 'EES', T: 'EET', U: 'EEU', V: 'EEV' }
                },
                // Brique ENTIÈRE sur référence 3/4
                'entiere_3/4': {
                    panneresse: { A: 'ETA', B: 'ETB', C: 'ETC', D: 'ETD', E: 'ETE', F: 'ETF', G: 'ETG', H: 'ETH', I: 'ETI', J: 'ETJ' },
                    boutisse: { S: 'ETS', T: 'ETT', U: 'ETU', V: 'ETV' }
                },
                // Brique ENTIÈRE sur référence 1/2
                'entiere_1/2': {
                    panneresse: { A: 'EHA', B: 'EHB', C: 'EHC', D: 'EHD', E: 'EHE', F: 'EHF', G: 'EHG', H: 'EHH', I: 'EHI', J: 'EHJ' },
                    boutisse: { S: 'EHS', T: 'EHT', U: 'EHU', V: 'EHV' }
                },
                // Brique ENTIÈRE sur référence 1/4
                'entiere_1/4': {
                    panneresse: { A: 'EQA', B: 'EQB', C: 'EQC', D: 'EQD', E: 'EQE', F: 'EQF', G: 'EQG', H: 'EQH', I: 'EQI', J: 'EQJ' },
                    boutisse: { S: 'EQS', T: 'EQT', U: 'EQU', V: 'EQV' }
                },
                
                // Brique 3/4 sur référence ENTIÈRE  
                '3/4_entiere': {
                    panneresse: { A: 'TEA', B: 'TEB', C: 'TEC', D: 'TED', E: 'TEE', F: 'TEF', G: 'TEG', H: 'TEH', I: 'TEI', J: 'TEJ' },
                    boutisse: { S: 'TES', T: 'TET', U: 'TEU', V: 'TEV' }
                },
                // Brique 3/4 sur référence 3/4
                '3/4_3/4': {
                    panneresse: { A: 'TTA', B: 'TTB', C: 'TTC', D: 'TTD', E: 'TTE', F: 'TTF', G: 'TTG', H: 'TTH', I: 'TTI', J: 'TTJ' },
                    boutisse: { S: 'TTS', T: 'TTT', U: 'TTU', V: 'TTV' }
                },
                // Brique 3/4 sur référence 1/2
                '3/4_1/2': {
                    panneresse: { A: 'THA', B: 'THB', C: 'THC', D: 'THD', E: 'THE', F: 'THF', G: 'THG', H: 'THH', I: 'THI', J: 'THJ' },
                    boutisse: { S: 'THS', T: 'THT', U: 'THU', V: 'THV' }
                },
                // Brique 3/4 sur référence 1/4
                '3/4_1/4': {
                    panneresse: { A: 'TQA', B: 'TQB', C: 'TQC', D: 'TQD', E: 'TQE', F: 'TQF', G: 'TQG', H: 'TQH', I: 'TQI', J: 'TQJ' },
                    boutisse: { S: 'TQS', T: 'TQT', U: 'TQU', V: 'TQV' }
                },
                
                // Brique 1/2 sur référence ENTIÈRE
                '1/2_entiere': {
                    panneresse: { A: 'HEA', B: 'HEB', C: 'HEC', D: 'HED', E: 'HEE', F: 'HEF', G: 'HEG', H: 'HEH', I: 'HEI', J: 'HEJ' },
                    boutisse: { S: 'HES', T: 'HET', U: 'HEU', V: 'HEV' }
                },
                // Brique 1/2 sur référence 3/4
                '1/2_3/4': {
                    panneresse: { A: 'HTA', B: 'HTB', C: 'HTC', D: 'HTD', E: 'HTE', F: 'HTF', G: 'HTG', H: 'HTH', I: 'HTI', J: 'HTJ' },
                    boutisse: { S: 'HTS', T: 'HTT', U: 'HTU', V: 'HTV' }
                },
                // Brique 1/2 sur référence 1/2
                '1/2_1/2': {
                    panneresse: { A: 'HHA', B: 'HHB', C: 'HHC', D: 'HHD', E: 'HHE', F: 'HHF', G: 'HHG', H: 'HHH', I: 'HHI', J: 'HHJ' },
                    boutisse: { S: 'HHS', T: 'HHT', U: 'HHU', V: 'HHV' }
                },
                // Brique 1/2 sur référence 1/4
                '1/2_1/4': {
                    panneresse: { A: 'HQA', B: 'HQB', C: 'HQC', D: 'HQD', E: 'HQE', F: 'HQF', G: 'HQG', H: 'HQH', I: 'HQI', J: 'HQJ' },
                    boutisse: { S: 'HQS', T: 'HQT', U: 'HQU', V: 'HQV' }
                },
                
                // Brique 1/4 sur référence ENTIÈRE
                '1/4_entiere': {
                    panneresse: { A: 'QEA', B: 'QEB', C: 'QEC', D: 'QED', E: 'QEE', F: 'QEF', G: 'QEG', H: 'QEH', I: 'QEI', J: 'QEJ' },
                    boutisse: { S: 'QES', T: 'QET', U: 'QEU', V: 'QEV' }
                },
                // Brique 1/4 sur référence 3/4
                '1/4_3/4': {
                    panneresse: { A: 'QTA', B: 'QTB', C: 'QTC', D: 'QTD', E: 'QTE', F: 'QTF', G: 'QTG', H: 'QTH', I: 'QTI', J: 'QTJ' },
                    boutisse: { S: 'QTS', T: 'QTT', U: 'QTU', V: 'QTV' }
                },
                // Brique 1/4 sur référence 1/2
                '1/4_1/2': {
                    panneresse: { A: 'QHA', B: 'QHB', C: 'QHC', D: 'QHD', E: 'QHE', F: 'QHF', G: 'QHG', H: 'QHH', I: 'QHI', J: 'QHJ' },
                    boutisse: { S: 'QHS', T: 'QHT', U: 'QHU', V: 'QHV' }
                },
                // Brique 1/4 sur référence 1/4
                '1/4_1/4': {
                    panneresse: { A: 'QQA', B: 'QQB', C: 'QQC', D: 'QQD', E: 'QQE', F: 'QQF', G: 'QQG', H: 'QQH', I: 'QQI', J: 'QQJ' },
                    boutisse: { S: 'QQS', T: 'QQT', U: 'QQU', V: 'QQV' }
                },
                
                // Systèmes pour blocs et custom
                'block': {
                    panneresse: { A: '1', B: '2', C: '3', D: '4', E: '5', F: '6', G: '7', H: '8', I: '9', J: '10' },
                    boutisse: { S: '1b', T: '2b', U: '3b', V: '4b' }
                },
                'custom': {
                    panneresse: { A: '?A', B: '?B', C: '?C', D: '?D', E: '?E', F: '?F', G: '?G', H: '?H', I: '?I', J: '?J' },
                    boutisse: { S: '?S', T: '?T', U: '?U', V: '?V' }
                }
            };
            
            // Créer la clé combinée pour le système de lettres
            let systemKey;
            if (placementBrickType === 'block' || placementBrickType === 'custom' || placementBrickType === 'other') {
                systemKey = placementBrickType;
            } else {
                systemKey = `${placementBrickType}_${referenceBrickType}`;
            }
            
            // Log de débogage
            // console.log(`getLetterForPosition: basePosition='${basePosition}', orientation='${orientation}' (calculée selon la position), systemKey='${systemKey}'`);
            
            const system = combinedLetteringSystems[systemKey] || combinedLetteringSystems['custom'];
            
            const proposedLetter = system[orientation] && system[orientation][basePosition];
            
            // Debug pour identifier les cas où le système échoue
            if (!proposedLetter) {
                console.warn(`⚠️ Système de lettres: échec pour systemKey='${systemKey}', orientation='${orientation}', basePosition='${basePosition}'`);
                console.warn(`   - system[orientation] existe:`, !!system[orientation]);
                console.warn(`   - positions disponibles:`, system[orientation] ? Object.keys(system[orientation]) : 'aucune');
                return null; // Ne plus retourner basePosition en fallback - retourner null pour forcer l'exclusion
            }
            
            // Vérifier les exclusions spécifiques par identifiant à 3 caractères
            if (specificExclusions.includes(proposedLetter)) {
                return null; // Position spécifiquement exclue
            }
            
            // Toutes les lettres sont maintenant autorisées - restrictions BB, AA, RR, CC, DD supprimées
            return proposedLetter;
        };
        
        // FONCTION D'AJUSTEMENT SPÉCIFIQUE PAR LETTRE (système complètement indépendant)
        const getPositionAdjustments = (letter) => {
            if (!letter) return { x: 0, z: 0 };
            
            // Ajustements spécifiques par lettre - système à 3 caractères complètement indépendant
            const adjustments = {
                // === SYSTÈME ENTIÈRE SUR ENTIÈRE (EEX) ===
                'EEA': { x: 0, z: 0 }, 'EEB': { x: 0, z: 0 }, 'EEC': { x: 0, z: 0 }, 'EED': { x: 0, z: 0 },
                'EEE': { x: 0, z: 0 }, 'EEF': { x: 0, z: 0 }, 'EEG': { x: 0, z: 0 }, 'EEH': { x: 0, z: 0 },
                'EEI': { x: 0, z: 0 }, 'EEJ': { x: 0, z: 0 }, 'EES': { x: 0, z: 0 }, 'EET': { x: 0, z: 0 },
                'EEU': { x: 0, z: 0 }, 'EEV': { x: 0, z: 0 },
                
                // === SYSTÈME ENTIÈRE SUR 3/4 (ETX) ===
                'ETA': { x: 0, z: 0 }, 'ETB': { x: -5, z: 0 }, 'ETC': { x: -2.5, z: 2.5 }, 'ETD': { x: -5, z: 2.5 },
                'ETE': { x: -2.5, z: -2.5 }, 'ETF': { x: -5, z: -2.5 }, 'ETG': { x: -2.5, z: 2.5 }, 'ETH': { x: -2.5, z: 2.5 },
                'ETI': { x: -2.5, z: -2.5 }, 'ETJ': { x: 7.5, z: -12.5 }, 'ETS': { x: -2.5, z: -5 }, 'ETT': { x: -2.5, z: -5 },
                'ETU': { x: -2.5, z: -2.5 }, 'ETV': { x: -2.5, z: -2.5 },
                
                // === SYSTÈME ENTIÈRE SUR 1/2 (EHX) ===
                'EHA': { x: 0, z: 0 }, 'EHB': { x: -10, z: 0 }, 'EHC': { x: -5, z: 5 }, 'EHD': { x: 0, z: 0 },
                'EHE': { x: -5, z: -5 }, 'EHF': { x: 0, z: 0 }, 'EHG': { x: -5, z: 5 }, 'EHH': { x: -5, z: 5 },
                'EHI': { x: -5, z: -5 }, 'EHJ': { x: -5, z: -5 }, 'EHS': { x: -5, z: 0 }, 'EHT': { x: -5, z: -10 },
                'EHU': { x: -5, z: -15 }, 'EHV': { x: -5, z: -5 },
                
                // === SYSTÈME ENTIÈRE SUR 1/4 (EQX) ===
                'EQA': { x: 0, z: 0 }, 'EQB': { x: -15, z: 0 }, 'EQC': { x: 0, z: 0 }, 'EQD': { x: 0, z: 0 },
                'EQE': { x: 0, z: 0 }, 'EQF': { x: 0, z: 0 }, 'EQG': { x: -7.5, z: -2.5 }, 'EQH': { x: -7.5, z: -2.5 },
                'EQI': { x: -7.5, z: 2.5 }, 'EQJ': { x: -7.5, z: 2.5 }, 'EQS': { x: -7.5, z: -15 }, 'EQT': { x: -7.5, z: -15 },
                'EQU': { x: -7.5, z: -7.5 }, 'EQV': { x: -7.5, z: -7.5 },
                
                // === SYSTÈME 3/4 SUR ENTIÈRE (TEX) ===
                'TEA': { x: 0, z: 0 }, 'TEB': { x: 5, z: 0 }, 'TEC': { x: 0, z: 0 }, 'TED': { x: 0, z: 0 },
                'TEE': { x: 0, z: 1 }, 'TEF': { x: 0, z: 1 }, 'TEG': { x: 0, z: 0 }, 'TEH': { x: 0, z: 0 },
                'TEI': { x: 0, z: 2 }, 'TEJ': { x: 0, z: 2 }, 'TES': { x: 0, z: 5 }, 'TET': { x: 0, z: 5 },
                'TEU': { x: 0, z: 0 }, 'TEV': { x: 0, z: 0 },
                
                // === SYSTÈME 3/4 SUR 3/4 (TTX) ===
                'TTA': { x: 0, z: 0 }, 'TTB': { x: 0, z: 0 }, 'TTC': { x: -2.5, z: 2.5 }, 'TTD': { x: -5, z: 2.5 },
                'TTE': { x: -2.5, z: -1.5 }, 'TTF': { x: -5, z: -1.5 }, 'TTG': { x: -2.5, z: 2 }, 'TTH': { x: -2.5, z: 2.5 },
                'TTI': { x: -2.5, z: -1 }, 'TTJ': { x: -2.5, z: -1 }, 'TTS': { x: 0, z: 0 }, 'TTT': { x: 0, z: 0 },
                'TTU': { x: 0, z: 0 }, 'TTV': { x: 0, z: 0 },
                
                // === SYSTÈME 3/4 SUR 1/2 (THX) ===
                'THA': { x: 0, z: 0 }, 'THB': { x: -5, z: 0 }, 'THC': { x: -4.75, z: 5 }, 'THD': { x: 0, z: 0 },
                'THE': { x: -4.75, z: -4 }, 'THF': { x: 0, z: 0 }, 'THG': { x: -4, z: 1 }, 'THH': { x: -5, z: 0 },
                'THI': { x: -5, z: 2 }, 'THJ': { x: -5, z: 2 }, 'THS': { x: -5, z: -5 }, 'THT': { x: -5, z: -5 },
                'THU': { x: -5, z: -5 }, 'THV': { x: -5, z: -5 },
                
                // === SYSTÈME 3/4 SUR 1/4 (TQX) ===
                'TQA': { x: 0, z: 0 }, 'TQB': { x: -10, z: 0 }, 'TQC': { x: 0, z: 0 }, 'TQD': { x: 0, z: 0 },
                'TQE': { x: 0, z: 0 }, 'TQF': { x: 0, z: 0 }, 'TQG': { x: 0, z: 0 }, 'TQH': { x: 0, z: 0 },
                'TQI': { x: 0, z: 0 }, 'TQJ': { x: 0, z: 0 }, 'TQS': { x: -7.5, z: -10 }, 'TQT': { x: -7.5, z: -10 },
                'TQU': { x: -7.5, z: -7.5 }, 'TQV': { x: -7.5, z: -7.5 },
                
                // === SYSTÈME 1/2 SUR ENTIÈRE (HEX) ===
                'HEA': { x: 0, z: 0 }, 'HEB': { x: 10, z: 0 }, 'HEC': { x: 0, z: 0 }, 'HED': { x: 0, z: 0 },
                'HEE': { x: 0, z: 0 }, 'HEF': { x: 0, z: 0 }, 'HEG': { x: -10, z: -10 }, 'HEH': { x: 10, z: -10 },
                'HEI': { x: -10, z: 12 }, 'HEJ': { x: 10, z: 12 }, 'HES': { x: 0, z: 0 }, 'HET': { x: 0, z: 0 },
                'HEU': { x: 0, z: 0 }, 'HEV': { x: 10, z: 0 },
                
                // === SYSTÈME 1/2 SUR 3/4 (HTX) ===
                'HTA': { x: 0, z: 0 }, 'HTB': { x: 5, z: 0 }, 'HTC': { x: -2.5, z: 2.5 }, 'HTD': { x: -5, z: 2.5 },
                'HTE': { x: -2.5, z: -2.5 }, 'HTF': { x: -5, z: -2.5 }, 'HTG': { x: -12.5, z: -7.5 }, 'HTH': { x: 7.5, z: -7.5 },
                'HTI': { x: -12.5, z: 9.5 }, 'HTJ': { x: 7.5, z: 9.5 }, 'HTS': { x: 0, z: 0 }, 'HTT': { x: 0, z: 0 },
                'HTU': { x: 0, z: 0 }, 'HTV': { x: 0, z: 0 },
                
                // === SYSTÈME 1/2 SUR 1/2 (HHX) ===
                'HHA': { x: 0, z: 0 }, 'HHB': { x: 0, z: 0 }, 'HHC': { x: -5, z: 5 }, 'HHD': { x: 0, z: 0 },
                'HHE': { x: -5, z: -5 }, 'HHF': { x: 0, z: 0 }, 'HHG': { x: 0, z: 0 }, 'HHH': { x: 0, z: 0 },
                'HHI': { x: 0, z: 0 }, 'HHJ': { x: 0, z: 0 }, 'HHS': { x: 0, z: 0 }, 'HHT': { x: 0, z: 0 },
                'HHU': { x: 0, z: 0 }, 'HHV': { x: 0, z: 0 },
                
                // === SYSTÈME 1/2 SUR 1/4 (HQX) ===
                'HQA': { x: 0, z: 0 }, 'HQB': { x: -5, z: 0 }, 'HQC': { x: 0, z: 0 }, 'HQD': { x: 0, z: 0 },
                'HQE': { x: 0, z: 0 }, 'HQF': { x: 0, z: 0 }, 'HQG': { x: 0, z: 0 }, 'HQH': { x: 0, z: 0 },
                'HQI': { x: 0, z: 0 }, 'HQJ': { x: 0, z: 0 }, 'HQS': { x: 0, z: 0 }, 'HQT': { x: 0, z: 0 },
                'HQU': { x: 0, z: 0 }, 'HQV': { x: 0, z: 0 },
                
                // === SYSTÈME 1/4 SUR ENTIÈRE (QEX) ===
                'QEA': { x: 0, z: 0 }, 'QEB': { x: 15, z: 0 }, 'QEC': { x: 0, z: 0 }, 'QED': { x: 0, z: 0 },
                'QEE': { x: 0, z: -3 }, 'QEF': { x: 0, z: -3 }, 'QEG': { x: 0, z: 0 }, 'QEH': { x: 0, z: 0 },
                'QEI': { x: 0, z: 0 }, 'QEJ': { x: 0, z: 0 }, 'QES': { x: 0, z: 0 }, 'QET': { x: 0, z: 0 },
                'QEU': { x: 0, z: 0 }, 'QEV': { x: 0, z: 0 },
                
                // === SYSTÈME 1/4 SUR 3/4 (QTX) ===
                'QTA': { x: 0, z: 0 }, 'QTB': { x: 10, z: 0 }, 'QTC': { x: -2.5, z: 2.5 }, 'QTD': { x: -5, z: 2.5 },
                'QTE': { x: -2.5, z: -5.5 }, 'QTF': { x: -5, z: -5.5 }, 'QTG': { x: -2.5, z: 2.5 }, 'QTH': { x: -2.5, z: 2.5 },
                'QTI': { x: -2.5, z: -2.5 }, 'QTJ': { x: -2.5, z: -2.5 }, 'QTS': { x: 0, z: 0 }, 'QTT': { x: 0, z: 0 },
                'QTU': { x: 0, z: 2.5 }, 'QTV': { x: 0, z: 0 },
                
                // === SYSTÈME 1/4 SUR 1/2 (QHX) ===
                'QHA': { x: 0, z: 0 }, 'QHB': { x: 5, z: 0 }, 'QHC': { x: -4.75, z: 5 }, 'QHD': { x: 0, z: 0 },
                'QHE': { x: -4.75, z: -8 }, 'QHF': { x: 0, z: 0 }, 'QHG': { x: -5, z: 5 }, 'QHH': { x: -5, z: 5 },
                'QHI': { x: -5, z: -5 }, 'QHJ': { x: -5, z: -5 }, 'QHS': { x: 0, z: 0 }, 'QHT': { x: 0, z: 0 },
                'QHU': { x: 0, z: 0 }, 'QHV': { x: 0, z: 0 },
                
                // === SYSTÈME 1/4 SUR 1/4 (QQX) ===
                'QQA': { x: 0, z: 0 }, 'QQB': { x: 0, z: 0 }, 'QQC': { x: 0, z: 0 }, 'QQD': { x: 0, z: 0 },
                'QQE': { x: 0, z: 0 }, 'QQF': { x: 0, z: 0 }, 'QQG': { x: 0, z: 0 }, 'QQH': { x: 0, z: 0 },
                'QQI': { x: 0, z: 0 }, 'QQJ': { x: 0, z: 0 }, 'QQS': { x: 0, z: 0 }, 'QQT': { x: 0, z: 0 },
                'QQU': { x: 0, z: 0 }, 'QQV': { x: 0, z: 0 },
                
                // === POSITIONS RÉTROCOMPATIBILITÉ (ancien système - désactivées pour indépendance) ===
            };
            
            return adjustments[letter] || { x: 0, z: 0 };
        };
        
        // Créer les positions de base avec filtrage des incompatibilités
        const basePositions = [
            // À droite (continuation) - avec joint vertical - BLANC
            { x: dims.length + jointVertical, z: 0, rotation: rotation, color: 0xFFFFFF, type: 'continuation', key: 'A' },
            // À gauche - avec joint vertical - BLANC (B position de base: -20cm)
            { x: -(dims.length + jointVertical), z: 0, rotation: rotation, color: 0xFFFFFF, type: 'continuation', key: 'B' },
            
            // 4 briques perpendiculaires - 2 côté panneresse frontale, 2 côté panneresse dorsale
            // Côté panneresse frontale (Z+) - 2 briques perpendiculaires
            { x: dims.length - perpOffsetX, z: dims.width/2 + dims.length/2 - perpAdjustment + jointVertical, rotation: rotation + Math.PI/2, color: 0xFFFFFF, type: 'perpendiculaire-frontale-droite', key: 'C' },
            { x: -dims.length + perpOffsetReverse, z: dims.width/2 + dims.length/2 - perpAdjustment + jointVertical, rotation: rotation + Math.PI/2, color: 0xFFFFFF, type: 'perpendiculaire-frontale-gauche', key: 'D' },
            
            // Côté panneresse dorsale (Z-) - 2 briques perpendiculaires avec ajustements spécifiques
            { x: dims.length - perpOffsetX, z: -(dims.width/2 + dims.length/2) - dims.width - Math.max(5, dims.width * 0.56) - jointVertical + positionOffsets.E, rotation: rotation + Math.PI/2, color: 0xFFFFFF, type: 'perpendiculaire-dorsale-droite', key: 'E' },
            { x: -dims.length + perpOffsetReverse, z: -(dims.width/2 + dims.length/2) - dims.width - Math.max(5, dims.width * 0.56) - jointVertical + positionOffsets.F, rotation: rotation + Math.PI/2, color: 0xFFFFFF, type: 'perpendiculaire-dorsale-gauche', key: 'F' }
        ];
        
        // LOGIQUE SPÉCIFIQUE POUR LES BLOCS: ne traiter que les positions boutisse (pas de panneresse A-F)
        let positionsToProcess = basePositions;
        if (this.currentMode === 'block') {
            console.log('🧱 MODE BLOC: Suppression des positions panneresse A-F (seules les boutisses seront proposées)');
            positionsToProcess = []; // Vider d'abord
            // Ajouter quand même des continuités longitudinales (A / B) pour permettre l'allongement + multi-insertion
            const jointForBlock = jointVertical; // déjà calculé via getJointVerticalThickness
            // Détection correcte du bloc courant (identifiant comme 'B14_HALF')
            const activeBlockType = window.BlockSelector && window.BlockSelector.getCurrentBlock ? window.BlockSelector.getCurrentBlock() : null;
            const isHalfBlock = activeBlockType && /_HALF$/.test(activeBlockType);
            let leftContinuationX = -(dims.length + jointForBlock);
            if (isHalfBlock) {
                // Récupérer la longueur du bloc plein (base) pour calculer le décalage exact.
                const blockData = window.BlockSelector && window.BlockSelector.getCurrentBlockData ? window.BlockSelector.getCurrentBlockData() : null;
                let fullLength = null;
                if (blockData && blockData.baseBlock && window.BlockSelector.getBlockData) {
                    const allBlocks = window.BlockSelector.getBlockData();
                    const base = allBlocks[blockData.baseBlock];
                    if (base && base.length) fullLength = base.length;
                }
                // Si on a la longueur du bloc plein (> demi), corriger précisément: position gauche = -(half + joint) + (full - half)
                // car l'ancien calcul utilisait -(full + joint) donnant un surplus de (full - half)
                if (fullLength && fullLength > dims.length) {
                    const delta = fullLength - dims.length; // ex: 39 - 19 = 20
                    leftContinuationX += delta; // rapproche de delta cm
                } else {
                    // Fallback conservatif: ajouter 20cm (cas observé)
                    leftContinuationX += 20;
                }
            }
            positionsToProcess.push(
                { x: dims.length + jointForBlock, z: 0, rotation: rotation, color: 0xFFFFFF, type: 'continuation', key: 'A' },
                { x: leftContinuationX, z: 0, rotation: rotation, color: 0xFFFFFF, type: 'continuation', key: 'B' }
            );
        }
        
        // LOGIQUE SPÉCIFIQUE POUR LES ISOLANTS: ne proposer que les positions de continuité A et B
        if (this.currentMode === 'insulation') {
            console.log('🧱 MODE ISOLANT: Filtrage des positions - seules les continuités A et B seront proposées');
            positionsToProcess = basePositions.filter(pos => 
                pos.type === 'continuation' && (pos.key === 'A' || pos.key === 'B')
            );
        }
        
        // Filtrer les positions selon les règles de compatibilité et ajouter les lettres avec ajustements indépendants
        let localPositions = positionsToProcess
            .map(pos => {
                const letter = getLetterForPosition(pos.key, isBoutisse, brickType, referenceBrickType);
                if (letter === null) return null; // Position exclue
                
                // Appliquer les ajustements spécifiques à chaque lettre de manière indépendante
                const adjustments = getPositionAdjustments(letter);
                return { 
                    ...pos, 
                    letter,
                    x: pos.x + adjustments.x, // Ajustement X spécifique à cette lettre
                    z: pos.z + adjustments.z  // Ajustement Z spécifique à cette lettre
                };
            })
            .filter(pos => pos !== null); // Éliminer les positions exclues

        // MODE BLOCK: forcer exactement 2 suggestions (A et B) sans doublon
        if (this.currentMode === 'block') {
            const keepKeys = new Set(['A','B']);
            const seen = new Set();
            localPositions = localPositions.filter(pos => {
                if (!keepKeys.has(pos.key)) return false;
                if (seen.has(pos.key)) return false;
                seen.add(pos.key);
                return true;
            });
        }
        
        // SUGGESTIONS D'ANGLE DE MUR POUR TOUTES LES BRIQUES
        // Ajouter des suggestions d'angle pour créer des angles à 90° (technique de maçonnerie)
        
        // Pour les briques normales (panneresse), proposer des briques d'angle perpendiculaires
        // MAIS PAS POUR LES BLOCS (ils n'ont que les boutisses S et T)
        // ET PAS POUR LES ISOLANTS (seulement continuité A et B)
        if (!isBoutisse && this.currentMode !== 'block' && this.currentMode !== 'insulation') {
            // Calcul des décalages adaptatifs aux dimensions actuelles
            const offsetX = 5; // Décalage sur X
            const offsetZ1 = Math.max(4, dims.width * 0.44); // Minimum 4cm ou 44% de la largeur
            const offsetZ2 = Math.max(19, dims.length * 1.0); // Minimum 19cm ou 100% de la longueur
            const offsetZ3 = Math.max(1, dims.height * 0.15); // Minimum 1cm ou 15% de la hauteur
            
            // Suggestions d'angle aux extrémités des panneresses avec filtrage
            const baseAnglePositions = [
                // Angle à droite de la panneresse (perpendiculaire pour former un angle)
                { 
                    x: dims.length/2 + dims.width/2 + jointVertical + offsetX,
                    z: dims.width/2 + dims.length/2 + jointVertical - offsetZ1 - offsetZ2 - offsetZ3,
                    rotation: rotation + Math.PI/2, 
                    color: 0xFFFFFF,
                    type: 'angle-panneresse-droite',
                    isAngle: true,
                    key: 'G'
                },
                // Angle à gauche de la panneresse (perpendiculaire pour former un angle)
                { 
                    x: -(dims.length/2 + dims.width/2 + jointVertical) + offsetX,
                    z: dims.width/2 + dims.length/2 + jointVertical - offsetZ1 - offsetZ2 - offsetZ3,
                    rotation: rotation + Math.PI/2, 
                    color: 0xFFFFFF,
                    type: 'angle-panneresse-gauche',
                    isAngle: true,
                    key: 'H'
                },
                // Angle à droite arrière de la panneresse - position de base sans ajustement initial
                { 
                    x: dims.length/2 + dims.width/2 + jointVertical + offsetX,
                    z: -(dims.width/2 + dims.length/2 + jointVertical) - offsetZ1 + positionOffsets.I,
                    rotation: rotation + Math.PI/2, 
                    color: 0xFFFFFF,
                    type: 'angle-panneresse-droite-arriere',
                    isAngle: true,
                    key: 'I'
                },
                // Angle à gauche arrière de la panneresse - position de base sans ajustement initial
                { 
                    x: -(dims.length/2 + dims.width/2 + jointVertical) + offsetX,
                    z: -(dims.width/2 + dims.length/2 + jointVertical) - offsetZ1 + positionOffsets.J,
                    rotation: rotation + Math.PI/2, 
                    color: 0xFFFFFF,
                    type: 'angle-panneresse-gauche-arriere',
                    isAngle: true,
                    key: 'J'
                }
            ];
            
            // Filtrer les angles selon les règles de compatibilité avec ajustements indépendants
            const anglePositions = baseAnglePositions
                .map(pos => {
                    const letter = getLetterForPosition(pos.key, isBoutisse, brickType, referenceBrickType);
                    if (letter === null) return null; // Position exclue
                    
                    // Appliquer les ajustements spécifiques à chaque lettre de manière indépendante
                    const adjustments = getPositionAdjustments(letter);
                    return { 
                        ...pos, 
                        letter,
                        x: pos.x + adjustments.x, // Ajustement X spécifique à cette lettre
                        z: pos.z + adjustments.z  // Ajustement Z spécifique à cette lettre
                    };
                })
                .filter(pos => pos !== null); // Éliminer les positions exclues
            
            // Ajouter les suggestions d'angle à la liste
            localPositions.push(...anglePositions);
            // Filtrage final spécifique mode block: supprimer S/T (ou toute clé autre que A/B)
            if (this.currentMode === 'block') {
                const seen = new Set();
                localPositions = localPositions.filter(p => {
                    if (p.key !== 'A' && p.key !== 'B') return false;
                    if (seen.has(p.key)) return false; // éviter doublon même clé
                    seen.add(p.key);
                    return true;
                });
            }
        }
        
        // SUGGESTIONS D'ANGLE POUR LES BOUTISSES
        // Si la brique est une boutisse, ajouter des suggestions pour créer des angles
        // OU si on est en mode bloc (forcer l'affichage des positions S et T pour les blocs)
        // MAIS PAS POUR LES ISOLANTS (seulement continuité A et B)
    // Angles uniquement pour les briques boutisse (pas pour les blocs) afin d'éviter doublons A/S et B/T
    if (isBoutisse && this.currentMode !== 'insulation' && this.currentMode !== 'block') {
            // Calcul des décalages adaptatifs aux dimensions actuelles
            const offsetX = 5; // Décalage sur X
            const offsetZ = Math.max(4, dims.height * 0.62); // Minimum 4cm ou 62% de la hauteur
            
            // Suggestions pour angle de mur aux extrémités des boutisses
            // Ces briques seront perpendiculaires à la boutisse pour former un angle à 90°
            
            // Calcul du recul spécial pour S et T selon la compatibilité
            let stRecul = 0;
            if (referenceBrickType === 'entiere' && brickType === '3/4') {
                stRecul = 0; // Pas de recul spécial - remis à 0
            }
            
            const baseAnglePositions = {
                'S': { 
                    x: dims.width/2 + dims.length/2 + jointVertical + offsetX,
                    z: -9 - dims.length + dims.width - stRecul, // Recul supplémentaire + longueur brique - avance d'une largeur de brique + recul spécial (S avance)
                    rotation: rotation + Math.PI/2, 
                    color: 0xFFFFFF, // BLANC - Angle boutisse droite
                    type: 'angle-boutisse-droite',
                    isAngle: true
                },
                'T': { 
                    x: -(dims.width/2 + dims.length/2 + jointVertical) + offsetX,
                    z: -9 - dims.length + dims.width - stRecul, // Recul supplémentaire + longueur brique - avance d'une largeur de brique + recul spécial (T avance)
                    rotation: rotation + Math.PI/2, 
                    color: 0xFFFFFF, // BLANC - Angle boutisse gauche
                    type: 'angle-boutisse-gauche',
                    isAngle: true
                },
                'U': { 
                    x: dims.width/2 + dims.length/2 + jointVertical + offsetX,
                    z: dims.width/2 + dims.length/2 + jointVertical + offsetZ - dims.length - dims.width, // Recul d'une largeur de brique supplémentaire (U recule)
                    rotation: rotation + Math.PI/2, 
                    color: 0xFFFFFF, // BLANC - Angle boutisse droite avant
                    type: 'angle-boutisse-droite-avant',
                    isAngle: true
                },
                'V': { 
                    x: -(dims.width/2 + dims.length/2 + jointVertical) + offsetX, // Position de base sans ajustement initial
                    z: dims.width/2 + dims.length/2 + jointVertical + offsetZ - dims.length - dims.width, // Recul d'une largeur de brique supplémentaire (V recule)
                    rotation: rotation + Math.PI/2, 
                    color: 0xFFFFFF, // BLANC - Angle boutisse gauche avant
                    type: 'angle-boutisse-gauche-avant',
                    isAngle: true
                }
            };
            
            let positionsToProcess = baseAnglePositions; // uniquement base S/T/U/V pour briques boutisse
            
            // Filtrer et créer les suggestions d'angle avec ajustements indépendants par lettre
            const anglePositions = [];
            for (const [key, position] of Object.entries(positionsToProcess)) {
                const letter = getLetterForPosition(key, isBoutisse, brickType, referenceBrickType);
                // console.log(`🔧 DEBUG Position ${letter}: x=${position.x.toFixed(2)}, z=${position.z.toFixed(2)}`);
                if (letter) {
                    // Appliquer les ajustements spécifiques à chaque lettre de manière indépendante
                    const adjustments = getPositionAdjustments(letter);
                    anglePositions.push({
                        ...position,
                        letter: letter,
                        x: position.x + adjustments.x, // Ajustement X spécifique à cette lettre
                        z: position.z + adjustments.z  // Ajustement Z spécifique à cette lettre
                    });
                }
            }
            
            // Ajouter les suggestions d'angle à la liste
            localPositions.push(...anglePositions);
        }
        
        // Convertir en positions mondiales et créer les fantômes
        localPositions.forEach((localPos, index) => {
            // SYSTÈME INDÉPENDANT : Chaque lettre a ses coordonnées fixes sans ajustements conditionnels
            // Toutes les positions spécifiques sont déjà intégrées dans les définitions de base
            const adjustedX = localPos.x;
            const adjustedZ = localPos.z;
            
            // Rotation vers coordonnées mondiales
            const worldX = basePos.x + (adjustedX * cos - adjustedZ * sin);
            const worldZ = basePos.z + (adjustedX * sin + adjustedZ * cos);
            const worldY = basePos.y + (localPos.y || 0);
            
            // TEMPORAIRE: Désactivation complète de la vérification de collision pour debug
            if (true) { // Toujours créer les suggestions
                const suggestion = this.createSuggestionGhost(
                    worldX, worldY, worldZ, 
                    localPos.rotation,
                    localPos.color,
                    index,
                    localPos.letter,
                    localPos.type // Passer le type de suggestion
                );
                if (suggestion) {
                    suggestions.push(suggestion);
                }
            }
        });
        
        this.suggestionGhosts = suggestions;
        // // console.log(`🎯 ${suggestions.length} suggestions de placement créées pour ${hoveredElement.type}:`, hoveredElement.id);
    }
    
    // Créer un fantôme de suggestion
    createSuggestionGhost(x, y, z, rotation, color, index, letter = null, suggestionType = null) {
        // CORRECTION: Utiliser les dimensions de l'élément actif en mode suggestions
        let length, width, height;
        
        // Si on est en mode suggestions et qu'on a un élément actif, utiliser ses dimensions
        if (this.activeBrickForSuggestions) {
            const activeElement = this.activeBrickForSuggestions;
            length = activeElement.dimensions.length;
            width = activeElement.dimensions.width;
            height = activeElement.dimensions.height;
        } else if (this.currentMode === 'brick' && window.BrickSelector) {
            // Pour les briques, utiliser BrickSelector
            const currentBrick = window.BrickSelector.getCurrentBrick();
            length = currentBrick.length;
            width = currentBrick.width;
            height = currentBrick.height;
        } else if (this.currentMode === 'beam' && window.BeamProfiles) {
            const p = window.BeamProfiles.getProfile ? window.BeamProfiles.getProfile(this.currentBeamType || 'IPE80') : null;
            length = this.currentBeamLengthCm || parseInt(document.getElementById('elementLength').value) || 100;
            if (p) {
                width = Math.round((p.b / 10));
                height = Math.round((p.h / 10));
            } else {
                width = parseInt(document.getElementById('elementWidth').value);
                height = parseInt(document.getElementById('elementHeight').value);
            }
        } else {
            // Pour les blocs et isolants, ou si BrickSelector n'est pas disponible, utiliser les champs HTML
            length = parseInt(document.getElementById('elementLength').value);
            width = parseInt(document.getElementById('elementWidth').value);
            height = parseInt(document.getElementById('elementHeight').value);
        }
        
        const ghost = new WallElement({
            type: this.currentMode,
            material: this.getAutoMaterial(),
            x: x,
            y: y,
            z: z,
            length: length,
            width: width,
            height: height,
            rotation: rotation,
            ...(this.currentMode === 'beam' ? {
                beamType: this.currentBeamType || 'IPE80',
                beamLengthCm: length
            } : {})
        });
        
        // Style visuel de suggestion
        ghost.mesh.material = ghost.mesh.material.clone();
        ghost.mesh.material.transparent = true;
        ghost.mesh.material.opacity = 0.5;
        ghost.mesh.material.color.setHex(color);
        ghost.mesh.material.emissive.setHex(color);
        ghost.mesh.material.emissiveIntensity = 0.3;
        
        // Apparence spéciale pour les suggestions d'angle
        if (color === 0xff0000 || color === 0x00ff00 || color === 0x0000ff || color === 0xffff00 || color === 0xff00ff || color === 0x00ffff) { // Couleurs d'angle
            ghost.mesh.material.opacity = 0.7;
            ghost.mesh.material.emissiveIntensity = 0.5;
            // Ajouter un effet de clignotement pour les angles
            this.addBlinkEffect(ghost.mesh);
        }
        
        // Ajouter identifiant pour le clic
        ghost.mesh.userData.suggestionIndex = index;
        ghost.mesh.userData.isSuggestion = true;
        ghost.mesh.userData.suggestionType = suggestionType; // Stocker le type de suggestion
        ghost.mesh.userData.letter = letter; // NOUVEAU: Stocker la lettre pour détection position C
        ghost.mesh.userData.isAngleSuggestion = (color === 0xff0000 || color === 0x00ff00 || color === 0x0000ff || color === 0xffff00 || color === 0xff00ff || color === 0x00ffff);
        
        // Animation d'apparition
        ghost.mesh.scale.setScalar(0.1);
        ghost.mesh.material.opacity = 0;
        
        // Ajouter une lettre sur la face supérieure si fournie
        if (letter && window.SceneManager && window.SceneManager.scene) {
            // Créer le texte 3D avec une résolution plus élevée
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256; // Résolution doublée pour plus de netteté
            canvas.height = 256; // Résolution doublée pour plus de netteté
            
            // Style du texte avec une taille proportionnellement adaptée
            context.fillStyle = '#000000'; // Noir sur fond transparent
            context.font = 'Bold 140px Arial'; // Taille adaptée à la nouvelle résolution
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            
            // Pas de fond - garder transparent
            // context.fillStyle = '#FFFFFF';
            // context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Texte noir
            context.fillStyle = '#000000';
            context.fillText(letter, canvas.width / 2, canvas.height / 2);
            
            // Créer la texture
            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            
            // Créer le matériau pour le texte
            const textMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 0.9
            });
            
            // Créer un plan pour le texte sur la face supérieure avec une taille légèrement réduite
            const textGeometry = new THREE.PlaneGeometry(length * 0.35, width * 0.35); // Réduction de 0.4 à 0.35
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            
            // Désactiver l'interaction avec le texte pour permettre de cliquer sur la brique en dessous
            textMesh.raycast = function() {}; // Empêche le raycasting sur ce mesh
            textMesh.userData.ignoreRaycast = true; // Marqueur supplémentaire
            
            // Positionner le texte selon la lettre avec décalages spécifiques
            let xOffset = 0;
            let zOffset = 0;
            
            // Vérifier l'orientation de la brique pour déterminer le positionnement
            const normalizedRotation = ((rotation % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
            const isBoutisse = (normalizedRotation > Math.PI / 4 && normalizedRotation < 3 * Math.PI / 4) ||
                              (normalizedRotation > 5 * Math.PI / 4 && normalizedRotation < 7 * Math.PI / 4);
            
            // Appliquer les décalages seulement pour les briques normales (panneresse)
            if (!isBoutisse) {
                // Pour les briques normales : utiliser le système à 3 lettres avec positions A-J
                if (letter && letter.length === 3) {
                    // Analyser la 3ème lettre (position) pour le système à 3 lettres
                    const position = letter.charAt(2);
                    
                    // Positions H, G doivent être 5cm en arrière sur l'axe X (4cm + 1cm supplémentaire)
                    if (position === 'H' || position === 'G') {
                        xOffset = -5; // 5cm vers l'arrière sur l'axe X
                    }
                    // Positions D, C, B doivent être 4cm en arrière sur l'axe X
                    else if (position === 'D' || position === 'C' || position === 'B') {
                        xOffset = -4; // 4cm vers l'arrière sur l'axe X
                    }
                    // Positions J, F, E, I doivent être 4cm en avant sur l'axe X
                    else if (position === 'J' || position === 'F' || position === 'E' || position === 'I') {
                        xOffset = 4; // 4cm vers l'avant sur l'axe X
                    }
                    // Position A doit être 4cm en avant sur l'axe X
                    else if (position === 'A') {
                        xOffset = 4; // 4cm vers l'avant sur l'axe X
                    }
                } else {
                    // Fallback pour l'ancien système (lettres simples) si présent - Obsolète normalement
                    if (letter === 'H' || letter === 'G') {
                        xOffset = -5; // 5cm vers l'arrière sur l'axe X
                    }
                    else if (letter === 'D' || letter === 'C' || letter === 'B') {
                        xOffset = -4; // 4cm vers l'arrière sur l'axe X
                    }
                    else if (letter === 'J' || letter === 'F' || letter === 'E' || letter === 'I') {
                        xOffset = 4; // 4cm vers l'avant sur l'axe X
                    }
                    else if (letter === 'A') {
                        xOffset = 4; // 4cm vers l'avant sur l'axe X
                    }
                }
            } else {
                // Pour les briques en boutisse (90°) : décalages spécifiques pour le système à 3 lettres
                // Vérifier si c'est un système à 3 lettres (XXX format)
                if (letter && letter.length === 3) {
                    // Analyser la 3ème lettre (position) pour le système à 3 lettres
                    const position = letter.charAt(2);
                    
                    // Position S (boutisse droite)
                    if (position === 'S') {
                        xOffset = -4; // 4cm vers l'arrière sur l'axe X
                    }
                    // Position T (boutisse gauche)  
                    else if (position === 'T') {
                        xOffset = 4; // 4cm vers l'avant sur l'axe X
                    }
                    // Positions U et V (boutisse avant/arrière)
                    else if (position === 'U' || position === 'V') {
                        zOffset = 4.5; // 4.5cm vers l'avant sur l'axe Z (demi-boutisse)
                    }
                } else {
                    // Fallback pour l'ancien système (lettres simples) si présent
                    if (letter === 'M') {
                        xOffset = -4; // 4cm vers l'arrière sur l'axe X
                    }
                    else if (letter === 'N') {
                        xOffset = 4; // 4cm vers l'avant sur l'axe X
                    }
                    else if (letter === 'S' || letter === 'T') {
                        zOffset = 4.5; // 4.5cm vers l'avant sur l'axe Z (demi-boutisse)
                    }
                }
            }
            
            textMesh.position.set(xOffset, height / 2 + 1.5, zOffset); // Position avec décalages X et Z
            textMesh.rotation.x = -Math.PI / 2; // Rotation pour être horizontal
            
            // Ajouter le texte au groupe de la brique SEULEMENT si l'affichage des lettres est activé
            if (window.showAdjacentProposalLetters) {
                ghost.mesh.add(textMesh);
                // Stocker la référence du texte pour le nettoyage
                ghost.mesh.userData.textMesh = textMesh;
            } else {
                // Si les lettres sont désactivées, stocker quand même la référence pour pouvoir les afficher plus tard
                ghost.mesh.userData.textMesh = textMesh;
                textMesh.visible = false; // Masquer le texte
                ghost.mesh.add(textMesh); // L'ajouter quand même mais masqué
            }
        }
        
        // Animer l'apparition avec un délai progressif
        const delay = index * 100; // 100ms entre chaque suggestion
        setTimeout(() => {
            this.animateGhostAppearance(ghost.mesh);
        }, delay);
        
        window.SceneManager.scene.add(ghost.mesh);
        return ghost;
    }
    
    // Animation d'apparition douce pour les suggestions
    animateGhostAppearance(mesh) {
        if (!mesh || !mesh.material) return;
        
        const startTime = Date.now();
        const duration = 300; // 300ms d'animation
        const targetOpacity = 0.5;
        const targetScale = 1.0;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Fonction d'easing pour une animation plus douce
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            mesh.scale.setScalar(0.1 + (targetScale - 0.1) * easeOut);
            mesh.material.opacity = targetOpacity * easeOut;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    // NOUVEAU: Fonction globale pour basculer l'affichage des lettres de proposition adjacente
    toggleAdjacentProposalLetters() {
        // Désactiver totalement en mode diba
        if (this.currentMode === 'diba') {
            if (window.showAdjacentProposalLetters) {
                window.showAdjacentProposalLetters = false;
            }
            console.log('🔤 Lettres adjacentes ignorées (mode diba)');
            return false;
        }
        window.showAdjacentProposalLetters = !window.showAdjacentProposalLetters;
        console.log(`🔤 Lettres de proposition adjacente: ${window.showAdjacentProposalLetters ? 'ACTIVÉES' : 'DÉSACTIVÉES'}`);
        
        // Parcourir tous les éléments fantômes existants et mettre à jour la visibilité des lettres
        if (this.ghostElements && Array.isArray(this.ghostElements)) {
            this.ghostElements.forEach(ghost => {
                if (ghost && ghost.mesh && ghost.mesh.userData && ghost.mesh.userData.textMesh) {
                    ghost.mesh.userData.textMesh.visible = window.showAdjacentProposalLetters;
                }
            });
        }
        
        return window.showAdjacentProposalLetters;
    }
    
    // Ajouter un effet de clignotement pour les suggestions d'angle
    addBlinkEffect(mesh) {
        if (!mesh || !mesh.material) return;
        
        const originalIntensity = mesh.material.emissiveIntensity;
        const maxIntensity = 0.8;
        let increasing = true;
        
        const blink = () => {
            if (!mesh || !mesh.material) return; // Vérifier si le mesh existe encore
            
            if (increasing) {
                mesh.material.emissiveIntensity += 0.02;
                if (mesh.material.emissiveIntensity >= maxIntensity) {
                    increasing = false;
                }
            } else {
                mesh.material.emissiveIntensity -= 0.02;
                if (mesh.material.emissiveIntensity <= originalIntensity) {
                    increasing = true;
                }
            }
            
            // Continuer le clignotement si le mesh est toujours dans la scène
            if (mesh.parent) {
                requestAnimationFrame(blink);
            }
        };
        
        blink();
    }
    
    // Vérifier si une position est occupée
    isPositionOccupied(x, y, z, tolerance = 2) {
        // DÉSACTIVATION TEMPORAIRE - Permettre un placement libre
        return false;
        
        // Utiliser une tolérance plus large pour les suggestions
        for (const element of window.SceneManager.elements.values()) {
            const distance = Math.sqrt(
                Math.pow(element.position.x - x, 2) + 
                Math.pow(element.position.y - y, 2) + 
                Math.pow(element.position.z - z, 2)
            );
            if (distance < tolerance) {
                return true;
            }
        }
        return false;
    }
    
    // Nettoyer les suggestions
    clearSuggestions() {
        this.suggestionGhosts.forEach(ghost => {
            if (ghost && ghost.mesh) {
                window.SceneManager.scene.remove(ghost.mesh);
                ghost.dispose();
            }
        });
        this.suggestionGhosts = [];
        this.activeBrickForSuggestions = null;
        
        // Désactiver le mode sélection visuel
        document.body.classList.remove('selection-mode');
        
        // Supprimer l'icône de suppression
        this.hideDeleteIcon();
        
        // Restaurer la visibilité du fantôme principal si activé et si on n'est plus en mode suggestions
        if (this.showGhost && this.ghostElement && !this.activeBrickForSuggestions) {
            this.ghostElement.mesh.visible = true;
        }
        
        // Émettre un événement pour l'UI
        document.dispatchEvent(new CustomEvent('suggestionsDeactivated'));
    }

    // Activer les suggestions pour une brique spécifique
    activateSuggestionsForBrick(element, isUserClick = true) {
        // // console.log(`🔍 DEBUG activateSuggestionsForBrick: element=${element?.id}, showSuggestions=${this.showSuggestions}, isUserClick=${isUserClick}`);
        
        if (!this.showSuggestions || !element) {
            // // console.log(`🔍 DEBUG: Sortie anticipée - showSuggestions=${this.showSuggestions}, element=${!!element}`);
            return;
        }
        
        // 🔒 NOUVEAU: Si les suggestions sont bloquées par l'interface et que ce n'est pas un clic utilisateur, ne pas réactiver
        if (this.suggestionsDisabledByInterface && !isUserClick) {
            console.log('🔒 BLOCAGE INTERFACE: Suggestions bloquées - réactivation nécessite un clic utilisateur');
            return;
        }
        
        // Protection contre l'activation multiple sur le même élément
        if (this.activeBrickForSuggestions && this.activeBrickForSuggestions.id === element.id) {
            console.log('🎯 Suggestions déjà actives pour cette brique');
            return;
        }
        
        // Note: La vérification des assises est déjà faite dans scene-manager.js
        // avant d'appeler cette méthode, pas besoin de double vérification
        
        // // console.log(`🔍 DEBUG: Activation des suggestions pour ${element.id}`);
        
        // Nettoyer les suggestions précédentes
        this.clearSuggestions();
        
        // Réinitialiser le blocage interface SEULEMENT si c'est un clic utilisateur
        if (isUserClick) {
            this.suggestionsDisabledByInterface = false;
        }
        
        // Marquer cette brique comme active pour suggestions
        this.activeBrickForSuggestions = element;
        
        // Masquer FORCEMENT le fantôme principal pendant le mode sélection
        if (this.ghostElement) {
            this.ghostElement.mesh.visible = false;
        }
        
        // Ajouter un effet de pulsation à la brique sélectionnée
        this.addPulseEffect(element);
        
        // Créer les suggestions
        if (this.currentMode !== 'diba') {
            this.createPlacementSuggestions(element);
        }
        
        // NE PAS créer automatiquement les joints pour les briques
        // Les joints seront créés uniquement avec Ctrl+clic via activateJointMode()
        // console.log('🔧 Suggestions de placement créées pour l\'élément:', element.type, element.id);
        
        // Activer le mode sélection visuel
        document.body.classList.add('selection-mode');
        
        // Jouer le son d'activation des suggestions
        // Son supprimé
        
        // Émettre un événement pour l'UI
        document.dispatchEvent(new CustomEvent('suggestionsActivated', {
            detail: { element }
        }));
        
        // Afficher l'icône de suppression près de la brique
        this.showDeleteIcon(element);
        
        // console.log('Suggestions activées pour la brique:', element.id);
    }
    
    // Ajouter un effet de pulsation à un élément
    addPulseEffect(element) {
        if (!element || !element.mesh) return;
        
        // Sauvegarder le matériau original
        if (!element.originalMaterial) {
            element.originalMaterial = element.mesh.material.clone();
        }
        
        // Créer un nouveau matériau avec effet de pulsation
        element.mesh.material = element.mesh.material.clone();
        element.mesh.material.emissive.setHex(0x444444);
        
        // Animation de pulsation
        const startTime = Date.now();
        const pulseDuration = 1000; // 1 seconde par cycle
        
        const animate = () => {
            if (this.activeBrickForSuggestions !== element) {
                // Restaurer le matériau original si plus actif
                if (element.originalMaterial) {
                    element.mesh.material = element.originalMaterial;
                    element.originalMaterial = null;
                }
                return;
            }
            
            const elapsed = (Date.now() - startTime) % pulseDuration;
            const intensity = 0.2 + 0.3 * Math.sin((elapsed / pulseDuration) * Math.PI * 2);
            
            element.mesh.material.emissiveIntensity = intensity;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    // Désactiver les suggestions
    deactivateSuggestions() {
        // Protection contre les appels multiples
        if (this._deactivationInProgress) {
            return;
        }
        this._deactivationInProgress = true;
        
        // 🆕 NOUVEAU: Cacher les briques fantômes lors de la désactivation
        this.hideGhostElement();
        
        // Restaurer le matériau original de la brique active
        if (this.activeBrickForSuggestions && this.activeBrickForSuggestions.originalMaterial) {
            this.activeBrickForSuggestions.mesh.material = this.activeBrickForSuggestions.originalMaterial;
            this.activeBrickForSuggestions.originalMaterial = null;
        }
        
        this.activeBrickForSuggestions = null;
        this.referenceElement = null; // Nettoyer aussi l'élément de référence
        this.clearSuggestions();
        
        // Désactiver le mode sélection visuel
        document.body.classList.remove('selection-mode');
        
        // Supprimer l'icône de suppression
        this.hideDeleteIcon();
        
        // Rétablir le curseur normal
        document.body.style.cursor = 'default';
        
        // Réinitialiser le flag de protection après un délai
        setTimeout(() => {
            this._deactivationInProgress = false;
        }, 100);
        
        // CORRECTION FANTÔME: Réactiver et repositionner le fantôme normal après désactivation des suggestions
        if (this.ghostElement) {
            // console.log('🔧 CORRECTION: Réactivation du fantôme après désactivation des suggestions');
            
            // Rendre le fantôme visible seulement s'il n'y a plus de suggestions actives
            if (!this.activeBrickForSuggestions) {
                this.ghostElement.mesh.visible = this.showGhost;
            }
            
            // Repositionner le fantôme à la bonne hauteur d'assise
            if (window.AssiseManager && window.AssiseManager.currentType) {
                const elementType = this.getElementTypeForMode(this.currentMode);
                let assiseType = elementType;
                
                // Pour les briques coupées, utiliser le type de base pour l'assise
                if (elementType && typeof elementType === 'string' && elementType.includes('_')) {
                    assiseType = elementType.split('_')[0];
                }
                
                const currentAssiseForType = window.AssiseManager.currentAssiseByType.get(assiseType);
                const assiseHeight = window.AssiseManager.getAssiseHeightForType(assiseType, currentAssiseForType);
                
                // Vérifier si c'est un élément GLB fantôme
                let elementHeight = 10; // Hauteur par défaut
                if (this.ghostElement.dimensions) {
                    elementHeight = this.ghostElement.dimensions.height;
                } else if (this.ghostElement.mesh && this.ghostElement.mesh.userData && this.ghostElement.mesh.userData.type === 'glb_ghost') {
                    // Pour les GLB, utiliser une hauteur estimée
                    elementHeight = 15; // Hauteur approximative d'un hourdis
                }
                
                const newY = assiseHeight + elementHeight / 2;
                
                // // console.log(`🔧 CORRECTION: Repositionnement fantôme sur assise ${assiseType}:`);
                // console.log(`   - Hauteur assise: ${assiseHeight} cm`);
                // console.log(`   - Nouvelle position Y: ${newY} cm`);
                
                // Repositionner le fantôme seulement si on n'est pas en mode suggestions
                if (!this.activeBrickForSuggestions) {
                    // Vérifier si c'est un élément GLB fantôme
                    if (this.ghostElement.mesh && this.ghostElement.mesh.userData && this.ghostElement.mesh.userData.type === 'glb_ghost') {
                        // Pour les GLB, mettre à jour directement la position du mesh
                        this.ghostElement.mesh.position.y = newY;
                    } else if (this.ghostElement.position && this.ghostElement.updatePosition) {
                        // Pour les éléments standards
                        this.ghostElement.updatePosition(
                            this.ghostElement.position.x,
                            newY,
                            this.ghostElement.position.z
                        );
                    }
                }
            }
        }
        
        // Émettre un événement pour l'UI
        document.dispatchEvent(new CustomEvent('suggestionsDeactivated'));
    }

    // 🆕 NOUVEAU: Configurer l'écoute du survol des menus - VERSION OPTIMISÉE
    setupMenuHoverListener() {
        // Si des listeners existent déjà, les supprimer d'abord
        this.removeMenuHoverListener();
        
        // Protection contre les activations multiples
        if (this._menuListenerActive) {
            return;
        }
        
        this._menuListenerActive = true;
        this._ghostHiddenByMenu = false; // Cache d'état pour éviter les appels redondants
        this._lastMenuCheck = 0; // Throttling
        
        // Créer un listener optimisé avec cache d'état
        this.menuHoverHandler = (e) => {
            // Vérification simple
            if (this._deactivationInProgress) {
                return;
            }
            
            // Throttling pour éviter le spam
            const now = Date.now();
            if (now - this._lastMenuCheck < 100) { // Throttle à 100ms
                return;
            }
            this._lastMenuCheck = now;
            
            const isInMenu = this.isMouseOverMenu(e.target);
            
            // Ne traiter que les changements d'état
            if (isInMenu && !this._ghostHiddenByMenu) {
                this._ghostHiddenByMenu = true;
                
                // Désactiver les suggestions au lieu de juste masquer
                const hadActiveSuggestions = this.activeBrickForSuggestions || this.suggestionGhosts.length > 0;
                
                if (hadActiveSuggestions) {
                    this.deactivateSuggestions();
                    
                    // Bloquer la réapparition automatique au survol
                    this.suggestionsDisabledByInterface = true;
                }
                
                // Masquer aussi le fantôme principal
                this.hideGhostElement();
                
            } else if (!isInMenu && this._ghostHiddenByMenu) {
                this._ghostHiddenByMenu = false;
                
                // Pas de réactivation automatique - l'utilisateur doit cliquer à nouveau
                
                // Réafficher seulement le fantôme principal si le mode fantôme est actif
                setTimeout(() => {
                    if (!this.activeBrickForSuggestions && !this._ghostHiddenByMenu && this.showGhost) {
                        this.showGhostElement();
                    }
                }, 50);
            }
        };
        
        // Utiliser mouseover avec throttling pour éviter le spam
        document.addEventListener('mouseover', this.menuHoverHandler, true);
    }

    // 🆕 NOUVEAU: Supprimer les listeners de survol des menus
    removeMenuHoverListener() {
        if (this.menuHoverHandler) {
            document.removeEventListener('mouseover', this.menuHoverHandler, true);
            this.menuHoverHandler = null;
        }
        
        this._menuListenerActive = false;
        this._ghostHiddenByMenu = false;
        // console.log('🎯 Surveillance du survol des menus désactivée');
    }

    // 🆕 NOUVEAU: Vérifier si la souris survole un menu
    isMouseOverMenu(element) {
        if (!element) return false;
        
        // Liste des sélecteurs de menu spécifiques - MENUS PRINCIPAUX
        const menuSelectors = [
            '.menu-bar',
            '.menu-item',
            '.submenu',
            '.dropdown-menu'
        ];
        
        // 🆕 NOUVEAU: Sélecteurs de la SIDEBAR (barre latérale droite)
        const sidebarSelectors = [
            '.sidebar',
            '.main-tabs',
            '.tabs-row',
            '.main-tab',
            '.tab-icon',
            '.tab-content',
            '.main-subtab-content',
            '.subtab-content',
            '.library-section',
            '.tool-group',
            '.panel-content'
        ];
        
        // 🆕 NOUVEAU: Sélecteurs des TOOLBARS (barres d'outils)
        const toolbarSelectors = [
            '.toolbar',
            '.toolbar-labels',
            '.toolbar-label',
            '.tool-button',
            '.tool-btn',
            '.bottom-panel',
            '.status-bar',
            '.status-section',
            '.viewport-controls',
            '.view-controls',
            '.view-btn',
            '.zoom-controls',
            '.zoom-btn',
            '.grid-controls',
            '.grid-btn',
            '.selection-status',
            '.clipboard-indicator',
            '.undo-redo-history',
            '.history-list'
        ];
        
        // Combiner tous les sélecteurs
        const allSelectors = [...menuSelectors, ...sidebarSelectors, ...toolbarSelectors];
        
        // Vérifier d'abord si l'élément lui-même correspond
        for (let selector of allSelectors) {
            if (element.matches && element.matches(selector)) {
                return true;
            }
        }
        
        // Ensuite vérifier les parents
        for (let selector of allSelectors) {
            if (element.closest && element.closest(selector)) {
                return true;
            }
        }
        
        // Vérifier par classe spécifique
        if (element.classList) {
            const allClasses = [
                // Menus
                'menu-bar', 'menu-item', 'submenu', 'dropdown-menu',
                // Sidebar
                'sidebar', 'main-tabs', 'tabs-row', 'main-tab', 'tab-icon', 
                'tab-content', 'main-subtab-content', 'subtab-content', 
                'library-section', 'tool-group', 'panel-content',
                // Toolbars
                'toolbar', 'toolbar-labels', 'toolbar-label', 'tool-button', 'tool-btn',
                'bottom-panel', 'status-bar', 'status-section', 'viewport-controls',
                'view-controls', 'view-btn', 'zoom-controls', 'zoom-btn',
                'grid-controls', 'grid-btn', 'selection-status', 'clipboard-indicator',
                'undo-redo-history', 'history-list'
            ];
            for (let className of allClasses) {
                if (element.classList.contains(className)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    // 🆕 NOUVEAU: Détecter si le clic est sur le dos de la brique originelle
    isClickOnBrickBack(clickedElement, referenceBrick) {
    // Désactivation totale en mode diba
    if (this.currentMode === 'diba') return false;
    if (!clickedElement || !referenceBrick || !referenceBrick.mesh) {
            return false;
        }
        
        // Vérifier si on clique sur la même brique
        if (clickedElement.id !== referenceBrick.id) {
            return false;
        }
        
        // Récupérer les coordonnées du clic dans l'espace mondial
        const mouse = new THREE.Vector2();
        const rect = window.SceneManager.renderer.domElement.getBoundingClientRect();
        const lastMouseEvent = window.SceneManager.lastMouseEvent;
        
        if (!lastMouseEvent) return false;
        
        mouse.x = ((lastMouseEvent.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((lastMouseEvent.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Créer un raycaster pour déterminer la face cliquée
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, window.SceneManager.camera);
        
        // Intersections avec le mesh de la brique
        const intersects = raycaster.intersectObject(referenceBrick.mesh);
        
        if (intersects.length === 0) return false;
        
        // Récupérer la normale de la face intersectée
        const intersection = intersects[0];
        if (!intersection || !intersection.face || !intersection.face.normal) {
            return false;
        }
        const faceNormal = intersection.face.normal.clone();
        
        // Transformer la normale dans l'espace mondial
        const worldNormal = faceNormal.transformDirection(referenceBrick.mesh.matrixWorld);
        
        // Récupérer l'orientation de la brique
        const brickRotation = referenceBrick.rotation || 0;
        
        // Calculer le vecteur "arrière" de la brique selon son orientation
        // Pour une brique standard, le dos est dans la direction -Z locale après rotation
        const backDirection = new THREE.Vector3(
            Math.sin(brickRotation),    // X du vecteur arrière
            0,                          // Y (pas de rotation verticale)
            -Math.cos(brickRotation)    // Z du vecteur arrière
        );
        
        // Calculer l'angle entre la normale de la face cliquée et le vecteur arrière
        const dotProduct = worldNormal.dot(backDirection);
        
        // Si l'angle est proche (dot product > 0.8), c'est le dos de la brique
        const isBackFace = dotProduct > 0.8;
        
        console.log(`🎯 Analyse du clic sur brique ${referenceBrick.id}:`);
        console.log(`   - Normale face: ${worldNormal.x.toFixed(2)}, ${worldNormal.y.toFixed(2)}, ${worldNormal.z.toFixed(2)}`);
        console.log(`   - Direction arrière: ${backDirection.x.toFixed(2)}, ${backDirection.y.toFixed(2)}, ${backDirection.z.toFixed(2)}`);
        console.log(`   - Dot product: ${dotProduct.toFixed(2)}`);
        console.log(`   - Est le dos: ${isBackFace}`);
        
        return isBackFace;
    }

    // Méthode pour mettre à jour les dimensions depuis l'extérieur
    updateDimensions(length, width, height) {
        // Mettre à jour les champs de l'interface
        document.getElementById('elementLength').value = length;
        document.getElementById('elementWidth').value = width;
        document.getElementById('elementHeight').value = height;
        
        // Mettre à jour l'élément fantôme
        this.updateGhostElement();
        
        // Mettre à jour l'aperçu si il existe
        if (this.previewElement) {
            this.updatePreview();
        }
   }

    // Méthode utilitaire pour mapper les modes aux types d'éléments
    getElementTypeForMode(mode) {
        // Protection contre les appels trop fréquents
        const now = Date.now();
        if (this._lastGetElementTypeCall && (now - this._lastGetElementTypeCall) < 50) {
            // Si appelé trop souvent, on retourne la dernière valeur sans refaire le calcul
            if (this._lastElementType && this._lastElementTypeMode === mode) {
                return this._lastElementType;
            }
        }
        this._lastGetElementTypeCall = now;
        this._lastElementTypeMode = mode;
        
        const modeToTypeMap = {
            'brick': 'brick',
            'block': 'block', 
            'insulation': 'insulation',
            'linteau': 'linteau',
            'diba': 'diba',
            'beam': 'beam',
            'custom': 'custom'
        };
        
        let type = modeToTypeMap[mode];
        
        // Si le mode est 'selection' ou non défini, déterminer le type depuis le TabManager
        if (!type) {
            // Récupérer le type depuis le sous-onglet actuel du TabManager
            if (window.TabManager && window.TabManager.currentSubTab) {
                const subtabToTypeMap = {
                    'briques': 'brick',
                    'blocs': 'block',
                    'isolants': 'insulation',
                    'linteaux': 'linteau',
                    'etancheite': 'diba',
                    'poutres': 'beam'
                };
                type = subtabToTypeMap[window.TabManager.currentSubTab] || 'brick';
            } else {
                type = 'brick'; // Fallback par défaut
            }
        }
        
        // Pour les briques, utiliser le type spécifique du BrickSelector
        if (type === 'brick' && window.BrickSelector && window.BrickSelector.getCurrentBrick) {
            const brickInfo = window.BrickSelector.getCurrentBrick();
            // S'assurer que le type est une chaîne de caractères
            if (brickInfo && brickInfo.type) {
                type = typeof brickInfo.type === 'string' ? brickInfo.type : String(brickInfo.type);
            }
            
            // 🔧 CORRECTION: Vérifier si un bouton de coupe est actif
            if (window.CutButtonManager && window.CutButtonManager.getCurrentState) {
                const cutState = window.CutButtonManager.getCurrentState();
                
                if (cutState.cutType && cutState.baseType && cutState.cutType !== 'full') {
                    // Construire le type avec la coupe (ex: M50_1Q pour M50 + 1/4)
                    const cutSuffixes = {
                        '3/4': '_3Q',
                        '1/2': '_HALF', 
                        '1/4': '_1Q',
                        'P': '_P'
                    };
                    
                    if (cutSuffixes[cutState.cutType]) {
                        const cutBrickType = cutState.baseType + cutSuffixes[cutState.cutType];
                        type = cutBrickType;
                    }
                }
            }
        }
        
        // CORRECTION: Pour les blocs, utiliser le sous-type spécifique du BlockSelector
        if (type === 'block' && window.BlockSelector && window.BlockSelector.getCurrentBlockData) {
            try {
                const currentBlock = window.BlockSelector.getCurrentBlockData();
                const currentBlockType = window.BlockSelector.currentBlock;
                
                if (currentBlock && currentBlock.category) {
                    const category = currentBlock.category;
                    
                    // Mapper les catégories aux types d'assises (même logique que detectBlockSubType)
                    switch (category) {
                        case 'hollow':
                            type = 'CREUX';
                            break;
                        case 'cut':
                            // Pour les blocs coupés, vérifier le type d'origine
                            if (currentBlockType && (currentBlockType.startsWith('BC_') || currentBlockType.startsWith('BCA_'))) {
                                type = 'CELLULAIRE'; // Les blocs béton cellulaire coupés restent CELLULAIRE
                                console.log(`🔧 Bloc béton cellulaire coupé détecté: ${currentBlockType} → type CELLULAIRE conservé`);
                            } else if (currentBlockType && currentBlockType.startsWith('ARGEX_')) {
                                type = 'ARGEX'; // Les blocs ARGEX coupés restent ARGEX
                                console.log(`🔧 Bloc ARGEX coupé détecté: ${currentBlockType} → type ARGEX conservé`);
                            } else if (currentBlockType && currentBlockType.startsWith('TC_')) {
                                type = 'TERRE_CUITE'; // Les blocs terre cuite coupés restent TERRE_CUITE
                                console.log(`🔧 Bloc terre cuite coupé détecté: ${currentBlockType} → type TERRE_CUITE conservé`);
                            } else {
                                type = 'CREUX'; // Les autres blocs découpés deviennent CREUX
                            }
                            break;
                        case 'cellular':
                        case 'cellular-assise':
                            type = 'CELLULAIRE';
                            break;
                        case 'argex':
                            type = 'ARGEX';
                            break;
                        case 'terracotta':
                            type = 'TERRE_CUITE';
                            break;
                        default:
                            console.log(`⚠️ Catégorie de bloc inconnue: ${category}, utilisation du type générique 'block'`);
                            // Garder type = 'block'
                            break;
                    }
                    
                    // // console.log(`🔧 Type d'élément détecté pour le fantôme: ${type} (catégorie: ${category})`);
                }
            } catch (error) {
                console.warn('Erreur lors de la détection du type de bloc pour le fantôme:', error);
            }
        }
        
        // Pour les isolants, utiliser le type spécifique du InsulationSelector avec coupe
        if (type === 'insulation' && window.InsulationSelector) {
            try {
                // PRIORITÉ 1: Vérifier si TabManager a une coupe active
                if (window.TabManager && window.TabManager.selectedLibraryItem && 
                    typeof window.TabManager.selectedLibraryItem === 'string' && 
                    window.TabManager.selectedLibraryItem.includes('_')) {
                    type = window.TabManager.selectedLibraryItem;
                    // Log seulement si le type a changé pour éviter le spam
                    if (!this._lastLoggedTabManagerType || this._lastLoggedTabManagerType !== type) {
                        // console.log('🔧 Type isolant récupéré depuis TabManager:', type); // désactivé
                        this._lastLoggedTabManagerType = type;
                    }
                }
                // PRIORITÉ 2: Utiliser le type avec coupe s'il est disponible
                else if (window.InsulationSelector.getCurrentInsulationWithCut) {
                    const insulationWithCut = window.InsulationSelector.getCurrentInsulationWithCut();
                    // Correction: getCurrentInsulationWithCut() retourne maintenant une chaîne
                    type = insulationWithCut || 'insulation';
                    // Log seulement si le type a changé pour éviter le spam
                    if (!this._lastLoggedInsulationType || this._lastLoggedInsulationType !== type) {
                        // console.log('🔧 Type d\'isolant avec coupe détecté pour le fantôme:', type);
                        this._lastLoggedInsulationType = type;
                    }
                } else {
                    // Fallback vers la méthode classique
                    const insulationType = window.InsulationSelector.getCurrentInsulation();
                    type = typeof insulationType === 'string' ? insulationType : String(insulationType);
                }
            } catch (error) {
                console.warn('Erreur lors de la détection du type d\'isolant pour le fantôme:', error);
            }
        }

        // Pour les linteaux, utiliser le type spécifique du LinteauSelector avec coupe
        if (type === 'linteau' && window.LinteauSelector) {
            try {
                // PRIORITÉ 1: Vérifier si TabManager a une coupe active
                if (window.TabManager && window.TabManager.selectedLibraryItem && 
                    typeof window.TabManager.selectedLibraryItem === 'string' && 
                    window.TabManager.selectedLibraryItem.includes('_')) {
                    type = window.TabManager.selectedLibraryItem;
                    // Log seulement si le type a changé pour éviter le spam
                    if (!this._lastLoggedTabManagerLinteauType || this._lastLoggedTabManagerLinteauType !== type) {
                        console.log('🔧 Type linteau récupéré depuis TabManager:', type);
                        this._lastLoggedTabManagerLinteauType = type;
                    }
                }
                // PRIORITÉ 2: Utiliser le type avec coupe s'il est disponible
                else if (window.LinteauSelector.getCurrentLinteauWithCut) {
                    // getCurrentLinteauWithCut() retourne maintenant un objet, pas une string
                    // On utilise currentLinteauWithCut qui contient la string (ex: "L120_1Q")
                    if (window.LinteauSelector.currentLinteauWithCut) {
                        type = window.LinteauSelector.currentLinteauWithCut;
                        // Log seulement si le type a changé pour éviter le spam
                        if (!this._lastLoggedLinteauType || this._lastLoggedLinteauType !== type) {
                            console.log('🔧 Type de linteau avec coupe détecté pour le fantôme:', type);
                            this._lastLoggedLinteauType = type;
                        }
                    }
                } else if (window.LinteauSelector.getCurrentLinteauData) {
                    // Fallback vers la méthode classique
                    const currentLinteau = window.LinteauSelector.getCurrentLinteauData();
                    if (currentLinteau && currentLinteau.type) {
                        // S'assurer que le type est une chaîne de caractères
                        type = typeof currentLinteau.type === 'string' ? currentLinteau.type : String(currentLinteau.type);
                        // // console.log(`🔧 Type de linteau détecté pour le fantôme: ${type}`);
                    }
                }
            } catch (error) {
                console.warn('Erreur lors de la détection du type de linteau pour le fantôme:', error);
            }
        }

        // Pour les poutres, retourner le profil sélectionné si disponible
        if (type === 'beam') {
            // Priorité à la sélection du TabManager si c'est un type BeamProfiles
            if (window.TabManager && window.TabManager.selectedLibraryItem && window.BeamProfiles && window.BeamProfiles.isBeamType(window.TabManager.selectedLibraryItem)) {
                return 'beam'; // le WallElement utilisera beamType des options
            }
            return 'beam';
        }
        
        // S'assurer que la valeur retournée est toujours une chaîne
        const result = typeof type === 'string' ? type : String(type);
        this._lastElementType = result; // Sauvegarder pour éviter les recalculs
        return result;
    }
   
    // Fonction pour calculer le ratio de coupe
    getCutRatio(cutSuffix) {
        if (!cutSuffix) return 1;
        
        switch(cutSuffix.toUpperCase()) {
            // Conventions isolants
            case 'HALF': return 0.5;
            case 'QUARTER': return 0.25;
            case 'THIRD': return 0.33;
            case 'TWOTHIRD': return 0.67;
            
            // Conventions linteaux (boutons HTML)
            case '1/2': return 0.5;
            case '1/4': return 0.25;
            case '3/4': return 0.75;
            case 'P': return 0.85; // Pièce (environ 85% de la longueur originale)
            
            // Conventions linteaux (suffixes internes)
            case '1Q': return 0.25;   // 1/4
            case '3Q': return 0.75;   // 3/4
            
            default: return 1;
        }
    }

    // Méthode pour déterminer automatiquement le matériau selon le mode et le type
    getAutoMaterial() {
        if (this.currentMode === 'brick') {
            // Pour les briques, exclure les matériaux spécifiques aux blocs
            const blockMaterials = ['cellular-concrete', 'concrete', 'brick-red'];
            if (this.currentMaterial && !blockMaterials.includes(this.currentMaterial)) {
                return this.currentMaterial;
            }
            // Toutes les briques → brique rouge classique (nouveau matériau par défaut)
            return 'brique-rouge-classique';
        } else if (this.currentMode === 'block') {
            // Déterminer le matériau selon le type de bloc
            if (window.BlockSelector && window.BlockSelector.getCurrentBlockData) {
                const currentBlock = window.BlockSelector.getCurrentBlockData();
                const currentBlockId = window.BlockSelector.getCurrentBlock ? window.BlockSelector.getCurrentBlock() : null;
                if (currentBlock && currentBlock.category) {
                    const category = currentBlock.category;
                    
                    // Béton cellulaire (toutes variantes) → matériau blanc
                    // - category === 'cellular' (BC_...)
                    // - category === 'cellular-assise' (BCA_...)
                    if (category === 'cellular' || category === 'cellular-assise') {
                        return 'cellular-concrete';
                    }
                    // Blocs creux → matériau gris
                    else if (category === 'hollow') {
                        return 'concrete'; // Matériau gris pour blocs creux
                    }
                    // Blocs coupés → hériter du matériau du bloc de base
                    else if (category === 'cut') {
                        // Si le bloc coupé provient d'un BC/BCA, rester en blanc
                        if (currentBlock.baseBlock && (currentBlock.baseBlock.startsWith('BC_') || currentBlock.baseBlock.startsWith('BCA_'))) {
                            return 'cellular-concrete';
                        }
                        // Sinon, blocs creux coupés → gris
                        return 'concrete';
                    }
                }
                // Sécurité: si l'identifiant courant commence par BC_ ou BCA_, forcer le blanc
                if (currentBlockId && (currentBlockId.startsWith('BC_') || currentBlockId.startsWith('BCA_'))) {
                    return 'cellular-concrete';
                }
            }
            
            // Fallback avec l'ancienne logique si BlockSelector n'est pas disponible
            if (window.currentBlockDimensions && window.currentBlockDimensions.type) {
                const blockType = window.currentBlockDimensions.type;
                if (blockType.startsWith('TC_')) {
                    return 'concrete'; // Blocs terre cuite creux → gris
                } else if (blockType.startsWith('BC_') || blockType.startsWith('BCA_')) {
                    return 'cellular-concrete'; // Blocs béton cellulaire → béton cellulaire blanc
                }
            }
            return 'concrete'; // Tous les autres blocs → gris par défaut
        } else if (this.currentMode === 'insulation') {
            // Utiliser le matériau spécifié dans les dimensions d'isolant
            if (window.currentInsulationDimensions && window.currentInsulationDimensions.material) {
                return window.currentInsulationDimensions.material;
            }
            return 'insulation'; // PUR par défaut
        } else if (this.currentMode === 'beam') {
            // Matériau par défaut pour poutres acier (acier standard, pas inox)
            return 'axier';
        } else if (this.currentMode === 'linteau') {
            // Linteaux toujours en béton gris
            return 'concrete';
        }
        
        // Défaut pour les cas non prévus → brique rouge classique
        return 'brique-rouge-classique';
    }

    // Utilitaire: forcer la recolorisation de tous les linteaux déjà présents en béton
    recolorExistingLinteauxToConcrete() {
        if (!window.SceneManager || !window.SceneManager.scene || !window.MaterialLibrary) return;
        const concreteMat = window.MaterialLibrary.getMaterial('concrete');
        let count = 0;
        window.SceneManager.scene.traverse(obj => {
            if (obj.isMesh && obj.userData && obj.userData.type === 'linteau') {
                // Remplacer le matériau seulement si différent
                if (obj.material !== concreteMat && concreteMat) {
                    obj.material = concreteMat;
                }
                obj.userData.material = 'concrete';
                count++;
            }
        });
    // Log retiré (recolorisation linteaux)
    }

    // Méthode pour déterminer le matériau des joints
    getJointMaterial(element = null) {
        // Logs retirés pour réduire le bruit
        if (element && element.blockType && (element.blockType.startsWith('BC_') || element.blockType.startsWith('BCA_'))) {
            return 'joint-blanc-casse';
        }
        if (element && element.blockType === 'CELLULAIRE') {
            return 'joint-blanc-casse';
        }
        if (element && element.blockType && element.blockType.startsWith('ARGEX_')) {
            return 'joint-argex';
        }
        if (element && element.blockType === 'ARGEX') {
            return 'joint-argex';
        }
        
        // Pour les blocs terre cuite, utiliser le joint GRIS (demande utilisateur)
        if (element && element.blockType && element.blockType.startsWith('TC_')) {
            return 'joint-gris-souris';
        }
        if (element && element.blockType === 'TERRE_CUITE') {
            return 'joint-gris-souris';
        }
        return 'joint-gris-souris';
    }

    // Méthode pour obtenir l'épaisseur du joint vertical en cm
    getJointVerticalThickness(element = null) {
        // Si un élément est fourni, utiliser ses paramètres spécifiques
        if (element) {
            const jointSettings = this.getJointSettingsForElement(element);
            return jointSettings.verticalThickness / 10; // Conversion mm vers cm
        }
        
        // Sinon, utiliser les paramètres par défaut selon le mode actuel
        const currentMode = this.currentMode;
        if (currentMode === 'brick') {
            return this.brickJointThickness / 10; // Conversion mm vers cm
        } else if (currentMode === 'block') {
            return this.blockJointThickness / 10; // Conversion mm vers cm
        }
        
        // Fallback vers l'ancienne logique
        return this.jointThickness / 10; // Conversion mm vers cm
    }

    // NOUVELLE FONCTIONNALITÉ: Mode joint debout (Ctrl+clic)
    activateVerticalJointMode(element) {
        if (!element || (element.type !== 'brick' && element.type !== 'block')) return;
        
        // console.log('🔧 Activation du mode joint debout pour l\'élément:', element.type, element.id);
        
        // Désactiver les suggestions normales
        this.deactivateSuggestions();
        
        // Stocker la brique de référence pour les joints
        this.activeBrickForSuggestions = element;
        this.referenceElement = element; // Stocker aussi dans referenceElement pour compatibilité
        
        // Masquer le fantôme normal
        if (this.ghostElement) {
            this.ghostElement.mesh.visible = false;
        }
        
        // Créer les suggestions de joints debout
        this.createVerticalJointSuggestions(element);
        
        // Ajouter un effet visuel à la brique sélectionnée
        this.addPulseEffect(element);
        
        // Activer le mode sélection visuel
        document.body.classList.add('selection-mode');
        
        // Jouer le son d'activation
        // Son supprimé
        
        // Émettre un événement pour l'UI
        document.dispatchEvent(new CustomEvent('verticalJointActivated', {
            detail: { element }
        }));
        
        console.log('Mode joint debout activé pour la brique:', element.id);
    }

    // Créer les suggestions de joints debout perpendiculaires aux boutisses
    createVerticalJointSuggestions(element) {
        if (!element || !this.isInitialized) return;
        
        // Créer des joints pour les briques ET les blocs (mais pas les autres types)
        if (element.type !== 'brick' && element.type !== 'block') {
            console.log('🔧 Aucun joint créé - Élément de type:', element.type);
            return;
        }
        
        // Nettoyer les anciennes suggestions
        this.clearSuggestions();
        
        const suggestions = [];
        const basePos = element.position;
        const rotation = element.rotation;
        const dims = element.dimensions;
        
        // Joint vertical spécifique au matériau de l'élément
        const jointVertical = this.getJointVerticalThickness(element); // Épaisseur selon le type d'élément
        
        // CORRECTION: Ne pas créer de joints verticaux si l'épaisseur est 0 (béton cellulaire assises 2+)
        if (jointVertical <= 0) {
            console.log('🚫 Pas de joints verticaux - Épaisseur nulle pour cet élément (béton cellulaire assises 2+)');
            return;
        }
        
        // Détecter si l'élément est une boutisse (tourné à 90°)
        const normalizedRotation = ((rotation % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
        const isBoutisse = (normalizedRotation > Math.PI / 4 && normalizedRotation < 3 * Math.PI / 4) ||
                          (normalizedRotation > 5 * Math.PI / 4 && normalizedRotation < 7 * Math.PI / 4);
        
        console.log('🔧 Création des joints debout - Brique ' + (isBoutisse ? 'en boutisse' : 'en panneresse'));
        
        // Dimensions du joint debout - perpendiculaire au sol, parallèle aux boutisses (faces courtes 9×5)
        // Joint debout = face 9×5 contre face boutisse 9×5 de la brique
        const jointLength = dims.width;  // 9 cm - même largeur que la boutisse (face courte) de la brique
        const jointWidth = 1;           // 1 cm d'épaisseur 
        const jointHorizontal = window.AssiseManager ? window.AssiseManager.jointHeight : 1.2; // Joint horizontal (défaut 1.2 cm)
        const jointHeight = dims.height + jointHorizontal; // Hauteur brique + joint horizontal
        
        console.log('🔧 Dimensions joint:', { 
            length: jointLength, 
            width: jointWidth, 
            height: jointHeight,
            info: 'Joint parallèle aux boutisses (faces courtes 9×5)'
        });
        
        // Créer les joints perpendiculaires au sol, positionnés aux extrémités des panneresses (faces longues)
        const jointPositions = [
            // Joint debout à l'extrémité AVANT de la brique (perpendiculaire à la panneresse avant)
            {
                x: dims.length,  // Position adaptée à la longueur réelle de la brique
                z: -(dims.width/2) - (jointWidth/2) - 4.0,  // Joint VERT reculé de 4 cm en Z
                rotation: rotation + Math.PI/2, // Rotation +90° par rapport à la brique (perpendiculaire aux panneresses = parallèle aux boutisses)
                color: 0x00ff00, // Vert - Joint debout à l'extrémité avant
                type: 'joint-debout-avant',
                jointLength: jointLength,
                jointWidth: jointWidth,
                jointHeight: jointHeight
            },
            // Joint debout à l'extrémité ARRIÈRE de la brique (perpendiculaire à la panneresse arrière)
            {
                x: -1,  // Décalé de -1 cm en X (épaisseur joint)
                z: (dims.width/2) + (jointWidth/2) - 14.0,  // Joint ORANGE reculé de 14 cm en Z
                rotation: rotation + Math.PI/2, // Rotation +90° par rapport à la brique (perpendiculaire aux panneresses = parallèle aux boutisses)
                color: 0xff8800, // Orange - Joint debout à l'extrémité arrière
                type: 'joint-debout-arriere',
                jointLength: jointLength,
                jointWidth: jointWidth,
                jointHeight: jointHeight
            },
            // Joint horizontal sous la brique (même surface que la brique 19×9)
            {
                x: 0,  // Centré en X par rapport à la brique
                z: 0,  // Centré en Z par rapport à la brique
                rotation: rotation, // Même rotation que la brique
                color: 0x0088ff, // Bleu - Joint horizontal
                type: 'joint-horizontal',
                jointLength: dims.length,  // 19 cm - même longueur que la brique
                jointWidth: dims.width,    // 9 cm - même largeur que la brique
                jointHeight: jointHorizontal  // Épaisseur du joint horizontal
            }
        ];
        
        // Convertir en positions mondiales et créer les fantômes
        jointPositions.forEach((localPos, index) => {
            // Rotation vers coordonnées mondiales
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);
            const worldX = basePos.x + (localPos.x * cos - localPos.z * sin);
            const worldZ = basePos.z + (localPos.x * sin + localPos.z * cos);
            
            // Position Y selon le type de joint - doit être sur la même assise que la brique de référence
            let worldY;
            
            // Récupérer la hauteur de l'assise de la brique de référence
            let assiseBaseHeight = 0; // Par défaut assise 0
            let elementAssiseType = element.type; // Par défaut le type de l'élément
            let elementInfo = null; // Déclaration de la variable dans la bonne portée
            
            if (window.AssiseManager && element) {
                // Trouver l'assise ET le type de l'élément de référence
                elementInfo = window.AssiseManager.getElementAssiseAndType(element.id);
                // // console.log(`🔧 Élément ${element.id} trouvé:`, elementInfo);
                
                if (elementInfo && elementInfo.assiseIndex !== null && elementInfo.assiseIndex !== -1) {
                    // Utiliser le type exact de l'assise où se trouve l'élément
                    elementAssiseType = elementInfo.type;
                    assiseBaseHeight = window.AssiseManager.getAssiseHeightForType(elementInfo.type, elementInfo.assiseIndex);
                    // // console.log(`🔧 Hauteur de base de l'assise ${elementInfo.assiseIndex} (type: ${elementInfo.type}):`, assiseBaseHeight, 'cm');
                } else {
                    // // console.log(`🔧 Assise non trouvée pour l'élément ${element.id}, utilisation de l'assise 0 du type ${elementAssiseType}`);
                    assiseBaseHeight = window.AssiseManager.getAssiseHeightForType(elementAssiseType, 0);
                }
            }
            
            if (localPos.type === 'joint-horizontal') {
                // Joint horizontal: doit se terminer au plan zéro de l'assise courante
                let planZeroAssise = 0; // Plan zéro de l'assise courante
                
                if (window.AssiseManager && elementInfo && elementInfo.assiseIndex >= 0) {
                    // Calculer le plan zéro de l'assise courante
                    planZeroAssise = window.AssiseManager.calculateAssiseHeightForType(elementInfo.type, elementInfo.assiseIndex + 1);
                }
                
                const faceInferieureBrique = element.position.y - element.dimensions.height / 2;
                const hauteurJoint = faceInferieureBrique - planZeroAssise;
                
                if (hauteurJoint > 0.1) {
                    worldY = planZeroAssise - hauteurJoint / 2; // Joint se termine au plan zéro (face inférieure du joint)
                } else {
                    worldY = faceInferieureBrique - window.AssiseManager.jointHeight / 2; // Fallback ancien comportement
                }
                
                console.log(`🔧 Joint horizontal assise ${elementInfo?.assiseIndex || 0}: planZero=${planZeroAssise}, faceInf=${faceInferieureBrique}, hauteur=${hauteurJoint}, Y=${worldY}`);
            } else {
                // CORRECTION DÉFINITIVE: Joints verticaux descendent jusqu'au vrai sol (Y=0)
                // pour l'assise 0, et jusqu'au plan de pose réel pour les autres assises
                
                let planZeroReel = 0; // Vrai plan zéro (sol) pour l'assise 0
                
                if (window.AssiseManager && elementInfo && elementInfo.assiseIndex > 0) {
                    // CORRECTION: Pour les assises supérieures, le joint démarre à la FIN de l'assise précédente
                    // Pour assise N, on veut la fin de l'assise N-1, donc calculateAssiseHeightForType(type, N-1)
                    planZeroReel = window.AssiseManager.calculateAssiseHeightForType(elementInfo.type, elementInfo.assiseIndex - 1);
                    console.log(`🔧 Joint vertical assise ${elementInfo.assiseIndex}: démarre à la fin assise ${elementInfo.assiseIndex - 1} = ${planZeroReel} cm`);
                }
                
                // Le joint va du plan zéro réel jusqu'au sommet du bloc
                // Calculer la position du centre en fonction de cette logique
                const sommeBlocY = element.position.y + element.dimensions.height / 2;
                let hauteurJointComplete = sommeBlocY - planZeroReel;
                
                // CORRECTION SPÉCIALE: Pour les briques M50_CHANT, limiter la hauteur du joint à la hauteur de la brique
                if (element.blockType === 'M50_CHANT') {
                    const hauteurBrique = element.dimensions.height; // 19 cm pour M50_CHANT
                    const baseBriqueY = element.position.y - element.dimensions.height / 2;
                    
                    // Le joint ne doit pas dépasser la hauteur de la brique elle-même
                    hauteurJointComplete = Math.min(hauteurJointComplete, hauteurBrique);
                    
                    console.log(`🧱 M50_CHANT détecté - Joint vertical limité:`);
                    console.log(`   - Hauteur brique: ${hauteurBrique} cm`);
                    console.log(`   - Base brique: ${baseBriqueY} cm`);
                    console.log(`   - Hauteur joint limitée: ${hauteurJointComplete} cm`);
                    
                    // Recalculer worldY avec la hauteur limitée
                    worldY = baseBriqueY + hauteurJointComplete / 2;
                } else {
                    worldY = planZeroReel + hauteurJointComplete / 2;
                }
                
                // // console.log(`🔧 Joint vertical jusqu'au sol réel:`);
                console.log(`   - Plan zéro réel: ${planZeroReel} cm`);
                console.log(`   - Sommet bloc: ${sommeBlocY} cm`);
                console.log(`   - Hauteur joint complète: ${hauteurJointComplete} cm`);
                console.log(`   - Centre Y calculé: ${worldY} cm`);
                if (element.blockType === 'M50_CHANT') {
                    console.log(`   - Joint M50_CHANT limité à la hauteur de la brique`);
                } else {
                    console.log(`   - Joint s'étend de ${planZeroReel} à ${sommeBlocY} cm`);
                }
                
                // Mettre à jour la hauteur du joint pour qu'il corresponde à la hauteur complète
                localPos.jointHeight = hauteurJointComplete;
            }
            
            // Ajuster la hauteur du joint pour le type horizontal (toujours 1.2 cm fixe)
            const hauteurJointFinale = localPos.type === 'joint-horizontal' ? 
                window.AssiseManager.jointHeight :
                localPos.jointHeight;
            
            const suggestion = this.createVerticalJointGhost(
                worldX, worldY, worldZ, 
                localPos.rotation,
                localPos.color,
                index,
                localPos.type,
                localPos.jointLength,
                localPos.jointWidth,
                hauteurJointFinale
            );
            if (suggestion) {
                suggestions.push(suggestion);
            }
        });
        
        this.suggestionGhosts = suggestions;
        // // console.log(`🔧 ${suggestions.length} suggestions de joints créées (debout + horizontal)`);
    }

    // Créer un fantôme de joint debout
    createVerticalJointGhost(x, y, z, rotation, color, index, jointType, jointLength, jointWidth, jointHeight, element = null) {
        // // console.log(`🔧 Joint ${jointType}:`, {
        //     dimensions: { length: jointLength, width: jointWidth, height: jointHeight },
        //     position: { x, y, z },
        //     format: `${jointLength}×${jointWidth}×${jointHeight} cm (L×W×H)`
        // });
        
        const ghost = new WallElement({
            type: 'brick',
            material: this.getJointMaterial(element), // Utiliser le matériau spécifique aux joints avec l'élément source
            x: x,
            y: y, // Utiliser directement la position Y calculée
            z: z,
            length: jointLength,
            width: jointWidth,
            height: jointHeight, // Utiliser la vraie hauteur
            rotation: rotation
        });
        
        // Style visuel spécial pour les joints debout
        if (ghost.mesh && ghost.mesh.material) {
            ghost.mesh.material = ghost.mesh.material.clone();
            ghost.mesh.material.transparent = true;
            ghost.mesh.material.opacity = 0.7;
            ghost.mesh.material.color.setHex(color);
            ghost.mesh.material.emissive.setHex(color);
            ghost.mesh.material.emissiveIntensity = 0.4;
            
            // Effet de clignotement pour attirer l'attention
            this.addBlinkEffect(ghost.mesh);
        }
        
        // Métadonnées pour identifier le type de joint
        ghost.mesh.userData = {
            ...ghost.mesh.userData,
            suggestionIndex: index,
            jointType: jointType,
            isVerticalJoint: jointType.includes('debout'), // true pour joints debout, false pour joint horizontal
            isHorizontalJoint: jointType === 'joint-horizontal', // true pour joint horizontal
            isSuggestion: true
        };
        
        // Animation d'apparition
        ghost.mesh.scale.setScalar(0.1);
        ghost.mesh.material.opacity = 0;
        
        // Animer l'apparition avec un délai
        const delay = index * 200; // 200ms entre chaque joint
        setTimeout(() => {
            this.animateGhostAppearance(ghost.mesh);
        }, delay);
        
        window.SceneManager.scene.add(ghost.mesh);
        return ghost;
    }

    // Placer un joint définitivement (debout ou horizontal)
    placeVerticalJoint(suggestionGhost) {
        if (!suggestionGhost || (!suggestionGhost.mesh.userData.isVerticalJoint && !suggestionGhost.mesh.userData.isHorizontalJoint)) return;
        
        console.log('🔧 Placement du joint:', suggestionGhost.mesh.userData.jointType);
        console.log('🔧 Position fantôme:', {
            x: suggestionGhost.position.x,
            y: suggestionGhost.position.y,
            z: suggestionGhost.position.z,
            rotation: suggestionGhost.rotation,
            dimensions: suggestionGhost.dimensions
        });
        
        // CORRECTION POSITION: Avancer d'un demi joint (0.5cm) en X et d'une demi boutisse (4.5cm) en Z
        const finalX = suggestionGhost.position.x + 0.5; // Avance d'un demi joint (0.5cm) en X
        const finalZ = suggestionGhost.position.z + 4.5; // Avance d'une demi boutisse (4.5cm) en Z
        
        console.log('🔧 Position fantôme originale:', { x: suggestionGhost.position.x, y: suggestionGhost.position.y, z: suggestionGhost.position.z });
        console.log('🔧 Position finale avec avance (X+0.5cm, Z+4.5cm):', { x: finalX, y: suggestionGhost.position.y, z: finalZ });
        
        // CORRECTION DÉFINITIVE: Calculer la position Y correcte pour les joints verticaux
        let finalY = suggestionGhost.position.y; // Par défaut (pour joints horizontaux)
        
        if (suggestionGhost.mesh.userData.isVerticalJoint) {
            // Pour les joints verticaux, calculer la position depuis le sol réel
            let planZeroReel = 0; // Sol réel pour assise 0
            
            if (this.referenceAssiseIndex > 0 && window.AssiseManager) {
                // CORRECTION: Pour les autres assises, le joint démarre à la FIN de l'assise précédente
                // Pour assise N, on veut la fin de l'assise N-1, donc calculateAssiseHeightForType(type, N-1)
                planZeroReel = window.AssiseManager.calculateAssiseHeightForType(this.referenceAssiseType, this.referenceAssiseIndex - 1);
                console.log(`🔧 Joint vertical assise ${this.referenceAssiseIndex}: démarre à la fin assise ${this.referenceAssiseIndex - 1} = ${planZeroReel} cm`);
            }
            
            // Hauteur totale du joint (du plan zéro réel au sommet du bloc)
            const refElement = this.referenceElement || this.activeBrickForSuggestions;
            if (!refElement) {
                console.error('❌ Aucun élément de référence disponible pour calculer la position Y du joint');
                return;
            }
            const sommeBlocY = refElement.position.y + refElement.dimensions.height / 2;
            let hauteurJointComplete = sommeBlocY - planZeroReel;
            
            // CORRECTION SPÉCIALE: Pour les briques M50_CHANT, limiter la hauteur du joint à la hauteur de la brique
            if (refElement.blockType === 'M50_CHANT') {
                const hauteurBrique = refElement.dimensions.height; // 19 cm pour M50_CHANT
                const baseBriqueY = refElement.position.y - refElement.dimensions.height / 2;
                
                // Le joint ne doit pas dépasser la hauteur de la brique elle-même
                hauteurJointComplete = Math.min(hauteurJointComplete, hauteurBrique);
                
                // Recalculer finalY avec la hauteur limitée
                finalY = baseBriqueY + hauteurJointComplete / 2;
                
                console.log(`🧱 M50_CHANT détecté (correction joint) - Joint vertical limité:`);
                console.log(`   - Hauteur brique: ${hauteurBrique} cm`);
                console.log(`   - Hauteur joint limitée: ${hauteurJointComplete} cm`);
            } else {
                // Centre du joint = plan zéro + hauteur/2
                finalY = planZeroReel + hauteurJointComplete / 2;
            }
            
            console.log('🔧 Correction position Y pour joint vertical:');
            console.log(`   - Plan zéro réel: ${planZeroReel} cm`);
            console.log(`   - Sommet bloc: ${sommeBlocY} cm`);
            console.log(`   - Hauteur joint: ${hauteurJointComplete} cm`);
            console.log(`   - Position Y corrigée: ${finalY} cm (au lieu de ${suggestionGhost.position.y} cm)`);
            
            // Mettre à jour aussi la hauteur réelle du joint
            suggestionGhost.realHeight = hauteurJointComplete;
        }
        
        // Créer l'élément joint permanent avec la position exacte du fantôme
        const refElement = this.referenceElement || this.activeBrickForSuggestions;
        const joint = new WallElement({
            type: 'joint', // Type spécifique pour les joints
            material: this.getJointMaterial(refElement), // Utiliser le matériau spécifique aux joints avec l'élément source
            x: finalX,
            y: finalY,
            z: finalZ,
            length: suggestionGhost.dimensions.length,
            width: suggestionGhost.dimensions.width,
            height: suggestionGhost.realHeight || suggestionGhost.dimensions.height, // Utiliser la vraie hauteur si disponible
            rotation: suggestionGhost.rotation
        });
        
        console.log('🔧 Joint créé avec position fantôme:', joint.position);
        console.log('🔧 Position mesh immédiate après création:', joint.mesh.position);
        
        // CORRECTION FORCÉE: Forcer directement la position du mesh Three.js à la position du fantôme
        joint.mesh.position.set(finalX, finalY, finalZ);
        
        // Mettre à jour aussi la position interne de l'objet WallElement
        joint.position.x = finalX;
        joint.position.y = finalY;
        joint.position.z = finalZ;
        
        console.log('🔧 Position mesh après correction forcée:', joint.mesh.position);
        
        // CRITIQUE: Ajouter les métadonnées de joint dans userData pour la détection des couleurs
        joint.mesh.userData.isJoint = true;
        joint.mesh.userData.parentElementType = this.getParentElementTypeForJoint();
        joint.mesh.userData.elementType = 'joint';
        joint.mesh.userData.isVerticalJoint = suggestionGhost.mesh.userData.isVerticalJoint;
        joint.mesh.userData.isHorizontalJoint = suggestionGhost.mesh.userData.isHorizontalJoint;
        
        // 🎯 CORRECTION CRITIQUE: Ajouter l'ID de l'élément parent pour l'undo/redo
        if (refElement && refElement.id) {
            joint.mesh.userData.parentElementId = refElement.id;
            joint.userData = joint.userData || {};
            joint.userData.parentElementId = refElement.id;
            joint.userData.isJoint = true;
            joint.userData.parentElementType = joint.mesh.userData.parentElementType;
            console.log(`🔗 Joint ${joint.id} associé à l'élément parent ${refElement.id}`);
        }
        
        // Appliquer la couleur appropriée selon le type de parent
        this.applyJointColorToElement(joint, joint.mesh.userData.parentElementType, refElement);
        
        // DÉSACTIVATION de la vérification de collision pour les joints
        // Les joints sont censés être en contact direct avec les briques
        if (true) { // !window.SceneManager.checkCollisions(joint)) {
            // IMPORTANT: Marquer cet élément comme joint pour éviter le repositionnement automatique
            joint.isVerticalJoint = suggestionGhost.mesh.userData.isVerticalJoint;
            joint.isHorizontalJoint = suggestionGhost.mesh.userData.isHorizontalJoint;
            
            // NOUVEAU: Stocker le type d'assise de référence dans le joint
            if (this.referenceAssiseType) {
                joint.referenceAssiseType = this.referenceAssiseType;
                // // console.log(`🔧 Type d'assise de référence stocké dans le joint: ${this.referenceAssiseType}`);
            }
            
            // DEBUG: Vérifier les flags de joint
            // // console.log(`🔧 DEBUG Flags de joint sur l'élément:`, {
            //     isVerticalJoint: joint.isVerticalJoint,
            //     isHorizontalJoint: joint.isHorizontalJoint,
            //     originalY: suggestionGhost.position.y
            // });
            
            // CORRECTION CRITIQUE: Stocker la hauteur de l'élément de référence utilisée lors de la création
            if (joint.isVerticalJoint) {
                let referenceHeight = 6.5; // Valeur par défaut
                
                // DEBUG: Vérifier l'état des références
                // // console.log(`🔧 DEBUG État des références:`);
                console.log(`    - this.referenceElement:`, this.referenceElement ? `${this.referenceElement.type} h=${this.referenceElement.dimensions.height}cm` : 'undefined');
                console.log(`    - this.activeBrickForSuggestions:`, this.activeBrickForSuggestions ? `${this.activeBrickForSuggestions.type} h=${this.activeBrickForSuggestions.dimensions.height}cm` : 'undefined');
                
                // D'abord vérifier l'élément de référence stocké lors de l'activation du mode joint
                const refElement = this.referenceElement || this.activeBrickForSuggestions;
                if (refElement) {
                    referenceHeight = refElement.dimensions.height;
                    // // console.log(`🔧 Joint vertical créé avec hauteur de l'élément de référence stocké: ${referenceHeight} cm (type: ${refElement.type})`);
                }
                // En dernier recours, utiliser BrickSelector pour les briques
                else if (window.BrickSelector) {
                    const currentBrick = window.BrickSelector.getCurrentBrick();
                    referenceHeight = currentBrick ? currentBrick.height : 6.5;
                    // // console.log(`🔧 Joint vertical créé avec hauteur brique par défaut: ${referenceHeight} cm`);
                }
                
                joint.originalBrickHeight = referenceHeight;
            }
            
            // Ajouter le joint à la scène dans l'assise de référence
            if (this.referenceAssiseType && this.referenceAssiseIndex !== undefined) {
                // Utiliser l'assise de référence stockée lors de l'activation du mode joint
                // // console.log(`🔧 Placement du joint dans l'assise de référence: ${this.referenceAssiseType} (index: ${this.referenceAssiseIndex})`);
                window.SceneManager.addElementToSpecificAssise(joint, this.referenceAssiseType, this.referenceAssiseIndex);
                
                // Intégration avec le système de calques pour les joints
                if (window.LayerManager) {
                    window.LayerManager.onElementAdded(joint, 'joint-horizontal');
                }
            } else {
                // Fallback: ajouter normalement
                console.log(`⚠️ Pas d'assise de référence trouvée, placement normal`);
                window.SceneManager.addElement(joint);
                
                // Intégration avec le système de calques pour les joints
                if (window.LayerManager) {
                    window.LayerManager.onElementAdded(joint, 'joint-horizontal');
                }
            }
            
            console.log('🔧 Position finale après placement:', joint.position);
            console.log('🔧 Position mesh après placement:', joint.mesh.position);
            
            // Jouer le son de placement
            // Son supprimé
            
            console.log('🔧 Joint placé avec succès');
            
            // Désactiver le mode joint debout et déselectionner la brique APRÈS la création
            this.deactivateSuggestions();
            
            return true;
        } else {
            // Collision détectée
            joint.dispose();
            console.warn('🔧 Collision détectée, placement du joint annulé');
            
            // Jouer le son d'erreur
            // Son supprimé
            
            return false;
        }
    }

    // NOUVELLE FONCTIONNALITÉ: Mode briques adjacentes (clic simple)
    activateAdjacentBricksMode(element, isUserClick = true) {
        // Blocage complet si mode diba actif
        if (this.currentMode === 'diba') {
            console.log('🚫 Mode briques adjacentes bloqué: mode diba actif');
            return;
        }
        if (!element || (element.type !== 'brick' && element.type !== 'block')) return;
        
        console.log('🧱 Activation du mode briques adjacentes pour l\'élément:', element.type, element.id);
        
        // 🔒 NOUVEAU: Si les suggestions sont bloquées par l'interface et que ce n'est pas un clic utilisateur, ne pas réactiver
        if (this.suggestionsDisabledByInterface && !isUserClick) {
            console.log('🔒 BLOCAGE INTERFACE: Mode briques adjacentes bloqué - réactivation nécessite un clic utilisateur');
            return;
        }
        
        // Désactiver les suggestions normales
        this.deactivateSuggestions();
        
        // Réinitialiser le blocage interface SEULEMENT si c'est un clic utilisateur
        if (isUserClick) {
            this.suggestionsDisabledByInterface = false;
        }
        
        // Stocker la brique de référence
        this.activeBrickForSuggestions = element;
        
        // Masquer le fantôme normal
        if (this.ghostElement) {
            this.ghostElement.mesh.visible = false;
        }
        
        // Créer les suggestions de briques adjacentes uniquement
        if (this.currentMode !== 'diba') {
            this.createPlacementSuggestions(element);
        }
        
        // Ajouter un effet visuel à la brique sélectionnée
        this.addPulseEffect(element);
        
        // Activer le mode sélection visuel
        document.body.classList.add('selection-mode');
        
        // Jouer le son d'activation
        // Son supprimé
        
        // Émettre un événement pour l'UI
        document.dispatchEvent(new CustomEvent('adjacentBricksActivated', {
            detail: { element }
        }));
        
        console.log('Mode briques adjacentes activé pour l\'élément:', element.id);
    }

    // NOUVELLE FONCTIONNALITÉ: Mode joints uniquement (Ctrl+clic)
    activateJointMode(element) {
        if (!element || (element.type !== 'brick' && element.type !== 'block')) return;
        
        console.log('🔧 Activation du mode joints pour l\'élément:', element.type, element.id);
        
        // Stocker la brique de référence pour les joints
        this.activeBrickForSuggestions = element;
        this.referenceElement = element; // Stockage supplémentaire pour sécurité
        
        // Stocker l'assise de référence pour placer les joints dans la même assise
        if (window.AssiseManager) {
            this.referenceAssiseType = window.AssiseManager.currentType;
            this.referenceAssiseIndex = window.AssiseManager.currentAssise;
            // // console.log(`🔧 Assise de référence stockée: ${this.referenceAssiseType} (index: ${this.referenceAssiseIndex})`);
        }
        
        // Nettoyer les anciennes suggestions mais GARDER les références pour les joints
        this.clearSuggestions();
        
        // Masquer le fantôme normal
        if (this.ghostElement) {
            this.ghostElement.mesh.visible = false;
        }
        
        // Créer UNIQUEMENT les suggestions de joints
        this.createJointOnlySuggestions(element);
        
        // Ajouter un effet visuel à la brique sélectionnée
        this.addPulseEffect(element);
        
        // Activer le mode sélection visuel
        document.body.classList.add('selection-mode');
        
        // Jouer le son d'activation
        // Son supprimé
        
        // Émettre un événement pour l'UI
        document.dispatchEvent(new CustomEvent('jointModeActivated', {
            detail: { element }
        }));
        
        console.log('Mode joints activé pour l\'élément:', element.id);
    }

    /**
     * Détecte les briques adjacentes à une distance donnée selon le type d'élément
     * @param {WallElement} element - L'élément de référence
     * @param {number} maxDistance - Distance maximale en cm (optionnel, calculée automatiquement si non fournie)
     * @returns {Object} Objet avec les directions où il y a des briques adjacentes
     */
    detectAdjacentBricks(element, maxDistance = null) {
        if (!element || !window.SceneManager || !window.SceneManager.elements) {
            return { left: false, right: false, front: false, back: false };
        }
    // Mode debug joints activable dynamiquement
    const dbg = !!window.enableJointDebug;

        // Si aucune distance n'est fournie, calculer selon le type d'élément
        if (maxDistance === null) {
            const jointSettings = this.getJointSettingsForElement(element);
            maxDistance = jointSettings.verticalThickness / 10; // Conversion mm vers cm
            if (dbg) console.log(`🧪[JOINT-DBG] Base maxDistance=${maxDistance}cm type=${element.type} blockType=${element.blockType}`);
        }

        const pos = element.position;
        const dims = element.dimensions;
        const rotation = element.rotation;
        
        // console.log(`🔍 Début détection adjacence pour ${element.id}:`, { pos, dims, rotation });
        
        // Calculer les vecteurs directionels
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        
        // Calculer les positions des centres des faces panneresses (faces longues)
        const halfLength = dims.length / 2;
        
        // Positions des centres des faces panneresses
        const facePositions = {
            // Face droite (panneresse droite) - centre de cette face
            right: {
                x: pos.x + halfLength * cos,
                z: pos.z + halfLength * sin
            },
            // Face gauche (panneresse gauche) - centre de cette face
            left: {
                x: pos.x - halfLength * cos,
                z: pos.z - halfLength * sin
            }
        };
        
        // console.log(`🔍 Positions des faces:`, facePositions);
        
    const adjacency = { left: false, right: false, front: false, back: false };
    if (dbg) {
        console.log('🧪[JOINT-DBG] Début détection adjacency pour', element.id, 'dims=', dims, 'pos=', pos, 'rot=', rotation.toFixed(3));
        console.log('🧪[JOINT-DBG] Element blockType:', element.blockType, 'type:', element.type);
    }
        let elementsChecked = 0;
        
        // Vérifier chaque élément de la scène
        for (const [id, otherElement] of window.SceneManager.elements.entries()) {
            if (otherElement.id === element.id) {
                continue; // Ignorer l'élément lui-même
            }
            
            if (otherElement.type !== 'brick' && otherElement.type !== 'block') {
                continue; // Ignorer les non-briques/blocs
            }
            
            elementsChecked++;
            
            const otherPos = otherElement.position;
            const otherDims = otherElement.dimensions;
            const otherRotation = otherElement.rotation;
            
            // Calculer les vecteurs directionels de l'autre brique
            const otherCos = Math.cos(otherRotation);
            const otherSin = Math.sin(otherRotation);
            const otherHalfLength = otherDims.length / 2;
            
            // Calculer les centres des faces de l'autre brique
            const otherFacePositions = {
                right: {
                    x: otherPos.x + otherHalfLength * otherCos,
                    z: otherPos.z + otherHalfLength * otherSin
                },
                left: {
                    x: otherPos.x - otherHalfLength * otherCos,
                    z: otherPos.z - otherHalfLength * otherSin
                }
            };
            
            // Vérifier si les faces se touchent (distance ≤ tolérance)
            // Face droite de element avec face gauche de otherElement
            const distanceRightToLeft = Math.sqrt(
                Math.pow(facePositions.right.x - otherFacePositions.left.x, 2) + 
                Math.pow(facePositions.right.z - otherFacePositions.left.z, 2)
            );
            
            // Face gauche de element avec face droite de otherElement
            const distanceLeftToRight = Math.sqrt(
                Math.pow(facePositions.left.x - otherFacePositions.right.x, 2) + 
                Math.pow(facePositions.left.z - otherFacePositions.right.z, 2)
            );
            
            // Distance directe entre centres (pour debug)
            const centerDistance = Math.sqrt(
                Math.pow(pos.x - otherPos.x, 2) + 
                Math.pow(pos.z - otherPos.z, 2)
            );
            
            // Tolérance pour détecter l'adjacence - RÉDUITE pour placement précis
            // Par défaut : épaisseur du joint + 0.5cm (min 1cm)
            let tolerance = Math.max(maxDistance + 0.5, 1.0);

            // CORRECTION: Les blocs coupés (_HALF, _1Q, _3Q) sont souvent positionnés avec des arrondis
            // ou des références de coin différentes => distances calculées légèrement > tolérance.
            // On élargit légèrement la fenêtre pour ces cas afin de permettre l'apparition des joints.
            const isCutType = (el) => {
                if(!el) return false;
                const t = (el.blockType || el.type || '');
                const isCut = /(_HALF|_1Q|_3Q)$/i.test(t);
                if (dbg && isCut) console.log(`🧪[JOINT-DBG] Type coupé détecté: ${el.id} (${t})`);
                return isCut;
            };
            
            const elementIsCut = isCutType(element);
            const otherIsCut = isCutType(otherElement);
            
            if (elementIsCut || otherIsCut) {
                // Augmenter la tolérance d'au moins +1cm (ou +50%) sans dépasser 3cm
                const enlarged = Math.min(Math.max(tolerance * 1.5, tolerance + 1.0), tolerance + 2.0);
                // S'assurer d'un minimum confortable de 2cm pour éviter faux négatifs
                const oldTolerance = tolerance;
                tolerance = Math.max(enlarged, 2.0);
                if (dbg) console.log(`🧪[JOINT-DBG] Tolérance augmentée pour type coupé: ${oldTolerance.toFixed(2)} → ${tolerance.toFixed(2)}cm (element=${elementIsCut}, other=${otherIsCut})`);
            }
            
            if (dbg) console.log(`🧪[JOINT-DBG] Test ${element.id} vs ${otherElement.id}`, {
                centerDistance: centerDistance.toFixed(2),
                dRtoL: distanceRightToLeft.toFixed(2),
                dLtoR: distanceLeftToRight.toFixed(2),
                tolerance: tolerance.toFixed(2)
            });
            
            if (distanceRightToLeft <= tolerance) {
                adjacency.right = true;
                if (dbg) console.log(`✅[JOINT-DBG] Droite OK avec ${otherElement.id} (d=${distanceRightToLeft.toFixed(2)} tol=${tolerance.toFixed(2)})`);
            }
            
            if (distanceLeftToRight <= tolerance) {
                adjacency.left = true;
                if (dbg) console.log(`✅[JOINT-DBG] Gauche OK avec ${otherElement.id} (d=${distanceLeftToRight.toFixed(2)} tol=${tolerance.toFixed(2)})`);
            }
            
            // Méthode alternative : vérifier si les briques sont proches en général
            if (centerDistance <= tolerance + 1.0) { // Utiliser la même tolérance + 1cm de marge
                // Déterminer la direction approximative
                const dx = otherPos.x - pos.x;
                const dz = otherPos.z - pos.z;
                
                // Projeter sur les axes locaux de la brique
                const localDx = dx * cos + dz * sin; // Projection sur axe X local (longueur)
                const localDz = -dx * sin + dz * cos; // Projection sur axe Z local (largeur)
                
                if (Math.abs(localDx) > Math.abs(localDz)) {
                    // Plus dans la direction X (longueur)
                    if (localDx > 0) {
                        adjacency.right = true;
                        if (dbg) console.log(`✅[JOINT-DBG] Droite ALT ${otherElement.id}`);
                    } else {
                        adjacency.left = true;
                        if (dbg) console.log(`✅[JOINT-DBG] Gauche ALT ${otherElement.id}`);
                    }
                }
            }
        }
        
    if (dbg) console.log(`🧪[JOINT-DBG] Fin détection (${elementsChecked} éléments scannés) =>`, adjacency);
        return adjacency;
    }

    /**
     * Crée uniquement un joint horizontal sous la brique
     * @param {WallElement} element - L'élément de référence
     */
    createHorizontalJointOnly(element) {
        console.log(`🔧 [createHorizontalJointOnly] DÉBUT pour élément ${element.id}, blockType=${element.blockType}`);
        
        // 🔧 ISOLANTS: Ne pas créer de joints horizontaux pour les isolants
        if (element.type === 'insulation') {
            console.log('🔧 Isolant détecté - pas de joint horizontal créé dans createHorizontalJointOnly:', element.id);
            return;
        }
    // Variables d'assise locales (éviter global implicite)
    let elementAssiseType = null;
    let elementAssiseIndex = 0;
        
        const basePos = element.position;
        const rotation = element.rotation;
        const dims = element.dimensions;
        
        // Calculer le centre de la face inférieure de la brique
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        
        let centerOffsetX = dims.length / 2;
        let centerOffsetZ = -dims.width / 2;
        
        const rotatedCenterOffsetX = centerOffsetX * cos - centerOffsetZ * sin;
        const rotatedCenterOffsetZ = centerOffsetX * sin + centerOffsetZ * cos;
        
        const brickCenter = {
            x: basePos.x + rotatedCenterOffsetX,
            y: basePos.y,
            z: basePos.z + rotatedCenterOffsetZ
        };
        
        // CORRECTION: Utiliser la même logique corrigée que dans les autres fonctions
        let planZeroAssise = 0;
        
        if (window.AssiseManager) {
            for (const [type, assises] of window.AssiseManager.assisesByType.entries()) {
                for (const [index, assise] of assises.entries()) {
                    if (assise && assise.elements.has(element.id)) {
                        elementAssiseType = type;
                        elementAssiseIndex = index;
                        break;
                    }
                }
            }
            
            if (elementAssiseIndex === 0) {
                planZeroAssise = 0;
            } else {
                // CORRECTION: Utiliser calculateAssiseHeightForType avec elementAssiseIndex + 1
                planZeroAssise = window.AssiseManager.calculateAssiseHeightForType(elementAssiseType, elementAssiseIndex + 1);
                console.log(`🔧 [createHorizontalJointOnly] Plan zéro assise ${elementAssiseIndex}: ${planZeroAssise} cm (calculé avec index ${elementAssiseIndex + 1})`);
            }
        }
        const faceInferieureBrique = brickCenter.y - dims.height / 2;
        let hauteurJointHorizontal = faceInferieureBrique - planZeroAssise;

        // 🔧 RÈGLE SPÉCIALE BÉTON CELLULAIRE (détection renforcée)
        if (element.type === 'block' && element.blockType && (element.blockType.startsWith('BC_') || element.blockType.startsWith('BCA_'))) {
            const hBloc = dims.height || 0;
            // Collecte centres Y des autres blocs cellulaires
            let otherCenters = [];
            if (window.SceneManager && window.SceneManager.elements) {
                for (const el of window.SceneManager.elements.values()) {
                    if (el !== element && el.type === 'block' && el.blockType && (el.blockType.startsWith('BC_') || el.blockType.startsWith('BCA_'))) {
                        otherCenters.push(el.position?.y || 0);
                    }
                }
            }
            // Critère de détection d'une assise supérieure via écart des centres
            if (otherCenters.length > 0) {
                const minCenter = Math.min(...otherCenters);
                const deltaCenter = brickCenter.y - minCenter; // écart centre courant vs premier
                const isUpperByCenter = deltaCenter > hBloc * 0.8; // >80% hauteur bloc ⇒ rangée supérieure probable
                const looksLikeMortar = Math.abs(hauteurJointHorizontal - 1.2) < 0.25; // joint épais détecté
                if ((elementAssiseIndex > 0 || isUpperByCenter) && looksLikeMortar) {
                    console.log(`🔧 Reclass CELLULAR: deltaCenter=${deltaCenter.toFixed(2)} (>${(hBloc*0.8).toFixed(2)}?) assiseIndex=${elementAssiseIndex} ⇒ joint 0.1cm (était ${hauteurJointHorizontal.toFixed(2)}cm)`);
                    hauteurJointHorizontal = 0.1;
                } else if (elementAssiseIndex === 0 && !isUpperByCenter) {
                    // Première assise: normalisation autour de 1.2
                    if (hauteurJointHorizontal < 1.0 || hauteurJointHorizontal > 1.4) {
                        console.log(`🔧 Normalisation mortier base CELLULAR assise 0 à 1.2cm (valeur ${hauteurJointHorizontal.toFixed(2)}cm)`);
                        hauteurJointHorizontal = 1.2;
                    }
                }
            }
        }
        
        if (hauteurJointHorizontal > 0.1) {
            const jointHorizontalDimensions = {
                length: dims.length,
                width: dims.width,
                height: hauteurJointHorizontal
            };
            
            const jointHorizontalPosition = {
                x: brickCenter.x,
                y: planZeroAssise - hauteurJointHorizontal/2, // Joint se termine au plan zéro (face inférieure du joint)
                z: brickCenter.z
            };
            
            const suggestion = this.createVerticalJointGhost(
                jointHorizontalPosition.x, 
                jointHorizontalPosition.y, 
                jointHorizontalPosition.z,
                rotation,
                0xffaa00,
                0,
                'joint-horizontal',
                jointHorizontalDimensions.length,
                jointHorizontalDimensions.width,
                jointHorizontalDimensions.height,
                element // Passer l'élément pour déterminer le matériau du joint
            );
            
            if (suggestion) {
                this.suggestionGhosts.push(suggestion);
                // console.log(`🔧 Joint horizontal créé: ${jointHorizontalDimensions.length}×${jointHorizontalDimensions.width}×${hauteurJointHorizontal.toFixed(1)} cm`);
            }
        }
    }

    // Créer des suggestions de joints uniquement (pas de briques)
    createJointOnlySuggestions(element) {
        if (!element || !this.isInitialized) return;
        
        // Créer des joints pour les briques ET les blocs
        if (element.type !== 'brick' && element.type !== 'block') {
            console.log('🔧 Aucun joint créé - Élément de type:', element.type);
            return;
        }
        
        // Nettoyer les anciennes suggestions
        this.clearSuggestions();
        
        // 🆕 NOUVELLE LOGIQUE: Détecter les briques adjacentes avec distance adaptée
        const adjacency = this.detectAdjacentBricks(element); // Distance calculée automatiquement selon le type
        const hasAdjacentBricks = adjacency.left || adjacency.right || adjacency.front || adjacency.back;
        
        console.log('🔧 Résultat détection adjacence:', adjacency, 'hasAdjacent:', hasAdjacentBricks);
        
        if (!hasAdjacentBricks) {
            console.log('🔧 Aucune brique adjacente détectée - Affichage joint horizontal (si autorisé)');
            if (!(element.type === 'block' && element.blockType && (element.blockType.startsWith('BC_') || element.blockType.startsWith('BCA_'))) ) {
                this.createHorizontalJointOnly(element);
            } else {
                // Déterminer assise via AssiseManager
                let idx = 0;
                if (window.AssiseManager) {
                    const bt = element.blockType.startsWith('BCA_') ? 'CELLULAR' : 'CELLULAR';
                    idx = window.AssiseManager.currentAssiseByType.get(bt) || 0;
                }
                if (idx === 0) {
                    this.createHorizontalJointOnly(element); // première assise seulement
                } else {
                    console.log('🚫 Joint horizontal épais ignoré (CELLULAR assise >0)');
                }
            }
            return;
        }
        
        console.log('🔧 Briques adjacentes détectées - Affichage des joints appropriés');

        const suggestions = [];
        const basePos = element.position;
        const rotation = element.rotation;
        const dims = element.dimensions;
        
        // Calculer le centre de la face inférieure de la brique
        // basePos est le coin inférieur gauche avant, nous voulons le centre de la face inférieure
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        
        // Offset du centre par rapport au coin inférieur gauche AVANT (comme dans updateMeshPosition)
        let centerOffsetX = dims.length / 2;  // vers la droite
        let centerOffsetZ = -dims.width / 2;  // vers l'avant (face visible)
        
        // Appliquer la rotation à l'offset pour obtenir la position du centre
        const rotatedCenterOffsetX = centerOffsetX * cos - centerOffsetZ * sin;
        const rotatedCenterOffsetZ = centerOffsetX * sin + centerOffsetZ * cos;
        
        // Position du centre de la face inférieure de la brique
        const brickCenter = {
            x: basePos.x + rotatedCenterOffsetX,
            y: basePos.y,
            z: basePos.z + rotatedCenterOffsetZ
        };
        
        console.log('🔧 Centre de la brique calculé:', brickCenter);
        
        // Joint vertical spécifique au matériau de l'élément
        const jointVertical = this.getJointVerticalThickness(element); // Épaisseur selon le type d'élément
        
        // CORRECTION: Ne pas créer de joints verticaux si l'épaisseur est 0 (béton cellulaire assises 2+)
        if (jointVertical <= 0) {
            console.log('🚫 Pas de joints verticaux - tentative joint horizontal (colle)');
            // Pour CELLULAR assise >0, joint horizontal fin (0.1cm) seulement si pas déjà créé
            if (element.type === 'block' && element.blockType && (element.blockType.startsWith('BC_') || element.blockType.startsWith('BCA_'))) {
                let idx = 0;
                if (window.AssiseManager) {
                    const bt = 'CELLULAR';
                    idx = window.AssiseManager.currentAssiseByType.get(bt) || 0;
                }
                if (idx === 0) {
                    this.createHorizontalJointOnly(element); // mortier 1.2cm
                } else {
                    // Créer une version forcée 0.1cm si besoin
                    const saved = element.dimensions.height;
                    // Appel classique puis clamp dans createHorizontalJointOnly (déjà géré)
                    this.createHorizontalJointOnly(element);
                }
            } else {
                this.createHorizontalJointOnly(element);
            }
            return;
        }
        
        // Détecter si l'élément est une boutisse (tourné à 90°)
        const normalizedRotation = ((rotation % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
        const isBoutisse = (normalizedRotation > Math.PI / 4 && normalizedRotation < 3 * Math.PI / 4) ||
                          (normalizedRotation > 5 * Math.PI / 4 && normalizedRotation < 7 * Math.PI / 4);
        
        console.log('🔧 Création des joints uniquement - Élément ' + (isBoutisse ? 'en boutisse' : 'en panneresse'));
        
        // Dimensions du joint debout - perpendiculaire au sol, parallèle aux boutisses
        const jointDimensions = {
            length: dims.width, // 9cm (largeur de la brique devient la longueur du joint)
            width: jointVertical, // 1cm (épaisseur du joint)
            height: dims.height // Même hauteur que la brique
        };
        
        // LOGIQUE MODIFIÉE : Placer seulement les joints là où il y a des briques adjacentes
        // Dans le référentiel local de la brique, les panneresses sont les faces perpendiculaires à l'axe X
        // Les joints doivent être parallèles aux boutisses (faces courtes) et perpendiculaires aux panneresses
        
        let jointPositions = [];
        
        // CORRECTION SPÉCIALE POUR BLOCS COUPÉS (_HALF, _1Q, _3Q)
        // Si l'élément est un bloc coupé, on réduit les exigences d'adjacence
        const isElementCut = element.blockType && /(_HALF|_1Q|_3Q)$/i.test(element.blockType);
        
        if (dbg && isElementCut) {
            console.log('🧪[JOINT-DBG] Bloc coupé détecté:', element.blockType, 'adjacency actuelle:', adjacency);
        }
        
        // Pour les blocs coupés, créer les joints gauche/droite par défaut (même sans adjacence parfaite)
        // Cela simule le comportement attendu où un bloc 1/2 devrait avoir des joints disponibles
        let shouldCreateLeft = adjacency.left;
        let shouldCreateRight = adjacency.right;
        
        if (isElementCut) {
            // Pour les blocs coupés, créer des joints par défaut mais pas tous les deux en même temps
            // Logique : si pas d'adjacence détectée, créer au moins un joint du côté attendu
            if (!adjacency.left && !adjacency.right) {
                // Aucune adjacence détectée pour un bloc coupé - créer des joints par défaut
                if (element.blockType.includes('_HALF')) {
                    // Pour les demi-blocs, créer les deux joints (gauche et droite)
                    shouldCreateLeft = true;
                    shouldCreateRight = true;
                    if (dbg) console.log('🧪[JOINT-DBG] Demi-bloc sans adjacence → création joints gauche ET droite par défaut');
                }
            }
        }
        
        // Joint à l'extrémité droite
        if (shouldCreateRight) {
            if (dbg) console.log('🧪[JOINT-DBG] Création joint DROITE pour', element.id, 'raison:', adjacency.right ? 'adjacence détectée' : 'bloc coupé - défaut');
            jointPositions.push({
                x: dims.length/2 + jointVertical/2, // À l'extérieur de la face droite
                z: 0, // Centré sur la largeur
                rotation: rotation + Math.PI/2, // Perpendiculaire à la brique (parallèle aux boutisses)
                type: 'joint-debout-droite' 
            });
        } else if (dbg) {
            console.log('🧪[JOINT-DBG] PAS de joint droite - adjacency.right =', adjacency.right, 'shouldCreateRight =', shouldCreateRight);
        }
        
        // Joint à l'extrémité gauche  
        if (shouldCreateLeft) {
            if (dbg) console.log('🧪[JOINT-DBG] Création joint GAUCHE pour', element.id, 'raison:', adjacency.left ? 'adjacence détectée' : 'bloc coupé - défaut');
            jointPositions.push({
                x: -(dims.length/2 + jointVertical/2), // À l'extérieur de la face gauche
                z: 0, // Centré sur la largeur
                rotation: rotation + Math.PI/2, // Perpendiculaire à la brique (parallèle aux boutisses)
                type: 'joint-debout-gauche' 
            });
        } else if (dbg) {
            console.log('🧪[JOINT-DBG] PAS de joint gauche - adjacency.left =', adjacency.left, 'shouldCreateLeft =', shouldCreateLeft);
        }
        
        // console.log(`🔧 Joints verticaux créés : ${jointPositions.length} sur ${adjacency.left ? 'gauche' : ''}${adjacency.left && adjacency.right ? '+' : ''}${adjacency.right ? 'droite' : ''}`);
        
        // Transformer les positions locales en positions mondiales À PARTIR DU CENTRE DE LA BRIQUE
        // ATTENTION: Les positions locales sont déjà dans le référentiel de la brique tournée
        jointPositions.forEach((localPos, index) => {
            // Appliquer la rotation aux offsets locaux par rapport au centre de la brique
            const rotatedOffsetX = localPos.x * cos - localPos.z * sin;
            const rotatedOffsetZ = localPos.x * sin + localPos.z * cos;
            
            const worldX = brickCenter.x + rotatedOffsetX;
            const worldZ = brickCenter.z + rotatedOffsetZ;
            
            suggestions.push({
                position: { x: worldX, y: brickCenter.y, z: worldZ },
                rotation: localPos.rotation,
                type: localPos.type,
                dimensions: jointDimensions,
                index: index
            });
        });

        // NOUVELLE FONCTIONNALITÉ: Mettre à jour les joints des blocs adjacents
        // Quand on place un bloc (surtout un bloc coupé), il faut réactiver les joints des blocs voisins
        this.updateAdjacentBlockJoints(element);

        // NOUVELLE FONCTIONNALITÉ: Ajouter automatiquement un joint horizontal sous la brique
        
        // Calculer la hauteur de base de l'assise sur laquelle se trouve la brique
        let assiseBaseHeight = 0; // Par défaut assise 0
        let elementAssiseIndex = 0;
        let elementAssiseType = element.type;
        
        if (window.AssiseManager) {
            // Chercher dans quelle assise se trouve l'élément
            let foundAssise = null;
            let foundType = null;
            let foundIndex = null;
            
            // Parcourir tous les types et toutes les assises pour trouver l'élément
            for (const [type, assisesForType] of window.AssiseManager.elementsByType) {
                for (const [assiseIndex, elementsInAssise] of assisesForType) {
                    if (elementsInAssise.has(element.id)) {
                        foundType = type;
                        foundIndex = assiseIndex;
                        foundAssise = assiseIndex;
                        break;
                    }
                }
                if (foundAssise !== null) break;
            }
            
            if (foundAssise !== null) {
                // Élément trouvé dans une assise spécifique
                elementAssiseType = foundType;
                elementAssiseIndex = foundIndex;
                assiseBaseHeight = window.AssiseManager.getAssiseHeightForType(foundType, foundIndex);
                // // console.log(`🔧 Élément trouvé dans l'assise ${foundIndex} du type ${foundType}, hauteur de base: ${assiseBaseHeight} cm`);
            } else {
                // Élément non trouvé dans les assises, utiliser l'assise courante
                elementAssiseType = element.type;
                elementAssiseIndex = window.AssiseManager.currentAssiseByType.get(elementAssiseType) || 0;
                assiseBaseHeight = window.AssiseManager.getAssiseHeightForType(elementAssiseType, elementAssiseIndex);
                // // console.log(`🔧 Élément non trouvé dans les assises, utilisation de l'assise courante ${elementAssiseIndex} du type ${elementAssiseType}, hauteur: ${assiseBaseHeight} cm`);
            }
        }
        
        // Calculer la hauteur du joint : depuis la face inférieure de l'élément jusqu'au plan zéro de l'assise
        const faceInferieureBrique = brickCenter.y - (dims.height / 2); // Face inférieure = centre - demi-hauteur
        
        // CORRECTION: Le plan zéro de l'assise selon la logique d'AssiseManager
        let planZeroAssise = 0;
        if (elementAssiseIndex === 0) {
            // Pour l'assise 0, le plan zéro est à Y=0
            planZeroAssise = 0;
        } else {
            // CORRECTION: Pour les autres assises, utiliser le plan de l'ASSISE COURANTE
            // Le joint doit s'arrêter au plan de l'assise où se trouve l'élément
            // BUGFIX: calculateAssiseHeightForType(index) retourne la hauteur jusqu'à l'index-1
            // Donc pour l'assise courante (elementAssiseIndex), on doit calculer jusqu'à elementAssiseIndex+1
            planZeroAssise = window.AssiseManager.calculateAssiseHeightForType(elementAssiseType, elementAssiseIndex + 1);
            
            console.log(`🔧 [TIMESTAMP-${Date.now()}] Joint horizontal assise ${elementAssiseIndex}: plan zéro assise courante = ${planZeroAssise} cm (calculé avec index ${elementAssiseIndex + 1})`);
        }
        
        let hauteurJointHorizontal = faceInferieureBrique - planZeroAssise;
        
        // CORRECTION SPÉCIALE: Pour l'assise 0, le joint horizontal doit avoir exactement l'épaisseur prévue
        if (elementAssiseIndex === 0) {
            const jointHeightExpected = window.AssiseManager.getJointHeightForAssise(elementAssiseType, 0);
            // // console.log(`🔧 Assise 0 - Hauteur joint attendue: ${jointHeightExpected} cm, calculée: ${hauteurJointHorizontal} cm`);
            
            // Si l'élément est bien positionné (face inférieure proche de 1.2cm), utiliser la hauteur exacte
            if (Math.abs(faceInferieureBrique - jointHeightExpected) < 0.1) {
                hauteurJointHorizontal = jointHeightExpected;
                // // console.log(`🔧 Utilisation de la hauteur exacte du joint: ${hauteurJointHorizontal} cm`);
            }
        }
        
        // Si la hauteur calculée est trop petite (élément bien positionné), utiliser la hauteur réelle
        if (hauteurJointHorizontal <= 0.1) {
            // Si la hauteur est vraiment petite, utiliser la hauteur réelle calculée
            // // console.log(`🔧 Hauteur joint horizontal très petite: ${hauteurJointHorizontal} cm`);
        }
        
        // // console.log(`🔧 Calcul joint horizontal:`, {
        //     centreBrique: brickCenter.y,
        //     hauteurBrique: dims.height,
        //     faceInferieureBrique: faceInferieureBrique,
        //     planZeroAssise: planZeroAssise,
        //     assiseIndex: elementAssiseIndex,
        //     hauteurJoint: hauteurJointHorizontal
        // });
        
        // Vérifier que la hauteur du joint est positive
        if (hauteurJointHorizontal <= 0) {
            console.warn(`🔧 Hauteur de joint horizontal invalide (${hauteurJointHorizontal} cm) - Face inférieure de la brique en dessous du plan zéro`);
        } else {
            // Dimensions du joint horizontal - même surface au sol que la brique
            const jointHorizontalDimensions = {
                length: dims.length, // Même longueur que la brique
                width: dims.width,   // Même largeur que la brique
                height: hauteurJointHorizontal // Hauteur calculée pour remplir l'espace
            };
            
            // Position du joint horizontal - centré entre le plan zéro de l'assise et la face inférieure de la brique
            const jointHorizontalPosition = {
                x: brickCenter.x,
                y: planZeroAssise - hauteurJointHorizontal/2, // Joint se termine au plan zéro (face inférieure du joint)
                z: brickCenter.z
            };
            
            // // console.log(`🔧 Position joint horizontal:`, {
            //     centreX: brickCenter.x,
            //     centreY: jointHorizontalPosition.y,
            //     centreZ: brickCenter.z,
            //     rangeY: `${planZeroAssise} à ${faceInferieureBrique}`,
            //     hauteurJoint: hauteurJointHorizontal
            // });
            
            // Ajouter le joint horizontal aux suggestions
            suggestions.push({
                position: jointHorizontalPosition,
                rotation: rotation, // Même orientation que la brique
                type: 'joint-horizontal',
                dimensions: jointHorizontalDimensions,
                index: suggestions.length,
                isHorizontalJoint: true
            });
            
            // // console.log(`🔧 Joint horizontal ajouté: ${dims.length}×${dims.width}×${hauteurJointHorizontal.toFixed(1)} cm à Y=${jointHorizontalPosition.y.toFixed(1)}`);
        }

        // Créer les fantômes pour les joints verticaux
        const verticalSuggestions = suggestions.filter(s => !s.isHorizontalJoint);
        verticalSuggestions.forEach((suggestion, index) => {
            const ghost = this.createJointGhost(suggestion.position, suggestion.rotation, suggestion.dimensions);
            if (ghost) {
                ghost.mesh.userData.suggestionIndex = index;
                ghost.mesh.userData.suggestionType = suggestion.type;
                ghost.mesh.userData.isVerticalJoint = true;
                this.suggestionGhosts.push(ghost);
            }
        });

        // Créer le fantôme pour le joint horizontal
        const horizontalSuggestion = suggestions.find(s => s.isHorizontalJoint);
        if (horizontalSuggestion) {
            const ghost = this.createJointGhost(horizontalSuggestion.position, horizontalSuggestion.rotation, horizontalSuggestion.dimensions, true);
            if (ghost) {
                ghost.mesh.userData.suggestionIndex = horizontalSuggestion.index;
                ghost.mesh.userData.suggestionType = horizontalSuggestion.type;
                ghost.mesh.userData.isHorizontalJoint = true;
                this.suggestionGhosts.push(ghost);
            }
        }
        
        // // console.log(`🔧 ${suggestions.length} suggestions de joints créées`);
    }

    /**
     * Met à jour les joints des blocs adjacents quand un nouveau bloc est placé
     * @param {Object} newElement - Le nouveau bloc qui vient d'être placé
     */
    updateAdjacentBlockJoints(newElement) {
        if (!newElement || !window.SceneManager || !window.SceneManager.elements) return;
        
        const dbg = !!window.enableJointDebug;
        if (dbg) console.log('🧪[JOINT-DBG] Mise à jour joints adjacents pour', newElement.id, newElement.blockType);
        
        // Parcourir tous les éléments existants pour trouver ceux qui sont adjacents au nouveau
        for (const [id, existingElement] of window.SceneManager.elements.entries()) {
            if (existingElement.id === newElement.id) continue;
            if (existingElement.type !== 'brick' && existingElement.type !== 'block') continue;
            
            // Calculer si le bloc existant est adjacent au nouveau bloc
            const adjacency = this.calculateAdjacencyBetween(existingElement, newElement);
            
            if (adjacency.left || adjacency.right) {
                if (dbg) console.log('🧪[JOINT-DBG] Bloc adjacent trouvé:', existingElement.id, 'adjacency:', adjacency);
                
                // Créer les joints pour le bloc existant en mode silencieux
                this.createAdditionalJointsForElement(existingElement, adjacency);
            }
        }
    }

    /**
     * Calcule l'adjacence entre deux éléments spécifiques
     * @param {Object} element1 - Premier élément  
     * @param {Object} element2 - Deuxième élément
     * @returns {Object} Adjacence de element1 par rapport à element2
     */
    calculateAdjacencyBetween(element1, element2) {
        const pos1 = element1.position;
        const dims1 = element1.dimensions;
        const rotation1 = element1.rotation;
        
        const pos2 = element2.position;
        const dims2 = element2.dimensions;
        
        // Calculer la distance maximale acceptable (épaisseur joint + tolérance)
        const jointSettings = this.getJointSettingsForElement(element1);
        let maxDistance = jointSettings.verticalThickness / 10; // Conversion mm vers cm
        
        // Ajuster pour les types coupés
        const isCut1 = element1.blockType && /(_HALF|_1Q|_3Q)$/i.test(element1.blockType);
        const isCut2 = element2.blockType && /(_HALF|_1Q|_3Q)$/i.test(element2.blockType);
        
        if (isCut1 || isCut2) {
            maxDistance = Math.max(maxDistance * 1.5 + 1.0, 2.5); // Tolérance élargie pour types coupés
        }
        
        // Calculer les positions des faces de element1
        const cos1 = Math.cos(rotation1);
        const sin1 = Math.sin(rotation1);
        const halfLength1 = dims1.length / 2;
        
        const face1Positions = {
            right: {
                x: pos1.x + halfLength1 * cos1,
                z: pos1.z + halfLength1 * sin1
            },
            left: {
                x: pos1.x - halfLength1 * cos1,
                z: pos1.z - halfLength1 * sin1
            }
        };
        
        // Calculer les distances vers element2 (centre)
        const distanceRightTo2 = Math.sqrt(
            Math.pow(face1Positions.right.x - pos2.x, 2) + 
            Math.pow(face1Positions.right.z - pos2.z, 2)
        );
        
        const distanceLeftTo2 = Math.sqrt(
            Math.pow(face1Positions.left.x - pos2.x, 2) + 
            Math.pow(face1Positions.left.z - pos2.z, 2)
        );
        
        const tolerance = maxDistance + 0.5;
        
        return {
            left: distanceLeftTo2 <= tolerance,
            right: distanceRightTo2 <= tolerance,
            front: false,
            back: false
        };
    }

    /**
     * Crée des joints supplémentaires pour un élément existant
     * @param {Object} element - L'élément pour lequel créer les joints
     * @param {Object} adjacency - Information d'adjacence
     */
    createAdditionalJointsForElement(element, adjacency) {
        const dbg = !!window.enableJointDebug;
        
        // Vérifier qu'il n'y a pas déjà des joints actifs pour cet élément
        if (this.activeBrickForSuggestions && this.activeBrickForSuggestions.id === element.id) {
            if (dbg) console.log('🧪[JOINT-DBG] Joints déjà actifs pour', element.id, '- mise à jour');
            // Recréer les suggestions avec la nouvelle adjacence
            this.clearSuggestions();
            this.createJointOnlySuggestions(element);
            return;
        }
        
        // Créer des joints fantômes temporaires pour montrer la nouvelle possibilité
        if (dbg) console.log('🧪[JOINT-DBG] Création joints supplémentaires pour', element.id);
        
        const jointVertical = this.getJointVerticalThickness(element);
        if (jointVertical <= 0) return;
        
        const rotation = element.rotation;
        const dims = element.dimensions;
        
        // Calculer le centre de l'élément
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const centerOffsetX = dims.length / 2;
        const centerOffsetZ = -dims.width / 2;
        const rotatedCenterOffsetX = centerOffsetX * cos - centerOffsetZ * sin;
        const rotatedCenterOffsetZ = centerOffsetX * sin + centerOffsetZ * cos;
        
        const elementCenter = {
            x: element.position.x + rotatedCenterOffsetX,
            y: element.position.y,
            z: element.position.z + rotatedCenterOffsetZ
        };
        
        const jointDimensions = {
            length: dims.width,
            width: jointVertical,
            height: dims.height
        };
        
        // Créer joints selon l'adjacence détectée
        if (adjacency.right) {
            const jointPos = {
                x: dims.length/2 + jointVertical/2,
                z: 0,
                rotation: rotation + Math.PI/2
            };
            
            const rotatedOffsetX = jointPos.x * cos - jointPos.z * sin;
            const rotatedOffsetZ = jointPos.x * sin + jointPos.z * cos;
            
            const worldX = elementCenter.x + rotatedOffsetX;
            const worldZ = elementCenter.z + rotatedOffsetZ;
            
            if (dbg) console.log('🧪[JOINT-DBG] Joint droite supplémentaire créé pour', element.id);
            
            // Créer un fantôme temporaire et l'ajouter aux suggestions
            const suggestion = this.createVerticalJointGhost(
                worldX, elementCenter.y, worldZ,
                jointPos.rotation,
                'joint-debout-droite',
                jointDimensions.length,
                jointDimensions.width,
                jointDimensions.height,
                element
            );
            
            if (suggestion) {
                // Marquer comme joint supplémentaire pour différenciation visuelle
                suggestion.isAdditionalJoint = true;
                this.suggestionGhosts.push(suggestion);
            }
        }
        
        if (adjacency.left) {
            const jointPos = {
                x: -(dims.length/2 + jointVertical/2),
                z: 0,
                rotation: rotation + Math.PI/2
            };
            
            const rotatedOffsetX = jointPos.x * cos - jointPos.z * sin;
            const rotatedOffsetZ = jointPos.x * sin + jointPos.z * cos;
            
            const worldX = elementCenter.x + rotatedOffsetX;
            const worldZ = elementCenter.z + rotatedOffsetZ;
            
            if (dbg) console.log('🧪[JOINT-DBG] Joint gauche supplémentaire créé pour', element.id);
            
            const suggestion = this.createVerticalJointGhost(
                worldX, elementCenter.y, worldZ,
                jointPos.rotation,
                'joint-debout-gauche',
                jointDimensions.length,
                jointDimensions.width,
                jointDimensions.height,
                element
            );
            
            if (suggestion) {
                suggestion.isAdditionalJoint = true;
                this.suggestionGhosts.push(suggestion);
            }
        }
    }

    // Créer un fantôme de joint avec des dimensions spécifiques
    createJointGhost(position, rotation, dimensions, isHorizontal = false) {
        if (!this.isInitialized) return null;
        
        try {
            // Géométrie du joint - dimensions directement en centimètres comme le reste de la scène
            const geometry = new THREE.BoxGeometry(
                dimensions.length, // Pas de division par 100 - la scène est en cm
                dimensions.height,
                dimensions.width
            );
            
            // Matériau transparent pour le joint avec couleur différente selon le type
            const material = new THREE.MeshLambertMaterial({
                color: isHorizontal ? 0x0088ff : 0xffaa00, // Bleu pour horizontal, Orange pour vertical
                transparent: true,
                opacity: isHorizontal ? 0.5 : 0.6, // Légèrement plus transparent pour le joint horizontal
                wireframe: false
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(position.x, position.y, position.z); // Pas de division par 100
            mesh.rotation.y = rotation;
            
            // Ajouter à la scène
            window.SceneManager.scene.add(mesh);
            
            return {
                mesh: mesh,
                position: position,
                rotation: rotation,
                dimensions: dimensions,
                dispose: () => {
                    window.SceneManager.scene.remove(mesh);
                    geometry.dispose();
                    material.dispose();
                }
            };
        } catch (error) {
            console.error('Erreur lors de la création du fantôme de joint:', error);
            return null;
        }
    }

    // === MÉTHODE POUR RECRÉER LES ÉLÉMENTS ===
    
    createElementFromData(elementData) {
        try {
            const type = elementData.type;
            const material = window.MaterialLibrary.getMaterial(elementData.material || 'brick-red');
            
            // Déterminer le type d'élément et utiliser la méthode appropriée
            if (type.startsWith('M')) {
                // C'est une brique
                return this.createBrickElement(type, material, elementData);
            } else if (type.startsWith('B')) {
                // C'est un bloc
                return this.createBlockElement(type, material, elementData);
            } else if (type.includes('PUR') || type.includes('LAINE')) {
                // C'est un isolant
                return this.createInsulationElement(type, material, elementData);
            } else if (type.startsWith('L')) {
                // C'est un linteau
                return this.createLinteauElement(type, material, elementData);
            }
            
            console.warn('Type d\'élément non reconnu:', type);
            return null;
            
        } catch (error) {
            console.error('Erreur lors de la création d\'élément à partir des données:', error);
            return null;
        }
    }

    createBrickElement(type, material, elementData) {
        console.log('🧱 createBrickElement: type =', type, 'elementData =', elementData);
        
        // ✅ CORRECTION: Utiliser le bon format d'options pour WallElement
        const element = new WallElement({
            brickType: type,
            material: material,
            type: 'brick'
        });
        this.setupElementUserData(element, elementData);
        return element.mesh;
    }

    createBlockElement(type, material, elementData) {
        // ✅ CORRECTION: Utiliser le bon format d'options pour WallElement
        const element = new WallElement({
            blockType: type,
            material: material,
            type: 'block'
        });
        this.setupElementUserData(element, elementData);
        return element.mesh;
    }

    createInsulationElement(type, material, elementData) {
        // ✅ CORRECTION: Utiliser le bon format d'options pour WallElement
        const element = new WallElement({
            blockType: type,
            material: material,
            type: 'insulation'
        });
        this.setupElementUserData(element, elementData);
        return element.mesh;
    }

    createLinteauElement(type, material, elementData) {
        // ✅ CORRECTION: Utiliser le bon format d'options pour WallElement
        // 🎨 FORCAGE COULEUR: Les linteaux doivent toujours être en béton gris
        const concreteMaterial = window.MaterialLibrary
            ? window.MaterialLibrary.getMaterial('concrete')
            : material; // fallback si librairie indisponible

        const element = new WallElement({
            blockType: type,
            material: concreteMaterial,
            type: 'linteau'
        });
        // S'assurer que userData reflète le matériau béton
        if (element && element.mesh && concreteMaterial) {
            element.mesh.userData.material = 'concrete';
        }
        this.setupElementUserData(element, elementData);
        return element.mesh;
    }

    setupElementUserData(element, elementData) {
        if (element.mesh) {
            element.mesh.userData.isPlacedElement = true;
            element.mesh.userData.type = elementData.type;
            element.mesh.userData.dimensions = elementData.dimensions;
            element.mesh.userData.material = elementData.material;
            element.mesh.userData.timestamp = elementData.timestamp;
        }
    }

    // === MÉTHODES POUR L'ONGLET JOINTS ===
    
    // ========== JOINTS DE BRIQUES ==========
    
    setBrickJointThickness(thickness) {
        this.brickJointThickness = thickness;
        // console.log(`🧱 Épaisseur joint briques définie: ${thickness}mm`);
        this.updateBrickJointsInScene();
    }

    setBrickJointColor(color) {
        // console.log(`🎯 CONSTRUCTION TOOLS - setBrickJointColor reçu: ${color}`);
        this.brickJointColor = color;
        // console.log(`🧱 Couleur joint briques définie: ${color} (défaut pour futurs éléments)`);
        // console.log('🔍 État interne brickJointColor après update:', this.brickJointColor);
        
        // Debug pour voir ce qui se trouve dans la scène (avec délai pour permettre l'ajout)
        setTimeout(() => {
            this.debugJointsInScene();
        }, 100);
        
        this.updateBrickJointColorsInScene();
    }

    toggleBrickJoints(show) {
        this.showBrickJoints = show;
        this.updateBrickJointVisibility(show);
        console.log(`🧱 Joints briques ${show ? 'affichés' : 'masqués'}`);
    }

    setAutoBrickJoints(enabled) {
        this.autoBrickJoints = enabled;
        // console.log(`🧱 Joints briques automatiques: ${enabled ? 'activés' : 'désactivés'}`);
    }

    // ========== JOINTS DE BLOCS ==========
    
    setBlockJointThickness(thickness) {
        this.blockJointThickness = thickness;
        // console.log(`🧊 Épaisseur joint blocs définie: ${thickness}mm`);
        this.updateBlockJointsInScene();
    }

    setBlockJointColor(color) {
        this.blockJointColor = color;
        // console.log(`🧊 Couleur joint blocs définie: ${color} (défaut pour futurs éléments)`);
        this.updateBlockJointColorsInScene();
    }

    toggleBlockJoints(show) {
        this.showBlockJoints = show;
        this.updateBlockJointVisibility(show);
        console.log(`🧊 Joints blocs ${show ? 'affichés' : 'masqués'}`);
    }

    setAutoBlockJoints(enabled) {
        this.autoBlockJoints = enabled;
        // console.log(`🧊 Joints blocs automatiques: ${enabled ? 'activés' : 'désactivés'}`);
    }

    // ========== MÉTHODES POUR JOINTS SPÉCIALISÉS PAR MATÉRIAU ==========

    /**
     * Détermine l'assise actuelle pour les blocs cellulaires de manière robuste
     * Cette méthode essaie plusieurs approches pour s'assurer que l'index est correct
     * @returns {number} Index de l'assise actuelle pour les blocs cellulaires (0-based)
     */
    getCurrentCellularAssiseIndex() {
        let currentAssiseIndex = 0;
        
        console.log(`🔍 [getCurrentCellularAssiseIndex] Début de la détection`);
        
        if (window.AssiseManager) {
            // Approche prioritaire: Analyser les niveaux Y des blocs cellulaires existants
            if (window.SceneManager && window.SceneManager.elements) {
                console.log(`🔍 [getCurrentCellularAssiseIndex] Analyse des éléments de la scène (${window.SceneManager.elements.size} éléments)`);
                
                const cellularElements = [];
                for (const el of window.SceneManager.elements.values()) {
                    if (el.type === 'block') {
                        const isCellular = (el.blockType && (el.blockType.startsWith('BC_') || el.blockType.startsWith('BCA_'))) || el.material === 'cellular-concrete';
                        if (isCellular) {
                            const element = {
                                id: el.id,
                                baseY: el.position?.y ?? 0,
                                height: el.dimensions?.height ?? 25,
                                blockType: el.blockType,
                                material: el.material
                            };
                            cellularElements.push(element);
                            console.log(`🔍 [getCurrentCellularAssiseIndex] Bloc cellulaire trouvé: ${element.id}, baseY=${element.baseY.toFixed(2)}, blockType=${element.blockType}`);
                        }
                    }
                }
                
                console.log(`🔍 [getCurrentCellularAssiseIndex] ${cellularElements.length} blocs cellulaires trouvés`);
                
                if (cellularElements.length > 0) {
                    // Regrouper par niveaux avec tolérance
                    const levels = [];
                    const TOL = 0.5; // tolérance plus large pour regroupement
                    
                    console.log(`🔍 [getCurrentCellularAssiseIndex] Regroupement par niveaux (tolérance=${TOL}cm)`);
                    
                    for (const el of cellularElements) {
                        let foundLevel = false;
                        for (const level of levels) {
                            if (Math.abs(level.avgY - el.baseY) < TOL) {
                                level.elements.push(el);
                                level.avgY = level.elements.reduce((sum, e) => sum + e.baseY, 0) / level.elements.length;
                                console.log(`🔍 [getCurrentCellularAssiseIndex] Bloc ${el.id} ajouté au niveau existant ${level.index}, nouvelle avgY=${level.avgY.toFixed(2)}`);
                                foundLevel = true;
                                break;
                            }
                        }
                        if (!foundLevel) {
                            const newLevel = {
                                index: levels.length,
                                avgY: el.baseY,
                                elements: [el]
                            };
                            levels.push(newLevel);
                            console.log(`🔍 [getCurrentCellularAssiseIndex] Nouveau niveau ${newLevel.index} créé avec bloc ${el.id}, avgY=${newLevel.avgY.toFixed(2)}`);
                        }
                    }
                    
                    // Trier les niveaux par hauteur
                    levels.sort((a, b) => a.avgY - b.avgY);
                    
                    // Réassigner les index après tri
                    levels.forEach((level, index) => {
                        level.index = index;
                    });
                    
                    // L'assise courante est celle du niveau le plus haut
                    currentAssiseIndex = levels.length - 1;
                    
                    console.log(`🔍 [getCurrentCellularAssiseIndex] Résultat final:`);
                    console.log(`🔍 [getCurrentCellularAssiseIndex] - ${levels.length} niveau(x) détecté(s)`);
                    console.log(`🔍 [getCurrentCellularAssiseIndex] - Assise courante = ${currentAssiseIndex}`);
                    
                    levels.forEach((level, i) => {
                        console.log(`🔍 [getCurrentCellularAssiseIndex] - Niveau ${i}: Y=${level.avgY.toFixed(2)}cm, ${level.elements.length} bloc(s): [${level.elements.map(e => e.id).join(', ')}]`);
                    });
                    
                    console.log(`🏗️ Détection niveaux béton cellulaire: ${levels.length} niveau(x), assise courante = ${currentAssiseIndex}`);
                    console.log(`🏗️ Niveaux détectés:`, levels.map((l, i) => `Assise ${i}: Y=${l.avgY.toFixed(2)} (${l.elements.length} blocs)`));
                    return currentAssiseIndex;
                } else {
                    console.log(`🔍 [getCurrentCellularAssiseIndex] Aucun bloc cellulaire trouvé dans la scène`);
                }
            } else {
                console.log(`🔍 [getCurrentCellularAssiseIndex] SceneManager ou elements non disponible`);
            }
            
            // Fallback: Vérifier directement le type CELLULAR
            const cellularAssiseIndex = window.AssiseManager.currentAssiseByType.get('CELLULAR');
            if (cellularAssiseIndex !== undefined) {
                currentAssiseIndex = cellularAssiseIndex;
                console.log(`🔍 [getCurrentCellularAssiseIndex] Fallback 1: Assise CELLULAR trouvée directement: ${currentAssiseIndex}`);
                console.log(`🏗️ Assise CELLULAR trouvée directement: ${currentAssiseIndex}`);
                return currentAssiseIndex;
            } else {
                console.log(`🔍 [getCurrentCellularAssiseIndex] Fallback 1: Aucune assise CELLULAR dans currentAssiseByType`);
            }
            
            // Fallback: Si le type courant est CELLULAR, utiliser l'assise courante
            if (window.AssiseManager.currentType === 'CELLULAR') {
                currentAssiseIndex = window.AssiseManager.getCurrentAssise();
                console.log(`🔍 [getCurrentCellularAssiseIndex] Fallback 2: Type courant est CELLULAR, assise courante: ${currentAssiseIndex}`);
                console.log(`🏗️ Type courant est CELLULAR, assise courante: ${currentAssiseIndex}`);
                return currentAssiseIndex;
            } else {
                console.log(`🔍 [getCurrentCellularAssiseIndex] Fallback 2: Type courant n'est pas CELLULAR (${window.AssiseManager.currentType})`);
            }
            
            // Fallback: Vérifier s'il y a des éléments cellulaires dans les assises existantes
            if (window.AssiseManager.elementsByType && window.AssiseManager.elementsByType.has('CELLULAR')) {
                const cellularAssises = window.AssiseManager.elementsByType.get('CELLULAR');
                if (cellularAssises && cellularAssises.size > 0) {
                    const maxAssiseIndex = Math.max(...cellularAssises.keys());
                    currentAssiseIndex = maxAssiseIndex;
                    console.log(`🔍 [getCurrentCellularAssiseIndex] Fallback 3: Assise CELLULAR la plus élevée avec éléments: ${currentAssiseIndex}`);
                    console.log(`🏗️ Assise CELLULAR la plus élevée avec éléments: ${currentAssiseIndex}`);
                    return currentAssiseIndex;
                } else {
                    console.log(`🔍 [getCurrentCellularAssiseIndex] Fallback 3: elementsByType CELLULAR vide`);
                }
            } else {
                console.log(`🔍 [getCurrentCellularAssiseIndex] Fallback 3: Pas de elementsByType CELLULAR`);
            }
        } else {
            console.log(`🔍 [getCurrentCellularAssiseIndex] AssiseManager non disponible`);
        }
        
        console.log(`🔍 [getCurrentCellularAssiseIndex] Retour de l'assise par défaut: ${currentAssiseIndex}`);
        console.log(`🏗️ Utilisation de l'assise par défaut: ${currentAssiseIndex}`);
        return currentAssiseIndex;
    }

    /**
     * Compte le nombre de blocs cellulaires dans la scène
     * @returns {number} Nombre de blocs cellulaires
     */
    countCellularBlocksInScene() {
        let count = 0;
        if (window.SceneManager && window.SceneManager.elements) {
            for (const [id, element] of window.SceneManager.elements.entries()) {
                if (element.type === 'block' && element.blockType) {
                    if (element.blockType.startsWith('BC_') || element.blockType.startsWith('BCA_')) {
                        count++;
                    }
                }
                // Vérifier aussi via BlockSelector si disponible
                else if (element.type === 'block' && window.BlockSelector) {
                    try {
                        const blockData = window.BlockSelector.getCurrentBlockData();
                        if (blockData && (blockData.category === 'cellular' || blockData.category === 'cellular-assise')) {
                            count++;
                        }
                    } catch (error) {
                        // Ignorer les erreurs de détection
                    }
                }
            }
        }
        return count;
    }

    /**
     * Détermine les paramètres de joints selon le type d'élément et son matériau
     * IMPORTANT: Les joints verticaux sont FIXES à 1cm (10mm) pour tous les éléments de construction
     * Seuls les joints horizontaux peuvent être modifiés via l'interface utilisateur
     * @param {Object} element - L'élément pour lequel déterminer les paramètres
     * @returns {Object} - Paramètres de joints { createJoints, horizontalThickness, verticalThickness }
     */
    getJointSettingsForElement(element) {
        // Vérifier d'abord le type d'élément
        if (element.type === 'insulation') {
            // Les isolants ne créent jamais de joints
            return this.materialJointSettings['insulation'] || { createJoints: false, horizontalThickness: 0, verticalThickness: 0 };
        }

        // Pour les blocs, déterminer le sous-type selon blockType
        if (element.type === 'block' && element.blockType) {
            const blockType = element.blockType;
            
            // Béton cellulaire standard (BC_*) : joints selon l'assise
            if (blockType.startsWith('BC_')) {
                // Déterminer l'assise actuelle pour les blocs cellulaires avec détection améliorée
                let currentAssiseIndex = this.getCurrentCellularAssiseIndex();
                
                console.log(`🔍 DIAGNOSTIC BC_: Assise index=${currentAssiseIndex}, nouvelle numérotation=${currentAssiseIndex + 1}`);

                // Vérification supplémentaire: si on place un nouvel élément, recalculer l'assise réelle
                if (element.position && element.dimensions) {
                    const elementBaseY = element.position.y;
                    const elementHeight = element.dimensions.height;
                    
                    console.log(`🔍 [BC_] Vérification position élément: baseY=${elementBaseY.toFixed(2)}, height=${elementHeight.toFixed(2)}`);
                    
                    // Collecter les bases des autres blocs cellulaires
                    const otherBases = [];
                    if (window.SceneManager && window.SceneManager.elements) {
                        for (const el of window.SceneManager.elements.values()) {
                            if (el !== element && el.type === 'block' && el.blockType && el.blockType.startsWith('BC_')) {
                                const baseY = el.position?.y || 0;
                                otherBases.push(baseY);
                                console.log(`🔍 [BC_] Autre bloc BC_ trouvé: ${el.id}, baseY=${baseY.toFixed(2)}`);
                            }
                        }
                    }
                    
                    console.log(`🔍 [BC_] ${otherBases.length} autres blocs BC_ trouvés`);
                    
                    if (otherBases.length > 0) {
                        const minBase = Math.min(...otherBases);
                        const seuil = minBase + elementHeight * 0.8;
                        
                        console.log(`🔍 [BC_] minBase=${minBase.toFixed(2)}, seuil=${seuil.toFixed(2)} (minBase + ${elementHeight.toFixed(2)} * 0.8)`);
                        
                        if (elementBaseY > seuil) {
                            console.log(`🔍 [BC_] Condition remplie: ${elementBaseY.toFixed(2)} > ${seuil.toFixed(2)} → Correction assise`);
                            console.log(`🔍 Correction assise BC_: baseY=${elementBaseY.toFixed(2)} > seuil=${seuil.toFixed(2)} → assise supérieure détectée`);
                            const oldIndex = currentAssiseIndex;
                            currentAssiseIndex = Math.max(1, currentAssiseIndex);
                            console.log(`🔍 [BC_] Assise corrigée: ${oldIndex} → ${currentAssiseIndex}`);
                        } else {
                            console.log(`🔍 [BC_] Condition non remplie: ${elementBaseY.toFixed(2)} <= ${seuil.toFixed(2)} → Pas de correction`);
                        }
                    } else {
                        console.log(`🔍 [BC_] Aucun autre bloc BC_ → Premier bloc, assise 0`);
                    }
                } else {
                    console.log(`🔍 [BC_] Pas de position/dimensions disponibles pour la vérification`);
                }
                
                if (currentAssiseIndex === 0) {
                    // Première assise (assise 1) : joint au sol 1.2cm, ZÉRO vertical
                    console.log(`🏗️ Bloc BC_ - ASSISE 1 (index 0) : joint au sol 1.2cm, 0mm vertical (blockType: ${blockType})`);
                    return { 
                        createJoints: true, 
                        horizontalThickness: 12, // 1.2cm = 12mm (joint au sol)
                        verticalThickness: 0     // 0mm - PAS de joints verticaux pour béton cellulaire (TOUTES assises)
                    };
                } else {
                    // Normaliser les joints existants trop épais sur les assises supérieures
                    this.normalizeCellularSecondCourseJoints();
                    // Dédupliquer si un joint mortier (1.2) s'est déjà créé avant mise à jour d'assise
                    this.dedupeCellularHorizontalJoints();
                    // Assises suivantes (assise 2+) : joints de 1mm horizontal, ZÉRO vertical (demande utilisateur)
                    console.log(`🏗️ Bloc BC_ - ASSISE ${currentAssiseIndex + 1} (index ${currentAssiseIndex}) : joints colle 1mm horizontal, 0mm vertical (blockType: ${blockType})`);
                    return { 
                        createJoints: true, 
                        horizontalThickness: 1, // 1mm (colle très fine)
                        verticalThickness: 0    // 0mm - PAS de joints verticaux pour béton cellulaire (TOUTES assises)
                    };
                }
            }
            
            // Béton cellulaire assise (BCA_*) : joints selon l'assise
            if (blockType.startsWith('BCA_')) {
                // Déterminer l'assise actuelle pour les blocs cellulaires avec détection améliorée
                let currentAssiseIndex = this.getCurrentCellularAssiseIndex();
                
                console.log(`🔍 DIAGNOSTIC BCA_: Assise index=${currentAssiseIndex}, nouvelle numérotation=${currentAssiseIndex + 1}`);

                // Vérification supplémentaire pour BCA_
                if (element.position && element.dimensions) {
                    const elementBaseY = element.position.y;
                    const elementHeight = element.dimensions.height;
                    
                    console.log(`🔍 [BCA_] Vérification position élément: baseY=${elementBaseY.toFixed(2)}, height=${elementHeight.toFixed(2)}`);
                    
                    const otherBases = [];
                    if (window.SceneManager && window.SceneManager.elements) {
                        for (const el of window.SceneManager.elements.values()) {
                            if (el !== element && el.type === 'block' && el.blockType && el.blockType.startsWith('BCA_')) {
                                const baseY = el.position?.y || 0;
                                otherBases.push(baseY);
                                console.log(`🔍 [BCA_] Autre bloc BCA_ trouvé: ${el.id}, baseY=${baseY.toFixed(2)}`);
                            }
                        }
                    }
                    
                    console.log(`🔍 [BCA_] ${otherBases.length} autres blocs BCA_ trouvés`);
                    
                    if (otherBases.length > 0) {
                        const minBase = Math.min(...otherBases);
                        const seuil = minBase + elementHeight * 0.8;
                        
                        console.log(`🔍 [BCA_] minBase=${minBase.toFixed(2)}, seuil=${seuil.toFixed(2)} (minBase + ${elementHeight.toFixed(2)} * 0.8)`);
                        
                        if (elementBaseY > seuil) {
                            console.log(`🔍 [BCA_] Condition remplie: ${elementBaseY.toFixed(2)} > ${seuil.toFixed(2)} → Correction assise`);
                            console.log(`🔍 Correction assise BCA_: baseY=${elementBaseY.toFixed(2)} > seuil=${seuil.toFixed(2)} → assise supérieure détectée`);
                            const oldIndex = currentAssiseIndex;
                            currentAssiseIndex = Math.max(1, currentAssiseIndex);
                            console.log(`🔍 [BCA_] Assise corrigée: ${oldIndex} → ${currentAssiseIndex}`);
                        } else {
                            console.log(`🔍 [BCA_] Condition non remplie: ${elementBaseY.toFixed(2)} <= ${seuil.toFixed(2)} → Pas de correction`);
                        }
                    } else {
                        console.log(`🔍 [BCA_] Aucun autre bloc BCA_ → Premier bloc, assise 0`);
                    }
                }
                
                if (currentAssiseIndex === 0) {
                    // Première assise (assise 1) : joint au sol 1.2cm, ZÉRO vertical
                    console.log(`🏗️ Bloc BCA_ - ASSISE 1 (index 0) : joint au sol 1.2cm, 0mm vertical (blockType: ${blockType})`);
                    return { 
                        createJoints: true, 
                        horizontalThickness: 12, // 1.2cm = 12mm (joint au sol)
                        verticalThickness: 0     // 0mm - PAS de joints verticaux pour béton cellulaire (TOUTES assises)
                    };
                } else {
                    this.normalizeCellularSecondCourseJoints();
                    this.dedupeCellularHorizontalJoints();
                    // Assises suivantes (assise 2+) : joints de 1mm horizontal, ZÉRO vertical (demande utilisateur)
                    console.log(`🏗️ Bloc BCA_ - ASSISE ${currentAssiseIndex + 1} (index ${currentAssiseIndex}) : joints colle 1mm horizontal, 0mm vertical (blockType: ${blockType})`);
                    return { 
                        createJoints: true, 
                        horizontalThickness: 1, // 1mm (colle très fine)
                        verticalThickness: 0    // 0mm - PAS de joints verticaux pour béton cellulaire (TOUTES assises)
                    };
                }
            }
        }

        // Pour les blocs, vérifier aussi selon l'ID ou les données du BlockSelector
        if (element.type === 'block') {
            // Déterminer le type de bloc à partir de l'élément
            let blockData = null;
            
            // Essayer d'obtenir les données du bloc depuis BlockSelector
            if (window.BlockSelector && window.BlockSelector.getCurrentBlockData) {
                try {
                    const currentBlockData = window.BlockSelector.getCurrentBlockData();
                    if (currentBlockData && currentBlockData.category) {
                        blockData = currentBlockData;
                    }
                } catch (error) {
                    console.warn('Erreur lors de la récupération des données de bloc:', error);
                }
            }
            
            // Alternativement, essayer d'extraire le type depuis l'ID de l'élément
            if (!blockData && element.id) {
                const blockTypeMatch = element.id.match(/^(B\d+)/);
                if (blockTypeMatch && window.BlockSelector && window.BlockSelector.blockTypes) {
                    const blockTypeId = blockTypeMatch[1];
                    blockData = window.BlockSelector.blockTypes[blockTypeId];
                }
            }
            
            // Si on a des données de bloc et que c'est un bloc creux (hollow)
            if (blockData && blockData.category === 'hollow') {
                // Blocs creux B9, B14, B19, B29 : consulter AssiseManager pour la hauteur dynamique
                let dynamicJointHeight = this.blockJointThickness; // Valeur par défaut
                
                // Consulter AssiseManager pour la hauteur de joint actuelle de l'assise HOLLOW
                if (window.AssiseManager && window.AssiseManager.getJointHeightForAssise) {
                    try {
                        const assiseJointHeight = window.AssiseManager.getJointHeightForAssise('HOLLOW');
                        if (assiseJointHeight && assiseJointHeight > 0) {
                            dynamicJointHeight = assiseJointHeight * 10; // Conversion cm → mm
                            // Joint dynamique utilisé depuis AssiseManager
                        }
                    } catch (error) {
                        console.warn('Erreur consultation joint AssiseManager pour HOLLOW:', error);
                    }
                }
                
                return { 
                    createJoints: true, 
                    horizontalThickness: dynamicJointHeight, // Hauteur dynamique depuis AssiseManager
                    verticalThickness: 10 // 1cm = 10mm pour les joints verticaux
                };
            }
            
            // Si on a des données de bloc et que c'est un bloc béton cellulaire, ARGEX ou terre cuite (standard, assise, ou coupé)
            if (blockData && (blockData.category === 'cellular' || blockData.category === 'cellular-assise' || 
                blockData.category === 'argex' || blockData.category === 'terracotta' ||
                (blockData.category === 'cut' && element.blockType === 'CELLULAIRE') ||
                (blockData.category === 'cut' && element.blockType === 'ARGEX') ||
                (blockData.category === 'cut' && element.blockType === 'TERRE_CUITE'))) {
                // INTEGRATION ASSISE MANAGER: Utiliser AssiseManager pour déterminer l'assise courante
                let currentAssiseIndex = 0;
                
                if (window.AssiseManager) {
                    // CORRECTION: Utiliser notre détection améliorée plutôt que AssiseManager basique
                    console.log(`🔍 [SPÉCIALISÉ] Utilisation de getCurrentCellularAssiseIndex() pour une détection précise`);
                    currentAssiseIndex = this.getCurrentCellularAssiseIndex(element);
                    console.log(`🏗️ Bloc spécialisé (${blockData.category}/${element.blockType}): AssiseManager amélioré indique assise ${currentAssiseIndex}`);
                }
                
                if (currentAssiseIndex === 0) {
                    // Première assise : mortier traditionnel avec joints de 1.2cm horizontal, ZÉRO vertical
                    console.log(`🏗️ Bloc spécialisé (${blockData.category}/${element.blockType}) - PREMIÈRE ASSISE : joints mortier 1.2cm horizontal, 0mm vertical`);
                    return { 
                        createJoints: true, 
                        horizontalThickness: 12, // 1.2cm = 12mm
                        verticalThickness: 0     // 0mm - PAS de joints verticaux pour blocs spécialisés (TOUTES assises)
                    };
                } else {
                    this.normalizeCellularSecondCourseJoints();
                    this.dedupeCellularHorizontalJoints();
                    // Assises supérieures : colle fine avec joints de 1mm horizontal, ZÉRO vertical (mise à jour)
                    console.log(`🏗️ Bloc spécialisé (${blockData.category}/${element.blockType}) - ASSISE ${currentAssiseIndex + 1} : joints colle 1mm horizontal, 0mm vertical`);
                    return { 
                        createJoints: true, 
                        horizontalThickness: 1, // 1mm
                        verticalThickness: 0    // 0mm - PAS de joints verticaux pour blocs spécialisés (TOUTES assises)
                    };
                }
            }
        }

        // Fallback : utiliser les paramètres standard selon le type d'élément
        if (element.type === 'brick') {
            // JOINTS BRIQUES : joints horizontaux variables selon AssiseManager, verticaux fixes 1cm
            return { createJoints: true, horizontalThickness: this.brickJointThickness, verticalThickness: 10 };
        } else if (element.type === 'block') {
            // JOINTS BLOCS : joints horizontaux variables selon AssiseManager, verticaux fixes 1cm
            // Chercher la hauteur de joint actuelle dans AssiseManager
            let dynamicJointThickness = this.blockJointThickness; // Valeur par défaut
            
            if (window.AssiseManager) {
                // Déterminer le type d'assise pour ce bloc
                const blockType = element.blockType || 'HOLLOW';
                const currentAssiseIndex = window.AssiseManager.currentAssiseByType.get(blockType) || 0;
                
                // Récupérer la hauteur de joint personnalisée pour cette assise
                const customJointHeight = window.AssiseManager.getJointHeightForAssise(blockType, currentAssiseIndex);
                if (customJointHeight !== null) {
                    dynamicJointThickness = customJointHeight * 10; // Conversion cm vers mm
                    // Joint dynamique utilisé
                }
            }
            
            return { createJoints: true, horizontalThickness: dynamicJointThickness, verticalThickness: 10 };
        }

        // Par défaut, ne pas créer de joints
        return { createJoints: false, horizontalThickness: 0, verticalThickness: 0 };
    }

    /**
     * Normalise (ou masque) les joints horizontaux de 1.2cm qui subsistent sous des blocs CELLULAR des assises supérieures.
     * Stratégie: détecter le niveau de base minimal (première assise), déduire hauteur bloc, puis pour chaque joint horizontal
     * associé à un bloc CELLULAR dont le centre Y dépasse (minBase + heightBloc*0.8), masquer ou réduire à 0.1cm.
     */
    normalizeCellularSecondCourseJoints() {
        if (!window.SceneManager || !window.SceneManager.scene) return;
        try {
            // Collecter bases des blocs cellulaires
            const cellularBases = [];
            let sampleHeight = null;
            const elements = window.SceneManager.elements;
            if (!elements) return;
            for (const el of elements.values()) {
                if (el.type === 'block' && el.blockType && (el.blockType.startsWith('BC_') || el.blockType.startsWith('BCA_'))) {
                    cellularBases.push(el.position?.y || 0);
                    if (!sampleHeight && el.dimensions?.height) sampleHeight = el.dimensions.height;
                }
            }
            if (cellularBases.length === 0 || !sampleHeight) return;
            const minBase = Math.min(...cellularBases);
            const secondCourseThreshold = minBase + sampleHeight * 0.8; // base d'une assise supérieure attendue
            let fixedCount = 0;
            window.SceneManager.scene.traverse((child) => {
                if (!child.userData) return;
                if (child.userData.isJoint && child.userData.isHorizontalJoint) {
                    const parentType = child.userData.parentElementType;
                    const blockType = child.userData.blockType || child.userData.blockTypeId;
                    if (parentType === 'block' && blockType && (blockType.startsWith('BC_') || blockType.startsWith('BCA_'))) {
                        // Déterminer hauteur actuelle (approx: boundingBox ou scale.y)
                        let h = 0;
                        if (child.geometry && child.geometry.boundingBox) {
                            const bb = child.geometry.boundingBox;
                            h = (bb.max.y - bb.min.y) * child.scale.y;
                        } else {
                            h = child.scale.y; // fallback
                        }
                        // Centre Y du joint
                        const centerY = child.position.y;
                        const topY = centerY + h / 2;
                        // Si joint épais (≈1.2) et situé sous un bloc de seconde assise → corriger
                        if (h > 0.2 && (topY > secondCourseThreshold)) {
                            // Réduire à 0.1cm: ajuster scale et position pour garder le haut aligné
                            const newH = 0.1;
                            const delta = (h - newH) / 2;
                            child.scale.y = (child.scale.y * newH) / h;
                            child.position.y = child.position.y + delta; // remonte le centre
                            child.userData.correctedCellularJoint = true;
                            fixedCount++;
                        }
                    }
                }
            });
            if (fixedCount > 0) {
                console.log(`🔧 Normalisation joints CELLULAR assises supérieures: ${fixedCount} joint(s) corrigé(s)`);
            }
        } catch (e) {
            console.warn('Échec normalisation joints CELLULAR:', e);
        }
    }

    /**
     * Déduplique les joints horizontaux cellulaires (évite superposition 1.2cm + 0.1cm).
     * Regroupe par position (x,z) arrondie et garde le joint le plus fin si doublon.
     */
    dedupeCellularHorizontalJoints() {
        if (!window.SceneManager || !window.SceneManager.scene) return;
        console.log(`🧹 [DEDUPE] Début de la déduplication des joints cellulaires`);
        try {
            const groups = new Map(); // key -> array of joints
            let totalJoints = 0;
            window.SceneManager.scene.traverse((child) => {
                if (!child.userData) return;
                if (child.userData.isJoint && child.userData.isHorizontalJoint) {
                    totalJoints++;
                    const bt = child.userData.blockType || child.userData.blockTypeId;
                    if (bt && (bt.startsWith('BC_') || bt.startsWith('BCA_'))) {
                        const x = child.position.x.toFixed(2);
                        const z = child.position.z.toFixed(2);
                        const key = x + '|' + z;
                        if (!groups.has(key)) groups.set(key, []);
                        groups.get(key).push(child);
                        console.log(`🧹 [DEDUPE] Joint cellulaire trouvé: pos=(${x},${child.position.y.toFixed(2)},${z}), blockType=${bt}, key=${key}`);
                    }
                }
            });
            console.log(`🧹 [DEDUPE] Total joints analysés: ${totalJoints}, groupes cellulaires: ${groups.size}`);
            
            let removed = 0, hidden = 0, shrunk = 0;
            for (const [key, arr] of groups.entries()) {
                if (arr.length < 2) continue;
                console.log(`🧹 [DEDUPE] Groupe ${key}: ${arr.length} joints à traiter`);
                
                // Mesurer hauteurs
                const data = arr.map(j => {
                    let h = 0;
                    if (j.geometry && j.geometry.boundingBox) {
                        const bb = j.geometry.boundingBox; h = (bb.max.y - bb.min.y) * j.scale.y;
                    } else { h = j.scale.y; }
                    console.log(`🧹 [DEDUPE] Joint hauteur: ${h.toFixed(3)}, Y=${j.position.y.toFixed(2)}, visible=${j.visible}`);
                    return { node: j, h };
                });
                const thick = data.filter(d => d.h > 0.2);
                const thin = data.filter(d => d.h <= 0.15);
                console.log(`🧹 [DEDUPE] Groupe ${key}: ${thick.length} épais, ${thin.length} fins`);
                
                if (thick.length && thin.length) {
                    // Garder le plus fin, masquer les épais
                    console.log(`🧹 [DEDUPE] Masquage de ${thick.length} joints épais`);
                    for (const t of thick) {
                        t.node.visible = false;
                        t.node.userData.dedupeHidden = true;
                        hidden++;
                    }
                } else if (thick.length > 1) {
                    // Réduire tous sauf un
                    thick.sort((a,b)=>a.h-b.h);
                    console.log(`🧹 [DEDUPE] Réduction de ${thick.length-1} joints épais`);
                    for (let i=1;i<thick.length;i++) {
                        const j = thick[i];
                        const newH = 0.1;
                        const oldH = j.h;
                        const delta = (oldH - newH)/2;
                        j.node.scale.y = (j.node.scale.y * newH)/oldH;
                        j.node.position.y += delta;
                        j.node.userData.shrunkByDedupe = true;
                        shrunk++;
                    }
                }
            }
            console.log(`🧹 [DEDUPE] Résultats: hidden=${hidden}, shrunk=${shrunk}, removed=${removed}`);
            if (hidden || removed || shrunk) {
                console.log(`🔧 Déduplication joints CELLULAR: hidden=${hidden}, shrunk=${shrunk}`);
            }
        } catch (e) {
            console.warn('Échec déduplication joints CELLULAR:', e);
        }
    }

    // ========== MÉTHODES UTILITAIRES ==========

    updateBrickJointsInScene() {
        if (window.SceneManager && window.SceneManager.scene) {
            window.SceneManager.scene.traverse((child) => {
                if (child.userData && child.userData.isJoint && child.userData.parentElementType === 'brick') {
                    // Mettre à jour SEULEMENT les joints horizontaux (les verticaux restent fixes à 1cm)
                    const thickness = this.brickJointThickness / 10; // mm vers cm
                    if (child.userData.isHorizontalJoint) {
                        // Mettre à jour seulement l'épaisseur horizontale
                        child.scale.y = thickness;
                    }
                    // Les joints verticaux ne sont PAS modifiés (restent à 1cm fixe)
                }
            });
        }
    }

    updateBlockJointsInScene() {
        if (window.SceneManager && window.SceneManager.scene) {
            window.SceneManager.scene.traverse((child) => {
                if (child.userData && child.userData.isJoint && child.userData.parentElementType === 'block') {
                    // Mettre à jour SEULEMENT les joints horizontaux (les verticaux restent fixes à 1cm)
                    const thickness = this.blockJointThickness / 10; // mm vers cm
                    if (child.userData.isHorizontalJoint) {
                        // Mettre à jour seulement l'épaisseur horizontale
                        child.scale.y = thickness;
                    }
                    // Les joints verticaux ne sont PAS modifiés (restent à 1cm fixe)
                }
            });
        }
    }

    updateBrickJointColorsInScene() {
        const color = this.getJointColorValue(this.brickJointColor);
        let updatedCount = 0;
        
        // Parcourir la scène principale
        if (window.SceneManager && window.SceneManager.scene) {
            window.SceneManager.scene.traverse((child) => {
                if (child.userData && child.userData.isJoint) {
                    const isBrickJoint = this.isBrickJoint(child.userData);
                    if (isBrickJoint && child.material && child.material.color) {
                        child.material.color.setHex(color);
                        updatedCount++;
                    }
                }
            });
        }
        
        // Parcourir aussi les groupes d'assise
        if (window.SceneManager && window.SceneManager.assiseGroups) {
            for (const [type, assisesByIndex] of window.SceneManager.assiseGroups) {
                for (const [index, assiseGroup] of assisesByIndex) {
                    assiseGroup.traverse((child) => {
                        if (child.userData && child.userData.isJoint) {
                            const isBrickJoint = this.isBrickJoint(child.userData);
                            if (isBrickJoint && child.material && child.material.color) {
                                child.material.color.setHex(color);
                                updatedCount++;
                            }
                        }
                    });
                }
            }
        }
        
        if (updatedCount > 0) {
            // console.log(`🔄 ${updatedCount} joints de briques existants mis à jour avec la nouvelle couleur`);
        } else {
            // console.log(`🔍 Aucun joint de brique trouvé dans la scène pour mise à jour`);
        }
    }

    isBrickJoint(userData) {
        return userData.parentElementType === 'brick' || 
               userData.parentElementType === 'brique' ||
               userData.elementType === 'brick' ||
               userData.elementType === 'brique' ||
               (userData.parentElementType && 
                (userData.parentElementType.includes('M') || 
                 userData.parentElementType.includes('WF')));
    }

    isBlockJoint(userData) {
        return userData.parentElementType === 'block' || 
               userData.parentElementType === 'bloc' ||
               userData.elementType === 'block' ||
               userData.elementType === 'bloc' ||
               (userData.parentElementType && 
                (userData.parentElementType.includes('block') || 
                 userData.parentElementType.includes('bloc')));
    }

    updateBlockJointColorsInScene() {
        const color = this.getJointColorValue(this.blockJointColor);
        let updatedCount = 0;
        
        // Parcourir la scène principale
        if (window.SceneManager && window.SceneManager.scene) {
            window.SceneManager.scene.traverse((child) => {
                if (child.userData && child.userData.isJoint) {
                    const isBlockJoint = this.isBlockJoint(child.userData);
                    if (isBlockJoint && child.material && child.material.color) {
                        child.material.color.setHex(color);
                        updatedCount++;
                    }
                }
            });
        }
        
        // Parcourir aussi les groupes d'assise
        if (window.SceneManager && window.SceneManager.assiseGroups) {
            for (const [type, assisesByIndex] of window.SceneManager.assiseGroups) {
                for (const [index, assiseGroup] of assisesByIndex) {
                    assiseGroup.traverse((child) => {
                        if (child.userData && child.userData.isJoint) {
                            const isBlockJoint = this.isBlockJoint(child.userData);
                            if (isBlockJoint && child.material && child.material.color) {
                                child.material.color.setHex(color);
                                updatedCount++;
                            }
                        }
                    });
                }
            }
        }
        
        if (updatedCount > 0) {
            // console.log(`🔄 ${updatedCount} joints de blocs existants mis à jour avec la nouvelle couleur`);
        } else {
            // console.log(`🔍 Aucun joint de bloc trouvé dans la scène pour mise à jour`);
        }
    }

    // Méthode de debug pour inspecter les joints dans la scène
    debugJointsInScene() {
        let totalJoints = 0;
        let brickJoints = 0;
        let blockJoints = 0;
        let unknownJoints = 0;
        
        /* console.log(`🔍 Debug SceneManager structure:`, {
            sceneManager: !!window.SceneManager,
            scene: !!window.SceneManager?.scene,
            assiseGroups: !!window.SceneManager?.assiseGroups,
            assiseGroupsSize: window.SceneManager?.assiseGroups?.size || 0,
            sceneChildren: window.SceneManager?.scene?.children?.length || 0
        }); */
        
        // Parcourir la scène principale
        if (window.SceneManager && window.SceneManager.scene) {
            window.SceneManager.scene.traverse((child) => {
                if (child.userData && child.userData.isJoint) {
                    totalJoints++;
                    console.log(`🔍 Joint trouvé (scène principale):`, {
                        name: child.name,
                        parentElementType: child.userData.parentElementType,
                        elementType: child.userData.elementType,
                        userData: child.userData
                    });
                    
                    this.classifyJoint(child.userData, { brickJoints, blockJoints, unknownJoints });
                }
            });
        }
        
        // Parcourir aussi les groupes d'assise
        if (window.SceneManager && window.SceneManager.assiseGroups) {
            console.log(`🔍 Parcours des groupes d'assise:`, Array.from(window.SceneManager.assiseGroups.keys()));
            for (const [type, assisesByIndex] of window.SceneManager.assiseGroups) {
                console.log(`🔍 Type ${type}:`, Array.from(assisesByIndex.keys()));
                for (const [index, assiseGroup] of assisesByIndex) {
                    console.log(`🔍 Groupe ${type}-${index} enfants:`, assiseGroup.children.length);
                    assiseGroup.traverse((child) => {
                        if (child.userData && child.userData.isJoint) {
                            totalJoints++;
                            console.log(`🔍 Joint trouvé (groupe ${type}-${index}):`, {
                                name: child.name,
                                parentElementType: child.userData.parentElementType,
                                elementType: child.userData.elementType,
                                userData: child.userData
                            });
                            
                            this.classifyJoint(child.userData, { brickJoints, blockJoints, unknownJoints });
                        }
                    });
                }
            }
        } else {
            // console.log(`🔍 assiseGroups non disponible`);
        }
        
        // console.log(`📊 Debug joints dans la scène:`, {
        //     total: totalJoints,
        //     briques: brickJoints,
        //     blocs: blockJoints,
        //     inconnus: unknownJoints
        // });
        
        return { total: totalJoints, brickJoints, blockJoints, unknownJoints };
    }

    /**
     * Vérifie s'il existe déjà un joint à la position donnée pour éviter les doublons
     * @param {Object} position - Position du joint à vérifier {x, y, z}
     * @param {string} jointType - Type de joint ('horizontal-joint' ou 'vertical-joint')
     * @returns {boolean} - true s'il existe déjà un joint à cette position
     */
    checkForExistingJointAtPosition(position, jointType) {
        const tolerance = 0.01; // Tolérance en unités de la scène pour les positions proches
        
        let existingJoints = [];
        
        // Parcourir la scène principale pour trouver les joints existants
        if (window.SceneManager && window.SceneManager.scene) {
            window.SceneManager.scene.traverse((child) => {
                if (child.userData && child.userData.isJoint) {
                    existingJoints.push(child);
                }
            });
        }
        
        // Parcourir aussi les groupes d'assise
        if (window.SceneManager && window.SceneManager.assiseGroups) {
            for (const [type, assisesByIndex] of window.SceneManager.assiseGroups) {
                for (const [index, assiseGroup] of assisesByIndex) {
                    assiseGroup.traverse((child) => {
                        if (child.userData && child.userData.isJoint) {
                            existingJoints.push(child);
                        }
                    });
                }
            }
        }
        
        // Vérifier si un joint existe déjà à une position similaire
        for (const existingJoint of existingJoints) {
            const jointPos = existingJoint.position;
            const distance = Math.sqrt(
                Math.pow(position.x - jointPos.x, 2) +
                Math.pow(position.y - jointPos.y, 2) +
                Math.pow(position.z - jointPos.z, 2)
            );
            
            // Si un joint existe déjà très proche de cette position
            if (distance < tolerance) {
                // Pour les joints horizontaux, vérifier aussi le type
                if (jointType === 'horizontal-joint' && 
                    (existingJoint.userData.isHorizontalJoint || existingJoint.userData.elementType === 'horizontal-joint')) {
                    console.log('🔍 Joint horizontal existant détecté à position similaire:', {
                        existingPosition: jointPos,
                        newPosition: position,
                        distance: distance
                    });
                    return true;
                }
                
                // Pour les joints verticaux
                if (jointType === 'vertical-joint' && 
                    (existingJoint.userData.isVerticalJoint || existingJoint.userData.elementType === 'vertical-joint')) {
                    console.log('🔍 Joint vertical existant détecté à position similaire:', {
                        existingPosition: jointPos,
                        newPosition: position,
                        distance: distance
                    });
                    return true;
                }
            }
        }
        
        return false;
    }

    classifyJoint(userData, counters) {
        if (this.isBrickJoint(userData)) {
            counters.brickJoints++;
        } else if (this.isBlockJoint(userData)) {
            counters.blockJoints++;
        } else {
            counters.unknownJoints++;
        }
    }

    updateBrickJointVisibility(show) {
        if (window.SceneManager && window.SceneManager.scene) {
            window.SceneManager.scene.traverse((child) => {
                if (child.userData && child.userData.isJoint && child.userData.parentElementType === 'brick') {
                    child.visible = show;
                }
            });
        }
    }

    updateBlockJointVisibility(show) {
        if (window.SceneManager && window.SceneManager.scene) {
            window.SceneManager.scene.traverse((child) => {
                if (child.userData && child.userData.isJoint && child.userData.parentElementType === 'block') {
                    child.visible = show;
                }
            });
        }
    }

    getJointColorValue(colorName) {
        // Si c'est déjà un code hex, le convertir en nombre
        if (typeof colorName === 'string' && colorName.startsWith('#')) {
            return parseInt(colorName.replace('#', '0x'), 16);
        }
        
        // Sinon, utiliser les couleurs prédéfinies
        const colors = {
            'grey': 0x808080,
            'white': 0xffffff,
            'beige': 0xf5f5dc,
            'dark': 0x404040
        };
        return colors[colorName] || 0x808080;
    }

    // ========== MÉTHODES DE COMPATIBILITÉ ==========
    
    setJointThickness(thickness) {
        // Méthode de compatibilité - applique aux deux types
        this.setBrickJointThickness(thickness);
        this.setBlockJointThickness(thickness);
        this.jointThickness = thickness; // Maintenir la compatibilité
    }

    setJointColor(color) {
        // Méthode de compatibilité - applique aux deux types
        this.setBrickJointColor(color);
        this.setBlockJointColor(color);
        this.jointColor = color; // Maintenir la compatibilité
    }

    toggleJoints(show) {
        // Méthode de compatibilité - applique aux deux types
        this.toggleBrickJoints(show);
        this.toggleBlockJoints(show);
        this.showJoints = show; // Maintenir la compatibilité
    }

    setAutoJoints(enabled) {
        // Méthode de compatibilité - applique aux deux types
        this.setAutoBrickJoints(enabled);
        this.setAutoBlockJoints(enabled);
        this.autoJoints = enabled; // Maintenir la compatibilité
    }

    getParentElementTypeForJoint() {
        // Déterminer le type d'élément parent pour le joint basé sur le mode actuel et le contexte
        if (this.currentMode === 'brick' || this.currentMode === 'brique') {
            return 'brick';
        } else if (this.currentMode === 'block' || this.currentMode === 'bloc') {
            return 'block';
        }
        
        // Si on a un élément de référence, utiliser son type
        if (this.referenceElement) {
            return this.referenceElement.type === 'brick' ? 'brick' : 'block';
        }
        
        // Si on a une brique active pour suggestions
        if (this.activeBrickForSuggestions) {
            return this.activeBrickForSuggestions.type === 'brick' ? 'brick' : 'block';
        }
        
        // Par défaut, considérer comme joint de brique
        return 'brick';
    }

    applyJointColorToElement(jointElement, parentElementType, referenceElementParam = null) {
        if (!jointElement || !jointElement.mesh || !jointElement.mesh.material) return;
        
        // Essayer de déterminer l'élément parent pour le matériau
        const parentElement = referenceElementParam || this.referenceElement || this.activeBrickForSuggestions;
        
        // Utiliser le nouveau système de matériaux avec l'élément parent
        const jointMaterialId = this.getJointMaterial(parentElement);
        
        if (window.MaterialLibrary && jointMaterialId) {
            const jointMaterial = window.MaterialLibrary.getMaterial(jointMaterialId);
            if (jointMaterial && jointMaterial.color !== undefined) {
                const color = jointMaterial.color;
                jointElement.mesh.material.color.setHex(color);
                // console.log(`🎨 Couleur appliquée au joint: ${parentElementType} -> ${color.toString(16)} (matériau: ${jointMaterialId})`);
                return;
            }
        }
        
        // Fallback vers l'ancien système si le nouveau n'est pas disponible
        let color;
        if (parentElementType === 'brick') {
            color = this.getJointColorValue(this.brickJointColor);
        } else if (parentElementType === 'block') {
            color = this.getJointColorValue(this.blockJointColor);
        } else {
            // Fallback: utiliser la couleur des joints de briques
            color = this.getJointColorValue(this.brickJointColor);
        }
        
        // Appliquer la couleur au matériau
        jointElement.mesh.material.color.setHex(color);
        // console.log(`🎨 Couleur appliquée au joint (fallback): ${parentElementType} -> ${color.toString(16)}`);
    }

    // ==========================================
    // SYSTÈME DE JOINTS AUTOMATIQUES
    // ==========================================
    
    /**
     * Méthode principale pour ajouter automatiquement des joints à un élément
     * Utilise exactement la même logique que le système manuel avec gestion séparée par type
     * @param {WallElement} element - L'élément pour lequel créer des joints automatiques
     */
    addAutomaticJoints(element) {
        // 🔧 FONCTION DÉSACTIVÉE: La détection automatique d'adjacence n'est plus nécessaire
        // Le système de joints automatiques est maintenant géré par les positions des lettres dans scene-manager.js
        return;

        // Récupérer les paramètres de joints pour cet élément spécifique
        const jointSettings = this.getJointSettingsForElement(element);
        // console.log(`🔧 DEBUG addAutomaticJoints - Paramètres de joints:`, {
        //     elementType: element.type,
        //     blockType: element.blockType,
        //     jointSettings: jointSettings
        // });

        // Si l'élément ne doit pas créer de joints, sortir immédiatement
        if (!jointSettings.createJoints) {
            // console.log(`❌ Création de joints désactivée pour cet élément:`, {
            //     type: element.type,
            //     blockType: element.blockType
            // });
            return;
        }

        // Vérifier si les joints automatiques sont activés pour ce type d'élément de base
        if (element.type !== 'brick' && element.type !== 'block') {
            console.log('❌ Joints automatiques: Type d\'élément non supporté', {
                type: element?.type
            });
            return;
        }

        // Vérifier si les joints automatiques sont activés pour ce type d'élément
        const shouldCreateJoints = element.type === 'brick' ? this.autoBrickJoints : this.autoBlockJoints;
        // console.log(`🔧 DEBUG addAutomaticJoints - Vérification activation:`, {
        //     elementType: element.type,
        //     autoBrickJoints: this.autoBrickJoints,
        //     autoBlockJoints: this.autoBlockJoints,
        //     shouldCreateJoints: shouldCreateJoints
        // });
        
        if (!shouldCreateJoints) {
            // console.log(`❌ Joints automatiques désactivés pour les ${element.type === 'brick' ? 'briques' : 'blocs'}`);
            return;
        }

        // console.log(`🔧 Ajout automatique de joints pour ${element.type === 'brick' ? 'brique' : 'bloc'}:`, element.id);

        // Utiliser la nouvelle approche basée sur les calculs du système manuel
        const jointPositions = this.calculateJointPositionsLikeManual(element);
        // console.log(`🔧 DEBUG addAutomaticJoints - Positions calculées:`, {
        //     elementId: element.id,
        //     jointPositionsCount: jointPositions?.length || 0,
        //     jointPositions: jointPositions
        // });
        
        if (!jointPositions || jointPositions.length === 0) {
            console.log('❌ Aucune position de joint calculée pour:', element.id);
            return;
        }

        // console.log(`🔧 ${jointPositions.length} positions de joints calculées pour ${element.type === 'brick' ? 'brique' : 'bloc'}`);

        // Créer les joints automatiques pour chaque position
        let jointsCreated = 0;
        jointPositions.forEach((jointData, index) => {
            // console.log(`🔧 Création joint ${index + 1}/${jointPositions.length}:`, {
            //     type: jointData.type,
            //     position: jointData.position,
            //     rotation: jointData.rotation,
            //     dimensions: jointData.dimensions
            // });
            
            // Marquer le joint avec le type d'élément parent pour le tri ultérieur
            jointData.parentElementType = element.type;
            
            if (this.createAutomaticJointFromSuggestion(jointData, element)) {
                jointsCreated++;
                console.log(`✅ Joint ${index + 1} créé avec succès`);
            } else {
                console.log(`❌ Échec création joint ${index + 1}`);
            }
        });

        // console.log(`🔧 Résultat final: ${jointsCreated} joints automatiques créés sur ${jointPositions.length} calculés pour ${element.type === 'brick' ? 'brique' : 'bloc'} ${element.id}`);
    }

    /**
     * Calcule les positions des joints en utilisant exactement la même logique que createJointOnlySuggestions
     * @param {WallElement} element - L'élément de référence
     * @returns {Array} Tableau des données de joints (position, rotation, dimensions, type)
     */
    calculateJointPositionsLikeManual(element) {
        // console.log(`🔧 DEBUG calculateJointPositionsLikeManual - Début pour élément:`, {
        //     id: element?.id,
        //     type: element?.type,
        //     position: element?.position,
        //     dimensions: element?.dimensions,
        //     isInitialized: this.isInitialized
        // });
        
        if (!element || !this.isInitialized) {
    const dbg = !!window.enableJointDebug;
            console.log('❌ calculateJointPositionsLikeManual: Élément ou ConstructionTools non initialisé');
    if (dbg) console.log('🧪[JOINT-DBG] Adjacence', adjacency, 'hasAdjacent', hasAdjacentBricks, 'id', element.id, 'type', element.blockType || element.type);
        }
        if (dbg) console.log('🧪[JOINT-DBG] 0 adjacency → essayer joint horizontal');
        // Créer des joints pour les briques ET les blocs (copie exacte)
        if (element.type !== 'brick' && element.type !== 'block') {
            console.log('❌ calculateJointPositionsLikeManual: Élément de type non supporté:', element.type);
            return [];
        }
        
        // console.log(`🔧 Calcul des positions de joints pour ${element.type} ${element.id}`);
        
        const jointPositions = [];
        const basePos = element.position;
        const rotation = element.rotation;
        const dims = element.dimensions;
            if (dbg) console.log('🧪[JOINT-DBG] Joint horizontal épais ignoré (CELLULAR assise >0)');
        // ===== CALCUL DU CENTRE DE LA BRIQUE (copie exacte) =====
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        
    if (dbg) console.log('🧪[JOINT-DBG] Adjacence détectée → création joints verticaux');
        let centerOffsetX = dims.length / 2;  // vers la droite
        let centerOffsetZ = -dims.width / 2;  // vers l'avant (face visible)
        
        // Appliquer la rotation à l'offset pour obtenir la position du centre
        const rotatedCenterOffsetX = centerOffsetX * cos - centerOffsetZ * sin;
        const rotatedCenterOffsetZ = centerOffsetX * sin + centerOffsetZ * cos;
        
        // Position du centre de la face inférieure de la brique
        const brickCenter = {
            x: basePos.x + rotatedCenterOffsetX,
            y: basePos.y,
            z: basePos.z + rotatedCenterOffsetZ
        };
        
        // console.log('🔧 Centre de la brique calculé (automatique):', brickCenter);
        
        // ===== CALCUL DES POSITIONS DES JOINTS VERTICAUX (copie exacte) =====
        
        // 🆕 NOUVELLE LOGIQUE: Détecter les briques adjacentes pour les joints automatiques avec distance adaptée
        const adjacency = this.detectAdjacentBricks(element); // Distance calculée automatiquement selon le type
        const hasAdjacentBricks = adjacency.left || adjacency.right || adjacency.front || adjacency.back;
        
        console.log(`🔧 Adjacence détectée pour joints automatiques:`, adjacency);
        
        // Récupérer les paramètres de joints spécifiques pour cet élément
        const jointSettings = this.getJointSettingsForElement(element);
        // console.log(`🔧 Paramètres de joints pour calcul:`, {
        //     elementType: element.type,
        //     blockType: element.blockType,
        //     jointSettings: jointSettings
        // });
        
        const jointVertical = jointSettings.verticalThickness / 10; // Conversion mm vers cm
        const jointHorizontal = jointSettings.horizontalThickness / 10; // Conversion mm vers cm
        
        // CORRECTION: Ne pas créer de joints verticaux si l'épaisseur est 0 (béton cellulaire assises 2+)
        if (jointVertical <= 0) {
            console.log('🚫 Pas de joints verticaux automatiques - Épaisseur nulle pour cet élément (béton cellulaire assises 2+)');
            return; // Sortir de la fonction sans créer de joints
        }
        
        // Détecter si l'élément est une boutisse (tourné à 90°)
        const normalizedRotation = ((rotation % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
        const isBoutisse = (normalizedRotation > Math.PI / 4 && normalizedRotation < 3 * Math.PI / 4) ||
                          (normalizedRotation > 5 * Math.PI / 4 && normalizedRotation < 7 * Math.PI / 4);
        
        // console.log('🔧 Création automatique des joints - Élément ' + (isBoutisse ? 'en boutisse' : 'en panneresse'));
        
        // Dimensions du joint debout - perpendiculaire au sol, parallèle aux boutisses
        const jointDimensions = {
            length: dims.width, // 9cm (largeur de la brique devient la longueur du joint)
            width: jointVertical, // 1cm (épaisseur du joint)
            height: dims.height // Même hauteur que la brique
        };
        
        // LOGIQUE MODIFIÉE : Placer seulement les joints là où il y a des briques adjacentes
        let localJointPositions = [];
        
        // Joint à l'extrémité droite seulement si une brique est adjacente à droite
        if (adjacency.right) {
            localJointPositions.push({
                x: dims.length/2 + jointVertical/2, // À l'extérieur de la face droite
                z: 0, // Centré sur la largeur
                rotation: rotation + Math.PI/2, // Perpendiculaire à la brique (parallèle aux boutisses)
                type: 'joint-debout-droite' 
            });
        }
        
        // Joint à l'extrémité gauche seulement si une brique est adjacente à gauche
        if (adjacency.left) {
            localJointPositions.push({
                x: -(dims.length/2 + jointVertical/2), // À l'extérieur de la face gauche
                z: 0, // Centré sur la largeur
                rotation: rotation + Math.PI/2, // Perpendiculaire à la brique (parallèle aux boutisses)
                type: 'joint-debout-gauche' 
            });
        }
        
        console.log(`🔧 Joints verticaux automatiques: ${localJointPositions.length} créés pour adjacences`);
        
        // Si aucune brique adjacente, créer seulement le joint horizontal
        if (!hasAdjacentBricks) {
            // console.log('🔧 Aucune brique adjacente - Joints verticaux automatiques ignorés');
        }
        
        // Transformer les positions locales en positions mondiales À PARTIR DU CENTRE DE LA BRIQUE
        localJointPositions.forEach((localPos, index) => {
            // Appliquer la rotation aux offsets locaux par rapport au centre de la brique
            const rotatedOffsetX = localPos.x * cos - localPos.z * sin;
            const rotatedOffsetZ = localPos.x * sin + localPos.z * cos;
            
            const worldX = brickCenter.x + rotatedOffsetX;
            const worldZ = brickCenter.z + rotatedOffsetZ;
            
            jointPositions.push({
                position: { x: worldX, y: brickCenter.y, z: worldZ },
                rotation: localPos.rotation,
                type: localPos.type,
                dimensions: jointDimensions,
                index: index,
                isVerticalJoint: true
            });
        });

        // ===== CALCUL DE LA POSITION DU JOINT HORIZONTAL (copie exacte) =====
        
        // Calculer la hauteur de base de l'assise sur laquelle se trouve la brique
        let assiseBaseHeight = 0; // Par défaut assise 0
        let elementAssiseIndex = 0;
        let elementAssiseType = element.type;
        
        if (window.AssiseManager) {
            // Chercher dans quelle assise se trouve l'élément
            let foundAssise = null;
            let foundType = null;
            let foundIndex = null;
            
            // Parcourir tous les types et toutes les assises pour trouver l'élément
            for (const [type, assisesForType] of window.AssiseManager.elementsByType) {
                for (const [assiseIndex, elementsInAssise] of assisesForType) {
                    if (elementsInAssise.has(element.id)) {
                        foundType = type;
                        foundIndex = assiseIndex;
                        foundAssise = assiseIndex;
                        break;
                    }
                }
                if (foundAssise !== null) break;
            }
            
            if (foundAssise !== null) {
                // Élément trouvé dans une assise spécifique
                elementAssiseType = foundType;
                elementAssiseIndex = foundIndex;
                assiseBaseHeight = window.AssiseManager.getAssiseHeightForType(foundType, foundIndex);
            } else {
                // Élément non trouvé dans les assises, utiliser l'assise courante
                elementAssiseType = element.type;
                elementAssiseIndex = window.AssiseManager.currentAssiseByType.get(elementAssiseType) || 0;
                assiseBaseHeight = window.AssiseManager.getAssiseHeightForType(elementAssiseType, elementAssiseIndex);
            }
        }
        
        // Calculer la hauteur du joint : depuis la face inférieure de l'élément jusqu'au plan zéro de l'assise
        const faceInferieureBrique = brickCenter.y - (dims.height / 2); // Face inférieure = centre - demi-hauteur
        
        // CORRECTION: Utiliser la même logique que dans les autres fonctions de joint
        let planZeroAssise = 0; // Sol réel pour assise 0
        
        if (elementAssiseIndex > 0 && window.AssiseManager) {
            // Utiliser la fonction corrigée qui calcule correctement le plan zéro
            planZeroAssise = window.AssiseManager.calculateAssiseHeightForType(elementAssiseType, elementAssiseIndex + 1);
            console.log(`🔧 DEBUG calculateJointPositionsLikeManual - Plan zéro assise ${elementAssiseIndex + 1}: ${planZeroAssise} cm`);
        }
        
        let hauteurJointHorizontal = faceInferieureBrique - planZeroAssise;
        
        // DEBUG: Ajouter des logs détaillés pour le calcul du joint horizontal
        // // console.log(`🔧 DEBUG Joint horizontal (assise ${elementAssiseIndex}):`);
        // console.log(`   - faceInferieureBrique: ${faceInferieureBrique} cm`);
        // console.log(`   - planZeroAssise: ${planZeroAssise} cm`);
        // console.log(`   - hauteurJointHorizontal calculée: ${hauteurJointHorizontal} cm`);
        
        // CORRECTION SPÉCIALE: Pour l'assise 0, le joint horizontal doit avoir exactement l'épaisseur prévue
        if (elementAssiseIndex === 0) {
            const jointHeightExpected = window.AssiseManager.getJointHeightForAssise(elementAssiseType, 0);
            
            // Si l'élément est bien positionné (face inférieure proche de 1.2cm), utiliser la hauteur exacte
            if (Math.abs(faceInferieureBrique - jointHeightExpected) < 0.1) {
                hauteurJointHorizontal = jointHeightExpected;
            }
        }
        
        // Si la hauteur calculée est positive, ajouter le joint horizontal
        if (hauteurJointHorizontal > 0.1) {
            // Dimensions du joint horizontal - même surface au sol que la brique
            const jointHorizontalDimensions = {
                length: dims.length, // Même longueur que la brique
                width: dims.width,   // Même largeur que la brique
                height: hauteurJointHorizontal // Hauteur calculée pour remplir l'espace
            };
            
            // Position du joint horizontal - centré entre le plan zéro de l'assise et la face inférieure de la brique
            const jointHorizontalPosition = {
                x: brickCenter.x,
                y: planZeroAssise - hauteurJointHorizontal/2, // Joint se termine au plan zéro (face inférieure du joint)
                z: brickCenter.z
            };
            
            // Ajouter le joint horizontal aux positions
            jointPositions.push({
                position: jointHorizontalPosition,
                rotation: rotation, // Même orientation que la brique
                type: 'joint-horizontal',
                dimensions: jointHorizontalDimensions,
                index: jointPositions.length,
                isHorizontalJoint: true,
                elementAssiseType: elementAssiseType,
                elementAssiseIndex: elementAssiseIndex
            });
            
            // console.log(`🔧 Joint horizontal automatique calculé: ${dims.length}×${dims.width}×${hauteurJointHorizontal.toFixed(1)} cm à Y=${jointHorizontalPosition.y.toFixed(1)}`);
        } else {
            console.warn(`🔧 Hauteur de joint horizontal invalide (${hauteurJointHorizontal} cm) - Pas de joint horizontal créé`);
        }

        // console.log(`🔧 DEBUG calculateJointPositionsLikeManual - Résultat final:`, {
        //     elementId: element.id,
        //     totalJoints: jointPositions.length,
        //     jointTypes: jointPositions.map(j => j.type),
        //     jointPositions: jointPositions
        // });
        
        return jointPositions;
    }

    /**
     * Crée un joint automatique à partir des données calculées
     * Utilise exactement la même logique que placeVerticalJoint
     * @param {Object} jointData - Données du joint (position, rotation, dimensions, type)
     * @param {WallElement} referenceElement - Élément de référence pour les calculs d'assise
     * @returns {boolean} True si le joint a été créé avec succès
     */
    createAutomaticJointFromSuggestion(jointData, referenceElement) {
        // console.log(`🔧 DEBUG createAutomaticJointFromSuggestion - Début:`, {
        //     jointType: jointData.type,
        //     position: jointData.position,
        //     dimensions: jointData.dimensions,
        //     referenceElementId: referenceElement?.id
        // });
        
        if (!jointData || !referenceElement) {
            console.warn('🔧 createAutomaticJointFromSuggestion: Données manquantes', {
                hasJointData: !!jointData,
                hasReferenceElement: !!referenceElement
            });
            return false;
        }

        // Vérifier s'il existe déjà un joint à cette position (déduplication)
        if (this.checkForExistingJointAtPosition(jointData.position, jointData.type)) {
            console.log('🔍 Joint déjà existant à cette position, création ignorée:', {
                position: jointData.position,
                type: jointData.type,
                referenceElementId: referenceElement.id
            });
            return false;
        }
        
        // console.log('🔧 Création automatique du joint:', jointData.type);
        // console.log('🔧 Position calculée (centre):', jointData.position);
        
        // ===== CONVERSION POSITION CENTRE → COIN INFÉRIEUR GAUCHE AVANT (copie exacte) =====
        const cos = Math.cos(jointData.rotation);
        const sin = Math.sin(jointData.rotation);
        
        // Offset du centre vers le coin inférieur gauche AVANT (inverse de updateMeshPosition)
        let offsetX = -jointData.dimensions.length / 2;  // vers la gauche depuis le centre
        let offsetZ = jointData.dimensions.width / 2;    // vers l'arrière depuis le centre
        
        // Appliquer la rotation à l'offset inverse
        const rotatedOffsetX = offsetX * cos - offsetZ * sin;
        const rotatedOffsetZ = offsetX * sin + offsetZ * cos;
        
        // Position du coin inférieur gauche avant
        const cornerX = jointData.position.x + rotatedOffsetX;
        const cornerZ = jointData.position.z + rotatedOffsetZ;
        
        // console.log('🔧 Position coin calculée (automatique):', { x: cornerX, y: jointData.position.y, z: cornerZ });
        
        // ===== CALCUL CORRECT DE LA POSITION Y POUR LES JOINTS VERTICAUX (copie exacte) =====
        let finalY = jointData.position.y; // Par défaut (pour joints horizontaux)
        let finalHeight = jointData.dimensions.height;
        
        if (jointData.isVerticalJoint) {
            // Pour les joints verticaux, calculer la position depuis le sol réel
            let planZeroReel = 0; // Sol réel pour assise 0
            
            // Déterminer l'assise de référence
            let referenceAssiseType = referenceElement.type;
            let referenceAssiseIndex = 0;
            
            if (window.AssiseManager) {
                // Chercher l'assise de l'élément de référence
                for (const [type, assisesForType] of window.AssiseManager.elementsByType) {
                    for (const [assiseIndex, elementsInAssise] of assisesForType) {
                        if (elementsInAssise.has(referenceElement.id)) {
                            referenceAssiseType = type;
                            referenceAssiseIndex = assiseIndex;
                            break;
                        }
                    }
                }
            }
            
            if (referenceAssiseIndex > 0 && window.AssiseManager) {
                // CORRECTION: Pour les autres assises, le joint démarre à la FIN COMPLÈTE de l'assise précédente
                // = hauteur du début de l'assise précédente + hauteur des éléments de cette assise
                const assiseBaseHeight = window.AssiseManager.calculateAssiseHeightForType(referenceAssiseType, referenceAssiseIndex - 1);
                const elementHeight = window.AssiseManager.getMaxElementHeightInAssiseForType(referenceAssiseType, referenceAssiseIndex - 1);
                planZeroReel = assiseBaseHeight + elementHeight;
                console.log(`🔧 Joint vertical automatique assise ${referenceAssiseIndex}: démarre à la fin COMPLÈTE assise ${referenceAssiseIndex - 1} = ${assiseBaseHeight}cm (base) + ${elementHeight}cm (éléments) = ${planZeroReel}cm`);
            }
            
            // Hauteur totale du joint (du plan zéro réel au sommet du bloc)
            const sommeBlocY = referenceElement.position.y + referenceElement.dimensions.height / 2;
            let hauteurJointComplete = sommeBlocY - planZeroReel;
            
            // CORRECTION SPÉCIALE: Pour les briques M50_CHANT, limiter la hauteur du joint à la hauteur de la brique
            if (referenceElement.blockType === 'M50_CHANT') {
                const hauteurBrique = referenceElement.dimensions.height; // 19 cm pour M50_CHANT
                const baseBriqueY = referenceElement.position.y - referenceElement.dimensions.height / 2;
                
                // Le joint ne doit pas dépasser la hauteur de la brique elle-même
                hauteurJointComplete = Math.min(hauteurJointComplete, hauteurBrique);
                
                // Recalculer finalY avec la hauteur limitée
                finalY = baseBriqueY + hauteurJointComplete / 2;
                
                console.log(`🧱 M50_CHANT détecté (joint automatique) - Joint vertical limité:`);
                console.log(`   - Hauteur brique: ${hauteurBrique} cm`);
                console.log(`   - Hauteur joint limitée: ${hauteurJointComplete} cm`);
            } else {
                // Centre du joint = plan zéro + hauteur/2
                finalY = planZeroReel + hauteurJointComplete / 2;
            }
            
            finalHeight = hauteurJointComplete;
            
            // console.log('🔧 Correction automatique position Y pour joint vertical:');
            // console.log(`   - Plan zéro réel: ${planZeroReel} cm`);
            // console.log(`   - Sommet bloc: ${sommeBlocY} cm`);
            // console.log(`   - Hauteur joint: ${hauteurJointComplete} cm`);
            // console.log(`   - Position Y corrigée: ${finalY} cm`);
        }
        
        // ===== CRÉATION DE L'ÉLÉMENT JOINT PERMANENT (copie exacte) =====
        const joint = new WallElement({
            type: 'joint', // Type spécifique pour les joints
            material: this.getJointMaterial(referenceElement), // Utiliser le matériau spécifique aux joints avec l'élément source
            x: cornerX,
            y: finalY,
            z: cornerZ,
            length: jointData.dimensions.length,
            width: jointData.dimensions.width,
            height: finalHeight,
            rotation: jointData.rotation
        });
        
        // console.log('🔧 Joint automatique créé avec position coin:', joint.position);
        
        // ===== VÉRIFICATION DES COLLISIONS (copie exacte) =====
        // console.log(`🔧 DEBUG - Vérification collision joint automatique:`, {
        //     jointId: joint.id,
        //     jointType: jointData.type,
        //     position: joint.position,
        //     dimensions: joint.dimensions
        // });
        
        // DÉSACTIVATION de la vérification de collision pour les joints automatiques
        // Les joints sont censés être en contact direct avec les briques
        if (true) { // !window.SceneManager.checkCollisions(joint)) {
            // console.log(`✅ Aucune collision détectée - Placement du joint automatique ${joint.id}`);
            
            // IMPORTANT: Marquer cet élément comme joint pour éviter le repositionnement automatique
            joint.isVerticalJoint = jointData.isVerticalJoint;
            joint.isHorizontalJoint = jointData.isHorizontalJoint;
            
            // 🎯 ASSOCIATION DIRECTE AVEC L'ÉLÉMENT PARENT - Stocker dans userData
            const parentId = referenceElement.id || referenceElement.elementId;
            joint.userData = joint.userData || {};
            joint.userData.parentElementId = parentId;
            joint.userData.parentElementType = jointData.parentElementType || referenceElement.type; // Marquer le type d'élément parent
            joint.userData.isJoint = true; // Marquer comme joint pour les filtres
            joint.userData.elementType = 'joint';
            joint.userData.isVerticalJoint = jointData.isVerticalJoint;
            joint.userData.isHorizontalJoint = jointData.isHorizontalJoint;
            // Stocker côté vertical explicite si disponible
            if (jointData.verticalJointSide) {
                joint.userData.verticalJointSide = jointData.verticalJointSide;
            } else if (jointData.type) {
                if (/droite|right/i.test(jointData.type)) joint.userData.verticalJointSide = 'right';
                else if (/gauche|left/i.test(jointData.type)) joint.userData.verticalJointSide = 'left';
            }
            
            // NOUVEAU: Assurer que le mesh.userData est aussi correctement configuré
            joint.mesh.userData.isJoint = true;
            joint.mesh.userData.parentElementId = parentId; // AJOUT MANQUANT !
            joint.mesh.userData.parentElementType = joint.userData.parentElementType;
            joint.mesh.userData.elementType = 'joint';
            joint.mesh.userData.isVerticalJoint = jointData.isVerticalJoint;
            joint.mesh.userData.isHorizontalJoint = jointData.isHorizontalJoint;
            if (joint.userData.verticalJointSide) {
                joint.mesh.userData.verticalJointSide = joint.userData.verticalJointSide;
            }
            
            // Appliquer la couleur appropriée selon le type de parent
            this.applyJointColorToElement(joint, joint.mesh.userData.parentElementType, referenceElement);
            
            // console.log(`🔗 Joint ${joint.userData.parentElementType === 'brick' ? 'brique' : 'bloc'} associé à l'élément parent:`, parentId);
            
            // Stocker le type d'assise de référence dans le joint
            if (referenceElement.type) {
                joint.referenceAssiseType = referenceElement.type;
            }
            
            // Stocker la hauteur de l'élément de référence pour les joints verticaux
            if (joint.isVerticalJoint) {
                joint.originalBrickHeight = referenceElement.dimensions.height;
            }
            
            // Ajouter le joint à la scène dans l'assise appropriée
            if (jointData.elementAssiseType && jointData.elementAssiseIndex !== undefined) {
                console.log(`🔧 Ajout joint à assise spécifiée: ${jointData.elementAssiseType} index ${jointData.elementAssiseIndex}`);
                // Utiliser l'assise spécifiée dans les données du joint
                window.SceneManager.addElementToSpecificAssise(joint, jointData.elementAssiseType, jointData.elementAssiseIndex);
            } else if (window.AssiseManager) {
                // Utiliser l'assise de l'élément de référence
                let targetType = referenceElement.type;
                let targetIndex = 0;
                
                // console.log(`🔧 Recherche assise de l'élément de référence ${referenceElement.id}...`);
                
                // Chercher l'assise de l'élément de référence
                for (const [type, assisesForType] of window.AssiseManager.elementsByType) {
                    for (const [assiseIndex, elementsInAssise] of assisesForType) {
                        if (elementsInAssise.has(referenceElement.id)) {
                            targetType = type;
                            targetIndex = assiseIndex;
                            // console.log(`🔧 Élément de référence trouvé dans assise: ${type} index ${assiseIndex}`);
                            break;
                        }
                    }
                }
                
                // console.log(`🔧 Ajout joint à assise trouvée: ${targetType} index ${targetIndex}`);
                window.SceneManager.addElementToSpecificAssise(joint, targetType, targetIndex);
                
                // NOTE: LayerManager sera appelé automatiquement par SceneManager
            } else {
                console.log(`🔧 Ajout joint via SceneManager.addElement (fallback)`);
                // Fallback: ajouter normalement
                window.SceneManager.addElement(joint);
                
                // NOTE: LayerManager sera appelé automatiquement par SceneManager
            }
            
            /*
            console.log('✅ Joint automatique placé avec succès:', {
                jointId: joint.id,
                jointType: jointData.type,
                finalPosition: joint.position
            });
            */
            
            return true;
        } else {
            // Collision détectée
            joint.dispose();
            console.warn('❌ Collision détectée, création automatique du joint annulée:', {
                jointType: jointData.type,
                position: joint.position
            });
            return false;
        }
    }

    // ========== SYSTÈME D'ANIMATION POINTS SNAP GRILLE ==========

    // Créer seulement le point snap curseur (pas de grille de points)
    createGridSnapPoints() {
        if (!window.SceneManager || !window.SceneManager.scene) {
            console.warn('SceneManager non disponible pour les points snap');
            return;
        }

        this.clearGridSnapPoints(); // Nettoyer les anciens points

        // console.log('🔴 Mode point curseur uniquement - pas de grille de points');
        
        // Démarrer l'animation pour le point curseur
        this.startSnapAnimation();
    }

    // Créer un point snap animé individuel
    createAnimatedSnapPoint(x, y, z) {
        try {
            // Géométrie sphérique plus visible pour le point
            const geometry = new THREE.SphereGeometry(1.5, 8, 6);
            
            // Utiliser MeshStandardMaterial qui supporte emissive
            const material = new THREE.MeshStandardMaterial({
                color: 0xff6600, // Orange vif
                transparent: true,
                opacity: 0.8,
                emissive: new THREE.Color(0xff3300), // Couleur émissive comme objet Color
                emissiveIntensity: 0.4,
                roughness: 0.3,
                metalness: 0.1
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, y + 1, z); // Légèrement au-dessus du sol
            
            // Marquer comme point snap pour identification
            mesh.userData.isGridSnapPoint = true;
            mesh.userData.originalPosition = { x, y: y + 1, z };
            mesh.userData.animationPhase = Math.random() * Math.PI * 2; // Phase aléatoire pour variation
            
            // Échelle initiale visible
            mesh.scale.setScalar(1.0);
            
            console.log(`📍 Point snap créé à position: ${x}, ${y + 1}, ${z}`);
            return mesh;
        } catch (error) {
            console.error('Erreur lors de la création du point snap:', error);
            return null;
        }
    }

    // Animation seulement pour le point snap curseur
    startSnapAnimation() {
        if (this.snapAnimationId) {
            cancelAnimationFrame(this.snapAnimationId);
        }

        // console.log(`🎬 Démarrage animation du point snap curseur uniquement`);

        const animate = () => {
            if (!this.showGridSnap) {
                console.log('🛑 Animation arrêtée - showGridSnap:', this.showGridSnap);
                return;
            }

            const time = Date.now() * 0.002; // Facteur de temps pour l'animation

            // Animer seulement le point snap du curseur avec de beaux effets 2D
            if (this.cursorSnapPoint && this.cursorSnapPoint.material) {
                try {
                    const cursorPhase = this.cursorSnapPoint.animationPhase || 0;
                    
                    // Animation de pulsation douce pour le cercle 2D
                    const pulseScale = 1.0 + 0.3 * Math.sin(time * 3 + cursorPhase);
                    this.cursorSnapPoint.scale.setScalar(pulseScale);
                    
                    // Animation d'opacité ondulante
                    const opacity = 0.4 + 0.4 * Math.sin(time * 2.5 + cursorPhase);
                    this.cursorSnapPoint.material.opacity = opacity;
                    
                    // Effet de rotation lente pour plus de dynamisme
                    this.cursorSnapPoint.rotation.z += 0.01;
                    
                    // Changement de couleur subtil (du rouge au orange)
                    const colorPhase = 0.5 + 0.3 * Math.sin(time * 1.8 + cursorPhase);
                    const red = 1.0;
                    const green = 0.3 * colorPhase;
                    const blue = 0.1 * colorPhase;
                    this.cursorSnapPoint.material.color.setRGB(red, green, blue);
                    
                } catch (error) {
                    console.error('Erreur dans l\'animation du point snap curseur:', error);
                }
            }

            this.snapAnimationId = requestAnimationFrame(animate);
        };

        animate();
    }

    // Arrêter l'animation des points snap
    stopSnapAnimation() {
        if (this.snapAnimationId) {
            cancelAnimationFrame(this.snapAnimationId);
            this.snapAnimationId = null;
        }
    }

    // Nettoyer les points snap
    clearGridSnapPoints() {
        this.stopSnapAnimation();
        
        if (window.SceneManager && window.SceneManager.scene) {
            this.gridSnapPoints.forEach(point => {
                if (point) {
                    window.SceneManager.scene.remove(point);
                    if (point.geometry) point.geometry.dispose();
                    if (point.material) point.material.dispose();
                }
            });
        }
        
        this.gridSnapPoints = [];
        
        // Nettoyer aussi le point snap du curseur
        this.removeCursorSnapPoint();
    }

    // Mettre à jour le point snap qui suit le curseur
    updateCursorSnapPoint(x, y, z) {
        if (!this.showGridSnap) {
            this.removeCursorSnapPoint();
            return;
        }

        // Si pas de point snap curseur, le créer IMMÉDIATEMENT
        if (!this.cursorSnapPoint) {
            this.createCursorSnapPoint();
            // console.log('🔴 Point snap curseur créé lors du mouvement souris');
        }

        // Mettre à jour la position du point snap curseur
        if (this.cursorSnapPoint) {
            // CORRECTION: Utiliser l'accrochage à la grille d'AssiseManager si disponible
            let snappedX = x;
            let snappedZ = z;
            let snapY = 0.05; // Valeur par défaut au sol
            
            if (window.AssiseManager && typeof window.AssiseManager.snapToAssiseGrid === 'function') {
                const snapped = window.AssiseManager.snapToAssiseGrid(x, z);
                snappedX = snapped.x;
                snappedZ = snapped.z;
                
                // CORRECTION PRINCIPALE: Utiliser la hauteur de l'assise active
                if (typeof window.AssiseManager.getCurrentAssiseHeight === 'function') {
                    snapY = window.AssiseManager.getCurrentAssiseHeight() + 0.1; // Légèrement au-dessus de la grille d'assise
                    // console.log(`🎯 Point snap positionné sur grille d'assise: (${snappedX.toFixed(1)}, ${snapY.toFixed(1)}, ${snappedZ.toFixed(1)})`);
                } else {
                    console.warn('⚠️ AssiseManager.getCurrentAssiseHeight non disponible');
                }
            } else {
                console.warn('⚠️ AssiseManager.snapToAssiseGrid non disponible, utilisation des coordonnées brutes');
            }
            
            // Positionner le cercle 2D exactement au centre des coordonnées accrochées sur la grille d'assise
            this.cursorSnapPoint.position.set(snappedX, snapY, snappedZ);
            this.cursorSnapPoint.visible = true; // Forcer la visibilité
        }
    }

    // Créer le point snap qui suit le curseur (cercle 2D horizontal)
    createCursorSnapPoint() {
        if (!window.SceneManager || !window.SceneManager.scene) {
            console.error('🔴 Impossible de créer le point curseur - SceneManager non disponible');
            return;
        }

        // Nettoyer l'ancien point s'il existe
        this.removeCursorSnapPoint();

        // Créer un cercle plat horizontal au lieu d'une sphère
        const geometry = new THREE.RingGeometry(0.8, 1.2, 32);  // Anneau avec trou au centre
        const material = new THREE.MeshBasicMaterial({
            color: 0xff4444,  // Rouge plus doux
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,  // Visible des deux côtés
            depthWrite: false  // Pour éviter les problèmes de tri
        });

        this.cursorSnapPoint = new THREE.Mesh(geometry, material);
        
        // Positionner le cercle horizontalement (rotation sur X de -90°)
        this.cursorSnapPoint.rotation.x = -Math.PI / 2;
        
        this.cursorSnapPoint.userData = { 
            type: 'cursor-snap-point',
            isCursorSnapPoint: true
        };

        // Position initiale visible pour test
        this.cursorSnapPoint.position.set(0, 0.1, 0);  // Légèrement au-dessus du sol
        this.cursorSnapPoint.visible = true;

        window.SceneManager.scene.add(this.cursorSnapPoint);

        // Ajouter une pulsation plus rapide pour le distinguer
        this.cursorSnapPoint.animationPhase = Math.random() * Math.PI * 2;
        
        // console.log('🔴 Point snap curseur 2D créé - Position initiale:', this.cursorSnapPoint.position);
        // console.log('🔴 Point curseur horizontal ajouté à la scène');
        
        return this.cursorSnapPoint;
    }

    // Supprimer le point snap du curseur
    removeCursorSnapPoint() {
        if (this.cursorSnapPoint && window.SceneManager && window.SceneManager.scene) {
            window.SceneManager.scene.remove(this.cursorSnapPoint);
            this.cursorSnapPoint.geometry.dispose();
            this.cursorSnapPoint.material.dispose();
            this.cursorSnapPoint = null;
        }
    }

    // Activer/désactiver l'affichage des points snap
    toggleGridSnapPoints() {
        this.showGridSnap = !this.showGridSnap;
        
        if (this.showGridSnap) {
            this.createGridSnapPoints();
            // Créer immédiatement le point curseur si le fantôme existe
            if (this.ghostElement && this.ghostElement.mesh.visible) {
                this.createCursorSnapPoint();
                // console.log('🔴 Point snap curseur créé lors de l\'activation');
            }
            console.log('✨ Points snap de grille activés');
        } else {
            this.clearGridSnapPoints();
            console.log('🔲 Points snap de grille désactivés');
        }
        
        return this.showGridSnap;
    }

    // Méthode pour ajuster l'espacement de la grille
    setSnapGridSpacing(spacing) {
        this.snapGridSpacing = spacing;
        
        // Recréer les points si ils sont actifs
        if (this.showGridSnap) {
            this.createGridSnapPoints();
        }
        
        console.log(`📐 Espacement de grille snap mis à jour: ${spacing}cm`);
    }

    // ========== GESTION DE L'ICÔNE DE SUPPRESSION ==========
    
    /**
     * Afficher l'icône de suppression près de la brique sélectionnée
     * @param {WallElement} element - La brique sélectionnée
     */
    showDeleteIcon(element) {
        if (!element || !element.mesh) return;
        
        // Supprimer l'ancienne icône si elle existe
        this.hideDeleteIcon();
        
        // Créer l'icône de suppression
        const deleteIcon = document.createElement('div');
        deleteIcon.className = 'brick-delete-icon';
        deleteIcon.innerHTML = '<i class="fas fa-trash"></i>';
        deleteIcon.id = 'brickDeleteIcon';
        deleteIcon.title = 'Supprimer cette brique et ses joints';
        
        // FORCER UNE POSITION VISIBLE IMMÉDIATEMENT
        deleteIcon.style.cssText = `
            position: fixed !important;
            top: 20% !important;
            left: 20% !important;
            width: 50px !important;
            height: 50px !important;
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
            border: 3px solid white !important;
            border-radius: 50% !important;
            z-index: 99999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
            box-shadow: 0 6px 20px rgba(220, 38, 38, 0.5) !important;
            transition: all 0.3s ease !important;
        `;
        
        // console.log('🗑️ Icône créée avec position forcée visible');
        
        // Ajouter l'événement de clic
        deleteIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteBrickWithJoints(element);
        });
        
        // Ajouter au DOM
        document.body.appendChild(deleteIcon);
        
        // Activer le debug temporaire pour voir le positionnement
        window.DEBUG_CONSTRUCTION = true;
        
        // Sauvegarder la référence
        this.currentDeleteIcon = deleteIcon;
        this.currentDeleteIconElement = element;
        
        // console.log('🗑️ Icône ajoutée au DOM, maintenant visible');
        
        // Calculer la vraie position après un court délai et animer vers elle
        setTimeout(() => {
            this.animateIconToCorrectPosition(element);
            this.setupCameraTracking(element);
        }, 500);
        
        // console.log('🗑️ Icône de suppression affichée pour:', element.id);
    }
    
    /**
     * Mettre à jour la position de l'icône de suppression
     * @param {WallElement} element - La brique sélectionnée
     */
    updateDeleteIconPosition(element) {
        if (!this.currentDeleteIcon || !element || !element.mesh) return;
        
        // Calculer la position 3D de la brique
        const vector = new THREE.Vector3();
        element.mesh.getWorldPosition(vector);
        
        // Calculer la distance de la caméra à la brique pour ajuster l'offset selon le zoom
        const cameraPosition = window.SceneManager.camera.position;
        const distanceToCamera = cameraPosition.distanceTo(vector);
        
        // Facteur d'éloignement basé sur la distance (plus on dézoom, plus l'icône s'éloigne)
        const zoomFactor = Math.max(1, distanceToCamera / 200); // Facteur qui augmente avec la distance
        
        // Ajouter un offset pour positionner l'icône au-dessus et à droite de la brique (adaptatif au zoom)
        const baseOffsetY = Math.max(element.dimensions.height / 2 + 30, 35);
        const baseOffsetX = Math.max(element.dimensions.length / 2 + 20, 25);
        
        // Appliquer le facteur de zoom pour éloigner l'icône quand on dézoom
        const offsetY = baseOffsetY * zoomFactor;
        const offsetX = baseOffsetX * zoomFactor;
        
        vector.y += offsetY;
        vector.x += offsetX;
        
        // Projeter en coordonnées 2D de l'écran
        vector.project(window.SceneManager.camera);
        
        // Vérifier si l'objet est visible (dans le frustum de la caméra)
        if (vector.z > 1) {
            // L'objet est derrière la caméra, masquer l'icône
            this.currentDeleteIcon.style.display = 'none';
            return;
        }
        
        const canvas = window.SceneManager.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        
        // Convertir les coordonnées normalisées (-1 à 1) en pixels
        const x = (vector.x * 0.5 + 0.5) * canvas.clientWidth + rect.left;
        const y = (-vector.y * 0.5 + 0.5) * canvas.clientHeight + rect.top;
        
        // Vérifier que l'icône reste dans les limites de l'écran
        const iconSize = 36;
        const margin = 10;
        
        const clampedX = Math.max(margin, Math.min(x, window.innerWidth - iconSize - margin));
        const clampedY = Math.max(margin, Math.min(y, window.innerHeight - iconSize - margin));
        
        // Positionner l'icône
        this.currentDeleteIcon.style.left = `${clampedX}px`;
        this.currentDeleteIcon.style.top = `${clampedY}px`;
        this.currentDeleteIcon.style.display = 'flex';
        this.currentDeleteIcon.style.visibility = 'visible';
        this.currentDeleteIcon.style.opacity = '1';
        
        // Utiliser requestAnimationFrame au lieu de forcer un reflow
        // this.currentDeleteIcon.offsetHeight; // ❌ Force un reflow coûteux
        
        // Debug pour comprendre le positionnement (désactivé pour réduire les logs)
        if (window.DEBUG_CONSTRUCTION && false) {
            console.log('🗑️ Position icône:', {
                element: element.id,
                world3D: {x: vector.x, y: vector.y, z: vector.z},
                screen2D: {x: clampedX, y: clampedY},
                canvas: {width: canvas.clientWidth, height: canvas.clientHeight},
                rect: rect,
                iconVisible: this.currentDeleteIcon.style.display !== 'none',
                iconOpacity: this.currentDeleteIcon.style.opacity
            });
        }
    }
    
    /**
     * Animer l'icône vers la position correcte près de la brique
     * @param {WallElement} element - La brique sélectionnée
     */
    animateIconToCorrectPosition(element) {
        if (!this.currentDeleteIcon || !element || !element.mesh) return;
        
        // Calculer la position cible
        const vector = new THREE.Vector3();
        element.mesh.getWorldPosition(vector);
        
        const offsetY = Math.max(element.dimensions.height / 2 + 10, 15);
        const offsetX = Math.max(element.dimensions.length / 3, 8);
        
        vector.y += offsetY;
        vector.x += offsetX;
        vector.project(window.SceneManager.camera);
        
        if (vector.z > 1) {
            console.log('🗑️ Brique hors champ, icône reste en position fixe');
            return;
        }
        
        const canvas = window.SceneManager.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        
        const targetX = (vector.x * 0.5 + 0.5) * canvas.clientWidth + rect.left;
        const targetY = (-vector.y * 0.5 + 0.5) * canvas.clientHeight + rect.top;
        
        const iconSize = 50;
        const margin = 10;
        
        const clampedX = Math.max(margin, Math.min(targetX, window.innerWidth - iconSize - margin));
        const clampedY = Math.max(margin, Math.min(targetY, window.innerHeight - iconSize - margin));
        
        // Animer vers la position cible
        this.currentDeleteIcon.style.left = `${clampedX}px`;
        this.currentDeleteIcon.style.top = `${clampedY}px`;
        
        // console.log('🗑️ Animation vers position:', {
        //     target: {x: clampedX, y: clampedY},
        //     element: element.id
        // });
    }
    
    /**
     * Configurer le suivi de la caméra pour mettre à jour la position de l'icône
     * @param {WallElement} element - La brique suivie
     */
    setupCameraTracking(element) {
        if (!element || !this.currentDeleteIcon) return;
        
        // Sauvegarder la référence de l'élément tracké
        this.trackedElement = element;
        
        // Fonction de mise à jour de la position
        const updatePosition = () => {
            if (this.currentDeleteIcon && this.trackedElement) {
                this.updateDeleteIconPosition(this.trackedElement);
            }
        };
        
        // Écouteurs d'événements pour les changements de caméra
        if (window.SceneManager && window.SceneManager.controls) {
            const controls = window.SceneManager.controls;
            
            // Écouter les changements de position de la caméra
            controls.addEventListener('change', updatePosition);
            
            // Nettoyer les écouteurs lors de la suppression de l'icône
            this.cameraUpdateListener = updatePosition;
        }
        
        // console.log('🗑️ Suivi de caméra configuré pour:', element.id);
    }
    
    /**
     * Masquer l'icône de suppression
     */
    hideDeleteIcon() {
        if (this.currentDeleteIcon) {
            // Nettoyer l'écouteur de caméra
            if (this.cameraUpdateListener && window.SceneManager && window.SceneManager.controls) {
                window.SceneManager.controls.removeEventListener('change', this.cameraUpdateListener);
                this.cameraUpdateListener = null;
            }
            
            this.currentDeleteIcon.remove();
            this.currentDeleteIcon = null;
            this.currentDeleteIconElement = null;
            this.trackedElement = null;
        }
    }
    
    /**
     * Supprimer la brique et ses joints liés
     * @param {WallElement} element - La brique à supprimer
     */
    deleteBrickWithJoints(element) {
        if (!element || !element.id) {
            console.warn('🗑️ Impossible de supprimer: élément invalide');
            return;
        }
        
        // console.log('🗑️ Suppression de la brique et de ses joints liés:', element.id);
        
        // Vérifier les permissions de suppression
        if (window.AssiseManager && !window.AssiseManager.canSelectElement(element.id, true)) {
            console.log(`🔒 BLOCAGE SUPPRESSION: Élément ${element.id} d'assise inférieure - suppression refusée`);
            this.showNotification('Impossible de supprimer un élément d\'assise inférieure', 'warning');
            return;
        }
        
        // Trouver les joints associés
        const associatedJoints = this.findAssociatedJoints(element);
        const jointCount = associatedJoints.length;
        
        try {
            // Supprimer les joints associés
            associatedJoints.forEach(joint => {
                if (joint.parent) {
                    joint.parent.remove(joint);
                }
                // Supprimer le joint des managers
                const jointId = joint.userData.elementId || joint.userData.id || joint.name;
                this.removeElementFromManagers(joint, jointId);
                // console.log('🔗 Joint associé supprimé:', jointId);
            });
            
            // Supprimer l'élément principal
            if (element.parent) {
                element.parent.remove(element);
            }
            
            // Supprimer des managers
            this.removeElementFromManagers(element, element.id);
            
            // Masquer l'icône de suppression
            this.hideDeleteIcon();
            
            // Désactiver les suggestions
            this.deactivateSuggestions();
            
            // Afficher un message de confirmation
            const message = jointCount > 0 
                ? `🗑️ Brique et ${jointCount} joints supprimés`
                : `🗑️ Brique supprimée`;
            this.showNotification(message, 'success');
            
            // console.log(`✅ Suppression terminée: 1 brique + ${jointCount} joints`);
            
        } catch (error) {
            console.error('❌ Erreur lors de la suppression:', error);
            this.showNotification('Erreur lors de la suppression', 'error');
        }
    }
    
    /**
     * Trouver les joints associés à un élément
     * @param {WallElement} element - L'élément dont on cherche les joints
     * @returns {Array} Liste des joints associés
     */
    findAssociatedJoints(element) {
        const joints = [];
        
        if (!element || !element.id) return joints;
        
        // Parcourir la scène pour trouver les joints liés
        if (window.SceneManager && window.SceneManager.scene) {
            window.SceneManager.scene.traverse((child) => {
                if (child.userData && 
                    child.userData.isJoint && 
                    child.userData.parentElementId === element.id) {
                    joints.push(child);
                }
            });
        }
        
        // Parcourir aussi les groupes d'assise si disponibles
        if (window.SceneManager && window.SceneManager.assiseGroups) {
            window.SceneManager.assiseGroups.forEach(group => {
                group.traverse((child) => {
                    if (child.userData && 
                        child.userData.isJoint && 
                        child.userData.parentElementId === element.id) {
                        joints.push(child);
                    }
                });
            });
        }
        
        // console.log(`🔗 ${joints.length} joints trouvés pour l'élément ${element.id}`);
        return joints;
    }
    
    /**
     * Supprimer un élément des différents managers
     * @param {Object} element - L'élément à supprimer
     * @param {string} elementId - L'ID de l'élément
     */
    removeElementFromManagers(element, elementId) {
        // Supprimer du SceneManager
        if (window.SceneManager && window.SceneManager.removeElement) {
            window.SceneManager.removeElement(elementId);
        }
        
        // Supprimer du LayerManager si disponible
        if (window.LayerManager && window.LayerManager.onElementRemoved) {
            window.LayerManager.onElementRemoved(element);
        }
        
        // Mettre à jour l'onglet Métré
        if (window.MetreTabManager && window.MetreTabManager.refreshData) {
            window.MetreTabManager.refreshData();
        }
    }
    
    /**
     * Afficher une notification temporaire
     * @param {string} message - Le message à afficher
     * @param {string} type - Le type de notification ('success', 'warning', 'error')
     */
    showNotification(message, type = 'info') {
        // Utiliser le système de notification existant s'il est disponible
        if (window.BrickSelector && window.BrickSelector.showNotification) {
            window.BrickSelector.showNotification(message);
            return;
        }
        
        // Sinon, créer une notification simple
        const notification = document.createElement('div');
        notification.className = `construction-notification construction-notification-${type}`;
        notification.textContent = message;
        
        // Style de base
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#059669' : type === 'warning' ? '#D97706' : type === 'error' ? '#DC2626' : '#3B82F6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 300px;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animation d'apparition
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
        });
        
        // Suppression automatique
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Instance globale
window.ConstructionTools = new ConstructionTools();

// Fonction d'aide pour debugging des joints
window.enableJointDebug = false;
window.debugJoints = function(enable = true) {
    window.enableJointDebug = enable;
    console.log(`🧪 Debug joints ${enable ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
    if (enable) {
        console.log('🧪 Utilisez Ctrl+Clic sur un bloc 1/2 pour voir les logs de détection d\'adjacence');
    }
};

// Exposer les fonctions de test globalement pour les tests depuis la console
window.testGridSnapPoints = function() {
    console.log('🧪 Test des points snap de grille');
    console.log('État actuel:', {
        showGridSnap: window.ConstructionTools.showGridSnap,
        pointsCount: window.ConstructionTools.gridSnapPoints.length,
        isInitialized: window.ConstructionTools.isInitialized,
        hasSceneManager: !!window.SceneManager,
        hasScene: !!(window.SceneManager && window.SceneManager.scene),
        hasAssiseManager: !!window.AssiseManager,
        assiseManagerState: window.AssiseManager ? {
            currentType: window.AssiseManager.currentType,
            showAssiseGrids: window.AssiseManager.showAssiseGrids,
            currentAssise: window.AssiseManager.currentAssiseByType.get(window.AssiseManager.currentType)
        } : 'Non disponible'
    });
    
    // Activer les points snap
    window.ConstructionTools.toggleGridSnapPoints();
    
    return {
        success: window.ConstructionTools.showGridSnap,
        pointsCreated: window.ConstructionTools.gridSnapPoints.length
    };
};

// Fonction de test qui affiche l'état d'AssiseManager
window.debugAssiseManager = function() {
    if (!window.AssiseManager) {
        console.error('❌ AssiseManager non disponible');
        return;
    }
    
    console.log('🏗️ État d\'AssiseManager:', {
        currentType: window.AssiseManager.currentType,
        showAssiseGrids: window.AssiseManager.showAssiseGrids,
        allSupportedTypes: window.AssiseManager.allSupportedTypes,
        currentAssiseByType: Object.fromEntries(window.AssiseManager.currentAssiseByType),
        assisesByType: Array.from(window.AssiseManager.assisesByType.entries()).map(([type, assises]) => ({
            type,
            count: assises.size,
            indices: Array.from(assises.keys())
        }))
    });
    
    // Tester la grille active
    const currentType = window.AssiseManager.currentType;
    const currentAssiseIndex = window.AssiseManager.currentAssiseByType.get(currentType);
    const assisesForType = window.AssiseManager.assisesByType.get(currentType);
    
    console.log('🎯 Assise active:', {
        type: currentType,
        index: currentAssiseIndex,
        exists: assisesForType && assisesForType.has(currentAssiseIndex),
        assise: assisesForType ? assisesForType.get(currentAssiseIndex) : null
    });
    
    return {
        available: true,
        currentType,
        showGrids: window.AssiseManager.showAssiseGrids,
        activeAssiseExists: assisesForType && assisesForType.has(currentAssiseIndex)
    };
};

// NOUVELLE FONCTIONNALITÉ : Créer un joint vertical spécifique (droit ou gauche)
ConstructionTools.prototype.createSpecificVerticalJoint = function(element, side = 'right') {
    if (!element || (element.type !== 'brick' && element.type !== 'block')) {
        console.warn('⚠️ Élément invalide pour création de joint spécifique:', element);
        return false;
    }

    // Vérifier si cet élément peut avoir des joints
    const jointSettings = this.getJointSettingsForElement(element);
    if (!jointSettings.createJoints) {
        console.log(`🚫 Création de joint vertical ${side} refusée pour l'élément ${element.id} - joints désactivés pour ce type`);
        return false;
    }

    // console.log(`🔧 Création d'un joint vertical ${side} pour l'élément:`, element.id);

    // Stocker la brique de référence
    this.referenceElement = element;
    this.activeBrickForSuggestions = element;

    // Stocker l'assise de référence
    if (window.AssiseManager) {
        this.referenceAssiseType = window.AssiseManager.currentType;
        this.referenceAssiseIndex = window.AssiseManager.currentAssise;
    }

    // Calculer la position et dimensions du joint
    const basePos = element.position;
    const rotation = element.rotation;
    const dims = element.dimensions;

    // Joint vertical spécifique au matériau de l'élément
    const jointVertical = this.getJointVerticalThickness(element);

    // VALIDATION: Vérifier si l'épaisseur du joint vertical est > 0
    if (jointVertical <= 0) {
        console.log(`🚫 Création de joint vertical ${side} refusée pour l'élément ${element.id} - épaisseur joint vertical = ${jointVertical}cm (béton cellulaire)`);
        return false;
    }

    // Position selon le côté demandé
    let jointPosition;
    if (side === 'right') {
        // Joint à droite de l'élément
        jointPosition = {
            x: dims.length/2 + jointVertical/2, // À l'extérieur de la face droite
            z: 0, // Centré sur la largeur
            rotation: rotation + Math.PI/2, // Perpendiculaire à la brique
            type: 'joint-debout-droite'
        };
    } else { // side === 'left'
        // Joint à gauche de l'élément
        jointPosition = {
            x: -(dims.length/2 + jointVertical/2), // À l'extérieur de la face gauche
            z: 0, // Centré sur la largeur
            rotation: rotation + Math.PI/2, // Perpendiculaire à la brique
            type: 'joint-debout-gauche'
        };
    }

    // Calculer la position mondiale
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    // Centre de la brique
    let centerOffsetX = dims.length / 2;
    let centerOffsetZ = -dims.width / 2;

    const rotatedCenterOffsetX = centerOffsetX * cos - centerOffsetZ * sin;
    const rotatedCenterOffsetZ = centerOffsetX * sin + centerOffsetZ * cos;

    const brickCenter = {
        x: basePos.x + rotatedCenterOffsetX,
        y: basePos.y,
        z: basePos.z + rotatedCenterOffsetZ
    };

    // Appliquer la position du joint par rapport au centre
    const rotatedOffsetX = jointPosition.x * cos - jointPosition.z * sin;
    const rotatedOffsetZ = jointPosition.x * sin + jointPosition.z * cos;

    const worldX = brickCenter.x + rotatedOffsetX;
    const worldZ = brickCenter.z + rotatedOffsetZ;

    // Hauteur du joint (jusqu'au plan zéro ou au sommet de l'élément)
    let jointHeight;
    let worldY;

    if (window.AssiseManager) {
        const assiseInfo = window.AssiseManager.getElementAssiseAndType(element.id);
        let planZeroAssise = 0;

        if (assiseInfo && assiseInfo.assiseIndex !== undefined) {
            planZeroAssise = window.AssiseManager.getAssiseHeight(assiseInfo.type, assiseInfo.assiseIndex);
        }

        const sommeBlocY = element.position.y + element.dimensions.height / 2;
        jointHeight = sommeBlocY - planZeroAssise;
        worldY = planZeroAssise + jointHeight / 2;
    } else {
        jointHeight = element.dimensions.height;
        worldY = basePos.y;
    }

    // Dimensions du joint
    const jointDimensions = {
        length: dims.width, // Largeur de la brique
        width: jointVertical, // Épaisseur du joint
        height: jointHeight
    };

    // Créer les données du joint
    const jointData = {
        position: { x: worldX, y: worldY, z: worldZ },
        rotation: jointPosition.rotation,
        type: jointPosition.type,
        dimensions: jointDimensions,
        isVerticalJoint: true,
    parentElementType: element.type,
    // Ajout: stockage explicite du côté pour fiabilité détection ultérieure
    verticalJointSide: side === 'left' ? 'left' : 'right'
    };

    // Créer le joint automatiquement
    const success = this.createAutomaticJointFromSuggestion(jointData, element);

    if (success) {
        // console.log(`✅ Joint vertical ${side} créé avec succès pour l'élément ${element.id}`);
        
        // Jouer le son de placement
        // Son supprimé
    } else {
        console.log(`❌ Échec de la création du joint vertical ${side} pour l'élément ${element.id}`);
        
        // Jouer le son d'erreur
        // Son supprimé
    }

    return success;
};

// Points snap système opérationnel ✅
// Seul le point rouge curseur est créé quand vous appuyez sur 'G'

// NOUVEAU: Fonction globale pour basculer l'affichage des lettres de proposition adjacente
window.toggleAdjacentProposalLetters = function() {
    window.showAdjacentProposalLetters = !window.showAdjacentProposalLetters;
    console.log(`🔤 Lettres de proposition adjacente: ${window.showAdjacentProposalLetters ? 'ACTIVÉES' : 'DÉSACTIVÉES'}`);
    
    // Parcourir tous les éléments fantômes existants et mettre à jour la visibilité des lettres
    if (window.ConstructionTools && window.ConstructionTools.ghostElements && Array.isArray(window.ConstructionTools.ghostElements)) {
        window.ConstructionTools.ghostElements.forEach(ghost => {
            if (ghost && ghost.mesh && ghost.mesh.userData && ghost.mesh.userData.textMesh) {
                ghost.mesh.userData.textMesh.visible = window.showAdjacentProposalLetters;
            }
        });
    }
    
    return window.showAdjacentProposalLetters;
};


