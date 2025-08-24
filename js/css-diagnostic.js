/* 
 * DIAGNOSTIC CSS - WallSim3D
 * Script pour vérifier la qualité de l'uniformisation
 */

// Fonction de diagnostic CSS
function diagnoseCSSUniformity() {
    console.log("🔍 DIAGNOSTIC CSS - WallSim3D");
    console.log("==============================");
    
    // Test des variables CSS
    const testDiv = document.createElement('div');
    document.body.appendChild(testDiv);
    const styles = getComputedStyle(testDiv);
    
    const requiredVariables = [
        // Couleurs principales
        { var: '--primary-bg', desc: 'Fond principal' },
        { var: '--secondary-bg', desc: 'Fond secondaire' },
        { var: '--tertiary-bg', desc: 'Fond tertiaire' },
        { var: '--quaternary-bg', desc: 'Fond quaternaire' },
        
        // Couleurs d'accent
        { var: '--accent-color', desc: 'Couleur accent' },
        { var: '--accent-hover', desc: 'Accent survol' },
        { var: '--accent-active', desc: 'Accent actif' },
        
        // Textes
        { var: '--text-primary', desc: 'Texte principal' },
        { var: '--text-secondary', desc: 'Texte secondaire' },
        { var: '--text-muted', desc: 'Texte discret' },
        { var: '--text-disabled', desc: 'Texte désactivé' },
        
        // Bordures
        { var: '--border-color', desc: 'Bordure principale' },
        { var: '--border-light', desc: 'Bordure claire' },
        { var: '--border-focus', desc: 'Bordure focus' },
        
        // États
        { var: '--success-color', desc: 'Couleur succès' },
        { var: '--warning-color', desc: 'Couleur attention' },
        { var: '--error-color', desc: 'Couleur erreur' },
        { var: '--info-color', desc: 'Couleur info' },
        
        // Matériaux spécialisés
        { var: '--material-brick', desc: 'Matériau brique' },
        { var: '--material-block', desc: 'Matériau bloc' },
        { var: '--material-joint', desc: 'Matériau joint' },
        { var: '--material-linteau', desc: 'Matériau linteau' }
    ];
    
    console.log("📊 VARIABLES CSS:");
    let missingVars = 0;
    
    requiredVariables.forEach(item => {
        const value = styles.getPropertyValue(item.var);
        if (value && value.trim()) {
            console.log(`✅ ${item.var}: ${value} (${item.desc})`);
        } else {
            console.warn(`❌ ${item.var}: MANQUANTE (${item.desc})`);
            missingVars++;
        }
    });
    
    document.body.removeChild(testDiv);
    
    // Test des classes utilitaires
    console.log("\n🛠️ CLASSES UTILITAIRES:");
    const utilityClasses = [
        '.walsim-btn', '.walsim-btn-primary', '.btn-success', '.btn-warning', '.btn-error',
        '.walsim-input', '.walsim-panel', '.walsim-section',
        '.text-primary', '.text-secondary', '.text-muted',
        '.bg-primary', '.bg-secondary', '.bg-tertiary',
        '.message-success', '.message-warning', '.message-error', '.message-info'
    ];
    
    let availableClasses = 0;
    utilityClasses.forEach(className => {
        const elements = document.querySelectorAll(className);
        const styleSheets = Array.from(document.styleSheets);
        let classExists = false;
        
        try {
            styleSheets.forEach(sheet => {
                if (sheet.cssRules) {
                    Array.from(sheet.cssRules).forEach(rule => {
                        if (rule.selectorText && rule.selectorText.includes(className)) {
                            classExists = true;
                        }
                    });
                }
            });
        } catch (e) {
            // Ignore les erreurs CORS pour les stylesheets externes
        }
        
        if (classExists || elements.length > 0) {
            console.log(`✅ ${className}: Disponible`);
            availableClasses++;
        } else {
            console.warn(`❌ ${className}: Non trouvée`);
        }
    });
    
    // Test des fichiers CSS chargés
    console.log("\n📁 FICHIERS CSS CHARGÉS:");
    const expectedFiles = [
        'theme-unified.css',
        'unified-components.css', 
        'modern-interface.css',
        'main.css',
        'fixes-uniformity.css'
    ];
    
    let loadedFiles = 0;
    Array.from(document.styleSheets).forEach(sheet => {
        if (sheet.href) {
            const fileName = sheet.href.split('/').pop();
            if (expectedFiles.includes(fileName)) {
                console.log(`✅ ${fileName}: Chargé`);
                loadedFiles++;
            }
        }
    });
    
    expectedFiles.forEach(file => {
        const isLoaded = Array.from(document.styleSheets).some(sheet => 
            sheet.href && sheet.href.includes(file)
        );
        if (!isLoaded) {
            console.warn(`❌ ${file}: Non chargé`);
        }
    });
    
    // Score de qualité
    console.log("\n📊 SCORE DE QUALITÉ:");
    const variableScore = ((requiredVariables.length - missingVars) / requiredVariables.length) * 100;
    const classScore = (availableClasses / utilityClasses.length) * 100;
    const fileScore = (loadedFiles / expectedFiles.length) * 100;
    const totalScore = (variableScore + classScore + fileScore) / 3;
    
    console.log(`Variables CSS: ${variableScore.toFixed(1)}%`);
    console.log(`Classes utilitaires: ${classScore.toFixed(1)}%`);
    console.log(`Fichiers CSS: ${fileScore.toFixed(1)}%`);
    console.log(`\n🎯 SCORE TOTAL: ${totalScore.toFixed(1)}%`);
    
    if (totalScore >= 90) {
        console.log("🎉 EXCELLENT: Uniformisation CSS parfaite !");
    } else if (totalScore >= 75) {
        console.log("👍 BIEN: Uniformisation CSS réussie");
    } else if (totalScore >= 50) {
        console.log("⚠️ MOYEN: Uniformisation CSS à améliorer");
    } else {
        console.log("❌ FAIBLE: Uniformisation CSS insuffisante");
    }
    
    // Recommandations
    console.log("\n💡 RECOMMANDATIONS:");
    if (missingVars > 0) {
        console.log(`- Vérifiez que theme-unified.css est bien chargé en premier`);
    }
    if (availableClasses < utilityClasses.length * 0.8) {
        console.log(`- Assurez-vous que unified-components.css est chargé`);
    }
    if (loadedFiles < expectedFiles.length * 0.8) {
        console.log(`- Vérifiez l'ordre de chargement des fichiers CSS`);
    }
    
    return {
        variableScore,
        classScore,
        fileScore,
        totalScore,
        missingVars,
        availableClasses: availableClasses,
        loadedFiles
    };
}

// Fonction de test des couleurs
function testCSSColors() {
    console.log("🎨 TEST DES COULEURS CSS:");
    
    const colorTests = [
        { name: 'Fond sombre', css: 'var(--primary-bg)', expected: 'dark' },
        { name: 'Texte clair', css: 'var(--text-primary)', expected: 'light' },
        { name: 'Accent bleu', css: 'var(--accent-color)', expected: 'blue' },
        { name: 'Succès vert', css: 'var(--success-color)', expected: 'green' },
        { name: 'Attention orange', css: 'var(--warning-color)', expected: 'orange' },
        { name: 'Erreur rouge', css: 'var(--error-color)', expected: 'red' }
    ];
    
    const testDiv = document.createElement('div');
    document.body.appendChild(testDiv);
    
    colorTests.forEach(test => {
        testDiv.style.color = test.css;
        const computed = getComputedStyle(testDiv).color;
        console.log(`${test.name}: ${computed}`);
    });
    
    document.body.removeChild(testDiv);
}

// Fonction de test responsive
function testResponsiveDesign() {
    console.log("📱 TEST RESPONSIVE:");
    
    const originalWidth = window.innerWidth;
    const breakpoints = [
        { name: 'Mobile', width: 480 },
        { name: 'Tablette', width: 768 },
        { name: 'Desktop', width: 1200 }
    ];
    
    breakpoints.forEach(bp => {
        // Simulation du breakpoint (pour test visuel)
        console.log(`${bp.name} (${bp.width}px): Testez manuellement`);
    });
}

// Export des fonctions
if (typeof window !== 'undefined') {
    window.diagnoseCSSUniformity = diagnoseCSSUniformity;
    window.testCSSColors = testCSSColors;
    window.testResponsiveDesign = testResponsiveDesign;
    
    // Diagnostic automatique au chargement
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log("🚀 Lancement du diagnostic CSS automatique...");
            diagnoseCSSUniformity();
        }, 1000);
    });
}

// Instructions console
console.log("🔧 FONCTIONS DISPONIBLES:");
console.log("- diagnoseCSSUniformity() : Diagnostic complet");
console.log("- testCSSColors() : Test des couleurs");
console.log("- testResponsiveDesign() : Test responsive");
