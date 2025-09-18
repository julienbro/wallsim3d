/**
 * Gestionnaire d'intégration pour les outils de mesure, annotation et texte avec ligne de rappel
 * Gère l'interface utilisateur et l'intégration avec la barre d'outils existante
 */
class MeasurementAnnotationManager {
    constructor() {
        this.measurementTool = null;
        this.annotationTool = null;
        this.textLeaderTool = null;
        this.measurementControls = null;
        this.annotationControls = null;
        this.isInitialized = false;
        this.groupsReady = false;
        
        this.init();
    }

    init() {
        // console.log('🔧 Initialisation du gestionnaire des outils de mesure, annotation et texte...');
        
        // Attendre que les outils soient disponibles
        this.waitForTools();
    }

    waitForTools() {
        // 🔧 PROTECTION: Limiter les tentatives et gérer une initialisation en deux phases
        if (!this.retryCount) this.retryCount = 0;
        this.retryCount++;

        // État des instances
        const instancesReady = !!(window.MeasurementTool && window.AnnotationTool && window.TextLeaderTool);
        // État des groupes Three.js associés
        const groupsReady = instancesReady &&
                            window.MeasurementTool.measurementGroup &&
                            window.AnnotationTool.annotationGroup &&
                            window.TextLeaderTool.textLeaderGroup;

        // Si tout est prêt (instances + groupes), finaliser si nécessaire et arrêter
        if (groupsReady) {
            if (!this.isInitialized) {
                this.measurementTool = window.MeasurementTool;
                this.annotationTool = window.AnnotationTool;
                this.textLeaderTool = window.TextLeaderTool;
                this.setupUI();
                this.setupEventListeners();
                this.setupToolbarIntegration();
                this.isInitialized = true;
            }
            this.groupsReady = true;
            return;
        }

        // Si les instances existent mais pas encore les groupes, faire une initialisation partielle une seule fois
        if (instancesReady && !this.isInitialized) {
            this.measurementTool = window.MeasurementTool;
            this.annotationTool = window.AnnotationTool;
            this.textLeaderTool = window.TextLeaderTool;
            // Ces étapes ne nécessitent pas obligatoirement la présence des groupes
            this.setupUI();
            this.setupEventListeners();
            this.setupToolbarIntegration();
            this.isInitialized = true;
            this.groupsReady = false; // On attend encore les groupes
        }

        // Journaliser une information après 50 tentatives, mais continuer d'attendre silencieusement
        if (this.retryCount === 50 && !instancesReady) {
            console.info('ℹ️ MeasurementAnnotationManager: Outils en cours d\'initialisation, attente prolongée…');
        }

        // En dernier recours, au bout d'un délai long, tenter de créer les instances (si elles n\'existent pas)
        if (this.retryCount > 300 && !instancesReady) { // ~60s
            this.createToolInstances();
            return;
        }

        setTimeout(() => this.waitForTools(), 200);
    }

    createToolInstances() {
        // Si les classes existent mais ne sont pas encore totalement initialisées,
        // créer les instances pour les rendre disponibles
        if (!window.MeasurementTool && typeof MeasurementTool !== 'undefined') {
            window.MeasurementTool = new MeasurementTool();
        }
        if (!window.AnnotationTool && typeof AnnotationTool !== 'undefined') {
            window.AnnotationTool = new AnnotationTool();
        }
        if (!window.TextLeaderTool && typeof TextLeaderTool !== 'undefined') {
            window.TextLeaderTool = new TextLeaderTool();
        }
        
        // Essayer une dernière fois de s'initialiser
        if (window.MeasurementTool || window.AnnotationTool || window.TextLeaderTool) {
            this.measurementTool = window.MeasurementTool;
            this.annotationTool = window.AnnotationTool;
            this.textLeaderTool = window.TextLeaderTool;
            this.isInitialized = true;
            console.log('✅ Gestionnaire des outils initialisé avec instances de base');
        }
    }

    setupUI() {
        this.measurementControls = document.getElementById('measurementControls');
        this.annotationControls = document.getElementById('annotationControls');

        if (!this.measurementControls || !this.annotationControls) {
            // console.log('ℹ️ Panneaux de contrôle optionnels non trouvés dans le DOM - les outils fonctionneront sans interface de contrôle');
            return;
        }

        this.setupMeasurementControlsEvents();
        this.setupAnnotationControlsEvents();
    }

    setupMeasurementControlsEvents() {
        // Changement d'unité
        const unitSelect = document.getElementById('measurementUnit');
        if (unitSelect) {
            unitSelect.addEventListener('change', (event) => {
                this.measurementTool.units = event.target.value;
                this.measurementTool.updateAllLabels();
                console.log(`📏 Unité changée: ${event.target.value}`);
            });
        }

        // Changement de précision
        const precisionInput = document.getElementById('measurementPrecision');
        if (precisionInput) {
            precisionInput.addEventListener('change', (event) => {
                this.measurementTool.precision = parseInt(event.target.value);
                this.measurementTool.updateAllLabels();
                console.log(`📏 Précision changée: ${event.target.value}`);
            });
        }

        // Boutons d'action
        const clearBtn = document.getElementById('clearMeasurements');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.measurementTool.clearAllMeasurements();
                this.updateMeasurementCounter();
                this.updateMeasurementList();
            });
        }

        const exportBtn = document.getElementById('exportMeasurements');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportMeasurements();
            });
        }

        const hideBtn = document.getElementById('hideMeasurements');
        if (hideBtn) {
            hideBtn.addEventListener('click', () => {
                this.toggleMeasurementVisibility();
            });
        }
    }

    setupAnnotationControlsEvents() {
        // Filtre par type
        const typeFilter = document.getElementById('annotationTypeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (event) => {
                this.filterAnnotations(event.target.value);
            });
        }

        // Recherche
        const searchInput = document.getElementById('annotationSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (event) => {
                this.searchAnnotations(event.target.value);
            });
        }

        // Boutons d'action
        const clearBtn = document.getElementById('clearAnnotations');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.annotationTool.clearAllAnnotations();
                this.updateAnnotationCounter();
                this.updateAnnotationList();
            });
        }

        const exportBtn = document.getElementById('exportAnnotations');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportAnnotations();
            });
        }

        const listBtn = document.getElementById('listAnnotations');
        if (listBtn) {
            listBtn.addEventListener('click', () => {
                this.showAnnotationList();
            });
        }
    }

    setupToolbarIntegration() {
        // 🔧 PROTECTION: Ne plus afficher de warnings pour les boutons manquants
        // Ces outils sont optionnels et leur absence n'est pas critique
        const measureBtn = document.getElementById('measureTool');
        const annotationBtn = document.getElementById('annotationTool');
        const textLeaderBtn = document.getElementById('textLeaderTool');

        if (measureBtn) {
            measureBtn.addEventListener('click', () => {
                this.toggleMeasurementTool();
            });
        }

        if (annotationBtn) {
            annotationBtn.addEventListener('click', () => {
                this.toggleAnnotationTool();
            });
        }

        if (textLeaderBtn) {
            textLeaderBtn.addEventListener('click', () => {
                this.toggleTextLeaderTool();
            });
        }

        // Intégrer avec le ToolbarManager existant si disponible
        if (window.ToolbarManager) {
            this.integrateWithToolbarManager();
        }
        // Sinon, les gestionnaires directs suffisent
    }

    setupEventListeners() {
        // Écouter les changements dans les outils pour mettre à jour l'interface
        
        // Observer les changements de mesures
        const originalCreateMeasurement = this.measurementTool.createMeasurement.bind(this.measurementTool);
        this.measurementTool.createMeasurement = (...args) => {
            const result = originalCreateMeasurement(...args);
            this.updateMeasurementCounter();
            this.updateMeasurementList();
            return result;
        };

        const originalRemoveMeasurement = this.measurementTool.removeMeasurement.bind(this.measurementTool);
        this.measurementTool.removeMeasurement = (...args) => {
            originalRemoveMeasurement(...args);
            this.updateMeasurementCounter();
            this.updateMeasurementList();
        };

        // Observer les changements d'annotations
        const originalCreateAnnotation = this.annotationTool.createAnnotation.bind(this.annotationTool);
        this.annotationTool.createAnnotation = (...args) => {
            const result = originalCreateAnnotation(...args);
            this.updateAnnotationCounter();
            this.updateAnnotationList();
            return result;
        };

        const originalRemoveAnnotation = this.annotationTool.removeAnnotation.bind(this.annotationTool);
        this.annotationTool.removeAnnotation = (...args) => {
            originalRemoveAnnotation(...args);
            this.updateAnnotationCounter();
            this.updateAnnotationList();
        };

        // Observer les changements de textes avec ligne de rappel
        const originalCreateTextAnnotation = this.textLeaderTool.createTextAnnotation.bind(this.textLeaderTool);
        this.textLeaderTool.createTextAnnotation = (...args) => {
            const result = originalCreateTextAnnotation(...args);
            return result;
        };

        const originalRemoveTextAnnotation = this.textLeaderTool.removeTextAnnotation.bind(this.textLeaderTool);
        this.textLeaderTool.removeTextAnnotation = (...args) => {
            originalRemoveTextAnnotation(...args);
        };
    }

    integrateWithToolbarManager() {
        // Vérifier que ToolbarManager est disponible et a la méthode handleToolClick
        if (!window.ToolbarManager || typeof window.ToolbarManager.handleToolClick !== 'function') {
            // ToolbarManager non disponible, les boutons fonctionnent directement
            return;
        }

        // Ajouter la gestion des nouveaux outils au ToolbarManager
        const originalHandleToolClick = window.ToolbarManager.handleToolClick.bind(window.ToolbarManager);
        
        window.ToolbarManager.handleToolClick = (event, button) => {
            const toolId = button ? button.id : event;
            
            // FERMER TOUTES LES FENÊTRES D'AIDE LORS DU CHANGEMENT D'OUTIL
            this.closeAllHelpWindows();
            
            if (toolId === 'measureTool') {
                this.toggleMeasurementTool();
                return;
            }
            
            if (toolId === 'annotationTool') {
                this.toggleAnnotationTool();
                return;
            }

            if (toolId === 'textLeaderTool') {
                this.toggleTextLeaderTool();
                return;
            }
            
            // Désactiver nos outils si un autre outil est sélectionné
            if (this.measurementTool.isActive) {
                this.measurementTool.deactivate();
                this.hideMeasurementControls();
            }
            
            if (this.annotationTool.isActive) {
                this.annotationTool.deactivate();
                this.hideAnnotationControls();
            }

            if (this.textLeaderTool.isActive) {
                this.textLeaderTool.deactivate();
            }
            
            // Appeler la méthode originale avec les bons paramètres
            originalHandleToolClick(event, button);
        };
    }

    toggleMeasurementTool() {
        if (this.measurementTool.isActive) {
            this.measurementTool.deactivate();
            this.hideMeasurementControls();
            this.setToolButtonActive('measureTool', false);
        } else {
            // Vérifier que le groupe est prêt avant d'activer
            if (!this.measurementTool || !this.measurementTool.measurementGroup) {
                console.info('ℹ️ Outil de mesure en cours d\'initialisation…');
                // Retenter légèrement plus tard
                setTimeout(() => this.toggleMeasurementTool(), 250);
                return;
            }
            // Désactiver les autres outils si actifs
            if (this.annotationTool.isActive) {
                this.annotationTool.deactivate();
                this.hideAnnotationControls();
                this.setToolButtonActive('annotationTool', false);
            }
            if (this.textLeaderTool.isActive) {
                this.textLeaderTool.deactivate();
                this.setToolButtonActive('textLeaderTool', false);
            }
            
            this.measurementTool.activate();
            this.showMeasurementControls();
            this.setToolButtonActive('measureTool', true);
            this.updateMeasurementList();
        }
    }

    toggleAnnotationTool() {
        if (this.annotationTool.isActive) {
            this.annotationTool.deactivate();
            this.hideAnnotationControls();
            this.setToolButtonActive('annotationTool', false);
        } else {
            // Vérifier que le groupe est prêt avant d'activer
            if (!this.annotationTool || !this.annotationTool.annotationGroup) {
                console.info('ℹ️ Outil d\'annotation en cours d\'initialisation…');
                setTimeout(() => this.toggleAnnotationTool(), 250);
                return;
            }
            // Désactiver les autres outils si actifs
            if (this.measurementTool.isActive) {
                this.measurementTool.deactivate();
                this.hideMeasurementControls();
                this.setToolButtonActive('measureTool', false);
            }
            if (this.textLeaderTool.isActive) {
                this.textLeaderTool.deactivate();
                this.setToolButtonActive('textLeaderTool', false);
            }
            
            this.annotationTool.activate();
            this.showAnnotationControls();
            this.setToolButtonActive('annotationTool', true);
            this.updateAnnotationList();
        }
    }

    toggleTextLeaderTool() {
        if (this.textLeaderTool.isActive) {
            this.textLeaderTool.deactivate();
            this.setToolButtonActive('textLeaderTool', false);
        } else {
            // Vérifier que le groupe est prêt avant d'activer
            if (!this.textLeaderTool || !this.textLeaderTool.textLeaderGroup) {
                console.info('ℹ️ Outil texte en cours d\'initialisation…');
                setTimeout(() => this.toggleTextLeaderTool(), 250);
                return;
            }
            // Désactiver les autres outils si actifs
            if (this.measurementTool.isActive) {
                this.measurementTool.deactivate();
                this.hideMeasurementControls();
                this.setToolButtonActive('measureTool', false);
            }
            if (this.annotationTool.isActive) {
                this.annotationTool.deactivate();
                this.hideAnnotationControls();
                this.setToolButtonActive('annotationTool', false);
            }
            
            this.textLeaderTool.activate();
            this.setToolButtonActive('textLeaderTool', true);
        }
    }

    setToolButtonActive(toolId, active) {
        const button = document.getElementById(toolId);
        if (button) {
            if (active) {
                button.classList.add('active');
                // Retirer la classe active des autres boutons
                document.querySelectorAll('.tool-button').forEach(btn => {
                    if (btn.id !== toolId) {
                        btn.classList.remove('active');
                    }
                });
            } else {
                button.classList.remove('active');
            }
        }
    }

    showMeasurementControls() {
        if (this.measurementControls) {
            this.measurementControls.classList.add('active');
        }
    }

    hideMeasurementControls() {
        if (this.measurementControls) {
            this.measurementControls.classList.remove('active');
        }
    }

    showAnnotationControls() {
        if (this.annotationControls) {
            this.annotationControls.classList.add('active');
        }
    }

    hideAnnotationControls() {
        if (this.annotationControls) {
            this.annotationControls.classList.remove('active');
        }
    }

    updateMeasurementCounter() {
        const counter = document.getElementById('measureCounter');
        if (counter) {
            const count = this.measurementTool.measurements.length;
            counter.textContent = count;
            counter.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    updateAnnotationCounter() {
        const counter = document.getElementById('annotationCounter');
        if (counter) {
            const count = this.annotationTool.annotations.length;
            counter.textContent = count;
            counter.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    updateMeasurementList() {
        const listContainer = document.getElementById('measurementList');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        this.measurementTool.measurements.forEach((measurement, index) => {
            const item = document.createElement('div');
            item.className = 'measurement-item';
            item.innerHTML = `
                <div class="measurement-value">${this.measurementTool.formatDistance(measurement.distance)}</div>
                <div class="measurement-coords">
                    De: (${measurement.startPoint.x.toFixed(1)}, ${measurement.startPoint.z.toFixed(1)}) 
                    À: (${measurement.endPoint.x.toFixed(1)}, ${measurement.endPoint.z.toFixed(1)})
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.focusOnMeasurement(measurement);
            });
            
            listContainer.appendChild(item);
        });
    }

    updateAnnotationList() {
        const listContainer = document.getElementById('annotationList');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        this.annotationTool.annotations.forEach((annotation, index) => {
            const item = document.createElement('div');
            item.className = 'annotation-item';
            item.innerHTML = `
                <div class="annotation-text">${annotation.text}</div>
                <div class="annotation-meta">
                    <span class="annotation-type-badge annotation-type-${annotation.type}">${this.getTypeIcon(annotation.type)}</span>
                    <span>${annotation.created.toLocaleDateString()}</span>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.annotationTool.editAnnotation(annotation);
            });
            
            listContainer.appendChild(item);
        });
    }

    getTypeIcon(type) {
        const icons = {
            note: '📝',
            warning: '⚠️',
            important: '❗',
            info: 'ℹ️',
            dimension: '📏',
            material: '🧱',
            instruction: '📋'
        };
        return icons[type] || '📝';
    }

    focusOnMeasurement(measurement) {
        if (!window.SceneManager || !window.SceneManager.camera) return;

        // Calculer le centre de la mesure
        const center = measurement.startPoint.clone().add(measurement.endPoint).multiplyScalar(0.5);
        
        // Déplacer la caméra pour voir la mesure
        const distance = 20;
        const cameraPosition = center.clone();
        cameraPosition.y += distance;
        
        window.SceneManager.camera.position.copy(cameraPosition);
        window.SceneManager.camera.lookAt(center);
        
        if (window.SceneManager.controls) {
            window.SceneManager.controls.target.copy(center);
            window.SceneManager.controls.update();
        }
    }

    exportMeasurements() {
        const measurements = this.measurementTool.exportMeasurements();
        const dataStr = JSON.stringify(measurements, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `mesures_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    exportAnnotations() {
        const annotations = this.annotationTool.exportAnnotations();
        const dataStr = JSON.stringify(annotations, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `annotations_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    toggleMeasurementVisibility() {
        const hideBtn = document.getElementById('hideMeasurements');
        if (!hideBtn) return;

        if (!this.measurementTool || !this.measurementTool.measurementGroup) {
            // Groupe pas encore prêt
            return;
        }

        if (this.measurementTool.measurementGroup.visible) {
            this.measurementTool.hideMeasurements();
            hideBtn.textContent = 'Afficher';
            hideBtn.style.background = '#4caf50';
        } else {
            this.measurementTool.showMeasurements();
            hideBtn.textContent = 'Masquer';
            hideBtn.style.background = '#757575';
        }
    }

    filterAnnotations(type) {
        // TODO: Implémenter le filtrage visuel des annotations
        console.log('📝 Filtrage par type:', type);
    }

    searchAnnotations(query) {
        const results = this.annotationTool.searchAnnotations(query);
        console.log('📝 Résultats de recherche:', results.length);
        
        // Mettre à jour la liste avec les résultats filtrés
        const listContainer = document.getElementById('annotationList');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        results.forEach((annotation) => {
            const item = document.createElement('div');
            item.className = 'annotation-item';
            item.innerHTML = `
                <div class="annotation-text">${annotation.text}</div>
                <div class="annotation-meta">
                    <span class="annotation-type-badge annotation-type-${annotation.type}">${this.getTypeIcon(annotation.type)}</span>
                    <span>${annotation.created.toLocaleDateString()}</span>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.annotationTool.editAnnotation(annotation);
            });
            
            listContainer.appendChild(item);
        });
    }

    showAnnotationList() {
        this.updateAnnotationList();
    }

    // Méthodes publiques pour l'intégration externe
    getMeasurementData() {
        return this.measurementTool.exportMeasurements();
    }

    getAnnotationData() {
        return this.annotationTool.exportAnnotations();
    }

    loadMeasurementData(data) {
        this.measurementTool.importMeasurements(data);
        this.updateMeasurementCounter();
        this.updateMeasurementList();
    }

    loadAnnotationData(data) {
        this.annotationTool.importAnnotations(data);
        this.updateAnnotationCounter();
        this.updateAnnotationList();
    }

    // Méthodes publiques pour l'intégration externe
    getTextLeaderData() {
        return this.textLeaderTool.exportTextAnnotations();
    }

    loadTextLeaderData(data) {
        if (data && Array.isArray(data)) {
            this.textLeaderTool.importTextAnnotations(data);
        }
    }

    // Méthode pour nettoyer lors de la fermeture
    destroy() {
        if (this.measurementTool) {
            this.measurementTool.deactivate();
        }
        if (this.annotationTool) {
            this.annotationTool.deactivate();
        }
        if (this.textLeaderTool) {
            this.textLeaderTool.deactivate();
        }
        
        this.hideMeasurementControls();
        this.hideAnnotationControls();
        
        console.log('🔧 Gestionnaire des outils de mesure, annotation et texte nettoyé');
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
                console.log('🔄 Fenêtre d\'aide fermée lors du changement d\'outil (MeasurementAnnotationManager)');
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

// Initialisation globale
window.MeasurementAnnotationManager = null;

// Fonction d'initialisation retardée
function initMeasurementAnnotationManager() {
    if (!window.MeasurementAnnotationManager && window.THREE) {
        window.MeasurementAnnotationManager = new MeasurementAnnotationManager();
        // console.log('✅ MeasurementAnnotationManager créé');
    }
}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que les outils soient créés
    setTimeout(initMeasurementAnnotationManager, 1000);
});

// Initialisation de secours
window.addEventListener('load', () => {
    setTimeout(() => {
        if (!window.MeasurementAnnotationManager) {
            initMeasurementAnnotationManager();
            if (window.DEBUG_APP) {
                console.log('✅ MeasurementAnnotationManager initialisé (secours)');
            }
        }
    }, 1500);
});
