/**
 * Procedural steel beam profiles (IPE, HEA, HEB, UPN) with EU-standard dimensions.
 * Units: input dimensions in millimeters; converted to decimeters for preview (1 dm = 100 mm).
 * This module exposes helper functions on window.BeamProfiles for use by previews and tools.
 */

(function() {
    const mmToDm = (mm) => mm / 100; // 100 mm = 1 dm

    // Minimal, commonly-used sizes with typical EU dimensions (rounded to 0.1 mm where needed)
    // Note: Radii r (root) and r1 (toe) are included for future use; current preview outlines are orthogonal.
    const DATA = {
        // IPE (I-section with parallel flanges)
        IPE: {
            IPE80:  { h: 80,  b: 46,  tw: 3.9, tf: 5.2, r: 7,  r1: 4 },
            IPE100: { h: 100, b: 55,  tw: 4.1, tf: 5.7, r: 7,  r1: 4 },
            // EXTENDED SIZES
            IPE120: { h: 120, b: 64,  tw: 4.4, tf: 5.9, r: 7,  r1: 4 },
            IPE140: { h: 140, b: 73,  tw: 4.7, tf: 6.6, r: 7,  r1: 4 },
            IPE160: { h: 160, b: 82,  tw: 5.0, tf: 7.4, r: 9,  r1: 5 },
            IPE180: { h: 180, b: 91,  tw: 5.3, tf: 8.0, r: 9,  r1: 5 },
            IPE200: { h: 200, b: 100, tw: 5.6, tf: 8.5, r: 12, r1: 6 },
            IPE220: { h: 220, b: 110, tw: 5.9, tf: 9.2, r: 12, r1: 6 },
            IPE240: { h: 240, b: 120, tw: 6.2, tf: 9.8, r: 12, r1: 6 },
            IPE270: { h: 270, b: 135, tw: 6.6, tf: 10.2, r: 15, r1: 8 },
            IPE300: { h: 300, b: 150, tw: 6.8, tf: 10.7, r: 15, r1: 8 },
            IPE330: { h: 330, b: 160, tw: 7.5, tf: 11.5, r: 15, r1: 8 },
            IPE360: { h: 360, b: 170, tw: 8.0, tf: 12.7, r: 15, r1: 8 },
            IPE400: { h: 400, b: 180, tw: 8.6, tf: 13.5, r: 18, r1: 9 },
            IPE450: { h: 450, b: 190, tw: 9.8, tf: 14.6, r: 18, r1: 9 },
            IPE500: { h: 500, b: 200, tw: 10.2, tf: 16.0, r: 18, r1: 9 },
            IPE550: { h: 550, b: 210, tw: 11.2, tf: 17.2, r: 18, r1: 9 },
            IPE600: { h: 600, b: 220, tw: 12.0, tf: 19.0, r: 21, r1: 10 }
        },
        // HEA (wide flange, lighter than HEB)
        HEA: {
            HEA100: { h: 96,  b: 100, tw: 5.0, tf: 8.0, r: 12, r1: 6 },
            HEA120: { h: 114, b: 120, tw: 5.0, tf: 8.0, r: 12, r1: 6 },
            HEA140: { h: 133, b: 140, tw: 5.5, tf: 8.5, r: 12, r1: 6 },
            HEA160: { h: 152, b: 160, tw: 6.0, tf: 9.0, r: 12, r1: 6 },
            HEA180: { h: 171, b: 180, tw: 6.0, tf: 9.5, r: 15, r1: 8 },
            HEA200: { h: 190, b: 200, tw: 6.5, tf: 10.0, r: 15, r1: 8 },
            HEA220: { h: 210, b: 220, tw: 6.5, tf: 11.0, r: 15, r1: 8 },
            HEA240: { h: 230, b: 240, tw: 7.5, tf: 12.0, r: 18, r1: 9 },
            HEA260: { h: 250, b: 260, tw: 7.0, tf: 12.5, r: 18, r1: 9 },
            HEA300: { h: 290, b: 300, tw: 8.0, tf: 14.0, r: 21, r1: 10 },
            HEA320: { h: 310, b: 300, tw: 8.5, tf: 15.5, r: 21, r1: 10 },
            HEA340: { h: 330, b: 300, tw: 9.0, tf: 16.5, r: 21, r1: 10 },
            HEA360: { h: 350, b: 300, tw: 9.5, tf: 17.5, r: 21, r1: 10 },
            HEA400: { h: 390, b: 300, tw: 10.5, tf: 19.0, r: 24, r1: 12 },
            HEA450: { h: 440, b: 300, tw: 11.5, tf: 21.0, r: 24, r1: 12 },
            HEA500: { h: 490, b: 300, tw: 12.0, tf: 23.0, r: 24, r1: 12 },
            HEA550: { h: 540, b: 300, tw: 12.5, tf: 24.0, r: 27, r1: 13 },
            HEA600: { h: 590, b: 300, tw: 13.0, tf: 25.0, r: 27, r1: 13 }
        },
        // HEB (wide flange, heavier)
        HEB: {
            HEB100: { h: 100, b: 100, tw: 6.0,  tf: 10.0, r: 12, r1: 6 },
            HEB120: { h: 120, b: 120, tw: 6.5,  tf: 11.0, r: 12, r1: 6 },
            HEB140: { h: 140, b: 140, tw: 7.0,  tf: 12.0, r: 12, r1: 6 },
            HEB160: { h: 160, b: 160, tw: 8.0,  tf: 13.0, r: 15, r1: 8 },
            HEB180: { h: 180, b: 180, tw: 8.5,  tf: 14.0, r: 15, r1: 8 },
            HEB200: { h: 200, b: 200, tw: 8.5,  tf: 14.0, r: 18, r1: 9 },
            HEB220: { h: 220, b: 220, tw: 9.5,  tf: 16.0, r: 18, r1: 9 },
            HEB240: { h: 240, b: 240, tw: 9.5,  tf: 17.0, r: 21, r1: 10 },
            HEB260: { h: 260, b: 260, tw: 10.0, tf: 17.5, r: 21, r1: 10 },
            HEB300: { h: 300, b: 300, tw: 11.0, tf: 19.0, r: 24, r1: 12 },
            HEB320: { h: 320, b: 300, tw: 11.5, tf: 20.5, r: 24, r1: 12 },
            HEB340: { h: 340, b: 300, tw: 12.0, tf: 21.5, r: 24, r1: 12 },
            HEB360: { h: 360, b: 300, tw: 12.5, tf: 22.5, r: 24, r1: 12 },
            HEB400: { h: 400, b: 300, tw: 13.5, tf: 24.0, r: 27, r1: 13 },
            HEB450: { h: 450, b: 300, tw: 14.5, tf: 26.0, r: 27, r1: 13 },
            HEB500: { h: 500, b: 300, tw: 15.0, tf: 28.0, r: 27, r1: 13 },
            HEB550: { h: 550, b: 300, tw: 15.5, tf: 29.0, r: 30, r1: 15 },
            HEB600: { h: 600, b: 300, tw: 16.0, tf: 30.0, r: 30, r1: 15 }
        },
        // UPN (U-channel with tapered flanges in standards; approximated here with parallel flange thickness)
        UPN: {
            UPN80:  { h: 80,  b: 45, tw: 4.5, tf: 7.0,  r: 8,  r1: 4 },
            UPN100: { h: 100, b: 50, tw: 5.0, tf: 8.0,  r: 9,  r1: 5 },
            UPN120: { h: 120, b: 55, tw: 5.5, tf: 8.5,  r: 9,  r1: 5 },
            UPN140: { h: 140, b: 60, tw: 6.0, tf: 9.5,  r: 10, r1: 5 },
            UPN160: { h: 160, b: 65, tw: 6.5, tf: 10.0, r: 12, r1: 6 },
            UPN180: { h: 180, b: 70, tw: 7.0, tf: 10.5, r: 12, r1: 6 },
            UPN200: { h: 200, b: 75, tw: 7.5, tf: 11.5, r: 13, r1: 7 },
            UPN220: { h: 220, b: 80, tw: 8.0, tf: 12.5, r: 14, r1: 7 },
            UPN240: { h: 240, b: 85, tw: 8.5, tf: 13.5, r: 15, r1: 8 },
            UPN260: { h: 260, b: 90, tw: 9.0, tf: 14.5, r: 16, r1: 8 },
            UPN300: { h: 300, b: 100, tw: 10.0, tf: 16.0, r: 18, r1: 9 },
            UPN320: { h: 320, b: 100, tw: 13.5, tf: 18.0, r: 18, r1: 9 },
            UPN350: { h: 350, b: 105, tw: 14.0, tf: 19.0, r: 18, r1: 9 },
            UPN380: { h: 380, b: 110, tw: 15.0, tf: 20.0, r: 21, r1: 10 },
            UPN400: { h: 400, b: 110, tw: 15.5, tf: 21.0, r: 21, r1: 10 }
        },
        // IPN (older standard I-sections)
        IPN: {
            IPN80:  { h: 80,  b: 42,  tw: 3.9, tf: 5.9,  r: 7,  r1: 4 },
            IPN100: { h: 100, b: 50,  tw: 4.5, tf: 6.8,  r: 7,  r1: 4 },
            IPN120: { h: 120, b: 58,  tw: 5.1, tf: 7.7,  r: 7,  r1: 4 },
            IPN140: { h: 140, b: 66,  tw: 5.7, tf: 8.6,  r: 9,  r1: 5 },
            IPN160: { h: 160, b: 74,  tw: 6.3, tf: 9.5,  r: 9,  r1: 5 },
            IPN180: { h: 180, b: 82,  tw: 6.9, tf: 10.4, r: 9,  r1: 5 },
            IPN200: { h: 200, b: 90,  tw: 7.5, tf: 11.3, r: 12, r1: 6 },
            IPN220: { h: 220, b: 98,  tw: 8.1, tf: 12.2, r: 12, r1: 6 },
            IPN240: { h: 240, b: 106, tw: 8.7, tf: 13.1, r: 12, r1: 6 },
            IPN260: { h: 260, b: 113, tw: 9.3, tf: 14.1, r: 12, r1: 6 },
            IPN280: { h: 280, b: 119, tw: 10.1, tf: 15.2, r: 15, r1: 8 },
            IPN300: { h: 300, b: 125, tw: 10.8, tf: 16.2, r: 15, r1: 8 },
            IPN320: { h: 320, b: 131, tw: 11.5, tf: 17.3, r: 15, r1: 8 },
            IPN340: { h: 340, b: 137, tw: 12.2, tf: 18.3, r: 15, r1: 8 },
            IPN360: { h: 360, b: 143, tw: 13.0, tf: 19.5, r: 18, r1: 9 },
            IPN380: { h: 380, b: 149, tw: 13.7, tf: 20.5, r: 18, r1: 9 },
            IPN400: { h: 400, b: 155, tw: 14.4, tf: 21.6, r: 18, r1: 9 }
        },
        // UPE (parallel flange channels)
        UPE: {
            UPE80:  { h: 80,  b: 50,  tw: 4.0, tf: 7.4,  r: 8,  r1: 4 },
            UPE100: { h: 100, b: 55,  tw: 4.5, tf: 8.0,  r: 9,  r1: 5 },
            UPE120: { h: 120, b: 60,  tw: 5.0, tf: 8.5,  r: 9,  r1: 5 },
            UPE140: { h: 140, b: 65,  tw: 5.5, tf: 9.0,  r: 10, r1: 5 },
            UPE160: { h: 160, b: 70,  tw: 6.0, tf: 9.5,  r: 10, r1: 5 },
            UPE180: { h: 180, b: 75,  tw: 6.5, tf: 10.0, r: 12, r1: 6 },
            UPE200: { h: 200, b: 80,  tw: 7.0, tf: 10.5, r: 12, r1: 6 },
            UPE220: { h: 220, b: 85,  tw: 7.5, tf: 11.0, r: 12, r1: 6 },
            UPE240: { h: 240, b: 90,  tw: 8.0, tf: 11.5, r: 12, r1: 6 },
            UPE260: { h: 260, b: 95,  tw: 8.5, tf: 12.0, r: 15, r1: 8 },
            UPE300: { h: 300, b: 100, tw: 9.5, tf: 13.0, r: 15, r1: 8 },
            UPE330: { h: 330, b: 105, tw: 10.0, tf: 14.0, r: 15, r1: 8 },
            UPE360: { h: 360, b: 110, tw: 11.0, tf: 15.0, r: 18, r1: 9 },
            UPE400: { h: 400, b: 115, tw: 12.0, tf: 16.0, r: 18, r1: 9 },
            UPE450: { h: 450, b: 125, tw: 13.0, tf: 18.0, r: 18, r1: 9 },
            UPE500: { h: 500, b: 135, tw: 14.0, tf: 20.0, r: 21, r1: 10 }
        },
        // HEM (very heavy wide flange)
        HEM: {
            HEM100: { h: 120, b: 106, tw: 12.0, tf: 20.0, r: 12, r1: 6 },
            HEM120: { h: 140, b: 126, tw: 12.5, tf: 21.0, r: 12, r1: 6 },
            HEM140: { h: 160, b: 146, tw: 13.0, tf: 22.0, r: 12, r1: 6 },
            HEM160: { h: 180, b: 166, tw: 14.0, tf: 23.0, r: 15, r1: 8 },
            HEM180: { h: 200, b: 186, tw: 15.0, tf: 24.0, r: 15, r1: 8 },
            HEM200: { h: 220, b: 206, tw: 16.0, tf: 25.0, r: 18, r1: 9 },
            HEM220: { h: 240, b: 226, tw: 17.0, tf: 26.0, r: 18, r1: 9 },
            HEM240: { h: 270, b: 248, tw: 18.0, tf: 32.0, r: 21, r1: 10 },
            HEM260: { h: 290, b: 268, tw: 19.0, tf: 32.5, r: 21, r1: 10 },
            HEM280: { h: 310, b: 288, tw: 21.0, tf: 33.0, r: 21, r1: 10 },
            HEM300: { h: 340, b: 310, tw: 21.5, tf: 39.0, r: 24, r1: 12 },
            HEM320: { h: 359, b: 309, tw: 21.0, tf: 40.0, r: 24, r1: 12 },
            HEM340: { h: 377, b: 309, tw: 21.5, tf: 40.5, r: 24, r1: 12 },
            HEM360: { h: 395, b: 308, tw: 22.0, tf: 41.0, r: 24, r1: 12 },
            HEM400: { h: 432, b: 307, tw: 25.0, tf: 49.0, r: 27, r1: 13 },
            HEM450: { h: 478, b: 307, tw: 26.0, tf: 52.0, r: 27, r1: 13 },
            HEM500: { h: 524, b: 306, tw: 28.0, tf: 54.0, r: 27, r1: 13 },
            HEM550: { h: 572, b: 306, tw: 29.0, tf: 57.0, r: 30, r1: 15 },
            HEM600: { h: 620, b: 305, tw: 30.0, tf: 60.0, r: 30, r1: 15 }
        },
        // Corniers (angles) galvanisés en L (épaisseur t)
        L: {
            // Interprétation: "9,5 x 9,5" cm avec épaisseur 3 mm (demande: 3mm d'épaisseur, dimension 9,5x9,5)
            L95x95x3: { h: 95, b: 95, t: 3, r: 4 }
        }
    };

    // Helpers to query dataset
    function listAllTypes() {
        const out = [];
        for (const familyName of Object.keys(DATA)) {
            out.push(...Object.keys(DATA[familyName]));
        }
        return out;
    }

    function getProfile(type) {
        for (const family of Object.values(DATA)) {
            if (type in family) return family[type];
        }
        return null;
    }

    function isBeamType(type) {
        return !!getProfile(type);
    }

    // Build a 2D I/H shape (outer orthogonal outline) centered at origin
    function makeIShape({ h, b, tw, tf, r = 0 }) {
        const H = mmToDm(h);
        const B = mmToDm(b);
        const TW = mmToDm(tw);
        const TF = mmToDm(tf);
        const R = Math.max(0, mmToDm(r));

        const halfH = H / 2;
        const halfB = B / 2;
        const halfTW = TW / 2;

        const shape = new THREE.Shape();
        // Start top-left outer
        shape.moveTo(-halfB,  halfH);
        shape.lineTo( halfB,  halfH);           // Top edge
        shape.lineTo( halfB,  halfH - TF);      // Down right to top flange thickness
        // Top-right inner fillet to web
        if (R > 0) {
            shape.lineTo( halfTW + R, halfH - TF);
            shape.quadraticCurveTo( halfTW, halfH - TF,  halfTW, halfH - TF - R);
        } else {
            shape.lineTo( halfTW, halfH - TF);
        }
        // Down along web
        if (R > 0) {
            shape.lineTo( halfTW, -halfH + TF + R);
            shape.quadraticCurveTo( halfTW, -halfH + TF,  halfTW + R, -halfH + TF);
        } else {
            shape.lineTo( halfTW, -halfH + TF);
        }
        shape.lineTo( halfB, -halfH + TF);      // Out to lower flange outer
        shape.lineTo( halfB, -halfH);           // Down to bottom outer
        shape.lineTo(-halfB, -halfH);           // Bottom edge
        shape.lineTo(-halfB, -halfH + TF);      // Up left inner outer
        // Bottom-left inner fillet to web
        if (R > 0) {
            shape.lineTo(-halfTW - R, -halfH + TF);
            shape.quadraticCurveTo(-halfTW, -halfH + TF, -halfTW, -halfH + TF + R);
        } else {
            shape.lineTo(-halfTW, -halfH + TF);
        }
        // Up along web
        if (R > 0) {
            shape.lineTo(-halfTW,  halfH - TF - R);
            shape.quadraticCurveTo(-halfTW,  halfH - TF, -halfTW - R,  halfH - TF);
        } else {
            shape.lineTo(-halfTW,  halfH - TF);
        }
        shape.lineTo(-halfB,  halfH - TF);      // Out to top flange inner left
        shape.lineTo(-halfB,  halfH);           // Up to start
        shape.closePath();
        return shape;
    }

    // Build a 2D U/C shape as a single C-shaped polygon (web on RIGHT, opening on LEFT)
    function makeUShape({ h, b, tw, tf, r = 0 }) {
        const H = mmToDm(h);
        const B = mmToDm(b);
        const TW = mmToDm(tw);
        const TF = mmToDm(tf);
        const R = Math.max(0, mmToDm(r));

        const halfH = H / 2;
        const halfB = B / 2;

    const xWebInner = halfB - TW; // inner boundary of the web (opening side boundary)
    const shape = new THREE.Shape();
    // Trace the C-shaped metal area without holes (non-self-intersecting)
    shape.moveTo(-halfB,  halfH);           // 1: top-left outer
    shape.lineTo( halfB,  halfH);           // 2: top-right outer
    shape.lineTo( halfB, -halfH);           // 3: bottom-right outer
    shape.lineTo(-halfB, -halfH);           // 4: bottom-left outer
    shape.lineTo(-halfB, -halfH + TF);      // 5: bottom-left inner (opening side)
    shape.lineTo(xWebInner, -halfH + TF);   // 6: inner bottom up to web
    shape.lineTo(xWebInner,  halfH - TF);   // 7: up along web inner
    shape.lineTo(-halfB,  halfH - TF);      // 8: inner top (opening side)
    shape.lineTo(-halfB,  halfH);           // 9: back to start
    shape.closePath();
    return shape;
    }

    // Build an L (angle) shape (solid steel area) centered at origin
    function makeLShape({ h, b, t, r = 0 }) {
        const H = mmToDm(h); // vertical leg length
        const B = mmToDm(b); // horizontal leg length
        const T = mmToDm(t); // thickness
        const halfH = H / 2;
        const halfB = B / 2;
    // Orientation: aile horizontale en BAS (face au sol après pivot Y=0)
    const shape = new THREE.Shape();
    shape.moveTo(-halfB, -halfH);                 // 1 bottom-left outer
    shape.lineTo( halfB, -halfH);                 // 2 bottom-right outer (extrémité aile horizontale)
    shape.lineTo( halfB, -halfH + T);             // 3 up épaisseur aile
    shape.lineTo(-halfB + T, -halfH + T);         // 4 vers intérieur jusqu'à épaisseur verticale
    shape.lineTo(-halfB + T,  halfH);             // 5 monter le long de la jambe verticale intérieure
    shape.lineTo(-halfB,  halfH);                 // 6 top-left outer
    shape.lineTo(-halfB, -halfH);                 // 7 retour origine
    shape.closePath();
        return shape;
    }

    // Create a 3D mesh group from profile type. lengthDm is in decimeters.
    function createBeamGroup(type, lengthDm = 10) {
        const p = getProfile(type);
        if (!p) return null;

    const isU = type.startsWith('UPN');
    const isL = type.startsWith('L');
    let shape;
    if (isU) shape = makeUShape(p);
    else if (isL) shape = makeLShape(p);
    else shape = makeIShape(p);

        const geometry = new THREE.ExtrudeGeometry(shape, {
            steps: 1,
            depth: lengthDm,
            bevelEnabled: false
        });

        const material = new THREE.MeshPhongMaterial({
            color: 0x6e7781,
            shininess: 70,
            specular: 0x999999
        });
        const mesh = new THREE.Mesh(geometry, material);
        // Aperçu: pas d'ombres sur les poutres pour plus de lisibilité
        mesh.castShadow = false;
        mesh.receiveShadow = false;

        // Center the extrude along X for nicer preview (rotate so length runs on X)
        // ExtrudeGeometry extrudes along +Z; rotate so length aligns with X
        mesh.rotation.y = Math.PI / 2; // turn Z-depth into X-length

        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 1 });
        const wire = new THREE.LineSegments(edges, lineMaterial);
        wire.rotation.copy(mesh.rotation);

        const group = new THREE.Group();
        group.add(mesh);
        group.add(wire);
        return group;
    }

    window.BeamProfiles = {
        listAllTypes,
        isBeamType,
        getProfile,
        createBeamGroup
    };
})();
