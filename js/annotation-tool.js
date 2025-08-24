/**
 * Outil d'annotation pour WallSim3D
 * Permet de créer des annotations textuelles sur la construction
 */
class AnnotationTool {
    constructor() {
        this.isActive = false;
        this.annotations = [];
        this.annotationGroup = null;
        this.annotationId = 0;
        this.currentEditingAnnotation = null;
        this.editDialog = null;
        
        this.init();
    }

    init() {
        // console.log('📝 Initialisation de l\'outil d\'annotation...');
        this.waitForSceneManager();
    }

    waitForSceneManager() {
        if (window.SceneManager && window.SceneManager.scene) {
            this.createAnnotationGroup();
            this.createEditDialog();
            this.setupEventListeners();
            this.setupKeyboardShortcuts();
            // console.log('✅ AnnotationTool initialisé avec SceneManager');
        } else {
            setTimeout(() => this.waitForSceneManager(), 100);
        }
    }

    createAnnotationGroup() {
        if (!window.SceneManager || !window.SceneManager.scene) {
            console.warn('❌ SceneManager non disponible pour l\'outil d\'annotation');
            setTimeout(() => this.createAnnotationGroup(), 100);
            return;
        }

        this.annotationGroup = new THREE.Group();
        this.annotationGroup.name = 'AnnotationGroup';
        window.SceneManager.scene.add(this.annotationGroup);
        // console.log('✅ Groupe d\'annotations créé');
    }

    createEditDialog() {
        // Créer la boîte de dialogue pour éditer les annotations
        this.editDialog = document.createElement('div');
        this.editDialog.className = 'annotation-edit-dialog';
        this.editDialog.innerHTML = `
            <div class="annotation-dialog-content">
                <div class="annotation-dialog-header">
                    <h3>📝 Éditer l'annotation</h3>
                    <button class="annotation-close-btn">&times;</button>
                </div>
                <div class="annotation-dialog-body">
                    <div class="annotation-form-group">
                        <label for="annotationText">Texte:</label>
                        <textarea id="annotationText" rows="3" placeholder="Entrez votre annotation..."></textarea>
                    </div>
                    <div class="annotation-form-group">
                        <label for="annotationType">Type:</label>
                        <select id="annotationType">
                            <option value="note">📝 Note</option>
                            <option value="warning">⚠️ Attention</option>
                            <option value="info">ℹ️ Information</option>
                            <option value="dimension">📏 Dimension</option>
                            <option value="material">🧱 Matériau</option>
                            <option value="instruction">📋 Instruction</option>
                        </select>
                    </div>
                    <div class="annotation-form-group">
                        <label for="annotationSize">Taille:</label>
                        <select id="annotationSize">
                            <option value="small">Petite</option>
                            <option value="medium" selected>Moyenne</option>
                            <option value="large">Grande</option>
                        </select>
                    </div>
                </div>
                <div class="annotation-dialog-footer">
                    <button class="annotation-btn annotation-btn-cancel">Annuler</button>
                    <button class="annotation-btn annotation-btn-delete">Supprimer</button>
                    <button class="annotation-btn annotation-btn-save">Confirmer</button>
                </div>
            </div>
        `;
        
        this.editDialog.style.display = 'none';
        document.body.appendChild(this.editDialog);
        
        this.setupDialogEventListeners();
    }

    setupDialogEventListeners() {
        const closeBtn = this.editDialog.querySelector('.annotation-close-btn');
        const cancelBtn = this.editDialog.querySelector('.annotation-btn-cancel');
        const deleteBtn = this.editDialog.querySelector('.annotation-btn-delete');
        const saveBtn = this.editDialog.querySelector('.annotation-btn-save');
        
        closeBtn.addEventListener('click', () => this.closeEditDialog());
        cancelBtn.addEventListener('click', () => this.closeEditDialog());
        deleteBtn.addEventListener('click', () => this.deleteCurrentAnnotation());
        saveBtn.addEventListener('click', () => this.saveCurrentAnnotation());
        
        // Fermer en cliquant à l'extérieur
        this.editDialog.addEventListener('click', (event) => {
            if (event.target === this.editDialog) {
                this.closeEditDialog();
            }
        });
        
        // Raccourcis clavier dans le dialogue
        this.editDialog.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeEditDialog();
            } else if (event.key === 'Enter' && event.ctrlKey) {
                this.saveCurrentAnnotation();
            }
        });
    }

    activate() {
        // console.log('📝 Activation de l\'outil d\'annotation');
        this.isActive = true;
        this.showAnnotations();
        
        // Changer le curseur
        if (window.SceneManager && window.SceneManager.renderer && window.SceneManager.renderer.domElement) {
            window.SceneManager.renderer.domElement.style.cursor = 'text';
        }
        
        // Désactiver la brique fantôme et les suggestions de placement
        this.disableGhostElement();
        
        // Afficher le message d'instruction
        this.showInstructions();
        
        // Désactiver les autres outils
        this.deactivateOtherTools();
    }

    deactivate() {
        // console.log('📝 Désactivation de l\'outil d\'annotation');
        this.isActive = false;
        this.closeEditDialog();
        
        // Restaurer le curseur
        if (window.SceneManager && window.SceneManager.renderer && window.SceneManager.renderer.domElement) {
            window.SceneManager.renderer.domElement.style.cursor = 'default';
        }
        
        // Réactiver la brique fantôme si nécessaire
        this.restoreGhostElement();
        
        // Masquer les instructions
        this.hideInstructions();
    }

    setupEventListeners() {
        if (!window.SceneManager || !window.SceneManager.renderer) {
            setTimeout(() => this.setupEventListeners(), 100);
            return;
        }

        const canvas = window.SceneManager.renderer.domElement;
        
        // Événements de clic pour créer/éditer les annotations
        canvas.addEventListener('click', (event) => {
            if (!this.isActive) return;
            
            event.preventDefault();
            event.stopPropagation();
            
            this.handleCanvasClick(event);
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Raccourci pour activer/désactiver l'outil (A)
            if (event.key === 'a' || event.key === 'A') {
                if (!event.ctrlKey && !event.altKey && !event.shiftKey) {
                    event.preventDefault();
                    this.toggle();
                }
            }
            
            // Supprimer toutes les annotations (Shift+Delete)
            if (event.key === 'Delete' && event.shiftKey && this.isActive) {
                event.preventDefault();
                this.clearAllAnnotations();
            }
        });
    }

    handleCanvasClick(event) {
        const point = this.getClickPoint(event);
        if (!point) return;

        // Vérifier si on clique sur une annotation existante
        const clickedAnnotation = this.getAnnotationAtPoint(event);
        
        if (clickedAnnotation) {
            // Éditer l'annotation existante
            this.editAnnotation(clickedAnnotation);
        } else {
            // Créer une nouvelle annotation
            this.createAnnotation(point);
        }
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

        // Intersection avec le plan du sol (y = 0)
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersection = new THREE.Vector3();
        
        if (raycaster.ray.intersectPlane(plane, intersection)) {
            return intersection;
        }

        return null;
    }

    getAnnotationAtPoint(event) {
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

        // Chercher les intersections avec les annotations
        const annotationObjects = [];
        this.annotations.forEach(annotation => {
            if (annotation.sprite) {
                annotationObjects.push(annotation.sprite);
            }
        });

        const intersects = raycaster.intersectObjects(annotationObjects);
        
        if (intersects.length > 0) {
            const sprite = intersects[0].object;
            return this.annotations.find(annotation => annotation.sprite === sprite);
        }

        return null;
    }

    createAnnotation(position, text = '', type = 'note', size = 'medium') {
        const annotationId = this.annotationId++;
        
        // Créer l'annotation avec un texte par défaut si vide
        const annotation = {
            id: annotationId,
            position: position.clone(),
            text: text || 'Nouvelle annotation',
            type: type,
            size: size,
            created: new Date(),
            modified: new Date()
        };
        
        // Créer l'objet 3D
        this.createAnnotationObject(annotation);
        
        // Ajouter à la liste
        this.annotations.push(annotation);
        
        // console.log(`📝 Annotation créée: ${annotation.id}`);
        
        // Ouvrir immédiatement pour édition si c'est une nouvelle annotation
        if (!text) {
            setTimeout(() => this.editAnnotation(annotation), 100);
        }
        
        return annotation;
    }

    createAnnotationObject(annotation) {
        const { text, type, size, position } = annotation;
        
        // Obtenir les paramètres de style selon le type
        const style = this.getAnnotationStyle(type, size);
        
        // Créer un canvas temporaire pour mesurer le texte
        const tempCanvas = document.createElement('canvas');
        const tempContext = tempCanvas.getContext('2d');
        tempContext.font = style.font;
        
        // Calculer la taille optimale du canvas en fonction du texte
        const iconWidth = size === 'large' ? 80 : (size === 'medium' ? 70 : 60); // Espace pour l'icône à gauche
        const horizontalPadding = size === 'large' ? 60 : (size === 'medium' ? 50 : 40); // Marges gauche/droite
        const verticalPadding = size === 'large' ? 30 : (size === 'medium' ? 25 : 20); // Marges haut/bas
        const minWidth = size === 'large' ? 300 : (size === 'medium' ? 250 : 200); // Largeur minimale
        const maxWidth = size === 'large' ? style.canvasSize * 4 : style.canvasSize * 2.5; // Limite maximale étendue
        
        // Mesurer le texte et déterminer les lignes avec la largeur disponible
        const availableTextWidth = maxWidth - iconWidth - horizontalPadding;
        const lines = this.wrapText(tempContext, text, availableTextWidth);
        
        // Calculer la largeur réelle nécessaire pour le texte
        const maxLineWidth = Math.max(...lines.map(line => tempContext.measureText(line).width));
        
        // Calculer les dimensions finales du canvas
        const finalWidth = Math.max(minWidth, Math.min(maxWidth, maxLineWidth + iconWidth + horizontalPadding));
        const finalHeight = Math.max(style.lineHeight + verticalPadding, lines.length * style.lineHeight + verticalPadding);
        
        // Créer le canvas final avec les bonnes dimensions
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        
        // Configurer le style du texte (important de refaire après redimensionnement)
        context.font = style.font;
        context.textAlign = 'left'; // Changé en left pour un meilleur contrôle
        context.textBaseline = 'middle';
        
        // Fond avec couleur selon le type
        context.fillStyle = style.backgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Bordure
        context.strokeStyle = style.borderColor;
        context.lineWidth = 2;
        context.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
        
        // Icône du type (positionnée à gauche avec marge)
        context.fillStyle = style.iconColor;
        context.font = style.iconFont;
        context.textAlign = 'center';
        const iconCenterX = iconWidth / 2;
        context.fillText(style.icon, iconCenterX, canvas.height / 2);
        
        // Texte principal (positionné après l'icône)
        context.fillStyle = style.textColor;
        context.font = style.font;
        context.textAlign = 'left';
        
        // Dessiner les lignes de texte avec un meilleur positionnement
        const textStartX = iconWidth + (size === 'large' ? 15 : 10); // Position X du début du texte
        const totalTextHeight = lines.length * style.lineHeight;
        const startY = (canvas.height - totalTextHeight) / 2 + style.lineHeight / 2;
        
        lines.forEach((line, index) => {
            context.fillText(line, textStartX, startY + index * style.lineHeight);
        });
        
        // Créer la texture et le sprite
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        
        sprite.position.copy(position);
        sprite.position.y += style.height; // Élever au-dessus du sol
        
        // Ajuster l'échelle du sprite selon les dimensions réelles du canvas
        const aspectRatio = canvas.width / canvas.height;
        const baseScale = style.scale;
        sprite.scale.set(baseScale * aspectRatio, baseScale, 1);
        
        // Ajouter les métadonnées pour la sélection
        sprite.userData.annotationId = annotation.id;
        sprite.userData.annotationType = annotation.type;
        sprite.userData.toolType = 'annotation';
        sprite.name = `annotation-${annotation.id}`;
        
        // Stocker les références
        annotation.canvas = canvas;
        annotation.texture = texture;
        annotation.material = material;
        annotation.sprite = sprite;
        
        // Ajouter à la scène
        this.annotationGroup.add(sprite);
        
        // Assigner au calque annotations si le LayerManager est disponible
        if (window.LayerManager) {
            window.LayerManager.assignElementToLayer(sprite, 'annotation');
        }
        
        return sprite;
    }

    getAnnotationStyle(type, size) {
        const sizes = {
            small: { 
                canvasSize: 400, 
                scale: 8, 
                font: '32px Arial', 
                iconFont: '36px Arial', 
                lineHeight: 40, 
                height: 4 
            },
            medium: { 
                canvasSize: 600, 
                scale: 10, 
                font: '48px Arial', 
                iconFont: '52px Arial', 
                lineHeight: 56, 
                height: 6 
            },
            large: { 
                canvasSize: 800, 
                scale: 12, 
                font: '64px Arial', 
                iconFont: '68px Arial', 
                lineHeight: 72, 
                height: 8 
            }
        };
        
        const types = {
            note: { 
                icon: '📝', 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                borderColor: '#007acc', 
                textColor: '#333', 
                iconColor: '#007acc' 
            },
            warning: { 
                icon: '⚠️', 
                backgroundColor: 'rgba(255, 249, 196, 0.95)', 
                borderColor: '#ff9800', 
                textColor: '#333', 
                iconColor: '#ff9800' 
            },
            important: { 
                icon: '❗', 
                backgroundColor: 'rgba(255, 235, 238, 0.95)', 
                borderColor: '#e91e63', 
                textColor: '#333', 
                iconColor: '#e91e63' 
            },
            info: { 
                icon: 'ℹ️', 
                backgroundColor: 'rgba(227, 242, 253, 0.95)', 
                borderColor: '#2196f3', 
                textColor: '#333', 
                iconColor: '#2196f3' 
            },
            dimension: { 
                icon: '📏', 
                backgroundColor: 'rgba(232, 245, 233, 0.95)', 
                borderColor: '#4caf50', 
                textColor: '#333', 
                iconColor: '#4caf50' 
            },
            material: { 
                icon: '🧱', 
                backgroundColor: 'rgba(251, 233, 231, 0.95)', 
                borderColor: '#f44336', 
                textColor: '#333', 
                iconColor: '#f44336' 
            },
            instruction: { 
                icon: '📋', 
                backgroundColor: 'rgba(243, 229, 245, 0.95)', 
                borderColor: '#9c27b0', 
                textColor: '#333', 
                iconColor: '#9c27b0' 
            }
        };
        
        return { ...sizes[size], ...types[type] };
    }

    wrapText(context, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        
        if (words.length === 0) return [''];
        
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine + ' ' + word;
            const width = context.measureText(testLine).width;
            
            if (width < maxWidth) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        
        // Si une seule ligne est trop longue, la diviser caractère par caractère
        return lines.map(line => {
            if (context.measureText(line).width > maxWidth) {
                const chars = line.split('');
                const wrappedLines = [];
                let currentCharLine = '';
                
                for (const char of chars) {
                    const testCharLine = currentCharLine + char;
                    if (context.measureText(testCharLine).width > maxWidth && currentCharLine.length > 0) {
                        wrappedLines.push(currentCharLine);
                        currentCharLine = char;
                    } else {
                        currentCharLine = testCharLine;
                    }
                }
                if (currentCharLine.length > 0) {
                    wrappedLines.push(currentCharLine);
                }
                return wrappedLines;
            }
            return [line];
        }).flat();
    }

    editAnnotation(annotation) {
        this.currentEditingAnnotation = annotation;
        
        // Remplir le formulaire
        const textArea = this.editDialog.querySelector('#annotationText');
        const typeSelect = this.editDialog.querySelector('#annotationType');
        const sizeSelect = this.editDialog.querySelector('#annotationSize');
        
        textArea.value = annotation.text;
        typeSelect.value = annotation.type;
        sizeSelect.value = annotation.size;
        
        // Afficher le dialogue
        this.editDialog.style.display = 'flex';
        textArea.focus();
        textArea.select();
    }

    saveCurrentAnnotation() {
        if (!this.currentEditingAnnotation) return;
        
        const textArea = this.editDialog.querySelector('#annotationText');
        const typeSelect = this.editDialog.querySelector('#annotationType');
        const sizeSelect = this.editDialog.querySelector('#annotationSize');
        
        const newText = textArea.value.trim();
        if (!newText) {
            alert('Le texte de l\'annotation ne peut pas être vide');
            return;
        }
        
        // Vérifier si c'est une nouvelle annotation (created === modified)
        const isNewAnnotation = this.currentEditingAnnotation.created.getTime() === this.currentEditingAnnotation.modified.getTime();
        
        // Mettre à jour l'annotation
        this.currentEditingAnnotation.text = newText;
        this.currentEditingAnnotation.type = typeSelect.value;
        this.currentEditingAnnotation.size = sizeSelect.value;
        this.currentEditingAnnotation.modified = new Date();
        
        // Recréer l'objet 3D
        this.annotationGroup.remove(this.currentEditingAnnotation.sprite);
        this.createAnnotationObject(this.currentEditingAnnotation);
        
        if (isNewAnnotation) {
            // console.log(`📝 Annotation créée et terminée - retour en mode construction: ${this.currentEditingAnnotation.id}`);
        } else {
            // console.log(`📝 Annotation mise à jour: ${this.currentEditingAnnotation.id}`);
        }
        
        this.closeEditDialog();
        
        // Désactiver l'outil uniquement pour les nouvelles annotations
        if (isNewAnnotation) {
            this.deactivate();
            // Forcer la réactivation du mode construction
            this.activateConstructionMode();
        }
    }

    deleteCurrentAnnotation() {
        if (!this.currentEditingAnnotation) return;
        
        if (confirm('Êtes-vous sûr de vouloir supprimer cette annotation ?')) {
            this.removeAnnotation(this.currentEditingAnnotation.id);
            this.closeEditDialog();
        }
    }

    closeEditDialog() {
        this.editDialog.style.display = 'none';
        this.currentEditingAnnotation = null;
    }

    removeAnnotation(annotationId) {
        const index = this.annotations.findIndex(a => a.id === annotationId);
        if (index === -1) return;
        
        const annotation = this.annotations[index];
        this.annotationGroup.remove(annotation.sprite);
        this.annotations.splice(index, 1);
        
        console.log(`📝 Annotation supprimée: ${annotationId}`);
    }

    clearAllAnnotations() {
        if (this.annotations.length === 0) return;
        
        if (confirm(`Êtes-vous sûr de vouloir supprimer toutes les ${this.annotations.length} annotations ?`)) {
            console.log('📝 Suppression de toutes les annotations');
            
            this.annotations.forEach(annotation => {
                this.annotationGroup.remove(annotation.sprite);
            });
            
            this.annotations = [];
            this.closeEditDialog();
        }
    }

    showAnnotations() {
        if (this.annotationGroup) {
            this.annotationGroup.visible = true;
        }
    }

    hideAnnotations() {
        if (this.annotationGroup) {
            this.annotationGroup.visible = false;
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
            window.ToolbarManager.showInstruction('Outil d\'annotation actif - Cliquez pour créer/éditer une annotation - [A] basculer, [Shift+Del] tout supprimer');
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
            window.ToolbarManager.setTool('annotation');
        }
    }

    disableGhostElement() {
        // console.log('👻 Désactivation de la brique fantôme pour l\'outil d\'annotation');
        
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
            
            // console.log('✅ Brique fantôme désactivée');
        }
    }

    restoreGhostElement() {
        // console.log('👻 Restauration de la brique fantôme après annotation');
        
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
            
            // console.log('✅ Brique fantôme restaurée');
            
            // Nettoyer les variables temporaires
            this.previousPlacementMode = undefined;
            this.previousShowGhost = undefined;
        }
    }

    // Méthodes pour la compatibilité avec le système existant
    getActiveAnnotations() {
        return this.annotations.filter(a => a.sprite.visible);
    }

    exportAnnotations() {
        return this.annotations.map(annotation => ({
            id: annotation.id,
            position: {
                x: annotation.position.x,
                y: annotation.position.y,
                z: annotation.position.z
            },
            text: annotation.text,
            type: annotation.type,
            size: annotation.size,
            created: annotation.created,
            modified: annotation.modified
        }));
    }

    importAnnotations(annotationsData) {
        this.clearAllAnnotations();
        
        annotationsData.forEach(data => {
            const position = new THREE.Vector3(data.position.x, data.position.y, data.position.z);
            this.createAnnotation(position, data.text, data.type, data.size);
        });
        
        console.log(`📝 ${annotationsData.length} annotations importées`);
    }

    // Méthode pour rechercher des annotations par texte
    searchAnnotations(searchText) {
        const searchLower = searchText.toLowerCase();
        return this.annotations.filter(annotation => 
            annotation.text.toLowerCase().includes(searchLower)
        );
    }

    // Méthode pour filtrer par type
    filterAnnotationsByType(type) {
        return this.annotations.filter(annotation => annotation.type === type);
    }

    // Méthode pour forcer l'activation du mode construction
    activateConstructionMode() {
        // console.log('🔧 Activation forcée du mode construction');
        
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
            
            // console.log('✅ Mode construction activé');
        } else {
            console.warn('⚠️ ConstructionTools non disponible');
        }
    }
    
    /**
     * Met à jour le texte d'une annotation
     */
    updateAnnotationText(annotationElement, newText) {
        console.log('📝 Mise à jour du texte d\'annotation:', newText);
        console.log('📝 Élément reçu:', annotationElement);
        
        if (!annotationElement || !annotationElement.id) {
            console.error('❌ Données d\'annotation invalides');
            return;
        }
        
        // Extraire l'ID numérique de l'identifiant (ex: 'annotation-0' -> 0)
        let annotationId = annotationElement.id;
        if (typeof annotationId === 'string' && annotationId.startsWith('annotation-')) {
            annotationId = parseInt(annotationId.split('-')[1]);
        }
        
        console.log('📝 ID d\'annotation extrait:', annotationId);
        
        // Trouver l'annotation dans la liste
        const annotation = this.annotations.find(a => a.id === annotationId);
        if (!annotation) {
            console.error('❌ Annotation non trouvée:', annotationId);
            console.log('📝 Annotations disponibles:', this.annotations.map(a => ({id: a.id, text: a.text})));
            return;
        }
        
        // Mettre à jour le texte
        annotation.text = newText;
        
        // Redessiner l'annotation avec le nouveau texte
        this.updateAnnotationSprite(annotation);
        
        console.log('✅ Texte d\'annotation mis à jour');
    }
    
    /**
     * Met à jour le sous-type d'une annotation
     */
    updateAnnotationSubType(annotationElement, newSubType) {
        console.log('📝 Mise à jour du sous-type d\'annotation:', newSubType);
        
        if (!annotationElement || !annotationElement.id) {
            console.error('❌ Données d\'annotation invalides');
            return;
        }
        
        // Extraire l'ID numérique de l'identifiant (ex: 'annotation-0' -> 0)
        let annotationId = annotationElement.id;
        if (typeof annotationId === 'string' && annotationId.startsWith('annotation-')) {
            annotationId = parseInt(annotationId.split('-')[1]);
        }
        
        // Trouver l'annotation dans la liste
        const annotation = this.annotations.find(a => a.id === annotationId);
        if (!annotation) {
            console.error('❌ Annotation non trouvée:', annotationId);
            return;
        }
        
        // Mettre à jour le type (pas subType !)
        annotation.type = newSubType;
        
        // Redessiner l'annotation avec le nouveau style
        this.updateAnnotationSprite(annotation);
        
        console.log('✅ Sous-type d\'annotation mis à jour');
    }
    
    /**
     * Met à jour la taille d'une annotation
     */
    updateAnnotationSize(annotationElement, newSize) {
        console.log('📝 Mise à jour de la taille d\'annotation:', newSize);
        
        if (!annotationElement || !annotationElement.id) {
            console.error('❌ Données d\'annotation invalides');
            return;
        }
        
        // Extraire l'ID numérique de l'identifiant (ex: 'annotation-0' -> 0)
        let annotationId = annotationElement.id;
        if (typeof annotationId === 'string' && annotationId.startsWith('annotation-')) {
            annotationId = parseInt(annotationId.split('-')[1]);
        }
        
        // Trouver l'annotation dans la liste
        const annotation = this.annotations.find(a => a.id === annotationId);
        if (!annotation) {
            console.error('❌ Annotation non trouvée:', annotationId);
            return;
        }
        
        // Mettre à jour la taille
        annotation.size = newSize;
        
        // Redessiner l'annotation avec la nouvelle taille
        this.updateAnnotationSprite(annotation);
        
        console.log('✅ Taille d\'annotation mise à jour');
    }
    
    /**
     * Met à jour le sprite visuel d'une annotation
     */
    updateAnnotationSprite(annotation) {
        if (!annotation.sprite) {
            console.error('❌ Sprite d\'annotation non trouvé');
            return;
        }
        
        console.log('🔄 Mise à jour sprite - Ancien type:', annotation.sprite.userData?.subType || 'undefined', '-> Nouveau type:', annotation.type);
        
        // Supprimer l'ancien sprite du groupe
        this.annotationGroup.remove(annotation.sprite);
        
        // Nettoyer les anciennes ressources
        if (annotation.sprite.material && annotation.sprite.material.map) {
            annotation.sprite.material.map.dispose();
        }
        if (annotation.sprite.material) {
            annotation.sprite.material.dispose();
        }
        
        // Créer un nouveau sprite avec les nouvelles propriétés
        const newSprite = this.createAnnotationObject(annotation);
        
        // Mettre à jour la référence du sprite dans l'annotation
        annotation.sprite = newSprite;
        
        // Conserver les propriétés Three.js importantes
        if (annotation.id !== undefined) {
            newSprite.userData = { 
                ...newSprite.userData,
                id: `annotation-${annotation.id}`,
                annotationId: annotation.id,
                type: 'annotation',
                toolType: 'annotation',
                subType: annotation.type
            };
            newSprite.name = `annotation-${annotation.id}`;
        }
        
        // Forcer le rendu
        if (window.SceneManager && window.SceneManager.renderer) {
            window.SceneManager.renderer.render(window.SceneManager.scene, window.SceneManager.camera);
        }
        
        console.log('✅ Sprite d\'annotation mis à jour avec nouvelle référence - Nouveau type:', annotation.type);
    }
}

// Initialisation globale
window.AnnotationTool = null;

// Fonction d'initialisation retardée
function initAnnotationTool() {
    if (!window.AnnotationTool && window.THREE) {
        window.AnnotationTool = new AnnotationTool();
        // console.log('✅ AnnotationTool créé');
    }
}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    // Attendre un peu que l'application se charge
    setTimeout(initAnnotationTool, 500);
});

// Initialisation de secours
window.addEventListener('load', () => {
    setTimeout(() => {
        if (!window.AnnotationTool) {
            initAnnotationTool();
            if (window.DEBUG_APP) {
                console.log('✅ AnnotationTool initialisé (secours)');
            }
        }
    }, 1000);
});
