// Script de diagnostic Three.js
function diagThreeJS() {
    console.log('=== DIAGNOSTIC THREE.JS ===');
    console.log('window.THREE:', typeof window.THREE);
    console.log('THREE.REVISION:', window.THREE?.REVISION);
    console.log('window.OrbitControls:', typeof window.OrbitControls);
    console.log('THREE.OrbitControls:', typeof window.THREE?.OrbitControls);
    
    // Lister toutes les propriétés de THREE liées aux contrôles
    if (window.THREE) {
        const threeKeys = Object.keys(window.THREE).filter(key => 
            key.toLowerCase().includes('orbit') || 
            key.toLowerCase().includes('control')
        );
        console.log('Clés THREE liées aux contrôles:', threeKeys);
        
        // Chercher OrbitControls dans différents endroits
        console.log('THREE.OrbitControls:', window.THREE.OrbitControls);
        console.log('window.THREE.OrbitControls:', window.THREE?.OrbitControls);
    }
    
    // Lister tous les scripts chargés
    const scripts = Array.from(document.scripts).map(s => s.src).filter(s => s.includes('three') || s.includes('orbit'));
    console.log('Scripts Three.js chargés:', scripts);
    
    console.log('=== FIN DIAGNOSTIC ===');
}

// Exposer la fonction globalement
window.diagThreeJS = diagThreeJS;

// Diagnostic automatique après chargement
window.addEventListener('threejs-ready', function() {
    setTimeout(diagThreeJS, 1000);
});
