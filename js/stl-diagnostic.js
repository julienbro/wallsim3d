/**
 * Utilitaire de diagnostic pour les fichiers STL
 * Permet de vérifier la validité d'un fichier STL avant l'impression 3D
 */

// Ajouter les fonctions de diagnostic au SceneManager
(function() {
    'use strict';

    // Attendre que SceneManager soit initialisé
    function waitForSceneManager(callback) {
        if (window.SceneManager) {
            callback();
        } else {
            setTimeout(() => waitForSceneManager(callback), 100);
        }
    }

    waitForSceneManager(() => {
    // Log retiré (initialisation outils STL)

        // ===============================================
        // VALIDATION DE FICHIER STL
        // ===============================================
        
        window.SceneManager.validateSTLContent = function(stlContent) {
            // Log retiré (début validation STL)
            
            const report = {
                isValid: true,
                errors: [],
                warnings: [],
                stats: {
                    triangleCount: 0,
                    solidCount: 0,
                    size: stlContent.length
                }
            };

            try {
                // Vérifier la structure de base
                if (!stlContent.includes('solid ')) {
                    report.errors.push('Pas d\'en-tête "solid" trouvé');
                    report.isValid = false;
                }

                if (!stlContent.includes('endsolid')) {
                    report.errors.push('Pas de fin "endsolid" trouvé');
                    report.isValid = false;
                }

                // Compter les triangles
                const facetMatches = stlContent.match(/facet normal/g);
                if (facetMatches) {
                    report.stats.triangleCount = facetMatches.length;
                } else {
                    report.warnings.push('Aucun triangle trouvé dans le fichier');
                }

                // Compter les solides
                const solidMatches = stlContent.match(/solid /g);
                if (solidMatches) {
                    report.stats.solidCount = solidMatches.length;
                }

                // Vérifier la cohérence des facets
                const outerLoopMatches = stlContent.match(/outer loop/g);
                const endloopMatches = stlContent.match(/endloop/g);
                const endfacetMatches = stlContent.match(/endfacet/g);

                if (outerLoopMatches && endloopMatches) {
                    if (outerLoopMatches.length !== endloopMatches.length) {
                        report.errors.push('Nombre incohérent de "outer loop" et "endloop"');
                        report.isValid = false;
                    }
                }

                if (facetMatches && endfacetMatches) {
                    if (facetMatches.length !== endfacetMatches.length) {
                        report.errors.push('Nombre incohérent de "facet" et "endfacet"');
                        report.isValid = false;
                    }
                }

                // Vérifier les vertices
                const vertexMatches = stlContent.match(/vertex/g);
                if (vertexMatches) {
                    const expectedVertices = report.stats.triangleCount * 3;
                    if (vertexMatches.length !== expectedVertices) {
                        report.warnings.push(`Nombre de vertices inattendu: ${vertexMatches.length} (attendu: ${expectedVertices})`);
                    }
                }

                // Vérifier la présence de valeurs invalides
                if (stlContent.includes('NaN') || stlContent.includes('Infinity')) {
                    report.errors.push('Valeurs numériques invalides détectées (NaN ou Infinity)');
                    report.isValid = false;
                }

                // Log détaillé de rapport retiré
                return report;

            } catch (error) {
                report.errors.push(`Erreur lors de la validation: ${error.message}`);
                report.isValid = false;
                return report;
            }
        };

        // ===============================================
        // RÉPARATION AUTOMATIQUE DE FICHIER STL
        // ===============================================
        
        window.SceneManager.repairSTLContent = function(stlContent) {
            // Log retiré (début réparation)
            
            let repairedContent = stlContent;
            let repairCount = 0;

            try {
                // Remplacer les valeurs invalides
                const beforeNaN = repairedContent.length;
                repairedContent = repairedContent.replace(/NaN/g, '0.000000');
                repairedContent = repairedContent.replace(/Infinity/g, '0.000000');
                repairedContent = repairedContent.replace(/-Infinity/g, '0.000000');
                
                if (repairedContent.length !== beforeNaN) {
                    repairCount++;
                    // Log retiré (valeurs invalides corrigées)
                }

                // S'assurer que le fichier commence et finit correctement
                if (!repairedContent.startsWith('solid ')) {
                    repairedContent = 'solid WallSim3D_Repaired\n' + repairedContent;
                    repairCount++;
                    // Log retiré (en-tête ajouté)
                }

                if (!repairedContent.endsWith('endsolid\n') && !repairedContent.endsWith('endsolid')) {
                    repairedContent += '\nendsolid WallSim3D_Repaired\n';
                    repairCount++;
                    // Log retiré (fin ajoutée)
                }

                // Normaliser les retours à la ligne
                repairedContent = repairedContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

                // Log retiré (réparation terminée)
                return repairedContent;

            } catch (error) {
                console.error('❌ Erreur lors de la réparation:', error);
                return stlContent;
            }
        };

        // ===============================================
        // EXPORT STL AVEC DIAGNOSTIC
        // ===============================================
        
        window.SceneManager.exportSTLWithDiagnostic = function() {
            // Log retiré (export diagnostique)
            
            try {
                // Générer le contenu STL
                const stlContent = this.exportSTLForPrinting();
                
                if (!stlContent) {
                    console.error('❌ Impossible de générer le contenu STL');
                    return null;
                }

                // Valider le contenu
                const validationReport = this.validateSTLContent(stlContent);
                
                if (!validationReport.isValid) {
                    console.warn('⚠️ Fichier STL invalide, tentative de réparation...');
                    const repairedContent = this.repairSTLContent(stlContent);
                    
                    // Re-valider après réparation
                    const secondValidation = this.validateSTLContent(repairedContent);
                    
                    if (secondValidation.isValid) {
                        // Log retiré (fichier réparé)
                        return {
                            content: repairedContent,
                            report: secondValidation,
                            repaired: true
                        };
                    } else {
                        console.error('❌ Impossible de réparer le fichier STL');
                        return {
                            content: stlContent,
                            report: validationReport,
                            repaired: false
                        };
                    }
                } else {
                    // Log retiré (fichier valide)
                    return {
                        content: stlContent,
                        report: validationReport,
                        repaired: false
                    };
                }

            } catch (error) {
                console.error('❌ Erreur lors de l\'export avec diagnostic:', error);
                return null;
            }
        };

    // Log retiré (outils ajoutés)
    });
})();
