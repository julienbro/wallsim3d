// Test script pour vérifier la détection des blocs BC5 1/2
// Simule la logique de detectBlockSubType pour les blocs BC coupés

console.log('🧪 === TEST DETECTION BC5 1/2 ===');

// Simulation des données d'un bloc BC5 1/2
const testCases = [
    {
        name: 'BC5 1/2 standard',
        blockType: 'BC_60x5_60x14_60_HALF',
        category: 'cut',
        expected: 'BC5'
    },
    {
        name: 'BC5 3/4 custom',
        blockType: 'BC_60x5_60x14_60_3Q',
        category: 'cut',
        expected: 'BC5'
    },
    {
        name: 'BC7 1/2',
        blockType: 'BC_60x7_60x14_60_HALF',
        category: 'cut',
        expected: 'BC7'
    },
    {
        name: 'BC10 coupé',
        blockType: 'BC_60x10_60x14_60_34CM',
        category: 'cut',
        expected: 'BC10'
    },
    {
        name: 'BCA équivalent BC10',
        blockType: 'BCA_60x9_60x14_60_HALF',
        category: 'cut',
        expected: 'BC10'
    }
];

// Simulation de la nouvelle logique de détection
function simulateDetectBlockSubType(blockType, category) {
    console.log(`\n🔍 Test: ${blockType} (category: ${category})`);
    
    if (category === 'cut') {
        // Extraire le type de base en supprimant les suffixes de coupe
        let baseType = blockType;
        if (blockType && typeof blockType === 'string') {
            const cutSuffixes = ['_3Q', '_HALF', '_1Q', '_34CM', '_4CM'];
            for (const suffix of cutSuffixes) {
                if (blockType.endsWith(suffix)) {
                    baseType = blockType.replace(suffix, '');
                    console.log(`   Suffixe ${suffix} détecté → baseType: ${baseType}`);
                    break;
                }
            }
        }
        
        // Test des blocs BC coupés
        if (baseType.includes('60x5')) {
            console.log('   ✅ BC5 coupé détecté → BC5');
            return 'BC5';
        }
        if (baseType.includes('60x7')) {
            console.log('   ✅ BC7 coupé détecté → BC7');
            return 'BC7';
        }
        if (baseType.includes('60x10') || baseType.includes('60x9')) {
            console.log('   ✅ BC10 coupé détecté → BC10');
            return 'BC10';
        }
        
        // Gestion spéciale pour les blocs BC_ et BCA_ coupés
        if (baseType.startsWith('BC_') || baseType.startsWith('BCA_')) {
            console.log(`   Bloc BC_/BCA_ coupé détecté: ${baseType}`);
            if (baseType.includes('60x5')) {
                console.log('   ✅ BC_/BCA_ avec 60x5 → BC5');
                return 'BC5';
            }
            if (baseType.includes('60x7')) {
                console.log('   ✅ BC_/BCA_ avec 60x7 → BC7');
                return 'BC7';
            }
            if (baseType.includes('60x10') || baseType.includes('60x9')) {
                console.log('   ✅ BC_/BCA_ avec 60x10/60x9 → BC10');
                return 'BC10';
            }
        }
        
        console.log('   ❌ FALLBACK VERS CREUX');
        return 'CREUX';
    }
    
    return null;
}

// Exécuter les tests
testCases.forEach(testCase => {
    console.log(`\n🧪 === ${testCase.name} ===`);
    const result = simulateDetectBlockSubType(testCase.blockType, testCase.category);
    
    if (result === testCase.expected) {
        console.log(`✅ SUCCÈS: ${testCase.name} → ${result}`);
    } else {
        console.log(`❌ ÉCHEC: ${testCase.name} → attendu: ${testCase.expected}, obtenu: ${result}`);
    }
});

console.log('\n🎯 === RÉSUMÉ ===');
console.log('La nouvelle logique détecte correctement :');
console.log('- Les blocs BC5 1/2 comme type BC5');
console.log('- Les blocs BC7 1/2 comme type BC7'); 
console.log('- Les blocs BC10 coupés comme type BC10');
console.log('- Les blocs BCA équivalents');

console.log('\n📋 Prochaine étape : Tester dans l\'application réelle');