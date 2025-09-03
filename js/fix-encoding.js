// Script pour corriger l'encodage des caractères dans assise-manager.js
const fs = require('fs');

// Lire le fichier courant 
let content = fs.readFileSync('./assise-manager.js', 'utf8');

// Corrections supplémentaires pour les caractères restants
const additionalFixes = [
    ['Num e9ro', 'Numéro'],
    // Au cas où il y aurait d'autres variantes
    ['e9', 'é']
];

console.log('Application des corrections supplémentaires...');
additionalFixes.forEach(([from, to]) => {
    const before = content.length;
    content = content.replace(new RegExp(from, 'g'), to);
    const after = content.length;
    console.log(`${from} -> ${to}: ${before !== after ? 'APPLIQUÉ' : 'non trouvé'}`);
});

// Écrire le fichier corrigé
fs.writeFileSync('./assise-manager.js', content, 'utf8');
console.log('Corrections supplémentaires appliquées!');
