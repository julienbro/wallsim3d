// Système de chargement Three.js ultra-robuste
(function() {
    'use strict';
    
    // console.log('🔄 Initialisation du chargement Three.js...');
    
    // Configuration des CDN avec fallbacks
    const cdnConfigs = [
        {
            name: 'unpkg-stable-128',
            three: 'https://unpkg.com/three@0.128.0/build/three.min.js',
            controls: 'https://unpkg.com/three@0.128.0/examples/js/controls/OrbitControls.js'
        },
        {
            name: 'jsDelivr-stable-128',
            three: 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js',
            controls: 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js'
        },
        {
            name: 'jsDelivr-backup',
            three: 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js',
            controls: 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/js/controls/OrbitControls.js'
        },
        {
            name: 'unpkg-latest',
            three: 'https://unpkg.com/three@0.168.0/build/three.min.js',
            controls: 'https://unpkg.com/three@0.168.0/examples/js/controls/OrbitControls.js'
        }
    ];
    
    let currentAttempt = 0;
    let loadTimeout;
    
    function loadThreeJS() {
        // Vérifier si Three.js est déjà chargé
        if (window.THREE && window.THREE.REVISION) {
            // console.log('✅ Three.js déjà disponible:', window.THREE.REVISION);
            
            // Vérifier OrbitControls
            const controls = window.THREE?.OrbitControls || window.OrbitControls;
            if (controls) {
                // console.log('✅ OrbitControls déjà disponible');
                window.dispatchEvent(new CustomEvent('threejs-ready', {
                    detail: { THREE: window.THREE, OrbitControls: controls }
                }));
                return;
            }
        }
        
        if (currentAttempt >= cdnConfigs.length) {
            // console.error('❌ Tous les CDN ont échoué');
            showErrorMessage();
            return;
        }
        
        const config = cdnConfigs[currentAttempt];
        // console.log(`🔄 Tentative ${currentAttempt + 1}/${cdnConfigs.length}: ${config.name}`);
        
        // Nettoyer les anciens scripts en cas d'échec précédent
        document.querySelectorAll('script[data-threejs]').forEach(s => s.remove());
        
        // Timeout pour cette tentative
        loadTimeout = setTimeout(() => {
            // console.warn(`⏰ Timeout pour ${config.name}`);
            currentAttempt++;
            loadThreeJS();
        }, 5000);
        
        // Charger Three.js
        const threeScript = document.createElement('script');
        threeScript.setAttribute('data-threejs', 'main');
        threeScript.src = config.three;
        
        threeScript.onload = function() {
            // console.log(`✅ Three.js chargé depuis ${config.name}:`, window.THREE?.REVISION || 'version inconnue');
            
            // Charger OrbitControls
            const controlsScript = document.createElement('script');
            controlsScript.setAttribute('data-threejs', 'controls');
            controlsScript.src = config.controls;
            
            controlsScript.onload = function() {
                clearTimeout(loadTimeout);
                // console.log('✅ OrbitControls chargé');
                
                // Vérifier que tout est bien disponible
                // Pour les anciennes versions, OrbitControls est dans THREE.OrbitControls
                // Pour les nouvelles, peut être dans window.OrbitControls
                const controls = window.THREE?.OrbitControls || window.OrbitControls;
                
                if (window.THREE && controls) {
                    // console.log('🎉 Three.js complètement initialisé');
                    
                    // S'assurer que OrbitControls est accessible des deux façons
                    if (!window.THREE.OrbitControls && window.OrbitControls) {
                        window.THREE.OrbitControls = window.OrbitControls;
                    }
                    
                    window.dispatchEvent(new CustomEvent('threejs-ready', {
                        detail: { THREE: window.THREE, OrbitControls: controls }
                    }));
                } else {
                    // console.warn('⚠️ OrbitControls non trouvé, essai suivant...');
                    currentAttempt++;
                    loadThreeJS();
                }
            };
            
            controlsScript.onerror = function() {
                // console.warn(`❌ Échec OrbitControls depuis ${config.name}`);
                currentAttempt++;
                loadThreeJS();
            };
            
            document.head.appendChild(controlsScript);
        };
        
        threeScript.onerror = function() {
            clearTimeout(loadTimeout);
            // console.warn(`❌ Échec Three.js depuis ${config.name}`);
            currentAttempt++;
            loadThreeJS();
        };
        
        document.head.appendChild(threeScript);
    }
    
    function showErrorMessage() {
        document.body.innerHTML = `
            <div style="
                position: fixed; 
                top: 0; left: 0; 
                width: 100%; height: 100%; 
                background: rgba(0,0,0,0.9); 
                display: flex; 
                align-items: center; 
                justify-content: center;
                z-index: 10000;
            ">
                <div style="
                    background: white; 
                    padding: 30px; 
                    border-radius: 10px; 
                    text-align: center;
                    max-width: 500px;
                ">
                    <h2 style="color: #e74c3c; margin-bottom: 20px;">
                        ⚠️ Problème de connectivité
                    </h2>
                    <p style="margin-bottom: 15px;">
                        Impossible de charger Three.js depuis aucun CDN.
                    </p>
                    <p style="margin-bottom: 20px; font-size: 14px; color: #666;">
                        CDN testés : jsDelivr, unpkg (plusieurs versions)
                    </p>
                    <button onclick="location.reload()" style="
                        background: #3498db; 
                        color: white; 
                        border: none; 
                        padding: 12px 24px; 
                        font-size: 16px; 
                        border-radius: 5px; 
                        cursor: pointer;
                    ">
                        🔄 Réessayer
                    </button>
                </div>
            </div>
        `;
    }
    
    // Démarrer le chargement
    loadThreeJS();
    
})();
