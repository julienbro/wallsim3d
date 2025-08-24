// Sélecteur d'isolants
class InsulationSelector {
    constructor() {
        this.currentInsulation = 'PUR5'; // Par défaut
        this.selectedType = 'PUR5'; // Ajouter cette ligne
        this.isCustomDimensions = false; // Nouveau: suivre si c'est des dimensions personnalisées
        this.insulationTypes = {
            // Isolants PUR avec dimensions personnalisables
            'PUR5': { 
                length: 120, 
                width: 5, 
                height: 60, 
                name: 'Isolant PUR5', 
                category: 'pur',
                customizable: true,
                baseType: 'PUR',
                materialType: 'insulation'
            },
            'PUR6': { 
                length: 120, 
                width: 6, 
                height: 60, 
                name: 'Isolant PUR6', 
                category: 'pur',
                customizable: true,
                baseType: 'PUR',
                materialType: 'insulation'
            },
            'PUR7': { 
                length: 120, 
                width: 7, 
                height: 60, 
                name: 'Isolant PUR7', 
                category: 'pur',
                customizable: true,
                baseType: 'PUR',
                materialType: 'insulation'
            },
            
            // Isolants Laine de roche avec dimensions personnalisables
            'LAINEROCHE5': { 
                length: 120, 
                width: 5, 
                height: 60, 
                name: 'Isolant Laine de roche (120x5x60 cm)', 
                category: 'laine-roche',
                customizable: true,
                baseType: 'LAINEROCHE',
                materialType: 'rock-wool'
            },
            'LAINEROCHE6': { 
                length: 120, 
                width: 6, 
                height: 60, 
                name: 'Isolant laine de roche (120x6x60 cm)', 
                category: 'laine-roche',
                customizable: true,
                baseType: 'LAINEROCHE',
                materialType: 'rock-wool'
            },
            'LAINEROCHE7': { 
                length: 120, 
                width: 7, 
                height: 60, 
                name: 'Isolant laine de roche (120x7x60 cm)', 
                category: 'laine-roche',
                customizable: true,
                baseType: 'LAINEROCHE',
                materialType: 'rock-wool'
            },
            
            // Panneaux XPS (Polystyrène Extrudé) - pour zones humides : 125×60 cm
            'XPS20': { 
                length: 125, 
                width: 2, 
                height: 60, 
                name: 'Panneau XPS 20mm (125×60 cm)', 
                category: 'xps',
                customizable: false,
                baseType: 'XPS',
                materialType: 'xps',
                description: 'Zones humides (sols, soubassements)'
            },
            'XPS30': { 
                length: 125, 
                width: 3, 
                height: 60, 
                name: 'Panneau XPS 30mm (125×60 cm)', 
                category: 'xps',
                customizable: false,
                baseType: 'XPS',
                materialType: 'xps',
                description: 'Zones humides (sols, soubassements)'
            },
            'XPS40': { 
                length: 125, 
                width: 4, 
                height: 60, 
                name: 'Panneau XPS 40mm (125×60 cm)', 
                category: 'xps',
                customizable: false,
                baseType: 'XPS',
                materialType: 'xps',
                description: 'Zones humides (sols, soubassements)'
            },
            'XPS50': { 
                length: 125, 
                width: 5, 
                height: 60, 
                name: 'Panneau XPS 50mm (125×60 cm)', 
                category: 'xps',
                customizable: false,
                baseType: 'XPS',
                materialType: 'xps',
                description: 'Zones humides (sols, soubassements)'
            },
            'XPS60': { 
                length: 125, 
                width: 6, 
                height: 60, 
                name: 'Panneau XPS 60mm (125×60 cm)', 
                category: 'xps',
                customizable: false,
                baseType: 'XPS',
                materialType: 'xps',
                description: 'Zones humides (sols, soubassements)'
            },
            'XPS80': { 
                length: 125, 
                width: 8, 
                height: 60, 
                name: 'Panneau XPS 80mm (125×60 cm)', 
                category: 'xps',
                customizable: false,
                baseType: 'XPS',
                materialType: 'xps',
                description: 'Zones humides (sols, soubassements)'
            },
            'XPS100': { 
                length: 125, 
                width: 10, 
                height: 60, 
                name: 'Panneau XPS 100mm (125×60 cm)', 
                category: 'xps',
                customizable: false,
                baseType: 'XPS',
                materialType: 'xps',
                description: 'Zones humides (sols, soubassements)'
            },
            
            // Panneaux PSE (Polystyrène Expansé) - solution économique : 100×50 cm
            'PSE20': { 
                length: 100, 
                width: 2, 
                height: 50, 
                name: 'Panneau PSE 20mm (100×50 cm)', 
                category: 'pse',
                customizable: false,
                baseType: 'PSE',
                materialType: 'pse',
                description: 'Solution économique pour façades'
            },
            'PSE30': { 
                length: 100, 
                width: 3, 
                height: 50, 
                name: 'Panneau PSE 30mm (100×50 cm)', 
                category: 'pse',
                customizable: false,
                baseType: 'PSE',
                materialType: 'pse',
                description: 'Solution économique pour façades'
            },
            'PSE40': { 
                length: 100, 
                width: 4, 
                height: 50, 
                name: 'Panneau PSE 40mm (100×50 cm)', 
                category: 'pse',
                customizable: false,
                baseType: 'PSE',
                materialType: 'pse',
                description: 'Solution économique pour façades'
            },
            'PSE50': { 
                length: 100, 
                width: 5, 
                height: 50, 
                name: 'Panneau PSE 50mm (100×50 cm)', 
                category: 'pse',
                customizable: false,
                baseType: 'PSE',
                materialType: 'pse',
                description: 'Solution économique pour façades'
            },
            'PSE60': { 
                length: 100, 
                width: 6, 
                height: 50, 
                name: 'Panneau PSE 60mm (100×50 cm)', 
                category: 'pse',
                customizable: false,
                baseType: 'PSE',
                materialType: 'pse',
                description: 'Solution économique pour façades'
            },
            'PSE80': { 
                length: 100, 
                width: 8, 
                height: 50, 
                name: 'Panneau PSE 80mm (100×50 cm)', 
                category: 'pse',
                customizable: false,
                baseType: 'PSE',
                materialType: 'pse',
                description: 'Solution économique pour façades'
            },
            'PSE100': { 
                length: 100, 
                width: 10, 
                height: 50, 
                name: 'Panneau PSE 100mm (100×50 cm)', 
                category: 'pse',
                customizable: false,
                baseType: 'PSE',
                materialType: 'pse',
                description: 'Solution économique pour façades'
            },
            'PSE120': { 
                length: 100, 
                width: 12, 
                height: 50, 
                name: 'Panneau PSE 120mm (100×50 cm)', 
                category: 'pse',
                customizable: false,
                baseType: 'PSE',
                materialType: 'pse',
                description: 'Solution économique pour façades'
            },
            'PSE140': { 
                length: 100, 
                width: 14, 
                height: 50, 
                name: 'Panneau PSE 140mm (100×50 cm)', 
                category: 'pse',
                customizable: false,
                baseType: 'PSE',
                materialType: 'pse',
                description: 'Solution économique pour façades'
            },
            'PSE160': { 
                length: 100, 
                width: 16, 
                height: 50, 
                name: 'Panneau PSE 160mm (100×50 cm)', 
                category: 'pse',
                customizable: false,
                baseType: 'PSE',
                materialType: 'pse',
                description: 'Solution économique pour façades'
            },
            'PSE200': { 
                length: 100, 
                width: 20, 
                height: 50, 
                name: 'Panneau PSE 200mm (100×50 cm)', 
                category: 'pse',
                customizable: false,
                baseType: 'PSE',
                materialType: 'pse',
                description: 'Solution économique pour façades'
            },
            'PSE300': { 
                length: 100, 
                width: 30, 
                height: 50, 
                name: 'Panneau PSE 300mm (100×50 cm)', 
                category: 'pse',
                customizable: false,
                baseType: 'PSE',
                materialType: 'pse',
                description: 'Solution économique pour façades'
            },
            
            // Panneaux Fibre de Bois - choix écologique : 135×57.5 cm
            'FB40': { 
                length: 135, 
                width: 4, 
                height: 57.5, 
                name: 'Fibre Bois 40mm (135×57.5 cm)', 
                category: 'fibre-bois',
                customizable: false,
                baseType: 'FB',
                materialType: 'fibre-bois',
                description: 'Choix écologique, confort été'
            },
            'FB60': { 
                length: 135, 
                width: 6, 
                height: 57.5, 
                name: 'Fibre Bois 60mm (135×57.5 cm)', 
                category: 'fibre-bois',
                customizable: false,
                baseType: 'FB',
                materialType: 'fibre-bois',
                description: 'Choix écologique, confort été'
            },
            'FB80': { 
                length: 135, 
                width: 8, 
                height: 57.5, 
                name: 'Fibre Bois 80mm (135×57.5 cm)', 
                category: 'fibre-bois',
                customizable: false,
                baseType: 'FB',
                materialType: 'fibre-bois',
                description: 'Choix écologique, confort été'
            },
            'FB100': { 
                length: 135, 
                width: 10, 
                height: 57.5, 
                name: 'Fibre Bois 100mm (135×57.5 cm)', 
                category: 'fibre-bois',
                customizable: false,
                baseType: 'FB',
                materialType: 'fibre-bois',
                description: 'Choix écologique, confort été'
            },
            'FB120': { 
                length: 135, 
                width: 12, 
                height: 57.5, 
                name: 'Fibre Bois 120mm (135×57.5 cm)', 
                category: 'fibre-bois',
                customizable: false,
                baseType: 'FB',
                materialType: 'fibre-bois',
                description: 'Choix écologique, confort été'
            },
            'FB140': { 
                length: 135, 
                width: 14, 
                height: 57.5, 
                name: 'Fibre Bois 140mm (135×57.5 cm)', 
                category: 'fibre-bois',
                customizable: false,
                baseType: 'FB',
                materialType: 'fibre-bois',
                description: 'Choix écologique, confort été'
            },
            'FB160': { 
                length: 135, 
                width: 16, 
                height: 57.5, 
                name: 'Fibre Bois 160mm (135×57.5 cm)', 
                category: 'fibre-bois',
                customizable: false,
                baseType: 'FB',
                materialType: 'fibre-bois',
                description: 'Choix écologique, confort été'
            },
            
            // Laine de Verre (panneaux) - grand classique : 120×60 cm
            'LV60': { 
                length: 120, 
                width: 6, 
                height: 60, 
                name: 'Laine Verre 60mm (120×60 cm)', 
                category: 'laine-verre',
                customizable: true,
                baseType: 'LV',
                materialType: 'laine-verre',
                description: 'Grand classique toitures'
            },
            'LV80': { 
                length: 120, 
                width: 8, 
                height: 60, 
                name: 'Laine Verre 80mm (120×60 cm)', 
                category: 'laine-verre',
                customizable: true,
                baseType: 'LV',
                materialType: 'laine-verre',
                description: 'Grand classique toitures'
            },
            'LV100': { 
                length: 120, 
                width: 10, 
                height: 60, 
                name: 'Laine Verre 100mm (120×60 cm)', 
                category: 'laine-verre',
                customizable: true,
                baseType: 'LV',
                materialType: 'laine-verre',
                description: 'Grand classique toitures'
            },
            'LV120': { 
                length: 120, 
                width: 12, 
                height: 60, 
                name: 'Laine Verre 120mm (120×60 cm)', 
                category: 'laine-verre',
                customizable: true,
                baseType: 'LV',
                materialType: 'laine-verre',
                description: 'Grand classique toitures'
            },
            'LV140': { 
                length: 120, 
                width: 14, 
                height: 60, 
                name: 'Laine Verre 140mm (120×60 cm)', 
                category: 'laine-verre',
                customizable: true,
                baseType: 'LV',
                materialType: 'laine-verre',
                description: 'Grand classique toitures'
            },
            'LV160': { 
                length: 120, 
                width: 16, 
                height: 60, 
                name: 'Laine Verre 160mm (120×60 cm)', 
                category: 'laine-verre',
                customizable: true,
                baseType: 'LV',
                materialType: 'laine-verre',
                description: 'Grand classique toitures'
            },
            'LV180': { 
                length: 120, 
                width: 18, 
                height: 60, 
                name: 'Laine Verre 180mm (120×60 cm)', 
                category: 'laine-verre',
                customizable: true,
                baseType: 'LV',
                materialType: 'laine-verre',
                description: 'Grand classique toitures'
            },
            'LV200': { 
                length: 120, 
                width: 20, 
                height: 60, 
                name: 'Laine Verre 200mm (120×60 cm)', 
                category: 'laine-verre',
                customizable: true,
                baseType: 'LV',
                materialType: 'laine-verre',
                description: 'Grand classique toitures'
            },
            'LV220': { 
                length: 120, 
                width: 22, 
                height: 60, 
                name: 'Laine Verre 220mm (120×60 cm)', 
                category: 'laine-verre',
                customizable: true,
                baseType: 'LV',
                materialType: 'laine-verre',
                description: 'Grand classique toitures'
            },
            
            // Laine de Roche Moderne (panneaux) - performances acoustiques : 100×60 cm
            'LRM50': { 
                length: 100, 
                width: 5, 
                height: 60, 
                name: 'Laine Roche 50mm (100×60 cm)', 
                category: 'laine-roche-moderne',
                customizable: true,
                baseType: 'LRM',
                materialType: 'laine-roche-moderne',
                description: 'Performances acoustiques, anti-feu'
            },
            'LRM60': { 
                length: 100, 
                width: 6, 
                height: 60, 
                name: 'Laine Roche 60mm (100×60 cm)', 
                category: 'laine-roche-moderne',
                customizable: true,
                baseType: 'LRM',
                materialType: 'laine-roche-moderne',
                description: 'Performances acoustiques, anti-feu'
            },
            'LRM80': { 
                length: 100, 
                width: 8, 
                height: 60, 
                name: 'Laine Roche 80mm (100×60 cm)', 
                category: 'laine-roche-moderne',
                customizable: true,
                baseType: 'LRM',
                materialType: 'laine-roche-moderne',
                description: 'Performances acoustiques, anti-feu'
            },
            'LRM100': { 
                length: 100, 
                width: 10, 
                height: 60, 
                name: 'Laine Roche 100mm (100×60 cm)', 
                category: 'laine-roche-moderne',
                customizable: true,
                baseType: 'LRM',
                materialType: 'laine-roche-moderne',
                description: 'Performances acoustiques, anti-feu'
            },
            'LRM120': { 
                length: 100, 
                width: 12, 
                height: 60, 
                name: 'Laine Roche 120mm (100×60 cm)', 
                category: 'laine-roche-moderne',
                customizable: true,
                baseType: 'LRM',
                materialType: 'laine-roche-moderne',
                description: 'Performances acoustiques, anti-feu'
            },
            'LRM140': { 
                length: 100, 
                width: 14, 
                height: 60, 
                name: 'Laine Roche 140mm (100×60 cm)', 
                category: 'laine-roche-moderne',
                customizable: true,
                baseType: 'LRM',
                materialType: 'laine-roche-moderne',
                description: 'Performances acoustiques, anti-feu'
            },
            'LRM160': { 
                length: 100, 
                width: 16, 
                height: 60, 
                name: 'Laine Roche 160mm (100×60 cm)', 
                category: 'laine-roche-moderne',
                customizable: true,
                baseType: 'LRM',
                materialType: 'laine-roche-moderne',
                description: 'Performances acoustiques, anti-feu'
            },
            'LRM180': { 
                length: 100, 
                width: 18, 
                height: 60, 
                name: 'Laine Roche 180mm (100×60 cm)', 
                category: 'laine-roche-moderne',
                customizable: true,
                baseType: 'LRM',
                materialType: 'laine-roche-moderne',
                description: 'Performances acoustiques, anti-feu'
            },
            'LRM200': { 
                length: 100, 
                width: 20, 
                height: 60, 
                name: 'Laine Roche 200mm (100×60 cm)', 
                category: 'laine-roche-moderne',
                customizable: true,
                baseType: 'LRM',
                materialType: 'laine-roche-moderne',
                description: 'Performances acoustiques, anti-feu'
            }
        };
        
        this.modal = null;
        this.selectedType = this.currentInsulation;
        this.customDimensionsModal = null;
        this.init();
    }

    init() {
        this.modal = document.getElementById('insulationSelector');
        this.customDimensionsModal = document.getElementById('customInsulationModal');
        this.setupEventListeners();
        
        // Initialiser les dimensions par défaut
        this.updateInsulationDimensions(this.currentInsulation);
        this.updateCurrentInsulationDisplay();
        
        // Mettre à jour la sélection visuelle initiale
        this.updateSelection();
        
        // console.log('InsulationSelector initialisé avec l\'isolant par défaut:', this.currentInsulation);
    }

    setupEventListeners() {
        // Ouvrir la modale quand on clique sur le bouton Isolant
        const insulationButton = document.getElementById('insulationMode');
        if (insulationButton) {
            insulationButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.showModal();
            });
        }

        // Fermer la modale
        const closeBtn = document.getElementById('closeInsulationSelector');
        const cancelBtn = document.getElementById('cancelInsulationSelection');
        
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

        // Sélection d'isolant
        const insulationButtons = document.querySelectorAll('.insulation-btn');
        insulationButtons.forEach(button => {
            button.addEventListener('click', () => {
                const isCustomizable = button.dataset.customizable === 'true';
                if (isCustomizable) {
                    this.showCustomDimensionsModal(button.dataset.type);
                } else {
                    this.selectInsulation(button.dataset.type, false);
                }
            });
        });

        // Gestion des dimensions personnalisées
        this.setupCustomDimensionsListeners();

        // Raccourci clavier Échap pour fermer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.customDimensionsModal && this.customDimensionsModal.classList.contains('show')) {
                    this.hideCustomDimensionsModal();
                } else if (this.modal && this.modal.classList.contains('show')) {
                    this.hideModal();
                }
            }
        });
    }

    setupCustomDimensionsListeners() {
        // Fermer la modale de dimensions personnalisées
        const closeCustomBtn = document.getElementById('closeCustomInsulation');
        const cancelCustomBtn = document.getElementById('cancelCustomInsulation');
        
        if (closeCustomBtn) {
            closeCustomBtn.addEventListener('click', () => this.hideCustomDimensionsModal());
        }
        
        if (cancelCustomBtn) {
            cancelCustomBtn.addEventListener('click', () => this.hideCustomDimensionsModal());
        }

        // Confirmer les dimensions personnalisées
        const confirmCustomBtn = document.getElementById('confirmCustomInsulation');
        if (confirmCustomBtn) {
            confirmCustomBtn.addEventListener('click', () => this.confirmCustomDimensions());
        }

        // Mettre à jour l'aperçu en temps réel
        const lengthInput = document.getElementById('customInsulationLength');
        const widthInput = document.getElementById('customInsulationWidth');
        const heightInput = document.getElementById('customInsulationHeight');
        
        if (lengthInput && widthInput && heightInput) {
            [lengthInput, widthInput, heightInput].forEach(input => {
                input.addEventListener('input', () => this.updateDimensionPreview());
            });
        }

        // Fermer en cliquant en dehors
        if (this.customDimensionsModal) {
            this.customDimensionsModal.addEventListener('click', (e) => {
                if (e.target === this.customDimensionsModal) {
                    this.hideCustomDimensionsModal();
                }
            });
        }
    }

    showModal() {
        if (!this.modal) return;
        
        this.selectedType = this.currentInsulation;
        this.updateSelection();
        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Jouer le son d'ouverture
        // Son supprimé
        
        console.log('Modale de sélection d\'isolants ouverte');
    }

    hideModal() {
        if (!this.modal) return;
        
        this.modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // Remettre la sélection sur l'isolant courant
        this.selectedType = this.currentInsulation;
        this.isCustomDimensions = false; // Remettre à false par défaut
        this.updateSelection();
        
        console.log('Modale de sélection d\'isolants fermée');
    }

    showCustomDimensionsModal(insulationType) {
        if (!this.customDimensionsModal) return;
        
        const insulation = this.insulationTypes[insulationType];
        if (!insulation) return;

        // Mettre à jour le titre
        const title = this.customDimensionsModal.querySelector('.custom-insulation-title');
        if (title) {
            title.textContent = `Dimensions personnalisées - ${insulation.name}`;
        }

        // Mettre à jour les dimensions par défaut
        const lengthInput = document.getElementById('customInsulationLength');
        const widthInput = document.getElementById('customInsulationWidth');
        const heightInput = document.getElementById('customInsulationHeight');

        if (lengthInput) lengthInput.value = insulation.length;
        if (widthInput) widthInput.value = insulation.width;
        if (heightInput) heightInput.value = insulation.height;

        // Stocker le type d'isolant pour la confirmation
        this.customDimensionsModal.dataset.baseType = insulationType;

        this.customDimensionsModal.classList.add('show');
    }

    hideCustomDimensionsModal() {
        if (!this.customDimensionsModal) return;
        this.customDimensionsModal.classList.remove('show');
    }

    confirmCustomDimensions() {
        const lengthInput = document.getElementById('customInsulationLength');
        const widthInput = document.getElementById('customInsulationWidth');
        const heightInput = document.getElementById('customInsulationHeight');

        const length = parseFloat(lengthInput.value);
        const width = parseFloat(widthInput.value);
        const height = parseFloat(heightInput.value);

        if (isNaN(length) || isNaN(width) || isNaN(height) || 
            length <= 0 || width <= 0 || height <= 0) {
            alert('Veuillez entrer des dimensions valides.');
            return;
        }

        const baseType = this.customDimensionsModal.dataset.baseType;
        const baseInsulation = this.insulationTypes[baseType];

        // Créer un nouveau type d'isolant personnalisé
        const customType = `${baseType}_CUSTOM_${Date.now()}`;
        this.insulationTypes[customType] = {
            length: length,
            width: width,
            height: height,
            name: `${baseInsulation.name} (${length}×${width}×${height})`,
            category: baseInsulation.category,
            isCustom: true,
            baseType: baseType,
            customizable: true
        };

        this.selectInsulation(customType, true);
        this.hideCustomDimensionsModal();
    }

    selectInsulation(type, isCustom = false) {
        if (!this.insulationTypes[type]) return;
        
        this.selectedType = type;
        this.isCustomDimensions = isCustom;
        this.updateSelection();
        
        // Animation de sélection - sélectionner le bon bouton
        const selector = isCustom ? 
            `.insulation-btn[data-type="${type}"][data-customizable="true"]` :
            `.insulation-btn[data-type="${type}"][data-customizable="false"]`;
        const insulationButton = document.querySelector(selector);
        if (insulationButton) {
            insulationButton.classList.add('selecting');
            setTimeout(() => {
                insulationButton.classList.remove('selecting');
            }, 300);
        }

        // Pour la sélection standard (non personnalisée), confirmer automatiquement
        if (!isCustom) {
            this.confirmSelection();
        }

        console.log('Isolant sélectionné:', type, this.insulationTypes[type], isCustom ? '(dimensions personnalisées)' : '(dimensions standard)');
    }

    confirmSelection() {
        this.setInsulation(this.selectedType);
        this.hideModal();
    }

    setInsulation(type) {
        // Extraire le type de base et le suffixe de coupe s'il y en a un
        let baseType = type;
        let cutSuffix = '';
        
        if (type.includes('_')) {
            const parts = type.split('_');
            baseType = parts[0];
            cutSuffix = '_' + parts.slice(1).join('_');
        }
        
        console.log('🔍 InsulationSelector.setInsulation:', { originalType: type, baseType, cutSuffix });
        
        if (!this.insulationTypes[baseType]) {
            console.warn('🔍 Type isolant non trouvé:', baseType);
            return;
        }
        
        // Stocker le type de base (pour compatibilité avec le reste du système)
        this.currentInsulation = baseType;
        
        // Stocker aussi le type complet avec coupe pour les systèmes qui en ont besoin
        this.currentInsulationWithCut = type;
        
        // Mettre à jour les dimensions AVANT tout changement de mode (utiliser le type de base)
        this.updateInsulationDimensions(baseType);
        
        // Changer de mode seulement si nécessaire, en préservant les dimensions
        if (window.ConstructionTools && window.ConstructionTools.currentMode !== 'insulation') {
            if (window.UIController) {
                window.UIController.setConstructionMode('insulation', true);
            }
        } else if (window.ConstructionTools) {
            // Si on est déjà en mode isolant, juste forcer la mise à jour du fantôme
            console.log('🔄 Déjà en mode insulation, mise à jour de l\'interface et du fantôme');
            window.ConstructionTools.updateModeInterface('insulation');
            
            // Protection contre les boucles infinies
            if (!this._updatingGhostElement && window.ConstructionTools.updateGhostElement) {
                console.log('🔧 Appel de updateGhostElement depuis setInsulation (mode déjà insulation)');
                this._updatingGhostElement = true;
                try {
                    window.ConstructionTools.updateGhostElement();
                } finally {
                    // Reset le flag après un petit délai
                    setTimeout(() => {
                        this._updatingGhostElement = false;
                    }, 100);
                }
            }
        }
        
        // Enfin mettre à jour l'affichage
        this.updateCurrentInsulationDisplay();
        
        // NOUVEAU: Déclencher un événement pour la synchronisation avec le menu flottant
        document.dispatchEvent(new CustomEvent('insulationSelectionChanged', {
            detail: {
                newType: type,
                insulationData: this.insulationTypes[type]
            }
        }));
        
        console.log('Isolant défini:', type, this.insulationTypes[type]);
    }

    updateSelection() {
        // Mettre à jour la sélection visuelle
        const buttons = document.querySelectorAll('.insulation-btn');
        
        buttons.forEach(btn => {
            btn.classList.remove('selected');
            // Sélectionner le bon bouton selon le type et si c'est personnalisé
            const isButtonCustom = btn.dataset.customizable === 'true';
            const shouldSelect = btn.dataset.type === this.selectedType && isButtonCustom === this.isCustomDimensions;
            
            if (shouldSelect) {
                btn.classList.add('selected');
            }
        });
    }

    updateInsulationDimensions(type) {
        const insulation = this.insulationTypes[type];
        if (!insulation) return;
        
        // CORRECTION: Utiliser les dimensions avec coupe si applicable (objet complet)
        const insulationWithCut = this.getCurrentInsulationWithCutObject();
        const effectiveInsulation = insulationWithCut || insulation;
        
        // Mettre à jour les inputs HTML utilisés par ConstructionTools
        const lengthInput = document.getElementById('elementLength');
        const widthInput = document.getElementById('elementWidth');
        const heightInput = document.getElementById('elementHeight');
        
        if (lengthInput) lengthInput.value = effectiveInsulation.length;
        if (widthInput) widthInput.value = effectiveInsulation.width;
        if (heightInput) heightInput.value = effectiveInsulation.height;
        
        // console.log('🔧 updateInsulationDimensions: utilisé dimensions', 
        //     effectiveInsulation.length + 'x' + effectiveInsulation.width + 'x' + effectiveInsulation.height,
        //     'avec coupe:', !!insulationWithCut);
        
        // Mettre à jour les dimensions globales pour l'utilisation par d'autres modules
        window.currentInsulationDimensions = {
            length: effectiveInsulation.length,
            width: effectiveInsulation.width,
            height: effectiveInsulation.height,
            type: type,
            name: effectiveInsulation.name,
            material: effectiveInsulation.materialType || 'insulation',
            insulationType: type, // Ajouter le type d'isolant pour la détection du matériau
            baseType: effectiveInsulation.baseType // Type de base (PUR ou LAINEROCHE)
        };
        
        // Forcer la mise à jour de l'élément fantôme si ConstructionTools est disponible
        if (window.ConstructionTools && window.ConstructionTools.updateGhostElement) {
            // console.log('🔧 Appel de updateGhostElement depuis insulation-selector');
            window.ConstructionTools.updateGhostElement();
        }
    }

    updateCurrentInsulationDisplay() {
        const insulation = this.insulationTypes[this.currentInsulation];
        if (!insulation) return;
        
        // Mettre à jour l'affichage de l'isolant sélectionné dans la modale
        const insulationInfo = document.querySelector('.selected-insulation-info');
        if (insulationInfo) {
            const nameElement = insulationInfo.querySelector('.insulation-name');
            const dimensionsElement = insulationInfo.querySelector('.insulation-dimensions');
            
            if (nameElement) nameElement.textContent = insulation.name;
            if (dimensionsElement) {
                dimensionsElement.textContent = `${insulation.length}×${insulation.width}×${insulation.height} cm`;
            }
        }

        // Mettre à jour l'affichage dans la barre latérale
        const sidebarDisplay = document.getElementById('currentInsulationDisplay');
        if (sidebarDisplay) {
            const nameElement = sidebarDisplay.querySelector('.insulation-name');
            const dimensionsElement = sidebarDisplay.querySelector('.insulation-dimensions');
            const typeElement = sidebarDisplay.querySelector('.insulation-type');
            
            if (nameElement) nameElement.textContent = insulation.name;
            if (dimensionsElement) {
                dimensionsElement.textContent = `${insulation.length}×${insulation.width}×${insulation.height} cm`;
            }
            if (typeElement) {
                typeElement.textContent = insulation.isCustom ? 'Personnalisé' : 'Standard';
            }
        }
    }

    getCurrentInsulation() {
        return this.currentInsulation;
    }

    // Nouvelle fonction pour récupérer le type complet avec coupe
    getCurrentInsulationWithCut() {
        // console.log('🔧 getCurrentInsulationWithCut() APPELÉE - currentInsulation:', this.currentInsulation, 'currentInsulationWithCut:', this.currentInsulationWithCut);
        
        if (!this.currentInsulation) {
            // console.log('⚠️ getCurrentInsulationWithCut: pas de currentInsulation');
            return null;
        }
        
        // CORRECTION: Retourner le nom/type de l'isolant avec coupe, pas l'objet complet
        // Si pas de coupe, retourner le type de base
        if (!this.currentInsulationWithCut || !this.currentInsulationWithCut.includes('_')) {
            return this.currentInsulation;
        }
        
        // Si coupe, retourner le type avec coupe (string)
        return this.currentInsulationWithCut;
    }

    // Nouvelle méthode pour récupérer l'objet complet avec dimensions calculées
    getCurrentInsulationWithCutObject() {
        // console.log('🔧 getCurrentInsulationWithCutObject() APPELÉE - currentInsulation:', this.currentInsulation, 'currentInsulationWithCut:', this.currentInsulationWithCut);
        
        if (!this.currentInsulation) {
            // console.log('⚠️ getCurrentInsulationWithCutObject: pas de currentInsulation');
            return null;
        }
        
        const baseInsulation = this.insulationTypes[this.currentInsulation];
        if (!baseInsulation) {
            console.log('⚠️ getCurrentInsulationWithCutObject: insulationType non trouvé');
            return null;
        }
        
        // Si pas de coupe, retourner l'objet isolant normal
        if (!this.currentInsulationWithCut || !this.currentInsulationWithCut.includes('_')) {
            return baseInsulation;
        }
        
        // Créer une copie avec les dimensions coupées
        const cutInsulation = { ...baseInsulation };
        
        // Analyser le suffixe de coupe pour calculer les dimensions
        const parts = this.currentInsulationWithCut.split('_');
        const suffix = parts[1];
        
        let ratio = 1.0;
        let customLength = null;
        
        // Vérifier si c'est une coupe personnalisée
        if (suffix === 'CUSTOM' && parts.length >= 3) {
            // Format: PUR15_CUSTOM_30_5 pour 30.5cm
            const lengthParts = parts.slice(2);
            if (lengthParts.length === 2) {
                customLength = parseFloat(lengthParts[0] + '.' + lengthParts[1]);
            } else if (lengthParts.length === 1) {
                customLength = parseFloat(lengthParts[0]);
            }
            console.log('🔧 Coupe personnalisée détectée:', customLength, 'cm');
        } else {
            // Ratios prédéfinis
            const ratios = {
                'HALF': 0.5,
                '1Q': 0.25,
                '3Q': 0.75,
                'P': 0.85
            };
            ratio = ratios[suffix] || 1.0;
        }
        
        // Appliquer la coupe à la longueur
        if (customLength !== null) {
            cutInsulation.length = Math.round(customLength);
        } else {
            cutInsulation.length = Math.round(baseInsulation.length * ratio);
        }
        
        console.log('🔧 getCurrentInsulationWithCutObject: dimensions calculées:', 
            cutInsulation.length + 'x' + cutInsulation.width + 'x' + cutInsulation.height,
            customLength !== null ? `custom: ${customLength}cm` : `ratio: ${ratio}, suffix: ${suffix}`);
        
        return cutInsulation;
    }

    getCurrentInsulationData() {
        return this.insulationTypes[this.currentInsulation];
    }

    showNotification(message) {
        // Créer une notification temporaire
        const notification = document.createElement('div');
        notification.className = 'insulation-notification';
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

    updateDimensionPreview() {
        const lengthInput = document.getElementById('customInsulationLength');
        const widthInput = document.getElementById('customInsulationWidth');
        const heightInput = document.getElementById('customInsulationHeight');
        const preview = document.getElementById('insulationDimensionPreview');

        if (lengthInput && widthInput && heightInput && preview) {
            const length = lengthInput.value || '0';
            const width = widthInput.value || '0';
            const height = heightInput.value || '0';
            preview.textContent = `${length}×${width}×${height} cm`;
        }
    }
}

// Initialiser le sélecteur d'isolants quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    window.InsulationSelector = new InsulationSelector();
});

