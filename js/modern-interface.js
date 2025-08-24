/**
 * Interface Moderne - WallSim3D v3.0
 * Gestionnaire d'interface professionnelle style SketchUp/AutoCAD
 */

class ModernInterface {
    constructor() {
        this.currentTheme = 'dark';
        this.notifications = [];
        this.previewScenes = new Map();
        this.init();
    }

    init() {
        // Initialisation fractionnée pour éviter les violations de performance
        this.initMenuSystem();
        
        // Utiliser des micro-tâches avec Promise.resolve() pour éviter les violations
        Promise.resolve().then(() => {
            this.initTimeDisplay();
            return Promise.resolve();
        }).then(() => {
            this.initKeyboardShortcuts();
            return Promise.resolve();
        }).then(() => {
            this.initNotificationSystem();
            return Promise.resolve();
        }).then(() => {
            this.initTooltips();
            return Promise.resolve();
        }).then(() => {
            this.initNew3DPreviewSystem();
        }).catch(error => {
            console.error('Erreur lors de l\'initialisation de ModernInterface:', error);
        });
    }

    // ===============================================
    // SYSTÈME DE MENU
    // ===============================================
    
    initMenuSystem() {
        const menuItems = document.querySelectorAll('.menu-item');
        let currentOpenMenu = null;
        let globalTimeout = null;
        
        // Fonction pour vérifier si l'élément est dans un menu
        const isInMenuSystem = (element) => {
            return element && (
                element.closest('.menu-item') || 
                element.closest('.submenu') ||
                element.closest('.dropdown-menu') ||
                element.classList.contains('menu-item') ||
                element.classList.contains('submenu') ||
                element.classList.contains('submenu-item') ||
                element.classList.contains('menu-option')
            );
        };
        
        // Fonction pour vérifier si l'élément doit fermer les menus
        const shouldCloseMenus = (element) => {
            if (!element) return true;
            
            // Ne pas fermer si c'est dans le système de menu
            if (isInMenuSystem(element)) return false;
            
            // Ne pas fermer si c'est dans les contrôles de vue
            if (element.closest('.viewport-controls') || 
                element.closest('.view-controls') ||
                element.closest('.zoom-controls') ||
                element.closest('.grid-controls') ||
                element.classList.contains('view-btn') ||
                element.classList.contains('zoom-btn') ||
                element.classList.contains('grid-btn')) {
                return false;
            }
            
            return true;
        };
        
        menuItems.forEach(item => {
            const submenu = item.querySelector('.submenu');
            
            // Événements pour les éléments de menu principaux
            item.addEventListener('mouseenter', () => {
                // Annuler tous les timeouts
                if (globalTimeout) {
                    clearTimeout(globalTimeout);
                    globalTimeout = null;
                }
                
                // Fermer tous les autres menus
                this.closeAllMenus();
                
                // Ouvrir ce menu avec un petit délai pour éviter l'ouverture accidentelle
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        if (!globalTimeout) { // Vérifier que le timeout n'a pas été annulé
                            item.classList.add('active');
                            currentOpenMenu = item;
                        }
                    }, 30); // Délai réduit de 50ms à 30ms pour plus de réactivité
                });
            });
            
            item.addEventListener('mouseleave', (e) => {
                // Vérifier si on survole le sous-menu
                const relatedTarget = e.relatedTarget;
                if (isInMenuSystem(relatedTarget)) {
                    return; // Ne pas fermer si on reste dans le système de menu
                }
                
                // Délai plus long pour permettre de revenir
                globalTimeout = setTimeout(() => {
                    item.classList.remove('active');
                    if (currentOpenMenu === item) {
                        currentOpenMenu = null;
                    }
                }, 1000); // Délai réduit de 1500ms à 1000ms
            });
            
            // Gestion spéciale pour les sous-menus
            if (submenu) {
                submenu.addEventListener('mouseenter', () => {
                    if (globalTimeout) {
                        clearTimeout(globalTimeout);
                        globalTimeout = null;
                    }
                    item.classList.add('active');
                    currentOpenMenu = item;
                });
                
                submenu.addEventListener('mouseleave', (e) => {
                    const relatedTarget = e.relatedTarget;
                    // Ne fermer que si on ne va pas vers un élément qui doit garder le menu ouvert
                    if (shouldCloseMenus(relatedTarget)) {
                        globalTimeout = setTimeout(() => {
                            item.classList.remove('active');
                            if (currentOpenMenu === item) {
                                currentOpenMenu = null;
                            }
                        }, 1500);
                    }
                });
            }
        });

        // Gestion des actions de menu (correction du sélecteur)
        const menuOptions = document.querySelectorAll('.menu-option');
        
        menuOptions.forEach((option) => {
            option.addEventListener('click', (e) => {
                // Empêcher la fermeture immédiate du menu
                e.stopPropagation();
                e.preventDefault();
                
                const action = option.id;
                if (action) {
                    // Exécuter l'action d'abord
                    this.handleMenuAction(action);
                    
                    // Fermer le menu après un court délai
                    setTimeout(() => {
                        this.closeAllMenus();
                    }, 50);
                } else {
                    this.closeAllMenus();
                }
            });
        });

        // Gestion des boutons de vue dans le viewport
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const viewType = button.getAttribute('data-view');
                if (viewType) {
                    this.setView(viewType);
                }
            });
        });

        // Fermer les menus au clic extérieur avec vérification améliorée
        document.addEventListener('click', (e) => {
            // Ne fermer que si l'élément doit fermer les menus
            if (shouldCloseMenus(e.target)) {
                this.closeAllMenus();
                if (globalTimeout) {
                    clearTimeout(globalTimeout);
                    globalTimeout = null;
                }
            }
        }, { passive: true }); // Utiliser passive pour les performances
        
        // Ajouter une protection contre les autres gestionnaires d'événements
        document.addEventListener('mousedown', (e) => {
            if (isInMenuSystem(e.target)) {
                e.stopImmediatePropagation();
            }
        }, { capture: true }); // Capturer en premier
    }

    closeAllMenus() {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
    }

    handleMenuAction(actionId) {
        // Déléguer les actions de fichier au nouveau gestionnaire
        if (window.FileMenuHandler) {
            const fileActions = ['newProject', 'openProject', 'saveProject', 'saveAsProject', 'exportProject', 'importProject'];
            if (fileActions.includes(actionId)) {
                switch (actionId) {
                    case 'newProject':
                        window.FileMenuHandler.newProject();
                        return;
                    case 'openProject':
                        window.FileMenuHandler.openProject();
                        return;
                    case 'saveProject':
                        window.FileMenuHandler.saveProject();
                        return;
                    case 'saveAsProject':
                        window.FileMenuHandler.saveAsProject();
                        return;
                    case 'exportProject':
                        window.FileMenuHandler.exportProject();
                        return;
                    case 'importProject':
                        window.FileMenuHandler.importProject();
                        return;
                }
            }
        }

        // Déléguer les actions d'édition au nouveau gestionnaire
        if (window.EditMenuHandler) {
            const editActions = ['undoAction', 'redoAction', 'copyAction', 'pasteAction', 'deleteAction'];
            if (editActions.includes(actionId)) {
                switch (actionId) {
                    case 'undoAction':
                        window.EditMenuHandler.undo();
                        return;
                    case 'redoAction':
                        window.EditMenuHandler.redo();
                        return;
                    case 'copyAction':
                        window.EditMenuHandler.copy();
                        return;
                    case 'pasteAction':
                        window.EditMenuHandler.paste();
                        return;
                    case 'deleteAction':
                        window.EditMenuHandler.deleteSelected();
                        return;
                }
            }
        }

        const actions = {
            'newProject': () => this.newProject(),
            'openProject': () => this.openProject(),
            'saveProject': () => this.saveProject(),
            'saveAsProject': () => this.saveAsProject(),
            'exportProject': () => this.exportProject(),
            'importProject': () => this.importProject(),
            'undoAction': () => this.undoAction(),
            'redoAction': () => this.redoAction(),
            'copyAction': () => this.copyAction(),
            'pasteAction': () => this.pasteAction(),
            'deleteAction': () => this.deleteAction(),
            'materialEditor': () => this.openMaterialEditor(),
            'textureManager': () => this.openTextureManager(),
            'colorPalette': () => this.openColorPalette(),
            'themeManager': () => this.openThemeManager(),
            'layoutGrid': () => this.toggleGrid(),
            'layoutGuides': () => this.toggleGuides(),
            'layoutRulers': () => this.toggleRulers(),
            'layoutReset': () => this.resetView(),
            'measureTool': () => this.activateMeasureTool(),
            'calculatorTool': () => this.openCalculator(),
            'validationTool': () => this.runValidation(),
            'settingsTool': () => this.openSettings(),
            'viewTop': () => this.setCameraView('top'),
            'viewFront': () => this.setCameraView('front'),
            'viewSide': () => this.setCameraView('side'),
            'viewPerspective': () => this.setCameraView('perspective')
        };

        const action = actions[actionId];
        if (action) {
            action();
            this.showNotification(`Action: ${actionId}`, 'info');
        } else {
            console.log('Action non implémentée:', actionId);
        }
    }

    // ===============================================
    // AFFICHAGE DE L'HEURE
    // ===============================================
    
    initTimeDisplay() {
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
    }

    updateTime() {
        const now = new Date();
        const timeElement = document.getElementById('currentTime');
        const dateElement = document.getElementById('currentDate');
        
        if (timeElement && dateElement) {
            timeElement.textContent = now.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            dateElement.textContent = now.toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit'
            });
        }
    }

    // ===============================================
    // NOUVEAU SYSTÈME D'APERÇUS 3D AVEC THREE.JS
    // ===============================================
    
    initNew3DPreviewSystem() {
        // Utiliser le système de callback de Three.js
        if (typeof window.waitForThreeJS === 'function') {
            window.waitForThreeJS(() => {
                this.initThreeJSPreviewSystem();
            });
        } else {
            // Fallback vers l'ancien système d'attente
            // console.log('⚠️ Système de callback non disponible, utilisation du fallback...');
            if (typeof THREE !== 'undefined') {
                console.log('✅ Three.js déjà disponible');
                this.initThreeJSPreviewSystem();
            } else {
                console.log('⏳ Attente de Three.js avec timeout...');
                setTimeout(() => {
                    if (typeof THREE !== 'undefined') {
                        console.log('🔄 Three.js détecté après timeout');
                        this.initThreeJSPreviewSystem();
                    } else {
                        console.warn('❌ Three.js toujours indisponible, utilisation des aperçus CSS');
                        this.initEnhancedCSSPreviews();
                    }
                }, 2000);
            }
        }
    }
    
    initThreeJSPreviewSystem() {
        // Vérifier le support WebGL
        if (!this.checkWebGLSupport()) {
            console.warn('⚠️ WebGL non supporté, utilisation d\'aperçus CSS améliorés');
            this.showWebGLError();
            this.initEnhancedCSSPreviews();
            return;
        }
        
        try {
            // Vérifier si la classe LibraryPreview3D est disponible
            if (typeof LibraryPreview3D === 'undefined') {
                console.warn('⚠️ Classe LibraryPreview3D non disponible, attente...');
                // Réessayer après un délai
                setTimeout(() => {
                    if (typeof LibraryPreview3D !== 'undefined' && !this.libraryPreview3D) {
                        this.libraryPreview3D = new LibraryPreview3D();
                        // console.log('✅ Système d\'aperçu 3D initialisé avec succès (après délai)');
                    } else if (this.libraryPreview3D) {
                        // console.log('⚠️ LibraryPreview3D déjà initialisé, ignoré');
                    } else {
                        console.warn('⚠️ LibraryPreview3D toujours indisponible, utilisation d\'aperçus CSS');
                        this.initEnhancedCSSPreviews();
                    }
                }, 1000);
                return;
            }
            
            // Initialiser le nouveau système d'aperçu 3D (seulement si pas déjà créé)
            if (!this.libraryPreview3D) {
                this.libraryPreview3D = new LibraryPreview3D();
                // console.log('✅ Système d\'aperçu 3D initialisé avec succès');
            } else {
                // console.log('⚠️ LibraryPreview3D déjà initialisé, ignoré');
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation des aperçus 3D:', error);
            this.initEnhancedCSSPreviews(); // Fallback vers les aperçus CSS améliorés
        }
    }
    
    initEnhancedCSSPreviews() {
                
        // Remplacer tous les éléments avec item-icon par des aperçus CSS améliorés
        document.querySelectorAll('.library-item').forEach(item => {
            const type = item.getAttribute('data-type');
            const existingIcon = item.querySelector('.item-icon');
            
            if (existingIcon && type && !item.querySelector('.item-preview')) {
                this.createEnhancedCSSPreview(item, type, existingIcon);
            }
        });
    }
    
    createEnhancedCSSPreview(libraryItem, type, existingIcon) {
        const previewContainer = document.createElement('div');
        previewContainer.className = 'item-preview-3d css-preview';
        previewContainer.style.width = '120px';
        previewContainer.style.height = '90px';
        previewContainer.style.background = this.getCSSPreviewBackground(type);
        previewContainer.style.borderRadius = '8px';
        previewContainer.style.display = 'flex';
        previewContainer.style.alignItems = 'center';
        previewContainer.style.justifyContent = 'center';
        previewContainer.style.position = 'relative';
        previewContainer.style.overflow = 'hidden';
        
        // Ajouter une représentation 3D en CSS
        const preview3D = document.createElement('div');
        preview3D.className = 'css-3d-preview';
        preview3D.innerHTML = this.generateCSS3DPreview(type);
        
        previewContainer.appendChild(preview3D);
        existingIcon.replaceWith(previewContainer);
        
        // console.log(`✅ Aperçu CSS amélioré créé pour ${type}`);
    }
    
    getCSSPreviewBackground(type) {
        const backgrounds = {
            'M50': 'linear-gradient(135deg, #cc6633 0%, #aa4411 100%)',
            'M57': 'linear-gradient(135deg, #bb5522 0%, #884411 100%)',
            'M60': 'linear-gradient(135deg, #dd7744 0%, #bb5533 100%)',
            'M65': 'linear-gradient(135deg, #aa4411 0%, #882200 100%)',
            'M90': 'linear-gradient(135deg, #ee8855 0%, #cc6633 100%)',
            'B9': 'linear-gradient(135deg, #888888 0%, #666666 100%)',
            'B14': 'linear-gradient(135deg, #999999 0%, #777777 100%)',
            'B19': 'linear-gradient(135deg, #777777 0%, #555555 100%)',
            'B29': 'linear-gradient(135deg, #666666 0%, #444444 100%)',
            'BC_60x5': 'linear-gradient(135deg, #cccccc 0%, #aaaaaa 100%)',
            'BC_60x7': 'linear-gradient(135deg, #cccccc 0%, #aaaaaa 100%)',
            'BC_60x10': 'linear-gradient(135deg, #cccccc 0%, #aaaaaa 100%)',
            'BC_60x15': 'linear-gradient(135deg, #cccccc 0%, #aaaaaa 100%)',
            'BC_60x17': 'linear-gradient(135deg, #cccccc 0%, #aaaaaa 100%)'
        };
        return backgrounds[type] || backgrounds['M50'];
    }
    
    generateCSS3DPreview(type) {
        // Créer une représentation 3D simple en CSS
        return `
            <div style="
                width: 60px; 
                height: 40px; 
                background: inherit; 
                transform: perspective(100px) rotateY(-15deg) rotateX(10deg);
                box-shadow: 2px 2px 8px rgba(0,0,0,0.3), inset 1px 1px 2px rgba(255,255,255,0.2);
                border: 1px solid rgba(0,0,0,0.2);
                position: relative;
            ">
                <div style="
                    position: absolute;
                    top: -2px;
                    left: 8px;
                    width: 60px;
                    height: 40px;
                    background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%);
                    transform: skewX(-10deg);
                "></div>
            </div>
        `;
    }
    
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) {
                return false;
            }
            
            // Vérifier les extensions requises
            const extensions = gl.getSupportedExtensions();
            const requiredExtensions = ['OES_texture_float', 'WEBGL_depth_texture'];
            
            const maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
            const maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
            
            // console.log(`📊 WebGL Info: ${maxTextureUnits} texture units, ${maxVertexAttribs} vertex attributes`);
            
            return maxTextureUnits >= 8 && maxVertexAttribs >= 8;
            
        } catch (e) {
            return false;
        }
    }
    
    showWebGLError() {
        const biblioContent = document.getElementById('tab-content-biblio');
        if (biblioContent) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'webgl-error';
            errorDiv.innerHTML = `
                <h4><i class="fas fa-exclamation-triangle"></i> Aperçus 3D non disponibles</h4>
                <p>Votre navigateur ne supporte pas WebGL ou a atteint la limite de contextes WebGL.</p>
                <p>Les aperçus utilisent un mode de compatibilité réduit.</p>
            `;
            
            biblioContent.insertBefore(errorDiv, biblioContent.firstChild);
        }
    }

    // ===============================================
    // APERÇUS 3D AVANCÉS (ANCIEN SYSTÈME - DÉSACTIVÉ)
    // ===============================================
    
    init3DPreviews() {
        // console.log('⚠️ Ancien système d\'aperçu désactivé au profit du nouveau système 3D');
        // Cette méthode est désactivée pour éviter les conflits avec le nouveau système
        return;
    }

    renderAdvanced3DPreview(canvas, brickType) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Configuration selon le type
        const brickConfigs = {
            'M50': { color: '#cc6633', size: [19, 5, 9] },
            'M57': { color: '#bb5522', size: [19, 5.7, 9] },
            'M60': { color: '#dd7744', size: [19, 6, 9] },
            'M65': { color: '#aa4411', size: [19, 6.5, 9] },
            'M90': { color: '#ee8855', size: [19, 9, 9] }
        };

        const config = brickConfigs[brickType] || brickConfigs['M50'];
        
        // Nettoyage
        ctx.clearRect(0, 0, width, height);
        
        // Fond avec gradient radial
        const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
        gradient.addColorStop(0, '#3c3c3c');
        gradient.addColorStop(1, '#1e1e1e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Perspective 3D améliorée
        ctx.save();
        ctx.translate(width/2, height/2);
        
        // Ombrage
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-22, 8, 32, 18);
        
        // Face principale avec gradient
        const brickGradient = ctx.createLinearGradient(-25, -15, 10, 5);
        brickGradient.addColorStop(0, config.color);
        brickGradient.addColorStop(0.5, this.lightenColor(config.color, 20));
        brickGradient.addColorStop(1, this.darkenColor(config.color, 15));
        
        ctx.fillStyle = brickGradient;
        ctx.fillRect(-25, -15, 35, 20);
        
        // Face de côté (perspective)
        const sideGradient = ctx.createLinearGradient(10, -15, 20, 5);
        sideGradient.addColorStop(0, this.darkenColor(config.color, 30));
        sideGradient.addColorStop(1, this.darkenColor(config.color, 50));
        
        ctx.fillStyle = sideGradient;
        ctx.beginPath();
        ctx.moveTo(10, -15);
        ctx.lineTo(20, -20);
        ctx.lineTo(20, 0);
        ctx.lineTo(10, 5);
        ctx.closePath();
        ctx.fill();
        
        // Face du dessus (perspective)
        const topGradient = ctx.createLinearGradient(-25, -15, 20, -20);
        topGradient.addColorStop(0, this.lightenColor(config.color, 40));
        topGradient.addColorStop(1, this.lightenColor(config.color, 20));
        
        ctx.fillStyle = topGradient;
        ctx.beginPath();
        ctx.moveTo(-25, -15);
        ctx.lineTo(-15, -20);
        ctx.lineTo(20, -20);
        ctx.lineTo(10, -15);
        ctx.closePath();
        ctx.fill();
        
        // Contours et détails
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(-25, -15, 35, 20);
        
        // Joints (détails réalistes)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(-25, -5);
        ctx.lineTo(10, -5);
        ctx.moveTo(-15, -15);
        ctx.lineTo(-15, 5);
        ctx.stroke();
        
        // Reflet
        const highlightGradient = ctx.createLinearGradient(-25, -15, -20, -10);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = highlightGradient;
        ctx.fillRect(-25, -15, 8, 6);
        
        ctx.restore();
    }

    // ===============================================
    // UTILITAIRES COULEUR
    // ===============================================
    
    lightenColor(color, percent) {
        const rgb = this.hexToRgb(color);
        return `rgb(${Math.min(255, rgb.r + percent)}, ${Math.min(255, rgb.g + percent)}, ${Math.min(255, rgb.b + percent)})`;
    }

    darkenColor(color, percent) {
        const rgb = this.hexToRgb(color);
        return `rgb(${Math.max(0, rgb.r - percent)}, ${Math.max(0, rgb.g - percent)}, ${Math.max(0, rgb.b - percent)})`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 204, g: 102, b: 51 };
    }

    // ===============================================
    // RACCOURCIS CLAVIER
    // ===============================================
    
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch(e.key.toLowerCase()) {
                    case 'n':
                        e.preventDefault();
                        this.newProject();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.openProject();
                        break;
                    case 's':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.saveAsProject();
                        } else {
                            this.saveProject();
                        }
                        break;
                    case 'z':
                        e.preventDefault();
                        this.undoAction();
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redoAction();
                        break;
                    case 'c':
                        e.preventDefault();
                        this.copyAction();
                        break;
                    case 'v':
                        e.preventDefault();
                        this.pasteAction();
                        break;
                }
            }
        });
    }

    // ===============================================
    // SYSTÈME DE NOTIFICATIONS
    // ===============================================
    
    initNotificationSystem() {
        this.createNotificationContainer();
    }

    createNotificationContainer() {
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 10001;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        // Convertir le message en string et vérifier
        if (message == null) {
            console.warn('⚠️ Notification vide ignorée');
            return;
        }
        
        const messageStr = String(message).trim();
        if (messageStr === '') {
            console.warn('⚠️ Notification vide ignorée');
            return;
        }
        
        const notification = document.createElement('div');
        notification.className = `simple-notification ${type}`;
        notification.textContent = messageStr;
        
        const colors = {
            'info': 'rgba(52, 152, 219, 0.95)',
            'success': 'rgba(39, 174, 96, 0.95)',
            'warning': 'rgba(243, 156, 18, 0.95)',
            'error': 'rgba(231, 76, 60, 0.95)'
        };

        const borderColors = {
            'info': '#2980b9',
            'success': '#27ae60',
            'warning': '#e67e22',
            'error': '#c0392b'
        };

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-100px);
            background: ${colors[type]};
            border-left: 4px solid ${borderColors[type]};
            color: #ffffff !important;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            transition: all 0.3s ease;
            max-width: 400px;
            font-size: 14px;
            font-weight: 500;
            pointer-events: auto;
            cursor: pointer;
            z-index: 10001;
            opacity: 0;
            backdrop-filter: blur(10px);
        `;

        document.body.appendChild(notification);

        // Animation d'entrée depuis le haut
        setTimeout(() => {
            notification.style.transform = 'translateX(-50%) translateY(0)';
            notification.style.opacity = '1';
        }, 10);

        // Fermeture au clic
        notification.addEventListener('click', () => {
            this.removeNotification(notification);
        });

        // Suppression automatique
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);

        this.notifications.push(notification);
    }

    removeNotification(notification) {
        // Animation de sortie vers le haut
        notification.style.transform = 'translateX(-50%) translateY(-100px)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }

    // ===============================================
    // TOOLTIPS
    // ===============================================
    
    initTooltips() {
        const elementsWithTooltips = document.querySelectorAll('[data-tooltip]');
        
        elementsWithTooltips.forEach(element => {
            let tooltip;
            
            element.addEventListener('mouseenter', () => {
                const text = element.getAttribute('data-tooltip');
                if (text) {
                    tooltip = this.createTooltip(text, element);
                }
            });
            
            element.addEventListener('mouseleave', () => {
                if (tooltip) {
                    this.removeTooltip(tooltip);
                    tooltip = null;
                }
            });
        });
    }

    createTooltip(text, element) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        
        tooltip.style.cssText = `
            position: absolute;
            background: #1e1e1e;
            color: #ffffff;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            border: 1px solid #3c3c3c;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transform: translateY(-10px);
            transition: opacity 0.2s ease, transform 0.2s ease;
            white-space: nowrap;
        `;

        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
        
        setTimeout(() => {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateY(0)';
        }, 10);
        
        return tooltip;
    }

    removeTooltip(tooltip) {
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        }, 200);
    }

    // ===============================================
    // ACTIONS DE MENU
    // ===============================================
    
    newProject() {
        // La notification sera gérée par FileMenuHandler
        if (typeof window.createNewProject === 'function') {
            window.createNewProject();
        }
    }

    openProject() {
        // La notification sera gérée par FileMenuHandler  
        if (typeof window.loadProject === 'function') {
            window.loadProject();
        } else {
            // Simuler l'ouverture d'un projet
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.click();
        }
    }

    saveProject() {
        // La notification sera gérée par FileMenuHandler
        if (typeof window.saveProject === 'function') {
            window.saveProject();
        }
    }

    saveAsProject() { this.showNotification('Sauvegarder sous...', 'info'); }
    exportProject() { this.showNotification('Export en cours...', 'info'); }
    importProject() { this.showNotification('Import en cours...', 'info'); }
    undoAction() { this.showNotification('Action annulée', 'info'); }
    redoAction() { this.showNotification('Action rétablie', 'info'); }
    copyAction() { this.showNotification('Copié', 'success'); }
    pasteAction() { this.showNotification('Collé', 'success'); }
    deleteAction() { this.showNotification('Supprimé', 'warning'); }

    setView(viewType) {
        this.showNotification(`Vue ${viewType} activée`, 'info');
        
        // Activer le bon bouton de vue dans les contrôles viewport
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => btn.classList.remove('active'));
        
        const targetButton = document.querySelector(`[data-view="${viewType}"]`);
        if (targetButton) {
            targetButton.classList.add('active');
        }
        
        // Appliquer la vue via le SceneManager
        if (window.sceneManager && window.sceneManager.camera && window.sceneManager.controls) {
            const camera = window.sceneManager.camera;
            const controls = window.sceneManager.controls;
            
            // Positions de caméra prédéfinies
            const viewPositions = {
                'top': { x: 0, y: 100, z: 0, lookAt: { x: 0, y: 0, z: 0 } },
                'front': { x: 0, y: 20, z: 100, lookAt: { x: 0, y: 20, z: 0 } },
                'side': { x: 100, y: 20, z: 0, lookAt: { x: 0, y: 20, z: 0 } },
                'perspective': { x: 50, y: 40, z: 50, lookAt: { x: 0, y: 0, z: 0 } }
            };
            
            const position = viewPositions[viewType];
            if (position) {
                // Définir la position de la caméra
                camera.position.set(position.x, position.y, position.z);
                
                // Définir le point de vue
                if (controls.target) {
                    controls.target.set(position.lookAt.x, position.lookAt.y, position.lookAt.z);
                } else {
                    camera.lookAt(new THREE.Vector3(position.lookAt.x, position.lookAt.y, position.lookAt.z));
                }
                
                // Mettre à jour les contrôles
                if (controls.update) {
                    controls.update();
                }
                
                // Mettre à jour l'affichage de la position de caméra
                const cameraElement = document.getElementById('cameraPosition');
                if (cameraElement) {
                    const viewNames = {
                        'top': 'Vue de dessus',
                        'front': 'Vue de face', 
                        'side': 'Vue de côté',
                        'perspective': 'Vue perspective'
                    };
                    cameraElement.textContent = viewNames[viewType] || 'Vue personnalisée';
                }
            }
        }
    }

    setCameraView(viewName) {
        // console.log('Setting camera view to:', viewName);
        
        // Déléguer au SceneManager pour le changement de vue
        if (window.SceneManager && window.SceneManager.setCameraView) {
            window.SceneManager.setCameraView(viewName);
            // console.log('SceneManager setCameraView called with:', viewName);
        } else {
            console.warn('SceneManager or setCameraView method not available');
        }

        // Mettre à jour l'interface utilisateur
        this.updateViewButtons(viewName);
        this.showNotification(`Vue ${viewName} activée`, 'info');
    }

    updateViewButtons(viewName) {
        // Mettre à jour les boutons de vue dans les contrôles
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-view') === viewName) {
                btn.classList.add('active');
            }
        });
        
        // Mettre à jour l'affichage de la position de caméra
        const cameraElement = document.getElementById('cameraPosition');
        if (cameraElement) {
            const viewNames = {
                'top': 'Vue de dessus',
                'front': 'Vue de face', 
                'side': 'Vue de côté',
                'iso': 'Vue isométrique',
                'perspective': 'Vue perspective'
            };
            cameraElement.textContent = viewNames[viewName] || 'Vue personnalisée';
        }
    }

    toggleGrid() { this.showNotification('Grille basculée', 'info'); }
    toggleGuides() { this.showNotification('Guides basculés', 'info'); }
    toggleRulers() { this.showNotification('Règles basculées', 'info'); }
    resetView() { 
        this.showNotification('Vue réinitialisée', 'info');
        
        // Réinitialiser la vue perspective par défaut
        this.setView('perspective');
        
        // Réinitialiser le zoom si possible
        if (window.sceneManager && window.sceneManager.resetView) {
            window.sceneManager.resetView();
        }
    }
    
    openMaterialEditor() { this.showNotification('Éditeur de matériaux ouvert', 'info'); }
    openTextureManager() { this.showNotification('Gestionnaire de textures ouvert', 'info'); }
    openColorPalette() { this.showNotification('Palette de couleurs ouverte', 'info'); }
    openThemeManager() { this.showNotification('Gestionnaire de thèmes ouvert', 'info'); }
    activateMeasureTool() { this.showNotification('Outil de mesure activé', 'info'); }
    openCalculator() { this.showNotification('Calculatrice ouverte', 'info'); }
    runValidation() { this.showNotification('Validation en cours...', 'info'); }
    openSettings() { this.showNotification('Préférences ouvertes', 'info'); }
    
    // ===============================================
    // NETTOYAGE ET DESTRUCTION
    // ===============================================
    
    destroy() {
        console.log('🧹 Nettoyage de ModernInterface...');
        
        // Nettoyer le système d'aperçu 3D
        if (this.libraryPreview3D) {
            this.libraryPreview3D.destroy();
            this.libraryPreview3D = null;
        }
        
        // Nettoyer les scènes d'aperçu existantes
        if (this.previewScenes) {
            this.previewScenes.forEach((scene, key) => {
                if (scene && scene.dispose) {
                    scene.dispose();
                }
            });
            this.previewScenes.clear();
        }
        
        // Supprimer les écouteurs d'événements si nécessaire
        // (Les événements avec délégation se nettoient automatiquement)
        
        console.log('✅ Nettoyage de ModernInterface terminé');
    }
}

// Nettoyage automatique lors de la fermeture de la page
window.addEventListener('beforeunload', () => {
    if (window.modernInterface && window.modernInterface.destroy) {
        window.modernInterface.destroy();
    }
});

// Initialisation automatique avec protection et optimisation
document.addEventListener('DOMContentLoaded', () => {
    // Initialisation différée pour éviter les violations de performance
    requestAnimationFrame(() => {
        if (!window.modernInterface) {
            window.modernInterface = new ModernInterface();
        }
    });
});

// Initialisation de secours
window.addEventListener('load', () => {
    if (!window.modernInterface) {
        window.modernInterface = new ModernInterface();
    } else {
        // Vérifier que les event listeners sont bien en place
        const menuOptions = document.querySelectorAll('.menu-option');
        
        // Force la ré-initialisation du système de menu si nécessaire
        if (menuOptions.length > 0 && window.modernInterface.initMenuSystem) {
            window.modernInterface.initMenuSystem();
        }
    }
});

// Fonction globale pour forcer la ré-initialisation (debug)
window.reinitModernInterface = () => {
    if (window.modernInterface && window.modernInterface.destroy) {
        window.modernInterface.destroy();
    }
    window.modernInterface = new ModernInterface();
};


