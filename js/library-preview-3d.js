/**
 * Gestionnaire d    init() {
        // console.log('🎨 Initialisation du système d\'aperçu 3D de la bibliothèque');
        
        // Vérifier si THREE.js est disponible
        
        // Créer une seule instance de Three.js réutil            // Blanc pour PSE
            material.color = new THREE.Color(0xffffff);
            material.emissive = new THREE.Color(0x151515);
            material.shininess = 60;
            material.reflectivity = 0.1;
            // console.log(`🔧 Aperçu isolant ${type} : couleur blanche PSE`);us 3D pour la bibliothèque d'éléments
 * Utilise Three.js pour créer des aperçus statiques et dynamiques
 * Solution optimisée pour éviter de dépasser les quotas WebGL
 */

class LibraryPreview3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.currentMesh = null;
        this.activeCanvas = null;
        this.animationId = null;
        this.rotationSpeed = 0.005;
        this.hoverTimeout = null;
        this.staticPreviewCache = new Map();
        
        this.init();
        this.bindEvents();
    }

    init() {
        // console.log('🎨 Initialisation du système d'aperçu 3D de la bibliothèque');
        
        // Vérifier si THREE.js est disponible
        
        // Créer une seule instance de Three.js réutilisable
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        
        // Créer un renderer off-screen pour générer les textures
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            preserveDrawingBuffer: true
        });
    this.renderer.setSize(320, 240); // Taille augmentée pour des aperçus plus nets (160x120 * 2)
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Mettre à jour l'aspect caméra pour remplir au mieux le cadre de rendu
    this.camera.aspect = this.renderer.domElement.width / this.renderer.domElement.height;
    this.camera.updateProjectionMatrix();
        
        // Configuration de l'éclairage
        this.setupLighting();
        
        // Position de la caméra
        this.camera.position.set(4, 4, 6);
        this.camera.lookAt(0, 0, 0);
        
        // Générer tous les aperçus statiques
        this.generateStaticPreviews();
    }

    setupLighting() {
        // Lumière ambiante renforcée pour les couleurs claires
        const ambientLight = new THREE.AmbientLight(0x606060, 0.8); // Plus forte pour les beiges
        this.scene.add(ambientLight);
        
        // Lumière directionnelle principale
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Plus intense
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);
        
        // Lumière de remplissage renforcée
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.5); // Plus forte
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);
    }

    createBrickGeometry(type, cut = '1/1') {
        // Beam profiles procedural path
        if (window.BeamProfiles && window.BeamProfiles.isBeamType(type)) {
            const group = window.BeamProfiles.createBeamGroup(type, 10 /* dm */);
            if (group) {
                // Désactiver les ombres spécifiquement pour l'aperçu des poutres
                group.traverse(obj => {
                    if (obj.isMesh) {
                        obj.castShadow = false;
                        obj.receiveShadow = false;
                    }
                });
                return group;
            }
        }
        const brickConfigs = {
            // Briques (dimensions en dm : longueur x épaisseur x hauteur)
            'M50': { size: [1.9, 0.5, 0.9], color: 0xcc6633 },
            'M57': { size: [1.9, 0.57, 0.9], color: 0xbb5522 },
            'M60': { size: [1.9, 0.6, 0.9], color: 0xdd7744 },
            'M65': { size: [1.9, 0.65, 0.9], color: 0xaa4411 },
            'M90': { size: [1.9, 0.9, 0.9], color: 0xee8855 },
            'M50_CHANT': { size: [0.5, 1.9, 0.9], color: 0xcc6633 }, // M50 sur chant : 5x19x9 cm
            
            // Blocs creux (X=longueur, Y=hauteur, Z=épaisseur)
            'B9': { size: [3.9, 1.9, 0.9], color: 0x888888 },
            'B14': { size: [3.9, 1.9, 1.4], color: 0x999999 },
            'B19': { size: [3.9, 1.9, 1.9], color: 0x777777 },
            'B29': { size: [3.9, 1.9, 2.9], color: 0x666666 },
            
            // Béton cellulaire (X=longueur, Y=hauteur, Z=épaisseur)
            'BC_60x5': { size: [6.0, 2.5, 0.5], color: 0xcccccc },
            'BC_60x7': { size: [6.0, 2.5, 0.7], color: 0xcccccc },
            'BC_60x10': { size: [6.0, 2.5, 1.0], color: 0xcccccc },
            'BC_60x15': { size: [6.0, 2.5, 1.5], color: 0xcccccc },
            'BC_60x17': { size: [6.0, 2.5, 1.75], color: 0xcccccc },
            'BC_60x20': { size: [6.0, 2.5, 2.0], color: 0xcccccc },
            'BC_60x24': { size: [6.0, 2.5, 2.4], color: 0xcccccc },
            'BC_60x30': { size: [6.0, 2.5, 3.0], color: 0xcccccc },
            'BC_60x36': { size: [6.0, 2.5, 3.6], color: 0xcccccc },
            
            // Argex (X=longueur, Y=hauteur, Z=épaisseur)
            'ARGEX_39x9': { size: [3.9, 1.9, 0.9], color: 0xddeeff },
            'ARGEX_39x14': { size: [3.9, 1.9, 1.4], color: 0xddeeff },
            'ARGEX_39x19': { size: [3.9, 1.9, 1.9], color: 0xddeeff },
            
            // BCA (X=longueur, Y=hauteur, Z=épaisseur)
            'BCA_60x9x20': { size: [6.0, 2.0, 0.9], color: 0xf0f0f0 },
            'BCA_60x14x20': { size: [6.0, 2.0, 1.4], color: 0xf0f0f0 },
            'BCA_60x19x20': { size: [6.0, 2.0, 1.9], color: 0xf0f0f0 },
            'BCA_60x9x25': { size: [6.0, 2.5, 0.9], color: 0xf0f0f0 },
            'BCA_60x14x25': { size: [6.0, 2.5, 1.4], color: 0xf0f0f0 },
            'BCA_60x19x25': { size: [6.0, 2.5, 1.9], color: 0xf0f0f0 },
            
            // TC (Terre Cuite)
            'TC_50x10': { size: [5.0, 1.0, 2.5], color: 0xcc4422 },
            'TC_50x14': { size: [5.0, 1.4, 2.5], color: 0xcc4422 },
            'TC_50x19': { size: [5.0, 1.9, 2.5], color: 0xcc4422 },
            
            // Isolants (panneaux : X=120cm, Y=60cm, Z=épaisseur 5-7cm)
            'PUR5': { size: [12.0, 6.0, 0.05], color: 0xf0ebe2 },  // Beige très clair - couleur souhaitée
            'PUR6': { size: [12.0, 6.0, 0.06], color: 0xf0ebe2 },  // Beige très clair - couleur souhaitée
            'PUR7': { size: [12.0, 6.0, 0.07], color: 0xf0ebe2 },  // Beige très clair - couleur souhaitée
            'LAINEROCHE5': { size: [12.0, 6.0, 0.05], color: 0xf0ebe2 }, // Beige très clair - couleur souhaitée
            'LAINEROCHE6': { size: [12.0, 6.0, 0.06], color: 0xf0ebe2 }, // Beige très clair - couleur souhaitée
            
            // Panneaux XPS (Polystyrène Extrudé) - pour zones humides : X=125cm, Y=60cm, Z=épaisseur variable
            'XPS20': { size: [12.5, 6.0, 0.02], color: 0xe6f3ff },  // Bleu très clair - couleur XPS
            'XPS30': { size: [12.5, 6.0, 0.03], color: 0xe6f3ff },  // Bleu très clair - couleur XPS
            'XPS40': { size: [12.5, 6.0, 0.04], color: 0xe6f3ff },  // Bleu très clair - couleur XPS
            'XPS50': { size: [12.5, 6.0, 0.05], color: 0xe6f3ff },  // Bleu très clair - couleur XPS
            'XPS60': { size: [12.5, 6.0, 0.06], color: 0xe6f3ff },  // Bleu très clair - couleur XPS
            'XPS80': { size: [12.5, 6.0, 0.08], color: 0xe6f3ff },  // Bleu très clair - couleur XPS
            'XPS100': { size: [12.5, 6.0, 0.10], color: 0xe6f3ff }, // Bleu très clair - couleur XPS
            
            // Panneaux PSE (Polystyrène Expansé) - solution économique : X=100cm, Y=50cm, Z=épaisseur variable
            'PSE20': { size: [10.0, 5.0, 0.02], color: 0xffffff },   // Blanc - couleur PSE
            'PSE30': { size: [10.0, 5.0, 0.03], color: 0xffffff },   // Blanc - couleur PSE
            'PSE40': { size: [10.0, 5.0, 0.04], color: 0xffffff },   // Blanc - couleur PSE
            'PSE50': { size: [10.0, 5.0, 0.05], color: 0xffffff },   // Blanc - couleur PSE
            'PSE60': { size: [10.0, 5.0, 0.06], color: 0xffffff },   // Blanc - couleur PSE
            'PSE80': { size: [10.0, 5.0, 0.08], color: 0xffffff },   // Blanc - couleur PSE
            'PSE100': { size: [10.0, 5.0, 0.10], color: 0xffffff },  // Blanc - couleur PSE
            'PSE120': { size: [10.0, 5.0, 0.12], color: 0xffffff },  // Blanc - couleur PSE
            'PSE140': { size: [10.0, 5.0, 0.14], color: 0xffffff },  // Blanc - couleur PSE
            'PSE160': { size: [10.0, 5.0, 0.16], color: 0xffffff },  // Blanc - couleur PSE
            'PSE200': { size: [10.0, 5.0, 0.20], color: 0xffffff },  // Blanc - couleur PSE
            'PSE300': { size: [10.0, 5.0, 0.30], color: 0xffffff },  // Blanc - couleur PSE
            
            // Panneaux Fibre de Bois - choix écologique : X=135cm, Y=57.5cm, Z=épaisseur variable
            'FB40': { size: [13.5, 5.75, 0.04], color: 0xd2b48c },   // Beige boisé - couleur fibre
            'FB60': { size: [13.5, 5.75, 0.06], color: 0xd2b48c },   // Beige boisé - couleur fibre
            'FB80': { size: [13.5, 5.75, 0.08], color: 0xd2b48c },   // Beige boisé - couleur fibre
            'FB100': { size: [13.5, 5.75, 0.10], color: 0xd2b48c },  // Beige boisé - couleur fibre
            'FB120': { size: [13.5, 5.75, 0.12], color: 0xd2b48c },  // Beige boisé - couleur fibre
            'FB140': { size: [13.5, 5.75, 0.14], color: 0xd2b48c },  // Beige boisé - couleur fibre
            'FB160': { size: [13.5, 5.75, 0.16], color: 0xd2b48c },  // Beige boisé - couleur fibre
            
            // Laine de Verre (panneaux) - grand classique : X=60cm, Y=120cm, Z=épaisseur variable
            'LV60': { size: [6.0, 12.0, 0.06], color: 0xfffacd },    // Jaune pâle - couleur laine verre
            'LV80': { size: [6.0, 12.0, 0.08], color: 0xfffacd },    // Jaune pâle - couleur laine verre
            'LV100': { size: [6.0, 12.0, 0.10], color: 0xfffacd },   // Jaune pâle - couleur laine verre
            'LV120': { size: [6.0, 12.0, 0.12], color: 0xfffacd },   // Jaune pâle - couleur laine verre
            'LV140': { size: [6.0, 12.0, 0.14], color: 0xfffacd },   // Jaune pâle - couleur laine verre
            'LV160': { size: [6.0, 12.0, 0.16], color: 0xfffacd },   // Jaune pâle - couleur laine verre
            'LV180': { size: [6.0, 12.0, 0.18], color: 0xfffacd },   // Jaune pâle - couleur laine verre
            'LV200': { size: [6.0, 12.0, 0.20], color: 0xfffacd },   // Jaune pâle - couleur laine verre
            'LV220': { size: [6.0, 12.0, 0.22], color: 0xfffacd },   // Jaune pâle - couleur laine verre
            
            // Laine de Roche Moderne (panneaux) - performances acoustiques : X=100cm, Y=60cm, Z=épaisseur variable
            'LRM50': { size: [10.0, 6.0, 0.05], color: 0xf5deb3 },   // Beige - couleur laine roche moderne
            'LRM60': { size: [10.0, 6.0, 0.06], color: 0xf5deb3 },   // Beige - couleur laine roche moderne
            'LRM80': { size: [10.0, 6.0, 0.08], color: 0xf5deb3 },   // Beige - couleur laine roche moderne
            'LRM100': { size: [10.0, 6.0, 0.10], color: 0xf5deb3 },  // Beige - couleur laine roche moderne
            'LRM120': { size: [10.0, 6.0, 0.12], color: 0xf5deb3 },  // Beige - couleur laine roche moderne
            'LRM140': { size: [10.0, 6.0, 0.14], color: 0xf5deb3 },  // Beige - couleur laine roche moderne
            'LRM160': { size: [10.0, 6.0, 0.16], color: 0xf5deb3 },  // Beige - couleur laine roche moderne
            'LRM180': { size: [10.0, 6.0, 0.18], color: 0xf5deb3 },  // Beige - couleur laine roche moderne
            'LRM200': { size: [10.0, 6.0, 0.20], color: 0xf5deb3 },  // Beige - couleur laine roche moderne
            
            // Linteaux (éléments horizontaux longs)
            'L120': { size: [12.0, 1.0, 2.5], color: 0x555555 },
            'L140': { size: [14.0, 1.0, 2.5], color: 0x555555 },
            'L160': { size: [16.0, 1.0, 2.5], color: 0x555555 },
            'L180': { size: [18.0, 1.0, 2.5], color: 0x555555 }
        };

        const config = brickConfigs[type] || brickConfigs['M50'];
        let [width, height, depth] = config.size;

        // Appliquer la coupe (uniquement pour les éléments de construction, pas les isolants et linteaux)
        if (!type.startsWith('PUR') && !type.startsWith('LAINEROCHE') && !type.startsWith('L')) {
            if (cut === '3/4') width *= 0.75;
            else if (cut === '1/2') width *= 0.5;
            else if (cut === '1/4') width *= 0.25;
            else if (cut === 'P') width *= 0.1; // Petit bout
        }

        // Créer la géométrie
        const geometry = new THREE.BoxGeometry(width, height, depth);
        
        // Matériau principal avec couleur unie pour des aperçus nets
        const material = new THREE.MeshPhongMaterial({
            color: config.color,
            shininess: 30,
            // CORRECTION: Les panneaux d'isolation doivent être opaques dans la bibliothèque 3D
            transparent: false,
            opacity: 1.0,
            // CORRECTION: Forcer l'opacité pour les isolants
            alphaTest: 0,  // Pas de test alpha pour éviter la transparence
            side: THREE.DoubleSide,  // Assure que les deux faces sont visibles
            depthWrite: true,  // Assure l'écriture dans le buffer de profondeur
            depthTest: true   // Assure le test de profondeur
        });
        
        // CORRECTION SPÉCIALE: Pour les isolants, améliorer la visibilité avec couleurs appropriées
        if (type.startsWith('PUR') || type.startsWith('LAINEROCHE')) {
            // Garder la couleur souhaitée #f0ebe2 pour PUR et LAINEROCHE
            material.color = new THREE.Color(0xf0ebe2);
            
            // AMÉLIORER LA VISIBILITÉ par d'autres moyens :
            material.emissive = new THREE.Color(0x1a1815); // Légère émission pour faire ressortir
            material.shininess = 50; // Plus de brillance pour accrocher la lumière
            material.transparent = false; // Absolument pas transparent
            material.opacity = 1.0; // Opacité complète
            material.alphaTest = 0; // Pas de test alpha
            material.depthWrite = true;
            material.depthTest = true;
            
            // Ajouter un effet de contraste par l'éclairage
            material.reflectivity = 0.3; // Réflectivité pour plus de contraste
            
            // console.log(`🔧 Aperçu isolant ${type} : couleur #f0ebe2 avec visibilité améliorée`);
        }
        
        // Nouveaux isolants avec couleurs spécifiques
        if (type.startsWith('XPS')) {
            // Bleu très clair pour XPS
            material.color = new THREE.Color(0xe6f3ff);
            material.emissive = new THREE.Color(0x0a1520);
            material.shininess = 40;
            material.reflectivity = 0.2;
            // console.log(`🔧 Aperçu isolant ${type} : couleur bleu XPS`);
        } else if (type.startsWith('PSE')) {
            // Blanc pour PSE
            material.color = new THREE.Color(0xffffff);
            material.emissive = new THREE.Color(0x151515);
            material.shininess = 30;
            material.reflectivity = 0.4;
            // console.log(`🔧 Aperçu isolant ${type} : couleur blanche PSE`);
        } else if (type.startsWith('FB')) {
            // Beige boisé pour Fibre de Bois
            material.color = new THREE.Color(0xd2b48c);
            material.emissive = new THREE.Color(0x201a15);
            material.shininess = 25;
            material.reflectivity = 0.15;
            // console.log(`🔧 Aperçu isolant ${type} : couleur beige fibre bois`);
        } else if (type.startsWith('LV')) {
            // Jaune pour Laine de Verre
            material.color = new THREE.Color(0xffff99);
            material.emissive = new THREE.Color(0x202015);
            material.shininess = 35;
            material.reflectivity = 0.25;
            // console.log(`🔧 Aperçu isolant ${type} : couleur jaune laine verre`);
        } else if (type.startsWith('LRM')) {
            // Brun pour Laine de Roche Moderne
            material.color = new THREE.Color(0xa0522d);
            material.emissive = new THREE.Color(0x151005);
            material.shininess = 30;
            material.reflectivity = 0.2;
            // console.log(`🔧 Aperçu isolant ${type} : couleur brune laine roche`);
        }

        // Appliquer les paramètres communs à tous les isolants
        if (type.startsWith('PUR') || type.startsWith('LAINEROCHE') || 
            type.startsWith('XPS') || type.startsWith('PSE') || 
            type.startsWith('FB') || type.startsWith('LV') || type.startsWith('LRM')) {
            material.transparent = false;
            material.opacity = 1.0;
            material.alphaTest = 0;
            material.depthWrite = true;
            material.depthTest = true;
        }

    const mesh = new THREE.Mesh(geometry, material);
        // Par défaut activer les ombres
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Désactiver les ombres pour les isolants dans l'aperçu (demande utilisateur)
        if (type.startsWith('PUR') || type.startsWith('LAINEROCHE') || type.startsWith('XPS') ||
            type.startsWith('PSE') || type.startsWith('FB') || type.startsWith('LV') || type.startsWith('LRM')) {
            mesh.castShadow = false;
            mesh.receiveShadow = false;
        }

        // Ajouter des contours pour plus de clarté
        const edges = new THREE.EdgesGeometry(geometry);
        
        // CORRECTION: Contours plus épais et plus visibles pour les isolants
        let lineColor = 0x000000;
        let lineWidth = 2;
        
        if (type.startsWith('PUR') || type.startsWith('LAINEROCHE')) {
            lineColor = 0x2F2F2F; // Bordure gris foncé pour contraste avec le beige
            lineWidth = 3; // Épais pour bien délimiter
            // console.log(`🔧 Aperçu isolant ${type} : bordure gris foncé pour contraste`);
        } else if (type.startsWith('XPS')) {
            lineColor = 0x1a4d6b; // Bordure bleu foncé pour XPS
            lineWidth = 3;
            // console.log(`🔧 Aperçu isolant ${type} : bordure bleu foncé XPS`);
        } else if (type.startsWith('PSE')) {
            lineColor = 0x666666; // Bordure grise pour PSE blanc
            lineWidth = 3;
            // console.log(`🔧 Aperçu isolant ${type} : bordure grise PSE`);
        } else if (type.startsWith('FB')) {
            lineColor = 0x8B4513; // Bordure marron pour fibre bois
            lineWidth = 3;
            // console.log(`🔧 Aperçu isolant ${type} : bordure marron fibre bois`);
        } else if (type.startsWith('LV')) {
            lineColor = 0xb8860b; // Bordure dorée pour laine verre
            lineWidth = 3;
            // console.log(`🔧 Aperçu isolant ${type} : bordure dorée laine verre`);
        } else if (type.startsWith('LRM')) {
            lineColor = 0x654321; // Bordure marron foncé pour laine roche
            lineWidth = 3;
            // console.log(`🔧 Aperçu isolant ${type} : bordure marron foncé laine roche`);
        }
        
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: lineColor,
            linewidth: lineWidth,
            transparent: false,
            opacity: 1.0
        });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        
        // Créer un groupe pour contenir le mesh et les contours
        const group = new THREE.Group();
        group.add(mesh);
        group.add(wireframe);

        return group;
    }

    generateStaticPreviews() {
        // console.log('📸 Génération des aperçus statiques...');
        
    const itemTypes = [
            // Briques 
            'M50', 'M57', 'M60', 'M65', 'M90', 'M50_CHANT', 'M50_CHANT',
            // Blocs creux
            'B9', 'B14', 'B19', 'B29',
            // Béton cellulaire
            'BC_60x5', 'BC_60x7', 'BC_60x10', 'BC_60x15', 'BC_60x17', 
            'BC_60x20', 'BC_60x24', 'BC_60x30', 'BC_60x36',
            // Argex
            'ARGEX_39x9', 'ARGEX_39x14', 'ARGEX_39x19',
            // BCA
            'BCA_60x9x20', 'BCA_60x14x20', 'BCA_60x19x20', 
            'BCA_60x9x25', 'BCA_60x14x25', 'BCA_60x19x25',
            // TC
            'TC_50x10', 'TC_50x14', 'TC_50x19',
            // Isolants
            'PUR5', 'PUR6', 'PUR7', 'LAINEROCHE5', 'LAINEROCHE6',
            // Nouveaux isolants XPS - Zones humides
            'XPS20', 'XPS30', 'XPS40', 'XPS50', 'XPS60', 'XPS80', 'XPS100',
            // PSE - Économiques
            'PSE20', 'PSE30', 'PSE40', 'PSE50', 'PSE60', 'PSE80', 'PSE100', 
            'PSE120', 'PSE140', 'PSE160', 'PSE200', 'PSE300',
            // Fibre de Bois - Écologiques
            'FB40', 'FB60', 'FB80', 'FB100', 'FB120', 'FB140', 'FB160',
            // Laine de Verre - Classique
            'LV60', 'LV80', 'LV100', 'LV120', 'LV140', 'LV160', 'LV180', 'LV200', 'LV220',
            // Laine de Roche Moderne - Acoustique
            'LRM50', 'LRM60', 'LRM80', 'LRM100', 'LRM120', 'LRM140', 'LRM160', 'LRM180', 'LRM200',
            // Linteaux
            'L120', 'L140', 'L160', 'L180',
            // Poutres acier (procédural)
            ...(window.BeamProfiles ? window.BeamProfiles.listAllTypes() : [])
        ];

        itemTypes.forEach(type => {
            // Aperçu principal (1/1)
            this.generateStaticPreview(type, '1/1');
            
            // Aperçus des coupes (pas pour tous les types)
            if (!type.startsWith('PUR') && !type.startsWith('LAINEROCHE') && !type.startsWith('L')) {
                ['3/4', '1/2', '1/4', 'P'].forEach(cut => {
                    this.generateStaticPreview(type, cut);
                });
            }
        });
        
        // Appliquer les aperçus aux éléments DOM
        setTimeout(() => this.applyStaticPreviews(), 100);
    }

    generateStaticPreview(type, cut) {
        const cacheKey = `${type}_${cut}`;
        
        // Nettoyer la scène
        if (this.currentMesh) {
            this.scene.remove(this.currentMesh);
            // Disposer des ressources du groupe
            if (this.currentMesh.children) {
                this.currentMesh.children.forEach(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
            }
        }
        
        // Créer le mesh (maintenant un groupe avec contours)
        this.currentMesh = this.createBrickGeometry(type, cut);
        this.scene.add(this.currentMesh);
        
        // Centrer et ajuster la vue
        this.adjustCameraForObject(this.currentMesh);
        
        // Rendre et capturer
        this.renderer.render(this.scene, this.camera);
        
        // Convertir en image data URL
        const imageDataUrl = this.renderer.domElement.toDataURL();
        this.staticPreviewCache.set(cacheKey, imageDataUrl);
        
        // console.log(`✅ Aperçu généré pour ${cacheKey}`);
    }

    adjustCameraForObject(mesh) {
        // Calcul de la boîte englobante et de son centre
        const box = new THREE.Box3().setFromObject(mesh);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Adapter l'aspect si le renderer a changé
        const aspect = this.renderer.domElement.width / this.renderer.domElement.height;
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();

        // Calculer la distance requise pour que l'objet remplisse bien le cadre
        const fov = this.camera.fov * (Math.PI / 180);
        const fitHeightDistance = (size.y / 2) / Math.tan(fov / 2);
        const fitWidthDistance = ((size.x / 2) / Math.tan(fov / 2)) / aspect;
        // Choisir la plus grande pour s'assurer que tout rentre
        let distance = Math.max(fitHeightDistance, fitWidthDistance);
        // Marge légère pour éviter le clipping tout en remplissant plus l'aperçu
        const fitOffset = 1.05; // plus proche que l'ancien 2.5×, objet visuellement plus grand
        distance *= fitOffset;

        // Positionner la caméra (diagonale pour une perspective agréable)
        this.camera.position.set(center.x + distance * 0.8, center.y + distance * 0.6, center.z + distance);
        this.camera.lookAt(center);

        // Ajuster les plans near/far pour éviter les problèmes de clipping
        this.camera.near = Math.max(0.1, distance / 100);
        this.camera.far = distance * 100;
        this.camera.updateProjectionMatrix();
    }

    applyStaticPreviews() {
        // console.log('🖼️ Application des aperçus statiques aux éléments DOM...');
        // console.log(`📊 Cache contient ${this.staticPreviewCache.size} aperçus:`, Array.from(this.staticPreviewCache.keys()));
        
        // Appliquer aux canvas existants
        document.querySelectorAll('.preview-3d').forEach(canvas => {
            const brickType = canvas.getAttribute('data-brick-type');
            if (brickType) {
                this.applyPreviewToCanvas(canvas, brickType, '1/1');
            }
        });

        // Appliquer aux éléments sans canvas (créer des images)
        document.querySelectorAll('.library-item').forEach(item => {
            const type = item.getAttribute('data-type');
            // Exclure diba des aperçus automatiques (icône statique suffisante)
            if (type === 'diba') return;
            
            // Traitement spécial pour les éléments GLB
            if (item.hasAttribute('data-glb-path') ||
                item.querySelector('canvas[data-glb-path]')) {
                this.createGLBPreview(item);
                return;
            }
            
            if (type && !item.querySelector('.preview-3d') && !item.querySelector('.item-preview-3d')) {
                // console.log(`🔍 Traitement élément sans aperçu: ${type}`);
                this.createPreviewElement(item, type);
            }
        });

    // Normaliser les tailles pour éviter les styles inline réducteurs
    this.normalizePreviewCanvasSizing();
    }

    applyPreviewToCanvas(canvas, type, cut = '1/1') {
        const cacheKey = `${type}_${cut}`;
        const imageDataUrl = this.staticPreviewCache.get(cacheKey);
        
        if (imageDataUrl) {
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            
            img.src = imageDataUrl;
        }
    }

    createPreviewElement(libraryItem, type) {
        // Remplacer l'icône existante par un aperçu 3D
        const existingIcon = libraryItem.querySelector('.item-icon');
        // console.log(`🔍 createPreviewElement pour ${type}, icône trouvée:`, !!existingIcon);
        
        if (existingIcon) {
            const previewContainer = document.createElement('div');
            previewContainer.className = 'item-preview-3d';
            
            const img = document.createElement('img');
            img.className = 'preview-3d-static';
            // Laisser le CSS gérer la taille (100% du conteneur)
            img.style.transition = 'transform 0.3s ease';
            
            const cacheKey = `${type}_1/1`;
            const imageDataUrl = this.staticPreviewCache.get(cacheKey);
            
            // console.log(`🔍 Cache key: ${cacheKey}, URL trouvée:`, !!imageDataUrl);
            
            if (imageDataUrl) {
                img.src = imageDataUrl;
                // img.onload = () => console.log(`🖼️ Image chargée pour ${type}`);
                // img.onerror = () => console.error(`❌ Erreur chargement image pour ${type}`);
            } else {
                // Fallback avec une couleur unie pour chargement
                img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iOTAiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSI2MCIgeT0iNDUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjYiPkNoYXJnZW1lbnQuLi48L3RleHQ+PC9zdmc+';
                console.warn(`⚠️ Pas d'aperçu dans le cache pour ${cacheKey}, utilisation fallback`);
            }
            
            previewContainer.appendChild(img);
            existingIcon.replaceWith(previewContainer);
            
            // console.log(`🔄 Aperçu 3D appliqué pour ${type}`);
        } else {
            console.warn(`⚠️ Aucune icône trouvée pour ${type}`);
        }
    }

    // Supprime/neutralise les styles inline qui forcent 70x50 et empêchent l'uniformisation
    normalizePreviewCanvasSizing() {
        const selectors = '#tab-content-biblio .library-item .preview-3d, #tab-content-biblio .library-item .preview-3d-static';
        document.querySelectorAll(selectors).forEach(el => {
            // Retirer width/height inline si présents
            if (el.style && (el.style.width || el.style.height)) {
                // Certains éléments ont width:70px; height:50px avec !important → retirer d'abord
                el.style.removeProperty('width');
                el.style.removeProperty('height');
            }
            // S'assurer qu'aucun attribut style global ne garde ces valeurs
            const raw = el.getAttribute('style') || '';
            if (/width:\s*70px/i.test(raw) || /height:\s*50px/i.test(raw)) {
                // Réécrire le style sans ces propriétés
                const cleaned = raw
                    .replace(/width:\s*70px\s*!important;?/ig, '')
                    .replace(/height:\s*50px\s*!important;?/ig, '')
                    .trim();
                if (cleaned) el.setAttribute('style', cleaned); else el.removeAttribute('style');
            }
        });
    }

    bindEvents() {
        // console.log('🎯 Configuration des événements pour les aperçus dynamiques...');
        
        // Délégation d'événements pour les éléments de bibliothèque
        document.addEventListener('mouseenter', (e) => {
            if (e.target && typeof e.target.closest === 'function') {
                // Vérifier si c'est un bouton de coupe (priorité plus élevée)
                if (e.target.classList && e.target.classList.contains('cut-btn-mini')) {
                    return; // Les boutons de coupe sont gérés séparément
                }
                
                const libraryItem = e.target.closest('.library-item');
                if (libraryItem) {
                    // Vérifier que le survol n'est pas sur un bouton de coupe
                    const isOnCutButton = e.target.closest('.cut-btn-mini');
                    if (!isOnCutButton) {
                        this.startDynamicPreview(libraryItem);
                    }
                }
            }
        }, true);

        document.addEventListener('mouseleave', (e) => {
            if (e.target && typeof e.target.closest === 'function') {
                // Vérifier si c'est un bouton de coupe
                if (e.target.classList && e.target.classList.contains('cut-btn-mini')) {
                    return; // Les boutons de coupe sont gérés séparément
                }
                
                const libraryItem = e.target.closest('.library-item');
                if (libraryItem) {
                    // Vérifier que le survol ne va pas vers un bouton de coupe
                    const isGoingToCutButton = e.relatedTarget && e.relatedTarget.closest('.cut-btn-mini');
                    if (!isGoingToCutButton) {
                        this.stopDynamicPreview();
                    }
                }
            }
        }, true);

        // Événements pour les boutons de coupe
        document.addEventListener('mouseenter', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('cut-btn-mini')) {
                const libraryItem = e.target.closest('.library-item');
                const cut = e.target.getAttribute('data-cut');
                const baseType = e.target.getAttribute('data-base-type');
                
                if (libraryItem && cut && baseType) {
                    // Arrêter tout aperçu en cours
                    this.stopDynamicPreview();
                    // Lancer l'aperçu dynamique avec la coupe
                    this.hoverTimeout = setTimeout(() => {
                        this.activateDynamicPreview(libraryItem, baseType, cut);
                    }, 200); // Délai plus court pour les boutons de coupe
                }
            }
        }, true);

        document.addEventListener('mouseleave', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('cut-btn-mini')) {
                const libraryItem = e.target.closest('.library-item');
                const baseType = e.target.getAttribute('data-base-type');
                
                if (libraryItem && baseType) {
                    // Arrêter l'aperçu dynamique et revenir à l'aperçu statique 1/1
                    this.stopDynamicPreview();
                    this.showCutPreview(libraryItem, baseType, '1/1');
                }
            }
        }, true);
    }

    startDynamicPreview(libraryItem) {
        // Ignorer les éléments GLB qui ont leur propre système d'aperçu
        if (libraryItem.hasAttribute('data-glb-path') || 
            libraryItem.querySelector('canvas[data-glb-path]')) {
            return;
        }
        
        // Attendre un peu avant de démarrer l'animation pour éviter les survols accidentels
        this.hoverTimeout = setTimeout(() => {
            const type = libraryItem.getAttribute('data-type');
            if (type) {
                this.activateDynamicPreview(libraryItem, type);
            }
        }, 500);
    }

    stopDynamicPreview() {
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
        }
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.activeCanvas = null;
    }

    activateDynamicPreview(libraryItem, type, cut = '1/1') {
        // console.log(`🎬 Activation de l'aperçu dynamique pour ${type} (coupe: ${cut})`);
        
        // Trouver l'élément d'aperçu
        let previewElement = libraryItem.querySelector('.preview-3d');
        if (!previewElement) {
            previewElement = libraryItem.querySelector('.preview-3d-static');
        }
        
        if (!previewElement) return;
        
        this.activeCanvas = previewElement;
        
        // Nettoyer la scène précédente
        if (this.currentMesh) {
            this.scene.remove(this.currentMesh);
            // Disposer des ressources du groupe
            if (this.currentMesh.children) {
                this.currentMesh.children.forEach(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
            }
        }
        
        // Créer le nouveau mesh avec la coupe spécifiée
        this.currentMesh = this.createBrickGeometry(type, cut);
        this.scene.add(this.currentMesh);
        this.adjustCameraForObject(this.currentMesh);
        
        // Démarrer l'animation de rotation
        this.isActive = true;
        this.animatePreview();
    }
    
    stopAnimation() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    animatePreview() {
        if (!this.activeCanvas || !this.currentMesh) return;
        
        // Rotation continue
        this.currentMesh.rotation.y += this.rotationSpeed;
        this.currentMesh.rotation.x += this.rotationSpeed * 0.3;
        
        // Rendre la scène
        this.renderer.render(this.scene, this.camera);
        
        // Appliquer au canvas ou image (seulement si ce n'est pas un canvas GLB)
        if (this.activeCanvas.tagName === 'CANVAS' && !this.activeCanvas.hasAttribute('data-glb-path')) {
            const ctx = this.activeCanvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, this.activeCanvas.width, this.activeCanvas.height);
                ctx.drawImage(this.renderer.domElement, 0, 0, this.activeCanvas.width, this.activeCanvas.height);
            }
        } else if (this.activeCanvas.tagName === 'IMG') {
            this.activeCanvas.src = this.renderer.domElement.toDataURL();
        }
        
        // Continuer l'animation seulement si nécessaire
        if (this.isActive && this.renderer && this.scene) {
            this.animationId = requestAnimationFrame(() => this.animatePreview());
        } else {
            this.animationId = null; // Arrêter la boucle si plus nécessaire
        }
    }

    showCutPreview(libraryItem, type, cut) {
        const previewElement = libraryItem.querySelector('.preview-3d, .preview-3d-static');
        if (!previewElement) return;
        
        const cacheKey = `${type}_${cut}`;
        const imageDataUrl = this.staticPreviewCache.get(cacheKey);
        
        if (imageDataUrl) {
            if (previewElement.tagName === 'CANVAS') {
                const ctx = previewElement.getContext('2d');
                const img = new Image();
                
                img.onload = () => {
                    ctx.clearRect(0, 0, previewElement.width, previewElement.height);
                    ctx.drawImage(img, 0, 0, previewElement.width, previewElement.height);
                };
                
                img.src = imageDataUrl;
            } else if (previewElement.tagName === 'IMG') {
                previewElement.src = imageDataUrl;
            }
        }
    }

    // Méthode de nettoyage pour éviter les fuites mémoire
    destroy() {
        // console.log('🧹 Nettoyage du système d\'aperçu 3D...');
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
        }
        
        if (this.currentMesh) {
            this.scene.remove(this.currentMesh);
            // Disposer des ressources du groupe
            if (this.currentMesh.children) {
                this.currentMesh.children.forEach(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
            }
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        this.staticPreviewCache.clear();
    }

    // Méthode pour vider le cache et forcer la régénération
    clearCache() {
        // console.log('🗑️ Vidage du cache des aperçus 3D...');
        this.staticPreviewCache.clear();
        // console.log('✅ Cache vidé - les aperçus seront régénérés');
    }

    // Nouvelle méthode pour créer un aperçu 3D des modèles GLB
    createGLBPreview(item) {
        const canvas = item.querySelector('.preview-3d[data-glb-path]');
        if (!canvas) {
            console.warn('⚠️ Canvas GLB non trouvé pour aperçu');
            return;
        }

        const glbPath = canvas.dataset.glbPath;
        const glbName = canvas.dataset.glbName || 'Modèle GLB';

        // Si le canvas a déjà un contexte, le remplacer complètement par un nouveau canvas WebGL
        const existingContext = canvas.getContext('2d') || canvas.getContext('webgl') || canvas.getContext('webgl2');
        if (existingContext) {
            const newCanvas = document.createElement('canvas');
            newCanvas.width = canvas.width || 150;
            newCanvas.height = canvas.height || 150;
            newCanvas.className = canvas.className;
            newCanvas.style.cssText = canvas.style.cssText;
            
            // Copier les attributs data
            if (canvas.dataset.glbPath) newCanvas.dataset.glbPath = canvas.dataset.glbPath;
            if (canvas.dataset.glbName) newCanvas.dataset.glbName = canvas.dataset.glbName;
            
            // Remplacer dans le DOM
            canvas.parentNode.replaceChild(newCanvas, canvas);
            
            // Utiliser IntersectionObserver pour éviter les rendus coûteux d'éléments non visibles
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            observer.unobserve(entry.target);
                            setTimeout(() => {
                                this.renderGLBPreview(newCanvas, glbPath, glbName);
                            }, 10);
                        }
                    });
                }, { threshold: 0.1 });
                observer.observe(newCanvas);
            } else {
                // Fallback pour navigateurs sans IntersectionObserver
                setTimeout(() => {
                    this.renderGLBPreview(newCanvas, glbPath, glbName);
                }, 50);
            }
            return;
        }

        // Vérifier que Three.js est disponible
        if (typeof THREE === 'undefined') {
            console.warn('⚠️ Three.js non disponible pour aperçu GLB');
            this.showGLBPlaceholder(canvas, glbName);
            return;
        }

        // Créer la scène de preview
        this.renderGLBPreview(canvas, glbPath, glbName);
    }

    // Afficher un placeholder en cas d'erreur
    showGLBPlaceholder(canvas, glbName) {
        if (!canvas) {
            console.warn('⚠️ Canvas non fourni pour placeholder GLB');
            return;
        }

        // Si le canvas est déjà utilisé par WebGL, créer une overlay
        if (canvas.getContext('webgl') || canvas.getContext('webgl2')) {
            this.createWebGLPlaceholder(canvas, glbName);
            return;
        }

        // Sinon utiliser le contexte 2D
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.warn('⚠️ Impossible d\'obtenir le contexte 2D du canvas GLB');
            this.createHTMLPlaceholder(canvas, glbName);
            return;
        }

        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('📦', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillText(glbName, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText('GLB', canvas.width / 2, canvas.height / 2 + 30);
    }

    // Créer un placeholder WebGL
    createWebGLPlaceholder(canvas, glbName) {
        try {
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x2a2a2a);

            const camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 1000);
            camera.position.set(0, 0, 2);

            const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
            renderer.setSize(canvas.width, canvas.height);

            // Créer un texte placeholder simple
            const geometry = new THREE.PlaneGeometry(2, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0x666666 });
            const plane = new THREE.Mesh(geometry, material);
            scene.add(plane);

            renderer.render(scene, camera);
            console.log(`📦 Placeholder WebGL créé pour: ${glbName}`);
        } catch (error) {
            console.warn('⚠️ Erreur placeholder WebGL:', error);
            this.createHTMLPlaceholder(canvas, glbName);
        }
    }

    // Créer un placeholder HTML en overlay
    createHTMLPlaceholder(canvas, glbName) {
        const container = canvas.parentElement;
        if (!container) return;

        // Créer une overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #2a2a2a;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 1;
        `;
        
        overlay.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 10px;">📦</div>
            <div>${glbName}</div>
            <div style="font-size: 12px; color: #aaa;">GLB</div>
        `;

        // S'assurer que le container est en position relative
        if (container.style.position !== 'relative') {
            container.style.position = 'relative';
        }

        container.appendChild(overlay);
    }

    // Méthode principale pour rendre l'aperçu GLB
    renderGLBPreview(canvas, glbPath, glbName) {
        try {
            // Créer la scène Three.js
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x2a2a2a);

            // Ajuster le ratio pour éviter les bandes noires
            const containerWidth = canvas.parentElement.clientWidth || 150;
            const containerHeight = canvas.parentElement.clientHeight || 150;
            const size = Math.min(containerWidth, containerHeight);
            
            canvas.width = size;
            canvas.height = size;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.objectFit = 'contain';

            // Caméra avec ratio carré
            const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
            camera.position.set(2, 2, 2);

            // Renderer avec taille ajustée
            const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
            renderer.setSize(size, size);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            // Éclairage
            const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 5, 5);
            directionalLight.castShadow = true;
            scene.add(directionalLight);

            // Charger le modèle GLB
            this.loadGLBModel(scene, camera, renderer, glbPath, glbName, canvas);

        } catch (error) {
            console.error('❌ Erreur lors de la création de l\'aperçu GLB:', error);
            this.showGLBPlaceholder(canvas, glbName);
        }
    }

    // Charger le modèle GLB
    loadGLBModel(scene, camera, renderer, glbPath, glbName, canvas) {
        // Attendre que GLTFLoader soit disponible
        this.waitForGLTFLoader().then((GLTFLoader) => {
            const loader = new GLTFLoader();
            
            loader.load(
                glbPath,
                (gltf) => {
                    const model = gltf.scene;
                    scene.add(model);

                    // Calculer la bounding box pour ajuster la caméra et centrer le modèle
                    const box = new THREE.Box3().setFromObject(model);
                    const size = box.getSize(new THREE.Vector3());
                    const center = box.getCenter(new THREE.Vector3());

                    // Centrer le modèle en ajustant sa position
                    model.position.sub(center);

                    // Créer un groupe pour la rotation centrée
                    const rotationGroup = new THREE.Group();
                    rotationGroup.add(model);
                    scene.add(rotationGroup);

                    // Ajuster la position de la caméra
                    const maxSize = Math.max(size.x, size.y, size.z);
                    camera.position.set(
                        maxSize * 1.5,
                        maxSize * 1.2,
                        maxSize * 1.5
                    );
                    camera.lookAt(0, 0, 0); // Regarder le centre du groupe

                    // Variables pour la rotation
                    let isHovered = false;
                    let rotation = 0;
                    let animationId = null;

                    // Fonction de rendu
                    const render = () => {
                        renderer.render(scene, camera);
                    };

                    // Animation de rotation au survol
                    const animate = () => {
                        if (isHovered) {
                            rotation += 0.02;
                            rotationGroup.rotation.y = rotation;
                            render();
                            animationId = requestAnimationFrame(animate);
                        } else {
                            render();
                            animationId = null;
                        }
                    };

                    // Événements de survol
                    canvas.addEventListener('mouseenter', () => {
                        isHovered = true;
                        if (!animationId) {
                            animate();
                        }
                    });

                    canvas.addEventListener('mouseleave', () => {
                        isHovered = false;
                        if (animationId) {
                            cancelAnimationFrame(animationId);
                            animationId = null;
                        }
                    });

                    // Rendu initial
                    render();
                },
                (progress) => {
                    // console.log(`📊 Chargement aperçu GLB: ${(progress.loaded / progress.total * 100)}%`);
                },
                (error) => {
                    console.error(`❌ Erreur chargement aperçu GLB: ${glbName}`, error);
                    this.showGLBPlaceholder(renderer.domElement, glbName);
                }
            );
        }).catch((error) => {
            console.warn('⚠️ GLTFLoader non disponible pour aperçu GLB:', error);
            this.showGLBPlaceholder(canvas, glbName);
        });
    }

    // Méthode pour attendre que GLTFLoader soit disponible
    waitForGLTFLoader(timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const checkGLTFLoader = () => {
                // Vérifier différentes façons dont GLTFLoader peut être disponible
                if (window.GLTFLoader) {
                    resolve(window.GLTFLoader);
                    return;
                }
                
                if (typeof THREE !== 'undefined' && THREE.GLTFLoader) {
                    resolve(THREE.GLTFLoader);
                    return;
                }

                // Essayer de charger GLTFLoader dynamiquement si Three.js est disponible
                if (typeof THREE !== 'undefined' && !this.glbLoaderLoadAttempted) {
                    this.glbLoaderLoadAttempted = true;
                    
                    // Utiliser le même système que file-menu-handler.js
                    this.loadGLTFLoaderDynamic().then(() => {
                        checkGLTFLoader();
                    }).catch(() => {
                        setTimeout(checkGLTFLoader, 100);
                    });
                    return;
                }

                // Si le timeout est atteint
                if (Date.now() - startTime > timeout) {
                    reject(new Error('GLTFLoader non disponible après timeout'));
                    return;
                }

                // Réessayer dans 100ms
                setTimeout(checkGLTFLoader, 100);
            };

            checkGLTFLoader();
        });
    }

    // Charger GLTFLoader dynamiquement avec multiples stratégies
    async loadGLTFLoaderDynamic() {
        return new Promise((resolve, reject) => {
            // Stratégie 1: ES6 Import
            this.loadGLTFLoaderES6().then(resolve).catch(() => {
                // Stratégie 2: UMD
                this.loadGLTFLoaderUMD().then(resolve).catch(() => {
                    // Stratégie 3: Spécifique
                    this.loadGLTFLoaderSpecific().then(resolve).catch(() => {
                        // Stratégie 4: Legacy
                        this.loadGLTFLoaderLegacy().then(resolve).catch(reject);
                    });
                });
            });
        });
    }

    // Stratégie 1: Chargement ES6 avec import map existant
    loadGLTFLoaderES6() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'module';
            script.textContent = `
                try {
                    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
                    window.GLTFLoader = GLTFLoader;
                    window.dispatchEvent(new CustomEvent('gltfloader-es6-loaded'));
                } catch (error) {
                    console.warn('⚠️ Échec import map, tentative CDN:', error);
                    try {
                        const { GLTFLoader } = await import('https://cdn.jsdelivr.net/npm/three@latest/examples/jsm/loaders/GLTFLoader.js');
                        window.GLTFLoader = GLTFLoader;
                        window.dispatchEvent(new CustomEvent('gltfloader-es6-loaded'));
                        console.log('✅ GLTFLoader ES6 chargé depuis CDN');
                    } catch (cdnError) {
                        window.dispatchEvent(new CustomEvent('gltfloader-es6-error'));
                        console.error('❌ Échec total chargement ES6:', cdnError);
                    }
                }
            `;
            
            const loadHandler = () => {
                if (window.GLTFLoader) {
                    window.removeEventListener('gltfloader-es6-loaded', loadHandler);
                    window.removeEventListener('gltfloader-es6-error', errorHandler);
                    resolve();
                } else {
                    reject(new Error('GLTFLoader ES6 non disponible'));
                }
            };

            const errorHandler = () => {
                window.removeEventListener('gltfloader-es6-loaded', loadHandler);
                window.removeEventListener('gltfloader-es6-error', errorHandler);
                reject(new Error('Erreur chargement ES6'));
            };
            
            window.addEventListener('gltfloader-es6-loaded', loadHandler);
            window.addEventListener('gltfloader-es6-error', errorHandler);
            
            script.onerror = () => {
                window.removeEventListener('gltfloader-es6-loaded', loadHandler);
                window.removeEventListener('gltfloader-es6-error', errorHandler);
                reject(new Error('Erreur script ES6'));
            };
            
            document.head.appendChild(script);
            
            // Timeout de 10 secondes
            setTimeout(() => {
                window.removeEventListener('gltfloader-es6-loaded', loadHandler);
                window.removeEventListener('gltfloader-es6-error', errorHandler);
                reject(new Error('Timeout ES6'));
            }, 10000);
        });
    }

    // Stratégie 2: Chargement UMD avec version latest
    loadGLTFLoaderUMD() {
        return new Promise((resolve, reject) => {
            console.log('🔄 Tentative de chargement GLTFLoader UMD latest...');
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/three@latest/examples/js/loaders/GLTFLoader.js';
            
            script.onload = () => {
                setTimeout(() => {
                    if (window.THREE && window.THREE.GLTFLoader) {
                        window.GLTFLoader = window.THREE.GLTFLoader;
                        console.log('✅ GLTFLoader UMD latest chargé avec succès');
                        resolve();
                    } else {
                        reject(new Error('GLTFLoader UMD latest non disponible'));
                    }
                }, 100);
            };
            
            script.onerror = () => reject(new Error('Erreur chargement UMD latest'));
            document.head.appendChild(script);
        });
    }

    // Stratégie 3: Chargement spécifique
    loadGLTFLoaderSpecific() {
        return new Promise((resolve, reject) => {
            console.log('🔄 Tentative de chargement GLTFLoader spécifique...');
            
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/three@0.168.0/examples/js/loaders/GLTFLoader.js';
            
            script.onload = () => {
                setTimeout(() => {
                    if (window.THREE && window.THREE.GLTFLoader) {
                        window.GLTFLoader = window.THREE.GLTFLoader;
                        console.log('✅ GLTFLoader spécifique chargé avec succès');
                        resolve();
                    } else {
                        reject(new Error('GLTFLoader spécifique non disponible'));
                    }
                }, 100);
            };
            
            script.onerror = () => reject(new Error('Erreur chargement spécifique'));
            document.head.appendChild(script);
        });
    }

    // Stratégie 4: Chargement legacy avec fallback fonctionnel
    loadGLTFLoaderLegacy() {
        return new Promise((resolve, reject) => {
            console.log('🔄 Tentative de chargement GLTFLoader legacy...');
            
            const script = document.createElement('script');
            script.textContent = `
                // Créer un GLTFLoader de fallback fonctionnel
                if (!window.GLTFLoader && window.THREE) {
                    console.log('⚠️ Création GLTFLoader de fallback fonctionnel');
                    window.GLTFLoader = function() {
                        return {
                            load: function(url, onLoad, onProgress, onError) {
                                console.log('📦 GLTFLoader fallback - création d\\'un modèle de substitution');
                                
                                // Créer un modèle de substitution simple
                                const scene = new THREE.Scene();
                                
                                // Créer une géométrie de cube simple comme substitution
                                const geometry = new THREE.BoxGeometry(1, 1, 1);
                                const material = new THREE.MeshLambertMaterial({ 
                                    color: 0x8B4513,  // Couleur bois/hourdis
                                    transparent: true,
                                    opacity: 0.8
                                });
                                const cube = new THREE.Mesh(geometry, material);
                                
                                // Créer un groupe pour la rotation centrée (même logique que le vrai modèle)
                                const rotationGroup = new THREE.Group();
                                rotationGroup.add(cube);
                                scene.add(rotationGroup);
                                
                                // Ajouter une lumière
                                const light = new THREE.DirectionalLight(0xffffff, 1);
                                light.position.set(1, 1, 1);
                                scene.add(light);
                                
                                // Simuler la structure d'un fichier GLB chargé
                                const gltf = {
                                    scene: scene,
                                    scenes: [scene],
                                    animations: [],
                                    cameras: [],
                                    asset: {
                                        generator: "GLTFLoader Fallback",
                                        version: "2.0"
                                    }
                                };
                                
                                // Appeler le callback de succès
                                if (onLoad) {
                                    setTimeout(() => onLoad(gltf), 100);
                                }
                            }
                        };
                    };
                }
            `;
            
            document.head.appendChild(script);
            
            setTimeout(() => {
                if (window.GLTFLoader) {
                    console.log('✅ GLTFLoader legacy fonctionnel créé');
                    resolve();
                } else {
                    reject(new Error('GLTFLoader legacy non disponible'));
                }
            }, 100);
        });
    }
}

// Export pour utilisation dans d'autres modules
if (typeof window !== 'undefined') {
    window.LibraryPreview3D = LibraryPreview3D;
}
