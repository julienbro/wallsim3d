/* Centralized log filtering utility
 * Usage:
 *  - Default level = 2 (info): hides verbose debug spam decorated with emojis / markers
 *  - ?debug=0 => silent (only errors & warns still visible via native methods)
 *  - ?debug=1 => warnings + errors
 *  - ?debug=2 => info (normal) + warnings + errors (DEFAULT)
 *  - ?debug=3 or ?debug=all => full logs (original behavior)
 *  - window.setDebugLevel(n) to change at runtime (persists in localStorage)
 */
(function(){
  const levelNames = {0:'silent',1:'warn',2:'info',3:'debug'};
  let level = 2;
  try {
    const stored = localStorage.getItem('DEBUG_LEVEL');
    if(stored !== null && !isNaN(parseInt(stored))) level = parseInt(stored);
  } catch(e) {}
  const m = location.search.match(/[?&]debug=([^&]+)/);
  if(m){
    const raw = decodeURIComponent(m[1]);
    if(raw === 'all') level = 3; else if(!isNaN(parseInt(raw))) level = parseInt(raw);
  }
  const original = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    debug: (console.debug||console.log).bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console)
  };
  // Ensemble extensible de marqueurs identifiant les logs verbeux
  const debugMarkers = [
    '🔧','🔗','🎨','🔍','[ADD]','MetreTabManager','Mise à jour des grilles','Joint horizontal automatique',
    '[SCENE-MANAGER]','[CONSTRUCTION]','[STL]','[EXPORT]','[DIAG]','[GRID]','[PERF]','[TRACE]',
    // Ajouts pour réduire le bruit en niveau 2 (considérés comme debug => visibles seulement niveau 3)
  '👻','🧱','🧊','🧥👻','[ISO-GHOST]','Fantôme créé','Fantôme: Options','MODE BLOC',
  // Logs assises (bruitus)
  '🏗️','[DEBUG-ASSISE]','Type assise actuel','Mise en surbrillance de l\'élément','Utilisation du type spécifique sélectionné',
  // Suggestions/placements/UX boutons
  '[DEBUG-SUGGESTIONS]','BOUTON AJOUT ASSISE','EXCLUSIONS:',
  // Debug calcul joints
  'Aucune position de joint calculée','Aucun élément cible trouvé pour la surbrillance',
  // TabManager / GLB ghost / placement debug
  'TabManager contient un type non-brique IGNORÉ','Sélection TabManager non-brique ignorée',
  'Création d\'un fantôme GLB','DEBUG PLACEMENT','PLACEMENT DEBUG',
  // Debug joints & isolation UI
  '[JOINT-DBG]','Isolant défini','Déjà en mode insulation','🔄'
  ];
  const customMutedPrefixes = new Set();
  function isDebugMessage(args){
    if(!args.length) return false;
    const first = args[0];
    if(typeof first !== 'string') return true; // non-string logs treat as debug to be safe
    // Silencieux si préfixe explicitement muté
    for (const p of customMutedPrefixes){
      if (first.startsWith(p)) return true; // traiter comme debug (sera filtré selon level)
    }
    return debugMarkers.some(mark => first.includes(mark));
  }
  // Liste de marqueurs à supprimer complètement (aucune sortie, quel que soit le niveau)
  const alwaysMute = ['🔧','🔗','🎨','🔍','✅','🏥','📊', 'Live reload enabled'];
  function allow(kind, args){
    if(kind === 'error' || kind === 'warn') return level >= 1; // always show warns/errors if level>=1
    if(kind === 'info') return level >= 2;
    // kind is 'log' or 'debug' or reclassified
    const debugLike = isDebugMessage(args);
    if(debugLike) return level >= 3;
    // treat as info if not classified as debug
    return level >= 2;
  }
    console.warn = wrap('warn');
    console.error = wrap('error');
  function wrap(kind){
    return function(...args){
      if(args.length && typeof args[0] === 'string'){
        const msg = args[0];
        if(alwaysMute.some(m=> msg.includes(m))) return; // suppression totale
      }
      if(!allow(kind, args)) return;
      original[kind === 'reclassified-info' ? 'info' : (original[kind] ? kind : 'log')](...args);
    };
  }
  console.log = wrap('log');
  console.debug = wrap('debug');
  console.info = wrap('info');
  // keep warn & error untouched
  window.setDebugLevel = function(n){
    if(typeof n === 'string') n = parseInt(n);
    if(isNaN(n) || n<0 || n>3) { original.warn('[log-filter] Niveau invalide', n); return; }
    level = n; try { localStorage.setItem('DEBUG_LEVEL', String(n)); } catch(e) {}
    original.info('[log-filter] Niveau debug changé =>', n, '('+levelNames[n]+')');
  };
  // Ajouter dynamiquement un marqueur de debug
  window.addDebugMarker = function(marker){
    if(!marker || debugMarkers.includes(marker)) return;
    debugMarkers.push(marker);
    original.info('[log-filter] Marqueur ajouté:', marker);
  };
  // Ajouter plusieurs marqueurs
  window.addDebugMarkers = function(arr){
    if(!Array.isArray(arr)) return;
    arr.forEach(m=>{ if(m && !debugMarkers.includes(m)) debugMarkers.push(m); });
    original.info('[log-filter] Marqueurs ajoutés. Total =', debugMarkers.length);
  };
  // Lister marqueurs
  window.listDebugMarkers = function(){ return debugMarkers.slice(); };
  // Muter un préfixe explicite (ex: mutePrefix('[SCENE-MANAGER]'))
  window.mutePrefix = function(prefix){ if(prefix) { customMutedPrefixes.add(prefix); original.info('[log-filter] Préfixe muté:', prefix); } };
  window.unmutePrefix = function(prefix){ if(prefix && customMutedPrefixes.delete(prefix)) original.info('[log-filter] Préfixe démuté:', prefix); };
  window.listMutedPrefixes = function(){ return Array.from(customMutedPrefixes); };
  // Force un log immédiat en contournant le filtre
  window.forceLog = function(...args){ original.log('[force]', ...args); };
  // Exposer un helper pour bloc instrumenté: withDebug(()=>{ ... })
  window.withDebug = function(fn){
    const prev = level; level = 3; try { fn(); } finally { level = prev; }
  };
  // Banner initial masqué pour réduire le bruit console. Activer ci-dessous si besoin:
  // if(level >= 3) original.info('[log-filter] Actif. Niveau =', level, '('+levelNames[level]+')  (/index.html?debug=0|1|2|3|all)  API: setDebugLevel(n)');
})();
