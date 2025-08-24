// Configuration et imports Three.js avec modules ES6
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Rendre THREE disponible globalement pour compatibilité avec le code existant
window.THREE = THREE;
window.OrbitControls = OrbitControls;

// Vérifier que Three.js est bien chargé
console.log('✅ Three.js chargé:', THREE.REVISION);
console.log('✅ OrbitControls chargé');

// Event pour signaler que Three.js est prêt
window.dispatchEvent(new CustomEvent('threejs-ready', {
    detail: { THREE, OrbitControls }
}));
