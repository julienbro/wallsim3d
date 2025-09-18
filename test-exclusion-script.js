// Test de validation du système d'exclusion HEF, HEE, HEI, HEJ
// Ce script peut être exécuté dans la console du navigateur pour vérifier la logique

console.log('🧪 Test du système d\'exclusion HEF, HEE, HEI, HEJ');

// Simuler la fonction getExcludedPositions
function getExcludedPositions(refType, placeType) {
    const exclusionRules = {
        'entiere': {
            '3/4': [],
            '1/2': ['E', 'F', 'I', 'J'], // NOUVELLES EXCLUSIONS
            '1/4': [],
            'custom': []
        },
        '3/4': {
            'entiere': [],
            '1/2': [],
            '1/4': []
        },
        '1/2': {
            'entiere': [],
            '3/4': [],
            '1/4': []
        },
        '1/4': {
            'entiere': [],
            '3/4': [],
            '1/2': []
        }
    };
    
    return exclusionRules[refType]?.[placeType] || [];
}

// Simuler la fonction getLetterForPosition simplifiée
function testGetLetterForPosition(basePosition, placementBrickType, referenceBrickType) {
    const excludedPositions = getExcludedPositions(referenceBrickType, placementBrickType);
    
    // Vérifier si cette position est exclue
    if (excludedPositions.includes(basePosition)) {
        return null; // Position exclue
    }
    
    // Système de lettrage simplifié pour le test
    const combinedLetteringSystems = {
        '1/2_entiere': {
            panneresse: { A: 'HEA', B: 'HEB', C: 'HEC', D: 'HED', E: 'HEE', F: 'HEF', G: 'HEG', H: 'HEH', I: 'HEI', J: 'HEJ' },
            boutisse: { S: 'HES', T: 'HET', U: 'HEU', V: 'HEV' }
        }
    };
    
    const systemKey = `${placementBrickType}_${referenceBrickType}`;
    const orientation = ['S', 'T', 'U', 'V'].includes(basePosition) ? 'boutisse' : 'panneresse';
    const system = combinedLetteringSystems[systemKey];
    
    return system && system[orientation] && system[orientation][basePosition];
}

// Tests des positions qui DOIVENT être exclues
console.log('\n🚫 Test des positions EXCLUES (doivent retourner null):');
const excludedPositions = ['E', 'F', 'I', 'J'];
excludedPositions.forEach(pos => {
    const result = testGetLetterForPosition(pos, '1/2', 'entiere');
    const status = result === null ? '✅ EXCLU' : `❌ ERREUR: ${result}`;
    console.log(`Position ${pos}: ${status}`);
});

// Tests des positions qui DOIVENT être autorisées
console.log('\n✅ Test des positions AUTORISÉES (doivent retourner une lettre):');
const allowedPositions = ['A', 'B', 'C', 'D', 'G', 'H', 'S', 'T', 'U', 'V'];
allowedPositions.forEach(pos => {
    const result = testGetLetterForPosition(pos, '1/2', 'entiere');
    const status = result !== null ? `✅ AUTORISÉ: ${result}` : '❌ ERREUR: null';
    console.log(`Position ${pos}: ${status}`);
});

// Test de comparaison avec brique entière sur entière (doit avoir toutes les positions)
console.log('\n🔄 Test de comparaison avec entière sur entière:');
excludedPositions.forEach(pos => {
    const result = testGetLetterForPosition(pos, 'entiere', 'entiere');
    const expected = `EE${pos}`;
    const status = result === expected ? `✅ OK: ${result}` : `❌ ERREUR: ${result}`;
    console.log(`Position ${pos}: ${status}`);
});

console.log('\n📊 Résumé:');
console.log('- Positions E, F, I, J doivent être EXCLUES pour 1/2 sur entière');
console.log('- Positions A, B, C, D, G, H, S, T, U, V doivent être AUTORISÉES pour 1/2 sur entière');
console.log('- Toutes les positions doivent être autorisées pour entière sur entière');