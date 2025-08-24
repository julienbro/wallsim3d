// Sélecteur de briques
class BrickSelector {
    constructor() {
        this.currentBrick = 'M65'; // Par défaut
        this.brickTypes = {
            // Briques entières
            'M50': { length: 19, width: 9, height: 5, name: 'Brique M50', category: 'full', customCut: true },
            'M57': { length: 19, width: 9, height: 5.7, name: 'Brique M57', category: 'full', customCut: true },
            'M60': { length: 19, width: 9, height: 6, name: 'Brique M60', category: 'full', customCut: true },
            'M65': { length: 19, width: 9, height: 6.5, name: 'Brique M65', category: 'full', customCut: true },
            'M90': { length: 19, width: 9, height: 9, name:'Brique M90', category: 'full', customCut: true },
            'WF': { length: 21, width: 10, height: 5, name: 'Brique WF', category: 'full', customCut: true },
            'WFD': { length: 21, width: 10, height: 6.5, name: 'Brique WFD', category: 'full', customCut: true },
            'M50_CHANT': { length: 5, width: 9, height: 19, name: 'Brique M50 sur chant', category: 'full', customCut: true },
            
            // Briques coupées 3/4 (14cm)
            'M50_3Q': { length: 14, width: 9, height: 5, name: 'Brique M50 3/4', category: 'cut', cutType: '3/4', baseBrick: 'M50' },
            'M57_3Q': { length: 14, width: 9, height: 5.7, name: 'Brique M57 3/4', category: 'cut', cutType: '3/4', baseBrick: 'M57' },
            'M60_3Q': { length: 14, width: 9, height: 6, name: 'Brique M60 3/4', category: 'cut', cutType: '3/4', baseBrick: 'M60' },
            'M65_3Q': { length: 14, width: 9, height: 6.5, name: 'Brique M65 3/4', category: 'cut', cutType: '3/4', baseBrick: 'M65' },
            'M90_3Q': { length: 14, width: 9, height: 9, name: 'Brique M90 3/4', category: 'cut', cutType: '3/4', baseBrick: 'M90' },
            'M50_CHANT_3Q': { length: 3.75, width: 9, height: 19, name: 'Brique M50 sur chant 3/4', category: 'cut', cutType: '3/4', baseBrick: 'M50_CHANT' },
            
            // Briques coupées 1/2 (9cm)
            'M50_HALF': { length: 9, width: 9, height: 5, name: 'Brique M50 1/2', category: 'cut', cutType: '1/2', baseBrick: 'M50' },
            'M57_HALF': { length: 9, width: 9, height: 5.7, name: 'Brique M57 1/2', category: 'cut', cutType: '1/2', baseBrick: 'M57' },
            'M60_HALF': { length: 9, width: 9, height: 6, name: 'Brique M60 1/2', category: 'cut', cutType: '1/2', baseBrick: 'M60' },
            'M65_HALF': { length: 9, width: 9, height: 6.5, name: 'Brique M65 1/2', category: 'cut', cutType: '1/2', baseBrick: 'M65' },
            'M90_HALF': { length: 9, width: 9, height: 9, name: 'Brique M90 1/2', category: 'cut', cutType: '1/2', baseBrick: 'M90' },
            'M50_CHANT_HALF': { length: 2.5, width: 9, height: 19, name: 'Brique M50 sur chant 1/2', category: 'cut', cutType: '1/2', baseBrick: 'M50_CHANT' },
            
            // Briques coupées 1/4 (4cm)
            'M50_1Q': { length: 4, width: 9, height: 5, name: 'Brique M50 1/4', category: 'cut', cutType: '1/4', baseBrick: 'M50' },
            'M57_1Q': { length: 4, width: 9, height: 5.7, name: 'Brique M57 1/4', category: 'cut', cutType: '1/4', baseBrick: 'M57' },
            'M60_1Q': { length: 4, width: 9, height: 6, name: 'Brique M60 1/4', category: 'cut', cutType: '1/4', baseBrick: 'M60' },
            'M65_1Q': { length: 4, width: 9, height: 6.5, name: 'Brique M65 1/4', category: 'cut', cutType: '1/4', baseBrick: 'M65' },
            'M90_1Q': { length: 4, width: 9, height: 9, name: 'Brique M90 1/4', category: 'cut', cutType: '1/4', baseBrick: 'M90' },
            'M50_CHANT_1Q': { length: 1.25, width: 9, height: 19, name: 'Brique M50 sur chant 1/4', category: 'cut', cutType: '1/4', baseBrick: 'M50_CHANT' },
            
            // Éléments GLB (planchers)
            'hourdis_13_60': { length: 60, width: 13, height: 1, name: 'Hourdis 13-60', category: 'glb', customCut: true, glbPath: 'assets/models/planchers/hourdis_13_60.glb' },
            'hourdis_16_60': { length: 60, width: 16, height: 1, name: 'Hourdis 16-60', category: 'glb', customCut: true, glbPath: 'assets/models/planchers/hourdis_16_60.glb' },
            'poutrain_beton_12': { length: 120, width: 12, height: 12, name: 'Poutrain béton 12', category: 'glb', customCut: true, glbPath: 'assets/models/planchers/poutrain_beton_12.glb' },
            'claveau_beton_12_53': { length: 53, width: 12, height: 12, name: 'Claveau béton 12-53', category: 'glb', customCut: false, glbPath: 'assets/models/planchers/claveau_beton_12_53.glb' },
            
            // Éléments GLB (outils)
            'betonniere': { length: 100, width: 80, height: 120, name: 'Bétonnière', category: 'glb', customCut: false, glbPath: 'assets/models/outils/betonniere.glb' },
            'brouette': { length: 150, width: 60, height: 80, name: 'Brouette', category: 'glb', customCut: false, glbPath: 'assets/models/outils/brouette.glb' }
        };
        
        this.modal = null;
        this.selectedType = this.currentBrick;
        this.customCutModal = null;
        this.init();
    }

    init() {
        this.modal = document.getElementById('brickSelector');
        this.customCutModal = document.getElementById('customCutModal');
        this.setupEventListeners();
        
        // Initialiser les dimensions par défaut
        this.updateBrickDimensions(this.currentBrick);
        this.updateCurrentBrickDisplay();
        
        // NOUVELLE FONCTIONNALITÉ: Écouter les changements du sélecteur brickTypeSelect
        this.setupBrickTypeSelectListener();
        
        // console.log('BrickSelector initialisé avec la brique par défaut:', this.currentBrick);
    }

    setupEventListeners() {
        // Ouvrir la modale quand on clique sur le bouton Briques
        const brickButton = document.getElementById('brickMode');
        if (brickButton) {
            brickButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.showModal();
            });
        }

        // Fermer la modale
        const closeBtn = document.getElementById('closeBrickSelector');
        const cancelBtn = document.getElementById('cancelBrickSelection');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideModal());
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideModal());
        }

        // Fermer en cliquant en dehors
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.hideModal();
                }
            });
        }

        // Sélection de brique - Nouvelle interface simplifiée
        const sizeButtons = document.querySelectorAll('.size-btn');
        sizeButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (button.dataset.customCut === 'true') {
                    this.showCustomCutModal(button.dataset.type);
                } else {
                    this.selectBrick(button.dataset.type);
                }
            });
        });

        // Support pour l'ancienne interface (si elle existe encore)
        const brickOptions = document.querySelectorAll('.brick-option');
        brickOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.selectBrick(option.dataset.type);
            });
        });

        // Raccourci clavier Échap pour fermer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && this.modal.classList.contains('show')) {
                this.hideModal();
            }
        });

        // Gestion de la coupe personnalisée
        this.setupCustomCutListeners();

        // Raccourcis clavier pour sélection rapide des coupes
        document.addEventListener('keydown', (e) => {
            if (this.modal && this.modal.classList.contains('show')) return; // Ne pas agir si la modale est ouverte
            
            // Ctrl + 1, 2, 3, 4 pour les différents types
            if (e.ctrlKey && !e.shiftKey && !e.altKey) {
                const baseBrick = this.getBaseBrick(this.currentBrick);
                let targetBrick = null;
                
                switch(e.key) {
                    case '1': // Brique entière
                        targetBrick = baseBrick;
                        break;
                    case '2': // 3/4
                        targetBrick = `${baseBrick}_3Q`;
                        break;
                    case '3': // 1/2
                        targetBrick = `${baseBrick}_HALF`;
                        break;
                    case '4': // 1/4
                        targetBrick = `${baseBrick}_1Q`;
                        break;
                }
                
                if (targetBrick && this.brickTypes[targetBrick]) {
                    e.preventDefault();
                    this.setBrick(targetBrick);
                    
                    // Notification rapide
                    const brick = this.brickTypes[targetBrick];
                    this.showNotification(`🚀 ${brick.name} (${brick.length}cm)`);
                }
            }
        });

        // Raccourci clavier Échap pour fermer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.customCutModal && this.customCutModal.classList.contains('show')) {
                    this.hideCustomCutModal();
                } else if (this.modal && this.modal.classList.contains('show')) {
                    this.hideModal();
                }
            }
        });
    }

    setupCustomCutListeners() {
        // Fermer la modale de coupe personnalisée
        const closeCustomBtn = document.getElementById('closeCustomCut');
        const cancelCustomBtn = document.getElementById('cancelCustomCut');
        
        if (closeCustomBtn) {
            closeCustomBtn.addEventListener('click', () => this.hideCustomCutModal());
        }
        
        if (cancelCustomBtn) {
            cancelCustomBtn.addEventListener('click', () => this.hideCustomCutModal());
        }

        // Confirmer la coupe personnalisée
        const confirmCustomBtn = document.getElementById('confirmCustomCut');
        if (confirmCustomBtn) {
            confirmCustomBtn.addEventListener('click', () => {
                // ✅ SÉCURITÉ: Vérifier qu'aucune modale dynamique TabManager n'est active
                const tabManagerModal = document.querySelector('.tabmanager-dynamic-modal');
                if (tabManagerModal) {
                    console.log(`🚫 BrickSelector: Modale TabManager active, ignorer confirmCustomCut`);
                    return;
                }
                
                // ✅ SÉCURITÉ: Vérifier que c'est bien notre modale qui est active
                if (this.customCutModal && this.customCutModal.style.display === 'block') {
                    this.confirmCustomCut();
                }
            });
        }

        // Fermer en cliquant en dehors
        if (this.customCutModal) {
            this.customCutModal.addEventListener('click', (e) => {
                if (e.target === this.customCutModal) {
                    this.hideCustomCutModal();
                }
            });
        }
    }

    showModal() {
        if (!this.modal) return;
        
        this.selectedType = this.currentBrick;
        this.updateSelection();
        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Jouer le son d'ouverture
        // Son supprimé
        
        console.log('Modale de sélection de briques ouverte');
    }

    hideModal() {
        if (!this.modal) return;
        
        this.modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // Remettre la sélection sur la brique courante
        this.selectedType = this.currentBrick;
        this.updateSelection();
        
        console.log('Modale de sélection de briques fermée');
    }

    showCustomCutModal(brickType) {
        // ✅ SÉCURITÉ: Ne pas ouvrir si TabManager gère déjà une coupe personnalisée
        const tabManagerModal = document.querySelector('.tabmanager-dynamic-modal');
        if (tabManagerModal) {
            console.log(`🚫 BrickSelector: TabManager gère déjà la coupe personnalisée, ignorer showCustomCutModal`);
            return;
        }
        
        if (!this.customCutModal) return;
        
        const brick = this.brickTypes[brickType];
        if (!brick) return;

        // Mettre à jour le titre
        const title = this.customCutModal.querySelector('.custom-cut-title');
        if (title) {
            title.textContent = `Coupe personnalisée - ${brick.name}`;
        }

        // Mettre à jour les dimensions par défaut
        const lengthInput = document.getElementById('customLength');
        const widthInput = document.getElementById('customWidth');
        const heightInput = document.getElementById('customHeight');

        if (lengthInput) lengthInput.value = brick.length;
        if (widthInput) widthInput.value = brick.width;
        if (heightInput) heightInput.value = brick.height;

        // Stocker le type de brique pour la confirmation
        this.customCutModal.dataset.baseType = brickType;

        this.customCutModal.classList.add('show');
    }

    hideCustomCutModal() {
        if (!this.customCutModal) return;
        this.customCutModal.classList.remove('show');
    }

    confirmCustomCut() {
        // ✅ SÉCURITÉ RENFORCÉE: Vérifier que c'est bien notre modale ET que le type est une brique
        if (!this.customCutModal || this.customCutModal.style.display !== 'block') {
            console.log(`🚫 BrickSelector: Modale non active, ignorer confirmCustomCut`);
            return;
        }

        const lengthInput = document.getElementById('customLength');
        const widthInput = document.getElementById('customWidth');
        const heightInput = document.getElementById('customHeight');

        const length = parseFloat(lengthInput.value);
        const width = parseFloat(widthInput.value);
        const height = parseFloat(heightInput.value);

        if (isNaN(length) || isNaN(width) || isNaN(height) || 
            length <= 0 || width <= 0 || height <= 0) {
            alert('Veuillez entrer des dimensions valides.');
            return;
        }

        const baseType = this.customCutModal.dataset.baseType;
        
        // ✅ SÉCURITÉ RENFORCÉE: Vérifier que le type appartient aux briques
        if (!baseType || !baseType.startsWith('M') || baseType.startsWith('B')) {
            console.log(`🚫 BrickSelector: Type "${baseType}" n'est pas une brique (probablement un bloc), ignorer confirmCustomCut`);
            return;
        }
        
        const baseBrick = this.brickTypes[baseType];

        // Créer un nouveau type de brique personnalisé
        const customType = `${baseType}_CUSTOM_${Date.now()}`;
        this.brickTypes[customType] = {
            length: length,
            width: width,
            height: height,
            name: `${baseBrick.name} (${length}×${width}×${height})`,
            category: baseBrick.category,
            isCustom: true,
            baseBrick: baseType
        };

        this.selectBrick(customType);
        this.hideCustomCutModal();
    }

    selectBrick(type) {
        if (!this.brickTypes[type]) return;
        
        this.selectedType = type;
        this.updateSelection();
        
        // Animation de sélection pour la nouvelle interface
        const sizeButton = document.querySelector(`.size-btn[data-type="${type}"]`);
        if (sizeButton) {
            sizeButton.classList.add('selecting');
            setTimeout(() => {
                sizeButton.classList.remove('selecting');
            }, 300);
        }

        // Animation pour l'ancienne interface (si elle existe)
        const option = document.querySelector(`.brick-option[data-type="${type}"]`);
        if (option) {
            option.classList.add('selecting');
            setTimeout(() => {
                option.classList.remove('selecting');
            }, 300);
        }
        
        // Jouer le son de sélection
        // Son supprimé
        
        // Vérifier si c'est une brique sur chant et afficher le panneau de contrôle
        console.log('🔍 Vérification brique sur chant:', type);
        const isOnChant = this.isBrickOnChant(type);
        console.log('🔍 Est sur chant ?', isOnChant);
        console.log('🔍 HeightControlManager disponible ?', !!window.heightControlManager);
        console.log('🔍 Type de brique:', this.brickTypes[type]);
        
        if (isOnChant) {
            console.log('🎯 Tentative d\'affichage du panneau de contrôle');
            // Afficher le panneau de contrôle de hauteur
            if (window.heightControlManager) {
                window.heightControlManager.showPanel();
                console.log('✅ Panneau affiché');
            } else {
                console.error('❌ HeightControlManager non disponible');
            }
        } else {
            console.log('🔄 Brique normale - masquage du panneau');
            // Masquer le panneau pour les autres briques
            if (window.heightControlManager) {
                window.heightControlManager.hidePanel();
            }
            // Confirmer automatiquement la sélection pour les briques normales ET les GLB
            console.log('🔧 Appel de confirmSelection pour type:', type);
            this.confirmSelection();
        }
        
        console.log('Brique sélectionnée:', type, this.brickTypes[type]);
    }

    updateSelection() {
        // Mise à jour pour la nouvelle interface simplifiée
        const sizeButtons = document.querySelectorAll('.size-btn');
        sizeButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.type === this.selectedType) {
                button.classList.add('active');
            }
        });

        // Support pour l'ancienne interface (si elle existe encore)
        const options = document.querySelectorAll('.brick-option');
        options.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.type === this.selectedType) {
                option.classList.add('active');
            }
        });
    }

    confirmSelection() {
        console.log('🔧 BrickSelector.confirmSelection appelée pour:', this.selectedType);
        
        // Masquer les aides contextuelles lors de la sélection d'une brique
        if (window.TabManager && window.TabManager.hideAllContextualHelp) {
            window.TabManager.hideAllContextualHelp();
        }
        
        this.currentBrick = this.selectedType;
        this.updateBrickDimensions(this.currentBrick);
        this.updateCurrentBrickDisplay();
        this.hideModal();
        
        const brickData = this.brickTypes[this.currentBrick];
        console.log('🔧 Données de la brique:', brickData);
        console.log('🔧 Déclenchement de l\'événement brickSelectionChanged');
        
        // NOUVEAU: Déclencher un événement de changement de brique
        document.dispatchEvent(new CustomEvent('brickSelectionChanged', {
            detail: {
                brickType: this.currentBrick,
                brickData: brickData
            }
        }));
        
        console.log('🔧 Événement brickSelectionChanged déclenché pour:', this.currentBrick);
        
        // Basculer automatiquement vers l'assise correspondante si AssiseManager est disponible
        if (window.AssiseManager) {
            try {
                const baseType = this.currentBrick.split('_')[0]; // Enlever les suffixes comme _3Q, _HALF
                const brickSubTypes = ['M50', 'M57', 'M60', 'M65', 'M90'];
                if (brickSubTypes.includes(baseType)) {
                    // console.log(`🔄 BrickSelector: Basculement automatique vers l'assise ${baseType}`);
                    window.AssiseManager.setCurrentType(baseType, true); // skipToolChange = true
                }
            } catch (error) {
                console.warn('Erreur lors du basculement automatique d\'assise:', error);
            }
        }
        
        // Activer le mode brique
        if (window.ConstructionTools) {
            window.ConstructionTools.setMode('brick');
            window.ConstructionTools.updateToolButtons();
            
            // Forcer la recréation du fantôme avec les nouvelles dimensions
            if (window.ConstructionTools.isInitialized) {
                window.ConstructionTools.createGhostElement();
            }
        }
        
        // Jouer le son de confirmation
        // Son supprimé
        
        // Afficher une notification avec des détails sur la coupe
        const brick = this.brickTypes[this.currentBrick];
        let message = `Brique ${brick.name} sélectionnée`;
        
        if (brick.category === 'cut') {
            const cutTypeLabels = {
                '3/4': '3/4 (14cm)',
                '1/2': '1/2 (9cm)', 
                '1/4': '1/4 (4cm)',
                'custom': 'personnalisée'
            };
            const cutLabel = cutTypeLabels[brick.cutType] || brick.cutType;
            message += ` - Coupe ${cutLabel}`;
        }
        
        this.showNotification(message);
        
        console.log('Brique confirmée:', this.currentBrick, this.brickTypes[this.currentBrick]);
    }

    updateBrickDimensions(type) {
        const brick = this.brickTypes[type];
        if (!brick) return;
        
        // Mettre à jour les inputs HTML utilisés par ConstructionTools
        const lengthInput = document.getElementById('elementLength');
        const widthInput = document.getElementById('elementWidth');
        const heightInput = document.getElementById('elementHeight');
        
        if (lengthInput) lengthInput.value = brick.length;
        if (widthInput) widthInput.value = brick.width;
        if (heightInput) heightInput.value = brick.height;
        
        // Mettre à jour les dimensions globales et le matériau pour l'utilisation par d'autres modules
        window.currentBrickDimensions = {
            length: brick.length,
            width: brick.width,
            height: brick.height,
            type: type,
            name: brick.name,
            material: 'terracotta' // Toutes les briques en terre cuite rouge
        };
        
        // Forcer la mise à jour de l'élément fantôme si ConstructionTools est disponible
        if (window.ConstructionTools && window.ConstructionTools.updateGhostElement) {
            // console.log('🔧 Appel de updateGhostElement depuis brick-selector');
            window.ConstructionTools.updateGhostElement();
        }
    }

    showNotification(message) {
        // Créer une notification temporaire
        const notification = document.createElement('div');
        notification.className = 'brick-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(74, 144, 226, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Supprimer après 3 secondes
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    getCurrentBrick() {
        return {
            type: this.currentBrick,
            ...this.brickTypes[this.currentBrick]
        };
    }

    // Méthode pour obtenir uniquement le type de brique actuel
    getCurrentType() {
        return this.currentBrick || null;
    }

    // Méthode pour obtenir tous les types de briques
    getBrickData() {
        return this.brickTypes;
    }

    // Méthode pour changer la brique programmatiquement
    setBrick(type, customDimensions = null) {
        if (window.DEBUG_CONSTRUCTION) {
            console.log(`🧱 BrickSelector: setBrick appelé avec "${type}"`);
        }
        
        // 🔧 NOUVEAU: Vérifier s'il faut préserver une sélection de coupe récente
        if (window.lastCutSelection && 
            type.match(/^M\d+$/) && // ✅ CORRECTION: Tous les types de briques M##
            window.lastCutSelection.finalType !== type &&
            window.lastCutSelection.baseType === type && // ✅ CORRECTION: Vérifier que le type de base correspond
            (Date.now() - window.lastCutSelection.timestamp) < 5000) { // 5 secondes
            
            console.log('🛡️ BrickSelector: Préservation de la sélection de coupe récente:', 
                        window.lastCutSelection.finalType, 'au lieu de', type);
            
            type = window.lastCutSelection.finalType;
        }
        
        // 🔧 CORRECTION: Nettoyer tempGLBInfo lors de la sélection d'une brique normale
        // Mais PAS pour les découpes du même type GLB
        if (type && window.tempGLBInfo) {
            const isGLBType = this.brickTypes[type] && this.brickTypes[type].category === 'glb';
            const isGLBCut = type.includes('_') && this.brickTypes[type.split('_')[0]] && 
                           this.brickTypes[type.split('_')[0]].category === 'glb';
            
            // Vérifier si c'est une sélection de brique normale de base (pas une découpe)
            const isBaseBrickSelection = this.brickTypes[type] && 
                                       (this.brickTypes[type].category === 'full' || 
                                        this.brickTypes[type].category === 'cut') && 
                                       !isGLBType;
            
            // Ne nettoyer que pour la sélection d'une brique de base (changement de mode délibéré)
            if (isBaseBrickSelection) {
                console.log('🧹 Nettoyage tempGLBInfo - sélection brique de base:', type);
                
                // 🧹 Nettoyage complet du mode GLB
                if (window.ConstructionTools && window.ConstructionTools.clearGLBMode) {
                    window.ConstructionTools.clearGLBMode();
                } else {
                    console.log('🧹 DEBUG Fallback clearGLBMode...');
                    // Fallback si ConstructionTools pas disponible
                    window.tempGLBInfo = null;
                    if (window.ConstructionTools && window.ConstructionTools.removeGhostElement) {
                        window.ConstructionTools.removeGhostElement();
                    }
                }
            }
        }
        
        // Gérer les éléments GLB
        if (type && this.brickTypes[type] && this.brickTypes[type].category === 'glb') {
            this.currentBrick = type;
            this.selectedType = type;
            
            // Afficher le D-pad GLB dès la sélection d'un élément GLB
            if (window.GLBDpadController) {
                window.GLBDpadController.showForObjectType(true); // true = objet GLB avec boutons Y
            }
            
            return true;
        }
        
        // ✅ CORRECTION: Créer le type s'il n'existe pas (cas des coupes personnalisées)
        if (!this.brickTypes[type]) {
            const baseType = type.split('_')[0]; // Extraire le type de base (ex: M65 de M65_CUSTOM_16)
            if (this.brickTypes[baseType]) {
                // Créer le type personnalisé basé sur le type de base
                this.brickTypes[type] = { ...this.brickTypes[baseType] };
                // console.log(`🆕 Type de brique personnalisée créé: ${type} basé sur ${baseType}`);
            } else {
                console.warn(`❌ Type de base introuvable pour: ${type}`);
                return false;
            }
        }
        
        this.currentBrick = type;
        this.selectedType = type;
        
        // ✅ NOUVEAU: Utiliser les dimensions personnalisées si fournies
        if (customDimensions) {
            // console.log(`🎨 Application de dimensions personnalisées pour ${type}:`, customDimensions);
            this.brickTypes[type] = {
                ...this.brickTypes[type],
                ...customDimensions
            };
        }
        
        this.updateBrickDimensions(type);
        this.updateCurrentBrickDisplay();
        this.updateSelection();
        
        // NOUVEAU: Déclencher un événement de changement de brique
        document.dispatchEvent(new CustomEvent('brickSelectionChanged', {
            detail: {
                brickType: type,
                brickData: this.brickTypes[type]
            }
        }));
        
        // Basculer automatiquement vers l'assise correspondante si AssiseManager est disponible
        if (window.AssiseManager) {
            try {
                const baseType = type.split('_')[0]; // Enlever les suffixes comme _3Q, _HALF
                const brickSubTypes = ['M50', 'M57', 'M60', 'M65', 'M90'];
                if (brickSubTypes.includes(baseType)) {
                    // console.log(`🔄 BrickSelector: Basculement automatique vers l'assise ${baseType}`);
                    window.AssiseManager.setCurrentType(baseType, true); // skipToolChange = true
                }
            } catch (error) {
                console.warn('Erreur lors du basculement automatique d\'assise:', error);
            }
        }
        
        // Forcer la mise à jour complète du fantôme avec les nouvelles dimensions
        if (window.ConstructionTools && window.ConstructionTools.isInitialized) {
            // Recréer l'élément fantôme avec les nouvelles dimensions
            window.ConstructionTools.createGhostElement();
        }
        
        // Afficher le D-pad pour les formes basiques (sans boutons Y)
        if (window.GLBDpadController && this.brickTypes[type] && this.brickTypes[type].category !== 'glb') {
            window.GLBDpadController.showForObjectType(false); // false = forme basique sans boutons Y
        }
        
        return true;
    }

    // Méthode utilitaire pour obtenir toutes les variations d'une brique
    getBrickVariations(baseBrickType) {
        const baseBrick = this.brickTypes[baseBrickType];
        if (!baseBrick || baseBrick.category === 'cut') return [baseBrickType];
        
        const variations = [baseBrickType];
        
        // Ajouter les variations coupées si elles existent
        const cutTypes = ['3Q', 'HALF', '1Q'];
        cutTypes.forEach(cutType => {
            const cutKey = `${baseBrickType}_${cutType}`;
            if (this.brickTypes[cutKey]) {
                variations.push(cutKey);
            }
        });
        
        return variations;
    }

    // Méthode pour obtenir la brique de base d'une brique coupée
    getBaseBrick(brickType) {
        const brick = this.brickTypes[brickType];
        return brick && brick.baseBrick ? brick.baseBrick : brickType;
    }

    // Méthode pour obtenir le type de coupe
    getCutType(brickType) {
        const brick = this.brickTypes[brickType];
        return brick && brick.cutType ? brick.cutType : 'full';
    }

    // Méthode pour créer une brique coupée personnalisée
    createCustomCutBrick(baseBrickType, customLength, customName) {
        const baseBrick = this.brickTypes[baseBrickType];
        if (!baseBrick) return null;
        
        const customKey = `${baseBrickType}_CUSTOM_${customLength}`;
        this.brickTypes[customKey] = {
            length: customLength,
            width: baseBrick.width,
            height: baseBrick.height,
            name: customName || `${baseBrick.name} (${customLength}cm)`,
            category: 'cut',
            cutType: 'custom',
            baseBrick: baseBrickType
        };
        
        return customKey;
    }

    // Méthode pour mettre à jour l'affichage de la brique sélectionnée
    updateCurrentBrickDisplay() {
        const displayElement = document.getElementById('currentBrickDisplay');
        if (!displayElement) return;
        
        const brick = this.brickTypes[this.currentBrick];
        if (!brick) return;
        
        const nameElement = displayElement.querySelector('.brick-name');
        const dimensionsElement = displayElement.querySelector('.brick-dimensions');
        const typeElement = displayElement.querySelector('.brick-type');
        
        if (nameElement) nameElement.textContent = brick.name;
        if (dimensionsElement) dimensionsElement.textContent = `${brick.length}×${brick.height}×${brick.width} cm`;
        
        if (typeElement) {
            typeElement.classList.remove('cut');
            if (brick.category === 'cut') {
                const cutTypeLabels = {
                    '3/4': 'Coupe 3/4',
                    '1/2': 'Coupe 1/2', 
                    '1/4': 'Coupe 1/4',
                    'custom': 'Coupe personnalisée'
                };
                typeElement.textContent = cutTypeLabels[brick.cutType] || 'Coupée';
                typeElement.classList.add('cut');
            } else {
                typeElement.textContent = 'Entière';
            }
        }
        
        // NOUVELLE FONCTIONNALITÉ: Synchroniser le sélecteur brickTypeSelect
        this.synchronizeBrickTypeSelect();
    }
    
    // Nouvelle méthode pour synchroniser le sélecteur de type de brique
    synchronizeBrickTypeSelect() {
        const brickTypeSelect = document.getElementById('brickTypeSelect');
        if (!brickTypeSelect) {
            // console.warn('Sélecteur brickTypeSelect non trouvé pour la synchronisation');
            return;
        }
        
        // Extraire le type de base de la brique actuelle (sans les suffixes _3Q, _HALF, etc.)
        const baseType = this.getBaseType(this.currentBrick);
        
        // Vérifier si ce type existe dans le sélecteur
        const option = brickTypeSelect.querySelector(`option[value="${baseType}"]`);
        if (option) {
            // Désactiver temporairement les événements pour éviter les boucles
            const currentHandler = brickTypeSelect.onchange;
            brickTypeSelect.onchange = null;
            
            // Mettre à jour la valeur sélectionnée
            brickTypeSelect.value = baseType;
            
            // Restaurer le gestionnaire d'événements
            brickTypeSelect.onchange = currentHandler;
            
            console.log(`🔄 BrickTypeSelect synchronisé avec: ${baseType} (brique: ${this.currentBrick})`);
            
            // Mettre à jour l'indicateur visuel si AssiseManager est disponible
            if (window.AssiseManager && window.AssiseManager.updateBrickTypeIndicator) {
                window.AssiseManager.updateBrickTypeIndicator(baseType);
            }
        } else {
            console.warn(`Type de brique ${baseType} non trouvé dans brickTypeSelect`);
        }
    }
    
    // Méthode utilitaire pour extraire le type de base d'une brique
    getBaseType(brickType) {
        // Supprimer les suffixes comme _3Q, _HALF, _1Q
        return brickType.split('_')[0];
    }
    
    // Nouvelle méthode pour écouter les changements du sélecteur brickTypeSelect
    setupBrickTypeSelectListener() {
        // Écouter l'événement global brickTypeChanged émis par AssiseManager
        document.addEventListener('brickTypeChanged', (event) => {
            const newType = event.detail.newType;
            console.log(`🔄 BrickSelector: Réception de l'événement brickTypeChanged: ${newType}`);
            
            // Mettre à jour le BrickSelector si le type est différent
            const currentBaseType = this.getBaseType(this.currentBrick);
            if (currentBaseType !== newType) {
                console.log(`🔄 BrickSelector: Changement du type ${currentBaseType} vers ${newType}`);
                this.setBrick(newType);
            }
        });
        
        // console.log('🔄 BrickSelector: Listener pour brickTypeChanged configuré');
    }
    
    // Méthode pour détecter si une brique est sur chant
    isBrickOnChant(brickType) {
        return brickType && brickType.includes('CHANT');
    }
}

// Créer l'instance globale
window.BrickSelector = new BrickSelector();

// Styles pour les notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyles);

