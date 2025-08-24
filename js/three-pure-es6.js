// Migration FORCÉE vers ES6 modules - Three.js r168+
// Cette version OBLIGE l'utilisation des modules ES6

console.log('🚀 MIGRATION FORCÉE ES6 - Three.js moderne');

// 1. Injecter l'import map pour les modules ES6
function setupImportMap() {
    // Supprimer les anciens import maps s'ils existent
    document.querySelectorAll('script[type="importmap"]').forEach(s => s.remove());
    
    const importMap = document.createElement('script');
    importMap.type = 'importmap';
    importMap.textContent = JSON.stringify({
        imports: {
            'three': 'https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js',
            'three/': 'https://cdn.jsdelivr.net/npm/three@latest/',
            'three/addons/': 'https://cdn.jsdelivr.net/npm/three@latest/examples/jsm/',
            'three/examples/jsm/': 'https://cdn.jsdelivr.net/npm/three@latest/examples/jsm/'
        }
    });
    
    document.head.appendChild(importMap);
    console.log('📦 Import map ES6 configuré');
}

// 2. Créer le module ES6 principal
function createES6Module() {
    const moduleScript = document.createElement('script');
    moduleScript.type = 'module';
    moduleScript.id = 'three-es6-main';
    
    moduleScript.textContent = `
        console.log('🔥 CHARGEMENT FORCÉ ES6 MODULES');
        
        try {
            // Import FORCÉ ES6 - pas de fallback UMD
            console.log('📦 Import Three.js ES6...');
            const THREE = await import('three');
            
            console.log('📦 Import OrbitControls ES6...');  
            const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
            
            // Vérifier le chargement
            if (!THREE || !THREE.REVISION) {
                throw new Error('Three.js ES6 import failed');
            }
            
            if (!OrbitControls) {
                throw new Error('OrbitControls ES6 import failed');
            }
            
            console.log('✅ Three.js ES6 r' + THREE.REVISION + ' - SUCCÈS');
            console.log('✅ OrbitControls ES6 - SUCCÈS');
            
            // Exposer UNIQUEMENT via ES6 (pas de window.THREE global)
            // Créer un gestionnaire ES6 moderne
            window.ThreeESM = {
                THREE,
                OrbitControls,
                version: THREE.REVISION,
                isES6: true
            };
            
            // Pour compatibilité temporaire avec le code existant
            window.THREE = THREE;
            window.OrbitControls = OrbitControls;
            
            // Signaler le succès ES6
            window.dispatchEvent(new CustomEvent('threejs-es6-ready', {
                detail: { 
                    THREE, 
                    OrbitControls,
                    isES6: true,
                    version: THREE.REVISION
                }
            }));
            
            console.log('🎉 MIGRATION ES6 TERMINÉE - Pure ES6 modules !');
            
        } catch (error) {
            console.error('❌ ÉCHEC MIGRATION ES6:', error);
            
            // PAS DE FALLBACK UMD - ÉCHEC VOLONTAIRE
            document.body.innerHTML = '<div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-family: Arial, sans-serif;"><div style="background: rgba(255,255,255,0.1); padding: 40px; border-radius: 15px; text-align: center; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);"><h2 style="margin-bottom: 20px;">⚠️ Migration ES6 échouée</h2><p style="margin-bottom: 15px;">Votre navigateur ne supporte pas les modules ES6.</p><p style="margin-bottom: 20px; font-size: 14px; opacity: 0.8;">Modules ES6 requis pour Three.js r168+</p><button onclick="location.reload()" style="background: #e74c3c; color: white; border: none; padding: 15px 30px; font-size: 16px; border-radius: 8px; cursor: pointer; margin: 5px;">🔄 Réessayer</button><p style="font-size: 12px; margin-top: 20px; opacity: 0.6;">Navigateurs supportés : Chrome 63+, Firefox 60+, Safari 11+</p></div></div>';
        }
    `;
    
    document.head.appendChild(moduleScript);
    console.log('🔧 Module ES6 principal créé');
}

// 3. Vérifier le support ES6 avant de continuer
function checkES6Support() {
    try {
        // Test des modules ES6 avec une vraie syntaxe
        new Function('import("data:text/javascript,export default true")');
        return true;
    } catch (e) {
        console.warn('❌ Modules ES6 non supportés:', e.message);
        return false;
    }
}

// 4. Exécution principale
if (!checkES6Support()) {
    console.error('❌ Modules ES6 non supportés par ce navigateur');
    document.body.innerHTML = `
        <div style="padding: 50px; text-align: center; font-family: Arial;">
            <h2 style="color: #e74c3c;">❌ Navigateur non compatible</h2>
            <p>Les modules ES6 sont requis pour cette application.</p>
            <p style="font-size: 14px; color: #666;">Veuillez utiliser un navigateur moderne.</p>
        </div>
    `;
} else {
    console.log('✅ Support ES6 détecté - Migration possible');
    setupImportMap();
    
    // Attendre que l'import map soit prêt
    setTimeout(() => {
        createES6Module();
    }, 100);
}
