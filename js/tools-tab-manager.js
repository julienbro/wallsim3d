/**
 * Gestionnaire de l'onglet Outils - Remplace le menu flottant d'assise
 * Gère les fonctionnalités d'assise directement dans la barre latérale
 */

// Variables de debug globales - désactivées par défaut pour réduire le bruit
window.DEBUG_TOOLS_TAB = false;
window.DEBUG_CONSTRUCTION = false;
window.DEBUG_WALL_ELEMENT = false;
window.DEBUG_TAB_MANAGER = false;
window.DEBUG_APP = false;

class ToolsTabManager {
    constructor() {
        this.isSelectMode = false; // Mode pour sélectionner l'assise d'un élément existant
        this.selectedAssiseForPlacement = null; // Assise cible pour le placement
        this.originalCanSelectElement = null; // Sauvegarde de la fonction originale
        this.originalGridState = null; // Sauvegarde de l'état des grilles
        this.lastUpdateTime = 0; // Pour éviter les appels trop fréquents
        this.updateThrottle = 150; // Délai minimum entre les mises à jour (150ms)
        this.lastSelectorState = null; // Pour détecter les changements de sélecteur
        this.lastPreviewCache = null; // Cache pour éviter les recalculs inutiles
        
        // Variables pour l'aperçu 3D animé
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.currentMesh = null;
        this.currentEdges = null;
        this.brickGroup = null;
        this.toolsAnimationId = null;
        
        // Écouter les changements de sélection de brique
        document.addEventListener('brickSelectionChanged', (e) => {
            if (e.detail?.brickData) {
                const brickElement = {
                    type: e.detail.brickType,
                    name: e.detail.brickData.name || e.detail.brickType,
                    dimensions: {
                        length: e.detail.brickData.length,
                        width: e.detail.brickData.width,
                        height: e.detail.brickData.height
                    },
                    category: e.detail.brickData.category || 'brick'
                };
                // Mémoriser la brique sélectionnée pour l'afficher dans l'onglet Outils
                this.selectedBrickElement = brickElement;
                
                // Si nous sommes dans l'onglet Outils, afficher immédiatement
                if (typeof currentMainTab !== 'undefined' && currentMainTab === 'outils') {
                    this.renderElementPreview(brickElement);
                }
            } else {
                this.updateActiveElementPreview();
            }
        });

        document.addEventListener('blockSelectionChanged', (e) => {
            this.updateActiveElementPreview();
        });

        document.addEventListener('insulationSelectionChanged', (e) => {
            this.updateActiveElementPreview();
        });

        document.addEventListener('linteauSelectionChanged', (e) => {
            this.updateActiveElementPreview();
        });
        
        document.addEventListener('libraryItemSelected', (e) => {
            // Masquer les aides contextuelles lors de la sélection d'un élément de bibliothèque
            if (window.TabManager && window.TabManager.hideAllContextualHelp) {
                window.TabManager.hideAllContextualHelp();
            }
            
            Promise.resolve().then(() => {
                this.updateActiveElementPreview();
            });
        });
        
        document.addEventListener('libraryCutButtonSelected', (e) => {
            // Masquer les aides contextuelles lors de la sélection d'un bouton de coupe
            if (window.TabManager && window.TabManager.hideAllContextualHelp) {
                window.TabManager.hideAllContextualHelp();
            }
            
            Promise.resolve().then(() => {
                this.updateActiveElementPreview();
            });
        });
        
        // Écouter les changements d'onglet pour mettre à jour l'aperçu
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-button')) {
                // Log retiré: clic onglet
                
                // Vérifier si on doit ignorer ce clic (clic programmatique depuis activateToolsTab)
                if (window.skipTabClickHandler) {
                    // Log retiré: clic programmatique ignoré
                    return;
                }
                
                // Si c'est l'onglet Outils qui devient actif, forcer la mise à jour de l'aperçu 3D
                if (e.target.dataset.tab === 'outils') {
                    // Log retiré: activation onglet Outils
                    setTimeout(() => {
                        this.forceRefresh3DPreview();
                    }, 100);
                }
                
                Promise.resolve().then(() => {
                    this.updateActiveElementPreview();
                    // S'assurer qu'un élément par défaut est sélectionné pour le nouvel onglet
                    // SEULEMENT si aucune brique n'est actuellement sélectionnée
                    if (!window.BrickSelector || !window.BrickSelector.currentBrick || 
                        window.BrickSelector.currentBrick.trim() === '') {
                        // Log retiré: sélection par défaut
                        this.ensureDefaultElementSelection();
                    } else {
                        // Log retiré: brique déjà sélectionnée
                    }
                });
            }
        });
        
        // console.log('✅ Gestionnaire d\'onglet Outils prêt');
    }

    setupEventListeners() {
        // Sélecteur d'assise
        const assiseSelect = document.getElementById('tabAssiseSelect');
        if (assiseSelect) {
            assiseSelect.addEventListener('change', (e) => {
                const assiseIndex = parseInt(e.target.value);
                if (window.AssiseManager) {
                    const success = window.AssiseManager.setActiveAssise(assiseIndex);
                    // console.log('🔧 Changement assise via sélecteur:', success ? 'réussi' : 'échoué');
                    this.updateDisplay();
                }
            });
        }

        // Bouton mode sélection d'assise
        const selectModeBtn = document.getElementById('selectAssiseModeTab');
        if (selectModeBtn) {
            selectModeBtn.addEventListener('click', () => {
                this.toggleSelectMode();
            });
        }

        // Bouton ajouter assise
        const addAssiseBtn = document.getElementById('addAssiseTab');
        if (addAssiseBtn) {
            addAssiseBtn.addEventListener('click', () => {
                this.addAssise();
            });
        }

        // Bouton supprimer assise
        const removeAssiseBtn = document.getElementById('removeAssiseTab');
        if (removeAssiseBtn) {
            removeAssiseBtn.addEventListener('click', () => {
                this.removeAssise();
            });
        }

        // Boutons aides visuelles
        const toggleGridsBtn = document.getElementById('toggleGridsTab');
        if (toggleGridsBtn) {
            toggleGridsBtn.addEventListener('click', () => {
                this.toggleGrids();
            });
        }

        const toggleMarkersBtn = document.getElementById('toggleMarkersTab');
        if (toggleMarkersBtn) {
            toggleMarkersBtn.addEventListener('click', () => {
                this.toggleMarkers();
            });
        }

        const toggleSnapBtn = document.getElementById('toggleSnapPointTab');
        if (toggleSnapBtn) {
            toggleSnapBtn.addEventListener('click', () => {
                this.toggleSnapPoint();
            });
        }

        // Contrôle hauteur des joints
        const jointHeightInput = document.getElementById('jointHeightTab');
        if (jointHeightInput) {
            jointHeightInput.addEventListener('input', (e) => {
                const height = parseFloat(e.target.value);
                if (window.AssiseManager && !isNaN(height)) {
                    window.AssiseManager.jointHeight = height;
                }
            });
        }

        // Event listeners pour les boutons de coupe
        this.setupCutButtonsListeners();
    }

    setupCutButtonsListeners() {
        // Utiliser la délégation d'événements pour les boutons de coupe
        const cutButtonsContainer = document.getElementById('toolsCutButtons');
        if (cutButtonsContainer) {
            cutButtonsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('cut-btn-mini')) {
                    const cutType = e.target.getAttribute('data-cut');
                    const baseType = e.target.getAttribute('data-base-type');
                    
                    // console.log('🖱️ Clic sur bouton coupe:', cutType, 'pour', baseType);
                    this.selectCutInTools(cutType, baseType, e.target);
                }
            });
        }

        // Ajout: gestion dédiée des boutons PROFIL où qu'ils se trouvent dans la bibliothèque
        // Cela évite de dépendre d'un conteneur spécifique (#toolsCutButtons) qui peut ne pas exister.
        document.addEventListener('click', (e) => {
            const btn = e.target && e.target.closest && e.target.closest('.cut-btn-mini[data-base-type="PROFIL"]');
            if (!btn) return;

            // Empêcher le gestionnaire générique de TabManager d'interférer
            e.preventDefault();
            e.stopPropagation();

            const cutType = btn.getAttribute('data-cut');
            this.selectCutInTools(cutType, 'PROFIL', btn);
        }, true);
    }

    updateDisplay() {
        // Protection contre les appels trop fréquents
        const now = Date.now();
        if (now - this.lastUpdateTime < this.updateThrottle) {
            return;
        }
        this.lastUpdateTime = now;
        
                // Mettre à jour l'affichage de l'assise courante
        const currentAssiseDisplay = document.getElementById('currentAssiseDisplayTab');
        const assiseStatus = document.getElementById('assiseStatusTab');
        const assiseSelect = document.getElementById('tabAssiseSelect');

        if (window.AssiseManager) {
            const currentIndex = window.AssiseManager.currentAssise;
            const currentType = window.AssiseManager.currentType;
            const assisesList = window.AssiseManager.assises;
            const typeAssises = window.AssiseManager.assisesByType.get(currentType);
            
            // console.log('🔧 Données AssiseManager:', {
            //     currentIndex,
            //     currentType,
            //     typeAssisesSize: typeAssises ? typeAssises.size : 'undefined',
            //     assisesList: assisesList ? assisesList.length : 'undefined'
            // });

            if (currentAssiseDisplay) {
                currentAssiseDisplay.textContent = `Type: ${currentType} - Assise ${currentIndex + 1}`;
            }

            if (assiseStatus) {
                const hasElements = assisesList[currentIndex] && assisesList[currentIndex].length > 0;
                assiseStatus.textContent = hasElements ? '● Active (avec éléments)' : '● Active (vide)';
                assiseStatus.className = `assise-status ${hasElements ? 'active' : 'empty'}`;
            }

            // Mettre à jour le sélecteur
            if (assiseSelect) {
                // console.log('🔧 Mise à jour du sélecteur d\'assise...');
                // Vider et reconstruire les options
                assiseSelect.innerHTML = '';
                if (typeAssises) {
                    // console.log('🔧 TypeAssises trouvé, taille:', typeAssises.size);
                    // typeAssises est une Map, donc utiliser size et parcourir les clés
                    for (let i = 0; i < typeAssises.size; i++) {
                        if (typeAssises.has(i)) {
                            const option = document.createElement('option');
                            option.value = i;
                            option.textContent = `Assise ${i + 1}`;
                            if (i === currentIndex) {
                                option.selected = true;
                            }
                            assiseSelect.appendChild(option);
                            // console.log(`🔧 Option ajoutée: Assise ${i + 1}`);
                        }
                    }
                } else {
                    // Aucune assise trouvée pour le type
                }
            }

            // Mettre à jour la hauteur des joints dans l'input
            const jointHeightInput = document.getElementById('jointHeightTab');
            if (jointHeightInput) {
                jointHeightInput.value = window.AssiseManager.jointHeight;
            }
        } else {
            console.warn('🔧 AssiseManager non disponible pour updateDisplay');
        }
        
        // Mettre à jour l'aperçu de l'élément actif et ses boutons de coupe
        this.updateActiveElementPreview();
    }

    // Détecter le type de coupe actuel à partir du fantôme ou des sélecteurs
    detectCurrentCut(activeMode = null) {
        // 
        let cutInfo = { type: null, ratio: 1.0, suffix: '' };

        // 🔥 PRIORITÉ 1: Vérifier le type de brique actuel (ex: M50_HALF)
        if ((activeMode === 'brique' || activeMode === 'brick') && window.BrickSelector) {
            const brickData = window.BrickSelector.getCurrentBrick();
            const originalType = brickData?.type || window.BrickSelector.currentBrick;
            
            if (originalType && typeof originalType === 'string' && originalType.includes('_')) {
                const suffix = originalType.split('_')[1];
                
                switch (suffix) {
                    case '3Q':
                        cutInfo = { type: '3/4', ratio: 0.75, suffix: '_3Q' };
                        break;
                    case 'HALF':
                        cutInfo = { type: '1/2', ratio: 0.5, suffix: '_HALF' };
                        break;
                    case '1Q':
                        cutInfo = { type: '1/4', ratio: 0.25, suffix: '_1Q' };
                        break;
                    case 'P':
                        cutInfo = { type: 'P', ratio: 0.1, suffix: '_P' };
                        break;
                }
                
                if (cutInfo.type) {
                    return cutInfo; // Retourner immédiatement si trouvé
                }
            } else if (originalType && !originalType.includes('_')) {
                // Pas de suffixe = brique entière
                cutInfo = { type: '1/1', ratio: 1.0, suffix: '' };
                return cutInfo;
            }
        }

        // 2. Vérifier via le fantôme si disponible (fallback)
        if (window.SceneManager && window.SceneManager.ghostElement && window.SceneManager.ghostElement.userData) {
            const ghostType = window.SceneManager.ghostElement.userData.elementType;
            // 
            if (ghostType && ghostType.includes('_')) {
                // Extraire le suffixe de coupe du type fantôme
                if (ghostType.includes('_3Q')) {
                    cutInfo = { type: '3/4', ratio: 0.75, suffix: '_3Q' };
                } else if (ghostType.includes('_HALF')) {
                    cutInfo = { type: '1/2', ratio: 0.5, suffix: '_HALF' };
                } else if (ghostType.includes('_1Q')) {
                    cutInfo = { type: '1/4', ratio: 0.25, suffix: '_1Q' };
                } else if (ghostType.includes('_P')) {
                    cutInfo = { type: 'P', ratio: 0.1, suffix: '_P' };
                }
                // console.log('🎨 Coupe détectée via fantôme:', cutInfo, 'pour type:', ghostType);
            }
        } else {
            // 
        }

        // 3. Si pas trouvé via fantôme, vérifier via TabManager.selectedCutType
        if (cutInfo.type === null && window.TabManager && window.TabManager.selectedCutType) {
            const cutType = window.TabManager.selectedCutType;
            // 
            const ratios = { '3/4': 0.75, '1/2': 0.5, '1/4': 0.25, 'P': 0.1 };
            const suffixes = { '3/4': '_3Q', '1/2': '_HALF', '1/4': '_1Q', 'P': '_P' };
            
            if (ratios[cutType]) {
                cutInfo = { 
                    type: cutType, 
                    ratio: ratios[cutType], 
                    suffix: suffixes[cutType] 
                };
                // console.log('🎨 Coupe détectée via TabManager:', cutInfo);
            }
        } else {
                    }

        // 4. Si toujours pas trouvé, vérifier selectedLibraryItem dans TabManager (ex: "PUR5_HALF")
        if (cutInfo.type === null && window.TabManager && window.TabManager.selectedLibraryItem) {
            const selectedItem = window.TabManager.selectedLibraryItem;
            // 
            
            // Analyser le nom de l'item pour extraire le suffixe de coupe
            if (selectedItem && typeof selectedItem === 'string') {
                if (selectedItem.includes('_3Q')) {
                    cutInfo = { type: '3/4', ratio: 0.75, suffix: '_3Q' };
                } else if (selectedItem.includes('_HALF')) {
                    cutInfo = { type: '1/2', ratio: 0.5, suffix: '_HALF' };
                } else if (selectedItem.includes('_1Q')) {
                    cutInfo = { type: '1/4', ratio: 0.25, suffix: '_1Q' };
                } else if (selectedItem.includes('_P')) {
                    cutInfo = { type: 'P', ratio: 0.1, suffix: '_P' };
                }
                if (cutInfo.type) {
                    // console.log('🎨 Coupe détectée via selectedLibraryItem:', cutInfo);
                }
            }
        }

        // 5. Si toujours pas trouvé, vérifier le dernier type synchronisé dans TabManager
        if (cutInfo.type === null && window.TabManager) {
            // Examiner les logs récents pour voir quel était le dernier itemType passé (ex: PUR5_HALF)
            // 
        }

        // 6. Dernière tentative: analyser le type d'isolant actuel pour détecter un suffixe de coupe
        if (cutInfo.type === null && (activeMode === 'isolant' || activeMode === 'insulation') && window.InsulationSelector) {
            const currentType = window.InsulationSelector.getCurrentInsulation();
            // 
            
            // Si le type contient un suffixe, l'extraire (même si cela devrait pas arriver normalement)
            if (currentType && typeof currentType === 'string') {
                if (currentType.includes('_3Q')) {
                    cutInfo = { type: '3/4', ratio: 0.75, suffix: '_3Q' };
                } else if (currentType.includes('_HALF')) {
                    cutInfo = { type: '1/2', ratio: 0.5, suffix: '_HALF' };
                } else if (currentType.includes('_1Q')) {
                    cutInfo = { type: '1/4', ratio: 0.25, suffix: '_1Q' };
                } else if (currentType.includes('_P')) {
                    cutInfo = { type: 'P', ratio: 0.1, suffix: '_P' };
                }
                if (cutInfo.type) {
                    // console.log('🎨 Coupe détectée via analyse type isolant:', cutInfo);
                }
            }
        }

        // 
        
        // 🔥 FIX: Si aucune coupe n'a été détectée, retourner "1/1" par défaut
        if (cutInfo.type === null) {
            cutInfo = { type: '1/1', ratio: 1.0, suffix: '' };
        }
        
        return cutInfo;
    }

    updateActiveElementPreview(forceElement = null, force = false) {
        // Vérifier si le gestionnaire est désactivé (onglet Outils supprimé)
        if (this.isDisabled) {
            return;
        }
        
        // Log réduit - seulement si forceElement ou debug activé
        if (forceElement && window.DEBUG_TOOLS_TAB) {
            // Log retiré: updateActiveElementPreview appelée avec forceElement
        }
        
        // Si un élément est forcé (depuis la sélection), l'utiliser directement
        if (forceElement) {
            if (window.DEBUG_TOOLS_TAB) {
                // Log retiré: Utilisation d'élément forcé
            }
            this.renderElementPreview(forceElement);
            return;
        }
        
        // Si une brique est sélectionnée et mémorisée, l'utiliser en priorité
        if (this.selectedBrickElement) {
            // Log retiré: Utilisation de la brique mémorisée
            this.renderElementPreview(this.selectedBrickElement);
            return;
        }
        
        // Throttling plus agressif pour éviter les appels trop fréquents
        const now = Date.now();
        if (now - this.lastUpdateTime < this.updateThrottle) {
            return;
        }
        this.lastUpdateTime = now;
        
        // Vérification rapide de la visibilité - éviter le travail si non visible
        const canvas = document.getElementById('toolsActiveElementCanvas');
        if (!canvas || !canvas.offsetParent) {
            // Canvas non visible, pas besoin de le mettre à jour
            return;
        }
        
        // Vérification supplémentaire: onglet Outils actif
        const toolsTab = document.querySelector('[data-tab="outils"]');
        if (!toolsTab || !toolsTab.classList.contains('active')) {
            // Onglet non actif, éviter le rendu coûteux
            return;
        }
        
        const nameElement = document.getElementById('toolsElementName');
        const dimensionsElement = document.getElementById('toolsElementDimensions');
    const cutButtonsContainer = document.getElementById('toolsCutButtons');
    // Log retiré: Container boutons coupe trouvé

        if (!nameElement || !dimensionsElement || !cutButtonsContainer) {
            if (window.DEBUG_TOOLS_TAB) {
                console.warn('🎨 Éléments DOM manquants pour l\'aperçu 3D');
            }
            return;
        }

        // 

        // Déterminer l'élément actif
        let activeElement = null;
        let elementType = 'brique';
        
        // Vérifier tous les sélecteurs disponibles
        const selectorStates = {
            brick: window.BrickSelector?.currentBrick || 'none',
            block: window.BlockSelector?.currentBlock || 'none',
            insulation: window.InsulationSelector?.currentInsulation?.name || window.InsulationSelector?.currentInsulation?.type || 'none',
            linteau: window.LinteauSelector?.currentLinteau?.name || window.LinteauSelector?.currentLinteau?.type || 'none',
            tempGLB: window.tempGLBInfo?.type || 'none',
            lastPlacedGLB: window.lastPlacedGLBInfo?.type || 'none'
        };
        
        // Créer une clé de cache pour vérifier si quelque chose a changé
        const stateKey = Object.values(selectorStates).join('|');
        
        // Vérifier le cache seulement si ce n'est pas un rendu forcé
        if (!force && this.lastPreviewCache && this.lastPreviewCache.stateKey === stateKey) {
            return; // Rien n'a changé, pas besoin de recalculer
        }
        
        // Log uniquement si quelque chose a changé ET si debug activé
        if ((!this.lastSelectorState || this.lastSelectorState !== stateKey) && window.DEBUG_TOOLS_TAB) {
            // Log retiré: États sélecteurs
            this.lastSelectorState = stateKey;
        }

        // Déterminer le mode actif
        let activeMode = 'brique'; // Par défaut
        
        // 1. Vérifier via ConstructionTools si disponible
        if (window.ConstructionTools && window.ConstructionTools.currentMode) {
            activeMode = window.ConstructionTools.currentMode;
        }
        // 2. Vérifier quel onglet/mode est actuellement actif via CSS
        else {
            const activeTab = document.querySelector('.tab-button.active');
            if (activeTab) {
                const tabId = activeTab.getAttribute('data-tab');
                if (tabId === 'bibliotheque') activeMode = 'brique';
                else if (tabId === 'blocs') activeMode = 'bloc';
                else if (tabId === 'isolant') activeMode = 'isolant';
                else if (tabId === 'linteaux') activeMode = 'linteau';
            }
        }
        // 3. Fallback: vérifier via AssiseManager
        if (!activeMode || activeMode === 'brique') {
            if (window.AssiseManager && window.AssiseManager.currentType) {
                const ct = window.AssiseManager.currentType;
                let mapped = 'brique';
                if (typeof ct === 'string') {
                    const upper = ct.toUpperCase();
                    if (upper === 'INSULATION') {
                        mapped = 'isolant';
                    } else if (upper === 'LINTEAU') {
                        mapped = 'linteau';
                    } else if (upper === 'BRICK' || upper.startsWith('M')) {
                        mapped = 'brique';
                    } else if (upper === 'BLOCK' || ['HOLLOW','CELLULAR','ARGEX','TERRACOTTA'].some(t => upper === t)) {
                        mapped = 'bloc';
                    }
                }
                activeMode = mapped;
            }
        }
        
        // Détecter le type de coupe maintenant que activeMode est défini
        let cutInfo = this.detectCurrentCut(activeMode);
        
        // PRIORITÉ: Vérifier d'abord les éléments GLB actifs
        
        if (window.tempGLBInfo) {
            // Effacer la brique mémorisée quand un GLB est sélectionné
            this.selectedBrickElement = null;
            
            // Élément GLB actif (en cours de sélection)
            const glbInfo = window.tempGLBInfo;
            
            // Vérification de sécurité pour glbInfo
            if (glbInfo && (glbInfo.type || glbInfo.name)) {
                activeElement = {
                    name: glbInfo.name || glbInfo.type || 'GLB Element',
                    type: glbInfo.type || 'glb_element',
                    elementType: 'glb',
                    path: glbInfo.path || '',
                    scale: glbInfo.scale || { x: 1, y: 1, z: 1 },
                    lengthValue: glbInfo.lengthValue || '200',
                    length: parseInt(glbInfo.lengthValue) || 200,
                    ...glbInfo
                };
                elementType = 'glb';
            } else {
                // Fallback vers les sélecteurs normaux
                activeElement = null;
            }
        }
        // 🔥 CORRECTION: Vérifier lastPlacedGLBInfo si tempGLBInfo n'existe pas
        else if (window.lastPlacedGLBInfo) {
            // Effacer la brique mémorisée quand un GLB est sélectionné
            this.selectedBrickElement = null;
            
            // Élément GLB récemment placé - maintenir l'affichage de l'élément GLB
            const glbInfo = window.lastPlacedGLBInfo;
            
            if (glbInfo && (glbInfo.type || glbInfo.name)) {
                activeElement = {
                    name: glbInfo.name || glbInfo.type || 'GLB Element',
                    type: glbInfo.type || 'glb_element',
                    elementType: 'glb',
                    path: glbInfo.path || '',
                    scale: glbInfo.scale || { x: 1, y: 1, z: 1 },
                    lengthValue: glbInfo.lengthValue || '200',
                    length: parseInt(glbInfo.lengthValue) || 200,
                    ...glbInfo
                };
                elementType = 'glb';
            }
        }
        
        // Sélectionner l'élément selon le mode actif seulement si aucun GLB n'est actif
        else if ((activeMode === 'brique' || activeMode === 'brick') && window.BrickSelector && window.BrickSelector.currentBrick) {
            try {
                const brickData = window.BrickSelector.getCurrentBrick();
                if (brickData) {
                    // Vérifier si c'est un élément GLB
                    if (brickData.category === 'glb' || brickData.glbPath) {
                        activeElement = { 
                            name: brickData.name || brickData.type || window.BrickSelector.currentBrick, 
                            type: brickData.type || window.BrickSelector.currentBrick, 
                            elementType: 'glb',
                            ...brickData
                        };
                        elementType = 'glb';
                    } else {
                        // ✅ CORRECTION: Utiliser le type exact (avec coupe) pour l'affichage correct
                        const currentType = brickData.type || window.BrickSelector.currentBrick;
                        const baseType = currentType.split('_')[0];
                        
                        // Chercher les données de l'élément de base pour les boutons de coupe
                        let baseBrickData = window.BrickSelector.brickTypes[baseType];
                        if (!baseBrickData) {
                            // Fallback vers les données actuelles si la base n'existe pas
                            baseBrickData = brickData;
                        }
                        
                        // ✅ UTILISER LE TYPE EXACT (avec coupe) pour l'affichage
                        activeElement = { 
                            name: brickData.name || currentType, // ✅ Nom avec coupe (ex: "Brique M50 1/2")
                            type: currentType, // ✅ Type avec coupe (ex: "M50_HALF")
                            baseType: baseType, // ✅ Type de base pour les boutons (ex: "M50")
                            elementType: 'brique',
                            // ✅ Utiliser les dimensions actuelles (avec coupe appliquée)
                            length: brickData.length, // ✅ Dimensions avec coupe (ex: 9cm pour M50_HALF)
                            width: brickData.width,
                            height: brickData.height,
                            ...brickData // ✅ Toutes les données de la brique avec coupe
                        };
                        elementType = 'brique';
                    }
                } else {
                    activeElement = { 
                        name: window.BrickSelector.currentBrick, 
                        type: window.BrickSelector.currentBrick, 
                        elementType: 'brique' 
                    };
                    elementType = 'brique';
                }
            } catch (error) {
                console.warn('Erreur lors de la récupération des données de brique:', error);
                activeElement = { 
                    name: window.BrickSelector.currentBrick, 
                    type: window.BrickSelector.currentBrick, 
                    elementType: 'brique' 
                };
                elementType = 'brique';
            }
        } else if ((activeMode === 'bloc' || activeMode === 'block') && window.BlockSelector && window.BlockSelector.currentBlock) {
            const blockType = window.BlockSelector.currentBlock;
            const blockData = window.BlockSelector.getCurrentBlockData();
            activeElement = blockData ? { 
                name: blockData.name || blockType, 
                type: blockType, 
                elementType: 'bloc',
                ...blockData 
            } : { name: blockType, type: blockType, elementType: 'bloc' };
            elementType = 'bloc';
        } else if ((activeMode === 'isolant' || activeMode === 'insulation') && window.InsulationSelector) {
            const insulationType = window.InsulationSelector.getCurrentInsulation();
            const insulationData = window.InsulationSelector.getCurrentInsulationData();
            // 
            if (insulationData) {
                activeElement = {
                    name: insulationData.name || insulationType,
                    type: insulationType,
                    elementType: 'isolant',
                    ...insulationData
                };
                elementType = 'isolant';
            }
        } else if ((activeMode === 'linteau' || activeMode === 'lintel') && window.LinteauSelector && window.LinteauSelector.currentLinteau) {
            // 
            activeElement = window.LinteauSelector.currentLinteau;
            elementType = 'linteau';
        }

        // Debug: afficher les données des sélecteurs disponibles
        if (!activeElement && (activeMode === 'isolant' || activeMode === 'insulation')) {
            // 
        }

        if (activeElement) {       
            if (window.DEBUG_TOOLS_TAB) {
                // Log retiré: Élément actif détecté
            }
            // Mettre à jour les informations de l'élément
            const displayName = activeElement.name || activeElement.type || 'Élément inconnu';
            if (window.DEBUG_TOOLS_TAB) {
                // Log retiré: Mise à jour nom affichage
            }
            nameElement.textContent = displayName;
            
            // Mettre à jour les dimensions (ajustées selon la coupe si nécessaire)
            let dims;
            if (activeElement.length && activeElement.width && activeElement.height) {
                // Pour les éléments GLB, utiliser la longueur personnalisée si disponible
                const currentLength = (activeElement.category === 'glb' && activeElement.customLength) 
                    ? activeElement.customLength 
                    : activeElement.length;
                
                if (cutInfo.type && cutInfo.ratio !== 1.0) {
                    // Calculer les dimensions coupées (généralement on coupe la longueur)
                    const cutLength = Math.round(currentLength * cutInfo.ratio);
                    dims = `${cutLength}×${activeElement.height}×${activeElement.width} cm (${cutInfo.type})`;
                } else {
                    dims = `${currentLength}×${activeElement.height}×${activeElement.width} cm`;
                    // Ajouter un indicateur pour les longueurs personnalisées GLB
                    if (activeElement.category === 'glb' && activeElement.customLength) {
                        dims += ' (personnalisé)';
                    }
                }
            } else {
                dims = 'Dimensions non disponibles';
            }
            dimensionsElement.textContent = dims;
            // console.log('🔄 Dimensions mises à jour:', dims);

            // Initialiser l'aperçu 3D pour tous les types d'éléments
            if (window.LibraryPreview3D && (elementType === 'brique' || elementType === 'bloc' || elementType === 'isolant' || elementType === 'linteau' || elementType === 'glb')) {
                // Pour les linteaux, utiliser activeElement.name pour correspondre aux configs, sinon activeElement.type
                const elementTypeValue = elementType === 'linteau' ? activeElement.name : activeElement.type;
                // 🔥 FIX: Traiter correctement le cas "1/1" comme "full"
                const cutSignature = (cutInfo.type === '1/1' || !cutInfo.type) ? 'full' : cutInfo.type;
                const canvasSignature = `${elementTypeValue}_${cutSignature}`;
                const currentCanvasType = canvas.getAttribute('data-element-type');
                const currentElementType = canvas.getAttribute('data-current-element-type');
                
                // Éviter les reinitialisations inutiles mais prendre en compte les changements de coupe
                // ET les changements de type d'élément (brique vs GLB)
                const needsUpdate = currentCanvasType !== canvasSignature || currentElementType !== elementType;
                
                if (needsUpdate) {
                    canvas.setAttribute('data-element-type', canvasSignature);
                    canvas.setAttribute('data-current-element-type', elementType);
                    
                    try {
                        // Pour les GLB, utiliser directement le système LibraryPreview3D
                        if (elementType === 'glb') {
                            this.createGLBPreviewUsingLibrary(canvas, activeElement);
                        } else {
                            this.create3DPreview(canvas, elementTypeValue, elementType, cutInfo);
                        }
                        // console.log('🎨 Aperçu 3D initialisé pour:', elementTypeValue, 'type:', elementType, 'coupe:', cutInfo.type || 'entier');
                    } catch (error) {
                        console.warn('Erreur lors de l\'initialisation de l\'aperçu 3D:', error);
                        this.drawFallbackPreview(canvas, activeElement, elementType);
                    }
                } else {
                    // console.log('🎨 Aperçu 3D déjà initialisé pour:', elementTypeValue, 'coupe:', cutInfo.type || 'entier');
                }
            } else {
                this.drawFallbackPreview(canvas, activeElement, elementType);
            }

            // Mettre à jour les boutons de coupe pour les éléments qui supportent les coupes (logs retirés)
            if (activeElement && activeElement.type) {
                this.updateToolsCutButtons(cutButtonsContainer, activeElement);
            } else if (elementType === 'glb' && activeElement) {
                this.updateGLBLengthButtons(cutButtonsContainer, activeElement);
            } else {
                cutButtonsContainer.style.display = 'none';
            }

            // Marquer la section comme active
            const activeElementContainer = document.querySelector('.tools-active-element');
            if (activeElementContainer) {
                activeElementContainer.classList.add('active');
            }
            
            // console.log('🎨 Élément sélectionné:', elementType, '-', activeElement.name || activeElement.type);
        } else {            
            // Aucun élément actif - afficher un message selon le mode
            nameElement.textContent = `Aucun élément ${activeMode} sélectionné`;
            dimensionsElement.textContent = 'Sélectionnez un élément';
            cutButtonsContainer.style.display = 'none';

            // Dessiner un aperçu vide
            this.drawEmptyPreview(canvas, activeMode);

            // Retirer la classe active
            const activeElementContainer = document.querySelector('.tools-active-element');
            if (activeElementContainer) {
                activeElementContainer.classList.remove('active');
            }
        }
        
        // Mettre à jour le cache
        this.lastPreviewCache = {
            stateKey: stateKey,
            timestamp: now
        };
    }

    renderElementPreview(element) {
        // Vérifier si le gestionnaire est désactivé (onglet Outils supprimé)
        if (this.isDisabled) {
            return;
        }
        
        if (window.DEBUG_TOOLS_TAB) {
            // Log retiré: Rendu d'élément forcé
        }
        
        const canvas = document.getElementById('toolsActiveElementCanvas');
        const nameElement = document.getElementById('toolsElementName');
        const dimensionsElement = document.getElementById('toolsElementDimensions');
        const cutButtonsContainer = document.getElementById('toolsCutButtons');

        if (!nameElement || !dimensionsElement || !cutButtonsContainer || !canvas) {
            // Ces éléments appartiennent à l'onglet Outils supprimé - ignorer silencieusement
            return;
        }

        // Mettre à jour les informations de l'élément
        nameElement.textContent = element.name || element.type || 'Élément inconnu';
        
        // Mettre à jour les dimensions
        let dims;
        if (element.dimensions) {
            dims = `${element.dimensions.length}×${element.dimensions.height}×${element.dimensions.width} cm`;
        } else {
            dims = 'Dimensions non disponibles';
        }
        dimensionsElement.textContent = dims;

        // Déterminer le type d'élément plus intelligemment
        let elementType = 'glb'; // Défaut pour les éléments GLB
        
        // Vérifier si c'est une brique simple
        if (element.type && (element.type.startsWith('M') || element.type.includes('brique'))) {
            elementType = 'brick';
        } else if (element.userData && element.userData.isGLB) {
            elementType = 'glb';
        } else if (element.path && element.path.includes('.glb')) {
            elementType = 'glb';
        }

    // Log retiré: Type d'élément détecté

        // Initialiser l'aperçu selon le type d'élément
        if (window.LibraryPreview3D && elementType === 'glb') {
            const cutSignature = 'full'; // Pas de coupe pour la sélection
            const canvasSignature = `${element.type}_${cutSignature}`;
            const currentCanvasType = canvas.getAttribute('data-element-type');
            
            // Marquer le canvas comme aperçu actif prioritaire
            canvas.setAttribute('data-preview-type', '3d-active');
            canvas.setAttribute('data-priority', 'high');
            
            if (currentCanvasType !== canvasSignature) {
                canvas.setAttribute('data-element-type', canvasSignature);
                canvas.setAttribute('data-current-element-type', elementType);
                
                // Nettoyer tout aperçu de brique existant
                this.cleanupBrickPreview(canvas);
                
                // Récupérer le canvas actuel après nettoyage et le réinitialiser pour GLB
                const currentCanvas = document.getElementById('toolsActiveElementCanvas') || canvas;
                
                // Réinitialiser les attributs du canvas pour les GLB
                currentCanvas.style.display = '';
                currentCanvas.setAttribute('data-preview-type', '3d-active');
                currentCanvas.setAttribute('data-current-element-type', 'glb');
                currentCanvas.setAttribute('data-element-type', canvasSignature);
                
                // Logs retirés: Canvas réinitialisé pour GLB & Rendu aperçu 3D
                
                try {
                    // Vérifier que le canvas est visible et prêt
                    if (currentCanvas.style.display === 'none') {
                        console.warn('⚠️ Canvas encore caché, forçage de l\'affichage');
                        currentCanvas.style.display = '';
                    }
                    
                    // Attendre un court délai pour que le DOM se mette à jour
                    setTimeout(() => {
                        // Utiliser le canvas actuel pour les GLB
                        this.createGLBPreviewUsingLibrary(currentCanvas, element);
                        if (window.DEBUG_TOOLS_TAB) {
                            // Log retiré: Aperçu 3D GLB créé
                        }
                    }, 50);
                } catch (error) {
                    if (window.DEBUG_TOOLS_TAB) {
                        console.warn('Erreur lors de la création de l\'aperçu 3D GLB:', error);
                    }
                    this.drawFallbackPreview(canvas, element, elementType);
                }
            } else {
                // Log retiré: Aperçu 3D élément actif déjà à jour
            }
        } else if (elementType === 'brick') {
            // Pour les briques simples, créer un aperçu 3D dédié
            // Log retiré: Rendu aperçu 3D pour brique
            
            // Marquer le canvas comme aperçu de brique 3D
            canvas.setAttribute('data-preview-type', '3d-brick');
            canvas.setAttribute('data-priority', 'high');
            canvas.setAttribute('data-element-type', element.type);
            canvas.setAttribute('data-current-element-type', elementType);
            
            // Nettoyer tout aperçu de brique statique existant
            this.cleanupBrickPreview(canvas);
            
            // Créer un aperçu 3D dédié pour la brique
            this.createDedicated3DBrickPreview(canvas, element);
        } else {
            this.drawFallbackPreview(canvas, element, elementType);
        }

        // Mettre à jour les boutons de coupe pour les éléments GLB
        if (elementType === 'glb' && element) {
            this.updateGLBLengthButtons(cutButtonsContainer, element);
        } else {
            cutButtonsContainer.style.display = 'none';
        }

        // Marquer la section comme active
        const activeElementContainer = document.querySelector('.tools-active-element');
        if (activeElementContainer) {
            activeElementContainer.classList.add('active');
        }
        
        if (window.DEBUG_TOOLS_TAB) {
            // Log retiré: Élément GLB rendu
        }
    }

    // Dessiner un aperçu de brique sur le canvas
    drawBrickPreview(canvas, element) {
        // Log retiré: drawBrickPreview appelée
        
        // Vérifier si le canvas existe
        if (!canvas) {
            console.error('❌ Canvas non fourni pour drawBrickPreview');
            return;
        }
        
        // Si le canvas a un contexte WebGL, on doit le nettoyer d'abord
        const existingWebGL = canvas.getContext('webgl') || canvas.getContext('webgl2') || canvas.getContext('experimental-webgl');
        if (existingWebGL) {
            // Log retiré: Nettoyage du contexte WebGL existant
            // Perdre le contexte WebGL
            if (existingWebGL.getExtension('WEBGL_lose_context')) {
                existingWebGL.getExtension('WEBGL_lose_context').loseContext();
            }
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('❌ Impossible d\'obtenir le contexte 2D pour drawBrickPreview');
            return;
        }
        
    // Log retiré: Contexte 2D obtenu, début du dessin

        // Effacer le canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Dimensions du canvas
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // Calculer les dimensions de la brique à dessiner
        const brickWidth = canvasWidth * 0.6; // 60% de la largeur du canvas
        const brickHeight = canvasHeight * 0.3; // 30% de la hauteur du canvas
        const brickX = (canvasWidth - brickWidth) / 2;
        const brickY = (canvasHeight - brickHeight) / 2;

        // Couleur de la brique
        const brickColor = '#cc6633';
        const mortarColor = '#ddd';
        const shadowColor = 'rgba(0,0,0,0.2)';

        // Dessiner l'ombre
        ctx.fillStyle = shadowColor;
        ctx.fillRect(brickX + 3, brickY + 3, brickWidth, brickHeight);

        // Dessiner le mortier (joints)
        ctx.fillStyle = mortarColor;
        ctx.fillRect(brickX - 5, brickY - 3, brickWidth + 10, brickHeight + 6);

        // Dessiner la brique principale
        ctx.fillStyle = brickColor;
        ctx.fillRect(brickX, brickY, brickWidth, brickHeight);

        // Dessiner les contours
        ctx.strokeStyle = '#aa5522';
        ctx.lineWidth = 1;
        ctx.strokeRect(brickX, brickY, brickWidth, brickHeight);

        // Ajouter du texte avec le type de brique
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const text = element.name || element.type || 'Brique';
        ctx.fillText(text, canvasWidth / 2, canvasHeight - 30);

        // Ajouter les dimensions si disponibles
        if (element.dimensions) {
            ctx.font = '10px Arial';
            ctx.fillStyle = '#666';
            const dimText = `${element.dimensions.length}×${element.dimensions.width}×${element.dimensions.height} cm`;
            ctx.fillText(dimText, canvasWidth / 2, canvasHeight - 15);
        }

    // Log retiré: Aperçu de brique dessiné
    }

    // Créer un aperçu SVG pour brique en remplaçant le canvas
    createBrickSVGPreview(canvas, element) {
    // Log retiré: createBrickSVGPreview appelée
        
        // Cacher le canvas
        canvas.style.display = 'none';
        
        // Vérifier s'il y a déjà un aperçu SVG à côté
        let svgContainer = canvas.parentNode.querySelector('.brick-svg-preview');
        if (!svgContainer) {
            // Créer un container pour l'aperçu SVG
            svgContainer = document.createElement('div');
            svgContainer.className = 'brick-svg-preview';
            svgContainer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
            `;
            canvas.parentNode.appendChild(svgContainer);
        }
        
        // Utiliser le système d'aperçu statique existant
        if (window.toolsReusablePanel && window.toolsReusablePanel.createBrickStaticPreview) {
            // Log retiré: Génération aperçu statique SVG
            window.toolsReusablePanel.createBrickStaticPreview(svgContainer, element);
        } else {
            // Fallback : créer un aperçu simple
            svgContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: #f8f9fa; border-radius: 4px;">
                    <div style="width: 60%; height: 30%; background: #cc6633; border: 1px solid #aa5522; margin-bottom: 10px;"></div>
                    <div style="font-size: 12px; color: #333; text-align: center;">${element.name || element.type}</div>
                    ${element.dimensions ? `<div style="font-size: 10px; color: #666;">${element.dimensions.length}×${element.dimensions.width}×${element.dimensions.height} cm</div>` : ''}
                </div>
            `;
        }
        
    // Log retiré: Aperçu SVG de brique créé
    }

    // Nettoyer les aperçus de brique existants
    cleanupBrickPreview(canvas) {
    // Log retiré: Nettoyage aperçu de brique
        
        // Arrêter l'animation de brique s'il y en a une
        this.stopBrickAnimation();
        
        // Supprimer le canvas dédié de brique s'il existe, mais garder le canvas original
        const parent = canvas.parentNode || document.getElementById('toolsActiveElementCanvas')?.parentNode;
        if (parent) {
            const brickCanvas = parent.querySelector('.brick-3d-canvas');
            if (brickCanvas) {
                brickCanvas.remove();
                // Log retiré: Canvas 3D de brique supprimé
            }
            
            // Supprimer l'overlay d'informations de brique
            const infoOverlay = parent.querySelector('.brick-info-overlay');
            if (infoOverlay) {
                infoOverlay.remove();
                // Log retiré: Overlay informations brique supprimé
            }
            
            // Supprimer le container d'aperçu statique de brique s'il existe
            const staticContainer = parent.querySelector('.brick-static-preview');
            if (staticContainer) {
                staticContainer.remove();
                // Log retiré: Container statique supprimé
            }
            
            // Supprimer l'ancien container SVG s'il existe
            const svgContainer = parent.querySelector('.brick-svg-preview');
            if (svgContainer) {
                svgContainer.remove();
                // Log retiré: Container SVG supprimé
            }
        }
        
        // Réafficher le canvas original pour les GLB
        const currentCanvas = document.getElementById('toolsActiveElementCanvas');
        if (currentCanvas) {
            currentCanvas.style.display = '';
            
            // Nettoyer les attributs de brique du canvas
            currentCanvas.removeAttribute('data-brick-preview');
            
            // Si le canvas avait des attributs de brique, les réinitialiser
            if (currentCanvas.getAttribute('data-current-element-type') === 'brick') {
                // Log retiré: Réinitialisation canvas pour GLB
                // Ne pas changer les attributs ici, ils seront mis à jour par le caller
            }
            
            // Log retiré: Canvas original GLB restauré
        }
        
        // Nettoyer SEULEMENT les ressources 3D de brique dédiées (pas celles des GLB)
        if (this.brickRenderer) {
            try {
                this.brickRenderer.dispose();
                this.brickRenderer = null;
                // Log retiré: Renderer brique nettoyé
            } catch (e) {
                // Log retiré: Erreur nettoyage renderer brique
            }
        }
        
        if (this.brickScene) {
            while(this.brickScene.children.length > 0) {
                this.brickScene.remove(this.brickScene.children[0]);
            }
            this.brickScene = null;
            // Log retiré: Scène brique nettoyée
        }
        
        this.brickCamera = null;
        
        // NE PAS nettoyer les ressources GLB (previewRenderer, previewScene, previewCamera)
        // car elles sont gérées par le système GLB principal
    }

    createBrickStaticPreview(canvas, element) {
        try {
            // Log retiré: Création aperçu statique brique
            
            // Cacher le canvas et utiliser un overlay
            canvas.style.display = 'none';
            
            // Vérifier que le canvas a un parent
            if (!canvas.parentNode) {
                console.error('❌ Pas de parentNode pour le canvas, impossible de créer l\'aperçu');
                return;
            }
            
            // Vérifier s'il y a déjà un aperçu SVG
            let previewContainer = canvas.parentNode.querySelector('.brick-static-preview');
            if (!previewContainer) {
                // Créer un container pour l'aperçu statique
                previewContainer = document.createElement('div');
                previewContainer.className = 'brick-static-preview';
                previewContainer.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: #f8f9fa;
                    border-radius: 4px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
                `;
                canvas.parentNode.appendChild(previewContainer);
            }
            
            // Créer l'aperçu statique de la brique
            this.renderBrickStaticContent(previewContainer, element);
            
            // Log retiré: Aperçu statique de brique créé
            
        } catch (error) {
            console.error('❌ Erreur création aperçu statique brique:', error);
            // En cas d'erreur, réafficher le canvas
            canvas.style.display = '';
        }
    }

    renderBrickStaticContent(container, element) {
        // Couleur de la brique selon le type
        const color = this.getBrickColor(element.type);
        const colorHex = '#' + color.toString(16).padStart(6, '0');
        
        // Dimensions relatives pour l'affichage
        const dims = this.getBrickDisplayDimensions(element.type);
        
        // Informations de coupe
        const cutInfo = this.getBrickCutInfo(element);
        
        // Contenu HTML de l'aperçu
        container.innerHTML = `
            <div style="
                width: ${dims.width}%;
                height: ${dims.height}%;
                background: linear-gradient(135deg, ${colorHex} 0%, ${this.darkenColor(colorHex, 0.2)} 100%);
                border: 2px solid ${this.darkenColor(colorHex, 0.3)};
                border-radius: 2px;
                box-shadow: 
                    inset 1px 1px 2px rgba(255,255,255,0.3),
                    2px 2px 4px rgba(0,0,0,0.2);
                position: relative;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div style="
                    background: ${this.darkenColor(colorHex, 0.1)};
                    width: 80%;
                    height: 60%;
                    border-radius: 1px;
                    border: 1px solid ${this.darkenColor(colorHex, 0.4)};
                "></div>
            </div>
            <div style="
                font-size: 11px;
                font-weight: 600;
                color: #333;
                text-align: center;
                line-height: 1.2;
                margin-bottom: 2px;
            ">${element.name || element.type}</div>
            ${element.dimensions ? `
                <div style="
                    font-size: 9px;
                    color: #666;
                    text-align: center;
                    margin-bottom: 2px;
                ">${element.dimensions.length}×${element.dimensions.width}×${element.dimensions.height} cm</div>
            ` : ''}
            ${cutInfo ? `
                <div style="
                    font-size: 10px;
                    color: #e67e22;
                    text-align: center;
                    font-weight: 600;
                    background: rgba(230, 126, 34, 0.1);
                    padding: 2px 6px;
                    border-radius: 3px;
                    border: 1px solid rgba(230, 126, 34, 0.3);
                ">${cutInfo}</div>
            ` : ''}
        `;
    }

    getBrickCutInfo(element) {
        // Déterminer les informations de coupe selon le type
        const type = element.type;
        
        if (type.includes('1/2') || type.includes('HALF')) {
            return 'Longueur: 1/2';
        } else if (type.includes('1/4') || type.includes('1Q')) {
            return 'Longueur: 1/4';
        } else if (type.includes('3/4') || type.includes('3Q')) {
            return 'Longueur: 3/4';
        } else if (type === 'M65' || type === 'M100' || type === 'M140') {
            return 'Longueur: entière';
        }
        
        // Vérifier s'il y a des infos de coupe dans les propriétés
        if (element.cutType) {
            return `Longueur: ${element.cutType}`;
        }
        
        // Si c'est une brique de coupe selon la catégorie
        if (element.category === 'cut') {
            // Extraire le type de coupe du nom
            const name = element.name || '';
            if (name.includes('1/2')) return 'Longueur: 1/2';
            if (name.includes('1/4')) return 'Longueur: 1/4';
            if (name.includes('3/4')) return 'Longueur: 3/4';
        }
        
        return null; // Pas d'info de coupe spécifique
    }

    getBrickDisplayDimensions(type) {
        // Dimensions d'affichage relatives (en %)
        switch(type) {
            case 'M50_HALF':
            case 'M50_1/2':
                return { width: 70, height: 35 };
            case 'M50_1Q':
            case 'M50_1/4':
                return { width: 45, height: 35 };
            case 'M65':
                return { width: 80, height: 35 };
            case 'M100':
                return { width: 80, height: 45 };
            case 'M140':
                return { width: 80, height: 55 };
            default:
                return { width: 70, height: 35 };
        }
    }

    darkenColor(hex, amount) {
        // Fonction utilitaire pour assombrir une couleur hexadécimale
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
        const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(255 * amount));
        const b = Math.max(0, (num & 0x0000FF) - Math.round(255 * amount));
        return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    }

    createDedicated3DBrickPreview(originalCanvas, element) {
        try {
            // Log retiré: Création aperçu 3D dédié brique
            
            // Vérifier que le canvas a un parent
            if (!originalCanvas.parentNode) {
                console.error('❌ Pas de parentNode pour le canvas');
                return;
            }
            
            // Cacher le canvas original temporairement pour la brique
            originalCanvas.style.display = 'none';
            
            // Vérifier s'il y a déjà un canvas de brique et le supprimer
            const existingBrickCanvas = originalCanvas.parentNode.querySelector('.brick-3d-canvas');
            if (existingBrickCanvas) {
                existingBrickCanvas.remove();
                // Log retiré: Canvas brique existant supprimé
            }
            
            // Créer un nouveau canvas dédié pour la brique 3D
            const brickCanvas = document.createElement('canvas');
            brickCanvas.className = 'tools-preview-3d brick-3d-canvas';
            brickCanvas.width = originalCanvas.width;
            brickCanvas.height = originalCanvas.height;
            brickCanvas.style.cssText = originalCanvas.style.cssText;
            brickCanvas.style.display = 'block';
            
            // Marquer le canvas pour identification
            brickCanvas.setAttribute('data-brick-preview', 'true');
            
            // Ajouter le canvas de brique au parent
            originalCanvas.parentNode.appendChild(brickCanvas);
            
            // Créer un overlay pour afficher les informations de la brique
            this.createBrickInfoOverlay(originalCanvas.parentNode, element);
            
            // Initialiser la scène 3D sur le canvas dédié
            this.initBrick3DScene(brickCanvas);
            
            // Créer la géométrie et le matériau de la brique
            const brickGeometry = this.createBrickGeometry(element);
            const color = this.getBrickColor(element.type);
            const material = new THREE.MeshPhongMaterial({ 
                color: color,
                transparent: true,
                opacity: 0.9,
                shininess: 30
            });
            
            // Créer le mesh de la brique
            const brickMesh = new THREE.Mesh(brickGeometry, material);
            
            // Positionner la brique au centre
            const box = new THREE.Box3().setFromObject(brickMesh);
            const center = box.getCenter(new THREE.Vector3());
            brickMesh.position.sub(center);
            
            // Ajouter à la scène
            this.brickScene.add(brickMesh);
            
            // Ajuster la caméra pour la brique
            this.adjustBrickCamera(brickMesh);
            
            // Démarrer l'animation rotative
            this.startBrickAnimation(brickCanvas, brickMesh);
            
            // Log retiré: Aperçu 3D dédié brique créé
            
        } catch (error) {
            console.error('❌ Erreur création aperçu 3D dédié brique:', error);
            // Fallback: réafficher le canvas original et créer un aperçu statique
            originalCanvas.style.display = 'block';
            this.createBrickStaticPreview(originalCanvas, element);
        }
    }

    initBrick3DScene(canvas) {
        try {
            // Log retiré: Initialisation scène 3D dédiée brique
            
            // Créer la scène dédiée
            this.brickScene = new THREE.Scene();
            this.brickScene.background = new THREE.Color(0xf5f5f5);
            
            // Créer la caméra dédiée
            const aspect = canvas.clientWidth / canvas.clientHeight;
            this.brickCamera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
            
            // Créer le renderer dédié
            this.brickRenderer = new THREE.WebGLRenderer({ 
                canvas: canvas, 
                antialias: true,
                alpha: true
            });
            this.brickRenderer.setSize(canvas.clientWidth, canvas.clientHeight);
            this.brickRenderer.setPixelRatio(window.devicePixelRatio);
            this.brickRenderer.setClearColor(0xf5f5f5, 1.0);
            
            // Ajouter éclairage optimisé pour les briques
            const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
            this.brickScene.add(ambientLight);
            
            const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight1.position.set(10, 10, 5);
            this.brickScene.add(directionalLight1);
            
            const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
            directionalLight2.position.set(-5, -5, -5);
            this.brickScene.add(directionalLight2);
            
            // Log retiré: Scène 3D dédiée brique initialisée
            
        } catch (error) {
            console.error('❌ Erreur initialisation scène 3D brique:', error);
            throw error;
        }
    }

    adjustBrickCamera(brickMesh) {
        if (!this.brickCamera) return;
        
        // Calculer la boîte englobante
        const box = new THREE.Box3().setFromObject(brickMesh);
        const size = box.getSize(new THREE.Vector3()).length();
        
        // Positionner la caméra pour une vue optimale
        const distance = size * 2.5;
        this.brickCamera.position.set(distance, distance * 0.6, distance * 0.8);
        this.brickCamera.lookAt(0, 0, 0);
        this.brickCamera.updateProjectionMatrix();
    }

    startBrickAnimation(canvas, brickMesh) {
        if (!this.brickRenderer || !this.brickScene || !this.brickCamera) return;
        
        let animationId;
        
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            
            // Rotation lente de la brique
            if (brickMesh) {
                brickMesh.rotation.y += 0.01;
            }
            
            // Rendu
            try {
                this.brickRenderer.render(this.brickScene, this.brickCamera);
            } catch (e) {
                // Log retiré: Arrêt animation brique (erreur)
                cancelAnimationFrame(animationId);
            }
        };
        
        // Sauvegarder l'ID d'animation pour pouvoir l'arrêter
        this.brickAnimationId = animationId;
        
        animate();
        
    // Log retiré: Animation brique démarrée
    }

    stopBrickAnimation() {
        if (this.brickAnimationId) {
            cancelAnimationFrame(this.brickAnimationId);
            this.brickAnimationId = null;
            // Log retiré: Animation brique arrêtée
        }
    }

    createBrickInfoOverlay(parentContainer, element) {
        try {
            // Supprimer un overlay existant
            const existingOverlay = parentContainer.querySelector('.brick-info-overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }
            
            // Créer l'overlay d'informations
            const infoOverlay = document.createElement('div');
            infoOverlay.className = 'brick-info-overlay';
            infoOverlay.style.cssText = `
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 70%, transparent 100%);
                color: white;
                padding: 8px;
                font-size: 10px;
                line-height: 1.2;
                pointer-events: none;
                z-index: 10;
            `;
            
            // Informations de coupe
            const cutInfo = this.getBrickCutInfo(element);
            
            // Contenu de l'overlay
            let overlayContent = `
                <div style="font-weight: 600; margin-bottom: 2px;">
                    ${element.name || element.type}
                </div>
            `;
            
            if (element.dimensions) {
                overlayContent += `
                    <div style="color: #bbb; margin-bottom: 2px;">
                        ${element.dimensions.length}×${element.dimensions.width}×${element.dimensions.height} cm
                    </div>
                `;
            }
            
            if (cutInfo) {
                overlayContent += `
                    <div style="
                        color: #f39c12;
                        font-weight: 600;
                        background: rgba(243, 156, 18, 0.2);
                        padding: 2px 4px;
                        border-radius: 2px;
                        display: inline-block;
                        border: 1px solid rgba(243, 156, 18, 0.4);
                    ">
                        ${cutInfo}
                    </div>
                `;
            }
            
            infoOverlay.innerHTML = overlayContent;
            
            // Ajouter l'overlay au container parent
            parentContainer.appendChild(infoOverlay);
            
            // Log retiré: Overlay infos brique créé
            
        } catch (error) {
            console.error('❌ Erreur création overlay brique:', error);
        }
    }

    create3DBrickPreview(canvas, element) {
        try {
            // Log retiré: Création aperçu 3D brique
            
            // Le canvas a déjà un contexte WebGL du hourdis, nous devons le remplacer
            // Créer un nouveau canvas temporaire pour contourner le problème de contexte
            const newCanvas = document.createElement('canvas');
            newCanvas.width = canvas.width;
            newCanvas.height = canvas.height;
            newCanvas.style.cssText = canvas.style.cssText;
            newCanvas.className = canvas.className;
            
            // Remplacer temporairement le canvas dans le DOM
            const parent = canvas.parentNode;
            parent.replaceChild(newCanvas, canvas);
            
            // Sauvegarder les attributs du canvas original
            const originalAttributes = {};
            for (let attr of canvas.attributes) {
                originalAttributes[attr.name] = attr.value;
            }
            
            // Appliquer les attributs au nouveau canvas
            for (let [name, value] of Object.entries(originalAttributes)) {
                newCanvas.setAttribute(name, value);
            }
            
            // Log retiré: Canvas remplacé (conflit WebGL)
            
            // Maintenant créer la scène 3D sur le nouveau canvas propre
            this.initPreviewScene(newCanvas);
            
            // Créer une géométrie de brique simple
            const brickGeometry = this.createBrickGeometry(element);
            
            // Matériau avec couleur selon le type de brique
            const color = this.getBrickColor(element.type);
            const material = new THREE.MeshPhongMaterial({ 
                color: color,
                transparent: true,
                opacity: 0.9
            });
            
            // Créer le mesh de la brique
            const brickMesh = new THREE.Mesh(brickGeometry, material);
            
            // Positionner la brique au centre
            const box = new THREE.Box3().setFromObject(brickMesh);
            const center = box.getCenter(new THREE.Vector3());
            brickMesh.position.sub(center);
            
            // Ajouter à la scène
            this.previewScene.add(brickMesh);
            
            // Ajuster la caméra
            this.adjustCameraForBrick(brickMesh);
            
            // Rendre la scène
            this.renderPreviewScene(newCanvas);
            
            // Marquer le nouveau canvas pour le nettoyage futur
            newCanvas.setAttribute('data-brick-canvas', 'true');
            
            // Log retiré: Aperçu 3D brique créé sur nouveau canvas
            
        } catch (error) {
            console.error('❌ Erreur création aperçu 3D brique:', error);
            // Fallback vers aperçu statique
            this.createBrickSVGPreview(canvas, element);
        }
    }

    createBrickGeometry(element) {
        // Dimensions standard des briques selon le type
        const dimensions = this.getBrickDimensions(element.type);
        
        // Créer une géométrie de boîte avec les bonnes dimensions
        return new THREE.BoxGeometry(
            dimensions.width, 
            dimensions.height, 
            dimensions.depth
        );
    }

    getBrickDimensions(type) {
        // Dimensions réelles des briques en cm (ajustées pour aperçu)
        const scale = 0.1; // Échelle plus grande pour bien voir
        
        switch(type) {
            case 'M50_HALF':
            case 'M50_1/2':
                return { width: 12.5 * scale, height: 6.5 * scale, depth: 25 * scale };
            case 'M50_1Q':
            case 'M50_1/4':
                return { width: 6.25 * scale, height: 6.5 * scale, depth: 25 * scale };
            case 'M65':
                return { width: 25 * scale, height: 6.5 * scale, depth: 25 * scale };
            case 'M100':
                return { width: 25 * scale, height: 10 * scale, depth: 25 * scale };
            case 'M140':
                return { width: 25 * scale, height: 14 * scale, depth: 25 * scale };
            default:
                return { width: 12.5 * scale, height: 6.5 * scale, depth: 25 * scale };
        }
    }

    getBrickColor(type) {
        // Couleurs distinctes selon le type de brique
        switch(type) {
            case 'M50_HALF':
            case 'M50_1/2':
                return 0xFF6B35; // Orange vif
            case 'M50_1Q':
            case 'M50_1/4':
                return 0xFF8E53; // Orange plus clair pour 1/4
            case 'M65':
                return 0xD2691E; // Orange terre cuite
            case 'M100':
                return 0xA0522D; // Brun sienna
            case 'M140':
                return 0x8B4513; // Brun selle
            default:
                return 0xFF6B35; // Orange vif par défaut
        }
    }

    adjustCameraForBrick(brickMesh) {
        if (!this.previewCamera) return;
        
        // Calculer la boîte englobante
        const box = new THREE.Box3().setFromObject(brickMesh);
        const size = box.getSize(new THREE.Vector3()).length();
        
        // Positionner la caméra pour bien voir la brique
        const distance = size * 2;
        this.previewCamera.position.set(distance, distance * 0.5, distance);
        this.previewCamera.lookAt(0, 0, 0);
        this.previewCamera.updateProjectionMatrix();
    }

    initPreviewScene(canvas) {
        try {
            // Log retiré: Initialisation scène aperçu 3D
            
            // Vérifier que le canvas est propre (pas de contexte existant)
            const existingContext = canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false });
            if (existingContext && existingContext.isContextLost && existingContext.isContextLost()) {
                // Log retiré: Contexte WebGL perdu détecté
            }
            
            // Créer la scène
            this.previewScene = new THREE.Scene();
            this.previewScene.background = new THREE.Color(0xf5f5f5);
            
            // Créer la caméra
            const aspect = canvas.clientWidth / canvas.clientHeight;
            this.previewCamera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
            
            // Créer le renderer avec gestion d'erreur
            try {
                this.previewRenderer = new THREE.WebGLRenderer({ 
                    canvas: canvas, 
                    antialias: true,
                    alpha: true,
                    preserveDrawingBuffer: false,
                    premultipliedAlpha: false,
                    powerPreference: "default"
                });
                
                // Log retiré: Renderer WebGL créé
            } catch (rendererError) {
                console.error('❌ Erreur création renderer WebGL:', rendererError);
                throw new Error('Impossible de créer le renderer WebGL: ' + rendererError.message);
            }
            
            // Forcer la taille et les paramètres
            this.previewRenderer.setSize(canvas.clientWidth, canvas.clientHeight);
            this.previewRenderer.setPixelRatio(window.devicePixelRatio);
            this.previewRenderer.setClearColor(0xf5f5f5, 1.0);
            
            // Activer les options de rendu
            this.previewRenderer.shadowMap.enabled = false;
            this.previewRenderer.autoClear = true;
            
            // Ajouter éclairage
            const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
            this.previewScene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 10, 5);
            this.previewScene.add(directionalLight);
            
            // Effacer immédiatement le canvas
            this.previewRenderer.clear();
            
            // Log retiré: Scène aperçu 3D initialisée
            
        } catch (error) {
            console.error('❌ Erreur initialisation scène aperçu:', error);
            // Rethrow pour que le caller puisse gérer l'erreur
            throw error;
        }
    }

    renderPreviewScene(canvas) {
        if (this.previewRenderer && this.previewScene && this.previewCamera) {
            try {
                this.previewRenderer.render(this.previewScene, this.previewCamera);
                // Log retiré: Rendu aperçu 3D effectué
            } catch (error) {
                console.error('❌ Erreur rendu aperçu 3D:', error);
            }
        }
    }

    // Méthode de débogage pour forcer la mise à jour de l'aperçu
    forcePreviewUpdate() {
    // Log retiré: Force update aperçu 3D
        this.lastPreviewCache = null; // Réinitialiser le cache
        this.updateActiveElementPreview(null, true);
    }
    
    // Méthode pour forcer le refresh de l'aperçu 3D quand l'onglet devient visible
    forceRefresh3DPreview() {
    // Log retiré: forceRefresh3DPreview démarré
        
        const canvas = document.getElementById('toolsActiveElementCanvas');
        if (!canvas) {
            console.error('❌ Canvas non trouvé pour forceRefresh3DPreview');
            return;
        }
        
        // Vérifier que l'onglet Outils est bien actif
        const toolsTab = document.querySelector('[data-tab="outils"]');
        if (!toolsTab || !toolsTab.classList.contains('active')) {
            // Log retiré: Onglet Outils non actif (forceRefresh)
            return;
        }
        
        // Nettoyer l'aperçu actuel
        if (this.cleanup3DPreview) {
            this.cleanup3DPreview();
        }
        
        // Réinitialiser le cache et forcer la mise à jour
        this.lastPreviewCache = null;
        canvas.removeAttribute('data-element-type');
        
        // Obtenir l'élément actif et relancer l'aperçu
        const activeElement = this.getActiveElement();
        if (activeElement) {
            // Log retiré: Relancement aperçu pour élément
            this.renderElementPreview(activeElement);
        } else {
            // Log retiré: Aucun élément actif forceRefresh3DPreview
        }
        
        // Démarrer la surveillance continue
        this.startCanvas3DMonitoring();
    }
    
    // Surveillance continue du canvas 3D
    startCanvas3DMonitoring() {
        // Arrêter toute surveillance précédente
        if (this.canvas3DMonitor) {
            clearInterval(this.canvas3DMonitor);
        }
        
        this.canvas3DRetryCount = 0;
    // Log retiré: Démarrage surveillance canvas 3D
        
        this.canvas3DMonitor = setInterval(() => {
            const canvas = document.getElementById('toolsActiveElementCanvas');
            const toolsTab = document.querySelector('[data-tab="outils"]');
            const isToolsActive = toolsTab && toolsTab.classList.contains('active');
            
            if (!isToolsActive) {
                // Arrêter la surveillance si l'onglet n'est plus actif
                clearInterval(this.canvas3DMonitor);
                this.canvas3DMonitor = null;
                // Log retiré: Surveillance arrêtée - onglet non actif
                return;
            }
            
            if (!canvas) {
                // Log retiré: Canvas non trouvé (surveillance)
                return;
            }
            
            // Vérifier si le canvas affiche quelque chose
            const hasContent = this.checkCanvasHasContent(canvas);
            
            if (!hasContent && this.canvas3DRetryCount < this.maxRetries) {
                this.canvas3DRetryCount++;
                // Log retiré: Canvas vide retry
                
                // Forcer le re-rendu
                const activeElement = this.getActiveElement();
                if (activeElement) {
                    this.renderElementPreview(activeElement);
                }
            } else if (hasContent) {
                // Succès ! Arrêter la surveillance
                // Log retiré: Canvas 3D fonctionne - surveillance arrêtée
                clearInterval(this.canvas3DMonitor);
                this.canvas3DMonitor = null;
            } else if (this.canvas3DRetryCount >= this.maxRetries) {
                // Échec définitif
                console.error('❌ [DEBUG] Échec surveillance canvas 3D après', this.maxRetries, 'tentatives');
                clearInterval(this.canvas3DMonitor);
                this.canvas3DMonitor = null;
                
                // Afficher un placeholder d'erreur
                this.showErrorPlaceholder(canvas);
            }
        }, 2000); // Vérifier toutes les 2 secondes
    }
    
    // Vérifier si le canvas a du contenu
    checkCanvasHasContent(canvas) {
        try {
            const ctx = canvas.getContext('2d');
            if (!ctx) return false;
            
            // Obtenir les données de pixels sur une petite zone
            const imageData = ctx.getImageData(0, 0, Math.min(50, canvas.width), Math.min(50, canvas.height));
            const data = imageData.data;
            
            // Vérifier s'il y a des pixels non transparents
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] > 0) { // Alpha > 0
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Erreur vérification contenu canvas:', error);
            return false;
        }
    }
    
    // Afficher un placeholder d'erreur
    showErrorPlaceholder(canvas) {
        try {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            // Nettoyer le canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Fond gris
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Texte d'erreur
            ctx.fillStyle = '#ff6b6b';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Erreur 3D', canvas.width / 2, canvas.height / 2 - 10);
            ctx.fillText('Rechargez', canvas.width / 2, canvas.height / 2 + 10);
            
            // Log retiré: Placeholder erreur affiché
        } catch (error) {
            console.error('Erreur affichage placeholder:', error);
        }
    }

    getElementColor(elementType) {
        const colors = {
            'brique': '#D2691E',
            'bloc': '#8B4513',
            'isolant': '#4169E1',
            'linteau': '#556B2F'
        };
        return colors[elementType] || '#666';
    }

    updateToolsCutButtons(cutButtonsContainer, activeElement) {
    // Log retiré: updateToolsCutButtons appelée
        
        // Identifier le type de base selon le type d'élément
        let baseType = activeElement.type;
        let elementCategory = 'unknown';
        
        // Vérifier si c'est un élément GLB (comme Hourdis)
        if (activeElement && (activeElement.category === 'glb' || activeElement.glbPath)) {
            elementCategory = 'glb';
            baseType = activeElement.type;
            this.updateGLBLengthButtons(cutButtonsContainer, activeElement);
            return; // Utiliser l'interface spéciale pour les GLB
        }
        
        // Restaurer les boutons de coupe normaux si l'interface GLB était affichée
        this.restoreNormalCutButtons(cutButtonsContainer);
        
        // Déterminer la catégorie d'élément pour les éléments traditionnels
        if (activeElement.type.startsWith('M') || activeElement.type.startsWith('B')) {
            elementCategory = 'brick';
        } else if (activeElement.type.startsWith('L') || (activeElement.name && activeElement.name.includes('Linteau'))) {
            elementCategory = 'linteau';
        } else if (activeElement.type.startsWith('PUR') || activeElement.type.startsWith('LAINEROCHE')) {
            elementCategory = 'insulation';
        }
        
        // Si c'est un élément coupé ou custom, récupérer le type de base
        if (activeElement.type.includes('_')) {
            // Gérer les éléments CUSTOM (garder seulement le préfixe)
            if (activeElement.type.includes('_CUSTOM')) {
                const match = activeElement.type.match(/^(M\d+|B\d+|L\d+|PUR\d*|LAINEROCHE\d*)/);
                if (match) {
                    baseType = match[1];
                }
            } else {
                // Gérer les suffixes de coupe normaux
                const cutSuffixes = ['_3Q', '_HALF', '_1Q'];
                for (const suffix of cutSuffixes) {
                    if (activeElement.type.endsWith(suffix)) {
                        baseType = activeElement.type.replace(suffix, '');
                        // Si après suppression du suffixe on a encore du _CUSTOM, nettoyer
                        if (baseType.includes('_CUSTOM')) {
                            const match = baseType.match(/^(M\d+|B\d+|L\d+|PUR\d*|LAINEROCHE\d*)/);
                            if (match) {
                                baseType = match[1];
                            }
                        }
                        break;
                    }
                }
            }
        }
        
        // Mettre à jour les boutons avec le bon type de base
        const buttons = cutButtonsContainer.querySelectorAll('.cut-btn-mini');
    // Log retiré: Boutons trouvés dans container
        
        // D'abord, nettoyer tous les états actifs
        buttons.forEach(button => button.classList.remove('active'));
        
        buttons.forEach(button => {
            button.setAttribute('data-base-type', baseType);
            
            // Déterminer si ce bouton est actif
            const cutType = button.getAttribute('data-cut');
            let expectedType = baseType;
            
            if (cutType === '3/4') {
                expectedType = baseType + '_3Q';
            } else if (cutType === '1/2') {
                expectedType = baseType + '_HALF';
            } else if (cutType === '1/4') {
                expectedType = baseType + '_1Q';
            } else if (cutType === 'P') {
                // Pour P, vérifier si c'est un CUSTOM
                if (activeElement.type.includes('_CUSTOM')) {
                    expectedType = activeElement.type; // Garder le type exact pour les coupes personnalisées
                }
            }
            // Pour cutType === '1/1', on garde le type de base
            
            // Marquer le bouton actif
            if (activeElement.type === expectedType || 
                (cutType === 'P' && activeElement.type.includes('_CUSTOM'))) {
                button.classList.add('active');
            }
        });
        
        cutButtonsContainer.style.display = 'flex';
    // Log retiré: Boutons de coupe affichés
    }

    restoreNormalCutButtons(cutButtonsContainer) {
        // Vérifier si le conteneur contient l'interface GLB au lieu des boutons normaux
        if (cutButtonsContainer.querySelector('.glb-length-controls')) {
            // Log retiré: Restauration boutons coupe
            
            // Restaurer les boutons de coupe normaux
            cutButtonsContainer.innerHTML = `
                <button class="cut-btn-mini" data-cut="1/1" data-base-type="">1/1</button>
                <button class="cut-btn-mini" data-cut="3/4" data-base-type="">3/4</button>
                <button class="cut-btn-mini" data-cut="1/2" data-base-type="">1/2</button>
                <button class="cut-btn-mini" data-cut="1/4" data-base-type="">1/4</button>
                <button class="cut-btn-mini" data-cut="P" data-base-type="">P</button>
            `;
        } else {
            // Log retiré: Boutons coupe déjà présents
        }
    }

    selectCutInTools(cutInfo, baseType, clickedElement) {
        // console.log('🔧 Sélection de coupe dans l\'onglet Outils:', cutInfo, 'pour élément', baseType);
        
        // Gestion spéciale pour PROFIL
        if (baseType === 'PROFIL') {
            const height = parseFloat(clickedElement.getAttribute('data-height'));
            const profilType = `PROFIL_${height}`;
            const dims = { length: 6.5, width: 6.5, height };
            console.log(`🔩 Sélection PROFIL H=${height}cm`);

            // Synchroniser avec BrickSelector (chemin officiel)
            if (window.BrickSelector && typeof window.BrickSelector.setBrick === 'function') {
                window.BrickSelector.setBrick(profilType);
            } else if (window.BrickSelector) {
                // Fallback minimal si setBrick indisponible
                window.BrickSelector.currentBrick = profilType;
                window.BrickSelector.selectedType = profilType;
                window.BrickSelector.updateBrickDimensions?.(profilType);
                window.BrickSelector.updateCurrentBrickDisplay?.();
            }

            // Créer/mettre à jour le fantôme
            if (window.ConstructionTools) {
                window.ConstructionTools.setMode('block');
                window.ConstructionTools.createGhostElement();
                if (window.ConstructionTools.ghostElement) {
                    const ghost = window.ConstructionTools.ghostElement;
                    ghost.dimensions = dims;
                    ghost.material = 'aluminium';
                    ghost.blockType = profilType;
                    ghost.userData.isProfil = true;

                    if (ghost.mesh) {
                        ghost.mesh.geometry.dispose();
                        ghost.mesh.geometry = new THREE.BoxGeometry(dims.length, dims.height, dims.width);
                        const aluminiumMat = window.MaterialLibrary?.getThreeJSMaterial('aluminium');
                        if (aluminiumMat) {
                            // Cloner pour ne pas partager l'instance globale
                            ghost.mesh.material = aluminiumMat.clone();
                            ghost.mesh.material.transparent = true;
                            ghost.mesh.material.opacity = 0.3;
                            // Mémoriser l'id matériau
                            ghost.material = 'aluminium';
                            if (!ghost.userData) ghost.userData = {};
                            ghost.userData.isProfil = true;
                        }
                    }
                    // Mettre à jour les champs de dimension UI afin que ConstructionTools lise la bonne hauteur si nécessaire
                    const hEl = document.getElementById('elementHeight');
                    const lEl = document.getElementById('elementLength');
                    const wEl = document.getElementById('elementWidth');
                    if (hEl) hEl.value = String(dims.height);
                    if (lEl) lEl.value = String(dims.length);
                    if (wEl) wEl.value = String(dims.width);
                }
            }

            // Mettre à jour l'état visuel des boutons
            const allButtons = document.querySelectorAll('.cut-btn-mini[data-base-type="PROFIL"]');
            allButtons.forEach(btn => btn.classList.remove('active'));
            if (clickedElement) clickedElement.classList.add('active');

            setTimeout(() => this.updateActiveElementPreview(), 50);
            return;
        }
        
        // Construire le type final selon le type de coupe
        let finalType = baseType; // Par défaut, élément entier
        
        if (cutInfo === 'P') {
            // Pour coupe personnalisée, ouvrir le modal via TabManager
            if (window.TabManager && typeof window.TabManager.openCustomCutModal === 'function') {
                // Simuler un buttonElement avec les bonnes propriétés
                const fakeButton = {
                    closest: () => ({ querySelector: () => null })
                };
                window.TabManager.openCustomCutModal(baseType, fakeButton);
                return; // Arrêter ici, la suite sera gérée par le modal
            }
        } else if (cutInfo === '3/4') {
            finalType = baseType + '_3Q';
        } else if (cutInfo === '1/2') {
            finalType = baseType + '_HALF';
        } else if (cutInfo === '1/4') {
            finalType = baseType + '_1Q';
        }
        // Pour '1/1', on garde le type de base
        
        // console.log('🔧 Type final calculé:', finalType);
        
        // NOUVEAU: Marquer que l'onglet Outils est en train de changer la sélection
        window.toolsTabUpdating = true;
        
        // Appliquer la sélection selon le type d'élément
        if (baseType.startsWith('M') || baseType.startsWith('B')) {
            // Briques et blocs
            if (window.BrickSelector) {
                window.BrickSelector.currentBrick = finalType;
                window.BrickSelector.selectedType = finalType;
                
                if (typeof window.BrickSelector.updateBrickDimensions === 'function') {
                    window.BrickSelector.updateBrickDimensions(finalType);
                }
                if (typeof window.BrickSelector.updateCurrentBrickDisplay === 'function') {
                    window.BrickSelector.updateCurrentBrickDisplay();
                }
                
                // console.log('✅ BrickSelector mis à jour avec:', finalType);
            }
        } else if (baseType.startsWith('L')) {
            // Linteaux
            if (window.LinteauSelector) {
                window.LinteauSelector.setLinteau(finalType);
                // console.log('✅ LinteauSelector mis à jour avec:', finalType);
            }
        } else if (baseType.startsWith('PUR') || baseType.startsWith('LAINEROCHE')) {
            // Isolants
            if (window.InsulationSelector) {
                window.InsulationSelector.setInsulation(finalType);
                // console.log('✅ InsulationSelector mis à jour avec:', finalType);
            }
        }
        
        // Mettre à jour l'affichage visuel des boutons de coupe
        // ✅ UTILISER LE GESTIONNAIRE CENTRALISÉ
        if (window.CutButtonManager) {
            window.CutButtonManager.activateCutButton(clickedElement, baseType, cutInfo);
        } else {
            // Fallback si le gestionnaire n'est pas encore chargé
            const allCutButtons = document.querySelectorAll('.cut-btn-mini');
            allCutButtons.forEach(button => button.classList.remove('active'));
            
            if (clickedElement) {
                const clickedBaseType = clickedElement.getAttribute('data-base-type');
                const clickedCutType = clickedElement.getAttribute('data-cut');
                
                // Désactiver tous les autres boutons du même type de base
                const sameBaseTypeButtons = document.querySelectorAll(`.cut-btn-mini[data-base-type="${clickedBaseType}"]`);
                sameBaseTypeButtons.forEach(btn => btn.classList.remove('active'));
                
                // Activer seulement le bouton cliqué
                clickedElement.classList.add('active');
            }
        }
        
        // Mettre à jour l'aperçu immédiatement
        setTimeout(() => {
            this.updateActiveElementPreview();
            
            // Libérer le flag après la mise à jour
            setTimeout(() => {
                window.toolsTabUpdating = false;
            }, 100);
        }, 50);
    }

    create3DPreview(canvas, elementTypeValue, elementType = 'brique', cutInfo = null) {
        // Nettoyer l'ancien rendu si il existe
        if (this.cleanup3DPreview) {
            this.cleanup3DPreview();
        }

        // Utiliser les fonctionnalités de LibraryPreview3D pour créer un aperçu animé
        if (!window.LibraryPreview3D) {
            throw new Error('LibraryPreview3D non disponible');
        }

        // Vérifier que THREE.js est disponible
        if (typeof THREE === 'undefined') {
            throw new Error('THREE.js non disponible');
        }

        try {
            // Créer une instance de Three.js spécifique pour l'onglet Outils
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 1000);
            this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
            
            this.renderer.setSize(canvas.width, canvas.height);
            this.renderer.setClearColor(0x000000, 0);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            // Configuration de l'éclairage (similaire à LibraryPreview3D)
            this.setupToolsLighting();
            
            // Position de la caméra - optimisée pour un cadrage automatique
            this.camera.position.set(3.5, 2.5, 4);
            this.camera.lookAt(0, 0, 0);

            // Créer la géométrie selon le type d'élément
            if (elementType === 'glb') {
                // 📦 Chargement asynchrone pour GLB avec cache
                const glbSignature = `${elementTypeValue}_${cutInfo.type || 'full'}`;
                const currentCanvasSignature = canvas.getAttribute('data-element-type');
                
                // Éviter le rechargement si c'est déjà le bon GLB
                if (currentCanvasSignature === glbSignature && this.currentGLBModel) {
                    // Log retiré: GLB déjà chargé
                    this.startToolsAnimation();
                    return;
                }
                
                // Log retiré: Chargement nouveau GLB
                this.createGLBPreview(elementTypeValue).then(() => {
                    // Marquer le canvas avec la signature GLB
                    canvas.setAttribute('data-element-type', glbSignature);
                    // Démarrer l'animation après le chargement du GLB
                    this.startToolsAnimation();
                }).catch(error => {
                    console.error('❌ Erreur chargement GLB, fallback:', error);
                    this.drawFallback2DPreview(canvas, elementTypeValue);
                });
            } else {
                this.createToolsElementMesh(elementTypeValue, elementType, cutInfo);
                // Démarrer l'animation pour les éléments non-GLB
                this.startToolsAnimation();
            }
            
            // console.log('🎨 Aperçu 3D animé initialisé pour:', elementTypeValue, 'type:', elementType, 'coupe:', cutInfo?.type || 'entier');
        } catch (error) {
            console.warn('Erreur lors de l\'initialisation de l\'aperçu 3D animé:', error);
            this.drawFallback2DPreview(canvas, elementTypeValue);
        }
    }

    setupToolsLighting() {
        // Lumière ambiante
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Lumière directionnelle principale
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Lumière de remplissage
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);
    }

    createToolsElementMesh(elementTypeValue, elementType, cutInfo = null) {
        // Déterminer les dimensions et couleurs selon le type d'élément
        let config;
        
        // Gérer selon le type d'élément
        switch (elementType) {
            case 'brique':
                config = this.getBrickConfig(elementTypeValue);
                break;
            case 'isolant':
                config = this.getInsulationConfig(elementTypeValue);
                break;
            case 'bloc':
                config = this.getBlockConfig(elementTypeValue);
                break;
            case 'linteau':
                config = this.getLinteauConfig(elementTypeValue);
                break;
            default:
                config = this.getBrickConfig(elementTypeValue); // Fallback vers brique
        }
        
        if (!config) {
            console.warn('🎨 Configuration non trouvée pour:', elementTypeValue, 'type:', elementType);
            config = { size: [1.9, 0.65, 0.9], color: 0xaa4411 }; // Fallback
        }

        // Appliquer la coupe aux dimensions si nécessaire
        let finalSize = [...config.size];
        if (cutInfo && cutInfo.ratio && cutInfo.ratio !== 1.0) {
            // Pour la plupart des éléments, on coupe la longueur (premier élément)
            finalSize[0] = config.size[0] * cutInfo.ratio;
            // console.log('🎨 Application de la coupe:', cutInfo.type, 'ratio:', cutInfo.ratio, 'dimensions originales:', config.size, 'finales:', finalSize);
        }
        
        // Calculer l'échelle automatique pour optimiser l'utilisation du canvas
        let scale;
        if (cutInfo && cutInfo.ratio && cutInfo.ratio !== 1.0) {
            // Pour les éléments coupés, utiliser l'échelle basée sur les dimensions finales coupées
            // pour montrer la vraie taille coupée
            scale = this.calculateOptimalScale(finalSize);
            // console.log('🎨 Échelle basée sur dimensions coupées pour coupe:', cutInfo.type, 'échelle:', scale);
        } else {
            // Pour les éléments entiers, utiliser l'échelle optimisée
            scale = this.calculateOptimalScale(finalSize);
        }
        
        const scaledSize = [
            finalSize[0] * scale,
            finalSize[1] * scale,
            finalSize[2] * scale
        ];
        
        // Créer la géométrie avec la taille optimisée (avec coupe si nécessaire)
        const geometry = new THREE.BoxGeometry(scaledSize[0], scaledSize[2], scaledSize[1]);
        const material = new THREE.MeshLambertMaterial({ color: config.color });
        
        // Supprimer l'ancien mesh et ses arêtes s'ils existent
        if (this.currentMesh) {
            this.scene.remove(this.currentMesh);
            this.currentMesh.geometry.dispose();
            this.currentMesh.material.dispose();
        }
        if (this.currentEdges) {
            this.scene.remove(this.currentEdges);
            this.currentEdges.geometry.dispose();
            this.currentEdges.material.dispose();
        }
        
        // Créer le mesh principal
        this.currentMesh = new THREE.Mesh(geometry, material);
        this.currentMesh.castShadow = true;
        this.currentMesh.receiveShadow = true;
        
        // Debug : Vérifier les dimensions de la géométrie créée
        // 
        
        // Créer les arêtes de contour noires
        const edgesGeometry = new THREE.EdgesGeometry(geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        this.currentEdges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        
        // Créer un groupe pour faire tourner les deux ensemble
        if (this.brickGroup) {
            this.scene.remove(this.brickGroup);
        }
        this.brickGroup = new THREE.Group();
        this.brickGroup.add(this.currentMesh);
        this.brickGroup.add(this.currentEdges);
        
        this.scene.add(this.brickGroup);
        
        // Forcer un rendu immédiat pour s'assurer que les changements sont visibles
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
            // console.log('🎨 Rendu 3D forcé après création de géométrie');
        }
    }

    calculateOptimalScale(size) {
        // Dimensions cibles du viewport 3D (en tenant compte de l'espace pour la rotation)
        const targetWidth = 3.5;  // Largeur cible dans l'espace 3D
        const targetHeight = 2.5; // Hauteur cible dans l'espace 3D
        const targetDepth = 3.0;  // Profondeur cible dans l'espace 3D
        
        // Calculer les ratios d'échelle pour chaque dimension
        const scaleX = targetWidth / size[0];
        const scaleY = targetHeight / size[1];
        const scaleZ = targetDepth / size[2];
        
        // Utiliser le plus petit ratio pour s'assurer que l'élément tient entièrement
        const optimalScale = Math.min(scaleX, scaleY, scaleZ);
        
        // Limiter l'échelle pour éviter des éléments trop petits ou trop grands
        const minScale = 0.5;
        const maxScale = 8.0;
        
        const finalScale = Math.max(minScale, Math.min(maxScale, optimalScale));
        
        // console.log(`🎨 Calcul d'échelle automatique:
        //     Taille originale: [${size[0].toFixed(2)}, ${size[1].toFixed(2)}, ${size[2].toFixed(2)}]
        //     Ratios: X=${scaleX.toFixed(2)}, Y=${scaleY.toFixed(2)}, Z=${scaleZ.toFixed(2)}
        //     Échelle optimale: ${optimalScale.toFixed(2)}
        //     Échelle finale: ${finalScale.toFixed(2)}`);
        
        return finalScale;
    }

    getBrickConfig(brickType) {
        // Gérer les briques CUSTOM avec dimensions personnalisées
        if (brickType.includes('_CUSTOM') && window.BrickSelector) {
            try {
                const brickData = window.BrickSelector.getCurrentBrick();
                if (brickData && brickData.length && brickData.width && brickData.height) {
                    // Convertir les dimensions en unités Three.js (cm vers unités de scène)
                    return {
                        size: [brickData.length / 10, brickData.width / 10, brickData.height / 10], // /10 pour adapter l'échelle
                        color: 0xaa4411 // Couleur par défaut pour les briques custom
                    };
                }
            } catch (error) {
                console.warn('Erreur lors de la récupération des données de brique custom:', error);
            }
        }
        
        // Configurations prédéfinies des briques
        const brickConfigs = {
            'M50': { size: [1.9, 0.5, 0.9], color: 0xcc6633 },
            'M57': { size: [1.9, 0.57, 0.9], color: 0xbb5522 },
            'M60': { size: [1.9, 0.6, 0.9], color: 0xdd7744 },
            'M65': { size: [1.9, 0.65, 0.9], color: 0xaa4411 },
            'M90': { size: [1.9, 0.9, 0.9], color: 0xee8855 },
            // Variations de coupe
            'M65_3Q': { size: [1.9 * 0.75, 0.65, 0.9], color: 0xaa4411 },
            'M65_HALF': { size: [1.9 * 0.5, 0.65, 0.9], color: 0xaa4411 },
            'M65_1Q': { size: [1.9 * 0.25, 0.65, 0.9], color: 0xaa4411 },
            'M50_3Q': { size: [1.9 * 0.75, 0.5, 0.9], color: 0xcc6633 },
            'M50_HALF': { size: [1.9 * 0.5, 0.5, 0.9], color: 0xcc6633 },
            'M50_1Q': { size: [1.9 * 0.25, 0.5, 0.9], color: 0xcc6633 }
        };
        
        let config = brickConfigs[brickType];
        
        // Fallback pour les types non reconnus
        if (!config) {
            const baseMatch = brickType.match(/^(M\d+|B\d+)/);
            if (baseMatch) {
                const baseType = baseMatch[1];
                config = brickConfigs[baseType] || brickConfigs['M65'];
            } else {
                config = brickConfigs['M65']; // Défaut
            }
        }
        
        return config;
    }

    getInsulationConfig(insulationType) {
        // Récupérer les données de l'isolant depuis InsulationSelector
        if (window.InsulationSelector && window.InsulationSelector.insulationTypes) {
            const insulationData = window.InsulationSelector.insulationTypes[insulationType];
            if (insulationData) {
                return {
                    size: [insulationData.length / 10 || 1.2, insulationData.width / 10 || 0.5, insulationData.height / 10 || 0.6],
                    color: 0xffdd44 // Couleur jaune pour les isolants
                };
            }
        }
        
        // Configurations par défaut des isolants (dimensions réalistes)
        const insulationConfigs = {
            'PUR5': { size: [1.2, 0.05, 0.6], color: 0xffdd44 },      // Panneau fin
            'PUR6': { size: [1.2, 0.06, 0.6], color: 0xffdd44 },      // Panneau fin
            'PUR7': { size: [1.2, 0.07, 0.6], color: 0xffdd44 },      // Panneau fin
            'LAINEROCHE5': { size: [1.2, 0.05, 0.6], color: 0xdddddd }  // Panneau blanc-gris
        };
        
        return insulationConfigs[insulationType] || insulationConfigs['PUR5'];
    }

    getBlockConfig(blockType) {
        // Configurations des blocs (dimensions réalistes)
        const blockConfigs = {
            'B9': { size: [3.9, 0.9, 1.9], color: 0x888888 },   // Plus large que haut
            'B14': { size: [3.9, 1.4, 1.9], color: 0x999999 },  // Bloc moyen
            'B19': { size: [3.9, 1.9, 1.9], color: 0x777777 }   // Bloc grand
        };
        
        return blockConfigs[blockType] || blockConfigs['B9'];
    }

    getLinteauConfig(linteauType) {
        // Configurations des linteaux (dimensions réalistes - longs et fins)
        const linteauConfigs = {
            'Linteau Béton L120': { size: [12, 0.12, 0.12], color: 0x999999 },  // Long et fin
            'Linteau Béton L140': { size: [14, 0.14, 0.12], color: 0x999999 },  // Plus long
            'Linteau Béton L160': { size: [16, 0.16, 0.12], color: 0x999999 }   // Encore plus long
        };
        
        return linteauConfigs[linteauType] || { size: [12, 0.12, 0.12], color: 0x999999 };
    }

    startToolsAnimation() {
        // Nettoyer l'ancienne animation
        if (this.toolsAnimationId) {
            cancelAnimationFrame(this.toolsAnimationId);
        }

        const animate = () => {
            this.toolsAnimationId = requestAnimationFrame(animate);
            
            // Rotation lente et continue du groupe (brique + arêtes)
            if (this.brickGroup) {
                this.brickGroup.rotation.y += 0.005;
                this.brickGroup.rotation.x += 0.002;
            }
            
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        };
        
        animate();
    }

    cleanup3DPreview() {
        // Nettoyer l'animation
        if (this.toolsAnimationId) {
            cancelAnimationFrame(this.toolsAnimationId);
            this.toolsAnimationId = null;
        }
        
        // Nettoyer l'animation GLB
        if (this.glbAnimationId) {
            cancelAnimationFrame(this.glbAnimationId);
            this.glbAnimationId = null;
        }
        
        // Nettoyer le groupe de briques
        if (this.brickGroup && this.scene) {
            this.scene.remove(this.brickGroup);
            this.brickGroup = null;
        }
        
        // Nettoyer le mesh
        if (this.currentMesh) {
            if (this.currentMesh.geometry) this.currentMesh.geometry.dispose();
            if (this.currentMesh.material) this.currentMesh.material.dispose();
            this.currentMesh = null;
        }
        
        // Nettoyer les arêtes
        if (this.currentEdges) {
            if (this.currentEdges.geometry) this.currentEdges.geometry.dispose();
            if (this.currentEdges.material) this.currentEdges.material.dispose();
            this.currentEdges = null;
        }
        
        // Nettoyer le renderer
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        
        // Nettoyer la scène
        if (this.scene) {
            this.scene.clear();
            this.scene = null;
        }
        
        // Nettoyer le cache GLB
        this.currentGLBModel = null;
        this.currentGLBType = null;
        
        this.camera = null;
    }

    drawFallback2DPreview(canvas, brickTypeOrElement) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 360;
        canvas.height = 280;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Si on a juste un type de brique
        if (typeof brickTypeOrElement === 'string') {
            const brickType = brickTypeOrElement;
            this.drawSimpleBrickPreview(ctx, canvas, brickType);
            return;
        }

        // Code existant pour les éléments complets
        const activeElement = brickTypeOrElement;
        const elementType = activeElement.elementType || 'brique';
        this.drawFallbackPreview(canvas, activeElement, elementType);
    }

    drawSimpleBrickPreview(ctx, canvas, brickType) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Configuration des briques
        const brickConfigs = {
            'M50': { width: 120, height: 50, color: '#cc6633' },
            'M57': { width: 120, height: 57, color: '#bb5522' },
            'M60': { width: 120, height: 60, color: '#dd7744' },
            'M65': { width: 120, height: 65, color: '#aa4411' },
            'M90': { width: 120, height: 90, color: '#ee8855' }
        };
        
        const config = brickConfigs[brickType] || brickConfigs['M65'];
        
        // Dessiner la brique avec perspective
        ctx.fillStyle = config.color;
        ctx.fillRect(centerX - config.width/2, centerY - config.height/2, config.width, config.height);
        
        // Ombre
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(centerX - config.width/2 + 5, centerY - config.height/2 + 5, config.width, config.height);
        
        // Brique principale
        ctx.fillStyle = config.color;
        ctx.fillRect(centerX - config.width/2, centerY - config.height/2, config.width, config.height);
        
        // Bordures
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - config.width/2, centerY - config.height/2, config.width, config.height);
        
        // Texte du type
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(brickType, centerX, centerY + 5);
    }

    drawFallbackPreview(canvas, activeElement, elementType) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // S'assurer que le canvas a les bonnes dimensions
        canvas.width = 360;
        canvas.height = 280;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dessiner un fond coloré
        const elementColor = this.getElementColor(elementType);
        
        ctx.fillStyle = elementColor;
        ctx.fillRect(40, 40, canvas.width - 80, canvas.height - 80);
        
        // Dessiner une bordure
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
        
        // Dessiner le nom sur le canvas
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const text = activeElement.name || activeElement.type || elementType;
        const maxWidth = canvas.width - 100;
        
        // Diviser le texte si trop long
        if (ctx.measureText(text).width > maxWidth) {
            const words = text.split(' ');
            let line1 = words[0] || '';
            let line2 = words.slice(1).join(' ') || '';
            
            ctx.fillText(line1, canvas.width / 2, canvas.height / 2 - 16);
            ctx.fillText(line2, canvas.width / 2, canvas.height / 2 + 16);
        } else {
            ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        }
    }

    drawEmptyPreview(canvas, activeMode) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 360;
        canvas.height = 280;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Dessiner un fond gris
        ctx.fillStyle = '#333';
        ctx.fillRect(40, 40, canvas.width - 80, canvas.height - 80);
        
        // Bordure
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
        
        // Texte avec indication du mode
        ctx.fillStyle = '#999';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Mode: ${activeMode}`, canvas.width / 2, canvas.height / 2 - 16);
        ctx.fillText('Aucun élément', canvas.width / 2, canvas.height / 2 + 16);
    }

    // Méthode pour s'assurer qu'un élément par défaut est sélectionné
    ensureDefaultElementSelection() {
        if (window.DEBUG_TOOLS_TAB) {
            // Log retiré: ensureDefaultElementSelection appelée
            // Log retiré: BrickSelector exists
            // Log retiré: currentBrick value
            // Log retiré: currentBrick type
            // Log retiré: currentBrick trimmed
        }
        
        // Vérifier si une brique est déjà sélectionnée ET valide (y compris les briques coupées)
        if (window.BrickSelector && window.BrickSelector.currentBrick && 
            typeof window.BrickSelector.currentBrick === 'string' && 
            window.BrickSelector.currentBrick.trim() !== '') {
            if (window.DEBUG_TOOLS_TAB) {
                // Log retiré: brique déjà sélectionnée
            }
            return;
        }
        
        // Essayer de sélectionner automatiquement une brique M65 par défaut SEULEMENT si aucune brique n'est sélectionnée
        if (window.BrickSelector && !window.BrickSelector.currentBrick) {
            // Log retiré: sélection M65 par défaut
            // Forcer une brique M65 par défaut
            window.BrickSelector.currentBrick = 'M65';
            
            // Déclencher l'événement de changement
            document.dispatchEvent(new CustomEvent('brickSelectionChanged', {
                detail: { brick: 'M65' }
            }));
            
            this.updateActiveElementPreview();
            return;
        } else {
            // Log retiré: BrickSelector non dispo ou déjà sélection
        }
    }

    // Méthode de débogage pour tester manuellement l'aperçu
    debugPreview() {
        // console.log('🔧 DEBUG: Test manuel de l\'aperçu');
        this.updateActiveElementPreview();
        
        // Dessiner un test simple
        const canvas = document.getElementById('activeElementPreviewTab');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, 30, 30);
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText('TEST', 5, 20);
            // console.log('🔧 DEBUG: Rectangle rouge dessiné pour test');
        }
    }

    toggleSelectMode() {
        this.isSelectMode = !this.isSelectMode;
        const btn = document.getElementById('selectAssiseModeTab');
        
        if (this.isSelectMode) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-times"></i> Annuler Sélection';
            this.activateElementSelectionMode();
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fas fa-crosshairs"></i> Activer Assise Élément';
            this.deactivateElementSelectionMode();
        }
    }

    activateElementSelectionMode() {
        // console.log('🎯 Mode sélection d\'assise activé');
        
        // Sauvegarder l'état original des grilles
        if (window.AssiseManager) {
            this.originalGridState = window.AssiseManager.showAssiseGrids;
        }
        
        // Sauvegarder la fonction canSelectElement originale
        if (window.SceneManager && typeof window.SceneManager.canSelectElement === 'function') {
            this.originalCanSelectElement = window.SceneManager.canSelectElement;
            // Remplacer par notre fonction
            window.SceneManager.canSelectElement = () => true;
        }
        
        // Afficher les grilles pour aider à la sélection
        if (window.AssiseManager && !window.AssiseManager.showAssiseGrids) {
            window.AssiseManager.showAssiseGrids = true;
            window.AssiseManager.updateAllGridVisibility();
        }
    }

    deactivateElementSelectionMode() {
        // console.log('🎯 Mode sélection d\'assise désactivé');
        
        // Restaurer la fonction canSelectElement originale
        if (window.SceneManager && this.originalCanSelectElement) {
            window.SceneManager.canSelectElement = this.originalCanSelectElement;
            this.originalCanSelectElement = null;
        }
        
        // Restaurer l'état original des grilles
        if (window.AssiseManager && this.originalGridState !== null) {
            if (window.AssiseManager.showAssiseGrids !== this.originalGridState) {
                window.AssiseManager.showAssiseGrids = this.originalGridState;
                window.AssiseManager.updateAllGridVisibility();
            }
            this.originalGridState = null;
        }
        
        this.selectedAssiseForPlacement = null;
    }

    setupSceneClickHandler() {
        // Cette fonction sera appelée quand un élément est sélectionné
        document.addEventListener('elementSelected', (e) => {
            if (this.isSelectMode && e.detail && e.detail.element) {
                this.handleElementSelection(e.detail.element);
            }
        });
    }

    handleElementSelection(element) {
        if (!element.userData || element.userData.assiseIndex === undefined) {
            // Log retiré: Élément sans informations d'assise
            return;
        }
        
        const elementAssiseIndex = element.userData.assiseIndex;
        
        // Basculer vers cette assise
        if (window.AssiseManager) {
            const success = window.AssiseManager.setActiveAssise(elementAssiseIndex);
            this.updateDisplay();
        }
        
        // Désactiver le mode sélection
        this.toggleSelectMode();
        
        // Notification
        if (window.ModernInterface && window.ModernInterface.showNotification) {
            window.ModernInterface.showNotification(
                `Basculé vers l'assise ${elementAssiseIndex + 1}`,
                'success'
            );
        }
    }

    addAssise() {
        if (window.AssiseManager) {
            console.log('🎯 BOUTON AJOUT ASSISE - currentType avant action:', window.AssiseManager.currentType);
            
            // CORRECTION: Utiliser directement le currentType de AssiseManager
            // au lieu de dériver le type depuis ConstructionTools
            const newAssise = window.AssiseManager.addAssise();
            
            if (newAssise) {
                console.log('🎯 BOUTON AJOUT ASSISE - Nouvelle assise créée:', newAssise);
                // Basculer automatiquement vers la nouvelle assise en utilisant la méthode appropriée
                const success = window.AssiseManager.setActiveAssise(newAssise.index);
                console.log('🎯 BOUTON AJOUT ASSISE - Activation assise:', success ? 'réussie' : 'échouée');
                
                // Force la mise à jour avec un délai
                setTimeout(() => {
                    this.updateDisplay();
                    if (window.ConstructionTools && typeof window.ConstructionTools.updateGhostElement === 'function') {
                        window.ConstructionTools.updateGhostElement();
                        // Seconde mise à jour différée pour gérer les latences de layout
                        setTimeout(() => {
                            window.ConstructionTools.updateGhostElement();
                        }, 150);
                    }
                    // console.log('🔧 Affichage mis à jour après ajout assise');
                }, 100);
                
                if (window.ModernInterface && window.ModernInterface.showNotification) {
                    window.ModernInterface.showNotification(
                        `Assise ${newAssise.index + 1} ajoutée et activée`,
                        'success'
                    );
                } else {
                    // console.log(`✅ Assise ${newAssise.index + 1} ajoutée et activée`);
                }
            } else {
                console.error('❌ Erreur lors de l\'ajout de l\'assise');
                if (window.ModernInterface && window.ModernInterface.showNotification) {
                    window.ModernInterface.showNotification(
                        'Erreur lors de l\'ajout de l\'assise',
                        'error'
                    );
                }
            }
        } else {
            console.error('❌ AssiseManager non disponible');
        }
    }

    removeAssise() {
        if (window.AssiseManager) {
            const currentIndex = window.AssiseManager.currentAssise;
            const currentType = window.AssiseManager.currentType;
            
            // Vérifier si on peut supprimer l'assise
            const assises = window.AssiseManager.assises;
            const typeAssises = window.AssiseManager.assisesByType.get(currentType);
            
            // On ne peut pas supprimer s'il n'y a qu'une assise ou si l'assise contient des éléments
            const hasElements = assises[currentIndex] && assises[currentIndex].length > 0;
            const canRemove = typeAssises && typeAssises.size > 1 && !hasElements;
            
            if (canRemove) {
                window.AssiseManager.removeAssise(currentIndex);
                this.updateDisplay();
                
                if (window.ModernInterface && window.ModernInterface.showNotification) {
                    window.ModernInterface.showNotification(
                        `Assise ${currentIndex + 1} supprimée`,
                        'success'
                    );
                }
            } else {
                let reason = '';
                if (hasElements) {
                    reason = 'contient des éléments';
                } else if (typeAssises && typeAssises.size <= 1) {
                    reason = 'dernière assise du type';
                } else {
                    reason = 'impossible';
                }
                
                if (window.ModernInterface && window.ModernInterface.showNotification) {
                    window.ModernInterface.showNotification(
                        `Impossible de supprimer l'assise (${reason})`,
                        'warning'
                    );
                }
            }
        }
    }

    toggleGrids() {
        if (window.AssiseManager) {
            window.AssiseManager.showAssiseGrids = !window.AssiseManager.showAssiseGrids;
            window.AssiseManager.updateAllGridVisibility();
            
            const btn = document.getElementById('toggleGridsTab');
            if (btn) {
                btn.classList.toggle('active', window.AssiseManager.showAssiseGrids);
            }
        }
    }

    toggleMarkers() {
        if (window.AssiseManager) {
            const isVisible = window.AssiseManager.toggleAttachmentMarkers();
            
            const btn = document.getElementById('toggleMarkersTab');
            if (btn) {
                btn.classList.toggle('active', isVisible);
            }
        }
    }

    // 📦 Méthode pour créer l'aperçu GLB dans l'onglet Outils
    async createGLBPreview(glbType) {
        const glbInfo = window.tempGLBInfo || window.lastPlacedGLBInfo;
        if (!glbInfo) {
            console.warn('🔍 Aucune info GLB disponible pour l\'aperçu');
            throw new Error('Aucune info GLB disponible');
        }

    // Log retiré: Création aperçu GLB onglet Outils
        
        // Charger le modèle GLB directement
        if (!window.GLTFLoader) {
            console.warn('❌ GLTFLoader non disponible');
            throw new Error('GLTFLoader non disponible');
        }

        try {
            const loader = new GLTFLoader();
            const gltf = await new Promise((resolve, reject) => {
                loader.load(
                    glbInfo.path, 
                    resolve, 
                    progress => {/* Log retiré: progression chargement GLB aperçu */},
                    reject
                );
            });

            if (gltf && gltf.scene) {
                const glbScene = gltf.scene.clone();
                
                // Appliquer l'échelle si disponible
                if (glbInfo.scale) {
                    glbScene.scale.set(glbInfo.scale.x, glbInfo.scale.y, glbInfo.scale.z);
                    // Log retiré: Échelle GLB appliquée
                }
                
                // Centrer le modèle pour l'aperçu
                const box = new THREE.Box3().setFromObject(glbScene);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                
                // Ajuster la position pour centrer
                glbScene.position.sub(center);
                
                // Ajuster la caméra en fonction de la taille
                const maxDim = Math.max(size.x, size.y, size.z);
                if (this.camera) {
                    this.camera.position.set(maxDim * 0.8, maxDim * 0.6, maxDim * 0.8);
                    this.camera.lookAt(0, 0, 0);
                    // Log retiré: Caméra ajustée GLB
                }
                
                // Nettoyer la scène précédente et ajouter le nouveau modèle
                if (this.scene) {
                    // Supprimer les anciens meshes (garder les lumières)
                    const meshesToRemove = [];
                    this.scene.traverse(child => {
                        if (child.isMesh && !child.isLight) {
                            meshesToRemove.push(child);
                        }
                    });
                    meshesToRemove.forEach(mesh => this.scene.remove(mesh));
                    
                    // Ajouter le nouveau modèle GLB
                    this.scene.add(glbScene);
                    
                    // Stocker le modèle en cache
                    this.currentGLBModel = glbScene;
                    this.currentGLBType = glbType;
                    
                    // Log retiré: Aperçu GLB ajouté et mis en cache
                }
                
                return glbScene;
            } else {
                throw new Error('Modèle GLB invalide');
            }
        } catch (error) {
            console.error('❌ Erreur chargement GLB pour aperçu:', error);
            throw error;
        }
    }

    toggleSnapPoint() {
        if (window.AssiseManager) {
            const isVisible = window.AssiseManager.toggleSnapPoint();
            
            const btn = document.getElementById('toggleSnapPointTab');
            if (btn) {
                btn.classList.toggle('active', isVisible);
            }
        }
    }
    // Méthode pour créer l'aperçu GLB en utilisant le système LibraryPreview3D
    createGLBPreviewUsingLibrary(canvas, glbElement, retryCount = 0) {
        
        try {
            // Système de limitation globale des tentatives simultanées
            if (!this.glbPreviewAttempts) {
                this.glbPreviewAttempts = new Map();
            }
            
            // Créer un identifiant unique pour ce canvas basé sur sa position dans le DOM
            const canvasId = canvas.id || canvas.dataset?.containerId || this.getCanvasUniqueId(canvas);
            const glbKey = `${glbElement.type}_${glbElement.scale?.z || 300}`;
            const attemptKey = `${canvasId}_${glbKey}`;
            
            const existingAttempt = this.glbPreviewAttempts.get(attemptKey);
            
            // Si une tentative est déjà en cours pour ce canvas/GLB, l'ignorer
            if (existingAttempt && (Date.now() - existingAttempt.startTime) < 5000) {
                // Log retiré: Tentative aperçu GLB déjà en cours
                return;
            }
            
            // Vérifier le nombre total de tentatives simultanées
            const activeAttempts = Array.from(this.glbPreviewAttempts.values())
                .filter(attempt => (Date.now() - attempt.startTime) < 5000).length;
            
            if (activeAttempts >= 5) { // Maximum 5 tentatives simultanées
                // Log retiré: Trop d'aperçus GLB en cours
                this.drawFallback2DPreview(canvas, glbElement.type);
                return;
            }
            
            // Enregistrer cette tentative
            this.glbPreviewAttempts.set(attemptKey, {
                startTime: Date.now(),
                retryCount: retryCount,
                canvasId: canvasId,
                glbKey: glbKey
            });
            
            // Debug détaillé (moins verbeux après les premiers essais)
            if (retryCount === 0) {
                // Log retiré: createGLBPreviewUsingLibrary démarré
                // Log retiré: debug canvas
                // Log retiré: debug GLB Element
            }
            // Log retiré: Canvas visible

            // Vérifier si c'est l'aperçu de l'élément actif (priorité haute)
            const isActiveElementCanvas = canvas.id === 'toolsActiveElementCanvas';
            if (isActiveElementCanvas) {
                console.log('🎯 Aperçu 3D pour élément actif (priorité haute)');
            }
            
            // Nettoyer toute animation en cours
            if (this.cleanup3DPreview) {
                this.cleanup3DPreview();
            }

            // Vérifier THREE.js
            if (typeof THREE === 'undefined') {
                console.error('❌ THREE.js non disponible pour aperçu GLB');
                this.drawFallback2DPreview(canvas, glbElement.type);
                this.glbPreviewAttempts.delete(attemptKey);
                return;
            }
            
            // Vérifier que le canvas est visible et a des dimensions avec limite de retry
            const maxRetries = 10; // Limite à 10 tentatives (1 seconde)
            if ((!canvas.offsetParent || canvas.width === 0 || canvas.height === 0) && retryCount < maxRetries) {
                if (retryCount === 0) {
                    console.warn('⚠️ Canvas non visible ou sans dimensions, tentatives de retry...');
                }
                setTimeout(() => {
                    this.createGLBPreviewUsingLibrary(canvas, glbElement, retryCount + 1);
                }, 100);
                return;
            }
            
            // Si on a dépassé les tentatives et toujours pas visible, utiliser fallback
            if (retryCount >= maxRetries && (!canvas.offsetParent || canvas.width === 0 || canvas.height === 0)) {
                console.warn('⚠️ Canvas toujours non visible après', maxRetries, 'tentatives, utilisation du fallback 2D');
                this.drawFallback2DPreview(canvas, glbElement.type);
                this.glbPreviewAttempts.delete(attemptKey);
                return;
            }

            console.log('✅ [DEBUG] Conditions OK, création aperçu GLB');
            // Créer notre propre système d'aperçu GLB basé sur celui de la bibliothèque
            this.renderOwnGLBPreview(canvas, glbElement);
            
            // Nettoyer l'enregistrement de tentative après succès
            setTimeout(() => {
                this.glbPreviewAttempts.delete(attemptKey);
            }, 1000);

        } catch (error) {
            console.error('❌ Erreur lors de la création aperçu GLB:', error);
            this.drawFallback2DPreview(canvas, glbElement.type);
            if (this.glbPreviewAttempts) {
                const canvasId = canvas.id || canvas.dataset?.containerId || this.getCanvasUniqueId(canvas);
                const glbKey = `${glbElement.type}_${glbElement.scale?.z || 300}`;
                const attemptKey = `${canvasId}_${glbKey}`;
                this.glbPreviewAttempts.delete(attemptKey);
            }
        }
    }

    // Méthode pour générer un ID unique pour un canvas
    getCanvasUniqueId(canvas) {
        // Utiliser la position du canvas dans le DOM comme identifiant
        const parent = canvas.parentElement;
        if (parent && parent.id) {
            return `${parent.id}_canvas`;
        }
        
        // Utiliser les attributs data du canvas
        if (canvas.dataset.elementType) {
            return `canvas_${canvas.dataset.elementType}`;
        }
        
        // Fallback avec timestamp et position
        const rect = canvas.getBoundingClientRect();
        return `canvas_${Math.round(rect.left)}_${Math.round(rect.top)}_${Date.now()}`;
    }

    // 📦 Méthode simplifiée pour créer un aperçu GLB
    renderOwnGLBPreview(canvas, glbElement) {
        try {
            console.log('🎨 [DEBUG] renderOwnGLBPreview démarré');
            
            // Vérifier que le canvas est dans le DOM et visible
            if (!canvas.isConnected) {
                console.error('❌ Canvas pas connecté au DOM');
                return;
            }
            
            // Forcer les dimensions du canvas immédiatement
            const targetSize = 240;
            canvas.width = targetSize;
            canvas.height = targetSize;
            canvas.style.width = targetSize + 'px';
            canvas.style.height = targetSize + 'px';
            
            console.log('🔧 [DEBUG] Dimensions canvas forcées à:', targetSize);
            
            // Vérifier immédiatement si Three.js est disponible
            if (typeof THREE === 'undefined') {
                console.error('❌ THREE.js non disponible');
                this.showErrorPlaceholder(canvas);
                return;
            }
            
            // Créer la scène Three.js
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x2a2a2a);

            // Caméra avec ratio carré
            const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
            camera.position.set(2, 2, 2);

            // Renderer avec options de compatibilité maximale
            const renderer = new THREE.WebGLRenderer({ 
                canvas: canvas, 
                antialias: true,
                alpha: false,
                preserveDrawingBuffer: true,
                powerPreference: "default",
                failIfMajorPerformanceCaveat: false
            });
            
            // Forcer la taille du renderer et vérifier
            renderer.setSize(targetSize, targetSize, false);
            renderer.shadowMap.enabled = false; // Désactivé pour la compatibilité
            
            // Test de rendu immédiat pour vérifier que ça fonctionne
            renderer.setClearColor(0x2a2a2a, 1.0);
            renderer.clear();
            
            console.log('🔧 [DEBUG] Renderer créé et testé avec taille:', targetSize);

            // Éclairage simple
            const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
            directionalLight.position.set(3, 3, 3);
            scene.add(directionalLight);

            // Stocker les objets pour nettoyage
            this.scene = scene;
            this.camera = camera;
            this.renderer = renderer;
            
            // Rendu immédiat d'un test pour vérifier
            renderer.render(scene, camera);
            
            console.log('✅ [DEBUG] Scène 3D créée et testée, chargement du modèle...');

            // Charger le modèle GLB avec fallback immédiat
            this.loadOwnGLBModelWithFallback(scene, camera, renderer, glbElement);

        } catch (error) {
            console.error('❌ Erreur lors de la création de l\'aperçu GLB simplifié:', error);
            this.showErrorPlaceholder(canvas);
        }
    }
    
    // Chargement GLB avec fallback rapide vers un cube simple
    loadOwnGLBModelWithFallback(scene, camera, renderer, glbElement) {
        // D'abord, afficher immédiatement un cube simple
        this.showSimpleCube(scene, camera, renderer, glbElement);
        
        // Ensuite, essayer de charger le GLB en arrière-plan
        setTimeout(() => {
            this.loadOwnGLBModel(scene, camera, renderer, glbElement);
        }, 100);
    }
    
    // Afficher un cube simple immédiatement
    showSimpleCube(scene, camera, renderer, glbElement) {
        try {
            console.log('📦 [DEBUG] Affichage cube simple en attendant GLB');
            
            // Nettoyer d'abord
            while(scene.children.length > 0) {
                const child = scene.children[0];
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
                scene.remove(child);
            }
            
            // Remettre l'éclairage
            const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
            directionalLight.position.set(3, 3, 3);
            scene.add(directionalLight);
            
            // Créer un cube simple
            const geometry = new THREE.BoxGeometry(1, 0.5, 2);
            const material = new THREE.MeshLambertMaterial({ 
                color: 0x8B4513,
                transparent: false
            });
            
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(0, 0, 0);
            
            // Ajouter des arêtes
            const edges = new THREE.EdgesGeometry(geometry);
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
            const wireframe = new THREE.LineSegments(edges, lineMaterial);
            cube.add(wireframe);
            
            scene.add(cube);
            
            // Positionner la caméra
            camera.position.set(2, 2, 2);
            camera.lookAt(0, 0, 0);
            
            // Rendu immédiat
            renderer.render(scene, camera);
            
            // Animation simple
            const animate = () => {
                cube.rotation.y += 0.01;
                renderer.render(scene, camera);
                requestAnimationFrame(animate);
            };
            animate();
            
            console.log('✅ [DEBUG] Cube simple affiché');
            
        } catch (error) {
            console.error('❌ Erreur affichage cube simple:', error);
        }
    }

    // 📦 Charger le modèle GLB pour l'aperçu
    async loadOwnGLBModel(scene, camera, renderer, glbElement) {
        try {
            // Extraire le chemin GLB depuis userData.glbPath ou path
            const glbPath = glbElement.userData?.glbPath || glbElement.path;
            
            console.log('🔧 [DEBUG] loadOwnGLBModel appelée avec:', glbElement);
            console.log('🔧 [DEBUG] Chemin GLB extrait:', glbPath);
            
            // Vérifier que le chemin existe
            if (!glbPath) {
                throw new Error('Chemin GLB manquant dans glbElement (userData.glbPath ou path)');
            }

            // Vérifier GLTFLoader
            if (!window.GLTFLoader) {
                console.error('❌ GLTFLoader non disponible');
                this.showSimpleGLBPlaceholder(renderer, scene, camera, glbElement.name || glbElement.type);
                return;
            }

            console.log('🔄 [DEBUG] Début chargement GLB:', glbPath);
            const loader = new GLTFLoader();
            
            // Ajouter un timeout pour éviter les chargements infinis
            const loadPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout de chargement GLB (10s)'));
                }, 10000);
                
                loader.load(
                    glbPath,
                    (gltf) => {
                        clearTimeout(timeout);
                        resolve(gltf);
                    },
                    (progress) => {
                        console.log('📈 [DEBUG] Progression GLB:', (progress.loaded / progress.total * 100).toFixed(1) + '%');
                    },
                    (error) => {
                        clearTimeout(timeout);
                        reject(error);
                    }
                );
            });
            
            const gltf = await loadPromise;
            console.log('✅ [DEBUG] GLB chargé avec succès');

            if (gltf && gltf.scene) {
                const model = gltf.scene;
                
                // Appliquer l'échelle si disponible
                if (glbElement.scale) {
                    model.scale.set(glbElement.scale.x, glbElement.scale.y, glbElement.scale.z);
                    console.log('🔧 [DEBUG] Échelle appliquée:', glbElement.scale);
                }

                // Calculer le centre et la taille APRÈS avoir appliqué l'échelle
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                
                console.log('📏 [DEBUG] Dimensions modèle:', size);
                
                // Créer un groupe pour contrôler la rotation
                const rotationGroup = new THREE.Group();
                
                // Centrer le modèle par rapport au groupe
                model.position.sub(center);
                
                // Ajouter le modèle au groupe de rotation
                rotationGroup.add(model);
                
                // Ajouter edges pour voir les arêtes principales du claveau
                model.traverse((child) => {
                    if (child.isMesh && child.geometry) {
                        const edgesGeometry = new THREE.EdgesGeometry(child.geometry);
                        const edgesMaterial = new THREE.LineBasicMaterial({ 
                            color: 0x333333, // Gris foncé pour l'aperçu
                            transparent: true,
                            opacity: 0.8,
                            linewidth: 1.5
                        });
                        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
                        
                        // Copier la transformation du mesh pour un alignement parfait
                        edges.position.copy(child.position);
                        edges.rotation.copy(child.rotation);
                        edges.scale.copy(child.scale);
                        
                        edges.userData = { isWireframe: true };
                        child.parent.add(edges);
                    }
                });
                
                // Le groupe sera centré à l'origine (0,0,0) pour une rotation parfaite
                rotationGroup.position.set(0, 0, 0);
                
                // Ajuster la caméra en fonction de la taille
                const maxDim = Math.max(size.x, size.y, size.z);
                const distance = maxDim * 1.5; // Distance réduite pour mieux voir
                camera.position.set(distance, distance * 0.7, distance);
                camera.lookAt(0, 0, 0);

                // Ajouter le groupe à la scène (pas directement le modèle)
                scene.add(rotationGroup);
                
                // Démarrer l'animation de rotation avec le groupe
                this.startGLBPreviewAnimation(scene, camera, renderer, rotationGroup);
                
            } else {
                throw new Error('Modèle GLB invalide');
            }

        } catch (error) {
            if (window.DEBUG_TOOLS_TAB) {
                console.error('❌ Erreur chargement GLB pour aperçu:', error);
            }
            // Afficher un placeholder en cas d'erreur
            this.showSimpleGLBPlaceholder(renderer, scene, camera, glbElement.name || glbElement.type);
        }
    }

    // 📦 Animation de l'aperçu GLB
    startGLBPreviewAnimation(scene, camera, renderer, rotationGroup) {
        if (this.glbAnimationId) {
            cancelAnimationFrame(this.glbAnimationId);
        }

        const animate = () => {
            this.glbAnimationId = requestAnimationFrame(animate);
            
            // Rotation lente du groupe autour de son centre (axe Y)
            if (rotationGroup) {
                rotationGroup.rotation.y += 0.01;
            }
            
            renderer.render(scene, camera);
        };

        animate();
    }

    // 📦 Placeholder simple pour GLB
    showSimpleGLBPlaceholder(renderer, scene, camera, glbName) {
        // Créer un cube simple comme placeholder
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const cube = new THREE.Mesh(geometry, material);
        
        // Créer un groupe pour la rotation du placeholder aussi
        const rotationGroup = new THREE.Group();
        rotationGroup.add(cube);
        scene.add(rotationGroup);
        
        // Animation du placeholder
        const animate = () => {
            if (this.glbAnimationId) {
                rotationGroup.rotation.y += 0.01;
                renderer.render(scene, camera);
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    /**
     * Mise à jour des boutons de longueur pour les éléments GLB (Hourdis)
     */
    updateGLBLengthButtons(cutButtonsContainer, activeElement) {
        // Vérification de sécurité
        if (!activeElement) {
            console.warn('⚠️ activeElement est undefined dans updateGLBLengthButtons');
            cutButtonsContainer.innerHTML = '<div>Élément non disponible</div>';
            return;
        }

        // Valeur par défaut sécurisée
        const defaultLength = activeElement.customLength || activeElement.length || 200;
        
        // Créer une interface spéciale pour les longueurs de Hourdis
        cutButtonsContainer.innerHTML = `
            <div class="glb-length-controls">
                <label class="glb-length-label">Longueur (cm):</label>
                <div class="glb-length-presets">
                    <button class="glb-length-btn" data-length="100">100</button>
                    <button class="glb-length-btn" data-length="200">200</button>
                    <button class="glb-length-btn" data-length="300">300</button>
                    <button class="glb-length-btn" data-length="400">400</button>
                    <button class="glb-length-btn" data-length="P">P</button>
                </div>
                <div class="glb-custom-length" style="display: none;">
                    <input type="number" class="glb-length-input" min="50" max="1000" step="10" 
                           value="${defaultLength}" placeholder="Longueur personnalisée">
                    <button class="glb-length-apply" title="Appliquer la longueur personnalisée">✓</button>
                </div>
            </div>
        `;

        // Ajouter les écouteurs d'événements
        const presetButtons = cutButtonsContainer.querySelectorAll('.glb-length-btn');
        const customInput = cutButtonsContainer.querySelector('.glb-length-input');
        const applyButton = cutButtonsContainer.querySelector('.glb-length-apply');
        const customLengthDiv = cutButtonsContainer.querySelector('.glb-custom-length');

        // Marquer le bouton actif selon la longueur actuelle
        const currentLength = activeElement.customLength || activeElement.length;
        presetButtons.forEach(btn => {
            const btnLength = btn.dataset.length;
            if (btnLength === 'P' && activeElement.customLength) {
                btn.classList.add('active');
                customLengthDiv.style.display = 'flex';
            } else if (parseInt(btnLength) === currentLength) {
                btn.classList.add('active');
            }
        });

        // Écouteurs pour les boutons de longueur prédéfinie
        presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const lengthValue = btn.dataset.length;
                
                // Mettre à jour l'interface
                presetButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                if (lengthValue === 'P') {
                    // Afficher l'interface de longueur personnalisée
                    customLengthDiv.style.display = 'flex';
                    customInput.focus();
                } else {
                    // Appliquer la longueur prédéfinie
                    const length = parseInt(lengthValue);
                    this.applyGLBLength(activeElement, length);
                    customLengthDiv.style.display = 'none';
                    customInput.value = length;
                }
            });
        });

        // Écouteur pour la longueur personnalisée
        applyButton.addEventListener('click', () => {
            const customLength = parseInt(customInput.value);
            if (customLength && customLength >= 50 && customLength <= 1000) {
                this.applyGLBLength(activeElement, customLength);
            }
        });

        // Appliquer la longueur en appuyant sur Entrée
        customInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyButton.click();
            }
        });

        cutButtonsContainer.style.display = 'block';
    }

    /**
     * Appliquer une nouvelle longueur à un élément GLB
     */
    applyGLBLength(activeElement, newLength) {
        // Vérifier si c'est une longueur standard ou personnalisée
        const standardLengths = [100, 200, 300, 400];
        const isCustomLength = !standardLengths.includes(newLength);
        
        // Mettre à jour l'élément avec la nouvelle longueur
        if (isCustomLength) {
            activeElement.customLength = newLength;
        } else {
            // Pour les longueurs standard, utiliser la propriété length normale
            activeElement.length = newLength;
            // Supprimer la longueur personnalisée si elle existait
            delete activeElement.customLength;
        }
        
        // Déclencher la mise à jour de l'aperçu et des dimensions
        this.updateActiveElementPreview();
        
        // Émettre un événement pour informer les autres composants
        const event = new CustomEvent('glbLengthChanged', {
            detail: {
                element: activeElement,
                newLength: newLength,
                isCustom: isCustomLength
            }
        });
        document.dispatchEvent(event);
    }
}

// Auto-initialisation optimisée quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    // Initialisation différée pour éviter les violations de performance
    const initToolsManager = () => {
        // Attendre que THREE.js soit disponible avant d'initialiser
        if (window.waitForThreeJS) {
            window.waitForThreeJS(() => {
                window.ToolsTabManager = new ToolsTabManager();
                
                // Exposer la méthode de debug
                window.debugPreview = () => window.ToolsTabManager.debugPreview();
                window.forceDefaultSelection = () => window.ToolsTabManager.ensureDefaultElementSelection();
            });
        } else {
            // Fallback si waitForThreeJS n'est pas disponible
            setTimeout(() => {
                window.ToolsTabManager = new ToolsTabManager();
                
                // Exposer la méthode de debug
                window.debugPreview = () => window.ToolsTabManager.debugPreview();
                window.forceDefaultSelection = () => window.ToolsTabManager.ensureDefaultElementSelection();
            }, 1000);
        }
    };
    
    // Utiliser Promise.resolve() pour une micro-tâche plus légère
    Promise.resolve().then(() => {
        setTimeout(initToolsManager, 50);
    });
});

// Export pour utilisation externe
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToolsTabManager;
}

