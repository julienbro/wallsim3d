// Gestionnaire des assises (rang�es de briques) - Version Multi-Types
class AssiseManager {
    constructor() {
        // Syst�me multi-stack: une stack d'assises par type d'�l�ment
        this.assisesByType = new Map(); // Map<type, Map<assiseIndex, assise>>
        this.elementsByType = new Map(); // Map<type, Map<assiseIndex, Set<elementId>>>
        this.gridHelpersByType = new Map(); // Map<type, Map<assiseIndex, gridHelper>>
        this.attachmentMarkersByType = new Map(); // Map<type, Map<assiseIndex, markers>>
        
        // Types d'�l�ments support�s - incluant les sous-types de briques et blocs
        this.supportedTypes = ['brick', 'block', 'insulation', 'custom', 'joint', 'linteau'];
        
        // Sous-types de briques support�s pour gestion d'assise ind�pendante
        this.brickSubTypes = ['M50', 'M57', 'M60', 'M65', 'M90'];
        
        // Sous-types de blocs support�s pour gestion d'assise ind�pendante
        this.blockSubTypes = ['HOLLOW', 'CELLULAR', 'ARGEX', 'TERRACOTTA'];
        
        // Sous-types de linteaux support�s pour gestion d'assise ind�pendante
        this.linteauSubTypes = ['LINTEAU_L120', 'LINTEAU_L140', 'LINTEAU_L160', 'LINTEAU_L180', 'LINTEAU_L200'];
        
        // Sous-types GLB support�s pour gestion d'assise ind�pendante
        this.glbSubTypes = ['hourdis_13_60', 'hourdis_16_60'];
        
        // Extension des types support�s avec les sous-types de briques, blocs, linteaux et GLB
        this.allSupportedTypes = [...this.supportedTypes, ...this.brickSubTypes, ...this.blockSubTypes, ...this.linteauSubTypes, ...this.glbSubTypes];
        
        // �tat actuel
        this.currentType = 'M65'; // Type d'assise actif (M65 par d�faut)
        this.currentAssiseByType = new Map(); // Map<type, assiseIndex> - assise active par type
        
        // Garde anti-boucle infinie pour le repositionnement
        this.isRepositioning = false;
        
        // Hauteur du joint horizontal par type d'assise (par d�faut 1.2cm)
        this.jointHeightByType = new Map();
        
        // Hauteur du joint par assise individuelle : Map<type, Map<assiseIndex, jointHeight>>
        this.jointHeightByAssise = new Map();
        
        for (const type of this.allSupportedTypes) {
            // CORRECTION: Les isolants et hourdis n'ont pas de joints horizontaux
            const defaultJointHeight = (type === 'insulation' || type.includes('hourdis')) ? 0 : 1.2;
            this.jointHeightByType.set(type, defaultJointHeight);
            this.jointHeightByAssise.set(type, new Map());
        }
        
        this.showAssiseGrids = false;
        this.showAttachmentMarkers = true; // Contr�le l'affichage des marqueurs d'accroche
        this.isInitialized = false;
        
        // Point d'accrochage dynamique qui suit la souris
        this.snapPoint = null; // Point d'accrochage unique
        this.showSnapPoint = true; // Afficher le point d'accrochage
        
        // Param�tres visuels
        this.gridColor = 0x3498db; // Couleur de la grille de l'assise
        this.activeGridColor = 0xe74c3c; // Couleur de la grille active
        this.attachmentMarkerColor = 0xf39c12; // Couleur des marqueurs d'accroche (orange)
        this.attachmentMarkerOpacity = 0.7; // Opacit� des marqueurs d'accroche
        this.gridOpacity = 0.3;
        this.activeGridOpacity = 0.6;
        
        // Propri�t�s d'animation pour les points d'accroche
        this.animationFrameId = null;
        this.animationRunning = false;
        
        // Initialiser les structures pour chaque type
        this.initializeTypeStructures();
    }

    // ? UTILITAIRE: V�rifier si un type est support� (incluant les types personnalis�s)
    isSupportedType(type) {
        // Types de base support�s
        if (this.allSupportedTypes.includes(type)) {
            return true;
        }
        
        // Types GLB sp�cifiques
        if (type && type.includes('hourdis')) {
            return true;
        }
        
        // Types personnalis�s (contiennent _CUSTOM_)
        if (type && type.includes('_CUSTOM_')) {
            // Extraire le type de base et v�rifier s'il est support�
            const baseType = type.split('_')[0];
            return this.allSupportedTypes.includes(baseType);
        }
        
        // Types coup�s (contiennent _HALF, _3Q, _1Q)
        if (type && (type.includes('_HALF') || type.includes('_3Q') || type.includes('_1Q'))) {
            const baseType = type.split('_')[0];
            return this.allSupportedTypes.includes(baseType);
        }
        
        return false;
    }

    // Initialiser les structures de donn�es pour tous les types support�s
    initializeTypeStructures() {
        for (const type of this.allSupportedTypes) {
            this.assisesByType.set(type, new Map());
            this.elementsByType.set(type, new Map());
            this.gridHelpersByType.set(type, new Map());
            this.attachmentMarkersByType.set(type, new Map());
            this.currentAssiseByType.set(type, 0);
        }
    }

    // S'assurer qu'un type est initialis� (pour les briques coup�es)
    ensureTypeInitialized(type) {
        if (!this.assisesByType.has(type)) {
            this.assisesByType.set(type, new Map());
            this.elementsByType.set(type, new Map());
            this.gridHelpersByType.set(type, new Map());
            this.attachmentMarkersByType.set(type, new Map());
            this.currentAssiseByType.set(type, 0);
            
            // ? CORRECTION: Utiliser la m�thode isSupportedType pour v�rifier
            if (!this.isSupportedType(type)) {
                // Pour les types personnalis�s, extraire le type de base
                const baseType = type.split('_')[0];
                if (this.isSupportedType(baseType)) {
                    console.log(`? Type personnalis� ${type} accept� (base: ${baseType})`);
                } else {
                    if (window.DEBUG_CONSTRUCTION) {
                        console.warn(`?? Type non support�: ${type}`);
                    }
                }
            }
        }
    }

    // Getter pour la hauteur du joint d'un type donn�
    getJointHeightForType(type) {
        return this.jointHeightByType.get(type) ?? 1.2;
    }

    // Setter pour la hauteur du joint d'un type donn�
    setJointHeightForType(type, height) {
        const h = Math.max(0.1, height); // Minimum 0.1 cm
        this.jointHeightByType.set(type, h);

        // Recalculer les hauteurs d'assises SEULEMENT pour ce type
        const assisesForType = this.assisesByType.get(type);
        for (const [index, assise] of assisesForType.entries()) {
            const newHeight = this.calculateAssiseHeightForType(type, index);
            assise.height = newHeight;
            
            // Mettre � jour les grilles
            if (assise.gridMesh) {
                assise.gridMesh.position.y = newHeight;
            }
            if (assise.jointGridMesh) {
                assise.jointGridMesh.position.y = newHeight + this.getMaxElementHeightInAssiseForType(type, index);
            }
            
            // Mettre � jour les �l�ments (repositionner SEULEMENT les blocs et briques, PAS les joints)
            for (const elementId of assise.elements) {
                const element = window.SceneManager.elements.get(elementId);
                if (element && element.mesh) {
                    // EXCLURE les joints du repositionnement - ils ont leur propre logique
                    if (element.isVerticalJoint || element.isHorizontalJoint) {
                        console.log(`?? Joint ${elementId} ignor� lors du repositionnement (a sa propre logique)`);
                        continue;
                    }
                    
                    // Utiliser updateElementPositionInAssise pour repositionner correctement les blocs/briques
                    this.updateElementPositionInAssise(element.mesh, type, index);
                    console.log(`?? Bloc/Brique ${elementId} repositionn� sur assise ${index} (${type}) � Y=${element.mesh.position.y}`);
                }
            }
        }
        
        this.updateAllGridVisibility();
        this.updateSnapPointHeight();
        if (typeof this.updateVerticalJointsForType === 'function') {
            this.updateVerticalJointsForType(type);
        }
        if (window.ConstructionTools && window.ConstructionTools.isInitialized) {
            window.ConstructionTools.updateGhostElement();
            if (window.ConstructionTools.suggestionGhosts && window.ConstructionTools.suggestionGhosts.length > 0) {
                const selectedElement = window.SceneManager?.selectedElement;
                if (selectedElement) {
                    window.ConstructionTools.createVerticalJointSuggestions(selectedElement);
                }
            }
        }
        this.updateUIComplete();
        console.log(`Hauteur du joint pour le type '${type}' mise � jour: ${h} cm`);
    }

    // Getter pour la hauteur du joint du type courant (compatibilit�)
    get jointHeight() {
        return this.getJointHeightForType(this.currentType);
    }

    // Setter pour la hauteur du joint du type courant (compatibilit�)
    set jointHeight(height) {
        this.setJointHeightForType(this.currentType, height);
    }

    // === GESTION DES HAUTEURS DE JOINT PAR ASSISE INDIVIDUELLE ===
    
    // Obtenir la hauteur de joint d'une assise sp�cifique
    getJointHeightForAssise(type, assiseIndex) {
        const jointsByType = this.jointHeightByAssise.get(type);
        if (!jointsByType) return this.getJointHeightForType(type);
        
        // Si hauteur sp�cifique d�finie pour cette assise, l'utiliser
        const specificHeight = jointsByType.get(assiseIndex);
        if (specificHeight !== undefined) {
            return specificHeight;
        }
        
        // Sinon, utiliser la hauteur par d�faut du type
        return this.getJointHeightForType(type);
    }
    
    // D�finir la hauteur de joint d'une assise sp�cifique
    setJointHeightForAssise(type, assiseIndex, height) {
        // PROTECTION ANTI-BOUCLE INFINIE: �viter les modifications pendant un repositionnement
        if (this.isRepositioning) {
            console.log(`?? PROTECTION ANTI-BOUCLE: setJointHeightForAssise �vit�e pendant repositionnement`);
            return false;
        }

        const h = Math.max(0.1, height); // Minimum 0.1 cm
        
        if (!this.jointHeightByAssise.has(type)) {
            this.jointHeightByAssise.set(type, new Map());
        }
        
        // V�rifier si la valeur a r�ellement chang�
        const currentHeight = this.jointHeightByAssise.get(type).get(assiseIndex);
        if (currentHeight !== undefined && Math.abs(currentHeight - h) < 0.001) {
            console.log(`?? Joint de l'assise ${assiseIndex} (${type}) d�j� � ${h} cm, pas de modification`);
            return false;
        }
        
        this.jointHeightByAssise.get(type).set(assiseIndex, h);
        
        // Recalculer les hauteurs de TOUTES les assises de ce type 
        // (car changer une assise affecte la position de toutes les suivantes)
        this.recalculateAssiseHeightsForType(type);
        
        // CORRECTION: Repositionner automatiquement tous les �l�ments existants de cette assise
        this.repositionElementsInAssise(type, assiseIndex);
        
        console.log(`?? Hauteur de joint de l'assise ${assiseIndex} (${type}) d�finie � ${h} cm`);
        this.updateUI();
        
        // NOUVEAU: Mettre � jour la hauteur du point de suivi apr�s modification des joints
        this.updateSnapPointHeight();
        
        return true;
    }

    // Repositionner automatiquement tous les �l�ments d'une assise apr�s changement de hauteur de joint
    repositionElementsInAssise(type, assiseIndex) {
        // Garde anti-boucle infinie
        if (this.isRepositioning) {
            console.log(`?? Repositionnement en cours, �vitement de la boucle infinie`);
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

        console.log(`?? REPOSITIONNEMENT automatique assise ${assiseIndex} (${type}) - nouvelle hauteur: ${newAssiseHeight}cm`);

        for (const elementId of assise.elements) {
            const element = window.SceneManager?.elements?.get(elementId);
            if (element && !element.isVerticalJoint && !element.isHorizontalJoint) {
                const targetCenterY = newAssiseHeight + element.dimensions.height / 2;
                const oldY = element.position.y;
                
                element.updatePosition(element.position.x, targetCenterY, element.position.z);
                repositionedCount++;
                
                console.log(`   ?? ${elementId}: ${oldY.toFixed(2)}cm ? ${targetCenterY.toFixed(2)}cm`);
            }
        }

        if (repositionedCount > 0) {
            console.log(`? ${repositionedCount} �l�ment(s) repositionn�(s) dans l'assise ${assiseIndex} (${type})`);
        }
        
        this.isRepositioning = false; // D�sactiver la garde
    }
    
    // Supprimer la hauteur de joint personnalis�e d'une assise (revient au d�faut du type)
    resetJointHeightForAssise(type, assiseIndex) {
        const jointsByType = this.jointHeightByAssise.get(type);
        if (jointsByType && jointsByType.has(assiseIndex)) {
            jointsByType.delete(assiseIndex);
            this.recalculateAssiseHeightsForType(type);
            console.log(`?? Hauteur de joint de l'assise ${assiseIndex} (${type}) r�initialis�e`);
            this.updateUI();
        }
    }
    
    // Recalculer toutes les hauteurs d'assises pour un type donn�
    recalculateAssiseHeightsForType(type) {
        const assisesForType = this.assisesByType.get(type);
        if (!assisesForType) return;
        
        for (const [index, assise] of assisesForType.entries()) {
            const newHeight = this.calculateAssiseHeightForType(type, index);
            assise.height = newHeight;
            
            // Mettre � jour la position des grilles
            if (assise.gridMesh) {
                assise.gridMesh.position.y = newHeight;
            }
            if (assise.jointGridMesh) {
                assise.jointGridMesh.position.y = newHeight + this.getMaxElementHeightInAssiseForType(type, index);
            }
            
            // Mettre � jour la position des �l�ments de cette assise
            for (const elementId of assise.elements) {
                const element = this.findElementById(elementId);
                if (element) {
                    this.updateElementPositionInAssise(element, type, index);
                }
            }
        }
        
        // Mettre � jour le plan de collision si c'est le type actuel
        if (type === this.currentType && window.SceneManager && typeof window.SceneManager.updateCollisionPlane === 'function') {
            const currentAssiseIndex = this.currentAssiseByType.get(type) || 0;
            const currentHeight = this.getAssiseHeight(currentAssiseIndex);
            window.SceneManager.updateCollisionPlane(currentHeight);
        }
    }

    // Getter pour les assises du type actuel (compatibilit� avec l'ancien code)
    get assises() {
        return this.assisesByType.get(this.currentType) || new Map();
    }

    // Getter pour les �l�ments du type actuel (compatibilit� avec l'ancien code)  
    get elements() {
        return this.elementsByType.get(this.currentType) || new Map();
    }

    // Getter pour les grilles du type actuel (compatibilit� avec l'ancien code)
    get gridHelpers() {
        return this.gridHelpersByType.get(this.currentType) || new Map();
    }

    // Getter pour les marqueurs du type actuel (compatibilit� avec l'ancien code)
    get attachmentMarkers() {
        return this.attachmentMarkersByType.get(this.currentType) || new Map();
    }

    // Getter pour l'assise active du type actuel (compatibilit� avec l'ancien code)
    get currentAssise() {
        return this.currentAssiseByType.get(this.currentType) || 0;
    }

    // Setter pour l'assise active du type actuel (compatibilit� avec l'ancien code)
    set currentAssise(value) {
        this.currentAssiseByType.set(this.currentType, value);
    }

    // Changer le type d'assise actif
    setActiveType(type) {
        if (!this.allSupportedTypes.includes(type)) {
            console.warn(`Type d'assise non support�: ${type}`);
            return false;
        }

        const previousType = this.currentType;
        this.currentType = type;

        // Masquer les grilles du type pr�c�dent
        if (previousType !== type) {
            this.hideGridsForType(previousType);
        }

        // Afficher les grilles du nouveau type
        this.updateAllGridVisibility();
        
        // Mettre � jour l'interface
        this.updateUI();
        
        console.log(`Type d'assise actif chang� de '${previousType}' vers '${type}'`);
        
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

    // M�thode pour changer le type d'assise actuel
    setCurrentType(type, skipToolChange = false) {
        // NOUVEAU: Si l'onglet Outils est en cours de mise � jour, ne pas interf�rer
        if (window.toolsTabUpdating) {
            console.log(`?? AssiseManager: Onglet Outils en cours de mise � jour, pas d'interf�rence avec ${type}`);
            return true; // Simuler le succ�s pour �viter les erreurs
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
        
        // ? CORRECTION: Utiliser la m�thode utilitaire pour v�rifier le support
        if (!this.isSupportedType(type)) {
            // console.warn(`Type non support�: ${type} (base: ${baseType})`);
            return false;
        }
        
        // ? CORRECTION: Calculer si c'est un type personnalis�
        const isCustomType = type && type.includes('_CUSTOM_');
        
        if (this.currentType === baseType || (isCustomType && this.currentType === type)) {
            return true; // D�j� le type actuel
        }
        
        // console.log(`Changement de type d'assise: ${this.currentType} ? ${baseType}`);
        this.currentType = baseType;
        
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
                console.log(`Activation automatique de l'outil: ${targetMode}`);
                window.ConstructionTools.setMode(targetMode, true); // preserveDimensions = true pour �viter changements non d�sir�s
            }
        }
        
        // Mettre � jour l'interface utilisateur
        this.updateUI();
        
        // Mettre � jour la visibilit� des grilles (seul le type actuel est visible)
        this.updateAllGridVisibility();
        
        // Mettre � jour la hauteur du point d'accrochage
        this.updateSnapPointHeight();
        
        // �mettre un �v�nement de changement de type
        document.dispatchEvent(new CustomEvent('assiseTypeChanged', {
            detail: { 
                newType: type,
                currentAssise: this.currentAssiseByType.get(type)
            }
        }));
        
        return true;
    }

    // Mettre � jour l'indicateur visuel du type de brique dans l'interface
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

    // Masquer toutes les grilles d'un type donn�
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
        
        // Cr�er l'assise par d�faut pour chaque type
        for (const type of this.allSupportedTypes) {
            this.createDefaultAssiseForType(type);
        }
        
        this.createSnapPoint(); // Cr�er le point d'accrochage
        this.setupEventListeners();
        this.updateUI(); // Mettre � jour l'interface avec les types d'assises
        this.isInitialized = true;
    }

    createDefaultAssiseForType(type) {
        // Cr�er la premi�re assise (assise 0) pour ce type
        this.addAssiseForType(type, 0);
        this.setActiveAssiseForType(type, 0);
    }

    createDefaultAssise() {
        // M�thode de compatibilit� - cr�e l'assise par d�faut pour le type actuel
        this.createDefaultAssiseForType(this.currentType);
    }

    // Ajouter une assise pour un type sp�cifique
    addAssiseForType(type, index = null) {
        if (!this.allSupportedTypes.includes(type)) {
            console.warn(`Type non support�: ${type}`);
            return null;
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
            height: this.calculateAssiseHeightForType(type, index), // Utiliser le calcul sp�cifique au type
            elements: new Set(),
            gridMesh: null,
            jointGridMesh: null,
            visible: true
        };

        assisesForType.set(index, assise);
        elementsForType.set(index, new Set());
        this.createAssiseGridForType(type, index);
        
        this.updateUI();
        
        // �mettre un �v�nement pour notifier qu'une assise a �t� ajout�e
        document.dispatchEvent(new CustomEvent('assiseElementsChanged', {
            detail: { 
                action: 'assiseAdded',
                assiseIndex: index,
                type: type
            }
        }));
        
        return assise;
    }

    // M�thode de compatibilit�
    addAssise(index = null) {
        return this.addAssiseForType(this.currentType, index);
    }

    // D�finir l'assise active pour un type sp�cifique
    setActiveAssiseForType(type, index) {
        if (!this.allSupportedTypes.includes(type)) {
            console.warn(`Type non support�: ${type}`);
            return false;
        }

        const assisesForType = this.assisesByType.get(type);
        if (!assisesForType.has(index)) {
            console.warn(`Assise ${index + 1} n'existe pas pour le type '${type}'`);
            return false;
        }

        const previousAssise = this.currentAssiseByType.get(type) || 0;
        this.currentAssiseByType.set(type, index);

        // Si c'est le type actuel, mettre � jour l'affichage
        if (type === this.currentType) {
            // Mettre � jour l'apparence et la visibilit� de toutes les grilles
            this.updateAllGridVisibility();
            
            // Mettre � jour l'apparence des grilles (couleur et opacit�)
            this.updateGridAppearanceForType(type, previousAssise);
            this.updateGridAppearanceForType(type, index);
            
            // Mettre � jour la position du point d'accrochage
            this.updateSnapPointHeight();
            
            // Mettre � jour les marqueurs d'accroche
            this.updateAttachmentMarkers();
            
            // CORRECTION: D�placer l'�l�ment fant�me � la hauteur de l'assise active avec logs d�taill�s
            if (window.ConstructionTools && window.ConstructionTools.ghostElement) {
                const assiseHeight = this.getAssiseHeight(index);
                const ghostHeight = window.ConstructionTools.ghostElement.dimensions.height;
                const ghostY = assiseHeight + ghostHeight / 2;
                
                window.ConstructionTools.ghostElement.updatePosition(
                    window.ConstructionTools.ghostElement.position.x,
                    ghostY,
                    window.ConstructionTools.ghostElement.position.z
                );
            }
            
            this.updateUI();
            
            // Notifier le changement d'assise pour la mise � jour du raycasting
            document.dispatchEvent(new CustomEvent('assiseChanged', {
                detail: { 
                    assise: index,
                    type: type,
                    height: this.getAssiseHeight(index) 
                }
            }));
            
            // Garder la synchronisation directe en fallback (au cas o� l'�v�nement ne fonctionne pas)
            if (window.ToolsTabManager) {
                window.ToolsTabManager.updateDisplay();
            }
        }
        
        return true;
    }

    // M�thode de compatibilit�
    setActiveAssise(index) {
        return this.setActiveAssiseForType(this.currentType, index);
    }

    // Supprimer une assise d'un type sp�cifique
    removeAssiseForType(type, index) {
        if (!this.allSupportedTypes.includes(type)) {
            console.warn(`Type non support�: ${type}`);
            return false;
        }

        const assisesForType = this.assisesByType.get(type);
        const elementsForType = this.elementsByType.get(type);

        if (assisesForType.has(index)) {
            const assise = assisesForType.get(index);
            
            // Supprimer les �l�ments de cette assise
            const nonJointElementCount = this.getNonJointElementCountForType(type, index);
            if (nonJointElementCount > 0) {
                if (!confirm(`L'assise ${index + 1} du type '${type}' contient ${nonJointElementCount} �l�ment(s). Voulez-vous vraiment la supprimer ?`)) {
                    return false;
                }
                
                // Supprimer tous les �l�ments
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
            
            // Si c'�tait l'assise active, passer � une autre
            if (this.currentAssiseByType.get(type) === index) {
                const availableAssises = Array.from(assisesForType.keys()).sort((a, b) => a - b);
                this.setActiveAssiseForType(type, availableAssises[0] || 0);
            }
            
            this.updateUI();
            
            // �mettre un �v�nement pour notifier qu'une assise a �t� supprim�e
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

    // M�thode de compatibilit�
    removeAssise(index) {
        return this.removeAssiseForType(this.currentType, index);
    }

    getAssiseHeight(index) {
        // Chercher dans le type actuel d'abord, puis dans tous les types
        const assisesForCurrentType = this.assisesByType.get(this.currentType);
        if (assisesForCurrentType && assisesForCurrentType.has(index)) {
            return assisesForCurrentType.get(index).height;
        }
        
        // Si pas trouv� dans le type actuel, chercher dans tous les types
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
        
        // Si le type n'existe pas, essayer avec le type de base (pour les briques coup�es)
        if (!assisesForType && type.includes('_')) {
            const baseType = type.split('_')[0];
            console.log(`?? AssiseManager: Type ${type} non trouv�, essai avec le type de base: ${baseType}`);
            assisesForType = this.assisesByType.get(baseType);
            
            // Si trouv� avec le type de base, utiliser ce type pour le calcul
            if (assisesForType) {
                type = baseType;
            }
        }
        
        // Si toujours pas trouv�, initialiser le type
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
        // Version de compatibilit� - utilise le type actuel
        return this.calculateAssiseHeightForType(this.currentType, index);
    }

    calculateAssiseHeightForType(type, index) {
        if (index === 0) {
            // ?? HOURDIS: L'assise 0 des hourdis commence � Y=0 (pas de joint de base)
            if (type.includes('hourdis')) {
                return 0;
            }
            
            // Assise 0 pour autres types : utilise la hauteur de joint sp�cifique ou celle par d�faut du type
            const jointHeight = this.getJointHeightForAssise(type, 0);
            return jointHeight;
        }
        
        // Pour les assises sup�rieures, calculer en accumulant les hauteurs individuelles
        let totalHeight = 0;
        
        // Accumulation depuis l'assise 0 jusqu'� l'assise demand�e
        for (let i = 0; i <= index; i++) {
            const jointHeightForThisAssise = this.getJointHeightForAssise(type, i);
            
            if (i === 0) {
                // Assise 0 : seulement la hauteur du joint
                totalHeight = jointHeightForThisAssise;
            } else {
                // Assises suivantes : hauteur de l'�l�ment + joint suivant
                const elementHeight = this.getDefaultElementHeight(type);
                totalHeight += elementHeight + jointHeightForThisAssise;
            }
        }
        
        // console.log(`?? Calcul assise ${index} (type ${type}) avec joints individuels:`);
        // console.log(`   - Hauteur totale calcul�e: ${totalHeight} cm`);
        
        return totalHeight;
    }

    // Obtenir la hauteur par d�faut d'un �l�ment selon son type
    getDefaultElementHeight(type) {
        // Pour les briques, essayer d'utiliser le BrickSelector s'il est disponible
        if (type === 'brick' && window.BrickSelector) {
            try {
                const currentBrick = window.BrickSelector.getCurrentBrick();
                if (currentBrick && currentBrick.height) {
                    return currentBrick.height;
                }
            } catch (error) {
                console.warn('Erreur lors de la r�cup�ration de la hauteur de brique depuis BrickSelector:', error);
            }
        }
        
        // CORRECTION: Pour les isolants, essayer d'utiliser le InsulationSelector s'il est disponible
        if (type === 'insulation' && window.InsulationSelector) {
            try {
                const currentInsulation = window.InsulationSelector.getCurrentInsulationData();
                if (currentInsulation && currentInsulation.height) {
                    // console.log(`?? CORRECTION isolant: Hauteur r�cup�r�e depuis InsulationSelector: ${currentInsulation.height}cm (au lieu de 20cm par d�faut)`);
                    return currentInsulation.height;
                }
            } catch (error) {
                console.warn('Erreur lors de la r�cup�ration de la hauteur d\'isolant depuis InsulationSelector:', error);
            }
        }
        
        // Pour les linteaux, essayer d'utiliser le LinteauSelector s'il est disponible
        if ((type === 'linteau' || this.linteauSubTypes.includes(type)) && window.LinteauSelector) {
            try {
                const currentLinteau = window.LinteauSelector.getCurrentLinteauData();
                // Logs de debug d�sactiv�s pour r�duire le bruit
                // console.log('?? Debug LinteauSelector:', {
                //     available: !!window.LinteauSelector,
                //     currentLinteau: currentLinteau,
                //     type: currentLinteau?.type,
                //     height: currentLinteau?.height
                // });
                if (currentLinteau && currentLinteau.height) {
                    // console.log(`??? Hauteur r�cup�r�e du LinteauSelector: ${currentLinteau.height} cm pour ${currentLinteau.type}`);
                    return currentLinteau.height;
                }
            } catch (error) {
                console.warn('Erreur lors de la r�cup�ration de la hauteur de linteau depuis LinteauSelector:', error);
            }
        }
        
        // Pour les sous-types de briques, utiliser les hauteurs sp�cifiques
        if (this.brickSubTypes.includes(type)) {
            const brickHeights = {
                'M50': 5,
                'M57': 5.7,
                'M60': 6,
                'M65': 6.5,
                'M90': 9
            };
            // console.log(`?? Hauteur sp�cifique pour ${type}: ${brickHeights[type]} cm`);
            return brickHeights[type];
        }
        
        const defaultHeights = {
            'brick': 6.5,      // Hauteur brique M65 (par d�faut)
            'block': 19,       // Hauteur bloc standard  
            'insulation': 20,  // Hauteur isolant standard
            'custom': 10,      // Hauteur par d�faut pour �l�ments custom
            'linteau': 19,     // Hauteur linteau standard
            
            // Sous-types de blocs avec leurs hauteurs sp�cifiques
            'HOLLOW': 19,      // Blocs creux (B9, B14, B19, B29) - hauteur 19 cm
            'CELLULAR': 25,    // B�ton cellulaire (BC_*) - hauteur 25 cm
            'ARGEX': 19,       // Blocs Argex - hauteur 19 cm
            'TERRACOTTA': 25,  // Terre cuite (TC_*) - hauteur 25 cm
            
            // Sous-types de linteaux avec leurs hauteurs sp�cifiques
            'LINTEAU_L120': 19,    // Linteau L120 - hauteur 19 cm
            'LINTEAU_L140': 19,    // Linteau L140 - hauteur 19 cm
            'LINTEAU_L160': 19,    // Linteau L160 - hauteur 19 cm
            'LINTEAU_L180': 19,    // Linteau L180 - hauteur 19 cm
            'LINTEAU_L200': 19     // Linteau L200 - hauteur 19 cm
        };
        
        if (defaultHeights[type]) {
            // console.log(`?? Hauteur sp�cifique pour ${type}: ${defaultHeights[type]} cm`);
            return defaultHeights[type];
        }
        
        // console.log(`?? Hauteur par d�faut utilis�e: 6.5 cm pour type ${type} (non reconnu)`);
        return 6.5;
    }

    // D�tecter le sous-type de brique � partir de ses dimensions
    detectBrickSubType(element) {
        if (!element || element.type !== 'brick') return null;
        
        const height = element.dimensions.height;
        const tolerance = 0.1; // Tol�rance pour la comparaison des hauteurs
        
        // Mapper les hauteurs aux types de briques
        if (Math.abs(height - 5) < tolerance) return 'M50';
        if (Math.abs(height - 5.7) < tolerance) return 'M57';
        if (Math.abs(height - 6) < tolerance) return 'M60';
        if (Math.abs(height - 6.5) < tolerance) return 'M65';
        if (Math.abs(height - 9) < tolerance) return 'M90';
        
        // Si le BrickSelector est disponible, essayer de r�cup�rer le type depuis les dimensions globales
        if (window.currentBrickDimensions && window.currentBrickDimensions.type) {
            const brickType = window.currentBrickDimensions.type;
            // Extraire le type de base (enlever les suffixes _3Q, _HALF, etc.)
            const baseType = brickType.split('_')[0];
            if (this.brickSubTypes.includes(baseType)) {
                return baseType;
            }
        }
        
        return null; // Type g�n�rique brick
    }

    // D�tecter le sous-type de bloc � partir de ses propri�t�s
    detectBlockSubType(element) {
        if (!element || element.type !== 'block') {
            return null;
        }
        
        
        // Si le BlockSelector est disponible, utiliser les informations du bloc courant
        if (window.BlockSelector) {
            try {
                // CORRECTION: Utiliser getCurrentBlockData() au lieu de getCurrentBlock()
                const currentBlock = window.BlockSelector.getCurrentBlockData();
                
                // Informations du bloc courant
                
                if (currentBlock && currentBlock.category) {
                    const category = currentBlock.category;
                    
                    
                    // Mapper les cat�gories aux types d'assises
                    switch (category) {
                        case 'hollow':
                        case 'cut': // Les blocs coupés sont des variantes des blocs creux
                            // Bloc de type HOLLOW détecté
                            return 'HOLLOW';
                        case 'cellular':
                            // Bloc de type CELLULAR détecté
                            return 'CELLULAR';
                        case 'argex':
                            return 'ARGEX';
                        case 'terracotta':
                            return 'TERRACOTTA';
                        case 'cellular-assise':
                            return 'CELLULAR';
                        default:
                            console.log(`?? Cat�gorie de bloc inconnue: ${category}, utilisation du type g�n�rique 'block'`);
                            return null;
                    }
                } else {
                    console.log(`?? getCurrentBlockData() existe mais pas de propri�t� 'category'`);
                    console.log(`   - currentBlock:`, currentBlock);
                }
            } catch (error) {
                console.warn('Erreur lors de la d�tection du type de bloc:', error);
            }
        } else {
            console.log(`?? BlockSelector non disponible`);
        }
        
        return null; // Type g�n�rique block
    }

    // M�thode pour basculer automatiquement vers l'assise du type de brique courante
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
        
        // Si pas trouv� dans le type actuel, chercher dans tous les types
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
        
        // Si l'assise est vide, utiliser une hauteur standard appropri�e
        if (assise.elements.size === 0) {
            // Utiliser la hauteur standard du type (6.5 cm pour brick M65)
            return this.getDefaultElementHeight(type);
        }
        
        // Utiliser la hauteur minimum standard comme base
        let maxHeight = this.getDefaultElementHeight(type);
        
        for (const elementId of assise.elements) {
            const element = window.SceneManager.elements.get(elementId);
            if (element) {
                // IMPORTANT : Exclure les joints debout du calcul de hauteur d'assise
                // Les joints debout ne doivent pas influencer la hauteur de l'assise suivante
                if (element.isVerticalJoint) {
                    continue; // Ignorer les joints debout
                }
                
                // Pour les autres �l�ments (briques, joints horizontaux), prendre la hauteur maximale
                maxHeight = Math.max(maxHeight, element.dimensions.height);
            }
        }
        
        return maxHeight;
    }

    addElementToAssise(elementId, assiseIndex = null) {
        // D�terminer le type de l'�l�ment et le sous-type pour les briques
        const element = window.SceneManager.elements.get(elementId);
        let elementType = this.currentType; // Par d�faut
        
        // console.log(`?? DEBUG addElementToAssise START: elementId=${elementId}, element.type=${element?.type}, currentType=${this.currentType}`);
        
        if (element && element.type) {
            // Pour les joints, utiliser le type de l'assise de r�f�rence stock�e
            if (element.type === 'joint') {
                // Priorit� 1: Information stock�e dans l'�l�ment joint lui-m�me
                if (element.referenceAssiseType) {
                    elementType = element.referenceAssiseType;
                    // console.log(`?? Joint plac� dans l'assise de r�f�rence stock�e: ${elementType}`);
                }
                // Priorit� 2: Information stock�e dans ConstructionTools
                else if (window.ConstructionTools && window.ConstructionTools.referenceAssiseType) {
                    elementType = window.ConstructionTools.referenceAssiseType;
                    // console.log(`?? Joint plac� dans l'assise de r�f�rence ConstructionTools: ${elementType}`);
                } 
                // Fallback: utiliser le type actuel
                else {
                    elementType = this.currentType;
                    // console.log(`?? Pas d'assise de r�f�rence pour le joint, utilisation du type actuel: ${elementType}`);
                }
            }
            // Pour les briques, d�tecter le sous-type sp�cifique
            else if (element.type === 'brick') {
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
                // Bloc détecté, tentative de détection du sous-type
                const blockSubType = this.detectBlockSubType(element);
                if (blockSubType) {
                    elementType = blockSubType;
                    // Basculer automatiquement vers ce type d'assise
                    if (this.currentType !== blockSubType) {
                        this.setCurrentType(blockSubType, true); // skipToolChange = true
                    }
                } else {
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
            // Mapper le type de l'�l�ment vers les types d'assise support�s
            else if (this.allSupportedTypes.includes(element.type)) {
                elementType = element.type;
                console.log(`?? Type support� directement: ${element.type}`);
            } else {
                if (window.DEBUG_CONSTRUCTION) {
                    console.log(`?? Type non support�: ${element.type}, utilisation du type actuel: ${this.currentType}`);
                }
            }
        } else {
            console.log(`?? �l�ment non trouv� ou sans type, utilisation du type actuel: ${this.currentType}`);
        }
        
        // console.log(`?? DEBUG addElementToAssise END: elementType final=${elementType}`);
        
        if (assiseIndex === null) {
            assiseIndex = this.currentAssiseByType.get(elementType);
        }
        
        // Utiliser la nouvelle m�thode multi-type avec le bon type
        this.addElementToAssiseForType(elementType, elementId, assiseIndex);
    }

    // Ajouter un �l�ment � une assise d'un type sp�cifique
    addElementToAssiseForType(type, elementId, assiseIndex = null) {
        if (!this.allSupportedTypes.includes(type)) {
            console.warn(`Type non support�: ${type}`);
            return false;
        }
        
        if (assiseIndex === null) {
            assiseIndex = this.currentAssiseByType.get(type);
        }
        
        const assisesForType = this.assisesByType.get(type);
        const elementsForType = this.elementsByType.get(type);
        
        // Cr�er l'assise si elle n'existe pas
        if (!assisesForType.has(assiseIndex)) {
            this.addAssiseForType(type, assiseIndex);
        }
        
        const assise = assisesForType.get(assiseIndex);
        assise.elements.add(elementId);
        elementsForType.get(assiseIndex).add(elementId);
        
        // Mettre � jour la position Y de l'�l�ment
        const element = window.SceneManager.elements.get(elementId);
        if (element) {
            // DEBUG: Afficher les propri�t�s de l'�l�ment (d�sactiv� pour r�duire les logs)
            // console.log(`?? DEBUG �l�ment ${elementId}:`, {
            //     isVerticalJoint: element.isVerticalJoint,
            //     isHorizontalJoint: element.isHorizontalJoint,
            //     currentY: element.position.y,
            //     type: element.type
            // });
            
            // EXCEPTION: Ne pas repositionner les joints (debout ou horizontaux)
            if (element.isVerticalJoint || element.isHorizontalJoint) {
                // 
                this.updateUI();
                // console.log(`�l�ment ${elementId} ajout� � l'assise ${assiseIndex} du type '${type}' (joint)`);
                return true;
            }
            
            // CORRECTION D�FINITIVE: Utiliser la vraie hauteur de l'assise (incluant les joints variables)
            const assiseHeight = this.getAssiseHeightForType(type, assiseIndex);
            
            // ?? HOURDIS: Pour les hourdis assise 0, l'objet doit �tre directement � Y=0 (base)
            let targetCenterY;
            if (type.includes('hourdis') && assiseIndex === 0) {
                // Pour hourdis assise 0 : TOUJOURS base � Y=0, donc centre � hauteur/2
                targetCenterY = element.dimensions.height / 2;
            } else {
                // Calcul normal pour autres types
                targetCenterY = assiseHeight + element.dimensions.height / 2;
            }
            
            // Positionner l'�l�ment - v�rifier si c'est un GLB ou un �l�ment traditionnel
            if (element.updatePosition && typeof element.updatePosition === 'function') {
                // �l�ment traditionnel (brick, block, etc.)
                element.updatePosition(element.position.x, targetCenterY, element.position.z);
            } else if (element.position) {
                // �l�ment GLB - cas sp�cial pour les hourdis
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
                    // Si c'est un hourdis positionn� par les outils, forcer Y=0
                    if (isHourdis) {
                        element.position.y = 0;
                    } else {
                        if (window.DEBUG_CONSTRUCTION) {
                            console.log(`?? GLB d�j� positionn� par les outils de construction, position Y conserv�e: ${element.position.y}`);
                        }
                    }
                } else {
                    // Positionner directement seulement si pas d�j� positionn�
                    element.position.y = targetCenterY;
                    console.log(`?? GLB positionn� directement � Y=${targetCenterY}`);
                }
            }
            
            // V�rification finale
            const actualBaseY = targetCenterY - element.dimensions.height / 2;
            
            // console.log(`�l�ment ${elementId} positionn� sur assise ${assiseIndex} (type: ${type}):`);
            // console.log(`  - Assise height: ${assiseHeight} cm`);
            // console.log(`  - Centre Y: ${targetCenterY} cm`);
            // console.log(`  - Face inf�rieure Y: ${actualBaseY} cm`);
            // console.log(`  - Hauteur: ${element.dimensions.height} cm`);
            
            // V�rification: la face inf�rieure doit �tre � la hauteur de l'assise
            if (Math.abs(actualBaseY - assiseHeight) < 0.001) {
                // console.log(`  ? PARFAIT! Face inf�rieure exactement � ${assiseHeight} cm`);
            } else {
                console.error(`  ? ERREUR! Face inf�rieure � ${actualBaseY} cm au lieu de ${assiseHeight} cm`);
            }
            
            // NOUVELLE FONCTIONNALIT�: Mise � jour automatique de la hauteur de joint de l'assise
            // selon les param�tres de l'�l�ment plac� (pour les blocs cellulaires notamment)
            // PROTECTION ANTI-BOUCLE INFINIE: Ne pas synchroniser pendant un repositionnement
            if (!this.isRepositioning && window.ConstructionTools && (element.type === 'block' || element.material === 'cellular-concrete' || element.material === 'cellular-assise')) {
                const jointSettings = window.ConstructionTools.getJointSettingsForElement(element);
                if (jointSettings && jointSettings.createJoints) {
                    // Convertir mm en cm pour la hauteur de joint horizontal
                    const jointHeightCm = jointSettings.horizontalThickness / 10;
                    
                    // V�rifier si la hauteur de joint a r�ellement chang� pour �viter les mises � jour inutiles
                    const currentJointHeight = this.getJointHeightForAssise(type, assiseIndex);
                    if (Math.abs(currentJointHeight - jointHeightCm) > 0.001) {
                        // Mettre � jour la hauteur de joint pour cette assise sp�cifique
                        this.setJointHeightForAssise(type, assiseIndex, jointHeightCm);
                        
                        console.log(`?? SYNCHRONISATION JOINT: Assise ${assiseIndex} (${type}) mise � jour avec joint de ${jointHeightCm}cm (${jointSettings.horizontalThickness}mm) selon �l�ment ${elementId} (${element.material})`);
                    }
                }
            } else if (this.isRepositioning) {
                console.log(`?? PROTECTION ANTI-BOUCLE: Synchronisation joint �vit�e pendant repositionnement`);
            }
        }
        
        this.updateUI();
        // console.log(`�l�ment ${elementId} ajout� � l'assise ${assiseIndex} du type '${type}'`);

        // ACTIVATION AUTOMATIQUE DES GRILLES lors du placement d'un �l�ment
        if (!this.showAssiseGrids) {
            this.showAssiseGrids = true;
            this.updateAllGridVisibility();
            // console.log('?? Grilles d\'assises activ�es automatiquement lors du placement d\'un �l�ment');
            
            // Mettre � jour l'affichage du bouton dans l'onglet outils
            if (window.ToolsTabManager) {
                // Les boutons se mettent � jour automatiquement via les �v�nements
                            }
        }

        // �mettre un �v�nement pour notifier les changements d'�l�ments
        document.dispatchEvent(new CustomEvent('assiseElementsChanged', {
            detail: { 
                action: 'added',
                elementId: elementId,
                assiseIndex: assiseIndex,
                type: type
            }
        }));

        // Mettre � jour la taille des grilles si n�cessaire (nouvelle fonctionnalit�)
        // Attendre un peu pour que l'�l�ment soit bien ajout� avant de recalculer
        setTimeout(() => {
            this.updateAllGridSizes();
        }, 100);

        // Mettre � jour les marqueurs d'accroche si n�cessaire
        const currentAssiseForType = this.currentAssiseByType.get(type);
        if (currentAssiseForType > assiseIndex) {
            // Un �l�ment a �t� ajout� � une assise inf�rieure, mettre � jour les marqueurs
            this.updateAttachmentMarkers();
        }
        
        return true;
    }

    removeElementFromAssise(elementId) {
        let removedFromAssise = null;
        let removedFromType = null;
        
        // Rechercher dans tous les types
        for (const type of this.supportedTypes) {
            const assisesForType = this.assisesByType.get(type);
            const elementsForType = this.elementsByType.get(type);
            
            for (const [assiseIndex, assise] of assisesForType.entries()) {
                if (assise.elements.has(elementId)) {
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
            console.log(`�l�ment ${elementId} retir� de l'assise ${removedFromAssise} (type: ${removedFromType})`);
            
            // �mettre un �v�nement pour notifier les changements d'�l�ments
            document.dispatchEvent(new CustomEvent('assiseElementsChanged', {
                detail: { 
                    action: 'removed',
                    elementId: elementId,
                    assiseIndex: removedFromAssise,
                    type: removedFromType
                }
            }));
            
            // Mettre � jour la taille des grilles apr�s suppression (nouvelle fonctionnalit�)
            // Attendre un peu pour que l'�l�ment soit bien supprim� avant de recalculer
            setTimeout(() => {
                this.updateAllGridSizes();
            }, 100);
            
            // Mettre � jour les marqueurs d'accroche si n�cessaire
            const currentAssiseForType = this.currentAssiseByType.get(removedFromType);
            if (currentAssiseForType >= removedFromAssise) {
                // Un �l�ment a �t� retir� d'une assise inf�rieure ou de l'assise courante, mettre � jour les marqueurs
                this.updateAttachmentMarkers();
            }
        }
        
        return removedFromAssise;
    }

    // Nouvelle m�thode pour r�cup�rer l'assise d'un �l�ment
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

    // M�thode pour r�cup�rer � la fois l'assise et le type d'un �l�ment
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

    // Compter les �l�ments non-joints dans une assise d'un type sp�cifique
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

    // Compter les �l�ments non-joints dans une assise du type actuel (compatibilit�)
    getNonJointElementCount(assiseIndex) {
        return this.getNonJointElementCountForType(this.currentType, assiseIndex);
    }

    // V�rifier si un �l�ment peut �tre s�lectionn� (pas d'assise inf�rieure quand une sup�rieure est active)
    canSelectElement(elementId, showLog = false) {
        // Utiliser la m�thode robuste qui cherche dans tous les types
        const elementInfo = this.getElementAssiseAndType(elementId);
        
        if (showLog) {
            // console.log(`?? DEBUG canSelectElement: elementId=${elementId}, elementInfo=${JSON.stringify(elementInfo)}`);
        }
        
        if (!elementInfo) {
            // if (showLog) console.log(`?? DEBUG: �l�ment ${elementId} non dans une assise - autoris�`);
            return true; // �l�ment non dans une assise = s�lectionnable
        }
        
        const { assiseIndex: elementAssise, type: elementType } = elementInfo;
        
        if (showLog) {
            // console.log(`?? DEBUG: elementAssise=${elementAssise}, elementType=${elementType}`);
        }
        
        // Seule l'assise active pour ce type doit �tre accessible
        const currentAssiseForType = this.currentAssiseByType.get(elementType);
        const canSelect = elementAssise === currentAssiseForType;
        
        if (showLog) {
            // console.log(`?? DEBUG: currentAssiseForType=${currentAssiseForType}, elementAssise=${elementAssise}, canSelect=${canSelect}`);
        }
        
        // Log critique seulement si demand� (interactions r�elles, pas v�rifications de routine)
        if (!canSelect && showLog) {
            // console.log(`?? BLOCAGE: �l�ment ${elementId} (assise ${elementAssise}, type: ${elementType}) bloqu� car assise active = ${currentAssiseForType}`);
        }
        
        return canSelect;
    }

    // Calculer la taille dynamique de la grille en fonction des �l�ments pr�sents dans la sc�ne
    calculateDynamicGridSize() {
        if (!window.SceneManager || window.SceneManager.elements.size === 0) {
            return 200; // Taille par d�faut si pas d'�l�ments
        }
        
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        
        // Analyser tous les �l�ments de la sc�ne pour calculer les limites
        window.SceneManager.elements.forEach(element => {
            const pos = element.position;
            const dim = element.dimensions;
            
            // Calculer les limites en tenant compte de la taille des �l�ments
            const halfLength = dim.length / 2;
            const halfWidth = dim.width / 2;
            
            minX = Math.min(minX, pos.x - halfLength);
            maxX = Math.max(maxX, pos.x + halfLength);
            minZ = Math.min(minZ, pos.z - halfWidth);
            maxZ = Math.max(maxZ, pos.z + halfWidth);
        });
        
        // Calculer la taille n�cessaire avec exactement 2m (200cm) de marge de chaque c�t�
        const rangeX = maxX - minX + 400; // +400cm = +200cm de chaque c�t� en X
        const rangeZ = maxZ - minZ + 400; // +400cm = +200cm de chaque c�t� en Z
        const maxRange = Math.max(rangeX, rangeZ);
        
        // Arrondir � la dizaine sup�rieure pour une grille propre
        const finalSize = Math.ceil(maxRange / 10) * 10;
        
        // Taille minimale de 400cm (pour garantir 2m de marge m�me avec de petits �l�ments)
        // Taille maximale de 1200cm pour �viter les performances
        return Math.min(Math.max(finalSize, 400), 1200);
    }

    // Cr�er la grille pour une assise d'un type sp�cifique
    createAssiseGridForType(type, index) {
        const assisesForType = this.assisesByType.get(type);
        const gridHelpersForType = this.gridHelpersByType.get(type);
        
        const assise = assisesForType.get(index);
        if (!assise) return;
        
        const height = assise.height;
        const size = this.calculateDynamicGridSize(); // Taille adaptative
        const divisions = size; // Garder 1 division par cm pour la pr�cision
        
        // Grille principale de l'assise
        const gridHelper = new THREE.GridHelper(size, divisions, this.gridColor, this.gridColor);
        gridHelper.position.y = height;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = index === this.currentAssiseByType.get(type) ? this.activeGridOpacity : this.gridOpacity;
        // Seule la grille de l'assise active du type actuel est visible
        gridHelper.visible = this.showAssiseGrids && (type === this.currentType) && (index === this.currentAssiseByType.get(type));
        
        // Grille du joint (plan sup�rieur)
        const jointHeight = height + this.getMaxElementHeightInAssise(index) + this.getJointHeightForType(type);
        const jointGrid = new THREE.GridHelper(size, divisions, 0x95a5a6, 0x95a5a6);
        jointGrid.position.y = jointHeight;
        jointGrid.material.transparent = true;
        jointGrid.material.opacity = 0.2;
        jointGrid.visible = false; // Toujours invisible
        
        // Ajouter � la sc�ne
        window.SceneManager.scene.add(gridHelper);
        window.SceneManager.scene.add(jointGrid);
        
        // Stocker les r�f�rences
        assise.gridMesh = gridHelper;
        assise.jointGridMesh = jointGrid;
        
        gridHelpersForType.set(index, { main: gridHelper, joint: jointGrid });
    }

    // M�thode de compatibilit�
    createAssiseGrid(index) {
        this.createAssiseGridForType(this.currentType, index);
    }

    // Supprimer la grille d'une assise d'un type sp�cifique
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

    // M�thode de compatibilit�
    removeAssiseGrid(index) {
        this.removeAssiseGridForType(this.currentType, index);
    }

    // Recalculer et redimensionner toutes les grilles existantes
    updateAllGridSizes() {
        const newSize = this.calculateDynamicGridSize();
        
        // Calculer les d�tails pour le log
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
            
            // console.log(`?? Mise � jour des grilles:`);
            // console.log(`   �l�ments �tendus de X=${minX.toFixed(1)}cm � X=${maxX.toFixed(1)}cm (${(maxX-minX).toFixed(1)}cm)`);
            // console.log(`   �l�ments �tendus de Z=${minZ.toFixed(1)}cm � Z=${maxZ.toFixed(1)}cm (${(maxZ-minZ).toFixed(1)}cm)`);
            // console.log(`   Nouvelle taille grille: ${newSize}cm (avec marge de 200cm de chaque c�t�)`);
        } else {
            // console.log(`?? Mise � jour des grilles: ${newSize}cm (taille par d�faut)`);
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
                
                // Cr�er les nouvelles grilles avec la bonne taille
                const height = assise.height;
                const divisions = newSize;
                
                // Nouvelle grille principale
                const gridHelper = new THREE.GridHelper(newSize, divisions, this.gridColor, this.gridColor);
                gridHelper.position.y = height;
                gridHelper.material.transparent = true;
                gridHelper.material.opacity = index === this.currentAssiseByType.get(type) ? this.activeGridOpacity : this.gridOpacity;
                gridHelper.visible = this.showAssiseGrids && (type === this.currentType) && (index === this.currentAssiseByType.get(type));
                
                // Nouvelle grille du joint
                const jointHeight = height + this.getMaxElementHeightInAssise(index) + this.getJointHeightForType(type);
                const jointGrid = new THREE.GridHelper(newSize, divisions, 0x95a5a6, 0x95a5a6);
                jointGrid.position.y = jointHeight;
                jointGrid.material.transparent = true;
                jointGrid.material.opacity = 0.2;
                jointGrid.visible = false;
                
                // Ajouter � la sc�ne
                window.SceneManager.scene.add(gridHelper);
                window.SceneManager.scene.add(jointGrid);
                
                // Mettre � jour les r�f�rences
                assise.gridMesh = gridHelper;
                assise.jointGridMesh = jointGrid;
                grids.main = gridHelper;
                grids.joint = jointGrid;
            }
        }
    }

    // Mettre � jour l'apparence d'une grille pour un type sp�cifique
    updateGridAppearanceForType(type, index) {
        const gridHelpersForType = this.gridHelpersByType.get(type);
        
        if (!gridHelpersForType || !gridHelpersForType.has(index)) return;
        
        const grids = gridHelpersForType.get(index);
        const isActive = (index === this.currentAssiseByType.get(type)) && (type === this.currentType);
        
        // Mettre � jour l'apparence de la grille principale
        grids.main.material.color.setHex(this.gridColor); // ? TOUJOURS GARDER LA COULEUR BLEUE
        grids.main.material.opacity = isActive ? this.activeGridOpacity : this.gridOpacity;
        // Seule la grille de l'assise active du type actuel est visible
        grids.main.visible = this.showAssiseGrids && isActive;
        
        // Masquer compl�tement le plan sup�rieur - seule la grille active doit �tre visible
        grids.joint.visible = false;
    }

    // M�thode de compatibilit�
    updateGridAppearance(index) {
        this.updateGridAppearanceForType(this.currentType, index);
    }

    setJointHeight(height) {
        // Utilise la nouvelle m�thode qui ne modifie que le type actuel
        this.setJointHeightForType(this.currentType, height);
        
        // Forcer la mise � jour de l'interface pour refl�ter le changement
        this.updateUI();
    }

    toggleAssiseGrids() {
        this.showAssiseGrids = !this.showAssiseGrids;
        
        // Appliquer le changement � tous les types (incluant les sous-types de briques)
        for (const type of this.allSupportedTypes) {
            const gridHelpersForType = this.gridHelpersByType.get(type);
            if (!gridHelpersForType) continue;
            
            const currentAssiseForType = this.currentAssiseByType.get(type);
            
            for (const [index, grids] of gridHelpersForType.entries()) {
                // Seule la grille de l'assise active du type actuel est visible
                const isActiveForCurrentType = (type === this.currentType) && (index === currentAssiseForType);
                grids.main.visible = this.showAssiseGrids && isActiveForCurrentType;
                
                // Masquer compl�tement tous les plans sup�rieurs
                grids.joint.visible = false;
            }
        }
        
        // Mettre � jour la visibilit� du point d'accrochage
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
        // console.log(`?? Force l'affichage de seulement la grille active (Type: ${this.currentType}, Assise: ${this.currentAssiseByType.get(this.currentType)})`);
        
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
            activeGrids.joint.visible = false; // Toujours masqu�
            console.log(`? Grille active affich�e: Type ${this.currentType}, Assise ${currentAssiseIndex}`);
        }
        
        // Mettre � jour la visibilit� du point d'accrochage
        if (this.snapPoint) {
            this.snapPoint.visible = this.showAssiseGrids && this.showSnapPoint;
        }
    }

    setupEventListeners() {
        // �couter les changements dans l'interface
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupUIEventListeners();
            });
        } else {
    const copyAssiseBtn = document.getElementById('copyAssiseBtn');
            // Le DOM est d�j� charg�, configurer imm�diatement
            this.setupUIEventListeners();
        }
        
        // �couter les mouvements de souris pour mettre � jour le point d'accrochage
        this.setupMouseTracking();
        
        // Configurer les �v�nements pour les onglets de types
        this.setupTypeTabEvents();
    }

    setupMouseTracking() {
        // �couter l'�v�nement personnalis� cursorMove �mis par le scene manager
        document.addEventListener('cursorMove', (event) => {
            if (this.snapPoint && this.showSnapPoint) {
                const { x, z } = event.detail;
                this.updateSnapPointPosition(x, z);
            }
        });
    }

    setupUIEventListeners() {
        // �v�nements pour les contr�les d'assise
        const assiseSelect = document.getElementById('assiseSelect');
        const jointHeightInput = document.getElementById('jointHeight');
        const addAssiseBtn = document.getElementById('addAssise');
        const removeAssiseBtn = document.getElementById('removeAssise');
        const toggleGridsBtn = document.getElementById('toggleAssiseGrids');
        
        //         // console.log('Bouton addAssise trouv�:', !!addAssiseBtn);
        
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
            // CORRECTION: Supprimer les anciens listeners pour �viter les doublons
            if (this.handleAddAssise) {
                addAssiseBtn.removeEventListener('click', this.handleAddAssise);
            }
            
            this.handleAddAssise = () => {
                // console.log('Bouton Ajouter Assise cliqu�');
                const assisesForCurrentType = this.assisesByType.get(this.currentType);
                const newIndex = assisesForCurrentType.size;
                this.addAssiseForType(this.currentType, newIndex);
                this.setActiveAssiseForType(this.currentType, newIndex);
            };
            
            addAssiseBtn.addEventListener('click', this.handleAddAssise);
        } else {
            console.warn('Bouton addAssise non trouv� dans le DOM');
        }
        
        if (removeAssiseBtn) {
            // CORRECTION: Supprimer les anciens listeners pour �viter les doublons
            if (this.handleRemoveAssise) {
                removeAssiseBtn.removeEventListener('click', this.handleRemoveAssise);
            }
            
            this.handleRemoveAssise = () => {
                // console.log('Bouton Supprimer Assise cliqu�');
                const assisesForCurrentType = this.assisesByType.get(this.currentType);
                if (assisesForCurrentType.size > 1) {
                    const currentAssiseForType = this.currentAssiseByType.get(this.currentType);
                    this.removeAssiseForType(this.currentType, currentAssiseForType);
                } else {
                    alert('Impossible de supprimer la derni�re assise');
                }
            };
            
            removeAssiseBtn.addEventListener('click', this.handleRemoveAssise);
        } else {
            console.warn('Bouton removeAssise non trouv� dans le DOM');
        }
        
        if (toggleGridsBtn) {
            // CORRECTION: Supprimer les anciens listeners pour �viter les doublons
            if (this.handleToggleGrids) {
                toggleGridsBtn.removeEventListener('click', this.handleToggleGrids);
            }
            
            this.handleToggleGrids = () => {
                // console.log('Bouton Toggle Grilles cliqu�');
                this.toggleAssiseGrids();
            };
            
            toggleGridsBtn.addEventListener('click', this.handleToggleGrids);
        } else {
            console.warn('Bouton toggleAssiseGrids non trouv� dans le DOM');
        }

        // Event listener pour les marqueurs d'accroche
        const toggleMarkersBtn = document.getElementById('toggleAttachmentMarkers');
        if (toggleMarkersBtn) {
            // Supprimer l'ancien event listener s'il existe
            if (this.handleToggleMarkers) {
                toggleMarkersBtn.removeEventListener('click', this.handleToggleMarkers);
            }
            
            this.handleToggleMarkers = () => {
                // console.log('Bouton Toggle Marqueurs d\'Accroche cliqu�');
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
                    const targetStr = prompt(`Copier l'assise ${sourceIndex + 1} (${type.toUpperCase()}) vers quelle assise ?\n- Entrez un num e9ro (1, 2, 3, ...)\n- L'assise sera cr e9 e9e si elle n'existe pas\nAssises existantes: ${existing.map(i=>i+1).join(', ')}`, `${sourceIndex + 2}`);
                    if (targetStr === null) return; // annul e9
                    const targetHuman = parseInt(targetStr, 10);
                    if (isNaN(targetHuman) || targetHuman < 1) {
                        alert("Num e9ro d'assise invalide.");
                        return;
                    }
                    const targetIndex = targetHuman - 1;
                    const result = this.copyAssiseTo(type, sourceIndex, targetIndex, { includeJoints: true });
                    if (result?.copiedCount >= 0) {
                        this.setActiveAssiseForType(type, targetIndex);
                        alert(`Copi e9 ${result.copiedCount}  e9l e9ment(s) de l'assise ${sourceIndex + 1} vers ${targetHuman}.`);
                    }
                } catch (e) {
                    console.error('Erreur copie assise:', e);
                    alert('Erreur lors de la copie de l\'assise. Voir console.');
                }
            };
            copyAssiseBtn.addEventListener('click', this.handleCopyAssise);
        }
            // Mettre � jour le texte initial du bouton
            toggleMarkersBtn.textContent = this.showAttachmentMarkers ? 'Masquer Marqueurs' : 'Marqueurs d\'Accroche';
            toggleMarkersBtn.className = `btn btn-sm ${this.showAttachmentMarkers ? 'btn-warning' : 'btn-info'}`;
        } else {
            console.warn('Bouton toggleAttachmentMarkers non trouv� dans le DOM');
        }
        
        // Configurer les �v�nements pour la vue d'ensemble globale
        this.setupGlobalOverviewEvents();
        
        // Mettre � jour l'interface maintenant que les �l�ments DOM sont disponibles
        this.updateUI();
        // console.log('? setupUIEventListeners termin�, updateUI() appel�');
    }

    // Copier tout le contenu d'une assise vers une autre (m eame type)
    // options: { includeJoints: boolean }
    copyAssiseTo(type, sourceIndex, targetIndex, options = {}) {
        const includeJoints = options.includeJoints === true; // par d e9faut on copie aussi les joints horizontaux/verticaux

        if (!this.allSupportedTypes.includes(type)) {
            console.warn(`Type non support e9 pour copie: ${type}`);
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

        // Pour stabilit e9: prendre un snapshot des IDs
        const elementIds = Array.from(sourceAssise.elements);
        for (const elementId of elementIds) {
            const original = window.SceneManager?.elements?.get(elementId);
            if (!original) continue;

            // Filtre joints si n e9cessaire
            if (!includeJoints && (original.isVerticalJoint || original.isHorizontalJoint || original.type === 'joint')) {
                continue;
            }

            // Cr e9er une nouvelle instance WallElement avec les m eames propri e9t e9s
            let newElement;
            try {
                newElement = new WallElement({
                    type: original.type,
                    material: original.material,
                    x: original.position.x,
                    y: original.position.y, // sera r e9ajust e9 par addElementToAssiseForType
                    z: original.position.z,
                    length: original.dimensions.length,
                    width: original.dimensions.width,
                    height: original.dimensions.height,
                    rotation: original.rotation || 0,
                    blockType: original.blockType,
                    brickType: original.brickType
                });
            } catch (e) {
                console.warn('Impossible de cloner un  e9l e9ment, skip', original, e);
                continue;
            }

            // Marquage joints si c'est un joint
            if (original.isVerticalJoint || original.isHorizontalJoint || original.type === 'joint') {
                newElement.isVerticalJoint = !!original.isVerticalJoint;
                newElement.isHorizontalJoint = !!original.isHorizontalJoint;
                newElement.type = 'joint';
            }

            // Ajouter  e0 la sc e8ne/collection
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
        // CORRECTION: M�thode pour r�initialiser les �v�nements UI sans duplication
        //         this.setupUIEventListeners();
    }

    updateUI() {
        // Mettre � jour le s�lecteur d'assise (pour le type actuel)
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

        // Mettre � jour les onglets de types d'assises
        this.updateTypeTabsUI();
        
        // Mettre � jour l'affichage du joint
        const jointHeightInput = document.getElementById('jointHeight');
        if (jointHeightInput) {
            jointHeightInput.value = this.jointHeight;
        }
        
        // Mettre � jour les statistiques (pour le type actuel)
        const assiseCountSpan = document.getElementById('assiseCount');
        if (assiseCountSpan) {
            const assisesForCurrentType = this.assisesByType.get(this.currentType);
            const elementsForCurrentType = this.elementsByType.get(this.currentType);
            
            // V�rifier que les collections existent
            if (!assisesForCurrentType || !elementsForCurrentType) {
                return; // Sortir silencieusement si les types ne sont pas initialis�s
            }
            
            // Compter les �l�ments par assise pour le type actuel (sans les joints)
            let totalElements = 0;
            let filledAssises = 0;
            
            for (const [index, assise] of assisesForCurrentType.entries()) {
                const elementCount = this.getNonJointElementCountForType(this.currentType, index);
                totalElements += elementCount;
                if (elementCount > 0) {
                    filledAssises++;
                }
            }
            
            const detailText = totalElements > 0 ? ` (${totalElements} �l�ments, ${filledAssises} actives)` : ' (vides)';
            assiseCountSpan.textContent = `${this.currentType.toUpperCase()}: ${assisesForCurrentType.size} assises${detailText}`;
        }
        
        // Mettre � jour l'�tat des boutons
        const removeAssiseBtn = document.getElementById('removeAssise');
        if (removeAssiseBtn) {
            const assisesForCurrentType = this.assisesByType.get(this.currentType);
            removeAssiseBtn.disabled = (assisesForCurrentType.size <= 1);
        }
        
        const toggleGridsBtn = document.getElementById('toggleAssiseGrids');
        if (toggleGridsBtn) {
            toggleGridsBtn.textContent = this.showAssiseGrids ? 'Masquer Grilles' : 'Afficher Grilles';
        }
        
        // Mettre � jour les informations sur l'assise active
        const activeAssiseInfo = document.getElementById('activeAssiseInfo');
        if (activeAssiseInfo) {
            const currentAssiseForType = this.currentAssiseByType.get(this.currentType);
            const typeLabel = this.getAssiseTypeLabelForType(this.currentType, currentAssiseForType);
            const description = this.getAssiseDescriptionForType(this.currentType, currentAssiseForType);
            activeAssiseInfo.querySelector('.detail-value').textContent = `${typeLabel} active: ${description}`;
        }

        // Mettre � jour la vue d'ensemble globale
        this.updateGlobalOverview();

        // Mettre � jour les informations du type actuel
        this.updateCurrentTypeInfo();
        
        // NOUVEAU: Mettre � jour la hauteur du point de suivi apr�s toute modification
        this.updateSnapPointHeight();
    }

    // === NOUVELLES M�THODES POUR LA VUE D'ENSEMBLE GLOBALE ===

    // Mettre � jour la vue d'ensemble globale
    updateGlobalOverview() {
        this.updateOverviewStats();
        this.updateGlobalAssiseList();
    }

    // Mettre � jour les statistiques globales
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

        // Mettre � jour l'affichage
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

    // Mettre � jour la liste globale des assises
    updateGlobalAssiseList() {
        const globalAssiseList = document.getElementById('globalAssiseList');
        if (!globalAssiseList) return;

        // Collecter toutes les assises de tous les types
        // Règle: afficher les assises ayant des éléments ET les assises inférieures créées lors d'une copie
        const allAssises = [];
        for (const type of this.allSupportedTypes) {
            const assisesForType = this.assisesByType.get(type);
            if (!assisesForType || assisesForType.size === 0) continue;

            // Déterminer l'index maximum existant pour ce type
            const maxIndex = Math.max(...Array.from(assisesForType.keys()));

            for (let index = 0; index <= maxIndex; index++) {
                const assise = assisesForType.get(index) || null;
                const elementCount = this.getNonJointElementCountForType(type, index);
                const shouldShow = elementCount > 0 || (assise && assise.createdByCopyIntermediate === true);
                if (!shouldShow) continue;

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

        // G�n�rer le HTML
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

            item.innerHTML = `
                <div class="assise-item-info">
                    <span class="assise-type-badge ${type}">${type.toUpperCase()}</span>
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
        // console.log(`?? Navigation vers l'assise ${index + 1} du type ${type}`);
        
        // Changer le type actuel si n�cessaire
        if (type !== this.currentType) {
            this.setCurrentType(type);
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
        
        // Mettre � jour l'interface
        this.updateUI();
        
        // Optionnel: centrer la vue sur cette assise
        this.focusOnAssise(type, index);
    }

    // Centrer la vue sur une assise sp�cifique (optionnel)
    focusOnAssise(type, index) {
        const assisesForType = this.assisesByType.get(type);
        const assise = assisesForType.get(index);
        
        if (assise && assise.gridMesh && window.SceneManager?.camera && window.SceneManager?.controls) {
            const position = assise.gridMesh.position;
            const camera = window.SceneManager.camera;
            const controls = window.SceneManager.controls;
            
            // Animer la cam�ra vers l'assise
            const targetPosition = {
                x: position.x,
                y: position.y + 50,
                z: position.z + 30
            };
            
            // Simple transition - peut �tre am�lior�e avec une animation fluide
            camera.position.set(targetPosition.x, targetPosition.y, targetPosition.z);
            camera.lookAt(position.x, position.y, position.z);
            controls.target.set(position.x, position.y, position.z);
            controls.update();
        }
    }

    // Mettre � jour les informations du type actuel
    updateCurrentTypeInfo() {
        const currentTypeBadge = document.getElementById('currentTypeBadge');
        const currentTypeDescription = document.getElementById('currentTypeDescription');
        // Global overview header (au-dessus de la liste)
        const currentTypeBadgeGlobal = document.getElementById('currentTypeBadgeGlobal');
        const currentTypeDescriptionGlobal = document.getElementById('currentTypeDescriptionGlobal');
        
        if (currentTypeBadge) {
            currentTypeBadge.textContent = this.currentType.toUpperCase();
            currentTypeBadge.className = `type-badge ${this.currentType}`;
        }
        if (currentTypeBadgeGlobal) {
            currentTypeBadgeGlobal.textContent = this.currentType.toUpperCase();
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

    // Configurer les �v�nements pour la vue d'ensemble globale
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

    // Mise � jour de la m�thode updateUI principale
    updateUIComplete() {
        this.updateUI();
        this.updateGlobalOverview();
        this.updateCurrentTypeInfo();
    }

    // Mettre � jour l'interface des onglets de types
    updateTypeTabsUI() {
        // Mettre � jour les onglets si ils existent
        document.querySelectorAll('.type-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.type === this.currentType) {
                tab.classList.add('active');
            }
        });

        // Mettre � jour les compteurs par type
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
        
        // Configurer les �v�nements des onglets si pas encore fait
        this.setupTypeTabEvents();
    }

    // Configurer les �v�nements pour les onglets de types
    setupTypeTabEvents() {
        // �viter de cr�er des listeners multiples
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

    // M�thodes pour la sauvegarde/chargement - Version Multi-Types
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
        // Nettoyer l'�tat actuel
        this.clear();
        
        // Restaurer les hauteurs de joint par type
        if (data.jointHeightByType) {
            // Nouvelle structure: hauteurs par type
            for (const [type, height] of Object.entries(data.jointHeightByType)) {
                this.jointHeightByType.set(type, height);
            }
        } else {
            // Ancienne structure: hauteur globale - appliquer � tous les types
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
        
        // Recr�er le point d'accrochage si n�cessaire
        if (!this.snapPoint) {
            this.createSnapPoint();
        }
        
        this.updateUI();
        console.log('Donn�es d\'assise multi-types import�es');
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
        for (const type of this.allSupportedTypes) {
            this.assisesByType.get(type).clear();
            this.elementsByType.get(type).clear();
            this.gridHelpersByType.get(type).clear();
        }
        
        // R�initialiser les assises courantes
        for (const type of this.allSupportedTypes) {
            this.currentAssiseByType.set(type, 0);
        }
        
        // Recr�er les assises par d�faut pour tous les types et le point d'accrochage
        this.createDefaultAssises();
        this.createSnapPoint();
        
        console.log('Assises multi-types r�initialis�es avec sous-types de briques');
    }

    // Alias pour clart� dans les tests
    clearAllAssises() {
        this.clear();
    }

    updateAllGridVisibility() {
        // Mettre � jour la visibilit� pour tous les types (incluant les sous-types de briques)
        for (const type of this.allSupportedTypes) {
            const gridHelpersForType = this.gridHelpersByType.get(type);
            if (!gridHelpersForType) continue;
            
            const currentAssiseForType = this.currentAssiseByType.get(type);
            
            for (const [index, grids] of gridHelpersForType.entries()) {
                // Seule la grille de l'assise active du type actuel est visible
                const isActiveForCurrentType = (type === this.currentType) && (index === currentAssiseForType);
                grids.main.visible = this.showAssiseGrids && isActiveForCurrentType;
                
                // Masquer compl�tement tous les plans sup�rieurs
                grids.joint.visible = false;
            }
        }
        
        // Mettre � jour la visibilit� du point d'accrochage
        if (this.snapPoint) {
            this.snapPoint.visible = this.showAssiseGrids && this.showSnapPoint;
        }
    }

    createSnapPoint() {
        // SUPPRESSION DU POINT D'ACCROCHAGE VISIBLE SUR LA BRIQUE FANTOME
        // Point d'accrochage d�sactiv� pour �viter la confusion visuelle
        if (this.snapPoint) {
            // Supprimer l'ancien point d'accrochage s'il existe
            window.SceneManager.scene.remove(this.snapPoint);
            this.snapPoint = null;
        }
        
        // Point d'accrochage d�sactiv� - plus de cr�ation de sph�re orange
        return;
        
        // Cr�er une petite sph�re orange pour le point d'accrochage
        const geometry = new THREE.SphereGeometry(0.3, 8, 6);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff6600, // Orange
            transparent: true,
            opacity: 0.8
        });
        
        this.snapPoint = new THREE.Mesh(geometry, material);
        this.snapPoint.visible = this.showSnapPoint;
        
        // IDENTIFICATION POUR EXPORT PDF : Marquer le point d'accrochage unique comme �l�ment � masquer
        this.snapPoint.userData.isAssiseProjectionMarker = true;
        this.snapPoint.userData.assiseProjectionType = 'dynamic_snap_point';
        this.snapPoint.userData.isDynamicSnapPoint = true;
        this.snapPoint.userData.currentType = this.currentType;
        this.snapPoint.name = `AssiseProjection_DynamicSnapPoint_${this.currentType}`;
        
        // Positionner le point d'accrochage � la hauteur de l'assise active
        this.updateSnapPointHeight();
        
        // Ajouter � la sc�ne
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

    // Fonction publique pour calculer les coordonn�es d'accrochage � la grille d'assise
    snapToAssiseGrid(x, z) {
        // V�rifier si nous avons une grille active pour le type actuel
        const currentAssiseIndex = this.currentAssiseByType.get(this.currentType);
        const gridHelpersForType = this.gridHelpersByType.get(this.currentType);
        
        if (gridHelpersForType && gridHelpersForType.has(currentAssiseIndex)) {
            const grids = gridHelpersForType.get(currentAssiseIndex);
            if (grids && grids.main) {
                // Utiliser la grille r�elle de l'AssiseManager pour l'accrochage
                // GridHelper de Three.js utilise size et divisions
                // La grille va de -size/2 � +size/2 avec 'divisions' lignes
                const gridSize = this.calculateDynamicGridSize();
                const divisions = gridSize;
                const gridSpacing = gridSize / divisions; // Espacement entre les lignes = 1cm
                
                // Accrochage bas� sur l'espacement r�el de la grille
                const snappedX = Math.round(x / gridSpacing) * gridSpacing;
                const snappedZ = Math.round(z / gridSpacing) * gridSpacing;
                
                return { x: snappedX, z: snappedZ };
            }
        }
        
        // Fallback : accrochage g�n�rique 1cm x 1cm si pas de grille disponible
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
            // Positionner l�g�rement au-dessus de la grille de l'assise
            this.snapPoint.position.y = assise.height + 0.5;
        }
        
        // Forcer la mise � jour des marqueurs d'accroche pour qu'ils suivent la nouvelle hauteur
        this.updateAttachmentMarkers();
    }

    toggleSnapPoint() {
        this.showSnapPoint = !this.showSnapPoint;
        if (this.snapPoint) {
            this.snapPoint.visible = this.showSnapPoint;
        }
    }

    // Cr�er les marqueurs d'accroche pour les �l�ments des assises inf�rieures
    createAttachmentMarkers(activeAssiseIndex = null) {
        // Nettoyer les marqueurs existants
        this.clearAttachmentMarkers();
        
        if (activeAssiseIndex === null) {
            activeAssiseIndex = this.currentAssiseByType.get(this.currentType);
        }
        
        // Cr�er des marqueurs pour les �l�ments de l'assise imm�diatement inf�rieure uniquement
        const elementsForType = this.elementsByType.get(this.currentType);
        const previousAssiseIndex = activeAssiseIndex - 1;
        
        // Ne montrer que les points de l'assise directement en dessous (pas toutes les assises inf�rieures)
        if (previousAssiseIndex >= 0) {
            const elementsInPreviousAssise = elementsForType.get(previousAssiseIndex);
            if (elementsInPreviousAssise) {
                elementsInPreviousAssise.forEach(elementId => {
                    const element = window.SceneManager.elements.get(elementId);
                    if (element) {
                        this.createMarkerForElement(element, activeAssiseIndex);
                    }
                });
            }
        }
        
        // ?? NOUVEAUT�: Ajouter des marqueurs pour les joints verticaux des assises inf�rieures
        this.createJointAttachmentMarkers(activeAssiseIndex);
    }

    // Cr�er des marqueurs d'accroche pour les joints verticaux de l'assise imm�diatement inf�rieure
    createJointAttachmentMarkers(activeAssiseIndex) {
        if (!window.SceneManager || !window.SceneManager.elements) return;
        
        // Collecter les joints verticaux de l'assise imm�diatement inf�rieure uniquement
        const verticalJoints = [];
        const previousAssiseIndex = activeAssiseIndex - 1;
        
        // Ne traiter que l'assise directement en dessous
        if (previousAssiseIndex >= 0) {
            // Parcourir tous les �l�ments pour trouver les joints verticaux
            for (const [elementId, element] of window.SceneManager.elements.entries()) {
                if (element.isVerticalJoint && element.type === 'joint') {
                    const jointAssiseInfo = this.getElementAssiseAndType(elementId);
                    
                    // V�rifier si le joint est dans l'assise imm�diatement inf�rieure du type actuel
                    if (jointAssiseInfo && 
                        jointAssiseInfo.type === this.currentType && 
                        jointAssiseInfo.assiseIndex === previousAssiseIndex) {
                        
                        verticalJoints.push({
                            element: element,
                            assiseIndex: jointAssiseInfo.assiseIndex
                        });
                    }
                }
            }
        }
        
        // console.log(`?? Joints verticaux trouv�s pour marqueurs (assise ${previousAssiseIndex} uniquement): ${verticalJoints.length}`);
        
        // Collecter les positions des briques existantes pour �viter les conflits
        const existingBrickPositions = this.getExistingBrickPositionsInPreviousAssise(activeAssiseIndex);
        
        // Cr�er des marqueurs pour chaque joint vertical
        verticalJoints.forEach(jointInfo => {
            this.createJointMarkerForElement(jointInfo.element, activeAssiseIndex, existingBrickPositions);
        });
    }

    // Obtenir les positions des briques existantes dans l'assise imm�diatement inf�rieure
    getExistingBrickPositionsInPreviousAssise(activeAssiseIndex) {
        const positions = [];
        const elementsForType = this.elementsByType.get(this.currentType);
        const previousAssiseIndex = activeAssiseIndex - 1;
        
        // Ne traiter que l'assise imm�diatement inf�rieure
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

    // ANCIENNE M�THODE - Conserv�e pour compatibilit� si utilis�e ailleurs
    // Obtenir les positions des briques existantes dans les assises inf�rieures
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

    // Cr�er un marqueur d'accroche pour un joint vertical
    createJointMarkerForElement(joint, targetAssiseIndex, existingBrickPositions) {
        const currentAssiseForType = this.currentAssiseByType.get(this.currentType);
        const assisesForType = this.assisesByType.get(this.currentType);
        const assise = assisesForType.get(currentAssiseForType);
        if (!assise) return;
        
        // Calculer la position du marqueur sur la grille de l'assise active
        const markerY = assise.height;
        
        // Position du joint projet�e sur l'assise sup�rieure
        const jointX = joint.position.x;
        const jointZ = joint.position.z;
        
        // V�rifier s'il y a d�j� une brique � cette position (�viter les conflits)
        const hasConflict = existingBrickPositions.some(brickPos => {
            const distance = Math.sqrt(
                Math.pow(brickPos.x - jointX, 2) + 
                Math.pow(brickPos.z - jointZ, 2)
            );
            return distance < 5; // Seuil de 5cm pour �viter les conflits
        });
        
        if (hasConflict) {
            // console.log(`?? Joint vertical ${joint.id} ignor� - conflit avec brique existante`);
            return;
        }
        
        // Cr�er un marqueur lin�aire pour le joint vertical
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
        jointMarker.rotation.z = joint.rotation; // M�me rotation que le joint
        
        // Cr�er les contours du joint
        const jointEdges = new THREE.EdgesGeometry(jointMarkerGeometry);
        const jointLineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x8e44ad,
            linewidth: 3
        });
        const jointWireframe = new THREE.LineSegments(jointEdges, jointLineMaterial);
        jointWireframe.position.copy(jointMarker.position);
        jointWireframe.rotation.copy(jointMarker.rotation);
        
        // Cr�er un groupe pour le marqueur de joint
        const jointMarkerGroup = new THREE.Group();
        jointMarkerGroup.add(jointMarker);
        jointMarkerGroup.add(jointWireframe);
        
        // Ajouter des points d'accroche sp�cifiques pour le joint
        this.addJointAttachmentPoints(joint, jointMarkerGroup, markerY, jointX, jointZ);
        
        // Ajouter � la sc�ne et au tracking
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
        
        // console.log(`?? Marqueur de joint vertical cr�� pour ${joint.id} � (${jointX}, ${jointZ})`);
    }

    // Ajouter des points d'accroche sp�cifiques pour les joints verticaux
    addJointAttachmentPoints(joint, parentGroup, markerY, markerX, markerZ) {
        const halfWidth = joint.dimensions.width / 2;
        
        // Points d'accroche pour joint vertical : extr�mit�s + centre
        const jointAttachmentPoints = [
            { x: 0, z: -halfWidth, type: 'joint-start', description: 'D�but du joint' },
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
            
            // M�tadonn�es pour l'animation et l'interaction
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
                // IDENTIFICATION COMPL�TE POUR EXPORT PDF : Points de joints verticaux
                isAssiseProjectionMarker: true,
                assiseProjectionType: 'joint_snap_point',
                sourceElementId: joint.id,
                targetAssise: this.currentAssiseByType.get(this.currentType),
                // NOUVELLES IDENTIFICATIONS SP�CIFIQUES POUR JOINTS
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
                // IDENTIFICATION COMPL�TE POUR EXPORT PDF : Halo de points de joints
                isAssiseProjectionMarker: true,
                assiseProjectionType: 'joint_snap_halo',
                sourceElementId: joint.id,
                targetAssise: this.currentAssiseByType.get(this.currentType),
                // NOUVELLES IDENTIFICATIONS SP�CIFIQUES POUR HALO DE JOINT
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
        
        // console.log(`?? Points d'accroche de joint cr��s pour ${joint.id}: ${jointAttachmentPoints.length} points`);
    }

    // D�tecter si un �l�ment est un bloc creux
    isHollowBlock(element) {
        // V�rifier d'abord si l'�l�ment a un ID contenant B suivi d'un chiffre (B9, B14, B19, B29)
        if (element.id && /^B\d+/.test(element.id)) {
            return true;
        }
        
        // V�rifier les dimensions caract�ristiques des blocs creux (39cm ou d�riv�s)
        const length = element.dimensions.length;
        const height = element.dimensions.height;
        
        // Blocs creux standards: 39cm (entier), 29cm (3/4), 19cm (1/2), 9cm (1/4)
        // Hauteur typique: 19cm
        if (height === 19 && (length === 39 || length === 29 || length === 19 || length === 9)) {
            return true;
        }
        
        // V�rifier via les types de blocs si disponibles
        if (window.BlockSelector && window.BlockSelector.blockTypes) {
            for (const [blockId, blockInfo] of Object.entries(window.BlockSelector.blockTypes)) {
                if (blockInfo.category === 'hollow' || blockInfo.category === 'cut') {
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

    // D�tecter le type de coupe d'un �l�ment
    getElementCutType(element) {
        // V�rifier d'abord si l'ID contient des suffixes de coupe
        if (element.id) {
            if (element.id.includes('_3Q')) {
                return '3/4';
            } else if (element.id.includes('_HALF')) {
                return '1/2';
            } else if (element.id.includes('_1Q')) {
                return '1/4';
            }
        }
        
        // D�tecter par les dimensions pour les blocs creux
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
                    return '1/1'; // Par d�faut
            }
        }
        
        // Pour les briques, d�tecter par dimensions
        if (element.dimensions.height === 6.5 || element.dimensions.height === 9) { // Hauteurs typiques de briques
            const length = element.dimensions.length;
            if (length === 19) {
                return '1/1'; // Brique enti�re
            } else if (length === 14) {
                return '3/4';
            } else if (length === 9) {
                return '1/2';
            } else if (length === 4) {
                return '1/4';
            }
        }
        
        return '1/1'; // Par d�faut pour �l�ments non reconnus
    }

    // Cr�er un marqueur d'accroche pour un �l�ment sp�cifique
    createMarkerForElement(element, targetAssiseHeight) {
        const currentAssiseForType = this.currentAssiseByType.get(this.currentType);
        const assisesForType = this.assisesByType.get(this.currentType);
        const assise = assisesForType.get(currentAssiseForType);
        if (!assise) return;
        
        // Calculer la position du marqueur sur la grille de l'assise active
        const markerY = assise.height;
        
        // Cr�er le contour de la brique projet� sur l'assise active
        const outlineGeometry = new THREE.RingGeometry(
            0, // rayon int�rieur
            Math.max(element.dimensions.length, element.dimensions.width) / 2, // rayon ext�rieur
            4 // segments (pour faire un carr�)
        );
        
        // Cr�er aussi un marqueur rectangulaire plus pr�cis
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
        
        // Calculer le d�calage pour positionner le marqueur correctement
        // D�caler d'une demi-longueur en X et d'une demi-largeur en Z (vers l'arri�re)
        const offsetX = element.dimensions.length / 2;
        const offsetZ = -element.dimensions.width / 2; // CORRECTION: d�calage n�gatif en Z
        
        // Appliquer la rotation de l'�l�ment au d�calage
        const cos = Math.cos(element.rotation);
        const sin = Math.sin(element.rotation);
        const rotatedOffsetX = offsetX * cos - offsetZ * sin;
        const rotatedOffsetZ = offsetX * sin + offsetZ * cos;
        
        // Position finale du marqueur (d�cal�e)
        const markerX = element.position.x + rotatedOffsetX;
        const markerZ = element.position.z + rotatedOffsetZ;
        
        // Cr�er le marqueur principal (rectangle)
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(markerX, markerY + 0.1, markerZ);
        marker.rotation.x = -Math.PI / 2; // Horizontal
        marker.rotation.z = element.rotation; // M�me rotation que la brique
        
        // IDENTIFICATION POUR EXPORT PDF : Marquer ce mesh comme marqueur d'assise � masquer
        marker.userData.isAssiseProjectionMarker = true;
        marker.userData.assiseProjectionType = 'attachment_marker';
        marker.userData.sourceElementId = element.id;
        marker.userData.targetAssise = this.currentAssiseByType.get(this.currentType);
        marker.name = `AssiseProjection_AttachmentMarker_${element.id}`;
        
        // Cr�er les contours (bordures)
        const edges = new THREE.EdgesGeometry(markerGeometry);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: this.attachmentMarkerColor,
            linewidth: 2
        });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        wireframe.position.copy(marker.position);
        wireframe.rotation.copy(marker.rotation);
        
        // IDENTIFICATION POUR EXPORT PDF : Marquer les contours comme �l�ments � masquer
        wireframe.userData.isAssiseProjectionMarker = true;
        wireframe.userData.assiseProjectionType = 'attachment_border';
        wireframe.userData.sourceElementId = element.id;
        wireframe.userData.targetAssise = this.currentAssiseByType.get(this.currentType);
        wireframe.name = `AssiseProjection_AttachmentBorder_${element.id}`;
        
        // Cr�er un groupe pour le marqueur complet
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
        
        // Ajouter � la sc�ne et au tracking
        window.SceneManager.scene.add(markerGroup);
        
        if (!this.attachmentMarkers.has(this.currentAssise)) {
            this.attachmentMarkers.set(this.currentAssise, []);
        }
        this.attachmentMarkers.get(this.currentAssise).push({
            group: markerGroup,
            elementId: element.id,
            sourceAssise: this.getElementAssise(element.id)
        });
    }

    // Ajouter des points d'accroche sp�cifiques (coins et centre)
    addAttachmentPoints(element, parentGroup, markerY, markerX, markerZ) {
        const halfLength = element.dimensions.length / 2;
        const halfWidth = element.dimensions.width / 2;
        
        // Points d'accroche : 4 coins + centre + points sp�ciaux selon le type d'�l�ment
        const attachmentPoints = [
            { x: -halfLength, z: -halfWidth, type: 'corner' }, // Coin arri�re-gauche
            { x: halfLength, z: -halfWidth, type: 'corner' },  // Coin arri�re-droit
            { x: halfLength, z: halfWidth, type: 'corner' },   // Coin avant-droit
            { x: -halfLength, z: halfWidth, type: 'corner' },  // Coin avant-gauche
            { x: 0, z: 0, type: 'center' }                    // Centre du marqueur
        ];
        
        // D�tecter le type d'�l�ment pour appliquer les bons points d'accrochage
        const isHollowBlock = this.isHollowBlock(element);
        const cutType = this.getElementCutType(element);
        
        // console.log(`?? Points d'accroche pour ${element.id}: isHollowBlock=${isHollowBlock}, cutType=${cutType}, length=${element.dimensions.length}cm`);
        
        // Coin arri�re-gauche et avant-gauche
        const leftBackCornerX = -halfLength;
        const leftBackCornerZ = -halfWidth;
        const leftFrontCornerX = -halfLength;
        const leftFrontCornerZ = halfWidth;
        
        // LOGIQUE SP�CIFIQUE SELON LE TYPE D'�L�MENT
        if (isHollowBlock) {
            // === BLOCS CREUX ===
            if (cutType === '1/1' && element.dimensions.length === 39) {
                // Bloc creux entier 1/1 (39cm) : points � 9, 10, 19, 20, 29 et 30cm
                attachmentPoints.push(
                    { x: leftBackCornerX + 9, z: leftBackCornerZ, type: 'snap-9cm-back', description: '9cm du coin arri�re-gauche' },
                    { x: leftBackCornerX + 10, z: leftBackCornerZ, type: 'snap-10cm-back', description: '10cm du coin arri�re-gauche' },
                    { x: leftBackCornerX + 19, z: leftBackCornerZ, type: 'snap-19cm-back', description: '19cm du coin arri�re-gauche' },
                    { x: leftBackCornerX + 20, z: leftBackCornerZ, type: 'snap-20cm-back', description: '20cm du coin arri�re-gauche' },
                    { x: leftBackCornerX + 29, z: leftBackCornerZ, type: 'snap-29cm-back', description: '29cm du coin arri�re-gauche' },
                    { x: leftBackCornerX + 30, z: leftBackCornerZ, type: 'snap-30cm-back', description: '30cm du coin arri�re-gauche' }
                );
                
                attachmentPoints.push(
                    { x: leftFrontCornerX + 9, z: leftFrontCornerZ, type: 'snap-9cm-front', description: '9cm du coin avant-gauche' },
                    { x: leftFrontCornerX + 10, z: leftFrontCornerZ, type: 'snap-10cm-front', description: '10cm du coin avant-gauche' },
                    { x: leftFrontCornerX + 19, z: leftFrontCornerZ, type: 'snap-19cm-front', description: '19cm du coin avant-gauche' },
                    { x: leftFrontCornerX + 20, z: leftFrontCornerZ, type: 'snap-20cm-front', description: '20cm du coin avant-gauche' },
                    { x: leftFrontCornerX + 29, z: leftFrontCornerZ, type: 'snap-29cm-front', description: '29cm du coin avant-gauche' },
                    { x: leftFrontCornerX + 30, z: leftFrontCornerZ, type: 'snap-30cm-front', description: '30cm du coin avant-gauche' }
                );
                console.log(`??? Bloc creux entier 1/1: Ajout des points � 9, 10, 19, 20, 29 et 30cm`);
            } else if (cutType === '3/4' && element.dimensions.length === 29) {
                // Bloc creux 3/4 (29cm) : points � 9, 10, 19 et 20cm
                attachmentPoints.push(
                    { x: leftBackCornerX + 9, z: leftBackCornerZ, type: 'snap-9cm-back', description: '9cm du coin arri�re-gauche' },
                    { x: leftBackCornerX + 10, z: leftBackCornerZ, type: 'snap-10cm-back', description: '10cm du coin arri�re-gauche' },
                    { x: leftBackCornerX + 19, z: leftBackCornerZ, type: 'snap-19cm-back', description: '19cm du coin arri�re-gauche' },
                    { x: leftBackCornerX + 20, z: leftBackCornerZ, type: 'snap-20cm-back', description: '20cm du coin arri�re-gauche' }
                );
                
                attachmentPoints.push(
                    { x: leftFrontCornerX + 9, z: leftFrontCornerZ, type: 'snap-9cm-front', description: '9cm du coin avant-gauche' },
                    { x: leftFrontCornerX + 10, z: leftFrontCornerZ, type: 'snap-10cm-front', description: '10cm du coin avant-gauche' },
                    { x: leftFrontCornerX + 19, z: leftFrontCornerZ, type: 'snap-19cm-front', description: '19cm du coin avant-gauche' },
                    { x: leftFrontCornerX + 20, z: leftFrontCornerZ, type: 'snap-20cm-front', description: '20cm du coin avant-gauche' }
                );
                // console.log(`🏗️ Bloc creux 3/4: Ajout des points à 9, 10, 19 et 20cm`);
            } else if (cutType === '1/4' && element.dimensions.length === 9) {
                // Bloc creux 1/4 (9cm) : pas de points interm�diaires
                console.log(`??? Bloc creux 1/4: Aucun point interm�diaire ajout�`);
            } else if (cutType === '1/2' && element.dimensions.length === 19) {
                // Bloc creux 1/2 (19cm) : points � 9 et 10cm
                attachmentPoints.push(
                    { x: leftBackCornerX + 9, z: leftBackCornerZ, type: 'snap-9cm-back', description: '9cm du coin arri�re-gauche' },
                    { x: leftBackCornerX + 10, z: leftBackCornerZ, type: 'snap-10cm-back', description: '10cm du coin arri�re-gauche' }
                );
                
                attachmentPoints.push(
                    { x: leftFrontCornerX + 9, z: leftFrontCornerZ, type: 'snap-9cm-front', description: '9cm du coin avant-gauche' },
                    { x: leftFrontCornerX + 10, z: leftFrontCornerZ, type: 'snap-10cm-front', description: '10cm du coin avant-gauche' }
                );
                console.log(`??? Bloc creux 1/2: Ajout des points � 9 et 10cm`);
            }
        } else {
            // === BRIQUES ET AUTRES �L�MENTS ===
            // Garder l'ancienne logique pour les briques (9cm et 10cm)
            if (element.dimensions.length > 10) { // Au moins 10cm de longueur
                attachmentPoints.push(
                    { x: leftBackCornerX + 9, z: leftBackCornerZ, type: 'snap-9cm-back', description: '9cm du coin arri�re-gauche' },
                    { x: leftBackCornerX + 10, z: leftBackCornerZ, type: 'snap-10cm-back', description: '10cm du coin arri�re-gauche' }
                );
                
                attachmentPoints.push(
                    { x: leftFrontCornerX + 9, z: leftFrontCornerZ, type: 'snap-9cm-front', description: '9cm du coin avant-gauche' },
                    { x: leftFrontCornerX + 10, z: leftFrontCornerZ, type: 'snap-10cm-front', description: '10cm du coin avant-gauche' }
                );
                // console.log(`?? Brique: Ajout des points � 9 et 10cm`);
            }
        }
        
        attachmentPoints.forEach(point => {
            const pointGeometry = new THREE.SphereGeometry(0.5, 8, 6);
            
            // Couleurs sp�ciales pour les diff�rents types de points d'accroche
            let pointColor = this.attachmentMarkerColor; // Orange par d�faut
            if (point.type === 'center') {
                pointColor = 0xe74c3c; // Rouge pour le centre
            } else if (point.type === 'snap-9cm-back') {
                pointColor = 0x00ff00; // Vert pour 9cm arri�re
            } else if (point.type === 'snap-10cm-back') {
                pointColor = 0x0000ff; // Bleu pour 10cm arri�re
            } else if (point.type === 'snap-9cm-front') {
                pointColor = 0x00ffff; // Cyan pour 9cm avant
            } else if (point.type === 'snap-10cm-front') {
                pointColor = 0xff00ff; // Magenta pour 10cm avant
            } else if (point.type === 'snap-19cm-back') {
                pointColor = 0x9ACD32; // Vert olive pour 19cm arri�re
            } else if (point.type === 'snap-20cm-back') {
                pointColor = 0x228B22; // Vert for�t pour 20cm arri�re
            } else if (point.type === 'snap-29cm-back') {
                pointColor = 0x4169E1; // Bleu royal pour 29cm arri�re
            } else if (point.type === 'snap-30cm-back') {
                pointColor = 0x191970; // Bleu nuit pour 30cm arri�re
            } else if (point.type === 'snap-19cm-front') {
                pointColor = 0xFFD700; // Or pour 19cm avant
            } else if (point.type === 'snap-20cm-front') {
                pointColor = 0xFFA500; // Orange fonc� pour 20cm avant
            } else if (point.type === 'snap-29cm-front') {
                pointColor = 0xFF1493; // Rose profond pour 29cm avant
            } else if (point.type === 'snap-30cm-front') {
                pointColor = 0x8B0000; // Rouge fonc� pour 30cm avant
            }
            
            const pointMaterial = new THREE.MeshBasicMaterial({
                color: pointColor,
                transparent: true,
                opacity: 0.8
            });
            
            const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
            
            // Position relative au marqueur d�cal�, avec rotation
            const cos = Math.cos(element.rotation);
            const sin = Math.sin(element.rotation);
            const rotatedX = point.x * cos - point.z * sin;
            const rotatedZ = point.x * sin + point.z * cos;
            
            pointMesh.position.set(
                markerX + rotatedX,
                markerY + 0.2,
                markerZ + rotatedZ
            );
            
            // Ajouter des m�tadonn�es pour identifier le type de point
            pointMesh.userData = {
                type: point.type,
                description: point.description || point.type,
                isSnapPoint: point.type.startsWith('snap-'),
                originalColor: pointColor,
                originalOpacity: 0.8,
                originalScale: { x: 1, y: 1, z: 1 },
                isHovered: false,
                pulsePhase: Math.random() * Math.PI * 2, // Phase al�atoire pour la pulsation
                // IDENTIFICATION COMPL�TE POUR EXPORT PDF : Marquer comme point d'accrochage � masquer
                isAssiseProjectionMarker: true,
                assiseProjectionType: 'snap_point',
                sourceElementId: element.id,
                targetAssise: this.currentAssiseByType.get(this.currentType),
                // NOUVELLES IDENTIFICATIONS SP�CIFIQUES
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
            
            // Cr�er un effet de halo pour les points sp�ciaux
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
                    // IDENTIFICATION COMPL�TE POUR EXPORT PDF : Marquer le halo comme �l�ment � masquer
                    isAssiseProjectionMarker: true,
                    assiseProjectionType: 'snap_halo',
                    sourceElementId: element.id,
                    targetAssise: this.currentAssiseByType.get(this.currentType),
                    // NOUVELLES IDENTIFICATIONS SP�CIFIQUES POUR HALO
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
        
        // console.log(`?? Points d'accroche cr��s pour ${element.id}: ${attachmentPoints.length} points (points sp�ciaux selon le type d'�l�ment)`);
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
                            
                            // Changement d'opacit� pour l'effet de clignotement
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

    // D�tecter le survol des points d'accroche
    handleAttachmentPointHover(intersectedObject) {
        // R�initialiser tous les points (enlever le hover)
        this.attachmentMarkers.forEach((markers, assiseIndex) => {
            markers.forEach(markerInfo => {
                markerInfo.group.traverse(child => {
                    if (child.userData && child.userData.type && !child.userData.isHalo) {
                        child.userData.isHovered = false;
                    }
                });
            });
        });
        
        // Activer le hover sur le point survol�
        if (intersectedObject && intersectedObject.userData && intersectedObject.userData.type) {
            intersectedObject.userData.isHovered = true;
            
            // Afficher une info-bulle ou un log avec la description du point
            if (intersectedObject.userData.description) {
                // console.log(`?? Point d'accroche survol�: ${intersectedObject.userData.description}`);
            }
            
            return intersectedObject.userData;
        }
        
        return null;
    }

    // D�marrer l'animation des points d'accroche
    startAttachmentPointAnimation() {
        if (!this.animationRunning) {
            this.animationRunning = true;
            this.animateAttachmentPoints();
            // console.log('?? Animation des points d\'accroche d�marr�e');
        }
    }

    // Arr�ter l'animation des points d'accroche
    stopAttachmentPointAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.animationRunning = false;
        // console.log('?? Animation des points d\'accroche arr�t�e');
    }

    // Nettoyer tous les marqueurs d'accroche
    clearAttachmentMarkers() {
        // Arr�ter l'animation avant de nettoyer
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

    // Mettre � jour les marqueurs d'accroche quand l'assise active change
    updateAttachmentMarkers() {
        const currentAssiseForType = this.currentAssiseByType.get(this.currentType);
        if (this.showAttachmentMarkers && currentAssiseForType > 0) {
            this.createAttachmentMarkers(currentAssiseForType);
            // D�marrer l'animation des points d'accroche
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
        
        // console.log(`Marqueurs d'accroche: ${this.showAttachmentMarkers ? 'ACTIV�S' : 'D�SACTIV�S'}`);
        return this.showAttachmentMarkers;
    }

    // M�thode pour d�terminer le type d'assise en fonction de son contenu (ancienne version pour compatibilit�)
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

    // Nouvelle m�thode pour obtenir le label d'une assise d'un type sp�cifique
    getAssiseTypeLabelForType(type, assiseIndex) {
        const assisesForType = this.assisesByType.get(type);
        if (!assisesForType.has(assiseIndex)) {
            return `Assise ${type} (vide)`; // Valeur par d�faut plus claire
        }
        
        const assise = assisesForType.get(assiseIndex);
        if (assise.elements.size === 0) {
            return `Assise ${type} (vide)`; // Assise vide avec indication claire
        }
        
        // Pour le nouveau syst�me, le type est d�j� d�termin� par la cat�gorie
        const typeLabels = {
            'brick': 'Assise Briques',
            'block': 'Assise Blocs', 
            'insulation': 'Assise Isolant',
            'custom': 'Assise Personnalis�e'
        };
        
        return typeLabels[type] || `Assise ${type}`;
    }

    // M�thode pour obtenir des statistiques d�taill�es sur une assise (ancienne version pour compatibilit�)
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

    // M�thode pour obtenir une description textuelle d'une assise (ancienne version pour compatibilit�)
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

    // Nouvelle m�thode pour obtenir une description d'une assise d'un type sp�cifique
    getAssiseDescriptionForType(type, assiseIndex) {
        const stats = this.getAssiseStatisticsForType(type, assiseIndex);
        if (!stats || stats.totalElements === 0) {
            return 'Assise vide';
        }
        
        const typeLabels = {
            'brick': 'briques',
            'block': 'blocs',
            'insulation': 'isolant',
            'custom': '�l�ments custom'
        };
        
        return `${stats.totalElements} ${typeLabels[type] || '�l�ments'}`;
    }

    // Nouvelle m�thode pour obtenir des statistiques d�taill�es sur une assise d'un type sp�cifique
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
                // Compter les mat�riaux
                stats.materials[element.material] = (stats.materials[element.material] || 0) + 1;
                
                // Calculer les dimensions totales si les m�thodes existent
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

    // Trouve l'assise dans laquelle se trouve un �l�ment donn�
    findElementAssise(elementId, type = 'brick') {
        const assises = this.assisesByType.get(type);
        if (!assises) return null;
        
        for (let i = 0; i < assises.size; i++) {
            const assise = assises.get(i);
            if (assise && assise.elements.has(elementId)) {
                return i;
            }
        }
        
        return null; // �l�ment non trouv� dans les assises
    }

    // Version am�lior�e qui retourne les informations compl�tes d'assise pour un �l�ment
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
        
        return null; // �l�ment non trouv� dans les assises
    }

    // Mettre � jour les joints existants lors du changement de hauteur du joint horizontal
    updateVerticalJoints() {
        if (!window.SceneManager || !window.SceneManager.elements) return;
        
        console.log('?? Mise � jour des joints existants...');
        let updatedCount = 0;
        
        // Parcourir tous les �l�ments de la sc�ne
        for (const [elementId, element] of window.SceneManager.elements.entries()) {
            // Traiter les joints debout (largeur = 1cm et marquage isVerticalJoint)
            if (element.isVerticalJoint && element.dimensions.width === 1) {
                // CORRECTION CRITIQUE: Trouver le TYPE d'assise du joint (M50, M65, M90, etc.)
                let jointAssiseType = null;
                let elementAssiseIndex = null;
                
                // Rechercher dans tous les types d'assises pour trouver o� est ce joint
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
                
                // Si le joint n'est associ� � aucune assise sp�cifique, ne pas le modifier
                if (!jointAssiseType) {
                    console.log(`?? Joint ${elementId}: aucune assise associ�e, non modifi�`);
                    continue;
                }
                
                // Utiliser la hauteur de joint sp�cifique � ce type d'assise
                const typeJointHeight = this.getJointHeightForType(jointAssiseType);
                
                // CORRECTION CRITIQUE: Utiliser la hauteur de brique stock�e DANS le joint
                // Si pas de hauteur stock�e, d�duire de la hauteur actuelle du joint
                let originalBrickHeight = element.originalBrickHeight;
                
                if (!originalBrickHeight) {
                    // D�duire la hauteur de brique d'origine depuis la hauteur actuelle du joint
                    // Hauteur joint = hauteur brique + hauteur joint horizontal
                    originalBrickHeight = element.dimensions.height - typeJointHeight;
                    
                    // Valider et corriger si n�cessaire (plage �tendue pour blocs)
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
                            originalBrickHeight = 6.5; // D�faut
                        }
                    }
                    
                    // Stocker pour les prochaines fois
                    element.originalBrickHeight = originalBrickHeight;
                    console.log(`?? Joint ${elementId}: hauteur brique d�duite = ${originalBrickHeight} cm (depuis hauteur joint ${element.dimensions.height} cm)`);
                } else {
                    console.log(`?? Joint ${elementId}: hauteur brique stock�e = ${originalBrickHeight} cm`);
                }
                
                // Calculer la nouvelle hauteur du joint bas�e sur la brique D'ORIGINE et le joint sp�cifique au type
                const newJointHeight = originalBrickHeight + typeJointHeight;
                
                // Mettre � jour les dimensions
                element.updateDimensions(
                    element.dimensions.length,  // Garder longueur (9cm)
                    element.dimensions.width,   // Garder largeur (1cm) 
                    newJointHeight              // Nouvelle hauteur
                );
                
                // Recalculer la position Y en respectant l'assise d'origine
                // CORRECTION: La face sup�rieure du joint doit �tre align�e avec la face sup�rieure de la brique
                let newPositionY;
                if (elementAssiseIndex !== null && elementAssiseIndex >= 0) {
                    // Calculer la hauteur de la face sup�rieure de la brique dans cette assise et ce type
                    const assiseHeight = this.calculateAssiseHeightForType(jointAssiseType, elementAssiseIndex);
                    const brickTopY = assiseHeight + originalBrickHeight;
                    // Positionner le joint pour que sa face sup�rieure soit au m�me niveau
                    newPositionY = brickTopY - newJointHeight / 2;
                } else {
                    // Fallback : rester au sol si assise non trouv�e
                    newPositionY = newJointHeight / 2;
                }
                
                element.updatePosition(
                    element.position.x,
                    newPositionY,
                    element.position.z
                );
                
                updatedCount++;
                console.log(`?? Joint debout ${elementId} mis � jour: ${element.dimensions.length}�${element.dimensions.width}�${newJointHeight} cm (assise ${jointAssiseType}:${elementAssiseIndex}) - Brique d'origine: ${originalBrickHeight} cm`);
            }
            // Traiter les joints horizontaux (marquage isHorizontalJoint)
            else if (element.isHorizontalJoint) {
                // CORRECTION CRITIQUE: Trouver le TYPE d'assise du joint horizontal aussi
                let jointAssiseType = null;
                let elementAssiseIndex = null;
                
                // Rechercher dans tous les types d'assises pour trouver o� est ce joint
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
                
                // Si le joint n'est associ� � aucune assise sp�cifique, ne pas le modifier
                if (!jointAssiseType) {
                    console.log(`?? Joint horizontal ${elementId}: aucune assise associ�e, non modifi�`);
                    continue;
                }
                
                // Pour le joint horizontal, seule l'�paisseur (hauteur) change - utiliser le joint sp�cifique au type
                const newJointHeight = this.getJointHeightForType(jointAssiseType);
                
                // Mettre � jour les dimensions
                element.updateDimensions(
                    element.dimensions.length,  // Garder longueur originale
                    element.dimensions.width,   // Garder largeur originale
                    newJointHeight              // Nouvelle hauteur (�paisseur du joint)
                );
                
                // CORRECTION: Recalculer la position Y en fonction de l'assise
                let newPositionY;
                if (elementAssiseIndex === 0) {
                    // Pour l'assise 0, le joint horizontal va de Y=0 � Y=jointHeight
                    // Son centre doit donc �tre � jointHeight/2
                    newPositionY = newJointHeight / 2;
                    console.log(`?? Joint horizontal assise 0: centre � Y=${newPositionY} cm (joint de 0 � ${newJointHeight} cm)`);
                } else if (elementAssiseIndex !== null && elementAssiseIndex > 0) {
                    // Pour les autres assises, calculer la position relative
                    const assiseHeight = this.calculateAssiseHeightForType(jointAssiseType, elementAssiseIndex);
                    newPositionY = assiseHeight - newJointHeight / 2;
                    console.log(`?? Joint horizontal assise ${elementAssiseIndex}: centre � Y=${newPositionY} cm`);
                } else {
                    // Fallback : rester au sol si assise non trouv�e
                    newPositionY = newJointHeight / 2;
                    console.log(`?? Joint horizontal fallback: centre � Y=${newPositionY} cm`);
                }
                
                element.updatePosition(
                    element.position.x,
                    newPositionY,
                    element.position.z
                );
                
                updatedCount++;
                console.log(`?? Joint horizontal ${elementId} mis � jour: ${element.dimensions.length}�${element.dimensions.width}�${newJointHeight} cm (assise ${jointAssiseType}:${elementAssiseIndex})`);
            }
        }
        
        if (updatedCount > 0) {
            console.log(`?? ${updatedCount} joints mis � jour`);
        }
    }
    
    // Mettre � jour seulement les joints d'un type d'assise sp�cifique
    updateVerticalJointsForType(targetType) {
        if (!window.SceneManager || !window.SceneManager.elements) return;
        
        console.log(`?? Mise � jour des joints pour le type ${targetType} uniquement...`);
        let updatedCount = 0;
        
        // Parcourir tous les �l�ments de la sc�ne
        for (const [elementId, element] of window.SceneManager.elements.entries()) {
            // Traiter les joints debout (largeur = 1cm et marquage isVerticalJoint)
            if (element.isVerticalJoint && element.dimensions.width === 1) {
                // Trouver le TYPE d'assise du joint
                let jointAssiseType = null;
                let elementAssiseIndex = null;
                
                // Rechercher dans tous les types d'assises pour trouver o� est ce joint
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
                
                // Ne mettre � jour que les joints du type cible
                if (jointAssiseType !== targetType) {
                    continue;
                }
                
                // Utiliser la hauteur de joint sp�cifique � ce type d'assise
                const typeJointHeight = this.getJointHeightForType(jointAssiseType);
                
                // Utiliser la hauteur de brique stock�e DANS le joint
                let originalBrickHeight = element.originalBrickHeight;
                
                if (!originalBrickHeight) {
                    // D�duire la hauteur de brique d'origine
                    originalBrickHeight = element.dimensions.height - typeJointHeight;
                    
                    // Valider et corriger si n�cessaire (plage �tendue pour blocs)
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
                            originalBrickHeight = 6.5; // D�faut
                        }
                    }
                    
                    // Stocker pour les prochaines fois
                    element.originalBrickHeight = originalBrickHeight;
                }
                
                // Calculer la nouvelle hauteur du joint
                const newJointHeight = originalBrickHeight + typeJointHeight;
                
                // Mettre � jour les dimensions
                element.updateDimensions(
                    element.dimensions.length,
                    element.dimensions.width,
                    newJointHeight
                );
                
                // Recalculer la position Y - CORRECTIF: Ancrer le joint au sommet du bloc
                let newPositionY;
                if (elementAssiseIndex !== null && elementAssiseIndex >= 0) {
                    // Trouver le bloc de r�f�rence pour ce joint vertical
                    const assiseHeight = this.calculateAssiseHeightForType(jointAssiseType, elementAssiseIndex);
                    
                    // CORRECTION: Pour les joints verticaux, utiliser la hauteur r�elle du bloc de r�f�rence
                    // Au lieu de utiliser originalBrickHeight (qui est la hauteur stock�e lors de la cr�ation),
                    // utiliser la hauteur r�elle du bloc dans cette assise
                    const elementsInAssise = this.elementsByType.get(jointAssiseType)?.get(elementAssiseIndex);
                    let blockTopY = assiseHeight + originalBrickHeight; // Fallback
                    
                    if (elementsInAssise) {
                        // Chercher un bloc de r�f�rence � proximit� du joint
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
                        
                        if (closestBlock && minDistance < 50) { // 50cm de tol�rance
                            // CORRECTION IMPORTANTE: Utiliser la position ORIGINALE du bloc
                            // Le bloc lui-m�me peut avoir �t� repositionn� par les changements de joint horizontal
                            // Donc on utilise la position de base de l'assise + hauteur originale du bloc
                            const originalBlockTop = assiseHeight + closestBlock.dimensions.height;
                            blockTopY = originalBlockTop;
                            console.log(`?? Joint ancr� au bloc ${closestBlock.id} (sommet ORIGINAL: ${blockTopY} cm)`);
                        }
                    }
                    
                    // Centre du joint = sommet du bloc - hauteur_joint/2 pour ancrer par le haut
                    // CORRECTION: Pour garder le sommet du joint fixe au sommet du bloc
                    // Le sommet du joint doit rester � blockTopY
                    // Donc le centre = sommet - hauteur/2
                    newPositionY = blockTopY - newJointHeight / 2;
                    console.log(`?? Joint repositionn�: sommet bloc ${blockTopY} cm, hauteur joint ${newJointHeight} cm, nouveau centre Y: ${newPositionY} cm`);
                    console.log(`?? V�rification: sommet joint = ${newPositionY + newJointHeight/2} cm (doit = ${blockTopY} cm)`);
                } else {
                    newPositionY = newJointHeight / 2;
                }
                
                element.updatePosition(
                    element.position.x,
                    newPositionY,
                    element.position.z
                );
                
                updatedCount++;
                console.log(`?? Joint debout ${elementId} (${targetType}) mis � jour: ${element.dimensions.length}�${element.dimensions.width}�${newJointHeight} cm`);
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
                
                // Ne mettre � jour que les joints du type cible
                if (jointAssiseType !== targetType) {
                    continue;
                }
                
                // CORRECTION: Pour le joint horizontal, utiliser la hauteur sp�cifique de l'assise
                const newJointHeight = this.getJointHeightForAssise(jointAssiseType, elementAssiseIndex);
                
                // Mettre � jour les dimensions
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
                console.log(`?? Joint horizontal ${elementId} (${targetType}) mis � jour: ${element.dimensions.length}�${element.dimensions.width}�${newJointHeight} cm`);
            }
        }
        
        if (updatedCount > 0) {
            console.log(`?? ${updatedCount} joints ${targetType} mis � jour`);
        }
    }
    
    // === M�THODES UTILITAIRES ===
    
    // Trouver un �l�ment par son ID dans la sc�ne
    findElementById(elementId) {
        if (window.SceneManager && window.SceneManager.scene) {
            return window.SceneManager.scene.getObjectByProperty('userData.id', elementId);
        }
        return null;
    }
    
    // Mettre � jour la position d'un �l�ment dans son assise
    updateElementPositionInAssise(elementOrMesh, type, assiseIndex) {
        if (!elementOrMesh) return;
        
        const assiseHeight = this.calculateAssiseHeightForType(type, assiseIndex);
        let elementHeight, mesh, elementId;
        
        // D�tecter si c'est un �l�ment SceneManager ou un mesh THREE.js
        if (elementOrMesh.mesh && elementOrMesh.dimensions) {
            // C'est un �l�ment SceneManager
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
            console.warn('?? updateElementPositionInAssise: objet non reconnu', elementOrMesh);
            return;
        }
        
        // CORRECTION D�FINITIVE: Pour l'assise 0, la face inf�rieure DOIT �tre � l'�paisseur du joint
        let centerY;
        if (assiseIndex === 0) {
            // Pour l'assise 0, la face inf�rieure doit �tre � l'�paisseur du joint (assiseHeight)
            // Donc le centre doit �tre � assiseHeight + hauteur/2
            centerY = assiseHeight + elementHeight / 2;
        } else {
            // Pour les autres assises, utilise la hauteur calcul�e + hauteur/2
            centerY = assiseHeight + elementHeight / 2;
        }
        
        // Positionner l'�l�ment (mesh.position.y repr�sente le centre)
        mesh.position.y = centerY;
        
        // V�rification finale
        const actualBaseY = centerY - elementHeight / 2;
        
        console.log(`?? �l�ment ${elementId} repositionn� sur assise ${assiseIndex} (${type}):`);
        console.log(`   - Assise height: ${assiseHeight} cm`);
        console.log(`   - Centre Y: ${centerY} cm`);
        console.log(`   - Face inf�rieure Y: ${actualBaseY} cm`);
        console.log(`   - Hauteur: ${elementHeight} cm`);
        
        // V�rification sp�ciale pour assise 0
        if (assiseIndex === 0) {
            if (Math.abs(actualBaseY - assiseHeight) < 0.001) {
                console.log(`   ? PARFAIT! Face inf�rieure exactement � ${assiseHeight} cm`);
            } else {
                console.error(`   ? ERREUR! Face inf�rieure � ${actualBaseY} cm au lieu de ${assiseHeight} cm`);
            }
        }
    }
}

// Instance globale - S'assurer qu'elle est disponible imm�diatement
if (typeof window !== 'undefined') {
    window.AssiseManager = new AssiseManager();
    // console.log('? AssiseManager global cr�� avec m�thodes:', 
    //     typeof window.AssiseManager.getAssiseTypeLabel === 'function');
} else {
    console.warn('?? Window non disponible pour AssiseManager');
}

