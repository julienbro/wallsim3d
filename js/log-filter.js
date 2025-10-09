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
  // Par défaut plus silencieux: uniquement warn+error
  let level = 1;
  try {
    const stored = localStorage.getItem('DEBUG_LEVEL');
    if(stored !== null && !isNaN(parseInt(stored))) level = parseInt(stored);
  } catch(e) {}
  const m = location.search.match(/[?&]debug=([^&]+)/);
  if(m){
    const raw = decodeURIComponent(m[1]);
    if(raw === 'all') level = 3; else if(!isNaN(parseInt(raw))) level = parseInt(raw);
  }
  // Option pour garder les messages [Violation] (par défaut: masqués)
  let keepViolations = false;
  try {
    const kv = location.search.match(/[?&](keepviolations|violations)=([^&]+)/);
    if(kv){ keepViolations = kv[2] === '1' || kv[2] === 'true'; }
    // Autoriser aussi via localStorage entre sessions
    if(!kv){
      const storedKV = localStorage.getItem('KEEP_VIOLATIONS');
      if(storedKV === '1' || storedKV === 'true') keepViolations = true;
    }
  } catch(e) {}
  const original = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    debug: (console.debug||console.log).bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console)
  };
  // Contrôle des logs "forcés" (instrumentation) — désactivés par défaut
  let forceLogsEnabled = false;
  try {
    const fp = location.search.match(/[?&](forcelog|force_logs|force)=([^&]+)/i);
    if(fp){ forceLogsEnabled = fp[2] === '1' || fp[2].toLowerCase() === 'true'; }
    if(!fp){
      const storedFL = localStorage.getItem('FORCE_LOGS');
      if(storedFL === '1' || (storedFL||'').toLowerCase() === 'true') forceLogsEnabled = true;
    }
  } catch(e) {}
  // Ensemble extensible de marqueurs identifiant les logs verbeux
  const debugMarkers = [
    '🔧','🔗','🎨','🔍','[ADD]','MetreTabManager','Mise à jour des grilles','Joint horizontal automatique',
    '[SCENE-MANAGER]','[CONSTRUCTION]','[STL]','[EXPORT]','[DIAG]','[GRID]','[PERF]','[TRACE]',
    // Ajouts pour réduire le bruit en niveau 2 (considérés comme debug => visibles seulement niveau 3)
  '👻','🧱','🧊','🧥👻','[ISO-GHOST]','Fantôme créé','Fantôme: Options','MODE BLOC','🧪','JOINT-DEBUG',
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
  '[JOINT-DBG]','Isolant défini','Déjà en mode insulation','🔄',
  // Debug détection blocs (BC5, BC-CORRECTION, etc.)
  '[BC5-DEBUG]','[BC-CORRECTION]','[DIRECT]','[ARGEX-DEBUG]',
  'DÉBUT DÉTECTION detectBlockSubType','Element passé:','détecté via blockType'
  ];
  const customMutedPrefixes = new Set([
    '[LOG][SceneManager]',
    '🧪 JOINT-DEBUG',
    '[DEBUG-SUGGESTIONS]'
  ]);
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
  const alwaysMute = ['🔧','🔗','🎨','🔍','✅','🏥','📊', 'Live reload enabled',
    'Bouton pinceau non trouvé', 'PATCH: Élément', 'non trouvé',
    // Nettoyage console supplémentaire (navigateur / extensions)
    // Ces messages sont souvent générés par DevTools/Extensions et ne reflètent pas
    // un problème applicatif; on les masque par défaut sauf keepViolations=1
    '[Violation]', // ex: 'requestAnimationFrame handler took <N>ms', 'click handler took <N>ms', forced reflow
    'Forced reflow while executing JavaScript',
    'Content Script: Initializing',
    'content loaded'
  ];
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
        // suppression totale, avec possibilité de conserver les [Violation]
        if(alwaysMute.some(m=> msg.includes(m))){
          if(keepViolations && msg.includes('[Violation]')){
            // Ne pas supprimer si l'utilisateur a demandé de garder les [Violation]
          } else {
            return;
          }
        }
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
  window.forceLog = function(...args){
    if(!forceLogsEnabled) return; // silencieux par défaut
    original.log('[force]', ...args);
  };
  // Permettre d'activer/désactiver dynamiquement les logs forcés
  window.enableForceLogs = function(v){
    forceLogsEnabled = !!v;
    try { localStorage.setItem('FORCE_LOGS', forceLogsEnabled ? '1' : '0'); } catch(e){}
    if(forceLogsEnabled) original.info('[log-filter] FORCE_LOGS activés');
  };
  // Exposer un helper pour bloc instrumenté: withDebug(()=>{ ... })
  window.withDebug = function(fn){
    const prev = level; level = 3; try { fn(); } finally { level = prev; }
  };
  // Banner initial masqué pour réduire le bruit console. Activer ci-dessous si besoin:
  // if(level >= 3) original.info('[log-filter] Actif. Niveau =', level, '('+levelNames[level]+')  (/index.html?debug=0|1|2|3|all)  API: setDebugLevel(n)');
  // Aide rapide pour tout nettoyer: window.quietConsole()
  window.quietConsole = function(){ try { window.setDebugLevel(1); window.addDebugMarkers(['🧪','JOINT-DEBUG']); window.mutePrefix('[LOG][SceneManager]'); } catch(e){} };
  // Basculer l'affichage des [Violation]
  window.setKeepViolations = function(v){ keepViolations = !!v; try { localStorage.setItem('KEEP_VIOLATIONS', keepViolations ? '1':'0'); } catch(e){} };
})();
