// Test script étendu pour vérifier la détection des blocs BC5, ARGEX et Terre Cuite
// Simule la logique de detectBlockSubType pour tous les types de blocs spécialisés

console.log('🧪 === TEST DETECTION BLOCS SPÉCIALISÉS ===');

// Simulation des données de blocs spécialisés coupés
const testCases = [
    // Blocs BC (béton cellulaire)
    {
        name: 'BC5 1/2',
        blockType: 'BC_60x5_60x14_60_HALF',
        category: 'cut',
        expected: 'BC5'
    },
    {
        name: 'BC7 3/4',
        blockType: 'BC_60x7_60x14_60_3Q',
        category: 'cut',
        expected: 'BC7'
    },
    {
        name: 'BC10 coupé',
        blockType: 'BC_60x10_60x14_60_34CM',
        category: 'cut',
        expected: 'BC10'
    },
    
    // Blocs ARGEX
    {
        name: 'ARGEX9 1/2',
        blockType: 'ARGEX_39x9_60x14_60_HALF',
        category: 'cut',
        expected: 'ARGEX9'
    },
    {
        name: 'ARGEX14 3/4',
        blockType: 'ARGEX_39x14_60x14_60_3Q',
        category: 'cut',
        expected: 'ARGEX14'
    },
    {
        name: 'ARGEX19 coupé',
        blockType: 'ARGEX_39x19_60x14_60_34CM',
        category: 'cut',
        expected: 'ARGEX19'
    },
    
    // Blocs Terre Cuite
    {
        name: 'TC10 1/2',
        blockType: 'TC_50x10_60x14_60_HALF',
        category: 'cut',
        expected: 'TC10'
    },
    {
        name: 'TC14 3/4',
        blockType: 'TC_50x14_60x14_60_3Q',
        category: 'cut',
        expected: 'TC14'
    },
    {
        name: 'TC19 coupé',
        blockType: 'TC_50x19_60x14_60_34CM',
        category: 'cut',
        expected: 'TC19'
    }
];

// Simulation de la nouvelle logique de détection directe
function simulateDetectBlockSubType(element) {
    console.log(`\n🔍 Test: ${element.name} - blockType: ${element.blockType}`);
    
    if (!element.blockType) {
        console.log('   ❌ Pas de blockType');
        return null;
    }
    
    // Détection directe BC
    if (element.blockType.includes('60x5')) {
        console.log('   ✅ BC5 détecté directement → BC5');
        return 'BC5';
    }
    if (element.blockType.includes('60x7')) {
        console.log('   ✅ BC7 détecté directement → BC7');
        return 'BC7';
    }
    if (element.blockType.includes('60x10') || element.blockType.includes('60x9')) {
        console.log('   ✅ BC10 détecté directement → BC10');
        return 'BC10';
    }
    
    // Détection directe ARGEX
    if (element.blockType.includes('39x9')) {
        console.log('   ✅ ARGEX9 détecté directement → ARGEX9');
        return 'ARGEX9';
    }
    if (element.blockType.includes('39x14')) {
        console.log('   ✅ ARGEX14 détecté directement → ARGEX14');
        return 'ARGEX14';
    }
    if (element.blockType.includes('39x19')) {
        console.log('   ✅ ARGEX19 détecté directement → ARGEX19');
        return 'ARGEX19';
    }
    
    // Détection directe Terre Cuite
    if (element.blockType.includes('50x10')) {
        console.log('   ✅ TC10 détecté directement → TC10');
        return 'TC10';
    }
    if (element.blockType.includes('50x14')) {
        console.log('   ✅ TC14 détecté directement → TC14');
        return 'TC14';
    }
    if (element.blockType.includes('50x19')) {
        console.log('   ✅ TC19 détecté directement → TC19');
        return 'TC19';
    }
    
    console.log('   ❌ Aucun type spécialisé détecté');
    return null;
}

// Exécuter tous les tests
console.log('\n🧪 === TESTS DES BLOCS SPÉCIALISÉS ===');

let successCount = 0;
let totalCount = testCases.length;

testCases.forEach(testCase => {
    console.log(`\n🧪 === ${testCase.name} ===`);
    const result = simulateDetectBlockSubType(testCase);
    
    if (result === testCase.expected) {
        console.log(`✅ SUCCÈS: ${testCase.name} → ${result}`);
        successCount++;
    } else {
        console.log(`❌ ÉCHEC: ${testCase.name} → attendu: ${testCase.expected}, obtenu: ${result}`);
    }
});

console.log('\n🎯 === RÉSUMÉ FINAL ===');
console.log(`Succès: ${successCount}/${totalCount} tests`);

if (successCount === totalCount) {
    console.log('🎉 TOUS LES TESTS PASSENT !');
    console.log('✅ Blocs BC (béton cellulaire) : Détection OK');
    console.log('✅ Blocs ARGEX : Détection OK');
    console.log('✅ Blocs Terre Cuite : Détection OK');
} else {
    console.log('⚠️ Certains tests échouent, vérification nécessaire');
}

console.log('\n📋 Les blocs spécialisés coupés devraient maintenant aller dans leurs bonnes assises :');
console.log('- BC5 1/2 → Assise BC5');
console.log('- ARGEX9 1/2 → Assise ARGEX9');
console.log('- TC10 1/2 → Assise TC10');
console.log('- etc.');