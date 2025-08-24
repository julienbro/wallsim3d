/**
 * Système de Menu Ultra-Stable
 * Solution définitive pour les menus qui disparaissent lors du mouvement vers la scène
 */

class UltraStableMenuSystem {
    constructor() {
        this.currentOpenMenu = null;
        this.menuTimeout = null;
        this.isMouseInMenuArea = false;
        this.lastMouseY = 0;
        this.menuCloseDelay = 800; // Délai très long
        this.init();
    }

    init() {
        // console.log('🔧 Initialisation du système de menu ultra-stable');
        this.initMenuItems();
        this.initGlobalMouseTracking();
        this.initSceneInteraction();
    }

    initMenuItems() {
        const menuItems = document.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            const submenu = item.querySelector('.submenu');
            
            // Ouverture au survol
            item.addEventListener('mouseenter', (e) => {
                this.openMenu(item);
            });
            
            // Fermeture avec délai très long
            item.addEventListener('mouseleave', (e) => {
                this.scheduleCloseMenu(item, e);
            });
            
            // Gestion spéciale pour les sous-menus
            if (submenu) {
                submenu.addEventListener('mouseenter', () => {
                    this.isMouseInMenuArea = true;
                    this.cancelCloseMenu();
                    this.openMenu(item);
                });
                
                submenu.addEventListener('mouseleave', (e) => {
                    this.isMouseInMenuArea = false;
                    this.scheduleCloseMenu(item, e);
                });
                
                // Gestion des éléments du sous-menu
                const submenuItems = submenu.querySelectorAll('.submenu-item');
                submenuItems.forEach(subItem => {
                    subItem.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const action = subItem.getAttribute('data-action');
                        if (action) {
                            this.handleMenuAction(action);
                        }
                        this.closeAllMenus();
                    });
                });
            }
        });
    }

    initGlobalMouseTracking() {
        // Suivi global de la souris pour détecter les mouvements vers la scène
        document.addEventListener('mousemove', (e) => {
            this.lastMouseY = e.clientY;
            
            // Si on a un menu ouvert et qu'on descend vers la scène
            if (this.currentOpenMenu && e.clientY > 60) {
                // Vérifier si on est dans une zone "sûre" autour du menu
                const menuRect = this.currentOpenMenu.getBoundingClientRect();
                const submenu = this.currentOpenMenu.querySelector('.submenu');
                
                if (submenu) {
                    const submenuRect = submenu.getBoundingClientRect();
                    
                    // Zone élargie autour du menu (40px de chaque côté)
                    const safeZone = {
                        left: Math.min(menuRect.left, submenuRect.left) - 40,
                        right: Math.max(menuRect.right, submenuRect.right) + 40,
                        top: menuRect.top,
                        bottom: submenuRect.bottom + 40
                    };
                    
                    // Si on est dans la zone sûre, ne pas fermer
                    if (e.clientX >= safeZone.left && e.clientX <= safeZone.right &&
                        e.clientY >= safeZone.top && e.clientY <= safeZone.bottom) {
                        this.isMouseInMenuArea = true;
                        this.cancelCloseMenu();
                        return;
                    }
                }
            }
            
            // Si on sort de la zone du menu
            if (!this.isMouseOverAnyMenu(e)) {
                this.isMouseInMenuArea = false;
            }
        });
    }

    initSceneInteraction() {
        // Empêcher la fermeture quand on clique dans la scène
        const sceneContainer = document.getElementById('scene-container');
        if (sceneContainer) {
            sceneContainer.addEventListener('mouseenter', () => {
                // Ne pas fermer les menus quand on entre dans la scène
                this.cancelCloseMenu();
            });
        }
        
        // Fermer uniquement sur clic explicite en dehors
        document.addEventListener('click', (e) => {
            if (!this.isMouseOverAnyMenu(e) && 
                !e.target.closest('.menu-item') && 
                !e.target.closest('.submenu')) {
                this.closeAllMenus();
            }
        });
    }

    openMenu(menuItem) {
        this.cancelCloseMenu();
        
        // Fermer tous les autres menus
        document.querySelectorAll('.menu-item').forEach(item => {
            if (item !== menuItem) {
                item.classList.remove('active', 'menu-stay-open');
            }
        });
        
        // Ouvrir le menu actuel
        menuItem.classList.add('active', 'menu-stay-open');
        this.currentOpenMenu = menuItem;
        this.isMouseInMenuArea = true;
        
        // console.log(`📂 Menu ouvert: ${menuItem.textContent.trim()}`);
    }

    scheduleCloseMenu(menuItem, event) {
        // Ne pas programmer la fermeture si on est encore dans une zone de menu
        if (this.isMouseOverAnyMenu(event) || this.isMouseInMenuArea) {
            return;
        }
        
        this.cancelCloseMenu();
        
        this.menuTimeout = setTimeout(() => {
            if (!this.isMouseInMenuArea && this.currentOpenMenu === menuItem) {
                this.closeMenu(menuItem);
            }
        }, this.menuCloseDelay);
        
        // console.log(`⏰ Fermeture programmée pour: ${menuItem.textContent.trim()} (${this.menuCloseDelay}ms)`);
    }

    cancelCloseMenu() {
        if (this.menuTimeout) {
            clearTimeout(this.menuTimeout);
            this.menuTimeout = null;
            // console.log('❌ Fermeture annulée');
        }
    }

    closeMenu(menuItem) {
        menuItem.classList.remove('active', 'menu-stay-open');
        if (this.currentOpenMenu === menuItem) {
            this.currentOpenMenu = null;
        }
        this.isMouseInMenuArea = false;
        // console.log(`📁 Menu fermé: ${menuItem.textContent.trim()}`);
    }

    closeAllMenus() {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active', 'menu-stay-open');
        });
        this.currentOpenMenu = null;
        this.isMouseInMenuArea = false;
        this.cancelCloseMenu();
        // console.log('📁 Tous les menus fermés');
    }

    isMouseOverAnyMenu(event) {
        const menuBar = document.querySelector('.menu-bar');
        if (!menuBar) return false;
        
        const element = document.elementFromPoint(event.clientX, event.clientY);
        return element && (
            element.closest('.menu-item') || 
            element.closest('.submenu') ||
            element.closest('.menu-bar')
        );
    }

    handleMenuAction(action) {
        // console.log(`🎯 Action exécutée: ${action}`);
        
        // Actions de base
        const actions = {
            'new': () => {}, // console.log('Nouveau projet'),
            'open': () => {}, // console.log('Ouvrir projet'),
            'save': () => {}, // console.log('Sauvegarder'),
            'save-as': () => {}, // console.log('Sauvegarder sous'),
            'preferences': () => {}, // console.log('Préférences'),
            'undo': () => {}, // console.log('Annuler'),
            'redo': () => {}, // console.log('Rétablir'),
            'copy': () => {}, // console.log('Copier'),
            'paste': () => {}, // console.log('Coller'),
            'duplicate': () => {}, // console.log('Dupliquer'),
            'select-all': () => {}, // console.log('Tout sélectionner'),
            'delete-selected': () => {} // console.log('Supprimer sélection')
        };
        
        if (actions[action]) {
            actions[action]();
        }
    }
}

// Auto-initialisation quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new UltraStableMenuSystem();
    });
} else {
    new UltraStableMenuSystem();
}
