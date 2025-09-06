/**
 * PATCH SYSTÈME D'AIDE - Solution directe pour les outils probléma               // Fonction pour afficher l'aide d'un outil spécifique
        function showToolHelp(                tex                te                },
                textL                textLea                    steps: [
                        "🎯 CLIC 1 : Cliquez sur l'élément à annoter",
                        "↗️ GLISSEMENT : Déplacez pour positionner le texte",
                        "📝 CLIC 2 : Cliquez pour fixer la position",
                        "⌨️ SAISIE : Tapez votre annotation"
                    ]
                },
                materialPaintMode: {
                    title: "Outil Pinceau de Matériau",
                    steps: [
                        "🎨 SÉLECTION : Choisissez un matériau dans la palette",
                        "🖱️ APPLICATION : Cliquez sur les éléments à peindre",
                        "✨ PREVIEW : L'aperçu s'affiche en temps réel",
                        "🔄 CHANGEMENT : Sélectionnez un autre matériau pour changer",
                        "✅ VALIDATION : Le matériau est appliqué instantanément"
                    ]
                }
            }; {
                    title: "Outil Texte avec Ligne de Rappel",
                    steps: [
                        "🎯 CLIC 1 : Cliquez sur l'élément à annoter",
                        "↗️ GLISSEMENT : Déplacez pour positionner le texte",
                        "📝 CLIC 2 : Cliquez pour fixer la position",
                        "⌨️ SAISIE : Tapez votre annotation"
                    ]
                },
                materialPaintMode: {
                    title: "Outil Pinceau de Matériau",
                    steps: [
                        "🎨 SÉLECTION : Choisissez un matériau dans la palette",
                        "🖱️ APPLICATION : Cliquez sur les éléments à peindre",
                        "✨ PREVIEW : L'aperçu s'affiche en temps réel",
                        "🔄 CHANGEMENT : Sélectionnez un autre matériau pour changer",
                        "✅ VALIDATION : Le matériau est appliqué instantanément"
                    ]
                }
            };
            
            const helpInfo = helpTexts[toolId];
                    title: "Outil Texte avec Ligne de Rappel",
                    steps: [
                        "🎯 CLIC 1 : Cliquez sur l'élément à annoter",
                        "↗️ GLISSEMENT : Déplacez pour positionner le texte",
                        "📝 CLIC 2 : Cliquez pour fixer la position",
                        "⌨️ SAISIE : Tapez votre annotation"
                    ]
                },
                materialPaintMode: {
                    title: "Outil Pinceau de Matériau",
                    steps: [
                        "🎨 SÉLECTION : Choisissez un matériau dans la palette",
                        "🖱️ APPLICATION : Cliquez sur les éléments à peindre",
                        "✨ PREVIEW : L'aperçu s'affiche en temps réel",
                        "🔄 CHANGEMENT : Sélectionnez un autre matériau pour changer",
                        "✅ VALIDATION : Le matériau est appliqué instantanément"
                    ]
                },
                materialPaintMode: {
                    title: "Outil Pinceau de Matériau",
                    steps: [
                        "🎨 SÉLECTION : Choisissez un matériau dans la palette",
                        "🖱️ APPLICATION : Cliquez sur les éléments à peindre",
                        "✨ PREVIEW : L'aperçu s'affiche en temps réel",
                        "🔄 CHANGEMENT : Sélectionnez un autre matériau pour changer",
                        "✅ VALIDATION : Le matériau est appliqué instantanément"
                    ]
                },
                materialPaintMode: {
                    title: "Outil Pinceau de Matériau",
                    steps: [
                        "🎨 SÉLECTION : Choisissez un matériau dans la palette",
                        "🖱️ APPLICATION : Cliquez sur les éléments à peindre",
                        "✨ PREVIEW : L'aperçu s'affiche en temps réel",
                        "🔄 CHANGEMENT : Sélectionnez un autre matériau pour changer",
                        "✅ VALIDATION : Le matériau est appliqué instantanément"
                    ]
                }
            };l: {
                    title: "Outil Texte avec Ligne de Rappel",
                    steps: [
                        "🎯 CLIC 1 : Cliquez sur l'élément à annoter",
                        "↗️ GLISSEMENT : Déplacez pour positionner le texte",
                        "📝 CLIC 2 : Cliquez pour fixer la position",
                        "⌨️ SAISIE : Tapez votre annotation"
                    ]
                },
                materialPaintMode: {
                    title: "Outil Pinceau de Matériau",
                    steps: [
                        "🎨 SÉLECTION : Choisissez un matériau dans la palette",
                        "🖱️ APPLICATION : Cliquez sur les éléments à peindre",
                        "✨ PREVIEW : L'aperçu s'affiche en temps réel",
                        "🔄 CHANGEMENT : Sélectionnez un autre matériau pour changer",
                        "✅ VALIDATION : Le matériau est appliqué instantanément"
                    ]
                }
            };l: {
                    title: "Outil Texte avec Ligne de Rappel",
                    steps: [
                        "🎯 CLIC 1 : Cliquez sur l'élément à annoter",
                        "↗️ GLISSEMENT : Déplacez pour positionner le texte",
                        "📝 CLIC 2 : Cliquez pour fixer la position",
                        "⌨️ SAISIE : Tapez votre annotation"
                    ]
                },
                materialPaintMode: {
                    title: "Outil Pinceau de Matériau",
                    steps: [
                        "🎨 ÉTAPE 1 : Sélectionnez un matériau dans la bibliothèque",
                        "🖱️ ÉTAPE 2 : Activez le mode pinceau en cliquant sur l'outil",
                        "🎯 ÉTAPE 3 : Cliquez sur les éléments à peindre",
                        "⌨️ RACCOURCI : Appuyez sur 'P' pour activer/désactiver le pinceau",
                        "🚪 SORTIE : Cliquez sur le bouton 'Quitter' ou rechoisissez un autre outil"
                    ]
                }
            };
            console.log('📖 HELP-PATCH: Demande aide pour:', toolId);
            
            // Protection contre les déclenchements multiples rapides
            if (window.helpPatchLastTool === toolId && Date.now() - window.helpPatchLastTime < 2000) {
                console.log('⚠️ PATCH: Déclenchement ignoré (trop récent)');
                return;
            }
            window.helpPatchLastTool = toolId;
            window.helpPatchLastTime = Date.now();
            
            // Le système principal est désactivé, utiliser directement le système de secours
            console.log('🔧 Utilisation du système de secours autonome pour:', toolId);
            showSimpleHelp(toolId);
        }
        
        // EXPOSER LA FONCTION GLOBALEMENT
        window.showToolHelp = showToolHelp;
        console.log('✅ window.showToolHelp exposé globalement');            textLeaderTool: {
                    title: "Outil Texte avec Ligne de Rappel",
                    steps: [
                        "🎯 CLIC 1 : Cliquez sur l'élément à a        targetTools.forEach(targetTool => {
            const element = document.getElementById(targetTool);
            if (element) {
                // console.log(`🔧 Installation du patch pour ${targetTool}`);
                
                // Multiple approches pour capturer l'activation
                
                // 1. Événement de clic avec capture la plus haute priorité
                element.addEventListener('click', (e) => {
                    // console.log(`🎯 PATCH: Clic intercepté sur ${targetTool}`);
                    // Seulement si pas déjà en train d'afficher l'aide
                    if (!window.helpPatchLastTool || window.helpPatchLastTool !== targetTool || Date.now() - window.helpPatchLastTime > 2000) {
                        setTimeout(() => showToolHelp(targetTool), 100);
                    }
                }, { capture: true, passive: false });
            } else {
                console.log(`⚠️ PATCH: Élément ${targetTool} non trouvé au chargement initial`);
                
                // Pour les éléments créés dynamiquement comme materialPaintMode
                if (targetTool === 'materialPaintMode') {
                    // Réessayer périodiquement jusqu'à ce que l'élément existe
                    const retryInstallation = setInterval(() => {
                        const dynamicElement = document.getElementById(targetTool);
                        if (dynamicElement) {
                            console.log(`🔧 Installation différée du patch pour ${targetTool}`);
                            dynamicElement.addEventListener('click', (e) => {
                                console.log(`🎯 PATCH: Clic intercepté sur ${targetTool} (différé)`);
                                if (!window.helpPatchLastTool || window.helpPatchLastTool !== targetTool || Date.now() - window.helpPatchLastTime > 2000) {
                                    setTimeout(() => showToolHelp(targetTool), 100);
                                }
                            }, { capture: true, passive: false });
                            clearInterval(retryInstallation);
                        }
                    }, 500);
                    
                    // Arrêter les tentatives après 10 secondes
                    setTimeout(() => clearInterval(retryInstallation), 10000);
                }
            }                  "↗️ GLISSEMENT : Déplacez pour positionner le texte",
                        "� CLIC 2 : Cliquez pour fixer la position",
                        "⌨️ SAISIE : Tapez votre annotation"
                    ]
                },
                materialPaintMode: {
                    title: "Outil Pinceau de Matériau",
                    steps: [
                        "🎨 ÉTAPE 1 : Sélectionnez un matériau dans la bibliothèque",
                        "🖱️ ÉTAPE 2 : Activez le mode pinceau en cliquant sur l'outil",
                        "🎯 ÉTAPE 3 : Cliquez sur les éléments à peindre",
                        "⌨️ RACCOURCI : Appuyez sur 'P' pour activer/désactiver le pinceau",
                        "🚪 SORTIE : Cliquez sur le bouton 'Quitter' ou rechoisissez un autre outil"
                    ]
                }quez sur l'élément à déplacer",ques
 * Ce script s'exécute a                   // Créer une fenêtre d'aide temporaire
            const helpWindow = document.createElement('div');
            helpWindow.innerHTML = `
                <div style="position: fixed !important; top: 55% !important; left: 65% !important; transform: translate(-50%, -50%) !important; width: 420px; max-width: 85vw; max-height: 85vh; overflow-y: auto; background: linear-gradient(145deg, #ffffff 0%, #f0fff4 50%, #fefff8 100%); color: #1a4731; border: 3px solid transparent; background-clip: padding-box; border-radius: 20px; box-shadow: 0 25px 80px rgba(67, 160, 71, 0.25), 0 15px 35px rgba(255, 235, 59, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8); z-index: 99999 !important; font-family: 'Segoe UI', 'Apple Color Emoji', Tahoma, Geneva, Verdana, sans-serif; animation: materialEntrance 0.6s cubic-bezier(0.18, 0.89, 0.32, 1.28); backdrop-filter: blur(15px);">`     // Créer une fenêtre d'aide temporaire
            const helpWindow = document.createElement('div');
            helpWindow.innerHTML = `
                <div style="position: fixed !important; top: 55% !important; left: 60% !important; transform: translate(-50%, -50%) !important; width: 420px; max-width: 85vw; max-height: 85vh; overflow-y: auto; background: linear-gradient(145deg, #ffffff 0%, #f0fff4 50%, #fefff8 100%); color: #1a4731; border: 3px solid transparent; background-clip: padding-box; border-radius: 20px; box-shadow: 0 25px 80px rgba(67, 160, 71, 0.25), 0 15px 35px rgba(255, 235, 59, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8); z-index: 99999 !important; font-family: 'Segoe UI', 'Apple Color Emoji', Tahoma, Geneva, Verdana, sans-serif; animation: materialEntrance 0.6s cubic-bezier(0.18, 0.89, 0.32, 1.28); backdrop-filter: blur(15px);">`     // Créer une fenêtre d'aide temporaire
            const helpWindow = document.createElement('div');
            helpWindow.innerHTML = `
                <div style="position: fixed !important; top: 55% !important; left: 55% !important; transform: translate(-50%, -50%) !important; width: 420px; max-width: 85vw; max-height: 85vh; overflow-y: auto; background: linear-gradient(145deg, #ffffff 0%, #f0fff4 50%, #fefff8 100%); color: #1a4731; border: 3px solid transparent; background-clip: padding-box; border-radius: 20px; box-shadow: 0 25px 80px rgba(67, 160, 71, 0.25), 0 15px 35px rgba(255, 235, 59, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8); z-index: 99999 !important; font-family: 'Segoe UI', 'Apple Color Emoji', Tahoma, Geneva, Verdana, sans-serif; animation: materialEntrance 0.6s cubic-bezier(0.18, 0.89, 0.32, 1.28); backdrop-filter: blur(15px);">`       const helpWindow = document.createElement('div');
            helpWindow.innerHTML = `
                <div style="position: fixed !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important; width: 420px; max-width: 90vw; max-height: 90vh; overflow-y: auto; background: linear-gradient(145deg, #ffffff 0%, #f0fff4 50%, #fefff8 100%); color: #1a4731; border: 3px solid transparent; background-clip: padding-box; border-radius: 20px; box-shadow: 0 25px 80px rgba(67, 160, 71, 0.25), 0 15px 35px rgba(255, 235, 59, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8); z-index: 99999 !important; font-family: 'Segoe UI', 'Apple Color Emoji', Tahoma, Geneva, Verdana, sans-serif; animation: materialEntrance 0.6s cubic-bezier(0.18, 0.89, 0.32, 1.28); backdrop-filter: blur(15px);">`         helpWindow.innerHTML = `
                <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 420px; max-width: 90vw; max-height: 90vh; overflow-y: auto; background: linear-gradient(145deg, #ffffff 0%, #f0fff4 50%, #fefff8 100%); color: #1a4731; border: 3px solid transparent; background-clip: padding-box; border-radius: 20px; box-shadow: 0 25px 80px rgba(67, 160, 71, 0.25), 0 15px 35px rgba(255, 235, 59, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8); z-index: 10000; font-family: 'Segoe UI', 'Apple Color Emoji', Tahoma, Geneva, Verdana, sans-serif; animation: materialEntrance 0.6s cubic-bezier(0.18, 0.89, 0.32, 1.28); backdrop-filter: blur(15px); position: relative;">`ès le chargement et force l'aide contextuelle
 */

// console.log('🔧 Chargement du patch système d\'aide...');

// Attendre que tout soit chargé
window.addEventListener('load', () => {
    setTimeout(() => {
        // console.log('🚀 Activation du patch d\'aide contextuelle');
        
        // Fonction pour afficher l'aide d'un outil spécifique
        function showToolHelp(toolId) {
            // console.log('📖 Affichage aide pour:', toolId);
            
            // Protection contre les déclenchements multiples rapides
            if (window.helpPatchLastTool === toolId && Date.now() - window.helpPatchLastTime < 2000) {
                // console.log('⚠️ PATCH: Déclenchement ignoré (trop récent)');
                return;
            }
            window.helpPatchLastTool = toolId;
            window.helpPatchLastTime = Date.now();
            
            // Le système principal est désactivé, utiliser directement le système de secours
            // console.log('🔧 Utilisation du système de secours autonome');
            showSimpleHelp(toolId);
        }
        
        // EXPOSER LA FONCTION GLOBALEMENT
        window.showToolHelp = showToolHelp;
        
        // Aide simplifiée si le système principal ne marche pas
        function showSimpleHelp(toolId) {
            // console.log('🔧 SHOW-SIMPLE-HELP appelé pour:', toolId); // désactivé
            
            // Vérifier si l'utilisateur a choisi de ne plus afficher cette aide
            const hideKey = `hideToolHelp_${toolId}`;
            if (localStorage.getItem(hideKey) === 'true') {
                // console.log('🚫 Aide masquée par l\'utilisateur pour:', toolId); // désactivé
                return;
            }
            
            const helpTexts = {
                selectTool: {
                    title: "Outil de Sélection",
                    steps: [
                        "👆 Cliquez sur un élément pour le sélectionner",
                        "🎯 L'élément sélectionné se met en surbrillance",
                        "⌨️ Utilisez Suppr pour effacer ou Ctrl+C pour copier"
                    ]
                },
                moveTool: {
                    title: "Outil de Déplacement",
                    steps: [
                        " Cliquez sur l'élément à déplacer",
                        "🖱️ Cliquez à l'endroit où vous voulez le poser",
                        "✅ L'élément se déplace instantanément"
                    ]
                },
                deleteTool: {
                    title: "Outil de Suppression",
                    steps: [
                        "️ Cliquez sur l'élément à supprimer",
                        "⚠️ L'élément est supprimé immédiatement",
                        "↩️ Utilisez Ctrl+Z pour annuler si besoin"
                    ]
                },
                duplicateTool: {
                    title: "Outil de Duplication",
                    steps: [
                        " Cliquez sur l'élément à dupliquer",
                        "📋 Une copie est créée automatiquement",
                        "🖱️ Déplacez la copie vers la position souhaitée"
                    ]
                },
                measureTool: {
                    title: "Outil de Mesure",
                    steps: [
                        "� CLIC 1 : Cliquez sur le point de DÉPART de votre mesure",
                        "🖱️ MOUVEMENT : Déplacez la souris vers le point d'arrivée",
                        "📐 APERÇU : La distance s'affiche en temps réel",
                        "✅ CLIC 2 : Cliquez sur le point d'ARRIVÉE pour finaliser"
                    ]
                },
                annotationTool: {
                    title: "Outil d'Annotation",
                    steps: [
                        "✅ CLIC UNIQUE : Cliquez à l'endroit souhaité",
                        "📝 Une zone de texte apparaît automatiquement",
                        "⌨️ Tapez directement votre annotation",
                        "🎯 L'annotation est placée instantanément"
                    ]
                },
                textLeaderTool: {
                    title: "Outil Texte avec Ligne de Rappel",
                    steps: [
                        "� CLIC 1 : Cliquez sur l'élément à annoter",
                        "↗️ GLISSEMENT : Déplacez pour positionner le texte",
                        "📝 CLIC 2 : Cliquez pour fixer la position",
                        "⌨️ SAISIE : Tapez votre annotation"
                    ]
                },
                materialPaintMode: {
                    title: "Outil Pinceau de Matériau",
                    steps: [
                        "🎨 SÉLECTION : Choisissez un matériau dans la palette",
                        "🖱️ APPLICATION : Cliquez sur les éléments à peindre",
                        "🔄 CHANGEMENT : Sélectionnez un autre matériau pour changer",
                        "✅ VALIDATION : Le matériau est appliqué instantanément"
                    ]
                }
            };
            
            const helpInfo = helpTexts[toolId];
            // console.log('🔍 Recherche aide pour', toolId, ':', helpInfo ? 'TROUVÉ' : 'NON TROUVÉ'); // désactivé
            if (!helpInfo) {
                // console.error('❌ Aucun texte d\'aide trouvé pour:', toolId);
                // console.log('📝 Textes disponibles:', Object.keys(helpTexts));
                return;
            }
            
            // console.log('✅ Création de la fenêtre d\'aide pour:', toolId); // désactivé
            // Créer une fenêtre d'aide temporaire
            const helpWindow = document.createElement('div');
            helpWindow.innerHTML = `
                <div style="position: fixed; top: 75%; right: 20px; transform: translateY(-30%); width: 420px; background: linear-gradient(145deg, #ffffff 0%, #f0fff4 50%, #fefff8 100%); color: #1a4731; border: 3px solid transparent; background-clip: padding-box; border-radius: 20px; box-shadow: 0 25px 80px rgba(67, 160, 71, 0.25), 0 15px 35px rgba(255, 235, 59, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8); z-index: 10000; font-family: 'Segoe UI', 'Apple Color Emoji', Tahoma, Geneva, Verdana, sans-serif; backdrop-filter: blur(15px); position: relative;">
                    
                    <!-- En-tête avec dégradé premium -->
                    <div style="background: linear-gradient(135deg, #2e7d32 0%, #43a047 35%, #66bb6a 70%, #81c784 100%); padding: 22px 28px; border-radius: 17px 17px 0 0; display: flex; justify-content: space-between; align-items: center; position: relative; overflow: hidden;">
                        <!-- Particules flottantes -->
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 25% 25%, rgba(255, 235, 59, 0.15) 2px, transparent 2px), radial-gradient(circle at 75% 75%, rgba(129, 199, 132, 0.15) 2px, transparent 2px); background-size: 30px 30px; opacity: 0.6; animation: float 6s ease-in-out infinite;"></div>
                        
                        <div style="display: flex; align-items: center; gap: 15px; font-weight: 800; font-size: 18px; color: white; z-index: 2; position: relative;">
                            <div style="background: linear-gradient(135deg, #fff59d 0%, #ffeb3b 50%, #ffc107 100%); padding: 12px; border-radius: 50%; backdrop-filter: blur(10px); box-shadow: 0 4px 15px rgba(255, 193, 7, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3); position: relative; animation: pulse 2s ease-in-out infinite;">
                                <i class="fas fa-star" style="font-size: 18px; color: #1a4731; text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);"></i>
                                <!-- Éclat rotatif -->
                                <div style="position: absolute; top: 50%; left: 50%; width: 6px; height: 6px; background: radial-gradient(circle, #ffffff 0%, transparent 70%); transform: translate(-50%, -50%); border-radius: 50%; animation: sparkle 1.5s ease-in-out infinite;"></div>
                            </div>
                            <span style="text-shadow: 0 2px 4px rgba(0,0,0,0.3); background: linear-gradient(45deg, #ffffff, #e8f5e8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${helpInfo.title}</span>
                        </div>
                        
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: linear-gradient(135deg, rgba(255,235,59,0.4), rgba(255,193,7,0.6)); border: 2px solid rgba(255,255,255,0.3); color: white; font-size: 18px; cursor: pointer; padding: 10px; border-radius: 50%; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); backdrop-filter: blur(10px); z-index: 2; position: relative; box-shadow: 0 4px 12px rgba(255, 193, 7, 0.2);" onmouseover="this.style.transform='scale(1.1) rotate(90deg)'; this.style.background='linear-gradient(135deg, rgba(255,235,59,0.7), rgba(255,193,7,0.9))'" onmouseout="this.style.transform='scale(1) rotate(0deg)'; this.style.background='linear-gradient(135deg, rgba(255,235,59,0.4), rgba(255,193,7,0.6))'">
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
                        
                        ${helpInfo.steps.map((step, index) => `
                            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240,255,244,0.8), rgba(255,255,255,0.9)); padding: 20px 22px; margin: 16px 0; border-radius: 16px; border: 2px solid rgba(67, 160, 71, 0.1); box-shadow: 0 8px 25px rgba(67, 160, 71, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8); font-size: 14px; line-height: 1.7; color: #1a4731; position: relative; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); overflow: hidden;" onmouseover="this.style.transform='translateY(-4px) scale(1.02)'; this.style.boxShadow='0 15px 40px rgba(67, 160, 71, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)'; this.style.borderColor='rgba(255, 235, 59, 0.3)'" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 8px 25px rgba(67, 160, 71, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)'; this.style.borderColor='rgba(67, 160, 71, 0.1)'">
                                <!-- Bordure animée -->
                                <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: linear-gradient(to bottom, #ffeb3b 0%, #43a047 50%, #66bb6a 100%); border-radius: 0 8px 8px 0; box-shadow: 2px 0 8px rgba(67, 160, 71, 0.2);"></div>
                                <!-- Éclat de fond -->
                                <div style="position: absolute; top: -50%; right: -20%; width: 100px; height: 100px; background: radial-gradient(circle, rgba(255, 235, 59, 0.1) 0%, transparent 70%); border-radius: 50%; animation: glow 3s ease-in-out infinite;"></div>
                                
                                <div style="display: flex; align-items: flex-start; gap: 16px; position: relative; z-index: 1;">
                                    <div style="background: linear-gradient(135deg, #fff59d 0%, #ffeb3b 50%, #ffc107 100%); color: #1a4731; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; flex-shrink: 0; box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4); border: 2px solid rgba(255, 255, 255, 0.6); position: relative; animation: bounce 2s ease-in-out infinite ${index * 0.2}s;">
                                        ${index + 1}
                                        <!-- Effet de brillance -->
                                        <div style="position: absolute; top: 2px; left: 2px; width: 8px; height: 8px; background: rgba(255, 255, 255, 0.8); border-radius: 50%; animation: twinkle 1.5s ease-in-out infinite;"></div>
                                    </div>
                                    <div style="flex: 1; font-weight: 500;">${step}</div>
                                </div>
                            </div>
                        `).join('')}
                        
                        <div style="text-align: center; padding-top: 24px; border-top: 2px solid rgba(67, 160, 71, 0.1); margin-top: 20px; position: relative;">
                            <!-- Décoration du bouton -->
                            <div style="position: absolute; top: -1px; left: 50%; transform: translateX(-50%); width: 60px; height: 2px; background: linear-gradient(90deg, transparent, #ffeb3b, transparent);"></div>
                            
                            <button onclick="localStorage.setItem('hideToolHelp_${toolId}', 'true'); this.parentElement.parentElement.parentElement.parentElement.remove();" style="background: linear-gradient(135deg, #757575 0%, #616161 35%, #424242 70%, #212121 100%); color: white; border: 3px solid rgba(255, 255, 255, 0.2); padding: 16px 25px; border-radius: 50px; font-weight: 600; cursor: pointer; font-size: 14px; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1); letter-spacing: 0.5px; text-transform: uppercase; position: relative; overflow: hidden;" onmouseover="this.style.transform='translateY(-3px) scale(1.05)'; this.style.boxShadow='0 15px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'; this.style.borderColor='rgba(255, 255, 255, 0.4)'" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 8px 25px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'; this.style.borderColor='rgba(255, 255, 255, 0.2)'">
                                <!-- Effet de vague -->
                                <div style="position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent); animation: wave 2s ease-in-out infinite;"></div>
                                <i class="fas fa-eye-slash" style="margin-right: 8px; color: #ffffff; font-size: 14px; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);"></i>
                                <span style="position: relative; z-index: 1;">Ne plus afficher</span>
                            </button>
                        </div>
                    </div>
                </div>
                <style>
                    @keyframes materialEntrance {
                        0% { 
                            opacity: 0; 
                            transform: translate(-50%, -50%) scale(0.7) rotateY(45deg); 
                            filter: blur(8px);
                        }
                        50% {
                            transform: translate(-50%, -50%) scale(1.05) rotateY(-5deg);
                        }
                        100% { 
                            opacity: 1; 
                            transform: translate(-50%, -50%) scale(1) rotateY(0deg); 
                            filter: blur(0px);
                        }
                    }
                    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }
                    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
                    @keyframes sparkle { 0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 0.3; transform: translate(-50%, -50%) scale(1.5); } }
                    @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
                    @keyframes glow { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.2); } }
                    @keyframes bounce { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-3px); } }
                    @keyframes twinkle { 0%, 100% { opacity: 0.8; } 50% { opacity: 0.3; } }
                    @keyframes wave { 0% { left: -100%; } 100% { left: 100%; } }
                </style>
                </style>
            `;
            
            // Styles forcés pour assurer le positionnement optimal
            helpWindow.style.cssText = `
                position: fixed !important;
                top: 55% !important;
                left: 65% !important;
                transform: translate(-50%, -50%) !important;
                z-index: 99999 !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                background: none !important;
                box-shadow: none !important;
                width: auto !important;
                height: auto !important;
            `;
            
            document.body.appendChild(helpWindow);
            
            // Système intelligent de fermeture : ne se ferme que si la souris n'est pas dessus
            let autoCloseTimer;
            let isMouseOver = false;
            
            // Détecter quand la souris entre dans l'aide
            helpWindow.addEventListener('mouseenter', () => {
                isMouseOver = true;
                if (autoCloseTimer) {
                    clearTimeout(autoCloseTimer); // log désactivé
                }
            });
            
            // Détecter quand la souris sort de l'aide
            helpWindow.addEventListener('mouseleave', () => {
                isMouseOver = false;
                // console.log('🖱️ Souris sortie de l\'aide - redémarrage du timer'); // désactivé
                startAutoCloseTimer();
            });
            
            // Fonction pour démarrer le timer de fermeture
            function startAutoCloseTimer() {
                autoCloseTimer = setTimeout(() => {
                    if (helpWindow.parentElement && !isMouseOver) {
                        helpWindow.remove();
                        // console.log('⏰ Fermeture automatique de l\'aide (souris absente)'); // désactivé
                    }
                }, 8000);
            }
            
            // Démarrer le premier timer
            startAutoCloseTimer();
        }
        
        // Forcer les gestionnaires d'événements pour TOUS les outils
        const targetTools = [
            'selectTool',     // Sélection
            'moveTool',       // Déplacement  
            'deleteTool',     // Suppression
            'duplicateTool',  // Duplication
            'measureTool',    // Mesure
            'annotationTool', // Annotation
            'textLeaderTool', // Texte avec ligne
            'materialPaintMode' // Pinceau de matériau
        ];
        
        targetTools.forEach(targetTool => {
            const element = document.getElementById(targetTool);
            if (element) {
                // console.log(`🔧 Installation du patch pour ${targetTool}`);
                
                // Multiple approches pour capturer l'activation
                
                // 1. Événement de clic avec capture la plus haute priorité
                element.addEventListener('click', (e) => {
                    // console.log(`🎯 PATCH: Clic intercepté sur ${targetTool}`);
                    // Seulement si pas déjà en train d'afficher l'aide
                    if (!window.helpPatchLastTool || window.helpPatchLastTool !== targetTool || Date.now() - window.helpPatchLastTime > 2000) {
                        setTimeout(() => showToolHelp(targetTool), 100);
                    }
                }, { capture: true, passive: false });
                
                // 2. Surveillance des changements de classe (simplifiée)
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                            if (element.classList.contains('active')) {
                                // Seulement si ce n'est pas un changement récent
                                if (!window.helpPatchLastTool || Date.now() - window.helpPatchLastTime > 1000) {
                                    // console.log(`🔥 PATCH: Nouvelle activation détectée pour ${targetTool}`); // désactivé
                                    setTimeout(() => showToolHelp(targetTool), 200);
                                }
                            }
                        }
                    });
                });
                
                observer.observe(element, {
                    attributes: true,
                    attributeFilter: ['class']
                });
                
                // 3. Événement de mousedown pour capture précoce
                element.addEventListener('mousedown', () => {
                    // console.log(`🖱️ PATCH: MouseDown sur ${targetTool}`); // désactivé
                    setTimeout(() => {
                        if (element.classList.contains('active')) {
                            showToolHelp(targetTool);
                        }
                    }, 300);
                });
                
                // console.log(`✅ Patch installé pour ${targetTool}`);
            } else {
                console.warn(`⚠️ PATCH: Élément ${targetTool} non trouvé`);
            }
        });
        
        // Fonctions globales de test pour tous les outils
        window.forceHelpSelect = () => showToolHelp('selectTool');
        window.forceHelpMove = () => showToolHelp('moveTool');
        window.forceHelpDelete = () => showToolHelp('deleteTool');
        window.forceHelpDuplicate = () => showToolHelp('duplicateTool');
        window.forceHelpMeasure = () => showToolHelp('measureTool');
        window.forceHelpAnnotation = () => showToolHelp('annotationTool');
        window.forceHelpTextLeader = () => showToolHelp('textLeaderTool');
        
        // console.log('✅ Patch d\'aide contextuelle installé pour TOUS les outils !');
        // console.log('🧪 Tests disponibles: forceHelpSelect(), forceHelpMove(), forceHelpDelete(), forceHelpDuplicate(), forceHelpMeasure(), forceHelpAnnotation(), forceHelpTextLeader()');
        
        // Test automatique désactivé pour éviter l'affichage au démarrage
        // setTimeout(() => {
        //     console.log('🎪 Test automatique du patch...');
        //     showToolHelp('measureTool');
        // }, 3000);
        
    }, 4000); // Attendre 4 secondes après le load
});
