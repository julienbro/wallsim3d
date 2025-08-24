// Migration complète vers Three.js r168+ avec ES6 modules
console.log('🚀 Initialisation Three.js r168+ avec ES6...');

// Import Map pour simplifier les imports
const importMap = document.createElement('script');
importMap.type = 'importmap';
importMap.textContent = JSON.stringify({
    imports: {
        'three': 'https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js',
        'three/addons/': 'https://cdn.jsdelivr.net/npm/three@latest/examples/jsm/'
    }
});

// Injecter l'import map s'il n'existe pas
if (!document.querySelector('script[type="importmap"]')) {
    document.head.appendChild(importMap);
}

// Script module pour charger Three.js
const moduleScript = document.createElement('script');
moduleScript.type = 'module';
moduleScript.textContent = `
    try {
        console.log('📦 Chargement modules ES6...');
        
        // Import des modules ES6
        const THREE = await import('three');
        const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
        
        console.log('✅ Three.js ES6 chargé:', THREE.REVISION);
        console.log('✅ OrbitControls ES6 chargé');
        
        // Exposer globalement pour compatibilité
        window.THREE = THREE;
        window.OrbitControls = OrbitControls;
        
        // Ajouter OrbitControls à THREE pour compatibilité (en mode sécurisé)
        try {
            if (!window.THREE.OrbitControls) {
                Object.defineProperty(window.THREE, 'OrbitControls', {
                    value: OrbitControls,
                    writable: true,
                    configurable: true
                });
            }
        } catch (e) {
            // Si l'objet n'est pas extensible, pas grave, OrbitControls est déjà disponible
            console.log('ℹ️ THREE non extensible, OrbitControls disponible via window.OrbitControls');
        }
        
        // Signaler que Three.js est prêt
        window.dispatchEvent(new CustomEvent('threejs-ready', {
            detail: { THREE: window.THREE, OrbitControls: OrbitControls }
        }));
        
        // console.log('🎉 Migration ES6 réussie !');
        
    } catch (error) {
        console.warn('⚠️ Échec ES6, fallback UMD...', error);
        
        // Vérifier si Three.js n'est pas déjà chargé par ES6
        if (window.THREE && window.THREE.REVISION) {
            console.log('ℹ️ Three.js déjà chargé par ES6, pas de fallback nécessaire');
            // Juste vérifier OrbitControls
            const controls = window.THREE.OrbitControls || window.OrbitControls;
            if (controls) {
                window.dispatchEvent(new CustomEvent('threejs-ready', {
                    detail: { THREE: window.THREE, OrbitControls: controls }
                }));
                return;
            }
        }
        
        // Fallback vers UMD si ES6 échoue
        const script1 = document.createElement('script');
        script1.src = 'https://cdn.jsdelivr.net/npm/three@latest/build/three.min.js';
        script1.onload = () => {
            console.log('✅ Three.js UMD chargé:', THREE.REVISION);
            
            const script2 = document.createElement('script');
            script2.src = 'https://cdn.jsdelivr.net/npm/three@latest/examples/js/controls/OrbitControls.js';
            script2.onload = () => {
                console.log('✅ OrbitControls UMD chargé');
                
                // Corriger la structure OrbitControls pour les nouvelles versions
                if (!window.THREE.OrbitControls && window.OrbitControls) {
                    window.THREE.OrbitControls = window.OrbitControls;
                }
                
                window.dispatchEvent(new CustomEvent('threejs-ready', {
                    detail: { THREE: window.THREE, OrbitControls: window.THREE.OrbitControls || window.OrbitControls }
                }));
            };
            script2.onerror = () => {
                console.error('❌ Échec OrbitControls UMD');
            };
            document.head.appendChild(script2);
        };
        script1.onerror = () => {
            console.error('❌ Échec Three.js UMD');
        };
        document.head.appendChild(script1);
    }
`;

document.head.appendChild(moduleScript);
