/**
 * Système de menu renforcé pour éviter la fermeture lors du passage vers la scène
 * WallSim3D - Menu System Enhanced
 */

class EnhancedMenuSystem {
    constructor() {
        this.currentOpenMenu = null;
        this.globalTimeout = null;
        this.isInMenuArea = false;
        this.mousePosition = { x: 0, y: 0 };
        this.menuAreas = new Map();
        this.init();
    }

    init() {
        // console.log('🎯 Système de menu renforcé initialisé');
        this.setupMenuItems();
        this.setupGlobalMouseTracking();
        this.setupClickHandlers();
        this.enhanceExistingMenu();
        this.bindMenuEvents();
    }

    setupMenuItems() {
        const menuItems = document.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            const submenu = item.querySelector('.submenu');
            
            item.addEventListener('mouseenter', (e) => this.handleMenuEnter(item, e));
            item.addEventListener('mouseleave', (e) => this.handleMenuLeave(item, e));
            
            if (submenu) {
                submenu.addEventListener('mouseenter', (e) => this.handleSubmenuEnter(item, submenu, e));
                submenu.addEventListener('mouseleave', (e) => this.handleSubmenuLeave(item, submenu, e));
            }
        });
    }

    createMenuArea(menuItem, submenu) {
        const menuRect = menuItem.getBoundingClientRect();
        const submenuRect = submenu ? submenu.getBoundingClientRect() : menuRect;
        
        return {
            left: Math.min(menuRect.left, submenuRect.left) - 20,
            right: Math.max(menuRect.right, submenuRect.right) + 20,
            top: menuRect.top - 20,
            bottom: submenuRect.bottom + 50 // Zone étendue vers le bas pour la scène
        };
    }

    isMouseInArea(x, y, area) {
        return x >= area.left && x <= area.right && y >= area.top && y <= area.bottom;
    }

    handleMenuEnter(item, e) {
        this.clearAllTimeouts();
        this.isInMenuArea = true;
        
        // Fermer tous les autres menus
        this.closeAllMenus();
        
        // Délai très court pour éviter l'ouverture accidentelle
        setTimeout(() => {
            if (this.isInMenuArea) {
                item.classList.add('active');
                this.currentOpenMenu = item;
                
                // Mettre à jour la zone de détection
                const submenu = item.querySelector('.submenu');
                if (submenu) {
                    this.menuAreas.set(item, this.createMenuArea(item, submenu));
                }
            }
        }, 30);
    }

    handleMenuLeave(item, e) {
        const submenu = item.querySelector('.submenu');
        const relatedTarget = e.relatedTarget;
        
        // Ne pas fermer si on va vers le sous-menu
        if (submenu && this.isElementInSubmenu(relatedTarget, submenu)) {
            return;
        }
        
        this.isInMenuArea = false;
        this.scheduleClose(item, 600); // Délai long pour permettre le retour
    }

    handleSubmenuEnter(item, submenu, e) {
        this.clearAllTimeouts();
        this.isInMenuArea = true;
        item.classList.add('active');
        this.currentOpenMenu = item;
    }

    handleSubmenuLeave(item, submenu, e) {
        const relatedTarget = e.relatedTarget;
        
        // Ne pas fermer si on retourne vers l'élément de menu parent
        if (item.contains(relatedTarget)) {
            return;
        }
        
        this.isInMenuArea = false;
        this.scheduleClose(item, 400);
    }

    isElementInSubmenu(element, submenu) {
        return element && (
            submenu.contains(element) || 
            submenu === element ||
            element.closest('.submenu') === submenu
        );
    }

    setupGlobalMouseTracking() {
        document.addEventListener('mousemove', (e) => {
            this.mousePosition = { x: e.clientX, y: e.clientY };
            
            if (this.currentOpenMenu) {
                const area = this.menuAreas.get(this.currentOpenMenu);
                if (area) {
                    const inArea = this.isMouseInArea(e.clientX, e.clientY, area);
                    
                    if (inArea && !this.isInMenuArea) {
                        // Retour dans la zone
                        this.clearAllTimeouts();
                        this.isInMenuArea = true;
                        this.currentOpenMenu.classList.add('active');
                    } else if (!inArea && this.isInMenuArea) {
                        // Sortie de la zone
                        this.isInMenuArea = false;
                        this.scheduleClose(this.currentOpenMenu, 200);
                    }
                }
            }
        });
    }

    setupClickHandlers() {
        // Gestion des clics sur les éléments de menu
        document.addEventListener('click', (e) => {
            const submenuItem = e.target.closest('.submenu-item');
            if (submenuItem) {
                e.stopPropagation();
                const action = submenuItem.getAttribute('data-action');
                if (action) {
                    this.handleMenuAction(action);
                }
                this.closeAllMenus();
                return;
            }
            
            // Fermer les menus si on clique ailleurs
            if (!e.target.closest('.menu-item') && !e.target.closest('.submenu')) {
                this.closeAllMenus();
            }
        });
    }

    scheduleClose(item, delay) {
        this.clearAllTimeouts();
        this.globalTimeout = setTimeout(() => {
            if (!this.isInMenuArea && this.currentOpenMenu === item) {
                item.classList.remove('active');
                this.currentOpenMenu = null;
                this.menuAreas.delete(item);
            }
        }, delay);
    }

    clearAllTimeouts() {
        if (this.globalTimeout) {
            clearTimeout(this.globalTimeout);
            this.globalTimeout = null;
        }
    }

    closeAllMenus() {
        document.querySelectorAll('.menu-item.active').forEach(item => {
            item.classList.remove('active');
        });
        this.currentOpenMenu = null;
        this.isInMenuArea = false;
        this.menuAreas.clear();
        this.clearAllTimeouts();
    }

    handleMenuAction(action) {
        // console.log('Action de menu:', action);
        // Ici vous pouvez ajouter la logique pour gérer les actions de menu
        // Ou déléguer à l'instance ModernInterface existante
        if (window.modernInterface && window.modernInterface.handleMenuAction) {
            window.modernInterface.handleMenuAction(action);
        }
    }
}

// Auto-initialisation quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.enhancedMenuSystem = new EnhancedMenuSystem();
    });
} else {
    window.enhancedMenuSystem = new EnhancedMenuSystem();
}
