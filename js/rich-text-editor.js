/**
 * Éditeur de texte riche pour le mode opératoire
 */
class RichTextEditor {
    constructor(elementId, placeholder = '') {
        this.elementId = elementId;
        this.placeholder = placeholder;
        this.editorContainer = null;
        this.editor = null;
        this.toolbar = null;
        this.init();
    }

    init() {
        const originalTextarea = document.getElementById(this.elementId);
        if (!originalTextarea) {
            console.error(`Element with id '${this.elementId}' not found`);
            return;
        }

        // Créer le conteneur principal
        this.editorContainer = document.createElement('div');
        this.editorContainer.className = 'rich-text-editor';
        this.editorContainer.style.cssText = `
            border: 1px solid #d1d5db;
            border-radius: 8px;
            background: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        `;

        // Créer la barre d'outils
        this.createToolbar();

        // Créer l'éditeur
        this.createEditor();

        // Remplacer le textarea original
        originalTextarea.style.display = 'none';
        originalTextarea.parentNode.insertBefore(this.editorContainer, originalTextarea);

        // Synchroniser le contenu
        this.syncContent();
    }

    createToolbar() {
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'editor-toolbar';
        this.toolbar.style.cssText = `
            display: flex;
            align-items: center;
            padding: 8px 12px;
            border-bottom: 1px solid #e5e7eb;
            background: #f9fafb;
            border-radius: 8px 8px 0 0;
            gap: 4px;
            flex-wrap: wrap;
        `;

        // Boutons de formatage
        const tools = [
            { command: 'bold', icon: '<strong>B</strong>', title: 'Gras (Ctrl+B)' },
            { command: 'italic', icon: '<em>I</em>', title: 'Italique (Ctrl+I)' },
            { command: 'underline', icon: '<u>U</u>', title: 'Souligné (Ctrl+U)' },
            { type: 'separator' },
            { command: 'formatBlock', value: 'h3', icon: 'H3', title: 'Titre de section' },
            { type: 'separator' },
            { command: 'insertUnorderedList', icon: '• Liste', title: 'Liste à puces' },
            { command: 'insertOrderedList', icon: '1. Liste', title: 'Liste numérotée' },
            { type: 'separator' },
            { command: 'indent', icon: '→', title: 'Indenter' },
            { command: 'outdent', icon: '←', title: 'Désindenter' },
            { type: 'separator' },
            { command: 'justifyLeft', icon: '⇤', title: 'Aligner à gauche' },
            { command: 'justifyCenter', icon: '⇔', title: 'Centrer' },
            { command: 'justifyRight', icon: '⇥', title: 'Aligner à droite' },
            { type: 'separator' },
            { command: 'insertHorizontalRule', icon: '―', title: 'Ligne de séparation' },
            { command: 'removeFormat', icon: '✕', title: 'Supprimer le formatage' }
        ];

        tools.forEach(tool => {
            if (tool.type === 'separator') {
                const separator = document.createElement('div');
                separator.style.cssText = `
                    width: 1px;
                    height: 24px;
                    background: #d1d5db;
                    margin: 0 4px;
                `;
                this.toolbar.appendChild(separator);
                return;
            }

            const button = document.createElement('button');
            button.type = 'button';
            button.innerHTML = tool.icon;
            button.title = tool.title;
            button.style.cssText = `
                padding: 6px 8px;
                border: 1px solid transparent;
                border-radius: 4px;
                background: transparent;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                color: #374151;
                transition: all 0.2s;
                min-width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            // Effets hover
            button.addEventListener('mouseenter', () => {
                button.style.background = '#e5e7eb';
                button.style.borderColor = '#d1d5db';
            });

            button.addEventListener('mouseleave', () => {
                if (!button.classList.contains('active')) {
                    button.style.background = 'transparent';
                    button.style.borderColor = 'transparent';
                }
            });

            button.addEventListener('click', (e) => {
                e.preventDefault();
                if (tool.value) {
                    this.executeCommand(tool.command, tool.value);
                } else {
                    this.executeCommand(tool.command);
                }
                this.editor.focus();
            });

            this.toolbar.appendChild(button);
        });

        this.editorContainer.appendChild(this.toolbar);
    }

    createEditor() {
        this.editor = document.createElement('div');
        this.editor.contentEditable = true;
        this.editor.className = 'editor-content';
        this.editor.style.cssText = `
            min-height: 200px;
            max-height: 400px;
            padding: 16px;
            outline: none;
            line-height: 1.6;
            font-size: 14px;
            color: #374151;
            border-radius: 0 0 8px 8px;
            overflow-y: auto;
            resize: vertical;
        `;

        // Placeholder
        if (this.placeholder) {
            this.editor.setAttribute('data-placeholder', this.placeholder);
        }

        // Styles pour le placeholder et l'éditeur
        const style = document.createElement('style');
        style.textContent = `
            .editor-content:empty:before {
                content: attr(data-placeholder);
                color: #9ca3af;
                cursor: text;
                white-space: pre-wrap;
                font-style: italic;
            }
            .editor-content:focus:empty:before {
                content: '';
            }
            .editor-content ul, .editor-content ol {
                padding-left: 24px;
                margin: 12px 0;
            }
            .editor-content li {
                margin: 6px 0;
                line-height: 1.5;
            }
            .editor-content p {
                margin: 12px 0;
            }
            .editor-content strong {
                font-weight: 600;
                color: #1f2937;
            }
            .editor-content em {
                font-style: italic;
                color: #4b5563;
            }
            .editor-content u {
                text-decoration: underline;
                text-decoration-color: #3b82f6;
            }
            .editor-content h3 {
                font-size: 16px;
                font-weight: 600;
                margin: 16px 0 8px 0;
                color: #1f2937;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 4px;
            }
            .editor-content hr {
                margin: 16px 0;
                border: none;
                border-top: 2px solid #e5e7eb;
                border-radius: 1px;
            }
            /* Scrollbar personnalisée */
            .editor-content::-webkit-scrollbar {
                width: 6px;
            }
            .editor-content::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 3px;
            }
            .editor-content::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 3px;
            }
            .editor-content::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
            }
            /* Boutons de modèles */
            .template-buttons {
                display: flex;
                gap: 8px;
                margin-top: 8px;
                flex-wrap: wrap;
            }
            .template-btn {
                padding: 4px 8px;
                font-size: 11px;
                background: #f3f4f6;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                cursor: pointer;
                color: #374151;
                transition: all 0.2s;
            }
            .template-btn:hover {
                background: #e5e7eb;
                border-color: #9ca3af;
            }
        `;
        document.head.appendChild(style);

        // Ajouter des boutons de modèles
        this.addTemplateButtons();

        // Événements
        this.editor.addEventListener('input', () => {
            this.syncContent();
            this.updateToolbarState();
        });

        this.editor.addEventListener('keydown', (e) => {
            // Raccourcis clavier
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        this.executeCommand('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.executeCommand('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        this.executeCommand('underline');
                        break;
                }
            }

            // Enter pour créer des paragraphes
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.executeCommand('insertParagraph');
            }
        });

        this.editor.addEventListener('focus', () => {
            this.editorContainer.style.borderColor = '#3b82f6';
            this.editorContainer.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        });

        this.editor.addEventListener('blur', () => {
            this.editorContainer.style.borderColor = '#d1d5db';
            this.editorContainer.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        });

        this.editorContainer.appendChild(this.editor);
    }

    addTemplateButtons() {
        const templateContainer = document.createElement('div');
        templateContainer.className = 'template-buttons';
        
        // Templates différents selon le type d'éditeur
        let templates = [];
        
        if (this.elementId === 'detailedProcedure') {
            // Modèles pour l'éditeur principal du mode opératoire
            templates = [
                { 
                    name: '🏗️ Mur de briques - Atelier', 
                    content: `### 1. PRÉPARATION DE L'ATELIER

**Organisation de l'espace de travail :**
• Vérifier la planéité de la table d'atelier
• Nettoyer la surface de travail
• Disposer les outils à portée de main (niveau, règle, truelle)
• Organiser les matériaux par type et dimension

**Préparation des matériaux :**
• Sélectionner les briques selon le projet (vérifier les dimensions)
• Préparer le mortier : dosage adapté au projet pédagogique
• Humidifier légèrement les briques si nécessaire
• Prévoir un récipient d'eau pour le nettoyage

**Sécurité en atelier :**
• Port des équipements de protection (tablier, gants)
• Vérification de l'éclairage du poste de travail
• Organisation pour éviter l'encombrement des allées

---

### 2. CONSTRUCTION DU MUR

**Traçage et implantation :**
• Tracer l'implantation du mur sur la table d'atelier
• Définir les repères d'alignement au cordeau
• Marquer les dimensions selon le plan

**Première assise :**
• Poser la première rangée de briques à sec pour valider l'alignement
• Appliquer une couche de mortier uniforme (épaisseur : 10-12mm)
• Poser les briques d'angle en premier, contrôler l'équerrage
• Vérifier le niveau et l'alignement de chaque brique

**Assises suivantes :**
• Respecter l'appareillage prévu (décalage régulier des joints)
• Appliquer le mortier de façon homogène
• Contrôler la verticalité tous les 3 rangs
• Ajuster l'épaisseur des joints (8-12mm)

**Finitions :**
• Lisser les joints avant prise complète du mortier
• Nettoyer l'excès de mortier avec une éponge humide
• Vérifier les dimensions finales du mur réalisé

---

### 3. CONTRÔLES ET VALIDATION

**Auto-évaluation :**
• Contrôler la planéité générale avec une règle
• Vérifier la verticalité avec un niveau à bulle
• Mesurer les dimensions et comparer au plan
• S'assurer de la propreté de l'ouvrage

**Points de vigilance :**
• Régularité des joints horizontaux et verticaux
• Alignement général du mur
• Qualité de l'appareillage (décalage des joints)
• Finition des joints et propreté

**Documentation :**
• Photographier l'ouvrage terminé
• Noter les difficultés rencontrées
• Relever les dimensions réelles
• Préparer la présentation du travail réalisé`
                },
                { 
                    name: '🧱 Mur de blocs - Atelier', 
                    content: `### 1. ORGANISATION DE L'ATELIER

**Préparation du poste :**
• Contrôler la planéité de la surface de travail
• Nettoyer et dépoussiérer la table d'atelier
• Organiser les blocs par catégorie (pleins, creux, angles)
• Préparer les outils : niveau, cordeau, maillet caoutchouc

**Matériaux et dosages :**
• Colle ou mortier-colle adapté au type de blocs
• Vérifier la compatibilité mortier/blocs
• Prévoir les outils de répartition (peigne, truelle crantée)
• Organiser un poste de découpe si nécessaire

**Consignes d'atelier :**
• Définir les zones de stockage des matériaux
• Prévoir l'évacuation des déchets de découpe
• Organiser le nettoyage en cours de réalisation

---

### 2. RÉALISATION DU MUR

**Implantation sur table :**
• Tracer les limites du mur sur la surface de travail
• Matérialiser les angles et les dimensions principales
• Vérifier les équerrages avec une équerre de maçon

**Montage par rangs :**
• Commencer par les blocs d'angle (référence d'alignement)
• Étaler la colle en respectant les préconisations
• Poser chaque bloc en appliquant une pression uniforme
• Vérifier l'alignement au cordeau tendu

**Contrôles en cours de montage :**
• Niveau horizontal et vertical après chaque bloc
• Décalage des joints verticaux (minimum 1/3 de longueur)
• Épaisseur régulière des joints de colle
• Rectification immédiate des défauts

**Ajustements et découpes :**
• Mesurer précisément les blocs de fermeture
• Effectuer les découpes avec l'outillage adapté
• Ébavurer les arêtes coupées
• Ajuster la colle sur les surfaces découpées

---

### 3. FINITION ET ÉVALUATION

**Finitions d'atelier :**
• Nettoyer les bavures de colle avant durcissement
• Vérifier la planéité d'ensemble (règle de maçon)
• Contrôler les dimensions finales
• Effectuer les retouches si nécessaire

**Contrôle qualité :**
• Planéité : écart maximum 3mm sous règle de 1,5m
• Verticalité : contrôle au fil à plomb
• Alignement : vérification au cordeau
• Équerrage : contrôle des angles droits

**Bilan pédagogique :**
• Analyser les difficultés techniques rencontrées
• Évaluer la conformité par rapport au plan
• Documenter les solutions adoptées
• Préparer l'argumentation technique du projet`
                },
                { 
                    name: '� Procédure technique générale', 
                    content: `### 1. PHASE DE PRÉPARATION

**Analyse du projet pédagogique :**
• [Définir les objectifs d'apprentissage visés]
• [Identifier les compétences techniques à développer]
• [Préciser les contraintes de l'exercice d'atelier]

**Organisation de l'atelier :**
• [Préparer l'espace de travail et les outils nécessaires]
• [Organiser l'approvisionnement des matériaux]
• [Définir les consignes de sécurité en atelier]

**Préparation technique :**
• [Étudier les plans et documents techniques]
• [Calculer les quantités de matériaux nécessaires]
• [Prévoir les étapes de réalisation et les temps]

---

### 2. PHASE DE RÉALISATION

**Mise en œuvre pratique :**
• [Détailler chaque étape de construction en atelier]
• [Préciser les techniques spécifiques au contexte pédagogique]
• [Indiquer les points de contrôle et les tolérances d'atelier]

**Apprentissage par la pratique :**
• [Définir les gestes techniques à maîtriser]
• [Organiser les auto-contrôles et vérifications]
• [Prévoir les corrections et ajustements possibles]

**Suivi pédagogique :**
• [Documenter les étapes clés de la réalisation]
• [Noter les observations et difficultés rencontrées]
• [Adapter la méthode si nécessaire]

---

### 3. PHASE D'ÉVALUATION

**Contrôles techniques :**
• [Lister les vérifications à effectuer sur l'ouvrage]
• [Définir les critères de qualité attendus]
• [Mesurer les écarts par rapport aux objectifs]

**Bilan pédagogique :**
• [Analyser les compétences développées]
• [Identifier les points d'amélioration]
• [Évaluer la progression par rapport aux objectifs]

**Documentation du projet :**
• [Constituer le dossier technique de réalisation]
• [Préparer la présentation du travail effectué]
• [Archiver photos, mesures et observations]

**Perspectives :**
• [Identifier les prolongements possibles]
• [Proposer des variantes ou améliorations]
• [Préparer les projets suivants]`
                }
            ];
        } else if (this.elementId === 'procedureRecommendations') {
            // Modèles pour l'éditeur des recommandations
            templates = [
                {
                    name: '⚠️ Sécurité en atelier',
                    content: `### CONSIGNES DE SÉCURITÉ EN ATELIER

**Équipements de Protection Individuelle (EPI) :**
• Tablier ou vêtement de protection
• Chaussures fermées et antidérapantes
• Gants de protection pour la manipulation des matériaux
• Lunettes de protection si découpe nécessaire
• Cheveux longs attachés

**Organisation sécurisée de l'atelier :**
• Maintenir les allées de circulation libres
• Ranger les outils après utilisation
• Nettoyer immédiatement les éclaboussures au sol
• Vérifier l'éclairage du poste de travail
• Signaler tout matériel défaillant

**Manipulation des matériaux en atelier :**
• Soulever les charges en fléchissant les genoux
• Travailler à bonne hauteur pour éviter les maux de dos
• Organiser le stockage des matériaux près du poste
• Éviter l'encombrement du plan de travail
• Nettoyer les outils avant rangement`
                },
                {
                    name: '💡 Conseils pédagogiques',
                    content: `### RECOMMANDATIONS POUR L'ATELIER

**Préparation de la séance :**
• Vérifier la disponibilité de tous les matériaux nécessaires
• S'assurer de la propreté des outils d'atelier
• Préparer les supports de travail (plans, fiches techniques)
• Organiser l'espace selon le nombre d'apprenants

**Techniques d'atelier :**
• Adapter les dosages aux conditions d'atelier (petites quantités)
• Privilégier les techniques permettant les corrections
• Prévoir du temps pour les essais et ajustements
• Documenter les étapes par des photos

**Optimisation pédagogique :**
• Organiser le travail en binômes pour l'entraide
• Alterner démonstration et pratique individuelle
• Prévoir des temps d'observation et d'analyse
• Encourager l'auto-évaluation et la progression

**Valorisation des apprentissages :**
• Mettre en évidence les réussites et les progrès
• Analyser constructivement les difficultés rencontrées
• Établir des liens avec les situations professionnelles
• Constituer un portfolio des réalisations`
                },
                {
                    name: '📅 Organisation de séance',
                    content: `### PLANIFICATION DE LA SÉANCE D'ATELIER

**Préparation (30 min avant) :**
• Vérification et mise à disposition des matériaux
• Contrôle du bon fonctionnement des équipements
• Préparation des supports pédagogiques
• Organisation des postes de travail

**Déroulement de la séance :**
• **Phase 1 (15 min) :** Présentation des objectifs et démonstration
• **Phase 2 (60 min) :** Réalisation pratique par les apprenants
• **Phase 3 (15 min) :** Contrôles, bilan et nettoyage
• **Pauses :** Prévues toutes les 45 minutes

**Gestion des temps d'atelier :**
• Mortier : préparation par petites quantités (usage 1h max)
• Colle : application immédiate après étalement
• Ajustements : possibles dans les 10 premières minutes
• Nettoyage : au fur et à mesure de la réalisation

**Évaluation et suivi :**
• Observation continue des gestes techniques
• Auto-évaluation par rapport aux critères définis
• Documentation photographique des étapes
• Bilan individuel et collectif en fin de séance`
                }
            ];
        }

        templates.forEach(template => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'template-btn';
            button.textContent = template.name;
            button.title = `Insérer le modèle : ${template.name}`;
            
            button.addEventListener('click', () => {
                this.insertTemplate(template.content);
            });
            
            templateContainer.appendChild(button);
        });

        this.editorContainer.appendChild(templateContainer);
    }

    insertTemplate(content) {
        // Si l'éditeur est vide, remplacer le contenu
        if (this.editor.innerHTML === '' || this.editor.innerHTML === '<br>') {
            this.setContent(content);
        } else {
            // Sinon, ajouter à la fin
            const currentContent = this.getContent();
            this.setContent(currentContent + '\n\n' + content);
        }
        
        this.editor.focus();
        // Faire défiler vers le bas
        this.editor.scrollTop = this.editor.scrollHeight;
    }

    executeCommand(command, value = null) {
        document.execCommand(command, false, value);
        this.syncContent();
        this.updateToolbarState();
    }

    updateToolbarState() {
        const buttons = this.toolbar.querySelectorAll('button');
        const commands = ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList'];
        
        buttons.forEach((button, index) => {
            const command = commands[Math.floor(index / 2)]; // Approximation basée sur l'ordre
            if (command && document.queryCommandState(command)) {
                button.classList.add('active');
                button.style.background = '#dbeafe';
                button.style.borderColor = '#93c5fd';
                button.style.color = '#1d4ed8';
            } else {
                button.classList.remove('active');
                button.style.background = 'transparent';
                button.style.borderColor = 'transparent';
                button.style.color = '#374151';
            }
        });
    }

    syncContent() {
        const originalTextarea = document.getElementById(this.elementId);
        if (originalTextarea) {
            // Convertir le HTML en texte plus lisible
            let content = this.editor.innerHTML;
            
            // Remplacer les balises HTML par du markdown simple
            content = content
                .replace(/<div><br><\/div>/g, '\n')
                .replace(/<div>/g, '\n')
                .replace(/<\/div>/g, '')
                .replace(/<br>/g, '\n')
                .replace(/<h3>(.*?)<\/h3>/g, '\n### $1\n')
                .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
                .replace(/<b>(.*?)<\/b>/g, '**$1**')
                .replace(/<em>(.*?)<\/em>/g, '*$1*')
                .replace(/<i>(.*?)<\/i>/g, '*$1*')
                .replace(/<u>(.*?)<\/u>/g, '_$1_')
                .replace(/<li>(.*?)<\/li>/g, '• $1')
                .replace(/<\/?(ul|ol)>/g, '')
                .replace(/<p>(.*?)<\/p>/g, '$1\n')
                .replace(/<hr>/g, '\n---\n')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .trim();

            originalTextarea.value = content;
        }
    }

    // Méthode pour définir le contenu
    setContent(content) {
        if (this.editor) {
            // Convertir le markdown simple en HTML
            let htmlContent = content
                .replace(/### (.*?)$/gm, '<h3>$1</h3>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/_(.*?)_/g, '<u>$1</u>')
                .replace(/^• (.+)$/gm, '<li>$1</li>')
                .replace(/^---$/gm, '<hr>')
                .replace(/\n/g, '<br>');

            // Envelopper les listes
            htmlContent = htmlContent.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

            this.editor.innerHTML = htmlContent;
            this.syncContent();
        }
    }

    // Méthode pour récupérer le contenu
    getContent() {
        const originalTextarea = document.getElementById(this.elementId);
        return originalTextarea ? originalTextarea.value : '';
    }
}

// Initialiser l'éditeur automatiquement
document.addEventListener('DOMContentLoaded', () => {
    // Fonction pour initialiser les éditeurs de mode opératoire
    function initializeProcedureEditors() {
        // Éditeur principal pour le mode opératoire détaillé
        if (document.getElementById('detailedProcedure') && !window.detailedProcedureEditor) {
            window.detailedProcedureEditor = new RichTextEditor(
                'detailedProcedure',
                '📋 **MODE OPÉRATOIRE DÉTAILLÉ**\n\nRédigez ici toutes les étapes de construction :\n\n💡 **Conseils d\'utilisation :**\n• Utilisez les modèles prédéfinis comme base\n• Structurez avec des **titres** pour chaque phase\n• Détaillez les **procédures** avec des listes numérotées\n• Ajoutez des **points de contrôle qualité**\n• Précisez les **outils et matériaux** nécessaires'
            );
        }
        
        // Éditeur pour les recommandations
        if (document.getElementById('procedureRecommendations') && !window.recommendationsEditor) {
            window.recommendationsEditor = new RichTextEditor(
                'procedureRecommendations',
                '⚠️ **POINTS CLÉS & RECOMMANDATIONS**\n\nAjoutez ici :\n• Mesures de **sécurité** essentielles\n• **Bonnes pratiques** de construction\n• Points d\'**attention particulière**\n• **Astuces** de professionnels\n• **Temps de séchage** et délais'
            );
        }
    }

    // Initialiser immédiatement si les éléments existent
    initializeProcedureEditors();
    
    // Observer les changements d'onglets pour réinitialiser si nécessaire
    const observer = new MutationObserver(() => {
        initializeProcedureEditors();
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
});

// Export pour utilisation globale
window.RichTextEditor = RichTextEditor;
