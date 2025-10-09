/*
 * Outil Cordeau (ficelle) — permet de tracer une ligne épaisse jaune entre deux points
 */
class CordeauTool {
    constructor() {
        this.isActive = false;
        this.step = 0; // 0: prêt, 1: premier point placé
        this.startPoint = null;
        this.tempLine = null;
        this.group = null;

        // Snap / accroche aux extrémités des éléments, comme pour les linteaux
        this.snapEnabled = true;
    this.snapThresholdCm = 12; // rayon d'accroche (cm) pour distance point->point
    this.snapRayThreshold = 10; // rayon d'accroche (unités scène) pour distance perpendiculaire au rayon
        this.prevConstructionMode = null; // pour restaurer le mode après usage

        this.init();
    }

    init() {
        this.waitForSceneManager();
        this.setupKeyboardShortcuts();
    }

    waitForSceneManager() {
        if (window.SceneManager && window.SceneManager.scene) {
            this.createGroup();
            this.setupEventListeners();
        } else {
            setTimeout(() => this.waitForSceneManager(), 100);
        }
    }

    createGroup() {
        if (!window.SceneManager || !window.SceneManager.scene) return;
        if (this.group) return;
        this.group = new THREE.Group();
        this.group.name = 'CordeauGroup';
        window.SceneManager.scene.add(this.group);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Eviter les raccourcis si l'utilisateur tape du texte
            const target = event.target || document.activeElement;
            const tag = (target && target.tagName) ? target.tagName.toLowerCase() : '';
            const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || (target && target.isContentEditable);

            if (isTyping) return;

            // Touche C pour activer/désactiver le cordeau
            if ((event.key === 'c' || event.key === 'C') && !event.ctrlKey && !event.altKey && !event.shiftKey) {
                event.preventDefault();
                this.toggle();
            }

            // Echap pour annuler en cours
            if (event.key === 'Escape' && this.isActive) {
                this.cancel();
            }
        });
    }

    setupEventListeners() {
        if (!window.SceneManager || !window.SceneManager.renderer) {
            setTimeout(() => this.setupEventListeners(), 100);
            return;
        }
        const canvas = window.SceneManager.renderer.domElement;

        // Clic pour placer les points
        canvas.addEventListener('click', (event) => {
            if (!this.isActive) return;
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            this.handleCanvasClick(event);
        }, true);

        // Aperçu pendant le déplacement
        canvas.addEventListener('mousemove', (event) => {
            if (!this.isActive) return;
            // Pas de propagation aux autres outils
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            this.handleMouseMove(event);
        }, true);
    }

    toggle() {
        if (this.isActive) {
            this.deactivate();
        } else {
            this.activate();
        }
    }

    activate() {
        this.isActive = true;
        this.step = 0;
        this.startPoint = null;
        this.cleanupTemp();
        if (window.SceneManager && window.SceneManager.renderer) {
            window.SceneManager.renderer.domElement.style.cursor = 'crosshair';
        }
        // Désactiver le fantôme de construction pendant l'utilisation
        if (window.ConstructionTools && window.ConstructionTools.ghostElement) {
            window.ConstructionTools.ghostElement.mesh.visible = false;
        }

        // Activer les points d'accroche d'extrémité via ConstructionTools
        if (window.ConstructionTools) {
            try {
                // Mémoriser le mode courant pour le restaurer à la fin
                this.prevConstructionMode = window.ConstructionTools.currentMode || null;
                // S'assurer que le mode 'cordeau' est éligible aux edge snaps
                if (window.ConstructionTools.edgeSnapEnabledForModes && window.ConstructionTools.edgeSnapEnabledForModes.add) {
                    window.ConstructionTools.edgeSnapEnabledForModes.add('cordeau');
                }
                // Basculer dans un mode neutre 'cordeau' pour que les listeners reconstruisent les points
                window.ConstructionTools.currentMode = 'cordeau';
                // Forcer l'affichage des points d'aide (marqueurs d'accroche)
                window.ConstructionTools.showEdgeSnap = true;
                if (typeof window.ConstructionTools.createEdgeSnapPoints === 'function') {
                    window.ConstructionTools.createEdgeSnapPoints();
                }
                // S'assurer que le groupe est bien dans la scène
                if (window.ConstructionTools.edgeSnapGroup && window.SceneManager && window.SceneManager.scene) {
                    if (!window.ConstructionTools.edgeSnapGroup.parent) {
                        window.SceneManager.scene.add(window.ConstructionTools.edgeSnapGroup);
                    }
                }
                // Petite relance asynchrone au cas où la scène ou les éléments tardent
                setTimeout(() => {
                    if (typeof window.ConstructionTools.createEdgeSnapPoints === 'function') {
                        window.ConstructionTools.createEdgeSnapPoints();
                    }
                }, 50);
            } catch(_) {}
        }
        console.log('🧵 Outil Cordeau activé — cliquez le premier point, puis le second.');
    }

    deactivate() {
        this.isActive = false;
        this.step = 0;
        this.startPoint = null;
        this.cleanupTemp();
        if (window.SceneManager && window.SceneManager.renderer) {
            window.SceneManager.renderer.domElement.style.cursor = 'default';
        }
        // Réactiver le fantôme si besoin
        if (window.ConstructionTools && window.ConstructionTools.ghostElement) {
            window.ConstructionTools.ghostElement.mesh.visible = true;
        }
        // Masquer et nettoyer tous les indicateurs d'accroche
        if (window.ConstructionTools) {
            try {
                window.ConstructionTools.showEdgeSnap = false;
                if (typeof window.ConstructionTools.clearEdgeSnapPoints === 'function') {
                    window.ConstructionTools.clearEdgeSnapPoints();
                }
                if (window.ConstructionTools.edgeCursorSnapPoint) {
                    window.ConstructionTools.edgeCursorSnapPoint.visible = false;
                }
                if (window.ConstructionTools.edgeSnapGroup) {
                    window.ConstructionTools.edgeSnapGroup.visible = false;
                }
            } catch(_) {}
        }
        // Restaurer le mode précédent et nettoyer/mettre à jour les points d'accroche
        if (window.ConstructionTools) {
            try {
                const prev = this.prevConstructionMode;
                this.prevConstructionMode = null;
                if (prev) {
                    window.ConstructionTools.currentMode = prev;
                    if (window.ConstructionTools.edgeSnapEnabledForModes && !window.ConstructionTools.edgeSnapEnabledForModes.has(prev)) {
                        // Si le mode précédent n'utilise pas d'accroche, on peut nettoyer
                        if (typeof window.ConstructionTools.clearEdgeSnapPoints === 'function') {
                            window.ConstructionTools.clearEdgeSnapPoints();
                        }
                    } else if (typeof window.ConstructionTools.createEdgeSnapPoints === 'function') {
                        // Sinon, reconstruire pour le mode précédent
                        window.ConstructionTools.createEdgeSnapPoints();
                    }
                }
            } catch(_) {}
        }
        console.log('🧵 Outil Cordeau désactivé');
    }

    cancel() {
        this.step = 0;
        this.startPoint = null;
        this.cleanupTemp();
        console.log('🧵 Cordeau annulé');
    }

    handleCanvasClick(event) {
        const point = this.getMousePosition(event);
        if (!point) return;

        if (this.step === 0) {
            // Premier point
            this.startPoint = point.clone();
            this.step = 1;
            this.createTempLine(this.startPoint, this.startPoint);
        } else if (this.step === 1) {
            // Second point → création du cordeau
            const endPoint = point.clone();
            this.createCordeau(this.startPoint, endPoint);
            this.step = 0;
            this.startPoint = null;
            this.cleanupTemp();
            // Cacher immédiatement les marqueurs d'aide (points/segments d'accroche)
            if (window.ConstructionTools) {
                try {
                    window.ConstructionTools.showEdgeSnap = false;
                    if (typeof window.ConstructionTools.clearEdgeSnapPoints === 'function') {
                        window.ConstructionTools.clearEdgeSnapPoints();
                    }
                    if (window.ConstructionTools.edgeCursorSnapPoint) {
                        window.ConstructionTools.edgeCursorSnapPoint.visible = false;
                    }
                    if (window.ConstructionTools.edgeSnapGroup) {
                        window.ConstructionTools.edgeSnapGroup.visible = false;
                    }
                    if (window.ConstructionTools.edgeSnapEnabledForModes && window.ConstructionTools.edgeSnapEnabledForModes.delete) {
                        window.ConstructionTools.edgeSnapEnabledForModes.delete('cordeau');
                    }
                } catch(_) {}
            }
            // Sortir de l'outil et revenir au mode pose de brique
            this.deactivate();
            if (window.ConstructionTools) {
                if (typeof window.ConstructionTools.setMode === 'function') {
                    window.ConstructionTools.setMode('brick');
                } else {
                    window.ConstructionTools.currentMode = 'brick';
                }
            }
            // Désélectionner l'item "Cordeau" dans la bibliothèque
            if (window.TabManager && typeof window.TabManager.clearLibrarySelection === 'function') {
                window.TabManager.clearLibrarySelection();
            }
        }
    }

    handleMouseMove(event) {
        if (this.step !== 1) return;
        const point = this.getMousePosition(event);
        if (!point) return;
        this.updateTempLine(this.startPoint, point);
    }

    // Récupération d'un point de clic sur un plan contraint (logique similaire à MeasurementTool)
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

        const plane = this.getConstraintPlane();
        const intersection = new THREE.Vector3();
        let candidate = null;
        if (raycaster.ray.intersectPlane(plane, intersection)) {
            candidate = intersection.clone();
        }

        if (!candidate) return null;

        // Accrochage aux arêtes (NEAREST) puis aux points (coins)
        if (this.snapEnabled && window.ConstructionTools) {
            // 1) NEAREST sur arêtes
            if (typeof window.ConstructionTools.findNearestEdgePointOnRay === 'function' && Array.isArray(window.ConstructionTools.edgeSnapSegments) && window.ConstructionTools.edgeSnapSegments.length > 0) {
                const nearestOnEdge = window.ConstructionTools.findNearestEdgePointOnRay(raycaster);
                if (nearestOnEdge) {
                    if (typeof window.ConstructionTools._updateEdgeCursorSnapVisual === 'function') {
                        window.ConstructionTools._updateEdgeCursorSnapVisual(nearestOnEdge);
                    }
                    return new THREE.Vector3(nearestOnEdge.x, nearestOnEdge.y, nearestOnEdge.z);
                }
            }

            // 2) Coins (distance perpendiculaire au rayon)
            const hasCorners = Array.isArray(window.ConstructionTools.edgeSnapPoints) && window.ConstructionTools.edgeSnapPoints.length > 0;
            const nearestRay = hasCorners ? this._findNearestEdgePointByRay(raycaster) : null;
            if (nearestRay) {
                if (typeof window.ConstructionTools._updateEdgeCursorSnapVisual === 'function') {
                    window.ConstructionTools._updateEdgeCursorSnapVisual(nearestRay);
                }
                return new THREE.Vector3(nearestRay.x, nearestRay.y, nearestRay.z);
            }

            // Sinon, essayer un snap simple 3D autour du point plan (utile en vues orthogonales)
            const nearest = hasCorners ? this._findNearestEdgePoint(candidate) : null;
            if (nearest) {
                if (typeof window.ConstructionTools._updateEdgeCursorSnapVisual === 'function') {
                    window.ConstructionTools._updateEdgeCursorSnapVisual(nearest);
                }
                return new THREE.Vector3(nearest.x, nearest.y, nearest.z);
            }

            if (window.ConstructionTools.edgeCursorSnapPoint) {
                window.ConstructionTools.edgeCursorSnapPoint.visible = false;
            }
        }

        return candidate;
    }

    getConstraintPlane() {
        const scope = (window.SceneManager && window.SceneManager.currentViewScope) ? window.SceneManager.currentViewScope : '3d';
        const target = (window.SceneManager && window.SceneManager.controls && window.SceneManager.controls.target) ? window.SceneManager.controls.target : { x: 0, y: 0, z: 0 };
        if (scope === 'top') {
            return new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // plan sol Y=0
        }
        if (scope === 'front' || scope === 'back') {
            return new THREE.Plane(new THREE.Vector3(0, 0, 1), -target.z); // plan XY à Z constant
        }
        if (scope === 'left' || scope === 'right') {
            return new THREE.Plane(new THREE.Vector3(1, 0, 0), -target.x); // plan ZY à X constant
        }
        return new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    }

    createTempLine(a, b) {
        this.cleanupTemp();
        const geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
        const material = new THREE.LineBasicMaterial({ color: 0xFFD11A, linewidth: 3 });
        this.tempLine = new THREE.Line(geometry, material);
        this.tempLine.userData.isCordeauTemp = true;
        this.group.add(this.tempLine);
    }

    updateTempLine(a, b) {
        if (!this.tempLine) return;
        const positions = new Float32Array([a.x, a.y, a.z, b.x, b.y, b.z]);
        this.tempLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.tempLine.geometry.computeBoundingSphere();
    }

    cleanupTemp() {
        if (this.tempLine && this.group) {
            this.group.remove(this.tempLine);
            if (this.tempLine.geometry) this.tempLine.geometry.dispose();
            if (this.tempLine.material) this.tempLine.material.dispose();
            this.tempLine = null;
        }
    }

    createCordeau(a, b) {
        // Créer un cylindre épais jaune pour simuler une ficelle
        const direction = new THREE.Vector3().subVectors(b, a);
        const length = direction.length();
        if (length < 0.001) return;

        const radius = 0.1; // épaisseur ~0.1 cm
        const radialSegments = 12;
        const geometry = new THREE.CylinderGeometry(radius, radius, length, radialSegments);
        const material = new THREE.MeshStandardMaterial({ color: 0xFFD11A, roughness: 0.8, metalness: 0.0 });
        const cylinder = new THREE.Mesh(geometry, material);
        cylinder.castShadow = true;
        cylinder.receiveShadow = false;
        cylinder.userData.type = 'cordeau';

        // Orienter le cylindre de Y vers la direction
        const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
        cylinder.position.copy(mid);

        const up = new THREE.Vector3(0, 1, 0);
        const quat = new THREE.Quaternion().setFromUnitVectors(up, direction.clone().normalize());
        cylinder.setRotationFromQuaternion(quat);

        // Enregistrer comme véritable élément de scène pour la sauvegarde .wsm
        const element = {
            id: 'cordeau_' + Math.random().toString(36).slice(2, 9),
            type: 'cordeau',
            mesh: cylinder,
            material: 'cordeau-jaune',
            position: { x: mid.x, y: mid.y, z: mid.z },
            // Conserver les extrémités pour affichage des propriétés et sérialisation
            start: { x: a.x, y: a.y, z: a.z },
            end: { x: b.x, y: b.y, z: b.z },
            dimensions: { length: length, width: radius * 2, height: radius * 2 },
            getVolume: function () { return Math.PI * radius * radius * length / 1000000; },
            getMass: function () { return 0; },
            dispose: function () {
                try {
                    if (this.mesh) {
                        if (this.mesh.geometry) this.mesh.geometry.dispose();
                        if (this.mesh.material) this.mesh.material.dispose();
                    }
                } catch (_) {}
            },
            toJSON: function () {
                return {
                    id: this.id,
                    type: 'cordeau',
                    start: { x: this.start.x, y: this.start.y, z: this.start.z },
                    end: { x: this.end.x, y: this.end.y, z: this.end.z },
                    radius: radius,
                    material: this.material
                };
            }
        };
        cylinder.userData.element = element;

        if (window.SceneManager && typeof window.SceneManager.addElement === 'function') {
            window.SceneManager.addElement(element);
        } else {
            // Fallback: si SceneManager indisponible, ajouter au groupe local pour visibilité immédiate
            this.group.add(cylinder);
        }
    }

    // Trouver le point d'extrémité le plus proche (3D) sous un seuil en cm
    _findNearestEdgePoint(candidate) {
        try {
            const points = (window.ConstructionTools && window.ConstructionTools.edgeSnapPoints) ? window.ConstructionTools.edgeSnapPoints : null;
            if (!points || points.length === 0) return null;
            let best = null;
            let bestDist = Infinity;
            for (const p of points) {
                const dx = p.x - candidate.x;
                const dy = p.y - candidate.y;
                const dz = p.z - candidate.z;
                const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
                if (d < bestDist) {
                    bestDist = d;
                    best = p;
                }
            }
            if (best && bestDist <= (this.snapThresholdCm || 12)) {
                return best;
            }
        } catch(_) {}
        return null;
    }

    // Trouver le point d'extrémité le plus proche selon la distance perpendiculaire au rayon
    _findNearestEdgePointByRay(raycaster) {
        try {
            const points = (window.ConstructionTools && window.ConstructionTools.edgeSnapPoints) ? window.ConstructionTools.edgeSnapPoints : null;
            if (!points || points.length === 0) return null;
            const O = raycaster.ray.origin;
            const D = raycaster.ray.direction.clone().normalize();
            let best = null;
            let bestScore = Infinity;
            for (const p of points) {
                const P = new THREE.Vector3(p.x, p.y, p.z);
                const OP = new THREE.Vector3().subVectors(P, O);
                const t = OP.dot(D);
                // Si le point projeté est derrière la caméra, utilise la distance au point origin
                let perpDist;
                if (t < 0) {
                    perpDist = OP.length();
                } else {
                    // Distance à la ligne: || OP x D ||
                    perpDist = new THREE.Vector3().copy(OP).cross(D).length();
                }
                // Légère préférence pour les points supérieurs
                const weight = p.isTop ? 0.85 : 1.0;
                const score = perpDist * weight;
                if (score < bestScore) {
                    bestScore = score;
                    best = p;
                }
            }
            if (best && bestScore <= (this.snapRayThreshold || 10)) {
                return best;
            }
        } catch(_) {}
        return null;
    }
}

// Exposer globalement
window.CordeauTool = null;
(function ensureCordeau() {
    if (!window.CordeauTool && window.THREE) {
        window.CordeauTool = new CordeauTool();
    } else if (!window.THREE) {
        setTimeout(ensureCordeau, 100);
    }
})();
