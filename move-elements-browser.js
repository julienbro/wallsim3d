// Script pour déplacer les éléments 290106 et 290105 de 11cm vers l'avant
// À exécuter dans la console du navigateur

function moveSpecificElements() {
    const elementIds = ['290106', '290105'];
    const moveDistance = 11; // 11cm vers l'avant (Z+)
    
    console.log('🚀 Démarrage du déplacement des éléments 290106 et 290105 de 11cm vers l\'avant...');
    
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
            if (element.updatePosition && typeof element.updatePosition === 'function') {
                element.updatePosition(element.position.x, element.position.y, newZ);
                console.log(`✅ Élément ${id} déplacé de ${moveDistance}cm vers l'avant (méthode updatePosition)`);
            } else if (element.mesh) {
                // Mise à jour directe du mesh et de la position
                element.mesh.position.z = newZ / 100; // Conversion cm vers mètres pour Three.js
                element.position.z = newZ;
                console.log(`✅ Élément ${id} déplacé de ${moveDistance}cm vers l'avant (méthode mesh)`);
            } else {
                console.warn(`⚠️ Impossible de déplacer l'élément ${id} - méthodes non disponibles`);
            }
        } else {
            console.warn(`❌ Élément ${id} non trouvé`);
            
            // Lister tous les IDs disponibles pour debug
            if (window.SceneManager && window.SceneManager.elements) {
                console.log('🔍 IDs disponibles contenant "290":');
                let found = false;
                Array.from(window.SceneManager.elements.keys()).forEach(key => {
                    if (key.includes('290')) {
                        console.log(`  - ${key}`);
                        found = true;
                    }
                });
                if (!found) {
                    console.log('  Aucun élément avec ID contenant "290" trouvé');
                }
            }
        }
    });
    
    console.log('🏁 Déplacement terminé');
}

// Fonction alternative pour lister tous les éléments disponibles
function listAllElements() {
    console.log('📋 Liste de tous les éléments dans la scène:');
    if (window.SceneManager && window.SceneManager.elements) {
        Array.from(window.SceneManager.elements.keys()).forEach(key => {
            const element = window.SceneManager.elements.get(key);
            console.log(`  - ID: ${key}, Position: (${element.position.x}, ${element.position.y}, ${element.position.z})`);
        });
    } else {
        console.log('❌ SceneManager.elements non disponible');
    }
}

// Message d'instructions
console.log(`
📋 INSTRUCTIONS:
1. Pour déplacer les éléments 290106 et 290105 de 11cm vers l'avant, tapez:
   moveSpecificElements()

2. Pour lister tous les éléments disponibles, tapez:
   listAllElements()
`);