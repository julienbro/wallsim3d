// Migration Three.js r168+ - Version finale optimisée
(function() {
    'use strict';
    
    // Vérifier si Three.js est déjà chargé
    if (window.THREE && window.THREE.REVISION) {
        console.log('✅ Three.js déjà disponible:', window.THREE.REVISION);
        const controls = window.THREE.OrbitControls || window.OrbitControls;
        if (controls) {
            window.dispatchEvent(new CustomEvent('threejs-ready', {
                detail: { THREE: window.THREE, OrbitControls: controls }
            }));
            return;
        }
    }
    
    console.log('🚀 Migration vers Three.js r168+ avec ES6...');
    
    // Méthode 1: Essayer ES6 modules avec import dynamique
    async function tryES6() {
        try {
            console.log('📦 Tentative ES6 modules...');
            
            const [THREE_module, { OrbitControls }] = await Promise.all([
                import('https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js'),
                import('https://cdn.jsdelivr.net/npm/three@latest/examples/jsm/controls/OrbitControls.js')
            ]);
            
            console.log('✅ Three.js ES6 r' + THREE_module.REVISION + ' chargé');
            console.log('✅ OrbitControls ES6 chargé');
            
            // Exposer globalement
            window.THREE = THREE_module;
            window.OrbitControls = OrbitControls;
            
            // Signaler succès
            window.dispatchEvent(new CustomEvent('threejs-ready', {
                detail: { THREE: THREE_module, OrbitControls: OrbitControls }
            }));
            
            return true;
            
        } catch (error) {
            console.warn('⚠️ ES6 modules échoué:', error.message);
            return false;
        }
    }
    
    // Méthode 2: Fallback UMD classique
    function loadUMD() {
        console.log('🔄 Fallback UMD dernière version...');
        
        return new Promise((resolve, reject) => {
            const script1 = document.createElement('script');
            script1.src = 'https://cdn.jsdelivr.net/npm/three@latest/build/three.min.js';
            
            script1.onload = () => {
                console.log('✅ Three.js UMD r' + THREE.REVISION + ' chargé');
                
                const script2 = document.createElement('script');
                script2.src = 'https://cdn.jsdelivr.net/npm/three@latest/examples/js/controls/OrbitControls.js';
                
                script2.onload = () => {
                    console.log('✅ OrbitControls UMD chargé');
                    
                    // OrbitControls peut être dans window.OrbitControls ou THREE.OrbitControls
                    const controls = window.THREE.OrbitControls || window.OrbitControls;
                    
                    window.dispatchEvent(new CustomEvent('threejs-ready', {
                        detail: { THREE: window.THREE, OrbitControls: controls }
                    }));
                    
                    resolve();
                };
                
                script2.onerror = () => reject(new Error('OrbitControls UMD failed'));
                document.head.appendChild(script2);
            };
            
            script1.onerror = () => reject(new Error('Three.js UMD failed'));
            document.head.appendChild(script1);
        });
    }
    
    // Exécution: ES6 puis UMD en fallback
    tryES6().then(success => {
        if (!success) {
            return loadUMD();
        }
    }).catch(error => {
        console.error('❌ Échec complet:', error);
        document.body.innerHTML = `
            <div style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center;
            ">
                <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
                    <h2 style="color: #e74c3c;">⚠️ Échec de migration</h2>
                    <p>Impossible de charger Three.js r168+</p>
                    <button onclick="location.reload()" style="
                        background: #3498db; color: white; border: none; 
                        padding: 12px 24px; border-radius: 5px; cursor: pointer;
                    ">🔄 Recharger</button>
                </div>
            </div>
        `;
    });
    
})();
