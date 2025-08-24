/**
 * Gestionnaire de matériaux et aperçus 3D pour l'interface moderne
 */

class ModernMaterialManager {
    constructor() {
        this.materials = new Map();
        this.previewRenderers = new Map();
        this.previewScenes = new Map();
        this.previewCameras = new Map();
        
        this.initializeMaterials();
        this.setupPreviewSystem();
    }

    initializeMaterials() {
        // Matériaux de briques
        this.materials.set('brick-red', {
            name: 'Brique Rouge',
            color: 0x8B4513,
            roughness: 0.8,
            metalness: 0.1,
            normalScale: 0.5,
            type: 'brick'
        });

        this.materials.set('brick-yellow', {
            name: 'Brique Jaune',
            color: 0xDAA520,
            roughness: 0.8,
            metalness: 0.1,
            normalScale: 0.5,
            type: 'brick'
        });

        this.materials.set('brick-white', {
            name: 'Brique Blanche',
            color: 0xF5F5DC,
            roughness: 0.8,
            metalness: 0.1,
            normalScale: 0.5,
            type: 'brick'
        });

        // Matériaux de construction
        this.materials.set('concrete', {
            name: 'Béton',
            color: 0x808080,
            roughness: 0.9,
            metalness: 0.0,
            normalScale: 0.3,
            type: 'block'
        });

        this.materials.set('stone', {
            name: 'Pierre',
            color: 0x696969,
            roughness: 0.7,
            metalness: 0.0,
            normalScale: 0.8,
            type: 'block'
        });

        this.materials.set('wood', {
            name: 'Bois',
            color: 0x8B4513,
            roughness: 0.6,
            metalness: 0.0,
            normalScale: 0.4,
            type: 'structural'
        });

        this.materials.set('insulation', {
            name: 'Isolant',
            color: 0xFFFFE0,
            roughness: 0.9,
            metalness: 0.0,
            normalScale: 0.1,
            type: 'insulation'
        });
    }

    setupPreviewSystem() {
        // Attendre que le DOM soit prêt
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createPreviews());
        } else {
            this.createPreviews();
        }
    }

    createPreviews() {
        const elementCards = document.querySelectorAll('.element-card');
        
        elementCards.forEach(card => {
            const preview = card.querySelector('.element-preview');
            const elementType = card.dataset.element || card.dataset.material;
            
            if (preview && elementType) {
                this.create3DPreview(preview, elementType, card);
            }
        });
    }

    create3DPreview(container, elementType, card) {
        const width = container.clientWidth || 60;
        const height = container.clientHeight || 60;

        // Créer la scène de prévisualisation
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x2d2d2d);

        // Caméra
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(2, 2, 2);
        camera.lookAt(0, 0, 0);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            preserveDrawingBuffer: true
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Éclairage
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(2, 2, 1);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 256;
        directionalLight.shadow.mapSize.height = 256;
        scene.add(directionalLight);

        // Créer l'objet 3D selon le type
        const object = this.createPreviewObject(elementType, card);
        if (object) {
            scene.add(object);
        }

        // Remplacer le contenu du container
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        // Stocker les références
        const previewId = elementType + '_' + Math.random().toString(36).substr(2, 9);
        this.previewScenes.set(previewId, scene);
        this.previewCameras.set(previewId, camera);
        this.previewRenderers.set(previewId, renderer);

        // Rendre la scène
        renderer.render(scene, camera);

        // Animation de rotation pour les éléments
        if (card.dataset.element) {
            this.startPreviewAnimation(previewId, object);
        }

        // Gestion du redimensionnement
        const resizeObserver = new ResizeObserver(() => {
            const newWidth = container.clientWidth || 60;
            const newHeight = container.clientHeight || 60;
            
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
            renderer.render(scene, camera);
        });
        resizeObserver.observe(container);
    }

    createPreviewObject(elementType, card) {
        const materialId = card.dataset.material;
        const material = this.getMaterial(materialId || 'brick-red');

        if (card.dataset.element) {
            // Éléments 3D
            return this.createElement(elementType, material);
        } else if (card.dataset.material) {
            // Échantillons de matériaux
            return this.createMaterialSample(material);
        } else if (card.dataset.texture) {
            // Échantillons de textures
            return this.createTextureSample(elementType);
        }

        return null;
    }

    createElement(elementType, material) {
        let geometry;
        
        switch (elementType) {
            case 'brick-standard':
                geometry = new THREE.BoxGeometry(1, 0.3, 0.5);
                break;
            case 'brick-half':
                geometry = new THREE.BoxGeometry(0.5, 0.3, 0.5);
                break;
            case 'brick-quarter':
                geometry = new THREE.BoxGeometry(0.25, 0.3, 0.5);
                break;
            case 'brick-corner':
                geometry = new THREE.BoxGeometry(1, 0.3, 1);
                break;
            case 'block-concrete':
            case 'block-cellular':
            case 'block-insulation':
                geometry = new THREE.BoxGeometry(1, 0.6, 1);
                break;
            case 'lintel':
                geometry = new THREE.BoxGeometry(2, 0.2, 0.5);
                break;
            case 'pillar':
                geometry = new THREE.BoxGeometry(0.3, 2, 0.3);
                break;
            case 'beam':
                geometry = new THREE.BoxGeometry(2, 0.3, 0.3);
                break;
            default:
                geometry = new THREE.BoxGeometry(1, 0.5, 1);
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    }

    createMaterialSample(material) {
        const geometry = new THREE.SphereGeometry(0.4, 16, 12);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    createTextureSample(textureType) {
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xcccccc,
            // CORRECTION: Rendre les échantillons de texture opaques dans la bibliothèque
            transparent: false,
            opacity: 1.0 
        });
        
        // Ajouter des effets de texture selon le type
        if (textureType === 'rough') {
            material.roughness = 1.0;
        } else if (textureType === 'smooth') {
            material.roughness = 0.1;
        }

        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }

    getMaterial(materialId) {
        const materialConfig = this.materials.get(materialId);
        
        if (!materialConfig) {
            return new THREE.MeshLambertMaterial({ color: 0x888888 });
        }

        const material = new THREE.MeshStandardMaterial({
            color: materialConfig.color,
            roughness: materialConfig.roughness,
            metalness: materialConfig.metalness
        });

        return material;
    }

    startPreviewAnimation(previewId, object) {
        const scene = this.previewScenes.get(previewId);
        const camera = this.previewCameras.get(previewId);
        const renderer = this.previewRenderers.get(previewId);

        if (!scene || !camera || !renderer || !object) return;

        let rotation = 0;
        const animate = () => {
            rotation += 0.01;
            object.rotation.y = rotation;
            
            renderer.render(scene, camera);
            
            // Continuer l'animation seulement si l'élément est visible
            if (renderer.domElement.offsetParent !== null) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    // Méthodes utilitaires pour l'intégration
    getMaterialInfo(materialId) {
        return this.materials.get(materialId);
    }

    getAllMaterials() {
        return Array.from(this.materials.entries()).map(([id, config]) => ({
            id,
            ...config
        }));
    }

    createMaterialForScene(materialId) {
        const config = this.materials.get(materialId);
        if (!config) return null;

        return new THREE.MeshStandardMaterial({
            color: config.color,
            roughness: config.roughness,
            metalness: config.metalness,
            name: materialId
        });
    }

    updatePreviewMaterial(previewId, materialId) {
        const scene = this.previewScenes.get(previewId);
        if (!scene) return;

        const object = scene.children.find(child => child.type === 'Mesh');
        if (object) {
            object.material = this.getMaterial(materialId);
            
            const renderer = this.previewRenderers.get(previewId);
            const camera = this.previewCameras.get(previewId);
            if (renderer && camera) {
                renderer.render(scene, camera);
            }
        }
    }

    cleanup() {
        // Nettoyer les ressources WebGL
        this.previewRenderers.forEach((renderer, id) => {
            renderer.dispose();
        });
        
        this.previewScenes.forEach((scene, id) => {
            scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        });

        this.previewRenderers.clear();
        this.previewScenes.clear();
        this.previewCameras.clear();
    }
}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    window.modernMaterialManager = new ModernMaterialManager();
});

// Nettoyage avant déchargement de la page
window.addEventListener('beforeunload', () => {
    if (window.modernMaterialManager) {
        window.modernMaterialManager.cleanup();
    }
});
