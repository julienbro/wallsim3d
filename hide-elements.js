// Script pour masquer des éléments spécifiques
function hideElements() {
    const elementIds = [
        '343404', '343403', '343406', '343405', '343401', 
        '343402', '343407', '343408', '343410', '343409'
    ];
    
    console.log('🙈 Masquage des éléments...');
    
    elementIds.forEach(id => {
        let element = null;
        let foundKey = null;
        
        // Chercher l'élément dans SceneManager.elements
        if (window.SceneManager && window.SceneManager.elements) {
            // Chercher par ID exact
            element = window.SceneManager.elements.get(id);
            if (element) {
                foundKey = id;
            } else {
                // Chercher par ID partiel
                for (let [key, el] of window.SceneManager.elements) {
                    if (key.includes(id)) {
                        element = el;
                        foundKey = key;
                        break;
                    }
                }
            }
        }
        
        if (element) {
            console.log(`👻 Masquage élément: ${foundKey}`);
            
            // Méthode 1: Rendre invisible via le mesh
            if (element.mesh) {
                element.mesh.visible = false;
                console.log(`  ✅ Mesh rendu invisible`);
            }
            
            // Méthode 2: Définir une propriété hidden sur l'élément
            element.hidden = true;
            
            // Méthode 3: Si l'élément a une méthode hide
            if (typeof element.hide === 'function') {
                element.hide();
                console.log(`  ✅ Méthode hide() appelée`);
            }
            
            // Méthode 4: Si l'élément a une propriété visible
            if (element.hasOwnProperty('visible')) {
                element.visible = false;
                console.log(`  ✅ Propriété visible mise à false`);
            }
            
        } else {
            console.warn(`❌ Élément ${id} non trouvé`);
        }
    });
    
    console.log('✅ Masquage terminé');
}

// Fonction pour ré-afficher les éléments si nécessaire
function showElements() {
    const elementIds = [
        '343404', '343403', '343406', '343405', '343401', 
        '343402', '343407', '343408', '343410', '343409'
    ];
    
    console.log('👁️ Affichage des éléments...');
    
    elementIds.forEach(id => {
        let element = null;
        let foundKey = null;
        
        if (window.SceneManager && window.SceneManager.elements) {
            for (let [key, el] of window.SceneManager.elements) {
                if (key.includes(id)) {
                    element = el;
                    foundKey = key;
                    break;
                }
            }
        }
        
        if (element) {
            console.log(`👁️ Affichage élément: ${foundKey}`);
            
            if (element.mesh) {
                element.mesh.visible = true;
            }
            element.hidden = false;
            if (typeof element.show === 'function') {
                element.show();
            }
            if (element.hasOwnProperty('visible')) {
                element.visible = true;
            }
        }
    });
    
    console.log('✅ Affichage terminé');
}

// Exécuter le masquage
hideElements();

// Exposer les fonctions pour usage ultérieur
window.hideSpecificElements = hideElements;
window.showSpecificElements = showElements;