/**
 * Système d'aide contextuelle pour la bibliothèque d'éléments
 * Style premium avec animations et effets visuels
 */
class LibraryHelpSystem {
    constructor() {
        this.isVisible = false;
        this.helpTooltip = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.addAnimationStyles();
    }

    addAnimationStyles() {
        if (document.querySelector('#library-help-premium-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'library-help-premium-styles';
        styles.textContent = `
            @keyframes materialEntrance {
                0% { 
                    opacity: 0; 
                    transform: translateY(-50%) translateX(100px) scale(0.8); 
                    filter: blur(10px); 
                }
                60% { 
                    transform: translateY(-50%) translateX(-10px) scale(1.02); 
                }
                100% { 
                    opacity: 1; 
                    transform: translateY(-50%) translateX(0) scale(1); 
                    filter: blur(0px); 
                }
            }

            @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                33% { transform: translateY(-2px) rotate(1deg); }
                66% { transform: translateY(1px) rotate(-1deg); }
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); box-shadow: 0 4px 15px rgba(255, 193, 7, 0.4); }
                50% { transform: scale(1.1); box-shadow: 0 6px 20px rgba(255, 193, 7, 0.6); }
            }

            @keyframes pulse-highlight {
                0%, 100% { 
                    box-shadow: 
                        0 0 0 2px rgba(255, 255, 255, 0.8),
                        0 0 20px var(--highlight-color, #43a047)40,
                        inset 0 0 20px var(--highlight-color, #43a047)10;
                }
                50% { 
                    box-shadow: 
                        0 0 0 4px rgba(255, 255, 255, 1),
                        0 0 30px var(--highlight-color, #43a047)60,
                        inset 0 0 30px var(--highlight-color, #43a047)15;
                }
            }

            @keyframes sparkle {
                0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
                50% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }

            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            @keyframes glow {
                0%, 100% { opacity: 0.1; transform: scale(1); }
                50% { opacity: 0.3; transform: scale(1.1); }
            }

            @keyframes bounce {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-4px); }
            }

            @keyframes twinkle {
                0%, 100% { opacity: 0.8; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.2); }
            }

            @keyframes wave {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(200%); }
            }
        `;
        document.head.appendChild(styles);
    }

    setupEventListeners() {
    // Écouter les clics sur l'onglet Biblio
        const biblioTab = document.querySelector('[data-tab="biblio"]');
        if (biblioTab) {
            biblioTab.addEventListener('click', (e) => {
                // Attendre que l'onglet devienne réellement actif
                this.waitUntilBiblioActive(1500).then(() => this.showLibraryHelp());
            });
        }

    // Afficher automatiquement l'aide de l'onglet Biblio quand l'accueil se ferme
    window.addEventListener('startup-popup-closed', () => {
            // S'assurer que l'onglet Biblio est actif, sinon l'activer
            const activeMainTab = document.querySelector('.main-tab.active,[data-tab].active');
            const isBiblioActive = !!(activeMainTab && (
                activeMainTab.getAttribute('data-tab') === 'biblio' ||
                (activeMainTab.getAttribute('data-tab-name') || '').includes('biblio')
            ));

            // Si TabManager existe et que l'onglet actif n'est pas Biblio, basculer dessus
            if (!isBiblioActive) {
                if (window.TabManager && typeof window.TabManager.switchMainTab === 'function') {
                    try { window.TabManager.switchMainTab('biblio'); } catch (_) { /* no-op */ }
                } else {
                    const biblioBtn = document.querySelector('[data-tab="biblio"], [data-tab-name="biblio"]');
                    if (biblioBtn) biblioBtn.click();
                }
            }

        // Afficher l'aide contextuelle après activation effective de Biblio
            this.waitUntilBiblioActive(1500).then(() => {
                if (!this.isVisible) this.showLibraryHelp();
            });
        });

        // Écouter l'événement elementPlaced pour masquer l'aide quand une brique est posée
        document.addEventListener('elementPlaced', (event) => {
            if (this.isVisible) {
                this.forceHideHelp();
            }
        });

        // Fermer l'aide quand on change d'onglet de biblio (sous-onglets)
        this.setupSubTabListeners();

        // Fermer l'aide quand on change d'onglet principal (sortie de biblio)
        this.setupMainTabListeners();

        // Fermer avec Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hideHelp();
            }
        });
    }

    // Attendre activation effective de l'onglet Biblio
    waitUntilBiblioActive(maxWaitMs = 1200) {
        return new Promise((resolve) => {
            const start = Date.now();
            const check = () => {
                if (this.isBiblioTabActive()) return resolve(true);
                if (Date.now() - start >= maxWaitMs) return resolve(false);
                setTimeout(check, 50);
            };
            check();
        });
    }

    setupSubTabListeners() {
        // Écouter les changements dans les sous-onglets de bibliothèque
        const subTabs = document.querySelectorAll('[data-subtab]');
        subTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                if (this.isVisible) {
                    this.hideHelp();
                }
            });
        });

        // Observer les mutations DOM pour les sous-onglets ajoutés dynamiquement
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const newSubTabs = node.querySelectorAll('[data-subtab]');
                        newSubTabs.forEach(tab => {
                            tab.addEventListener('click', () => {
                                if (this.isVisible) {
                                    this.hideHelp();
                                }
                            });
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    setupMainTabListeners() {
        // Configuration des écouteurs de changement d'onglet pour bibliothèque
        
        // Écouter les clics sur tous les onglets principaux (sauf biblio)
        const mainTabs = document.querySelectorAll('[data-tab], .tab-item, .main-tab');
        // Onglets trouvés
        
        mainTabs.forEach(tab => {
            const tabId = tab.getAttribute('data-tab') || tab.getAttribute('data-tab-name') || tab.textContent;
            
            if (tabId && !tabId.includes('biblio') && !tabId.includes('bibliotheque')) {
                tab.addEventListener('click', () => {
                    if (this.isVisible) {
                        // Changement vers l'onglet, fermeture de l'aide bibliothèque
                        this.forceHideHelp();
                    }
                });
            }
        });
        
        // Écouteur global pour capturer TOUS les clics sur les onglets - avec capture immédiate
        document.addEventListener('click', (e) => {
            // Rechercher si le clic provient d'un onglet ou d'un élément d'onglet
            const tabElement = e.target.closest('[data-tab], .tab-item, .main-tab, .main-sub-tab, .sub-tab');
            
            if (tabElement && this.isVisible) {
                const tabId = tabElement.getAttribute('data-tab') || 
                             tabElement.getAttribute('data-main-subtab') ||
                             tabElement.getAttribute('data-subtab') ||
                             tabElement.getAttribute('data-tab-name') || 
                             tabElement.textContent?.trim();

                // Fermer immédiatement si ce n'est pas un onglet lié à biblio
                if (tabId && !tabId.includes('biblio') && !tabId.includes('bibliotheque')) {
                    this.forceHideHelp();
                }
            }
        }, true); // Utilisation de la phase de capture pour plus de rapidité
        
        // Écouteur spécialisé pour les changements d'onglets via TabManager
        if (window.TabManager) {
            // Intercepter les appels à switchMainTab
            const originalSwitchMainTab = window.TabManager.switchMainTab;
            if (originalSwitchMainTab) {
                window.TabManager.switchMainTab = (tabId) => {
                    // Si l'aide est visible et qu'on change vers un autre onglet, fermer immédiatement
                    if (this.isVisible && tabId !== 'biblio') {
                        this.forceHideHelp();
                    }
                    
                    // Appeler la méthode originale
                    const result = originalSwitchMainTab.call(window.TabManager, tabId);
                    
                    return result;
                };
            }
        }
        
        // Écouteurs configurés
    }

    showLibraryHelp() {
        // MODE AIDE CONTEXTUELLE
        
        // Ne pas afficher la fenêtre de guide complète, mais activer l'aide contextuelle légère
        if (this.isVisible) {
            return;
        }
        
    // Afficher uniquement l'aide contextuelle (cadres) sans la fenêtre de guide ni texte
        this.showContextualHelpOnly();
    }
    
    /**
     * Afficher uniquement l'aide contextuelle (cadres colorés) sans la fenêtre de guide
     */
    showContextualHelpOnly() {
        // Affichage cadres colorés bibliothèque uniquement
        
    // Marquer comme visible pour éviter les appels multiples
    this.isVisible = true;
    this._shownAt = Date.now();
        
    // Créer uniquement les cadres colorés visuels (pas de fenêtre de guide ni bulles)
        this.createVisualHighlights();
        
        // Auto-masquer après quelques secondes
        setTimeout(() => {
            this.hideHelp();
        }, 8000); // Plus long pour les cadres colorés
        
        // Vérification périodique que l'onglet biblio est toujours actif
        this.checkActiveTabInterval = setInterval(() => {
            if (!this.isVisible) return;
            // Petite période de grâce après l'affichage
            if (Date.now() - (this._shownAt || 0) < 600) return;
            if (!this.isBiblioTabActive()) {
                // Debounce: revalider après 250ms avant de fermer
                setTimeout(() => {
                    if (this.isVisible && !this.isBiblioTabActive()) this.hideHelp();
                }, 250);
            }
        }, 500); // Vérifier plus fréquemment avec debounce
    }
    
    /**
     * Vérifier si l'onglet bibliothèque est actuellement actif
     */
    isBiblioTabActive() {
        // Vérifier plusieurs sélecteurs possibles pour l'onglet bibliothèque
        const biblioSelectors = [
            '[data-tab="biblio"].active',
            '[data-tab="bibliotheque"].active',
            '[data-tab-name="biblio"].active',
            '[data-tab-name="bibliotheque"].active',
            '.tab-item.active[data-tab="biblio"]',
            '.main-tab.active[data-tab="biblio"]'
        ];
        
        for (const selector of biblioSelectors) {
            if (document.querySelector(selector)) {
                return true;
            }
        }
        
        // Vérifier aussi si le contenu biblio est visible
        const biblioContent = document.querySelector('#tab-content-biblio, #tab-content-bibliotheque');
        if (biblioContent && !biblioContent.classList.contains('hidden') && biblioContent.style.display !== 'none') {
            return true;
        }
        
        // Vérifier via le TabManager si disponible
        if (window.TabManager && window.TabManager.currentMainTab === 'biblio') {
            return true;
        }
        
        // Vérification finale: regarder tous les onglets actifs
        const activeTab = document.querySelector('.main-tab.active, [data-tab].active');
        if (activeTab) {
            const tabId = activeTab.getAttribute('data-tab') || activeTab.getAttribute('data-tab-name');
            if (tabId && (tabId.includes('biblio') || tabId.includes('bibliotheque'))) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Créer des surlignages légers pour l'aide contextuelle
     */
    createLightHighlights() {
        // Nettoyer les anciens surlignages
        // Désactivé: plus de bulles/explications pour Biblio
        this.removeVisualHighlights();
    }
    
    /**
     * Créer une bulle d'aide légère
     */
    createLightTooltip(element, title, description) {
        // Désactivé: pas d'infobulles
        return;
    }
    
    /**
     * Masquer l'aide contextuelle
     */
    hideHelp() {
        // Masquage de l'aide contextuelle bibliothèque
        
        this.isVisible = false;
        
        // Supprimer l'intervalle de vérification
        if (this.checkActiveTabInterval) {
            clearInterval(this.checkActiveTabInterval);
            this.checkActiveTabInterval = null;
        }
        
        // Nettoyage exhaustif de tous les éléments d'aide
        this.forceCleanupAllHelpElements();
        
    }
    
    /**
     * Nettoyage forcé et exhaustif de tous les éléments d'aide
     */
    forceCleanupAllHelpElements() {
        
        // Supprimer les surlignages
        if (this.highlightsContainer) {
            this.highlightsContainer.remove();
            this.highlightsContainer = null;
        }
        
        // Supprimer tous les conteneurs d'aide avec différents IDs possibles
        const helpContainerIds = [
            'library-highlights-container',
            'library-contextual-highlights', 
            'library-help-tooltip',
            'library-help-container',
            'biblio-help-highlights'
        ];
        
        helpContainerIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.remove();
            }
        });
        
        // Supprimer tous les éléments avec des classes d'aide bibliothèque
        const helpClasses = [
            '.library-help-highlight',
            '.biblio-help-highlight',
            '.help-highlight',
            '.library-tooltip'
        ];
        
        helpClasses.forEach(className => {
            const elements = document.querySelectorAll(className);
            elements.forEach(el => {
                el.remove();
            });
        });
    // Supprimer les labels de biblio
    document.querySelectorAll('.biblio-help-label').forEach(el => el.remove());
        
        // Supprimer les écouteurs de scroll
        if (this.hideOnScrollHandler) {
            window.removeEventListener('scroll', this.hideOnScrollHandler);
            window.removeEventListener('wheel', this.hideOnScrollHandler);
            
            const biblioContent = document.querySelector('#tab-content-biblio');
            if (biblioContent) {
                biblioContent.removeEventListener('scroll', this.hideOnScrollHandler);
                biblioContent.removeEventListener('wheel', this.hideOnScrollHandler);
            }
            
            this.hideOnScrollHandler = null;
        }
        
        // Supprimer les styles d'animation temporaires
        const tempStyles = document.querySelector('#light-tooltip-styles');
        if (tempStyles) {
            tempStyles.remove();
        }
        
        const pulseStyles = document.querySelector('#pulse-animation-styles');
        if (pulseStyles) {
            pulseStyles.remove();
        }
        
        // Supprimer tous les styles temporaires liés à l'aide bibliothèque
        const stylesToRemove = [
            '#library-help-premium-styles',
            '#light-tooltip-styles', 
            '#pulse-animation-styles',
            '#biblio-help-styles'
        ];
        
        stylesToRemove.forEach(styleId => {
            const style = document.querySelector(styleId);
            if (style) {
                style.remove();
            }
        });
    }

    // Méthode pour forcer l'affichage (maintenant identique à showLibraryHelp)
    forceShowLibraryHelp() {
        
        // Rediriger vers la nouvelle méthode d'aide contextuelle
        this.showLibraryHelp();
    }
    
    /**
     * Méthode pour forcer le masquage immédiat de l'aide
     */
    forceHideHelp() {
        
        // Masquer immédiatement sans délai
        this.isVisible = false;
        
        // Nettoyer immédiatement tous les éléments
        this.forceCleanupAllHelpElements();
        
        // Arrêter tous les intervalles
        if (this.checkActiveTabInterval) {
            clearInterval(this.checkActiveTabInterval);
            this.checkActiveTabInterval = null;
        }
        
    }

    createVisualHighlights() {
        // Supprimer les anciens surlignages
        this.removeVisualHighlights();
    this.highlightCount = 0;
    this._highlightRetryCount = 0;
        
        // Créer le conteneur de surlignages
        this.highlightsContainer = document.createElement('div');
        this.highlightsContainer.id = 'library-highlights-container';
        this.highlightsContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9998;
        `;
        document.body.appendChild(this.highlightsContainer);

        // Ajouter un écouteur de scroll global pour cacher les cadres (grâce initiale)
        this.hideOnScrollHandler = () => {
            if (Date.now() - (this._shownAt || 0) < 600) return;
            this.hideHelp();
        };
        
        // Scroll immédiat sans débounce (exactement comme les outils)
        window.addEventListener('scroll', this.hideOnScrollHandler, { passive: true });
        window.addEventListener('wheel', this.hideOnScrollHandler, { passive: true });
        
        // Aussi écouter le scroll sur le conteneur de l'onglet bibliothèque
        const biblioContent = document.querySelector('#tab-content-biblio');
        if (biblioContent) {
            biblioContent.addEventListener('scroll', this.hideOnScrollHandler, { passive: true });
            biblioContent.addEventListener('wheel', this.hideOnScrollHandler, { passive: true });
        }

        // Attendre un frame pour que le DOM soit mis à jour
        requestAnimationFrame(() => {
            this.createCategoryHighlights();
            this.createCutLengthHighlights();
            // Si rien surligné, retenter rapidement (DOM pas encore prêt)
            if (this.highlightCount === 0 && this._highlightRetryCount < 2) {
                this._highlightRetryCount++;
                setTimeout(() => {
                    if (!this.isVisible) return;
                    this.highlightsContainer.innerHTML = '';
                    this.highlightCount = 0;
                    this.createCategoryHighlights();
                    this.createCutLengthHighlights();
                }, 200);
            }
        });
    }

    createCategoryHighlights() {
        // Surligner les onglets de catégories (ajout Étanchéité)
        const categoryTabs = [
            { selector: '[data-subtab="briques"]', color: '#e53935' },
            { selector: '[data-subtab="blocs"]', color: '#1e88e5' },
            { selector: '[data-subtab="isolants"]', color: '#43a047' },
            { selector: '[data-subtab="linteaux"]', color: '#fb8c00' },
            { selector: '[data-subtab="outils"]', color: '#9c27b0' },
            { selector: '[data-subtab="planchers"]', color: '#795548' },
            { selector: '[data-subtab="poutres"]', color: '#607d8b' },
            { selector: '[data-subtab="etancheite"]', color: '#00695c' }
        ];

        // Détecter quels onglets sont sur la deuxième ligne
        const firstElementRect = document.querySelector('[data-subtab="briques"]')?.getBoundingClientRect();
        
    categoryTabs.forEach((tab, index) => {
            const element = document.querySelector(tab.selector);
            if (element && firstElementRect) {
                const elementRect = element.getBoundingClientRect();
                // Si l'onglet est significativement plus bas que le premier onglet, il est sur la deuxième ligne
                const isSecondRow = elementRect.top > firstElementRect.top + 20;
                
                this.createHighlightBox(element, {
            // Afficher un libellé simple sur le premier élément
            label: index === 0 ? 'Catégories' : '',
                    color: tab.color,
                    position: isSecondRow ? 'bottom' : 'top',
                    delay: isSecondRow ? index * 0.2 + 0.5 : index * 0.2  // Délai supplémentaire pour la 2e ligne
                });
            }
        });
    }

    createCutLengthHighlights() {
        // Surligner la zone des longueurs de coupe - cibler directement le conteneur cut-buttons
    const cutLengthContainer = document.querySelector('.cut-buttons');
    if (cutLengthContainer) {
            this.createHighlightBox(cutLengthContainer, {
        label: 'Coupes',
                color: '#7b1fa2',
                position: 'bottom',
                delay: 0.8
            });
            return;
        }

        // Fallback : chercher les autres conteneurs possibles
    const altContainer = document.querySelector('.cut-length-buttons, .length-selector, [class*="length"], [class*="coupe"]');
    if (altContainer) {
            this.createHighlightBox(altContainer, {
        label: 'Coupes',
                color: '#7b1fa2',
                position: 'bottom',
                delay: 0.8
            });
            return;
        }

        // Si aucun conteneur trouvé, chercher les boutons cut-btn-mini
        const cutButtons = document.querySelectorAll('.cut-btn-mini');
        if (cutButtons.length > 0) {
            // Calculer les dimensions englobantes des boutons cut-btn-mini
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            
            Array.from(cutButtons).forEach(button => {
                const rect = button.getBoundingClientRect();
                const style = window.getComputedStyle(button);
                if (rect.width > 0 && rect.height > 0 && 
                    style.display !== 'none' && 
                    style.visibility !== 'hidden') {
                    minX = Math.min(minX, rect.left);
                    minY = Math.min(minY, rect.top);
                    maxX = Math.max(maxX, rect.right);
                    maxY = Math.max(maxY, rect.bottom);
                }
            });
            
            if (minX !== Infinity) {
                // Créer un élément virtuel avec les dimensions des cut-btn-mini
                const virtualContainer = {
                    getBoundingClientRect: () => ({
                        left: minX - 4,
                        top: minY - 4,
                        right: maxX + 4,
                        bottom: maxY + 4,
                        width: (maxX - minX) + 8,
                        height: (maxY - minY) + 8
                    })
                };
                
                this.createHighlightBox(virtualContainer, {
                    label: 'Coupes',
                    color: '#7b1fa2',
                    position: 'bottom',
                    delay: 0.8
                });
            }
        }
    }

    createHighlightBox(element, options = {}) {
        if (!element || !this.highlightsContainer) return;

        const rect = element.getBoundingClientRect();
        const {
            label = '',
            color = '#43a047',
            position = 'top',
            delay = 0,
            small = false
        } = options;

        // Créer la boîte de surlignage
        const highlight = document.createElement('div');
        highlight.className = 'library-highlight-box';
        
        const padding = small ? 8 : 12;
        const borderRadius = small ? 8 : 12;
        
        highlight.style.cssText = `
            position: absolute;
            left: ${rect.left - padding}px;
            top: ${rect.top - padding}px;
            width: ${rect.width + (padding * 2)}px;
            height: ${rect.height + (padding * 2)}px;
            border: 3px solid ${color};
            border-radius: ${borderRadius}px;
            background: ${color}15;
            box-shadow: 
                0 0 0 2px rgba(255, 255, 255, 0.8),
                0 0 20px ${color}40,
                inset 0 0 20px ${color}10;
            opacity: 0;
            transform: scale(0.8);
            transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            animation: pulse-highlight 2s ease-in-out infinite;
            pointer-events: none;
        `;

        // Ajouter le label si fourni (positionné à gauche de la barre latérale droite)
        if (label) {
            const labelElement = document.createElement('div');
            const sidebar = document.querySelector('aside.sidebar');
            const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : null;
            const labelLeft = (sidebarRect ? sidebarRect.left : rect.left) - 12; // 12px à gauche
            const labelTop = rect.top + rect.height / 2;
            labelElement.style.cssText = `
                position: fixed;
                left: ${labelLeft}px;
                top: ${labelTop}px;
                transform: translate(-100%, -50%);
                background: linear-gradient(135deg, ${color}, ${color}dd);
                color: white;
                padding: 6px 12px;
                border-radius: 14px;
                font-size: 12px;
                font-weight: 700;
                white-space: nowrap;
                box-shadow: 0 4px 15px ${color}40;
                border: 2px solid rgba(255, 255, 255, 0.3);
                backdrop-filter: blur(10px);
                z-index: 10000;
                pointer-events: none;
            `;
            labelElement.textContent = label;
            labelElement.className = 'biblio-help-label';
            this.highlightsContainer.appendChild(labelElement);
        }

    this.highlightsContainer.appendChild(highlight);
    this.highlightCount = (this.highlightCount || 0) + 1;

        // Animer l'apparition avec délai
        setTimeout(() => {
            highlight.style.opacity = '1';
            highlight.style.transform = 'scale(1)';
        }, delay * 1000);
    }

    removeVisualHighlights() {
        if (this.highlightsContainer) {
            this.highlightsContainer.remove();
            this.highlightsContainer = null;
        }
        
        // Supprimer tous les anciens surlignages
        document.querySelectorAll('.library-highlight-box').forEach(el => el.remove());
        document.querySelectorAll('#library-highlights-container').forEach(el => el.remove());
    }

    createPremiumTooltip() {
        // Supprimer le tooltip existant
        if (this.helpTooltip) {
            this.helpTooltip.remove();
        }

        const tooltip = document.createElement('div');
        tooltip.innerHTML = `
            <div id="library-help-inner" style="position: absolute; top: 150px !important; right: 500px !important; width: 380px; background: linear-gradient(145deg, #ffffff 0%, #f0fff4 50%, #fefff8 100%); color: #1a4731; border: 3px solid transparent; background-clip: padding-box; border-radius: 20px; box-shadow: 0 25px 80px rgba(67, 160, 71, 0.25), 0 15px 35px rgba(255, 235, 59, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8); z-index: 99999 !important; font-family: 'Segoe UI', 'Apple Color Emoji', Tahoma, Geneva, Verdana, sans-serif; backdrop-filter: blur(15px); overflow: hidden;">
                        
                        <!-- En-tête avec dégradé premium -->
                        <div style="background: linear-gradient(135deg, #2e7d32 0%, #43a047 35%, #66bb6a 70%, #81c784 100%); padding: 22px 28px; border-radius: 17px 17px 0 0; display: flex; justify-content: space-between; align-items: center; position: relative; overflow: hidden;">
                            <!-- Particules flottantes -->
                            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 25% 25%, rgba(255, 235, 59, 0.15) 2px, transparent 2px), radial-gradient(circle at 75% 75%, rgba(129, 199, 132, 0.15) 2px, transparent 2px); background-size: 30px 30px; opacity: 0.6; animation: float 6s ease-in-out infinite;"></div>
                            
                            <div style="display: flex; align-items: center; gap: 15px; font-weight: 800; font-size: 18px; color: white; z-index: 2; position: relative;">
                                <div style="background: linear-gradient(135deg, #fff59d 0%, #ffeb3b 50%, #ffc107 100%); padding: 12px; border-radius: 50%; backdrop-filter: blur(10px); box-shadow: 0 4px 15px rgba(255, 193, 7, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3); position: relative; animation: pulse 2s ease-in-out infinite;">
                                    <i class="fas fa-book" style="font-size: 18px; color: #1a4731; text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);"></i>
                                    <!-- Éclat rotatif -->
                                    <div style="position: absolute; top: 50%; left: 50%; width: 6px; height: 6px; background: radial-gradient(circle, #ffffff 0%, transparent 70%); transform: translate(-50%, -50%); border-radius: 50%; animation: sparkle 1.5s ease-in-out infinite;"></div>
                                </div>
                                <span style="text-shadow: 0 2px 4px rgba(0,0,0,0.3); background: linear-gradient(45deg, #ffffff, #e8f5e8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Guide Bibliothèque</span>
                            </div>
                            
                            <button class="close-help-btn" style="background: linear-gradient(135deg, rgba(255,235,59,0.4), rgba(255,193,7,0.6)); border: 2px solid rgba(255,255,255,0.3); color: white; font-size: 18px; cursor: pointer; padding: 10px; border-radius: 50%; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); backdrop-filter: blur(10px); z-index: 2; position: relative; box-shadow: 0 4px 12px rgba(255, 193, 7, 0.2);" onmouseover="this.style.transform='scale(1.1) rotate(90deg)'; this.style.background='linear-gradient(135deg, rgba(255,235,59,0.7), rgba(255,193,7,0.9))'" onmouseout="this.style.transform='scale(1) rotate(0deg)'; this.style.background='linear-gradient(135deg, rgba(255,235,59,0.4), rgba(255,193,7,0.6))'">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <!-- Corps avec effet glass morphism -->
                        <div style="padding: 28px; background: linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(240,255,244,0.9)); border-radius: 0 0 17px 17px; position: relative;">
                            <!-- Motif décoratif -->
                            <div style="position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #43a047, #ffeb3b, #43a047, transparent); opacity: 0.6;"></div>
                            
                            <h4 style="color: #2e7d32; margin-bottom: 22px; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; display: flex; align-items: center; gap: 12px; text-shadow: 0 1px 2px rgba(67, 160, 71, 0.1);">
                                <div style="width: 6px; height: 22px; background: linear-gradient(to bottom, #ffeb3b, #43a047, #66bb6a); border-radius: 3px; box-shadow: 0 2px 6px rgba(67, 160, 71, 0.3); position: relative;">
                                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.6) 50%, transparent 70%); animation: shimmer 2s ease-in-out infinite;"></div>
                                </div>
                                ✨ Guide d'utilisation premium
                            </h4>
                            
                            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240,255,244,0.8), rgba(255,255,255,0.9)); padding: 20px 22px; margin: 16px 0; border-radius: 16px; border: 2px solid rgba(67, 160, 71, 0.1); box-shadow: 0 8px 25px rgba(67, 160, 71, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8); font-size: 14px; line-height: 1.7; color: #1a4731; position: relative; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); overflow: hidden;" onmouseover="this.style.transform='translateY(-4px) scale(1.02)'; this.style.boxShadow='0 15px 40px rgba(67, 160, 71, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)'; this.style.borderColor='rgba(255, 235, 59, 0.3)'" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 8px 25px rgba(67, 160, 71, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)'; this.style.borderColor='rgba(67, 160, 71, 0.1)'">
                                <!-- Bordure animée -->
                                <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: linear-gradient(to bottom, #ffeb3b 0%, #43a047 50%, #66bb6a 100%); border-radius: 0 8px 8px 0; box-shadow: 2px 0 8px rgba(67, 160, 71, 0.2);"></div>
                                <!-- Éclat de fond -->
                                <div style="position: absolute; top: -50%; right: -20%; width: 100px; height: 100px; background: radial-gradient(circle, rgba(255, 235, 59, 0.1) 0%, transparent 70%); border-radius: 50%; animation: glow 3s ease-in-out infinite;"></div>
                                
                                <div style="display: flex; align-items: flex-start; gap: 16px; position: relative; z-index: 1;">
                                    <div style="background: linear-gradient(135deg, #fff59d 0%, #ffeb3b 50%, #ffc107 100%); color: #1a4731; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; flex-shrink: 0; box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4); border: 2px solid rgba(255, 255, 255, 0.6); position: relative; animation: bounce 2s ease-in-out infinite 0s;">
                                        1
                                        <!-- Effet de brillance -->
                                        <div style="position: absolute; top: 2px; left: 2px; width: 8px; height: 8px; background: rgba(255, 255, 255, 0.8); border-radius: 50%; animation: twinkle 1.5s ease-in-out infinite;"></div>
                                    </div>
                                    <div style="flex: 1; font-weight: 500;">📚 <strong>8 catégories d'éléments :</strong> Briques (base), Blocs (rapide), Isolants (isolation), Linteaux (renforcement), Outils (construction), Planchers (dalles), Poutres (structure), Étanchéité (membranes)</div>
                                </div>
                            </div>
                            
                            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240,255,244,0.8), rgba(255,255,255,0.9)); padding: 20px 22px; margin: 16px 0; border-radius: 16px; border: 2px solid rgba(67, 160, 71, 0.1); box-shadow: 0 8px 25px rgba(67, 160, 71, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8); font-size: 14px; line-height: 1.7; color: #1a4731; position: relative; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); overflow: hidden;" onmouseover="this.style.transform='translateY(-4px) scale(1.02)'; this.style.boxShadow='0 15px 40px rgba(67, 160, 71, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)'; this.style.borderColor='rgba(255, 235, 59, 0.3)'" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 8px 25px rgba(67, 160, 71, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)'; this.style.borderColor='rgba(67, 160, 71, 0.1)'">
                                <!-- Bordure animée -->
                                <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: linear-gradient(to bottom, #ffeb3b 0%, #43a047 50%, #66bb6a 100%); border-radius: 0 8px 8px 0; box-shadow: 2px 0 8px rgba(67, 160, 71, 0.2);"></div>
                                <!-- Éclat de fond -->
                                <div style="position: absolute; top: -50%; right: -20%; width: 100px; height: 100px; background: radial-gradient(circle, rgba(255, 235, 59, 0.1) 0%, transparent 70%); border-radius: 50%; animation: glow 3s ease-in-out infinite;"></div>
                                
                                <div style="display: flex; align-items: flex-start; gap: 16px; position: relative; z-index: 1;">
                                    <div style="background: linear-gradient(135deg, #fff59d 0%, #ffeb3b 50%, #ffc107 100%); color: #1a4731; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; flex-shrink: 0; box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4); border: 2px solid rgba(255, 255, 255, 0.6); position: relative; animation: bounce 2s ease-in-out infinite 0.2s;">
                                        2
                                        <!-- Effet de brillance -->
                                        <div style="position: absolute; top: 2px; left: 2px; width: 8px; height: 8px; background: rgba(255, 255, 255, 0.8); border-radius: 50%; animation: twinkle 1.5s ease-in-out infinite;"></div>
                                    </div>
                                    <div style="flex: 1; font-weight: 500;">✂️ <strong>Longueurs de coupes :</strong> 1/1 (entier), 3/4 (75%), 1/2 (50%), 1/4 (25%), P (sur mesure)</div>
                                </div>
                            </div>
                            
                            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240,255,244,0.8), rgba(255,255,255,0.9)); padding: 20px 22px; margin: 16px 0; border-radius: 16px; border: 2px solid rgba(67, 160, 71, 0.1); box-shadow: 0 8px 25px rgba(67, 160, 71, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8); font-size: 14px; line-height: 1.7; color: #1a4731; position: relative; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); overflow: hidden;" onmouseover="this.style.transform='translateY(-4px) scale(1.02)'; this.style.boxShadow='0 15px 40px rgba(67, 160, 71, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)'; this.style.borderColor='rgba(255, 235, 59, 0.3)'" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 8px 25px rgba(67, 160, 71, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)'; this.style.borderColor='rgba(67, 160, 71, 0.1)'">
                                <!-- Bordure animée -->
                                <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: linear-gradient(to bottom, #ffeb3b 0%, #43a047 50%, #66bb6a 100%); border-radius: 0 8px 8px 0; box-shadow: 2px 0 8px rgba(67, 160, 71, 0.2);"></div>
                                <!-- Éclat de fond -->
                                <div style="position: absolute; top: -50%; right: -20%; width: 100px; height: 100px; background: radial-gradient(circle, rgba(255, 235, 59, 0.1) 0%, transparent 70%); border-radius: 50%; animation: glow 3s ease-in-out infinite;"></div>
                                
                                <div style="display: flex; align-items: flex-start; gap: 16px; position: relative; z-index: 1;">
                                    <div style="background: linear-gradient(135deg, #fff59d 0%, #ffeb3b 50%, #ffc107 100%); color: #1a4731; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; flex-shrink: 0; box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4); border: 2px solid rgba(255, 255, 255, 0.6); position: relative; animation: bounce 2s ease-in-out infinite 0.4s;">
                                        3
                                        <!-- Effet de brillance -->
                                        <div style="position: absolute; top: 2px; left: 2px; width: 8px; height: 8px; background: rgba(255, 255, 255, 0.8); border-radius: 50%; animation: twinkle 1.5s ease-in-out infinite;"></div>
                                    </div>
                                    <div style="flex: 1; font-weight: 500;">🎯 <strong>Utilisation :</strong> Catégorie → Élément → Coupe → Placement en zone 3D</div>
                                </div>
                            </div>
                            
                            <div style="text-align: center; padding-top: 24px; border-top: 2px solid rgba(67, 160, 71, 0.1); margin-top: 20px; position: relative;">
                                <!-- Décoration du bouton -->
                                <div style="position: absolute; top: -1px; left: 50%; transform: translateX(-50%); width: 60px; height: 2px; background: linear-gradient(90deg, transparent, #ffeb3b, transparent);"></div>
                                
                                <button class="confirm-help-btn" style="background: linear-gradient(135deg, #2e7d32 0%, #43a047 35%, #66bb6a 70%, #81c784 100%); color: white; border: 3px solid rgba(255, 235, 59, 0.4); padding: 16px 35px; border-radius: 50px; font-weight: 700; cursor: pointer; font-size: 15px; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); box-shadow: 0 8px 25px rgba(67, 160, 71, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2); letter-spacing: 0.8px; text-transform: uppercase; position: relative; overflow: hidden;" onmouseover="this.style.transform='translateY(-3px) scale(1.05)'; this.style.boxShadow='0 15px 40px rgba(67, 160, 71, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'; this.style.borderColor='rgba(255, 235, 59, 0.8)'" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 8px 25px rgba(67, 160, 71, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'; this.style.borderColor='rgba(255, 235, 59, 0.4)'">
                                    <!-- Effet de vague -->
                                    <div style="position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent); animation: wave 2s ease-in-out infinite;"></div>
                                    <i class="fas fa-check-circle" style="margin-right: 10px; color: #ffeb3b; font-size: 16px; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);"></i>
                                    <span style="position: relative; z-index: 1;">Parfait, j'ai tout compris !</span>
                                </button>
                            </div>
                        </div>
                    </div>
        `;

        document.body.appendChild(tooltip);
        this.helpTooltip = tooltip;

        // Forcer la position après ajout au DOM
        setTimeout(() => {
            const helpElements = document.querySelectorAll('[id^="library-help"]');
            helpElements.forEach(el => {
                el.style.position = 'fixed';
                el.style.top = '150px';
                el.style.right = '500px';
                el.style.left = 'auto';
                el.style.transform = 'none';
                el.style.zIndex = '99999';
            });
        }, 100);

        // Ajouter les écouteurs d'événements
        const closeBtn = tooltip.querySelector('.close-help-btn');
        const confirmBtn = tooltip.querySelector('.confirm-help-btn');

        closeBtn.addEventListener('click', () => this.hideHelp());
        confirmBtn.addEventListener('click', () => {
            // Marquer l'aide comme complétée dans localStorage
            localStorage.setItem('walSim3D_libraryHelpCompleted', 'true');
            this.hideHelp();
        });

        // Auto-fermer après 20 secondes
        setTimeout(() => {
            if (this.isVisible) {
                this.hideHelp();
            }
        }, 20000);
    }

}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    window.LibraryHelpSystem = new LibraryHelpSystem();
});
