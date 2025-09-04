/**
 * Aide contextuelle (cadres uniquement) pour l'onglet Mode opératoire
 */
class ModeOperatoireHelpSystem {
    constructor() {
        this.isVisible = false;
        this.highlightsContainer = null;
        this.checkActiveTabInterval = null;
        this.init();
    }

    init() {
        this.ensureAnimationStyles();
        this.setupEventListeners();
    }

    ensureAnimationStyles() {
        // Réutilise les styles de Library si présents, sinon ajoute un minimum
        if (!document.querySelector('#library-help-premium-styles') && !document.querySelector('#modeop-help-anim-styles')) {
            const styles = document.createElement('style');
            styles.id = 'modeop-help-anim-styles';
            styles.textContent = `
                @keyframes pulse-highlight { 0%,100%{ box-shadow: 0 0 0 2px rgba(255,255,255,0.8), 0 0 20px var(--highlight-color, #2e7d32)40, inset 0 0 20px var(--highlight-color, #2e7d32)10; } 50% { box-shadow: 0 0 0 4px rgba(255,255,255,1), 0 0 30px var(--highlight-color, #2e7d32)60, inset 0 0 30px var(--highlight-color, #2e7d32)15; } }
            `;
            document.head.appendChild(styles);
        }
    }

    setupEventListeners() {
        // Clic sur l'onglet Mode opératoire
        const tab = document.querySelector('[data-tab="mode-operatoire"]');
        if (tab) {
            tab.addEventListener('click', () => setTimeout(() => this.showHelp(), 300));
        }

        // Après fermeture de l'accueil: afficher si l'onglet est actif
        window.addEventListener('startup-popup-closed', () => {
            setTimeout(() => { if (this.isTabActive()) this.showHelp(); }, 300);
        });

        // Echap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) this.hideHelp();
        });

        // Changement d'onglet principal => fermer
        document.addEventListener('click', (e) => {
            const tabEl = e.target.closest('[data-tab], .main-tab, .tab-item');
            if (tabEl && this.isVisible) {
                const id = tabEl.getAttribute('data-tab') || tabEl.getAttribute('data-tab-name') || tabEl.textContent?.trim() || '';
                if (!id.includes('mode-operatoire')) this.forceHideHelp();
            }
        }, true);
    }

    isTabActive() {
        if (document.querySelector('[data-tab="mode-operatoire"].active')) return true;
        const content = document.getElementById('tab-content-mode-operatoire');
        if (content && !content.classList.contains('hidden') && content.style.display !== 'none') return true;
        if (window.TabManager && window.TabManager.currentMainTab === 'mode-operatoire') return true;
        return false;
    }

    showHelp() {
        if (this.isVisible || !this.isTabActive()) return;
        this.isVisible = true;
    this._shownAt = Date.now();

        this.createVisualHighlights();

        // Auto-hide
        setTimeout(() => this.hideHelp(), 8000);

        // Fermer si onglet change
        this.checkActiveTabInterval = setInterval(() => {
            if (!this.isVisible) return;
            if (Date.now() - (this._shownAt || 0) < 600) return;
            if (!this.isTabActive()) {
                setTimeout(() => {
                    if (this.isVisible && !this.isTabActive()) this.hideHelp();
                }, 250);
            }
        }, 500);
    }

    hideHelp() {
        this.isVisible = false;
        if (this.checkActiveTabInterval) { clearInterval(this.checkActiveTabInterval); this.checkActiveTabInterval = null; }
        this.forceCleanup();
    }

    forceHideHelp() {
        this.isVisible = false;
        if (this.checkActiveTabInterval) { clearInterval(this.checkActiveTabInterval); this.checkActiveTabInterval = null; }
        this.forceCleanup();
    }

    forceCleanup() {
        if (this.highlightsContainer) { this.highlightsContainer.remove(); this.highlightsContainer = null; }
    document.querySelectorAll('.modeop-highlight-box, .modeop-help-label').forEach(el => el.remove());
        if (this.hideOnScrollHandler) {
            window.removeEventListener('scroll', this.hideOnScrollHandler);
            window.removeEventListener('wheel', this.hideOnScrollHandler);
            const panel = document.getElementById('tab-content-mode-operatoire');
            if (panel) { panel.removeEventListener('scroll', this.hideOnScrollHandler); panel.removeEventListener('wheel', this.hideOnScrollHandler); }
            this.hideOnScrollHandler = null;
        }
    }

    createVisualHighlights() {
        // Reset container
        if (this.highlightsContainer) this.highlightsContainer.remove();
        this.highlightsContainer = document.createElement('div');
        this.highlightsContainer.id = 'modeop-highlights-container';
        this.highlightsContainer.style.cssText = 'position: fixed; inset: 0; pointer-events: none; z-index: 9998;';
        document.body.appendChild(this.highlightsContainer);

        // Scroll => hide
        this.hideOnScrollHandler = () => {
            if (Date.now() - (this._shownAt || 0) < 600) return;
            this.hideHelp();
        };
        window.addEventListener('scroll', this.hideOnScrollHandler, { passive: true });
        window.addEventListener('wheel', this.hideOnScrollHandler, { passive: true });
        const panel = document.getElementById('tab-content-mode-operatoire');
        if (panel) {
            panel.addEventListener('scroll', this.hideOnScrollHandler, { passive: true });
            panel.addEventListener('wheel', this.hideOnScrollHandler, { passive: true });
        }

        requestAnimationFrame(() => {
            this.highlightEditors();
            this.highlightSectionTitles();
        });
    }

    createHighlightBox(target, { label = '', color = '#2e7d32', position = 'top', delay = 0, small = false } = {}) {
        if (!this.highlightsContainer || !target) return;
        const rect = target.getBoundingClientRect();
        if (!rect || rect.width <= 0 || rect.height <= 0) return;

        const padding = small ? 8 : 12;
        const radius = small ? 8 : 12;
        const box = document.createElement('div');
        box.className = 'modeop-highlight-box';
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
            const top = rect.top + rect.height / 2;
            labelEl.style.cssText = `
                position: fixed; left: ${left}px; top: ${top}px; transform: translate(-100%, -50%);
                background: ${color}; color: #fff; padding: 4px 10px; border-radius: 12px;
                font-size: 11px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 8px ${color}55; pointer-events: none; z-index: 10000;
            `;
            labelEl.textContent = label;
            labelEl.className = 'modeop-help-label';
            this.highlightsContainer.appendChild(labelEl);
        }
        this.highlightsContainer.appendChild(box);
        setTimeout(() => { box.style.opacity = '1'; box.style.transform = 'scale(1)'; }, delay * 1000);
    }

    highlightEditors() {
        // Éditeur principal
        const detailed = document.getElementById('detailedProcedure');
        let detailedContainer = null;
        if (detailed) detailedContainer = detailed.previousElementSibling && detailed.previousElementSibling.classList?.contains('rich-text-editor') ? detailed.previousElementSibling : null;
        // fallback
        const targetDetailed = detailedContainer || detailed;
    if (targetDetailed) this.createHighlightBox(targetDetailed, { label: 'Détaillé', color: '#43a047', position: 'top', delay: 0.15 });

        // Recommandations
        const rec = document.getElementById('procedureRecommendations');
        let recContainer = null;
        if (rec) recContainer = rec.previousElementSibling && rec.previousElementSibling.classList?.contains('rich-text-editor') ? rec.previousElementSibling : null;
        const targetRec = recContainer || rec;
    if (targetRec) this.createHighlightBox(targetRec, { label: 'Recommandations', color: '#1e88e5', position: 'top', delay: 0.35 });
    }

    highlightSectionTitles() {
        // Titre h4 de la section et h5 sous-sections
        const h4 = document.querySelector('#tab-content-mode-operatoire h4');
    if (h4) this.createHighlightBox(h4, { label: 'Titre', color: '#fb8c00', position: 'top', delay: 0.55, small: true });
    const h5s = document.querySelectorAll('#tab-content-mode-operatoire h5');
    if (h5s && h5s[0]) this.createHighlightBox(h5s[0], { label: 'Section', color: '#8e24aa', position: 'top', delay: 0.7, small: true });
    if (h5s && h5s[1]) this.createHighlightBox(h5s[1], { label: 'Section', color: '#8e24aa', position: 'top', delay: 0.85, small: true });
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.ModeOperatoireHelpSystem = new ModeOperatoireHelpSystem();
});
