// Gestionnaire de la scène 3D - CORRECTION JOINTS 11/08/2025 - elementAssiseIndex + 1 dans getAssiseHeightForType
// SceneManager - Gestion de la scène 3D et interactions
class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.grid = null;
        this.axesHelper = null;
        this.raycaster = null;
        this.mouse = null;
        this.elements = new Map(); // Stockage des éléments
        this.selectedElement = null;
        this.isInitialized = false;
        this.gridSpacing = 0.1; // cm - Grille très fine de 0.1cm (1mm) pour placement précis
        this.showGrid = false;
        this.showAxes = false; // Les axes sont masqués par défaut
        
        // Paramètres de la caméra - positions ajustées pour être moins proches
        this.cameraPositions = {
            iso: { position: [50, 50, 50], target: [0, 0, 0] },
            top: { position: [0, 80, 0], target: [0, 0, 0] },
            front: { position: [0, 35, 60], target: [0, 12, 0] },
            side: { position: [60, 35, 0], target: [0, 12, 0] }
        };

        // Système de performance
        this.frameCount = 0;
        this.lastFPSUpdate = performance.now();
        this.currentFPS = 60;
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        this.currentFPS = 0;

        // État d'importation pour éviter les événements parasites
        this.isImporting = false;
        
        // 🔧 STOCKAGE: Brique de référence pour joints automatiques
        this.lastReferenceBrick = null;
    }

    // Méthode utilitaire pour mettre à jour les éléments DOM en toute sécurité
    safeUpdateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        } else {
            console.warn(`Élément DOM avec l'ID '${elementId}' non trouvé`);
        }
    }

    init(container) {
        if (this.isInitialized) return;

        // Vérifier que THREE est disponible
        if (typeof THREE === 'undefined') {
            console.error('❌ THREE.js n\'est pas encore chargé');
            return;
        }

        // Initialiser les objets Three.js maintenant qu'ils sont disponibles
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Création de la scène
        this.scene = new THREE.Scene();
        
        // Création d'un ciel dégradé
        this.createSkyDome();
        
        // Brouillard pour l'atmosphère
        this.scene.fog = new THREE.Fog(0x87CEEB, 800, 2000);

        // Configuration de la caméra
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.camera = new THREE.PerspectiveCamera(75, width / height, 1, 2000);
        this.setCameraView('iso');

        // Configuration du renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: container.querySelector('#threejs-canvas'),
            antialias: true,
            preserveDrawingBuffer: true  // ✅ CRITIQUE pour les captures PDF
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Contrôles de la caméra
        // Vérifier que OrbitControls est disponible
        const OrbitControlsClass = window.THREE?.OrbitControls || window.OrbitControls;
        
        if (!OrbitControlsClass) {
            console.warn('OrbitControls non disponible. Tentative de chargement alternatif...');
            
            // Initialiser les variables même sans OrbitControls
            this.isOrbiting = false;
            this.orbitStartTime = 0;
            this.orbitStartPosition = { x: 0, y: 0 };
            this.orbitMovementThreshold = 5;
            this.hasOrbitMoved = false;
            
            // Créer des contrôles basiques en attendant
            this.setupBasicControls();
        } else {
            this.controls = new OrbitControlsClass(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.minDistance = 5;
            this.controls.maxDistance = 1000;
            this.controls.maxPolarAngle = Math.PI / 2;
            
            // Configuration du zoom avec la molette
            this.controls.enableZoom = true;
            this.controls.zoomSpeed = 1.0;
            this.controls.enableRotate = true;
            this.controls.rotateSpeed = 1.0;
            this.controls.enablePan = true;
            this.controls.panSpeed = 1.0;
            this.controls.keyPanSpeed = 7.0;
            
            // ✨ NOUVEAU: Configuration du bouton du milieu pour le pannage
            this.controls.mouseButtons = {
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.PAN,  // Bouton du milieu pour déplacer la vue
                RIGHT: THREE.MOUSE.PAN    // Bouton droit aussi pour le pannage (optionnel)
            };
            
            // Variables pour détecter les mouvements d'orbit
            this.isOrbiting = false;
            this.orbitStartTime = 0;
            this.orbitStartPosition = { x: 0, y: 0 };
            this.orbitMovementThreshold = 5; // Seuil de mouvement en pixels
            this.hasOrbitMoved = false;
            this.currentMousePosition = { x: 0, y: 0 };
            
            // Suivre la position de la souris
            this.renderer.domElement.addEventListener('mousedown', (event) => {
                this.orbitStartPosition.x = event.clientX;
                this.orbitStartPosition.y = event.clientY;
                this.currentMousePosition.x = event.clientX;
                this.currentMousePosition.y = event.clientY;
            });
            
            this.renderer.domElement.addEventListener('mousemove', (event) => {
                this.currentMousePosition.x = event.clientX;
                this.currentMousePosition.y = event.clientY;
                
                if (this.isOrbiting && !this.hasOrbitMoved) {
                    const deltaX = Math.abs(event.clientX - this.orbitStartPosition.x);
                    const deltaY = Math.abs(event.clientY - this.orbitStartPosition.y);
                    const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    
                    if (totalMovement > this.orbitMovementThreshold) {
                        this.hasOrbitMoved = true;
                        // 
                    }
                }
            });
            
            // Écouter les événements OrbitControls
            this.controls.addEventListener('start', () => {
                this.isOrbiting = true;
                this.orbitStartTime = Date.now();
                this.hasOrbitMoved = false;
                // 
            });
            
            this.controls.addEventListener('end', () => {
                const orbitDuration = Date.now() - this.orbitStartTime;
                
                // Si l'orbit a duré moins de 150ms et qu'il n'y a pas eu de mouvement,
                // c'est un clic simple - permettre immédiatement
                if (orbitDuration < 150 && !this.hasOrbitMoved) {
                    this.isOrbiting = false;
                    // 
                } else if (!this.hasOrbitMoved) {
                    // Clic simple mais plus long - délai réduit
                    setTimeout(() => {
                        this.isOrbiting = false;
                        // 
                    }, 25);
                } else {
                    // Vraie rotation de caméra - délai plus long
                    setTimeout(() => {
                        this.isOrbiting = false;
                        // 
                    }, 100);
                }
            });
        }

        // Éclairage
        this.setupLighting();

        // Grille
        this.createGrid();
        
        // Axes
        this.createAxes();

        // Marquer comme initialisé dès que la scène est prête
        this.isInitialized = true;

        // Flèche Nord
        this.createNorthArrow();

        // Plan de sol (invisible pour les collisions)
        this.createGroundPlane();

        // Event listeners
        this.setupEventListeners();

        this.animate();
    }

    setupLighting() {
        // Lumière ambiante - Maximum blanc et intensité
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.5);
        this.scene.add(ambientLight);

        // Lumière directionnelle (soleil) - Intensité maximale
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);

        // Lumière ponctuelle principale - Très intense
        const pointLight = new THREE.PointLight(0xffffff, 1.0, 200);
        pointLight.position.set(-50, 50, -50);
        this.scene.add(pointLight);

        // Lumière ponctuelle supplémentaire 1
        const pointLight2 = new THREE.PointLight(0xffffff, 0.8, 200);
        pointLight2.position.set(50, 50, 50);
        this.scene.add(pointLight2);

        // Lumière ponctuelle supplémentaire 2
        const pointLight3 = new THREE.PointLight(0xffffff, 0.8, 200);
        pointLight3.position.set(0, 100, 0);
        this.scene.add(pointLight3);

        // Lumière directionnelle supplémentaire depuis l'autre côté
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight2.position.set(-100, 100, -50);
        this.scene.add(directionalLight2);
        pointLight.position.set(-50, 50, -50);
        this.scene.add(pointLight);
    }

    createGrid() {
        if (this.grid) {
            this.scene.remove(this.grid);
        }

        const size = 500; // Taille de la grille en cm
        const divisions = size / this.gridSpacing;

        this.grid = new THREE.GridHelper(size, divisions, 0xaaaaaa, 0x666666);
        this.grid.material.opacity = 0.6;
        this.grid.material.transparent = true;
        this.grid.visible = this.showGrid;
        this.scene.add(this.grid);
    }

    createAxes() {
        if (this.axesHelper) {
            this.scene.remove(this.axesHelper);
        }

        // Créer les axes d'aide avec une taille de 50cm
        this.axesHelper = new THREE.AxesHelper(50);
        this.axesHelper.visible = this.showAxes;
        this.scene.add(this.axesHelper);
    }

    createNorthArrow() {
        // Vérifier que la scène est initialisée
        if (!this.scene) {
            console.warn('⚠️ SceneManager: Impossible de créer la flèche du Nord - scène non initialisée');
            return;
        }
        
        // Supprimer l'ancienne flèche si elle existe
        if (this.northArrowGroup) {
            this.scene.remove(this.northArrowGroup);
        }

        // Groupe pour la flèche nord
        this.northArrowGroup = new THREE.Group();
        
        // Ajouter un identifiant unique pour faciliter la reconnaissance
        this.northArrowGroup.userData = {
            type: 'northArrow',
            name: 'rose-des-vents',
            description: 'Flèche du Nord - Boussole de navigation'
        };

        // Position de la flèche (coin de la grille)
        const arrowPosition = { x: 200, y: 1, z: 200 };

        // 1. Corps de la flèche (cylindre) - orienté horizontalement
        const shaftGeometry = new THREE.CylinderGeometry(2, 2, 30);
        const shaftMaterial = new THREE.MeshLambertMaterial({ color: 0xff4444 });
        const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        shaft.position.set(0, 2, 15); // Position horizontale sur le plateau
        shaft.rotation.x = Math.PI / 2; // Rotation pour coucher la flèche

        // 2. Pointe de la flèche (cône) - orientée horizontalement
        const headGeometry = new THREE.ConeGeometry(6, 15);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 2, 30); // Position au bout de la flèche
        head.rotation.x = Math.PI / 2; // Rotation pour coucher la pointe

        // 3. Base circulaire
        const baseGeometry = new THREE.CylinderGeometry(12, 12, 2);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(0, 1, 0);

        // 4. Texte "N" au-dessus de la flèche
        // Créer le texte "N" de façon simple avec des géométries
        const textGroup = new THREE.Group();
        
        // Créer le "N" avec des cylindres (plus simple que les fonts)
        const letterMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        
        // Barre gauche du N - ajustée pour flèche horizontale
        const leftBar = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 12),
            letterMaterial
        );
        leftBar.position.set(-4, 4, 0);
        leftBar.rotation.x = Math.PI / 2; // Coucher la lettre
        
        // Barre droite du N - ajustée pour flèche horizontale
        const rightBar = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 12),
            letterMaterial
        );
        rightBar.position.set(4, 4, 0);
        rightBar.rotation.x = Math.PI / 2; // Coucher la lettre
        
        // Barre diagonale du N - ajustée pour flèche horizontale
        const diagBar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 12),
            letterMaterial
        );
        diagBar.position.set(0, 4, 0);
        diagBar.rotation.x = Math.PI / 2; // Coucher la lettre
        diagBar.rotation.z = Math.PI / 4;
        
        textGroup.add(leftBar);
        textGroup.add(rightBar);
        textGroup.add(diagBar);

        // 5. Cercle de boussole sur la base - ajusté pour flèche horizontale
        const compassGeometry = new THREE.RingGeometry(8, 10, 0, Math.PI * 2);
        const compassMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x666666,
            side: THREE.DoubleSide 
        });
        const compass = new THREE.Mesh(compassGeometry, compassMaterial);
        compass.rotation.x = -Math.PI / 2; // Garder horizontal
        compass.position.y = 2.1;

        // Assembler tous les composants
        this.northArrowGroup.add(base);
        this.northArrowGroup.add(shaft);
        this.northArrowGroup.add(head);
        this.northArrowGroup.add(textGroup);
        this.northArrowGroup.add(compass);

        // Positionner le groupe
        this.northArrowGroup.position.set(arrowPosition.x, arrowPosition.y, arrowPosition.z);
        
        // Rotation initiale (0° = Nord vers le haut dans la scène)
        // Correction: ajouter 180° pour que 0° pointe vraiment vers le nord
        this.northArrowGroup.rotation.y = Math.PI;

        // Ajouter à la scène
        this.scene.add(this.northArrowGroup);

        // console.log('🧭 Flèche du Nord créée à la position:', arrowPosition);
    }

    createGroundPlane() {
        // Plan invisible pour les interactions
        const geometry = new THREE.PlaneGeometry(1000, 1000);
        const material = new THREE.MeshBasicMaterial({ 
            visible: false,
            side: THREE.DoubleSide
        });
        this.groundPlane = new THREE.Mesh(geometry, material);
        this.groundPlane.rotation.x = -Math.PI / 2;
        this.groundPlane.position.y = 0;
        
        // ✨ IDENTIFICATION POUR MASQUAGE PDF ✨
        this.groundPlane.name = 'WallSim3D_InteractionPlane';
        this.groundPlane.userData = {
            type: 'interaction',
            category: 'plane',
            isGround: true,
            maskInTopView: true,
            description: 'Plan d\'interaction invisible'
        };
        
        this.scene.add(this.groundPlane);
        
        // Sol visible gris
        this.createGroundFloor();
    }

    createSkyDome() {
        // Créer une sphère pour le ciel avec un dégradé bleu
        const skyGeometry = new THREE.SphereGeometry(1500, 32, 32);
        
        // Créer un matériau avec un dégradé vertical
        const skyMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec3 pointOnSphere = normalize(vWorldPosition);
                    float h = normalize(vWorldPosition + 1500.0).y;
                    
                    // Couleurs du dégradé - version adoucie
                    vec3 topColor = vec3(0.7, 0.85, 0.95);     // Bleu très clair en haut
                    vec3 horizonColor = vec3(0.9, 0.95, 0.98); // Bleu-blanc à l'horizon
                    vec3 bottomColor = vec3(0.85, 0.9, 0.95);  // Gris-bleu très clair en bas
                    
                    vec3 color = mix(bottomColor, horizonColor, smoothstep(0.0, 0.5, h));
                    color = mix(color, topColor, smoothstep(0.5, 1.0, h));
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        this.skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(this.skyDome);
    }

    createGroundFloor() {
        // Créer un grand plan gris pour le sol
        const floorGeometry = new THREE.PlaneGeometry(2000, 2000);
        const floorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xccccc9,  // Gris clair légèrement jaunâtre
            // CORRECTION: Rendre le plateau complètement opaque pour éviter les problèmes de masquage
            transparent: false,
            opacity: 1.0
        });
        
        this.groundFloor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.groundFloor.rotation.x = -Math.PI / 2;
        this.groundFloor.position.y = -0.1; // Légèrement en dessous du plan d'interaction
        this.groundFloor.receiveShadow = true;
        
        // ✨ IDENTIFICATION POUR MASQUAGE PDF ✨
        this.groundFloor.name = 'WallSim3D_GroundFloor';
        this.groundFloor.userData = {
            type: 'ground',
            category: 'floor',
            isGround: true,
            maskInTopView: true,
            description: 'Sol gris de la scène'
        };
        
        this.scene.add(this.groundFloor);
    }

    setupEventListeners() {
        // Resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Mouse events
        this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event));
        this.renderer.domElement.addEventListener('click', (event) => this.onMouseClick(event));
        this.renderer.domElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            this.onRightClick(event);
        });
        
        // Variables pour tracker le mouvement réel de la souris
        this.mouseMovingInScene = false;
        this.lastMousePosition = { x: 0, y: 0 };
        this.isMouseInScene = false;

        // Masquer la brique fantôme quand la souris quitte la scène - VERSION SIMPLIFIÉE
        this.renderer.domElement.addEventListener('mouseleave', () => {
            this.isMouseInScene = false;
            this.mouseMovingInScene = false;
            if (window.ConstructionTools && window.ConstructionTools.ghostElement && window.ConstructionTools.ghostElement.mesh) {
                window.ConstructionTools.ghostElement.mesh.visible = false;
                // console.log('👻 Brique fantôme masquée - souris hors de la scène');
            }
        });
        
        // Détecter l'entrée dans la scène sans réafficher automatiquement - VERSION SIMPLIFIÉE
        this.renderer.domElement.addEventListener('mouseenter', () => {
            this.isMouseInScene = true;
            // Ne pas réafficher automatiquement, attendre un mouvement réel
            // console.log('👻 Souris dans la scène - attente mouvement pour réafficher');
        });
        
        // Masquer la brique fantôme quand on survole les menus - DÉSACTIVÉ
        // this.setupMenuHoverHandlers();
        
        // Écouter les changements d'assise pour mettre à jour le plan de collision
        document.addEventListener('assiseChanged', (event) => {
            // // console.log(`🎯 SceneManager: Mise à jour du plan de collision pour assise ${event.detail.assise} (hauteur: ${event.detail.height} cm)`);
            this.groundPlane.position.y = event.detail.height;
        });
    }

    onWindowResize() {
        const container = document.getElementById('scene-container');
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    // setupMenuHoverHandlers() - MÉTHODE DÉSACTIVÉE
    // Cette méthode masquait automatiquement la brique fantôme lors du survol des menus
    /*
    setupMenuHoverHandlers() {
        // Masquer la brique fantôme quand on survole les menus
        const hideGhost = () => {
            if (window.ConstructionTools && window.ConstructionTools.ghostElement && window.ConstructionTools.ghostElement.mesh) {
                window.ConstructionTools.ghostElement.mesh.visible = false;
            }
        };

        // Cibler tous les éléments de menu
        const menuSelectors = [
            '.menu-bar',
            '.menu-item',
            '.submenu',
            '.menu-button',
            '.dropdown-menu',
            '.toolbar',
            '.control-panel',
            '.floating-menu',
            '#presentationModal'  // Modal de présentation
        ];

        // Ajouter les événements de survol sur tous les menus
        menuSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.addEventListener('mouseenter', hideGhost);
            });
        });

        // Observer les nouveaux éléments de menu ajoutés dynamiquement
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        menuSelectors.forEach(selector => {
                            if (node.matches && node.matches(selector)) {
                                node.addEventListener('mouseenter', hideGhost);
                            }
                            // Également vérifier les enfants
                            const children = node.querySelectorAll && node.querySelectorAll(selector);
                            if (children) {
                                children.forEach(child => {
                                    child.addEventListener('mouseenter', hideGhost);
                                });
                            }
                        });
                    }
                });
            });
        });

        // Observer les changements dans le DOM
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Ajouter un événement global de document pour capturer tous les survols en dehors de la scène
        document.addEventListener('mouseover', (event) => {
            // Vérifier si la souris est sur un élément qui n'est pas la scène 3D
            const sceneContainer = document.getElementById('scene-container');
            const canvas = this.renderer.domElement;
            
            if (sceneContainer && canvas && !sceneContainer.contains(event.target) && !canvas.contains(event.target)) {
                // On est en dehors de la scène 3D, masquer le fantôme
                if (window.ConstructionTools && window.ConstructionTools.ghostElement && window.ConstructionTools.ghostElement.mesh) {
                    window.ConstructionTools.ghostElement.mesh.visible = false;
                }
            }
        });
    }
    */

    onMouseMove(event) {
        // Throttling réduit du mouvement de souris pour une meilleure réactivité
        if (this._mouseMoveThrottle) {
            return;
        }
        
        this._mouseMoveThrottle = setTimeout(() => {
            this._mouseMoveThrottle = null;
        }, 4); // Réduit à 4ms pour ~240fps maximum
        
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Détecter le mouvement réel de la souris pour réafficher la brique fantôme
        if (this.isMouseInScene) {
            const currentPosition = { x: event.clientX, y: event.clientY };
            
            // Vérifier si la souris bouge réellement (seuil réduit pour plus de réactivité)
            const deltaX = Math.abs(currentPosition.x - this.lastMousePosition.x);
            const deltaY = Math.abs(currentPosition.y - this.lastMousePosition.y);
            const isRealMovement = deltaX > 1 || deltaY > 1; // Seuil réduit à 1px
            
            if (isRealMovement && !this.mouseMovingInScene) {
                this.mouseMovingInScene = true;
                
                // Réafficher la brique fantôme seulement lors d'un mouvement réel
                if (window.ConstructionTools && window.ConstructionTools.ghostElement && 
                    window.ConstructionTools.showGhost && !window.ConstructionTools.activeBrickForSuggestions &&
                    window.ConstructionTools.ghostElement.mesh) {
                    window.ConstructionTools.ghostElement.mesh.visible = true;
                    // console.log('👻 Brique fantôme réaffichée - mouvement détecté');
                }
            }
            
            this.lastMousePosition = currentPosition;
        }

        // Mise à jour de la position du curseur (immédiate pour la réactivité)
        this.updateCursorPosition();
        
        // Gestion du survol des suggestions - réduit mais pas trop
        if (this._suggestionHoverFrame % 2 === 0) {
            this.handleSuggestionHover();
        }
        this._suggestionHoverFrame = (this._suggestionHoverFrame || 0) + 1;
        
        // Gestion du survol des points d'accroche - moins fréquent  
        if (this._attachmentHoverFrame % 4 === 0) {
            this.handleAttachmentPointHover();
        }
        this._attachmentHoverFrame = (this._attachmentHoverFrame || 0) + 1;
    }

    updateCursorPosition() {
        // CORRECTION RAYCASTING HAUTEUR ASSISES:
        // Obtenir la hauteur de l'assise courante et mettre à jour le plan de collision
        // Cela corrige le problème où le curseur fantôme ne suivait pas la souris en X/Z
        // quand l'assise était en hauteur (le plan était fixé à Y=0)
        const currentAssiseHeight = window.AssiseManager ? window.AssiseManager.getAssiseHeight(window.AssiseManager.currentAssise) : 0;
        
        // Mettre à jour la position du plan de collision à la hauteur de l'assise courante
        this.groundPlane.position.y = currentAssiseHeight;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.groundPlane);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            const snapToGrid = (value) => Math.round(value / this.gridSpacing) * this.gridSpacing;
            
            const x = snapToGrid(point.x);
            const z = snapToGrid(point.z);

            // Mise à jour de l'affichage
            this.safeUpdateElement('cursorX', x);
            this.safeUpdateElement('cursorZ', z);

            // Émettre un événement pour d'autres composants
            document.dispatchEvent(new CustomEvent('cursorMove', {
                detail: { x, z }
            }));
        }
    }

    onMouseClick(event) {        
        try {
            // 🆕 NOUVEAU: Sauvegarder l'événement de souris pour l'analyse des faces
            this.lastMouseEvent = event;
            
            // Vérifier si le menu flottant d'assise est en mode d'activation
            if (window.FloatingAssiseMenu && window.FloatingAssiseMenu.isInSelectMode()) {
                return; // Laisser le menu flottant gérer le clic
            }
            
            // Éviter le placement seulement si un vrai mouvement d'orbit est détecté
            if (this.isOrbiting && this.hasOrbitMoved) {
                return;
            }
            
            // Initialiser le raycaster
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            // 🔧 CAPTURE PRÉCOCE: Capturer la référence AVANT tous les appels à deactivateSuggestions
            let globalCapturedReferenceElement = null;
            if (window.ConstructionTools && window.ConstructionTools.activeBrickForSuggestions) {
                globalCapturedReferenceElement = window.ConstructionTools.activeBrickForSuggestions;
                // console.log('🔧 CAPTURE GLOBALE: Référence capturée depuis activeBrickForSuggestions =', globalCapturedReferenceElement?.id || 'none');
            } else if (this.lastReferenceBrick) {
                globalCapturedReferenceElement = this.lastReferenceBrick;
                // console.log('🔧 CAPTURE GLOBALE: Référence capturée depuis lastReferenceBrick =', globalCapturedReferenceElement?.id || 'none');
            } else {
                // console.log('🔧 CAPTURE GLOBALE: Aucune référence active à capturer');
            }
            
            // RESTAURATION 3: Vérifier les suggestions (sécurisé)
            if (window.ConstructionTools && 
                window.ConstructionTools.suggestionGhosts && 
                Array.isArray(window.ConstructionTools.suggestionGhosts) &&
                window.ConstructionTools.suggestionGhosts.length > 0) {
                
                const suggestionMeshes = window.ConstructionTools.suggestionGhosts.map(ghost => ghost.mesh);
                const suggestionIntersects = this.raycaster.intersectObjects(suggestionMeshes);
                
                if (suggestionIntersects.length > 0) {
                    
                    
                    // RESTAURATION 5: Logique complète des suggestions
                    const suggestion = suggestionIntersects[0].object.userData;
                    const ghost = window.ConstructionTools.suggestionGhosts.find(g => 
                        g.mesh.userData.suggestionIndex === suggestion.suggestionIndex
                    );
                    
                    if (ghost) {
                        if (ghost.mesh.userData.isVerticalJoint || ghost.mesh.userData.isHorizontalJoint) {
                            // Placement d'un joint
                            
                            if (window.ConstructionTools.placeVerticalJoint) {
                                const success = window.ConstructionTools.placeVerticalJoint(ghost);
                                if (success && this.deselectElement) {
                                    this.deselectElement();
                                }
                            }
                        } else {
                            // Placement d'une suggestion de brique
                            // console.log('🔧 DEBUG: Placement d\'une suggestion de brique');
                            
                            // Vérifier si c'est une suggestion perpendiculaire pour créer automatiquement les joints
                            const suggestionType = ghost.mesh.userData.suggestionType;
                            // console.log('🔧 DEBUG: suggestionType =', suggestionType);
                            
                            const isPerpendicularSuggestion = suggestionType === 'perpendiculaire-frontale-droite' || 
                                                             suggestionType === 'perpendiculaire-frontale-gauche' ||
                                                             suggestionType === 'perpendiculaire-dorsale-droite' ||
                                                             suggestionType === 'perpendiculaire-dorsale-gauche';
                            
                            // console.log('🔧 DEBUG: isPerpendicularSuggestion =', isPerpendicularSuggestion);
                            
                            // Vérifier si c'est une suggestion d'angle
                            const isAngleSuggestion = suggestionType === 'angle-panneresse-droite' || 
                                                    suggestionType === 'angle-panneresse-gauche' ||
                                                    suggestionType === 'angle-panneresse-droite-arriere' ||
                                                    suggestionType === 'angle-panneresse-gauche-arriere' ||
                                                    suggestionType === 'angle-boutisse-droite' ||
                                                    suggestionType === 'angle-boutisse-gauche' ||
                                                    suggestionType === 'angle-boutisse-droite-avant' ||
                                                    suggestionType === 'angle-boutisse-gauche-avant' ||
                                                    suggestionType === 'angle-boutisse-droite-arriere' ||
                                                    suggestionType === 'angle-boutisse-gauche-arriere';
                            
                            // console.log('🔧 DEBUG: isAngleSuggestion =', isAngleSuggestion);
                            
                            // Stocker les informations pour la création de joint après placement
                            let referenceElement = null;
                            // console.log('🔧 DEBUG: État initial activeBrickForSuggestions =', window.ConstructionTools?.activeBrickForSuggestions?.id || 'none');
                            
                            if ((isPerpendicularSuggestion || isAngleSuggestion) && window.ConstructionTools && window.ConstructionTools.activeBrickForSuggestions) {
                                referenceElement = window.ConstructionTools.activeBrickForSuggestions;
                                // console.log('🔧 DEBUG: referenceElement =', referenceElement?.id);
                            } else {
                                /*
                                // console.log('🔧 DEBUG: referenceElement non défini - Conditions:', {
                                    isPerpendicularSuggestion,
                                    isAngleSuggestion,
                                    hasConstructionTools: !!window.ConstructionTools,
                                    hasActiveBrick: !!window.ConstructionTools?.activeBrickForSuggestions,
                                    activeBrickId: window.ConstructionTools?.activeBrickForSuggestions?.id || 'none'
                                });
                                */
                            }
                            
                            // Capturer referenceElement pour le callback d'animation - PRIORITÉ GLOBALE
                            const capturedReferenceElement = referenceElement || globalCapturedReferenceElement;
                            //                             
                            if (this.animateSuggestionPlacement) {
                                this.animateSuggestionPlacement(ghost, () => {
                                    const placedElement = this.placeElementAt(ghost.position.x, ghost.position.z, ghost.rotation);
                                    
                                    // Créer automatiquement le joint de boutisse pour les suggestions perpendiculaires, d'angle ET de continuité
                                    
                                    // Conditions pour créer un joint vertical automatique
                                    const shouldCreateVerticalJoint = (isPerpendicularSuggestion || isAngleSuggestion || suggestionType.includes('continuity')) 
                                        && placedElement && window.ConstructionTools;
                                    
                                    if (shouldCreateVerticalJoint) {
                                        // console.log('🔧 DEBUG: Création automatique de joint pour', suggestionType);
                                        // Passer aussi la brique de référence pour déterminer le bon côté
                                        this.createAutomaticJointForPerpendicular(placedElement, suggestionType, capturedReferenceElement);
                                    } else {
                                        // console.log('⚠️ DEBUG: Conditions non remplies pour création automatique de joint de boutisse');
                                    }
                                    
                                    // DEBUG: Afficher la lettre pour les suggestions de continuation
                                    if (suggestionType === 'continuation') {
                                        // console.log('🔧 DEBUG: Suggestion de continuation, lettre =', ghost.mesh.userData.letter || 'non définie');
                                    }
                                    
                                    // NOUVELLE FONCTIONNALITÉ : Joint horizontal automatique pour chaque brique posée
                                    // console.log('🔧 Création automatique du joint horizontal pour chaque brique posée');
                                    this.createAutomaticHorizontalJoint(placedElement || this.getLastPlacedElement());
                                    
                                    // LOGIQUE UNIVERSELLE DE JOINTS VERTICAUX AUTOMATIQUES
                                    if (suggestionType === 'continuation' && ghost.mesh.userData.letter) {
                                        const position = ghost.mesh.userData.letter;
                                        // console.log('🔧 LOGIQUE UNIVERSELLE: Position détectée =', position);
                                        
                                        // Déterminer le côté du joint selon la position
                                        const isLeftSide = this.shouldCreateLeftJoint(position, suggestionType);
                                        const targetElement = placedElement || this.getLastPlacedElement();
                                        
                                        if (isLeftSide) {
                                            // console.log('🔧 UNIVERSEL: Création joint vertical gauche pour position', position);
                                            this.createAutomaticLeftVerticalJoint(targetElement);
                                        } else {
                                            // console.log('🔧 UNIVERSEL: Création joint vertical droit pour position', position);
                                            this.createAutomaticRightVerticalJoint(targetElement);
                                        }
                                    }
                                    
                                    // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position C
                                    if (suggestionType === 'perpendiculaire-frontale-droite' && ghost.mesh.userData.letter === 'C') {
                                        // Utiliser l'élément nouvellement placé au lieu de referenceElement
                                        this.createAutomaticLeftVerticalJoint(placedElement || this.getLastPlacedElement());
                                    }
                                    
                                    // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position D
                                    if (suggestionType === 'perpendiculaire-frontale-gauche' && ghost.mesh.userData.letter === 'D') {
                                        // Utiliser l'élément nouvellement placé au lieu de referenceElement
                                        this.createAutomaticLeftVerticalJoint(placedElement || this.getLastPlacedElement());
                                    }
                                    
                                    // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position E
                                    if (suggestionType === 'perpendiculaire-dorsale-droite' && ghost.mesh.userData.letter === 'E') {
                                        // Utiliser l'élément nouvellement placé au lieu de referenceElement
                                        this.createAutomaticRightVerticalJoint(placedElement || this.getLastPlacedElement());
                                    }
                                    
                                    // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position F
                                    if (suggestionType === 'perpendiculaire-dorsale-gauche' && ghost.mesh.userData.letter === 'F') {
                                        // Utiliser l'élément nouvellement placé au lieu de referenceElement
                                        this.createAutomaticRightVerticalJoint(placedElement || this.getLastPlacedElement());
                                    }
                                    
                                    // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position G - sur la brique de référence
                                    if (suggestionType === 'angle-panneresse-droite' && ghost.mesh.userData.letter === 'G') {
                                        // Utiliser la brique de référence (celle qui était déjà posée)
                                        this.createAutomaticRightVerticalJoint(capturedReferenceElement);
                                    }
                                    
                                    // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position I - sur la brique de référence
                                    if (suggestionType === 'angle-panneresse-droite-arriere' && ghost.mesh.userData.letter === 'I') {
                                        // Utiliser la brique de référence (celle qui était déjà posée)
                                        this.createAutomaticRightVerticalJoint(capturedReferenceElement);
                                    }
                                    
                                    // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position H - sur la brique de référence
                                    if (suggestionType === 'angle-panneresse-gauche' && ghost.mesh.userData.letter === 'H') {
                                        // Utiliser la brique de référence (celle qui était déjà posée)
                                        this.createAutomaticLeftVerticalJoint(capturedReferenceElement);
                                    }
                                    
                                    // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position J - sur la brique de référence
                                    if (suggestionType === 'angle-panneresse-gauche-arriere' && ghost.mesh.userData.letter === 'J') {
                                        // Utiliser la brique de référence (celle qui était déjà posée)
                                        this.createAutomaticLeftVerticalJoint(capturedReferenceElement);
                                    }
                                    
                                    // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position S (boutisse) - sur la brique de référence
                                    if (suggestionType === 'angle-boutisse-droite' && ghost.mesh.userData.letter === 'S') {
                                        // Utiliser la brique de référence (celle qui était déjà posée)
                                        this.createAutomaticRightVerticalJoint(capturedReferenceElement);
                                    }
                                    
                                    // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position T (boutisse) - sur la brique de référence
                                    if (suggestionType === 'angle-boutisse-gauche' && ghost.mesh.userData.letter === 'T') {
                                        // Utiliser la brique de référence (celle qui était déjà posée)
                                        this.createAutomaticLeftVerticalJoint(capturedReferenceElement);
                                    }
                                    
                                    // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position U (boutisse avant) - sur la brique de référence
                                    if (suggestionType === 'angle-boutisse-droite-avant' && ghost.mesh.userData.letter === 'U') {
                                        // Utiliser la brique de référence (celle qui était déjà posée)
                                        this.createAutomaticRightVerticalJoint(capturedReferenceElement);
                                    }
                                    
                                    // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position V (boutisse avant) - sur la brique de référence
                                    if (suggestionType === 'angle-boutisse-gauche-avant' && ghost.mesh.userData.letter === 'V') {
                                        // Utiliser la brique de référence (celle qui était déjà posée)
                                        this.createAutomaticLeftVerticalJoint(capturedReferenceElement);
                                    }
                                    
                                    // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position M (boutisse continuation droite) - sur la brique nouvellement placée
                                    if (suggestionType === 'continuation' && ghost.mesh.userData.letter === 'M') {
                                        // Utiliser la brique nouvellement placée
                                        this.createAutomaticLeftVerticalJoint(placedElement || this.getLastPlacedElement());
                                    }
                                    
                                    // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position N (boutisse continuation gauche) - sur la brique nouvellement placée
                                    if (suggestionType === 'continuation' && ghost.mesh.userData.letter === 'N') {
                                                                                console.log('🔧 DEBUG: placedElement pour N =', placedElement?.id);
                                        // Utiliser la brique nouvellement placée
                                        this.createAutomaticRightVerticalJoint(placedElement || this.getLastPlacedElement());
                                    }
                                    
                                    // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position O (boutisse perpendiculaire frontale droite) - sur la brique nouvellement placée
                                    if (suggestionType === 'perpendiculaire-frontale-droite' && ghost.mesh.userData.letter === 'O') {
                                                                                console.log('🔧 DEBUG: placedElement pour O =', placedElement?.id);
                                        // Utiliser la brique nouvellement placée
                                        this.createAutomaticLeftVerticalJoint(placedElement || this.getLastPlacedElement());
                                    }
                                    
                                    // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position P (boutisse perpendiculaire frontale gauche) - sur la brique nouvellement placée
                                    if (suggestionType === 'perpendiculaire-frontale-gauche' && ghost.mesh.userData.letter === 'P') {
                                                                                console.log('🔧 DEBUG: placedElement pour P =', placedElement?.id);
                                        // Utiliser la brique nouvellement placée
                                        this.createAutomaticLeftVerticalJoint(placedElement || this.getLastPlacedElement());
                                    }
                                    
                                    // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position Q (boutisse perpendiculaire dorsale droite) - sur la brique nouvellement placée
                                    if (suggestionType === 'perpendiculaire-dorsale-droite' && ghost.mesh.userData.letter === 'Q') {
                                                                                console.log('🔧 DEBUG: placedElement pour Q =', placedElement?.id);
                                        // Utiliser la brique nouvellement placée
                                        this.createAutomaticRightVerticalJoint(placedElement || this.getLastPlacedElement());
                                    }
                                    
                                    // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position R (boutisse perpendiculaire dorsale gauche) - sur la brique nouvellement placée
                                    if (suggestionType === 'perpendiculaire-dorsale-gauche' && ghost.mesh.userData.letter === 'R') {
                                                                                console.log('🔧 DEBUG: placedElement pour R =', placedElement?.id);
                                        // Utiliser la brique nouvellement placée
                                        this.createAutomaticRightVerticalJoint(placedElement || this.getLastPlacedElement());
                                    }
                                    
                                    // Désactiver les suggestions APRÈS avoir créé les joints
                                    if (window.ConstructionTools.deactivateSuggestions) {
                                        window.ConstructionTools.deactivateSuggestions();
                                    }
                                    
                                    // 🔧 NETTOYAGE: Réinitialiser la référence après usage
                                    this.lastReferenceBrick = null;
                                    // console.log('🔧 NETTOYAGE: lastReferenceBrick réinitialisée');
                                });
                            } else {
                                // Fallback sans animation
                                const placedElement = this.placeElementAt(ghost.position.x, ghost.position.z, ghost.rotation);
                                
                                // Créer automatiquement le joint de boutisse pour les suggestions perpendiculaires
                                // console.log('🔧 DEBUG CONDITIONS (fallback):', {
                                //     isPerpendicularSuggestion,
                                //     hasPlacedElement: !!placedElement,
                                //     hasConstructionTools: !!window.ConstructionTools,
                                //     suggestionType
                                // });
                                if (isPerpendicularSuggestion && placedElement && window.ConstructionTools) {
                                    // console.log('🔧 DEBUG: Création automatique de joint pour', suggestionType);
                                    // Passer aussi la brique de référence pour déterminer le bon côté
                                    this.createAutomaticJointForPerpendicular(placedElement, suggestionType, capturedReferenceElement);
                                } else {
                                    // console.log('⚠️ DEBUG: Conditions non remplies pour création automatique de joint de boutisse (fallback)');
                                }
                                
                                // NOUVELLE FONCTIONNALITÉ : Joint horizontal automatique pour chaque brique posée
                                // console.log('🔧 Création automatique du joint horizontal pour chaque brique posée (fallback)');
                                this.createAutomaticHorizontalJoint(placedElement || this.getLastPlacedElement());
                                
                                // LOGIQUE UNIVERSELLE DE JOINTS VERTICAUX AUTOMATIQUES (FALLBACK)
                                if (suggestionType === 'continuation' && ghost.mesh.userData.letter) {
                                    const position = ghost.mesh.userData.letter;
                                    console.log('🔧 LOGIQUE UNIVERSELLE (fallback): Position détectée =', position);
                                    
                                    // Déterminer le côté du joint selon la position
                                    const isLeftSide = this.shouldCreateLeftJoint(position, suggestionType);
                                    const targetElement = placedElement || this.getLastPlacedElement();
                                    
                                    if (isLeftSide) {
                                        console.log('🔧 UNIVERSEL (fallback): Création joint vertical gauche pour position', position);
                                        this.createAutomaticLeftVerticalJoint(targetElement);
                                    } else {
                                        console.log('🔧 UNIVERSEL (fallback): Création joint vertical droit pour position', position);
                                        this.createAutomaticRightVerticalJoint(targetElement);
                                    }
                                }
                                
                                // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position C
                                if (suggestionType === 'perpendiculaire-frontale-droite' && ghost.mesh.userData.letter === 'C') {
                                    console.log('🔧 Position C détectée - Activation automatique du joint vertical gauche');
                                    // Utiliser l'élément nouvellement placé au lieu de referenceElement
                                    this.createAutomaticLeftVerticalJoint(placedElement || this.getLastPlacedElement());
                                }
                                
                                // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position D
                                if (suggestionType === 'perpendiculaire-frontale-gauche' && ghost.mesh.userData.letter === 'D') {
                                    console.log('🔧 Position D détectée - Activation automatique du joint vertical gauche');
                                    // Utiliser l'élément nouvellement placé au lieu de referenceElement
                                    this.createAutomaticLeftVerticalJoint(placedElement || this.getLastPlacedElement());
                                }
                                
                                // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position E
                                if (suggestionType === 'perpendiculaire-dorsale-droite' && ghost.mesh.userData.letter === 'E') {
                                    console.log('🔧 Position E détectée - Activation automatique du joint vertical droit');
                                    // Utiliser l'élément nouvellement placé au lieu de referenceElement
                                    this.createAutomaticRightVerticalJoint(placedElement || this.getLastPlacedElement());
                                }
                                
                                // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position F
                                if (suggestionType === 'perpendiculaire-dorsale-gauche' && ghost.mesh.userData.letter === 'F') {
                                    console.log('🔧 Position F détectée - Activation automatique du joint vertical droit');
                                    // Utiliser l'élément nouvellement placé au lieu de referenceElement
                                    this.createAutomaticRightVerticalJoint(placedElement || this.getLastPlacedElement());
                                }
                                
                                // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position G - sur la brique de référence
                                if (suggestionType === 'angle-panneresse-droite' && ghost.mesh.userData.letter === 'G') {
                                    console.log('🔧 Position G détectée - Activation automatique du joint vertical droit sur la brique de référence');
                                    console.log('🔧 DEBUG: capturedReferenceElement pour G (fallback) =', capturedReferenceElement?.id);
                                    // Utiliser la brique de référence (celle qui était déjà posée)
                                    this.createAutomaticRightVerticalJoint(capturedReferenceElement);
                                }
                                
                                // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position I - sur la brique de référence
                                if (suggestionType === 'angle-panneresse-droite-arriere' && ghost.mesh.userData.letter === 'I') {
                                    console.log('🔧 Position I détectée - Activation automatique du joint vertical droit sur la brique de référence');
                                    console.log('🔧 DEBUG: capturedReferenceElement pour I (fallback) =', capturedReferenceElement?.id);
                                    // Utiliser la brique de référence (celle qui était déjà posée)
                                    this.createAutomaticRightVerticalJoint(capturedReferenceElement);
                                }
                                
                                // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position H - sur la brique de référence
                                if (suggestionType === 'angle-panneresse-gauche' && ghost.mesh.userData.letter === 'H') {
                                    console.log('🔧 Position H détectée - Activation automatique du joint vertical gauche sur la brique de référence');
                                    console.log('🔧 DEBUG: capturedReferenceElement pour H (fallback) =', capturedReferenceElement?.id);
                                    // Utiliser la brique de référence (celle qui était déjà posée)
                                    this.createAutomaticLeftVerticalJoint(capturedReferenceElement);
                                }
                                
                                // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position J - sur la brique de référence
                                if (suggestionType === 'angle-panneresse-gauche-arriere' && ghost.mesh.userData.letter === 'J') {
                                    console.log('🔧 Position J détectée - Activation automatique du joint vertical gauche sur la brique de référence');
                                    console.log('🔧 DEBUG: capturedReferenceElement pour J (fallback) =', capturedReferenceElement?.id);
                                    // Utiliser la brique de référence (celle qui était déjà posée)
                                    this.createAutomaticLeftVerticalJoint(capturedReferenceElement);
                                }
                                
                                // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position S (boutisse) - sur la brique de référence
                                if (suggestionType === 'angle-boutisse-droite' && ghost.mesh.userData.letter === 'S') {
                                    console.log('🔧 Position S (boutisse) détectée - Activation automatique du joint vertical droit sur la brique de référence');
                                    console.log('🔧 DEBUG: capturedReferenceElement pour S (fallback) =', capturedReferenceElement?.id);
                                    // Utiliser la brique de référence (celle qui était déjà posée)
                                    this.createAutomaticRightVerticalJoint(capturedReferenceElement);
                                }
                                
                                // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position T (boutisse) - sur la brique de référence
                                if (suggestionType === 'angle-boutisse-gauche' && ghost.mesh.userData.letter === 'T') {
                                    console.log('🔧 Position T (boutisse) détectée - Activation automatique du joint vertical gauche sur la brique de référence');
                                    console.log('🔧 DEBUG: capturedReferenceElement pour T (fallback) =', capturedReferenceElement?.id);
                                    // Utiliser la brique de référence (celle qui était déjà posée)
                                    this.createAutomaticLeftVerticalJoint(capturedReferenceElement);
                                }
                                
                                // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position U (boutisse avant) - sur la brique de référence
                                if (suggestionType === 'angle-boutisse-droite-avant' && ghost.mesh.userData.letter === 'U') {
                                    console.log('🔧 Position U (boutisse avant) détectée - Activation automatique du joint vertical droit sur la brique de référence');
                                    console.log('🔧 DEBUG: capturedReferenceElement pour U (fallback) =', capturedReferenceElement?.id);
                                    // Utiliser la brique de référence (celle qui était déjà posée)
                                    this.createAutomaticRightVerticalJoint(capturedReferenceElement);
                                }
                                
                                // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position V (boutisse avant) - sur la brique de référence
                                if (suggestionType === 'angle-boutisse-gauche-avant' && ghost.mesh.userData.letter === 'V') {
                                    console.log('🔧 Position V (boutisse avant) détectée - Activation automatique du joint vertical gauche sur la brique de référence');
                                    console.log('🔧 DEBUG: capturedReferenceElement pour V (fallback) =', capturedReferenceElement?.id);
                                    // Utiliser la brique de référence (celle qui était déjà posée)
                                    this.createAutomaticLeftVerticalJoint(capturedReferenceElement);
                                }
                                
                                // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position M (boutisse continuation droite) - sur la brique nouvellement placée
                                if (suggestionType === 'continuation' && ghost.mesh.userData.letter === 'M') {
                                    console.log('🔧 Position M (boutisse continuation) détectée - Activation automatique du joint vertical gauche sur la brique nouvellement placée');
                                    console.log('🔧 DEBUG: placedElement pour M (fallback) =', placedElement?.id);
                                    // Utiliser la brique nouvellement placée
                                    this.createAutomaticLeftVerticalJoint(placedElement || this.getLastPlacedElement());
                                }
                                
                                // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position N (boutisse continuation gauche) - sur la brique nouvellement placée
                                if (suggestionType === 'continuation' && ghost.mesh.userData.letter === 'N') {
                                                                        console.log('🔧 DEBUG: placedElement pour N (fallback) =', placedElement?.id);
                                    // Utiliser la brique nouvellement placée
                                    this.createAutomaticRightVerticalJoint(placedElement || this.getLastPlacedElement());
                                }
                                
                                // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position O (boutisse perpendiculaire frontale droite) - sur la brique nouvellement placée
                                if (suggestionType === 'perpendiculaire-frontale-droite' && ghost.mesh.userData.letter === 'O') {
                                                                        console.log('🔧 DEBUG: placedElement pour O (fallback) =', placedElement?.id);
                                    // Utiliser la brique nouvellement placée
                                    this.createAutomaticLeftVerticalJoint(placedElement || this.getLastPlacedElement());
                                }
                                
                                // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position P (boutisse perpendiculaire frontale gauche) - sur la brique nouvellement placée
                                if (suggestionType === 'perpendiculaire-frontale-gauche' && ghost.mesh.userData.letter === 'P') {
                                                                        console.log('🔧 DEBUG: placedElement pour P (fallback) =', placedElement?.id);
                                    // Utiliser la brique nouvellement placée
                                    this.createAutomaticLeftVerticalJoint(placedElement || this.getLastPlacedElement());
                                }
                                
                                // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position Q (boutisse perpendiculaire dorsale droite) - sur la brique nouvellement placée
                                if (suggestionType === 'perpendiculaire-dorsale-droite' && ghost.mesh.userData.letter === 'Q') {
                                                                        console.log('🔧 DEBUG: placedElement pour Q (fallback) =', placedElement?.id);
                                    // Utiliser la brique nouvellement placée
                                    this.createAutomaticRightVerticalJoint(placedElement || this.getLastPlacedElement());
                                }
                                
                                // NOUVELLE FONCTIONNALITÉ : Joint vertical automatique pour position R (boutisse perpendiculaire dorsale gauche) - sur la brique nouvellement placée
                                if (suggestionType === 'perpendiculaire-dorsale-gauche' && ghost.mesh.userData.letter === 'R') {
                                                                        console.log('🔧 DEBUG: placedElement pour R (fallback) =', placedElement?.id);
                                    // Utiliser la brique nouvellement placée
                                    this.createAutomaticRightVerticalJoint(placedElement || this.getLastPlacedElement());
                                }
                                
                                // Désactiver les suggestions APRÈS avoir créé les joints
                                if (window.ConstructionTools.deactivateSuggestions) {
                                    window.ConstructionTools.deactivateSuggestions();
                                }
                                
                                // 🔧 NETTOYAGE: Réinitialiser la référence après usage
                                this.lastReferenceBrick = null;
                                // console.log('🔧 NETTOYAGE: lastReferenceBrick réinitialisée (fallback)');
                            }
                        }
                    }
                    return; // Ne pas continuer le traitement
                }
            }
            
            // Vérifier si le fantôme est actif (simplifié) et si on n'est pas en mode sélection
            const isSelectionMode = window.toolbarManager && window.toolbarManager.interactionMode === 'selection';
            const isGhostActive = window.ConstructionTools && 
                                window.ConstructionTools.ghostElement && 
                                window.ConstructionTools.showGhost &&
                                !isSelectionMode; // Empêcher le placement en mode sélection
            
            
            
            // RESTAURATION 2: Vérifier les intersections avec les éléments existants
            const elementMeshes = [];
            
            Array.from(this.elements.values()).forEach(el => {
                if (el.type === 'glb') {
                    // Pour les éléments GLB, récupérer tous les meshes enfants via el.mesh
                    if (el.mesh && typeof el.mesh.traverse === 'function') {
                        el.mesh.traverse((child) => {
                            if (child.isMesh && child.userData && child.userData.element) {
                                elementMeshes.push(child);
                            }
                        });
                    }
                } else if (el.mesh) {
                    // Pour les éléments classiques, utiliser el.mesh
                    elementMeshes.push(el.mesh);
                }
            });
            
            // AMÉLIORATION: Ajouter une fonction de filtrage des intersections plus robuste
            const isValidElementMesh = (mesh) => {
                return mesh && 
                       mesh.userData && 
                       mesh.userData.element && 
                       mesh.userData.element.id &&
                       !mesh.userData.isJoint && // Exclure les joints explicitement
                       (mesh.userData.element.type === 'brick' || 
                        mesh.userData.element.type === 'block' || 
                        mesh.userData.element.type === 'insulation' ||
                        mesh.userData.element.type === 'glb' ||
                        mesh.userData.element.isGLBModel);
            };
            
            // Filtrer plus strictement les meshes valides
            const validElementMeshes = elementMeshes.filter(isValidElementMesh);
            
            // DEBUG: Informations sur les meshes filtrés
            
            // DEBUG: Informations sur tous les objets de la scène
            const allSceneObjects = [];
            this.scene.traverse((child) => {
                if (child.isMesh && child !== this.groundPlane && child !== this.groundFloor) {
                    allSceneObjects.push({
                        name: child.name || 'unnamed',
                        type: child.type || 'unknown',
                        hasUserData: !!child.userData,
                        hasElement: !!child.userData?.element,
                        elementId: child.userData?.element?.id || 'none',
                        isInElements: Array.from(this.elements.values()).some(el => el.mesh === child)
                    });
                }
            });
            /*
            console.log('🔍 DEBUG tous objets scène (excluant sol):', {
                totalSceneObjects: allSceneObjects.length,
                details: allSceneObjects
            });
            */
            
            // Étendre le raycast pour inclure les objets de mesure/annotation
            const measurementObjects = [];
            if (window.MeasurementTool && window.MeasurementTool.measurementGroup) {
                window.MeasurementTool.measurementGroup.traverse(child => {
                    if (child.isMesh || child.isLine || child.isSprite) {
                        measurementObjects.push(child);
                    }
                });
            }
            
            const annotationObjects = [];
            if (window.AnnotationTool && window.AnnotationTool.annotationGroup) {
                window.AnnotationTool.annotationGroup.traverse(child => {
                    if (child.isMesh || child.isLine || child.isSprite) {
                        annotationObjects.push(child);
                    }
                });
            }
            
            const textLeaderObjects = [];
            if (window.TextLeaderTool && window.TextLeaderTool.textLeaderGroup) {
                window.TextLeaderTool.textLeaderGroup.traverse(child => {
                    if (child.isMesh || child.isLine || child.isSprite) {
                        textLeaderObjects.push(child);
                    }
                });
            }
            
            // Combiner tous les objets pour le raycast
            const allRaycastObjects = [...validElementMeshes, ...measurementObjects, ...annotationObjects, ...textLeaderObjects];
            
            const intersects = this.raycaster.intersectObjects(allRaycastObjects);
            
            // Séparer les éléments de construction et les objets d'annotation
            const constructionIntersects = intersects.filter(intersect => {
                return intersect.object && 
                       intersect.object.userData && 
                       intersect.object.userData.element && 
                       intersect.object.userData.element.id &&
                       !intersect.object.userData.element.isVerticalJoint &&
                       !intersect.object.userData.element.isHorizontalJoint &&
                       (intersect.object.userData.element.type === 'brick' || 
                        intersect.object.userData.element.type === 'block' || 
                        intersect.object.userData.element.type === 'insulation' ||
                        intersect.object.userData.element.type === 'glb' ||
                        intersect.object.userData.element.isGLBModel);
            });
            
            
            // Si on clique sur un élément existant, gérer selon le mode d'interaction
            if (constructionIntersects.length > 0 || intersects.length > 0) {
                
                
                // RESTAURATION 4: Logique de sélection d'éléments avec protection renforcée
                let element = null;
                let intersectObject = null;
                
                // D'abord chercher les éléments de construction
                for (let i = 0; i < constructionIntersects.length; i++) {
                    const intersect = constructionIntersects[i];
                    if (intersect.object && intersect.object.userData && intersect.object.userData.element) {
                        element = intersect.object.userData.element;
                        intersectObject = intersect.object;
                        break;
                    }
                }
                
                // Si aucun élément de construction trouvé, vérifier les outils de mesure/annotation
                if (!element && intersects.length > 0) {
                    const annotationElement = this.findAnnotationElement(intersects);
                    if (annotationElement) {
                        element = annotationElement;
                        intersectObject = annotationElement.mesh || annotationElement.sprite || annotationElement.group;
                        // console.log('🎯 Élément d\'annotation détecté:', annotationElement);
                    }
                }
                
                const forceSelection = event.ctrlKey || event.metaKey; // Ctrl/Cmd
                
                // Vérifier que l'élément existe et a les propriétés requises
                if (!element || !element.id) {
                    // console.warn('⚠️ Élément invalide détecté lors du clic:', element);
                    // console.log('🔍 Debug intersection détaillé:', {
                    //     intersectsLength: intersects.length,
                    //     constructionIntersectsLength: constructionIntersects.length,
                    //     allObjects: intersects.map((intersect, index) => ({
                    //         index,
                    //         name: intersect.object?.name || 'unnamed',
                    //         type: intersect.object?.type || 'unknown',
                    //         userData: intersect.object?.userData || {},
                    //         hasElement: !!intersect.object?.userData?.element,
                    //         elementId: intersect.object?.userData?.element?.id || 'none',
                    //         elementType: intersect.object?.userData?.element?.type || 'unknown',
                    //         isJoint: intersect.object?.userData?.element?.isVerticalJoint || intersect.object?.userData?.element?.isHorizontalJoint || false,
                    //         distance: intersect.distance
                    //     })),
                    //     validElementMeshesUsed: validElementMeshes.length,
                    //     wasObjectInValidMeshes: intersects.map(intersect => 
                    //         validElementMeshes.includes(intersect.object)
                    //     )
                    // });
                    
                    // DEBUG: Vérifier s'il y a un outil de construction actif
                    const hasConstructionTool = window.ConstructionTools && window.ConstructionTools.currentMode;
                    const hasActiveButton = document.querySelector('.tool-btn.active');
                    // console.log('🔧 État des outils de construction:', {
                    //     hasConstructionTools: !!window.ConstructionTools,
                    //     currentMode: window.ConstructionTools?.currentMode || 'aucun',
                    //     hasActiveButton: !!hasActiveButton,
                    //     activeButtonMode: hasActiveButton?.dataset?.mode || 'aucun'
                    // });
                    
                    // Si on a un outil actif mais pas d'élément valide, essayer de placer directement
                    if (hasConstructionTool || hasActiveButton) {
                        // console.log('🎯 Outil de construction détecté, tentative de placement direct...');
                        
                        // DEBUG: Vérifier l'état exact du ghost
                        const ghost = window.ConstructionTools?.ghostElement;
                        // console.log('🔍 DEBUG Ghost element état:', {
                        //     hasGhost: !!ghost,
                        //     hasGhostMesh: !!ghost?.mesh,
                        //     ghostMeshVisible: ghost?.mesh?.visible,
                        //     ghostVisible: ghost?.visible,
                        //     showGhost: window.ConstructionTools?.showGhost,
                        //     activeBrickForSuggestions: window.ConstructionTools?.activeBrickForSuggestions
                        // });
                        
                        // Aller directement à la logique de placement depuis le sol
                        const isGhostActive = window.ConstructionTools && 
                                            window.ConstructionTools.ghostElement && 
                                            window.ConstructionTools.ghostElement.mesh &&
                                            window.ConstructionTools.ghostElement.mesh.visible;
                        
                        // console.log('🔍 DEBUG isGhostActive:', isGhostActive);
                        
                        if (isGhostActive) {
                            // Désactiver les suggestions avant placement
                            if (window.ConstructionTools && window.ConstructionTools.deactivateSuggestions) {
                                window.ConstructionTools.deactivateSuggestions();
                            }
                            
                            // Placer l'élément à la position de la souris sur le sol
                            const groundIntersects = this.raycaster.intersectObject(this.groundPlane);
                            if (groundIntersects.length > 0) {
                                const point = groundIntersects[0].point;
                                // console.log('🎯 Tentative de placement à la position:', {x: point.x, z: point.z});
                                
                                // 🔧 GLB: Détecter si on a un GLB fantôme actif
                                const hasGLBGhost = window.tempGLBInfo && 
                                                  window.ConstructionTools &&
                                                  window.ConstructionTools.ghostElement &&
                                                  window.ConstructionTools.ghostElement.mesh &&
                                                  window.ConstructionTools.ghostElement.mesh.userData &&
                                                  window.ConstructionTools.ghostElement.mesh.userData.isGLBGhost;
                                
                                // Vérifier si le placement immédiat est temporairement désactivé
                                const isPlacementPrevented = window.preventImmediatePlacement === true;
                                
                                if (hasGLBGhost && !isPlacementPrevented) {
                                    // console.log('🎯 GLB fantôme détecté (section 3) - Utilisation de ConstructionTools.placeElementAtCursor');
                                    if (window.ConstructionTools.placeElementAtCursor) {
                                        window.ConstructionTools.placeElementAtCursor(point.x, point.z);
                                    }
                                } else if (hasGLBGhost && isPlacementPrevented) {
                                    console.log('🚫 Placement GLB empêché temporairement');
                                } else {
                                    // Placement normal pour les éléments classiques
                                    this.placeElementAt(point.x, point.z);
                                }
                            }
                        }
                        return; // Sortir de la fonction après le placement
                    } else {
                        return;
                    }
                }
                
                // Vérifier si l'élément peut être sélectionné
                let canSelect = false;
                
                if (element && element.id) {
                    // Éléments de construction (briques, blocs, etc.)
                    if (element.type && ['brick', 'block', 'insulation', 'linteau'].includes(element.type)) {
                        canSelect = !window.AssiseManager || window.AssiseManager.canSelectElement(element.id, true);
                    }
                    // Modèles GLB importés - toujours sélectionnables
                    else if (element.type === 'glb' || element.isGLBModel) {
                        canSelect = true;
                    }
                    // Éléments d'annotation/mesure/texte - toujours sélectionnables
                    else if (element.type && ['measurement', 'annotation', 'textleader'].includes(element.type)) {
                        canSelect = true;
                    }
                }
                
                // S'assurer que nous avons un élément valide avant de continuer
                // S'assurer que nous avons un élément valide avant de continuer
                if (canSelect && element && element.id) {
                    if (isSelectionMode) {
                        // Mode sélection : sélectionner l'élément et activer l'onglet propriétés
                        console.log('🎯 Mode sélection - Sélection de l\'élément pour propriétés:', element.type, element.id);
                        this.selectElement(element);
                        
                        // Activer l'onglet propriétés si disponible
                        if (window.TabManager) {
                            window.TabManager.switchMainTab('proprietes');
                        }
                        
                        // Ne pas créer de suggestions pour les modèles GLB et éléments de construction
                        if (window.ConstructionTools && window.ConstructionTools.clearSuggestions && 
                            (['brick', 'block', 'insulation', 'linteau'].includes(element.type) || 
                             element.type === 'glb' || element.isGLBModel)) {
                            window.ConstructionTools.clearSuggestions();
                        }
                    } else if (['measurement', 'annotation', 'textleader'].includes(element.type) || 
                               element.type === 'glb' || element.isGLBModel) {
                        // Éléments d'annotation/mesure/texte/GLB : sélectionner directement même en mode construction
                        console.log('🎯 Sélection d\'élément spécial:', element.type, element.id);
                        this.selectElement(element);
                        
                        // Activer l'onglet propriétés si disponible
                        if (window.TabManager) {
                            window.TabManager.switchMainTab('proprietes');
                        }
                    } else if (window.ConstructionTools) {
                        // Mode pose de briques : proposer les briques adjacentes (éléments de construction uniquement)
                        if (forceSelection && (element.type === 'brick' || element.type === 'block' || element.type === 'insulation')) {
                            // Ctrl+clic → mode joints uniquement
                            // console.log('🔧 Ctrl+clic détecté - Activation du mode joint pour élément:', element.id);
                            
                            if (window.ConstructionTools.activateVerticalJointMode) {
                                window.ConstructionTools.activateVerticalJointMode(element);
                            } else {
                                console.warn('⚠️ activateVerticalJointMode non disponible');
                            }
                        } else {
                            // Vérifier si un plancher est en cours de placement
                            const isFloorBeingPlaced = window.tempGLBInfo && 
                                                     (window.tempGLBInfo.category === 'planchers' || 
                                                      window.tempGLBInfo.glbPath?.includes('/planchers/') ||
                                                      window.tempGLBInfo.type?.toLowerCase().includes('plancher') ||
                                                      window.tempGLBInfo.type?.toLowerCase().includes('hourdis'));
                            
                            if (!isFloorBeingPlaced) {
                                // 🆕 NOUVEAU: Vérifier si on clique sur le dos de la brique avec des suggestions actives
                                if (window.ConstructionTools.activeBrickForSuggestions && 
                                    window.ConstructionTools.isClickOnBrickBack && 
                                    window.ConstructionTools.isClickOnBrickBack(element, window.ConstructionTools.activeBrickForSuggestions)) {
                                    console.log('🎯 Clic sur le dos de la brique originelle - désactivation des suggestions');
                                    window.ConstructionTools.deactivateSuggestions();
                                    return; // Sortir sans créer de nouvelles suggestions
                                }
                                
                                // Clic normal → suggestions complètes pour poser des briques adjacentes (seulement si pas de plancher)
                                // console.log('🎯 Mode pose - Création de suggestions adjacentes');
                                if (window.ConstructionTools.activateSuggestionsForBrick) {
                                    window.ConstructionTools.activateSuggestionsForBrick(element);
                                    // 🔧 CAPTURE: Sauvegarder la brique de référence pour les joints automatiques
                                    this.lastReferenceBrick = element;
                                    // console.log('🔧 SAUVEGARDE: Brique de référence =', this.lastReferenceBrick?.id || 'none');
                                }
                            } else {
                                // Plancher en cours de placement - ne pas activer les suggestions adjacentes
                                console.log('🚫 Plancher en cours de placement - suggestions adjacentes désactivées mais clic autorisé');
                            }
                        }
                    }
                } else {
                    // RESTAURATION 6: Gestion des assises inférieures
                    
                    
                    if (!isGhostActive || forceSelection || isSelectionMode) {
                        // Mode sélection ou sélection forcée - activer le mode construction à la position de la souris
                        
                        const groundIntersects = this.raycaster.intersectObject(this.groundPlane);
                        if (groundIntersects.length > 0) {
                            const point = groundIntersects[0].point;
                            if (window.ConstructionTools && window.ConstructionTools.ghostElement) {
                                window.ConstructionTools.ghostElement.updatePosition(
                                    point.x, 
                                    window.ConstructionTools.ghostElement.position.y, 
                                    point.z
                                );
                            }
                        }
                    } else {
                        // Mode construction avec fantôme actif - placer à la position de la souris
                        
                        const groundIntersects = this.raycaster.intersectObject(this.groundPlane);
                        if (groundIntersects.length > 0) {
                            const point = groundIntersects[0].point;
                            
                            // 🔧 GLB: Détecter si on a un GLB fantôme actif
                            const hasGLBGhost = window.tempGLBInfo && 
                                              window.ConstructionTools &&
                                              window.ConstructionTools.ghostElement &&
                                              window.ConstructionTools.ghostElement.mesh &&
                                              window.ConstructionTools.ghostElement.mesh.userData &&
                                              window.ConstructionTools.ghostElement.mesh.userData.isGLBGhost;
                            
                            // Vérifier si le placement immédiat est temporairement désactivé
                            const isPlacementPrevented = window.preventImmediatePlacement === true;
                            
                            if (hasGLBGhost && !isPlacementPrevented) {
                                // console.log('🎯 GLB fantôme détecté - Utilisation de ConstructionTools.placeElementAtCursor');
                                if (window.ConstructionTools.placeElementAtCursor) {
                                    window.ConstructionTools.placeElementAtCursor(point.x, point.z);
                                }
                            } else if (hasGLBGhost && isPlacementPrevented) {
                                console.log('🚫 Placement GLB empêché temporairement');
                            } else {
                                // Placement normal pour les éléments classiques
                                this.placeElementAt(point.x, point.z);
                            }
                        }
                    }
                }
                
                return; // Ne pas placer de nouvelle brique
            }
            
            if (isGhostActive) {
                
                
                // RESTAURATION 1: Désactiver les suggestions avant placement
                if (window.ConstructionTools && window.ConstructionTools.deactivateSuggestions) {
                    window.ConstructionTools.deactivateSuggestions();
                }
                
                // DEBUG: Vérifier l'état avant placement
                /*
                console.log('🎯 Tentative de placement - État des outils:', {
                    hasConstructionTools: !!window.ConstructionTools,
                    currentMode: window.ConstructionTools?.currentMode || 'aucun',
                    hasGroundPlane: !!this.groundPlane,
                    raycastDirection: this.raycaster.ray.direction
                });
                */
                
                // Placement direct sans vérifier les intersections pour le moment
                const groundIntersects = this.raycaster.intersectObject(this.groundPlane);
                
                /*
                console.log('🎯 Intersection avec le sol:', {
                    groundIntersectsLength: groundIntersects.length,
                    hasPoint: groundIntersects.length > 0 ? !!groundIntersects[0].point : false
                });
                */
                
                if (groundIntersects.length > 0) {
                    const point = groundIntersects[0].point;
                    // console.log('🎯 Tentative de placement à la position:', { x: point.x, z: point.z });
                    
                    // 🔧 GLB: Détecter si on a un GLB fantôme actif
                    const hasGLBGhost = window.tempGLBInfo && 
                                      window.ConstructionTools &&
                                      window.ConstructionTools.ghostElement &&
                                      window.ConstructionTools.ghostElement.mesh &&
                                      window.ConstructionTools.ghostElement.mesh.userData &&
                                      window.ConstructionTools.ghostElement.mesh.userData.isGLBGhost;
                    
                    // Vérifier si le placement immédiat est temporairement désactivé
                    const isPlacementPrevented = window.preventImmediatePlacement === true;
                    
                    if (hasGLBGhost && !isPlacementPrevented) {
                        if (window.ConstructionTools.placeElementAtCursor) {
                            window.ConstructionTools.placeElementAtCursor(point.x, point.z);
                        }
                    } else if (hasGLBGhost && isPlacementPrevented) {
                        console.log('🚫 Placement GLB empêché temporairement');
                    } else {
                        // Placement normal pour les éléments classiques
                        this.placeElementAt(point.x, point.z);
                    }
                } else {
                    console.warn('⚠️ Aucune intersection avec le sol détectée');
                }
            } else {
                // Clic dans le vide - gérer selon le mode d'interaction
                const isSelectionMode = window.toolbarManager && window.toolbarManager.interactionMode === 'selection';
                
                if (isSelectionMode) {
                    // En mode sélection, désélectionner tous les éléments lors d'un clic dans le vide
                    // console.log('🎯 Clic dans le vide en mode sélection - Désélection de tous les éléments');
                    this.deselectElement();
                    
                    // Effacer les suggestions si elles existent
                    if (window.ConstructionTools && window.ConstructionTools.clearSuggestions) {
                        window.ConstructionTools.clearSuggestions();
                    }
                    
                    // Revenir au mode pose de brique avec la brique fantôme
                    // console.log('🔄 Retour au mode pose de brique après déselection');
                    if (window.toolbarManager) {
                        window.toolbarManager.setInteractionMode('placement');
                    }
                    
                    // S'assurer que l'onglet construction est activé
                    if (window.TabManager) {
                        window.TabManager.switchMainTab('construction');
                    }
                    
                    // Réactiver explicitement les outils de construction
                    if (window.ConstructionTools && window.ConstructionTools.updateGhostElement) {
                        window.ConstructionTools.updateGhostElement();
                        // console.log('👻 Brique fantôme réactivée après déselection');
                    }
                }
            }
        } catch (error) {
            console.error('❌ ERREUR dans onMouseClick:', error);
        }
    }

    onRightClick(event) {
        // Menu contextuel ou suppression
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const elementMeshes = Array.from(this.elements.values()).map(el => el.mesh);
        const intersects = this.raycaster.intersectObjects(elementMeshes);

        if (intersects.length > 0) {
            const element = intersects[0].object.userData.element;
            
            // PROTECTION: Empêcher la suppression des briques par clic droit
            // Le clic droit est réservé uniquement à la rotation de la brique fantôme
            if (element.type === 'brick') {
                // console.log('🧱 Clic droit sur brique ignoré - utilisez l\'outil de suppression pour supprimer les briques');
                return; // Ne pas supprimer les briques
            }
            
            // Pour les autres types d'éléments (blocs, isolants, etc.), permettre la suppression
            this.removeElement(element.id);
        }
    }

    // Méthode pour ajuster les dimensions selon le type de coupe
    adjustDimensionsForCut(originalLength, originalWidth, originalHeight, blockType) {
        if (!blockType || typeof blockType !== 'string') {
            return { length: originalLength, width: originalWidth, height: originalHeight };
        }
        
        let length = originalLength;
        let width = originalWidth;
        let height = originalHeight;
        
        // Déterminer le type de coupe à partir du suffixe
        if (blockType.endsWith('1Q')) {
            // Coupe 1/4 - diviser la longueur par 4
            length = Math.round(originalLength / 4);
        } else if (blockType.endsWith('1/2')) {
            // Coupe 1/2 - diviser la longueur par 2
            length = Math.round(originalLength / 2);
        } else if (blockType.endsWith('HALF')) {
            // 🔥 CORRECTION: Ajouter le support pour le suffixe HALF
            length = Math.round(originalLength / 2);
        } else if (blockType.endsWith('1/2L')) {
            // Coupe 1/2L - diviser la largeur par 2
            width = Math.round(originalWidth / 2);
        } else if (blockType.endsWith('3Q')) {
            // Coupe 3/4 - garder 3/4 de la longueur
            length = Math.round(originalLength * 3 / 4);
        }
        
        const result = { length, width, height };
        return result;
    }

    placeElementAt(x, z, customRotation = null, supportElement = null) {
        // console.log('🚀 DÉBUT placeElementAt:', { x, z, customRotation, supportElement });
        
        // CORRECTION: Nettoyer les suggestions avant placement manuel
        // Cela permet de s'assurer que le ghost principal redevient visible après placement
        if (window.ConstructionTools && window.ConstructionTools.clearSuggestions) {
            window.ConstructionTools.clearSuggestions();
        }
        
        // CORRECTION: Récupérer le type depuis ConstructionTools (plus fiable)
        let type = 'brick'; // Par défaut
        if (window.ConstructionTools && window.ConstructionTools.currentMode) {
            type = window.ConstructionTools.currentMode;
            // console.log('🔧 DEBUG placeElementAt - Type récupéré depuis ConstructionTools:', type);
        } else {
            // Fallback: Récupérer depuis l'UI
            const activeBtn = document.querySelector('.tool-btn.active');
            if (activeBtn && activeBtn.dataset.mode) {
                type = activeBtn.dataset.mode;
                console.log(`🔧 Type récupéré depuis bouton UI: ${type}`);
            } else {
                console.log(`⚠️ Aucun mode détecté, utilisation par défaut: ${type}`);
            }
        }
        
        // CORRECTION: Utiliser getAutoMaterial() de ConstructionTools au lieu du select HTML
        let material = 'brique-rouge-classique'; // Valeur par défaut
        if (window.ConstructionTools && window.ConstructionTools.getAutoMaterial) {
            material = window.ConstructionTools.getAutoMaterial();
        } else {
            // Fallback: utiliser le select HTML
            material = document.getElementById('materialSelect').value;
        }
        
        // CORRECTION: Récupérer le blockType spécifique pour les joints
        let blockType = type; // Valeur par défaut
        if (window.ConstructionTools && window.ConstructionTools.getElementTypeForMode) {
            blockType = window.ConstructionTools.getElementTypeForMode(type);
        }
        
        // console.log(`🔧 DEBUG placeElementAt: type=${type}, material=${material} (source: ${window.ConstructionTools && window.ConstructionTools.getAutoMaterial ? 'ConstructionTools.getAutoMaterial()' : 'HTML select'})`);

        // // console.log(`🔧 DEBUG placeElementAt: type=${type}, material=${material}`);
        // // console.log(`🔧 DEBUG placeElementAt: blockType=${blockType}`);
        
        // CORRECTION: Utiliser les dimensions selon le type d'élément
        let length, width, height;
        if (type === 'brick' && window.BrickSelector) {
            // Pour les briques, utiliser BrickSelector
            const currentBrick = window.BrickSelector.getCurrentBrick();
            length = currentBrick.length;
            width = currentBrick.width;
            height = currentBrick.height;
            
            // ✅ CORRECTION: Ne PAS ajuster les dimensions - BrickSelector a déjà les bonnes dimensions
            // Les types comme M65_HALF ont déjà les bonnes dimensions dans BrickSelector
            if (window.DEBUG_CONSTRUCTION) {
                console.log(`🔧 SceneManager: Dimensions brique depuis BrickSelector: ${length}x${width}x${height}cm (type: ${currentBrick.type})`);
            }
        } else if (type === 'block' && window.BlockSelector) {
            // Pour les blocs, utiliser BlockSelector
            const currentBlock = window.BlockSelector.getCurrentBlockData();
            length = currentBlock.length;
            width = currentBlock.width;
            height = currentBlock.height;
            
            // CORRECTION: Ajuster les dimensions selon la coupe active
            if (blockType && blockType !== type) {
                const adjustedDimensions = this.adjustDimensionsForCut(length, width, height, blockType);
                length = adjustedDimensions.length;
                width = adjustedDimensions.width;
                height = adjustedDimensions.height;
            }
            // // console.log(`🔧 Dimensions bloc: ${length}x${width}x${height}cm`);
        } else {
            // Pour les isolants ou si les sélecteurs ne sont pas disponibles, utiliser les champs HTML
            length = parseInt(document.getElementById('elementLength').value);
            width = parseInt(document.getElementById('elementWidth').value);
            height = parseInt(document.getElementById('elementHeight').value);
            // // console.log(`🔧 Dimensions HTML: ${length}x${width}x${height}cm`);
        }

        // Snap to grid
        const snapToGrid = (value) => Math.round(value / this.gridSpacing) * this.gridSpacing;
        const snapX = snapToGrid(x);
        const snapZ = snapToGrid(z);

        // Récupérer la rotation - soit personnalisée, soit du fantôme
        let rotation = customRotation;
        if (rotation === null && window.ConstructionTools && window.ConstructionTools.ghostElement) {
            rotation = window.ConstructionTools.ghostElement.rotation;
        }
        if (rotation === null) {
            rotation = 0;
        }

        // Calculer la hauteur Y appropriée
        let y = 0;
        if (!supportElement) {
            // Si pas d'élément support spécifié, chercher automatiquement
            const stackingResult = this.findAutoStackingHeight(snapX, snapZ);
            y = stackingResult.height;
            supportElement = stackingResult.supportElement;
            
            // Si aucun support trouvé, utiliser la hauteur de l'assise active
            if (!supportElement && window.AssiseManager) {
                let currentType = window.ConstructionTools ? window.ConstructionTools.currentMode : type;
                
                // Pour les briques, utiliser le type spécifique du BrickSelector
                if (currentType === 'brick' && window.BrickSelector && window.BrickSelector.getCurrentBrick) {
                    const brickInfo = window.BrickSelector.getCurrentBrick();
                    currentType = brickInfo.type;
                    // // console.log(`🎯 SceneManager: Type brique spécifique utilisé: ${currentType}`);
                }
                
                // CORRECTION: Utiliser la méthode getAssiseHeight qui fonctionne avec l'assise courante
                const currentAssise = window.AssiseManager.currentAssise;
                const assiseHeight = window.AssiseManager.getAssiseHeight(currentAssise);
                y = assiseHeight + height / 2; // Centre de l'élément
                // // console.log(`🎯 Positionnement sur assise active: assise ${currentAssise}, hauteur ${assiseHeight} cm, centre Y: ${y} cm`);
            }
        } else {
            // Utiliser l'élément support fourni
            y = supportElement.position.y + supportElement.dimensions.height;
        }

        // Créer le nouvel élément
        const element = new WallElement({
            type,
            blockType, // CORRECTION: Ajouter le blockType spécifique
            material,
            x: snapX,
            y: y,
            z: snapZ,
            length,
            width,
            height,
            rotation
        });

        // CORRECTION SPÉCIALE: Forcer l'opacité complète pour les isolants placés
        if (element.type === 'insulation' && element.mesh && element.mesh.material) {
            console.log('🔧 CORRECTION SPÉCIALE: Restauration opacité isolant placé');
            element.mesh.material.transparent = false;
            element.mesh.material.opacity = 1.0;
            element.mesh.material.alphaTest = 0;
            element.mesh.material.needsUpdate = true;
            
            // NE PAS changer la couleur - elle est déjà correcte selon le matériau
        }

        // Déterminer si on fait de l'empilage vertical
        const allowVerticalStacking = supportElement !== null;

        // Vérifier les collisions
        if (!this.checkCollisions(element, allowVerticalStacking, supportElement)) {
            this.addElement(element);
            
            // L'élément est déjà ajouté à l'assise dans addElement()
            // Pas besoin de le faire ici aussi
            
            // Réinitialiser la rotation manuelle dans ConstructionTools après placement réussi
            if (window.ConstructionTools && window.ConstructionTools.resetManualRotation) {
                window.ConstructionTools.resetManualRotation();
            }
            
            // Émettre un événement
            document.dispatchEvent(new CustomEvent('elementPlaced', {
                detail: { element }
            }));
            
            // CORRECTION: Retourner l'élément créé pour les fonctions qui en ont besoin
            return element;
        } else {
            element.dispose();
            // console.warn('Collision détectée, placement annulé');
            return null; // Retourner null en cas d'échec
        }
    }

    addElement(element) {
        this.elements.set(element.id, element);
        element.mesh.castShadow = true;
        element.mesh.receiveShadow = true;
        
        // CORRECTION SUPPLÉMENTAIRE: Vérifier une dernière fois l'opacité des isolants avant ajout à la scène
        if (element.type === 'insulation' && element.mesh && element.mesh.material) {
            if (element.mesh.material.transparent === true || element.mesh.material.opacity < 1.0) {
                console.log('🔧 CORRECTION FINALE: Isolant transparent détecté dans addElement, correction immédiate');
                element.mesh.material.transparent = false;
                element.mesh.material.opacity = 1.0;
                element.mesh.material.alphaTest = 0;
                element.mesh.material.needsUpdate = true;
            }
        }
        
        this.scene.add(element.mesh);
        
        // CORRECTION AUTOMATIQUE: Appliquer la correction automatique des isolants après ajout à la scène
        if (element.type === 'insulation') {
            console.log('🔧 Application automatique de fixTransparentInsulation après placement');
            // Utiliser setTimeout pour laisser le temps au rendu de se faire
            setTimeout(() => {
                if (window.fixTransparentInsulation) {
                    window.fixTransparentInsulation();
                }
            }, 100);
        }
        
        // Émission d'événements pour l'onboarding (uniquement si pas en cours d'import)
        const isFirstBrick = this.elements.size === 1 && element.type === 'brick';
        const isAdjacentBrick = this.elements.size > 1 && element.type === 'brick';
        
        if (!this.isImporting) {
            if (isFirstBrick) {
                // console.log('🎯 Première brique posée - événement émis');
                document.dispatchEvent(new CustomEvent('brickPlaced', { detail: { element, isFirst: true } }));
            } else if (isAdjacentBrick) {
                // console.log('✨ Brique adjacente posée - événement émis');
                document.dispatchEvent(new CustomEvent('adjacentBrickPlaced', { detail: { element, isAdjacent: true } }));
            }
        } else {
            if (isFirstBrick) {
                // console.log('🔄 Première brique importée - événement onboarding supprimé');
            } else if (isAdjacentBrick) {
                // console.log('🔄 Brique adjacente importée - événement onboarding supprimé');
            }
        }
        
        // Intégration avec le système de calques
        if (window.LayerManager) {
            const elementType = element.type || element.mesh.userData?.type || 'unknown';
            // console.log('🎨 SceneManager: Assignation au calque:', {
            //     elementId: element.id,
            //     elementType: elementType,
            //     mesh: element.mesh
            // });
            window.LayerManager.onElementAdded(element.mesh, elementType);
        } else {
            console.warn('⚠️ LayerManager non disponible dans SceneManager.addElement');
        }
        
        // Ajouter automatiquement l'élément à l'assise active
        if (window.AssiseManager) {
            window.AssiseManager.addElementToAssise(element.id);
        }
        
        // NOUVELLE FONCTIONNALITÉ : Joint horizontal automatique pour chaque élément de construction posé
        if (!element.isVerticalJoint && !element.isHorizontalJoint && (element.type === 'brick' || element.type === 'block' || element.type === 'insulation')) {
            // console.log('🔧 Activation automatique du joint horizontal pour:', element.type, element.id);
            this.createAutomaticHorizontalJoint(element);
        }
        
        // NOUVEAU: Ajouter l'élément aux éléments à réutiliser
        // 🔧 CORRECTION: Ne pas appeler directement addUsedElement ici car l'événement 
        // elementPlaced s'en charge déjà via TabManager.handleElementPlaced()
        // Cela évite le double comptage des éléments
        
        // NOUVELLE FONCTIONNALITÉ: Ajouter automatiquement des joints si activé
        if (window.ConstructionTools && 
            (element.type === 'brick' || element.type === 'block' || element.type === 'insulation') &&
            !element.isVerticalJoint && 
            !element.isHorizontalJoint) {
            
            // Vérifier d'abord si l'élément doit créer des joints selon son type/matériau
            const jointSettings = window.ConstructionTools.getJointSettingsForElement(element);
            
            if (!jointSettings.createJoints) {
                console.log('❌ Joints automatiques désactivés pour ce type d\'élément:', {
                    type: element.type,
                    blockType: element.blockType,
                    jointSettings: jointSettings
                });
                return element;
            }
            
            // Vérifier si les joints automatiques sont activés pour ce type d'élément de base
            const shouldCreateJoints = element.type === 'brick' ? 
                window.ConstructionTools.autoBrickJoints : 
                window.ConstructionTools.autoBlockJoints;
            
            // console.log(`🔧 DEBUG SceneManager.addElement - Élément ajouté:`, {
            //     elementType: element.type,
            //     elementId: element.id,
            //     isVerticalJoint: element.isVerticalJoint,
            //     isHorizontalJoint: element.isHorizontalJoint,
            //     autoBrickJoints: window.ConstructionTools.autoBrickJoints,
            //     autoBlockJoints: window.ConstructionTools.autoBlockJoints,
            //     shouldCreateJoints: shouldCreateJoints
            // });
            
            if (shouldCreateJoints) {
                // console.log('🔧 Ajout automatique de joints programmé pour l\'élément:', element.type, element.id);
                
                // Ajouter un petit délai pour s'assurer que l'élément est complètement ajouté
                setTimeout(() => {
                    // console.log('🔧 Exécution addAutomaticJoints pour:', element.id);
                    window.ConstructionTools.addAutomaticJoints(element);
                }, 50);
            } else {
                console.log('❌ Joints automatiques désactivés pour:', element.type, element.id);
            }
        } else {
            // console.log('❌ Conditions non remplies pour joints automatiques:', {
            //     hasConstructionTools: !!window.ConstructionTools,
            //     elementType: element.type,
            //     isValidType: (element.type === 'brick' || element.type === 'block' || element.type === 'insulation'),
            //     isVerticalJoint: element.isVerticalJoint,
            //     isHorizontalJoint: element.isHorizontalJoint
            // });
        }

        // 📝 NOUVEAU: Émettre un événement pour le système d'historique SEULEMENT si pas en cours d'import
        if (!this.isImporting) {
            const sceneChangeEvent = new CustomEvent('sceneChanged', {
                detail: {
                    action: `Ajout ${element.type}`,
                    elementId: element.id,
                    elementType: element.type,
                    changeType: 'add'
                }
            });
            document.dispatchEvent(sceneChangeEvent);
            // console.log('📤 Événement sceneChanged émis pour ajout d\'élément:', element.id);
        } else {
            // console.log('⏸️ Import en cours - événement sceneChanged non émis pour:', element.id);
        }
        
        // 🔧 CORRECTION: Émettre l'événement elementPlaced pour que TabManager
        // puisse ajouter l'élément aux éléments réutilisables (notamment pour les GLB)
        document.dispatchEvent(new CustomEvent('elementPlaced', {
            detail: { element }
        }));
    }

    // Méthode pour ajouter un élément à une assise spécifique sans détection automatique
    addElementToSpecificAssise(element, assiseType, assiseIndex) {
        this.elements.set(element.id, element);
        element.mesh.castShadow = true;
        element.mesh.receiveShadow = true;
        this.scene.add(element.mesh);
        
        // Intégration avec le système de calques
        if (window.LayerManager) {
            const elementType = element.type || element.mesh.userData?.type || 'unknown';
            // console.log('🎨 SceneManager: Assignation au calque (assise spécifique):', {
            //     elementId: element.id,
            //     elementType: elementType,
            //     assiseType: assiseType,
            //     assiseIndex: assiseIndex
            // });
            window.LayerManager.onElementAdded(element.mesh, elementType);
        }
        
        // Ajouter l'élément à l'assise spécifiée
        if (window.AssiseManager) {
            // // console.log(`🔧 Ajout du joint à l'assise ${assiseIndex} du type '${assiseType}'`);
            window.AssiseManager.addElementToAssiseForType(assiseType, element.id, assiseIndex);
        }
    }

    // Nouvelle méthode pour créer un élément complet
    createElement(config) {
        const {
            type = 'brick',
            position = { x: 0, y: 0, z: 0 },
            dimensions = { width: 20, height: 5, depth: 10 },
            material = 'standard',
            rotation = 0,
            blockType = null // CORRECTION: Permettre de passer un blockType personnalisé
        } = config;

        // CORRECTION: Récupérer le blockType spécifique si non fourni
        let finalBlockType = blockType;
        if (!finalBlockType && window.ConstructionTools && window.ConstructionTools.getElementTypeForMode) {
            finalBlockType = window.ConstructionTools.getElementTypeForMode(type);
        }
        if (!finalBlockType) {
            finalBlockType = type; // Fallback
        }

        // Créer l'élément WallElement
        const element = new WallElement({
            type,
            blockType: finalBlockType, // CORRECTION: Ajouter le blockType spécifique
            material,
            x: position.x,
            y: position.y,
            z: position.z,
            length: dimensions.width,
            width: dimensions.depth,
            height: dimensions.height,
            rotation
        });

        // Ajouter à la scène
        this.addElement(element);
        
        return element;
    }

    removeElement(elementId) {
        const element = this.elements.get(elementId);
        if (element) {
            // Intégration avec le système de calques
            if (window.LayerManager) {
                window.LayerManager.onElementRemoved(element.mesh);
            }
            
            // Retirer l'élément de son assise
            if (window.AssiseManager) {
                window.AssiseManager.removeElementFromAssise(elementId);
            }
            
            this.scene.remove(element.mesh);
            element.dispose();
            this.elements.delete(elementId);

            if (this.selectedElement && this.selectedElement.id === elementId) {
                this.selectedElement = null;
            }

            // Émettre un événement pour compatibilité
            document.dispatchEvent(new CustomEvent('elementRemoved', {
                detail: { elementId }
            }));

            // 📝 NOUVEAU: Émettre un événement pour le système d'historique
            const sceneChangeEvent = new CustomEvent('sceneChanged', {
                detail: {
                    action: `Suppression ${element.type}`,
                    elementId: elementId,
                    elementType: element.type,
                    changeType: 'remove'
                }
            });
            document.dispatchEvent(sceneChangeEvent);
            console.log('📤 Événement sceneChanged émis pour suppression d\'élément:', elementId);
        }
    }

    selectElement(element) {
        // Désélectionner l'élément précédent
        if (this.selectedElement) {
            this.deselectPrevious(this.selectedElement);
        }

        // Sélectionner le nouvel élément
        this.selectedElement = element;
        this.highlightSelected(element);

        // Émettre un événement avec les propriétés appropriées
        document.dispatchEvent(new CustomEvent('elementSelected', {
            detail: { 
                element,
                properties: element.properties || {},
                toolType: element.toolType || element.type
            }
        }));
    }

    // Désélectionner l'élément précédent
    deselectPrevious(element) {
        if (element.setSelected && typeof element.setSelected === 'function') {
            // Élément de construction standard
            element.setSelected(false);
        } else {
            // Élément d'annotation/mesure/texte/GLB - supprimer le highlight
            this.removeHighlight(element);
        }
    }

    // Mettre en évidence l'élément sélectionné
    highlightSelected(element) {
        if (element.setSelected && typeof element.setSelected === 'function') {
            // Élément de construction standard
            element.setSelected(true);
        } else {
            // Élément d'annotation/mesure/texte/GLB - ajouter un highlight
            this.addHighlight(element);
        }
    }

    // Ajouter un highlight visuel pour les éléments non-construction
    addHighlight(element) {
        console.log('🎨 DEBUG addHighlight:', { elementType: element.type, isGLBModel: element.isGLBModel, elementName: element.name });
        
        if (element.type === 'measurement') {
            this.highlightMeasurement(element, true);
        } else if (element.type === 'annotation') {
            this.highlightAnnotation(element, true);
        } else if (element.type === 'textleader') {
            this.highlightTextLeader(element, true);
        } else if (element.type === 'glb' || element.isGLBModel) {
            console.log('✨ DEBUG: Activation surbrillance GLB pour:', element.glbFileName || element.name);
            this.highlightGLBModel(element, true);
        }
    }

    // Supprimer le highlight visuel
    removeHighlight(element) {
        if (element.type === 'measurement') {
            this.highlightMeasurement(element, false);
        } else if (element.type === 'annotation') {
            this.highlightAnnotation(element, false);
        } else if (element.type === 'textleader') {
            this.highlightTextLeader(element, false);
        } else if (element.type === 'glb' || element.isGLBModel) {
            this.highlightGLBModel(element, false);
        }
    }

    // Highlight spécifique pour les cotations
    highlightMeasurement(measurementElement, highlight) {
        if (!measurementElement.group) return;
        
        const color = highlight ? 0x00ff00 : 0x000000;
        const opacity = highlight ? 1.0 : 0.7;
        
        measurementElement.group.traverse((child) => {
            if (child.material) {
                if (child.material.color) {
                    child.material.color.setHex(color);
                }
                if (child.material.transparent !== undefined) {
                    child.material.opacity = opacity;
                }
            }
        });
    }

    // Highlight spécifique pour les annotations
    highlightAnnotation(annotationElement, highlight) {
        if (annotationElement.sprite && annotationElement.sprite.material) {
            const material = annotationElement.sprite.material;
            if (highlight) {
                // Sauvegarder la couleur originale AVANT de la changer
                if (!annotationElement._originalColor) {
                    annotationElement._originalColor = material.color.getHex();
                }
                material.color.setHex(0x00ff00);
                console.log('✨ Annotation surbrillance activée:', annotationElement.id);
            } else {
                // Restaurer la couleur originale
                const originalColor = annotationElement._originalColor || 0xffffff;
                material.color.setHex(originalColor);
                console.log('🔄 Annotation surbrillance désactivée:', annotationElement.id);
                // Réinitialiser pour la prochaine sélection
                delete annotationElement._originalColor;
            }
        }
    }

    // Highlight spécifique pour les textes avec ligne d'attache
    highlightTextLeader(textLeaderElement, highlight) {
        if (!textLeaderElement.group) return;
        
        const color = highlight ? 0x00ff00 : 0x000000;
        
        textLeaderElement.group.traverse((child) => {
            if (child.material && child.material.color) {
                child.material.color.setHex(color);
            }
        });
    }

    // Highlight spécifique pour les modèles GLB
    highlightGLBModel(glbElement, highlight) {
        if (!glbElement) return;
        
        // Parcourir tous les meshes du modèle GLB
        glbElement.traverse((child) => {
            if (child.isMesh && child.material) {
                if (highlight) {
                    // Sauvegarder les matériaux originaux s'ils ne sont pas déjà sauvegardés
                    if (!child.userData.originalMaterial) {
                        if (Array.isArray(child.material)) {
                            child.userData.originalMaterial = child.material.map(mat => mat.clone());
                        } else {
                            child.userData.originalMaterial = child.material.clone();
                        }
                    }
                    
                    // Appliquer l'effet de surbrillance
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.emissive = new THREE.Color(0x0044AA); // Bleu émissif
                            mat.emissiveIntensity = 0.5;
                        });
                    } else {
                        child.material.emissive = new THREE.Color(0x0044AA); // Bleu émissif
                        child.material.emissiveIntensity = 0.5;
                    }
                } else {
                    // Restaurer les matériaux originaux
                    if (child.userData.originalMaterial) {
                        if (Array.isArray(child.userData.originalMaterial)) {
                            child.material = child.userData.originalMaterial.map(mat => mat.clone());
                        } else {
                            child.material = child.userData.originalMaterial.clone();
                        }
                        delete child.userData.originalMaterial;
                    }
                }
            }
        });
        
        console.log(highlight ? '✨ Modèle GLB surbrillance activée:' : '🔄 Modèle GLB surbrillance désactivée:', 
                   glbElement.glbFileName || glbElement.name);
    }

    deselectElement() {
        // Désélectionner l'élément actuel
        if (this.selectedElement) {
            this.deselectPrevious(this.selectedElement);
            this.selectedElement = null;
            
            // Émettre un événement de déselection
            document.dispatchEvent(new CustomEvent('elementDeselected'));
        }
    }

    checkCollisions(newElement, allowVerticalStacking = false, supportElement = null) {
        // ❌ SYSTÈME DE COLLISION COMPLÈTEMENT DÉSACTIVÉ
        // console.log(`🚫 Système de collision désactivé - placement libre autorisé pour ${newElement.id}`);
        return false; // Toujours autoriser le placement (pas de collision)
        
        // Vérifier si l'élément sort des limites de la zone de construction
        const bounds = this.getConstructionBounds();
        if (!this.isWithinBounds(newElement, bounds)) {
            console.warn('Élément en dehors des limites de construction');
            return true;
        }
        
        return false;
    }

    // Vérifier si l'empilage vertical est valide
    isValidVerticalStacking(newElement, supportElement) {
        const tolerance = 0.1; // Tolérance en cm
        
        // Vérifier l'alignement horizontal (X et Z)
        const deltaX = Math.abs(newElement.position.x - supportElement.position.x);
        const deltaZ = Math.abs(newElement.position.z - supportElement.position.z);
        
        if (deltaX > tolerance || deltaZ > tolerance) {
            // // console.log(`❌ Mauvais alignement horizontal: deltaX=${deltaX}, deltaZ=${deltaZ}`);
            return false;
        }
        
        // Vérifier l'alignement vertical (Y)
        const expectedY = supportElement.position.y + supportElement.dimensions.height;
        const deltaY = Math.abs(newElement.position.y - expectedY);
        
        if (deltaY > tolerance) {
            // // console.log(`❌ Mauvais alignement vertical: deltaY=${deltaY}, expectedY=${expectedY}, actualY=${newElement.position.y}`);
            return false;
        }
        
        // // console.log(`✅ Empilage vertical valide: deltaX=${deltaX}, deltaZ=${deltaZ}, deltaY=${deltaY}`);
        return true;
    }

    // Mettre en évidence un élément en collision
    highlightCollision(element) {
        if (!element || !element.mesh) return;
        
        const originalColor = element.mesh.material.color.getHex();
        const originalEmissive = element.mesh.material.emissive.getHex();
        
        // Effet de clignotement rouge
        element.mesh.material.color.setHex(0xff4444);
        element.mesh.material.emissive.setHex(0x442222);

        // Restaurer la couleur après 500ms
        setTimeout(() => {
            if (element && element.mesh && element.mesh.material) {
                element.mesh.material.color.setHex(originalColor);
                element.mesh.material.emissive.setHex(originalEmissive);
            }
        }, 500);
    }

    // Effet visuel pour indiquer qu'une sélection est bloquée
    showSelectionBlocked(element) {
        if (!element || !element.mesh) return;
        
        const originalColor = element.mesh.material.color.getHex();
        const originalEmissive = element.mesh.material.emissive.getHex();
        
        // Effet de clignotement orange pour indiquer "bloqué"
        element.mesh.material.color.setHex(0xff8844);
        element.mesh.material.emissive.setHex(0x442211);

        // Restaurer la couleur après 300ms
        setTimeout(() => {
            if (element && element.mesh && element.mesh.material) {
                element.mesh.material.color.setHex(originalColor);
                element.mesh.material.emissive.setHex(originalEmissive);
            }
        }, 300);
    }

    // Trouver un élément d'annotation, de mesure ou de texte dans les intersections
    findAnnotationElement(intersects) {
        for (const intersect of intersects) {
            const object = intersect.object;
            
            // Vérifier les cotations (measurements) - ID direct
            if (object.userData.measurementId !== undefined || object.userData.measurementType) {
                console.log('📏 Cotation détectée directement:', object.userData);
                return this.createMeasurementSelectionData(object);
            }
            
            // Vérifier les annotations - ID direct
            if (object.userData.annotationId !== undefined || object.userData.annotationType) {
                console.log('📝 Annotation détectée directement:', object.userData);
                return this.createAnnotationSelectionData(object);
            }
            
            // Vérifier les textes avec ligne d'attache - ID direct
            if (object.userData.textLeaderId !== undefined || object.userData.textLeaderType) {
                console.log('📋 TextLeader détecté directement:', object.userData);
                return this.createTextLeaderSelectionData(object);
            }
            
            // Vérifier si l'objet appartient à un groupe de mesure/annotation
            let parent = object.parent;
            let depth = 0;
            while (parent && depth < 5) { // Limite de profondeur pour éviter boucles infinies
                // console.log('🔍 Vérification parent niveau', depth, ':', parent.name, parent.userData);
                
                if (parent.userData.measurementId !== undefined || parent.userData.measurementType) {
                    console.log('📏 Cotation détectée via parent:', parent.userData);
                    return this.createMeasurementSelectionData(parent, object);
                }
                if (parent.userData.annotationId !== undefined || parent.userData.annotationType) {
                    console.log('📝 Annotation détectée via parent:', parent.userData);
                    return this.createAnnotationSelectionData(parent, object);
                }
                if (parent.userData.textLeaderId !== undefined || parent.userData.textLeaderType) {
                    console.log('📋 TextLeader détecté via parent:', parent.userData);
                    return this.createTextLeaderSelectionData(parent, object);
                }
                
                parent = parent.parent;
                depth++;
            }
        }
        
        // console.log('❌ Aucun élément d\'annotation/mesure/texte trouvé dans les intersections');
        return null;
    }

    // Créer les données de sélection pour une cotation
    createMeasurementSelectionData(measurementObject, childObject = null) {
        const measurementId = measurementObject.userData.measurementId;
        let measurementData = null;
        
        // Chercher dans MeasurementTool
        if (window.MeasurementTool && window.MeasurementTool.measurements) {
            measurementData = window.MeasurementTool.measurements.find(m => m.id === measurementId);
        }
        
        return {
            id: `measurement-${measurementId}`,
            type: 'measurement',
            toolType: 'measurement',
            data: measurementData,
            mesh: childObject || measurementObject,
            group: measurementObject,
            properties: this.getMeasurementProperties(measurementData)
        };
    }

    // Créer les données de sélection pour une annotation
    createAnnotationSelectionData(annotationObject, childObject = null) {
        const annotationId = annotationObject.userData.annotationId;
        let annotationData = null;
        
        // Chercher dans AnnotationTool
        if (window.AnnotationTool && window.AnnotationTool.annotations) {
            annotationData = window.AnnotationTool.annotations.find(a => a.id === annotationId);
        }
        
        return {
            id: `annotation-${annotationId}`,
            type: 'annotation',
            toolType: 'annotation',
            data: annotationData,
            mesh: childObject || annotationObject,
            sprite: annotationObject.isSprite ? annotationObject : null,
            group: annotationObject,
            properties: this.getAnnotationProperties(annotationData)
        };
    }

    // Créer les données de sélection pour un texte avec ligne d'attache
    createTextLeaderSelectionData(textLeaderObject, childObject = null) {
        const textLeaderId = textLeaderObject.userData.textLeaderId;
        let textLeaderData = null;
        
        // Chercher dans TextLeaderTool
        if (window.TextLeaderTool && window.TextLeaderTool.textAnnotations) {
            textLeaderData = window.TextLeaderTool.textAnnotations.find(t => t.id === textLeaderId);
        }
        
        return {
            id: `textleader-${textLeaderId}`,
            type: 'textleader',
            toolType: 'texte avec ligne d\'attache',
            data: textLeaderData,
            mesh: childObject || textLeaderObject,
            sprite: textLeaderObject.isSprite ? textLeaderObject : null,
            group: textLeaderObject,
            properties: this.getTextLeaderProperties(textLeaderData)
        };
    }

    // Obtenir les propriétés d'une cotation
    getMeasurementProperties(measurementData) {
        if (!measurementData) return {};
        
        // Récupérer les propriétés configurables de l'outil de mesure
        let textScale = 15;
        let textHeight = 4;
        let arrowSize = 1.5;
        let lineWidth = 2;
        
        if (window.MeasurementTool) {
            textScale = window.MeasurementTool.textScale || 15;
            textHeight = window.MeasurementTool.textHeight || 4;
            arrowSize = window.MeasurementTool.arrowSize || 1.5;
            lineWidth = window.MeasurementTool.lineWidth || 2;
        }
        
        return {
            'Type': 'Cotation',
            'Distance': measurementData.distance ? measurementData.distance.toFixed(2) + ' cm' : 'N/A',
            'Point de départ': measurementData.startPoint ? 
                `(${measurementData.startPoint.x.toFixed(1)}, ${measurementData.startPoint.y.toFixed(1)}, ${measurementData.startPoint.z.toFixed(1)})` : 'N/A',
            'Point d\'arrivée': measurementData.endPoint ? 
                `(${measurementData.endPoint.x.toFixed(1)}, ${measurementData.endPoint.y.toFixed(1)}, ${measurementData.endPoint.z.toFixed(1)})` : 'N/A',
            'Position cotation': measurementData.dimensionPoint ? 
                `(${measurementData.dimensionPoint.x.toFixed(1)}, ${measurementData.dimensionPoint.y.toFixed(1)}, ${measurementData.dimensionPoint.z.toFixed(1)})` : 'N/A',
            'ID': measurementData.id || 'N/A',
            'Taille du texte': textScale,
            'Hauteur du texte': textHeight,
            'Taille des flèches': arrowSize,
            'Épaisseur des lignes': lineWidth
        };
    }

    // Obtenir les propriétés d'une annotation
    getAnnotationProperties(annotationData) {
        if (!annotationData) return {};
        
        return {
            'Type': 'Annotation',
            'Sous-type': annotationData.type || 'N/A',
            'Texte': annotationData.text || 'N/A',
            'Taille': annotationData.size || 'N/A',
            'Position': annotationData.position ? 
                `(${annotationData.position.x.toFixed(1)}, ${annotationData.position.y.toFixed(1)}, ${annotationData.position.z.toFixed(1)})` : 'N/A',
            'ID': annotationData.id || 'N/A'
        };
    }

    // Obtenir les propriétés d'un texte avec ligne d'attache
    getTextLeaderProperties(textLeaderData) {
        if (!textLeaderData) return {};
        
        return {
            'Type': 'Texte avec ligne d\'attache',
            'Texte': textLeaderData.text || 'N/A',
            'Position texte': textLeaderData.textPosition ? 
                `(${textLeaderData.textPosition.x.toFixed(1)}, ${textLeaderData.textPosition.y.toFixed(1)}, ${textLeaderData.textPosition.z.toFixed(1)})` : 'N/A',
            'Point d\'attache': textLeaderData.anchorPoint ? 
                `(${textLeaderData.anchorPoint.x.toFixed(1)}, ${textLeaderData.anchorPoint.y.toFixed(1)}, ${textLeaderData.anchorPoint.z.toFixed(1)})` : 'N/A',
            'Longueur ligne': textLeaderData.lineLength ? textLeaderData.lineLength.toFixed(2) + ' cm' : 'N/A',
            'ID': textLeaderData.id || 'N/A'
        };
    }

    // Obtenir les limites de la zone de construction
    getConstructionBounds() {
        return {
            minX: -500,
            maxX: 500,
            minZ: -500,
            maxZ: 500,
            minY: 0,
            maxY: 300 // Hauteur maximale de 3 mètres
        };
    }

    // Vérifier si un élément est dans les limites
    isWithinBounds(element, bounds) {
        const pos = element.position;
        const dim = element.dimensions;
        
        return pos.x - dim.length/2 >= bounds.minX &&
               pos.x + dim.length/2 <= bounds.maxX &&
               pos.z - dim.width/2 >= bounds.minZ &&
               pos.z + dim.width/2 <= bounds.maxZ &&
               pos.y >= bounds.minY &&
               pos.y + dim.height <= bounds.maxY;
    }

    setCameraView(viewName) {
        const view = this.cameraPositions[viewName];
        if (view && this.camera) {
            this.camera.position.set(...view.position);
            if (this.controls) {
                this.controls.target.set(...view.target);
                this.controls.update();
            }
        }
    }

    setGridSpacing(spacing) {
        this.gridSpacing = spacing;
        this.createGrid();
    }

    setGridVisible(visible) {
        this.showGrid = visible;
        if (this.grid) {
            this.grid.visible = visible;
        }
    }

    isGridVisible() {
        return this.showGrid;
    }

    areAxesVisible() {
        return this.showAxes;
    }

    setAxesVisible(visible) {
        this.showAxes = visible;
        if (this.axesHelper) {
            this.axesHelper.visible = visible;
        }
    }

    zoomIn() {
        if (this.controls && this.camera) {
            // Approche simple : déplacer la caméra vers le target
            const direction = new THREE.Vector3().subVectors(this.controls.target, this.camera.position).normalize();
            const distance = this.camera.position.distanceTo(this.controls.target);
            const zoomDistance = distance * 0.1; // 10% de rapprochement
            
            this.camera.position.add(direction.multiplyScalar(zoomDistance));
            this.controls.update();
        }
    }

    zoomOut() {
        if (this.controls && this.camera) {
            // Approche simple : éloigner la caméra du target
            const direction = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).normalize();
            const distance = this.camera.position.distanceTo(this.controls.target);
            const zoomDistance = distance * 0.1; // 10% d'éloignement
            
            this.camera.position.add(direction.multiplyScalar(zoomDistance));
            this.controls.update();
        }
    }

    zoomToFit() {
        if (this.controls) {
            this.controls.reset();
        }
    }

    clearAll() {
        for (const [id, element] of this.elements) {
            this.scene.remove(element.mesh);
            element.dispose();
        }
        this.elements.clear();
        this.selectedElement = null;

        // Émettre un événement
        document.dispatchEvent(new CustomEvent('sceneCleared'));
    }

    getAllElements() {
        return Array.from(this.elements.values());
    }

    exportScene() {
        return {
            elements: Array.from(this.elements.values()).filter(el => {
                // Exclure les éléments GLB qui ne supportent pas toJSON
                if (el.type === 'glb' || (el.userData && el.userData.isGLB)) {
                    return false;
                }
                return true;
            }).map(el => el.toJSON()),
            gridSpacing: this.gridSpacing,
            showGrid: this.showGrid
        };
    }

    importScene(sceneData) {
        // Marquer qu'on est en cours d'import pour éviter les événements parasites
        this.isImporting = true;
        // console.log('📥 Début d\'importation de scène - événements désactivés');

        // PROTECTION CRITIQUE: Ne pas vider la scène si les données à importer sont vides ou invalides
        if (!sceneData || !sceneData.elements || sceneData.elements.length === 0) {
            console.warn('⚠️ PROTECTION: Tentative d\'import de données vides - import annulé pour protéger les éléments existants');
            this.isImporting = false;
            return;
        }

        // console.log(`📦 Import de ${sceneData.elements.length} éléments validé - procédure normale`);

        try {
            this.clearAll();
            
            if (sceneData.elements) {
                // console.log(`📦 Import de ${sceneData.elements.length} éléments`);
                
                // Première passe : créer tous les éléments mais ne pas encore corriger les joints
                const elementsCreated = [];
                sceneData.elements.forEach((elementData, index) => {
                    const element = WallElement.fromJSON(elementData);
                    // console.log(`📦 Import élément ${index + 1}/${sceneData.elements.length}: ${element.type} (${element.id}) à la position:`, element.position);
                    
                    // Diagnostic spécial pour les joints
                    if (element.isVerticalJoint || element.isHorizontalJoint) {
                        // console.log(`🔧 Joint détecté - Type: ${element.isVerticalJoint ? 'vertical' : 'horizontal'}, Position originale: (${element.position.x.toFixed(2)}, ${element.position.y.toFixed(2)}, ${element.position.z.toFixed(2)})`);
                    }
                    
                    elementsCreated.push(element);
                    this.addElement(element);
                });
                
                // Seconde passe : corriger les positions Y des joints horizontaux
                this.correctJointPositions(elementsCreated);
            }

            if (sceneData.gridSpacing) {
                this.setGridSpacing(sceneData.gridSpacing);
            }

            if (sceneData.showGrid !== undefined) {
                this.setGridVisible(sceneData.showGrid);
            }

            // console.log('✅ Import de scène terminé');
        } finally {
            // Toujours restaurer l'état même en cas d'erreur
            this.isImporting = false;
            // console.log('🔄 Import terminé - événements réactivés');
        }
    }

    /**
     * Corrige les positions des joints horizontaux après import
     * Utilise la même logique que le système de suggestions pour les joints horizontaux
     * @param {Array} elements - Liste des éléments importés
     */
    correctJointPositions(elements) {
        // console.log('🔧 Correction des positions des joints horizontaux...');
        
        // Séparer les éléments de construction (briques/blocs) des joints
        const constructionElements = elements.filter(el => el.type === 'brick' || el.type === 'block');
        const horizontalJoints = elements.filter(el => el.isHorizontalJoint);
        
        // console.log(`🔧 Trouvé ${constructionElements.length} éléments de construction et ${horizontalJoints.length} joints horizontaux`);
        
        if (horizontalJoints.length === 0) {
            console.log('🔧 Aucun joint horizontal à corriger');
            return;
        }
        
        horizontalJoints.forEach(joint => {
            // Trouver l'élément de construction associé (même position X et Z)
            const associatedElement = constructionElements.find(element => {
                const positionMatch = Math.abs(element.position.x - joint.position.x) < 1 && 
                                    Math.abs(element.position.z - joint.position.z) < 1;
                const dimensionMatch = Math.abs(element.dimensions.length - joint.dimensions.length) < 1 &&
                                     Math.abs(element.dimensions.width - joint.dimensions.width) < 1;
                return positionMatch && dimensionMatch;
            });
            
            if (associatedElement) {
                // console.log(`🔧 Correction du joint horizontal ${joint.id} pour l'élément ${associatedElement.id}`);
                
                // UTILISER LA MÊME LOGIQUE QUI FONCTIONNE DANS LE SYSTÈME DE SUGGESTIONS
                // Joint horizontal: épaisseur fixe de 1.2 cm, face supérieure touche la face inférieure de la brique
                const faceInferieureBrique = associatedElement.position.y - associatedElement.dimensions.height / 2;
                const hauteurJoint = window.AssiseManager ? window.AssiseManager.jointHeight : 1.2; // 1.2 cm fixe
                const newJointY = faceInferieureBrique - hauteurJoint / 2;
                
                const oldPosition = joint.position.y;
                
                // console.log(`✅ Calcul avec la logique qui fonctionne:`);
                // console.log(`   - Élément Y: ${associatedElement.position.y.toFixed(2)}, hauteur: ${associatedElement.dimensions.height.toFixed(2)}`);
                // console.log(`   - Face inférieure brique: ${faceInferieureBrique.toFixed(2)}`);
                // console.log(`   - Hauteur joint: ${hauteurJoint.toFixed(2)}`);
                // console.log(`   - Position Y calculée: ${newJointY.toFixed(2)}`);
                // console.log(`   - Correction: ${oldPosition.toFixed(2)} → ${newJointY.toFixed(2)}`);
                
                // Appliquer la correction
                joint.position.y = newJointY;
                joint.dimensions.height = hauteurJoint;
                
                // Mettre à jour le mesh 3D
                if (joint.mesh) {
                    joint.updateMeshPosition();
                    // console.log(`🔧 Mesh du joint ${joint.id} mis à jour avec la logique qui fonctionne`);
                }
            } else {
                console.warn(`⚠️ Aucun élément associé trouvé pour le joint horizontal ${joint.id}`);
            }
        });
        
        // console.log('✅ Correction des positions des joints horizontaux terminée');
    }

    animate() {
        this.isAnimating = true; // Flag pour éviter les doubles boucles
        
        // Utiliser une approche plus optimisée pour l'animation
        const animateFrame = () => {
            if (this.controls) {
                this.controls.update();
            }
            
            // Throttling plus agressif pour les suggestions de survol - seulement tous les 10 frames
            this._suggestionFrame = (this._suggestionFrame || 0) + 1;
            if (this._suggestionFrame % 10 === 0) {
                this.handleSuggestionHover();
            }
            
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }

            // Mise à jour des performances - seulement tous les 60 frames (~1 seconde)
            this._perfFrame = (this._perfFrame || 0) + 1;
            if (this._perfFrame % 60 === 0) {
                this.updatePerformance();
            }
        };
        
        // Exécuter l'animation
        animateFrame();
        
        // Programmer la prochaine frame
        requestAnimationFrame(() => this.animate());
    }

    dispose() {
        // Arrêter la boucle d'animation
        this.isAnimating = false;
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        this.clearAll();
        
        // Nettoyer les event listeners
        window.removeEventListener('resize', this.onWindowResize);
    }

    setupBasicControls() {
        // Contrôles basiques sans OrbitControls
        
        // Variables pour le contrôle de la souris
        this.isMouseDown = false;
        this.isMiddleMouseDown = false;  // ✨ NOUVEAU: Suivi du bouton du milieu
        this.mousePosition = { x: 0, y: 0 };
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        
        // Event listeners pour les contrôles manuels
        this.renderer.domElement.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Bouton gauche
                this.isMouseDown = true;
                this.mousePosition.x = e.clientX;
                this.mousePosition.y = e.clientY;
            } else if (e.button === 1) { // ✨ NOUVEAU: Bouton du milieu
                e.preventDefault(); // Empêcher le comportement par défaut (scroll)
                this.isMiddleMouseDown = true;
                this.mousePosition.x = e.clientX;
                this.mousePosition.y = e.clientY;
            }
        });
        
        this.renderer.domElement.addEventListener('mouseup', (e) => {
            if (e.button === 0) { // Bouton gauche
                this.isMouseDown = false;
            } else if (e.button === 1) { // ✨ NOUVEAU: Bouton du milieu
                this.isMiddleMouseDown = false;
            }
        });
        
        // ✨ NOUVEAU: Empêcher le menu contextuel sur bouton du milieu
        this.renderer.domElement.addEventListener('contextmenu', (e) => {
            if (e.button === 1) {
                e.preventDefault();
            }
        });
        
        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (this.isMouseDown && !this.isMiddleMouseDown) {
                // Rotation avec bouton gauche (comportement existant)
                const deltaX = e.clientX - this.mousePosition.x;
                const deltaY = e.clientY - this.mousePosition.y;
                
                // Rotation basique
                this.camera.position.x = this.camera.position.x * Math.cos(deltaX * 0.01) - this.camera.position.z * Math.sin(deltaX * 0.01);
                this.camera.position.z = this.camera.position.x * Math.sin(deltaX * 0.01) + this.camera.position.z * Math.cos(deltaX * 0.01);
                
                this.camera.lookAt(this.cameraTarget);
                
                this.mousePosition.x = e.clientX;
                this.mousePosition.y = e.clientY;
            } else if (this.isMiddleMouseDown) {
                // ✨ NOUVEAU: Pannage avec bouton du milieu
                const deltaX = e.clientX - this.mousePosition.x;
                const deltaY = e.clientY - this.mousePosition.y;
                
                // Calculer les vecteurs de déplacement de la caméra
                const camera = this.camera;
                const panSpeed = 0.5; // Sensibilité du pannage
                
                // Vecteur droite de la caméra
                const rightVector = new THREE.Vector3();
                rightVector.setFromMatrixColumn(camera.matrix, 0);
                rightVector.normalize();
                
                // Vecteur haut de la caméra  
                const upVector = new THREE.Vector3();
                upVector.setFromMatrixColumn(camera.matrix, 1);
                upVector.normalize();
                
                // Déplacer la caméra et sa cible
                const panOffset = new THREE.Vector3();
                panOffset.addScaledVector(rightVector, -deltaX * panSpeed);
                panOffset.addScaledVector(upVector, deltaY * panSpeed);
                
                camera.position.add(panOffset);
                this.cameraTarget.add(panOffset);
                camera.lookAt(this.cameraTarget);
                
                this.mousePosition.x = e.clientX;
                this.mousePosition.y = e.clientY;
            }
        });
        
        // Zoom avec la molette
        this.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.1;
            const direction = new THREE.Vector3();
            this.camera.getWorldDirection(direction);
            
            if (e.deltaY > 0) {
                // Zoom out
                this.camera.position.add(direction.multiplyScalar(-10));
            } else {
                // Zoom in
                this.camera.position.add(direction.multiplyScalar(10));
            }
        });
        
        // Objet controls simulé pour compatibilité
        this.controls = {
            update: () => {},
            target: this.cameraTarget,
            enableDamping: true,
            dampingFactor: 0.05
        };
    }

    handleSuggestionHover() {
        // Gérer le survol des suggestions uniquement si elles sont actives
        if (!window.ConstructionTools || !window.ConstructionTools.activeBrickForSuggestions) {
            return;
        }
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const suggestionMeshes = window.ConstructionTools.suggestionGhosts.map(ghost => ghost.mesh);
        const intersects = this.raycaster.intersectObjects(suggestionMeshes);
        
        // Réinitialiser tous les états de survol
        window.ConstructionTools.suggestionGhosts.forEach(ghost => {
            if (ghost.mesh.material) {
                ghost.mesh.material.opacity = 0.5;
                ghost.mesh.material.emissiveIntensity = 0.3;
                ghost.mesh.scale.setScalar(1.0); // Échelle normale
            }
        });
        
        // Appliquer l'effet de survol sur l'élément intersecté
        if (intersects.length > 0) {
            const hoveredMesh = intersects[0].object;
            if (hoveredMesh.material) {
                hoveredMesh.material.opacity = 0.8;
                hoveredMesh.material.emissiveIntensity = 0.6;
                hoveredMesh.scale.setScalar(1.05); // Légère augmentation de taille
                
                // Son de survol supprimé
                
                // Changer le curseur pour indiquer qu'on peut cliquer
                document.body.style.cursor = 'pointer';
            }
        } else {
            // Rétablir le curseur par défaut en mode sélection
            if (window.ConstructionTools.activeBrickForSuggestions) {
                document.body.style.cursor = 'crosshair';
            } else {
                document.body.style.cursor = 'default';
            }
        }
    }

    // Gestion du survol des points d'accroche
    handleAttachmentPointHover() {
        // Vérifier si les marqueurs d'accroche sont actifs
        if (!window.AssiseManager || !window.AssiseManager.showAttachmentMarkers) {
            return;
        }
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Collecter tous les points d'accroche de tous les marqueurs
        const attachmentPoints = [];
        window.AssiseManager.attachmentMarkers.forEach((markers, assiseIndex) => {
            markers.forEach(markerInfo => {
                markerInfo.group.traverse(child => {
                    if (child.userData && child.userData.type && !child.userData.isHalo) {
                        attachmentPoints.push(child);
                    }
                });
            });
        });
        
        if (attachmentPoints.length === 0) return;
        
        // Vérifier les intersections avec les points d'accroche
        const intersects = this.raycaster.intersectObjects(attachmentPoints);
        
        // Gérer le survol via l'AssiseManager
        if (intersects.length > 0) {
            const hoveredPoint = intersects[0].object;
            const pointData = window.AssiseManager.handleAttachmentPointHover(hoveredPoint);
            
            if (pointData) {
                // Changer le curseur pour indiquer qu'on peut accrocher
                document.body.style.cursor = 'grab';
                
                // Son de survol supprimé
            }
        } else {
            // Aucun point d'accroche survolé - réinitialiser tous les états
            window.AssiseManager.handleAttachmentPointHover(null);
            
            // Rétablir le curseur approprié
            if (window.ConstructionTools && window.ConstructionTools.activeBrickForSuggestions) {
                document.body.style.cursor = 'crosshair';
            } else {
                document.body.style.cursor = 'default';
            }
        }
    }

    // Animation de placement d'une suggestion
    animateSuggestionPlacement(ghost, onComplete) {
        if (!ghost || !ghost.mesh) {
            onComplete();
            return;
        }
        
        const startTime = Date.now();
        const duration = 200; // 200ms d'animation
        const originalScale = ghost.mesh.scale.x;
        const originalOpacity = ghost.mesh.material.opacity;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Animation de scale down + fade out
            const scale = originalScale * (1 - progress * 0.3);
            const opacity = originalOpacity * (1 - progress);
            
            ghost.mesh.scale.setScalar(scale);
            ghost.mesh.material.opacity = opacity;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                onComplete();
            }
        };
        
        animate();
    }

    // Système de performance et optimisation
    updatePerformance() {
        this.frameCount++;
        const now = performance.now();
        
        if (now >= this.lastFPSUpdate + 1000) {
            this.currentFPS = Math.round((this.frameCount * 1000) / (now - this.lastFPSUpdate));
            this.frameCount = 0;
            this.lastFPSUpdate = now;
            
            // Optimisation automatique basée sur les FPS
            this.autoOptimize();
            
            // Mettre à jour l'affichage des performances (si demandé)
            this.updatePerformanceDisplay();
        }
    }

    autoOptimize() {
        const elementCount = this.elements.size;
        
        // Si les performances sont faibles avec beaucoup d'éléments
        if (this.currentFPS < 30 && elementCount > 50) {
            
            
            // Réduire la qualité des ombres
            if (this.renderer.shadowMap.enabled) {
                this.renderer.shadowMap.type = THREE.BasicShadowMap;
            }
            
            // Simplifier les matériaux pour les éléments éloignés
            this.optimizeDistantElements();
        }
        
        // Si les performances sont bonnes, restaurer la qualité
        else if (this.currentFPS > 50) {
            if (this.renderer.shadowMap.type !== THREE.PCFSoftShadowMap) {
                this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            }
        }
    }

    optimizeDistantElements() {
        const cameraPosition = this.camera.position;
        const maxDistance = 200; // cm
        
        for (const [id, element] of this.elements) {
            const distance = cameraPosition.distanceTo(element.mesh.position);
            
            if (distance > maxDistance) {
                // Réduire le niveau de détail pour les éléments éloignés
                if (element.mesh.material.map) {
                    element.mesh.material.map.minFilter = THREE.LinearFilter;
                }
            } else {
                // Restaurer le niveau de détail pour les éléments proches
                if (element.mesh.material.map) {
                    element.mesh.material.map.minFilter = THREE.LinearMipmapLinearFilter;
                }
            }
        }
    }

    updatePerformanceDisplay() {
        // Mettre à jour un affichage de performance si disponible
        const perfDisplay = document.getElementById('performance-info');
        if (perfDisplay) {
            perfDisplay.innerHTML = `
                FPS: ${this.currentFPS} | 
                Éléments: ${this.elements.size} | 
                Triangles: ${this.getTriangleCount()}
            `;
        }
    }

    getTriangleCount() {
        let triangles = 0;
        this.scene.traverse((object) => {
            if (object.geometry) {
                if (object.geometry.index) {
                    triangles += object.geometry.index.count / 3;
                } else {
                    triangles += object.geometry.attributes.position.count / 3;
                }
            }
        });
        return Math.round(triangles);
    }

    // Trouver automatiquement la hauteur d'empilage et l'élément support
    findAutoStackingHeight(x, z) {
        let maxHeight = 0;
        let supportElement = null;
        const elements = this.getAllElements();
        
        if (!elements || elements.length === 0) {
            return { height: 0, supportElement: null };
        }
        
        const tolerance = 5; // Tolérance en cm pour détecter l'empilage
        
        elements.forEach(element => {
            const distance = Math.sqrt(
                Math.pow(element.position.x - x, 2) + 
                Math.pow(element.position.z - z, 2)
            );
            
            if (distance < tolerance) {
                const elementTop = element.position.y + element.dimensions.height;
                if (elementTop > maxHeight) {
                    maxHeight = elementTop;
                    supportElement = element; // Mémoriser l'élément le plus haut trouvé
                }
            }
        });
        
        return { height: maxHeight, supportElement: supportElement };
    }

    // === MÉTHODES POUR L'ONGLET PROJET ===
    
    getProjectData() {
        // Vérifier que la scène est initialisée
        if (!this.scene) {
            // console.warn('Scene non initialisée lors de getProjectData');
            return { elements: [], stats: { count: 0, volume: 0 } };
        }
        
        // Récupérer toutes les données des éléments placés
        const elements = [];
        
        this.scene.traverse((child) => {
            if (child.userData && child.userData.isPlacedElement) {
                elements.push({
                    type: child.userData.type || 'Unknown',
                    position: {
                        x: child.position.x,
                        y: child.position.y,
                        z: child.position.z
                    },
                    rotation: {
                        x: child.rotation.x,
                        y: child.rotation.y,
                        z: child.rotation.z
                    },
                    dimensions: child.userData.dimensions || 'N/A',
                    material: child.userData.material || 'Standard',
                    uuid: child.uuid,
                    timestamp: child.userData.timestamp || new Date().toISOString()
                });
            }
        });
        
        return elements;
    }

    loadProjectData(elements) {
        // Vider la scène actuelle
        this.clearAll();
        
        // Charger les éléments
        elements.forEach(elementData => {
            try {
                // Recréer l'élément à partir des données
                const element = this.recreateElement(elementData);
                if (element) {
                    element.position.set(
                        elementData.position.x,
                        elementData.position.y,
                        elementData.position.z
                    );
                    element.rotation.set(
                        elementData.rotation.x,
                        elementData.rotation.y,
                        elementData.rotation.z
                    );
                    
                    // Ajouter à la scène
                    this.scene.add(element);
                    this.elements.add(element);
                }
            } catch (error) {
                console.warn('Erreur lors du chargement d\'un élément:', error);
            }
        });
        
        // console.log(`🔄 Projet chargé: ${elements.length} éléments`);
    }

    recreateElement(elementData) {
        // Utiliser les outils de construction pour recréer l'élément
        if (window.ConstructionTools) {
            return window.ConstructionTools.createElementFromData(elementData);
        }
        return null;
    }

    // === MÉTHODES POUR L'ONGLET PRÉFÉRENCES ===
    
    toggleGrid(show) {
        if (this.grid) {
            this.grid.visible = show;
        }
    }

    toggleAxis(show) {
        if (this.axesHelper) {
            this.axesHelper.visible = show;
        }
    }

    setViewMode(mode) {
        this.scene.traverse((child) => {
            if (child.isMesh && child.userData.isPlacedElement) {
                switch (mode) {
                    case 'wireframe':
                        child.material.wireframe = true;
                        child.material.transparent = false;
                        child.material.opacity = 1;
                        break;
                    case 'transparent':
                        child.material.wireframe = false;
                        child.material.transparent = true;
                        child.material.opacity = 0.7;
                        break;
                    case 'solid':
                    default:
                        child.material.wireframe = false;
                        child.material.transparent = false;
                        child.material.opacity = 1;
                        break;
                }
            }
        });
    }

    setBackgroundColor(color) {
        if (this.scene) {
            this.scene.background = new THREE.Color(color);
        }
    }

    resetView() {
        if (this.controls) {
            this.controls.reset();
        }
        
        // Repositionner la caméra - position plus éloignée pour une vue d'ensemble
        this.camera.position.set(50, 50, 50);
        this.camera.lookAt(0, 0, 0);
    }

    // === MÉTHODES POUR L'ONGLET OMBRES ===
    
    setShadowsEnabled(enabled) {
        this.renderer.shadowMap.enabled = enabled;
        
        // Activer/désactiver les ombres sur tous les objets
        this.scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = enabled;
                child.receiveShadow = enabled;
            }
            if (child.isLight && child.type !== 'AmbientLight') {
                child.castShadow = enabled;
            }
        });
    }

    setShadowIntensity(intensity) {
        this.scene.traverse((child) => {
            if (child.isLight && child.type === 'DirectionalLight') {
                child.intensity = intensity;
            }
        });
    }

    setSunPosition(azimuth, elevation) {
        if (!this.scene) {
            console.warn('🌞 setSunPosition: Scene non initialisée, opération ignorée');
            return;
        }
        
        this.scene.traverse((child) => {
            if (child.isLight && child.type === 'DirectionalLight') {
                if (azimuth !== null) {
                    const azimuthRad = (azimuth * Math.PI) / 180;
                    const currentElevation = Math.asin(child.position.y / child.position.length());
                    const radius = child.position.length();
                    
                    child.position.x = radius * Math.cos(currentElevation) * Math.cos(azimuthRad);
                    child.position.z = radius * Math.cos(currentElevation) * Math.sin(azimuthRad);
                }
                
                if (elevation !== null) {
                    const elevationRad = (elevation * Math.PI) / 180;
                    const currentAzimuth = Math.atan2(child.position.z, child.position.x);
                    const radius = child.position.length();
                    
                    child.position.x = radius * Math.cos(elevationRad) * Math.cos(currentAzimuth);
                    child.position.y = radius * Math.sin(elevationRad);
                    child.position.z = radius * Math.cos(elevationRad) * Math.sin(currentAzimuth);
                }
                
                child.lookAt(0, 0, 0);
            }
        });
    }

    setShadowMapSize(size) {
        this.scene.traverse((child) => {
            if (child.isLight && child.castShadow) {
                child.shadow.mapSize.width = size;
                child.shadow.mapSize.height = size;
                child.shadow.map = null; // Forcer la recréation
            }
        });
    }

    // === NOUVELLES MÉTHODES POUR SHADOWMANAGER ===
    
    setAmbientLightIntensity(intensity) {
        this.scene.traverse((child) => {
            if (child.isLight && child.type === 'AmbientLight') {
                child.intensity = intensity;
            }
        });
        // console.log(`🌒 Intensité éclairage ambiant: ${intensity}`);
    }

    setShadowSoftness(softness) {
        this.scene.traverse((child) => {
            if (child.isLight && child.castShadow) {
                // Ajuster le rayon des ombres pour l'adoucissement
                child.shadow.radius = softness;
                child.shadow.blurSamples = Math.min(softness * 2, 25); // Limiter pour les performances
            }
        });
        // console.log(`✨ Adoucissement des ombres: ${softness}`);
    }

    setSunPositionAdvanced(azimuth, elevation, northOffset = 0) {
        // Version avancée qui prend en compte l'orientation du nord
        // L'azimut reçu est déjà corrigé par l'orientation du nord dans calculateSunPosition,
        // donc on l'utilise directement sans double correction
        this.setSunPosition(azimuth, elevation);
        // console.log(`☀️ Position solaire mise à jour: Azimut ${azimuth}° (orientation Nord: ${northOffset}°), Élévation ${elevation}°`);
    }

    getSunPosition() {
        // Retourner la position actuelle du soleil
        let sunLight = null;
        this.scene.traverse((child) => {
            if (child.isLight && child.type === 'DirectionalLight') {
                sunLight = child;
            }
        });

        if (sunLight) {
            const radius = sunLight.position.length();
            const elevation = Math.asin(sunLight.position.y / radius) * 180 / Math.PI;
            const azimuth = Math.atan2(sunLight.position.z, sunLight.position.x) * 180 / Math.PI;
            
            return {
                azimuth: (azimuth + 360) % 360,
                elevation: elevation,
                intensity: sunLight.intensity
            };
        }
        
        return { azimuth: 180, elevation: 45, intensity: 1.0 };
    }

    setTimeBasedLighting(hour, season = 'spring') {
        // Ajuster l'intensité et la couleur selon l'heure et la saison
        const isNight = hour < 6 || hour > 20;
        const isDawn = (hour >= 5 && hour <= 8);
        const isDusk = (hour >= 18 && hour <= 21);
        
        let lightColor = 0xffffff; // Blanc par défaut
        let lightIntensity = 1.0;
        let ambientIntensity = 0.4;

        if (isNight) {
            lightColor = 0x404080; // Bleu nuit
            lightIntensity = 0.1;
            ambientIntensity = 0.1;
        } else if (isDawn) {
            lightColor = 0xffccaa; // Orange doux
            lightIntensity = 0.7;
            ambientIntensity = 0.3;
        } else if (isDusk) {
            lightColor = 0xff9966; // Orange chaud
            lightIntensity = 0.8;
            ambientIntensity = 0.3;
        } else {
            // Jour - ajuster selon la saison
            switch (season) {
                case 'summer':
                    lightColor = 0xffffff;
                    lightIntensity = 1.2;
                    break;
                case 'winter':
                    lightColor = 0xf0f8ff;
                    lightIntensity = 0.8;
                    break;
                default: // spring/autumn
                    lightColor = 0xfffaf0;
                    lightIntensity = 1.0;
            }
        }

        // Appliquer les changements
        this.scene.traverse((child) => {
            if (child.isLight && child.type === 'DirectionalLight') {
                child.color.setHex(lightColor);
                child.intensity = lightIntensity;
            } else if (child.isLight && child.type === 'AmbientLight') {
                child.intensity = ambientIntensity;
            }
        });

        // console.log(`🎨 Éclairage temporel: ${hour}h, saison: ${season}, couleur: #${lightColor.toString(16)}`);
    }

    // === GESTION DE LA FLÈCHE DU NORD ===
    
    setNorthOrientation(angle) {
        if (this.northArrowGroup) {
            // Convertir l'angle en radians et appliquer la rotation
            // angle = 0° signifie Nord vers le haut (Z négatif dans Three.js)
            // angle = 90° signifie Nord vers la droite (X positif)
            // Correction: ajouter 180° pour compenser l'orientation initiale
            const radians = ((angle + 180) * Math.PI) / 180;
            this.northArrowGroup.rotation.y = radians;
            
            // console.log(`🧭 Orientation du Nord mise à jour: ${angle}° (${radians.toFixed(3)} rad)`);
        } else {
            console.warn('🧭 Flèche du Nord non trouvée');
        }
    }

    showNorthArrow(show = true) {
        if (this.northArrowGroup) {
            this.northArrowGroup.visible = show;
            console.log(`🧭 Flèche du Nord ${show ? 'affichée' : 'masquée'}`);
        }
    }

    updateNorthArrowPosition(x, z) {
        if (this.northArrowGroup) {
            this.northArrowGroup.position.x = x;
            this.northArrowGroup.position.z = z;
            console.log(`🧭 Flèche du Nord repositionnée: (${x}, ${z})`);
        }
    }

    // Créer automatiquement un joint de boutisse pour les suggestions perpendiculaires, d'angle et de continuité
    createAutomaticJointForPerpendicular(placedElement, suggestionType, referenceElement) {
        // console.log('🔧 Création automatique de joint pour suggestion:', suggestionType);
        
        // Vérifier que ConstructionTools est disponible
        if (!window.ConstructionTools || !window.ConstructionTools.createSpecificVerticalJoint) {
            console.warn('⚠️ ConstructionTools non disponible pour création automatique de joint');
            return;
        }
        
        try {
            let side = 'left'; // Par défaut
            
            // LOGIQUE SPÉCIALE POUR LES SUGGESTIONS DE CONTINUITÉ (blocs)
            if (suggestionType.includes('continuity')) {
                console.log('🔧 Traitement spécial pour suggestion de continuité de bloc');
                
                // Pour les continuités boutisse, déterminer le côté selon la position
                if (suggestionType.includes('droite')) {
                    side = 'left'; // continuity-boutisse-droite → joint à gauche du bloc placé
                    console.log('🔧 Continuité droite → joint gauche sur le bloc placé');
                } else if (suggestionType.includes('gauche')) {
                    side = 'right'; // continuity-boutisse-gauche → joint à droite du bloc placé
                    console.log('🔧 Continuité gauche → joint droit sur le bloc placé');
                } else {
                    // Fallback: déterminer selon la position relative
                    if (referenceElement && placedElement) {
                        const deltaX = placedElement.position.x - referenceElement.position.x;
                        side = deltaX > 0 ? 'left' : 'right';
                        console.log(`🔧 Continuité (fallback): deltaX=${deltaX.toFixed(2)} → joint ${side}`);
                    }
                }
                
                // Pour les continuités, créer le joint sur la brique placée
                console.log(`🔧 Création de joint ${side} sur le bloc de continuité`);
                const success = window.ConstructionTools.createSpecificVerticalJoint(placedElement, side);
                
                if (success) {
                    console.log(`✅ Joint de continuité ${side} créé automatiquement`);
                } else {
                    console.warn('⚠️ Échec de la création automatique du joint de continuité');
                }
                return; // Sortir ici pour les continuités
            }
            
            // Si on a une brique de référence, calculer le côté selon la position relative
            if (referenceElement && placedElement) {
                const refPos = referenceElement.position;
                const placedPos = placedElement.position;
                const refRot = referenceElement.rotation || 0;
                const placedRot = placedElement.rotation || 0;
                
                /*
                console.log('🔧 DEBUG positions:', {
                    reference: { x: refPos.x, z: refPos.z, rotation: refRot },
                    placed: { x: placedPos.x, z: placedPos.z, rotation: placedRot },
                    suggestionType
                });
                */
                
                // Calculer la différence de position
                const deltaX = placedPos.x - refPos.x;
                const deltaZ = placedPos.z - refPos.z;
                
                // Déterminer le côté selon la position relative et le type de suggestion
                const isAngleBoutisseGauche = suggestionType.includes('angle-boutisse-gauche');
                const isAngleBoutisseDroite = suggestionType.includes('angle-boutisse-droite');
                const isAngleBoutisse = isAngleBoutisseGauche || isAngleBoutisseDroite;
                const isPerpendiculaire = suggestionType.includes('perpendiculaire');
                
                if (Math.abs(deltaX) > Math.abs(deltaZ)) {
                    // Mouvement principalement horizontal (gauche/droite)
                    if (deltaX > 0) {
                        if (isAngleBoutisseGauche) {
                            side = 'left'; // angle-boutisse-gauche → joint gauche
                        } else if (isAngleBoutisseDroite) {
                            side = 'right'; // angle-boutisse-droite → joint droit
                        } else if (isPerpendiculaire) {
                            // Pour les perpendiculaires dorsales, logique spéciale
                            if (suggestionType.includes('dorsale-droite')) {
                                side = 'right'; // perpendiculaire-dorsale-droite → joint droit (corrigé)
                            } else if (suggestionType.includes('dorsale-gauche')) {
                                side = 'right'; // perpendiculaire-dorsale-gauche → joint droit (corrigé)
                            } else {
                                side = 'left'; // autres perpendiculaires → joint gauche
                            }
                        } else {
                            side = 'right'; // logique normale pour autres cas
                        }
                    } else {
                        if (isAngleBoutisseGauche) {
                            side = 'right'; // angle-boutisse-gauche → joint droit
                        } else if (isAngleBoutisseDroite) {
                            side = 'left'; // angle-boutisse-droite → joint gauche
                        } else if (isPerpendiculaire) {
                            // Pour les perpendiculaires frontales, logique spéciale
                            if (suggestionType.includes('frontale-gauche')) {
                                side = 'left'; // perpendiculaire-frontale-gauche → joint gauche (corrigé)
                            } else {
                                side = 'right'; // autres perpendiculaires → joint droit
                            }
                        } else {
                            side = 'left'; // logique normale pour autres cas
                        }
                    }
                } else {
                    // Mouvement principalement vertical (avant/arrière)
                    // Pour les perpendiculaires, utiliser le nom de la suggestion pour déterminer le côté
                    if (isPerpendiculaire) {
                        // Logique spéciale pour perpendiculaires dorsales (logique inversée)
                        if (suggestionType.includes('dorsale')) {
                            if (suggestionType.includes('-gauche')) {
                                side = 'right'; // perpendiculaire-dorsale-gauche → joint droit (inversé)
                            } else if (suggestionType.includes('-droite')) {
                                side = 'right'; // perpendiculaire-dorsale-droite → joint droit (corrigé)
                            } else {
                                side = deltaX >= 0 ? 'right' : 'left'; // inversé pour dorsales
                            }
                        } else {
                            // Logique normale pour perpendiculaires frontales
                            if (suggestionType.includes('-gauche')) {
                                side = 'left'; // perpendiculaire-frontale-gauche → joint gauche
                            } else if (suggestionType.includes('-droite')) {
                                side = 'left'; // perpendiculaire-frontale-droite → joint gauche (corrigé)
                            } else {
                                side = deltaX >= 0 ? 'left' : 'right';
                            }
                        }
                    } else {
                        // Pour les angles, utiliser la position relative en X
                        if (deltaX > 0) {
                            if (isAngleBoutisseGauche) {
                                side = 'left'; // angle-boutisse-gauche → joint gauche
                            } else if (isAngleBoutisseDroite) {
                                side = 'right'; // angle-boutisse-droite → joint droit
                            } else {
                                side = 'right'; // logique normale pour autres cas
                            }
                        } else {
                            if (isAngleBoutisseGauche) {
                                side = 'right'; // angle-boutisse-gauche → joint droit
                            } else if (isAngleBoutisseDroite) {
                                side = 'left'; // angle-boutisse-droite → joint gauche
                            } else {
                                side = 'left'; // logique normale pour autres cas
                            }
                        }
                    }
                }
                
                // console.log(`🔧 Position relative: deltaX=${deltaX.toFixed(2)}, deltaZ=${deltaZ.toFixed(2)} → Joint ${side} (côté référence)`);
            } else {
                // Fallback vers l'ancienne logique si pas de référence
                if (suggestionType === 'perpendiculaire-frontale-gauche' || suggestionType === 'perpendiculaire-dorsale-gauche') {
                    side = 'right';
                } else if (suggestionType === 'perpendiculaire-frontale-droite' || suggestionType === 'perpendiculaire-dorsale-droite') {
                    side = 'left';
                }
                console.log(`🔧 Fallback (pas de référence): ${suggestionType} → Joint ${side}`);
            }
            
            // Déterminer sur quelle brique créer le joint
            let targetElement = placedElement; // Par défaut sur la nouvelle brique
            let targetDescription = "nouvelle brique";
            
            // Pour les suggestions d'angle (boutisse et panneresse), créer le joint sur la brique de référence
            if ((suggestionType === 'angle-boutisse-gauche' || 
                 suggestionType === 'angle-boutisse-droite' ||
                 suggestionType === 'angle-boutisse-gauche-avant' ||
                 suggestionType === 'angle-boutisse-droite-avant' ||
                 suggestionType === 'angle-boutisse-gauche-arriere' ||
                 suggestionType === 'angle-boutisse-droite-arriere' ||
                 suggestionType === 'angle-panneresse-gauche' ||
                 suggestionType === 'angle-panneresse-droite' ||
                 suggestionType === 'angle-panneresse-gauche-arriere' ||
                 suggestionType === 'angle-panneresse-droite-arriere') && referenceElement) {
                targetElement = referenceElement;
                targetDescription = "brique de référence";
                console.log('🔧 Suggestion d\'angle (boutisse/panneresse): joint créé sur la brique de référence');
            }
            
            // Créer automatiquement le joint du côté déterminé
            const success = window.ConstructionTools.createSpecificVerticalJoint(targetElement, side);
            
            if (success) {
                // console.log(`✅ Joint de boutisse ${side} créé automatiquement (côté ${targetDescription})`);
            } else {
                console.warn('⚠️ Échec de la création automatique du joint de boutisse');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la création automatique du joint:', error);
        }
    }

    /**
     * Vérifie s'il existe déjà un joint horizontal pour l'élément donné
     * @param {Object} referenceElement - Élément pour lequel vérifier l'existence d'un joint horizontal
     * @returns {boolean} - true s'il existe déjà un joint horizontal
     */
    hasExistingHorizontalJoint(referenceElement) {
        if (!referenceElement || !referenceElement.id) {
            return false;
        }

        let existingHorizontalJoints = [];

        // Parcourir la scène principale pour trouver les joints horizontaux existants
        if (this.scene) {
            this.scene.traverse((child) => {
                if (child.userData && child.userData.isJoint && 
                    (child.userData.isHorizontalJoint || child.userData.elementType === 'horizontal-joint')) {
                    existingHorizontalJoints.push(child);
                }
            });
        }

        // Parcourir aussi les groupes d'assise
        if (this.assiseGroups) {
            for (const [type, assisesByIndex] of this.assiseGroups) {
                for (const [index, assiseGroup] of assisesByIndex) {
                    assiseGroup.traverse((child) => {
                        if (child.userData && child.userData.isJoint && 
                            (child.userData.isHorizontalJoint || child.userData.elementType === 'horizontal-joint')) {
                            existingHorizontalJoints.push(child);
                        }
                    });
                }
            }
        }

        // Vérifier par ID d'élément parent - plus fiable que la position
        for (const existingJoint of existingHorizontalJoints) {
            if (existingJoint.userData.parentElementId === referenceElement.id) {
                /*
                console.log('🔍 Joint horizontal existant détecté par ID parent:', {
                    referenceElementId: referenceElement.id,
                    existingJointId: existingJoint.userData.id || existingJoint.name,
                    parentElementId: existingJoint.userData.parentElementId
                });
                */
                return true;
            }
        }

        // Fallback: vérifier aussi par position si l'ID parent n'est pas défini
        const refPos = referenceElement.position;
        const tolerance = 0.1;

        for (const existingJoint of existingHorizontalJoints) {
            const jointPos = existingJoint.position;
            
            // Calculer la distance horizontale (X, Z) et la différence de hauteur (Y)
            const horizontalDistance = Math.sqrt(
                Math.pow(refPos.x - jointPos.x, 2) + 
                Math.pow(refPos.z - jointPos.z, 2)
            );
            const heightDifference = Math.abs(refPos.y - jointPos.y);

            // Si le joint est à proximité horizontale et à une hauteur similaire
            if (horizontalDistance < tolerance && heightDifference < tolerance) {
                /*
                console.log('🔍 Joint horizontal existant détecté par position:', {
                    referenceElementId: referenceElement.id,
                    existingJointPosition: jointPos,
                    elementPosition: refPos,
                    horizontalDistance: horizontalDistance,
                    heightDifference: heightDifference
                });
                */
                return true;
            }
        }

        return false;
    }

    /**
     * Vérifie s'il existe une brique adjacente du côté spécifié
     * @param {Object} referenceElement - Élément de référence
     * @param {string} side - Côté à vérifier ('left' ou 'right')
     * @returns {Object|null} - La brique adjacente ou null si aucune
     */
    findAdjacentBrick(referenceElement, side) {
        if (!referenceElement) return null;

        const refPos = referenceElement.position;
        const refDim = referenceElement.dimensions || { length: 19, width: 9, height: 6.5 };
        const refRotation = referenceElement.rotation || 0;
        
        // CORRECTION: Calculer la position attendue en tenant compte de la rotation
        const cos = Math.cos(refRotation);
        const sin = Math.sin(refRotation);
        
        let expectedX = refPos.x;
        let expectedZ = refPos.z;
        
        if (side === 'left') {
            // Décalage vers la gauche dans le repère local de la brique
            expectedX = refPos.x - cos * refDim.length;
            expectedZ = refPos.z - sin * refDim.length;
        } else if (side === 'right') {
            // Décalage vers la droite dans le repère local de la brique
            expectedX = refPos.x + cos * refDim.length;
            expectedZ = refPos.z + sin * refDim.length;
        }

        const tolerance = 5; // Tolérance augmentée à 5cm pour tenir compte des joints et rotations

        // Chercher parmi tous les éléments de construction
        for (const [id, element] of this.elements) {
            if (element.id === referenceElement.id) continue; // Ignorer l'élément de référence
            if (element.isHorizontalJoint || element.isVerticalJoint) continue; // Ignorer les joints
            
            const elementPos = element.position;
            
            // AMÉLIORATION: Détecter aussi les briques dans un rayon autour de la position attendue
            const deltaX = Math.abs(expectedX - elementPos.x);
            const deltaZ = Math.abs(expectedZ - elementPos.z);
            const heightDifference = Math.abs(refPos.y - elementPos.y);

            // Vérifier si les briques sont alignées et à proximité
            if (deltaX < tolerance && deltaZ < tolerance && heightDifference < tolerance) {
                /*
                console.log('🔍 Brique adjacente trouvée (avec rotation):', {
                    referenceId: referenceElement.id,
                    adjacentId: element.id,
                    side: side,
                    refRotation: (refRotation * 180 / Math.PI).toFixed(1) + '°',
                    expectedPosition: { x: expectedX.toFixed(2), z: expectedZ.toFixed(2) },
                    actualPosition: { x: elementPos.x.toFixed(2), z: elementPos.z.toFixed(2) },
                    deltaX: deltaX.toFixed(2),
                    deltaZ: deltaZ.toFixed(2),
                    heightDiff: heightDifference.toFixed(2)
                });
                */
                return element;
            }
        }

        return null;
    }

    /**
     * Vérifie s'il existe déjà un joint vertical pour l'élément donné du côté spécifié
     * @param {Object} referenceElement - Élément pour lequel vérifier l'existence d'un joint vertical
     * @param {string} side - Côté du joint ('left' ou 'right')
     * @returns {boolean} - true s'il existe déjà un joint vertical de ce côté
     */
    hasExistingVerticalJoint(referenceElement, side) {
        if (!referenceElement || !referenceElement.id) {
            return false;
        }

        let existingVerticalJoints = [];

        // Parcourir la scène principale pour trouver les joints verticaux existants
        if (this.scene) {
            this.scene.traverse((child) => {
                if (child.userData && child.userData.isJoint && 
                    (child.userData.isVerticalJoint || child.userData.elementType === 'vertical-joint')) {
                    existingVerticalJoints.push(child);
                }
            });
        }

        // Parcourir aussi les groupes d'assise
        if (this.assiseGroups) {
            for (const [type, assisesByIndex] of this.assiseGroups) {
                for (const [index, assiseGroup] of assisesByIndex) {
                    assiseGroup.traverse((child) => {
                        if (child.userData && child.userData.isJoint && 
                            (child.userData.isVerticalJoint || child.userData.elementType === 'vertical-joint')) {
                            existingVerticalJoints.push(child);
                        }
                    });
                }
            }
        }

        // Calculer la position attendue du joint selon le côté
        const refPos = referenceElement.position;
        const refDim = referenceElement.dimensions || { length: 19, width: 9, height: 6.5 };
        
        let expectedJointX = refPos.x;
        if (side === 'left') {
            expectedJointX = refPos.x - refDim.length / 2;
        } else if (side === 'right') {
            expectedJointX = refPos.x + refDim.length / 2;
        }

        const tolerance = 0.5; // Tolérance plus large pour les joints verticaux

        // Vérifier s'il y a déjà un joint vertical à cette position
        for (const existingJoint of existingVerticalJoints) {
            const jointPos = existingJoint.position;
            
            // Calculer la distance
            const horizontalDistance = Math.sqrt(
                Math.pow(expectedJointX - jointPos.x, 2) + 
                Math.pow(refPos.z - jointPos.z, 2)
            );
            const heightDifference = Math.abs(refPos.y - jointPos.y);

            // Si le joint est à proximité de la position attendue
            if (horizontalDistance < tolerance && heightDifference < tolerance) {
                console.log('🔍 Joint vertical existant détecté:', {
                    referenceElementId: referenceElement.id,
                    side: side,
                    expectedJointPosition: { x: expectedJointX, y: refPos.y, z: refPos.z },
                    existingJointPosition: jointPos,
                    horizontalDistance: horizontalDistance,
                    heightDifference: heightDifference
                });
                return true;
            }
        }

        return false;
    }

    // NOUVELLE FONCTIONNALITÉ : Créer automatiquement le joint vertical gauche pour position C
    createAutomaticLeftVerticalJoint(referenceElement) {
        // console.log('🔧 Création automatique du joint vertical gauche pour position C');
        
        // Vérifier que ConstructionTools est disponible
        if (!window.ConstructionTools || !window.ConstructionTools.createSpecificVerticalJoint) {
            console.warn('⚠️ ConstructionTools non disponible pour création automatique de joint gauche');
            return;
        }
        
        // Vérification supplémentaire de l'élément
        if (!referenceElement) {
            console.warn('⚠️ Aucun élément de référence fourni pour le joint vertical gauche');
            return;
        }

        // NOUVELLE LOGIQUE: Vérifier s'il y a une brique adjacente à gauche
        const adjacentBrick = this.findAdjacentBrick(referenceElement, 'left');
        if (!adjacentBrick) {
            console.log('🔍 Aucune brique adjacente à gauche trouvée, joint vertical non nécessaire pour:', referenceElement.id);
            return;
        }

        // DÉDUPLICATION: Vérifier s'il existe déjà un joint vertical gauche pour cet élément
        if (this.hasExistingVerticalJoint(referenceElement, 'left')) {
            console.log('🔍 Joint vertical gauche déjà existant pour cet élément, création ignorée:', referenceElement.id);
            return;
        }
        
        /*
        console.log('🔧 DEBUG: Création joint entre briques:', {
            reference: referenceElement.id,
            adjacent: adjacentBrick.id,
            side: 'left'
        });
        */
        
        try {
            // Créer spécifiquement le joint vertical gauche
            window.ConstructionTools.createSpecificVerticalJoint(referenceElement, 'left');
            
            // console.log('✅ Joint vertical gauche créé automatiquement entre briques adjacentes');
        } catch (error) {
            console.error('❌ Erreur lors de la création automatique du joint gauche:', error);
        }
    }

    // ANCIENNE FONCTION : Créer automatiquement le joint vertical droit (gardée pour compatibilité)
    createAutomaticRightVerticalJoint(referenceElement) {
        // console.log('🔧 Création automatique du joint vertical droit');
        
        // Vérifier que ConstructionTools est disponible
        if (!window.ConstructionTools || !window.ConstructionTools.createSpecificVerticalJoint) {
            console.warn('⚠️ ConstructionTools non disponible pour création automatique de joint droit');
            return;
        }
        
        // Vérification supplémentaire de l'élément
        if (!referenceElement) {
            console.warn('⚠️ Aucun élément de référence fourni pour le joint vertical droit');
            return;
        }

        // NOUVELLE LOGIQUE: Vérifier s'il y a une brique adjacente à droite
        const adjacentBrick = this.findAdjacentBrick(referenceElement, 'right');
        if (!adjacentBrick) {
            console.log('🔍 Aucune brique adjacente à droite trouvée pour:', referenceElement.id);
            console.log('🔍 DEBUG: Position référence:', {
                x: referenceElement.position.x,
                z: referenceElement.position.z,
                rotation: (referenceElement.rotation * 180 / Math.PI).toFixed(1) + '°'
            });
            
            // DEBUG: Lister toutes les briques proches pour diagnostic
            const nearbyBricks = [];
            for (const [id, element] of this.elements) {
                if (element.id === referenceElement.id) continue;
                if (element.isHorizontalJoint || element.isVerticalJoint) continue;
                
                const distance = Math.sqrt(
                    Math.pow(element.position.x - referenceElement.position.x, 2) + 
                    Math.pow(element.position.z - referenceElement.position.z, 2)
                );
                
                if (distance < 30) { // Dans un rayon de 30cm
                    nearbyBricks.push({
                        id: element.id,
                        position: { x: element.position.x, z: element.position.z },
                        distance: distance.toFixed(2) + 'cm',
                        rotation: ((element.rotation || 0) * 180 / Math.PI).toFixed(1) + '°'
                    });
                }
            }
            console.log('🔍 DEBUG: Briques proches (rayon 30cm):', nearbyBricks);
            return;
        }

        // DÉDUPLICATION: Vérifier s'il existe déjà un joint vertical droit pour cet élément
        if (this.hasExistingVerticalJoint(referenceElement, 'right')) {
            console.log('🔍 Joint vertical droit déjà existant pour cet élément, création ignorée:', referenceElement.id);
            return;
        }
        
        /*
        console.log('🔧 DEBUG: Création joint entre briques:', {
            reference: referenceElement.id,
            adjacent: adjacentBrick.id,
            side: 'right'
        });
        */
        
        try {
            // Créer spécifiquement le joint vertical droit
            window.ConstructionTools.createSpecificVerticalJoint(referenceElement, 'right');
            
            // console.log('✅ Joint vertical droit créé automatiquement entre briques adjacentes');
        } catch (error) {
            console.error('❌ Erreur lors de la création automatique du joint droit:', error);
        }
    }

    // NOUVELLE FONCTIONNALITÉ : Créer automatiquement un joint horizontal pour chaque brique posée
    createAutomaticHorizontalJoint(referenceElement) {
        // console.log('🔧 Création automatique du joint horizontal');
        
        // Vérifier que ConstructionTools est disponible
        if (!window.ConstructionTools) {
            console.warn('⚠️ ConstructionTools non disponible pour création automatique de joint horizontal');
            return;
        }
        
        // Vérification supplémentaire de l'élément
        if (!referenceElement) {
            console.warn('⚠️ Aucun élément de référence fourni pour le joint horizontal');
            return;
        }

        // NOUVEAU: Vérifier si c'est une brique sur chant - pas de joint horizontal pour ce type
        if (this.isBrickOnChant(referenceElement)) {
            console.log('🧱 Brique sur chant détectée - pas de joint horizontal créé pour:', referenceElement.id);
            return;
        }

        // DÉDUPLICATION: Vérifier s'il existe déjà un joint horizontal pour cet élément
        if (this.hasExistingHorizontalJoint(referenceElement)) {
            // console.log('🔍 Joint horizontal déjà existant pour cet élément, création ignorée:', referenceElement.id);
            return;
        }
        
        // console.log('🔧 DEBUG: Élément de référence pour joint horizontal:', referenceElement);
        
        try {
            // CORRECTION ÉPAISSEUR DYNAMIQUE: Utiliser l'épaisseur configurée par l'utilisateur dans AssiseManager
            let jointHorizontal = 1.2; // Valeur par défaut
            
            // D'abord, essayer de récupérer l'épaisseur depuis AssiseManager pour le type d'élément approprié
            if (window.AssiseManager) {
                // CORRECTION MAJEURE: Priorité au blockType, puis type en fallback
                const elementType = referenceElement.blockType || referenceElement.userData?.blockType || referenceElement.type;
                
                // DEBUG DÉTAILLÉ pour comprendre le problème de récupération du blockType
                // console.log('🔍 [JOINT DEBUG] Analyse de l\'élément pour joint horizontal:', {
                //     elementId: referenceElement.id,
                //     'referenceElement.blockType': referenceElement.blockType,
                //     'referenceElement.userData?.blockType': referenceElement.userData?.blockType,
                //     'referenceElement.type': referenceElement.type,
                //     'elementType final': elementType,
                //     'userData complet': referenceElement.userData
                // });
                
                let assiseType = elementType;
                
                // Pour les briques coupées, utiliser le type de base
                if (elementType && elementType.includes('_')) {
                    assiseType = elementType.split('_')[0];
                }
                
                // DEBUG: Afficher les informations de déduction du type
                // console.log(`🔍 [JOINT DEBUG] referenceElement:`, referenceElement);
                // console.log(`🔍 [JOINT DEBUG] referenceElement.blockType: "${referenceElement.blockType}"`);
                // console.log(`🔍 [JOINT DEBUG] referenceElement.userData?.blockType: "${referenceElement.userData?.blockType}"`);
                // console.log(`🔍 [JOINT DEBUG] referenceElement.type: "${referenceElement.type}"`);
                // console.log(`🔍 [JOINT DEBUG] elementType: "${elementType}", assiseType final: "${assiseType}"`);
                // console.log(`🔍 [JOINT DEBUG] jointHeightByType contenu:`, window.AssiseManager.jointHeightByType);
                // console.log(`🔍 [JOINT DEBUG] currentType: "${window.AssiseManager.currentType}"`);
                
                // CORRECTION CRITIQUE: Récupérer la valeur RÉELLE modifiée par l'interface utilisateur
                // au lieu de la valeur par défaut du type
                
                // MÉTHODE 1: Vérifier directement dans jointHeightByType (valeur configurée interface)
                jointHorizontal = null; // CORRECTION: pas de 'let' - utiliser la variable déjà déclarée
                if (window.AssiseManager.jointHeightByType && window.AssiseManager.jointHeightByType.has(assiseType)) {
                    jointHorizontal = window.AssiseManager.jointHeightByType.get(assiseType);
                    // console.log(`✅ [JOINT CREATION] Hauteur depuis jointHeightByType pour ${assiseType}: ${jointHorizontal} cm`);
                }
                
                // MÉTHODE 2: Si c'est le type actuel, utiliser la propriété jointHeight courante
                if (!jointHorizontal && window.AssiseManager.currentType === assiseType && window.AssiseManager.jointHeight) {
                    jointHorizontal = window.AssiseManager.jointHeight;
                    // console.log(`✅ [JOINT CREATION] Hauteur depuis type actuel (${assiseType}): ${jointHorizontal} cm`);
                }
                
                // FALLBACK: Utiliser getJointHeightForType seulement si rien d'autre n'est trouvé
                if (!jointHorizontal) {
                    jointHorizontal = window.AssiseManager.getJointHeightForType(assiseType);
                    console.warn(`⚠️ [JOINT CREATION] Hauteur par défaut depuis getJointHeightForType(${assiseType}): ${jointHorizontal} cm`);
                }
            }
            // Fallback vers ConstructionTools si AssiseManager n'est pas disponible
            else if (window.ConstructionTools && window.ConstructionTools.getJointSettingsForElement) {
                const jointSettings = window.ConstructionTools.getJointSettingsForElement(referenceElement);
                if (jointSettings && jointSettings.createJoints) {
                    jointHorizontal = jointSettings.horizontalThickness / 10; // Conversion mm vers cm
                    console.log(`🔧 Joint horizontal automatique: ${jointSettings.horizontalThickness}mm (${jointHorizontal}cm) pour ${referenceElement.type} selon logique ConstructionTools (fallback)`);
                }
            }
            
            // Récupérer les dimensions de l'élément de référence
            const dimensions = referenceElement.dimensions || {
                width: 19,  // largeur par défaut d'une brique
                length: 9,  // longueur par défaut d'une brique
                height: 6.5 // hauteur par défaut d'une brique
            };
            
            // CORRECTION: Calculer la hauteur adaptative du joint horizontal
            // Le joint doit partir du dessous de la brique et aller jusqu'au plan 0 de l'assise
            const brickBottomY = referenceElement.position.y - (dimensions.height / 2);
            
            // Déterminer la hauteur de l'assise précédente (ou 0 pour la première assise)
            let assiseBottomY = 0; // Par défaut, plan du sol
            let isCellularConcrete = false; // Détecter le béton cellulaire
            
            // DETECTION BÉTON CELLULAIRE: Vérifier si c'est un élément béton cellulaire avec joints fins
            if (window.ConstructionTools && window.ConstructionTools.getJointSettingsForElement) {
                const jointSettings = window.ConstructionTools.getJointSettingsForElement(referenceElement);
                if (jointSettings && jointSettings.horizontalThickness <= 2) {
                    isCellularConcrete = true;
                    console.log(`🏗️ BÉTON CELLULAIRE détecté: joints fins ${jointSettings.horizontalThickness}mm`);
                }
            }
            
            if (window.AssiseManager) {
                // Essayer de déterminer le type d'assise et l'index pour cet élément
                const elementType = referenceElement.blockType || referenceElement.type;
                let assiseType = elementType;
                
                // Pour les briques coupées, utiliser le type de base
                if (elementType && elementType.includes('_')) {
                    assiseType = elementType.split('_')[0];
                }
            }
            
            // CORRECTION POSITION: Le joint doit être positionné AU DÉBUT DE L'ASSISE (sur le joint de mortier)
            // Hauteur standard du joint horizontal (1.2cm par défaut)
            const standardJointHeight = jointHorizontal; // Utilise la valeur calculée plus haut
            
            // DEBUG CRITIQUE: Vérifier la valeur avant création du joint
            // console.log(`🔧 [JOINT DEBUG FINAL] jointHorizontal=${jointHorizontal}cm, standardJointHeight=${standardJointHeight}cm`);
            
            // CORRECTION IMPORTANTE: Utiliser jointHorizontal au lieu de standardJointHeight
            const finalJointHeight = jointHorizontal; // Utiliser la valeur configurée/calculée

            // Trouver l'assise de cet élément
            const assiseData = window.AssiseManager.findElementAssiseComplete(referenceElement.id);
            if (assiseData) {
                const { assiseType: foundType, assiseIndex } = assiseData;
                
                // CORRECTION LOGIQUE ASSISES: Le joint horizontal doit être AU-DESSUS de la brique précédente
                // Joint positionné à la fin de l'assise précédente (après la brique précédente)
                if (assiseIndex > 0) {
                    // Pour les assises > 0, le joint est au-dessus de l'assise précédente
                    // CORRECTION: récupérer la hauteur de l'assise précédente + hauteur de l'élément + joint
                    const previousAssiseHeight = window.AssiseManager.getAssiseHeightForType(foundType, assiseIndex - 1);
                    const elementHeight = window.AssiseManager.getMaxElementHeightInAssiseForType(foundType, assiseIndex - 1);
                    assiseBottomY = previousAssiseHeight + elementHeight;
                    // console.log(`🔧 CORRECTION LOGIQUE: Joint AU-DESSUS de l'assise ${assiseIndex - 1} à ${assiseBottomY}cm (assise: ${previousAssiseHeight}cm + élément: ${elementHeight}cm)`);
                } else {
                    // Première assise : joint au niveau du sol
                    // CORRECTION: Pour la première assise, le joint doit démarrer à Y=0
                    assiseBottomY = jointHorizontal / 2; // Position pour que le centre soit à jointHorizontal/2, donc joint commence à Y=0
                    // console.log(`🔧 Joint horizontal: Première assise, joint au sol démarrant à Y=0, centre à ${assiseBottomY}cm`);
                }
            }
            
            // Position du joint horizontal: pour toutes les assises, le joint commence à assiseBottomY
            let jointCenterY;
            if (assiseData && assiseData.assiseIndex === 0) {
                // Pour la première assise, assiseBottomY contient déjà la position du centre
                jointCenterY = assiseBottomY;
                // console.log(`🔧 CORRECTION PREMIÈRE ASSISE: Joint centré à Y=${jointCenterY}cm, démarre à Y=0`);
            } else {
                // Pour les autres assises, le joint commence à assiseBottomY et s'étend vers le haut
                jointCenterY = assiseBottomY + (finalJointHeight / 2);
                // console.log(`🔧 CORRECTION AUTRES ASSISES: Joint centré à Y=${jointCenterY}cm, commence à ${assiseBottomY}cm, finit à ${assiseBottomY + finalJointHeight}cm`);
            }
            const jointPosition = {
                x: referenceElement.position.x,
                y: jointCenterY,
                z: referenceElement.position.z
            };
            
            // console.log(`🔧 CORRECTION POSITION: Joint AU-DESSUS de la brique précédente. Centre=${jointCenterY}cm, épaisseur=${finalJointHeight}cm`);
            
            // Utiliser le même matériau que les joints verticaux
            const jointMaterial = window.ConstructionTools ? window.ConstructionTools.getJointMaterial() : 'joint';
            
            // Créer l'élément joint horizontal directement
            // console.log(`🔧 [JOINT DEBUG CRÉATION] Création WallElement avec height=${finalJointHeight}cm - CORRECTION: utilise finalJointHeight configuré`);
            const jointElement = new WallElement({
                type: 'joint',
                subtype: 'horizontal',
                material: jointMaterial,  // Utiliser le matériau des joints verticaux
                x: jointPosition.x,
                y: jointPosition.y,
                z: jointPosition.z,
                length: dimensions.length,   // Longueur de l'élément de référence
                width: dimensions.width,     // Largeur de l'élément de référence
                height: finalJointHeight,    // CORRECTION: Utiliser la hauteur configurée au lieu de standardJointHeight
                rotation: referenceElement.rotation || 0
            });
            // console.log(`🔧 [JOINT DEBUG APRÈS CRÉATION] Joint créé avec dimensions: ${jointElement.dimensions.length}x${jointElement.dimensions.width}x${jointElement.dimensions.height}`);
            
            // Marquer comme joint horizontal
            jointElement.isHorizontalJoint = true;
            jointElement.isVerticalJoint = false;
            
            // Configuration userData pour compatibilité avec les joints verticaux
            jointElement.userData = jointElement.userData || {};
            jointElement.userData.parentElementId = referenceElement.id;
            jointElement.userData.parentElementType = referenceElement.type;
            jointElement.userData.isJoint = true;
            jointElement.userData.elementType = 'joint';
            jointElement.userData.isHorizontalJoint = true;
            jointElement.userData.isVerticalJoint = false;
            
            // Configuration mesh.userData pour compatibilité
            jointElement.mesh.userData.isJoint = true;
            jointElement.mesh.userData.parentElementId = referenceElement.id;
            jointElement.mesh.userData.parentElementType = referenceElement.type;
            jointElement.mesh.userData.elementType = 'joint';
            jointElement.mesh.userData.isHorizontalJoint = true;
            jointElement.mesh.userData.isVerticalJoint = false;
            
            // Appliquer la même couleur que les joints verticaux
            if (window.ConstructionTools && window.ConstructionTools.applyJointColorToElement) {
                window.ConstructionTools.applyJointColorToElement(jointElement, referenceElement.type);
            }
            
            // Ajouter à la scène (ajouter directement sans passer par addElement pour éviter la récursion)
            this.elements.set(jointElement.id, jointElement);
            jointElement.mesh.castShadow = true;
            jointElement.mesh.receiveShadow = true;
            this.scene.add(jointElement.mesh);
            
            // Intégration avec le système de calques
            if (window.LayerManager) {
                window.LayerManager.onElementAdded(jointElement.mesh, 'joint-horizontal');
            }
            
            // Ajouter à l'assise active
            if (window.AssiseManager) {
                window.AssiseManager.addElementToAssise(jointElement.id);
            }
            
            // console.log('✅ Joint horizontal créé automatiquement');
        } catch (error) {
            console.error('❌ Erreur lors de la création automatique du joint horizontal:', error);
        }
    }

    // Méthode utilitaire pour détecter si une brique est posée sur chant
    isBrickOnChant(element) {
        if (!element) return false;
        
        // Vérifier le type d'élément
        const elementType = element.type || element.userData?.type;
        const brickType = element.brickType || element.userData?.brickType;
        
        // Détecter directement par le type M50_CHANT
        if (elementType === 'M50_CHANT' || brickType === 'M50_CHANT' || 
            elementType?.includes('M50_CHANT') || brickType?.includes('M50_CHANT')) {
            return true;
        }
        
        // Détecter par les dimensions caractéristiques d'une brique sur chant
        // M50 sur chant: largeur=5cm, hauteur=19cm (au lieu de largeur=9cm, hauteur=5cm)
        const dimensions = element.dimensions;
        if (dimensions && dimensions.width === 5 && dimensions.height === 19 && dimensions.length === 5) {
            return true;
        }
        
        // Vérifier aussi dans le BrickSelector actuel si disponible
        if (window.BrickSelector && window.BrickSelector.currentBrick) {
            const currentBrick = window.BrickSelector.currentBrick;
            if (currentBrick.includes('M50_CHANT') || currentBrick === 'M50_CHANT') {
                return true;
            }
        }
        
        return false;
    }

    // Méthode utilitaire pour récupérer le dernier élément placé
    getLastPlacedElement() {
        const elementsArray = Array.from(this.elements.values());
        // Filtrer les joints pour ne récupérer que les briques/blocs
        const nonJointElements = elementsArray.filter(el => !el.isVerticalJoint && !el.isHorizontalJoint);
        return nonJointElements[nonJointElements.length - 1] || null;
    }

    // Obtenir les dimensions d'un élément pour l'affichage
    getElementDimensions(element) {
        const type = element.elementType || element.userData?.type || element.type;
        
        // Dictionnaire des dimensions par type d'élément
        const dimensions = {
            // Briques
            'M50': '19×5×9 cm',
            'M57': '19×5.7×9 cm',
            'M60': '19×6×9 cm',
            'M65': '19×6.5×9 cm',
            'M90': '19×9×9 cm',
            'M50_CHANT': '5×19×9 cm',
            
            // Blocs
            'B9': '39×9×19 cm',
            'B14': '39×14×19 cm',
            'B19': '39×19×19 cm',
            'B29': '39×29×19 cm',
            
            // Béton cellulaire
            'BC_60x5': '60×5×25 cm',
            'BC_60x7': '60×7×25 cm',
            'BC_60x10': '60×10×25 cm',
            'BC_60x15': '60×15×25 cm',
            'BC_60x17': '60×17.5×25 cm',
            'BC_60x20': '60×20×25 cm',
            'BC_60x24': '60×24×25 cm',
            'BC_60x30': '60×30×25 cm',
            'BC_60x36': '60×36×25 cm',
            
            // Blocs Argex
            'ARGEX_39x9': '39×9×19 cm',
            'ARGEX_39x14': '39×14×19 cm',
            'ARGEX_39x19': '39×19×19 cm',
            
            // Béton cellulaire assise
            'BCA_60x9x20': '60×9×20 cm',
            'BCA_60x14x20': '60×14×20 cm',
            'BCA_60x19x20': '60×19×20 cm',
            
            // Isolants
            'PUR5': '120×5×60 cm',
            'PUR6': '120×6×60 cm',
            'PUR7': '120×7×60 cm',
            'LAINEROCHE5': '120×5×60 cm',
            'LAINEROCHE6': '120×6×60 cm',
            
            // Linteaux
            'L120': '120×14×19 cm',
            'L140': '140×14×19 cm',
            'L160': '160×14×19 cm',
            'L180': '180×14×19 cm'
        };
        
        return dimensions[type] || 'Dimensions inconnues';
    }
    
    /**
     * Méthode universelle pour déterminer de quel côté créer le joint vertical
     * selon la position et le type de suggestion
     */
    shouldCreateLeftJoint(position, suggestionType) {
        // console.log('🔧 ANALYSE: Détermination du côté pour position =', position, 'type =', suggestionType);
        
        // Positions qui créent des joints à gauche
        const leftPositions = [
            'A', 'EEA', 'TEA', 'C', 'D', 'M', 'H', 'J', 'T', 'V', 'O', 'P'
        ];
        
        // Positions qui créent des joints à droite
        const rightPositions = [
            'B', 'EEB', 'TEB', 'E', 'F', 'N', 'G', 'I', 'S', 'U', 'Q', 'R'
        ];
        
        // Si la position est explicitement dans une liste, utiliser cette logique
        if (leftPositions.includes(position)) {
            // console.log('🔧 ANALYSE: Position', position, '→ GAUCHE (liste explicite)');
            return true;
        }
        
        if (rightPositions.includes(position)) {
            console.log('🔧 ANALYSE: Position', position, '→ DROITE (liste explicite)');
            return false;
        }
        
        // Logique heuristique pour les nouvelles positions
        // Basée sur les patterns observés dans les noms de positions
        
        // Positions se terminant par 'A' tendent vers la gauche
        if (position.endsWith('A')) {
            console.log('🔧 ANALYSE: Position', position, '→ GAUCHE (se termine par A)');
            return true;
        }
        
        // Positions se terminant par 'B' tendent vers la droite
        if (position.endsWith('B')) {
            console.log('🔧 ANALYSE: Position', position, '→ DROITE (se termine par B)');
            return false;
        }
        
        // Positions contenant 'L' (Left) → gauche
        if (position.includes('L')) {
            console.log('🔧 ANALYSE: Position', position, '→ GAUCHE (contient L)');
            return true;
        }
        
        // Positions contenant 'R' (Right) → droite
        if (position.includes('R')) {
            console.log('🔧 ANALYSE: Position', position, '→ DROITE (contient R)');
            return false;
        }
        
        // Par défaut, alterner selon le premier caractère pour éviter la monotonie
        const firstChar = position.charAt(0);
        const isOddLetter = (firstChar.charCodeAt(0) % 2 === 1);
        
        console.log('🔧 ANALYSE: Position', position, '→', (isOddLetter ? 'GAUCHE' : 'DROITE'), '(heuristique par défaut)');
        return isOddLetter;
    }

    /**
     * Détermine l'index d'assise d'un élément basé sur sa position Y
     * @param {WallElement} element - L'élément dont on veut déterminer l'assise
     * @returns {number|null} - L'index de l'assise ou null si indéterminable
     */
    getElementAssiseIndex(element) {
        if (!element) return null;

        const elementY = element.position.y;

        // APPROCHE SIMPLIFIÉE: Utiliser des seuils fixes basés sur les observations
        // D'après les logs :
        // - Assise 0 : éléments autour de 4.45cm
        // - Assise 1 : éléments autour de 12.15cm
        // - Assise 2 : éléments autour de ~20cm
        
        console.log(`🔍 Détection d'assise simple pour Y=${elementY.toFixed(2)}cm`);
        
        let detectedAssise;
        if (elementY < 8.0) {
            // Moins de 8cm = Assise 0
            detectedAssise = 0;
        } else if (elementY < 16.0) {
            // Entre 8cm et 16cm = Assise 1
            detectedAssise = 1;
        } else if (elementY < 24.0) {
            // Entre 16cm et 24cm = Assise 2
            detectedAssise = 2;
        } else {
            // Plus de 24cm = Assise 3+
            detectedAssise = Math.floor((elementY - 4) / 8); // Estimation basée sur 8cm par assise
        }
        
        console.log(`🎯 Élément ${element.id} détecté sur assise ${detectedAssise} (méthode simplifiée - Y=${elementY.toFixed(2)}cm)`);
        return detectedAssise;
    }

    /**
     * Détermine le type d'un élément pour le système d'assises
     * @param {WallElement} element - L'élément à analyser
     * @returns {string} - Le type pour AssiseManager
     */
    getElementTypeForAssise(element) {
        if (!element) return 'brick';

        // Vérifier les propriétés usuelles pour déterminer le type
        const userData = element.userData || {};
        const type = element.type || userData.type;
        const brickType = element.brickType || userData.brickType;

        // Mappages de types
        if (brickType && brickType.startsWith('M65')) return 'brick';
        if (brickType && brickType.startsWith('M50')) return 'brick';
        if (type === 'insulation' || type === 'isolant') return 'insulation';
        if (type === 'block' || type === 'bloc') return 'block';

        // Par défaut, considérer comme brique
        return 'brick';
    }
}

// Instance globale
window.SceneManager = new SceneManager();

