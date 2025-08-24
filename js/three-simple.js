// Version simplifiée avec chargement dynamique et multiple CDN
(function() {
    'use strict';
    
    console.log('🔄 Chargement de Three.js (version moderne)...');
    
    // Liste des CDN à essayer dans l'ordre
    const cdnList = [
        {
            name: 'jsDelivr',
            three: 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.min.js',
            controls: 'https://cdn.jsdelivr.net/npm/three@0.168.0/examples/js/controls/OrbitControls.js'
        },
        {
            name: 'unpkg',
            three: 'https://unpkg.com/three@0.168.0/build/three.min.js',
            controls: 'https://unpkg.com/three@0.168.0/examples/js/controls/OrbitControls.js'
        },
        {
            name: 'cdnjs',
            three: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r168/three.min.js',
            controls: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r168/controls/OrbitControls.js'
        },
        {
            name: 'backup-stable',
            three: 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js',
            controls: 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/js/controls/OrbitControls.js'
        },
        {
            name: 'fallback-old-working',
            three: 'https://unpkg.com/three@0.128.0/build/three.min.js',
            controls: 'https://unpkg.com/three@0.128.0/examples/js/controls/OrbitControls.js'
        }
    ];
    
    // Chargement dynamique des scripts Three.js
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Essayer les CDN un par un
    async function tryLoadFromCDN(cdnIndex = 0) {
        if (cdnIndex >= cdnList.length) {
            throw new Error('Tous les CDN ont échoué');
        }
        
        const cdn = cdnList[cdnIndex];
        console.log(`🔄 Tentative ${cdn.name}...`);
        
        try {
            await Promise.all([
                loadScript(cdn.three),
                loadScript(cdn.controls)
            ]);
            
            console.log(`✅ Three.js chargé depuis ${cdn.name}:`, THREE.REVISION);
            console.log('✅ OrbitControls chargé');
            
            // Signaler que Three.js est prêt
            window.dispatchEvent(new CustomEvent('threejs-ready', {
                detail: { THREE: window.THREE, OrbitControls: window.THREE.OrbitControls }
            }));
            
        } catch (error) {
            console.warn(`⚠️ Échec ${cdn.name}, essai suivant...`);
            return tryLoadFromCDN(cdnIndex + 1);
        }
    }
    
    // Démarrer le chargement
    tryLoadFromCDN().catch(error => {
        console.error('❌ Tous les CDN ont échoué:', error);
        
        // Afficher un message d'erreur à l'utilisateur
        document.body.innerHTML = `
            <div style="padding: 20px; text-align: center; color: red; font-family: Arial;">
                <h2>⚠️ Erreur de chargement</h2>
                <p>Impossible de charger Three.js depuis aucun CDN.</p>
                <p>Vérifiez votre connexion internet et rechargez la page.</p>
                <p><small>CDN testés : jsDelivr, unpkg, cdnjs</small></p>
                <button onclick="location.reload()" style="padding: 10px 20px; font-size: 16px;">
                    🔄 Recharger
                </button>
            </div>
        `;
    });
})();
