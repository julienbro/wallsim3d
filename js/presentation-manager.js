/**
 * Gestionnaire de présentation PDF pour WallSim3D
 * Génère des rapports PDF avec différentes vues du modèle 3D
 */

class PresentationManager {
    constructor() {
        this.modal = null;
        this.isExporting = false;
        this.exportCount = 0; // Compteur pour traquer les exports
        this.initialized = false; // Flag pour éviter la re-initialisation
        this.currentProject = {
            title: 'Nom du projet à définir',
            designer: 'Nom du dessinateur',
            date: new Date(),
            version: '1.0'
        };
        
        this.init();
        
        // Nouvelles propriétés pour les coupes d'assises
        this.availableAssises = new Map(); // Map des assises disponibles par type
        this.selectedAssisesForExport = new Set(); // Set des assises sélectionnées pour export
        this.draggedItem = null; // Item actuellement en cours de drag
        
        // Nouvelles propriétés pour la gestion des pages à deux colonnes
        this.availablePages = new Map(); // Map des pages disponibles
        this.selectedPagesForExport = new Set(); // Set des pages sélectionnées pour export
        this.draggedPageItem = null; // Page actuellement en cours de drag
        

    }

    /**
     * Fonction utilitaire pour masquer/restaurer des éléments qui peuvent être des tableaux, Maps ou objets
     * @param {*} collection - La collection d'éléments (Array, Map, Object, ou élément unique)
     * @param {boolean} visible - true pour rendre visible, false pour masquer
     * @param {string} elementName - Nom de l'élément pour debug
     */
    setElementsVisibility(collection, visible, elementName = 'élément') {
        try {
            if (!collection) {

                return;
            }

            let processedCount = 0;

            if (Array.isArray(collection)) {
                // Si collection est un tableau
                collection.forEach(element => {
                    if (element && element.visible !== undefined) {
                        element.visible = visible;
                        processedCount++;
                    }
                });
            } else if (collection && typeof collection === 'object') {
                // Si collection est un Map ou un objet avec des valeurs
                if (collection.forEach) {
                    // Si c'est un Map ou Set
                    collection.forEach(element => {
                        if (element && element.visible !== undefined) {
                            element.visible = visible;
                            processedCount++;
                        }
                    });
                } else if (collection.values) {
                    // Si c'est un Map avec méthode values()
                    for (const element of collection.values()) {
                        if (element && element.visible !== undefined) {
                            element.visible = visible;
                            processedCount++;
                        }
                    }
                } else {
                    // Si c'est un objet simple, itérer sur les valeurs
                    Object.values(collection).forEach(element => {
                        if (element && element.visible !== undefined) {
                            element.visible = visible;
                            processedCount++;
                        }
                    });
                }
            } else {
                // Si collection est un seul objet
                if (collection.visible !== undefined) {
                    collection.visible = visible;
                    processedCount = 1;
                }
            }


        } catch (error) {

        }
    }

    init() {
        // Éviter la double initialisation
        if (this.initialized) {

            return;
        }
        
        // Attendre que le DOM soit chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
                this.forceDefaultScale();
                this.initialized = true;
            });
        } else {
            this.setupEventListeners();
            this.forceDefaultScale();
            this.initialized = true;
        }
    }

    // FACTEURS CORRECTIFS RÉINITIALISÉS - Force l'échelle par défaut standardisée
    forceDefaultScale() {
        // Utiliser la configuration réinitialisée si disponible
        const defaultScale = window.ScaleFactorsConfig ? 
            window.ScaleFactorsConfig.SCALE_CONFIG.DEFAULT_SCALES.top : '1:20';
        

        
        // Log de validation
        if (window.ScaleFactorsConfig) {

        }
    }

    setupEventListeners() {
        // Bouton Présenter
        const presentBtn = document.getElementById('presentBtn');
        if (presentBtn) {
            // Vérifier si l'événement existe déjà
            if (presentBtn._presentationEventAdded) {
                return;
            }
            
            presentBtn.addEventListener('click', () => {
                this.openModal();
            });
            
            // Marquer comme configuré
            presentBtn._presentationEventAdded = true;
        }

        // Bouton Impression 3D
        const print3dBtn = document.getElementById('print3dBtn');
        if (print3dBtn) {
            // Vérifier si l'événement existe déjà
            if (print3dBtn._print3dEventAdded) {
                return;
            }
            
            print3dBtn.addEventListener('click', () => {
                this.exportSTLForPrinting();
            });
            
            // Marquer comme configuré
            print3dBtn._print3dEventAdded = true;
        }

        // Fermeture de la modale
        const closeBtn = document.getElementById('closeModalBtn');
        const cancelBtn = document.getElementById('cancelExportBtn');

        if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());

        // Overlay pour fermer la modale
        const modal = document.getElementById('presentationModal');

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) {
                    this.closeModal();
                }
            });
        } else {

        }

        // Bouton de génération PDF
        const generateBtn = document.getElementById('generatePdfBtn');
        if (generateBtn) {
            // Supprimer les anciens listeners pour éviter les doublons
            generateBtn.replaceWith(generateBtn.cloneNode(true));
            const newGenerateBtn = document.getElementById('generatePdfBtn');
            newGenerateBtn.addEventListener('click', () => this.generatePDF());

        }

        // Gestionnaires pour la logique dynamique des échelles
        this.setupScaleLogic();

        // Gestionnaires pour les coupes d'assises
        this.setupAssiseCutsLogic();

        // Gestionnaires pour les pages à deux colonnes
        this.setupPagesLogic();

        // Note: Les champs projectTitle et designerName ont été supprimés de l'interface
        // Les valeurs par défaut sont utilisées directement dans getExportSettings()
    }

    /**
     * Configure la logique dynamique des options d'échelle selon les pages sélectionnées
     */
    setupScaleLogic() {
        // Plus besoin d'écouter les checkboxes car on utilise maintenant le système à deux colonnes
        // La logique d'échelle est maintenant gérée dans updateScaleVisibility()
    }

    /**
     * Met à jour la visibilité des options d'échelle selon les pages sélectionnées
     * NOTE: Cette fonction est simplifiée car les menus d'échelles ont été supprimés
     * Toutes les vues utilisent maintenant l'échelle fixe 1:20
     */
    updateScaleVisibility() {
        const topSelected = this.selectedPagesForExport.has('page2'); // Vue du dessus
        const elevationsSelected = (
            this.selectedPagesForExport.has('page3') || // front
            this.selectedPagesForExport.has('page4') || // left
            this.selectedPagesForExport.has('page5') || // right
            this.selectedPagesForExport.has('page6')    // back
        );

        // Plus besoin de gérer l'affichage des menus d'échelles car ils ont été supprimés
        // Toutes les vues utilisent maintenant l'échelle fixe 1:20


    }

    /**
     * Configure la logique des coupes d'assises
     */
    setupAssiseCutsLogic() {

        
        // Boutons de transfert
        const addBtn = document.getElementById('addAssiseToExport');
        const removeBtn = document.getElementById('removeAssiseFromExport');
        const addAllBtn = document.getElementById('addAllAssisesToExport');
        const removeAllBtn = document.getElementById('removeAllAssisesFromExport');

        if (addBtn) addBtn.addEventListener('click', () => this.addSelectedAssisesToExport());
        if (removeBtn) removeBtn.addEventListener('click', () => this.removeSelectedAssisesFromExport());
        if (addAllBtn) addAllBtn.addEventListener('click', () => this.addAllAssisesToExport());
        if (removeAllBtn) removeAllBtn.addEventListener('click', () => this.removeAllAssisesFromExport());

        // Configuration du drag & drop
        this.setupAssiseDragAndDrop();
    }

    /**
     * Configure la logique des pages à deux colonnes
     */
    setupPagesLogic() {

        
        // Boutons de transfert pour les pages
        const addPagesBtn = document.getElementById('addPagesToExport');
        const removePagesBtn = document.getElementById('removePagesFromExport');
        const addAllPagesBtn = document.getElementById('addAllPagesToExport');
        const removeAllPagesBtn = document.getElementById('removeAllPagesFromExport');

        if (addPagesBtn) addPagesBtn.addEventListener('click', () => this.addSelectedPagesToExport());
        if (removePagesBtn) removePagesBtn.addEventListener('click', () => this.removeSelectedPagesFromExport());
        if (addAllPagesBtn) addAllPagesBtn.addEventListener('click', () => this.addAllPagesToExport());
        if (removeAllPagesBtn) removeAllPagesBtn.addEventListener('click', () => this.removeAllPagesFromExport());

        // Configuration du drag & drop pour les pages
        this.setupPagesDragAndDrop();
    }

    /**
     * Charge les pages disponibles
     */
    loadAvailablePages() {

        
        this.availablePages.clear();

        // Définir toutes les pages disponibles
        const pages = [
            {
                id: 'page1',
                name: 'Vue Perspective',
                description: 'Vue perspective (zoom global)',
                type: 'view',
                checked: true
            },
            {
                id: 'page2',
                name: 'Vue du Dessus',
                description: 'Vue orthogonale du dessus',
                type: 'view',
                checked: true
            },
            {
                id: 'page3',
                name: 'Élévation Principale',
                description: 'Vue orthogonale - Élévation principale',
                type: 'view',
                checked: true
            },
            {
                id: 'page4',
                name: 'Élévation Gauche',
                description: 'Vue orthogonale - Élévation gauche',
                type: 'view',
                checked: true
            },
            {
                id: 'page5',
                name: 'Élévation Droite',
                description: 'Vue orthogonale - Élévation droite',
                type: 'view',
                checked: true
            },
            {
                id: 'page6',
                name: 'Élévation Arrière',
                description: 'Vue orthogonale - Élévation arrière',
                type: 'view',
                checked: true
            },
            {
                id: 'pageOperationMode',
                name: 'Mode Opératoire',
                description: 'Procédures et instructions de construction',
                type: 'document',
                checked: true
            },
            {
                id: 'pageMetrage',
                name: 'Métré',
                description: 'Tableau détaillé des quantités et matériaux',
                type: 'report',
                checked: true
            }
        ];

        // Ajouter les pages à la collection
        pages.forEach(page => {
            this.availablePages.set(page.id, page);
            if (page.checked) {
                this.selectedPagesForExport.add(page.id);
            }
        });


        this.renderPagesLists();
    }

    /**
     * Rend les listes de pages dans l'interface
     */
    renderPagesLists() {
        const availableContainer = document.getElementById('availablePages');
        const exportContainer = document.getElementById('exportPages');

        if (!availableContainer || !exportContainer) {

            return;
        }

        // Vider les conteneurs
        availableContainer.innerHTML = '';
        exportContainer.innerHTML = '';

        // Rendre les pages disponibles (non sélectionnées)
        for (const [pageId, page] of this.availablePages.entries()) {
            if (!this.selectedPagesForExport.has(pageId)) {
                const item = this.createPageItem(page);
                availableContainer.appendChild(item);
            }
        }

        // Rendre les pages sélectionnées pour l'export
        for (const [pageId, page] of this.availablePages.entries()) {
            if (this.selectedPagesForExport.has(pageId)) {
                const item = this.createPageItem(page);
                exportContainer.appendChild(item);
            }
        }
    }

    /**
     * Crée un élément HTML pour une page
     */
    createPageItem(page) {
        const item = document.createElement('div');
        item.className = 'page-item';
        item.draggable = true;
        item.dataset.pageId = page.id;
        item.dataset.pageType = page.type;

        // Badge de type
        const typeBadge = this.getPageTypeBadge(page.type);
        
        item.innerHTML = `
            <div class="page-info">
                <div class="page-name">
                    ${typeBadge} ${page.name}
                </div>
            </div>
        `;

        // Gestionnaires d'événements pour le drag & drop
        item.addEventListener('dragstart', (e) => this.handlePageDragStart(e));
        item.addEventListener('dragend', (e) => this.handlePageDragEnd(e));
        item.addEventListener('click', (e) => this.handlePageItemClick(e));

        return item;
    }

    /**
     * Obtient le badge de type pour une page
     */
    getPageTypeBadge(type) {
        const badges = {
            'view': '<span class="page-type-badge view">Vue</span>',
            'document': '<span class="page-type-badge document">Doc</span>',
            'report': '<span class="page-type-badge report">Rapport</span>'
        };

        return badges[type] || `<span class="page-type-badge">${type.toUpperCase()}</span>`;
    }

    /**
     * Configure le système de drag & drop pour les pages
     */
    setupPagesDragAndDrop() {
        const availableContainer = document.getElementById('availablePages');
        const exportContainer = document.getElementById('exportPages');

        if (!availableContainer || !exportContainer) return;

        // Gestionnaires pour le drop
        [availableContainer, exportContainer].forEach(container => {
            container.addEventListener('dragover', (e) => this.handlePageDragOver(e));
            container.addEventListener('drop', (e) => this.handlePageDrop(e));
            container.addEventListener('dragenter', (e) => this.handlePageDragEnter(e));
            container.addEventListener('dragleave', (e) => this.handlePageDragLeave(e));
        });
    }

    /**
     * Gestionnaires d'événements pour le drag & drop des pages
     */
    handlePageDragStart(e) {
        this.draggedPageItem = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
    }

    handlePageDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedPageItem = null;
    }

    handlePageDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handlePageDragEnter(e) {
        e.preventDefault();
        if (e.target.classList.contains('pages-list')) {
            e.target.classList.add('drag-over');
        }
    }

    handlePageDragLeave(e) {
        if (e.target.classList.contains('pages-list')) {
            e.target.classList.remove('drag-over');
        }
    }

    handlePageDrop(e) {
        e.preventDefault();
        
        const dropTarget = e.target.closest('.pages-list');
        if (!dropTarget || !this.draggedPageItem) return;

        dropTarget.classList.remove('drag-over');
        
        const pageId = this.draggedPageItem.dataset.pageId;
        const isExportList = dropTarget.classList.contains('export');

        if (isExportList) {
            this.selectedPagesForExport.add(pageId);
        } else {
            this.selectedPagesForExport.delete(pageId);
        }

        this.renderPagesLists();

    }

    handlePageItemClick(e) {
        e.target.classList.toggle('selected');
    }

    /**
     * Méthodes de transfert de pages
     */
    addSelectedPagesToExport() {
        const selectedItems = document.querySelectorAll('#availablePages .page-item.selected');
        selectedItems.forEach(item => {
            this.selectedPagesForExport.add(item.dataset.pageId);
        });
        this.renderPagesLists();
    }

    removeSelectedPagesFromExport() {
        const selectedItems = document.querySelectorAll('#exportPages .page-item.selected');
        selectedItems.forEach(item => {
            this.selectedPagesForExport.delete(item.dataset.pageId);
        });
        this.renderPagesLists();
    }

    addAllPagesToExport() {
        for (const [pageId, page] of this.availablePages.entries()) {
            this.selectedPagesForExport.add(pageId);
        }
        this.renderPagesLists();
    }

    removeAllPagesFromExport() {
        this.selectedPagesForExport.clear();
        this.renderPagesLists();
    }

    /**
     * Charge les assises disponibles depuis l'AssiseManager
     */
    loadAvailableAssises() {

        
        if (!window.AssiseManager) {

            return;
        }

        this.availableAssises.clear();

        // Parcourir tous les types d'assises
        for (const [type, assisesForType] of window.AssiseManager.assisesByType.entries()) {
            if (!this.availableAssises.has(type)) {
                this.availableAssises.set(type, []);
            }

            const typeAssises = this.availableAssises.get(type);
            
            for (const [index, assise] of assisesForType.entries()) {
                // Compter les éléments non-joints dans cette assise
                const elementCount = window.AssiseManager.getNonJointElementCountForType(type, index);
                
                // Ajouter seulement les assises qui contiennent des éléments
                if (elementCount > 0) {
                    typeAssises.push({
                        type: type,
                        index: index,
                        height: assise.height,
                        elementCount: elementCount,
                        id: `${type}_${index}` // ID unique pour chaque assise
                    });
                }
            }
        }


        this.renderAssiseLists();
    }

    /**
     * Rend les listes d'assises dans l'interface
     */
    renderAssiseLists() {
        const availableContainer = document.getElementById('availableAssises');
        const exportContainer = document.getElementById('exportAssises');

        if (!availableContainer || !exportContainer) {

            return;
        }

        // Vider les conteneurs
        availableContainer.innerHTML = '';
        exportContainer.innerHTML = '';

        // Rendre les assises disponibles
        for (const [type, assises] of this.availableAssises.entries()) {
            for (const assise of assises) {
                if (!this.selectedAssisesForExport.has(assise.id)) {
                    const item = this.createAssiseItem(assise);
                    availableContainer.appendChild(item);
                }
            }
        }

        // Rendre les assises sélectionnées pour l'export
        for (const [type, assises] of this.availableAssises.entries()) {
            for (const assise of assises) {
                if (this.selectedAssisesForExport.has(assise.id)) {
                    const item = this.createAssiseItem(assise);
                    exportContainer.appendChild(item);
                }
            }
        }
    }

    /**
     * Crée un élément HTML pour une assise
     */
    createAssiseItem(assise) {
        const item = document.createElement('div');
        item.className = 'assise-item';
        item.draggable = true;
        item.dataset.assiseId = assise.id;
        item.dataset.assiseType = assise.type;
        item.dataset.assiseIndex = assise.index;

        // Badge de type
        const typeBadge = this.getTypeBadge(assise.type);
        
        item.innerHTML = `
            <div class="assise-info">
                <div class="assise-name">
                    ${typeBadge} Assise ${assise.index + 1}
                </div>
                <div class="assise-details">
                    Hauteur: ${assise.height.toFixed(1)}cm • ${assise.elementCount} élément(s)
                </div>
            </div>
        `;

        // Gestionnaires d'événements pour le drag & drop
        item.addEventListener('dragstart', (e) => this.handleDragStart(e));
        item.addEventListener('dragend', (e) => this.handleDragEnd(e));
        item.addEventListener('click', (e) => this.handleAssiseItemClick(e));

        return item;
    }

    /**
     * Obtient le badge de type pour une assise
     */
    getTypeBadge(type) {
        const badges = {
            'brick': '<span class="assise-type-badge brick">Brique</span>',
            'M50': '<span class="assise-type-badge brick">M50</span>',
            'M57': '<span class="assise-type-badge brick">M57</span>',
            'M60': '<span class="assise-type-badge brick">M60</span>',
            'M65': '<span class="assise-type-badge brick">M65</span>',
            'M90': '<span class="assise-type-badge brick">M90</span>',
            'block': '<span class="assise-type-badge block">Bloc</span>',
            'insulation': '<span class="assise-type-badge insulation">Isolant</span>',
            'linteau': '<span class="assise-type-badge linteau">Linteau</span>'
        };

        return badges[type] || `<span class="assise-type-badge">${type.toUpperCase()}</span>`;
    }

    /**
     * Configure le système de drag & drop
     */
    setupAssiseDragAndDrop() {
        const availableContainer = document.getElementById('availableAssises');
        const exportContainer = document.getElementById('exportAssises');

        if (!availableContainer || !exportContainer) return;

        // Gestionnaires pour le drop
        [availableContainer, exportContainer].forEach(container => {
            container.addEventListener('dragover', (e) => this.handleDragOver(e));
            container.addEventListener('drop', (e) => this.handleDrop(e));
            container.addEventListener('dragenter', (e) => this.handleDragEnter(e));
            container.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        });
    }

    /**
     * Gestionnaires d'événements pour le drag & drop
     */
    handleDragStart(e) {
        this.draggedItem = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedItem = null;
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragEnter(e) {
        e.preventDefault();
        if (e.target.classList.contains('assise-list')) {
            e.target.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        if (e.target.classList.contains('assise-list')) {
            e.target.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        
        const dropTarget = e.target.closest('.assise-list');
        if (!dropTarget || !this.draggedItem) return;

        dropTarget.classList.remove('drag-over');
        
        const assiseId = this.draggedItem.dataset.assiseId;
        const isExportList = dropTarget.classList.contains('export');

        if (isExportList) {
            this.selectedAssisesForExport.add(assiseId);
        } else {
            this.selectedAssisesForExport.delete(assiseId);
        }

        this.renderAssiseLists();

    }

    handleAssiseItemClick(e) {
        e.target.classList.toggle('selected');
    }

    /**
     * Méthodes de transfert d'assises
     */
    addSelectedAssisesToExport() {
        const selectedItems = document.querySelectorAll('#availableAssises .assise-item.selected');
        selectedItems.forEach(item => {
            this.selectedAssisesForExport.add(item.dataset.assiseId);
        });
        this.renderAssiseLists();
    }

    removeSelectedAssisesFromExport() {
        const selectedItems = document.querySelectorAll('#exportAssises .assise-item.selected');
        selectedItems.forEach(item => {
            this.selectedAssisesForExport.delete(item.dataset.assiseId);
        });
        this.renderAssiseLists();
    }

    addAllAssisesToExport() {
        for (const [type, assises] of this.availableAssises.entries()) {
            for (const assise of assises) {
                this.selectedAssisesForExport.add(assise.id);
            }
        }
        this.renderAssiseLists();
    }

    removeAllAssisesFromExport() {
        this.selectedAssisesForExport.clear();
        this.renderAssiseLists();
    }

    openModal() {

        
        const modal = document.getElementById('presentationModal');
        if (modal) {
            // Afficher la modale avec z-index élevé pour dépasser les extensions de navigateur
            modal.style.display = 'flex';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100vw';
            modal.style.height = '100vh';
            modal.style.zIndex = '2147483648';  // Z-index élevé pour dépasser les extensions
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'; // Fond noir visible
            modal.style.visibility = 'visible';
            

            
            // S'assurer que le contenu est visible
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.position = 'relative';
                modalContent.style.zIndex = '2147483649'; // Encore plus élevé
                modalContent.style.opacity = '1';
                modalContent.style.animation = 'none';
                modalContent.style.transition = 'none';
                modalContent.style.transform = 'scale(1) translateY(0)';
                modalContent.style.background = '#ffffff';
                modalContent.style.border = '2px solid #dc3545';
                modalContent.style.borderRadius = '12px';
                modalContent.style.visibility = 'visible';
                
                // Forcer un reflow
                modalContent.offsetHeight;

            }
            
            // Mettre à jour la date
            this.currentProject.date = new Date();
            
            // Vérifier si jsPDF est chargé
            this.checkLibraries();
            
            // Mettre à jour la visibilité des échelles lors de l'ouverture
            this.updateScaleVisibility();
            
            // Charger les assises disponibles
            this.loadAvailableAssises();
            
            // Charger les pages disponibles
            this.loadAvailablePages();
            

            
            // Diagnostic rapide
            setTimeout(() => {
                const rect = modal.getBoundingClientRect();

            }, 100);
            
        } else {

        }
    }

    checkLibraries() {




        
        if (!this.checkJsPDFAvailable()) {

            this.loadRequiredLibraries().then(() => {

                // Ne pas rappeler checkLibraries pour éviter la boucle infinie
            }).catch(error => {

            });
        } else {

        }
    }

    closeModal() {
        const modal = document.getElementById('presentationModal');
        if (modal && !this.isExporting) {
            modal.style.display = 'none';
        }
    }

    async loadRequiredLibraries() {
        return new Promise((resolve, reject) => {
            // Vérifier si les bibliothèques sont déjà chargées
            if (this.checkJsPDFAvailable() && typeof html2canvas !== 'undefined') {
                resolve();
                return;
            }

            let loadedCount = 0;
            const totalLibraries = 2;

            const checkComplete = () => {
                loadedCount++;
                if (loadedCount === totalLibraries) {
                    // Attendre un peu pour s'assurer que les bibliothèques sont complètement initialisées
                    setTimeout(() => {
                        // Configurer jsPDF correctement après le chargement
                        this.setupJsPDF();
                        
                        resolve();
                    }, 200);
                }
            };

            // Charger jsPDF si nécessaire
            if (!this.checkJsPDFAvailable()) {
                const jspdfScript = document.createElement('script');
                jspdfScript.src = 'lib/jspdf/jspdf.umd.min.js';
                jspdfScript.onload = () => {

                    checkComplete();
                };
                jspdfScript.onerror = () => reject(new Error('Impossible de charger jsPDF'));
                document.head.appendChild(jspdfScript);
            } else {
                checkComplete();
            }

            // Charger html2canvas si nécessaire
            if (typeof html2canvas === 'undefined') {
                const html2canvasScript = document.createElement('script');
                html2canvasScript.src = 'lib/html2canvas/html2canvas.min.js';
                html2canvasScript.onload = () => {

                    checkComplete();
                };
                html2canvasScript.onerror = () => reject(new Error('Impossible de charger html2canvas'));
                document.head.appendChild(html2canvasScript);
            } else {
                checkComplete();
            }
        });
    }

    checkJsPDFAvailable() {
        return (typeof window.jsPDF !== 'undefined' && window.jsPDF !== null) ||
               (typeof window.jspdf !== 'undefined' && window.jspdf?.jsPDF) ||
               (typeof jsPDF !== 'undefined');
    }

    setupJsPDF() {
        // S'assurer que jsPDF est accessible via window.jsPDF
        if (!window.jsPDF) {
            if (window.jspdf?.jsPDF) {
                window.jsPDF = window.jspdf.jsPDF;

            } else if (typeof jsPDF !== 'undefined') {
                window.jsPDF = jsPDF;

            }
        }
    }

    /**
     * Désactive temporairement les aides visuelles pour un export PDF propre
     */
    disableVisualAidsForExport() {

        
        if (window.AssiseManager) {
            // Désactiver les points d'accroche s'ils sont activés
            if (window.AssiseManager.showAttachmentMarkers) {

                window.AssiseManager.showAttachmentMarkers = false;
                window.AssiseManager.updateAttachmentMarkers();
                window.AssiseManager.stopAttachmentPointAnimation();
            }
            
            // Désactiver le point de suivi s'il est activé
            if (window.AssiseManager.showSnapPoint) {

                window.AssiseManager.showSnapPoint = false;
                if (window.AssiseManager.snapPoint) {
                    window.AssiseManager.snapPoint.visible = false;
                }
            }
            
            // Désactiver les grilles d'assise si elles sont activées
            if (window.AssiseManager.showAssiseGrids) {

                window.AssiseManager.showAssiseGrids = false;
                
                // Masquer toutes les grilles
                for (const [type, gridsByAssise] of window.AssiseManager.gridHelpersByType.entries()) {
                    for (const [assiseIndex, grids] of gridsByAssise.entries()) {
                        if (grids && grids.main) {
                            grids.main.visible = false;
                        }
                    }
                }
            }
            

        } else {

        }
    }

    /**
     * Restaure les aides visuelles après l'export PDF
     */
    restoreVisualAidsAfterExport(initialState) {
        if (!initialState || !initialState.visualAids) {

            return;
        }
        

        const visualAids = initialState.visualAids;
        
        if (window.AssiseManager) {
            // Restaurer l'état des points d'accroche
            if (visualAids.showAttachmentMarkers !== null) {

                window.AssiseManager.showAttachmentMarkers = visualAids.showAttachmentMarkers;
                window.AssiseManager.updateAttachmentMarkers();
                
                if (visualAids.showAttachmentMarkers) {
                    window.AssiseManager.startAttachmentPointAnimation();
                }
            }
            
            // Restaurer l'état du point de suivi
            if (visualAids.showSnapPoint !== null) {

                window.AssiseManager.showSnapPoint = visualAids.showSnapPoint;
                
                if (window.AssiseManager.snapPoint) {
                    window.AssiseManager.snapPoint.visible = 
                        visualAids.showSnapPoint && visualAids.showAssiseGrids;
                }
            }
            
            // Restaurer l'état des grilles d'assise
            if (visualAids.showAssiseGrids !== null) {

                window.AssiseManager.showAssiseGrids = visualAids.showAssiseGrids;
                
                if (visualAids.showAssiseGrids) {
                    // Réactiver les grilles pour l'assise active du type actuel
                    const currentType = window.AssiseManager.currentType;
                    const currentAssise = window.AssiseManager.currentAssiseByType.get(currentType);
                    const gridsByAssise = window.AssiseManager.gridHelpersByType.get(currentType);
                    
                    if (gridsByAssise && gridsByAssise.has(currentAssise)) {
                        const grids = gridsByAssise.get(currentAssise);
                        if (grids && grids.main) {
                            grids.main.visible = true;
                        }
                    }
                }
            }
            
            // Mettre à jour les boutons du menu flottant si disponible
            if (window.FloatingAssiseMenu && window.FloatingAssiseMenu.updateVisualAidsButtons) {
                window.FloatingAssiseMenu.updateVisualAidsButtons();
            }
            

        } else {

        }
    }

    async generatePDF() {
        // Protection contre les appels multiples
        if (this.isExporting) {

            return;
        }

        // NOUVEAU: Sauvegarder l'état initial de la scène avant l'export
        const initialSceneState = this.saveInitialSceneState();

        try {
            this.isExporting = true;

            
            // Désactiver le bouton pendant l'export
            const generateBtn = document.getElementById('generatePdfBtn');
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.textContent = 'Génération en cours...';
            }
            
            this.showProgress('Préparation de l\'exportation...', 0);

            // NOUVEAU: Désactiver les aides visuelles avant l'export pour un PDF propre
            this.disableVisualAidsForExport();

            // Vérifier que les bibliothèques sont chargées
            await this.loadRequiredLibraries();

            // Vérifier à nouveau que jsPDF est disponible
            if (!this.checkJsPDFAvailable()) {
                throw new Error('jsPDF n\'est pas disponible après chargement');
            }

            // S'assurer que jsPDF est correctement configuré
            this.setupJsPDF();

            // Récupérer les paramètres de l'utilisateur
            const settings = this.getExportSettings();
            
            // Créer le document PDF - Accès robuste à jsPDF
            let pdf;
            try {
                if (window.jsPDF) {
                    pdf = new window.jsPDF('landscape', 'mm', 'a4');
                } else {
                    throw new Error('jsPDF non accessible');
                }
            } catch (e) {

                throw new Error('Impossible de créer le document PDF');
            }
            

            
            // Dimensions A4 paysage : 297 x 210 mm
            const pageWidth = 297;
            const pageHeight = 210;
            
            let pageCount = 0;
            const totalPages = this.getTotalPages(settings);

            // Générer chaque page demandée
            if (settings.pages.perspective) {
                await this.addPerspectivePage(pdf, pageWidth, pageHeight, ++pageCount, totalPages, settings);
                this.showProgress('Page perspective générée', (pageCount / totalPages) * 100);
            }

            if (settings.pages.top) {
                // CORRECTION PERMANENTE: Inversion corrigée
                await this.addOrthogonalPage(pdf, 'top', 'Vue du dessus', pageWidth, pageHeight, ++pageCount, totalPages, settings);
                this.showProgress('Vue du dessus générée', (pageCount / totalPages) * 100);
            }

            if (settings.pages.front) {
                // CORRECTION PERMANENTE: Inversion corrigée
                await this.addOrthogonalPage(pdf, 'front', 'Élévation principale', pageWidth, pageHeight, ++pageCount, totalPages, settings);
                this.showProgress('Élévation principale générée', (pageCount / totalPages) * 100);
            }

            if (settings.pages.left) {
                await this.addOrthogonalPage(pdf, 'left', 'Élévation gauche', pageWidth, pageHeight, ++pageCount, totalPages, settings);
                this.showProgress('Élévation gauche générée', (pageCount / totalPages) * 100);
            }

            if (settings.pages.right) {
                await this.addOrthogonalPage(pdf, 'right', 'Élévation droite', pageWidth, pageHeight, ++pageCount, totalPages, settings);
                this.showProgress('Élévation droite générée', (pageCount / totalPages) * 100);
            }

            if (settings.pages.back) {
                await this.addOrthogonalPage(pdf, 'back', 'Élévation arrière', pageWidth, pageHeight, ++pageCount, totalPages, settings);
                this.showProgress('Élévation arrière générée', (pageCount / totalPages) * 100);
            }

            // Ajouter les coupes d'assises si des assises sont sélectionnées
            if (this.selectedAssisesForExport.size > 0) {
                await this.addAssiseCutPages(pdf, pageWidth, pageHeight, pageCount, totalPages, settings);
                pageCount += this.selectedAssisesForExport.size;
            }

            // Ajouter la page de métré si sélectionnée
            if (settings.pages.metrage) {
                await this.addMetragePage(pdf, pageWidth, pageHeight, ++pageCount, totalPages, settings);
                this.showProgress('Page métré générée', (pageCount / totalPages) * 100);
            }

            // Ajouter la page de projet en dernière page si sélectionnée
            if (settings.pages.project) {
                await this.addProjectPage(pdf, pageWidth, pageHeight, ++pageCount, totalPages, settings);
                this.showProgress('Page de projet générée', (pageCount / totalPages) * 100);
            }

            // Finaliser et télécharger le PDF
            this.showProgress('Finalisation du PDF...', 100);
            
            // Générer un nom de fichier unique pour éviter les conflits
            this.exportCount++;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
            const fileName = `${settings.projectTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Presentation_${timestamp}.pdf`;
            

            pdf.save(fileName);

            this.showProgress('PDF généré avec succès !', 100);
            
            // NOUVEAU: Restaurer l'état initial de la scène
            this.restoreInitialSceneState(initialSceneState);
            this.restoreVisualAidsAfterExport(initialSceneState);

            
            // Fermer la modale après un délai
            setTimeout(() => {
                this.closeModal();
                this.hideProgress();
            }, 2000);

        } catch (error) {

            this.showProgress('Erreur lors de la génération', 0);
            alert('Une erreur est survenue lors de la génération du PDF. Consultez la console pour plus de détails.');
            
            // NOUVEAU: Restaurer l'état initial même en cas d'erreur
            this.restoreInitialSceneState(initialSceneState);
            this.restoreVisualAidsAfterExport(initialSceneState);

        } finally {
            this.isExporting = false;
            
            // Réactiver le bouton après l'export
            const generateBtn = document.getElementById('generatePdfBtn');
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Générer le PDF';
            }
            

        }
    }

    /**
     * Fonction de diagnostic rapide pour les coupes d'assises
     * Utilisation dans la console : presentationManager.quickDiagnoseCuts()
     */
    quickDiagnoseCuts() {

        
        // Vérifications de base
        const checks = {
            'AssiseManager': !!window.AssiseManager,
            'SceneManager': !!window.SceneManager,
            'generateTechnicalElevation': typeof this.generateTechnicalElevation === 'function',
            'saveCameraState': typeof this.saveCameraState === 'function',
            'restoreCameraState': typeof this.restoreCameraState === 'function',
            'saveAssiseState': typeof this.saveAssiseState === 'function',
            'restoreAssiseState': typeof this.restoreAssiseState === 'function'
        };
        
        // Compter les assises disponibles
        let totalAssises = 0;
        let types = [];
        
        if (window.AssiseManager && window.AssiseManager.assisesByType) {
            for (const [type, assisesForType] of window.AssiseManager.assisesByType.entries()) {
                types.push(type);
                totalAssises += assisesForType.size;
            }
        }
        

        
        // État des assises sélectionnées pour export
        
        return {
            checks,
            totalAssises,
            types,
            selectedCount: this.selectedAssisesForExport.size
        };
    }

    getExportSettings() {
        // Récupérer les informations du projet depuis l'onglet "Projet" de la barre latérale
        const projectNameElement = document.getElementById('projectName');
        const projectDesignerElement = document.getElementById('projectDesigner');
    // Sélecteur d'échelle orthogonale (vue du dessus + élévations)
    const orthoScaleSelect = document.getElementById('orthogonalScaleSelect');
    const orthoScale = orthoScaleSelect ? orthoScaleSelect.value : '1:20';
        
        return {
            projectTitle: projectNameElement ? (projectNameElement.value || 'Nom du projet à définir') : 'Nom du projet à définir',
            designerName: projectDesignerElement ? (projectDesignerElement.value || 'Nom du dessinateur') : 'Nom du dessinateur',
            pages: {
                perspective: this.selectedPagesForExport.has('page1'),
                top: this.selectedPagesForExport.has('page2'),
                front: this.selectedPagesForExport.has('page3'),
                left: this.selectedPagesForExport.has('page4'),
                right: this.selectedPagesForExport.has('page5'),
                back: this.selectedPagesForExport.has('page6'),
                project: this.selectedPagesForExport.has('pageOperationMode'),
                metrage: this.selectedPagesForExport.has('pageMetrage')
            },
            scales: {
                top: orthoScale,        // Échelle choisie pour la vue du dessus
                elevation: orthoScale   // Même échelle appliquée aux élévations
            },
            // Nouvelles données pour les coupes d'assises
            assiseCuts: Array.from(this.selectedAssisesForExport).map(assiseId => {
                const [type, indexStr] = assiseId.split('_');
                const index = parseInt(indexStr);
                const assises = this.availableAssises.get(type);
                return assises ? assises.find(a => a.index === index) : null;
            }).filter(Boolean)
        };
    }

    getTotalPages(settings) {
        let count = 0;
        Object.values(settings.pages).forEach(enabled => {
            if (enabled) count++;
        });
        
        // Ajouter le nombre d'assises sélectionnées pour les coupes
        count += this.selectedAssisesForExport.size;
        
        return count;
    }

    async addPerspectivePage(pdf, pageWidth, pageHeight, pageNum, totalPages, settings) {
        // Si ce n'est pas la première page, ajouter une nouvelle page
        if (pageNum > 1) {
            pdf.addPage();
        }

        // Fond blanc
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');

        // En-tête avec informations du projet
        this.addHeader(pdf, pageWidth, settings, 'Vue Perspective');

        // Capturer la vue 3D actuelle
        const canvas = await this.captureCurrentView('perspective');
        if (canvas && canvas.width > 0 && canvas.height > 0) {
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            // Calculer les dimensions et position de l'image - Optimisé pour maximiser l'espace
            const margin = 15; // Marges réduites pour plus d'espace
            const headerHeight = 30; // Restaurer l'en-tête
            const footerHeight = 15;
            const viewNameHeight = 15;
            const availableHeight = pageHeight - headerHeight - footerHeight - viewNameHeight - (margin * 2);
            const availableWidth = pageWidth - (margin * 2);
            
            // Maintenir le ratio d'aspect mais prioriser la largeur
            const imgRatio = canvas.width / canvas.height;
            let imgWidth = availableWidth; // Utiliser toute la largeur disponible
            let imgHeight = imgWidth / imgRatio;
            
            // Si la hauteur dépasse, ajuster en gardant le ratio mais en maximisant la taille
            if (imgHeight > availableHeight) {
                imgHeight = availableHeight;
                imgWidth = imgHeight * imgRatio;
            }
            
            const imgX = (pageWidth - imgWidth) / 2;
            const imgY = headerHeight + margin;
            
            pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth, imgHeight);

        } else {
            // Ajouter un message d'erreur si pas d'image
            pdf.setFontSize(12);
            pdf.setTextColor(255, 0, 0);
            pdf.text('❌ Erreur de capture de la vue perspective', pageWidth/2, pageHeight/2, { align: 'center' });

        }

        // Nom de la vue (centré sous l'image)
        this.addViewName(pdf, pageWidth, pageHeight, 'Vue Perspective', null);

        // Pied de page
        await this.addFooter(pdf, pageWidth, pageHeight, pageNum, totalPages);
    }

    async addOrthogonalPage(pdf, viewType, viewName, pageWidth, pageHeight, pageNum, totalPages, settings) {
        // Ajouter une nouvelle page
        pdf.addPage();

        // Fond blanc
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');

        // En-tête avec informations du projet
        this.addHeader(pdf, pageWidth, settings, viewName);

        // Désactiver temporairement les calques cotations et textes pour les vues d'élévation
        let originalCotationsVisible = null;
        let originalTextesVisible = null;
        const isElevationView = ['front', 'left', 'right', 'back'].includes(viewType);
        
        if (isElevationView && window.LayerManager) {
            
            // Sauvegarder l'état actuel des calques
            originalCotationsVisible = window.LayerManager.layers.cotations ? window.LayerManager.layers.cotations.visible : null;
            originalTextesVisible = window.LayerManager.layers.textes ? window.LayerManager.layers.textes.visible : null;
            
            
            // Désactiver les calques pour une vue d'élévation plus propre
            if (window.LayerManager.layers.cotations && window.LayerManager.layers.cotations.visible) {

                window.LayerManager.toggleLayerVisibility('cotations');
            }
            if (window.LayerManager.layers.textes && window.LayerManager.layers.textes.visible) {

                window.LayerManager.toggleLayerVisibility('textes');
            }
        } else {
            
        }

        // Générer une vraie élévation technique 2D au lieu d'une capture 3D

        
        // Test simple des calques pour debugging
        if (isElevationView && window.LayerManager) {



        }
        
        const exportScale = viewType === 'top' ? settings.scales.top : settings.scales.elevation;

        
        const canvas = await this.generateTechnicalElevation(viewType, exportScale);
        
        if (canvas && canvas.width > 0 && canvas.height > 0) {
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            // Calculer les dimensions et position de l'image - Optimisé pour maximiser l'espace
            const margin = 15; // Marges réduites pour plus d'espace
            const headerHeight = 30; // Restaurer l'en-tête
            const footerHeight = 15;
            const viewNameHeight = 15;
            const availableHeight = pageHeight - headerHeight - footerHeight - viewNameHeight - (margin * 2);
            const availableWidth = pageWidth - (margin * 2);
            
            // Maintenir le ratio d'aspect mais prioriser la largeur pour les élévations techniques
            const imgRatio = canvas.width / canvas.height;
            let imgWidth = availableWidth; // Utiliser toute la largeur disponible
            let imgHeight = imgWidth / imgRatio;
            
            // Si la hauteur dépasse, ajuster en gardant le ratio mais en maximisant la taille
            if (imgHeight > availableHeight) {
                imgHeight = availableHeight;
                imgWidth = imgHeight * imgRatio;
            }
            
            // Centrer l'image
            const imgX = (pageWidth - imgWidth) / 2;
            const imgY = headerHeight + margin;
            
            pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth, imgHeight);

        } else {
            // Fallback: Capturer la vue orthogonale classique si l'élévation technique échoue

            const fallbackCanvas = await this.captureCurrentView(viewType);
            
            if (fallbackCanvas && fallbackCanvas.width > 0 && fallbackCanvas.height > 0) {
                const imgData = fallbackCanvas.toDataURL('image/jpeg', 0.95);
                
                // Dimensions optimisées pour maximiser l'espace
                const margin = 15; // Marges réduites
                const headerHeight = 30; // Restaurer l'en-tête
                const footerHeight = 15;
                const viewNameHeight = 15;
                const availableHeight = pageHeight - headerHeight - footerHeight - viewNameHeight - (margin * 2);
                const availableWidth = pageWidth - (margin * 2);
                
                const imgRatio = fallbackCanvas.width / fallbackCanvas.height;
                let imgWidth = availableWidth; // Utiliser toute la largeur
                let imgHeight = imgWidth / imgRatio;
                
                if (imgHeight > availableHeight) {
                    imgHeight = availableHeight;
                    imgWidth = imgHeight * imgRatio;
                }
                
                const imgX = (pageWidth - imgWidth) / 2;
                const imgY = headerHeight + margin;
                
                pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth, imgHeight);

            } else {
                // Ajouter un message d'erreur si pas d'image
                pdf.setFontSize(12);
                pdf.setTextColor(255, 0, 0);
                pdf.text(`❌ Erreur de capture de la vue ${viewType}`, pageWidth/2, pageHeight/2, { align: 'center' });

            }
        }

        // Nom de la vue avec échelle
        const scale = viewType === 'top' ? settings.scales.top : settings.scales.elevation;
        this.addViewName(pdf, pageWidth, pageHeight, viewName, scale);

        // Pied de page
        await this.addFooter(pdf, pageWidth, pageHeight, pageNum, totalPages);
        
        // Restaurer l'état original des calques si ils avaient été modifiés
        if (isElevationView && window.LayerManager) {
            if (window.LayerManager.layers.cotations && originalCotationsVisible !== null && originalCotationsVisible !== window.LayerManager.layers.cotations.visible) {

                window.LayerManager.toggleLayerVisibility('cotations');
            }
            if (window.LayerManager.layers.textes && originalTextesVisible !== null && originalTextesVisible !== window.LayerManager.layers.textes.visible) {

                window.LayerManager.toggleLayerVisibility('textes');
            }
        }
    }

    /**
     * Ajoute les pages de coupes d'assises au PDF
     */
    async addAssiseCutPages(pdf, pageWidth, pageHeight, currentPageCount, totalPages, settings) {

        
        let pageCount = currentPageCount;
        let successCount = 0;
        let errorCount = 0;
        
        for (const assise of settings.assiseCuts) {
            try {

                await this.addAssiseCutPage(pdf, assise, pageWidth, pageHeight, ++pageCount, totalPages, settings);
                successCount++;

                this.showProgress(`Coupe assise ${assise.index + 1} (${assise.type}) générée`, (pageCount / totalPages) * 100);
            } catch (error) {
                errorCount++;

                
                // Ajouter une page d'erreur au lieu de faire planter tout le PDF
                try {
                    pdf.addPage();
                    pdf.setFillColor(255, 255, 255);
                    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
                    
                    // En-tête d'erreur
                    const errorTitle = `❌ Erreur - Coupe Assise ${assise.index + 1}`;
                    this.addHeader(pdf, pageWidth, settings, errorTitle);
                    
                    // Message d'erreur centré
                    pdf.setFontSize(14);
                    pdf.setTextColor(255, 0, 0);
                    pdf.text(`Impossible de générer la coupe pour l'assise ${assise.index + 1}`, pageWidth/2, pageHeight/2 - 10, { align: 'center' });
                    pdf.setFontSize(10);
                    pdf.text(`Type: ${assise.type} | Erreur: ${error.message}`, pageWidth/2, pageHeight/2 + 5, { align: 'center' });
                    pdf.text(`Consultez la console du navigateur pour plus de détails`, pageWidth/2, pageHeight/2 + 15, { align: 'center' });
                    
                    await this.addFooter(pdf, pageWidth, pageHeight, pageCount, totalPages);

                } catch (pageError) {

                }
                
                this.showProgress(`❌ Erreur coupe assise ${assise.index + 1}`, (pageCount / totalPages) * 100);
            }
        }
        
        // Résumé final

        if (errorCount > 0) {

        }
    }

    /**
     * Ajoute une page de coupe d'assise spécifique
     */
    async addAssiseCutPage(pdf, assise, pageWidth, pageHeight, pageNum, totalPages, settings) {
        // Ajouter une nouvelle page
        pdf.addPage();

        // Fond blanc
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');

        // En-tête avec informations du projet
        const cutTitle = `Coupe horizontale - Niveau ${assise.height.toFixed(1)}cm`;
        this.addHeader(pdf, pageWidth, settings, cutTitle);

        // Sauvegarder l'état actuel de la caméra et de l'assise (avec gestion d'erreur)
        let originalCameraState = null;
        let originalAssiseState = null;
        
        try {
            originalCameraState = this.saveCameraState();

        } catch (error) {

        }
        
        try {
            originalAssiseState = this.saveAssiseState();

        } catch (error) {

        }
        
        let hiddenElements = []; // Initialiser en dehors du try pour éviter les erreurs dans finally

        try {
            // Basculer vers le bon type d'assise
            if (window.AssiseManager && window.AssiseManager.setCurrentType) {
                window.AssiseManager.setCurrentType(assise.type);
                window.AssiseManager.setActiveAssiseForType(assise.type, assise.index);
            }

            // Attendre un peu pour que les changements s'appliquent
            await new Promise(resolve => setTimeout(resolve, 500));

            // Configurer une vue du dessus avec zoom sur l'assise et masquer les assises inférieures
            hiddenElements = await this.setupAssiseCutView(assise);

            // FORCER L'ÉCHELLE IDENTIQUE À LA VUE DU DESSUS - Utiliser la même configuration
            const forcedScale = '1:20'; // Échelle fixe identique à la vue du dessus

            
            // Attendre un moment supplémentaire pour s'assurer que la vue est stabilisée
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Générer une élévation technique propre avec masquage des grilles et sol
            const canvas = await this.generateTechnicalElevation('top', forcedScale);
            
            if (canvas && canvas.width > 0 && canvas.height > 0) {
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                
                // Calculer les dimensions et position de l'image
                const margin = 15;
                const headerHeight = 30;
                const footerHeight = 15;
                const viewNameHeight = 15;
                const availableHeight = pageHeight - headerHeight - footerHeight - viewNameHeight - (margin * 2);
                const availableWidth = pageWidth - (margin * 2);
                
                const imgRatio = canvas.width / canvas.height;
                let imgWidth = availableWidth;
                let imgHeight = imgWidth / imgRatio;
                
                if (imgHeight > availableHeight) {
                    imgHeight = availableHeight;
                    imgWidth = imgHeight * imgRatio;
                }
                
                const imgX = (pageWidth - imgWidth) / 2;
                const imgY = headerHeight + margin;
                
                pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth, imgHeight);

            } else {
                // Ajouter un message d'erreur si pas d'image
                pdf.setFontSize(12);
                pdf.setTextColor(255, 0, 0);
                pdf.text(`❌ Erreur de capture de la coupe d'assise ${assise.index + 1}`, pageWidth/2, pageHeight/2, { align: 'center' });

            }

        } catch (error) {


            
            // Diagnostics supplémentaires






            
            // Ajouter un message d'erreur dans le PDF
            try {
                pdf.setFontSize(12);
                pdf.setTextColor(255, 0, 0);
                pdf.text(`❌ Erreur coupe assise ${assise.index + 1}: ${error.message}`, pageWidth/2, pageHeight/2, { align: 'center' });
                pdf.text(`Consultez la console pour plus de détails`, pageWidth/2, pageHeight/2 + 10, { align: 'center' });
            } catch (pdfError) {

            }
        } finally {
            // Restaurer la visibilité des éléments masqués (avec gestion d'erreur)
            try {
                if (hiddenElements && hiddenElements.length > 0) {
                    this.restoreHiddenElements(hiddenElements);
                } else {

                    // Forcer la restauration du plateau et des grilles même si hiddenElements est vide
                    this.restorePlateauAndGridsAfterCut();
                }
            } catch (restoreError) {

            }
            
            // Restaurer l'état original (avec gestion d'erreur)
            try {
                if (originalCameraState) {
                    this.restoreCameraState(originalCameraState);
                } else {

                }
            } catch (cameraError) {

            }
            
            try {
                if (originalAssiseState) {
                    this.restoreAssiseState(originalAssiseState);
                } else {

                }
            } catch (assiseError) {

            }
        }

        // Nom de la vue avec détails de l'assise et échelle
        const cutScale = '1:20'; // Même échelle forcée que la vue du dessus
        const viewDetails = `Coupe horizontale à ${assise.height.toFixed(1)}cm - Tous éléments à ce niveau`;
        this.addViewName(pdf, pageWidth, pageHeight, cutTitle, cutScale, viewDetails);

        // Pied de page
        await this.addFooter(pdf, pageWidth, pageHeight, pageNum, totalPages);
    }

    /**
     * Configure la vue pour une coupe d'assise
     */
    async setupAssiseCutView(assise) {

        
        // Masquer les éléments des autres hauteurs pour une vraie coupe horizontale
        const hiddenElements = this.hideElementsBelowAssise(assise);
        
        // Masquer le plateau et les grilles pour une coupe propre
        this.hidePlateauAndGridsForCut();
        
        // Passer en vue avant au lieu de vue arrière pour coupe
        if (window.modernInterface && window.modernInterface.setCameraView) {
            window.modernInterface.setCameraView('front');

        }

        // Attendre que la vue soit appliquée
        await new Promise(resolve => setTimeout(resolve, 300));

        // Puis basculer vers vue du dessus après stabilisation
        if (window.modernInterface && window.modernInterface.setCameraView) {
            window.modernInterface.setCameraView('top');

        }

        // CORRECTION SIMPLE: Rotation 180° directe de la vue du dessus
        // Approche simplifiée pour corriger l'orientation de la coupe
        if (window.SceneManager && window.SceneManager.camera) {
            const camera = window.SceneManager.camera;
            const controls = window.SceneManager.controls;
            
            // Sauvegarder la position actuelle
            const currentPos = camera.position.clone();
            let currentTarget = new THREE.Vector3(0, 0, 0);
            
            if (controls && controls.target) {
                currentTarget.copy(controls.target);
            }
            
            // Rotation simple de 180° autour du centre
            const centerX = currentTarget.x;
            const centerZ = currentTarget.z;
            
            // Inverser X et Z par rapport au centre (rotation 180°)
            const newX = centerX + (centerX - currentPos.x);
            const newZ = centerZ + (centerZ - currentPos.z);
            
            // Appliquer la nouvelle position
            camera.position.set(newX, currentPos.y, newZ);
            camera.lookAt(currentTarget.x, currentTarget.y, currentTarget.z);
            
            // Mettre à jour les contrôles
            if (controls && controls.update) {
                controls.update();
            }
            

        }

        // Définir la position Y de coupe au milieu des briques de l'assise
        const cutY = assise.height; // Hauteur de l'assise


        // Retourner les éléments masqués pour pouvoir les restaurer
        return hiddenElements;
    }

    /**
     * Calcule le centre géométrique des éléments d'une assise
     */
    calculateAssiseCenter(assise) {

        
        if (!window.AssiseManager || !window.SceneManager) {

            return null;
        }

        const assisesForType = window.AssiseManager.assisesByType.get(assise.type);
        if (!assisesForType) {


            return null;
        }
        
        if (!assisesForType.has(assise.index)) {


            return null;
        }

        const assiseData = assisesForType.get(assise.index);
        const elements = Array.from(assiseData.elements);
        

        
        if (elements.length === 0) {

            return null;
        }

        let totalX = 0, totalZ = 0;
        let validCount = 0;
        let invalidElements = [];

        elements.forEach((elementId, index) => {
            const element = window.SceneManager.elements.get(elementId);
            if (element && element.mesh && element.mesh.position) {
                totalX += element.mesh.position.x;
                totalZ += element.mesh.position.z;
                validCount++;
                
                if (index < 3) { // Log des 3 premiers pour debug

                }
            } else {
                invalidElements.push(elementId);
            }
        });

        if (invalidElements.length > 0) {

        }

        if (validCount === 0) {

            return null;
        }

        const center = {
            x: totalX / validCount,
            y: assise.height,
            z: totalZ / validCount
        };
        


        return center;
    }

    /**
     * Obtient le nom d'affichage pour un type d'assise
     */
    getTypeDisplayName(type) {
        const displayNames = {
            'brick': 'Brique',
            'M50': 'Brique M50',
            'M57': 'Brique M57',
            'M60': 'Brique M60',
            'M65': 'Brique M65',
            'M90': 'Brique M90',
            'block': 'Bloc',
            'insulation': 'Isolant',
            'linteau': 'Linteau'
        };

        return displayNames[type] || type.toUpperCase();
    }

    /**
     * Sauvegarde l'état actuel de l'assise
     */
    saveAssiseState() {
        if (!window.AssiseManager) return null;

        return {
            currentType: window.AssiseManager.currentType,
            currentAssiseByType: new Map(window.AssiseManager.currentAssiseByType)
        };
    }

    /**
     * Restaure l'état de l'assise
     */
    restoreAssiseState(state) {
        if (!state || !window.AssiseManager) return;

        try {
            window.AssiseManager.setCurrentType(state.currentType);
            for (const [type, assiseIndex] of state.currentAssiseByType.entries()) {
                window.AssiseManager.setActiveAssiseForType(type, assiseIndex);
            }
        } catch (error) {

        }
    }

    /**
     * Masque le plateau et les grilles pour des coupes propres
     */
    hidePlateauAndGridsForCut() {

        
        // Masquer le plateau (groundFloor)
        if (window.SceneManager && window.SceneManager.groundFloor) {
            window.SceneManager.groundFloor.visible = false;

        }
        
        // Masquer la grille principale
        if (window.SceneManager && window.SceneManager.grid) {
            window.SceneManager.grid.visible = false;

        }
        
        // Masquer les axes
        if (window.SceneManager && window.SceneManager.axesHelper) {
            window.SceneManager.axesHelper.visible = false;

        }
        
        // Masquer toutes les grilles d'assises
        if (window.AssiseManager) {
            for (const [type, gridsByAssise] of window.AssiseManager.gridHelpersByType.entries()) {
                for (const [assiseIndex, grids] of gridsByAssise.entries()) {
                    this.setElementsVisibility(grids, false, `grille d'assise ${assiseIndex + 1} (${type})`);
                }
            }

            
            // Masquer les points d'accroche d'assises
            if (window.AssiseManager.snapPoint) {
                window.AssiseManager.snapPoint.visible = false;
            }
            
            // Masquer tous les marqueurs d'attachement
            for (const [type, markersByAssise] of window.AssiseManager.attachmentMarkersByType.entries()) {
                for (const [assiseIndex, markers] of markersByAssise.entries()) {
                    this.setElementsVisibility(markers, false, `marqueur d'attachement ${assiseIndex + 1} (${type})`);
                }
            }

        }
        
        // Masquer la rose des vents
        if (window.SceneManager && window.SceneManager.northArrowGroup) {
            window.SceneManager.northArrowGroup.visible = false;

        }
        
        // Masquer les éléments fantômes (briques en cours de placement)
        if (window.ConstructionTools && window.ConstructionTools.ghostElement && window.ConstructionTools.ghostElement.mesh) {
            window.ConstructionTools.ghostElement.mesh.visible = false;

        }
        
        // Masquer les suggestions de placement
        if (window.ConstructionTools && window.ConstructionTools.deactivateSuggestions) {
            window.ConstructionTools.deactivateSuggestions();

        }
        
        // Masquer les outils de mesure si présents
        if (window.MeasurementTool) {
            if (window.MeasurementTool.measurements) {
                window.MeasurementTool.measurements.forEach(measurement => {
                    if (measurement.line) measurement.line.visible = false;
                    if (measurement.label) measurement.label.visible = false;
                });

            }
        }
    }

    /**
     * Restaure la visibilité du plateau et des grilles après une coupe
     */
    restorePlateauAndGridsAfterCut() {

        
        // Restaurer le plateau (groundFloor)
        if (window.SceneManager && window.SceneManager.groundFloor) {
            window.SceneManager.groundFloor.visible = true;

        }
        
        // Restaurer la grille principale selon les préférences
        if (window.SceneManager && window.SceneManager.grid) {
            window.SceneManager.grid.visible = window.SceneManager.showGrid;

        }
        
        // Restaurer les axes selon les préférences
        if (window.SceneManager && window.SceneManager.axesHelper) {
            window.SceneManager.axesHelper.visible = window.SceneManager.showAxes;

        }
        
        // Restaurer les grilles d'assises selon l'état du gestionnaire
        if (window.AssiseManager && window.AssiseManager.showAssiseGrids) {
            window.AssiseManager.updateAllGridVisibility();

            
            // Restaurer le point d'accroche si activé
            if (window.AssiseManager.snapPoint && window.AssiseManager.showSnapPoint) {
                window.AssiseManager.snapPoint.visible = true;
            }
            
            // Restaurer les marqueurs d'attachement si activés
            if (window.AssiseManager.showAttachmentMarkers) {
                for (const [type, markersByAssise] of window.AssiseManager.attachmentMarkersByType.entries()) {
                    for (const [assiseIndex, markers] of markersByAssise.entries()) {
                        this.setElementsVisibility(markers, true, `marqueur d'attachement ${assiseIndex + 1} (${type})`);
                    }
                }
            }
        }
        
        // Restaurer la rose des vents (généralement visible)
        if (window.SceneManager && window.SceneManager.northArrowGroup) {
            window.SceneManager.northArrowGroup.visible = true;

        }
        
        // Restaurer les éléments fantômes selon l'état des outils de construction
        if (window.ConstructionTools && window.ConstructionTools.ghostElement && window.ConstructionTools.ghostElement.mesh) {
            // Ne restaurer l'élément fantôme que s'il était activé avant et qu'on n'est pas en mode suggestions
            if (window.ConstructionTools.isActive && !window.ConstructionTools.activeBrickForSuggestions) {
                window.ConstructionTools.ghostElement.mesh.visible = true;
            }
        }
        
        // Les suggestions de placement se réactiveront automatiquement si nécessaire
        
        // Restaurer les outils de mesure si ils étaient actifs
        if (window.MeasurementTool && window.MeasurementTool.isActive) {
            if (window.MeasurementTool.measurements) {
                window.MeasurementTool.measurements.forEach(measurement => {
                    if (measurement.line) measurement.line.visible = true;
                    if (measurement.label) measurement.label.visible = true;
                });
            }
        }
    }

    /**
     * Masque tous les éléments SAUF ceux à la même hauteur que l'assise coupée
     * (pour voir tous les éléments au niveau de coupe, peu importe leur type)
     */
    hideElementsBelowAssise(targetAssise) {

        
        if (!window.SceneManager || !window.SceneManager.scene || !window.AssiseManager) {

            return [];
        }

        const hiddenElements = [];
        const targetHeight = targetAssise.height;
        const tolerance = 1.0; // Tolérance de 1cm pour les variations de hauteur



        // Méthode 1: Masquage par assise via AssiseManager - MASQUER PAR HAUTEUR
        if (window.AssiseManager.assisesByType) {
            // Parcourir TOUS les types d'assises
            for (const [type, assisesForType] of window.AssiseManager.assisesByType.entries()) {
                for (const [assiseIndex, assiseData] of assisesForType.entries()) {
                    const assiseHeight = assiseData.height;
                    
                    // Masquer les assises qui ne sont PAS à la même hauteur (avec tolérance)
                    const shouldHide = Math.abs(assiseHeight - targetHeight) > tolerance;
                    
                    if (shouldHide) {

                        
                        // Masquer tous les éléments de cette assise
                        for (const elementId of assiseData.elements) {
                            const element = window.SceneManager.elements.get(elementId);
                            if (element && element.mesh && element.mesh.visible) {
                                hiddenElements.push({
                                    object: element.mesh,
                                    wasVisible: true,
                                    elementId: elementId,
                                    assiseIndex: assiseIndex,
                                    assiseType: type,
                                    assiseHeight: assiseHeight,
                                    reason: 'different_height'
                                });
                                element.mesh.visible = false;

                            }
                        }
                    } else {

                    }
                }
            }
        }


        return hiddenElements;
    }

    /**
     * Restaure la visibilité des éléments précédemment masqués
     */
    restoreHiddenElements(hiddenElements) {
        if (!hiddenElements || hiddenElements.length === 0) return;


        
        let restoredCount = 0;
        hiddenElements.forEach((hiddenInfo) => {
            if (hiddenInfo.object && hiddenInfo.wasVisible) {
                hiddenInfo.object.visible = true;
                restoredCount++;
                
                if (hiddenInfo.elementId && hiddenInfo.assiseIndex !== undefined) {

                }
            }
        });

        // Restaurer aussi le plateau et les grilles après coupe
        this.restorePlateauAndGridsAfterCut();


    }

    async addProjectPage(pdf, pageWidth, pageHeight, pageNum, totalPages, settings) {
        // Ajouter une nouvelle page si ce n'est pas la première page
        if (pageNum > 1) {
            pdf.addPage();
        }

        // Fond blanc pour la page de mode opératoire
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');

        const margin = 20;
        let currentY = 25; // Position Y courante

        // Titre principal de la page
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(44, 62, 80); // Couleur moderne
        const mainTitle = 'MODE OPÉRATOIRE';
        const mainTitleWidth = pdf.getTextWidth(mainTitle);
        pdf.text(mainTitle, (pageWidth - mainTitleWidth) / 2, currentY);
        
        // Ligne de soulignement sous le titre principal
        const underlineY = currentY + 2;
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(52, 152, 219); // Bleu moderne
        pdf.line((pageWidth - mainTitleWidth) / 2 - 10, underlineY, (pageWidth + mainTitleWidth) / 2 + 10, underlineY);
        
        currentY += 20;

        // Récupérer les données du projet
        const projectData = this.getProjectData();

        // Informations de base du projet (en en-tête)
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(52, 73, 94);
        pdf.text('PROJET:', margin, currentY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(projectData.name, margin + 25, currentY);
        
        currentY += 8;
        pdf.setFont('helvetica', 'bold');
        pdf.text('DESSINATEUR:', margin, currentY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(projectData.designer, margin + 40, currentY);
        
        currentY += 15;

        let totalPagesAdded = 0;

        // Section Mode opératoire détaillé
        if (projectData.detailedProcedure && projectData.detailedProcedure.trim()) {
            const result = await this.addOperationModeSection(pdf, 'MODE OPÉRATOIRE DÉTAILLÉ', projectData.detailedProcedure, pageWidth, margin, currentY, pageNum, totalPages);
            currentY = result.finalY;
            totalPagesAdded += result.pagesAdded;
            
            // Ajouter les recommandations si elles existent
            if (projectData.procedureRecommendations && projectData.procedureRecommendations.trim()) {
                currentY += 10;
                const recResult = await this.addOperationModeSection(pdf, 'RECOMMANDATIONS ET POINTS CLÉS', projectData.procedureRecommendations, pageWidth, margin, currentY, pageNum, totalPages);
                currentY = recResult.finalY;
                totalPagesAdded += recResult.pagesAdded;
            }
        } else {
            // Afficher un message si pas de mode opératoire
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(52, 73, 94);
            pdf.text('MODE OPÉRATOIRE', margin, currentY);
            
            currentY += 2;
            pdf.setLineWidth(0.3);
            pdf.setDrawColor(149, 165, 166);
            pdf.line(margin, currentY, margin + pdf.getTextWidth('MODE OPÉRATOIRE') + 20, currentY);
            
            currentY += 15;
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(128, 128, 128);
            pdf.text('Aucun mode opératoire défini.', margin + 5, currentY);
            pdf.text('Veuillez renseigner le mode opératoire dans l\'onglet "Mode opératoire".', margin + 5, currentY + 8);
            
            currentY += 25;
        }

        // Section Notes supplémentaires si disponibles
        if (projectData.notes && projectData.notes.trim()) {
            currentY += 10; // Espacement supplémentaire
            const notesResult = await this.addOperationModeSection(pdf, 'NOTES ET RECOMMANDATIONS', projectData.notes, pageWidth, margin, currentY, pageNum, totalPages);
            currentY = notesResult.finalY;
            totalPagesAdded += notesResult.pagesAdded;
        }

        // Log du nombre de pages créées pour le mode opératoire
        if (totalPagesAdded > 0) {

        }

        // Pied de page
        await this.addFooter(pdf, pageWidth, pageHeight, pageNum, totalPages);
    }

    getProjectData() {
        // Récupérer toutes les données de l'onglet Projet
        return {
            name: document.getElementById('projectName')?.value || 'Nom du projet à définir',
            designer: document.getElementById('projectDesigner')?.value || 'Nom du dessinateur',
            class: document.getElementById('projectClass')?.value || '',
            detailedProcedure: document.getElementById('detailedProcedure')?.value || '',
            procedureRecommendations: document.getElementById('procedureRecommendations')?.value || '',
            notes: document.getElementById('projectNotes')?.value || '',
            stats: {
                elements: document.getElementById('elementsCount')?.textContent || '0',
                bricks: document.getElementById('bricksCount')?.textContent || '0',
                blocks: document.getElementById('blocksCount')?.textContent || '0',
                volume: document.getElementById('totalVolume')?.textContent || '0.00'
            }
        };
    }

    /**
     * Ajoute une section de texte pour le mode opératoire
     */
    async addOperationModeSection(pdf, sectionTitle, textContent, pageWidth, margin, startY, pageNum, totalPages) {
        let currentY = startY;
        const pageHeight = 297; // Hauteur A4 en mm
        const topMargin = margin; // Utiliser la même marge du haut que celle passée en paramètre
        const bottomMargin = 30; // Marge du bas pour éviter le pied de page
        const maxY = pageHeight - bottomMargin;
        let pagesAdded = 0; // Compteur des pages ajoutées

        // Fonction pour vérifier et gérer les sauts de page
        const checkPageBreak = async (neededSpace = 10) => {
            if (currentY + neededSpace > maxY) {
                // Ajouter le pied de page sur la page précédente avant de changer de page
                await this.addFooter(pdf, pageWidth, pageHeight, pageNum + pagesAdded, totalPages);
                
                pdf.addPage();
                pagesAdded++;
                currentY = topMargin; // Nouvelle page avec la marge du haut cohérente

                return true;
            }
            return false;
        };

        // Vérifier si on a assez d'espace pour le titre
        await checkPageBreak(20);

        // Titre de la section
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(52, 73, 94);
        pdf.text(sectionTitle, margin, currentY);
        
        // Ligne de soulignement
        currentY += 2;
        pdf.setLineWidth(0.3);
        pdf.setDrawColor(149, 165, 166);
        pdf.line(margin, currentY, margin + pdf.getTextWidth(sectionTitle) + 20, currentY);
        
        currentY += 10;

        // Texte du contenu avec gestion du retour à la ligne et des sauts de page
        const maxWidth = pageWidth - (margin * 2);
        const lineHeight = 6;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);

        // Diviser le texte en paragraphes
        const paragraphs = textContent.split('\n').filter(p => p.trim());
        
        for (let index = 0; index < paragraphs.length; index++) {
            const paragraph = paragraphs[index];
            
            if (index > 0) {
                currentY += lineHeight / 2; // Espacement entre paragraphes
                await checkPageBreak(lineHeight * 2); // Vérifier si on a de la place pour au moins 2 lignes
            }
            
            // Découper le paragraphe en lignes qui tiennent dans la largeur
            const words = paragraph.trim().split(' ');
            let currentLine = '';
            
            for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
                const word = words[wordIndex];
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                const testWidth = pdf.getTextWidth(testLine);
                
                if (testWidth <= maxWidth || currentLine === '') {
                    currentLine = testLine;
                } else {
                    // Vérifier si on a de la place pour cette ligne
                    await checkPageBreak(lineHeight);
                    
                    // Imprimer la ligne actuelle et commencer une nouvelle ligne
                    pdf.text(currentLine, margin + 5, currentY);
                    currentY += lineHeight;
                    currentLine = word;
                }
            }
            
            // Vérifier si on a de la place pour la dernière ligne du paragraphe
            if (currentLine) {
                await checkPageBreak(lineHeight);
                pdf.text(currentLine, margin + 5, currentY);
                currentY += lineHeight;
            }
        }

        // Retourner la position Y finale et le nombre de pages ajoutées
        return { 
            finalY: currentY + 5, 
            pagesAdded: pagesAdded,
            lastPageHasContent: true
        };
    }

    async addMetragePage(pdf, pageWidth, pageHeight, pageNum, totalPages, settings) {
        // Ajouter une nouvelle page si ce n'est pas la première page
        if (pageNum > 1) {
            pdf.addPage();
        }

        // Fond blanc pour la page de métré
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');

        const margin = 20;
        let currentY = 25; // Position Y courante

        // Titre principal de la page
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(44, 62, 80); // Couleur moderne
        const mainTitle = 'MÉTRÉ DÉTAILLÉ';
        const mainTitleWidth = pdf.getTextWidth(mainTitle);
        pdf.text(mainTitle, (pageWidth - mainTitleWidth) / 2, currentY);
        
        // Ligne de soulignement sous le titre principal
        const underlineY = currentY + 2;
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(52, 152, 219); // Bleu moderne
        pdf.line((pageWidth - mainTitleWidth) / 2 - 10, underlineY, (pageWidth + mainTitleWidth) / 2 + 10, underlineY);
        
        currentY += 20;

        // Récupérer les données du métré
        const metreData = this.getMetreData();

        // Résumé général
        currentY = this.addMetreSummary(pdf, metreData, pageWidth, margin, currentY);
        currentY += 10;

        // Tableau des éléments par matériau
        currentY = this.addMetreTable(pdf, metreData, pageWidth, pageHeight, margin, currentY);

        // Pied de page
        await this.addFooter(pdf, pageWidth, pageHeight, pageNum, totalPages);
    }

    getMetreData() {
        // Récupérer les données du métré depuis le MetreTabManager
        if (!window.metreTabManager) {

            return { elements: [], manualItems: [], summary: { totalElements: 0, totalVolume: 0, totalMass: 0 } };
        }

        // Récupérer les éléments de construction (non joints)
        const elements = Array.from(window.metreTabManager.elements.values()).filter(element => 
            element.type !== 'joint'
        );

        // Récupérer les objets manuels
        const manualItems = Array.from(window.metreTabManager.manualItems.values());

        // Calculer le résumé
        const totalVolume = elements.reduce((sum, el) => sum + el.volume, 0);
        const totalMass = elements.reduce((sum, el) => sum + el.mass, 0);

        return {
            elements: elements,
            manualItems: manualItems,
            summary: {
                totalElements: elements.length + manualItems.length,
                totalVolume: totalVolume,
                totalMass: totalMass
            }
        };
    }

    addMetreSummary(pdf, metreData, pageWidth, margin, startY) {
        let currentY = startY;

        // Titre de la section
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(52, 73, 94);
        pdf.text('RÉSUMÉ GÉNÉRAL', margin, currentY);
        
        // Ligne de soulignement
        currentY += 2;
        pdf.setLineWidth(0.3);
        pdf.setDrawColor(149, 165, 166);
        pdf.line(margin, currentY, margin + pdf.getTextWidth('RÉSUMÉ GÉNÉRAL') + 20, currentY);
        
        currentY += 10;

        // Statistiques générales
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);

        const stats = [
            { label: 'Nombre total d\'éléments', value: metreData.summary.totalElements.toString() },
            { label: 'Volume total', value: `${metreData.summary.totalVolume.toFixed(3)} m³` },
            { label: 'Masse totale', value: `${metreData.summary.totalMass.toFixed(2)} kg` },
            { label: 'Date d\'extraction', value: new Date().toLocaleDateString('fr-FR') }
        ];

        stats.forEach(stat => {
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${stat.label}:`, margin + 5, currentY);
            
            pdf.setFont('helvetica', 'normal');
            const labelWidth = pdf.getTextWidth(`${stat.label}: `);
            pdf.text(stat.value, margin + 5 + labelWidth + 10, currentY);
            
            currentY += 6;
        });

        return currentY;
    }

    addMetreTable(pdf, metreData, pageWidth, pageHeight, margin, startY) {
        let currentY = startY;

        // Titre du tableau
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(52, 73, 94);
        pdf.text('DÉTAIL DES ÉLÉMENTS', margin, currentY);
        currentY += 10;

        // Configuration du tableau - Sans colonne ID, avec types de briques complets
        const tableStartY = currentY;
        const rowHeight = 8;
        const headerHeight = 10;
        
        // Largeurs des colonnes (ajustées pour A4 paysage, sans colonne ID)
        const colWidths = {
            type: 70,      // Plus large pour "Brique M50", etc.
            material: 60,
            dimensions: 50,
            volume: 35,
            mass: 35,
            quantity: 25
        };

        // Position X de chaque colonne
        const colPositions = {
            type: margin,
            material: margin + colWidths.type,
            dimensions: margin + colWidths.type + colWidths.material,
            volume: margin + colWidths.type + colWidths.material + colWidths.dimensions,
            mass: margin + colWidths.type + colWidths.material + colWidths.dimensions + colWidths.volume,
            quantity: margin + colWidths.type + colWidths.material + colWidths.dimensions + colWidths.volume + colWidths.mass
        };

        // En-têtes du tableau - Sans colonne ID
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setFillColor(230, 230, 230);
        pdf.rect(margin, currentY, pageWidth - margin * 2, headerHeight, 'F');
        
        currentY += 7;
        pdf.text('Type', colPositions.type + 2, currentY);
        pdf.text('Matériau', colPositions.material + 2, currentY);
        pdf.text('LxlxH', colPositions.dimensions + 2, currentY);
        pdf.text('Vol. (m³)', colPositions.volume + 2, currentY);
        pdf.text('Masse (kg)', colPositions.mass + 2, currentY);
        pdf.text('Qté', colPositions.quantity + 2, currentY);
        currentY += 5;

        // Regrouper les éléments par type de matériau complet (ex: "Brique M50")
        const groupedElements = new Map();
        
        for (const element of metreData.elements) {
            // Utiliser brickType pour les briques spécifiques (M50, M65, etc.) ou le type général
            let elementType = element.brickType || element.type || 'N/A';

            // Spécifique poutres: si type beam et beamType présent dans l'élément source, utiliser "Poutre IPE100"
            let fullType;
            if (element.type === 'beam' && element.element && element.element.beamType) {
                fullType = `Poutre ${element.element.beamType}`;
            } else if (element.type === 'beam' && element.beamType) {
                fullType = `Poutre ${element.beamType}`;
            } else {
                // Utiliser la fonction getTypeDisplayName pour obtenir le nom complet
                fullType = this.getTypeDisplayName(elementType);
            }
            
            const key = `${fullType}|${element.materialName || 'N/A'}|${element.dimensions?.formatted || 'N/A'}`;
            
            if (!groupedElements.has(key)) {
                groupedElements.set(key, {
                    fullType: fullType,
                    materialName: element.materialName || 'N/A',
                    dimensions: element.dimensions?.formatted || 'N/A',
                    volume: element.volume || 0,
                    mass: element.mass || 0,
                    quantity: 0
                });
            }
            
            const group = groupedElements.get(key);
            group.quantity += 1;
        }

        // Contenu du tableau - Afficher les éléments regroupés
        pdf.setFont('helvetica', 'normal');
        let rowIndex = 0;

        // Afficher tous les groupes d'éléments
        for (const [key, group] of groupedElements) {
            // Vérifier si on a assez de place pour une ligne
            if (currentY > pageHeight - 30) {
                pdf.addPage();
                currentY = margin + 20;
                
                // Répéter les en-têtes sur la nouvelle page
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'bold');
                pdf.setFillColor(230, 230, 230);
                pdf.rect(margin, currentY, pageWidth - margin * 2, headerHeight, 'F');
                
                currentY += 7;
                pdf.text('Type', colPositions.type + 2, currentY);
                pdf.text('Matériau', colPositions.material + 2, currentY);
                pdf.text('LxlxH', colPositions.dimensions + 2, currentY);
                pdf.text('Vol. (m³)', colPositions.volume + 2, currentY);
                pdf.text('Masse (kg)', colPositions.mass + 2, currentY);
                pdf.text('Qté', colPositions.quantity + 2, currentY);
                currentY += 5;
                
                pdf.setFont('helvetica', 'normal');
            }

            // Alternance de couleur des lignes
            if (rowIndex % 2 === 1) {
                pdf.setFillColor(248, 248, 248);
                pdf.rect(margin, currentY - 3, pageWidth - margin * 2, rowHeight, 'F');
            }

            pdf.setFontSize(8);
            pdf.text(group.fullType, colPositions.type + 2, currentY);
            pdf.text(group.materialName, colPositions.material + 2, currentY);
            pdf.text(group.dimensions, colPositions.dimensions + 2, currentY);
            pdf.text((group.volume * group.quantity).toFixed(4), colPositions.volume + 2, currentY);
            pdf.text((group.mass * group.quantity).toFixed(2), colPositions.mass + 2, currentY);
            pdf.text(group.quantity.toString(), colPositions.quantity + 2, currentY);

            currentY += rowHeight;
            rowIndex++;
        }

        // Ajouter les objets manuels s'il y en a
        if (metreData.manualItems.length > 0) {
            currentY += 10;
            
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('OBJETS MANUELS', margin, currentY);
            currentY += 10;

            metreData.manualItems.forEach(item => {
                if (currentY > pageHeight - 20) {
                    pdf.addPage();
                    currentY = margin + 20;
                }

                // Alternance de couleur des lignes pour les objets manuels aussi
                if (rowIndex % 2 === 1) {
                    pdf.setFillColor(248, 248, 248);
                    pdf.rect(margin, currentY - 3, pageWidth - margin * 2, rowHeight, 'F');
                }

                pdf.setFontSize(8);
                pdf.text('Manuel', colPositions.type + 2, currentY);
                pdf.text(item.name || 'N/A', colPositions.material + 2, currentY);
                pdf.text('-', colPositions.dimensions + 2, currentY);
                pdf.text('-', colPositions.volume + 2, currentY);
                pdf.text('-', colPositions.mass + 2, currentY);
                pdf.text(item.quantity?.toString() || '1', colPositions.quantity + 2, currentY);
                
                currentY += rowHeight;
                rowIndex++;
            });
        }

        return currentY;
    }

    addHeader(pdf, pageWidth, settings, currentView) {
        const margin = 15; // Marges cohérentes pour plus d'espace
        const headerY = 15;

        // Titre du projet (centré)
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        const titleWidth = pdf.getTextWidth(settings.projectTitle);
        pdf.text(settings.projectTitle, (pageWidth - titleWidth) / 2, headerY);

        // Nom du dessinateur (à gauche)
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(settings.designerName, margin, headerY);

        // Date et heure (à droite)
        const dateStr = this.currentProject.date.toLocaleDateString('fr-FR');
        const timeStr = this.currentProject.date.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const dateTimeStr = `${dateStr} ${timeStr}`;
        const dateWidth = pdf.getTextWidth(dateTimeStr);
        pdf.text(dateTimeStr, pageWidth - margin - dateWidth, headerY);
    }

    addViewName(pdf, pageWidth, pageHeight, viewName, scale, details = null) {
        const footerY = pageHeight - 20; // Position ajustée pour les nouvelles marges
        const margin = 15; // Marges cohérentes avec les images

        // Nom de la vue (centré)
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        const nameWidth = pdf.getTextWidth(viewName);
        const nameX = (pageWidth - nameWidth) / 2;
        pdf.text(viewName, nameX, footerY);

        // Ajouter une ligne de soulignement sous le titre
        const underlineY = footerY + 1; // 1mm sous le texte
        const underlineMargin = 5; // Marge de 5mm de chaque côté du texte
        pdf.setLineWidth(0.3); // Épaisseur de ligne fine
        pdf.line(nameX - underlineMargin, underlineY, nameX + nameWidth + underlineMargin, underlineY);

        let currentY = footerY + 8; // Position en dessous du titre

        // Échelle (centrée en dessous du titre) seulement pour les vues orthogonales et si fournie
        if (scale && scale !== null) {
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            const scaleText = `Échelle: ${scale}`;
            const scaleWidth = pdf.getTextWidth(scaleText);
            pdf.text(scaleText, (pageWidth - scaleWidth) / 2, currentY);
            currentY += 6; // Décaler pour les détails supplémentaires
        }

        // Détails supplémentaires (pour les coupes d'assises)
        if (details) {
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(100, 100, 100); // Gris pour les détails
            const detailsWidth = pdf.getTextWidth(details);
            pdf.text(details, (pageWidth - detailsWidth) / 2, currentY);
            pdf.setTextColor(0, 0, 0); // Remettre en noir
        }
    }

    async addFooter(pdf, pageWidth, pageHeight, pageNum, totalPages) {
        const footerY = pageHeight - 8; // Remonté de 3mm (5mm -> 8mm)
        const margin = 15; // Marges cohérentes

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');

        // Ajouter le logo du logiciel (à gauche) sur la même ligne que le numéro de page
        await this.addLogoToFooter(pdf, margin, footerY);

        // Numéro de page (à droite)
        const pageInfo = `Page ${pageNum} sur ${totalPages}`;
        const pageWidth_ = pdf.getTextWidth(pageInfo);
        pdf.text(pageInfo, pageWidth - margin - pageWidth_, footerY);
    }

    async addLogoToFooter(pdf, x, y) {
        try {
            const logoDataUrl = await this.loadImageAsDataUrl('media/logofondnoir.png');
            if (logoDataUrl) {
                // Créer une image temporaire pour obtenir les dimensions réelles
                const tempImg = new Image();
                await new Promise((resolve) => {
                    tempImg.onload = resolve;
                    tempImg.src = logoDataUrl;
                });
                
                // Calculer les dimensions du logo en respectant les proportions réelles
                const logoHeight = 6;  // mm - hauteur fixe souhaitée
                // Calculer la largeur basée sur le ratio réel de l'image
                const aspectRatio = tempImg.width / tempImg.height;
                const logoWidth = logoHeight * aspectRatio; // Proportion réelle pour éviter la déformation
                


                
                // Position du logo alignée avec le texte du pied de page (remontée de 3mm)
                const logoY = y - 3; // Centrer verticalement avec le texte
                pdf.addImage(logoDataUrl, 'PNG', x, logoY, logoWidth, logoHeight);
                
                // Ajouter la version du logiciel en dessous du logo
                pdf.setFontSize(6); // Taille plus petite pour la version
                pdf.setTextColor(100, 100, 100); // Gris plus clair
                const versionText = `v${this.currentProject.version}`;
                const versionWidth = pdf.getTextWidth(versionText);
                // Centrer la version sous le logo
                pdf.text(versionText, x + (logoWidth - versionWidth) / 2, logoY + logoHeight + 2);
                
                // Remettre la couleur et taille par défaut
                pdf.setTextColor(0, 0, 0);
                pdf.setFontSize(10);
            } else {
                // Fallback en cas d'erreur de chargement du logo
                pdf.setFontSize(8);
                pdf.setTextColor(80, 80, 80);
                const softwareInfo = `WallSim3D ${this.currentProject.version}`;
                pdf.text(softwareInfo, x, y);
                pdf.setTextColor(0, 0, 0);
                pdf.setFontSize(10);
            }
        } catch (error) {

            // Fallback en cas d'erreur
            pdf.setFontSize(8);
            pdf.setTextColor(80, 80, 80);
            const softwareInfo = `WallSim3D ${this.currentProject.version}`;
            pdf.text(softwareInfo, x, y);
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(10);
        }
    }

    loadImageAsDataUrl(imagePath) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            
            img.onerror = () => {

                resolve(null);
            };
            
            img.src = imagePath;
        });
    }

    async captureCurrentView(viewType) {

        
        // DÉSACTIVER L'APPROCHE SPÉCIALE - Utiliser generateTechnicalElevation pour cohérence
        // Les élévations left/right utilisent maintenant generateTechnicalElevation 
        // avec la même logique d'échelle que les autres vues
        if (false && (viewType === 'left' || viewType === 'right')) {

            // Cette logique est désactivée pour utiliser generateTechnicalElevation
        }
        
        try {
            // Diagnostic complet du canvas
            let canvas = null;
            let canvasSource = '';
            
            // Méthode 1: Via le renderer du SceneManager
            if (window.SceneManager && window.SceneManager.renderer && window.SceneManager.renderer.domElement) {
                canvas = window.SceneManager.renderer.domElement;
                canvasSource = 'SceneManager.renderer.domElement';

            }
            
            // Méthode 2: Via l'ID threejs-canvas (fallback)
            if (!canvas) {
                canvas = document.getElementById('threejs-canvas');
                if (canvas) {
                    canvasSource = 'getElementById(threejs-canvas)';

                }
            }
            
            // Méthode 3: Chercher le premier canvas WebGL
            if (!canvas) {
                const canvases = document.querySelectorAll('canvas');

                
                for (let i = 0; i < canvases.length; i++) {
                    const c = canvases[i];

                    
                    // Vérifier si c'est un canvas WebGL sans créer un nouveau contexte
                    try {
                        // Priorité 1: Canvas du SceneManager
                        if (window.SceneManager && window.SceneManager.renderer && 
                            window.SceneManager.renderer.domElement === c) {
                            canvas = c;
                            canvasSource = `querySelector canvas[${i}] WebGL (SceneManager)`;
                            break;
                        }
                        
                        // Priorité 2: Canvas avec dimensions WebGL typiques
                        if (c.width > 100 && c.height > 100) {
                            canvas = c;
                            canvasSource = `querySelector canvas[${i}] (dimensions ${c.width}x${c.height})`;
                            break;
                        }
                    } catch (contextError) {
                        // Ignorer les erreurs de contexte et continuer
                        continue;
                    }
                }
            }
            
            // Vérification finale
            if (!canvas) {

                // Diagnostic final






                return null;
            }

            // Diagnostic détaillé du canvas trouvé







            // Masquer l'indication du Nord pour toutes les vues dans les exports PDF
            let northArrowVisible = undefined;
            let gridVisible = undefined;
            let axesVisible = undefined;
            let originalAssiseGridsVisible = undefined;
            let ghostObjectsState = []; // Sauvegarde de l'état des éléments fantômes
            
            // Masquer la rose des vents pour TOUTES les vues (perspective + élévations)
            if (window.SceneManager && window.SceneManager.northArrowGroup) {
                northArrowVisible = window.SceneManager.northArrowGroup.visible;
                window.SceneManager.northArrowGroup.visible = false;

            }

            // NOUVEAU SYSTÈME DE MASQUAGE FANTÔMES AVANCÉ - ULTRA COMPLET

            let phantomCount = 0;
            
            if (window.SceneManager && window.SceneManager.scene) {
                window.SceneManager.scene.traverse((object) => {
                    if (object.isMesh && object.visible) {
                        let shouldHide = false;
                        let reason = '';
                        
                        // NOUVEAU: Vérifier d'abord si c'est un élément essentiel à préserver
                        let isEssentialElement = false;
                        
                        // Éléments essentiels à ne jamais masquer (plateau, ciel, environnement)
                        if (object.userData && (
                            object.userData.type === 'ground' ||
                            object.userData.type === 'sky' ||
                            object.userData.type === 'environment' ||
                            object.userData.type === 'floor' ||
                            object.userData.type === 'plane' ||
                            object.userData.category === 'ground' ||
                            object.userData.category === 'sky' ||
                            object.userData.category === 'environment' ||
                            object.userData.category === 'floor' ||
                            object.userData.category === 'plane'
                        )) {
                            isEssentialElement = true;
                        }
                        
                        // Vérifier aussi par le nom de l'objet
                        if (object.name && (
                            object.name.toLowerCase().includes('ground') ||
                            object.name.toLowerCase().includes('floor') ||
                            object.name.toLowerCase().includes('plateau') ||
                            object.name.toLowerCase().includes('sky') ||
                            object.name.toLowerCase().includes('ciel') ||
                            object.name.toLowerCase().includes('environment') ||
                            object.name.toLowerCase().includes('background') ||
                            object.name.toLowerCase().includes('horizon') ||
                            object.name.toLowerCase().includes('skybox') ||
                            object.name === 'WallSim3D_GroundFloor' ||
                            object.name === 'WallSim3D_InteractionPlane'
                        )) {
                            isEssentialElement = true;
                        }
                        
                        // Vérifier par le matériau du ciel/environnement
                        if (object.material && object.material.name && (
                            object.material.name.toLowerCase().includes('sky') ||
                            object.material.name.toLowerCase().includes('ciel') ||
                            object.material.name.toLowerCase().includes('background') ||
                            object.material.name.toLowerCase().includes('environment')
                        )) {
                            isEssentialElement = true;
                        }
                        
                        // PROTECTION SPÉCIALE: Tout objet avec une position Y très élevée (probablement le ciel)
                        if (object.position && object.position.y > 100) {
                            isEssentialElement = true;
                        }
                        
                        // PROTECTION SPÉCIALE: Géométries de type ciel (sphères ou plans très grands)
                        if (object.geometry && (
                            object.geometry.type === 'SphereGeometry' ||
                            object.geometry.type === 'PlaneGeometry' ||
                            (object.geometry.parameters && 
                             (object.geometry.parameters.radius > 1000 || 
                              object.geometry.parameters.width > 1000 || 
                              object.geometry.parameters.height > 1000))
                        )) {
                            isEssentialElement = true;
                        }
                        
                        // DEBUG: Log des éléments essentiels détectés
                        if (isEssentialElement) {

                        }
                        
                        // NOUVEAU Critère 0: Masquer les éléments projetés des assises inférieures (rectangles colorés avec points)
                        if (object.userData && (
                            object.userData.type === 'projection' ||
                            object.userData.type === 'projected' ||
                            object.userData.category === 'projection' ||
                            object.userData.isProjection ||
                            object.userData.fromLowerLevel ||
                            object.userData.lowerAssise ||
                            object.userData.assiseProjection ||
                            // NOUVEAU : Identification directe des marqueurs AssiseManager
                            object.userData.isAssiseProjectionMarker
                        )) {
                            shouldHide = true;
                            reason = object.userData.isAssiseProjectionMarker ? 
                                `assise_projection_marker_${object.userData.assiseProjectionType || 'unknown'}` : 
                                'assise_projection';
                        }
                        
                        // NOUVEAU Critère 0bis: Masquer par nom d'objet (éléments de projection d'assises)
                        else if (object.name && (
                            object.name.toLowerCase().includes('projection') ||
                            object.name.toLowerCase().includes('projected') ||
                            object.name.toLowerCase().includes('lower') ||
                            object.name.toLowerCase().includes('assise') ||
                            object.name.toLowerCase().includes('niveau') ||
                            // NOUVEAU : Noms spécifiques des marqueurs AssiseManager
                            object.name.startsWith('AssiseProjection_') ||
                            // NOUVEAU : Détecter les wireframes/contours par pattern de nom
                            (object.name.toLowerCase().includes('wireframe') || 
                             object.name.toLowerCase().includes('border') || 
                             object.name.toLowerCase().includes('edge') || 
                             object.name.toLowerCase().includes('outline'))
                        )) {
                            shouldHide = true;
                            reason = object.name.startsWith('AssiseProjection_') ? 
                                `assise_projection_named_${object.name.split('_')[1] || 'unknown'}` : 
                                object.name.toLowerCase().includes('wireframe') || object.name.toLowerCase().includes('border') ?
                                `wireframe_border_${object.name}` :
                                `name_projection_${object.name}`;
                        }
                        
                        // NOUVEAU Critère 0ter: Masquer les rectangles avec géométrie suspecte (projections d'assises)
                        else if (object.geometry && object.geometry.type === 'PlaneGeometry' && 
                                object.geometry.parameters && 
                                object.geometry.parameters.width < 100 && 
                                object.geometry.parameters.height < 100 &&
                                object.position && object.position.y < 0) {
                            // Rectangles de petite taille sous le niveau 0 = probablement des projections d'assises
                            shouldHide = true;
                            reason = `small_plane_below_zero_[${object.geometry.parameters.width.toFixed(1)}x${object.geometry.parameters.height.toFixed(1)}]_y${object.position.y.toFixed(1)}`;
                        }
                        
                        // NOUVEAU Critère 0quater: Tous les éléments avec userData.elementId (probables éléments d'aide AssiseManager)
                        else if (object.userData && object.userData.elementId && 
                                !object.userData.element && !object.userData.type) {
                            // Éléments avec elementId mais sans type = probablement des éléments d'aide
                            shouldHide = true;
                            reason = `helper_element_with_elementId_${object.userData.elementId}`;
                        }
                        
                        // NOUVEAU Critère 0quinquies: Éléments transparents de petite taille (marqueurs d'aide)
                        else if (object.material && object.material.transparent && 
                                object.material.opacity < 0.9 && object.geometry && 
                                object.geometry.type === 'PlaneGeometry' && 
                                object.geometry.parameters &&
                                object.geometry.parameters.width < 200 && 
                                object.geometry.parameters.height < 200) {
                            // Plans transparents de petite taille = marqueurs d'aide
                            shouldHide = true;
                            reason = `small_transparent_plane_opacity${object.material.opacity}_size${object.geometry.parameters.width.toFixed(1)}x${object.geometry.parameters.height.toFixed(1)}`;
                        }
                        
                        // Critère 1: Opacité exacte de 0.7 (éléments fantômes identifiés) - SAUF éléments essentiels
                        if (!isEssentialElement && object.material && object.material.transparent && object.material.opacity === 0.7) {
                            shouldHide = true;
                            reason = 'opacity_0.7';
                        }
                        
                        // Critère 2: Opacité très faible (< 1.0) avec transparence activée - ÉLARGI - SAUF éléments essentiels
                        else if (!isEssentialElement && object.material && object.material.transparent && object.material.opacity < 1.0) {
                            shouldHide = true;
                            reason = `opacity_${object.material.opacity}`;
                        }
                        
                        // Critère 2bis: Matériaux avec opacité sans transparence explicite mais < 1.0 - SAUF éléments essentiels
                        else if (!isEssentialElement && object.material && object.material.opacity !== undefined && object.material.opacity < 1.0) {
                            shouldHide = true;
                            reason = `opacity_no_transparent_${object.material.opacity}`;
                        }
                        
                        // Critère 3: Vérification des userData pour éléments fantômes
                        else if (object.userData && (
                            object.userData.ghost || 
                            object.userData.suggestion || 
                            object.userData.preview || 
                            object.userData.phantom ||
                            object.userData.temporary ||
                            object.userData.isGhost ||
                            object.userData.isSuggestion ||
                            object.userData.isPreview
                        )) {
                            shouldHide = true;
                            reason = 'userData_ghost';
                        }
                        
                        // Critère 4: Noms suspects d'éléments fantômes
                        else if (object.name && (
                            object.name.toLowerCase().includes('ghost') ||
                            object.name.toLowerCase().includes('suggestion') ||
                            object.name.toLowerCase().includes('preview') ||
                            object.name.toLowerCase().includes('phantom') ||
                            object.name.toLowerCase().includes('temp') ||
                            object.name.toLowerCase().includes('fantome')
                        )) {
                            shouldHide = true;
                            reason = `name_${object.name}`;
                        }
                        
                        // Critère 5: Position extrême (peut indiquer des éléments hors-vue) - SAUF éléments essentiels et environnement
                        else if (!isEssentialElement && object.position && (
                            object.position.y > 1000 || 
                            object.position.y < -1000 ||
                            Math.abs(object.position.x) > 5000 ||
                            Math.abs(object.position.z) > 5000
                        )) {
                            // Vérifier si c'est un élément d'environnement (ciel, lointain) qui peut avoir des positions extrêmes
                            let isEnvironmentElement = false;
                            if (object.name && (
                                object.name.toLowerCase().includes('sky') ||
                                object.name.toLowerCase().includes('ciel') ||
                                object.name.toLowerCase().includes('background') ||
                                object.name.toLowerCase().includes('horizon') ||
                                object.name.toLowerCase().includes('environment')
                            )) {
                                isEnvironmentElement = true;
                            }
                            
                            if (!isEnvironmentElement) {
                                shouldHide = true;
                                reason = `extreme_position_[${object.position.x.toFixed(1)}, ${object.position.y.toFixed(1)}, ${object.position.z.toFixed(1)}]`;
                            }
                        }
                        
                        // Critère 6: Matériaux avec noms fantômes
                        else if (object.material && object.material.name && (
                            object.material.name.toLowerCase().includes('ghost') ||
                            object.material.name.toLowerCase().includes('preview') ||
                            object.material.name.toLowerCase().includes('suggestion')
                        )) {
                            shouldHide = true;
                            reason = `material_${object.material.name}`;
                        }
                        
                        // NOUVEAU Critère 7: Éléments avec parent fantôme (détection hiérarchique)
                        else if (object.parent && object.parent.userData && (
                            object.parent.userData.ghost || 
                            object.parent.userData.suggestion ||
                            object.parent.userData.preview
                        )) {
                            shouldHide = true;
                            reason = 'parent_ghost';
                        }
                        
                        // NOUVEAU Critère 8: Éléments sans userData.element (potentiels fantômes non-intégrés) - SAUF éléments essentiels
                        else if (!isEssentialElement && (!object.userData || !object.userData.element)) {
                            // Vérifier si c'est un élément de construction réel vs fantôme
                            let isRealElement = false;
                            
                            // Éléments de construction réels ont généralement ces caractéristiques
                            if (object.userData && (
                                object.userData.type === 'ground' ||
                                object.userData.type === 'interaction' ||
                                object.userData.category === 'floor' ||
                                object.userData.category === 'plane' ||
                                object.name === 'WallSim3D_GroundFloor' ||
                                object.name === 'WallSim3D_InteractionPlane'
                            )) {
                                isRealElement = true;
                            }
                            
                            // NOUVEAU: Exclure les panneaux d'isolation de la bibliothèque 3D
                            // Ces éléments doivent rester opaques et visibles
                            if (object.parent && object.parent.userData && 
                                (object.parent.userData.type === 'insulation' || 
                                 object.parent.userData.elementType === 'insulation' ||
                                 (object.parent.userData.element && object.parent.userData.element.type === 'insulation'))) {
                                isRealElement = true;
                            }
                            
                            // Vérifier aussi directement sur l'objet s'il s'agit d'un élément d'isolation
                            if (object.userData && 
                                (object.userData.type === 'insulation' || 
                                 object.userData.elementType === 'insulation' ||
                                 (object.userData.element && object.userData.element.type === 'insulation'))) {
                                isRealElement = true;
                            }
                            
                            // Si ce n'est pas un élément système et qu'il n'a pas de userData.element, c'est suspect
                            if (!isRealElement && object.geometry && object.material) {
                                shouldHide = true;
                                reason = 'no_userData_element_suspect';
                            }
                        }
                        
                        // NOUVEAU Critère 9: Éléments avec visibility ou renderOrder suspects
                        else if (object.renderOrder !== undefined && object.renderOrder < 0) {
                            shouldHide = true;
                            reason = `negative_renderOrder_${object.renderOrder}`;
                        }
                        
                        // NOUVEAU Critère 10: Éléments avec des matériaux temporaires ou de debug
                        else if (object.material && (
                            (object.material.color && object.material.color.getHexString && 
                             (object.material.color.getHexString() === 'ff0000' || // Rouge debug
                              object.material.color.getHexString() === '00ff00' || // Vert debug
                              object.material.color.getHexString() === '0000ff'))) // Bleu debug
                        ) {
                            shouldHide = true;
                            reason = `debug_color_${object.material.color.getHexString()}`;
                        }
                        
                        // NOUVEAU Critère 10bis: Éléments avec matériaux de projection d'assises (couleurs vives)
                        else if (object.material && object.material.color && object.material.color.getHexString && (
                            object.material.color.getHexString() === 'ffff00' || // Jaune vif
                            object.material.color.getHexString() === 'ff8000' || // Orange vif
                            object.material.color.getHexString() === 'ff0080' || // Rose vif
                            object.material.color.getHexString() === '8000ff' || // Violet vif
                            object.material.color.getHexString() === '00ffff' || // Cyan vif
                            (object.material.color.r > 0.8 && object.material.color.g > 0.8) || // Jaune/Orange
                            (object.material.color.r > 0.8 && object.material.color.b > 0.8)    // Rose/Violet
                        )) {
                            // Vérifier si c'est un petit plan (projection probable)
                            if (object.geometry && object.geometry.type === 'PlaneGeometry' && 
                                object.geometry.parameters && 
                                object.geometry.parameters.width < 200 && 
                                object.geometry.parameters.height < 200) {
                                shouldHide = true;
                                reason = `bright_colored_projection_${object.material.color.getHexString()}`;
                            }
                        }
                        
                        // NOUVEAU Critère 10ter: Marqueurs d'accrochage AssiseManager (rectangles orange transparents)
                        else if (object.geometry && object.geometry.type === 'PlaneGeometry' && 
                                object.material && object.material.color && object.material.color.getHexString) {
                            // Couleur orange des marqueurs d'accroche (0xf39c12 = f39c12)
                            if (object.material.color.getHexString() === 'f39c12' && 
                                object.material.transparent && object.material.opacity < 1.0) {
                                shouldHide = true;
                                reason = `assise_attachment_marker_${object.material.color.getHexString()}`;
                            }
                        }
                        
                        // NOUVEAU Critère 10quater: Points d'accrochage AssiseManager (petites sphères colorées)
                        else if (object.geometry && object.geometry.type === 'SphereGeometry' && 
                                object.geometry.parameters && object.geometry.parameters.radius <= 0.8) {
                            if (object.material && object.material.color && object.material.color.getHexString) {
                                const colorHex = object.material.color.getHexString();
                                // Couleurs typiques des points d'accroche : orange FF6600, rouge e74c3c, orange-accroche f39c12
                                if (colorHex === 'ff6600' || colorHex === 'e74c3c' || colorHex === 'f39c12') {
                                    shouldHide = true;
                                    reason = `assise_snap_point_${colorHex}`;
                                }
                            }
                        }
                        
                        // NOUVEAU Critère 10quinquies: Grilles d'assise AssiseManager (GridHelper colorés)
                        else if ((object.type === 'GridHelper' || 
                                (object.geometry && object.geometry.type === 'BufferGeometry' && 
                                 object.material && object.material.type === 'LineBasicMaterial')) &&
                                object.material && object.material.color && object.material.color.getHexString) {
                            const colorHex = object.material.color.getHexString();
                            // Couleurs des grilles d'assise : bleu 3498db, rouge e74c3c, gris 95a5a6
                            if (colorHex === '3498db' || colorHex === 'e74c3c' || colorHex === '95a5a6') {
                                shouldHide = true;
                                reason = `assise_grid_${colorHex}`;
                            }
                        }
                        
                        // NOUVEAU Critère 13: Tous les éléments d'AssiseManager (surcadres et points d'aide)
                        else if (object.parent && object.parent.type === 'Group' && 
                                (object.parent.userData || object.parent.name)) {
                            // Groupes de marqueurs d'accroche AssiseManager
                            let isAssiseHelper = false;
                            
                            // Vérifier si le parent contient des marqueurs d'accroche
                            if (object.parent.children && object.parent.children.length > 0) {
                                const hasAttachmentMarkers = object.parent.children.some(child => 
                                    child.geometry && child.geometry.type === 'PlaneGeometry' &&
                                    child.material && child.material.color && child.material.color.getHexString &&
                                    child.material.color.getHexString() === 'f39c12'
                                );
                                
                                const hasSnapPoints = object.parent.children.some(child => 
                                    child.geometry && child.geometry.type === 'SphereGeometry' &&
                                    child.material && child.material.color && child.material.color.getHexString &&
                                    (child.material.color.getHexString() === 'ff6600' || 
                                     child.material.color.getHexString() === 'e74c3c' || 
                                     child.material.color.getHexString() === 'f39c12')
                                );
                                
                                isAssiseHelper = hasAttachmentMarkers || hasSnapPoints;
                            }
                            
                            if (isAssiseHelper) {
                                shouldHide = true;
                                reason = 'assise_helper_group_element';
                            }
                        }
                        
                        // NOUVEAU Critère 14: Éléments avec des bordures (EdgeGeometry/LineSegments)
                        else if (object.type === 'LineSegments' && object.geometry && 
                                object.geometry.type === 'EdgesGeometry' &&
                                object.material && object.material.type === 'LineBasicMaterial' &&
                                object.material.color && object.material.color.getHexString) {
                            const colorHex = object.material.color.getHexString();
                            // Contours orange des marqueurs d'accroche ET toutes les couleurs vives des projections
                            if (colorHex === 'f39c12' || colorHex === 'ff6600' || colorHex === 'e74c3c' ||
                                colorHex === 'f49c12' || colorHex === 'ff5500' || colorHex === 'ff6601') {
                                shouldHide = true;
                                reason = `assise_edge_outline_${colorHex}`;
                            }
                        }
                        
                        // NOUVEAU Critère 14bis: Tous les LineSegments de couleur orange/vive (contours génériques)
                        else if (object.type === 'LineSegments' && object.material && 
                                object.material.color && object.material.color.getHexString) {
                            const colorHex = object.material.color.getHexString();
                            const color = object.material.color;
                            
                            // Détecter les couleurs vives utilisées pour les contours d'aide
                            const isOrangeVariant = (color.r > 0.8 && color.g > 0.4 && color.g < 0.8 && color.b < 0.3);
                            const isRedVariant = (color.r > 0.8 && color.g < 0.5 && color.b < 0.5);
                            const isYellowVariant = (color.r > 0.8 && color.g > 0.8 && color.b < 0.4);
                            
                            if (isOrangeVariant || isRedVariant || isYellowVariant ||
                                colorHex === 'f39c12' || colorHex === 'ff6600' || colorHex === 'e74c3c') {
                                shouldHide = true;
                                reason = `bright_line_segments_${colorHex}_r${color.r.toFixed(2)}_g${color.g.toFixed(2)}_b${color.b.toFixed(2)}`;
                            }
                        }
                        
                        // NOUVEAU Critère 15: Points d'accrochage - DÉTECTION RENFORCÉE avec userData prioritaire
                        else if (object.geometry && object.geometry.type === 'SphereGeometry') {
                            const sphereGeo = object.geometry;
                            
                            // SUPER PRIORITÉ: Si userData indique que c'est un point projeté, MASQUER IMMÉDIATEMENT
                            if (object.userData && 
                                (object.userData.isAssiseProjectionMarker || 
                                 object.userData.isProjectedAttachmentPoint || 
                                 object.userData.shouldHideInPDF ||
                                 object.userData.isDynamicSnapPoint ||
                                 object.userData.isSnapPoint ||
                                 object.userData.isJointPoint ||
                                 object.userData.isJointVerticalPoint)) {
                                shouldHide = true;
                                
                                // Déterminer la raison spécifique selon le type d'identification
                                if (object.userData.isJointVerticalPoint) {
                                    reason = `JOINT_POINT_FORCED_HIDE_${object.userData.assiseProjectionType || 'joint_snap'}`;
                                } else if (object.userData.isDynamicSnapPoint) {
                                    reason = `DYNAMIC_SNAP_POINT_FORCED_HIDE`;
                                } else if (object.userData.markerCategory) {
                                    reason = `PROJECTED_POINT_FORCED_HIDE_${object.userData.markerCategory}`;
                                } else if (object.userData.assiseProjectionType) {
                                    reason = `ASSISE_POINT_FORCED_HIDE_${object.userData.assiseProjectionType}`;
                                } else {
                                    reason = 'PROJECTED_ATTACHMENT_POINT_FORCED_HIDE';
                                }
                            }
                            // Toutes les petites sphères pourraient être des points d'accroche
                            else if (sphereGeo.parameters && sphereGeo.parameters.radius <= 1.0) {
                                // PRIORITÉ 2: Détection par position et couleur (fallback)
                                if (object.position && Math.abs(object.position.y) < 50) {
                                    // Couleurs variées des points d'accroche
                                    if (object.material && object.material.color) {
                                        const color = object.material.color;
                                        // Orange, rouge, jaune, violet, ou toute couleur vive pour les points d'aide
                                        const isBrightColor = (color.r > 0.7 || color.g > 0.7 || color.b > 0.7) && 
                                                            (color.r + color.g + color.b > 1.5);
                                        
                                        if (isBrightColor) {
                                            shouldHide = true;
                                            reason = `bright_snap_sphere_r${color.r.toFixed(2)}_g${color.g.toFixed(2)}_b${color.b.toFixed(2)}`;
                                        }
                                    }
                                }
                            }
                        }
                        
                        // NOUVEAU Critère 15bis: Halos des points d'accrochage - DÉTECTION RENFORCÉE 
                        else if (object.geometry && object.geometry.type === 'SphereGeometry') {
                            const sphereGeo = object.geometry;
                            
                            // SUPER PRIORITÉ: Si userData indique que c'est un halo, MASQUER IMMÉDIATEMENT
                            if (object.userData && 
                                (object.userData.isHalo || 
                                 object.userData.parentPoint || 
                                 object.userData.isHaloElement ||
                                 object.userData.isAssiseProjectionMarker ||
                                 object.userData.shouldHideInPDF)) {
                                shouldHide = true;
                                
                                // Déterminer la raison spécifique selon le type de halo
                                if (object.userData.isJointVerticalPoint) {
                                    reason = `JOINT_HALO_FORCED_HIDE_${object.userData.assiseProjectionType || 'joint_halo'}`;
                                } else if (object.userData.markerCategory && object.userData.markerCategory.includes('halo')) {
                                    reason = `PROJECTED_HALO_FORCED_HIDE_${object.userData.markerCategory}`;
                                } else if (object.userData.assiseProjectionType && object.userData.assiseProjectionType.includes('halo')) {
                                    reason = `ASSISE_HALO_FORCED_HIDE_${object.userData.assiseProjectionType}`;
                                } else {
                                    reason = 'ASSISE_SNAP_POINT_HALO_FORCED_HIDE';
                                }
                            }
                            // Sphères plus grandes (halos) avec opacité faible
                            else if (sphereGeo.parameters && sphereGeo.parameters.radius >= 0.6 && sphereGeo.parameters.radius <= 1.5) {
                                if (object.material && object.material.transparent && object.material.opacity < 0.3) {
                                    // PRIORITÉ 2: Détection par position et couleur (fallback)
                                    if (object.position && Math.abs(object.position.y) < 50 && object.material.color) {
                                        const color = object.material.color;
                                        // Couleurs typiques des halos (orange, jaune, rouge avec faible opacité)
                                        const isHaloColor = (color.r > 0.5 || color.g > 0.5) && 
                                                          (color.r + color.g + color.b > 1.0);
                                        
                                        if (isHaloColor) {
                                            shouldHide = true;
                                            reason = `assise_snap_halo_r${color.r.toFixed(2)}_g${color.g.toFixed(2)}_b${color.b.toFixed(2)}_op${object.material.opacity.toFixed(2)}`;
                                        }
                                    }
                                }
                            }
                        }
                        
                        // NOUVEAU Critère 15ter: Détection par nom des éléments projetés - MASQUAGE ABSOLU
                        else if (object.name && typeof object.name === 'string') {
                            // Masquer tous les éléments avec des noms contenant les patterns de projection
                            const projectionPatterns = [
                                'AssiseProjection_',
                                'DynamicSnapPoint',
                                'AttachmentPoint_',
                                'JointPoint_',
                                '_Assise',
                                'attachment_point',
                                'attachment_halo',
                                'joint_attachment',
                                'snap_point',
                                'snap_halo'
                            ];
                            
                            const matchesPattern = projectionPatterns.some(pattern => 
                                object.name.includes(pattern) || object.name.toLowerCase().includes(pattern.toLowerCase())
                            );
                            
                            if (matchesPattern) {
                                shouldHide = true;
                                reason = `PROJECTION_NAME_PATTERN_HIDE_${object.name.substring(0, 30)}`;
                            }
                        }
                        
                        // NOUVEAU Critère 16: Tous les éléments avec matériau orange transparent (surcadres AssiseManager)
                        else if (object.material && object.material.transparent && 
                                object.material.opacity < 1.0 && object.material.color &&
                                object.material.color.getHexString) {
                            const colorHex = object.material.color.getHexString();
                            // Couleur orange des marqueurs d'accroche et surcadres
                            if (colorHex === 'f39c12' || colorHex === 'f39c13' || colorHex === 'f49c12') {
                                shouldHide = true;
                                reason = `orange_transparent_frame_${colorHex}_opacity${object.material.opacity}`;
                            }
                        }
                        
                        // NOUVEAU Critère 17: Groupes et enfants de points projetés - MASQUAGE HIÉRARCHIQUE
                        else if (object.type === 'Group' || (object.parent && object.parent.type === 'Group')) {
                            // Vérifier si c'est un groupe de marqueurs ou un enfant de groupe de marqueurs
                            let targetObject = object.type === 'Group' ? object : object.parent;
                            let shouldHideGroup = false;
                            let groupReason = '';
                            
                            // Vérifier les userData du groupe
                            if (targetObject.userData) {
                                const groupData = targetObject.userData;
                                if (groupData.isAssiseProjectionMarker || 
                                    groupData.isProjectedAttachmentPoint || 
                                    groupData.shouldHideInPDF ||
                                    groupData.markerCategory ||
                                    groupData.assiseProjectionType) {
                                    shouldHideGroup = true;
                                    groupReason = `GROUP_PROJECTION_HIDE_${groupData.assiseProjectionType || 'marker_group'}`;
                                }
                            }
                            
                            // Vérifier le nom du groupe
                            if (!shouldHideGroup && targetObject.name && typeof targetObject.name === 'string') {
                                const groupPatterns = ['AssiseProjection', 'AttachmentMarker', 'JointMarker', 'SnapPoint'];
                                const matchesGroupPattern = groupPatterns.some(pattern => 
                                    targetObject.name.includes(pattern)
                                );
                                if (matchesGroupPattern) {
                                    shouldHideGroup = true;
                                    groupReason = `GROUP_NAME_PATTERN_HIDE_${targetObject.name.substring(0, 30)}`;
                                }
                            }
                            
                            // Si c'est un groupe à masquer, masquer l'objet
                            if (shouldHideGroup) {
                                shouldHide = true;
                                reason = object.type === 'Group' ? groupReason : `CHILD_OF_${groupReason}`;
                            }
                        }
                        
                        // NOUVEAU Critère 18: Tous les LineSegments avec couleur orange (contours de surcadres)
                        else if (object.type === 'LineSegments' && object.material && 
                                object.material.color && object.material.color.getHexString) {
                            const colorHex = object.material.color.getHexString();
                            // Tous les contours orange, peu importe la géométrie
                            if (colorHex === 'f39c12' || colorHex === 'f39c13' || colorHex === 'f49c12' ||
                                colorHex === 'ff6600' || colorHex === 'ff6601' || colorHex === 'ff5500') {
                                shouldHide = true;
                                reason = `orange_line_segments_${colorHex}`;
                            }
                        }
                        
                        // NOUVEAU Critère 18: Tous les objets dans des groupes de marqueurs AssiseManager (détection hiérarchique élargie)
                        else if (object.parent && object.parent.type === 'Group') {
                            // Rechercher récursivement dans la hiérarchie des parents
                            let currentParent = object.parent;
                            let hasAssiseMarkers = false;
                            let depth = 0;
                            
                            while (currentParent && depth < 5) { // Limiter la profondeur de recherche
                                // Vérifier si le parent a des userData d'AssiseProjection  
                                if (currentParent.userData && currentParent.userData.isAssiseProjectionMarker) {
                                    hasAssiseMarkers = true;
                                    break;
                                }
                                
                                // Vérifier si le parent a un nom d'AssiseProjection
                                if (currentParent.name && currentParent.name.startsWith('AssiseProjection_')) {
                                    hasAssiseMarkers = true;
                                    break;
                                }
                                
                                if (currentParent.children && currentParent.children.length > 0) {
                                    // Chercher des éléments orange caractéristiques des marqueurs AssiseManager
                                    const hasOrangeElements = currentParent.children.some(child => {
                                        if (child.material && child.material.color && child.material.color.getHexString) {
                                            const colorHex = child.material.color.getHexString();
                                            return colorHex === 'f39c12' || colorHex === 'ff6600' || colorHex === 'e74c3c';
                                        }
                                        return false;
                                    });
                                    
                                    if (hasOrangeElements) {
                                        hasAssiseMarkers = true;
                                        break;
                                    }
                                }
                                currentParent = currentParent.parent;
                                depth++;
                            }
                            
                            if (hasAssiseMarkers) {
                                shouldHide = true;
                                reason = `assise_marker_hierarchy_depth${depth}`;
                            }
                        }
                        
                        // NOUVEAU Critère 19: Plans rectangulaires avec dimensions typiques des marqueurs AssiseManager
                        else if (object.geometry && object.geometry.type === 'PlaneGeometry' && 
                                object.geometry.parameters) {
                            const params = object.geometry.parameters;
                            // Dimensions typiques des briques M65: 25cm x 12cm, avec variations possibles
                            const isTypicalBrickSize = (
                                (params.width >= 20 && params.width <= 30 && params.height >= 10 && params.height <= 15) ||
                                (params.width >= 10 && params.width <= 15 && params.height >= 20 && params.height <= 30)
                            );
                            
                            if (isTypicalBrickSize && object.material && object.material.transparent && 
                                object.material.opacity < 0.8) {
                                shouldHide = true;
                                reason = `typical_brick_marker_${params.width.toFixed(1)}x${params.height.toFixed(1)}_opacity${object.material.opacity}`;
                            }
                        }
                        
                        // NOUVEAU Critère 11: Éléments avec des propriétés de fantôme cachées
                        else if (object.userData && (
                            object.userData.isPhantom ||
                            object.userData.isGhost ||
                            object.userData.phantom ||
                            object.userData.wasPhantom ||
                            object.userData.fromPhantom ||
                            object.userData.converted
                        )) {
                            shouldHide = true;
                            reason = 'hidden_phantom_properties';
                        }
                        
                        // NOUVEAU Critère 12: Éléments avec UUID suspects (pattern fantôme)
                        else if (object.uuid && (
                            object.uuid.includes('phantom') ||
                            object.uuid.includes('ghost') ||
                            object.uuid.includes('temp')
                        )) {
                            shouldHide = true;
                            reason = `suspicious_uuid_${object.uuid.substring(0, 8)}`;
                        }
                        
                        // NOUVEAU Critère 11: Éléments avec des propriétés de fantôme cachées
                        else if (object.userData && (
                            object.userData.isPhantom ||
                            object.userData.isGhost ||
                            object.userData.phantom ||
                            object.userData.wasPhantom ||
                            object.userData.fromPhantom ||
                            object.userData.converted
                        )) {
                            shouldHide = true;
                            reason = 'hidden_phantom_properties';
                        }
                        
                        // NOUVEAU Critère 12: Éléments avec UUID suspects (pattern fantôme)
                        else if (object.uuid && (
                            object.uuid.includes('phantom') ||
                            object.uuid.includes('ghost') ||
                            object.uuid.includes('temp')
                        )) {
                            shouldHide = true;
                            reason = `suspicious_uuid_${object.uuid.substring(0, 8)}`;
                        }
                        
                        // NOUVEAU Critère 11: Éléments avec des propriétés de fantôme cachées
                        else if (object.userData && (
                            object.userData.isPhantom ||
                            object.userData.isGhost ||
                            object.userData.phantom ||
                            object.userData.wasPhantom ||
                            object.userData.fromPhantom ||
                            object.userData.converted
                        )) {
                            shouldHide = true;
                            reason = 'hidden_phantom_properties';
                        }
                        
                        // NOUVEAU Critère 12: Éléments avec UUID suspects (pattern fantôme)
                        else if (object.uuid && (
                            object.uuid.includes('phantom') ||
                            object.uuid.includes('ghost') ||
                            object.uuid.includes('temp')
                        )) {
                            shouldHide = true;
                            reason = `suspicious_uuid_${object.uuid.substring(0, 8)}`;
                        }
                        
                        // Masquer l'objet si nécessaire
                        if (shouldHide) {
                            // Sauvegarder l'état original
                            ghostObjectsState.push({
                                object: object,
                                originalVisible: object.visible,
                                originalOpacity: object.material ? object.material.opacity : null
                            });
                            
                            // Masquer complètement l'objet
                            object.visible = false;
                            phantomCount++;
                            

                        }
                    }
                });
            }
            

            
            // Masquer la grille de la scène et les axes pour la vue perspective
            if (viewType === 'perspective' && window.SceneManager) {
                if (window.SceneManager.grid) {
                    gridVisible = window.SceneManager.grid.visible;
                    window.SceneManager.grid.visible = false;

                }
                
                if (window.SceneManager.axesHelper) {
                    axesVisible = window.SceneManager.axesHelper.visible;
                    window.SceneManager.axesHelper.visible = false;

                }
                
                // Masquer les grilles des assises pour la vue perspective
                if (window.AssiseManager && window.AssiseManager.showAssiseGrids) {
                    originalAssiseGridsVisible = window.AssiseManager.showAssiseGrids;
                    window.AssiseManager.toggleAssiseGrids(); // Masquer les grilles d'assises

                }
            }

            // Changer la vue si nécessaire (sauf pour left/right qui sont gérées directement)
            if (viewType !== 'perspective' && viewType !== 'left' && viewType !== 'right') {

                await this.switchToView(viewType);
                
                // Attendre la stabilisation

                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Forcer le rendu
                if (window.SceneManager && window.SceneManager.renderer && window.SceneManager.scene && window.SceneManager.camera) {

                    window.SceneManager.renderer.render(window.SceneManager.scene, window.SceneManager.camera);
                    // Attendre que le rendu soit terminé
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            } else if (viewType === 'left' || viewType === 'right') {

                // Utiliser generateTechnicalElevation pour cohérence d'échelle
                return null; // Indique que cette vue sera gérée par generateTechnicalElevation dans addOrthogonalPage
            } else {

                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Vérifier si le canvas a du contenu via une méthode plus sûre
            // Éviter de créer un nouveau contexte WebGL sur un canvas existant
            let hasContent = false;
            try {
                // Utiliser le renderer existant pour vérifier le contenu
                if (window.SceneManager && window.SceneManager.renderer) {
                    const renderer = window.SceneManager.renderer;
                    // Lire directement les pixels via le renderer
                    const gl = renderer.getContext();
                    if (gl) {
                        const pixels = new Uint8Array(4);
                        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
                        hasContent = !(pixels[0] === 0 && pixels[1] === 0 && pixels[2] === 0 && pixels[3] === 0);
                    }
                }
            } catch (contextError) {
                // Si la vérification échoue, on considère qu'il y a du contenu
                hasContent = true;
            }

            // NOUVELLE MÉTHODE : Capture directe via toDataURL (maintenant possible avec preserveDrawingBuffer)

            
            try {
                const dataURL = canvas.toDataURL('image/png', 1.0);
                
                if (dataURL && dataURL !== 'data:,' && !dataURL.startsWith('data:,')) {

                    
                    // Convertir en canvas pour compatibilité
                    const img = new Image();
                    const resultCanvas = document.createElement('canvas');
                    const ctx = resultCanvas.getContext('2d');
                    
                    return new Promise((resolve) => {
                        img.onload = () => {
                            resultCanvas.width = img.width;
                            resultCanvas.height = img.height;
                            ctx.drawImage(img, 0, 0);
                            

                            
                            // Restaurer les éléments fantômes masqués
                            if (ghostObjectsState.length > 0) {
                                ghostObjectsState.forEach((state, index) => {
                                    state.object.visible = state.originalVisible;
                                    if (state.originalOpacity !== null && state.object.material) {
                                        state.object.material.opacity = state.originalOpacity;
                                    }
                                });

                            }
                            
                            // VÉRIFICATION SPÉCIALE: S'assurer que le ciel et l'environnement sont visibles
                            if (window.SceneManager && window.SceneManager.scene) {
                                window.SceneManager.scene.traverse((object) => {
                                    if (object.isMesh && (
                                        (object.name && (
                                            object.name.toLowerCase().includes('sky') ||
                                            object.name.toLowerCase().includes('ciel') ||
                                            object.name.toLowerCase().includes('background') ||
                                            object.name.toLowerCase().includes('environment')
                                        )) ||
                                        (object.userData && (
                                            object.userData.type === 'sky' ||
                                            object.userData.type === 'environment' ||
                                            object.userData.category === 'sky' ||
                                            object.userData.category === 'environment'
                                        )) ||
                                        (object.position && object.position.y > 100)
                                    )) {
                                        if (!object.visible) {
                                            object.visible = true;

                                        }
                                    }
                                });
                            }
                            
                            // Restaurer tous les éléments masqués après capture
                            if (window.SceneManager && window.SceneManager.northArrowGroup && northArrowVisible !== undefined) {
                                window.SceneManager.northArrowGroup.visible = northArrowVisible;

                            }
                            
                            if (window.SceneManager && gridVisible !== undefined) {
                                window.SceneManager.grid.visible = gridVisible;

                            }
                            
                            if (window.SceneManager && axesVisible !== undefined) {
                                window.SceneManager.axesHelper.visible = axesVisible;

                            }
                            
                            if (window.AssiseManager && originalAssiseGridsVisible !== undefined && originalAssiseGridsVisible && !window.AssiseManager.showAssiseGrids) {
                                window.AssiseManager.toggleAssiseGrids(); // Restaurer les grilles d'assises

                            }
                            
                            resolve(resultCanvas);
                        };
                        img.src = dataURL;
                    });
                } else {
                    throw new Error('toDataURL a retourné des données vides');
                }
            } catch (directError) {

                
                // FALLBACK : html2canvas avec options optimisées pour WebGL

                
                const captureOptions = {
                    backgroundColor: null,
                    scale: 1,
                    logging: false,
                    useCORS: true,
                    allowTaint: true, // Autoriser pour WebGL
                    foreignObjectRendering: false,
                    imageTimeout: 30000,
                    removeContainer: true,
                    x: 0,
                    y: 0,
                    width: canvas.clientWidth || canvas.width,
                    height: canvas.clientHeight || canvas.height,
                    windowWidth: canvas.clientWidth || canvas.width,
                    windowHeight: canvas.clientHeight || canvas.height
                };

                const capturedCanvas = await html2canvas(canvas, captureOptions);

                
                // Restaurer les éléments fantômes masqués après fallback
                if (ghostObjectsState.length > 0) {
                    ghostObjectsState.forEach((state, index) => {
                        state.object.visible = state.originalVisible;
                        if (state.originalOpacity !== null && state.object.material) {
                            state.object.material.opacity = state.originalOpacity;
                        }
                    });

                }
                
                // VÉRIFICATION SPÉCIALE: S'assurer que le ciel et l'environnement sont visibles après fallback
                if (window.SceneManager && window.SceneManager.scene) {
                    window.SceneManager.scene.traverse((object) => {
                        if (object.isMesh && (
                            (object.name && (
                                object.name.toLowerCase().includes('sky') ||
                                object.name.toLowerCase().includes('ciel') ||
                                object.name.toLowerCase().includes('background') ||
                                object.name.toLowerCase().includes('environment')
                            )) ||
                            (object.userData && (
                                object.userData.type === 'sky' ||
                                object.userData.type === 'environment' ||
                                object.userData.category === 'sky' ||
                                object.userData.category === 'environment'
                            )) ||
                            (object.position && object.position.y > 100)
                        )) {
                            if (!object.visible) {
                                object.visible = true;

                            }
                        }
                    });
                }
                
                // Restaurer tous les éléments masqués après fallback capture
                if (window.SceneManager && window.SceneManager.northArrowGroup && northArrowVisible !== undefined) {
                    window.SceneManager.northArrowGroup.visible = northArrowVisible;

                }
                
                if (window.SceneManager && gridVisible !== undefined) {
                    window.SceneManager.grid.visible = gridVisible;

                }
                
                if (window.SceneManager && axesVisible !== undefined) {
                    window.SceneManager.axesHelper.visible = axesVisible;

                }
                
                if (window.AssiseManager && originalAssiseGridsVisible !== undefined && originalAssiseGridsVisible && !window.AssiseManager.showAssiseGrids) {
                    window.AssiseManager.toggleAssiseGrids(); // Restaurer les grilles d'assises

                }
                
                return capturedCanvas;
            }
            
        } catch (error) {




            
            // Tentative de capture d'urgence

            try {
                const emergencyCanvas = await html2canvas(canvas, {
                    scale: 0.5,
                    backgroundColor: '#ffffff',
                    logging: true
                });

                
                // Restaurer les éléments fantômes masqués même en cas d'urgence
                if (ghostObjectsState.length > 0) {
                    ghostObjectsState.forEach((state, index) => {
                        state.object.visible = state.originalVisible;
                        if (state.originalOpacity !== null && state.object.material) {
                            state.object.material.opacity = state.originalOpacity;
                        }
                    });

                }
                
                // VÉRIFICATION SPÉCIALE: S'assurer que le ciel et l'environnement sont visibles après urgence
                if (window.SceneManager && window.SceneManager.scene) {
                    window.SceneManager.scene.traverse((object) => {
                        if (object.isMesh && (
                            (object.name && (
                                object.name.toLowerCase().includes('sky') ||
                                object.name.toLowerCase().includes('ciel') ||
                                object.name.toLowerCase().includes('background') ||
                                object.name.toLowerCase().includes('environment')
                            )) ||
                            (object.userData && (
                                object.userData.type === 'sky' ||
                                object.userData.type === 'environment' ||
                                object.userData.category === 'sky' ||
                                object.userData.category === 'environment'
                            )) ||
                            (object.position && object.position.y > 100)
                        )) {
                            if (!object.visible) {
                                object.visible = true;

                            }
                        }
                    });
                }
                
                // Restaurer tous les éléments masqués même en cas d'urgence
                if (window.SceneManager && window.SceneManager.northArrowGroup && northArrowVisible !== undefined) {
                    window.SceneManager.northArrowGroup.visible = northArrowVisible;

                }
                
                if (window.SceneManager && gridVisible !== undefined) {
                    window.SceneManager.grid.visible = gridVisible;

                }
                
                if (window.SceneManager && axesVisible !== undefined) {
                    window.SceneManager.axesHelper.visible = axesVisible;

                }
                
                if (window.AssiseManager && originalAssiseGridsVisible !== undefined && originalAssiseGridsVisible && !window.AssiseManager.showAssiseGrids) {
                    window.AssiseManager.toggleAssiseGrids(); // Restaurer les grilles d'assises

                }
                
                return emergencyCanvas;
            } catch (emergencyError) {

                
                // Restaurer les éléments fantômes masqués même en cas d'échec total
                if (ghostObjectsState.length > 0) {
                    ghostObjectsState.forEach((state, index) => {
                        state.object.visible = state.originalVisible;
                        if (state.originalOpacity !== null && state.object.material) {
                            state.object.material.opacity = state.originalOpacity;
                        }
                    });

                }
                
                // VÉRIFICATION SPÉCIALE: S'assurer que le ciel et l'environnement sont visibles même après échec
                if (window.SceneManager && window.SceneManager.scene) {
                    window.SceneManager.scene.traverse((object) => {
                        if (object.isMesh && (
                            (object.name && (
                                object.name.toLowerCase().includes('sky') ||
                                object.name.toLowerCase().includes('ciel') ||
                                object.name.toLowerCase().includes('background') ||
                                object.name.toLowerCase().includes('environment')
                            )) ||
                            (object.userData && (
                                object.userData.type === 'sky' ||
                                object.userData.type === 'environment' ||
                                object.userData.category === 'sky' ||
                                object.userData.category === 'environment'
                            )) ||
                            (object.position && object.position.y > 100)
                        )) {
                            if (!object.visible) {
                                object.visible = true;

                            }
                        }
                    });
                }
                
                // Restaurer tous les éléments même en cas d'échec total
                if (window.SceneManager && window.SceneManager.northArrowGroup && northArrowVisible !== undefined) {
                    window.SceneManager.northArrowGroup.visible = northArrowVisible;

                }
                
                if (window.SceneManager && gridVisible !== undefined) {
                    window.SceneManager.grid.visible = gridVisible;

                }
                
                if (window.SceneManager && axesVisible !== undefined) {
                    window.SceneManager.axesHelper.visible = axesVisible;

                }
                
                if (window.AssiseManager && originalAssiseGridsVisible !== undefined && originalAssiseGridsVisible && !window.AssiseManager.showAssiseGrids) {
                    window.AssiseManager.toggleAssiseGrids(); // Restaurer les grilles d'assises

                }
                
                return null;
            }
        }
    }

    async switchToView(viewType) {
        // NOUVELLE APPROCHE: Pour les élévations gauche et droite, utiliser directement 
        // la caméra orthographique sans passer par les boutons de vue
        if (viewType === 'left' || viewType === 'right') {

            // Les élévations left/right seront gérées directement par setOrthographicCameraPosition
            // dans generateTechnicalElevation - pas besoin de switchToView
            return;
        }
        
        // Utiliser l'interface moderne si disponible pour les autres vues
        if (window.modernInterface && window.modernInterface.setCameraView) {
            const viewMap = {
                'top': 'top',
                'front': 'front', 
                'back': 'front',   // Pour l'instant, utilise la vue de face (inversée)
                'perspective': 'perspective'
            };
            
            const mappedView = viewMap[viewType];
            if (mappedView) {

                window.modernInterface.setCameraView(mappedView);
                
                // Pour les vues spéciales, faire une rotation supplémentaire si possible
                if (viewType === 'back') {
                    await this.adjustViewForSpecialAngles(viewType);
                }
            }
        }
        // Fallback avec les boutons de vue
        else {
            const viewButtons = {
                'top': 'viewTop',
                'front': 'viewFront',
                'back': 'viewFront',   // Utilise viewFront pour back
                'perspective': 'viewPerspective'
            };
            
            const buttonId = viewButtons[viewType];
            const button = document.getElementById(buttonId);
            if (button) {

                button.click();
                
                // Pour les vues spéciales, faire une rotation supplémentaire si possible
                if (viewType === 'back') {
                    await this.adjustViewForSpecialAngles(viewType);
                }
            }
        }
    }

    /**
     * Génère spécifiquement les élévations latérales (gauche et droite) avec optimisations
     */
    async generateLateralElevation(viewType, scaleString = '1:50') {

        
        if (viewType !== 'left' && viewType !== 'right') {

            return null;
        }
        
        if (!window.SceneManager || !window.SceneManager.scene || !window.SceneManager.renderer) {

            return null;
        }
        
        if (!window.THREE || !window.THREE.OrthographicCamera) {

            return null;
        }
        
        const sceneManager = window.SceneManager;
        const originalCamera = sceneManager.camera;
        
        // Variables de sauvegarde pour le finally
        let originalCameraPosition = null;
        let originalCameraTarget = null;
        let orthographicCamera = null;
        let gridVisible = undefined;
        let axesVisible = undefined;
        let northArrowVisible = undefined;
        let originalBackground = null;
        let originalSkyDome = null;
        let originalAssiseGridsVisible = undefined;
        let originalMaterials = [];
        let originalShadowMapEnabled = undefined;
        let ghostObjectsState = []; // Sauvegarde de l'état des éléments fantômes avancé
        
        try {
            // Analyse du bâtiment pour positionnement optimal
            const buildingAnalysis = this.calculateBuildingCenter(sceneManager);
            
            // CORRECTION: Utiliser la même logique d'échelle que generateTechnicalElevation
            const scaleFactor = this.parseScale(scaleString);
            const canvas = sceneManager.renderer.domElement;
            const aspect = canvas.clientWidth / canvas.clientHeight;
            
            // NOUVEAU: Utiliser calculateOptimalFrustumSize pour cohérence d'échelle
            const frustumSize = this.calculateOptimalFrustumSize(scaleFactor, viewType, buildingAnalysis);
            





            
            // Diagnostic de cohérence d'échelle





            
            // Créer la caméra orthographique
            orthographicCamera = new window.THREE.OrthographicCamera(
                -frustumSize * aspect / 2, 
                frustumSize * aspect / 2,
                frustumSize / 2, 
                -frustumSize / 2,
                0.1, 
                1000
            );
            
            // Position cohérente avec setOrthographicCameraPosition
            const distance = 300; // Distance de base standard
            const lateralDistance = distance * 1.2; // 20% plus loin pour left/right (cohérent avec setOrthographicCameraPosition)
            const buildingCenter = buildingAnalysis.center;
            
            if (viewType === 'left') {
                orthographicCamera.position.set(buildingCenter.x - lateralDistance, buildingCenter.y, buildingCenter.z);

            } else { // right
                orthographicCamera.position.set(buildingCenter.x + lateralDistance, buildingCenter.y, buildingCenter.z);

            }
            
            orthographicCamera.lookAt(buildingCenter.x, buildingCenter.y, buildingCenter.z);
            orthographicCamera.up.set(0, 1, 0);
            orthographicCamera.updateProjectionMatrix();
            
            // Sauvegarder l'état original
            originalCameraPosition = originalCamera.position.clone();
            originalCameraTarget = sceneManager.controls ? sceneManager.controls.target.clone() : new window.THREE.Vector3();
            
            // Remplacer la caméra
            sceneManager.camera = orthographicCamera;
            
            // Masquer les éléments non techniques
            gridVisible = sceneManager.grid?.visible;
            axesVisible = sceneManager.axesHelper?.visible;
            
            if (sceneManager.grid) sceneManager.grid.visible = false;
            if (sceneManager.axesHelper) sceneManager.axesHelper.visible = false;
            
            // Masquer la rose des vents
            if (sceneManager.northArrowGroup) {
                northArrowVisible = sceneManager.northArrowGroup.visible;
                sceneManager.northArrowGroup.visible = false;
            }

            // NOUVEAU SYSTÈME DE MASQUAGE FANTÔMES AVANCÉ POUR ÉLÉVATIONS LATÉRALES - ULTRA COMPLET

            let phantomCount = 0;
            let ghostObjectsState = []; // Sauvegarde de l'état des éléments fantômes
            
            sceneManager.scene.traverse((object) => {
                if (object.isMesh && object.visible) {
                    let shouldHide = false;
                    let reason = '';
                    
                    // Critère 1: Opacité exacte de 0.7 (éléments fantômes identifiés)
                    if (object.material && object.material.transparent && object.material.opacity === 0.7) {
                        shouldHide = true;
                        reason = 'opacity_0.7';
                    }
                    
                    // Critère 2: Opacité très faible (< 1.0) avec transparence activée - ÉLARGI
                    else if (object.material && object.material.transparent && object.material.opacity < 1.0) {
                        shouldHide = true;
                        reason = `opacity_${object.material.opacity}`;
                    }
                    
                    // Critère 2bis: Matériaux avec opacité sans transparence explicite mais < 1.0
                    else if (object.material && object.material.opacity !== undefined && object.material.opacity < 1.0) {
                        shouldHide = true;
                        reason = `opacity_no_transparent_${object.material.opacity}`;
                    }
                    
                    // Critère 3: Vérification des userData pour éléments fantômes
                    else if (object.userData && (
                        object.userData.ghost || 
                        object.userData.suggestion || 
                        object.userData.preview || 
                        object.userData.phantom ||
                        object.userData.temporary ||
                        object.userData.isGhost ||
                        object.userData.isSuggestion ||
                        object.userData.isPreview
                    )) {
                        shouldHide = true;
                        reason = 'userData_ghost';
                    }
                    
                    // Critère 4: Noms suspects d'éléments fantômes
                    else if (object.name && (
                        object.name.toLowerCase().includes('ghost') ||
                        object.name.toLowerCase().includes('suggestion') ||
                        object.name.toLowerCase().includes('preview') ||
                        object.name.toLowerCase().includes('phantom') ||
                        object.name.toLowerCase().includes('temp') ||
                        object.name.toLowerCase().includes('fantome')
                    )) {
                        shouldHide = true;
                        reason = `name_${object.name}`;
                    }
                    
                    // Critère 5: Position extrême (peut indiquer des éléments hors-vue)
                    else if (object.position && (
                        object.position.y > 1000 || 
                        object.position.y < -1000 ||
                        Math.abs(object.position.x) > 5000 ||
                        Math.abs(object.position.z) > 5000
                    )) {
                        shouldHide = true;
                        reason = `extreme_position_[${object.position.x.toFixed(1)}, ${object.position.y.toFixed(1)}, ${object.position.z.toFixed(1)}]`;
                    }
                    
                    // Critère 6: Matériaux avec noms fantômes
                    else if (object.material && object.material.name && (
                        object.material.name.toLowerCase().includes('ghost') ||
                        object.material.name.toLowerCase().includes('preview') ||
                        object.material.name.toLowerCase().includes('suggestion')
                    )) {
                        shouldHide = true;
                        reason = `material_${object.material.name}`;
                    }
                    
                    // NOUVEAU Critère 7: Éléments avec parent fantôme (détection hiérarchique)
                    else if (object.parent && object.parent.userData && (
                        object.parent.userData.ghost || 
                        object.parent.userData.suggestion ||
                        object.parent.userData.preview
                    )) {
                        shouldHide = true;
                        reason = 'parent_ghost';
                    }
                    
                    // NOUVEAU Critère 8: Éléments sans userData.element (potentiels fantômes non-intégrés)
                    else if (!object.userData || !object.userData.element) {
                        // Vérifier si c'est un élément de construction réel vs fantôme
                        let isRealElement = false;
                        
                        // Éléments de construction réels ont généralement ces caractéristiques
                        if (object.userData && (
                            object.userData.type === 'ground' ||
                            object.userData.type === 'interaction' ||
                            object.userData.category === 'floor' ||
                            object.userData.category === 'plane' ||
                            object.name === 'WallSim3D_GroundFloor' ||
                            object.name === 'WallSim3D_InteractionPlane'
                        )) {
                            isRealElement = true;
                        }
                        
                        // Si ce n'est pas un élément système et qu'il n'a pas de userData.element, c'est suspect
                        if (!isRealElement && object.geometry && object.material) {
                            shouldHide = true;
                            reason = 'no_userData_element_suspect';
                        }
                    }
                    
                    // NOUVEAU Critère 9: Éléments avec visibility ou renderOrder suspects
                    else if (object.renderOrder !== undefined && object.renderOrder < 0) {
                        shouldHide = true;
                        reason = `negative_renderOrder_${object.renderOrder}`;
                    }
                    
                    // NOUVEAU Critère 10: Éléments avec des matériaux temporaires ou de debug
                    else if (object.material && (
                        (object.material.color && object.material.color.getHexString && 
                         (object.material.color.getHexString() === 'ff0000' || // Rouge debug
                          object.material.color.getHexString() === '00ff00' || // Vert debug
                          object.material.color.getHexString() === '0000ff'))) // Bleu debug
                    ) {
                        shouldHide = true;
                        reason = `debug_color_${object.material.color.getHexString()}`;
                    }
                    
                    // Masquer l'objet si nécessaire
                    if (shouldHide) {
                        // Sauvegarder l'état original
                        ghostObjectsState.push({
                            object: object,
                            originalVisible: object.visible,
                            originalOpacity: object.material ? object.material.opacity : null
                        });
                        
                        // Masquer complètement l'objet
                        object.visible = false;
                        phantomCount++;
                        

                    }
                }
            });
            

            
            // Masquer les grilles des assises
            if (window.AssiseManager) {
                originalAssiseGridsVisible = window.AssiseManager.showAssiseGrids;
                if (window.AssiseManager.showAssiseGrids) {
                    window.AssiseManager.toggleAssiseGrids();
                }
            }
            
            // Fond blanc et pas d'ombres
            originalBackground = sceneManager.scene.background;
            originalSkyDome = sceneManager.skyDome?.visible;
            
            sceneManager.scene.background = new window.THREE.Color(0xffffff);
            if (sceneManager.skyDome) sceneManager.skyDome.visible = false;
            
            originalShadowMapEnabled = sceneManager.renderer.shadowMap.enabled;
            sceneManager.renderer.shadowMap.enabled = false;
            
            // Matériaux techniques blancs
            this.setTechnicalMaterials(originalMaterials, sceneManager);
            
            // Ajouter la ligne 3D de niveau 0.00
            const groundLevelLine = this.addGroundLevelLine3D(sceneManager, viewType);
            
            // Rendu optimisé
            sceneManager.renderer.render(sceneManager.scene, orthographicCamera);
            await new Promise(resolve => setTimeout(resolve, 150));
            
            // Capture
            const canvas2D = document.createElement('canvas');
            const ctx = canvas2D.getContext('2d');
            canvas2D.width = canvas.width;
            canvas2D.height = canvas.height;
            
            // Fond blanc
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas2D.width, canvas2D.height);
            
            try {
                const imageData = canvas.toDataURL('image/png', 1.0);
                const img = new Image();
                
                return new Promise((resolve) => {
                    img.onload = () => {
                        ctx.drawImage(img, 0, 0);

                        resolve(canvas2D);
                    };
                    img.onerror = () => {

                        resolve(null);
                    };
                    img.src = imageData;
                });
                
            } catch (error) {

                return null;
            }
            
        } catch (error) {

            return null;
        } finally {
            // Restauration complète
            if (originalCamera && sceneManager) {
                sceneManager.camera = originalCamera;
                
                if (sceneManager.controls && originalCameraPosition && originalCameraTarget) {
                    sceneManager.controls.enabled = true;
                    originalCamera.position.copy(originalCameraPosition);
                    sceneManager.controls.target.copy(originalCameraTarget);
                    sceneManager.controls.update();
                }
                
                // Restaurer tous les éléments
                if (sceneManager.grid && gridVisible !== undefined) sceneManager.grid.visible = gridVisible;
                if (sceneManager.axesHelper && axesVisible !== undefined) sceneManager.axesHelper.visible = axesVisible;
                if (sceneManager.northArrowGroup && northArrowVisible !== undefined) sceneManager.northArrowGroup.visible = northArrowVisible;
                
                // Restaurer les éléments fantômes masqués
                if (ghostObjectsState && ghostObjectsState.length > 0) {
                    ghostObjectsState.forEach((state, index) => {
                        state.object.visible = state.originalVisible;
                        if (state.originalOpacity !== null && state.object.material) {
                            state.object.material.opacity = state.originalOpacity;
                        }
                    });

                }
                
                if (window.AssiseManager && originalAssiseGridsVisible !== undefined && originalAssiseGridsVisible && !window.AssiseManager.showAssiseGrids) {
                    window.AssiseManager.toggleAssiseGrids();
                }
                
                this.restoreOriginalMaterials(originalMaterials, sceneManager);
                
                if (originalShadowMapEnabled !== undefined) {
                    sceneManager.renderer.shadowMap.enabled = originalShadowMapEnabled;
                }
                
                if (originalBackground !== null) sceneManager.scene.background = originalBackground;
                if (sceneManager.skyDome && originalSkyDome !== undefined) sceneManager.skyDome.visible = originalSkyDome;
                
                // Supprimer la ligne 3D
                this.removeGroundLevelLine3D(sceneManager);
                
                // Rendu final
                sceneManager.renderer.render(sceneManager.scene, originalCamera);
            }
            

        }
    }

    /**
     * Génère une vraie élévation technique 2D (projection orthographique)
     * pour les exports PDF
     */
    async generateTechnicalElevation(viewType, scaleString = '1:50') {

        
        if (!window.SceneManager || !window.SceneManager.scene || !window.SceneManager.renderer) {

            return null;
        }
        
        // Vérifier que THREE est disponible
        if (!window.THREE || !window.THREE.OrthographicCamera) {

            return null;
        }
        
        const sceneManager = window.SceneManager;
        const originalCamera = sceneManager.camera;
        
        // Déclarer les variables de sauvegarde en dehors du try pour le finally
        let originalCameraPosition = null;
        let originalCameraTarget = null;
        let orthographicCamera = null;
        let gridVisible = undefined;
        let axesVisible = undefined;
        let northArrowVisible = undefined; // Pour masquer l'indication du Nord
        let originalBackground = null;
        let originalSkyDome = null;
        let originalGhostVisible = undefined;
        let originalSuggestionGhosts = [];
        let originalAssiseGridsVisible = undefined;
        let originalMaterials = []; // Pour sauvegarder les matériaux originaux des briques
        let originalShadowMapEnabled = undefined; // Pour désactiver les ombres
        let hiddenGhostObjects = []; // Pour masquer tous les objets fantômes de la scène
        let hiddenPlaneObjects = []; // Pour masquer les plans d'assise dans la vue du dessus
        let ghostObjectsState = []; // Sauvegarde de l'état des éléments fantômes avancé
        
        try {
            // Calculer la taille du frustum basée sur l'échelle
            const scaleFactor = this.parseScale(scaleString);

            
            // Créer une caméra orthographique temporaire pour une vraie projection 2D
            const canvas = sceneManager.renderer.domElement;
            const aspect = canvas.clientWidth / canvas.clientHeight;
            
            // Calculer le centre et les dimensions réels du bâtiment pour optimiser le frustum
            const buildingAnalysis = this.calculateBuildingCenter(sceneManager);
            
            // Utiliser l'échelle choisie par l'utilisateur pour tous les types de vues
            const effectiveScaleFactor = scaleFactor;

            
            // Calculer la taille optimale du frustum basée sur l'échelle choisie
            const frustumSize = this.calculateOptimalFrustumSize(effectiveScaleFactor, viewType, buildingAnalysis);
            


            
            orthographicCamera = new window.THREE.OrthographicCamera(
                -frustumSize * aspect / 2, 
                frustumSize * aspect / 2,
                frustumSize / 2, 
                -frustumSize / 2,
                0.1, 
                1000
            );
            
            // DÉBOGAGE: Log avant positionnement de la caméra


            
            // Positionner la caméra orthographique selon la vue demandée
            this.setOrthographicCameraPosition(orthographicCamera, viewType, sceneManager);

            // RECENTRAGE LATÉRAL : Ajuster la position/target pour centrer exactement le bâtiment dans le frustum
            if (buildingAnalysis && buildingAnalysis.boundingBox) {
                const bb = buildingAnalysis.boundingBox; // THREE.Box3
                const centerX = (bb.min.x + bb.max.x) / 2;
                const centerZ = (bb.min.z + bb.max.z) / 2;
                // Pour les vues d'élévation (front/back -> axe X, left/right -> axe Z)
                // On replace la caméra de façon relative sans modifier la distance Y ou l'axe principal
                if (viewType === 'front' || viewType === 'back') {
                    // Centrer sur X et Z
                    orthographicCamera.position.x = centerX;
                    orthographicCamera.lookAt(centerX, 0, centerZ);
                } else if (viewType === 'left' || viewType === 'right') {
                    orthographicCamera.position.z = centerZ;
                    orthographicCamera.lookAt(centerX, 0, centerZ);
                } else if (viewType === 'top') {
                    // Vue du dessus : centrer X et Z
                    orthographicCamera.position.x = centerX;
                    orthographicCamera.position.z = centerZ;
                    orthographicCamera.lookAt(centerX, 0, centerZ);
                }
                orthographicCamera.updateMatrixWorld(true);
            }
            
            // DÉBOGAGE: Log après positionnement de la caméra



            
            // Positionner la caméra orthographique selon la vue demandée
            this.setOrthographicCameraPosition(orthographicCamera, viewType, sceneManager);
            
            // Sauvegarder l'état original
            originalCameraPosition = originalCamera.position.clone();
            originalCameraTarget = sceneManager.controls ? sceneManager.controls.target.clone() : new window.THREE.Vector3();
            
            // Remplacer temporairement la caméra
            sceneManager.camera = orthographicCamera;
            
            // Masquer temporairement les éléments 3D non techniques (grille, axes, etc.)
            gridVisible = sceneManager.grid?.visible;
            axesVisible = sceneManager.axesHelper?.visible;
            
            if (sceneManager.grid) sceneManager.grid.visible = false;
            if (sceneManager.axesHelper) sceneManager.axesHelper.visible = false;
            
            // Masquer l'indication du Nord pour toutes les élévations (front, left, right, back)
            // Seule la vue du dessus (top) peut garder la flèche du Nord visible
            if (sceneManager.northArrowGroup && viewType !== 'top') {
                northArrowVisible = sceneManager.northArrowGroup.visible;
                sceneManager.northArrowGroup.visible = false;

            }

            // NOUVEAU SYSTÈME DE MASQUAGE FANTÔMES AVANCÉ POUR ÉLÉVATIONS TECHNIQUES - ULTRA COMPLET

            let phantomCount = 0;
            let ghostObjectsState = []; // Sauvegarde de l'état des éléments fantômes
            
            sceneManager.scene.traverse((object) => {
                if (object.isMesh && object.visible) {
                    let shouldHide = false;
                    let reason = '';
                    
                    // Critère 1: Opacité exacte de 0.7 (éléments fantômes identifiés)
                    if (object.material && object.material.transparent && object.material.opacity === 0.7) {
                        shouldHide = true;
                        reason = 'opacity_0.7';
                    }
                    
                    // Critère 2: Opacité très faible (< 1.0) avec transparence activée - ÉLARGI
                    else if (object.material && object.material.transparent && object.material.opacity < 1.0) {
                        shouldHide = true;
                        reason = `opacity_${object.material.opacity}`;
                    }
                    
                    // Critère 2bis: Matériaux avec opacité sans transparence explicite mais < 1.0
                    else if (object.material && object.material.opacity !== undefined && object.material.opacity < 1.0) {
                        shouldHide = true;
                        reason = `opacity_no_transparent_${object.material.opacity}`;
                    }
                    
                    // Critère 3: Vérification des userData pour éléments fantômes
                    else if (object.userData && (
                        object.userData.ghost || 
                        object.userData.suggestion || 
                        object.userData.preview || 
                        object.userData.phantom ||
                        object.userData.temporary ||
                        object.userData.isGhost ||
                        object.userData.isSuggestion ||
                        object.userData.isPreview
                    )) {
                        shouldHide = true;
                        reason = 'userData_ghost';
                    }
                    
                    // Critère 4: Noms suspects d'éléments fantômes
                    else if (object.name && (
                        object.name.toLowerCase().includes('ghost') ||
                        object.name.toLowerCase().includes('suggestion') ||
                        object.name.toLowerCase().includes('preview') ||
                        object.name.toLowerCase().includes('phantom') ||
                        object.name.toLowerCase().includes('temp') ||
                        object.name.toLowerCase().includes('fantome')
                    )) {
                        shouldHide = true;
                        reason = `name_${object.name}`;
                    }
                    
                    // Critère 5: Position extrême (peut indiquer des éléments hors-vue)
                    else if (object.position && (
                        object.position.y > 1000 || 
                        object.position.y < -1000 ||
                        Math.abs(object.position.x) > 5000 ||
                        Math.abs(object.position.z) > 5000
                    )) {
                        shouldHide = true;
                        reason = `extreme_position_[${object.position.x.toFixed(1)}, ${object.position.y.toFixed(1)}, ${object.position.z.toFixed(1)}]`;
                    }
                    
                    // Critère 6: Matériaux avec noms fantômes
                    else if (object.material && object.material.name && (
                        object.material.name.toLowerCase().includes('ghost') ||
                        object.material.name.toLowerCase().includes('preview') ||
                        object.material.name.toLowerCase().includes('suggestion')
                    )) {
                        shouldHide = true;
                        reason = `material_${object.material.name}`;
                    }
                    
                    // NOUVEAU Critère 7: Éléments avec parent fantôme (détection hiérarchique)
                    else if (object.parent && object.parent.userData && (
                        object.parent.userData.ghost || 
                        object.parent.userData.suggestion ||
                        object.parent.userData.preview
                    )) {
                        shouldHide = true;
                        reason = 'parent_ghost';
                    }
                    
                    // NOUVEAU Critère 8: Éléments sans userData.element (potentiels fantômes non-intégrés)
                    else if (!object.userData || !object.userData.element) {
                        // Vérifier si c'est un élément de construction réel vs fantôme
                        let isRealElement = false;
                        
                        // Éléments de construction réels ont généralement ces caractéristiques
                        if (object.userData && (
                            object.userData.type === 'ground' ||
                            object.userData.type === 'interaction' ||
                            object.userData.category === 'floor' ||
                            object.userData.category === 'plane' ||
                            object.name === 'WallSim3D_GroundFloor' ||
                            object.name === 'WallSim3D_InteractionPlane'
                        )) {
                            isRealElement = true;
                        }
                        
                        // Si ce n'est pas un élément système et qu'il n'a pas de userData.element, c'est suspect
                        if (!isRealElement && object.geometry && object.material) {
                            shouldHide = true;
                            reason = 'no_userData_element_suspect';
                        }
                    }
                    
                    // NOUVEAU Critère 9: Éléments avec visibility ou renderOrder suspects
                    else if (object.renderOrder !== undefined && object.renderOrder < 0) {
                        shouldHide = true;
                        reason = `negative_renderOrder_${object.renderOrder}`;
                    }
                    
                    // NOUVEAU Critère 10: Éléments avec des matériaux temporaires ou de debug
                    else if (object.material && (
                        (object.material.color && object.material.color.getHexString && 
                         (object.material.color.getHexString() === 'ff0000' || // Rouge debug
                          object.material.color.getHexString() === '00ff00' || // Vert debug
                          object.material.color.getHexString() === '0000ff'))) // Bleu debug
                    ) {
                        shouldHide = true;
                        reason = `debug_color_${object.material.color.getHexString()}`;
                    }
                    
                    // Masquer l'objet si nécessaire
                    if (shouldHide) {
                        // Sauvegarder l'état original
                        ghostObjectsState.push({
                            object: object,
                            originalVisible: object.visible,
                            originalOpacity: object.material ? object.material.opacity : null
                        });
                        
                        // Masquer complètement l'objet
                        object.visible = false;
                        phantomCount++;
                        

                    }
                }
            });
            

            
            // Masquer temporairement les grilles des assises
            if (window.AssiseManager) {
                originalAssiseGridsVisible = window.AssiseManager.showAssiseGrids;
                if (window.AssiseManager.showAssiseGrids) {
                    window.AssiseManager.toggleAssiseGrids(); // Masquer les grilles d'assises

                }
            }
            
            // Masquer temporairement le sol gris pour la vue du dessus
            if (viewType === 'top') {

                let allObjects = [];
                
                sceneManager.scene.traverse((object) => {
                    if (object.isMesh && object.visible) {
                        allObjects.push({
                            name: object.name || 'sans nom',
                            userData: object.userData,
                            position: {x: object.position.x.toFixed(1), y: object.position.y.toFixed(1), z: object.position.z.toFixed(1)},
                            hasElement: !!object.userData.element
                        });
                        
                        // ✨ DÉTECTION SIMPLIFIÉE ET FIABLE ✨
                        const isGroundToMask = 
                            // 1. Recherche par nom spécifique (le plus fiable)
                            (object.name === 'WallSim3D_GroundFloor' || 
                             object.name === 'WallSim3D_InteractionPlane') ||
                            
                            // 2. Recherche par métadonnées spécifiques
                            (object.userData.isGround === true && object.userData.maskInTopView === true) ||
                            
                            // 3. Recherche par type dans userData
                            (object.userData.type === 'ground' || object.userData.category === 'floor') ||
                            
                            // 4. Fallback pour anciens objets sans identification
                            (object.position.y <= 2.0 && // Position Y très faible
                             object.geometry?.type === 'PlaneGeometry' &&
                             !object.userData.element && // Exclure les briques
                             !object.userData.isJoint && // Exclure les joints
                             (object.scale.x > 100 || object.scale.z > 100)); // Grande surface
                        
                        if (isGroundToMask) {
                            const detectionMethod = object.name?.startsWith('WallSim3D_') ? 'name' :
                                                  object.userData.isGround ? 'userData' :
                                                  object.userData.type === 'ground' ? 'type' : 'fallback';
                            

                            hiddenPlaneObjects.push({
                                object: object,
                                originalVisible: object.visible
                            });
                            object.visible = false;
                        }
                    }
                });
                


                
                if (hiddenPlaneObjects.length === 0) {


                }
            }
            
            // Sauvegarder et remplacer le background de la scène par un fond transparent/blanc
            originalBackground = sceneManager.scene.background;
            originalSkyDome = sceneManager.skyDome?.visible;
            
            // Mettre un fond blanc pour les élévations techniques
            sceneManager.scene.background = new window.THREE.Color(0xffffff);
            if (sceneManager.skyDome) sceneManager.skyDome.visible = false;
            
            // Désactiver les ombres pour l'export technique
            originalShadowMapEnabled = sceneManager.renderer.shadowMap.enabled;
            sceneManager.renderer.shadowMap.enabled = false;

            
            // Changer temporairement les matériaux des briques en blanc avec contours noirs
            this.setTechnicalMaterials(originalMaterials, sceneManager);
            
            // Ajouter la ligne 3D de niveau 0.00 pour les élévations (pas pour la vue du dessus)
            let groundLevelLine = null;
            if (viewType !== 'top') {
                groundLevelLine = this.addGroundLevelLine3D(sceneManager, viewType);
            }
            
            // Note: Les fantômes sont déjà masqués par la fonction appelante (captureCurrentView)
            // Pas besoin de les masquer à nouveau ici
            
            // Rendu avec la caméra orthographique
            sceneManager.renderer.render(sceneManager.scene, orthographicCamera);
            
            // Attendre que le rendu soit terminé
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Capturer l'image
            const canvas2D = document.createElement('canvas');
            const ctx = canvas2D.getContext('2d');
            canvas2D.width = canvas.width;
            canvas2D.height = canvas.height;
            
            // Fond blanc pour l'élévation technique
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas2D.width, canvas2D.height);
            
            // Copier le rendu orthographique
            try {
                const imageData = canvas.toDataURL('image/png', 1.0);
                const img = new Image();
                
                return new Promise((resolve) => {
                    img.onload = () => {
                        ctx.drawImage(img, 0, 0);
                        
                        // Ajouter des éléments techniques si nécessaire
                        this.addTechnicalAnnotations(ctx, canvas2D.width, canvas2D.height, viewType, scaleString);
                        

                        resolve(canvas2D);
                    };
                    
                    img.onerror = () => {

                        resolve(null);
                    };
                    
                    img.src = imageData;
                });
                
            } catch (error) {

                return null;
            }
            
        } catch (error) {

            return null;
        } finally {
            // Restaurer l'état original seulement si les variables ont été initialisées
            if (originalCamera && sceneManager) {
                sceneManager.camera = originalCamera;
                
                if (sceneManager.controls && originalCameraPosition && originalCameraTarget) {
                    originalCamera.position.copy(originalCameraPosition);
                    sceneManager.controls.target.copy(originalCameraTarget);
                    sceneManager.controls.update();
                }
                
                // Restaurer la visibilité des éléments
                if (sceneManager.grid && gridVisible !== undefined) sceneManager.grid.visible = gridVisible;
                if (sceneManager.axesHelper && axesVisible !== undefined) sceneManager.axesHelper.visible = axesVisible;
                
                // Restaurer la rose des vents si elle a été masquée
                if (sceneManager.northArrowGroup && northArrowVisible !== undefined) {
                    sceneManager.northArrowGroup.visible = northArrowVisible;

                }
                
                // Restaurer les éléments fantômes masqués
                if (ghostObjectsState && ghostObjectsState.length > 0) {
                    ghostObjectsState.forEach((state, index) => {
                        state.object.visible = state.originalVisible;
                        if (state.originalOpacity !== null && state.object.material) {
                            state.object.material.opacity = state.originalOpacity;
                        }
                    });

                }
                
                // Restaurer les grilles des assises
                if (window.AssiseManager && originalAssiseGridsVisible !== undefined) {
                    if (originalAssiseGridsVisible && !window.AssiseManager.showAssiseGrids) {
                        window.AssiseManager.toggleAssiseGrids(); // Remettre les grilles d'assises

                    }
                }
                
                // Restaurer les matériaux originaux des briques et joints
                this.restoreOriginalMaterials(originalMaterials, sceneManager);
                
                // Restaurer les ombres
                if (originalShadowMapEnabled !== undefined) {
                    sceneManager.renderer.shadowMap.enabled = originalShadowMapEnabled;

                }
                
                // Restaurer le background original
                if (originalBackground !== null) sceneManager.scene.background = originalBackground;
                if (sceneManager.skyDome && originalSkyDome !== undefined) sceneManager.skyDome.visible = originalSkyDome;
                
                // Restaurer les briques fantômes et suggestions
                if (window.ConstructionTools) {
                    // Restaurer l'élément fantôme principal
                    if (window.ConstructionTools.ghostElement && window.ConstructionTools.ghostElement.mesh && originalGhostVisible !== undefined) {
                        window.ConstructionTools.ghostElement.mesh.visible = originalGhostVisible;

                    }
                    
                    // Restaurer tous les fantômes de suggestions
                    if (originalSuggestionGhosts.length > 0) {
                        originalSuggestionGhosts.forEach(item => {
                            if (item.ghost) {
                                item.ghost.visible = item.visible;
                            }
                        });

                    }
                }
                
                // Restaurer tous les objets fantômes détectés par analyse de scène
                if (hiddenGhostObjects.length > 0) {
                    hiddenGhostObjects.forEach(item => {
                        if (item.object) {
                            item.object.visible = item.visible;
                        }
                    });

                }
                
                // Restaurer les objets sol masqués pour la vue du dessus
                if (hiddenPlaneObjects.length > 0) {
                    hiddenPlaneObjects.forEach(item => {
                        if (item.object) {
                            item.object.visible = item.originalVisible;
                        }
                    });

                }
                
                // Supprimer la ligne 3D de niveau 0.00 si elle a été ajoutée
                this.removeGroundLevelLine3D(sceneManager);
                
                // Rendu final avec la caméra originale
                sceneManager.renderer.render(sceneManager.scene, originalCamera);
            }
        }
    }
    
    /**
     * Parse une échelle textuelle (ex: "1:50") et retourne le facteur numérique
     * FACTEURS CORRECTIFS RÉINITIALISÉS - Version standardisée
     */
    parseScale(scaleString) {
        try {
            // Utiliser la configuration réinitialisée si disponible
            if (window.ScaleFactorsConfig && window.ScaleFactorsConfig.SCALE_CONFIG.AVAILABLE_SCALES[scaleString]) {
                const config = window.ScaleFactorsConfig.SCALE_CONFIG.AVAILABLE_SCALES[scaleString];

                return config.factor;
            }
            
            // Fallback: parser les formats possibles: "1:50", "1/50", "50"
            if (scaleString.includes(':')) {
                const parts = scaleString.split(':');
                const numerator = parseFloat(parts[0]) || 1;
                const denominator = parseFloat(parts[1]) || 20; // DÉFAUT RÉINITIALISÉ: 1:20
                return denominator / numerator; // 1:50 -> 50
            } else if (scaleString.includes('/')) {
                const parts = scaleString.split('/');
                const numerator = parseFloat(parts[0]) || 1;
                const denominator = parseFloat(parts[1]) || 20; // DÉFAUT RÉINITIALISÉ: 1:20
                return denominator / numerator;
            } else {
                // Format numérique direct
                const factor = parseFloat(scaleString) || 20; // DÉFAUT RÉINITIALISÉ: 1:20
                return factor;
            }
        } catch (error) {

            return 20; // DÉFAUT RÉINITIALISÉ: 1:20 au lieu de 1:50
        }
    }

    /**
     * Calcule la taille optimale du frustum pour une échelle donnée
     * FACTEURS CORRECTIFS RÉINITIALISÉS - Méthode unifiée
     */
    calculateOptimalFrustumSize(scaleFactor, viewType, buildingAnalysis = null) {
        // Utiliser les dimensions réelles du bâtiment si disponibles, sinon les estimations
        let actualBuildingSize;
        
        if (buildingAnalysis && buildingAnalysis.elementCount > 0) {
            // Utiliser les dimensions réelles calculées
            actualBuildingSize = {
                width: buildingAnalysis.size.x,
                height: buildingAnalysis.size.y, 
                depth: buildingAnalysis.size.z
            };

        } else {
            // Estimation de la taille typique d'un bâtiment WallSim3D (fallback)
            actualBuildingSize = {
                width: 200,   // 200 cm (2m) de large 
                height: 100,  // 100 cm (1m) de haut
                depth: 150    // 150 cm (1.5m) de profondeur
            };

        }
        
        // Ajouter une marge pour voir tout le bâtiment (20% de marge pour optimiser l'espace)
    // Marge augmentée pour éviter que les objets soient rognés sur les bords lors de l'export
    const margin = 1.35; // ancien 1.2
        
        let maxDimension;
        switch(viewType) {
            case 'top':
                // Pour la vue du dessus, utiliser la plus grande dimension horizontale
                maxDimension = Math.max(actualBuildingSize.width, actualBuildingSize.depth);

                break;
            case 'front':
            case 'back':
            case 'left':
            case 'right':
                // 🎯 CORRECTION ÉCHELLE: Toutes les élévations utilisent la MÊME dimension de référence
                // pour garantir un frustum identique à échelle égale = cohérence visuelle parfaite
                maxDimension = Math.max(actualBuildingSize.width, actualBuildingSize.depth);


                break;
            default:
                maxDimension = Math.max(actualBuildingSize.width, actualBuildingSize.height);
        }
        
        // CALCUL D'ÉCHELLE TECHNIQUE CORRIGÉ:
        // Le scaleFactor reçu est déjà l'échelle effective (déterminée en amont)
        // Vue du dessus = échelle utilisateur, Élévations = 1:20
        
        // Base: dimension réelle du bâtiment avec marge (déjà définie plus haut)
        const realSizeWithMargin = maxDimension * margin;
        
        // CORRECTION CALCUL D'ÉCHELLE TECHNIQUE: 
        // Pour une échelle 1:20, 1cm sur papier = 20cm réels
        // Donc le frustum doit être proportionnel au facteur d'échelle
        // Plus l'échelle est petite (grand dénominateur), plus le frustum doit être grand pour voir plus de détails
        
        // 🔧 FACTEUR CORRECTIF AJUSTÉ: Correction basée sur nouvelle observation
        // Observation 1: élément 120cm → 1.4cm au lieu de 6cm → facteur 4.286
        // Observation 2: élément 120cm → 5.2cm au lieu de 6cm → facteur 1.154
        // Nouveau facteur spécifié par l'utilisateur: 4.8
        const SCALE_CORRECTION_FACTOR = 4.8; // Facteur correctif fixé à 4.8
        
        const technicalScale = (scaleFactor / 10.0) / SCALE_CORRECTION_FACTOR; // Échelle 1:20 → facteur 2.0/4.8 ≈ 0.417
        
        // Frustum final basé sur l'échelle technique réelle corrigée
        // Plus l'échelle est grande (petit dénominateur), plus le frustum est petit (zoom avant)
        // Plus l'échelle est petite (grand dénominateur), plus le frustum est grand (zoom arrière)
    let frustumSize = realSizeWithMargin * technicalScale; // Calcul direct cohérent avec correction
    // Ajout: léger élargissement de sécurité horizontal pour éviter coupures (5%)
    frustumSize *= 1.05;
        
        // Diagnostic de l'échelle calculée












        
        // Limiter pour éviter des frustums trop grands ou trop petits
        const finalFrustumSize = Math.max(30, Math.min(1000, frustumSize));
        
        if (finalFrustumSize !== frustumSize) {

        }
        

        return finalFrustumSize;
    }

    /**
     * Calcule automatiquement le centre du bâtiment en analysant la géométrie
     */
    calculateBuildingCenter(sceneManager) {
        const boundingBox = new window.THREE.Box3();
        let elementCount = 0;
        let brickPositions = []; // Pour debug et analyse détaillée
        
        // Parcourir tous les objets de la scène pour calculer la bounding box
        sceneManager.scene.traverse((object) => {
            if (object.isMesh && object.userData) {
                const userData = object.userData;
                
                // Détecter les éléments de construction (briques, blocs) avec vérifications strictes
                const isConstructionElement = userData && (
                    userData.type === 'brick' || userData.elementType === 'brick' || 
                    userData.type === 'block' || userData.elementType === 'block' ||
                    userData.category === 'brick' || userData.category === 'block' ||
                    userData.isBrick || userData.isBlock ||
                    // Vérifier si l'objet fait partie d'une assise
                    userData.assiseId !== undefined || userData.courseIndex !== undefined
                ) && (
                    // NOUVELLES VÉRIFICATIONS STRICTES - L'élément doit être vraiment intégré
                    // Exclure les éléments temporaires, fantômes ou non-posés
                    !userData.isTemporary && 
                    !userData.isGhost && 
                    !userData.phantom && 
                    !userData.preview && 
                    !userData.suggestion &&
                    // Si c'est un WallElement, s'assurer qu'il est intégré dans une assise
                    (
                        !userData.element || 
                        (userData.element && userData.element.constructor && userData.element.constructor.name === 'WallElement' && 
                         (userData.assiseId !== undefined || userData.courseIndex !== undefined || userData.placed === true))
                    ) &&
                    // Vérifier que l'objet n'est pas masqué ou invisible par défaut
                    object.visible &&
                    // Vérifier que l'objet a une taille raisonnable (éviter les objets de dimension 0)
                    object.scale.x > 0 && object.scale.y > 0 && object.scale.z > 0
                );
                
                if (isConstructionElement) {
                    // Mettre à jour la géométrie de l'objet pour avoir des coordonnées mondiales correctes
                    object.updateMatrixWorld(true);
                    
                    // Créer une bounding box temporaire pour cet objet
                    const objectBox = new window.THREE.Box3().setFromObject(object);
                    
                    // Stocker les positions pour debug
                    const worldPosition = new window.THREE.Vector3();
                    object.getWorldPosition(worldPosition);
                    brickPositions.push({
                        position: worldPosition.clone(),
                        box: objectBox,
                        name: object.name || 'unnamed',
                        userData: userData
                    });
                    
                    if (elementCount === 0) {
                        boundingBox.copy(objectBox);
                    } else {
                        boundingBox.union(objectBox);
                    }
                    elementCount++;
                }
            }
        });
        
        if (elementCount > 0) {
            const center = boundingBox.getCenter(new window.THREE.Vector3());
            const size = boundingBox.getSize(new window.THREE.Vector3());
            




            
            // Log des premières positions pour debug + vérification du centre
            if (brickPositions.length > 0) {

                brickPositions.slice(0, 3).forEach((brick, index) => {

                });
                
                // Vérification supplémentaire du centre - calculer la moyenne des positions
                let sumX = 0, sumY = 0, sumZ = 0;
                brickPositions.forEach(brick => {
                    sumX += brick.position.x;
                    sumY += brick.position.y;
                    sumZ += brick.position.z;
                });
                const avgCenter = {
                    x: sumX / brickPositions.length,
                    y: sumY / brickPositions.length,
                    z: sumZ / brickPositions.length
                };
                


                
                // Utiliser le centre moyen si la différence est significative (améliore le cadrage)
                if (Math.abs(center.x - avgCenter.x) > 10 || Math.abs(center.z - avgCenter.z) > 10) {

                    center.set(avgCenter.x, avgCenter.y, avgCenter.z);
                }
            }
            
            return { center, size, boundingBox, elementCount };
        } else {


            
            // Analyse détaillée des objets de la scène
            let totalMeshes = 0;
            let visibleMeshes = 0;
            let constructionCandidates = 0;
            let assiseManagerElements = 0;
            
            sceneManager.scene.traverse((object) => {
                if (object.isMesh) {
                    totalMeshes++;
                    if (object.visible) visibleMeshes++;
                    
                    const userData = object.userData || {};
                    const hasAssiseData = userData.assiseId !== undefined || userData.courseIndex !== undefined;
                    const isPlaced = userData.placed === true;
                    const hasElement = userData.element && userData.element.constructor;
                    
                    if (hasAssiseData || isPlaced || hasElement) {
                        constructionCandidates++;

                    }
                }
            });
            
            // Vérifier les éléments dans l'AssiseManager
            if (window.AssiseManager && window.AssiseManager.assisesByType) {
                for (const [type, assisesForType] of window.AssiseManager.assisesByType.entries()) {
                    for (const [index, assiseData] of assisesForType.entries()) {
                        assiseManagerElements += assiseData.elements.size;
                    }
                }
            }
            





            
            // Suggérer des solutions selon le diagnostic
            if (totalMeshes === 0) {

            } else if (visibleMeshes === 0) {

            } else if (constructionCandidates === 0) {

            } else if (assiseManagerElements > 0) {

            }
            
            return {
                center: new window.THREE.Vector3(0, 50, 0),
                size: new window.THREE.Vector3(200, 100, 150),
                boundingBox: null,
                elementCount: 0
            };
        }
    }

    /**
     * Configure la position de la caméra orthographique selon la vue
     */
    setOrthographicCameraPosition(camera, viewType, sceneManager = null) {
        const distance = 300; // Distance augmentée pour éviter les problèmes de clipping
        
        // Calculer le centre du bâtiment automatiquement si possible
        let buildingCenter = { x: 0, y: 50, z: 0 }; // Valeur par défaut
        let buildingSize = { x: 200, y: 100, z: 150 }; // Valeurs par défaut
        
        if (sceneManager) {
            const analysis = this.calculateBuildingCenter(sceneManager);
            buildingCenter = {
                x: analysis.center.x,
                y: analysis.center.y,
                z: analysis.center.z
            };
            buildingSize = {
                x: analysis.size.x,
                y: analysis.size.y,
                z: analysis.size.z
            };
            
            // Log spécial pour les élévations latérales
            if (viewType === 'left' || viewType === 'right') {




                if (analysis.boundingBox) {


                }
            }
            
            // Log spécial pour la vue du dessus
            if (viewType === 'top') {




                if (analysis.boundingBox) {


                }
            }
        }
        
        // Augmenter la distance pour les élévations latérales pour un meilleur cadrage
        const lateralDistance = distance * 1.2; // 20% plus loin pour left/right
        
        switch(viewType) {
            case 'front':
                camera.position.set(buildingCenter.x, buildingCenter.y, buildingCenter.z + distance);
                camera.lookAt(buildingCenter.x, buildingCenter.y, buildingCenter.z);
                camera.up.set(0, 1, 0); // Assurer l'orientation correcte

                break;
                
            case 'back':
                // CORRECTION ÉLÉVATION ARRIÈRE: Position caméra pour voir la face arrière du bâtiment
                camera.position.set(buildingCenter.x, buildingCenter.y, buildingCenter.z - distance);
                camera.lookAt(buildingCenter.x, buildingCenter.y, buildingCenter.z);
                // CORRECTION: S'assurer que l'orientation est correcte pour l'élévation
                camera.up.set(0, 1, 0); // Y vers le haut pour vue d'élévation




                break;
                
            case 'left':
                // ÉLÉVATION GAUCHE CORRIGÉE : voir le côté gauche du bâtiment
                // Position la caméra à gauche du bâtiment, regardant vers la droite (vers le centre)
                camera.position.set(buildingCenter.x - lateralDistance, buildingCenter.y, buildingCenter.z);
                camera.lookAt(buildingCenter.x, buildingCenter.y, buildingCenter.z);
                // CORRECTION CRITIQUE: S'assurer que l'up vector est correct pour l'élévation
                camera.up.set(0, 1, 0); // Y vers le haut - orientation standard élévation
                // CORRECTION: Forcer la mise à jour de la matrice pour éviter les problèmes d'orientation
                camera.updateMatrixWorld(true);





                break;
                
            case 'right':
                // ÉLÉVATION DROITE CORRIGÉE : voir le côté droit du bâtiment
                // Position la caméra à droite du bâtiment, regardant vers la gauche (vers le centre)
                camera.position.set(buildingCenter.x + lateralDistance, buildingCenter.y, buildingCenter.z);
                camera.lookAt(buildingCenter.x, buildingCenter.y, buildingCenter.z);
                // CORRECTION CRITIQUE: S'assurer que l'up vector est correct pour l'élévation
                camera.up.set(0, 1, 0); // Y vers le haut - orientation standard élévation
                // CORRECTION: Forcer la mise à jour de la matrice pour éviter les problèmes d'orientation
                camera.updateMatrixWorld(true);





                break;
                
            case 'top':
                // CORRECTION DÉFINITIVE: Vue du dessus corrigée
                // Position spécialement optimisée pour la vue du dessus
                // Placer la caméra au-dessus du centre exact du bâtiment
                // Augmenter la distance pour être sûr de voir toutes les briques
                const topDistance = Math.max(distance, 500); // Minimum 5m au-dessus
                camera.position.set(buildingCenter.x, buildingCenter.y + topDistance, buildingCenter.z);
                camera.lookAt(buildingCenter.x, buildingCenter.y, buildingCenter.z);
                // CORRECTION: Orientation standard pour vue orthographique du dessus
                camera.up.set(0, 0, 1); // Z vers le haut - orientation standard
                





                break;
                
            default:
                camera.position.set(buildingCenter.x, buildingCenter.y, buildingCenter.z + distance);
                camera.lookAt(buildingCenter.x, buildingCenter.y, buildingCenter.z);
                camera.up.set(0, 1, 0);
        }
        
        // CORRECTION: Mise à jour de la matrice de projection et du monde dans le bon ordre
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld(true);

    }
    
    /**
     * Ajoute une ligne 3D horizontale au niveau 0.00 dans la scène Three.js
     */
    addGroundLevelLine3D(sceneManager, viewType = 'front') {
        if (!window.THREE || !sceneManager || !sceneManager.scene) {

            return null;
        }

        // Calculer l'étendue du bâtiment pour dimensionner la ligne
        const buildingAnalysis = this.calculateBuildingCenter(sceneManager);
        let lineLength = 500; // Longueur par défaut
        
        if (buildingAnalysis && buildingAnalysis.size) {
            // Faire une ligne qui dépasse un peu du bâtiment
            const maxDimension = Math.max(buildingAnalysis.size.x, buildingAnalysis.size.z);
            lineLength = maxDimension * 1.5; // 50% plus large que le bâtiment
        }

        // Forcer au minimum la largeur de la grille si disponible pour couvrir toute la grille
        if (sceneManager.grid && sceneManager.gridSize) {
            lineLength = Math.max(lineLength, sceneManager.gridSize);
        }

        // Créer la géométrie de ligne selon le type de vue
        const points = [];
        const halfLength = lineLength / 2;
        
        // Orienter la ligne selon la vue pour qu'elle soit toujours visible
        if (viewType === 'front' || viewType === 'back') {
            // Élévations principale et arrière : ligne selon l'axe X (gauche-droite)
            points.push(new window.THREE.Vector3(-halfLength, 0, 0));
            points.push(new window.THREE.Vector3(halfLength, 0, 0));

        } else if (viewType === 'left' || viewType === 'right') {
            // Élévations latérales : ligne selon l'axe Z (avant-arrière)
            points.push(new window.THREE.Vector3(0, 0, -halfLength));
            points.push(new window.THREE.Vector3(0, 0, halfLength));

        } else {
            // Vue du dessus ou autres : ligne selon l'axe X par défaut
            points.push(new window.THREE.Vector3(-halfLength, 0, 0));
            points.push(new window.THREE.Vector3(halfLength, 0, 0));

        }
        
        // Créer un groupe pour contenir la géométrie 3D épaisse
        const lineGroup = new window.THREE.Group();
        lineGroup.name = 'WallSim3D_GroundLevelLine';
        lineGroup.userData = {
            type: 'groundLevel',
            category: 'annotation',
            level: 0.00,
            isGroundLevelLine: true,
            description: 'Ligne de niveau 0.00',
            exportOnly: true // Pour indiquer que c'est seulement pour l'export
        };

        // Créer une géométrie 3D épaisse (boîte rectangulaire) au lieu de lignes
        let boxGeometry;
        const thickness = 1; // Épaisseur réduite à 1cm pour finesse appropriée
        const height = 1; // Hauteur réduite à 1cm
        
        if (viewType === 'front' || viewType === 'back') {
            // Élévations principale et arrière : boîte horizontale selon l'axe X
            boxGeometry = new window.THREE.BoxGeometry(lineLength, height, thickness);

        } else if (viewType === 'left' || viewType === 'right') {
            // Élévations latérales : boîte horizontale selon l'axe Z
            boxGeometry = new window.THREE.BoxGeometry(thickness, height, lineLength);

        } else {
            // Vue du dessus ou autres : boîte selon l'axe X par défaut
            boxGeometry = new window.THREE.BoxGeometry(lineLength, height, thickness);

        }
        
        // Matériau noir solide pour la géométrie 3D
        const solidMaterial = new window.THREE.MeshBasicMaterial({
            color: 0x000000, // Noir
            transparent: false,
            opacity: 1.0
        });

        // Créer le mesh 3D épais
        const solidLine = new window.THREE.Mesh(boxGeometry, solidMaterial);
        
        // Positionner la ligne plus près pour qu'elle soit toujours en avant-plan
        // Calculer la position selon la vue pour éviter que les éléments la masquent
        let linePosition = { x: 0, y: 0, z: 0 };
        
        if (viewType === 'front') {
            // Vue de face : positionner la ligne plus près vers l'avant (Z positif)
            linePosition.z = buildingAnalysis ? buildingAnalysis.size.z * 0.6 : 100;
        } else if (viewType === 'back') {
            // Vue arrière : positionner la ligne plus près vers l'arrière (Z négatif)
            linePosition.z = buildingAnalysis ? -buildingAnalysis.size.z * 0.6 : -100;
        } else if (viewType === 'left') {
            // Vue gauche : positionner la ligne plus près vers la gauche (X négatif)
            linePosition.x = buildingAnalysis ? -buildingAnalysis.size.x * 0.6 : -100;
        } else if (viewType === 'right') {
            // Vue droite : positionner la ligne plus près vers la droite (X positif)
            linePosition.x = buildingAnalysis ? buildingAnalysis.size.x * 0.6 : 100;
        }
        
        solidLine.position.set(linePosition.x, linePosition.y, linePosition.z);
        
        // Ajouter au groupe
        lineGroup.add(solidLine);

        // Ajouter le groupe à la scène
        sceneManager.scene.add(lineGroup);
        


        
        return lineGroup;
    }

    /**
     * Supprime la ligne 3D de niveau 0.00 de la scène
     */
    removeGroundLevelLine3D(sceneManager) {
        if (!sceneManager || !sceneManager.scene) return;

        // Chercher et supprimer le groupe de lignes existant
        const existingGroup = sceneManager.scene.getObjectByName('WallSim3D_GroundLevelLine');
        if (existingGroup) {
            sceneManager.scene.remove(existingGroup);
            
            // Nettoyer toutes les géométries et matériaux du groupe
            existingGroup.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            

            return true;
        }
        
        return false;
    }
    
    /**
     * Ajoute des annotations techniques sur l'élévation
     */
    addTechnicalAnnotations(ctx, width, height, viewType, scaleString = '1:50') {
        // Configuration du style technique
        ctx.strokeStyle = '#000000';
        ctx.fillStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.font = '12px Arial';
        
        // NOTE: La ligne de niveau 0.00 est maintenant ajoutée directement dans la scène 3D
        // via addGroundLevelLine3D() dans generateTechnicalElevation()
        // Plus besoin de dessiner sur le canvas 2D
        
        // SUPPRESSION de l'échelle graphique et du titre de la vue selon la demande utilisateur
        // L'échelle graphique et le titre de la vue ont été supprimés pour une vue plus épurée
        
        /* CODE SUPPRIMÉ - ÉCHELLE GRAPHIQUE ET TITRE
        // CORRECTION ÉCHELLE GRAPHIQUE - Calcul technique précis
        const scaleFactor = this.parseScale(scaleString);
        
        // Calculer la longueur correcte de l'échelle graphique basée sur l'échelle technique réelle
        // Objectif: avoir une échelle graphique de taille raisonnable (50-150px) pour une distance métrique ronde
        let targetRealDistance; // Distance réelle à représenter (en cm)
        
        // Choisir une distance métrique appropriée selon l'échelle
        if (scaleFactor <= 20) {
            targetRealDistance = 50;  // 50cm = 0.5m pour les grandes échelles
        } else if (scaleFactor <= 50) {
            targetRealDistance = 100; // 100cm = 1m
        } else if (scaleFactor <= 100) {
            targetRealDistance = 250; // 250cm = 2.5m
        } else if (scaleFactor <= 200) {
            targetRealDistance = 500; // 500cm = 5m
        } else {
            targetRealDistance = 1000; // 1000cm = 10m pour les petites échelles
        }
        
        // CALCUL TECHNIQUE UNIFIÉ: Cohérence avec calculateOptimalFrustumSize
        // Pour une échelle 1:scaleFactor, le facteur technique = scaleFactor / 10.0
        // Échelle 1:20 -> facteur 2.0, 1:50 -> facteur 5.0
        const technicalScale = scaleFactor / 10.0; // FACTEUR CORRECTIF RÉINITIALISÉ - COHÉRENT
        
        // Calcul de la correspondance pixels/cm basée sur le frustum
        const buildingAnalysis = this.calculateBuildingCenter(window.SceneManager);
        const frustumSize = this.calculateOptimalFrustumSize(scaleFactor, viewType, buildingAnalysis);
        
        // Le frustum en unités correspond aux dimensions du canvas
        // 1 unité frustum = (height / frustumSize) pixels
        
        // 🔧 FACTEUR CORRECTIF AJUSTÉ: Correction basée sur nouvelle observation
        // Observation 1: élément 120cm → 1.4cm au lieu de 6cm → facteur 4.286
        // Observation 2: élément 120cm → 5.2cm au lieu de 6cm → facteur 1.154
        // Nouveau facteur spécifié par l'utilisateur: 4.8
        const SCALE_CORRECTION_FACTOR = 4.8; // Facteur correctif fixé à 4.8
        
        const pixelsPerCm = (height / frustumSize) * SCALE_CORRECTION_FACTOR; // Pixels par cm dans le rendu avec correction
        





        
        // Longueur de l'échelle graphique en pixels - CALCUL RÉINITIALISÉ
        // Distance réelle (cm) * (1/scaleFactor) = distance papier (cm)
        // Distance papier (cm) * pixelsPerCm = distance pixels
        const realToPaperFactor = 1.0 / scaleFactor; // cm papier par cm réel
        const scaleLength = Math.round(targetRealDistance * realToPaperFactor * pixelsPerCm);
        
        // Limiter pour éviter des échelles trop grandes ou trop petites
        const finalScaleLength = Math.max(40, Math.min(200, scaleLength));
        
        // Formater la distance réelle pour l'affichage
        const scaleRealLength = targetRealDistance >= 100 ? 
            `${(targetRealDistance / 100).toFixed(targetRealDistance % 100 === 0 ? 0 : 1)}m` : 
            `${targetRealDistance}cm`;
        











        
        const scaleX = 20;
        const scaleY = height - 30;
        
        // Ligne d'échelle principale
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(scaleX, scaleY);
        ctx.lineTo(scaleX + finalScaleLength, scaleY);
        ctx.stroke();
        
        // Marques d'échelle aux extrémités
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(scaleX, scaleY - 6);
        ctx.lineTo(scaleX, scaleY + 6);
        ctx.moveTo(scaleX + finalScaleLength, scaleY - 6);
        ctx.lineTo(scaleX + finalScaleLength, scaleY + 6);
        ctx.stroke();
        
        // Ajouter des marques intermédiaires pour les longues échelles
        if (finalScaleLength > 80) {
            const quarterLength = finalScaleLength / 4;
            const halfLength = finalScaleLength / 2;
            const threeQuarterLength = 3 * finalScaleLength / 4;
            
            ctx.beginPath();
            // Marque au quart
            ctx.moveTo(scaleX + quarterLength, scaleY - 3);
            ctx.lineTo(scaleX + quarterLength, scaleY + 3);
            // Marque au milieu (plus haute)
            ctx.moveTo(scaleX + halfLength, scaleY - 5);
            ctx.lineTo(scaleX + halfLength, scaleY + 5);
            // Marque aux trois quarts
            ctx.moveTo(scaleX + threeQuarterLength, scaleY - 3);
            ctx.lineTo(scaleX + threeQuarterLength, scaleY + 3);
            ctx.stroke();
        }
        
        // Texte d'échelle centré sous la ligne
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 11px Arial';
        const textWidth = ctx.measureText(scaleRealLength).width;
        ctx.fillText(scaleRealLength, scaleX + (finalScaleLength - textWidth) / 2, scaleY + 18);
        
        // Indication de la vue et de l'échelle
        ctx.font = '10px Arial';
        ctx.fillStyle = '#666666';
        const viewName = this.getViewDisplayName(viewType);
        const scaleInfo = `${viewName} - Échelle ${scaleString}`;
        ctx.fillText(scaleInfo, width - 200, 20);
        */
    }
    
    /**
     * Ajoute une ligne horizontale épaisse pour marquer le niveau 0.00 sur les élévations
     */
    addGroundLevelLine(ctx, width, height, viewType) {
        // Calculer la position Y du niveau 0 en fonction de l'échelle et de la géométrie réelle
        // Position plus précise basée sur l'analyse du bâtiment
        let groundY;
        
        // Tenter de calculer la position précise du niveau 0 basée sur la géométrie
        if (window.SceneManager) {
            const buildingAnalysis = this.calculateBuildingCenter(window.SceneManager);
            if (buildingAnalysis && buildingAnalysis.boundingBox) {
                // CORRECTION: Calcul précis pour que Y=0 de la scène corresponde au niveau 0.00
                const minY = buildingAnalysis.boundingBox.min.y;
                const maxY = buildingAnalysis.boundingBox.max.y;
                const totalHeight = maxY - minY;
                
                // CORRECTION DÉFINITIVE: Le niveau 0.00 doit correspondre exactement à Y=0 dans la scène
                // Peu importe où sont positionnés les éléments, Y=0 reste Y=0
                const groundLevel = 0; // Y=0 absolu de la scène
                
                // CORRECTION SPÉCIALE: Si AssiseManager est disponible, utiliser la logique des assises
                // pour déterminer où devrait être le niveau 0.00 par rapport aux éléments de l'assise 0
                if (window.AssiseManager) {
                    // Chercher s'il y a des éléments dans l'assise 0
                    let assise0MinY = null;
                    for (const [type, assises] of window.AssiseManager.assisesByType.entries()) {
                        const assise0 = assises.get(0);
                        if (assise0 && assise0.elements && assise0.elements.size > 0) {
                            // Trouver la position Y la plus basse des éléments de l'assise 0
                            for (const elementId of assise0.elements) {
                                const element = window.SceneManager.elements.get(elementId);
                                if (element && element.mesh) {
                                    const elementBottomY = element.mesh.position.y - element.dimensions.height / 2;
                                    if (assise0MinY === null || elementBottomY < assise0MinY) {
                                        assise0MinY = elementBottomY;
                                    }
                                }
                            }
                        }
                    }
                    
                    // Si on a trouvé des éléments dans l'assise 0, utiliser leur position de base
                    if (assise0MinY !== null) {

                        // CORRECTION: Le niveau 0.00 doit être à Y=0, PAS à la base des éléments
                        // La ligne doit indiquer où est Y=0 par rapport aux éléments visibles
                        
                        // Calcul correct: Y=0 par rapport à la bounding box des éléments
                        let relativeGroundPosition;
                        
                        // CORRECTION SPÉCIALE: Si minY est très proche de 0, alors Y=0 est à la base des éléments
                        if (Math.abs(minY) < 0.1) {
                            // Les éléments commencent pratiquement à Y=0
                            // Y=0 doit être à la base visible = sous les joints mais pas trop bas
                            relativeGroundPosition = 0.5; // 50% vers le bas - position finale optimisée

                        } else if (minY > 0) {
                            // Tous les éléments sont au-dessus de Y=0
                            // Y=0 est sous le bâtiment = bas de l'image
                            relativeGroundPosition = 1.0;

                        } else if (maxY <= 0) {
                            // Tous les éléments sont sous Y=0  
                            // Y=0 est au-dessus du bâtiment = haut de l'image
                            relativeGroundPosition = 0.0;

                        } else {
                            // Y=0 traverse le bâtiment
                            // Position proportionnelle dans la bounding box
                            relativeGroundPosition = (maxY - 0) / totalHeight;

                        }
                        
                        // Appliquer les marges (10% en haut et bas)
                        groundY = height * (0.1 + relativeGroundPosition * 0.8);

                    } else {
                        // Pas d'éléments dans l'assise 0, utiliser Y=0 directement
                        let relativeGroundPosition;
                        
                        // CORRECTION SPÉCIALE: Si minY est très proche de 0, alors Y=0 est à la base des éléments
                        if (Math.abs(minY) < 0.1) {
                            // Les éléments commencent pratiquement à Y=0
                            relativeGroundPosition = 0.5; // 50% vers le bas - position finale optimisée

                        } else if (minY > 0) {
                            relativeGroundPosition = 1.0; // Y=0 sous le bâtiment

                        } else if (maxY <= 0) {
                            relativeGroundPosition = 0.0; // Y=0 au-dessus du bâtiment

                        } else {
                            relativeGroundPosition = (maxY - 0) / totalHeight;

                        }
                        groundY = height * (0.1 + relativeGroundPosition * 0.8);

                    }
                } else {
                    // CORRECTION: Calcul direct de la position de Y=0 dans l'image
                    let relativeGroundPosition;
                    
                    // CORRECTION SPÉCIALE: Si minY est très proche de 0, alors Y=0 est à la base des éléments
                    if (Math.abs(minY) < 0.1) {
                        // Les éléments commencent pratiquement à Y=0
                        // Y=0 doit être à la base visible = sous les joints mais pas trop bas
                        relativeGroundPosition = 0.5; // 50% vers le bas - position finale optimisée

                    } else if (minY > 0) {
                        // Cas normal: tous les éléments sont au-dessus de Y=0
                        // Y=0 doit être affiché en bas de l'image (sous les éléments)
                        relativeGroundPosition = 1.0; // 100% = tout en bas

                    } else if (maxY <= 0) {
                        // Cas rare: tous les éléments sont en dessous de Y=0
                        // Y=0 doit être affiché en haut de l'image (au-dessus des éléments)
                        relativeGroundPosition = 0.0; // 0% = tout en haut

                    } else {
                        // Cas mixte: Y=0 traverse le bâtiment
                        // Calculer la position relative de Y=0 dans la bounding box
                        relativeGroundPosition = (maxY - 0) / totalHeight;

                    }
                    
                    // Appliquer des marges de 10% en haut et bas
                    groundY = height * (0.1 + relativeGroundPosition * 0.8);
                    

                }
            } else {
                // Fallback si pas de géométrie détectée
                groundY = height * 0.65; // Position approximative (65% de la hauteur depuis le haut)

            }
        } else {
            // Fallback si pas de SceneManager
            groundY = height * 0.65;

        }
        
        // Sauvegarder le style actuel
        const originalStrokeStyle = ctx.strokeStyle;
        const originalLineWidth = ctx.lineWidth;
        const originalFillStyle = ctx.fillStyle;
        const originalFont = ctx.font;
        
        // Style pour la ligne de niveau 0
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3; // Ligne épaisse
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px Arial';
        
        // Dessiner la ligne horizontale complète
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(width, groundY);
        ctx.stroke();
        
        // Ajouter le marquage "0.00" à gauche
        const textMargin = 5;
        const textY = groundY - 5; // Légèrement au-dessus de la ligne
        
        // Fond blanc pour le texte pour améliorer la lisibilité
        const textWidth = ctx.measureText('0.00').width;
        const textHeight = 12;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(textMargin - 2, textY - textHeight + 2, textWidth + 4, textHeight);
        
        // Texte "0.00"
        ctx.fillStyle = '#000000';
        ctx.fillText('0.00', textMargin, textY);
        
        // Ajouter également le marquage à droite pour plus de visibilité
        const rightTextX = width - textWidth - textMargin;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(rightTextX - 2, textY - textHeight + 2, textWidth + 4, textHeight);
        ctx.fillStyle = '#000000';
        ctx.fillText('0.00', rightTextX, textY);
        
        // Restaurer le style original
        ctx.strokeStyle = originalStrokeStyle;
        ctx.lineWidth = originalLineWidth;
        ctx.fillStyle = originalFillStyle;
        ctx.font = originalFont;
        

    }

    /**
     * Retourne le nom d'affichage de la vue
     */
    getViewDisplayName(viewType) {
        const names = {
            'front': 'Élévation principale',
            'back': 'Élévation arrière', 
            'left': 'Élévation gauche',
            'right': 'Élévation droite',
            'top': 'Vue de dessus'
        };
        return names[viewType] || viewType;
    }

    /**
     * Change temporairement les matériaux des briques et joints en blanc avec contours noirs pour l'export technique
     */
    setTechnicalMaterials(originalMaterialsArray, sceneManager) {
        if (!window.THREE || !sceneManager) return;
        

        
        // Créer le matériau blanc technique
        const whiteMaterial = new window.THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: false,
            opacity: 1.0
        });
        
        // Parcourir tous les objets de la scène pour trouver les briques et blocs
        sceneManager.scene.traverse((object) => {
            if (object.isMesh && object.material) {
                // Debug : afficher les informations de l'objet

                
                // Détection élargie des briques/blocs
                const userData = object.userData;
                const objectName = object.name || '';
                
                // Méthodes de détection multiples AVEC VÉRIFICATIONS STRICTES
                const isBrickByUserData = userData && (
                    userData.type === 'brick' || userData.elementType === 'brick' || 
                    userData.type === 'block' || userData.elementType === 'block' ||
                    userData.category === 'brick' || userData.category === 'block'
                ) && (
                    // VÉRIFICATIONS STRICTES - L'élément doit être vraiment intégré
                    !userData.isTemporary && 
                    !userData.isGhost && 
                    !userData.phantom && 
                    !userData.preview && 
                    !userData.suggestion &&
                    object.visible &&
                    object.scale.x > 0 && object.scale.y > 0 && object.scale.z > 0
                ) || (
                    // WallElement qui n'est pas un joint - AVEC VÉRIFICATIONS STRICTES
                    userData.element && userData.element.constructor && userData.element.constructor.name === 'WallElement' && !userData.isJoint &&
                    !userData.isTemporary && 
                    !userData.isGhost && 
                    !userData.phantom && 
                    !userData.preview && 
                    !userData.suggestion &&
                    (userData.assiseId !== undefined || userData.courseIndex !== undefined || userData.placed === true) &&
                    object.visible &&
                    object.scale.x > 0 && object.scale.y > 0 && object.scale.z > 0
                );
                
                const isBrickByName = objectName.includes('brick') || objectName.includes('block') || 
                                     objectName.includes('brique') || objectName.includes('bloc') ||
                                     objectName.includes('element_'); // Pattern des IDs d'éléments
                
                // Détection par matériau (si le matériau contient 'brique' dans son nom)
                const isBrickByMaterial = object.material.name && (
                    object.material.name.includes('brique') || 
                    object.material.name.includes('brick') ||
                    object.material.name.includes('rouge') // pour 'brique-rouge-classique'
                );
                
                // Détection des joints AVEC VÉRIFICATIONS STRICTES
                const isJointByUserData = userData && (
                    userData.type === 'joint' || userData.isJoint === true || userData.elementType === 'joint'
                ) && (
                    // VÉRIFICATIONS STRICTES pour les joints
                    !userData.isTemporary && 
                    !userData.isGhost && 
                    !userData.phantom && 
                    !userData.preview && 
                    !userData.suggestion &&
                    object.visible &&
                    object.scale.x > 0 && object.scale.y > 0 && object.scale.z > 0
                ) || (
                    // WallElement qui EST un joint - AVEC VÉRIFICATIONS STRICTES
                    userData.element && userData.element.constructor && userData.element.constructor.name === 'WallElement' && userData.isJoint &&
                    !userData.isTemporary && 
                    !userData.isGhost && 
                    !userData.phantom && 
                    !userData.preview && 
                    !userData.suggestion &&
                    (userData.assiseId !== undefined || userData.courseIndex !== undefined || userData.placed === true) &&
                    object.visible &&
                    object.scale.x > 0 && object.scale.y > 0 && object.scale.z > 0
                );
                
                const isJointByName = objectName.includes('joint') || objectName.includes('mortier') ||
                                     objectName.includes('Joint') || objectName.includes('Mortier');
                
                const isJointByMaterial = object.material.name && (
                    object.material.name.includes('joint') || 
                    object.material.name.includes('mortier') ||
                    object.material.name.includes('Joint') ||
                    object.material.name.includes('Mortier')
                );
                
                // Exclure seulement les éléments techniques (grilles, axes, etc.)
                const isGridOrAxes = objectName.includes('grid') || objectName.includes('axes') || 
                               objectName.includes('helper') || objectName.includes('wireframe');
                
                // Inclure à la fois les briques ET les joints
                const shouldTransform = (isBrickByUserData || isBrickByName || isBrickByMaterial ||
                                       isJointByUserData || isJointByName || isJointByMaterial) && 
                                       !isGridOrAxes;
                
                if (shouldTransform) {
                    const elementType = (isJointByUserData || isJointByName || isJointByMaterial) ? 'Joint' : 'Brique';

                    
                    // Sauvegarder le matériau original
                    originalMaterialsArray.push({
                        object: object,
                        originalMaterial: object.material,
                        originalCastShadow: object.castShadow,
                        originalReceiveShadow: object.receiveShadow
                    });
                    
                    // Appliquer le nouveau matériau blanc
                    object.material = whiteMaterial.clone();
                    object.castShadow = false;
                    object.receiveShadow = false;
                    
                    // Ajouter un wireframe noir pour les contours
                    if (!object.wireframe && object.geometry) {
                        try {
                            const wireframeMaterial = new window.THREE.LineBasicMaterial({
                                color: 0x000000,    // Noir
                                linewidth: 1
                            });
                            
                            // Utiliser EdgesGeometry au lieu de WireframeGeometry pour éviter les diagonales
                            const edges = new window.THREE.EdgesGeometry(object.geometry);
                            const wireframeMesh = new window.THREE.LineSegments(edges, wireframeMaterial);
                            
                            // Positionner le wireframe exactement sur l'objet
                            wireframeMesh.position.copy(object.position);
                            wireframeMesh.rotation.copy(object.rotation);
                            wireframeMesh.scale.copy(object.scale);
                            wireframeMesh.userData.isTechnicalWireframe = true;
                            wireframeMesh.userData.parentObject = object;
                            
                            // Ajouter le wireframe au parent de l'objet
                            if (object.parent) {
                                object.parent.add(wireframeMesh);
                                object.wireframe = wireframeMesh;

                            }
                        } catch (wireframeError) {

                        }
                    }
                } else {
                    // DIAGNOSTIC DÉTAILLÉ pour comprendre pourquoi l'objet est rejeté
                    if (userData && userData.element && userData.element.constructor && userData.element.constructor.name === 'WallElement') {
                        const rejectionReasons = [];
                        if (userData.isTemporary) rejectionReasons.push('isTemporary');
                        if (userData.isGhost) rejectionReasons.push('isGhost');
                        if (userData.phantom) rejectionReasons.push('phantom');
                        if (userData.preview) rejectionReasons.push('preview');
                        if (userData.suggestion) rejectionReasons.push('suggestion');
                        if (!object.visible) rejectionReasons.push('not visible');
                        if (object.scale.x <= 0 || object.scale.y <= 0 || object.scale.z <= 0) rejectionReasons.push('invalid scale');
                        if (!userData.isJoint && userData.assiseId === undefined && userData.courseIndex === undefined && userData.placed !== true) {
                            rejectionReasons.push('not integrated in assise');
                        }
                        

                    } else {
                        // Log des objets non transformés pour debug
                        if (!isGridOrAxes) {

                        }
                    }
                }
            }
        });
        

    }

    /**
     * Restaure les matériaux originaux des briques et joints
     */
    restoreOriginalMaterials(originalMaterialsArray, sceneManager) {

        
        // Restaurer les matériaux originaux
        originalMaterialsArray.forEach(({ object, originalMaterial, originalCastShadow, originalReceiveShadow }) => {
            if (object && originalMaterial) {
                object.material = originalMaterial;
                
                // Restaurer les propriétés d'ombres
                if (originalCastShadow !== undefined) object.castShadow = originalCastShadow;
                if (originalReceiveShadow !== undefined) object.receiveShadow = originalReceiveShadow;
                
                // Supprimer le wireframe technique s'il existe
                if (object.wireframe) {
                    if (object.wireframe.parent) {
                        object.wireframe.parent.remove(object.wireframe);
                    }
                    object.wireframe = null;
                }
            }
        });
        
        // Supprimer tous les wireframes techniques restants
        if (sceneManager && sceneManager.scene) {
            const wireframesToRemove = [];
            sceneManager.scene.traverse((object) => {
                if (object.userData && object.userData.isTechnicalWireframe) {
                    wireframesToRemove.push(object);
                }
            });
            
            wireframesToRemove.forEach(wireframe => {
                if (wireframe.parent) {
                    wireframe.parent.remove(wireframe);
                }
            });
            

        }
        
        // Vider le tableau
        originalMaterialsArray.length = 0;
    }

    async adjustViewForSpecialAngles(viewType) {
        // Cette méthode peut être étendue pour ajuster la caméra
        // en fonction des besoins spécifiques de chaque vue
        // Pour l'instant, on ajoute juste un délai pour stabiliser

        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Ici, on pourrait ajouter des ajustements de caméra spécifiques
        // par exemple, rotation de la caméra ou de la scène
        if (window.SceneManager && window.SceneManager.camera) {
            try {
                const camera = window.SceneManager.camera;
                // Exemple d'ajustements selon la vue
                switch(viewType) {
                    case 'left':

                        // Ici on pourrait ajuster l'angle de vue
                        break;
                    case 'right':

                        // Rotation pour vue droite
                        break;
                    case 'back':

                        // Rotation pour vue arrière
                        break;
                }
            } catch(e) {

            }
        }
    }

    showProgress(message, percentage) {
        const progressDiv = document.getElementById('exportProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const generateBtn = document.getElementById('generatePdfBtn');

        if (progressDiv) progressDiv.style.display = 'block';
        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (progressText) progressText.textContent = message;
        if (generateBtn) generateBtn.disabled = true;
    }

    hideProgress() {
        const progressDiv = document.getElementById('exportProgress');
        const generateBtn = document.getElementById('generatePdfBtn');

        if (progressDiv) progressDiv.style.display = 'none';
        if (generateBtn) generateBtn.disabled = false;
    }

    /**
     * Sauvegarde l'état initial de la scène avant l'export PDF
     */
    saveInitialSceneState() {
        // Utiliser SceneManager plutôt que les variables globales directes
        const camera = window.camera || (window.SceneManager && window.SceneManager.camera);
        const scene = window.scene || (window.SceneManager && window.SceneManager.scene);
        const renderer = window.renderer || (window.SceneManager && window.SceneManager.renderer);
        const sceneManager = window.SceneManager;
        
        // Vérifier que les objets essentiels existent
        if (!camera || !scene || !renderer) {
            
            return null;
        }
        
        const initialState = {
            camera: {
                position: camera.position.clone(),
                rotation: camera.rotation.clone(),
                quaternion: camera.quaternion.clone(),
                scale: camera.scale.clone(),
                up: camera.up.clone(),
                type: camera.type, // PerspectiveCamera ou OrthographicCamera
                isPerspectiveCamera: camera.isPerspectiveCamera,
                isOrthographicCamera: camera.isOrthographicCamera,
                // Propriétés spécifiques à la caméra perspective
                fov: camera.fov, // Field of view
                aspect: camera.aspect, // Ratio d'aspect
                near: camera.near, // Plan de clipping proche
                far: camera.far, // Plan de clipping lointain
                zoom: camera.zoom // Niveau de zoom
            },
            scene: {
                position: scene.position.clone(),
                rotation: scene.rotation.clone(),
                quaternion: scene.quaternion.clone(),
                scale: scene.scale.clone()
            },
            controls: null,
            materials: [], // Pour sauvegarder les matériaux originaux
            environment: { // NOUVEAU: Sauvegarde de l'environnement
                background: scene.background, // Sauvegarde du background (ciel)
                environment: scene.environment, // Environnement lighting
                skyDome: sceneManager && sceneManager.skyDome ? {
                    visible: sceneManager.skyDome.visible,
                    object: sceneManager.skyDome
                } : null,
                fog: scene.fog ? {
                    type: scene.fog.constructor.name,
                    color: scene.fog.color ? scene.fog.color.clone() : null,
                    near: scene.fog.near,
                    far: scene.fog.far,
                    density: scene.fog.density
                } : null
            },
            sceneElements: { // NOUVEAU: Sauvegarde d'éléments spéciaux de scène
                grid: sceneManager && sceneManager.grid ? {
                    visible: sceneManager.grid.visible
                } : null,
                axesHelper: sceneManager && sceneManager.axesHelper ? {
                    visible: sceneManager.axesHelper.visible
                } : null,
                northArrowGroup: sceneManager && sceneManager.northArrowGroup ? {
                    visible: sceneManager.northArrowGroup.visible
                } : null,
                assiseGrids: window.AssiseManager && window.AssiseManager.showAssiseGrids !== undefined ? {
                    visible: window.AssiseManager.showAssiseGrids
                } : null
            },
            // NOUVEAU: Sauvegarde des aides visuelles d'AssiseManager
            visualAids: {
                showAttachmentMarkers: window.AssiseManager && window.AssiseManager.showAttachmentMarkers !== undefined ? 
                    window.AssiseManager.showAttachmentMarkers : null,
                showSnapPoint: window.AssiseManager && window.AssiseManager.showSnapPoint !== undefined ?
                    window.AssiseManager.showSnapPoint : null,
                showAssiseGrids: window.AssiseManager && window.AssiseManager.showAssiseGrids !== undefined ?
                    window.AssiseManager.showAssiseGrids : null
            },
            viewMode: 'perspective' // Mode de vue par défaut
        };

        // Sauvegarder les contrôles s'ils existent (avec plus de détails)
        const controls = window.controls || (window.SceneManager && window.SceneManager.controls);
        if (controls) {
            initialState.controls = {
                target: controls.target.clone(),
                enableZoom: controls.enableZoom,
                enableRotate: controls.enableRotate,
                enablePan: controls.enablePan,
                enabled: controls.enabled,
                // Sauvegarder des propriétés supplémentaires si disponibles
                minDistance: controls.minDistance,
                maxDistance: controls.maxDistance,
                minPolarAngle: controls.minPolarAngle,
                maxPolarAngle: controls.maxPolarAngle,
                minAzimuthAngle: controls.minAzimuthAngle,
                maxAzimuthAngle: controls.maxAzimuthAngle,
                enableDamping: controls.enableDamping,
                dampingFactor: controls.dampingFactor,
                autoRotate: controls.autoRotate,
                autoRotateSpeed: controls.autoRotateSpeed
            };
            
        }

        // Sauvegarder les matériaux originaux et propriétés d'ombrage de tous les objets
        if (scene) {
            scene.traverse((object) => {
                if (object.isMesh && object.material) {
                    // Sauvegarder le matériau original
                    let materialData = {
                        uuid: object.uuid,
                        name: object.name,
                        materialType: object.material.constructor.name,
                        // NOUVEAU: Sauvegarder les propriétés d'ombrage
                        castShadow: object.castShadow,
                        receiveShadow: object.receiveShadow,
                        visible: object.visible
                    };

                    // Cloner ou référencer le matériau selon le type
                    if (object.material.clone && typeof object.material.clone === 'function') {
                        materialData.material = object.material.clone();
                    } else if (Array.isArray(object.material)) {
                        // Gérer les matériaux multiples
                        materialData.material = object.material.map(mat => 
                            mat.clone && typeof mat.clone === 'function' ? mat.clone() : mat
                        );
                        materialData.isArray = true;
                    } else {
                        // Matériau simple sans clone
                        materialData.material = object.material;
                    }

                    initialState.materials.push(materialData);
                }
            });
        }

        // NOUVEAU: Sauvegarder l'état complet du renderer pour restaurer les couleurs et ombres
        if (sceneManager && sceneManager.renderer) {
            initialState.renderer = {
                shadowMapEnabled: sceneManager.renderer.shadowMap.enabled,
                shadowMapType: sceneManager.renderer.shadowMap.type,
                shadowMapAutoUpdate: sceneManager.renderer.shadowMap.autoUpdate,
                outputColorSpace: sceneManager.renderer.outputColorSpace,
                toneMapping: sceneManager.renderer.toneMapping,
                toneMappingExposure: sceneManager.renderer.toneMappingExposure,
                clearColor: sceneManager.renderer.getClearColor(new window.THREE.Color()),
                clearAlpha: sceneManager.renderer.getClearAlpha(),
                antialias: sceneManager.renderer.antialias,
                physicallyCorrectLights: sceneManager.renderer.physicallyCorrectLights
            };

        }

        // NOUVEAU: Sauvegarder l'état des lumières pour les ombres
        initialState.lights = [];
        if (sceneManager && sceneManager.scene) {
            sceneManager.scene.traverse((object) => {
                if (object.isLight) {
                    const lightData = {
                        uuid: object.uuid,
                        type: object.type,
                        castShadow: object.castShadow,
                        intensity: object.intensity,
                        color: object.color ? object.color.clone() : null,
                        position: object.position.clone(),
                        visible: object.visible
                    };

                    // Paramètres spécifiques aux lumières directionnelles
                    if (object.isDirectionalLight && object.shadow) {
                        lightData.shadow = {
                            mapSize: {
                                width: object.shadow.mapSize.width,
                                height: object.shadow.mapSize.height
                            },
                            camera: {
                                near: object.shadow.camera.near,
                                far: object.shadow.camera.far,
                                left: object.shadow.camera.left,
                                right: object.shadow.camera.right,
                                top: object.shadow.camera.top,
                                bottom: object.shadow.camera.bottom
                            },
                            bias: object.shadow.bias,
                            normalBias: object.shadow.normalBias
                        };
                    }

                    initialState.lights.push(lightData);
                }
            });

        }

        return initialState;
    }

    /**
     * Sauvegarde l'état actuel de la caméra (position, rotation, etc.)
     */
    saveCameraState() {
        const camera = window.camera || (window.SceneManager && window.SceneManager.camera);
        const controls = window.controls || (window.SceneManager && window.SceneManager.controls);
        
        if (!camera) {

            return null;
        }

        return {
            position: camera.position.clone(),    
            rotation: camera.rotation.clone(),
            quaternion: camera.quaternion.clone(),
            type: camera.type,
            zoom: camera.zoom,
            near: camera.near,
            far: camera.far,
            fov: camera.fov,
            left: camera.left,
            right: camera.right,
            top: camera.top,
            bottom: camera.bottom,
            controls: controls ? {
                target: controls.target.clone(),
                enabled: controls.enabled,
                enableRotate: controls.enableRotate,
                enableZoom: controls.enableZoom,
                enablePan: controls.enablePan
            } : null
        };
    }

    /**
     * Restaure l'état de la caméra
     */
    restoreCameraState(cameraState) {
        if (!cameraState) {

            return;
        }

        const camera = window.camera || (window.SceneManager && window.SceneManager.camera);
        const controls = window.controls || (window.SceneManager && window.SceneManager.controls);
        
        if (!camera) {

            return;
        }

        try {
            // Restaurer position et rotation
            camera.position.copy(cameraState.position);
            camera.rotation.copy(cameraState.rotation);
            camera.quaternion.copy(cameraState.quaternion);
            
            // Restaurer les propriétés spécifiques au type de caméra
            if (cameraState.zoom !== undefined) camera.zoom = cameraState.zoom;
            if (cameraState.fov !== undefined) camera.fov = cameraState.fov;
            if (cameraState.near !== undefined) camera.near = cameraState.near;
            if (cameraState.far !== undefined) camera.far = cameraState.far;
            
            // Pour les caméras orthographiques
            if (cameraState.left !== undefined) camera.left = cameraState.left;
            if (cameraState.right !== undefined) camera.right = cameraState.right;
            if (cameraState.top !== undefined) camera.top = cameraState.top;
            if (cameraState.bottom !== undefined) camera.bottom = cameraState.bottom;

            // Mettre à jour la matrice de projection
            camera.updateProjectionMatrix();

            // Restaurer les contrôles
            if (controls && cameraState.controls) {
                controls.target.copy(cameraState.controls.target);
                controls.enabled = cameraState.controls.enabled;
                controls.enableRotate = cameraState.controls.enableRotate;
                controls.enableZoom = cameraState.controls.enableZoom;
                controls.enablePan = cameraState.controls.enablePan;
                controls.update();
            }


        } catch (error) {

        }
    }

    /**
     * Restaure l'état initial de la scène après l'export PDF - VERSION SIMPLIFIÉE
     */
    restoreInitialSceneState(initialState) {
        if (!initialState) {

            return;
        }


        try {
            // === ÉTAPE 1: FORÇAGE IMMÉDIAT DE LA CAMÉRA PERSPECTIVE ===

            
            // Accéder au SceneManager
            const sceneManager = window.SceneManager;
            if (!sceneManager) {

                return;
            }

            // Si la caméra actuelle n'est pas une PerspectiveCamera, en créer une nouvelle
            let camera = sceneManager.camera;
            if (!camera || !camera.isPerspectiveCamera) {

                
                // Créer une nouvelle caméra perspective avec les paramètres sauvegardés
                const canvas = sceneManager.renderer.domElement;
                const aspect = canvas.clientWidth / canvas.clientHeight;
                
                camera = new window.THREE.PerspectiveCamera(
                    initialState.camera.fov || 75,
                    aspect,
                    initialState.camera.near || 0.1,
                    initialState.camera.far || 1000
                );
                
                // Assigner la nouvelle caméra
                sceneManager.camera = camera;
                window.camera = camera; // Référence globale si elle existe
                

            }

            // === ÉTAPE 2: RESTAURATION COMPLÈTE DE LA CAMÉRA PERSPECTIVE ===

            if (camera && initialState.camera) {
                // Restauration de toutes les propriétés
                camera.position.copy(initialState.camera.position);
                camera.rotation.copy(initialState.camera.rotation);
                camera.quaternion.copy(initialState.camera.quaternion);
                camera.scale.copy(initialState.camera.scale);
                camera.up.copy(initialState.camera.up);
                
                // Propriétés spécifiques à la perspective
                if (initialState.camera.fov) camera.fov = initialState.camera.fov;
                if (initialState.camera.aspect) camera.aspect = initialState.camera.aspect;
                if (initialState.camera.near) camera.near = initialState.camera.near;
                if (initialState.camera.far) camera.far = initialState.camera.far;
                if (initialState.camera.zoom) camera.zoom = initialState.camera.zoom;
                
                // Mise à jour complète
                camera.updateMatrixWorld(true);
                camera.updateProjectionMatrix();
                
            }

            // === ÉTAPE 3: RESTAURATION ET RECONFIGURATION DES CONTRÔLES ===

            let controls = sceneManager.controls;
            
            // Si les contrôles existent, les reconfigurer avec la nouvelle caméra
            if (controls) {
                // Si la caméra a changé, recréer les contrôles
                if (controls.object !== camera) {

                    
                    // Détruire les anciens contrôles
                    if (controls.dispose) controls.dispose();
                    
                    // Accès sécurisé aux OrbitControls
                    let OrbitControlsClass = null;
                    if (window.THREE && window.THREE.OrbitControls) {
                        OrbitControlsClass = window.THREE.OrbitControls;
                    } else if (window.OrbitControls) {
                        OrbitControlsClass = window.OrbitControls;
                    } else if (sceneManager.controls && sceneManager.controls.constructor) {
                        OrbitControlsClass = sceneManager.controls.constructor;
                    }
                    
                    if (OrbitControlsClass) {
                        // Créer de nouveaux contrôles avec la nouvelle caméra
                        controls = new OrbitControlsClass(camera, sceneManager.renderer.domElement);
                        sceneManager.controls = controls;
                        window.controls = controls; // Référence globale si elle existe

                    } else {

                        // Assigner directement la nouvelle caméra aux contrôles existants
                        controls.object = camera;
                    }
                }
                
                // Restaurer les propriétés des contrôles
                if (initialState.controls) {
                    controls.target.copy(initialState.controls.target);
                    controls.enableZoom = initialState.controls.enableZoom;
                    controls.enableRotate = initialState.controls.enableRotate;
                    controls.enablePan = initialState.controls.enablePan;
                    controls.enabled = initialState.controls.enabled;
                    
                    // Propriétés étendues
                    if (initialState.controls.minDistance !== undefined) controls.minDistance = initialState.controls.minDistance;
                    if (initialState.controls.maxDistance !== undefined) controls.maxDistance = initialState.controls.maxDistance;
                    if (initialState.controls.enableDamping !== undefined) controls.enableDamping = initialState.controls.enableDamping;
                    if (initialState.controls.dampingFactor !== undefined) controls.dampingFactor = initialState.controls.dampingFactor;
                    if (initialState.controls.autoRotate !== undefined) controls.autoRotate = initialState.controls.autoRotate;
                    
                    // Mise à jour des contrôles
                    controls.update();
                }
                
            }

            // === ÉTAPE 4: RESTAURATION DE LA SCÈNE ===

            const scene = sceneManager.scene;
            if (scene && initialState.scene) {
                scene.position.copy(initialState.scene.position);
                scene.rotation.copy(initialState.scene.rotation);
                scene.quaternion.copy(initialState.scene.quaternion);
                scene.scale.copy(initialState.scene.scale);
                scene.updateMatrixWorld(true);

            }

            // === ÉTAPE 5: RESTAURATION COMPLÈTE DES MATÉRIAUX ===

            if (initialState.materials && initialState.materials.length > 0 && scene) {
                let materialsRestored = 0;
                scene.traverse((object) => {
                    if (object.isMesh && object.material) {
                        const savedMaterial = initialState.materials.find(m => m.uuid === object.uuid);
                        if (savedMaterial) {
                            if (savedMaterial.isArray && Array.isArray(savedMaterial.material)) {
                                // Restaurer les matériaux multiples
                                object.material = savedMaterial.material;
                            } else {
                                // Restaurer le matériau simple
                                object.material = savedMaterial.material;
                            }
                            
                            // NOUVEAU: Restaurer les propriétés d'ombrage
                            if (savedMaterial.castShadow !== undefined) {
                                object.castShadow = savedMaterial.castShadow;
                            }
                            if (savedMaterial.receiveShadow !== undefined) {
                                object.receiveShadow = savedMaterial.receiveShadow;
                            }
                            if (savedMaterial.visible !== undefined) {
                                object.visible = savedMaterial.visible;
                            }
                            
                            // Forcer la mise à jour du matériau - CRITIQUE pour les couleurs
                            if (object.material.needsUpdate !== undefined) {
                                object.material.needsUpdate = true;
                            }
                            if (Array.isArray(object.material)) {
                                object.material.forEach(mat => {
                                    if (mat && mat.needsUpdate !== undefined) {
                                        mat.needsUpdate = true;
                                    }
                                });
                            }
                            materialsRestored++;
                        }
                    }
                });
                
                // Forcer une actualisation globale des matériaux après restauration
                if (window.MaterialManager && window.MaterialManager.refreshAllMaterials) {
                    window.MaterialManager.refreshAllMaterials();

                }
                

            }

            // === ÉTAPE 6: RESTAURATION DE L'ENVIRONNEMENT (CIEL, FOG, etc.) ===

            if (initialState.environment && scene) {
                // Restaurer le background (ciel)
                if (initialState.environment.background !== undefined) {
                    scene.background = initialState.environment.background;

                }

                // Restaurer l'environnement lighting
                if (initialState.environment.environment !== undefined) {
                    scene.environment = initialState.environment.environment;

                }

                // Restaurer le skyDome si disponible
                if (initialState.environment.skyDome && sceneManager && sceneManager.skyDome) {
                    sceneManager.skyDome.visible = initialState.environment.skyDome.visible;

                }

                // Restaurer le fog si il existait
                if (initialState.environment.fog) {
                    const fogData = initialState.environment.fog;
                    if (fogData.type === 'Fog' && window.THREE && window.THREE.Fog) {
                        scene.fog = new window.THREE.Fog(
                            fogData.color || 0xcccccc,
                            fogData.near || 1,
                            fogData.far || 1000
                        );
                    } else if (fogData.type === 'FogExp2' && window.THREE && window.THREE.FogExp2) {
                        scene.fog = new window.THREE.FogExp2(
                            fogData.color || 0xcccccc,
                            fogData.density || 0.00025
                        );
                    }

                } else {
                    // S'assurer qu'il n'y a pas de fog si il n'y en avait pas avant
                    scene.fog = null;

                }
            }

            // === ÉTAPE 7: RESTAURATION DU RENDERER POUR PRÉSERVER LES COULEURS ===

            if (initialState.renderer && sceneManager && sceneManager.renderer) {
                const renderer = sceneManager.renderer;
                
                // Restaurer les paramètres de couleur du renderer
                if (initialState.renderer.outputColorSpace !== undefined) {
                    renderer.outputColorSpace = initialState.renderer.outputColorSpace;
                }
                if (initialState.renderer.toneMapping !== undefined) {
                    renderer.toneMapping = initialState.renderer.toneMapping;
                }
                if (initialState.renderer.toneMappingExposure !== undefined) {
                    renderer.toneMappingExposure = initialState.renderer.toneMappingExposure;
                }
                if (initialState.renderer.clearColor) {
                    renderer.setClearColor(initialState.renderer.clearColor, initialState.renderer.clearAlpha || 1.0);
                }
                
                // CRITIQUE: Restaurer complètement les paramètres d'ombrage
                if (initialState.renderer.shadowMapEnabled !== undefined) {
                    renderer.shadowMap.enabled = initialState.renderer.shadowMapEnabled;
                }
                if (initialState.renderer.shadowMapType !== undefined && renderer.shadowMap) {
                    renderer.shadowMap.type = initialState.renderer.shadowMapType;
                }
                if (initialState.renderer.shadowMapAutoUpdate !== undefined && renderer.shadowMap) {
                    renderer.shadowMap.autoUpdate = initialState.renderer.shadowMapAutoUpdate;
                }
                if (initialState.renderer.physicallyCorrectLights !== undefined) {
                    renderer.physicallyCorrectLights = initialState.renderer.physicallyCorrectLights;
                }
                

            }

            // === ÉTAPE 8: RESTAURATION DES LUMIÈRES ET OMBRES ===

            if (initialState.lights && initialState.lights.length > 0 && scene) {
                let lightsRestored = 0;
                scene.traverse((object) => {
                    if (object.isLight) {
                        const savedLight = initialState.lights.find(l => l.uuid === object.uuid);
                        if (savedLight) {
                            // Restaurer les propriétés de base de la lumière
                            object.castShadow = savedLight.castShadow;
                            object.intensity = savedLight.intensity;
                            if (savedLight.color && object.color) {
                                object.color.copy(savedLight.color);
                            }
                            object.position.copy(savedLight.position);
                            object.visible = savedLight.visible;

                            // Restaurer les paramètres d'ombrage spécifiques aux lumières directionnelles
                            if (object.isDirectionalLight && savedLight.shadow && object.shadow) {
                                if (savedLight.shadow.mapSize) {
                                    object.shadow.mapSize.width = savedLight.shadow.mapSize.width;
                                    object.shadow.mapSize.height = savedLight.shadow.mapSize.height;
                                }
                                if (savedLight.shadow.camera && object.shadow.camera) {
                                    object.shadow.camera.near = savedLight.shadow.camera.near;
                                    object.shadow.camera.far = savedLight.shadow.camera.far;
                                    object.shadow.camera.left = savedLight.shadow.camera.left;
                                    object.shadow.camera.right = savedLight.shadow.camera.right;
                                    object.shadow.camera.top = savedLight.shadow.camera.top;
                                    object.shadow.camera.bottom = savedLight.shadow.camera.bottom;
                                    object.shadow.camera.updateProjectionMatrix();
                                }
                                if (savedLight.shadow.bias !== undefined) {
                                    object.shadow.bias = savedLight.shadow.bias;
                                }
                                if (savedLight.shadow.normalBias !== undefined) {
                                    object.shadow.normalBias = savedLight.shadow.normalBias;
                                }
                                
                                // Forcer la mise à jour de la shadow map
                                object.shadow.needsUpdate = true;
                            }

                            lightsRestored++;
                        }
                    }
                });

            }

            // === ÉTAPE 9: RESTAURATION DES ÉLÉMENTS SPÉCIAUX DE SCÈNE ===

            if (initialState.sceneElements) {
                // Restaurer la grille de scène
                if (initialState.sceneElements.grid && sceneManager && sceneManager.grid) {
                    sceneManager.grid.visible = initialState.sceneElements.grid.visible;

                }

                // Restaurer les axes
                if (initialState.sceneElements.axesHelper && sceneManager && sceneManager.axesHelper) {
                    sceneManager.axesHelper.visible = initialState.sceneElements.axesHelper.visible;

                }

                // Restaurer la rose des vents
                if (initialState.sceneElements.northArrowGroup && sceneManager && sceneManager.northArrowGroup) {
                    sceneManager.northArrowGroup.visible = initialState.sceneElements.northArrowGroup.visible;

                }

                // Restaurer les grilles d'assises
                if (initialState.sceneElements.assiseGrids && window.AssiseManager) {
                    const shouldBeVisible = initialState.sceneElements.assiseGrids.visible;
                    const currentlyVisible = window.AssiseManager.showAssiseGrids;
                    
                    // Changer seulement si nécessaire
                    if (shouldBeVisible !== currentlyVisible) {
                        window.AssiseManager.toggleAssiseGrids();

                    } else {

                    }
                }
            }

            // === ÉTAPE 10: FORÇAGE DE MISE À JOUR DES OMBRES ===

            if (sceneManager && sceneManager.renderer && sceneManager.renderer.shadowMap) {
                // Forcer la mise à jour de toutes les shadow maps
                sceneManager.renderer.shadowMap.needsUpdate = true;
                
                // Forcer le recalcul des ombres sur tous les éléments
                if (scene) {
                    scene.traverse((object) => {
                        if (object.isMesh) {
                            // Forcer la mise à jour du mesh pour les ombres
                            object.castShadow = object.castShadow; // Force refresh
                            object.receiveShadow = object.receiveShadow; // Force refresh
                            
                            // Si l'objet a un matériau, forcer sa mise à jour
                            if (object.material) {
                                if (Array.isArray(object.material)) {
                                    object.material.forEach(mat => {
                                        if (mat) mat.needsUpdate = true;
                                    });
                                } else {
                                    object.material.needsUpdate = true;
                                }
                            }
                        }
                        
                        // Forcer la mise à jour des lumières
                        if (object.isLight && object.shadow) {
                            object.shadow.needsUpdate = true;
                        }
                    });
                }

            }

            // === ÉTAPE 11: RENDU FINAL AVEC LA NOUVELLE CAMÉRA PERSPECTIVE ===

            const renderer = sceneManager.renderer;
            if (renderer && renderer.render && scene && camera) {
                // Plusieurs rendus pour s'assurer que tout est à jour
                renderer.render(scene, camera);
                
                // Déclencher une boucle de rendu si disponible
                if (sceneManager.animate && typeof sceneManager.animate === 'function') {
                    sceneManager.animate();
                } else if (window.animate && typeof window.animate === 'function') {
                    window.animate();
                }
                

            }

            // === VÉRIFICATION FINALE DÉTAILLÉE ===

            const finalCamera = sceneManager.camera;
            const finalControls = sceneManager.controls;
            const finalScene = sceneManager.scene;
            











            // Forcer une mise à jour de l'interface si nécessaire
            if (window.modernInterface && window.modernInterface.updateCameraInfo) {
                window.modernInterface.updateCameraInfo();
            }

            // Déclencher une mise à jour complète des matériaux si un gestionnaire existe
            if (window.MaterialManager && window.MaterialManager.refreshAllMaterials) {
                window.MaterialManager.refreshAllMaterials();

            }

            // NOUVEAU: Forcer une mise à jour des couleurs via l'élément manager si disponible
            if (window.WallElement && window.WallElement.updateAllMaterials) {
                window.WallElement.updateAllMaterials();

            }

            // NOUVEAU: Restaurer manuellement les couleurs des briques si nécessaire
            if (finalScene) {
                let bricksUpdated = 0;
                finalScene.traverse((object) => {
                    if (object.isMesh && object.userData && object.userData.element) {
                        // Forcer la mise à jour des matériaux des briques
                        if (object.material) {
                            if (Array.isArray(object.material)) {
                                object.material.forEach(mat => {
                                    if (mat) {
                                        mat.needsUpdate = true;
                                        if (mat.color) mat.color.needsUpdate = true;
                                    }
                                });
                            } else {
                                object.material.needsUpdate = true;
                                if (object.material.color) object.material.color.needsUpdate = true;
                            }
                            bricksUpdated++;
                        }
                    }
                });

            }

            // Forcer un nouveau rendu final pour s'assurer que tout est visible, y compris les ombres
            if (renderer && scene && camera) {
                // Plusieurs rendus avec délais pour permettre aux ombres de se calculer
                let renderCount = 0;
                const performRender = () => {
                    // Rendu standard
                    renderer.render(scene, camera);
                    
                    // Si les ombres sont activées, forcer leur recalcul
                    if (renderer.shadowMap && renderer.shadowMap.enabled) {
                        renderer.shadowMap.needsUpdate = true;
                        // Rendu supplémentaire pour les ombres
                        renderer.render(scene, camera);
                    }
                    
                    renderCount++;
                    if (renderCount < 7) { // Plus de rendus pour les ombres
                        // Délai plus long pour permettre aux ombres de se calculer
                        setTimeout(performRender, renderCount <= 3 ? 100 : 50);
                    } else {

                        
                        // Déclencher une animation si disponible pour maintenir les ombres
                        if (sceneManager.animate && typeof sceneManager.animate === 'function') {
                            sceneManager.animate();
                        } else if (window.animate && typeof window.animate === 'function') {
                            window.animate();
                        }
                    }
                };
                performRender();
            }



        } catch (error) {



            
            // Tentative de restauration d'urgence en cliquant sur le bouton perspective
            try {

                const perspectiveBtn = document.getElementById('viewPerspective');
                if (perspectiveBtn) {
                    perspectiveBtn.click();

                }
            } catch (emergencyError) {

            }
        }
    }
}

// Initialiser le gestionnaire de présentation avec un délai pour s'assurer que le DOM est prêt

// Fonction d'initialisation 
function initializePresentationManager() {
    try {
        window.presentationManager = new PresentationManager();
    } catch (error) {

    }
}

// Initialiser immédiatement si le DOM est déjà prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePresentationManager);
} else {
    // DOM déjà prêt
    setTimeout(initializePresentationManager, 100); // Petit délai pour s'assurer
}

// Fonction d'urgence pour forcer l'affichage de la modale
window.forceShowModal = function() {

    
    const modal = document.getElementById('presentationModal');
    if (!modal) {

        return;
    }
    
    // Styles ultra-forcés
    modal.style.cssText = `
        display: flex !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 2147483648 !important;
        background-color: rgba(0, 0, 0, 0.9) !important;
        visibility: visible !important;
        opacity: 1 !important;
    `;
    
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.cssText = `
            position: relative !important;
            z-index: 2147483649 !important;
            opacity: 1 !important;
            animation: none !important;
            transition: none !important;
            transform: scale(1) translateY(0) !important;
            background: white !important;
            border: 3px solid red !important;
            border-radius: 12px !important;
            visibility: visible !important;
            width: 90% !important;
            max-width: 1200px !important;
            margin: auto !important;
        `;
    }
    

    
    // Diagnostic
    setTimeout(() => {
        const rect = modal.getBoundingClientRect();

    }, 100);
};

// Fonction de test globale pour la console
window.testPresentationModal = function() {

    if (window.presentationManager) {
        window.presentationManager.openModal();
    } else {

    }
};

// Fonction de test BASIQUE pour créer une modale visible
window.createTestModal = function() {

    
    // Supprimer toute modale de test existante
    const existingTest = document.getElementById('testModal');
    if (existingTest) {
        existingTest.remove();
    }
    
    // Créer une modale de test ultra basique
    const testModal = document.createElement('div');
    testModal.id = 'testModal';
    testModal.innerHTML = `
        <div style="
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background-color: rgba(255, 0, 0, 0.8) !important;
            z-index: 999999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        ">
            <div style="
                background: white !important;
                padding: 50px !important;
                border: 5px solid black !important;
                border-radius: 10px !important;
                font-size: 24px !important;
                font-weight: bold !important;
                text-align: center !important;
                color: black !important;
                max-width: 80% !important;
                box-shadow: 0 0 50px rgba(0,0,0,0.8) !important;
            ">
                <h2 style="margin: 0 0 20px 0; color: red;">MODALE DE TEST VISIBLE</h2>
                <p>Si vous voyez ce message, les modales peuvent s'afficher.</p>
                <button onclick="document.getElementById('testModal').remove()" 
                        style="padding: 10px 20px; font-size: 16px; margin-top: 20px;">
                    Fermer
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(testModal);

    
    // Vérifier si elle est visible
    setTimeout(() => {
        const rect = testModal.getBoundingClientRect();

    }, 100);
};

// Fonction pour diagnostiquer les z-index élevés
window.findHighZIndex = function() {

    
    const allElements = document.querySelectorAll('*');
    const highZElements = [];
    
    allElements.forEach((el, index) => {
        const computed = window.getComputedStyle(el);
        const zIndex = parseInt(computed.zIndex);
        
        if (!isNaN(zIndex) && zIndex > 1000) {
            highZElements.push({
                element: el,
                zIndex: zIndex,
                position: computed.position,
                display: computed.display,
                visibility: computed.visibility,
                id: el.id,
                className: el.className,
                tagName: el.tagName
            });
        }
    });
    
    // Trier par z-index décroissant
    highZElements.sort((a, b) => b.zIndex - a.zIndex);
    

    highZElements.forEach((item, i) => {



    });
    
    // Vérifier aussi la modale de présentation
    const presentationModal = document.getElementById('presentationModal');
    if (presentationModal) {
        const modalStyle = window.getComputedStyle(presentationModal);







    }
    
    return highZElements;
};

// Fonction de test pour jsPDF
window.testJsPDF = function() {




    
    // S'assurer que jsPDF est configuré
    if (window.presentationManager) {
        window.presentationManager.setupJsPDF();
    }
    
    try {
        let pdf;
        if (window.jsPDF && typeof window.jsPDF === 'function') {
            pdf = new window.jsPDF();

        } else {
            throw new Error('jsPDF non disponible ou format incorrect');
        }
        
        pdf.text('Test jsPDF - WallSim3D', 10, 10);


        
        return {
            pdf: pdf,
            save: (filename) => pdf.save(filename || 'test-jspdf.pdf')
        };
    } catch (error) {


        
        if (window.presentationManager) {
            window.presentationManager.loadRequiredLibraries().then(() => {

            }).catch(err => {

            });
        }
    }
};

// Fonction de test pour capturer une vue
window.testCaptureView = function(viewType = 'perspective') {

    
    if (window.presentationManager) {
        window.presentationManager.captureCurrentView(viewType).then(canvas => {
            if (canvas && canvas.width > 0 && canvas.height > 0) {

                
                // Créer un lien pour télécharger l'image de test
                const link = document.createElement('a');
                link.download = `test-capture-${viewType}.png`;
                link.href = canvas.toDataURL();
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                

            } else {

            }
        }).catch(error => {

        });
    } else {

    }
};

// Fonction de diagnostic avancé
window.diagnosticComplet = function() {

    
    // 1. État de l'application




    
    if (window.SceneManager) {



        
        if (window.SceneManager.renderer) {
            const renderer = window.SceneManager.renderer;


            
            if (renderer.domElement) {
                const canvas = renderer.domElement;




            }
        }
    }
    
    // 2. Test de capture immédiat

    if (window.presentationManager) {
        window.presentationManager.captureCurrentView('perspective').then(canvas => {
            if (canvas && canvas.width > 0) {

                
                // Créer un aperçu dans la console
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

                
                // Télécharger automatiquement
                const link = document.createElement('a');
                link.download = 'diagnostic-capture.jpg';
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                
            } else {

            }
        }).catch(err => {

        });
    }
    
    // 3. Test des bibliothèques




    
    return 'Diagnostic en cours... vérifiez les résultats ci-dessus';
};

// Fonction pour tester une capture avec tous les paramètres
window.testCaptureAvecParametres = async function() {

    
    if (!window.SceneManager || !window.SceneManager.renderer) {

        return;
    }
    
    const canvas = window.SceneManager.renderer.domElement;

    
    // Test avec différentes options
    const optionsTest = [
        {
            name: 'Standard',
            options: {
                backgroundColor: null,
                scale: 1,
                useCORS: true,
                allowTaint: false
            }
        },
        {
            name: 'Fond blanc',
            options: {
                backgroundColor: '#ffffff',
                scale: 1,
                useCORS: true,
                allowTaint: false
            }
        },
        {
            name: 'Capture directe',
            options: {
                backgroundColor: null,
                scale: 0.5,
                logging: true,
                useCORS: false,
                allowTaint: true
            }
        }
    ];
    
    for (let test of optionsTest) {
        try {

            const result = await html2canvas(canvas, test.options);
            
            if (result && result.width > 0) {

                
                // Télécharger le résultat
                const link = document.createElement('a');
                link.download = `test-${test.name.replace(/\s/g, '-')}.png`;
                link.href = result.toDataURL();
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
            } else {

            }
            
        } catch (error) {

        }
        
        // Pause entre les tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    

};

// Fonction de diagnostic du canvas
window.diagnosticCanvas = function() {

    
    // Vérifier SceneManager

    if (window.SceneManager) {

        if (window.SceneManager.renderer) {
            const canvas = window.SceneManager.renderer.domElement;

            if (canvas) {





            }
        }
    }
    
    // Vérifier par ID
    const canvasById = document.getElementById('threejs-canvas');

    
    // Chercher tous les canvas
    const allCanvas = document.querySelectorAll('canvas');

    allCanvas.forEach((c, i) => {
        // Éviter de créer de nouveaux contextes WebGL - juste vérifier les propriétés
        try {
            if (c.width > 0 && c.height > 0) {
                // Canvas valide trouvé
            }
        } catch (error) {
            // Ignorer les erreurs
        }
    });
};

// Log pour confirmer le chargement



/**
 * Fonction de test pour vérifier le fond blanc des élévations
 */
window.testElevationBackground = async function(viewType = 'front') {

    
    if (!window.presentationManager) {

        return;
    }
    
    try {
        const canvas = await window.presentationManager.generateTechnicalElevation(viewType);
        
        if (!canvas) {

            return;
        }
        

        
        // Analyser les couleurs
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        let whitePixels = 0;
        let blackPixels = 0;
        let totalPixels = 0;
        
        for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            const a = imageData.data[i + 3];
            
            if (a > 0) { // Pixel non transparent
                totalPixels++;
                
                if (r > 240 && g > 240 && b > 240) {
                    whitePixels++;
                } else if (r < 15 && g < 15 && b < 15) {
                    blackPixels++;
                }
            }
        }
        
        const whitePercent = ((whitePixels / totalPixels) * 100).toFixed(1);
        const blackPercent = ((blackPixels / totalPixels) * 100).toFixed(1);
        



        
        if (whitePixels > blackPixels && whitePercent > 50) {

        } else {

        }
        
        // Télécharger l'image pour inspection
        const link = document.createElement('a');
        link.download = `elevation-test-${viewType}.png`;
        link.href = canvas.toDataURL();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        

        
    } catch (error) {

    }
};






// Fonction de test pour les élévations techniques
window.testTechnicalElevation = function(viewType = 'front') {

    if (window.presentationManager) {
        window.presentationManager.generateTechnicalElevation(viewType).then(canvas => {
            if (canvas) {

                
                // Télécharger l'image de test
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = `elevation-technique-${viewType}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                


            } else {

            }
        }).catch(error => {

        });
    } else {

    }
};

// Fonction de test pour les matériaux techniques
window.testTechnicalMaterials = function() {

    if (window.presentationManager) {
        const testMaterials = [];
        window.presentationManager.setTechnicalMaterials(testMaterials, window.SceneManager);



        
        // Stocker dans window pour accès global
        window.testMaterialsArray = testMaterials;
    } else {

    }
};

// Fonction pour restaurer les matériaux
window.restoreTechnicalMaterials = function() {

    if (window.presentationManager && window.testMaterialsArray) {
        window.presentationManager.restoreOriginalMaterials(window.testMaterialsArray, window.SceneManager);

        window.testMaterialsArray = null;
    } else {

    }
};

// ====== FONCTIONS DE TEST ET VALIDATION DES ÉCHELLES ======

/**
 * Test et validation des calculs d'échelle
 */
function testScaleCalculations() {

    
    if (!window.presentationManager) {

        return;
    }
    
    const testScales = ['1:10', '1:20', '1:25', '1:50', '1:100'];
    const brickSize = 19; // cm (taille standard d'une brique)
    
    testScales.forEach(scaleString => {

        
        const scaleFactor = window.presentationManager.parseScale(scaleString);

        
        const expectedPaperSize = brickSize / scaleFactor;

        
        // Test du calcul de frustum
        const buildingAnalysis = { elementCount: 1, size: { x: 100, y: 50, z: 150 } };
        const frustumSize = window.presentationManager.calculateOptimalFrustumSize(scaleFactor, 'front', buildingAnalysis);

    });
    

}

/**
 * Test spécifique pour l'échelle 1:20 mentionnée par l'utilisateur
 */
function testScale1to20() {

    
    const brickRealSize = 19; // cm
    const scale = 20;
    const expectedPaperSize = brickRealSize / scale; // 19/20 = 0.95cm
    





    
    // Exposer la fonction pour test dans la console

}

// Exposer les fonctions de test
window.testScaleCalculations = testScaleCalculations;
window.testScale1to20 = testScale1to20;

// Ajouter la méthode d'export STL au PresentationManager
PresentationManager.prototype.exportSTLForPrinting = function() {
    console.log('🖨️ [Print3D] Démarrage export STL pour impression 3D...');
    
    // Vérifier si FileMenuHandler est disponible
    if (window.FileMenuHandler && typeof window.FileMenuHandler.exportSTLForPrinting === 'function') {
        window.FileMenuHandler.exportSTLForPrinting();
    } else {
        console.error('❌ FileMenuHandler.exportSTLForPrinting non disponible');
        alert('Fonction d\'export STL non disponible. Veuillez vérifier la configuration.');
    }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PresentationManager;
}

// Initialisation automatique avec instance unique

try {
    // Éviter les instances multiples
    if (!window.presentationManager) {
        window.presentationManager = new PresentationManager();

    } else {

    }
} catch (error) {

}
