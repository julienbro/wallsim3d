// Outil de création de Diba (membrane d'étanchéité) par polyligne + extrusion
class DibaTool {
    constructor() {
        this.active = false;
        this.points = [];
        this.tempLine = null;
        this.pointMarkers = [];
        this.snapSphere = null;
        this.extrusionDirection = (window.THREE ? new THREE.Vector3(0,1,0) : {x:0,y:1,z:0});
        this.extrusionLength = 15;
    // Épaisseur par défaut plus fine
    this.thickness = 0.001; // cm
        this.snapDistance = 8;
        this.uiPanel = null;
        this.materialId = 'diba-noir';
        this.debugCorners = false;
        this.cornerHelpers = [];
    // --- Nouveau: support points d'accrochage globaux (inspiré measurement-tool) ---
    this.snapPoints = []; // {position:THREE.Vector3, elementId, elementType}
    this._snapPointsVersion = 0; // incrément si on veut invalider plus tard
    this.maxCornerDistance = 30; // distance max (cm ou mètres adaptatif) pour accepter un coin sinon on prend le point brut
    this.snapVerticalMode = 'closest'; // 'closest' | 'min' | 'max'
    this.lastAddTimestamp = 0; // pour éviter les doubles ajouts dus à click + pointerdown
    this._lastCornerHostId = null; // suivi pour helpers coins
    this._lastRejectLog = 0; // throttle logs rejet
        this._boundClick = this.onSceneClick.bind(this);
        this._boundDbl = this.onSceneDoubleClick.bind(this);
        this._boundKey = this.onKeyDown.bind(this);
        this._boundMove = this.onSceneMove.bind(this);
        this.raycaster = (window.THREE ? new THREE.Raycaster() : null);
        this.mouse = (window.THREE ? new THREE.Vector2() : {x:0,y:0});
        this.init();
    }

    init() {
        document.addEventListener('dibaStart', () => this.activate());
        // Si THREE pas encore chargé, attendre
        if (!window.THREE) {
            const retry = () => {
                if (window.THREE && window.SceneManager) {
                    // initialiser objets dépendants
                    if (!this.raycaster) this.raycaster = new THREE.Raycaster();
                    if (!this.mouse.x) this.mouse = new THREE.Vector2();
                    if (!(this.extrusionDirection instanceof Object && this.extrusionDirection.isVector3)) {
                        this.extrusionDirection = new THREE.Vector3(0,1,0);
                    }
                } else {
                    setTimeout(retry, 100);
                }
            };
            retry();
        }
    }

    activate() {
        if (this.active) return;
        this.active = true;
        this.points = [];
        this.createTempLine();
    // Collecte initiale des snap points (coins) existants
    this.collectSnapPoints();
        // Désactiver le fantôme ConstructionTools pendant le mode diba
        if (window.ConstructionTools) {
            this._prevShowGhost = window.ConstructionTools.showGhost;
            window.ConstructionTools.showGhost = false;
            if (window.ConstructionTools.ghostElement && window.ConstructionTools.ghostElement.mesh) {
                try { window.SceneManager.scene.remove(window.ConstructionTools.ghostElement.mesh); } catch(e){}
                window.ConstructionTools.ghostElement = null;
            }
        }
        if (window.SceneManager && window.SceneManager.renderer) {
            const dom = window.SceneManager.renderer.domElement;
            dom.addEventListener('click', this._boundClick);
            dom.addEventListener('dblclick', this._boundDbl);
            dom.addEventListener('mousemove', this._boundMove);
        }
        window.addEventListener('keydown', this._boundKey);
        this.showInstruction();
        console.log('📐 DibaTool activé: cliquez pour créer des points, double‑clic ou Entrée pour terminer.');
    }

    deactivate(commit=false) {
        if (!this.active) return;
        this.active = false;
        if (window.SceneManager && window.SceneManager.renderer) {
            const dom = window.SceneManager.renderer.domElement;
            dom.removeEventListener('click', this._boundClick);
            dom.removeEventListener('dblclick', this._boundDbl);
            dom.removeEventListener('mousemove', this._boundMove);
        }
        window.removeEventListener('keydown', this._boundKey);
        if (!commit) this.disposeTemp();
        this.removeInstruction();
        // Restaurer le fantôme après
        if (window.ConstructionTools && this._prevShowGhost !== undefined) {
            window.ConstructionTools.showGhost = this._prevShowGhost;
            this._prevShowGhost = undefined;
            // Forcer une mise à jour du fantôme seulement si réactivé
            if (window.ConstructionTools.showGhost && window.ConstructionTools.updateGhostElement) {
                window.ConstructionTools.updateGhostElement();
            }
        }
    }

    showInstruction() {
        if (this.uiPanel) return;
        const panel = document.createElement('div');
        panel.id = 'diba-instruction';
        panel.style.cssText = 'position:fixed;top:70px;right:20px;background:#111;color:#fff;padding:10px 14px;border-radius:6px;font-size:12px;z-index:10000;opacity:.9;';
        panel.innerHTML = '<b>Diba</b> – Cliquez pour ajouter des points (accrochage coins). Double‑clic ou Entrée: terminer. Echap: annuler.';
        document.body.appendChild(panel);
        this.uiPanel = panel;
    }

    removeInstruction() { if (this.uiPanel) { this.uiPanel.remove(); this.uiPanel=null;} }

    onKeyDown(e){
        if (!this.active) return;
        if (e.key === 'Enter') { this.finishPolyline(); }
        if (e.key === 'Escape') { this.deactivate(false); }
    if (e.key === 'v' || e.key === 'V') { this.toggleDebugCorners(); }
    }

    screenToWorld(clientX, clientY) {
        if (!window.SceneManager || !window.SceneManager.renderer) return null;
        const rect = window.SceneManager.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, window.SceneManager.camera);
        const intersects = this.raycaster.intersectObjects(window.SceneManager.scene.children, true);
        if (!intersects.length) {
            if (window.THREE) {
                const plane = new THREE.Plane(new THREE.Vector3(0,1,0), 0);
                const ray = this.raycaster.ray; const target = new THREE.Vector3();
                if (ray.intersectPlane(plane, target)) return { point: target, object: null };
            }
            return null;
        }
        const allowed = ['brick','bloc','block','brique','linteau','poutre','poutre_beton','isolant','mur','wall','beton','slab','dalle'];
        let fallback = null;
        for (const inter of intersects) {
            let obj = inter.object;
            if (!obj) continue;
            while (obj && !obj.geometry && obj.parent) obj = obj.parent;
            if (!obj || !obj.geometry) continue;
            if (obj === this.tempLine || obj === this.snapSphere) continue;
            const ud = obj.userData || {};
            if (ud.type === 'glb_ghost') continue;
            const et = (ud.elementType || (ud.element && ud.element.type) || ud.type || '').toLowerCase();
            if (et === 'diba') continue; // ignorer diba existants
            if (!fallback) fallback = { point: inter.point.clone(), object: obj };
            if (allowed.includes(et)) {
                return { point: inter.point.clone(), object: obj };
            }
        }
        // Retourner un fallback (ex: mesh sans type) pour qu'on tente quand même les coins
        if (fallback) return fallback;
        return null;
    }

    findNearestCorner(intersection) { // rétro compat nom
        if (!intersection) return null;
        if (!intersection.object) return null;
        let mesh = intersection.object;
        while (mesh && !mesh.geometry && mesh.parent) mesh = mesh.parent;
        if (!mesh || !mesh.geometry) return null;
        if (mesh.userData && (mesh.userData.elementType === 'diba' || mesh.userData.type === 'diba')) return null;
    const geom = mesh.geometry; if (!geom.boundingBox) geom.computeBoundingBox();
    const bb = geom.boundingBox;
    // Rejet conditionnel: ignorer grandes BB seulement si aucun type autorisé
    const ud = mesh.userData || {};
    const et = (ud.elementType || (ud.element && ud.element.type) || ud.type || '').toLowerCase();
    const dx = bb.max.x - bb.min.x, dy = bb.max.y - bb.min.y, dz = bb.max.z - bb.min.z;
    const maxDim = Math.max(dx,dy,dz);
    const isAllowedType = ['brick','bloc','block','brique','linteau','poutre','poutre_beton','isolant','mur','wall','beton','slab','dalle'].includes(et);
    if (!isAllowedType && maxDim > 120) return null;
        const cornersLocal = [
            new THREE.Vector3(bb.min.x,bb.min.y,bb.min.z), new THREE.Vector3(bb.min.x,bb.min.y,bb.max.z),
            new THREE.Vector3(bb.min.x,bb.max.y,bb.min.z), new THREE.Vector3(bb.min.x,bb.max.y,bb.max.z),
            new THREE.Vector3(bb.max.x,bb.min.y,bb.min.z), new THREE.Vector3(bb.max.x,bb.min.y,bb.max.z),
            new THREE.Vector3(bb.max.x,bb.max.y,bb.min.z), new THREE.Vector3(bb.max.x,bb.max.y,bb.max.z)
        ];
        const cornersWorld = cornersLocal.map(c=> c.clone().applyMatrix4(mesh.matrixWorld));
        this.displayHoverCorners(mesh.uuid, cornersWorld);
        const ip = intersection.point;
        let best = null; let bestD = Infinity;
        cornersWorld.forEach(c=>{ const d = c.distanceTo(ip); if (d < bestD){ bestD=d; best=c; }});
        if (!best) return null;
        // Distance seuil: utiliser snapDistance (gère mètres vs cm)
    const threshold = this.snapDistance;
    if (!(bestD < threshold || bestD*100 < threshold)) {
            const now = performance.now();
            if (now - this._lastRejectLog > 1000) {
                this._lastRejectLog = now;
                // console.log('🚫 Coin trop loin rejeté', {dist:bestD, threshold});
            }
            return null;
        }
        return best;
    }

    showCornerHelpers(corners){
        if (!window.SceneManager || !window.THREE) return;
        // Réutiliser si même nombre, sinon reset
        if (this.cornerHelpers.length !== corners.length){
            this.clearCornerHelpers();
            const mat = new THREE.MeshBasicMaterial({color:0x33ff55});
            const geo = new THREE.SphereGeometry(0.5,8,8);
            for (let i=0;i<corners.length;i++){
                const m = new THREE.Mesh(geo, mat.clone());
                m.renderOrder = 9998;
                window.SceneManager.scene.add(m);
                this.cornerHelpers.push(m);
            }
        }
        corners.forEach((c,i)=>{ this.cornerHelpers[i].position.copy(c); this.cornerHelpers[i].visible = true; });
    }

    clearCornerHelpers(){
        if (!this.cornerHelpers.length) return;
        this.cornerHelpers.forEach(m=>{ if (window.SceneManager) window.SceneManager.scene.remove(m); m.geometry.dispose(); m.material.dispose(); });
        this.cornerHelpers = [];
    }

    displayHoverCorners(hostId, corners){
        if (!window.SceneManager || !window.THREE) return;
        if (!hostId || !corners){
            this.cornerHelpers.forEach(h=> h.visible=false);
            this._lastCornerHostId = null;
            return;
        }
        if (this._lastCornerHostId !== hostId || this.cornerHelpers.length !== corners.length){
            this.clearCornerHelpers();
            const geo = new THREE.SphereGeometry(0.55,10,10);
            for (let i=0;i<corners.length;i++){
                const mat = new THREE.MeshBasicMaterial({color:0x00c4ff});
                mat.depthTest = false; mat.depthWrite = false;
                const m = new THREE.Mesh(geo, mat);
                m.renderOrder = 9985;
                window.SceneManager.scene.add(m);
                this.cornerHelpers.push(m);
            }
            this._lastCornerHostId = hostId;
        }
        corners.forEach((c,i)=>{ const helper = this.cornerHelpers[i]; if (helper){ helper.position.copy(c); helper.visible = true; }});
    }

    toggleDebugCorners(){
        this.debugCorners = !this.debugCorners;
        if (!this.debugCorners) this.clearCornerHelpers();
        console.log('DibaTool debug corners =', this.debugCorners);
    }

    onSceneClick(e){
        if (!this.active) return;
        // Debounce: ignorer un second événement trop rapproché (click + pointerdown)
        const now = performance.now();
        if (now - this.lastAddTimestamp < 120) {
            return; // doublon probable
        }
        const inter = this.screenToWorld(e.clientX, e.clientY);
        if (!inter){ console.log('⚠️ DibaTool: aucun point intersecté'); return; }
        // D'abord tenter via dataset global
        let corner = this.getNearestSnapPoint();
        if (!corner) {
            // fallback ancienne méthode par BB de l'objet pointé
            corner = this.findNearestCorner(inter);
        }
    if (!corner){ console.log('⚠️ Aucun coin valide (clic ignoré)'); return; }
        // Si click sur premier point pour fermer
        if (this.points.length > 2 && this.points[0].distanceTo(corner) < 1) {
            console.log('🔒 Fermeture sur premier point');
            this.finishPolyline();
            return;
        }
        if (this.points.length && this.points[this.points.length-1].distanceTo(corner) < 1e-4){
            console.log('⏩ Point identique ignoré');
            return;
        }
        // Contrôle: premier point très éloigné d'un centre commun? (optionnel)
        this.points.push(corner.clone());
        this.addPointMarker(corner);
        console.log('➕ Point Diba ajouté', corner.toArray(), 'total=', this.points.length);
        this.updateTempLine();
    this.lastAddTimestamp = now;
    }

    onSceneDoubleClick(e){
        if (!this.active) return;
        // Empêcher sélection texte / double actions
        e.preventDefault();
        this.finishPolyline();
    }

    onSceneMove(e){
        if (!this.active || !window.THREE) return;
        const inter = this.screenToWorld(e.clientX, e.clientY);
    if (!inter) { this.updateSnapSphere(null); this.displayHoverCorners(null,null); return; }
    let corner = this.getNearestSnapPoint();
    if (!corner) corner = this.findNearestCorner(inter);
        this.updateSnapSphere(corner);
    }

    updateSnapSphere(pos){
        if (!window.THREE) return;
        if (!this.snapSphere){
            const geo = new THREE.SphereGeometry(0.8,12,12);
            const mat = new THREE.MeshBasicMaterial({color:0xffaa00});
            mat.depthTest = false; mat.depthWrite = false;
            this.snapSphere = new THREE.Mesh(geo, mat);
            this.snapSphere.renderOrder = 9999;
            if (window.SceneManager && window.SceneManager.scene) window.SceneManager.scene.add(this.snapSphere);
        }
        if (!pos){ this.snapSphere.visible = false; return; }
        this.snapSphere.position.copy(pos);
        this.snapSphere.visible = true;
    }

    createTempLine(){
        if (!window.SceneManager || !window.SceneManager.scene || !window.THREE) return;
        if (this.tempLine){
            window.SceneManager.scene.remove(this.tempLine);
            this.tempLine.geometry.dispose();
            this.tempLine.material.dispose();
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute([],3));
        const mat = new THREE.LineBasicMaterial({ color: 0xffc800 });
        mat.depthTest = false; mat.depthWrite = false; mat.transparent = true; mat.opacity = 0.95;
        this.tempLine = new THREE.Line(geo, mat);
        this.tempLine.renderOrder = 9990;
        this.tempLine.visible = false;
        window.SceneManager.scene.add(this.tempLine);
    }

    updateTempLine(){
        if (!this.tempLine || !window.THREE) return;
        if (this.points.length < 2){
            this.tempLine.visible = false;
            return;
        }
        const posArray = new Float32Array(this.points.length * 3);
        for (let i=0;i<this.points.length;i++){
            const p = this.points[i];
            posArray[i*3] = p.x; posArray[i*3+1]=p.y; posArray[i*3+2]=p.z;
        }
        this.tempLine.geometry.setAttribute('position', new THREE.BufferAttribute(posArray,3));
        this.tempLine.geometry.computeBoundingSphere();
        this.tempLine.visible = true;
    }

    disposeTemp(){
        if (this.tempLine){
            window.SceneManager.scene.remove(this.tempLine);
            this.tempLine.geometry.dispose();
            this.tempLine.material.dispose();
            this.tempLine = null;
        }
        this.pointMarkers.forEach(m=>{ if (m.parent) m.parent.remove(m); if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); });
        this.pointMarkers = [];
        if (this.snapSphere){
            window.SceneManager.scene.remove(this.snapSphere);
            this.snapSphere.geometry.dispose();
            this.snapSphere.material.dispose();
            this.snapSphere = null;
        }
        this.clearCornerHelpers();
    }

    addPointMarker(pos){
        if (!window.THREE || !window.SceneManager) return;
        const geo = new THREE.SphereGeometry(1.2,12,12);
        const mat = new THREE.MeshBasicMaterial({color:0xff6600});
        mat.depthTest = false; mat.depthWrite = false; mat.transparent = true; mat.opacity = 1;
        const marker = new THREE.Mesh(geo, mat);
        marker.position.copy(pos);
        marker.renderOrder = 9995;
        window.SceneManager.scene.add(marker);
        this.pointMarkers.push(marker);
    }

    finishPolyline(){
        if (this.points.length < 2){
            alert('Au moins 2 points requis.');
            this.deactivate(false); return;
        }
        // demander extrusion
        this.askExtrusionParameters();
    }

    askExtrusionParameters(){
    const modal = document.createElement('div');
        modal.className='modal';
        modal.style.display='block';
    modal.innerHTML = `\n            <div class="modal-content" style="max-width:360px">\n                <div class="modal-header"><h3>Diba - Extrusion</h3><button class="close-btn" id="closeDibaModal">&times;</button></div>\n                <div class="modal-body">\n                    <label>Direction :</label>\n                    <select id="dibaDirection">\n                        <option value="X">Droite</option>\n                        <option value="-X">Gauche</option>\n                        <option value="Z">Avant</option>\n                        <option value="-Z">Arrière</option>\n                    </select>\n                    <label style="margin-top:8px;display:block;">Longueur extrusion (cm)</label>\n                    <input type="number" id="dibaLength" value="${this.extrusionLength}" min="1" max="200" step="1" />\n                    <label style="margin-top:8px;display:block;">Épaisseur membrane (cm)</label>\n                    <input type="number" id="dibaThickness" value="${this.thickness}" min="0.1" max="2" step="0.1" />\n                </div>\n                <div class="modal-footer">\n                    <button class="btn btn-secondary" id="cancelDiba">Annuler</button>\n                    <button class="btn btn-primary" id="confirmDiba">Créer</button>\n                </div>\n            </div>`;
        document.body.appendChild(modal);
        modal.querySelector('#closeDibaModal').onclick = ()=>{ modal.remove(); this.deactivate(false); };
        modal.querySelector('#cancelDiba').onclick = ()=>{ modal.remove(); this.deactivate(false); };
        modal.querySelector('#confirmDiba').onclick = ()=>{
            const dirVal = modal.querySelector('#dibaDirection').value;
            const len = parseFloat(modal.querySelector('#dibaLength').value);
            const thick = parseFloat(modal.querySelector('#dibaThickness').value);
            this.extrusionLength = len; this.thickness = thick;
            this.extrusionDirection = new THREE.Vector3(
                dirVal.includes('X') ? (dirVal.startsWith('-')?-1:1) : 0,
                dirVal.includes('Y') ? (dirVal.startsWith('-')?-1:1) : 0,
                dirVal.includes('Z') ? (dirVal.startsWith('-')?-1:1) : 0
            ).normalize();
            modal.remove();
            this.buildDiba();
        };
    }

    buildDiba(){
        // Construire un ruban en extrudant la polyligne le long de la direction choisie
        // Approche: créer deux bandes (origine et extrudée) puis faces
        const pts = this.points;
        const dir = this.extrusionDirection.clone();
        const len = this.extrusionLength; // cm
        const thickness = this.thickness; // cm
        // Convertir cm -> unités scène (supposé cm déjà)
        const offset = dir.clone().multiplyScalar(len);
        const normalThickness = new THREE.Vector3();
        // approximate horizontal normal for width of membrane (if dir vertical Y, use XY plane normal from path)
        if (Math.abs(dir.y) > 0.5) {
            // vertical extrusion: thickness applied in horizontal plane per segment orientation
            // We'll create a simplistic rectangle per segment merged
        }
        // Simpler: create geometry using shape (2D) extruded via custom implementation along dir
        const vertices = [];
        const indices = [];
        for (let i=0;i<pts.length;i++){
            const p = pts[i];
            const p2 = p.clone().add(offset);
            // create a quad for thickness by duplicating with small lateral offset perpendicular to dir and path direction
            let lateral = new THREE.Vector3(0,1,0);
            if (Math.abs(dir.y)>0.9) {
                // choose lateral from path direction projected on XZ
                if (i < pts.length-1) {
                    const forward = pts[i+1].clone().sub(p); forward.y=0; if (forward.length()<0.001) forward.set(1,0,0); forward.normalize();
                    lateral = new THREE.Vector3(-forward.z,0,forward.x); // perpendicular horizontal
                } else if (i>0){
                    const back = p.clone().sub(pts[i-1]); back.y=0; if (back.length()<0.001) back.set(1,0,0); back.normalize();
                    lateral = new THREE.Vector3(-back.z,0,back.x);
                }
            } else {
                lateral = new THREE.Vector3(0,1,0); // vertical lateral for horizontal extrusion
            }
            lateral.normalize().multiplyScalar(thickness/2);
            const pL = p.clone().add(lateral);
            const pR = p.clone().sub(lateral);
            const p2L = p2.clone().add(lateral);
            const p2R = p2.clone().sub(lateral);
            const baseIndex = vertices.length/3;
            // push four vertices order: pL,pR,p2L,p2R
            [pL,pR,p2L,p2R].forEach(v=>{vertices.push(v.x,v.y,v.z);});
            // indices for two faces linking segment i to previous segment (except first)
            if (i>0){
                const biPrev = baseIndex-4;
                // face externe
                indices.push(biPrev, biPrev+2, baseIndex+2);
                indices.push(biPrev, baseIndex+2, baseIndex);
                // face interne
                indices.push(biPrev+1, baseIndex+1, baseIndex+3);
                indices.push(biPrev+1, baseIndex+3, biPrev+3);
                // dessus
                indices.push(biPrev, baseIndex, baseIndex+1);
                indices.push(biPrev, baseIndex+1, biPrev+1);
                // dessous
                indices.push(biPrev+2, biPrev+3, baseIndex+3);
                indices.push(biPrev+2, baseIndex+3, baseIndex+2);
            }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices,3));
        geo.setIndex(indices);
        geo.computeVertexNormals();
    const mat = window.MaterialLibrary ? window.MaterialLibrary.getThreeJSMaterial(this.materialId) : new THREE.MeshStandardMaterial({color:0x111111});
        if (mat) { mat.side = THREE.DoubleSide; mat.transparent=false; }
        const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { elementType: 'diba', type:'diba', preserveCustomY: true };
        window.SceneManager.scene.add(mesh);
        // Calcul longueur développée de la polyligne
        let pathLen = 0;
        for (let i=1;i<pts.length;i++){ pathLen += pts[i].distanceTo(pts[i-1]); }
        // Volume approché (cm^3) : longueur * épaisseur * extrusionLength (toutes en cm) => convertir en m3 si besoin dans getVolume
        const volumeCm3 = pathLen * thickness * len;
        // Élément métré
        const element = { 
            id: 'diba_'+Math.random().toString(36).substr(2,9), 
            type: 'diba', 
            mesh: mesh, 
            position: pts[0].clone(), 
            dimensions: { length: pathLen, width: thickness, height: len },
            preserveCustomY: true,
            getVolume: function(){ return volumeCm3 / 1000000; }, // m3
            getMass: function(){ return 0; }, // masse négligeable (ou définir densité si souhaité)
            dispose: function(){
                try {
                    if (this.mesh) {
                        if (typeof this.mesh.traverse === 'function') {
                            this.mesh.traverse((child)=>{
                                try {
                                    child.geometry?.dispose?.();
                                    const m = child.material;
                                    if (Array.isArray(m)) m.forEach(mm=>mm && mm.dispose && mm.dispose());
                                    else if (m) m.dispose && m.dispose();
                                } catch(_) {}
                            });
                        }
                        if (this.mesh.geometry) this.mesh.geometry.dispose();
                        if (this.mesh.material) {
                            if (Array.isArray(this.mesh.material)) this.mesh.material.forEach(mm=>mm && mm.dispose && mm.dispose());
                            else this.mesh.material.dispose();
                        }
                    }
                } catch(_) {}
            },
            toJSON: function(){
                return {
                    id: this.id,
                    type: this.type,
                    material: element.material,
                    position: { x: this.position.x, y: this.position.y, z: this.position.z },
                    dimensions: this.dimensions,
                    pathPoints: pts.map(p=>({x:p.x,y:p.y,z:p.z})),
                    extrusion: { direction: { x: dir.x, y: dir.y, z: dir.z }, length: len, thickness: thickness }
                };
            }
        };
        // Enregistrer dans SceneManager.elements pour le métré
        mesh.userData.element = element;
        element.material = this.materialId;
        if (window.SceneManager) {
            // Utiliser méthode standard si disponible
            if (typeof window.SceneManager.addElement === 'function') {
                try { window.SceneManager.addElement(element); } catch(e){ console.warn('addElement a échoué pour Diba', e); }
            } else {
                if (!window.SceneManager.elements) window.SceneManager.elements = new Map();
                try { window.SceneManager.elements.set(element.id, element); } catch(e){ console.warn('Impossible d\'ajouter l\'élément Diba à SceneManager.elements', e); }
            }
        }
        if (window.LayerManager) window.LayerManager.onElementAdded(mesh, 'diba');
        // Injection directe dans le métré si gestionnaire présent
        if (window.MetreTabManager && window.MetreTabManager.elements instanceof Map) {
            try { window.MetreTabManager.elements.set(element.id, window.MetreTabManager.processElement(element)); } catch(e){}
            if (window.MetreTabManager.isTabActive()) {
                try { window.MetreTabManager.refreshTable(); } catch(e){}
            }
        }
        // Émettre un événement standard pour déclencher rafraîchissements éventuels
    try { document.dispatchEvent(new CustomEvent('elementPlaced', { detail: { element } })); } catch(e){}
    // Notifier aussi le système global pour métré / autres vues
    try { document.dispatchEvent(new CustomEvent('sceneChanged', { detail: { source: 'dibaTool', element } })); } catch(e){}
        console.log('✅ Diba créée avec', pts.length, 'points');
        this.disposeTemp();
        this.deactivate(true);
    }

    // ------------------------------------------------------------------
    //           Gestion des points d'accrochage (global snapshot)
    // ------------------------------------------------------------------
    isElementValidForSnap(el){
        if (!el) return false;
        const t = (el.type || '').toLowerCase();
        if (t === 'diba') return false; // ne pas snapper sur autres diba
        // Types autorisés similaires measurement-tool (simplifié)
        const allowed = ['brick','bloc','block','brique','linteau','poutre','poutre_beton','isolant','mur','wall','beton','slab','dalle'];
        return allowed.includes(t);
    }

    collectSnapPoints(){
        this.snapPoints = [];
        if (!window.SceneManager || !window.SceneManager.elements || !window.THREE) return;
        const elems = window.SceneManager.elements;
        if (elems instanceof Map) {
            elems.forEach((el,id)=>{ this._collectSnapForElement(el,id); });
        } else if (Array.isArray(elems)) {
            elems.forEach(el=>{ if (el && el.id) this._collectSnapForElement(el, el.id); });
        } else if (typeof elems === 'object') {
            for (const id in elems){ if (Object.prototype.hasOwnProperty.call(elems,id)) this._collectSnapForElement(elems[id], id); }
        }
        // Logging concis
        console.log('DibaTool: snapPoints collectés =', this.snapPoints.length);
    }

    _collectSnapForElement(el,id){
        if (!this.isElementValidForSnap(el)) return;
        if (!el.mesh || !el.mesh.geometry) return;
        const mesh = el.mesh;
        const geom = mesh.geometry;
        if (!geom.boundingBox) geom.computeBoundingBox();
        const bb = geom.boundingBox;
        const cornersLocal = [
            new THREE.Vector3(bb.min.x,bb.min.y,bb.min.z), new THREE.Vector3(bb.min.x,bb.min.y,bb.max.z),
            new THREE.Vector3(bb.min.x,bb.max.y,bb.min.z), new THREE.Vector3(bb.min.x,bb.max.y,bb.max.z),
            new THREE.Vector3(bb.max.x,bb.min.y,bb.min.z), new THREE.Vector3(bb.max.x,bb.min.y,bb.max.z),
            new THREE.Vector3(bb.max.x,bb.max.y,bb.min.z), new THREE.Vector3(bb.max.x,bb.max.y,bb.max.z)
        ];
        for (const c of cornersLocal){
            const world = c.clone().applyMatrix4(mesh.matrixWorld);
            this.snapPoints.push({ position: world, elementId: id, elementType: el.type });
        }
    }

    getNearestSnapPoint(){
        if (!this.snapPoints.length || !window.SceneManager || !window.SceneManager.camera) return null;
        const cam = window.SceneManager.camera;
        // Utiliser la position souris normalisée (this.mouse déjà MAJ dans screenToWorld)
        // Calculer distance écran (NDC) coin-souris
        let best = null; let bestD = Infinity;
        const ndcMouse = this.mouse; // x,y ∈ [-1,1]
        const v = new THREE.Vector3();
        for (const sp of this.snapPoints){
            v.copy(sp.position).project(cam); // v.x,v.y in NDC
            const dx = v.x - ndcMouse.x;
            const dy = v.y - ndcMouse.y;
            const d2 = dx*dx + dy*dy;
            if (d2 < bestD){ bestD = d2; best = sp.position; }
        }
        if (!best) return null;
        // Seuil NDC: 0.04^2 ~ zone ~40px sur large écran (approx). Ajuster selon zoom
        if (bestD > 0.04*0.04) return null;
        return best.clone();
    }
}

window.addEventListener('DOMContentLoaded', ()=>{ window.DibaTool = new DibaTool(); });

// Sélection depuis la bibliothèque
// Quand l'utilisateur clique sur un item data-type="DIBA" dans subtab etancheite
// TabManager gère déjà la sélection; on rajoute un listener simple:
document.addEventListener('click', (e)=>{
    const item = e.target.closest('.library-item[data-type="diba"]');
    if (item){
        if (window.ConstructionTools) window.ConstructionTools.currentMode = 'diba';
        document.dispatchEvent(new CustomEvent('dibaStart'));
    }
});
