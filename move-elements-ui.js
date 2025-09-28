// Ajout temporaire d'un bouton pour déplacer les éléments 290106 et 290105
// Ce script s'exécute automatiquement au chargement

(function() {
    // Attendre que l'interface soit chargée
    document.addEventListener('DOMContentLoaded', function() {
        addMoveElementsButton();
    });
    
    // Si le DOM est déjà chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addMoveElementsButton);
    } else {
        addMoveElementsButton();
    }
    
    function addMoveElementsButton() {
        // Créer le bouton temporaire
        const button = document.createElement('button');
        button.id = 'moveElementsBtn';
        button.innerHTML = '📦 Déplacer 290106/290105 (+11cm Z)';
        button.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10000;
            padding: 10px 15px;
            background: #ff6b35;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        `;
        
        button.onclick = function() {
            moveSpecificElements();
        };
        
        // Ajouter le bouton au body
        document.body.appendChild(button);
        
        console.log('✅ Bouton de déplacement ajouté dans le coin supérieur droit');
    }
    
    function moveSpecificElements() {
        const elementIds = ['290106', '290105'];
        const moveDistance = 11; // 11cm vers l'avant (Z+)
        
        console.log('🚀 Démarrage du déplacement des éléments 290106 et 290105 de 11cm vers l\'avant...');
        
        let totalMoved = 0;
        
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
                    totalMoved++;
                } else if (element.mesh) {
                    // Mise à jour directe du mesh et de la position
                    element.mesh.position.z = newZ / 100; // Conversion cm vers mètres pour Three.js
                    element.position.z = newZ;
                    console.log(`✅ Élément ${id} déplacé de ${moveDistance}cm vers l'avant (méthode mesh)`);
                    totalMoved++;
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
        
        // Notification de fin
        const button = document.getElementById('moveElementsBtn');
        if (button) {
            if (totalMoved > 0) {
                button.innerHTML = `✅ ${totalMoved} éléments déplacés`;
                button.style.background = '#28a745';
                setTimeout(() => {
                    button.innerHTML = '📦 Déplacer 290106/290105 (+11cm Z)';
                    button.style.background = '#ff6b35';
                }, 3000);
            } else {
                button.innerHTML = '❌ Éléments non trouvés';
                button.style.background = '#dc3545';
                setTimeout(() => {
                    button.innerHTML = '📦 Déplacer 290106/290105 (+11cm Z)';
                    button.style.background = '#ff6b35';
                }, 3000);
            }
        }
        
        console.log(`🏁 Déplacement terminé - ${totalMoved} éléments déplacés`);
    }
    
    // Exposer les fonctions globalement
    window.moveSpecificElements = moveSpecificElements;
})();