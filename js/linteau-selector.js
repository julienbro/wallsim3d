/**
 * Sélecteur de Linteaux - Interface pour sélectionner et personnaliser les linteaux en béton
 */
class LinteauSelector {
    constructor() {
        this.currentLinteau = null;
        this.isCustomMode = false;
        this.customLength = 120; // Longueur par défaut
        this.modalElement = null;
        this.init();
    }

    init() {
        this.createModal();
        this.setupEventListeners();
        this.setDefaultLinteau();
    }

    // Données des linteaux standards
    getLinteauData() {
        return {
            'L120': {
                id: 'L120',
                name: 'Linteau Béton L120',
                length: 120,
                width: 14,
                height: 19,
                description: 'Linteau béton armé 120×14×19 cm',
                allowCustomCut: true
            },
            'L140': {
                id: 'L140',
                name: 'Linteau Béton L140',
                length: 140,
                width: 14,
                height: 19,
                description: 'Linteau béton armé 140×14×19 cm',
                allowCustomCut: true
            },
            'L160': {
                id: 'L160',
                name: 'Linteau Béton L160',
                length: 160,
                width: 14,
                height: 19,
                description: 'Linteau béton armé 160×14×19 cm',
                allowCustomCut: true
            },
            'L180': {
                id: 'L180',
                name: 'Linteau Béton L180',
                length: 180,
                width: 14,
                height: 19,
                description: 'Linteau béton armé 180×14×19 cm',
                allowCustomCut: true
            },
            'L200': {
                id: 'L200',
                name: 'Linteau Béton L200',
                length: 200,
                width: 14,
                height: 19,
                description: 'Linteau béton armé 200×14×19 cm',
                allowCustomCut: true
            }
        };
    }

    setDefaultLinteau() {
        const linteauData = this.getLinteauData();
        this.currentLinteau = {
            ...linteauData['L120'],
            type: 'LINTEAU_L120'
        };
        this.updateCurrentLinteauDisplay();
    }

    createModal() {
        this.modalElement = document.createElement('div');
        this.modalElement.id = 'linteauSelectorModal';
        this.modalElement.className = 'modal';
        
        this.modalElement.innerHTML = `
            <div class="modal-content linteau-selector">
                <div class="modal-header">
                    <h3>Sélection de Linteau</h3>
                    <button class="close-btn" id="closeLinteauModal">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="linteau-categories">
                        <h4>Linteaux Béton Standard</h4>
                        <div class="linteau-grid">
                            ${this.generateLinteauGrid()}
                        </div>
                    </div>
                    
                    <div class="custom-section">
                        <h4>Coupe Personnalisée</h4>
                        <div class="custom-controls">
                            <div class="custom-input-group">
                                <label for="customLinteauLength">Longueur personnalisée (cm):</label>
                                <input type="number" id="customLinteauLength" min="50" max="300" value="120" step="5">
                                <span class="unit">cm</span>
                            </div>
                            <div class="custom-note">
                                <p><strong>Note :</strong> Largeur fixe 14 cm, hauteur fixe 19 cm</p>
                                <p>Longueur recommandée : 50-300 cm</p>
                            </div>
                            <button id="applyCustomLinteau" 
                                    class="btn btn-primary"
                                    onclick="window.LinteauSelector.applyCustomCut()">
                                Appliquer Coupe Personnalisée
                            </button>
                        </div>
                    </div>
                    
                    <div class="preview-section">
                        <h4>Aperçu</h4>
                        <div class="linteau-preview">
                            <div id="linteauPreviewInfo" class="preview-info">
                                <div class="preview-name">Linteau Béton L120</div>
                                <div class="preview-dimensions">120×14×19 cm</div>
                                <div class="preview-type">Standard</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button id="cancelLinteauSelection" class="btn btn-secondary">Fermer</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.modalElement);
    }

    generateLinteauGrid() {
        const linteauData = this.getLinteauData();
        let html = '';
        
        Object.values(linteauData).forEach(linteau => {
            html += `
                <div class="linteau-card" data-linteau-id="${linteau.id}">
                    <div class="linteau-header">
                        <h5>${linteau.name}</h5>
                    </div>
                    <div class="linteau-info">
                        <div class="dimensions">${linteau.length}×${linteau.width}×${linteau.height} cm</div>
                        <div class="description">${linteau.description}</div>
                    </div>
                    <div class="linteau-actions">
                        <button class="btn btn-sm btn-primary select-linteau" 
                                data-linteau-id="${linteau.id}"
                                onclick="window.LinteauSelector.selectStandardLinteau('${linteau.id}')">
                            Sélectionner
                        </button>
                        ${linteau.allowCustomCut ? 
                            `<button class="btn btn-sm btn-secondary custom-cut" 
                                     data-linteau-id="${linteau.id}"
                                     onclick="window.LinteauSelector.prepareCustomCut('${linteau.id}')">
                                Coupe Personnalisée
                            </button>` : ''
                        }
                    </div>
                </div>
            `;
        });
        
        return html;
    }

    setupEventListeners() {
        // console.log('🔧 Configuration des événements LinteauSelector');
        
        // Délégation d'événements sur la modal elle-même
        this.modalElement.addEventListener('click', (e) => {
            // console.log('🔧 Clic détecté dans modal linteau:', e.target.className, e.target.id);
            
            // Fermeture du modal
            if (e.target.id === 'closeLinteauModal' || e.target.id === 'cancelLinteauSelection') {
                console.log('🔧 Fermeture modal linteau');
                this.hideModal();
                return;
            }
            
            // Sélection de linteau standard
            if (e.target.classList.contains('select-linteau')) {
                const linteauId = e.target.dataset.linteauId;
                console.log('🏗️ Clic sur sélection linteau:', linteauId);
                e.preventDefault();
                e.stopPropagation();
                this.selectStandardLinteau(linteauId);
                return;
            }
            
            // Coupe personnalisée
            if (e.target.classList.contains('custom-cut')) {
                const linteauId = e.target.dataset.linteauId;
                console.log('🏗️ Clic sur coupe personnalisée:', linteauId);
                e.preventDefault();
                e.stopPropagation();
                this.prepareCustomCut(linteauId);
                return;
            }
            
            // Application de la coupe personnalisée
            if (e.target.id === 'applyCustomLinteau') {
                console.log('🏗️ Clic sur application coupe personnalisée');
                e.preventDefault();
                e.stopPropagation();
                this.applyCustomCut();
                return;
            }
        });

        // Mise à jour en temps réel de la longueur personnalisée
        this.modalElement.addEventListener('input', (e) => {
            if (e.target.id === 'customLinteauLength') {
                console.log('🏗️ Changement longueur personnalisée:', e.target.value);
                this.updateCustomPreview();
            }
        });

        // Fermeture par Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalElement.style.display === 'block') {
                this.hideModal();
            }
        });
    }

    selectStandardLinteau(linteauId) {
        const linteauData = this.getLinteauData();
        const linteau = linteauData[linteauId];
        
        if (linteau) {
            this.currentLinteau = {
                ...linteau,
                type: `LINTEAU_${linteauId}`,
                isCustom: false
            };
            this.isCustomMode = false;
            this.updatePreview();
            this.highlightSelectedLinteau(linteauId);
            
            // Confirmation automatique pour la sélection directe
            this.confirmSelection();
            
            console.log('Linteau standard sélectionné:', this.currentLinteau);
        }
    }

    prepareCustomCut(linteauId) {
        const linteauData = this.getLinteauData();
        const baseLinteau = linteauData[linteauId];
        
        if (baseLinteau) {
            // Pré-remplir avec les dimensions du linteau de base
            const customLengthInput = document.getElementById('customLinteauLength');
            customLengthInput.value = baseLinteau.length;
            
            this.currentLinteau = {
                ...baseLinteau,
                type: `LINTEAU_${linteauId}_CUSTOM`,
                isCustom: true,
                baseType: linteauId
            };
            this.isCustomMode = true;
            this.updateCustomPreview();
            this.highlightSelectedLinteau(null); // Désélectionner les standards
            
            console.log('Préparation coupe personnalisée pour:', linteauId);
        }
    }

    applyCustomCut() {
        const customLength = parseInt(document.getElementById('customLinteauLength').value);
        
        if (customLength >= 50 && customLength <= 300) {
            if (this.currentLinteau) {
                this.currentLinteau.length = customLength;
                this.currentLinteau.name = `${this.currentLinteau.name} (${customLength}cm)`;
                this.currentLinteau.description = `Linteau béton armé ${customLength}×14×19 cm (coupe personnalisée)`;
                this.updatePreview();
                
                // Confirmation automatique pour la coupe personnalisée
                this.confirmSelection();
                
                console.log('Coupe personnalisée appliquée:', this.currentLinteau);
            }
        } else {
            alert('La longueur doit être comprise entre 50 et 300 cm.');
        }
    }

    updateCustomPreview() {
        const customLength = parseInt(document.getElementById('customLinteauLength').value) || 120;
        
        if (this.currentLinteau && this.isCustomMode) {
            const previewInfo = document.getElementById('linteauPreviewInfo');
            if (previewInfo) {
                const tempLinteau = { ...this.currentLinteau };
                tempLinteau.length = customLength;
                tempLinteau.name = `${tempLinteau.name.split(' (')[0]} (${customLength}cm)`;
                
                previewInfo.innerHTML = `
                    <div class="preview-name">${tempLinteau.name}</div>
                    <div class="preview-dimensions">${customLength}×14×19 cm</div>
                    <div class="preview-type">Coupe Personnalisée</div>
                `;
            }
        }
    }

    updatePreview() {
        const previewInfo = document.getElementById('linteauPreviewInfo');
        if (previewInfo && this.currentLinteau) {
            previewInfo.innerHTML = `
                <div class="preview-name">${this.currentLinteau.name}</div>
                <div class="preview-dimensions">${this.currentLinteau.length}×${this.currentLinteau.width}×${this.currentLinteau.height} cm</div>
                <div class="preview-type">${this.currentLinteau.isCustom ? 'Coupe Personnalisée' : 'Standard'}</div>
            `;
        }
    }

    highlightSelectedLinteau(linteauId) {
        // Retirer la sélection précédente
        document.querySelectorAll('.linteau-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Ajouter la sélection au nouveau linteau
        if (linteauId) {
            const selectedCard = document.querySelector(`[data-linteau-id="${linteauId}"]`);
            if (selectedCard) {
                selectedCard.classList.add('selected');
            }
        }
    }

    confirmSelection() {
        // Masquer les aides contextuelles lors de la sélection d'un linteau
        if (window.TabManager && window.TabManager.hideAllContextualHelp) {
            window.TabManager.hideAllContextualHelp();
        }
        
        if (this.currentLinteau) {
            this.updateCurrentLinteauDisplay();
            this.updateConstructionToolsDimensions();
            this.hideModal();
            
            // Déclencher un événement pour notifier le changement
            const event = new CustomEvent('linteauSelected', {
                detail: {
                    linteau: this.currentLinteau
                }
            });
            document.dispatchEvent(event);
            
            // NOUVEAU: Déclencher aussi l'événement pour la synchronisation avec le menu flottant
            document.dispatchEvent(new CustomEvent('linteauSelectionChanged', {
                detail: {
                    newType: this.currentLinteau.type,
                    linteauData: this.currentLinteau
                }
            }));
            
            console.log('Linteau confirmé:', this.currentLinteau);
        }
    }

    updateCurrentLinteauDisplay() {
        const display = document.getElementById('currentLinteauDisplay');
        if (display && this.currentLinteau) {
            display.innerHTML = `
                <div class="linteau-name">${this.currentLinteau.name}</div>
                <div class="linteau-dimensions">${this.currentLinteau.length}×${this.currentLinteau.width}×${this.currentLinteau.height} cm</div>
                <div class="linteau-type">${this.currentLinteau.isCustom ? 'Coupe Personnalisée' : 'Standard'}</div>
            `;
        }
    }

    updateConstructionToolsDimensions() {
        if (this.currentLinteau) {
            const lengthInput = document.getElementById('elementLength');
            const widthInput = document.getElementById('elementWidth');
            const heightInput = document.getElementById('elementHeight');
            
            // CORRECTION: Utiliser les dimensions avec coupe si applicable
            const linteauWithCut = this.getCurrentLinteauWithCut();
            const effectiveLinteau = linteauWithCut || this.currentLinteau;
            
            if (lengthInput) lengthInput.value = effectiveLinteau.length;
            if (widthInput) widthInput.value = effectiveLinteau.width;
            if (heightInput) heightInput.value = effectiveLinteau.height;
            
            console.log('🔧 updateConstructionToolsDimensions: utilisé dimensions', 
                effectiveLinteau.length + 'x' + effectiveLinteau.width + 'x' + effectiveLinteau.height,
                'avec coupe:', !!linteauWithCut);
            
            // Notifier ConstructionTools du changement de dimensions
            if (window.ConstructionTools && window.ConstructionTools.onDimensionsChanged) {
                window.ConstructionTools.onDimensionsChanged();
            }
        }
    }

    showModal() {
        if (this.modalElement) {
            this.modalElement.style.display = 'block';
            this.updatePreview();
            
            // Réattacher les événements directement sur les boutons après l'affichage
            this.attachDirectEventListeners();
        }
    }
    
    attachDirectEventListeners() {
        console.log('🔧 Attachement des événements directs');
        
        // Événements sur les boutons de sélection
        const selectButtons = this.modalElement.querySelectorAll('.select-linteau');
        selectButtons.forEach(button => {
            button.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const linteauId = button.dataset.linteauId;
                console.log('🏗️ Clic direct sur sélection:', linteauId);
                this.selectStandardLinteau(linteauId);
            };
        });
        
        // Événements sur les boutons de coupe personnalisée
        const customButtons = this.modalElement.querySelectorAll('.custom-cut');
        customButtons.forEach(button => {
            button.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const linteauId = button.dataset.linteauId;
                console.log('🏗️ Clic direct sur coupe personnalisée:', linteauId);
                this.prepareCustomCut(linteauId);
            };
        });
        
        // Événement sur le bouton d'application
        const applyButton = this.modalElement.querySelector('#applyCustomLinteau');
        if (applyButton) {
            applyButton.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🏗️ Clic direct sur application');
                this.applyCustomCut();
            };
        }
    }

    hideModal() {
        if (this.modalElement) {
            this.modalElement.style.display = 'none';
        }
    }

    getCurrentLinteau() {
        return this.currentLinteau || this.getLinteauData()['L120'];
    }

    // Méthode pour obtenir les données du linteau actuel formatées pour ConstructionTools
    getCurrentLinteauData() {
        const current = this.getCurrentLinteau();
        return {
            id: current.id,
            name: current.name,
            length: current.length,
            width: current.width,
            height: current.height,
            type: current.type,
            category: 'linteau',
            isCustom: current.isCustom || false,
            description: current.description
        };
    }

    // Méthodes pour le support des coupes comme InsulationSelector
    getCurrentLinteauWithCut() {
        console.log('🔧 getCurrentLinteauWithCut() APPELÉE - currentLinteau:', this.currentLinteau?.id, 'currentLinteauWithCut:', this.currentLinteauWithCut);
        if (!this.currentLinteau) {
            console.log('⚠️ getCurrentLinteauWithCut: pas de currentLinteau');
            return null;
        }
        
        // Si pas de coupe, retourner l'objet linteau normal
        if (!this.currentLinteauWithCut || !this.currentLinteauWithCut.includes('_')) {
            return this.currentLinteau;
        }
        
        // Créer une copie avec les dimensions coupées
        const cutLinteau = { ...this.currentLinteau };
        
        // Analyser le suffixe de coupe pour calculer les dimensions
        const parts = this.currentLinteauWithCut.split('_');
        const suffix = parts[1];
        
        let ratio = 1.0;
        let customLength = null;
        
        // Vérifier si c'est une coupe personnalisée
        if (suffix === 'CUSTOM' && parts.length >= 3) {
            // Format: L120_CUSTOM_30_5 pour 30.5cm
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
            cutLinteau.length = Math.round(customLength);
        } else {
            cutLinteau.length = Math.round(this.currentLinteau.length * ratio);
        }
        
        console.log('🔧 getCurrentLinteauWithCut: dimensions calculées:', 
            cutLinteau.length + 'x' + cutLinteau.width + 'x' + cutLinteau.height,
            customLength !== null ? `custom: ${customLength}cm` : `ratio: ${ratio}, suffix: ${suffix}`);
        
        return cutLinteau;
    }

    setLinteau(originalType) {
        console.log(`🔍 LinteauSelector.setLinteau: originalType = "${originalType}"`);
        
        let baseType = originalType;
        let cutSuffix = '';
        
        // Analyser si c'est un type avec coupe (ex: L120_HALF)
        if (typeof originalType === 'string' && originalType.includes('_')) {
            const parts = originalType.split('_');
            baseType = parts[0];
            cutSuffix = '_' + parts[1];
            console.log(`🔍 LinteauSelector.setLinteau: {originalType: '${originalType}', baseType: '${baseType}', cutSuffix: '${cutSuffix}'}`);
        }
        
        // Sauvegarder les deux versions
        this.currentLinteau = this.getLinteauData()[baseType] || this.getLinteauData()['L120'];
        this.currentLinteauWithCut = originalType;
        
        // Synchroniser avec les outils de construction
        if (window.ConstructionTools) {
            if (window.ConstructionTools.currentMode === 'linteau') {
                // Déjà en mode linteau, juste mettre à jour l'interface et le fantôme
                window.ConstructionTools.updateModeInterface('linteau');
                
                // Mettre à jour le fantôme si nécessaire
                if (window.ConstructionTools.updateGhostElement) {
                    console.log('🔧 Appel de updateGhostElement depuis setLinteau (mode déjà linteau)');
                    window.ConstructionTools.updateGhostElement();
                }
            } else {
                // Changer de mode vers linteau
                window.ConstructionTools.setMode('linteau');
            }
        }
        
        // Mettre à jour l'interface
        this.updateConstructionToolsDimensions();
        
        // Mettre à jour la surbrillance dans la bibliothèque
        this.updateLibraryHighlight();
        
        console.log('Linteau défini:', baseType, this.currentLinteau);
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
        
        // Ajouter la surbrillance à l'élément actuel
        const currentLibraryItem = document.querySelector(`[data-type="${this.currentLinteau}"]`);
        if (currentLibraryItem) {
            currentLibraryItem.classList.add('active');
            
            // Activer le bouton 1/1 pour les linteaux (généralement pas de coupes)
            const wholeButton = currentLibraryItem.querySelector('[data-cut="1/1"]');
            if (wholeButton) {
                wholeButton.classList.add('active');
            }
        }
    }
}

// Initialiser le sélecteur de linteaux quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    window.LinteauSelector = new LinteauSelector();
    // console.log('LinteauSelector initialisé');
});
