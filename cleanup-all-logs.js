const fs = require('fs');
const path = require('path');

// Fichiers à traiter avec leurs patterns de logs à désactiver
const filesToProcess = [
    {
        file: 'index.html',
        patterns: [
            /console\.log\('⚙️ Configuration des logs appliquée - Mode production activé'\);/g,
            /console\.log\('🎯 Script d\'alignement des menus activé'\);/g
        ]
    },
    {
        file: 'js/debug-delete-icon.js',
        patterns: [
            /console\.log\('🔧 Debug pour icône de suppression chargé'\);/g,
            /console\.log\('📝 Commandes disponibles:'\);/g,
            /console\.log\('  - testIcon\(\) : Créer une icône de test'\);/g,
            /console\.log\('  - forceRepos\(\) : Repositionner l\'icône actuelle'\);/g,
            /console\.log\('  - checkIcon\(\) : Vérifier l\'état de l\'icône'\);/g,
            /console\.log\('  - mouseIcon\(\) : Créer une icône qui suit la souris'\);/g,
            /console\.log\('  - fixedIcon\(\) : Créer une icône fixe de test'\);/g
        ]
    },
    {
        file: 'js/library-visibility-manager.js',
        patterns: [
            /console\.log\('📏 Bibliothèque ajustée: \d+ colonnes, éléments \d+x\d+px'\);/g,
            /console\.log\('⚠️ Plus de \d+ éléments, activation du scroll vertical\.\.\.'\);/g
        ]
    },
    {
        file: 'js/tools-tab-manager.js',
        patterns: [
            /console\.warn\('⚠️ ToolsTabManager: Onglet Outils non disponible \(supprimé\)'\);/g
        ]
    },
    {
        file: 'js/tools-help-system.js',
        patterns: [
            /console\.log\('🔧 Élément non trouvé pour le sélecteur: \.visual-aids-checkboxes'\);/g
        ]
    },
    {
        file: 'js/construction-tools.js',
        patterns: [
            /console\.log\('🗑️ Icône créée avec position forcée visible'\);/g,
            /console\.log\('🗑️ Icône ajoutée au DOM, maintenant visible'\);/g,
            /console\.log\('🗑️ Icône de suppression affichée pour: ' \+ elementId\);/g,
            /console\.log\('🗑️ Animation vers position:', \{target: targetPosition, element: elementId\}\);/g,
            /console\.log\('🗑️ Suivi de caméra configuré pour: ' \+ elementId\);/g
        ]
    },
    {
        file: 'js/scene-manager.js',
        patterns: [
            /console\.log\('🔧 SceneManager: Dimensions brique depuis BrickSelector: .*'\);/g
        ]
    },
    {
        file: 'js/glb-dpad-controller.js',
        patterns: [
            /console\.log\('❌ Curseurs Y désactivés'\);/g,
            /console\.log\('🎮 D-pad remis en position initiale \(centré en bas\)'\);/g
        ]
    }
];

console.log('🧹 Désactivation des logs excessifs dans tous les fichiers...');

let totalLogs = 0;

filesToProcess.forEach(({file, patterns}) => {
    const filePath = path.join('.', file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Fichier non trouvé: ${file}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let fileChanged = false;
    let fileLogs = 0;
    
    patterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
            fileLogs += matches.length;
            content = content.replace(pattern, '// $&');
            fileChanged = true;
        }
    });
    
    if (fileChanged) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${file}: ${fileLogs} logs désactivés`);
        totalLogs += fileLogs;
    } else {
        console.log(`ℹ️ ${file}: Aucun log à désactiver`);
    }
});

console.log(`🎉 Terminé! ${totalLogs} logs au total désactivés`);
