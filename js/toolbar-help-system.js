/**
 * Système d'aide contextuelle pour l'onglet Outils
 * Se déclenche après la fin de l'onboarding
 * Style premium avec animations et effets visuels
 */
class ToolbarHelpSystem {
    constructor() {
        this.isVisible = false;
        this.helpTooltip = null;
        this.highlightsContainer = null;
        this.hasBeenShown = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.addAnimationStyles();
        // console.log(\'🛠️ Toolbar Help System initialized');
        
        // DÉCLENCHEUR MANUEL POUR TESTS
        window.showToolbarHelp = () => this.showToolbarHelp();
        window.hideToolbarHelp = () => this.hideHelp();
    }

    addAnimationStyles() {
        if (document.querySelector('#toolbar-help-premium-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'toolbar-help-premium-styles';
        styles.textContent = `
            @keyframes toolbarEntrance {
                0% { 
                    opacity: 0; 
                    transform: translateY(-50%) translateX(-100px) scale(0.8); 
                    filter: blur(10px); 
                }
                60% { 
                    transform: translateY(-50%) translateX(10px) scale(1.02); 
                }
                100% { 
                    opacity: 1; 
                    transform: translateY(-50%) translateX(0) scale(1); 
                    filter: blur(0px); 
                }
            }

            @keyframes toolHighlight {
                0%, 100% { 
                    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
                    background-color: rgba(76, 175, 80, 0.1);
                }
                50% { 
                    box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
                    background-color: rgba(76, 175, 80, 0.3);
                }
            }

            .toolbar-highlight-pulse {
                animation: toolHighlight 2s infinite;
                border-radius: 12px !important;
                transition: all 0.3s ease;
            }
        `;
        document.head.appendChild(styles);
    }

    setupEventListeners() {
        // AIDE TOOLBAR DÉSACTIVÉE - Plus de déclenchement automatique après onboarding
        // document.addEventListener('onboardingComplete', () => {
        //     // console.log(\'🛠️ Onboarding terminé, déclenchement aide toolbar après délai');
        //     // Attendre un peu que l'utilisateur voit que l'onboarding est fini
        //     setTimeout(() => {
        //         this.showToolbarHelp();
        //     }, 2000);
        // });

        // ÉCOUTE DÉSACTIVÉE - Plus d'aide toolbar automatique
        // Écouter les clics sur l'onglet Outils pour déclencher l'aide (désactivé aussi)
        // const outilsTab = document.querySelector('[data-tab="outils"]');
        // if (outilsTab) {
        //     outilsTab.addEventListener('click', (e) => {
        //         // Si l'aide n'a jamais été montrée, la déclencher
        //         if (!this.hasBeenShown) {
        //             setTimeout(() => {
        //                 this.showToolbarHelp();
        //             }, 300);
        //         }
        //     });
        // }

        // console.log(\'🛠️ Toolbar Help System - Écouteurs désactivés (pas d\'aide toolbar)');

        // Fermer l'aide quand on change d'onglet principal
        const tabButtons = document.querySelectorAll('[data-tab]');
        tabButtons.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-tab');
                if (tabId !== 'outils' && this.isVisible) {
                    setTimeout(() => {
                        this.hideHelp();
                    }, 100);
                }
            });
        });
    }

    showToolbarHelp() {
        // console.log(\'🛠️ showToolbarHelp() appelée - DÉSACTIVÉ');
        
        // SYSTÈME DÉSACTIVÉ - Ne plus afficher la fenêtre de guide de la barre d'outils
        // Les cadres d'aide et bulles de texte restent disponibles via HelpSystem
        return;
        
        // Code original commenté ci-dessous
        /*
        // console.log(\'🛠️ showToolbarHelp() appelée, isVisible:', this.isVisible);
        
        if (this.isVisible) {
            // console.log(\'🛠️ Aide déjà visible, arrêt');
            return;
        }
        
        // console.log(\'🛠️ Affichage aide toolbar');
        this.isVisible = true;
        this.hasBeenShown = true;
        
        // S'assurer que l'onglet Outils est ouvert
        const outilsTab = document.querySelector('[data-tab="outils"]');
        // console.log(\'🛠️ Onglet outils trouvé:', !!outilsTab);
        
        if (outilsTab && !outilsTab.classList.contains('active')) {
            // console.log(\'🛠️ Ouverture de l\'onglet outils');
            outilsTab.click();
            // Attendre que l'onglet s'ouvre
            setTimeout(() => {
                this.createVisualHighlights();
                this.createPremiumTooltip();
            }, 400);
        } else {
            // console.log(\'🛠️ Création directe des éléments visuels');
            this.createVisualHighlights();
            this.createPremiumTooltip();
        }
        */
    }

    createVisualHighlights() {
        // console.log(\'🛠️ createVisualHighlights() appelée');
        
        // Supprimer les anciens surlignages
        this.removeVisualHighlights();
        
        // Créer le conteneur de surlignages
        this.highlightsContainer = document.createElement('div');
        this.highlightsContainer.id = 'toolbar-highlights-container';
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
        // console.log(\'🛠️ Conteneur de surlignages créé et ajouté au DOM');

        // Attendre un frame pour que le DOM soit mis à jour
        requestAnimationFrame(() => {
            this.createToolHighlights();
        });
    }

    createToolHighlights() {
        // console.log(\'🛠️ createToolHighlights() appelée');
        
        // Surligner les outils principaux de la toolbar
        const toolsToHighlight = [
            { selector: '#selectTool', label: '1️⃣ Sélectionner', color: '#2196F3', description: 'Sélectionner et déplacer des éléments' },
            { selector: '#moveTool', label: '2️⃣ Déplacer', color: '#FF9800', description: 'Déplacer des éléments existants' },
            { selector: '#duplicateTool', label: '3️⃣ Dupliquer', color: '#4CAF50', description: 'Créer des copies d\'éléments' },
            { selector: '#deleteTool', label: '4️⃣ Supprimer', color: '#F44336', description: 'Supprimer des éléments' },
            { selector: '#materialPaintMode', label: '5️⃣ Pinceau', color: '#9C27B0', description: 'Appliquer des matériaux' },
            { selector: '#measureTool', label: '6️⃣ Mesurer', color: '#00BCD4', description: 'Prendre des mesures précises' },
            { selector: '#annotationTool', label: '7️⃣ Annoter', color: '#8BC34A', description: 'Ajouter des annotations' },
            { selector: '#textLeaderTool', label: '8️⃣ Ligne de rappel', color: '#FF5722', description: 'Créer des annotations avec lignes' }
        ];

        let foundTools = 0;
        toolsToHighlight.forEach((tool, index) => {
            const element = document.querySelector(tool.selector);
            if (element) {
                foundTools++;
                // console.log(\`🛠️ Outil trouvé: ${tool.selector}`);
                this.createToolHighlight(element, tool, index);
            } else {
                // console.log(\`❌ Outil non trouvé: ${tool.selector}`);
            }
        });
        
        // console.log(\`🛠️ Total outils trouvés: ${foundTools}/${toolsToHighlight.length}`);
    }

    createToolHighlight(element, toolInfo, index) {
        const rect = element.getBoundingClientRect();
        
        // Créer le highlight
        const highlight = document.createElement('div');
        highlight.style.cssText = `
            position: absolute;
            left: ${rect.left - 8}px;
            top: ${rect.top - 8}px;
            width: ${rect.width + 16}px;
            height: ${rect.height + 16}px;
            border: 3px solid ${toolInfo.color};
            border-radius: 12px;
            pointer-events: none;
            animation: toolHighlight 2s infinite;
            animation-delay: ${index * 0.2}s;
            z-index: 9999;
        `;
        
        // Créer le label
        const label = document.createElement('div');
        label.style.cssText = `
            position: absolute;
            left: ${rect.right + 15}px;
            top: ${rect.top + (rect.height / 2) - 20}px;
            background: linear-gradient(135deg, ${toolInfo.color}, ${toolInfo.color}CC);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            white-space: nowrap;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            animation: toolbarEntrance 0.6s ease-out;
            animation-delay: ${index * 0.1 + 0.3}s;
            animation-fill-mode: both;
            backdrop-filter: blur(10px);
            z-index: 10000;
        `;
        label.textContent = toolInfo.label;
        
        this.highlightsContainer.appendChild(highlight);
        this.highlightsContainer.appendChild(label);
    }

    createPremiumTooltip() {
        // console.log(\'🛠️ createPremiumTooltip() appelée');
        
        this.helpTooltip = document.createElement('div');
        this.helpTooltip.id = 'toolbar-help-tooltip';
        this.helpTooltip.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50px;
            transform: translateY(-50%);
            width: 420px;
            background: linear-gradient(145deg, #ffffff 0%, #f0fff4 50%, #fefff8 100%);
            color: #1a4731;
            border: 3px solid transparent;
            background-clip: padding-box;
            border-radius: 20px;
            box-shadow: 0 25px 80px rgba(67, 160, 71, 0.25), 0 15px 35px rgba(255, 235, 59, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8);
            z-index: 10001;
            font-family: 'Segoe UI', 'Apple Color Emoji', Tahoma, Geneva, Verdana, sans-serif;
            animation: toolbarEntrance 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            backdrop-filter: blur(20px);
            border-image: linear-gradient(45deg, rgba(67, 160, 71, 0.6), rgba(255, 235, 59, 0.4), rgba(102, 187, 106, 0.5)) 1;
            overflow: hidden;
        `;

        this.helpTooltip.innerHTML = `
            <!-- En-tête avec dégradé premium -->
            <div style="background: linear-gradient(135deg, #1976d2 0%, #42a5f5 35%, #64b5f6 70%, #90caf9 100%); padding: 22px 28px; border-radius: 17px 17px 0 0; display: flex; justify-content: space-between; align-items: center; position: relative; overflow: hidden;">
                <!-- Particules flottantes -->
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.15) 2px, transparent 2px), radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 2px, transparent 2px); background-size: 30px 30px; opacity: 0.6; animation: float 6s ease-in-out infinite;"></div>
                
                <div style="display: flex; align-items: center; gap: 15px; font-weight: 800; font-size: 18px; color: white; z-index: 2; position: relative;">
                    <div style="background: rgba(255,255,255,0.25); border-radius: 12px; padding: 8px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                        🛠️
                    </div>
                    <span style="text-shadow: 0 2px 4px rgba(0,0,0,0.1); letter-spacing: 0.5px;">Découvrez les Outils</span>
                </div>
                
                <button onclick="window.ToolbarHelpSystem.hideHelp()" style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.8); font-size: 16px; cursor: pointer; padding: 10px; border-radius: 12px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); backdrop-filter: blur(10px); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;" onmouseover="this.style.background='rgba(255,255,255,0.25)'; this.style.transform='scale(1.1) rotate(90deg)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'; this.style.transform='scale(1) rotate(0deg)'">
                    ✕
                </button>
            </div>
            
            <!-- Contenu principal -->
            <div style="padding: 28px; line-height: 1.6;">
                <div style="background: linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(100, 181, 246, 0.05)); padding: 20px; border-radius: 16px; border-left: 4px solid #1976d2; margin-bottom: 24px;">
                    <h3 style="margin: 0 0 12px 0; color: #1976d2; font-size: 16px; font-weight: 700;">🎯 Outils de Construction</h3>
                    <p style="margin: 0; color: #37474f; font-size: 14px;">
                        Utilisez ces outils pour modifier, mesurer et annoter votre construction. Chaque outil a une fonction spécifique pour vous aider à créer des projets précis.
                    </p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
                    <div style="background: rgba(33, 150, 243, 0.08); padding: 12px; border-radius: 10px; border-left: 3px solid #2196F3;">
                        <span style="font-weight: 600; color: #1976d2;">🔧 Modification</span>
                        <div style="font-size: 12px; color: #546e7a; margin-top: 4px;">Sélectionner, déplacer, dupliquer, supprimer</div>
                    </div>
                    <div style="background: rgba(0, 188, 212, 0.08); padding: 12px; border-radius: 10px; border-left: 3px solid #00BCD4;">
                        <span style="font-weight: 600; color: #0097a7;">📏 Mesures</span>
                        <div style="font-size: 12px; color: #546e7a; margin-top: 4px;">Outils de cotation précise</div>
                    </div>
                    <div style="background: rgba(156, 39, 176, 0.08); padding: 12px; border-radius: 10px; border-left: 3px solid #9C27B0;">
                        <span style="font-weight: 600; color: #7b1fa2;">🎨 Matériaux</span>
                        <div style="font-size: 12px; color: #546e7a; margin-top: 4px;">Application de textures et couleurs</div>
                    </div>
                    <div style="background: rgba(139, 195, 74, 0.08); padding: 12px; border-radius: 10px; border-left: 3px solid #8BC34A;">
                        <span style="font-weight: 600; color: #689f38;">💭 Annotations</span>
                        <div style="font-size: 12px; color: #546e7a; margin-top: 4px;">Textes et lignes de rappel</div>
                    </div>
                </div>
                
                <div style="background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 235, 59, 0.05)); padding: 16px; border-radius: 12px; border: 1px solid rgba(255, 193, 7, 0.2); text-align: center;">
                    <div style="font-size: 14px; color: #f57c00; font-weight: 600; margin-bottom: 8px;">💡 Astuce</div>
                    <div style="font-size: 13px; color: #5d4037; line-height: 1.5;">
                        Cliquez à nouveau sur un outil actif pour le désactiver et revenir au mode précédent !
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.helpTooltip);
        
        // Auto-hide après 15 secondes
        setTimeout(() => {
            if (this.isVisible) {
                this.hideHelp();
            }
        }, 15000);
    }

    hideHelp() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        
        // Supprimer le tooltip
        if (this.helpTooltip) {
            this.helpTooltip.remove();
            this.helpTooltip = null;
        }
        
        this.removeVisualHighlights();
        
        // console.log(\'🛠️ Aide toolbar masquée');
    }

    removeVisualHighlights() {
        if (this.highlightsContainer) {
            this.highlightsContainer.remove();
            this.highlightsContainer = null;
        }
    }
}

// Initialiser le système d'aide toolbar
window.ToolbarHelpSystem = new ToolbarHelpSystem();
