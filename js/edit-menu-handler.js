/**
 * Gestionnaire du Menu Édition - WallSim3D
 * Gère toutes les fonctionnalités du menu Édition de la barre supérieure
 * Inclut : Annuler/Rétablir, Copier/Coller, Sélection, Transformation
 */

class EditMenuHandler {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 50; // Limite des étapes d'annulation
        this.clipboard = {
            elements: [],
            type: null,
            timestamp: null
        };
        this.selectedElements = new Set();
        this.isRecording = true; // Pour éviter l'enregistrement d'actions en cascade
        this.transformState = {
            isTransforming: false,
            mode: null, // 'move', 'rotate', 'scale'
            startPosition: null,
            elements: []
        };
        this.init();
    }

    init() {
        // console.log('✂️ Initialisation du gestionnaire de menu Édition...');
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.setupSelectionSystem();
        this.recordInitialState();
    }

    // ===============================================
    // CONFIGURATION DES ÉVÉNEMENTS
    // ===============================================

    setupEventListeners() {
        // Menu Annuler
        this.addMenuListener('undoAction', () => this.undo());
        
        // Menu Rétablir
        this.addMenuListener('redoAction', () => this.redo());
        
        // Menu Copier
        this.addMenuListener('copyAction', () => this.copy());
        
        // Menu Coller
        this.addMenuListener('pasteAction', () => this.paste());
        
        // Menu Supprimer
        this.addMenuListener('deleteAction', () => this.deleteSelected());

        // Écouter les changements de sélection
        document.addEventListener('elementSelected', (e) => {
            this.handleElementSelection(e.detail);
        });

        document.addEventListener('elementDeselected', (e) => {
            this.handleElementDeselection(e.detail);
        });

        // Écouter les changements dans la scène
        document.addEventListener('sceneModified', (e) => {
            if (this.isRecording) {
                this.recordState(e.detail?.action || 'modification');
            }
        });

        // 📝 NOUVEAU: Écouter les changements de scène pour enregistrer automatiquement l'état
        document.addEventListener('sceneChanged', (e) => {
            // console.log(`📨 Événement sceneChanged reçu:`, e.detail);
            if (e.detail && e.detail.action && e.detail.changeType) {
                // Utiliser un délai pour s'assurer que tous les changements sont terminés
                setTimeout(() => {
                    this.recordState(e.detail.action || 'modification');
                }, 150);
            }
        });

        // console.log('📋 Événements du menu Édition configurés');
    }

    addMenuListener(elementId, callback) {
        const element = document.getElementById(elementId);
        if (element) {
            // Supprimer tout listener existant pour éviter les doublons
            element.removeEventListener('click', element._editMenuCallback);
            
            // Créer et stocker le callback
            element._editMenuCallback = (e) => {
                e.preventDefault();
                e.stopPropagation();
                callback();
            };
            
            element.addEventListener('click', element._editMenuCallback);
        } else {
            console.warn(`⚠️ Élément ${elementId} non trouvé`);
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Éviter les conflits avec les champs de texte
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                    case 'c':
                        e.preventDefault();
                        this.copy();
                        break;
                    case 'v':
                        e.preventDefault();
                        this.paste();
                        break;
                    case 'x':
                        e.preventDefault();
                        this.cut();
                        break;
                    case 'a':
                        e.preventDefault();
                        this.selectAll();
                        break;
                    case 'd':
                        e.preventDefault();
                        this.duplicate();
                        break;
                }
            }

            // Touches individuelles
            switch (e.key) {
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    this.deleteSelected();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.deselectAll();
                    break;
            }
        });
        // console.log('⌨️ Raccourcis clavier du menu Édition configurés');
    }

    setupSelectionSystem() {
        // Configuration du système de sélection avancé
        this.selectionBox = null;
        this.isSelecting = false;
        this.selectionStart = null;

        // Écouter les clics pour la sélection
        if (window.SceneManager && window.SceneManager.renderer) {
            const canvas = window.SceneManager.renderer.domElement;
            
            canvas.addEventListener('mousedown', (e) => {
                if (e.ctrlKey && e.button === 0) {
                    this.startBoxSelection(e);
                }
            });

            canvas.addEventListener('mousemove', (e) => {
                if (this.isSelecting) {
                    this.updateBoxSelection(e);
                }
            });

            canvas.addEventListener('mouseup', (e) => {
                if (this.isSelecting) {
                    this.endBoxSelection(e);
                }
            });
        }
    }

    // ===============================================
    // SYSTÈME ANNULER/RÉTABLIR
    // ===============================================

    recordState(actionName = 'action', customData = null) {
        if (!this.isRecording) {
            console.log(`⏸️ Enregistrement désactivé pour: ${actionName}`);
            return;
        }

        if (!window.SceneManager) {
            console.warn(`⚠️ SceneManager non disponible pour enregistrer: ${actionName}`);
            return;
        }

        try {
            // Capturer l'état actuel de la scène
            // console.log(`📝 Enregistrement de l'état: ${actionName}`);
            const sceneData = window.SceneManager.exportScene();
            
            const state = {
                timestamp: Date.now(),
                action: actionName,
                sceneData: sceneData,
                selectedElements: Array.from(this.selectedElements),
                customData: customData
            };

            // Ajouter à la pile d'annulation
            this.undoStack.push(state);
            // console.log(`✅ État ajouté à la pile (taille: ${this.undoStack.length})`);

            // Limiter la taille de la pile
            if (this.undoStack.length > this.maxUndoSteps) {
                this.undoStack.shift();
                console.log(`🗑️ Ancien état supprimé (limite: ${this.maxUndoSteps})`);
            }

            // Vider la pile de rétablissement
            this.redoStack = [];

            this.updateUndoRedoButtons();
            this.updateHistoryUI();
            // console.log(`📝 État enregistré avec succès: ${actionName}`);
            
        } catch (error) {
            console.error(`❌ Erreur lors de l'enregistrement de ${actionName}:`, error);
        }
    }

    recordInitialState() {
        // Attendre que le SceneManager soit prêt
        const tryRecordInitial = () => {
            if (window.SceneManager && typeof window.SceneManager.exportScene === 'function') {
                // console.log('🎯 SceneManager détecté - enregistrement de l\'état initial');
                this.recordState('initial_state');
                return true;
            }
            return false;
        };

        // Essayer immédiatement
        if (!tryRecordInitial()) {
            console.log('⏳ SceneManager pas encore prêt, attente...');
            
            // Réessayer périodiquement
            let attempts = 0;
            const maxAttempts = 50; // 5 secondes max
            const interval = setInterval(() => {
                attempts++;
                if (tryRecordInitial() || attempts >= maxAttempts) {
                    clearInterval(interval);
                    if (attempts >= maxAttempts) {
                        console.warn('⚠️ Timeout - impossible d\'enregistrer l\'état initial');
                    }
                }
            }, 100);
        }
    }

    undo() {
        // Protection stricte contre les appels multiples
        const now = Date.now();
        if (this._lastUndoTime && (now - this._lastUndoTime) < 1500) {
            // console.log(`↶ Annulation ignorée - trop rapide (${now - this._lastUndoTime}ms)`);
            return;
        }
        this._lastUndoTime = now;
        
        // Protection contre les appels multiples rapides
        if (this._undoInProgress) {
            // console.log('↶ Annulation déjà en cours, ignorée');
            return;
        }
        this._undoInProgress = true;
        
        // console.log(`🔍 Debug undo - Stack size: ${this.undoStack.length}, SceneManager exists: ${!!window.SceneManager}`);
        
        if (this.undoStack.length <= 1) {
            this.showNotification('Aucune action à annuler', 'info');
            // console.log('❌ Pas d\'action à annuler - pile trop petite');
            this._undoInProgress = false;
            return;
        }

        if (!window.SceneManager) {
            this.showNotification('Erreur: SceneManager non disponible', 'error');
            console.error('❌ SceneManager non disponible pour l\'annulation');
            this._undoInProgress = false;
            return;
        }

        // console.log('↶ Annulation en cours...');
        this.isRecording = false;

        try {
            // Sauvegarder l'état actuel dans la pile de rétablissement
            const currentState = {
                timestamp: Date.now(),
                action: 'current_state',
                sceneData: window.SceneManager.exportScene(),
                selectedElements: Array.from(this.selectedElements)
            };
            this.redoStack.push(currentState);
            // console.log('✅ État actuel sauvegardé pour redo');

            // Retirer l'état actuel de la pile d'annulation
            this.undoStack.pop();
            
            // Restaurer l'état précédent
            const previousState = this.undoStack[this.undoStack.length - 1];
            // console.log(`🔄 Restauration de l'état: ${previousState.action}`);
            
            this.restoreState(previousState);

            this.isRecording = true;
            this.updateUndoRedoButtons();
            this.updateHistoryUI();
            this.showNotification(`Annulé: ${previousState.action}`, 'success');
            // console.log('✅ Annulation terminée avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'annulation:', error);
            this.showNotification('Erreur lors de l\'annulation', 'error');
            this.isRecording = true;
        } finally {
            // Toujours remettre le flag à false
            this._undoInProgress = false;
        }
    }

    redo() {
        // Protection stricte contre les appels multiples
        const now = Date.now();
        if (this._lastRedoTime && (now - this._lastRedoTime) < 1500) {
            // console.log(`↷ Rétablissement ignoré - trop rapide (${now - this._lastRedoTime}ms)`);
            return;
        }
        this._lastRedoTime = now;
        
        // Protection contre les appels multiples rapides
        if (this._redoInProgress) {
            // console.log('↷ Rétablissement déjà en cours, ignoré');
            return;
        }
        this._redoInProgress = true;
        
        try {
            if (this.redoStack.length === 0) {
                this.showNotification('Aucune action à rétablir', 'info');
                return;
            }

            // console.log('↷ Rétablissement en cours...');
            this.isRecording = false;

            // Restaurer l'état depuis la pile de rétablissement
            const nextState = this.redoStack.pop();
            this.restoreState(nextState);

            // Ajouter l'état restauré à la pile d'annulation
            this.undoStack.push(nextState);

            this.isRecording = true;
            this.updateUndoRedoButtons();
            this.showNotification(`Rétabli: ${nextState.action}`, 'success');
        } finally {
            // Toujours remettre le flag à false
            this._redoInProgress = false;
        }
    }

    restoreState(state) {
        // console.log(`🔄 Début de restauration d'état: ${state.action}`);
        
        if (!state.sceneData) {
            console.warn('⚠️ Pas de données de scène à restaurer');
            return;
        }

        if (!window.SceneManager) {
            console.error('❌ SceneManager non disponible pour la restauration');
            this.showNotification('Erreur: SceneManager non disponible', 'error');
            return;
        }

        try {
            // 🛡️ IMPORTANT: Désactiver temporairement l'ajout automatique de joints
            const originalAutoJoints = window.ConstructionTools?.autoJoints;
            if (window.ConstructionTools) {
                window.ConstructionTools.autoJoints = false;
                // console.log('⏸️ Joints automatiques temporairement désactivés pour restauration');
            }

            // Désactiver également l'enregistrement d'état pendant la restauration
            const wasRecording = this.isRecording;
            this.isRecording = false;

            // Restaurer la scène
            // console.log('🔄 Importation des données de scène...');
            
            // Vérifier si les données de scène sont valides
            if (!state.sceneData || !state.sceneData.elements || state.sceneData.elements.length === 0) {
                // console.log('🔄 État initial vide détecté - nettoyage de la scène');
                // Pour l'état initial vide, on vide simplement la scène
                window.SceneManager.clearAll();
            } else {
                // Import normal avec des données valides
                window.SceneManager.importScene(state.sceneData);
            }
            // console.log('✅ Scène restaurée');

            // Restaurer la sélection
            this.selectedElements.clear();
            if (state.selectedElements && state.selectedElements.length > 0) {
                // console.log(`🔄 Restauration de ${state.selectedElements.length} éléments sélectionnés`);
                state.selectedElements.forEach(elementId => {
                    const element = window.SceneManager.elements.get(elementId);
                    if (element) {
                        this.selectedElements.add(elementId);
                        this.highlightElement(element, true);
                    }
                });
            }

            // 🔄 Restaurer les paramètres originaux
            if (window.ConstructionTools && originalAutoJoints !== undefined) {
                window.ConstructionTools.autoJoints = originalAutoJoints;
                // console.log('🔄 Joints automatiques restaurés:', originalAutoJoints);
            }

            // Restaurer l'enregistrement
            this.isRecording = wasRecording;

            this.updateSelectionDisplay();
            // console.log('✅ État restauré avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de la restauration:', error);
            this.showNotification('Erreur lors de la restauration', 'error');
            
            // S'assurer de restaurer les paramètres en cas d'erreur
            if (window.ConstructionTools && originalAutoJoints !== undefined) {
                window.ConstructionTools.autoJoints = originalAutoJoints;
            }
            this.isRecording = true;
        }
    }

    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoAction');
        const redoBtn = document.getElementById('redoAction');

        // console.log(`🔄 Mise à jour boutons - Undo: ${this.undoStack.length}, Redo: ${this.redoStack.length}`);

        if (undoBtn) {
            const canUndo = this.undoStack.length > 1;
            undoBtn.style.opacity = canUndo ? '1' : '0.5';
            undoBtn.disabled = !canUndo;
            undoBtn.title = canUndo 
                ? `Annuler: ${this.undoStack[this.undoStack.length - 1]?.action || 'action'}`
                : 'Aucune action à annuler';
            // console.log(`🔘 Bouton Undo: ${canUndo ? 'activé' : 'désactivé'}`);
        } else {
            console.warn('⚠️ Bouton undoAction introuvable');
        }
        
        if (redoBtn) {
            const canRedo = this.redoStack.length > 0;
            redoBtn.style.opacity = canRedo ? '1' : '0.5';
            redoBtn.disabled = !canRedo;
            redoBtn.title = canRedo 
                ? `Rétablir: ${this.redoStack[this.redoStack.length - 1]?.action || 'action'}`
                : 'Aucune action à rétablir';
            // console.log(`🔘 Bouton Redo: ${canRedo ? 'activé' : 'désactivé'}`);
        } else {
            console.warn('⚠️ Bouton redoAction introuvable');
        }
    }

    // ===============================================
    // SYSTÈME COPIER/COLLER
    // ===============================================

    copy() {
        // Protection contre les appels multiples rapides
        if (this._copyInProgress) {
            // console.log('📋 Copie déjà en cours, ignorée');
            return;
        }
        this._copyInProgress = true;
        
        setTimeout(() => {
            this._copyInProgress = false;
        }, 500); // Délai de protection de 500ms
        
        // Vérifier d'abord les éléments sélectionnés par le système de sélection multiple
        let elementsToPlay = [];
        
        if (this.selectedElements.size > 0) {
            // Utiliser la sélection multiple
            // console.log(`📋 Copie via sélection multiple: ${this.selectedElements.size} élément(s)`);
            this.selectedElements.forEach(elementId => {
                const element = window.SceneManager?.elements.get(elementId);
                if (element) {
                    elementsToPlay.push(element);
                }
            });
        } else if (window.SceneManager?.selectedElement) {
            // Utiliser l'élément sélectionné par l'outil de sélection du menu latéral
            // console.log(`📋 Copie via outil de sélection: ${window.SceneManager.selectedElement.id}`);
            elementsToPlay.push(window.SceneManager.selectedElement);
        }
        
        if (elementsToPlay.length === 0) {
            this.showNotification('Aucun élément sélectionné', 'warning');
            // console.warn('📋 Copie impossible - aucun élément trouvé dans selectedElements ni dans SceneManager.selectedElement');
            return;
        }

        // Copier les éléments trouvés
        this.clipboard.elements = [];
        this.clipboard.type = 'elements';
        this.clipboard.timestamp = Date.now();

        elementsToPlay.forEach(element => {
            this.clipboard.elements.push(element.toJSON());
        });

        console.log(`📋 ${this.clipboard.elements.length} élément(s) copié(s) dans le presse-papiers`);
        this.showNotification(`${this.clipboard.elements.length} élément(s) copié(s)`, 'success');
        this.updatePasteButton();
        this.showClipboardIndicator('copy');
    }

    cut() {
        // Vérifier les éléments sélectionnés (même logique que copy)
        let hasSelectedElements = this.selectedElements.size > 0 || window.SceneManager?.selectedElement;
        
        if (!hasSelectedElements) {
            this.showNotification('Aucun élément sélectionné', 'warning');
            console.warn('✂️ Coupe impossible - aucun élément sélectionné');
            return;
        }

        console.log(`✂️ Coupe d'élément(s) sélectionné(s)`);
        
        // Enregistrer l'état avant la coupe
        this.recordState('cut');

        // Copier puis supprimer
        this.copy();
        this.deleteSelected(false); // false = ne pas enregistrer l'état (déjà fait)

        this.showNotification(`${this.clipboard.elements.length} élément(s) coupé(s)`, 'success');
    }

    paste() {
        if (!this.clipboard.elements || this.clipboard.elements.length === 0) {
            this.showNotification('Presse-papiers vide', 'warning');
            return;
        }

        console.log(`📋 Collage de ${this.clipboard.elements.length} élément(s)`);
        
        // Enregistrer l'état avant le collage
        this.recordState('paste');

        // Désélectionner tout
        this.deselectAll();

        // Calculer le décalage pour éviter la superposition
        const offset = this.calculatePasteOffset();
        console.log(`📍 Décalage calculé pour le collage: x=${offset.x}, z=${offset.z}`);

        // Coller les éléments
        const pastedElements = [];
        this.clipboard.elements.forEach(elementData => {
            console.log(`🔍 Désérialisation élément:`, elementData);
            const element = window.WallElement ? window.WallElement.fromJSON(elementData) : null;
            if (element && window.SceneManager) {
                // Vérifier que le matériau est correctement défini
                console.log(`🎨 Matériau de l'élément: "${element.material}"`);
                
                // Appliquer le décalage
                element.position.x += offset.x;
                element.position.y += offset.y;
                element.position.z += offset.z;

                // Générer un nouvel ID
                element.id = this.generateUniqueId();

                // CORRECTIF: Forcer la recréation du mesh avec le bon matériau
                console.log(`🔧 Recréation forcée du mesh pour l'élément collé...`);
                
                // Supprimer l'ancien mesh s'il existe
                if (element.mesh) {
                    if (element.mesh.geometry) element.mesh.geometry.dispose();
                    if (element.mesh.material) element.mesh.material.dispose();
                    element.mesh = null;
                }

                // Recréer le mesh
                element.createMesh();
                
                // Double vérification du matériau avec force SOLID
                if (element.mesh && window.MaterialLibrary) {
                    console.log(`🎨 Double vérification matériau: ${element.material}`);
                    const correctMaterial = window.MaterialLibrary.getThreeJSMaterial(element.material);
                    if (correctMaterial) {
                        // FORCER le matériau à être SOLIDE (pas wireframe)
                        correctMaterial.wireframe = false;
                        correctMaterial.needsUpdate = true;
                        element.mesh.material = correctMaterial;
                        element.mesh.material.needsUpdate = true;
                        console.log(`✅ Matériau re-appliqué avec FORCE SOLID`);
                    } else {
                        console.log(`❌ ERREUR: Matériau '${element.material}' non trouvé dans MaterialLibrary`);
                        // Créer un matériau de fallback SOLIDE
                        const fallbackMaterial = new THREE.MeshLambertMaterial({ 
                            color: 0xff0000,
                            wireframe: false,
                            side: THREE.DoubleSide 
                        });
                        element.mesh.material = fallbackMaterial;
                        console.log(`🔧 Matériau fallback SOLIDE appliqué`);
                    }
                } else {
                    console.log(`❌ ERREUR: Mesh ou MaterialLibrary non disponible`);
                }

                // Ajouter à la scène
                window.SceneManager.addElement(element);
                pastedElements.push(element);

                // NE PAS sélectionner automatiquement l'élément collé pour éviter le wireframe
                console.log(`✅ Élément collé: ${element.id} - PAS de sélection automatique`);
            }
        });

        this.updateSelectionDisplay();
        this.showNotification(`${pastedElements.length} élément(s) collé(s)`, 'success');
    }

    duplicate() {
        if (this.selectedElements.size === 0) {
            this.showNotification('Aucun élément sélectionné', 'warning');
            return;
        }

        console.log(`👥 Duplication de ${this.selectedElements.size} élément(s)`);
        
        // Copier puis coller immédiatement
        this.copy();
        this.paste();
    }

    calculatePasteOffset() {
        // Calculer un décalage intelligent pour éviter la superposition
        const gridSpacing = window.SceneManager?.gridSpacing || 10;
        const baseOffset = Math.max(gridSpacing * 3, 25); // Minimum 25cm pour éviter les adjacences automatiques

        // Vérifier s'il y a des éléments dans le presse-papiers pour déterminer leur taille
        if (!this.clipboard.elements || this.clipboard.elements.length === 0) {
            return { x: baseOffset, y: 0, z: baseOffset };
        }

        // Obtenir tous les éléments existants de la scène
        const existingElements = this.getAllSceneElements();
        
        // Calculer la boîte englobante du contenu à coller
        const clipboardBounds = this.calculateClipboardBounds();
        
        // Chercher un espace libre en spirale autour de la position d'origine
        for (let distance = baseOffset; distance <= baseOffset * 10; distance += baseOffset) {
            const testPositions = [
                { x: distance, y: 0, z: 0 },           // droite
                { x: -distance, y: 0, z: 0 },          // gauche  
                { x: 0, y: 0, z: distance },           // avant
                { x: 0, y: 0, z: -distance },          // arrière
                { x: distance, y: 0, z: distance },    // diagonale droite-avant
                { x: -distance, y: 0, z: distance },   // diagonale gauche-avant
                { x: distance, y: 0, z: -distance },   // diagonale droite-arrière
                { x: -distance, y: 0, z: -distance }   // diagonale gauche-arrière
            ];

            for (const offset of testPositions) {
                if (!this.wouldCollideWithExisting(clipboardBounds, offset, existingElements)) {
                    console.log(`📍 Espace libre trouvé à: x=${offset.x}, z=${offset.z}`);
                    return offset;
                }
            }
        }

        // Si aucun espace libre n'est trouvé, utiliser le décalage de base
        console.log('⚠️ Aucun espace libre trouvé, utilisation du décalage de base');
        return { x: baseOffset, y: 0, z: baseOffset };
    }

    getAllSceneElements() {
        // Récupérer tous les éléments de la scène
        const elements = [];
        if (window.SceneManager && window.SceneManager.elements) {
            window.SceneManager.elements.forEach((element) => {
                elements.push(element);
            });
        }
        return elements;
    }

    calculateClipboardBounds() {
        // Calculer la boîte englobante de tous les éléments dans le presse-papiers
        let minX = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxZ = -Infinity;

        this.clipboard.elements.forEach(elementData => {
            const pos = elementData.position;
            const dims = elementData.dimensions;
            
            const halfWidth = dims.width / 2;
            const halfDepth = dims.depth / 2;
            
            minX = Math.min(minX, pos.x - halfWidth);
            maxX = Math.max(maxX, pos.x + halfWidth);
            minZ = Math.min(minZ, pos.z - halfDepth);
            maxZ = Math.max(maxZ, pos.z + halfDepth);
        });

        return {
            minX: minX,
            maxX: maxX,
            minZ: minZ,
            maxZ: maxZ,
            width: maxX - minX,
            depth: maxZ - minZ
        };
    }

    wouldCollideWithExisting(clipboardBounds, offset, existingElements) {
        // Calculer la nouvelle position des éléments du presse-papiers avec l'offset
        const newBounds = {
            minX: clipboardBounds.minX + offset.x,
            maxX: clipboardBounds.maxX + offset.x,
            minZ: clipboardBounds.minZ + offset.z,
            maxZ: clipboardBounds.maxZ + offset.z
        };

        // Ajouter une marge de sécurité pour éviter les adjacences détectées comme collisions
        const safetyMargin = 5; // 5cm de marge minimum

        // Vérifier les collisions avec tous les éléments existants
        for (const element of existingElements) {
            const pos = element.position;
            const dims = element.dimensions;
            
            const elementMinX = pos.x - dims.width / 2 - safetyMargin;
            const elementMaxX = pos.x + dims.width / 2 + safetyMargin;
            const elementMinZ = pos.z - dims.depth / 2 - safetyMargin;
            const elementMaxZ = pos.z + dims.depth / 2 + safetyMargin;

            // Test d'intersection 2D avec marge de sécurité
            const intersectsX = newBounds.maxX >= elementMinX && newBounds.minX <= elementMaxX;
            const intersectsZ = newBounds.maxZ >= elementMinZ && newBounds.minZ <= elementMaxZ;

            if (intersectsX && intersectsZ) {
                console.log(`❌ Collision détectée avec élément ${element.id} à position (${pos.x}, ${pos.z})`);
                return true; // Collision détectée
            }
        }

        return false; // Pas de collision
    }

    updatePasteButton() {
        const pasteBtn = document.getElementById('pasteAction');
        if (pasteBtn) {
            pasteBtn.style.opacity = this.clipboard.elements.length > 0 ? '1' : '0.5';
        }
    }

    // ===============================================
    // SYSTÈME DE SÉLECTION
    // ===============================================

    handleElementSelection(elementInfo) {
        if (elementInfo && elementInfo.id) {
            this.selectedElements.add(elementInfo.id);
            this.updateSelectionDisplay();
        }
    }

    handleElementDeselection(elementInfo) {
        if (elementInfo && elementInfo.id) {
            this.selectedElements.delete(elementInfo.id);
            this.updateSelectionDisplay();
        }
    }

    selectAll() {
        console.log('🔘 Sélection de tous les éléments');
        
        if (window.SceneManager) {
            this.selectedElements.clear();
            window.SceneManager.elements.forEach((element, id) => {
                this.selectedElements.add(id);
                this.highlightElement(element, true);
            });
            
            this.updateSelectionDisplay();
            this.showNotification(`${this.selectedElements.size} élément(s) sélectionné(s)`, 'info');
        }
    }

    deselectAll() {
        console.log('⭕ Désélection de tous les éléments');
        
        if (window.SceneManager) {
            this.selectedElements.forEach(elementId => {
                const element = window.SceneManager.elements.get(elementId);
                if (element) {
                    this.highlightElement(element, false);
                }
            });
        }
        
        this.selectedElements.clear();
        this.updateSelectionDisplay();
    }

    selectInverse() {
        console.log('🔄 Inversion de la sélection');
        
        if (window.SceneManager) {
            const newSelection = new Set();
            
            window.SceneManager.elements.forEach((element, id) => {
                if (this.selectedElements.has(id)) {
                    // Désélectionner
                    this.highlightElement(element, false);
                } else {
                    // Sélectionner
                    newSelection.add(id);
                    this.highlightElement(element, true);
                }
            });
            
            this.selectedElements = newSelection;
            this.updateSelectionDisplay();
            this.showNotification(`${this.selectedElements.size} élément(s) sélectionné(s)`, 'info');
        }
    }

    // ===============================================
    // SÉLECTION PAR BOÎTE
    // ===============================================

    startBoxSelection(event) {
        this.isSelecting = true;
        this.selectionStart = {
            x: event.clientX,
            y: event.clientY
        };

        // Créer la boîte de sélection visuelle
        this.createSelectionBox(event.clientX, event.clientY);
        
        event.preventDefault();
        console.log('📦 Début de sélection par boîte');
    }

    updateBoxSelection(event) {
        if (!this.isSelecting || !this.selectionBox) return;

        const currentX = event.clientX;
        const currentY = event.clientY;
        
        const left = Math.min(this.selectionStart.x, currentX);
        const top = Math.min(this.selectionStart.y, currentY);
        const width = Math.abs(currentX - this.selectionStart.x);
        const height = Math.abs(currentY - this.selectionStart.y);

        this.selectionBox.style.left = left + 'px';
        this.selectionBox.style.top = top + 'px';
        this.selectionBox.style.width = width + 'px';
        this.selectionBox.style.height = height + 'px';
    }

    endBoxSelection(event) {
        if (!this.isSelecting) return;

        this.isSelecting = false;
        
        // Calculer la zone de sélection
        const selectionRect = {
            left: Math.min(this.selectionStart.x, event.clientX),
            top: Math.min(this.selectionStart.y, event.clientY),
            right: Math.max(this.selectionStart.x, event.clientX),
            bottom: Math.max(this.selectionStart.y, event.clientY)
        };

        // Sélectionner les éléments dans la zone
        this.selectElementsInBox(selectionRect);

        // Nettoyer la boîte de sélection
        if (this.selectionBox) {
            this.selectionBox.remove();
            this.selectionBox = null;
        }

        console.log('📦 Fin de sélection par boîte');
    }

    createSelectionBox(x, y) {
        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'selection-box';
        this.selectionBox.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 0;
            height: 0;
            border: 2px dashed #3498db;
            background: rgba(52, 152, 219, 0.1);
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(this.selectionBox);
    }

    selectElementsInBox(rect) {
        if (!window.SceneManager) return;

        let selectedCount = 0;
        
        window.SceneManager.elements.forEach((element, id) => {
            // Convertir la position 3D en position 2D écran
            const screenPos = this.worldToScreen(element.position);
            
            if (screenPos && 
                screenPos.x >= rect.left && 
                screenPos.x <= rect.right &&
                screenPos.y >= rect.top && 
                screenPos.y <= rect.bottom) {
                
                this.selectedElements.add(id);
                this.highlightElement(element, true);
                selectedCount++;
            }
        });

        this.updateSelectionDisplay();
        this.showNotification(`${selectedCount} élément(s) sélectionné(s) par boîte`, 'info');
    }

    // ===============================================
    // SUPPRESSION
    // ===============================================

    deleteSelected(recordState = true) {
        // Protection contre les appels multiples rapides
        if (this._deleteInProgress) {
            // console.log('🗑️ Suppression déjà en cours, ignorée');
            return;
        }
        this._deleteInProgress = true;
        
        setTimeout(() => {
            this._deleteInProgress = false;
        }, 500); // Délai de protection de 500ms
        
        // Vérifier les éléments sélectionnés (même logique que copy)
        let elementsToDelete = [];
        
        if (this.selectedElements.size > 0) {
            // Utiliser la sélection multiple
            // console.log(`🗑️ Suppression via sélection multiple: ${this.selectedElements.size} élément(s)`);
            this.selectedElements.forEach(elementId => {
                if (window.SceneManager?.elements.has(elementId)) {
                    elementsToDelete.push(elementId);
                }
            });
        } else if (window.SceneManager?.selectedElement) {
            // Utiliser l'élément sélectionné par l'outil de sélection du menu latéral
            // console.log(`🗑️ Suppression via outil de sélection: ${window.SceneManager.selectedElement.id}`);
            if (window.SceneManager.elements.has(window.SceneManager.selectedElement.id)) {
                elementsToDelete.push(window.SceneManager.selectedElement.id);
            }
        }
        
        if (elementsToDelete.length === 0) {
            this.showNotification('Aucun élément sélectionné', 'warning');
            // console.warn('🗑️ Suppression impossible - aucun élément sélectionné');
            return;
        }

        if (recordState) {
            this.recordState('delete');
        }

        // Supprimer les éléments trouvés ET leurs joints associés
        let deletedCount = 0;
        let deletedJointsCount = 0;
        
        elementsToDelete.forEach(elementId => {
            // D'abord supprimer les joints associés à cet élément
            const associatedJoints = this.findAssociatedJoints(elementId);
            associatedJoints.forEach(jointId => {
                console.log(`🔗 Suppression du joint associé: ${jointId} (parent: ${elementId})`);
                window.SceneManager.removeElement(jointId);
                deletedJointsCount++;
            });
            
            // Puis supprimer l'élément principal
            console.log(`🗑️ Suppression de l'élément: ${elementId}`);
            window.SceneManager.removeElement(elementId);
            deletedCount++;
        });

        // Nettoyer les sélections
        this.selectedElements.clear();
        if (window.SceneManager.selectedElement) {
            window.SceneManager.selectedElement = null;
        }
        
        this.updateSelectionDisplay();
        
        // Message informatif
        let message = `${deletedCount} élément(s) supprimé(s)`;
        if (deletedJointsCount > 0) {
            message += ` + ${deletedJointsCount} joint(s) associé(s)`;
        }
        this.showNotification(message, 'success');
    }

    // Nouvelle méthode pour trouver les joints associés à un élément
    findAssociatedJoints(parentElementId) {
        const associatedJoints = [];
        
        console.log(`🔍 Recherche des joints pour l'élément parent: ${parentElementId}`);
        
        if (window.SceneManager?.scene) {
            window.SceneManager.scene.traverse((child) => {
                // Vérifier si c'est un joint associé à l'élément parent
                if (child.userData && child.userData.isJoint) {
                    console.log(`🔍 Joint examiné:`, {
                        id: child.userData.element?.id,
                        parentElementId: child.userData.parentElementId,
                        parentElementType: child.userData.parentElementType,
                        isJoint: child.userData.isJoint
                    });
                    
                    // Vérifier si ce joint est lié à notre élément parent
                    if (child.userData.parentElementId === parentElementId && child.userData.element) {
                        console.log(`✅ Joint associé trouvé: ${child.userData.element.id}`);
                        associatedJoints.push(child.userData.element.id);
                    }
                }
            });
        }
        
        // Si aucun joint trouvé dans les userData, essayer une autre approche via SceneManager.elements
        if (associatedJoints.length === 0 && window.SceneManager?.elements) {
            console.log(`🔍 Méthode alternative: recherche dans SceneManager.elements`);
            window.SceneManager.elements.forEach((element, elementId) => {
                // Vérifier si l'élément a des propriétés de joint et est lié à notre parent
                if (element.userData && element.userData.isJoint && 
                    element.userData.parentElementId === parentElementId) {
                    console.log(`✅ Joint trouvé via SceneManager: ${elementId}`);
                    associatedJoints.push(elementId);
                } else if (element.mesh && element.mesh.userData && 
                          element.mesh.userData.isJoint && 
                          element.mesh.userData.parentElementId === parentElementId) {
                    console.log(`✅ Joint trouvé via mesh.userData: ${elementId}`);
                    associatedJoints.push(elementId);
                }
            });
        }
        
        console.log(`🔍 Joints trouvés pour l'élément ${parentElementId}:`, associatedJoints);
        return associatedJoints;
    }

    // ===============================================
    // FONCTIONS UTILITAIRES
    // ===============================================

    worldToScreen(worldPosition) {
        if (!window.SceneManager?.camera || !window.SceneManager?.renderer) return null;

        const vector = worldPosition.clone();
        vector.project(window.SceneManager.camera);

        const canvas = window.SceneManager.renderer.domElement;
        const rect = canvas.getBoundingClientRect();

        return {
            x: (vector.x * 0.5 + 0.5) * canvas.clientWidth + rect.left,
            y: (vector.y * -0.5 + 0.5) * canvas.clientHeight + rect.top
        };
    }

    highlightElement(element, highlight) {
        if (element?.mesh) {
            if (highlight) {
                // Sauvegarder le matériau original s'il n'est pas déjà sauvé
                if (!element.originalMaterial) {
                    element.originalMaterial = element.mesh.material;
                }
                
                // Créer un matériau wireframe temporaire
                const wireframeMaterial = element.mesh.material.clone();
                wireframeMaterial.wireframe = true;
                wireframeMaterial.wireframeLinewidth = 2;
                element.mesh.material = wireframeMaterial;
                
                console.log(`🎯 Élément ${element.id} mis en surbrillance (wireframe)`);
            } else {
                // Restaurer le matériau original
                if (element.originalMaterial) {
                    element.mesh.material = element.originalMaterial;
                    element.originalMaterial = null; // Nettoyer la référence
                    console.log(`✅ Matériau original restauré pour ${element.id}`);
                } else {
                    // Fallback: s'assurer qu'on n'est pas en wireframe
                    element.mesh.material.wireframe = false;
                    console.log(`🔧 Wireframe désactivé pour ${element.id} (fallback)`);
                }
                element.mesh.material.needsUpdate = true;
            }
        }
    }

    updateSelectionDisplay() {
        const count = this.selectedElements.size;
        
        // Mettre à jour l'affichage du nombre d'éléments sélectionnés
        const statusElement = document.getElementById('selectionStatus');
        if (statusElement) {
            if (count > 0) {
                statusElement.innerHTML = `<i class="fas fa-mouse-pointer"></i> ${count} élément(s) sélectionné(s)`;
                statusElement.classList.add('visible');
            } else {
                statusElement.classList.remove('visible');
            }
        }

        // Afficher/masquer les contrôles de transformation
        const transformControls = document.getElementById('transformControls');
        if (transformControls) {
            if (count > 0) {
                transformControls.classList.add('visible');
                this.setupTransformControls();
            } else {
                transformControls.classList.remove('visible');
            }
        }

        // Activer/désactiver les boutons selon la sélection
        this.updateActionButtons(count > 0);
    }

    setupTransformControls() {
        const buttons = ['moveBtn', 'rotateBtn', 'scaleBtn'];
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn && !btn.dataset.listenerAdded) {
                btn.addEventListener('click', (e) => {
                    const mode = btn.dataset.mode;
                    this.setTransformMode(mode);
                });
                btn.dataset.listenerAdded = 'true';
            }
        });
    }

    setTransformMode(mode) {
        // Désactiver tous les modes
        document.querySelectorAll('.transform-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Activer le mode sélectionné
        const activeBtn = document.getElementById(`${mode}Btn`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        this.transformState.mode = mode;
        this.transformState.isTransforming = true;

        this.showNotification(`Mode ${mode} activé`, 'info');
        console.log(`🔧 Mode de transformation: ${mode}`);
    }

    updateActionButtons(hasSelection) {
        const buttons = ['copyAction', 'deleteAction'];
        buttons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.style.opacity = hasSelection ? '1' : '0.5';
            }
        });
    }

    generateUniqueId() {
        return 'element_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    showNotification(message, type = 'info', duration = 3000) {
        // Convertir le message en string et vérifier
        if (message == null) {
            console.warn('⚠️ Notification vide ignorée');
            return;
        }
        
        const messageStr = String(message).trim();
        if (messageStr === '') {
            console.warn('⚠️ Notification vide ignorée');
            return;
        }
        
        // Utiliser le système de notification existant si disponible
        if (window.modernInterface?.showNotification) {
            window.modernInterface.showNotification(messageStr, type, duration);
        } else if (window.FileMenuHandler?.showNotification) {
            window.FileMenuHandler.showNotification(messageStr, type, duration);
        } else {
            console.log(`📢 ${type.toUpperCase()}: ${messageStr}`);
        }
    }

    showClipboardIndicator(action) {
        const indicator = document.createElement('div');
        indicator.className = 'clipboard-indicator';
        indicator.innerHTML = `
            <i class="icon-${action}"></i>
            <span>${action === 'copy' ? 'Copié' : action === 'cut' ? 'Coupé' : 'Collé'}</span>
        `;
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            indicator.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            indicator.classList.remove('show');
            setTimeout(() => {
                indicator.remove();
            }, 300);
        }, 1500);
    }

    updateHistoryUI() {
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');
        
        if (undoBtn) {
            undoBtn.disabled = this.undoStack.length === 0;
            undoBtn.title = this.undoStack.length > 0 
                ? `Annuler: ${this.undoStack[this.undoStack.length - 1].description}`
                : 'Rien à annuler';
        }
        
        if (redoBtn) {
            redoBtn.disabled = this.redoStack.length === 0;
            redoBtn.title = this.redoStack.length > 0 
                ? `Rétablir: ${this.redoStack[this.redoStack.length - 1].description}`
                : 'Rien à rétablir';
        }

        // Mettre à jour l'indicateur d'historique
        this.updateHistoryIndicator();
    }

    updateHistoryIndicator() {
        // DÉSACTIVÉ: Suppression de l'indicateur d'historique selon la demande utilisateur
        // L'indicateur d'historique n'est plus affiché
        const indicator = document.getElementById('history-indicator');
        if (indicator) {
            indicator.remove();
        }
        return;
    }

    // ===============================================
    // GETTERS POUR L'INTÉGRATION
    // ===============================================

    getSelectedElements() {
        return Array.from(this.selectedElements);
    }

    getSelectedElementsData() {
        const elementsData = [];
        this.selectedElements.forEach(elementId => {
            const element = window.SceneManager?.elements.get(elementId);
            if (element) {
                elementsData.push(element.toJSON());
            }
        });
        return elementsData;
    }

    hasSelection() {
        return this.selectedElements.size > 0;
    }

    canUndo() {
        return this.undoStack.length > 1;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    // ===============================================
    // NETTOYAGE
    // ===============================================

    destroy() {
        // Nettoyer la boîte de sélection si elle existe
        if (this.selectionBox) {
            this.selectionBox.remove();
            this.selectionBox = null;
        }

        // Vider les piles
        this.undoStack = [];
        this.redoStack = [];
        this.clipboard = { elements: [], type: null, timestamp: null };
        this.selectedElements.clear();

        console.log('✂️ Gestionnaire de menu Édition détruit');
    }
}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    window.EditMenuHandler = new EditMenuHandler();
    // console.log('✂️ Gestionnaire de menu Édition initialisé');
});

// Export pour utilisation externe
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EditMenuHandler;
}
