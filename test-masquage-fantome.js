/**
 * Script de test pour vérifier que les éléments fantômes sont bien masqués avant l'export PDF
 * Utiliser dans la console du navigateur : testMasquageFantome()
 */

function testMasquageFantome() {
    console.log('🎯 === TEST MASQUAGE ÉLÉMENTS FANTÔMES ===');
    console.log('');
    
    let resultats = {
        constructionTools: { detectes: 0, masques: 0 },
        placementManager: { detectes: 0, masques: 0 },
        scene: { detectes: 0, masques: 0 },
        total: { detectes: 0, masques: 0 }
    };
    
    // ====== 1. TEST CONSTRUCTION TOOLS ======
    console.log('🔍 1. Vérification ConstructionTools...');
    
    if (window.ConstructionTools) {
        Object.getOwnPropertyNames(window.ConstructionTools).forEach(key => {
            try {
                const element = window.ConstructionTools[key];
                if (element && typeof element === 'object') {
                    // Vérifier l'élément principal
                    if (element.hasOwnProperty('visible')) {
                        resultats.constructionTools.detectes++;
                        resultats.total.detectes++;
                        
                        if (element.visible === true) {
                            console.log(`⚠️  ConstructionTools.${key} est VISIBLE (devrait être masqué pour l'export)`);
                        } else {
                            console.log(`✅ ConstructionTools.${key} est masqué`);
                            resultats.constructionTools.masques++;
                            resultats.total.masques++;
                        }
                    }
                    
                    // Vérifier le mesh
                    if (element.mesh && element.mesh.hasOwnProperty('visible')) {
                        resultats.constructionTools.detectes++;
                        resultats.total.detectes++;
                        
                        if (element.mesh.visible === true) {
                            console.log(`⚠️  ConstructionTools.${key}.mesh est VISIBLE (devrait être masqué pour l'export)`);
                        } else {
                            console.log(`✅ ConstructionTools.${key}.mesh est masqué`);
                            resultats.constructionTools.masques++;
                            resultats.total.masques++;
                        }
                    }
                }
            } catch (e) {
                console.warn(`Erreur lors de la vérification de ConstructionTools.${key}:`, e);
            }
        });
    } else {
        console.log('ℹ️  ConstructionTools non disponible');
    }
    
    // ====== 2. TEST PLACEMENT MANAGER ======
    console.log('');
    console.log('🔍 2. Vérification PlacementManager...');
    
    if (window.PlacementManager) {
        Object.getOwnPropertyNames(window.PlacementManager).forEach(key => {
            try {
                const element = window.PlacementManager[key];
                if (element && typeof element === 'object' && element.hasOwnProperty('visible')) {
                    resultats.placementManager.detectes++;
                    resultats.total.detectes++;
                    
                    if (element.visible === true) {
                        console.log(`⚠️  PlacementManager.${key} est VISIBLE (devrait être masqué pour l'export)`);
                    } else {
                        console.log(`✅ PlacementManager.${key} est masqué`);
                        resultats.placementManager.masques++;
                        resultats.total.masques++;
                    }
                }
            } catch (e) {
                console.warn(`Erreur lors de la vérification de PlacementManager.${key}:`, e);
            }
        });
    } else {
        console.log('ℹ️  PlacementManager non disponible');
    }
    
    // ====== 3. TEST SCÈNE ======
    console.log('');
    console.log('🔍 3. Vérification des objets de la scène...');
    
    if (window.SceneManager && window.SceneManager.scene) {
        window.SceneManager.scene.traverse((object) => {
            if (object.isMesh) {
                let suspect = false;
                let raisons = [];
                
                // Vérifier l'opacité
                if (object.material && object.material.opacity !== undefined && object.material.opacity < 1.0) {
                    suspect = true;
                    raisons.push(`opacité ${object.material.opacity}`);
                }
                
                // Vérifier le nom
                if (object.name) {
                    const motsSuspects = ['ghost', 'preview', 'phantom', 'cursor', 'temp', 'fantome', 'suggestion', 'hover', 'highlight'];
                    const motTrouve = motsSuspects.find(mot => object.name.toLowerCase().includes(mot));
                    if (motTrouve) {
                        suspect = true;
                        raisons.push(`nom contient "${motTrouve}"`);
                    }
                }
                
                if (suspect) {
                    resultats.scene.detectes++;
                    resultats.total.detectes++;
                    
                    if (object.visible === true) {
                        console.log(`⚠️  Objet scène "${object.name || 'sans nom'}" est VISIBLE (${raisons.join(', ')}) - devrait être masqué`);
                    } else {
                        console.log(`✅ Objet scène "${object.name || 'sans nom'}" est masqué (${raisons.join(', ')})`);
                        resultats.scene.masques++;
                        resultats.total.masques++;
                    }
                }
            }
        });
    } else {
        console.log('ℹ️  SceneManager non disponible');
    }
    
    // ====== RÉSUMÉ ======
    console.log('');
    console.log('📊 === RÉSUMÉ DES TESTS ===');
    console.log(`🔍 Total détectés: ${resultats.total.detectes} éléments fantômes`);
    console.log(`✅ Total masqués: ${resultats.total.masques} éléments`);
    console.log(`⚠️  Total visibles: ${resultats.total.detectes - resultats.total.masques} éléments`);
    console.log('');
    console.log('Détails:');
    console.log(`- ConstructionTools: ${resultats.constructionTools.masques}/${resultats.constructionTools.detectes} masqués`);
    console.log(`- PlacementManager: ${resultats.placementManager.masques}/${resultats.placementManager.detectes} masqués`);
    console.log(`- Scène: ${resultats.scene.masques}/${resultats.scene.detectes} masqués`);
    
    // ====== RECOMMANDATIONS ======
    console.log('');
    if (resultats.total.detectes === resultats.total.masques) {
        console.log('🎉 PARFAIT ! Tous les éléments fantômes sont masqués.');
        console.log('✅ L\'export PDF ne devrait contenir aucun élément fantôme.');
    } else {
        console.log('⚠️  ATTENTION ! Certains éléments fantômes sont encore visibles.');
        console.log('🔧 Recommandations:');
        console.log('   1. Lancez testMasquageForce() pour forcer le masquage');
        console.log('   2. Puis testez l\'export PDF');
        console.log('   3. Si le problème persiste, contactez le développeur');
    }
    
    console.log('');
    console.log('🎯 === FIN DU TEST ===');
    
    return resultats;
}

function testMasquageForce() {
    console.log('🔥 === MASQUAGE FORCÉ ===');
    
    let masques = 0;
    
    // Forcer le masquage des ConstructionTools
    if (window.ConstructionTools) {
        Object.getOwnPropertyNames(window.ConstructionTools).forEach(key => {
            try {
                const element = window.ConstructionTools[key];
                if (element && typeof element === 'object') {
                    if (element.hasOwnProperty('visible') && element.visible === true) {
                        element.visible = false;
                        masques++;
                        console.log(`🚫 Masqué de force: ConstructionTools.${key}`);
                    }
                    if (element.mesh && element.mesh.hasOwnProperty('visible') && element.mesh.visible === true) {
                        element.mesh.visible = false;
                        masques++;
                        console.log(`🚫 Masqué de force: ConstructionTools.${key}.mesh`);
                    }
                }
            } catch (e) {
                // Continuer
            }
        });
    }
    
    // Forcer le masquage de PlacementManager
    if (window.PlacementManager) {
        Object.getOwnPropertyNames(window.PlacementManager).forEach(key => {
            try {
                const element = window.PlacementManager[key];
                if (element && typeof element === 'object' && element.hasOwnProperty('visible') && element.visible === true) {
                    element.visible = false;
                    masques++;
                    console.log(`🚫 Masqué de force: PlacementManager.${key}`);
                }
            } catch (e) {
                // Continuer
            }
        });
    }
    
    // Forcer le masquage des objets suspects de la scène
    if (window.SceneManager && window.SceneManager.scene) {
        window.SceneManager.scene.traverse((object) => {
            if (object.isMesh && object.visible) {
                let shouldHide = false;
                
                // Masquer par opacité
                if (object.material && object.material.opacity !== undefined && object.material.opacity < 1.0) {
                    shouldHide = true;
                }
                
                // Masquer par nom
                if (object.name) {
                    const motsSuspects = ['ghost', 'preview', 'phantom', 'cursor', 'temp', 'fantome', 'suggestion', 'hover', 'highlight'];
                    if (motsSuspects.some(mot => object.name.toLowerCase().includes(mot))) {
                        shouldHide = true;
                    }
                }
                
                if (shouldHide) {
                    object.visible = false;
                    masques++;
                    console.log(`🚫 Masqué de force: Objet scène "${object.name || 'sans nom'}"`);
                }
            }
        });
    }
    
    // Forcer un rendu
    if (window.SceneManager && window.SceneManager.renderer && window.SceneManager.scene && window.SceneManager.camera) {
        window.SceneManager.renderer.render(window.SceneManager.scene, window.SceneManager.camera);
        console.log('🔄 Rendu forcé appliqué');
    }
    
    console.log(`✅ ${masques} éléments masqués de force`);
    console.log('💡 Testez maintenant l\'export PDF');
    
    return masques;
}

function testExportPropre() {
    console.log('📄 === TEST EXPORT PDF PROPRE ===');
    console.log('');
    
    // 1. Vérifier le masquage
    console.log('1. Vérification du masquage...');
    const resultats = testMasquageFantome();
    
    // 2. Masquer de force si nécessaire
    if (resultats.total.detectes > resultats.total.masques) {
        console.log('');
        console.log('2. Masquage forcé des éléments restants...');
        testMasquageForce();
    }
    
    // 3. Lancer l'export
    console.log('');
    console.log('3. Lancement de l\'export PDF...');
    
    if (window.presentationManager && typeof window.presentationManager.generatePDF === 'function') {
        console.log('🚀 Export PDF en cours...');
        console.log('📋 Vérifiez le PDF téléchargé pour confirmer l\'absence d\'éléments fantômes');
        
        try {
            window.presentationManager.generatePDF();
            console.log('✅ Export lancé avec succès');
        } catch (e) {
            console.error('❌ Erreur lors de l\'export:', e);
        }
    } else {
        console.error('❌ PresentationManager.generatePDF non disponible');
    }
}

// Fonction principale - Appeler celle-ci dans la console
window.testMasquageFantome = testMasquageFantome;
window.testMasquageForce = testMasquageForce; 
window.testExportPropre = testExportPropre;

console.log('🎯 Scripts de test chargés !');
console.log('');
console.log('📋 Utilisation dans la console:');
console.log('  • testMasquageFantome() - Vérifier l\'état actuel');
console.log('  • testMasquageForce() - Masquer de force tous les fantômes');
console.log('  • testExportPropre() - Test complet + export PDF');
console.log('');