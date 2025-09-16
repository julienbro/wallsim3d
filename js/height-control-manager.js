/**
 * Gestionnaire de contrôle de hauteur pour briques sur chant
 * Permet de poser les briques à une hauteur libre sans contrainte d'assise
 */
class HeightControlManager {
    constructor() {
        this.panel = null;
        this.currentElement = null;
        this.originalY = 0;
        this.isActive = false;
        
        this.init();
    }

    init() {
                this.panel = document.getElementById('heightControlPanel');
        if (!this.panel) {
            // console.warn('⚠️ HeightControlPanel non trouvé dans le DOM');
            // Essayer de nouveau après un délai
            setTimeout(() => {
                this.init(); // Relancer l'initialisation complète
            }, 500);
            return;
        }

        // console.log('✅ Panel trouvé immédiatement');
        this.setupEventListeners();
        // console.log('✅ HeightControlManager initialisé complètement');
    }

    setupEventListeners() {
        // Bouton fermer
        const closeBtn = document.getElementById('heightControlClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // Bouton appliquer
        const applyBtn = document.getElementById('applyHeight');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyHeightAndConfirm());
        }

        // Input de hauteur cible
        const targetInput = document.getElementById('targetHeight');
        if (targetInput) {
            targetInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyHeightAndConfirm();
                }
            });
            
            // Mise à jour en temps réel lors de la saisie
            targetInput.addEventListener('input', (e) => {
                const height = parseFloat(e.target.value);
                if (!isNaN(height) && height >= 0) {
                    this.updateGhostElementHeight(height);
                }
            });
        }

        // Boutons flèches (ajustement rapide)
        const arrowButtons = document.querySelectorAll('.height-arrow-btn');
        arrowButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const delta = parseFloat(btn.dataset.delta);
                this.adjustHeight(delta);
            });
        });

        // Boutons hauteurs prédéfinies
        const presetButtons = document.querySelectorAll('.height-preset-btn');
        presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const height = parseFloat(btn.dataset.height);
                this.setHeight(height);
            });
        });

        // Écouter les événements de sélection de brique sur chant
        document.addEventListener('brickSelectionChanged', (event) => {
            const { brickType } = event.detail;
            if (this.isBrickOnChant(brickType)) {
                                this.showPanel(); // CORRECTION: Afficher le panneau
                this.enablePlacementMode(); // Activer le mode placement automatiquement
            } else {
                                this.hidePanel(); // Masquer le panneau pour les autres briques
            }
        });

        // Écouter les clics sur la scène pour détecter la pose d'une brique sur chant ou d'un GLB hourdis
        document.addEventListener('elementPlaced', (event) => {
            const element = event.detail;
            if (this.isBrickOnChantElement(element) || this.isGLBHourdisElement(element)) {
                this.show(element);
            }
        });
    }

    // Vérifier si le type de brique est sur chant
    isBrickOnChant(brickType) {
        return brickType && (brickType.includes('M50_CHANT') || brickType === 'M50_CHANT');
    }

    // Vérifier si un élément est une brique sur chant
    isBrickOnChantElement(element) {
        if (!element) return false;
        
        const elementType = element.type || element.userData?.type;
        const brickType = element.brickType || element.userData?.brickType;
        
        return this.isBrickOnChant(elementType) || this.isBrickOnChant(brickType);
    }

    // Vérifier si un élément est un GLB de plancher (hourdis ou poutrain)
    isGLBHourdisElement(element) {
        if (!element) return false;
        
        const elementType = element.type || element.userData?.type;
        const glbType = element.glbType || element.userData?.glbType;
        
        // Vérifier si c'est un GLB de type plancher (hourdis ou poutrain)
        return elementType === 'glb' && (
            glbType && (glbType.includes('hourdis') || glbType.includes('poutrain')) ||
            element.name && (element.name.includes('hourdis') || element.name.includes('poutrain')) ||
            element.userData?.glbInfo?.type?.includes('hourdis') ||
            element.userData?.glbInfo?.type?.includes('poutrain') ||
            element.type === 'poutrain_beton_12'
        );
    }

    // Afficher le panneau de contrôle
    show(element) {
        if (!this.panel || !element) return;

        this.currentElement = element;
        this.originalY = element.position.y;
        this.isActive = true;

        // Mettre à jour l'affichage
        this.updateCurrentHeightDisplay();
        this.updateTargetHeightInput();

        // Afficher le panneau
        this.panel.style.display = 'block';
        
        console.log('📐 Contrôle de hauteur ouvert pour élément:', element.id);
    }

    // Masquer le panneau de contrôle
    hide() {
        if (!this.panel) return;

        this.panel.style.display = 'none';
        this.currentElement = null;
        this.isActive = false;

        console.log('📐 Contrôle de hauteur fermé');
    }

    // Mettre à jour l'affichage de la hauteur actuelle
    updateCurrentHeightDisplay() {
        const display = document.getElementById('currentHeightValue');
        if (!display || !this.currentElement) return;

        // La hauteur Y de l'élément correspond au centre de la brique
        // Pour avoir la hauteur du bas de la brique (hauteur libre), il faut soustraire la demi-hauteur
        const elementHeight = this.currentElement.dimensions?.height || 19; // M50_CHANT a 19cm de hauteur
        const bottomHeight = this.currentElement.position.y - (elementHeight / 2);
        
        display.textContent = `${bottomHeight.toFixed(1)} cm`;
    }

    // Mettre à jour l'input de hauteur cible
    updateTargetHeightInput() {
        const input = document.getElementById('targetHeight');
        if (!input || !this.currentElement) return;

        const elementHeight = this.currentElement.dimensions?.height || 19;
        const currentBottomHeight = this.currentElement.position.y - (elementHeight / 2);
        
        input.value = currentBottomHeight.toFixed(1);
    }

    // Appliquer la hauteur cible saisie
    applyTargetHeight() {
        const input = document.getElementById('targetHeight');
        if (!input) return;

        const targetHeight = parseFloat(input.value);
        if (isNaN(targetHeight)) return;

        this.setHeight(targetHeight);
    }
    
    // Appliquer la hauteur et confirmer la sélection de la brique
    applyHeightAndConfirm() {
        this.applyTargetHeight();
        
        // Confirmer la sélection de la brique en appelant directement le système
        if (window.BrickSelector && window.BrickSelector.confirmSelection) {
            // Stocker la hauteur sélectionnée pour l'utiliser lors du placement
            const targetHeight = parseFloat(document.getElementById('targetHeight').value);
            if (!isNaN(targetHeight)) {
                // Stocker la hauteur dans une variable globale pour le placement
                window.chantBrickHeight = targetHeight;
                console.log(`📐 Hauteur de placement stockée: ${targetHeight}cm`);
            }
            
            window.BrickSelector.confirmSelection();
        }
        
        // Masquer le panneau
        this.hidePanel();
        
        console.log('✅ Hauteur appliquée et sélection confirmée');
    }

    // Définir une hauteur absolue
    setHeight(targetBottomHeight) {
        const input = document.getElementById('targetHeight');
        if (input) {
            input.value = targetBottomHeight.toFixed(1);
        }
        
        // Mettre à jour l'élément actuel s'il existe
        if (this.currentElement) {
            const elementHeight = this.currentElement.dimensions?.height || 19;
            const newY = targetBottomHeight + (elementHeight / 2);
            this.moveElementToHeight(newY);
            this.updateCurrentHeightDisplay();
            this.updateTargetHeightInput();
        } else {
            // Sinon, mettre à jour l'élément fantôme
            this.updateGhostElementHeight(targetBottomHeight);
        }

        console.log(`📐 Hauteur définie à ${targetBottomHeight}cm`);
    }

    // Ajuster la hauteur par delta
    adjustHeight(delta) {
        const input = document.getElementById('targetHeight');
        if (!input) return;

        const currentHeight = parseFloat(input.value) || 0;
        const newHeight = Math.max(0, currentHeight + delta); // Pas en dessous de 0
        
        input.value = newHeight.toFixed(1);
        
        // Mettre à jour l'élément actuel s'il existe
        if (this.currentElement) {
            const elementHeight = this.currentElement.dimensions?.height || 19;
            const newY = newHeight + (elementHeight / 2);
            this.moveElementToHeight(newY);
            this.updateCurrentHeightDisplay();
        } else {
            // Sinon, mettre à jour l'élément fantôme
            this.updateGhostElementHeight(newHeight);
        }

        console.log(`📐 Hauteur ajustée de ${delta}cm : ${currentHeight} → ${newHeight}`);
    }

    // Déplacer l'élément à une hauteur Y donnée
    moveElementToHeight(newY) {
        if (!this.currentElement) return;

        // Empêcher la brique de descendre sous le niveau 0 (sol)
        const elementHeight = this.currentElement.dimensions?.height || 19;
        const minY = elementHeight / 2; // Le bas de la brique ne peut pas être sous Y=0
        
        if (newY < minY) {
            newY = minY;
            console.log('⚠️ Hauteur limitée au niveau du sol');
        }

        // Mettre à jour la position
        this.currentElement.position.y = newY;
        
        // Mettre à jour le mesh si disponible
        if (this.currentElement.mesh) {
            this.currentElement.mesh.position.y = newY;
        }

        // Notifier les autres systèmes du changement
        this.notifyHeightChange();
    }

    // Notifier les autres systèmes du changement de hauteur
    notifyHeightChange() {
        if (!this.currentElement) return;

        // Déclencher un événement personnalisé
        document.dispatchEvent(new CustomEvent('elementHeightChanged', {
            detail: {
                element: this.currentElement,
                newY: this.currentElement.position.y
            }
        }));

        // Mettre à jour le système d'assises si nécessaire
        if (window.AssiseManager) {
            // Pour les briques sur chant, pas besoin de mise à jour d'assise
            // car elles sont en pose libre
        }

        // Mettre à jour l'affichage dans le métré si disponible
        if (window.MetreTabManager && typeof window.MetreTabManager.refreshData === 'function') {
            window.MetreTabManager.refreshData();
        } else if (window.MetreTabManager) {
            console.warn('⚠️ MetreTabManager.refreshData n\'est pas une fonction');
        }
    }

    // Mettre à jour la position de l'élément fantôme en temps réel
    updateGhostElementHeight(targetHeight) {
        let elementMoved = false;
        
        // Essayer d'abord l'élément de prévisualisation (prioritaire)
        if (window.ConstructionTools && window.ConstructionTools.previewElement) {
            const preview = window.ConstructionTools.previewElement;
            const elementHeight = preview.dimensions?.height || 19;
            
            // Calculer la nouvelle position Y (hauteur + demi-hauteur de l'élément)
            const newY = targetHeight + (elementHeight / 2);
            
            // Déplacer l'élément de prévisualisation
            preview.position.y = newY;
            if (preview.mesh) {
                preview.mesh.position.y = newY;
            }
            
            console.log(`👁️ Élément de prévisualisation déplacé à Y=${newY} (hauteur cible: ${targetHeight}cm)`);
            elementMoved = true;
            
            // Mettre à jour l'assise pour cette brique sur chant
            this.updateChantBrickAssise(targetHeight);
        }
        // Sinon essayer l'élément fantôme
        else if (window.ConstructionTools && window.ConstructionTools.ghostElement) {
            const ghost = window.ConstructionTools.ghostElement;
            const elementHeight = ghost.dimensions?.height || 19;
            
            // Calculer la nouvelle position Y (hauteur + demi-hauteur de l'élément)
            const newY = targetHeight + (elementHeight / 2);
            
            // Déplacer l'élément fantôme
            ghost.position.y = newY;
            if (ghost.mesh) {
                ghost.mesh.position.y = newY;
            }
            
            console.log(`👻 Élément fantôme déplacé à Y=${newY} (hauteur cible: ${targetHeight}cm)`);
            elementMoved = true;
            
            // Mettre à jour l'assise pour cette brique sur chant
            this.updateChantBrickAssise(targetHeight);
        }
        
        if (elementMoved) {
            // Stocker la hauteur pour le placement final
            window.chantBrickHeight = targetHeight;
            
            // Forcer le rendu de la scène
            if (window.SceneManager && window.SceneManager.render) {
                window.SceneManager.render();
            }
        } else {
            console.warn('⚠️ Aucun élément (prévisualisation ou fantôme) disponible pour mise à jour de hauteur');
        }
    }

    // Mettre à jour l'assise pour une brique sur chant
    updateChantBrickAssise(targetHeight) {
        if (!window.AssiseManager) {
            console.warn('⚠️ AssiseManager non disponible pour mise à jour assise');
            return;
        }

        try {
            // Pour une brique sur chant, l'assise doit être à la hauteur spécifiée
            const assiseHeight = targetHeight;
            
            // Obtenir le type d'assise pour M50_CHANT
            const currentType = 'M50'; // Type d'assise pour M50_CHANT
            
            // Obtenir l'index d'assise actuel depuis la Map interne
            const currentAssiseIndex = window.AssiseManager.currentAssiseByType.get(currentType) || 0;
            console.log(`📍 Index d'assise actuel pour ${currentType}: ${currentAssiseIndex}`);
            
            if (currentAssiseIndex !== null && currentAssiseIndex !== undefined) {
                // Ajuster la hauteur de joint pour que l'assise soit à la bonne hauteur
                console.log(`🧱 Mise à jour assise ${currentType} ${currentAssiseIndex} pour hauteur ${assiseHeight}cm`);
                
                // Calculer la hauteur de joint nécessaire pour obtenir cette hauteur d'assise
                const requiredJointHeight = this.calculateRequiredJointHeight(currentType, currentAssiseIndex, assiseHeight);
                
                // Appliquer la nouvelle hauteur de joint
                if (window.AssiseManager.setJointHeightForAssise) {
                    window.AssiseManager.setJointHeightForAssise(currentType, currentAssiseIndex, requiredJointHeight);
                }
                
                console.log(`📐 Assise ${currentType} ajustée: joint=${requiredJointHeight}cm → assise=${assiseHeight}cm`);
            } else {
                console.log(`🔍 Aucune assise active trouvée pour ${currentType}`);
            }
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour de l\'assise:', error);
        }
    }

    // Calculer la hauteur de joint nécessaire pour atteindre une hauteur d'assise donnée
    calculateRequiredJointHeight(type, assiseIndex, targetAssiseHeight) {
        if (assiseIndex === 0) {
            // Pour l'assise 0, la hauteur d'assise = hauteur de joint
            return targetAssiseHeight;
        } else {
            // Pour les assises supérieures, on doit soustraire la hauteur accumulée des assises précédentes
            let accumulatedHeight = 0;
            
            // Calculer la hauteur accumulée des assises précédentes
            for (let i = 0; i < assiseIndex; i++) {
                const jointHeight = window.AssiseManager.getJointHeightForAssise(type, i);
                if (i === 0) {
                    accumulatedHeight = jointHeight;
                } else {
                    const elementHeight = window.AssiseManager.getDefaultElementHeight(type);
                    accumulatedHeight += elementHeight + jointHeight;
                }
            }
            
            // La hauteur de joint pour cette assise
            const elementHeight = window.AssiseManager.getDefaultElementHeight(type);
            const requiredJointHeight = targetAssiseHeight - accumulatedHeight - elementHeight;
            
            return Math.max(0, requiredJointHeight); // Pas de hauteur négative
        }
    }

    // Méthode publique pour ouvrir le contrôle depuis l'extérieur
    openFor(element) {
        if (this.isBrickOnChantElement(element)) {
            this.show(element);
        } else {
            console.warn('⚠️ L\'élément n\'est pas une brique sur chant');
        }
    }

    // Méthode pour vérifier si le contrôle est actif
    isOpen() {
        return this.isActive && this.panel && this.panel.style.display !== 'none';
    }

    // Méthode pour obtenir l'élément actuellement contrôlé
    getCurrentElement() {
        return this.currentElement;
    }
    
    // Afficher le panneau (sans élément spécifique)
    showPanel() {
        console.log('🎯 showPanel appelé');
        
        // Vérifier ou récupérer le panneau
        if (!this.panel) {
            
            this.panel = document.getElementById('heightControlPanel');
        }
        
        if (!this.panel) {
            console.error('❌ Panel non trouvé dans showPanel - getElementById returned:', this.panel);
            // Essai d'une recherche alternative
            const allDivs = document.getElementsByTagName('div');
            
            for (let i = 0; i < allDivs.length; i++) {
                if (allDivs[i].id === 'heightControlPanel') {
                    console.log('✅ Panel trouvé via recherche alternative!');
                    this.panel = allDivs[i];
                    break;
                }
            }
            
            if (!this.panel) {
                console.error('❌ Panel définitivement introuvable');
                return;
            }
        }

        // Définir une hauteur par défaut
        const defaultHeight = 0; // Au sol
        const input = document.getElementById('targetHeight');
        if (input) {
            input.value = defaultHeight.toFixed(1);
            console.log('✅ Input hauteur initialisé à:', defaultHeight);
        } else {
            console.error('❌ Input targetHeight non trouvé');
        }
        
        // Afficher le panneau avec force
        this.panel.style.display = 'block';
        this.panel.style.visibility = 'visible'; // Au cas où
        this.panel.style.opacity = '1'; // Au cas où
        this.isActive = true;
        
        console.log('✅ Panneau de contrôle de hauteur ouvert - display:', this.panel.style.display);
        console.log('✅ Position du panneau:', this.panel.style.position || 'default');
    }
    
    // Masquer le panneau
    hidePanel() {
        if (!this.panel) return;
        
        this.panel.style.display = 'none';
        this.isActive = false;
        this.currentElement = null;
        
        // console.log('📐 Panneau de contrôle de hauteur fermé');
    }
    
    // Activer le mode placement automatiquement pour les briques sur chant
    enablePlacementMode() {
        if (window.ConstructionTools) {
            // Activer le mode placement s'il n'est pas déjà actif
            if (!window.ConstructionTools.isPlacementMode) {
                                window.ConstructionTools.togglePlacementMode();
            }
            
            // Attendre un court délai pour que l'élément de prévisualisation soit créé
            setTimeout(() => {
                this.setupInitialHeight();
            }, 100);
        } else {
            console.warn('⚠️ ConstructionTools non disponible pour activer le mode placement');
        }
    }
    
    // Configurer la hauteur initiale de l'élément de prévisualisation
    setupInitialHeight() {
        const input = document.getElementById('targetHeight');
        if (input) {
            const initialHeight = parseFloat(input.value) || 0;
            this.updateGhostElementHeight(initialHeight);
            console.log(`🎯 Hauteur initiale configurée: ${initialHeight}cm`);
        }
    }
}

// Initialisation automatique après chargement du DOM
setTimeout(() => {
        if (!window.heightControlManager) {
        window.heightControlManager = new HeightControlManager();
        // console.log('✅ HeightControlManager créé avec succès');
    }
}, 100);

// Intégration avec le système existant
document.addEventListener('DOMContentLoaded', () => {
    // console.log('🎛️ HeightControlManager class ready');
});

