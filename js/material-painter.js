/**
 * Gestionnaire du mode Pinceau de Matériau
 * Permet de sélectionner un matériau et cliquer sur des éléments pour les peindre
 */
class MaterialPainter {
    constructor() {
        this.isPaintingMode = false;
        this.selectedMaterial = null;
        this.originalCursor = 'default';
        // Curseur pinceau plus simple et compatible
        this.paintCursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%234A90E2\' d=\'M9.5 16c0 0.8-0.7 1.5-1.5 1.5s-1.5-0.7-1.5-1.5 0.7-1.5 1.5-1.5 1.5 0.7 1.5 1.5zm6.9-4.5c0.4 0.4 0.6 1 0.6 1.5 0 1.1-0.9 2-2 2h-1c-0.6 0-1-0.4-1-1s0.4-1 1-1h1c0.3 0 0.5-0.2 0.5-0.5s-0.2-0.5-0.5-0.5H8c-1.7 0-3-1.3-3-3s1.3-3 3-3c0.8 0 1.5 0.3 2.1 0.9L19.4 2.6c0.4-0.4 1-0.4 1.4 0s0.4 1 0 1.4L12.1 12.8c0.3 0.2 0.6 0.4 0.8 0.7z\'/%3E%3C/svg%3E") 12 12, crosshair';
        this.init();
        this.bindEvents();
    }

    init() {
        // // console.log(\`🎨 Initialisation du système de pinceau de matériau');
        this.createPaintingInterface();
        this.updatePaintingModeInterface();
    }

    createPaintingInterface() {
        // Le bouton est maintenant directement dans le HTML
        // On s'assure juste qu'il existe
        const paintButton = document.getElementById('materialPaintMode');
        if (!paintButton) {
            console.warn('⚠️ Bouton pinceau non trouvé dans le HTML');
            return;
        }

        // Créer l'interface de statut du mode pinceau
        const statusContainer = document.querySelector('.status-bar') || document.body;
        const paintingStatus = document.createElement('div');
        paintingStatus.id = 'paintingModeStatus';
        paintingStatus.className = 'painting-mode-status';
        paintingStatus.innerHTML = `
            <div class="painting-status-content">
                <i class="fas fa-paint-brush"></i>
                <span id="paintingStatusText">Mode pinceau inactif</span>
                <span id="selectedMaterialName"></span>
                <button id="exitPaintingMode" class="btn-small">
                    <i class="fas fa-times"></i> Quitter
                </button>
            </div>
        `;
        paintingStatus.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(74, 144, 226, 0.95);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 1000;
            display: none;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            font-weight: 500;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        `;
        statusContainer.appendChild(paintingStatus);
    }

    bindEvents() {
        // Bouton de mode pinceau
        const paintButton = document.getElementById('materialPaintMode');
        if (paintButton) {
            paintButton.addEventListener('click', () => {
                // console.log('🎯 CLIC SUR BOUTON PINCEAU DÉTECTÉ');
                this.togglePaintingMode();
                
                // DÉCLENCHER L'AIDE CONTEXTUELLE LORS DU CLIC SUR LE BOUTON
                // 
                
                if (window.showToolHelp && typeof window.showToolHelp === 'function') {
                    setTimeout(() => {
                        try {
                            // console.log('🚀 TENTATIVE DÉCLENCHEMENT AIDE CONTEXTUELLE');
                            window.showToolHelp('materialPaintMode');
                            // console.log('✅ Aide contextuelle déclenchée pour le pinceau');
                        } catch (e) {
                            console.error('❌ ERREUR aide contextuelle:', e);
                        }
                    }, 300);
                } else {
                    console.warn('❌ window.showToolHelp non disponible');
                }
            });
        } else {
            console.warn('❌ Bouton pinceau non trouvé:', 'materialPaintMode');
        }

        // Bouton de sortie du mode pinceau
        const exitButton = document.getElementById('exitPaintingMode');
        if (exitButton) {
            exitButton.addEventListener('click', () => this.exitPaintingMode());
        }

        // Écouter les sélections de matériaux
        document.addEventListener('materialChanged', (e) => {
            if (this.isPaintingMode) {
                this.setSelectedMaterial(e.detail.materialId);
            }
        });

        // Écouter les clics sur les matériaux pour activer le mode pinceau
        document.addEventListener('click', (e) => {
            const materialItem = e.target.closest('.material-item');
            if (materialItem && !this.isPaintingMode) {
                const materialId = materialItem.dataset.materialId;
                if (materialId) {
                    this.startPaintingWithMaterial(materialId);
                }
            }
        });

        // Écouter les clics dans la scène pour peindre les éléments
        document.addEventListener('click', (e) => {
            if (this.isPaintingMode && e.target.closest('#scene-container')) {
                // Empêcher la propagation pour éviter les conflits avec SceneManager
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.handleScenePaintClick(e);
            }
        }, true); // Capture phase pour intercepter avant SceneManager

        // Raccourci clavier Échap pour sortir du mode
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPaintingMode) {
                this.exitPaintingMode();
            }
        });

        // Raccourci clavier P pour activer/désactiver le mode pinceau
        document.addEventListener('keydown', (e) => {
            if (e && e.key && e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                const activeElement = document.activeElement;
                if (!activeElement || !['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName)) {
                    this.togglePaintingMode();
                }
            }
        });
    }

    togglePaintingMode() {
        if (this.isPaintingMode) {
            this.exitPaintingMode();
        } else {
            // Ouvrir l'onglet textures avant d'entrer en mode peinture
            this.openTexturesTab();
            this.enterPaintingMode();
        }
    }

    enterPaintingMode() {
        this.isPaintingMode = true;
        this.originalCursor = document.body.style.cursor || 'default';
        
        // FERMER LES FENÊTRES D'AIDE LORS DE L'ACTIVATION DU PINCEAU
        if (window.closeAllHelpWindows && typeof window.closeAllHelpWindows === 'function') {
            window.closeAllHelpWindows();
        }
        
        // Masquer la brique fantôme pendant le mode peinture
        this.hideGhostElement();
        
        // Utiliser le matériau actuellement sélectionné
        let currentMaterial = null;
        if (window.ExtendedMaterialManager) {
            currentMaterial = window.ExtendedMaterialManager.getCurrentMaterial();
        } else if (window.ConstructionTools) {
            currentMaterial = window.ConstructionTools.currentMaterial;
        }
        
        if (currentMaterial) {
            this.setSelectedMaterial(currentMaterial);
        }

        this.updatePaintingModeInterface();
        this.updateCursor();
        
        // Désactiver temporairement les contrôles de caméra
        if (window.SceneManager && window.SceneManager.controls) {
            window.SceneManager.controls.enabled = false;
        }

        // Notification moins intrusive pour ne pas masquer l'aide contextuelle
        // this.showNotification('🎨 Mode pinceau activé ! Cliquez sur un élément pour le peindre', 'info');
        
        // // console.log(\`🎨 Mode pinceau de matériau activé');
    }

    exitPaintingMode() {
        this.isPaintingMode = false;
        this.selectedMaterial = null;
        
        // Nettoyage complet du curseur
        document.body.style.cursor = '';
        document.body.style.removeProperty('cursor');
        
        // Réactiver la brique fantôme si elle était active et qu'il n'y a pas de suggestions
        if (!window.ConstructionTools || !window.ConstructionTools.activeBrickForSuggestions) {
            this.showGhostElement();
        }
        
        // Réactiver les contrôles de caméra
        if (window.SceneManager && window.SceneManager.controls) {
            window.SceneManager.controls.enabled = true;
        }

        // Mettre à jour l'interface et le curseur
        this.updatePaintingModeInterface();
        this.updateCursor();
        this.hideHighlights();
        
        // // console.log(\`🎨 Mode pinceau de matériau désactivé');
    }

    startPaintingWithMaterial(materialId) {
        // console.log('🎨 DÉMARRAGE PINCEAU AVEC MATÉRIAU:', materialId);
        this.setSelectedMaterial(materialId);
        if (!this.isPaintingMode) {
            this.enterPaintingMode();
            
            // DÉCLENCHER L'AIDE CONTEXTUELLE QUAND ON SÉLECTIONNE UN MATÉRIAU
            // 
            if (window.showToolHelp && typeof window.showToolHelp === 'function') {
                setTimeout(() => {
                    try {
                        // console.log('🚀 DÉCLENCHEMENT AIDE VIA MATÉRIAU');
                        window.showToolHelp('materialPaintMode');
                        // console.log('✅ Aide contextuelle déclenchée via sélection matériau');
                    } catch (e) {
                        console.error('❌ ERREUR aide via matériau:', e);
                    }
                }, 300);
            } else {
                console.warn('❌ window.showToolHelp non disponible pour matériau');
            }
        }
    }

    setSelectedMaterial(materialId) {
        this.selectedMaterial = materialId;
        const material = window.MaterialLibrary.getMaterial(materialId);
        
        if (this.isPaintingMode) {
            this.updatePaintingModeInterface();
            this.updateCursor();
            
            const materialName = material ? material.name : 'Matériau inconnu';
            // Suppression de la notification pour ne pas masquer l'aide contextuelle
            // this.showNotification(`🎨 Matériau sélectionné: ${materialName}`, 'success');
        }
    }

    handleScenePaintClick(event) {
        if (!this.isPaintingMode || !this.selectedMaterial) {
            return;
        }

        // Empêcher la propagation pour éviter les autres actions
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        // Utiliser le raycasting pour détecter l'élément cliqué
        const sceneContainer = document.getElementById('scene-container');
        if (!sceneContainer || !window.SceneManager) {
            console.warn('🎨 SceneContainer ou SceneManager non disponible');
            return;
        }

        const rect = sceneContainer.getBoundingClientRect();
        const mouse = new THREE.Vector2();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, window.SceneManager.camera);

        // Collecter tous les mesh des éléments
        const elementMeshes = [];
        if (window.SceneManager.elements && window.SceneManager.elements.size > 0) {
            for (const [elementId, element] of window.SceneManager.elements.entries()) {
                if (element && element.mesh && element.id) {
                    elementMeshes.push({
                        mesh: element.mesh,
                        elementId: elementId,
                        element: element
                    });
                }
            }
        }

        if (elementMeshes.length === 0) {
            this.showNotification('❌ Aucun élément disponible pour la peinture', 'warning');
            return;
        }

        const intersects = raycaster.intersectObjects(elementMeshes.map(item => item.mesh));

        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            const elementInfo = elementMeshes.find(item => item.mesh === clickedMesh);

            if (elementInfo && elementInfo.element && elementInfo.element.id) {
                this.paintElement(elementInfo.element, elementInfo.elementId);
            } else {
                console.warn('🎨 Informations d\'élément invalides:', elementInfo);
                this.showNotification('❌ Élément invalide détecté', 'error');
            }
        } else {
            this.showNotification('❌ Aucun élément trouvé à cette position', 'warning');
        }
    }

    paintElement(element, elementId) {
        if (!element || !this.selectedMaterial) return;

        try {
            // Sauvegarder l'ancien matériau pour l'historique
            const oldMaterial = element.material;
            const newMaterialId = this.selectedMaterial;
            
            // Appliquer le nouveau matériau
            element.setMaterial(newMaterialId);

            // Marquer l'élément comme "peint" pour le métré
            try {
                element.userData = element.userData || {};
                if (oldMaterial && oldMaterial !== newMaterialId && !element.userData.originalMaterialId) {
                    element.userData.originalMaterialId = oldMaterial;
                }
                element.userData.isCustomMaterial = true;
                element.userData.customMaterialId = newMaterialId;
                if (window.MaterialLibrary && window.MaterialLibrary.getMaterial) {
                    const matData = window.MaterialLibrary.getMaterial(newMaterialId) || {};
                    element.userData.customMaterialName = matData.name || newMaterialId;
                } else {
                    element.userData.customMaterialName = newMaterialId;
                }
            } catch (e) {
                console.warn('⚠️ Annotation "peint" échouée:', e);
            }
            
            // Mettre à jour l'affichage si l'élément est sélectionné
            if (window.SceneManager.selectedElement === element) {
                const materialSelect = document.getElementById('materialSelect');
                if (materialSelect) {
                    materialSelect.value = this.selectedMaterial;
                }
            }

            // Animation de confirmation
            this.animatePaintSuccess(element);
            
            // Notification de succès
            const materialName = window.MaterialLibrary.getMaterial(newMaterialId).name;
            this.showNotification(`✅ Élément peint avec: ${materialName}`, 'success');
            
            // Son de confirmation
            // Son supprimé

            // Émettre un événement pour d'autres composants
            document.dispatchEvent(new CustomEvent('elementPainted', {
                detail: {
                    elementId,
                    element,
                    oldMaterial,
                    newMaterial: newMaterialId,
                    isCustomMaterial: true
                }
            }));

            // console.log(`🎨 Élément ${elementId} peint avec le matériau ${this.selectedMaterial}`);

            // NOUVELLE FONCTIONNALITÉ: Revenir automatiquement en mode construction après avoir peint
            setTimeout(() => {
                this.exitPaintingMode();
                
                // Basculer vers le mode construction si ToolbarManager est disponible
                if (window.toolbarManager && typeof window.toolbarManager.setInteractionMode === 'function') {
                    window.toolbarManager.setInteractionMode('placement');
                    // // console.log(\`🔄 Retour automatique en mode construction après peinture');
                } else {
                    console.warn('⚠️ ToolbarManager non disponible pour basculer en mode construction');
                }
            }, 500); // Délai de 500ms pour laisser le temps à l'animation et la notification

        } catch (error) {
            console.error('❌ Erreur lors de la peinture de l\'élément:', error);
            this.showNotification('❌ Erreur lors de l\'application du matériau', 'error');
        }
    }

    animatePaintSuccess(element) {
        if (!element.mesh) return;

        // Sauvegarder l'état original
        const originalEmissive = element.mesh.material.emissive.clone();
        const originalIntensity = element.mesh.material.emissiveIntensity || 0;

        // Animation de flash vert
        element.mesh.material.emissive.setHex(0x00ff00);
        element.mesh.material.emissiveIntensity = 0.5;

        // Restaurer progressivement
        let progress = 0;
        const duration = 600; // 600ms
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            progress = Math.min(elapsed / duration, 1);

            // Interpolation vers l'état original
            const intensity = 0.5 * (1 - progress) + originalIntensity * progress;
            element.mesh.material.emissiveIntensity = intensity;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Restaurer complètement
                element.mesh.material.emissive.copy(originalEmissive);
                element.mesh.material.emissiveIntensity = originalIntensity;
            }
        };

        animate();
    }

    updatePaintingModeInterface() {
        const statusDiv = document.getElementById('paintingModeStatus');
        const paintButton = document.getElementById('materialPaintMode');
        const statusText = document.getElementById('paintingStatusText');
        const materialName = document.getElementById('selectedMaterialName');

        if (statusDiv) {
            statusDiv.style.display = this.isPaintingMode ? 'flex' : 'none';
        }

        if (paintButton) {
            paintButton.classList.toggle('active', this.isPaintingMode);
        }

        if (statusText) {
            statusText.textContent = this.isPaintingMode ? 
                'Mode pinceau actif - Cliquez sur un élément' : 
                'Mode pinceau inactif';
        }

        if (materialName && this.selectedMaterial) {
            const material = window.MaterialLibrary.getMaterial(this.selectedMaterial);
            materialName.textContent = material ? ` | ${material.name}` : '';
        } else if (materialName) {
            materialName.textContent = '';
        }
    }

    updateCursor() {
        if (this.isPaintingMode) {
            // Toujours utiliser le curseur pinceau en mode peinture
            document.body.style.cursor = this.paintCursor;
            
            // Changer aussi le curseur pour le conteneur de scène avec force
            const sceneContainer = document.getElementById('scene-container');
            if (sceneContainer) {
                sceneContainer.style.cursor = this.paintCursor + ' !important';
                // Ajouter aussi une classe pour forcer le style
                sceneContainer.classList.add('paint-cursor-active');
            }
            
            // Ajouter une classe au body pour le CSS
            document.body.classList.add('painting-mode');
        } else {
            // Restaurer le curseur normal avec nettoyage complet
            document.body.style.cursor = '';
            document.body.style.removeProperty('cursor');
            
            const sceneContainer = document.getElementById('scene-container');
            if (sceneContainer) {
                sceneContainer.style.cursor = '';
                sceneContainer.style.removeProperty('cursor');
                sceneContainer.classList.remove('paint-cursor-active');
            }
            document.body.classList.remove('painting-mode');
            
            // Force le navigateur à recalculer le curseur
            setTimeout(() => {
                document.body.style.cursor = 'auto';
                if (sceneContainer) {
                    sceneContainer.style.cursor = 'auto';
                }
            }, 10);
        }
    }

    hideHighlights() {
        // Masquer tous les surlignages d'éléments
        document.querySelectorAll('.element-highlight').forEach(highlight => {
            highlight.remove();
        });
    }

    showNotification(message, type = 'info') {
        // Créer une notification temporaire
        const notification = document.createElement('div');
        notification.className = `paint-notification paint-${type}`;
        notification.textContent = message;
        
        const colors = {
            'info': 'rgba(74, 144, 226, 0.9)',
            'success': 'rgba(40, 167, 69, 0.9)',
            'warning': 'rgba(255, 193, 7, 0.9)',
            'error': 'rgba(220, 53, 69, 0.9)'
        };

        notification.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 10001;
            font-size: 14px;
            font-weight: 500;
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
            backdrop-filter: blur(5px);
        `;

        document.body.appendChild(notification);

        // Supprimer après 3 secondes
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Méthodes utilitaires pour autres composants
    isPaintingActive() {
        return this.isPaintingMode;
    }

    getCurrentPaintMaterial() {
        return this.selectedMaterial;
    }

    // Méthode pour intégration avec ExtendedMaterialManager
    integrateWithMaterialManager() {
        // Ajouter des icônes de pinceau aux éléments de matériaux
        document.querySelectorAll('.material-item').forEach(item => {
            if (!item.querySelector('.paint-icon')) {
                const paintIcon = document.createElement('div');
                paintIcon.className = 'paint-icon';
                paintIcon.innerHTML = '<i class="fas fa-paint-brush"></i>';
                paintIcon.title = 'Clic pour activer le pinceau avec ce matériau';
                paintIcon.style.cssText = `
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: rgba(74, 144, 226, 0.8);
                    color: white;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    cursor: pointer;
                    opacity: 0;
                    transition: opacity 0.2s;
                `;
                item.appendChild(paintIcon);
                
                // Afficher l'icône au survol
                item.addEventListener('mouseenter', () => {
                    paintIcon.style.opacity = '1';
                });
                item.addEventListener('mouseleave', () => {
                    paintIcon.style.opacity = '0';
                });
                
                // Activer le pinceau au clic sur l'icône
                paintIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.startPaintingWithMaterial(item.dataset.materialId);
                });
            }
        });
    }

    /**
     * Ouvrir l'onglet Textures/Matériaux
     */
    openTexturesTab() {
        if (window.TabManager && typeof window.TabManager.switchMainTab === 'function') {
            window.TabManager.switchMainTab('textures');
            // // console.log(\`🎨 Onglet Textures ouvert via le pinceau');
        } else {
            console.warn('🎨 TabManager non disponible pour ouvrir l\'onglet textures');
        }
    }

    /**
     * Masquer la brique fantôme pendant le mode peinture
     */
    hideGhostElement() {
        if (window.ConstructionTools && window.ConstructionTools.ghostElement) {
            this.originalGhostVisibility = window.ConstructionTools.showGhost;
            window.ConstructionTools.showGhost = false;
            window.ConstructionTools.ghostElement.mesh.visible = false;
            // // console.log(\`🎨 Brique fantôme masquée');
        }
    }

    /**
     * Réafficher la brique fantôme après le mode peinture
     */
    showGhostElement() {
        if (window.ConstructionTools && window.ConstructionTools.ghostElement) {
            if (this.originalGhostVisibility !== undefined) {
                window.ConstructionTools.showGhost = this.originalGhostVisibility;
                // Ne réafficher que si on n'est pas en mode suggestions
                if (!window.ConstructionTools.activeBrickForSuggestions) {
                    window.ConstructionTools.ghostElement.mesh.visible = this.originalGhostVisibility;
                    // // console.log(\`🎨 Brique fantôme réaffichée');
                }
            }
        }
    }
}

// Styles CSS pour les animations
const paintingStyles = document.createElement('style');
paintingStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .paint-mode-btn.active {
        background: rgba(74, 144, 226, 0.9) !important;
        color: white !important;
        box-shadow: 0 0 10px rgba(74, 144, 226, 0.5) !important;
    }

    .painting-mode-status .btn-small {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: background 0.2s;
    }

    .painting-mode-status .btn-small:hover {
        background: rgba(255, 255, 255, 0.3);
    }

    .material-item {
        position: relative;
    }

    /* Force le curseur pinceau en mode peinture */
    body.painting-mode,
    body.painting-mode *,
    .paint-cursor-active,
    .paint-cursor-active * {
        cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%234A90E2' d='M9.5 16c0 0.8-0.7 1.5-1.5 1.5s-1.5-0.7-1.5-1.5 0.7-1.5 1.5-1.5 1.5 0.7 1.5 1.5zm6.9-4.5c0.4 0.4 0.6 1 0.6 1.5 0 1.1-0.9 2-2 2h-1c-0.6 0-1-0.4-1-1s0.4-1 1-1h1c0.3 0 0.5-0.2 0.5-0.5s-0.2-0.5-0.5-0.5H8c-1.7 0-3-1.3-3-3s1.3-3 3-3c0.8 0 1.5 0.3 2.1 0.9L19.4 2.6c0.4-0.4 1-0.4 1.4 0s0.4 1 0 1.4L12.1 12.8c0.3 0.2 0.6 0.4 0.8 0.7z'/%3E%3C/svg%3E") 12 12, crosshair !important;
    }
    
    /* Styles spécifiques pour le conteneur de scène */
    #scene-container.paint-cursor-active {
        cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%234A90E2' d='M9.5 16c0 0.8-0.7 1.5-1.5 1.5s-1.5-0.7-1.5-1.5 0.7-1.5 1.5-1.5 1.5 0.7 1.5 1.5zm6.9-4.5c0.4 0.4 0.6 1 0.6 1.5 0 1.1-0.9 2-2 2h-1c-0.6 0-1-0.4-1-1s0.4-1 1-1h1c0.3 0 0.5-0.2 0.5-0.5s-0.2-0.5-0.5-0.5H8c-1.7 0-3-1.3-3-3s1.3-3 3-3c0.8 0 1.5 0.3 2.1 0.9L19.4 2.6c0.4-0.4 1-0.4 1.4 0s0.4 1 0 1.4L12.1 12.8c0.3 0.2 0.6 0.4 0.8 0.7z'/%3E%3C/svg%3E") 12 12, crosshair !important;
    }
`;
document.head.appendChild(paintingStyles);

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que les autres systèmes soient prêts
    const initMaterialPainter = () => {
        if (window.MaterialLibrary && window.SceneManager) {
            window.MaterialPainter = new MaterialPainter();
            
            // Intégrer avec ExtendedMaterialManager si disponible
            setTimeout(() => {
                if (window.ExtendedMaterialManager) {
                    window.MaterialPainter.integrateWithMaterialManager();
                }
            }, 1000);
            
            // // console.log(\`🎨 MaterialPainter initialisé');
        } else {
            setTimeout(initMaterialPainter, 100);
        }
    };
    
    initMaterialPainter();
});

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MaterialPainter;
}
