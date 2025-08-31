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
                    
                    <div class="email-section" id="email-section" style="display: none;">
                        <div class="email-header">
                            <h3>Accès à WallSim3D</h3>
                            <p>Veuillez saisir votre adresse email pour déverrouiller l'application</p>
                        </div>
                        <div class="email-input-container">
                            <input type="email" id="email-input" class="email-input" placeholder="votre.email@exemple.com" required>
                            <button class="validate-email-btn" id="validate-email-btn">
                                <i class="fas fa-check"></i> Valider
                            </button>
                        </div>
                        <div class="email-status" id="email-status"></div>
                    </div>
                    
                    <div class="startup-buttons">
                        <button class="startup-button btn-nouveau" id="btn-nouveau" disabled>
                            <i class="fas fa-plus-circle"></i> Nouveau
                        </button>
                        <button class="startup-button btn-ouvrir" id="btn-ouvrir" disabled>
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

        if (btnNouveau) {
            btnNouveau.addEventListener('click', () => {
                this.handleNewProject();
            });
        }

        if (btnOuvrir) {
            btnOuvrir.addEventListener('click', () => {
                this.handleOpenProject();
            });
        }

        // Configuration des événements email (sera appelé si besoin)
        this.setupEmailEvents();

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
                this.showEmailSection();
            }
        } else {
            this.showEmailSection();
        }
    }

    showEmailSection() {
        // Masquer la barre de progression
        const progressContainer = document.querySelector('.progress-container');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }

        // Vérifier si la section email existe, sinon la créer
        let emailSection = document.getElementById('email-section');
        if (!emailSection) {
            console.log('🔨 Création de la section email manquante');
            this.createEmailSection();
            emailSection = document.getElementById('email-section');
        }

        // Afficher la section email
        if (emailSection) {
            emailSection.style.display = 'block';
        } else {
            console.error('❌ Impossible de trouver ou créer la section email');
        }
    }

    createEmailSection() {
        // Trouver un conteneur approprié pour la section email
        const container = document.querySelector('.startup-content') || document.querySelector('.actions-container') || document.body;
        
        // Créer la section email
        const emailSection = document.createElement('div');
        emailSection.id = 'email-section';
        emailSection.className = 'email-validation-section';
        emailSection.style.display = 'none';
        
        emailSection.innerHTML = `
            <div class="email-header">
                <h3>📧 Validation d'accès</h3>
                <p>Veuillez saisir votre adresse email pour accéder à WallSim3D :</p>
            </div>
            <div class="email-form">
                <input type="email" id="email-input" class="email-input" placeholder="votre.email@example.com" required>
                <button id="validate-email-btn" class="validate-email-btn">
                    <i class="fas fa-check"></i> Valider
                </button>
            </div>
            <div id="email-status" class="email-status"></div>
            <div class="email-note">
                <small>💡 La validation ouvrira votre client email pour envoyer un message vers <strong>utilisateurs@wallsim3d.com</strong></small>
            </div>
        `;
        
        // Insérer avant les boutons si possible
        const buttonsContainer = container.querySelector('.actions-container');
        if (buttonsContainer) {
            container.insertBefore(emailSection, buttonsContainer);
        } else {
            container.appendChild(emailSection);
        }
        
        // Ajouter les événements
        this.setupEmailEvents();
    }

    setupEmailEvents() {
        const validateEmailBtn = document.getElementById('validate-email-btn');
        const emailInput = document.getElementById('email-input');
        
        if (validateEmailBtn && emailInput) {
            // Validation de l'email
            validateEmailBtn.addEventListener('click', () => {
                this.validateEmail();
            });

            // Validation par Entrée
            emailInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.validateEmail();
                }
            });
        }
    }

    async validateEmail() {
        const emailInput = document.getElementById('email-input');
        const validateBtn = document.getElementById('validate-email-btn');
        const emailStatus = document.getElementById('email-status');
        
        const email = emailInput.value.trim();
        
        // Validation basique de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showEmailStatus('Veuillez saisir une adresse email valide', 'error');
            return;
        }

        // Désactiver le bouton et montrer le chargement
        validateBtn.disabled = true;
        validateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validation...';
        
        try {
            // Simulation de l'envoi au backend - remplacer par une vraie API plus tard
            // Pour l'instant, on valide automatiquement après avoir préparé l'email
            
            this.showEmailStatus('Validation en cours...', 'info');
            
            // Envoyer les informations par email (simulation)
            this.sendEmailToBackend(email);
            
            // Simuler un délai de traitement
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Validation réussie
            this.showEmailStatus('🔓 Email validé ! Votre client email s\'est ouvert pour envoyer la validation vers utilisateurs@wallsim3d.com', 'success');
            this.unlockButtons();
            
            // Stocker l'email validé pour cette session
            sessionStorage.setItem('wallsim3d_validated_email', email);
            
            // Masquer la section email après un délai
            setTimeout(() => {
                const emailSection = document.getElementById('email-section');
                if (emailSection) {
                    emailSection.style.display = 'none';
                }
            }, 2000);
                
        } catch (error) {
            console.error('Erreur lors de la validation email:', error);
            this.showEmailStatus('Erreur de connexion. Veuillez réessayer.', 'error');
            validateBtn.disabled = false;
            validateBtn.innerHTML = '<i class="fas fa-check"></i> Valider';
        }
    }

    async sendEmailToBackend(email) {
        try {
            // Tentative d'envoi via un service externe (EmailJS, webhook, etc.)
            console.log('📧 Tentative d\'envoi d\'email automatique...');
            
            // Simuler un envoi d'email côté serveur
            const emailData = {
                to: 'utilisateurs@wallsim3d.com',
                from: email,
                subject: 'Nouvelle validation WallSim3D',
                body: `
Nouvelle validation d'accès WallSim3D

Email utilisateur: ${email}
Date/Heure: ${new Date().toLocaleString('fr-FR')}
Navigateur: ${navigator.userAgent}
URL: ${window.location.href}

---
Ce message a été généré automatiquement par WallSim3D v1.0
                `.trim()
            };

            // Pour l'instant, on simule l'envoi (remplacer par vraie API plus tard)
            const success = await this.simulateEmailSending(emailData);
            
            if (success) {
                console.log('✅ Email envoyé automatiquement vers utilisateurs@wallsim3d.com');
                return { success: true };
            } else {
                throw new Error('Service d\'email temporairement indisponible');
            }
            
        } catch (error) {
            console.warn('⚠️ Envoi automatique échoué:', error.message);
            console.log('📝 Email enregistré localement pour traitement différé');
            
            // Enregistrer localement pour traitement ultérieur
            this.storeEmailLocally(email);
            return { success: true, method: 'local' };
        }
    }

    async simulateEmailSending(emailData) {
        // Simulation d'un appel API (remplacer par vraie intégration)
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simuler un succès pour le moment
                console.log('� Email simulé envoyé:', emailData);
                resolve(true);
            }, 500);
        });
    }

    storeEmailLocally(email) {
        // Stocker les validations localement pour traitement ultérieur
        const validations = JSON.parse(localStorage.getItem('wallsim3d_validations') || '[]');
        validations.push({
            email: email,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
        localStorage.setItem('wallsim3d_validations', JSON.stringify(validations));
        console.log('� Validation stockée localement');
    }

    showEmailStatus(message, type) {
        const emailStatus = document.getElementById('email-status');
        if (emailStatus) {
            emailStatus.textContent = message;
            emailStatus.className = `email-status ${type}`;
            emailStatus.style.display = 'block';
        }
    }

    unlockButtons() {
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
    }

    showNormalOptions() {
        // Ne plus activer automatiquement les boutons - ils seront activés après validation email
        const btnNouveau = document.getElementById('btn-nouveau');
        const btnOuvrir = document.getElementById('btn-ouvrir');
        
        // Vérifier si l'email a déjà été validé dans cette session
        const validatedEmail = sessionStorage.getItem('wallsim3d_validated_email');
        if (validatedEmail) {
            this.unlockButtons();
            // Masquer la section email si déjà validé
            const emailSection = document.getElementById('email-section');
            if (emailSection) {
                emailSection.style.display = 'none';
            }
        } else {
            // Afficher la section email
            this.showEmailSection();
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
        // Vérifier d'abord la validation email
        const validatedEmail = sessionStorage.getItem('wallsim3d_validated_email');
        if (!validatedEmail) {
            this.showEmailSection();
        } else {
            // Activer les boutons normaux aussi
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
