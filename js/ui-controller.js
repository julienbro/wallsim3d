// Contrôleur principal de l'interface utilisateur
class UIController {
    constructor() {
        this.isInitialized = false;
        this.currentProject = null;
        this.settings = {
            autoSave: true,
            showTooltips: true,
            snapToGrid: true,
            theme: 'light'
        };
        
        this.setupEventListeners();
        this.loadSettings();
    }

    setupEventListeners() {
        // Boutons principaux
        // Vérifier que l'élément newProject existe avant d'ajouter l'écouteur
        const newProjectBtn = document.getElementById('newProject');
        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', () => {
                this.newProject();
            });
        }

        // Les boutons saveProject et loadProject ont été supprimés de l'interface
        // Ils sont maintenant gérés dans la barre d'outils principale

        // Contrôles de vue - utiliser les nouveaux boutons avec data-view
        const viewButtons = document.querySelectorAll('.view-btn[data-view]');
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                const view = button.getAttribute('data-view');
                this.setCameraView(view);
                
                // Mettre à jour la classe active
                viewButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });

        // Contrôles de grille - utiliser les nouveaux boutons
        const toggleGridBtn = document.getElementById('toggleGrid');
        if (toggleGridBtn) {
            toggleGridBtn.addEventListener('click', () => {
                const isVisible = window.SceneManager.isGridVisible();
                window.SceneManager.setGridVisible(!isVisible);
                toggleGridBtn.textContent = !isVisible ? 'Masquer Grille' : 'Grille';
            });
        }

        const toggleAxesBtn = document.getElementById('toggleAxes');
        if (toggleAxesBtn) {
            toggleAxesBtn.addEventListener('click', () => {
                const isVisible = window.SceneManager.areAxesVisible();
                window.SceneManager.setAxesVisible(!isVisible);
                toggleAxesBtn.textContent = !isVisible ? 'Masquer Axes' : 'Axes';
            });
        }

        // Contrôles de zoom
        const zoomInBtn = document.getElementById('zoomIn');
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                if (window.SceneManager) {
                    window.SceneManager.zoomIn();
                }
            });
        }

        const zoomOutBtn = document.getElementById('zoomOut');
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                if (window.SceneManager) {
                    window.SceneManager.zoomOut();
                }
            });
        }

        const zoomFitBtn = document.getElementById('zoomFit');
        if (zoomFitBtn) {
            zoomFitBtn.addEventListener('click', () => {
                if (window.SceneManager) {
                    window.SceneManager.zoomToFit();
                }
            });
        }

        // Sauvegarde automatique
        document.addEventListener('elementPlaced', () => {
            if (this.settings.autoSave) {
                this.autoSave();
            }
        });

        document.addEventListener('elementRemoved', () => {
            if (this.settings.autoSave) {
                this.autoSave();
            }
        });

        // Raccourcis clavier globaux
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeyPress(e);
        });

        // Gestion du redimensionnement
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Affichage infos de l'élément sélectionné dans viewport-controls
        const selectionInfoEl = document.getElementById('viewportSelectionInfo');
        if (selectionInfoEl) {
            document.addEventListener('elementSelected', (e) => {
                const { element, properties, toolType } = e.detail || {};
                this.renderViewportSelectionCard(selectionInfoEl, element, properties, toolType);
            });

            document.addEventListener('elementDeselected', () => {
                selectionInfoEl.innerHTML = '';
                selectionInfoEl.style.display = 'none';
            });
        }

        // Événements personnalisés pour les suggestions
        document.addEventListener('suggestionsActivated', (e) => {
            this.showSuggestionFeedback(e.detail.element);
        });

        document.addEventListener('suggestionsDeactivated', () => {
            this.hideSuggestionFeedback();
        });

        // Contrôles audio supprimés

        // Boutons d'aide et de réinitialisation
        const showHelpBtn = document.getElementById('showHelp');
        const resetSettingsBtn = document.getElementById('resetSettings');

        if (showHelpBtn) {
            showHelpBtn.addEventListener('click', () => {
                this.showHelpModal();
            });
        }

        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }

        // Contrôles de raccourcis
        const showShortcutsCheckbox = document.getElementById('showShortcuts');
        if (showShortcutsCheckbox) {
            showShortcutsCheckbox.addEventListener('change', (e) => {
                if (window.KeyboardManager) {
                    window.KeyboardManager.setEnabled(e.target.checked);
                }
            });
        }
    }

    // Construit une chaîne courte et lisible avec les infos utiles
    renderViewportSelectionCard(container, element, properties = {}, toolType) {
        if (!element) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }

        // Déterminer type/icone/label comme dans TabManager
        const safeType = String(toolType || element.type || properties.type || 'Élément');
        let iconClass = 'fas fa-cube';
        let label = 'Élément';
        if (/M50|M57|M60|M65|M90|brick/i.test(safeType)) { iconClass = 'fas fa-cube'; label = 'Brique'; }
        else if (/block|BLOC/i.test(safeType)) { iconClass = 'fas fa-th-large'; label = 'Bloc'; }
        else if (/insulation|ISOLATION|PUR|LAINEROCHE|XPS|PSE|FB|LV/i.test(safeType)) { iconClass = 'fas fa-layer-group'; label = 'Isolant'; }
        else if (/linteau|LINTEAU|^L\d+/.test(safeType)) { iconClass = 'fas fa-minus'; label = 'Linteau'; }

        // Nom d’affichage
        const displayName = properties.name || element.brickType || element.blockType || safeType;

        // Dimensions
        const d = element.dimensions || properties.dimensions || element;
        const hasDims = typeof d?.length !== 'undefined' && typeof d?.width !== 'undefined' && typeof d?.height !== 'undefined';
        const L = hasDims ? Math.round(d.length) : null;
        const H = hasDims ? Math.round(d.height) : null;
        const W = hasDims ? Math.round(d.width) : null;

        // Taille (entière/1/2/3/4) via element.cut s’il existe
        const cut = element.cut || properties.cut;
        let taille = '';
        if (cut === '1/2') taille = 'Demi-brique';
        else if (cut === '3/4' || /3Q/.test(safeType)) taille = '3/4 de brique';
        else if (cut === '1/4' || /1Q/.test(safeType)) taille = 'Quart de brique';
        else if (label === 'Brique') taille = 'Brique entière';

        // Construire le HTML
        let html = `
            <div class="info-header">
                <h4><i class="${iconClass}"></i> ${label} Sélectionné</h4>
            </div>
            <div class="info-content">
                <div class="info-row">
                    <span class="info-label">Nom:</span>
                    <span class="info-value">${displayName}</span>
                </div>
        `;

        if (hasDims) {
            html += `
                <div class="info-row">
                    <span class="info-label">Dimensions:</span>
                    <span class="info-value">${L}×${H}×${W} cm</span>
                </div>
            `;
        }

        if (taille) {
            html += `
                <div class="info-row">
                    <span class="info-label">Taille:</span>
                    <span class="info-value">${taille}</span>
                </div>
            `;
        }

        html += `</div>`;

        container.innerHTML = html;
        container.style.display = 'block';
    }

    setupTooltips() {
        const tooltips = {
            'brickMode': 'Mode Brique - Éléments de construction traditionnels (Raccourci: 1)',
            'blockMode': 'Mode Bloc - Éléments de grande taille (Raccourci: 2)',
            'insulationMode': 'Mode Isolant - Matériaux d\'isolation (Raccourci: 3)',
            'placeElement': 'Placer un élément - Cliquez pour activer/désactiver (Raccourci: Espace)',
            'deleteElement': 'Supprimer l\'élément sélectionné (Raccourci: Suppr)',
            'clearAll': 'Effacer tous les éléments',
            'topView': 'Vue du dessus',
            'frontView': 'Vue de face',
            'sideView': 'Vue de côté',
            'isoView': 'Vue isométrique (par défaut)',
            'showGrid': 'Afficher/masquer la grille de construction',
            'gridSpacingSlider': 'Ajuster l\'espacement de la grille'
        };

        Object.keys(tooltips).forEach(id => {
            const element = document.getElementById(id);
            if (element && this.settings.showTooltips) {
                element.title = tooltips[id];
            }
        });
    }

    setCameraView(viewName) {
        window.SceneManager.setCameraView(viewName);
        
        // Mettre à jour l'interface - utiliser data-view au lieu des IDs
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`.view-btn[data-view="${viewName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    newProject() {
        if (this.hasUnsavedChanges()) {
            if (!confirm('Vous avez des modifications non sauvegardées. Continuer ?')) {
                return;
            }
        }

        window.SceneManager.clearAll();
        this.currentProject = {
            name: 'Nouveau Projet',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            elements: []
        };

        this.showNotification('Nouveau projet créé', 'success');
        this.updateProjectInfo();
    }

    saveProject() {
        const sceneData = window.SceneManager.exportScene();
        
        if (!this.currentProject) {
            this.currentProject = {
                name: 'Mon Projet WallSim3D',
                created: new Date().toISOString()
            };
        }

        this.currentProject.modified = new Date().toISOString();
        this.currentProject.elements = sceneData.elements;
        this.currentProject.settings = {
            gridSpacing: sceneData.gridSpacing,
            showGrid: sceneData.showGrid
        };

        // Sauvegarde locale
        const projectData = JSON.stringify(this.currentProject, null, 2);
        this.downloadFile(projectData, `${this.currentProject.name}.json`, 'application/json');
        
        // Sauvegarde dans localStorage
        localStorage.setItem('wallsim3d_current_project', projectData);
        
        this.showNotification('Projet sauvegardé', 'success');
    }

    loadProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const projectData = JSON.parse(event.target.result);
                        this.loadProjectData(projectData);
                        this.showNotification('Projet chargé', 'success');
                    } catch (error) {
                        this.showNotification('Erreur lors du chargement du projet', 'error');
                        // console.error('Erreur de chargement:', error);
                    }
                };
                reader.readAsText(file);
            }
        });
        
        input.click();
    }

    loadProjectData(projectData) {
        this.currentProject = projectData;
        
        // Charger la scène
        const sceneData = {
            elements: projectData.elements || [],
            gridSpacing: projectData.settings?.gridSpacing || 10,
            showGrid: projectData.settings?.showGrid === true
        };
        
        window.SceneManager.importScene(sceneData);
        
        // Mettre à jour l'interface
        if (projectData.settings) {
            document.getElementById('showGrid').checked = sceneData.showGrid;
            document.getElementById('gridSpacingSlider').value = sceneData.gridSpacing;
            document.getElementById('gridSpacing').textContent = sceneData.gridSpacing + ' cm';
        }
        
        this.updateProjectInfo();
    }

    autoSave() {
        if (this.currentProject) {
            const sceneData = window.SceneManager.exportScene();
            this.currentProject.modified = new Date().toISOString();
            this.currentProject.elements = sceneData.elements;
            
            localStorage.setItem('wallsim3d_autosave', JSON.stringify(this.currentProject));
        }
    }

    loadAutoSave() {
        const autoSaveData = localStorage.getItem('wallsim3d_autosave');
        if (autoSaveData) {
            try {
                const projectData = JSON.parse(autoSaveData);
                if (confirm('Une sauvegarde automatique a été trouvée. La charger ?')) {
                    this.loadProjectData(projectData);
                }
            } catch (error) {
                // console.error('Erreur lors du chargement de la sauvegarde automatique:', error);
            }
        }
    }

    updateProjectInfo() {
        // Mettre à jour le titre si nécessaire
        if (this.currentProject) {
            document.title = `WallSim3D - ${this.currentProject.name}`;
        }
    }

    hasUnsavedChanges() {
        // Vérifier s'il y a des changements non sauvegardés
        if (!this.currentProject) {
            return window.SceneManager.getAllElements().length > 0;
        }
        
        const currentElements = window.SceneManager.exportScene().elements;
        return JSON.stringify(currentElements) !== JSON.stringify(this.currentProject.elements);
    }

    handleGlobalKeyPress(event) {
        // Raccourcis globaux
        if (event.ctrlKey || event.metaKey) {
            switch(event.key) {
                case 'n':
                    event.preventDefault();
                    this.newProject();
                    break;
                case 's':
                    event.preventDefault();
                    this.saveProject();
                    break;
                case 'o':
                    event.preventDefault();
                    this.loadProject();
                    break;
                case 'z':
                    event.preventDefault();
                    this.undo();
                    break;
                case 'y':
                    event.preventDefault();
                    this.redo();
                    break;
            }
        }

        // Autres raccourcis
        switch(event.key) {
            case 'F1':
                event.preventDefault();
                this.showHelp();
                break;
            case 'F11':
                event.preventDefault();
                this.toggleFullscreen();
                break;
        }
    }

    handleResize() {
        // Adapter l'interface à la nouvelle taille
        const sidebar = document.querySelector('.sidebar');
        const viewport = document.querySelector('.viewport');
        
        // Vérifier que les éléments existent
        if (!sidebar) {
            // console.warn('⚠️ UIController: Élément .sidebar non trouvé');
            return;
        }
        
        if (window.innerWidth < 768) {
            // Mode mobile
            sidebar.style.position = 'fixed';
            sidebar.style.top = '60px';
            sidebar.style.right = '-100%';
            sidebar.style.width = '100%';
            sidebar.style.height = 'calc(100vh - 60px)';
            sidebar.style.zIndex = '9999';
            sidebar.style.transition = 'right 0.3s ease';
        } else {
            // Mode desktop
            sidebar.style.position = 'relative';
            sidebar.style.zIndex = 'auto';
            sidebar.style.top = '';
            sidebar.style.right = '';
            sidebar.style.width = '';
            sidebar.style.height = '';
            sidebar.style.transition = '';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };

        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animation d'entrée
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Suppression automatique
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    showHelp() {
        const helpContent = `
            <h2>Aide - WallSim3D</h2>
            <h3>Raccourcis Clavier</h3>
            <ul>
                <li><strong>1, 2, 3</strong> - Changer de mode de construction</li>
                <li><strong>Espace</strong> - Activer/désactiver le placement</li>
                <li><strong>Suppr</strong> - Supprimer l'élément sélectionné</li>
                <li><strong>R</strong> - Faire pivoter l'élément sélectionné</li>
                <li><strong>Ctrl+N</strong> - Nouveau projet</li>
                <li><strong>Ctrl+S</strong> - Sauvegarder</li>
                <li><strong>Ctrl+O</strong> - Ouvrir</li>
                <li><strong>F1</strong> - Afficher cette aide</li>
            </ul>
            <h3>Utilisation</h3>
            <p>1. Sélectionnez un mode de construction (Brique, Bloc, Isolant)</p>
            <p>2. Choisissez un matériau et ajustez les dimensions</p>
            <p>3. Cliquez sur "Placer Élément" puis cliquez dans la vue 3D</p>
            <p>4. Utilisez les vues pour inspecter votre construction</p>
            <p>5. Consultez l'analyse pour les statistiques détaillées</p>
            
            <h3>Terminologie des Briques</h3>
            <p><strong>Panneresse (19×5)</strong> - Brique posée normalement, face longue visible</p>
            <p><strong>Boutisse (9×5)</strong> - Brique tournée à 90°, face courte visible</p>
            <p><strong>Plat (19×9)</strong> - Brique posée sur le côté, face plate visible</p>
            <p>L'orientation s'affiche automatiquement dans la barre de statut lors de la construction.</p>
        `;

        this.showModal('Aide', helpContent);
    }

    showModal(title, content) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        `;

        modalContent.innerHTML = content;

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 15px;
            right: 20px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        `;

        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        modalContent.appendChild(closeBtn);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('wallsim3d_settings');
        if (savedSettings) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            } catch (error) {
                // console.error('Erreur lors du chargement des paramètres:', error);
            }
        }
    }

    saveSettings() {
        localStorage.setItem('wallsim3d_settings', JSON.stringify(this.settings));
    }

    // Système d'annulation (délégation vers EditMenuHandler)
    undo() {
        if (window.EditMenuHandler) {
            window.EditMenuHandler.undo();
        } else {
            this.showNotification('Système d\'annulation non disponible', 'warning');
        }
    }

    redo() {
        if (window.EditMenuHandler) {
            window.EditMenuHandler.redo();
        } else {
            this.showNotification('Système de rétablissement non disponible', 'warning');
        }
    }

    init() {
        if (this.isInitialized) return;
        
        // Charger la sauvegarde automatique si disponible
        this.loadAutoSave();
        
        this.isInitialized = true;
        this.showNotification('WallSim3D chargé avec succès', 'success');
    }

    // Afficher un feedback visuel quand les suggestions sont activées
    showSuggestionFeedback(element) {
        // Créer ou mettre à jour le message d'information
        let feedback = document.getElementById('suggestion-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'suggestion-feedback';
            feedback.className = 'suggestion-feedback';
            document.body.appendChild(feedback);
        }

        const elementType = element.type === 'brick' ? 'brique' : 
                           element.type === 'block' ? 'bloc' : 'isolant';
        
        feedback.innerHTML = `
            <div class="feedback-content">
                <div class="feedback-icon"><i class="fas fa-bullseye"></i></div>
                <div class="feedback-text">
                    <strong>Mode suggestions actif</strong><br>
                    Choisissez un emplacement coloré ou cliquez ailleurs pour annuler
                </div>
                <div class="feedback-legend">
                    <div class="legend-item">
                        <span class="legend-color" style="background: #00ff00;"></span>
                        <span>Continuation</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color" style="background: #0088ff;"></span>
                        <span>Alternance</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color" style="background: #ffff00;"></span>
                        <span>Empilage</span>
                    </div>
                </div>
            </div>
        `;
        
        feedback.style.display = 'block';
        
        // Animation d'apparition
        setTimeout(() => {
            feedback.classList.add('visible');
        }, 10);
    }

    // Masquer le feedback des suggestions
    hideSuggestionFeedback() {
        const feedback = document.getElementById('suggestion-feedback');
        if (feedback) {
            feedback.classList.remove('visible');
            setTimeout(() => {
                feedback.style.display = 'none';
            }, 300);
        }
    }

    // Afficher la modal d'aide avec les raccourcis
    showHelpModal() {
        // Créer la modal si elle n'existe pas
        let modal = document.getElementById('help-modal');
        if (!modal) {
            modal = this.createHelpModal();
            document.body.appendChild(modal);
        }

        // Afficher la modal
        modal.classList.add('show');
        
        // Son supprimé
    }

    createHelpModal() {
        const modal = document.createElement('div');
        modal.id = 'help-modal';
        modal.className = 'help-modal';
        
        const shortcuts = window.KeyboardManager ? window.KeyboardManager.getShortcutsList() : [];
        
        modal.innerHTML = `
            <div class="help-content">
                <div class="help-header">
                    <h2>Aide & Raccourcis</h2>
                    <button class="close-help">&times;</button>
                </div>
                
                <div class="help-section">
                    <h3>Raccourcis Clavier</h3>
                    <div class="shortcuts-list">
                        ${shortcuts.map(shortcut => `
                            <div class="shortcut-item">
                                <span class="shortcut-key">${shortcut.key}</span>
                                <span class="shortcut-desc">${shortcut.description}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="help-section">
                    <h3>Utilisation</h3>
                    <ul>
                        <li>Sélectionnez un type d'élément (Brique, Bloc, Isolation)</li>
                        <li>Choisissez un matériau et ajustez les dimensions</li>
                        <li>Cliquez sur une brique existante pour voir les suggestions de placement</li>
                        <li>Utilisez la molette pour zoomer, clic-glisser pour tourner la vue</li>
                        <li>L'élément fantôme suit votre curseur en mode placement</li>
                    </ul>
                </div>
                
                <div class="help-section">
                    <h3>Système de Suggestions</h3>
                    <ul>
                        <li>Cliquez sur une brique pour activer les suggestions</li>
                        <li>Des fantômes colorés apparaissent autour de la brique</li>
                        <li>Cliquez sur une suggestion pour placer directement</li>
                        <li>Appuyez sur Échap pour annuler</li>
                    </ul>
                </div>
            </div>
        `;
        
        // Événements de fermeture
        const closeBtn = modal.querySelector('.close-help');
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
        
        // Fermer avec Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                modal.classList.remove('show');
            }
        });
        
        return modal;
    }

    // Réinitialiser les paramètres
    resetSettings() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
            // Audio supprimé
            
            // Réinitialiser les raccourcis
            if (window.KeyboardManager) {
                window.KeyboardManager.setEnabled(true);
                document.getElementById('showShortcuts').checked = true;
            }
            
            // Réinitialiser d'autres paramètres
            const showGrid = document.getElementById('showGrid');
            if (showGrid) {
                showGrid.checked = false;
                showGrid.dispatchEvent(new Event('change'));
            }
            
            const showGhost = document.getElementById('showGhost');
            if (showGhost) {
                showGhost.checked = true;
                showGhost.dispatchEvent(new Event('change'));
            }
            
            // Son supprimé
            
            alert('Paramètres réinitialisés !');
        }
    }

    setConstructionMode(mode, preserveDimensions = false) {
        if (window.ConstructionTools) {
            window.ConstructionTools.setMode(mode, preserveDimensions);
            window.ConstructionTools.updateToolButtons();
            window.ConstructionTools.updateModeInterface(mode);
            
            // Émettre un événement pour notifier le changement de mode
            const event = new CustomEvent('constructionModeChanged', {
                detail: { mode: mode, preserveDimensions: preserveDimensions }
            });
            document.dispatchEvent(event);
        }
    }
}

// Instance globale
window.UIController = new UIController();
