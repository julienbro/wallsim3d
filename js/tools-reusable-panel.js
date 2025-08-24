/**
 * GESTIONNAIRE DES "ÉLÉMENTS À RÉUTILISER" DANS L'ONGLET OUTILS
 * Gère l'affichage permanent et la synchronisation avec les éléments utilisés
 */

class ToolsReusablePanel {
    constructor() {
        this.initializePanel();
    }

    initializePanel() {
        // Attendre que le DOM soit chargé
        document.addEventListener('DOMContentLoaded', () => {
            this.setupElements();
            // console.log('🔧 ToolsReusablePanel: Affichage permanent des éléments à réutiliser initialisé');
        });
    }

    setupElements() {
        // Pas de panneau déroulant, affichage direct
        // console.log('🎯 ToolsReusablePanel: Affichage permanent activé');
    }

    // Méthode publique pour actualiser depuis l'extérieur
    refresh() {
        this.updateToolsDisplay();
    }

    updateToolsDisplay() {
        // Copier les éléments depuis la liste principale vers l'affichage outils
        this.copyBricksToTools();
        this.copyBlocksToTools();
        this.copyOthersToTools();
        this.updateToolsStats();
    }

    copyBricksToTools() {
        const sourceBricks = document.getElementById('reused-bricks');
        const targetBricks = document.getElementById('tools-reused-bricks');
        
        if (sourceBricks && targetBricks) {
            this.copyElementsToCompactFormat(sourceBricks, targetBricks, 'bricks');
        }
    }

    copyBlocksToTools() {
        const sourceBlocks = document.getElementById('reused-blocks');
        const targetBlocks = document.getElementById('tools-reused-blocks');
        
        if (sourceBlocks && targetBlocks) {
            this.copyElementsToCompactFormat(sourceBlocks, targetBlocks, 'blocks');
        }
    }

    copyOthersToTools() {
        const sourceOthers = document.getElementById('reused-others');
        const targetOthers = document.getElementById('tools-reused-others');
        
        if (sourceOthers && targetOthers) {
            this.copyElementsToCompactFormat(sourceOthers, targetOthers, 'others');
        }
    }

    copyElementsToCompactFormat(source, target, type) {
        if (!source || !target) return;

        // Vider le conteneur cible
        target.innerHTML = '';

        // Récupérer tous les éléments (sauf les placeholders) depuis le TabManager
        const category = type === 'bricks' ? 'briques' : type === 'blocks' ? 'blocs' : 'autres';
        const elements = window.tabManager?.reusableElements?.[category];
        
        if (!elements || elements.size === 0) {
            // Afficher un placeholder compact approprié
            let placeholderText = '';
            let placeholderDetails = '';
            
            switch(type) {
                case 'bricks':
                    placeholderText = 'Aucune brique utilisée pour le moment.';
                    placeholderDetails = 'Les briques que vous placez apparaîtront ici.';
                    break;
                case 'blocks':
                    placeholderText = 'Aucun bloc utilisé pour le moment.';
                    placeholderDetails = 'Les blocs que vous placez apparaîtront ici.';
                    break;
                case 'others':
                    placeholderText = 'Aucun autre élément utilisé.';
                    placeholderDetails = 'Les isolants, linteaux, etc. apparaîtront ici.';
                    break;
            }
            
            target.innerHTML = `
                <div class="tools-reuse-placeholder">
                    <i class="fas fa-info-circle"></i>
                    <small>${placeholderText}</small>
                    <small>${placeholderDetails}</small>
                </div>
            `;
            return;
        }

        // Créer les éléments avec aperçu 3D et informations complètes
        elements.forEach((element, key) => {
            const reuseItem = this.createToolsReuseItem(element, key);
            target.appendChild(reuseItem);
        });
    }

    // Créer un élément réutilisable spécialement formaté pour l'onglet Outils
    createToolsReuseItem(element, key) {
        const item = document.createElement('div');
        item.className = 'reuse-item tools-reuse-item';
        item.dataset.key = key;
        
        const displayName = this.getElementDisplayName(element.type, element.cut);
        const icon = this.getElementIcon(element.type);
        
        // Formater les dimensions
        let dimensionsText = 'Dimensions non spécifiées';
        if (element.dimensions) {
            dimensionsText = typeof element.dimensions === 'string' ? element.dimensions : 
                            `${element.dimensions.length}×${element.dimensions.width}×${element.dimensions.height} cm`;
        }

        item.innerHTML = `
            <div class="reuse-item-header">
                <div class="reuse-item-name">${displayName}</div>
                <div class="reuse-item-count">${element.count}</div>
            </div>
            <div class="reuse-item-dimensions">${dimensionsText}</div>
            <div class="reuse-item-preview" id="tools-preview-${key}">
                <div class="reuse-preview-fallback">${icon}</div>
            </div>
        `;

        // Générer l'aperçu 3D
        setTimeout(() => {
            this.generate3DPreview(element.type, element.cut, `tools-preview-${key}`);
        }, 100);

        // Ajouter l'événement de clic (plus besoin de vérifier les boutons de coupe)
        item.addEventListener('click', (e) => {
            this.selectReusableElement(element, key);
        });

        return item;
    }

    // Méthodes utilitaires (copiées depuis TabManager)
    getElementDisplayName(elementType, cut) {
        return window.tabManager?.getElementDisplayName(elementType, cut) || elementType;
    }

    getElementIcon(elementType) {
        return window.tabManager?.getElementIcon(elementType) || '🧱';
    }

    canElementHaveCuts(elementType) {
        return window.tabManager?.canElementHaveCuts(elementType) || false;
    }

    createCutButtons(elementType, currentCut) {
        return window.tabManager?.createCutButtons(elementType, currentCut) || '';
    }

    generate3DPreview(elementType, cut, containerId) {
        if (window.tabManager?.generate3DPreview) {
            window.tabManager.generate3DPreview(elementType, cut, containerId);
        }
    }

    selectReusableElement(element, key) {
        if (window.tabManager?.selectReusableElement) {
            window.tabManager.selectReusableElement(element, key);
        }
    }

    createCompactElements(elements, target) {
        target.innerHTML = '';
        
        if (!elements || elements.size === 0) {
            target.innerHTML = '<div class="no-elements">Aucun élément utilisé</div>';
            return;
        }

        // Convertir chaque élément en format compact
        elements.forEach(element => {
            const compactElement = this.createCompactElement(element);
            target.appendChild(compactElement);
        });
    }

    createCompactElement(originalElement) {
        const compact = document.createElement('div');
        compact.className = 'tools-reuse-item';
        
        // Récupérer les informations de l'élément original
        const nameElement = originalElement.querySelector('.reuse-item-name');
        const infoElement = originalElement.querySelector('.reuse-item-info');
        const countElement = originalElement.querySelector('.reuse-count');
        
        const name = nameElement ? nameElement.textContent : 'Élément';
        const info = infoElement ? infoElement.textContent : '';
        const count = countElement ? countElement.textContent : '1';

        // Créer le contenu compact
        compact.innerHTML = `
            <div class="tools-reuse-item-name">${name}</div>
            <div class="tools-reuse-item-info">${info}</div>
            <div class="tools-reuse-item-count">${count}</div>
        `;

        // Copier les événements de clic
        const originalOnClick = originalElement.onclick;
        if (originalOnClick) {
            compact.onclick = originalOnClick;
        }

        // Copier les données
        if (originalElement.dataset) {
            Object.keys(originalElement.dataset).forEach(key => {
                compact.dataset[key] = originalElement.dataset[key];
            });
        }

        return compact;
    }

    updateToolsStats() {
        // Synchroniser les statistiques
        const sourceBricksCount = document.getElementById('reusedBricksCount');
        const sourceBlocksCount = document.getElementById('reusedBlocksCount');
        const sourceTotalCount = document.getElementById('totalReusedCount');
        
        const targetBricksCount = document.getElementById('tools-reusedBricksCount');
        const targetBlocksCount = document.getElementById('tools-reusedBlocksCount');
        const targetTotalCount = document.getElementById('tools-totalReusedCount');

        if (sourceBricksCount && targetBricksCount) {
            targetBricksCount.textContent = sourceBricksCount.textContent;
        }
        
        if (sourceBlocksCount && targetBlocksCount) {
            targetBlocksCount.textContent = sourceBlocksCount.textContent;
        }
        
        if (sourceTotalCount && targetTotalCount) {
            targetTotalCount.textContent = sourceTotalCount.textContent;
        }
    }
}

// Créer une instance globale
window.toolsReusablePanel = new ToolsReusablePanel();
