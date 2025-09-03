// Script pour corriger les caractères d'encodage restants
const fs = require('fs');

// Lire le fichier actuel
let content = fs.readFileSync('./assise-manager.js', 'utf8');

// Corrections supplémentaires pour les caractères restants
const additionalFixes = [
    // Corrections pour les caractères mal encodés restants
    ['support×s', 'supportés'],
    ['sp×cifique', 'spécifique'],
    ['compatibilit×', 'compatibilité'],
    ['d×faut', 'défaut'],
    ['pr×sents', 'présents'],
    ['×tendus', 'étendus'],
    ['× jour', 'à jour'],
    ['×mettre', 'émettre'],
    ['×v×nement', 'événement'],
    ['apr×s', 'après'],
    ['×', 'à'], // remplacement global en dernier
];

console.log('Application des corrections supplémentaires...');
additionalFixes.forEach(([from, to]) => {
    const before = content.length;
    content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
    const after = content.length;
    if (before !== after) {
        console.log(`${from} -> ${to}: APPLIQUÉ`);
    }
});

// Écrire le fichier corrigé
fs.writeFileSync('./assise-manager.js', content, 'utf8');
console.log('Corrections supplémentaires appliquées!');
