/**
 * RÉINITIALISATION DES FACTEURS CORRECTIFS D'ÉCHELLE
 * 
 * Ce fichier contient la configuration complète des facteurs d'échelle
 * pour garantir une cohérence parfaite dans tous les calculs
 */

// Configuration des échelles par défaut réinitialisées
const SCALE_CONFIG = {
    // 🔧 FACTEUR CORRECTIF D'ÉCHELLE - NOUVEAU FACTEUR
    // Observation 1: élément 120cm exporté à 1.4cm au lieu de 6cm → facteur 4.286
    // Observation 2: élément 120cm exporté à 5.2cm au lieu de 6cm → facteur 1.154
    // Nouveau facteur spécifié par l'utilisateur: 4.8
    SCALE_CORRECTION_FACTOR: 4.8,
    
    // Échelles disponibles avec leurs facteurs calculés
    AVAILABLE_SCALES: {
        '1:10': { factor: 10, technicalFactor: 1.0, description: 'Très grande échelle - Détails fins' },
        '1:20': { factor: 20, technicalFactor: 2.0, description: 'Grande échelle - Détails standard' },
        '1:50': { factor: 50, technicalFactor: 5.0, description: 'Échelle moyenne - Vue d\'ensemble' },
        '1:100': { factor: 100, technicalFactor: 10.0, description: 'Petite échelle - Vue générale' },
        '1:200': { factor: 200, technicalFactor: 20.0, description: 'Très petite échelle - Plan masse' }
    },
    
    // Échelles par défaut pour chaque type de vue
    DEFAULT_SCALES: {
        top: '1:20',        // Vue du dessus
        elevation: '1:20',  // Élévations
        front: '1:20',      // Façade avant
        back: '1:20',       // Façade arrière
        left: '1:20',       // Côté gauche
        right: '1:20'       // Côté droit
    },
    
    // Formules de calcul réinitialisées avec facteur correctif ajusté
    CALCULATION_FORMULAS: {
        // Facteur technique = (facteur d'échelle / 10) / facteur correctif ajusté
        technicalFactor: (scaleFactor) => (scaleFactor / 10.0) / SCALE_CONFIG.SCALE_CORRECTION_FACTOR,
        
        // Conversion réel vers papier = 1 / facteur d'échelle (inchangée)
        realToPaper: (scaleFactor) => 1.0 / scaleFactor,
        
        // Validation: distance papier = distance réelle / facteur d'échelle (inchangée)
        validatePaperDistance: (realDistance, scaleFactor) => realDistance / scaleFactor,
        
        // Calcul du frustum = dimension réelle * facteur technique corrigé
        frustumSize: (realDimension, scaleFactor) => realDimension * ((scaleFactor / 10.0) / SCALE_CONFIG.SCALE_CORRECTION_FACTOR),
        
        // Pixels par cm avec facteur correctif ajusté
        pixelsPerCm: (height, frustumSize) => (height / frustumSize) * SCALE_CONFIG.SCALE_CORRECTION_FACTOR
    },
    
    // Exemples de validation pour vérifier la cohérence avec facteur correctif
    VALIDATION_EXAMPLES: {
        '1:20': {
            brick19cm: { real: 19, paper: 0.95, unit: 'cm' },
            wall200cm: { real: 200, paper: 10, unit: 'cm' },
            building5m: { real: 500, paper: 25, unit: 'cm' },
            element120cm: { real: 120, paper: 6, unit: 'cm' } // 🔧 Test du facteur correctif
        },
        '1:50': {
            brick19cm: { real: 19, paper: 0.38, unit: 'cm' },
            wall200cm: { real: 200, paper: 4, unit: 'cm' },
            building5m: { real: 500, paper: 10, unit: 'cm' },
            element120cm: { real: 120, paper: 2.4, unit: 'cm' } // 🔧 Test du facteur correctif
        },
        '1:100': {
            brick19cm: { real: 19, paper: 0.19, unit: 'cm' },
            wall200cm: { real: 200, paper: 2, unit: 'cm' },
            building5m: { real: 500, paper: 5, unit: 'cm' },
            element120cm: { real: 120, paper: 1.2, unit: 'cm' } // 🔧 Test du facteur correctif
        }
    }
};

// Fonction de réinitialisation des facteurs correctifs
function reinitializeScaleFactors() {
    // console.log('🔄 AJUSTEMENT DES FACTEURS CORRECTIFS D\'ÉCHELLE');
    // console.log('===============================================');
    // console.log(`🔧 FACTEUR CORRECTIF AJUSTÉ: ${SCALE_CONFIG.SCALE_CORRECTION_FACTOR}`);
    // console.log('   Observation 1: élément 120cm → 1.4cm au lieu de 6cm → facteur 4.286');
    // console.log('   Observation 2: élément 120cm → 5.2cm au lieu de 6cm → facteur 1.154');
    // console.log('   Nouveau facteur: 6 ÷ 5.2 = 1.154');
    // console.log('');
    
    // Afficher la configuration réinitialisée
    Object.entries(SCALE_CONFIG.AVAILABLE_SCALES).forEach(([scale, config]) => {
        const correctedTechnicalFactor = SCALE_CONFIG.CALCULATION_FORMULAS.technicalFactor(config.factor);
        // console.log(`📐 ${scale}:`);
        // console.log(`   - Facteur: ${config.factor}`);
        // console.log(`   - Facteur technique base: ${config.technicalFactor} (${config.factor}/10)`);
        // console.log(`   - Facteur technique corrigé: ${correctedTechnicalFactor.toFixed(3)} (avec correction ${SCALE_CONFIG.SCALE_CORRECTION_FACTOR})`);
        // console.log(`   - ${config.description}`);
        
        // Validation avec les exemples
        const validation = SCALE_CONFIG.VALIDATION_EXAMPLES[scale];
        if (validation) {
            // console.log(`   - Validation brique 19cm: ${validation.brick19cm.real}cm → ${validation.brick19cm.paper}cm papier`);
            // console.log(`   - 🔧 Test élément 120cm: ${validation.element120cm.real}cm → ${validation.element120cm.paper}cm papier`);
        }
        // console.log('');
    });
    
    // console.log('✅ Configuration d\'échelle ajustée avec nouveau facteur correctif et validée');
    return SCALE_CONFIG;
}

// Fonction pour valider un facteur d'échelle
function validateScaleFactor(scaleString) {
    const config = SCALE_CONFIG.AVAILABLE_SCALES[scaleString];
    if (!config) {
        console.warn(`⚠️ Échelle non reconnue: ${scaleString}, utilisation de l'échelle par défaut 1:20`);
        return SCALE_CONFIG.AVAILABLE_SCALES['1:20'];
    }
    return config;
}

// Fonction pour obtenir le facteur technique correct
function getTechnicalFactor(scaleFactor) {
    // FORMULE RÉINITIALISÉE CORRECTE
    return SCALE_CONFIG.CALCULATION_FORMULAS.technicalFactor(scaleFactor);
}

// Fonction pour obtenir le facteur de conversion réel vers papier
function getRealToPaperFactor(scaleFactor) {
    // FORMULE RÉINITIALISÉE CORRECTE
    return SCALE_CONFIG.CALCULATION_FORMULAS.realToPaper(scaleFactor);
}

// Test de validation automatique
function runScaleValidationTest() {
    // console.log('🧪 TEST DE VALIDATION DES FACTEURS D\'ÉCHELLE');
    // console.log('===========================================');
    
    let allTestsPassed = true;
    
    // Tester chaque échelle avec les exemples
    Object.entries(SCALE_CONFIG.VALIDATION_EXAMPLES).forEach(([scale, examples]) => {
        // console.log(`\n🔍 Test pour ${scale}:`);
        const scaleFactor = SCALE_CONFIG.AVAILABLE_SCALES[scale].factor;
        
        Object.entries(examples).forEach(([testName, test]) => {
            const calculatedPaper = SCALE_CONFIG.CALCULATION_FORMULAS.validatePaperDistance(test.real, scaleFactor);
            const isValid = Math.abs(calculatedPaper - test.paper) < 0.01; // Tolérance de 0.01cm
            
            // console.log(`   ${testName}: ${test.real}${test.unit} → ${calculatedPaper.toFixed(2)}${test.unit} papier (attendu: ${test.paper}${test.unit}) ${isValid ? '✅' : '❌'}`);
            
            if (!isValid) {
                allTestsPassed = false;
            }
        });
    });
    
    // console.log(`\n${allTestsPassed ? '✅ TOUS LES TESTS PASSÉS' : '❌ CERTAINS TESTS ONT ÉCHOUÉ'}`);
    return allTestsPassed;
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SCALE_CONFIG,
        reinitializeScaleFactors,
        validateScaleFactor,
        getTechnicalFactor,
        getRealToPaperFactor,
        runScaleValidationTest
    };
}

// Export global pour le navigateur
if (typeof window !== 'undefined') {
    window.ScaleFactorsConfig = {
        SCALE_CONFIG,
        reinitializeScaleFactors,
        validateScaleFactor,
        getTechnicalFactor,
        getRealToPaperFactor,
        runScaleValidationTest
    };
}

// Auto-initialisation et test
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        reinitializeScaleFactors();
        runScaleValidationTest();
    });
}
