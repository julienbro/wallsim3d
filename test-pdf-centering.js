// Script de test rapide pour le centrage PDF - WallSim3D
// Exécutez ce script dans la console du navigateur

console.log('🎯 Test du centrage PDF - WallSim3D');
console.log('=====================================');

function testPDFCentering() {
    console.group('🔍 Diagnostic du système');
    
    // Vérifications de base
    const checks = {
        'SceneManager': !!window.SceneManager,
        'presentationManager': !!window.presentationManager,
        'calculateBuildingCenter': !!(window.presentationManager && window.presentationManager.calculateBuildingCenter),
        'THREE.js': !!window.THREE,
        'Scene avec objets': !!(window.SceneManager && window.SceneManager.scene && window.SceneManager.scene.children.length > 0)
    };
    
    Object.entries(checks).forEach(([key, value]) => {
        console.log(`${value ? '✅' : '❌'} ${key}: ${value}`);
    });
    console.groupEnd();
    
    if (!checks.SceneManager || !checks.presentationManager || !checks.calculateBuildingCenter) {
        console.error('❌ Composants manquants. Assurez-vous que WallSim3D est chargé.');
        return;
    }
    
    console.group('🏗️ Analyse du bâtiment');
    
    try {
        const analysis = window.presentationManager.calculateBuildingCenter(window.SceneManager);
        
        if (analysis && analysis.elementCount > 0) {
            console.log(`✅ ${analysis.elementCount} éléments détectés`);
            console.log(`📍 Centre du bâtiment:`, {
                x: Math.round(analysis.center.x * 10) / 10,
                y: Math.round(analysis.center.y * 10) / 10,
                z: Math.round(analysis.center.z * 10) / 10
            });
            console.log(`📏 Dimensions:`, {
                largeur: Math.round(analysis.size.x * 10) / 10,
                hauteur: Math.round(analysis.size.y * 10) / 10,
                profondeur: Math.round(analysis.size.z * 10) / 10
            });
            console.log(`📦 Bounding Box:`, {
                min: {
                    x: Math.round(analysis.boundingBox.min.x * 10) / 10,
                    y: Math.round(analysis.boundingBox.min.y * 10) / 10,
                    z: Math.round(analysis.boundingBox.min.z * 10) / 10
                },
                max: {
                    x: Math.round(analysis.boundingBox.max.x * 10) / 10,
                    y: Math.round(analysis.boundingBox.max.y * 10) / 10,
                    z: Math.round(analysis.boundingBox.max.z * 10) / 10
                }
            });
            
            // Test des positions de caméra
            console.group('📹 Test des positions de caméras orthographiques');
            const views = ['front', 'back', 'left', 'right', 'top'];
            
            views.forEach(viewType => {
                const camera = new window.THREE.OrthographicCamera(-100, 100, 100, -100, 0.1, 1000);
                window.presentationManager.setOrthographicCameraPosition(camera, viewType, window.SceneManager);
                
                console.log(`🔸 ${viewType.toUpperCase()}:`, {
                    position: {
                        x: Math.round(camera.position.x * 10) / 10,
                        y: Math.round(camera.position.y * 10) / 10,
                        z: Math.round(camera.position.z * 10) / 10
                    },
                    distance: Math.round(camera.position.distanceTo(analysis.center) * 10) / 10
                });
            });
            console.groupEnd();
            
            // Test de la vue perspective
            console.group('🌐 Test de la vue perspective');
            const originalPos = window.SceneManager.camera.position.clone();
            const originalTarget = window.SceneManager.controls ? window.SceneManager.controls.target.clone() : null;
            
            // Simuler le recentrage perspective
            const center = analysis.boundingBox.getCenter(new window.THREE.Vector3());
            const size = analysis.boundingBox.getSize(new window.THREE.Vector3());
            const diagonale3D = Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z);
            const framingFactor = 1.4;
            const distance = diagonale3D * framingFactor;
            const dir = new window.THREE.Vector3(1.2, 0.8, 1.2).normalize();
            
            console.log('📏 Calculs pour vue perspective:', {
                diagonale3D: Math.round(diagonale3D * 10) / 10,
                distance: Math.round(distance * 10) / 10,
                framingFactor: framingFactor,
                direction: {
                    x: Math.round(dir.x * 100) / 100,
                    y: Math.round(dir.y * 100) / 100,
                    z: Math.round(dir.z * 100) / 100
                }
            });
            
            console.log('✅ Test de centrage terminé avec succès !');
            console.groupEnd();
            
        } else {
            console.warn('⚠️ Aucun élément de construction détecté.');
            console.log('💡 Assurez-vous que votre projet contient des briques/blocs posés.');
            
            // Diagnostic supplémentaire
            console.group('🔍 Diagnostic détaillé de la scène');
            let totalMeshes = 0;
            let visibleMeshes = 0;
            let bricksFound = 0;
            
            window.SceneManager.scene.traverse((object) => {
                if (object.isMesh) {
                    totalMeshes++;
                    if (object.visible) {
                        visibleMeshes++;
                        if (object.userData && (
                            object.userData.type === 'brick' ||
                            object.userData.elementType === 'brick' ||
                            object.userData.category === 'brick' ||
                            (object.userData.element && object.userData.element.constructor && 
                             object.userData.element.constructor.name === 'WallElement')
                        )) {
                            bricksFound++;
                        }
                    }
                }
            });
            
            console.log(`📊 Objets dans la scène: ${totalMeshes} total, ${visibleMeshes} visibles, ${bricksFound} briques détectées`);
            console.groupEnd();
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'analyse:', error);
    }
    
    console.groupEnd();
    
    console.log('🎯 Test terminé !');
    console.log('💡 Pour tester l\'export PDF complet, utilisez le bouton "Générer PDF" dans l\'interface.');
}

// Fonction utilitaire pour tester une vue spécifique
function testSpecificView(viewType = 'front') {
    console.log(`🎯 Test spécifique pour la vue: ${viewType.toUpperCase()}`);
    
    if (!window.presentationManager || !window.presentationManager.generateTechnicalElevation) {
        console.error('❌ generateTechnicalElevation non disponible');
        return;
    }
    
    console.log('🔄 Génération de l\'élévation technique...');
    
    window.presentationManager.generateTechnicalElevation(viewType, '1:50')
        .then(canvas => {
            if (canvas && canvas.width > 0) {
                console.log(`✅ Élévation ${viewType} générée:`, {
                    largeur: canvas.width,
                    hauteur: canvas.height,
                    ratio: Math.round((canvas.width / canvas.height) * 100) / 100
                });
                
                // Créer un lien de téléchargement pour visualiser
                const link = document.createElement('a');
                link.download = `test-elevation-${viewType}.png`;
                link.href = canvas.toDataURL();
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                console.log('💾 Image téléchargée pour inspection visuelle');
            } else {
                console.error('❌ Échec de la génération de l\'élévation');
            }
        })
        .catch(error => {
            console.error('❌ Erreur lors de la génération:', error);
        });
}

// Fonction pour tester le centrage de toutes les vues
function testAllViewsCentering() {
    const views = ['perspective', 'front', 'back', 'left', 'right', 'top'];
    let currentIndex = 0;
    
    function testNextView() {
        if (currentIndex >= views.length) {
            console.log('🎉 Test de toutes les vues terminé !');
            return;
        }
        
        const viewType = views[currentIndex];
        console.log(`🔄 Test de la vue ${viewType}...`);
        
        if (viewType === 'perspective') {
            // Pour la perspective, juste simuler le recentrage
            if (window.SceneManager && window.SceneManager.camera && window.presentationManager) {
                try {
                    const analysis = window.presentationManager.calculateBuildingCenter(window.SceneManager);
                    if (analysis && analysis.boundingBox) {
                        const center = analysis.boundingBox.getCenter(new window.THREE.Vector3());
                        console.log(`✅ Perspective centrée sur (${center.x.toFixed(1)}, ${center.y.toFixed(1)}, ${center.z.toFixed(1)})`);
                    }
                } catch (e) {
                    console.warn(`⚠️ Erreur perspective: ${e.message}`);
                }
                currentIndex++;
                setTimeout(testNextView, 500);
            }
        } else {
            testSpecificView(viewType);
            currentIndex++;
            setTimeout(testNextView, 2000); // Délai plus long pour les générations
        }
    }
    
    testNextView();
}

// Lancer le test automatiquement
console.log('🚀 Lancement du test automatique...');
testPDFCentering();

// Exposer les fonctions de test
window.testPDFCentering = testPDFCentering;
window.testSpecificView = testSpecificView;
window.testAllViewsCentering = testAllViewsCentering;

console.log('');
console.log('📚 Fonctions disponibles:');
console.log('- testPDFCentering(): Test complet du système de centrage');
console.log('- testSpecificView("front"): Test d\'une vue spécifique (front, back, left, right, top)');
console.log('- testAllViewsCentering(): Test de toutes les vues avec génération d\'images');