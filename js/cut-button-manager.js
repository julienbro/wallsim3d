// Gestionnaire centralisé des boutons de coupe pour éviter les états simultanés
class CutButtonManager {
    constructor() {
        this.currentActiveButton = null;
        this.currentBaseType = null;
        this.currentCutType = null;
    }

    // Méthode principale pour activer un bouton de coupe
    activateCutButton(buttonElement, baseType, cutType) {
        // console.log(`🔧 CutButtonManager: Activation de ${cutType} pour ${baseType}`);
        
        // 1. Désactiver TOUS les boutons de coupe existants
        this.deactivateAllCutButtons();
        
        // 2. Activer seulement le bouton demandé
        if (buttonElement && buttonElement.classList) {
            buttonElement.classList.add('active');
            this.currentActiveButton = buttonElement;
            this.currentBaseType = baseType;
            this.currentCutType = cutType;
            
            // console.log(`✅ CutButtonManager: Bouton ${cutType} activé pour ${baseType}`);
        }
        
        // 3. Émettre un événement pour informer les autres gestionnaires
        document.dispatchEvent(new CustomEvent('cutButtonChanged', {
            detail: { baseType, cutType, buttonElement }
        }));
    }

    // Désactiver tous les boutons de coupe dans l'interface
    deactivateAllCutButtons() {
        const allCutButtons = document.querySelectorAll('.cut-btn-mini');
        let deactivatedCount = 0;
        
        allCutButtons.forEach(button => {
            if (button.classList.contains('active')) {
                button.classList.remove('active');
                deactivatedCount++;
            }
        });
        
        if (deactivatedCount > 0) {
            // console.log(`🔄 CutButtonManager: ${deactivatedCount} boutons désactivés`);
        }
        
        // Réinitialiser l'état
        this.currentActiveButton = null;
        this.currentBaseType = null;
        this.currentCutType = null;
    }

    // Obtenir l'état actuel
    getCurrentState() {
        return {
            baseType: this.currentBaseType,
            cutType: this.currentCutType,
            buttonElement: this.currentActiveButton
        };
    }

    // Vérifier si un bouton spécifique est actif
    isButtonActive(baseType, cutType) {
        return this.currentBaseType === baseType && this.currentCutType === cutType;
    }

    // Méthode pour synchroniser avec les sélecteurs existants
    syncWithSelectors(baseType, cutType) {
        // Chercher le bouton correspondant dans l'interface
        const targetButton = document.querySelector(`.cut-btn-mini[data-base-type="${baseType}"][data-cut="${cutType}"]`);
        
        if (targetButton) {
            this.activateCutButton(targetButton, baseType, cutType);
        } else {
            console.warn(`⚠️ CutButtonManager: Bouton ${cutType} pour ${baseType} non trouvé`);
        }
    }

    // Initialisation et configuration des événements
    initialize() {
        // console.log('🚀 CutButtonManager: Initialisation');
        
        // Écouter les clics sur tous les boutons de coupe
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('cut-btn-mini')) {
                const baseType = e.target.getAttribute('data-base-type');
                const cutType = e.target.getAttribute('data-cut');
                
                // Utiliser le gestionnaire centralisé
                this.activateCutButton(e.target, baseType, cutType);
            }
        });
        
        // Désactiver tous les boutons au démarrage pour un état propre
        this.deactivateAllCutButtons();
        
        // console.log('✅ CutButtonManager: Initialisé');
    }
}

// Créer une instance globale
window.CutButtonManager = new CutButtonManager();

// Auto-initialisation quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.CutButtonManager.initialize();
    });
} else {
    window.CutButtonManager.initialize();
}
