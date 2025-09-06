/**
 * Gestionnaire de l'onglet Métré
 * Affiche tous les éléments placés sous forme de tableau avec leurs propriétés
 */
class MetreTabManager {
    constructor() {
        this.currentSort = { column: null, direction: 'asc' };
        this.currentFilter = 'all';
        this.currentGroupBy = 'none';
        this.elements = new Map();
        this.manualItems = new Map(); // Nouveaux objets/outils ajoutés manuellement
        this.isInitialized = false;
        this.startupTime = Date.now(); // Protection anti-ouverture automatique
        
        this.init();
    }

    init() {
        // console.log('🔢 Initialisation du gestionnaire de l\'onglet Métré');
        
        try {
            this.setupEventListeners();
            this.setupTabListener();
            this.isInitialized = true;
            // console.log('✅ Gestionnaire Métré initialisé avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du gestionnaire Métré:', error);
        }
    }

    setupEventListeners() {
        // Boutons de contrôle
        const refreshBtn = document.getElementById('refreshMetre');
        const exportBtn = document.getElementById('exportMetre');
        const addManualBtn = document.getElementById('addManualItem');
        const filterType = document.getElementById('filterType');
        const groupBy = document.getElementById('groupBy');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        if (addManualBtn) {
            addManualBtn.addEventListener('click', (e) => {
                // S'assurer que c'est un vrai clic utilisateur
                if (e.isTrusted && this.isTabActive()) {
                    this.showManualItemModal();
                }
            });
        }

        if (filterType) {
            filterType.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.refreshTable();
            });
        }

        if (groupBy) {
            groupBy.addEventListener('change', (e) => {
                this.currentGroupBy = e.target.value;
                this.refreshTable();
            });
        }

        // Événements de tri sur les en-têtes
        const sortableHeaders = document.querySelectorAll('.metre-table th.sortable');
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.getAttribute('data-sort');
                this.sortTable(column);
            });
        });

        // Écouter les changements de scène
        document.addEventListener('sceneChanged', () => {
            if (this.isTabActive()) {
                this.refreshData();
            }
        });
    }

    setupTabListener() {
        // Écouter l'activation de l'onglet métré
        const metreTab = document.querySelector('[data-tab="metre"]');
        if (metreTab) {
            metreTab.addEventListener('click', () => {
                // Petit délai pour s'assurer que l'onglet est bien activé
                setTimeout(() => {
                    if (this.isTabActive()) {
                        this.refreshData();
                    }
                }, 100);
            });
        }
    }

    isTabActive() {
        const tabContent = document.getElementById('tab-content-metre');
        return tabContent && !tabContent.classList.contains('hidden') && 
               tabContent.style.display !== 'none';
    }

    refreshData() {
        // console.log('🔄 Actualisation des données du métré');
        
        this.elements.clear();
        
        // Récupérer tous les éléments de la scène
        if (window.SceneManager && window.SceneManager.elements) {
            window.SceneManager.elements.forEach((element, id) => {
                this.elements.set(id, this.processElement(element));
            });
        }

        // console.log(`📊 ${this.elements.size} élément(s) trouvé(s) dans la scène`);
        
        this.updateSummary();
        this.refreshTable();
    }

    processElement(element) {
        // Traiter un élément pour extraire toutes les informations nécessaires
        const materialData = window.MaterialLibrary ? 
            window.MaterialLibrary.getMaterial(element.material) : null;

        // Déterminer le type spécifique de brique ou bloc
        const brickType = this.getBrickType(element);
        const blockType = this.getBlockType(element);
        
        // Extraire l'information de coupe
        const cutInfo = this.extractCutInfo(element);

        // Gestion spéciale pour les modèles GLB
        if (element.type === 'glb' || element.isGLBModel) {
            return this.processGLBElement(element);
        }

        return {
            id: element.id,
            type: element.type,
            // Personnalisation: pour les poutres afficher le profil (ex: Poutre IPE100)
            typeName: (element.type === 'beam' && element.beamType) ? `Poutre ${element.beamType}` : this.getTypeDisplayName(element.type),
            brickType: brickType,
            brickTypeName: brickType || 'N/A',
            blockType: blockType,
            blockTypeName: blockType || 'N/A',
            cutType: cutInfo.type,
            cutDisplay: cutInfo.display,
            material: element.material,
            materialName: materialData ? materialData.name : element.material,
            materialColor: materialData ? materialData.color : '#cccccc',
            dimensions: {
                length: element.dimensions.length,
                width: element.dimensions.width,
                height: element.dimensions.height,
                formatted: `${element.dimensions.length}×${element.dimensions.width}×${element.dimensions.height}`
            },
            position: {
                x: Math.round(element.position.x * 10) / 10,
                y: Math.round(element.position.y * 10) / 10,
                z: Math.round(element.position.z * 10) / 10,
                formatted: `${Math.round(element.position.x * 10) / 10}, ${Math.round(element.position.y * 10) / 10}, ${Math.round(element.position.z * 10) / 10}`
            },
            volume: element.getVolume ? element.getVolume() : 0,
            mass: element.getMass ? element.getMass() : 0,
            rotation: element.rotation || 0,
            element: element // Référence vers l'élément original
        };
    }

    processGLBElement(element) {
        // Traitement spécial pour les modèles GLB

        // Calculer les dimensions à partir de la bounding box ou des dimensions stockées
        let dimensions = { length: 0, width: 0, height: 0 };
        let volume = 0;
        let mass = 1; // Masse par défaut pour les modèles GLB

        if (element.dimensions) {
            // Utiliser les dimensions pré-calculées (plus fiable)
            dimensions.length = Math.round(element.dimensions.length * 10) / 10;
            dimensions.width = Math.round(element.dimensions.width * 10) / 10;
            dimensions.height = Math.round(element.dimensions.height * 10) / 10;
            volume = (dimensions.length * dimensions.width * dimensions.height) / 1000000; // Conversion en m³
        } else if (element.boundingBox) {
            // Fallback: utiliser la bounding box si disponible
            const box = element.boundingBox;
            dimensions.length = Math.round((box.max.x - box.min.x) * 10) / 10;
            dimensions.width = Math.round((box.max.z - box.min.z) * 10) / 10;
            dimensions.height = Math.round((box.max.y - box.min.y) * 10) / 10;
            volume = (dimensions.length * dimensions.width * dimensions.height) / 1000000; // Conversion en m³
            console.log('📐 Dimensions GLB depuis boundingBox:', dimensions);
        } else {
            console.warn('⚠️ Aucune dimension disponible pour l\'élément GLB:', element);
        }

        // Déterminer le nom du modèle et vérifier s'il s'agit d'éléments de plancher
        const modelName = element.glbFileName || element.name || 'Modèle 3D';
        
        const isHourdis = modelName.toLowerCase().includes('hourdis') || 
                         element.glbType?.toLowerCase().includes('hourdis') ||
                         element.userData?.glbInfo?.type?.toLowerCase().includes('hourdis') ||
                         element.userData?.glbInfo?.isHourdis === true ||
                         element.userData?.isHourdis === true;

        const isPoutrain = modelName.toLowerCase().includes('poutrain') || 
                          element.glbType?.toLowerCase().includes('poutrain') ||
                          element.userData?.glbInfo?.type?.toLowerCase().includes('poutrain') ||
                          element.type === 'poutrain_beton_12';

        const isClaveau = modelName.toLowerCase().includes('claveau') || 
                         element.glbType?.toLowerCase().includes('claveau') ||
                         element.userData?.glbInfo?.type?.toLowerCase().includes('claveau') ||
                         element.type === 'claveau_beton_12_53';

        // Configuration spécifique pour les éléments de plancher
        let elementTypeName = 'Modèle 3D (GLB)';
        let materialName = `Modèle: ${modelName}`;
        let materialType = element.material || 'glb_model';
        let materialColor = '#4CAF50'; // Couleur verte par défaut
        let formattedDimensions = `${dimensions.length}×${dimensions.width}×${dimensions.height}`;

        if (isHourdis) {
            // Formater spécifiquement pour les Hourdis selon votre demande
            // Pour les Hourdis : X=largeur(60), Z=longueur(300), Y=hauteur(13/16)
            const hourdisLargeur = Math.round(dimensions.length); // X = largeur = 60
            const hourdisLongueur = Math.round(dimensions.width);  // Z = longueur = 300 (avec échelle)
            const hourdisHauteur = Math.round(dimensions.height); // Y = hauteur = 13 ou 16
            
            // Détecter automatiquement le type de hourdis (13 ou 16) depuis la hauteur ou le nom
            let hourdisType = '13'; // valeur par défaut
            if (element.userData?.glbInfo?.type) {
                // Extraire le type depuis le nom du GLB (hourdis_13_60 ou hourdis_16_60)
                const match = element.userData.glbInfo.type.match(/hourdis_(\d+)_/);
                if (match) {
                    hourdisType = match[1];
                }
            } else if (hourdisHauteur >= 16) {
                hourdisType = '16';
            } else if (hourdisHauteur >= 13) {
                hourdisType = '13';
            }
            
            // Format ID: Inclure la longueur pour différencier les lignes
            elementTypeName = `Hourdis ${hourdisType} (${hourdisLongueur}cm)`;
            materialName = 'béton';
            materialType = 'concrete';
            materialColor = '#8C7853'; // Couleur béton
            // Format LxlxH: "longueur x largeur x hauteur"
            formattedDimensions = `${hourdisLongueur}x${hourdisLargeur}x${hourdisHauteur}`;
            
            // Calcul masse plus réaliste pour béton (2400 kg/m³)
            mass = volume * 2400;
        } else if (isPoutrain) {
            // Formater spécifiquement pour les Poutrains béton
            const poutrainLargeur = Math.round(dimensions.width); // Largeur = 12
            const poutrainHauteur = Math.round(dimensions.height); // Hauteur = 12
            const poutrainLongueur = Math.round(dimensions.length); // Longueur variable
            
            // Format ID: Inclure la longueur pour différencier les lignes
            elementTypeName = `Poutrain béton ${poutrainHauteur} (${poutrainLongueur}cm)`;
            materialName = 'béton';
            materialType = 'concrete';
            materialColor = '#8C7853'; // Couleur béton
            // Format LxlxH: "longueur x largeur x hauteur"
            formattedDimensions = `${poutrainLongueur}x${poutrainLargeur}x${poutrainHauteur}`;
            
            // Calcul masse plus réaliste pour béton (2400 kg/m³)
            mass = volume * 2400;
        } else if (isClaveau) {
            // Formater spécifiquement pour les Claveaux béton
            const claveauLargeur = Math.round(dimensions.width); // Largeur = 12
            const claveauHauteur = Math.round(dimensions.height); // Hauteur = 12
            const claveauLongueur = Math.round(dimensions.length); // Longueur = 53
            
            // Format ID: Taille fixe pour claveau
            elementTypeName = `Claveau béton ${claveauHauteur}-${claveauLongueur}`;
            materialName = 'béton';
            materialType = 'concrete';
            materialColor = '#8C7853'; // Couleur béton
            // Format LxlxH: "longueur x largeur x hauteur"
            formattedDimensions = `${claveauLongueur}x${claveauLargeur}x${claveauHauteur}`;
            
            // Calcul masse plus réaliste pour béton (2400 kg/m³)
            mass = volume * 2400;
        }

        const result = {
            id: element.id,
            type: 'glb',
            typeName: elementTypeName,
            modelName: modelName,
            fileName: element.glbFileName || 'Unknown',
            brickType: null,
            brickTypeName: 'N/A',
            blockType: null,
            blockTypeName: 'N/A',
            material: materialType,
            materialName: materialName,
            materialColor: materialColor,
            dimensions: {
                length: dimensions.length,
                width: dimensions.width,
                height: dimensions.height,
                formatted: formattedDimensions
            },
            position: {
                x: Math.round(element.position.x * 10) / 10,
                y: Math.round(element.position.y * 10) / 10,
                z: Math.round(element.position.z * 10) / 10,
                formatted: `${Math.round(element.position.x * 10) / 10}, ${Math.round(element.position.y * 10) / 10}, ${Math.round(element.position.z * 10) / 10}`
            },
            volume: volume,
            mass: mass,
            rotation: element.rotation || 0,
            scale: element.scale || { x: 1, y: 1, z: 1 },
            element: element // Référence vers l'élément original
        };
        
        return result;
    }

    extractCutInfo(element) {
        // Extraire l'information de coupe d'un élément
        let cutType = 'full';
        let cutDisplay = 'Entier';
        
        // 1. Vérifier si l'élément a un cutType explicite
        if (element.cutType) {
            cutType = element.cutType;
        }
        // 2. Vérifier les suffixes dans brickType ou blockType
        else if (element.brickType) {
            if (element.brickType.includes('_3Q')) {
                cutType = '3/4';
            } else if (element.brickType.includes('_HALF')) {
                cutType = '1/2';
            } else if (element.brickType.includes('_1Q')) {
                cutType = '1/4';
            }
        } else if (element.blockType) {
            if (element.blockType.includes('_3Q')) {
                cutType = '3/4';
            } else if (element.blockType.includes('_HALF')) {
                cutType = '1/2';
            } else if (element.blockType.includes('_1Q')) {
                cutType = '1/4';
            }
        }
        // 3. Vérifier les dimensions réduites (pour les éléments coupés)
        else if (element.dimensions) {
            const standardLengths = [20, 22.5, 25, 30, 37.5]; // Longueurs standards
            const currentLength = element.dimensions.length;
            
            // Chercher si la longueur correspond à une coupe
            for (let standardLength of standardLengths) {
                if (Math.abs(currentLength - standardLength * 0.75) < 0.1) {
                    cutType = '3/4';
                    break;
                } else if (Math.abs(currentLength - standardLength * 0.5) < 0.1) {
                    cutType = '1/2';
                    break;
                } else if (Math.abs(currentLength - standardLength * 0.25) < 0.1) {
                    cutType = '1/4';
                    break;
                }
            }
        }
        
        // Mapper les types de coupe vers l'affichage
        switch (cutType) {
            case '3/4':
                cutDisplay = '3/4';
                break;
            case '1/2':
                cutDisplay = '1/2';
                break;
            case '1/4':
                cutDisplay = '1/4';
                break;
            default:
                cutDisplay = 'Entier';
                cutType = 'full';
        }
        
        return {
            type: cutType,
            display: cutDisplay
        };
    }

    getBrickType(element) {
        // Détecter le type de brique basé sur les dimensions
        if (element.type !== 'brick') return null;

        const height = element.dimensions.height;
        const tolerance = 0.1;

        // Si on a un brickType explicite dans l'élément, l'utiliser
        if (element.brickType) {
            // Retourner le type de brique complet (avec suffixes de coupe)
            return element.brickType;
        }

        // Mapper les hauteurs aux types de briques
        if (Math.abs(height - 5) < tolerance) return 'M50';
        if (Math.abs(height - 5.7) < tolerance) return 'M57';
        if (Math.abs(height - 6) < tolerance) return 'M60';
        if (Math.abs(height - 6.5) < tolerance) return 'M65';
        if (Math.abs(height - 9) < tolerance) return 'M90';

        // Vérifier si BrickSelector est disponible et a des dimensions actuelles
        if (window.currentBrickDimensions && window.currentBrickDimensions.type) {
            const brickType = window.currentBrickDimensions.type;
            return brickType; // Retourner le type complet
        }

        // Essayer de récupérer depuis le BrickSelector actuel
        if (window.BrickSelector && window.BrickSelector.getCurrentType) {
            const currentType = window.BrickSelector.getCurrentType();
            return currentType; // Retourner le type complet
        }

        return `H${height}`;  // Format générique si type non reconnu
    }

    getBlockType(element) {
        // Méthode pour identifier le type spécifique de bloc
        if (!element || element.type !== 'block') {
            return null;
        }

        const { length, width, height } = element.dimensions;

        // Essayer de récupérer depuis blockType si présent
        if (element.blockType) {
            return element.blockType;
        }

        // Identification par dimensions pour les blocs standards
        const blockTypes = {
            // Blocs creux standards
            'B9': { length: 39, width: 9, height: 19 },
            'B14': { length: 39, width: 14, height: 19 },
            'B19': { length: 39, width: 19, height: 19 },
            'B29': { length: 39, width: 29, height: 19 },
            // Blocs 3/4
            'B9_3Q': { length: 29, width: 9, height: 19 },
            'B14_3Q': { length: 29, width: 14, height: 19 },
            'B19_3Q': { length: 29, width: 19, height: 19 },
            'B29_3Q': { length: 29, width: 29, height: 19 },
            // Blocs béton cellulaire
            'BC20': { length: 60, width: 20, height: 25 },
            'BC25': { length: 60, width: 25, height: 25 },
            'BC30': { length: 60, width: 30, height: 25 }
        };

        // Recherche exacte par dimensions
        for (const [type, dims] of Object.entries(blockTypes)) {
            if (Math.abs(length - dims.length) <= 0.1 && 
                Math.abs(width - dims.width) <= 0.1 && 
                Math.abs(height - dims.height) <= 0.1) {
                return type;
            }
        }

        // Essayer de récupérer depuis le BlockSelector actuel
        if (window.BlockSelector && window.BlockSelector.getCurrentType) {
            const currentType = window.BlockSelector.getCurrentType();
            const baseType = currentType.split('_')[0];
            if (['B9', 'B14', 'B19', 'B29', 'BC20', 'BC25', 'BC30'].includes(baseType)) {
                return currentType;
            }
        }

        return `B${width}x${height}`;  // Format générique si type non reconnu
    }

    getTypeDisplayName(type) {
        const typeNames = {
            'brick': 'Brique',
            'block': 'Bloc',
            'insulation': 'Isolant',
            'joint': 'Joint',
            'glb': 'Modèle 3D (GLB)',
            'gltf': 'Modèle 3D (GLTF)'
        };
        return typeNames[type] || type;
    }

    updateSummary() {
        // Compter seulement les éléments non-joints de la scène
        const nonJointElements = Array.from(this.elements.values()).filter(element => 
            element.type !== 'joint'
        );
        
        // Ajouter les objets manuels au compte total
        const manualElements = Array.from(this.manualItems.values());
        const totalElements = nonJointElements.length + manualElements.length;
        
        let totalVolume = 0;
        let totalMass = 0;

        // Calcul pour les éléments de la scène
        nonJointElements.forEach(element => {
            totalVolume += element.volume;
            totalMass += element.mass;
        });
        
        // Les objets manuels n'ont pas de volume/masse physique dans la scène
        // mais on peut ajouter des informations si nécessaire

        // Mise à jour des statistiques
        this.updateElementText('totalElements', totalElements.toString());
        this.updateElementText('totalVolumeMetre', `${totalVolume.toFixed(3)} m³`);
        this.updateElementText('totalMassMetre', `${totalMass.toFixed(2)} kg`);
    }

    updateElementText(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }

    refreshTable() {
        const tbody = document.getElementById('metreTableBody');
        if (!tbody) return;

        // Combiner les éléments de la scène et les objets manuels
        let allElements = [];
        
        // Filtrer les éléments de la scène - exclure automatiquement les joints ET les éléments vides
        // Exception pour les modèles GLB qui sont toujours inclus
        let filteredSceneElements = Array.from(this.elements.values()).filter(element => {
            if (element.type === 'joint') return false;
            
            // Les modèles GLB sont toujours inclus
            if (element.type === 'glb' || element.isGLBModel) return true;
            
            // Pour les autres éléments, vérifier volume et masse
            return element.volume > 0 && element.mass > 0;
        });
        allElements = [...filteredSceneElements];
        
        // Ajouter les objets manuels (tous les objets manuels valides)
        let manualElements = Array.from(this.manualItems.values()).filter(element =>
            element.isManual === true  // Les objets manuels sont toujours affichés
        );
        allElements = [...allElements, ...manualElements];
        
        // Appliquer le filtre par type
        if (this.currentFilter !== 'all') {
            allElements = allElements.filter(element => 
                element.type === this.currentFilter
            );
        }

        // Trier les éléments
        if (this.currentSort.column) {
            allElements.sort((a, b) => {
                const aVal = this.getSortValue(a, this.currentSort.column);
                const bVal = this.getSortValue(b, this.currentSort.column);
                
                let comparison = 0;
                if (aVal < bVal) comparison = -1;
                else if (aVal > bVal) comparison = 1;
                
                return this.currentSort.direction === 'desc' ? -comparison : comparison;
            });
        }

        // Vider le tableau
        tbody.innerHTML = '';

        if (allElements.length === 0) {
            this.showEmptyState(tbody);
            return;
        }

        // Toujours afficher en mode condensé (résumé par type)
        this.renderCondensedTable(tbody, allElements);
    }

    renderCondensedTable(tbody, elements) {
        const groups = new Map();
        
        // Grouper automatiquement par type ET par coupe
        // Ne traiter que les éléments avec du contenu valide
        elements.forEach(element => {
            // Vérifier que l'élément a vraiment du contenu
            // Exception pour les objets manuels et les modèles GLB qui sont toujours valides
            if (!element.isManual && 
                !(element.type === 'glb' || element.isGLBModel) && 
                (!element.volume || element.volume <= 0 || !element.mass || element.mass <= 0)) {
                return; // Ignorer les éléments vides (sauf objets manuels et GLB)
            }
            
            let groupKey = '';
            
            // Pour les objets manuels, utiliser le nom individuel comme clé de groupe
            if (element.isManual) {
                groupKey = element.name; // Chaque objet manuel a sa propre ligne
            } else if (element.type === 'glb' || element.isGLBModel) {
                // Pour les modèles GLB, vérifier d'abord si c'est un Hourdis avec typeName personnalisé
                if (element.typeName && element.typeName.toLowerCase().includes('hourdis')) {
                    groupKey = element.typeName; // Utiliser le nom personnalisé pour les Hourdis
                } else {
                    groupKey = `Modèle 3D: ${element.modelName || element.fileName || 'GLB'}`;
                }
            } else if (element.type === 'beam' && element.beamType) {
                // Grouper spécifiquement par profil poutre (ex: IPE100) + coupe éventuelle
                const cutDisplay = element.cutDisplay || 'Entier';
                groupKey = `Poutre ${element.beamType}` + (cutDisplay !== 'Entier' ? ` - ${cutDisplay}` : '');
            } else if (element.type === 'brick' && element.brickType) {
                // Séparer par type de brique ET par coupe
                const baseType = element.brickType.split('_')[0]; // Enlever les suffixes de coupe
                const cutDisplay = element.cutDisplay || 'Entier';
                groupKey = `Brique ${baseType} - ${cutDisplay}`;
            } else if (element.type === 'block' && element.blockType) {
                // Séparer par type de bloc ET par coupe
                const baseType = element.blockType.split('_')[0]; // Enlever les suffixes de coupe
                const cutDisplay = element.cutDisplay || 'Entier';
                groupKey = `Bloc ${baseType} - ${cutDisplay}`;
            } else {
                // Pour les autres types, ajouter la coupe si différente d'entier
                const cutDisplay = element.cutDisplay || 'Entier';
                if (cutDisplay !== 'Entier') {
                    groupKey = `${element.typeName} - ${cutDisplay}`;
                } else {
                    groupKey = element.typeName;
                }
            }
            
            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey).push(element);
        });

        // Ne créer des lignes résumées que pour les groupes qui ont des éléments valides
        groups.forEach((groupElements, groupName) => {
            if (groupElements.length > 0) { // Seulement les groupes avec des éléments
                const summaryRow = this.createSummaryRow(groupName, groupElements);
                tbody.appendChild(summaryRow);
            }
        });
    }

    getSortValue(element, column) {
        switch (column) {
            case 'id': return element.id;
            case 'type': 
                // Pour les briques et blocs, inclure le type spécifique dans le tri
                if (element.type === 'brick' && element.brickType) {
                    return `${element.typeName} ${element.brickType}`;
                } else if (element.type === 'block' && element.blockType) {
                    return `${element.typeName} ${element.blockType}`;
                }
                return element.typeName;
            case 'material': return element.materialName;
            case 'dimensions': return element.dimensions.length;
            case 'position': return element.position.x;
            case 'volume': return element.volume;
            case 'mass': return element.mass;
            default: return '';
        }
    }

    renderNormalTable(tbody, elements) {
        elements.forEach(element => {
            const row = this.createTableRow(element);
            tbody.appendChild(row);
        });
    }

    renderGroupedTable(tbody, elements) {
        const groups = new Map();
        
        // Grouper les éléments
        elements.forEach(element => {
            let groupKey = '';
            switch (this.currentGroupBy) {
                case 'type':
                    groupKey = element.typeName;
                    break;
                case 'brick-type':
                    if (element.type === 'brick' && element.brickType) {
                        groupKey = `Brique ${element.brickType}`;
                    } else if (element.type === 'block' && element.blockType) {
                        groupKey = `Bloc ${element.blockType}`;
                    } else {
                        groupKey = element.typeName;
                    }
                    break;
                case 'material':
                    groupKey = element.materialName;
                    break;
                case 'dimensions':
                    groupKey = element.dimensions.formatted;
                    break;
            }
            
            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey).push(element);
        });

        // Créer les lignes résumées par groupe
        groups.forEach((groupElements, groupName) => {
            const summaryRow = this.createSummaryRow(groupName, groupElements);
            tbody.appendChild(summaryRow);
        });
    }

    createSummaryRow(groupName, elements) {
        const row = document.createElement('tr');
        row.className = 'summary-row';
        
        // Calculer les totaux pour ce groupe
        const quantity = elements.length;
        const totalVolume = elements.reduce((sum, el) => sum + el.volume, 0);
        const totalMass = elements.reduce((sum, el) => sum + el.mass, 0);
        
        // Obtenir les dimensions représentatives (du premier élément)
        const representativeElement = elements[0];
        const dimensions = representativeElement.dimensions.formatted;
        
        // Vérifier si c'est un objet manuel
        const isManualItem = representativeElement.isManual;
        
        if (isManualItem) {
            // Affichage spécialisé pour les objets manuels
            const item = representativeElement;
            const totalPrice = item.price * item.quantity;
            
            row.innerHTML = `
                <td class="group-name"><strong>${item.name}</strong> 
                    <small class="manual-item-category">(${item.typeName})</small>
                </td>
                <td class="quantity-cell">
                    <span class="quantity-badge">${item.quantity}</span>
                    <small>${item.unit}</small>
                </td>
                <td>
                    <div class="material-indicator">
                        <div class="material-color" style="background-color: ${item.materialColor}"></div>
                        <span>${item.materialName}</span>
                    </div>
                </td>
                <td class="dimensions-text">Manuel</td>
                <td class="summary-totals">
                    ${item.price > 0 ? `<div class="manual-price">${totalPrice.toFixed(2)} €</div>` : '<div class="manual-price">Prix non défini</div>'}
                    ${item.notes ? `<div class="manual-notes"><small>${item.notes}</small></div>` : ''}
                </td>
                <td colspan="4" class="summary-actions">
                    <button class="action-btn edit-manual" title="Modifier" data-action="edit-manual" data-id="${item.id}">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="action-btn delete-manual" title="Supprimer" data-action="delete-manual" data-id="${item.id}">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </td>
            `;
        } else {
            // Affichage standard pour les éléments de construction
            // Obtenir le matériau principal (le plus fréquent)
            const materialCounts = new Map();
            elements.forEach(el => {
                const count = materialCounts.get(el.materialName) || 0;
                materialCounts.set(el.materialName, count + 1);
            });
            const mainMaterial = [...materialCounts.entries()].reduce((a, b) => a[1] > b[1] ? a : b)[0];
            const mainMaterialColor = elements.find(el => el.materialName === mainMaterial).materialColor;
            
            row.innerHTML = `
                <td class="group-name"><strong>${groupName}</strong></td>
                <td class="quantity-cell">
                    <span class="quantity-badge">${quantity}</span>
                </td>
                <td>
                    <div class="material-indicator">
                        <div class="material-color" style="background-color: ${mainMaterialColor}"></div>
                        <span>${mainMaterial}</span>
                        ${materialCounts.size > 1 ? `<small>(+${materialCounts.size - 1})</small>` : ''}
                    </div>
                </td>
                <td class="dimensions-text">${dimensions} cm</td>
                <td class="summary-totals">
                    <div class="total-volume">${totalVolume.toFixed(4)} m³</div>
                    <div class="total-mass">${totalMass.toFixed(2)} kg</div>
                </td>
                <td colspan="4" class="summary-actions">
                    <button class="action-btn expand" title="Voir le détail" data-action="expand">
                        <i class="fas fa-eye"></i> Détail (${quantity})
                    </button>
                    <button class="action-btn select-all" title="Sélectionner tous" data-action="select-all">
                        <i class="fas fa-check-square"></i> Tout sélect.
                    </button>
                </td>
            `;
        }

        // Stocker les éléments dans le row pour les actions
        row.setAttribute('data-group-name', groupName);
        row.groupElements = elements;
        
        // Ajouter les événements
        this.setupSummaryRowActions(row, elements);

        return row;
    }

    createTableRow(element) {
        const row = document.createElement('tr');
        row.setAttribute('data-element-id', element.id);
        
        // Affichage enrichi du type avec le type de brique spécifique
        let typeDisplay = element.typeName;
        // Remplacer l'affichage générique pour les poutres par le profil réel
        if (element.type === 'beam' && element.beamType) {
            typeDisplay = `Poutre ${element.beamType}`;
        }
        if (element.type === 'brick' && element.brickType) {
            typeDisplay = `${element.typeName} ${element.brickType}`;
        }
        
        row.innerHTML = `
            <td class="element-id">${element.id.substring(0, 8)}...</td>
            <td>
                <span class="element-type ${element.type}">
                    <i class="fas fa-${this.getTypeIcon(element.type)}"></i>
                    ${typeDisplay}
                </span>
            </td>
            <td>
                <div class="material-indicator">
                    <div class="material-color" style="background-color: ${element.materialColor}"></div>
                    <span>${element.materialName}</span>
                </div>
            </td>
            <td class="dimensions-text">${element.dimensions.formatted} cm</td>
            <td class="position-text">${element.position.formatted} cm</td>
            <td class="numeric-value">${element.volume.toFixed(4)}</td>
            <td class="numeric-value">${element.mass.toFixed(2)}</td>
            <td>
                <div class="row-actions">
                    <button class="action-btn locate" title="Localiser dans la scène" data-action="locate">
                        <i class="fas fa-crosshairs"></i>
                    </button>
                    <button class="action-btn select" title="Sélectionner" data-action="select">
                        <i class="fas fa-mouse-pointer"></i>
                    </button>
                    <button class="action-btn delete" title="Supprimer" data-action="delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        // Ajouter les événements sur les boutons d'action
        this.setupRowActions(row, element);

        return row;
    }

    getTypeIcon(type) {
        const icons = {
            'brick': 'square',
            'block': 'cube',
            'insulation': 'th-large',
            'joint': 'grip-lines',
            'tool': 'tools',
            'material': 'cube',
            'equipment': 'cogs',
            'consumable': 'shopping-cart',
            'safety': 'hard-hat',
            'misc': 'ellipsis-h'
        };
        return icons[type] || 'cube';
    }

    setupRowActions(row, element) {
        const locateBtn = row.querySelector('[data-action="locate"]');
        const selectBtn = row.querySelector('[data-action="select"]');
        const deleteBtn = row.querySelector('[data-action="delete"]');

        if (locateBtn) {
            locateBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.locateElement(element);
            });
        }

        if (selectBtn) {
            selectBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectElement(element);
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteElement(element);
            });
        }

        // Sélection au clic sur la ligne
        row.addEventListener('click', () => {
            this.selectElement(element);
        });
    }

    setupSummaryRowActions(row, elements) {
        const expandBtn = row.querySelector('[data-action="expand"]');
        const selectAllBtn = row.querySelector('[data-action="select-all"]');
        const editManualBtn = row.querySelector('[data-action="edit-manual"]');
        const deleteManualBtn = row.querySelector('[data-action="delete-manual"]');

        if (expandBtn) {
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.expandGroup(row, elements);
            });
        }

        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectAllElements(elements);
            });
        }

        if (editManualBtn) {
            editManualBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemId = editManualBtn.dataset.id;
                this.editManualItem(itemId);
            });
        }

        if (deleteManualBtn) {
            deleteManualBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemId = deleteManualBtn.dataset.id;
                this.deleteManualItem(itemId);
            });
        }
    }

    selectAllElements(elements) {
        console.log('📋 Sélection de tous les éléments du groupe:', elements.length);
        
        if (window.SceneManager && window.SceneManager.selectMultipleElements) {
            const elementIds = elements.map(el => el.id);
            window.SceneManager.selectMultipleElements(elementIds);
        }
    }

    expandGroup(row, elements) {
        console.log('👁️ Expansion du groupe:', elements.length, 'éléments');
        
        // Basculer entre vue résumée et vue détaillée
        const isExpanded = row.classList.contains('expanded');
        
        if (isExpanded) {
            // Réduire - enlever les lignes de détail
            let nextRow = row.nextElementSibling;
            while (nextRow && nextRow.classList.contains('detail-row')) {
                const toRemove = nextRow;
                nextRow = nextRow.nextElementSibling;
                toRemove.remove();
            }
            row.classList.remove('expanded');
            
            // Changer l'icône du bouton
            const expandBtn = row.querySelector('[data-action="expand"] i');
            if (expandBtn) {
                expandBtn.className = 'fas fa-eye';
            }
        } else {
            // Étendre - ajouter les lignes de détail
            elements.forEach((element, index) => {
                const detailRow = this.createTableRow(element);
                detailRow.classList.add('detail-row');
                row.parentNode.insertBefore(detailRow, row.nextSibling);
            });
            row.classList.add('expanded');
            
            // Changer l'icône du bouton
            const expandBtn = row.querySelector('[data-action="expand"] i');
            if (expandBtn) {
                expandBtn.className = 'fas fa-eye-slash';
            }
        }
    }

    locateElement(element) {
        console.log('🎯 Localisation de l\'élément:', element.id);
        
        // Centrer la caméra sur l'élément
        if (window.CameraControls && element.element && element.element.mesh) {
            const position = element.element.mesh.position;
            window.CameraControls.focusOnPoint(position.x, position.y, position.z);
        }

        // Faire clignoter l'élément
        this.highlightElement(element.element);
    }

    selectElement(element) {
        console.log('👆 Sélection de l\'élément:', element.id);
        
        if (window.SceneManager && element.element) {
            window.SceneManager.selectElement(element.element);
        }
    }

    deleteElement(element) {
        console.log('🗑️ Suppression de l\'élément:', element.id);
        
        if (element.isManual) {
            // Suppression d'un objet manuel
            const confirmMessage = `Êtes-vous sûr de vouloir supprimer cet objet manuel ?\n\nNom: ${element.name}\nQuantité: ${element.quantity} ${element.unit}`;
            if (confirm(confirmMessage)) {
                this.manualItems.delete(element.id);
                this.updateSummary();
                this.refreshTable();
                this.showNotification(`🗑️ "${element.name}" supprimé du métré`, 'info');
            }
        } else {
            // Suppression d'un élément de la scène
            if (confirm(`Êtes-vous sûr de vouloir supprimer cet élément ?\n\nType: ${element.typeName}\nID: ${element.id}`)) {
                if (window.SceneManager) {
                    window.SceneManager.removeElement(element.id);
                    this.refreshData(); // Actualiser le tableau
                }
            }
        }
    }

    highlightElement(element) {
        if (!element || !element.mesh) return;

        const originalEmissive = element.mesh.material.emissive.clone();
        const highlightColor = 0x00ff00; // Vert
        
        // Animation de clignotement
        let isHighlighted = false;
        const blinkCount = 6;
        let currentBlink = 0;

        const blink = () => {
            if (currentBlink >= blinkCount) {
                element.mesh.material.emissive.copy(originalEmissive);
                return;
            }

            element.mesh.material.emissive.setHex(isHighlighted ? originalEmissive.getHex() : highlightColor);
            isHighlighted = !isHighlighted;
            currentBlink++;
            
            setTimeout(blink, 300);
        };

        blink();
    }

    sortTable(column) {
        if (this.currentSort.column === column) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.column = column;
            this.currentSort.direction = 'asc';
        }

        // Mettre à jour les indicateurs visuels
        this.updateSortIndicators(column, this.currentSort.direction);

        // Actualiser le tableau
        this.refreshTable();
    }

    updateSortIndicators(activeColumn, direction) {
        const headers = document.querySelectorAll('.metre-table th.sortable');
        headers.forEach(header => {
            const column = header.getAttribute('data-sort');
            header.classList.remove('sorted-asc', 'sorted-desc');
            
            if (column === activeColumn) {
                header.classList.add(`sorted-${direction}`);
            }
        });
    }

    showEmptyState(tbody) {
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="9" class="text-center">
                    <div class="empty-message">
                        <i class="fas fa-inbox"></i>
                        <p>Aucun élément trouvé</p>
                        <small>Aucun élément ne correspond aux critères de filtrage actuels</small>
                    </div>
                </td>
            </tr>
        `;
    }

    exportData() {
        console.log('📤 Export des données du métré');
        
        // Filtrer les éléments non-joints pour l'export
        const nonJointElements = Array.from(this.elements.values()).filter(element => 
            element.type !== 'joint'
        );
        
        const data = {
            timestamp: new Date().toISOString(),
            summary: {
                totalElements: nonJointElements.length,
                totalVolume: nonJointElements.reduce((sum, el) => sum + el.volume, 0),
                totalMass: nonJointElements.reduce((sum, el) => sum + el.mass, 0)
            },
            elements: nonJointElements.map(el => ({
                id: el.id,
                type: el.typeName,
                material: el.materialName,
                dimensions: el.dimensions.formatted,
                position: el.position.formatted,
                volume: el.volume,
                mass: el.mass
            }))
        };

        // Export en JSON
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `metre_elements_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('✅ Export terminé');
    }

    // ==========================================
    // GESTION DES OBJETS MANUELS
    // ==========================================

    showManualItemModal() {
        // Vérifier que l'onglet métré est actif avant d'ouvrir la modale
        if (!this.isTabActive()) {
            // console.log('🛠️ Modale ajout objet refusée - onglet métré non actif');
            return;
        }
        
        // console.log('🛠️ Ouverture de la modale d\'ajout d\'objet manuel');
        
        const modal = document.getElementById('manualItemModal');
        if (!modal) {
            console.error('❌ Modale manualItemModal non trouvée');
            return;
        }

        // Réinitialiser le formulaire
        this.resetManualItemForm();
        
        // Configurer les événements une seule fois
        if (!modal._eventsConfigured) {
            this.setupManualItemModalEvents();
            modal._eventsConfigured = true;
        }
        
        // Afficher la modale
        modal.style.display = 'flex';
        
        // Focus sur le champ nom
        const nameInput = document.getElementById('manualItemName');
        if (nameInput) {
            setTimeout(() => nameInput.focus(), 100);
        }
    }

    setupManualItemModalEvents() {
        const modal = document.getElementById('manualItemModal');
        
        // Éviter d'attacher les événements plusieurs fois
        if (modal._eventsAttached) {
            return;
        }
        
        const closeBtn = document.getElementById('closeManualItem');
        const cancelBtn = document.getElementById('cancelManualItem');
        const confirmBtn = document.getElementById('confirmManualItem');
        
        // Fonction de fermeture simple
        const closeModal = () => {
            modal.style.display = 'none';
        };
        
        // Protection : fermer la modale si l'onglet métré n'est pas actif
        const checkTabActive = () => {
            if (modal.style.display === 'flex' && !this.isTabActive()) {
                closeModal();
            }
        };
        
        // Vérifier périodiquement si l'onglet est toujours actif
        const tabChecker = setInterval(checkTabActive, 500);
        modal._tabChecker = tabChecker;
        
        // Événements de fermeture
        if (closeBtn) {
            closeBtn.onclick = () => {
                closeModal();
                if (modal._tabChecker) {
                    clearInterval(modal._tabChecker);
                }
            };
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                closeModal();
                if (modal._tabChecker) {
                    clearInterval(modal._tabChecker);
                }
            };
        }
        
        // Fermeture par clic sur l'overlay
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal();
                if (modal._tabChecker) {
                    clearInterval(modal._tabChecker);
                }
            }
        };
        
        // Fermeture par Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                closeModal();
                if (modal._tabChecker) {
                    clearInterval(modal._tabChecker);
                }
            }
        });
        
        // Bouton de confirmation
        if (confirmBtn) {
            confirmBtn.onclick = () => this.addManualItem();
        }
        
        // Marquer que les événements ont été attachés
        modal._eventsAttached = true;
    }

    resetManualItemForm() {
        const inputs = [
            'manualItemName',
            'manualItemQuantity', 
            'manualItemPrice',
            'manualItemNotes'
        ];
        
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.value = id === 'manualItemQuantity' ? '1' : '';
            }
        });
        
        // Réinitialiser les select
        const categorySelect = document.getElementById('manualItemCategory');
        const unitSelect = document.getElementById('manualItemUnit');
        
        if (categorySelect) categorySelect.value = 'tool';
        if (unitSelect) unitSelect.value = 'unité';
    }

    addManualItem() {
        const modal = document.getElementById('manualItemModal');
        const editingId = modal?.dataset?.editingId;
        const isEditing = editingId && editingId !== '';
        
        // Récupérer les valeurs du formulaire
        const name = document.getElementById('manualItemName')?.value?.trim();
        const category = document.getElementById('manualItemCategory')?.value || 'tool';
        const quantity = parseInt(document.getElementById('manualItemQuantity')?.value) || 1;
        const unit = document.getElementById('manualItemUnit')?.value || 'unité';
        const price = parseFloat(document.getElementById('manualItemPrice')?.value) || 0;
        const notes = document.getElementById('manualItemNotes')?.value?.trim() || '';
        
        // Validation
        if (!name) {
            alert('Veuillez saisir un nom pour l\'objet/outil.');
            return;
        }
        
        if (quantity <= 0) {
            alert('La quantité doit être supérieure à 0.');
            return;
        }

        let manualItem;

        if (isEditing) {
            // Mode édition - mettre à jour l'objet existant
            manualItem = this.manualItems.get(editingId);
            if (!manualItem) {
                console.error('Objet à éditer non trouvé:', editingId);
                return;
            }

            // Mettre à jour les propriétés
            manualItem.name = name;
            manualItem.category = category;
            manualItem.typeName = this.getCategoryDisplayName(category);
            manualItem.quantity = quantity;
            manualItem.unit = unit;
            manualItem.price = price;
            manualItem.notes = notes;
            manualItem.materialColor = this.getCategoryColor(category);
            manualItem.mass = price > 0 ? 1 : 0.1;

            this.showNotification(`✅ "${name}" modifié dans le métré`, 'success');
        } else {
            // Mode ajout - créer un nouvel objet
            manualItem = {
                id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'tool', // Type générique pour le filtrage
                typeName: this.getCategoryDisplayName(category),
                name: name,
                category: category,
                quantity: quantity,
                unit: unit,
                price: price,
                notes: notes,
                isManual: true,
                addedAt: new Date().toISOString(),
                
                // Propriétés pour la compatibilité avec le système existant
                material: 'N/A',
                materialName: 'Objet Manuel',
                materialColor: this.getCategoryColor(category),
                dimensions: {
                    length: 0,
                    width: 0,
                    height: 0,
                    formatted: 'N/A'
                },
                position: {
                    x: 0,
                    y: 0,
                    z: 0,
                    formatted: 'Hors scène'
                },
                volume: 1, // Volume par défaut de 1 pour les objets manuels
                mass: price > 0 ? 1 : 0.1, // Masse basée sur le prix ou valeur par défaut
                element: null // Pas d'élément 3D associé
            };
            
            // Ajouter à la collection
            this.manualItems.set(manualItem.id, manualItem);
            this.showNotification(`✅ "${name}" ajouté au métré`, 'success');
        }
        
        // Nettoyer la modale
        modal.style.display = 'none';
        delete modal.dataset.editingId;
        
        // Nettoyer l'event listener de redimensionnement
        if (modal._resizeHandler) {
            window.removeEventListener('resize', modal._resizeHandler);
            modal._resizeHandler = null;
        }
        
        // Remettre le titre et bouton par défaut
        const title = modal.querySelector('h5');
        const submitBtn = modal.querySelector('.btn-primary');
        if (title) title.textContent = 'Ajouter un objet/outil';
        if (submitBtn) submitBtn.textContent = 'Ajouter';
        
        // Actualiser l'affichage
        this.updateSummary();
        this.refreshTable();
    }

    editManualItem(itemId) {
        const item = this.manualItems.get(itemId);
        if (!item) {
            console.error('Objet manuel non trouvé:', itemId);
            return;
        }

        // Pré-remplir la modale avec les données existantes
        document.getElementById('manualItemName').value = item.name;
        document.getElementById('manualItemCategory').value = item.category;
        document.getElementById('manualItemQuantity').value = item.quantity;
        document.getElementById('manualItemUnit').value = item.unit;
        document.getElementById('manualItemPrice').value = item.price;
        document.getElementById('manualItemNotes').value = item.notes;

        // Marquer comme édition
        const modal = document.getElementById('manualItemModal');
        modal.dataset.editingId = itemId;
        modal.style.display = 'block';

        // Changer le titre et le bouton
        const title = modal.querySelector('h5');
        const submitBtn = modal.querySelector('.btn-primary');
        if (title) title.textContent = 'Modifier un objet/outil';
        if (submitBtn) submitBtn.textContent = 'Modifier';

        this.showNotification(`✏️ Édition de "${item.name}"`, 'info');
    }

    deleteManualItem(itemId) {
        const item = this.manualItems.get(itemId);
        if (!item) {
            console.error('Objet manuel non trouvé:', itemId);
            return;
        }

        if (confirm(`Êtes-vous sûr de vouloir supprimer "${item.name}" ?`)) {
            this.manualItems.delete(itemId);
            this.updateSummary();
            this.refreshTable();
            this.showNotification(`🗑️ "${item.name}" supprimé du métré`, 'success');
        }
    }

    getCategoryDisplayName(category) {
        const names = {
            tool: 'Outil',
            material: 'Matériau',
            equipment: 'Équipement',
            consumable: 'Consommable',
            safety: 'Sécurité',
            misc: 'Divers'
        };
        return names[category] || 'Objet';
    }

    getCategoryColor(category) {
        const colors = {
            tool: '#10b981',      // Vert
            material: '#3b82f6',  // Bleu
            equipment: '#f59e0b', // Orange
            consumable: '#ef4444', // Rouge
            safety: '#8b5cf6',    // Violet
            misc: '#64748b'       // Gris ardoise
        };
        return colors[category] || '#6b7280';
    }

    showNotification(message, type = 'info') {
        // Créer ou récupérer le conteneur de notifications
        let notificationContainer = document.getElementById('notificationContainer');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notificationContainer';
            notificationContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            `;
            document.body.appendChild(notificationContainer);
        }
        
        // Créer la notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            background: ${type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            pointer-events: auto;
            font-size: 14px;
        `;
        notification.textContent = message;
        
        notificationContainer.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Suppression automatique
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Modifier la fonction de création de ligne pour les objets manuels
    createTableRow(element) {
        const row = document.createElement('tr');
        row.setAttribute('data-element-id', element.id);
        
        // Affichage enrichi du type avec le type de brique spécifique
        let typeDisplay = element.typeName;
        if (element.type === 'brick' && element.brickType) {
            typeDisplay = `${element.typeName} ${element.brickType}`;
        }
        
        // Badge spécial pour les objets manuels
        const manualBadge = element.isManual ? '<span class="manual-item-badge">Manuel</span>' : '';
        
        // Affichage spécial pour les objets manuels
        const displayName = element.isManual ? element.name : typeDisplay;
        const quantityDisplay = element.isManual ? `${element.quantity} ${element.unit}` : '1';
        
        row.innerHTML = `
            <td class="element-id">${element.id.substring(0, 8)}...</td>
            <td>
                <span class="element-type ${element.type}">
                    <i class="fas fa-${this.getTypeIcon(element.type)}"></i>
                    ${displayName}${manualBadge}
                </span>
            </td>
            <td>
                <div class="material-indicator">
                    <div class="material-color" style="background-color: ${element.materialColor}"></div>
                    <span>${element.materialName}</span>
                </div>
            </td>
            <td class="dimensions-text">${element.dimensions.formatted}</td>
            <td class="position-text">${element.position.formatted}</td>
            <td class="numeric-value">${element.volume.toFixed(4)}</td>
            <td class="numeric-value">${element.mass.toFixed(2)}</td>
            <td class="quantity-display">${quantityDisplay}</td>
            <td>
                <div class="row-actions">
                    ${!element.isManual ? `
                        <button class="action-btn locate" title="Localiser dans la scène" data-action="locate">
                            <i class="fas fa-crosshairs"></i>
                        </button>
                        <button class="action-btn select" title="Sélectionner" data-action="select">
                            <i class="fas fa-mouse-pointer"></i>
                        </button>
                    ` : ''}
                    <button class="action-btn delete" title="Supprimer" data-action="delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        // Ajouter les événements sur les boutons d'action
        this.setupRowActions(row, element);

        return row;
    }
}

// Initialiser le gestionnaire quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    window.metreTabManager = new MetreTabManager();
});

// Rendre disponible globalement
if (typeof window !== 'undefined') {
    window.MetreTabManager = MetreTabManager;
}
