// Définition des matériaux disponibles
class MaterialLibrary {
    constructor() {
        this.materials = {
            // ========== ETANCHEITE ==========
            'diba-noir': {
                name: 'Membrane Diba Noire',
                color: 0x111111,
                roughness: 0.95,
                metalness: 0.0,
                density: 950,
                thermalConductivity: 0.25,
                price: 2.50,
                section: 'etancheite',
                description: 'Membrane polyéthylène 500µ pour rupture capillaire / étanchéité.',
                rgb: '(17,17,17)'
            },
            // ========== BOIS (10 teintes) ==========
            'pin-epicea': {
                name: 'Pin / Épicéa',
                color: 0xFCE6A4,
                roughness: 0.9,
                metalness: 0.0,
                density: 450,
                thermalConductivity: 0.12,
                price: 0.35,
                section: 'bois',
                description: 'La teinte claire et jaunâtre des bois résineux neufs.',
                rgb: '(252, 230, 164)'
            },
            'hetre': {
                name: 'Hêtre',
                color: 0xE7C6A8,
                roughness: 0.85,
                metalness: 0.0,
                density: 720,
                thermalConductivity: 0.17,
                price: 0.45,
                section: 'bois',
                description: 'Un bois clair avec une subtile nuance rosée, très utilisé en mobilier.',
                rgb: '(231, 198, 168)'
            },
            'chene-clair': {
                name: 'Chêne Clair',
                color: 0xD2B48C,
                roughness: 0.8,
                metalness: 0.0,
                density: 750,
                thermalConductivity: 0.18,
                price: 0.55,
                section: 'bois',
                description: 'La couleur miel, chaude et dorée, du chêne naturel. Un grand classique.',
                rgb: '(210, 180, 140)'
            },
            'merisier': {
                name: 'Merisier',
                color: 0xB95A3D,
                roughness: 0.8,
                metalness: 0.0,
                density: 650,
                thermalConductivity: 0.16,
                price: 0.65,
                section: 'bois',
                description: 'Un bois noble à la teinte rousse et chaleureuse.',
                rgb: '(185, 90, 61)'
            },
            'noyer': {
                name: 'Noyer',
                color: 0x6B4E32,
                roughness: 0.75,
                metalness: 0.0,
                density: 680,
                thermalConductivity: 0.17,
                price: 0.75,
                section: 'bois',
                description: 'La couleur riche et profonde du noyer, un brun chocolat foncé.',
                rgb: '(107, 78, 50)'
            },
            'teck': {
                name: 'Bois de Teck',
                color: 0xB17C4B,
                roughness: 0.7,
                metalness: 0.0,
                density: 650,
                thermalConductivity: 0.16,
                price: 0.85,
                section: 'bois',
                description: 'Un brun doré et chaud, typique du bois exotique utilisé en extérieur.',
                rgb: '(177, 124, 75)'
            },
            'bois-grise': {
                name: 'Bois Grisé (patiné)',
                color: 0x9E9B8E,
                roughness: 0.95,
                metalness: 0.0,
                density: 500,
                thermalConductivity: 0.14,
                price: 0.40,
                section: 'bois',
                description: 'La teinte argentée que prend le bois exposé aux intempéries.',
                rgb: '(158, 155, 142)'
            },
            'bois-brule': {
                name: 'Bois Brûlé (Shou Sugi Ban)',
                color: 0x2A2B2D,
                roughness: 0.8,
                metalness: 0.0,
                density: 450,
                thermalConductivity: 0.12,
                price: 0.60,
                section: 'bois',
                description: 'Le noir profond et texturé du bois carbonisé selon la technique japonaise.',
                rgb: '(42, 43, 45)'
            },
            'contreplaque': {
                name: 'Contreplaqué / OSB',
                color: 0xE4DAB2,
                roughness: 0.9,
                metalness: 0.0,
                density: 580,
                thermalConductivity: 0.13,
                price: 0.25,
                section: 'bois',
                description: 'Un assemblage de copeaux de bois, teinte claire et composite.',
                rgb: '(228, 218, 178)'
            },
            'chataignier': {
                name: 'Châtaignier',
                color: 0xA18469,
                roughness: 0.85,
                metalness: 0.0,
                density: 600,
                thermalConductivity: 0.15,
                price: 0.50,
                section: 'bois',
                description: 'Un brun-jaune durable, souvent utilisé pour les piquets et clôtures.',
                rgb: '(161, 132, 105)'
            },

            // ========== PIERRES (10 teintes) ==========
            'pierre-bleue-belge': {
                name: 'Pierre Bleue Belge (Petit Granit)',
                color: 0x4A545D,
                roughness: 0.6,
                metalness: 0.0,
                density: 2650,
                thermalConductivity: 2.8,
                price: 0.95,
                section: 'pierres',
                description: 'Le calcaire gris-bleu foncé typique de la Wallonie, riche en fossiles.',
                rgb: '(74, 84, 93)'
            },
            'ardoise': {
                name: 'Ardoise Naturelle',
                color: 0x41484C,
                roughness: 0.4,
                metalness: 0.0,
                density: 2800,
                thermalConductivity: 2.2,
                price: 0.80,
                section: 'pierres',
                description: 'Le gris-noir profond et légèrement bleuté des toitures et sols.',
                rgb: '(65, 72, 76)'
            },
            'gres-vosges': {
                name: 'Grès des Vosges',
                color: 0xD9A690,
                roughness: 0.7,
                metalness: 0.0,
                density: 2300,
                thermalConductivity: 2.0,
                price: 0.70,
                section: 'pierres',
                description: 'La teinte rosée et chaude caractéristique de ce grès de l\'Est.',
                rgb: '(217, 166, 144)'
            },
            'tuffeau': {
                name: 'Tuffeau',
                color: 0xF4EEDA,
                roughness: 0.8,
                metalness: 0.0,
                density: 1800,
                thermalConductivity: 1.1,
                price: 0.60,
                section: 'pierres',
                description: 'La pierre calcaire de couleur crème, tendre et lumineuse.',
                rgb: '(244, 238, 218)'
            },
            'granit-gris': {
                name: 'Granit Gris',
                color: 0xA0A0A0,
                roughness: 0.3,
                metalness: 0.0,
                density: 2700,
                thermalConductivity: 3.0,
                price: 1.20,
                section: 'pierres',
                description: 'Un gris moucheté de noir et blanc, très résistant.',
                rgb: '(160, 160, 160)'
            },
            'marbre-carrare': {
                name: 'Marbre de Carrare',
                color: 0xFDFDFD,
                roughness: 0.2,
                metalness: 0.0,
                density: 2700,
                thermalConductivity: 2.5,
                price: 1.50,
                section: 'pierres',
                description: 'Un blanc très pur veiné de délicats filaments gris.',
                rgb: '(253, 253, 253)'
            },
            'silex': {
                name: 'Silex',
                color: 0x5F5B53,
                roughness: 0.5,
                metalness: 0.0,
                density: 2600,
                thermalConductivity: 2.5,
                price: 0.90,
                section: 'pierres',
                description: 'Un gris-brun très foncé, couleur de la pierre à fusil.',
                rgb: '(95, 91, 83)'
            },
            'pierre-france': {
                name: 'Pierre de France (calcaire clair)',
                color: 0xE7DDCB,
                roughness: 0.7,
                metalness: 0.0,
                density: 2100,
                thermalConductivity: 1.4,
                price: 0.65,
                section: 'pierres',
                description: 'Un beige très clair et lumineux, typique de nombreuses constructions.',
                rgb: '(231, 221, 203)'
            },
            'schiste': {
                name: 'Schiste',
                color: 0x75716E,
                roughness: 0.6,
                metalness: 0.0,
                density: 2700,
                thermalConductivity: 2.0,
                price: 0.75,
                section: 'pierres',
                description: 'Un gris moyen à foncé, feuilleté et souvent satiné.',
                rgb: '(117, 113, 110)'
            },
            'basalte': {
                name: 'Basalte',
                color: 0x3C3C3B,
                roughness: 0.4,
                metalness: 0.0,
                density: 3000,
                thermalConductivity: 2.8,
                price: 1.00,
                section: 'pierres',
                description: 'Une roche volcanique très foncée, presque noire.',
                rgb: '(60, 60, 59)'
            },

            // ========== MÉTAUX (10 teintes) ==========
            'inox': {
                name: 'Acier Inoxydable (Inox)',
                color: 0xC0C5C7,
                roughness: 0.2,
                metalness: 0.9,
                density: 7900,
                thermalConductivity: 16,
                price: 2.50,
                section: 'metaux',
                description: 'Un gris clair, lumineux et légèrement brossé.',
                rgb: '(192, 197, 199)'
            },
            // Acier standard (gris moyen) pour poutres – demandé comme "Axier"
            'axier': {
                name: 'Acier',
                color: 0x7E8487, // Gris moyen neutre
                roughness: 0.45, // un peu plus rugueux que l'inox poli
                metalness: 0.85,
                density: 7850,
                thermalConductivity: 50,
                price: 1.10,
                section: 'metaux',
                description: 'Acier structurel gris moyen (profilés standards).',
                rgb: '(126, 132, 135)',
                mapUrl: 'assets/textures/acier.png'
            },
            // Alias pour acier
            'acier': {
                name: 'Acier',
                color: 0x7E8487,
                roughness: 0.45,
                metalness: 0.85,
                density: 7850,
                thermalConductivity: 50,
                price: 1.10,
                section: 'metaux',
                description: 'Acier structurel gris moyen (profilés standards).',
                rgb: '(126, 132, 135)',
                mapUrl: 'assets/textures/acier.png'
            },
            'aluminium': {
                name: 'Aluminium',
                color: 0xA4A8AB,
                roughness: 0.3,
                metalness: 0.8,
                density: 2700,
                thermalConductivity: 237,
                price: 1.80,
                section: 'metaux',
                description: 'Le gris neutre et mat des châssis et menuiseries modernes.',
                rgb: '(164, 168, 171)',
                mapUrl: 'assets/textures/aluminium.jpg',
                // Texture actuelle jugée trop "serrée" → réduire la répétition pour un motif plus large
                // Ajustable si nécessaire (ex: 0.25 pour encore plus large ou 0.5 pour plus fin)
                repeat: { x: 0.33, y: 0.33 }
            },
            // Variante sans texture: aluminium uni gris clair
            'aluminium-plain': {
                name: 'Aluminium (uni gris clair)',
                color: 0xD0D3D6, // gris clair
                roughness: 0.55,
                metalness: 0.15,
                density: 2700,
                thermalConductivity: 237,
                price: 1.80,
                section: 'metaux',
                description: 'Version sans texture (uni) pour un rendu gris clair propre.',
                rgb: '(208, 211, 214)'
                // Pas de mapUrl → matériau couleur unie
            },
            'zinc-naturel': {
                name: 'Zinc Naturel (neuf)',
                color: 0xB8C2CC,
                roughness: 0.4,
                metalness: 0.7,
                density: 7140,
                thermalConductivity: 116,
                price: 1.20,
                section: 'metaux',
                description: 'La teinte claire et bleutée du zinc avant sa patine.',
                rgb: '(184, 194, 204)'
            },
            'zinc-patine': {
                name: 'Zinc Patiné',
                color: 0x788288,
                roughness: 0.6,
                metalness: 0.6,
                density: 7140,
                thermalConductivity: 116,
                price: 1.00,
                section: 'metaux',
                description: 'Le gris-bleu mat et velouté du zinc de toiture vieilli.',
                rgb: '(120, 130, 136)'
            },
            'cuivre-neuf': {
                name: 'Cuivre Neuf',
                color: 0xB87333,
                roughness: 0.2,
                metalness: 0.9,
                density: 8960,
                thermalConductivity: 401,
                price: 3.50,
                section: 'metaux',
                description: 'La couleur orange-rose brillante et métallique du cuivre poli.',
                rgb: '(184, 115, 51)'
            },
            'cuivre-patine': {
                name: 'Cuivre Patiné (Vert-de-gris)',
                color: 0x43B3AE,
                roughness: 0.7,
                metalness: 0.3,
                density: 8960,
                thermalConductivity: 401,
                price: 2.80,
                section: 'metaux',
                description: 'La célèbre patine turquoise qui se forme sur le cuivre.',
                rgb: '(67, 179, 174)'
            },
            'acier-corten': {
                name: 'Acier Corten',
                color: 0xC36241,
                roughness: 0.8,
                metalness: 0.5,
                density: 7850,
                thermalConductivity: 50,
                price: 1.60,
                section: 'metaux',
                description: 'La couleur rouille, chaude et texturée, de l\'acier auto-patinable.',
                rgb: '(195, 98, 65)'
            },
            'bronze': {
                name: 'Bronze',
                color: 0xCD7F32,
                roughness: 0.3,
                metalness: 0.8,
                density: 8800,
                thermalConductivity: 120,
                price: 4.00,
                section: 'metaux',
                description: 'Un brun-doré chaud et satiné, plus jaune que le cuivre.',
                rgb: '(205, 127, 50)'
            },
            'laiton': {
                name: 'Laiton',
                color: 0xE1C16E,
                roughness: 0.2,
                metalness: 0.9,
                density: 8500,
                thermalConductivity: 120,
                price: 2.20,
                section: 'metaux',
                description: 'Un jaune doré et brillant, souvent utilisé en décoration.',
                rgb: '(225, 193, 110)'
            },
            'fer-forge': {
                name: 'Fer Forgé / Fonte',
                color: 0x2F2F2F,
                roughness: 0.8,
                metalness: 0.4,
                density: 7200,
                thermalConductivity: 80,
                price: 0.90,
                section: 'metaux',
                description: 'Le noir mat et légèrement granuleux du fer ancien.',
                rgb: '(47, 47, 47)'
            },

            // ========== BRIQUES ET TUILES (10 teintes) ==========
            'brique-rouge-classique': {
                name: 'Brique Rouge Classique',
                color: 0xA03D32,
                roughness: 0.8,
                metalness: 0.0,
                density: 1800,
                thermalConductivity: 0.6,
                price: 0.35,
                section: 'briques-tuiles',
                description: 'Le rouge profond et chaleureux de la brique de construction traditionnelle.',
                rgb: '(160, 61, 50)',
                mapUrl: 'assets/textures/brique_rouge_1.png',
                repeat: { x: 1, y: 1 }
            },
            'brique-flandre': {
                name: 'Brique de Flandre (Sablée)',
                color: 0xE0C7A6,
                roughness: 0.8,
                metalness: 0.0,
                density: 1750,
                thermalConductivity: 0.58,
                price: 0.42,
                section: 'briques-tuiles',
                description: 'Une brique de teinte jaune-beige, couleur sable.',
                rgb: '(224, 199, 166)',
                mapUrl: 'assets/textures/brique_claire_1.png',
                repeat: { x: 1, y: 1 }
            },
            'brique-recuperation': {
                name: 'Brique de Récupération',
                color: 0xA1665E,
                roughness: 0.9,
                metalness: 0.0,
                density: 1700,
                thermalConductivity: 0.55,
                price: 0.28,
                section: 'briques-tuiles',
                description: 'Un rouge-brun nuancé, avec des traces d\'usure et de mortier.',
                rgb: '(161, 102, 94)'
            },
            'brique-brune': {
                name: 'Brique Brun Foncé',
                color: 0x6D4C41,
                roughness: 0.8,
                metalness: 0.0,
                density: 1850,
                thermalConductivity: 0.62,
                price: 0.45,
                section: 'briques-tuiles',
                description: 'Une brique moderne, de couleur chocolat ou café.',
                rgb: '(109, 76, 65)',
                mapUrl: 'assets/textures/brique_brune_1.png',
                repeat: { x: 1, y: 1 }
            },
            'brique-grise': {
                name: 'Brique Grise Claire',
                color: 0xBDBDBD,
                roughness: 0.8,
                metalness: 0.0,
                density: 1900,
                thermalConductivity: 0.65,
                price: 0.38,
                section: 'briques-tuiles',
                description: 'Une brique de ciment ou d\'argile de couleur gris clair.',
                rgb: '(189, 189, 189)',
                mapUrl: 'assets/textures/brique_grise_1.png',
                repeat: { x: 1, y: 1 }
            },
            'brique-anthracite': {
                name: 'Brique Anthracite',
                color: 0x505050,
                roughness: 0.8,
                metalness: 0.0,
                density: 1920,
                thermalConductivity: 0.68,
                price: 0.55,
                section: 'briques-tuiles',
                description: 'Une brique très foncée, presque noire, pour un look contemporain.',
                rgb: '(80, 80, 80)'
            },
            'brique-rose': {
                name: 'Brique Rose',
                color: 0xD7A69E,
                roughness: 0.8,
                metalness: 0.0,
                density: 1780,
                thermalConductivity: 0.59,
                price: 0.48,
                section: 'briques-tuiles',
                description: 'Une brique de parement de teinte rosée ou saumon.',
                rgb: '(215, 166, 158)'
            },
            'tuile-tc-neuve': {
                name: 'Tuile Terre Cuite Neuve',
                color: 0xC97964,
                roughness: 0.8,
                metalness: 0.0,
                density: 2000,
                thermalConductivity: 1.0,
                price: 0.65,
                section: 'briques-tuiles',
                description: 'La couleur orange vif et uniforme d\'une tuile neuve.',
                rgb: '(201, 121, 100)'
            },
            'tuile-tc-vieillie': {
                name: 'Tuile Terre Cuite Vieillie',
                color: 0x9E6C61,
                roughness: 0.9,
                metalness: 0.0,
                density: 2000,
                thermalConductivity: 1.0,
                price: 0.45,
                section: 'briques-tuiles',
                description: 'La teinte assombrie et patinée d\'une toiture ancienne.',
                rgb: '(158, 108, 97)'
            },
            'tuile-beton': {
                name: 'Tuile Béton Grise',
                color: 0x8E8E8E,
                roughness: 0.9,
                metalness: 0.0,
                density: 2200,
                thermalConductivity: 1.3,
                price: 0.35,
                section: 'briques-tuiles',
                description: 'Le gris moyen et mat des tuiles en béton.',
                rgb: '(142, 142, 142)'
            },

            // ========== MATÉRIAUX MODERNES ET COMPOSITES (10 teintes) ==========
            'beton-brut': {
                name: 'Béton Brut',
                color: 0xB4B4B4,
                roughness: 0.9,
                metalness: 0.0,
                density: 2400,
                thermalConductivity: 1.7,
                price: 0.25,
                section: 'modernes-composites',
                description: 'Le gris neutre et texturé du béton de coffrage.',
                rgb: '(180, 180, 180)'
            },
            'beton-cire': {
                name: 'Béton Ciré',
                color: 0x9A9A9A,
                roughness: 0.6,
                metalness: 0.0,
                density: 2400,
                thermalConductivity: 1.7,
                price: 0.45,
                section: 'modernes-composites',
                description: 'Un gris plus lisse, uniforme et souvent satiné.',
                rgb: '(154, 154, 154)'
            },
            'crepi-blanc': {
                name: 'Crépi Blanc',
                color: 0xF2F2F2,
                roughness: 0.9,
                metalness: 0.0,
                density: 1600,
                thermalConductivity: 0.8,
                price: 0.15,
                section: 'modernes-composites',
                description: 'Le blanc lumineux d\'un enduit de façade neuf.',
                rgb: '(242, 242, 242)'
            },
            'crepi-pierre': {
                name: 'Crépi Ton Pierre',
                color: 0xE8DBC5,
                roughness: 0.9,
                metalness: 0.0,
                density: 1600,
                thermalConductivity: 0.8,
                price: 0.18,
                section: 'modernes-composites',
                description: 'L\'enduit de couleur beige clair, imitant la pierre.',
                rgb: '(232, 219, 197)'
            },
            'verre-clair': {
                name: 'Verre Clair',
                color: 0xE0E8E7,
                roughness: 0.1,
                metalness: 0.0,
                density: 2500,
                thermalConductivity: 1.0,
                price: 0.80,
                section: 'modernes-composites',
                description: 'La teinte très claire et subtilement verdâtre d\'une vitre.',
                rgb: '(224, 232, 231)'
            },
            'verre-fume': {
                name: 'Verre Fumé',
                color: 0x6F7473,
                roughness: 0.1,
                metalness: 0.0,
                density: 2500,
                thermalConductivity: 1.0,
                price: 1.20,
                section: 'modernes-composites',
                description: 'Un gris transparent et foncé.',
                rgb: '(111, 116, 115)'
            },
            'panneau-composite': {
                name: 'Panneau Composite Anthracite',
                color: 0x373A3C,
                roughness: 0.4,
                metalness: 0.0,
                density: 1500,
                thermalConductivity: 0.3,
                price: 1.50,
                section: 'modernes-composites',
                description: 'Le gris très foncé et lisse des panneaux de façade (type Trespa®).',
                rgb: '(55, 58, 60)'
            },
            'corian': {
                name: 'Corian® / Surface Solide Blanche',
                color: 0xFCFCFC,
                roughness: 0.2,
                metalness: 0.0,
                density: 1700,
                thermalConductivity: 0.5,
                price: 2.20,
                section: 'modernes-composites',
                description: 'Un blanc pur, massif et homogène, pour plans de travail.',
                rgb: '(252, 252, 252)'
            },
            'lino-pvc': {
                name: 'Linoléum / Sol PVC Gris',
                color: 0xA9ACB6,
                roughness: 0.7,
                metalness: 0.0,
                density: 1400,
                thermalConductivity: 0.2,
                price: 0.30,
                section: 'modernes-composites',
                description: 'Un gris clair et utilitaire, souvent avec une nuance bleutée.',
                rgb: '(169, 172, 182)'
            },
            'caoutchouc-epdm': {
                name: 'Caoutchouc / EPDM Noir',
                color: 0x1C1C1C,
                roughness: 0.8,
                metalness: 0.0,
                density: 1200,
                thermalConductivity: 0.15,
                price: 0.85,
                section: 'modernes-composites',
                description: 'Le noir mat et profond des membranes de toiture plate.',
                rgb: '(28, 28, 28)'
            },

            // ========== ANCIENS MATÉRIAUX (pour compatibilité) ==========
            'brick-red': {
                name: 'Brique Rouge',
                color: 0xB85C57,
                roughness: 0.8,
                metalness: 0.0,
                density: 1800,
                thermalConductivity: 0.6,
                price: 0.35,
                section: 'compatibilite'
            },
            'brick-yellow': {
                name: 'Brique Jaune',
                color: 0xD4A574,
                roughness: 0.8,
                metalness: 0.0,
                density: 1750,
                thermalConductivity: 0.58,
                price: 0.38,
                section: 'compatibilite'
            },
            'concrete': {
                name: 'Béton',
                color: 0x888888,
                roughness: 0.9,
                metalness: 0.0,
                density: 2400,
                thermalConductivity: 1.7,
                price: 0.25,
                section: 'compatibilite'
            },
            'wood': {
                name: 'Bois',
                color: 0x8B4513,
                roughness: 0.9,
                metalness: 0.0,
                density: 600,
                thermalConductivity: 0.15,
                price: 0.45,
                section: 'compatibilite'
            },
            'insulation': {
                name: 'Isolant PUR',
                color: 0xf0ebe2,  // Beige très clair
                roughness: 0.95,
                metalness: 0.0,
                density: 30,
                thermalConductivity: 0.035,
                price: 0.55,
                section: 'compatibilite'
            },
            'terracotta': {
                name: 'Terre Cuite Rouge',
                color: 0xCD5C5C,  // Rouge indien plus vif
                roughness: 0.7,
                metalness: 0.0,
                density: 1800,
                thermalConductivity: 0.6,
                price: 0.35,
                section: 'compatibilite',
                description: 'Terre cuite aux nuances rouges, idéale pour construction traditionnelle.',
                rgb: '(205, 92, 92)'
            },
            'cellular-concrete': {
                name: 'Béton Cellulaire',
                color: 0xFFFFFF,
                roughness: 0.3,
                metalness: 0.0,
                emissive: 0x111111,
                density: 600,
                thermalConductivity: 0.15,
                price: 0.30,
                section: 'compatibilite'
            },
            'rock-wool': {
                name: 'Laine de Roche',
                color: 0xf0ebe2,  // Beige très clair
                roughness: 0.95,
                metalness: 0.0,
                density: 50,
                thermalConductivity: 0.040,
                price: 0.48,
                section: 'compatibilite'
                // Supprimé: transparent: true, opacity: 0.7 pour rendre opaque
            },
            
            // ========== PANNEAUX XPS (Polystyrène Extrudé) - Zones humides ==========
            'xps': {
                name: 'Panneaux XPS (Polystyrène Extrudé)',
                color: 0xe6f3ff,  // Bleu très clair caractéristique du XPS
                roughness: 0.3,   // Plus lisse que les autres isolants
                metalness: 0.0,
                shininess: 30,    // Aspect légèrement brillant
                density: 35,
                thermalConductivity: 0.034,
                price: 0.65,
                section: 'isolants',
                description: 'Panneaux XPS recommandés pour les zones humides comme les sols ou les murs de soubassement. Dimensions : 125×60 cm. Épaisseurs : 20, 30, 40, 50, 60, 80, 100 mm.',
                rgb: '(230, 243, 255)',
                waterResistant: true,  // Résistant à l\'humidité
                compressionStrength: 250 // kPa
            },
            
            // ========== PANNEAUX PSE (Polystyrène Expansé) - Solution économique ==========
            'pse': {
                name: 'Panneaux PSE (Polystyrène Expansé)',
                color: 0xffffff,  // Blanc caractéristique du PSE
                roughness: 0.7,
                metalness: 0.0,
                density: 20,
                thermalConductivity: 0.038,
                price: 0.45,
                section: 'isolants',
                description: 'Solution économique, souvent utilisée pour l\'isolation des façades. Dimensions : 100×50 cm. Épaisseurs : 20 à 300 mm.',
                rgb: '(255, 255, 255)',
                economical: true
            },
            
            // ========== PANNEAUX FIBRE DE BOIS - Choix écologique ==========
            'fibre-bois': {
                name: 'Panneaux en Fibre de Bois',
                color: 0xd2b48c,  // Beige boisé naturel
                roughness: 0.9,
                metalness: 0.0,
                density: 160,
                thermalConductivity: 0.042,
                price: 0.85,
                section: 'isolants',
                description: 'Choix écologique, excellent pour le confort en été. Dimensions : 135×57.5 cm. Épaisseurs : 40 à 160 mm.',
                rgb: '(210, 180, 140)',
                ecological: true,
                summerComfort: true
            },
            
            // ========== LAINE DE VERRE - Grand classique ==========
            'laine-verre': {
                name: 'Laine de Verre',
                color: 0xfffacd,  // Jaune pâle caractéristique
                roughness: 0.95,
                metalness: 0.0,
                density: 25,
                thermalConductivity: 0.035,
                price: 0.35,
                section: 'isolants',
                description: 'Le grand classique pour isoler les toitures inclinées. Rouleaux variables, largeurs : 35, 45, 50, 60, 120 cm. Épaisseurs : 60 à 220 mm.',
                rgb: '(255, 250, 205)',
                classic: true,
                roofing: true
            },
            
            // ========== LAINE DE ROCHE MODERNE - Performances acoustiques ==========
            'laine-roche-moderne': {
                name: 'Laine de Roche (Moderne)',
                color: 0xf5deb3,  // Beige plus foncé que l\'ancienne
                roughness: 0.95,
                metalness: 0.0,
                density: 45,
                thermalConductivity: 0.038,
                price: 0.55,
                section: 'isolants',
                description: 'Plus dense, meilleures performances acoustiques et tenue au feu. Panneaux : 100×60 cm ou rouleaux. Épaisseurs : 50 à 200 mm.',
                rgb: '(245, 222, 179)',
                acoustic: true,
                fireResistant: true
            },
            'joint-beige': {
                name: 'Joint Beige Clair',
                color: 0xF5F5DC,
                roughness: 0.9,
                metalness: 0.0,
                density: 1500,
                thermalConductivity: 0.7,
                price: 0.20,
                section: 'compatibilite'
            },
            'joint-gris-souris': {
                name: 'Joint Gris Souris',
                color: 0x9E9E9E,
                roughness: 0.9,
                metalness: 0.0,
                density: 1500,
                thermalConductivity: 0.7,
                price: 0.15,
                section: 'modernes-composites',
                description: 'Joint de maçonnerie de couleur gris souris, neutre et moderne.',
                rgb: '(158, 158, 158)'
            },
            'joint-blanc-casse': {
                name: 'Joint Blanc Cassé',
                color: 0xF5F5DC,
                roughness: 0.9,
                metalness: 0.0,
                density: 1500,
                thermalConductivity: 0.7,
                price: 0.15,
                section: 'modernes-composites',
                description: 'Joint de maçonnerie de couleur blanc cassé, idéal pour béton cellulaire.',
                rgb: '(245, 245, 220)'
            },
            'joint-argex': {
                name: 'Joint Argex',
                color: 0xE6E6FA,
                roughness: 0.9,
                metalness: 0.0,
                density: 1500,
                thermalConductivity: 0.7,
                price: 0.15,
                section: 'modernes-composites',
                description: 'Joint de maçonnerie lavande clair, spécialement adapté aux blocs ARGEX.',
                rgb: '(230, 230, 250)'
            }
        };
    }

    getMaterial(materialId) {
        return this.materials[materialId] || this.materials['brique-rouge-classique'];
    }

    getThreeJSMaterial(materialId) {
        const materialData = this.getMaterial(materialId);
        
        // Support texture-backed materials
        if (materialData && materialData.mapUrl) {
            const loader = new THREE.TextureLoader();

            // Charger la texture et n'appeler needsUpdate qu'une fois l'image disponible
            const repeat = materialData.repeat || { x: 1, y: 1 };
            const texture = loader.load(
                materialData.mapUrl,
                (tex) => {
                    // onLoad: config complète une fois l'image présente
                    tex.wrapS = THREE.RepeatWrapping;
                    tex.wrapT = THREE.RepeatWrapping;
                    tex.repeat.set(repeat.x, repeat.y);
                    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
                    tex.generateMipmaps = true;
                    tex.anisotropy = (window.SceneManager && window.SceneManager.renderer && window.SceneManager.renderer.capabilities.getMaxAnisotropy)
                        ? window.SceneManager.renderer.capabilities.getMaxAnisotropy()
                        : 4;
                    tex.needsUpdate = true;
                },
                undefined,
                (err) => {
                    console.warn('Texture load error:', materialData.mapUrl, err);
                }
            );

            const mat = new THREE.MeshLambertMaterial({
                color: 0xFFFFFF,
                map: texture
            });
            // Robust visibility flags
            mat.transparent = false;
            mat.opacity = 1.0;
            mat.alphaTest = 0.0;
            mat.depthWrite = true;
            mat.depthTest = true;
            mat.side = THREE.DoubleSide;
            mat.name = materialId;
            mat.needsUpdate = true;

            // Optionals for normal/roughness maps if later added
            if (materialData.normalMapUrl) {
                const n = loader.load(
                    materialData.normalMapUrl,
                    (nm) => {
                        if (THREE.SRGBColorSpace && THREE.NoColorSpace) nm.colorSpace = THREE.NoColorSpace;
                        nm.needsUpdate = true;
                        mat.needsUpdate = true;
                    }
                );
                mat.normalMap = n;
            }
            if (materialData.roughnessMapUrl) {
                // Switch to Standard if roughness map provided
                const std = new THREE.MeshStandardMaterial({
                    color: 0xFFFFFF,
                    map: texture,
                    roughness: materialData.roughness ?? 1.0,
                    metalness: materialData.metalness ?? 0.0
                });
                // Charger la roughnessMap et ne mettre à jour qu'après chargement
                const rtex = loader.load(
                    materialData.roughnessMapUrl,
                    (rt) => {
                        std.roughnessMap = rt;
                        std.needsUpdate = true;
                    }
                );
                std.transparent = false;
                std.opacity = 1.0;
                std.alphaTest = 0.0;
                std.depthWrite = true;
                std.depthTest = true;
                std.side = THREE.DoubleSide;
                std.name = materialId;
                return std;
            }
            return mat;
        }
        
        // Utiliser les propriétés du matériau, mais corriger les isolants problématiques
        const isTransparent = materialData.transparent || false;
        const opacity = materialData.opacity !== undefined ? materialData.opacity : 1.0;
        
        // CORRECTION SPÉCIALE: Forcer l'opacité pour les matériaux d'isolation dans la bibliothèque 3D
        if (materialId === 'rock-wool' || materialId === 'insulation') {
            return new THREE.MeshLambertMaterial({
                color: materialData.color,
                transparent: false,
                opacity: 1.0
                // Supprimé: roughness et metalness (non supportés par MeshLambertMaterial)
            });
        }
        
        // PANNEAUX XPS: Traitement spécial pour le rendu brillant
        if (materialId === 'xps') {
            return new THREE.MeshPhongMaterial({
                color: materialData.color,
                transparent: false,
                opacity: 1.0,
                shininess: materialData.shininess || 30,
                specular: 0x444444  // Reflet légèrement gris
            });
        }
        
        // PANNEAUX PSE: Rendu mat blanc
        if (materialId === 'pse') {
            return new THREE.MeshLambertMaterial({
                color: materialData.color,
                transparent: false,
                opacity: 1.0
            });
        }
        
        // FIBRE DE BOIS: Rendu naturel mat
        if (materialId === 'fibre-bois') {
            return new THREE.MeshLambertMaterial({
                color: materialData.color,
                transparent: false,
                opacity: 1.0
            });
        }
        
        // LAINE DE VERRE: Rendu jaune pâle mat
        if (materialId === 'laine-verre') {
            return new THREE.MeshLambertMaterial({
                color: materialData.color,
                transparent: false,
                opacity: 1.0
            });
        }
        
        // LAINE DE ROCHE MODERNE: Rendu beige mat
        if (materialId === 'laine-roche-moderne') {
            return new THREE.MeshLambertMaterial({
                color: materialData.color,
                transparent: false,
                opacity: 1.0
            });
        }
        
        return new THREE.MeshLambertMaterial({
            color: materialData.color,
            transparent: isTransparent,
            opacity: opacity
            // Supprimé: roughness et metalness (non supportés par MeshLambertMaterial)
        });
    }

    getAllMaterials() {
        return this.materials;
    }

    getMaterialNames() {
        return Object.keys(this.materials).map(key => ({
            id: key,
            name: this.materials[key].name
        }));
    }

    // Nouvelles méthodes pour organiser par sections
    getMaterialsBySection() {
        const sections = {
            'bois': { name: 'BOIS', materials: [] },
            'pierres': { name: 'PIERRES', materials: [] },
            'metaux': { name: 'MÉTAUX', materials: [] },
            'briques-tuiles': { name: 'BRIQUES ET TUILES', materials: [] },
            'isolants': { name: 'ISOLANTS', materials: [] },
            'modernes-composites': { name: 'MATÉRIAUX MODERNES ET COMPOSITES', materials: [] },
            'compatibilite': { name: 'Compatibilité', materials: [] }
        };

        Object.keys(this.materials).forEach(key => {
            const material = this.materials[key];
            const section = material.section || 'compatibilite';
            
            if (sections[section]) {
                sections[section].materials.push({
                    id: key,
                    name: material.name,
                    color: material.color,
                    description: material.description,
                    rgb: material.rgb,
                    price: material.price
                });
            }
        });

        return sections;
    }

    getSectionNames() {
        return [
            { id: 'bois', name: 'BOIS' },
            { id: 'pierres', name: 'PIERRES' },
            { id: 'metaux', name: 'MÉTAUX' },
            { id: 'briques-tuiles', name: 'BRIQUES ET TUILES' },
            { id: 'modernes-composites', name: 'MATÉRIAUX MODERNES ET COMPOSITES' }
        ];
    }

    getMaterialsForSection(sectionId) {
        const materials = [];
        Object.keys(this.materials).forEach(key => {
            const material = this.materials[key];
            if (material.section === sectionId) {
                materials.push({
                    id: key,
                    name: material.name,
                    color: material.color,
                    description: material.description,
                    rgb: material.rgb,
                    price: material.price
                });
            }
        });
        return materials;
    }

    // Méthode pour convertir la couleur hex en format CSS
    getColorHex(materialId) {
        const material = this.getMaterial(materialId);
        return `#${material.color.toString(16).padStart(6, '0').toUpperCase()}`;
    }

    // NOUVELLE MÉTHODE: Forcer la mise à jour des matériaux isolants problématiques
    fixInsulationMaterials() {
        // console.log(\'🔧 CORRECTION: Mise à jour forcée des matériaux isolants...');
        
        let objectsFound = 0;
        let materialsFixed = 0;
        
        // Parcourir tous les objets 3D dans la scène
        if (window.SceneManager && window.SceneManager.scene) {
            window.SceneManager.scene.traverse((object) => {
                if (object.isMesh && object.material) {
                    objectsFound++;
                    const userData = object.userData || {};
                    const materialType = userData.material;
                    
                    // 
                    
                    // Vérifier si c'est un élément avec un matériau isolant
                    const isInsulation = materialType === 'rock-wool' || 
                                       materialType === 'insulation' ||
                                       (userData.type && userData.type.includes('PUR')) ||
                                       (userData.elementType === 'insulation') ||
                                       (object.material.name && object.material.name.includes('insulation'));
                    
                    // STRATÉGIE AGRESSIVE: Forcer l'opacité pour TOUS les matériaux transparents
                    if (object.material.transparent || object.material.opacity < 1.0) {
                        const oldColor = '#' + object.material.color.getHexString();
                        
                        // console.log('🔧 Correction matériau transparent:', {
                        //     uuid: object.uuid.substring(0,8),
                        //     type: materialType,
                        //     elementType: userData.elementType,
                        //     transparent: object.material.transparent,
                        //     opacity: object.material.opacity,
                        //     oldColor: oldColor,
                        //     material: object.material.constructor.name
                        // });
                        
                        // Forcer l'opacité et désactiver la transparence
                        object.material.transparent = false;
                        object.material.opacity = 1.0;
                        
                        // NOUVEAU: Forcer les propriétés de rendu WebGL
                        object.material.alphaTest = 0.0;  // Pas de test alpha
                        object.material.side = THREE.DoubleSide;  // Visible des deux côtés
                        object.material.depthWrite = true;  // Écriture de profondeur
                        object.material.depthTest = true;   // Test de profondeur
                        object.material.visible = true;    // Forcer la visibilité
                        
                        // Forcer le mesh à être visible aussi
                        object.visible = true;
                        object.castShadow = true;
                        object.receiveShadow = true;
                        
                        // NOUVEAU: Si la couleur est trop pâle/proche du blanc, la remplacer par une couleur vive
                        const color = object.material.color;
                        const brightness = (color.r + color.g + color.b) / 3;
                        
                        if (brightness > 0.8) { // Couleur trop pâle
                            // Couleurs vives pour les éléments pâles/transparents
                            const vivid_colors = [
                                0xFF4500, // Rouge-orange vif
                                0x32CD32, // Vert lime
                                0x1E90FF, // Bleu dodger
                                0xFF69B4, // Rose vif
                                0xFFD700, // Or
                                0x8A2BE2, // Violet bleu
                                0x00CED1, // Turquoise foncé
                                0xFF6347  // Tomate
                            ];
                            const newColor = vivid_colors[materialsFixed % vivid_colors.length];
                            object.material.color.setHex(newColor);
                            // console.log(\'🎨 Couleur pâle remplacée:', oldColor, '→', '#' + newColor.toString(16).toUpperCase());
                        }
                        
                        object.material.needsUpdate = true;
                        materialsFixed++;
                        
                        // console.log(\'✅ Matériau corrigé - transparent:', object.material.transparent, 'opacity:', object.material.opacity, 'finalColor:', '#' + object.material.color.getHexString().toUpperCase());
                    }
                }
            });
        }
        
        // console.log(\`🔧 CORRECTION TERMINÉE: ${objectsFound} objets examinés, ${materialsFixed} matériaux corrigés`);
        
        // Aussi corriger les matériaux dans la bibliothèque directement
        this.forceInsulationOpacity();
    }

    // Méthode pour forcer l'opacité des isolants dans la bibliothèque de matériaux
    forceInsulationOpacity() {
        // console.log(\'🔧 Correction directe des définitions de matériaux isolants...');
        
        // Corriger rock-wool spécifiquement
        if (this.materials['rock-wool']) {
            delete this.materials['rock-wool'].transparent;
            delete this.materials['rock-wool'].opacity;
            this.materials['rock-wool'].solid = true; // Marquer comme solide
            // console.log(\'✅ rock-wool corrigé dans MaterialLibrary');
        }
        
        // Corriger tous les matériaux qui ont transparent: true
        Object.keys(this.materials).forEach(materialId => {
            const material = this.materials[materialId];
            if (material.transparent || material.opacity < 1.0) {
                // console.log(\'🔧 Correction matériau transparent:', materialId, material);
                delete material.transparent;
                material.opacity = 1.0;
                material.solid = true;
                // console.log(\'✅ Matériau', materialId, 'rendu opaque');
            }
        });
    }
}

// Instance globale
window.MaterialLibrary = new MaterialLibrary();
