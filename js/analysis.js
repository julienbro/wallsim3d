// Système d'analyse et de calculs pour les murs construits
class WallAnalysis {
    constructor() {
        this.analysisData = {
            totalSurface: 0,      // m²
            totalVolume: 0,       // m³
            elementCount: 0,
            maxHeight: 0,         // cm
            materialBreakdown: {},
            totalMass: 0,         // kg
            totalCost: 0,         // €
            thermalResistance: 0  // m²·K/W
        };
        
        this.setupEventListeners();
        this.updateAnalysis();
    }

    setupEventListeners() {
        // Écouter les changements dans la scène
        document.addEventListener('elementPlaced', () => {
            this.updateAnalysis();
        });

        document.addEventListener('elementRemoved', () => {
            this.updateAnalysis();
        });

        document.addEventListener('sceneCleared', () => {
            this.updateAnalysis();
        });

        // Bouton d'analyse détaillée
        const detailBtn = document.createElement('button');
        detailBtn.textContent = 'Analyse Détaillée';
        detailBtn.className = 'btn btn-primary';
        detailBtn.style.marginTop = '10px';
        detailBtn.addEventListener('click', () => {
            this.showDetailedAnalysis();
        });
        
        const analysisSection = document.querySelector('.analysis-section');
        if (analysisSection) {
            analysisSection.appendChild(detailBtn);
        }
    }

    updateAnalysis() {
        // Vérifier que SceneManager est disponible
        if (!window.SceneManager || typeof window.SceneManager.getAllElements !== 'function') {
            console.warn('⚠️ WallAnalysis: SceneManager non disponible pour l\'analyse');
            return;
        }
        
        const elements = window.SceneManager.getAllElements();
        
        // Réinitialiser les données
        this.analysisData = {
            totalSurface: 0,
            totalVolume: 0,
            elementCount: elements.length,
            maxHeight: 0,
            materialBreakdown: {},
            totalMass: 0,
            totalCost: 0,
            thermalResistance: 0
        };

        // Analyser chaque élément
        elements.forEach(element => {
            this.analyzeElement(element);
        });

        // Calculer les propriétés thermiques
        this.calculateThermalProperties();

        // Mettre à jour l'affichage
        this.updateDisplay();
    }

    analyzeElement(element) {
        // Vérifier si c'est un élément GLB qui n'a pas les méthodes d'analyse
        if (!element.getVolume || typeof element.getVolume !== 'function' ||
            !element.getSurfaceArea || typeof element.getSurfaceArea !== 'function' ||
            !element.getMass || typeof element.getMass !== 'function' ||
            !element.getCost || typeof element.getCost !== 'function') {
            return;
        }
        
        const volume = element.getVolume();
        const surface = element.getSurfaceArea();
        const mass = element.getMass();
        const cost = element.getCost();
        const material = element.material;
        const topHeight = element.position.y + element.dimensions.height;

        // Accumuler les totaux
        this.analysisData.totalVolume += volume;
        this.analysisData.totalSurface += surface;
        this.analysisData.totalMass += mass;
        this.analysisData.totalCost += cost;
        this.analysisData.maxHeight = Math.max(this.analysisData.maxHeight, topHeight);

        // Répartition par matériau
        if (!this.analysisData.materialBreakdown[material]) {
            this.analysisData.materialBreakdown[material] = {
                count: 0,
                volume: 0,
                surface: 0,
                mass: 0,
                cost: 0,
                name: window.MaterialLibrary.getMaterial(material).name
            };
        }

        const breakdown = this.analysisData.materialBreakdown[material];
        breakdown.count++;
        breakdown.volume += volume;
        breakdown.surface += surface;
        breakdown.mass += mass;
        breakdown.cost += cost;
    }

    calculateThermalProperties() {
        // Calcul simplifié de la résistance thermique moyenne
        let totalThickness = 0;
        let weightedResistance = 0;

        Object.keys(this.analysisData.materialBreakdown).forEach(materialId => {
            const materialData = window.MaterialLibrary.getMaterial(materialId);
            const breakdown = this.analysisData.materialBreakdown[materialId];
            
            // Épaisseur moyenne des éléments de ce matériau
            const avgThickness = breakdown.volume / breakdown.surface; // m
            const resistance = avgThickness / materialData.thermalConductivity;
            
            weightedResistance += resistance * breakdown.surface;
            totalThickness += breakdown.surface;
        });

        if (totalThickness > 0) {
            this.analysisData.thermalResistance = weightedResistance / totalThickness;
        }
    }

    updateDisplay() {
        // Mettre à jour les statistiques principales avec vérification de l'existence des éléments
        const totalSurfaceEl = document.getElementById('totalSurface');
        if (totalSurfaceEl) {
            totalSurfaceEl.textContent = this.analysisData.totalSurface.toFixed(2) + ' m²';
        }
        
        const totalVolumeEl = document.getElementById('totalVolume');
        if (totalVolumeEl) {
            totalVolumeEl.textContent = this.analysisData.totalVolume.toFixed(3) + ' m³';
        }
        
        const elementCountEl = document.getElementById('elementCount');
        if (elementCountEl) {
            elementCountEl.textContent = this.analysisData.elementCount;
        }
        
        // Alternative: essayer l'élément existant 'elementsCount'
        const elementsCountEl = document.getElementById('elementsCount');
        if (elementsCountEl) {
            elementsCountEl.textContent = this.analysisData.elementCount;
        }
        
        const maxHeightEl = document.getElementById('maxHeight');
        if (maxHeightEl) {
            maxHeightEl.textContent = this.analysisData.maxHeight.toFixed(0) + ' cm';
        }

        // Mettre à jour la répartition des matériaux
        this.updateMaterialBreakdown();
    }

    updateMaterialBreakdown() {
        const container = document.getElementById('materialStats');
        if (!container) {
            // L'élément materialStats n'existe pas dans le HTML, ignorer silencieusement
            return;
        }
        
        container.innerHTML = '';

        Object.keys(this.analysisData.materialBreakdown).forEach(materialId => {
            const breakdown = this.analysisData.materialBreakdown[materialId];
            
            const statDiv = document.createElement('div');
            statDiv.className = 'material-stat';
            
            const percentage = (breakdown.volume / this.analysisData.totalVolume * 100).toFixed(1);
            
            statDiv.innerHTML = `
                <span class="material-name">${breakdown.name}</span>
                <span class="material-count">${breakdown.count} (${percentage}%)</span>
            `;
            
            container.appendChild(statDiv);
        });
        
        // Ajouter le détail des orientations de briques
        this.updateBrickOrientationBreakdown();
    }

    updateBrickOrientationBreakdown() {
        const container = document.getElementById('materialStats');
        if (!container) {
            // L'élément materialStats n'existe pas dans le DOM, ignorer silencieusement
            return;
        }
        
        const elements = window.SceneManager.getAllElements();
        
        // Compter les orientations de briques par face spécifique
        const orientationCount = {
            'panneresse-frontale': 0,
            'panneresse-dorsale': 0,
            'boutisse-droite': 0,
            'boutisse-gauche': 0,
            'plat-inferieur': 0,
            'plat-superieur': 0
        };
        
        elements.forEach(element => {
            if (element.type === 'brick') {
                const orientation = element.getSpecificFace();
                if (orientationCount.hasOwnProperty(orientation)) {
                    orientationCount[orientation]++;
                }
            }
        });
        
        // Afficher les orientations si il y a des briques
        const totalBricks = Object.values(orientationCount).reduce((a, b) => a + b, 0);
        if (totalBricks > 0) {
            const orientationDiv = document.createElement('div');
            orientationDiv.className = 'orientation-breakdown';
            orientationDiv.innerHTML = `
                <h5 style="color: #c0c0c0; margin: 15px 0 10px 0; font-size: 13px;">Orientations des briques</h5>
            `;
            
            Object.keys(orientationCount).forEach(orientation => {
                if (orientationCount[orientation] > 0) {
                    const percentage = (orientationCount[orientation] / totalBricks * 100).toFixed(1);
                    const orientationDiv2 = document.createElement('div');
                    orientationDiv2.className = 'orientation-stat';
                    orientationDiv2.style.cssText = `
                        display: flex;
                        justify-content: space-between;
                        padding: 3px 8px;
                        background: rgba(255, 152, 0, 0.2);
                        border-radius: 4px;
                        font-size: 12px;
                        color: #e0e0e0;
                        margin-bottom: 3px;
                    `;
                    
                    const labels = {
                        'panneresse-frontale': 'Panneresse frontale (19×5)',
                        'panneresse-dorsale': 'Panneresse dorsale (19×5)',
                        'boutisse-droite': 'Boutisse droite (9×5)',
                        'boutisse-gauche': 'Boutisse gauche (9×5)',
                        'plat-inferieur': 'Plat inférieur (19×9)',
                        'plat-superieur': 'Plat supérieur (19×9)'
                    };
                    
                    orientationDiv2.innerHTML = `
                        <span>${labels[orientation]}</span>
                        <span>${orientationCount[orientation]} (${percentage}%)</span>
                    `;
                    
                    orientationDiv.appendChild(orientationDiv2);
                }
            });
            
            container.appendChild(orientationDiv);
        }
    }

    showDetailedAnalysis() {
        const modal = this.createAnalysisModal();
        document.body.appendChild(modal);
        
        // Afficher le modal
        modal.style.display = 'flex';
        
        // Fermer au clic sur le fond
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    createAnalysisModal() {
        const modal = document.createElement('div');
        modal.className = 'analysis-modal';
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
            z-index: 1000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;

        content.innerHTML = this.generateDetailedReport();
        
        // Bouton de fermeture
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

        content.appendChild(closeBtn);
        modal.appendChild(content);
        
        return modal;
    }

    generateDetailedReport() {
        const data = this.analysisData;
        
        // Calculer les statistiques d'orientation des briques
        const orientationStats = this.calculateBrickOrientationStats();
        
        return `
            <div style="position: relative;">
                <h2 style="color: #333; margin-bottom: 20px;">Analyse Détaillée du Mur</h2>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div class="analysis-card">
                        <h3>Dimensions Générales</h3>
                        <p><strong>Surface totale:</strong> ${data.totalSurface.toFixed(2)} m²</p>
                        <p><strong>Volume total:</strong> ${data.totalVolume.toFixed(3)} m³</p>
                        <p><strong>Hauteur maximum:</strong> ${data.maxHeight.toFixed(0)} cm</p>
                        <p><strong>Nombre d'éléments:</strong> ${data.elementCount}</p>
                    </div>
                    
                    <div class="analysis-card">
                        <h3>Propriétés Physiques</h3>
                        <p><strong>Masse totale:</strong> ${data.totalMass.toFixed(1)} kg</p>
                        <p><strong>Coût estimé:</strong> ${data.totalCost.toFixed(2)} €</p>
                        <p><strong>Résistance thermique:</strong> ${data.thermalResistance.toFixed(3)} m²·K/W</p>
                        <p><strong>Densité moyenne:</strong> ${(data.totalMass / data.totalVolume).toFixed(1)} kg/m³</p>
                    </div>
                </div>
                
                ${orientationStats.totalBricks > 0 ? `
                <div style="margin-bottom: 20px;">
                    <h3>Orientations des Briques</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                        <div class="orientation-card">
                            <h4>Panneresse (19×5)</h4>
                            <p><strong>${orientationStats.panneresse}</strong> briques</p>
                            <p>(${orientationStats.panneressePercent}%)</p>
                        </div>
                        <div class="orientation-card">
                            <h4>Boutisse (9×5)</h4>
                            <p><strong>${orientationStats.boutisse}</strong> briques</p>
                            <p>(${orientationStats.boutissePercent}%)</p>
                        </div>
                        <div class="orientation-card">
                            <h4>Plat (19×9)</h4>
                            <p><strong>${orientationStats.plat}</strong> briques</p>
                            <p>(${orientationStats.platPercent}%)</p>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <div class="material-analysis">
                    <h3>Analyse par Matériau</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <thead>
                            <tr style="background: #f5f5f5;">
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Matériau</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Quantité</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Volume (m³)</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Surface (m²)</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Masse (kg)</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Coût (€)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.generateMaterialTable()}
                        </tbody>
                    </table>
                </div>
                
                <div class="recommendations">
                    <h3>Recommandations</h3>
                    ${this.generateRecommendations()}
                </div>
                
                <div class="export-buttons" style="margin-top: 20px; display: flex; gap: 10px;">
                    <button onclick="window.WallAnalysis.exportToCSV()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Exporter CSV
                    </button>
                    <button onclick="window.WallAnalysis.exportToPDF()" style="padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Exporter PDF
                    </button>
                </div>
            </div>
        `;
    }

    calculateBrickOrientationStats() {
        const elements = window.SceneManager.getAllElements();
        const orientationCount = {
            'panneresse-frontale': 0,
            'panneresse-dorsale': 0,
            'boutisse-droite': 0,
            'boutisse-gauche': 0,
            'plat-inferieur': 0,
            'plat-superieur': 0
        };
        
        elements.forEach(element => {
            if (element.type === 'brick') {
                const orientation = element.getSpecificFace();
                if (orientationCount.hasOwnProperty(orientation)) {
                    orientationCount[orientation]++;
                }
            }
        });
        
        const totalBricks = Object.values(orientationCount).reduce((a, b) => a + b, 0);
        
        return {
            totalBricks: totalBricks,
            panneresseFrontale: orientationCount['panneresse-frontale'],
            panneresseDorsale: orientationCount['panneresse-dorsale'],
            boutisseDroite: orientationCount['boutisse-droite'],
            boutisseGauche: orientationCount['boutisse-gauche'],
            platInferieur: orientationCount['plat-inferieur'],
            platSuperieur: orientationCount['plat-superieur'],
            // Totaux par type
            panneresse: orientationCount['panneresse-frontale'] + orientationCount['panneresse-dorsale'],
            boutisse: orientationCount['boutisse-droite'] + orientationCount['boutisse-gauche'],
            plat: orientationCount['plat-inferieur'] + orientationCount['plat-superieur'],
            // Pourcentages
            panneressePercent: totalBricks > 0 ? ((orientationCount['panneresse-frontale'] + orientationCount['panneresse-dorsale']) / totalBricks * 100).toFixed(1) : 0,
            boutissePercent: totalBricks > 0 ? ((orientationCount['boutisse-droite'] + orientationCount['boutisse-gauche']) / totalBricks * 100).toFixed(1) : 0,
            platPercent: totalBricks > 0 ? ((orientationCount['plat-inferieur'] + orientationCount['plat-superieur']) / totalBricks * 100).toFixed(1) : 0
        };
    }
}

// Instance globale
window.WallAnalysis = new WallAnalysis();
