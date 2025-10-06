/**
 * Gestionnaire du Menu Fichier - WallSim3D
 * Gère toutes les fonctionnalités du menu Fichier de la barre supérieure
 */

class FileMenuHandler {
    constructor() {
        this.currentProject = null;
        this.hasUnsavedChanges = false;
        this.autoSaveEnabled = true;
        this.autoSaveInterval = null;
        this.listenersAdded = new Set(); // Pour éviter les doublons d'événements
        // Protections contre les exécutions multiples
        this.savingInProgress = false;
        this.openingInProgress = false;
        this.newProjectInProgress = false;
        this.saveAsInProgress = false;
        this.exportInProgress = false;
        this.importInProgress = false;
        this.fileTypes = {
            project: {
                extension: '.wsm',
                mime: 'application/json', // Contenu toujours JSON sérialisé
                description: 'Projet WallSim3D (.wsm)'
            },
            export: {
                stl: { extension: '.stl', mime: 'application/sla', description: 'Fichier STL 3D' },
                obj: { extension: '.obj', mime: 'application/obj', description: 'Fichier OBJ 3D' },
                png: { extension: '.png', mime: 'image/png', description: 'Image PNG' },
                jpg: { extension: '.jpg', mime: 'image/jpeg', description: 'Image JPEG' }
            },
            import: {
                glb: { extension: '.glb', mime: 'model/gltf-binary', description: 'Modèle GLB 3D' },
                gltf: { extension: '.gltf', mime: 'model/gltf+json', description: 'Modèle GLTF 3D' }
            }
        };
        this.init();
    }

    init() {
        // console.log('🗃️ Initialisation du gestionnaire de menu Fichier...');
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.setupAutoSave();
        this.setupStartupEventListeners();
        // Ne plus charger automatiquement ici car c'est géré par le StartupManager
        // this.loadAutoSavedProject();
    }

    /**
     * Écouter les événements du StartupManager
     */
    setupStartupEventListeners() {
        // Écouter l'événement de restauration depuis le StartupManager
        window.addEventListener('startup-restore-project', (e) => {
            const projectData = e.detail.projectData;
            console.log('🔄 Restauration demandée depuis le StartupManager');
            this.loadProjectData(projectData);
            this.showNotification('Projet restauré depuis la sauvegarde automatique', 'success');
        });
    }

    // ===============================================
    // CONFIGURATION DES ÉVÉNEMENTS
    // ===============================================

    setupEventListeners() {
        // Menu Nouveau Projet
        this.addMenuListener('newProject', () => this.newProject());
        
        // Menu Ouvrir
        this.addMenuListener('openProject', () => this.openProject());
        
        // Menu Sauvegarder
        this.addMenuListener('saveProject', () => this.saveProject());
        
        // Menu Sauvegarder sous
        this.addMenuListener('saveAsProject', () => this.saveAsProject());
        
        // Menu Exporter
        this.addMenuListener('exportProject', () => this.exportProject());
        
        // Menu Importer
        this.addMenuListener('importProject', () => this.importProject());

        // console.log('📋 Événements du menu Fichier configurés');
    }

    addMenuListener(elementId, callback) {
        const element = document.getElementById(elementId);
        if (element) {
            // Vérifier si l'élément a déjà un gestionnaire d'événement
            if (element.hasAttribute('data-listener-attached')) {
                console.warn(`⚠️ Gestionnaire déjà attaché à ${elementId}`);
                return;
            }

            element.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                callback();
            });
            
            // Marquer l'élément comme ayant un gestionnaire attaché
            element.setAttribute('data-listener-attached', 'true');
            this.listenersAdded.add(elementId);
        } else {
            console.warn(`⚠️ Élément ${elementId} non trouvé`);
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'n':
                        e.preventDefault();
                        this.newProject();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.openProject();
                        break;
                    case 's':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.saveAsProject();
                        } else {
                            this.saveProject();
                        }
                        break;
                    case 'e':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.exportProject();
                        }
                        break;
                    case 'i':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.importProject();
                        }
                        break;
                }
            }
        });
        // console.log('⌨️ Raccourcis clavier configurés');
    }

    // ===============================================
    // FONCTIONS DU MENU FICHIER
    // ===============================================

    /**
     * Créer un nouveau projet
     */
    async newProject() {
        // Protection contre les multiples exécutions simultanées
        if (this.newProjectInProgress) {
            console.log('📄 Création déjà en cours, ignorée');
            return;
        }

        this.newProjectInProgress = true;
        console.log('📄 Nouveau projet demandé');

        try {
            if (this.hasUnsavedChanges) {
                const result = await this.showUnsavedChangesDialog();
                if (result === 'cancel') return;
                if (result === 'save') {
                    this.saveProject();
                }
            }

            // Vider la scène
            if (window.SceneManager && typeof window.SceneManager.clearAll === 'function') {
                window.SceneManager.clearAll();
            }

            // Nettoyer le TabManager pour éviter les fuites de contexte WebGL
            if (window.TabManager && typeof window.TabManager.cleanup === 'function') {
                window.TabManager.cleanup();
            }

            // Créer un nouveau projet
            this.currentProject = {
                name: 'Nouveau Projet',
                version: '1.0',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                author: '',
                description: '',
                elements: [],
                settings: {
                    gridSpacing: 10,
                    showGrid: true,
                    units: 'cm',
                    precision: 2
                }
            };

            this.hasUnsavedChanges = false;
            this.updateProjectInfo();
            this.showNotification('Nouveau projet créé', 'success');
            console.log('✅ Nouveau projet créé avec succès');
            
            // Rafraîchir la page pour démarrer complètement à neuf
            setTimeout(() => {
                location.reload();
            }, 1000); // Délai pour que la notification soit visible
            
        } finally {
            // Réinitialiser le flag après un délai court
            setTimeout(() => {
                this.newProjectInProgress = false;
            }, 500);
        }
    }

    /**
     * Ouvrir un projet existant
     */
    async openProject() {
        // Protection contre les multiples exécutions simultanées
        if (this.openingInProgress) {
            console.log('📂 Ouverture déjà en cours, ignorée');
            return;
        }

        this.openingInProgress = true;
        console.log('📂 Ouverture de projet demandée');

        try {
            if (this.hasUnsavedChanges) {
                const result = await this.showUnsavedChangesDialog();
                if (result === 'cancel') return;
                if (result === 'save') {
                    this.saveProject();
                }
            }

            const input = document.createElement('input');
            input.type = 'file';
            input.accept = this.fileTypes.project.extension;
            input.multiple = false;

            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.loadProjectFile(file);
                }
                // Réinitialiser le flag après traitement du fichier
                this.openingInProgress = false;
            });

            // Réinitialiser le flag si l'utilisateur annule la sélection
            input.addEventListener('cancel', () => {
                this.openingInProgress = false;
            });

            input.click();
        } catch (error) {
            console.error('❌ Erreur lors de l\'ouverture:', error);
            this.openingInProgress = false;
        }

        // Sécurité : réinitialiser après un délai même si aucun événement n'est déclenché
        setTimeout(() => {
            this.openingInProgress = false;
        }, 2000);
    }

    /**
     * Sauvegarder le projet actuel
     */
    async saveProject() {
        // Protection contre les multiples exécutions simultanées
        if (this.savingInProgress) {
            console.log('💾 Sauvegarde déjà en cours, ignorée');
            return;
        }

        this.savingInProgress = true;
        console.log('💾 Sauvegarde du projet');

        try {
            if (!this.currentProject) {
                console.log('Aucun projet actuel, création d\'un nouveau SANS vider la scène');
                // Créer un nouveau projet SANS vider la scène existante
                this.currentProject = {
                    name: 'Mon Projet WallSim3D',
                    version: '1.0',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString(),
                    author: '',
                    description: '',
                    elements: [],
                    settings: {
                        gridSpacing: 10,
                        showGrid: true,
                        units: 'cm',
                        precision: 2
                    }
                };
            }

            // Demander le nom de fichier à chaque sauvegarde (sans extension)
            const currentName = this.currentProject.name || 'mon_projet';
            const userInput = window.prompt('Nom du fichier (sans extension .wsm) :', currentName);
            if (userInput === null) {
                // Annulé par l'utilisateur
                this.savingInProgress = false;
                console.log('💾 Sauvegarde annulée par l\'utilisateur');
                return;
            }
            const trimmed = userInput.trim();
            if (trimmed.length > 0) {
                this.currentProject.name = trimmed;
            }

            // Mise à jour des données du projet
            this.updateProjectData();

            const fileName = this.sanitizeFileName(this.currentProject.name) + this.fileTypes.project.extension;
            const content = this.exportProjectData();

            const tryFSAccess = async () => {
                if (!window.isSecureContext) {
                    // Nécessaire pour File System Access
                    console.warn('Contexte non sécurisé: impossible d\'ouvrir le sélecteur d\'emplacement');
                    return false;
                }
                if (!window.showSaveFilePicker) return false;
                try {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: fileName,
                        types: [{
                            description: 'Projet WallSim3D',
                            accept: { 'application/json': ['.wsm'] }
                        }]
                    });
                    const writable = await handle.createWritable();
                    await writable.write(new Blob([content], { type: this.fileTypes.project.mime }));
                    await writable.close();
                    this.saveToLocalStorage();
                    this.hasUnsavedChanges = false;
                    this.showNotification('Projet sauvegardé (emplacement choisi)', 'success');
                    console.log('✅ Sauvegarde via File System Access');
                    return true;
                } catch (e) {
                    if (e.name === 'AbortError') {
                        console.log('Sauvegarde annulée par l\'utilisateur');
                        return true; // Considérer traité (pas de fallback auto)
                    }
                    console.warn('Échec File System Access, fallback téléchargement:', e);
                    return false;
                }
            };

            const usedPicker = await tryFSAccess();
            if (!usedPicker) {
                this.downloadFile(content, fileName, this.fileTypes.project.mime);
                this.saveToLocalStorage();
                this.showNotification('Projet téléchargé (dossier Téléchargements)', 'info');

                if (!window.isSecureContext || !window.showSaveFilePicker) {
                    // Afficher une aide claire à l'utilisateur
                    this.showFSAccessHelp(!window.isSecureContext ? 'insecure' : 'unsupported');
                }
            }

            this.hasUnsavedChanges = false;
            this.showNotification('Projet sauvegardé avec succès', 'success');
            console.log('✅ Projet sauvegardé avec succès');
        } finally {
            // Réinitialiser le flag après un délai court pour éviter les clics multiples
            setTimeout(() => {
                this.savingInProgress = false;
            }, 500);
        }
    }

    /**
     * Affiche un dialogue expliquant pourquoi le choix d'emplacement n'est pas possible
     */
    showFSAccessHelp(reason = 'insecure') {
        // Éviter doublons
        if (document.getElementById('fsaccess-help-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'fsaccess-help-overlay';
        overlay.style.cssText = `position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;font-family:Arial, sans-serif;`;

        const box = document.createElement('div');
        box.style.cssText = `background:#fff;max-width:520px;width:90%;padding:22px 26px;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.35);position:relative;`;
        box.innerHTML = `
            <h3 style="margin:0 0 12px;font-size:18px;display:flex;align-items:center;gap:8px;">
                <span style="font-size:20px;">📁</span> Choisir l'emplacement n'est pas disponible
            </h3>
            <p style="margin:0 0 10px;font-size:14px;line-height:1.4;">
                ${reason === 'insecure' ? "Le navigateur bloque l'API de sélection d'emplacement car la page n'est pas servie depuis un contexte sécurisé (HTTPS ou localhost)." : "Votre navigateur ne supporte pas l'API File System Access nécessaire pour ouvrir une vraie boîte de dialogue d'enregistrement."}
            </p>
            <div style="background:#f6f7f9;border:1px solid #dde1e5;padding:10px 12px;border-radius:8px;font-size:13px;line-height:1.5;">
                <strong>Solutions :</strong>
                <ul style="padding-left:18px;margin:6px 0;">
                    <li>Ouvrir l'application via <code>http://localhost:5555</code> au lieu de l'adresse IP.</li>
                    <li>Ou servir le projet via HTTPS (certificat local / reverse proxy).</li>
                    <li>Chrome/Edge uniquement : activer l'option navigateur "Toujours demander où enregistrer" pour forcer une boîte.</li>
                    <li>(Avancé) Utiliser un mapping hosts: ajouter <code>127.0.0.1 walsim.local</code> puis ouvrir <code>http://walsim.local:5555</code>.</li>
                </ul>
                <em>Sans ces conditions, le fichier sera téléchargé automatiquement dans le dossier par défaut.</em>
            </div>
            <div style="margin-top:16px;display:flex;justify-content:flex-end;gap:8px;">
                <button id="fsaccess-help-close" style="background:#0078d4;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:14px;">Compris</button>
            </div>
        `;

        overlay.appendChild(box);
        document.body.appendChild(overlay);
        const close = () => overlay.remove();
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        box.querySelector('#fsaccess-help-close').addEventListener('click', close);
    }

    /**
     * Sauvegarder sous un nouveau nom
     */
    async saveAsProject() {
        // Protection contre les multiples exécutions simultanées
        if (this.saveAsInProgress) {
            console.log('💾 Sauvegarde sous déjà en cours, ignorée');
            return;
        }

        this.saveAsInProgress = true;
        console.log('💾 Sauvegarde sous un nouveau nom');

        try {
            const newName = await this.promptProjectName();
            if (!newName) {
                return;
            }

            if (this.currentProject) {
                this.currentProject.name = newName;
                this.currentProject.created = new Date().toISOString();
            } else {
                this.newProject();
                this.currentProject.name = newName;
            }

            this.saveProject();
        } finally {
            // Réinitialiser le flag après un délai court
            setTimeout(() => {
                this.saveAsInProgress = false;
            }, 500);
        }
    }

    /**
     * Exporter le projet dans différents formats
     */
    exportProject() {
        // Protection contre les multiples exécutions simultanées
        if (this.exportInProgress) {
            console.log('📤 Export déjà en cours, ignoré');
            return;
        }

        this.exportInProgress = true;
        console.log('📤 Export du projet');

        try {
            if (!this.currentProject && (!window.SceneManager || window.SceneManager.getAllElements().length === 0)) {
                this.showNotification('Aucun projet à exporter', 'warning');
                return;
            }

            const exportDialog = this.createExportDialog();
            document.body.appendChild(exportDialog);
        } finally {
            // Réinitialiser le flag après un délai court
            setTimeout(() => {
                this.exportInProgress = false;
            }, 1000); // Plus long car le dialogue peut rester ouvert
        }
    }

    /**
     * Importer un projet ou des éléments
     */
    importProject() {
        // Protection contre les multiples exécutions simultanées
        if (this.importInProgress) {
            console.log('📥 Import déjà en cours, ignoré');
            return;
        }

        this.importInProgress = true;
        console.log('📥 Import de projet');

        try {
            const importDialog = this.createImportDialog();
            document.body.appendChild(importDialog);
        } finally {
            // Réinitialiser le flag après un délai court
            setTimeout(() => {
                this.importInProgress = false;
            }, 1000); // Plus long car le dialogue peut rester ouvert
        }
    }

    // ===============================================
    // FONCTIONS UTILITAIRES
    // ===============================================

    /**
     * Charger un fichier projet
     */
    loadProjectFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const projectData = JSON.parse(e.target.result);
                this.loadProjectData(projectData);
                this.showNotification(`Projet "${projectData.name}" chargé avec succès`, 'success');
                console.log('✅ Projet chargé avec succès');
            } catch (error) {
                console.error('❌ Erreur lors du chargement:', error);
                this.showNotification('Erreur lors du chargement du projet', 'error');
            }
        };
        reader.onerror = () => {
            this.showNotification('Erreur lors de la lecture du fichier', 'error');
        };
        reader.readAsText(file);
    }

    /**
     * Charger les données d'un projet
     */
    loadProjectData(projectData) {
        this.currentProject = {
            ...projectData,
            modified: new Date().toISOString()
        };

        // Vider la scène actuelle
        if (window.SceneManager && typeof window.SceneManager.clearAll === 'function') {
            window.SceneManager.clearAll();
        }

        // Nettoyer le TabManager pour éviter les fuites de contexte WebGL
        if (window.TabManager && typeof window.TabManager.cleanup === 'function') {
            window.TabManager.cleanup();
            // Marquer le début du chargement de projet
            window.TabManager.isLoadingProject = true;
        }

        // Charger les éléments du projet
        if (projectData.elements && window.SceneManager) {
            const sceneData = {
                elements: projectData.elements,
                settings: projectData.settings || {}
            };
            
            if (typeof window.SceneManager.importScene === 'function') {
                window.SceneManager.importScene(sceneData);
            }
        }

        // Appliquer les paramètres
        this.applyProjectSettings(projectData.settings);

        // Restaurer les champs Projet (onglet Projet)
        const nameField = document.getElementById('projectName');
        const designerField = document.getElementById('projectDesigner');
        const classField = document.getElementById('projectClass');
        const notesField = document.getElementById('projectNotes');
        if (nameField && typeof projectData.name === 'string') nameField.value = projectData.name;
        if (designerField && typeof projectData.designer === 'string') designerField.value = projectData.designer;
        if (classField && typeof projectData.class === 'string') classField.value = projectData.class;
        if (notesField && typeof projectData.notes === 'string') notesField.value = projectData.notes;

        // Restaurer les champs Mode Opératoire si présents
        if (projectData.detailedProcedure !== undefined) {
            const dp = document.getElementById('detailedProcedure');
            if (dp) dp.value = projectData.detailedProcedure;
            // Si un éditeur riche est présent, synchroniser le contenu
            if (window.detailedProcedureEditor && typeof window.detailedProcedureEditor.setContent === 'function') {
                try { window.detailedProcedureEditor.setContent(projectData.detailedProcedure || ''); } catch {}
            }
        }
        if (projectData.procedureRecommendations !== undefined) {
            const pr = document.getElementById('procedureRecommendations');
            if (pr) pr.value = projectData.procedureRecommendations;
            if (window.recommendationsEditor && typeof window.recommendationsEditor.setContent === 'function') {
                try { window.recommendationsEditor.setContent(projectData.procedureRecommendations || ''); } catch {}
            }
        }
        
        // Restaurer les mesures, annotations et textes si présents
        if (window.MeasurementAnnotationManager) {
            // Charger les mesures
            if (projectData.measurements && typeof window.MeasurementAnnotationManager.loadMeasurementData === 'function') {
                console.log(`📏 Chargement de ${projectData.measurements.length} mesures`);
                window.MeasurementAnnotationManager.loadMeasurementData(projectData.measurements);
            }
            
            // Charger les annotations
            if (projectData.annotations && typeof window.MeasurementAnnotationManager.loadAnnotationData === 'function') {
                console.log(`📝 Chargement de ${projectData.annotations.length} annotations`);
                window.MeasurementAnnotationManager.loadAnnotationData(projectData.annotations);
            }
            
            // Charger les textes avec guide
            if (projectData.textLeaders && typeof window.MeasurementAnnotationManager.loadTextLeaderData === 'function') {
                console.log(`📋 Chargement de ${projectData.textLeaders.length} textes avec guide`);
                window.MeasurementAnnotationManager.loadTextLeaderData(projectData.textLeaders);
            }
        }
        
        this.hasUnsavedChanges = false;
        this.updateProjectInfo();
        
        // Marquer la fin du chargement de projet
        if (window.TabManager) {
            setTimeout(() => {
                window.TabManager.isLoadingProject = false;
                
                // Traiter les éléments en lot restants
                if (window.TabManager.processBatchedElements) {
                    window.TabManager.processBatchedElements();
                }
                
                // Démarrer le traitement des aperçus en queue
                setTimeout(() => {
                    if (window.TabManager.processPreviewQueue) {
                        window.TabManager.processPreviewQueue();
                    }
                }, 200);
                
                // Générer les aperçus 3D qui ont été ignorés pendant le chargement
                setTimeout(() => {
                    if (window.TabManager.generateMissedPreviews) {
                        window.TabManager.generateMissedPreviews();
                    }
                }, 500); // Petit délai supplémentaire pour stabiliser
            }, 1000); // Délai pour laisser les aperçus se stabiliser
        }
    }

    /**
     * Exporter les données du projet
     */
    exportProjectData() {
        if (!this.currentProject) return null;

        // Récupérer les données de la scène
        const sceneData = window.SceneManager && typeof window.SceneManager.exportScene === 'function' 
            ? window.SceneManager.exportScene() 
            : { elements: [] };

        // Récupérer les champs Projet (depuis l'UI)
        const uiProjectName = (document.getElementById('projectName')?.value || '').trim();
        const uiDesigner = (document.getElementById('projectDesigner')?.value || '').trim();
        const uiClass = (document.getElementById('projectClass')?.value || '').trim();
        const uiNotes = (document.getElementById('projectNotes')?.value || '').trim();

        // Garder currentProject.name synchronisé si un nom est saisi
        if (uiProjectName) {
            this.currentProject.name = uiProjectName;
        }

        const projectData = {
            ...this.currentProject,
            modified: new Date().toISOString(),
            elements: sceneData.elements || [],
            settings: {
                ...this.currentProject.settings,
                ...sceneData.settings
            },
            // Champs Projet
            name: this.currentProject.name || uiProjectName || this.currentProject?.name || 'Projet sans nom',
            designer: uiDesigner,
            class: uiClass,
            notes: uiNotes,
            detailedProcedure: (document.getElementById('detailedProcedure')?.value || '').trim(),
            procedureRecommendations: (document.getElementById('procedureRecommendations')?.value || '').trim(),
            // Inclure les données des mesures, annotations et textes sauvegardées
            measurements: this.currentProject.measurements || [],
            annotations: this.currentProject.annotations || [],
            textLeaders: this.currentProject.textLeaders || []
        };

        return JSON.stringify(projectData, null, 2);
    }

    /**
     * Mettre à jour les données du projet
     */
    updateProjectData() {
        if (!this.currentProject) return;

        this.currentProject.modified = new Date().toISOString();
        
        // Récupérer les données de la scène
        if (window.SceneManager && typeof window.SceneManager.exportScene === 'function') {
            const sceneData = window.SceneManager.exportScene();
            this.currentProject.elements = sceneData.elements || [];
            this.currentProject.settings = {
                ...this.currentProject.settings,
                ...sceneData.settings
            };
        }

        // Récupérer les champs Projet (depuis l'UI)
        const uiProjectName = (document.getElementById('projectName')?.value || '').trim();
        const uiDesigner = (document.getElementById('projectDesigner')?.value || '').trim();
        const uiClass = (document.getElementById('projectClass')?.value || '').trim();
        const uiNotes = (document.getElementById('projectNotes')?.value || '').trim();
        if (uiProjectName) this.currentProject.name = uiProjectName;
        this.currentProject.designer = uiDesigner;
        this.currentProject.class = uiClass;
        this.currentProject.notes = uiNotes;

        // Récupérer les données des mesures, annotations et textes
        if (window.MeasurementAnnotationManager) {
            // Sauvegarder les mesures
            if (typeof window.MeasurementAnnotationManager.getMeasurementData === 'function') {
                this.currentProject.measurements = window.MeasurementAnnotationManager.getMeasurementData();
            }
            
            // Sauvegarder les annotations
            if (typeof window.MeasurementAnnotationManager.getAnnotationData === 'function') {
                this.currentProject.annotations = window.MeasurementAnnotationManager.getAnnotationData();
            }
            
            // Sauvegarder les textes avec guide
            if (typeof window.MeasurementAnnotationManager.getTextLeaderData === 'function') {
                this.currentProject.textLeaders = window.MeasurementAnnotationManager.getTextLeaderData();
            }
        }

        // Mettre à jour les champs textuels Mode Opératoire
        this.currentProject.detailedProcedure = (document.getElementById('detailedProcedure')?.value || '').trim();
        this.currentProject.procedureRecommendations = (document.getElementById('procedureRecommendations')?.value || '').trim();
    }

    /**
     * Appliquer les paramètres du projet
     */
    applyProjectSettings(settings) {
        if (!settings) return;

        // Appliquer les paramètres de grille
        if (settings.gridSpacing && document.getElementById('gridSpacingSlider')) {
            document.getElementById('gridSpacingSlider').value = settings.gridSpacing;
            if (document.getElementById('gridSpacing')) {
                document.getElementById('gridSpacing').textContent = settings.gridSpacing + ' cm';
            }
        }

        if (typeof settings.showGrid === 'boolean' && document.getElementById('showGrid')) {
            document.getElementById('showGrid').checked = settings.showGrid;
        }
    }

    // ===============================================
    // DIALOGUES ET INTERFACE
    // ===============================================

    /**
     * Dialogue pour les changements non sauvegardés
     */
    showUnsavedChangesDialog() {
        return new Promise((resolve) => {
            // Créer l'overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(5px);
                z-index: 10000;
                display: flex;
                justify-content: center;
                align-items: center;
                animation: fadeIn 0.3s ease-out;
            `;

            // Créer le dialogue
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: linear-gradient(145deg, #ffffff, #f8f9fa);
                border-radius: 16px;
                padding: 0;
                max-width: 420px;
                min-width: 380px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                overflow: hidden;
            `;

            dialog.innerHTML = `
                <!-- En-tête avec icône -->
                <div style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); padding: 24px; text-align: center; color: white;">
                    <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
                    <h3 style="margin: 0; font-size: 20px; font-weight: 600;">Modifications non sauvegardées</h3>
                    <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">Que souhaitez-vous faire ?</p>
                </div>
                
                <!-- Contenu -->
                <div style="padding: 24px;">
                    <div style="background: #fff3cd; border-radius: 12px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #f39c12;">
                        <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.4;">
                            <strong>Votre travail contient des modifications non sauvegardées.</strong><br>
                            Choisissez une action pour continuer :
                        </p>
                    </div>
                    
                    <!-- Boutons -->
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <button id="unsavedSave" style="
                            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                            color: white;
                            border: none;
                            padding: 14px 20px;
                            border-radius: 8px;
                            font-size: 14px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <span style="margin-right: 8px; font-size: 16px;">💾</span>
                            Sauvegarder et continuer
                        </button>
                        
                        <button id="unsavedContinue" style="
                            background: #6c757d;
                            color: white;
                            border: none;
                            padding: 12px 20px;
                            border-radius: 8px;
                            font-size: 14px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <span style="margin-right: 8px;">⚡</span>
                            Continuer sans sauvegarder
                        </button>
                        
                        <button id="unsavedCancel" style="
                            background: transparent;
                            color: #6c757d;
                            border: 2px solid #dee2e6;
                            padding: 10px 20px;
                            border-radius: 8px;
                            font-size: 14px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <span style="margin-right: 8px;">❌</span>
                            Annuler
                        </button>
                    </div>
                </div>
            `;

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            // Ajouter les styles hover
            const style = document.createElement('style');
            style.textContent = `
                #unsavedSave:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(40, 167, 69, 0.4) !important;
                }
                #unsavedContinue:hover {
                    background: #5a6268 !important;
                    transform: translateY(-1px);
                }
                #unsavedCancel:hover {
                    background: #f8f9fa !important;
                    border-color: #6c757d !important;
                    color: #495057 !important;
                    transform: translateY(-1px);
                }
            `;
            document.head.appendChild(style);

            // Fonction de nettoyage
            const cleanup = () => {
                document.body.removeChild(overlay);
                document.head.removeChild(style);
            };

            // Gestionnaires d'événements
            document.getElementById('unsavedSave').onclick = () => {
                cleanup();
                resolve('save');
            };

            document.getElementById('unsavedContinue').onclick = () => {
                cleanup();
                resolve('continue');
            };

            document.getElementById('unsavedCancel').onclick = () => {
                cleanup();
                resolve('cancel');
            };

            // Fermer avec échap
            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    document.removeEventListener('keydown', handleKeyDown);
                    resolve('cancel');
                }
            };
            document.addEventListener('keydown', handleKeyDown);
        });
    }

    /**
     * Demander le nom du projet avec un dialogue moderne
     */
    promptProjectName() {
        return new Promise((resolve) => {
            const currentName = this.currentProject ? this.currentProject.name : 'Mon Projet WallSim3D';
            
            // Créer l'overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(5px);
                z-index: 10000;
                display: flex;
                justify-content: center;
                align-items: center;
                animation: fadeIn 0.3s ease-out;
            `;

            // Créer le dialogue
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: linear-gradient(145deg, #ffffff, #f8f9fa);
                border-radius: 16px;
                padding: 0;
                max-width: 400px;
                min-width: 350px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                overflow: hidden;
            `;

            dialog.innerHTML = `
                <!-- En-tête avec icône -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; text-align: center; color: white;">
                    <div style="font-size: 48px; margin-bottom: 12px;">✏️</div>
                    <h3 style="margin: 0; font-size: 20px; font-weight: 600;">Nom du projet</h3>
                    <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">Choisissez un nom pour votre projet</p>
                </div>
                
                <!-- Contenu -->
                <div style="padding: 24px;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 500; color: #333; margin-bottom: 8px; font-size: 14px;">
                            Nom du projet :
                        </label>
                        <input type="text" id="projectNameInput" value="${currentName}" style="
                            width: 100%;
                            padding: 12px 16px;
                            border: 2px solid #e9ecef;
                            border-radius: 8px;
                            font-size: 16px;
                            font-family: inherit;
                            background: white;
                            transition: all 0.3s ease;
                            box-sizing: border-box;
                        " placeholder="Entrez le nom du projet...">
                        <div style="font-size: 12px; color: #6c757d; margin-top: 6px;">
                            💡 Conseil : Utilisez un nom descriptif pour retrouver facilement votre projet
                        </div>
                    </div>
                    
                    <!-- Boutons -->
                    <div style="display: flex; gap: 12px;">
                        <button id="projectNameOk" style="
                            flex: 1;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border: none;
                            padding: 12px 20px;
                            border-radius: 8px;
                            font-size: 14px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                        ">
                            <span style="margin-right: 8px;">✅</span>
                            Valider
                        </button>
                        
                        <button id="projectNameCancel" style="
                            flex: 1;
                            background: #6c757d;
                            color: white;
                            border: none;
                            padding: 12px 20px;
                            border-radius: 8px;
                            font-size: 14px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        ">
                            <span style="margin-right: 8px;">❌</span>
                            Annuler
                        </button>
                    </div>
                </div>
            `;

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            // Récupérer l'input et le focus
            const input = document.getElementById('projectNameInput');
            
            // Focus et sélection du texte après un petit délai pour les animations
            setTimeout(() => {
                input.focus();
                input.select();
            }, 100);

            // Styles hover et focus
            const style = document.createElement('style');
            style.textContent = `
                #projectNameInput:focus {
                    border-color: #667eea !important;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
                    outline: none !important;
                }
                #projectNameOk:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4) !important;
                }
                #projectNameCancel:hover {
                    background: #5a6268 !important;
                    transform: translateY(-1px);
                }
            `;
            document.head.appendChild(style);

            // Fonction de nettoyage
            const cleanup = () => {
                document.body.removeChild(overlay);
                document.head.removeChild(style);
            };

            // Fonction de validation
            const validateAndClose = () => {
                const name = input.value.trim();
                if (name) {
                    cleanup();
                    resolve(name);
                } else {
                    // Animer l'input pour indiquer qu'un nom est requis
                    input.style.borderColor = '#dc3545';
                    input.style.backgroundColor = '#fff5f5';
                    input.placeholder = 'Un nom est requis...';
                    input.focus();
                    
                    setTimeout(() => {
                        input.style.borderColor = '#e9ecef';
                        input.style.backgroundColor = 'white';
                    }, 2000);
                }
            };

            // Gestionnaires d'événements
            document.getElementById('projectNameOk').onclick = validateAndClose;
            
            document.getElementById('projectNameCancel').onclick = () => {
                cleanup();
                resolve(null);
            };

            // Validation avec Entrée
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    validateAndClose();
                } else if (e.key === 'Escape') {
                    cleanup();
                    resolve(null);
                }
            });

            // Fermer en cliquant sur l'overlay
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    cleanup();
                    resolve(null);
                }
            };
        });
    }

    /**
     * Créer le dialogue d'export
     */
    createExportDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'export-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay">
                <div class="dialog-content">
                    <h3><i class="fas fa-upload"></i> Exporter le projet</h3>
                    <div class="export-options">
                        <div class="export-section">
                            <h4>Format 3D</h4>
                            <button class="export-btn" data-format="stl">
                                <i class="fas fa-cube"></i> STL (Impression 3D)
                            </button>
                            <button class="export-btn" data-format="stl-print">
                                <i class="fas fa-print"></i> Export impr 3D (STL optimisé Z-up)
                            </button>
                            <div class="orientation-controls" style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                                <strong>Orientation Export STL :</strong>
                                <div style="margin-top: 5px;">
                                    <button class="orientation-btn" onclick="window.FileMenuHandler.setSTLOrientation('x', 90)" style="font-size: 11px; padding: 3px 6px; margin: 2px;">+90°X</button>
                                    <button class="orientation-btn" onclick="window.FileMenuHandler.setSTLOrientation('x', -90)" style="font-size: 11px; padding: 3px 6px; margin: 2px;">-90°X</button>
                                    <button class="orientation-btn" onclick="window.FileMenuHandler.setSTLOrientation('y', 180)" style="font-size: 11px; padding: 3px 6px; margin: 2px;">180°Y</button>
                                    <button class="orientation-btn" onclick="window.FileMenuHandler.setSTLOrientation('none', 0)" style="font-size: 11px; padding: 3px 6px; margin: 2px;">Original</button>
                                </div>
                                <div id="current-orientation" style="font-size: 11px; color: #666; margin-top: 3px;">Actuel: +90°X</div>
                            </div>
                            <button class="export-btn" data-format="obj">
                                <i class="fas fa-shapes"></i> OBJ (3D Standard)
                            </button>
                        </div>
                        <div class="export-section">
                            <h4>Image</h4>
                            <button class="export-btn" data-format="png">
                                <i class="fas fa-image"></i> PNG (Haute qualité)
                            </button>
                            <button class="export-btn" data-format="jpg">
                                <i class="fas fa-camera"></i> JPEG (Compressé)
                            </button>
                        </div>
                        <div class="export-section">
                            <h4>Données</h4>
                            <button class="export-btn" data-format="json">
                                <i class="fas fa-code"></i> JSON (Données brutes)
                            </button>
                        </div>
                    </div>
                    <div class="dialog-buttons">
                        <button class="btn-secondary" onclick="this.closest('.export-dialog').remove()">
                            Annuler
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Gérer les clics sur les boutons d'export
        dialog.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.dataset.format;
                this.performExport(format);
                dialog.remove();
            });
        });

        return dialog;
    }

    /**
     * Créer le dialogue d'import
     */
    createImportDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'import-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay">
                <div class="dialog-content">
                    <h3><i class="fas fa-download"></i> Importer</h3>
                    <div class="import-options">
                        <div class="import-section">
                            <h4>Projet complet</h4>
                            <button class="import-btn" data-type="project">
                                <i class="fas fa-file"></i> Projet WallSim3D (.json)
                            </button>
                        </div>
                        <div class="import-section">
                            <h4>Éléments</h4>
                            <button class="import-btn" data-type="elements">
                                <i class="fas fa-plus-circle"></i> Ajouter des éléments
                            </button>
                        </div>
                        <div class="import-section">
                            <h4>Modèles 3D</h4>
                            <button class="import-btn" data-type="glb">
                                <i class="fas fa-cube"></i> Modèle 3D GLB
                            </button>
                        </div>
                        <div class="import-section">
                            <h4>Bibliothèque</h4>
                            <button class="import-btn" data-type="library">
                                <i class="fas fa-book"></i> Importer bibliothèque
                            </button>
                        </div>
                    </div>
                    <div class="dialog-buttons">
                        <button class="btn-secondary" onclick="this.closest('.import-dialog').remove()">
                            Annuler
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Gérer les clics sur les boutons d'import
        dialog.querySelectorAll('.import-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                this.performImport(type);
                dialog.remove();
            });
        });

        return dialog;
    }

    // ===============================================
    // FONCTIONS D'EXPORT ET IMPORT
    // ===============================================

    /**
     * Effectuer l'export selon le format
     */
    performExport(format) {
        console.log(`📤 Export au format ${format}`);

        switch (format) {
            case 'stl':
                this.exportSTL();
                break;
            case 'stl-print':
                this.exportSTLForPrinting();
                break;
            case 'obj':
                this.exportOBJ();
                break;
            case 'png':
                this.exportImage('png');
                break;
            case 'jpg':
                this.exportImage('jpeg');
                break;
            case 'json':
                this.exportJSON();
                break;
            default:
                this.showNotification('Format d\'export non supporté', 'error');
        }
    }

    /**
     * Effectuer l'import selon le type
     */
    performImport(type) {
        console.log(`📥 Import de type ${type}`);

        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = type === 'elements';

        switch (type) {
            case 'project':
                input.accept = '.json';
                input.addEventListener('change', (e) => {
                    if (e.target.files[0]) {
                        this.loadProjectFile(e.target.files[0]);
                    }
                });
                break;
            case 'elements':
                input.accept = '.json';
                input.addEventListener('change', (e) => {
                    this.importElements(e.target.files);
                });
                break;
            case 'library':
                input.accept = '.json';
                input.addEventListener('change', (e) => {
                    if (e.target.files[0]) {
                        this.importLibrary(e.target.files[0]);
                    }
                });
                break;
            case 'glb':
                input.accept = '.glb,.gltf';
                input.addEventListener('change', (e) => {
                    if (e.target.files[0]) {
                        this.importGLB(e.target.files[0]);
                    }
                });
                break;
        }

        input.click();
    }

    /**
     * Export STL
     */
    exportSTL() {
        if (window.SceneManager && typeof window.SceneManager.exportSTL === 'function') {
            const stlData = window.SceneManager.exportSTL();
            const fileName = this.sanitizeFileName(this.currentProject?.name || 'WallSim3D_Export') + '.stl';
            this.downloadFile(stlData, fileName, 'application/sla');
            this.showNotification('Export STL terminé', 'success');
        } else {
            this.showNotification('Export STL non disponible', 'warning');
        }
    }

    /**
     * Export STL optimisé pour l'impression 3D
     * Exclut les éléments de texte, annotations, flèches et autres éléments non imprimables
     */
    exportSTLForPrinting() {
        if (window.SceneManager) {
            // Utiliser la version avec diagnostic si disponible
            if (typeof window.SceneManager.exportSTLWithDiagnostic === 'function') {
                const result = window.SceneManager.exportSTLWithDiagnostic();
                
                if (result && result.content) {
                    const fileName = this.sanitizeFileName(this.currentProject?.name || 'WallSim3D_Print') + '_print.stl';
                    this.downloadFile(result.content, fileName, 'application/sla');
                    
                    // Afficher un rapport de diagnostic
                    if (result.report) {
                        const stats = result.report.stats;
                        let message = `Export STL pour impression 3D terminé\n`;
                        message += `📊 ${stats.triangleCount} triangles, ${stats.solidCount} solide(s)\n`;
                        message += `📁 Taille: ${(stats.size / 1024).toFixed(1)} KB`;
                        
                        if (result.repaired) {
                            message += `\n🔧 Fichier réparé automatiquement`;
                        }
                        
                        if (result.report.warnings.length > 0) {
                            message += `\n⚠️ ${result.report.warnings.length} avertissement(s)`;
                        }
                        
                        this.showNotification(message, result.report.isValid ? 'success' : 'warning');
                    } else {
                        this.showNotification('Export STL pour impression 3D terminé', 'success');
                    }
                } else {
                    this.showNotification('Erreur lors de l\'export STL pour impression 3D', 'error');
                }
            } else if (typeof window.SceneManager.exportSTLForPrinting === 'function') {
                // Version de base sans diagnostic
                const stlData = window.SceneManager.exportSTLForPrinting();
                const fileName = this.sanitizeFileName(this.currentProject?.name || 'WallSim3D_Print') + '_print.stl';
                this.downloadFile(stlData, fileName, 'application/sla');
                this.showNotification('Export STL pour impression 3D terminé', 'success');
            } else {
                this.showNotification('Export STL pour impression 3D non disponible', 'warning');
            }
        } else {
            this.showNotification('SceneManager non disponible', 'error');
        }
    }

    /**
     * Export OBJ
     */
    exportOBJ() {
        if (window.SceneManager && typeof window.SceneManager.exportOBJ === 'function') {
            const objData = window.SceneManager.exportOBJ();
            const fileName = this.sanitizeFileName(this.currentProject?.name || 'WallSim3D_Export') + '.obj';
            this.downloadFile(objData, fileName, 'application/obj');
            this.showNotification('Export OBJ terminé', 'success');
        } else {
            this.showNotification('Export OBJ non disponible', 'warning');
        }
    }

    /**
     * Export d'image
     */
    exportImage(format) {
        if (window.SceneManager && typeof window.SceneManager.captureImage === 'function') {
            window.SceneManager.captureImage(format, (dataUrl) => {
                const fileName = this.sanitizeFileName(this.currentProject?.name || 'WallSim3D_Capture') + '.' + format;
                this.downloadDataUrl(dataUrl, fileName);
                this.showNotification(`Export ${format.toUpperCase()} terminé`, 'success');
            });
        } else {
            this.showNotification('Capture d\'image non disponible', 'warning');
        }
    }

    /**
     * Export JSON
     */
    exportJSON() {
        const data = this.exportProjectData();
        if (data) {
            const fileName = this.sanitizeFileName(this.currentProject?.name || 'WallSim3D_Data') + '_data.json';
            this.downloadFile(data, fileName, 'application/json');
            this.showNotification('Export JSON terminé', 'success');
        }
    }

    // ===============================================
    // SAUVEGARDE AUTOMATIQUE
    // ===============================================

    setupAutoSave() {
        if (this.autoSaveEnabled) {
            this.autoSaveInterval = setInterval(() => {
                this.performAutoSave();
            }, 30000); // 30 secondes
            // console.log('💾 Sauvegarde automatique activée (30s)');
        }
    }

    performAutoSave() {
        if (this.hasUnsavedChanges && this.currentProject) {
            this.saveToLocalStorage('autosave');
            // console.log('💾 Sauvegarde automatique effectuée');
        }
    }

    /**
     * Fallback pour charger la sauvegarde automatique (si StartupManager indisponible)
     */
    loadAutoSavedProjectFallback() {
        // Vérifier que les systèmes nécessaires sont prêts
        if (!window.SceneManager || !window.SceneManager.scene) {
            console.log('🔄 Systèmes non prêts, report du chargement automatique...');
            setTimeout(() => this.loadAutoSavedProjectFallback(), 500);
            return;
        }

        const autoSaved = localStorage.getItem('wallsim3d_autosave');
        if (autoSaved) {
            try {
                const projectData = JSON.parse(autoSaved);
                this.showAutoSaveDialog(projectData);
            } catch (error) {
                console.error('❌ Erreur lors de la restauration automatique:', error);
            }
        }
    }

    /**
     * Afficher un dialogue moderne pour la sauvegarde automatique
     */
    showAutoSaveDialog(projectData) {
        // Créer l'overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(5px);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            animation: fadeIn 0.3s ease-out;
        `;

        // Créer le dialogue
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: linear-gradient(145deg, #ffffff, #f8f9fa);
            border-radius: 16px;
            padding: 0;
            max-width: 450px;
            min-width: 400px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
        `;

        // Date de sauvegarde formatée
        const saveDate = projectData.modified ? new Date(projectData.modified) : new Date();
        const timeAgo = this.getTimeAgo(saveDate);
        
        dialog.innerHTML = `
            <!-- En-tête avec icône -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; text-align: center; color: white;">
                <div style="font-size: 48px; margin-bottom: 12px;">💾</div>
                <h3 style="margin: 0; font-size: 20px; font-weight: 600;">Sauvegarde automatique trouvée</h3>
                <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">Récupération de votre travail précédent</p>
            </div>
            
            <!-- Contenu -->
            <div style="padding: 24px;">
                <div style="background: #f8f9fa; border-radius: 12px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #667eea;">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 16px; margin-right: 8px;">📝</span>
                        <strong style="color: #333; font-size: 16px;">${projectData.name || 'Projet sans nom'}</strong>
                    </div>
                    <div style="font-size: 13px; color: #666; margin-left: 24px;">
                        <div style="margin-bottom: 4px;">
                            <span style="color: #999;">🕒 Sauvegardé:</span> ${timeAgo}
                        </div>
                        <div>
                            <span style="color: #999;">📊 Éléments:</span> ${projectData.elements?.length || 0} objet(s)
                        </div>
                    </div>
                </div>
                
                <p style="color: #555; font-size: 14px; line-height: 1.4; margin-bottom: 24px;">
                    Une sauvegarde automatique de votre projet a été trouvée. Souhaitez-vous la restaurer pour continuer votre travail ?
                </p>
                
                <!-- Boutons -->
                <div style="display: flex; gap: 12px;">
                    <button id="autoSaveRestore" style="
                        flex: 1;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                    ">
                        <span style="margin-right: 8px;">🔄</span>
                        Restaurer le projet
                    </button>
                    
                    <button id="autoSaveIgnore" style="
                        flex: 1;
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">
                        <span style="margin-right: 8px;">❌</span>
                        Commencer nouveau
                    </button>
                </div>
                
                <p style="font-size: 12px; color: #999; text-align: center; margin-top: 16px; margin-bottom: 0;">
                    La sauvegarde automatique sera supprimée si vous choisissez de commencer un nouveau projet
                </p>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Ajouter les animations CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideInUp {
                from { 
                    opacity: 0; 
                    transform: translateY(30px) scale(0.95); 
                }
                to { 
                    opacity: 1; 
                    transform: translateY(0) scale(1); 
                }
            }
            #autoSaveRestore:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4) !important;
            }
            #autoSaveIgnore:hover {
                background: #5a6268 !important;
                transform: translateY(-1px);
            }
        `;
        document.head.appendChild(style);

        // Gestionnaires d'événements
        document.getElementById('autoSaveRestore').onclick = () => {
            this.loadProjectData(projectData);
            this.showNotification('Projet restauré depuis la sauvegarde automatique', 'success');
            document.body.removeChild(overlay);
            document.head.removeChild(style);
        };

        document.getElementById('autoSaveIgnore').onclick = () => {
            // Supprimer la sauvegarde automatique
            localStorage.removeItem('wallsim3d_autosave');
            this.showNotification('Sauvegarde automatique supprimée', 'info');
            document.body.removeChild(overlay);
            document.head.removeChild(style);
        };

        // Fermer avec échap
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                document.getElementById('autoSaveIgnore').click();
            }
        };
    }

    saveToLocalStorage(suffix = '') {
        if (this.currentProject) {
            // Toujours rafraîchir les données du projet (éléments, mesures, annotations, textes) avant de sauvegarder
            try {
                this.updateProjectData();
            } catch (e) {
                console.warn('⚠️ Échec de la mise à jour du projet avant la sauvegarde locale:', e);
            }
            const key = suffix ? `wallsim3d_${suffix}` : 'wallsim3d_current_project';
            const data = this.exportProjectData();
            localStorage.setItem(key, data);
        }
    }

    // ===============================================
    // FONCTIONS UTILITAIRES
    // ===============================================

    /**
     * Calculer le temps écoulé depuis une date
     */
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays === 1) return 'Hier';
        if (diffDays < 7) return `Il y a ${diffDays} jours`;
        
        return date.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'short', 
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
        });
    }

    /**
     * Télécharger un fichier
     */
    downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });

        // Tentative d'utilisation de l'API File System Access (Chrome / Edge modernes)
        const saveWithFSAccess = async () => {
            try {
                if (window.showSaveFilePicker) {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: fileName,
                        types: [
                            {
                                description: 'Projet WallSim3D',
                                accept: { 'application/json': ['.wsm'] }
                            }
                        ]
                    });
                    const writable = await handle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    return true;
                }
            } catch (err) {
                console.warn('File System Access API non utilisée:', err);
            }
            return false;
        };

        saveWithFSAccess().then((usedFS) => {
            if (usedFS) return; // Déjà sauvegardé à l'emplacement choisi

            // Fallback: téléchargement classique
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    }

    /**
     * Télécharger depuis une URL de données
     */
    downloadDataUrl(dataUrl, fileName) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Nettoyer un nom de fichier
     */
    sanitizeFileName(fileName) {
        return fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    }

    /**
     * Mettre à jour les informations du projet dans l'interface
     */
    updateProjectInfo() {
        if (this.currentProject) {
            document.title = `WallSim3D - ${this.currentProject.name}`;
            
            // Mettre à jour les champs du projet si ils existent
            const nameField = document.getElementById('projectName');
            if (nameField && nameField.value !== this.currentProject.name) {
                nameField.value = this.currentProject.name;
            }
        }
    }

    /**
     * Afficher une notification
     */
    showNotification(message, type = 'info', duration = 3000) {
        // Vérifier que le message n'est pas null/undefined et le convertir en string
        if (message == null) {
            console.warn('⚠️ Tentative d\'affichage d\'une notification null/undefined ignorée');
            return;
        }
        
        // Convertir en string et nettoyer
        const messageStr = String(message).trim();
        if (messageStr === '') {
            console.warn('⚠️ Tentative d\'affichage d\'une notification vide ignorée');
            return;
        }
        
        // Utiliser le système de notification existant si disponible
        if (window.modernInterface && typeof window.modernInterface.showNotification === 'function') {
            window.modernInterface.showNotification(messageStr, type, duration);
        } else if (window.UIController && typeof window.UIController.showNotification === 'function') {
            window.UIController.showNotification(messageStr, type, duration);
        } else {
            // Fallback simple
            console.log(`📢 ${type.toUpperCase()}: ${messageStr}`);
            alert(`${type.toUpperCase()}: ${messageStr}`);
        }
    }

    /**
     * Marquer le projet comme modifié
     */
    markAsModified() {
        this.hasUnsavedChanges = true;
        
        // Ajouter un indicateur visuel si nécessaire
        const title = document.title;
        if (!title.includes('*')) {
            document.title = title + ' *';
        }
    }

    /**
     * Marquer le projet comme sauvegardé
     */
    markAsSaved() {
        this.hasUnsavedChanges = false;
        
        // Retirer l'indicateur visuel
        document.title = document.title.replace(' *', '');
    }

    // ===============================================
    // FONCTIONS D'IMPORT
    // ===============================================

    /**
     * Importer des éléments
     */
    importElements(files) {
        console.log(`📥 Import de ${files.length} fichier(s) d'éléments`);
        
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.elements && Array.isArray(data.elements)) {
                        // Importer chaque élément
                        data.elements.forEach(elementData => {
                            if (window.SceneManager && typeof window.SceneManager.addElement === 'function') {
                                const element = window.WallElement ? window.WallElement.fromJSON(elementData) : elementData;
                                window.SceneManager.addElement(element);
                            }
                        });
                        
                        this.showNotification(`${data.elements.length} éléments importés`, 'success');
                        this.markAsModified();
                    } else {
                        this.showNotification('Format d\'éléments invalide', 'error');
                    }
                } catch (error) {
                    console.error('❌ Erreur lors de l\'import d\'éléments:', error);
                    this.showNotification('Erreur lors de l\'import des éléments', 'error');
                }
            };
            reader.readAsText(file);
        });
    }

    /**
     * Importer une bibliothèque
     */
    importLibrary(file) {
        console.log('📥 Import de bibliothèque');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const libraryData = JSON.parse(e.target.result);
                
                if (libraryData.library || libraryData.materials || libraryData.textures) {
                    // Stocker dans localStorage ou autre système de gestion
                    if (libraryData.materials) {
                        localStorage.setItem('wallsim_imported_materials', JSON.stringify(libraryData.materials));
                    }
                    
                    if (libraryData.textures) {
                        localStorage.setItem('wallsim_imported_textures', JSON.stringify(libraryData.textures));
                    }
                    
                    // Recharger la bibliothèque si possible
                    if (window.TabManager && typeof window.TabManager.refreshLibrary === 'function') {
                        window.TabManager.refreshLibrary();
                    }
                    
                    this.showNotification('Bibliothèque importée avec succès', 'success');
                } else {
                    this.showNotification('Format de bibliothèque invalide', 'error');
                }
            } catch (error) {
                console.error('❌ Erreur lors de l\'import de bibliothèque:', error);
                this.showNotification('Erreur lors de l\'import de la bibliothèque', 'error');
            }
        };
        reader.readAsText(file);
    }

    /**
     * Importer un modèle GLB/GLTF
     */
    importGLB(file) {
        console.log('📥 Import de modèle GLB/GLTF');
        
        if (!window.THREE) {
            this.showNotification('Three.js non disponible', 'error');
            return;
        }

        // Vérifier si GLTFLoader est disponible
        const isGLTFLoaderAvailable = (window.THREE && window.THREE.GLTFLoader) || window.GLTFLoader;
        
        if (!isGLTFLoaderAvailable) {
            console.log('🔄 GLTFLoader non disponible, chargement en cours...');
            this.loadGLTFLoader().then(() => {
                console.log('✅ GLTFLoader chargé, traitement du fichier...');
                this.processGLBFile(file);
            }).catch(error => {
                console.error('❌ Erreur lors du chargement de GLTFLoader:', error);
                console.log('🔄 Tentative avec solution de fallback...');
                this.tryAlternativeGLBImport(file);
            });
        } else {
            console.log('✅ GLTFLoader déjà disponible, traitement direct...');
            this.processGLBFile(file);
        }
    }

    /**
     * Solution alternative si GLTFLoader ne peut pas être chargé
     */
    tryAlternativeGLBImport(file) {
        console.log('🔄 Tentative d\'import GLB avec solution alternative...');
        
        // Pour l'instant, afficher un message informatif
        // Dans une version future, on pourrait implémenter un parser GLB basique
        this.showNotification(
            'GLTFLoader indisponible. Veuillez convertir votre modèle GLB en OBJ pour l\'importer.', 
            'warning'
        );
        
        // Optionnel: proposer des solutions alternatives
        this.showGLBAlternativesDialog();
    }

    /**
     * Afficher un dialogue avec des alternatives pour l'import GLB
     */
    showGLBAlternativesDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'import-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay">
                <div class="dialog-content">
                    <h3><i class="fas fa-exclamation-triangle"></i> Import GLB indisponible</h3>
                    <div class="dialog-message">
                        <p>Le chargeur GLB n'a pas pu être initialisé. Voici des alternatives :</p>
                        <ul>
                            <li><strong>Convertir en OBJ</strong> : Utilisez Blender pour exporter en OBJ</li>
                            <li><strong>Recharger la page</strong> : Parfois résout les problèmes de chargement</li>
                            <li><strong>Utiliser un autre navigateur</strong> : Chrome ou Firefox recommandés</li>
                        </ul>
                        <p><small>Cette fonctionnalité est en développement et sera améliorée prochainement.</small></p>
                    </div>
                    <div class="dialog-buttons">
                        <button class="btn-primary" onclick="location.reload()">
                            🔄 Recharger la page
                        </button>
                        <button class="btn-secondary" onclick="this.closest('.import-dialog').remove()">
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Auto-fermeture après 10 secondes
        setTimeout(() => {
            if (dialog.parentNode) {
                dialog.remove();
            }
        }, 10000);
    }

    /**
     * Charger GLTFLoader si nécessaire
     */
    loadGLTFLoader() {
        return new Promise((resolve, reject) => {
            // Essayer d'abord le chargement ES6 moderne
            console.log('🔄 Tentative de chargement GLTFLoader...');
            this.loadGLTFLoaderES6().then(resolve).catch(() => {
                console.log('🔄 ES6 échoué, tentative UMD...');
                this.loadGLTFLoaderUMD().then(resolve).catch(() => {
                    console.log('🔄 UMD échoué, tentative version spécifique...');
                    this.loadGLTFLoaderSpecific().then(resolve).catch(() => {
                        console.log('🔄 Tentative dernière chance avec version ancienne...');
                        this.loadGLTFLoaderLegacy().then(resolve).catch(reject);
                    });
                });
            });
        });
    }

    /**
     * Charger GLTFLoader via ES6 modules
     */
    loadGLTFLoaderES6() {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('📦 Tentative chargement GLTFLoader ES6...');
                const { GLTFLoader } = await import('https://cdn.jsdelivr.net/npm/three@latest/examples/jsm/loaders/GLTFLoader.js');
                
                if (GLTFLoader) {
                    // Essayer d'assigner à THREE sans étendre l'objet
                    try {
                        window.THREE.GLTFLoader = GLTFLoader;
                    } catch (e) {
                        // Si THREE n'est pas extensible, créer une référence globale
                        window.GLTFLoader = GLTFLoader;
                        console.log('📦 GLTFLoader assigné à window.GLTFLoader (THREE non extensible)');
                    }
                    console.log('✅ GLTFLoader ES6 chargé et assigné');
                    resolve();
                } else {
                    reject(new Error('GLTFLoader ES6 import failed'));
                }
            } catch (error) {
                console.warn('⚠️ GLTFLoader ES6 failed:', error.message);
                reject(error);
            }
        });
    }

    /**
     * Vérifier et assigner GLTFLoader après chargement
     */
    verifyAndAssignGLTFLoader(resolve, reject) {
        // Attendre un peu pour laisser le script s'exécuter
        setTimeout(() => {
            let GLTFLoaderFound = false;
            
            // Vérifier différents emplacements possibles et leurs variations
            const possibleLocations = [
                () => window.THREE && window.THREE.GLTFLoader,
                () => window.GLTFLoader,
                () => window.Three && window.Three.GLTFLoader,
                () => window.THREE && window.THREE.Loader && window.THREE.Loader.GLTFLoader,
                () => window.THREE && window.THREE.examples && window.THREE.examples.GLTFLoader
            ];
            
            let foundLoader = null;
            
            for (let i = 0; i < possibleLocations.length; i++) {
                const location = possibleLocations[i];
                try {
                    const loader = location();
                    if (loader && typeof loader === 'function') {
                        foundLoader = loader;
                        console.log(`✅ GLTFLoader trouvé à l'emplacement ${i + 1}`);
                        break;
                    }
                } catch (e) {
                    // Ignorer les erreurs d'accès
                }
            }
            
            if (foundLoader) {
                // S'assurer que GLTFLoader est accessible via window.GLTFLoader
                if (!window.GLTFLoader) {
                    window.GLTFLoader = foundLoader;
                }
                
                // Essayer d'assigner à THREE aussi si possible
                try {
                    if (window.THREE && !window.THREE.GLTFLoader) {
                        window.THREE.GLTFLoader = foundLoader;
                    }
                } catch (e) {
                    // Ignorer si THREE n'est pas extensible
                }
                
                console.log('✅ GLTFLoader disponible et assigné');
                GLTFLoaderFound = true;
            }
            
            if (GLTFLoaderFound) {
                resolve();
            } else {
                console.error('❌ GLTFLoader non trouvé après chargement');
                
                reject(new Error('GLTFLoader not found after loading'));
            }
        }, 1000); // Délai plus long pour l'initialisation
    }

    /**
     * Charger GLTFLoader via UMD (fallback)
     */
    loadGLTFLoaderUMD() {
        return new Promise((resolve, reject) => {
            console.log('📦 Tentative chargement GLTFLoader UMD...');
            const script = document.createElement('script');
            // Utiliser une URL plus fiable
            script.src = 'https://threejs.org/examples/js/loaders/GLTFLoader.js';
            
            script.onload = () => {
                console.log('📥 Script GLTFLoader UMD chargé');
                this.verifyAndAssignGLTFLoader(resolve, reject);
            };
            
            script.onerror = (error) => {
                console.warn('⚠️ Échec chargement GLTFLoader UMD, tentative CDN alternatif...');
                // Fallback immédiat vers jsdelivr
                const fallbackScript = document.createElement('script');
                fallbackScript.src = 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/js/loaders/GLTFLoader.js';
                
                fallbackScript.onload = () => {
                    console.log('📥 Script GLTFLoader UMD fallback chargé');
                    this.verifyAndAssignGLTFLoader(resolve, reject);
                };
                
                fallbackScript.onerror = () => {
                    reject(new Error('GLTFLoader UMD loading failed'));
                };
                
                document.head.appendChild(fallbackScript);
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Charger GLTFLoader version spécifique
     */
    loadGLTFLoaderSpecific() {
        return new Promise((resolve, reject) => {
            console.log('📦 Tentative chargement GLTFLoader version spécifique...');
            const script = document.createElement('script');
            // Utiliser une version stable connue
            script.src = 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/js/loaders/GLTFLoader.js';
            
            script.onload = () => {
                console.log('📥 Script GLTFLoader version spécifique chargé');
                this.verifyAndAssignGLTFLoader(resolve, reject);
            };
            
            script.onerror = (error) => {
                console.warn('⚠️ Échec chargement GLTFLoader version spécifique:', error);
                reject(new Error('GLTFLoader specific version loading failed'));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Charger GLTFLoader version legacy
     */
    loadGLTFLoaderLegacy() {
        return new Promise((resolve, reject) => {
            console.log('📦 Tentative chargement GLTFLoader legacy...');
            const script = document.createElement('script');
            // Version très stable et ancienne
            script.src = 'https://cdn.jsdelivr.net/npm/three@0.144.0/examples/js/loaders/GLTFLoader.js';
            
            script.onload = () => {
                console.log('📥 Script GLTFLoader legacy chargé');
                this.verifyAndAssignGLTFLoader(resolve, reject);
            };
            
            script.onerror = (error) => {
                console.error('❌ Échec complet du chargement GLTFLoader:', error);
                reject(new Error('All GLTFLoader loading attempts failed'));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Traiter le fichier GLB/GLTF
     */
    processGLBFile(file) {
        
        // Vérifier que GLTFLoader est disponible
        let GLTFLoaderClass = null;
        
        if (window.THREE && window.THREE.GLTFLoader) {
            GLTFLoaderClass = window.THREE.GLTFLoader;
        } else if (window.GLTFLoader) {
            GLTFLoaderClass = window.GLTFLoader;
        } else {
            this.showNotification('GLTFLoader non disponible', 'error');
            console.error('❌ GLTFLoader non trouvé dans window.THREE ou window');
            return;
        }
        
        try {
            const loader = new GLTFLoaderClass();
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const url = URL.createObjectURL(new Blob([arrayBuffer]));
                    
                    loader.load(
                        url,
                        (gltf) => {
                            this.addGLBToScene(gltf.scene, file.name);
                            URL.revokeObjectURL(url);
                            this.showNotification(`Modèle "${file.name}" importé avec succès`, 'success');
                            this.markAsModified();
                        },
                        undefined, // Pas de callback de progression
                        (error) => {
                            console.error('❌ Erreur lors du chargement GLB:', error);
                            URL.revokeObjectURL(url);
                            this.showNotification('Erreur lors du chargement du modèle GLB', 'error');
                        }
                    );
                } catch (error) {
                    console.error('❌ Erreur lors du traitement GLB:', error);
                    this.showNotification('Erreur lors du traitement du fichier GLB', 'error');
                }
            };
            
            reader.onerror = () => {
                this.showNotification('Erreur lors de la lecture du fichier GLB', 'error');
            };
            
            reader.readAsArrayBuffer(file);
            
        } catch (error) {
            console.error('❌ Erreur lors de la création de l\'instance GLTFLoader:', error);
            this.showNotification('Erreur lors de l\'initialisation du loader GLB', 'error');
        }
    }

    /**
     * Ajouter le modèle GLB à la scène
     */
    addGLBToScene(gltfScene, fileName) {
        if (!window.SceneManager || !window.SceneManager.scene) {
            console.error('❌ SceneManager non disponible');
            return;
        }

        // Configurer le modèle importé
        gltfScene.name = `GLB_${fileName.replace(/\.[^/.]+$/, "")}`;
        gltfScene.userData = {
            type: 'imported_model',
            fileName: fileName,
            importedAt: new Date().toISOString(),
            isGLB: true
        };

        // Propriétés pour l'intégration au métré
        // 🔥 CORRECTION: Utiliser le type spécifique GLB si disponible, sinon 'glb' générique
        const specificGLBType = (window.tempGLBScale && window.tempGLBScale.info && window.tempGLBScale.info.type) || 
                               (window.tempGLBInfo && window.tempGLBInfo.type) || 
                               'glb';
        
        gltfScene.type = specificGLBType; // 'hourdis_13_60' au lieu de 'glb'
        gltfScene.isGLBModel = true;
        gltfScene.glbFileName = fileName;
        gltfScene.material = 'glb_model';
        
        if (window.DEBUG_CONSTRUCTION) {
            console.log('🔧 GLB: Type spécifique utilisé:', specificGLBType);
        }
        
        // Générer un ID unique pour le système de métré
        if (!gltfScene.id) {
            gltfScene.id = `glb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        // Calculer la bounding box pour positionner le modèle
        const box = new window.THREE.Box3().setFromObject(gltfScene);
        const size = box.getSize(new window.THREE.Vector3());
        const center = box.getCenter(new window.THREE.Vector3());

        // Ajouter les propriétés pour le métré
        gltfScene.boundingBox = box;
        gltfScene.dimensions = {
            length: Math.round(size.x * 10) / 10,
            width: Math.round(size.z * 10) / 10,
            height: Math.round(size.y * 10) / 10
        };
        
        // Fonctions pour compatibilité avec le système de métré
        gltfScene.getVolume = function() {
            const vol = this.dimensions.length * this.dimensions.width * this.dimensions.height;
            return vol / 1000000; // Conversion en m³
        };
        
        gltfScene.getMass = function() {
            return 1; // Masse par défaut pour les modèles GLB (1 kg)
        };

        // Vérifier si le modèle a une taille valide
        if (size.x === 0 && size.y === 0 && size.z === 0) {
            console.warn('⚠️ Modèle de taille nulle détecté');
            // Définir une position par défaut
            gltfScene.position.set(0, 0, 0);
        } else {
            // Centrer le modèle par rapport à son bounding box
            gltfScene.position.sub(center);
            
            // Positionner le modèle au sol (y = 0)
            gltfScene.position.y = -box.min.y;
        }

        // Ajuster l'échelle si le modèle est trop grand ou trop petit
        // Appliquer l'échelle personnalisée si disponible (pour les éléments GLB de la bibliothèque)
        let scale = 1; // Déclaration de scale pour toute la fonction
        
        if (window.tempGLBScale) {
            gltfScene.scale.set(
                window.tempGLBScale.x,
                window.tempGLBScale.y, 
                window.tempGLBScale.z
            );
            // Pour l'échelle personnalisée, utiliser la plus grande composante pour le calcul de distance
            scale = Math.max(window.tempGLBScale.x, window.tempGLBScale.y, window.tempGLBScale.z);
        }
        
        // Redimensionnement automatique seulement si pas d'échelle personnalisée
        if (!window.tempGLBScale) {
            const maxDimension = Math.max(size.x, size.y, size.z);
            
            if (maxDimension > 100) { // Si plus de 100 unités
                scale = 100 / maxDimension;
                gltfScene.scale.setScalar(scale);
                console.log(`🔧 Modèle redimensionné (trop grand, échelle: ${scale.toFixed(2)})`);
            } else if (maxDimension < 0.1) { // Si plus petit que 0.1 unité
                scale = 10; // Agrandir 10x
                gltfScene.scale.setScalar(scale);
                console.log(`🔧 Modèle redimensionné (trop petit, échelle: ${scale.toFixed(2)})`);
            }
        }

        // 🔧 GLB: Détecter si c'est un placement via construction tools AVANT nettoyage
        const wasPlacedViaConstructionTools = !!window.tempGLBPosition || !!window.tempGLBScale;
        
        // Appliquer une position personnalisée si définie (pour le placement via construction tools)
        if (window.tempGLBPosition) {
            // Appliquer la position Y du fantôme directement (elle est déjà correctement calculée)
            gltfScene.position.set(
                window.tempGLBPosition.x,
                window.tempGLBPosition.y, // Utiliser la position Y du fantôme
                window.tempGLBPosition.z
            );
            
            // Nettoyer après utilisation
            delete window.tempGLBPosition;
        }

        // 🔧 GLB: Appliquer la rotation personnalisée si définie (pour les rotations du fantôme)
        if (window.tempGLBRotation !== undefined && window.tempGLBRotation !== null) {
            gltfScene.rotation.y = window.tempGLBRotation;
            console.log('🔄 Rotation GLB appliquée:', window.tempGLBRotation);
            // Nettoyer après utilisation
            delete window.tempGLBRotation;
        }

        // 🔧 GLB: Appliquer l'échelle personnalisée si définie (pour les longueurs spécifiques)
        if (window.tempGLBScale) {
            gltfScene.scale.set(
                window.tempGLBScale.x,
                window.tempGLBScale.y,
                window.tempGLBScale.z
            );
            // Nettoyer après utilisation
            delete window.tempGLBScale;
        }

        // Compter et analyser les meshes
        let meshCount = 0;
        let materialCount = 0;
        
        // Activer les ombres et analyser le contenu
        gltfScene.traverse((child) => {
            if (child.isMesh) {
                meshCount++;
                child.castShadow = true;
                child.receiveShadow = true;
                child.visible = true; // S'assurer que le mesh est visible
                
                // Configurer les userData pour la sélection
                child.userData = {
                    ...child.userData,
                    element: gltfScene, // Référence vers l'élément GLB parent
                    isGLBMesh: true
                };
                
                // Ajouter edges pour voir les arêtes principales du claveau ET poutrain placé
                if (child.geometry && (specificGLBType.includes('claveau') || specificGLBType.includes('poutrain'))) {
                    const edgesGeometry = new window.THREE.EdgesGeometry(child.geometry);
                    const edgesMaterial = new window.THREE.LineBasicMaterial({ 
                        color: 0x666666, // Gris moyen pour les éléments placés
                        transparent: true,
                        opacity: 0.6,
                        linewidth: 1
                    });
                    const edges = new window.THREE.LineSegments(edgesGeometry, edgesMaterial);
                    
                    // Copier la transformation du mesh pour un alignement parfait
                    edges.position.copy(child.position);
                    edges.rotation.copy(child.rotation);
                    edges.scale.copy(child.scale);
                    
                    edges.userData = { isWireframe: true, parentElement: gltfScene };
                    child.parent.add(edges);
                }
                
                // S'assurer que les matériaux sont compatibles avec l'éclairage
                if (child.material) {
                    materialCount++;
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            if (mat.isMeshBasicMaterial) {
                                // Convertir en MeshLambertMaterial pour l'éclairage
                                const newMat = new window.THREE.MeshLambertMaterial({
                                    color: mat.color,
                                    map: mat.map,
                                    transparent: mat.transparent,
                                    opacity: mat.opacity
                                });
                                child.material = newMat;
                            }
                        });
                    } else if (child.material.isMeshBasicMaterial) {
                        const newMat = new window.THREE.MeshLambertMaterial({
                            color: child.material.color,
                            map: child.material.map,
                            transparent: child.material.transparent,
                            opacity: child.material.opacity
                        });
                        child.material = newMat;
                    }
                }
            }
        });

        // Diagnostic détaillé de la configuration des meshes pour la sélection
        gltfScene.traverse((child) => {
            if (child.isMesh) {
                // Mesh configuré pour la sélection
            }
        });

        // S'assurer que le modèle est visible
        gltfScene.visible = true;

        // Ajouter à la scène
        window.SceneManager.scene.add(gltfScene);
        
        // 🔧 CORRECTION: Utiliser SceneManager.addElement() pour déclencher
        // automatiquement l'événement elementPlaced et la gestion des éléments réutilisables
        if (window.SceneManager && typeof window.SceneManager.addElement === 'function') {
            // Calculer les dimensions du GLB pour AssiseManager
            const bbox = new THREE.Box3().setFromObject(gltfScene);
            const size = bbox.getSize(new THREE.Vector3());
            
            // Créer un objet WallElement compatible pour le GLB
            const fileNameToUse = fileName || gltfScene.name || 'Model';
            const isHourdis = fileNameToUse.toLowerCase().includes('hourdis');
            const isBlockhet = fileNameToUse.toLowerCase().includes('blochet');
            const isTool = isBlockhet || (window.tempGLBInfo && window.tempGLBInfo.path && window.tempGLBInfo.path.includes('/outils/'));
            
            // S'assurer que le nom du GLB est visible pour le métré
            if (!gltfScene.name) {
                gltfScene.name = fileNameToUse;
            }
            
            const glbElement = {
                id: gltfScene.id,
                type: 'glb',
                name: gltfScene.name,
                glbFileName: fileNameToUse, // Pour le métré
                glbType: isHourdis ? specificGLBType : (isTool ? (window.tempGLBInfo?.type || 'tool') : (window.tempGLBScale?.info?.type || 'unknown')),
                mesh: gltfScene,
                position: gltfScene.position,
                dimensions: {
                    length: size.x,
                    width: size.z,
                    height: size.y
                },
                userData: {
                    isGLB: true,
                    isTool: isTool, // Marquer comme outil
                    glbType: isHourdis ? specificGLBType : (isTool ? (window.tempGLBInfo?.type || 'tool') : (window.tempGLBScale?.info?.type || 'unknown')),
                    glbInfo: {
                        type: isHourdis ? specificGLBType : (isTool ? (window.tempGLBInfo?.type || 'tool') : (window.tempGLBScale?.info?.type || 'unknown')),
                        fileName: fileNameToUse,
                        isHourdis: isHourdis,
                        isTool: isTool
                    },
                    positionedByConstructionTools: wasPlacedViaConstructionTools, // Flag pour éviter le repositionnement
                    ...gltfScene.userData
                }
            };
            
            window.SceneManager.addElement(glbElement);
        } else {
            // Fallback: ajouter manuellement aux éléments si SceneManager.addElement n'est pas disponible
            if (window.SceneManager.elements) {
                if (typeof window.SceneManager.elements.set === 'function') {
                    // Si elements est une Map
                    window.SceneManager.elements.set(gltfScene.id, gltfScene);
                    console.log('📊 Modèle GLB ajouté aux éléments du SceneManager (Map)');
                } else if (typeof window.SceneManager.elements.add === 'function') {
                    // Si elements est un Set
                    window.SceneManager.elements.add(gltfScene);
                    console.log('📊 Modèle GLB ajouté aux éléments du SceneManager (Set)');
                } else if (Array.isArray(window.SceneManager.elements)) {
                    // Si elements est un Array
                    window.SceneManager.elements.push(gltfScene);
                    console.log('📊 Modèle GLB ajouté aux éléments du SceneManager (Array)');
                }
            }
            
            // Émettre manuellement l'événement elementPlaced
            document.dispatchEvent(new CustomEvent('elementPlaced', {
                detail: { element: gltfScene }
            }));
            console.log('📢 Événement elementPlaced émis manuellement pour GLB');
        }

        // Déclencher l'événement de changement de scène pour mettre à jour le métré
        document.dispatchEvent(new CustomEvent('sceneChanged', {
            detail: { 
                type: 'glb_imported',
                element: gltfScene,
                fileName: fileName
            }
        }));

        // 🔧 GLB: Déclencher l'événement elementPlaced pour les contrôles de hauteur (hourdis)
        if (wasPlacedViaConstructionTools) {
            // Ajouter à l'assise pour les GLB hourdis
            if (gltfScene.name && gltfScene.name.includes('hourdis') && window.AssiseManager) {
                // Marquer que cet élément a été positionné par le système de construction
                // pour éviter que l'assise-manager le repositionne
                gltfScene.userData.positionedByConstructionTools = true;
                
                window.AssiseManager.addElementToAssise(gltfScene.id);
            }
            
            // Préserver les informations GLB pour les éléments réutilisables
            if (window.tempGLBScale && window.tempGLBScale.info) {
                window.lastPlacedGLBInfo = window.tempGLBScale.info;
                console.log('📦 Informations GLB préservées pour éléments réutilisables:', window.lastPlacedGLBInfo);
            }
            
            // 🔧 CORRECTION: Ne pas émettre l'événement ici car SceneManager.addElement() l'émet déjà
            // document.dispatchEvent(new CustomEvent('elementPlaced', {
            //     detail: { element: gltfScene }
            // }));
            // console.log('📢 Événement elementPlaced déclenché pour GLB placé via construction tools');
        }

        // Forcer un rendu pour actualiser la scène
        if (window.SceneManager.renderer) {
            window.SceneManager.renderer.render(window.SceneManager.scene, window.SceneManager.camera);
        }

        // Optionnel: Centrer la caméra sur le modèle pour le voir (sauf pour les placements via construction tools)
        if (window.SceneManager.camera && window.SceneManager.controls && !wasPlacedViaConstructionTools) {
            const modelCenter = new window.THREE.Vector3();
            const finalBox = new window.THREE.Box3().setFromObject(gltfScene);
            finalBox.getCenter(modelCenter);
            
            // Positionner la caméra pour voir le modèle
            const distance = Math.max(size.x, size.y, size.z) * scale * 2;
            window.SceneManager.camera.position.set(
                modelCenter.x + distance,
                modelCenter.y + distance * 0.5,
                modelCenter.z + distance
            );
            
            // Si OrbitControls est disponible, centrer sur le modèle
            if (window.SceneManager.controls.target) {
                window.SceneManager.controls.target.copy(modelCenter);
                window.SceneManager.controls.update();
            }
            
            console.log('📷 Caméra repositionnée pour voir le modèle');
        } else if (wasPlacedViaConstructionTools) {
            // Repositionnement caméra ignoré - placement via outils de construction
        }

        // Afficher un résumé des objets dans la scène
        this.logSceneObjects();
    }

    /**
     * Afficher un résumé des objets dans la scène
     */
    logSceneObjects() {
        if (!window.SceneManager || !window.SceneManager.scene) {
            return;
        }

        const scene = window.SceneManager.scene;
        let totalObjects = 0;
        let glbModels = 0;
        let meshes = 0;
        let lights = 0;
        let cameras = 0;

        scene.traverse((child) => {
            totalObjects++;
            
            if (child.userData && child.userData.isGLB) {
                glbModels++;
            }
            
            if (child.isMesh) {
                meshes++;
            } else if (child.isLight) {
                lights++;
            } else if (child.isCamera) {
                cameras++;
            }
        });

        // Lister spécifiquement les modèles GLB
        const glbObjects = [];
        scene.traverse((child) => {
            if (child.userData && child.userData.isGLB) {
                glbObjects.push({
                    name: child.name,
                    fileName: child.userData.fileName,
                    position: {
                        x: child.position.x.toFixed(2),
                        y: child.position.y.toFixed(2),
                        z: child.position.z.toFixed(2)
                    },
                    visible: child.visible
                });
            }
        });

        if (glbObjects.length > 0) {
            // Modèles GLB dans la scène (log supprimé)
        }
    }

    // ===============================================
    // NETTOYAGE
    // ===============================================

    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
        console.log('🗃️ Gestionnaire de menu Fichier détruit');
    }

    /**
     * Importer un modèle GLB depuis un chemin spécifique (pour la bibliothèque)
     */
    importGLBFromPath(glbPath, glbName = 'Modèle GLB') {
        console.log(`📦 Import GLB depuis chemin: ${glbPath}`);
        
        // Créer un objet File-like depuis le chemin
        fetch(glbPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                // Créer un objet File à partir du blob
                const file = new File([blob], glbName + '.glb', { 
                    type: 'model/gltf-binary',
                    lastModified: Date.now()
                });
                
                // Utiliser la méthode d'import existante
                this.importGLB(file);
            })
            .catch(error => {
                console.error('❌ Erreur lors du chargement du fichier GLB:', error);
                alert(`Erreur lors du chargement du modèle GLB:\n${glbPath}\n\nVérifiez que le fichier existe.`);
            });
    }

    /**
     * Définir l'orientation pour l'export STL
     */
    setSTLOrientation(axis, degrees) {
        try {
            if (typeof SceneManager !== 'undefined' && SceneManager.setExportOrientation) {
                if (axis === 'none') {
                    SceneManager.setExportOrientation('x', 0, false);
                    const orientationDiv = document.getElementById('current-orientation');
                    if (orientationDiv) {
                        orientationDiv.textContent = 'Actuel: Original (sans rotation)';
                    }
                    console.log('🔧 Orientation STL: Original (sans rotation)');
                } else {
                    SceneManager.setExportOrientation(axis, degrees, true);
                    const orientationDiv = document.getElementById('current-orientation');
                    if (orientationDiv) {
                        orientationDiv.textContent = `Actuel: ${degrees > 0 ? '+' : ''}${degrees}°${axis.toUpperCase()}`;
                    }
                    console.log(`🔧 Orientation STL: ${degrees}° autour de ${axis.toUpperCase()}`);
                }
            } else {
                console.warn('⚠️ SceneManager.setExportOrientation non disponible');
            }
        } catch (error) {
            console.error('❌ Erreur changement orientation:', error);
        }
    }
}

// Initialisation automatique avec protection contre la duplication (Singleton)
document.addEventListener('DOMContentLoaded', () => {
    // Utiliser un flag global pour éviter les multiples initialisations
    if (window.FileMenuHandler_initialized) {
        return;
    }
    
    window.FileMenuHandler_initialized = true;
    window.FileMenuHandler = new FileMenuHandler();
    // console.log('🗃️ Gestionnaire de menu Fichier initialisé');
});

// Export pour utilisation externe
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileMenuHandler;
}
