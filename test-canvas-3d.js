/**
 * Test rapide pour forcer l'affichage 3D
 * À copier-coller dans la console du navigateur
 */

// Test rapide
function testCanvas3D() {
    console.log('🧪 === TEST CANVAS 3D ===');
    
    // 1. Activer l'onglet Outils
    const toolsTab = document.querySelector('[data-tab="outils"]');
    if (toolsTab && !toolsTab.classList.contains('active')) {
        toolsTab.click();
        console.log('✅ Onglet Outils activé');
    }
    
    // 2. Attendre un peu puis tester
    setTimeout(() => {
        // Vérifier le canvas
        const canvas = document.getElementById('toolsActiveElementCanvas');
        if (!canvas) {
            console.error('❌ Canvas non trouvé');
            return;
        }
        
        console.log('📊 Canvas trouvé:', canvas.width + 'x' + canvas.height);
        
        // 3. Forcer le refresh
        if (window.ToolsTabManager) {
            console.log('🔄 Force refresh via ToolsTabManager');
            window.ToolsTabManager.forceRefresh3DPreview();
        }
        
        // 4. Vérifier après 2 secondes
        setTimeout(() => {
            const hasContent = checkCanvasContent();
            console.log('📊 Canvas a du contenu:', hasContent);
            
            if (!hasContent) {
                console.log('🔧 Essai cube simple...');
                createSimpleTest();
            }
        }, 2000);
        
    }, 500);
}

// Vérifier le contenu du canvas
function checkCanvasContent() {
    const canvas = document.getElementById('toolsActiveElementCanvas');
    if (!canvas) return false;
    
    try {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, 50, 50);
        
        for (let i = 3; i < imageData.data.length; i += 4) {
            if (imageData.data[i] > 0) return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

// Test avec un cube simple directement
function createSimpleTest() {
    const canvas = document.getElementById('toolsActiveElementCanvas');
    if (!canvas || typeof THREE === 'undefined') {
        console.error('❌ Canvas ou THREE.js non disponible');
        return;
    }
    
    try {
        // Forcer les dimensions
        canvas.width = 240;
        canvas.height = 240;
        
        // Créer une scène simple
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x2a2a2a);
        
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        camera.position.set(2, 2, 2);
        
        const renderer = new THREE.WebGLRenderer({ canvas });
        renderer.setSize(240, 240);
        
        // Éclairage
        scene.add(new THREE.AmbientLight(0x404040, 0.8));
        const light = new THREE.DirectionalLight(0xffffff, 0.6);
        light.position.set(3, 3, 3);
        scene.add(light);
        
        // Cube rouge simple
        const geometry = new THREE.BoxGeometry(1, 0.5, 2);
        const material = new THREE.MeshLambertMaterial({ color: 0xff4444 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        
        // Rendu
        renderer.render(scene, camera);
        
        console.log('✅ Test cube simple réussi !');
        
        // Animation
        function animate() {
            cube.rotation.y += 0.02;
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        }
        animate();
        
    } catch (error) {
        console.error('❌ Erreur test simple:', error);
    }
}

// Lancer le test
console.log('🧪 Tapez testCanvas3D() pour tester le canvas 3D');
console.log('🧪 Tapez createSimpleTest() pour un test de cube simple');
console.log('🧪 Tapez checkCanvasContent() pour vérifier le contenu');

// Export global pour utilisation
window.testCanvas3D = testCanvas3D;
window.createSimpleTest = createSimpleTest;
window.checkCanvasContent = checkCanvasContent;
