// Solution de fallback pour le chargement de Three.js
(async function() {
    try {
        // Essayer d'abord les modules ES6
        console.log('🔄 Tentative de chargement Three.js ES6...');
        
        // Import dynamique
        const [THREE_module, OrbitControls_module] = await Promise.all([
            import('https://unpkg.com/three@latest/build/three.module.js'),
            import('https://unpkg.com/three@latest/examples/jsm/controls/OrbitControls.js')
        ]);
        
        // Exposer globalement
        window.THREE = THREE_module;
        window.OrbitControls = OrbitControls_module.OrbitControls;
        
        console.log('✅ Three.js ES6 chargé:', THREE_module.REVISION);
        console.log('✅ OrbitControls ES6 chargé');
        
        // Signaler que Three.js est prêt
        window.dispatchEvent(new CustomEvent('threejs-ready', {
            detail: { THREE: THREE_module, OrbitControls: OrbitControls_module.OrbitControls }
        }));
        
    } catch (error) {
        console.warn('⚠️ Échec du chargement ES6, fallback vers UMD:', error);
        
        // Fallback vers l'ancienne méthode UMD
        const script1 = document.createElement('script');
        script1.src = 'https://unpkg.com/three@latest/build/three.min.js';
        
        const script2 = document.createElement('script');
        script2.src = 'https://unpkg.com/three@latest/examples/js/controls/OrbitControls.js';
        
        script1.onload = function() {
            console.log('✅ Three.js UMD chargé');
            script2.onload = function() {
                console.log('✅ OrbitControls UMD chargé');
                
                // Signaler que Three.js est prêt
                window.dispatchEvent(new CustomEvent('threejs-ready', {
                    detail: { THREE: window.THREE, OrbitControls: window.THREE.OrbitControls }
                }));
            };
            document.head.appendChild(script2);
        };
        
        document.head.appendChild(script1);
    }
})();
