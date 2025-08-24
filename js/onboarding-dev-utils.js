/**
 * Utilitaires de développement pour l'onboarding
 * Fonctions utiles pour tester et déboguer le système d'onboarding
 */

// Ajouter les utilitaires de développement à la console
window.onboardingUtils = {
    
    // Réinitialiser l'onboarding (effacer le localStorage et relancer)
    reset() {
        localStorage.removeItem('wallsim-onboarding-seen');
        console.log('🔄 Onboarding réinitialisé - rechargez la page pour le voir');
        if (window.OnboardingSystem) {
            window.OnboardingSystem.restart();
        }
    },
    
    // Forcer le démarrage immédiat (ignorer localStorage)
    forceStart() {
    // Forcer le démarrage immédiat (ignorer localStorage)
    forceStart() {
        if (window.OnboardingSystem) {
            console.log('🔥 Démarrage forcé de l\'onboarding');
            window.OnboardingSystem.hasSeenOnboarding = false;
            window.OnboardingSystem.start();
        } else {
            console.error('❌ OnboardingSystem non trouvé');
        }
    },
    
    // Démarrer l'onboarding manuellement (même si déjà vu)
    start() {
        if (window.OnboardingSystem) {
            console.log('🚀 Démarrage manuel de l\'onboarding');
            window.OnboardingSystem.start();
        } else {
            console.error('❌ OnboardingSystem non trouvé');
        }
    },
    
    // Passer à l'étape suivante
    next() {
        if (window.OnboardingSystem && window.OnboardingSystem.isActive) {
            window.OnboardingSystem.nextStep();
        } else {
            console.log('ℹ️ Onboarding non actif');
        }
    },
    
    // Étape précédente
    prev() {
        if (window.OnboardingSystem && window.OnboardingSystem.isActive) {
            window.OnboardingSystem.previousStep();
        } else {
            console.log('ℹ️ Onboarding non actif');
        }
    },
    
    // Terminer l'onboarding
    complete() {
        if (window.OnboardingSystem && window.OnboardingSystem.isActive) {
            window.OnboardingSystem.complete();
        } else {
            console.log('ℹ️ Onboarding non actif');
        }
    },
    
    // Afficher l'état actuel
    status() {
        if (window.OnboardingSystem) {
            console.log('📊 État de l\'onboarding:', {
                isActive: window.OnboardingSystem.isActive,
                currentStep: window.OnboardingSystem.currentStep + 1,
                totalSteps: window.OnboardingSystem.steps.length,
                hasSeenOnboarding: window.OnboardingSystem.hasSeenOnboarding,
                currentStepData: window.OnboardingSystem.steps[window.OnboardingSystem.currentStep]
            });
        } else {
            console.error('❌ OnboardingSystem non trouvé');
        }
    },
    
    // Simuler la pose d'une première brique
    simulateFirstBrick() {
        console.log('🧪 Simulation : pose de première brique');
        document.dispatchEvent(new CustomEvent('brickPlaced', { 
            detail: { 
                element: { id: 'test-brick-1', type: 'brick' }, 
                isFirst: true 
            } 
        }));
    },
    
    // Simuler la sélection d'une brique
    simulateBrickSelection() {
        console.log('🧪 Simulation : sélection de brique');
        document.dispatchEvent(new CustomEvent('elementSelected', { 
            detail: { 
                element: { id: 'test-brick-1', type: 'brick', toolType: 'brick' },
                properties: {},
                toolType: 'brick'
            } 
        }));
    },
    
    // Simuler la pose d'une brique adjacente
    simulateAdjacentBrick() {
        console.log('🧪 Simulation : pose de brique adjacente');
        document.dispatchEvent(new CustomEvent('adjacentBrickPlaced', { 
            detail: { 
                element: { id: 'test-brick-2', type: 'brick' }, 
                isAdjacent: true 
            } 
        }));
    },
    
    // Simuler la fermeture de la popup d'accueil
    simulatePopupClosed() {
        console.log('🧪 Simulation : fermeture popup d\'accueil');
        window.dispatchEvent(new CustomEvent('startup-popup-closed'));
    },
    
    // Simuler un nouveau projet
    simulateNewProject() {
        console.log('🧪 Simulation : nouveau projet');
        window.dispatchEvent(new CustomEvent('startup-new-project'));
    },
    
    // Simuler la séquence complète
    simulateFullSequence() {
        console.log('🎬 Simulation : séquence complète d\'onboarding');
        
        // Démarrer l'onboarding
        this.start();
        
        // Simuler l'onglet biblio après 2 secondes
        setTimeout(() => {
            const biblioTab = document.querySelector('[data-tab="biblio"]');
            if (biblioTab) {
                biblioTab.click();
                console.log('🎬 Étape 1 : Onglet biblio cliqué');
            }
        }, 2000);
        
        // Simuler la pose de brique après 4 secondes
        setTimeout(() => {
            this.simulateFirstBrick();
            console.log('🎬 Étape 2 : Première brique posée');
        }, 4000);
        
        // Simuler la sélection de brique après 6 secondes
        setTimeout(() => {
            this.simulateBrickSelection();
            console.log('🎬 Étape 3 : Brique sélectionnée');
        }, 6000);
        
        // Simuler la brique adjacente après 8 secondes
        setTimeout(() => {
            this.simulateAdjacentBrick();
            console.log('🎬 Étape 4 : Brique adjacente posée');
        }, 8000);
    },
    
    // Activer le mode debug (affiche plus de logs)
    enableDebug() {
        localStorage.setItem('onboarding-debug', 'true');
        console.log('🐛 Mode debug activé - rechargez pour voir plus de logs');
    },
    
    // Désactiver le mode debug
    disableDebug() {
        localStorage.removeItem('onboarding-debug');
        console.log('✅ Mode debug désactivé');
    }
};

// Afficher les commandes disponibles au chargement
console.log(`
🚀 Utilitaires d'onboarding chargés !
Commandes disponibles dans la console :

onboardingUtils.reset()     - Réinitialiser l'onboarding
onboardingUtils.start()     - Démarrer l'onboarding
onboardingUtils.next()      - Étape suivante
onboardingUtils.prev()      - Étape précédente
onboardingUtils.complete()  - Terminer l'onboarding
onboardingUtils.status()    - Afficher l'état actuel

Tests et simulations :
onboardingUtils.simulateFirstBrick()      - Simuler pose première brique
onboardingUtils.simulateBrickSelection()  - Simuler sélection de brique
onboardingUtils.simulateAdjacentBrick()   - Simuler pose brique adjacente
onboardingUtils.simulatePopupClosed()     - Simuler fermeture popup d'accueil
onboardingUtils.simulateNewProject()      - Simuler nouveau projet
onboardingUtils.simulateFullSequence()   - Simuler séquence complète

Debug :
onboardingUtils.enableDebug()  - Activer mode debug
onboardingUtils.disableDebug() - Désactiver mode debug
`);
