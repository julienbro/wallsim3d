/**
 * Script de debug pour l'icône de suppression
 * Permet de diagnostiquer les problèmes de positionnement
 */

window.DEBUG_DELETE_ICON = {
    // Test de positionnement basique
    testIconPosition: function() {

        // Créer une icône de test
        const testIcon = document.createElement('div');
        testIcon.style.cssText = `
            position: fixed !important;
            top: 50px !important;
            left: 50px !important;
            width: 40px !important;
            height: 40px !important;
            background: red !important;
            border: 3px solid white !important;
            border-radius: 50% !important;
            z-index: 10000 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 18px !important;
            color: white !important;
            cursor: pointer !important;
        `;
        testIcon.innerHTML = '🗑️';
        testIcon.id = 'testDeleteIcon';
        
        document.body.appendChild(testIcon);
        
        console.log('✅ Icône de test créée en position fixe (50px, 50px)');
        
        // Supprimer après 5 secondes
        setTimeout(() => {
            testIcon.remove();
            console.log('🗑️ Icône de test supprimée');
        }, 5000);
    },
    
    // Forcer le repositionnement de l'icône actuelle
    forceReposition: function() {
        if (window.ConstructionTools && window.ConstructionTools.currentDeleteIcon) {
            const icon = window.ConstructionTools.currentDeleteIcon;
            console.log('🔧 Repositionnement forcé de l\'icône...');
            
            // Position fixe au centre de l'écran pour test
            icon.style.position = 'fixed';
            icon.style.top = '50%';
            icon.style.left = '50%';
            icon.style.transform = 'translate(-50%, -50%)';
            icon.style.zIndex = '99999';
            icon.style.display = 'flex';
            
            console.log('✅ Icône repositionnée au centre de l\'écran');
        } else {
            console.log('❌ Aucune icône de suppression active');
        }
    },
    
    // Vérifier l'état de l'icône
    checkIconState: function() {
        const icon = document.getElementById('brickDeleteIcon');
        if (icon) {
            const styles = window.getComputedStyle(icon);
            
        } else {
            console.log('❌ Aucune icône trouvée');
        }
    },
    
    // Créer une icône visible au curseur de la souris
    createMouseIcon: function() {
        const icon = document.createElement('div');
        icon.style.cssText = `
            position: fixed !important;
            width: 40px !important;
            height: 40px !important;
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
            border: 3px solid white !important;
            border-radius: 50% !important;
            z-index: 99999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            pointer-events: none !important;
        `;
        icon.innerHTML = '<i class="fas fa-trash" style="color: white; font-size: 18px;"></i>';
        icon.id = 'mouseFollowIcon';
        
        document.body.appendChild(icon);
        
        document.addEventListener('mousemove', function(e) {
            icon.style.left = (e.clientX + 10) + 'px';
            icon.style.top = (e.clientY - 50) + 'px';
        });
        
        console.log('✅ Icône qui suit la souris créée');
        
        // Supprimer après 10 secondes
        setTimeout(() => {
            icon.remove();
            console.log('🗑️ Icône souris supprimée');
        }, 10000);
    },
    
    // Créer une icône fixe temporaire pour tester
    createFixedTestIcon: function() {
        const icon = document.createElement('div');
        icon.style.cssText = `
            position: fixed !important;
            top: 20% !important;
            left: 20% !important;
            width: 50px !important;
            height: 50px !important;
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
            border: 3px solid white !important;
            border-radius: 50% !important;
            z-index: 99999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
            box-shadow: 0 6px 20px rgba(220, 38, 38, 0.5) !important;
        `;
        icon.innerHTML = '<i class="fas fa-trash" style="color: white; font-size: 20px;"></i>';
        icon.id = 'fixedTestIcon';
        icon.title = 'Icône de test - cliquez pour supprimer';
        
        icon.addEventListener('click', function() {
            console.log('🗑️ Icône de test cliquée !');
            icon.remove();
        });
        
        document.body.appendChild(icon);
        
        console.log('✅ Icône fixe de test créée en position 20%, 20%');
        
        // Animation d'attention
        setInterval(() => {
            icon.style.transform = icon.style.transform === 'scale(1.1)' ? 'scale(1)' : 'scale(1.1)';
        }, 1000);
    }
};

// Fonctions accessibles depuis la console
window.testIcon = () => window.DEBUG_DELETE_ICON.testIconPosition();
window.forceRepos = () => window.DEBUG_DELETE_ICON.forceReposition();
window.checkIcon = () => window.DEBUG_DELETE_ICON.checkIconState();
window.mouseIcon = () => window.DEBUG_DELETE_ICON.createMouseIcon();
window.fixedIcon = () => window.DEBUG_DELETE_ICON.createFixedTestIcon();

// console.log('🔧 Debug pour icône de suppression chargé');
// console.log('📝 Commandes disponibles:');
// console.log('  - testIcon() : Créer une icône de test');
// console.log('  - forceRepos() : Repositionner l\'icône actuelle');
// console.log('  - checkIcon() : Vérifier l\'état de l\'icône');
// console.log('  - mouseIcon() : Créer une icône qui suit la souris');
// console.log('  - fixedIcon() : Créer une icône fixe de test');
