/**
 * Outil de texte avec ligne de rappel pour WallSim3D
 * Permet de créer des annotations textuelles avec des lignes de rappel
 */
class TextLeaderTool {
    constructor() {
        this.isActive = false;
        this.textAnnotations = [];
        this.textLeaderGroup = null;
        this.isDrawing = false;
        this.drawingStep = 0; // 0: inactif, 1: point cible, 2: point texte
        this.targetPoint = null;
        this.textPoint = null;
        this.temporaryLine = null;
        this.temporaryTargetMarker = null;
        this.temporaryTextMarker = null;
        this.annotationId = 0;
        this.currentEditingAnnotation = null;
        this.editDialog = null;
        
        // Système de snap (accrochage)
        this.snapEnabled = true;
        this.snapTolerance = 2; // Distance en pixels
        this.snapPoints = [];
        this.snapIndicator = null;
        this.currentSnapPoint = null;
        
        // État des briques fantômes - Simplifié comme measurement-tool
        this.previousPlacementMode = undefined;
        this.previousShowGhost = undefined;
        
        this.init();
    }

    init() {
        // console.log('📝 Initialisation de l\'outil texte avec ligne de rappel...');
        this.waitForSceneManager();
    }

    waitForSceneManager() {
        if (window.SceneManager && window.SceneManager.scene) {
            this.createTextLeaderGroup();
            this.createEditDialog();
            this.setupEventListeners();
            this.setupKeyboardShortcuts();
            this.collectSnapPoints();
            // console.log('✅ TextLeaderTool initialisé avec SceneManager');
        } else {
            setTimeout(() => this.waitForSceneManager(), 100);
        }
    }

    createTextLeaderGroup() {
        if (!window.SceneManager || !window.SceneManager.scene) {
            console.warn('❌ SceneManager non disponible pour l\'outil texte');
            setTimeout(() => this.createTextLeaderGroup(), 100);
            return;
        }

        this.textLeaderGroup = new THREE.Group();
        this.textLeaderGroup.name = 'TextLeaderGroup';
        window.SceneManager.scene.add(this.textLeaderGroup);
        // console.log('✅ Groupe de textes avec lignes de rappel créé');
    }

    createEditDialog() {
        this.editDialog = document.createElement('div');
        this.editDialog.className = 'text-leader-edit-dialog';
        this.editDialog.innerHTML = `
            <div class="text-leader-dialog-content">
                <div class="text-leader-dialog-header">
                    <h3>📝 Texte avec ligne de rappel</h3>
                    <button class="text-leader-close-btn">&times;</button>
                </div>
                <div class="text-leader-dialog-body">
                    <div class="text-leader-form-group">
                        <label for="textLeaderContent">Texte:</label>
                        <textarea id="textLeaderContent" rows="3" placeholder="Entrez votre texte..."></textarea>
                    </div>
                    <div class="text-leader-form-group">
                        <label for="textLeaderStyle">Style:</label>
                        <select id="textLeaderStyle">
                            <option value="normal">Normal</option>
                            <option value="bold">Gras</option>
                            <option value="italic">Italique</option>
                            <option value="title">Titre</option>
                        </select>
                    </div>
                    <div class="text-leader-form-group">
                        <label for="textLeaderSize">Taille:</label>
                        <select id="textLeaderSize">
                            <option value="small">Petit (12px)</option>
                            <option value="medium" selected>Moyen (16px)</option>
                            <option value="large">Grand (20px)</option>
                            <option value="xlarge">Très grand (24px)</option>
                        </select>
                    </div>
                    <div class="text-leader-form-group">
                        <label for="textLeaderColor">Couleur:</label>
                        <select id="textLeaderColor">
                            <option value="black">Noir</option>
                            <option value="blue" selected>Bleu</option>
                            <option value="red">Rouge</option>
                            <option value="green">Vert</option>
                            <option value="orange">Orange</option>
                            <option value="purple">Violet</option>
                        </select>
                    </div>
                    <div class="text-leader-form-group">
                        <label for="leaderLineStyle">Ligne de rappel:</label>
                        <select id="leaderLineStyle">
                            <option value="solid" selected>Continue</option>
                            <option value="dashed">Pointillée</option>
                            <option value="dotted">Points</option>
                        </select>
                    </div>
                </div>
                <div class="text-leader-dialog-footer">
                    <button class="text-leader-btn text-leader-btn-save" id="saveTextLeader">Confirmer</button>
                    <button class="text-leader-btn text-leader-btn-delete" id="deleteTextLeader">Supprimer</button>
                    <button class="text-leader-btn text-leader-btn-cancel" id="cancelTextLeader">Annuler</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.editDialog);

        // Événements pour le dialogue
        this.editDialog.querySelector('.text-leader-close-btn').addEventListener('click', () => {
            this.closeEditDialog();
        });
        this.editDialog.querySelector('#saveTextLeader').addEventListener('click', () => {
            this.saveCurrentTextAnnotation();
        });
        this.editDialog.querySelector('#deleteTextLeader').addEventListener('click', () => {
            this.deleteCurrentTextAnnotation();
        });
        this.editDialog.querySelector('#cancelTextLeader').addEventListener('click', () => {
            this.closeEditDialog();
        });

        // Événements clavier pour le dialogue
        this.editDialog.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeEditDialog();
            } else if (event.key === 'Enter' && event.ctrlKey) {
                this.saveCurrentTextAnnotation();
            }
        });
    }

    setupEventListeners() {
        // Événements de souris pour l'interaction 3D
        if (window.SceneManager && window.SceneManager.renderer && window.SceneManager.renderer.domElement) {
            const canvas = window.SceneManager.renderer.domElement;
            
            // Supprimer d'abord les anciens event listeners pour éviter les doublons
            if (this.clickHandler) {
                canvas.removeEventListener('click', this.clickHandler, true);
            }
            if (this.mouseMoveHandler) {
                canvas.removeEventListener('mousemove', this.mouseMoveHandler, true);
            }
            
            // Event handlers simplifiés comme measurement-tool
            this.clickHandler = (event) => {
                if (this.isActive) {
                    // console.log('🚫 Clic intercepté par TextLeaderTool');
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    this.handleCanvasClick(event);
                    return false;
                }
            };
            
            this.mouseMoveHandler = (event) => {
                if (this.isActive) {
                    event.stopImmediatePropagation();
                    
                    // Gérer l'indicateur de snap seulement pour le premier point
                    if (this.snapEnabled && this.drawingStep === 0) {
                        const point = this.getWorldPosition(event);
                        if (point) {
                            const snapPoint = this.findNearestSnapPoint(point);
                            this.currentSnapPoint = snapPoint;
                            this.updateSnapIndicator(snapPoint);
                        }
                    } else {
                        // Masquer l'indicateur pour le deuxième point
                        this.currentSnapPoint = null;
                        this.updateSnapIndicator(null);
                    }
                    
                    // Gérer l'aperçu de la ligne pendant le dessin
                    if (this.isDrawing) {
                        this.handleCanvasMouseMove(event);
                    }
                    return false;
                }
            };
            
            // Ajouter les event listeners avec capture=true
            canvas.addEventListener('click', this.clickHandler, true);
            canvas.addEventListener('mousemove', this.mouseMoveHandler, true);
            
            // console.log('✅ Event listeners TextLeaderTool configurés');
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Raccourci T pour activer/désactiver l'outil
            if (event.key === 't' || event.key === 'T') {
                if (!document.activeElement || document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                    event.preventDefault();
                    this.toggle();
                }
            }
            
            // Shift + Delete pour supprimer toutes les annotations
            if (event.shiftKey && event.key === 'Delete' && this.isActive) {
                event.preventDefault();
                this.clearAllTextAnnotations();
            }
            
            // Échap pour annuler le dessin en cours
            if (event.key === 'Escape' && this.isActive && this.isDrawing) {
                event.preventDefault();
                this.cancelCurrentDrawing();
            }
        });
    }

    // Système de snap (accrochage) aux points des briques - Compatible avec MeasurementTool
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
            // console.log('📍 Fallback: scan de la scène Three.js');
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
            return ['brick', 'block', 'insulation', 'linteau'].includes(element.type);
        }
        
        // Méthode 2: Élément avec userData
        if (element.userData && element.userData.element) {
            const wallElement = element.userData.element;
            if (wallElement.type === 'joint' || wallElement.type === 'horizontalJoint' || wallElement.type === 'verticalJoint') {
                return false;
            }
            return wallElement.dimensions && wallElement.position && ['brick', 'block', 'insulation', 'linteau'].includes(wallElement.type);
        }
        
        // Méthode 3: Mesh direct avec userData
        if (element.isMesh && element.userData && element.userData.type) {
            const type = element.userData.type;
            if (type === 'joint' || type === 'horizontalJoint' || type === 'verticalJoint') {
                return false;
            }
            return ['brick', 'block', 'insulation', 'linteau'].includes(type);
        }
        
        return false;
    }

    // Vérifier si un mesh est valide pour le snap
    isValidMeshForSnap(mesh) {
        if (!mesh.isMesh) return false;
        if (!mesh.userData) return false;
        
        // Vérifier le type d'élément
        const type = mesh.userData.type || (mesh.userData.element && mesh.userData.element.type);
        const isConstructionElement = ['brick', 'block', 'insulation', 'linteau'].includes(type);
        
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
                }
            }
            
            dimensions = element.dimensions;
            rotation = element.rotation || 0;
            elementType = element.type || 'element';
            elementId = element.id || 'unknown';
        }
        // Méthode 2: Via userData.element
        else if (element.userData && element.userData.element) {
            const wallElement = element.userData.element;
            
            if (element.position) {
                position = element.position; // Position du mesh Three.js
            } else {
                position = wallElement.position;
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
        
        return this.calculateSnapPoints(position, dimensions, rotation, elementType, elementId);
    }

    // Méthode commune pour calculer les points de snap
    calculateSnapPoints(position, dimensions, rotation, elementType, elementId = 'unknown') {
        const points = [];

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

        return points;
    }

    findSnapPoint(mousePosition) {
        if (!this.snapEnabled || !window.SceneManager) return null;

        const camera = window.SceneManager.camera;
        const canvas = window.SceneManager.renderer.domElement;
        
        let closestSnap = null;
        let minDistance = this.snapTolerance;

        this.snapPoints.forEach(snapPoint => {
            // Adapter au nouveau format des points de snap (x, y, z au lieu de position)
            const position = new THREE.Vector3(snapPoint.x, snapPoint.y, snapPoint.z);
            
            // Projeter le point 3D vers l'écran
            const screenPosition = position.clone().project(camera);
            
            // Convertir en coordonnées de pixels
            const x = (screenPosition.x * 0.5 + 0.5) * canvas.clientWidth;
            const y = (screenPosition.y * -0.5 + 0.5) * canvas.clientHeight;
            
            // Calculer la distance avec la souris
            const distance = Math.sqrt(
                Math.pow(x - mousePosition.x, 2) + 
                Math.pow(y - mousePosition.y, 2)
            );

            if (distance < minDistance) {
                minDistance = distance;
                closestSnap = {
                    position: position,
                    type: snapPoint.type,
                    description: snapPoint.description
                };
            }
        });

        return closestSnap;
    }

    findNearestSnapPoint(position) {
        if (!this.snapEnabled || this.snapPoints.length === 0) {
            return null;
        }

        let nearestPoint = null;
        let nearestDistance = 15; // Distance de snap

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
            console.log(`📍 Point de snap trouvé: ${nearestPoint.description} à ${nearestDistance.toFixed(2)} unités`);
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
            console.log(`📍 Point de snap détecté par rayon: ${nearestPoint.description} à ${nearestDistance.toFixed(2)} unités`);
        }

        return nearestPoint;
    }

    getWorldPosition(event) {
        if (!window.SceneManager) return null;

        const canvas = window.SceneManager.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        const mouse = new THREE.Vector2();
        
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, window.SceneManager.camera);

        // Vérifier le snap seulement pour le premier point (drawingStep === 0)
        if (this.snapEnabled && this.drawingStep === 0 && this.snapPoints.length > 0) {
            const nearestSnapPoint = this.findNearestSnapPointFromRay(raycaster);
            if (nearestSnapPoint) {
                return new THREE.Vector3(nearestSnapPoint.x, nearestSnapPoint.y, nearestSnapPoint.z);
            }
        }

        // Essayer d'abord d'intersector avec les objets de construction
        const constructionObjects = [];
        if (window.SceneManager.scene) {
            window.SceneManager.scene.traverse((object) => {
                if (object.isMesh && object.visible && 
                    object.userData && 
                    (object.userData.type === 'brick' || object.userData.elementType === 'brick')) {
                    constructionObjects.push(object);
                }
            });
        }

        const intersects = raycaster.intersectObjects(constructionObjects);
        if (intersects.length > 0) {
            return intersects[0].point.clone();
        }

        // Sinon, intersector avec un plan vertical
        let verticalPlane;
        
        if (this.drawingStep === 1 && this.targetPoint) {
            // Pour le deuxième point, utiliser un plan vertical qui passe par le premier point
            // Calculer la direction de la caméra pour créer un plan vertical perpendiculaire
            const cameraDirection = new THREE.Vector3();
            window.SceneManager.camera.getWorldDirection(cameraDirection);
            
            // Créer un plan vertical en utilisant la direction horizontale de la caméra
            // On garde seulement les composantes X et Z (on annule Y pour rester vertical)
            cameraDirection.y = 0;
            cameraDirection.normalize();
            
            // Calculer la distance du plan pour qu'il passe par le point cible
            const distanceToPlane = -cameraDirection.dot(this.targetPoint);
            verticalPlane = new THREE.Plane(cameraDirection, distanceToPlane);
        } else {
            // Pour le premier point, utiliser un plan vertical face à la caméra à z=0
            const cameraDirection = new THREE.Vector3();
            window.SceneManager.camera.getWorldDirection(cameraDirection);
            
            cameraDirection.y = 0;
            cameraDirection.normalize();
            
            verticalPlane = new THREE.Plane(cameraDirection, 0);
        }
        
        const planeIntersect = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(verticalPlane, planeIntersect)) {
            return planeIntersect;
        }

        return null;
    }

    showSnapIndicator(position) {
        if (!this.snapIndicator) {
            const geometry = new THREE.RingGeometry(0.3, 0.5, 8);
            const material = new THREE.MeshBasicMaterial({ 
                color: 0x00ff00, 
                transparent: true, 
                opacity: 0.8 
            });
            this.snapIndicator = new THREE.Mesh(geometry, material);
            this.textLeaderGroup.add(this.snapIndicator);
        }
        
        this.snapIndicator.position.copy(position);
        this.snapIndicator.visible = true;
    }

    hideSnapIndicator() {
        if (this.snapIndicator) {
            this.snapIndicator.visible = false;
        }
    }

    updateSnapIndicator(snapPoint) {
        if (!snapPoint) {
            if (this.snapIndicator) {
                this.snapIndicator.visible = false;
            }
            return;
        }

        if (!this.snapIndicator) {
            const geometry = new THREE.SphereGeometry(0.8, 12, 8); // Même style que measurement-tool
            const material = new THREE.MeshBasicMaterial({ 
                color: 0x00ff00, 
                transparent: true,
                opacity: 0.9
            });
            this.snapIndicator = new THREE.Mesh(geometry, material);
            this.textLeaderGroup.add(this.snapIndicator);
        }

        this.snapIndicator.position.set(snapPoint.x, snapPoint.y, snapPoint.z);
        this.snapIndicator.visible = true;
        
        // Changer la couleur selon le type de point
        this.snapIndicator.material.color.setHex(0x00ff00); // Vert pour les coins
    }

    handleCanvasClick(event) {
        const worldPosition = this.getWorldPosition(event);
        if (!worldPosition) return;

        // Vérifier si on clique sur une annotation existante pour l'éditer
        const existingAnnotation = this.getTextAnnotationAtPosition(event);
        if (existingAnnotation && this.drawingStep === 0) {
            this.openEditDialog(existingAnnotation);
            return;
        }

        if (this.drawingStep === 0) {
            // Premier clic : définir le point cible (AVEC snap)
            this.startTextLeaderDrawing(worldPosition);
        } else if (this.drawingStep === 1) {
            // Deuxième clic : définir le point de texte et terminer (SANS snap)
            this.finishTextLeaderDrawing(worldPosition);
        }
    }

    handleCanvasMouseMove(event) {
        if (!this.isDrawing || this.drawingStep !== 1) return;

        const worldPosition = this.getWorldPosition(event);
        if (!worldPosition) return;

        this.updateTemporaryLine(worldPosition);
    }

    startTextLeaderDrawing(targetPoint) {
        // console.log('📝 Début création texte avec ligne de rappel');
        this.drawingStep = 1;
        this.isDrawing = true;
        this.targetPoint = targetPoint.clone();

        // Masquer l'indicateur de snap maintenant qu'on passe au deuxième point
        this.hideSnapIndicator();

        // Créer un marqueur temporaire pour le point cible
        this.createTemporaryTargetMarker(this.targetPoint);
        
        this.updateInstructions('Cliquez pour positionner le texte');
    }

    updateTemporaryLine(textPoint) {
        if (this.temporaryLine) {
            this.textLeaderGroup.remove(this.temporaryLine);
        }

        // Créer une ligne temporaire avec flèche
        const lineGroup = new THREE.Group();
        
        const geometry = new THREE.BufferGeometry();
        geometry.setFromPoints([this.targetPoint, textPoint]);
        
        const material = new THREE.LineBasicMaterial({
            color: 0x0066cc,
            transparent: true,
            opacity: 0.8,
            linewidth: 2
        });

        const line = new THREE.Line(geometry, material);
        lineGroup.add(line);
        
        // Ajouter une flèche temporaire au bout de la ligne
        const direction = new THREE.Vector3().subVectors(this.targetPoint, textPoint).normalize();
        const arrowGeometry = new THREE.ConeGeometry(0.75, 1.5, 6); // x5 (0.15 -> 0.75, 0.3 -> 1.5)
        const arrowMaterial = new THREE.MeshBasicMaterial({
            color: 0x0066cc,
            transparent: true,
            opacity: 0.8
        });
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrow.position.copy(this.targetPoint);
        arrow.lookAt(textPoint);
        arrow.rotateX(-Math.PI / 2); // Corriger l'orientation pour pointer vers le point
        lineGroup.add(arrow);

        this.temporaryLine = lineGroup;
        this.textLeaderGroup.add(this.temporaryLine);

        // Marqueur temporaire pour le texte
        if (this.temporaryTextMarker) {
            this.textLeaderGroup.remove(this.temporaryTextMarker);
        }
        this.temporaryTextMarker = this.createTextMarker(textPoint, 0x0066cc);
        this.textLeaderGroup.add(this.temporaryTextMarker);
    }

    finishTextLeaderDrawing(textPoint) {
        // console.log('📝 Fin création texte avec ligne de rappel');
        this.textPoint = textPoint.clone();
        
        // Nettoyer les éléments temporaires
        this.cleanupTemporaryElements();
        
        // Ouvrir le dialogue d'édition
        this.openEditDialog();
        
        // Réinitialiser l'état de dessin
        this.drawingStep = 0;
        this.isDrawing = false;
    }

    openEditDialog(annotation = null) {
        this.currentEditingAnnotation = annotation;
        
        if (annotation) {
            // Mode édition
            const textArea = this.editDialog.querySelector('#textLeaderContent');
            const styleSelect = this.editDialog.querySelector('#textLeaderStyle');
            const sizeSelect = this.editDialog.querySelector('#textLeaderSize');
            const colorSelect = this.editDialog.querySelector('#textLeaderColor');
            const lineStyleSelect = this.editDialog.querySelector('#leaderLineStyle');
            
            textArea.value = annotation.text;
            styleSelect.value = annotation.style;
            sizeSelect.value = annotation.size;
            colorSelect.value = annotation.color;
            lineStyleSelect.value = annotation.lineStyle;
            
            this.editDialog.querySelector('#deleteTextLeader').style.display = 'inline-block';
        } else {
            // Mode création
            this.editDialog.querySelector('#textLeaderContent').value = '';
            this.editDialog.querySelector('#deleteTextLeader').style.display = 'none';
        }
        
        this.editDialog.style.display = 'flex';
        this.editDialog.querySelector('#textLeaderContent').focus();
    }

    closeEditDialog() {
        this.editDialog.style.display = 'none';
        this.currentEditingAnnotation = null;
        
        // Si on était en train de créer une nouvelle annotation, nettoyer
        if (this.isDrawing) {
            this.cancelCurrentDrawing();
        }
    }

    saveCurrentTextAnnotation() {
        const textArea = this.editDialog.querySelector('#textLeaderContent');
        const styleSelect = this.editDialog.querySelector('#textLeaderStyle');
        const sizeSelect = this.editDialog.querySelector('#textLeaderSize');
        const colorSelect = this.editDialog.querySelector('#textLeaderColor');
        const lineStyleSelect = this.editDialog.querySelector('#leaderLineStyle');
        
        const text = textArea.value.trim();
        if (!text) {
            alert('Le texte ne peut pas être vide');
            return;
        }

        if (this.currentEditingAnnotation) {
            // Mise à jour d'une annotation existante
            this.updateTextAnnotation(this.currentEditingAnnotation, {
                text: text,
                style: styleSelect.value,
                size: sizeSelect.value,
                color: colorSelect.value,
                lineStyle: lineStyleSelect.value
            });
        } else {
            // Création d'une nouvelle annotation
            this.createTextAnnotation(
                this.targetPoint,
                this.textPoint,
                text,
                styleSelect.value,
                sizeSelect.value,
                colorSelect.value,
                lineStyleSelect.value
            );
            
            // Désactiver l'outil et revenir en mode construction après création
            console.log('📝 Texte créé - retour en mode construction');
            this.closeEditDialog();
            this.deactivate();
            // Forcer la réactivation du mode construction
            this.activateConstructionMode();
            return;
        }
        
        this.closeEditDialog();
    }

    deleteCurrentTextAnnotation() {
        if (!this.currentEditingAnnotation) return;
        
        if (confirm('Êtes-vous sûr de vouloir supprimer cette annotation ?')) {
            this.removeTextAnnotation(this.currentEditingAnnotation.id);
            this.closeEditDialog();
        }
    }

    createTextAnnotation(targetPoint, textPoint, text, style = 'normal', size = 'medium', color = 'blue', lineStyle = 'solid') {
        const annotationId = this.annotationId++;
        
        const annotation = {
            id: annotationId,
            targetPoint: targetPoint.clone(),
            textPoint: textPoint.clone(),
            text: text,
            style: style,
            size: size,
            color: color,
            lineStyle: lineStyle,
            created: new Date(),
            modified: new Date()
        };

        // Créer les objets 3D
        this.createTextAnnotationObjects(annotation);
        
        // Ajouter à la liste
        this.textAnnotations.push(annotation);
        
        console.log(`📝 Annotation texte créée: ${annotation.id} - "${text}"`);
        return annotation;
    }

    createTextAnnotationObjects(annotation) {
        const group = new THREE.Group();
        group.userData.textLeaderId = annotation.id;
        group.userData.textLeaderType = 'text-leader';
        group.userData.toolType = 'textleader';
        group.name = `textleader-${annotation.id}`;

        // Ligne de rappel
        const leaderLine = this.createLeaderLine(annotation);
        group.add(leaderLine);

        // Marqueur au point cible
        const targetMarker = this.createTargetMarker(annotation.targetPoint);
        group.add(targetMarker);

        // Texte
        const textSprite = this.createTextSprite(annotation);
        group.add(textSprite);

        // Stocker les références
        annotation.group = group;
        annotation.leaderLine = leaderLine;
        annotation.targetMarker = targetMarker;
        annotation.textSprite = textSprite;

        this.textLeaderGroup.add(group);
        
        // Assigner au calque textes si le LayerManager est disponible
        if (window.LayerManager) {
            window.LayerManager.assignElementToLayer(group, 'textleader');
        }
    }

    createLeaderLine(annotation) {
        const group = new THREE.Group();
        
        // Ligne principale
        const geometry = new THREE.BufferGeometry();
        geometry.setFromPoints([annotation.targetPoint, annotation.textPoint]);
        
        const materialProps = {
            color: 0x000000, // Toujours noir
            linewidth: 2,
            transparent: true,
            opacity: 0.8
        };

        if (annotation.lineStyle === 'dashed') {
            materialProps.linecap = 'round';
            materialProps.linejoin = 'round';
            // Note: Three.js ne supporte pas nativement les lignes pointillées,
            // on peut utiliser un shader personnalisé si nécessaire
        }

        const material = new THREE.LineBasicMaterial(materialProps);
        const line = new THREE.Line(geometry, material);
        group.add(line);
        
        // Créer une flèche au point cible
        const direction = new THREE.Vector3().subVectors(annotation.targetPoint, annotation.textPoint).normalize();
        const arrowGeometry = new THREE.ConeGeometry(1.0, 2.0, 8); // x5 (0.2 -> 1.0, 0.4 -> 2.0)
        const arrowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.8
        });
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        
        // Positionner la flèche au point cible
        arrow.position.copy(annotation.targetPoint);
        
        // Orienter la flèche pour pointer vers le point cible (du texte vers le point)
        arrow.lookAt(annotation.textPoint);
        arrow.rotateX(-Math.PI / 2); // Ajuster l'orientation pour pointer vers le point
        
        group.add(arrow);
        
        return group;
    }

    createTargetMarker(position) {
        // Plus besoin de marqueur séparé car la flèche est sur la ligne
        return new THREE.Group(); // Groupe vide
    }

    createTextSprite(annotation) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Configuration selon la taille - Réduite x10 pour équilibre
        const sizeMap = {
            'small': { fontSize: 120 },    // x10 (12 -> 120)
            'medium': { fontSize: 160 },   // x10 (16 -> 160)
            'large': { fontSize: 200 },    // x10 (20 -> 200)
            'xlarge': { fontSize: 240 }    // x10 (24 -> 240)
        };
        
        const config = sizeMap[annotation.size] || sizeMap['medium'];

        // Style du texte
        let fontStyle = 'normal';
        let fontWeight = 'normal';
        
        switch (annotation.style) {
            case 'bold':
                fontWeight = 'bold';
                break;
            case 'italic':
                fontStyle = 'italic';
                break;
            case 'title':
                fontWeight = 'bold';
                config.fontSize += 50; // Augmentation réduite pour les titres
                break;
        }

        context.font = `${fontStyle} ${fontWeight} ${config.fontSize}px Arial`;
        context.textAlign = 'left';
        context.textBaseline = 'top';

        // Mesurer le texte pour adapter la taille du canvas
        const lines = annotation.text.split('\n');
        let maxWidth = 0;
        lines.forEach(line => {
            const width = context.measureText(line).width;
            if (width > maxWidth) maxWidth = width;
        });
        
        const lineHeight = config.fontSize * 1.2; // 20% d'espacement
        const padding = 20; // Petite marge
        
        // Adapter le canvas à la taille réelle du texte
        canvas.width = maxWidth + padding * 2;
        canvas.height = lines.length * lineHeight + padding * 2;
        
        // Reconfigurer le context après changement de taille
        context.font = `${fontStyle} ${fontWeight} ${config.fontSize}px Arial`;
        context.textAlign = 'left';
        context.textBaseline = 'top';
        context.fillStyle = '#000000'; // Texte toujours noir
        
        // Dessiner chaque ligne de texte
        lines.forEach((line, index) => {
            context.fillText(line, padding, padding + index * lineHeight);
        });

        // Créer le sprite
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        
        sprite.position.copy(annotation.textPoint);
        sprite.position.y += 2; // Élever légèrement au-dessus du point
        
        // Échelle proportionnelle à la taille du canvas
        const scale = config.fontSize / 50; // Facteur d'échelle basé sur la taille de police
        sprite.scale.set(canvas.width / 100 * scale, canvas.height / 100 * scale, 1);

        return sprite;
    }

    wrapText(context, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = context.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    createTemporaryTargetMarker(position) {
        if (this.temporaryTargetMarker) {
            this.textLeaderGroup.remove(this.temporaryTargetMarker);
        }
        this.temporaryTargetMarker = this.createArrowMarker(position, 0xff3333);
        this.textLeaderGroup.add(this.temporaryTargetMarker);
    }

    createArrowMarker(position, color) {
        // Créer une flèche temporaire (plus simple) - orientée vers le bas
        const group = new THREE.Group();
        
        // Corps de la flèche
        const shaftGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 6);
        const shaftMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        shaft.position.y = 0.4;
        group.add(shaft);
        
        // Pointe de la flèche - orientée vers le bas
        const headGeometry = new THREE.ConeGeometry(0.25, 0.5, 6);
        const headMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = -0.25; // Positionner en bas du corps
        head.rotateX(Math.PI); // Retourner le cône pour pointer vers le bas
        group.add(head);
        
        group.position.copy(position);
        group.position.y += 0.8; // Élever la flèche au-dessus du point
        return group;
    }

    createTextMarker(position, color) {
        const geometry = new THREE.CircleGeometry(0.3, 8);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        const marker = new THREE.Mesh(geometry, material);
        marker.position.copy(position);
        marker.rotateX(-Math.PI / 2);
        return marker;
    }

    cleanupTemporaryElements() {
        if (this.temporaryLine) {
            this.textLeaderGroup.remove(this.temporaryLine);
            this.temporaryLine = null;
        }
        if (this.temporaryTargetMarker) {
            this.textLeaderGroup.remove(this.temporaryTargetMarker);
            this.temporaryTargetMarker = null;
        }
        if (this.temporaryTextMarker) {
            this.textLeaderGroup.remove(this.temporaryTextMarker);
            this.temporaryTextMarker = null;
        }
        this.hideSnapIndicator();
    }

    cancelCurrentDrawing() {
        console.log('📝 Annulation du dessin en cours');
        this.cleanupTemporaryElements();
        
        // Masquer l'indicateur de snap
        this.hideSnapIndicator();
        
        this.drawingStep = 0;
        this.isDrawing = false;
        this.targetPoint = null;
        this.textPoint = null;
        this.updateInstructions('Cliquez pour commencer une annotation');
    }

    updateTextAnnotation(annotation, newData) {
        // Mettre à jour les données
        Object.assign(annotation, newData);
        annotation.modified = new Date();

        // Recréer les objets 3D
        this.textLeaderGroup.remove(annotation.group);
        this.createTextAnnotationObjects(annotation);

        console.log(`📝 Annotation texte mise à jour: ${annotation.id}`);
    }

    removeTextAnnotation(annotationId) {
        const index = this.textAnnotations.findIndex(a => a.id === annotationId);
        if (index === -1) return;

        const annotation = this.textAnnotations[index];
        this.textLeaderGroup.remove(annotation.group);
        this.textAnnotations.splice(index, 1);

        console.log(`📝 Annotation texte supprimée: ${annotationId}`);
    }

    clearAllTextAnnotations() {
        if (this.textAnnotations.length === 0) return;

        if (confirm(`Êtes-vous sûr de vouloir supprimer toutes les ${this.textAnnotations.length} annotations texte ?`)) {
            console.log('📝 Suppression de toutes les annotations texte');
            this.textAnnotations.forEach(annotation => {
                this.textLeaderGroup.remove(annotation.group);
            });
            this.textAnnotations = [];
            this.closeEditDialog();
        }
    }

    // Gestion de l'interaction avec les annotations existantes
    getTextAnnotationAtPosition(event) {
        if (!window.SceneManager) return null;

        const canvas = window.SceneManager.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        const mouse = new THREE.Vector2();
        
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, window.SceneManager.camera);

        // Collecter tous les sprites de texte
        const textObjects = [];
        this.textAnnotations.forEach(annotation => {
            if (annotation.textSprite) {
                textObjects.push(annotation.textSprite);
            }
        });

        const intersects = raycaster.intersectObjects(textObjects);
        if (intersects.length > 0) {
            const sprite = intersects[0].object;
            return this.textAnnotations.find(annotation => annotation.textSprite === sprite);
        }

        return null;
    }

    // Méthodes publiques pour l'activation/désactivation
    activate() {
        this.isActive = true;
        this.collectSnapPoints(); // Régénérer les points de snap
        this.showInstructions();
        this.deactivateOtherTools();
        this.disableGhostBricks();
        
        // Reconfigurer les event listeners à chaque activation
        this.setupEventListeners();
        
        // console.log('📝 Outil texte avec ligne de rappel activé');
    }

    deactivate() {
        this.isActive = false;
        this.cancelCurrentDrawing();
        
        // Masquer l'indicateur de snap
        this.hideSnapIndicator();
        
        this.hideInstructions();
        this.enableGhostBricks();
        this.removeEventListeners();
        // console.log('📝 Outil texte avec ligne de rappel désactivé');
    }

    removeEventListeners() {
        // Supprimer les event listeners spécifiques à cet outil
        if (window.SceneManager && window.SceneManager.renderer && window.SceneManager.renderer.domElement) {
            const canvas = window.SceneManager.renderer.domElement;
            if (this.clickHandler) {
                canvas.removeEventListener('click', this.clickHandler, true);
            }
            if (this.mouseMoveHandler) {
                canvas.removeEventListener('mousemove', this.mouseMoveHandler, true);
            }
            console.log('✅ Event listeners TextLeaderTool supprimés');
        }
    }

    toggle() {
        if (this.isActive) {
            this.deactivate();
        } else {
            this.activate();
        }
    }

    showInstructions() {
        if (window.ToolbarManager && window.ToolbarManager.showInstruction) {
            window.ToolbarManager.showInstruction('Outil texte avec ligne de rappel actif - Cliquez sur le point cible puis sur la position du texte - [T] basculer, [Échap] annuler');
        }
    }

    hideInstructions() {
        if (window.ToolbarManager && window.ToolbarManager.hideInstruction) {
            window.ToolbarManager.hideInstruction();
        }
    }

    updateInstructions(text) {
        if (window.ToolbarManager && window.ToolbarManager.showInstruction) {
            window.ToolbarManager.showInstruction(text);
        }
    }

    deactivateOtherTools() {
        // Désactiver les autres outils
        if (window.ToolbarManager && window.ToolbarManager.setTool) {
            window.ToolbarManager.setTool('textLeader');
        }
    }

    // Gestion des briques fantômes - Inspiré de measurement-tool
    disableGhostBricks() {
        // console.log('👻 Désactivation de la brique fantôme pour l\'outil texte');
        
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
        console.log('� Désactivation des interactions avec les briques');
        
        // Marquer que l'outil texte est actif pour que les autres systèmes l'ignorent
        if (window.SceneManager) {
            window.SceneManager.textLeaderToolActive = true;
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
        console.log('✅ Réactivation des interactions avec les briques');
        
        // Marquer que l'outil texte n'est plus actif
        if (window.SceneManager) {
            window.SceneManager.textLeaderToolActive = false;
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

    enableGhostBricks() {
        console.log('👻 Restauration de la brique fantôme après texte');
        
        if (window.ConstructionTools) {
            // Restaurer les états précédents seulement s'ils étaient activés
            if (this.previousPlacementMode !== undefined) {
                window.ConstructionTools.isPlacementMode = this.previousPlacementMode;
            }
            
            if (this.previousShowGhost !== undefined) {
                window.ConstructionTools.showGhost = this.previousShowGhost;
            }
            
            // Réactiver l'élément fantôme si il était actif et qu'on n'est pas en mode suggestions
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
            
            console.log('✅ Brique fantôme et interactions restaurées');
            
            // Nettoyer les variables temporaires
            this.previousPlacementMode = undefined;
            this.previousShowGhost = undefined;
        }
        
        // Réactiver les gestionnaires d'événements de sélection de briques
        this.enableBrickSelection();
    }

    // Méthodes d'export/import
    exportTextAnnotations() {
        return this.textAnnotations.map(annotation => ({
            id: annotation.id,
            targetPoint: {
                x: annotation.targetPoint.x,
                y: annotation.targetPoint.y,
                z: annotation.targetPoint.z
            },
            textPoint: {
                x: annotation.textPoint.x,
                y: annotation.textPoint.y,
                z: annotation.textPoint.z
            },
            text: annotation.text,
            style: annotation.style,
            size: annotation.size,
            color: annotation.color,
            lineStyle: annotation.lineStyle,
            created: annotation.created,
            modified: annotation.modified
        }));
    }

    importTextAnnotations(annotationsData) {
        this.clearAllTextAnnotations();
        annotationsData.forEach(data => {
            const targetPoint = new THREE.Vector3(data.targetPoint.x, data.targetPoint.y, data.targetPoint.z);
            const textPoint = new THREE.Vector3(data.textPoint.x, data.textPoint.y, data.textPoint.z);
            this.createTextAnnotation(
                targetPoint,
                textPoint,
                data.text,
                data.style,
                data.size,
                data.color,
                data.lineStyle
            );
        });
        console.log(`📝 ${annotationsData.length} annotations texte importées`);
    }

    // Méthodes de visibilité
    showTextAnnotations() {
        if (this.textLeaderGroup) {
            this.textLeaderGroup.visible = true;
        }
    }

    hideTextAnnotations() {
        if (this.textLeaderGroup) {
            this.textLeaderGroup.visible = false;
        }
    }

    // Recherche
    searchTextAnnotations(searchText) {
        const searchLower = searchText.toLowerCase();
        return this.textAnnotations.filter(annotation =>
            annotation.text.toLowerCase().includes(searchLower)
        );
    }

    // Filtrage par couleur/style
    filterByColor(color) {
        return this.textAnnotations.filter(annotation => annotation.color === color);
    }

    filterByStyle(style) {
        return this.textAnnotations.filter(annotation => annotation.style === style);
    }

    // Méthode pour forcer l'activation du mode construction
    activateConstructionMode() {
        console.log('🔧 Activation forcée du mode construction');
        
        if (window.ConstructionTools) {
            // S'assurer que le mode de placement est actif
            window.ConstructionTools.isPlacementMode = true;
            window.ConstructionTools.showGhost = true;
            
            // Réactiver l'élément fantôme seulement s'il n'y a pas de suggestions actives
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
            
            console.log('✅ Mode construction activé');
        } else {
            console.warn('⚠️ ConstructionTools non disponible');
        }
    }
}

// Initialisation globale
window.TextLeaderTool = null;

// Fonction d'initialisation retardée
function initTextLeaderTool() {
    if (!window.TextLeaderTool && window.THREE) {
        window.TextLeaderTool = new TextLeaderTool();
        // console.log('✅ TextLeaderTool créé');
    }
}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    // Attendre un peu que l'application se charge
    setTimeout(initTextLeaderTool, 500);
});

// Initialisation de secours
window.addEventListener('load', () => {
    setTimeout(() => {
        if (!window.TextLeaderTool) {
            initTextLeaderTool();
            if (window.DEBUG_APP) {
                console.log('✅ TextLeaderTool initialisé (secours)');
            }
        }
    }, 1000);
});
