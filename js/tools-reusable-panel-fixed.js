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

        // Générer un aperçu statique après que l'élément soit ajouté au DOM
        setTimeout(() => {
            this.generateStaticPreview(element, `tools-unified-preview-${element.key}`);
        }, 10);

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

        // Générer un aperçu statique après que l'élément soit ajouté au DOM
        setTimeout(() => {
            this.generateStaticPreview(element, `tools-preview-${key}`);
        }, 10);

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

    // Générer un aperçu statique (SVG/2D) pour performance optimale
    generateStaticPreview(element, containerId) {
        // Vérifier que ce n'est pas l'aperçu de l'élément actif (qui doit rester 3D)
        if (containerId && containerId.includes('toolsActiveElement')) {
            console.log('🚫 Aperçu statique ignoré pour élément actif (reste 3D)');
            return;
        }
        
        // Attendre que le container soit disponible
        const checkContainer = () => {
            const container = document.getElementById(containerId);
            if (!container) {
                // Retry dans 50ms si le container n'est pas encore disponible
                setTimeout(checkContainer, 50);
                return;
            }

            // Effacer le contenu existant
            container.innerHTML = '';

            // Détecter le type d'élément
            const elementType = element.type || element.elementType || 'unknown';
            
            console.log(`🎨 Génération aperçu statique pour ${elementType} dans ${containerId}`);
            
            // Marquer le container comme étant un aperçu statique
            container.setAttribute('data-preview-type', 'static');
            
            if (elementType.includes('hourdis')) {
                // Aperçu statique pour hourdis
                this.createHourdisStaticPreview(container, element);
            } else if (elementType.startsWith('M')) {
                // Aperçu statique pour briques
                this.createBrickStaticPreview(container, element);
            } else if (elementType.includes('bloc')) {
                // Aperçu statique pour blocs
                this.createBlockStaticPreview(container, element);
            } else {
                // Aperçu générique
                this.createGenericStaticPreview(container, element);
            }
        };

        checkContainer();
    }

    // Créer un aperçu statique pour hourdis
    createHourdisStaticPreview(container, element) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 120 120');
        svg.style.background = '#f8f9fa';

        // Créer une représentation simplifiée du hourdis
        const hourdis = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        hourdis.setAttribute('x', '20');
        hourdis.setAttribute('y', '45');
        hourdis.setAttribute('width', '80');
        hourdis.setAttribute('height', '30');
        hourdis.setAttribute('fill', '#8B4513');
        hourdis.setAttribute('stroke', '#654321');
        hourdis.setAttribute('stroke-width', '1');

        // Ajouter des lignes de détail
        for (let i = 0; i < 4; i++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', 30 + i * 15);
            line.setAttribute('y1', '45');
            line.setAttribute('x2', 30 + i * 15);
            line.setAttribute('y2', '75');
            line.setAttribute('stroke', '#654321');
            line.setAttribute('stroke-width', '0.5');
            svg.appendChild(line);
        }

        // Ombre
        const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        shadow.setAttribute('x', '22');
        shadow.setAttribute('y', '47');
        shadow.setAttribute('width', '80');
        shadow.setAttribute('height', '30');
        shadow.setAttribute('fill', 'rgba(0,0,0,0.2)');

        svg.appendChild(shadow);
        svg.appendChild(hourdis);

        // Texte descriptif
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '60');
        text.setAttribute('y', '95');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '10');
        text.setAttribute('fill', '#666');
        text.textContent = 'Hourdis';
        svg.appendChild(text);

        container.appendChild(svg);
    }

    // Créer un aperçu statique pour briques
    createBrickStaticPreview(container, element) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 120 120');
        svg.style.background = '#f8f9fa';

        // Brique principale
        const brick = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        brick.setAttribute('x', '20');
        brick.setAttribute('y', '50');
        brick.setAttribute('width', '80');
        brick.setAttribute('height', '20');
        brick.setAttribute('fill', '#cc6633');
        brick.setAttribute('stroke', '#aa5522');
        brick.setAttribute('stroke-width', '1');

        // Mortier (joints)
        const mortarTop = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        mortarTop.setAttribute('x', '15');
        mortarTop.setAttribute('y', '47');
        mortarTop.setAttribute('width', '90');
        mortarTop.setAttribute('height', '3');
        mortarTop.setAttribute('fill', '#ddd');

        const mortarBottom = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        mortarBottom.setAttribute('x', '15');
        mortarBottom.setAttribute('y', '70');
        mortarBottom.setAttribute('width', '90');
        mortarBottom.setAttribute('height', '3');
        mortarBottom.setAttribute('fill', '#ddd');

        svg.appendChild(mortarTop);
        svg.appendChild(mortarBottom);
        svg.appendChild(brick);

        // Texte descriptif
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '60');
        text.setAttribute('y', '95');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '10');
        text.setAttribute('fill', '#666');
        text.textContent = element.type || 'Brique';
        svg.appendChild(text);

        container.appendChild(svg);
    }

    // Créer un aperçu statique pour blocs
    createBlockStaticPreview(container, element) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 120 120');
        svg.style.background = '#f8f9fa';

        // Bloc principal
        const block = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        block.setAttribute('x', '30');
        block.setAttribute('y', '40');
        block.setAttribute('width', '60');
        block.setAttribute('height', '40');
        block.setAttribute('fill', '#888');
        block.setAttribute('stroke', '#666');
        block.setAttribute('stroke-width', '1');

        // Alvéoles (pour blocs creux)
        const hole1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        hole1.setAttribute('x', '35');
        hole1.setAttribute('y', '45');
        hole1.setAttribute('width', '20');
        hole1.setAttribute('height', '30');
        hole1.setAttribute('fill', '#f8f9fa');
        hole1.setAttribute('stroke', '#666');
        hole1.setAttribute('stroke-width', '0.5');

        const hole2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        hole2.setAttribute('x', '65');
        hole2.setAttribute('y', '45');
        hole2.setAttribute('width', '20');
        hole2.setAttribute('height', '30');
        hole2.setAttribute('fill', '#f8f9fa');
        hole2.setAttribute('stroke', '#666');
        hole2.setAttribute('stroke-width', '0.5');

        svg.appendChild(block);
        svg.appendChild(hole1);
        svg.appendChild(hole2);

        // Texte descriptif
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '60');
        text.setAttribute('y', '95');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '10');
        text.setAttribute('fill', '#666');
        text.textContent = 'Bloc';
        svg.appendChild(text);

        container.appendChild(svg);
    }

    // Créer un aperçu générique
    createGenericStaticPreview(container, element) {
        const div = document.createElement('div');
        div.className = 'static-preview-generic';
        div.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 4px;
        `;

        const icon = document.createElement('i');
        icon.className = 'fas fa-cube';
        icon.style.cssText = 'font-size: 24px; color: #666; margin-bottom: 8px;';

        const text = document.createElement('div');
        text.style.cssText = 'font-size: 10px; color: #666; text-align: center;';
        text.textContent = element.type || element.name || 'Élément';

        div.appendChild(icon);
        div.appendChild(text);
        container.appendChild(div);
    }
}

// Créer une instance globale
window.toolsReusablePanel = new ToolsReusablePanelFixed();

