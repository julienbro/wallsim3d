/**
 * Gestionnaire de la barre d'outils verticale
 */
class ToolbarManager {
    constructor() {
        this.currentTool = 'select';
        this.interactionMode = 'placement'; // 'placement' ou 'selection'
        this.isToolActive = false;
        this.selectedElement = null;
        this.originalPlacementSuggestions = null;
        
        // Attendre que le DOM et les autres managers soient prêts
        setTimeout(() => {
            this.initElements();
            this.initEventListeners();
            this.setupRaycasting();
        }, 1000);
    }
    
    initElements() {
        this.toolbar = document.querySelector('.toolbar');
        this.instructionMessage = document.getElementById('instructionMessage');
        this.toolButtons = document.querySelectorAll('.tool-button');
        this.toolbarLabels = document.getElementById('toolbarLabels');
        
        /*
        console.log('🔧 Toolbar elements found:', {
            toolbar: !!this.toolbar,
            instructionMessage: !!this.instructionMessage,
            toolButtons: this.toolButtons.length,
            toolbarLabels: !!this.toolbarLabels
        });
        */
        
        // S'assurer que la barre d'outils est visible
        if (this.toolbar) {
            this.toolbar.style.display = 'flex';
        }
    }
    
    initEventListeners() {
        // Gestionnaire de clic sur les outils
        this.toolButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleToolClick(e, button));
        });
        
        // console.log('🔧 Event listeners configured for', this.toolButtons.length, 'buttons');
    }
    
    handleToolClick(event, button) {
        event.preventDefault();
        event.stopPropagation();
        
        const toolId = button.id;
        // console.log('🎯 Tool clicked:', toolId);
        
        // FERMER TOUTES LES FENÊTRES D'AIDE OUVERTES
        this.closeAllHelpWindows();
        
        // Cas spécial pour le bouton pinceau : il gère son propre état
        if (toolId === 'materialPaintMode') {
            // Ne pas interférer avec l'état du bouton pinceau
            // Il sera géré par MaterialPainter.updatePaintingModeInterface()
            this.currentTool = 'paint';
            this.interactionMode = 'paint';
            this.isToolActive = true;
            return; // Sortir ici pour éviter le traitement standard
        }
        
        // Cas spécial pour les outils qui devraient se désactiver si on reclique dessus
        const toggleableTools = ['selectTool', 'duplicateTool', 'deleteTool', 'moveTool'];
        if (toggleableTools.includes(toolId) && button.classList.contains('active')) {
            // Si l'outil est déjà actif, le désactiver et revenir en mode placement
            if (toolId === 'selectTool') {
                // Pour l'outil de sélection, revenir en mode placement de briques
                this.setInteractionMode('placement');
            } else {
                // Pour les autres outils, revenir en mode sélection
                this.returnToSelectMode();
            }
            return;
        }
        
        // Désactiver tous les boutons (sauf le pinceau qui se gère lui-même)
        this.toolButtons.forEach(btn => {
            if (btn.id !== 'materialPaintMode') {
                btn.classList.remove('active');
            }
        });
        
        // Si on clique sur un autre outil, désactiver le mode pinceau
        if (window.MaterialPainter && window.MaterialPainter.isPaintingMode) {
            window.MaterialPainter.exitPaintingMode();
        }
        
        // Activer le bouton cliqué
        button.classList.add('active');
        
        // Réinitialiser la sélection
        this.resetSelection();
        
        // Définir l'outil actuel
        switch(toolId) {
            case 'selectTool':
                this.currentTool = 'select';
                this.interactionMode = 'selection';
                this.isToolActive = false;
                this.hideInstruction();
                this.enableNormalPlacement();
                // Désactiver complètement le mode placement et masquer l'élément fantôme
                if (window.ConstructionTools) {
                    // Désactiver le mode placement
                    window.ConstructionTools.isPlacementMode = false;
                    // Désactiver l'affichage du fantôme
                    window.ConstructionTools.showGhost = false;
                    // Masquer l'élément fantôme immédiatement
                    if (window.ConstructionTools.hideGhostElement) {
                        window.ConstructionTools.hideGhostElement();
                    }
                    // Force hide pour être sûr
                    if (window.ConstructionTools.ghostElement && window.ConstructionTools.ghostElement.mesh) {
                        window.ConstructionTools.ghostElement.mesh.visible = false;
                    }
                    // Désactiver les suggestions
                    if (window.ConstructionTools.deactivateSuggestions) {
                        window.ConstructionTools.deactivateSuggestions();
                    }
                    // Effacer les suggestions existantes
                    if (window.ConstructionTools.clearSuggestions) {
                        window.ConstructionTools.clearSuggestions();
                    }
                }
                break;
            case 'moveTool':
                this.currentTool = 'move';
                this.interactionMode = 'selection';
                this.isToolActive = true;
                this.showInstruction('Cliquez sur un élément pour le sélectionner et le déplacer');
                this.disableNormalPlacement();
                break;
            case 'deleteTool':
                this.currentTool = 'delete';
                this.interactionMode = 'selection';
                this.isToolActive = true;
                this.showInstruction('Cliquez sur un élément pour le supprimer');
                this.disableNormalPlacement();
                break;
            case 'duplicateTool':
                this.currentTool = 'duplicate';
                this.interactionMode = 'selection';
                this.isToolActive = true;
                this.showInstruction('Cliquez sur un élément pour le dupliquer');
                this.disableNormalPlacement();
                break;
        }
        
        // console.log('🔧 Current tool set to:', this.currentTool, 'Active:', this.isToolActive, 'Mode:', this.interactionMode);
    }
    
    // Méthode pour définir le mode d'interaction
    setInteractionMode(mode) {
        this.interactionMode = mode;
        // console.log('🔧 Interaction mode set to:', mode);
        
        if (mode === 'placement') {
            // Mode pose de briques par défaut - désactiver le bouton de sélection
            this.toolButtons.forEach(btn => btn.classList.remove('active'));
            this.isToolActive = false;
            this.hideInstruction();
            this.enableNormalPlacement();
            // Réactiver l'élément fantôme pour le mode placement seulement s'il n'y a pas de suggestions
            if (window.ConstructionTools) {
                window.ConstructionTools.showGhost = true;
                window.ConstructionTools.isPlacementMode = true;
                if (window.ConstructionTools.showGhostElement && !window.ConstructionTools.activeBrickForSuggestions) {
                    window.ConstructionTools.showGhostElement();
                }
            }
        }
    }
    
    setupRaycasting() {
        // Attendre que Three.js soit initialisé
        const waitForThree = () => {
            // Essayer différentes façons de détecter Three.js
            const hasThreeJS = window.THREE;
            
            const hasScene = window.SceneManager?.scene;
            const hasCamera = window.SceneManager?.camera;
            const hasRenderer = window.SceneManager?.renderer;
            
            // console.log('🔍 Checking Three.js objects:', {
            //     hasThreeJS: !!hasThreeJS,
            //     hasScene: !!hasScene,
            //     hasCamera: !!hasCamera,
            //     hasRenderer: !!hasRenderer,
            //     SceneManager: !!window.SceneManager
            // });
            
            if (hasThreeJS && hasScene && hasCamera && hasRenderer) {
                // console.log('🎯 Three.js found, setting up raycasting');
                this.initSceneInteraction();
            } else {
                // console.log('⏳ Waiting for Three.js initialization...');
                setTimeout(waitForThree, 500);
            }
        };
        waitForThree();
    }
    
    initSceneInteraction() {
        const canvas = document.getElementById('threejs-canvas');
        if (!canvas) {
            // console.log('❌ Canvas not found');
            return;
        }
        
        // console.log('🎯 Setting up canvas interaction');
        
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        // Trouver la scène et la caméra via SceneManager
        const scene = window.SceneManager?.scene;
        const camera = window.SceneManager?.camera;
        
        if (!scene || !camera) {
            // console.log('❌ Scene or camera not found', { 
            //     scene: !!scene, 
            //     camera: !!camera,
            //     SceneManager: !!window.SceneManager
            // });
            return;
        }
        
        // console.log('✅ Scene and camera found, raycasting ready');
        
        // Intercepter les clics sur le canvas
        canvas.addEventListener('click', (event) => {
            if (!this.isToolActive) return;
            
            // console.log('🎯 Canvas clicked with tool:', this.currentTool);
            
            // Calculer la position de la souris
            const rect = canvas.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            // Raycasting - filtrer pour exclure les objets non-interactifs
            raycaster.setFromCamera(mouse, camera);
            const allIntersects = raycaster.intersectObjects(scene.children, true);
            
            // Filtrer pour garder seulement les objets avec des userData valides
            const validIntersects = allIntersects.filter(intersect => {
                const obj = intersect.object;
                
                // Ignorer explicitement les objets système
                if (obj.name === 'WallSim3D_InteractionPlane' || 
                    obj.name === 'WallSim3D_GroundFloor' ||
                    obj.userData?.isGround ||
                    obj.userData?.isSystem ||
                    obj.type === 'GridHelper' || 
                    obj.type === 'AxesHelper') {
                    return false;
                }
                
                // 🔧 NOUVEAUTÉ: Vérifier les cotations et éléments spécialisés d'abord
                // Cotations avec measurementId
                if (obj.userData?.measurementId !== undefined || 
                    obj.userData?.measurementType || 
                    obj.userData?.toolType === 'measurement') {
                    return true;
                }
                
                // Annotations avec annotationId
                if (obj.userData?.annotationId !== undefined || 
                    obj.userData?.annotationType || 
                    obj.userData?.toolType === 'annotation') {
                    return true;
                }
                
                // Textes avec textLeaderId
                if (obj.userData?.textLeaderId !== undefined || 
                    obj.userData?.textLeaderType || 
                    obj.userData?.toolType === 'textleader') {
                    return true;
                }
                
                // Vérifier le parent pour les cotations (souvent les cotations sont dans des groupes)
                if (obj.parent && (
                    obj.parent.userData?.measurementId !== undefined ||
                    obj.parent.userData?.measurementType ||
                    obj.parent.userData?.toolType === 'measurement' ||
                    obj.parent.userData?.annotationId !== undefined ||
                    obj.parent.userData?.annotationType ||
                    obj.parent.userData?.toolType === 'annotation' ||
                    obj.parent.userData?.textLeaderId !== undefined ||
                    obj.parent.userData?.textLeaderType ||
                    obj.parent.userData?.toolType === 'textleader'
                )) {
                    return true;
                }
                
                // Priorité aux objets avec des éléments valides
                if (obj.userData?.element || obj.userData?.elementId) {
                    return true;
                }
                
                // Accepter les Mesh qui ont des userData avec type valide
                if (obj.type === 'Mesh' && obj.userData?.type && 
                    ['brick', 'block', 'joint', 'measurement', 'annotation', 'textleader'].includes(obj.userData.type)) {
                    return true;
                }
                
                return false;
            });
            
            // console.log('🎯 All intersects:', allIntersects.length, 'Valid intersects:', validIntersects.length);
            
            // Débugger les premières intersections pour comprendre la structure
            if (allIntersects.length > 0) {
                /*
                console.log('🔍 First 3 intersects details:');
                allIntersects.slice(0, 3).forEach((intersect, i) => {
                    const obj = intersect.object;
                    console.log(`  ${i}:`, {
                        type: obj.type,
                        name: obj.name,
                        userData: obj.userData,
                        userDataKeys: Object.keys(obj.userData || {}),
                        userDataValues: obj.userData,
                        hasParent: !!obj.parent,
                        parentName: obj.parent?.name,
                        parentUserData: obj.parent?.userData,
                        parentUserDataKeys: Object.keys(obj.parent?.userData || {})
                    });
                    
                    // Afficher le contenu détaillé des userData
                    console.log(`    userData content for ${i}:`, JSON.stringify(obj.userData, null, 2));
                    console.log(`    parent userData content for ${i}:`, JSON.stringify(obj.parent?.userData, null, 2));
                });
                */
            }
            
            if (validIntersects.length > 0) {
                // Empêcher les comportements par défaut SEULEMENT si on a une intersection valide
                event.preventDefault();
                event.stopPropagation();
                
                const intersectedObject = validIntersects[0].object;
                const element = this.findElementParent(intersectedObject);
                
                if (element) {
                    // console.log('🎯 Element found:', element.userData);
                    this.handleElementInteraction(element, validIntersects[0].point);
                } else {
                    console.log('🎯 No valid element found in intersection');
                }
            } else {
                // Aucune intersection valide - laisser le comportement normal
                // Ne pas empêcher l'événement, laisser le scene-manager gérer
                console.log('🎯 No valid intersections found, letting scene-manager handle');
            }
        }, true); // Utiliser capture pour intercepter avant les autres handlers
    }
    
    findElementParent(object) {
        // 🔧 SPÉCIAL GLB: Chercher le groupe parent GLB en premier
        let glbCandidate = object;
        let glbDepth = 0;
        const maxDepth = 10;
        
        while (glbCandidate && glbDepth < maxDepth) {
            if (glbCandidate.isGLBModel || 
                glbCandidate.userData?.isGLB || 
                glbCandidate.userData?.type === 'imported_model' ||
                glbCandidate.name?.includes('GLB_') ||
                (glbCandidate.type === 'Group' && glbCandidate.children?.some(child => 
                    child.userData?.isGLBMesh || child.userData?.element?.isGLB))) {
                console.log('✅ Found GLB parent element:', {
                    name: glbCandidate.name,
                    type: glbCandidate.type,
                    isGLBModel: glbCandidate.isGLBModel,
                    userData: glbCandidate.userData
                });
                return glbCandidate;
            }
            glbCandidate = glbCandidate.parent;
            glbDepth++;
        }
        
        // Remonter la hiérarchie pour trouver l'objet parent qui a des userData
        let current = object;
        let depth = 0;
        
        while (current && depth < maxDepth) {
            // console.log(`🔍 Checking object at depth ${depth}:`, {
            //     name: current.name,
            //     type: current.type,
            //     userData: current.userData,
            //     userDataKeys: Object.keys(current.userData || {}),
            //     hasParent: !!current.parent,
            //     id: current.userData?.id || current.userData?.elementId || current.name,
            //     allUserDataProps: current.userData
            // });
            
            // 🎯 PRIORITÉ: Chercher les éléments avec des IDs valides d'abord
            const hasValidId = (current.userData?.id && typeof current.userData.id === 'string' && current.userData.id.startsWith('element_')) || 
                             (current.userData?.elementId && typeof current.userData.elementId === 'string' && current.userData.elementId.startsWith('element_')) ||
                             (current.name && typeof current.name === 'string' && current.name.startsWith('element_')) ||
                             (current.userData?.element?.elementId && typeof current.userData.element.elementId === 'string' && current.userData.element.elementId.startsWith('element_')) ||
                             (current.userData?.element?.id && typeof current.userData.element.id === 'string' && current.userData.element.id.startsWith('element_')) ||
                             // Support pour les éléments GLB
                             (current.userData?.element?.isGLB) ||
                             (current.isGLBModel);
            
            // 🔧 NOUVEAUTÉ: Vérifier les cotations et éléments spécialisés
            const isMeasurement = current.userData?.measurementId !== undefined || 
                                current.userData?.measurementType || 
                                current.userData?.toolType === 'measurement';
                                
            const isAnnotation = current.userData?.annotationId !== undefined || 
                               current.userData?.annotationType || 
                               current.userData?.toolType === 'annotation';
                               
            const isTextLeader = current.userData?.textLeaderId !== undefined || 
                               current.userData?.textLeaderType || 
                               current.userData?.toolType === 'textleader';
            
            const hasValidType = current.userData?.type === 'brick' || 
                               current.userData?.type === 'block' || 
                               current.userData?.type === 'insulation' ||
                               current.userData?.type === 'joint' ||
                               current.userData?.isBrick ||
                               current.userData?.isBlock ||
                               (current.userData?.element?.type === 'brick') ||
                               (current.userData?.element?.type === 'block') ||
                               (current.userData?.element?.type === 'insulation');
            
            // Nouvelle vérification : vérifier si les userData contiennent des propriétés d'élément
            const hasElementProperties = current.userData && (
                current.userData.hasOwnProperty('id') ||
                current.userData.hasOwnProperty('elementId') ||
                current.userData.hasOwnProperty('type') ||
                current.userData.hasOwnProperty('isBrick') ||
                current.userData.hasOwnProperty('isBlock') ||
                current.userData.hasOwnProperty('material') ||
                current.userData.hasOwnProperty('dimensions') ||
                (current.userData.element && (
                    current.userData.element.hasOwnProperty('elementId') ||
                    current.userData.element.hasOwnProperty('id') ||
                    current.userData.element.hasOwnProperty('type')
                ))
            );
            
            // 🎯 PRIORITÉ MAXIMALE: Éléments avec ID valide
            if (hasValidId) {
                // console.log('✅ Found valid element with ID:', {
                //     id: current.userData?.elementId || current.userData?.id || current.userData?.element?.elementId || current.name,
                //     type: current.userData?.type || current.userData?.element?.type,
                //     userData: current.userData,
                //     reason: 'validId'
                // });
                return current;
            }
            
            // 🔧 NOUVEAUTÉ: PRIORITÉ HAUTE pour les cotations, annotations et textes
            if (isMeasurement) {
                console.log('✅ Found measurement element:', {
                    measurementId: current.userData?.measurementId,
                    measurementType: current.userData?.measurementType,
                    toolType: current.userData?.toolType,
                    userData: current.userData
                });
                return current;
            }
            
            if (isAnnotation) {
                console.log('✅ Found annotation element:', {
                    annotationId: current.userData?.annotationId,
                    annotationType: current.userData?.annotationType,
                    toolType: current.userData?.toolType,
                    userData: current.userData
                });
                return current;
            }
            
            if (isTextLeader) {
                console.log('✅ Found text leader element:', {
                    textLeaderId: current.userData?.textLeaderId,
                    textLeaderType: current.userData?.textLeaderType,
                    toolType: current.userData?.toolType,
                    userData: current.userData
                });
                return current;
            }
            
            // PRIORITÉ SECONDAIRE: Type valide
            if (hasValidType) {
                // console.log('✅ Found valid element with type:', {
                //     id: current.userData?.elementId || current.userData?.id || current.name,
                //     type: current.userData?.type || current.userData?.element?.type,
                //     userData: current.userData,
                //     reason: 'validType'
                // });
                return current;
            }
            
            // PRIORITÉ TERTIAIRE: Propriétés d'élément
            if (hasElementProperties) {
                // console.log('✅ Found valid element with properties:', {
                //     id: current.userData?.elementId || current.userData?.id || current.name,
                //     type: current.userData?.type,
                //     userData: current.userData,
                //     reason: 'elementProperties'
                // });
                return current;
            }
            
            current = current.parent;
            depth++;
        }
        
        // console.log('❌ No valid element found in hierarchy');
        return null;
    }
    
    handleElementInteraction(element, clickPoint) {
        // console.log('🎯 Handling element interaction:', this.currentTool, element.userData);
        
        switch(this.currentTool) {
            case 'move':
                this.handleMoveElement(element, clickPoint);
                break;
            case 'delete':
                this.handleDeleteElement(element);
                break;
            case 'duplicate':
                this.handleDuplicateElement(element);
                break;
        }
    }
    
    handleMoveElement(element, clickPoint) {
        // Un seul clic - sélectionner l'élément et activer directement le mode placement
        this.selectedElement = element;
        this.highlightElement(element);
        this.showInstruction('Cliquez sur une nouvelle position pour placer l\'élément');
        this.activatePlacementMode(element);
    }
    
    handleDeleteElement(element) {
        // console.log('🗑️ Starting delete element process:', element);
        
        // 🛡️ PROTECTION: Vérifier si l'élément peut être supprimé
        if (!this.canDeleteElement(element)) {
            console.log('🛡️ Element deletion blocked by protection rules');
            this.showTemporaryMessage('⚠️ Cet élément ne peut pas être supprimé');
            return;
        }
        
        console.log('🗑️ Element can be deleted, proceeding...');
        
        const elementType = element.userData.type || 'élément';
        
        // 🔧 CORRECTION: Chercher l'ID dans plusieurs endroits possibles
        let elementId = element.userData.elementId || 
                       element.userData.id || 
                       element.name || 
                       (element.userData.element && element.userData.element.elementId) ||
                       (element.userData.element && element.userData.element.id) ||
                       element.elementId ||
                       element.id ||
                       'inconnu';
        
        console.log('🗑️ Attempting to delete:', { 
            type: elementType, 
            id: elementId, 
            userData: element.userData,
            userDataKeys: Object.keys(element.userData || {}),
            isGLBModel: element.isGLBModel,
            elementName: element.name
        });
        
        // Trouver les joints associés
        const associatedJoints = this.findAssociatedJoints(element);
        const jointCount = associatedJoints.length;
        
        // Suppression directe sans confirmation
        const confirmation = true; // Désactivé pour un workflow plus fluide
        
        if (confirmation) {
            // console.log('🗑️ Direct deletion without confirmation');
            
            try {
                // Supprimer l'élément principal et ses wireframes
                if (element.parent) {
                    // console.log('🗑️ Removing main element from Three.js scene');
                    
                    // Nettoyer les wireframes associés aux éléments GLB
                    if (element.isGLBModel || element.userData?.isGLB) {
                        element.traverse((child) => {
                            if (child.userData && child.userData.isWireframe) {
                                console.log('🗑️ Removing wireframe:', child);
                                if (child.parent) {
                                    child.parent.remove(child);
                                }
                                if (child.geometry) child.geometry.dispose();
                                if (child.material) child.material.dispose();
                            }
                        });
                    }
                    
                    element.parent.remove(element);
                }
                
                // Supprimer les joints associés
                associatedJoints.forEach((joint, index) => {
                    // console.log(`🗑️ Removing associated joint ${index + 1}/${jointCount}:`, joint.userData);
                    if (joint.parent) {
                        joint.parent.remove(joint);
                    }
                    
                    // Supprimer le joint des managers
                    const jointId = joint.userData.elementId || joint.userData.id || joint.name;
                    this.removeElementFromManagers(joint, jointId);
                });
                
                // Supprimer l'élément principal des managers
                this.removeElementFromManagers(element, elementId);
                
                this.hideInstruction();
                const message = jointCount > 0 
                    ? `${elementType} et ${jointCount} joints supprimés`
                    : `${elementType} supprimé(e)`;
                this.showTemporaryMessage(message);
                // console.log(`✅ Element deletion completed: 1 element + ${jointCount} joints`);
                
                // 🔄 RETOUR AUTOMATIQUE: Revenir en mode pose de brique après suppression
                this.returnToSelectMode();
                
            } catch (error) {
                // console.error('❌ Error during element deletion:', error);
                this.showTemporaryMessage('Erreur lors de la suppression');
            }
        } else {
            // console.log('🗑️ User cancelled deletion');
        }
    }
    
    removeElementFromManagers(element, elementId) {
        console.log('🗑️ Removing element from managers:', {elementId, element});
        
        // 🔧 NOUVEAUTÉ: Traiter les IDs spéciaux des cotations/mesures
        const userData = element.userData || {};
        let actualId = elementId;
        
        // Si c'est une cotation avec measurementId, utiliser cet ID
        if (userData.measurementId !== undefined) {
            actualId = userData.measurementId;
            console.log('🔧 Using measurementId for deletion:', actualId);
        }
        // Si c'est une annotation avec annotationId, utiliser cet ID  
        else if (userData.annotationId !== undefined) {
            actualId = userData.annotationId;
            console.log('🔧 Using annotationId for deletion:', actualId);
        }
        // Si c'est un texte avec textLeaderId, utiliser cet ID
        else if (userData.textLeaderId !== undefined) {
            actualId = userData.textLeaderId;
            console.log('🔧 Using textLeaderId for deletion:', actualId);
        }
        
        // Supprimer des managers spécifiques
        this.removeFromManagers(element);
        
        // Essayer de supprimer du SceneManager si disponible
        if (window.sceneManager && typeof window.sceneManager.removeElementById === 'function') {
            console.log('🗑️ Removing from SceneManager:', elementId);
            window.sceneManager.removeElementById(elementId);
        }
        
        // Essayer de supprimer de l'AssiseManager si disponible
        if (window.assiseManager && typeof window.assiseManager.removeElementById === 'function') {
            console.log('🗑️ Removing from AssiseManager:', elementId);
            window.assiseManager.removeElementById(elementId);
        }
        
        // 🔧 NOUVEAUTÉ: Supprimer des managers spécialisés pour les outils
        // MeasurementTool / MeasurementAnnotationManager
        if (window.MeasurementTool && typeof window.MeasurementTool.removeMeasurement === 'function') {
            console.log('🗑️ Trying to remove from MeasurementTool:', actualId);
            try {
                window.MeasurementTool.removeMeasurement(actualId);
            } catch (error) {
                console.log('🗑️ MeasurementTool removal failed, trying alternative methods');
            }
        }
        
        if (window.measurementTool && typeof window.measurementTool.removeMeasurement === 'function') {
            console.log('🗑️ Trying to remove from measurementTool:', actualId);
            try {
                window.measurementTool.removeMeasurement(actualId);
            } catch (error) {
                console.log('🗑️ measurementTool removal failed');
            }
        }
        
        // AnnotationTool
        if (window.AnnotationTool && typeof window.AnnotationTool.removeAnnotation === 'function') {
            console.log('🗑️ Trying to remove from AnnotationTool:', actualId);
            try {
                window.AnnotationTool.removeAnnotation(actualId);
            } catch (error) {
                console.log('🗑️ AnnotationTool removal failed');
            }
        }
        
        if (window.annotationTool && typeof window.annotationTool.removeAnnotation === 'function') {
            console.log('🗑️ Trying to remove from annotationTool:', actualId);
            try {
                window.annotationTool.removeAnnotation(actualId);
            } catch (error) {
                console.log('🗑️ annotationTool removal failed');
            }
        }
        
        // TextLeaderTool
        if (window.TextLeaderTool && typeof window.TextLeaderTool.removeTextLeader === 'function') {
            console.log('🗑️ Trying to remove from TextLeaderTool:', actualId);
            try {
                window.TextLeaderTool.removeTextLeader(actualId);
            } catch (error) {
                console.log('🗑️ TextLeaderTool removal failed');
            }
        }
        
        if (window.textLeaderTool && typeof window.textLeaderTool.removeTextLeader === 'function') {
            console.log('🗑️ Trying to remove from textLeaderTool:', actualId);
            try {
                window.textLeaderTool.removeTextLeader(actualId);
            } catch (error) {
                console.log('🗑️ textLeaderTool removal failed');
            }
        }
        
        // MeasurementAnnotationManager - manager global
        if (window.MeasurementAnnotationManager && typeof window.MeasurementAnnotationManager.removeElement === 'function') {
            console.log('🗑️ Trying to remove from MeasurementAnnotationManager:', actualId);
            try {
                window.MeasurementAnnotationManager.removeElement(actualId);
            } catch (error) {
                console.log('🗑️ MeasurementAnnotationManager removal failed');
            }
        }
        
        // 🔧 MÉTHODE DIRECTE: Suppression Three.js forcée si l'élément est encore dans la scène
        if (element.parent) {
            console.log('🗑️ Force removing from Three.js scene');
            element.parent.remove(element);
        }
        
        // Nettoyer les références globales si elles existent
        if (window.elements && Array.isArray(window.elements)) {
            const index = window.elements.findIndex(e => e.id === elementId || e.elementId === elementId);
            if (index !== -1) {
                // console.log('🗑️ Removing from global elements array:', elementId);
                window.elements.splice(index, 1);
            }
        }
    }
    
    handleDuplicateElement(element) {
        // console.log('📋 Duplicating element:', element.userData);
        
        try {
            // 🔧 RÉCUPÉRATION DU WALLELEMENT: Récupérer le vrai WallElement depuis SceneManager
            let wallElement = null;
            let elementId = null;
            
            // Rechercher l'ID de l'élément dans les différentes structures possibles
            if (element.userData) {
                elementId = element.userData.elementId || 
                           element.userData.id ||
                           (element.userData.element && element.userData.element.elementId) ||
                           (element.userData.element && element.userData.element.id) ||
                           element.name;
            }
            
            // Récupérer le WallElement depuis SceneManager
            if (elementId && window.SceneManager && window.SceneManager.elements) {
                wallElement = window.SceneManager.elements.get(elementId);
                /*
                console.log('📋 WallElement récupéré depuis SceneManager:', {
                    elementId: elementId,
                    found: !!wallElement,
                    wallElementType: wallElement?.constructor?.name
                });
                */
            }
            
            // Si on n'a pas trouvé le WallElement, utiliser l'élément mesh original comme fallback
            const elementToUse = wallElement || element;
            
            console.log('📋 Élément à dupliquer:', {
                isWallElement: elementToUse instanceof WallElement,
                hasPosition: !!elementToUse.position,
                hasDimensions: !!elementToUse.dimensions,
                elementId: elementToUse.id || elementId
            });
            // Trouver les joints associés - utiliser toujours le mesh original pour cette méthode
            const associatedJoints = this.findAssociatedJoints(element);
            const jointCount = associatedJoints.length;
            
            // 🔧 CORRECTION: Créer un nouveau WallElement complet au lieu de juste cloner le mesh
            let clonedElement;
            
            // Déterminer le décalage AVANT la duplication pour éviter les chevauchements
            const offset = 10; // 10 cm de décalage
            const originalPosition = elementToUse.position;
            const newPosition = {
                x: originalPosition.x + offset,
                y: originalPosition.y,
                z: originalPosition.z + offset
            };
            
            if (elementToUse instanceof WallElement) {
                // Élément standard WallElement - créer une copie complète
                clonedElement = new WallElement({
                    type: elementToUse.type,
                    material: elementToUse.material,
                    x: newPosition.x,
                    y: newPosition.y,
                    z: newPosition.z,
                    length: elementToUse.dimensions.length,
                    width: elementToUse.dimensions.width,
                    height: elementToUse.dimensions.height,
                    rotation: elementToUse.rotation
                });
                
                // Copier les propriétés supplémentaires
                if (elementToUse.cutType) clonedElement.cutType = elementToUse.cutType;
                if (elementToUse.elementType) clonedElement.elementType = elementToUse.elementType;
                if (elementToUse.specificType) clonedElement.specificType = elementToUse.specificType;
                
                console.log('📋 Élément WallElement dupliqué avec dimensions complètes:', {
                    id: clonedElement.id,
                    position: clonedElement.position,
                    dimensions: clonedElement.dimensions
                });
                
            } else if (element.userData) {
                // Élément avec userData - reconstruire un WallElement depuis les métadonnées
                let elementData = element.userData;
                
                // Si les données sont dans userData.element
                if (elementData.element) {
                    elementData = elementData.element;
                }
                
                console.log('📋 Reconstruction WallElement depuis userData:', elementData);
                
                clonedElement = new WallElement({
                    type: elementData.type || 'brick',
                    material: elementData.material || 'standard',
                    x: newPosition.x,
                    y: newPosition.y,
                    z: newPosition.z,
                    length: elementData.dimensions?.length || originalPosition.length || 19,
                    width: elementData.dimensions?.width || originalPosition.width || 9,
                    height: elementData.dimensions?.height || originalPosition.height || 6.5,
                    rotation: elementData.rotation || elementToUse.rotation || 0
                });
                
                console.log('📋 Élément WallElement reconstruit depuis userData:', {
                    id: clonedElement.id,
                    position: clonedElement.position,
                    dimensions: clonedElement.dimensions
                });
            } else {
                // Fallback - cloner le mesh seulement (ancienne méthode)
                console.warn('📋 Fallback: clonage de mesh seulement pour élément sans structure WallElement');
                clonedElement = element.clone();
                clonedElement.position.set(newPosition.x, newPosition.y, newPosition.z);
                
                // Générer un nouvel ID
                if (clonedElement.userData) {
                    clonedElement.userData = { ...clonedElement.userData };
                    clonedElement.userData.elementId = this.generateId();
                    if (clonedElement.userData.id) {
                        clonedElement.userData.id = clonedElement.userData.elementId;
                    }
                }
            }
            
            // 📍 CORRECTION POINTS D'ACCROCHE: Ajouter l'élément dupliqué à la scène via addElement
            // Ceci garantit que l'élément sera correctement enregistré pour les points d'accroche
            if (clonedElement instanceof WallElement) {
                // Utiliser addElement qui va correctement enregistrer l'élément
                if (window.SceneManager && typeof window.SceneManager.addElement === 'function') {
                    console.log('📋 Ajout du WallElement dupliqué via SceneManager.addElement');
                    // Ne pas appeler addElement car il ajoutera le mesh à la scène
                    // Au lieu de ça, juste ajouter aux collections
                    window.SceneManager.elements.set(clonedElement.id, clonedElement);
                    clonedElement.mesh.castShadow = true;
                    clonedElement.mesh.receiveShadow = true;
                    window.SceneManager.scene.add(clonedElement.mesh);
                } else {
                    console.warn('📋 SceneManager.addElement non disponible');
                }
            } else {
                // Pour les éléments non-WallElement, ajouter le mesh directement
                if (element.parent) {
                    element.parent.add(clonedElement);
                }
            }
            
            // console.log(`📋 Main element duplicated. Now duplicating ${jointCount} associated joints...`);
            
            // Dupliquer les joints associés
            const clonedJoints = [];
            associatedJoints.forEach((joint, index) => {
                // console.log(`📋 Duplicating joint ${index + 1}/${jointCount}:`, joint.userData);
                
                const clonedJoint = joint.clone();
                
                // Calculer le décalage relatif pour le joint
                const originalJointPosition = joint.position.clone();
                const originalElementPosition = new THREE.Vector3(originalPosition.x, originalPosition.y, originalPosition.z);
                const offsetFromOriginal = originalJointPosition.clone().sub(originalElementPosition);
                const newElementPosition = new THREE.Vector3(newPosition.x, newPosition.y, newPosition.z);
                const newJointPosition = newElementPosition.clone().add(offsetFromOriginal);
                
                clonedJoint.position.copy(newJointPosition);
                
                // Générer un nouvel ID pour le joint
                if (clonedJoint.userData) {
                    clonedJoint.userData = { ...clonedJoint.userData };
                    clonedJoint.userData.elementId = this.generateId();
                    if (clonedJoint.userData.id) {
                        clonedJoint.userData.id = clonedJoint.userData.elementId;
                    }
                    // 🔗 IMPORTANT: Associer le joint dupliqué au nouvel élément
                    if (clonedElement instanceof WallElement) {
                        clonedJoint.userData.parentElementId = clonedElement.id;
                    } else if (clonedElement.userData && clonedElement.userData.elementId) {
                        clonedJoint.userData.parentElementId = clonedElement.userData.elementId;
                    }
                    // console.log(`🔗 Joint dupliqué associé au nouvel élément: ${clonedJoint.userData.parentElementId}`);
                }
                
                // Ajouter le joint à la scène
                if (joint.parent) {
                    joint.parent.add(clonedJoint);
                }
                
                clonedJoints.push(clonedJoint);
                
                // Ajouter le joint aux managers
                this.addToManagers(clonedJoint);
            });
            
            // Ajouter l'élément principal aux managers
            this.addToManagers(clonedElement);
            
            // 📍 ACTUALISATION DES POINTS D'ACCROCHE: Forcer la collecte des nouveaux points
            // Ceci garantit que l'élément dupliqué sera pris en compte pour les cotations
            if (window.MeasurementTool && typeof window.MeasurementTool.collectSnapPoints === 'function') {
                setTimeout(() => {
                    // console.log('📍 Actualisation des points d\'accroche après duplication');
                    window.MeasurementTool.collectSnapPoints();
                }, 100); // Petit délai pour s'assurer que l'ajout est complet
            }
            
            if (window.TextLeaderTool && typeof window.TextLeaderTool.collectSnapPoints === 'function') {
                setTimeout(() => {
                    // console.log('📍 Actualisation des points d\'accroche TextLeaderTool après duplication');
                    window.TextLeaderTool.collectSnapPoints();
                }, 100);
            }
            
            this.hideInstruction();
            const message = jointCount > 0 
                ? `Élément et ${jointCount} joints dupliqués`
                : 'Élément dupliqué';
            this.showTemporaryMessage(message);
            
            // console.log(`✅ Duplication completed: 1 element + ${jointCount} joints`);
            
            // 🔄 RETOUR AUTOMATIQUE: Revenir en mode pose de brique après duplication
            setTimeout(() => {
                this.returnToSelectMode();
            }, 1500); // Délai pour laisser le temps de voir le message
            
        } catch (error) {
            console.error('❌ Error duplicating element:', error);
            this.showTemporaryMessage('Erreur lors de la duplication');
        }
    }
    
    activatePlacementMode(element) {
        const canvas = document.getElementById('threejs-canvas');
        if (!canvas) return;
        
        // console.log('🎯 Activating placement mode for element:', element.userData);
        canvas.style.cursor = 'crosshair';
        
        // Trouver les joints associés avant le déplacement
        const associatedJoints = this.findAssociatedJoints(element);
        const jointCount = associatedJoints.length;
        const originalPosition = element.position.clone();
        
        // Calculer les positions relatives des joints par rapport à l'élément principal
        const jointRelativePositions = associatedJoints.map(joint => ({
            joint: joint,
            relativePosition: joint.position.clone().sub(originalPosition)
        }));
        
        // console.log(`🎯 Found ${jointCount} joints to move with the element`);
        
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const scene = window.SceneManager?.scene;
        const camera = window.SceneManager?.camera;
        
        if (!scene || !camera) {
            // console.log('❌ Scene or camera not available for placement');
            return;
        }
        
        const placeElement = (event) => {
            // console.log('🎯 Placement click detected');
            event.preventDefault();
            event.stopPropagation();
            
            const rect = canvas.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            raycaster.setFromCamera(mouse, camera);
            
            // Essayer plusieurs méthodes pour trouver une position valide
            let newPosition = null;
            
            // Méthode 1: Intersection avec le sol (plan Y=0)
            const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const groundIntersection = new THREE.Vector3();
            
            if (raycaster.ray.intersectPlane(groundPlane, groundIntersection)) {
                // console.log('🎯 Ground intersection found:', groundIntersection);
                
                // Maintenir la hauteur Y actuelle de l'élément
                newPosition = new THREE.Vector3(
                    groundIntersection.x,
                    element.position.y, // Garder la même hauteur
                    groundIntersection.z
                );
            }
            
            // Méthode 2: Si pas d'intersection avec le sol, utiliser les objets existants
            if (!newPosition) {
                const intersects = raycaster.intersectObjects(scene.children, true);
                const validIntersects = intersects.filter(intersect => {
                    const obj = intersect.object;
                    return obj.type === 'Mesh' && obj !== element && 
                           obj.type !== 'GridHelper' && obj.type !== 'AxesHelper';
                });
                
                if (validIntersects.length > 0) {
                    const intersectionPoint = validIntersects[0].point;
                    // console.log('🎯 Object intersection found:', intersectionPoint);
                    
                    newPosition = new THREE.Vector3(
                        intersectionPoint.x,
                        element.position.y, // Garder la même hauteur
                        intersectionPoint.z
                    );
                }
            }
            
            // Méthode 3: Dernière option - calculer position basée sur la direction du rayon
            if (!newPosition) {
                const direction = raycaster.ray.direction.clone();
                const origin = raycaster.ray.origin.clone();
                
                // Calculer intersection à une distance raisonnable
                const distance = 50; // 50 cm de distance
                newPosition = origin.add(direction.multiplyScalar(distance));
                newPosition.y = element.position.y; // Garder la même hauteur
                
                // console.log('🎯 Calculated position from ray:', newPosition);
            }
            
            if (newPosition) {
                // console.log('🎯 Moving element from', element.position, 'to', newPosition);
                
                // Mettre à jour la position de l'élément principal
                element.position.copy(newPosition);
                
                // Déplacer les joints associés en maintenant leurs positions relatives
                jointRelativePositions.forEach(({ joint, relativePosition }, index) => {
                    const newJointPosition = newPosition.clone().add(relativePosition);
                    // console.log(`🔗 Moving associated joint ${index + 1}/${jointCount} to:`, newJointPosition);
                    joint.position.copy(newJointPosition);
                    
                    // Mettre à jour le joint dans les managers
                    const jointId = joint.userData.elementId || joint.userData.id;
                    if (jointId) {
                        this.updateElementInManagers(joint, jointId, newJointPosition);
                    }
                });
                
                // Mettre à jour l'élément principal dans les managers
                const elementId = element.userData.elementId || element.userData.id;
                if (elementId) {
                    this.updateElementInManagers(element, elementId, newPosition);
                }
                
                // console.log(`✅ Element and ${jointCount} joints moved successfully`);
                const message = jointCount > 0 
                    ? `Élément et ${jointCount} joints déplacés`
                    : 'Élément déplacé';
                this.showTemporaryMessage(message);
                
                // 🔄 RETOUR AUTOMATIQUE: Revenir en mode pose de brique après déplacement
                setTimeout(() => {
                    this.returnToSelectMode();
                }, 1500); // Délai pour laisser le temps de voir le message
            } else {
                // console.log('❌ Could not find valid position for placement');
                this.showTemporaryMessage('Impossible de placer l\'élément ici');
            }
            
            // Réinitialiser
            canvas.style.cursor = 'default';
            canvas.removeEventListener('click', placeElement, true);
            this.hideInstruction();
            this.resetSelection();
        };
        
        // Utiliser capture pour intercepter avant les autres handlers
        canvas.addEventListener('click', placeElement, true);
        
        // console.log('🎯 Placement mode activated, waiting for click...');
    }
    
    updateElementInManagers(element, elementId, newPosition) {
        // Mettre à jour dans les managers si nécessaire
        this.updateInManagers(element);
        
        // Mettre à jour dans AssiseManager si c'est une brique
        if (window.assiseManager && element.userData.type === 'brick') {
            // console.log('🎯 Updating position in AssiseManager');
            // Ne pas changer l'assise, juste la position X,Z
            window.assiseManager.updateElementPosition(elementId, newPosition);
        }
        
        // Mettre à jour dans SceneManager
        if (window.SceneManager && typeof window.SceneManager.updateElementPosition === 'function') {
            // console.log('🎯 Updating position in SceneManager');
            window.SceneManager.updateElementPosition(elementId, newPosition);
        }
    }
    
    highlightElement(element) {
        // Effacer les surbrillances précédentes
        this.clearHighlights();
        
        // Ajouter une surbrillance
        if (element.material) {
            // Sauvegarder l'état original
            element.userData.originalEmissive = element.material.emissive ? 
                element.material.emissive.clone() : new THREE.Color(0x000000);
            
            // Appliquer la surbrillance
            element.material.emissive = new THREE.Color(0x0066ff);
        }
    }
    
    clearHighlights() {
        if (this.selectedElement && this.selectedElement.material) {
            if (this.selectedElement.userData.originalEmissive) {
                this.selectedElement.material.emissive = this.selectedElement.userData.originalEmissive;
            }
        }
    }
    
    resetSelection() {
        this.clearHighlights();
        this.selectedElement = null;
    }
    
    returnToSelectMode() {
        // Réactiver le bouton de sélection
        this.toolButtons.forEach(btn => btn.classList.remove('active'));
        const selectButton = document.getElementById('selectTool');
        if (selectButton) {
            selectButton.classList.add('active');
        }
        
        // Changer l'état interne
        this.currentTool = 'select';
        this.isToolActive = false;
        
        // Réactiver le placement normal
        this.enableNormalPlacement();
        
        // console.log('🔄 Returned to select mode after deletion');
    }
    
    // Méthodes pour gérer l'intégration avec les managers existants
    removeFromManagers(element) {
        // Essayer de supprimer des différents managers
        if (window.sceneManager && typeof window.sceneManager.removeElement === 'function') {
            window.sceneManager.removeElement(element);
        }
        
        if (window.assiseManager && typeof window.assiseManager.removeElement === 'function') {
            window.assiseManager.removeElement(element);
        }
    }
    
    findAssociatedJoints(element) {
        // console.log('🔍 Searching for joints associated with element:', element.userData);
        
        const scene = window.SceneManager?.scene;
        if (!scene) return [];
        
        const associatedJoints = [];
        
        // 🔧 CORRECTION: Chercher l'ID dans plusieurs endroits possibles
        let elementId = element.userData.elementId || 
                       element.userData.id || 
                       element.name || 
                       (element.userData.element && element.userData.element.elementId) ||
                       (element.userData.element && element.userData.element.id);
        
        // Si toujours pas d'ID, essayer de le trouver dans les propriétés de l'élément
        if (!elementId && element.elementId) {
            elementId = element.elementId;
        }
        if (!elementId && element.id) {
            elementId = element.id;
        }
        
        // console.log(`🔍 Looking for joints associated with element ID: "${elementId}"`);
        // console.log('🔍 Element userData structure:', JSON.stringify(element.userData, null, 2));
        
        if (!elementId) {
            // console.log('❌ No element ID found - cannot find associated joints');
            return [];
        }
        
        let objectCount = 0;
        let jointCount = 0;
        
        // Parcourir tous les objets de la scène pour trouver les joints associés
        scene.traverse((object) => {
            if (object.type === 'Mesh' && object !== element) {
                objectCount++;
                const userData = object.userData || {};
                const elementData = userData.element || {};
                
                // Vérifier si c'est un joint
                const isJoint = userData.type === 'joint' || 
                               userData.isVerticalJoint === true || 
                               userData.isHorizontalJoint === true ||
                               elementData.type === 'joint' || 
                               elementData.isVerticalJoint === true || 
                               elementData.isHorizontalJoint === true;
                
                if (isJoint) {
                    jointCount++;
                    
                    // 🔧 RECHERCHE EXHAUSTIVE: Chercher parentElementId dans toutes les locations possibles
                    let jointParentId = userData.parentElementId || 
                                       elementData.parentElementId ||
                                       object.parentElementId ||
                                       object.userData?.parentElementId;
                    
                    // 🔧 NOUVEAU: Vérifier dans la structure WallElement si elle existe
                    if (!jointParentId && userData.element && typeof userData.element === 'object') {
                        // Accéder aux propriétés du WallElement
                        const wallElement = userData.element;
                        jointParentId = wallElement.parentElementId || 
                                       wallElement.parentId ||
                                       (wallElement.element && wallElement.element.parentElementId) ||
                                       (wallElement.data && wallElement.data.parentElementId) ||
                                       (wallElement.userData && wallElement.userData.parentElementId);
                        
                        // console.log(`    🔍 Checking WallElement structure:`, {
                        //     wallElement: wallElement,
                        //     parentElementId: wallElement.parentElementId,
                        //     parentId: wallElement.parentId,
                        //     wallElementUserData: wallElement.userData,
                        //     allWallElementProps: Object.keys(wallElement)
                        // });
                        
                        // 🔧 SPÉCIAL: Vérifier dans wallElement.userData qui pourrait contenir parentElementId
                        if (!jointParentId && wallElement.userData) {
                            jointParentId = wallElement.userData.parentElementId;
                            // console.log(`    🔍 Found parentElementId in WallElement.userData: "${jointParentId}"`);
                        }
                    }
                    
                    const jointId = elementData.elementId || userData.elementId || object.name || 'unnamed';
                    
                    // console.log(`🔗 Joint found #${jointCount}: ${jointId}`);
                    // console.log(`    Full object structure:`, object);
                    // console.log(`    userData keys:`, Object.keys(userData));
                    // console.log(`    userData.parentElementId:`, userData.parentElementId);
                    // console.log(`    elementData.parentElementId:`, elementData.parentElementId);
                    // console.log(`    Raw userData:`, userData);
                    
                    // 🔧 Si userData.element existe, l'examiner en détail
                    if (userData.element) {
                        // console.log(`    WallElement details:`, userData.element);
                        // console.log(`    WallElement properties:`, Object.getOwnPropertyNames(userData.element));
                        // console.log(`    WallElement parentElementId:`, userData.element.parentElementId);
                        
                        // Essayer d'accéder aux propriétés internes
                        try {
                            const wallElementData = userData.element;
                            // console.log(`    WallElement internal data:`, {
                            //     id: wallElementData.id,
                            //     elementId: wallElementData.elementId,
                            //     parentElementId: wallElementData.parentElementId,
                            //     parentId: wallElementData.parentId,
                            //     type: wallElementData.type
                            // });
                        } catch (e) {
                            // console.log(`    ❌ Error accessing WallElement data:`, e);
                        }
                    }
                    
                    // console.log(`    Joint parentElementId extracted: "${jointParentId}"`);
                    // console.log(`    Element ID to match: "${elementId}"`);
                    
                    // 🔧 RECHERCHE ALTERNATIVE: Si l'extraction standard échoue, chercher manuellement
                    let foundParentId = null;
                    
                    // Méthode 1: Directement dans userData
                    if (object.userData && object.userData.parentElementId) {
                        foundParentId = object.userData.parentElementId;
                        // console.log(`    ✅ Method 1 found: "${foundParentId}"`);
                    }
                    
                    // Méthode 2: Dans element nested
                    if (!foundParentId && object.userData && object.userData.element && object.userData.element.parentElementId) {
                        foundParentId = object.userData.element.parentElementId;
                        // console.log(`    ✅ Method 2 found: "${foundParentId}"`);
                    }
                    
                    // Méthode 3: Propriété directe sur l'objet
                    if (!foundParentId && object.parentElementId) {
                        foundParentId = object.parentElementId;
                        // console.log(`    ✅ Method 3 found: "${foundParentId}"`);
                    }
                    
                    // 🔧 MÉTHODE 4: Chercher dans WallElement avec différents noms de propriétés
                    if (!foundParentId && object.userData?.element) {
                        const we = object.userData.element;
                        foundParentId = we.parentElementId || we.parentId || we.parent || 
                                       (we.element && we.element.parentElementId) ||
                                       (we.data && we.data.parentElementId) ||
                                       (we.userData && we.userData.parentElementId);
                        if (foundParentId) {
                            // console.log(`    ✅ Method 4 (WallElement) found: "${foundParentId}"`);
                        }
                    }
                    
                    // 🔧 MÉTHODE 5: Chercher spécifiquement dans WallElement.userData
                    if (!foundParentId && object.userData?.element?.userData) {
                        foundParentId = object.userData.element.userData.parentElementId;
                        if (foundParentId) {
                            // console.log(`    ✅ Method 5 (WallElement.userData) found: "${foundParentId}"`);
                        }
                    }
                    
                    const finalParentId = foundParentId || jointParentId;
                    
                    if (finalParentId && finalParentId === elementId) {
                        // console.log(`✅ Joint is directly associated via parentElementId!`);
                        associatedJoints.push(object);
                    } else {
                        // console.log(`❌ Joint is not associated (different parentElementId or no association)`);
                        
                        // 🔧 DEBUG: Essayer de voir pourquoi l'association échoue
                        if (!finalParentId) {
                            // console.log(`    ❌ Reason: No parentElementId found at all`);
                        } else if (finalParentId !== elementId) {
                            // console.log(`    ❌ Reason: parentElementId "${finalParentId}" !== element ID "${elementId}"`);
                        }
                    }
                }
            }
        });
        
        // console.log(`🔍 Traversed ${objectCount} objects, found ${jointCount} joints, ${associatedJoints.length} associated for element "${elementId}"`);
        
        return associatedJoints;
    }
    
    addToManagers(element) {
        // Essayer d'ajouter aux différents managers
        if (window.sceneManager && typeof window.sceneManager.addElement === 'function') {
            window.sceneManager.addElement(element);
        }
        
        if (window.assiseManager && typeof window.assiseManager.addElement === 'function') {
            window.assiseManager.addElement(element);
        }
    }
    
    updateInManagers(element) {
        // Mettre à jour la position dans les managers
        if (window.sceneManager && typeof window.sceneManager.updateElementPosition === 'function') {
            window.sceneManager.updateElementPosition(element);
        }
    }
    
    // Méthodes pour désactiver/activer le placement normal
    disableNormalPlacement() {
        // Désactiver les suggestions de placement
        if (window.constructionTools && typeof window.constructionTools.disablePlacementSuggestions === 'function') {
            window.constructionTools.disablePlacementSuggestions();
        }
    }
    
    enableNormalPlacement() {
        // Réactiver les suggestions de placement
        if (window.constructionTools && typeof window.constructionTools.enablePlacementSuggestions === 'function') {
            window.constructionTools.enablePlacementSuggestions();
        }
    }
    
    // Méthodes d'interface utilisateur
    showInstruction(message) {
        if (this.instructionMessage) {
            this.instructionMessage.textContent = message;
            this.instructionMessage.style.display = 'block';
        }
    }
    
    hideInstruction() {
        if (this.instructionMessage) {
            this.instructionMessage.style.display = 'none';
        }
    }
    
    showTemporaryMessage(message, duration = 2000) {
        this.showInstruction(message);
        setTimeout(() => {
            this.hideInstruction();
        }, duration);
    }
    
    generateId() {
        return 'element_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Méthodes publiques pour l'intégration
    shouldShowAdjacent() {
        return !this.isToolActive && this.currentTool === 'select';
    }
    
    isBlockingNormalInteraction() {
        return this.isToolActive;
    }
    
    getCurrentTool() {
        return this.currentTool;
    }
    
    // 🛡️ Méthode pour vérifier si un élément peut être supprimé
    canDeleteElement(element) {
        console.log('🛡️ Checking if element can be deleted:', {
            hasElement: !!element,
            hasUserData: !!element?.userData,
            elementName: element?.name,
            elementType: element?.type,
            userDataType: element?.userData?.type,
            userDataElementType: element?.userData?.element?.type,
            userDataKeys: Object.keys(element?.userData || {}),
            userData: element?.userData
        });
        
        if (!element || !element.userData) {
            console.log('🛡️ Deletion blocked: No element or userData');
            return false;
        }
        
        const userData = element.userData;
        
        // Éléments système qui ne peuvent pas être supprimés
        const protectedElementTypes = [
            // Sol et éléments de base
            'ground',
            'floor',
            'interaction',
            'WallSim3D_InteractionPlane',
            'WallSim3D_GroundFloor',
            // Éléments de l'interface 3D
            'grid',
            'axis',
            'axes',
            'helper',
            'light',
            'camera',
            'scene',
            // Éléments fantômes
            'ghost',
            'phantom',
            'preview'
        ];
        
        // Vérifier par le name de l'élément
        if (element.name && protectedElementTypes.some(protectedType => 
            element.name.toLowerCase().includes(protectedType.toLowerCase()))) {
            console.log('🛡️ Élément protégé détecté par name:', element.name);
            return false;
        }
        
        // Vérifier par le type dans userData
        if (userData.type && protectedElementTypes.includes(userData.type.toLowerCase())) {
            console.log('🛡️ Élément protégé détecté par type:', userData.type);
            return false;
        }
        
        // Vérifier par la category dans userData
        if (userData.category && protectedElementTypes.includes(userData.category.toLowerCase())) {
            console.log('🛡️ Élément protégé détecté par category:', userData.category);
            return false;
        }
        
        // Vérifier les flags spéciaux
        if (userData.isGround || userData.isSystem || userData.isProtected) {
            console.log('🛡️ Élément protégé détecté par flag:', {
                isGround: userData.isGround,
                isSystem: userData.isSystem,
                isProtected: userData.isProtected
            });
            return false;
        }
        
        // Éléments autorisés à être supprimés
        const deletableTypes = [
            'brick',
            'block', 
            'insulation',
            'linteau',
            'joint',
            'measurement',
            'annotation',
            'textleader',
            // Support pour les éléments GLB
            'imported_model',
            'glb',
            'claveau_beton_12_53'
        ];
        
        // 🔧 CORRECTION MAJEURE: Vérifier spécifiquement les briques WallElement
        // Cas spécial pour les objets WallElement (briques de l'application)
        if (userData.element && userData.element.type === 'brick') {
            console.log('🟢 Brique WallElement autorisée pour suppression:', userData.element.id);
            return true;
        }
        
        // 🔧 SUPPORT GLB: Vérifier spécifiquement les éléments GLB
        if (element.isGLBModel || userData.isGLB || 
            (userData.element && userData.element.isGLB) ||
            element.name?.includes('GLB_') ||
            userData.type === 'imported_model' ||
            (element.type && element.type.includes('claveau'))) {
            console.log('🟢 Élément GLB autorisé pour suppression:', element.name || element.id);
            return true;
        }
        
        // 🔧 NOUVEAUTÉ: Vérifier les éléments de mesure, annotation et texte
        // Cas spécial pour les cotations/mesures avec measurementId
        if (userData.measurementId !== undefined || userData.measurementType || userData.toolType === 'measurement') {
            console.log('🟢 Cotation/Mesure autorisée pour suppression:', userData.measurementId || userData.id);
            return true;
        }
        
        // Cas spécial pour les cotations/mesures
        if (userData.type === 'measurement' || userData.isMeasurement || 
            element.name?.includes('measurement') || element.name?.includes('dimension')) {
            console.log('🟢 Élément de mesure autorisé pour suppression');
            return true;
        }
        
        // Cas spécial pour les annotations avec annotationId
        if (userData.annotationId !== undefined || userData.annotationType || userData.toolType === 'annotation') {
            console.log('🟢 Annotation autorisée pour suppression:', userData.annotationId || userData.id);
            return true;
        }
        
        // Cas spécial pour les annotations
        if (userData.type === 'annotation' || userData.isAnnotation || 
            element.name?.includes('annotation')) {
            console.log('🟢 Annotation autorisée pour suppression');
            return true;
        }
        
        // Cas spécial pour les textes avec textLeaderId
        if (userData.textLeaderId !== undefined || userData.textLeaderType || userData.toolType === 'textleader') {
            console.log('🟢 Texte avec ligne de rappel autorisé pour suppression:', userData.textLeaderId || userData.id);
            return true;
        }
        
        // Cas spécial pour les textes avec lignes de rappel
        if (userData.type === 'textleader' || userData.isTextLeader || 
            element.name?.includes('textleader') || element.name?.includes('text')) {
            console.log('🟢 Texte avec ligne de rappel autorisé pour suppression');
            return true;
        }
        
        // 🔧 DETECTION AVANCÉE: Vérifier les objets Three.js avec des propriétés spécifiques
        // Cas pour les objets qui appartiennent à des groupes spécifiques
        if (element.parent && element.parent.name) {
            const parentName = element.parent.name.toLowerCase();
            if (parentName.includes('measurement') || parentName.includes('annotation') || 
                parentName.includes('textleader') || parentName.includes('dimension')) {
                console.log('🟢 Élément autorisé par groupe parent:', element.parent.name);
                return true;
            }
        }
        
        // Si le type est spécifiquement autorisé, permettre la suppression
        if (userData.type && deletableTypes.includes(userData.type.toLowerCase())) {
            console.log('🟢 Élément autorisé pour suppression par type:', userData.type);
            return true;
        }
        
        // 🔧 DETECTION FLEXIBLE: Vérifier les propriétés personnalisées courantes
        const hasDeleteableProperties = userData.measurementId || userData.annotationId || 
                                       userData.textLeaderId || userData.dimensionId ||
                                       userData.isMeasurement || userData.isAnnotation || 
                                       userData.isTextLeader || userData.isDimension;
        
        if (hasDeleteableProperties) {
            console.log('🟢 Élément autorisé par propriétés spécifiques:', {
                measurementId: userData.measurementId,
                annotationId: userData.annotationId,
                textLeaderId: userData.textLeaderId,
                dimensionId: userData.dimensionId,
                isMeasurement: userData.isMeasurement,
                isAnnotation: userData.isAnnotation,
                isTextLeader: userData.isTextLeader,
                isDimension: userData.isDimension
            });
            return true;
        }
        
        // Si aucun critère de protection n'est trouvé et que l'élément a un ID valide, permettre la suppression
        const hasValidId = userData.elementId || userData.id || element.name;
        if (hasValidId && !element.name?.toLowerCase().includes('ground') && 
            !element.name?.toLowerCase().includes('floor') &&
            !element.name?.toLowerCase().includes('interaction')) {
            console.log('🟢 Élément autorisé pour suppression par ID valide:', hasValidId);
            return true;
        }
        
        console.log('🛡️ Élément bloqué: aucun critère de suppression rempli');
        return false;
    }
    
    // Méthode pour fermer toutes les fenêtres d'aide ouvertes
    closeAllHelpWindows() {
        // Utiliser la fonction globale si disponible
        if (window.closeAllHelpWindows && typeof window.closeAllHelpWindows === 'function') {
            window.closeAllHelpWindows();
            return;
        }
        
        // Fallback si la fonction globale n'est pas disponible
        const helpWindows = document.querySelectorAll('div[style*="position: fixed"][style*="z-index: 99999"]');
        helpWindows.forEach(window => {
            if (window.innerHTML.includes('Aide -') || 
                window.innerHTML.includes('tool-help') ||
                window.innerHTML.includes('Outil de')) {
                window.remove();
                // console.log('🔄 Fenêtre d\'aide fermée lors du changement d\'outil');
            }
        });
        
        const tooltips = document.querySelectorAll('.tooltip, .help-tooltip, .tool-tooltip');
        tooltips.forEach(tooltip => tooltip.remove());
        
        const helpModals = document.querySelectorAll('#help-modal, .help-modal');
        helpModals.forEach(modal => {
            modal.style.display = 'none';
            modal.classList.remove('show');
        });
        
        if (window.helpPatchLastTool) {
            window.helpPatchLastTool = null;
            window.helpPatchLastTime = 0;
        }
    }
}

// Initialiser le gestionnaire de barre d'outils
document.addEventListener('DOMContentLoaded', () => {
    // console.log('🚀 Initializing Toolbar Manager...');
    window.toolbarManager = new ToolbarManager();
});

// Exporter pour utilisation globale
window.ToolbarManager = ToolbarManager;

// Fonction globale pour vérifier si la toolbar bloque les interactions normales
window.isToolbarBlocking = function() {
    return window.toolbarManager && window.toolbarManager.isBlockingNormalInteraction();
};
