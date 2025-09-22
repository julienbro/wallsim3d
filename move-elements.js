// Script pour déplacer des éléments spécifiques
function moveElementsForward() {
    const elementIds = ['343404', '343403'];
    const moveDistance = 2; // 2cm vers l'avant (Z+)
    
    elementIds.forEach(id => {
        // Chercher l'élément par ID exact
        let element = null;
        
        // Méthode 1: Dans SceneManager.elements
        if (window.SceneManager && window.SceneManager.elements) {
            element = window.SceneManager.elements.get(id);
        }
        
        // Méthode 2: Chercher dans tous les éléments avec ID partiel
        if (!element && window.SceneManager && window.SceneManager.elements) {
            for (let [key, el] of window.SceneManager.elements) {
                if (key.includes(id)) {
                    element = el;
                    console.log(`✅ Élément trouvé avec ID partiel: ${key}`);
                    break;
                }
            }
        }
        
        if (element) {
            const oldZ = element.position.z;
            const newZ = oldZ + moveDistance;
            
            console.log(`📦 Déplacement élément ${id}:`);
            console.log(`   Ancienne position Z: ${oldZ}cm`);
            console.log(`   Nouvelle position Z: ${newZ}cm`);
            
            // Mettre à jour la position
            if (element.updatePosition) {
                element.updatePosition(element.position.x, element.position.y, newZ);
            } else if (element.mesh) {
                element.mesh.position.z = newZ / 100; // Conversion cm vers mètres pour Three.js
                element.position.z = newZ;
            }
            
            console.log(`✅ Élément ${id} déplacé de 2cm vers l'avant`);
        } else {
            console.warn(`❌ Élément ${id} non trouvé`);
            
            // Lister tous les IDs disponibles pour debug
            if (window.SceneManager && window.SceneManager.elements) {
                console.log('IDs disponibles:');
                Array.from(window.SceneManager.elements.keys()).forEach(key => {
                    if (key.includes('343404') || key.includes('343403')) {
                        console.log(`  - ${key}`);
                    }
                });
            }
        }
    });
}

// Exécuter la fonction
console.log('🚀 Démarrage du déplacement des éléments...');
moveElementsForward();