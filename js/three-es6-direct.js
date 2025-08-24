// Migration Three.js ES6 - Version locale r179
// console.log('🚀 MIGRATION ES6 LOCAL - Three.js r179');

// Système de callbacks pour l'attente de Three.js
window.ThreeJSCallbacks = window.ThreeJSCallbacks || [];
window.isThreeJSReady = false;

// Fonction helper pour les autres scripts
window.waitForThreeJS = function(callback) {
    if (window.isThreeJSReady && typeof THREE !== 'undefined') {
        callback();
    } else {
        window.ThreeJSCallbacks.push(callback);
    }
};

// Supprimer les anciens scripts three.js s'ils existent
document.querySelectorAll('script[data-threejs], script[src*="three"]').forEach(s => s.remove());

// 1. Configuration Import Map (LOCAL - Three.js r179)
const importMapScript = document.createElement('script');
importMapScript.type = 'importmap';
importMapScript.textContent = JSON.stringify({
    imports: {
        'three': './lib/three/three.module.js',
        'three/addons/': './lib/three/addons/'
    }
});

document.head.appendChild(importMapScript);
// console.log('📦 Import Map configuré (LOCAL r179)');

// 2. Module ES6 principal
const mainModule = document.createElement('script');
mainModule.type = 'module';
mainModule.textContent = `
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Three.js ES6 r179 chargé (LOCAL)
// OrbitControls ES6 chargé (LOCAL)

// Exposer globalement (pour compatibilité avec code existant)
globalThis.THREE = THREE;
globalThis.OrbitControls = OrbitControls;

// Créer l'objet ES6 moderne
globalThis.ThreeESM = {
    THREE,
    OrbitControls,
    version: THREE.REVISION,
    isES6: true
};

// Signaler que Three.js ES6 est prêt
window.isThreeJSReady = true;

// Exécuter tous les callbacks en attente
window.ThreeJSCallbacks.forEach(callback => {
    try {
        callback();
    } catch (error) {
        console.error('❌ Erreur callback Three.js:', error);
    }
});
window.ThreeJSCallbacks = []; // Nettoyer

globalThis.dispatchEvent(new CustomEvent('threejs-es6-ready', {
    detail: { 
        THREE, 
        OrbitControls,
        isES6: true,
        version: THREE.REVISION
    }
}));

// console.log('🎉 MIGRATION ES6 RÉUSSIE (LOCAL) - Three.js r' + THREE.REVISION);
`;

// Gestion d'erreur pour le module
mainModule.onerror = function(error) {
    console.error('❌ ÉCHEC ES6:', error);
    document.body.innerHTML = `
        <div style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            display: flex; align-items: center; justify-content: center;
            color: white; font-family: Arial, sans-serif;
        ">
            <div style="
                background: rgba(0,0,0,0.3); 
                padding: 40px; border-radius: 15px; 
                text-align: center; max-width: 500px;
            ">
                <h2>⚠️ ES6 Migration Failed</h2>
                <p>Impossible de charger Three.js en modules ES6</p>
                <p style="font-size: 14px; opacity: 0.8;">
                    Votre navigateur doit supporter les ES6 modules
                </p>
                <button onclick="location.reload()" style="
                    background: white; color: #e74c3c; border: none; 
                    padding: 15px 30px; border-radius: 8px; cursor: pointer;
                ">🔄 Retry</button>
            </div>
        </div>
    `;
};

document.head.appendChild(mainModule);
// console.log('🔧 Module ES6 déployé');
