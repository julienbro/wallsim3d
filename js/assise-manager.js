// Gestionnaire des assises (rangàes de briques) - Version Multi-Types
class AssiseManager {
    constructor() {
        // Systàme multi-stack: une stack d'assises par type d'élément
        this.assisesByType = new Map(); // Map<type, Map<assiseIndex, assise>>
        this.elementsByType = new Map(); // Map<type, Map<assiseIndex, Set<elementId>>>
        this.gridHelpersByType = new Map(); // Map<type, Map<assiseIndex, gridHelper>>
        this.attachmentMarkersByType = new Map(); // Map<type, Map<assiseIndex, markers>>
        
        // Types d'éléments supportés - incluant les sous-types de briques et blocs
    this.supportedTypes = ['brick', 'block', 'insulation', 'custom', 'joint', 'linteau', 'beam', 'diba']; // ajout beam + diba (membrane, pas de joints)
        
        // Sous-types de briques supportés pour gestion d'assise indépendante
        this.brickSubTypes = ['M50', 'M57', 'M60', 'M65', 'M90'];
        
        // Sous-types de blocs supportés pour gestion d'assise indépendante
        this.blockSubTypes = ['CREUX', 'CELLULAIRE', 'ARGEX', 'TERRE_CUITE', 'B9', 'B14', 'B19', 'B29', 'BC5', 'BC7', 'BC10', 'BC15', 'BC17', 'BC20', 'BC24', 'BC30', 'BC36', 'ARGEX9', 'ARGEX14', 'ARGEX19', 'TC10', 'TC14', 'TC19'];
        
        // Sous-types de linteaux supportés pour gestion d'assise indépendante
        this.linteauSubTypes = ['LINTEAU_L120', 'LINTEAU_L140', 'LINTEAU_L160', 'LINTEAU_L180', 'LINTEAU_L200'];
        
        // Sous-types GLB supportés pour gestion d'assise indépendante
        this.glbSubTypes = ['hourdis_13_60', 'hourdis_16_60'];
        
        // Extension des types supportés avec les sous-types de briques, blocs, linteaux et GLB
        this.allSupportedTypes = [...this.supportedTypes, ...this.brickSubTypes, ...this.blockSubTypes, ...this.linteauSubTypes, ...this.glbSubTypes];
        
        // 🔧 NOUVELLE MÉTHODE: Vérification dynamique des types personnalisés
        this.customTypeCache = new Set();

        // État actuel
        this.currentType = 'M65'; // Type d'assise actif (M65 par défaut)
        this.currentAssiseByType = new Map(); // Map<type, assiseIndex> - assise active par type
        
        // Garde anti-boucle infinie pour le repositionnement
        this.isRepositioning = false;
        
        // Hauteur du joint horizontal par type d'assise (par défaut 1.2cm)
        this.jointHeightByType = new Map();
        
        // Hauteur du joint par assise individuelle : Map<type, Map<assiseIndex, jointHeight>>
        this.jointHeightByAssise = new Map();
        
        for (const type of this.allSupportedTypes) {
            // CORRECTION: Les isolants, hourdis, poutres et diba n'ont pas de joints horizontaux
            const defaultJointHeight = (type === 'insulation' || type.includes('hourdis') || type === 'beam' || type === 'diba') ? 0 : 1.2; // beam & diba sans joint horizontal
            this.jointHeightByType.set(type, defaultJointHeight);
            this.jointHeightByAssise.set(type, new Map());
        }
        
        this.showAssiseGrids = false;
        this.showAttachmentMarkers = true; // Contràle l'affichage des marqueurs d'accroche
        this.isInitialized = false;
        
        // Point d'accrochage dynamique qui suit la souris
        this.snapPoint = null; // Point d'accrochage unique
        this.showSnapPoint = true; // Afficher le point d'accrochage
        
        // Paramàtres visuels
        this.gridColor = 0x3498db; // Couleur de la grille de l'assise
        this.activeGridColor = 0xe74c3c; // Couleur de la grille active
        this.attachmentMarkerColor = 0xf39c12; // Couleur des marqueurs d'accroche (orange)
        this.attachmentMarkerOpacity = 0.7; // Opacità des marqueurs d'accroche
        this.gridOpacity = 0.3;
        this.activeGridOpacity = 0.6;
        
        // Propriàtàs d'animation pour les points d'accroche
        this.animationFrameId = null;
        this.animationRunning = false;
        
        // Initialiser les structures pour chaque type
        this.initializeTypeStructures();

        // === DEBUG ISOLATION GHOST (instrumentation légère) ===
        // Activer/désactiver: window.DEBUG_ISOLATION_GHOST = true/false dans la console.
        if (typeof window !== 'undefined' && window.DEBUG_ISOLATION_GHOST === undefined) {
            window.DEBUG_ISOLATION_GHOST = true; // Activé par défaut pour analyse utilisateur
        }
        if (typeof window !== 'undefined' && !window._isoGhostLog) {
            window._isoGhostLog = function(stage, info) {
                if (window.DEBUG_ISOLATION_GHOST) {
                    try { console.log('🧥👻[ISO-GHOST]', stage, info); } catch(e) {}
                }
            };
            // Utilitaire de dump complet état isolant
            window.dumpIsoState = () => {
                try {
                    const am = window.AssiseManager;
                    if (!am) { console.warn('AssiseManager indisponible'); return; }
                    const map = am.assisesByType.get('insulation');
                    const data = [];
                    if (map) {
                        for (const [idx, ass] of map.entries()) {
                            data.push({
                                index: idx,
                                height: am.getAssiseHeightForType('insulation', idx),
                                elementCount: ass.elements.size
                            });
                        }
                    }
                    const ghost = window.ConstructionTools?.ghostElement;
                    const ghostInfo = ghost ? {
                        y: ghost.position.y,
                        dims: ghost.dimensions,
                        mode: window.ConstructionTools.currentMode,
                        currentAssiseIndex: am.currentAssiseByType.get('insulation')
                    } : null;
                    console.log('🧥👻 dumpIsoState', { assises: data, ghost: ghostInfo });
                    return { assises: data, ghost: ghostInfo };
                } catch(e) { console.error('dumpIsoState error', e); }
            };
        }
    }

    /**
     * Vérifie si un type est supporté (incluant les types personnalisés dynamiques)
     */
    isTypeSupported(type) {
        // Types de base dans la liste officielle
        if (this.allSupportedTypes.includes(type)) {
            return true;
        }
        
        // Types personnalisés avec pattern _CUSTOM_
        if (type.includes('_CUSTOM_')) {
            const baseType = type.split('_CUSTOM_')[0];
            if (this.allSupportedTypes.includes(baseType)) {
                // Ajouter au cache pour éviter les recalculs
                this.customTypeCache.add(type);
                return true;
            }
        }
        
        // Types personnalisés avec pattern _P
        if (type.endsWith('_P')) {
            const baseType = type.slice(0, -2);
            if (this.allSupportedTypes.includes(baseType)) {
                this.customTypeCache.add(type);
                return true;
            }
        }
        
        // Types déjà validés en cache
        if (this.customTypeCache.has(type)) {
            return true;
        }
        
        return false;
    }

    // ? UTILITAIRE: Vàrifier si un type est supporté (incluant les types personnalisàs)
    isSupportedType(type) {
        // Types de base supportés
        if (this.allSupportedTypes.includes(type)) {
            return true;
        }
        
        // Types GLB spécifiques (tous les types de planchers)
        if (type && (type.includes('hourdis') || type.includes('poutrain') || type.includes('claveau'))) {
            return true;
        }
        
        // Types personnalisàs (contiennent _CUSTOM_)
        if (type && type.includes('_CUSTOM_')) {
            // Extraire le type de base et vàrifier s'il est supporté
            const baseType = type.split('_')[0];
            return this.allSupportedTypes.includes(baseType);
        }
        
        // Types coupàs (contiennent _HALF, _3Q, _1Q)
        if (type && (type.includes('_HALF') || type.includes('_3Q') || type.includes('_1Q'))) {
            const baseType = type.split('_')[0];
            return this.allSupportedTypes.includes(baseType);
        }
        
        return false;
    }

    // ? UTILITAIRE: Vérifier si un type est un béton cellulaire (CELLULAIRE ou BC* spécifique)
    isCellularConcreteType(type) {
        return type === 'CELLULAIRE' || (type && type.startsWith('BC'));
    }

    // Initialiser les structures de données pour tous les types supportés
    initializeTypeStructures() {
        for (const type of this.allSupportedTypes) {
            this.assisesByType.set(type, new Map());
            this.elementsByType.set(type, new Map());
            this.gridHelpersByType.set(type, new Map());
            this.attachmentMarkersByType.set(type, new Map());
            this.currentAssiseByType.set(type, 0);
        }
    }

    // S'assurer qu'un type est initialisà (pour les briques coupàes)
    ensureTypeInitialized(type) {
        if (!this.assisesByType.has(type)) {
            this.assisesByType.set(type, new Map());
            this.elementsByType.set(type, new Map());
            this.gridHelpersByType.set(type, new Map());
            this.attachmentMarkersByType.set(type, new Map());
            this.currentAssiseByType.set(type, 0);
            
            // ? CORRECTION: Utiliser la màthode isSupportedType pour vàrifier
            if (!this.isSupportedType(type)) {
                // Pour les types personnalisàs, extraire le type de base
                const baseType = type.split('_')[0];
                if (this.isSupportedType(baseType)) {
                    // console.log(`🔧 Type personnalisé ${type} accepté (base: ${baseType})`);
                } else {
                    if (window.DEBUG_CONSTRUCTION) {
                        console.warn(`🔧 Type non supporté: ${type}`);
                    }
                }
            }
        }
    }

    // Getter pour la hauteur du joint d'un type donné
    getJointHeightForType(type) {
        // 🔧 ISOLANTS: Toujours retourner 0 pour les isolants (pas de joints horizontaux)
        if (type === 'insulation' || type === 'beam') {
            return 0;
        }
        
        // 🔧 PROTECTION: S'assurer que jointHeightByType est initialisé
        if (!this.jointHeightByType) {
            this.jointHeightByType = new Map();
        }
        
        return this.jointHeightByType.get(type) || 1.2;
    }

    // Setter pour la hauteur du joint d'un type donné
    setJointHeightForType(type, height) {
        if (type === 'beam') {
            // Joint toujours 0 pour les poutres
            return false;
        }
        const h = Math.max(0.1, height); // Minimum 0.1 cm
        this.jointHeightByType.set(type, h);

        // Recalculer les hauteurs d'assises SEULEMENT pour ce type
        const assisesForType = this.assisesByType.get(type);
        for (const [index, assise] of assisesForType.entries()) {
            const newHeight = this.calculateAssiseHeightForType(type, index);
            assise.height = newHeight;
            
            // Mettre à jour les grilles
            if (assise.gridMesh) {
                assise.gridMesh.position.y = newHeight;
            }
            if (assise.jointGridMesh) {
                assise.jointGridMesh.position.y = newHeight + this.getMaxElementHeightInAssiseForType(type, index);
            }
            
            // Mettre à jour les éléments (repositionner SEULEMENT les blocs et briques, PAS les joints)
            for (const elementId of assise.elements) {
                const element = window.SceneManager.elements.get(elementId);
                if (element && element.mesh) {
                    // EXCLURE les joints du repositionnement - ils ont leur propre logique
                    if (element.isVerticalJoint || element.isHorizontalJoint) {
                        // // console.log(`🔧 Joint ${elementId} ignoré lors du repositionnement (a sa propre logique)`);
                        continue;
                    }
                    
                    // Utiliser updateElementPositionInAssise pour repositionner correctement les blocs/briques
                    this.updateElementPositionInAssise(element.mesh, type, index);
                    // // console.log(`🔧 Bloc/Brique ${elementId} repositionné sur assise ${index} (${type}) à Y=${element.mesh.position.y}`);
                }
            }
        }
        
        this.updateAllGridVisibility();
        this.updateSnapPointHeight();
        if (typeof this.updateVerticalJointsForType === 'function') {
            this.updateVerticalJointsForType(type);
        }
        if (window.ConstructionTools && window.ConstructionTools.isInitialized) {
            // Forcer la recréation du fantôme pour s'assurer qu'il a les bonnes dimensions
            setTimeout(() => {
                if (typeof window.ConstructionTools.createGhostElement === 'function') {
                    window.ConstructionTools.createGhostElement();
                } else {
                    window.ConstructionTools.updateGhostElement();
                }
            }, 50);
            if (window.ConstructionTools.suggestionGhosts && window.ConstructionTools.suggestionGhosts.length > 0) {
                const selectedElement = window.SceneManager?.selectedElement;
                if (selectedElement) {
                    window.ConstructionTools.createVerticalJointSuggestions(selectedElement);
                }
            }
        }
        this.updateUIComplete();
        // console.log(`Hauteur du joint pour le type '${type}' mise à jour: ${h} cm`);
    }

    // Getter pour la hauteur du joint du type courant (compatibilité)
    get jointHeight() {
        return this.getJointHeightForType(this.currentType);
    }

    // Setter pour la hauteur du joint du type courant (compatibilité)
    set jointHeight(height) {
        this.setJointHeightForType(this.currentType, height);
    }

    // === GESTION DES HAUTEURS DE JOINT PAR ASSISE INDIVIDUELLE ===
    
    // Obtenir la hauteur de joint d'une assise spécifique
    getJointHeightForAssise(type, assiseIndex) {
        // 🔧 ISOLANTS: Toujours retourner 0 pour les isolants (pas de joints horizontaux)
        if (type === 'insulation') {
            return 0;
        }
        
        // 🔧 PROTECTION: S'assurer que jointHeightByAssise est initialisé
        if (!this.jointHeightByAssise) {
            this.jointHeightByAssise = new Map();
        }
        
        // 🔧 PROTECTION: Pour les types personnalisés, utiliser le type de base
        let effectiveType = type;
        if (type.includes('_CUSTOM_')) {
            effectiveType = type.split('_CUSTOM_')[0];
        } else if (type.endsWith('_P')) {
            effectiveType = type.slice(0, -2);
        } else if (type.includes('_HALF') || type.includes('_3Q') || type.includes('_1Q')) {
            effectiveType = type.split('_')[0];
        }
        
        const jointsByType = this.jointHeightByAssise.get(effectiveType);
        if (!jointsByType) return this.getJointHeightForType(effectiveType);
        
        // Si hauteur spécifique définie pour cette assise, l'utiliser
        const specificHeight = jointsByType.get(assiseIndex);
        if (specificHeight !== undefined) {
            return specificHeight;
        }
        
        // Sinon, utiliser la hauteur par défaut du type
        return this.getJointHeightForType(effectiveType);
    }
    
    // Dàfinir la hauteur de joint d'une assise spécifique
    setJointHeightForAssise(type, assiseIndex, height) {
        // PROTECTION ANTI-BOUCLE INFINIE: àviter les modifications pendant un repositionnement
        if (this.isRepositioning) {
            // // console.log(`🔧 PROTECTION ANTI-BOUCLE: setJointHeightForAssise évitée pendant repositionnement`);
            return false;
        }

        const h = Math.max(0.1, height); // Minimum 0.1 cm
        
        // 🔧 PROTECTION: S'assurer que jointHeightByAssise est initialisé
        if (!this.jointHeightByAssise) {
            this.jointHeightByAssise = new Map();
        }
        
        // 🔧 PROTECTION: Pour les types personnalisés, utiliser le type de base
        let effectiveType = type;
        if (type.includes('_CUSTOM_')) {
            effectiveType = type.split('_CUSTOM_')[0];
        } else if (type.endsWith('_P')) {
            effectiveType = type.slice(0, -2);
        } else if (type.includes('_HALF') || type.includes('_3Q') || type.includes('_1Q')) {
            effectiveType = type.split('_')[0];
        }
        
        if (!this.jointHeightByAssise.has(effectiveType)) {
            this.jointHeightByAssise.set(effectiveType, new Map());
        }
        
        // Vàrifier si la valeur a ràellement changà
        const currentHeight = this.jointHeightByAssise.get(effectiveType).get(assiseIndex);
        if (currentHeight !== undefined && Math.abs(currentHeight - h) < 0.001) {
            // // console.log(`🔧 Joint de l'assise ${assiseIndex} (${effectiveType}) déjà à ${h} cm, pas de modification`);
            return false;
        }
        
        this.jointHeightByAssise.get(effectiveType).set(assiseIndex, h);
        
        // Recalculer les hauteurs de TOUTES les assises de ce type 
        // (car changer une assise affecte la position de toutes les suivantes)
        this.recalculateAssiseHeightsForType(type);
        
        // CORRECTION: Repositionner automatiquement tous les éléments existants de cette assise
        this.repositionElementsInAssise(type, assiseIndex);
        
        // // console.log(`🔧 Hauteur de joint de l'assise ${assiseIndex} (${type}) définie à ${h} cm`);
        this.updateUI();
        
        // NOUVEAU: Mettre à jour la hauteur du point de suivi après modification des joints
        this.updateSnapPointHeight();
        
        return true;
    }

    // Repositionner automatiquement tous les éléments d'une assise après changement de hauteur de joint
    repositionElementsInAssise(type, assiseIndex) {
        // Garde anti-boucle infinie
        if (this.isRepositioning) {
            // // console.log(`🔧 Repositionnement en cours, évitement de la boucle infinie`);
            return;
        }
        
        const assisesForType = this.assisesByType.get(type);
        if (!assisesForType || !assisesForType.has(assiseIndex)) {
            return;
        }

        const assise = assisesForType.get(assiseIndex);
        if (!assise || assise.elements.size === 0) {
            return;
        }

        this.isRepositioning = true; // Activer la garde
        const newAssiseHeight = this.getAssiseHeightForType(type, assiseIndex);
        let repositionedCount = 0;

        // // console.log(`🔧 REPOSITIONNEMENT automatique assise ${assiseIndex} (${type}) - nouvelle hauteur: ${newAssiseHeight}cm`);

        for (const elementId of assise.elements) {
            const element = window.SceneManager?.elements?.get(elementId);
            if (element && !element.isVerticalJoint && !element.isHorizontalJoint) {
                const targetCenterY = newAssiseHeight + element.dimensions.height / 2;
                const oldY = element.position.y;
                
                element.updatePosition(element.position.x, targetCenterY, element.position.z);
                repositionedCount++;
                
                // console.log(`🔧 ${elementId}: ${oldY.toFixed(2)}cm → ${targetCenterY.toFixed(2)}cm`);
            }
        }

        if (repositionedCount > 0) {
            // console.log(`📊 ${repositionedCount} élément(s) repositionné(s) dans l'assise ${assiseIndex} (${type})`);
        }
        
        this.isRepositioning = false; // Dàsactiver la garde
    }
    
    // Supprimer la hauteur de joint personnalisàe d'une assise (revient au défaut du type)
    resetJointHeightForAssise(type, assiseIndex) {
        const jointsByType = this.jointHeightByAssise.get(type);
        if (jointsByType && jointsByType.has(assiseIndex)) {
            jointsByType.delete(assiseIndex);
            this.recalculateAssiseHeightsForType(type);
            // // console.log(`🔧 Hauteur de joint de l'assise ${assiseIndex} (${type}) réinitialisée`);
            this.updateUI();
        }
    }
    
    // Recalculer toutes les hauteurs d'assises pour un type donné
    recalculateAssiseHeightsForType(type) {
        const assisesForType = this.assisesByType.get(type);
        if (!assisesForType) return;
        
        for (const [index, assise] of assisesForType.entries()) {
            const newHeight = this.calculateAssiseHeightForType(type, index);
            assise.height = newHeight;
            
            // Mettre à jour la position des grilles
            if (assise.gridMesh) {
                assise.gridMesh.position.y = newHeight;
            }
            if (assise.jointGridMesh) {
                assise.jointGridMesh.position.y = newHeight + this.getMaxElementHeightInAssiseForType(type, index);
            }
            
            // Mettre à jour la position des éléments de cette assise
            for (const elementId of assise.elements) {
                const element = this.findElementById(elementId);
                if (element) {
                    this.updateElementPositionInAssise(element, type, index);
                }
            }
        }
        
        // Mettre à jour le plan de collision si c'est le type actuel
        if (type === this.currentType && window.SceneManager && typeof window.SceneManager.updateCollisionPlane === 'function') {
            const currentAssiseIndex = this.currentAssiseByType.get(type) || 0;
            const currentHeight = this.getAssiseHeight(currentAssiseIndex);
            window.SceneManager.updateCollisionPlane(currentHeight);
        }
    }

    // Getter pour les assises du type actuel (compatibilité avec l'ancien code)
    get assises() {
        return this.assisesByType.get(this.currentType) || new Map();
    }

    // Getter pour les éléments du type actuel (compatibilité avec l'ancien code)  
    get elements() {
        return this.elementsByType.get(this.currentType) || new Map();
    }

    // Getter pour les grilles du type actuel (compatibilité avec l'ancien code)
    get gridHelpers() {
        return this.gridHelpersByType.get(this.currentType) || new Map();
    }

    // Getter pour les marqueurs du type actuel (compatibilité avec l'ancien code)
    get attachmentMarkers() {
        return this.attachmentMarkersByType.get(this.currentType) || new Map();
    }

    // Getter pour l'assise active du type actuel (compatibilité avec l'ancien code)
    get currentAssise() {
        return this.currentAssiseByType.get(this.currentType) || 0;
    }

    // Setter pour l'assise active du type actuel (compatibilité avec l'ancien code)
    set currentAssise(value) {
        this.currentAssiseByType.set(this.currentType, value);
    }

    // Changer le type d'assise actif
    setActiveType(type) {
        if (!this.allSupportedTypes.includes(type)) {
            console.warn(`Type d'assise non supporté: ${type}`);
            return false;
        }

        const previousType = this.currentType;
        this.currentType = type;

        // 🔧 CORRECTION: Pour les types personnalisés, déterminer le type de base pour la grille
        const getBaseTypeForGrid = (type) => {
            if (type.includes('_CUSTOM_')) {
                return type.split('_CUSTOM_')[0];
            }
            if (type.endsWith('_P')) {
                return type.slice(0, -2);
            }
            if (type.includes('_HALF') || type.includes('_3Q') || type.includes('_1Q')) {
                return type.split('_')[0];
            }
            return type;
        };

        const previousBaseType = getBaseTypeForGrid(previousType);
        const currentBaseType = getBaseTypeForGrid(type);

        // Masquer les grilles du type précédent seulement si le type de base change vraiment
        // 🔧 CORRECTION: Ne pas cacher si les types sont compatibles (ex: M65 vers M65_CUSTOM_16)
        if (previousType !== type && previousBaseType !== currentBaseType && !this.areTypesCompatible(previousType, type)) {
            this.hideGridsForType(previousType);
        }

        // Afficher les grilles du nouveau type (type de base pour les personnalisés)
        this.updateAllGridVisibility();
        
        // Mettre à jour l'interface
        this.updateUI();
        
        // console.log(`Type d'assise actif changé de '${previousType}' vers '${type}'`);
        
        // Notifier le changement de type
        document.dispatchEvent(new CustomEvent('assiseTypeChanged', {
            detail: { 
                previousType,
                newType: type,
                currentAssise: this.currentAssise,
                height: this.getAssiseHeight(this.currentAssise)
            }
        }));

        return true;
    }

    // Màthode pour changer le type d'assise actuel
    setCurrentType(type, skipToolChange = false) {
        // NOUVEAU: Si l'onglet Outils est en cours de mise à jour, ne pas interfàrer
        if (window.toolsTabUpdating) {
            // // console.log(`🔧 AssiseManager: Onglet Outils en cours de mise à jour, pas d'interférence avec ${type}`);
            return true; // Simuler le succàs pour àviter les erreurs
        }
        
        // Extraire le type de base si c'est un type de coupe
        let baseType = type;
        if (type && typeof type === 'string' && type.includes('_')) {
            const cutSuffixes = ['_3Q', '_HALF', '_1Q'];
            for (const suffix of cutSuffixes) {
                if (type.endsWith(suffix)) {
                    baseType = type.replace(suffix, '');
                    break;
                }
            }
        }

        // Normalisation des types d'isolants (PUR5, XPS30, etc.) vers le type générique 'insulation'
        if (typeof baseType === 'string') {
            const insulationPrefixes = ['PUR', 'LAINEROCHE', 'XPS', 'PSE', 'FB', 'LV'];
            const upper = baseType.toUpperCase();
            if (insulationPrefixes.some(p => upper.startsWith(p))) {
                baseType = 'insulation';
            }
        }
        
        // ? CORRECTION: Utiliser la màthode utilitaire pour vàrifier le support
    // Vérifier le support sur le type normalisé (baseType)
    if (!this.isSupportedType(baseType)) {
            // console.warn(`Type non supporté: ${type} (base: ${baseType})`);
            return false;
        }
        
        // ? CORRECTION: Calculer si c'est un type personnalisà
        const isCustomType = type && type.includes('_CUSTOM_');
        
    if (this.currentType === baseType || (isCustomType && this.currentType === type)) {
            return true; // Dàjà le type actuel
        }
        
        // console.log(`Changement de type d'assise: ${this.currentType} ? ${baseType}`);
    this.currentType = baseType;
        
        // S'assurer qu'une assise par défaut existe pour ce type
        if (!this.currentAssiseByType || !this.currentAssiseByType.has(baseType)) {
            // 🆕 PROTECTION: Vérifier que currentAssiseByType est initialisé
            if (!this.currentAssiseByType) {
                console.warn('⚠️ currentAssiseByType non initialisé, initialisation...');
                this.currentAssiseByType = new Map();
            }
            
            // Pour les basculements automatiques (skipToolChange = true), 
            // hériter de l'assise active du type précédent
            let targetAssiseIndex = 0;
            if (skipToolChange && this.currentType && this.currentAssiseByType.has(this.currentType)) {
                targetAssiseIndex = this.currentAssiseByType.get(this.currentType);
                console.log(`🔄 Héritage assise ${targetAssiseIndex} du type ${this.currentType} vers ${baseType}`);
            } else {
                const hasCurrentType = this.currentType && this.currentAssiseByType.has(this.currentType);
                console.log(`🔄 Pas d'héritage - skipToolChange:${skipToolChange}, has(${this.currentType}):${hasCurrentType}`);
            }
            
            // 🆕 PROTECTION: Vérifier que assisesByType existe et a le type
            if (!this.assisesByType || !this.assisesByType.get(baseType)) {
                console.warn(`⚠️ assisesByType non initialisé pour ${baseType}, initialisation...`);
                if (!this.assisesByType) {
                    this.assisesByType = new Map();
                }
                this.assisesByType.set(baseType, new Map());
            }
            
            // Créer l'assise cible si elle n'existe pas
            if (!this.assisesByType.get(baseType).has(targetAssiseIndex)) {
                this.addAssiseForType(baseType, targetAssiseIndex);
            }
            this.currentAssiseByType.set(baseType, targetAssiseIndex);
            console.log(`🔄 Type ${baseType} initialisé sur assise ${targetAssiseIndex}`);
        } else {
            console.log(`🔄 Type ${baseType} déjà initialisé sur assise`, this.currentAssiseByType.get(baseType));
        }
        
        // Activer automatiquement l'outil de construction correspondant pour les types principaux
        if (!skipToolChange && !this.brickSubTypes.includes(baseType) && !this.linteauSubTypes.includes(baseType) && baseType !== 'custom' && window.ConstructionTools) {
            const toolModeMap = {
                'brick': 'brick',
                'block': 'block',
                'insulation': 'insulation',
                'linteau': 'linteau'
            };
            
            const targetMode = toolModeMap[baseType];
            if (targetMode && window.ConstructionTools.currentMode !== targetMode) {
                // console.log(`Activation automatique de l'outil: ${targetMode}`);
                window.ConstructionTools.setMode(targetMode, true); // preserveDimensions = true pour àviter changements non dàsiràs
            }
        }
        
        // 🆕 NOUVEAU: Sélectionner automatiquement l'objet de base (1/1) pour ce type d'assise
        if (!skipToolChange) {
            this.selectDefaultObjectForType(baseType);
        }
        
        // Mettre à jour l'interface utilisateur
        this.updateUI();
        
        // Mettre à jour la visibilità des grilles (seul le type actuel est visible)
        this.updateAllGridVisibility();
        
        // Mettre à jour la hauteur du point d'accrochage
        this.updateSnapPointHeight();
        
        // CORRECTION : Forcer la mise à jour du fantôme vers la nouvelle assise active
        if (window.ConstructionTools && window.ConstructionTools.ghostElement) {
            const currentAssiseIndex = this.currentAssiseByType.get(baseType) || 0;
            const assiseHeight = this.getAssiseHeightForType(baseType, currentAssiseIndex);
            
            if (window.ConstructionTools.ghostElement.dimensions && window.ConstructionTools.ghostElement.dimensions.height) {
                const ghostHeight = window.ConstructionTools.ghostElement.dimensions.height;
                const ghostY = assiseHeight + ghostHeight / 2;
                
                window.ConstructionTools.ghostElement.updatePosition(
                    window.ConstructionTools.ghostElement.position.x,
                    ghostY,
                    window.ConstructionTools.ghostElement.position.z
                );
                
                console.log(`👻 CHANGEMENT TYPE - Fantôme repositionné: Type ${baseType}, Assise ${currentAssiseIndex}, Hauteur ${ghostY}cm (assise: ${assiseHeight}cm)`);
            }
        }

        // DEBUG ISOLATION: journaliser changement de type vers/depuis insulation
        if (window._isoGhostLog) {
            window._isoGhostLog('SET_CURRENT_TYPE', {
                newType: this.currentType,
                currentAssiseIndex: this.currentAssiseByType.get(this.currentType),
                assiseHeight: this.getAssiseHeightForType(this.currentType, this.currentAssiseByType.get(this.currentType))
            });
        }
        
        // émettre un événement de changement de type
        document.dispatchEvent(new CustomEvent('assiseTypeChanged', {
            detail: { 
                newType: baseType,
                currentAssise: this.currentAssiseByType.get(baseType)
            }
        }));
        
        return true;
    }

    // 🆕 NOUVEAU: Sélectionner automatiquement l'objet de base (1/1) pour un type d'assise donné
    selectDefaultObjectForType(type) {
        try {
            console.log(`🔧 AssiseManager: Sélection automatique de l'objet de base pour le type ${type}`);
            
            // Gestion des briques (types M50, M57, M60, M65, M90)
            if (this.brickSubTypes.includes(type)) {
                if (window.BrickSelector) {
                    console.log(`🧱 BrickSelector disponible, currentBrick actuel:`, window.BrickSelector.currentBrick);
                    
                    // Forcer la sélection même si c'est déjà le bon type (pour s'assurer du fantôme)
                    if (window.BrickSelector.setBrick) {
                        console.log(`🧱 Appel setBrick(${type})`);
                        window.BrickSelector.setBrick(type);
                    } else {
                        console.log(`🧱 setBrick non disponible, mise à jour manuelle`);
                        window.BrickSelector.currentBrick = type;
                        window.BrickSelector.selectedType = type;
                        if (window.BrickSelector.updateBrickDimensions) {
                            window.BrickSelector.updateBrickDimensions(type);
                        }
                        if (window.BrickSelector.updateCurrentBrickDisplay) {
                            window.BrickSelector.updateCurrentBrickDisplay();
                        }
                    }
                    
                    // Forcer la mise à jour du mode et du fantôme
                    setTimeout(() => {
                        if (window.ConstructionTools) {
                            console.log(`🧱 ConstructionTools mode actuel:`, window.ConstructionTools.currentMode);
                            if (window.ConstructionTools.currentMode !== 'brick') {
                                console.log(`🧱 Passage en mode brick`);
                                window.ConstructionTools.setMode('brick');
                            }
                            if (window.ConstructionTools.createGhostElement) {
                                window.ConstructionTools.createGhostElement();
                            }
                        }
                    }, 50);
                    
                    console.log(`✅ Brique ${type} (1/1) sélectionnée automatiquement`);
                } else {
                    console.warn('❌ BrickSelector non disponible');
                }
                return;
            }
            
            // Gestion des blocs (incluant tous les sous-types comme CREUX, CELLULAR, etc.)
            if (type === 'block' || type === 'CREUX' || type === 'CELLULAR' || type === 'HOLLOW' || 
                (typeof type === 'string' && (type.startsWith('B') || type.includes('CREUX') || type.includes('CELLULAR')))) {
                if (window.BlockSelector) {
                    console.log(`🧱 BlockSelector disponible, currentBlock actuel:`, window.BlockSelector.currentBlock);
                    
                    // Déterminer le bloc par défaut selon le type spécifique
                    let defaultBlock;
                    if (type === 'B9') {
                        defaultBlock = 'B9';
                    } else if (type === 'B14') {
                        defaultBlock = 'B14';
                    } else if (type === 'B19') {
                        defaultBlock = 'B19';
                    } else if (type === 'B29') {
                        defaultBlock = 'B29';
                    } else if (type === 'BC5') {
                        defaultBlock = 'BC_60x5';
                    } else if (type === 'BC7') {
                        defaultBlock = 'BC_60x7';
                    } else if (type === 'BC10') {
                        defaultBlock = 'BC_60x10';
                    } else if (type === 'BC15') {
                        defaultBlock = 'BC_60x15';
                    } else if (type === 'BC17') {
                        defaultBlock = 'BC_60x17';
                    } else if (type === 'BC20') {
                        defaultBlock = 'BC_60x20';
                    } else if (type === 'BC24') {
                        defaultBlock = 'BC_60x24';
                    } else if (type === 'BC30') {
                        defaultBlock = 'BC_60x30';
                    } else if (type === 'BC36') {
                        defaultBlock = 'BC_60x36';
                    } else {
                        // Fallback vers B14 pour les types génériques
                        defaultBlock = 'B14';
                    }
                    
                    console.log(`🧱 Sélection du bloc pour type ${type}: ${defaultBlock}`);
                    
                    if (window.BlockSelector.blockTypes && window.BlockSelector.blockTypes[defaultBlock]) {
                        if (window.BlockSelector.setBlock) {
                            console.log(`🧱 Appel setBlock(${defaultBlock})`);
                            window.BlockSelector.setBlock(defaultBlock);
                        } else {
                            console.log(`🧱 setBlock non disponible, mise à jour manuelle`);
                            window.BlockSelector.currentBlock = defaultBlock;
                            window.BlockSelector.selectedType = defaultBlock;
                            if (window.BlockSelector.updateBlockDimensions) {
                                window.BlockSelector.updateBlockDimensions(defaultBlock);
                            }
                            if (window.BlockSelector.updateCurrentBlockDisplay) {
                                window.BlockSelector.updateCurrentBlockDisplay();
                            }
                        }
                        
                        // Forcer la mise à jour du mode et du fantôme
                        setTimeout(() => {
                            if (window.ConstructionTools) {
                                console.log(`🧱 ConstructionTools mode actuel:`, window.ConstructionTools.currentMode);
                                if (window.ConstructionTools.currentMode !== 'block') {
                                    console.log(`🧱 Passage en mode block`);
                                    window.ConstructionTools.setMode('block');
                                }
                                if (window.ConstructionTools.createGhostElement) {
                                    window.ConstructionTools.createGhostElement();
                                }
                            }
                        }, 50);
                        
                        console.log(`✅ Bloc ${defaultBlock} (1/1) sélectionné automatiquement`);
                    } else {
                        console.warn(`❌ Bloc ${defaultBlock} non trouvé dans blockTypes`);
                    }
                } else {
                    console.warn('❌ BlockSelector non disponible');
                }
                return;
            }
            
            // Gestion des isolants
            if (type === 'insulation') {
                if (window.InsulationSelector) {
                    console.log(`🧱 Sélection de l'isolant de base`);
                    
                    // Sélectionner l'isolant de base le plus courant
                    const defaultInsulation = 'laine_verre_10';
                    if (window.InsulationSelector.setInsulation) {
                        window.InsulationSelector.setInsulation(defaultInsulation);
                    } else if (window.InsulationSelector.selectedType !== defaultInsulation) {
                        window.InsulationSelector.selectedType = defaultInsulation;
                    }
                    
                    // Forcer la mise à jour du fantôme
                    if (window.ConstructionTools) {
                        if (window.ConstructionTools.currentMode !== 'insulation') {
                            window.ConstructionTools.setMode('insulation');
                        }
                        if (window.ConstructionTools.updateGhostElement) {
                            window.ConstructionTools.updateGhostElement();
                        }
                    }
                    
                    console.log(`✅ Isolant ${defaultInsulation} sélectionné automatiquement`);
                } else {
                    console.warn('❌ InsulationSelector non disponible');
                }
                return;
            }
            
            // Gestion des linteaux
            if (type === 'linteau') {
                if (window.LinteauSelector) {
                    console.log(`🧱 Sélection du linteau de base`);
                    
                    // Sélectionner le linteau de base le plus courant
                    const defaultLinteau = 'linteau_standard';
                    if (window.LinteauSelector.setLinteau) {
                        window.LinteauSelector.setLinteau(defaultLinteau);
                    }
                    
                    // Forcer la mise à jour du fantôme
                    if (window.ConstructionTools) {
                        if (window.ConstructionTools.currentMode !== 'linteau') {
                            window.ConstructionTools.setMode('linteau');
                        }
                        if (window.ConstructionTools.updateGhostElement) {
                            window.ConstructionTools.updateGhostElement();
                        }
                    }
                    
                    console.log(`✅ Linteau ${defaultLinteau} sélectionné automatiquement`);
                } else {
                    console.warn('❌ LinteauSelector non disponible');
                }
                return;
            }
            
            console.log(`⚠️ Type d'assise non géré: ${type} - pas de sélection automatique d'objet`);
            
        } catch (error) {
            console.error(`❌ Erreur lors de la sélection automatique de l'objet pour le type ${type}:`, error);
        }
    }

    // Mettre à jour l'indicateur visuel du type de brique dans l'interface
    updateBrickTypeIndicator(brickType) {
        const typeIndicator = document.getElementById('brickTypeIndicator');
        const currentTypeInfo = document.getElementById('currentTypeInfo');
        
        if (typeIndicator) {
            const typeBadge = typeIndicator.querySelector('.type-badge');
            const typeDescription = typeIndicator.querySelector('.type-description');
            
            // Informations sur les types de briques
            const brickInfo = {
                'M50': { height: '5.0', description: '5.0 cm de hauteur' },
                'M57': { height: '5.7', description: '5.7 cm de hauteur' },
                'M60': { height: '6.0', description: '6.0 cm de hauteur' },
                'M65': { height: '6.5', description: '6.5 cm de hauteur' },
                'M90': { height: '9.0', description: '9.0 cm de hauteur' }
            };
            
            const info = brickInfo[brickType] || { height: '6.5', description: '6.5 cm de hauteur' };
            
            if (typeBadge) {
                typeBadge.textContent = brickType;
            }
            
            if (typeDescription) {
                typeDescription.textContent = `Hauteur: ${info.height} cm`;
            }
        }
        
        if (currentTypeInfo) {
            currentTypeInfo.textContent = `Type actif: ${brickType} - Toutes les nouvelles assises utiliseront ce type`;
        }
    }

    // Masquer toutes les grilles d'un type donné
    hideGridsForType(type) {
        const gridHelpers = this.gridHelpersByType.get(type);
        if (gridHelpers) {
            for (const [index, grids] of gridHelpers.entries()) {
                grids.main.visible = false;
                grids.joint.visible = false;
            }
        }

        const attachmentMarkers = this.attachmentMarkersByType.get(type);
        if (attachmentMarkers) {
            for (const [index, markers] of attachmentMarkers.entries()) {
                markers.forEach(markerInfo => {
                    markerInfo.group.visible = false;
                });
            }
        }
    }

    init() {
        if (this.isInitialized) return;
        
        // Cràer l'assise par défaut pour chaque type
        for (const type of this.allSupportedTypes) {
            this.createDefaultAssiseForType(type);
        }
        
        this.createSnapPoint(); // Cràer le point d'accrochage
        this.setupEventListeners();
        this.updateUI(); // Mettre à jour l'interface avec les types d'assises
        this.isInitialized = true;
    }

    createDefaultAssiseForType(type) {
        // Cràer la premiàre assise (assise 0) pour ce type
        this.addAssiseForType(type, 0);
        this.setActiveAssiseForType(type, 0);
    }

    createDefaultAssise() {
        // Màthode de compatibilité - cràe l'assise par défaut pour le type actuel
        this.createDefaultAssiseForType(this.currentType);
    }

    // Ajouter une assise pour un type spécifique
    addAssiseForType(type, index = null) {
        // 🔧 CORRECTION: Gestion dynamique des types personnalisés
        if (!this.isTypeSupported(type)) {
            console.warn(`Type non supporté: ${type}`);
            return null;
        }

        // 🔧 PROTECTION: S'assurer que les Maps sont initialisées pour ce type
        if (!this.assisesByType.has(type)) {
            this.assisesByType.set(type, new Map());
        }
        if (!this.elementsByType.has(type)) {
            this.elementsByType.set(type, new Map());
        }
        if (!this.gridHelpersByType.has(type)) {
            this.gridHelpersByType.set(type, new Map());
        }
        if (!this.attachmentMarkersByType.has(type)) {
            this.attachmentMarkersByType.set(type, new Map());
        }
        
        // 🛡️ PROTECTION: S'assurer que currentAssiseByType est initialisée
        if (!this.currentAssiseByType) {
            console.warn('⚠️ currentAssiseByType non initialisée, réinitialisation');
            this.currentAssiseByType = new Map();
        }

        const assisesForType = this.assisesByType.get(type);
        const elementsForType = this.elementsByType.get(type);
        const gridHelpersForType = this.gridHelpersByType.get(type);

        if (index === null) {
            index = assisesForType.size;
        }

        const assise = {
            index: index,
            type: type,
            height: this.calculateAssiseHeightForType(type, index), // Utiliser le calcul spécifique au type
            elements: new Set(),
            gridMesh: null,
            jointGridMesh: null,
            visible: true
        };

        assisesForType.set(index, assise);
        elementsForType.set(index, new Set());
        this.createAssiseGridForType(type, index);
        
        // CORRECTION : Mettre automatiquement à jour l'assise active vers la nouvelle assise
        // Cela garantit que les nouveaux éléments se positionnent sur la nouvelle assise
        const previousActiveAssise = this.currentAssiseByType.get(type) || 0;
        this.currentAssiseByType.set(type, index);
        
        // Mettre à jour l'affichage et le fantôme (même pour les types non-actuels)
        this.updateUI();
        
        // Forcer la mise à jour du fantôme si c'est le type actuel OU si on vient de changer de type
        const shouldUpdateGhost = (type === this.currentType) || window.ConstructionTools?.lastModeChange;
        
        if (shouldUpdateGhost && window.ConstructionTools && window.ConstructionTools.ghostElement) {
            const assiseHeight = this.getAssiseHeightForType(type, index);
            if (window.ConstructionTools.ghostElement.dimensions && window.ConstructionTools.ghostElement.dimensions.height) {
                const ghostHeight = window.ConstructionTools.ghostElement.dimensions.height;
                const ghostY = assiseHeight + ghostHeight / 2;
                
                window.ConstructionTools.ghostElement.updatePosition(
                    window.ConstructionTools.ghostElement.position.x,
                    ghostY,
                    window.ConstructionTools.ghostElement.position.z
                );
                
                console.log(`👻 Fantôme repositionné sur nouvelle assise ${index} (type: ${type}) à hauteur ${ghostY}cm - Hauteur assise: ${assiseHeight}cm`);
            }
        }
        
        // Notifier le changement d'assise pour la mise à jour du raycasting (même pour types non-actuels)
        document.dispatchEvent(new CustomEvent('assiseChanged', {
            detail: { 
                assise: index,
                type: type,
                height: this.getAssiseHeightForType(type, index)
            }
        }));
        
        // émettre un événement pour notifier qu'une assise a àtà ajoutàe
        document.dispatchEvent(new CustomEvent('assiseElementsChanged', {
            detail: { 
                action: 'assiseAdded',
                assiseIndex: index,
                type: type
            }
        }));
        
        return assise;
    }

    // Màthode de compatibilité
    addAssise(index = null) {
        return this.addAssiseForType(this.currentType, index);
    }

    // Définir l'assise active pour un type spécifique
    setActiveAssiseForType(type, index) {
        if (!this.allSupportedTypes.includes(type)) {
            console.warn(`Type non supporté: ${type}`);
            return false;
        }

        const assisesForType = this.assisesByType.get(type);
        if (!assisesForType.has(index)) {
            console.warn(`Assise ${index + 1} n'existe pas pour le type '${type}'`);
            return false;
        }

        const previousAssise = this.currentAssiseByType.get(type) || 0;
        this.currentAssiseByType.set(type, index);
        
        // Si c'est le type actuel, mettre à jour l'affichage
        if (type === this.currentType) {
            // Mettre à jour l'apparence et la visibilità de toutes les grilles
            this.updateAllGridVisibility();
            
            // Mettre à jour l'apparence des grilles (couleur et opacità)
            this.updateGridAppearanceForType(type, previousAssise);
            this.updateGridAppearanceForType(type, index);
            
            // Mettre à jour la position du point d'accrochage
            this.updateSnapPointHeight();
            
            // Mettre à jour les marqueurs d'accroche
            this.updateAttachmentMarkers();
            
            // CORRECTION: Déplacer l'élément fantôme à la hauteur de l'assise active avec logs détaillés
            if (window.ConstructionTools && window.ConstructionTools.ghostElement) {
                const assiseHeight = this.getAssiseHeightForType(type, index); // UTILISER LA BONNE FONCTION
                // Vérification de sécurité pour dimensions
                if (window.ConstructionTools.ghostElement.dimensions && window.ConstructionTools.ghostElement.dimensions.height) {
                    const ghostHeight = window.ConstructionTools.ghostElement.dimensions.height;
                    const ghostY = assiseHeight + ghostHeight / 2;
                    
                    window.ConstructionTools.ghostElement.updatePosition(
                        window.ConstructionTools.ghostElement.position.x,
                        ghostY,
                        window.ConstructionTools.ghostElement.position.z
                    );
                    
                    console.log(`👻 SET ACTIVE ASSISE - Fantôme repositionné: Type ${type}, Assise ${index}, Hauteur ${ghostY}cm (assise: ${assiseHeight}cm)`);
                } else {
                    console.warn('⚠️ Dimensions du fantôme non disponibles, utilisation hauteur par défaut');
                    const ghostY = assiseHeight + 5; // hauteur par défaut 5cm
                    
                    window.ConstructionTools.ghostElement.updatePosition(
                        window.ConstructionTools.ghostElement.position.x,
                        ghostY,
                        window.ConstructionTools.ghostElement.position.z
                    );
                }
            }
            
            this.updateUI();
            
            // Notifier le changement d'assise pour la mise à jour du raycasting
            document.dispatchEvent(new CustomEvent('assiseChanged', {
                detail: { 
                    assise: index,
                    type: type,
                    height: this.getAssiseHeight(index) 
                }
            }));
            
            // Garder la synchronisation directe en fallback (au cas oà l'événement ne fonctionne pas)
            if (window.ToolsTabManager) {
                window.ToolsTabManager.updateDisplay();
            }
        }
        
        return true;
    }

    // Màthode de compatibilité
    setActiveAssise(index) {
        return this.setActiveAssiseForType(this.currentType, index);
    }

    // Supprimer une assise d'un type spécifique
    removeAssiseForType(type, index) {
        if (!this.allSupportedTypes.includes(type)) {
            console.warn(`Type non supporté: ${type}`);
            return false;
        }

        const assisesForType = this.assisesByType.get(type);
        const elementsForType = this.elementsByType.get(type);

        if (assisesForType.has(index)) {
            const assise = assisesForType.get(index);
            
            // Supprimer les éléments de cette assise
            const nonJointElementCount = this.getNonJointElementCountForType(type, index);
            if (nonJointElementCount > 0) {
                if (!confirm(`L'assise ${index + 1} du type '${type}' contient ${nonJointElementCount} élément(s). Voulez-vous vraiment la supprimer ?`)) {
                    return false;
                }
                
                // Supprimer tous les éléments
                for (const elementId of assise.elements) {
                    const element = window.SceneManager.elements.get(elementId);
                    if (element) {
                        window.SceneManager.removeElement(elementId);
                    }
                }
            }
            
            // Supprimer les grilles
            this.removeAssiseGridForType(type, index);
            
            // Supprimer l'assise
            assisesForType.delete(index);
            elementsForType.delete(index);
            
            // Si c'àtait l'assise active, passer à une autre
            if (this.currentAssiseByType.get(type) === index) {
                const availableAssises = Array.from(assisesForType.keys()).sort((a, b) => a - b);
                this.setActiveAssiseForType(type, availableAssises[0] || 0);
            }
            
            this.updateUI();
            
            // émettre un événement pour notifier qu'une assise a àtà supprimàe
            document.dispatchEvent(new CustomEvent('assiseElementsChanged', {
                detail: { 
                    action: 'assiseRemoved',
                    assiseIndex: index,
                    type: type
                }
            }));
            
            return true;
        }
        return false;
    }

    // Màthode de compatibilité
    removeAssise(index) {
        return this.removeAssiseForType(this.currentType, index);
    }

    getAssiseHeight(index) {
        // Chercher dans le type actuel d'abord, puis dans tous les types
        const assisesForCurrentType = this.assisesByType.get(this.currentType);
        if (assisesForCurrentType && assisesForCurrentType.has(index)) {
            return assisesForCurrentType.get(index).height;
        }
        
        // Si pas trouvé dans le type actuel, chercher dans tous les types
        for (const type of this.supportedTypes) {
            const assisesForType = this.assisesByType.get(type);
            if (assisesForType && assisesForType.has(index)) {
                return assisesForType.get(index).height;
            }
        }
        
        return this.calculateAssiseHeight(index);
    }

    getAssiseHeightForType(type, index) {
        let assisesForType = this.assisesByType.get(type);
        
        // Si le type n'existe pas, essayer avec le type de base (pour les briques coupàes)
        if (!assisesForType && type.includes('_')) {
            const baseType = type.split('_')[0];
            // // console.log(`🔧 AssiseManager: Type ${type} non trouvé, essai avec le type de base: ${baseType}`);
            assisesForType = this.assisesByType.get(baseType);
            
            // Si trouvé avec le type de base, utiliser ce type pour le calcul
            if (assisesForType) {
                type = baseType;
            }
        }
        
        // Si toujours pas trouvé, initialiser le type
        if (!assisesForType) {
            this.ensureTypeInitialized(type);
            assisesForType = this.assisesByType.get(type);
        }
        
        if (assisesForType && assisesForType.has(index)) {
            return assisesForType.get(index).height;
        }
        return this.calculateAssiseHeightForType(type, index);
    }

    calculateAssiseHeight(index) {
        // Version de compatibilité - utilise le type actuel
        return this.calculateAssiseHeightForType(this.currentType, index);
    }

    calculateAssiseHeightForType(type, index) {
        if (index === 0) {
            // 🔧 HOURDIS: L'assise 0 des hourdis commence à Y=0 (pas de joint de base)
            if (type.includes('hourdis')) {
                return 0;
            }
            
            // 🔧 ISOLANTS: L'assise 0 des isolants commence à Y=0 (pas de joint horizontal)
            if (type === 'insulation') {
                return 0;
            }

            // 🔧 BÉTON CELLULAIRE (CELLULAIRE et BC5, BC7, BC10, etc.): Assise 0 = 1.2cm mortier
            if (this.isCellularConcreteType(type)) {
                return 1.2; // 1.2 cm sur la première assise
            }
            
            // Assise 0 pour autres types : utilise la hauteur de joint spécifique ou celle par défaut du type
            const jointHeight = this.getJointHeightForAssise(type, 0);
            return jointHeight;
        }
        
        // Pour les assises supàrieures, calculer en accumulant les hauteurs individuelles
        let totalHeight = 0;
        
        // Accumulation depuis l'assise 0 jusqu'à l'assise demandàe
        for (let i = 0; i <= index; i++) {
            const jointHeightForThisAssise = this.getJointHeightForAssise(type, i);
            
            if (i === 0) {
                // Assise 0 : seulement la hauteur du joint (ou règle spéciale)
                if (this.isCellularConcreteType(type)) {
                    totalHeight = 1.2; // mortier base
                } else if (type === 'insulation') {
                    totalHeight = 0; // déjà 0
                } else {
                    totalHeight = jointHeightForThisAssise;
                }
                continue;
            }

            // Assises suivantes : hauteur de l'élément + joint suivant (sauf exceptions)
            const elementHeight = this.getDefaultElementHeight(type);

            if (type === 'insulation') {
                // Pas de joint horizontal pour isolants
                totalHeight += elementHeight;
            } else if (this.isCellularConcreteType(type)) {
                // Colle très fine 1mm = 0.1cm pour TOUTES les assises > 0 (BC5, BC7, CELLULAIRE, etc.)
                const thinJoint = 0.1; // 1 mm
                totalHeight += elementHeight + thinJoint;
            } else {
                totalHeight += elementHeight + jointHeightForThisAssise;
            }
        }
        
        // console.log(`🔧 Calcul assise ${index} (type ${type}) avec joints individuels:`);
        // console.log(`   - Hauteur totale calculàe: ${totalHeight} cm`);
        
        return totalHeight;
    }

    // Obtenir la hauteur par défaut d'un élément selon son type
    getDefaultElementHeight(type) {
        // Poutres: utiliser BeamProfiles si possible
        if (type === 'beam' && window.BeamProfiles && window.ConstructionTools) {
            try {
                const beamType = window.ConstructionTools.currentBeamType || 'IPE80';
                if (window.BeamProfiles.getProfile) {
                    const p = window.BeamProfiles.getProfile(beamType);
                    if (p && typeof p.h === 'number') {
                        const mmToCm = (mm) => Math.round((mm / 10) * 100) / 100;
                        return mmToCm(p.h);
                    }
                }
            } catch(e) {
                console.warn('Fallback hauteur poutre (10cm) – erreur profil:', e);
            }
            return 10; // fallback si profil indisponible
        }
        // Pour les briques, essayer d'utiliser le BrickSelector s'il est disponible
        if (type === 'brick' && window.BrickSelector) {
            try {
                const currentBrick = window.BrickSelector.getCurrentBrick();
                if (currentBrick && currentBrick.height) {
                    return currentBrick.height;
                }
            } catch (error) {
                console.warn('Erreur lors de la ràcupàration de la hauteur de brique depuis BrickSelector:', error);
            }
        }
        
        // CORRECTION: Pour les isolants, essayer d'utiliser le InsulationSelector s'il est disponible
        if (type === 'insulation' && window.InsulationSelector) {
            try {
                const currentInsulation = window.InsulationSelector.getCurrentInsulationData();
                if (currentInsulation && currentInsulation.height) {
                    // console.log(`🔧 CORRECTION isolant: Hauteur récupérée depuis InsulationSelector: ${currentInsulation.height}cm (au lieu de 20cm par défaut)`);
                    return currentInsulation.height;
                }
            } catch (error) {
                console.warn('Erreur lors de la ràcupàration de la hauteur d\'isolant depuis InsulationSelector:', error);
            }
        }
        
        // Pour les linteaux, essayer d'utiliser le LinteauSelector s'il est disponible
        if ((type === 'linteau' || this.linteauSubTypes.includes(type)) && window.LinteauSelector) {
            try {
                const currentLinteau = window.LinteauSelector.getCurrentLinteauData();
                // Logs de debug dàsactivàs pour ràduire le bruit
                // console.log('🔧 Debug LinteauSelector:', {
                //     available: !!window.LinteauSelector,
                //     currentLinteau: currentLinteau,
                //     type: currentLinteau?.type,
                //     height: currentLinteau?.height
                // });
                if (currentLinteau && currentLinteau.height) {
                    // console.log(`🔧? Hauteur récupérée du LinteauSelector: ${currentLinteau.height} cm pour ${currentLinteau.type}`);
                    return currentLinteau.height;
                }
            } catch (error) {
                console.warn('Erreur lors de la ràcupàration de la hauteur de linteau depuis LinteauSelector:', error);
            }
        }
        
        // Pour les sous-types de briques, utiliser les hauteurs spécifiques
        if (this.brickSubTypes.includes(type)) {
            const brickHeights = {
                'M50': 5,
                'M57': 5.7,
                'M60': 6,
                'M65': 6.5,
                'M90': 9
            };
            // console.log(`🔧 Hauteur spécifique pour ${type}: ${brickHeights[type]} cm`);
            return brickHeights[type];
        }
        
        const defaultHeights = {
            'brick': 6.5,      // Hauteur brique M65 (par défaut)
            'block': 19,       // Hauteur bloc standard  
            'insulation': 20,  // Hauteur isolant standard
            'custom': 10,      // Hauteur par défaut pour éléments custom
            'linteau': 19,     // Hauteur linteau standard
            
            // Sous-types de blocs avec leurs hauteurs spécifiques
            'CREUX': 19,      // Blocs creux génériques - hauteur 19 cm
            'CELLULAIRE': 25,    // Béton cellulaire (BC_*) - hauteur 25 cm
            'ARGEX': 19,       // Blocs Argex - hauteur 19 cm
            'TERRE_CUITE': 25,  // Terre cuite (TC_*) - hauteur 25 cm
            
            // Sous-types de blocs creux spécifiques par largeur
            'B9': 19,         // Blocs creux B9 (largeur 9cm) - hauteur 19 cm
            'B14': 19,        // Blocs creux B14 (largeur 14cm) - hauteur 19 cm
            'B19': 19,        // Blocs creux B19 (largeur 19cm) - hauteur 19 cm
            'B29': 19,        // Blocs creux B29 (largeur 29cm) - hauteur 19 cm
            
            // Sous-types de béton cellulaire spécifiques (tous 25 cm de hauteur)
            'BC5': 25,        // Béton cellulaire BC5 (largeur 5cm) - hauteur 25 cm
            'BC7': 25,        // Béton cellulaire BC7 (largeur 7cm) - hauteur 25 cm
            'BC10': 25,       // Béton cellulaire BC10 (largeur 10cm) - hauteur 25 cm
            'BC15': 25,       // Béton cellulaire BC15 (largeur 15cm) - hauteur 25 cm
            'BC17': 25,       // Béton cellulaire BC17 (largeur 17.5cm) - hauteur 25 cm
            'BC20': 25,       // Béton cellulaire BC20 (largeur 20cm) - hauteur 25 cm
            'BC24': 25,       // Béton cellulaire BC24 (largeur 24cm) - hauteur 25 cm
            'BC30': 25,       // Béton cellulaire BC30 (largeur 30cm) - hauteur 25 cm
            'BC36': 25,       // Béton cellulaire BC36 (largeur 36cm) - hauteur 25 cm
            
            // Sous-types ARGEX spécifiques par largeur
            'ARGEX9': 19,     // Blocs ARGEX 9cm (largeur 9cm) - hauteur 19 cm
            'ARGEX14': 19,    // Blocs ARGEX 14cm (largeur 14cm) - hauteur 19 cm
            'ARGEX19': 19,    // Blocs ARGEX 19cm (largeur 19cm) - hauteur 19 cm
            
            // Sous-types terre cuite spécifiques par largeur
            'TC10': 25,      // Terre cuite TC10 (largeur 10cm) - hauteur 25 cm
            'TC14': 25,      // Terre cuite TC14 (largeur 14cm) - hauteur 25 cm
            'TC19': 25,      // Terre cuite TC19 (largeur 19cm) - hauteur 25 cm
            
            // Sous-types de linteaux avec leurs hauteurs spécifiques
            'LINTEAU_L120': 19,    // Linteau L120 - hauteur 19 cm
            'LINTEAU_L140': 19,    // Linteau L140 - hauteur 19 cm
            'LINTEAU_L160': 19,    // Linteau L160 - hauteur 19 cm
            'LINTEAU_L180': 19,    // Linteau L180 - hauteur 19 cm
            'LINTEAU_L200': 19     // Linteau L200 - hauteur 19 cm
        };
        
        if (defaultHeights[type]) {
            // console.log(`🔧 Hauteur spécifique pour ${type}: ${defaultHeights[type]} cm`);
            return defaultHeights[type];
        }
        
        // console.log(`🔧 Hauteur par défaut utilisée: 6.5 cm pour type ${type} (non reconnu)`);
        return 6.5;
    }

    // Dàtecter le sous-type de brique à partir de ses dimensions
    detectBrickSubType(element) {
        if (!element || element.type !== 'brick') return null;
        
        const height = element.dimensions.height;
        const tolerance = 0.1; // Tolàrance pour la comparaison des hauteurs
        
        // Mapper les hauteurs aux types de briques
        if (Math.abs(height - 5) < tolerance) return 'M50';
        if (Math.abs(height - 5.7) < tolerance) return 'M57';
        if (Math.abs(height - 6) < tolerance) return 'M60';
        if (Math.abs(height - 6.5) < tolerance) return 'M65';
        if (Math.abs(height - 9) < tolerance) return 'M90';
        
        // Si le BrickSelector est disponible, essayer de ràcupàrer le type depuis les dimensions globales
        if (window.currentBrickDimensions && window.currentBrickDimensions.type) {
            const brickType = window.currentBrickDimensions.type;
            // Extraire le type de base (enlever les suffixes _3Q, _HALF, etc.)
            const baseType = brickType.split('_')[0];
            if (this.brickSubTypes.includes(baseType)) {
                return baseType;
            }
        }
        
        return null; // Type générique brick
    }

    // Dàtecter le sous-type de bloc à partir de ses propriétés
    detectBlockSubType(element) {
        console.log('🔍 [DEBUG-DETECT] detectBlockSubType appelé avec element:', {
            id: element?.id,
            type: element?.type,
            blockType: element?.blockType
        });
        
        if (!element || element.type !== 'block') {
            console.log('🔍 [DEBUG-DETECT] Element invalide ou pas un bloc, retour null');
            return null;
        }
        
        // Si le BlockSelector est disponible, utiliser les informations du bloc courant
        if (window.BlockSelector) {
            try {
                const currentBlock = window.BlockSelector.getCurrentBlockData();
                const blockType = window.BlockSelector.currentBlock;
                
                console.log('🔍 [DEBUG-DETECT] BlockSelector data:', {
                    currentBlock: currentBlock,
                    blockType: blockType,
                    category: currentBlock?.category
                });

                if (currentBlock && currentBlock.category === 'hollow') {
                    console.log('🔍 [DEBUG-DETECT] Bloc détecté comme hollow, blockType:', blockType);
                    
                    // Utiliser blockType pour identifier le sous-type spécifique
                    // Gérer les suffixes de coupe (_3Q, _HALF, _1Q, _CUSTOM_)
                    let baseBlockType = blockType;
                    if (blockType && typeof blockType === 'string') {
                        const cutSuffixes = ['_3Q', '_HALF', '_1Q'];
                        for (const suffix of cutSuffixes) {
                            if (blockType.endsWith(suffix)) {
                                baseBlockType = blockType.replace(suffix, '');
                                console.log('🔍 [DEBUG-DETECT] Suffixe de coupe détecté:', suffix, 'baseBlockType:', baseBlockType);
                                break;
                            }
                        }
                        // Gérer les suffixes custom (_CUSTOM_XX_W_XX_H_XX)
                        if (blockType.includes('_CUSTOM_')) {
                            baseBlockType = blockType.split('_CUSTOM_')[0];
                            console.log('🔍 [DEBUG-DETECT] Suffixe custom détecté, baseBlockType:', baseBlockType);
                        }
                    }
                    
                    console.log('🔍 [DEBUG-DETECT] Test du baseBlockType:', baseBlockType);
                    
                    if (baseBlockType === 'B9') {
                        console.log('🔍 [DEBUG-DETECT] ✅ Identifié comme B9');
                        return 'B9';
                    }
                    if (baseBlockType === 'B14') {
                        console.log('🔍 [DEBUG-DETECT] ✅ Identifié comme B14');
                        return 'B14';
                    }
                    if (baseBlockType === 'B19') {
                        console.log('🔍 [DEBUG-DETECT] ✅ Identifié comme B19');
                        return 'B19';
                    }
                    if (baseBlockType === 'B29') {
                        console.log('🔍 [DEBUG-DETECT] ✅ Identifié comme B29');
                        return 'B29';
                    }
                    
                    // Fallback vers le type générique - MAIS AVEC PLUS DE DEBUG
                    console.log('🔍 [DEBUG-DETECT] ⚠️ Aucun type spécifique trouvé pour baseBlockType:', baseBlockType);
                    console.log('🔍 [DEBUG-DETECT] ⚠️ blockType original:', blockType);
                    console.log('🔍 [DEBUG-DETECT] ⚠️ currentBlock:', currentBlock);
                    console.log('🔍 [DEBUG-DETECT] ⚠️ Fallback vers CREUX');
                    return 'CREUX';
                }
                
                if (currentBlock && currentBlock.category === 'cellular') {
                    
                    // Détecter les sous-types cellulaires basés sur la largeur
                    if (blockType.includes('60x5')) {
                        
                        return 'BC5';
                    }
                    if (blockType.includes('60x7')) {
                        
                        return 'BC7';
                    }
                    if (blockType.includes('60x10')) {
                        
                        return 'BC10';
                    }
                    if (blockType.includes('60x15')) {
                        return 'BC15';
                    }
                    if (blockType.includes('60x17')) {
                        return 'BC17';
                    }
                    if (blockType.includes('60x20')) {
                        return 'BC20';
                    }
                    if (blockType.includes('60x24')) {
                        return 'BC24';
                    }
                    if (blockType.includes('60x30')) {
                        return 'BC30';
                    }
                    if (blockType.includes('60x36')) {
                        return 'BC36';
                    }
                    
                    // Fallback vers le type générique
                    
                    return 'CELLULAIRE';
                }
                
                if (currentBlock && currentBlock.category === 'cellular-assise') {
                    
                    // BCA : même logique que BC mais basé sur les dimensions
                    if (blockType.includes('60x9')) return 'BC10'; // BCA 9cm → BC10
                    if (blockType.includes('60x14')) return 'BC15'; // BCA 14cm → BC15
                    if (blockType.includes('60x19')) return 'BC20'; // BCA 19cm → BC20
                    
                    // Fallback vers le type générique
                    
                    return 'CELLULAIRE';
                }
                
                if (currentBlock && currentBlock.category === 'cut') {
                    // Extraire le type de base en supprimant les suffixes de coupe
                    let baseType = blockType;
                    if (blockType && typeof blockType === 'string') {
                        const cutSuffixes = ['_3Q', '_HALF', '_1Q'];
                        for (const suffix of cutSuffixes) {
                            if (blockType.endsWith(suffix)) {
                                baseType = blockType.replace(suffix, '');
                                break;
                            }
                        }
                    }
                    
                    // Pour les blocs coupés, utiliser la même assise que le bloc entier d'origine
                    if (baseType === 'B9') {
                        return 'B9';
                    }
                    if (baseType === 'B14') {
                        return 'B14';
                    }
                    if (baseType === 'B19') {
                        return 'B19';
                    }
                    if (baseType === 'B29') {
                        return 'B29';
                    }
                    
                    // Blocs cellulaires coupés : même logique que les entiers
                    if (baseType.includes('60x5')) return 'BC5';
                    if (baseType.includes('60x7')) return 'BC7';
                    if (baseType.includes('60x10')) return 'BC10';
                    if (baseType.includes('60x15')) return 'BC15';
                    if (baseType.includes('60x17')) return 'BC17';
                    if (baseType.includes('60x20')) return 'BC20';
                    if (baseType.includes('60x24')) return 'BC24';
                    if (baseType.includes('60x30')) return 'BC30';
                    if (baseType.includes('60x36')) return 'BC36';
                    
                    // Blocs ARGEX coupés : détecter le sous-type selon les dimensions
                    if (baseType.includes('39x9')) return 'ARGEX9';
                    if (baseType.includes('39x14')) return 'ARGEX14';
                    if (baseType.includes('39x19')) return 'ARGEX19';
                    
                    // Blocs terre cuite coupés : détecter le sous-type selon les dimensions
                    if (baseType.includes('50x10')) return 'TC10';
                    if (baseType.includes('50x14')) return 'TC14';
                    if (baseType.includes('50x19')) return 'TC19';
                    
                    // Autres types de blocs coupés - utiliser baseType au lieu de blockType
                    if (baseType === 'cellular' || baseType === 'CELLULAIRE') {
                        return 'CELLULAIRE';
                    }
                    if (baseType === 'argex' || baseType === 'ARGEX') return 'ARGEX';
                    if (baseType === 'terracotta' || baseType === 'TERRE_CUITE') return 'TERRE_CUITE';
                    
                    return 'CREUX';
                }
                
                // Autres catégories avec détection de sous-types
                if (currentBlock && currentBlock.category === 'argex') {
                    const blockType = window.BlockSelector.currentBlock;
                    if (blockType && blockType.includes('39x9')) return 'ARGEX9';
                    if (blockType && blockType.includes('39x14')) return 'ARGEX14';
                    if (blockType && blockType.includes('39x19')) return 'ARGEX19';
                    return 'ARGEX'; // Fallback générique
                }
                if (currentBlock && currentBlock.category === 'terracotta') {
                    const blockType = window.BlockSelector.currentBlock;
                    if (blockType && blockType.includes('50x10')) return 'TC10';
                    if (blockType && blockType.includes('50x14')) return 'TC14';
                    if (blockType && blockType.includes('50x19')) return 'TC19';
                    return 'TERRE_CUITE'; // Fallback générique
                }
                
            } catch (error) {
                console.error('Erreur dans detectBlockSubType:', error);
            }
        } else {
            
        }
        
        // Fallback : utiliser les propriétés de l'élément lui-même
        if (element.blockType) {
            
            const blockSubTypes = ['CREUX', 'CELLULAIRE', 'ARGEX', 'TERRE_CUITE', 'B9', 'B14', 'B19', 'B29', 'BC5', 'BC7', 'BC10', 'BC15', 'BC17', 'BC20', 'BC24', 'BC30', 'BC36', 'ARGEX9', 'ARGEX14', 'ARGEX19', 'TC10', 'TC14', 'TC19'];
            if (blockSubTypes.includes(element.blockType)) {
                
                return element.blockType;
            }
        }

        return null;
    }

    // Màthode pour basculer automatiquement vers l'assise du type de brique courante
    switchToBrickAssise() {
        if (window.BrickSelector) {
            try {
                const currentBrick = window.BrickSelector.getCurrentBrick();
                if (currentBrick && currentBrick.type) {
                    const baseType = currentBrick.type.split('_')[0]; // Enlever les suffixes comme _3Q, _HALF
                    if (this.brickSubTypes.includes(baseType)) {
                        this.setCurrentType(baseType, true); // skipToolChange = true
                        return baseType;
                    }
                }
            } catch (error) {
                console.warn('Erreur lors du basculement automatique d\'assise:', error);
            }
        }
        return null;
    }

    getMaxElementHeightInAssise(assiseIndex) {
        // Chercher dans le type actuel d'abord
        const assisesForCurrentType = this.assisesByType.get(this.currentType);
        if (assisesForCurrentType.has(assiseIndex)) {
            return this.getMaxElementHeightInAssiseForType(this.currentType, assiseIndex);
        }
        
        // Si pas trouvé dans le type actuel, chercher dans tous les types
        for (const type of this.supportedTypes) {
            const assisesForType = this.assisesByType.get(type);
            if (assisesForType.has(assiseIndex)) {
                return this.getMaxElementHeightInAssiseForType(type, assiseIndex);
            }
        }
        
        // CORRECTION : Utiliser hauteur standard selon le type actuel
        return this.getDefaultElementHeight(this.currentType);
    }

    getMaxElementHeightInAssiseForType(type, assiseIndex) {
        const assisesForType = this.assisesByType.get(type);
        if (!assisesForType.has(assiseIndex)) {
            // Pour le calcul des hauteurs d'assises, utiliser hauteur standard du type
            return this.getDefaultElementHeight(type);
        }
        
        const assise = assisesForType.get(assiseIndex);
        
        // Si l'assise est vide, utiliser une hauteur standard appropriàe
        if (assise.elements.size === 0) {
            // Utiliser la hauteur standard du type (6.5 cm pour brick M65)
            return this.getDefaultElementHeight(type);
        }
        
        // Utiliser la hauteur minimum standard comme base
        let maxHeight = this.getDefaultElementHeight(type);
        
        for (const elementId of assise.elements) {
            const element = window.SceneManager.elements.get(elementId);
            if (!element) continue;
            if (element.isVerticalJoint) continue; // ignorer joints debout
            if (element.type === 'beam') continue; // ignorer poutres pour ne pas décaler les assises suivantes
            maxHeight = Math.max(maxHeight, element.dimensions.height);
        }
        
        return maxHeight;
    }

    addElementToAssise(elementId, assiseIndex = null) {        
        console.log('🏗️ [DEBUG-ASSISE] addElementToAssise appelé pour:', elementId);
        
        // Déterminer le type de l'élément et le sous-type pour les briques
        const element = window.SceneManager.elements.get(elementId);
        console.log('🏗️ [DEBUG-ASSISE] Element trouvé:', {
            id: element?.id,
            type: element?.type,
            currentType: this.currentType
        });
        
    // Poutres désormais gérées (assise dédiée 'beam')
        let elementType = this.currentType; // Par défaut
        
        if (element && element.type) {
            // Pour les joints, utiliser le type courant (après basculement automatique)
            if (element.type === 'joint') {
                // Toujours utiliser le type courant pour assurer la cohérence
                // après les basculements automatiques entre types d'assises
                elementType = this.currentType;
            }
            // Pour les briques, dàtecter le sous-type spécifique
            else if (element.type === 'brick') {
                // Log réduit pour éviter le spam
                if (!this._lastDetectedBrick || this._lastDetectedBrick !== element.id) {
                    this._lastDetectedBrick = element.id;
                }
                const brickSubType = this.detectBrickSubType(element);
                if (brickSubType) {
                    elementType = brickSubType;
                    // Basculer automatiquement vers ce type d'assise
                    if (this.currentType !== brickSubType) {
                        this.setCurrentType(brickSubType, true); // skipToolChange = true
                    }
                } else {
                    elementType = 'brick';
                }
                // 
            }
            // Pour les blocs, détecter le sous-type spécifique
            else if (element.type === 'block') {
                console.log('🏗️ [DEBUG-ASSISE] Bloc détecté, appel detectBlockSubType...');
                
                // Log réduit pour éviter le spam
                if (!this._lastDetectedBlock || this._lastDetectedBlock !== element.id) {
                    this._lastDetectedBlock = element.id;
                }

                // CORRECTION IMPORTANTE : Si on est déjà sur un type spécifique (B9, B14, etc.)
                // et que l'élément est un bloc, garder ce type au lieu de détecter "CREUX"
                const currentSpecificTypes = ['B9', 'B14', 'B19', 'B29'];
                let blockSubType = null;
                
                if (currentSpecificTypes.includes(this.currentType)) {
                    console.log('🏗️ [DEBUG-ASSISE] Déjà sur un type spécifique:', this.currentType, '- Conservation du type');
                    blockSubType = this.currentType;
                } else {
                    // Bloc détecté, tentative de détection du sous-type
                    blockSubType = this.detectBlockSubType(element);
                    console.log('🏗️ [DEBUG-ASSISE] detectBlockSubType retourné:', blockSubType);
                }

                if (blockSubType) {
                    console.log('🏗️ [DEBUG-ASSISE] blockSubType trouvé:', blockSubType);
                    elementType = blockSubType;

                    // CORRECTION : Mapper les sous-types vers le type d'assise approprié
                    let targetAssiseType = blockSubType;
                    
                    // CORRECTION BC5: Garder les types BC* spécifiques (BC5, BC7, BC10, etc.) au lieu de forcer CELLULAIRE
                    // Les types BC* gardent maintenant leur type spécifique pour un affichage précis
                    // Note: Pas de remapping pour BC* - ils utilisent leur nom spécifique
                    
                    // Les types B* (creux) peuvent garder leur type spécifique ou utiliser CREUX
                    // Pour l'instant, on garde le type spécifique pour B9, B14, etc.
                    
                    // CORRECTION IMPORTANTE : utiliser targetAssiseType pour elementType aussi
                    elementType = targetAssiseType;
                    console.log('🏗️ [DEBUG-ASSISE] elementType final:', elementType, 'targetAssiseType:', targetAssiseType);

                    // Basculer automatiquement vers ce type d'assise
                    if (this.currentType !== targetAssiseType) {
                        console.log('🏗️ [DEBUG-ASSISE] Basculement vers assise type:', targetAssiseType, 'depuis:', this.currentType);
                        
                        // CORRECTION : Conserver l'index d'assise actuel lors du changement de type
                        const currentAssiseIndex = this.currentAssiseByType.get(this.currentType) || 0;
                        console.log('🏗️ [DEBUG-ASSISE] Conservation de l\'index d\'assise:', currentAssiseIndex);
                        
                        this.setCurrentType(targetAssiseType, true); // skipToolChange = true
                        
                        // Définir le même index pour le nouveau type
                        this.currentAssiseByType.set(targetAssiseType, currentAssiseIndex);
                        console.log('🏗️ [DEBUG-ASSISE] Index conservé pour le nouveau type:', targetAssiseType, 'index:', currentAssiseIndex);
                        
                    } else {
                        console.log('🏗️ [DEBUG-ASSISE] Déjà sur le bon type d\'assise:', targetAssiseType);
                    }
                } else {
                    console.log('🏗️ [DEBUG-ASSISE] ⚠️ Aucun blockSubType trouvé, utilisation type générique "block"');
                    elementType = 'block';
                    
                }
                
            }
            // Pour les GLB hourdis, basculer automatiquement vers une assise hourdis
            else if ((element.type && element.type.includes('hourdis')) || 
                     (element.type === 'glb' && (
                        (element.name && element.name.includes('hourdis')) ||
                        (element.userData && element.userData.glbInfo && element.userData.glbInfo.type && element.userData.glbInfo.type.includes('hourdis'))
                     ))) {
                // Détecter le type spécifique de hourdis depuis le type de l'élément ou glbInfo
                if (element.type && element.type.includes('hourdis')) {
                    elementType = element.type; // hourdis_13_60, hourdis_16_60, etc. (cas direct)
                } else if (element.userData && element.userData.glbInfo && element.userData.glbInfo.type) {
                    elementType = element.userData.glbInfo.type; // hourdis_13_60, hourdis_16_60, etc. (cas glbInfo)
                } else {
                    elementType = 'hourdis_13_60'; // Type par défaut si pas d'info spécifique
                }
                // Basculer automatiquement vers ce type d'assise
                if (this.currentType !== elementType) {
                    this.setCurrentType(elementType, true); // skipToolChange = true
                }
            }
            // Mapper le type de l'élément vers les types d'assise supportés
            else if (this.allSupportedTypes.includes(element.type)) {
                elementType = element.type;
                // console.log(`🔧 Type supporté directement: ${element.type}`); // désactivé
            } else {
                // Log supprimé: Type non supporté (debug construction)
            }
        } else {
            // Log supprimé: élément non trouvé ou sans type
        }

        // NORMALISATION SUPPLÉMENTAIRE ISOLANT (libellés UI ex: 'Isolant PUR5')
        if (elementType && typeof elementType === 'string') {
            const up = elementType.toUpperCase();
            if (up.startsWith('ISOLANT') || up.startsWith('ISOLATION') || up.includes(' ISOLANT')) {
                const prev = elementType;
                elementType = 'insulation';
                if (window._isoGhostLog) {
                    window._isoGhostLog('NORMALIZE_ISOLANT_ELEMENT_TYPE', { previous: prev, normalized: elementType });
                }
            }
        }
        
        if (assiseIndex === null) {
            assiseIndex = this.currentAssiseByType.get(elementType);

            // Si l'assise est undefined, forcer l'héritage immédiat
            if (assiseIndex === undefined && elementType !== this.currentType) {
                // Assise index undefined, tentative héritage du type
                const inheritedIndex = this.currentAssiseByType.get(this.currentType);
                if (inheritedIndex !== undefined) {
                    this.currentAssiseByType.set(elementType, inheritedIndex);
                    assiseIndex = inheritedIndex;
                    // Héritage forcé du type d'assise
                }
            }
        }
        
        console.log('🏗️ [DEBUG-ASSISE] Type final déterminé:', elementType, 'assiseIndex:', assiseIndex);
        
        // Utiliser la nouvelle màthode multi-type avec le bon type
        this.addElementToAssiseForType(elementType, elementId, assiseIndex);
        
        console.log('🏗️ [DEBUG-ASSISE] ✅ Élément ajouté avec succès à l\'assise', assiseIndex, 'de type', elementType);

        // LOG SPÉCIFIQUE ISOLANT
        if (elementType === 'insulation') {
            try {
                const idx = assiseIndex;
                const assiseHeight = this.getAssiseHeightForType('insulation', idx);
                const currentAssise = this.currentAssiseByType.get('insulation');
                const ghost = window.ConstructionTools?.ghostElement;
                const ghostY = ghost ? Math.round((ghost.position?.y || 0) * 100)/100 : null;
                let anomaly = null;
                if (idx > 0 && ghostY !== null) {
                    const expected = assiseHeight + (ghost?.dimensions?.height||0)/2;
                    // Si le fantôme est encore proche de l'assise 0 (ex ~30) alors que la base devrait être >= assiseHeight
                    if (ghostY < assiseHeight + 0.1) {
                        anomaly = {
                            message: 'Fantôme isolant semble bloqué à une hauteur basse (reste sur assise 0 ?) ',
                            ghostY,
                            assiseHeight,
                            expectedCenter: expected
                        };
                    }
                }
                window._isoGhostLog('ADD_ELEMENT_INSULATION', {
                    elementId,
                    placedOnAssiseIndex: idx,
                    currentAssiseSelection: currentAssise,
                    computedAssiseHeight: assiseHeight,
                    ghostY,
                    ghostExpectedCenterY: assiseHeight + (ghost?.dimensions?.height||0)/2,
                    elementCountInAssise: this.assisesByType.get('insulation')?.get(idx)?.elements.size,
                    anomaly
                });
            } catch(e) { /* ignore */ }
        }
    }

    // Ajouter un élément à une assise d'un type spécifique
    addElementToAssiseForType(type, elementId, assiseIndex = null) {
        if (!this.allSupportedTypes.includes(type)) {
            console.warn(`Type non supporté: ${type}`);
            return false;
        }
    // Poutres acceptées
        
        if (assiseIndex === null) {
            assiseIndex = this.currentAssiseByType.get(type);
        }
        
        const assisesForType = this.assisesByType.get(type);
        const elementsForType = this.elementsByType.get(type);
        
        // Cràer l'assise si elle n'existe pas
        if (!assisesForType.has(assiseIndex)) {
            this.addAssiseForType(type, assiseIndex);
        }

        // Après création potentielle de l'assise, log pré-ajout pour isolants
        if (type === 'insulation') {
            try {
                const beforeCount = assisesForType.get(assiseIndex)?.elements.size || 0;
                window._isoGhostLog('PRE_ADD_TO_ASSISE_INSULATION', { assiseIndex, beforeCount });
            } catch(e) {}
        }
        
    const assise = assisesForType.get(assiseIndex);
        
        assise.elements.add(elementId);
        elementsForType.get(assiseIndex).add(elementId);
        
        // Mettre à jour la position Y de l'élément
        const element = window.SceneManager.elements.get(elementId);
        if (element) {
            const isBeam = element.type === 'beam';
            // Assigner un nom d'assise lisible si absent
            if (!element.assiseName) {
                element.assiseName = `${type}-A${assiseIndex}`;
            }
            // DEBUG: Afficher les propriétés de l'élément (dàsactivà pour ràduire les logs)
            // console.log(`🔧 DEBUG élément ${elementId}:`, {
            //     isVerticalJoint: element.isVerticalJoint,
            //     isHorizontalJoint: element.isHorizontalJoint,
            //     currentY: element.position.y,
            //     type: element.type
            // });
            
            // EXCEPTION: Ne pas repositionner les joints (debout ou horizontaux)
            if (element.isVerticalJoint || element.isHorizontalJoint) {
                // 
                this.updateUI();
                // console.log(`élément ${elementId} ajoutà à l'assise ${assiseIndex} du type '${type}' (joint)`);
                return true;
            }
            // Ne pas repositionner les poutres automatiquement pour préserver leur altitude libre
            if (isBeam) {
                // Mise à jour ciblée : éviter reposition mais rafraîchir liste globale
                this.updateGlobalAssiseList();
                return true;
            }
            
            // CORRECTION DàFINITIVE: Utiliser la vraie hauteur de l'assise (incluant les joints variables)
            const assiseHeight = this.getAssiseHeightForType(type, assiseIndex);
            
            // 🔧 HOURDIS: Pour les hourdis assise 0, l'objet doit àtre directement à Y=0 (base)
            let targetCenterY;
            if (type.includes('hourdis') && assiseIndex === 0) {
                // Pour hourdis assise 0 : TOUJOURS base à Y=0, donc centre à hauteur/2
                targetCenterY = element.dimensions.height / 2;
            } else {
                // Calcul normal pour autres types
                targetCenterY = assiseHeight + element.dimensions.height / 2;
            }
            
            // Positionner l'élément - vàrifier si c'est un GLB ou un élément traditionnel
            if (element.updatePosition && typeof element.updatePosition === 'function') {
                // élément traditionnel (brick, block, etc.)
                element.updatePosition(element.position.x, targetCenterY, element.position.z);
            } else if (element.position) {
                // élément GLB - cas spàcial pour les hourdis
                const isHourdis = element.userData && (
                    (element.userData.glbType && element.userData.glbType.includes('hourdis')) || 
                    (element.userData.type && element.userData.type.includes('hourdis')) ||
                    (element.userData.glbInfo && element.userData.glbInfo.type && element.userData.glbInfo.type.includes('hourdis')) ||
                    (element.type && element.type.includes('hourdis'))
                );
                
                if (isHourdis && assiseIndex === 0) {
                    // HOURDIS ASSISE 0: TOUJOURS forcer la BASE au niveau du sol Y=0
                    element.position.y = 0;
                } else if (element.userData && element.userData.positionedByConstructionTools) {
                    // Si c'est un hourdis positionnà par les outils, forcer Y=0
                    if (isHourdis) {
                        element.position.y = 0;
                    } else {
                        // Log supprimé: GLB déjà positionné par les outils de construction
                    }
                } else {
                    // Positionner directement seulement si pas déjà positionnà
                    element.position.y = targetCenterY;
                    // Log supprimé: GLB positionné directement
                }
            }
            
            // Vàrification finale
            const actualBaseY = targetCenterY - element.dimensions.height / 2;
            
            // console.log(`élément ${elementId} positionnà sur assise ${assiseIndex} (type: ${type}):`);
            // console.log(`  - Assise height: ${assiseHeight} cm`);
            // console.log(`  - Centre Y: ${targetCenterY} cm`);
            // console.log(`  - Face infàrieure Y: ${actualBaseY} cm`);
            // console.log(`  - Hauteur: ${element.dimensions.height} cm`);
            
            // Vàrification: la face infàrieure doit àtre à la hauteur de l'assise
            if (Math.abs(actualBaseY - assiseHeight) < 0.001) {
                // console.log(`  ? PARFAIT! Face infàrieure exactement à ${assiseHeight} cm`);
            } else {
                console.error(`  ? ERREUR! Face infàrieure à ${actualBaseY} cm au lieu de ${assiseHeight} cm`);
            }
            
            // NOUVELLE FONCTIONNALITà: Mise à jour automatique de la hauteur de joint de l'assise
            // selon les paramàtres de l'élément placé (pour les blocs cellulaires notamment)
            // PROTECTION ANTI-BOUCLE INFINIE: Ne pas synchroniser pendant un repositionnement
            if (!this.isRepositioning && window.ConstructionTools && (element.type === 'block' || element.material === 'cellular-concrete' || element.material === 'cellular-assise')) {
                const jointSettings = window.ConstructionTools.getJointSettingsForElement(element);
                if (jointSettings && jointSettings.createJoints) {
                    // Convertir mm en cm pour la hauteur de joint horizontal
                    const jointHeightCm = jointSettings.horizontalThickness / 10;
                    
                    // Vàrifier si la hauteur de joint a ràellement changà pour àviter les mises à jour inutiles
                    const currentJointHeight = this.getJointHeightForAssise(type, assiseIndex);
                    if (Math.abs(currentJointHeight - jointHeightCm) > 0.001) {
                        // Mettre à jour la hauteur de joint pour cette assise spécifique
                        this.setJointHeightForAssise(type, assiseIndex, jointHeightCm);
                        
            // Log supprimé: SYNCHRONISATION JOINT
                        // Nettoyage immédiat des joints horizontaux cellulaires en double (mortier + colle)
                        if (type === 'CELLULAR' && window.ConstructionTools && typeof window.ConstructionTools.dedupeCellularHorizontalJoints === 'function') {
                            window.ConstructionTools.dedupeCellularHorizontalJoints();
                        }
                    }
                }
            } else if (this.isRepositioning) {
        // Log supprimé: PROTECTION ANTI-BOUCLE synchronisation
            }
        }
        
        this.updateUI();
        // console.log(`élément ${elementId} ajoutà à l'assise ${assiseIndex} du type '${type}'`);

        // ACTIVATION AUTOMATIQUE DES GRILLES lors du placement d'un élément
        if (!this.showAssiseGrids) {
            this.showAssiseGrids = true;
            this.updateAllGridVisibility();
            // console.log('🔧 Grilles d\'assises activàes automatiquement lors du placement d\'un élément');
            
            // Mettre à jour l'affichage du bouton dans l'onglet outils
            if (window.ToolsTabManager) {
                // Les boutons se mettent à jour automatiquement via les événements
                            }
        }

        // émettre un événement pour notifier les changements d'éléments
        document.dispatchEvent(new CustomEvent('assiseElementsChanged', {
            detail: { 
                action: 'added',
                elementId: elementId,
                assiseIndex: assiseIndex,
                type: type
            }
        }));

        // Mettre à jour la taille des grilles si nàcessaire (nouvelle fonctionnalità)
        // Attendre un peu pour que l'élément soit bien ajoutà avant de recalculer
        setTimeout(() => {
            this.updateAllGridSizes();
        }, 100);

        // Mettre à jour les marqueurs d'accroche si nàcessaire
        const currentAssiseForType = this.currentAssiseByType.get(type);
        if (currentAssiseForType > assiseIndex) {
            // Un élément a àtà ajoutà à une assise infàrieure, mettre à jour les marqueurs
            this.updateAttachmentMarkers();
        }
        
        return true;
    }

    removeElementFromAssise(elementId) {
    // Log supprimé: début suppression élément
        let removedFromAssise = null;
        let removedFromType = null;
        
        // D'abord, affichons l'état actuel des assises pour debug
    // Log supprimé: état des assises avant suppression
        for (const type of this.allSupportedTypes) {
            const assisesForType = this.assisesByType.get(type);
            const elementsForType = this.elementsByType.get(type);
            if (assisesForType && assisesForType.size > 0) {
                let hasElements = false;
                for (const [assiseIndex, assise] of assisesForType.entries()) {
                    const elementsInAssise = elementsForType.get(assiseIndex);
                    if (assise.elements.size > 0 || (elementsInAssise && elementsInAssise.size > 0)) {
                        hasElements = true;
                        break;
                    }
                }
                if (hasElements) { // Log supprimé: Type avec éléments
                    for (const [assiseIndex, assise] of assisesForType.entries()) {
                        const elementsInAssise = elementsForType.get(assiseIndex);
                        if (assise.elements.size > 0 || (elementsInAssise && elementsInAssise.size > 0)) {
                            // Logs supprimés: détail des éléments d'assise
                        }
                    }
                }
            }
        }
        
        // Rechercher dans tous les types (incluant les sous-types)
        for (const type of this.allSupportedTypes) {
            // Log supprimé: recherche dans type
            const assisesForType = this.assisesByType.get(type);
            const elementsForType = this.elementsByType.get(type);
            
            for (const [assiseIndex, assise] of assisesForType.entries()) {
                // Log supprimé: vérification assise contient élément
                if (assise.elements.has(elementId)) {
                    // Log supprimé: élément trouvé
                    
                    // TEMPORAIREMENT DÉSACTIVÉ - suppression des joints associés
                    // this.removeAssociatedJoints(elementId, assiseIndex, type);
                    
                    assise.elements.delete(elementId);
                    elementsForType.get(assiseIndex).delete(elementId);
                    removedFromAssise = assiseIndex;
                    removedFromType = type;
                    break;
                }
            }
            if (removedFromAssise !== null) break;
        }
        
        if (removedFromAssise !== null) {
            this.updateUI();
            // Log supprimé: élément retiré
            
            // émettre un événement pour notifier les changements d'éléments
            document.dispatchEvent(new CustomEvent('assiseElementsChanged', {
                detail: { 
                    action: 'removed',
                    elementId: elementId,
                    assiseIndex: removedFromAssise,
                    type: removedFromType
                }
            }));
            
            // Mettre à jour la taille des grilles après suppression (nouvelle fonctionnalità)
            // Attendre un peu pour que l'élément soit bien supprimà avant de recalculer
            setTimeout(() => {
                this.updateAllGridSizes();
            }, 100);
            
            // Mettre à jour les marqueurs d'accroche si nàcessaire
            const currentAssiseForType = this.currentAssiseByType.get(removedFromType);
            // Logs supprimés: détails suppression et condition mise à jour marqueurs
            
            if (currentAssiseForType >= removedFromAssise) {
                // Log supprimé: déclenchement mise à jour marqueurs
                // Un élément a àtà retirà d'une assise infàrieure ou de l'assise courante, mettre à jour les marqueurs
                this.updateAttachmentMarkers();
            } else {
                // Log supprimé: pas de mise à jour marqueurs nécessaire
            }
        } else {
            // Log supprimé: élément non trouvé
        }
        
        // Log supprimé: fin suppression élément
        return removedFromAssise;
    }

    // Nouvelle màthode pour ràcupàrer l'assise d'un élément
    getElementAssise(elementId) {
        // Rechercher dans tous les types (incluant les sous-types de briques)
        for (const type of this.allSupportedTypes) {
            const assisesForType = this.assisesByType.get(type);
            if (!assisesForType) continue;
            
            for (const [assiseIndex, assise] of assisesForType.entries()) {
                if (assise.elements.has(elementId)) {
                    return assiseIndex;
                }
            }
        }
        return null;
    }

    // Màthode pour ràcupàrer à la fois l'assise et le type d'un élément
    getElementAssiseAndType(elementId) {
        // Rechercher dans tous les types (incluant les sous-types de briques)
        for (const type of this.allSupportedTypes) {
            const assisesForType = this.assisesByType.get(type);
            if (!assisesForType) continue;
            
            for (const [assiseIndex, assise] of assisesForType.entries()) {
                if (assise.elements.has(elementId)) {
                    return { assiseIndex, type };
                }
            }
        }
        return null;
    }

    // Compter les éléments non-joints dans une assise d'un type spécifique
    getNonJointElementCountForType(type, assiseIndex) {
        const assisesForType = this.assisesByType.get(type);
        if (!assisesForType || !assisesForType.has(assiseIndex)) {
            return 0;
        }
        
        const assise = assisesForType.get(assiseIndex);
        let count = 0;
        
        for (const elementId of assise.elements) {
            const element = window.SceneManager.elements.get(elementId);
            if (element && !element.isVerticalJoint && !element.isHorizontalJoint) {
                count++;
            }
        }
        
        return count;
    }

    // Compter les éléments non-joints dans une assise du type actuel (compatibilité)
    getNonJointElementCount(assiseIndex) {
        return this.getNonJointElementCountForType(this.currentType, assiseIndex);
    }

    // Vàrifier si un élément peut àtre sàlectionnà (pas d'assise infàrieure quand une supàrieure est active)
    canSelectElement(elementId, showLog = false) {
        // Utiliser la màthode robuste qui cherche dans tous les types
        const elementInfo = this.getElementAssiseAndType(elementId);
        
        if (showLog) {
            // console.log(`🔧 DEBUG canSelectElement: elementId=${elementId}, elementInfo=${JSON.stringify(elementInfo)}`);
        }
        
        if (!elementInfo) {
            // if (showLog) console.log(`🔧 DEBUG: élément ${elementId} non dans une assise - autorisà`);
            return true; // élément non dans une assise = sàlectionnable
        }
        
        const { assiseIndex: elementAssise, type: elementType } = elementInfo;
        
        if (showLog) {
            // console.log(`🔧 DEBUG: elementAssise=${elementAssise}, elementType=${elementType}`);
        }
        
        // Seule l'assise active pour ce type doit àtre accessible
        const currentAssiseForType = this.currentAssiseByType.get(elementType);
        const canSelect = elementAssise === currentAssiseForType;
        
        if (showLog) {
            // console.log(`🔧 DEBUG: currentAssiseForType=${currentAssiseForType}, elementAssise=${elementAssise}, canSelect=${canSelect}`);
        }
        
        // Log critique seulement si demandà (interactions ràelles, pas vàrifications de routine)
        if (!canSelect && showLog) {
            // console.log(`🔧 BLOCAGE: élément ${elementId} (assise ${elementAssise}, type: ${elementType}) bloquà car assise active = ${currentAssiseForType}`);
        }
        
        return canSelect;
    }

    // Calculer la taille dynamique de la grille en fonction des éléments présents dans la scène
    calculateDynamicGridSize() {
        if (!window.SceneManager || window.SceneManager.elements.size === 0) {
            return 200; // Taille par défaut si pas d'éléments
        }
        
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        
        // Analyser tous les éléments de la scène pour calculer les limites
        window.SceneManager.elements.forEach(element => {
            const pos = element.position;
            const dim = element.dimensions;
            
            // Calculer les limites en tenant compte de la taille des éléments
            const halfLength = dim.length / 2;
            const halfWidth = dim.width / 2;
            
            minX = Math.min(minX, pos.x - halfLength);
            maxX = Math.max(maxX, pos.x + halfLength);
            minZ = Math.min(minZ, pos.z - halfWidth);
            maxZ = Math.max(maxZ, pos.z + halfWidth);
        });
        
        // AMÉLIORATION: Calculer la taille nàcessaire avec une marge adaptative plus importante
        // Pour les constructions étendues, augmenter la marge proportionnellement
        const elementRange = Math.max(maxX - minX, maxZ - minZ);
        
        // Marge adaptative : 
        // - Minimum 3m de chaque côté pour petites constructions (600cm au total)
        // - Jusqu'à 5m de chaque côté pour grandes constructions (1000cm au total)
        const adaptiveMargin = Math.max(600, Math.min(1000, elementRange * 0.5));
        
        const rangeX = maxX - minX + adaptiveMargin;
        const rangeZ = maxZ - minZ + adaptiveMargin;
        const maxRange = Math.max(rangeX, rangeZ);
        
        // Arrondir à la dizaine supàrieure pour une grille propre
        const finalSize = Math.ceil(maxRange / 10) * 10;
        
        // Taille minimale de 600cm (pour garantir au moins 3m de marge)
        // Taille maximale augmentée à 2000cm (20m) pour supporter les grandes constructions
        return Math.min(Math.max(finalSize, 600), 2000);
    }

    // Cràer la grille pour une assise d'un type spécifique
    createAssiseGridForType(type, index) {
        // 🛡️ PROTECTION: Vérifier que les Maps sont initialisées
        if (!this.assisesByType || !this.gridHelpersByType || !this.currentAssiseByType) {
            console.warn('⚠️ createAssiseGridForType: Maps non initialisées', {
                assisesByType: !!this.assisesByType,
                gridHelpersByType: !!this.gridHelpersByType,
                currentAssiseByType: !!this.currentAssiseByType
            });
            return;
        }
        
        const assisesForType = this.assisesByType.get(type);
        const gridHelpersForType = this.gridHelpersByType.get(type);
        
        if (!assisesForType || !gridHelpersForType) {
            console.warn(`⚠️ createAssiseGridForType: Maps pour type '${type}' non initialisées`);
            return;
        }
        
        const assise = assisesForType.get(index);
        if (!assise) return;
        
        const height = assise.height;
        const size = this.calculateDynamicGridSize(); // Taille adaptative
        const divisions = size; // Garder 1 division par cm pour la pràcision
        
        // Grille principale de l'assise
        const gridHelper = new THREE.GridHelper(size, divisions, this.gridColor, this.gridColor);
        gridHelper.position.y = height;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = index === this.currentAssiseByType.get(type) ? this.activeGridOpacity : this.gridOpacity;
        // 🔧 CORRECTION: Utiliser la même logique que updateAllGridVisibility pour la cohérence
        const isCurrentAssise = (index === this.currentAssiseByType.get(type));
        const isCompatibleType = this.areTypesCompatible(type, this.currentType);
        const shouldShowGrid = this.showAssiseGrids && (isCompatibleType && isCurrentAssise || (type === this.currentType && isCurrentAssise));
        gridHelper.visible = shouldShowGrid;
        
        // Grille du joint (plan supàrieur)
        const jointHeight = height + this.getMaxElementHeightInAssise(index) + this.getJointHeightForType(type);
        const jointGrid = new THREE.GridHelper(size, divisions, 0x95a5a6, 0x95a5a6);
        jointGrid.position.y = jointHeight;
        jointGrid.material.transparent = true;
        jointGrid.material.opacity = 0.2;
        jointGrid.visible = false; // Toujours invisible
        
        // Ajouter à la scène
        window.SceneManager.scene.add(gridHelper);
        window.SceneManager.scene.add(jointGrid);
        
        // Stocker les références
        assise.gridMesh = gridHelper;
        assise.jointGridMesh = jointGrid;
        
        gridHelpersForType.set(index, { main: gridHelper, joint: jointGrid });
    }

    // Màthode de compatibilité
    createAssiseGrid(index) {
        this.createAssiseGridForType(this.currentType, index);
    }

    // Supprimer la grille d'une assise d'un type spécifique
    removeAssiseGridForType(type, index) {
        const gridHelpersForType = this.gridHelpersByType.get(type);
        
        if (gridHelpersForType && gridHelpersForType.has(index)) {
            const grids = gridHelpersForType.get(index);
            window.SceneManager.scene.remove(grids.main);
            window.SceneManager.scene.remove(grids.joint);
            gridHelpersForType.delete(index);
        }
        
        const assisesForType = this.assisesByType.get(type);
        const assise = assisesForType && assisesForType.get(index);
        if (assise) {
            assise.gridMesh = null;
            assise.jointGridMesh = null;
        }
    }

    // Màthode de compatibilité
    removeAssiseGrid(index) {
        this.removeAssiseGridForType(this.currentType, index);
    }

    // Recalculer et redimensionner toutes les grilles existantes
    updateAllGridSizes() {
        const newSize = this.calculateDynamicGridSize();
        
        // Calculer les dàtails pour le log
        if (window.SceneManager && window.SceneManager.elements.size > 0) {
            let minX = Infinity, maxX = -Infinity;
            let minZ = Infinity, maxZ = -Infinity;
            
            window.SceneManager.elements.forEach(element => {
                const pos = element.position;
                const dim = element.dimensions;
                const halfLength = dim.length / 2;
                const halfWidth = dim.width / 2;
                
                minX = Math.min(minX, pos.x - halfLength);
                maxX = Math.max(maxX, pos.x + halfLength);
                minZ = Math.min(minZ, pos.z - halfWidth);
                maxZ = Math.max(maxZ, pos.z + halfWidth);
            });
            
            // Logs supprimés: détails mise à jour grilles (extent & nouvelle taille)
        } else {
            // Log supprimé: mise à jour grilles taille par défaut
        }
        
        // Parcourir tous les types et toutes les assises
        for (const type of this.allSupportedTypes) {
            const gridHelpersForType = this.gridHelpersByType.get(type);
            if (!gridHelpersForType) continue;
            
            const assisesForType = this.assisesByType.get(type);
            
            for (const [index, grids] of gridHelpersForType.entries()) {
                const assise = assisesForType.get(index);
                if (!assise) continue;
                
                // Supprimer les anciennes grilles
                window.SceneManager.scene.remove(grids.main);
                window.SceneManager.scene.remove(grids.joint);
                
                // Cràer les nouvelles grilles avec la bonne taille
                const height = assise.height;
                const divisions = newSize;
                
                // Nouvelle grille principale
                const gridHelper = new THREE.GridHelper(newSize, divisions, this.gridColor, this.gridColor);
                gridHelper.position.y = height;
                gridHelper.material.transparent = true;
                gridHelper.material.opacity = index === this.currentAssiseByType.get(type) ? this.activeGridOpacity : this.gridOpacity;
                // 🔧 CORRECTION: Utiliser la même logique que updateAllGridVisibility pour la cohérence
                const isCurrentAssise = (index === this.currentAssiseByType.get(type));
                const isCompatibleType = this.areTypesCompatible(type, this.currentType);
                const shouldShowGrid = this.showAssiseGrids && (isCompatibleType && isCurrentAssise || (type === this.currentType && isCurrentAssise));
                gridHelper.visible = shouldShowGrid;
                
                // Nouvelle grille du joint
                const jointHeight = height + this.getMaxElementHeightInAssise(index) + this.getJointHeightForType(type);
                const jointGrid = new THREE.GridHelper(newSize, divisions, 0x95a5a6, 0x95a5a6);
                jointGrid.position.y = jointHeight;
                jointGrid.material.transparent = true;
                jointGrid.material.opacity = 0.2;
                jointGrid.visible = false;
                
                // Ajouter à la scène
                window.SceneManager.scene.add(gridHelper);
                window.SceneManager.scene.add(jointGrid);
                
                // Mettre à jour les références
                assise.gridMesh = gridHelper;
                assise.jointGridMesh = jointGrid;
                grids.main = gridHelper;
                grids.joint = jointGrid;
            }
        }
    }

    // Mettre à jour l'apparence d'une grille pour un type spécifique
    updateGridAppearanceForType(type, index) {
        const gridHelpersForType = this.gridHelpersByType.get(type);
        
        if (!gridHelpersForType || !gridHelpersForType.has(index)) return;
        
        const grids = gridHelpersForType.get(index);
        const isActive = (index === this.currentAssiseByType.get(type)) && (type === this.currentType);
        
        // Mettre à jour l'apparence de la grille principale
        grids.main.material.color.setHex(this.gridColor); // ? TOUJOURS GARDER LA COULEUR BLEUE
        grids.main.material.opacity = isActive ? this.activeGridOpacity : this.gridOpacity;
        // Seule la grille de l'assise active du type actuel est visible
        grids.main.visible = this.showAssiseGrids && isActive;
        
        // Masquer complàtement le plan supàrieur - seule la grille active doit àtre visible
        grids.joint.visible = false;
    }

    // Màthode de compatibilité
    updateGridAppearance(index) {
        this.updateGridAppearanceForType(this.currentType, index);
    }

    setJointHeight(height) {
        // Utilise la nouvelle màthode qui ne modifie que le type actuel
        this.setJointHeightForType(this.currentType, height);
        
        // Forcer la mise à jour de l'interface pour reflàter le changement
        this.updateUI();
    }

    toggleAssiseGrids() {
        this.showAssiseGrids = !this.showAssiseGrids;
        
        // Appliquer le changement à tous les types (incluant les sous-types de briques)
        for (const type of this.allSupportedTypes) {
            const gridHelpersForType = this.gridHelpersByType.get(type);
            if (!gridHelpersForType) continue;
            
            const currentAssiseForType = this.currentAssiseByType.get(type);
            
            for (const [index, grids] of gridHelpersForType.entries()) {
                // Seule la grille de l'assise active du type actuel est visible
                const isActiveForCurrentType = (type === this.currentType) && (index === currentAssiseForType);
                grids.main.visible = this.showAssiseGrids && isActiveForCurrentType;
                
                // Masquer complàtement tous les plans supàrieurs
                grids.joint.visible = false;
            }
        }
        
        // Mettre à jour la visibilità du point d'accrochage
        if (this.snapPoint) {
            this.snapPoint.visible = this.showAssiseGrids && this.showSnapPoint;
        }
        
        this.updateUI();
    }

    getAssiseAtHeight(y) {
        let bestAssise = 0;
        let bestDistance = Infinity;
        
        // Chercher dans le type actuel
        const assisesForCurrentType = this.assisesByType.get(this.currentType);
        for (const [index, assise] of assisesForCurrentType.entries()) {
            const distance = Math.abs(y - assise.height);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestAssise = index;
            }
        }
        
        return bestAssise;
    }

    // Force l'affichage de seulement la grille de l'assise active du type actuel
    showOnlyActiveGrid() {
        // console.log(`🔧 Force l'affichage de seulement la grille active (Type: ${this.currentType}, Assise: ${this.currentAssiseByType.get(this.currentType)})`);
        
        // Masquer toutes les grilles
        for (const type of this.allSupportedTypes) {
            const gridHelpersForType = this.gridHelpersByType.get(type);
            if (!gridHelpersForType) continue;
            
            for (const [index, grids] of gridHelpersForType.entries()) {
                grids.main.visible = false;
                grids.joint.visible = false;
            }
        }
        
        // Afficher seulement la grille de l'assise active du type actuel
        const currentGridHelpers = this.gridHelpersByType.get(this.currentType);
        const currentAssiseIndex = this.currentAssiseByType.get(this.currentType);
        
        if (currentGridHelpers && currentGridHelpers.has(currentAssiseIndex)) {
            const activeGrids = currentGridHelpers.get(currentAssiseIndex);
            activeGrids.main.visible = this.showAssiseGrids;
            activeGrids.joint.visible = false; // Toujours masquà
            // Log supprimé: grille active affichée
        }
        
        // Mettre à jour la visibilità du point d'accrochage
        if (this.snapPoint) {
            this.snapPoint.visible = this.showAssiseGrids && this.showSnapPoint;
        }
    }

    setupEventListeners() {
        // àcouter les changements dans l'interface
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupUIEventListeners();
            });
        } else {
    const copyAssiseBtn = document.getElementById('copyAssiseBtn');
            // Le DOM est déjà chargà, configurer immàdiatement
            this.setupUIEventListeners();
        }
        
        // àcouter les mouvements de souris pour mettre à jour le point d'accrochage
        this.setupMouseTracking();
        
        // Configurer les événements pour les onglets de types
        this.setupTypeTabEvents();
    }

    setupMouseTracking() {
        // àcouter l'événement personnalisà cursorMove àmis par le scene manager
        document.addEventListener('cursorMove', (event) => {
            if (this.snapPoint && this.showSnapPoint) {
                const { x, z } = event.detail;
                this.updateSnapPointPosition(x, z);
            }
        });
    }

    setupUIEventListeners() {
        // événements pour les contràles d'assise
        const assiseSelect = document.getElementById('assiseSelect');
        const jointHeightInput = document.getElementById('jointHeight');
        const addAssiseBtn = document.getElementById('addAssise');
        const removeAssiseBtn = document.getElementById('removeAssise');
        const toggleGridsBtn = document.getElementById('toggleAssiseGrids');
        
        //         // console.log('Bouton addAssise trouvé:', !!addAssiseBtn);
        
        if (assiseSelect) {
            assiseSelect.addEventListener('change', (e) => {
                this.setActiveAssiseForType(this.currentType, parseInt(e.target.value));
            });
        }
        
        if (jointHeightInput) {
            jointHeightInput.addEventListener('input', (e) => {
                this.setJointHeight(parseFloat(e.target.value));
            });
        }
        
        if (addAssiseBtn) {
            // CORRECTION: Supprimer les anciens listeners pour àviter les doublons
            if (this.handleAddAssise) {
                addAssiseBtn.removeEventListener('click', this.handleAddAssise);
            }
            
            this.handleAddAssise = () => {

                const assisesForCurrentType = this.assisesByType.get(this.currentType);
                const newIndex = assisesForCurrentType.size;

                // Créer la nouvelle assise
                
                this.addAssiseForType(this.currentType, newIndex);
                
                // Forcer l'activation de la nouvelle assise (redondant mais nécessaire)
                this.setActiveAssiseForType(this.currentType, newIndex);
                
                // CORRECTION SUPPLÉMENTAIRE : Forcer la mise à jour du fantôme après création d'assise
                if (window.ConstructionTools && window.ConstructionTools.ghostElement) {
                    const assiseHeight = this.getAssiseHeightForType(this.currentType, newIndex);
                    if (window.ConstructionTools.ghostElement.dimensions && window.ConstructionTools.ghostElement.dimensions.height) {
                        const ghostHeight = window.ConstructionTools.ghostElement.dimensions.height;
                        const ghostY = assiseHeight + ghostHeight / 2;
                        
                        window.ConstructionTools.ghostElement.updatePosition(
                            window.ConstructionTools.ghostElement.position.x,
                            ghostY,
                            window.ConstructionTools.ghostElement.position.z
                        );
                        
                        console.log(`🎯 BOUTON AJOUT ASSISE - Fantôme forcé à la position: Type ${this.currentType}, Assise ${newIndex}, Hauteur ${ghostY}cm (assise: ${assiseHeight}cm)`);
                    }
                }

                // 🔄 Retour automatique au mode pose de brique (placement)
                if (window.ToolbarManagerInstance && typeof window.ToolbarManagerInstance.setInteractionMode === 'function') {
                    window.ToolbarManagerInstance.setInteractionMode('placement');
                } else if (window.ToolbarManager && window.ToolbarManager.prototype?.setInteractionMode) {
                    // Tentative récupération instance globale si stockée différemment
                    try {
                        const tm = window.ToolbarManagerInstance || window.toolbarManager || window.TOOLBAR_MANAGER;
                        if (tm && typeof tm.setInteractionMode === 'function') {
                            tm.setInteractionMode('placement');
                        }
                    } catch(e) { /* ignore */ }
                }
                // ✅ Activer l'onglet Bibliothèque automatiquement
                try {
                    // Utiliser l'API officielle TabManager pour éviter de casser les listeners
                    if (window.TabManager && typeof window.TabManager.switchMainTab === 'function') {
                        window.TabManager.switchMainTab('biblio');
                    } else {
                        // Fallback minimal si TabManager absent
                        const biblioTabBtn = document.querySelector('.main-tab[data-tab="biblio"]');
                        const biblioContent = document.getElementById('tab-content-biblio');
                        if (biblioTabBtn && biblioContent) {
                            biblioTabBtn.classList.add('active');
                            biblioContent.classList.add('active');
                        }
                    }
                    if (window.AssiseHelpSystem && typeof window.AssiseHelpSystem.forceHideHelp === 'function') {
                        window.AssiseHelpSystem.forceHideHelp();
                    }
                } catch(e) { /* silent */ }
            };
            
            addAssiseBtn.addEventListener('click', this.handleAddAssise);
        } else {
            console.warn('Bouton addAssise non trouvé dans le DOM');
        }
        
        if (removeAssiseBtn) {
            // CORRECTION: Supprimer les anciens listeners pour àviter les doublons
            if (this.handleRemoveAssise) {
                removeAssiseBtn.removeEventListener('click', this.handleRemoveAssise);
            }
            
            this.handleRemoveAssise = () => {
                // console.log('Bouton Supprimer Assise cliquà');
                const assisesForCurrentType = this.assisesByType.get(this.currentType);
                if (assisesForCurrentType.size > 1) {
                    const currentAssiseForType = this.currentAssiseByType.get(this.currentType);
                    this.removeAssiseForType(this.currentType, currentAssiseForType);
                } else {
                    alert('Impossible de supprimer la derniàre assise');
                }
            };
            
            removeAssiseBtn.addEventListener('click', this.handleRemoveAssise);
        } else {
            console.warn('Bouton removeAssise non trouvé dans le DOM');
        }
        
        if (toggleGridsBtn) {
            // CORRECTION: Supprimer les anciens listeners pour àviter les doublons
            if (this.handleToggleGrids) {
                toggleGridsBtn.removeEventListener('click', this.handleToggleGrids);
            }
            
            this.handleToggleGrids = () => {
                // console.log('Bouton Toggle Grilles cliquà');
                this.toggleAssiseGrids();
            };
            
            toggleGridsBtn.addEventListener('click', this.handleToggleGrids);
        } else {
            console.warn('Bouton toggleAssiseGrids non trouvé dans le DOM');
        }

        // Event listener pour les marqueurs d'accroche
        const toggleMarkersBtn = document.getElementById('toggleAttachmentMarkers');
        if (toggleMarkersBtn) {
            // Supprimer l'ancien event listener s'il existe
            if (this.handleToggleMarkers) {
                toggleMarkersBtn.removeEventListener('click', this.handleToggleMarkers);
            }
            
            this.handleToggleMarkers = () => {
                // console.log('Bouton Toggle Marqueurs d\'Accroche cliquà');
                const isEnabled = this.toggleAttachmentMarkers();
                toggleMarkersBtn.textContent = isEnabled ? 'Masquer Marqueurs' : 'Marqueurs d\'Accroche';
                toggleMarkersBtn.className = `btn btn-sm ${isEnabled ? 'btn-warning' : 'btn-info'}`;
            };
            
            toggleMarkersBtn.addEventListener('click', this.handleToggleMarkers);

        // Bouton Copier Assise
        if (copyAssiseBtn) {
            if (this.handleCopyAssise) {
                copyAssiseBtn.removeEventListener('click', this.handleCopyAssise);
            }
            this.handleCopyAssise = () => {
                try {
                    const type = this.currentType;
                    const sourceIndex = this.currentAssiseByType.get(type) || 0;
                    const assisesForType = this.assisesByType.get(type);

                    // Construire une liste lisible des assises existantes
                    const existing = Array.from(assisesForType.keys()).sort((a,b)=>a-b);
                    const targetStr = prompt(`Copier l'assise ${sourceIndex + 1} (${type.toUpperCase()}) vers quelle assise ?\n- Entrez un numéro (1, 2, 3, ...)\n- L'assise sera créée si elle n'existe pas\nAssises existantes: ${existing.map(i=>i+1).join(', ')}`, `${sourceIndex + 2}`);
                    if (targetStr === null) return; // annulé
                    const targetHuman = parseInt(targetStr, 10);
                    if (isNaN(targetHuman) || targetHuman < 1) {
                        alert("Numéro d'assise invalide.");
                        return;
                    }
                    const targetIndex = targetHuman - 1;
                    const result = this.copyAssiseTo(type, sourceIndex, targetIndex, { includeJoints: true });
                    if (result?.copiedCount >= 0) {
                        this.setActiveAssiseForType(type, targetIndex);
                        alert(`Copié ${result.copiedCount} élément(s) de l'assise ${sourceIndex + 1} vers ${targetHuman}.`);
                    }
                } catch (e) {
                    console.error('Erreur copie assise:', e);
                    alert('Erreur lors de la copie de l\'assise. Voir console.');
                }
            };
            copyAssiseBtn.addEventListener('click', this.handleCopyAssise);
        }
            // Mettre à jour le texte initial du bouton
            toggleMarkersBtn.textContent = this.showAttachmentMarkers ? 'Masquer Marqueurs' : 'Marqueurs d\'Accroche';
            toggleMarkersBtn.className = `btn btn-sm ${this.showAttachmentMarkers ? 'btn-warning' : 'btn-info'}`;
        } else {
            console.warn('Bouton toggleAttachmentMarkers non trouvé dans le DOM');
        }
        
        // Configurer les événements pour la vue d'ensemble globale
        this.setupGlobalOverviewEvents();
        
        // Mettre à jour l'interface maintenant que les éléments DOM sont disponibles
        this.updateUI();
        // console.log('? setupUIEventListeners terminà, updateUI() appelà');
    }

    // Copier tout le contenu d'une assise vers une autre (m eame type)
    // options: { includeJoints: boolean }
    copyAssiseTo(type, sourceIndex, targetIndex, options = {}) {
        const includeJoints = options.includeJoints === true; // par défaut on copie aussi les joints horizontaux/verticaux

        if (!this.allSupportedTypes.includes(type)) {
            console.warn(`Type non supporté pour copie: ${type}`);
            return null;
        }

        const assisesForType = this.assisesByType.get(type);
        if (!assisesForType || !assisesForType.has(sourceIndex)) {
            alert(`Assise source ${sourceIndex + 1} inexistante pour le type ${type}`);
            return null;
        }

        // Créer toutes les assises intermédiaires jusqu'à la destination (laissées vides)
        for (let i = 0; i <= targetIndex; i++) {
            if (!assisesForType.has(i)) {
                const created = this.addAssiseForType(type, i);
                // Marquer uniquement les assises inférieures au target comme créées par copie
                if (created && i < targetIndex) {
                    created.createdByCopyIntermediate = true;
                }
            }
        }

        const sourceAssise = assisesForType.get(sourceIndex);
        let copiedCount = 0;

        // Pour stabilité: prendre un snapshot des IDs
        const elementIds = Array.from(sourceAssise.elements);
        for (const elementId of elementIds) {
            const original = window.SceneManager?.elements?.get(elementId);
            if (!original) continue;

            // Filtre joints si nécessaire
            if (!includeJoints && (original.isVerticalJoint || original.isHorizontalJoint || original.type === 'joint')) {
                continue;
            }

            // Créer une nouvelle instance WallElement avec les m eames propriétés
            let newElement;
            try {
                newElement = new WallElement({
                    type: original.type,
                    material: original.material,
                    x: original.position.x,
                    y: original.position.y, // sera réajusté par addElementToAssiseForType
                    z: original.position.z,
                    length: original.dimensions.length,
                    width: original.dimensions.width,
                    height: original.dimensions.height,
                    rotation: original.rotation || 0,
                    blockType: original.blockType,
                    brickType: original.brickType
                });
            } catch (e) {
                console.warn('Impossible de cloner un élément, skip', original, e);
                continue;
            }

            // Marquage joints si c'est un joint
            if (original.isVerticalJoint || original.isHorizontalJoint || original.type === 'joint') {
                newElement.isVerticalJoint = !!original.isVerticalJoint;
                newElement.isHorizontalJoint = !!original.isHorizontalJoint;
                newElement.type = 'joint';
            }

            // Ajouter  e0 la sc e8ne/collection
            console.log('DEBUG ASSISE: Ajout élément à SceneManager:', {
                id: newElement.id,
                type: newElement.type,
                blockType: newElement.blockType,
                brickType: newElement.brickType
            });
            window.SceneManager.elements.set(newElement.id, newElement);
            newElement.mesh.castShadow = true;
            newElement.mesh.receiveShadow = true;
            window.SceneManager.scene.add(newElement.mesh);

            // Ajouter  e0 l'assise de destination avec repositionnement Y correct
            this.addElementToAssiseForType(type, newElement.id, targetIndex);
            copiedCount++;
        }

        this.updateUI();
        document.dispatchEvent(new CustomEvent('assiseElementsChanged', {
            detail: {
                action: 'assiseCopied',
                from: sourceIndex,
                to: targetIndex,
                type: type,
                count: copiedCount
            }
        }));

        // Repositionner/ajuster les joints du type concerné
        if (typeof this.updateVerticalJointsForType === 'function') {
            this.updateVerticalJointsForType(type);
        }

        return { copiedCount };
    }

    reinitializeUIEventListeners() {
        // CORRECTION: Màthode pour ràinitialiser les événements UI sans duplication
        //         this.setupUIEventListeners();
    }

    updateUI() {
        // Mettre à jour le sàlecteur d'assise (pour le type actuel)
        const assiseSelect = document.getElementById('assiseSelect');
        if (assiseSelect) {
            assiseSelect.innerHTML = '';
            
            const assisesForCurrentType = this.assisesByType.get(this.currentType);
            const sortedAssises = Array.from(assisesForCurrentType.keys()).sort((a, b) => a - b);
            const currentAssiseForType = this.currentAssiseByType.get(this.currentType);
            
            for (const index of sortedAssises) {
                const option = document.createElement('option');
                option.value = index;
                const assiseType = this.getAssiseTypeLabelForType(this.currentType, index);
                const height = assisesForCurrentType.get(index).height;
                const optionText = `${assiseType} ${index + 1} (${height.toFixed(1)} cm)`;
                option.textContent = optionText;
                option.selected = (index === currentAssiseForType);
                assiseSelect.appendChild(option);
            }
        }

        // Mettre à jour les onglets de types d'assises
        this.updateTypeTabsUI();
        
        // Mettre à jour l'affichage du joint
        const jointHeightInput = document.getElementById('jointHeight');
        if (jointHeightInput) {
            jointHeightInput.value = this.jointHeight;
            if (this.currentType === 'beam') {
                jointHeightInput.disabled = true;
                jointHeightInput.title = 'Pas de joint pour les poutres';
            } else {
                jointHeightInput.disabled = false;
                jointHeightInput.title = '';
            }
        }
        
        // Mettre à jour les statistiques (pour le type actuel)
        const assiseCountSpan = document.getElementById('assiseCount');
        if (assiseCountSpan) {
            // 🆕 PROTECTION: Vérifier que currentType est valide
            if (!this.currentType || !this.assisesByType || !this.elementsByType) {
                console.warn('⚠️ updateUI: AssiseManager pas complètement initialisé');
                return;
            }
            
            const assisesForCurrentType = this.assisesByType.get(this.currentType);
            const elementsForCurrentType = this.elementsByType.get(this.currentType);
            
            // Vérifier que les collections existent
            if (!assisesForCurrentType || !elementsForCurrentType) {
                console.warn(`⚠️ updateUI: Collections non initialisées pour type ${this.currentType}`);
                return; // Sortir silencieusement si les types ne sont pas initialisés
            }
            
            // Compter les éléments par assise pour le type actuel (sans les joints)
            let totalElements = 0;
            let filledAssises = 0;
            
            for (const [index, assise] of assisesForCurrentType.entries()) {
                const elementCount = this.getNonJointElementCountForType(this.currentType, index);
                totalElements += elementCount;
                if (elementCount > 0) {
                    filledAssises++;
                }
            }
            
            const detailText = totalElements > 0 ? ` (${totalElements} éléments, ${filledAssises} actives)` : ' (vides)';
            const label = (this.currentType === 'beam') ? 'POUTRE' : this.currentType.toUpperCase();
            assiseCountSpan.textContent = `${label}: ${assisesForCurrentType.size} assises${detailText}`;
        }
        
        // Mettre à jour l'état des boutons
        const removeAssiseBtn = document.getElementById('removeAssise');
        if (removeAssiseBtn) {
            // 🆕 PROTECTION: Vérifier avant l'accès
            if (this.currentType && this.assisesByType && this.assisesByType.has(this.currentType)) {
                const assisesForCurrentType = this.assisesByType.get(this.currentType);
                removeAssiseBtn.disabled = (assisesForCurrentType.size <= 1);
            } else {
                removeAssiseBtn.disabled = true; // Désactiver par sécurité
            }
        }
        
        const toggleGridsBtn = document.getElementById('toggleAssiseGrids');
        if (toggleGridsBtn) {
            toggleGridsBtn.textContent = this.showAssiseGrids ? 'Masquer Grilles' : 'Afficher Grilles';
        }
        
        // Mettre à jour les informations sur l'assise active
        const activeAssiseInfo = document.getElementById('activeAssiseInfo');
        if (activeAssiseInfo) {
            const currentAssiseForType = this.currentAssiseByType.get(this.currentType);
            const typeLabel = this.getAssiseTypeLabelForType(this.currentType, currentAssiseForType);
            const description = this.getAssiseDescriptionForType(this.currentType, currentAssiseForType);
            activeAssiseInfo.querySelector('.detail-value').textContent = `${typeLabel} active: ${description}`;
        }

    // Mettre à jour la vue d'ensemble globale
    this.updateGlobalOverview();

    // Rafraîchir la liste globale (inclure immédiatement les nouvelles assises, ex: beam)
    this.updateGlobalAssiseList();

        // Mettre à jour les informations du type actuel
        this.updateCurrentTypeInfo();
        
        // NOUVEAU: Mettre à jour la hauteur du point de suivi après toute modification
        this.updateSnapPointHeight();
    }

    // === NOUVELLES MÉTHODES POUR LA VUE D'ENSEMBLE GLOBALE ===

    // Mettre à jour la vue d'ensemble globale
    updateGlobalOverview() {
        this.updateOverviewStats();
        this.updateGlobalAssiseList();
    }

    // Mettre à jour les statistiques globales
    updateOverviewStats() {
        let totalAssises = 0;
        let totalElements = 0;
        let totalHeight = 0;

        // Parcourir tous les types pour calculer les totaux
        for (const type of this.allSupportedTypes) {
            const assisesForType = this.assisesByType.get(type);
            if (assisesForType && assisesForType.size > 0) {
                totalAssises += assisesForType.size;
                
                // Calculer la hauteur totale pour ce type
                for (const [index, assise] of assisesForType.entries()) {
                    totalElements += assise.elements.size;
                    totalHeight += assise.height + this.getJointHeightForAssise(type, index);
                }
            }
        }

        // Mettre à jour l'affichage
        const totalAssisesCount = document.getElementById('totalAssisesCount');
        if (totalAssisesCount) {
            totalAssisesCount.textContent = totalAssises;
        }

        const totalElementsCount = document.getElementById('totalElementsCount');
        if (totalElementsCount) {
            totalElementsCount.textContent = totalElements;
        }

        const totalHeightValue = document.getElementById('totalHeightValue');
        if (totalHeightValue) {
            totalHeightValue.textContent = `${totalHeight.toFixed(1)} cm`;
        }
    }

    // Mettre à jour la liste globale des assises
    updateGlobalAssiseList() {
        const globalAssiseList = document.getElementById('globalAssiseList');
        if (!globalAssiseList) return;

    // Collecter toutes les assises de tous les types
    // Règle demandée: on n'affiche toutes les assises (y compris vides) d'un type
    // QUE si sa première assise (index 0) est remplie.
    // Sinon, on affiche uniquement les assises ayant des éléments (ou marquées createdByCopyIntermediate)
        const allAssises = [];
        for (const type of this.allSupportedTypes) {
            const assisesForType = this.assisesByType.get(type);
            if (!assisesForType || assisesForType.size === 0) continue;

            // Déterminer l'index maximum existant pour ce type
            const maxIndex = Math.max(...Array.from(assisesForType.keys()));

            for (let index = 0; index <= maxIndex; index++) {
                const assise = assisesForType.get(index) || null;
                if (!assise) continue; // Assise non créée
                const elementCount = this.getNonJointElementCountForType(type, index);

                // Vérifier si la première assise est remplie
                const firstAssiseFilled = this.getNonJointElementCountForType(type, 0) > 0;

                // Si la première n'est pas remplie, on filtre les vides (sauf intermédiaires copiées)
                if (!firstAssiseFilled) {
                    const show = elementCount > 0 || assise.createdByCopyIntermediate === true;
                    if (!show) continue;
                }

                allAssises.push({
                    type,
                    index,
                    assise,
                    height: this.getMaxElementHeightInAssiseForType(type, index),
                    elementCount,
                    isActive: (type === this.currentType && index === this.currentAssiseByType.get(type)),
                    jointHeight: this.getJointHeightForAssise(type, index)
                });
            }
        }

        // Trier par type puis par index
        allAssises.sort((a, b) => {
            if (a.type !== b.type) {
                return this.allSupportedTypes.indexOf(a.type) - this.allSupportedTypes.indexOf(b.type);
            }
            return a.index - b.index;
        });

        // Gànàrer le HTML
        globalAssiseList.innerHTML = '';

        if (allAssises.length === 0) {
            globalAssiseList.innerHTML = '<div class="empty-list">Aucune assise remplie</div>';
            return;
        }

        allAssises.forEach(({ type, index, assise, height, elementCount, isActive, jointHeight }) => {
            const item = document.createElement('div');
            item.className = `global-assise-item ${isActive ? 'active' : ''}`;
            item.dataset.type = type;
            item.dataset.index = index;

            const flags = [];
            if (isActive) flags.push('<span class="assise-flag active">ACTIVE</span>');
            flags.push(elementCount > 0 ? 
                '<span class="assise-flag filled">REMPLIE</span>' : 
                '<span class="assise-flag empty">VIDE</span>'
            );

            const typeLabel = (type === 'beam') ? 'POUTRE' : this.getAssiseTypeLabelForType(type, index).toUpperCase();
            item.innerHTML = `
                <div class="assise-item-info">
                    <span class="assise-type-badge ${type}">${typeLabel}</span>
                    <div class="assise-item-details">
                        <div>Assise ${index + 1}</div>
                        <div>${elementCount} &eacute;l&eacute;ment${elementCount !== 1 ? 's' : ''}</div>
                    </div>
                </div>
                <div class="assise-item-height">${jointHeight.toFixed(1)} + ${height.toFixed(1)}cm</div>
                <div class="assise-item-flags">${flags.join('')}</div>
            `;

            // Ajouter l'événement de clic pour naviguer vers l'assise
            item.addEventListener('click', (e) => {
                this.navigateToAssise(type, index);
            });

            globalAssiseList.appendChild(item);
        });
    }

    // Naviguer vers une assise spécifique
    navigateToAssise(type, index) {
        console.log(`🔧 Navigation vers l'assise ${index + 1} du type ${type}`);
        
        // Changer le type actuel si nàcessaire
        if (type !== this.currentType) {
            console.log(`🔄 Changement de type: ${this.currentType} → ${type}`);
            this.setCurrentType(type);
            
            // 🆕 NOUVEAU: Sélectionner automatiquement l'objet de base (1/1) pour ce type d'assise
            this.selectDefaultObjectForType(type);
            
            // Attendre un peu pour que les changements s'appliquent
            setTimeout(() => {
                // Forcer la mise à jour du fantôme après le changement de type
                if (window.ConstructionTools && window.ConstructionTools.updateGhostElement) {
                    console.log(`👻 Mise à jour forcée du fantôme`);
                    window.ConstructionTools.updateGhostElement();
                }
            }, 100);
        }

        // S'assurer que toutes les assises jusqu'à l'index demandé existent (création à la volée)
        const assisesForType = this.assisesByType.get(type);
        if (assisesForType) {
            for (let i = 0; i <= index; i++) {
                if (!assisesForType.has(i)) {
                    this.addAssiseForType(type, i);
                }
            }
        }

        // Changer l'assise active pour ce type
        this.setActiveAssiseForType(type, index);
        
        // Mettre à jour l'interface
        this.updateUI();
        
        // DÉSACTIVÉ: Ne plus centrer automatiquement la vue pour éviter de changer l'angle de la caméra
        // this.focusOnAssise(type, index);
    }

    // Centrer la vue sur une assise spécifique (optionnel)
    focusOnAssise(type, index) {
        const assisesForType = this.assisesByType.get(type);
        const assise = assisesForType.get(index);
        
        if (assise && assise.gridMesh && window.SceneManager?.camera && window.SceneManager?.controls) {
            const position = assise.gridMesh.position;
            const camera = window.SceneManager.camera;
            const controls = window.SceneManager.controls;
            
            // Animer la camàra vers l'assise
            const targetPosition = {
                x: position.x,
                y: position.y + 50,
                z: position.z + 30
            };
            
            // Simple transition - peut àtre amàlioràe avec une animation fluide
            camera.position.set(targetPosition.x, targetPosition.y, targetPosition.z);
            camera.lookAt(position.x, position.y, position.z);
            controls.target.set(position.x, position.y, position.z);
            controls.update();
        }
    }

    // Mettre à jour les informations du type actuel
    updateCurrentTypeInfo() {
        const currentTypeBadge = document.getElementById('currentTypeBadge');
        const currentTypeDescription = document.getElementById('currentTypeDescription');
        // Global overview header (au-dessus de la liste)
        const currentTypeBadgeGlobal = document.getElementById('currentTypeBadgeGlobal');
        const currentTypeDescriptionGlobal = document.getElementById('currentTypeDescriptionGlobal');
        
        if (currentTypeBadge) {
            const displayType = (this.currentType === 'beam') ? 'POUTRE' : this.currentType.toUpperCase();
            currentTypeBadge.textContent = displayType;
            currentTypeBadge.className = `type-badge ${this.currentType}`;
        }
        if (currentTypeBadgeGlobal) {
            const displayType = (this.currentType === 'beam') ? 'POUTRE' : this.currentType.toUpperCase();
            currentTypeBadgeGlobal.textContent = displayType;
            currentTypeBadgeGlobal.className = `type-badge ${this.currentType}`;
        }
        
    if (currentTypeDescription || currentTypeDescriptionGlobal) {
            const typeNames = {
                'M65': 'Briques 6.5cm',
                'M50': 'Briques 5.0cm',
                'M57': 'Briques 5.7cm',
                'M60': 'Briques 6.0cm',  
                'M90': 'Briques 9.0cm',
        'block': 'Blocs béton',
                'insulation': 'Isolation'
            };
            
            const assisesForType = this.assisesByType.get(this.currentType);
            const currentAssiseIndex = this.currentAssiseByType.get(this.currentType);
            const description = typeNames[this.currentType] || this.currentType;

        const text = `${description} - Assise ${currentAssiseIndex + 1} active (${assisesForType.size} total)`;
        if (currentTypeDescription) currentTypeDescription.textContent = text;
        if (currentTypeDescriptionGlobal) currentTypeDescriptionGlobal.textContent = text;
        }
    }

    // Configurer les événements pour la vue d'ensemble globale
    setupGlobalOverviewEvents() {
        // Toggle pour masquer/afficher la liste globale
        const toggleGlobalList = document.getElementById('toggleGlobalList');
        if (toggleGlobalList) {
            toggleGlobalList.addEventListener('click', () => {
                const listContent = document.getElementById('globalAssiseList');
                if (listContent) {
                    const isHidden = listContent.style.display === 'none';
                    listContent.style.display = isHidden ? 'block' : 'none';
                    toggleGlobalList.textContent = isHidden ? 'Masquer' : 'Afficher';
                }
            });
        }
    }

    // Mise à jour de la màthode updateUI principale
    updateUIComplete() {
        this.updateUI();
        this.updateGlobalOverview();
        this.updateCurrentTypeInfo();
    }

    // Mettre à jour l'interface des onglets de types
    updateTypeTabsUI() {
        // Mettre à jour les onglets si ils existent
        document.querySelectorAll('.type-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.type === this.currentType) {
                tab.classList.add('active');
            }
        });

        // Mettre à jour les compteurs par type
        for (const type of this.supportedTypes) {
            const tab = document.querySelector(`.type-tab[data-type="${type}"]`);
            if (tab) {
                const countSpan = tab.querySelector('.tab-count');
                if (countSpan) {
                    const assisesForType = this.assisesByType.get(type);
                    countSpan.textContent = assisesForType.size;
                }
            }
        }
        
        // Configurer les événements des onglets si pas encore fait
        this.setupTypeTabEvents();
    }

    // Configurer les événements pour les onglets de types
    setupTypeTabEvents() {
        // àviter de cràer des listeners multiples
        if (this.typeTabEventsSetup) return;
        this.typeTabEventsSetup = true;
        
        document.querySelectorAll('.type-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                if (type && this.allSupportedTypes.includes(type)) {
                    this.setCurrentType(type);
                }
            });
        });
    }

    // Màthodes pour la sauvegarde/chargement - Version Multi-Types
    exportData() {
        const data = {
            assisesByType: {},
            currentType: this.currentType,
            currentAssiseByType: Object.fromEntries(this.currentAssiseByType),
            jointHeightByType: Object.fromEntries(this.jointHeightByType),
            showAssiseGrids: this.showAssiseGrids
        };

        // Exporter les assises pour chaque type
        for (const type of this.supportedTypes) {
            const assisesForType = this.assisesByType.get(type);
            data.assisesByType[type] = Array.from(assisesForType.entries()).map(([index, assise]) => ({
                index,
                height: assise.height,
                elements: Array.from(assise.elements)
            }));
        }

        return data;
    }

    importData(data) {
    // Logs supprimés: import data appelé & trace
        
        // Nettoyer l'àtat actuel
        this.clear();
        
        // Restaurer les hauteurs de joint par type
        if (data.jointHeightByType) {
            // Nouvelle structure: hauteurs par type
            for (const [type, height] of Object.entries(data.jointHeightByType)) {
                this.jointHeightByType.set(type, height);
            }
        } else {
            // Ancienne structure: hauteur globale - appliquer à tous les types
            const globalHeight = data.jointHeight || 1.2;
            for (const type of this.allSupportedTypes) {
                this.jointHeightByType.set(type, globalHeight);
            }
        }
        
        this.showAssiseGrids = data.showAssiseGrids !== undefined ? data.showAssiseGrids : false;
        this.currentType = data.currentType || 'brick';

        // Restaurer les assises active par type
        if (data.currentAssiseByType) {
            for (const [type, assiseIndex] of Object.entries(data.currentAssiseByType)) {
                this.currentAssiseByType.set(type, assiseIndex);
            }
        }

        // Restaurer les assises pour chaque type
        if (data.assisesByType) {
            for (const [type, assisesData] of Object.entries(data.assisesByType)) {
                if (this.allSupportedTypes.includes(type)) {
                    for (const assiseData of assisesData) {
                        const assise = this.addAssiseForType(type, assiseData.index);
                        if (assise) {
                            for (const elementId of assiseData.elements || []) {
                                assise.elements.add(elementId);
                                const elementsForType = this.elementsByType.get(type);
                                elementsForType.get(assiseData.index).add(elementId);
                            }
                        }
                    }
                }
            }
        }

        // Restaurer l'assise active pour le type actuel
        const currentAssiseIndex = this.currentAssiseByType.get(this.currentType) || 0;
        this.setActiveAssiseForType(this.currentType, currentAssiseIndex);
        
        // Recràer le point d'accrochage si nàcessaire
        if (!this.snapPoint) {
            this.createSnapPoint();
        }
        
        this.updateUI();
    // Log supprimé: données importées
    }

    clear() {
        // Supprimer toutes les grilles pour tous les types
        for (const type of this.allSupportedTypes) {
            const assisesForType = this.assisesByType.get(type);
            if (assisesForType) {
                for (const index of assisesForType.keys()) {
                    this.removeAssiseGridForType(type, index);
                }
            }
        }
        
        // Supprimer les marqueurs d'accroche
        this.clearAttachmentMarkers();
        
        // Supprimer le point d'accrochage
        if (this.snapPoint) {
            window.SceneManager.scene.remove(this.snapPoint);
            this.snapPoint = null;
        }
        
        // Vider les collections pour tous les types
    // Logs supprimés: vidage complet des assises & trace
        
        for (const type of this.allSupportedTypes) {
            this.assisesByType.get(type).clear();
            this.elementsByType.get(type).clear();
            this.gridHelpersByType.get(type).clear();
        }
        
        // Ràinitialiser les assises courantes
        for (const type of this.allSupportedTypes) {
            this.currentAssiseByType.set(type, 0);
        }
        
        // Recràer les assises par défaut pour tous les types et le point d'accrochage
        this.createDefaultAssises();
        this.createSnapPoint();
        
    // Log supprimé: assises multi-types réinitialisées
    }

    // Alias pour clartà dans les tests
    clearAllAssises() {
        this.clear();
    }

    /**
     * Vérifie si deux types sont compatibles (même type de base)
     * Ex: M65 et M65_CUSTOM_16 sont compatibles
     */
    areTypesCompatible(type1, type2) {
        if (type1 === type2) return true;
        
        // Extraire le type de base pour les deux types
        const getBaseType = (type) => {
            if (type.includes('_CUSTOM_')) {
                return type.split('_CUSTOM_')[0];
            }
            if (type.endsWith('_P')) {
                return type.slice(0, -2);
            }
            if (type.includes('_')) {
                const cutSuffixes = ['_3Q', '_HALF', '_1Q'];
                for (const suffix of cutSuffixes) {
                    if (type.endsWith(suffix)) {
                        return type.replace(suffix, '');
                    }
                }
            }
            return type;
        };
        
        return getBaseType(type1) === getBaseType(type2);
    }

    updateAllGridVisibility() {
        // Mettre à jour la visibilità pour tous les types (incluant les sous-types de briques)
        for (const type of this.allSupportedTypes) {
            const gridHelpersForType = this.gridHelpersByType.get(type);
            if (!gridHelpersForType) continue;
            
            const currentAssiseForType = this.currentAssiseByType.get(type);
            
            for (const [index, grids] of gridHelpersForType.entries()) {
                // 🔧 CORRECTION: Toujours afficher la grille de l'assise active même avec des blocs personnalisés
                const isCurrentAssise = (index === currentAssiseForType);
                const isCompatibleType = this.areTypesCompatible(type, this.currentType);
                const isActiveForCurrentType = isCompatibleType && isCurrentAssise;
                
                // Afficher la grille si compatible OU si c'est l'assise active du type actuel
                const shouldShowGrid = this.showAssiseGrids && (isActiveForCurrentType || (type === this.currentType && isCurrentAssise));
                grids.main.visible = shouldShowGrid;
                
                // Masquer complètement tous les plans supérieurs
                grids.joint.visible = false;
            }
        }
        
        // Mettre à jour la visibilità du point d'accrochage
        if (this.snapPoint) {
            this.snapPoint.visible = this.showAssiseGrids && this.showSnapPoint;
        }
    }

    createSnapPoint() {
        // SUPPRESSION DU POINT D'ACCROCHAGE VISIBLE SUR LA BRIQUE FANTOME
        // Point d'accrochage dàsactivà pour àviter la confusion visuelle
        if (this.snapPoint) {
            // Supprimer l'ancien point d'accrochage s'il existe
            window.SceneManager.scene.remove(this.snapPoint);
            this.snapPoint = null;
        }
        
        // Point d'accrochage dàsactivà - plus de cràation de sphàre orange
        return;
        
        // Cràer une petite sphàre orange pour le point d'accrochage
        const geometry = new THREE.SphereGeometry(0.3, 8, 6);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff6600, // Orange
            transparent: true,
            opacity: 0.8
        });
        
        this.snapPoint = new THREE.Mesh(geometry, material);
        this.snapPoint.visible = this.showSnapPoint;
        
        // IDENTIFICATION POUR EXPORT PDF : Marquer le point d'accrochage unique comme élément à masquer
        this.snapPoint.userData.isAssiseProjectionMarker = true;
        this.snapPoint.userData.assiseProjectionType = 'dynamic_snap_point';
        this.snapPoint.userData.isDynamicSnapPoint = true;
        this.snapPoint.userData.currentType = this.currentType;
        this.snapPoint.name = `AssiseProjection_DynamicSnapPoint_${this.currentType}`;
        
        // Positionner le point d'accrochage à la hauteur de l'assise active
        this.updateSnapPointHeight();
        
        // Ajouter à la scène
        window.SceneManager.scene.add(this.snapPoint);
        
        return this.snapPoint;
    }

    updateSnapPointPosition(x, z) {
        if (!this.snapPoint) return;
        
        // Aligner sur la grille de 1cm x 1cm
        const gridSize = 1; // 1cm
        const snappedX = Math.round(x / gridSize) * gridSize;
        const snappedZ = Math.round(z / gridSize) * gridSize;
        
        this.snapPoint.position.x = snappedX;
        this.snapPoint.position.z = snappedZ;
    }

    // Fonction publique pour calculer les coordonnées d'accrochage à la grille d'assise
    snapToAssiseGrid(x, z) {
        // Vàrifier si nous avons une grille active pour le type actuel
        const currentAssiseIndex = this.currentAssiseByType.get(this.currentType);
        const gridHelpersForType = this.gridHelpersByType.get(this.currentType);
        
        if (gridHelpersForType && gridHelpersForType.has(currentAssiseIndex)) {
            const grids = gridHelpersForType.get(currentAssiseIndex);
            if (grids && grids.main) {
                // Utiliser la grille ràelle de l'AssiseManager pour l'accrochage
                // GridHelper de Three.js utilise size et divisions
                // La grille va de -size/2 à +size/2 avec 'divisions' lignes
                const gridSize = this.calculateDynamicGridSize();
                const divisions = gridSize;
                const gridSpacing = gridSize / divisions; // Espacement entre les lignes = 1cm
                
                // Accrochage basà sur l'espacement ràel de la grille
                const snappedX = Math.round(x / gridSpacing) * gridSpacing;
                const snappedZ = Math.round(z / gridSpacing) * gridSpacing;
                
                return { x: snappedX, z: snappedZ };
            }
        }
        
        // Fallback : accrochage générique 1cm x 1cm si pas de grille disponible
        const fallbackGridSize = 1; // 1cm
        const snappedX = Math.round(x / fallbackGridSize) * fallbackGridSize;
        const snappedZ = Math.round(z / fallbackGridSize) * fallbackGridSize;
        
        return { x: snappedX, z: snappedZ };
    }

    // Obtenir la hauteur de l'assise active pour le type actuel
    getCurrentAssiseHeight() {
        const currentAssiseIndex = this.currentAssiseByType.get(this.currentType);
        return this.getAssiseHeight(currentAssiseIndex);
    }

    updateSnapPointHeight() {
        if (!this.snapPoint) return;
        
        const currentAssiseForType = this.currentAssiseByType.get(this.currentType);
        const assisesForType = this.assisesByType.get(this.currentType);
        const assise = assisesForType.get(currentAssiseForType);
        if (assise) {
            // Positionner làgàrement au-dessus de la grille de l'assise
            this.snapPoint.position.y = assise.height + 0.5;
        }
        
        // Forcer la mise à jour des marqueurs d'accroche pour qu'ils suivent la nouvelle hauteur
        this.updateAttachmentMarkers();
    }

    toggleSnapPoint() {
        this.showSnapPoint = !this.showSnapPoint;
        if (this.snapPoint) {
            this.snapPoint.visible = this.showSnapPoint;
        }
    }

    // Cràer les marqueurs d'accroche pour les éléments des assises infàrieures
    createAttachmentMarkers(activeAssiseIndex = null) {
    // Log supprimé: début création marqueurs
        
        // Nettoyer les marqueurs existants
        this.clearAttachmentMarkers();
        
        if (activeAssiseIndex === null) {
            activeAssiseIndex = this.currentAssiseByType.get(this.currentType);
        }
        
    // Log supprimé: assise active
        
        // Cràer des marqueurs pour les éléments de l'assise immàdiatement infàrieure uniquement
        const elementsForType = this.elementsByType.get(this.currentType);
        const previousAssiseIndex = activeAssiseIndex - 1;
        
    // Log supprimé: assise précédente à analyser
        
        // Ne montrer que les points de l'assise directement en dessous (pas toutes les assises infàrieures)
        if (previousAssiseIndex >= 0) {
            const elementsInPreviousAssise = elementsForType.get(previousAssiseIndex);
            // Logs supprimés: nombre et liste des éléments dans assise précédente
            
            if (elementsInPreviousAssise) {
                let markerCount = 0;
                elementsInPreviousAssise.forEach(elementId => {
                    const element = window.SceneManager.elements.get(elementId);
                    // Log supprimé: traitement élément
                    if (element) {
                        // Log supprimé: type & position élément
                        
                        // 🔧 NOUVEAUTÉ: Vérifier si c'est un joint orphelin (sans brique associée)
                        if (element.type === 'joint') {
                            const hasAssociatedBrick = this.hasAssociatedBrick(elementId, previousAssiseIndex, this.currentType);
                            if (!hasAssociatedBrick) {
                                // Log supprimé: joint orphelin ignoré
                                return; // Ignorer ce joint orphelin
                            }
                        }
                        
                        this.createMarkerForElement(element, activeAssiseIndex);
                        markerCount++;
                    }
                });
                // Log supprimé: total marqueurs créés
            }
        } else {
            // Log supprimé: aucune assise précédente
        }
        
        // 🔧 NOUVEAUTà: Ajouter des marqueurs pour les joints verticaux des assises infàrieures
        this.createJointAttachmentMarkers(activeAssiseIndex);
        
    // Log supprimé: fin création marqueurs
    }

    // Cràer des marqueurs d'accroche pour les joints verticaux de l'assise immàdiatement infàrieure
    createJointAttachmentMarkers(activeAssiseIndex) {
    // Log supprimé: début création marqueurs joints
        
        if (!window.SceneManager || !window.SceneManager.elements) {
            // Log supprimé: SceneManager non disponible
            return;
        }
        
        // Collecter les joints verticaux de l'assise immàdiatement infàrieure uniquement
        const verticalJoints = [];
        const previousAssiseIndex = activeAssiseIndex - 1;
        
    // Log supprimé: recherche joints
        
        // Ne traiter que l'assise directement en dessous
        if (previousAssiseIndex >= 0) {
            // Parcourir tous les éléments pour trouver les joints verticaux
            let jointCount = 0;
            for (const [elementId, element] of window.SceneManager.elements.entries()) {
                if (element.isVerticalJoint && element.type === 'joint') {
                    // Log supprimé: joint vertical trouvé
                    const jointAssiseInfo = this.getElementAssiseAndType(elementId);
                    
                    // Log supprimé: info assise joint
                    
                    // Vàrifier si le joint est dans l'assise immàdiatement infàrieure du type actuel
                    if (jointAssiseInfo && 
                        jointAssiseInfo.type === this.currentType && 
                        jointAssiseInfo.assiseIndex === previousAssiseIndex) {
                        
                        // Log supprimé: joint ajouté aux marqueurs
                        verticalJoints.push({
                            element: element,
                            assiseIndex: jointAssiseInfo.assiseIndex
                        });
                        jointCount++;
                    } else {
                        // Log supprimé: joint ignoré
                    }
                }
            }
            // Log supprimé: nombre joints verticaux trouvés
        } else {
            // Log supprimé: aucune assise précédente pour joints
        }
        
        // console.log(`🔧 Joints verticaux trouvés pour marqueurs (assise ${previousAssiseIndex} uniquement): ${verticalJoints.length}`);
        
        // Collecter les positions des briques existantes pour àviter les conflits
        const existingBrickPositions = this.getExistingBrickPositionsInPreviousAssise(activeAssiseIndex);
        
        // Cràer des marqueurs pour chaque joint vertical
        let jointMarkersCreated = 0;
        verticalJoints.forEach(jointInfo => {
            // Log supprimé: création marqueur pour joint
            this.createJointMarkerForElement(jointInfo.element, activeAssiseIndex, existingBrickPositions);
            jointMarkersCreated++;
        });
        
        // Logs supprimés: total marqueurs joints & fin création
    }

    // Obtenir les positions des briques existantes dans l'assise immàdiatement infàrieure
    getExistingBrickPositionsInPreviousAssise(activeAssiseIndex) {
        const positions = [];
        const elementsForType = this.elementsByType.get(this.currentType);
        const previousAssiseIndex = activeAssiseIndex - 1;
        
        // Ne traiter que l'assise immàdiatement infàrieure
        if (previousAssiseIndex >= 0) {
            const elementsInPreviousAssise = elementsForType.get(previousAssiseIndex);
            if (elementsInPreviousAssise) {
                elementsInPreviousAssise.forEach(elementId => {
                    const element = window.SceneManager.elements.get(elementId);
                    if (element && element.position) {
                        positions.push({
                            x: element.position.x,
                            z: element.position.z,
                            elementId: elementId
                        });
                    }
                });
            }
        }
        
        return positions;
    }

    // ANCIENNE MàTHODE - Conservàe pour compatibilité si utilisée ailleurs
    // Obtenir les positions des briques existantes dans les assises infàrieures
    getExistingBrickPositionsInAssises(maxAssiseIndex) {
        const positions = [];
        const elementsForType = this.elementsByType.get(this.currentType);
        
        for (let assiseIndex = 0; assiseIndex < maxAssiseIndex; assiseIndex++) {
            const elementsInAssise = elementsForType.get(assiseIndex);
            if (!elementsInAssise) continue;
            
            elementsInAssise.forEach(elementId => {
                const element = window.SceneManager.elements.get(elementId);
                if (element && (element.type === 'brick' || element.type === 'block' || element.type === 'insulation')) {
                    positions.push({
                        x: element.position.x,
                        z: element.position.z,
                        length: element.dimensions.length,
                        width: element.dimensions.width,
                        rotation: element.rotation,
                        assiseIndex: assiseIndex
                    });
                }
            });
        }
        
        return positions;
    }

    // Cràer un marqueur d'accroche pour un joint vertical
    createJointMarkerForElement(joint, targetAssiseIndex, existingBrickPositions) {
        const currentAssiseForType = this.currentAssiseByType.get(this.currentType);
        const assisesForType = this.assisesByType.get(this.currentType);
        const assise = assisesForType.get(currentAssiseForType);
        if (!assise) return;
        
        // Calculer la position du marqueur sur la grille de l'assise active
        const markerY = assise.height;
        
        // Position du joint projetàe sur l'assise supàrieure
        const jointX = joint.position.x;
        const jointZ = joint.position.z;
        
        // Vàrifier s'il y a déjà une brique à cette position (àviter les conflits)
        const hasConflict = existingBrickPositions.some(brickPos => {
            const distance = Math.sqrt(
                Math.pow(brickPos.x - jointX, 2) + 
                Math.pow(brickPos.z - jointZ, 2)
            );
            return distance < 5; // Seuil de 5cm pour àviter les conflits
        });
        
        if (hasConflict) {
            // console.log(`🔧 Joint vertical ${joint.id} ignoré - conflit avec brique existante`);
            return;
        }
        
        // Cràer un marqueur linàaire pour le joint vertical
        const jointMarkerGeometry = new THREE.PlaneGeometry(joint.dimensions.width, 1); // 1cm de large
        const jointMarkerMaterial = new THREE.MeshBasicMaterial({
            color: 0x8e44ad, // Violet pour distinguer des briques
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        const jointMarker = new THREE.Mesh(jointMarkerGeometry, jointMarkerMaterial);
        jointMarker.position.set(jointX, markerY + 0.05, jointZ);
        jointMarker.rotation.x = -Math.PI / 2; // Horizontal
        jointMarker.rotation.z = joint.rotation; // Màme rotation que le joint
        
        // Cràer les contours du joint
        const jointEdges = new THREE.EdgesGeometry(jointMarkerGeometry);
        const jointLineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x8e44ad,
            linewidth: 3
        });
        const jointWireframe = new THREE.LineSegments(jointEdges, jointLineMaterial);
        jointWireframe.position.copy(jointMarker.position);
        jointWireframe.rotation.copy(jointMarker.rotation);
        
        // Cràer un groupe pour le marqueur de joint
        const jointMarkerGroup = new THREE.Group();
        jointMarkerGroup.add(jointMarker);
        jointMarkerGroup.add(jointWireframe);
        
        // Ajouter des points d'accroche spécifiques pour le joint
        this.addJointAttachmentPoints(joint, jointMarkerGroup, markerY, jointX, jointZ);
        
        // Ajouter à la scène et au tracking
        window.SceneManager.scene.add(jointMarkerGroup);
        
        const activeAssiseForType = this.currentAssiseByType.get(this.currentType);
        if (!this.attachmentMarkers.has(activeAssiseForType)) {
            this.attachmentMarkers.set(activeAssiseForType, []);
        }
        this.attachmentMarkers.get(activeAssiseForType).push({
            group: jointMarkerGroup,
            elementId: joint.id,
            sourceAssise: this.getElementAssise(joint.id),
            isJoint: true
        });
        
        // console.log(`🔧 Marqueur de joint vertical cr\ pour ${joint.id} à (${jointX}, ${jointZ})`);
    }

    // Ajouter des points d'accroche spécifiques pour les joints verticaux
    addJointAttachmentPoints(joint, parentGroup, markerY, markerX, markerZ) {
        const halfWidth = joint.dimensions.width / 2;
        
        // Points d'accroche pour joint vertical : extràmitàs + centre
        const jointAttachmentPoints = [
            { x: 0, z: -halfWidth, type: 'joint-start', description: 'Dàbut du joint' },
            { x: 0, z: 0, type: 'joint-center', description: 'Centre du joint' },
            { x: 0, z: halfWidth, type: 'joint-end', description: 'Fin du joint' }
        ];
        
        jointAttachmentPoints.forEach(point => {
            const pointGeometry = new THREE.SphereGeometry(0.4, 8, 6);
            const pointMaterial = new THREE.MeshBasicMaterial({
                color: 0x9b59b6, // Violet clair pour les points de joint
                transparent: true,
                opacity: 0.8
            });
            
            const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
            
            // Position relative au marqueur de joint, avec rotation
            const cos = Math.cos(joint.rotation);
            const sin = Math.sin(joint.rotation);
            const rotatedX = point.x * cos - point.z * sin;
            const rotatedZ = point.x * sin + point.z * cos;
            
            pointMesh.position.set(
                markerX + rotatedX,
                markerY + 0.25,
                markerZ + rotatedZ
            );
            
            // Màtadonnées pour l'animation et l'interaction
            pointMesh.userData = {
                type: point.type,
                description: point.description,
                isSnapPoint: true,
                isJointPoint: true,
                originalColor: 0x9b59b6,
                originalOpacity: 0.8,
                originalScale: { x: 1, y: 1, z: 1 },
                isHovered: false,
                pulsePhase: Math.random() * Math.PI * 2,
                // IDENTIFICATION COMPLàTE POUR EXPORT PDF : Points de joints verticaux
                isAssiseProjectionMarker: true,
                assiseProjectionType: 'joint_snap_point',
                sourceElementId: joint.id,
                targetAssise: this.currentAssiseByType.get(this.currentType),
                // NOUVELLES IDENTIFICATIONS SPàCIFIQUES POUR JOINTS
                isProjectedAttachmentPoint: true,
                projectionSource: 'lower_assise_joint',
                markerCategory: 'joint_attachment_point',
                shouldHideInPDF: true,
                elementType: 'joint',
                currentType: this.currentType,
                sourceAssiseIndex: this.getElementAssise(joint.id),
                isJointVerticalPoint: true
            };
            
            // IDENTIFICATION POUR EXPORT PDF : Nom unique pour les points de joint
            pointMesh.name = `AssiseProjection_JointPoint_${joint.id}_${point.type}_Assise${this.currentAssiseByType.get(this.currentType)}`;
            
            // Effet de halo pour les points de joint
            const haloGeometry = new THREE.SphereGeometry(0.7, 8, 6);
            const haloMaterial = new THREE.MeshBasicMaterial({
                color: 0x9b59b6,
                transparent: true,
                opacity: 0.15,
                depthWrite: false
            });
            const haloMesh = new THREE.Mesh(haloGeometry, haloMaterial);
            haloMesh.position.copy(pointMesh.position);
            haloMesh.userData = {
                isHalo: true,
                parentPoint: pointMesh,
                originalOpacity: 0.15,
                // IDENTIFICATION COMPLàTE POUR EXPORT PDF : Halo de points de joints
                isAssiseProjectionMarker: true,
                assiseProjectionType: 'joint_snap_halo',
                sourceElementId: joint.id,
                targetAssise: this.currentAssiseByType.get(this.currentType),
                // NOUVELLES IDENTIFICATIONS SPàCIFIQUES POUR HALO DE JOINT
                isProjectedAttachmentPoint: true,
                projectionSource: 'lower_assise_joint',
                markerCategory: 'joint_attachment_halo',
                shouldHideInPDF: true,
                elementType: 'joint',
                currentType: this.currentType,
                sourceAssiseIndex: this.getElementAssise(joint.id),
                isJointVerticalPoint: true,
                isHaloElement: true
            };
            
            // IDENTIFICATION POUR EXPORT PDF : Nom unique pour le halo de joint
            haloMesh.name = `AssiseProjection_JointHalo_${joint.id}_${point.type}_Assise${this.currentAssiseByType.get(this.currentType)}`;
            
            parentGroup.add(haloMesh);
            pointMesh.userData.halo = haloMesh;
            
            // Ajouter au groupe parent
            parentGroup.add(pointMesh);
        });
        
        // console.log(`🔧 Points d'accroche de joint cr\s pour ${joint.id}: ${jointAttachmentPoints.length} points`);
    }

    // Dàtecter si un élément est un bloc creux
    isHollowBlock(element) {
        // Vàrifier d'abord si l'élément a un ID contenant B suivi d'un chiffre (B9, B14, B19, B29)
        if (element.id && /^B\d+/.test(element.id)) {
            return true;
        }
        
        // Vàrifier les dimensions caractàristiques des blocs creux (39cm ou dàrivàs)
        const length = element.dimensions.length;
        const height = element.dimensions.height;
        
        // Blocs creux standards: 39cm (entier), 29cm (3/4), 19cm (1/2), 9cm (1/4)
        // Hauteur typique: 19cm
        if (height === 19 && (length === 39 || length === 29 || length === 19 || length === 9)) {
            return true;
        }
        
        // Vàrifier via les types de blocs si disponibles
        if (window.BlockSelector && window.BlockSelector.blockTypes) {
            for (const [blockId, blockInfo] of Object.entries(window.BlockSelector.blockTypes)) {
                if (blockInfo.category === 'hollow' || 
                    (blockInfo.category === 'cut' && !blockId.startsWith('BC_') && !blockId.startsWith('BCA_') && 
                     !blockId.startsWith('ARGEX_') && !blockId.startsWith('TC_'))) {
                    if (element.dimensions.length === blockInfo.length && 
                        element.dimensions.width === blockInfo.width && 
                        element.dimensions.height === blockInfo.height) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    // Dàtecter le type de coupe d'un élément
    getElementCutType(element) {
        // Vàrifier d'abord si l'ID contient des suffixes de coupe
        if (element.id) {
            if (element.id.includes('_3Q')) {
                return '3/4';
            } else if (element.id.includes('_HALF')) {
                return '1/2';
            } else if (element.id.includes('_1Q')) {
                return '1/4';
            }
        }
        
        // Dàtecter par les dimensions pour les blocs creux
        if (this.isHollowBlock(element)) {
            const length = element.dimensions.length;
            switch (length) {
                case 39:
                    return '1/1'; // Entier
                case 29:
                    return '3/4';
                case 19:
                    return '1/2';
                case 9:
                    return '1/4';
                default:
                    return '1/1'; // Par défaut
            }
        }
        
        // Pour les briques, dàtecter par dimensions
        if (element.dimensions.height === 6.5 || element.dimensions.height === 9) { // Hauteurs typiques de briques
            const length = element.dimensions.length;
            if (length === 19) {
                return '1/1'; // Brique entiàre
            } else if (length === 14) {
                return '3/4';
            } else if (length === 9) {
                return '1/2';
            } else if (length === 4) {
                return '1/4';
            }
        }
        
        return '1/1'; // Par défaut pour éléments non reconnus
    }

    // Cràer un marqueur d'accroche pour un élément spécifique
    createMarkerForElement(element, targetAssiseHeight) {
    // Logs supprimés: création marqueur élément (position, dimensions, rotation)
        
        const currentAssiseForType = this.currentAssiseByType.get(this.currentType);
        const assisesForType = this.assisesByType.get(this.currentType);
        const assise = assisesForType.get(currentAssiseForType);
        if (!assise) {
            // Log supprimé: assise non trouvée pour marqueur
            return;
        }
        
        // Calculer la position du marqueur sur la grille de l'assise active
        const markerY = assise.height;
    // Log supprimé: hauteur assise cible
        
        // Cràer le contour de la brique projetà sur l'assise active
        const outlineGeometry = new THREE.RingGeometry(
            0, // rayon intàrieur
            Math.max(element.dimensions.length, element.dimensions.width) / 2, // rayon extàrieur
            4 // segments (pour faire un carrà)
        );
        
        // Cràer aussi un marqueur rectangulaire plus pràcis
        const markerGeometry = new THREE.PlaneGeometry(
            element.dimensions.length,
            element.dimensions.width
        );
        
        const markerMaterial = new THREE.MeshBasicMaterial({
            color: this.attachmentMarkerColor,
            transparent: true,
            opacity: this.attachmentMarkerOpacity,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        // Calculer le dàcalage pour positionner le marqueur correctement
        // Dàcaler d'une demi-longueur en X et d'une demi-largeur en Z (vers l'arriàre)
        const offsetX = element.dimensions.length / 2;
        const offsetZ = -element.dimensions.width / 2; // CORRECTION: dàcalage nàgatif en Z
        
        // Appliquer la rotation de l'élément au dàcalage
        const cos = Math.cos(element.rotation);
        const sin = Math.sin(element.rotation);
        const rotatedOffsetX = offsetX * cos - offsetZ * sin;
        const rotatedOffsetZ = offsetX * sin + offsetZ * cos;
        
        // Position finale du marqueur (dàcalàe)
        const markerX = element.position.x + rotatedOffsetX;
        const markerZ = element.position.z + rotatedOffsetZ;
        
        // Cràer le marqueur principal (rectangle)
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(markerX, markerY + 0.1, markerZ);
        marker.rotation.x = -Math.PI / 2; // Horizontal
        marker.rotation.z = element.rotation; // Màme rotation que la brique
        
        // IDENTIFICATION POUR EXPORT PDF : Marquer ce mesh comme marqueur d'assise à masquer
        marker.userData.isAssiseProjectionMarker = true;
        marker.userData.assiseProjectionType = 'attachment_marker';
        marker.userData.sourceElementId = element.id;
        marker.userData.targetAssise = this.currentAssiseByType.get(this.currentType);
        marker.name = `AssiseProjection_AttachmentMarker_${element.id}`;
        
        // Cràer les contours (bordures)
        const edges = new THREE.EdgesGeometry(markerGeometry);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: this.attachmentMarkerColor,
            linewidth: 2
        });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        wireframe.position.copy(marker.position);
        wireframe.rotation.copy(marker.rotation);
        
        // IDENTIFICATION POUR EXPORT PDF : Marquer les contours comme éléments à masquer
        wireframe.userData.isAssiseProjectionMarker = true;
        wireframe.userData.assiseProjectionType = 'attachment_border';
        wireframe.userData.sourceElementId = element.id;
        wireframe.userData.targetAssise = this.currentAssiseByType.get(this.currentType);
        wireframe.name = `AssiseProjection_AttachmentBorder_${element.id}`;
        
        // Cràer un groupe pour le marqueur complet
        const markerGroup = new THREE.Group();
        markerGroup.add(marker);
        markerGroup.add(wireframe);
        
        // IDENTIFICATION POUR EXPORT PDF : Marquer le groupe complet
        markerGroup.userData.isAssiseProjectionMarker = true;
        markerGroup.userData.assiseProjectionType = 'attachment_group';
        markerGroup.userData.sourceElementId = element.id;
        markerGroup.userData.targetAssise = this.currentAssiseByType.get(this.currentType);
        markerGroup.name = `AssiseProjection_AttachmentGroup_${element.id}`;
        
        // Ajouter des points d'accroche (coins et centre)
        this.addAttachmentPoints(element, markerGroup, markerY, markerX, markerZ);
        
        // Ajouter à la scène et au tracking
        window.SceneManager.scene.add(markerGroup);
    // Log supprimé: marqueur ajouté à la scène
        
        if (!this.attachmentMarkers.has(this.currentAssise)) {
            this.attachmentMarkers.set(this.currentAssise, []);
        }
        this.attachmentMarkers.get(this.currentAssise).push({
            group: markerGroup,
            elementId: element.id,
            sourceAssise: this.getElementAssise(element.id)
        });
        
    // Log supprimé: marqueur enregistré
    }

    // Ajouter des points d'accroche spécifiques (coins et centre)
    addAttachmentPoints(element, parentGroup, markerY, markerX, markerZ) {
        const halfLength = element.dimensions.length / 2;
        const halfWidth = element.dimensions.width / 2;
        
        // Points d'accroche : 4 coins + centre + points spàciaux selon le type d'élément
        const attachmentPoints = [
            { x: -halfLength, z: -halfWidth, type: 'corner' }, // Coin arriàre-gauche
            { x: halfLength, z: -halfWidth, type: 'corner' },  // Coin arriàre-droit
            { x: halfLength, z: halfWidth, type: 'corner' },   // Coin avant-droit
            { x: -halfLength, z: halfWidth, type: 'corner' },  // Coin avant-gauche
            { x: 0, z: 0, type: 'center' }                    // Centre du marqueur
        ];
        
        // Dàtecter le type d'élément pour appliquer les bons points d'accrochage
        const isHollowBlock = this.isHollowBlock(element);
        const cutType = this.getElementCutType(element);
        
        // console.log(`🔧 Points d'accroche pour ${element.id}: isHollowBlock=${isHollowBlock}, cutType=${cutType}, length=${element.dimensions.length}cm`);
        
        // Coin arriàre-gauche et avant-gauche
        const leftBackCornerX = -halfLength;
        const leftBackCornerZ = -halfWidth;
        const leftFrontCornerX = -halfLength;
        const leftFrontCornerZ = halfWidth;
        
        // LOGIQUE SPàCIFIQUE SELON LE TYPE D'àLàMENT
        if (isHollowBlock) {
            // === BLOCS CREUX ===
            if (cutType === '1/1' && element.dimensions.length === 39) {
                // Bloc creux entier 1/1 (39cm) : points à 9, 10, 19, 20, 29 et 30cm
                attachmentPoints.push(
                    { x: leftBackCornerX + 9, z: leftBackCornerZ, type: 'snap-9cm-back', description: '9cm du coin arriàre-gauche' },
                    { x: leftBackCornerX + 10, z: leftBackCornerZ, type: 'snap-10cm-back', description: '10cm du coin arriàre-gauche' },
                    { x: leftBackCornerX + 19, z: leftBackCornerZ, type: 'snap-19cm-back', description: '19cm du coin arriàre-gauche' },
                    { x: leftBackCornerX + 20, z: leftBackCornerZ, type: 'snap-20cm-back', description: '20cm du coin arriàre-gauche' },
                    { x: leftBackCornerX + 29, z: leftBackCornerZ, type: 'snap-29cm-back', description: '29cm du coin arriàre-gauche' },
                    { x: leftBackCornerX + 30, z: leftBackCornerZ, type: 'snap-30cm-back', description: '30cm du coin arriàre-gauche' }
                );
                
                attachmentPoints.push(
                    { x: leftFrontCornerX + 9, z: leftFrontCornerZ, type: 'snap-9cm-front', description: '9cm du coin avant-gauche' },
                    { x: leftFrontCornerX + 10, z: leftFrontCornerZ, type: 'snap-10cm-front', description: '10cm du coin avant-gauche' },
                    { x: leftFrontCornerX + 19, z: leftFrontCornerZ, type: 'snap-19cm-front', description: '19cm du coin avant-gauche' },
                    { x: leftFrontCornerX + 20, z: leftFrontCornerZ, type: 'snap-20cm-front', description: '20cm du coin avant-gauche' },
                    { x: leftFrontCornerX + 29, z: leftFrontCornerZ, type: 'snap-29cm-front', description: '29cm du coin avant-gauche' },
                    { x: leftFrontCornerX + 30, z: leftFrontCornerZ, type: 'snap-30cm-front', description: '30cm du coin avant-gauche' }
                );
                // Log supprimé: points ajoutés bloc creux entier 1/1
            } else if (cutType === '3/4' && element.dimensions.length === 29) {
                // Bloc creux 3/4 (29cm) : points à 9, 10, 19 et 20cm
                attachmentPoints.push(
                    { x: leftBackCornerX + 9, z: leftBackCornerZ, type: 'snap-9cm-back', description: '9cm du coin arriàre-gauche' },
                    { x: leftBackCornerX + 10, z: leftBackCornerZ, type: 'snap-10cm-back', description: '10cm du coin arriàre-gauche' },
                    { x: leftBackCornerX + 19, z: leftBackCornerZ, type: 'snap-19cm-back', description: '19cm du coin arriàre-gauche' },
                    { x: leftBackCornerX + 20, z: leftBackCornerZ, type: 'snap-20cm-back', description: '20cm du coin arriàre-gauche' }
                );
                
                attachmentPoints.push(
                    { x: leftFrontCornerX + 9, z: leftFrontCornerZ, type: 'snap-9cm-front', description: '9cm du coin avant-gauche' },
                    { x: leftFrontCornerX + 10, z: leftFrontCornerZ, type: 'snap-10cm-front', description: '10cm du coin avant-gauche' },
                    { x: leftFrontCornerX + 19, z: leftFrontCornerZ, type: 'snap-19cm-front', description: '19cm du coin avant-gauche' },
                    { x: leftFrontCornerX + 20, z: leftFrontCornerZ, type: 'snap-20cm-front', description: '20cm du coin avant-gauche' }
                );
                // console.log(`🏗️ Bloc creux 3/4: Ajout des points à 9, 10, 19 et 20cm`);
            } else if (cutType === '1/4' && element.dimensions.length === 9) {
                // Bloc creux 1/4 (9cm) : pas de points intermàdiaires
                // Log supprimé: bloc creux 1/4 aucun point intermédiaire
            } else if (cutType === '1/2' && element.dimensions.length === 19) {
                // Bloc creux 1/2 (19cm) : points à 9 et 10cm
                attachmentPoints.push(
                    { x: leftBackCornerX + 9, z: leftBackCornerZ, type: 'snap-9cm-back', description: '9cm du coin arriàre-gauche' },
                    { x: leftBackCornerX + 10, z: leftBackCornerZ, type: 'snap-10cm-back', description: '10cm du coin arriàre-gauche' }
                );
                
                attachmentPoints.push(
                    { x: leftFrontCornerX + 9, z: leftFrontCornerZ, type: 'snap-9cm-front', description: '9cm du coin avant-gauche' },
                    { x: leftFrontCornerX + 10, z: leftFrontCornerZ, type: 'snap-10cm-front', description: '10cm du coin avant-gauche' }
                );
                // Log supprimé: bloc creux 1/2 points ajoutés
            }
        } else {
            // === BRIQUES ET AUTRES àLàMENTS ===
            // Garder l'ancienne logique pour les briques (9cm et 10cm)
            if (element.dimensions.length > 10) { // Au moins 10cm de longueur
                attachmentPoints.push(
                    { x: leftBackCornerX + 9, z: leftBackCornerZ, type: 'snap-9cm-back', description: '9cm du coin arriàre-gauche' },
                    { x: leftBackCornerX + 10, z: leftBackCornerZ, type: 'snap-10cm-back', description: '10cm du coin arriàre-gauche' }
                );
                
                attachmentPoints.push(
                    { x: leftFrontCornerX + 9, z: leftFrontCornerZ, type: 'snap-9cm-front', description: '9cm du coin avant-gauche' },
                    { x: leftFrontCornerX + 10, z: leftFrontCornerZ, type: 'snap-10cm-front', description: '10cm du coin avant-gauche' }
                );
                // console.log(`🔧 Brique: Ajout des points à 9 et 10cm`);
            }
        }
        
        attachmentPoints.forEach(point => {
            const pointGeometry = new THREE.SphereGeometry(0.5, 8, 6);
            
            // Couleurs spàciales pour les diffàrents types de points d'accroche
            let pointColor = this.attachmentMarkerColor; // Orange par défaut
            if (point.type === 'center') {
                pointColor = 0xe74c3c; // Rouge pour le centre
            } else if (point.type === 'snap-9cm-back') {
                pointColor = 0x00ff00; // Vert pour 9cm arriàre
            } else if (point.type === 'snap-10cm-back') {
                pointColor = 0x0000ff; // Bleu pour 10cm arriàre
            } else if (point.type === 'snap-9cm-front') {
                pointColor = 0x00ffff; // Cyan pour 9cm avant
            } else if (point.type === 'snap-10cm-front') {
                pointColor = 0xff00ff; // Magenta pour 10cm avant
            } else if (point.type === 'snap-19cm-back') {
                pointColor = 0x9ACD32; // Vert olive pour 19cm arriàre
            } else if (point.type === 'snap-20cm-back') {
                pointColor = 0x228B22; // Vert foràt pour 20cm arriàre
            } else if (point.type === 'snap-29cm-back') {
                pointColor = 0x4169E1; // Bleu royal pour 29cm arriàre
            } else if (point.type === 'snap-30cm-back') {
                pointColor = 0x191970; // Bleu nuit pour 30cm arriàre
            } else if (point.type === 'snap-19cm-front') {
                pointColor = 0xFFD700; // Or pour 19cm avant
            } else if (point.type === 'snap-20cm-front') {
                pointColor = 0xFFA500; // Orange foncà pour 20cm avant
            } else if (point.type === 'snap-29cm-front') {
                pointColor = 0xFF1493; // Rose profond pour 29cm avant
            } else if (point.type === 'snap-30cm-front') {
                pointColor = 0x8B0000; // Rouge foncà pour 30cm avant
            }
            
            const pointMaterial = new THREE.MeshBasicMaterial({
                color: pointColor,
                transparent: true,
                opacity: 0.8
            });
            
            const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
            
            // Position relative au marqueur dàcalà, avec rotation
            const cos = Math.cos(element.rotation);
            const sin = Math.sin(element.rotation);
            const rotatedX = point.x * cos - point.z * sin;
            const rotatedZ = point.x * sin + point.z * cos;
            
            pointMesh.position.set(
                markerX + rotatedX,
                markerY + 0.2,
                markerZ + rotatedZ
            );
            
            // Ajouter des màtadonnées pour identifier le type de point
            pointMesh.userData = {
                type: point.type,
                description: point.description || point.type,
                isSnapPoint: point.type.startsWith('snap-'),
                originalColor: pointColor,
                originalOpacity: 0.8,
                originalScale: { x: 1, y: 1, z: 1 },
                isHovered: false,
                pulsePhase: Math.random() * Math.PI * 2, // Phase alàatoire pour la pulsation
                // IDENTIFICATION COMPLàTE POUR EXPORT PDF : Marquer comme point d'accrochage à masquer
                isAssiseProjectionMarker: true,
                assiseProjectionType: 'snap_point',
                sourceElementId: element.id,
                targetAssise: this.currentAssiseByType.get(this.currentType),
                // NOUVELLES IDENTIFICATIONS SPàCIFIQUES
                isProjectedAttachmentPoint: true,
                projectionSource: 'lower_assise_element',
                markerCategory: 'attachment_point',
                shouldHideInPDF: true,
                elementType: element.type || 'unknown',
                currentType: this.currentType,
                sourceAssiseIndex: this.getElementAssise(element.id)
            };
            
            // IDENTIFICATION POUR EXPORT PDF : Nom unique pour faciliter le debug et le masquage
            pointMesh.name = `AssiseProjection_AttachmentPoint_${element.id}_${point.type}_Assise${this.currentAssiseByType.get(this.currentType)}`;
            
            // Cràer un effet de halo pour les points spàciaux
            if (point.type.startsWith('snap-') || point.type === 'center') {
                const haloGeometry = new THREE.SphereGeometry(0.8, 8, 6);
                const haloMaterial = new THREE.MeshBasicMaterial({
                    color: pointColor,
                    transparent: true,
                    opacity: 0.2,
                    depthWrite: false
                });
                const haloMesh = new THREE.Mesh(haloGeometry, haloMaterial);
                haloMesh.position.copy(pointMesh.position);
                haloMesh.userData = {
                    isHalo: true,
                    parentPoint: pointMesh,
                    originalOpacity: 0.2,
                    // IDENTIFICATION COMPLàTE POUR EXPORT PDF : Marquer le halo comme élément à masquer
                    isAssiseProjectionMarker: true,
                    assiseProjectionType: 'snap_halo',
                    sourceElementId: element.id,
                    targetAssise: this.currentAssiseByType.get(this.currentType),
                    // NOUVELLES IDENTIFICATIONS SPàCIFIQUES POUR HALO
                    isProjectedAttachmentPoint: true,
                    projectionSource: 'lower_assise_element',
                    markerCategory: 'attachment_halo',
                    shouldHideInPDF: true,
                    elementType: element.type || 'unknown',
                    currentType: this.currentType,
                    sourceAssiseIndex: this.getElementAssise(element.id),
                    isHaloElement: true
                };
                
                // IDENTIFICATION POUR EXPORT PDF : Nom unique pour le halo
                haloMesh.name = `AssiseProjection_AttachmentHalo_${element.id}_${point.type}_Assise${this.currentAssiseByType.get(this.currentType)}`;
                
                parentGroup.add(haloMesh);
                pointMesh.userData.halo = haloMesh;
            }
            
            // Ajouter au groupe parent
            parentGroup.add(pointMesh);
        });
        
        // console.log(`🔧 Points d'accroche cr\s pour ${element.id}: ${attachmentPoints.length} points (points spàciaux selon le type d'élément)`);
    }

    // Animation des points d'accroche avec effet de pulsation
    animateAttachmentPoints() {
        if (!this.showAttachmentMarkers) return;
        
        const time = Date.now() * 0.003; // Vitesse d'animation
        
        this.attachmentMarkers.forEach((markers, assiseIndex) => {
            markers.forEach(markerInfo => {
                markerInfo.group.traverse(child => {
                    if (child.userData && child.userData.type && !child.userData.isHalo) {
                        // Animation de pulsation pour tous les points
                        const pulseIntensity = child.userData.isHovered ? 0.4 : 0.15;
                        const pulse = Math.sin(time + child.userData.pulsePhase) * pulseIntensity + 1;
                        
                        if (child.userData.isHovered) {
                            // Effet de hover : agrandissement et pulsation plus intense
                            const hoverScale = 1.5 + Math.sin(time * 2 + child.userData.pulsePhase) * 0.3;
                            child.scale.setScalar(hoverScale);
                            
                            // Changement d'opacità pour l'effet de clignotement
                            const blinkOpacity = 0.6 + Math.sin(time * 4 + child.userData.pulsePhase) * 0.4;
                            child.material.opacity = blinkOpacity;
                            
                            // Effet de halo plus intense
                            if (child.userData.halo) {
                                child.userData.halo.material.opacity = 0.4 + Math.sin(time * 3) * 0.3;
                                child.userData.halo.scale.setScalar(1.2 + Math.sin(time * 2) * 0.2);
                            }
                        } else {
                            // Animation normale : pulsation subtile
                            child.scale.setScalar(pulse);
                            child.material.opacity = child.userData.originalOpacity * pulse;
                            
                            // Halo subtil
                            if (child.userData.halo) {
                                child.userData.halo.material.opacity = child.userData.originalOpacity * 0.3 * pulse;
                                child.userData.halo.scale.setScalar(1 + Math.sin(time + child.userData.pulsePhase) * 0.1);
                            }
                        }
                    }
                });
            });
        });
        
        // Programmer la prochaine frame d'animation
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.animationFrameId = requestAnimationFrame(() => this.animateAttachmentPoints());
    }

    // Dàtecter le survol des points d'accroche
    handleAttachmentPointHover(intersectedObject) {
        // Ràinitialiser tous les points (enlever le hover)
        this.attachmentMarkers.forEach((markers, assiseIndex) => {
            markers.forEach(markerInfo => {
                markerInfo.group.traverse(child => {
                    if (child.userData && child.userData.type && !child.userData.isHalo) {
                        child.userData.isHovered = false;
                    }
                });
            });
        });
        
        // Activer le hover sur le point survolà
        if (intersectedObject && intersectedObject.userData && intersectedObject.userData.type) {
            intersectedObject.userData.isHovered = true;
            
            // Afficher une info-bulle ou un log avec la description du point
            if (intersectedObject.userData.description) {
                // console.log(`🔧 Point d'accroche survolà: ${intersectedObject.userData.description}`);
            }
            
            return intersectedObject.userData;
        }
        
        return null;
    }

    // Dàmarrer l'animation des points d'accroche
    startAttachmentPointAnimation() {
        if (!this.animationRunning) {
            this.animationRunning = true;
            this.animateAttachmentPoints();
            // console.log('🔧 Animation des points d\'accroche dàmarràe');
        }
    }

    // Arràter l'animation des points d'accroche
    stopAttachmentPointAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.animationRunning = false;
        // console.log('🔧 Animation des points d\'accroche arràtàe');
    }

    // Nettoyer tous les marqueurs d'accroche
    clearAttachmentMarkers() {        
        // Arrêter l'animation avant de nettoyer
        this.stopAttachmentPointAnimation();
        
        this.attachmentMarkers.forEach((markers, assiseIndex) => {
            markers.forEach(markerInfo => {
                window.SceneManager.scene.remove(markerInfo.group);
                // Disposer des ressources
                markerInfo.group.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
            });
        });
        this.attachmentMarkers.clear();
    }

    // Mettre à jour les marqueurs d'accroche quand l'assise active change
    updateAttachmentMarkers() {
        const currentAssiseForType = this.currentAssiseByType.get(this.currentType);
        
        if (this.showAttachmentMarkers && currentAssiseForType > 0) {
            this.createAttachmentMarkers(currentAssiseForType);
            // Démarrer l'animation des points d'accroche
            this.startAttachmentPointAnimation();
        } else {
            this.clearAttachmentMarkers();
        }
    }

    // Basculer l'affichage des marqueurs d'accroche
    toggleAttachmentMarkers() {
        this.showAttachmentMarkers = !this.showAttachmentMarkers;
        this.updateAttachmentMarkers();
        
        if (this.showAttachmentMarkers) {
            this.startAttachmentPointAnimation();
        } else {
            this.stopAttachmentPointAnimation();
        }
        
        // console.log(`Marqueurs d'accroche: ${this.showAttachmentMarkers ? 'ACTIVàS' : 'DàSACTIVàS'}`);
        return this.showAttachmentMarkers;
    }

    // Màthode pour dàterminer le type d'assise en fonction de son contenu (ancienne version pour compatibilité)
    getAssiseTypeLabel(assiseIndex) {
        // Trouver dans quel type cette assise existe
        for (const type of this.supportedTypes) {
            const assisesForType = this.assisesByType.get(type);
            if (assisesForType.has(assiseIndex)) {
                return this.getAssiseTypeLabelForType(type, assiseIndex);
            }
        }
        return 'Assise (inconnue)';
    }

    // Nouvelle màthode pour obtenir le label d'une assise d'un type spécifique
    getAssiseTypeLabelForType(type, assiseIndex) {
        const assisesForType = this.assisesByType.get(type);
        if (!assisesForType.has(assiseIndex)) {
            return `Assise ${type} (vide)`; // Valeur par défaut plus claire
        }
        
        const assise = assisesForType.get(assiseIndex);
        if (assise.elements.size === 0) {
            return `Assise ${type} (vide)`; // Assise vide avec indication claire
        }
        
        // Pour le nouveau systàme, le type est déjà dàterminà par la catàgorie
        const typeLabels = {
            'brick': 'Assise Briques',
            'block': 'Assise Blocs', 
            'insulation': 'Assise Isolant',
            'custom': 'Assise Personnalisàe',
            
            // Sous-types de briques
            'M50': 'Assise M50',
            'M57': 'Assise M57',
            'M60': 'Assise M60',
            'M65': 'Assise M65',
            'M90': 'Assise M90',
            
            // Sous-types de blocs généralistes
            'CREUX': 'Assise Blocs Creux',
            'CELLULAIRE': 'Assise Béton Cellulaire',
            'ARGEX': 'Assise Argex',
            'TERRE_CUITE': 'Assise Terre Cuite',
            
            // Sous-types de blocs creux spécifiques
            'B9': 'Assise B9',
            'B14': 'Assise B14',
            'B19': 'Assise B19',
            'B29': 'Assise B29',
            
            // Sous-types béton cellulaire
            'BC5': 'Assise BC5',
            'BC7': 'Assise BC7',
            'BC10': 'Assise BC10',
            'BC15': 'Assise BC15',
            'BC17': 'Assise BC17',
            'BC20': 'Assise BC20',
            'BC24': 'Assise BC24',
            'BC30': 'Assise BC30',
            'BC36': 'Assise BC36',
            
            // Sous-types ARGEX spécifiques
            'ARGEX9': 'Assise ARGEX 9',
            'ARGEX14': 'Assise ARGEX 14',
            'ARGEX19': 'Assise ARGEX 19',
            
            // Sous-types terre cuite spécifiques
            'TC10': 'Assise TC 10',
            'TC14': 'Assise TC 14',
            'TC19': 'Assise TC 19'
        };
        
        return typeLabels[type] || `Assise ${type}`;
    }

    // Màthode pour obtenir des statistiques dàtaillàes sur une assise (ancienne version pour compatibilité)
    getAssiseStatistics(assiseIndex) {
        // Trouver dans quel type cette assise existe
        for (const type of this.supportedTypes) {
            const assisesForType = this.assisesByType.get(type);
            if (assisesForType.has(assiseIndex)) {
                return this.getAssiseStatisticsForType(type, assiseIndex);
            }
        }
        return null;
    }

    // Màthode pour obtenir une description textuelle d'une assise (ancienne version pour compatibilité)
    getAssiseDescription(assiseIndex) {
        // Trouver dans quel type cette assise existe
        for (const type of this.supportedTypes) {
            const assisesForType = this.assisesByType.get(type);
            if (assisesForType.has(assiseIndex)) {
                return this.getAssiseDescriptionForType(type, assiseIndex);
            }
        }
        return 'Assise inconnue';
    }

    // Nouvelle màthode pour obtenir une description d'une assise d'un type spécifique
    getAssiseDescriptionForType(type, assiseIndex) {
        const stats = this.getAssiseStatisticsForType(type, assiseIndex);
        if (!stats || stats.totalElements === 0) {
            return 'Assise vide';
        }
        
        const typeLabels = {
            'brick': 'briques',
            'block': 'blocs',
            'insulation': 'isolant',
            'custom': 'éléments custom'
        };
        
        return `${stats.totalElements} ${typeLabels[type] || 'éléments'}`;
    }

    // Nouvelle màthode pour obtenir des statistiques dàtaillàes sur une assise d'un type spécifique
    getAssiseStatisticsForType(type, assiseIndex) {
        const assisesForType = this.assisesByType.get(type);
        if (!assisesForType.has(assiseIndex)) {
            return null;
        }
        
        const assise = assisesForType.get(assiseIndex);
        const stats = {
            totalElements: this.getNonJointElementCountForType(type, assiseIndex),
            type: type,
            materials: {},
            dimensions: { totalVolume: 0, totalSurface: 0 }
        };
        
        for (const elementId of assise.elements) {
            const element = window.SceneManager.elements.get(elementId);
            if (element) {
                // Compter les matàriaux
                stats.materials[element.material] = (stats.materials[element.material] || 0) + 1;
                
                // Calculer les dimensions totales si les màthodes existent
                if (element.getVolume) {
                    stats.dimensions.totalVolume += element.getVolume();
                }
                if (element.getSurfaceArea) {
                    stats.dimensions.totalSurface += element.getSurfaceArea();
                }
            }
        }
        
        return stats;
    }

    // Trouve l'assise dans laquelle se trouve un élément donné
    findElementAssise(elementId, type = 'brick') {
        const assises = this.assisesByType.get(type);
        if (!assises) return null;
        
        for (let i = 0; i < assises.size; i++) {
            const assise = assises.get(i);
            if (assise && assise.elements.has(elementId)) {
                return i;
            }
        }
        
        return null; // élément non trouvé dans les assises
    }

    // Version amàlioràe qui retourne les informations complàtes d'assise pour un élément
    findElementAssiseComplete(elementId) {
        // Chercher dans tous les types d'assise
        for (const [assiseType, assises] of this.assisesByType.entries()) {
            for (let assiseIndex = 0; assiseIndex < assises.size; assiseIndex++) {
                const assise = assises.get(assiseIndex);
                if (assise && assise.elements.has(elementId)) {
                    return {
                        assiseType: assiseType,
                        assiseIndex: assiseIndex,
                        assise: assise
                    };
                }
            }
        }
        
        return null; // élément non trouvé dans les assises
    }

    // Mettre à jour les joints existants lors du changement de hauteur du joint horizontal
    updateVerticalJoints() {
        if (!window.SceneManager || !window.SceneManager.elements) return;
        
    // Log supprimé: début mise à jour joints existants
        let updatedCount = 0;
        
        // Parcourir tous les éléments de la scène
        for (const [elementId, element] of window.SceneManager.elements.entries()) {
            // Traiter les joints debout (largeur = 1cm et marquage isVerticalJoint)
            if (element.isVerticalJoint && element.dimensions.width === 1) {
                // CORRECTION CRITIQUE: Trouver le TYPE d'assise du joint (M50, M65, M90, etc.)
                let jointAssiseType = null;
                let elementAssiseIndex = null;
                
                // Rechercher dans tous les types d'assises pour trouver oà est ce joint
                for (const [type, assises] of this.assisesByType.entries()) {
                    for (const [index, assise] of assises.entries()) {
                        if (assise && assise.elements.has(elementId)) {
                            jointAssiseType = type;
                            elementAssiseIndex = index;
                            break;
                        }
                    }
                    if (jointAssiseType) break;
                }
                
                // Si le joint n'est associà à aucune assise spécifique, ne pas le modifier
                if (!jointAssiseType) {
                    // Log supprimé: joint sans assise associée
                    continue;
                }
                
                // Utiliser la hauteur de joint spécifique à ce type d'assise
                const typeJointHeight = this.getJointHeightForType(jointAssiseType);
                
                // CORRECTION CRITIQUE: Utiliser la hauteur de brique stockée DANS le joint
                // Si pas de hauteur stockée, dàduire de la hauteur actuelle du joint
                let originalBrickHeight = element.originalBrickHeight;
                
                if (!originalBrickHeight) {
                    // Dàduire la hauteur de brique d'origine depuis la hauteur actuelle du joint
                    // Hauteur joint = hauteur brique + hauteur joint horizontal
                    originalBrickHeight = element.dimensions.height - typeJointHeight;
                    
                    // Valider et corriger si nàcessaire (plage àtendue pour blocs)
                    if (originalBrickHeight < 4 || originalBrickHeight > 30) {
                        // Hauteur aberrante, utiliser les valeurs connues selon le type
                        if (jointAssiseType === 'M90') {
                            originalBrickHeight = 9;
                        } else if (jointAssiseType === 'M65') {
                            originalBrickHeight = 6.5;
                        } else if (jointAssiseType === 'M60') {
                            originalBrickHeight = 6;
                        } else if (jointAssiseType === 'M57') {
                            originalBrickHeight = 5.7;
                        } else if (jointAssiseType === 'M50') {
                            originalBrickHeight = 5;
                        } else if (jointAssiseType === 'HOLLOW') {
                            originalBrickHeight = 19;
                        } else if (jointAssiseType === 'CELLULAR') {
                            originalBrickHeight = 25;
                        } else if (jointAssiseType === 'ARGEX') {
                            originalBrickHeight = 19;
                        } else if (jointAssiseType === 'TERRACOTTA') {
                            originalBrickHeight = 25;
                        } else {
                            originalBrickHeight = 6.5; // Dàfaut
                        }
                    }
                    
                    // Stocker pour les prochaines fois
                    element.originalBrickHeight = originalBrickHeight;
                    // Log supprimé: hauteur brique déduite
                } else {
                    // Log supprimé: hauteur brique stockée
                }
                
                // Calculer la nouvelle hauteur du joint basàe sur la brique D'ORIGINE et le joint spécifique au type
                const newJointHeight = originalBrickHeight + typeJointHeight;
                
                // Mettre à jour les dimensions
                element.updateDimensions(
                    element.dimensions.length,  // Garder longueur (9cm)
                    element.dimensions.width,   // Garder largeur (1cm) 
                    newJointHeight              // Nouvelle hauteur
                );
                
                // Recalculer la position Y en respectant l'assise d'origine
                // CORRECTION: La face supàrieure du joint doit àtre alignàe avec la face supàrieure de la brique
                let newPositionY;
                if (elementAssiseIndex !== null && elementAssiseIndex >= 0) {
                    // Calculer la hauteur de la face supàrieure de la brique dans cette assise et ce type
                    const assiseHeight = this.calculateAssiseHeightForType(jointAssiseType, elementAssiseIndex);
                    const brickTopY = assiseHeight + originalBrickHeight;
                    // Positionner le joint pour que sa face supàrieure soit au màme niveau
                    newPositionY = brickTopY - newJointHeight / 2;
                } else {
                    // Fallback : rester au sol si assise non trouvée
                    newPositionY = newJointHeight / 2;
                }
                
                element.updatePosition(
                    element.position.x,
                    newPositionY,
                    element.position.z
                );
                
                updatedCount++;
                // Log supprimé: joint debout mis à jour
            }
            // Traiter les joints horizontaux (marquage isHorizontalJoint)
            else if (element.isHorizontalJoint) {
                // CORRECTION CRITIQUE: Trouver le TYPE d'assise du joint horizontal aussi
                let jointAssiseType = null;
                let elementAssiseIndex = null;
                
                // Rechercher dans tous les types d'assises pour trouver oà est ce joint
                for (const [type, assises] of this.assisesByType.entries()) {
                    for (const [index, assise] of assises.entries()) {
                        if (assise && assise.elements.has(elementId)) {
                            jointAssiseType = type;
                            elementAssiseIndex = index;
                            break;
                        }
                    }
                    if (jointAssiseType) break;
                }
                
                // Si le joint n'est associà à aucune assise spécifique, ne pas le modifier
                if (!jointAssiseType) {
                    // Log supprimé: joint horizontal sans assise
                    continue;
                }
                
                // Pour le joint horizontal, seule l'àpaisseur (hauteur) change - utiliser le joint spécifique au type
                const newJointHeight = this.getJointHeightForType(jointAssiseType);
                
                // Mettre à jour les dimensions
                element.updateDimensions(
                    element.dimensions.length,  // Garder longueur originale
                    element.dimensions.width,   // Garder largeur originale
                    newJointHeight              // Nouvelle hauteur (àpaisseur du joint)
                );
                
                // CORRECTION: Recalculer la position Y en fonction de l'assise
                let newPositionY;
                if (elementAssiseIndex === 0) {
                    // Pour l'assise 0, le joint horizontal va de Y=0 à Y=jointHeight
                    // Son centre doit donc àtre à jointHeight/2
                    newPositionY = newJointHeight / 2;
                    // Log supprimé: joint horizontal assise 0
                } else if (elementAssiseIndex !== null && elementAssiseIndex > 0) {
                    // Pour les autres assises, calculer la position relative
                    const assiseHeight = this.calculateAssiseHeightForType(jointAssiseType, elementAssiseIndex);
                    newPositionY = assiseHeight - newJointHeight / 2;
                    // Log supprimé: joint horizontal autre assise
                } else {
                    // Fallback : rester au sol si assise non trouvée
                    newPositionY = newJointHeight / 2;
                    // Log supprimé: joint horizontal fallback
                }
                
                element.updatePosition(
                    element.position.x,
                    newPositionY,
                    element.position.z
                );
                
                updatedCount++;
        // Log supprimé: joint horizontal mis à jour
            }
        }
        
    // Log supprimé: récap joints mis à jour
    }
    
    // Mettre à jour seulement les joints d'un type d'assise spécifique
    updateVerticalJointsForType(targetType) {
        if (!window.SceneManager || !window.SceneManager.elements) return;
        
        // console.log(`🔧 Mise à jour des joints pour le type ${targetType} uniquement...`);
        let updatedCount = 0;
        
        // Parcourir tous les éléments de la scène
        for (const [elementId, element] of window.SceneManager.elements.entries()) {
            // Traiter les joints debout (largeur = 1cm et marquage isVerticalJoint)
            if (element.isVerticalJoint && element.dimensions.width === 1) {
                // Trouver le TYPE d'assise du joint
                let jointAssiseType = null;
                let elementAssiseIndex = null;
                
                // Rechercher dans tous les types d'assises pour trouver oà est ce joint
                for (const [type, assises] of this.assisesByType.entries()) {
                    for (const [index, assise] of assises.entries()) {
                        if (assise && assise.elements.has(elementId)) {
                            jointAssiseType = type;
                            elementAssiseIndex = index;
                            break;
                        }
                    }
                    if (jointAssiseType) break;
                }
                
                // Ne mettre à jour que les joints du type cible
                if (jointAssiseType !== targetType) {
                    continue;
                }
                
                // Utiliser la hauteur de joint spécifique à ce type d'assise
                const typeJointHeight = this.getJointHeightForType(jointAssiseType);
                
                // Utiliser la hauteur de brique stockée DANS le joint
                let originalBrickHeight = element.originalBrickHeight;
                
                if (!originalBrickHeight) {
                    // Dàduire la hauteur de brique d'origine
                    originalBrickHeight = element.dimensions.height - typeJointHeight;
                    
                    // Valider et corriger si nàcessaire (plage àtendue pour blocs)
                    if (originalBrickHeight < 4 || originalBrickHeight > 30) {
                        // Hauteur aberrante, utiliser les valeurs connues selon le type
                        if (jointAssiseType === 'M90') {
                            originalBrickHeight = 9;
                        } else if (jointAssiseType === 'M65') {
                            originalBrickHeight = 6.5;
                        } else if (jointAssiseType === 'M60') {
                            originalBrickHeight = 6;
                        } else if (jointAssiseType === 'M57') {
                            originalBrickHeight = 5.7;
                        } else if (jointAssiseType === 'M50') {
                            originalBrickHeight = 5;
                        } else if (jointAssiseType === 'HOLLOW') {
                            originalBrickHeight = 19;
                        } else if (jointAssiseType === 'CELLULAR') {
                            originalBrickHeight = 25;
                        } else if (jointAssiseType === 'ARGEX') {
                            originalBrickHeight = 19;
                        } else if (jointAssiseType === 'TERRACOTTA') {
                            originalBrickHeight = 25;
                        } else {
                            originalBrickHeight = 6.5; // Dàfaut
                        }
                    }
                    
                    // Stocker pour les prochaines fois
                    element.originalBrickHeight = originalBrickHeight;
                }
                
                // Calculer la nouvelle hauteur du joint
                const newJointHeight = originalBrickHeight + typeJointHeight;
                
                // Mettre à jour les dimensions
                element.updateDimensions(
                    element.dimensions.length,
                    element.dimensions.width,
                    newJointHeight
                );
                
                // Recalculer la position Y - CORRECTIF: Ancrer le joint au sommet du bloc
                let newPositionY;
                if (elementAssiseIndex !== null && elementAssiseIndex >= 0) {
                    // Trouver le bloc de référence pour ce joint vertical
                    const assiseHeight = this.calculateAssiseHeightForType(jointAssiseType, elementAssiseIndex);
                    
                    // CORRECTION: Pour les joints verticaux, utiliser la hauteur ràelle du bloc de référence
                    // Au lieu de utiliser originalBrickHeight (qui est la hauteur stockée lors de la cràation),
                    // utiliser la hauteur ràelle du bloc dans cette assise
                    const elementsInAssise = this.elementsByType.get(jointAssiseType)?.get(elementAssiseIndex);
                    let blockTopY = assiseHeight + originalBrickHeight; // Fallback
                    
                    if (elementsInAssise) {
                        // Chercher un bloc de référence à proximità du joint
                        const jointX = element.position.x;
                        const jointZ = element.position.z;
                        let closestBlock = null;
                        let minDistance = Infinity;
                        
                        for (const elemId of elementsInAssise) {
                            const elem = window.SceneManager.elements.get(elemId);
                            if (elem && (elem.type === 'block' || elem.type === 'brick') && !elem.isVerticalJoint && !elem.isHorizontalJoint) {
                                const distance = Math.sqrt(
                                    Math.pow(elem.position.x - jointX, 2) + 
                                    Math.pow(elem.position.z - jointZ, 2)
                                );
                                if (distance < minDistance) {
                                    minDistance = distance;
                                    closestBlock = elem;
                                }
                            }
                        }
                        
                        if (closestBlock && minDistance < 50) { // 50cm de tolàrance
                            // CORRECTION IMPORTANTE: Utiliser la position ORIGINALE du bloc
                            // Le bloc lui-màme peut avoir àtà repositionné par les changements de joint horizontal
                            // Donc on utilise la position de base de l'assise + hauteur originale du bloc
                            const originalBlockTop = assiseHeight + closestBlock.dimensions.height;
                            blockTopY = originalBlockTop;
                            // console.log(`🔧 Joint ancrà au bloc ${closestBlock.id} (sommet ORIGINAL: ${blockTopY} cm)`);
                        }
                    }
                    
                    // Centre du joint = sommet du bloc - hauteur_joint/2 pour ancrer par le haut
                    // CORRECTION: Pour garder le sommet du joint fixe au sommet du bloc
                    // Le sommet du joint doit rester à blockTopY
                    // Donc le centre = sommet - hauteur/2
                    newPositionY = blockTopY - newJointHeight / 2;
                    // console.log(`🔧 Joint repositionné: sommet bloc ${blockTopY} cm, hauteur joint ${newJointHeight} cm, nouveau centre Y: ${newPositionY} cm`);
                    // console.log(`🔧 Vàrification: sommet joint = ${newPositionY + newJointHeight/2} cm (doit = ${blockTopY} cm)`);
                } else {
                    newPositionY = newJointHeight / 2;
                }
                
                element.updatePosition(
                    element.position.x,
                    newPositionY,
                    element.position.z
                );
                
                updatedCount++;
                // console.log(`🔧 Joint debout ${elementId} (${targetType}) mis à jour: ${element.dimensions.length}×${element.dimensions.width}×${newJointHeight} cm`);
            }
            // Traiter les joints horizontaux
            else if (element.isHorizontalJoint) {
                // Trouver le TYPE d'assise du joint horizontal
                let jointAssiseType = null;
                let elementAssiseIndex = null;
                
                for (const [type, assises] of this.assisesByType.entries()) {
                    for (const [index, assise] of assises.entries()) {
                        if (assise && assise.elements.has(elementId)) {
                            jointAssiseType = type;
                            elementAssiseIndex = index;
                            break;
                        }
                    }
                    if (jointAssiseType) break;
                }
                
                // Ne mettre à jour que les joints du type cible
                if (jointAssiseType !== targetType) {
                    continue;
                }
                
                // CORRECTION: Pour le joint horizontal, utiliser la hauteur spécifique de l'assise
                const newJointHeight = this.getJointHeightForAssise(jointAssiseType, elementAssiseIndex);
                
                // Mettre à jour les dimensions
                element.updateDimensions(
                    element.dimensions.length,
                    element.dimensions.width,
                    newJointHeight
                );
                
                // Recalculer la position Y
                let newPositionY;
                if (elementAssiseIndex !== null && elementAssiseIndex >= 0) {
                    const assiseHeight = this.calculateAssiseHeightForType(jointAssiseType, elementAssiseIndex);
                    newPositionY = assiseHeight - newJointHeight / 2;
                } else {
                    newPositionY = newJointHeight / 2;
                }
                
                element.updatePosition(
                    element.position.x,
                    newPositionY,
                    element.position.z
                );
                
                updatedCount++;
                // console.log(`🔧 Joint horizontal ${elementId} (${targetType}) mis à jour: ${element.dimensions.length}×${element.dimensions.width}×${newJointHeight} cm`);
            }
        }
        
        if (updatedCount > 0) {
            // console.log(`🔧 ${updatedCount} joints ${targetType} mis à jour`);
        }
    }
    
    // === MÉTHODES UTILITAIRES ===
    
    // Trouver un élément par son ID dans la scène
    findElementById(elementId) {
        if (window.SceneManager && window.SceneManager.scene) {
            return window.SceneManager.scene.getObjectByProperty('userData.id', elementId);
        }
        return null;
    }
    
    // Mettre à jour la position d'un élément dans son assise
    updateElementPositionInAssise(elementOrMesh, type, assiseIndex) {
        if (!elementOrMesh) return;
        
        const assiseHeight = this.calculateAssiseHeightForType(type, assiseIndex);
        let elementHeight, mesh, elementId;
        
        // Dàtecter si c'est un élément SceneManager ou un mesh THREE.js
        if (elementOrMesh.mesh && elementOrMesh.dimensions) {
            // C'est un élément SceneManager
            mesh = elementOrMesh.mesh;
            elementHeight = elementOrMesh.dimensions.height;
            elementId = elementOrMesh.id || 'unknown';
        } else if (elementOrMesh.userData) {
            // C'est un mesh THREE.js
            mesh = elementOrMesh;
            elementHeight = elementOrMesh.userData.dimensions?.height || 
                          elementOrMesh.geometry?.parameters?.height || 
                          elementOrMesh.scale?.y || 1;
            elementId = elementOrMesh.userData.id || 'unknown';
        } else {
            console.warn('🔧 updateElementPositionInAssise: objet non reconnu', elementOrMesh);
            return;
        }
        
        // CORRECTION DàFINITIVE: Pour l'assise 0, la face infàrieure DOIT àtre à l'àpaisseur du joint
        let centerY;
        if (assiseIndex === 0) {
            // Pour l'assise 0, la face infàrieure doit àtre à l'àpaisseur du joint (assiseHeight)
            // Donc le centre doit àtre à assiseHeight + hauteur/2
            centerY = assiseHeight + elementHeight / 2;
        } else {
            // Pour les autres assises, utilise la hauteur calculàe + hauteur/2
            centerY = assiseHeight + elementHeight / 2;
        }
        
        // Positionner l'élément (mesh.position.y repràsente le centre)
        mesh.position.y = centerY;
        
        // Vàrification finale
        const actualBaseY = centerY - elementHeight / 2;
        
    // Logs supprimés: repositionnement élément (détails)
        
        // Vàrification spàciale pour assise 0
        if (assiseIndex === 0) {
            if (Math.abs(actualBaseY - assiseHeight) < 0.001) {
                // Log supprimé: parfait face inférieure
            } else {
                console.error(`   ? ERREUR! Face infàrieure à ${actualBaseY} cm au lieu de ${assiseHeight} cm`);
            }
        }
    }
    
    /**
     * Supprime les joints associés à un élément (ex: joint horizontal d'une brique)
     */
    removeAssociatedJoints(elementId, assiseLevel, elementType) {
    // Log supprimé: début suppression joints associés
        
        // Vérifier si c'est une brique/bloc qui peut avoir un joint horizontal
        const elementData = this.sceneManager.wallElements.get(elementId);
        if (!elementData || !['brick', 'block'].includes(elementData.type)) {
            // Log supprimé: élément non éligible joints associés
            return;
        }
        
        // Récupérer l'objet Three.js de l'élément pour obtenir sa position
        const element = this.sceneManager.scene.getObjectById(elementData.id);
    if (!element) { // Log supprimé: élément Three.js non trouvé
            return;
        }
        
    // Log supprimé: recherche joints associés à la brique
        
        // Chercher tous les joints dans la même assise qui pourraient être associés
        const assiseData = this.assisesByType.get(elementType);
    if (!assiseData || !assiseData.has(assiseLevel)) { // Log supprimé: pas d'assise pour type
            return;
        }
        
        const assise = assiseData.get(assiseLevel);
        const elementsToRemove = [];
        
    // Logs supprimés: éléments dans assise & liste
        
        // Parcourir tous les éléments de l'assise pour trouver les joints associés
        for (const otherElementId of assise.elements) {
            if (otherElementId === elementId) continue;
            
            const otherElementData = this.sceneManager.wallElements.get(otherElementId);
            if (otherElementData && otherElementData.type === 'joint') {
                // Log supprimé: joint trouvé
                
                // Vérifier si c'est un joint horizontal associé (même position que la brique)
                const brickPos = element.position;
                const jointMesh = this.sceneManager.scene.getObjectById(otherElementData.id);
                const jointPos = jointMesh?.position;
                
                if (jointPos) {
                    const distanceX = Math.abs(brickPos.x - jointPos.x);
                    const distanceZ = Math.abs(brickPos.z - jointPos.z);
                    // Log supprimé: distance brique-joint
                    
                    if (distanceX < 0.1 && distanceZ < 0.1) {
                        // Log supprimé: joint horizontal associé détecté
                        elementsToRemove.push(otherElementId);
                    } else {
                        // Log supprimé: joint trop éloigné
                    }
                } else {
                    // Log supprimé: position joint non trouvée
                }
            }
        }
        
        // Log supprimé: nombre joints associés à supprimer
        
        // Supprimer les joints associés trouvés
        for (const jointId of elementsToRemove) {
            // Log supprimé: suppression joint associé
            
            // Supprimer directement du SceneManager wallElements et de la scène Three.js
            const jointElement = this.sceneManager.wallElements.get(jointId);
            if (jointElement) {
                // Retirer de la scène Three.js
                const jointMesh = this.sceneManager.scene.getObjectById(jointElement.id);
                if (jointMesh) {
                    this.sceneManager.scene.remove(jointMesh);
                    // Log supprimé: joint retiré de la scène
                }
                
                // Retirer des structures de données AssiseManager DIRECTEMENT (pas de récursion)
                const targetAssise = assise;
                if (targetAssise && targetAssise.elements.has(jointId)) {
                    targetAssise.elements.delete(jointId);
                    // Log supprimé: joint retiré des éléments d'assise
                }
                
                // Retirer de elementsByType directement
                const elementsForThisType = this.elementsByType.get(elementType);
                if (elementsForThisType && elementsForThisType.has(assiseLevel)) {
                    elementsForThisType.get(assiseLevel).delete(jointId);
                    // Log supprimé: joint retiré de elementsByType
                }
                
                // Retirer du SceneManager wallElements
                this.sceneManager.wallElements.delete(jointId);
                // Log supprimé: joint retiré du SceneManager
            }
        }
        
        // Log supprimé: fin suppression joints associés
    }
    
    /**
     * Vérifie si un joint a une brique/bloc associé dans la même assise
     */
    hasAssociatedBrick(jointId, assiseLevel, elementType) {
    // Log supprimé: vérification joint orphelin début
        
        // Récupérer la position du joint
        const jointElement = window.SceneManager?.elements?.get(jointId);
    if (!jointElement) { // Log supprimé: joint non trouvé wallElements
            return false;
        }
        
        const jointMesh = window.SceneManager?.scene?.getObjectById(jointElement.id);
    if (!jointMesh) { // Log supprimé: mesh joint non trouvé
            return false;
        }
        
        const jointPos = jointMesh.position;
    // Log supprimé: position du joint
        
        // Chercher des briques/blocs dans la même assise avec une position similaire
        const assiseData = this.assisesByType.get(elementType);
    if (!assiseData || !assiseData.has(assiseLevel)) { // Log supprimé: pas d'assise pour type (orphan check)
            return false;
        }
        
        const assise = assiseData.get(assiseLevel);
        let bricksFound = 0;
        
        for (const otherElementId of assise.elements) {
            if (otherElementId === jointId) continue;
            
            const otherElementData = window.SceneManager?.elements?.get(otherElementId);
            if (otherElementData && ['brick', 'block'].includes(otherElementData.type)) {
                const otherMesh = window.SceneManager?.scene?.getObjectById(otherElementData.id);
                if (otherMesh) {
                    const otherPos = otherMesh.position;
                    const distanceX = Math.abs(jointPos.x - otherPos.x);
                    const distanceZ = Math.abs(jointPos.z - otherPos.z);
                    
                    // Log supprimé: distance brique-joint (orphan check)
                    
                    if (distanceX < 0.1 && distanceZ < 0.1) {
                        // Log supprimé: brique associée trouvée (orphan check)
                        return true; // Joint a une brique associée
                    }
                    bricksFound++;
                }
            }
        }
        
    // Log supprimé: joint orphelin confirmé
        return false; // Aucune brique associée trouvée
    }
}

// Instance globale - S'assurer qu'elle est disponible immàdiatement
if (typeof window !== 'undefined') {
    window.AssiseManager = new AssiseManager();
    // console.log('? AssiseManager global cr\ avec màthodes:', 
    //     typeof window.AssiseManager.getAssiseTypeLabel === 'function');
} else {
    console.warn('🔧 Window non disponible pour AssiseManager');
}

