/**
 * Gestionnaire de l'interface des matériaux étendus
 * Gère l'affichage et la sélection des 50 nouveaux matériaux organisés par sections
 */
class ExtendedMaterialManager {
    constructor() {
        // Matériau par défaut : brique rouge classique
        this.currentMaterial = 'brique-rouge-classique';
        this.searchTerm = '';
        this.collapsedSections = new Set();
        this.initializeInterface();
        this.bindEvents();
        this.loadMaterials();
    }

    initializeInterface() {
        // console.log('🎨 Initialisation du gestionnaire de matériaux étendu');
        this.updateStats();
    }

    bindEvents() {
        // Onglets Couleurs/Textures
        const materialTabs = document.querySelectorAll('.material-tab');
        materialTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = (e.currentTarget && e.currentTarget.dataset)
                    ? e.currentTarget.dataset.tab
                    : (e.target && e.target.closest('.material-tab')?.dataset.tab);
                if (tabId) {
                    this.switchTab(tabId);
                }
            });
        });

        // Recherche
        const searchInput = document.getElementById('materialSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.clearSearch();
                }
            });
        }

        const clearSearchBtn = document.getElementById('clearMaterialSearch');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => this.clearSearch());
        }

        // Headers des sections (pour collapse/expand)
        const sectionHeaders = document.querySelectorAll('.material-section-header');
        sectionHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                const section = e.target.closest('.material-section');
                this.toggleSection(section.dataset.section);
            });
        });

        // Select principal
        const materialSelect = document.getElementById('materialSelect');
        if (materialSelect) {
            materialSelect.addEventListener('change', (e) => this.selectMaterial(e.target.value));
        }
    }

    loadMaterials() {
        // console.log('📦 Chargement des matériaux...');
        
        if (!window.MaterialLibrary) {
            console.error('❌ MaterialLibrary non disponible');
            return;
        }

        const sections = window.MaterialLibrary.getMaterialsBySection();
        this.populateSelect(sections);
        
        Object.keys(sections).forEach(sectionId => {
            if (sectionId !== 'compatibilite') { // Ignorer la section de compatibilité dans l'affichage
                this.renderSection(sectionId, sections[sectionId]);
            }
        });

        // Sélectionner le premier matériau par défaut
        this.selectMaterial('brique-rouge-classique');
        
        // console.log('✅ Matériaux chargés avec succès');
    }

    populateSelect(sections) {
        const select = document.getElementById('materialSelect');
        if (!select) return;

        select.innerHTML = '';
        
        Object.keys(sections).forEach(sectionId => {
            const section = sections[sectionId];
            if (section.materials.length === 0) return;
            
            const optgroup = document.createElement('optgroup');
            optgroup.label = section.name;
            
            section.materials.forEach(material => {
                const option = document.createElement('option');
                option.value = material.id;
                option.textContent = material.name;
                optgroup.appendChild(option);
            });
            
            select.appendChild(optgroup);
        });
    }

    renderSection(sectionId, section) {
        const grid = document.getElementById(`${sectionId}-materials`);
        if (!grid) return;

        grid.innerHTML = '';
        
        section.materials.forEach(material => {
            const materialItem = this.createMaterialItem(material);
            grid.appendChild(materialItem);
        });
    }

    createMaterialItem(material) {
        const item = document.createElement('div');
        item.className = 'material-item';
        item.dataset.materialId = material.id;
        item.dataset.materialName = material.name.toLowerCase();
        item.dataset.materialDescription = (material.description || '').toLowerCase();
        
        const colorHex = `#${material.color.toString(16).padStart(6, '0').toUpperCase()}`;
        
        item.innerHTML = `
            <div class="material-preview" style="background: ${colorHex};"></div>
            <div class="material-name">${material.name}</div>
            <div class="material-code">${colorHex}</div>
            <div class="material-description">${material.description || ''}</div>
            <div class="material-paint-action">
                <button class="paint-btn" title="Activer le pinceau avec ce matériau">
                    <i class="fas fa-paint-brush"></i>
                </button>
            </div>
            <div class="material-tooltip">
                <strong>${material.name}</strong><br>
                ${colorHex} • RVB ${material.rgb || ''}<br>
                ${material.description || ''}<br>
                <em>Clic: sélectionner | Pinceau: peindre les éléments</em>
            </div>
        `;
        
        // Événement de sélection normal
        item.addEventListener('click', (e) => {
            // Ne pas déclencher la sélection si on clique sur le bouton pinceau
            if (!e.target.closest('.paint-btn')) {
                this.selectMaterial(material.id);
            }
        });

        // Événement pour le bouton pinceau
        const paintBtn = item.querySelector('.paint-btn');
        if (paintBtn) {
            paintBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.MaterialPainter) {
                    window.MaterialPainter.startPaintingWithMaterial(material.id);
                    this.showPaintNotification(material.name);
                }
            });
        }
        
        return item;
    }

    selectMaterial(materialId) {
        // Retirer la sélection précédente
        document.querySelectorAll('.material-item.active').forEach(item => {
            item.classList.remove('active');
        });
        
        // Ajouter la nouvelle sélection
        const newItem = document.querySelector(`[data-material-id="${materialId}"]`);
        if (newItem) {
            newItem.classList.add('active');
        }
        
        // Mettre à jour le select
        const select = document.getElementById('materialSelect');
        if (select) {
            select.value = materialId;
        }
        
        // Mettre à jour les informations
        this.currentMaterial = materialId;
        this.updateMaterialInfo(materialId);
        this.updateStats();
        
        // Notifier le système de construction
        if (window.ConstructionTools) {
            window.ConstructionTools.currentMaterial = materialId;
            // console.log(`🎨 Matériau sélectionné: ${materialId}`);
        }

        // Émettre un événement pour autres composants
        document.dispatchEvent(new CustomEvent('materialChanged', {
            detail: { materialId, material: window.MaterialLibrary.getMaterial(materialId) }
        }));
    }

    updateMaterialInfo(materialId) {
        const material = window.MaterialLibrary.getMaterial(materialId);
        const infoDiv = document.getElementById('selectedMaterialInfo');
        
        if (infoDiv && material) {
            document.getElementById('materialInfoName').textContent = material.name;
            document.getElementById('materialInfoRgb').textContent = material.rgb || '-';
            document.getElementById('materialInfoDescription').textContent = material.description || '-';
            
            infoDiv.style.display = 'block';
        }
    }

    updateStats() {
        const totalMaterials = Object.keys(window.MaterialLibrary.materials).filter(
            id => window.MaterialLibrary.materials[id].section !== 'compatibilite'
        ).length;
        
        document.getElementById('totalMaterials').textContent = totalMaterials;
        document.getElementById('totalSections').textContent = '5';
        
        const currentMaterialName = window.MaterialLibrary.getMaterial(this.currentMaterial).name;
        document.getElementById('currentMaterial').textContent = currentMaterialName;
    }

    switchTab(tabId) {
        // Changer l'onglet actif
        document.querySelectorAll('.material-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        const btn = document.querySelector(`[data-tab="${tabId}"]`);
        if (btn) btn.classList.add('active');

        // Changer le contenu affiché
        document.querySelectorAll('.material-tab-content').forEach(content => {
            content.classList.remove('active');
        });

        if (tabId === 'colors') {
            const colors = document.getElementById('material-colors-tab');
            if (colors) colors.classList.add('active');
        } else if (tabId === 'textures') {
            const textures = document.getElementById('material-textures-tab');
            if (textures) textures.classList.add('active');
        }
    }

    toggleSection(sectionId) {
        const section = document.querySelector(`[data-section="${sectionId}"]`);
        if (!section) return;
        
        if (this.collapsedSections.has(sectionId)) {
            this.collapsedSections.delete(sectionId);
            section.classList.remove('collapsed');
        } else {
            this.collapsedSections.add(sectionId);
            section.classList.add('collapsed');
        }
    }

    handleSearch(searchTerm) {
        this.searchTerm = searchTerm.toLowerCase();
        
        if (searchTerm.trim() === '') {
            this.showAllMaterials();
            return;
        }
        
        const materialItems = document.querySelectorAll('.material-item');
        let visibleCount = 0;
        
        materialItems.forEach(item => {
            const name = item.dataset.materialName;
            const description = item.dataset.materialDescription;
            
            const matches = name.includes(this.searchTerm) || description.includes(this.searchTerm);
            
            if (matches) {
                item.style.display = 'block';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });
        
        // Masquer les sections vides
        document.querySelectorAll('.material-section').forEach(section => {
            const visibleItems = section.querySelectorAll('.material-item[style="display: block;"], .material-item:not([style])');
            const hasVisibleItems = Array.from(visibleItems).some(item => item.style.display !== 'none');
            
            if (hasVisibleItems) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
        
        console.log(`🔍 Recherche "${searchTerm}": ${visibleCount} résultats`);
    }

    showAllMaterials() {
        document.querySelectorAll('.material-item').forEach(item => {
            item.style.display = 'block';
        });
        
        document.querySelectorAll('.material-section').forEach(section => {
            section.style.display = 'block';
        });
    }

    clearSearch() {
        const searchInput = document.getElementById('materialSearchInput');
        if (searchInput) {
            searchInput.value = '';
            this.handleSearch('');
        }
    }

    // Méthodes utilitaires pour autres composants
    getCurrentMaterial() {
        return this.currentMaterial;
    }

    getMaterialData(materialId) {
        return window.MaterialLibrary.getMaterial(materialId || this.currentMaterial);
    }

    refreshInterface() {
        this.loadMaterials();
        this.updateStats();
    }

    showPaintNotification(materialName) {
        const notification = document.createElement('div');
        notification.className = 'paint-activation-notification';
        notification.innerHTML = `
            <i class="fas fa-paint-brush"></i>
            Mode pinceau activé avec <strong>${materialName}</strong>
            <br><small>Cliquez sur un élément pour le peindre</small>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(74, 144, 226, 0.95);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            font-size: 14px;
            text-align: center;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialisation automatique quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que MaterialLibrary soit disponible
    const initMaterialManager = () => {
        if (window.MaterialLibrary) {
            window.ExtendedMaterialManager = new ExtendedMaterialManager();
            // console.log('🎨 ExtendedMaterialManager initialisé');
        } else {
            setTimeout(initMaterialManager, 100);
        }
    };
    
    initMaterialManager();
});

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExtendedMaterialManager;
}
