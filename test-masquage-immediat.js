// ========================================
// TEST IMMÉDIAT - MASQUAGE FORCE BRUTE
// ========================================
// Copiez-collez ce code dans la console du navigateur

console.log('🔥 TEST IMMÉDIAT - MASQUAGE FORCE BRUTE');
console.log('=====================================');

function testMasquageImmedia() {
    let totalMasque = 0;
    
    console.log('🔍 1. Recherche et masquage de ConstructionTools...');
    if (window.ConstructionTools) {
        Object.getOwnPropertyNames(window.ConstructionTools).forEach(key => {
            try {
                const element = window.ConstructionTools[key];
                if (element && typeof element === 'object') {
                    let masked = false;
                    
                    // Masquer l'élément principal
                    if (element.hasOwnProperty('visible') && element.visible) {
                        element.visible = false;
                        masked = true;
                        totalMasque++;
                    }
                    
                    // Masquer le mesh
                    if (element.mesh && element.mesh.hasOwnProperty('visible') && element.mesh.visible) {
                        element.mesh.visible = false;
                        masked = true;
                        totalMasque++;
                    }
                    
                    if (masked) {
                        console.log(`🚫 Masqué: ConstructionTools.${key}`);
                    }
                }
            } catch (e) {
                console.warn(`⚠️ Erreur sur ConstructionTools.${key}:`, e.message);
            }
        });
    } else {
        console.log('❌ ConstructionTools non trouvé');
    }
    
    console.log('🔍 2. Recherche et masquage de PlacementManager...');
    if (window.PlacementManager) {
        Object.getOwnPropertyNames(window.PlacementManager).forEach(key => {
            try {
                const element = window.PlacementManager[key];
                if (element && typeof element === 'object' && element.hasOwnProperty('visible') && element.visible) {
                    element.visible = false;
                    totalMasque++;
                    console.log(`🚫 Masqué: PlacementManager.${key}`);
                }
            } catch (e) {
                console.warn(`⚠️ Erreur sur PlacementManager.${key}:`, e.message);
            }
        });
    } else {
        console.log('❌ PlacementManager non trouvé');
    }
    
    console.log('🔍 3. Balayage de la scène pour éléments fantômes...');
    if (window.SceneManager && window.SceneManager.scene) {
        let sceneCount = 0;
        window.SceneManager.scene.traverse((object) => {
            if (object.isMesh && object.visible) {
                let shouldHide = false;
                let reason = '';
                
                // Opacité suspecte
                if (object.material && object.material.opacity !== undefined && object.material.opacity < 1.0) {
                    shouldHide = true;
                    reason = `opacité ${object.material.opacity}`;
                }
                
                // Nom suspect
                if (object.name) {
                    const motsSuspects = ['ghost', 'preview', 'phantom', 'cursor', 'temp', 'fantome', 'suggestion', 'hover'];
                    const motTrouve = motsSuspects.find(mot => object.name.toLowerCase().includes(mot));
                    if (motTrouve) {
                        shouldHide = true;
                        reason = `nom "${object.name}" contient "${motTrouve}"`;
                    }
                }
                
                // UserData suspect
                if (object.userData && !reason) {
                    const clesSuspectes = ['ghost', 'preview', 'phantom', 'cursor', 'temp', 'suggestion', 'floating', 'dragging'];
                    const cleTrouvee = clesSuspectes.find(cle => Object.keys(object.userData).some(k => k.toLowerCase().includes(cle)));
                    if (cleTrouvee) {
                        shouldHide = true;
                        reason = `userData contient "${cleTrouvee}"`;
                    }
                }
                
                if (shouldHide) {
                    object.visible = false;
                    sceneCount++;
                    totalMasque++;
                    console.log(`🚫 Masqué dans la scène: ${object.name || 'sans nom'} (${reason})`);
                }
            }
        });
        console.log(`📊 ${sceneCount} éléments masqués dans la scène`);
    } else {
        console.log('❌ SceneManager.scene non trouvé');
    }
    
    console.log('🔍 4. Forçage du rendu...');
    if (window.SceneManager && window.SceneManager.renderer) {
        try {
            window.SceneManager.renderer.render(window.SceneManager.scene, window.SceneManager.camera);
            console.log('✅ Rendu forcé avec succès');
        } catch (e) {
            console.warn('⚠️ Erreur lors du rendu:', e.message);
        }
    }
    
    console.log('');
    console.log('🎯 RÉSULTAT FINAL:');
    console.log(`🚫 Total masqué: ${totalMasque} éléments`);
    
    if (totalMasque > 0) {
        console.log('✅ Des éléments fantômes ont été masqués !');
        console.log('💡 Maintenant testez un export PDF pour voir si ça fonctionne');
        console.log('📄 Commande: window.presentationManager.generatePDF()');
    } else {
        console.log('⚠️ Aucun élément fantôme détecté');
        console.log('💡 Soit il n\'y en a pas, soit ils utilisent d\'autres noms/propriétés');
    }
    
    return totalMasque;
}

// Test automatique avec possibilité de restaurer
function testAvecRestauration(delaiRestauration = 5000) {
    console.log(`⏰ Test avec restauration automatique dans ${delaiRestauration/1000} secondes...`);
    
    // Sauvegarder l'état actuel
    const elementsARestaurer = [];
    
    // ConstructionTools
    if (window.ConstructionTools) {
        Object.getOwnPropertyNames(window.ConstructionTools).forEach(key => {
            const element = window.ConstructionTools[key];
            if (element && typeof element === 'object') {
                if (element.hasOwnProperty('visible') && element.visible) {
                    elementsARestaurer.push({type: 'CT', key, element, prop: 'visible'});
                }
                if (element.mesh && element.mesh.hasOwnProperty('visible') && element.mesh.visible) {
                    elementsARestaurer.push({type: 'CT_mesh', key, element: element.mesh, prop: 'visible'});
                }
            }
        });
    }
    
    // Effectuer le masquage
    const totalMasque = testMasquageImmedia();
    
    // Programmer la restauration
    setTimeout(() => {
        console.log('🔄 RESTAURATION AUTOMATIQUE...');
        let restaureCount = 0;
        elementsARestaurer.forEach(item => {
            try {
                item.element[item.prop] = true;
                restaureCount++;
                console.log(`✅ Restauré: ${item.type}.${item.key || 'element'}`);
            } catch (e) {
                console.warn(`⚠️ Erreur restauration ${item.type}.${item.key}:`, e.message);
            }
        });
        console.log(`✅ ${restaureCount} éléments restaurés`);
        
        // Forcer un nouveau rendu
        if (window.SceneManager && window.SceneManager.renderer) {
            window.SceneManager.renderer.render(window.SceneManager.scene, window.SceneManager.camera);
        }
    }, delaiRestauration);
    
    return {totalMasque, elementsARestaurer: elementsARestaurer.length};
}

// Exposer les fonctions
window.testMasquageImmedia = testMasquageImmedia;
window.testAvecRestauration = testAvecRestauration;

// Lancer automatiquement le test
console.log('🚀 Lancement du test automatique...');
const result = testMasquageImmedia();

console.log('');
console.log('🎮 COMMANDES DISPONIBLES:');
console.log('- testMasquageImmedia(): Masquer immédiatement tous les fantômes');
console.log('- testAvecRestauration(5000): Test avec restauration après 5 secondes');
console.log('- window.presentationManager.generatePDF(): Tester export PDF');

if (result > 0) {
    console.log('');
    console.log('⚡ DES FANTÔMES ONT ÉTÉ MASQUÉS !');
    console.log('📄 Testez maintenant l\'export PDF pour voir le résultat');
}