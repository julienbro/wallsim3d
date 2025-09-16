/**
 * Gestionnaire des Calques - Système de gestion des calques par type d'élément
 * Permet d'organiser et contrôler la visibilité des différents types d'éléments
 */
class LayerManager {
    constructor() {
        this.layers = {
            'briques-m65': {
                name: 'Briques M65',
                visible: true,
                locked: false,
                opacity: 100,
                color: '#D2691E',
                elements: new Set(),
                icon: 'fas fa-square'
            },
            'blocs-creux': {
                name: 'Blocs Creux',
                visible: true,
                locked: false,
                opacity: 100,
                color: '#808080',
                elements: new Set(),
                icon: 'fas fa-cube'
            },
            'joints-horizontaux': {
                name: 'Joints Horizontaux',
                visible: true,
                locked: false,
                opacity: 100,
                color: '#9E9E9E',
                elements: new Set(),
                icon: 'fas fa-minus'
            },
            'joints-verticaux': {
                name: 'Joints Verticaux',
                visible: true,
                locked: false,
                opacity: 100,
                color: '#9E9E9E',
                elements: new Set(),
                icon: 'fas fa-grip-lines-vertical'
            },
            'isolants': {
                name: 'Isolants',
                visible: true,
                locked: false,
                opacity: 80,
                color: '#FFD700',
                elements: new Set(),
                icon: 'fas fa-th-large'
            },
            'linteaux': {
                name: 'Linteaux',
                visible: true,
                locked: false,
                opacity: 100,
                color: '#708090',
                elements: new Set(),
                icon: 'emoji'
            },
            'etancheite': {
                name: 'Étanchéité',
                visible: true,
                locked: false,
                opacity: 100,
                color: '#111111',
                elements: new Set(),
                icon: 'fas fa-tint'
            },
            'cotations': {
                name: 'Cotations',
                visible: true,
                locked: false,
                opacity: 100,
                color: '#FF4444',
                elements: new Set(),
                icon: 'fas fa-ruler'
            },
            'annotations': {
                name: 'Annotations',
                visible: true,
                locked: false,
                opacity: 100,
                color: '#4444FF',
                elements: new Set(),
                icon: 'fas fa-comment'
            },
            'textes': {
                name: 'Textes avec ligne',
                visible: true,
                locked: false,
                opacity: 100,
                color: '#44FF44',
                elements: new Set(),
                icon: 'fas fa-comment-dots'
            }
        };

        this.autoLayerAssignment = true;
        this.layerColorOverride = false;
        this.showLayerPreview = true;
        this.selectedLayer = null;

        // console.log('🎨 LayerManager initialisé');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateLayerStats();
        this.updateLayerCounts();

        // Scan initial des éléments existants
        this.scanExistingElements();

        // console.log('✅ LayerManager prêt');
    }

    setupEventListeners() {
        // Contrôles généraux
        document.getElementById('toggleAllLayers')?.addEventListener('click', () => {
            this.toggleAllLayers(true);
        });

        document.getElementById('hideAllLayers')?.addEventListener('click', () => {
            this.toggleAllLayers(false);
        });

        document.getElementById('isolateSelectedLayer')?.addEventListener('click', () => {
            this.isolateSelectedLayer();
        });

        // Boutons de visibilité
        document.querySelectorAll('.layer-visibility-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const layerId = btn.dataset.layer;
                this.toggleLayerVisibility(layerId);
            });
        });

        // Boutons de verrouillage
        document.querySelectorAll('.layer-lock-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const layerId = btn.dataset.layer;
                this.toggleLayerLock(layerId);
            });
        });

        // Headers de calques (sélection)
        document.querySelectorAll('.layer-header').forEach(header => {
            header.addEventListener('click', () => {
                const layerItem = header.closest('.layer-item');
                const layerId = layerItem.dataset.layer;
                this.selectLayer(layerId);
            });
        });

        // Sliders d'opacité
        document.querySelectorAll('.layer-opacity').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const layerId = slider.dataset.layer;
                const opacity = parseInt(e.target.value);
                this.setLayerOpacity(layerId, opacity);
            });
        });

        // Sélecteurs de couleur
        document.querySelectorAll('.layer-color').forEach(colorInput => {
            colorInput.addEventListener('change', (e) => {
                const layerId = colorInput.dataset.layer;
                const color = e.target.value;
                this.setLayerColor(layerId, color);
            });
        });

        // Options avancées
        document.getElementById('autoLayerAssignment')?.addEventListener('change', (e) => {
            this.autoLayerAssignment = e.target.checked;
            // console.log('🔄 Assignation automatique:', this.autoLayerAssignment);
        });

        document.getElementById('layerColorOverride')?.addEventListener('change', (e) => {
            this.layerColorOverride = e.target.checked;
            this.applyLayerColors();
            // console.log('🎨 Forçage couleurs:', this.layerColorOverride);
        });

        document.getElementById('showLayerPreview')?.addEventListener('change', (e) => {
            this.showLayerPreview = e.target.checked;
            // console.log('👁️ Aperçu temps réel:', this.showLayerPreview);
        });

        // Actions
        document.getElementById('refreshLayers')?.addEventListener('click', () => {
            this.refreshLayers();
        });

        document.getElementById('resetLayerSettings')?.addEventListener('click', () => {
            this.resetLayerSettings();
        });
    }

    // === GESTION DES ÉLÉMENTS ===
    assignElementToLayer(element, elementType) {
        // console.log('🎨 assignElementToLayer appelée:', { element, elementType, autoAssignment: this.autoLayerAssignment });
        
        if (!this.autoLayerAssignment) return;

        let layerId = this.getLayerIdFromElementType(elementType, element);
        
        if (layerId && this.layers[layerId]) {
            this.addElementToLayer(element, layerId);
            // console.log(`📍 Élément assigné au calque ${layerId}:`, elementType);
        } else {
            // Calque non trouvé pour le type: elementType
        }
    }

    getLayerIdFromElementType(elementType, element = null) {
        // 
        
        // CORRECTION: Détection intelligente des joints selon leurs propriétés
        if (elementType === 'joint' && element) {
            // Vérifier les propriétés du joint pour déterminer son type
            const isHorizontal = element.userData?.isHorizontalJoint || 
                               element.isHorizontalJoint || 
                               element.userData?.elementType === 'horizontal-joint';
            const isVertical = element.userData?.isVerticalJoint || 
                              element.isVerticalJoint || 
                              element.userData?.elementType === 'vertical-joint';
            
            if (isVertical) {
                // 
                return 'joints-verticaux';
            } else if (isHorizontal) {
                // 
                return 'joints-horizontaux';
            }
        }
        
        const typeMapping = {
            'brique': 'briques-m65',
            'brick': 'briques-m65',
            'M65': 'briques-m65',
            'bloc': 'blocs-creux',
            'block': 'blocs-creux',
            'creux': 'blocs-creux',
            'joint-horizontal': 'joints-horizontaux',
            'joint-vertical': 'joints-verticaux',
            'joint': 'joints-horizontaux', // par défaut (fallback seulement)
            'isolant': 'isolants',
            'insulation': 'isolants',
            'linteau': 'linteaux',
            'lintel': 'linteaux',
            'diba': 'etancheite',
            'etancheite': 'etancheite',
            'measurement': 'cotations',
            'cotation': 'cotations',
            'dimension': 'cotations',
            'annotation': 'annotations',
            'textleader': 'textes',
            'text-leader': 'textes',
            'texte': 'textes'
        };

        // Recherche exacte puis partielle
        let layerId = typeMapping[elementType];
        if (!layerId) {
            for (const [key, value] of Object.entries(typeMapping)) {
                if (elementType && elementType.toLowerCase().includes(key.toLowerCase())) {
                    layerId = value;
                    break;
                }
            }
        }

        // 
        return layerId;
    }

    addElementToLayer(element, layerId) {
        // console.log('🎨 addElementToLayer appelée:', { element, layerId });
        
        if (!this.layers[layerId]) {
            console.warn(`⚠️ Calque ${layerId} non trouvé`);
            return;
        }

        // PRÉVENTION DOUBLONS: Vérifier si l'élément est déjà dans ce calque
        if (this.layers[layerId].elements.has(element)) {
            // console.log(`🔍 Élément déjà présent dans le calque ${layerId}, ajout ignoré:`, element.id || element.uuid);
            return;
        }

        // NETTOYAGE: Vérifier s'il est dans un autre calque et l'en retirer
        Object.keys(this.layers).forEach(otherLayerId => {
            if (otherLayerId !== layerId && this.layers[otherLayerId].elements.has(element)) {
                // console.log(`🔍 Retrait de l'élément du calque ${otherLayerId} avant ajout à ${layerId}`);
                this.layers[otherLayerId].elements.delete(element);
            }
        });

        this.layers[layerId].elements.add(element);
        element.userData = element.userData || {};
        element.userData.layerId = layerId;

        // console.log(`✅ Élément ajouté au calque ${layerId}, total: ${this.layers[layerId].elements.size}`);

        this.updateLayerCounts();
        this.applyLayerProperties(element, layerId);
        
        // Réessayer l'application des propriétés après un court délai si le matériau n'était pas prêt
        if (!element.material || typeof element.material === 'string') {
            setTimeout(() => {
                this.applyLayerProperties(element, layerId);
            }, 100);
        }
    }

    removeElementFromLayer(element) {
        const layerId = element.userData?.layerId;
        if (layerId && this.layers[layerId]) {
            this.layers[layerId].elements.delete(element);
            delete element.userData.layerId;
            this.updateLayerCounts();
        }
    }

    // === CONTRÔLES DE VISIBILITÉ ===
    toggleLayerVisibility(layerId) {
        if (!this.layers[layerId]) return;

        const layer = this.layers[layerId];
        layer.visible = !layer.visible;

        // Mise à jour de l'interface
        const btn = document.querySelector(`[data-layer="${layerId}"].layer-visibility-btn`);
        if (btn) {
            btn.classList.toggle('active', layer.visible);
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = layer.visible ? 'fas fa-eye' : 'fas fa-eye-slash';
            }
        }

        // Application aux éléments
        this.applyLayerVisibility(layerId);

        // Audio feedback
        // Son supprimé

        this.updateLayerStats();
        // console.log(`👁️ Calque ${layerId} ${layer.visible ? 'affiché' : 'masqué'}`);
    }

    toggleLayerLock(layerId) {
        if (!this.layers[layerId]) return;

        const layer = this.layers[layerId];
        layer.locked = !layer.locked;

        // Mise à jour de l'interface
        const btn = document.querySelector(`[data-layer="${layerId}"].layer-lock-btn`);
        if (btn) {
            btn.classList.toggle('locked', layer.locked);
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = layer.locked ? 'fas fa-lock' : 'fas fa-unlock';
            }
        }

        // console.log(`🔒 Calque ${layerId} ${layer.locked ? 'verrouillé' : 'déverrouillé'}`);
    }

    toggleAllLayers(visible) {
        Object.keys(this.layers).forEach(layerId => {
            this.layers[layerId].visible = visible;
            this.applyLayerVisibility(layerId);

            // Mise à jour de l'interface
            const btn = document.querySelector(`[data-layer="${layerId}"].layer-visibility-btn`);
            if (btn) {
                btn.classList.toggle('active', visible);
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.className = visible ? 'fas fa-eye' : 'fas fa-eye-slash';
                }
            }
        });

        this.updateLayerStats();
        // console.log(`👁️ Tous les calques ${visible ? 'affichés' : 'masqués'}`);
    }

    isolateSelectedLayer() {
        if (!this.selectedLayer) {
            console.warn('⚠️ Aucun calque sélectionné pour isolation');
            return;
        }

        // Masquer tous les autres calques
        Object.keys(this.layers).forEach(layerId => {
            const visible = layerId === this.selectedLayer;
            this.layers[layerId].visible = visible;
            this.applyLayerVisibility(layerId);

            // Mise à jour de l'interface
            const btn = document.querySelector(`[data-layer="${layerId}"].layer-visibility-btn`);
            if (btn) {
                btn.classList.toggle('active', visible);
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.className = visible ? 'fas fa-eye' : 'fas fa-eye-slash';
                }
            }
        });

        this.updateLayerStats();
        // console.log(`🎯 Calque ${this.selectedLayer} isolé`);
    }

    // === PROPRIÉTÉS DES CALQUES ===
    setLayerOpacity(layerId, opacity) {
        if (!this.layers[layerId]) return;

        this.layers[layerId].opacity = opacity;

        // Mise à jour de l'affichage de la valeur
        const layerItem = document.querySelector(`[data-layer="${layerId}"]`);
        if (layerItem) {
            const opacityValue = layerItem.querySelector('.opacity-value');
            if (opacityValue) {
                opacityValue.textContent = `${opacity}%`;
            }
        }

        // Application aux éléments
        this.applyLayerOpacity(layerId);

        console.log(`🔍 Opacité calque ${layerId}: ${opacity}%`);
    }

    setLayerColor(layerId, color) {
        if (!this.layers[layerId]) return;

        this.layers[layerId].color = color;

        // Mise à jour de l'icône du calque
        const layerItem = document.querySelector(`[data-layer="${layerId}"]`);
        if (layerItem) {
            const icon = layerItem.querySelector('.layer-icon i');
            if (icon) {
                icon.style.color = color;
            }
        }

        // Application si le forçage de couleur est activé
        if (this.layerColorOverride) {
            this.applyLayerColor(layerId);
        }

        console.log(`🎨 Couleur calque ${layerId}: ${color}`);
    }

    // === APPLICATION DES PROPRIÉTÉS ===
    applyLayerVisibility(layerId) {
        const layer = this.layers[layerId];
        if (!layer) return;

        layer.elements.forEach(element => {
            if (element && element.visible !== undefined) {
                element.visible = layer.visible;
            }
        });

        // Forcer un rendu si possible
        if (window.sceneManager && window.sceneManager.render) {
            window.sceneManager.render();
        }
    }

    applyLayerOpacity(layerId) {
        const layer = this.layers[layerId];
        if (!layer) return;

        const opacity = layer.opacity / 100;

        layer.elements.forEach(element => {
            if (element && element.material) {
                if (Array.isArray(element.material)) {
                    element.material.forEach(mat => {
                        mat.opacity = opacity;
                        mat.transparent = opacity < 1;
                    });
                } else {
                    element.material.opacity = opacity;
                    element.material.transparent = opacity < 1;
                }
            }
        });

        // Forcer un rendu
        if (window.sceneManager && window.sceneManager.render) {
            window.sceneManager.render();
        }
    }

    applyLayerColor(layerId) {
        const layer = this.layers[layerId];
        if (!layer || !this.layerColorOverride) return;

        const color = new THREE.Color(layer.color);

        layer.elements.forEach(element => {
            if (element && element.material) {
                if (Array.isArray(element.material)) {
                    element.material.forEach(mat => {
                        mat.color = color.clone();
                    });
                } else {
                    element.material.color = color.clone();
                }
            }
        });

        // Forcer un rendu
        if (window.sceneManager && window.sceneManager.render) {
            window.sceneManager.render();
        }
    }

    applyLayerProperties(element, layerId) {
        const layer = this.layers[layerId];
        if (!layer) return;

        // Visibilité
        if (element.visible !== undefined) {
            element.visible = layer.visible;
        }

        // Opacité - Vérification de sécurité pour s'assurer que material est un objet Three.js
        if (element.material && typeof element.material === 'object' && element.material.opacity !== undefined) {
            const opacity = layer.opacity / 100;
            if (Array.isArray(element.material)) {
                element.material.forEach(mat => {
                    if (mat && typeof mat === 'object' && mat.opacity !== undefined) {
                        mat.opacity = opacity;
                        mat.transparent = opacity < 1;
                    }
                });
            } else {
                element.material.opacity = opacity;
                element.material.transparent = opacity < 1;
            }
        }

        // Couleur (si forcée) - Vérification de sécurité pour s'assurer que material est un objet Three.js
        if (this.layerColorOverride && element.material && typeof element.material === 'object' && element.material.color !== undefined) {
            const color = new THREE.Color(layer.color);
            if (Array.isArray(element.material)) {
                element.material.forEach(mat => {
                    if (mat && typeof mat === 'object' && mat.color !== undefined) {
                        mat.color = color.clone();
                    }
                });
            } else {
                element.material.color = color.clone();
            }
        }
    }

    applyLayerColors() {
        if (this.layerColorOverride) {
            Object.keys(this.layers).forEach(layerId => {
                this.applyLayerColor(layerId);
            });
        }
    }

    // === SÉLECTION DE CALQUE ===
    selectLayer(layerId) {
        // Désélectionner le précédent
        if (this.selectedLayer) {
            const prevItem = document.querySelector(`[data-layer="${this.selectedLayer}"]`);
            if (prevItem) {
                prevItem.classList.remove('selected', 'expanded');
            }
        }

        // Sélectionner le nouveau
        this.selectedLayer = layerId;
        const layerItem = document.querySelector(`[data-layer="${layerId}"]`);
        if (layerItem) {
            layerItem.classList.add('selected', 'expanded');
        }

        // console.log(`📍 Calque sélectionné: ${layerId}`);
    }

    // === SCAN ET ACTUALISATION ===
    scanExistingElements() {
        // 
        
        // Scanner la scène pour trouver les éléments existants
        if (!window.sceneManager && !window.SceneManager) {
            console.warn('⚠️ SceneManager non disponible pour le scan');
            return;
        }

        const sceneManager = window.sceneManager || window.SceneManager;
        if (!sceneManager.scene) {
            // console.warn('⚠️ Scène non disponible pour le scan');
            return;
        }

        const scene = sceneManager.scene;
        const elementsFound = {
            'briques-m65': 0,
            'blocs-creux': 0,
            'joints-horizontaux': 0,
            'joints-verticaux': 0,
            'isolants': 0,
            'linteaux': 0
        };

        // 
        
        // Scanner aussi les éléments via SceneManager.elements si disponible
        if (sceneManager.elements) {
            // console.log(`🔍 Scan via SceneManager.elements (${sceneManager.elements.size} éléments)`);
            sceneManager.elements.forEach((element, elementId) => {
                if (element && element.mesh) {
                    const elementType = element.type || element.mesh.userData?.type;
                    // 
                    
                    if (elementType) {
                        const layerId = this.getLayerIdFromElementType(elementType);
                        if (layerId && this.layers[layerId]) {
                            this.addElementToLayer(element.mesh, layerId);
                            elementsFound[layerId]++;
                        }
                    }
                }
            });
        }

        // Scanner la scène Three.js
        scene.traverse(child => {
            if (child.userData && child.userData.type) {
                const elementType = child.userData.type;
                // 
                
                const layerId = this.getLayerIdFromElementType(elementType);
                if (layerId && this.layers[layerId]) {
                    this.addElementToLayer(child, layerId);
                    elementsFound[layerId]++;
                }
            }
        });

        // 
        this.updateLayerCounts();
        this.updateLayerStats();
    }

    refreshLayers() {
        // console.log('🔄 Actualisation manuelle des calques...');
        
        // Réinitialiser tous les sets d'éléments
        Object.keys(this.layers).forEach(layerId => {
            const oldCount = this.layers[layerId].elements.size;
            this.layers[layerId].elements.clear();
            // console.log(`🔄 Calque ${layerId}: ${oldCount} éléments supprimés`);
        });

        // Rescanner
        this.scanExistingElements();
        this.updateLayerStats();

        // console.log('🔄 Calques actualisés');

        // Audio feedback
        // Son supprimé
    }

    resetLayerSettings() {
        // Réinitialiser toutes les propriétés
        Object.keys(this.layers).forEach(layerId => {
            const layer = this.layers[layerId];
            layer.visible = true;
            layer.locked = false;
            layer.opacity = layerId === 'isolants' ? 80 : 100;

            // Réinitialiser les couleurs par défaut
            const defaultColors = {
                'briques-m65': '#D2691E',
                'blocs-creux': '#808080',
                'joints-horizontaux': '#9E9E9E',
                'joints-verticaux': '#9E9E9E',
                'isolants': '#FFD700',
                'linteaux': '#708090'
            };
            layer.color = defaultColors[layerId];
        });

        // Réinitialiser les options
        this.autoLayerAssignment = true;
        this.layerColorOverride = false;
        this.showLayerPreview = true;

        // Mettre à jour l'interface
        this.updateAllLayerControls();
        this.updateAdvancedControls();

        // console.log('↩️ Paramètres des calques réinitialisés');

        // Audio feedback
        // Son supprimé
    }

    // === MISE À JOUR DE L'INTERFACE ===
    updateLayerCounts() {
        Object.keys(this.layers).forEach(layerId => {
            const count = this.layers[layerId].elements.size;
            const countElement = document.getElementById(`${layerId}-count`);
            if (countElement) {
                countElement.textContent = count;
            }
            
            // Masquer/afficher le calque selon s'il contient des éléments
            const layerItem = document.querySelector(`.layer-item[data-layer="${layerId}"]`);
            if (layerItem) {
                if (count === 0) {
                    layerItem.style.display = 'none'; // Masquer si vide
                } else {
                    layerItem.style.display = 'block'; // Afficher si rempli
                }
            }
        });
    }

    updateLayerStats() {
        const activeLayersCount = Object.values(this.layers).filter(layer => layer.visible).length;
        const visibleElementsCount = Object.values(this.layers)
            .filter(layer => layer.visible)
            .reduce((total, layer) => total + layer.elements.size, 0);

        const activeCountElement = document.getElementById('activeLayersCount');
        const visibleCountElement = document.getElementById('visibleElementsCount');

        if (activeCountElement) {
            activeCountElement.textContent = activeLayersCount;
        }
        if (visibleCountElement) {
            visibleCountElement.textContent = visibleElementsCount;
        }
    }

    updateAllLayerControls() {
        Object.keys(this.layers).forEach(layerId => {
            const layer = this.layers[layerId];

            // Bouton visibilité
            const visBtn = document.querySelector(`[data-layer="${layerId}"].layer-visibility-btn`);
            if (visBtn) {
                visBtn.classList.toggle('active', layer.visible);
                const icon = visBtn.querySelector('i');
                if (icon) {
                    icon.className = layer.visible ? 'fas fa-eye' : 'fas fa-eye-slash';
                }
            }

            // Bouton verrouillage
            const lockBtn = document.querySelector(`[data-layer="${layerId}"].layer-lock-btn`);
            if (lockBtn) {
                lockBtn.classList.toggle('locked', layer.locked);
                const icon = lockBtn.querySelector('i');
                if (icon) {
                    icon.className = layer.locked ? 'fas fa-lock' : 'fas fa-unlock';
                }
            }

            // Slider opacité
            const opacitySlider = document.querySelector(`[data-layer="${layerId}"].layer-opacity`);
            if (opacitySlider) {
                opacitySlider.value = layer.opacity;
            }

            // Affichage valeur opacité
            const layerItem = document.querySelector(`[data-layer="${layerId}"]`);
            if (layerItem) {
                const opacityValue = layerItem.querySelector('.opacity-value');
                if (opacityValue) {
                    opacityValue.textContent = `${layer.opacity}%`;
                }
            }

            // Couleur
            const colorInput = document.querySelector(`[data-layer="${layerId}"].layer-color`);
            if (colorInput) {
                colorInput.value = layer.color;
            }

            // Icône couleur
            const icon = document.querySelector(`[data-layer="${layerId}"] .layer-icon i`);
            if (icon) {
                icon.style.color = layer.color;
            }
        });
    }

    updateAdvancedControls() {
        const autoAssignCheckbox = document.getElementById('autoLayerAssignment');
        const colorOverrideCheckbox = document.getElementById('layerColorOverride');
        const previewCheckbox = document.getElementById('showLayerPreview');

        if (autoAssignCheckbox) {
            autoAssignCheckbox.checked = this.autoLayerAssignment;
        }
        if (colorOverrideCheckbox) {
            colorOverrideCheckbox.checked = this.layerColorOverride;
        }
        if (previewCheckbox) {
            previewCheckbox.checked = this.showLayerPreview;
        }
    }

    // === API PUBLIQUE ===
    getLayer(layerId) {
        return this.layers[layerId];
    }

    isLayerVisible(layerId) {
        return this.layers[layerId]?.visible || false;
    }

    isLayerLocked(layerId) {
        return this.layers[layerId]?.locked || false;
    }

    getVisibleLayers() {
        return Object.entries(this.layers)
            .filter(([_, layer]) => layer.visible)
            .map(([id, _]) => id);
    }

    // Méthode appelée lors de l'ajout d'un nouvel élément
    onElementAdded(element, elementType) {
        // console.log('🎨 onElementAdded appelée:', { element, elementType });
        if (this.autoLayerAssignment) {
            this.assignElementToLayer(element, elementType);
        }
    }

    // Méthode appelée lors de la suppression d'un élément
    onElementRemoved(element) {
        this.removeElementFromLayer(element);
    }
}

// Instance globale
window.LayerManager = null;

// Initialisation automatique quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que les autres managers soient initialisés
    setTimeout(() => {
        if (!window.LayerManager) {
            // console.log('🎨 Initialisation du LayerManager...');
            window.LayerManager = new LayerManager();
            // console.log('🎨 LayerManager disponible globalement');
            
            // Scanner les éléments existants après un délai supplémentaire
            setTimeout(() => {
                if (window.LayerManager) {
                    // 
                    window.LayerManager.scanExistingElements();
                    
                    // Rendre disponible une fonction de debug globale
                    window.debugLayers = () => {
                        
                        console.log('LayerManager:', window.LayerManager);
                        console.log('Layers:', window.LayerManager.layers);
                        console.log('SceneManager:', window.SceneManager || window.sceneManager);
                        if (window.SceneManager) {
                            console.log('Elements in scene:', window.SceneManager.elements);
                        }
                        window.LayerManager.refreshLayers();
                    };
                    
                    // 
                }
            }, 2000);
        }
    }, 1000);
});
