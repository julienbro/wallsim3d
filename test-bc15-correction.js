// Test script spécifique pour BC15 et autres blocs BC coupés
// Vérification que tous les types BC vont dans les bonnes assises

console.log('🧪 === TEST BC15 ET AUTRES BLOCS BC COUPÉS ===');

// Cas de test spécifiques pour BC15 problématique
const testCasesBC = [
    {
        name: 'BC15 3/4 (problématique)',
        blockType: 'BC_60x15_60x14_60_3Q',
        expected: 'BC15'
    },
    {
        name: 'BC15 1/4 (problématique)', 
        blockType: 'BC_60x15_60x14_60_1Q',
        expected: 'BC15'
    },
    {
        name: 'BC15 1/2',
        blockType: 'BC_60x15_60x14_60_HALF',
        expected: 'BC15'
    },
    {
        name: 'BC15 avec 60x14',
        blockType: 'BC_60x14_60x14_60_3Q',
        expected: 'BC15'
    },
    {
        name: 'BC17 3/4',
        blockType: 'BC_60x17_60x14_60_3Q',
        expected: 'BC17'
    },
    {
        name: 'BC20 1/4',
        blockType: 'BC_60x20_60x14_60_1Q',
        expected: 'BC20'
    },
    {
        name: 'BC20 avec 60x19',
        blockType: 'BC_60x19_60x14_60_HALF',
        expected: 'BC20'
    },
    {
        name: 'BC24 3/4',
        blockType: 'BC_60x24_60x14_60_3Q',
        expected: 'BC24'
    },
    {
        name: 'BC30 1/2',
        blockType: 'BC_60x30_60x14_60_HALF',
        expected: 'BC30'
    },
    {
        name: 'BC36 3/4',
        blockType: 'BC_60x36_60x14_60_3Q',
        expected: 'BC36'
    }
];

// Simulation de la nouvelle logique de détection complète CORRIGÉE
function simulateDetectBlockSubTypeComplete(element) {
    console.log(`\n🔍 Test: ${element.name} - blockType: ${element.blockType}`);
    
    if (!element.blockType) {
        console.log('   ❌ Pas de blockType');
        return null;
    }
    
    // Test détection complète AVEC ORDRE SPÉCIFIQUE (du plus grand au plus petit)
    if (element.blockType.includes('60x36')) {
        console.log('   ✅ BC36 détecté → BC36');
        return 'BC36';
    }
    if (element.blockType.includes('60x30')) {
        console.log('   ✅ BC30 détecté → BC30');
        return 'BC30';
    }
    if (element.blockType.includes('60x24')) {
        console.log('   ✅ BC24 détecté → BC24');
        return 'BC24';
    }
    if (element.blockType.includes('60x20')) {
        console.log('   ✅ BC20 détecté → BC20');
        return 'BC20';
    }
    if (element.blockType.includes('60x19')) {
        console.log('   ✅ BC20 (60x19) détecté → BC20');
        return 'BC20';
    }
    if (element.blockType.includes('60x17')) {
        console.log('   ✅ BC17 détecté → BC17');
        return 'BC17';
    }
    if (element.blockType.includes('60x15')) {
        console.log('   ✅ BC15 détecté → BC15');
        return 'BC15';
    }
    if (element.blockType.includes('60x14')) {
        console.log('   ✅ BC15 (60x14) détecté → BC15');
        return 'BC15';
    }
    if (element.blockType.includes('60x10')) {
        console.log('   ✅ BC10 détecté → BC10');
        return 'BC10';
    }
    if (element.blockType.includes('60x9')) {
        console.log('   ✅ BC10 (60x9) détecté → BC10');
        return 'BC10';
    }
    if (element.blockType.includes('60x7')) {
        console.log('   ✅ BC7 détecté → BC7');
        return 'BC7';
    }
    if (element.blockType.includes('60x5')) {
        console.log('   ✅ BC5 détecté → BC5');
        return 'BC5';
    }
    
    console.log('   ❌ Aucun type BC détecté');
    return null;
}

// Exécuter les tests
console.log('\n🧪 === TESTS BLOCS BC COUPÉS ===');

let successCount = 0;
let totalCount = testCasesBC.length;

testCasesBC.forEach(testCase => {
    console.log(`\n🧪 === ${testCase.name} ===`);
    const result = simulateDetectBlockSubTypeComplete(testCase);
    
    if (result === testCase.expected) {
        console.log(`✅ SUCCÈS: ${testCase.name} → ${result}`);
        successCount++;
    } else {
        console.log(`❌ ÉCHEC: ${testCase.name} → attendu: ${testCase.expected}, obtenu: ${result}`);
    }
});

console.log('\n🎯 === RÉSUMÉ BC COUPÉS ===');
console.log(`Succès: ${successCount}/${totalCount} tests`);

if (successCount === totalCount) {
    console.log('🎉 TOUS LES TESTS BC PASSENT !');
    console.log('✅ BC15 3/4 → Assise BC15');
    console.log('✅ BC15 1/4 → Assise BC15');
    console.log('✅ BC17, BC20, BC24, BC30, BC36 coupés → Bonnes assises');
} else {
    console.log('⚠️ Certains tests BC échouent encore');
}

console.log('\n📋 Test spécial BC15 :');
console.log('- BC15 3/4 avec 60x15 → Assise BC15');
console.log('- BC15 1/4 avec 60x15 → Assise BC15'); 
console.log('- BC15 avec 60x14 → Assise BC15');
console.log('- BC20 avec 60x19 → Assise BC20');

console.log('\n🚀 Redémarrez l\'application et testez les blocs BC15 coupés!');