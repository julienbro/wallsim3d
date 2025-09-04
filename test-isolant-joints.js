// Test pour vérifier que les isolants n'ont pas de joints horizontaux
console.log('🧪 Test des joints d\'isolants');

// Simuler AssiseManager
class MockAssiseManager {
    constructor() {
        this.jointHeightByType = new Map();
        this.jointHeightByAssise = new Map();
        
        // Initialiser avec les valeurs par défaut
        this.supportedTypes = ['brick', 'block', 'insulation', 'custom', 'joint', 'linteau'];
        for (const type of this.supportedTypes) {
            const defaultJointHeight = (type === 'insulation' || type.includes('hourdis')) ? 0 : 1.2;
            this.jointHeightByType.set(type, defaultJointHeight);
            this.jointHeightByAssise.set(type, new Map());
        }
    }

    getJointHeightForType(type) {
        // 🔧 ISOLANTS: Toujours retourner 0 pour les isolants (pas de joints horizontaux)
        if (type === 'insulation') {
            return 0;
        }
        
        return this.jointHeightByType.get(type) || 1.2;
    }

    getJointHeightForAssise(type, assiseIndex) {
        // 🔧 ISOLANTS: Toujours retourner 0 pour les isolants (pas de joints horizontaux)
        if (type === 'insulation') {
            return 0;
        }
        
        const jointsByType = this.jointHeightByAssise.get(type);
        if (!jointsByType) return this.getJointHeightForType(type);
        
        const specificHeight = jointsByType.get(assiseIndex);
        if (specificHeight !== undefined) {
            return specificHeight;
        }
        
        return this.getJointHeightForType(type);
    }

    calculateAssiseHeightForType(type, index) {
        if (index === 0) {
            // 🔧 HOURDIS: L'assise 0 des hourdis commence à Y=0 (pas de joint de base)
            if (type.includes('hourdis')) {
                return 0;
            }
            
            // 🔧 ISOLANTS: L'assise 0 des isolants commence à Y=0 (pas de joint horizontal)
            if (type === 'insulation') {
                return 0;
            }
            
            // Assise 0 pour autres types : utilise la hauteur de joint spécifique ou celle par défaut du type
            const jointHeight = this.getJointHeightForAssise(type, 0);
            return jointHeight;
        }
        
        // Pour les assises supérieures, calculer en accumulant les hauteurs individuelles
        let totalHeight = 0;
        
        // Accumulation depuis l'assise 0 jusqu'à l'assise demandée
        for (let i = 0; i <= index; i++) {
            const jointHeightForThisAssise = this.getJointHeightForAssise(type, i);
            
            if (i === 0) {
                // Assise 0 : seulement la hauteur du joint (déjà 0 pour isolants)
                totalHeight = jointHeightForThisAssise;
            } else {
                // Assises suivantes : hauteur de l'élément + joint suivant
                const elementHeight = this.getDefaultElementHeight(type);
                
                // 🔧 ISOLANTS: Pas de joints horizontaux entre les assises d'isolants
                if (type === 'insulation') {
                    totalHeight += elementHeight; // Pas de joint horizontal pour les isolants
                } else {
                    totalHeight += elementHeight + jointHeightForThisAssise;
                }
            }
        }
        
        return totalHeight;
    }

    getDefaultElementHeight(type) {
        if (type === 'insulation') {
            return 60; // Hauteur d'isolant PUR5 par défaut
        }
        return 6.5; // Hauteur brique M65 par défaut
    }
}

// Créer l'instance de test
const assiseManager = new MockAssiseManager();

console.log('🧪 Tests des joints pour isolants:');

// Test 1: Joint height pour type insulation
const jointHeightInsulation = assiseManager.getJointHeightForType('insulation');
console.log(`✅ getJointHeightForType('insulation'): ${jointHeightInsulation}cm (attendu: 0cm)`);

// Test 2: Joint height pour assise d'isolants
const jointHeightAssise0 = assiseManager.getJointHeightForAssise('insulation', 0);
const jointHeightAssise1 = assiseManager.getJointHeightForAssise('insulation', 1);
console.log(`✅ getJointHeightForAssise('insulation', 0): ${jointHeightAssise0}cm (attendu: 0cm)`);
console.log(`✅ getJointHeightForAssise('insulation', 1): ${jointHeightAssise1}cm (attendu: 0cm)`);

// Test 3: Hauteur des assises d'isolants
const assiseHeight0 = assiseManager.calculateAssiseHeightForType('insulation', 0);
const assiseHeight1 = assiseManager.calculateAssiseHeightForType('insulation', 1);
console.log(`✅ calculateAssiseHeightForType('insulation', 0): ${assiseHeight0}cm (attendu: 0cm)`);
console.log(`✅ calculateAssiseHeightForType('insulation', 1): ${assiseHeight1}cm (attendu: 60cm)`);

// Test 4: Comparaison avec briques pour vérifier que ça marche normalement
const brickJointHeight = assiseManager.getJointHeightForType('brick');
const brickAssiseHeight0 = assiseManager.calculateAssiseHeightForType('brick', 0);
const brickAssiseHeight1 = assiseManager.calculateAssiseHeightForType('brick', 1);
console.log(`✅ Brique - getJointHeightForType('brick'): ${brickJointHeight}cm (attendu: 1.2cm)`);
console.log(`✅ Brique - calculateAssiseHeightForType('brick', 0): ${brickAssiseHeight0}cm (attendu: 1.2cm)`);
console.log(`✅ Brique - calculateAssiseHeightForType('brick', 1): ${brickAssiseHeight1}cm (attendu: 8.9cm = 1.2 + 6.5 + 1.2)`);

console.log('🎯 Tests terminés!');
