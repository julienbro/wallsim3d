/**
 * Gestionnaire des onglets - Gère tous les onglets de l'interface
 * Onglets principaux: Assise, Biblio, Textures, Joints, Propriétés, Préférences, Ombres, Projet
 * Maintient la synchronisation avec les sélecteurs existants
 */
class TabManager {
    // ===============================================
    // GESTIONNAIRE DE RENDERERS WEBGL PARTAGÉ
    // ===============================================
    
    constructor() {
        // Gestionnaire de renderers partagé pour éviter la fuite de contextes WebGL
        this.sharedRenderer = null;
        this.sharedScene = null;
        this.sharedCamera = null;
        this.rendererInitialized = false;
        this.currentMainTab = 'biblio';
        this.currentSubTab = 'briques';
        this.currentMainSubTab = 'bibliotheque'; // Nouveau: sous-onglet principal de biblio
        this.selectedLibraryItem = null;
        this.selectedCutType = null;
        this.userSelectedBiblioTab = false; // Suivi de la sélection manuelle de l'onglet biblio
        
        // Couleurs par défaut pour les joints (gris souris)
        this.selectedBrickJointColor = { name: 'Gris Souris', hex: '#9E9E9E', category: 'Gris' };
        this.selectedBlockJointColor = { name: 'Gris Souris', hex: '#9E9E9E', category: 'Gris' };
        
        // Nouveau: Gestion des éléments à réutiliser
        this.reusableElements = {
            briques: new Map(),
            blocs: new Map(),
            glb: new Map(), // Nouveau: catégorie pour les éléments GLB
            autres: new Map()
        };
        
        // console.log('🏗️ CONSTRUCTEUR TabManager - couleurs définies:', {
        //     brick: this.selectedBrickJointColor,
        //     block: this.selectedBlockJointColor
        // });
        
        this.init();
    }

    /**
     * Initialise le renderer WebGL partagé pour éviter les fuites de contexte
     */
    initSharedRenderer() {
        if (this.rendererInitialized) {
            return;
        }

        // Vérifier que THREE.js est disponible
        if (typeof THREE === 'undefined') {
            if (window.DEBUG_TAB_MANAGER) {
                console.warn('⚠️ THREE.js not loaded yet, deferring renderer initialization');
            }
            // Utiliser requestAnimationFrame pour éviter les violations de performance
            requestAnimationFrame(() => this.initSharedRenderer());
            return;
        }

        try {
            // Créer un canvas off-screen pour le renderer partagé
            const canvas = document.createElement('canvas');
            canvas.width = 160;
            canvas.height = 120;

            // Créer les composants Three.js partagés
            this.sharedScene = new THREE.Scene();
            this.sharedCamera = new THREE.PerspectiveCamera(45, 160/120, 0.1, 1000);
            this.sharedRenderer = new THREE.WebGLRenderer({ 
                canvas: canvas,
                antialias: true, 
                alpha: true,
                preserveDrawingBuffer: true
            });
            
            this.sharedRenderer.setSize(160, 120);
            this.sharedRenderer.setClearColor(0x000000, 0);

            // Éclairage partagé
            const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
            this.sharedScene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 5, 5);
            this.sharedScene.add(directionalLight);

            // Position de la caméra
            this.sharedCamera.position.set(3.5, 2.5, 4);
            this.sharedCamera.lookAt(0, 0, 0);

            this.rendererInitialized = true;
            // console.log('✅ Renderer WebGL partagé initialisé avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du renderer partagé:', error);
            this.rendererInitialized = false;
        }
    }

    /**
     * Nettoie le renderer partagé
     */
    disposeSharedRenderer() {
        if (this.sharedRenderer) {
            this.sharedRenderer.dispose();
            this.sharedRenderer = null;
        }
        this.sharedScene = null;
        this.sharedCamera = null;
        this.rendererInitialized = false;
        console.log('🧹 Renderer WebGL partagé nettoyé');
    }

    init() {
        this.setupMainTabs();
        this.setupMainSubTabs(); // Nouveau: sous-onglets principaux de biblio
        this.setupSubTabs();
        this.setupLibraryItems();
        this.setupCutButtons();
        this.setupCutButtonsMini();
        this.setupTextureItems();
        this.setupSynchronization();
        this.setupBiblioModeButtons();
        this.setupNewTabs(); // Nouveaux onglets
        this.setupReusableElements(); // Nouveau: éléments à réutiliser
        
        // Initialiser le renderer partagé pour les aperçus 3D (différé pour éviter les problèmes de timing)
        Promise.resolve().then(() => {
            return new Promise(resolve => {
                setTimeout(() => {
                    this.initSharedRenderer();
                    resolve();
                }, 100);
            });
        });
        
        // DÉSACTIVÉ: Écouter l'événement de sélection d'élément de bibliothèque
        // pour rester dans l'onglet bibliothèque lors de la sélection
        /* document.addEventListener('libraryItemSelected', (e) => {
            const { itemType, itemElement } = e.detail;
            if (window.DEBUG_TAB_MANAGER) {
            if (window.DEBUG_TAB_MANAGER) {
            console.log('📚 TabManager: Élément de bibliothèque sélectionné:', itemType);
        }
            }
            
            // Basculer vers l'onglet Outils
            this.switchMainTab('outils');
            
            // Si c'est un élément GLB (hourdis), mettre à jour l'élément actif dans l'onglet Outils
            if (itemType && (itemType.includes('hourdis') || (window.BrickSelector?.brickTypes?.[itemType]?.category === 'glb'))) {
                if (window.DEBUG_TAB_MANAGER) {
                if (window.DEBUG_TAB_MANAGER) {
                    console.log('📚 TabManager: Élément GLB détecté dans bibliothèque, mise à jour onglet Outils');
                }
                }
                
                // Récupérer les données de l'élément GLB
                const glbData = window.BrickSelector?.brickTypes?.[itemType];
                if (glbData) {
                    // Créer un objet élément temporaire pour la mise à jour
                    const tempElement = {
                        type: itemType,
                        name: glbData.name,
                        dimensions: {
                            length: glbData.length,
                            width: glbData.width, 
                            height: glbData.height
                        },
                        material: 'glb_model',
                        userData: {
                            isGLB: true,
                            glbType: itemType,
                            glbInfo: {
                                type: itemType,
                                isHourdis: itemType.includes('hourdis')
                            }
                        }
                    };
                    
                    // Mettre à jour l'onglet Outils
                    setTimeout(() => {
                        if (window.ToolsTabManager && window.ToolsTabManager.updateActiveElementPreview) {
                            window.ToolsTabManager.updateActiveElementPreview(tempElement);
                            if (window.DEBUG_TAB_MANAGER) {
                                console.log('✅ TabManager: Onglet Outils mis à jour avec élément GLB de bibliothèque');
                            }
                        }
                    }, 100); // Petit délai pour s'assurer que l'onglet est actif
                }
            }
        }); */
        
        // Écouter les changements de longueur GLB pour mettre à jour l'interface
        document.addEventListener('glbLengthChanged', (e) => {
            const { element, newLength, isCustom } = e.detail;
            // Changement de longueur GLB détecté
            
            // Mettre à jour les informations GLB temporaires si elles existent
            if (window.tempGLBInfo && window.tempGLBInfo.type === element.type) {
                window.tempGLBInfo.lengthValue = newLength.toString();
                window.tempGLBInfo.scale.z = newLength;
                console.log('🔄 Mise à jour tempGLBInfo avec nouvelle longueur:', newLength);
                
                // Déclencher la recréation du fantôme avec la nouvelle échelle
                if (window.ConstructionTools && window.ConstructionTools.createGhostElement) {
                    window.ConstructionTools.createGhostElement();
                    console.log('👻 Fantôme GLB recréé avec nouvelle longueur');
                }
            }
            
            // Mettre à jour les informations de l'élément placé si elles existent
            if (window.lastPlacedGLBInfo && window.lastPlacedGLBInfo.type === element.type) {
                window.lastPlacedGLBInfo.lengthValue = newLength.toString();
                window.lastPlacedGLBInfo.scale.z = newLength;
                // Mise à jour lastPlacedGLBInfo avec nouvelle longueur
            }
        });
        
        // Écouter l'événement de placement d'éléments pour les ajouter aux éléments réutilisables
        // Initialiser le cache pour éviter les traitements en double
        this.recentlyProcessedElements = new Set();
        
        document.addEventListener('elementPlaced', (e) => {
            const element = e.detail.element;
            
            // Protection contre les doublons
            const elementKey = element.id || `${element.type}_${Date.now()}`;
            if (this.recentlyProcessedElements.has(elementKey)) {
                return;
            }
            
            // Ajouter à la liste des éléments récemment traités
            this.recentlyProcessedElements.add(elementKey);
            
            // Nettoyer le cache après 2 secondes
            setTimeout(() => {
                this.recentlyProcessedElements.delete(elementKey);
            }, 2000);
            
            this.handleElementPlaced(element);
        });
        
        // Écouter les changements de sélection de briques pour mettre à jour l'onglet Outils
        document.addEventListener('brickSelectionChanged', (e) => {
            const { brickType, brickData } = e.detail;
            // console.log('🔧 TabManager: Événement brickSelectionChanged reçu');
            // console.log('🔧 TabManager: brickType:', brickType);
            // console.log('🔧 TabManager: brickData:', brickData);
            // console.log('🔧 TabManager: currentMainTab:', this.currentMainTab);
            
            // Si c'est un élément GLB, mettre à jour l'élément actif dans l'onglet Outils
            if (brickData && brickData.category === 'glb') {
                console.log('🔧 TabManager: Élément GLB sélectionné, mise à jour de l\'onglet Outils');
                
                // Créer un objet élément temporaire pour la mise à jour
                const tempElement = {
                    type: brickType,
                    name: brickData.name,
                    dimensions: {
                        length: brickData.length,
                        width: brickData.width, 
                        height: brickData.height
                    },
                    material: 'glb_model',
                    userData: {
                        isGLB: true,
                        glbType: brickType,
                        glbInfo: {
                            type: brickType,
                            isHourdis: brickType.includes('hourdis')
                        }
                    }
                };
                
                // Mettre à jour l'onglet Outils si actif
                if (this.currentMainTab === 'outils') {
                    if (window.ToolsTabManager && window.ToolsTabManager.updateActiveElementPreview) {
                        window.ToolsTabManager.updateActiveElementPreview(tempElement);
                        if (window.DEBUG_TAB_MANAGER) {
                            console.log('✅ TabManager: Onglet Outils mis à jour avec élément GLB');
                        }
                    }
                }
            }
        });
        
        // DÉSACTIVÉ: Écouter l'événement de sélection d'élément de bibliothèque 
        // pour rester dans l'onglet bibliothèque lors de la sélection
        // document.addEventListener('libraryItemSelected', (e) => {
        //     const { itemType, itemElement } = e.detail;
        //     if (window.DEBUG_TAB_MANAGER) {
        //         console.log('📚 TabManager: Événement libraryItemSelected reçu:', itemType);
        //         console.log('🔧 TabManager: Activation onglet Outils (via événement libraryItemSelected)');
        //     }
        //     this.activateToolsTab();
        // });
        
        // Force l'affichage de l'onglet Biblio au démarrage
        setTimeout(() => {
            this.switchMainTab('biblio');
        }, 100);
        
    }

    // === GESTION DES ONGLETS PRINCIPAUX ===
    setupMainTabs() {
        const mainTabs = document.querySelectorAll('.main-tab');
        mainTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = tab.dataset.tab;
                this.switchMainTab(tabId);
            });
        });
    }

    switchMainTab(tabId) {
        if (this.currentMainTab === tabId) return;

        // Masquer toutes les aides contextuelles lors du changement d'onglet
        this.hideAllContextualHelp();

        // Marquer la sélection manuelle de l'onglet biblio
        if (tabId === 'biblio') {
            this.userSelectedBiblioTab = true;
        } else if (tabId === 'assise') {
            this.userSelectedBiblioTab = false;
        }

        // Masquer tous les contenus d'onglets
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Désactiver tous les onglets
        document.querySelectorAll('.main-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Activer le nouvel onglet et son contenu
        const newTab = document.querySelector(`[data-tab="${tabId}"]`);
        const newContent = document.getElementById(`tab-content-${tabId}`);

        if (newTab && newContent) {
            newTab.classList.add('active');
            newContent.classList.add('active');
            this.currentMainTab = tabId;

            // Traitement spécial pour l'onglet Outils
            if (tabId === 'outils' && window.ToolsTabManager) {
                // S'assurer que le ToolsTabManager met à jour son affichage
                setTimeout(() => {
                    if (window.ToolsTabManager.updateDisplay) {
                        window.ToolsTabManager.updateDisplay();
                    }
                }, 50);
            }

            // Jouer le son de changement d'onglet
            // Son supprimé

            // console.log(`🔧 TabManager: Basculement vers l'onglet: ${tabId} ${tabId === 'biblio' ? '(sélection manuelle)' : ''}`);
        } else {
            // console.warn(`🔧 TabManager: Impossible de trouver l'onglet ou le contenu pour: ${tabId}`);
            // console.warn('newTab:', newTab);
            // console.warn('newContent:', newContent);
        }
    }

    // Méthode pour masquer toutes les aides contextuelles
    hideAllContextualHelp() {
        if (window.DEBUG_TAB_MANAGER) {
            console.log('🧹 TabManager: Masquage de toutes les aides contextuelles');
        }
        
        // Masquer l'aide outils (encadrements colorés)
        if (window.ToolsHelpSystem && window.ToolsHelpSystem.hideHelp) {
            window.ToolsHelpSystem.hideHelp();
        }
        
        // Masquer l'aide bibliothèque
        if (window.LibraryHelpSystem && window.LibraryHelpSystem.hideHelp) {
            window.LibraryHelpSystem.hideHelp();
        }
        
        // Masquer l'aide barre d'outils
        if (window.ToolbarHelpSystem && window.ToolbarHelpSystem.hideHelp) {
            window.ToolbarHelpSystem.hideHelp();
        }
        
        // Masquer les tooltips modernes si présents
        const modernTooltips = document.querySelectorAll('.modern-tooltip, .light-help-tooltip, .tools-highlight-box');
        modernTooltips.forEach(tooltip => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        });
        
        // Masquer les conteneurs d'aide
        const helpContainers = document.querySelectorAll('#tools-highlights-container, #library-highlights-container, #toolbar-help-tooltip');
        helpContainers.forEach(container => {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        });
    }

    // === GESTION DES SOUS-ONGLETS PRINCIPAUX DE BIBLIO ===
    setupMainSubTabs() {
        const mainSubTabs = document.querySelectorAll('.main-sub-tab');
        mainSubTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const mainSubtabId = tab.dataset.mainSubtab;
                this.switchMainSubTab(mainSubtabId);
            });
        });
    }

    switchMainSubTab(mainSubtabId) {
        if (this.currentMainSubTab === mainSubtabId) return;

        // Masquer toutes les aides contextuelles lors du changement de sous-onglet
        this.hideAllContextualHelp();

        // Masquer tous les contenus de sous-onglets principaux
        document.querySelectorAll('.main-subtab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Désactiver tous les sous-onglets principaux
        document.querySelectorAll('.main-sub-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Activer le nouveau sous-onglet principal et son contenu
        const newTab = document.querySelector(`[data-main-subtab="${mainSubtabId}"]`);
        const newContent = document.getElementById(`main-subtab-${mainSubtabId}`);

        if (newTab && newContent) {
            newTab.classList.add('active');
            newContent.classList.add('active');
            this.currentMainSubTab = mainSubtabId;

            // Si on passe aux éléments à réutiliser, on actualise la liste
            if (mainSubtabId === 'reutiliser') {
                this.refreshReusableElements();
            }

            // Supprimer les cadres d'aide de la bibliothèque lors du changement d'onglet
            this.clearLibraryHelpHighlights();

            // console.log(`Basculement vers le sous-onglet principal: ${mainSubtabId}`);
        }
    }

    // === GESTION DES SOUS-ONGLETS (BIBLIOTHÈQUE) ===
    setupSubTabs() {
        const subTabs = document.querySelectorAll('.sub-tab');
        subTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const subtabId = tab.dataset.subtab;
                this.switchSubTab(subtabId);
            });
        });
    }

    switchSubTab(subtabId) {
        if (this.currentSubTab === subtabId) return;

        // Masquer tous les contenus de sous-onglets
        document.querySelectorAll('.subtab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Désactiver tous les sous-onglets
        document.querySelectorAll('.sub-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Activer le nouveau sous-onglet et son contenu
        const newTab = document.querySelector(`[data-subtab="${subtabId}"]`);
        const newContent = document.getElementById(`subtab-${subtabId}`);

        if (newTab && newContent) {
            newTab.classList.add('active');
            newContent.classList.add('active');
            this.currentSubTab = subtabId;

            // Supprimer les cadres d'aide lors du changement de sous-onglet
            this.clearLibraryHelpHighlights();

            // console.log(`Basculement vers le sous-onglet: ${subtabId}`);
            
            // 🔧 CORRECTION: Synchroniser le mode ConstructionTools avec le sous-onglet
            // Mais préserver le mode GLB si un objet GLB est actuellement sélectionné
            if (window.ConstructionTools) {
                // Ne pas changer le mode si un GLB est sélectionné et actif
                if (window.tempGLBInfo && window.tempGLBInfo.element) {
                    console.log('🎯 Préservation du mode GLB actuel');
                    return; // Préserver le mode GLB
                }
                
                // Procéder normalement avec le changement de mode
                if (subtabId === 'briques') {
                                        window.ConstructionTools.setMode('brick');
                } else if (subtabId === 'blocs') {
                                        window.ConstructionTools.setMode('block');
                } else if (subtabId === 'isolants') {
                                        window.ConstructionTools.setMode('insulation');
                } else if (subtabId === 'linteaux') {
                                        window.ConstructionTools.setMode('linteau');
                }
            }
        }
    }

    // === GESTION DES ÉLÉMENTS DE BIBLIOTHÈQUE ===
    setupLibraryItems() {
        const libraryItems = document.querySelectorAll('.library-item');
        libraryItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Ignorer le clic s'il vient d'un bouton de coupe
                if (e.target.classList.contains('cut-btn-mini')) {
                    // console.log(`🚫 TabManager: Clic ignoré car vient d'un bouton cut-btn-mini`);
                    return;
                }
                
                // Ignorer si le clic vient d'un enfant d'un bouton de coupe
                if (e.target.closest('.cut-btn-mini')) {
                    // console.log(`🚫 TabManager: Clic ignoré car vient d'un enfant de bouton cut-btn-mini`);
                    return;
                }
                
                // NOUVEAU: Ignorer si le clic vient des boutons GLB
                if (e.target.classList.contains('btn-import-glb') || 
                    e.target.classList.contains('btn-preview-glb') ||
                    e.target.closest('.btn-import-glb') ||
                    e.target.closest('.btn-preview-glb')) {
                    console.log(`🚫 TabManager: Clic ignoré car vient d'un bouton GLB`);
                    return;
                }
                
                const itemType = item.dataset.type;
                // console.log(`📚 TabManager: Clic sur library-item: ${itemType}`);
                this.selectLibraryItem(itemType, item);
            });
        });

        // Gestion des boutons d'import GLB avec délégation d'événements
        const importButtons = document.querySelectorAll('.btn-import-glb');
        
        // Utiliser la délégation d'événements sur le document pour capturer les clics
        const self = this;
        document.addEventListener('click', function(e) {
            // Vérifier si le clic est sur un bouton GLB ou un de ses enfants
            const glbButton = e.target.closest('.btn-import-glb') || e.target.closest('.btn-preview-glb');
            
            if (glbButton) {
                console.log(`🔥 DEBUG: Clic détecté sur bouton GLB via délégation!`, glbButton);
                
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                if (glbButton.classList.contains('btn-import-glb')) {
                    const glbPath = glbButton.dataset.glbPath;
                    const glbName = glbButton.dataset.glbName || 'Modèle GLB';
                    console.log(`📦 Import GLB depuis bibliothèque: ${glbPath}`);
                    
                    // DÉSACTIVÉ: Ne plus activer automatiquement l'onglet Outils lors de l'import GLB
                    // pour rester dans l'onglet bibliothèque
                    // console.log('🔧 TabManager: Activation onglet Outils (import GLB)');
                    // self.activateToolsTab();
                    
                    self.importGLBFromLibrary(glbPath, glbName);
                } else if (glbButton.classList.contains('btn-preview-glb')) {
                    const glbPath = glbButton.dataset.glbPath;
                    console.log(`👁️ Aperçu GLB: ${glbPath}`);
                    
                    // DÉSACTIVÉ: Ne plus activer automatiquement l'onglet Outils lors de l'aperçu GLB
                    // pour rester dans l'onglet bibliothèque
                    // console.log('🔧 TabManager: Activation onglet Outils (aperçu GLB)');
                    // self.activateToolsTab();
                    
                    self.previewGLBFromLibrary(glbPath);
                }
            }
        });
        
        // Garder aussi l'ancienne méthode comme fallback
        importButtons.forEach(button => {
            console.log(`🔍 DEBUG: Configuration événement pour bouton:`, button.dataset);
            button.addEventListener('click', (e) => {
                console.log(`🔥 DEBUG: Clic détecté sur bouton import GLB (méthode directe)!`, e.target);
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                const glbPath = button.dataset.glbPath;
                const glbName = button.dataset.glbName || 'Modèle GLB';
                console.log(`📦 Import GLB depuis bibliothèque: ${glbPath}`);
                
                // DÉSACTIVÉ: Ne plus activer automatiquement l'onglet Outils lors de l'import GLB (fallback)
                // pour rester dans l'onglet bibliothèque
                // console.log('🔧 TabManager: Activation onglet Outils (import GLB fallback)');
                // this.activateToolsTab();
                
                this.importGLBFromLibrary(glbPath, glbName);
            });
        });

        // Gestion des boutons d'aperçu GLB
        document.querySelectorAll('.btn-preview-glb').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // Empêcher le clic sur le library-item parent
                const glbPath = button.dataset.glbPath;
                console.log(`👁️ Aperçu GLB: ${glbPath}`);
                
                // DÉSACTIVÉ: Ne plus activer automatiquement l'onglet Outils lors de l'aperçu GLB
                // pour rester dans l'onglet bibliothèque
                // console.log('🔧 TabManager: Activation onglet Outils (aperçu GLB)');
                // this.activateToolsTab();
                
                this.previewGLBFromLibrary(glbPath);
            });
        });
    }

    // Méthode pour réinitialiser les événements de bibliothèque (après ajout dynamique d'éléments)
    reinitializeLibraryEvents() {
        this.setupLibraryItems();
    }

    selectLibraryItem(itemType, itemElement) {
        // Éviter les re-sélections inutiles du même élément
        if (this.selectedLibraryItem === itemType && itemElement && itemElement.classList.contains('selected')) {
            if (window.DEBUG_TAB_MANAGER) {
                console.log('🔄 TabManager: Même élément déjà sélectionné, pas de re-traitement');
            }
            return;
        }
        
        if (window.DEBUG_TAB_MANAGER) {
            console.log('🎯 TabManager: selectLibraryItem appelée avec itemType =', itemType, 'itemElement =', itemElement);
        }
        
        // Retirer la sélection précédente
        document.querySelectorAll('.library-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Sélectionner le nouvel élément seulement s'il existe
        if (itemElement && itemElement.classList) {
            itemElement.classList.add('selected');
        }
        this.selectedLibraryItem = itemType;
        
        // console.log(`📚 TabManager: selectedLibraryItem défini à: ${itemType}`);

        // 🔧 CORRECTION: Nettoyer tempGLBInfo sauf pour les éléments GLB purs
        // Distinction importante :
        // - Briques coupées (M65_HALF, M50_1Q) → NETTOIENT le mode GLB
        // - Éléments GLB (hourdis_, poutrelle_) → MAINTIENNENT le mode GLB
        if (window.tempGLBInfo) {
            let shouldMaintainGLB = false;
            let debugInfo = { itemType: itemType, hasBrickSelector: !!window.BrickSelector };
            
            // Méthode 1: Vérifier via BrickSelector.brickTypes
            if (window.BrickSelector && window.BrickSelector.brickTypes && window.BrickSelector.brickTypes[itemType]) {
                const elementCategory = window.BrickSelector.brickTypes[itemType].category;
                // SEULS les éléments GLB (category: 'glb') maintiennent le mode GLB
                // Les briques coupées (category: 'cut') nettoient le mode GLB
                shouldMaintainGLB = (elementCategory === 'glb');
                debugInfo.method = 'BrickSelector';
                debugInfo.category = elementCategory;
            }
            // Méthode 2: Vérification par pattern de nom (fallback)
            else if (itemType) {
                // SEULS les patterns GLB maintiennent le mode GLB
                const glbPatterns = ['hourdis_', 'poutrelle_'];
                shouldMaintainGLB = glbPatterns.some(pattern => itemType.includes(pattern));
                debugInfo.method = 'pattern';
                debugInfo.matchedGLBPattern = glbPatterns.find(pattern => itemType.includes(pattern)) || 'none';
            }
            
            debugInfo.shouldMaintainGLB = shouldMaintainGLB;
            
            if (shouldMaintainGLB) {
                // Maintien tempGLBInfo pour élément GLB
            } else {
                // 🧹 Nettoyage complet du mode GLB
                if (window.ConstructionTools && window.ConstructionTools.clearGLBMode) {
                    window.ConstructionTools.clearGLBMode();
                } else {
                    // Fallback si ConstructionTools pas disponible
                    window.tempGLBInfo = null;
                    if (window.GLBDpadController) {
                        window.GLBDpadController.showForObjectType(false);
                    }
                }
                
                // 🎮 Adapter le D-pad au lieu de le masquer complètement
                if (window.GLBDpadController) {
                    window.GLBDpadController.showForObjectType(false); // false = forme basique sans boutons Y
                }
                
                // Double vérification - forcer le refresh du mode construction
                if (window.ConstructionTools && window.ConstructionTools.setMode) {
                    window.ConstructionTools.setMode('brick');
                }
            }
        }

        // NOUVEAU: Déclencher un événement personnalisé pour la sélection de bibliothèque
        document.dispatchEvent(new CustomEvent('libraryItemSelected', {
            detail: {
                itemType: itemType,
                itemElement: itemElement,
                subTab: this.currentSubTab
            }
        }));

        // Synchroniser avec les sélecteurs appropriés selon le type
        this.syncWithSelectors(itemType, itemElement);

        // NOUVEAU: Pour les éléments GLB (hourdis), sélectionner automatiquement la longueur par défaut
        if (itemElement && (itemType.includes('hourdis') || (window.BrickSelector?.brickTypes?.[itemType]?.category === 'glb'))) {
            if (window.DEBUG_TAB_MANAGER) {
                console.log('🔧 TabManager: Élément GLB détecté, sélection automatique de la longueur par défaut');
                console.log('🔧 TabManager: itemType =', itemType);
                console.log('🔧 TabManager: itemElement =', itemElement);
            }
            
            // Vérifier si l'élément a des boutons de coupe (hourdis, poutrains)
            const defaultLengthButton = itemElement.querySelector('.cut-btn-mini[data-cut="100"]');
            if (window.DEBUG_TAB_MANAGER) {
                console.log('🔧 TabManager: defaultLengthButton =', defaultLengthButton);
            }
            
            if (defaultLengthButton) {
                if (window.DEBUG_TAB_MANAGER) {
                    console.log('🔧 TabManager: Clic automatique sur bouton 100cm');
                }
                // Déclencher le clic sur le bouton par défaut avec un léger délai
                setTimeout(() => {
                    if (window.DEBUG_TAB_MANAGER) {
                        console.log('🔧 TabManager: Exécution du clic sur bouton 100cm');
                    }
                    defaultLengthButton.click();
                    if (window.DEBUG_TAB_MANAGER) {
                        console.log('🔧 TabManager: Clic exécuté sur bouton 100cm');
                    }
                }, 50);
            } else {
                // Élément GLB sans boutons de coupe (comme le claveau)
                if (window.DEBUG_TAB_MANAGER) {
                    console.log('🔧 TabManager: Élément GLB sans boutons de coupe, création directe de tempGLBInfo');
                }
                
                // Empêcher le placement immédiat dès maintenant
                window.preventImmediatePlacement = true;
                
                const glbData = window.BrickSelector?.brickTypes?.[itemType];
                if (glbData) {
                    window.tempGLBInfo = {
                        type: itemType,
                        path: glbData.glbPath,
                        name: glbData.name,
                        dimensions: {
                            length: glbData.length,
                            width: glbData.width,
                            height: glbData.height
                        },
                        scale: {
                            x: 1,
                            y: 1,
                            z: 1
                        },
                        lengthValue: glbData.length.toString()
                    };
                    
                    // Activer le mode construction avec fantôme GLB
                    if (window.ConstructionTools) {
                        if (window.DEBUG_TAB_MANAGER) {
                            console.log('🔧 TabManager: Activation du mode construction pour claveau');
                        }
                        
                        // Empêcher le placement immédiat
                        window.preventImmediatePlacement = true;
                        
                        // NE PAS appeler setMode pour éviter le placement automatique
                        // window.ConstructionTools.setMode('brick');
                        
                        // Forcer directement la création du fantôme GLB
                        setTimeout(() => {
                            if (window.ConstructionTools.createGhostElement) {
                                if (window.DEBUG_TAB_MANAGER) {
                                    console.log('🔧 TabManager: Création du fantôme GLB pour claveau');
                                }
                                window.ConstructionTools.createGhostElement();
                                
                                // Autoriser le placement après un délai
                                setTimeout(() => {
                                    if (window.DEBUG_TAB_MANAGER) {
                                        console.log('🔧 TabManager: Fantôme GLB prêt pour le placement');
                                    }
                                    window.preventImmediatePlacement = false;
                                }, 500); // Délai pour que l'utilisateur voie le fantôme
                            }
                        }, 200); // Délai plus long pour éviter le placement immédiat
                    }
                }
                
                if (window.DEBUG_TAB_MANAGER) {
                    console.log('⚠️ TabManager: Bouton 100cm non trouvé pour', itemType);
                    console.log('⚠️ TabManager: Buttons trouvés:', itemElement.querySelectorAll('.cut-btn-mini'));
                }
            }
        }

        // Animation de sélection seulement si l'élément existe
        if (itemElement && itemElement.style) {
            itemElement.style.transform = 'scale(0.95)';
            setTimeout(() => {
                if (itemElement && itemElement.style) {
                    itemElement.style.transform = '';
                }
            }, 150);
        }

        // DÉSACTIVÉ: Ne plus activer automatiquement l'onglet Outils quand on sélectionne un élément
        // pour rester dans l'onglet bibliothèque lors de la sélection
        // if (window.DEBUG_TAB_MANAGER) {
        //     console.log('🔧 TabManager: Activation automatique de l\'onglet Outils');
        // }
        // this.activateToolsTab();

        // console.log(`Élément de bibliothèque sélectionné: ${itemType}`);
    }

    // === GESTION DES BOUTONS DE COUPE ===
    setupCutButtons() {
        const cutButtons = document.querySelectorAll('.cut-btn');
        cutButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const cutType = button.dataset.cut;
                this.selectCutType(cutType, button);
            });
        });
    }

    selectCutType(cutType, buttonElement) {
        // Retirer la sélection précédente
        document.querySelectorAll('.cut-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Sélectionner le nouveau type de coupe
        buttonElement.classList.add('active');
        this.selectedCutType = cutType;

        // Appliquer la coupe si un élément est sélectionné
        if (this.selectedLibraryItem) {
            this.applyCutToSelectedItem(cutType);
        }

        // console.log(`Type de coupe sélectionné: ${cutType}`);
    }

    applyCutToSelectedItem(cutType) {
        if (!this.selectedLibraryItem) return;

        let finalType = this.selectedLibraryItem;

        if (cutType !== 'CUSTOM') {
            // Construire le type avec le suffixe de coupe
            const suffixes = {
                '3Q': '_3Q',
                'HALF': '_HALF',
                '1Q': '_1Q'
            };

            if (suffixes[cutType]) {
                finalType = this.selectedLibraryItem + suffixes[cutType];
            }
        }

        // Synchroniser avec le bon sélecteur
        if (this.currentSubTab === 'briques' && window.BrickSelector) {
            if (cutType === 'CUSTOM') {
                // Ouvrir la modale de coupe personnalisée
                const brickSelector = window.BrickSelector;
                if (brickSelector.showCustomCutModal) {
                    brickSelector.showCustomCutModal(this.selectedLibraryItem);
                }
            } else {
                window.BrickSelector.setBrick(finalType);
            }
        } else if (this.currentSubTab === 'blocs' && window.BlockSelector) {
            window.BlockSelector.setBlock(finalType);
        }

        // console.log(`Coupe appliquée: ${this.selectedLibraryItem} -> ${finalType}`);
    }

    // === GESTION DES BOUTONS DE COUPE MINI ===
    setupCutButtonsMini() {
        const cutButtonsMini = document.querySelectorAll('.cut-btn-mini');
        if (window.DEBUG_MODE) console.log(`🔍 TabManager: ${cutButtonsMini.length} boutons cut-btn-mini trouvés`);
        
        if (cutButtonsMini.length === 0) {
            if (window.DEBUG_MODE) console.warn('⚠️ TabManager: Aucun bouton cut-btn-mini trouvé, retry dans 500ms...');
            setTimeout(() => this.setupCutButtonsMini(), 500);
            return;
        }
        
        cutButtonsMini.forEach((button, index) => {
            // Calculer et afficher la longueur sur le bouton au chargement
            this.updateButtonTooltip(button);
            
            // Supprimer les anciens event listeners s'ils existent
            button.removeEventListener('click', button._cutButtonHandler);
            
            // Créer et stocker le handler avec optimisation
            button._cutButtonHandler = (e) => {
                e.stopPropagation(); // Empêcher la propagation vers le library-item parent
                e.preventDefault(); // Empêcher l'action par défaut
                
                const cutType = button.dataset.cut;
                const baseType = button.dataset.baseType;
                
                // Utiliser une micro-tâche pour éviter les violations de performance
                Promise.resolve().then(() => {
                    this.selectCutTypeMini(cutType, baseType, button);
                });
            };
            
            button.addEventListener('click', button._cutButtonHandler);
            
            // Test de vérification
            // // console.log(`✅ TabManager: Bouton ${index + 1} configuré - ${button.dataset.cut} (${button.dataset.baseType}) - Handler attaché: ${!!button._cutButtonHandler}`);
        });
        
        // // console.log(`✅ TabManager: ${cutButtonsMini.length} boutons cut-btn-mini configurés avec succès`);
    }

    updateButtonTooltip(button) {
        const cutType = button.dataset.cut;
        const baseType = button.dataset.baseType;
        
        if (cutType === 'P') {
            button.setAttribute('data-length', 'Personnalisée');
            return;
        }

        const cutDimensions = this.calculateCutDimensions(baseType, cutType);
        if (cutDimensions.length > 0) {
            button.setAttribute('data-length', `${cutDimensions.length}cm`);
                        if (window.DEBUG_MODE) console.log(`🏷️ TabManager: Tooltip mis à jour pour ${type} ${cutFraction}: ${resultLength}cm`);
        }
    }

    selectCutTypeMini(cutType, baseType, buttonElement) {
        // // // // console.log(`🎯 TabManager: selectCutTypeMini démarré - ${cutType} pour ${baseType}`);
        
        // Récupérer l'item parent pour l'utiliser plus tard
        const parentItem = buttonElement.closest('.library-item');
        
        // ✅ UTILISER LE GESTIONNAIRE CENTRALISÉ pour éviter les boutons actifs simultanés
        if (window.CutButtonManager) {
            window.CutButtonManager.activateCutButton(buttonElement, baseType, cutType);
        } else {
            // Fallback si le gestionnaire centralisé n'est pas disponible
            const allButtonsForBaseType = document.querySelectorAll(`.cut-btn-mini[data-base-type="${baseType}"]`);
            allButtonsForBaseType.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Méthode de sécurité: retirer aussi de l'item parent s'il existe
            if (parentItem) {
                parentItem.querySelectorAll('.cut-btn-mini').forEach(btn => {
                    btn.classList.remove('active');
                });
            }

            // Sélectionner le nouveau bouton
            buttonElement.classList.add('active');
        }
        // // console.log(`✅ TabManager: Bouton ${cutType} activé`);

        // Construire le type final selon la coupe sélectionnée
        let finalType = baseType;
        
        // Vérifier si c'est un élément GLB
        const isGLBElement = parentItem && (
            parentItem.hasAttribute('data-glb-path') || 
            parentItem.querySelector('canvas[data-glb-path]')
        );
        
        if (isGLBElement) {
            this.handleGLBImportWithLength(parentItem, cutType, baseType);
            return;
        }
        
        if (cutType === 'P') {
            // Pour la coupe personnalisée, ouvrir un modal de saisie
            this.openCustomCutModal(baseType, buttonElement);
            return; // Arrêter ici, la suite sera gérée après la saisie utilisateur
        } else if (cutType !== '1/1') {
            const suffixes = {
                '3/4': '_3Q',
                '1/2': '_HALF',
                '1/4': '_1Q'
            };

            if (suffixes[cutType]) {
                finalType = baseType + suffixes[cutType];
            }
        }
        
        // // console.log(`🔧 TabManager: Type final construit - ${baseType} → ${finalType}`);

        // Calculer et afficher les dimensions de coupe
        const cutDimensions = this.calculateCutDimensions(baseType, cutType);
        // // console.log(`📏 TabManager: Dimensions calculées - ${cutDimensions.length}×${cutDimensions.width}×${cutDimensions.height}cm`);

        // Synchroniser avec les sélecteurs appropriés selon le type
        // console.log(`🔗 TabManager: Début de la synchronisation avec les sélecteurs...`);
        this.syncCutWithSelectors(finalType, cutType, baseType, cutDimensions);

        // Aussi sélectionner l'élément de bibliothèque parent
        // console.log(`📚 TabManager: Sélection de l'élément de bibliothèque parent...`);
        
        // 🔧 NOUVEAU: Mémoriser la sélection de coupe pour éviter qu'elle soit écrasée
        window.lastCutSelection = {
            finalType: finalType,
            cutType: cutType,
            baseType: baseType,
            timestamp: Date.now()
        };
        // console.log('💾 TabManager: Sélection de coupe mémorisée:', window.lastCutSelection);
        
        this.selectLibraryItem(finalType, parentItem);

        // NOUVEAU: Déclencher un événement spécifique pour les boutons de coupe
        document.dispatchEvent(new CustomEvent('libraryCutButtonSelected', {
            detail: {
                finalType: finalType,
                cutType: cutType,
                baseType: baseType,
                dimensions: cutDimensions,
                subTab: this.currentSubTab,
                buttonElement: buttonElement
            }
        }));

        // // console.log(`✅ TabManager: Coupe mini sélectionnée terminée - ${baseType} → ${finalType} (${cutType}) - Longueur: ${cutDimensions.length}cm`);
    }

    calculateCutDimensions(baseType, cutType) {
        if (window.DEBUG_MODE) console.log(`📐 TabManager: Calcul des dimensions pour ${baseType} (${cutType})`);
        
        // Obtenir les dimensions de base depuis les sélecteurs
        let baseDimensions = null;
        
        // Essayer d'abord avec BrickSelector
        if (window.BrickSelector && window.BrickSelector.brickTypes && window.BrickSelector.brickTypes[baseType]) {
            baseDimensions = window.BrickSelector.brickTypes[baseType];
            if (window.DEBUG_MODE) console.log(`🧱 TabManager: Dimensions trouvées dans BrickSelector - ${JSON.stringify(baseDimensions)}`);
        }
        // Puis avec BlockSelector
        else if (window.BlockSelector && window.BlockSelector.blockTypes && window.BlockSelector.blockTypes[baseType]) {
            baseDimensions = window.BlockSelector.blockTypes[baseType];
            if (window.DEBUG_MODE) console.log(`🏗️ TabManager: Dimensions trouvées dans BlockSelector - ${JSON.stringify(baseDimensions)}`);
        }
        // Puis avec InsulationSelector
        else if (window.InsulationSelector && window.InsulationSelector.insulationTypes && window.InsulationSelector.insulationTypes[baseType]) {
            baseDimensions = window.InsulationSelector.insulationTypes[baseType];
            if (window.DEBUG_MODE) console.log(`🟡 TabManager: Dimensions trouvées dans InsulationSelector - ${JSON.stringify(baseDimensions)}`);
        }
        // Enfin avec LinteauSelector
        else if (window.LinteauSelector) {
            const linteauData = window.LinteauSelector.getLinteauData();
            if (linteauData && linteauData[baseType]) {
                baseDimensions = linteauData[baseType];
                if (window.DEBUG_MODE) console.log(`🏗️ TabManager: Dimensions trouvées dans LinteauSelector - ${JSON.stringify(baseDimensions)}`);
            }
        }

        if (!baseDimensions) {
            // console.warn(`❌ TabManager: Dimensions non trouvées pour ${baseType}`);
            // console.log(`🔍 TabManager: BrickSelector disponible: ${!!window.BrickSelector}`);
            // console.log(`🔍 TabManager: BlockSelector disponible: ${!!window.BlockSelector}`);
            // console.log(`🔍 TabManager: InsulationSelector disponible: ${!!window.InsulationSelector}`);
            // console.log(`🔍 TabManager: LinteauSelector disponible: ${!!window.LinteauSelector}`);
            if (window.BrickSelector) {
                // console.log(`🔍 TabManager: Types de briques disponibles:`, Object.keys(window.BrickSelector.brickTypes || {}));
            }
            if (window.InsulationSelector) {
                // console.log(`🔍 TabManager: Types d'isolants disponibles:`, Object.keys(window.InsulationSelector.insulationTypes || {}));
            }
            if (window.LinteauSelector) {
                // console.log(`🔍 TabManager: Types de linteaux disponibles:`, Object.keys(window.LinteauSelector.getLinteauData() || {}));
            }
            return { length: 0, width: 0, height: 0 };
        }

        // Calculer la nouvelle longueur selon le type de coupe et le type d'élément
        let newLength = baseDimensions.length;
        
        if (cutType !== '1/1' && cutType !== 'P') {
            // Détecter le type d'élément pour appliquer les bonnes dimensions
            const isStandardBrick = ['M50', 'M57', 'M60', 'M65', 'M90', 'WF', 'WFD'].includes(baseType);
            const isM50Chant = baseType === 'M50_CHANT'; // Cas spécial pour M50 sur chant
            const isHollowBlock = baseType.startsWith('B') && !baseType.startsWith('BC') && !baseType.startsWith('BCA');
            const isInsulation = baseType.startsWith('PUR') || baseType.startsWith('LAINEROCHE');
            const isLinteau = baseType.startsWith('L') && ['L120', 'L140', 'L160', 'L180', 'L200'].includes(baseType);
            
            if (isM50Chant) {
                // === BRIQUE M50 SUR CHANT (5cm de base) ===
                switch (cutType) {
                    case '3/4':
                        newLength = 3.75; // 3/4 de 5cm = 3.75cm
                        break;
                    case '1/2':
                        newLength = 2.5; // 1/2 de 5cm = 2.5cm
                        break;
                    case '1/4':
                        newLength = 1.25; // 1/4 de 5cm = 1.25cm
                        break;
                }
                if (window.DEBUG_MODE) console.log(`🧱 TabManager: Coupe M50 sur chant ${cutType} - ${newLength}cm`);
            } else if (isStandardBrick) {
                // === BRIQUES STANDARDS (19cm de base) ===
                switch (cutType) {
                    case '3/4':
                        newLength = 14; // 3/4 de brique = 14cm
                        break;
                    case '1/2':
                        newLength = 9; // 1/2 de brique = 9cm
                        break;
                    case '1/4':
                        newLength = 4; // 1/4 de brique = 4cm
                        break;
                }
                if (window.DEBUG_MODE) console.log(`🧱 TabManager: Coupe brique standard ${cutType} - ${newLength}cm`);
            } else if (isHollowBlock) {
                // === BLOCS CREUX (39cm de base) ===
                switch (cutType) {
                    case '3/4':
                        newLength = 29; // 3/4 de bloc creux = 29cm
                        break;
                    case '1/2':
                        newLength = 19; // 1/2 de bloc creux = 19cm
                        break;
                    case '1/4':
                        newLength = 9; // 1/4 de bloc creux = 9cm
                        break;
                }
                if (window.DEBUG_MODE) console.log(`🏗️ TabManager: Coupe bloc creux ${cutType} - ${newLength}cm`);
            } else if (isInsulation) {
                // === ISOLANTS (calcul proportionnel pour 120cm de base) ===
                const baseLength = baseDimensions.length;
                switch (cutType) {
                    case '3/4':
                        newLength = Math.round(baseLength * 0.75 * 10) / 10; // 90cm pour 120cm de base
                        break;
                    case '1/2':
                        newLength = Math.round(baseLength * 0.5 * 10) / 10; // 60cm pour 120cm de base
                        break;
                    case '1/4':
                        newLength = Math.round(baseLength * 0.25 * 10) / 10; // 30cm pour 120cm de base
                        break;
                }
                if (window.DEBUG_MODE) console.log(`🟡 TabManager: Coupe isolant ${cutType} - ${baseLength} × ${cutType} = ${newLength}cm`);
            } else if (isLinteau) {
                // === LINTEAUX (calcul proportionnel selon longueur d'origine) ===
                const baseLength = baseDimensions.length;
                switch (cutType) {
                    case '3/4':
                        newLength = Math.round(baseLength * 0.75 * 10) / 10;
                        break;
                    case '1/2':
                        newLength = Math.round(baseLength * 0.5 * 10) / 10;
                        break;
                    case '1/4':
                        newLength = Math.round(baseLength * 0.25 * 10) / 10;
                        break;
                }
                if (window.DEBUG_MODE) console.log(`🏗️ TabManager: Coupe linteau ${cutType} - ${baseLength} × ${cutType} = ${newLength}cm`);
            } else {
                // === AUTRES BLOCS (calcul proportionnel exact) ===
                const baseLength = baseDimensions.length;
                switch (cutType) {
                    case '3/4':
                        newLength = Math.round(baseLength * 0.75 * 10) / 10;
                        break;
                    case '1/2':
                        newLength = Math.round(baseLength * 0.5 * 10) / 10;
                        break;
                    case '1/4':
                        newLength = Math.round(baseLength * 0.25 * 10) / 10;
                        break;
                }
                if (window.DEBUG_MODE) console.log(`🔸 TabManager: Coupe proportionnelle ${cutType} - ${baseLength} × ${cutType} = ${newLength}cm`);
            }
        } else {
            if (cutType === 'P') {
                // // console.log(`📏 TabManager: Coupe personnalisée - garder longueur d'origine`);
            } else {
                // // console.log(`📏 TabManager: Longueur complète - ${newLength}cm`);
            }
        }

        const result = {
            length: newLength,
            width: baseDimensions.width,
            height: baseDimensions.height,
            name: baseDimensions.name + (cutType !== '1/1' ? ` ${cutType}` : ''),
            cutType: cutType
        };
        
        // // console.log(`✅ TabManager: Calcul terminé - ${JSON.stringify(result)}`);
        return result;
    }

    openCustomCutModal(baseType, buttonElement) {
        // Obtenir les dimensions de base pour l'affichage
        const baseDimensions = this.calculateCutDimensions(baseType, '1/1');
        
        // Créer le modal de coupe personnalisée
        const modal = document.createElement('div');
        modal.className = 'modal custom-cut-modal tabmanager-dynamic-modal';
        modal.style.display = 'block';
        modal.setAttribute('data-source', 'tabmanager'); // Marquer la source
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Coupe Personnalisée - ${baseType}</h3>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p><strong>Dimensions originales :</strong> ${baseDimensions.length}×${baseDimensions.width}×${baseDimensions.height} cm</p>
                    
                    <div class="custom-cut-inputs">
                        <div class="input-group">
                            <label for="customCutLength">Longueur personnalisée (cm) :</label>
                            <input type="number" id="customCutLength" 
                                   min="1" max="${baseDimensions.length}" 
                                   value="${Math.round(baseDimensions.length * 0.85)}" 
                                   step="0.1">
                            <span class="unit">cm</span>
                        </div>
                        <div class="input-note">
                            <p>Largeur et hauteur restent inchangées : ${baseDimensions.width}×${baseDimensions.height} cm</p>
                            <p>Longueur max : ${baseDimensions.length} cm</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Annuler</button>
                    <button class="btn btn-primary" onclick="window.TabManager.applyCustomCut('${baseType}', this.closest('.modal'))">
                        Appliquer
                    </button>
                </div>
            </div>
        `;
        
        // Stocker des références pour utilisation ultérieure
        modal.baseType = baseType;
        modal.buttonElement = buttonElement;
        
        document.body.appendChild(modal);
        
        // Focus sur l'input de longueur
        const lengthInput = modal.querySelector('#customCutLength');
        if (lengthInput) {
            lengthInput.focus();
            lengthInput.select();
        }
        
        // console.log(`🎛️ Modal de coupe personnalisée ouvert pour ${baseType}`);
    }

    applyCustomCut(baseType, modal) {
        const lengthInput = modal.querySelector('#customCutLength');
        const customLength = parseFloat(lengthInput.value);
        const buttonElement = modal.buttonElement;
        
        // Validation
        const baseDimensions = this.calculateCutDimensions(baseType, '1/1');
        if (customLength <= 0 || customLength > baseDimensions.length) {
            alert(`La longueur doit être comprise entre 0.1 et ${baseDimensions.length} cm.`);
            return;
        }
        
        // Créer un suffixe personnalisé avec la longueur
        const customSuffix = `_CUSTOM_${customLength.toString().replace('.', '_')}`;
        const finalType = baseType + customSuffix;
        
        // console.log(`🎯 Coupe personnalisée appliquée : ${baseType} → ${finalType} (${customLength}cm)`);
        
        // Créer les dimensions personnalisées
        const customDimensions = {
            length: customLength,
            width: baseDimensions.width,
            height: baseDimensions.height,
            name: `${baseDimensions.name} (${customLength}cm)`,
            cutType: 'P',
            customLength: customLength
        };
        
        // Synchroniser avec les sélecteurs
        this.syncCutWithSelectors(finalType, 'P', baseType, customDimensions);
        
        // Sélectionner l'élément de bibliothèque parent
        const parentItem = buttonElement.closest('.library-item');
        this.selectLibraryItem(finalType, parentItem);
        
        // Fermer le modal
        modal.remove();
        
        // console.log(`✅ Coupe personnalisée ${customLength}cm appliquée avec succès`);
    }

    syncCutWithSelectors(finalType, cutType, baseType, cutDimensions) {
        // Déterminer le sous-onglet basé sur le type de base
        let targetSubTab = 'briques';
        let targetMode = 'brick';
        
        if (baseType.startsWith('B') && !baseType.startsWith('BC') && !baseType.startsWith('BCA')) {
            targetSubTab = 'blocs';
            targetMode = 'block';
        } else if (baseType.startsWith('BC') || baseType.startsWith('BCA') || baseType.startsWith('TC') || baseType.startsWith('ARGEX')) {
            targetSubTab = 'blocs';
            targetMode = 'block';
        } else if (baseType.startsWith('PUR') || baseType.startsWith('LAINEROCHE')) {
            targetSubTab = 'isolants';
            targetMode = 'insulation';
        } else if (baseType.startsWith('L') && ['L120', 'L140', 'L160', 'L180', 'L200'].includes(baseType)) {
            targetSubTab = 'linteaux';
            targetMode = 'linteau';
        }

        // Activer le bon mode de construction d'abord
        if (window.UIController) {
            if (window.DEBUG_MODE) console.log(`🔧 Activation du mode ${targetMode} pour ${finalType}`);
            window.UIController.setConstructionMode(targetMode, true);
        }

        // Synchroniser avec le bon sélecteur
        if (targetSubTab === 'briques' && window.BrickSelector) {
            if (cutType === 'P') {
                // ✅ CORRECTION: Appliquer directement les dimensions personnalisées
                // console.log(`🧱 Application directe de coupe personnalisée brique: ${finalType}`);
                window.BrickSelector.setBrick(finalType, cutDimensions);
                // Mettre à jour l'affichage des dimensions
                this.updateDisplayedDimensions('brick', cutDimensions);
            } else {
                // console.log(`🧱 Sélection de la brique: ${finalType}`);
                window.BrickSelector.setBrick(finalType);
                // Mettre à jour l'affichage des dimensions
                this.updateDisplayedDimensions('brick', cutDimensions);
            }
        } else if (targetSubTab === 'blocs' && window.BlockSelector) {
            if (cutType === 'P') {
                // ✅ CORRECTION: Appliquer directement les dimensions personnalisées
                // console.log(`🏗️ Application directe de coupe personnalisée bloc: ${finalType}`);
                window.BlockSelector.setBlock(finalType, cutDimensions);
                // Mettre à jour l'affichage des dimensions
                this.updateDisplayedDimensions('block', cutDimensions);
            } else {
                if (window.DEBUG_MODE) console.log(`🏗️ Sélection du bloc: ${finalType}`);
                window.BlockSelector.setBlock(finalType);
                // Mettre à jour l'affichage des dimensions
                this.updateDisplayedDimensions('block', cutDimensions);
            }
        } else if (targetSubTab === 'isolants' && window.InsulationSelector) {
            if (cutType === 'P') {
                // Pour l'isolant, on pourrait gérer la coupe personnalisée si nécessaire
                if (window.DEBUG_MODE) console.log(`🟡 Coupe personnalisée isolant: ${baseType}`);
                // Pas de modale spéciale pour les isolants pour le moment
                window.InsulationSelector.setInsulation(baseType);
                this.updateDisplayedDimensions('insulation', cutDimensions);
            } else {
                if (window.DEBUG_MODE) console.log(`🟡 Sélection de l'isolant: ${finalType}`);
                window.InsulationSelector.setInsulation(baseType);
                // Mettre à jour l'affichage des dimensions
                this.updateDisplayedDimensions('insulation', cutDimensions);
            }
        } else if (targetSubTab === 'linteaux' && window.LinteauSelector) {
            if (cutType === 'P') {
                // Pour le linteau, on pourrait gérer la coupe personnalisée si nécessaire
                if (window.DEBUG_MODE) console.log(`🏗️ Coupe personnalisée linteau: ${baseType}`);
                // Pas de modale spéciale pour les linteaux pour le moment
                window.LinteauSelector.selectStandardLinteau(baseType);
                this.updateDisplayedDimensions('linteau', cutDimensions);
            } else {
                if (window.DEBUG_MODE) console.log(`🏗️ Sélection du linteau: ${finalType}`);
                window.LinteauSelector.selectStandardLinteau(baseType);
                // Mettre à jour l'affichage des dimensions
                this.updateDisplayedDimensions('linteau', cutDimensions);
            }
        }

        // S'assurer que l'élément fantôme est mis à jour
        setTimeout(() => {
            if (window.ConstructionTools) {
                window.ConstructionTools.createGhostElement();
                // console.log(`👻 Fantôme mis à jour avec ${finalType} (${cutDimensions.length}×${cutDimensions.width}×${cutDimensions.height}cm)`);
            }
        }, 100);
    }

    updateDisplayedDimensions(elementType, dimensions) {
        // Mettre à jour l'affichage dans l'onglet Assise selon le type d'élément
        if (elementType === 'brick') {
            const brickDisplay = document.getElementById('currentBrickDisplay');
            if (brickDisplay) {
                const nameElement = brickDisplay.querySelector('.brick-name');
                const dimensionsElement = brickDisplay.querySelector('.brick-dimensions');
                const typeElement = brickDisplay.querySelector('.brick-type');
                
                if (nameElement) nameElement.textContent = dimensions.name;
                if (dimensionsElement) dimensionsElement.textContent = `${dimensions.length}×${dimensions.height}×${dimensions.width} cm`;
                if (typeElement) typeElement.textContent = dimensions.cutType === '1/1' ? 'Entière' : `Coupée ${dimensions.cutType}`;
            }
        } else if (elementType === 'block') {
            const blockDisplay = document.getElementById('currentBlockDisplay');
            if (blockDisplay) {
                const nameElement = blockDisplay.querySelector('.block-name');
                const dimensionsElement = blockDisplay.querySelector('.block-dimensions');
                const typeElement = blockDisplay.querySelector('.block-type');
                
                if (nameElement) nameElement.textContent = dimensions.name;
                if (dimensionsElement) dimensionsElement.textContent = `${dimensions.length}×${dimensions.width}×${dimensions.height} cm`;
                if (typeElement) typeElement.textContent = dimensions.cutType === '1/1' ? 'Entier' : `Coupé ${dimensions.cutType}`;
            }
        } else if (elementType === 'insulation') {
            const insulationDisplay = document.getElementById('currentInsulationDisplay');
            if (insulationDisplay) {
                const nameElement = insulationDisplay.querySelector('.insulation-name');
                const dimensionsElement = insulationDisplay.querySelector('.insulation-dimensions');
                const typeElement = insulationDisplay.querySelector('.insulation-type');
                
                if (nameElement) nameElement.textContent = dimensions.name;
                if (dimensionsElement) dimensionsElement.textContent = `${dimensions.length}×${dimensions.width}×${dimensions.height} cm`;
                if (typeElement) typeElement.textContent = dimensions.cutType === '1/1' ? 'Entier' : `Coupé ${dimensions.cutType}`;
            }
        } else if (elementType === 'linteau') {
            const linteauDisplay = document.getElementById('currentLinteauDisplay');
            if (linteauDisplay) {
                const nameElement = linteauDisplay.querySelector('.linteau-name');
                const dimensionsElement = linteauDisplay.querySelector('.linteau-dimensions');
                const typeElement = linteauDisplay.querySelector('.linteau-type');
                
                if (nameElement) nameElement.textContent = dimensions.name;
                if (dimensionsElement) dimensionsElement.textContent = `${dimensions.length}×${dimensions.width}×${dimensions.height} cm`;
                if (typeElement) typeElement.textContent = dimensions.cutType === '1/1' ? 'Entier' : `Coupé ${dimensions.cutType}`;
            }
        }

        // Afficher un message informatif dans la console avec les dimensions exactes
        // // console.log(`📏 Dimensions sélectionnées: ${dimensions.length}×${dimensions.width}×${dimensions.height} cm (${dimensions.cutType})`);
        
        // Afficher une notification temporaire
        this.showCutNotification(dimensions);
    }

    showCutNotification(dimensions) {
        // Créer ou mettre à jour la notification
        let notification = document.getElementById('cut-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'cut-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                font-size: 14px;
                font-weight: 500;
                z-index: 10000;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                pointer-events: none;
            `;
            document.body.appendChild(notification);
        }

        // Mettre à jour le contenu
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">📏</span>
                <div>
                    <div style="font-weight: bold;">${dimensions.name}</div>
                    <div style="font-size: 12px; opacity: 0.9;">Longueur: ${dimensions.length}cm (${dimensions.cutType})</div>
                </div>
            </div>
        `;

        // Animer l'apparition
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Faire disparaître après 3 secondes
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
        }, 3000);
    }

    // === GESTION DES TEXTURES ===
    setupTextureItems() {
        const textureItems = document.querySelectorAll('.texture-item');
        textureItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const textureType = item.dataset.texture;
                this.selectTexture(textureType, item);
            });
        });
    }

    selectTexture(textureType, itemElement) {
        // Retirer la sélection précédente
        document.querySelectorAll('.texture-item').forEach(item => {
            item.classList.remove('active');
        });

        // Sélectionner la nouvelle texture
        itemElement.classList.add('active');

        // Synchroniser avec le sélecteur de matériaux
        const materialSelect = document.getElementById('materialSelect');
        if (materialSelect) {
            materialSelect.value = textureType;
            
            // Déclencher l'événement change
            const changeEvent = new Event('change', { bubbles: true });
            materialSelect.dispatchEvent(changeEvent);
        }

        // console.log(`Texture sélectionnée: ${textureType}`);
    }

    // === SYNCHRONISATION AVEC LES SÉLECTEURS EXISTANTS ===
    setupSynchronization() {
        // Écouter les changements des sélecteurs existants pour maintenir la synchronisation
        
        // Synchronisation avec BrickSelector
        document.addEventListener('brickTypeChanged', (event) => {
            this.syncLibraryWithBrickType(event.detail.newType);
        });

        // Synchronisation avec le sélecteur de matériaux
        const materialSelect = document.getElementById('materialSelect');
        if (materialSelect) {
            materialSelect.addEventListener('change', (e) => {
                this.syncTextureWithMaterial(e.target.value);
            });
        }

        // Synchronisation avec les modes de construction
        document.addEventListener('constructionModeChanged', (event) => {
            this.syncTabWithMode(event.detail.mode);
        });
    }

    syncWithSelectors(itemType, itemElement = null) {
        // console.log(`🔄 TabManager: syncWithSelectors appelée avec itemType: ${itemType}, currentSubTab: ${this.currentSubTab}, currentMainSubTab: ${this.currentMainSubTab}`);
        
        // Détection automatique du type d'élément si nous sommes dans l'onglet "éléments à réutiliser"
        // ou si nous venons de sélectionner un élément depuis cet onglet
        let elementCategory = this.currentSubTab;
        
        // Si nous sommes dans l'onglet réutiliser OU si on détecte un type incompatible avec le sous-onglet actuel
        const shouldDetectCategory = this.currentMainSubTab === 'reutiliser' || this.isElementTypeMismatch(itemType, this.currentSubTab, itemElement);
        
        if (shouldDetectCategory) {
            elementCategory = this.detectElementCategory(itemType, itemElement);
            // console.log(`🎯 TabManager: Détection automatique pour ${itemType} -> catégorie: ${elementCategory}`);
            
            // Si nous sommes dans l'onglet bibliothèque, basculer vers le bon sous-onglet
            if (this.currentMainTab === 'biblio') {
                // console.log(`🔄 TabManager: Basculement automatique vers le sous-onglet ${elementCategory}`);
                this.switchSubTab(elementCategory);
            }
        }
        
        // Déterminer quel sélecteur utiliser selon la catégorie détectée
        switch (elementCategory) {
            case 'briques':
                if (window.BrickSelector) {
                    // NOUVEAU: Ne pas synchroniser si l'onglet Outils est en cours de mise à jour
                    if (window.toolsTabUpdating) {
                        // console.log(`🔧 TabManager: Onglet Outils en cours de mise à jour, pas de synchronisation pour ${itemType}`);
                        break;
                    }
                    
                    // 🔧 CORRECTION: Gestion spéciale des briques coupées
                    // Si c'est une brique coupée, sélectionner la brique de base et activer le mode découpe
                    if (window.BrickSelector.brickTypes && window.BrickSelector.brickTypes[itemType] && 
                        window.BrickSelector.brickTypes[itemType].category === 'cut') {
                        
                        const cutBrick = window.BrickSelector.brickTypes[itemType];
                        const baseBrick = cutBrick.baseBrick || itemType.split('_')[0];
                        const cutType = cutBrick.cutType;
                        
                        // Sélectionner la brique de base
                        window.BrickSelector.setBrick(baseBrick);
                        
                        // Activer le mode découpe après un délai
                        setTimeout(() => {
                            if (window.CutButtonManager) {
                                // Les boutons HTML utilisent directement les valeurs 1/4, 1/2, 3/4
                                window.CutButtonManager.syncWithSelectors(baseBrick, cutType);
                            }
                        }, 150);
                    } else {
                        // Brique normale
                        // console.log(`🔄 TabManager: Synchronisation brique normale ${itemType} avec BrickSelector`);
                        window.BrickSelector.setBrick(itemType);
                    }
                    
                    // DÉSACTIVÉ: Ne plus basculer automatiquement vers l'onglet Assise
                    // pour rester dans l'onglet bibliothèque lors de la sélection
                    // Basculer automatiquement vers l'onglet Assise seulement si l'utilisateur n'a pas sélectionné biblio manuellement
                    // ET s'il n'est pas sur l'onglet Outils
                    // if (this.currentMainTab !== 'assise' && this.currentMainTab !== 'outils' && !this.userSelectedBiblioTab) {
                    //     this.switchMainTab('assise');
                    // }
                    
                    // NOUVEAU: Déclencher explicitement la mise à jour de l'onglet outils
                    if (window.ToolsTabManager) {
                        // console.log(`🔧 TabManager: Mise à jour de l'onglet outils pour la brique ${itemType}`);
                        setTimeout(() => {
                            window.ToolsTabManager.updateActiveElementPreview();
                        }, 100);
                    }
                }
                break;

            case 'blocs':
                if (window.BlockSelector) {
                    // console.log(`🔄 TabManager: Synchronisation bloc ${itemType} avec BlockSelector`);
                    window.BlockSelector.setBlock(itemType);
                    // DÉSACTIVÉ: Ne plus basculer automatiquement vers l'onglet Assise
                    // pour rester dans l'onglet bibliothèque lors de la sélection
                    // Basculer automatiquement vers l'onglet Assise seulement si l'utilisateur n'a pas sélectionné biblio manuellement
                    // ET s'il n'est pas sur l'onglet Outils
                    // if (this.currentMainTab !== 'assise' && this.currentMainTab !== 'outils' && !this.userSelectedBiblioTab) {
                    //     this.switchMainTab('assise');
                    // }
                    
                    // NOUVEAU: Déclencher explicitement la mise à jour de l'onglet outils
                    if (window.ToolsTabManager) {
                        // console.log(`🔧 TabManager: Mise à jour de l'onglet outils pour le bloc ${itemType}`);
                        setTimeout(() => {
                            window.ToolsTabManager.updateActiveElementPreview();
                        }, 100);
                    }
                }
                break;

            case 'isolants':
                if (window.InsulationSelector) {
                    // console.log(`🔄 TabManager: Synchronisation isolant ${itemType} avec InsulationSelector`);
                    window.InsulationSelector.setInsulation(itemType);
                    // DÉSACTIVÉ: Ne plus basculer automatiquement vers l'onglet Assise
                    // pour rester dans l'onglet bibliothèque lors de la sélection
                    // Basculer automatiquement vers l'onglet Assise seulement si l'utilisateur n'a pas sélectionné biblio manuellement
                    // ET s'il n'est pas sur l'onglet Outils
                    // if (this.currentMainTab !== 'assise' && this.currentMainTab !== 'outils' && !this.userSelectedBiblioTab) {
                    //     this.switchMainTab('assise');
                    // }
                    
                    // NOUVEAU: Déclencher explicitement la mise à jour de l'onglet outils
                    if (window.ToolsTabManager) {
                        // console.log(`🔧 TabManager: Mise à jour de l'onglet outils pour l'isolant ${itemType}`);
                        setTimeout(() => {
                            window.ToolsTabManager.updateActiveElementPreview();
                        }, 100);
                    }
                }
                break;

            case 'linteaux':
                if (window.LinteauSelector) {
                    const linteauData = window.LinteauSelector.getLinteauData();
                    if (linteauData[itemType] || itemType.includes('_')) {
                        // console.log(`🔄 TabManager: Synchronisation linteau ${itemType} avec LinteauSelector`);
                        // Utiliser la nouvelle méthode setLinteau qui gère les coupes
                        if (window.LinteauSelector.setLinteau) {
                            window.LinteauSelector.setLinteau(itemType);
                        } else {
                            // Fallback vers l'ancienne méthode
                            const baseType = itemType.split('_')[0];
                            window.LinteauSelector.selectStandardLinteau(baseType);
                        }
                        // DÉSACTIVÉ: Ne plus basculer automatiquement vers l'onglet Assise
                        // pour rester dans l'onglet bibliothèque lors de la sélection
                        // Basculer automatiquement vers l'onglet Assise seulement si l'utilisateur n'a pas sélectionné biblio manuellement
                        // ET s'il n'est pas sur l'onglet Outils
                        // if (this.currentMainTab !== 'assise' && this.currentMainTab !== 'outils' && !this.userSelectedBiblioTab) {
                        //     this.switchMainTab('assise');
                        // }
                        
                        // NOUVEAU: Déclencher explicitement la mise à jour de l'onglet outils
                        if (window.ToolsTabManager) {
                            // console.log(`🔧 TabManager: Mise à jour de l'onglet outils pour le linteau ${itemType}`);
                            setTimeout(() => {
                                window.ToolsTabManager.updateActiveElementPreview();
                            }, 100);
                        }
                    }
                }
                break;

            case 'planchers':
            case 'poutres':
            case 'outils':
                // Gestion des éléments GLB - pas de synchronisation avec des sélecteurs spécifiques
                if (window.DEBUG_TAB_MANAGER) {
                    console.log(`📦 TabManager: Élément GLB ${itemType} de catégorie ${elementCategory} - aucune synchronisation nécessaire`);
                }
                // Ne pas basculer d'onglet automatiquement pour les GLB, rester dans la bibliothèque
                break;
        }
    }

    // Nouvelle méthode pour détecter automatiquement la catégorie d'un élément
    detectElementCategory(itemType, itemElement = null) {
        // console.log(`🔍 TabManager: Détection de catégorie pour ${itemType}`);
        
        // D'abord, vérifier si c'est un élément GLB basé sur l'élément DOM
        if (itemElement) {
            if (itemElement.classList.contains('library-item-glb') || 
                itemElement.hasAttribute('data-glb-path') ||
                itemElement.querySelector('.btn-import-glb')) {
                if (window.DEBUG_TAB_MANAGER) {
                    console.log(`📦 TabManager: ${itemType} détecté comme élément GLB`);
                }
                
                // Déterminer la catégorie GLB basée sur le sous-onglet parent ou le chemin
                const glbPath = itemElement.getAttribute('data-glb-path') || '';
                if (glbPath.includes('/planchers/')) {
                    return 'planchers';
                } else if (glbPath.includes('/poutres/')) {
                    return 'poutres';
                } else if (glbPath.includes('/outils/')) {
                    return 'outils';
                }
                
                // Si pas de chemin spécifique, essayer de détecter par le nom
                if (itemType.toLowerCase().includes('hourdis') || 
                    itemType.toLowerCase().includes('plancher')) {
                    return 'planchers';
                } else if (itemType.toLowerCase().includes('poutre')) {
                    return 'poutres';
                } else if (itemType.toLowerCase().includes('outil')) {
                    return 'outils';
                }
                
                // Par défaut pour GLB non catégorisé
                return 'planchers';
            }
        }
        // Vérifier si c'est un bloc (commencent généralement par B)
        if (window.BlockSelector) {
            const blockData = window.BlockSelector.getBlockData();
            if (blockData && blockData[itemType]) {
                // console.log(`✅ TabManager: ${itemType} détecté comme bloc`);
                return 'blocs';
            }
        }
        
        // Vérifier si c'est une brique (commencent généralement par M)
        if (window.BrickSelector) {
            const brickData = window.BrickSelector.getBrickData();
            if (brickData && brickData[itemType]) {
                // console.log(`✅ TabManager: ${itemType} détecté comme brique`);
                return 'briques';
            }
        }
        
        // Vérifier si c'est un isolant
        if (window.InsulationSelector) {
            const insulationTypes = window.InsulationSelector.insulationTypes;
            if (insulationTypes && insulationTypes[itemType]) {
                // console.log(`✅ TabManager: ${itemType} détecté comme isolant`);
                return 'isolants';
            }
        }
        
        // Vérifier si c'est un linteau
        if (window.LinteauSelector) {
            const linteauData = window.LinteauSelector.getLinteauData();
            if (linteauData && linteauData[itemType]) {
                // console.log(`✅ TabManager: ${itemType} détecté comme linteau`);
                return 'linteaux';
            }
        }
        
        // Par défaut, essayer de détecter par le préfixe
        if (itemType.startsWith('B')) {
            // console.log(`🎯 TabManager: ${itemType} détecté comme bloc par préfixe`);
            return 'blocs';
        } else if (itemType.startsWith('M')) {
            console.log(`🎯 TabManager: ${itemType} détecté comme brique par préfixe`);
            return 'briques';
        } else if (itemType.startsWith('PUR') || itemType.startsWith('LAINEROCHE')) {
            console.log(`🎯 TabManager: ${itemType} détecté comme isolant par préfixe`);
            return 'isolants';
        } else if (itemType.startsWith('L')) {
            // Extraire le type de base pour les linteaux avec coupes (ex: L120_HALF -> L120)
            const baseType = itemType.split('_')[0];
            if (['L120', 'L140', 'L160', 'L180', 'L200'].includes(baseType)) {
                console.log(`🎯 TabManager: ${itemType} détecté comme linteau par préfixe (base: ${baseType})`);
                return 'linteaux';
            }
        }
        
        console.log(`⚠️ TabManager: Type non détecté pour ${itemType}, défaut: briques`);
        return 'briques';
    }

    // Nouvelle méthode pour détecter si un élément ne correspond pas au sous-onglet actuel
    isElementTypeMismatch(itemType, currentSubTab, itemElement = null) {
        const detectedCategory = this.detectElementCategory(itemType, itemElement);
        const mismatch = detectedCategory !== currentSubTab;
        
        if (mismatch) {
            console.log(`⚠️ TabManager: Incompatibilité détectée - ${itemType} est de type '${detectedCategory}' mais on est dans '${currentSubTab}'`);
        }
        
        return mismatch;
    }

    syncLibraryWithBrickType(brickType) {
        // Synchroniser la sélection dans la bibliothèque avec le type de brique actuel
        if (this.currentSubTab === 'briques') {
            const baseType = brickType.split('_')[0]; // Enlever les suffixes
            const libraryItem = document.querySelector(`[data-type="${baseType}"]`);
            if (libraryItem) {
                this.selectLibraryItem(baseType, libraryItem);
            }
        }
    }

    syncTextureWithMaterial(materialType) {
        // Synchroniser la sélection de texture avec le matériau
        const textureItem = document.querySelector(`[data-texture="${materialType}"]`);
        if (textureItem) {
            document.querySelectorAll('.texture-item').forEach(item => {
                item.classList.remove('active');
            });
            textureItem.classList.add('active');
        }
    }

    syncTabWithMode(mode) {
        // DÉSACTIVÉ: Synchroniser l'onglet avec le mode de construction
        // Ne plus faire de basculement automatique pour rester dans l'onglet bibliothèque
        // Seulement si l'utilisateur n'a pas sélectionné biblio manuellement ET s'il n'est pas sur l'onglet Outils
        switch (mode) {
            case 'brick':
            case 'block':
            case 'insulation':
            case 'linteau':
                // DÉSACTIVÉ: Ne plus basculer automatiquement vers l'onglet Assise
                // if (this.currentMainTab !== 'assise' && this.currentMainTab !== 'outils' && !this.userSelectedBiblioTab) {
                //     // // console.log(`🔄 Basculement automatique vers l'onglet assise pour mode: ${mode}`);
                //     this.switchMainTab('assise');
                // } else if (this.userSelectedBiblioTab) {
                //     // console.log(`🚫 Basculement automatique annulé - utilisateur dans l'onglet biblio pour mode: ${mode}`);
                // } else if (this.currentMainTab === 'outils') {
                //     // console.log(`🚫 Basculement automatique annulé - utilisateur dans l'onglet outils pour mode: ${mode}`);
                // }
                break;
        }
        
        // Synchroniser les boutons de mode dans l'onglet Biblio
        this.updateBiblioModeButtons(mode);
    }

    // === MÉTHODES PUBLIQUES ===
    getCurrentMainTab() {
        return this.currentMainTab;
    }

    getCurrentSubTab() {
        return this.currentSubTab;
    }

    getSelectedLibraryItem() {
        return this.selectedLibraryItem;
    }

    // Méthode pour naviguer directement vers un élément de bibliothèque
    navigateToLibraryItem(category, itemType) {
        // Basculer vers l'onglet Biblio
        this.switchMainTab('biblio');
        
        // Basculer vers le bon sous-onglet
        this.switchSubTab(category);
        
        // Sélectionner l'élément
        const libraryItem = document.querySelector(`[data-type="${itemType}"]`);
        if (libraryItem) {
            this.selectLibraryItem(itemType, libraryItem);
        }
    }

    // Méthode pour naviguer vers l'onglet textures avec un matériau spécifique
    navigateToTexture(textureType) {
        this.switchMainTab('textures');
        
        const textureItem = document.querySelector(`[data-texture="${textureType}"]`);
        if (textureItem) {
            this.selectTexture(textureType, textureItem);
        }
    }

    // === GESTION DES BOUTONS DE MODE DANS L'ONGLET BIBLIO ===
    setupBiblioModeButtons() {
        // Boutons de mode dans l'onglet Biblio
        const biblioModeButtons = [
            { id: 'brickModeBiblio', mode: 'brick', originalId: 'brickMode' },
            { id: 'blockModeBiblio', mode: 'block', originalId: 'blockMode' },
            { id: 'insulationModeBiblio', mode: 'insulation', originalId: 'insulationMode' },
            { id: 'linteauModeBiblio', mode: 'linteau', originalId: 'linteauMode' }
        ];

        biblioModeButtons.forEach(buttonConfig => {
            const button = document.getElementById(buttonConfig.id);
            if (button) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Synchroniser avec le bouton original dans l'onglet Assise
                    const originalButton = document.getElementById(buttonConfig.originalId);
                    if (originalButton) {
                        originalButton.click();
                    }
                    
                    // Mettre à jour l'état visuel des boutons dans l'onglet Biblio
                    this.updateBiblioModeButtons(buttonConfig.mode);
                    
                    console.log(`Mode ${buttonConfig.mode} activé depuis l'onglet Biblio`);
                });
            }
        });
    }

    updateBiblioModeButtons(activeMode) {
        // Retirer la classe active de tous les boutons de mode dans l'onglet Biblio
        document.querySelectorAll('#tab-content-biblio .tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Ajouter la classe active au bouton correspondant
        const modeButtonMap = {
            'brick': 'brickModeBiblio',
            'block': 'blockModeBiblio',
            'insulation': 'insulationModeBiblio',
            'linteau': 'linteauModeBiblio'
        };

        const activeButton = document.getElementById(modeButtonMap[activeMode]);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    // Méthode de debug pour forcer la reconfiguration des boutons
    debugReconfigureCutButtons() {
        //         this.setupCutButtonsMini();
        
        // Test de clics programmatiques
        setTimeout(() => {
            const testButton = document.querySelector('.cut-btn-mini[data-cut="3/4"][data-base-type="M65"]');
            if (testButton) {
                                testButton.click();
            }
        }, 1000);
    }

    // === GESTION DES NOUVEAUX ONGLETS ===
    setupNewTabs() {
        this.setupJointsTab();
        this.setupProprietesTab();
        this.setupPreferencesTab();
        this.setupOmbresTab();
        this.setupProjetTab();
        this.setupOutilsTab();
    }

    setupJointsTab() {
        // Initialiser les palettes de couleurs
        this.initializeBrickColorPalette();
        this.initializeBlockColorPalette();
        
        // Synchroniser immédiatement les couleurs après l'initialisation des palettes
        // console.log('🔧 AFTER palettes init, forçage synchronisation...');
        this.forceJointColorSync();
        
        // ========== GESTION DES JOINTS DE BRIQUES ==========
        
        // Gestion de l'épaisseur des joints de briques
        const brickJointThickness = document.getElementById('brickJointThickness');
        if (brickJointThickness) {
            brickJointThickness.addEventListener('change', (e) => {
                const thickness = parseFloat(e.target.value);
                if (window.ConstructionTools) {
                    window.ConstructionTools.setBrickJointThickness(thickness);
                }
                console.log(`🧱 Épaisseur joint briques: ${thickness}mm`);
                
                // Synchroniser si l'option est activée
                this.synchronizeJointSettings('thickness', thickness);
            });
        }

        // Gestion de la couleur des joints de briques - maintenant géré par la palette
        // (La logique est dans initializeBrickColorPalette et selectBrickJointColor)

        // Affichage des joints de briques
        const showBrickJoints = document.getElementById('showBrickJoints');
        if (showBrickJoints) {
            showBrickJoints.addEventListener('change', (e) => {
                if (window.ConstructionTools) {
                    window.ConstructionTools.toggleBrickJoints(e.target.checked);
                }
                console.log(`🧱 Affichage joints briques: ${e.target.checked}`);
                this.updateGlobalJointVisibility();
            });
        }

        // Joints automatiques pour briques
        const autoBrickJoints = document.getElementById('autoBrickJoints');
        if (autoBrickJoints) {
            autoBrickJoints.addEventListener('change', (e) => {
                if (window.ConstructionTools) {
                    window.ConstructionTools.setAutoBrickJoints(e.target.checked);
                }
                console.log(`🧱 Joints briques automatiques: ${e.target.checked}`);
            });
        }

        // ========== GESTION DES JOINTS DE BLOCS ==========
        
        // Gestion de l'épaisseur des joints de blocs
        const blockJointThickness = document.getElementById('blockJointThickness');
        if (blockJointThickness) {
            blockJointThickness.addEventListener('change', (e) => {
                const thickness = parseFloat(e.target.value);
                if (window.ConstructionTools) {
                    window.ConstructionTools.setBlockJointThickness(thickness);
                }
                console.log(`🧊 Épaisseur joint blocs: ${thickness}mm`);
                
                // Synchroniser si l'option est activée
                this.synchronizeJointSettings('thickness', thickness);
            });
        }

        // Gestion de la couleur des joints de blocs - maintenant géré par la palette
        // (La logique est dans initializeBlockColorPalette et selectBlockJointColor)

        // Affichage des joints de blocs
        const showBlockJoints = document.getElementById('showBlockJoints');
        if (showBlockJoints) {
            showBlockJoints.addEventListener('change', (e) => {
                if (window.ConstructionTools) {
                    window.ConstructionTools.toggleBlockJoints(e.target.checked);
                }
                console.log(`🧊 Affichage joints blocs: ${e.target.checked}`);
                this.updateGlobalJointVisibility();
            });
        }

        // Joints automatiques pour blocs
        const autoBlockJoints = document.getElementById('autoBlockJoints');
        if (autoBlockJoints) {
            autoBlockJoints.addEventListener('change', (e) => {
                if (window.ConstructionTools) {
                    window.ConstructionTools.setAutoBlockJoints(e.target.checked);
                }
                console.log(`🧊 Joints blocs automatiques: ${e.target.checked}`);
            });
        }

        // ========== PARAMÈTRES GÉNÉRAUX ==========
        
        // Affichage de tous les joints
        const showAllJoints = document.getElementById('showAllJoints');
        if (showAllJoints) {
            showAllJoints.addEventListener('change', (e) => {
                this.toggleAllJoints(e.target.checked);
            });
        }

        // Synchronisation des paramètres
        const syncJointSettings = document.getElementById('syncJointSettings');
        if (syncJointSettings) {
            syncJointSettings.addEventListener('change', (e) => {
                // console.log(`🔄 Synchronisation des paramètres: ${e.target.checked}`);
                if (e.target.checked) {
                    this.showNotification('Synchronisation des paramètres activée', 'info');
                }
            });
        }

        // Bouton de réinitialisation
        const resetJointSettings = document.getElementById('resetJointSettings');
        if (resetJointSettings) {
            resetJointSettings.addEventListener('click', () => {
                this.resetJointSettings();
            });
        }

        // Initialiser la synchronisation des états
        this.initializeJointStates();
    }

    /**
     * Synchronise les paramètres de joints entre briques et blocs si activé
     * @param {string} setting - Type de paramètre ('thickness', 'color', etc.)
     * @param {*} value - Nouvelle valeur
     */
    synchronizeJointSettings(setting, value) {
        const syncEnabled = document.getElementById('syncJointSettings')?.checked;
        if (!syncEnabled) return;

        switch (setting) {
            case 'thickness':
                const brickThickness = document.getElementById('brickJointThickness');
                const blockThickness = document.getElementById('blockJointThickness');
                if (brickThickness && blockThickness) {
                    brickThickness.value = value;
                    blockThickness.value = value;
                    // Appliquer aux moteurs
                    if (window.ConstructionTools) {
                        window.ConstructionTools.setBrickJointThickness(value);
                        window.ConstructionTools.setBlockJointThickness(value);
                    }
                }
                break;
                
            case 'color':
                // Synchroniser les couleurs entre les palettes de briques et de blocs
                if (typeof value === 'string' && value.startsWith('#')) {
                    // Chercher la même couleur dans l'autre palette
                    const brickColors = this.getBrickJointColors();
                    const blockColors = this.getBlockJointColors();
                    
                    // Si la valeur vient des briques, synchroniser vers les blocs
                    const matchingBlockColor = blockColors.find(c => c.hex === value);
                    if (matchingBlockColor && this.selectedBlockJointColor?.hex !== value) {
                        const blockElement = document.querySelector(`#blockJointColorPalette .color-option[data-hex="${value}"]`);
                        if (blockElement) {
                            this.selectBlockJointColor(matchingBlockColor, blockElement);
                        }
                    }
                    
                    // Si la valeur vient des blocs, synchroniser vers les briques
                    const matchingBrickColor = brickColors.find(c => c.hex === value);
                    if (matchingBrickColor && this.selectedBrickJointColor?.hex !== value) {
                        const brickElement = document.querySelector(`#brickJointColorPalette .color-option[data-hex="${value}"]`);
                        if (brickElement) {
                            this.selectBrickJointColor(matchingBrickColor, brickElement);
                        }
                    }
                }
                break;
        }
        
        // console.log(`🔄 Paramètres synchronisés: ${setting} = ${value}`);
    }

    /**
     * Met à jour la visibilité globale des joints
     */
    updateGlobalJointVisibility() {
        const showBrickJoints = document.getElementById('showBrickJoints')?.checked || false;
        const showBlockJoints = document.getElementById('showBlockJoints')?.checked || false;
        const showAllJoints = document.getElementById('showAllJoints');
        
        if (showAllJoints) {
            const anyJointVisible = showBrickJoints || showBlockJoints;
            showAllJoints.checked = anyJointVisible;
        }
    }

    /**
     * Active/désactive l'affichage de tous les joints
     * @param {boolean} show - Afficher ou masquer tous les joints
     */
    toggleAllJoints(show) {
        const showBrickJoints = document.getElementById('showBrickJoints');
        const showBlockJoints = document.getElementById('showBlockJoints');
        
        if (showBrickJoints) {
            showBrickJoints.checked = show;
            if (window.ConstructionTools) {
                window.ConstructionTools.toggleBrickJoints(show);
            }
        }
        
        if (showBlockJoints) {
            showBlockJoints.checked = show;
            if (window.ConstructionTools) {
                window.ConstructionTools.toggleBlockJoints(show);
            }
        }
        
        // console.log(`🔄 Tous les joints: ${show ? 'affichés' : 'masqués'}`);
    }

    /**
     * Remet les paramètres de joints aux valeurs par défaut
     */
    resetJointSettings() {
        // Valeurs par défaut
        const defaultValues = {
            brickThickness: 10,
            blockThickness: 10, // 10mm (1cm) pour blocs creux
            color: 'grey',
            showJoints: true,
            autoJoints: true
        };

        // Réinitialiser les contrôles
        const elements = [
            { id: 'brickJointThickness', value: defaultValues.brickThickness },
            { id: 'blockJointThickness', value: defaultValues.blockThickness },
            { id: 'blockJointColor', value: defaultValues.color },
            { id: 'showBrickJoints', checked: defaultValues.showJoints },
            { id: 'showBlockJoints', checked: defaultValues.showJoints },
            { id: 'showAllJoints', checked: defaultValues.showJoints },
            { id: 'autoBrickJoints', checked: defaultValues.autoJoints },
            { id: 'autoBlockJoints', checked: defaultValues.autoJoints },
            { id: 'syncJointSettings', checked: false }
        ];

        elements.forEach(({ id, value, checked }) => {
            const element = document.getElementById(id);
            if (element) {
                if (checked !== undefined) {
                    element.checked = checked;
                } else {
                    element.value = value;
                }
                // Déclencher l'événement change pour appliquer les changements
                element.dispatchEvent(new Event('change'));
            }
        });

        // Réinitialiser les palettes de couleurs à "Gris Ciment"
        const defaultBrickColor = this.getBrickJointColors().find(c => c.name === 'Gris Ciment');
        if (defaultBrickColor) {
            const defaultBrickElement = document.querySelector(`#brickJointColorPalette .color-option[data-name="${defaultBrickColor.name}"]`);
            if (defaultBrickElement) {
                this.selectBrickJointColor(defaultBrickColor, defaultBrickElement);
            }
        }

        const defaultBlockColor = this.getBlockJointColors().find(c => c.name === 'Gris Ciment');
        if (defaultBlockColor) {
            const defaultBlockElement = document.querySelector(`#blockJointColorPalette .color-option[data-name="${defaultBlockColor.name}"]`);
            if (defaultBlockElement) {
                this.selectBlockJointColor(defaultBlockColor, defaultBlockElement);
            }
        }

        this.showNotification('Paramètres des joints réinitialisés', 'success');
        // console.log('🔄 Paramètres des joints réinitialisés aux valeurs par défaut');
    }

    /**
     * Initialise les états des joints au chargement
     */
    /**
     * Force la synchronisation des couleurs de joints après l'init des palettes
     */
    forceJointColorSync() {
        // console.log('🔧 forceJointColorSync - États actuels:', {
        //     selectedBrickJointColor: this.selectedBrickJointColor,
        //     selectedBlockJointColor: this.selectedBlockJointColor
        // });
        
        if (window.ConstructionTools) {
            const brickColor = this.selectedBrickJointColor?.hex || '#9E9E9E';
            const blockColor = this.selectedBlockJointColor?.hex || '#9E9E9E';
            
            // console.log('🔧 FORCE SYNC - Couleurs transmises:', { brickColor, blockColor });
            
            window.ConstructionTools.setBrickJointColor?.(brickColor);
            window.ConstructionTools.setBlockJointColor?.(blockColor);
        }
    }

    initializeJointStates() {
        // console.log('🔧 AVANT initializeJointStates:', {
        //     selectedBrickJointColor: this.selectedBrickJointColor,
        //     selectedBlockJointColor: this.selectedBlockJointColor
        // });
        
        // Synchroniser les états initiaux avec ConstructionTools si disponible
        if (window.ConstructionTools) {
            const brickThickness = document.getElementById('brickJointThickness')?.value || 10;
            const blockThickness = document.getElementById('blockJointThickness')?.value || 10;
            const brickColor = this.selectedBrickJointColor?.hex || '#9E9E9E';
            const blockColor = this.selectedBlockJointColor?.hex || '#9E9E9E';
            const autoBrickJoints = document.getElementById('autoBrickJoints')?.checked || true;
            const autoBlockJoints = document.getElementById('autoBlockJoints')?.checked || true;

            // console.log('🔧 COULEURS TRANSMISES à ConstructionTools:', { brickColor, blockColor });

            // Appliquer les états initiaux
            window.ConstructionTools.setBrickJointThickness?.(parseFloat(brickThickness));
            window.ConstructionTools.setBlockJointThickness?.(parseFloat(blockThickness));
            window.ConstructionTools.setBrickJointColor?.(brickColor);
            window.ConstructionTools.setBlockJointColor?.(blockColor);
            window.ConstructionTools.setAutoBrickJoints?.(autoBrickJoints);
            window.ConstructionTools.setAutoBlockJoints?.(autoBlockJoints);

            // console.log('🔧 États initiaux des joints synchronisés');
        }
    }

    /**
     * Définition des couleurs de joints pour les briques
     */
    getBrickJointColors() {
        return [
            // === GRIS (10 teintes) ===
            { name: 'Gris Perle', hex: '#E1E1E1', category: 'Gris' },
            { name: 'Gris Ciment', hex: '#A9A9A9', category: 'Gris' },
            { name: 'Gris Béton', hex: '#9A9893', category: 'Gris' },
            { name: 'Gris Galet', hex: '#BDB5AD', category: 'Gris' },
            { name: 'Gris Souris', hex: '#9E9E9E', category: 'Gris' },
            { name: 'Gris Acier', hex: '#8A9597', category: 'Gris' },
            { name: 'Gris Ardoise', hex: '#708090', category: 'Gris' },
            { name: 'Gris Fumée', hex: '#888584', category: 'Gris' },
            { name: 'Gris Basalte', hex: '#5D5D5D', category: 'Gris' },
            { name: 'Anthracite', hex: '#36454F', category: 'Gris' },

            // === BLANCS ET BEIGES (10 teintes) ===
            { name: 'Blanc Alpin', hex: '#F5F5F5', category: 'Blancs & Beiges' },
            { name: 'Ivoire', hex: '#FFFFF0', category: 'Blancs & Beiges' },
            { name: 'Blanc Cassé', hex: '#F8F4E3', category: 'Blancs & Beiges' },
            { name: 'Pierre Calcaire', hex: '#E9E4D9', category: 'Blancs & Beiges' },
            { name: 'Couleur Lin', hex: '#EAE0D3', category: 'Blancs & Beiges' },
            { name: 'Crème', hex: '#FFFDD0', category: 'Blancs & Beiges' },
            { name: 'Beige Sable', hex: '#D8C0A4', category: 'Blancs & Beiges' },
            { name: 'Jasmin', hex: '#F8DE7E', category: 'Blancs & Beiges' },
            { name: 'Dune', hex: '#C2B280', category: 'Blancs & Beiges' },
            { name: 'Caramel', hex: '#C68642', category: 'Blancs & Beiges' },

            // === BRUNS ET TAUPES (10 teintes) ===
            { name: 'Taupe', hex: '#8B8589', category: 'Bruns & Taupes' },
            { name: 'Noisette', hex: '#955628', category: 'Bruns & Taupes' },
            { name: 'Brun Terreux', hex: '#7B685B', category: 'Bruns & Taupes' },
            { name: 'Sienne Brûlée', hex: '#A55D35', category: 'Bruns & Taupes' },
            { name: 'Cannelle', hex: '#D2691E', category: 'Bruns & Taupes' },
            { name: 'Sépia', hex: '#705E4D', category: 'Bruns & Taupes' },
            { name: 'Moka', hex: '#6F4E37', category: 'Bruns & Taupes' },
            { name: 'Brou de Noix', hex: '#6B4E32', category: 'Bruns & Taupes' },
            { name: 'Chocolat', hex: '#5C3E33', category: 'Bruns & Taupes' },
            { name: 'Terre d\'Ombre', hex: '#5A4F41', category: 'Bruns & Taupes' },

            // === ROUGES ET TERRES CUITES (10 teintes) ===
            { name: 'Rosé des Sables', hex: '#E8C3B9', category: 'Rouges & Terres Cuites' },
            { name: 'Saumon', hex: '#FA8072', category: 'Rouges & Terres Cuites' },
            { name: 'Corail Pâle', hex: '#E4A08E', category: 'Rouges & Terres Cuites' },
            { name: 'Tomette', hex: '#C86F52', category: 'Rouges & Terres Cuites' },
            { name: 'Terre Cuite', hex: '#E2725B', category: 'Rouges & Terres Cuites' },
            { name: 'Ocre Rouge', hex: '#DD985C', category: 'Rouges & Terres Cuites' },
            { name: 'Rouge Brique', hex: '#A94D3F', category: 'Rouges & Terres Cuites' },
            { name: 'Rouge de Flandre', hex: '#9E3E34', category: 'Rouges & Terres Cuites' },
            { name: 'Brun Rougeâtre', hex: '#8B4513', category: 'Rouges & Terres Cuites' },
            { name: 'Lie de Vin', hex: '#8A3335', category: 'Rouges & Terres Cuites' },

            // === NOIRS ET TEINTES PROFONDES (10 teintes) ===
            { name: 'Noir Graphite', hex: '#2C2C2E', category: 'Noirs & Teintes Profondes' },
            { name: 'Noir Volcanique', hex: '#404040', category: 'Noirs & Teintes Profondes' },
            { name: 'Noir Carbone', hex: '#303030', category: 'Noirs & Teintes Profondes' },
            { name: 'Noir de Vigne', hex: '#2A2B2D', category: 'Noirs & Teintes Profondes' },
            { name: 'Noir Réglisse', hex: '#211E1E', category: 'Noirs & Teintes Profondes' },
            { name: 'Noir d\'Ivoire', hex: '#1F1E1C', category: 'Noirs & Teintes Profondes' },
            { name: 'Noir de Jais', hex: '#0A0A0A', category: 'Noirs & Teintes Profondes' },
            { name: 'Vert Lierre', hex: '#334B36', category: 'Noirs & Teintes Profondes' },
            { name: 'Bleu Ardoise', hex: '#465362', category: 'Noirs & Teintes Profondes' },
            { name: 'Vert de Gris', hex: '#A7B3A1', category: 'Noirs & Teintes Profondes' }
        ];
    }

    /**
     * Initialise la palette de couleurs pour les joints de briques
     */
    initializeBrickColorPalette() {
        const palette = document.getElementById('brickJointColorPalette');
        if (!palette) return;

        const colors = this.getBrickJointColors();
        let currentCategory = '';
        
        colors.forEach((color, index) => {
            // Ajouter un titre de section quand on change de catégorie
            if (color.category !== currentCategory) {
                // Ajouter un espacement entre les catégories (sauf pour la première)
                if (currentCategory !== '') {
                    const spacer = document.createElement('div');
                    spacer.className = 'category-spacer';
                    palette.appendChild(spacer);
                }
                
                // Ajouter le titre de la catégorie
                const categoryTitle = document.createElement('div');
                categoryTitle.className = 'category-title';
                categoryTitle.textContent = color.category;
                palette.appendChild(categoryTitle);
                
                currentCategory = color.category;
            }

            // Créer l'option de couleur
            const colorOption = document.createElement('div');
            colorOption.className = 'color-option';
            colorOption.style.backgroundColor = color.hex;
            colorOption.setAttribute('data-name', color.name);
            colorOption.setAttribute('data-hex', color.hex);
            colorOption.setAttribute('data-category', color.category);
            colorOption.title = `${color.name} (${color.hex})`;
            
            // Marquer la couleur par défaut (Gris Souris au lieu de Gris Ciment)
            if (color.name === 'Gris Souris') {
                colorOption.classList.add('selected');
                this.selectedBrickJointColor = color;
                // console.log('🎯 PALETTE BRIQUES - Gris Souris sélectionné par défaut:', color);
            }

            // Gestionnaire de clic
            colorOption.addEventListener('click', () => {
                this.selectBrickJointColor(color, colorOption);
            });

            palette.appendChild(colorOption);
        });

        // console.log('🎨 Palette de couleurs joints briques initialisée (50 couleurs)');
    }

    /**
     * Sélectionne une couleur de joint pour les briques
     */
    selectBrickJointColor(color, element) {
        // Désélectionner l'ancienne couleur
        const prevSelected = document.querySelector('#brickJointColorPalette .color-option.selected');
        if (prevSelected) {
            prevSelected.classList.remove('selected');
        }

        // Sélectionner la nouvelle couleur
        element.classList.add('selected');
        this.selectedBrickJointColor = color;

        // Mettre à jour l'affichage d'information
        const colorInfo = document.getElementById('selectedBrickColorInfo');
        if (colorInfo) {
            const colorName = colorInfo.querySelector('.color-name');
            const colorCode = colorInfo.querySelector('.color-code');
            if (colorName) colorName.textContent = color.name;
            if (colorCode) colorCode.textContent = color.hex;
        }

        // Appliquer la couleur au moteur
        if (window.ConstructionTools) {
            window.ConstructionTools.setBrickJointColor(color.hex);
        }

        console.log(`🎨 Couleur joint briques sélectionnée: ${color.name} (${color.hex})`);
        // console.log(`🔄 Mise à jour de tous les joints de briques existants et couleur par défaut définie`);

        // Synchroniser si activé
        this.synchronizeJointSettings('color', color.hex);
    }

    /**
     * Trouve un équivalent de couleur pour les blocs basé sur un code hex
     */
    findBlockColorEquivalent(hexColor) {
        const blockColorMap = {
            '#A9A9A9': 'grey',
            '#FFFFFF': 'white',
            '#F5F5F5': 'white',
            '#F8F4E3': 'beige',
            '#E9E4D9': 'beige',
            '#404040': 'dark',
            '#2C2C2E': 'dark',
            '#36454F': 'dark'
        };
        return blockColorMap[hexColor] || 'grey';
    }

    /**
     * Définition des couleurs de joints pour les blocs (teintes grises uniquement)
     */
    getBlockJointColors() {
        return [
            { name: 'Gris Perle', hex: '#E1E1E1', category: 'Gris' },
            { name: 'Gris Ciment', hex: '#A9A9A9', category: 'Gris' },
            { name: 'Gris Béton', hex: '#9A9893', category: 'Gris' },
            { name: 'Gris Galet', hex: '#BDB5AD', category: 'Gris' },
            { name: 'Gris Souris', hex: '#9E9E9E', category: 'Gris' },
            { name: 'Gris Acier', hex: '#8A9597', category: 'Gris' },
            { name: 'Gris Ardoise', hex: '#708090', category: 'Gris' },
            { name: 'Gris Fumée', hex: '#888584', category: 'Gris' },
            { name: 'Gris Basalte', hex: '#5D5D5D', category: 'Gris' },
            { name: 'Anthracite', hex: '#36454F', category: 'Gris' }
        ];
    }

    /**
     * Initialise la palette de couleurs pour les joints de blocs
     */
    initializeBlockColorPalette() {
        const palette = document.getElementById('blockJointColorPalette');
        if (!palette) return;

        const colors = this.getBlockJointColors();
        
        // Ajouter le titre de la catégorie
        const categoryTitle = document.createElement('div');
        categoryTitle.className = 'category-title';
        categoryTitle.textContent = 'Teintes Grises';
        palette.appendChild(categoryTitle);
        
        colors.forEach((color, index) => {
            // Créer l'option de couleur
            const colorOption = document.createElement('div');
            colorOption.className = 'color-option';
            colorOption.style.backgroundColor = color.hex;
            colorOption.setAttribute('data-name', color.name);
            colorOption.setAttribute('data-hex', color.hex);
            colorOption.setAttribute('data-category', color.category);
            colorOption.title = `${color.name} (${color.hex})`;
            
            // Marquer la couleur par défaut (Gris Souris au lieu de Gris Ciment)
            if (color.name === 'Gris Souris') {
                colorOption.classList.add('selected');
                this.selectedBlockJointColor = color;
                // console.log('🎯 PALETTE BLOCS - Gris Souris sélectionné par défaut:', color);
            }

            // Gestionnaire de clic
            colorOption.addEventListener('click', () => {
                this.selectBlockJointColor(color, colorOption);
            });

            palette.appendChild(colorOption);
        });

        // console.log('🎨 Palette de couleurs joints blocs initialisée (10 teintes grises)');
    }

    /**
     * Sélectionne une couleur de joint pour les blocs
     */
    selectBlockJointColor(color, element) {
        // Désélectionner l'ancienne couleur
        const prevSelected = document.querySelector('#blockJointColorPalette .color-option.selected');
        if (prevSelected) {
            prevSelected.classList.remove('selected');
        }

        // Sélectionner la nouvelle couleur
        element.classList.add('selected');
        this.selectedBlockJointColor = color;

        // Mettre à jour l'affichage d'information
        const colorInfo = document.getElementById('selectedBlockColorInfo');
        if (colorInfo) {
            const colorName = colorInfo.querySelector('.color-name');
            const colorCode = colorInfo.querySelector('.color-hex');
            if (colorName) colorName.textContent = color.name;
            if (colorCode) colorCode.textContent = color.hex;
        }

        // Appliquer la couleur au moteur
        if (window.ConstructionTools) {
            window.ConstructionTools.setBlockJointColor(color.hex);
        }

        console.log(`🎨 Couleur joint blocs sélectionnée: ${color.name} (${color.hex})`);
        // console.log(`🔄 Mise à jour de tous les joints de blocs existants et couleur par défaut définie`);

        // Synchroniser si activé
        this.synchronizeJointSettings('color', color.hex);
    }

    setupProprietesTab() {
        // Écouter les événements de sélection d'éléments
        document.addEventListener('elementSelected', (e) => {
            this.updatePropertiesForSelectedElement(e.detail.element);
        });
        
        document.addEventListener('elementDeselected', () => {
            this.hideJointsControlsIfNeeded();
        });
        
        // Gestionnaires automatiques pour les contrôles de joints
        this.setupJointControls();
    }

    setupPreferencesTab() {
        // Grille
        const showGrid = document.getElementById('showGrid');
        if (showGrid) {
            showGrid.addEventListener('change', (e) => {
                if (window.SceneManager) {
                    window.SceneManager.toggleGrid(e.target.checked);
                }
                console.log(`Grille: ${e.target.checked}`);
            });
        }

        // Axes
        const showAxis = document.getElementById('showAxis');
        if (showAxis) {
            showAxis.addEventListener('change', (e) => {
                if (window.SceneManager) {
                    window.SceneManager.toggleAxis(e.target.checked);
                }
                console.log(`Axes: ${e.target.checked}`);
            });
        }

        // Mode de vue
        const viewMode = document.getElementById('viewMode');
        if (viewMode) {
            viewMode.addEventListener('change', (e) => {
                if (window.SceneManager) {
                    window.SceneManager.setViewMode(e.target.value);
                }
                console.log(`Mode de vue: ${e.target.value}`);
            });
        }

        // Couleur d'arrière-plan
        const backgroundCol = document.getElementById('backgroundCol');
        if (backgroundCol) {
            backgroundCol.addEventListener('change', (e) => {
                if (window.SceneManager) {
                    window.SceneManager.setBackgroundColor(e.target.value);
                }
                console.log(`Couleur arrière-plan: ${e.target.value}`);
            });
        }

        // NOUVEAU: Lettres de proposition adjacente
        const showAdjacentLetters = document.getElementById('showAdjacentLetters');
        if (showAdjacentLetters) {
            // Initialiser la case à cocher avec la valeur par défaut
            showAdjacentLetters.checked = window.showAdjacentProposalLetters || false;
            
            showAdjacentLetters.addEventListener('change', (e) => {
                if (window.toggleAdjacentProposalLetters) {
                    window.showAdjacentProposalLetters = e.target.checked;
                    window.toggleAdjacentProposalLetters(); // Appliquer les changements aux éléments existants
                    window.toggleAdjacentProposalLetters(); // Double appel pour remettre à l'état souhaité
                    window.showAdjacentProposalLetters = e.target.checked; // S'assurer que l'état est correct
                }
                console.log(`🔤 Lettres de proposition adjacente: ${e.target.checked}`);
            });
        }
    }

    setupOmbresTab() {
        // L'onglet ombres est maintenant géré par ShadowManager
        // Garder une compatibilité de base pour l'existant
        
        //         
        // Vérifier si ShadowManager est disponible
        const checkShadowManager = () => {
            if (window.ShadowManager) {
                //                 return true;
            } else {
                //                 setTimeout(checkShadowManager, 500);
                return false;
            }
        };
        
        checkShadowManager();
        
        // Configuration de base pour la compatibilité descendante
        this.setupBasicShadowControls();
    }

    setupBasicShadowControls() {
        // Activation des ombres - compatibilité de base
        const enableShadows = document.getElementById('enableShadows');
        if (enableShadows) {
            enableShadows.addEventListener('change', (e) => {
                if (window.SceneManager) {
                    window.SceneManager.setShadowsEnabled(e.target.checked);
                }
                console.log(`Ombres: ${e.target.checked}`);
            });
        }

        // Intensité des ombres - compatibilité de base
        const shadowIntensity = document.getElementById('shadowIntensity');
        const shadowIntensityValue = document.getElementById('shadowIntensityValue');
        if (shadowIntensity && shadowIntensityValue) {
            shadowIntensity.addEventListener('input', (e) => {
                const intensity = parseFloat(e.target.value);
                shadowIntensityValue.textContent = intensity.toFixed(1);
                if (window.SceneManager) {
                    window.SceneManager.setShadowIntensity(intensity);
                }
            });
        }

        // Les autres contrôles sont gérés par ShadowManager
        // console.log('📋 Contrôles d\'ombres de base configurés');
    }

    setupProjetTab() {
        // Vider le projet
        const clearProject = document.getElementById('clearProject');
        if (clearProject) {
            clearProject.addEventListener('click', () => {
                this.clearProject();
            });
        }

        // Réinitialiser la vue
        const resetView = document.getElementById('resetView');
        if (resetView) {
            resetView.addEventListener('click', () => {
                if (window.SceneManager) {
                    window.SceneManager.resetView();
                }
                // console.log('Vue réinitialisée');
            });
        }

        // Sauvegarde automatique des champs du projet
        this.setupProjectFieldsAutoSave();

        // Mettre à jour les statistiques
        this.updateProjectStats();
    }

    setupProjectFieldsAutoSave() {
        // Sauvegarde automatique dans localStorage quand les champs sont modifiés
        const fields = ['projectName', 'projectDesigner', 'projectClass', 'projectNotes', 'detailedProcedure', 'procedureRecommendations'];
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                // Charger la valeur sauvegardée
                const savedValue = localStorage.getItem(`wallsim_${fieldId}`);
                if (savedValue) {
                    field.value = savedValue;
                }
                
                // Sauvegarder quand l'utilisateur modifie le champ
                field.addEventListener('input', () => {
                    localStorage.setItem(`wallsim_${fieldId}`, field.value);
                });
                
                field.addEventListener('blur', () => {
                    localStorage.setItem(`wallsim_${fieldId}`, field.value);
                });
            }
        });
    }

    clearProject() {
        if (confirm('Êtes-vous sûr de vouloir vider le projet ? Cette action est irréversible.')) {
            if (window.SceneManager && typeof window.SceneManager.clearAll === 'function') {
                window.SceneManager.clearAll();
            }
            
            // Vider tous les champs du projet
            const projectFields = ['projectName', 'projectDesigner', 'projectClass', 'projectNotes', 'detailedProcedure', 'procedureRecommendations'];
            projectFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = '';
                    // Supprimer aussi de localStorage
                    localStorage.removeItem(`wallsim_${fieldId}`);
                }
            });
            
            this.updateProjectStats();
            // console.log('🗑️ Projet vidé - Tous les champs et éléments effacés');
        }
    }

    updateProjectStats() {
        const stats = this.getProjectStats();
        
        const elementsCount = document.getElementById('elementsCount');
        const bricksCount = document.getElementById('bricksCount');
        const blocksCount = document.getElementById('blocksCount');
        const totalVolume = document.getElementById('totalVolume');
        
        if (elementsCount) elementsCount.textContent = stats.total;
        if (bricksCount) bricksCount.textContent = stats.bricks;
        if (blocksCount) blocksCount.textContent = stats.blocks;
        if (totalVolume) totalVolume.textContent = stats.volume.toFixed(2);
    }

    getProjectStats() {
        if (!window.SceneManager || typeof window.SceneManager.getProjectData !== 'function') {
            return { total: 0, bricks: 0, blocks: 0, volume: 0 };
        }

        const projectData = window.SceneManager.getProjectData() || { elements: [] };
        const elements = projectData.elements || [];
        const stats = {
            total: elements.length,
            bricks: elements.filter(e => e.type && e.type.startsWith('M')).length,
            blocks: elements.filter(e => e.type && e.type.startsWith('B')).length,
            volume: 0
        };

        // Calculer le volume total approximatif
        stats.volume = elements.reduce((total, element) => {
            if (element.dimensions) {
                const dims = element.dimensions.split('×').map(d => parseFloat(d) / 100); // cm vers m
                if (dims.length === 3) {
                    return total + (dims[0] * dims[1] * dims[2]);
                }
            }
            return total;
        }, 0);

        return stats;
    }
    
    // ===== NOUVELLES MÉTHODES POUR LA GESTION DES JOINTS =====
    
    /**
     * Met à jour les propriétés affichées pour l'élément sélectionné
     * @param {Object} element - L'élément sélectionné
     */
    updatePropertiesForSelectedElement(element) {
        // console.log('🔧 TabManager: Mise à jour des propriétés pour élément:', element);
        
        // Mettre à jour les informations de base de l'élément
        const selectedElementProperties = document.getElementById('selectedElementProperties');
        if (selectedElementProperties && element) {
            // Gérer différents types d'éléments
            if (element.properties) {
                // Éléments d'annotation/mesure/texte avec propriétés prédéfinies
                this.displayCustomProperties(element);
            } else {
                // Éléments de construction standard
                this.displayStandardProperties(element);
            }
        }
        
        // Vérifier si l'élément est une brique ou un bloc (éléments qui peuvent avoir des joints)
        if (element && (element.type === 'brick' || element.type === 'block' || element.type === 'insulation')) {
            this.showJointsControlsForElement(element);
        } else {
            this.hideJointsControlsIfNeeded();
        }
    }
    
    /**
     * Affiche les propriétés personnalisées pour les éléments d'annotation/mesure/texte
     * @param {Object} element - L'élément avec propriétés personnalisées
     */
    displayCustomProperties(element) {
        const selectedElementProperties = document.getElementById('selectedElementProperties');
        if (!selectedElementProperties) return;
        
        let propertiesHtml = `<div class="element-info selected" data-type="${element.type}">
            <h4>Propriétés - ${element.toolType || element.type}</h4>`;
        
        // Parcourir les propriétés personnalisées
        for (const [key, value] of Object.entries(element.properties)) {
            const valueClass = this.getValueClass(key, value);
            
            // Propriétés éditables pour les cotations
            if (element.toolType === 'measurement' && this.isEditableProperty(key)) {
                propertiesHtml += `<div class="property-row">
                    <strong>${key}:</strong> 
                    <input type="number" 
                           class="property-input" 
                           data-property="${key}" 
                           value="${value}" 
                           min="0.1" 
                           step="0.1"
                           style="width: 60px; margin-left: 5px;">
                </div>`;
            }
            // Propriétés éditables pour les annotations
            else if (element.toolType === 'annotation' && this.isEditableAnnotationProperty(key)) {
                if (key === 'Texte') {
                    propertiesHtml += `<div class="property-row">
                        <strong>${key}:</strong> 
                        <input type="text" 
                               class="property-input-text" 
                               data-property="${key}" 
                               value="${value}" 
                               style="width: 150px; margin-left: 5px;">
                    </div>`;
                } else if (key === 'Sous-type') {
                    propertiesHtml += `<div class="property-row">
                        <strong>${key}:</strong> 
                        <select class="property-input-select" 
                                data-property="${key}" 
                                style="width: 100px; margin-left: 5px;">
                            <option value="note" ${value === 'note' ? 'selected' : ''}>Note</option>
                            <option value="warning" ${value === 'warning' ? 'selected' : ''}>Avertissement</option>
                            <option value="info" ${value === 'info' ? 'selected' : ''}>Information</option>
                            <option value="important" ${value === 'important' ? 'selected' : ''}>Important</option>
                        </select>
                    </div>`;
                } else if (key === 'Taille') {
                    propertiesHtml += `<div class="property-row">
                        <strong>${key}:</strong> 
                        <select class="property-input-select" 
                                data-property="${key}" 
                                style="width: 100px; margin-left: 5px;">
                            <option value="small" ${value === 'small' ? 'selected' : ''}>Petit</option>
                            <option value="medium" ${value === 'medium' ? 'selected' : ''}>Moyen</option>
                            <option value="large" ${value === 'large' ? 'selected' : ''}>Grand</option>
                            <option value="extra-large" ${value === 'extra-large' ? 'selected' : ''}>Très grand</option>
                        </select>
                    </div>`;
                }
            }
            // Propriétés éditables pour les textes avec ligne d'attache
            else if ((element.toolType === 'textleader' || element.type === 'textleader') && this.isEditableTextLeaderProperty(key)) {
                if (key === 'Texte') {
                    propertiesHtml += `<div class="property-row">
                        <strong>${key}:</strong> 
                        <input type="text" 
                               class="property-input-text" 
                               data-property="${key}" 
                               value="${value}" 
                               style="width: 150px; margin-left: 5px;">
                    </div>`;
                } else if (key === 'Style') {
                    propertiesHtml += `<div class="property-row">
                        <strong>${key}:</strong> 
                        <select class="property-input-select" 
                                data-property="${key}" 
                                style="width: 100px; margin-left: 5px;">
                            <option value="normal" ${value === 'normal' ? 'selected' : ''}>Normal</option>
                            <option value="bold" ${value === 'bold' ? 'selected' : ''}>Gras</option>
                            <option value="italic" ${value === 'italic' ? 'selected' : ''}>Italique</option>
                        </select>
                    </div>`;
                } else if (key === 'Taille') {
                    propertiesHtml += `<div class="property-row">
                        <strong>${key}:</strong> 
                        <select class="property-input-select" 
                                data-property="${key}" 
                                style="width: 100px; margin-left: 5px;">
                            <option value="small" ${value === 'small' ? 'selected' : ''}>Petit</option>
                            <option value="medium" ${value === 'medium' ? 'selected' : ''}>Moyen</option>
                            <option value="large" ${value === 'large' ? 'selected' : ''}>Grand</option>
                        </select>
                    </div>`;
                } else if (key === 'Couleur') {
                    propertiesHtml += `<div class="property-row">
                        <strong>${key}:</strong> 
                        <select class="property-input-select" 
                                data-property="${key}" 
                                style="width: 100px; margin-left: 5px;">
                            <option value="blue" ${value === 'blue' ? 'selected' : ''}>Bleu</option>
                            <option value="red" ${value === 'red' ? 'selected' : ''}>Rouge</option>
                            <option value="green" ${value === 'green' ? 'selected' : ''}>Vert</option>
                            <option value="black" ${value === 'black' ? 'selected' : ''}>Noir</option>
                            <option value="white" ${value === 'white' ? 'selected' : ''}>Blanc</option>
                        </select>
                    </div>`;
                } else if (key === 'Style de ligne') {
                    propertiesHtml += `<div class="property-row">
                        <strong>${key}:</strong> 
                        <select class="property-input-select" 
                                data-property="${key}" 
                                style="width: 100px; margin-left: 5px;">
                            <option value="solid" ${value === 'solid' ? 'selected' : ''}>Solide</option>
                            <option value="dashed" ${value === 'dashed' ? 'selected' : ''}>Pointillé</option>
                            <option value="dotted" ${value === 'dotted' ? 'selected' : ''}>Points</option>
                        </select>
                    </div>`;
                }
            } else {
                propertiesHtml += `<div class="property-row">
                    <strong>${key}:</strong> 
                    <span class="${valueClass}">${value}</span>
                </div>`;
            }
        }
        
        propertiesHtml += '</div>';
        selectedElementProperties.innerHTML = propertiesHtml;
        
        // Ajouter les écouteurs d'événements pour les propriétés éditables
        if (element.toolType === 'measurement') {
            this.setupMeasurementPropertyListeners(element);
        } else if (element.toolType === 'annotation') {
            this.setupAnnotationPropertyListeners(element);
        } else if (element.toolType === 'textleader' || element.type === 'textleader') {
            this.setupTextLeaderPropertyListeners(element);
        }
    }
    
    /**
     * Détermine si une propriété est éditable
     */
    isEditableProperty(key) {
        return ['Taille du texte', 'Hauteur du texte', 'Taille des flèches', 'Épaisseur des lignes'].includes(key);
    }
    
    /**
     * Détermine si une propriété d'annotation est éditable
     */
    isEditableAnnotationProperty(key) {
        return ['Texte', 'Sous-type', 'Taille'].includes(key);
    }

    /**
     * Détermine si une propriété est éditable pour les textes avec ligne d'attache
     */
    isEditableTextLeaderProperty(key) {
        return ['Texte', 'Style', 'Taille', 'Couleur', 'Style de ligne'].includes(key);
    }
    
    /**
     * Configure les écouteurs pour les propriétés des cotations
     */
    setupMeasurementPropertyListeners(element) {
        const propertyInputs = document.querySelectorAll('.property-input');
        
                
        propertyInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const property = e.target.getAttribute('data-property');
                const newValue = parseFloat(e.target.value);
                
                console.log(`📏 Modification propriété cotation: ${property} = ${newValue}`);
                
                // Vérifier si MeasurementTool est disponible
                if (!window.MeasurementTool) {
                    console.error('❌ MeasurementTool non disponible');
                    return;
                }
                
                // Mettre à jour les propriétés de l'outil de mesure
                const properties = {};
                
                // Mapper les noms des propriétés
                switch(property) {
                    case 'Taille du texte':
                        properties.textScale = newValue;
                        break;
                    case 'Hauteur du texte':
                        properties.textHeight = newValue;
                        break;
                    case 'Taille des flèches':
                        properties.arrowSize = newValue;
                        break;
                    case 'Épaisseur des lignes':
                        properties.lineWidth = newValue;
                        break;
                }
                
                // console.log('🔧 Propriétés à appliquer:', properties);
                
                // Appliquer les nouvelles propriétés
                try {
                    window.MeasurementTool.updateAppearanceProperties(properties);
                    console.log('✅ Propriétés appliquées avec succès');
                } catch(error) {
                    console.error('❌ Erreur lors de la mise à jour des propriétés:', error);
                }
            });
            
            // Valider la saisie en temps réel
            input.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (value < 0.1) {
                    e.target.value = 0.1;
                }
            });
        });
    }
    
    /**
     * Configure les écouteurs pour les propriétés des annotations
     */
    setupAnnotationPropertyListeners(element) {
        // Écouteurs pour les champs texte
        const textInputs = document.querySelectorAll('.property-input-text');
        const selectInputs = document.querySelectorAll('.property-input-select');
        
                
        // Gérer les champs texte (pour le contenu)
        textInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const property = e.target.getAttribute('data-property');
                const newValue = e.target.value;
                
                console.log(`📝 Modification propriété annotation: ${property} = "${newValue}"`);
                
                // Vérifier si l'outil d'annotation est disponible
                if (!window.AnnotationTool) {
                    console.error('❌ AnnotationTool non disponible');
                    return;
                }
                
                // Mettre à jour le contenu de l'annotation
                try {
                    if (property === 'Texte') {
                        // Passer l'élément complet au lieu de element.data
                        window.AnnotationTool.updateAnnotationText(element, newValue);
                        console.log('✅ Texte de l\'annotation mis à jour avec succès');
                    }
                } catch(error) {
                    console.error('❌ Erreur lors de la mise à jour du texte:', error);
                }
            });
        });
        
        // Gérer les sélecteurs (pour sous-type et taille)
        selectInputs.forEach(select => {
            select.addEventListener('change', (e) => {
                const property = e.target.getAttribute('data-property');
                const newValue = e.target.value;
                
                console.log(`📝 Modification propriété annotation: ${property} = "${newValue}"`);
                
                // Vérifier si l'outil d'annotation est disponible
                if (!window.AnnotationTool) {
                    console.error('❌ AnnotationTool non disponible');
                    return;
                }
                
                // Mettre à jour les propriétés de l'annotation
                try {
                    if (property === 'Sous-type') {
                        window.AnnotationTool.updateAnnotationSubType(element, newValue);
                        console.log('✅ Sous-type de l\'annotation mis à jour avec succès');
                    } else if (property === 'Taille') {
                        window.AnnotationTool.updateAnnotationSize(element, newValue);
                        console.log('✅ Taille de l\'annotation mise à jour avec succès');
                    }
                } catch(error) {
                    console.error('❌ Erreur lors de la mise à jour de la propriété:', error);
                }
            });
        });
    }

    /**
     * Configure les écouteurs pour les propriétés des textes avec ligne d'attache
     */
    setupTextLeaderPropertyListeners(element) {
        // Écouteurs pour les champs texte et sélecteurs
        const textInputs = document.querySelectorAll('.property-input-text');
        const selectInputs = document.querySelectorAll('.property-input-select');
        
                
        // Gérer les champs texte (pour le contenu)
        textInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const property = e.target.getAttribute('data-property');
                const newValue = e.target.value;
                
                console.log(`📝 Modification propriété texte avec ligne d'attache: ${property} = "${newValue}"`);
                
                // Vérifier si l'outil TextLeader est disponible
                if (!window.TextLeaderTool) {
                    console.error('❌ TextLeaderTool non disponible');
                    return;
                }
                
                // Mettre à jour le contenu du texte avec ligne d'attache
                try {
                    if (property === 'Texte') {
                        // Trouver l'annotation dans TextLeaderTool par ID
                        const annotation = window.TextLeaderTool.textAnnotations.find(a => a.id == element.data.id);
                        if (annotation) {
                            window.TextLeaderTool.updateTextAnnotation(annotation, { text: newValue });
                            console.log('✅ Texte du texte avec ligne d\'attache mis à jour avec succès');
                        }
                    }
                } catch(error) {
                    console.error('❌ Erreur lors de la mise à jour du texte:', error);
                }
            });
        });
        
        // Gérer les sélecteurs (pour style, taille, couleur)
        selectInputs.forEach(select => {
            select.addEventListener('change', (e) => {
                const property = e.target.getAttribute('data-property');
                const newValue = e.target.value;
                
                console.log(`📝 Modification propriété texte avec ligne d'attache: ${property} = "${newValue}"`);
                
                // Vérifier si l'outil TextLeader est disponible
                if (!window.TextLeaderTool) {
                    console.error('❌ TextLeaderTool non disponible');
                    return;
                }
                
                // Mettre à jour les propriétés du texte avec ligne d'attache
                try {
                    const annotation = window.TextLeaderTool.textAnnotations.find(a => a.id == element.data.id);
                    if (annotation) {
                        if (property === 'Style') {
                            window.TextLeaderTool.updateTextAnnotation(annotation, { style: newValue });
                            console.log('✅ Style du texte avec ligne d\'attache mis à jour avec succès');
                        } else if (property === 'Taille') {
                            window.TextLeaderTool.updateTextAnnotation(annotation, { size: newValue });
                            console.log('✅ Taille du texte avec ligne d\'attache mise à jour avec succès');
                        } else if (property === 'Couleur') {
                            window.TextLeaderTool.updateTextAnnotation(annotation, { color: newValue });
                            console.log('✅ Couleur du texte avec ligne d\'attache mise à jour avec succès');
                        } else if (property === 'Style de ligne') {
                            window.TextLeaderTool.updateTextAnnotation(annotation, { lineStyle: newValue });
                            console.log('✅ Style de ligne du texte avec ligne d\'attache mis à jour avec succès');
                        }
                    }
                } catch(error) {
                    console.error('❌ Erreur lors de la mise à jour de la propriété:', error);
                }
            });
        });
    }
    
    /**
     * Affiche les propriétés standard pour les éléments de construction
     * @param {Object} element - L'élément de construction
     */
    displayStandardProperties(element) {
        const selectedElementProperties = document.getElementById('selectedElementProperties');
        if (!selectedElementProperties) return;

        // Gestion spéciale pour les modèles GLB
        if (element.type === 'glb' || element.isGLBModel) {
            this.displayGLBProperties(element);
            return;
        }
        
        selectedElementProperties.innerHTML = `
            <div class="element-info selected" data-type="construction">
                <h4>Propriétés - Élément de construction</h4>
                <div class="property-row">
                    <strong>Type:</strong> 
                    <span>${element.type || 'Inconnu'}</span>
                </div>
                <div class="property-row">
                    <strong>ID:</strong> 
                    <span class="property-value-id">${element.userData?.elementId || element.id || 'N/A'}</span>
                </div>
                <div class="property-row">
                    <strong>Dimensions:</strong> 
                    <span>${element.dimensions ? 
                        `${element.dimensions.length}×${element.dimensions.width}×${element.dimensions.height} cm` : 
                        'N/A'}</span>
                </div>
                <div class="property-row">
                    <strong>Position:</strong> 
                    <span class="property-value-coordinates">${element.position ? 
                        `X:${element.position.x.toFixed(1)} Y:${element.position.y.toFixed(1)} Z:${element.position.z.toFixed(1)}` : 
                        'N/A'}</span>
                </div>
            </div>
        `;
    }
    
    /**
     * Affiche les propriétés spécifiques pour les modèles GLB
     * @param {Object} element - Le modèle GLB
     */
    displayGLBProperties(element) {
        const selectedElementProperties = document.getElementById('selectedElementProperties');
        if (!selectedElementProperties) return;

        // Calculer les informations additionnelles
        const fileName = element.glbFileName || element.userData?.fileName || element.name || 'Modèle inconnu';
        const modelName = fileName.replace(/\.[^/.]+$/, ""); // Enlever l'extension
        const importDate = element.userData?.importedAt ? 
            new Date(element.userData.importedAt).toLocaleDateString('fr-FR') : 'N/A';
        
        // Dimensions à partir de la bounding box ou des propriétés dimensions
        let dimensionsText = 'N/A';
        if (element.dimensions) {
            dimensionsText = `${element.dimensions.length}×${element.dimensions.width}×${element.dimensions.height} cm`;
        } else if (element.boundingBox) {
            const box = element.boundingBox;
            const length = Math.round((box.max.x - box.min.x) * 10) / 10;
            const width = Math.round((box.max.z - box.min.z) * 10) / 10;
            const height = Math.round((box.max.y - box.min.y) * 10) / 10;
            dimensionsText = `${length}×${width}×${height} cm`;
        }
        
        // Volume et masse
        const volume = element.getVolume ? element.getVolume().toFixed(4) : 'N/A';
        const mass = element.getMass ? element.getMass().toFixed(2) : 'N/A';
        
        // Échelle
        const scaleText = element.scale ? 
            `${element.scale.x.toFixed(2)}×${element.scale.y.toFixed(2)}×${element.scale.z.toFixed(2)}` : 
            '1.00×1.00×1.00';

        selectedElementProperties.innerHTML = `
            <div class="element-info selected" data-type="glb">
                <h4>🎯 Propriétés - Modèle 3D (GLB)</h4>
                <div class="property-row">
                    <strong>Nom du modèle:</strong> 
                    <span style="color: var(--accent-color); font-weight: 600;">${modelName}</span>
                </div>
                <div class="property-row">
                    <strong>Fichier:</strong> 
                    <span class="property-value-id">${fileName}</span>
                </div>
                <div class="property-row">
                    <strong>ID:</strong> 
                    <span class="property-value-id">${element.id || 'N/A'}</span>
                </div>
                <div class="property-row">
                    <strong>Dimensions:</strong> 
                    <span>${dimensionsText}</span>
                </div>
                <div class="property-row">
                    <strong>Position:</strong> 
                    <span class="property-value-coordinates">${element.position ? 
                        `X:${element.position.x.toFixed(1)} Y:${element.position.y.toFixed(1)} Z:${element.position.z.toFixed(1)}` : 
                        'N/A'}</span>
                </div>
                <div class="property-row">
                    <strong>Échelle:</strong> 
                    <span>${scaleText}</span>
                </div>
                <div class="property-row">
                    <strong>Volume:</strong> 
                    <span style="color: var(--success-color);">${volume} m³</span>
                </div>
                <div class="property-row">
                    <strong>Masse:</strong> 
                    <span>${mass} kg</span>
                </div>
                <div class="property-row">
                    <strong>Date d'import:</strong> 
                    <span>${importDate}</span>
                </div>
                <div class="property-row">
                    <strong>Rotation:</strong> 
                    <span class="property-value-coordinates">${element.rotation ? 
                        `X:${(element.rotation.x * 180 / Math.PI).toFixed(1)}° Y:${(element.rotation.y * 180 / Math.PI).toFixed(1)}° Z:${(element.rotation.z * 180 / Math.PI).toFixed(1)}°` : 
                        'N/A'}</span>
                </div>
            </div>
        `;
    }

    /**
     * Détermine la classe CSS appropriée selon le type de valeur
     * @param {string} key - Clé de la propriété
     * @param {string} value - Valeur de la propriété
     * @returns {string} Classe CSS
     */
    getValueClass(key, value) {
        if (key.toLowerCase().includes('position') || key.toLowerCase().includes('point')) {
            return 'property-value-coordinates';
        } else if (key.toLowerCase().includes('distance') || key.toLowerCase().includes('longueur')) {
            return 'property-value-distance';
        } else if (key.toLowerCase() === 'id') {
            return 'property-value-id';
        }
        return '';
    }
    
    /**
     * Affiche les contrôles de joints pour l'élément sélectionné
     * @param {Object} element - L'élément sélectionné
     */
    showJointsControlsForElement(element) {
        // console.log('🔗 TabManager: Affichage des contrôles de joints pour:', element);
        
        const jointsControlGroup = document.getElementById('jointsControlGroup');
        if (!jointsControlGroup) {
            console.warn('❌ Groupe de contrôles de joints non trouvé');
            return;
        }
        
        // Stocker la référence à l'élément actuel
        this.currentSelectedElement = element;
        
        // Trouver les joints associés à cet élément
        const associatedJoints = this.findAssociatedJointsForElement(element);
        // console.log(`🔗 Joints associés trouvés: ${associatedJoints.length}`, associatedJoints);
        
        // Mettre à jour l'état des checkboxes selon les joints existants
        this.updateJointCheckboxes(associatedJoints);
        
        // Afficher le groupe de contrôles
        jointsControlGroup.style.display = 'block';
    }
    
    /**
     * Cache les contrôles de joints si aucun élément approprié n'est sélectionné
     */
    hideJointsControlsIfNeeded() {
        const jointsControlGroup = document.getElementById('jointsControlGroup');
        if (jointsControlGroup) {
            jointsControlGroup.style.display = 'none';
        }
        this.currentSelectedElement = null;
    }
    
    /**
     * Trouve les joints associés à un élément donné
     * @param {Object} element - L'élément pour lequel chercher les joints
     * @returns {Array} Liste des joints associés
     */
    findAssociatedJointsForElement(element) {
        if (!window.SceneManager || !window.SceneManager.scene) {
            return [];
        }
        
        const elementId = element.userData?.elementId || element.id;
        if (!elementId) {
            console.warn('❌ Aucun ID trouvé pour l\'élément');
            return [];
        }
        
        const associatedJoints = [];
        
        // Parcourir tous les objets de la scène pour trouver les joints associés
        window.SceneManager.scene.traverse((object) => {
            if (object.type === 'Mesh' && object !== element) {
                const userData = object.userData || {};
                const elementData = userData.element || {};
                
                // Vérifier si c'est un joint
                const isJoint = userData.type === 'joint' || 
                               userData.isVerticalJoint === true || 
                               userData.isHorizontalJoint === true ||
                               elementData.type === 'joint' || 
                               elementData.isVerticalJoint === true || 
                               elementData.isHorizontalJoint === true;
                
                if (isJoint) {
                    // Vérifier si ce joint est associé à notre élément
                    let jointParentId = userData.parentElementId || 
                                       elementData.parentElementId ||
                                       object.parentElementId;
                    
                    // Recherche étendue dans la structure WallElement
                    if (!jointParentId && userData.element && typeof userData.element === 'object') {
                        const wallElement = userData.element;
                        jointParentId = wallElement.parentElementId || 
                                       wallElement.parentId ||
                                       (wallElement.userData && wallElement.userData.parentElementId);
                    }
                    
                    if (jointParentId === elementId) {
                        // Déterminer le type de joint
                        let jointType = 'unknown';
                        if (userData.isVerticalJoint || elementData.isVerticalJoint) {
                            // Différencier gauche/droite selon la position relative
                            const elementCenter = element.position;
                            const jointCenter = object.position;
                            
                            if (jointCenter.x < elementCenter.x) {
                                jointType = 'left';
                            } else if (jointCenter.x > elementCenter.x) {
                                jointType = 'right';
                            } else {
                                jointType = 'vertical';
                            }
                        } else if (userData.isHorizontalJoint || elementData.isHorizontalJoint) {
                            jointType = 'horizontal';
                        }
                        
                        associatedJoints.push({
                            object: object,
                            type: jointType,
                            visible: object.visible,
                            id: userData.elementId || elementData.elementId || object.name
                        });
                    }
                }
            }
        });
        
        return associatedJoints;
    }
    
    /**
     * Met à jour l'état des checkboxes selon les joints existants
     * @param {Array} associatedJoints - Liste des joints associés
     */
    updateJointCheckboxes(associatedJoints) {
        const enableJointLeft = document.getElementById('enableJointLeft');
        const enableJointRight = document.getElementById('enableJointRight');
        const enableJointHorizontal = document.getElementById('enableJointHorizontal');
        
        // Réinitialiser les checkboxes
        if (enableJointLeft) enableJointLeft.checked = false;
        if (enableJointRight) enableJointRight.checked = false;
        if (enableJointHorizontal) enableJointHorizontal.checked = false;
        
        // Mettre à jour selon les joints existants et leur visibilité
        associatedJoints.forEach(joint => {
            switch (joint.type) {
                case 'left':
                    this.updateToggleState('left', joint.visible);
                    break;
                case 'right':
                    this.updateToggleState('right', joint.visible);
                    break;
                case 'horizontal':
                    this.updateToggleState('horizontal', joint.visible);
                    break;
            }
        });
        
        // Si aucun joint associé, désactiver tous les toggles
        if (associatedJoints.length === 0) {
            this.updateToggleState('left', false);
            this.updateToggleState('right', false);
            this.updateToggleState('horizontal', false);
        }
    }

    /**
     * Met à jour l'état d'un toggle selon l'état réel des joints
     */
    updateToggleState(jointType, isVisible) {
        const toggle = document.querySelector(`[data-joint="${jointType}"] .toggle-switch`);
        if (toggle) {
            if (isVisible) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        }
    }

    /**
     * Synchronise l'état des toggles avec l'état réel des joints au démarrage
     */
    syncJointTogglesWithRealState() {
        if (!this.currentSelectedElement) {
            // Si aucun élément sélectionné, désactiver tous les toggles
            this.updateToggleState('left', false);
            this.updateToggleState('right', false);
            this.updateToggleState('horizontal', false);
            return;
        }

        // Trouver les joints associés à l'élément actuel
        const associatedJoints = this.findAssociatedJointsForElement(this.currentSelectedElement);
        
        // Réinitialiser tous les toggles
        this.updateToggleState('left', false);
        this.updateToggleState('right', false);
        this.updateToggleState('horizontal', false);
        
        // Mettre à jour selon les joints existants et leur visibilité
        associatedJoints.forEach(joint => {
            switch (joint.type) {
                case 'left':
                    this.updateToggleState('left', joint.visible);
                    break;
                case 'right':
                    this.updateToggleState('right', joint.visible);
                    break;
                case 'horizontal':
                    this.updateToggleState('horizontal', joint.visible);
                    break;
            }
        });
        
        console.log(`🔧 Synchronisation toggles: ${associatedJoints.length} joints trouvés`);
    }
    
    /**
     * Applique les modifications de visibilité des joints
     */
    applyJointVisibilityChanges() {
        if (!this.currentSelectedElement) {
            console.warn('❌ Aucun élément sélectionné pour appliquer les modifications de joints');
            return;
        }
        
        console.log('🔧 Application des modifications de visibilité des joints...');
        
        // Récupérer les états des toggles modernes
        const leftToggle = document.querySelector('[data-joint="left"] .toggle-switch');
        const rightToggle = document.querySelector('[data-joint="right"] .toggle-switch');
        const horizontalToggle = document.querySelector('[data-joint="horizontal"] .toggle-switch');
        
        // Récupérer les états des toggles
        const jointStates = {
            left: leftToggle ? leftToggle.classList.contains('active') : false,
            right: rightToggle ? rightToggle.classList.contains('active') : false,
            horizontal: horizontalToggle ? horizontalToggle.classList.contains('active') : true
        };
        
        console.log('🔧 États des joints demandés:', jointStates);
        
        // Trouver les joints associés existants
        const associatedJoints = this.findAssociatedJointsForElement(this.currentSelectedElement);
        let modifiedCount = 0;
        
        // Créer un map des joints existants par type
        const existingJoints = {};
        associatedJoints.forEach(joint => {
            existingJoints[joint.type] = joint;
        });
        
        // Traiter chaque type de joint
        Object.keys(jointStates).forEach(jointType => {
            const shouldBeVisible = jointStates[jointType];
            const existingJoint = existingJoints[jointType];
            
            if (shouldBeVisible && !existingJoint) {
                // Créer le joint s'il n'existe pas et qu'il est demandé
                console.log(`🔧 Création du joint ${jointType} pour l'élément ${this.currentSelectedElement.id}`);
                
                if (jointType === 'left' && window.ConstructionTools) {
                    window.ConstructionTools.createSpecificVerticalJoint(this.currentSelectedElement, 'left');
                    modifiedCount++;
                } else if (jointType === 'right' && window.ConstructionTools) {
                    window.ConstructionTools.createSpecificVerticalJoint(this.currentSelectedElement, 'right');
                    modifiedCount++;
                } else if (jointType === 'horizontal' && window.SceneManager) {
                    window.SceneManager.createAutomaticHorizontalJoint(this.currentSelectedElement);
                    modifiedCount++;
                }
            } else if (existingJoint) {
                // Modifier la visibilité du joint existant
                if (existingJoint.object.visible !== shouldBeVisible) {
                    existingJoint.object.visible = shouldBeVisible;
                    
                    // Ajouter une classe CSS pour indication visuelle
                    if (existingJoint.object.material) {
                        if (shouldBeVisible) {
                            existingJoint.object.material.opacity = 1.0;
                            existingJoint.object.material.transparent = false;
                        } else {
                            existingJoint.object.material.opacity = 0.1;
                            existingJoint.object.material.transparent = true;
                        }
                    }
                    
                    modifiedCount++;
                    console.log(`🔧 Joint ${jointType} (${existingJoint.id}): visibilité = ${shouldBeVisible}`);
                }
            }
        });
        
        // Afficher un message de confirmation
        if (modifiedCount > 0) {
            this.showNotification(`${modifiedCount} joint(s) modifié(s)`, 'success');
            
            // Redessiner la scène si nécessaire
            if (window.SceneManager && window.SceneManager.render) {
                window.SceneManager.render();
            }
        } else {
            this.showNotification('Aucune modification nécessaire', 'info');
        }
    }
    
    /**
     * Affiche une notification temporaire
     * @param {string} message - Le message à afficher
     * @param {string} type - Le type de notification ('success', 'error', 'info')
     */
    showNotification(message, type = 'info') {
        // Créer ou récupérer l'élément de notification
        let notification = document.getElementById('jointsNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'jointsNotification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 6px;
                color: white;
                font-weight: 600;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(notification);
        }
        
        // Définir le style selon le type
        const colors = {
            success: 'background: linear-gradient(135deg, #28a745, #20c997);',
            error: 'background: linear-gradient(135deg, #dc3545, #fd7e14);',
            info: 'background: linear-gradient(135deg, #007bff, #6610f2);'
        };
        
        notification.style.cssText += colors[type] || colors.info;
        notification.textContent = message;
        
        // Afficher la notification
        notification.style.opacity = '1';
        
        // Masquer après 3 secondes
        setTimeout(() => {
            notification.style.opacity = '0';
        }, 3000);
    }

    // === GESTION DES ÉLÉMENTS À RÉUTILISER ===
    setupReusableElements() {
        // Configuration initiale des éléments à réutiliser
        this.updateReusableElementsDisplay();
    }

    // Méthode pour ajouter un élément utilisé
    addUsedElement(elementType, elementData) {
        // Déterminer le type réel d'élément
        let realElementType = elementType;
        
        // Si le premier paramètre est déjà un type spécifique (M65, B19, etc.), l'utiliser directement
        if (elementType && elementType !== 'brick' && elementType !== 'block') {
            realElementType = elementType.split('_')[0]; // Enlever suffixe coupe si présent
            // console.log(`✅ Type spécifique déjà fourni: ${realElementType}`);
        }
        // Si c'est un type générique, essayer de récupérer le type spécifique
        else if (elementType === 'brick') {
            // console.log(`🧱 Type générique 'brick' détecté, recherche du type spécifique...`);
            
            // D'abord essayer depuis elementData.specificType
            if (elementData && elementData.specificType && elementData.specificType !== 'brick') {
                realElementType = elementData.specificType.split('_')[0]; // Enlever suffixe coupe si présent
                console.log(`✅ Type spécifique trouvé dans elementData.specificType: ${realElementType}`);
            }
            // Puis depuis BrickSelector
            else if (window.BrickSelector && window.BrickSelector.getCurrentType) {
                const currentBrickType = window.BrickSelector.getCurrentType();
                if (currentBrickType) {
                    realElementType = currentBrickType.split('_')[0];
                }
            }
            
        } else if (elementType === 'block') {
            console.log(`🧊 Type générique 'block' détecté, recherche du type spécifique...`);
            
            // D'abord essayer depuis elementData.specificType
            if (elementData && elementData.specificType && elementData.specificType !== 'block') {
                realElementType = elementData.specificType.split('_')[0]; // Enlever suffixe coupe si présent
                console.log(`✅ Type spécifique trouvé dans elementData.specificType: ${realElementType}`);
            }
            // Puis depuis BlockSelector
            else if (window.BlockSelector && window.BlockSelector.getCurrentType) {
                const currentBlockType = window.BlockSelector.getCurrentType();
                console.log(`🔍 BlockSelector.getCurrentType() retourne: ${currentBlockType}`);
                if (currentBlockType) {
                    realElementType = currentBlockType.split('_')[0];
                    console.log(`✅ Type bloc réel récupéré: ${realElementType} (depuis ${currentBlockType})`);
                }
            } else {
                // BlockSelector non disponible ou pas de type spécifique trouvé
            }
        } else {
            // Type autre utilisé tel quel
        }
        
        const category = this.getCategoryFromType(realElementType);
        
        // CORRECTION: Détecter la coupe depuis le type avec suffixe (ex: M65_HALF -> 1/2)
        let cutType = elementData.cut || '1/1';
        if (elementType && elementType.includes('_')) {
            const suffix = elementType.split('_')[1];
            const suffixToCut = {
                'HALF': '1/2',
                '3Q': '3/4',
                '1Q': '1/4',
                'P': 'P'
            };
            if (suffixToCut[suffix]) {
                cutType = suffixToCut[suffix];
            }
        }
        
        const key = `${realElementType}_${cutType}`;
        
        // Vérification finale - si on a toujours un type générique, c'est un problème
        if (realElementType === 'brick' || realElementType === 'block') {
            console.warn(`⚠️ ATTENTION: Type toujours générique (${realElementType}), cela va causer des problèmes d'affichage !`);
        }
        
        if (this.reusableElements[category].has(key)) {
            // Incrémenter le compteur
            const existing = this.reusableElements[category].get(key);
            existing.count++;
            existing.lastUsed = new Date();
        } else {
            // Préparer les dimensions de manière cohérente
            let dimensionsText = '';
            if (elementData.dimensions) {
                if (typeof elementData.dimensions === 'string') {
                    dimensionsText = elementData.dimensions;
                } else if (typeof elementData.dimensions === 'object' && elementData.dimensions.length !== undefined) {
                    dimensionsText = `${elementData.dimensions.length}×${elementData.dimensions.width}×${elementData.dimensions.height} cm`;
                }
            }
            
            // Ajouter un nouvel élément
            this.reusableElements[category].set(key, {
                type: realElementType,
                cut: cutType,
                dimensions: dimensionsText,
                count: 1,
                firstUsed: new Date(),
                lastUsed: new Date(),
                data: elementData
            });
        }
        
        // 🔧 CORRECTION: Toujours mettre à jour l'affichage, pas seulement sur l'onglet reutiliser
        // car les éléments à réutiliser s'affichent aussi dans l'onglet Outils
        this.updateReusableElementsDisplay();
        
        // Toujours mettre à jour les statistiques
        this.updateReuseStats();
        
        // console.log(`📦 TabManager: Élément ajouté aux réutilisables: ${key}`, {
        //     category: category,
        //     type: realElementType,
        //     cut: elementData.cut,
        //     totalInCategory: this.reusableElements[category].size
        // });
    }

    // Déterminer la catégorie d'un type d'élément
    getCategoryFromType(elementType) {
        // Types spécifiques
        if (elementType.startsWith('M')) return 'briques';
        if (elementType.startsWith('B') || elementType.startsWith('BC') || elementType.startsWith('ARGEX')) return 'blocs';
        if (elementType.startsWith('L') || elementType.startsWith('PUR') || elementType.startsWith('LAINE')) return 'autres';
        
        // Types génériques
        if (elementType === 'brick') return 'briques';
        if (elementType === 'block') return 'blocs';
        
        return 'autres';
    }

    // 📦 Gérer le placement d'un élément pour l'ajouter aux éléments réutilisables
    handleElementPlaced(element) {
        if (!element) {
            console.warn('❌ Élément non défini dans handleElementPlaced');
            return;
        }

        // Détection spéciale pour les éléments GLB
        if (element.type === 'glb' || element.name?.startsWith('GLB_') || 
            (element.userData && element.userData.isGLB)) {
            
            // Récupérer les informations GLB depuis lastPlacedGLBInfo
            const glbInfo = window.lastPlacedGLBInfo;
            if (glbInfo) {
                this.addUsedGLBElement(glbInfo);
            } else {
                // Informations GLB non trouvées pour élément placé
            }
            return;
        }

        // Éviter les traitements en double pour les éléments non-GLB pendant le placement GLB
        if (window.isPlacingGLB) {
            console.log('⏳ Placement GLB en cours, ignorer traitement double pour éléments non-GLB');
            return;
        }

        // Pour les autres types d'éléments (briques, blocs, etc.)
        // CORRECTION: Utiliser element.blockType qui contient le type spécifique avec coupe (ex: M65_HALF)
        // au lieu de element.type qui contient le type générique (ex: brick)
        const elementType = element.blockType || element.type;
        if (elementType) {
            const elementData = {
                cut: element.cut || '1/1',
                dimensions: element.dimensions || {
                    length: element.length || 0,
                    width: element.width || 0, 
                    height: element.height || 0
                }
            };
            
            this.addUsedElement(elementType, elementData);
        } else {
            console.warn('⚠️ Type d\'élément non défini:', element);
        }
    }

    // 📦 Ajouter un élément GLB aux éléments réutilisables
    addUsedGLBElement(glbInfo) {
        
        const key = `${glbInfo.type}_${glbInfo.lengthValue || '300'}`;
        
        if (this.reusableElements.glb.has(key)) {
            // Incrémenter le compteur
            const existing = this.reusableElements.glb.get(key);
            existing.count++;
            existing.lastUsed = new Date();
        } else {
            // Ajouter un nouvel élément GLB
            this.reusableElements.glb.set(key, {
                type: glbInfo.type,
                name: glbInfo.name,
                path: glbInfo.path,
                scale: glbInfo.scale,
                lengthValue: glbInfo.lengthValue,
                dimensions: `Longueur: ${glbInfo.lengthValue || '300'}cm`,
                count: 1,
                firstUsed: new Date(),
                lastUsed: new Date(),
                data: glbInfo
            });
        }
        
        // Mettre à jour l'affichage avec debounce pour éviter les appels excessifs
        this.debouncedUpdateReusableElements();
        this.updateReuseStats();
    }

    // Fonction debounced pour éviter les mises à jour excessives
    debouncedUpdateReusableElements() {
        if (this.updateReusableTimeout) {
            clearTimeout(this.updateReusableTimeout);
        }
        
        this.updateReusableTimeout = setTimeout(() => {
            this.updateReusableElementsDisplay();
        }, 500); // Attendre 500ms avant de mettre à jour (plus long pour éviter les pics)
    }

    // Actualiser l'affichage des éléments à réutiliser
    refreshReusableElements() {
        this.updateReusableElementsDisplay();
        
        // Synchroniser avec le panneau d'outils
        if (window.toolsReusablePanel) {
            window.toolsReusablePanel.refresh();
        }
        
        this.showNotification('Liste des éléments actualisée', 'success');
    }

    // Vider la liste des éléments à réutiliser
    clearReusableElements() {
        this.reusableElements.briques.clear();
        this.reusableElements.blocs.clear();
        this.reusableElements.glb.clear(); // Nouveau: vider les GLB
        this.reusableElements.autres.clear();
        this.updateReusableElementsDisplay();
        
        // Synchroniser avec le panneau d'outils
        if (window.toolsReusablePanel) {
            window.toolsReusablePanel.refresh();
        }
        
        this.showNotification('Liste des éléments vidée', 'info');
    }

    // Mettre à jour l'affichage des éléments à réutiliser
    updateReusableElementsDisplay() {
        // console.log('🔄 Mise à jour affichage éléments à réutiliser...');
        // console.log('États des éléments:', {
        //     briques: this.reusableElements.briques.size,
        //     blocs: this.reusableElements.blocs.size,
        //     glb: this.reusableElements.glb.size,
        //     autres: this.reusableElements.autres.size
        // });
        
        this.updateReuseCategory('briques', 'reused-bricks');
        this.updateReuseCategory('blocs', 'reused-blocks');
        this.updateReuseCategory('glb', 'reused-glb'); // Nouveau: catégorie GLB
        this.updateReuseCategory('autres', 'reused-others');
        this.updateReuseStats();
        
        // Synchroniser avec le panneau d'outils après un délai pour permettre au DOM de se mettre à jour
        setTimeout(() => {
            if (window.toolsReusablePanel) {
                window.toolsReusablePanel.refresh();
            }
        }, 100);
    }

    // Mettre à jour une catégorie d'éléments à réutiliser
    updateReuseCategory(category, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`❌ Container ${containerId} non trouvé`);
            return;
        }

        const elements = this.reusableElements[category];
        
        if (elements.size === 0) {
            // Afficher le placeholder
            let placeholderText = '';
            let descriptionText = '';
            
            switch(category) {
                case 'briques':
                    placeholderText = 'Aucune brique utilisée pour le moment.';
                    descriptionText = 'Les briques que vous placez apparaîtront ici pour être réutilisées.';
                    break;
                case 'blocs':
                    placeholderText = 'Aucun bloc utilisé pour le moment.';
                    descriptionText = 'Les blocs que vous placez apparaîtront ici pour être réutilisés.';
                    break;
                case 'glb':
                    placeholderText = 'Aucun élément GLB utilisé pour le moment.';
                    descriptionText = 'Les hourdis et autres éléments 3D apparaîtront ici pour être réutilisés.';
                    break;
                default:
                    placeholderText = 'Aucun élément utilisé pour le moment.';
                    descriptionText = `Les ${category} que vous placez apparaîtront ici pour être réutilisés.`;
            }
            
            container.innerHTML = `
                <div class="reuse-placeholder">
                    <i class="fas fa-info-circle"></i>
                    <p>${placeholderText}</p>
                    <small>${descriptionText}</small>
                </div>
            `;
        } else {
            // Afficher les éléments
            container.innerHTML = '';
            elements.forEach((element, key) => {
                const reuseItem = this.createReuseItem(element, key);
                container.appendChild(reuseItem);
            });
        }
    }

    // Créer un élément HTML pour un élément réutilisable
    createReuseItem(element, key) {
        const item = document.createElement('div');
        item.className = 'reuse-item';
        item.dataset.key = key;
        
        const timeSinceLastUse = this.getTimeSinceLastUse(element.lastUsed);
        const icon = this.getElementIcon(element.type);
        
        // Pour les éléments GLB, utiliser le nom personnalisé avec la longueur
        let displayName;
        if (element.type && element.type.includes('hourdis') && element.lengthValue) {
            displayName = `Hourdis 13 (${element.lengthValue}cm)`;
        } else {
            displayName = this.getElementDisplayName(element.type, element.cut);
        }
        
        // Déterminer si cet élément peut avoir des coupes (briques et blocs principalement)
        const canHaveCuts = this.canElementHaveCuts(element.type);
        
        // Formater les dimensions correctement
        let dimensionsText = 'Dimensions non spécifiées';
        if (element.dimensions) {
            if (typeof element.dimensions === 'string') {
                dimensionsText = element.dimensions;
            } else if (typeof element.dimensions === 'object' && element.dimensions.length !== undefined) {
                // Si c'est un objet avec les propriétés length, width, height
                dimensionsText = `${element.dimensions.length}×${element.dimensions.width}×${element.dimensions.height} cm`;
            }
        }
        
        item.innerHTML = `
            <div class="reuse-item-header">
                <div class="reuse-item-name">${displayName}</div>
                <div class="reuse-item-count">${element.count}</div>
            </div>
            <div class="reuse-item-dimensions">${dimensionsText}</div>
            <div class="reuse-item-preview" id="preview-${key}">
                <div class="reuse-preview-fallback">${icon}</div>
            </div>
            ${canHaveCuts ? this.createCutButtons(element.type, element.cut) : ''}
            <div class="reuse-item-last-used">Utilisé ${timeSinceLastUse}</div>
        `;
        
        // Générer l'aperçu 3D après l'ajout au DOM avec limitation
        setTimeout(() => {
            // Traitement spécial pour les éléments GLB avec vérification anti-spam
            if (element.path && element.path.endsWith('.glb')) {
                // Vérifier si un aperçu pour ce type GLB est déjà en cours de génération
                const glbKey = `${element.type}_${element.lengthValue || '300'}`;
                if (!this.pendingGLBPreviews) {
                    this.pendingGLBPreviews = new Set();
                }
                
                if (!this.pendingGLBPreviews.has(glbKey)) {
                    // Vérifier aussi le nombre total de previews en cours
                    if (this.pendingGLBPreviews.size < 3) { // Maximum 3 types GLB en preview simultané
                        this.pendingGLBPreviews.add(glbKey);
                        this.generateGLBPreview(element, `preview-${key}`);
                        
                        // Nettoyer après un délai
                        setTimeout(() => {
                            this.pendingGLBPreviews.delete(glbKey);
                        }, 3000);
                    } else {
                        console.log(`⏳ Trop de types GLB en preview (${this.pendingGLBPreviews.size}), utilisé fallback`);
                        const container = document.getElementById(`preview-${key}`);
                        if (container) {
                            this.showGLBFallbackPreview(container, element);
                        }
                    }
                } else {
                    // Limiter les logs répétitifs - seulement tous les 10 appels
                    if (!this.fallbackLogCount) this.fallbackLogCount = 0;
                    this.fallbackLogCount++;
                    if (this.fallbackLogCount % 10 === 1) {
                        console.log(`⏳ Aperçu GLB pour ${glbKey} déjà en cours, utilisé fallback (x${this.fallbackLogCount})`);
                    }
                    // Utiliser un aperçu fallback immédiat
                    const container = document.getElementById(`preview-${key}`);
                    if (container) {
                        this.showGLBFallbackPreview(container, element);
                    }
                }
            } else {
                this.generate3DPreview(element.type, element.cut, `preview-${key}`);
            }
        }, Math.random() * 500 + 200); // Délai aléatoire plus étalé (200-700ms)
        
        // Ajouter l'événement de clic pour sélectionner l'élément (éviter les boutons de coupe)
        item.addEventListener('click', (e) => {
            // Ignorer le clic s'il vient d'un bouton de coupe
            if (e.target.classList.contains('reuse-cut-btn') || e.target.closest('.reuse-cut-buttons')) {
                return;
            }
            this.selectReusableElement(element, key);
        });
        
        return item;
    }

    // Générer un nom d'affichage descriptif pour un élément
    getElementDisplayName(elementType, cut) {
        // console.log(`🏷️ getElementDisplayName appelée avec:`, { elementType, cut });
        
        let displayName = '';
        
        // === BRIQUES ===
        if (elementType.startsWith('M')) {
            displayName = `Brique ${elementType}`;
            // console.log(`✅ Brique détectée: ${displayName}`);
        }
        // === BLOCS CREUX ===
        else if (elementType.startsWith('B') && !elementType.startsWith('BC') && !elementType.startsWith('BCA')) {
            displayName = `Bloc creux ${elementType}`;
            console.log(`✅ Bloc creux détecté: ${displayName}`);
        }
        // === BLOCS BÉTON CELLULAIRE ===
        else if (elementType.startsWith('BC') || elementType.startsWith('BCA')) {
            displayName = `Béton cellulaire ${elementType}`;
        }
        // === AUTRES BLOCS ===
        else if (elementType.startsWith('TC')) {
            displayName = `Bloc ${elementType}`;
        }
        else if (elementType.startsWith('ARGEX')) {
            displayName = `Bloc Argex ${elementType}`;
        }
        // === ISOLANTS ===
        else if (elementType.startsWith('L') || elementType.startsWith('PUR') || elementType.startsWith('LAINE')) {
            displayName = `Isolant ${elementType}`;
        }
        // === LINTEAUX ===
        else if (elementType.startsWith('LIN')) {
            displayName = `Linteau ${elementType}`;
        }
        // === ÉLÉMENTS GLB ===
        else if (elementType.includes('hourdis')) {
            displayName = `Hourdis ${elementType.replace('hourdis_', '').replace('_', '-')}`;
        }
        else if (elementType.includes('glb') || elementType.startsWith('GLB_')) {
            // Extraire le nom lisible depuis le type GLB
            const cleanName = elementType.replace('GLB_', '').replace('_', ' ');
            displayName = `GLB ${cleanName}`;
        }
        // === TYPES GÉNÉRIQUES (fallback) ===
        else if (elementType === 'brick') {
            displayName = 'Brique';
            console.log(`⚠️ Type générique 'brick' utilisé - problème de détection !`);
        }
        else if (elementType === 'block') {
            displayName = 'Bloc';  
            console.log(`⚠️ Type générique 'block' utilisé - problème de détection !`);
        }
        else {
            displayName = elementType;
            // Type autre utilisé
        }
        
        // Ajouter l'indication de coupe si différente de 1/1
        if (cut && cut !== '1/1') {
            displayName += ` ${cut}`;
        }
        
        // console.log(`🎯 displayName final: ${displayName}`);
        return displayName;
    }

    // Vérifier si un élément peut avoir des coupes
    canElementHaveCuts(elementType) {
        // Les briques (M), blocs (B), béton cellulaire (BC), et Argex peuvent avoir des coupes
        return elementType.startsWith('M') || 
               elementType.startsWith('B') || 
               elementType.startsWith('BC') || 
               elementType.startsWith('ARGEX') ||
               elementType === 'brick' || 
               elementType === 'block';
    }

    // Créer les boutons de coupe pour un élément réutilisable
    createCutButtons(elementType, currentCut) {
        const cuts = ['1/1', '3/4', '1/2', '1/4'];
        const buttonsHtml = cuts.map(cut => {
            const isActive = cut === currentCut ? 'active' : '';
            return `<button class="reuse-cut-btn ${isActive}" 
                           data-cut="${cut}" 
                           data-type="${elementType}"
                           onclick="tabManager.selectReusableCut('${elementType}', '${cut}')"
                           title="Sélectionner coupe ${cut}">
                        ${cut}
                    </button>`;
        }).join('');
        
        return `
            <div class="reuse-cut-buttons">
                <div class="reuse-cut-label">Coupes :</div>
                ${buttonsHtml}
            </div>
        `;
    }

    // Sélectionner une coupe pour un élément réutilisable
    selectReusableCut(elementType, cutType) {
        // console.log(`🔧 Sélection coupe réutilisable: ${elementType} ${cutType}`);
        
        // Mettre à jour uniquement l'affichage des boutons de coupe dans la liste réutilisable
        this.updateReusableCutButtons(elementType, cutType);
        
        // Stocker temporairement la sélection pour l'utilisation ultérieure
        this.pendingReusableSelection = {
            elementType: elementType,
            cutType: cutType,
            timestamp: Date.now()
        };
        
        // Activer l'élément dans le bon sélecteur avec la coupe
        this.activateElementWithCut(elementType, cutType);
        
        // Mettre à jour immédiatement le fantôme avec la nouvelle coupe
        this.updateGhostWithCut(elementType, cutType);
        
        // Mettre à jour l'aperçu dans l'onglet Outils si disponible
        if (window.ToolsTabManager && window.ToolsTabManager.updateActiveElementPreview) {
            setTimeout(() => {
                window.ToolsTabManager.updateActiveElementPreview();
                // Synchroniser aussi les boutons de coupe dans l'onglet Outils
                this.synchronizeToolsCutButtons(cutType);
            }, 100);
        }
        
        // console.log(`🎯 Coupe appliquée immédiatement: ${elementType} ${cutType}`);
    }

    // Activer un élément avec une coupe spécifique dans le bon sélecteur
    activateElementWithCut(elementType, cutType) {
        // Construire le nom final avec coupe
        let finalType = elementType;
        
        if (cutType !== '1/1') {
            const suffixes = {
                '3/4': '_3Q',
                '1/2': '_HALF',
                '1/4': '_1Q'
            };
            if (suffixes[cutType]) {
                finalType = elementType + suffixes[cutType];
            }
        }

        // Appliquer la sélection aux sélecteurs appropriés
        if (elementType.startsWith('M') || elementType.startsWith('WF') || elementType === 'brick') {
            // C'est une brique
            if (window.BrickSelector) {
                window.BrickSelector.setBrick(finalType);
            }
        } else if (elementType.startsWith('B') || elementType.startsWith('TC') || elementType.startsWith('ARGEX')) {
            // C'est un bloc
            if (window.BlockSelector) {
                window.BlockSelector.setBlock(finalType);
            }
        }
    }

    // Mettre à jour les boutons de coupe dans la liste réutilisable
    updateReusableCutButtons(elementType, selectedCut) {
        // console.log(`🔄 Mise à jour des boutons de coupe pour ${elementType}, coupe sélectionnée: ${selectedCut}`);
        
        // Trouver tous les boutons de coupe pour ce type d'élément
        const cutButtons = document.querySelectorAll(`.reuse-cut-btn[data-type="${elementType}"]`);
        
        // console.log(`🔍 Trouvé ${cutButtons.length} boutons de coupe pour ${elementType}`);
        
        // Désactiver tous les boutons pour ce type
        cutButtons.forEach(btn => {
            btn.classList.remove('active');
            // console.log(`🔸 Bouton ${btn.dataset.cut} désactivé`);
        });
        
        // Activer le bouton correspondant à la coupe sélectionnée
        const targetButton = document.querySelector(`.reuse-cut-btn[data-type="${elementType}"][data-cut="${selectedCut}"]`);
        if (targetButton) {
            targetButton.classList.add('active');
            // console.log(`✅ Bouton ${selectedCut} activé pour ${elementType}`);
        } else {
            console.warn(`⚠️ Bouton de coupe ${selectedCut} non trouvé pour ${elementType}`);
        }
    }

    // Obtenir l'icône d'un type d'élément
    getElementIcon(elementType) {
        if (elementType.startsWith('M')) return '🧱';
        if (elementType.startsWith('B')) return '⬜';
        if (elementType.startsWith('BC')) return '⬜';
        if (elementType.startsWith('ARGEX')) return '🟫';
        if (elementType.startsWith('L')) return '🏗️';
        if (elementType.startsWith('PUR')) return '🟡';
        if (elementType.startsWith('LAINE')) return '🧽';
        if (elementType.includes('hourdis')) return '🏗️';
        if (elementType.includes('glb') || elementType.startsWith('GLB_')) return '📦';
        return '📦';
    }

    // Calculer le temps écoulé depuis la dernière utilisation
    getTimeSinceLastUse(lastUsed) {
        const now = new Date();
        const diffMs = now - lastUsed;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        
        if (diffMins < 1) return 'à l\'instant';
        if (diffMins < 60) return `il y a ${diffMins} min`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `il y a ${diffHours}h`;
        
        const diffDays = Math.floor(diffHours / 24);
        return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }

    // Sélectionner un élément réutilisable
    selectReusableElement(element, key) {
        // Désélectionner tous les autres éléments réutilisables
        document.querySelectorAll('.reuse-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Sélectionner l'élément cliqué
        const itemElement = document.querySelector(`[data-key="${key}"]`);
        if (itemElement) {
            itemElement.classList.add('selected');
        }

        // Vérifier s'il y a une coupe pré-sélectionnée pour cet élément
        let selectedCut = element.cut || '1/1';
        
        // Si une coupe a été sélectionnée récemment via les boutons, l'utiliser
        if (this.pendingReusableSelection && 
            this.pendingReusableSelection.elementType === element.type &&
            (Date.now() - this.pendingReusableSelection.timestamp) < 30000) { // 30 secondes
            selectedCut = this.pendingReusableSelection.cutType;
            // Nettoyer la sélection en attente
            delete this.pendingReusableSelection;
        }
        
        // Basculer vers l'onglet bibliothèque pour voir la sélection
        this.switchMainSubTab('bibliotheque');
        
        // Déterminer le type réel et construire le nom final avec coupe
        let realElementType = element.type;
        let finalType = realElementType;
        
        if (selectedCut !== '1/1') {
            const suffixes = {
                '3/4': '_3Q',
                '1/2': '_HALF',
                '1/4': '_1Q'
            };
            if (suffixes[selectedCut]) {
                finalType = realElementType + suffixes[selectedCut];
            }
        }

        // Appliquer la sélection aux sélecteurs appropriés AVEC la coupe finale
        if (realElementType.startsWith('M') || realElementType.startsWith('WF') || realElementType === 'brick') {
            // C'est une brique
            if (window.BrickSelector) {
                // console.log(`🧱 Application de la brique réutilisable: ${finalType}`);
                window.BrickSelector.setBrick(finalType);
            }
        } else if (realElementType.startsWith('B') || realElementType.startsWith('TC') || realElementType.startsWith('ARGEX')) {
            // C'est un bloc
            if (window.BlockSelector) {
                // console.log(`🏗️ Application du bloc réutilisable: ${finalType}`);
                window.BlockSelector.setBlock(finalType);
            }
        } else if (element.elementType === 'glb' || realElementType.includes('hourdis') || element.path) {
            // C'est un élément GLB - Activer le mode fantôme GLB
            console.log(`📦 Activation mode fantôme GLB depuis éléments utilisés:`, element);
            
            // Créer l'objet GLB pour le système de construction
            const glbInfo = {
                type: element.type,
                path: element.path,
                name: element.name,
                scale: element.scale,
                lengthValue: element.lengthValue || '300'
            };
            
            // Définir tempGLBInfo pour que ConstructionTools puisse l'utiliser
            window.tempGLBInfo = glbInfo;
            
            // Activer le mode construction avec fantôme GLB
            if (window.ConstructionTools) {
                window.ConstructionTools.setMode('brick'); // Active le mode construction
                console.log(`✅ Mode fantôme GLB activé pour: ${element.type}`);
            }
            
            // Mettre à jour l'aperçu dans l'onglet Outils
            if (window.ToolsTabManager && window.ToolsTabManager.updateActiveElementPreview) {
                setTimeout(() => {
                    console.log('🔄 Mise à jour aperçu GLB après sélection depuis onglet fichier');
                    window.ToolsTabManager.updateActiveElementPreview();
                }, 100);
            }
            
            // Pas besoin de basculer vers bibliothèque pour les GLB
            return;
        }
        
        // Mettre à jour la sélection dans la bibliothèque SANS synchroniser avec les sélecteurs
        // (pour éviter d'écraser la coupe que nous venons de définir)
        document.querySelectorAll('.library-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        const libraryElement = document.querySelector(`[data-type="${realElementType}"]`);
        if (libraryElement) {
            libraryElement.classList.add('selected');
            this.selectedLibraryItem = realElementType;
            this.selectedCutType = selectedCut !== '1/1' ? selectedCut : null;
            // console.log(`📚 Élément sélectionné dans bibliothèque: ${realElementType} avec coupe: ${selectedCut}`);
        } else {
            this.selectedLibraryItem = realElementType;
            this.selectedCutType = selectedCut !== '1/1' ? selectedCut : null;
            console.warn(`⚠️ Élément ${realElementType} non trouvé dans la bibliothèque`);
        }
        
        // Basculer vers l'onglet bibliothèque pour voir la sélection
        this.switchMainSubTab('bibliotheque');
        
        // Sélectionner la coupe appropriée dans l'interface
        if (selectedCut && selectedCut !== '1/1') {
            const cutButton = document.querySelector(`.cut-btn[data-cut="${selectedCut}"]`);
            if (cutButton) {
                // Désélectionner tous les boutons de coupe
                document.querySelectorAll('.cut-btn').forEach(btn => btn.classList.remove('selected'));
                // Sélectionner le bouton approprié
                cutButton.classList.add('selected');
                this.selectedCutType = selectedCut;
                console.log(`🔧 Bouton de coupe ${selectedCut} sélectionné dans l'interface`);
            }
        }
        
        // Mettre à jour l'aperçu de l'élément actif dans l'onglet Outils
        if (window.ToolsTabManager && window.ToolsTabManager.updateActiveElementPreview) {
            // console.log('🔄 Déclenchement mise à jour élément actif après sélection réutilisable');
            
            // Mettre à jour le fantôme avec la coupe AVANT la mise à jour de l'aperçu
            this.updateGhostWithCut(realElementType, selectedCut);
            
            setTimeout(() => {
                window.ToolsTabManager.updateActiveElementPreview();
                // console.log('✅ Mise à jour élément actif effectuée');
                
                // Synchroniser aussi les boutons de coupe dans l'onglet Outils
                this.synchronizeToolsCutButtons(selectedCut);
            }, 200);
        } else {
            console.warn('⚠️ ToolsTabManager non disponible pour mise à jour élément actif');
            
            // Même si ToolsTabManager n'est pas disponible, mettre à jour le fantôme
            this.updateGhostWithCut(realElementType, selectedCut);
            this.synchronizeToolsCutButtons(selectedCut);
        }
        
        this.showNotification(`Élément appliqué: ${element.type} ${selectedCut !== '1/1' ? selectedCut : ''}`, 'success');
    }

    // Méthode pour synchroniser les boutons de coupe dans l'onglet Outils
    synchronizeToolsCutButtons(selectedCut) {
        // console.log(`🔄 Synchronisation boutons coupe Outils avec: ${selectedCut}`);
        
        const toolsCutButtons = document.querySelectorAll('#toolsCutButtons .cut-btn-mini');
        if (toolsCutButtons.length === 0) {
            // Aucun bouton de coupe trouvé dans l'onglet Outils
            return;
        }
        
        // D'abord, désactiver tous les boutons
        toolsCutButtons.forEach(btn => btn.classList.remove('active'));
        
        // Puis activer le bouton correspondant à la coupe sélectionnée
        // ✅ UTILISER LE GESTIONNAIRE CENTRALISÉ pour éviter les conflits
        if (window.CutButtonManager) {
            window.CutButtonManager.syncWithSelectors('M65', selectedCut);
        } else {
            // Fallback classique
            const allCutButtons = document.querySelectorAll('.cut-btn-mini');
            allCutButtons.forEach(btn => btn.classList.remove('active'));
            
            const targetButton = document.querySelector(`#toolsCutButtons .cut-btn-mini[data-cut="${selectedCut}"]`);
            if (targetButton) {
                targetButton.classList.add('active');
                console.log(`✅ Bouton coupe ${selectedCut} activé dans l'onglet Outils`);
            } else {
                console.warn(`⚠️ Bouton coupe ${selectedCut} non trouvé dans l'onglet Outils`);
                // Fallback: activer le bouton 1/1 par défaut
                const defaultButton = document.querySelector(`#toolsCutButtons .cut-btn-mini[data-cut="1/1"]`);
                if (defaultButton) {
                    defaultButton.classList.add('active');
                }
            }
        }
    }

    // Méthode pour mettre à jour le fantôme avec la coupe sélectionnée
    updateGhostWithCut(elementType, cutType) {
        // console.log(`👻 Mise à jour fantôme avec: ${elementType} coupe: ${cutType}`);
        
        // Essayer de trouver le fantôme via plusieurs chemins
        let ghost = null;
        
        if (window.SceneManager && window.SceneManager.ghostElement) {
            ghost = window.SceneManager.ghostElement;
            // console.log(`✅ Fantôme trouvé via SceneManager.ghostElement`);
        } else if (window.SceneManager && window.SceneManager.scene) {
            // Chercher le fantôme dans la scène
            window.SceneManager.scene.traverse((child) => {
                if (child.userData && (child.userData.isGhost || child.userData.ghost || child.name === 'ghostElement')) {
                    ghost = child;
                    // console.log(`✅ Fantôme trouvé dans la scène: ${child.name}`);
                }
            });
        }
        
        if (!ghost) {
            // console.warn('⚠️ Pas de fantôme disponible pour mise à jour - abandon de la tentative');
            return;
        }
        
        // Obtenir les dimensions de base de l'élément
        let baseDimensions = null;
        
        if (elementType.startsWith('M') && window.BrickSelector) {
            const brickData = window.BrickSelector.getBrickData(elementType);
            if (brickData) {
                baseDimensions = {
                    length: brickData.length,
                    width: brickData.width,
                    height: brickData.height
                };
            } else {
                // Essayer avec getCurrentBrick()
                const currentBrick = window.BrickSelector.getCurrentBrick();
                if (currentBrick && currentBrick.type === elementType) {
                    baseDimensions = {
                        length: currentBrick.length,
                        width: currentBrick.width,
                        height: currentBrick.height
                    };
                }
            }
        } else if ((elementType.startsWith('B') || elementType.startsWith('BC')) && window.BlockSelector) {
            const blockData = window.BlockSelector.getBlockData(elementType);
            if (blockData) {
                baseDimensions = {
                    length: blockData.length,
                    width: blockData.width,
                    height: blockData.height
                };
            } else {
                // Essayer avec getCurrentBlock()
                const currentBlock = window.BlockSelector.getCurrentBlock();
                if (currentBlock && currentBlock.type === elementType) {
                    baseDimensions = {
                        length: currentBlock.length,
                        width: currentBlock.width,
                        height: currentBlock.height
                    };
                }
            }
        }
        
        if (!baseDimensions) {
            console.warn(`⚠️ Impossible de récupérer les dimensions de base pour: ${elementType}`);
            
            // Essayer de lire directement depuis le fantôme existant
            if (ghost.dimensions) {
                baseDimensions = {
                    length: ghost.dimensions.length,
                    width: ghost.dimensions.width,
                    height: ghost.dimensions.height
                };
                console.log(`🔧 Dimensions récupérées du fantôme existant: ${baseDimensions.length}x${baseDimensions.width}x${baseDimensions.height}`);
            } else {
                return;
            }
        }
        
        // Appliquer la coupe aux dimensions
        let finalDimensions = { ...baseDimensions };
        
        if (cutType && cutType !== '1/1') {
            const cutMultipliers = {
                '3/4': 0.75,
                '1/2': 0.5,
                '1/4': 0.25
            };
            
            const multiplier = cutMultipliers[cutType];
            if (multiplier) {
                finalDimensions.length = Math.round(baseDimensions.length * multiplier);
                console.log(`🔢 Dimensions après coupe ${cutType}: ${finalDimensions.length}x${finalDimensions.width}x${finalDimensions.height}`);
            }
        }
        
        // Mettre à jour les dimensions du fantôme
        console.log(`🔧 AVANT updateDimensions: ghostElement.dimensions = ${ghost.dimensions ? ghost.dimensions.length + 'x' + ghost.dimensions.width + 'x' + ghost.dimensions.height : 'undefined'}`);
        console.log(`🔧 APPEL updateDimensions avec: ${finalDimensions.length}x${finalDimensions.width}x${finalDimensions.height}`);
        
        // Essayer plusieurs méthodes de mise à jour
        let updateSuccess = false;
        
        if (typeof ghost.updateDimensions === 'function') {
            try {
                ghost.updateDimensions(finalDimensions.length, finalDimensions.width, finalDimensions.height);
                updateSuccess = true;
                console.log(`✅ updateDimensions() réussie`);
            } catch (e) {
                console.warn('⚠️ Erreur avec updateDimensions():', e);
            }
        }
        
        // Si updateDimensions n'a pas fonctionné, essayer de mettre à jour directement
        if (!updateSuccess && ghost.dimensions) {
            try {
                ghost.dimensions.length = finalDimensions.length;
                ghost.dimensions.width = finalDimensions.width;
                ghost.dimensions.height = finalDimensions.height;
                updateSuccess = true;
                console.log(`✅ Mise à jour directe des dimensions réussie`);
            } catch (e) {
                console.warn('⚠️ Erreur avec mise à jour directe:', e);
            }
        }
        
        if (updateSuccess && ghost.dimensions) {
            console.log(`🔧 APRÈS updateDimensions: ghostElement.dimensions = ${ghost.dimensions.length}x${ghost.dimensions.width}x${ghost.dimensions.height}`);
        }
        
        // Forcer le rendu si disponible
        if (window.SceneManager && typeof window.SceneManager.render === 'function') {
            window.SceneManager.render();
        }
        
        console.log(`👻 Fantôme mis à jour ${updateSuccess ? 'avec succès' : 'ÉCHEC'} pour ${elementType} coupe ${cutType}`);
    }

    // Mettre à jour les statistiques des éléments à réutiliser
    updateReuseStats() {
        const briquesCount = this.reusableElements.briques.size;
        const blocsCount = this.reusableElements.blocs.size;
        const autresCount = this.reusableElements.autres.size;
        const totalCount = briquesCount + blocsCount + autresCount;
        
        const briquesCountEl = document.getElementById('reusedBricksCount');
        const blocsCountEl = document.getElementById('reusedBlocksCount');
        const totalCountEl = document.getElementById('totalReusedCount');
        
        if (briquesCountEl) briquesCountEl.textContent = briquesCount;
        if (blocsCountEl) blocsCountEl.textContent = blocsCount;
        if (totalCountEl) totalCountEl.textContent = totalCount;
    }

    // === GESTION DE L'ONGLET OUTILS ===
    setupOutilsTab() {
        // L'onglet Outils est géré par le ToolsTabManager
        // Cette fonction sert juste à s'assurer que l'onglet est reconnu par le TabManager
    }

    // 📦 === MÉTHODES GLB POUR ÉLÉMENTS RÉUTILISABLES ===
    // Générer un aperçu GLB pour la liste des éléments réutilisables
    generateGLBPreview(glbElement, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`❌ Container ${containerId} non trouvé pour aperçu GLB`);
            return;
        }

        // Vérifier si un aperçu est déjà en cours pour ce container
        if (container.dataset.previewInProgress === 'true') {
            console.log(`⏳ Aperçu GLB déjà en cours pour ${containerId}, ignoré`);
            return;
        }
        
        // Marquer comme en cours
        container.dataset.previewInProgress = 'true';

        // Créer un canvas pour l'aperçu GLB
        // Créer un container pour l'aperçu statique (pas de canvas nécessaire)
        container.innerHTML = '';

        // Utiliser un aperçu statique au lieu de 3D pour de meilleures performances
        if (window.toolsReusablePanel && window.toolsReusablePanel.generateStaticPreview) {
            try {
                // Créer un objet compatible avec le système d'aperçu statique
                const glbForPreview = {
                    name: glbElement.name || glbElement.type,
                    type: glbElement.type,
                    path: glbElement.path,
                    scale: glbElement.scale
                };
                
                console.log('🎨 Utilisation aperçu statique pour éléments réutilisables:', glbElement.type);
                
                // Utiliser l'aperçu statique immédiatement
                window.toolsReusablePanel.generateStaticPreview(glbForPreview, container.id);
                container.dataset.previewInProgress = 'false';
                
            } catch (error) {
                console.error('❌ Erreur aperçu statique réutilisables:', error);
                this.showGLBFallbackPreview(container, glbElement);
                container.dataset.previewInProgress = 'false';
            }
        } else {
            console.warn('⚠️ ToolsTabManager non disponible, fallback pour aperçu GLB');
            this.showGLBFallbackPreview(container, glbElement);
            container.dataset.previewInProgress = 'false';
        }
    }

    // Aperçu de secours pour GLB
    showGLBFallbackPreview(container, glbElement) {
        container.innerHTML = `
            <div class="reuse-preview-fallback">
                <i class="fas fa-cube" style="font-size: 24px; color: #666;"></i>
                <div style="font-size: 10px; margin-top: 4px;">${glbElement.name || glbElement.type}</div>
            </div>
        `;
    }
}

// Initialiser le gestionnaire d'onglets quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    window.TabManager = new TabManager();
    
    // Exposer tabManager pour les fonctions onclick
    window.tabManager = window.TabManager;
    
    // Reconfigurer les boutons après un délai pour être sûr
    setTimeout(() => {
        if (window.TabManager && window.TabManager.setupCutButtonsMini) {
            window.TabManager.setupCutButtonsMini();
        }
    }, 2000);
});

// Backup d'initialisation après un délai au cas où
setTimeout(() => {
    if (!window.TabManager) {
        window.TabManager = new TabManager();
    } else {
        // Force une reconfiguration des boutons
        if (window.TabManager.setupCutButtonsMini) {
            window.TabManager.setupCutButtonsMini();
        }
    }
}, 3000);

// Extension de la classe TabManager pour la gestion automatique des joints
TabManager.prototype.setupJointControls = function() {
    // Gestion moderne des toggles de joints sans checkboxes
    document.querySelectorAll('.joint-option').forEach(option => {
        const jointType = option.dataset.joint;
        const toggleSwitch = option.querySelector('.toggle-switch');
        
        if (toggleSwitch && jointType) {
            option.addEventListener('click', (e) => {
                // Basculer l'état actif du toggle
                toggleSwitch.classList.toggle('active');
                
                // Appliquer les changements de visibilité
                this.applyJointVisibilityChanges();
                
                // Log pour debug
                const isActive = toggleSwitch.classList.contains('active');
                console.log(`🔗 Joint ${jointType}: ${isActive ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
            });
        }
    });
    
    // Synchroniser l'état initial des toggles avec l'état réel
    this.syncJointTogglesWithRealState();
    
    if (window.DEBUG_TAB_MANAGER) {
        console.log('🔗 Contrôles de joints modernes configurés');
    }
};

// === GESTION DES APERÇUS 3D POUR ÉLÉMENTS RÉUTILISABLES ===
TabManager.prototype.generate3DPreview = function(elementType, cutType, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`❌ Container ${containerId} non trouvé pour l'aperçu 3D`);
        return;
    }

    // Vérifier si Three.js est disponible
    if (typeof THREE === 'undefined') {
        console.warn('⚠️ Three.js non disponible pour les aperçus 3D');
        return;
    }

    try {
        // Initialiser le renderer partagé si nécessaire
        if (!this.rendererInitialized) {
            this.initSharedRenderer();
        }

        if (!this.sharedRenderer || !this.sharedScene || !this.sharedCamera) {
            console.warn('⚠️ Renderer partagé non disponible, utilisation de CSS fallback');
            this.generateCSSFallbackPreview(elementType, cutType, container);
            return;
        }

        // Nettoyer la scène partagée (garder seulement les lumières)
        const lights = this.sharedScene.children.filter(child => 
            child instanceof THREE.AmbientLight || child instanceof THREE.DirectionalLight
        );
        this.sharedScene.clear();
        // Créer la géométrie selon le type d'élément
        const mesh = this.createElementMesh(elementType, cutType);
        if (mesh) {
            this.sharedScene.add(mesh);
            
            // Position de la caméra adaptée au type d'élément
            this.sharedCamera.position.set(3, 3, 4);
            this.sharedCamera.lookAt(0, 0, 0);
            
            // Rendu dans le canvas partagé
            this.sharedRenderer.render(this.sharedScene, this.sharedCamera);
            
            // Créer un canvas pour affichage et copier l'image
            const displayCanvas = document.createElement('canvas');
            displayCanvas.className = 'reuse-preview-3d';
            displayCanvas.width = 160;
            displayCanvas.height = 120;
            const displayCtx = displayCanvas.getContext('2d');
            displayCtx.drawImage(this.sharedRenderer.domElement, 0, 0);
            
            // Remplacer le contenu du container par le canvas d'affichage
            const fallback = container.querySelector('.reuse-preview-fallback');
            if (fallback) {
                fallback.style.display = 'none';
            }
            container.appendChild(displayCanvas);
            
            // Nettoyer la scène partagée (retirer les meshes, garder les lumières)
            this.sharedScene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        }
    } catch (error) {
        console.warn('⚠️ Erreur lors de la création de l\'aperçu 3D:', error);
        // Fallback vers aperçu CSS
        this.generateCSSFallbackPreview(elementType, cutType, container);
    }
};

/**
 * Génère un aperçu CSS en fallback si WebGL n'est pas disponible
 */
TabManager.prototype.generateCSSFallbackPreview = function(elementType, cutType, container) {
    const iconDiv = document.createElement('div');
    iconDiv.className = 'reuse-preview-fallback';
    iconDiv.style.cssText = `
        width: 160px;
        height: 120px;
        background: linear-gradient(135deg, #f0f0f0, #d0d0d0);
        border: 2px solid #ccc;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #666;
        text-align: center;
        border-radius: 4px;
    `;
    iconDiv.innerHTML = `📦<br>${elementType}`;
    container.appendChild(iconDiv);
};

TabManager.prototype.createElementMesh = function(elementType, cutType) {
    // Configuration des éléments (dimensions en décimètres pour Three.js)
    const elementConfigs = {
        // Briques
        'M50': { size: [1.9, 0.5, 0.9], color: 0xaa4411 },
        'M57': { size: [1.9, 0.57, 0.9], color: 0xbb5522 },
        'M60': { size: [1.9, 0.6, 0.9], color: 0xcc6633 },
        'M65': { size: [1.9, 0.65, 0.9], color: 0xdd7744 },
        'M90': { size: [1.9, 0.9, 0.9], color: 0xee8855 },
        'WF': { size: [2.1, 0.5, 1.0], color: 0xcc7744 },
        'WFD': { size: [2.1, 0.65, 1.0], color: 0xbb6633 },
        
        // Blocs creux
        'B9': { size: [3.9, 1.9, 0.9], color: 0x888888 },
        'B14': { size: [3.9, 1.9, 1.4], color: 0x999999 },
        'B19': { size: [3.9, 1.9, 1.9], color: 0x777777 },
        'B29': { size: [3.9, 1.9, 2.9], color: 0x666666 },
        
        // Béton cellulaire
        'BC_60x5': { size: [6.0, 2.5, 0.5], color: 0xcccccc },
        'BC_60x10': { size: [6.0, 2.5, 1.0], color: 0xcccccc },
        'BC_60x15': { size: [6.0, 2.5, 1.5], color: 0xcccccc },
        'BC_60x20': { size: [6.0, 2.5, 2.0], color: 0xcccccc },
        
        // Types génériques (fallback)
        'brick': { size: [1.9, 0.65, 0.9], color: 0xaa4411 },
        'block': { size: [3.9, 1.9, 1.9], color: 0x777777 }
    };

    const config = elementConfigs[elementType] || elementConfigs['brick'];
    let [length, height, width] = config.size;

    // Ajuster les dimensions selon la coupe
    if (cutType && cutType !== '1/1') {
        switch (cutType) {
            case '3/4':
                length *= 0.75;
                break;
            case '1/2':
                length *= 0.5;
                break;
            case '1/4':
                length *= 0.25;
                break;
        }
    }

    // Créer la géométrie
    const geometry = new THREE.BoxGeometry(length, height, width);
    const material = new THREE.MeshLambertMaterial({ color: config.color });
    const mesh = new THREE.Mesh(geometry, material);

    // Centrer le mesh
    mesh.position.set(0, 0, 0);

    return mesh;
};

/**
 * Méthode de nettoyage global - à appeler lors du changement de projet ou fermeture
 */
TabManager.prototype.cleanup = function() {
    console.log('🧹 Nettoyage du TabManager...');
    
    // Nettoyer le renderer partagé
    this.disposeSharedRenderer();
    
    // Nettoyer les éléments réutilisables
    if (this.reusableElements) {
        this.reusableElements.briques.clear();
        this.reusableElements.blocs.clear();
        this.reusableElements.autres.clear();
    }
    
    console.log('✅ Nettoyage du TabManager terminé');
}

// === MÉTHODES UTILITAIRES ===

/**
 * Supprimer les cadres d'aide de la bibliothèque
 */
TabManager.prototype.clearLibraryHelpHighlights = function() {
    // Supprimer les conteneurs de surlignage
    const highlightContainers = document.querySelectorAll('#library-highlights-container');
    highlightContainers.forEach(container => container.remove());
    
    // Supprimer les boîtes de surlignage individuelles
    const highlightBoxes = document.querySelectorAll('.library-highlight-box');
    highlightBoxes.forEach(box => box.remove());
    
    // Si le système d'aide de bibliothèque existe, appeler sa méthode de nettoyage
    if (window.LibraryHelpSystem && window.LibraryHelpSystem.removeVisualHighlights) {
        window.LibraryHelpSystem.removeVisualHighlights();
    }
    
    // console.log('🧹 Cadres d\'aide de la bibliothèque supprimés');
};

// === MÉTHODES GLB POUR LA BIBLIOTHÈQUE ===

TabManager.prototype.importGLBFromLibrary = function(glbPath, glbName) {
    console.log(`� DEBUG: importGLBFromLibrary appelée avec:`, { glbPath, glbName });
    console.log(`�📦 Import GLB depuis bibliothèque: ${glbPath}`);
    
    // Vérifier la disponibilité du FileMenuHandler
    console.log(`🔍 DEBUG: FileMenuHandler disponible:`, !!window.FileMenuHandler);
    console.log(`🔍 DEBUG: importGLBFromPath disponible:`, !!(window.FileMenuHandler && window.FileMenuHandler.importGLBFromPath));
    
    // Utiliser le système d'import existant du file-menu-handler
    if (window.FileMenuHandler && window.FileMenuHandler.importGLBFromPath) {
        console.log(`✅ Appel de importGLBFromPath...`);
        window.FileMenuHandler.importGLBFromPath(glbPath, glbName);
    } else {
        console.warn('⚠️ FileMenuHandler non disponible pour l\'import GLB');
    }
};

TabManager.prototype.previewGLBFromLibrary = function(glbPath) {
    console.log(`👁️ Aperçu GLB: ${glbPath}`);
    
    // Pour l'instant, afficher une alerte (à améliorer avec un vrai système d'aperçu)
    alert(`Aperçu du modèle GLB:\n${glbPath}\n\n(Fonctionnalité d'aperçu à implémenter)`);
};

// Nouvelle méthode pour gérer l'import GLB avec longueur
TabManager.prototype.handleGLBImportWithLength = function(parentItem, lengthValue, baseType) {
    if (window.DEBUG_TAB_MANAGER) {
        console.log('🚀 TabManager: handleGLBImportWithLength appelée avec:', {
            parentItem: parentItem,
            lengthValue: lengthValue,
            baseType: baseType
        });
    }
    
    // DÉSACTIVÉ: Activer automatiquement l'onglet Outils lors de l'import GLB
    // pour rester dans l'onglet bibliothèque
    // if (window.DEBUG_TAB_MANAGER) {
    //     console.log('🔧 TabManager: Activation onglet Outils (depuis handleGLBImportWithLength)');
    // }
    // this.activateToolsTab();
    
    // Récupérer les informations GLB
    const glbPath = parentItem.getAttribute('data-glb-path') || 
                   parentItem.querySelector('canvas[data-glb-path]')?.getAttribute('data-glb-path');
    const glbName = parentItem.querySelector('canvas[data-glb-path]')?.getAttribute('data-glb-name') || baseType;
    
    if (window.DEBUG_TAB_MANAGER) {
        console.log('🚀 TabManager: GLB Info:', {
            glbPath: glbPath,
            glbName: glbName
        });
    }
    
    if (!glbPath) {
        console.error('❌ Chemin GLB non trouvé pour l\'import');
        return;
    }
    
    // Calculer l'échelle selon la longueur
    let scaleZ = 1.0;
    if (lengthValue !== 'P') {
        const targetLength = parseInt(lengthValue); // Longueur souhaitée en cm
        if (!isNaN(targetLength)) {
            // Le hourdis GLB fait 1cm de base, donc échelle = longueur souhaitée / 1cm
            const baseLengthCm = 1; // Longueur de base réelle du hourdis GLB en cm
            scaleZ = targetLength / baseLengthCm;
        }
    } else {
        // Pour P (personnalisé), demander à l'utilisateur
        const customLength = prompt('Entrez la longueur souhaitée (en cm):', '100');
        if (customLength && !isNaN(customLength)) {
            const targetLength = parseInt(customLength);
            const baseLengthCm = 1; // Longueur de base réelle du hourdis GLB en cm
            scaleZ = targetLength / baseLengthCm;
        } else {
            return; // Annulé par l'utilisateur
        }
    }
    
    // CORRECTION: Désactiver d'abord tout mode de construction actuel
    // pour éviter les placements accidentels d'éléments précédents
    if (window.ConstructionTools) {
        window.ConstructionTools.removeGhostElement(); // Supprimer le fantôme actuel
    }
    
    // Stocker les informations GLB pour le mode construction
    window.tempGLBInfo = {
        type: baseType,
        path: glbPath,
        name: glbName,
        scale: { x: 1, y: 1, z: scaleZ }, // Seul l'axe Z (longueur) doit être mis à l'échelle
        lengthValue: lengthValue,
        targetLength: parseInt(lengthValue), // Longueur cible en unités Three.js (cm)
        dimensions: {
            width: parseInt(lengthValue), // Z = longueur (avec échelle)
            length: 60,                   // X = largeur standard hourdis
            height: 13                    // Y = hauteur standard hourdis
        }
    };
    
    // Afficher le D-pad GLB dès la sélection d'un élément GLB
    if (window.GLBDpadController) {
        window.GLBDpadController.showForObjectType(true); // true = objet GLB avec boutons Y
    }
    
    // 📦 Déclencher la mise à jour de l'aperçu dans l'onglet Outils
    if (window.DEBUG_TAB_MANAGER) {
        console.log('🚀 TabManager: Appel de ToolsTabManager.updateActiveElementPreview()');
    }
    if (window.ToolsTabManager && window.ToolsTabManager.updateActiveElementPreview) {
        if (window.DEBUG_TAB_MANAGER) {
            console.log('🚀 TabManager: ToolsTabManager disponible, mise à jour programmée');
        }
        
        // Créer un objet d'élément temporaire avec les infos GLB
        const tempGLBElement = {
            type: baseType,
            name: glbName, // Nom d'affichage
            path: glbPath, // Chemin GLB pour le chargement
            glbInfo: {
                path: glbPath,
                name: glbName,
                type: baseType
            },
            dimensions: {
                width: parseInt(lengthValue), // Z = longueur (avec échelle)
                length: 60,                   // X = largeur standard hourdis
                height: 13                    // Y = hauteur standard hourdis
            },
            userData: {
                isGLB: true, // Important pour le rendu
                glbType: baseType,
                glbInfo: {
                    type: baseType,
                    path: glbPath,
                    name: glbName
                }
            }
        };
        
        setTimeout(() => {
            if (window.DEBUG_TAB_MANAGER) {
                console.log('🚀 TabManager: Exécution de updateActiveElementPreview() avec tempGLBElement');
            }
            window.ToolsTabManager.updateActiveElementPreview(tempGLBElement);
            if (window.DEBUG_TAB_MANAGER) {
                console.log('🚀 TabManager: updateActiveElementPreview() exécutée avec GLB');
            }
        }, 50); // Réduit de 100ms à 50ms
    } else {
        if (window.DEBUG_TAB_MANAGER) {
            console.log('⚠️ TabManager: ToolsTabManager non disponible');
        }
    }
    
    // Sélectionner le type GLB dans le brick selector
    if (window.BrickSelector) {
        window.BrickSelector.setBrick(baseType);
    }
    
    // Activer le mode construction avec optimisation des tentatives
    const activateConstructionMode = () => {
        if (window.ConstructionTools) {
            window.ConstructionTools.setMode('brick');
        }
    };
    
    // Utiliser Promise.resolve() pour une micro-tâche plus légère et plus rapide
    Promise.resolve().then(() => {
        activateConstructionMode();
    });
}

// Méthode pour activer automatiquement l'onglet Outils - DÉSACTIVÉE (onglet supprimé)
TabManager.prototype.activateToolsTab = function() {
    if (window.DEBUG_TAB_MANAGER) {
        console.log('⚠️ TabManager: activateToolsTab appelée mais onglet Outils supprimé - ignoré');
    }
    
    // Ne rien faire puisque l'onglet Outils a été supprimé
    return;
};

