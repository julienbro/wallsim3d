/**
 * WalSim5D - Simulateur de Construction Murale
 * Copyright (c) 2025. Tous droits réservés.
 * 
 * Ce fichier est protégé par la licence MIT.
 * Voir le fichier LICENSE pour plus de détails.
 * 
 * Utilisation commerciale non autorisée sans permission expresse.
 */

// Gestionnaire de popup de démarrage avec barre de progression

class StartupManager {
    constructor() {
        this.overlay = null;
        this.progressBar = null;
        this.progressText = null;
        this.currentProgress = 0;
        this.loadingSteps = [
            'Initialisation des composants...',
            'Chargement de Three.js...',
            'Préparation de l\'interface...',
            'Configuration des matériaux...',
            'Finalisation...'
        ];
        this.currentStep = 0;
        this.isComplete = false;
    }

    showStartupPopup() {
        this.createPopupHTML();
        this.attachEventListeners();
        this.startProgressSimulation();
    }

    createPopupHTML() {
        // Créer l'overlay principal
        this.overlay = document.createElement('div');
        this.overlay.className = 'startup-overlay';
        this.overlay.id = 'startup-overlay';

        // Créer le contenu de la popup
        this.overlay.innerHTML = `
            <div class="startup-popup">
                <div class="startup-content">
                    <img src="media/accueil.png" alt="WallSim3D" class="startup-logo" />
                    <div class="app-version">v1.0</div>
                    
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progress-fill"></div>
                        </div>
                        <div class="progress-text" id="progress-text">Initialisation...</div>
                    </div>
                    
                    <div class="startup-buttons">
                        <button class="startup-button btn-nouveau" id="btn-nouveau">
                            <i class="fas fa-plus-circle"></i> Nouveau
                        </button>
                        <button class="startup-button btn-ouvrir" id="btn-ouvrir">
                            <i class="fas fa-folder-open"></i> Ouvrir
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Ajouter au DOM
        document.body.appendChild(this.overlay);

        // Récupérer les références des éléments
        this.progressBar = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');
    }

    attachEventListeners() {
        const btnNouveau = document.getElementById('btn-nouveau');
        const btnOuvrir = document.getElementById('btn-ouvrir');

        btnNouveau.addEventListener('click', () => {
            this.handleNewProject();
        });

        btnOuvrir.addEventListener('click', () => {
            this.handleOpenProject();
        });

        // Empêcher la fermeture en cliquant à côté pendant le chargement
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay && this.isComplete) {
                this.closePopup();
            }
        });
    }

    startProgressSimulation() {
        let step = 0;
        const totalSteps = this.loadingSteps.length;
        const stepDuration = 800; // milliseconds per step

        const progressInterval = setInterval(() => {
            if (step < totalSteps) {
                const progress = ((step + 1) / totalSteps) * 100;
                this.updateProgress(progress, this.loadingSteps[step]);
                step++;
            } else {
                clearInterval(progressInterval);
                this.completeLoading();
            }
        }, stepDuration);
    }

    updateProgress(percentage, text) {
        if (this.progressBar) {
            this.progressBar.style.width = percentage + '%';
        }
        if (this.progressText) {
            this.progressText.textContent = text;
        }
        this.currentProgress = percentage;
    }

    completeLoading() {
        this.updateProgress(100, 'Prêt !');
        this.isComplete = true;

        // Vérifier s'il y a une sauvegarde automatique
        const autoSaved = localStorage.getItem('wallsim3d_autosave');
        
        if (autoSaved) {
            try {
                const projectData = JSON.parse(autoSaved);
                this.showAutoSaveOptions(projectData);
            } catch (error) {
                console.error('❌ Erreur lors de la lecture de la sauvegarde automatique:', error);
                this.showNormalOptions();
            }
        } else {
            this.showNormalOptions();
        }
    }

    showNormalOptions() {
        // Activer directement les boutons
        const btnNouveau = document.getElementById('btn-nouveau');
        const btnOuvrir = document.getElementById('btn-ouvrir');
        
        if (btnNouveau) {
            btnNouveau.disabled = false;
            btnNouveau.classList.add('unlocked');
        }
        if (btnOuvrir) {
            btnOuvrir.disabled = false;
            btnOuvrir.classList.add('unlocked');
        }

        // Changer le texte de progression
        setTimeout(() => {
            if (this.progressText) {
                this.progressText.textContent = 'Chargement effectué à 100%';
                this.progressText.style.display = 'block';
            }
        }, 500);
    }

    showAutoSaveOptions(projectData) {
        // Activer directement les boutons normaux
        const btnNouveau = document.getElementById('btn-nouveau');
        const btnOuvrir = document.getElementById('btn-ouvrir');
        
        if (btnNouveau) {
            btnNouveau.disabled = false;
            btnNouveau.classList.add('unlocked');
        }
        if (btnOuvrir) {
            btnOuvrir.disabled = false;
            btnOuvrir.classList.add('unlocked');
        }

        // Modifier la popup pour ajouter une colonne à droite
        const popup = document.querySelector('.startup-popup');
        popup.classList.add('has-autosave');
        
        // Date formatée
        const saveDate = projectData.modified ? new Date(projectData.modified) : new Date();
        const timeAgo = this.getTimeAgo(saveDate);
        
        // Créer la section de restauration à droite
        const autoSaveColumn = document.createElement('div');
        autoSaveColumn.className = 'autosave-column';
        
        autoSaveColumn.innerHTML = `
            <div class="autosave-header">
                <div class="autosave-icon">💾</div>
                <h3>Restauration</h3>
                <p>Reprendre votre travail précédent</p>
            </div>
            
            <div class="project-card">
                <div class="project-name">
                    <span class="file-icon">📝</span>
                    <strong>${projectData.name || 'Projet sans nom'}</strong>
                </div>
                <div class="project-details">
                    <div class="detail-item">
                        <span class="detail-icon">🕒</span>
                        <span>Sauvegardé: ${timeAgo}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">📊</span>
                        <span>Éléments: ${projectData.elements?.length || 0} objet(s)</span>
                    </div>
                </div>
            </div>
            
            <button class="startup-button btn-restore" id="btn-restore">
                <i class="fas fa-undo"></i> Restaurer ce projet
            </button>
            
            <div class="restore-note">
                <small>💡 La sauvegarde automatique sera conservée</small>
            </div>
            
            <div class="separator"></div>
            
            <div class="autosave-actions">
                <p class="action-label">Autres actions :</p>
                <button class="startup-button btn-delete-autosave" id="btn-delete-autosave">
                    <i class="fas fa-trash-alt"></i> Supprimer la sauvegarde
                </button>
            </div>
        `;
        
        popup.appendChild(autoSaveColumn);

        // Afficher le texte de progression
        if (this.progressText) {
            this.progressText.textContent = 'Projet précédent trouvé - Choisissez une action';
            this.progressText.style.display = 'block';
        }

        // Attacher les événements
        document.getElementById('btn-restore').addEventListener('click', () => {
            this.handleRestoreProject(projectData);
        });

        document.getElementById('btn-delete-autosave').addEventListener('click', () => {
            this.showDeleteConfirmation(() => {
                localStorage.removeItem('wallsim3d_autosave');
                // Masquer la colonne de restauration
                autoSaveColumn.style.display = 'none';
                popup.classList.remove('has-autosave');
                this.showNotification('Sauvegarde automatique supprimée', 'info');
            });
        });
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'info' ? '#17a2b8' : '#28a745'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10002;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    showDeleteConfirmation(callback) {
        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'confirm-overlay';
        confirmDialog.innerHTML = `
            <div class="confirm-dialog">
                <div class="confirm-header">
                    <div class="confirm-icon">⚠️</div>
                    <h4>Supprimer la sauvegarde ?</h4>
                </div>
                <p>En créant un nouveau projet, voulez-vous supprimer la sauvegarde automatique actuelle ?</p>
                <div class="confirm-buttons">
                    <button class="confirm-btn confirm-yes" id="confirm-yes">
                        Oui, supprimer
                    </button>
                    <button class="confirm-btn confirm-no" id="confirm-no">
                        Non, conserver
                    </button>
                    <button class="confirm-btn confirm-cancel" id="confirm-cancel">
                        Annuler
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(confirmDialog);

        document.getElementById('confirm-yes').onclick = () => {
            document.body.removeChild(confirmDialog);
            callback();
        };

        document.getElementById('confirm-no').onclick = () => {
            document.body.removeChild(confirmDialog);
            this.handleNewProject();
        };

        document.getElementById('confirm-cancel').onclick = () => {
            document.body.removeChild(confirmDialog);
        };
    }

    handleRestoreProject(projectData) {
        console.log('🔄 Restauration du projet depuis la sauvegarde automatique');
        
        // Émettre un événement pour signaler la restauration
        window.dispatchEvent(new CustomEvent('startup-restore-project', {
            detail: { projectData }
        }));
        
        // Fermer la popup
        this.closePopup();
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays === 1) return 'Hier';
        if (diffDays < 7) return `Il y a ${diffDays} jours`;
        
        return date.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'short', 
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
        });
    }

    handleNewProject() {
        // console.log('🆕 Nouveau projet demandé');
        
        // Émettre un événement pour signaler qu'un nouveau projet est demandé
        window.dispatchEvent(new CustomEvent('startup-new-project'));
        
        // Fermer la popup avec animation
        this.closePopup();
    }

    handleOpenProject() {
        console.log('📂 Ouverture de projet demandée');
        
        // Créer un input file invisible pour sélectionner un fichier
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,.wsim';
        fileInput.style.display = 'none';
        
        fileInput.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                console.log('📂 Fichier sélectionné:', file.name);
                
                // Émettre un événement avec le fichier sélectionné
                window.dispatchEvent(new CustomEvent('startup-open-project', {
                    detail: { file }
                }));
                
                // Ne pas fermer la popup automatiquement pour "Ouvrir"
                // L'utilisateur peut la fermer manuellement ou après traitement du fichier
                // this.closePopup();
            }
        };
        
        // Déclencher la sélection de fichier
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    closePopup() {
        if (this.overlay) {
            // Animation de fermeture
            this.overlay.classList.add('closing');
            
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                }
                
                // Marquer que le startup est terminé - afficher l'interface principale
                document.body.classList.add('startup-loaded');
                
                // Émettre un événement pour signaler que la popup est fermée
                window.dispatchEvent(new CustomEvent('startup-popup-closed'));
            }, 500);
        }
    }

    // Méthode pour fermer la popup depuis l'extérieur (par exemple après initialisation complète)
    static closeStartupPopup() {
        const overlay = document.getElementById('startup-overlay');
        if (overlay) {
            overlay.classList.add('closing');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                
                // Marquer que le startup est terminé - afficher l'interface principale
                document.body.classList.add('startup-loaded');
            }, 500);
        }
    }

    // Méthode utilitaire pour mettre à jour la progression depuis l'extérieur
    static updateExternalProgress(percentage, text) {
        const progressBar = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        if (progressBar) {
            progressBar.style.width = percentage + '%';
        }
        if (progressText) {
            progressText.textContent = text;
        }
    }
}

// Instance globale du gestionnaire de startup
window.StartupManager = StartupManager;

// Auto-démarrage de la popup si c'est le premier chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si on doit afficher la popup (par exemple, pas de projet en cours)
    const shouldShowStartup = !localStorage.getItem('wallsim3d-auto-load') || 
                              localStorage.getItem('wallsim3d-show-startup') === 'true';
    
    if (shouldShowStartup) {
        const startupManager = new StartupManager();
        startupManager.showStartupPopup();
        
        // Nettoyer le flag après affichage
        localStorage.removeItem('wallsim3d-show-startup');
    }
});
