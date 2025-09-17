// Script d'initialisation pour coordonner le chargement
document.addEventListener('DOMContentLoaded', function() {
    // Gérer les événements de la popup de démarrage
    window.addEventListener('startup-new-project', function() {
        // console.log('🆕 Créer un nouveau projet...');
        // Fermer la popup seulement quand on clique sur "Nouveau"
        if (window.StartupManager) {
            StartupManager.closeStartupPopup();
        }
        // Ici vous pouvez ajouter la logique pour créer un nouveau projet
        initializeApplication();
    });

    window.addEventListener('startup-open-project', function(event) {
        console.log('📂 Ouverture du fichier:', event.detail.file.name);
        // Ne pas fermer la popup automatiquement pour "Ouvrir"
        // L'utilisateur pourra la fermer manuellement ou après chargement du fichier
        // Ici vous pouvez ajouter la logique pour ouvrir un projet
        initializeApplication();
    });

    // Attendre que Three.js ES6 soit chargé
    window.addEventListener('threejs-es6-ready', function(event) {
        // console.log('🚀 Démarrage de l\'application WallSim3D - Mode ES6');
        // console.log('📦 Three.js version:', event.detail.version);
        // console.log('🔧 Mode ES6:', event.detail.isES6);
        
        // Mettre à jour la barre de progression si elle est visible
        if (window.StartupManager) {
            StartupManager.updateExternalProgress(60, 'Three.js chargé avec succès');
        }
        
        // Attendre un peu avant d'initialiser pour permettre à la popup de finir son animation
        // et que tous les scripts soient chargés
        setTimeout(() => {
            initializeApplicationCore();
        }, 1500);
    });

    // Fallback pour l'ancien événement (compatibilité)
    window.addEventListener('threejs-ready', function() {
        console.log('🚀 Démarrage de l\'application WallSim3D - Mode compatibilité');
        
        if (window.StartupManager) {
            StartupManager.updateExternalProgress(60, 'Three.js chargé (mode compatibilité)');
        }
        
        setTimeout(() => {
            initializeApplicationCore();
        }, 1500);
    });

    // Timeout de sécurité
    setTimeout(() => {
        if (typeof THREE === 'undefined') {
            console.error('❌ Three.js n\'a pas été chargé dans les temps');
            document.body.innerHTML = `
                <div style="padding: 20px; text-align: center; color: red;">
                    <h2>Erreur de chargement</h2>
                    <p>Three.js ES6 n'a pas pu être chargé. Veuillez vérifier votre connexion internet.</p>
                    <button onclick="location.reload()" style="padding: 10px 20px; font-size: 16px;">
                        🔄 Recharger
                    </button>
                </div>
            `;
        }
    }, 30000); // 30 secondes pour laisser le temps d'essayer tous les CDN
});

function initializeApplication() {
    // Fonction appelée quand l'utilisateur choisit "Nouveau" ou "Ouvrir" dans la popup
    if (typeof THREE !== 'undefined') {
        initializeApplicationCore();
    } else {
        console.log('⏳ En attente du chargement de Three.js...');
    }
}

function initializeApplicationCore() {
    // Initialiser l'application une fois que Three.js ES6 est prêt
    
    // Utiliser requestIdleCallback pour une meilleure performance avec timeout
    const initApp = () => {
        if (typeof WallSimApp !== 'undefined' && typeof window.SceneManager !== 'undefined') {
            const app = new WallSimApp();
            
            if (window.StartupManager) {
                StartupManager.updateExternalProgress(90, 'Initialisation de l\'interface...');
            }
            
            // 🚀 OPTIMISATION: Initialiser avec un délai pour éviter les blocages
            setTimeout(() => {
                app.init().then(() => {
                    // Ne plus fermer automatiquement la popup
                    // L'utilisateur doit choisir "Nouveau" ou "Ouvrir"
                    if (window.StartupManager) {
                        StartupManager.updateExternalProgress(100, 'Prêt ! Choisissez une action.');
                    }
                    
                    // Initialiser le bouton d'onboarding
                    initializeOnboardingButton();
                }).catch(error => {
                    console.error('Erreur lors de l\'initialisation de l\'application:', error);
                    if (window.StartupManager) {
                        StartupManager.updateExternalProgress(100, 'Erreur d\'initialisation');
                    }
                });
            }, 1); // Délai minimal pour éviter le blocage
        } else {
            console.error('❌ Dépendances manquantes - WallSimApp:', typeof WallSimApp, 'SceneManager:', typeof window.SceneManager);
            // Réessayer dans 500ms
            setTimeout(() => initializeApplicationCore(), 500);
        }
    };
    
    // Utiliser requestIdleCallback si disponible, sinon setTimeout avec délai réduit
    if (window.requestIdleCallback) {
        requestIdleCallback(initApp);
    } else {
        setTimeout(initApp, 100); // Réduit à 100ms
    }
}

// Initialiser le bouton d'onboarding
function initializeOnboardingButton() {
    const onboardingButton = document.getElementById('startOnboarding');
    if (onboardingButton && window.OnboardingSystem) {
        onboardingButton.addEventListener('click', () => {
            console.log('🚀 Redémarrage de l\'onboarding par l\'utilisateur');
            window.OnboardingSystem.forceStart();
        });
        console.log('✅ Bouton d\'onboarding initialisé');
    } else {
        // console.warn('⚠️ Bouton d\'onboarding ou OnboardingSystem non trouvé');
    }
}

