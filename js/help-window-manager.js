/**
 * GESTIONNAIRE GLOBAL DE FERMETURE DES FENÊTRES D'AIDE
 * Ce script fournit une fonction globale pour fermer toutes les fenêtres d'aide
 * lors du changement d'outil dans la toolbar
 */

// Fonction globale pour fermer toutes les fenêtres d'aide
window.closeAllHelpWindows = function() {
    // console.log(\'🔄 Fermeture de toutes les fenêtres d\'aide...');
    
    // 1. Fermer les fenêtres d'aide du help-patch.js
    const helpWindows = document.querySelectorAll('div[style*="position: fixed"]');
    helpWindows.forEach(window => {
        const style = window.getAttribute('style') || '';
        const content = window.innerHTML || '';
        
        // Identifier les fenêtres d'aide par leur style et contenu
        if ((style.includes('z-index: 99999') || style.includes('z-index: 10000')) &&
            (content.includes('Aide -') || 
             content.includes('tool-help') ||
             content.includes('Outil de') ||
             content.includes('👆') ||
             content.includes('Cliquez sur') ||
             content.includes('Sélectionner') ||
             content.includes('Déplacer') ||
             content.includes('Supprimer') ||
             content.includes('Dupliquer') ||
             content.includes('Mesurer') ||
             content.includes('Annoter') ||
             content.includes('Pinceau') ||
             content.includes('matériau'))) {
            
            // console.log(\'🗑️ Suppression fenêtre d\'aide:', window.className || 'sans classe');
            window.remove();
        }
    });
    
    // 2. Fermer tous les tooltips d'aide
    const tooltips = document.querySelectorAll('.tooltip, .help-tooltip, .tool-tooltip, .onboarding-tooltip');
    tooltips.forEach(tooltip => {
        // console.log(\'🗑️ Suppression tooltip:', tooltip.className);
        tooltip.remove();
    });
    
    // 3. Fermer les modales d'aide
    const helpModals = document.querySelectorAll('#help-modal, .help-modal, .onboarding-modal');
    helpModals.forEach(modal => {
        // console.log(\'🗑️ Masquage modal d\'aide:', modal.id || modal.className);
        modal.style.display = 'none';
        modal.classList.remove('show', 'active');
    });
    
    // 4. Arrêter tous les timers d'auto-fermeture
    if (window.autoCloseTimer) {
        clearTimeout(window.autoCloseTimer);
        window.autoCloseTimer = null;
    }
    
    // 5. Reset des variables globales du help-patch
    if (window.helpPatchLastTool) {
        // console.log(\'🔄 Reset variables globales help-patch');
        window.helpPatchLastTool = null;
        window.helpPatchLastTime = 0;
    }
    
    // 6. Reset du système d'onboarding si actif
    if (window.OnboardingSystem && window.OnboardingSystem.tooltip) {
        // console.log(\'🔄 Reset système d\'onboarding');
        if (window.OnboardingSystem.tooltip) {
            window.OnboardingSystem.tooltip.remove();
            window.OnboardingSystem.tooltip = null;
        }
    }
    
    // console.log(\'✅ Toutes les fenêtres d\'aide ont été fermées');
};

// Fonction de surveillance pour détecter les changements d'outil automatiquement
function setupToolChangeDetection() {
    // Observer les changements de classe sur les boutons d'outils
    const toolButtons = document.querySelectorAll('.tool-button');
    
    toolButtons.forEach(button => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const classList = button.classList;
                    
                    // Si un bouton devient actif, fermer les fenêtres d'aide
                    if (classList.contains('active')) {
                        // console.log(\'🎯 Outil activé détecté:', button.id);
                        setTimeout(() => window.closeAllHelpWindows(), 100);
                    }
                }
            });
        });
        
        observer.observe(button, { attributes: true, attributeFilter: ['class'] });
    });
    
    // console.log(\'👁️ Surveillance des changements d\'outils configurée pour', toolButtons.length, 'boutons');
}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    // Attendre un peu que tous les éléments soient chargés
    setTimeout(setupToolChangeDetection, 1000);
});

// Export global
window.setupToolChangeDetection = setupToolChangeDetection;

// console.log(\'🔧 Gestionnaire global de fermeture des fenêtres d\'aide chargé');
