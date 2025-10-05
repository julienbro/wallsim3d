/**
 * Adaptateur pour intégrer l'ancienne logique avec la nouvelle interface moderne
 */

class ModernInterfaceAdapter {
    constructor() {
        this.sceneManager = null;
        this.appInstance = null;
        this.currentTool = 'select';
        this.currentElement = null;
        this.currentMaterial = 'brick-red';
        
        this.init();
    }

    init() {
        this.setupIntegration();
        this.initializeScene();
        this.setupEventHandlers();
    }

    setupIntegration() {
        // Attendre que l'interface moderne soit prête
        if (window.modernInterface) {
            this.integrateWithModernInterface();
        } else {
            setTimeout(() => this.setupIntegration(), 100);
        }
    }

    integrateWithModernInterface() {
        const modernInterface = window.modernInterface;
        
        // Remplacer les méthodes de l'interface moderne pour intégrer la logique existante
        const originalHandleToolSelection = modernInterface.handleToolSelection.bind(modernInterface);
        modernInterface.handleToolSelection = (tool) => {
            this.currentTool = tool;
            originalHandleToolSelection(tool);
            this.updateToolMode(tool);
        };

        const originalSetView = modernInterface.setView.bind(modernInterface);
        modernInterface.setView = (view) => {
            if (this.sceneManager) {
                this.sceneManager.setCameraView(view);
            }
            originalSetView(view);
            this.updateCurrentView(view);
            // Diffuser un événement de changement de vue si le SceneManager n'a pas pu le faire
            try {
                const scope = (this.sceneManager && this.sceneManager.getCanonicalViewScope) ? this.sceneManager.getCanonicalViewScope(view) : '3d';
                document.dispatchEvent(new CustomEvent('cameraViewChanged', { detail: { viewName: view, scope } }));
            } catch (e) {
                // no-op
            }
        };

        const originalZoomIn = modernInterface.zoomIn.bind(modernInterface);
        modernInterface.zoomIn = () => {
            if (this.sceneManager && this.sceneManager.controls) {
                this.sceneManager.controls.dollyIn(1.1);
                this.sceneManager.controls.update();
            }
            originalZoomIn();
        };

        const originalZoomOut = modernInterface.zoomOut.bind(modernInterface);
        modernInterface.zoomOut = () => {
            if (this.sceneManager && this.sceneManager.controls) {
                this.sceneManager.controls.dollyOut(1.1);
                this.sceneManager.controls.update();
            }
            originalZoomOut();
        };

        const originalZoomFit = modernInterface.zoomFit.bind(modernInterface);
        modernInterface.zoomFit = () => {
            if (this.sceneManager) {
                this.sceneManager.zoomToFit();
            }
            originalZoomFit();
        };

        const originalToggleGrid = modernInterface.toggleGrid.bind(modernInterface);
        modernInterface.toggleGrid = () => {
            if (this.sceneManager) {
                this.sceneManager.toggleGrid();
            }
            originalToggleGrid();
        };

        const originalToggleAxis = modernInterface.toggleAxis.bind(modernInterface);
        modernInterface.toggleAxis = () => {
            if (this.sceneManager) {
                this.sceneManager.toggleAxes();
            }
            originalToggleAxis();
        };
    }

    initializeScene() {
        const container = document.getElementById('scene-container');
        if (!container) {
            setTimeout(() => this.initializeScene(), 100);
            return;
        }

        // Importer et adapter le SceneManager existant
        if (typeof SceneManager !== 'undefined') {
            this.sceneManager = new SceneManager();
            this.sceneManager.init(container);
            
            // Adapter les méthodes pour l'interface moderne
            this.adaptSceneManagerMethods();
        } else {
            // Créer un gestionnaire de scène basique si l'original n'est pas disponible
            this.createBasicSceneManager(container);
        }
    }

    adaptSceneManagerMethods() {
        if (!this.sceneManager) return;

        // Adapter la méthode de mise à jour des stats
        const originalUpdateStats = this.sceneManager.updateSceneStats?.bind(this.sceneManager);
        if (originalUpdateStats) {
            this.sceneManager.updateSceneStats = () => {
                originalUpdateStats();
                this.updateModernStatusBar();
            };
        }

        // Adapter la méthode de sélection d'éléments
        const originalSelectElement = this.sceneManager.selectElement?.bind(this.sceneManager);
        if (originalSelectElement) {
            this.sceneManager.selectElement = (element) => {
                const result = originalSelectElement(element);
                this.updatePropertiesPanel(element);
                return result;
            };
        }

        // Adapter la méthode d'ajout d'éléments
        const originalAddElement = this.sceneManager.addElement?.bind(this.sceneManager);
        if (originalAddElement) {
            this.sceneManager.addElement = (elementType, position, material) => {
                const result = originalAddElement(elementType, position, material || this.currentMaterial);
                this.updateModernStatusBar();
                return result;
            };
        }
    }

    createBasicSceneManager(container) {
        // Gestionnaire de scène basique si l'original n'est pas disponible
        this.sceneManager = {
            scene: new THREE.Scene(),
            camera: new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000),
            renderer: new THREE.WebGLRenderer({ canvas: container.querySelector('#threejs-canvas'), antialias: true }),
            elements: new Map(),
            
            init: () => {
                this.sceneManager.renderer.setSize(container.clientWidth, container.clientHeight);
                this.sceneManager.renderer.setClearColor(0x1a1a1a);
                this.sceneManager.camera.position.set(50, 50, 50);
                this.sceneManager.camera.lookAt(0, 0, 0);
                
                // Éclairage basique
                const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
                this.sceneManager.scene.add(ambientLight);
                
                const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
                directionalLight.position.set(10, 10, 5);
                this.sceneManager.scene.add(directionalLight);
                
                // Grille
                const gridHelper = new THREE.GridHelper(100, 100, 0x00b4d8, 0x404040);
                this.sceneManager.scene.add(gridHelper);
                
                // Ne démarrer notre boucle d'animation que si scene-manager n'en a pas
                if (!this.sceneManager.isAnimating) {
                    this.animate();
                }
            },
            
            setCameraView: (view) => {
                const positions = {
                    perspective: [10, 10, 10],
                    top: [0, 20, 0],
                    front: [0, 5, 15],
                    side: [15, 5, 0]
                };
                
                if (positions[view]) {
                    this.sceneManager.camera.position.set(...positions[view]);
                    this.sceneManager.camera.lookAt(0, 0, 0);
                }
            },
            
            toggleGrid: () => {
                const grid = this.sceneManager.scene.getObjectByName('grid');
                if (grid) {
                    grid.visible = !grid.visible;
                }
            },
            
            zoomToFit: () => {
                // Zoom pour ajuster la vue - position éloignée pour vue d'ensemble
                this.sceneManager.camera.position.set(50, 50, 50);
                this.sceneManager.camera.lookAt(0, 0, 0);
            }
        };
        
        this.sceneManager.init();
    }

    animate = () => {
        // Ne pas démarrer une nouvelle boucle si scene-manager a déjà la sienne
        if (this.sceneManager && this.sceneManager.isAnimating) {
            return; // Le scene-manager gère déjà l'animation
        }
        
        requestAnimationFrame(this.animate);
        
        if (this.sceneManager && this.sceneManager.renderer && this.sceneManager.scene && this.sceneManager.camera) {
            this.sceneManager.renderer.render(this.sceneManager.scene, this.sceneManager.camera);
        }
    }

    setupEventHandlers() {
        // Gestion des éléments de la bibliothèque
        document.addEventListener('click', (e) => {
            if (e.target.closest('.element-card')) {
                this.handleElementSelection(e.target.closest('.element-card'));
            }
        });

        // Gestion du clic sur la scène
        const canvas = document.getElementById('threejs-canvas');
        if (canvas) {
            canvas.addEventListener('click', (e) => {
                this.handleSceneClick(e);
            });
            
            canvas.addEventListener('mousemove', (e) => {
                this.handleMouseMove(e);
            });
        }

        // Gestion du redimensionnement
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Gestion des propriétés
        this.setupPropertyHandlers();
    }

    handleElementSelection(card) {
        const element = card.dataset.element;
        const material = card.dataset.material;
        const texture = card.dataset.texture;

        if (element) {
            this.currentElement = element;
            this.updateCurrentMode(`Placement ${element}`);
        } else if (material) {
            this.currentMaterial = material;
            this.updateCurrentMaterial(card.querySelector('.element-name').textContent);
        } else if (texture) {
            // Gestion des textures
            console.log('Texture sélectionnée:', texture);
        }
    }

    handleSceneClick(event) {
        if (this.currentTool === 'select') {
            // Mode sélection
            this.selectElementAtPosition(event);
        } else if (this.currentElement && this.currentTool === 'place') {
            // Mode placement
            this.placeElementAtPosition(event);
        }
    }

    handleMouseMove(event) {
        // Mettre à jour la position du curseur
        const rect = event.target.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.updateMousePosition(x, y, 0);
    }

    handleResize() {
        if (!this.sceneManager || !this.sceneManager.camera || !this.sceneManager.renderer) return;

        const container = document.getElementById('scene-container');
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        this.sceneManager.camera.aspect = width / height;
        this.sceneManager.camera.updateProjectionMatrix();
        this.sceneManager.renderer.setSize(width, height);
    }

    setupPropertyHandlers() {
        // Position
        ['posX', 'posY', 'posZ'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('change', () => this.updateSelectedElementPosition());
            }
        });

        // Rotation
        ['rotX', 'rotY', 'rotZ'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('change', () => this.updateSelectedElementRotation());
            }
        });

        // Échelle
        ['scaleX', 'scaleY', 'scaleZ'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('change', () => this.updateSelectedElementScale());
            }
        });

        // Matériau
        const materialSelect = document.getElementById('materialSelect');
        if (materialSelect) {
            materialSelect.addEventListener('change', () => {
                this.updateSelectedElementMaterial(materialSelect.value);
            });
        }
    }

    selectElementAtPosition(event) {
        // Logique de sélection d'élément avec raycasting
        console.log('Sélection d\'élément à la position:', event.clientX, event.clientY);
        // TODO: Implémenter le raycasting pour sélectionner des éléments
    }

    placeElementAtPosition(event) {
        if (!this.currentElement) return;

        // Logique de placement d'élément
        console.log('Placement d\'élément:', this.currentElement, 'à la position:', event.clientX, event.clientY);
        
        if (window.modernInterface) {
            window.modernInterface.showNotification(
                `${this.currentElement} placé avec le matériau ${this.currentMaterial}`, 
                'success'
            );
        }
        
        // TODO: Implémenter la logique de placement réelle
    }

    updatePropertiesPanel(element) {
        if (!element) return;

        // Mettre à jour les champs de propriétés avec les valeurs de l'élément
        if (element.position) {
            this.safeSetValue('posX', element.position.x);
            this.safeSetValue('posY', element.position.y);
            this.safeSetValue('posZ', element.position.z);
        }

        if (element.rotation) {
            this.safeSetValue('rotX', THREE.MathUtils.radToDeg(element.rotation.x));
            this.safeSetValue('rotY', THREE.MathUtils.radToDeg(element.rotation.y));
            this.safeSetValue('rotZ', THREE.MathUtils.radToDeg(element.rotation.z));
        }

        if (element.scale) {
            this.safeSetValue('scaleX', element.scale.x);
            this.safeSetValue('scaleY', element.scale.y);
            this.safeSetValue('scaleZ', element.scale.z);
        }
    }

    updateSelectedElementPosition() {
        const x = parseFloat(document.getElementById('posX').value) || 0;
        const y = parseFloat(document.getElementById('posY').value) || 0;
        const z = parseFloat(document.getElementById('posZ').value) || 0;
        
        // TODO: Appliquer la position à l'élément sélectionné
        console.log('Nouvelle position:', x, y, z);
    }

    updateSelectedElementRotation() {
        const x = THREE.MathUtils.degToRad(parseFloat(document.getElementById('rotX').value) || 0);
        const y = THREE.MathUtils.degToRad(parseFloat(document.getElementById('rotY').value) || 0);
        const z = THREE.MathUtils.degToRad(parseFloat(document.getElementById('rotZ').value) || 0);
        
        // TODO: Appliquer la rotation à l'élément sélectionné
        console.log('Nouvelle rotation:', x, y, z);
    }

    updateSelectedElementScale() {
        const x = parseFloat(document.getElementById('scaleX').value) || 1;
        const y = parseFloat(document.getElementById('scaleY').value) || 1;
        const z = parseFloat(document.getElementById('scaleZ').value) || 1;
        
        // TODO: Appliquer l'échelle à l'élément sélectionné
        console.log('Nouvelle échelle:', x, y, z);
    }

    updateSelectedElementMaterial(material) {
        this.currentMaterial = material;
        this.updateCurrentMaterial(material);
        
        // TODO: Appliquer le matériau à l'élément sélectionné
        console.log('Nouveau matériau:', material);
    }

    updateModernStatusBar() {
        if (!this.sceneManager) return;

        let elementCount = 0;
        if (this.sceneManager.elements && this.sceneManager.elements.size) {
            elementCount = this.sceneManager.elements.size;
        }

        this.safeUpdateElement('sceneStats', `${elementCount} objets`);
    }

    updateCurrentMode(mode) {
        this.safeUpdateElement('currentMode', mode);
    }

    updateCurrentMaterial(material) {
        this.safeUpdateElement('currentMaterial', material);
    }

    updateCurrentView(view) {
        this.safeUpdateElement('currentView', view.charAt(0).toUpperCase() + view.slice(1));
    }

    updateMousePosition(x, y, z) {
        this.safeUpdateElement('mousePosition', `X: ${x.toFixed(2)}, Y: ${y.toFixed(2)}, Z: ${z.toFixed(2)}`);
    }

    updateToolMode(tool) {
        let mode = 'Construction';
        switch(tool) {
            case 'select': mode = 'Sélection'; break;
            case 'move': mode = 'Déplacement'; break;
            case 'rotate': mode = 'Rotation'; break;
            case 'scale': mode = 'Redimensionnement'; break;
            case 'delete': mode = 'Suppression'; break;
            case 'measure': mode = 'Mesure'; break;
            default: mode = 'Construction'; break;
        }
        this.updateCurrentMode(mode);
    }

    safeUpdateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    safeSetValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value;
        }
    }
}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    window.modernInterfaceAdapter = new ModernInterfaceAdapter();
});
