/**
 * Outil de mesure et cotation pour WallSim3D
 * Permet de créer des cotations et mesures précises sur la construction
 */
class MeasurementTool {
    constructor() {
        this.isActive = false;
        this.measurements = [];
        this.currentMeasurement = null;
        this.measurementGroup = null;
        this.isDrawing = false;
        this.measurementStep = 0; // 0: inactif, 1: premier point, 2: second point, 3: position cotation
        this.startPoint = null;
        this.endPoint = null;
        this.dimensionPoint = null; // Point pour positionner la ligne de cotation
        this.temporaryLine = null;
        this.temporaryExtensionLines = [];
        this.temporaryDimensionLine = null;
        this.temporaryLabel = null;
        this.temporaryStartMarker = null;
        this.temporaryEndMarker = null;
        this.measurementId = 0;
        this.units = 'cm'; // ou 'mm', 'm'
        this.precision = 1; // nombre de décimales
        
        // Échelle de cotation (1:20 ou 1:50)
        this.currentScale = null; // null = pas encore choisi, 20 ou 50
        
        // Système de snap (accrochage)
        this.snapEnabled = true;
        this.snapDistance = 15; // Distance de snap augmentée pour faciliter l'accrochage aux points supérieurs
        this.snapPoints = [];
        this.currentSnapPoint = null;
        this.snapIndicator = null;
        
    // Propriétés configurables pour l'apparence des cotations
    // Valeurs de base optimisées pour vues orthogonales et PDF (peuvent être reboostées en ortho)
    this.baseTextScale = 20;
    this.baseTextHeight = 20;
        this.baseDimensionLabelOffset = 2.0;
        this.baseMeasureLabelOffset = 1.5;
        this.baseArrowSize = 2.5;
        this.baseLineWidth = 4;
    // Facteur de boost pour les vues orthographiques (texte plus grand à l'export)
    this.orthoLabelBoost = 15; // 15x (anciennement 5x) pour être ~3x plus grand qu'avant
        
        // Valeurs actuelles (seront définies lors du choix de l'échelle)
        this.textScale = this.baseTextScale;
        this.textHeight = this.baseTextHeight;
        this.dimensionLabelOffset = this.baseDimensionLabelOffset;
        this.measureLabelOffset = this.baseMeasureLabelOffset;
        this.arrowSize = this.baseArrowSize;
        this.lineWidth = this.baseLineWidth;
        
        this.init();
    }

    init() {
        // console.log('📏 Initialisation de l\'outil de mesure...');
        this.waitForSceneManager();
    }

    waitForSceneManager() {
        if (window.SceneManager && window.SceneManager.scene) {
            this.createMeasurementGroup();
            this.setupEventListeners();
            this.setupKeyboardShortcuts();
            // console.log('✅ MeasurementTool initialisé avec SceneManager');
        } else {
            setTimeout(() => this.waitForSceneManager(), 100);
        }
    }

    createMeasurementGroup() {
        if (!window.SceneManager || !window.SceneManager.scene) {
            console.warn('❌ SceneManager non disponible pour l\'outil de mesure');
            setTimeout(() => this.createMeasurementGroup(), 100);
            return;
        }

        this.measurementGroup = new THREE.Group();
        this.measurementGroup.name = 'MeasurementGroup';
        window.SceneManager.scene.add(this.measurementGroup);
        // console.log('✅ Groupe de mesures créé');
    }

    activate() {
        // console.log('📏 Activation de l\'outil de mesure');
        
        // Toujours afficher la modale de sélection d'échelle à chaque activation
        this.showScaleSelectionModal();
    }
    
    showScaleSelectionModal() {
        const modal = document.getElementById('measurementScaleModal');
        if (!modal) {
            console.error('❌ Modale de sélection d\'échelle non trouvée');
            return;
        }
        
        modal.style.display = 'flex';
        
        // Gérer les clics sur les boutons d'échelle
        const scaleButtons = modal.querySelectorAll('.scale-choice-btn');
        scaleButtons.forEach(btn => {
            btn.onclick = () => {
                const scale = parseInt(btn.dataset.scale);
                this.setScale(scale);
                modal.style.display = 'none';
                this.activateAfterScaleSelection();
            };
        });
        
        // Gérer la fermeture de la modale (clic sur le fond ou bouton fermer)
        const closeModal = () => {
            modal.style.display = 'none';
            // Désactiver le bouton de l'outil car l'utilisateur a annulé
            this.updateButtonState(false);
            this.isActive = false;
        };
        
        // Fermer avec le bouton X
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.onclick = closeModal;
        }
        
        // Fermer en cliquant sur le fond de la modale
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };
        
        // Fermer avec Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }
    
    setScale(scale) {
        this.currentScale = scale;
        
        // Adapter les tailles selon l'échelle
        if (scale === 20) {
            // Échelle 1/20 : éléments 2x plus grands (×2)
            this.textScale = this.baseTextScale * 2.0;
            this.textHeight = this.baseTextHeight * 2.0;
            this.dimensionLabelOffset = this.baseDimensionLabelOffset * 2.0;
            this.measureLabelOffset = this.baseMeasureLabelOffset * 2.0;
            this.arrowSize = this.baseArrowSize * 2.0;
            this.lineWidth = this.baseLineWidth * 2.0;
        } else if (scale === 50) {
            // Échelle 1/50 : augmenter de x2 par rapport à la taille actuelle (donc ×4 par rapport à la base)
            this.textScale = this.baseTextScale * 4.0;
            this.textHeight = this.baseTextHeight * 4.0;
            this.dimensionLabelOffset = this.baseDimensionLabelOffset * 4.0;
            this.measureLabelOffset = this.baseMeasureLabelOffset * 4.0;
            this.arrowSize = this.baseArrowSize * 4.0;
            this.lineWidth = this.baseLineWidth * 4.0;
        }
        
        console.log(`📏 Échelle de cotation définie : 1/${scale}`, {
            textScale: this.textScale,
            textHeight: this.textHeight,
            arrowSize: this.arrowSize
        });
    }
    
    activateAfterScaleSelection() {
        this.isActive = true;
        this.showMeasurements();
        
        // Collecter les points de snap
        this.collectSnapPoints();
        
        // Changer le curseur
        if (window.SceneManager && window.SceneManager.renderer && window.SceneManager.renderer.domElement) {
            window.SceneManager.renderer.domElement.style.cursor = 'crosshair';
        }
        
        // Désactiver la brique fantôme et les suggestions de placement
        this.disableGhostElement();
        
        // Afficher le message d'instruction
        this.showInstructions();
        
        // Désactiver les autres outils
        this.deactivateOtherTools();
        
        // Mettre à jour l'état du bouton dans l'interface
        this.updateButtonState(true);
    }

    deactivate() {
        // console.log('📏 Désactivation de l\'outil de mesure');
        this.isActive = false;
        this.cancelCurrentMeasurement();
        
        // Nettoyer les points de snap et l'indicateur
        this.snapPoints = [];
        this.currentSnapPoint = null;
        if (this.snapIndicator) {
            this.measurementGroup.remove(this.snapIndicator);
            this.snapIndicator = null;
        }
        
        // Nettoyer les markers de debug s'ils existent
        if (this.debugMarkers) {
            this.debugMarkers.forEach(marker => {
                window.SceneManager.scene.remove(marker);
            });
            this.debugMarkers = [];
        }
        
        // Restaurer le curseur
        if (window.SceneManager && window.SceneManager.renderer && window.SceneManager.renderer.domElement) {
            window.SceneManager.renderer.domElement.style.cursor = 'default';
        }
        
        // Réactiver la brique fantôme si nécessaire
        this.restoreGhostElement();
        
        // Masquer les instructions
        this.hideInstructions();
        
        // Mettre à jour l'état du bouton dans l'interface
        this.updateButtonState(false);
    }

    setupEventListeners() {
        if (!window.SceneManager || !window.SceneManager.renderer) {
            setTimeout(() => this.setupEventListeners(), 100);
            return;
        }

        const canvas = window.SceneManager.renderer.domElement;
        
        // Événements de clic pour créer les mesures
        canvas.addEventListener('click', (event) => {
            if (!this.isActive) return;
            
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation(); // Empêcher complètement la propagation
            
            this.handleCanvasClick(event);
        }, true); // Utiliser la phase de capture pour intercepter avant les autres handlers

        // Événements de mouvement pour l'aperçu et l'indicateur de snap
        canvas.addEventListener('mousemove', (event) => {
            if (!this.isActive) return;
            
            // Empêcher l'interaction avec les briques pendant la mesure
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            
            // Afficher l'indicateur de snap seulement pour le premier point
            if (this.snapEnabled && this.measurementStep === 0) {
                const point = this.getMousePosition(event);
                if (point) {
                    const snapPoint = this.findNearestSnapPoint(point);
                    this.currentSnapPoint = snapPoint;
                    this.updateSnapIndicator(snapPoint);
                }
            } else {
                // Masquer l'indicateur de snap pour les autres points
                this.currentSnapPoint = null;
                this.updateSnapIndicator(null);
            }
            
            // Aperçu de mesure seulement si on est en cours de mesure
            if (this.measurementStep > 0) {
                this.handleMouseMove(event);
            }
        }, true); // Phase de capture

        // Événement pour annuler la mesure en cours
        document.addEventListener('keydown', (event) => {
            if (!this.isActive) return;
            
            if (event.key === 'Escape') {
                this.cancelCurrentMeasurement();
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ne pas activer de raccourcis si l'utilisateur est en train de saisir du texte
            const target = event.target || document.activeElement;
            const tag = (target && target.tagName) ? target.tagName.toLowerCase() : '';
            const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || (target && target.isContentEditable);

            // Raccourci pour activer/désactiver l'outil (M)
            if ((event.key === 'm' || event.key === 'M') && !isTyping) {
                if (!event.ctrlKey && !event.altKey && !event.shiftKey) {
                    event.preventDefault();
                    this.toggle();
                }
            }
            
            // Supprimer la dernière mesure (Delete/Suppr)
            if ((event.key === 'Delete' || event.key === 'Backspace') && this.isActive && !isTyping) {
                if (this.measurements.length > 0) {
                    this.removeLastMeasurement();
                }
            }
            
            // Changer l'unité (U)
            if ((event.key === 'u' || event.key === 'U') && !isTyping) {
                if (this.isActive) {
                    event.preventDefault();
                    this.cycleUnits();
                }
            }
            
            // Activer/désactiver le snap (S)
            if ((event.key === 's' || event.key === 'S') && !isTyping) {
                if (this.isActive && !event.ctrlKey && !event.altKey && !event.shiftKey) {
                    event.preventDefault();
                    this.toggleSnap();
                }
            }
        });
        
        // Écouter les événements de placement d'éléments pour mettre à jour les points de snap
        document.addEventListener('elementPlaced', () => {
            this.refreshSnapPoints();
        });
    }

    toggleSnap() {
        this.snapEnabled = !this.snapEnabled;
        
        if (this.snapEnabled) {
            console.log('📍 Accrochage activé');
            this.collectSnapPoints();
        } else {
            console.log('📍 Accrochage désactivé');
            this.snapPoints = [];
            this.currentSnapPoint = null;
            if (this.snapIndicator) {
                this.snapIndicator.visible = false;
            }
        }
        
        // Afficher une notification
        const status = this.snapEnabled ? 'activé' : 'désactivé';
        console.log(`📍 Système d'accrochage ${status}`);
    }

    refreshSnapPoints() {
        if (this.snapEnabled && this.isActive) {
            this.collectSnapPoints();
        }
    }

    // Méthode de debug pour tester le snap
    debugSnapPoints() {
        
        console.log('- SceneManager disponible:', !!window.SceneManager);
        console.log('- Elements disponibles:', !!window.SceneManager?.elements);
        console.log('- Nombre d\'éléments:', window.SceneManager?.elements?.size || 0);
        console.log('- Snap activé:', this.snapEnabled);
        console.log('- Distance snap:', this.snapDistance);
        
        this.collectSnapPoints();
        
        console.log('- Points collectés:', this.snapPoints.length);
        this.snapPoints.forEach((point, i) => {
            if (i < 10) { // Afficher seulement les 10 premiers
                console.log(`  Point ${i}:`, point);
            }
        });
    }

    // Méthode pour afficher visuellement tous les snap points
    showVisualSnapPoints() {
        console.log('🔧 DEBUG: Affichage visuel des snap points');
        this.collectSnapPoints();
        
        // Supprimer les anciens markers de debug
        if (this.debugMarkers) {
            this.debugMarkers.forEach(marker => {
                window.SceneManager.scene.remove(marker);
            });
        }
        this.debugMarkers = [];
        
        // Créer des markers visuels pour chaque snap point
        this.snapPoints.forEach((point, index) => {
            const geometry = new THREE.SphereGeometry(0.6, 12, 8); // Augmenté de 0.3 à 0.6
            const material = new THREE.MeshBasicMaterial({ 
                color: point.type === 'corner' ? 0xff0000 : 0x00ff00,
                transparent: true,
                opacity: 0.9 // Augmenté l'opacité
            });
            const marker = new THREE.Mesh(geometry, material);
            marker.position.set(point.x, point.y, point.z);
            marker.name = `snap-debug-${index}`;
            
            window.SceneManager.scene.add(marker);
            this.debugMarkers.push(marker);
            
            console.log(`🔧 Marker ${index}: ${point.type} at (${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)})`);
        });
        
        console.log(`🔧 ${this.debugMarkers.length} markers de debug créés`);
        return this.debugMarkers.length;
    }

    // Méthode pour supprimer les markers de debug visuels
    hideVisualSnapPoints() {
        if (this.debugMarkers) {
            this.debugMarkers.forEach(marker => {
                window.SceneManager.scene.remove(marker);
            });
            this.debugMarkers = [];
            console.log('🔧 DEBUG: Markers visuels supprimés');
        }
    }

    // Méthode de test simple pour vérifier le système de snap
    testSnapSystem() {
        console.log('🧪 TEST DU SYSTÈME DE SNAP');
        console.log('1. Vérification de SceneManager...');
        
        if (!window.SceneManager) {
            console.error('❌ SceneManager non disponible');
            return false;
        }
        
        console.log('✅ SceneManager disponible');
        console.log('2. Collecte des points de snap...');
        
        this.collectSnapPoints();
        
        if (this.snapPoints.length === 0) {
            console.warn('⚠️ Aucun point de snap trouvé. Vérifiez qu\'il y a des éléments dans la scène.');
            console.log('💡 Conseils pour tester:');
            console.log('   - Placez quelques briques dans la scène');
            console.log('   - Activez l\'outil de mesure (M)');
            console.log('   - Utilisez showVisualSnapPoints() pour voir les points');
            return false;
        }
        
        console.log(`✅ ${this.snapPoints.length} points de snap collectés`);
        console.log('3. Test de détection...');
        
        // Test avec le premier point
        const testPoint = new THREE.Vector3(
            this.snapPoints[0].x + 1, // Décalage léger
            this.snapPoints[0].y,
            this.snapPoints[0].z + 1
        );
        
        const nearestPoint = this.findNearestSnapPoint(testPoint);
        
        if (nearestPoint) {
            console.log('✅ Détection de snap fonctionnelle');
            console.log(`   Point test: (${testPoint.x.toFixed(1)}, ${testPoint.y.toFixed(1)}, ${testPoint.z.toFixed(1)})`);
            console.log(`   Point snap: (${nearestPoint.x.toFixed(1)}, ${nearestPoint.y.toFixed(1)}, ${nearestPoint.z.toFixed(1)})`);
            console.log(`   Description: ${nearestPoint.description}`);
            return true;
        } else {
            console.warn('⚠️ Détection de snap ne fonctionne pas correctement');
            return false;
        }
    }

    // Diagnostic avancé pour analyser les éléments et leurs positions
    diagnoseBrickPositions() {

        if (!window.SceneManager || !window.SceneManager.elements) {
            console.error('❌ SceneManager ou elements non disponible');
            return;
        }

        window.SceneManager.elements.forEach((element, key) => {
            console.log(`\n📦 Élément ${key}:`);
            console.log('  - ID:', element.id);
            console.log('  - Type:', element.type);
            console.log('  - Position:', element.position);
            console.log('  - Dimensions:', element.dimensions);
            console.log('  - Rotation:', element.rotation || 0);
            
            if (element.mesh) {
                console.log('  - Mesh position:', element.mesh.position);
                console.log('  - Mesh scale:', element.mesh.scale);
                console.log('  - Mesh rotation:', element.mesh.rotation);
                
                // Calculer la bounding box du mesh
                element.mesh.geometry.computeBoundingBox();
                const box = element.mesh.geometry.boundingBox;
                console.log('  - Bounding box:', {
                    min: box.min,
                    max: box.max,
                    size: {
                        x: box.max.x - box.min.x,
                        y: box.max.y - box.min.y,
                        z: box.max.z - box.min.z
                    }
                });
            }
        });
    }

    handleCanvasClick(event) {
        const point = this.getClickPoint(event);
        if (!point) return;

        // Appliquer le snap seulement pour les deux premiers points
        let finalPoint = point;
        if (this.snapEnabled && this.measurementStep < 2) {
            const snapPoint = this.findNearestSnapPoint(point);
            if (snapPoint) {
                finalPoint = new THREE.Vector3(snapPoint.x, snapPoint.y, snapPoint.z);
                // console.log(`📍 Clic avec accrochage à: ${snapPoint.description}`);
            }
        }

        switch (this.measurementStep) {
            case 0:
                // Premier clic - point de départ (avec snap)
                this.startMeasurement(finalPoint);
                break;
            case 1:
                // Deuxième clic - point d'arrivée (avec snap)
                this.setEndPoint(finalPoint);
                break;
            case 2:
                // Troisième clic - position de la ligne de cotation (SANS snap)
                this.finishMeasurement(point); // Utiliser le point original sans snap
                break;
        }
    }

    handleMouseMove(event) {
        if (this.measurementStep === 0) return;

        const point = this.getMousePosition(event);
        if (!point) return;

        // Mettre à jour l'indicateur de snap seulement pour les deux premiers points
        if (this.snapEnabled && this.measurementStep < 2) {
            const snapPoint = this.findNearestSnapPoint(point);
            this.currentSnapPoint = snapPoint;
            this.updateSnapIndicator(snapPoint);
        } else {
            // Pas de snap pour le troisième point
            this.currentSnapPoint = null;
            this.updateSnapIndicator(null);
        }

        if (this.measurementStep === 1) {
            // Aperçu entre premier et deuxième point (SANS snap)
            this.updateTemporaryLine(point);
        } else if (this.measurementStep === 2) {
            // Aperçu de la cotation complète (SANS snap pour le positionnement)
            this.updateTemporaryDimension(point); // Utiliser le point original sans snap
        }
    }

    getMousePosition(event) {
        if (!window.SceneManager || !window.SceneManager.camera || !window.SceneManager.renderer) {
            return null;
        }

        const canvas = window.SceneManager.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        
        const mouse = new THREE.Vector2();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, window.SceneManager.camera);

        // AMÉLIORATION: Si le snap est activé ET que nous ne sommes pas en train de positionner la ligne de cotation
        if (this.snapEnabled && this.measurementStep < 2 && this.snapPoints.length > 0) {
            const nearestSnapPoint = this.findNearestSnapPointFromRay(raycaster);
            if (nearestSnapPoint) {
                return new THREE.Vector3(nearestSnapPoint.x, nearestSnapPoint.y, nearestSnapPoint.z);
            }
        }

    // Plan de contrainte selon la vue actuelle
    const plane = this.getConstraintPlane();
        const intersection = new THREE.Vector3();
        
        if (raycaster.ray.intersectPlane(plane, intersection)) {
            return intersection;
        }

        return null;
    }

    getClickPoint(event) {
        if (!window.SceneManager || !window.SceneManager.camera || !window.SceneManager.renderer) {
            return null;
        }

        const canvas = window.SceneManager.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        
        // Calculer les coordonnées normalisées
        const mouse = new THREE.Vector2();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Créer un raycaster
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, window.SceneManager.camera);

        // AMÉLIORATION: Si le snap est activé ET que nous ne sommes pas en train de positionner la ligne de cotation
        if (this.snapEnabled && this.measurementStep < 2 && this.snapPoints.length > 0) {
            const nearestSnapPoint = this.findNearestSnapPointFromRay(raycaster);
            if (nearestSnapPoint) {
                return new THREE.Vector3(nearestSnapPoint.x, nearestSnapPoint.y, nearestSnapPoint.z);
            }
        }

    // Plan de contrainte selon la vue actuelle
    const plane = this.getConstraintPlane();
        const intersection = new THREE.Vector3();
        
        if (raycaster.ray.intersectPlane(plane, intersection)) {
            return intersection;
        }

        return null;
    }

    // Détermine le plan (XZ pour top, XY pour front/back, ZY pour left/right) pour projeter les clics/souris
    getConstraintPlane() {
        const scope = (window.SceneManager && window.SceneManager.currentViewScope) ? window.SceneManager.currentViewScope : '3d';
        const target = (window.SceneManager && window.SceneManager.controls && window.SceneManager.controls.target) ? window.SceneManager.controls.target : { x: 0, y: 0, z: 0 };
        if (scope === 'top') {
            // XZ (horizontal) → normal Y+, y=0
            return new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        }
        if (scope === 'front' || scope === 'back') {
            // XY (vertical) → Z constant
            return new THREE.Plane(new THREE.Vector3(0, 0, 1), -target.z);
        }
        if (scope === 'left' || scope === 'right') {
            // ZY (vertical, vue de côté) → X constant
            return new THREE.Plane(new THREE.Vector3(1, 0, 0), -target.x);
        }
        // Par défaut (3D/isométrique) garder le plan sol
        return new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    }

    startMeasurement(point) {
        // console.log('📏 Premier point de mesure à:', point);
        this.measurementStep = 1;
        this.startPoint = point.clone();
        this.createStartMarker();
        this.createInitialTemporaryLine();
        this.updateInstructions('Cliquez sur le deuxième point');
    }

    setEndPoint(point) {
        // console.log('📏 Deuxième point de mesure à:', point);
        this.measurementStep = 2;
        this.endPoint = point.clone();
        this.cleanupTemporaryElements();
        this.createTemporaryLine();
        this.updateInstructions('Cliquez pour positionner la ligne de cotation');
    }

    finishMeasurement(dimensionPoint) {
        // console.log('📏 Position de cotation à:', dimensionPoint);
        this.dimensionPoint = dimensionPoint.clone();
        
        // Créer la mesure permanente avec cotation complète
        this.createDimensionMeasurement(this.startPoint, this.endPoint, this.dimensionPoint);
        
        // Nettoyer les éléments temporaires
        this.cleanupTemporaryElements();
        
        // Réinitialiser pour la prochaine mesure
        this.resetMeasurementState();
        
        // Désactiver l'outil de mesure et revenir en mode construction
        // console.log('📏 Cotation terminée - retour en mode construction');
        this.deactivate();
        
        // Forcer la réactivation du mode construction
        this.activateConstructionMode();
    }

    resetMeasurementState() {
        this.measurementStep = 0;
        this.startPoint = null;
        this.endPoint = null;
        this.dimensionPoint = null;
        this.updateInstructions('Cliquez sur le premier point de mesure');
    }

    updateInstructions(text) {
        // Mettre à jour l'interface utilisateur avec les instructions
        // console.log('📋 Instructions:', text);
        // Peut être étendu plus tard pour afficher dans l'UI
    }

    // Système de snap (accrochage) aux points des briques
    collectSnapPoints() {
        this.snapPoints = [];
        
        if (!window.SceneManager) {
            console.warn('📍 SceneManager non disponible');
            return;
        }

        // console.log('📍 Collecte des points de snap...');

        // Méthode 1: Via SceneManager.elements
        if (window.SceneManager.elements && window.SceneManager.elements.size > 0) {
            // console.log('📍 Utilisation de SceneManager.elements:', window.SceneManager.elements.size, 'éléments');
            window.SceneManager.elements.forEach((element, key) => {
                if (element && this.isValidElementForSnap(element)) {
                    const snapPoints = this.getElementSnapPoints(element);
                    this.snapPoints.push(...snapPoints);
                    // console.log('📍 Points ajoutés pour', element.id || key, ':', snapPoints.length);
                }
            });
        }

        // Méthode 2: Scan de la scène Three.js (fallback)
        if (this.snapPoints.length === 0 && window.SceneManager.scene) {
            console.log('📍 Fallback: scan de la scène Three.js');
            window.SceneManager.scene.traverse((object) => {
                if (this.isValidMeshForSnap(object)) {
                    const snapPoints = this.getMeshSnapPoints(object);
                    this.snapPoints.push(...snapPoints);
                }
            });
        }

        // console.log(`📍 ${this.snapPoints.length} points d'accrochage collectés au total`);
        
        // Afficher quelques points pour debug
        /*
        if (this.snapPoints.length > 0) {
            console.log('📍 Exemple de points collectés:');
            this.snapPoints.slice(0, 5).forEach((point, i) => {
                console.log(`  ${i}: ${point.type} (${point.x.toFixed(1)}, ${point.y.toFixed(1)}, ${point.z.toFixed(1)}) - ${point.description}`);
            });
        }
        */
    }

    // Vérifier si un élément est valide pour le snap
    isValidElementForSnap(element) {
        // Vérifier que l'élément a les propriétés nécessaires
        if (!element) return false;
        
        // Exclure les joints - on ne veut que les éléments de construction
        if (element.type === 'joint' || element.type === 'horizontalJoint' || element.type === 'verticalJoint') {
            return false;
        }
        
        // Méthode 1: Élément WallElement standard (briques, blocs, etc.)
        if (element.mesh && element.dimensions && element.position) {
            return ['brick', 'block', 'insulation', 'linteau', 'diba'].includes(element.type);
        }
        
        // Méthode 2: Élément avec userData
        if (element.userData && element.userData.element) {
            const wallElement = element.userData.element;
            if (wallElement.type === 'joint' || wallElement.type === 'horizontalJoint' || wallElement.type === 'verticalJoint') {
                return false;
            }
            return wallElement.dimensions && wallElement.position && ['brick', 'block', 'insulation', 'linteau', 'diba'].includes(wallElement.type);
        }
        
        // Méthode 3: Mesh direct avec userData
        if (element.isMesh && element.userData && element.userData.type) {
            const type = element.userData.type;
            if (type === 'joint' || type === 'horizontalJoint' || type === 'verticalJoint') {
                return false;
            }
            return ['brick', 'block', 'insulation', 'linteau', 'diba'].includes(type);
        }
        
        return false;
    }

    // Vérifier si un mesh est valide pour le snap
    isValidMeshForSnap(mesh) {
        if (!mesh.isMesh) return false;
        if (!mesh.userData) return false;
        
        // Vérifier le type d'élément
        const type = mesh.userData.type || (mesh.userData.element && mesh.userData.element.type);
    const isConstructionElement = ['brick', 'block', 'insulation', 'linteau', 'diba'].includes(type);
        
        // Exclure les joints et autres éléments non pertinents
        const isJoint = mesh.userData.isJoint || mesh.userData.isVerticalJoint || mesh.userData.isHorizontalJoint;
        
        return isConstructionElement && !isJoint;
    }

    // Obtenir les points de snap d'un mesh Three.js
    getMeshSnapPoints(mesh) {
        const points = [];
        
        // Récupérer les dimensions depuis userData
        let dimensions = null;
        let position = mesh.position;
        
        if (mesh.userData.element && mesh.userData.element.dimensions) {
            dimensions = mesh.userData.element.dimensions;
        } else if (mesh.userData.dimensions) {
            dimensions = mesh.userData.dimensions;
        } else {
            // Calculer les dimensions depuis la géométrie
            mesh.geometry.computeBoundingBox();
            const box = mesh.geometry.boundingBox;
            dimensions = {
                length: box.max.x - box.min.x,
                width: box.max.z - box.min.z,
                height: box.max.y - box.min.y
            };
        }
        
        if (!dimensions) return points;
        
        // Obtenir la rotation
        const rotation = mesh.rotation.y || 0;
        
        // Calculer les points de snap
        return this.calculateSnapPoints(position, dimensions, rotation, mesh.userData.type || 'element');
    }

    getElementSnapPoints(element) {
        // Récupérer les données de l'élément
        let position, dimensions, rotation, elementType, elementId;
        
        // Méthode 1: WallElement standard
        if (element.position && element.dimensions) {
            // CORRECTION: Pour les éléments WallElement, utiliser la position logique 
            // mais ajuster pour correspondre à la position réelle du mesh
            position = element.position;
            
            // Si on a un mesh, vérifier s'il y a un décalage et l'appliquer
            if (element.mesh && element.mesh.position) {
                const meshPos = element.mesh.position;
                const elementPos = element.position;
                
                // Calculer le décalage entre position logique et position mesh
                const offsetX = meshPos.x - elementPos.x;
                const offsetZ = meshPos.z - elementPos.z;
                
                // Si le décalage est significatif (plus de 1 unité), utiliser la position mesh
                if (Math.abs(offsetX) > 1 || Math.abs(offsetZ) > 1) {
                    position = {
                        x: meshPos.x,
                        y: elementPos.y, // Garder Y logique pour l'élévation
                        z: meshPos.z
                    };
                    /*
                    console.log('📍 Correction position avec décalage mesh:', {
                        elementPos: elementPos,
                        meshPos: meshPos,
                        finalPos: position
                    });
                    */
                } else {
                    // console.log('📍 Utilisation de la position élément (décalage minimal):', position);
                }
            } else {
                // console.log('📍 Utilisation de la position élément (pas de mesh):', position);
            }
            
            dimensions = element.dimensions;
            rotation = element.rotation || 0;
            elementType = element.type || 'element';
            elementId = element.id || 'unknown';
        }
        // Méthode 2: Via userData.element
        else if (element.userData && element.userData.element) {
            const wallElement = element.userData.element;
            
            // CORRECTION: Utiliser la position du mesh parent si disponible
            if (element.position) {
                position = element.position; // Position du mesh Three.js
                console.log('📍 Utilisation de la position mesh userData:', position);
            } else {
                position = wallElement.position;
                console.log('📍 Utilisation de la position wallElement:', position);
            }
            
            dimensions = wallElement.dimensions;
            rotation = wallElement.rotation || 0;
            elementType = wallElement.type || 'element';
            elementId = wallElement.id || 'unknown';
        }
        // Méthode 3: Mesh direct avec mesh.position
        else if (element.isMesh && element.userData) {
            position = element.position; // Position du mesh Three.js
            
            // Essayer de récupérer les dimensions depuis userData
            if (element.userData.dimensions) {
                dimensions = element.userData.dimensions;
            } else if (element.userData.element && element.userData.element.dimensions) {
                dimensions = element.userData.element.dimensions;
            } else {
                // Calculer les dimensions depuis la géométrie
                element.geometry.computeBoundingBox();
                const box = element.geometry.boundingBox;
                dimensions = {
                    length: box.max.x - box.min.x,
                    width: box.max.z - box.min.z,
                    height: box.max.y - box.min.y
                };
            }
            
            rotation = element.rotation.y || 0;
            elementType = element.userData.type || 'element';
            elementId = element.userData.elementId || element.name || 'unknown';
        }
        else {
            console.warn('📍 Impossible de récupérer les données de l\'élément:', element);
            return [];
        }
        
        if (!position || !dimensions) {
            console.warn('📍 Position ou dimensions manquantes pour l\'élément:', elementId);
            return [];
        }
        
        /*
        console.log('📍 DEBUG données élément:', {
            elementId,
            position,
            dimensions,
            rotation,
            elementType
        });
        */
        
        return this.calculateSnapPoints(position, dimensions, rotation, elementType, elementId);
    }

    // Méthode commune pour calculer les points de snap
    calculateSnapPoints(position, dimensions, rotation, elementType, elementId = 'unknown') {
        const points = [];
        
        /*
        console.log('📍 Calcul des points de snap pour', elementId, ':', {
            position: position,
            dimensions: dimensions,
            rotation: rotation
        });
        */

        // Calculer les 8 coins de la brique en tenant compte de la rotation
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);

        // Dimensions locales (avant rotation)
        const halfLength = dimensions.length / 2;
        const halfWidth = dimensions.width / 2;
        const halfHeight = dimensions.height / 2;

        // Les 8 coins dans le système local (par rapport au centre)
        // 4 coins inférieurs + 4 coins supérieurs pour un accrochage complet
        const localCorners = [
            { x: -halfLength, y: -halfHeight, z: -halfWidth }, // Coin inférieur arrière gauche
            { x: halfLength, y: -halfHeight, z: -halfWidth },  // Coin inférieur arrière droit
            { x: halfLength, y: -halfHeight, z: halfWidth },   // Coin inférieur avant droit
            { x: -halfLength, y: -halfHeight, z: halfWidth },  // Coin inférieur avant gauche
            { x: -halfLength, y: halfHeight, z: -halfWidth },  // Coin supérieur arrière gauche
            { x: halfLength, y: halfHeight, z: -halfWidth },   // Coin supérieur arrière droit
            { x: halfLength, y: halfHeight, z: halfWidth },    // Coin supérieur avant droit
            { x: -halfLength, y: halfHeight, z: halfWidth }    // Coin supérieur avant gauche
        ];

        // Dans votre système, position semble être le centre de l'élément
        const centerX = position.x;
        const centerY = position.y;
        const centerZ = position.z;

        // Appliquer la rotation et la translation depuis le centre
        localCorners.forEach((corner, index) => {
            const rotatedX = corner.x * cos - corner.z * sin;
            const rotatedZ = corner.x * sin + corner.z * cos;

            const cornerId = index + 1;
            const isBottomCorner = index < 4; // Les 4 premiers sont les coins inférieurs
            const cornerType = isBottomCorner ? 'inférieur' : 'supérieur';
            
            points.push({
                x: centerX + rotatedX,
                y: centerY + corner.y,
                z: centerZ + rotatedZ,
                type: 'corner',
                elementId: elementId,
                description: `Coin ${cornerType} ${isBottomCorner ? cornerId : cornerId - 4} de ${elementType}`
            });
        });

        // console.log('📍 Points générés pour', elementId, ':', points.length, 'points');
        return points;
    }

    findNearestSnapPoint(position) {
        if (!this.snapEnabled || this.snapPoints.length === 0) {
            return null;
        }

        let nearestPoint = null;
        let nearestDistance = this.snapDistance;

        this.snapPoints.forEach((snapPoint, index) => {
            const distance = Math.sqrt(
                Math.pow(position.x - snapPoint.x, 2) +
                Math.pow(position.y - snapPoint.y, 2) +
                Math.pow(position.z - snapPoint.z, 2)
            );

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestPoint = snapPoint;
            }
        });

        if (nearestPoint) {
            // console.log(`📍 Point de snap trouvé: ${nearestPoint.description} à ${nearestDistance.toFixed(2)} unités`);
        }

        return nearestPoint;
    }

    // Nouvelle méthode pour détecter les points de snap en utilisant la distance perpendiculaire au rayon
    findNearestSnapPointFromRay(raycaster) {
        if (!this.snapEnabled || this.snapPoints.length === 0) {
            return null;
        }

        let nearestPoint = null;
        let nearestDistance = 15; // Distance maximum plus élevée pour les rayons (15 unités)

        this.snapPoints.forEach((snapPoint) => {
            // Calculer la distance perpendiculaire entre le rayon et le point de snap
            const pointVector = new THREE.Vector3(snapPoint.x, snapPoint.y, snapPoint.z);
            const rayOrigin = raycaster.ray.origin;
            const rayDirection = raycaster.ray.direction;
            
            // Vecteur du ray origin vers le point
            const originToPoint = pointVector.clone().sub(rayOrigin);
            
            // Projection du vecteur sur la direction du rayon
            const projectionLength = originToPoint.dot(rayDirection);
            
            // Point le plus proche sur le rayon
            const closestPointOnRay = rayOrigin.clone().add(rayDirection.clone().multiplyScalar(projectionLength));
            
            // Distance perpendiculaire
            const perpendicularDistance = pointVector.distanceTo(closestPointOnRay);
            
            // Aussi vérifier que le point est devant la caméra (pas derrière)
            if (projectionLength > 0 && perpendicularDistance < nearestDistance) {
                nearestDistance = perpendicularDistance;
                nearestPoint = snapPoint;
            }
        });

        if (nearestPoint) {
            // console.log(`📍 Point de snap détecté par rayon: ${nearestPoint.description} à ${nearestDistance.toFixed(2)} unités`);
        }

        return nearestPoint;
    }

    createSnapIndicator() {
        if (this.snapIndicator) {
            this.measurementGroup.remove(this.snapIndicator);
        }

        const geometry = new THREE.SphereGeometry(0.8, 12, 8); // Augmenté de 0.2 à 0.8
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00, 
            transparent: true,
            opacity: 0.9 // Augmenté l'opacité pour plus de visibilité
        });
        
        this.snapIndicator = new THREE.Mesh(geometry, material);
        this.measurementGroup.add(this.snapIndicator);
    }

    updateSnapIndicator(snapPoint) {
        if (!snapPoint) {
            if (this.snapIndicator) {
                this.snapIndicator.visible = false;
            }
            return;
        }

        if (!this.snapIndicator) {
            this.createSnapIndicator();
        }

        this.snapIndicator.position.set(snapPoint.x, snapPoint.y, snapPoint.z);
        this.snapIndicator.visible = true;
        
        // Changer la couleur selon le type de point
        this.snapIndicator.material.color.setHex(0x00ff00); // Vert pour les coins
    }

    resetMeasurementState() {
        this.measurementStep = 0;
        this.startPoint = null;
        this.endPoint = null;
        this.dimensionPoint = null;
        this.updateInstructions('Cliquez sur le premier point pour commencer une mesure');
    }

    createStartMarker() {
        this.cleanupTemporaryElements();
        
        // Créer un marqueur pour le premier point
        const geometry = new THREE.SphereGeometry(0.3, 8, 6);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.temporaryStartMarker = new THREE.Mesh(geometry, material);
        this.temporaryStartMarker.position.copy(this.startPoint);
        this.measurementGroup.add(this.temporaryStartMarker);
    }

    createInitialTemporaryLine() {
        // Créer une ligne temporaire vide pour l'affichage dynamique
        const geometry = new THREE.BufferGeometry();
        const points = [this.startPoint, this.startPoint]; // Points identiques au début
        geometry.setFromPoints(points);
        
        const material = new THREE.LineBasicMaterial({ 
            color: 0x00ff00, 
            transparent: true, 
            opacity: 0.7,
            linewidth: 2
        });
        
        this.temporaryLine = new THREE.Line(geometry, material);
        this.measurementGroup.add(this.temporaryLine);
    }

    createTemporaryLine() {
        // Créer la ligne temporaire entre les deux points
        const geometry = new THREE.BufferGeometry();
        const points = [this.startPoint, this.endPoint];
        geometry.setFromPoints(points);
        
        const material = new THREE.LineBasicMaterial({ 
            color: 0x00ff00, 
            transparent: true, 
            opacity: 0.7,
            linewidth: 2
        });
        
        this.temporaryLine = new THREE.Line(geometry, material);
        this.measurementGroup.add(this.temporaryLine);
        
        // Marqueur pour le deuxième point
        const markerGeometry = new THREE.SphereGeometry(0.3, 8, 6);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.temporaryEndMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        this.temporaryEndMarker.position.copy(this.endPoint);
        this.measurementGroup.add(this.temporaryEndMarker);
    }

    updateTemporaryLine(endPoint) {
        if (!this.temporaryLine || !this.startPoint) return;

        const points = [this.startPoint, endPoint];
        this.temporaryLine.geometry.setFromPoints(points);
        
        // Mettre à jour l'étiquette temporaire
        const distance = this.startPoint.distanceTo(endPoint);
        const midPoint = this.startPoint.clone().add(endPoint).multiplyScalar(0.5);
        midPoint.y += 1; // Élever légèrement au-dessus du sol
        
        this.updateTemporaryLabel(midPoint, distance);
    }

    updateTemporaryDimension(dimensionPoint) {
        this.cleanupTemporaryDimension();
        
        // Calculer les projections pour les lignes d'attache
        const direction = this.endPoint.clone().sub(this.startPoint).normalize();
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
        
        // Projeter le point de dimension sur la ligne perpendiculaire
        const startToMouse = dimensionPoint.clone().sub(this.startPoint);
        const projectionDistance = startToMouse.dot(perpendicular);
        const projectionVector = perpendicular.clone().multiplyScalar(projectionDistance);
        
        // Points sur la ligne de cotation
        const dimStart = this.startPoint.clone().add(projectionVector);
        const dimEnd = this.endPoint.clone().add(projectionVector);
        
        // Créer la ligne de cotation temporaire avec flèches
        this.createTemporaryDimensionLineWithArrows(dimStart, dimEnd);
        
    // Créer les lignes d'attache étendues (dépassent de la ligne de cotation)
    const extensionLength = 3; // 2 → 3 (×1,5)
        const extendedDimStart = dimStart.clone().add(perpendicular.clone().multiplyScalar(extensionLength));
        const extendedDimEnd = dimEnd.clone().add(perpendicular.clone().multiplyScalar(extensionLength));
        
        this.createTemporaryExtensionLines(this.startPoint, extendedDimStart, this.endPoint, extendedDimEnd);
        
        // Créer l'étiquette de distance
        const distance = this.startPoint.distanceTo(this.endPoint);
        const labelPosition = dimStart.clone().add(dimEnd).multiplyScalar(0.5);
        labelPosition.y += 1.5; // Élever plus haut pour éviter les conflits
        
        this.updateTemporaryLabel(labelPosition, distance);
    }

    createTemporaryDimensionLineWithArrows(startPoint, endPoint) {
        // Ligne principale temporaire
        const geometry = new THREE.BufferGeometry();
        geometry.setFromPoints([startPoint, endPoint]);
        
        const material = new THREE.LineBasicMaterial({ 
            color: 0x00ff00, 
            transparent: true, 
            opacity: 0.8
        });
        
        this.temporaryDimensionLine = new THREE.Line(geometry, material);
        this.measurementGroup.add(this.temporaryDimensionLine);
        // Assurer un rendu au-dessus de la géométrie
        this.ensureOverlayOnTop(this.temporaryDimensionLine);
        
        // Flèches temporaires
        const direction = endPoint.clone().sub(startPoint).normalize();
        
        // Stocker les flèches temporaires pour les nettoyer plus tard
        if (!this.temporaryArrows) {
            this.temporaryArrows = [];
        }
        
        // Utiliser la propriété configurable pour la taille des flèches
        const arrow1 = this.createTemporaryArrow(startPoint, direction, this.arrowSize);
        const arrow2 = this.createTemporaryArrow(endPoint, direction.clone().negate(), this.arrowSize);
        
        this.temporaryArrows.push(arrow1, arrow2);
        this.measurementGroup.add(arrow1);
        this.measurementGroup.add(arrow2);
        // Assurer un rendu au-dessus de la géométrie
        this.ensureOverlayOnTop(arrow1);
        this.ensureOverlayOnTop(arrow2);
    }

    createTemporaryArrow(position, direction, size) {
        const arrowGroup = new THREE.Group();
        
        // Même logique que createArrow mais avec couleur temporaire
        const angle = Math.PI / 6;
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
        
        const barb1Direction = direction.clone()
            .multiplyScalar(Math.cos(angle))
            .add(perpendicular.clone().multiplyScalar(Math.sin(angle)));
        const barb1End = position.clone().add(barb1Direction.multiplyScalar(size));
        
        const barb2Direction = direction.clone()
            .multiplyScalar(Math.cos(angle))
            .add(perpendicular.clone().multiplyScalar(-Math.sin(angle)));
        const barb2End = position.clone().add(barb2Direction.multiplyScalar(size));
        
        const barb1Geometry = new THREE.BufferGeometry();
        barb1Geometry.setFromPoints([position, barb1End]);
        const barb1Material = new THREE.LineBasicMaterial({ 
            color: 0x00ff00, 
            transparent: true, 
            opacity: 0.8 
        });
        const barb1Line = new THREE.Line(barb1Geometry, barb1Material);
        arrowGroup.add(barb1Line);
        
        const barb2Geometry = new THREE.BufferGeometry();
        barb2Geometry.setFromPoints([position, barb2End]);
        const barb2Material = new THREE.LineBasicMaterial({ 
            color: 0x00ff00, 
            transparent: true, 
            opacity: 0.8 
        });
        const barb2Line = new THREE.Line(barb2Geometry, barb2Material);
        arrowGroup.add(barb2Line);
        // Assurer un rendu au-dessus de la géométrie
        this.ensureOverlayOnTop(arrowGroup);
        
        return arrowGroup;
    }

    createTemporaryDimensionLine(startPoint, endPoint) {
        const geometry = new THREE.BufferGeometry();
        geometry.setFromPoints([startPoint, endPoint]);
        
        const material = new THREE.LineBasicMaterial({ 
            color: 0x00ff00, 
            transparent: true, 
            opacity: 0.8
        });
        
        this.temporaryDimensionLine = new THREE.Line(geometry, material);
        this.measurementGroup.add(this.temporaryDimensionLine);
    }

    createTemporaryExtensionLines(start1, end1, start2, end2) {
        this.temporaryExtensionLines = [];
        
        // Ligne d'attache 1
        const geometry1 = new THREE.BufferGeometry();
        geometry1.setFromPoints([start1, end1]);
        const material1 = new THREE.LineBasicMaterial({ 
            color: 0x00ff00, 
            transparent: true, 
            opacity: 0.6
        });
        const line1 = new THREE.Line(geometry1, material1);
        this.temporaryExtensionLines.push(line1);
        this.measurementGroup.add(line1);
        
        // Ligne d'attache 2
        const geometry2 = new THREE.BufferGeometry();
        geometry2.setFromPoints([start2, end2]);
        const material2 = new THREE.LineBasicMaterial({ 
            color: 0x00ff00, 
            transparent: true, 
            opacity: 0.6
        });
        const line2 = new THREE.Line(geometry2, material2);
        this.temporaryExtensionLines.push(line2);
        this.measurementGroup.add(line2);
    }

    cleanupTemporaryDimension() {
        if (this.temporaryDimensionLine) {
            this.measurementGroup.remove(this.temporaryDimensionLine);
            this.temporaryDimensionLine = null;
        }
        
        // Nettoyer les flèches temporaires
        if (this.temporaryArrows) {
            this.temporaryArrows.forEach(arrow => {
                this.measurementGroup.remove(arrow);
            });
            this.temporaryArrows = [];
        }
        
        this.temporaryExtensionLines.forEach(line => {
            this.measurementGroup.remove(line);
        });
        this.temporaryExtensionLines = [];
    }

    createDimensionMeasurement(startPoint, endPoint, dimensionPoint) {
        // Calculer les projections pour les lignes d'attache
        const direction = endPoint.clone().sub(startPoint).normalize();
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
        
        // Projeter le point de dimension sur la ligne perpendiculaire
        const startToMouse = dimensionPoint.clone().sub(startPoint);
        const projectionDistance = startToMouse.dot(perpendicular);
        const projectionVector = perpendicular.clone().multiplyScalar(projectionDistance);
        
        // Points sur la ligne de cotation
        const dimStart = startPoint.clone().add(projectionVector);
        const dimEnd = endPoint.clone().add(projectionVector);
        
        const distance = startPoint.distanceTo(endPoint);
        const measurementId = this.measurements.length;
        
        // Créer le groupe de mesure
        const measurementGroup = new THREE.Group();
        measurementGroup.userData.measurementId = measurementId;
        measurementGroup.userData.measurementType = 'dimension';
        measurementGroup.userData.toolType = 'measurement';
        measurementGroup.name = `measurement-${measurementId}`;
        
        // Ligne de cotation principale avec flèches
        this.createDimensionLineWithArrows(measurementGroup, dimStart, dimEnd);
        
    // Lignes d'attache étendues (dépassent de la ligne de cotation)
    const extensionLength = 3; // 2 → 3 (×1,5)
        const extendedDimStart = dimStart.clone().add(perpendicular.clone().multiplyScalar(extensionLength));
        const extendedDimEnd = dimEnd.clone().add(perpendicular.clone().multiplyScalar(extensionLength));
        
        const ext1Geometry = new THREE.BufferGeometry();
        ext1Geometry.setFromPoints([startPoint, extendedDimStart]);
        const ext1Material = new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.7, transparent: true });
        const extensionLine1 = new THREE.Line(ext1Geometry, ext1Material);
        measurementGroup.add(extensionLine1);
        
        const ext2Geometry = new THREE.BufferGeometry();
        ext2Geometry.setFromPoints([endPoint, extendedDimEnd]);
        const ext2Material = new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.7, transparent: true });
        const extensionLine2 = new THREE.Line(ext2Geometry, ext2Material);
        measurementGroup.add(extensionLine2);
        
        // Marqueurs aux extrémités (plus petits pour les cotations techniques)
        const startMarker = this.createTechnicalMarker(startPoint);
        const endMarker = this.createTechnicalMarker(endPoint);
        measurementGroup.add(startMarker);
        measurementGroup.add(endMarker);
        
    // Étiquette de distance avec décalage perpendiculaire pour mieux séparer du trait de cote
    const labelPosition = dimStart.clone().add(dimEnd).multiplyScalar(0.5);
    labelPosition.add(perpendicular.clone().multiplyScalar(this.dimensionLabelOffset));
    labelPosition.y += 1;
    const label = this.createTextLabel(this.formatDistance(distance), labelPosition);
        measurementGroup.add(label);
        
        this.measurementGroup.add(measurementGroup);
        // Assurer un rendu au-dessus de la géométrie pour tout le groupe
        this.ensureOverlayOnTop(measurementGroup);
        
        // Assigner au calque cotations si le LayerManager est disponible
        if (window.LayerManager) {
            window.LayerManager.assignElementToLayer(measurementGroup, 'measurement');
        }
        
        // Enregistrer la mesure
        this.measurements.push({
            id: measurementId,
            type: 'dimension',
            startPoint: startPoint.clone(),
            endPoint: endPoint.clone(),
            dimensionPoint: dimensionPoint.clone(),
            distance: distance,
            group: measurementGroup,
            // Associer à la vue courante (portée canonique)
            view: (window.SceneManager && window.SceneManager.currentViewScope) ? window.SceneManager.currentViewScope : '3d'
        });
        
        return measurementId;
    }

    createDimensionLineWithArrows(group, startPoint, endPoint) {
        // Ligne principale de cotation
        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setFromPoints([startPoint, endPoint]);
        // Utiliser la propriété configurable pour l'épaisseur de ligne
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: this.lineWidth });
        const dimensionLine = new THREE.Line(lineGeometry, lineMaterial);
        group.add(dimensionLine);
        
        // Calculer la direction de la ligne (de début vers fin)
        const lineDirection = endPoint.clone().sub(startPoint).normalize();
        console.log('📐 Cotation - Direction:', lineDirection);
        
        // Pour les cotations, les flèches pointent vers l'intérieur :
        // - Flèche au point de début : pointe vers l'intérieur (vers endPoint)
        // - Flèche au point de fin : pointe vers l'intérieur (vers startPoint)
        
        const arrow1 = this.createArrow(startPoint, lineDirection, this.arrowSize);
        group.add(arrow1);
        
        const arrow2 = this.createArrow(endPoint, lineDirection.clone().negate(), this.arrowSize);
        group.add(arrow2);
    }

    createArrow(position, direction, size) {
        // Debug : afficher les paramètres
        console.log('🏹 Création flèche:', {
            position: `(${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`,
            direction: `(${direction.x.toFixed(2)}, ${direction.y.toFixed(2)}, ${direction.z.toFixed(2)})`,
            size: size
        });
        
        // Créer une flèche triangulaire pleine avec un cône
        const arrowGroup = new THREE.Group();
        
        // Géométrie du cône pour la flèche triangulaire
        const coneRadius = size * 0.3; // Rayon du cône 
        const coneHeight = size; // Hauteur du cône = taille de la flèche
        
        const coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 8);
        const coneMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000, // Retour au noir
            side: THREE.DoubleSide
        });
        
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        
        // Placer le cône à la position de base
        cone.position.copy(position);
        
        // Par défaut, le cône pointe vers +Y. On veut qu'il pointe dans la direction donnée
        // MAIS on inverse la direction pour que la flèche pointe correctement
        const defaultDirection = new THREE.Vector3(0, 1, 0); // Direction par défaut du cône (+Y)
        const targetDirection = direction.clone().normalize().negate(); // Inverser la direction (rotation 180°)
        
        // Créer le quaternion de rotation
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(defaultDirection, targetDirection);
        cone.setRotationFromQuaternion(quaternion);
        
        // Ajuster la position pour que la base du cône soit sur la ligne
        // Avec la direction inversée, on ajuste aussi le positionnement
        const offsetToBase = direction.clone().normalize().multiplyScalar(coneHeight * 0.5);
        cone.position.add(offsetToBase);
        
        arrowGroup.add(cone);
        
        return arrowGroup;
    }

    createTechnicalMarker(position) {
        // Marqueur plus petit et plus discret pour les cotations techniques
        const geometry = new THREE.SphereGeometry(0.2, 8, 6);
        const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const marker = new THREE.Mesh(geometry, material);
        marker.position.copy(position);
        return marker;
    }

    updateTemporaryLabel(position, distance) {
        if (this.temporaryLabel) {
            this.measurementGroup.remove(this.temporaryLabel);
        }

        const text = this.formatDistance(distance);
        this.temporaryLabel = this.createTextLabel(text, position, 0x00ff00, true);
        this.measurementGroup.add(this.temporaryLabel);
    }

    createMeasurement(startPoint, endPoint, distance) {
        const measurementId = this.measurementId++;
    const midPoint = startPoint.clone().add(endPoint).multiplyScalar(0.5);
        
        // Créer la ligne de mesure
        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setFromPoints([startPoint, endPoint]);
        
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000, 
            linewidth: 3
        });
        
        const line = new THREE.Line(lineGeometry, lineMaterial);
        line.name = `measurement-line-${measurementId}`;
        
    // Créer les flèches aux extrémités qui pointent vers l'intérieur
    const direction = endPoint.clone().sub(startPoint).normalize();
    const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
        console.log('📏 Mesure simple - Direction:', direction);
        const startArrow = this.createArrow(startPoint, direction, this.arrowSize);
        const endArrow = this.createArrow(endPoint, direction.clone().negate(), this.arrowSize);
        
        // Créer l'étiquette avec la distance
        const text = this.formatDistance(distance);
    // Décaler l'étiquette perpendiculairement pour un meilleur espacement visuel
    const labelPos = midPoint.clone().add(perpendicular.multiplyScalar(this.measureLabelOffset));
    const label = this.createTextLabel(text, labelPos, 0xff6600);
        
        // Créer un groupe pour cette mesure
        const measurementGroup = new THREE.Group();
        measurementGroup.add(line);
        measurementGroup.add(startArrow);
        measurementGroup.add(endArrow);
        measurementGroup.add(label);
        measurementGroup.name = `measurement-${measurementId}`;
        
        this.measurementGroup.add(measurementGroup);
    // Assurer un rendu au-dessus de la géométrie pour tout le groupe
    this.ensureOverlayOnTop(measurementGroup);
        
        // Stocker la mesure
        const measurement = {
            id: measurementId,
            startPoint: startPoint.clone(),
            endPoint: endPoint.clone(),
            distance: distance,
            line: line,
            label: label,
            group: measurementGroup,
            startArrow: startArrow,
            endArrow: endArrow,
            // Associer à la vue courante (portée canonique)
            view: (window.SceneManager && window.SceneManager.currentViewScope) ? window.SceneManager.currentViewScope : '3d',
            created: new Date()
        };
        
        this.measurements.push(measurement);
        
        console.log(`📏 Mesure créée: ${text} (ID: ${measurementId})`);
        
        return measurement;
    }

    createEndMarker(position) {
        const geometry = new THREE.SphereGeometry(0.5, 8, 6);
        const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const marker = new THREE.Mesh(geometry, material);
        marker.position.copy(position);
        return marker;
    }

    createTextLabel(text, position, color = 0xff6600, isTemporary = false) {
        // Créer un canvas TRÈS haute résolution pour éviter la pixelisation en PDF
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Résolution ultra-haute pour export PDF de qualité (8x plus grand)
        canvas.width = 4096;
        canvas.height = 4096;
        
        // Optimisation de la qualité du rendu
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        
        // Police ultra-grande proportionnelle à la résolution du canvas
        const fontSize = 640; // Doublé pour la nouvelle résolution
        context.font = `bold ${fontSize}px Arial, sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Couleur du texte
        context.fillStyle = isTemporary ? '#00ff00' : '#000000';
        
        // Ajouter un contour blanc pour améliorer la lisibilité
        if (!isTemporary) {
            context.strokeStyle = '#ffffff';
            context.lineWidth = 12;
            context.strokeText(text, canvas.width / 2, canvas.height / 2);
        }
        
        // Dessiner le texte
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // Créer la texture avec paramètres optimisés
        const texture = new THREE.CanvasTexture(canvas);
        texture.generateMipmaps = true; // Activer pour meilleure qualité à différentes distances
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = 16; // Améliore la netteté sous différents angles
        texture.format = THREE.RGBAFormat;
        texture.needsUpdate = true;
        
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            sizeAttenuation: true, // Taille influencée par la projection (orthographique/perspective)
            transparent: true,
            depthTest: false, // Toujours visible au premier plan
            depthWrite: false
        });
        const sprite = new THREE.Sprite(material);
        
        sprite.position.copy(position);
        sprite.position.y += 3; // Élever plus haut au-dessus du sol
        // Utiliser les propriétés configurables pour la taille avec boost ortho
        const boost = this.getCameraScaleBoost();
        sprite.scale.set(this.textScale * boost, this.textHeight * boost, 1);
        // Assurer un rendu au-dessus de la géométrie pour l'étiquette
        sprite.renderOrder = 999; // Forcer le rendu en dernier (au-dessus de tout)
        this.ensureOverlayOnTop(sprite);
        
        return sprite;
    }

    // Détermine un boost de taille selon le type de caméra active
    getCameraScaleBoost(camera = null) {
        try {
            const cam = camera || (window.SceneManager && window.SceneManager.camera);
            if (cam && cam.isOrthographicCamera) {
                // Boost de base pour ortho; la variation 1/50 est déjà gérée dans setScale()
                let boost = this.orthoLabelBoost || 5;
                return boost;
            }
        } catch (_) {}
        return 1;
    }

    formatDistance(distance) {
        let value, unit;
        
        switch (this.units) {
            case 'mm':
                value = distance * 10;
                unit = 'mm';
                break;
            case 'm':
                value = distance / 100;
                unit = 'm';
                break;
            case 'cm':
            default:
                value = distance;
                unit = 'cm';
                break;
        }
        
        return `${value.toFixed(this.precision)} ${unit}`;
    }

    cancelCurrentMeasurement() {
        if (this.measurementStep > 0) {
            console.log('📏 Annulation de la mesure en cours');
            this.cleanupTemporaryElements();
            this.resetMeasurementState();
        }
    }

    cleanupTemporaryElements() {
        if (this.temporaryLine) {
            this.measurementGroup.remove(this.temporaryLine);
            this.temporaryLine = null;
        }
        
        if (this.temporaryLabel) {
            this.measurementGroup.remove(this.temporaryLabel);
            this.temporaryLabel = null;
        }
        
        if (this.temporaryStartMarker) {
            this.measurementGroup.remove(this.temporaryStartMarker);
            this.temporaryStartMarker = null;
        }
        
        if (this.temporaryEndMarker) {
            this.measurementGroup.remove(this.temporaryEndMarker);
            this.temporaryEndMarker = null;
        }
        
        // Nettoyer les éléments de cotation temporaires
        this.cleanupTemporaryDimension();
    }

    removeLastMeasurement() {
        if (this.measurements.length === 0) return;
        
        const lastMeasurement = this.measurements.pop();
        this.measurementGroup.remove(lastMeasurement.group);
        
        console.log(`📏 Mesure supprimée: ${lastMeasurement.id}`);
    }

    removeMeasurement(measurementId) {
        const index = this.measurements.findIndex(m => m.id === measurementId);
        if (index === -1) return;
        
        const measurement = this.measurements[index];
        this.measurementGroup.remove(measurement.group);
        this.measurements.splice(index, 1);
        
        console.log(`📏 Mesure supprimée: ${measurementId}`);
    }

    clearAllMeasurements() {
        console.log('📏 Suppression de toutes les mesures');
        
        this.measurements.forEach(measurement => {
            this.measurementGroup.remove(measurement.group);
        });
        
        this.measurements = [];
        this.cancelCurrentMeasurement();
    }

    showMeasurements() {
        if (this.measurementGroup) {
            this.measurementGroup.visible = true;
        }
    }

    hideMeasurements() {
        if (this.measurementGroup) {
            this.measurementGroup.visible = false;
        }
    }

    toggle() {
        if (this.isActive) {
            this.deactivate();
        } else {
            this.activate();
        }
    }
    
    changeScale() {
        // Permet de changer l'échelle même quand l'outil est actif
        this.showScaleSelectionModal();
    }

    cycleUnits() {
        const units = ['cm', 'mm', 'm'];
        const currentIndex = units.indexOf(this.units);
        this.units = units[(currentIndex + 1) % units.length];
        
        console.log(`📏 Unité changée: ${this.units}`);
        
        // Mettre à jour toutes les étiquettes existantes
        this.updateAllLabels();
    }

    updateAllLabels() {
        this.measurements.forEach(measurement => {
            if (measurement && measurement.label && measurement.label.position && measurement.distance) {
                const text = this.formatDistance(measurement.distance);
                const labelPosition = measurement.label.position.clone();
                const newLabel = this.createTextLabel(text, labelPosition, 0x000000);
                
                if (measurement.group) {
                    measurement.group.remove(measurement.label);
                    measurement.group.add(newLabel);
                    measurement.label = newLabel;
                }
            } else {
                console.warn('📏 Mesure invalide trouvée lors de la mise à jour des étiquettes:', measurement);
            }
        });
    }

    // Ajuste dynamiquement l'échelle des labels pour une caméra donnée (utile pour export ortho)
    refreshLabelScalesForCamera(camera) {
        const boost = this.getCameraScaleBoost(camera);
        try {
            this.measurements.forEach(m => {
                if (m && m.label && m.label.scale) {
                    m.label.scale.set(this.textScale * boost, this.textHeight * boost, 1);
                }
            });
            // Gérer aussi une éventuelle étiquette temporaire
            if (this.temporaryLabel && this.temporaryLabel.scale) {
                this.temporaryLabel.scale.set(this.textScale * boost, this.textHeight * boost, 1);
            }
        } catch (e) {
            // ignore
        }
    }
    
    // Méthode pour mettre à jour les propriétés d'apparence et redessiner
    updateAppearanceProperties(newProperties) {
        console.log('📏 Mise à jour des propriétés d\'apparence des cotations:', newProperties);
        
        // Mettre à jour les propriétés internes
        if (newProperties.textScale !== undefined) this.textScale = parseFloat(newProperties.textScale);
        if (newProperties.textHeight !== undefined) this.textHeight = parseFloat(newProperties.textHeight);
        if (newProperties.arrowSize !== undefined) this.arrowSize = parseFloat(newProperties.arrowSize);
        if (newProperties.lineWidth !== undefined) this.lineWidth = parseFloat(newProperties.lineWidth);
        
        // Redessiner toutes les cotations existantes avec les nouvelles propriétés
        this.redrawAllMeasurements();
    }
    
    // Méthode pour redessiner toutes les cotations avec les nouvelles propriétés
    redrawAllMeasurements() {
        console.log('📏 Redessin de toutes les cotations avec les nouvelles propriétés');
        
        // Sauvegarder les données des mesures
        const measurementData = this.measurements.map(measurement => ({
            id: measurement.id,
            type: measurement.type,
            startPoint: measurement.startPoint.clone(),
            endPoint: measurement.endPoint.clone(),
            dimensionPoint: measurement.dimensionPoint ? measurement.dimensionPoint.clone() : null,
            distance: measurement.distance
        }));
        
        // Supprimer toutes les cotations existantes
        this.measurements.forEach(measurement => {
            if (measurement.group) {
                this.measurementGroup.remove(measurement.group);
            }
        });
        this.measurements = [];
        
        // Recréer toutes les cotations avec les nouvelles propriétés
        measurementData.forEach(data => {
            if (data.type === 'dimension' && data.dimensionPoint) {
                this.createDimensionMeasurement(data.startPoint, data.endPoint, data.dimensionPoint);
            } else {
                // Pour les mesures simples (si applicable)
                this.createMeasurement(data.startPoint, data.endPoint, data.distance);
            }
        });
        // Rehausser les nouvelles cotations après redessin
        if (this.measurementGroup) this.ensureOverlayOnTop(this.measurementGroup);
        
        console.log('📏 Redessin terminé:', this.measurements.length, 'cotations recréées');
    }

    // Assure que les overlays (mesures) rendent toujours au-dessus de la géométrie 3D
    ensureOverlayOnTop(object3D) {
        if (!object3D) return;
        const applyProps = (obj) => {
            try {
                obj.renderOrder = 10000;
                // Tag logique pour d'autres systèmes
                obj.userData = obj.userData || {};
                if (!obj.userData.layerId) obj.userData.layerId = 'cotations';
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(mat => {
                            if (!mat) return;
                            if (mat.depthTest !== undefined) mat.depthTest = false;
                            if (mat.depthWrite !== undefined) mat.depthWrite = false;
                        });
                    } else {
                        if (obj.material.depthTest !== undefined) obj.material.depthTest = false;
                        if (obj.material.depthWrite !== undefined) obj.material.depthWrite = false;
                    }
                }
            } catch (e) { /* ignore */ }
        };
        applyProps(object3D);
        if (typeof object3D.traverse === 'function') {
            object3D.traverse(child => applyProps(child));
        }
    }

    showInstructions() {
        if (window.ToolbarManager && window.ToolbarManager.showInstruction) {
            const snapStatus = this.snapEnabled ? '✅ ON' : '❌ OFF';
            window.ToolbarManager.showInstruction(`Outil de mesure actif - 3 clics pour cotation - [M] basculer, [U] unité, [S] snap ${snapStatus}, [Esc] annuler`);
        }
    }

    hideInstructions() {
        if (window.ToolbarManager && window.ToolbarManager.hideInstruction) {
            window.ToolbarManager.hideInstruction();
        }
    }

    deactivateOtherTools() {
        // Désactiver les autres outils
        if (window.ToolbarManager && window.ToolbarManager.setTool) {
            window.ToolbarManager.setTool('measure');
        }
    }

    disableGhostElement() {
        // console.log('👻 Désactivation de la brique fantôme pour l\'outil de mesure');
        
        // Sauvegarder l'état actuel du placement pour le restaurer plus tard
        if (window.ConstructionTools) {
            this.previousPlacementMode = window.ConstructionTools.isPlacementMode;
            this.previousShowGhost = window.ConstructionTools.showGhost;
            
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
            
            // Désactiver les suggestions de placement
            if (window.ConstructionTools.deactivateSuggestions) {
                window.ConstructionTools.deactivateSuggestions();
            }
            
            // Effacer les suggestions existantes
            if (window.ConstructionTools.clearSuggestions) {
                window.ConstructionTools.clearSuggestions();
            }
            
            // Désactiver complètement les interactions avec les briques
            if (window.ConstructionTools.disableBrickInteractions) {
                window.ConstructionTools.disableBrickInteractions();
            }
            
            // console.log('✅ Brique fantôme et interactions désactivées');
        }
        
        // Désactiver les gestionnaires d'événements de sélection de briques
        this.disableBrickSelection();
    }

    disableBrickSelection() {
        // console.log('🚫 Désactivation des interactions avec les briques');
        
        // Marquer que l'outil de mesure est actif pour que les autres systèmes l'ignorent
        if (window.SceneManager) {
            window.SceneManager.measurementToolActive = true;
        }
        
        // Désactiver temporairement le raycasting sur les briques
        if (window.SceneManager && window.SceneManager.scene) {
            window.SceneManager.scene.traverse((object) => {
                if (object.isMesh && object.userData && 
                    (object.userData.type === 'brick' || object.userData.type === 'block' || 
                     object.userData.element && ['brick', 'block'].includes(object.userData.element.type))) {
                    // Sauvegarder l'état original
                    if (object.userData.originalRaycast === undefined) {
                        object.userData.originalRaycast = object.raycast;
                    }
                    // Désactiver le raycast temporairement
                    object.raycast = () => {};
                }
            });
        }
    }

    enableBrickSelection() {
        // console.log('✅ Réactivation des interactions avec les briques');
        
        // Marquer que l'outil de mesure n'est plus actif
        if (window.SceneManager) {
            window.SceneManager.measurementToolActive = false;
        }
        
        // Réactiver le raycasting sur les briques
        if (window.SceneManager && window.SceneManager.scene) {
            window.SceneManager.scene.traverse((object) => {
                if (object.isMesh && object.userData && 
                    object.userData.originalRaycast !== undefined) {
                    // Restaurer l'état original
                    object.raycast = object.userData.originalRaycast;
                    delete object.userData.originalRaycast;
                }
            });
        }
    }

    restoreGhostElement() {
        // console.log('👻 Restauration de la brique fantôme après mesure');
        
        if (window.ConstructionTools) {
            // Restaurer les états précédents seulement s'ils étaient activés
            if (this.previousPlacementMode !== undefined) {
                window.ConstructionTools.isPlacementMode = this.previousPlacementMode;
            }
            
            if (this.previousShowGhost !== undefined) {
                window.ConstructionTools.showGhost = this.previousShowGhost;
            }
            
            // Réactiver l'élément fantôme si il était actif et si on n'est pas en mode suggestions
            if (this.previousShowGhost && window.ConstructionTools.ghostElement && window.ConstructionTools.ghostElement.mesh) {
                if (!window.ConstructionTools.activeBrickForSuggestions) {
                    window.ConstructionTools.ghostElement.mesh.visible = true;
                }
            }
            
            // Réactiver les suggestions si elles étaient actives
            if (this.previousPlacementMode && window.ConstructionTools.activateSuggestions) {
                window.ConstructionTools.activateSuggestions();
            }
            
            // Réactiver les interactions avec les briques
            if (window.ConstructionTools.enableBrickInteractions) {
                window.ConstructionTools.enableBrickInteractions();
            }
            
            // console.log('✅ Brique fantôme et interactions restaurées');
            
            // Nettoyer les variables temporaires
            this.previousPlacementMode = undefined;
            this.previousShowGhost = undefined;
        }
        
        // Réactiver les gestionnaires d'événements de sélection de briques
        this.enableBrickSelection();
    }

    // Méthodes pour la compatibilité avec le système existant
    getActiveMeasurements() {
        return this.measurements.filter(m => m.group.visible);
    }

    exportMeasurements() {
        // Exporter toutes les mesures, incluant le type et le point de décalage pour les cotations "dimension"
        return this.measurements.map(measurement => ({
            id: measurement.id,
            type: measurement.type || 'simple',
            startPoint: {
                x: measurement.startPoint.x,
                y: measurement.startPoint.y,
                z: measurement.startPoint.z
            },
            endPoint: {
                x: measurement.endPoint.x,
                y: measurement.endPoint.y,
                z: measurement.endPoint.z
            },
            // Pour les cotations de type "dimension", conserver le point de cote (décalage)
            dimensionPoint: measurement.dimensionPoint ? {
                x: measurement.dimensionPoint.x,
                y: measurement.dimensionPoint.y,
                z: measurement.dimensionPoint.z
            } : null,
            distance: measurement.distance,
            formattedDistance: this.formatDistance(measurement.distance),
            view: measurement.view || '3d',
            created: measurement.created,
            units: this.units
        }));
    }

    importMeasurements(measurementsData) {
        this.clearAllMeasurements();
        
        measurementsData.forEach(data => {
            if (!data || !data.startPoint || !data.endPoint) return;
            const startPoint = new THREE.Vector3(data.startPoint.x, data.startPoint.y, data.startPoint.z);
            const endPoint = new THREE.Vector3(data.endPoint.x, data.endPoint.y, data.endPoint.z);
            const type = data.type || 'simple';
            let created;
            
            if (type === 'dimension' && data.dimensionPoint) {
                // Restaurer une cotation de type "dimension" avec son point de cote
                const dimPoint = new THREE.Vector3(data.dimensionPoint.x, data.dimensionPoint.y, data.dimensionPoint.z);
                created = this.createDimensionMeasurement(startPoint, endPoint, dimPoint);
            } else {
                // Mesure simple (ligne entre deux points)
                const distance = data.distance ?? startPoint.distanceTo(endPoint);
                created = this.createMeasurement(startPoint, endPoint, distance);
            }
            
            if (created && data.view) {
                created.view = data.view;
            }
        });
        
        console.log(`📏 ${measurementsData.length} mesures importées`);
    }

    // Méthode pour forcer l'activation du mode construction
    activateConstructionMode() {
        // console.log('🔧 Activation forcée du mode construction');
        
        // Réinitialiser la barre d'outils au mode sélection par défaut
        if (window.ToolbarManager) {
            // Désactiver tous les boutons
            if (window.ToolbarManager.toolButtons) {
                window.ToolbarManager.toolButtons.forEach(btn => btn.classList.remove('active'));
            }
            
            // Réactiver le bouton de sélection
            const selectButton = document.getElementById('selectTool');
            if (selectButton) {
                selectButton.classList.add('active');
            }
            
            // Réinitialiser l'état du ToolbarManager
            window.ToolbarManager.currentTool = 'select';
            window.ToolbarManager.isToolActive = false;
            window.ToolbarManager.interactionMode = 'construction';
            
            // Masquer les instructions - vérifier que la méthode existe
            if (typeof window.ToolbarManager.hideInstruction === 'function') {
                window.ToolbarManager.hideInstruction();
            }
            
            console.log('🔧 Barre d\'outils réinitialisée en mode sélection');
        }
        
        if (window.ConstructionTools) {
            // S'assurer que le mode de placement est actif
            window.ConstructionTools.isPlacementMode = true;
            window.ConstructionTools.showGhost = true;
            
            // Réactiver l'élément fantôme seulement si on n'est pas en mode suggestions
            if (window.ConstructionTools.ghostElement && window.ConstructionTools.ghostElement.mesh) {
                if (!window.ConstructionTools.activeBrickForSuggestions) {
                    window.ConstructionTools.ghostElement.mesh.visible = true;
                }
            }
            
            // Réactiver les suggestions
            if (window.ConstructionTools.activateSuggestions) {
                window.ConstructionTools.activateSuggestions();
            }
            
            // Réactiver les interactions avec les briques
            if (window.ConstructionTools.enableBrickInteractions) {
                window.ConstructionTools.enableBrickInteractions();
            }
            
            // console.log('✅ Mode construction activé');
        } else {
            console.warn('⚠️ ConstructionTools non disponible');
        }
    }

    // Méthode pour mettre à jour l'état du bouton dans l'interface
    updateButtonState(active) {
        const button = document.getElementById('measureTool');
        if (button) {
            if (active) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        }
    }
}

// Fonctions globales pour faciliter les tests
window.testMeasurementSnap = function() {
    if (window.MeasurementTool) {
        return window.MeasurementTool.testSnapSystem();
    } else {
        console.error('❌ MeasurementTool non disponible');
        return false;
    }
};

window.showSnapPoints = function() {
    if (window.MeasurementTool) {
        return window.MeasurementTool.showVisualSnapPoints();
    } else {
        console.error('❌ MeasurementTool non disponible');
        return 0;
    }
};

window.hideSnapPoints = function() {
    if (window.MeasurementTool) {
        window.MeasurementTool.hideVisualSnapPoints();
    } else {
        console.error('❌ MeasurementTool non disponible');
    }
};

window.diagnoseBricks = function() {
    if (window.MeasurementTool) {
        window.MeasurementTool.diagnoseBrickPositions();
    } else {
        console.error('❌ MeasurementTool non disponible');
    }
};

// Initialisation globale
window.MeasurementTool = null;

// Fonction d'initialisation retardée
function initMeasurementTool() {
    if (!window.MeasurementTool && window.THREE) {
        window.MeasurementTool = new MeasurementTool();
        // console.log('✅ MeasurementTool créé');
    }
}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    // Attendre un peu que l'application se charge
    setTimeout(initMeasurementTool, 500);
});

// Initialisation de secours
window.addEventListener('load', () => {
    setTimeout(() => {
        if (!window.MeasurementTool) {
            initMeasurementTool();
            if (window.DEBUG_APP) {
                console.log('✅ MeasurementTool initialisé (secours)');
            }
        }
    }, 1000);
});
