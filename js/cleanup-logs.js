// Script pour désactiver les logs excessifs et corriger l'encodage
const fs = require('fs');

let content = fs.readFileSync('./assise-manager.js', 'utf8');

// Désactiver les logs verbeux les plus fréquents
const logsToDisable = [
    // Messages de repositionnement fréquents
    'console.log(`🔧 Joint ${elementId} ignoré lors du repositionnement (a sa propre logique)`);',
    'console.log(`🔧 Bloc/Brique ${elementId} repositionné sur assise ${index} (${type}) à Y=${element.mesh.position.y}`);',
    'console.log(`🔧 PROTECTION ANTI-BOUCLE: setJointHeightForAssise évitée pendant repositionnement`);',
    'console.log(`🔧 Joint de l\'assise ${assiseIndex} (${type}) déjà à ${h} cm, pas de modification`);',
    'console.log(`🔧 Repositionnement en cours, évitement de la boucle infinie`);',
    'console.log(`🔧 AssiseManager: Onglet Outils en cours de mise à jour, pas d\'interférence avec ${type}`);',
    
    // Messages de hauteur et calculs
    'console.log(`🔧 Hauteur de joint de l\'assise ${assiseIndex} (${type}) définie à ${h} cm`);',
    'console.log(`🔧 REPOSITIONNEMENT automatique assise ${assiseIndex} (${type}) - nouvelle hauteur: ${newAssiseHeight}cm`);',
    'console.log(`🔧 Hauteur de joint de l\'assise ${assiseIndex} (${type}) réinitialisée`);',
    
    // Messages de recherche de type
    'console.log(`🔧 AssiseManager: Type ${type} non trouvé, essai avec le type de base: ${baseType}`);',
    'console.log(`🔧 Catégorie de bloc inconnue: ${category}, utilisation du type générique \'block\'`);',
    'console.log(`🔧 BlockSelector non disponible`);'
];

// Désactiver ces logs en les commentant
logsToDisable.forEach(log => {
    content = content.replace(new RegExp(log.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `// ${log}`);
});

// Corrections d'encodage restantes
const encodingFixes = [
    ['propriàtà', 'propriété'],
    ['ràfàrence', 'référence'],
    ['stockàe', 'stockée'],
    ['placà', 'placé'],
    // Garder seulement les logs vraiment importants (erreurs critiques)
];

encodingFixes.forEach(([from, to]) => {
    content = content.replace(new RegExp(from, 'g'), to);
});

fs.writeFileSync('./assise-manager.js', content, 'utf8');
console.log('Logs excessifs désactivés et encodage corrigé!');
