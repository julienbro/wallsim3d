/**
 * Gestionnaire D-pad pour les objets GLB placés depuis la bibliothèque
 * Permet le déplacement par pas de 1cm sur X/Z et l'ajustement de hauteur Y
 */
class GLBDpadController {
    constructor() {
        this.activeGLBElement = null;
        this.dpadContainer = null;
        this.isVisible = false;
        this.gridSize = 1; // 1 unité = 1cm dans WallSim3D
        this.heightStep = 1; // 1 unité = 1cm pour les boutons Y également
        this.dpadSize = 60; // Taille ultra-réduite du D-pad en pixels
        this.trackingInterval = null; // Pour le suivi continu de l'objet
        this.useInitialPosition = false; // Flag pour maintenir la position initiale - CHANGÉ à false
        
        this.setupDpadHTML();
        this.bindEvents();
    }

    /**
     * Créer l'interface HTML du D-pad
     */
    setupDpadHTML() {
        // SUPPRESSION FORCÉE : Enlever TOUS les D-pads existants
        const existingDpads = document.querySelectorAll('#glb-dpad-controller, .glb-dpad-container');
        existingDpads.forEach(dpad => {
            console.log('🗑️ Suppression D-pad existant:', dpad);
            dpad.remove();
        });
        
        // Créer le conteneur principal
        this.dpadContainer = document.createElement('div');
        this.dpadContainer.id = 'glb-dpad-controller';
        this.dpadContainer.className = 'glb-dpad-container';
        
        // Forcer la taille directement sur l'élément
        this.dpadContainer.style.width = '60px';
        this.dpadContainer.style.maxWidth = '60px';
        this.dpadContainer.style.minWidth = '60px';
        
        this.dpadContainer.innerHTML = `
            <div class="glb-dpad-title">
                <span class="glb-dpad-icon">🎮</span>
                <span class="glb-dpad-text">Déplacement GLB</span>
                <button class="glb-dpad-close" id="closeDpad">✕</button>
            </div>
            
            <!-- Contrôles de hauteur Y -->
            <div class="glb-dpad-height-controls">
                <button class="glb-dpad-btn glb-height-btn" id="moveYUp" data-direction="y" data-value="1">
                    <i class="fas fa-arrow-up"></i>
                    <span>Y +1cm</span>
                </button>
                <button class="glb-dpad-btn glb-height-btn" id="moveYDown" data-direction="y" data-value="-1">
                    <i class="fas fa-arrow-down"></i>
                    <span>Y -1cm</span>
                </button>
            </div>
            
            <!-- D-pad principal pour X/Z -->
            <div class="glb-dpad-main">
                <div class="glb-dpad-cross">
                    <!-- Bouton Haut (Z+) -->
                    <button class="glb-dpad-btn glb-dpad-up" id="moveZUp" data-direction="z" data-value="1">
                        <i class="fas fa-chevron-up"></i>
                    </button>
                    
                    <!-- Boutons Gauche/Droite (X) -->
                    <div class="glb-dpad-horizontal">
                        <button class="glb-dpad-btn glb-dpad-left" id="moveXLeft" data-direction="x" data-value="-1">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <div class="glb-dpad-center">
                            <div class="glb-dpad-center-dot"></div>
                        </div>
                        <button class="glb-dpad-btn glb-dpad-right" id="moveXRight" data-direction="x" data-value="1">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    
                    <!-- Bouton Bas (Z-) -->
                    <button class="glb-dpad-btn glb-dpad-down" id="moveZDown" data-direction="z" data-value="-1">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
            </div>
            
            <!-- Informations sur l'objet -->
            <div class="glb-dpad-info">
                <div class="glb-dpad-position">
                    <span class="glb-info-label">Position:</span>
                    <span class="glb-info-coords" id="glbPositionDisplay">X: 0, Y: 0, Z: 0</span>
                </div>
                <div class="glb-dpad-step-info">
                    <span class="glb-info-label">Pas de déplacement:</span>
                    <span class="glb-info-step">1cm</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.dpadContainer);
        
        // Ajouter les styles CSS
        this.addDpadStyles();
    }

    /**
     * Ajouter les styles CSS pour le D-pad
     */
    addDpadStyles() {
        // Supprimer les anciens styles s'ils existent
        const existingStyle = document.getElementById('glb-dpad-styles-80px');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        const style = document.createElement('style');
        style.id = 'glb-dpad-styles-80px';
        style.textContent = `
            .glb-dpad-container {
                position: fixed !important;
                bottom: 20px !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                width: 60px !important;
                max-width: 60px !important;
                min-width: 60px !important;
                background: transparent !important;
                border: none !important;
                border-radius: 0;
                padding: 0;
                box-shadow: none !important;
                backdrop-filter: none !important;
                z-index: 1000;
                font-family: 'Segoe UI', Arial, sans-serif;
                opacity: 0;
                transition: all 0.3s ease;
                user-select: none;
                pointer-events: none;
            }
            
            .glb-dpad-container.visible {
                opacity: 1;
                transform: translateX(-50%);
                pointer-events: auto !important;
            }
            
            .glb-dpad-title {
                display: none;
            }
            
            .glb-dpad-icon {
                font-size: 8px;
                margin-right: 2px;
            }
            
            .glb-dpad-text {
                color: #ffffff;
                font-weight: 600;
                font-size: 8px;
                flex: 1;
            }
            
            .glb-dpad-close {
                background: none;
                border: none;
                color: #ffffff;
                font-size: 8px;
                cursor: pointer;
                padding: 1px 2px;
                border-radius: 2px;
                transition: background 0.2s ease;
                pointer-events: auto !important;
            }
            
            .glb-dpad-close:hover {
                background: rgba(255,255,255,0.1);
            }
            
            .glb-dpad-height-controls {
                display: none;
            }
            
            .glb-height-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1px;
                padding: 2px 3px;
                background: linear-gradient(135deg, #e74c3c, #c0392b);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 4px;
                color: white;
                font-size: 7px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                min-width: 24px;
                box-shadow: 0 1px 4px rgba(231, 76, 60, 0.3);
                backdrop-filter: blur(3px);
                pointer-events: auto !important;
            }
            
            .glb-height-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 6px rgba(231, 76, 60, 0.4);
                background: linear-gradient(135deg, #e55347, #c44133);
            }
            
            .glb-height-btn:active {
                transform: translateY(0);
            }
            
            .glb-dpad-main {
                display: flex;
                justify-content: center;
                margin-bottom: 0;
            }
            
            .glb-dpad-cross {
                display: grid;
                grid-template-rows: auto auto auto;
                grid-template-columns: auto auto auto;
                gap: 2px;
                align-items: center;
                justify-items: center;
            }
            
            .glb-dpad-up {
                grid-column: 2;
                grid-row: 1;
            }
            
            .glb-dpad-horizontal {
                grid-column: 1 / 4;
                grid-row: 2;
                display: flex;
                align-items: center;
                gap: 2px;
            }
            
            .glb-dpad-down {
                grid-column: 2;
                grid-row: 3;
            }
            
            .glb-dpad-btn {
                background: rgba(52, 152, 219, 0.9) !important;
                border: 1px solid rgba(255,255,255,0.3) !important;
                border-radius: 6px !important;
                color: white !important;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3) !important;
                backdrop-filter: blur(3px) !important;
                align-items: center;
                justify-content: center;
                font-size: 10px !important;
                user-select: none;
                pointer-events: auto !important;
            }
            
            .glb-dpad-up,
            .glb-dpad-down {
                width: 18px;
                height: 14px;
            }
            
            .glb-dpad-left,
            .glb-dpad-right {
                width: 14px;
                height: 18px;
            }
            
            .glb-dpad-btn:hover {
                transform: scale(1.05) !important;
                box-shadow: 0 2px 6px rgba(52, 152, 219, 0.5) !important;
                background: rgba(52, 152, 219, 1) !important;
            }
            
            .glb-dpad-btn:active {
                transform: scale(0.95);
            }
            
            .glb-dpad-center {
                width: 14px;
                height: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
                border-radius: 50%;
                margin: 0 1px;
            }
            
            .glb-dpad-center-dot {
                width: 3px;
                height: 3px;
                background: rgba(52, 152, 219, 0.6);
                border-radius: 50%;
                box-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }
            
            .glb-dpad-info {
                display: none;
            }
            
            .glb-dpad-position {
                display: flex;
                justify-content: space-between;
                margin-bottom: 6px;
            }
            
            .glb-dpad-step-info {
                display: flex;
                justify-content: space-between;
            }
            
            .glb-info-label {
                font-weight: 600;
                color: #ecf0f1;
                font-size: 7px;
            }
            
            .glb-info-coords {
                font-family: 'Courier New', monospace;
                color: #3498db;
                font-size: 7px;
            }
            
            .glb-info-step {
                color: #e74c3c;
                font-weight: 600;
                font-size: 7px;
            }
            
            /* Empêcher les éléments enfants d'intercepter les clics */
            .glb-dpad-btn i,
            .glb-dpad-btn span {
                pointer-events: none;
                user-select: none;
            }
            
            /* Animation de feedback */
            .glb-dpad-btn.pressed {
                animation: dpadPress 0.1s ease;
            }
            
            @keyframes dpadPress {
                0% { transform: scale(1); }
                50% { transform: scale(0.9); }
                100% { transform: scale(1.05); }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Lier les événements
     */
    bindEvents() {
        // Écouter les événements de sélection d'objets GLB
        document.addEventListener('elementSelected', (event) => {
            this.handleElementSelection(event.detail);
        });
        
        document.addEventListener('elementDeselected', (event) => {
            this.handleElementDeselection(event.detail);
        });
        
        // Écouter aussi les événements de placement d'objets GLB
        document.addEventListener('elementPlaced', (event) => {
            if (event.detail && event.detail.element) {
                this.handleElementPlacement(event.detail);
            }
        });
        
        // Événements du D-pad
        document.addEventListener('click', (event) => {
            // Boutons de déplacement
            if (event.target.matches('.glb-dpad-btn[data-direction]')) {
                const direction = event.target.dataset.direction;
                const value = parseFloat(event.target.dataset.value);
                
                this.moveActiveElement(direction, value);
                this.animateButtonPress(event.target);
            }
            
            // Bouton de fermeture
            if (event.target.matches('#closeDpad')) {
                this.hide();
            }
        });

        // Support du clavier pour les touches fléchées
        document.addEventListener('keydown', (event) => {
            if (!this.isVisible || !this.activeGLBElement) return;
            
            // Empêcher le comportement par défaut seulement si D-pad visible
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                event.preventDefault();
                event.stopPropagation();
                
                switch (event.key) {
                    case 'ArrowUp':
                        this.moveActiveElement('z', 1);
                        this.animateButtonPress(document.getElementById('moveZUp'));
                        break;
                    case 'ArrowDown':
                        this.moveActiveElement('z', -1);
                        this.animateButtonPress(document.getElementById('moveZDown'));
                        break;
                    case 'ArrowLeft':
                        this.moveActiveElement('x', -1);
                        this.animateButtonPress(document.getElementById('moveXLeft'));
                        break;
                    case 'ArrowRight':
                        this.moveActiveElement('x', 1);
                        this.animateButtonPress(document.getElementById('moveXRight'));
                        break;
                }
            }
            
            // Touches Page Up/Down pour la hauteur
            if (event.key === 'PageUp') {
                event.preventDefault();
                this.moveActiveElement('y', 1);
                this.animateButtonPress(document.getElementById('moveYUp'));
            } else if (event.key === 'PageDown') {
                event.preventDefault();
                this.moveActiveElement('y', -1);
                this.animateButtonPress(document.getElementById('moveYDown'));
            }
        });
    }

    /**
     * Gérer la sélection d'un élément
     */
    handleElementSelection(elementInfo) {
        if (!elementInfo || !elementInfo.element) {
            return;
        }
        
        const element = elementInfo.element;
        
        // Vérifier si c'est un objet qui nécessite les curseurs Y
        if (this.needsYControls(element)) {
            this.activeGLBElement = element;
            this.show();
            this.setYControlsVisibility(true); // Activer les curseurs Y
            this.updatePositionDisplay();
            
            console.log('✅ Sélection élément avec curseurs Y:', element.type || element.userData?.glbInfo?.type);
        } else {
            // Si ce n'est pas un GLB ou hourdis, cacher le D-pad ou afficher sans curseurs Y
            if (this.isGLBElement(element)) {
                this.activeGLBElement = element;
                this.show();
                this.setYControlsVisibility(false);
                this.updatePositionDisplay();
            } else {
                this.hide();
            }
        }
    }

    /**
     * Gérer la désélection d'un élément
     */
    handleElementDeselection(elementInfo) {
        if (this.activeGLBElement && elementInfo && 
            elementInfo.element && elementInfo.element.id === this.activeGLBElement.id) {
            this.hide();
        }
    }

    /**
     * Gérer le placement d'un élément GLB
     */
    handleElementPlacement(elementInfo) {
        if (!elementInfo || !elementInfo.element) {
            return;
        }
        
        const element = elementInfo.element;
        
        // Déterminer si c'est un élément GLB ou hourdis
        const isGLBElement = this.isGLBElement(element);
        const needsY = this.needsYControls(element);
        
        if (window.DEBUG_CONSTRUCTION) {
            console.log('🎮 Placement élément détecté:', {
                type: element.type,
                isGLB: isGLBElement,
                needsYControls: needsY,
                userData: element.userData?.glbInfo?.type
            });
        }
        
        // Attendre un peu pour que l'objet soit complètement ajouté à la scène
        setTimeout(() => {
            this.activeGLBElement = element;
            this.showForObjectType(needsY);
            this.updatePositionDisplay();
            
            // 🎯 Positionner le D-pad au bord de l'élément placé
            this.positionNearPlacedBrick(element);
        }, 500);
    }

    /**
     * Vérifier si un élément est un objet GLB
     */
    isGLBElement(element) {
        const isGLB = element && (
            element.type === 'glb' ||
            element.type === 'hourdis_13_60' ||
            element.type === 'hourdis_16_60' ||
            element.type === 'poutrain_beton_12' ||
            element.type === 'claveau_beton_12_53' ||
            element.isGLBModel ||
            (element.userData && element.userData.isGLB) ||
            (element.userData && element.userData.glbType) ||
            (element.userData && element.userData.glbInfo) ||
            (element.userData && element.userData.glbInfo?.type === 'hourdis_13_60') ||
            (element.userData && element.userData.glbInfo?.type === 'hourdis_16_60') ||
            (element.userData && element.userData.glbInfo?.type === 'poutrain_beton_12') ||
            (element.userData && element.userData.glbInfo?.type === 'claveau_beton_12_53') ||
            element.name?.includes('glb') ||
            element.name?.includes('GLB') ||
            element.name?.includes('hourdis') ||
            element.name?.includes('Hourdis') ||
            element.name?.includes('poutrain') ||
            element.name?.includes('Poutrain') ||
            element.name?.includes('claveau') ||
            element.name?.includes('Claveau') ||
            (element.id && String(element.id).includes('GLB_')) ||
            (element.glbFileName && element.glbFileName.endsWith('.glb'))
        );
        
        return isGLB;
    }

    /**
     * Calculer la position 2D de l'objet GLB à l'écran - Version simplifiée
     */
    getObjectScreenPosition() {
        if (!this.activeGLBElement) {
            return { x: window.innerWidth / 2, y: window.innerHeight - 100 };
        }
        
        // Obtenir la position 3D de l'objet
        let objectPosition = null;
        if (this.activeGLBElement.mesh && this.activeGLBElement.mesh.position) {
            objectPosition = this.activeGLBElement.mesh.position;
        } else if (this.activeGLBElement.position) {
            objectPosition = this.activeGLBElement.position;
        }
        
        if (!objectPosition) {
            console.log('⚠️ D-pad: Position de l\'objet introuvable', this.activeGLBElement);
            return { x: window.innerWidth / 2, y: window.innerHeight - 100 };
        }
        
        // Essayer la conversion 3D->2D avec SceneManager
        if (window.SceneManager && window.SceneManager.camera && window.SceneManager.renderer) {
            try {
                const camera = window.SceneManager.camera;
                const renderer = window.SceneManager.renderer;
                
                const vector = new THREE.Vector3(objectPosition.x, objectPosition.y, objectPosition.z);
                vector.project(camera);
                
                const canvasRect = renderer.domElement.getBoundingClientRect();
                const x = (vector.x * 0.5 + 0.5) * canvasRect.width + canvasRect.left;
                const y = (vector.y * -0.5 + 0.5) * canvasRect.height + canvasRect.top;
                
                // Positionner le D-pad au bord droit de la brique avec un décalage approprié
                const dpadOffset = 80; // Décalage pour positionner au bord de la brique
                const adjustedX = Math.max(80, Math.min(window.innerWidth - 100, x + dpadOffset));
                const adjustedY = Math.max(80, Math.min(window.innerHeight - 80, y));
                
                return { x: adjustedX, y: adjustedY };
            } catch (error) {
                console.log('❌ D-pad: Erreur conversion 3D->2D', error);
            }
        }
        
        // Fallback : Position basée sur les coordonnées de grille approximatives
        // Convertir grossièrement les coordonnées 3D en position écran
        const sceneCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        const scale = 20; // Facteur d'échelle pour conversion approximative
        
        const screenX = sceneCenter.x + (objectPosition.x * scale);
        const screenY = sceneCenter.y - (objectPosition.z * scale); // Z devient Y à l'écran
        
        // Positionner le D-pad au bord droit de la brique (fallback)
        const dpadOffset = 100; // Décalage pour être au bord
        const finalX = Math.max(80, Math.min(window.innerWidth - 100, screenX + dpadOffset));
        const finalY = Math.max(80, Math.min(window.innerHeight - 80, screenY));
        
        console.log('🎯 D-pad: Position au bord de la brique (fallback)', { 
            object3D: objectPosition, 
            screenCalculated: { x: finalX, y: finalY } 
        });
        
        return { x: finalX, y: finalY };
    }

    /**
     * Positionner le D-pad près de l'objet GLB avec suivi continu
     */
    positionNearObject() {
        if (!this.dpadContainer || !this.activeGLBElement) return;
        
        const screenPos = this.getObjectScreenPosition();
        
        // Supprimer tous les styles existants d'abord
        this.dpadContainer.removeAttribute('style');
        
        // Appliquer les nouveaux styles avec la taille réduite
        this.dpadContainer.style.cssText = `
            position: fixed !important;
            left: ${screenPos.x}px !important;
            top: ${screenPos.y}px !important;
            transform: translate(-50%, -50%) !important;
            z-index: 1000 !important;
            background: transparent !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            pointer-events: auto !important;
            opacity: 1 !important;
            visibility: visible !important;
            display: block !important;
            width: 60px !important;
            max-width: 60px !important;
            min-width: 60px !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            font-family: 'Segoe UI', Arial, sans-serif !important;
            user-select: none !important;
        `;
    }
    
    /**
     * Démarrer le suivi continu de l'objet (pour suivre les mouvements de caméra)
     */
    startObjectTracking() {
        // Arrêter le suivi précédent s'il existe
        this.stopObjectTracking();
        
        // Suivi continu toutes les 100ms pour suivre les mouvements de caméra
        this.trackingInterval = setInterval(() => {
            if (this.isVisible && this.activeGLBElement && !this.useInitialPosition) {
                this.positionNearObject();
            }
        }, 100);
    }
    
    /**
     * Arrêter le suivi continu
     */
    stopObjectTracking() {
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }
    }

    /**
     * Remettre le D-pad à sa position initiale (centré en bas)
     */
    resetToInitialPosition() {
        if (!this.dpadContainer) return;
        
        // Activer le flag position initiale
        this.useInitialPosition = true;
        
        // Arrêter le suivi de l'objet
        this.stopObjectTracking();
        
        // Supprimer tous les styles inline pour revenir aux styles CSS
        this.dpadContainer.removeAttribute('style');
        
        // Forcer la position initiale avec les styles de base
        this.dpadContainer.style.cssText = `
            position: fixed !important;
            bottom: 20px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: 60px !important;
            max-width: 60px !important;
            min-width: 60px !important;
            background: transparent !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            pointer-events: auto !important;
            opacity: 1 !important;
            visibility: visible !important;
            display: block !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            font-family: 'Segoe UI', Arial, sans-serif !important;
            user-select: none !important;
            z-index: 1000 !important;
        `;
        
        if (window.DEBUG_CONSTRUCTION) {
            console.log('🎮 D-pad remis en position initiale (centré en bas)');
        }
    }

    /**
     * Activer le suivi de l'objet GLB (position dynamique)
     */
    enableObjectTracking() {
        if (!this.dpadContainer || !this.activeGLBElement) return;
        
        // Désactiver le flag position initiale
        this.useInitialPosition = false;
        
        // Positionner près de l'objet
        this.positionNearObject();
        
        // Démarrer le suivi continu
        this.startObjectTracking();
        
        console.log('🎯 Suivi de l\'objet GLB activé');
    }

    /**
     * Positionner le D-pad immédiatement au bord d'une brique qui vient d'être placée
     */
    positionNearPlacedBrick(glbElement) {
        if (!this.dpadContainer) return;
        
        // Définir l'élément actif
        this.activeGLBElement = glbElement;
        
        // Désactiver la position initiale pour utiliser le suivi
        this.useInitialPosition = false;
        
        // Positionner immédiatement
        this.positionNearObject();
        
        // Démarrer le suivi continu
        this.startObjectTracking();
        
        // D-pad positionné au bord de la brique placée
    }

    /**
     * Afficher le D-pad
     */
    show() {
        if (this.dpadContainer) {
            this.isVisible = true;
            this.dpadContainer.classList.add('visible');
            
            // Positionner près de l'objet qui vient d'être placé
            setTimeout(() => {
                if (this.activeGLBElement) {
                    this.positionNearObject();
                    // Démarrer le suivi continu
                    this.startObjectTracking();
                } else {
                    // Fallback vers position initiale si pas d'objet
                    this.resetToInitialPosition();
                }
                
                // Forcer aussi l'opacité sur tous les boutons avec design cohérent
                const buttons = this.dpadContainer.querySelectorAll('button');
                buttons.forEach(button => {
                    button.style.opacity = '1';
                    button.style.visibility = 'visible';
                    button.style.pointerEvents = 'auto';
                });
            }, 100);
        }
    }    /**
     * Vérifier si un élément nécessite les contrôles de hauteur Y
     */
    needsYControls(element) {
        if (!element) return false;
        
        // Tous les éléments GLB nécessitent les contrôles Y
        if (this.isGLBElement(element)) {
            return true;
        }
        
        // Vérification spécifique pour les hourdis 13x60 et 16x60
        const elementType = element.type || 
                           (element.userData?.glbInfo?.type) || 
                           element.name || '';
        
        const isHourdis = elementType.includes('hourdis_13_60') || 
                         elementType.includes('hourdis_16_60') ||
                         elementType.includes('Hourdis');
        
        if (isHourdis) {
            console.log('🎯 Hourdis détecté, activation des curseurs Y:', elementType);
            return true;
        }
        
        return false;
    }

    /**
     * Contrôler la visibilité des boutons Y selon le type d'objet
     * @param {boolean} showYControls - true pour GLB et hourdis, false pour formes basiques
     */
    setYControlsVisibility(showYControls) {
        if (!this.dpadContainer) return;
        
        const heightControls = this.dpadContainer.querySelector('.glb-dpad-height-controls');
        if (heightControls) {
            if (showYControls) {
                heightControls.style.display = 'flex';
                if (window.DEBUG_CONSTRUCTION) {
                    console.log('✅ Curseurs Y activés');
                }
            } else {
                heightControls.style.display = 'none';
                if (window.DEBUG_CONSTRUCTION) {
                    console.log('❌ Curseurs Y désactivés');
                }
            }
        }
    }

    /**
     * Afficher le D-pad pour un type d'objet spécifique
     * @param {boolean} isGLBObject - true si c'est un objet GLB ou hourdis, false pour forme basique
     */
    showForObjectType(isGLBObject = false) {
        this.show();
        
        // Déterminer si on a besoin des curseurs Y
        const needsY = this.activeGLBElement ? this.needsYControls(this.activeGLBElement) : isGLBObject;
        this.setYControlsVisibility(needsY);
    }

    /**
     * Cacher le D-pad
     */
    hide() {
        if (this.dpadContainer) {
            this.isVisible = false;
            this.activeGLBElement = null;
            this.dpadContainer.classList.remove('visible');
            
            // Arrêter le suivi continu
            this.stopObjectTracking();
        }
    }

    /**
     * Déplacer l'élément actif (GLB ou forme basique)
     */
    moveActiveElement(direction, value) {
        if (!this.activeGLBElement) {
            console.warn('⚠️ Aucun élément actif pour le déplacement');
            return;
        }

        const movement = value * this.gridSize;
        const currentPos = this.activeGLBElement.position;
        
        const newPosition = { x: currentPos.x, y: currentPos.y, z: currentPos.z };
        
        const isGLB = this.isGLBElement(this.activeGLBElement);

        // Appliquer le mouvement selon la direction
        switch (direction) {
            case 'x':
                newPosition.x += movement;
                break;
            case 'y':
                // Pour les formes basiques, ignorer le mouvement Y (système d'assises)
                if (isGLB) {
                    newPosition.y += movement;
                } else {
                    return; // Ne pas déplacer si c'est une forme basique
                }
                break;
            case 'z':
                newPosition.z += movement;
                break;
        }

        // Mettre à jour la position selon le type d'élément
        if (isGLB) {
            // Pour les objets GLB: mise à jour directe du mesh 3D
            if (this.activeGLBElement.mesh && this.activeGLBElement.mesh.position) {
                this.activeGLBElement.mesh.position.set(newPosition.x, newPosition.y, newPosition.z);
            } 
            // Fallback pour GLB: position standard
            else if (this.activeGLBElement.position) {
                this.activeGLBElement.position.x = newPosition.x;
                this.activeGLBElement.position.y = newPosition.y;
                this.activeGLBElement.position.z = newPosition.z;
            }
        } else {
            // Pour les éléments basiques (briques/blocs): 
            // 1. Mettre à jour l'objet WallElement
            if (this.activeGLBElement.position) {
                this.activeGLBElement.position.x = newPosition.x;
                this.activeGLBElement.position.z = newPosition.z;
                // Ne pas toucher Y pour les formes basiques (système d'assises)
            }
            
            // 2. Mettre à jour le mesh 3D en appliquant le mouvement relatif
            if (this.activeGLBElement.mesh && this.activeGLBElement.mesh.position) {
                // Appliquer le mouvement relatif au mesh, pas une position absolue
                switch (direction) {
                    case 'x':
                        this.activeGLBElement.mesh.position.x += movement;
                        break;
                    case 'z':
                        this.activeGLBElement.mesh.position.z += movement;
                        break;
                }
            }
        }
        
        // Déplacer les joints associés pour les éléments basiques (briques/blocs)
        if (!isGLB && (this.activeGLBElement.type === 'brick' || this.activeGLBElement.type === 'block')) {
            this.moveAssociatedJoints(this.activeGLBElement, direction, movement);
        }
        
        // Mettre à jour l'affichage de la position
        this.updatePositionDisplay();
        
        // Mettre à jour la position du D-pad près de l'objet SEULEMENT si pas en position initiale
        if (!this.useInitialPosition) {
            this.positionNearObject();
        }

        // Émettre un événement de changement pour les autres systèmes
        // Mais indiquer que c'est un déplacement manuel du D-pad
        document.dispatchEvent(new CustomEvent('glbElementMoved', {
            detail: {
                element: this.activeGLBElement,
                direction: direction,
                movement: movement,
                newPosition: newPosition,
                isManualDpadMovement: true  // Flag pour indiquer un déplacement manuel
            }
        }));

        // Déclencher la mise à jour du métré si nécessaire
        if (window.MetreTabManager && window.MetreTabManager.updateMetrage) {
            window.MetreTabManager.updateMetrage();
        }
    }

    /**
     * Mettre à jour l'affichage de la position
     */
    updatePositionDisplay() {
        const display = document.getElementById('glbPositionDisplay');
        if (display && this.activeGLBElement) {
            const pos = this.activeGLBElement.position;
            const x = Math.round(pos.x * 100) / 100; // Arrondir à 2 décimales
            const y = Math.round(pos.y * 100) / 100;
            const z = Math.round(pos.z * 100) / 100;
            
            display.textContent = `X: ${x}, Y: ${y}, Z: ${z}`;
        }
    }

    /**
     * Animer la pression du bouton
     */
    animateButtonPress(button) {
        if (button) {
            button.classList.add('pressed');
            setTimeout(() => {
                button.classList.remove('pressed');
            }, 100);
        }
    }

    /**
     * Détruire le D-pad
     */
    destroy() {
        if (this.dpadContainer) {
            this.dpadContainer.remove();
            this.dpadContainer = null;
        }
        this.activeGLBElement = null;
        this.isVisible = false;
    }

    /**
     * Forcer la recréation du D-pad avec la nouvelle taille
     */
    forceRecreate() {
        const wasVisible = this.isVisible;
        const activeElement = this.activeGLBElement;
        
        // Détruire l'ancien D-pad
        this.destroy();
        
        // Recréer complètement
        this.setupDpadHTML();
        this.bindEvents();
        
        // Restaurer l'état si nécessaire
        if (wasVisible && activeElement) {
            this.activeGLBElement = activeElement;
            this.show();
        }
    }

    /**
     * Déplacer les joints associés à un élément de construction
     */
    moveAssociatedJoints(element, direction, movement) {
        if (!window.SceneManager || !window.SceneManager.elements) {
            return;
        }

        // Trouver les joints horizontaux associés (même position X/Z et dimensions similaires)
        const associatedJoints = Array.from(window.SceneManager.elements.values()).filter(joint => {
            if (!joint.isHorizontalJoint) return false;
            
            // Vérifier la proximité de position (avant le déplacement de l'élément principal)
            const positionMatch = Math.abs(joint.position.x - (element.position.x - movement * (direction === 'x' ? 1 : 0))) < 1 && 
                                Math.abs(joint.position.z - (element.position.z - movement * (direction === 'z' ? 1 : 0))) < 1;
            
            // Vérifier la similarité des dimensions
            const dimensionMatch = Math.abs(element.dimensions.length - joint.dimensions.length) < 1 &&
                                 Math.abs(element.dimensions.width - joint.dimensions.width) < 1;
            
            return positionMatch && dimensionMatch;
        });

        // Déplacer chaque joint associé
        associatedJoints.forEach(joint => {
            // 1. Mettre à jour l'objet WallElement du joint
            switch (direction) {
                case 'x':
                    joint.position.x += movement;
                    break;
                case 'z':
                    joint.position.z += movement;
                    break;
            }
            
            // 2. Mettre à jour le mesh 3D du joint
            if (joint.mesh && joint.mesh.position) {
                switch (direction) {
                    case 'x':
                        joint.mesh.position.x += movement;
                        break;
                    case 'z':
                        joint.mesh.position.z += movement;
                        break;
                }
            }
        });
    }
}

// Fonction utilitaire globale pour forcer la recréation du D-pad
window.forceDpadRecreate = function() {
    if (window.GLBDpadController) {
        console.log('🔧 Recréation forcée du D-pad avec nouvelle taille...');
        window.GLBDpadController.forceRecreate();
        console.log('✅ D-pad recréé avec taille ultra-compacte (60px)');
    } else {
        console.log('❌ GLBDpadController non disponible');
    }
};

// Fonction pour remettre le D-pad en position initiale
window.resetDpadPosition = function() {
    if (window.GLBDpadController) {
        console.log('🎯 Remise en position initiale du D-pad...');
        window.GLBDpadController.resetToInitialPosition();
        console.log('✅ D-pad repositionné en bas au centre');
    } else {
        console.log('❌ GLBDpadController non disponible');
    }
};

// Fonction pour activer le suivi de l'objet GLB
window.enableDpadTracking = function() {
    if (window.GLBDpadController) {
        console.log('🎯 Activation du suivi de l\'objet...');
        window.GLBDpadController.enableObjectTracking();
        console.log('✅ D-pad suit maintenant l\'objet GLB');
    } else {
        console.log('❌ GLBDpadController non disponible');
    }
};

// Fonction pour positionner le D-pad près d'une brique placée
window.positionDpadNearBrick = function(glbElement) {
    if (window.GLBDpadController) {
        console.log('🧱 Positionnement du D-pad près de la brique...');
        window.GLBDpadController.positionNearPlacedBrick(glbElement);
        console.log('✅ D-pad positionné au bord de la brique');
    } else {
        console.log('❌ GLBDpadController non disponible');
    }
};

// Fonction pour forcer la suppression complète de tous les D-pads
window.forceRemoveAllDpads = function() {
    console.log('🗑️ Suppression forcée de tous les D-pads...');
    const allDpads = document.querySelectorAll('#glb-dpad-controller, .glb-dpad-container, [class*="dpad"]');
    allDpads.forEach((dpad, index) => {
        console.log(`🗑️ Suppression D-pad ${index + 1}:`, dpad);
        dpad.remove();
    });
    
    // Supprimer les styles aussi
    const dpadStyles = document.querySelectorAll('style[id*="dpad"], style[id*="glb"]');
    dpadStyles.forEach(style => {
        console.log('🗑️ Suppression style:', style.id);
        style.remove();
    });
    
    console.log('✅ Tous les D-pads supprimés');
};

// Initialiser le contrôleur D-pad au chargement
document.addEventListener('DOMContentLoaded', () => {
    window.GLBDpadController = new GLBDpadController();
});

// Sécurité : initialiser aussi si le DOM est déjà chargé
if (document.readyState === 'loading') {
    // DOM en cours de chargement, attendre DOMContentLoaded
} else {
    window.GLBDpadController = new GLBDpadController();
}
