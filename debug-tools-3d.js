/**
 * Script de test pour diagnostiquer les problèmes d'affichage 3D
 * À utiliser dans la console du navigateur
 */

// Activer le debug temporairement
window.DEBUG_TOOLS_TAB = true;
console.log('🔧 Debug activé pour ToolsTabManager');

// Fonction pour forcer le refresh de l'aperçu 3D
function forceToolsPreview() {
    console.log('🎨 Force refresh aperçu 3D via script de test');
    
    if (window.ToolsTabManager) {
        window.ToolsTabManager.forceRefresh3DPreview();
    } else {
        console.error('❌ ToolsTabManager non disponible');
    }
}

// Fonction pour vérifier l'état du canvas
function checkCanvasState() {
    const canvas = document.getElementById('toolsActiveElementCanvas');
    if (!canvas) {
        console.error('❌ Canvas non trouvé');
        return;
    }
    
    console.log('📊 État du canvas:');
    console.log('- Connecté au DOM:', canvas.isConnected);
    console.log('- Visible:', canvas.offsetParent !== null);
    console.log('- Dimensions:', canvas.width, 'x', canvas.height);
    console.log('- Style dimensions:', canvas.style.width, 'x', canvas.style.height);
    console.log('- Element type:', canvas.getAttribute('data-element-type'));
    console.log('- Current element type:', canvas.getAttribute('data-current-element-type'));
    console.log('- Engine:', canvas.getAttribute('data-engine'));
    
    return canvas;
}

// Fonction pour vérifier l'élément actif
function checkActiveElement() {
    if (!window.ToolsTabManager) {
        console.error('❌ ToolsTabManager non disponible');
        return;
    }
    
    const activeElement = window.ToolsTabManager.getActiveElement();
    console.log('📋 Élément actif:', activeElement);
    
    if (activeElement) {
        console.log('- Type:', activeElement.type);
        console.log('- Nom:', activeElement.name);
        console.log('- GLB Path:', activeElement.userData?.glbPath || activeElement.path);
        console.log('- Échelle:', activeElement.scale);
        console.log('- Catégorie:', activeElement.category);
    }
    
    return activeElement;
}

// Fonction pour vérifier THREE.js
function checkThreeJS() {
    console.log('🌟 État de THREE.js:');
    console.log('- THREE disponible:', typeof THREE !== 'undefined');
    console.log('- GLTFLoader disponible:', typeof GLTFLoader !== 'undefined');
    
    if (typeof THREE !== 'undefined') {
        console.log('- Version THREE:', THREE.REVISION);
    }
}

// Fonction complète de diagnostic
function diagnosticTools3D() {

    checkThreeJS();
    const canvas = checkCanvasState();
    const activeElement = checkActiveElement();
    
    // Vérifier l'onglet actif
    const toolsTab = document.querySelector('[data-tab="outils"]');
    const isToolsTabActive = toolsTab && toolsTab.classList.contains('active');
    console.log('📋 Onglet Outils actif:', isToolsTabActive);
    
    if (canvas && activeElement && isToolsTabActive) {
        console.log('✅ Conditions OK pour l\'aperçu 3D');
        console.log('🔄 Tentative de force refresh...');
        forceToolsPreview();
    } else {
        console.log('❌ Conditions non remplies pour l\'aperçu 3D');
        if (!canvas) console.log('  - Canvas manquant');
        if (!activeElement) console.log('  - Élément actif manquant');
        if (!isToolsTabActive) console.log('  - Onglet Outils non actif');
    }

}

// Exporter les fonctions pour utilisation manuelle
window.testTools3D = {
    diagnostic: diagnosticTools3D,
    forcePreview: forceToolsPreview,
    checkCanvas: checkCanvasState,
    checkElement: checkActiveElement,
    checkThree: checkThreeJS
};

console.log('🛠️ Script de test chargé. Utilisez:');
console.log('  - testTools3D.diagnostic() pour un diagnostic complet');
console.log('  - testTools3D.forcePreview() pour forcer l\'aperçu');
console.log('  - testTools3D.checkCanvas() pour vérifier le canvas');
console.log('  - testTools3D.checkElement() pour vérifier l\'élément actif');
console.log('  - testTools3D.checkThree() pour vérifier THREE.js');
