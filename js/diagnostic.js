// Script de diagnostic pour WallSim3D
// Diagnostic désactivé par défaut pour réduire les logs
// Tapez enableDiagnostic() dans la console pour l'activer
window.DIAGNOSTIC_ENABLED = false;

// Fonction pour activer/désactiver le diagnostic
window.enableDiagnostic = function() {
    window.DIAGNOSTIC_ENABLED = true;
    console.log('🔧 Diagnostic activé - rechargez la page pour voir les informations');
};

window.disableDiagnostic = function() {
    window.DIAGNOSTIC_ENABLED = false;
    console.log('🔇 Diagnostic désactivé');
};

if (window.DIAGNOSTIC_ENABLED) {
    console.log('=== DIAGNOSTIC WALLSIM3D ===');

// Vérifier la disponibilité des modules
const modules = [
    'THREE',
    'MaterialLibrary', 
    'WallElement',
    'AssiseManager',
    'SceneManager',
    'BrickSelector',
    'ConstructionTools',
    'WallAnalysis',
    'UIController',
    'WallSimApp'
];

console.log('Modules disponibles:');
modules.forEach(name => {
    const available = typeof window[name] !== 'undefined';
    console.log(`${available ? '✓' : '✗'} ${name}: ${available ? 'OK' : 'MANQUANT'}`);
});

// Vérifier l'état de l'AssiseManager
if (window.AssiseManager) {
    console.log('\nÉtat AssiseManager:');
    console.log('- Joint height:', window.AssiseManager.jointHeight);
    console.log('- Current assise:', window.AssiseManager.currentAssise);
    console.log('- Initialized:', window.AssiseManager.isInitialized);
    console.log('- Assises count:', window.AssiseManager.assises.size);
}

// Vérifier les éléments HTML requis
const requiredElements = [
    'assiseSelect',
    'jointHeight', 
    'addAssise',
    'removeAssise',
    'toggleAssiseGrids',
    'assiseCount'
];

console.log('\nÉléments HTML:');
requiredElements.forEach(id => {
    const element = document.getElementById(id);
    console.log(`${element ? '✓' : '✗'} #${id}: ${element ? 'TROUVÉ' : 'MANQUANT'}`);
});

console.log('=== FIN DIAGNOSTIC ===');
}
