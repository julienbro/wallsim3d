// Script pour vérifier la version Three.js actuelle
// 

// Attendre que Three.js soit chargé
function checkThreeVersion() {
    if (window.THREE) {
        // console.log('📦 Three.js détecté !');
        // console.log('🏷️ Version THREE.REVISION:', window.THREE.REVISION);
        // console.log('🌐 Source:', window.THREE.REVISION >= 150 ? 'ES6 Module' : 'UMD Classic');
        
        // (Affichage désactivé) Ancienne popin version supprimée pour ne pas gêner l'UI.
        // Si besoin de réactiver: restaurer le code supprimé ou appeler showThreeVersionOverlay(info).

        // Fonction utilitaire optionnelle pour réactiver manuellement l'affichage via la console.
        window.showThreeVersionOverlay = (customInfo) => {
            const data = customInfo || {
                revision: window.THREE.REVISION,
                type: window.THREE.REVISION >= 150 ? 'ES6 Module' : 'UMD Legacy',
                period: window.THREE.REVISION >= 168 ? 'Latest (2024+)' : window.THREE.REVISION >= 150 ? 'Modern (2023)' : 'Legacy (2022-)'
            };
            const versionDiv = document.createElement('div');
            versionDiv.innerHTML = `
                <div style="position:fixed;top:10px;right:10px;background:rgba(0,0,0,.8);color:#fff;padding:12px 14px;border-radius:8px;font:13px/1.4 monospace;z-index:10000;box-shadow:0 2px 8px rgba(0,0,0,.4)">
                    <strong>Three.js</strong> r${data.revision}<br>
                    ${data.type} • ${data.period}
                </div>`;
            document.body.appendChild(versionDiv);
            setTimeout(()=>versionDiv.remove(),8000);
            return data;
        };
        
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
