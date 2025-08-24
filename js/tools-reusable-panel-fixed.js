/**
 * GESTIONNAIRE DES "ÉLÉMENTS À RÉUTILISER" DANS L'ONGLET OUTILS - VERSION CORRIGÉE
 * Gère l'affichage permanent et la synchronisation avec les éléments utilisés
 */

class ToolsReusablePanelFixed {
    constructor() {
        this.initializePanel();
    }

    initializePanel() {
        // Attendre que le DOM soit chargé
        document.addEventListener('DOMContentLoaded', () => {
            this.setupElements();
            // console.log('🔧 ToolsReusablePanelFixed: Affichage permanent des éléments à réutiliser initialisé');
        });
    }

    setupElements() {
        // Pas de panneau déroulant, affichage direct
        // console.log('🎯 ToolsReusablePanelFixed: Affichage permanent activé');
    }

    // Méthode publique pour actualiser depuis l'extérieur
    refresh() {
        this.updateToolsDisplay();
    }

    updateToolsDisplay() {
        // Afficher tous les éléments dans une grille unifiée
        this.updateUnifiedGrid();
        this.updateToolsStats();
    }

    updateUnifiedGrid() {
        const unifiedGrid = document.getElementById('tools-unified-reuse-grid');
        if (!unifiedGrid) return;

        // Vider la grille
        unifiedGrid.innerHTML = '';

        // Récupérer tous les éléments de toutes les catégories
        const allElements = [];
        
        // Ajouter les briques
        const bricks = window.tabManager?.reusableElements?.briques;
        if (bricks && bricks.size > 0) {
            bricks.forEach((element, key) => {
                allElements.push({...element, key, category: 'brique'});
            });
        }

        // Ajouter les blocs
        const blocks = window.tabManager?.reusableElements?.blocs;
        if (blocks && blocks.size > 0) {
            blocks.forEach((element, key) => {
                allElements.push({...element, key, category: 'bloc'});
            });
        }

        // Ajouter les autres éléments
        const others = window.tabManager?.reusableElements?.autres;
        if (others && others.size > 0) {
            others.forEach((element, key) => {
                allElements.push({...element, key, category: 'autre'});
            });
        }

        // Ajouter les éléments GLB
        const glb = window.tabManager?.reusableElements?.glb;
        if (glb && glb.size > 0) {
            glb.forEach((element, key) => {
                allElements.push({...element, key, category: 'glb'});
            });
        }

        // Afficher le placeholder si aucun élément
        if (allElements.length === 0) {
            unifiedGrid.innerHTML = `
                <div class="reuse-placeholder">
                    <i class="fas fa-info-circle"></i>
                    <p>Aucun élément utilisé pour le moment.</p>
                    <small>Les éléments que vous placez apparaîtront ici côte à côte.</small>
                </div>
            `;
            return;
        }

        // Créer et ajouter chaque élément à la grille unifiée
        allElements.forEach(element => {
            const reuseItem = this.createUnifiedReuseItem(element);
            unifiedGrid.appendChild(reuseItem);
        });

        // Maintenir la compatibilité avec le code existant en remplissant les conteneurs cachés
        this.copyBricksToTools();
        this.copyBlocksToTools();
        this.copyOthersToTools();
        this.copyGLBToTools();
    }

    // Créer un élément réutilisable pour la grille unifiée
    createUnifiedReuseItem(element) {
        const item = document.createElement('div');
        item.className = 'reuse-item tools-reuse-item';
        item.dataset.key = element.key;
        item.dataset.type = element.category;
        
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
            <div class="reuse-item-preview" id="tools-unified-preview-${element.key}">
                <div class="reuse-preview-fallback">${icon}</div>
            </div>
        `;

        // Générer l'aperçu 3D
        setTimeout(() => {
            // Détecter si c'est un élément GLB
            if (element.elementType === 'glb' || (element.type && element.type.includes('hourdis'))) {
                // Utiliser generateGLBPreview pour les éléments GLB
                if (window.tabManager?.generateGLBPreview) {
                    window.tabManager.generateGLBPreview(element, `tools-unified-preview-${element.key}`);
                }
            } else {
                // Utiliser generate3DPreview pour les éléments normaux
                this.generate3DPreview(element.type, element.cut, `tools-unified-preview-${element.key}`);
            }
        }, 100);

        // Ajouter l'événement de clic
        item.addEventListener('click', (e) => {
            // Si c'est un clic sur un bouton de coupe, gérer différemment
            if (e.target.classList.contains('reuse-cut-btn')) {
                const cutType = e.target.dataset.cut;
                const elementType = e.target.dataset.type;
                
                // Mettre à jour l'aperçu 3D de cet élément uniquement
                this.updatePreviewWithCut(element.type, cutType, `tools-unified-preview-${element.key}`);
                
                // Mettre à jour visuellement les boutons de coupe de cet élément
                item.querySelectorAll('.reuse-cut-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Informer le TabManager de la sélection de coupe
                if (window.tabManager && window.tabManager.selectReusableCut) {
                    window.tabManager.selectReusableCut(elementType, cutType);
                }
                return;
            }

            // Pour un clic normal sur l'élément, sélectionner l'élément
            this.selectReusableElement(element);
        });

        return item;
    }

    copyBricksToTools() {
        const targetBricks = document.getElementById('tools-reused-bricks');
        if (targetBricks) {
            this.copyElementsToCompactFormat('bricks', targetBricks);
        }
    }

    copyBlocksToTools() {
        const targetBlocks = document.getElementById('tools-reused-blocks');
        if (targetBlocks) {
            this.copyElementsToCompactFormat('blocks', targetBlocks);
        }
    }

    copyOthersToTools() {
        const targetOthers = document.getElementById('tools-reused-others');
        if (targetOthers) {
            this.copyElementsToCompactFormat('others', targetOthers);
        }
    }

    copyGLBToTools() {
        const targetGLB = document.getElementById('tools-reused-glb');
        if (targetGLB) {
            this.copyElementsToCompactFormat('glb', targetGLB);
        }
    }

    copyElementsToCompactFormat(type, target) {
        if (!target) return;

        // Vider le conteneur cible
        target.innerHTML = '';

        // Récupérer tous les éléments depuis le TabManager
        const category = type === 'bricks' ? 'briques' : 
                        type === 'blocks' ? 'blocs' : 
                        type === 'glb' ? 'glb' : 'autres';
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
                case 'glb':
                    placeholderText = 'Aucun élément GLB utilisé.';
                    placeholderDetails = 'Les modèles 3D que vous placez apparaîtront ici.';
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
            // Détecter si c'est un élément GLB
            if (element.elementType === 'glb' || (element.type && element.type.includes('hourdis'))) {
                // Utiliser generateGLBPreview pour les éléments GLB
                if (window.tabManager?.generateGLBPreview) {
                    window.tabManager.generateGLBPreview(element, `tools-preview-${key}`);
                }
            } else {
                // Utiliser generate3DPreview pour les éléments normaux
                this.generate3DPreview(element.type, element.cut, `tools-preview-${key}`);
            }
        }, 100);

        // Ajouter l'événement de clic
        item.addEventListener('click', (e) => {
            this.selectReusableElement(element, key);
        });

        return item;
    }

    // Sélectionner un élément réutilisable
    selectReusableElement(element, key) {
        if (window.tabManager && window.tabManager.selectReusableElement) {
            window.tabManager.selectReusableElement(element, key);
        }
    }

    // Méthodes utilitaires (délèguent vers TabManager)
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

    // Méthode pour mettre à jour l'aperçu avec une coupe spécifique
    updatePreviewWithCut(elementType, cutType, containerId) {
        const previewContainer = document.getElementById(containerId);
        if (previewContainer) {
            // Nettoyer l'aperçu précédent
            previewContainer.innerHTML = '<div class="reuse-preview-fallback">🧱</div>';
            
            // Générer le nouvel aperçu avec la coupe
            setTimeout(() => {
                this.generate3DPreview(elementType, cutType, containerId);
            }, 50);
        }
    }

    selectReusableElement(element, key) {
        if (window.tabManager?.selectReusableElement) {
            window.tabManager.selectReusableElement(element, key);
        }
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
window.toolsReusablePanel = new ToolsReusablePanelFixed();

