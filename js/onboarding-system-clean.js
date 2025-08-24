/**
 * Système d'onboarding propre et centré
 * Style premium unifié avec la bibliothèque
 */
class CleanOnboardingSystem {
    constructor() {
        this.isActive = false;
        this.currentStep = 0;
        this.tooltip = null;
        this.overlay = null;
        
        // Éléments pour l'indicateur visuel 3D
        this.highlightGroup = null;
        this.outlineMesh = null;
        this.arrowMesh = null;
        this.animationInterval = null;
        this.contextualBubble = null;
        
        // Étapes simplifiées - directement à l'essentiel
        this.steps = [
            {
                id: 'place-brick',
                title: 'Placer votre première brique',
                content: 'La brique M65 est déjà sélectionnée. Cliquez dans la zone 3D pour la placer.',
                showAction: true
            },
            {
                id: 'explain-ghost',
                title: 'Les briques fantômes : votre aide à la construction',
                content: '🎯 <strong>Astuce importante :</strong><br><br>💡 Cliquez sur votre brique pour faire apparaître des <strong>"briques fantômes"</strong> transparentes aux positions adjacentes.<br><br>✨ <strong>Ces fantômes vous aident à :</strong><br>• Voir où placer les prochaines briques<br>• Maintenir un alignement parfait<br>• Construire plus rapidement et précisément',
                showAction: true
            },
            {
                id: 'try-ghost',
                title: 'Essayez maintenant !',
                content: '👆 <strong>Cliquez sur votre brique</strong> pour voir les briques fantômes en action !<br><br>Les fantômes apparaissent pendant quelques secondes, puis disparaissent automatiquement.',
                showAction: false
            }
        ];
        
        this.setupEventListeners();
        // console.log('🎬 Clean Onboarding System initialisé');
    }
    
    setupEventListeners() {
        // Écouter l'événement de nouveau projet sur window (comme l'ancien système)
        window.addEventListener('startup-new-project', () => {
            // console.log('🎬 Événement startup-new-project reçu');
            this.start();
        });
        
        // Écouter le placement de briques avec le bon événement
        document.addEventListener('brickPlaced', (e) => {
            // console.log('🧱 Événement brickPlaced reçu:', e.detail);
            if (this.isActive && this.currentStep === 0) {
                // console.log('🎯 Passage à l\'explication des briques fantômes');
                setTimeout(() => this.nextStep(), 1000); // Passer à l'explication
            }
        });
        
        // Écouter aussi elementPlaced au cas où
        document.addEventListener('elementPlaced', (e) => {
            // console.log('🏗️ Événement elementPlaced reçu:', e.detail);
            if (this.isActive && this.currentStep === 0) {
                // console.log('🎯 Passage à l\'explication des briques fantômes');
                setTimeout(() => this.nextStep(), 1000);
            }
        });
        
        // Ajouter l'écouteur pour elementPlaced pour nettoyer les éléments visuels 3D
        this.elementPlacedCleanupListener = () => {
            this.cleanupHighlight();
        };
        
        document.addEventListener('elementPlaced', this.elementPlacedCleanupListener);
        
        // Écouter les clics sur les briques pour la dernière étape (étape 2 = index 2)
        document.addEventListener('click', (e) => {
            // Détecter si on a cliqué sur une brique pendant l'étape d'essai des fantômes
            if (this.isActive && this.currentStep === 2) {
                // Vérifier si le clic est sur une brique 3D (approximatif)
                const canvas = document.querySelector('canvas');
                if (canvas && e.target === canvas) {
                    // console.log('🎯 Clic sur la scène 3D - fin de l\'onboarding');
                    setTimeout(() => this.complete(), 2000); // Laisser le temps de voir les fantômes
                }
            }
        });
    }
    
    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.currentStep = 0;
        this.createOverlay();
        this.showStep();
        
        // console.log('🚀 Onboarding démarré');
    }
    
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.2);
            z-index: 99998;
            pointer-events: none;
        `;
        document.body.appendChild(this.overlay);
    }
    
    showStep() {
        const step = this.steps[this.currentStep];
        if (!step) return;
        
        // Supprimer l'ancien tooltip
        if (this.tooltip) {
            this.tooltip.remove();
        }
        
        // Créer le nouveau tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.innerHTML = `
            <div style="position: fixed; top: 50%; right: 500px; transform: translateY(-50%); width: 420px; background: linear-gradient(145deg, #ffffff 0%, #f0fff4 50%, #fefff8 100%); color: #1a4731; border: 3px solid transparent; background-clip: padding-box; border-radius: 20px; box-shadow: 0 25px 80px rgba(67, 160, 71, 0.25), 0 15px 35px rgba(255, 235, 59, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8); z-index: 99999; font-family: 'Segoe UI', 'Apple Color Emoji', Tahoma, Geneva, Verdana, sans-serif; backdrop-filter: blur(20px); overflow: hidden;">
                
                <!-- Effet de lumière premium -->
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%); animation: shimmer 4s ease-in-out infinite; pointer-events: none; border-radius: 20px;"></div>
                
                <!-- En-tête premium -->
                <div style="background: linear-gradient(135deg, #2e7d32 0%, #43a047 35%, #66bb6a 70%, #81c784 100%); padding: 24px 28px; border-radius: 17px 17px 0 0; display: flex; justify-content: space-between; align-items: center; position: relative; overflow: hidden;">
                    
                    <!-- Particules flottantes -->
                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 25% 25%, rgba(255, 235, 59, 0.15) 2px, transparent 2px), radial-gradient(circle at 75% 75%, rgba(129, 199, 132, 0.15) 2px, transparent 2px); background-size: 30px 30px; opacity: 0.6; animation: float 6s ease-in-out infinite;"></div>
                    
                    <div style="display: flex; align-items: center; gap: 16px; position: relative; z-index: 2;">
                        <div style="background: rgba(255,255,255,0.2); padding: 14px; border-radius: 50%; backdrop-filter: blur(10px); border: 2px solid rgba(255, 235, 59, 0.3);">
                            <i class="fas fa-rocket" style="font-size: 18px; color: #1a4731; text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${step.title}</h3>
                            <p style="margin: 4px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.9); font-weight: 500;">Étape ${this.currentStep + 1}/${this.steps.length}</p>
                        </div>
                    </div>
                    
                    <button class="close-onboarding" style="background: linear-gradient(135deg, rgba(255,235,59,0.4), rgba(255,193,7,0.6)); border: 2px solid rgba(255,255,255,0.3); color: white; font-size: 16px; cursor: pointer; padding: 8px; border-radius: 50%; transition: all 0.3s ease; backdrop-filter: blur(10px);">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- Corps -->
                <div style="padding: 28px; background: linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(240,255,244,0.9)); border-radius: 0 0 17px 17px;">
                    
                    <!-- Barre de progression -->
                    <div style="margin-bottom: 24px;">
                        <div style="background: linear-gradient(90deg, #e8f5e8, #f1f8e9); height: 6px; border-radius: 10px; overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(90deg, #2e7d32, #43a047); border-radius: 10px; width: ${((this.currentStep + 1) / this.steps.length) * 100}%; transition: width 0.8s ease; animation: progressShimmer 2s ease-in-out infinite;"></div>
                        </div>
                    </div>
                    
                    <!-- Contenu -->
                    <div style="text-align: center; margin-bottom: 24px;">
                        <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #1a4731; font-weight: 500;">${step.content}</p>
                    </div>
                    
                    <!-- Navigation -->
                    <div style="display: flex; justify-content: center; gap: 8px; margin-top: 20px;">
                        ${this.steps.map((_, index) => `
                            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${index <= this.currentStep ? 'linear-gradient(45deg, #2e7d32, #43a047)' : 'rgba(67, 160, 71, 0.2)'}; transition: all 0.3s ease; ${index === this.currentStep ? 'transform: scale(1.3); box-shadow: 0 0 0 2px rgba(67, 160, 71, 0.2);' : ''}"></div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes materialEntrance {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8) translateY(-20px); }
                    100% { opacity: 1; transform: translate(-50%, -50%) scale(1) translateY(0px); }
                }
                
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                
                @keyframes progressShimmer {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }
            </style>
        `;
        
        document.body.appendChild(this.tooltip);
        
        // Gestionnaires d'événements
        const closeBtn = this.tooltip.querySelector('.close-onboarding');
        closeBtn.addEventListener('click', () => this.complete());
    }
    
    nextStep() {
        this.currentStep++;
        if (this.currentStep >= this.steps.length) {
            this.complete();
        } else {
            // Si on passe à la dernière étape (essai des fantômes), créer l'indicateur visuel
            if (this.currentStep === 2) {
                setTimeout(() => this.createBrickHighlight(), 500);
            }
            this.showStep();
        }
    }
    
    // Créer l'indicateur visuel sur la dernière brique placée
    createBrickHighlight() {
        // console.log('🎯 Création de l\'indicateur visuel sur la brique');
        
        try {
            const lastBrick = this.findLastPlacedBrick();
            if (!lastBrick || !window.SceneManager?.scene) {
                console.warn('⚠️ Impossible de créer l\'indicateur - brique ou scène manquante');
                return;
            }

            // Nettoyer l'ancien indicateur s'il existe
            this.cleanupHighlight();

            const scene = window.SceneManager.scene;
            
            // Créer un groupe pour l'indicateur
            this.highlightGroup = new THREE.Group();
            this.highlightGroup.name = 'OnboardingHighlight';

            // Position et dimensions de la brique
            const brickPos = lastBrick.mesh.position;
            const brickDim = lastBrick.dimensions;

            // Créer un contour animé autour de la brique
            const outlineGeometry = new THREE.BoxGeometry(
                brickDim.length + 4,
                brickDim.height + 4, 
                brickDim.width + 4
            );
            
            const outlineMaterial = new THREE.MeshBasicMaterial({
                color: 0x4CAF50, // Vert pour correspondre au thème
                transparent: true,
                opacity: 0.4,
                wireframe: true
            });
            
            this.outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
            this.outlineMesh.position.copy(brickPos);
            this.outlineMesh.rotation.copy(lastBrick.mesh.rotation);

            // Créer une flèche pointant vers la brique
            this.createClickArrow(brickPos, brickDim);
            
            // Créer une bulle d'aide contextuelle
            this.createContextualBubble(lastBrick);

            this.highlightGroup.add(this.outlineMesh);
            if (this.arrowMesh) {
                this.highlightGroup.add(this.arrowMesh);
            }
            
            scene.add(this.highlightGroup);
            
            // Animation pulsante
            this.startHighlightAnimation();

            // console.log('✅ Indicateur visuel créé avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de la création de l\'indicateur:', error);
        }
    }
    
    // Trouver la dernière brique placée
    findLastPlacedBrick() {
        try {
            if (!window.SceneManager?.elements) {
                return null;
            }

            let lastBrick = null;
            let lastTime = 0;
            
            window.SceneManager.elements.forEach((element) => {
                if ((element.type === 'brick' || element.blockType) && element.creationTime) {
                    if (element.creationTime > lastTime) {
                        lastTime = element.creationTime;
                        lastBrick = element;
                    }
                }
            });

            // Si pas de creationTime, prendre la première brique
            if (!lastBrick) {
                window.SceneManager.elements.forEach((element) => {
                    if ((element.type === 'brick' || element.blockType) && !lastBrick) {
                        lastBrick = element;
                    }
                });
            }

            return lastBrick;
        } catch (error) {
            console.warn('⚠️ Erreur recherche brique:', error);
            return null;
        }
    }
    
    // Créer une flèche pointant vers la brique
    createClickArrow(brickPos, brickDim) {
        try {
            // Créer une géométrie de flèche simple
            const arrowGeometry = new THREE.ConeGeometry(2, 6, 8);
            const arrowMaterial = new THREE.MeshBasicMaterial({
                color: 0x4CAF50,
                transparent: true,
                opacity: 0.8
            });
            
            this.arrowMesh = new THREE.Mesh(arrowGeometry, arrowMaterial);
            
            // Positionner la flèche juste au-dessus de la brique
            this.arrowMesh.position.set(
                brickPos.x,
                brickPos.y + brickDim.height + 2, // Réduit de 10 à 2 unités
                brickPos.z
            );
            
            // Orienter la flèche vers le bas
            this.arrowMesh.rotation.x = Math.PI;
            
        } catch (error) {
            console.warn('⚠️ Erreur création flèche:', error);
        }
    }
    
    // Créer une bulle d'aide contextuelle près de la brique
    createContextualBubble(brick) {
        try {
            // Obtenir la position 2D de la brique à l'écran
            const canvas = document.querySelector('canvas');
            if (!canvas || !window.SceneManager?.camera) return;

            const vector = new THREE.Vector3();
            vector.copy(brick.mesh.position);
            vector.project(window.SceneManager.camera);

            // Convertir en coordonnées d'écran
            const x = (vector.x * 0.5 + 0.5) * canvas.clientWidth;
            const y = (vector.y * -0.5 + 0.5) * canvas.clientHeight;

            // Créer la bulle d'aide
            this.contextualBubble = document.createElement('div');
            this.contextualBubble.style.cssText = `
                position: fixed;
                left: ${x + 50}px;
                top: ${y - 100}px;
                background: linear-gradient(145deg, #4CAF50, #66BB6A);
                color: white;
                padding: 12px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                box-shadow: 0 8px 20px rgba(76, 175, 80, 0.3);
                z-index: 99999;
                pointer-events: none;
                animation: bubbleBounce 2s infinite;
                max-width: 200px;
                text-align: center;
            `;
            
            this.contextualBubble.innerHTML = `
                Cliquez sur la<br>
                <strong>face supérieure</strong><br>
                <small>pour voir les propositions<br>de briques</small>
            `;

            // Ajouter les styles d'animation
            if (!document.getElementById('bubbleStyles')) {
                const style = document.createElement('style');
                style.id = 'bubbleStyles';
                style.textContent = `
                    @keyframes bubbleBounce {
                        0%, 100% { transform: translateY(0px) scale(1); }
                        50% { transform: translateY(-5px) scale(1.05); }
                    }
                `;
                document.head.appendChild(style);
            }

            document.body.appendChild(this.contextualBubble);
            
            // Supprimer la bulle après 8 secondes
            setTimeout(() => {
                if (this.contextualBubble) {
                    this.contextualBubble.remove();
                    this.contextualBubble = null;
                }
            }, 8000);
            
        } catch (error) {
            console.warn('⚠️ Erreur création bulle contextuelle:', error);
        }
    }
    
    // Animation pulsante de l'indicateur
    startHighlightAnimation() {
        if (!this.outlineMesh && !this.arrowMesh) return;
        
        let scale = 1;
        let growing = true;
        
        this.animationInterval = setInterval(() => {
            if (growing) {
                scale += 0.02;
                if (scale >= 1.2) growing = false;
            } else {
                scale -= 0.02;
                if (scale <= 1) growing = true;
            }
            
            if (this.outlineMesh) {
                this.outlineMesh.scale.setScalar(scale);
            }
            if (this.arrowMesh) {
                this.arrowMesh.position.y += growing ? 0.1 : -0.1;
            }
        }, 50);
    }
    
    // Nettoyer l'indicateur visuel
    cleanupHighlight() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
        
        if (this.contextualBubble) {
            this.contextualBubble.remove();
            this.contextualBubble = null;
        }
        
        if (this.highlightGroup && window.SceneManager?.scene) {
            window.SceneManager.scene.remove(this.highlightGroup);
        }
        
        this.highlightGroup = null;
        this.outlineMesh = null;
        this.arrowMesh = null;
    }
    
    complete() {
        // console.log('✅ Clean Onboarding terminé');
        this.isActive = false;
        
        // Nettoyer l'indicateur visuel
        this.cleanupHighlight();
        
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
        
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        
        // ÉMETTRE L'ÉVÉNEMENT ONBOARDINGCOMPLETE POUR DÉCLENCHER L'AIDE OUTILS
        // console.log('🔧 Émission de l\'événement onboardingComplete');
        const event = new CustomEvent('onboardingComplete');
        document.dispatchEvent(event);
        
        // DÉCLENCHER DIRECTEMENT L'AIDE OUTILS EN BACKUP
        setTimeout(() => {
            if (window.toolsHelpSystem && typeof window.toolsHelpSystem.forceShowHelp === 'function') {
                // console.log('🔧 Déclenchement direct aide outils après clean onboarding');
                window.toolsHelpSystem.forceShowHelp();
            } else {
                // console.log('❌ toolsHelpSystem non disponible depuis clean onboarding');
            }
        }, 1000);
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.CleanOnboardingSystem = new CleanOnboardingSystem();
    
    // Test manuel accessible dans la console
    window.testCleanOnboarding = () => {
        // console.log('🧪 Test manuel de l\'onboarding');
        window.CleanOnboardingSystem.start();
    };
    
    // console.log('🎬 Clean Onboarding System prêt ! Utilisez testCleanOnboarding() pour tester.');
});
