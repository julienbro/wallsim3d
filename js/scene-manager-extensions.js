/**
 * Extensions pour le SceneManager - Export et capture
 * WallSim3D - Scene Manager Extensions
 */

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

    // Initialiser les extensions une fois SceneManager prêt
    waitForSceneManager(() => {
        // console.log('🔧 Ajout des extensions d\'export au SceneManager...');
        
        // ===============================================
        // EXPORT STL
        // ===============================================
        
        window.SceneManager.exportSTL = function() {
            // console.log('📤 Export STL en cours...');
            
            if (!window.THREE) {
                // console.error('❌ Three.js non disponible');
                return null;
            }

            try {
                // Créer un groupe temporaire avec tous les éléments
                const exportGroup = new THREE.Group();
                
                // Parcourir tous les éléments de la scène
                this.scene.traverse((object) => {
                    if (object.geometry && object.material && object.parent !== exportGroup) {
                        // Cloner l'objet pour l'export
                        const clone = object.clone(true);
                        clone.updateMatrixWorld(true);
                        
                        // Appliquer les transformations
                        if (clone.geometry) {
                            clone.geometry.applyMatrix4(clone.matrixWorld);
                        }
                        
                        exportGroup.add(clone);
                    }
                });

                // Générer le contenu STL
                const stlContent = this.generateSTLContent(exportGroup);
                
                console.log('✅ Export STL terminé');
                return stlContent;
                
            } catch (error) {
                console.error('❌ Erreur lors de l\'export STL:', error);
                return null;
            }
        };

        // ===============================================
        // CONFIGURATION D'ORIENTATION POUR L'EXPORT
        // ===============================================
        
        window.SceneManager.exportOrientation = {
            axis: 'x',           // 'x', 'y', 'z'
            angle: Math.PI / 2,  // en radians (90° par défaut)
            enabled: true        // true pour appliquer la rotation, false pour export original
        };
        
        window.SceneManager.setExportOrientation = function(axis, degrees, enabled = true) {
            this.exportOrientation.axis = axis;
            this.exportOrientation.angle = degrees * Math.PI / 180;
            this.exportOrientation.enabled = enabled;
            console.log(`🔧 Orientation d'export mise à jour: ${enabled ? degrees + '° autour de ' + axis.toUpperCase() : 'Désactivée'}`);
        };
        
        window.SceneManager.getExportOrientation = function() {
            return {
                axis: this.exportOrientation.axis,
                degrees: this.exportOrientation.angle * 180 / Math.PI,
                enabled: this.exportOrientation.enabled
            };
        };

        // ===============================================
        // EXPORT STL POUR IMPRESSION 3D
        // ===============================================
        
        window.SceneManager.exportSTLForPrinting = function() {
            console.log('📤 Export STL pour impression 3D en cours...');
            
            if (!window.THREE) {
                console.error('❌ Three.js non disponible');
                return null;
            }

            try {
                // Créer un groupe temporaire avec seulement les éléments de construction
                const exportGroup = new THREE.Group();
                let exportedCount = 0;
                
                // Utiliser la configuration d'orientation
                let rotationMatrix = null;
                if (this.exportOrientation.enabled) {
                    switch(this.exportOrientation.axis) {
                        case 'x':
                            rotationMatrix = new THREE.Matrix4().makeRotationX(this.exportOrientation.angle);
                            break;
                        case 'y':
                            rotationMatrix = new THREE.Matrix4().makeRotationY(this.exportOrientation.angle);
                            break;
                        case 'z':
                            rotationMatrix = new THREE.Matrix4().makeRotationZ(this.exportOrientation.angle);
                            break;
                    }
                    console.log(`🔄 Application rotation configurée: ${(this.exportOrientation.angle * 180 / Math.PI).toFixed(0)}° autour de ${this.exportOrientation.axis.toUpperCase()}`);
                } else {
                    console.log('⚪ Export sans rotation (orientation originale)');
                }
                
                // Utiliser directement SceneManager.elements qui contient les éléments insérés
                if (this.elements && this.elements.size > 0) {
                    console.log(`📊 Traitement de ${this.elements.size} éléments de la scène...`);
                    
                    this.elements.forEach((element, elementId) => {
                        // DIAGNOSTIC: Afficher les détails de chaque élément
                        console.log(`🔍 [DEBUG] Élément ${elementId}:`, {
                            type: element.type,
                            userData: element.userData,
                            hasType: !!element.type,
                            hasUserData: !!element.userData,
                            userDataType: element.userData?.type,
                            userDataElementType: element.userData?.elementType,
                            hasMesh: !!element.mesh
                        });
                        
                        // Test de détection de construction
                        const isConstruction = this.isConstructionElement(element);
                        console.log(`🔍 [DEBUG] Test isConstructionElement pour ${elementId}: ${isConstruction}`);
                        
                        // Vérifier si c'est un élément de construction valide
                        if (isConstruction) {
                            // Fonction pour extraire les meshes d'un élément GLB
                            const extractGLBMeshes = (element) => {
                                const meshes = [];
                                
                                // Cas 1: element.mesh direct avec géométrie
                                if (element.mesh && element.mesh.geometry && element.mesh.material) {
                                    meshes.push(element.mesh);
                                }
                                // Cas 2: element.mesh avec children (modèles GLB complexes)
                                else if (element.mesh && element.mesh.children && element.mesh.children.length > 0) {
                                    // Parcourir récursivement pour trouver tous les meshes
                                    const traverseMeshes = (obj) => {
                                        if (obj.geometry && obj.material) {
                                            meshes.push(obj);
                                        }
                                        if (obj.children) {
                                            obj.children.forEach(child => traverseMeshes(child));
                                        }
                                    };
                                    element.mesh.children.forEach(child => traverseMeshes(child));
                                }
                                // Cas 3: element direct est un mesh
                                else if (element.geometry && element.material) {
                                    meshes.push(element);
                                }
                                
                                return meshes;
                            };
                            
                            // Déterminer si c'est un élément GLB
                            const isGLB = element.type === 'glb' || element.userData?.elementType === 'glb' || element.userData?.type === 'imported_model';
                            
                            // Traitement spécialisé pour GLB
                            if (isGLB) {
                                const glbMeshes = extractGLBMeshes(element);
                                if (glbMeshes.length > 0) {
                                    console.log(`🔍 [GLB Export] Trouvé ${glbMeshes.length} mesh(es) dans l'élément GLB ${elementId}`);
                                    
                                    glbMeshes.forEach((mesh, index) => {
                                        console.log(`🔍 [GLB Transform] Mesh ${index + 1}: pos(${mesh.position.x.toFixed(2)}, ${mesh.position.y.toFixed(2)}, ${mesh.position.z.toFixed(2)}), scale(${mesh.scale.x.toFixed(2)}, ${mesh.scale.y.toFixed(2)}, ${mesh.scale.z.toFixed(2)})`);
                                        if (element.mesh) {
                                            console.log(`🔍 [GLB Transform] Element parent: pos(${element.mesh.position.x.toFixed(2)}, ${element.mesh.position.y.toFixed(2)}, ${element.mesh.position.z.toFixed(2)}), scale(${element.mesh.scale.x.toFixed(2)}, ${element.mesh.scale.y.toFixed(2)}, ${element.mesh.scale.z.toFixed(2)})`);
                                        }
                                        
                                        // Traitement standard pour chaque mesh GLB
                                        const originalGeometry = mesh.geometry;
                                        const clonedGeometry = originalGeometry.clone();
                                        
                                        // CORRECTION: Utiliser directement la matrice monde complète du mesh
                                        // Cela garantit que toutes les transformations (position, rotation, échelle) 
                                        // du mesh ET de ses parents sont correctement appliquées
                                        mesh.updateMatrixWorld(true);
                                        clonedGeometry.applyMatrix4(mesh.matrixWorld);
                                        
                                        console.log(`🔍 [GLB Transform] MatrixWorld appliquée pour mesh ${index + 1}`);
                                        
                                        // Puis appliquer la rotation pour l'impression 3D
                                        if (rotationMatrix) {
                                            clonedGeometry.applyMatrix4(rotationMatrix);
                                        }
                                        
                                        // Créer le mesh d'export final avec géométrie transformée
                                        const exportMesh = new THREE.Mesh(clonedGeometry, mesh.material);
                                        exportGroup.add(exportMesh);
                                        
                                        exportedCount++;
                                        console.log(`✅ Mesh GLB ${index + 1}/${glbMeshes.length} ajouté avec rotation: ${elementId} (${element.type})`);
                                    });
                                } else {
                                    console.log(`⚠️ Aucun mesh trouvé dans l'élément GLB: ${elementId}`);
                                }
                            }
                            // Récupérer le mesh associé à l'élément (traitement standard)
                            else if (element.mesh && element.mesh.geometry && element.mesh.material) {
                                
                                // Traitement spécial pour les joints
                                const isJoint = element.userData?.isHorizontalJoint || 
                                               element.userData?.isVerticalJoint ||
                                               element.userData?.elementType === 'horizontal-joint' ||
                                               element.userData?.elementType === 'vertical-joint' ||
                                               element.userData?.elementType === 'joint' ||
                                               element.isHorizontalJoint || 
                                               element.isVerticalJoint ||
                                               element.type === 'joint';
                                
                                if (isJoint) {
                                    // Utiliser le traitement spécial pour les joints
                                    const jointResult = this.processJointForPrinting(element, rotationMatrix);
                                    if (jointResult && jointResult.mesh) {
                                        exportGroup.add(jointResult.mesh);
                                        exportedCount++;
                                        const thickeningSuffix = jointResult.wasThickened ? ' (épaissi pour impression)' : '';
                                        console.log(`✅ Joint ajouté avec rotation${thickeningSuffix}: ${elementId} (${jointResult.jointType})`);
                                    } else {
                                        console.log(`⚠️ Échec traitement joint: ${elementId}`);
                                    }
                                } else {
                                    // Traitement standard pour les autres éléments
                                    // IMPORTANT: Cloner la géométrie pour ne pas affecter l'original
                                    const originalGeometry = element.mesh.geometry;
                                    const clonedGeometry = originalGeometry.clone();
                                    
                                    // Créer un mesh temporaire avec la géométrie clonée
                                    const tempMesh = new THREE.Mesh(clonedGeometry, element.mesh.material);
                                    tempMesh.position.copy(element.mesh.position);
                                    tempMesh.rotation.copy(element.mesh.rotation);
                                    tempMesh.scale.copy(element.mesh.scale);
                                    tempMesh.updateMatrixWorld(true);
                                    
                                    // Appliquer les transformations sur la géométrie clonée uniquement
                                    // D'abord appliquer la matrice monde de l'objet
                                    clonedGeometry.applyMatrix4(tempMesh.matrixWorld);
                                    
                                    // Puis appliquer la rotation pour l'impression 3D
                                    clonedGeometry.applyMatrix4(rotationMatrix);
                                    
                                    // Créer un nouveau mesh pour l'export avec la géométrie transformée
                                    const exportMesh = new THREE.Mesh(clonedGeometry, element.mesh.material);
                                    exportGroup.add(exportMesh);
                                    
                                    exportedCount++;
                                    console.log(`✅ Élément ajouté avec rotation (géométrie clonée): ${elementId} (${element.type})`);
                                }
                            } else {
                                console.log(`⚠️ Élément ignoré (pas de mesh): ${elementId} (${element.type})`);
                            }
                        } else {
                            console.log(`⚠️ Élément ignoré (pas de construction): ${elementId} (${element.type || 'type inconnu'})`);
                        }
                    });
                } else {
                    console.warn('⚠️ Aucun élément trouvé dans SceneManager.elements');
                }

                if (exportedCount === 0) {
                    console.warn('⚠️ Aucun élément de construction trouvé pour l\'export');
                    return 'solid WallSim3D_Print_Empty\nendsolid WallSim3D_Print_Empty\n';
                }

                // Générer le contenu STL avec validation
                const stlContent = this.generateValidatedSTLContent(exportGroup);
                
                console.log(`✅ Export STL pour impression 3D terminé - ${exportedCount} objets exportés avec rotation Z-up`);
                return stlContent;
                
            } catch (error) {
                console.error('❌ Erreur lors de l\'export STL pour impression 3D:', error);
                return null;
            }
        };

        // ===============================================
        // FONCTION DE DIAGNOSTIC ET CORRECTION GÉOMÉTRIE GLB
        // ===============================================
        
        window.SceneManager.diagnoseAndFixGLBGeometry = function(element) {
            if (!element) {
                console.warn(`⚠️ Élément GLB invalide: élément null`);
                return { isValid: false, errors: ['Élément null'], fixed: false };
            }
            
            // Pour les éléments GLB, vérifier différentes structures possibles
            let meshToCheck = null;
            let geometryFound = false;
            
            // Cas 1: element.mesh direct
            if (element.mesh && element.mesh.geometry) {
                meshToCheck = element.mesh;
                geometryFound = true;
                console.log(`🔍 [GLB Diagnostic] Géométrie trouvée dans element.mesh pour ${element.id}`);
            }
            // Cas 2: element.mesh avec children (modèles GLB complexes)
            else if (element.mesh && element.mesh.children && element.mesh.children.length > 0) {
                // Chercher le premier enfant avec géométrie
                for (let child of element.mesh.children) {
                    if (child.geometry) {
                        meshToCheck = child;
                        geometryFound = true;
                        console.log(`🔍 [GLB Diagnostic] Géométrie trouvée dans child mesh pour ${element.id}`);
                        break;
                    }
                    // Recherche récursive dans les sous-enfants
                    if (child.children && child.children.length > 0) {
                        for (let subChild of child.children) {
                            if (subChild.geometry) {
                                meshToCheck = subChild;
                                geometryFound = true;
                                console.log(`🔍 [GLB Diagnostic] Géométrie trouvée dans sub-child mesh pour ${element.id}`);
                                break;
                            }
                        }
                        if (geometryFound) break;
                    }
                }
            }
            // Cas 3: element direct est un mesh
            else if (element.geometry) {
                meshToCheck = element;
                geometryFound = true;
                console.log(`🔍 [GLB Diagnostic] Géométrie trouvée directement dans element pour ${element.id}`);
            }
            
            // Si aucune géométrie trouvée, considérer comme valide pour les GLB (peuvent être des groupes)
            if (!geometryFound) {
                console.log(`⚠️ [GLB Diagnostic] Aucune géométrie directe trouvée pour ${element.id}, mais autorisé pour GLB`);
                return { isValid: true, errors: [], fixed: false, note: 'GLB sans géométrie directe (groupe ou container)' };
            }
            
            const geometry = meshToCheck.geometry;
            const errors = [];
            let needsFix = false;
            
            // Vérifier les attributs de base
            if (!geometry.attributes || !geometry.attributes.position) {
                errors.push('Pas d\'attribut position');
                return { isValid: false, errors, fixed: false };
            }
            
            // Vérifier les valeurs des positions
            const positions = geometry.attributes.position.array;
            let invalidValues = 0;
            for (let i = 0; i < positions.length; i++) {
                if (!isFinite(positions[i]) || isNaN(positions[i])) {
                    invalidValues++;
                }
            }
            
            if (invalidValues > 0) {
                errors.push(`${invalidValues} valeurs de position invalides`);
                needsFix = true;
            }
            
            // Vérifier les normales
            if (!geometry.attributes.normal) {
                console.log(`🔧 Calcul des normales manquantes pour: ${element.id}`);
                try {
                    geometry.computeVertexNormals();
                    needsFix = true;
                } catch (e) {
                    errors.push('Impossible de calculer les normales');
                }
            }
            
            // Vérifier la structure des faces
            if (geometry.index) {
                const indices = geometry.index.array;
                const maxIndex = geometry.attributes.position.count - 1;
                for (let i = 0; i < indices.length; i++) {
                    if (indices[i] > maxIndex || indices[i] < 0) {
                        errors.push('Indices hors limites');
                        needsFix = true;
                        break;
                    }
                }
            }
            
            // Tentative de correction si nécessaire
            if (needsFix && invalidValues === 0) {
                try {
                    // Nettoyer la géométrie
                    if (geometry.deleteAttribute) {
                        // Supprimer les attributs corrompus
                        const attributes = Object.keys(geometry.attributes);
                        attributes.forEach(attr => {
                            if (attr !== 'position' && attr !== 'normal') {
                                const attrArray = geometry.attributes[attr].array;
                                for (let i = 0; i < attrArray.length; i++) {
                                    if (!isFinite(attrArray[i])) {
                                        geometry.deleteAttribute(attr);
                                        console.log(`🔧 Attribut corrompu ${attr} supprimé`);
                                        break;
                                    }
                                }
                            }
                        });
                    }
                    
                    // Recalculer les normales
                    geometry.computeVertexNormals();
                    
                    // Calculer la bounding box
                    geometry.computeBoundingBox();
                    
                    console.log(`✅ Géométrie GLB corrigée: ${element.id}`);
                    return { isValid: true, errors: [], fixed: true };
                    
                } catch (fixError) {
                    errors.push(`Échec correction: ${fixError.message}`);
                    return { isValid: false, errors, fixed: false };
                }
            }
            
            const isValid = errors.length === 0;
            return { isValid, errors, fixed: needsFix && isValid };
        };

        // ===============================================
        // FONCTION DE VÉRIFICATION POUR ÉLÉMENTS DE CONSTRUCTION
        // ===============================================
        
        window.SceneManager.isConstructionElement = function(element) {
            if (!element) {
                console.log(`🔍 [isConstructionElement] Élément null/undefined`);
                return false;
            }
            
            console.log(`🔍 [isConstructionElement] Test élément:`, {
                id: element.id,
                type: element.type,
                userDataType: element.userData?.type,
                userDataElementType: element.userData?.elementType
            });
            
            // Vérifier le type d'élément principal
            if (element.type) {
                const constructionTypes = ['brick', 'block', 'insulation', 'linteau', 'beam', 'joint'];
                if (constructionTypes.includes(element.type)) {
                    console.log(`🔍 [isConstructionElement] Détecté par type principal: ${element.type}`);
                    return true;
                }
            }
            
            // Si pas de type direct, vérifier dans userData
            if (element.userData && element.userData.type) {
                const constructionTypes = ['brick', 'block', 'insulation', 'linteau', 'beam', 'joint'];
                if (constructionTypes.includes(element.userData.type)) {
                    console.log(`🔍 [isConstructionElement] Détecté par userData.type: ${element.userData.type}`);
                    return true;
                }
            }
            
            // Vérifier spécifiquement les éléments GLB (bibliothèque)
            if (element.userData) {
                // Éléments GLB par elementType
                if (element.userData.elementType === 'glb') {
                    console.log(`🔍 [isConstructionElement] Élément GLB détecté par userData.elementType`);
                    // DIAGNOSTIC GLB: Vérifier et corriger la géométrie si nécessaire
                    const diagnostic = this.diagnoseAndFixGLBGeometry(element);
                    if (!diagnostic.isValid) {
                        console.warn(`⚠️ Élément GLB avec géométrie invalide ignoré: ${element.id} - Erreurs: ${diagnostic.errors.join(', ')}`);
                        return false;
                    }
                    if (diagnostic.fixed) {
                        console.log(`✅ Élément GLB détecté et corrigé pour export: ${element.id || 'ID_inconnu'} (${element.userData.name || element.type || 'GLB'})`);
                    } else {
                        console.log(`✅ Élément GLB détecté pour export: ${element.id || 'ID_inconnu'} (${element.userData.name || element.type || 'GLB'})`);
                    }
                    return true;
                }
                
                // NOUVEAU: Détecter les éléments GLB par type principal ET userData.type
                if (element.type === 'glb' && element.userData.type === 'imported_model') {
                    console.log(`🔍 [isConstructionElement] Élément GLB importé détecté (type='glb', userData.type='imported_model')`);
                    // DIAGNOSTIC GLB: Vérifier et corriger la géométrie si nécessaire
                    const diagnostic = this.diagnoseAndFixGLBGeometry(element);
                    if (!diagnostic.isValid) {
                        console.warn(`⚠️ Élément GLB importé avec géométrie invalide ignoré: ${element.id} - Erreurs: ${diagnostic.errors.join(', ')}`);
                        return false;
                    }
                    if (diagnostic.fixed) {
                        console.log(`✅ Élément GLB importé détecté et corrigé pour export: ${element.id || 'ID_inconnu'} (${element.userData.name || element.type || 'GLB'})`);
                    } else {
                        console.log(`✅ Élément GLB importé détecté pour export: ${element.id || 'ID_inconnu'} (${element.userData.name || element.type || 'GLB'})`);
                    }
                    return true;
                }
                
                // Vérifier types spécifiques GLB de la bibliothèque
                const glbTypes = [
                    // Planchers
                    'hourdis_13_60', 'hourdis_16_60', 'poutrain_beton_12', 'claveau_beton_12_53',
                    // Outils
                    'betonniere', 'brouette'
                ];
                if (glbTypes.includes(element.userData.type) || glbTypes.includes(element.type)) {
                    console.log(`🔍 [isConstructionElement] Élément GLB spécifique détecté: ${element.userData.type || element.type}`);
                    // DIAGNOSTIC GLB: Vérifier et corriger la géométrie si nécessaire
                    const diagnostic = this.diagnoseAndFixGLBGeometry(element);
                    if (!diagnostic.isValid) {
                        console.warn(`⚠️ Élément GLB spécifique avec géométrie invalide ignoré: ${element.id} (${element.userData.type || element.type}) - Erreurs: ${diagnostic.errors.join(', ')}`);
                        return false;
                    }
                    if (diagnostic.fixed) {
                        console.log(`✅ Élément GLB spécifique détecté et corrigé: ${element.id || 'ID_inconnu'} (${element.userData.type || element.type})`);
                    } else {
                        console.log(`✅ Élément GLB spécifique détecté: ${element.id || 'ID_inconnu'} (${element.userData.type || element.type})`);
                    }
                    return true;
                }
                
                // Vérifier les joints par leurs propriétés
                const isJoint = element.userData.isHorizontalJoint || 
                               element.userData.isVerticalJoint ||
                               element.userData.elementType === 'horizontal-joint' ||
                               element.userData.elementType === 'vertical-joint' ||
                               element.userData.elementType === 'joint';
                if (isJoint) return true;
            }
            
            // Vérifier les propriétés directes de l'élément pour les joints
            if (element.isHorizontalJoint || element.isVerticalJoint) {
                return true;
            }
            
            return false;
        };

        // ===============================================
        // FONCTION DE TRAITEMENT SPÉCIAL POUR LES JOINTS
        // ===============================================
        
        window.SceneManager.processJointForPrinting = function(jointElement, rotationMatrix = null) {
            if (!jointElement || !jointElement.mesh) return null;
            
            const originalMesh = jointElement.mesh;
            
            // Déterminer le type de joint
            const isHorizontal = jointElement.userData?.isHorizontalJoint || 
                               jointElement.userData?.elementType === 'horizontal-joint' ||
                               jointElement.isHorizontalJoint;
            
            const isVertical = jointElement.userData?.isVerticalJoint || 
                              jointElement.userData?.elementType === 'vertical-joint' ||
                              jointElement.isVerticalJoint;
            
            console.log(`🔧 Traitement joint pour impression: ${jointElement.id || 'ID_inconnu'} (${isHorizontal ? 'horizontal' : isVertical ? 'vertical' : 'type_inconnu'})`);
            
            // Cloner la géométrie originale
            const clonedGeometry = originalMesh.geometry.clone();
            
            // Créer un mesh temporaire
            const tempMesh = new THREE.Mesh(clonedGeometry, originalMesh.material);
            tempMesh.position.copy(originalMesh.position);
            tempMesh.rotation.copy(originalMesh.rotation);
            tempMesh.scale.copy(originalMesh.scale);
            tempMesh.updateMatrixWorld(true);
            
            // Vérifier si le joint est trop fin pour l'impression
            const bbox = new THREE.Box3().setFromObject(tempMesh);
            const dimensions = bbox.getSize(new THREE.Vector3());
            const minPrintThickness = 0.01; // 1cm minimum pour l'impression
            
            let needsThickening = false;
            if (dimensions.x < minPrintThickness || dimensions.y < minPrintThickness || dimensions.z < minPrintThickness) {
                needsThickening = true;
                console.log(`⚠️ Joint trop fin détecté, épaississement nécessaire: ${dimensions.x.toFixed(3)} x ${dimensions.y.toFixed(3)} x ${dimensions.z.toFixed(3)}`);
                
                // Épaissir le joint pour le rendre imprimable
                if (isHorizontal) {
                    // Pour un joint horizontal, augmenter l'épaisseur en Y
                    if (dimensions.y < minPrintThickness) {
                        tempMesh.scale.y *= (minPrintThickness / dimensions.y);
                    }
                } else if (isVertical) {
                    // Pour un joint vertical, augmenter l'épaisseur en X ou Z (le plus petit)
                    if (dimensions.x < minPrintThickness) {
                        tempMesh.scale.x *= (minPrintThickness / dimensions.x);
                    }
                    if (dimensions.z < minPrintThickness) {
                        tempMesh.scale.z *= (minPrintThickness / dimensions.z);
                    }
                }
                
                tempMesh.updateMatrixWorld(true);
                console.log(`✅ Joint épaissi pour impression: ${isHorizontal ? 'horizontal' : 'vertical'}`);
            }
            
            // Appliquer les transformations
            clonedGeometry.applyMatrix4(tempMesh.matrixWorld);
            
            // Appliquer la rotation si nécessaire
            if (rotationMatrix) {
                clonedGeometry.applyMatrix4(rotationMatrix);
            }
            
            // Créer le mesh final pour l'export
            const exportMesh = new THREE.Mesh(clonedGeometry, originalMesh.material);
            
            return {
                mesh: exportMesh,
                wasThickened: needsThickening,
                jointType: isHorizontal ? 'horizontal' : isVertical ? 'vertical' : 'unknown',
                originalDimensions: dimensions
            };
        };

        // ===============================================
        // EXPORT STL AVEC OPTIONS D'ORIENTATION
        // ===============================================
        
        window.SceneManager.exportSTLForPrintingWithOptions = function(options = {}) {
            console.log('📤 Export STL pour impression 3D avec options...');
            
            const { 
                applyRotation = true,      // Par défaut, appliquer la rotation Z-up
                rotationAngle = Math.PI / 2,  // +90° autour de X par défaut (CORRIGÉ)
                rotationAxis = 'x'         // Axe de rotation
            } = options;
            
            if (!window.THREE) {
                console.error('❌ Three.js non disponible');
                return null;
            }

            try {
                // Créer un groupe temporaire avec seulement les éléments de construction
                const exportGroup = new THREE.Group();
                let exportedCount = 0;
                
                // Matrice de rotation optionnelle
                let rotationMatrix = null;
                if (applyRotation) {
                    switch(rotationAxis.toLowerCase()) {
                        case 'x':
                            rotationMatrix = new THREE.Matrix4().makeRotationX(rotationAngle);
                            break;
                        case 'y':
                            rotationMatrix = new THREE.Matrix4().makeRotationY(rotationAngle);
                            break;
                        case 'z':
                            rotationMatrix = new THREE.Matrix4().makeRotationZ(rotationAngle);
                            break;
                        default:
                            rotationMatrix = new THREE.Matrix4().makeRotationX(rotationAngle);
                    }
                    console.log(`🔄 Rotation appliquée: ${rotationAngle * 180 / Math.PI}° autour de l'axe ${rotationAxis.toUpperCase()}`);
                }
                
                // Utiliser directement SceneManager.elements qui contient les éléments insérés
                if (this.elements && this.elements.size > 0) {
                    console.log(`📊 Traitement de ${this.elements.size} éléments de la scène...`);
                    
                    this.elements.forEach((element, elementId) => {
                        // Vérifier si c'est un élément de construction valide
                        if (this.isConstructionElement(element)) {
                            // Récupérer le mesh associé à l'élément
                            if (element.mesh && element.mesh.geometry && element.mesh.material) {
                                
                                // Traitement spécial pour les joints
                                const isJoint = element.userData?.isHorizontalJoint || 
                                               element.userData?.isVerticalJoint ||
                                               element.userData?.elementType === 'horizontal-joint' ||
                                               element.userData?.elementType === 'vertical-joint' ||
                                               element.userData?.elementType === 'joint' ||
                                               element.isHorizontalJoint || 
                                               element.isVerticalJoint ||
                                               element.type === 'joint';
                                
                                if (isJoint) {
                                    // Utiliser le traitement spécial pour les joints
                                    const jointResult = this.processJointForPrinting(element, rotationMatrix);
                                    if (jointResult && jointResult.mesh) {
                                        exportGroup.add(jointResult.mesh);
                                        exportedCount++;
                                        const rotationSuffix = applyRotation ? ' avec rotation' : '';
                                        const thickeningSuffix = jointResult.wasThickened ? ' (épaissi pour impression)' : '';
                                        console.log(`✅ Joint ajouté${rotationSuffix}${thickeningSuffix}: ${elementId} (${jointResult.jointType})`);
                                    } else {
                                        console.log(`⚠️ Échec traitement joint: ${elementId}`);
                                    }
                                } else {
                                    // Traitement standard pour les autres éléments
                                    // IMPORTANT: Cloner la géométrie pour ne pas affecter l'original
                                    const originalGeometry = element.mesh.geometry;
                                    const clonedGeometry = originalGeometry.clone();
                                    
                                    // Créer un mesh temporaire avec la géométrie clonée
                                    const tempMesh = new THREE.Mesh(clonedGeometry, element.mesh.material);
                                    tempMesh.position.copy(element.mesh.position);
                                    tempMesh.rotation.copy(element.mesh.rotation);
                                    tempMesh.scale.copy(element.mesh.scale);
                                    tempMesh.updateMatrixWorld(true);
                                    
                                    // Appliquer les transformations sur la géométrie clonée uniquement
                                    // D'abord appliquer la matrice monde de l'objet
                                    clonedGeometry.applyMatrix4(tempMesh.matrixWorld);
                                    
                                    // Puis appliquer la rotation si demandée
                                    if (rotationMatrix) {
                                        clonedGeometry.applyMatrix4(rotationMatrix);
                                    }
                                    
                                    // Créer un nouveau mesh pour l'export avec la géométrie transformée
                                    const exportMesh = new THREE.Mesh(clonedGeometry, element.mesh.material);
                                    exportGroup.add(exportMesh);
                                    
                                    exportedCount++;
                                    const rotationSuffix = applyRotation ? ' avec rotation (géométrie clonée)' : ' (géométrie clonée)';
                                    console.log(`✅ Élément ajouté${rotationSuffix}: ${elementId} (${element.type})`);
                                }
                            } else {
                                console.log(`⚠️ Élément ignoré (pas de mesh): ${elementId} (${element.type})`);
                            }
                        } else {
                            console.log(`⚠️ Élément ignoré (pas de construction): ${elementId} (${element.type || 'type inconnu'})`);
                        }
                    });
                } else {
                    console.warn('⚠️ Aucun élément trouvé dans SceneManager.elements');
                }

                if (exportedCount === 0) {
                    console.warn('⚠️ Aucun élément de construction trouvé pour l\'export');
                    return 'solid WallSim3D_Print_Empty\nendsolid WallSim3D_Print_Empty\n';
                }

                // Générer le contenu STL avec validation
                const stlContent = this.generateValidatedSTLContent(exportGroup);
                
                const orientationInfo = applyRotation ? ` avec orientation ${rotationAxis.toUpperCase()}-up` : ' sans rotation';
                console.log(`✅ Export STL pour impression 3D terminé - ${exportedCount} objets exportés${orientationInfo}`);
                return stlContent;
                
            } catch (error) {
                console.error('❌ Erreur lors de l\'export STL pour impression 3D:', error);
                return null;
            }
        };

        // ===============================================
        // EXPORT STL SANS ROTATION (Y-up original)
        // ===============================================
        
        window.SceneManager.exportSTLForPrintingYUp = function() {
            // Utilise la version avec options sans rotation
            return this.exportSTLForPrintingWithOptions({
                applyRotation: false
            });
        };

        // ===============================================
        // VÉRIFICATION DE L'INTÉGRITÉ DE LA SCÈNE
        // ===============================================
        
        window.SceneManager.verifySceneIntegrity = function() {

            if (!this.elements || this.elements.size === 0) {
                console.log('✅ Aucun élément à vérifier');
                return true;
            }
            
            let integrityOK = true;
            const verificationResults = [];
            
            this.elements.forEach((element, elementId) => {
                if (element.mesh && element.mesh.geometry) {
                    const mesh = element.mesh;
                    const result = {
                        id: elementId,
                        type: element.type,
                        position: {
                            x: mesh.position.x.toFixed(3),
                            y: mesh.position.y.toFixed(3),
                            z: mesh.position.z.toFixed(3)
                        },
                        rotation: {
                            x: mesh.rotation.x.toFixed(3),
                            y: mesh.rotation.y.toFixed(3),
                            z: mesh.rotation.z.toFixed(3)
                        },
                        scale: {
                            x: mesh.scale.x.toFixed(3),
                            y: mesh.scale.y.toFixed(3),
                            z: mesh.scale.z.toFixed(3)
                        },
                        geometryVertices: mesh.geometry.attributes.position ? mesh.geometry.attributes.position.count : 'N/A'
                    };
                    
                    verificationResults.push(result);
                    console.log(`📋 ${elementId}: Pos[${result.position.x},${result.position.y},${result.position.z}] Rot[${result.rotation.x},${result.rotation.y},${result.rotation.z}]`);
                }
            });
            
            console.log(`✅ Vérification terminée - ${verificationResults.length} éléments vérifiés`);
            return { integrityOK, verificationResults };
        };

        // ===============================================
        // EXPORT OBJ
        // ===============================================
        
        window.SceneManager.exportOBJ = function() {
            console.log('📤 Export OBJ en cours...');
            
            if (!window.THREE) {
                console.error('❌ Three.js non disponible');
                return null;
            }

            try {
                // Créer un groupe temporaire avec tous les éléments
                const exportGroup = new THREE.Group();
                
                // Parcourir tous les éléments de la scène
                this.scene.traverse((object) => {
                    if (object.geometry && object.material && object.parent !== exportGroup) {
                        const clone = object.clone(true);
                        exportGroup.add(clone);
                    }
                });

                // Générer le contenu OBJ
                const objContent = this.generateOBJContent(exportGroup);
                
                console.log('✅ Export OBJ terminé');
                return objContent;
                
            } catch (error) {
                console.error('❌ Erreur lors de l\'export OBJ:', error);
                return null;
            }
        };

        // ===============================================
        // CAPTURE D'IMAGE
        // ===============================================
        
        window.SceneManager.captureImage = function(format = 'png', callback) {
            console.log(`📸 Capture d'image au format ${format}...`);
            
            if (!this.renderer) {
                console.error('❌ Renderer non disponible');
                if (callback) callback(null);
                return;
            }

            try {
                // Forcer un rendu
                this.renderer.render(this.scene, this.camera);
                
                // Capturer l'image
                const canvas = this.renderer.domElement;
                const mimeType = format === 'jpg' || format === 'jpeg' ? 'image/jpeg' : 'image/png';
                const quality = format === 'jpg' || format === 'jpeg' ? 0.9 : undefined;
                
                const dataUrl = canvas.toDataURL(mimeType, quality);
                
                if (callback) {
                    callback(dataUrl);
                }
                
                console.log(`✅ Capture ${format.toUpperCase()} terminée`);
                return dataUrl;
                
            } catch (error) {
                console.error('❌ Erreur lors de la capture:', error);
                if (callback) callback(null);
                return null;
            }
        };

        // ===============================================
        // FONCTIONS UTILITAIRES POUR L'EXPORT
        // ===============================================
        
        window.SceneManager.generateSTLContent = function(group) {
            let stlContent = 'solid WallSim3D_Export\n';
            
            group.traverse((object) => {
                if (object.geometry && object.isMesh) {
                    const geometry = object.geometry;
                    
                    // S'assurer que la géométrie a des normales
                    if (!geometry.attributes.normal) {
                        geometry.computeVertexNormals();
                    }
                    
                    const positions = geometry.attributes.position;
                    const normals = geometry.attributes.normal;
                    const indices = geometry.index;
                    
                    if (positions) {
                        if (indices) {
                            // Géométrie avec index - parcourir les triangles via les indices
                            for (let i = 0; i < indices.count; i += 3) {
                                const a = indices.getX(i);
                                const b = indices.getX(i + 1);
                                const c = indices.getX(i + 2);
                                
                                // Calculer la normale du triangle
                                const vA = new THREE.Vector3().fromBufferAttribute(positions, a);
                                const vB = new THREE.Vector3().fromBufferAttribute(positions, b);
                                const vC = new THREE.Vector3().fromBufferAttribute(positions, c);
                                
                                const cb = new THREE.Vector3().subVectors(vC, vB);
                                const ab = new THREE.Vector3().subVectors(vA, vB);
                                const normal = new THREE.Vector3().crossVectors(cb, ab).normalize();
                                
                                // Écrire le facet
                                stlContent += `  facet normal ${normal.x.toFixed(6)} ${normal.y.toFixed(6)} ${normal.z.toFixed(6)}\n`;
                                stlContent += '    outer loop\n';
                                stlContent += `      vertex ${vA.x.toFixed(6)} ${vA.y.toFixed(6)} ${vA.z.toFixed(6)}\n`;
                                stlContent += `      vertex ${vB.x.toFixed(6)} ${vB.y.toFixed(6)} ${vB.z.toFixed(6)}\n`;
                                stlContent += `      vertex ${vC.x.toFixed(6)} ${vC.y.toFixed(6)} ${vC.z.toFixed(6)}\n`;
                                stlContent += '    endloop\n';
                                stlContent += '  endfacet\n';
                            }
                        } else {
                            // Géométrie sans index - parcourir séquentiellement par groupes de 3
                            for (let i = 0; i < positions.count; i += 3) {
                                // Vérifier qu'on a bien 3 vertices
                                if (i + 2 >= positions.count) break;
                                
                                // Récupérer les 3 vertices du triangle
                                const vA = new THREE.Vector3(
                                    positions.getX(i),
                                    positions.getY(i),
                                    positions.getZ(i)
                                );
                                const vB = new THREE.Vector3(
                                    positions.getX(i + 1),
                                    positions.getY(i + 1),
                                    positions.getZ(i + 1)
                                );
                                const vC = new THREE.Vector3(
                                    positions.getX(i + 2),
                                    positions.getY(i + 2),
                                    positions.getZ(i + 2)
                                );
                                
                                // Calculer la normale du triangle
                                const cb = new THREE.Vector3().subVectors(vC, vB);
                                const ab = new THREE.Vector3().subVectors(vA, vB);
                                const normal = new THREE.Vector3().crossVectors(cb, ab).normalize();
                                
                                // Écrire le facet
                                stlContent += `  facet normal ${normal.x.toFixed(6)} ${normal.y.toFixed(6)} ${normal.z.toFixed(6)}\n`;
                                stlContent += '    outer loop\n';
                                stlContent += `      vertex ${vA.x.toFixed(6)} ${vA.y.toFixed(6)} ${vA.z.toFixed(6)}\n`;
                                stlContent += `      vertex ${vB.x.toFixed(6)} ${vB.y.toFixed(6)} ${vB.z.toFixed(6)}\n`;
                                stlContent += `      vertex ${vC.x.toFixed(6)} ${vC.y.toFixed(6)} ${vC.z.toFixed(6)}\n`;
                                stlContent += '    endloop\n';
                                stlContent += '  endfacet\n';
                            }
                        }
                    }
                }
            });
            
            stlContent += 'endsolid WallSim3D_Export\n';
            return stlContent;
        };

        // ===============================================
        // GÉNÉRATION STL VALIDÉE POUR IMPRESSION 3D
        // ===============================================
        
        window.SceneManager.generateValidatedSTLContent = function(group) {
            let stlContent = 'solid WallSim3D_Print\n';
            let triangleCount = 0;
            
            console.log('🔧 Génération du contenu STL validé...');
            
            group.traverse((object) => {
                if (object.geometry && object.isMesh) {
                    console.log(`🔍 Traitement de l'objet: ${object.name || 'Sans nom'}`);
                    
                    const geometry = object.geometry;
                    
                    // S'assurer que la géométrie a des normales
                    if (!geometry.attributes.normal) {
                        geometry.computeVertexNormals();
                        console.log('📐 Normales calculées pour la géométrie');
                    }
                    
                    const positions = geometry.attributes.position;
                    const indices = geometry.index;
                    
                    if (!positions) {
                        console.warn('⚠️ Géométrie sans positions, ignorée');
                        return;
                    }
                    
                    try {
                        if (indices) {
                            // Géométrie avec index
                            console.log(`📊 Géométrie indexée: ${indices.count / 3} triangles`);
                            
                            for (let i = 0; i < indices.count; i += 3) {
                                const a = indices.getX(i);
                                const b = indices.getX(i + 1);
                                const c = indices.getX(i + 2);
                                
                                // Vérifier la validité des indices
                                if (a >= positions.count || b >= positions.count || c >= positions.count) {
                                    console.warn(`⚠️ Indices invalides: ${a}, ${b}, ${c} (max: ${positions.count - 1})`);
                                    continue;
                                }
                                
                                // Récupérer les vertices
                                const vA = new THREE.Vector3().fromBufferAttribute(positions, a);
                                const vB = new THREE.Vector3().fromBufferAttribute(positions, b);
                                const vC = new THREE.Vector3().fromBufferAttribute(positions, c);
                                
                                // Vérifier que le triangle n'est pas dégénéré
                                if (this.isValidTriangle(vA, vB, vC)) {
                                    const facet = this.generateSTLFacet(vA, vB, vC);
                                    stlContent += facet;
                                    triangleCount++;
                                }
                            }
                        } else {
                            // Géométrie sans index
                            console.log(`📊 Géométrie non-indexée: ${positions.count / 3} triangles`);
                            
                            for (let i = 0; i < positions.count; i += 3) {
                                if (i + 2 >= positions.count) break;
                                
                                const vA = new THREE.Vector3(
                                    positions.getX(i),
                                    positions.getY(i),
                                    positions.getZ(i)
                                );
                                const vB = new THREE.Vector3(
                                    positions.getX(i + 1),
                                    positions.getY(i + 1),
                                    positions.getZ(i + 1)
                                );
                                const vC = new THREE.Vector3(
                                    positions.getX(i + 2),
                                    positions.getY(i + 2),
                                    positions.getZ(i + 2)
                                );
                                
                                // Vérifier que le triangle n'est pas dégénéré
                                if (this.isValidTriangle(vA, vB, vC)) {
                                    const facet = this.generateSTLFacet(vA, vB, vC);
                                    stlContent += facet;
                                    triangleCount++;
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`❌ Erreur lors du traitement de la géométrie:`, error);
                    }
                }
            });
            
            stlContent += 'endsolid WallSim3D_Print\n';
            
            console.log(`✅ STL généré avec ${triangleCount} triangles valides`);
            
            return stlContent;
        };

        // ===============================================
        // FONCTIONS UTILITAIRES POUR VALIDATION STL
        // ===============================================
        
        window.SceneManager.isValidTriangle = function(vA, vB, vC) {
            // Vérifier que les points ne sont pas identiques
            const tolerance = 1e-6;
            
            if (vA.distanceTo(vB) < tolerance || vB.distanceTo(vC) < tolerance || vC.distanceTo(vA) < tolerance) {
                return false;
            }
            
            // Vérifier que les points ne sont pas colinéaires
            const ab = new THREE.Vector3().subVectors(vB, vA);
            const ac = new THREE.Vector3().subVectors(vC, vA);
            const cross = new THREE.Vector3().crossVectors(ab, ac);
            
            return cross.length() > tolerance;
        };
        
        window.SceneManager.generateSTLFacet = function(vA, vB, vC) {
            // Calculer la normale du triangle
            const cb = new THREE.Vector3().subVectors(vC, vB);
            const ab = new THREE.Vector3().subVectors(vA, vB);
            const normal = new THREE.Vector3().crossVectors(cb, ab).normalize();
            
            // Vérifier que la normale est valide
            if (isNaN(normal.x) || isNaN(normal.y) || isNaN(normal.z)) {
                normal.set(0, 0, 1); // Normale par défaut
            }
            
            let facet = '';
            facet += `  facet normal ${normal.x.toFixed(6)} ${normal.y.toFixed(6)} ${normal.z.toFixed(6)}\n`;
            facet += '    outer loop\n';
            facet += `      vertex ${vA.x.toFixed(6)} ${vA.y.toFixed(6)} ${vA.z.toFixed(6)}\n`;
            facet += `      vertex ${vB.x.toFixed(6)} ${vB.y.toFixed(6)} ${vB.z.toFixed(6)}\n`;
            facet += `      vertex ${vC.x.toFixed(6)} ${vC.y.toFixed(6)} ${vC.z.toFixed(6)}\n`;
            facet += '    endloop\n';
            facet += '  endfacet\n';
            
            return facet;
        };
        
        window.SceneManager.generateOBJContent = function(group) {
            let objContent = '# WallSim3D Export\\n';
            objContent += '# Generated by WallSim3D\\n\\n';
            
            let vertexOffset = 1;
            
            group.traverse((object) => {
                if (object.geometry) {
                    const geometry = object.geometry;
                    const positions = geometry.attributes.position;
                    const normals = geometry.attributes.normal;
                    const uvs = geometry.attributes.uv;
                    
                    if (positions) {
                        // Export des vertices
                        objContent += `o ${object.name || 'Object'}\\n`;
                        
                        for (let i = 0; i < positions.count; i++) {
                            const x = positions.getX(i);
                            const y = positions.getY(i);
                            const z = positions.getZ(i);
                            objContent += `v ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)}\\n`;
                        }
                        
                        // Export des normales
                        if (normals) {
                            for (let i = 0; i < normals.count; i++) {
                                const nx = normals.getX(i);
                                const ny = normals.getY(i);
                                const nz = normals.getZ(i);
                                objContent += `vn ${nx.toFixed(6)} ${ny.toFixed(6)} ${nz.toFixed(6)}\\n`;
                            }
                        }
                        
                        // Export des UVs
                        if (uvs) {
                            for (let i = 0; i < uvs.count; i++) {
                                const u = uvs.getX(i);
                                const v = uvs.getY(i);
                                objContent += `vt ${u.toFixed(6)} ${v.toFixed(6)}\\n`;
                            }
                        }
                        
                        // Export des faces
                        const indexCount = geometry.index ? geometry.index.count : positions.count;
                        for (let i = 0; i < indexCount; i += 3) {
                            let face = 'f ';
                            
                            for (let j = 0; j < 3; j++) {
                                const vertexIndex = geometry.index ? geometry.index.getX(i + j) : (i + j);
                                const vIdx = vertexOffset + vertexIndex;
                                
                                if (uvs && normals) {
                                    face += `${vIdx}/${vIdx}/${vIdx} `;
                                } else if (normals) {
                                    face += `${vIdx}//${vIdx} `;
                                } else {
                                    face += `${vIdx} `;
                                }
                            }
                            
                            objContent += face.trim() + '\\n';
                        }
                        
                        vertexOffset += positions.count;
                        objContent += '\\n';
                    }
                }
            });
            
            return objContent;
        };

        // ===============================================
        // EXPORT DE DONNÉES AVANCÉES
        // ===============================================
        
        window.SceneManager.exportAdvancedScene = function() {
            const basicData = this.exportScene();
            
            // Ajouter des informations supplémentaires
            const advancedData = {
                ...basicData,
                metadata: {
                    version: '3.0',
                    generator: 'WallSim3D',
                    exported: new Date().toISOString(),
                    camera: {
                        position: this.camera.position.toArray(),
                        rotation: this.camera.rotation.toArray(),
                        zoom: this.camera.zoom || 1
                    },
                    lights: [],
                    materials: [],
                    textures: []
                },
                statistics: this.getSceneStatistics()
            };
            
            // Collecter les informations sur les lumières
            this.scene.traverse((object) => {
                if (object.isLight) {
                    advancedData.metadata.lights.push({
                        type: object.type,
                        position: object.position.toArray(),
                        color: object.color.getHex(),
                        intensity: object.intensity
                    });
                }
            });
            
            return advancedData;
        };
        
        window.SceneManager.getSceneStatistics = function() {
            let vertexCount = 0;
            let triangleCount = 0;
            let objectCount = 0;
            let materialCount = new Set();
            
            this.scene.traverse((object) => {
                if (object.geometry) {
                    objectCount++;
                    
                    const positions = object.geometry.attributes.position;
                    if (positions) {
                        vertexCount += positions.count;
                        triangleCount += positions.count / 3;
                    }
                }
                
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(mat => {
                            if (mat.uuid) materialCount.add(mat.uuid);
                        });
                    } else {
                        if (object.material.uuid) materialCount.add(object.material.uuid);
                    }
                }
            });
            
            return {
                objects: objectCount,
                vertices: vertexCount,
                triangles: Math.floor(triangleCount),
                materials: materialCount.size,
                elements: this.elements.size
            };
        };

        // console.log('✅ Extensions d\'export ajoutées au SceneManager');
    });

})();
