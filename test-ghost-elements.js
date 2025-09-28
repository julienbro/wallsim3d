// Script de test pour vérifier le masquage des briques fantômes
// Exécutez dans la console du navigateur : testGhostElementMasking()

function testGhostElementMasking() {
    console.log('🔍 Test du masquage des éléments fantômes pour export PDF');
    console.log('=======================================================');
    
    // Test 1: Vérifier les éléments fantômes connus
    console.group('📋 1. Diagnostic des éléments fantômes connus');
    
    const ghostElements = [];
    
    // ConstructionTools
    if (window.ConstructionTools) {
        if (window.ConstructionTools.ghostElement && window.ConstructionTools.ghostElement.mesh) {
            ghostElements.push({
                source: 'ConstructionTools.ghostElement.mesh',
                element: window.ConstructionTools.ghostElement.mesh,
                visible: window.ConstructionTools.ghostElement.mesh.visible,
                position: window.ConstructionTools.ghostElement.mesh.position,
                opacity: window.ConstructionTools.ghostElement.mesh.material ? window.ConstructionTools.ghostElement.mesh.material.opacity : 'N/A'
            });
        }
        
        if (window.ConstructionTools.ghostBrick) {
            ghostElements.push({
                source: 'ConstructionTools.ghostBrick',
                element: window.ConstructionTools.ghostBrick,
                visible: window.ConstructionTools.ghostBrick.visible,
                position: window.ConstructionTools.ghostBrick.position
            });
        }
        
        if (window.ConstructionTools.previewElement && window.ConstructionTools.previewElement.mesh) {
            ghostElements.push({
                source: 'ConstructionTools.previewElement.mesh',
                element: window.ConstructionTools.previewElement.mesh,
                visible: window.ConstructionTools.previewElement.mesh.visible,
                position: window.ConstructionTools.previewElement.mesh.position
            });
        }
        
        if (window.ConstructionTools.currentGhost) {
            ghostElements.push({
                source: 'ConstructionTools.currentGhost',
                element: window.ConstructionTools.currentGhost,
                visible: window.ConstructionTools.currentGhost.visible,
                position: window.ConstructionTools.currentGhost.position
            });
        }
    }
    
    // PlacementManager
    if (window.PlacementManager) {
        if (window.PlacementManager.ghostElement) {
            ghostElements.push({
                source: 'PlacementManager.ghostElement',
                element: window.PlacementManager.ghostElement,
                visible: window.PlacementManager.ghostElement.visible,
                position: window.PlacementManager.ghostElement.position
            });
        }
        
        if (window.PlacementManager.previewMesh) {
            ghostElements.push({
                source: 'PlacementManager.previewMesh',
                element: window.PlacementManager.previewMesh,
                visible: window.PlacementManager.previewMesh.visible,
                position: window.PlacementManager.previewMesh.position
            });
        }
    }
    
    if (ghostElements.length === 0) {
        console.log('✅ Aucun élément fantôme détecté dans les managers connus');
    } else {
        ghostElements.forEach((ghost, index) => {
            console.log(`${ghost.visible ? '👻' : '🚫'} ${ghost.source}:`, {
                visible: ghost.visible,
                position: ghost.position ? `(${ghost.position.x.toFixed(1)}, ${ghost.position.y.toFixed(1)}, ${ghost.position.z.toFixed(1)})` : 'N/A',
                opacity: ghost.opacity
            });
        });
    }
    console.groupEnd();
    
    // Test 2: Balayage de la scène pour éléments suspects
    console.group('🔍 2. Balayage de la scène pour éléments fantômes');
    
    if (!window.SceneManager || !window.SceneManager.scene) {
        console.error('❌ SceneManager.scene non disponible');
        console.groupEnd();
        return;
    }
    
    let suspiciousElements = [];
    let totalMeshes = 0;
    
    window.SceneManager.scene.traverse((object) => {
        if (object.isMesh) {
            totalMeshes++;
            
            let suspicious = false;
            let reasons = [];
            
            // Opacité suspecte
            if (object.material && object.material.opacity !== undefined && object.material.opacity < 1.0) {
                suspicious = true;
                reasons.push(`opacity=${object.material.opacity}`);
            }
            
            // UserData suspect
            if (object.userData && (
                object.userData.ghost || object.userData.isGhost ||
                object.userData.preview || object.userData.isPreview ||
                object.userData.phantom || object.userData.temporary ||
                object.userData.cursor || object.userData.suggestion ||
                object.userData.floating || object.userData.dragging
            )) {
                suspicious = true;
                const suspectKeys = Object.keys(object.userData).filter(key => 
                    key.includes('ghost') || key.includes('preview') || key.includes('phantom') ||
                    key.includes('temp') || key.includes('cursor') || key.includes('suggestion')
                );
                reasons.push(`userData: ${suspectKeys.join(', ')}`);
            }
            
            // Nom suspect
            if (object.name && (
                object.name.toLowerCase().includes('ghost') ||
                object.name.toLowerCase().includes('preview') ||
                object.name.toLowerCase().includes('phantom') ||
                object.name.toLowerCase().includes('temp') ||
                object.name.toLowerCase().includes('cursor') ||
                object.name.toLowerCase().includes('fantome')
            )) {
                suspicious = true;
                reasons.push(`name="${object.name}"`);
            }
            
            // Position extrême
            if (object.position && (
                object.position.y > 1000 || object.position.y < -1000 ||
                Math.abs(object.position.x) > 5000 || Math.abs(object.position.z) > 5000
            )) {
                suspicious = true;
                reasons.push(`position=(${object.position.x.toFixed(1)}, ${object.position.y.toFixed(1)}, ${object.position.z.toFixed(1)})`);
            }
            
            if (suspicious) {
                suspiciousElements.push({
                    object: object,
                    name: object.name || 'unnamed',
                    visible: object.visible,
                    reasons: reasons,
                    position: object.position ? `(${object.position.x.toFixed(1)}, ${object.position.y.toFixed(1)}, ${object.position.z.toFixed(1)})` : 'N/A'
                });
            }
        }
    });
    
    console.log(`📊 Total: ${totalMeshes} meshes dans la scène, ${suspiciousElements.length} éléments suspects détectés`);
    
    if (suspiciousElements.length > 0) {
        suspiciousElements.forEach((suspect, index) => {
            console.log(`${suspect.visible ? '👻' : '🚫'} ${suspect.name}:`, {
                visible: suspect.visible,
                position: suspect.position,
                reasons: suspect.reasons.join(' | ')
            });
        });
    } else {
        console.log('✅ Aucun élément suspect détecté dans la scène');
    }
    console.groupEnd();
    
    // Test 3: Simulation du masquage
    console.group('🧪 3. Test de simulation du masquage');
    
    console.log('🔄 Application des règles de masquage...');
    
    let maskedCount = 0;
    const maskedElements = [];
    
    // Masquer les éléments connus
    ghostElements.forEach(ghost => {
        if (ghost.element && ghost.element.visible) {
            ghost.element.visible = false;
            maskedCount++;
            maskedElements.push(ghost);
            console.log(`🚫 Masqué: ${ghost.source}`);
        }
    });
    
    // Masquer les éléments suspects visibles
    suspiciousElements.forEach(suspect => {
        if (suspect.object.visible) {
            suspect.object.visible = false;
            maskedCount++;
            maskedElements.push(suspect);
            console.log(`🚫 Masqué: ${suspect.name} (${suspect.reasons.join(', ')})`);
        }
    });
    
    console.log(`✅ Total masqué: ${maskedCount} éléments`);
    
    // Restaurer après 3 secondes pour voir la différence
    setTimeout(() => {
        console.log('🔄 Restauration des éléments masqués...');
        maskedElements.forEach(element => {
            if (element.element) {
                element.element.visible = true;
            } else if (element.object) {
                element.object.visible = true;
            }
        });
        console.log('✅ Éléments restaurés');
    }, 3000);
    
    console.groupEnd();
    
    // Test 4: Recommandations
    console.group('💡 4. Recommandations');
    
    if (ghostElements.length > 0 || suspiciousElements.length > 0) {
        console.log('⚠️ Éléments fantômes détectés. Vérifications recommandées:');
        console.log('1. 🔍 Observez la scène 3D pendant les 3 prochaines secondes');
        console.log('2. 📄 Testez un export PDF pour voir si les fantômes sont masqués');
        console.log('3. 🛠️ Si des fantômes persistent, ajoutez des critères de masquage spécifiques');
        
        if (ghostElements.some(g => g.visible)) {
            console.log('⚠️ ATTENTION: Des éléments fantômes sont encore VISIBLES');
        }
    } else {
        console.log('✅ Aucun élément fantôme détecté - L\'export PDF devrait être propre');
    }
    
    console.groupEnd();
    
    return {
        ghostElementsFound: ghostElements.length,
        suspiciousElementsFound: suspiciousElements.length,
        totalMasked: maskedCount,
        recommendation: maskedCount > 0 ? 'Test PDF pour vérification' : 'Export PDF devrait être propre'
    };
}

// Fonction pour tester spécifiquement pendant un export PDF
function testDuringPDFExport() {
    console.log('🔄 Test pendant export PDF...');
    
    if (!window.presentationManager) {
        console.error('❌ presentationManager non disponible');
        return;
    }
    
    // Intercepter la fonction de masquage
    const originalDisableVisualAids = window.presentationManager.disableVisualAidsForExport;
    
    window.presentationManager.disableVisualAidsForExport = function() {
        console.log('📋 Début du masquage pour export PDF');
        
        // Appeler la fonction originale
        const result = originalDisableVisualAids.call(this);
        
        // Test après masquage
        setTimeout(() => {
            testGhostElementMasking();
        }, 100);
        
        return result;
    };
    
    console.log('✅ Test configuré - Lancez maintenant un export PDF');
    
    // Restaurer après un certain temps
    setTimeout(() => {
        window.presentationManager.disableVisualAidsForExport = originalDisableVisualAids;
        console.log('🔄 Fonction de masquage restaurée');
    }, 30000); // 30 secondes
}

// Exposer les fonctions
window.testGhostElementMasking = testGhostElementMasking;
window.testDuringPDFExport = testDuringPDFExport;

console.log('🎯 Script de test des éléments fantômes chargé !');
console.log('📚 Fonctions disponibles:');
console.log('- testGhostElementMasking(): Test général des éléments fantômes');
console.log('- testDuringPDFExport(): Test pendant un export PDF');