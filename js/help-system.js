/**
 * Système d'aide contextuelle pour WallSim3D
 * Affiche des guides interactifs pour chaque outil
 */

class HelpSystem {
    constructor() {
        this.helpPanel = null;
        this.currentTool = null;
        this.isVisible = false;
        this.helpData = this.initHelpData();
        this.toolActivationListener = null;
        this.debugMode = true; // Mode debug activé
        this.init();
    }

    init() {
        console.log('🚀 Initialisation système d\'aide...');
        this.createHelpPanel();
        this.bindToolEvents();
        this.markToolsWithHelp();
        this.showWelcomeNotification();
        // this.watchToolActivations(); // Désactivé temporairement car cause trop de déclenchements
        
        // Test de diagnostic (sans affichage automatique)
        // setTimeout(() => this.testHelpSystem(), 2000); // Désactivé pour éviter l'affichage au démarrage
    }

    initHelpData() {
        return {
            selectTool: {
                title: "Outil Sélection",
                icon: "fas fa-mouse-pointer",
                steps: [
                    "🖱️ CLIC 1 : Cliquez sur un élément (brique, bloc, joint) pour le sélectionner",
                    "✨ Résultat : L'élément se met en surbrillance avec un contour coloré",
                    "📋 CLIC 2 : Les propriétés apparaissent automatiquement dans l'onglet 'Propriétés'",
                    "🔄 DOUBLE-CLIC : Sur un élément pour accéder aux options de modification rapide",
                    "🖱️ CLIC dans le vide : Pour désélectionner tous les éléments"
                ],
                tips: [
                    "💡 CTRL + CLIC : Pour sélectionner plusieurs éléments en même temps",
                    "🎯 Utilisez la sélection multiple pour appliquer des modifications groupées",
                    "🔍 L'élément sélectionné affiche ses dimensions dans la barre de statut"
                ]
            },
            moveTool: {
                title: "Outil Déplacement",
                icon: "fas fa-arrows-alt",
                steps: [
                    "🎯 ÉTAPE 1 : Sélectionnez d'abord un élément avec l'outil de sélection",
                    "🖱️ CLIC 1 : Cliquez sur l'outil de déplacement pour l'activer",
                    "✋ CLIC 2 : Cliquez et MAINTENEZ le bouton sur l'élément à déplacer",
                    "↔️ GLISSEMENT : Déplacez la souris vers la nouvelle position",
                    "✅ RELÂCHEMENT : Relâchez le bouton pour confirmer le déplacement"
                ],
                tips: [
                    "🎯 Le déplacement s'accroche automatiquement à la grille",
                    "⌨️ SHIFT + Glissement : Pour un déplacement libre sans grille",
                    "📏 Les coordonnées s'affichent en temps réel pendant le déplacement"
                ]
            },
            deleteTool: {
                title: "Outil Suppression",
                icon: "fas fa-trash",
                steps: [
                    "🖱️ CLIC 1 : Cliquez sur l'outil de suppression pour l'activer",
                    "🎯 CLIC 2 : Cliquez sur l'élément que vous voulez supprimer",
                    "⚠️ CONFIRMATION : Une boîte de dialogue peut apparaître",
                    "✅ CLIC 3 : Cliquez sur 'Confirmer' pour valider la suppression",
                    "🗑️ Résultat : L'élément disparaît définitivement du projet"
                ],
                tips: [
                    "⚡ RACCOURCI : Sélectionnez un élément puis appuyez sur 'Suppr'",
                    "↩️ CTRL+Z : Pour annuler une suppression accidentelle",
                    "🔒 Certains éléments verrouillés ne peuvent pas être supprimés"
                ]
            },
            duplicateTool: {
                title: "Outil Duplication",
                icon: "fas fa-copy",
                steps: [
                    "🎯 ÉTAPE 1 : Sélectionnez l'élément à dupliquer avec l'outil sélection",
                    "🖱️ CLIC 1 : Cliquez sur l'outil de duplication pour l'activer",
                    "📍 CLIC 2 : Cliquez à l'endroit où vous voulez placer la copie",
                    "✨ Résultat : Une copie identique apparaît à la position choisie",
                    "🔄 RÉPÉTITION : Répétez les CLICS 2 pour créer plusieurs copies"
                ],
                tips: [
                    "⚡ RACCOURCI : CTRL+D après avoir sélectionné un élément",
                    "🔄 Toutes les propriétés sont copiées (matériau, dimensions, etc.)",
                    "📐 La copie respecte l'orientation et l'alignement de l'original"
                ]
            },
            measureTool: {
                title: "Outil de Mesure",
                icon: "fas fa-ruler",
                steps: [
                    "🖱️ CLIC 1 : Cliquez sur l'outil de mesure pour l'activer",
                    "📏 CLIC 2 : Cliquez sur le point de DÉPART de votre mesure",
                    "🖱️ MOUVEMENT : Déplacez la souris vers le point d'arrivée",
                    "📐 APERÇU : La distance s'affiche en temps réel pendant le mouvement",
                    "✅ CLIC 3 : Cliquez sur le point d'ARRIVÉE pour finaliser la mesure",
                    "📊 Résultat : La cotation permanente s'affiche avec la distance exacte"
                ],
                tips: [
                    "� Les mesures s'affichent en centimètres par défaut",
                    "👁️ Utilisez les calques pour organiser vos cotations",
                    "🎯 Accrochez-vous aux points d'intersection pour plus de précision"
                ]
            },
            annotationTool: {
                title: "Outil d'Annotation",
                icon: "fas fa-sticky-note",
                steps: [
                    "�️ CLIC 1 : Cliquez sur l'outil d'annotation pour l'activer",
                    "📝 CLIC 2 : Cliquez à l'endroit où vous voulez placer votre note",
                    "⌨️ SAISIE : Une zone de texte apparaît - tapez votre annotation",
                    "🎨 OPTION : Choisissez une couleur si vous le souhaitez",
                    "✅ CLIC 3 : Cliquez ailleurs ou appuyez sur Entrée pour valider",
                    "📌 Résultat : Votre annotation est fixée à la position choisie"
                ],
                tips: [
                    "🏷️ Parfait pour noter des détails techniques importants",
                    "📏 La taille du texte s'adapte automatiquement au contenu",
                    "✏️ Double-cliquez sur une annotation existante pour la modifier"
                ]
            },
            textLeaderTool: {
                title: "Outil Texte avec Ligne de Rappel",
                icon: "fas fa-font",
                steps: [
                    "🖱️ CLIC 1 : Cliquez sur l'outil pour l'activer",
                    "📍 CLIC 2 : Cliquez sur l'élément que vous voulez annoter",
                    "↗️ GLISSEMENT : Déplacez la souris pour positionner le texte",
                    "📝 CLIC 3 : Cliquez pour fixer la position du texte",
                    "⌨️ SAISIE : Tapez votre annotation dans la zone qui apparaît",
                    "✅ VALIDATION : Appuyez sur Entrée ou cliquez ailleurs",
                    "🔗 Résultat : Une ligne relie automatiquement le texte à l'élément"
                ],
                tips: [
                    "🎯 Idéal pour légender des détails techniques spécifiques",
                    "✏️ Double-cliquez sur le texte pour le modifier plus tard",
                    "🎨 La ligne de rappel s'ajuste automatiquement si vous bougez l'élément"
                ]
            },
            materialPaintMode: {
                title: "Mode Pinceau - Peinture de Matériaux",
                icon: "fas fa-paint-brush",
                steps: [
                    "🖱️ CLIC 1 : Cliquez sur l'outil pinceau pour activer le mode",
                    "🧱 CLIC 2 : Dans la bibliothèque, cliquez sur le matériau souhaité",
                    "✨ Indication : Le curseur change et montre le matériau sélectionné",
                    "🖌️ CLIC 3 : Cliquez sur l'élément (brique/bloc) à peindre",
                    "🎨 Résultat : Le nouveau matériau est appliqué instantanément",
                    "🔄 RÉPÉTITION : Continuez à cliquer sur d'autres éléments",
                    "⎋ SORTIE : Appuyez sur Échap ou recliquez le pinceau pour désactiver"
                ],
                tips: [
                    "🚀 Très pratique pour tester différents matériaux rapidement",
                    "🎯 Le mode reste actif jusqu'à ce que vous le désactiviez",
                    "👁️ L'aperçu 3D de la bibliothèque aide à choisir le bon matériau"
                ]
            }
        };
    }

    createHelpPanel() {
        // Créer le conteneur principal
        this.helpPanel = document.createElement('div');
        this.helpPanel.className = 'help-panel';
        this.helpPanel.id = 'helpPanel';
        this.helpPanel.innerHTML = `
            <div class="help-panel-header">
                <div class="help-panel-title">
                    <i id="helpIcon" class="fas fa-question-circle"></i>
                    <span id="helpTitle">Guide d'utilisation</span>
                </div>
                <button id="closeHelp" class="help-close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="help-panel-content">
                <div id="helpSteps" class="help-steps"></div>
                <div id="helpTips" class="help-tips"></div>
                <div class="help-panel-footer">
                    <button id="helpGotIt" class="help-got-it-btn">
                        <i class="fas fa-check"></i> J'ai compris
                    </button>
                </div>
            </div>
        `;

        // Ajouter le CSS
        this.addHelpStyles();

        // Ajouter au body
        document.body.appendChild(this.helpPanel);

        // Bind des événements
        this.bindHelpEvents();
    }

    addHelpStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .help-panel {
                position: fixed;
                top: 50%;
                right: 20px;
                transform: translateY(-50%);
                width: 350px;
                max-height: 80vh;
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                border: 1px solid #3498db;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                z-index: 10000;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: white;
                display: none;
                overflow: hidden;
                backdrop-filter: blur(10px);
            }

            .help-panel-header {
                background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }

            .help-panel-title {
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: 600;
                font-size: 16px;
            }

            .help-close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
                transition: background-color 0.2s;
            }

            .help-close-btn:hover {
                background-color: rgba(255,255,255,0.2);
            }

            .help-panel-content {
                padding: 20px;
                max-height: 60vh;
                overflow-y: auto;
            }

            .help-steps {
                margin-bottom: 20px;
            }

            .help-steps h4 {
                color: #3498db;
                margin-bottom: 12px;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .help-step {
                background: rgba(255,255,255,0.05);
                padding: 12px 15px;
                margin: 8px 0;
                border-radius: 8px;
                border-left: 3px solid #3498db;
                font-size: 14px;
                line-height: 1.5;
                position: relative;
            }

            .help-step:hover {
                background: rgba(255,255,255,0.08);
                border-left-color: #2980b9;
            }

            /* Mise en évidence des mots-clés importants */
            .help-step strong,
            .help-tip strong {
                color: #f1c40f;
                font-weight: 700;
                background: rgba(241,196,15,0.1);
                padding: 2px 4px;
                border-radius: 3px;
            }

            /* Style spécial pour les numéros de clic */
            .help-step:contains("CLIC"),
            .help-step:contains("ÉTAPE") {
                border-left-color: #e74c3c;
            }

            .help-tips h4 {
                color: #f39c12;
                margin-bottom: 12px;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .help-tip {
                background: rgba(243,156,18,0.1);
                padding: 10px 15px;
                margin: 6px 0;
                border-radius: 6px;
                border-left: 3px solid #f39c12;
                font-size: 13px;
                line-height: 1.4;
            }

            .help-panel-footer {
                text-align: center;
                padding-top: 15px;
                border-top: 1px solid rgba(255,255,255,0.1);
            }

            .help-got-it-btn {
                background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 25px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 0 auto;
            }

            .help-got-it-btn:hover {
                background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(46,204,113,0.3);
            }

            .help-panel.show {
                display: block;
                animation: helpSlideIn 0.3s ease-out;
            }

            .help-panel.hide {
                animation: helpSlideOut 0.3s ease-in forwards;
            }

            /* Indicator pour les outils avec aide disponible */
            .tool-button[data-has-help="true"]:hover::after {
                content: "❓";
                position: absolute;
                top: -8px;
                right: -8px;
                background: #3498db;
                color: white;
                border-radius: 50%;
                width: 18px;
                height: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                z-index: 1000;
                animation: helpIndicatorPulse 2s infinite;
            }

            @keyframes helpIndicatorPulse {
                0%, 100% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.1); opacity: 1; }
            }

            @keyframes helpSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(100%) translateY(-50%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0) translateY(-50%);
                }
            }

            @keyframes helpSlideOut {
                from {
                    opacity: 1;
                    transform: translateX(0) translateY(-50%);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%) translateY(-50%);
                }
            }

            /* Responsive */
            @media (max-width: 768px) {
                .help-panel {
                    right: 10px;
                    left: 10px;
                    width: auto;
                    max-width: 400px;
                    margin: 0 auto;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Surveiller l'activation des outils de manière proactive
    watchToolActivations() {
        console.log('👁️ Démarrage de la surveillance des outils...');
        
        // Surveiller les changements de classe 'active' sur les boutons d'outils
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const element = mutation.target;
                    
                    if (element.classList.contains('tool-button') && 
                        element.classList.contains('active') && 
                        element.id && 
                        this.helpData[element.id]) {
                        
                        console.log('🎯 Outil activé détecté via MutationObserver:', element.id);
                        
                        // Délai pour laisser l'outil s'initialiser complètement
                        setTimeout(() => {
                            this.showHelp(element.id);
                        }, 600);
                    }
                }
            });
        });

        // Observer tous les boutons d'outils
        const toolButtons = document.querySelectorAll('.tool-button');
        toolButtons.forEach(button => {
            observer.observe(button, {
                attributes: true,
                attributeFilter: ['class']
            });
        });

        // Observer aussi les nouveaux éléments ajoutés
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log(`✅ Surveillance configurée pour ${toolButtons.length} boutons d'outils`);
    }

    // Nouvelle méthode pour forcer l'aide sur activation d'outil
    forceHelpOnToolActivation(toolId) {
        if (this.debugMode) {
            console.log(`🔥 Aide forcée pour outil: ${toolId}`);
        }
        
        setTimeout(() => {
            this.showHelp(toolId);
        }, 500);
    }

    bindToolEvents() {
        
        // Écouter uniquement les clics sur l'outil de mesure
        document.addEventListener('click', (e) => {
            const toolButton = e.target.closest('.tool-button');
            if (toolButton && toolButton.id) {
                console.log('🎯 Clic détecté sur outil:', toolButton.id);
                
                // Gérer le bouton d'aide générale si il existe
                if (toolButton.id === 'helpButton') {
                    console.log('❓ Affichage aide générale');
                    this.showGeneralHelp();
                    return;
                }
                
                // SEULEMENT pour l'outil de mesure
                if (toolButton.id === 'measureTool' && this.helpData[toolButton.id]) {
                    console.log('� Affichage de l\'aide pour l\'outil de mesure');
                    // Délai pour laisser l'outil s'activer
                    setTimeout(() => {
                        this.showHelp(toolButton.id);
                    }, 400);
                } else {
                    console.warn('⚠️ Aucune aide trouvée pour:', toolButton.id);
                    console.log('📋 Outils avec aide disponible:', Object.keys(this.helpData));
                }
            } else {
                // Si ce n'est pas un bouton d'outil, afficher des infos de debug
                if (e.target.closest('.tool-button')) {
                    
                }
            }
        });

        // Raccourci clavier 'H' pour l'aide
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                // Vérifier qu'on n'est pas dans un champ de texte
                if (!e.target.matches('input, textarea, [contenteditable]')) {
                    console.log('⌨️ Raccourci H utilisé - Affichage aide générale');
                    this.showGeneralHelp();
                    e.preventDefault();
                }
            }
        });

        console.log('✅ Événements d\'aide configurés');
    }

    bindHelpEvents() {
        // Fermer l'aide
        document.getElementById('closeHelp').addEventListener('click', () => {
            this.hideHelp();
        });

        // Bouton "J'ai compris"
        document.getElementById('helpGotIt').addEventListener('click', () => {
            // Marquer l'aide générale comme complétée dans localStorage
            localStorage.setItem('walSim3D_generalHelpCompleted', 'true');
            console.log('📖 Help System: Aide générale marquée comme complétée');
            this.hideHelp();
        });

        // Fermer avec Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hideHelp();
            }
        });
    }

    showHelp(toolId) {
        // DÉSACTIVÉ : Vérification de completion pour permettre affichage à chaque démarrage
        // const isCompleted = localStorage.getItem('walSim3D_generalHelpCompleted');
        // if (isCompleted === 'true') {
        //     console.log('📖 Help System: Aide générale déjà complétée, ignorée');
        //     return;
        // }
        console.log('📖 Help System: Système de mémorisation désactivé - aide affichée à chaque démarrage');

        console.log('📖 Tentative d\'affichage aide pour:', toolId);
        const helpInfo = this.helpData[toolId];
        if (!helpInfo) {
            console.log('❌ Aucune aide trouvée pour:', toolId);
            return;
        }

        // Protection contre les affichages multiples rapides
        if (this.isVisible && this.currentTool === toolId) {
            console.log('⚠️ Aide déjà affichée pour cet outil, ignoré');
            return;
        }

        this.currentTool = toolId;
        this.isVisible = true;

        console.log('✨ Affichage du panel d\'aide pour:', helpInfo.title);

        // Mettre à jour le contenu
        document.getElementById('helpIcon').className = helpInfo.icon;
        document.getElementById('helpTitle').textContent = helpInfo.title;

        // Étapes
        const stepsContainer = document.getElementById('helpSteps');
        stepsContainer.innerHTML = `
            <h4>📋 Comment utiliser cet outil :</h4>
            ${helpInfo.steps.map(step => `<div class="help-step">${step}</div>`).join('')}
        `;

        // Conseils
        const tipsContainer = document.getElementById('helpTips');
        if (helpInfo.tips && helpInfo.tips.length > 0) {
            tipsContainer.innerHTML = `
                <h4>💡 Conseils et astuces :</h4>
                ${helpInfo.tips.map(tip => `<div class="help-tip">${tip}</div>`).join('')}
            `;
        } else {
            tipsContainer.innerHTML = '';
        }

        // Afficher le panel
        this.helpPanel.classList.remove('hide');
        this.helpPanel.classList.add('show');
        console.log('✅ Panel d\'aide affiché');
        
        // Fermeture automatique après 8 secondes
        if (this.autoCloseTimer) {
            clearTimeout(this.autoCloseTimer);
        }
        this.autoCloseTimer = setTimeout(() => {
            this.hideHelp();
            console.log('⏰ Fermeture automatique de l\'aide');
        }, 8000);
    }

    showGeneralHelp() {
        // DÉSACTIVÉ : Vérification de completion pour permettre affichage à chaque démarrage
        // const isCompleted = localStorage.getItem('walSim3D_generalHelpCompleted');
        // if (isCompleted === 'true') {
        //     console.log('📖 Help System: Aide générale déjà complétée, ignorée');
        //     return;
        // }
        console.log('📖 Help System: Système de mémorisation désactivé - aide générale affichée à chaque démarrage');

        this.currentTool = 'general';
        this.isVisible = true;

        // Mettre à jour le contenu pour l'aide générale
        document.getElementById('helpIcon').className = 'fas fa-question-circle';
        document.getElementById('helpTitle').textContent = 'Guide WallSim3D - Démarrage Rapide';

        // Aide générale
        const stepsContainer = document.getElementById('helpSteps');
        stepsContainer.innerHTML = `
            <h4>🏗️ Comment débuter avec WallSim3D :</h4>
            <div class="help-step">🎯 ÉTAPE 1 : Cliquez sur un outil dans la barre d'outils pour voir son guide détaillé</div>
            <div class="help-step">📐 ÉTAPE 2 : Utilisez les outils de mesure et d'annotation pour documenter</div>
            <div class="help-step">🧱 ÉTAPE 3 : Explorez la bibliothèque de matériaux avec prévisualisations 3D</div>
            <div class="help-step">🎨 ÉTAPE 4 : Utilisez le mode pinceau pour appliquer rapidement des matériaux</div>
            <div class="help-step">📁 ÉTAPE 5 : Sauvegardez votre travail via le menu Fichier > Sauvegarder</div>
        `;

        // Raccourcis généraux
        const tipsContainer = document.getElementById('helpTips');
        tipsContainer.innerHTML = `
            <h4>⌨️ Raccourcis clavier essentiels :</h4>
            <div class="help-tip">🔧 <strong>M</strong> → Activer l'outil de mesure</div>
            <div class="help-tip">📝 <strong>A</strong> → Activer l'outil d'annotation</div>
            <div class="help-tip">💬 <strong>T</strong> → Activer l'outil texte avec ligne de rappel</div>
            <div class="help-tip">❓ <strong>H</strong> → Afficher cette aide générale</div>
            <div class="help-tip">⎋ <strong>Échap</strong> → Fermer les dialogues et désactiver les outils</div>
            <div class="help-tip">💾 <strong>Ctrl+S</strong> → Sauvegarder le projet rapidement</div>
            <div class="help-tip">📋 <strong>Ctrl+D</strong> → Dupliquer l'élément sélectionné</div>
            <div class="help-tip">↩️ <strong>Ctrl+Z</strong> → Annuler la dernière action</div>
            <div class="help-tip">🗑️ <strong>Suppr</strong> → Supprimer l'élément sélectionné</div>
        `;

        // Afficher le panel
        this.helpPanel.classList.remove('hide');
        this.helpPanel.classList.add('show');
        
        // Fermeture automatique après 8 secondes pour l'aide générale aussi
        if (this.autoCloseTimer) {
            clearTimeout(this.autoCloseTimer);
        }
        this.autoCloseTimer = setTimeout(() => {
            this.hideHelp();
            console.log('⏰ Fermeture automatique de l\'aide générale');
        }, 8000);
    }

    // Méthode pour forcer l'affichage de l'aide générale (maintenant identique à showGeneralHelp)
    forceShowGeneralHelp() {
        console.log('📖 Help System: Affichage forcé (identique au showGeneralHelp maintenant)');
        // Appeler directement showGeneralHelp maintenant que la mémorisation est désactivée
        this.showGeneralHelp();
    }

    hideHelp() {
        if (!this.isVisible) return;

        // Annuler le timer de fermeture automatique
        if (this.autoCloseTimer) {
            clearTimeout(this.autoCloseTimer);
            this.autoCloseTimer = null;
        }

        this.isVisible = false;
        this.helpPanel.classList.remove('show');
        this.helpPanel.classList.add('hide');

        setTimeout(() => {
            this.helpPanel.style.display = 'none';
            this.helpPanel.classList.remove('hide');
        }, 300);
    }

    // Ajouter une nouvelle aide pour un outil personnalisé
    addToolHelp(toolId, helpInfo) {
        this.helpData[toolId] = helpInfo;
    }

    // Test de diagnostic pour l'aide
    testHelpSystem() {
        
        console.log('Panel créé:', !!this.helpPanel);
        console.log('Panel dans DOM:', document.body.contains(this.helpPanel));
        console.log('Données d\'aide disponibles:', Object.keys(this.helpData));
        
        const toolButtons = Array.from(document.querySelectorAll('.tool-button')).map(btn => ({
            id: btn.id,
            hasHelp: !!this.helpData[btn.id],
            element: btn
        })).filter(tool => tool.id);
        
        console.log('Boutons d\'outils trouvés:', toolButtons);
        
        // Vérification spécifique des outils problématiques
        const problematicTools = ['measureTool', 'annotationTool', 'textLeaderTool'];
        problematicTools.forEach(toolId => {
            const button = document.getElementById(toolId);
            const hasData = !!this.helpData[toolId];
            console.log(`🔧 ${toolId}:`, {
                buttonFound: !!button,
                helpDataExists: hasData,
                buttonElement: button
            });
        });
        
        // Test d'affichage forcé de chaque outil
        setTimeout(() => {
            console.log('🎯 Test d\'affichage forcé pour measureTool...');
            this.showHelp('measureTool');
        }, 1000);
    }

    // Démonstration du système d'aide
    startDemo() {
        console.log('🎪 DÉMONSTRATION DU SYSTÈME D\'AIDE');
        const tools = ['selectTool', 'moveTool', 'measureTool', 'materialPaintMode'];
        let currentIndex = 0;

        const showNextTool = () => {
            if (currentIndex < tools.length) {
                const toolId = tools[currentIndex];
                console.log(`📖 Demo ${currentIndex + 1}/${tools.length}: ${toolId}`);
                this.showHelp(toolId);
                currentIndex++;
                
                // Passer au suivant après 4 secondes
                setTimeout(() => {
                    this.hideHelp();
                    setTimeout(showNextTool, 500);
                }, 4000);
            } else {
                console.log('🎉 Démonstration terminée !');
                this.showGeneralHelp();
            }
        };

        showNextTool();
    }

    // Afficher l'aide manuellement
    showToolHelp(toolId) {
        this.showHelp(toolId);
    }

    // Marquer les outils qui ont une aide disponible
    markToolsWithHelp() {
        setTimeout(() => {
            Object.keys(this.helpData).forEach(toolId => {
                const toolButton = document.getElementById(toolId);
                if (toolButton) {
                    toolButton.setAttribute('data-has-help', 'true');
                }
            });
        }, 500); // Petit délai pour s'assurer que le DOM est prêt
    }

    // Notification de bienvenue pour le système d'aide
    showWelcomeNotification() {
        setTimeout(() => {
            // Vérifier si c'est la première visite (localStorage)
            if (!localStorage.getItem('wallsim3d_help_shown')) {
                const notification = document.createElement('div');
                notification.innerHTML = `
                    <div style="position: fixed; top: 20px; right: 20px; background: linear-gradient(135deg, #3498db, #2980b9); color: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10001; font-family: 'Segoe UI', sans-serif; max-width: 320px;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <i class="fas fa-lightbulb" style="color: #f1c40f;"></i>
                            <strong>Guide Interactif Activé !</strong>
                        </div>
                        <p style="margin: 0; font-size: 13px; line-height: 1.4;">
                            Chaque outil vous guide maintenant étape par étape avec <strong>CLIC 1, CLIC 2, etc.</strong>
                            Cliquez sur n'importe quel outil pour voir son guide détaillé !
                        </p>
                        <div style="margin-top: 8px; font-size: 12px; opacity: 0.9;">
                            💡 Raccourci : <strong>H</strong> pour l'aide générale
                        </div>
                        <button onclick="this.parentElement.parentElement.remove(); localStorage.setItem('wallsim3d_help_shown', 'true');" 
                                style="margin-top: 10px; background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            J'ai compris
                        </button>
                    </div>
                `;
                document.body.appendChild(notification);

                // Auto-suppression après 10 secondes
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                        localStorage.setItem('wallsim3d_help_shown', 'true');
                    }
                }, 10000);
            }
        }, 2000); // Attendre 2 secondes après le chargement
    }
}

// Initialiser le système d'aide après chargement complet
function initHelpSystem() {
    // Attendre que les outils soient initialisés (ModernInterface pas forcément requis)
    if (document.querySelector('.toolbar') && 
        document.getElementById('measureTool') && 
        document.getElementById('annotationTool') && 
        document.getElementById('textLeaderTool')) {
        
        console.log('🚀 Initialisation du système d\'aide...');
        window.HelpSystem = new HelpSystem();
        console.log('✅ Système d\'aide contextuelle initialisé');
        
        // Fonction globale pour tester depuis la console
        window.testHelp = function() {
            if (window.HelpSystem) {
                console.log('🧪 Test de l\'aide depuis la console');
                window.HelpSystem.showGeneralHelp();
            }
        };
        
        window.showHelpFor = function(toolId) {
            if (window.HelpSystem) {
                console.log('🧪 Test aide pour outil:', toolId);
                window.HelpSystem.showHelp(toolId);
            }
        };

        // Fonction de démonstration
        window.demoHelp = function() {
            if (window.HelpSystem) {
                console.log('🎪 Démonstration du système d\'aide');
                window.HelpSystem.startDemo();
            }
        };

        // Raccourci pour réinitialiser la notification
        window.resetHelpNotification = function() {
            localStorage.removeItem('wallsim3d_help_shown');
            console.log('🔄 Notification d\'aide réinitialisée - rechargez la page pour la revoir');
        };

        // Tests spécifiques pour les outils problématiques
        window.testMeasureHelp = function() {
            if (window.HelpSystem) {
                console.log('📏 Test spécifique outil de mesure');
                window.HelpSystem.showHelp('measureTool');
            }
        };

        window.testAnnotationHelp = function() {
            if (window.HelpSystem) {
                console.log('📝 Test spécifique outil d\'annotation');
                window.HelpSystem.showHelp('annotationTool');
            }
        };

        window.testTextLeaderHelp = function() {
            if (window.HelpSystem) {
                console.log('💬 Test spécifique outil texte avec ligne de rappel');
                window.HelpSystem.showHelp('textLeaderTool');
            }
        };
        
    } else {
        console.log('⏳ Interface ou outils pas encore prêts, réessai dans 1s...');
        console.log('ModernInterface:', !!window.ModernInterface);
        console.log('Toolbar:', !!document.querySelector('.toolbar'));
        console.log('measureTool:', !!document.getElementById('measureTool'));
        console.log('annotationTool:', !!document.getElementById('annotationTool'));
        console.log('textLeaderTool:', !!document.getElementById('textLeaderTool'));
        
        // Réessayer dans 1 seconde
        setTimeout(initHelpSystem, 1000);
    }
}

// Attendre le chargement complet de la page avec plus de délai
window.addEventListener('load', () => {
    setTimeout(initHelpSystem, 2000);
});

// Fallback avec DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initHelpSystem, 3000);
});

// Export global
if (typeof window !== 'undefined') {
    window.HelpSystem = HelpSystem;
}
