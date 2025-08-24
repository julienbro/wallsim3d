// Version optimisée pour chargement rapide Three.js v0.128.0
(function() {
    'use strict';
    
    // Vérifier si Three.js est déjà chargé
    if (window.THREE && window.THREE.REVISION) {
        console.log('✅ Three.js déjà disponible:', window.THREE.REVISION);
        const controls = window.THREE?.OrbitControls || window.OrbitControls;
        if (controls) {
            console.log('✅ OrbitControls déjà disponible');
            window.dispatchEvent(new CustomEvent('threejs-ready', {
                detail: { THREE: window.THREE, OrbitControls: controls }
            }));
            return;
        }
    }
    
    console.log('🔄 Chargement Three.js dernière version (r168+)...');
    
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Charger Three.js dernière version avec modules ES6 via UMD
    Promise.all([
        loadScript('https://cdn.jsdelivr.net/npm/three@latest/build/three.min.js'),
        loadScript('https://cdn.jsdelivr.net/npm/three@latest/examples/js/controls/OrbitControls.js')
    ]).then(() => {
        console.log('✅ Three.js dernière version chargé:', THREE.REVISION);
        console.log('✅ OrbitControls chargé');
        
        // Dans les nouvelles versions, OrbitControls est souvent dans window.OrbitControls
        // et non dans THREE.OrbitControls
        if (!window.THREE.OrbitControls && window.OrbitControls) {
            window.THREE.OrbitControls = window.OrbitControls;
            console.log('🔄 OrbitControls attaché à THREE');
        }
        
        // Signaler que Three.js est prêt
        window.dispatchEvent(new CustomEvent('threejs-ready', {
            detail: { THREE: window.THREE, OrbitControls: window.THREE.OrbitControls || window.OrbitControls }
        }));
        
    }).catch(error => {
        console.error('❌ Échec chargement dernière version:', error);
        
        // Fallback avec unpkg
        console.log('🔄 Fallback unpkg dernière version...');
        Promise.all([
            loadScript('https://unpkg.com/three@latest/build/three.min.js'),
            loadScript('https://unpkg.com/three@latest/examples/js/controls/OrbitControls.js')
        ]).then(() => {
            console.log('✅ Three.js fallback chargé:', THREE.REVISION);
            
            // Même correction pour OrbitControls
            if (!window.THREE.OrbitControls && window.OrbitControls) {
                window.THREE.OrbitControls = window.OrbitControls;
            }
            
            window.dispatchEvent(new CustomEvent('threejs-ready', {
                detail: { THREE: window.THREE, OrbitControls: window.THREE.OrbitControls || window.OrbitControls }
            }));
        }).catch(fallbackError => {
            console.error('❌ Tous les CDN latest ont échoué, fallback vers version stable');
            
            // Fallback final vers version stable
            Promise.all([
                loadScript('https://unpkg.com/three@0.158.0/build/three.min.js'),
                loadScript('https://unpkg.com/three@0.158.0/examples/js/controls/OrbitControls.js')
            ]).then(() => {
                console.log('✅ Three.js version stable chargée:', THREE.REVISION);
                if (!window.THREE.OrbitControls && window.OrbitControls) {
                    window.THREE.OrbitControls = window.OrbitControls;
                }
                window.dispatchEvent(new CustomEvent('threejs-ready', {
                    detail: { THREE: window.THREE, OrbitControls: window.THREE.OrbitControls || window.OrbitControls }
                }));
            }).catch(() => {
                console.error('❌ Impossible de charger Three.js');
                document.body.innerHTML = `
                    <div style="
                        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                        background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center;
                    ">
                        <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
                            <h2 style="color: #e74c3c;">⚠️ Problème de connectivité</h2>
                            <p>Impossible de charger Three.js (dernière version)</p>
                            <button onclick="location.reload()" style="
                                background: #3498db; color: white; border: none; 
                                padding: 12px 24px; border-radius: 5px; cursor: pointer;
                            ">🔄 Recharger</button>
                        </div>
                    </div>
                `;
            });
        });
    });
})();
