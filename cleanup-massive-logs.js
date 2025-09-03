const fs = require('fs');
const path = require('path');

console.log('🧹 Désactivation complète des logs excessifs...');

// Construction tools - Logs très répétitifs sur les fantômes et icônes
let content = fs.readFileSync('./js/construction-tools.js', 'utf8');
let originalLength = content.length;

// Désactiver tous les logs de fantôme et d'icônes
content = content.replace(/console\.log\('🧱 Fantôme: Données BrickSelector:.*?\);/g, '// $&');
content = content.replace(/console\.log\('🧱 Fantôme: Type actuel:.*?\);/g, '// $&');
content = content.replace(/console\.log\('🧱 Fantôme: Dimensions extraites:.*?\);/g, '// $&');
content = content.replace(/console\.log\('🔧 Fantôme: Type brique depuis BrickSelector.*?\);/g, '// $&');
content = content.replace(/console\.log\('🔧 Fantôme: currentMode.*?\);/g, '// $&');
content = content.replace(/console\.log\('🧱 Fantôme: Options pour brique:.*?\);/g, '// $&');
content = content.replace(/console\.log\('👻 Fantôme créé - Dimensions mesh:.*?\);/g, '// $&');
content = content.replace(/console\.log\('🔧 Mise à jour fantôme: Dimensions depuis BrickSelector:.*?\);/g, '// $&');
content = content.replace(/console\.log\('🗑️ Icône de suppression affichée pour:.*?\);/g, '// $&');
content = content.replace(/console\.log\('🗑️ Animation vers position:.*?\);/g, '// $&');
content = content.replace(/console\.log\('🗑️ Suivi de caméra configuré pour:.*?\);/g, '// $&');

fs.writeFileSync('./js/construction-tools.js', content, 'utf8');
console.log('✅ construction-tools.js: Logs de fantômes et icônes désactivés');

// Tab manager - Logs répétitifs sur les événements
content = fs.readFileSync('./js/tab-manager.js', 'utf8');
content = content.replace(/console\.log\('🔧 TabManager: Événement brickSelectionChanged reçu'\);/g, '// $&');
content = content.replace(/console\.log\('🔧 TabManager: brickType:.*?\);/g, '// $&');
content = content.replace(/console\.log\('🔧 TabManager: brickData:.*?\);/g, '// $&');
content = content.replace(/console\.log\('🔧 TabManager: currentMainTab:.*?\);/g, '// $&');
content = content.replace(/console\.log\('💾 TabManager: Sélection de coupe mémorisée:.*?\);/g, '// $&');

fs.writeFileSync('./js/tab-manager.js', content, 'utf8');
console.log('✅ tab-manager.js: Logs d\'événements désactivés');

// Brick selector - Logs répétitifs sur la sélection
content = fs.readFileSync('./js/brick-selector.js', 'utf8');
content = content.replace(/console\.log\('🧱 BrickSelector: setBrick appelé avec.*?\);/g, '// $&');
content = content.replace(/console\.log\('🛡️ BrickSelector: Préservation de la sélection de coupe récente:.*?\);/g, '// $&');

fs.writeFileSync('./js/brick-selector.js', content, 'utf8');
console.log('✅ brick-selector.js: Logs de sélection désactivés');

// Library visibility manager - Log encore actif
content = fs.readFileSync('./js/library-visibility-manager.js', 'utf8');
content = content.replace(/console\.log\('📏 Bibliothèque ajustée:.*?\);/g, '// $&');

fs.writeFileSync('./js/library-visibility-manager.js', content, 'utf8');
console.log('✅ library-visibility-manager.js: Logs d\'ajustement désactivés');

// Index.html - Log encore actif
content = fs.readFileSync('./index.html', 'utf8');
content = content.replace(/console\.log\('🎯 Script d\'alignement des menus activé'\);/g, '// $&');

fs.writeFileSync('./index.html', content, 'utf8');
console.log('✅ index.html: Log d\'alignement désactivé');

console.log('🎉 Tous les logs excessifs ont été désactivés!');
