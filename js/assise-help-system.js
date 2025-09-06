/**
 * Système d'aide contextuelle pour l'onglet Assise
 * Affiche des cadres (highlights) + bulles légères (texte), même style que Biblio
 */
class AssiseHelpSystem {
    constructor() {
        this.isVisible = false;
        this.highlightsContainer = null;
        this.checkActiveTabInterval = null;
        this.init();
    }

    init() {
        this.ensureAnimationsStyles();
        this.setupEventListeners();
    }

    ensureAnimationsStyles() {
        // Réutilise les animations si déjà injectées par la bibliothèque, sinon ajoute un set minimal
        const pulseExists = document.querySelector('#library-help-premium-styles');
        if (!pulseExists && !document.querySelector('#assise-help-anim-styles')) {
            const styles = document.createElement('style');
            styles.id = 'assise-help-anim-styles';
            styles.textContent = `
                @keyframes pulse-highlight { 0%,100%{ box-shadow: 0 0 0 2px rgba(255,255,255,0.8), 0 0 20px var(--highlight-color, #1e88e5)40, inset 0 0 20px var(--highlight-color, #1e88e5)10; } 50% { box-shadow: 0 0 0 4px rgba(255,255,255,1), 0 0 30px var(--highlight-color, #1e88e5)60, inset 0 0 30px var(--highlight-color, #1e88e5)15; } }
                @keyframes fadeInTooltip { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulseIndicator { 0% { opacity:.7; transform: scale(1);} 50% { opacity:1; transform: scale(1.02);} 100% { opacity:.7; transform: scale(1);} }
            `;
            document.head.appendChild(styles);
        }
    }

    setupEventListeners() {
        // Sur clic de l'onglet Assise, afficher l'aide
        const assiseTab = document.querySelector('[data-tab="assise"]');
        if (assiseTab) {
            assiseTab.addEventListener('click', () => {
                // Attendre activation + disponibilités des éléments
                this.waitUntilAssiseActive(1500)
                    .then((active) => active ? this.waitForAssiseTargetsReady(2500) : false)
                    .then((ready) => { if (ready !== false) this.showAssiseHelp(); });
            });
        }

        // Au démarrage, si l'onglet Assise est actif au moment de la fermeture de l'accueil, afficher l'aide
        window.addEventListener('startup-popup-closed', () => {
            this.waitUntilAssiseActive(1500)
                .then((active) => active ? this.waitForAssiseTargetsReady(2500) : false)
                .then((ready) => { if (ready !== false) this.showAssiseHelp(); });
        });

        // Fermer avec Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hideHelp();
            }
        });

        // Si on change d'onglet principal, fermer
        document.addEventListener('click', (e) => {
            const tabEl = e.target.closest('[data-tab], .main-tab, .tab-item');
            if (tabEl && this.isVisible) {
                const id = tabEl.getAttribute('data-tab') || tabEl.getAttribute('data-tab-name') || tabEl.textContent?.trim() || '';
                if (!id.includes('assise')) {
                    this.forceHideHelp();
                }
            }
        }, true);
    }

    isAssiseTabActive() {
        if (document.querySelector('[data-tab="assise"].active')) return true;
        const content = document.getElementById('tab-content-assise');
        if (content && !content.classList.contains('hidden') && content.style.display !== 'none') return true;
        if (window.TabManager && window.TabManager.currentMainTab === 'assise') return true;
        return false;
    }

    // Attendre que l'onglet Assise devienne actif/visible (polling court)
    waitUntilAssiseActive(maxWaitMs = 1000) {
        return new Promise((resolve) => {
            const start = Date.now();
            const check = () => {
                if (this.isAssiseTabActive()) return resolve(true);
                if (Date.now() - start >= maxWaitMs) return resolve(false);
                setTimeout(check, 50);
            };
            check();
        });
    }

    // Attendre que des cibles clés de l'onglet soient présentes et mesurables
    waitForAssiseTargetsReady(maxWaitMs = 1500) {
        const selectors = ['#addAssise', '#removeAssise', '#copyAssiseBtn', '#globalAssiseList'];
        return new Promise((resolve) => {
            const start = Date.now();
            const ok = () => {
                for (const sel of selectors) {
                    const el = document.querySelector(sel);
                    if (el) {
                        const r = el.getBoundingClientRect();
                        if (r && r.width > 0 && r.height > 0) return true;
                    }
                }
                return false;
            };
            const check = () => {
                if (ok()) return resolve(true);
                if (Date.now() - start >= maxWaitMs) return resolve(true); // ne pas bloquer indéfiniment
                setTimeout(check, 75);
            };
            check();
        });
    }

    showAssiseHelp() {
        if (this.isVisible || !this.isAssiseTabActive()) return;
        this.isVisible = true;
    this._shownAt = Date.now();

    // Afficher uniquement les cadres visuels (pas de bulles/texte)
    this.highlightCount = 0;
    this.createVisualHighlights();

        // Auto-hide
        setTimeout(() => this.hideHelp(), 8000);

        // Fermer si l'onglet n'est plus actif
        this.checkActiveTabInterval = setInterval(() => {
            if (!this.isVisible) return;
            if (Date.now() - (this._shownAt || 0) < 600) return; // période de grâce
            if (!this.isAssiseTabActive()) {
                setTimeout(() => {
                    if (this.isVisible && !this.isAssiseTabActive()) this.hideHelp();
                }, 250);
            }
        }, 500);
    }

    hideHelp() {
        this.isVisible = false;
        if (this.checkActiveTabInterval) {
            clearInterval(this.checkActiveTabInterval);
            this.checkActiveTabInterval = null;
        }
        this.forceCleanupAllHelpElements();
    }

    forceHideHelp() {
        this.isVisible = false;
        if (this.checkActiveTabInterval) {
            clearInterval(this.checkActiveTabInterval);
            this.checkActiveTabInterval = null;
        }
        this.forceCleanupAllHelpElements();
    }

    forceCleanupAllHelpElements() {
    if (this.highlightsContainer) {
            this.highlightsContainer.remove();
            this.highlightsContainer = null;
        }
    document.querySelectorAll('.assise-highlight-box, .light-help-tooltip, .assise-help-label').forEach(el => el.remove());
        // Retirer scroll handlers
        if (this.hideOnScrollHandler) {
            window.removeEventListener('scroll', this.hideOnScrollHandler);
            window.removeEventListener('wheel', this.hideOnScrollHandler);
            const panel = document.getElementById('tab-content-assise');
            if (panel) {
                panel.removeEventListener('scroll', this.hideOnScrollHandler);
                panel.removeEventListener('wheel', this.hideOnScrollHandler);
            }
            this.hideOnScrollHandler = null;
        }
    }

    // Suppression des bulles: l'aide Assise n'affiche que des cadres, pas d'explications

    createVisualHighlights() {
    // Créer/renouveler le conteneur d'affichage des cadres
        if (this.highlightsContainer) {
            this.highlightsContainer.remove();
        }
        this.highlightsContainer = document.createElement('div');
        this.highlightsContainer.id = 'assise-highlights-container';
        this.highlightsContainer.style.cssText = 'position: fixed; inset: 0; pointer-events: none; z-index: 9998;';
        document.body.appendChild(this.highlightsContainer);

        // Scroll => hide
        this.hideOnScrollHandler = () => {
            if (Date.now() - (this._shownAt || 0) < 600) return;
            this.hideHelp();
        };
        window.addEventListener('scroll', this.hideOnScrollHandler, { passive: true });
        window.addEventListener('wheel', this.hideOnScrollHandler, { passive: true });
        const panel = document.getElementById('tab-content-assise');
        if (panel) {
            panel.addEventListener('scroll', this.hideOnScrollHandler, { passive: true });
            panel.addEventListener('wheel', this.hideOnScrollHandler, { passive: true });
        }

        // Après mise à jour layout
        requestAnimationFrame(() => {
            this.highlightButtonGroup();
            this.highlightJointControls();
            this.highlightTypeSection();
            this.highlightGlobalList();

            // Si aucun cadre n'a pu être créé (éléments pas encore prêts), retenter brièvement
            if (this.highlightCount === 0) {
                let tries = 0;
                const retry = () => {
                    if (!this.isVisible || tries >= 3 || this.highlightCount > 0) return;
                    tries++;
                    setTimeout(() => {
                        if (!this.isVisible || this.highlightCount > 0) return;
                        this.highlightsContainer.innerHTML = '';
                        this.highlightButtonGroup();
                        this.highlightJointControls();
                        this.highlightTypeSection();
                        this.highlightGlobalList();
                        retry();
                    }, 220);
                };
                retry();
            }
        });
    }

    createHighlightBox(target, { label = '', color = '#1e88e5', position = 'top', delay = 0, small = false, labelOverrideTop = null } = {}) {
        if (!this.highlightsContainer || !target) return;
        const rect = target.getBoundingClientRect();
        if (!rect || rect.width <= 0 || rect.height <= 0) return;

        const padding = small ? 8 : 12;
        const radius = small ? 8 : 12;
        const box = document.createElement('div');
        box.className = 'assise-highlight-box';
        box.style.cssText = `
            position: fixed;
            left: ${rect.left - padding}px;
            top: ${rect.top - padding}px;
            width: ${rect.width + padding * 2}px;
            height: ${rect.height + padding * 2}px;
            border: 3px solid ${color};
            border-radius: ${radius}px;
            background: ${color}15;
            box-shadow: 0 0 0 2px rgba(255,255,255,0.8), 0 0 20px ${color}40, inset 0 0 20px ${color}10;
            opacity: 0; transform: scale(0.9);
            transition: all .45s cubic-bezier(.25,.46,.45,.94);
            animation: pulse-highlight 2s ease-in-out infinite;
            pointer-events: none;
            z-index: 9999;
        `;
        if (label) {
            const labelEl = document.createElement('div');
            const sidebar = document.querySelector('aside.sidebar');
            const srect = sidebar ? sidebar.getBoundingClientRect() : null;
            const left = (srect ? srect.left : rect.left) - 12;
            const top = labelOverrideTop != null ? labelOverrideTop : (rect.top + rect.height / 2);
            labelEl.style.cssText = `
                position: fixed; left: ${left}px; top: ${top}px; transform: translate(-100%, -50%);
                background: ${color}; color: #fff; padding: 4px 10px; border-radius: 12px;
                font-size: 11px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 8px ${color}55; pointer-events: none; z-index: 10000;
            `;
            labelEl.className = 'assise-help-label';
            labelEl.textContent = label;
            this.highlightsContainer.appendChild(labelEl);
        }

    this.highlightsContainer.appendChild(box);
    this.highlightCount = (this.highlightCount || 0) + 1;
        setTimeout(() => { box.style.opacity = '1'; box.style.transform = 'scale(1)'; }, delay * 1000);
    }

    highlightButtonGroup() {
        const add = document.getElementById('addAssise');
        const rem = document.getElementById('removeAssise');
        const copy = document.getElementById('copyAssiseBtn');
        // Empilement vertical des labels pour éviter la superposition
        const rects = [add, rem, copy].filter(Boolean).map(el => el.getBoundingClientRect());
        let baseTop = null;
        if (rects.length) {
            const minTop = Math.min(...rects.map(r => r.top));
            const maxBottom = Math.max(...rects.map(r => r.bottom));
            baseTop = (minTop + maxBottom) / 2 - 18; // point de départ
        }
        const spacing = 22;
        if (add) this.createHighlightBox(add, { label: 'Ajouter', color: '#43a047', position: 'top', delay: 0.1, labelOverrideTop: baseTop != null ? baseTop : undefined });
        if (rem) this.createHighlightBox(rem, { label: 'Supprimer', color: '#e53935', position: 'top', delay: 0.25, labelOverrideTop: baseTop != null ? (baseTop + spacing) : undefined });
        if (copy) this.createHighlightBox(copy, { label: 'Copier', color: '#1e88e5', position: 'top', delay: 0.4, labelOverrideTop: baseTop != null ? (baseTop + spacing * 2) : undefined });
    }

    highlightJointControls() {
        const height = document.getElementById('jointHeight');
    if (height) this.createHighlightBox(height, { label: 'Hauteur joint', color: '#fb8c00', position: 'bottom', delay: 0.6 });
        const grid = document.getElementById('toggleAssiseGrids');
    if (grid) this.createHighlightBox(grid, { label: 'Grilles', color: '#8e24aa', position: 'bottom', delay: 0.75, small: true });
        const marks = document.getElementById('toggleAttachmentMarkers');
    if (marks) this.createHighlightBox(marks, { label: 'Points', color: '#6d4c41', position: 'bottom', delay: 0.9, small: true });
    }

    highlightTypeSection() {
        const indicator = document.getElementById('brickTypeIndicator') || document.getElementById('currentTypeBadgeGlobal');
    if (indicator) this.createHighlightBox(indicator, { label: 'Type', color: '#3949ab', position: 'bottom', delay: 1.1 });
        const info = document.getElementById('currentTypeInfo') || document.getElementById('currentTypeDescriptionGlobal');
    if (info) this.createHighlightBox(info, { label: 'Infos', color: '#00acc1', position: 'top', delay: 1.25 });
    }

    highlightGlobalList() {
        // Cibler exactement l'élément spécifié par l'utilisateur
        const list = document.querySelector('.assise-global-list');
        
        if (list) {
            // DEBUG supprimé
            
            // Cibler directement sans ajustements pour un centrage naturel
            this.createHighlightBox(list, { 
                label: 'Liste', 
                color: '#7cb342', 
                position: 'top', 
                delay: 1.45
            });
        } else {
            // DEBUG supprimé
        }
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.AssiseHelpSystem = new AssiseHelpSystem();
});
