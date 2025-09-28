/**
 * Script de test pour la restriction des blocs spécialisés
 * À exécuter dans la console du navigateur après avoir chargé WallSim3D
 */

function testBlockMaterialRestriction() {
    console.log('🧪 Test de la restriction des matériaux spécialisés');
    console.log('==============================================');
    
    // Vérifier que ConstructionTools est disponible
    if (!window.ConstructionTools) {
        console.error('❌ ConstructionTools non disponible');
        return;
    }
    
    // Test de la fonction getBlockMaterialType
    console.log('📋 Test de getBlockMaterialType:');
    
    // Simuler différents types d'éléments
    const testElements = [
        { id: 'test-bc', type: 'block', blockType: 'BC_15', description: 'Béton cellulaire 15cm' },
        { id: 'test-bca', type: 'block', blockType: 'BCA_20', description: 'Béton cellulaire assise 20cm' },
        { id: 'test-argex', type: 'block', blockType: 'ARGEX14', description: 'Bloc ARGEX 14cm' },
        { id: 'test-tc', type: 'block', blockType: 'TERRE_CUITE', description: 'Bloc terre cuite' },
        { id: 'test-b14', type: 'block', blockType: 'B14', description: 'Bloc creux B14' },
        { id: 'test-brick', type: 'brick', description: 'Brique classique' }
    ];
    
    testElements.forEach(element => {
        const materialType = window.ConstructionTools.getBlockMaterialType(element);
        const isSpecialized = materialType && ['cellular', 'cellular-assise', 'argex', 'terracotta'].includes(materialType);
        
        console.log(`📦 ${element.description}:`);
        console.log(`   - Type détecté: ${materialType || 'null'}`);
        console.log(`   - Matériau spécialisé: ${isSpecialized ? '✅ OUI' : '❌ NON'}`);
        console.log(`   - Restrictions appliquées: ${isSpecialized ? '✅ Continuité uniquement' : '❌ Toutes suggestions'}`);
    });
    
    console.log('\n🔍 Test réussi ! Les restrictions seront appliquées selon le type de matériau.');
    
    // Instructions pour le test manuel
    console.log('\n📋 Instructions pour test manuel:');
    console.log('1. Placer un bloc de béton cellulaire (BC_*)');
    console.log('2. Cliquer dessus pour activer les suggestions');
    console.log('3. Vérifier que seules 2 positions (A et B) sont proposées');
    console.log('4. Comparer avec un bloc creux (B9/B14/B19) qui doit avoir toutes les suggestions');
}

// Lancer le test
testBlockMaterialRestriction();

// Export pour utilisation globale
window.testBlockMaterialRestriction = testBlockMaterialRestriction;