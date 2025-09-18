const fs = require('fs');
const path = require('path');

const files = [
  'js/assise-manager.js',
  'js/scene-manager.js',
  'js/scene-manager-extensions.js',
  'js/insulation-selector.js',
  'js/linteau-selector.js',
  'js/construction-tools.js',
  'js/tab-manager.js',
  'js/shadow-manager.js',
  'js/edit-menu-handler.js',
  'js/toolbar-manager.js',
  'js/measurement-tool.js',
  'js/glb-dpad-controller.js'
];

let hasError = false;

for (const rel of files) {
  const file = path.join(__dirname, rel);
  const src = fs.readFileSync(file, 'utf8');
  try {
    // Wrap in a function to ensure we only parse, not execute top-level 'return' etc.
    new Function(src);
    console.log('OK  -', rel);
  } catch (e) {
    hasError = true;
    console.log('ERR -', rel, '\n   =>', e.message);
    if (e.stack) {
      const m = /<anonymous>:(\d+):(\d+)/.exec(e.stack);
      if (m) {
        console.log('   at line', m[1], 'col', m[2]);
        // Show nearby lines
        const lines = src.split(/\r?\n/);
        const idx = Math.max(0, parseInt(m[1], 10) - 3);
        const end = Math.min(lines.length, parseInt(m[1], 10) + 2);
        for (let i = idx; i < end; i++) {
          console.log(String(i+1).padStart(5), '|', lines[i]);
        }
      }
    }
  }
}

process.exit(hasError ? 1 : 0);
