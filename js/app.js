// Point d'entr�e principal de l'application WallSim3D

// Gestionnaire d'erreur global pour capturer les erreurs de script
window.addEventListener('error', function(e) {
    console.error('? ERREUR SCRIPT:', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        error: e.error
    });
});

// Configuration globale des logs
window.DEBUG_MODE = false; // Mettre � true pour activer les logs de d�bogage d�taill�s

// Fonction utilitaire pour les logs conditionnels
window.debugLog = function(message, ...args) {
    if (window.DEBUG_MODE) {
        // console.log(\message, ...args);
    }
};

// Fonctions utilitaires pour le d�bogage (accessibles depuis la console)
window.enableDebug = function() {
    window.DEBUG_MODE = true;
    // console.log(\'?? Mode d�bogage activ� - Les logs d�taill�s seront affich�s');
};

window.disableDebug = function() {
    window.DEBUG_MODE = false;
    // console.log(\'?? Mode d�bogage d�sactiv� - Logs r�duits au minimum');
};

// Fonction de correction des mat�riaux isolants (accessible depuis la console)
window.fixInsulation = function() {
    // console.log(\'?? CORRECTION MANUELLE des mat�riaux isolants...');
    if (window.MaterialLibrary && window.MaterialLibrary.fixInsulationMaterials) {
        window.MaterialLibrary.fixInsulationMaterials();
    } else {
        console.error('? MaterialLibrary ou m�thode fixInsulationMaterials non disponible');
    }
    
    // Forcer la r�g�n�ration de la biblioth�que 3D
    if (window.LibraryPreview3D && window.LibraryPreview3D.clearCache) {
        // console.log(\'?? R�g�n�ration forc�e de la biblioth�que 3D...');
        window.LibraryPreview3D.clearCache();
        if (window.LibraryPreview3D.generateStaticPreviews) {
            window.LibraryPreview3D.generateStaticPreviews();
        }
        if (window.LibraryPreview3D.updateAllPreviews) {
            window.LibraryPreview3D.updateAllPreviews();
        }
    } else {
        // console.log(\'?? LibraryPreview3D ou clearCache non disponible');
    }
    
    // NOUVEAU: Forcer le rendu de la sc�ne
    if (window.SceneManager && window.SceneManager.renderer) {
        // console.log(\'?? For�age du rendu de la sc�ne...');
        window.SceneManager.renderer.render(window.SceneManager.scene, window.SceneManager.camera);
        // console.log(\'? Rendu forc� termin�');
    }
};

// Fonction de diagnostic d�taill�e des isolants (accessible depuis la console)
window.diagnoseInsulation = function() {
    // console.log(\'?? DIAGNOSTIC D�TAILL� des isolants dans la sc�ne...');
    
    let isolantCount = 0;
    let allMeshCount = 0;
    
    window.SceneManager.scene.traverse((object) => {
        if (object.isMesh) {
            allMeshCount++;
            const userData = object.userData || {};
            
            // Identifier tous les types possibles d'isolants
            const isInsulation = (
                userData.type === 'insulation' ||
                userData.elementType === 'insulation' ||
                (userData.element && userData.element.type === 'insulation') ||
                (userData.element && userData.element.material && (
                    userData.element.material === 'insulation' || 
                    userData.element.material === 'rock-wool' ||
                    userData.element.material === 'xps'  // Ajouter XPS
                )) ||
                object.material.name?.includes('insulation') ||
                object.material.name?.includes('xps')  // Ajouter XPS
            );
            
            if (isInsulation) {
                isolantCount++;
                // console.log(`🔧 ISOLANT #${isolantCount}:`, {
                //     uuid: object.uuid.substring(0,8),
                //     elementId: userData.element?.id,
                //     materialName: userData.element?.material,
                //     type: userData.type,
                //     elementType: userData.elementType,
                //     color: '#' + object.material.color.getHexString().toUpperCase(),
                //     transparent: object.material.transparent,
                //     opacity: object.material.opacity,
                //     visible: object.visible,
                //     materialVisible: object.material.visible,
                //     alphaTest: object.material.alphaTest,
                //     side: object.material.side === THREE.DoubleSide ? 'DoubleSide' : 'FrontSide',
                //     brightness: (object.material.color.r + object.material.color.g + object.material.color.b) / 3,
                //     position: {x: object.position.x, y: object.position.y, z: object.position.z},
                //     scale: {x: object.scale.x, y: object.scale.y, z: object.scale.z}
                // });
            }
        }
    });
    
    // console.log(`🔧 RÉSUMÉ: ${isolantCount} isolants trouvés sur ${allMeshCount} objets 3D au total`);
    
    if (isolantCount === 0) {
        // console.log(\'? Aucun isolant d�tect� dans la sc�ne. V�rifiez que vous avez bien plac� des isolants.');
    }
};

// Fonction de correction imm�diate des isolants transparents
window.fixTransparentInsulation = function() {
    // console.log(\'?? CORRECTION IMM�DIATE des isolants transparents...');
    
    let fixedCount = 0;
    let detectedCount = 0;
    
    window.SceneManager.scene.traverse((object) => {
        if (object.isMesh && object.userData) {
            const userData = object.userData || {};
            
            // Identifier les isolants
            const isInsulation = (
                userData.type === 'insulation' ||
                userData.elementType === 'insulation' ||
                (userData.element && userData.element.type === 'insulation') ||
                (userData.element && userData.element.material && (
                    userData.element.material === 'insulation' || 
                    userData.element.material === 'rock-wool' ||
                    userData.element.material === 'xps'  // Ajouter XPS
                )) ||
                object.material.name?.includes('insulation') ||
                object.material.name?.includes('xps')  // Ajouter XPS
            );
            
            if (isInsulation && object.material) {
                detectedCount++;
                // console.log(`🔧 Isolant détecté #${detectedCount} - UUID: ${object.uuid.substring(0,8)}`);
                // console.log('   Avant:', {
                //     transparent: object.material.transparent,
                //     opacity: object.material.opacity,
                //     color: '#' + object.material.color.getHexString().toUpperCase(),
                //     visible: object.visible
                // });
                
                // D�terminer la couleur correcte selon le type de mat�riau
                let correctColor = null;
                const materialType = userData.element?.material;
                
                if (materialType === 'rock-wool') {
                    correctColor = new THREE.Color(0xf0ebe2); // Beige tr�s clair
                } else if (materialType === 'insulation') {
                    correctColor = new THREE.Color(0xf0ebe2); // Beige tr�s clair
                } else {
                    // Utiliser le beige clair pour tous les isolants
                    correctColor = new THREE.Color(0xf0ebe2); // Beige tr�s clair
                }
                
                // Correction agressive SANS changer la couleur si elle est correcte
                object.material.transparent = false;
                object.material.opacity = 1.0;
                object.material.alphaTest = 0;
                object.material.depthWrite = true;
                object.material.depthTest = true;
                object.material.side = THREE.DoubleSide;
                
                // S'assurer que l'objet est visible
                object.visible = true;
                object.material.visible = true;
                
                // Appliquer la couleur correcte
                object.material.color = correctColor;
                object.material.needsUpdate = true;
                
                // console.log('   Après:', {
                //     transparent: object.material.transparent,
                //     opacity: object.material.opacity,
                //     color: '#' + object.material.color.getHexString().toUpperCase(),
                //     visible: object.visible
                // });
                
                fixedCount++;
            }
        }
    });
    
    // console.log(\`? ${fixedCount} isolants sur ${detectedCount} d�tect�s ont �t� corrig�s`);
    
    // Forcer le re-rendu
    if (window.SceneManager && window.SceneManager.renderer) {
        window.SceneManager.renderer.render(window.SceneManager.scene, window.SceneManager.camera);
        // console.log(\'?? Re-rendu forc� appliqu�');
    }
    
    return {detectedCount, fixedCount};
};

class WallSimApp {
    constructor() {
        this.isInitialized = false;
        this.version = '1.0.0';
        this.name = 'WallSim3D';
    }

    async init() {
        if (this.isInitialized) {
            console.warn('Application d�j� initialis�e');
            return;
        }

        try {
            // // console.log(\`Initialisation de ${this.name} v${this.version}`);
            
            // V�rifier la compatibilit� du navigateur
            this.checkBrowserCompatibility();
            
            // Attendre que le DOM soit pr�t
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Attendre que Three.js soit charg�
            await this.waitForThreeJS();

            // Initialiser les composants dans l'ordre
            await this.initializeComponents();
            
            // Configuration initiale
            this.setupInitialState();
            
            // �v�nements globaux
            this.setupGlobalEventListeners();
            
            this.isInitialized = true;
            // // console.log(\`${this.name} initialis� avec succ�s`);
            
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            this.handleInitializationError(error);
        }
    }

    async waitForThreeJS() {
        // Si THREE est d�j� disponible, pas besoin d'attendre
        if (typeof THREE !== 'undefined') {
            // // console.log(\'? Three.js d�j� disponible');
            return;
        }

        // Attendre l'�v�nement threejs-ready
        return new Promise((resolve) => {
            window.addEventListener('threejs-ready', () => {
                // console.log(\'? Three.js charg� avec succ�s');
                resolve();
            }, { once: true });

            // Timeout de s�curit�
            setTimeout(() => {
                if (typeof THREE === 'undefined') {
                    console.error('? Timeout lors du chargement de Three.js');
                    throw new Error('Three.js n\'a pas pu �tre charg�');
                } else {
                    resolve();
                }
            }, 10000); // 10 secondes
        });
    }

    checkBrowserCompatibility() {
        // V�rifier WebGL
        if (!this.isWebGLSupported()) {
            throw new Error('WebGL n\'est pas support� par ce navigateur');
        }

        // V�rifier les APIs n�cessaires
        const requiredAPIs = [
            'localStorage',
            'FileReader',
            'URL',
            'requestAnimationFrame'
        ];

        const missingAPIs = requiredAPIs.filter(api => !(api in window));
        if (missingAPIs.length > 0) {
            throw new Error(`APIs manquantes: ${missingAPIs.join(', ')}`);
        }

        // // console.log(\'Compatibilit� navigateur: OK');
    }

    isWebGLSupported() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return !!gl;
        } catch (e) {
            return false;
        }
    }

    async initializeComponents() {
        // 1. Initialiser la biblioth�que de mat�riaux
        if (window.MaterialLibrary) {
            // // console.log(\'Biblioth�que de mat�riaux charg�e');
        } else {
            throw new Error('Biblioth�que de mat�riaux non disponible');
        }

        // 2. Initialiser le gestionnaire de sc�ne 3D
        const sceneContainer = document.getElementById('scene-container');
        if (!sceneContainer) {
            throw new Error('Conteneur de sc�ne non trouv�');
        }

        if (window.SceneManager && typeof window.SceneManager.init === 'function') {
            window.SceneManager.init(sceneContainer);
        } else {
            console.error('? SceneManager non disponible ou pas de m�thode init');
            // console.log(\'Debug - window.SceneManager:', window.SceneManager);
            // console.log(\'Debug - typeof SceneManager.init:', typeof window.SceneManager?.init);
            throw new Error('SceneManager non disponible');
        }

        // 3. Initialiser les outils de construction
        if (window.ConstructionTools && typeof window.ConstructionTools.init === 'function') {
            window.ConstructionTools.init();
            // // console.log(\'Outils de construction initialis�s');
        } else {
            console.warn('?? ConstructionTools non disponible ou pas de m�thode init');
        }

        // 4. Initialiser le gestionnaire des assises (APR�S ConstructionTools pour avoir acc�s au ghostElement)
        if (window.AssiseManager && typeof window.AssiseManager.init === 'function') {
            window.AssiseManager.init();
        } else {
            console.warn('?? AssiseManager non disponible ou pas de m�thode init');
        }

        // 5. Audio supprim�, initialiser les gestionnaires clavier
        if (window.KeyboardManager) {
            // KeyboardManager available but not initialized here
        }

        // 5. Initialiser le syst�me d'analyse
        if (window.WallAnalysis) {
            // // console.log(\'Syst�me d\'analyse initialis�');
        }

        // 7. Initialiser le contr�leur UI
        window.UIController.init();
        // // console.log(\'Contr�leur UI initialis�');
        
        // 8. R�initialiser les �v�nements UI des assises apr�s que tout soit charg�
        setTimeout(() => {
            if (window.AssiseManager) {
                window.AssiseManager.reinitializeUIEventListeners();
            }
        }, 500);

        // 9. CORRECTION: Forcer la mise � jour des mat�riaux isolants apr�s l'initialisation compl�te
        setTimeout(() => {
            if (window.MaterialLibrary && window.MaterialLibrary.fixInsulationMaterials) {
                // console.log(\'?? Application de la correction des mat�riaux isolants...');
                window.MaterialLibrary.fixInsulationMaterials();
            }
        }, 1000); // Attendre que tout soit vraiment charg�

        // 10. Initialiser les outils de mesure, annotation et texte avec ligne de rappel
        setTimeout(() => {
            // Créer les instances des outils de mesure/annotation si les classes sont disponibles
            if (typeof MeasurementTool !== 'undefined' && !window.MeasurementTool) {
                window.MeasurementTool = new MeasurementTool();
                // console.log('✅ MeasurementTool initialisé');
            }
            if (typeof AnnotationTool !== 'undefined' && !window.AnnotationTool) {
                window.AnnotationTool = new AnnotationTool();
                // console.log('✅ AnnotationTool initialisé');
            }
            if (typeof TextLeaderTool !== 'undefined' && !window.TextLeaderTool) {
                window.TextLeaderTool = new TextLeaderTool();
                // console.log('✅ TextLeaderTool initialisé');
            }
            // Outil Cordeau (ficelle)
            if (typeof CordeauTool !== 'undefined' && !window.CordeauTool) {
                window.CordeauTool = new CordeauTool();
                // console.log('✅ CordeauTool initialisé');
            }
            
            // Créer le gestionnaire d'intégration des outils
            if (typeof MeasurementAnnotationManager !== 'undefined' && !window.MeasurementAnnotationManager) {
                window.MeasurementAnnotationManager = new MeasurementAnnotationManager();
                // console.log('✅ MeasurementAnnotationManager initialisé');
            }
        }, 800); // Attendre que SceneManager soit complètement initialisé

        // 11. Réinitialiser les événements de bibliothèque pour les nouveaux éléments GLB
        setTimeout(() => {
            if (window.TabManager && window.TabManager.reinitializeLibraryEvents) {
                if (window.DEBUG_APP) {
                    console.log('🔄 Réinitialisation des événements de bibliothèque...');
                }
                window.TabManager.reinitializeLibraryEvents();
            }
        }, 1200); // Après les matériaux et assises
    }

    setupInitialState() {
        // Configuration par d�faut de la grille
        const gridSpacing = 1; // cm - Grille fine de 1cm pour plus de pr�cision
        window.SceneManager.setGridSpacing(gridSpacing);
        window.SceneManager.setGridVisible(false);

        // Vider le cache des aper�us 3D pour appliquer les nouvelles couleurs des isolants
        if (window.libraryPreview3D && window.libraryPreview3D.clearCache) {
            window.libraryPreview3D.clearCache();
            // console.log(\'?? Cache des aper�us 3D vid� - nouvelles couleurs isolants appliqu�es');
        }

        // Configuration par d�faut des mat�riaux
        const materialSelect = document.getElementById('materialSelect');
        if (materialSelect) {
            materialSelect.innerHTML = '';
            const materials = window.MaterialLibrary.getMaterialNames();
            materials.forEach(material => {
                const option = document.createElement('option');
                option.value = material.id;
                option.textContent = material.name;
                materialSelect.appendChild(option);
            });
        }

        // Mode par d�faut
        if (window.ConstructionTools && window.ConstructionTools.setMode) {
            window.ConstructionTools.setMode('brick');
            window.ConstructionTools.setMaterial('brick-red');
            // Initialiser l'affichage de l'interface selon le mode
            if (window.ConstructionTools.updateModeInterface) {
                window.ConstructionTools.updateModeInterface('brick');
            }
        }

        // Mode d'interaction par d�faut : pose de briques (pas s�lection)
        setTimeout(() => {
            if (window.toolbarManager) {
                window.toolbarManager.setInteractionMode('placement');
            }
        }, 1500); // Attendre que le ToolbarManager soit initialis�

        // Vue par d�faut
        window.SceneManager.setCameraView('iso');
        window.UIController.setCameraView('iso');

        // // console.log(\'�tat initial configur�');
    }

    setupGlobalEventListeners() {
        // Gestion des erreurs globales
        window.addEventListener('error', this.handleGlobalError.bind(this));
        
        // Gestion du redimensionnement
        window.addEventListener('resize', this.handleWindowResize.bind(this));
        
        // Gestion de la visibilit� de la page
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Activer l'audio apr�s premi�re interaction utilisateur
        const activateAudio = () => {
            // Audio supprim�
            // Supprimer les �couteurs apr�s la premi�re activation
            document.removeEventListener('click', activateAudio);
            document.removeEventListener('keydown', activateAudio);
        };
        
        document.addEventListener('click', activateAudio);
        document.addEventListener('keydown', activateAudio);
        
        // // console.log(\'�v�nements globaux configur�s');
    }

    handleGlobalError(event) {
        console.error('Erreur globale captur�e:', event.error);
        
        // Jouer un son d'erreur si disponible
        // Son supprim�
        
        // Afficher une notification � l'utilisateur
        this.showErrorNotification('Une erreur inattendue s\'est produite. Consultez la console pour plus de d�tails.');
    }

    handleWindowResize() {
        if (window.SceneManager && window.SceneManager.renderer && window.SceneManager.camera) {
            const container = document.getElementById('scene-container');
            if (container) {
                const width = container.clientWidth;
                const height = container.clientHeight;
                
                window.SceneManager.camera.aspect = width / height;
                window.SceneManager.camera.updateProjectionMatrix();
                window.SceneManager.renderer.setSize(width, height);
            }
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // Page masqu�e - r�duire les performances si n�cessaire
            // // console.log(\'Application mise en pause');
        } else {
            // Page visible - reprendre les performances normales
            // // console.log(\'Application reprise');
            
            // Audio supprim�
        }
    }

    showErrorNotification(message) {
        // Cr�er ou r�utiliser une notification d'erreur
        let notification = document.getElementById('error-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'error-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--danger-color, #dc3545);
                color: white;
                padding: 15px 20px;
                border-radius: 5px;
                font-size: 14px;
                z-index: 10001;
                max-width: 400px;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(notification);
        }

        notification.textContent = message;
        
        // Animer l'apparition
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Masquer apr�s 5 secondes
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
        }, 5000);
    }

    startPerformanceMonitoring() {
        let frameCount = 0;
        let lastTime = performance.now();

        const updateFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
                
                // Afficher les FPS dans la console en mode d�veloppement
                if (this.isDevelopmentMode()) {
                    // console.log(\`FPS: ${fps}`);
                }
                
                // Avertissement si les performances sont faibles
                if (fps < 30) {
                    console.warn('Performances faibles d�tect�es');
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(updateFPS);
        };

        requestAnimationFrame(updateFPS);
    }

    isDevelopmentMode() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.search.includes('debug=true');
    }

    handleInitializationError(error) {
        const errorMessage = `
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                <h2 style="color: #f44336;">Erreur d'Initialisation</h2>
                <p>Impossible de charger WallSim3D.</p>
                <p><strong>Erreur:</strong> ${error.message}</p>
                <div style="margin-top: 20px;">
                    <button onclick="location.reload()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Recharger la page
                    </button>
                </div>
                <div style="margin-top: 20px; font-size: 12px; color: #666;">
                    <p>Si le probl�me persiste, v�rifiez que votre navigateur supporte WebGL.</p>
                </div>
            </div>
        `;

        document.body.innerHTML = errorMessage;
    }

    handleRuntimeError(error) {
        console.error('Erreur d\'ex�cution:', error);
        
        // Ne pas afficher d'erreur pour les erreurs mineures
        if (error.name === 'NetworkError' || error.message.includes('Loading CSS chunk')) {
            return;
        }

        // Afficher une notification pour les erreurs importantes
        if (window.UIController && window.UIController.showNotification) {
            window.UIController.showNotification(
                'Une erreur s\'est produite. Consultez la console pour plus de d�tails.',
                'error'
            );
        }
    }

    // M�thodes utilitaires publiques
    getVersion() {
        return this.version;
    }

    getName() {
        return this.name;
    }

    isReady() {
        return this.isInitialized;
    }

    // API pour les extensions/plugins
    registerPlugin(plugin) {
        if (typeof plugin.init === 'function') {
            try {
                plugin.init(this);
                // console.log(\`Plugin ${plugin.name} enregistr�`);
            } catch (error) {
                console.error(`Erreur lors de l'enregistrement du plugin ${plugin.name}:`, error);
            }
        }
    }

    // M�thodes de d�bogage
    exportDebugInfo() {
        return {
            version: this.version,
            initialized: this.isInitialized,
            browser: navigator.userAgent,
            webglSupported: this.isWebGLSupported(),
            elementsCount: window.SceneManager ? window.SceneManager.getAllElements().length : 0,
            timestamp: new Date().toISOString()
        };
    }

    // Nettoyage lors de la fermeture
    dispose() {
        if (window.SceneManager) {
            window.SceneManager.dispose();
        }

        // console.log(\'Application nettoy�e');
    }
}

// Exposer la classe globalement
window.WallSimApp = WallSimApp;

// Nettoyage avant fermeture
window.addEventListener('beforeunload', () => {
    app.dispose();
});

