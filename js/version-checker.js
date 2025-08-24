// Script pour vérifier la version Three.js actuelle
// console.log('🔍 Vérification version Three.js...');

// Attendre que Three.js soit chargé
function checkThreeVersion() {
    if (window.THREE) {
        // console.log('📦 Three.js détecté !');
        // console.log('🏷️ Version THREE.REVISION:', window.THREE.REVISION);
        // console.log('🌐 Source:', window.THREE.REVISION >= 150 ? 'ES6 Module' : 'UMD Classic');
        
        // Afficher dans la page
        const versionDiv = document.createElement('div');
        versionDiv.innerHTML = `
            <div style="
                position: fixed; top: 10px; right: 10px;
                background: rgba(0,0,0,0.8); color: white;
                padding: 15px; border-radius: 8px;
                font-family: monospace; font-size: 14px;
                z-index: 10000;
            ">
                <strong>Three.js Version</strong><br>
                📦 Revision: r${window.THREE.REVISION}<br>
                🌐 Type: ${window.THREE.REVISION >= 150 ? 'ES6 Module' : 'UMD Legacy'}<br>
                📅 ${window.THREE.REVISION >= 168 ? 'Latest (2024+)' : 
                       window.THREE.REVISION >= 150 ? 'Modern (2023)' : 
                       'Legacy (2022-)'}
            </div>
        `;
        document.body.appendChild(versionDiv);
        
        // Supprimer après 10 secondes
        setTimeout(() => versionDiv.remove(), 10000);
        
        // Retourner les infos
        return {
            revision: window.THREE.REVISION,
            type: window.THREE.REVISION >= 150 ? 'ES6' : 'UMD',
            isLatest: window.THREE.REVISION >= 168
        };
    } else {
        // console.log('⏳ Three.js pas encore chargé...');
        return null;
    }
}

// Vérifier toutes les 500ms jusqu'à ce que Three.js soit trouvé
const versionChecker = setInterval(() => {
    const info = checkThreeVersion();
    if (info) {
        clearInterval(versionChecker);
        
        // Exposer globalement pour la console
        window.getThreeVersion = () => info;
        // console.log('💡 Tapez getThreeVersion() dans la console pour voir les détails');
    }
}, 500);

// Timeout après 30 secondes
setTimeout(() => {
    clearInterval(versionChecker);
    if (!window.THREE) {
        // console.log('❌ Three.js non trouvé après 30 secondes');
    }
}, 30000);
