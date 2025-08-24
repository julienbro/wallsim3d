/**
 * Système d'onbo            {
                id: 'show-adjacent-bricks',
                title: '🎯 Découvrir les briques adjacentes',
                content: 'Parfait ! Maintenant cliquez sur la <strong>face supérieure de votre brique</strong> pour faire apparaître les briques adjacentes et continuer votre construction !<br><br>👆 Regardez l\'animation pour voir où cliquer exactement.',
                target: null,
                position: 'center',
                action: 'waitForBrickClick'
            },
            {
                id: 'choose-placement-position',
                title: '🏗️ Choisir une position de pose',
                content: 'Excellent ! Les briques blanches fantômes montrent les <strong>positions possibles</strong> pour placer la prochaine brique.<br><br>👆 Cliquez sur l\'une des briques blanches pour placer votre prochaine brique à cet emplacement !',
                target: null,
                position: 'center',
                action: 'waitForGhostClick'
            },
            {
                id: 'congratulations',
                title: '🎉 Félicitations !',
                content: 'Excellent ! Vous maîtrisez maintenant les bases de WallSim3D !<br><br>✨ Vous pouvez continuer à placer des briques adjacentes ou explorer les autres outils disponibles.<br><br>🚀 Bon construction !',
                target: null,
                position: 'center',
                action: null
            }ontextuelle pour les premiers pas
 * Guide l'utilisateur pour poser sa première brique et comprendre les interactions
 */

class OnboardingSystem {
    constructor() {
        this.currentStep = 0;
        this.isActive = false;
        this.overlay = null;
        this.tooltip = null;
        this.hasShownCongratulations = false; // Pour suivre si on a montré les félicitations
        // Supprimer hasSeenOnboarding - toujours afficher l'onboarding
        this.steps = [
            {
                id: 'place-first-brick',
                title: '🎯 Placer un élément dans la scène',
                content: 'Une brique M65 est déjà sélectionnée par défaut. Vous pouvez directement cliquer dans la zone 3D pour la placer, ou choisir un autre élément dans l\'onglet "Biblio" à droite.',
                target: '#threejs-canvas',
                position: 'center-overlay',
                action: 'waitForFirstBrick'
            },
            {
                id: 'show-adjacent-bricks',
                title: '� Découvrir les briques adjacentes',
                content: 'Parfait ! Maintenant cliquez sur le <strong>dos de votre brique</strong> pour faire apparaître les briques adjacentes et continuer votre construction !<br><br>👆 Regardez l\'animation pour voir où cliquer exactement.',
                target: null,
                position: 'center',
                action: 'waitForBrickClick'
            }
        ];
        
        this.init();
    }

    init() {
        console.log('🚀 OnboardingSystem initialisé - ATTENTE de fermeture popup');
        
        // Variable pour s'assurer qu'on démarre qu'une seule fois
        this.hasStartedOnce = false;
        
        // UNIQUEMENT écouter l'événement explicite de fermeture de popup
        window.addEventListener('startup-popup-closed', () => {
            if (this.hasStartedOnce) {
                console.log('⚠️ Onboarding déjà démarré, ignoré');
                return;
            }
            console.log('✅ Événement startup-popup-closed détecté - démarrage de l\'onboarding');
            this.hasStartedOnce = true;
            setTimeout(() => {
                console.log('🎯 Lancement de l\'onboarding après popup fermée');
                this.start();
            }, 500);
        });
        
        // UNIQUEMENT écouter l'événement nouveau projet
        window.addEventListener('startup-new-project', () => {
            if (this.hasStartedOnce) {
                console.log('⚠️ Onboarding déjà démarré, ignoré');
                return;
            }
            console.log('🆕 Événement startup-new-project détecté - démarrage de l\'onboarding');
            this.hasStartedOnce = true;
            setTimeout(() => {
                console.log('🎯 Lancement de l\'onboarding après nouveau projet');
                this.start();
            }, 800);
        });
        
        console.log('⏰ OnboardingSystem en attente EXCLUSIVE des événements startup...');
    }

    start() {
        if (this.isActive) {
            console.log('⚠️ Onboarding déjà actif, ignoré');
            return;
        }

        console.log('🎯 Démarrage de l\'onboarding...');
        this.isActive = true;
        this.currentStep = 0;
        this.showCurrentStep();
        
        // Écouter l'événement de placement de brique
        this.setupBrickPlacementListener();
        
        // Écouter les clics sur les briques
        this.setupBrickClickListener();
    }
    
    setupBrickPlacementListener() {
        // Écouter l'événement personnalisé émis par le SceneManager
        const handleBrickPlacement = (event) => {
            // Ignorer les événements de test
            if (event.detail && event.detail.test) {
                console.log('🧪 Événement de test ignoré');
                return;
            }
            
            console.log('🧱 Première brique placée détectée !', event.detail);
            if (this.isActive && this.currentStep === 0) { // Étape "place-first-brick" (à l'index 0)
                // Passer à l'étape suivante (félicitations) normalement
                this.nextStep();
            } else if (!this.isActive && !this.hasShownCongratulations) {
                // Si l'onboarding a été fermé mais on n'a pas encore montré les félicitations
                console.log('🎉 Première brique placée après fermeture - affichage des félicitations');
                this.hasShownCongratulations = true;
                this.showCongratulationsOnly();
            }
        };
        
        // Supprimer l'ancien listener s'il existe
        if (this.brickPlacementListener) {
            document.removeEventListener('brickPlaced', this.brickPlacementListener);
            window.removeEventListener('brickPlaced', this.brickPlacementListener);
        }
        
        this.brickPlacementListener = handleBrickPlacement;
        // Écouter sur document ET window pour être sûr
        document.addEventListener('brickPlaced', this.brickPlacementListener);
        window.addEventListener('brickPlaced', this.brickPlacementListener);
        
        // Ajouter l'écouteur pour elementPlaced pour nettoyer les éléments visuels 3D
        this.elementPlacedListener = () => {
            this.cleanupHighlight();
            this.cleanupClickAnimation();
            this.cleanupGhostEffects();
        };
        
        document.addEventListener('elementPlaced', this.elementPlacedListener);
        
        // Listeners configurés
    }

    setupBrickClickListener() {
        // Écouter les clics sur les briques pour passer aux étapes suivantes
        document.addEventListener('click', this.brickClickHandler.bind(this));
        console.log('👂 Listener de clic sur brique configuré');
    }

    brickClickHandler(event) {
        if (!this.isActive || this.currentStep < 0) return;

        const currentStepData = this.steps[this.currentStep];
        if (!currentStepData) return;

        // Si on est à l'étape "show-adjacent-bricks", détecter le clic sur la vraie brique
        if (currentStepData.id === 'show-adjacent-bricks') {
            // Vérifier si le clic est sur une brique réelle
            if (this.isClickOnBrick(event)) {
                console.log('✅ Clic détecté sur la brique - passage à l\'étape suivante');
                this.nextStep();
            }
        }
        
        // Si on est à l'étape "choose-placement-position", détecter le clic sur une brique fantôme
        if (currentStepData.id === 'choose-placement-position') {
            if (this.isClickOnGhostBrick(event)) {
                console.log('✅ Clic détecté sur une brique fantôme - passage à l\'étape suivante');
                this.nextStep();
            }
        }
    }

    // Vérifier si le clic est sur une brique réelle
    isClickOnBrick(event) {
        try {
            if (!window.SceneManager || !window.SceneManager.camera) return false;

            const mouse = new THREE.Vector2();
            const canvas = document.querySelector('#threejs-canvas') || document.querySelector('canvas');
            if (!canvas) return false;

            const rect = canvas.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, window.SceneManager.camera);

            // Chercher les intersections avec les briques réelles
            const lastBrick = this.findLastPlacedBrick();
            if (lastBrick && lastBrick.mesh) {
                const intersects = raycaster.intersectObject(lastBrick.mesh, false);
                return intersects.length > 0;
            }

            return false;
        } catch (error) {
            console.warn('⚠️ Erreur lors de la détection de clic sur brique:', error);
            return false;
        }
    }

    // Vérifier si le clic est sur une brique fantôme
    isClickOnGhostBrick(event) {
        try {
            if (!window.SceneManager || !window.SceneManager.camera) return false;

            const mouse = new THREE.Vector2();
            const canvas = document.querySelector('#threejs-canvas') || document.querySelector('canvas');
            if (!canvas) return false;

            const rect = canvas.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, window.SceneManager.camera);

            // Chercher les intersections avec tous les objets de la scène
            const intersects = raycaster.intersectObjects(window.SceneManager.scene.children, true);

            // Vérifier si une intersection correspond à une brique fantôme
            for (const intersect of intersects) {
                const object = intersect.object;
                if (object.material && (
                    (object.material.transparent && object.material.opacity < 0.8) ||
                    object.material.wireframe ||
                    object.userData?.isGhost ||
                    object.userData?.type === 'ghost' ||
                    object.name?.includes('ghost') ||
                    object.name?.includes('Ghost')
                )) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.warn('⚠️ Erreur lors de la détection de clic sur brique fantôme:', error);
            return false;
        }
    }

    showCurrentStep() {
        const step = this.steps[this.currentStep];
        if (!step) {
            console.log('❌ Étape non trouvée:', this.currentStep);
            return;
        }

        console.log('📋 Affichage étape:', step.id, '(' + (this.currentStep + 1) + '/' + this.steps.length + ')');
        
        this.createTooltip(step);
        
        // Si c'est l'étape de placement, ajouter la mise en valeur visuelle
        if (step.id === 'place-first-brick') {
            this.highlight3DZone();
            this.showClickAnimation();
            console.log('⏳ Attente de placement de brique...');
        }
        
        // Si c'est l'étape des briques adjacentes, montrer l'animation de clic sur le dos
        if (step.id === 'show-adjacent-bricks') {
            this.highlightBrickBack();
            this.showBrickClickAnimation();
            console.log('⏳ Attente de clic sur la brique...');
        }

        // Si c'est l'étape de choix de position, montrer les briques fantômes
        if (step.id === 'choose-placement-position') {
            this.highlightGhostBricks();
            console.log('⏳ Attente de clic sur une brique fantôme...');
        }
    }
    
    createTooltip(step) {
        // Supprimer l'ancien tooltip
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }

        // Créer le nouveau tooltip avec le style exact de help-patch.js
        this.tooltip = document.createElement('div');
        
        // Position et style basés sur help-patch.js
        let positionStyle = '';
        switch (step.position) {
            case 'center':
            case 'center-overlay':
                // Centrer avec des pixels absolus calculés
                positionStyle = 'position: fixed !important; top: calc(50vh - 200px) !important; left: calc(50vw - 225px) !important; transform: none !important; margin: 0 !important;';
                break;
            default:
                positionStyle = 'position: fixed !important; top: calc(50vh - 200px) !important; left: calc(50vw - 225px) !important; transform: none !important; margin: 0 !important;';
        }

        this.tooltip.innerHTML = `
            <div style="${positionStyle} width: 450px; max-width: 95vw; max-height: 95vh; overflow: hidden; background: linear-gradient(145deg, #ffffff 0%, #f0fff4 50%, #fefff8 100%); color: #1a4731; border: 3px solid transparent; background-clip: padding-box; border-radius: 20px; box-shadow: 0 25px 80px rgba(67, 160, 71, 0.25), 0 15px 35px rgba(255, 235, 59, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8); z-index: 99999 !important; font-family: 'Segoe UI', 'Apple Color Emoji', Tahoma, Geneva, Verdana, sans-serif; animation: materialEntrance 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), pulse 3s ease-in-out infinite 1s; backdrop-filter: blur(20px); border-image: linear-gradient(45deg, rgba(67, 160, 71, 0.6), rgba(255, 235, 59, 0.4), rgba(102, 187, 106, 0.5)) 1; position: relative;">
                
                <!-- Effet de lumière premium -->
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%); animation: shimmer 4s ease-in-out infinite; pointer-events: none; border-radius: 20px;"></div>
                
                <!-- En-tête premium avec gradient vert -->
                <div style="background: linear-gradient(135deg, #2e7d32 0%, #43a047 35%, #66bb6a 70%, #81c784 100%); padding: 22px 28px; border-radius: 17px 17px 0 0; display: flex; justify-content: space-between; align-items: center; position: relative; overflow: hidden;">
                    
                    <!-- Particules flottantes vertes -->
                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 25% 25%, rgba(255, 235, 59, 0.15) 2px, transparent 2px), radial-gradient(circle at 75% 75%, rgba(129, 199, 132, 0.15) 2px, transparent 2px); background-size: 30px 30px; opacity: 0.6; animation: float 6s ease-in-out infinite;"></div>
                    
                    <!-- Effet scanline premium -->
                    <div style="position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, rgba(255, 235, 59, 0.8), transparent); animation: scanline 3s ease-in-out infinite;"></div>
                    
                    <div style="display: flex; align-items: center; gap: 16px; position: relative; z-index: 2;">
                        <div style="background: rgba(255,255,255,0.2); padding: 14px; border-radius: 50%; backdrop-filter: blur(10px); border: 2px solid rgba(255, 235, 59, 0.3); position: relative;">
                            <div style="position: absolute; top: 50%; left: 50%; width: 8px; height: 8px; background: radial-gradient(circle, #ffeb3b 0%, transparent 70%); transform: translate(-50%, -50%); border-radius: 50%; animation: sparkle 1.5s ease-in-out infinite;"></div>
                            <i class="fas fa-rocket" style="font-size: 18px; color: #1a4731; text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.3); letter-spacing: -0.3px; background: linear-gradient(45deg, #ffffff, #e8f5e8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${step.title}</h3>
                            <p style="margin: 4px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.9); font-weight: 500; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">Guide interactif • Étape ${this.currentStep + 1}/${this.steps.length}</p>
                        </div>
                    </div>
                        
                    <button onclick="window.OnboardingSystem.complete()" style="background: linear-gradient(135deg, rgba(255,235,59,0.4), rgba(255,193,7,0.6)); border: 2px solid rgba(255,255,255,0.3); color: white; font-size: 18px; cursor: pointer; padding: 10px; border-radius: 50%; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); backdrop-filter: blur(10px); z-index: 2; position: relative; box-shadow: 0 4px 12px rgba(255, 193, 7, 0.2);" onmouseover="this.style.transform='scale(1.1) rotate(90deg)'; this.style.background='linear-gradient(135deg, rgba(255,235,59,0.7), rgba(255,193,7,0.9))'" onmouseout="this.style.transform='scale(1) rotate(0deg)'; this.style.background='linear-gradient(135deg, rgba(255,235,59,0.4), rgba(255,193,7,0.6))'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- Corps avec effet glass morphism -->
                <div style="padding: 28px; background: linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(240,255,244,0.9)); border-radius: 0 0 17px 17px; position: relative;">
                    <!-- Motif décoratif -->
                    <div style="position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #43a047, #ffeb3b, #43a047, transparent); opacity: 0.6;"></div>
                    
                    <!-- Indicateur de progression premium -->
                    <div style="margin-bottom: 24px; animation: materialEntrance 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s both;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                            <div style="flex: 1; height: 8px; background: linear-gradient(90deg, #e8f5e8, #f1f8e9); border-radius: 10px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(67, 160, 71, 0.1);">
                                <div style="height: 100%; background: linear-gradient(90deg, #2e7d32, #43a047, #66bb6a); border-radius: 10px; width: ${((this.currentStep + 1) / this.steps.length) * 100}%; transition: width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94); box-shadow: 0 2px 8px rgba(67, 160, 71, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3); animation: progressShimmer 2s ease-in-out infinite;"></div>
                            </div>
                            <div style="background: linear-gradient(135deg, #2e7d32, #43a047); color: white; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.2); box-shadow: 0 3px 10px rgba(67, 160, 71, 0.3);">
                                ${this.currentStep + 1}/${this.steps.length}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Zone de contenu principale premium -->
                    <div style="background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,255,244,0.8) 100%); padding: 28px 30px; margin-bottom: 24px; border-radius: 18px; border: 2px solid rgba(67, 160, 71, 0.15); position: relative; animation: materialEntrance 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s both; backdrop-filter: blur(10px); box-shadow: 0 8px 25px rgba(67, 160, 71, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6);">
                        <!-- Icône décorative premium -->
                        <div style="position: absolute; top: 16px; right: 16px; opacity: 0.15; font-size: 42px; color: #43a047; animation: pulse 3s ease-in-out infinite;">
                            <i class="fas fa-lightbulb"></i>
                        </div>
                        
                        <!-- Effet de brillance -->
                        <div style="position: absolute; top: 0; left: 0; right: 0; height: 100%; background: linear-gradient(45deg, transparent 30%, rgba(255, 235, 59, 0.08) 50%, transparent 70%); animation: shimmer 4s ease-in-out infinite; border-radius: 18px; pointer-events: none;"></div>
                        
                        <div style="position: relative; z-index: 1;">
                            <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #1a4731; font-weight: 500; text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8); text-align: center;">${step.content}</p>
                        </div>
                    </div>
                    
                    <!-- Call-to-action premium -->
                    ${step.id === 'place-first-brick' ? `
                        <div style="background: linear-gradient(135deg, #2e7d32 0%, #43a047 35%, #66bb6a 70%, #81c784 100%); padding: 24px; border-radius: 18px; text-align: center; position: relative; overflow: hidden; animation: materialEntrance 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.6s both; cursor: pointer; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); box-shadow: 0 12px 30px rgba(67, 160, 71, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3); border: 2px solid rgba(255, 235, 59, 0.4);" onmouseover="this.style.transform='translateY(-3px) scale(1.02)'; this.style.boxShadow='0 20px 40px rgba(67, 160, 71, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 12px 30px rgba(67, 160, 71, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)'">
                            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.15) 50%, transparent 70%); animation: shimmer 3s ease-in-out infinite;"></div>
                            
                            <!-- Particules décoratives -->
                            <div style="position: absolute; top: 10px; left: 20px; width: 4px; height: 4px; background: radial-gradient(circle, #ffeb3b, transparent); border-radius: 50%; animation: twinkle 2s ease-in-out infinite;"></div>
                            <div style="position: absolute; bottom: 15px; right: 25px; width: 3px; height: 3px; background: radial-gradient(circle, #ffeb3b, transparent); border-radius: 50%; animation: twinkle 2s ease-in-out infinite 1s;"></div>
                            
                            <div style="position: relative; z-index: 1;">
                                <div style="font-size: 32px; margin-bottom: 12px; animation: bounce 2s ease-in-out infinite; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">👆</div>
                                <p style="margin: 0; color: #ffffff; font-weight: 700; font-size: 17px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); letter-spacing: 0.3px;">Cliquez dans la zone 3D pour placer votre première brique</p>
                                <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 500; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">La brique M65 est déjà sélectionnée pour vous</p>
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Navigation / Status premium -->
                    <div style="display: flex; justify-content: center; align-items: center; margin-top: 24px; animation: materialEntrance 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.8s both;">
                        <div style="display: flex; gap: 10px; align-items: center; background: rgba(255,255,255,0.6); padding: 12px 20px; border-radius: 25px; backdrop-filter: blur(10px); box-shadow: 0 4px 15px rgba(67, 160, 71, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8);">
                            ${this.steps.map((_, index) => `
                                <div style="width: 10px; height: 10px; border-radius: 50%; background: ${index <= this.currentStep ? 'linear-gradient(45deg, #2e7d32, #43a047, #66bb6a)' : 'rgba(67, 160, 71, 0.2)'}; transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); ${index === this.currentStep ? 'transform: scale(1.4); box-shadow: 0 0 0 3px rgba(67, 160, 71, 0.2), 0 2px 8px rgba(67, 160, 71, 0.3);' : ''} ${index < this.currentStep ? 'box-shadow: 0 2px 6px rgba(67, 160, 71, 0.2);' : ''}"></div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes materialEntrance {
                    0% { 
                        opacity: 0; 
                        transform: translate(-50%, -50%) scale(0.8) rotateY(45deg); 
                        filter: blur(10px);
                    }
                    100% { 
                        opacity: 1; 
                        transform: translate(-50%, -50%) scale(1) rotateY(0deg); 
                        filter: blur(0px);
                    }
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                
                @keyframes scanline {
                    0% { transform: translateX(-100%); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateX(100%); opacity: 0; }
                }
                
                @keyframes sparkle {
                    0%, 100% { opacity: 0.8; transform: scale(1) rotate(0deg); }
                    50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
                }
                
                @keyframes progressShimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-15px); }
                    60% { transform: translateY(-8px); }
                }
                
                @keyframes twinkle {
                    0%, 100% { opacity: 0.8; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
                
                @keyframes wave {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
            </style>
        `;
        
        // Ajouter au DOM
        document.body.appendChild(this.tooltip);
        
        // Injecter des styles CSS ultra-prioritaires pour forcer le centrage
        const forcePositionStyle = document.createElement('style');
        forcePositionStyle.textContent = `
            .onboarding-tooltip div[style*="position: fixed"] {
                position: fixed !important;
                top: 50vh !important;
                left: 50vw !important;
                transform: translate(-50%, -50%) !important;
                margin: 0 !important;
                right: auto !important;
                bottom: auto !important;
            }
        `;
        document.head.appendChild(forcePositionStyle);
        
        // Ajouter une classe pour cibler l'élément
        this.tooltip.className = 'onboarding-tooltip';
        
        // Forcer le positionnement après ajout au DOM
        setTimeout(() => {
            const tooltipDiv = this.tooltip.querySelector('div');
            if (tooltipDiv) {
                tooltipDiv.style.setProperty('position', 'fixed', 'important');
                tooltipDiv.style.setProperty('top', '50vh', 'important');
                tooltipDiv.style.setProperty('left', '50vw', 'important');
                tooltipDiv.style.setProperty('transform', 'translate(-50%, -50%)', 'important');
                tooltipDiv.style.setProperty('margin', '0', 'important');
                tooltipDiv.style.setProperty('right', 'auto', 'important');
                tooltipDiv.style.setProperty('bottom', 'auto', 'important');
                console.log('🎯 Position onboarding forcée au centre avec setProperty');
            }
        }, 10);
        
        // Animation d'apparition
        requestAnimationFrame(() => {
            this.tooltip.style.opacity = '1';
        });
    }

    nextStep() {
        console.log('➡️ Passage à l\'étape suivante');
        this.currentStep++;
        
        if (this.currentStep >= this.steps.length) {
            this.complete();
        } else {
            this.showCurrentStep();
        }
    }

    complete() {
        console.log('✅ Onboarding terminé');
        this.isActive = false;
        
        // Supprimer le tooltip
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
        
        // Supprimer l'overlay
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        
        // ÉMETTRE UN ÉVÉNEMENT POUR DÉCLENCHER L'AIDE TOOLBAR
        const event = new CustomEvent('onboardingComplete');
        document.dispatchEvent(event);
        console.log('🛠️ Événement onboardingComplete émis');
        
        // AIDE TOOLBAR DÉSACTIVÉE - Plus besoin d'aide pour la toolbar
        // setTimeout(() => {
        //     if (window.ToolbarHelpSystem && typeof window.showToolbarHelp === 'function') {
        //         console.log('🛠️ Déclenchement direct aide toolbar après onboarding');
        //         window.showToolbarHelp();
        //     } else {
        //         console.log('❌ ToolbarHelpSystem non disponible');
        //     }
        // }, 2000);
        
        // DÉCLENCHER DIRECTEMENT L'AIDE OUTILS EN BACKUP
        setTimeout(() => {
            if (window.toolsHelpSystem && typeof window.toolsHelpSystem.forceShowHelp === 'function') {
                console.log('🔧 Déclenchement direct aide outils après onboarding');
                window.toolsHelpSystem.forceShowHelp();
            } else {
                console.log('❌ toolsHelpSystem non disponible');
            }
        }, 1000);
        
        // NE PAS nettoyer les listeners - garder l'écoute des briques
        // pour pouvoir montrer les félicitations même après fermeture
        
        // Ne plus sauvegarder dans localStorage - supprimé pour toujours afficher
    }

    // Méthode pour afficher seulement les félicitations (après fermeture manuelle)
    showCongratulationsOnly() {
        console.log('🎊 Affichage des félicitations uniquement');
        const congratsStep = this.steps[1]; // L'étape de félicitations (maintenant à l'index 1)
        this.createTooltipForCongrats(congratsStep);
        
        // Auto-fermeture après 8 secondes
        setTimeout(() => {
            if (this.tooltip) {
                this.tooltip.remove();
                this.tooltip = null;
            }
        }, 8000);
    }

    // Version spéciale du tooltip pour les félicitations uniquement
    createTooltipForCongrats(step) {
        // Supprimer l'ancien tooltip
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }

        // Créer le tooltip simple
        this.tooltip = document.createElement('div');
        
        this.tooltip.innerHTML = `
            <div style="position: fixed !important; top: 50vh !important; left: 50vw !important; transform: translate(-50%, -50%) !important; margin: 0 !important; width: 480px; max-width: 95vw; max-height: 95vh; overflow: hidden; background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(20px); color: #1a1a1a; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 24px; box-shadow: 0 32px 64px rgba(76, 175, 80, 0.15), 0 16px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.05); z-index: 99999 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, system-ui, sans-serif; animation: celebrationEnter 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); position: relative;">
                
                <!-- Fond de célébration animé -->
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at 30% 40%, rgba(76, 175, 80, 0.05) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(139, 195, 74, 0.05) 0%, transparent 50%); animation: celebrationBg 6s ease-in-out infinite; border-radius: 24px;"></div>
                
                <!-- Confettis flottants -->
                <div style="position: absolute; top: -10%; left: -10%; right: -10%; bottom: -10%; background-image: radial-gradient(circle at 15% 25%, #4caf50 2px, transparent 2px), radial-gradient(circle at 85% 75%, #8bc34a 1px, transparent 1px), radial-gradient(circle at 45% 15%, #cddc39 1.5px, transparent 1.5px), radial-gradient(circle at 65% 85%, #ffeb3b 1px, transparent 1px); background-size: 80px 80px, 120px 120px, 100px 100px, 140px 140px; animation: confetti 15s linear infinite; opacity: 0.6;"></div>
                
                <!-- En-tête de félicitations -->
                <div style="background: linear-gradient(135deg, #4caf50 0%, #8bc34a 50%, #cddc39 100%); padding: 32px 28px 28px 28px; border-radius: 24px 24px 0 0; position: relative; overflow: hidden; text-align: center;">
                    
                    <!-- Effet de rayons lumineux -->
                    <div style="position: absolute; top: 50%; left: 50%; width: 200%; height: 200%; background: conic-gradient(from 0deg, transparent, rgba(255,255,255,0.1), transparent, rgba(255,255,255,0.1), transparent); animation: rays 8s linear infinite; transform: translate(-50%, -50%);"></div>
                    
                    <!-- Étoile principale animée -->
                    <div style="position: relative; z-index: 3; margin-bottom: 16px;">
                        <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 20px; border-radius: 50%; backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.3); animation: starPulse 2s ease-in-out infinite;">
                            <i class="fas fa-star" style="font-size: 32px; color: #ffffff; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1)); animation: starGlow 3s ease-in-out infinite;"></i>
                        </div>
                    </div>
                    
                    <div style="position: relative; z-index: 2;">
                        <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 800; color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.1); letter-spacing: -1px; animation: titleBounce 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.5s both;">${step.title}</h2>
                        <p style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.9); font-weight: 500; animation: subtitleSlide 0.6s ease-out 0.7s both;">🎉 Première étape terminée avec succès !</p>
                    </div>
                    
                    <!-- Bouton de fermeture élégant -->
                    <button onclick="window.OnboardingSystem.complete()" style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.8); font-size: 16px; cursor: pointer; padding: 10px; border-radius: 12px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); backdrop-filter: blur(10px); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;" onmouseover="this.style.background='rgba(255,255,255,0.25)'; this.style.transform='scale(1.1) rotate(90deg)'; this.style.color='#ffffff'" onmouseout="this.style.background='rgba(255,255,255,0.15)'; this.style.transform='scale(1) rotate(0deg)'; this.style.color='rgba(255,255,255,0.8)'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- Contenu de félicitations -->
                <div style="padding: 40px 32px 32px 32px; position: relative; text-align: center;">
                    
                    <!-- Message principal -->
                    <div style="background: linear-gradient(135deg, #f1f8e9 0%, #e8f5e8 100%); padding: 32px; margin-bottom: 28px; border-radius: 20px; border: 1px solid rgba(76, 175, 80, 0.1); position: relative; animation: contentSlideUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both;">
                        
                        <!-- Icône décorative -->
                        <div style="position: absolute; top: 16px; right: 16px; opacity: 0.1; font-size: 64px; color: #4caf50; animation: decorRotate 10s linear infinite;">
                            <i class="fas fa-trophy"></i>
                        </div>
                        
                        <div style="position: relative; z-index: 1;">
                            <p style="margin: 0 0 16px 0; font-size: 18px; line-height: 1.6; color: #2e7d32; font-weight: 600;">${step.content}</p>
                            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #4caf50; font-weight: 500;">Vous maîtrisez maintenant les bases du placement d'éléments !</p>
                        </div>
                    </div>
                    
                    <!-- Statistiques de progression -->
                    <div style="display: flex; justify-content: center; gap: 24px; margin-bottom: 28px; animation: statsSlideUp 0.6s ease-out 0.5s both;">
                        <div style="text-align: center;">
                            <div style="width: 56px; height: 56px; margin: 0 auto 8px; background: linear-gradient(135deg, #4caf50, #8bc34a); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px; animation: statsPulse 2s ease-in-out infinite;">✓</div>
                            <p style="margin: 0; font-size: 12px; color: #4caf50; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Complété</p>
                        </div>
                        <div style="text-align: center;">
                            <div style="width: 56px; height: 56px; margin: 0 auto 8px; background: linear-gradient(135deg, #2196f3, #03a9f4); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 16px;">2/2</div>
                            <p style="margin: 0; font-size: 12px; color: #2196f3; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Étapes</p>
                        </div>
                    </div>
                    
                    <!-- Message de fermeture automatique avec style -->
                    <div style="animation: autoCloseSlide 0.6s ease-out 0.7s both;">
                        <div style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.2); border-radius: 50px; color: #4caf50; font-size: 13px; font-weight: 500;">
                            <div style="width: 8px; height: 8px; border-radius: 50%; background: #4caf50; animation: pulse 1.5s ease-in-out infinite;"></div>
                            <span>Fermeture automatique dans quelques secondes...</span>
                            <div style="animation: sparkles 2s ease-in-out infinite;">✨</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes celebrationEnter {
                    0% { 
                        opacity: 0; 
                        transform: translate(-50%, -50%) scale(0.5) rotateY(20deg); 
                        filter: blur(20px);
                    }
                    60% { 
                        opacity: 0.9; 
                        transform: translate(-50%, -50%) scale(1.1) rotateY(-5deg); 
                        filter: blur(5px);
                    }
                    100% { 
                        opacity: 1; 
                        transform: translate(-50%, -50%) scale(1) rotateY(0deg); 
                        filter: blur(0px);
                    }
                }
                
                @keyframes celebrationBg {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.1); }
                }
                
                @keyframes confetti {
                    0% { transform: translateY(-10%) rotate(0deg); }
                    100% { transform: translateY(110%) rotate(360deg); }
                }
                
                @keyframes rays {
                    0% { transform: translate(-50%, -50%) rotate(0deg); }
                    100% { transform: translate(-50%, -50%) rotate(360deg); }
                }
                
                @keyframes starPulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(255,255,255,0.3); }
                    50% { transform: scale(1.1); box-shadow: 0 0 30px rgba(255,255,255,0.5); }
                }
                
                @keyframes starGlow {
                    0%, 100% { filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1)); }
                    50% { filter: drop-shadow(0 4px 20px rgba(255,255,255,0.5)); }
                }
                
                @keyframes titleBounce {
                    0% { opacity: 0; transform: translateY(-30px) scale(0.8); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                
                @keyframes subtitleSlide {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes contentSlideUp {
                    0% { opacity: 0; transform: translateY(40px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes statsSlideUp {
                    0% { opacity: 0; transform: translateY(30px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes statsPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                
                @keyframes autoCloseSlide {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes decorRotate {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(0.8); }
                }
                
                @keyframes sparkles {
                    0%, 100% { transform: scale(1) rotate(0deg); }
                    50% { transform: scale(1.2) rotate(180deg); }
                }
            </style>
        `;
        
        // Ajouter au DOM
        document.body.appendChild(this.tooltip);
        
        // Animation d'apparition
        requestAnimationFrame(() => {
            this.tooltip.style.opacity = '1';
        });
    }

    // Méthode pour forcer le redémarrage (utile pour les tests)
    forceStart() {
        console.log('🔄 Redémarrage forcé de l\'onboarding');
        this.complete(); // Nettoyer l'état actuel
        setTimeout(() => {
            this.start();
        }, 100);
    }

    // Méthode pour mettre en valeur la zone 3D
    highlight3DZone() {
        console.log('✨ Mise en valeur de la zone 3D...');
        
        // Trouver le canvas 3D
        const canvas = document.querySelector('#threejs-canvas') || document.querySelector('canvas');
        if (!canvas) {
            console.warn('⚠️ Canvas 3D non trouvé pour la mise en valeur');
            return;
        }

        // Créer l'overlay de mise en valeur
        const overlay = document.createElement('div');
        overlay.id = 'zone-3d-highlight';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.4);
            z-index: 9998;
            pointer-events: none;
            animation: highlightFadeIn 0.5s ease-out;
        `;

        // Créer le spotlight sur la zone 3D
        const rect = canvas.getBoundingClientRect();
        const spotlight = document.createElement('div');
        spotlight.style.cssText = `
            position: fixed;
            top: ${rect.top - 10}px;
            left: ${rect.left - 10}px;
            width: ${rect.width + 20}px;
            height: ${rect.height + 20}px;
            border: 4px solid #667eea;
            border-radius: 12px;
            box-shadow: 
                0 0 0 4px rgba(102, 126, 234, 0.3),
                0 0 0 8px rgba(102, 126, 234, 0.1),
                inset 0 0 0 4px rgba(255, 255, 255, 0.2);
            z-index: 9999;
            pointer-events: none;
            animation: spotlightPulse 2s ease-in-out infinite;
        `;

        // Ajouter le label explicatif
        const label = document.createElement('div');
        label.style.cssText = `
            position: fixed;
            top: ${rect.top - 60}px;
            left: ${rect.left + rect.width / 2}px;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
            z-index: 10000;
            pointer-events: none;
            animation: labelBounce 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.5s both;
        `;
        label.innerHTML = '🎯 Zone de construction 3D';

        document.body.appendChild(overlay);
        document.body.appendChild(spotlight);
        document.body.appendChild(label);

        // Supprimer après 4 secondes
        setTimeout(() => {
            if (overlay.parentNode) overlay.remove();
            if (spotlight.parentNode) spotlight.remove();
            if (label.parentNode) label.remove();
        }, 4000);

        // Ajouter les styles d'animation
        if (!document.querySelector('#highlight-styles')) {
            const styles = document.createElement('style');
            styles.id = 'highlight-styles';
            styles.textContent = `
                @keyframes highlightFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes spotlightPulse {
                    0%, 100% { 
                        transform: scale(1); 
                        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.3), 0 0 0 8px rgba(102, 126, 234, 0.1), inset 0 0 0 4px rgba(255, 255, 255, 0.2);
                    }
                    50% { 
                        transform: scale(1.02); 
                        box-shadow: 0 0 0 8px rgba(102, 126, 234, 0.4), 0 0 0 16px rgba(102, 126, 234, 0.15), inset 0 0 0 4px rgba(255, 255, 255, 0.3);
                    }
                }
                @keyframes labelBounce {
                    0% { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.8); }
                    100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
                }
            `;
            document.head.appendChild(styles);
        }
    }

    // Méthode pour montrer l'animation de clic
    showClickAnimation() {
        console.log('👆 Animation de clic sur la brique...');
        
        setTimeout(() => {
            // Trouver une brique visible dans la scène ou créer l'animation au centre
            const canvas = document.querySelector('#threejs-canvas') || document.querySelector('canvas');
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Créer l'indicateur de clic
            const clickIndicator = document.createElement('div');
            clickIndicator.style.cssText = `
                position: fixed;
                top: ${centerY - 15}px;
                left: ${centerX - 15}px;
                width: 30px;
                height: 30px;
                border: 3px solid #667eea;
                border-radius: 50%;
                z-index: 10001;
                pointer-events: none;
                animation: clickPulse 0.6s ease-out;
            `;

            // Créer l'effet de ripple
            const ripple = document.createElement('div');
            ripple.style.cssText = `
                position: fixed;
                top: ${centerY - 2}px;
                left: ${centerX - 2}px;
                width: 4px;
                height: 4px;
                background: #667eea;
                border-radius: 50%;
                z-index: 10002;
                pointer-events: none;
                animation: rippleExpand 1s ease-out;
            `;

            // Créer l'icône de main/curseur
            const handIcon = document.createElement('div');
            handIcon.style.cssText = `
                position: fixed;
                top: ${centerY - 40}px;
                left: ${centerX - 20}px;
                font-size: 32px;
                z-index: 10003;
                pointer-events: none;
                animation: handClick 1.2s ease-in-out;
                color: #667eea;
                text-shadow: 0 2px 4px rgba(0,0,0,0.2);
            `;
            handIcon.innerHTML = '👆';

            document.body.appendChild(clickIndicator);
            document.body.appendChild(ripple);
            document.body.appendChild(handIcon);

            // Supprimer après l'animation
            setTimeout(() => {
                if (clickIndicator.parentNode) clickIndicator.remove();
                if (ripple.parentNode) ripple.remove();
                if (handIcon.parentNode) handIcon.remove();
            }, 1200);

            // Ajouter les styles d'animation si pas déjà présents
            if (!document.querySelector('#click-animation-styles')) {
                const styles = document.createElement('style');
                styles.id = 'click-animation-styles';
                styles.textContent = `
                    @keyframes clickPulse {
                        0% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.5); opacity: 0.7; }
                        100% { transform: scale(2); opacity: 0; }
                    }
                    @keyframes rippleExpand {
                        0% { transform: scale(1); opacity: 1; }
                        100% { transform: scale(20); opacity: 0; }
                    }
                    @keyframes handClick {
                        0% { transform: translateY(0) scale(1); opacity: 0; }
                        20% { opacity: 1; }
                        50% { transform: translateY(-10px) scale(1.1); }
                        70% { transform: translateY(0) scale(0.9); }
                        100% { transform: translateY(0) scale(1); opacity: 0; }
                    }
                `;
                document.head.appendChild(styles);
            }

        }, 2500); // Commencer l'animation de clic 2.5s après la mise en valeur de la zone
    }

    // Méthode pour mettre en valeur le dos de la brique placée
    highlightBrickBack() {
        console.log('🧱 Mise en valeur du dos de la brique...');
        
        const lastBrick = this.findLastPlacedBrick();
        if (!lastBrick) {
            console.warn('⚠️ Aucune brique trouvée pour la mise en valeur');
            return;
        }

        // Créer un indicateur 3D au-dessus de la brique
        this.create3DBrickHighlight(lastBrick);
        
        // Créer aussi l'overlay 2D pour les instructions
        this.createOverlayInstructions();
    }

    // Trouve la dernière brique placée dans la scène
    findLastPlacedBrick() {
        try {
            if (!window.SceneManager || !window.SceneManager.elements) {
                return null;
            }

            let lastBrick = null;
            let lastBrickTime = 0;
            
            window.SceneManager.elements.forEach((element, id) => {
                if ((element.type === 'brick' || element.blockType) && element.creationTime) {
                    if (element.creationTime > lastBrickTime) {
                        lastBrickTime = element.creationTime;
                        lastBrick = element;
                    }
                }
            });

            // Si pas de creationTime, prendre la première brique trouvée
            if (!lastBrick) {
                window.SceneManager.elements.forEach((element, id) => {
                    if ((element.type === 'brick' || element.blockType) && !lastBrick) {
                        lastBrick = element;
                    }
                });
            }

            return lastBrick;
        } catch (error) {
            console.warn('⚠️ Erreur lors de la recherche de brique:', error);
            return null;
        }
    }

    // Créer l'indicateur 3D au-dessus de la brique
    create3DBrickHighlight(brick) {
        if (!window.SceneManager || !window.SceneManager.scene) {
            return;
        }

        const scene = window.SceneManager.scene;
        
        // Créer un groupe pour tous les éléments d'indication
        this.highlightGroup = new THREE.Group();
        this.highlightGroup.name = 'OnboardingHighlight';

        // Position de la brique
        const brickPos = brick.mesh.position;
        const brickDim = brick.dimensions;

        // 1. Créer un contour lumineux autour de la brique
        const outlineGeometry = new THREE.BoxGeometry(
            brickDim.length + 2,
            brickDim.height + 2, 
            brickDim.width + 2
        );
        const outlineMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6b6b,
            transparent: true,
            opacity: 0.3,
            wireframe: true
        });
        
        this.outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
        this.outlineMesh.position.copy(brickPos);
        this.outlineMesh.rotation.copy(brick.mesh.rotation);

        // 2. Créer des particules scintillantes
        this.createSparkleEffect(brickPos);

        // 3. Créer des zones adjacentes fantômes
        this.createAdjacentGhosts(brick);

        // Ajouter tout au groupe (sans la flèche)
        this.highlightGroup.add(this.outlineMesh);
        
        // Ajouter à la scène
        scene.add(this.highlightGroup);

        // Démarrer les animations
        this.startHighlightAnimations();

        // Supprimer après 5 secondes
        setTimeout(() => {
            this.cleanupHighlight();
        }, 5000);
    }

    // Créer l'effet de scintillement
    createSparkleEffect(brickPos) {
        const sparkleCount = 20;
        const sparkleGeometry = new THREE.SphereGeometry(0.5, 4, 4);
        const sparkleMaterial = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 0.8
        });

        this.sparkles = [];
        
        for (let i = 0; i < sparkleCount; i++) {
            const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
            
            // Position aléatoire autour de la brique
            sparkle.position.set(
                brickPos.x + (Math.random() - 0.5) * 30,
                brickPos.y + Math.random() * 20 + 5,
                brickPos.z + (Math.random() - 0.5) * 30
            );
            
            sparkle.userData.originalY = sparkle.position.y;
            sparkle.userData.speed = Math.random() * 0.02 + 0.01;
            
            this.sparkles.push(sparkle);
            this.highlightGroup.add(sparkle);
        }
    }

    // Créer des briques fantômes adjacentes
    createAdjacentGhosts(brick) {
        const brickPos = brick.mesh.position;
        const brickDim = brick.dimensions;
        
        const positions = [
            { x: brickPos.x - brickDim.length, z: brickPos.z, label: '⬅️' },
            { x: brickPos.x + brickDim.length, z: brickPos.z, label: '➡️' },
            { x: brickPos.x, z: brickPos.z - brickDim.width, label: '⬆️' },
            { x: brickPos.x, z: brickPos.z + brickDim.width, label: '⬇️' }
        ];

        const ghostGeometry = new THREE.BoxGeometry(brickDim.length, brickDim.height, brickDim.width);
        const ghostMaterial = new THREE.MeshBasicMaterial({
            color: 0x4ecdc4,
            transparent: true,
            opacity: 0.2,
            wireframe: true
        });

        positions.forEach(pos => {
            const ghost = new THREE.Mesh(ghostGeometry, ghostMaterial);
            ghost.position.set(pos.x, brickPos.y, pos.z);
            ghost.rotation.copy(brick.mesh.rotation);
            
            this.highlightGroup.add(ghost);
        });
    }

    // Démarrer les animations
    startHighlightAnimations() {
        let animationTime = 0;
        
        const animate = () => {
            if (!this.highlightGroup || !this.highlightGroup.parent) return;
            
            animationTime += 0.05;
            
            // Animation du contour (pulsation)
            if (this.outlineMesh) {
                const scale = 1 + Math.sin(animationTime * 4) * 0.05;
                this.outlineMesh.scale.setScalar(scale);
            }
            
            // Animation des particules
            if (this.sparkles) {
                this.sparkles.forEach(sparkle => {
                    sparkle.position.y = sparkle.userData.originalY + Math.sin(animationTime * 2 + sparkle.userData.speed * 100) * 3;
                    sparkle.rotation.x += sparkle.userData.speed;
                    sparkle.rotation.y += sparkle.userData.speed * 0.7;
                });
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    // Créer les instructions 2D en overlay
    createOverlayInstructions() {
        const overlay = document.createElement('div');
        overlay.id = 'brick-instructions-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #ff6b6b, #ee5a24);
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
            z-index: 10000;
            pointer-events: none;
            animation: instructionsBounce 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        `;
        overlay.innerHTML = '🎯 Cliquez sur la brique mise en valeur pour voir les emplacements adjacents !';

        document.body.appendChild(overlay);

        // Supprimer après 5 secondes
        setTimeout(() => {
            if (overlay.parentNode) overlay.remove();
        }, 5000);

        // Style d'animation
        if (!document.querySelector('#instructions-animation-styles')) {
            const styles = document.createElement('style');
            styles.id = 'instructions-animation-styles';
            styles.textContent = `
                @keyframes instructionsBounce {
                    0% { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.8); }
                    100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
                }
            `;
            document.head.appendChild(styles);
        }
    }

    // Nettoyer les éléments de mise en valeur
    cleanupHighlight() {
        if (this.highlightGroup && window.SceneManager && window.SceneManager.scene) {
            window.SceneManager.scene.remove(this.highlightGroup);
            this.highlightGroup = null;
            this.outlineMesh = null;
            this.sparkles = null;
        }
    }

    // Méthode pour obtenir la position réelle de la brique à l'écran
    getRealBrickScreenPosition() {
        try {
            // Vérifier si on a accès au SceneManager et à ses éléments
            if (!window.SceneManager || !window.SceneManager.elements) {
                return null;
            }

            // Trouver le dernier élément de type 'brick' placé
            let lastBrick = null;
            let lastBrickTime = 0;
            
            window.SceneManager.elements.forEach((element, id) => {
                if ((element.type === 'brick' || element.blockType) && element.creationTime) {
                    if (element.creationTime > lastBrickTime) {
                        lastBrickTime = element.creationTime;
                        lastBrick = element;
                    }
                }
            });

            // Si pas de brique avec creationTime, prendre la première trouvée
            if (!lastBrick) {
                window.SceneManager.elements.forEach((element, id) => {
                    if ((element.type === 'brick' || element.blockType) && !lastBrick) {
                        lastBrick = element;
                    }
                });
            }

            if (!lastBrick || !lastBrick.mesh) {
                console.warn('⚠️ Aucune brique trouvée dans la scène');
                return null;
            }

            // Convertir la position 3D en coordonnées 2D
            const brickPosition = lastBrick.mesh.position;
            const camera = window.SceneManager.camera;
            const canvas = document.querySelector('#threejs-canvas') || document.querySelector('canvas');
            
            if (!camera || !canvas) {
                console.warn('⚠️ Caméra ou canvas non trouvé pour projection');
                return null;
            }

            // Projection 3D vers 2D
            const vector = new THREE.Vector3();
            vector.setFromMatrixPosition(lastBrick.mesh.matrixWorld);
            vector.project(camera);

            const rect = canvas.getBoundingClientRect();
            const x = (vector.x * 0.5 + 0.5) * rect.width + rect.left;
            const y = (-vector.y * 0.5 + 0.5) * rect.height + rect.top;

            console.log(`🎯 Position brique trouvée:`, {
                brickId: lastBrick.id,
                world3D: brickPosition,
                screen2D: { x, y }
            });

            return { x, y };

        } catch (error) {
            console.warn('⚠️ Erreur lors de la récupération de position de brique:', error);
            return null;
        }
    }

    // Méthode pour montrer l'animation de clic sur la brique
    showBrickClickAnimation() {
        console.log('🖱️ Animation de clic sur la brique...');
        
        setTimeout(() => {
            const lastBrick = this.findLastPlacedBrick();
            if (!lastBrick) {
                console.warn('⚠️ Aucune brique trouvée pour l\'animation de clic');
                return;
            }

            // Créer une animation de clic 3D au-dessus de la brique
            this.create3DClickAnimation(lastBrick);

        }, 2000); // Commencer l'animation 2s après la mise en valeur
    }

    // Créer l'animation de clic 3D
    create3DClickAnimation(brick) {
        if (!window.SceneManager || !window.SceneManager.scene) {
            return;
        }

        const scene = window.SceneManager.scene;
        const brickPos = brick.mesh.position;
        const brickDim = brick.dimensions;

        // Créer un groupe pour l'animation de clic
        this.clickAnimationGroup = new THREE.Group();
        this.clickAnimationGroup.name = 'OnboardingClickAnimation';

        // 1. Créer un curseur 3D (main pointant)
        const cursorGeometry = new THREE.SphereGeometry(1.5, 8, 8);
        const cursorMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff6b6b,
            transparent: true,
            opacity: 0.9
        });
        
        this.cursor3D = new THREE.Mesh(cursorGeometry, cursorMaterial);
        this.cursor3D.position.set(
            brickPos.x,
            brickPos.y + brickDim.height + 8, // 8cm au-dessus de la brique
            brickPos.z
        );

        // 2. Créer des anneaux de clic
        this.clickRings = [];
        for (let i = 0; i < 3; i++) {
            const ringGeometry = new THREE.RingGeometry(2, 3, 16);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0xff6b6b,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.set(brickPos.x, brickPos.y + brickDim.height / 2, brickPos.z);
            ring.rotation.x = -Math.PI / 2; // Horizontal
            ring.userData.delay = i * 0.5; // Délai entre les anneaux
            ring.userData.initialScale = 0.5;
            
            this.clickRings.push(ring);
            this.clickAnimationGroup.add(ring);
        }

        // 3. Créer des particules d'impact
        this.createClickParticles(brickPos, brickDim);

        this.clickAnimationGroup.add(this.cursor3D);
        scene.add(this.clickAnimationGroup);

        // Démarrer l'animation de clic
        this.startClickAnimation();

        // Supprimer après 6 secondes
        setTimeout(() => {
            this.cleanupClickAnimation();
        }, 6000);
    }

    // Créer les particules d'impact
    createClickParticles(brickPos, brickDim) {
        const particleCount = 15;
        const particleGeometry = new THREE.SphereGeometry(0.3, 4, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 0.8
        });

        this.clickParticles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Position au centre de la face supérieure de la brique
            particle.position.set(
                brickPos.x + (Math.random() - 0.5) * 4,
                brickPos.y + brickDim.height / 2,
                brickPos.z + (Math.random() - 0.5) * 4
            );
            
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                Math.random() * 0.2 + 0.1,
                (Math.random() - 0.5) * 0.3
            );
            
            this.clickParticles.push(particle);
            this.clickAnimationGroup.add(particle);
        }
    }

    // Démarrer l'animation de clic
    startClickAnimation() {
        let clickTime = 0;
        
        const animate = () => {
            if (!this.clickAnimationGroup || !this.clickAnimationGroup.parent) return;
            
            clickTime += 0.1;
            
            // Animation du curseur (mouvement de clic)
            if (this.cursor3D) {
                const clickCycle = Math.sin(clickTime * 2) * 0.5 + 0.5; // 0 à 1
                this.cursor3D.position.y = this.cursor3D.userData.originalY - clickCycle * 3;
                
                if (!this.cursor3D.userData.originalY) {
                    this.cursor3D.userData.originalY = this.cursor3D.position.y;
                }
            }
            
            // Animation des anneaux
            if (this.clickRings) {
                this.clickRings.forEach((ring, index) => {
                    const ringTime = clickTime - ring.userData.delay;
                    if (ringTime > 0) {
                        const scale = ring.userData.initialScale + (ringTime * 0.5);
                        const opacity = Math.max(0, 0.8 - ringTime * 0.2);
                        
                        ring.scale.setScalar(scale);
                        ring.material.opacity = opacity;
                        
                        // Réinitialiser après expansion complète
                        if (ringTime > 4) {
                            ring.scale.setScalar(ring.userData.initialScale);
                            ring.material.opacity = 0.8;
                            ring.userData.delay = clickTime + index * 0.5;
                        }
                    }
                });
            }
            
            // Animation des particules
            if (this.clickParticles) {
                this.clickParticles.forEach(particle => {
                    particle.position.add(particle.userData.velocity);
                    particle.userData.velocity.y -= 0.01; // Gravité
                    particle.rotation.x += 0.1;
                    particle.rotation.y += 0.1;
                    
                    // Réinitialiser si la particule tombe trop bas
                    if (particle.position.y < particle.userData.originalY - 10) {
                        particle.position.y = particle.userData.originalY || particle.position.y + 10;
                        particle.userData.velocity.y = Math.random() * 0.2 + 0.1;
                    }
                    
                    if (!particle.userData.originalY) {
                        particle.userData.originalY = particle.position.y;
                    }
                });
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    // Nettoyer l'animation de clic
    cleanupClickAnimation() {
        if (this.clickAnimationGroup && window.SceneManager && window.SceneManager.scene) {
            window.SceneManager.scene.remove(this.clickAnimationGroup);
            this.clickAnimationGroup = null;
            this.cursor3D = null;
            this.clickRings = null;
            this.clickParticles = null;
        }
    }

    // Méthode pour mettre en valeur les briques fantômes (blanches)
    highlightGhostBricks() {
        console.log('👻 Mise en valeur des briques fantômes...');
        
        // Créer les instructions overlay
        this.createGhostInstructions();
        
        // Créer des animations pour attirer l'attention sur les briques fantômes
        this.createGhostHighlightEffects();
    }

    // Créer les instructions pour les briques fantômes
    createGhostInstructions() {
        const overlay = document.createElement('div');
        overlay.id = 'ghost-instructions-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #4ecdc4, #44a08d);
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 8px 25px rgba(78, 205, 196, 0.4);
            z-index: 10000;
            pointer-events: none;
            animation: instructionsBounce 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        `;
        overlay.innerHTML = '👻 Cliquez sur une brique blanche pour choisir la position de pose !';

        document.body.appendChild(overlay);

        // Supprimer après 8 secondes (plus long pour cette étape)
        setTimeout(() => {
            if (overlay.parentNode) overlay.remove();
        }, 8000);
    }

    // Créer des effets visuels pour attirer l'attention sur les briques fantômes
    createGhostHighlightEffects() {
        if (!window.SceneManager || !window.SceneManager.scene) {
            return;
        }

        const scene = window.SceneManager.scene;
        
        // Créer un groupe pour les effets sur les briques fantômes
        this.ghostEffectsGroup = new THREE.Group();
        this.ghostEffectsGroup.name = 'OnboardingGhostEffects';

        // Rechercher toutes les briques fantômes dans la scène
        this.findAndHighlightGhostBricks();

        scene.add(this.ghostEffectsGroup);
        
        // Démarrer l'animation des effets
        this.startGhostEffectsAnimation();

        // Supprimer après 10 secondes
        setTimeout(() => {
            this.cleanupGhostEffects();
        }, 10000);
    }

    // Trouver et mettre en valeur les briques fantômes
    findAndHighlightGhostBricks() {
        if (!window.SceneManager || !window.SceneManager.scene) {
            return;
        }

        const scene = window.SceneManager.scene;
        this.ghostIndicators = [];

        // Parcourir tous les objets de la scène pour trouver les briques fantômes
        scene.traverse((child) => {
            // Vérifier si c'est une brique fantôme (mesh avec material transparent/wireframe ou userData spécifique)
            if (child.isMesh && child.material) {
                const isGhost = child.material.transparent && child.material.opacity < 0.8 ||
                               child.material.wireframe ||
                               child.userData?.isGhost ||
                               child.userData?.type === 'ghost' ||
                               child.name?.includes('ghost') ||
                               child.name?.includes('Ghost');

                if (isGhost && child.geometry) {
                    this.createGhostIndicator(child);
                }
            }
        });

        console.log(`👻 Trouvé ${this.ghostIndicators.length} briques fantômes à mettre en valeur`);
    }

    // Créer un indicateur pour une brique fantôme spécifique
    createGhostIndicator(ghostMesh) {
        // 1. Créer un halo coloré autour de la brique fantôme
        const haloGeometry = new THREE.RingGeometry(5, 8, 16);
        const haloMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });

        const halo = new THREE.Mesh(haloGeometry, haloMaterial);
        halo.position.copy(ghostMesh.position);
        halo.position.y -= 1; // Légèrement sous la brique
        halo.rotation.x = -Math.PI / 2; // Horizontal

        // 2. Créer des particules scintillantes autour
        const sparkleCount = 8;
        const sparkles = [];

        for (let i = 0; i < sparkleCount; i++) {
            const sparkleGeometry = new THREE.SphereGeometry(0.3, 6, 6);
            const sparkleMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ff88,
                transparent: true,
                opacity: 0.9
            });

            const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
            const angle = (i / sparkleCount) * Math.PI * 2;
            const radius = 8;
            
            sparkle.position.set(
                ghostMesh.position.x + Math.cos(angle) * radius,
                ghostMesh.position.y + Math.random() * 6 + 2,
                ghostMesh.position.z + Math.sin(angle) * radius
            );

            sparkle.userData.angle = angle;
            sparkle.userData.radius = radius;
            sparkle.userData.originalY = sparkle.position.y;
            sparkle.userData.ghostCenter = ghostMesh.position;

            sparkles.push(sparkle);
            this.ghostEffectsGroup.add(sparkle);
        }

        this.ghostEffectsGroup.add(halo);

        // Sauvegarder pour l'animation
        this.ghostIndicators.push({
            halo: halo,
            sparkles: sparkles,
            ghostMesh: ghostMesh
        });
    }

    // Démarrer l'animation des effets fantômes
    startGhostEffectsAnimation() {
        let animationTime = 0;

        const animate = () => {
            if (!this.ghostEffectsGroup || !this.ghostEffectsGroup.parent) return;

            animationTime += 0.05;

            this.ghostIndicators.forEach((indicator) => {
                // Animation du halo (pulsation et rotation)
                if (indicator.halo) {
                    const scale = 1 + Math.sin(animationTime * 3) * 0.2;
                    indicator.halo.scale.setScalar(scale);
                    indicator.halo.rotation.z += 0.02;
                }

                // Animation des particules (rotation autour de la brique)
                if (indicator.sparkles) {
                    indicator.sparkles.forEach((sparkle) => {
                        sparkle.userData.angle += 0.03;
                        sparkle.position.x = sparkle.userData.ghostCenter.x + Math.cos(sparkle.userData.angle) * sparkle.userData.radius;
                        sparkle.position.z = sparkle.userData.ghostCenter.z + Math.sin(sparkle.userData.angle) * sparkle.userData.radius;
                        sparkle.position.y = sparkle.userData.originalY + Math.sin(animationTime * 4) * 2;
                        
                        sparkle.rotation.x += 0.1;
                        sparkle.rotation.y += 0.1;
                    });
                }
            });

            requestAnimationFrame(animate);
        };

        animate();
    }

    // Nettoyer les effets fantômes
    cleanupGhostEffects() {
        if (this.ghostEffectsGroup && window.SceneManager && window.SceneManager.scene) {
            window.SceneManager.scene.remove(this.ghostEffectsGroup);
            this.ghostEffectsGroup = null;
            this.ghostIndicators = null;
        }
    }
}

// Initialiser le système d'onboarding
console.log('🎬 Initialisation OnboardingSystem...');
window.OnboardingSystem = new OnboardingSystem();
