// Gestionnaire des raccourcis clavier
class KeyboardManager {
    constructor() {
        this.shortcuts = new Map();
        this.isEnabled = true;
        this.currentModifiers = {
            ctrl: false,
            shift: false,
            alt: false
        };
        
        // CONFIGURATION: Touches précédemment désactivées, maintenant utilisées pour les vues de caméra
        // Ces touches déclencheront des changements de vue de caméra
        this.blacklistedKeys = []; // Toutes les touches sont maintenant réactivées pour les vues
        
        this.setupShortcuts();
        this.setupEventListeners();
    }

    setupShortcuts() {
        // Raccourcis pour les modes de construction
        this.registerShortcut('KeyB', () => this.switchMode('brick'), 'Passer en mode brique');
        this.registerShortcut('KeyL', () => this.switchMode('block'), 'Passer en mode bloc');
        this.registerShortcut('KeyI', () => this.switchMode('insulation'), 'Passer en mode isolation');
        
        // Raccourcis pour les actions
        this.registerShortcut('Delete', () => this.deleteSelected(), 'Supprimer l\'élément sélectionné');
        this.registerShortcut('KeyG', () => this.toggleGhost(), 'Afficher/masquer l\'élément fantôme');
        this.registerShortcut('Escape', () => this.cancelAction(), 'Annuler l\'action en cours');
        
        // Raccourcis avec modificateurs (maintenus désactivés sur demande)
        this.registerShortcut('KeyO', () => this.openProject(), 'Ouvrir un projet', { ctrl: true });
        this.registerShortcut('KeyN', () => this.newProject(), 'Nouveau projet', { ctrl: true });
        this.registerShortcut('KeyY', () => this.redo(), 'Refaire', { ctrl: true });
        
        // Raccourcis pour les vues numériques (conservés)
        this.registerShortcut('Digit1', () => this.setCameraView('top'), 'Vue de dessus');
        this.registerShortcut('Digit2', () => this.setCameraView('front'), 'Vue de face');
        this.registerShortcut('Digit3', () => this.setCameraView('side'), 'Vue de côté');
        this.registerShortcut('Digit4', () => this.setCameraView('iso'), 'Vue isométrique');
        
        // NOUVEAUX RACCOURCIS: Vues de caméra avec les touches AZERTY (positions physiques)
        this.registerShortcut('KeyQ', () => this.setCameraView('backLeft'), 'Vue perspective arrière gauche (A)');     // Q = position A en AZERTY
        this.registerShortcut('KeyE', () => this.setCameraView('backRight'), 'Vue perspective arrière droite (E)');    // E reste E
        this.registerShortcut('KeyZ', () => this.setCameraView('frontLeft'), 'Vue perspective avant gauche (W)');      // Z = position W en AZERTY
        this.registerShortcut('KeyC', () => this.setCameraView('frontRight'), 'Vue perspective avant droite (C)');     // C reste C
        this.registerShortcut('KeyA', () => this.setCameraView('left'), 'Vue de gauche (Q)');                          // A = position Q en AZERTY
        this.registerShortcut('KeyD', () => this.setCameraView('right'), 'Vue de droite (D)');                         // D reste D
        this.registerShortcut('KeyW', () => this.setCameraView('back'), 'Vue de derrière (Z)');                        // W = position Z en AZERTY
        this.registerShortcut('KeyX', () => this.setCameraView('face'), 'Vue de face (X)');                            // X reste X
        this.registerShortcut('KeyS', () => this.setCameraView('topView'), 'Vue du dessus (S)');                       // S reste S
        
        // Raccourcis pour les outils
        this.registerShortcut('Space', () => this.togglePlacementMode(), 'Activer/désactiver le mode placement');
        this.registerShortcut('KeyR', () => this.rotateElement(), 'Faire tourner l\'élément (R)');
        this.registerShortcut('ArrowRight', () => this.rotateElement(), 'Faire tourner l\'élément (→)');
    }

    registerShortcut(key, action, description, modifiers = {}) {
        const shortcutKey = this.createShortcutKey(key, modifiers);
        this.shortcuts.set(shortcutKey, {
            action,
            description,
            key,
            modifiers
        });
    }

    createShortcutKey(key, modifiers) {
        const parts = [];
        if (modifiers.ctrl) parts.push('ctrl');
        if (modifiers.shift) parts.push('shift');
        if (modifiers.alt) parts.push('alt');
        parts.push(key);
        return parts.join('+');
    }

    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Éviter les raccourcis dans les champs de saisie
        document.addEventListener('focusin', (e) => {
            const target = e.target;
            if (target.tagName === 'INPUT' || 
                target.tagName === 'TEXTAREA' || 
                target.contentEditable === 'true' ||
                target.isContentEditable ||
                target.classList.contains('email-input')) {
                this.isEnabled = false;
            }
        });
        
        document.addEventListener('focusout', (e) => {
            const target = e.target;
            if (target.tagName === 'INPUT' || 
                target.tagName === 'TEXTAREA' || 
                target.contentEditable === 'true' ||
                target.isContentEditable ||
                target.classList.contains('email-input')) {
                this.isEnabled = true;
            }
        });
    }

    handleKeyDown(event) {
        // Vérifier si on est dans un champ de saisie (priorité absolue)
        const target = event.target;
        const isInputField = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.contentEditable === 'true' ||
                           target.isContentEditable ||
                           target.hasAttribute('contenteditable');
                           
        // Si on est dans un champ de saisie, ignorer complètement les raccourcis
        if (isInputField) {
            return;
        }

        // Si le D-pad est visible, laisser les flèches au contrôleur du D-pad (déplacement X/Z)
        if (window.GLBDpadController && window.GLBDpadController.isVisible &&
            ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageUp','PageDown'].includes(event.code)) {
            return; // le GLBDpadController gère ces touches et appelle preventDefault
        }
        
        // Vérification secondaire avec isEnabled
        if (!this.isEnabled) {
            return;
        }
        
        this.updateModifiers(event);
        
        const shortcutKey = this.createShortcutKey(event.code, {
            ctrl: event.ctrlKey,
            shift: event.shiftKey,
            alt: event.altKey
        });
        
        const shortcut = this.shortcuts.get(shortcutKey);
        if (shortcut) {
            event.preventDefault();
            event.stopPropagation();
            
            try {
                shortcut.action();
                // Jouer un son de confirmation
                // Son supprimé
            } catch (error) {
                console.error('Erreur lors de l\'exécution du raccourci:', error);
                // Son supprimé
            }
        }
    }

    handleKeyUp(event) {
        this.updateModifiers(event);
    }

    updateModifiers(event) {
        this.currentModifiers.ctrl = event.ctrlKey;
        this.currentModifiers.shift = event.shiftKey;
        this.currentModifiers.alt = event.altKey;
    }

    // Actions des raccourcis
    switchMode(mode) {
        const buttons = {
            'brick': 'brickTool',
            'block': 'blockTool',
            'insulation': 'insulationTool'
        };
        
        const button = document.getElementById(buttons[mode]);
        if (button && window.ConstructionTools) {
            button.click();
            this.showToast(`Mode ${mode} activé`);
        }
    }

    deleteSelected() {
        if (window.ConstructionTools && window.ConstructionTools.selectedElement) {
            window.ConstructionTools.removeElement(window.ConstructionTools.selectedElement);
            this.showToast('Élément supprimé');
        }
    }

    toggleGhost() {
        const checkbox = document.getElementById('showGhost');
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
            this.showToast(`Fantôme ${checkbox.checked ? 'affiché' : 'masqué'}`);
        }
    }

    toggleSuggestions() {
        const checkbox = document.getElementById('showSuggestions');
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
            this.showToast(`Suggestions ${checkbox.checked ? 'activées' : 'désactivées'}`);
        }
    }

    cancelAction() {
        if (window.ConstructionTools) {
            window.ConstructionTools.clearSuggestions();
            this.showToast('Action annulée');
        }
    }

    saveProject() {
        const button = document.getElementById('saveProject');
        if (button) {
            button.click();
        }
    }

    openProject() {
        const button = document.getElementById('loadProject');
        if (button) {
            button.click();
        }
    }

    newProject() {
        const button = document.getElementById('newProject');
        if (button) {
            button.click();
        }
    }

    undo() {
        // Déléguer vers EditMenuHandler
        if (window.EditMenuHandler) {
            window.EditMenuHandler.undo();
        } else {
            this.showToast('Système d\'annulation non disponible');
        }
    }

    redo() {
        // Déléguer vers EditMenuHandler
        if (window.EditMenuHandler) {
            window.EditMenuHandler.redo();
        } else {
            this.showToast('Système de rétablissement non disponible');
        }
    }

    setCameraView(view) {
        // Appeler directement SceneManager au lieu de chercher des boutons
        if (window.SceneManager && window.SceneManager.setCameraView) {
            window.SceneManager.setCameraView(view);
            this.showToast(`Vue ${view} activée`);
        } else {
            // Fallback: essayer de trouver un bouton correspondant
            const button = document.getElementById(view + 'View');
            if (button) {
                button.click();
                this.showToast(`Vue ${view} activée`);
            } else {
                this.showToast(`Vue ${view} non disponible`);
            }
        }
    }

    togglePlacementMode() {
        if (window.ConstructionTools) {
            window.ConstructionTools.isPlacementMode = !window.ConstructionTools.isPlacementMode;
            this.showToast(`Mode placement ${window.ConstructionTools.isPlacementMode ? 'activé' : 'désactivé'}`);
        }
    }

    rotateElement() {
        if (window.ConstructionTools) {
            // Utiliser la même logique que ConstructionTools.handleKeyPress pour R et flèche droite
            if (window.ConstructionTools.ghostElement && window.ConstructionTools.showGhost && !window.ConstructionTools.activeBrickForSuggestions) {
                window.ConstructionTools.rotateGhostElement();
                this.showToast('Élément fantôme tourné');
            } else if (window.SceneManager && window.SceneManager.selectedElement) {
                window.ConstructionTools.rotateSelectedElement();
                this.showToast('Élément sélectionné tourné');
            }
        }
    }

    clearAll() {
        const button = document.getElementById('clearAll');
        if (button) {
            button.click();
        }
    }

    // Afficher un toast de notification
    showToast(message, duration = 2000) {
        // Créer ou réutiliser l'élément toast
        let toast = document.getElementById('keyboard-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'keyboard-toast';
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--primary-color);
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                font-size: 14px;
                z-index: 10000;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
                pointer-events: none;
            `;
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        
        // Animer l'apparition
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);

        // Masquer après le délai
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
        }, duration);
    }

    // Obtenir la liste des raccourcis pour l'aide
    getShortcutsList() {
        const shortcuts = [];
        for (const [key, shortcut] of this.shortcuts) {
            shortcuts.push({
                key: this.formatShortcutKey(shortcut.key, shortcut.modifiers),
                description: shortcut.description
            });
        }
        return shortcuts.sort((a, b) => a.key.localeCompare(b.key));
    }

    formatShortcutKey(key, modifiers) {
        const parts = [];
        if (modifiers.ctrl) parts.push('Ctrl');
        if (modifiers.shift) parts.push('Shift');
        if (modifiers.alt) parts.push('Alt');
        
        // Convertir les codes de touches en noms lisibles (disposition AZERTY)
        const keyNames = {
            'KeyB': 'B', 'KeyL': 'L', 'KeyI': 'I', 'KeyG': 'G', 'KeyS': 'S',
            'KeyO': 'O', 'KeyN': 'N', 'KeyZ': 'Z', 'KeyY': 'Y', 'KeyR': 'R',
            'KeyX': 'X', 'KeyA': 'A', 'KeyE': 'E', 'KeyW': 'W', 'KeyC': 'C',
            'KeyQ': 'Q', 'KeyD': 'D', 'Delete': 'Suppr', 'Escape': 'Échap', 
            'Space': 'Espace', 'Digit1': '1', 'Digit2': '2', 'Digit3': '3', 'Digit4': '4'
        };
        
        parts.push(keyNames[key] || key);
        return parts.join(' + ');
    }

    setEnabled(enabled) {
        this.isEnabled = enabled;
    }
}

// Instance globale
window.KeyboardManager = new KeyboardManager();
