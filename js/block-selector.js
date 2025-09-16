// Sélecteur de blocs
class BlockSelector {
    constructor() {
        this.currentBlock = 'B9'; // Par défaut
        this.blockTypes = {
            // Blocs creux
            'B9': { length: 39, width: 9, height: 19, name: 'Bloc creux B9', category: 'hollow', weight: 12 },
            'B14': { length: 39, width: 14, height: 19, name: 'Bloc creux B14', category: 'hollow', weight: 15 },
            'B19': { length: 39, width: 19, height: 19, name: 'Bloc creux B19', category: 'hollow', weight: 18 },
            'B29': { length: 39, width: 29, height: 19, name: 'Bloc creux B29', category: 'hollow', weight: 23 },
            
            // Blocs creux coupés 3/4 (29cm)
            'B9_3Q': { length: 29, width: 9, height: 19, name: 'Bloc creux B9 3/4', category: 'cut', cutType: '3/4', baseBlock: 'B9', weight: 9 },
            'B14_3Q': { length: 29, width: 14, height: 19, name: 'Bloc creux B14 3/4', category: 'cut', cutType: '3/4', baseBlock: 'B14', weight: 11.25 },
            'B19_3Q': { length: 29, width: 19, height: 19, name: 'Bloc creux B19 3/4', category: 'cut', cutType: '3/4', baseBlock: 'B19', weight: 13.5 },
            'B29_3Q': { length: 29, width: 29, height: 19, name: 'Bloc creux B29 3/4', category: 'cut', cutType: '3/4', baseBlock: 'B29', weight: 17.25 },
            
            // Blocs creux coupés 1/2 (19cm)
            'B9_HALF': { length: 19, width: 9, height: 19, name: 'Bloc creux B9 1/2', category: 'cut', cutType: '1/2', baseBlock: 'B9', weight: 6 },
            'B14_HALF': { length: 19, width: 14, height: 19, name: 'Bloc creux B14 1/2', category: 'cut', cutType: '1/2', baseBlock: 'B14', weight: 7.5 },
            'B19_HALF': { length: 19, width: 19, height: 19, name: 'Bloc creux B19 1/2', category: 'cut', cutType: '1/2', baseBlock: 'B19', weight: 9 },
            'B29_HALF': { length: 19, width: 29, height: 19, name: 'Bloc creux B29 1/2', category: 'cut', cutType: '1/2', baseBlock: 'B29', weight: 11.5 },
            
            // Blocs creux coupés 1/4 (9cm)
            'B9_1Q': { length: 9, width: 9, height: 19, name: 'Bloc creux B9 1/4', category: 'cut', cutType: '1/4', baseBlock: 'B9', weight: 3 },
            'B14_1Q': { length: 9, width: 14, height: 19, name: 'Bloc creux B14 1/4', category: 'cut', cutType: '1/4', baseBlock: 'B14', weight: 3.75 },
            'B19_1Q': { length: 9, width: 19, height: 19, name: 'Bloc creux B19 1/4', category: 'cut', cutType: '1/4', baseBlock: 'B19', weight: 4.5 },
            'B29_1Q': { length: 9, width: 29, height: 19, name: 'Bloc creux B29 1/4', category: 'cut', cutType: '1/4', baseBlock: 'B29', weight: 5.75 },
            
            // Blocs creux B14 longueurs spécifiques
            'B14_34CM': { length: 34, width: 14, height: 19, name: 'Bloc creux B14 34cm', category: 'cut', cutType: '34cm', baseBlock: 'B14', weight: 13.1 },
            'B14_4CM': { length: 4, width: 14, height: 19, name: 'Bloc creux B14 4cm', category: 'cut', cutType: '4cm', baseBlock: 'B14', weight: 1.5 },
            
            // Blocs béton cellulaire
            'BC_60x5': { length: 60, width: 5, height: 25, name: 'Bloc béton cell. 60x5x25', category: 'cellular', customCut: true },
            'BC_60x7': { length: 60, width: 7, height: 25, name: 'Bloc béton cell. 60x7x25', category: 'cellular', customCut: true },
            'BC_60x10': { length: 60, width: 10, height: 25, name: 'Bloc béton cell. 60x10x25', category: 'cellular', customCut: true },
            'BC_60x15': { length: 60, width: 15, height: 25, name: 'Bloc béton cell. 60x15x25', category: 'cellular', customCut: true },
            'BC_60x17': { length: 60, width: 17.5, height: 25, name: 'Bloc béton cell. 60x17.5x25', category: 'cellular', customCut: true },
            'BC_60x20': { length: 60, width: 20, height: 25, name: 'Bloc béton cell. 60x20x25', category: 'cellular', customCut: true },
            'BC_60x24': { length: 60, width: 24, height: 25, name: 'Bloc béton cell. 60x24x25', category: 'cellular', customCut: true },
            'BC_60x30': { length: 60, width: 30, height: 25, name: 'Bloc béton cell. 60x30x25', category: 'cellular', customCut: true },
            'BC_60x36': { length: 60, width: 36, height: 25, name: 'Bloc béton cell. 60x36x25', category: 'cellular', customCut: true },
            
            // Blocs Argex
            'ARGEX_39x9': { length: 39, width: 9, height: 19, name: 'Bloc Argex 39x9x19', category: 'argex' },
            'ARGEX_39x14': { length: 39, width: 14, height: 19, name: 'Bloc Argex 39x14x19', category: 'argex' },
            'ARGEX_39x19': { length: 39, width: 19, height: 19, name: 'Bloc Argex 39x19x19', category: 'argex' },
            
            // Béton cellulaire Assise
            'BCA_60x9x20': { length: 60, width: 9, height: 20, name: 'Béton cell. Assise 60x9x20', category: 'cellular-assise', customCut: true },
            'BCA_60x14x20': { length: 60, width: 14, height: 20, name: 'Béton cell. Assise 60x14x20', category: 'cellular-assise', customCut: true },
            'BCA_60x19x20': { length: 60, width: 19, height: 20, name: 'Béton cell. Assise 60x19x20', category: 'cellular-assise', customCut: true },
            'BCA_60x9x25': { length: 60, width: 9, height: 25, name: 'Béton cell. Assise 60x9x25', category: 'cellular-assise', customCut: true },
            'BCA_60x14x25': { length: 60, width: 14, height: 25, name: 'Béton cell. Assise 60x14x25', category: 'cellular-assise', customCut: true },
            'BCA_60x19x25': { length: 60, width: 19, height: 25, name: 'Béton cell. Assise 60x19x25', category: 'cellular-assise', customCut: true },
            
            // Terre cuite
            'TC_50x10': { length: 50, width: 10, height: 25, name: 'Terre cuite 50x10x25', category: 'terracotta', customCut: true },
            'TC_50x14': { length: 50, width: 14, height: 25, name: 'Terre cuite 50x14x25', category: 'terracotta', customCut: true },
            'TC_50x19': { length: 50, width: 19, height: 25, name: 'Terre cuite 50x19x25', category: 'terracotta', customCut: true }
            ,
            // Asselets béton armé (assises spéciales) demandés
            'ASSELET_BA_60x14x19': { length: 60, width: 14, height: 19, name: 'Asselet béton armé 60x14x19', category: 'reinforced-sill', reinforced: true },
            'ASSELET_BA_60x19x19': { length: 60, width: 19, height: 19, name: 'Asselet béton armé 60x19x19', category: 'reinforced-sill', reinforced: true }
        };
        
        this.modal = null;
        this.selectedType = this.currentBlock;
        this.customCutModal = null;
        this.init();
    }

    init() {
        this.modal = document.getElementById('blockSelector');
        this.customCutModal = document.getElementById('customCutModal');
        this.setupEventListeners();
        
        // Initialiser les dimensions par défaut
        this.updateBlockDimensions(this.currentBlock);
        this.updateCurrentBlockDisplay();
        
        // console.log('BlockSelector initialisé avec le bloc par défaut:', this.currentBlock);
    }

    setupEventListeners() {
        // Ouvrir la modale quand on clique sur le bouton Blocs
        const blockButton = document.getElementById('blockMode');
        if (blockButton) {
            blockButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.showModal();
            });
        }

        // Fermer la modale
        const closeBtn = document.getElementById('closeBlockSelector');
        const cancelBtn = document.getElementById('cancelBlockSelection');
        
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

        // Sélection de bloc
        const sizeButtons = document.querySelectorAll('.block-size-btn');
        sizeButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (button.dataset.customCut === 'true') {
                    this.showCustomCutModal(button.dataset.type);
                } else {
                    this.selectBlock(button.dataset.type);
                }
            });
        });

        // Gestion de la coupe personnalisée
        this.setupCustomCutListeners();

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
                    console.log(`🚫 BlockSelector: Modale TabManager active, ignorer confirmCustomCut`);
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
        
        this.selectedType = this.currentBlock;
        this.updateSelection();
        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Jouer le son d'ouverture
        // Son supprimé
        
        console.log('Modale de sélection de blocs ouverte');
    }

    hideModal() {
        if (!this.modal) return;
        
        this.modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // Remettre la sélection sur le bloc courant
        this.selectedType = this.currentBlock;
        this.updateSelection();
        
        console.log('Modale de sélection de blocs fermée');
    }

    showCustomCutModal(blockType) {
        // ✅ SÉCURITÉ: Ne pas ouvrir si TabManager gère déjà une coupe personnalisée
        const tabManagerModal = document.querySelector('.tabmanager-dynamic-modal');
        if (tabManagerModal) {
            console.log(`🚫 BlockSelector: TabManager gère déjà la coupe personnalisée, ignorer showCustomCutModal`);
            return;
        }
        
        if (!this.customCutModal) return;
        
        const block = this.blockTypes[blockType];
        if (!block) return;

        // Mettre à jour le titre
        const title = this.customCutModal.querySelector('.custom-cut-title');
        if (title) {
            title.textContent = `Coupe personnalisée - ${block.name}`;
        }

        // Mettre à jour les dimensions par défaut
        const lengthInput = document.getElementById('customLength');
        const widthInput = document.getElementById('customWidth');
        const heightInput = document.getElementById('customHeight');

        if (lengthInput) lengthInput.value = block.length;
        if (widthInput) widthInput.value = block.width;
        if (heightInput) heightInput.value = block.height;

        // Stocker le type de bloc pour la confirmation
        this.customCutModal.dataset.baseType = blockType;

        this.customCutModal.classList.add('show');
    }

    hideCustomCutModal() {
        if (!this.customCutModal) return;
        this.customCutModal.classList.remove('show');
    }

    confirmCustomCut() {
        // ✅ SÉCURITÉ RENFORCÉE: Vérifier que c'est bien notre modale ET que le type est un bloc
        if (!this.customCutModal || this.customCutModal.style.display !== 'block') {
            console.log(`🚫 BlockSelector: Modale non active, ignorer confirmCustomCut`);
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
        
        // ✅ SÉCURITÉ RENFORCÉE: Vérifier que le type appartient aux blocs
        if (!baseType || !baseType.startsWith('B') || baseType.startsWith('M')) {
            console.log(`🚫 BlockSelector: Type "${baseType}" n'est pas un bloc (probablement une brique), ignorer confirmCustomCut`);
            return;
        }
        
        const baseBlock = this.blockTypes[baseType];

        // ✅ SÉCURITÉ: Vérifier que le bloc de base existe
        if (!baseBlock) {
            console.error(`❌ BlockSelector: Type de base "${baseType}" non trouvé dans blockTypes`);
            
            this.hideCustomCutModal();
            return;
        }

        // Créer un nouveau type de bloc personnalisé
        const customType = `${baseType}_CUSTOM_${Date.now()}`;
        this.blockTypes[customType] = {
            length: length,
            width: width,
            height: height,
            name: `${baseBlock.name} (${length}×${width}×${height})`,
            category: baseBlock.category,
            isCustom: true,
            baseBlock: baseType
        };

        this.selectBlock(customType);
        this.hideCustomCutModal();
    }

    selectBlock(type) {
        if (!this.blockTypes[type]) return;
        
        this.selectedType = type;
        this.updateSelection();
        
        // NOUVEAU: Basculement automatique d'assise DÈS la sélection
        try {
            if (window.AssiseManager && this.blockTypes[type]) {
                const block = this.blockTypes[type];
                let assiseType = null;
                
                switch (block.category) {
                    case 'cellular':
                    case 'cellular-assise':
                        // Détection du sous-type BC*
                        if (type.includes('60x5')) {
                            assiseType = 'BC5';
                        } else if (type.includes('60x7')) {
                            assiseType = 'BC7';
                        } else if (type.includes('60x10') || type.includes('60x9')) {
                            assiseType = 'BC10';
                        } else if (type.includes('60x15') || type.includes('60x14')) {
                            assiseType = 'BC15';
                        } else if (type.includes('60x17')) {
                            assiseType = 'BC17';
                        } else if (type.includes('60x20') || type.includes('60x19')) {
                            assiseType = 'BC20';
                        } else if (type.includes('60x24')) {
                            assiseType = 'BC24';
                        } else if (type.includes('60x30')) {
                            assiseType = 'BC30';
                        } else if (type.includes('60x36')) {
                            assiseType = 'BC36';
                        } else {
                            // Fallback vers le type générique
                            assiseType = 'CELLULAIRE';
                        }
                        break;
                    case 'argex':
                        // Détection du sous-type ARGEX selon la largeur
                        if (type.includes('39x9')) {
                            assiseType = 'ARGEX9';
                        } else if (type.includes('39x14')) {
                            assiseType = 'ARGEX14';
                        } else if (type.includes('39x19')) {
                            assiseType = 'ARGEX19';
                        } else {
                            assiseType = 'ARGEX'; // Fallback générique
                        }
                        break;
                    case 'terracotta':
                        // Détection du sous-type terre cuite selon la largeur
                        if (type.includes('50x10')) {
                            assiseType = 'TC10';
                        } else if (type.includes('50x14')) {
                            assiseType = 'TC14';
                        } else if (type.includes('50x19')) {
                            assiseType = 'TC19';
                        } else {
                            assiseType = 'TERRE_CUITE'; // Fallback générique
                        }
                        break;
                }
                
                if (assiseType) {
                    console.log('BASCULEMENT-SELECT: Basculement automatique vers', assiseType, 'pour bloc', type);
                    // Basculement automatique vers l'assise dès la sélection
                    window.AssiseManager.setCurrentType(assiseType, false); // SANS skipToolChange pour mise à jour complète
                }
            }
        } catch (error) {
            console.warn('Erreur lors du basculement automatique d\'assise pour bloc:', error);
        }
        
        // Animation de sélection
        const sizeButton = document.querySelector(`.block-size-btn[data-type="${type}"]`);
        if (sizeButton) {
            sizeButton.classList.add('selecting');
            setTimeout(() => {
                sizeButton.classList.remove('selecting');
            }, 300);
        }

        // Confirmer automatiquement la sélection
        this.confirmSelection();

        console.log('Bloc sélectionné:', type, this.blockTypes[type]);
    }

    confirmSelection() {
        // Masquer les aides contextuelles lors de la sélection d'un bloc
        if (window.TabManager && window.TabManager.hideAllContextualHelp) {
            window.TabManager.hideAllContextualHelp();
        }
        
        this.setBlock(this.selectedType);
        this.hideModal();
    }

    setBlock(type, customDimensions = null) {
        // ✅ CORRECTION: Créer le type s'il n'existe pas (cas des coupes personnalisées)
        if (!this.blockTypes[type]) {
            // Extraire le type de base de manière robuste
            let baseType = type;
            const customIdx = baseType.indexOf('_CUSTOM_');
            if (customIdx !== -1) {
                baseType = baseType.substring(0, customIdx);
            } else {
                // Retirer les suffixes de coupe connus (_HALF, _3Q, _1Q) s'ils existent
                const cutSuffixMatch = baseType.match(/_(HALF|3Q|1Q)$/);
                if (cutSuffixMatch) {
                    baseType = baseType.substring(0, baseType.lastIndexOf('_'));
                }
            }

            // Fallback: tenter en retirant la dernière section après « _ »
            if (!this.blockTypes[baseType]) {
                const lastUnderscore = type.lastIndexOf('_');
                if (lastUnderscore > -1) {
                    const candidate = type.substring(0, lastUnderscore);
                    if (this.blockTypes[candidate]) {
                        baseType = candidate;
                    }
                }
            }

            if (this.blockTypes[baseType]) {
                const baseBlock = this.blockTypes[baseType];

                // Déterminer le type de coupe et ajuster la longueur si nécessaire
                let cutTypeLabel = null;
                let length = baseBlock.length;
                if (/_(HALF|3Q|1Q)$/.test(type)) {
                    const code = type.match(/_(HALF|3Q|1Q)$/)[1];
                    const factorMap = { HALF: 0.5, '3Q': 0.75, '1Q': 0.25 };
                    const labelMap = { HALF: '1/2', '3Q': '3/4', '1Q': '1/4' };
                    cutTypeLabel = labelMap[code];
                    const factor = factorMap[code] || 1;
                    length = Math.round(baseBlock.length * factor * 100) / 100; // arrondi 2 décimales si besoin
                }

                // Créer une entrée dérivée pour cette coupe
                this.blockTypes[type] = {
                    ...baseBlock,
                    length,
                    name: cutTypeLabel ? `${baseBlock.name} ${cutTypeLabel}` : baseBlock.name,
                    category: 'cut',
                    baseBlock: baseType,
                    cutType: cutTypeLabel || baseBlock.cutType
                };
                // console.log(`🆕 Type dérivé (coupe) créé: ${type} basé sur ${baseType}`); // désactivé
            } else {
                console.warn(`❌ Type de base introuvable pour: ${type}`);
                return;
            }
        }
        
        this.currentBlock = type;
        
        // ✅ NOUVEAU: Utiliser les dimensions personnalisées si fournies
        if (customDimensions) {
            // console.log(`🎨 Application de dimensions personnalisées pour ${type}:`, customDimensions); // désactivé
            this.blockTypes[type] = {
                ...this.blockTypes[type],
                ...customDimensions
            };
        }
        
        // Mettre à jour les dimensions AVANT tout changement de mode
        this.updateBlockDimensions(type);
        
        // Changer de mode seulement si nécessaire, en préservant les dimensions
        if (window.ConstructionTools && window.ConstructionTools.currentMode !== 'block') {
            if (window.UIController) {
                window.UIController.setConstructionMode('block', true);
            }
        } else if (window.ConstructionTools) {
            // Si on est déjà en mode block, juste forcer la mise à jour du fantôme
            // Déjà en mode block, mise à jour de l'interface et du fantôme
            window.ConstructionTools.updateModeInterface('block');
            if (window.ConstructionTools.updateGhostElement) {
                // Appel de updateGhostElement depuis setBlock (mode déjà block)
                window.ConstructionTools.updateGhostElement();
            }
        }
        
        // Enfin mettre à jour l'affichage
        this.updateCurrentBlockDisplay();
        
        // Mettre à jour la surbrillance dans la bibliothèque
        this.updateLibraryHighlight();
        
        // NOUVEAU: Déclencher un événement pour la synchronisation avec le menu flottant
        document.dispatchEvent(new CustomEvent('blockSelectionChanged', {
            detail: {
                newType: type,
                blockData: this.blockTypes[type]
            }
        }));
        
        // Bloc défini
    }

    updateSelection() {
        // Mettre à jour la sélection visuelle
        const buttons = document.querySelectorAll('.block-size-btn');
        buttons.forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.type === this.selectedType) {
                btn.classList.add('selected');
            }
        });
    }

    updateBlockDimensions(type) {
        const block = this.blockTypes[type];
        if (!block) return;
        
        // Déterminer le matériau selon le type de bloc
        let material = 'concrete'; // Par défaut béton
        if (type.startsWith('TC_')) {
            material = 'terracotta'; // Blocs terre cuite → terre cuite rouge
        } else if (type.startsWith('BC_') || type.startsWith('BCA_')) {
            material = 'cellular-concrete'; // Blocs béton cellulaire → béton cellulaire blanc
        }
        
        // Mettre à jour les inputs HTML utilisés par ConstructionTools
        const lengthInput = document.getElementById('elementLength');
        const widthInput = document.getElementById('elementWidth');
        const heightInput = document.getElementById('elementHeight');
        
        if (lengthInput) lengthInput.value = block.length;
        if (widthInput) widthInput.value = block.width;
        if (heightInput) heightInput.value = block.height;
        
        // Mettre à jour les dimensions globales pour l'utilisation par d'autres modules
        window.currentBlockDimensions = {
            length: block.length,
            width: block.width,
            height: block.height,
            type: type,
            name: block.name,
            material: material // Matériau déterminé selon les règles
        };
        
        // Forcer la mise à jour de l'élément fantôme si ConstructionTools est disponible
        if (window.ConstructionTools && window.ConstructionTools.updateGhostElement) {
            window.ConstructionTools.updateGhostElement();
        }
    }

    updateCurrentBlockDisplay() {
        const block = this.blockTypes[this.currentBlock];
        if (!block) return;
        
        // Mettre à jour l'affichage du bloc sélectionné
        const blockInfo = document.querySelector('.selected-block-info');
        if (blockInfo) {
            const nameElement = blockInfo.querySelector('.block-name');
            const dimensionsElement = blockInfo.querySelector('.block-dimensions');
            
            if (nameElement) nameElement.textContent = block.name;
            if (dimensionsElement) {
                dimensionsElement.textContent = `${block.length}×${block.width}×${block.height} cm`;
            }
        }
    }

    getBaseBlock(blockType) {
        const block = this.blockTypes[blockType];
        return block && block.baseBlock ? block.baseBlock : blockType.split('_')[0];
    }

    getCurrentBlock() {
        return this.currentBlock;
    }

    // Méthode pour obtenir le type actuel (pour compatibilité avec scene-manager)
    getCurrentType() {
        return this.currentBlock;
    }

    getCurrentBlockData() {
        return this.blockTypes[this.currentBlock];
    }

    getBlockData() {
        return this.blockTypes;
    }

    showNotification(message) {
        // Créer une notification temporaire
        const notification = document.createElement('div');
        notification.className = 'block-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }

    updateLibraryHighlight() {
        // Supprimer la surbrillance de tous les éléments de bibliothèque
        const allLibraryItems = document.querySelectorAll('.library-item');
        allLibraryItems.forEach(item => {
            item.classList.remove('active');
            // Supprimer aussi l'état actif des boutons de coupe
            const cutButtons = item.querySelectorAll('.cut-btn-mini');
            cutButtons.forEach(btn => btn.classList.remove('active'));
        });
        
        // Obtenir le type de base pour les blocs coupés
        let displayType = this.currentBlock;
        const blockInfo = this.blockTypes[this.currentBlock];
        
        // Si c'est un bloc coupé, utiliser le type de base pour la surbrillance
        if (blockInfo && blockInfo.baseBlock) {
            displayType = blockInfo.baseBlock;
        }
        
        // Ajouter la surbrillance à l'élément actuel
        const currentLibraryItem = document.querySelector(`[data-type="${displayType}"]`);
        if (currentLibraryItem) {
            currentLibraryItem.classList.add('active');
            
            // Si c'est un bloc entier, activer le bouton 1/1
            if (blockInfo && blockInfo.category !== 'cut') {
                const wholeButton = currentLibraryItem.querySelector('[data-cut="1/1"]');
                if (wholeButton) {
                    wholeButton.classList.add('active');
                }
            } else if (blockInfo && blockInfo.cutType) {
                // Si c'est un bloc coupé, activer le bouton correspondant
                const cutButton = currentLibraryItem.querySelector(`[data-cut="${blockInfo.cutType}"]`);
                if (cutButton) {
                    cutButton.classList.add('active');
                }
            }
        }
    }
}

// Initialiser le sélecteur de blocs quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    window.BlockSelector = new BlockSelector();
});
