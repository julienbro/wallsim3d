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
        
        this.init();
    }

    init() {
                
        // Vérifier que l'élément DOM existe
        const tabElement = document.getElementById('tab-content-outils');
        if (!tabElement) {
            console.error('❌ ToolsTabManager: Élément DOM tab-content-outils non trouvé!');
            return;
        }
        
        this.setupEventListeners();
        this.updateDisplay();
        
        // Mise à jour initiale de l'aperçu d'élément - différée pour éviter les violations
        // Éviter le rendu initial coûteux, le faire seulement quand l'utilisateur active l'onglet
        this.initialPreviewPending = true;
        
        // Observer les changements d'onglet pour faire le rendu seulement quand nécessaire
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const toolsTab = document.querySelector('[data-tab="outils"]');
                    if (toolsTab && toolsTab.classList.contains('active') && this.initialPreviewPending) {
                        this.initialPreviewPending = false;
                        // Délai minimal pour éviter les violations
                        setTimeout(() => {
                            this.updateActiveElementPreview(null, true); // Force le rendu
                        }, 10);
                    }
                }
            });
        });
        
        // Observer les changements sur les onglets
        const tabsContainer = document.querySelector('.main-tabs');
        if (tabsContainer) {
            observer.observe(tabsContainer, { attributes: true, subtree: true });
        }
        
        // Vérifier si l'onglet outils est déjà actif au chargement
        const toolsTab = document.querySelector('[data-tab="outils"]');
        if (toolsTab && toolsTab.classList.contains('active')) {
            this.initialPreviewPending = false;
            // Initialiser l'aperçu immédiatement si l'onglet est déjà actif
            setTimeout(() => {
                this.updateActiveElementPreview(null, true); // Force le rendu
            }, 100);
        }
        
        // Initialiser une brique par défaut si aucune n'est sélectionnée
        setTimeout(() => {
            this.ensureDefaultElementSelection();
        }, 1000);
        
        // Attacher l'événement au canvas Three.js pour la sélection d'assise
        this.setupSceneClickHandler();
        
        // Écouter les changements d'assise du gestionnaire principal
        document.addEventListener('assiseChanged', (e) => {
            this.updateDisplay();
        });
        
        document.addEventListener('assiseTypeChanged', (e) => {
            this.updateDisplay();
        });
        
        // Écouter les changements d'éléments dans les assises
        document.addEventListener('assiseElementsChanged', (e) => {
            this.updateDisplay();
        });
        
        // Écouter les changements de sélection de brique/bloc/isolant/linteau
        document.addEventListener('brickSelectionChanged', (e) => {
            this.updateActiveElementPreview();
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
                console.log('🔧 Clic détecté sur onglet:', e.target.textContent, e.target.dataset.tab);
                
                // Vérifier si on doit ignorer ce clic (clic programmatique depuis activateToolsTab)
                if (window.skipTabClickHandler) {
                    console.log('🔧 Clic programmatique ignoré - pas de réinitialisation de brique');
                    return;
                }
                
                Promise.resolve().then(() => {
                    this.updateActiveElementPreview();
                    // S'assurer qu'un élément par défaut est sélectionné pour le nouvel onglet
                    // SEULEMENT si aucune brique n'est actuellement sélectionnée
                    if (!window.BrickSelector || !window.BrickSelector.currentBrick || 
                        window.BrickSelector.currentBrick.trim() === '') {
                        console.log('🔧 Onglet changé + aucune brique sélectionnée → sélection par défaut');
                        this.ensureDefaultElementSelection();
                    } else {
                        console.log('🔧 Onglet changé mais brique déjà sélectionnée:', window.BrickSelector.currentBrick, '→ conservation');
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
        // console.log('🔍 detectCurrentCut() appelée pour mode:', activeMode);
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
            // console.log('🔍 Type fantôme détecté:', ghostType);
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
            // console.log('🔍 Pas de fantôme disponible ou pas de userData');
        }

        // 3. Si pas trouvé via fantôme, vérifier via TabManager.selectedCutType
        if (cutInfo.type === null && window.TabManager && window.TabManager.selectedCutType) {
            const cutType = window.TabManager.selectedCutType;
            // console.log('🔍 selectedCutType trouvé:', cutType);
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
            // console.log('🔍 Analyse selectedLibraryItem pour coupe:', selectedItem);
            
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
            // console.log('🔍 Debug TabManager properties:', {
            //     selectedLibraryItem: window.TabManager.selectedLibraryItem,
            //     selectedCutType: window.TabManager.selectedCutType
            // });
        }

        // 6. Dernière tentative: analyser le type d'isolant actuel pour détecter un suffixe de coupe
        if (cutInfo.type === null && (activeMode === 'isolant' || activeMode === 'insulation') && window.InsulationSelector) {
            const currentType = window.InsulationSelector.getCurrentInsulation();
            // console.log('🔍 Analyse type isolant pour coupe:', currentType);
            
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

        // console.log('🔍 detectCurrentCut() résultat final:', cutInfo);
        return cutInfo;
    }

    updateActiveElementPreview(forceElement = null, force = false) {
        // Log réduit - seulement si forceElement ou debug activé
        if (forceElement && window.DEBUG_TOOLS_TAB) {
            console.log('🔧 ToolsTabManager: updateActiveElementPreview appelée avec forceElement:', forceElement);
        }
        
        // Si un élément est forcé (depuis la sélection), l'utiliser directement
        if (forceElement) {
            if (window.DEBUG_TOOLS_TAB) {
                console.log('🔧 ToolsTabManager: Utilisation d\'élément forcé:', forceElement);
            }
            this.renderElementPreview(forceElement);
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

        if (!nameElement || !dimensionsElement || !cutButtonsContainer) {
            if (window.DEBUG_TOOLS_TAB) {
                console.warn('🎨 Éléments DOM manquants pour l\'aperçu 3D');
            }
            return;
        }

        // console.log('🔍 Éléments DOM trouvés, analyse des sélecteurs...');

        // Déterminer l'élément actif
        let activeElement = null;
        let elementType = 'brique';
        
        // Vérifier tous les sélecteurs disponibles
        const selectorStates = {
            brick: window.BrickSelector?.currentBrick || 'none',
            block: window.BlockSelector?.currentBlock || 'none',
            insulation: window.InsulationSelector?.currentInsulation?.name || window.InsulationSelector?.currentInsulation?.type || 'none',
            linteau: window.LinteauSelector?.currentLinteau?.name || window.LinteauSelector?.currentLinteau?.type || 'none',
            tempGLB: window.tempGLBInfo?.type || 'none'
        };
        
        // Créer une clé de cache pour vérifier si quelque chose a changé
        const stateKey = Object.values(selectorStates).join('|');
        
        // Vérifier le cache seulement si ce n'est pas un rendu forcé
        if (!force && this.lastPreviewCache && this.lastPreviewCache.stateKey === stateKey) {
            return; // Rien n'a changé, pas besoin de recalculer
        }
        
        // Log uniquement si quelque chose a changé ET si debug activé
        if ((!this.lastSelectorState || this.lastSelectorState !== stateKey) && window.DEBUG_TOOLS_TAB) {
            console.log('🎨 États sélecteurs:', selectorStates);
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
                const typeToMode = {
                    'M65': 'brique',
                    'M100': 'bloc', 
                    'isolant': 'isolant',
                    'linteau': 'linteau'
                };
                activeMode = typeToMode[window.AssiseManager.currentType] || 'brique';
            }
        }
        
        // Détecter le type de coupe maintenant que activeMode est défini
        let cutInfo = this.detectCurrentCut(activeMode);
        
        // PRIORITÉ: Vérifier d'abord les éléments GLB actifs
        
        if (window.tempGLBInfo) {
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
            // console.log('🔍 Récupération données isolant:', insulationType, insulationData);
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
            // console.log('🔍 Récupération données linteau:', window.LinteauSelector.currentLinteau);
            activeElement = window.LinteauSelector.currentLinteau;
            elementType = 'linteau';
        }

        // Debug: afficher les données des sélecteurs disponibles
        if (!activeElement && (activeMode === 'isolant' || activeMode === 'insulation')) {
            // console.log('🔍 Debug InsulationSelector:', {
            //     exists: !!window.InsulationSelector,
            //     currentInsulation: window.InsulationSelector?.currentInsulation,
            //     getCurrentInsulation: window.InsulationSelector?.getCurrentInsulation(),
            //     getCurrentInsulationData: window.InsulationSelector?.getCurrentInsulationData(),
            //     allProps: window.InsulationSelector ? Object.keys(window.InsulationSelector) : 'N/A'
            // });
        }

        if (activeElement) {       
            if (window.DEBUG_TOOLS_TAB) {
                console.log('✅ ToolsTabManager: Élément actif détecté:', {
                    name: activeElement.name,
                    type: activeElement.type,
                    baseType: activeElement.baseType,
                    elementType: elementType,
                    cutInfo: cutInfo
                });     
            }
            // Mettre à jour les informations de l'élément
            const displayName = activeElement.name || activeElement.type || 'Élément inconnu';
            if (window.DEBUG_TOOLS_TAB) {
                console.log('🏷️ ToolsTabManager: Mise à jour nom affichage:', displayName);
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
                const cutSignature = cutInfo.type || 'full';
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

            // Mettre à jour les boutons de coupe pour les éléments qui supportent les coupes
            if (elementType === 'glb' && activeElement) {
                // Pour les éléments GLB, utiliser l'interface spécialisée
                this.updateGLBLengthButtons(cutButtonsContainer, activeElement);
            } else if (elementType === 'brique' || elementType === 'bloc' || elementType === 'linteau' || elementType === 'isolant') {
                this.updateToolsCutButtons(cutButtonsContainer, activeElement);
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
        if (window.DEBUG_TOOLS_TAB) {
            console.log('🎨 ToolsTabManager: Rendu d\'élément forcé:', element);
        }
        
        const canvas = document.getElementById('toolsActiveElementCanvas');
        const nameElement = document.getElementById('toolsElementName');
        const dimensionsElement = document.getElementById('toolsElementDimensions');
        const cutButtonsContainer = document.getElementById('toolsCutButtons');

        if (!nameElement || !dimensionsElement || !cutButtonsContainer || !canvas) {
            console.warn('🎨 Éléments DOM manquants pour l\'aperçu 3D');
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

        // Déterminer le type d'élément
        let elementType = 'glb';
        if (element.userData && element.userData.isGLB) {
            elementType = 'glb';
        }

        // Initialiser l'aperçu 3D pour l'élément GLB
        if (window.LibraryPreview3D && elementType === 'glb') {
            const cutSignature = 'full'; // Pas de coupe pour la sélection
            const canvasSignature = `${element.type}_${cutSignature}`;
            const currentCanvasType = canvas.getAttribute('data-element-type');
            
            if (currentCanvasType !== canvasSignature) {
                canvas.setAttribute('data-element-type', canvasSignature);
                canvas.setAttribute('data-current-element-type', elementType);
                
                try {
                    this.createGLBPreviewUsingLibrary(canvas, element);
                    if (window.DEBUG_TOOLS_TAB) {
                        console.log('✅ ToolsTabManager: Aperçu 3D GLB créé pour:', element.type);
                    }
                } catch (error) {
                    if (window.DEBUG_TOOLS_TAB) {
                        console.warn('Erreur lors de la création de l\'aperçu 3D GLB:', error);
                    }
                    this.drawFallbackPreview(canvas, element, elementType);
                }
            }
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
            console.log('✅ ToolsTabManager: Élément GLB rendu:', elementType, '-', element.name || element.type);
        }
    }

    // Méthode de débogage pour forcer la mise à jour de l'aperçu
    forcePreviewUpdate() {
        console.log('🔧 Force la mise à jour de l\'aperçu 3D...');
        this.lastPreviewCache = null; // Réinitialiser le cache
        this.updateActiveElementPreview(null, true);
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
        // console.log('🎨 Boutons de coupe mis à jour pour:', baseType, 'catégorie:', elementCategory);
    }

    selectCutInTools(cutInfo, baseType, clickedElement) {
        // console.log('🔧 Sélection de coupe dans l\'onglet Outils:', cutInfo, 'pour élément', baseType);
        
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
                    console.log('🔄 GLB déjà chargé, réutilisation du modèle existant');
                    this.startToolsAnimation();
                    return;
                }
                
                console.log('📦 Chargement nouveau GLB:', elementTypeValue);
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
        // console.log('🔍 Géométrie créée - Dimensions scalées:', scaledSize, 'Géométrie Three.js:', 
        //     geometry.parameters.width, 'x', geometry.parameters.height, 'x', geometry.parameters.depth);
        
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
            'B19': { size: [3.9, 1.9, 1.9], color: 0x777777 },  // Bloc grand
            'B29': { size: [3.9, 2.9, 1.9], color: 0x666666 }   // Très grand bloc
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
            console.log('🔧 ensureDefaultElementSelection appelée');
            console.log('🔧 BrickSelector exists:', !!window.BrickSelector);
            console.log('🔧 currentBrick value:', window.BrickSelector?.currentBrick);
            console.log('🔧 currentBrick type:', typeof window.BrickSelector?.currentBrick);
            console.log('🔧 currentBrick trimmed:', window.BrickSelector?.currentBrick?.trim());
        }
        
        // Vérifier si une brique est déjà sélectionnée ET valide (y compris les briques coupées)
        if (window.BrickSelector && window.BrickSelector.currentBrick && 
            typeof window.BrickSelector.currentBrick === 'string' && 
            window.BrickSelector.currentBrick.trim() !== '') {
            if (window.DEBUG_TOOLS_TAB) {
                console.log('✅ Une brique est déjà sélectionnée:', window.BrickSelector.currentBrick, '- Conservation de la sélection');
            }
            return;
        }
        
        // Essayer de sélectionner automatiquement une brique M65 par défaut SEULEMENT si aucune brique n'est sélectionnée
        if (window.BrickSelector && !window.BrickSelector.currentBrick) {
            console.log('🔧 Aucune brique sélectionnée, sélection de M65 par défaut');
            // Forcer une brique M65 par défaut
            window.BrickSelector.currentBrick = 'M65';
            
            // Déclencher l'événement de changement
            document.dispatchEvent(new CustomEvent('brickSelectionChanged', {
                detail: { brick: 'M65' }
            }));
            
            this.updateActiveElementPreview();
            return;
        } else {
            console.log('🔧 BrickSelector non disponible ou currentBrick existe déjà:', window.BrickSelector?.currentBrick);
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
            console.log('❌ Élément sans informations d\'assise');
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
            // console.log('🔧 Ajout d\'assise demandé...');
            const newAssise = window.AssiseManager.addAssise();
            
            if (newAssise) {
                // console.log('🔧 Nouvelle assise créée:', newAssise);
                // Basculer automatiquement vers la nouvelle assise en utilisant la méthode appropriée
                const success = window.AssiseManager.setActiveAssise(newAssise.index);
                // console.log('🔧 Activation assise:', success ? 'réussie' : 'échouée');
                
                // Force la mise à jour avec un délai
                setTimeout(() => {
                    this.updateDisplay();
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

        console.log('📦 Création aperçu GLB pour l\'onglet Outils:', glbType, glbInfo);
        
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
                    progress => console.log('📥 Chargement GLB aperçu:', Math.round(progress.loaded / progress.total * 100) + '%'),
                    reject
                );
            });

            if (gltf && gltf.scene) {
                const glbScene = gltf.scene.clone();
                
                // Appliquer l'échelle si disponible
                if (glbInfo.scale) {
                    glbScene.scale.set(glbInfo.scale.x, glbInfo.scale.y, glbInfo.scale.z);
                    console.log('📏 Échelle GLB appliquée:', glbInfo.scale);
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
                    console.log('📷 Caméra ajustée pour GLB, taille max:', maxDim);
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
                    
                    console.log('✅ Aperçu GLB ajouté à la scène de l\'onglet Outils et mis en cache');
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
    createGLBPreviewUsingLibrary(canvas, glbElement) {
        
        try {
            // Nettoyer toute animation en cours
            if (this.cleanup3DPreview) {
                this.cleanup3DPreview();
            }

            // Vérifier THREE.js
            if (typeof THREE === 'undefined') {
                if (window.DEBUG_TOOLS_TAB) {
                    console.error('❌ THREE.js non disponible pour aperçu GLB');
                }
                this.drawFallback2DPreview(canvas, glbElement.type);
                return;
            }

            // Créer notre propre système d'aperçu GLB basé sur celui de la bibliothèque
            this.renderOwnGLBPreview(canvas, glbElement);

        } catch (error) {
            if (window.DEBUG_TOOLS_TAB) {
                console.error('❌ Erreur lors de la création aperçu GLB:', error);
            }
            this.drawFallback2DPreview(canvas, glbElement.type);
        }
    }

    // 📦 Méthode simplifiée pour créer un aperçu GLB
    renderOwnGLBPreview(canvas, glbElement) {
        try {
            // Créer la scène Three.js
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x2a2a2a);

            // Ajuster la taille du canvas
            const size = Math.min(canvas.width, canvas.height);
            canvas.width = size;
            canvas.height = size;

            // Caméra avec ratio carré
            const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
            camera.position.set(2, 2, 2);

            // Renderer avec taille ajustée
            const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
            renderer.setSize(size, size);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            // Éclairage
            const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 5, 5);
            directionalLight.castShadow = true;
            scene.add(directionalLight);

            // Stocker les objets pour nettoyage
            this.scene = scene;
            this.camera = camera;
            this.renderer = renderer;

            // Charger le modèle GLB
            this.loadOwnGLBModel(scene, camera, renderer, glbElement);

        } catch (error) {
            if (window.DEBUG_TOOLS_TAB) {
                console.error('❌ Erreur lors de la création de l\'aperçu GLB simplifié:', error);
            }
            this.drawFallback2DPreview(canvas, glbElement.type);
        }
    }

    // 📦 Charger le modèle GLB pour l'aperçu
    async loadOwnGLBModel(scene, camera, renderer, glbElement) {
        try {
            // Extraire le chemin GLB depuis userData.glbPath ou path
            const glbPath = glbElement.userData?.glbPath || glbElement.path;
            
            if (window.DEBUG_TOOLS_TAB) {
                console.log('🔧 loadOwnGLBModel appelée avec:', glbElement);
                console.log('🔧 Chemin GLB extrait:', glbPath);
            }
            
            // Vérifier que le chemin existe
            if (!glbPath) {
                throw new Error('Chemin GLB manquant dans glbElement (userData.glbPath ou path)');
            }

            // Vérifier GLTFLoader
            if (!window.GLTFLoader) {
                if (window.DEBUG_TOOLS_TAB) {
                    console.error('❌ GLTFLoader non disponible');
                }
                return;
            }

            const loader = new GLTFLoader();
            
            const gltf = await new Promise((resolve, reject) => {
                loader.load(
                    glbPath,
                    resolve,
                    undefined, // Pas de callback de progression
                    reject
                );
            });

            if (gltf && gltf.scene) {
                const model = gltf.scene;
                
                // Appliquer l'échelle si disponible
                if (glbElement.scale) {
                    model.scale.set(glbElement.scale.x, glbElement.scale.y, glbElement.scale.z);
                }

                // Calculer le centre et la taille APRÈS avoir appliqué l'échelle
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                
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


