/**
 * Système d'aide contextuelle pour l'onglet Outils
 * Style premium avec animations et effets visuels - modèle basé sur library-help-system.js
 */
class ToolsHelpSystem {
    constructor() {
        this.isVisible = false;
        this.helpTooltip = null;
        this.highlightsContainer = null;
        this.systemId = 'tools-help-system-' + Date.now(); // Identifiant unique
        this.preventInterference = false; // Flag pour éviter les interférences
        // // console.log(\'🔧 ToolsHelpSystem créé avec ID:', this.systemId);
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.addAnimationStyles();
        // console.log(\'🔧 Tools Help System initialized - MODE ÉVÉNEMENT SEULEMENT');
        
        // PLUS de surveillance automatique - uniquement l'événement onboardingComplete
        // L'aide ne s'affiche QUE lorsque l'onboarding est terminé et émet l'événement
    }
    
    // DÉSACTIVÉ - startOnboardingWatcher
    // Cette méthode causait un déclenchement automatique au démarrage
    startOnboardingWatcher() {
        // console.log(\'🔧 Surveillant d\'onboarding DÉSACTIVÉ - utilisation de l\'événement onboardingComplete uniquement');
        return; // Fonction désactivée
        
        /*
        // console.log(\'🔧 Démarrage du surveillant d\'onboarding');
        let watchCount = 0;
        const maxWatches = 30; // 30 secondes maximum
        
        const watcher = setInterval(() => {
            watchCount++;
            const onboardingOverlay = document.querySelector('#onboarding-overlay, .onboarding-overlay');
            const isOnboardingVisible = onboardingOverlay && 
                                      onboardingOverlay.style.display !== 'none' && 
                                      !onboardingOverlay.hidden;
            
            // console.log(\`🔧 Watch ${watchCount}: Onboarding visible:`, isOnboardingVisible);
            
            // Si l'onboarding n'est plus visible et qu'on n'a pas encore montré l'aide
            if (!isOnboardingVisible && !this.isVisible) {
                // console.log(\'🔧 Onboarding terminé détecté par le surveillant !');
                clearInterval(watcher);
                setTimeout(() => {
                    this.forceShowHelp();
                }, 500);
                return;
            }
            
            // Arrêter après le maximum de tentatives
            if (watchCount >= maxWatches) {
                // console.log(\'🔧 Arrêt du surveillant d\'onboarding (timeout)');
                clearInterval(watcher);
            }
        }, 1000);
        */
    }
    
    // DÉSACTIVÉ - pollForOnboardingEnd 
    // Cette méthode causait un déclenchement automatique
    pollForOnboardingEnd() {
        // console.log(\'🔧 Polling d\'onboarding DÉSACTIVÉ - utilisation de l\'événement onboardingComplete uniquement');
        return; // Fonction désactivée
    }

    checkInitialState() {
        // Vérifier si nous sommes dans une situation où l'aide devrait être affichée
        const toolsTab = document.querySelector('[data-tab="outils"]');
        const toolsContent = document.querySelector('#tab-content-outils');
        
        const isToolsActive = (toolsTab && toolsTab.classList.contains('active')) || 
                             (toolsContent && toolsContent.classList.contains('active'));
        
        // console.log(\'Tools Help: Initial state check - Tools tab active:', isToolsActive);
        
        // Si l'onglet est actif et qu'aucun onboarding n'est en cours
        const onboardingOverlay = document.querySelector('#onboarding-overlay, .onboarding-overlay');
        const isOnboardingActive = onboardingOverlay && onboardingOverlay.style.display !== 'none';
        
        // console.log(\'Tools Help: Onboarding active:', isOnboardingActive);
        
        if (isToolsActive && !isOnboardingActive) {
            // console.log(\'Tools Help: Ready to show help immediately');
            // L'aide peut être déclenchée manuellement si nécessaire
        }
    }

    // Méthode publique pour forcer l'affichage de l'aide
    forceShowHelp() {
        // REDIRECTION VERS AIDE CONTEXTUELLE
        
        // Rediriger vers la nouvelle méthode d'aide contextuelle
        this.showToolsHelp();
    }

    addAnimationStyles() {
        if (document.querySelector('#tools-help-premium-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'tools-help-premium-styles';
        styles.textContent = `
            @keyframes toolsHighlightPulse {
                0%, 100% { 
                    opacity: 0.8;
                    transform: scale(1);
                    box-shadow: 
                        0 0 0 2px rgba(255, 255, 255, 0.8),
                        0 0 20px var(--tools-highlight-color, #ff9800)40,
                        inset 0 0 20px var(--tools-highlight-color, #ff9800)10;
                }
                50% { 
                    opacity: 1;
                    transform: scale(1.02);
                    box-shadow: 
                        0 0 0 4px rgba(255, 255, 255, 1),
                        0 0 30px var(--tools-highlight-color, #ff9800)60,
                        inset 0 0 30px var(--tools-highlight-color, #ff9800)15;
                }
            }

            @keyframes toolsMaterialEntrance {
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

            @keyframes toolsFloat {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                33% { transform: translateY(-2px) rotate(1deg); }
                66% { transform: translateY(1px) rotate(-1deg); }
            }

            @keyframes toolsPulse {
                0%, 100% { transform: scale(1); box-shadow: 0 4px 15px rgba(255, 152, 0, 0.4); }
                50% { transform: scale(1.05); box-shadow: 0 6px 20px rgba(255, 152, 0, 0.6); }
            }

            @keyframes toolsPulseHighlight {
                0%, 100% { 
                    box-shadow: 
                        0 0 0 2px rgba(255, 255, 255, 0.8),
                        0 0 20px var(--tools-highlight-color, #ff9800)40,
                        inset 0 0 20px var(--tools-highlight-color, #ff9800)10;
                }
                50% { 
                    box-shadow: 
                        0 0 0 4px rgba(255, 255, 255, 1),
                        0 0 30px var(--tools-highlight-color, #ff9800)60,
                        inset 0 0 30px var(--tools-highlight-color, #ff9800)15;
                }
            }

            @keyframes toolsShimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            @keyframes toolsGlow {
                0%, 100% { opacity: 0.1; transform: scale(1); }
                50% { opacity: 0.3; transform: scale(1.1); }
            }

            @keyframes toolsBounce {
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

            @keyframes sparkle {
                0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
                50% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }

            @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                33% { transform: translateY(-2px) rotate(1deg); }
                66% { transform: translateY(1px) rotate(-1deg); }
            }

            .tools-highlight-box {
                --tools-highlight-color: #ff9800;
                animation: toolsPulseHighlight 2s ease-in-out infinite;
                transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }

            .tools-highlight-box.animate-in {
                animation: toolsMaterialEntrance 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards,
                          toolsPulseHighlight 2s ease-in-out infinite 0.8s;
            }

            .tools-highlight-label {
                animation: toolsFloat 3s ease-in-out infinite;
            }

            .tools-sparkle {
                animation: toolsShimmer 2s linear infinite;
            }
        `;
        document.head.appendChild(styles);
    }

    setupEventListeners() {
        // console.log(\'🔧 Setup des écouteurs d\'événements');
        
        // Écouter les clics sur l'onglet Outils
        const toolsTab = document.querySelector('[data-tab="outils"]');
        if (toolsTab) {
            toolsTab.addEventListener('click', (e) => {
                // console.log(\'🔧 Clic sur onglet Outils détecté');
                // Délai pour laisser l'onglet s'ouvrir
                setTimeout(() => {
                    this.showToolsHelp();
                }, 300);
            });
            // console.log(\'🔧 Écouteur de clic sur onglet Outils installé');
        } else {
            // console.log(\'❌ Onglet Outils non trouvé');
        }

        // Écouter la fin de l'onboarding pour déclencher l'aide - Méthode 1
        document.addEventListener('onboardingComplete', (e) => {
            // console.log(\'🔧 Tools Help: Événement onboardingComplete reçu via addEventListener', e);
            
            // Délai court pour laisser l'onboarding se fermer complètement
            setTimeout(() => {
                // console.log(\'🔧 Tools Help: Déclenchement automatique de l\'aide outils');
                this.showToolsHelp();
            }, 500);
        });
        
        // Écouter la fin de l'onboarding - Méthode 2 (window)
        window.addEventListener('onboardingComplete', (e) => {
            // console.log(\'🔧 Tools Help: Événement onboardingComplete reçu via window.addEventListener', e);
            setTimeout(() => {
                this.showToolsHelp();
            }, 700);
        });
        
        // Méthode 3 - Polling pour détecter la fin de l'onboarding
        setTimeout(() => {
            this.pollForOnboardingEnd();
        }, 2000);
        
        // console.log(\'🔧 Écouteurs onboardingComplete installés');

        // Fermer l'aide quand on change d'onglet principal (sortie d'outils)
        this.setupMainTabListeners();

        // Fermer avec Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hideHelp();
            }
        });
    }

    setupMainTabListeners() {
        // Écouter les clics sur tous les onglets principaux (sauf outils)
        const mainTabs = document.querySelectorAll('[data-tab]');
        mainTabs.forEach(tab => {
            const tabId = tab.getAttribute('data-tab');
            if (tabId && tabId !== 'outils') {
                tab.addEventListener('click', () => {
                    if (this.isVisible) {
                        // console.log(\`Changement vers l'onglet ${tabId}, fermeture de l'aide outils`);
                        this.hideHelp();
                    }
                });
            }
        });
    }

    // Méthode pour vérifier et afficher l'aide si l'onglet Outils est actif
    checkAndShowHelpIfToolsActive() {
        const toolsTab = document.querySelector('[data-tab="outils"]');
        const toolsContent = document.querySelector('#tab-content-outils');
        
        const isToolsActive = (toolsTab && toolsTab.classList.contains('active')) || 
                             (toolsContent && toolsContent.classList.contains('active'));
        
        // console.log(\'Tools Help: Checking if tools tab is active:', isToolsActive);
        
        if (isToolsActive) {
            // console.log(\'Tools Help: Tools tab is active, showing help');
            setTimeout(() => {
                this.showToolsHelp();
            }, 500);
            return true;
        }
        return false;
    }

    showToolsHelp() {
        // MODE AIDE CONTEXTUELLE
        
        // Ne pas afficher la fenêtre de guide complète, mais activer l'aide contextuelle légère
        if (this.isVisible) {
            return;
        }
        
        // Afficher uniquement l'aide contextuelle (bulles d'aide) sans la fenêtre de guide
        this.showContextualHelpOnly();
    }
    
    /**
     * Afficher uniquement l'aide contextuelle (cadres colorés) sans la fenêtre de guide
     */
    showContextualHelpOnly() {
        // Affichage cadres colorés outils uniquement
        
        // Marquer comme visible pour éviter les appels multiples
        this.isVisible = true;
        
        // Créer uniquement les cadres colorés visuels (pas de fenêtre de guide)
        this.createVisualHighlights();
        
        // Auto-masquer après quelques secondes
        setTimeout(() => {
            this.hideHelp();
        }, 8000); // Plus long pour les cadres colorés
    }
    
    /**
     * Créer des surlignages légers pour l'aide contextuelle
     */
    createLightHighlights() {
        // Nettoyer les anciens surlignages
        this.removeVisualHighlights();
        
        // Créer un container pour les surlignages légers
        this.highlightsContainer = document.createElement('div');
        this.highlightsContainer.id = 'tools-contextual-highlights';
        this.highlightsContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(this.highlightsContainer);
        
        // Surligner l'onglet outils avec une bulle d'aide légère
        const toolsTab = document.querySelector('[data-tab="tools"], [data-tab="outils"]');
        if (toolsTab) {
            this.createLightTooltip(toolsTab, 'Outils de construction', 'Sélectionnez des éléments à placer');
        }
        
        // Surligner les boutons principaux si visibles
        const placeButton = document.querySelector('#place-element-btn, .place-element');
        if (placeButton) {
            this.createLightTooltip(placeButton, 'Placer élément', 'Cliquez pour placer l\'élément sélectionné');
        }
    }
    
    /**
     * Créer une bulle d'aide légère
     */
    createLightTooltip(element, title, description) {
        const rect = element.getBoundingClientRect();
        const tooltip = document.createElement('div');
        tooltip.className = 'light-help-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width + 10}px;
            top: ${rect.top}px;
            background: rgba(0, 123, 255, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            z-index: 10001;
            pointer-events: none;
            animation: fadeInTooltip 0.3s ease-in;
        `;
        tooltip.innerHTML = `<strong>${title}</strong><br>${description}`;
        
        // Ajouter l'animation CSS si elle n'existe pas
        if (!document.querySelector('#light-tooltip-styles')) {
            const styles = document.createElement('style');
            styles.id = 'light-tooltip-styles';
            styles.textContent = `
                @keyframes fadeInTooltip {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(styles);
        }
        
        this.highlightsContainer.appendChild(tooltip);
        
        // Créer un indicateur visuel léger sur l'élément
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            left: ${rect.left - 2}px;
            top: ${rect.top - 2}px;
            width: ${rect.width + 4}px;
            height: ${rect.height + 4}px;
            border: 2px solid #007bff;
            border-radius: 4px;
            pointer-events: none;
            animation: pulseIndicator 2s infinite;
        `;
        
        // Ajouter l'animation de pulsation
        if (!document.querySelector('#pulse-animation-styles')) {
            const pulseStyles = document.createElement('style');
            pulseStyles.id = 'pulse-animation-styles';
            pulseStyles.textContent = `
                @keyframes pulseIndicator {
                    0% { opacity: 0.7; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.02); }
                    100% { opacity: 0.7; transform: scale(1); }
                }
            `;
            document.head.appendChild(pulseStyles);
        }
        
        this.highlightsContainer.appendChild(indicator);
    }
    
    /**
     * Masquer l'aide contextuelle
     */
    hideHelp() {
        console.log('🔧 Masquage de l\'aide contextuelle outils');
        
        this.isVisible = false;
        
        // Supprimer les surlignages
        if (this.highlightsContainer) {
            this.highlightsContainer.remove();
            this.highlightsContainer = null;
        }
        
        // Supprimer les écouteurs de scroll
        if (this.hideOnScrollHandler) {
            window.removeEventListener('scroll', this.hideOnScrollHandler);
            window.removeEventListener('wheel', this.hideOnScrollHandler);
            
            const toolsContent = document.querySelector('#tab-content-outils');
            if (toolsContent) {
                toolsContent.removeEventListener('scroll', this.hideOnScrollHandler);
                toolsContent.removeEventListener('wheel', this.hideOnScrollHandler);
            }
            
            this.hideOnScrollHandler = null;
            console.log('🔧 Écouteurs de scroll supprimés');
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
    }

    createVisualHighlights() {
        // Supprimer les anciens surlignages
        this.removeVisualHighlights();
        
        // Créer le conteneur de surlignages
        this.highlightsContainer = document.createElement('div');
        this.highlightsContainer.id = 'tools-highlights-container';
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

        // Ajouter un écouteur de scroll global pour cacher les cadres
        this.hideOnScrollHandler = () => {
            // console.log(\'🔧 Scroll détecté - masquage automatique des cadres');
            this.hideHelp();
        };
        
        // Scroll immédiat sans débounce pour test
        window.addEventListener('scroll', this.hideOnScrollHandler, { passive: true });
        window.addEventListener('wheel', this.hideOnScrollHandler, { passive: true });
        
        // Aussi écouter le scroll sur le conteneur de l'onglet outils
        const toolsContent = document.querySelector('#tab-content-outils');
        if (toolsContent) {
            toolsContent.addEventListener('scroll', this.hideOnScrollHandler, { passive: true });
            toolsContent.addEventListener('wheel', this.hideOnScrollHandler, { passive: true });
            // console.log(\'🔧 Écouteur de scroll ajouté sur le conteneur outils');
        }
        
        // console.log(\'🔧 Écouteurs de scroll ET wheel configurés pour masquer les cadres');

        // Attendre un frame pour que le DOM soit mis à jour (avec timeout plus court pour éviter violations)
        setTimeout(() => {
            this.createToolsSectionHighlights();
        }, 50);
    }

    createToolsSectionHighlights() {
        // Surligner les principales sections de l'onglet Outils
        const toolsSections = [
            { 
                selector: '.reusable-elements-section', 
                label: '♻️ Éléments Utilisés', 
                color: '#E91E63' 
            },
            { 
                selector: '.tools-active-element', 
                label: '🎯 Élément Actif 3D', 
                color: '#2196F3' 
            },
            { 
                selector: '.assise-info-panel', 
                label: 'ℹ️ Infos Assise Courante', 
                color: '#00BCD4' 
            },
            { 
                selector: '.tool-subsection:has(.assise-selector)', 
                label: '� Contrôles Assises', 
                color: '#4CAF50' 
            },
            { 
                selector: '.visual-aids-checkboxes', 
                label: '�️ Aides Visuelles', 
                color: '#FF9800' 
            },
            { 
                selector: '.joint-height-control', 
                label: '📏 Hauteur Joints', 
                color: '#9C27B0' 
            }
        ];

        toolsSections.forEach((section, index) => {
            const element = document.querySelector(section.selector);
            // console.log(\`🔧 Recherche élément "${section.selector}":`, element);
            if (element) {
                const rect = element.getBoundingClientRect();
                // console.log(`🔧 Position de "${section.label}":`, {
                //     left: rect.left,
                //     top: rect.top,
                //     width: rect.width,
                //     height: rect.height
                // });
                this.createHighlightBox(element, {
                    label: section.label,
                    color: section.color,
                    position: 'left', // Forcer tous les labels à gauche
                    delay: index * 0.3
                });
            } else {
                // Ignorer silencieusement les éléments supprimés avec l'onglet Outils
                const toolsRelatedSelectors = [
                    '.reusable-elements-section',
                    '.tools-active-element', 
                    '.assise-info-panel',
                    '.tool-subsection:has(.assise-selector)',
                    '.joint-height-control'
                ];
                
                if (!toolsRelatedSelectors.includes(section.selector)) {
                    console.warn(`🔧 Élément non trouvé pour le sélecteur: ${section.selector}`);
                }
            }
        });

        // Surligner aussi les boutons de coupe de l'élément actif en même temps
        const cutButtons = document.querySelector('.tools-cut-buttons');
        if (cutButtons) {
            this.createHighlightBox(cutButtons, {
                label: '✂️ Coupes',
                color: '#E91E63',
                position: 'left',
                delay: toolsSections.length * 0.3, // Apparaître après les autres avec le même espacement
                small: true
            });
        }
    }

    createHighlightBox(element, options = {}) {
        if (!element || !this.highlightsContainer) return;

        const {
            label = '',
            color = '#ff9800',
            position = 'top',
            delay = 0,
            small = false
        } = options;

        // Créer la boîte de surlignage
        const highlight = document.createElement('div');
        highlight.className = 'tools-highlight-box';
        highlight.dataset.targetElement = element.className || element.id || 'unknown';
        
        const padding = small ? 6 : 10;
        const borderRadius = small ? 6 : 10;
        
        // Fonction pour mettre à jour la position en temps réel
        const updatePosition = () => {
            const rect = element.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return; // Élément invisible
            
            highlight.style.left = `${rect.left - padding + window.scrollX}px`;
            highlight.style.top = `${rect.top - padding + window.scrollY}px`;
            highlight.style.width = `${rect.width + (padding * 2)}px`;
            highlight.style.height = `${rect.height + (padding * 2)}px`;
        };
        
        // Style initial
        highlight.style.cssText = `
            position: absolute;
            border: 3px solid ${color};
            border-radius: ${borderRadius}px;
            background: ${color}15;
            box-shadow: 
                0 0 0 2px rgba(255, 255, 255, 0.8),
                0 0 20px ${color}40,
                inset 0 0 20px ${color}10;
            opacity: 1;
            --tools-highlight-color: ${color};
            animation: toolsHighlightPulse 2s ease-in-out infinite ${delay}s;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            pointer-events: none;
            z-index: 9998;
        `;
        
        // Position initiale
        updatePosition();
        
        // Écouter les événements de scroll et resize pour repositionner
        const repositionHandler = () => updatePosition();
        window.addEventListener('scroll', repositionHandler);
        window.addEventListener('resize', repositionHandler);
        
        // Stocker la fonction de nettoyage
        highlight._cleanup = () => {
            window.removeEventListener('scroll', repositionHandler);
            window.removeEventListener('resize', repositionHandler);
        };
        
        // console.log(\`🔧 Élément "${label}" - position responsive activée`);

        // Ajouter le label si fourni
        if (label) {
            const labelElement = document.createElement('div');
            labelElement.className = 'tools-highlight-label';
            
            // Fonction pour mettre à jour la position du label
            const updateLabelPosition = () => {
                const rect = element.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) return;
                
                let labelLeft, labelTop;
                switch (position) {
                    case 'left':
                        labelLeft = rect.left - 180 + window.scrollX;
                        labelTop = rect.top + (rect.height / 2) - 15 + window.scrollY;
                        break;
                    case 'right':
                        labelLeft = rect.left + rect.width + 20 + window.scrollX;
                        labelTop = rect.top + (rect.height / 2) - 15 + window.scrollY;
                        break;
                    case 'bottom':
                        labelLeft = rect.left + (rect.width / 2) - 90 + window.scrollX;
                        labelTop = rect.top + rect.height + 15 + window.scrollY;
                        break;
                    default: // top
                        labelLeft = rect.left + (rect.width / 2) - 90 + window.scrollX;
                        labelTop = rect.top - 45 + window.scrollY;
                }
                
                labelElement.style.left = `${Math.max(10, labelLeft)}px`;
                labelElement.style.top = `${Math.max(10, labelTop)}px`;
            };
            
            labelElement.style.cssText = `
                position: absolute;
                background: linear-gradient(135deg, ${color}, ${color}aa);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 600;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                box-shadow: 0 4px 15px ${color}40;
                min-width: 120px;
                text-align: center;
                opacity: 0;
                animation-delay: ${delay + 0.2}s;
                z-index: 10000;
                pointer-events: none;
            `;
            labelElement.textContent = label;
            
            // Position initiale du label
            updateLabelPosition();
            
            // Ajouter les écouteurs pour le label aussi
            const labelRepositionHandler = () => updateLabelPosition();
            window.addEventListener('scroll', labelRepositionHandler);
            window.addEventListener('resize', labelRepositionHandler);
            
            // Stocker la fonction de nettoyage pour le label
            labelElement._cleanup = () => {
                window.removeEventListener('scroll', labelRepositionHandler);
                window.removeEventListener('resize', labelRepositionHandler);
            };
            
            this.highlightsContainer.appendChild(labelElement);
            
            // Stocker la référence au label dans le highlight pour le nettoyage
            highlight._labelElement = labelElement;
            
            // Animation du label
            setTimeout(() => {
                labelElement.classList.add('animate-in');
                labelElement.style.opacity = '1';
            }, (delay + 0.2) * 1000);
        }

        this.highlightsContainer.appendChild(highlight);
        
        // Déclencher l'animation
        setTimeout(() => {
            highlight.classList.add('animate-in');
            highlight.style.opacity = '1';
        }, delay * 1000);
    }

    createPremiumTooltip() {
        // Supprimer le tooltip existant
        if (this.helpTooltip) {
            this.helpTooltip.remove();
        }

        const tooltip = document.createElement('div');
        tooltip.innerHTML = `
            <div id="tools-help-inner" style="position: absolute; top: 150px !important; right: 500px !important; width: 380px; background: linear-gradient(145deg, #ffffff 0%, #fff8e1 50%, #fffbf0 100%); color: #bf360c; border: 3px solid transparent; background-clip: padding-box; border-radius: 20px; box-shadow: 0 25px 80px rgba(255, 152, 0, 0.25), 0 15px 35px rgba(255, 193, 7, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8); z-index: 99999 !important; font-family: 'Segoe UI', 'Apple Color Emoji', Tahoma, Geneva, Verdana, sans-serif; backdrop-filter: blur(15px); overflow: hidden;">
                        
                        <!-- En-tête avec dégradé premium -->
                        <div style="background: linear-gradient(135deg, #e65100 0%, #ff9800 35%, #ffb74d 70%, #ffcc02 100%); padding: 22px 28px; border-radius: 17px 17px 0 0; display: flex; justify-content: space-between; align-items: center; position: relative; overflow: hidden;">
                            <!-- Particules flottantes -->
                            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 25% 25%, rgba(255, 235, 59, 0.15) 2px, transparent 2px), radial-gradient(circle at 75% 75%, rgba(255, 183, 77, 0.15) 2px, transparent 2px); background-size: 30px 30px; opacity: 0.6; animation: float 6s ease-in-out infinite;"></div>
                            
                            <div style="display: flex; align-items: center; gap: 15px; font-weight: 800; font-size: 18px; color: white; z-index: 2; position: relative;">
                                <div style="background: linear-gradient(135deg, #fff59d 0%, #ffeb3b 50%, #ffc107 100%); padding: 12px; border-radius: 50%; backdrop-filter: blur(10px); box-shadow: 0 4px 15px rgba(255, 193, 7, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3); position: relative; animation: toolsPulse 2s ease-in-out infinite;">
                                    <i class="fas fa-tools" style="font-size: 18px; color: #bf360c; text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);"></i>
                                    <!-- Éclat rotatif -->
                                    <div style="position: absolute; top: 50%; left: 50%; width: 6px; height: 6px; background: radial-gradient(circle, #ffffff 0%, transparent 70%); transform: translate(-50%, -50%); border-radius: 50%; animation: sparkle 1.5s ease-in-out infinite;"></div>
                                </div>
                                <span style="text-shadow: 0 2px 4px rgba(0,0,0,0.3); background: linear-gradient(45deg, #ffffff, #fff3e0); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Guide Outils</span>
                            </div>
                            
                            <button class="close-help-btn" style="background: linear-gradient(135deg, rgba(255,235,59,0.4), rgba(255,193,7,0.6)); border: 2px solid rgba(255,255,255,0.3); color: white; font-size: 18px; cursor: pointer; padding: 10px; border-radius: 50%; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); backdrop-filter: blur(10px); z-index: 2; position: relative; box-shadow: 0 4px 12px rgba(255, 193, 7, 0.2);" onmouseover="this.style.transform='scale(1.1) rotate(90deg)'; this.style.background='linear-gradient(135deg, rgba(255,235,59,0.7), rgba(255,193,7,0.9))'" onmouseout="this.style.transform='scale(1) rotate(0deg)'; this.style.background='linear-gradient(135deg, rgba(255,235,59,0.4), rgba(255,193,7,0.6))'">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <!-- Corps avec effet glass morphism -->
                        <div style="padding: 28px; background: linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,248,225,0.9)); border-radius: 0 0 17px 17px; position: relative;">
                            <!-- Motif décoratif -->
                            <div style="position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #ff9800, #ffeb3b, #ff9800, transparent); opacity: 0.6;"></div>
                            
                            <h4 style="color: #e65100; margin-bottom: 22px; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; display: flex; align-items: center; gap: 12px; text-shadow: 0 1px 2px rgba(255, 152, 0, 0.1);">
                                <div style="width: 6px; height: 22px; background: linear-gradient(to bottom, #ffeb3b, #ff9800, #ffb74d); border-radius: 3px; box-shadow: 0 2px 6px rgba(255, 152, 0, 0.3); position: relative;">
                                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.6) 50%, transparent 70%); animation: toolsShimmer 2s ease-in-out infinite;"></div>
                                </div>
                                🔧 Guide d'utilisation premium
                            </h4>
                            
                            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,248,225,0.8), rgba(255,255,255,0.9)); padding: 20px 22px; margin: 16px 0; border-radius: 16px; border: 2px solid rgba(255, 152, 0, 0.1); box-shadow: 0 8px 25px rgba(255, 152, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8); font-size: 14px; line-height: 1.7; color: #bf360c; position: relative; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); overflow: hidden;" onmouseover="this.style.transform='translateY(-4px) scale(1.02)'; this.style.boxShadow='0 15px 40px rgba(255, 152, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)'; this.style.borderColor='rgba(255, 235, 59, 0.3)'" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 8px 25px rgba(255, 152, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)'; this.style.borderColor='rgba(255, 152, 0, 0.1)'">
                                <!-- Bordure animée -->
                                <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: linear-gradient(to bottom, #ffeb3b 0%, #ff9800 50%, #ffb74d 100%); border-radius: 0 8px 8px 0; box-shadow: 2px 0 8px rgba(255, 152, 0, 0.2);"></div>
                                <!-- Éclat de fond -->
                                <div style="position: absolute; top: -50%; right: -20%; width: 100px; height: 100px; background: radial-gradient(circle, rgba(255, 235, 59, 0.1) 0%, transparent 70%); border-radius: 50%; animation: toolsGlow 3s ease-in-out infinite;"></div>
                                
                                <div style="display: flex; align-items: flex-start; gap: 16px; position: relative; z-index: 1;">
                                    <div style="background: linear-gradient(135deg, #fff59d 0%, #ffeb3b 50%, #ffc107 100%); color: #bf360c; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; flex-shrink: 0; box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4); border: 2px solid rgba(255, 255, 255, 0.6); position: relative; animation: toolsBounce 2s ease-in-out infinite 0s;">
                                        🎯
                                        <!-- Effet de brillance -->
                                        <div style="position: absolute; top: 2px; left: 2px; width: 8px; height: 8px; background: rgba(255, 255, 255, 0.8); border-radius: 50%; animation: twinkle 1.5s ease-in-out infinite;"></div>
                                    </div>
                                    <div style="flex: 1; font-weight: 500;"><strong>Élément Actif 3D :</strong> Visualisez et gérez l'élément sélectionné avec aperçu 3D en temps réel</div>
                                </div>
                            </div>
                            
                            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,248,225,0.8), rgba(255,255,255,0.9)); padding: 20px 22px; margin: 16px 0; border-radius: 16px; border: 2px solid rgba(255, 152, 0, 0.1); box-shadow: 0 8px 25px rgba(255, 152, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8); font-size: 14px; line-height: 1.7; color: #bf360c; position: relative; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); overflow: hidden;" onmouseover="this.style.transform='translateY(-4px) scale(1.02)'; this.style.boxShadow='0 15px 40px rgba(255, 152, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)'; this.style.borderColor='rgba(255, 235, 59, 0.3)'" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 8px 25px rgba(255, 152, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)'; this.style.borderColor='rgba(255, 152, 0, 0.1)'">
                                <!-- Bordure animée -->
                                <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: linear-gradient(to bottom, #ffeb3b 0%, #ff9800 50%, #ffb74d 100%); border-radius: 0 8px 8px 0; box-shadow: 2px 0 8px rgba(255, 152, 0, 0.2);"></div>
                                <!-- Éclat de fond -->
                                <div style="position: absolute; top: -50%; right: -20%; width: 100px; height: 100px; background: radial-gradient(circle, rgba(255, 235, 59, 0.1) 0%, transparent 70%); border-radius: 50%; animation: toolsGlow 3s ease-in-out infinite;"></div>
                                
                                <div style="display: flex; align-items: flex-start; gap: 16px; position: relative; z-index: 1;">
                                    <div style="background: linear-gradient(135deg, #fff59d 0%, #ffeb3b 50%, #ffc107 100%); color: #bf360c; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; flex-shrink: 0; box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4); border: 2px solid rgba(255, 255, 255, 0.6); position: relative; animation: toolsBounce 2s ease-in-out infinite 0.2s;">
                                        📚
                                        <!-- Effet de brillance -->
                                        <div style="position: absolute; top: 2px; left: 2px; width: 8px; height: 8px; background: rgba(255, 255, 255, 0.8); border-radius: 50%; animation: twinkle 1.5s ease-in-out infinite;"></div>
                                    </div>
                                    <div style="flex: 1; font-weight: 500;"><strong>Gestion des Assises :</strong> Ajoutez, supprimez et naviguez entre les assises de construction</div>
                                </div>
                            </div>
                            
                            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,248,225,0.8), rgba(255,255,255,0.9)); padding: 20px 22px; margin: 16px 0; border-radius: 16px; border: 2px solid rgba(255, 152, 0, 0.1); box-shadow: 0 8px 25px rgba(255, 152, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8); font-size: 14px; line-height: 1.7; color: #bf360c; position: relative; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); overflow: hidden;" onmouseover="this.style.transform='translateY(-4px) scale(1.02)'; this.style.boxShadow='0 15px 40px rgba(255, 152, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)'; this.style.borderColor='rgba(255, 235, 59, 0.3)'" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 8px 25px rgba(255, 152, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)'; this.style.borderColor='rgba(255, 152, 0, 0.1)'">
                                <!-- Bordure animée -->
                                <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: linear-gradient(to bottom, #ffeb3b 0%, #ff9800 50%, #ffb74d 100%); border-radius: 0 8px 8px 0; box-shadow: 2px 0 8px rgba(255, 152, 0, 0.2);"></div>
                                <!-- Éclat de fond -->
                                <div style="position: absolute; top: -50%; right: -20%; width: 100px; height: 100px; background: radial-gradient(circle, rgba(255, 235, 59, 0.1) 0%, transparent 70%); border-radius: 50%; animation: toolsGlow 3s ease-in-out infinite;"></div>
                                
                                <div style="display: flex; align-items: flex-start; gap: 16px; position: relative; z-index: 1;">
                                    <div style="background: linear-gradient(135deg, #fff59d 0%, #ffeb3b 50%, #ffc107 100%); color: #bf360c; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; flex-shrink: 0; box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4); border: 2px solid rgba(255, 255, 255, 0.6); position: relative; animation: toolsBounce 2s ease-in-out infinite 0.4s;">
                                        👁️
                                        <!-- Effet de brillance -->
                                        <div style="position: absolute; top: 2px; left: 2px; width: 8px; height: 8px; background: rgba(255, 255, 255, 0.8); border-radius: 50%; animation: twinkle 1.5s ease-in-out infinite;"></div>
                                    </div>
                                    <div style="flex: 1; font-weight: 500;"><strong>Aides Visuelles :</strong> Grilles, points d'accroche et guides de construction</div>
                                </div>
                            </div>
                            
                            <div style="text-align: center; padding-top: 24px; border-top: 2px solid rgba(255, 152, 0, 0.1); margin-top: 20px; position: relative;">
                                <!-- Décoration du bouton -->
                                <div style="position: absolute; top: -1px; left: 50%; transform: translateX(-50%); width: 60px; height: 2px; background: linear-gradient(90deg, transparent, #ffeb3b, transparent);"></div>
                                
                                <button class="confirm-help-btn" style="background: linear-gradient(135deg, #e65100 0%, #ff9800 35%, #ffb74d 70%, #ffcc02 100%); color: white; border: 3px solid rgba(255, 235, 59, 0.4); padding: 16px 35px; border-radius: 50px; font-weight: 700; cursor: pointer; font-size: 15px; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); box-shadow: 0 8px 25px rgba(255, 152, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2); letter-spacing: 0.8px; text-transform: uppercase; position: relative; overflow: hidden;" onmouseover="this.style.transform='translateY(-3px) scale(1.05)'; this.style.boxShadow='0 15px 40px rgba(255, 152, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'; this.style.borderColor='rgba(255, 235, 59, 0.8)'" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 8px 25px rgba(255, 152, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'; this.style.borderColor='rgba(255, 235, 59, 0.4)'">
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
            const helpElements = document.querySelectorAll('[id^="tools-help"]');
            helpElements.forEach(el => {
                el.style.position = 'fixed';
                el.style.top = '150px';
                el.style.right = '700px'; // Décalage d'1/3 plus vers la gauche (500 + 200)
                el.style.left = 'auto';
                el.style.transform = 'none';
                el.style.zIndex = '99999';
            });
            // console.log(\'🔧 Position forcée appliquée - fenêtre outils positionnée plus à gauche');
        }, 100);

        // Ajouter les écouteurs d'événements
        const closeBtn = tooltip.querySelector('.close-help-btn');
        const confirmBtn = tooltip.querySelector('.confirm-help-btn');

        if (closeBtn) closeBtn.addEventListener('click', () => this.hideHelp());
        if (confirmBtn) confirmBtn.addEventListener('click', () => {
            // Marquer que l'utilisateur a compris le guide des outils
            localStorage.setItem('walSim3D_toolsHelpCompleted', 'true');
            // console.log(\'🔧 Guide outils marqué comme complété - ne réapparaîtra plus');
            this.hideHelp();
        });

        // SUPPRESSION DU TIMEOUT AUTOMATIQUE - L'aide reste ouverte jusqu'à ce que l'utilisateur la ferme
        // console.log(\'🔧 Aide outils créée sans timeout automatique');
    }

    hideHelp() {
        // console.log(\'🔧 hideHelp() appelée, isVisible =', this.isVisible, 'ID =', this.systemId);
        // console.trace('🔧 Stack trace pour hideHelp():'); // Voir qui appelle cette méthode
        
        // Protection contre les appels multiples
        if (this.preventInterference) {
            // console.log(\'🔧 Interférence détectée, abandon de hideHelp()');
            return;
        }
        
        if (!this.isVisible) {
            // console.log(\'🔧 Aide déjà masquée, arrêt');
            return;
        }

        this.preventInterference = true; // Bloquer les autres appels
        this.isVisible = false;
        // console.log(\'🔧 Début de masquage de l\'aide');
        
        // Animation de sortie pour la tooltip
        if (this.helpTooltip) {
            this.helpTooltip.style.animation = 'toolsMaterialEntrance 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) reverse';
            setTimeout(() => {
                if (this.helpTooltip) {
                    this.helpTooltip.remove();
                    this.helpTooltip = null;
                }
            }, 300);
        }
        
        // Supprimer les surlignages
        this.removeVisualHighlights();
        
        // console.log(\'🔧 Tools help hidden, réinitialisation du flag d\'interférence');
        
        // Réinitialiser le flag après un délai
        setTimeout(() => {
            this.preventInterference = false;
            // console.log(\'🔧 Flag d\'interférence réinitialisé');
        }, 100);
    }

    removeVisualHighlights() {
        if (this.highlightsContainer) {
            // Supprimer les écouteurs de scroll globaux
            if (this.hideOnScrollHandler) {
                window.removeEventListener('scroll', this.hideOnScrollHandler);
                window.removeEventListener('wheel', this.hideOnScrollHandler);
                const toolsContent = document.querySelector('#tab-content-outils');
                if (toolsContent) {
                    toolsContent.removeEventListener('scroll', this.hideOnScrollHandler);
                    toolsContent.removeEventListener('wheel', this.hideOnScrollHandler);
                }
                this.hideOnScrollHandler = null;
                // console.log(\'🔧 Écouteurs de scroll et wheel supprimés');
            }
            
            // Nettoyer les écouteurs d'événements de chaque highlight ET de leurs labels
            const highlights = this.highlightsContainer.querySelectorAll('.tools-highlight-box');
            highlights.forEach(highlight => {
                if (highlight._cleanup) {
                    highlight._cleanup();
                }
                // Nettoyer aussi le label associé
                if (highlight._labelElement && highlight._labelElement._cleanup) {
                    highlight._labelElement._cleanup();
                }
            });
            
            // Nettoyer aussi les labels orphelins
            const labels = this.highlightsContainer.querySelectorAll('.tools-highlight-label');
            labels.forEach(label => {
                if (label._cleanup) {
                    label._cleanup();
                }
            });
            
            this.highlightsContainer.remove();
            this.highlightsContainer = null;
            // console.log(\'🔧 Surlignages responsives supprimés avec nettoyage complet des écouteurs');
        }
        
        // Supprimer aussi tous les éléments de surlignage orphelins
        document.querySelectorAll('#tools-highlights-container, .tools-highlight-box, .tools-highlight-label').forEach(el => {
            el.remove();
        });
    }
}

// Initialiser le système d'aide des outils - SINGLETON
if (!window.toolsHelpSystem) {
    window.toolsHelpSystem = new ToolsHelpSystem();
    // console.log(\'🔧 Nouvelle instance Tools Help System créée');
} else {
    // console.log(\'🔧 Instance Tools Help System déjà existante');
}

// Méthode globale pour initialiser l'aide depuis l'extérieur
window.initToolsHelp = function() {
    // console.log(\'🔧 initToolsHelp() appelée depuis l\'extérieur');
    if (window.toolsHelpSystem) {
        window.toolsHelpSystem.forceShowHelp();
    }
};

// S'assurer que l'aide se déclenche SEULEMENT après completion de l'onboarding
document.addEventListener('DOMContentLoaded', function() {
    // console.log(\'🔧 DOMContentLoaded - système d\'aide outils prêt (pas d\'auto-déclenchement)');
    // Plus de déclenchement automatique - uniquement via onboardingComplete
});

// Fonction de test globale pour débugger
window.testToolsHelp = function() {
    // console.log(\'=== TEST TOOLS HELP ===');
    // console.log(\'Tools help system:', window.toolsHelpSystem);
    // console.log(\'Is visible:', window.toolsHelpSystem.isVisible);
    
    const toolsTab = document.querySelector('[data-tab="outils"]');
    const toolsContent = document.querySelector('#tab-content-outils');
    // console.log(\'Tools tab:', toolsTab);
    // console.log(\'Tools tab active:', toolsTab ? toolsTab.classList.contains('active') : 'not found');
    // console.log(\'Tools content:', toolsContent);
    // console.log(\'Tools content active:', toolsContent ? toolsContent.classList.contains('active') : 'not found');
    
    const onboardingOverlay = document.querySelector('#onboarding-overlay, .onboarding-overlay');
    // console.log(\'Onboarding overlay:', onboardingOverlay);
    // console.log(\'Onboarding active:', onboardingOverlay ? onboardingOverlay.style.display !== 'none' : 'not found');
    
    // console.log(\'Forcing help display...');
    window.toolsHelpSystem.forceShowHelp();
};

// Fonction pour simuler la fin de l'onboarding
window.testOnboardingComplete = function() {
    // console.log(\'=== TEST ONBOARDING COMPLETE ===');
    const event = new CustomEvent('onboardingComplete');
    document.dispatchEvent(event);
    // console.log(\'Événement onboardingComplete émis manuellement');
};
