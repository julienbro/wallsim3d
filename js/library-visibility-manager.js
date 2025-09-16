/**
 * SYSTÈME DE VISIBILITÉ GARANTIE POUR LA BIBLIOTHÈQUE
 * Assure que tous les éléments de la bibliothèque restent entièrement visibles
 */

class LibraryVisibilityManager {
    constructor() {
        this.initialized = false;
        this.resizeTimeout = null;
        this.lastViewportWidth = 0;
        
        // Démarrer le système
        this.init();
    }
    
    init() {
        // Attendre que le DOM soit prêt
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
                
        // Observer les changements de taille de fenêtre
        window.addEventListener('resize', () => this.handleResize());
        
        // Observer les changements de contenu de la bibliothèque
        this.observeLibraryChanges();
        
        // Ajustement initial
        this.adjustLibraryVisibility();
        
        this.initialized = true;
    }
    
    handleResize() {
        // Débounce pour éviter trop de calculs
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            const currentWidth = window.innerWidth;
            if (Math.abs(currentWidth - this.lastViewportWidth) > 50) {
                this.adjustLibraryVisibility();
                this.lastViewportWidth = currentWidth;
            }
        }, 150);
    }
    
    observeLibraryChanges() {
        // Observer l'apparition de nouvelles sections de bibliothèque
        const observer = new MutationObserver((mutations) => {
            let hasLibraryChanges = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            if (node.classList?.contains('library-section') || 
                                node.querySelector?.('.library-section')) {
                                hasLibraryChanges = true;
                            }
                        }
                    });
                }
            });
            
            if (hasLibraryChanges) {
                setTimeout(() => this.adjustLibraryVisibility(), 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    adjustLibraryVisibility() {
        const libraryGrids = document.querySelectorAll('.library-grid');
        
        libraryGrids.forEach(grid => this.adjustSingleGrid(grid));
    }
    
    adjustSingleGrid(grid) {
        if (!grid || !grid.offsetParent) return; // Élément pas visible
        
        const containerWidth = grid.offsetWidth;
        const items = grid.querySelectorAll('.library-item');
        
        if (items.length === 0) return;
        
        // Calculer la taille optimale des éléments
        const optimalConfig = this.calculateOptimalLayout(containerWidth, items.length);
        
        // Appliquer les styles calculés
        this.applyLayoutConfig(grid, optimalConfig);
        
        // Vérifier si tous les éléments sont visibles
        this.ensureFullVisibility(grid, items);
    }
    
    calculateOptimalLayout(containerWidth, itemCount) {
        // Configurations prédéfinies selon la largeur
        const configs = [
            { minWidth: 1400, itemWidth: 140, itemHeight: 140, previewSize: { w: 120, h: 85 } },
            { minWidth: 1200, itemWidth: 130, itemHeight: 130, previewSize: { w: 110, h: 75 } },
            { minWidth: 1000, itemWidth: 120, itemHeight: 120, previewSize: { w: 100, h: 70 } },
            { minWidth: 800, itemWidth: 110, itemHeight: 110, previewSize: { w: 90, h: 65 } },
            { minWidth: 600, itemWidth: 100, itemHeight: 100, previewSize: { w: 80, h: 55 } },
            { minWidth: 400, itemWidth: 90, itemHeight: 90, previewSize: { w: 70, h: 50 } },
            { minWidth: 0, itemWidth: 80, itemHeight: 80, previewSize: { w: 60, h: 45 } }
        ];
        
        // Trouver la configuration appropriée
        const config = configs.find(c => containerWidth >= c.minWidth) || configs[configs.length - 1];
        
        // Calculer le nombre de colonnes possibles - FORCÉ À 2 COLONNES
        const maxColumns = Math.floor(containerWidth / config.itemWidth);
        const actualColumns = 2; // FORCÉ À 2 COLONNES au lieu de Math.min(maxColumns, itemCount)
        
        return {
            ...config,
            columns: actualColumns,
            containerWidth: containerWidth
        };
    }
    
    applyLayoutConfig(grid, config) {
        // Appliquer la grille CSS - FORCÉ À 2 COLONNES
        grid.style.setProperty('grid-template-columns', 
            '1fr 1fr', 'important'); // FORCÉ À 2 COLONNES AU LIEU DE repeat(${config.columns}, 1fr)
        
        // Appliquer les tailles aux éléments
        const items = grid.querySelectorAll('.library-item');
        const previews = grid.querySelectorAll('.preview-3d, .preview-3d-static');
        
        items.forEach(item => {
            item.style.setProperty('max-width', `${config.itemWidth}px`, 'important');
            item.style.setProperty('min-height', `${config.itemHeight}px`, 'important');
        });
        
        previews.forEach(preview => {
            preview.style.setProperty('width', `${config.previewSize.w}px`, 'important');
            preview.style.setProperty('height', `${config.previewSize.h}px`, 'important');
        });
        
        // console.log(`📏 Bibliothèque ajustée: ${config.columns} colonnes, éléments ${config.itemWidth}x${config.itemHeight}px`);
    }
    
    ensureFullVisibility(grid, items) {
        // Vérifier si il y a plus de 2 éléments (donc plus d'1 ligne avec 2 colonnes fixes)
        if (items.length === 0) return;
        
        const gridRect = grid.getBoundingClientRect();
        
        // Avec 2 colonnes fixes, activer le scroll vertical si plus de 2 éléments
        if (items.length > 2) {
            // console.log('⚠️ Plus de 2 éléments, activation du scroll vertical...');
            
            // Activer le scroll VERTICAL pour les grilles avec plus de 2 éléments
            grid.classList.add('force-visible');
            grid.style.setProperty('overflow-x', 'visible', 'important'); // VISIBLE horizontalement
            grid.style.setProperty('overflow-y', 'auto', 'important'); // SCROLL vertical
            grid.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
            
            // Indicateur de débordement
            grid.classList.add('has-overflow');
        } else {
            // 2 éléments ou moins, pas de scroll nécessaire
            grid.classList.remove('force-visible', 'has-overflow');
            grid.style.removeProperty('overflow-x');
            grid.style.removeProperty('overflow-y'); // Suppression de l'overflow-y aussi
        }
    }
    
    // Méthode publique pour forcer un recalcul
    recalculate() {
        if (this.initialized) {
            this.adjustLibraryVisibility();
        }
    }
    
    // Méthode pour activer/désactiver le système
    setEnabled(enabled) {
        if (enabled && !this.initialized) {
            this.setup();
        }
        // TODO: Implémenter la désactivation si nécessaire
    }
}

// Initialisation automatique
let libraryVisibilityManager;

// Démarrer dès que possible
(() => {
    const startManager = () => {
        if (!libraryVisibilityManager) {
            libraryVisibilityManager = new LibraryVisibilityManager();
            // console.log('✅ Système de visibilité de la bibliothèque activé');
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startManager);
    } else {
        startManager();
    }
})();

// Exposer globalement pour debug et intégration
window.LibraryVisibilityManager = LibraryVisibilityManager;
window.libraryVisibilityManager = libraryVisibilityManager;

