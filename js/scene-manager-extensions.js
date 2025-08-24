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
            let stlContent = 'solid WallSim3D_Export\\n';
            
            group.traverse((object) => {
                if (object.geometry) {
                    const geometry = object.geometry;
                    
                    // Assurer que la géométrie a des index
                    if (!geometry.index) {
                        geometry.computeVertexNormals();
                    }
                    
                    const positions = geometry.attributes.position;
                    const normals = geometry.attributes.normal;
                    
                    if (positions && normals) {
                        // Export des triangles
                        for (let i = 0; i < positions.count; i += 3) {
                            // Normal
                            const nx = normals.getX(i);
                            const ny = normals.getY(i);
                            const nz = normals.getZ(i);
                            
                            stlContent += `  facet normal ${nx.toFixed(6)} ${ny.toFixed(6)} ${nz.toFixed(6)}\\n`;
                            stlContent += '    outer loop\\n';
                            
                            // Vertices
                            for (let j = 0; j < 3; j++) {
                                const vx = positions.getX(i + j);
                                const vy = positions.getY(i + j);
                                const vz = positions.getZ(i + j);
                                
                                stlContent += `      vertex ${vx.toFixed(6)} ${vy.toFixed(6)} ${vz.toFixed(6)}\\n`;
                            }
                            
                            stlContent += '    endloop\\n';
                            stlContent += '  endfacet\\n';
                        }
                    }
                }
            });
            
            stlContent += 'endsolid WallSim3D_Export\\n';
            return stlContent;
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
