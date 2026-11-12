/* Brumeval — aventure de récolte et de quêtes (jeu original) */
'use strict';
(function () {
  const $ = (s) => document.querySelector(s);
  const T = 40, W = 72, H = 54, CH = 16;
  const SAVE_KEY = 'brumeval-save-v1';
  const hn = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ===================== Données ===================== */
  const ITEMS = {
    bois: { name: 'Bois', icon: '🪵', price: 2 },
    pierre: { name: 'Pierre', icon: '🪨', price: 3 },
    baies: { name: 'Baies', icon: '🫐', price: 4 },
    champignon: { name: 'Champignon', icon: '🍄', price: 6 },
    fer: { name: 'Minerai de fer', icon: '🔩', price: 10 },
    poisson: { name: 'Poisson', icon: '🐟', price: 12 },
    cristal: { name: 'Cristal', icon: '💎', price: 30 },
  };
  const ITEM_KEYS = Object.keys(ITEMS);

  const NODE = {
    tree:     { tool: 'axe',     hp: 3, item: 'bois',       n: 1, respawn: 40,  r: 13, label: 'Couper',   solid: true },
    pine:     { tool: 'axe',     hp: 3, item: 'bois',       n: 1, respawn: 40,  r: 13, label: 'Couper',   solid: true },
    rock:     { tool: 'pickaxe', hp: 4, item: 'pierre',     n: 1, respawn: 55,  r: 16, label: 'Miner',    solid: true },
    iron:     { tool: 'pickaxe', hp: 5, item: 'fer',        n: 1, respawn: 80,  r: 16, label: 'Miner',    solid: true },
    crystal:  { tool: 'steel',   hp: 4, item: 'cristal',    n: 1, respawn: 100, r: 14, label: 'Miner',    solid: true },
    bush:     { tool: null,      hp: 1, item: 'baies',      n: 2, respawn: 35,  r: 13, label: 'Cueillir', solid: true },
    mushroom: { tool: null,      hp: 1, item: 'champignon', n: 1, respawn: 45,  r: 8,  label: 'Ramasser', solid: false },
    fish:     { tool: 'rod',     hp: 1, item: 'poisson',    n: 1, respawn: 18,  r: 0,  label: 'Pêcher',   solid: false, range: 100 },
    boulder:  { tool: 'steel',   hp: 6, item: 'pierre',     n: 3, respawn: 0,   r: 21, label: 'Briser',   solid: true },
  };

  const LOOKS = {
    player:  { skin: '#f3c9a0', hair: '#a4532a', shirt: '#2f5f9e', pants: '#d8c7a3', style: 'short', hero: true },
    ondine:  { skin: '#efc4a4', hair: '#e4e4ee', shirt: '#7d5ba6', pants: '#54406e', style: 'bun', robe: true },
    barnabe: { skin: '#e2a982', hair: '#7a3b1e', shirt: '#8a6a4a', pants: '#3e3a36', style: 'bald', beard: '#7a3b1e', apron: '#5a4636' },
    gus:     { skin: '#f0c79c', hair: '#2e2a26', shirt: '#2f8f7c', pants: '#5b4a3b', style: 'short', hat: '#7a5a3a' },
    pip:     { skin: '#f6d2ae', hair: '#e0a040', shirt: '#e8c34a', pants: '#3b6a8c', style: 'short', straw: true },
    mira:    { skin: '#e9b98f', hair: '#b4472f', shirt: '#4f9a5d', pants: '#355e3b', style: 'long' },
  };

  const NPCS = [
    { id: 'ondine', name: 'Ondine', role: 'Doyenne du village', portrait: '👵', tx: 15.7, ty: 25.3,
      idle: ['Le Cristal de la place veillait sur nous depuis des siècles…', 'La Brume ne fait de mal à personne, mais elle endort tout.', 'Prends soin de toi, petit.'] },
    { id: 'barnabe', name: 'Barnabé', role: 'Forgeron', portrait: '🧔', tx: 21.2, ty: 25.3, shop: 'forge',
      idle: ['Le métal, ça ne ment jamais.', 'Une bonne pioche, c’est la moitié du travail !', 'Hmpf. Du fer. Il me faut toujours plus de fer.'] },
    { id: 'gus', name: 'Gus', role: 'Marchand ambulant', portrait: '🧑‍🌾', tx: 12.9, ty: 30.2, shop: 'gus',
      idle: ['J’achète tout, je vends de tout ! Enfin… presque tout.', 'Les affaires reprennent, grâce à toi !', 'Tu as vu ma lanterne ? Une petite merveille.'] },
    { id: 'pip', name: 'Pip', role: 'Pêcheur', portrait: '🧒', tx: 19.6, ty: 39.4,
      idle: ['Le lac est plein de poissons… si seulement j’avais une canne.', 'Chut ! Tu vas faire fuir les truites.', 'Un jour je pêcherai le Grand Brochet de Brumeval !'] },
    { id: 'mira', name: 'Mira', role: 'Herboriste', portrait: '👩‍🦰', tx: 46.6, ty: 38.6,
      idle: ['La forêt de pins regorge de trésors pour qui sait regarder.', 'Les champignons rouges poussent à l’ombre des pins.', 'Respire… tu sens la résine ?'] },
  ];

  const QUESTS = [
    { id: 'q1', giver: 'ondine', title: 'Un nouveau départ', goal: 'Rapporte du bois à Ondine.', needs: { bois: 6 }, reward: { coins: 15 },
      intro: ['Oh ! Un voyageur… Bienvenue à Brumeval, ou à ce qu’il en reste.', 'Depuis que la Brume s’est levée, le village s’endort. Même le Cristal de la place s’est éteint.', 'Tu veux nous aider ? Rapporte-moi 6 bûches. Approche-toi d’un arbre et garde E appuyé pour le couper.'],
      done: ['Merci ! Ça sent déjà le feu de cheminée.', 'Va voir Barnabé, le forgeron, juste à côté. Il aura du travail pour toi.'], unlock: ['q2'] },
    { id: 'q2', giver: 'barnabe', title: 'Le marteau et l’enclume', goal: 'Apporte du bois pour rallumer la forge.', needs: { bois: 4 }, reward: { coins: 10, tool: 'pickaxe' },
      intro: ['Hmpf. Ma forge est froide depuis des semaines.', 'Ramène-moi 4 bûches pour la rallumer, et je te forgerai une pioche.'],
      done: ['Ha ! Écoute-moi ce feu ronfler !', 'Tiens, ta pioche toute neuve. Avec ça, tu peux casser les rochers gris.', 'Et maintenant que la forge tourne, passe me voir pour améliorer tes outils.'], unlock: ['q3'] },
    { id: 'q3', giver: 'ondine', title: 'Le vieux pont', goal: 'Réunis de quoi réparer le pont de l’est.', needs: { bois: 12, pierre: 8 }, reward: { coins: 30, flag: 'bridge' },
      intro: ['Le pont sur la rivière s’est effondré pendant la dernière tempête.', 'De l’autre côté, il y a la Forêt des Pins et les mines de fer.', 'Rapporte-moi 12 bûches et 8 pierres, et le village le reconstruira.'],
      done: ['Les villageois se mettent au travail… Et voilà, le pont est réparé !', 'L’est t’est ouvert. Mira l’herboriste campe là-bas, et Pip le pêcheur aurait besoin d’aide au lac.'], unlock: ['q4', 'q5', 'q6'] },
    { id: 'q4', giver: 'mira', title: 'Remèdes de la forêt', goal: 'Cueille des baies et des champignons.', needs: { baies: 6, champignon: 4 }, reward: { coins: 25, upgrade: 'boots' },
      intro: ['Bonjour, voyageur ! Je prépare des remèdes contre la fatigue de la Brume.', 'Il me faudrait 6 baies et 4 champignons rouges. On en trouve dans la Forêt des Pins.'],
      done: ['Parfait, quelle belle cueillette !', 'Prends ces Bottes de vent : tu courras bien plus vite.'] },
    { id: 'q5', giver: 'pip', title: 'Le pêcheur sans canne', goal: 'Aide Pip à fabriquer une canne à pêche.', needs: { bois: 3, fer: 2 }, reward: { tool: 'rod' },
      intro: ['Ma canne s’est cassée en attrapant un énorme poisson ! Enfin… je crois qu’il était énorme.', 'Avec 3 bûches et 2 minerais de fer, je pourrais en fabriquer deux : une pour moi, une pour toi !'],
      done: ['Et hop ! Deux cannes toutes neuves.', 'Tiens, la tienne. Approche-toi des remous dans le lac et appuie sur E.'], unlock: ['q5b'] },
    { id: 'q5b', giver: 'pip', title: 'Le grand repas', goal: 'Pêche des poissons pour le village.', needs: { poisson: 4 }, reward: { coins: 50 },
      intro: ['Le village prépare un grand repas pour fêter le pont !', 'Tu pourrais pêcher 4 poissons ? Moi je surveille… heu… la météo.'],
      done: ['Wouah ! Le village va se régaler. Merci !'] },
    { id: 'q6', giver: 'barnabe', title: 'L’acier des profondeurs', goal: 'Rapporte du fer et de la pierre au forgeron.', needs: { fer: 6, pierre: 5 }, reward: { tool: 'steel' },
      intro: ['Tu as entendu parler de la grotte au nord-est ? Un éboulement en bloque l’entrée.', 'Ta pioche est trop faible pour ces rochers. Rapporte-moi 6 minerais de fer et 5 pierres, et je te forgerai une pioche d’acier.'],
      done: ['Regarde-moi cet acier ! Rien ne lui résistera.', 'Va parler à Ondine : elle sait ce qui se cache dans cette grotte.'], unlock: ['q7'] },
    { id: 'q7', giver: 'ondine', title: 'Le Cœur de Brumeval', goal: 'Rapporte 5 cristaux de la grotte au nord-est.', needs: { cristal: 5 }, reward: { coins: 200, flag: 'ending' },
      intro: ['Une pioche d’acier ! Alors le moment est venu.', 'Les anciens disaient que le Cristal de la place est né dans la grotte au nord-est.', 'Brise les rochers qui bloquent l’entrée et rapporte-moi 5 cristaux. Peut-être pourrons-nous le rallumer…'],
      done: ['Ces cristaux… ils chantent ! Approchons-les du Cristal de la place.', '…', 'Regarde ! Le Cristal brille à nouveau ! La Brume se dissipe sur Brumeval !', 'Merci, voyageur. Tu seras toujours chez toi ici.'] },
    { id: 'q8', giver: 'barnabe', title: 'La Lame de Cristal', goal: 'Rapporte du fer et des cristaux pour forger une épée digne de ce nom.', needs: { fer: 6, cristal: 3 }, reward: { sword: 2 },
      intro: ['Tu as vu cette bête ?! Un dragon ! Ton épée rouillée ne lui fera qu’une égratignure.', 'Rapporte-moi 6 minerais de fer et 3 cristaux. Je vais te forger une Lame de Cristal : elle frappe deux fois plus fort !'],
      done: ['… Et voilà. Regarde-la briller ! C’est la plus belle lame que j’aie jamais forgée.', 'Prends-en soin. Et reviens vivant, hein.'] },
    { id: 'q9', giver: 'mira', title: 'Élixirs de vie', goal: 'Cueille de quoi préparer des élixirs de soin.', needs: { baies: 6, champignon: 3 }, reward: { potions: 3 },
      intro: ['Le dragon… j’ai senti sa chaleur jusqu’ici. Tu vas avoir besoin de soins.', 'Apporte-moi 6 baies et 3 champignons, je te préparerai des élixirs de vie.'],
      done: ['Voici 3 élixirs. Chacun rend 3 cœurs : bois-les avec la touche H (ou le bouton vert).', 'Gus en vendra aussi, si tu en manques.'] },
    { id: 'q10', giver: 'ondine', title: 'Ignar, le Dragon des Cendres', goal: 'Affronte le dragon dans la Clairière Brûlée, au sud-est.', needs: {}, flagNeed: 'dragonDefeated', reward: { coins: 500, flag: 'hero' },
      remind: 'Ignar t’attend dans la Clairière Brûlée, au sud-est. Esquive ses flammes, frappe-le quand il est sonné après une charge, et bois tes élixirs si tu es blessé !',
      intro: ['Te voilà prêt, avec ta Lame de Cristal et les élixirs de Mira.', 'Ignar, le Dragon des Cendres, s’est installé dans la Clairière Brûlée, au sud-est. La lumière du Cristal l’a réveillé.', 'Chasse-le de notre vallée, héros. Tout Brumeval compte sur toi.'],
      done: ['Tu as réussi ! Ignar s’est envolé par-delà les montagnes, et il ne reviendra pas.', 'Les villageois chantent ton nom sur la place. Tu es désormais le Héros de Brumeval !'] },
  ];

  const SHOPS = {
    gus: { title: '🛒 L’échoppe de Gus', sell: true, items: [
      { id: 'lantern', name: 'Lanterne', icon: '🏮', desc: 'Éclaire bien plus loin la nuit et dans la grotte.', cost: { coins: 50 } },
      { id: 'gloves', name: 'Gants de bûcheron', icon: '🧤', desc: '+1 bûche pour chaque arbre coupé.', cost: { coins: 90 } },
      { id: 'fertil', name: 'Poudre des fées', icon: '✨', desc: 'Les ressources repoussent deux fois plus vite.', cost: { coins: 140 } },
      { id: 'potion', name: 'Élixir de vie', icon: '🧪', desc: 'Rend 3 cœurs. Bois-le avec H.', cost: { coins: 25 }, repeat: true, show: () => !!S.flags.dragonSeen },
    ] },
    forge: { title: '⚒️ La forge de Barnabé', items: [
      { id: 'sharp', name: 'Hache affûtée', icon: '🪓', desc: 'Les arbres tombent deux fois plus vite.', cost: { coins: 35, fer: 3 } },
      { id: 'golden', name: 'Pioche dorée', icon: '⛏️', desc: 'Mine plus vite la pierre, le fer et les cristaux.', cost: { coins: 120, cristal: 2 } },
    ] },
  };

  /* ===================== Monde ===================== */
  const G = 0, WA = 1, SA = 2, PA = 3, FO = 4, CF = 6, CL = 7, BU = 8;
  const ARENA_T = { x: 58, y: 44, r: 6 };
  const ARENA = { x: (ARENA_T.x + 0.5) * T, y: (ARENA_T.y + 0.5) * T, r: ARENA_T.r * T };
  const DRAGON_HP = 30, MAXHP = 6;
  const map = new Uint8Array(W * H);
  const tile = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? FO : map[y * W + x]);
  const setT = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) map[y * W + x] = v; };
  const riverX = (y) => 38 + 2 * Math.sin(y * 0.25) + 1.5 * Math.sin(y * 0.11 + 1);
  const bridge = { x0: 0, x1: 0, y0: 27, y1: 28 };
  let corridorY = 21;
  const objs = [];
  const occ = new Uint8Array(W * H);
  const reserve = (tx, ty, r) => { for (let y = Math.floor(ty - r); y <= ty + r; y++) for (let x = Math.floor(tx - r); x <= tx + r; x++) if (x >= 0 && y >= 0 && x < W && y < H && Math.hypot(x - tx, y - ty) <= r + 0.01) occ[y * W + x] = 1; };

  function generate() {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let t = G;
      const d = Math.min(x, y, W - 1 - x, H - 1 - y);
      const edge = 2 + Math.floor(hn(x, y) * 1.7 + (Math.sin(x * 0.5) + Math.cos(y * 0.45)) * 0.5);
      if (d < edge) t = FO;
      const mx = 49 + Math.floor(hn(x + 5, y) * 2), my = 21 - Math.floor(hn(x, y + 9) * 2);
      if (x >= mx && y <= my) t = CL;
      map[y * W + x] = t;
    }
    for (let y = 4; y <= 18; y++) for (let x = 52; x <= 68; x++) {
      const e = ((x - 60) / 7.2) ** 2 + ((y - 11) / 6.2) ** 2;
      if (e < 1 + (hn(x, y) - 0.5) * 0.35) setT(x, y, CF);
    }
    for (let y = 12; y < 32; y++) {
      let any = false;
      for (const x of [58, 59]) { const t0 = tile(x, y); if (t0 === CL || t0 === FO) { setT(x, y, CF); any = true; } else if (t0 === CF) any = true; }
      if (!any && y > 16) { corridorY = y - 1; break; }
    }
    for (let y = 0; y < H; y++) { const rx = riverX(y); for (let x = 0; x < W; x++) { const d = Math.abs(x + 0.5 - rx); if (d < 1.7) setT(x, y, WA); else if (d < 2.7 && tile(x, y) === G) setT(x, y, SA); } }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const e = ((x + 0.5 - 14) / 7) ** 2 + ((y + 0.5 - 44) / 4.5) ** 2;
      if (e < 1) setT(x, y, WA); else if (e < 1.5 && tile(x, y) === G) setT(x, y, SA);
    }
    const pathT = (x, y) => { const t = tile(x, y); if (t === G || t === SA) setT(x, y, PA); };
    const hline = (x0, x1, y) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) { pathT(x, y); pathT(x, y + 1); } };
    const vline = (x, y0, y1) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) { pathT(x, y); pathT(x + 1, y); } };
    for (let y = 22; y < 33; y++) for (let x = 13; x < 24; x++) if (Math.hypot(x + 0.5 - 18.9, y + 0.5 - 28) < 3.3) pathT(x, y);
    hline(10, 60, 27); vline(58, corridorY + 1, 28); vline(18, 28, 38); vline(46, 28, 37);
    hline(47, 54, 33); vline(54, 33, 39);
    for (let y = 30; y < H; y++) for (let x = 44; x < W; x++) {
      const d = Math.hypot(x + 0.5 - (ARENA_T.x + 0.5), y + 0.5 - (ARENA_T.y + 0.5));
      if (d < ARENA_T.r + 0.3) { const t = tile(x, y); if (t === G || t === SA || t === PA) setT(x, y, BU); }
    }
    // pont
    let x0 = 99, x1 = -1;
    for (const y of [27, 28]) for (let x = 30; x < 46; x++) if (tile(x, y) === WA) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
    bridge.x0 = x0; bridge.x1 = x1;
  }

  /* ---------- Objets ---------- */
  let nid = 0;
  function addNode(type, x, y) { const o = { kind: 'node', type, x, y, hp: NODE[type].hp, dead: 0, shake: 0, pop: 0, id: nid++, v: hn(x * 0.37, y * 0.71) }; objs.push(o); return o; }
  function addObj(o) { objs.push(o); return o; }
  const P = (t) => t * T;
  let npcs = [], boulders = [], player, monument, chickens = [], dragon;

  function populate() {
    // bâtiments du village
    const houses = [
      { x: 14, y: 24, w: 120, h: 80, roof: 'thatch', name: 'ondine' },
      { x: 23.2, y: 24, w: 132, h: 82, roof: 'tile', forge: true },
      { x: 8.6, y: 24.6, w: 104, h: 74, roof: 'slate' },
      { x: 27.4, y: 32.4, w: 110, h: 76, roof: 'thatch' },
      { x: 12.4, y: 35.2, w: 104, h: 74, roof: 'slate' },
    ];
    houses.forEach((h) => { addObj(Object.assign({ kind: 'house' }, h, { x: P(h.x), y: P(h.y) })); reserve(h.x, h.y - 1, 2.6); });
    addObj({ kind: 'anvil', x: P(25.2), y: P(25.4) });
    addObj({ kind: 'stall', x: P(11), y: P(31) }); reserve(11, 30.5, 2);
    addObj({ kind: 'well', x: P(22.4), y: P(31.2) });
    addObj({ kind: 'tower', x: P(30.2), y: P(24.8) }); reserve(30.2, 24, 2.2);
    addObj({ kind: 'banner', x: P(12.2), y: P(26.4) }); addObj({ kind: 'banner', x: P(25.6), y: P(26.4) });
    addObj({ kind: 'hay', x: P(25.6), y: P(34.8) }); addObj({ kind: 'hay', x: P(9.2), y: P(32.6) }); addObj({ kind: 'hay', x: P(10.4), y: P(33.3) });
    // Clairière Brûlée (repaire du dragon)
    [[53.6, 41.4], [62.4, 40.6], [62.2, 47.4], [54.2, 47]].forEach(([x, y]) => addObj({ kind: 'deco', t: 'charred', x: P(x), y: P(y) }));
    [[56.6, 42.6], [60.2, 45.8], [55.8, 45.6]].forEach(([x, y]) => addObj({ kind: 'deco', t: 'bones', x: P(x), y: P(y) }));
    addObj({ kind: 'sign', x: P(50.6), y: P(32.5), text: ['Clairière Brûlée ⬇', 'Danger ! Ne pas approcher. On raconte qu’un dragon y dort…'] });
    reserve(ARENA_T.x, ARENA_T.y, ARENA_T.r + 2);
    dragon = addObj({ kind: 'dragon', x: ARENA.x, y: ARENA.y, hp: DRAGON_HP, active: false, fly: 420, dir: -1, state: 'idle', t: 0, flash: 0, phase: 1 });
    monument = addObj({ kind: 'monument', x: P(18.9), y: P(27.6) });
    [[15.3, 26.4], [22.6, 26.4], [16, 31.6], [26, 29.6], [33.4, 26.5], [9.2, 29.2]].forEach(([x, y]) => addObj({ kind: 'lamp', x: P(x), y: P(y) }));
    addObj({ kind: 'tent', x: P(48.8), y: P(38) }); reserve(48.6, 37.4, 2.2);
    addObj({ kind: 'barrel', x: P(20.6), y: P(39.4) });
    addObj({ kind: 'sign', x: P(32.6), y: P(26.5), text: ['⬅ Village de Brumeval', 'Est ➡ Forêt des Pins · Mines de fer'] });
    addObj({ kind: 'sign', x: P(56.6), y: P(corridorY + 2.4), text: ['Grotte de Cristal', 'Attention : éboulement ! Une pioche d’acier est nécessaire.'] });
    reserve(18.9, 27.5, 9.5);
    // PNJ
    npcs = NPCS.map((n) => addObj(Object.assign({ kind: 'npc', x: P(n.tx), y: P(n.ty), dir: 'down', look: LOOKS[n.id], bob: Math.random() * 6 }, n)));
    npcs.forEach((n) => reserve(n.tx, n.ty, 2));
    reserve(46.6, 38.6, 2.5); reserve(19.6, 39.4, 2.2);
    // éboulement
    boulders = [0, 1].map((k) => { const b = addNode('boulder', P(58 + k) + 20, P(corridorY) + 22); b.bid = k; return b; });
    reserve(58.5, corridorY, 3);
    // chemins dégagés
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (tile(x, y) === PA) reserve(x, y, 1);
    // ressources
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (occ[y * W + x]) continue;
      const t = tile(x, y);
      const px = P(x) + 20 + (hn(x, y * 3) - 0.5) * 14, py = P(y) + 24 + (hn(x * 5, y) - 0.5) * 12;
      const v = hn(x * 3 + 1, y * 5 + 2);
      if (t === CF) {
        if (y > corridorY - 3 && x >= 57 && x <= 60) continue;
        if (y <= 18) { if (v < 0.09) { addNode('crystal', px, py); reserve(x, y, 1); } else if (v < 0.15) { addNode('iron', px, py); reserve(x, y, 1); } }
        continue;
      }
      if (t !== G) continue;
      const east = x + 0.5 > riverX(y) + 2.5;
      if (!east) {
        if (v < 0.075) { addNode('tree', px, py); reserve(x, y, 1); }
        else if (v < 0.095) addNode('rock', px, py);
        else if (v < 0.112) addNode('bush', px, py);
        else continue;
      } else {
        const nearMine = x > 44 && y < 26;
        if (v < 0.11) { addNode(v < 0.07 ? 'pine' : 'tree', px, py); reserve(x, y, 1); }
        else if (v < 0.13) addNode('rock', px, py);
        else if (v < (nearMine ? 0.19 : 0.155)) addNode('iron', px, py);
        else if (v < (nearMine ? 0.205 : 0.172)) addNode('bush', px, py);
        else if (v < (nearMine ? 0.22 : 0.198)) addNode('mushroom', px, py);
        else continue;
      }
      occ[y * W + x] = 1;
    }
    // poissons
    [[14, 40.6], [7.9, 44], [20.2, 44.4], [13.4, 48.2]].forEach(([x, y]) => addNode('fish', P(x), P(y)));
    // poules
    for (let k = 0; k < 4; k++) chickens.push(addObj({ kind: 'chicken', x: P(20 + k), y: P(33 + (k % 2)), tx: 0, ty: 0, wait: Math.random() * 2, dir: 1, hop: 0 }));
    player = addObj({ kind: 'player', x: P(18.9), y: P(30.4), dir: 'down', moving: false, walk: 0, swing: 0, look: LOOKS.player, fishing: null });
  }

  /* ===================== État / sauvegarde ===================== */
  function newState() {
    return { px: 0, py: 0, inv: {}, coins: 0, tools: { axe: 1, pickaxe: 0, rod: 0 }, up: {}, quests: { q1: 'available' }, flags: {}, notified: {},
      time: 8 * 60, order: null, played: 0, sound: true, music: true, started: Date.now(), hp: MAXHP, potions: 0, sword: 1 };
  }
  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null;
      const d = JSON.parse(raw), s = newState();
      if (!d || typeof d !== 'object') return null;
      for (const k of ['px', 'py', 'coins', 'time', 'played', 'hp', 'potions', 'sword']) if (typeof d[k] === 'number' && isFinite(d[k])) s[k] = d[k];
      for (const k of ['inv', 'up', 'quests', 'flags', 'notified', 'stats']) if (d[k] && typeof d[k] === 'object') s[k] = d[k];
      if (d.tools) Object.assign(s.tools, d.tools);
      s.order = d.order || null; s.sound = d.sound !== false; s.music = d.music !== false; s.started = d.started || Date.now();
      return s;
    } catch (e) { return null; }
  }
  let S = newState();
  function save() {
    if (state !== 'play') return;
    S.px = player.x; S.py = player.y;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* stockage indisponible */ }
  }

  /* ===================== Audio (synthétisé) ===================== */
  let AC = null, master = null;
  function ac() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 0.9; master.connect(AC.destination); } catch (e) { return null; } }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  function tone(f, d, type = 'sine', vol = 0.05, slide = 0, delay = 0, attack = 0.005) {
    if (!S.sound) return; const a = ac(); if (!a) return;
    const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.05);
  }
  let noiseBuf = null;
  function noise(d, vol, freq, delay = 0) {
    if (!S.sound) return; const a = ac(); if (!a) return;
    if (!noiseBuf) { noiseBuf = a.createBuffer(1, a.sampleRate * 0.5, a.sampleRate); const ch = noiseBuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
    const t = a.currentTime + delay, s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + d + 0.05);
  }
  const SFX = {
    chop: () => { noise(0.09, 0.35, 700); tone(130, 0.12, 'sine', 0.18, 0.6); },
    mine: () => { tone(1250, 0.07, 'square', 0.035); tone(1900, 0.1, 'triangle', 0.04, 0, 0.02); noise(0.06, 0.18, 3200); },
    pick: () => { noise(0.08, 0.2, 2200); tone(700, 0.08, 'sine', 0.05, 1.3); },
    pickup: () => { tone(880, 0.09, 'triangle', 0.06); tone(1320, 0.12, 'triangle', 0.05, 0, 0.06); },
    quest: () => [523, 659, 784, 1047].forEach((f, k) => tone(f, 0.3, 'triangle', 0.06, 0, k * 0.1)),
    big: () => [392, 523, 659, 784, 1047, 1319, 1568].forEach((f, k) => tone(f, 0.45, 'triangle', 0.06, 0, k * 0.11)),
    blip: () => tone(420 + Math.random() * 160, 0.035, 'square', 0.012),
    error: () => tone(190, 0.18, 'square', 0.035, 0.7),
    splash: () => { noise(0.3, 0.25, 1100); tone(300, 0.2, 'sine', 0.05, 2); },
    coin: () => { tone(988, 0.07, 'square', 0.03); tone(1319, 0.15, 'square', 0.03, 0, 0.06); },
    boom: () => { noise(0.5, 0.5, 300); tone(80, 0.5, 'sine', 0.25, 0.5); },
    open: () => tone(600, 0.06, 'sine', 0.04, 1.5),
  };
  // musique d'ambiance douce (pentatonique)
  const SCALE = [0, 2, 4, 7, 9, 12, 14, 16];
  const CHORDS = [0, 5, 7, 3];
  let musicT = 0, musicStep = 0;
  function musicTick(dt) {
    if (!S.music || !S.sound || state !== 'play') return;
    musicT -= dt; if (musicT > 0) return;
    const boss = (dragon && dragon.active && !['defeat', 'leave', 'retreat'].includes(dragon.state)) || flyover;
    musicT = boss ? 0.24 : 0.5; musicStep++;
    if (boss) {
      const MIN = [0, 3, 5, 7, 8, 12], root = [0, 0, 8, 7][Math.floor(musicStep / 8) % 4];
      if (musicStep % 2 === 0) tone(73.4 * Math.pow(2, root / 12), 0.35, 'sawtooth', 0.045, 0.98);
      if (Math.random() < 0.6) tone(220 * Math.pow(2, (MIN[Math.floor(Math.random() * MIN.length)] + root) / 12), 0.3, 'square', 0.014);
      if (musicStep % 4 === 0) noise(0.08, 0.12, 120);
      return;
    }
    const root = CHORDS[Math.floor(musicStep / 16) % CHORDS.length];
    const base = night > 0.5 || inCave ? 196 : 262;
    if (musicStep % 8 === 0) tone(base / 2 * Math.pow(2, root / 12), 2.6, 'sine', 0.035, 0, 0, 0.3);
    if (Math.random() < 0.55) { const n = SCALE[Math.floor(Math.random() * SCALE.length)] + root; tone(base * Math.pow(2, n / 12), 1.4, 'triangle', 0.022, 0, 0, 0.02); }
  }

  /* ===================== Canvas / caméra ===================== */
  const cv = $('#game'), ctx = cv.getContext('2d');
  let vw = 0, vh = 0, dpr = 1, zoom = 1;
  const cam = { x: 0, y: 0 };
  let camFocus = null;
  const lightCv = document.createElement('canvas'), lctx = lightCv.getContext('2d');
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    vw = window.innerWidth; vh = window.innerHeight;
    cv.width = Math.floor(vw * dpr); cv.height = Math.floor(vh * dpr);
    lightCv.width = Math.ceil(vw / 2); lightCv.height = Math.ceil(vh / 2);
    zoom = clamp(Math.min(vw / 900, vh / 610), 0.8, 1.6);
    if (vw < 760) zoom = clamp(Math.min(vw / 440, vh / 700), 0.8, 1.2);
  }

  /* ---------- Helpers dessin ---------- */
  const circ = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
  const ell = (c, x, y, rx, ry) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); };
  function rr(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); c.fill(); }
  function poly(c, pts) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fill(); }
  function shadow(c, x, y, rx, ry) {
    c.save(); c.translate(x, y); c.scale(1, ry / rx);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, rx * 1.25);
    g.addColorStop(0, 'rgba(15,30,10,.38)'); g.addColorStop(0.6, 'rgba(15,30,10,.2)'); g.addColorStop(1, 'rgba(15,30,10,0)');
    c.fillStyle = g; circ(c, 0, 0, rx * 1.25); c.restore();
  }

  /* ---------- Sol pré-rendu par blocs ---------- */
  const chunks = new Map();
  function blob(c, x0, y0, x1, y1, match, R, color) {
    c.fillStyle = color;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!match(tile(x, y))) continue;
      const cx = x * T + T / 2, cy = y * T + T / 2;
      circ(c, cx, cy, R);
      if (match(tile(x + 1, y))) c.fillRect(cx, cy - R, T, 2 * R);
      if (match(tile(x, y + 1))) c.fillRect(cx - R, cy, 2 * R, T);
      if (match(tile(x + 1, y)) && match(tile(x, y + 1)) && match(tile(x + 1, y + 1))) c.fillRect(cx, cy, T, T);
    }
  }
  function blobXY(c, x0, y0, x1, y1, m, R, color) {
    c.fillStyle = color;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!m(x, y)) continue;
      const cx = x * T + T / 2, cy = y * T + T / 2;
      circ(c, cx, cy, R);
      if (m(x + 1, y)) c.fillRect(cx, cy - R, T, 2 * R);
      if (m(x, y + 1)) c.fillRect(cx - R, cy, 2 * R, T);
      if (m(x + 1, y) && m(x, y + 1) && m(x + 1, y + 1)) c.fillRect(cx, cy, T, T);
    }
  }
  function renderChunk(kx, ky) {
    const c2 = document.createElement('canvas'); c2.width = CH * T; c2.height = CH * T;
    const c = c2.getContext('2d');
    c.translate(-kx * CH * T, -ky * CH * T);
    const x0 = kx * CH - 1, y0 = ky * CH - 1, x1 = x0 + CH + 1, y1 = y0 + CH + 1;
    // herbe
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const v = hn(x, y);
      c.fillStyle = '#7cc35b';
      c.fillRect(x * T, y * T, T, T);
      c.fillStyle = `rgba(${v < 0.5 ? '60,140,50' : '170,220,110'},${0.12 + Math.abs(v - 0.5) * 0.12})`;
      ell(c, x * T + T / 2 + (hn(y, x) - 0.5) * 20, y * T + T / 2, T * 0.7, T * 0.45);
    }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (tile(x, y) !== G) continue;
      const v = hn(x * 7, y * 3);
      c.strokeStyle = 'rgba(40,110,40,.35)'; c.lineWidth = 2;
      for (let k = 0; k < 3; k++) {
        const gx = x * T + hn(x + k, y) * T, gy = y * T + hn(x, y + k) * T;
        c.beginPath(); c.moveTo(gx - 3, gy - 5); c.lineTo(gx, gy); c.lineTo(gx + 3, gy - 6); c.stroke();
      }
      if (v < 0.11) {
        const cols = ['#ffffff', '#ffd84a', '#ff8fb1', '#b9a2ff'];
        for (let k = 0; k < 3; k++) {
          const fx = x * T + 6 + hn(x * 2 + k, y) * (T - 12), fy = y * T + 6 + hn(x, y * 2 + k) * (T - 12);
          c.fillStyle = cols[Math.floor(v * 36 + k) % 4]; for (let a = 0; a < 5; a++) circ(c, fx + Math.cos(a * 1.26) * 3, fy + Math.sin(a * 1.26) * 3, 2.2);
          c.fillStyle = '#f7c531'; circ(c, fx, fy, 1.6);
        }
      }
    }
    // sable, eau, chemins
    blob(c, x0, y0, x1, y1, (t) => t === SA || t === WA, 0.68 * T, '#e7d39b');
    blob(c, x0, y0, x1, y1, (t) => t === WA, 0.66 * T, '#cfeff2');
    blob(c, x0, y0, x1, y1, (t) => t === WA, 0.58 * T, '#58aee0');
    const deepAt = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (tile(x + dx, y + dy) !== WA) return false; return true; };
    blobXY(c, x0, y0, x1, y1, deepAt, 0.5 * T, '#4a9ed6');
    blobXY(c, x0, y0, x1, y1, (x, y) => deepAt(x, y) && deepAt(x + 1, y) && deepAt(x - 1, y) && deepAt(x, y + 1) && deepAt(x, y - 1), 0.42 * T, '#3f90c9');
    blob(c, x0, y0, x1, y1, (t) => t === PA, 0.6 * T, '#c7a06a');
    blob(c, x0, y0, x1, y1, (t) => t === PA, 0.53 * T, '#dcbb87');
    blob(c, x0, y0, x1, y1, (t) => t === BU, 0.72 * T, '#6a5a46');
    blob(c, x0, y0, x1, y1, (t) => t === BU, 0.62 * T, '#4a3d33');
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (tile(x, y) !== BU) continue;
      const v = hn(x * 5, y * 3);
      c.fillStyle = 'rgba(20,14,10,.35)'; ell(c, x * T + v * T, y * T + hn(y, x * 2) * T, 9, 5);
      c.fillStyle = 'rgba(160,150,140,.25)'; ell(c, x * T + hn(x, y * 7) * T, y * T + v * T, 5, 2.5);
      if (v < 0.18) { c.fillStyle = '#ff7a2a'; circ(c, x * T + hn(x * 9, y) * T, y * T + hn(x, y * 9) * T, 1.6); }
    }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const t = tile(x, y);
      if (t === PA && hn(x, y * 9) < 0.5) { c.fillStyle = 'rgba(150,115,70,.45)'; ell(c, x * T + hn(x, y) * T, y * T + hn(y, x) * T, 3, 2); }
      if (t === CF) {
        c.fillStyle = `hsl(260,10%,${26 + hn(x, y) * 5}%)`; c.fillRect(x * T, y * T, T, T);
        c.fillStyle = 'rgba(255,255,255,.05)'; ell(c, x * T + hn(x * 3, y) * T, y * T + hn(x, y * 3) * T, 6, 3);
      }
    }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const t = tile(x, y);
      if (t === CL) {
        const v = hn(x, y);
        c.fillStyle = `hsl(28,12%,${44 + v * 6}%)`; c.fillRect(x * T, y * T, T, T);
        c.fillStyle = 'rgba(255,255,255,.08)'; poly(c, [x * T + 6, y * T + 10, x * T + 20, y * T + 4, x * T + 30, y * T + 14, x * T + 14, y * T + 18]);
        if (tile(x, y + 1) !== CL) {
          c.fillStyle = '#5a4c40'; c.fillRect(x * T, y * T + T * 0.45, T, T * 0.55);
          c.fillStyle = '#4a3e34'; c.fillRect(x * T + 8 + v * 10, y * T + T * 0.5, 3, T * 0.4);
          c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x * T, y * T + T - 4, T, 4);
        }
      } else if (t === FO) {
        c.fillStyle = '#2f6a35'; c.fillRect(x * T, y * T, T, T);
      }
    }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (tile(x, y) !== FO) continue;
      const cx = x * T + T / 2, cy = y * T + T / 2;
      c.fillStyle = '#245a2c'; circ(c, cx + (hn(x, y) - 0.5) * 12, cy + 4, T * 0.62);
      c.fillStyle = '#367a3c'; circ(c, cx + (hn(y, x) - 0.5) * 14, cy - 4, T * 0.48);
      c.fillStyle = '#4f9a4c'; circ(c, cx - 6 + hn(x * 2, y) * 6, cy - 10, T * 0.2);
    }
    chunks.set(kx + ',' + ky, c2);
    return c2;
  }

  /* ---------- Dessins d'objets ---------- */
  /* ---------- Arbres pré-rendus (feuillage éclairé) ---------- */
  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  function mix3(a, b, d, t) { const A = hex(a), B = hex(b), D = hex(d); const f = (i) => (t < 0.5 ? A[i] + (B[i] - A[i]) * t * 2 : B[i] + (D[i] - B[i]) * (t - 0.5) * 2); return `rgb(${f(0) | 0},${f(1) | 0},${f(2) | 0})`; }
  const TREE_SPR = [], PINE_SPR = [];
  function makeTree(seed, fruit) {
    const cv2 = document.createElement('canvas'); cv2.width = 120; cv2.height = 140;
    const c = cv2.getContext('2d'), R = mulberry32(seed);
    const tg = c.createLinearGradient(52, 0, 70, 0); tg.addColorStop(0, '#3e2715'); tg.addColorStop(0.45, '#7a5432'); tg.addColorStop(1, '#2f1d0e');
    c.fillStyle = tg; c.beginPath(); c.moveTo(49, 135); c.quadraticCurveTo(56, 112, 56, 76); c.lineTo(65, 76); c.quadraticCurveTo(65, 112, 72, 135); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(25,15,6,.45)'; c.lineWidth = 1;
    for (let k = 0; k < 4; k++) { const bx = 57 + R() * 7; c.beginPath(); c.moveTo(bx, 130); c.lineTo(bx + R() * 2 - 1, 92); c.stroke(); }
    c.strokeStyle = '#4a2f1a'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(60, 88); c.lineTo(44, 66); c.moveTo(61, 84); c.lineTo(78, 64); c.stroke();
    const cx = 60, cy = 56, rx = 42 + R() * 6, ry = 37 + R() * 6;
    c.fillStyle = '#183d1d'; c.beginPath(); c.ellipse(cx + 3, cy + 5, rx * 0.92, ry * 0.88, 0, 0, 7); c.fill();
    const cl = [];
    for (let k = 0; k < 85; k++) {
      const a = R() * Math.PI * 2, d = Math.sqrt(R());
      const px = cx + Math.cos(a) * rx * d * 0.9, py = cy + Math.sin(a) * ry * d * 0.9;
      const l = clamp(0.5 - ((px - cx) / rx) * 0.45 - ((py - cy) / ry) * 0.55 + (R() - 0.5) * 0.3, 0, 1);
      cl.push({ px, py, l, s: 6 + R() * 7 });
    }
    cl.sort((a, b) => a.l - b.l);
    for (const k of cl) {
      c.fillStyle = mix3('#16391b', '#3a7c35', '#9ccd70', k.l); circ(c, k.px, k.py, k.s);
      c.fillStyle = mix3('#16391b', '#3a7c35', '#9ccd70', Math.min(1, k.l + 0.13)); circ(c, k.px - k.s * 0.25, k.py - k.s * 0.3, k.s * 0.55);
    }
    for (let k = 0; k < 14; k++) { c.fillStyle = 'rgba(215,245,175,.3)'; circ(c, cx - rx * 0.55 + R() * rx * 0.7, cy - ry * 0.65 + R() * ry * 0.55, 1.2 + R() * 2); }
    if (fruit) for (let k = 0; k < 6; k++) { const a = R() * 6.28, d = Math.sqrt(R()) * 0.75; c.fillStyle = '#b8352a'; circ(c, cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d + 6, 2.6); c.fillStyle = 'rgba(255,255,255,.5)'; circ(c, cx + Math.cos(a) * rx * d - 0.8, cy + Math.sin(a) * ry * d + 5, 0.8); }
    return cv2;
  }
  function makePine(seed) {
    const cv2 = document.createElement('canvas'); cv2.width = 100; cv2.height = 150;
    const c = cv2.getContext('2d'), R = mulberry32(seed);
    const tg = c.createLinearGradient(45, 0, 56, 0); tg.addColorStop(0, '#3e2715'); tg.addColorStop(0.5, '#6e4a2c'); tg.addColorStop(1, '#2f1d0e');
    c.fillStyle = tg; c.fillRect(46, 112, 9, 33);
    const tiers = 5;
    for (let i = 0; i < tiers; i++) {
      const ty = 124 - i * 21, w = 40 - i * 7 + R() * 3, h = 36;
      const g = c.createLinearGradient(50 - w, 0, 50 + w, 0);
      g.addColorStop(0, '#4f9a5a'); g.addColorStop(0.45, '#2a6a3a'); g.addColorStop(1, '#143820');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(50, ty - h);
      const n = 9;
      for (let k = 0; k <= n; k++) { const px = 50 + w - (2 * w * k) / n, py = ty + (k % 2 ? -5 : 0) + R() * 2; c.lineTo(px, py); }
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(160,215,140,.35)'; c.lineWidth = 1.2;
      for (let k = 0; k < 6; k++) { const sx = 50 - w * 0.2 - R() * w * 0.6, sy = ty - 4 - R() * h * 0.5; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx - 5, sy + 6); c.stroke(); }
      c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(50 - w * 0.9, ty - 1, w * 1.8, 3);
    }
    return cv2;
  }
  function buildSprites() {
    for (let k = 0; k < 8; k++) TREE_SPR.push(makeTree(101 + k * 17, k % 3 === 0));
    for (let k = 0; k < 5; k++) PINE_SPR.push(makePine(501 + k * 23));
  }
  function drawTree(c, o) {
    const x = o.x, y = o.y, s = o.shake > 0 ? Math.sin(gt * 70) * o.shake * 4 : 0;
    shadow(c, x + 6, y, 26, 8);
    if (o.dead) { c.fillStyle = '#5a3a20'; ell(c, x, y - 3, 10, 6); c.fillStyle = '#b48a5e'; ell(c, x, y - 6, 8, 4); c.strokeStyle = '#8c6440'; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y - 6, 4, 2, 0, 0, 7); c.stroke(); return; }
    const pine = o.type === 'pine', arr = pine ? PINE_SPR : TREE_SPR, spr = arr[Math.floor(o.v * arr.length) % arr.length];
    const sk = Math.sin(gt * 1.1 + o.x * 0.031) * 0.03 + (o.shake > 0 ? Math.sin(gt * 70) * o.shake * 0.04 : 0);
    const sc = (o.pop > 0 ? 1 - o.pop * 0.6 : 1) * (0.82 + o.v * 0.12);
    c.save(); c.translate(x + s * 0.3, y); c.transform(1, 0, sk, 1, 0, 0); c.scale(sc, sc);
    if (pine) c.drawImage(spr, -50, -145); else c.drawImage(spr, -60, -135);
    c.restore();
  }
  function rockShape(c, x, y, r, v, base, light, dark) {
    const pts = [];
    for (let k = 0; k < 8; k++) { const a = Math.PI + (k / 7) * Math.PI; const rr2 = r * (0.8 + hn(v * 50 + k, k) * 0.3); pts.push(x + Math.cos(a) * rr2 * 1.15, y + Math.sin(a) * rr2 * 1.05); }
    c.fillStyle = dark; poly(c, pts.concat([x + r, y + 3, x - r, y + 3]));
    c.fillStyle = base; poly(c, pts.map((p, i) => (i % 2 ? p - 1 : p)));
    c.fillStyle = light; ell(c, x - r * 0.25, y - r * 0.6, r * 0.45, r * 0.22);
  }
  function drawRock(c, o) {
    const s = o.shake > 0 ? Math.sin(gt * 80) * o.shake * 3 : 0, x = o.x + s, y = o.y;
    shadow(c, o.x, y + 2, 20, 6);
    if (o.dead) { c.fillStyle = '#8d9399'; circ(c, x - 6, y - 2, 4); circ(c, x + 5, y - 1, 3); circ(c, x, y - 4, 2.5); return; }
    const sc = o.pop > 0 ? 1 - o.pop * 0.6 : 1;
    c.save(); c.translate(x, y); c.scale(sc, sc);
    if (o.type === 'iron') {
      rockShape(c, 0, 0, 18, o.v, '#7f7a76', '#a9a39e', '#5c5753');
      c.fillStyle = '#d27a3c'; circ(c, -6, -8, 3); circ(c, 5, -12, 2.6); circ(c, 8, -4, 2.2); circ(c, -1, -15, 2);
      c.fillStyle = '#f2a868'; circ(c, -7, -9, 1.2); circ(c, 4, -13, 1);
    } else if (o.type === 'boulder') {
      rockShape(c, 0, 0, 24, o.v, '#8b8580', '#b4aea8', '#5e5955');
      c.strokeStyle = '#3e3a36'; c.lineWidth = 2;
      const dmg = NODE.boulder.hp - o.hp;
      for (let k = 0; k < dmg; k++) { c.beginPath(); c.moveTo(-12 + k * 6, -20 + k * 2); c.lineTo(-6 + k * 5, -10); c.lineTo(-10 + k * 7, -2); c.stroke(); }
    } else {
      rockShape(c, 0, 0, 17, o.v, '#9aa0a6', '#c8ccd0', '#71777d');
      c.fillStyle = 'rgba(80,140,70,.6)'; ell(c, 6, -2, 6, 2.5);
    }
    c.restore();
  }
  function drawCrystal(c, o) {
    const s = o.shake > 0 ? Math.sin(gt * 80) * o.shake * 3 : 0, x = o.x + s, y = o.y;
    shadow(c, o.x, y, 16, 5);
    if (o.dead) { c.fillStyle = '#6a5a8a'; poly(c, [x - 5, y, x - 2, y - 8, x + 2, y - 7, x + 5, y]); return; }
    const pulse = 0.6 + Math.sin(gt * 2 + o.v * 9) * 0.25;
    const g = c.createRadialGradient(x, y - 18, 2, x, y - 18, 34);
    g.addColorStop(0, `rgba(160,220,255,${0.45 * pulse})`); g.addColorStop(1, 'rgba(160,220,255,0)');
    c.fillStyle = g; circ(c, x, y - 18, 34);
    const sc = o.pop > 0 ? 1 - o.pop * 0.6 : 1;
    c.save(); c.translate(x, y); c.scale(sc, sc);
    const shard = (dx, h, w, col, lite) => { c.fillStyle = col; poly(c, [dx - w, 0, dx - w * 0.8, -h * 0.75, dx, -h, dx + w * 0.8, -h * 0.75, dx + w, 0]); c.fillStyle = lite; poly(c, [dx - w * 0.3, -2, dx - w * 0.4, -h * 0.7, dx, -h, dx + w * 0.1, -h * 0.6]); };
    shard(-9, 22, 6, '#8b6fe0', '#c5b4ff'); shard(9, 20, 6, '#5fb6e8', '#bfe9ff'); shard(0, 32, 8, '#7bd3f2', '#e6fbff');
    c.restore();
  }
  function drawBush(c, o) {
    const s = o.shake > 0 ? Math.sin(gt * 70) * o.shake * 3 : 0, x = o.x + s, y = o.y;
    shadow(c, o.x, y, 17, 6);
    c.fillStyle = '#2f7a3a'; circ(c, x - 9, y - 10, 11); circ(c, x + 9, y - 10, 11); circ(c, x, y - 17, 12);
    c.fillStyle = '#45964a'; circ(c, x - 4, y - 18, 7); circ(c, x + 6, y - 14, 6);
    if (!o.dead) { c.fillStyle = '#4a5ad8'; [[-9, -12], [7, -16], [-1, -9], [10, -8], [-5, -21], [3, -24]].forEach(([dx, dy]) => circ(c, x + dx, y + dy, 3)); c.fillStyle = '#aab6ff'; [[-10, -13], [6, -17]].forEach(([dx, dy]) => circ(c, x + dx, y + dy, 1)); }
  }
  function drawMushroom(c, o) {
    if (o.dead) return;
    const x = o.x, y = o.y, sc = o.pop > 0 ? 1 - o.pop : 1;
    shadow(c, x, y, 10, 3.5);
    c.save(); c.translate(x, y); c.scale(sc, sc);
    c.fillStyle = '#f2e6cf'; rr(c, -3, -11, 6, 11, 2);
    c.fillStyle = '#d8402f'; c.beginPath(); c.ellipse(0, -11, 11, 9, 0, Math.PI, 0); c.fill();
    c.fillStyle = '#fff'; circ(c, -5, -15, 2); circ(c, 3, -17, 1.8); circ(c, 6, -12, 1.5);
    c.fillStyle = '#efe0c2'; rr(c, 8, -6, 4, 6, 2); c.fillStyle = '#c93a2b'; c.beginPath(); c.ellipse(10, -6, 6, 5, 0, Math.PI, 0); c.fill();
    c.restore();
  }
  function drawFish(c, o) {
    if (o.dead) return;
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2;
    for (let k = 0; k < 3; k++) { const p = (gt * 0.6 + k / 3 + o.v) % 1; c.globalAlpha = 1 - p; c.beginPath(); c.ellipse(o.x, o.y, 6 + p * 22, 3 + p * 9, 0, 0, Math.PI * 2); c.stroke(); }
    c.globalAlpha = 1;
    const j = (gt * 0.35 + o.v * 3) % 1;
    if (j < 0.12) { const p = j / 0.12, fx = o.x - 14 + p * 28, fy = o.y - Math.sin(p * Math.PI) * 22; c.fillStyle = '#e8eef5'; ell(c, fx, fy, 7, 3.5); c.fillStyle = '#9fb6cc'; poly(c, [fx - 6, fy, fx - 12, fy - 4, fx - 12, fy + 4]); }
  }
  const ROOFS = {
    thatch: { base: '#c49a4f', dark: '#9a7434', light: '#e0bd72' },
    slate: { base: '#56606e', dark: '#3c4451', light: '#7d8999' },
    tile: { base: '#a5513c', dark: '#7a3826', light: '#c8705a' },
  };
  function chimneyPos(o) { const rh = o.h * 0.95; return { x: o.x + o.w * 0.2 + 8, y: o.y - o.h - rh * 0.95 - 4 }; }
  function stoneWall(c, x0, y0, w, h, seed) {
    c.fillStyle = '#6f685f'; c.fillRect(x0, y0, w, h);
    for (let r = 0, yy = y0; yy < y0 + h; r++, yy += 9) {
      for (let xx = x0 - (r % 2) * 8; xx < x0 + w; xx += 16) {
        const sx = Math.max(x0, xx) + 1, ww = Math.min(xx + 15, x0 + w - 1) - sx; if (ww <= 1) continue;
        const v = hn(xx * 0.13 + seed, yy * 0.17);
        c.fillStyle = `hsl(35,${5 + v * 6}%,${48 + v * 14}%)`; c.fillRect(sx, yy + 1, ww, Math.min(7.5, y0 + h - yy - 1));
        c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(sx, yy + 1, ww, 1.5);
      }
    }
  }
  function drawHouse(c, o) {
    const n = night, w = o.w, h = o.h, x0 = o.x - w / 2, top = o.y - h, sh = Math.round(h * 0.42), rh = h * 0.95;
    const R = ROOFS[o.roof || 'thatch'];
    shadow(c, o.x, o.y, w / 2 + 12, 12);
    // cheminée
    const chx = o.x + w * 0.2;
    stoneWall(c, chx, top - rh * 0.95, 16, rh * 0.75, o.x);
    c.fillStyle = '#4e4842'; c.fillRect(chx - 2, top - rh * 0.95 - 3, 20, 5);
    // rez-de-chaussée en pierre
    stoneWall(c, x0, o.y - sh, w, sh, o.y);
    // étage à colombages (en encorbellement)
    const ux = x0 - 5, uw = w + 10, uy = top, uh = h - sh;
    c.fillStyle = '#efe2c3'; c.fillRect(ux, uy, uw, uh);
    c.fillStyle = 'rgba(120,90,50,.08)'; for (let k = 0; k < 6; k++) ell(c, ux + hn(k, o.x) * uw, uy + hn(o.y, k) * uh, 8, 4);
    const beam = '#4e3220';
    c.fillStyle = beam; c.fillRect(ux, uy, uw, 4); c.fillRect(ux, uy + uh - 5, uw, 5);
    const posts = Math.max(3, Math.round(uw / 30)), pw = (uw - 5) / posts;
    const winPanels = [1, posts - 2];
    c.strokeStyle = beam; c.lineWidth = 3.5;
    for (let i = 0; i < posts; i++) {
      const px = ux + i * pw;
      if (!winPanels.includes(i)) { c.beginPath(); if (i % 2) { c.moveTo(px + 4, uy + uh - 5); c.lineTo(px + pw, uy + 4); } else { c.moveTo(px + 4, uy + 4); c.lineTo(px + pw, uy + uh - 5); } c.stroke(); }
    }
    for (let i = 0; i <= posts; i++) c.fillRect(ux + i * pw, uy, 5, uh);
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(ux, uy + uh, uw, 3);
    // fenêtres à volets
    const glass = n > 0.25 ? `rgb(255,${190 + 30 * n},${90 + 20 * n})` : '#8fb3c4';
    winPanels.forEach((i) => {
      const wx = ux + i * pw + pw / 2 - 8, wy = uy + uh * 0.28;
      c.fillStyle = '#3a2416'; c.fillRect(wx - 2, wy - 2, 20, 22);
      c.fillStyle = glass; c.fillRect(wx, wy, 16, 18);
      c.fillStyle = '#3a2416'; c.fillRect(wx + 7, wy, 2, 18); c.fillRect(wx, wy + 8, 16, 2);
      c.fillStyle = '#6b4a2f'; c.fillRect(wx - 9, wy - 1, 7, 20); c.fillRect(wx + 18, wy - 1, 7, 20);
      c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(wx - 9, wy + 6, 7, 1); c.fillRect(wx + 18, wy + 6, 7, 1); c.fillRect(wx - 9, wy + 13, 7, 1); c.fillRect(wx + 18, wy + 13, 7, 1);
    });
    // porte en arc ou forge ouverte
    if (o.forge) {
      c.fillStyle = '#1f140c'; rr(c, o.x - 22, o.y - 36, 44, 36, [10, 10, 0, 0]);
      const g = c.createRadialGradient(o.x, o.y - 8, 2, o.x, o.y - 8, 30); const f = 0.75 + Math.sin(gt * 9) * 0.1;
      g.addColorStop(0, `rgba(255,170,60,${f})`); g.addColorStop(1, 'rgba(255,120,30,0)'); c.fillStyle = g; rr(c, o.x - 22, o.y - 36, 44, 36, [10, 10, 0, 0]);
    } else {
      c.fillStyle = '#5f5850'; rr(c, o.x - 15, o.y - 38, 30, 38, [15, 15, 0, 0]);
      c.fillStyle = '#6e4a2c'; rr(c, o.x - 12, o.y - 35, 24, 35, [12, 12, 0, 0]);
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(o.x - 4.5, o.y - 33, 1, 33); c.fillRect(o.x + 3.5, o.y - 33, 1, 33);
      c.fillStyle = '#2b2b2b'; c.fillRect(o.x - 12, o.y - 27, 13, 2.5); c.fillRect(o.x - 12, o.y - 12, 13, 2.5); circ(c, o.x + 6, o.y - 17, 1.8);
    }
    // toit
    const rx0 = x0 - 18, rx1 = x0 + w + 18, ry = top + 8, apex = top - rh;
    c.save(); c.beginPath(); c.moveTo(rx0, ry); c.lineTo(o.x, apex); c.lineTo(rx1, ry); c.closePath();
    c.fillStyle = R.base; c.fill(); c.clip();
    c.strokeStyle = R.dark; c.lineWidth = o.roof === 'thatch' ? 2.5 : 1.5;
    for (let yy = apex + 7, r = 0; yy < ry + 4; yy += o.roof === 'thatch' ? 6 : 8, r++) {
      c.beginPath();
      if (o.roof === 'thatch') { c.moveTo(rx0, yy); for (let xx = rx0; xx <= rx1; xx += 8) c.quadraticCurveTo(xx + 4, yy + 3, xx + 8, yy); }
      else { c.moveTo(rx0, yy); c.lineTo(rx1, yy); for (let xx = rx0 + (r % 2) * 7; xx < rx1; xx += 14) { c.moveTo(xx, yy); c.lineTo(xx, yy - 8); } }
      c.stroke();
    }
    c.fillStyle = 'rgba(0,0,0,.2)'; poly(c, [o.x, apex, rx1, ry, o.x + 4, ry]);
    c.fillStyle = 'rgba(255,255,255,.08)'; poly(c, [o.x, apex, rx0, ry, rx0 + 20, ry]);
    c.restore();
    c.fillStyle = R.dark; c.fillRect(rx0, ry - 3, rx1 - rx0, 5);
    c.strokeStyle = R.dark; c.lineWidth = 3; c.beginPath(); c.moveTo(rx0, ry); c.lineTo(o.x, apex); c.lineTo(rx1, ry); c.stroke();
  }
  function drawTower(c, o) {
    const x = o.x, y = o.y, hgt = 150, w = 62;
    shadow(c, x, y, 40, 11);
    stoneWall(c, x - w / 2, y - hgt, w, hgt, x);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x + 6, y - hgt, w / 2 - 6, hgt);
    for (let k = 0; k < 4; k++) { stoneWall(c, x - w / 2 - 4 + k * 19, y - hgt - 14, 12, 14, k); }
    c.fillStyle = '#4e4842'; c.fillRect(x - w / 2 - 4, y - hgt - 2, w + 8, 4);
    c.fillStyle = '#1f1a16'; rr(c, x - 3, y - 110, 6, 18, 3); rr(c, x - 3, y - 64, 6, 16, 3);
    c.fillStyle = '#4e3220'; rr(c, x - 12, y - 32, 24, 32, [12, 12, 0, 0]);
    // drapeau
    c.fillStyle = '#3a2416'; c.fillRect(x - 1.5, y - hgt - 52, 3, 40);
    c.fillStyle = '#e2b04a'; circ(c, x, y - hgt - 53, 3);
    const pts = [];
    for (let i = 0; i <= 8; i++) pts.push(x + 1.5 + i * 5, y - hgt - 50 + Math.sin(gt * 5 - i * 0.7) * 2.5 * (i / 8));
    for (let i = 8; i >= 0; i--) pts.push(x + 1.5 + i * 5, y - hgt - 30 - i * 1.2 + Math.sin(gt * 5 - i * 0.7) * 2.5 * (i / 8));
    c.fillStyle = '#b8322a'; poly(c, pts);
    c.fillStyle = '#e2b04a'; circ(c, x + 14, y - hgt - 41 + Math.sin(gt * 5 - 2) * 1, 3.5);
  }
  function drawBanner(c, o) {
    const x = o.x, y = o.y;
    shadow(c, x, y, 8, 3);
    c.fillStyle = '#3a2416'; c.fillRect(x - 2, y - 74, 4, 74); c.fillRect(x - 14, y - 72, 28, 3);
    c.fillStyle = '#e2b04a'; circ(c, x, y - 76, 3.2);
    const sw = Math.sin(gt * 2.4 + x) * 2;
    c.fillStyle = '#b8322a'; poly(c, [x - 12, y - 69, x + 12, y - 69, x + 12 + sw, y - 30, x + sw, y - 38, x - 12 + sw, y - 30]);
    c.fillStyle = '#e2b04a'; poly(c, [x + sw * 0.5, y - 62, x + 5 + sw * 0.6, y - 54, x + sw * 0.6, y - 46, x - 5 + sw * 0.6, y - 54]);
    c.fillStyle = 'rgba(0,0,0,.15)'; poly(c, [x + 4, y - 69, x + 12, y - 69, x + 12 + sw, y - 30, x + 6 + sw, y - 34]);
  }
  function drawHay(c, o) {
    shadow(c, o.x, o.y, 22, 7);
    c.fillStyle = '#b8903f'; rr(c, o.x - 20, o.y - 26, 40, 26, 10);
    c.fillStyle = '#d9b260'; ell(c, o.x - 14, o.y - 13, 7, 12);
    c.strokeStyle = '#a07a30'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(o.x - 14, o.y - 13, 4, 8, 0, 0, 7); c.stroke();
    c.fillStyle = 'rgba(255,240,180,.35)'; c.fillRect(o.x - 6, o.y - 24, 22, 3);
  }
  function drawDeco(c, o) {
    if (o.t === 'charred') {
      shadow(c, o.x, o.y, 14, 5);
      c.fillStyle = '#2a211c'; poly(c, [o.x - 7, o.y, o.x - 5, o.y - 30, o.x - 9, o.y - 42, o.x - 2, o.y - 34, o.x + 1, o.y - 48, o.x + 4, o.y - 30, o.x + 7, o.y]);
      c.fillStyle = `rgba(255,120,40,${0.4 + Math.sin(gt * 3 + o.x) * 0.3})`; circ(c, o.x - 2, o.y - 12, 1.6); circ(c, o.x + 3, o.y - 22, 1.3);
    } else {
      c.fillStyle = '#e9e1cf';
      c.save(); c.translate(o.x, o.y); c.rotate(o.x % 3);
      rr(c, -12, -2, 24, 4, 2); circ(c, -12, -2, 3); circ(c, -12, 2, 3); circ(c, 12, -2, 3); circ(c, 12, 2, 3);
      c.restore();
      c.fillStyle = '#ddd3bd'; ell(c, o.x + 10, o.y - 6, 7, 6); c.fillStyle = '#3a3028'; circ(c, o.x + 8, o.y - 7, 1.5); circ(c, o.x + 12, o.y - 7, 1.5);
    }
  }
  function drawLamp(c, o) {
    shadow(c, o.x, o.y, 8, 3);
    c.fillStyle = '#3e3229'; c.fillRect(o.x - 2.5, o.y - 46, 5, 46); c.fillRect(o.x - 6, o.y - 4, 12, 4);
    c.fillStyle = '#2e2620'; rr(c, o.x - 8, o.y - 60, 16, 16, 3);
    c.fillStyle = night > 0.2 ? '#ffe08a' : '#d9cfa8'; c.fillRect(o.x - 5, o.y - 57, 10, 10);
    c.fillStyle = '#2e2620'; poly(c, [o.x - 10, o.y - 60, o.x, o.y - 68, o.x + 10, o.y - 60]);
  }
  function drawMonument(c, o) {
    const x = o.x, y = o.y, lit = S.flags.ending;
    shadow(c, x, y, 30, 9);
    c.fillStyle = '#8f8a84'; rr(c, x - 28, y - 14, 56, 14, 4);
    c.fillStyle = '#a9a39d'; rr(c, x - 20, y - 26, 40, 14, 4);
    c.fillStyle = '#bdb7b0'; c.fillRect(x - 20, y - 26, 40, 3);
    const pulse = 0.5 + Math.sin(gt * 2) * 0.5;
    if (lit) {
      const g = c.createRadialGradient(x, y - 55, 4, x, y - 55, 70);
      g.addColorStop(0, `rgba(170,240,255,${0.55 + pulse * 0.25})`); g.addColorStop(1, 'rgba(170,240,255,0)');
      c.fillStyle = g; circ(c, x, y - 55, 70);
    }
    const fy = y - 30 - (lit ? 6 + Math.sin(gt * 1.5) * 4 : 0);
    c.fillStyle = lit ? '#6fd6f6' : '#7d8799'; poly(c, [x - 13, fy - 18, x, fy - 52, x + 13, fy - 18, x, fy]);
    c.fillStyle = lit ? '#d9fbff' : '#a3abba'; poly(c, [x - 5, fy - 20, x, fy - 48, x + 3, fy - 22, x, fy - 6]);
    c.fillStyle = lit ? '#3fb2df' : '#5f6878'; poly(c, [x, fy - 52, x + 13, fy - 18, x, fy]);
  }
  function drawWell(c, o) {
    const x = o.x, y = o.y;
    shadow(c, x, y, 24, 8);
    c.fillStyle = '#4b3a2c'; c.fillRect(x - 20, y - 52, 4, 44); c.fillRect(x + 16, y - 52, 4, 44);
    c.fillStyle = '#8d8984'; rr(c, x - 22, y - 22, 44, 22, 8);
    c.fillStyle = '#a9a49e'; ell(c, x, y - 21, 22, 8); c.fillStyle = '#2b4b63'; ell(c, x, y - 21, 15, 5);
    c.fillStyle = '#a5513c'; poly(c, [x - 28, y - 48, x, y - 66, x + 28, y - 48]);
    c.fillStyle = '#6b4a2f'; c.fillRect(x - 1, y - 48, 2, 14); c.fillStyle = '#7a5a3a'; rr(c, x - 5, y - 36, 10, 8, 2);
  }
  function drawStall(c, o) {
    const x = o.x, y = o.y;
    shadow(c, x, y, 50, 9);
    c.fillStyle = '#5c4029'; c.fillRect(x - 46, y - 62, 5, 62); c.fillRect(x + 41, y - 62, 5, 62);
    c.fillStyle = '#8f6540'; c.fillRect(x - 48, y - 30, 96, 26); c.fillStyle = '#a77a4f'; c.fillRect(x - 48, y - 30, 96, 5);
    for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#f6efe0' : '#d6483a'; poly(c, [x - 52 + k * 13, y - 64, x - 39 + k * 13, y - 64, x - 39 + k * 13, y - 52, x - 45.5 + k * 13, y - 48, x - 52 + k * 13, y - 52]); }
    c.font = '15px serif'; c.textAlign = 'center'; c.fillText('🍎', x - 28, y - 32); c.fillText('🧀', x - 8, y - 32); c.fillText('🏺', x + 14, y - 32); c.fillText('🧶', x + 32, y - 32);
  }
  function drawTent(c, o) {
    const x = o.x, y = o.y;
    shadow(c, x, y, 50, 10);
    c.fillStyle = '#4f8a52'; poly(c, [x - 52, y, x, y - 70, x + 52, y]);
    c.fillStyle = '#3e7041'; poly(c, [x, y - 70, x + 52, y, x + 10, y]);
    c.fillStyle = '#2c3d2c'; poly(c, [x - 14, y, x, y - 40, x + 14, y]);
    c.strokeStyle = '#e8d9b4'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 30, y - 30); c.lineTo(x - 36, y - 26); c.stroke();
    c.fillStyle = '#6b4a2f'; rr(c, x - 78, y - 14, 20, 14, 3); c.font = '14px serif'; c.textAlign = 'center'; c.fillText('🌿', x - 68, y - 14);
    // feu de camp
    c.fillStyle = '#6b4a2f'; c.fillRect(x - 6, y + 18, 26, 5);
    const f = 0.8 + Math.sin(gt * 12) * 0.2;
    c.fillStyle = '#ff9b3d'; poly(c, [x, y + 19, x + 7, y + 19 - 18 * f, x + 14, y + 19]); c.fillStyle = '#ffe07a'; poly(c, [x + 4, y + 19, x + 7, y + 19 - 10 * f, x + 10, y + 19]);
  }
  function drawSign(c, o) {
    shadow(c, o.x, o.y, 12, 4);
    c.fillStyle = '#6b4a2f'; c.fillRect(o.x - 2.5, o.y - 34, 5, 34);
    c.fillStyle = '#a77a4f'; rr(c, o.x - 18, o.y - 42, 36, 18, 3);
    c.fillStyle = '#6b4a2f'; c.fillRect(o.x - 12, o.y - 36, 24, 2); c.fillRect(o.x - 10, o.y - 31, 18, 2);
  }
  function drawSmall(c, o) {
    if (o.kind === 'anvil') { shadow(c, o.x, o.y, 16, 5); c.fillStyle = '#3c3f44'; rr(c, o.x - 6, o.y - 12, 12, 12, 2); c.fillStyle = '#55595f'; poly(c, [o.x - 18, o.y - 20, o.x + 14, o.y - 20, o.x + 20, o.y - 16, o.x + 10, o.y - 12, o.x - 12, o.y - 12]); }
    if (o.kind === 'barrel') { shadow(c, o.x, o.y, 12, 4); c.fillStyle = '#8f6540'; rr(c, o.x - 11, o.y - 26, 22, 26, 6); c.fillStyle = '#5c4029'; c.fillRect(o.x - 11, o.y - 20, 22, 3); c.fillRect(o.x - 11, o.y - 8, 22, 3); c.font = '14px serif'; c.textAlign = 'center'; c.fillText('🐟', o.x, o.y - 26); }
  }
  function drawToolSwing(c, o) {
    if (!(o.swing > 0) || !o.tool) return;
    const side = o.dir === 'left' ? -1 : 1;
    const a = (-1.6 + (1 - o.swing) * 2.6) * side;
    c.save(); c.translate(side * 10, -21); c.rotate(a);
    c.fillStyle = '#6b4226'; c.fillRect(-1.8, -24, 3.6, 24);
    if (o.tool === 'axe') { c.fillStyle = '#b8c2cc'; poly(c, [1, -24, 12, -28, 13, -14, 1, -17]); c.fillStyle = '#eef3f7'; poly(c, [10, -27, 13, -27, 13, -15, 11, -16]); }
    else { c.fillStyle = S.up.golden ? '#f2c14e' : S.tools.pickaxe >= 2 ? '#d5dee6' : '#9aa3ad'; poly(c, [-13, -19, 0, -27, 13, -19, 0, -23]); }
    c.restore();
    // traînée
    const a0 = -1.6 * side;
    c.strokeStyle = `rgba(255,255,255,${0.55 * o.swing})`; c.lineWidth = 3;
    c.beginPath(); c.arc(side * 10, -21, 25, -Math.PI / 2 + a0, -Math.PI / 2 + a, side < 0); c.stroke();
  }
  function drawFishingLine(c, o, x, y) {
    const f = o.fishing; if (!f) return;
    const side = f.o.x < o.x ? -1 : 1;
    const tx = x + side * 26, ty = y - 50;
    c.strokeStyle = '#7a4e2d'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x + side * 8, y - 22); c.lineTo(tx, ty); c.stroke();
    const bob2 = Math.sin(gt * 6) * 2 + (f.t > f.need - 0.4 ? Math.sin(gt * 40) * 3 : 0);
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo((tx + f.o.x) / 2, ty + 10, f.o.x, f.o.y + bob2); c.stroke();
    c.fillStyle = '#e8443a'; circ(c, f.o.x, f.o.y + bob2 - 2, 4); c.fillStyle = '#fff'; circ(c, f.o.x, f.o.y + bob2 + 1, 3);
  }
  function drawHero(c, o) {
    const x = Math.round(o.x), y = Math.round(o.y), dir = o.dir;
    const ph = o.moving ? Math.sin(o.walk * 11) : 0;
    const side = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
    const flut = Math.sin(gt * 7 + o.walk * 5) * (o.moving ? 2.5 : 0.8);
    if (invuln > 0 && Math.floor(gt * 18) % 2 === 0) c.globalAlpha = 0.45;
    shadow(c, x, y, 14, 5.5);
    c.save(); c.translate(x, y);
    const by = -27 - Math.abs(ph) * 1.3, hy = by - 11;
    const crystal = S.sword >= 2;
    const tunic = '#2f5f9e', tunicD = '#234a7c', trim = '#e2b04a', leather = '#6b4226', leatherD = '#4a2d18';
    const mantle = () => {
      c.fillStyle = '#5c3b22'; c.beginPath();
      if (side === 0) { c.moveTo(-11, by + 1); c.lineTo(11, by + 1); c.lineTo(12 + flut * 0.3, by + 17); c.quadraticCurveTo(0, by + 20 + flut * 0.5, -12 + flut * 0.3, by + 17); }
      else { c.moveTo(side * 3, by + 1); c.lineTo(-side * 9, by + 1); c.lineTo(-side * (15 + Math.abs(flut)), by + 16); c.quadraticCurveTo(-side * 6, by + 19, side * 2, by + 14); }
      c.closePath(); c.fill();
    };
    const shieldBack = (sx, sy, s) => {
      c.fillStyle = '#3e2614'; circ(c, sx, sy, 10.5 * s);
      c.fillStyle = '#8a5a32'; circ(c, sx, sy, 8.8 * s);
      c.strokeStyle = 'rgba(60,35,15,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(sx - 8 * s, sy - 3 * s); c.lineTo(sx + 8 * s, sy - 3 * s); c.moveTo(sx - 8 * s, sy + 3 * s); c.lineTo(sx + 8 * s, sy + 3 * s); c.stroke();
      c.strokeStyle = '#c3ccd4'; c.lineWidth = 2 * s; c.beginPath(); c.arc(sx, sy, 9.6 * s, 0, 7); c.stroke();
      c.fillStyle = '#7bd3f2'; poly(c, [sx, sy - 6 * s, sx + 4 * s, sy, sx, sy + 6 * s, sx - 4 * s, sy]);
      c.fillStyle = '#e6fbff'; poly(c, [sx, sy - 5 * s, sx + 1.5 * s, sy, sx, sy + 1 * s, sx - 2 * s, sy - 1 * s]);
    };
    const swordBack = (hx, hy2, ang) => {
      c.save(); c.translate(hx, hy2); c.rotate(ang);
      c.fillStyle = leather; c.fillRect(-1.6, -9, 3.2, 9);
      c.fillStyle = crystal ? '#7bd3f2' : trim; c.fillRect(-5.5, 0, 11, 2.6); circ(c, 0, -10, 2.3);
      c.restore();
    };
    const slash = () => {
      if (!(o.attack > 0)) return;
      const base = dir === 'right' ? 0 : dir === 'down' ? Math.PI / 2 : dir === 'left' ? Math.PI : -Math.PI / 2;
      const p = 1 - o.attack, a = base - 1.3 + p * 2.6;
      c.save(); c.translate(0, by + 6);
      c.strokeStyle = crystal ? `rgba(150,235,255,${0.75 * o.attack})` : `rgba(255,255,255,${0.65 * o.attack})`; c.lineWidth = 7; c.lineCap = 'round';
      c.beginPath(); c.arc(0, 0, 31, base - 1.3, a); c.stroke();
      c.rotate(a);
      c.fillStyle = crystal ? '#c9f4ff' : '#e3e9ee'; poly(c, [8, -2.4, 37, -1.3, 42, 0, 37, 1.3, 8, 2.4]);
      c.fillStyle = crystal ? '#4fbde6' : '#98a3ae'; c.fillRect(9, -0.6, 28, 1.2);
      c.fillStyle = crystal ? '#7bd3f2' : trim; c.fillRect(5, -5.5, 3, 11); c.fillStyle = leather; c.fillRect(-2, -1.7, 7, 3.4);
      c.restore();
    };
    if (dir === 'up') { slash(); drawToolSwing(c, o); }
    if (dir !== 'up') mantle();
    if (side !== 0) shieldBack(-side * 10, by + 9, 0.85);
    // jambes + bottes
    const l1 = Math.max(0, ph) * -3, l2 = Math.max(0, -ph) * -3;
    c.fillStyle = '#d8c7a3'; rr(c, -7, -12 + l1, 6, 12, 2); rr(c, 1, -12 + l2, 6, 12, 2);
    c.fillStyle = leatherD; rr(c, -8, -6 + l1, 8, 7, 2); rr(c, 0, -6 + l2, 8, 7, 2);
    c.fillStyle = leather; c.fillRect(-8, -6 + l1, 8, 2); c.fillRect(0, -6 + l2, 8, 2);
    // tunique
    c.fillStyle = tunic; rr(c, -10, by, 20, 16, 6);
    c.beginPath(); c.moveTo(-10, by + 10); c.lineTo(10, by + 10); c.lineTo(13, by + 21); c.lineTo(-13, by + 21); c.closePath(); c.fill();
    c.fillStyle = tunicD; c.fillRect(3, by + 13, 1.5, 7); c.fillRect(-4.5, by + 13, 1.5, 7);
    c.fillStyle = trim; c.fillRect(-13, by + 19.5, 26, 2);
    c.fillStyle = leather; c.fillRect(-10.5, by + 10, 21, 3.5); c.fillStyle = trim; rr(c, -2.5, by + 9.5, 5, 4.5, 1);
    c.strokeStyle = leather; c.lineWidth = 3; c.beginPath();
    if (dir !== 'up') { c.moveTo(-8, by + 1); c.lineTo(8, by + 10); } else { c.moveTo(8, by + 1); c.lineTo(-8, by + 10); }
    c.stroke();
    // bras
    const arm = o.moving ? ph * 3 : 0;
    c.fillStyle = tunic; rr(c, -14, by + 2 + arm, 5, 10, 3); rr(c, 9, by + 2 - arm, 5, 10, 3);
    c.fillStyle = leather; rr(c, -14.5, by + 8 + arm, 6, 4, 1.5); rr(c, 8.5, by + 8 - arm, 6, 4, 1.5);
    c.fillStyle = '#f3c9a0'; circ(c, -11.5, by + 13.5 + arm, 2.6); circ(c, 11.5, by + 13.5 - arm, 2.6);
    if (dir === 'up') { mantle(); shieldBack(0, by + 8, 1); swordBack(7, by - 2, 0.5); }
    else if (side === 0) swordBack(-9, by - 1, -0.55);
    else swordBack(-side * 7, by - 1, -side * 0.5);
    // capuche repliée
    c.fillStyle = '#6e4a2c'; ell(c, 0, by + 1, 11.5, 4.5);
    // tête
    const ex = side * 3.5, hair = '#a4532a', hairD = '#7d3b1c';
    c.fillStyle = '#f3c9a0'; circ(c, 0, hy, 11);
    c.fillStyle = hair;
    if (dir === 'up') {
      circ(c, 0, hy - 1, 11.8);
      poly(c, [-11, hy + 2, -8, hy + 8, -5, hy + 3, -2, hy + 9, 1, hy + 3, 4, hy + 9, 7, hy + 3, 10, hy + 8, 11, hy + 1]);
      poly(c, [-5, hy - 10, -2, hy - 17, 1, hy - 11, 4, hy - 16, 6, hy - 9]);
    } else {
      c.beginPath(); c.arc(0, hy - 1, 12, Math.PI, Math.PI * 2); c.fill();
      const f = side * 2;
      poly(c, [-11.5 + f, hy - 2, -8 + f, hy + 3, -5.5 + f, hy - 3, -2 + f, hy + 2, 0.5 + f, hy - 3, 4 + f, hy + 2.5, 6.5 + f, hy - 2.5, 11.5 + f, hy, 11 + f, hy - 8, -11 + f, hy - 8]);
      if (side <= 0) rr(c, -12.5, hy - 4, 4, 10, 2);
      if (side >= 0) rr(c, 8.5, hy - 4, 4, 10, 2);
      poly(c, [-6, hy - 10, -3, hy - 18, 0, hy - 11, 4, hy - 17, 6.5, hy - 9]);
      c.fillStyle = hairD; poly(c, [-3 + f, hy - 8, -1 + f, hy - 2, 1 + f, hy - 8]); poly(c, [5 + f, hy - 8, 6.5 + f, hy - 3, 8 + f, hy - 8]);
      // visage
      const blink = gt % 4.1 < 0.12;
      if (blink) { c.fillStyle = '#2a1d15'; c.fillRect(ex - 6, hy + 2.5, 4, 1.4); c.fillRect(ex + 2, hy + 2.5, 4, 1.4); }
      else {
        c.fillStyle = '#fff'; ell(c, ex - 4, hy + 2.5, 2.4, 2.9); ell(c, ex + 4, hy + 2.5, 2.4, 2.9);
        c.fillStyle = '#2d6a9e'; circ(c, ex - 4 + side * 0.7, hy + 3, 1.75); circ(c, ex + 4 + side * 0.7, hy + 3, 1.75);
        c.fillStyle = '#10202e'; circ(c, ex - 4 + side * 0.8, hy + 3.1, 0.9); circ(c, ex + 4 + side * 0.8, hy + 3.1, 0.9);
        c.fillStyle = '#fff'; circ(c, ex - 4.6, hy + 2, 0.6); circ(c, ex + 3.4, hy + 2, 0.6);
      }
      c.fillStyle = hairD; c.fillRect(ex - 6.5, hy - 1.6, 5, 1.4); c.fillRect(ex + 1.5, hy - 1.6, 5, 1.4);
      c.fillStyle = 'rgba(240,120,120,.4)'; circ(c, ex - 7, hy + 6.5, 2); circ(c, ex + 7, hy + 6.5, 2);
      c.strokeStyle = '#8a4a32'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(ex - 1.8, hy + 8); c.quadraticCurveTo(ex, hy + 9.2, ex + 1.8, hy + 8); c.stroke();
    }
    if (dir !== 'up') { slash(); drawToolSwing(c, o); }
    c.restore();
    c.globalAlpha = 1;
  }
  function drawChar(c, o) {
    if (o.look.hero) { drawHero(c, o); drawFishingLine(c, o, Math.round(o.x), Math.round(o.y)); return; }
    const L = o.look, x = Math.round(o.x), y = Math.round(o.y);
    const ph = o.moving ? Math.sin(o.walk * 11) : 0;
    const bob = o.kind === 'npc' ? Math.sin(gt * 2 + o.bob) * 0.8 : 0;
    const dir = o.dir;
    shadow(c, x, y, 13, 5);
    c.save(); c.translate(x, y);
    const swingTool = () => {
      if (!(o.swing > 0) || !o.tool) return;
      const side = dir === 'left' ? -1 : 1;
      const a = (-1.6 + (1 - o.swing) * 2.6) * side;
      c.save(); c.translate(side * 9, -20); c.rotate(a);
      c.fillStyle = '#7a4e2d'; c.fillRect(-1.5, -22, 3, 22);
      c.fillStyle = '#9aa3ad';
      if (o.tool === 'axe') poly(c, [1, -22, 10, -25, 10, -13, 1, -16]);
      else { c.fillStyle = S.up.golden ? '#f2c14e' : S.tools.pickaxe >= 2 ? '#c9d4de' : '#9aa3ad'; poly(c, [-12, -18, 0, -25, 12, -18, 0, -22]); }
      c.restore();
    };
    if (dir === 'up') swingTool();
    // jambes
    c.fillStyle = L.pants;
    if (L.robe) { rr(c, -9, -14, 18, 14, 4); }
    else { rr(c, -7, -11 + Math.max(0, ph) * -3, 6, 11, 3); rr(c, 1, -11 + Math.max(0, -ph) * -3, 6, 11, 3); c.fillStyle = '#4a3528'; rr(c, -7.5, -3 + Math.max(0, ph) * -3, 7, 4, 2); rr(c, 0.5, -3 + Math.max(0, -ph) * -3, 7, 4, 2); }
    const by = -26 - Math.abs(ph) * 1.2 + bob;
    // corps
    c.fillStyle = L.shirt; rr(c, -10, by, 20, 16, 7);
    if (L.apron) { c.fillStyle = L.apron; rr(c, -7, by + 3, 14, 14, 3); }
    // bras
    c.fillStyle = L.shirt;
    const arm = o.moving ? ph * 3 : 0;
    rr(c, -13, by + 2 + arm, 5, 11, 3); rr(c, 8, by + 2 - arm, 5, 11, 3);
    c.fillStyle = L.skin; circ(c, -10.5, by + 13 + arm, 2.6); circ(c, 10.5, by + 13 - arm, 2.6);
    if (L.scarf) { c.fillStyle = L.scarf; rr(c, -8, by - 1, 16, 5, 3); if (dir !== 'up') c.fillRect(dir === 'left' ? 3 : -6, by + 2, 4, 8); }
    // tête
    const hy = by - 10;
    c.fillStyle = L.skin; circ(c, 0, hy, 11.5);
    c.fillStyle = L.hair;
    if (dir === 'up') { if (L.style !== 'bald') circ(c, 0, hy - 1, 12); else { c.beginPath(); c.arc(0, hy + 2, 11.5, Math.PI * 0.1, Math.PI * 0.9); c.fill(); } }
    else if (L.style === 'bald') { c.beginPath(); c.arc(0, hy, 11.8, Math.PI * 0.85, Math.PI * 1.05); c.arc(0, hy, 11.8, Math.PI * 1.95, Math.PI * 0.15); c.fill(); }
    else { c.beginPath(); c.arc(0, hy - 1, 12.2, Math.PI * 1.02, Math.PI * 1.98); c.fill(); rr(c, -12, hy - 4, 5, 8, 2); rr(c, 7, hy - 4, 5, 8, 2); }
    if (L.style === 'bun') circ(c, 0, hy - 13, 6);
    if (L.style === 'long' && dir !== 'up') { rr(c, -13, hy - 3, 6, 18, 3); rr(c, 7, hy - 3, 6, 18, 3); }
    if (L.style === 'long' && dir === 'up') rr(c, -12, hy, 24, 16, 5);
    // visage
    if (dir !== 'up') {
      const ex = dir === 'left' ? -4 : dir === 'right' ? 4 : 0;
      c.fillStyle = '#2a1d15';
      const blink = (gt + (o.bob || 0)) % 4 < 0.12;
      if (blink) { c.fillRect(ex - 6, hy + 1, 4, 1.5); c.fillRect(ex + 2, hy + 1, 4, 1.5); }
      else { circ(c, ex - 4, hy + 1, 1.9); circ(c, ex + 4, hy + 1, 1.9); c.fillStyle = '#fff'; circ(c, ex - 3.4, hy + 0.4, 0.6); circ(c, ex + 4.6, hy + 0.4, 0.6); }
      c.fillStyle = 'rgba(240,120,120,.45)'; circ(c, ex - 7, hy + 5, 2.2); circ(c, ex + 7, hy + 5, 2.2);
      if (L.beard) { c.fillStyle = L.beard; c.beginPath(); c.arc(ex * 0.5, hy + 4, 9.5, 0.1, Math.PI - 0.1); c.fill(); }
      else { c.strokeStyle = '#7a3b2a'; c.lineWidth = 1.3; c.beginPath(); c.arc(ex, hy + 4.5, 2.5, 0.2, Math.PI - 0.2); c.stroke(); }
    }
    if (L.straw) { c.fillStyle = '#e8c56a'; ell(c, 0, hy - 7, 17, 5); c.fillStyle = '#d8b04f'; rr(c, -9, hy - 17, 18, 10, 5); c.fillStyle = '#c0483a'; c.fillRect(-9, hy - 10, 18, 3); }
    if (L.hat) { c.fillStyle = L.hat; ell(c, 0, hy - 8, 16, 4.5); rr(c, -9, hy - 19, 18, 12, 4); c.fillStyle = '#c0483a'; c.fillRect(-9, hy - 11, 18, 3); }
    if (dir !== 'up') swingTool();
    c.restore();
    // canne à pêche
    if (o.fishing) {
      const f = o.fishing, side = f.o.x < o.x ? -1 : 1;
      const tx = x + side * 26, ty = y - 50;
      c.strokeStyle = '#7a4e2d'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x + side * 8, y - 22); c.lineTo(tx, ty); c.stroke();
      const bob2 = Math.sin(gt * 6) * 2 + (f.t > f.need - 0.4 ? Math.sin(gt * 40) * 3 : 0);
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo((tx + f.o.x) / 2, ty + 10, f.o.x, f.o.y + bob2); c.stroke();
      c.fillStyle = '#e8443a'; circ(c, f.o.x, f.o.y + bob2 - 2, 4); c.fillStyle = '#fff'; circ(c, f.o.x, f.o.y + bob2 + 1, 3);
    }
  }
  function drawChicken(c, o) {
    const x = o.x, y = o.y - Math.abs(Math.sin(o.hop * 10)) * 3;
    shadow(c, o.x, o.y, 9, 3);
    c.save(); c.translate(x, y); c.scale(o.dir, 1);
    c.strokeStyle = '#e09a2c'; c.lineWidth = 2; c.beginPath(); c.moveTo(-2, -4); c.lineTo(-2, 0); c.moveTo(3, -4); c.lineTo(3, 0); c.stroke();
    c.fillStyle = '#fbfaf5'; ell(c, 0, -10, 10, 8); poly(c, [8, -14, 14, -20, 12, -10]);
    c.fillStyle = '#fff'; circ(c, -7, -17, 6);
    c.fillStyle = '#e0453a'; circ(c, -7, -24, 3); circ(c, -10, -22, 2.4); c.fillRect(-10, -15, 3, 4);
    c.fillStyle = '#f2a33a'; poly(c, [-12, -18, -17, -16, -12, -15]);
    c.fillStyle = '#222'; circ(c, -9, -18, 1.2);
    c.fillStyle = '#ece6d6'; ell(c, 2, -10, 5, 4);
    c.restore();
  }
  function drawBridge(c) {
    const x0 = bridge.x0 * T - 10, x1 = (bridge.x1 + 1) * T + 10, y0 = bridge.y0 * T + 6, y1 = (bridge.y1 + 1) * T - 6;
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x0, y1, x1 - x0, 8);
    if (S.flags.bridge) {
      for (let x = x0; x < x1; x += 12) { c.fillStyle = (x / 12) % 2 < 1 ? '#a77a4f' : '#9a6e45'; c.fillRect(x, y0, 11, y1 - y0); c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(x + 10, y0, 1, y1 - y0); }
      c.fillStyle = '#6b4a2f'; c.fillRect(x0, y0 - 6, x1 - x0, 6); c.fillRect(x0, y1, x1 - x0, 5);
      for (let x = x0; x <= x1; x += 40) { c.fillStyle = '#5c4029'; c.fillRect(x - 3, y0 - 14, 7, 14); c.fillRect(x - 3, y1 - 4, 7, 12); }
    } else {
      const left = x0 + 30, right = x1 - 30;
      for (let x = x0; x < left; x += 12) { c.fillStyle = '#9a6e45'; c.fillRect(x, y0, 11, y1 - y0); }
      for (let x = right; x < x1; x += 12) { c.fillStyle = '#9a6e45'; c.fillRect(x, y0, 11, y1 - y0); }
      c.fillStyle = '#7d5a39'; c.save(); c.translate(left + 8, y0 + 20); c.rotate(0.5); c.fillRect(0, 0, 11, 30); c.restore();
      c.strokeStyle = '#8b6b4a'; c.lineWidth = 2; c.beginPath(); c.moveTo(left, y0 - 2); c.quadraticCurveTo((left + right) / 2, y0 + 30, right, y0 - 2); c.stroke();
      c.fillStyle = '#5c4029'; [x0, left, right, x1].forEach((x) => c.fillRect(x - 3, y0 - 14, 7, 18));
    }
  }

  /* ===================== Jeu ===================== */
  let state = 'title', gt = 0, night = 0, darkness = 0, inCave = false;
  const keys = {};
  const particles = [], floats = [], butterflies = [], fireflies = [];
  let target = null, actCd = 0, actHeld = false, objective = null, objTimer = 0;
  const joy = { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  const hasTool = (t) => !t || (t === 'axe' && S.tools.axe > 0) || (t === 'pickaxe' && S.tools.pickaxe >= 1) || (t === 'steel' && S.tools.pickaxe >= 2) || (t === 'rod' && S.tools.rod > 0);
  const toolDmg = (t) => (t === 'axe' ? 1 + (S.up.sharp ? 1 : 0) : t === 'pickaxe' || t === 'steel' ? S.tools.pickaxe + (S.up.golden ? 1 : 0) : 1);
  const alive = (o) => o.kind === 'node' && !o.dead && !o.gone;
  const qState = (id) => S.quests[id] || 'locked';
  const canComplete = (q) => (!q.flagNeed || !!S.flags[q.flagNeed]) && Object.entries(q.needs).every(([k, v]) => (S.inv[k] || 0) >= v);
  const npcById = (id) => npcs.find((n) => n.id === id);
  const questFor = (npcId) => QUESTS.find((q) => q.giver === npcId && qState(q.id) === 'active') || QUESTS.find((q) => q.giver === npcId && qState(q.id) === 'available');

  /* ---------- Collisions ---------- */
  function tileSolid(tx, ty) {
    const t = tile(tx, ty);
    if (t === WA) return !(S.flags.bridge && ty >= bridge.y0 && ty <= bridge.y1 && tx >= bridge.x0 && tx <= bridge.x1);
    return t === FO || t === CL;
  }
  function solids(o) {
    if (o.kind === 'node') {
      if (o.gone) return null;
      const d = NODE[o.type]; if (!d.solid) return null;
      if (o.dead && (o.type === 'rock' || o.type === 'iron' || o.type === 'crystal')) return null;
      return { r: o.dead ? 8 : d.r, x: o.x, y: o.y - 4 };
    }
    if (o.kind === 'house') return { rect: [o.x - o.w / 2 - 4, o.y - 34, o.x + o.w / 2 + 4, o.y + 2] };
    if (o.kind === 'npc') return { r: 12, x: o.x, y: o.y - 3 };
    if (o.kind === 'monument') return { r: 26, x: o.x, y: o.y - 8 };
    if (o.kind === 'well') return { r: 22, x: o.x, y: o.y - 8 };
    if (o.kind === 'stall') return { rect: [o.x - 50, o.y - 30, o.x + 50, o.y] };
    if (o.kind === 'tent') return { rect: [o.x - 50, o.y - 30, o.x + 50, o.y] };
    if (o.kind === 'lamp' || o.kind === 'sign') return { r: 6, x: o.x, y: o.y - 2 };
    if (o.kind === 'anvil' || o.kind === 'barrel') return { r: 11, x: o.x, y: o.y - 4 };
    if (o.kind === 'tower') return { rect: [o.x - 33, o.y - 36, o.x + 33, o.y] };
    if (o.kind === 'banner') return { r: 5, x: o.x, y: o.y - 2 };
    if (o.kind === 'hay') return { r: 17, x: o.x, y: o.y - 8 };
    if (o.kind === 'deco' && o.t === 'charred') return { r: 8, x: o.x, y: o.y - 3 };
    return null;
  }
  const solidCache = [];
  function buildSolidCache() { solidCache.length = 0; for (const o of objs) if (o.kind !== 'player' && o.kind !== 'chicken' && o.kind !== 'dragon') solidCache.push(o); }
  function blocked(x, y, r) {
    for (let ty = Math.floor((y - r) / T); ty <= Math.floor((y + r) / T); ty++)
      for (let tx = Math.floor((x - r) / T); tx <= Math.floor((x + r) / T); tx++) {
        if (!tileSolid(tx, ty)) continue;
        const cx = clamp(x, tx * T, tx * T + T), cy = clamp(y, ty * T, ty * T + T);
        if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return true;
      }
    if (dragon && dragon.active && dragon.fly < 10 && dragon.state !== 'leave' && ((x - dragon.x) / 1.5) ** 2 + (y - (dragon.y - 6)) ** 2 < (r + 30) ** 2) return true;
    for (const o of solidCache) {
      if (Math.abs(o.x - x) > 90 || Math.abs(o.y - y) > 90) continue;
      const s = solids(o); if (!s) continue;
      if (s.rect) { const cx = clamp(x, s.rect[0], s.rect[2]), cy = clamp(y, s.rect[1], s.rect[3]); if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return true; }
      else if ((x - s.x) ** 2 + (y - s.y) ** 2 < (r + s.r) ** 2) return true;
    }
    return false;
  }

  /* ---------- Effets ---------- */
  function burst(x, y, color, n, opt = {}) {
    for (let k = 0; k < n; k++) particles.push({ x, y, vx: rand(-1, 1) * (opt.sp || 90), vy: rand(-1.4, -0.3) * (opt.sp || 90), life: rand(0.5, 0.9), max: 0.9, color: Array.isArray(color) ? color[k % color.length] : color, size: opt.size || rand(2.5, 4.5), g: opt.g ?? 300, shape: opt.shape || 'sq' });
  }
  function floatText(x, y, text, color) { floats.push({ x, y, text, life: 1.3, color: color || '#fff' }); }
  function toast(icon, title, text, cls) {
    const el = document.createElement('div'); el.className = 'toast ' + (cls || '');
    el.innerHTML = `<span class="ico">${icon}</span><div><b>${title}</b>${text ? `<small>${text}</small>` : ''}</div>`;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 450); }, 3600);
    const all = $('#toasts').children; if (all.length > 3) all[0].remove();
  }
  function fireworks(x, y) { const cols = ['#ffd84a', '#7bd3f2', '#ff8fb1', '#b9a2ff', '#8ef08a']; for (let k = 0; k < 60; k++) { const a = Math.random() * 6.28, s = rand(60, 220); particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.8, 1.5), max: 1.5, color: cols[k % 5], size: rand(2, 4), g: 80, shape: 'spark' }); } }

  /* ---------- Inventaire ---------- */
  function addItem(item, n, x, y) {
    S.inv[item] = (S.inv[item] || 0) + n;
    floatText(x, y, `+${n} ${ITEMS[item].icon}`);
    SFX.pickup();
    bumpSlot(item);
    // objectif rempli ?
    for (const q of QUESTS) if (qState(q.id) === 'active' && canComplete(q) && !S.notified[q.id]) {
      S.notified[q.id] = true;
      toast('✅', 'Objectif rempli !', `Retourne voir ${npcById(q.giver).name}.`, 'gold'); SFX.quest();
      $('#quest-card').classList.remove('flash'); void $('#quest-card').offsetWidth; $('#quest-card').classList.add('flash');
    }
    hudDirty = true;
  }

  /* ---------- Actions ---------- */
  function faceTo(o) { const dx = o.x - player.x, dy = o.y - player.y; player.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down'; }
  function act(press) {
    const t = target; if (dlg.open || modalOpen) return;
    if (!t) { if (press) attack(); return; }
    if (t.kind === 'npc') { if (press) talk(t); return; }
    if (t.kind === 'sign') { if (press) say({ name: 'Panneau', role: '', portrait: '🪧' }, t.text); return; }
    if (t.kind === 'monument') { if (press) say({ name: 'Cristal de Brumeval', role: '', portrait: '💎' }, S.flags.ending ? ['Le Cristal pulse doucement d’une lumière bleutée. Tout le village semble respirer.'] : ['Un grand cristal terne, couvert de poussière. On dirait qu’il dort…']); return; }
    if (t.kind === 'node') gather(t, press);
  }
  const TOOL_HINT = {
    pickaxe: 'Il te faut une pioche. Barnabé le forgeron pourrait t’en fabriquer une.',
    steel: 'C’est trop dur ! Il faut une pioche d’acier.',
    rod: 'Il te faut une canne à pêche. Pip, au bord du lac, en sait quelque chose…',
  };
  function gather(o, press) {
    if (actCd > 0 || player.fishing) return;
    const d = NODE[o.type];
    if (!hasTool(d.tool)) { if (press) { toast('🔒', 'Outil manquant', TOOL_HINT[d.tool]); SFX.error(); } actCd = 0.5; return; }
    faceTo(o);
    if (o.type === 'fish') { player.fishing = { o, t: 0, need: rand(1.4, 2.8) }; SFX.splash(); return; }
    actCd = 0.36;
    if (d.tool === 'axe' || d.tool === 'pickaxe' || d.tool === 'steel') { player.swing = 1; player.tool = d.tool === 'axe' ? 'axe' : 'pickaxe'; }
    o.hp -= toolDmg(d.tool); o.shake = 1;
    const hx = o.x, hy = o.y - (o.type === 'tree' || o.type === 'pine' ? 26 : 12);
    if (o.type === 'tree' || o.type === 'pine') { SFX.chop(); burst(hx, hy, ['#8a5a32', '#c49a6c'], 5); burst(o.x, o.y - 50, ['#3f9548', '#62b85a'], 4, { shape: 'leaf', g: 60, sp: 60 }); }
    else if (o.type === 'crystal') { SFX.mine(); burst(hx, hy - 6, ['#bfe9ff', '#c5b4ff', '#fff'], 7, { shape: 'spark' }); }
    else if (d.tool) { SFX.mine(); burst(hx, hy, ['#9aa0a6', '#c8ccd0', o.type === 'iron' ? '#d27a3c' : '#71777d'], 6); }
    else { SFX.pick(); burst(hx, hy - 6, ['#45964a', '#4a5ad8'], 5, { shape: 'leaf', g: 120 }); }
    if (o.hp <= 0) harvest(o);
  }
  function harvest(o) {
    const d = NODE[o.type];
    let n = d.n;
    if ((o.type === 'tree' || o.type === 'pine') && S.up.gloves) n++;
    addItem(d.item, n, o.x, o.y - 40);
    if (o.type === 'iron' && Math.random() < 0.4) setTimeout(() => addItem('pierre', 1, o.x + 10, o.y - 30), 250);
    if (o.type === 'boulder') {
      o.gone = true; S.flags['b' + o.bid] = true; SFX.boom(); burst(o.x, o.y - 10, ['#8b8580', '#b4aea8', '#5e5955'], 22, { sp: 160 }); shakeCam = 0.4;
      if (boulders.every((b) => b.gone)) { toast('⛰️', 'Le passage est ouvert !', 'La Grotte de Cristal t’attend au nord.', 'gold'); SFX.big(); }
      return;
    }
    o.dead = gt + d.respawn * (S.up.fertil ? 0.5 : 1); o.hp = d.hp;
    S.stats = S.stats || {}; S.stats.gathered = (S.stats.gathered || 0) + n;
  }
  let shakeCam = 0;

  /* ===================== Combat & dragon ===================== */
  Object.assign(SFX, {
    slash: () => { noise(0.1, 0.22, 4200); tone(950, 0.09, 'sawtooth', 0.018, 0.5); },
    hit: () => { noise(0.12, 0.45, 450); tone(170, 0.16, 'square', 0.06, 0.6); },
    hurt: () => { tone(420, 0.28, 'square', 0.06, 0.45); noise(0.15, 0.3, 900); },
    roar: () => { noise(1.4, 0.55, 170); tone(105, 1.3, 'sawtooth', 0.11, 0.55, 0, 0.12); tone(160, 1.1, 'sawtooth', 0.05, 0.6, 0.05, 0.12); },
    roar2: () => { noise(0.6, 0.4, 220); tone(140, 0.6, 'sawtooth', 0.08, 0.6, 0, 0.05); },
    fire: () => noise(0.35, 0.2, 850),
    explode: () => { noise(0.6, 0.5, 240); tone(70, 0.5, 'sine', 0.22, 0.5); },
    heal: () => [660, 880, 1100, 1320].forEach((f, k) => tone(f, 0.28, 'sine', 0.05, 0, k * 0.08)),
  });
  let invuln = 0, atkCd = 0, flyover = null, pendT = 0;
  const flames = [], fireballs = [];
  const dirVec = (d) => (d === 'left' ? [-1, 0] : d === 'right' ? [1, 0] : d === 'up' ? [0, -1] : [0, 1]);
  const dragonBusy = () => dragon.active && !['defeat', 'leave', 'land', 'retreat'].includes(dragon.state);
  function flashHurt() { const h = $('#hurt'); h.classList.add('on'); setTimeout(() => h.classList.remove('on'), 140); const hs = $('#hearts'); hs.classList.remove('hit'); void hs.offsetWidth; hs.classList.add('hit'); }
  function attack() {
    if (state !== 'play' || dlg.open || modalOpen || player.fishing || S.hp <= 0 || atkCd > 0) return;
    atkCd = 0.34; player.attack = 1; SFX.slash();
    const v = dirVec(player.dir), hx = player.x + v[0] * 30, hy = player.y - 16 + v[1] * 26;
    const d = dragon;
    if (dragonBusy() && d.fly < 10) {
      const bx = d.x + d.dir * 5, by = d.y - 32;
      if (((hx - bx) / 72) ** 2 + ((hy - by) / 50) ** 2 < 1) {
        let dmg = S.sword >= 2 ? 2 : 1; if (d.state === 'stun') dmg *= 2;
        d.hp -= dmg; d.flash = 0.14; SFX.hit();
        floatText(hx, hy - 12, '-' + dmg, d.state === 'stun' ? '#ffe14a' : '#fff');
        burst(hx, hy, ['#ffd84a', '#fff', '#ff8a4a'], 8, { shape: 'spark', sp: 150 });
        shakeCam = Math.max(shakeCam, 0.12);
        if (d.phase === 1 && d.hp <= DRAGON_HP / 2) { d.phase = 2; toast('🔥', 'Ignar est furieux !', 'Ses attaques deviennent plus rapides.', 'gold'); SFX.roar(); }
        if (d.hp <= 0) defeatDragon();
        updateBoss();
      }
    }
  }
  function hurt(n, fx, fy) {
    if (invuln > 0 || state !== 'play' || S.hp <= 0) return;
    S.hp = Math.max(0, S.hp - n); invuln = 1.1;
    const a = Math.atan2(player.y - fy, player.x - fx);
    player.kx = Math.cos(a) * 330; player.ky = Math.sin(a) * 330;
    player.fishing = null; actHeld = false;
    SFX.hurt(); shakeCam = Math.max(shakeCam, 0.25); flashHurt(); hudDirty = true;
    if (S.hp <= 0) {
      setTimeout(() => {
        openModal('💫 Tu t’es évanoui…', '<div class="center"><div style="font-size:56px">🌫️</div><p>Ondine t’a ramené au village et t’a soigné. Ignar est remonté dans le ciel…</p><p>Repose-toi, prépare des élixirs, puis retente ta chance !</p><button class="btn btn-gold btn-big" id="revive">Se relever</button></div>');
        $('#revive').onclick = closeModal;
      }, 700);
    }
  }
  function revive() {
    S.hp = MAXHP; player.x = P(18.9); player.y = P(30.4); player.kx = player.ky = 0;
    resetDragon(); cam.x = player.x; cam.y = player.y; hudDirty = true; save();
  }
  function resetDragon() { Object.assign(dragon, { active: false, hp: DRAGON_HP, phase: 1, state: 'idle', fly: 420, x: ARENA.x, y: ARENA.y, flash: 0 }); flames.length = 0; fireballs.length = 0; }
  function drinkPotion() {
    if (state !== 'play' || dlg.open || modalOpen || S.hp <= 0) return;
    if (S.potions <= 0) { toast('🧪', 'Plus d’élixir', S.flags.dragonSeen ? 'Mira ou Gus peuvent t’en procurer.' : 'Tu n’as pas encore d’élixir.'); SFX.error(); return; }
    if (S.hp >= MAXHP) { toast('❤️', 'Tu es en pleine forme !'); return; }
    S.potions--; S.hp = Math.min(MAXHP, S.hp + 3); SFX.heal();
    burst(player.x, player.y - 20, ['#8ef08a', '#c4f5c0', '#fff'], 16, { shape: 'spark', g: -60, sp: 70 });
    floatText(player.x, player.y - 60, '+3 ❤️', '#ff9db0'); hudDirty = true;
  }
  function updateBoss() {
    const show = dragon.active && dragon.state !== 'leave' && dragon.state !== 'retreat';
    $('#boss').classList.toggle('hidden', !show);
    if (show) $('#boss-fill').style.width = (Math.max(0, dragon.hp) / DRAGON_HP) * 100 + '%';
  }
  function defeatDragon() {
    const d = dragon; d.hp = 0; d.state = 'defeat'; d.t = 2.4;
    S.flags.dragonDefeated = true; flames.length = 0; fireballs.length = 0;
    SFX.roar(); shakeCam = 1; camFocus = { x: d.x, y: d.y - 60, until: gt + 3.2 };
    toast('🏆', 'Ignar est vaincu !', 'Retourne voir Ondine au village.', 'gold');
    setTimeout(() => { fireworks(player.x, player.y - 60); SFX.big(); }, 900);
    hudDirty = true; objTimer = 0; save();
  }
  function startDragonFight() {
    resetDragon(); dragon.active = true; dragon.state = 'land'; dragon.y = ARENA.y - 20; dragon.dir = player.x < dragon.x ? -1 : 1;
    toast('🐉', 'Ignar descend du ciel !', 'Esquive ses flammes et frappe-le quand il est sonné.', 'gold'); SFX.roar(); shakeCam = 0.6;
  }
  function clampToArena(x, y) { const dx = x - ARENA.x, dy = y - ARENA.y, d = Math.hypot(dx, dy), m = ARENA.r - 40; return d > m ? { x: ARENA.x + (dx / d) * m, y: ARENA.y + (dy / d) * m } : { x, y }; }
  function moveDragon(dx, dy) { const n = clampToArena(dragon.x + dx, dragon.y + dy), ok = Math.abs(n.x - dragon.x - dx) < 0.01 && Math.abs(n.y - dragon.y - dy) < 0.01; dragon.x = n.x; dragon.y = n.y; return ok; }
  const mouthPos = () => ({ x: dragon.x + dragon.dir * 100, y: dragon.y - dragon.fly - 74 });
  function nextIdle(extra = 0) { dragon.state = 'idle'; dragon.t = (dragon.phase === 2 ? rand(0.6, 1.1) : rand(1.1, 1.8)) + extra; }
  function chooseAttack(dd) {
    const r = Math.random(); let s;
    if (dd < 260) s = r < 0.42 ? 'breath' : r < 0.75 ? 'charge' : 'ball'; else s = r < 0.5 ? 'ball' : 'charge';
    if (s === 'breath') { dragon.state = 'windBreath'; dragon.t = 0.75; }
    else if (s === 'ball') { dragon.state = 'windBall'; dragon.t = 0.7; }
    else { dragon.state = 'windCharge'; dragon.t = dragon.phase === 2 ? 0.55 : 0.75; SFX.roar2(); }
  }
  function updateDragon(dt) {
    const d = dragon;
    if (!d.active) {
      if (qState('q10') === 'active' && !S.flags.dragonDefeated && S.hp > 0 && dist(player.x, player.y, ARENA.x, ARENA.y) < ARENA.r) startDragonFight();
      return;
    }
    if (d.flash > 0) d.flash -= dt;
    d.t -= dt;
    const px = player.x, py = player.y;
    if (!['leave', 'defeat', 'land', 'retreat'].includes(d.state) && (dist(px, py, ARENA.x, ARENA.y) > ARENA.r + 320 || S.hp <= 0)) d.state = 'retreat';
    switch (d.state) {
      case 'land': d.fly = Math.max(0, d.fly - dt * 200); if (d.fly <= 0) { d.state = 'roar'; d.t = 1.2; SFX.roar(); shakeCam = 0.8; burst(d.x, d.y, ['#8a7a6a', '#5a4a3e', '#3a302a'], 28, { sp: 220 }); } break;
      case 'roar': if (d.t <= 0) nextIdle(); break;
      case 'retreat': d.fly += dt * 240; if (d.fly > 420) { d.active = false; d.state = 'idle'; flames.length = 0; fireballs.length = 0; } break;
      case 'idle': {
        d.dir = px < d.x ? -1 : 1;
        const dd = dist(px, py, d.x, d.y), sp = d.phase === 2 ? 78 : 54;
        if (dd > 140) moveDragon(((px - d.x) / dd) * sp * dt, ((py - d.y) / dd) * sp * dt);
        if (d.t <= 0) chooseAttack(dd);
        break;
      }
      case 'windBreath': if (d.t <= 0) { d.state = 'breath'; d.t = 1.3; const m = mouthPos(); d.ba = Math.atan2(py - 16 - m.y, px - m.x); d.snd = 0; } break;
      case 'breath': {
        const m = mouthPos(), a = d.ba + Math.sin((1.3 - d.t) * 3) * 0.3;
        d.snd -= dt; if (d.snd <= 0) { d.snd = 0.28; SFX.fire(); }
        const n = Math.ceil(dt * 70);
        for (let k = 0; k < n; k++) { const aa = a + rand(-0.13, 0.13), sp = rand(240, 320); flames.push({ x: m.x, y: m.y, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp, life: rand(0.55, 0.75), max: 0.75, r: rand(7, 12) }); }
        if (d.t <= 0) nextIdle();
        break;
      }
      case 'windBall':
        if (d.t <= 0) {
          const m = mouthPos(), n = d.phase === 2 ? 5 : 3;
          for (let k = 0; k < n; k++) { const t2 = clampToArena(k === 0 ? px : px + rand(-150, 150), k === 0 ? py : py + rand(-110, 110)); fireballs.push({ sx: m.x, sy: m.y, tx: t2.x, ty: t2.y, t: -k * 0.2, dur: 1.15 }); }
          SFX.fire(); nextIdle(0.5);
        }
        break;
      case 'windCharge': if (d.t <= 0) { const dd = Math.max(1, dist(px, py, d.x, d.y)); d.cvx = ((px - d.x) / dd) * 450; d.cvy = ((py - d.y) / dd) * 450; d.dir = d.cvx < 0 ? -1 : 1; d.state = 'charge'; d.t = 0.8; } break;
      case 'charge': {
        const ok = moveDragon(d.cvx * dt, d.cvy * dt);
        if (Math.random() < dt * 30) burst(d.x, d.y, ['#8a7a6a', '#5a4a3e'], 2, { sp: 60 });
        if (!ok || d.t <= 0) { d.state = 'stun'; d.t = d.phase === 2 ? 1.4 : 1.9; shakeCam = 0.35; SFX.explode(); burst(d.x + d.dir * 60, d.y - 20, ['#8a7a6a', '#5a4a3e'], 16, { sp: 160 }); }
        break;
      }
      case 'stun': if (d.t <= 0) nextIdle(); break;
      case 'defeat': if (Math.random() < dt * 12) particles.push({ x: d.x + rand(-40, 40), y: d.y - rand(20, 70), vx: rand(-10, 10), vy: rand(-40, -20), life: 1.6, max: 1.6, color: 'rgba(80,70,70,.5)', size: rand(6, 11), g: -5, shape: 'smoke' }); if (d.t <= 0) { d.state = 'leave'; SFX.roar(); } break;
      case 'leave': d.fly += dt * 210; d.x += d.dir * dt * 170; if (d.fly > 650) { d.active = false; updateBoss(); } break;
    }
    if (['idle', 'charge', 'windCharge', 'windBreath', 'breath', 'windBall'].includes(d.state) && d.fly < 10 && ((px - d.x) / 1.5) ** 2 + (py - (d.y - 6)) ** 2 < 48 ** 2) hurt(d.state === 'charge' ? 2 : 1, d.x, d.y);
  }
  const fbPos = (fb) => { const p = clamp(fb.t / fb.dur, 0, 1); return { x: fb.sx + (fb.tx - fb.sx) * p, y: fb.sy + (fb.ty - fb.sy) * p - Math.sin(p * Math.PI) * 150, p }; };
  function updateCombatFx(dt) {
    for (let i = flames.length - 1; i >= 0; i--) {
      const f = flames[i]; f.life -= dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.985; f.vy *= 0.985;
      if (f.life <= 0) { flames.splice(i, 1); continue; }
      if (f.life < f.max - 0.06 && dist(f.x, f.y, player.x, player.y - 16) < f.r + 9) hurt(1, f.x - f.vx * 0.1, f.y - f.vy * 0.1);
    }
    for (let i = fireballs.length - 1; i >= 0; i--) {
      const fb = fireballs[i]; fb.t += dt;
      if (fb.t > 0 && Math.random() < dt * 40) { const q = fbPos(fb); particles.push({ x: q.x, y: q.y, vx: rand(-20, 20), vy: rand(-20, 20), life: 0.4, max: 0.4, color: '#ff8a3a', size: rand(3, 6), g: 0, shape: 'circle' }); }
      if (fb.t >= fb.dur) {
        fireballs.splice(i, 1); SFX.explode(); shakeCam = Math.max(shakeCam, 0.2);
        burst(fb.tx, fb.ty, ['#ffd84a', '#ff8a3a', '#d6483a', '#5a4a3e'], 22, { sp: 170, shape: 'circle' });
        if (dist(player.x, player.y, fb.tx, fb.ty) < 46) hurt(2, fb.tx, fb.ty);
      }
    }
    if (dist(player.x, player.y, ARENA.x, ARENA.y) < 800 && Math.random() < dt * 8) {
      const a = Math.random() * 6.28, r = Math.random() * ARENA.r;
      particles.push({ x: ARENA.x + Math.cos(a) * r, y: ARENA.y + Math.sin(a) * r * 0.8, vx: rand(-8, 8), vy: rand(-35, -15), life: 1.6, max: 1.6, color: '#ff8a3a', size: rand(1.5, 3), g: -8, shape: 'spark' });
    }
    if (S.flags.dragonPending && !S.flags.dragonSeen && !flyover && !modalOpen && !dlg.open) { pendT += dt; if (pendT > 1.5) { flyover = { t: 0 }; SFX.roar(); shakeCam = 1.4; } }
    if (flyover) {
      flyover.t += dt; if (Math.random() < dt * 3) shakeCam = Math.max(shakeCam, 0.15);
      if (flyover.t > 4.5) {
        flyover = null; S.flags.dragonSeen = true;
        ['q8', 'q9'].forEach((id) => { if (qState(id) === 'locked') S.quests[id] = 'available'; });
        hudDirty = true; objTimer = 0;
        say(npcById('ondine'), ['Par les anciens… Tu as vu ça ?! Un dragon ! C’est Ignar, le Dragon des Cendres !', 'La lumière du Cristal a dû le réveiller. Il s’est posé dans la Clairière Brûlée, au sud-est.', 'Tu ne peux pas l’affronter comme ça. Va voir Barnabé pour une vraie épée, et Mira pour des élixirs de soin.']);
        save();
      }
    }
  }
  function drawFireMarkers(c) {
    for (const fb of fireballs) {
      if (fb.t < 0) continue;
      const p = clamp(fb.t / fb.dur, 0, 1);
      c.fillStyle = `rgba(255,60,30,${0.12 + 0.25 * p})`; ell(c, fb.tx, fb.ty, 46 * (0.4 + 0.6 * p), 24 * (0.4 + 0.6 * p));
      c.strokeStyle = `rgba(255,90,40,${0.5 + 0.4 * Math.sin(gt * 20)})`; c.lineWidth = 2.5; c.beginPath(); c.ellipse(fb.tx, fb.ty, 46, 24, 0, 0, 7); c.stroke();
    }
  }
  function drawFireFx(c) {
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const f of flames) {
      const a = clamp(f.life / f.max, 0, 1);
      c.fillStyle = `rgba(255,${Math.floor(120 + 120 * a)},${Math.floor(40 * a)},${0.55 * a})`; circ(c, f.x, f.y, f.r * (1.4 - a * 0.5));
      c.fillStyle = `rgba(255,240,180,${0.5 * a * a})`; circ(c, f.x, f.y, f.r * 0.45);
    }
    for (const fb of fireballs) {
      if (fb.t < 0) continue;
      const q = fbPos(fb);
      const g = c.createRadialGradient(q.x, q.y, 1, q.x, q.y, 22); g.addColorStop(0, 'rgba(255,250,210,1)'); g.addColorStop(0.4, 'rgba(255,150,50,.9)'); g.addColorStop(1, 'rgba(255,60,20,0)');
      c.fillStyle = g; circ(c, q.x, q.y, 22);
    }
    c.restore();
    if (flyover) { const p = flyover.t / 4.5; drawDragon(c, { x: cam.x - 950 + p * 1900, y: cam.y + 160, fly: 320, dir: 1, state: 'fly', flash: 0, isFly: true }); }
  }
  function drawDragon(c, d) {
    const h = d.fly || 0, fl = d.flash > 0;
    const ss = Math.max(0.3, 1 - h / 520);
    shadow(c, d.x, d.y, 82 * ss, 24 * ss);
    c.save(); c.translate(d.x, d.y - h); c.scale(d.dir, 1);
    if (d.state === 'windCharge') c.scale(1.04, 0.9); else if (d.state === 'defeat') c.scale(1, 0.86);
    const body = fl ? '#ffe9e4' : '#9c2128', bodyD = fl ? '#ffd0c8' : '#5e1016', belly = fl ? '#fff4e0' : '#e3a64a';
    const mem = fl ? '#ffd7d0' : '#7a1e2c', memD = fl ? '#ffc8c0' : '#4f1119', bone = fl ? '#ffffff' : '#35090f', horn = '#efe3c8';
    const flying = h > 5 || d.isFly || d.state === 'leave';
    const flap = Math.sin(gt * (flying ? 10 : 3)) * (flying ? 1 : 0.3);
    const wing = (dark) => {
      c.fillStyle = dark ? memD : mem;
      poly(c, [-4, -52, -30, -98 + flap * 34, -62, -126 + flap * 48, -86, -88 + flap * 30, -68, -74 + flap * 20, -82, -60 + flap * 14, -56, -54 + flap * 8, -22, -40]);
      c.strokeStyle = bone; c.lineWidth = 3; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(-4, -52); c.lineTo(-30, -98 + flap * 34); c.lineTo(-62, -126 + flap * 48);
      c.moveTo(-30, -98 + flap * 34); c.lineTo(-86, -88 + flap * 30); c.moveTo(-30, -98 + flap * 34); c.lineTo(-82, -60 + flap * 14); c.stroke();
      c.fillStyle = horn; circ(c, -62, -126 + flap * 48, 2.5);
    };
    c.save(); c.translate(22, -8); c.scale(0.82, 0.88); wing(true); c.restore();
    for (let i = 12; i >= 0; i--) { const t = i / 12; c.fillStyle = i % 2 ? body : bodyD; circ(c, -40 - 85 * t, -24 + Math.sin(t * 3 + gt * 2.2) * 9 * t + t * 18, 15 * (1 - t) + 3.5); }
    const tpx = -125, tpy = -24 + Math.sin(3 + gt * 2.2) * 9 + 18;
    c.fillStyle = bodyD; poly(c, [tpx + 4, tpy, tpx - 12, tpy - 10, tpx - 22, tpy, tpx - 12, tpy + 10]);
    c.fillStyle = bodyD; ell(c, -24, -12, 15, 13); c.fillStyle = horn; [-34, -28, -22].forEach((x) => poly(c, [x, -2, x + 3, 4, x + 5, -2]));
    const g = c.createLinearGradient(0, -64, 0, 0); g.addColorStop(0, body); g.addColorStop(1, bodyD);
    c.fillStyle = g; ell(c, 0, -32, 52, 31);
    c.fillStyle = bone; for (let k = 0; k < 7; k++) { const a = Math.PI * (1.12 + k * 0.11), sx = Math.cos(a) * 50, sy = -32 + Math.sin(a) * 29; poly(c, [sx - 5, sy + 2, sx + Math.cos(a) * 10, sy + Math.sin(a) * 12, sx + 5, sy + 2]); }
    c.fillStyle = 'rgba(255,255,255,.12)'; ell(c, -10, -48, 26, 8);
    c.fillStyle = belly; ell(c, 10, -20, 36, 15);
    c.strokeStyle = 'rgba(120,60,20,.45)'; c.lineWidth = 1.5; for (let k = -2; k <= 3; k++) { c.beginPath(); c.moveTo(10 + k * 10, -33); c.quadraticCurveTo(12 + k * 10, -20, 10 + k * 10, -7); c.stroke(); }
    c.fillStyle = bodyD; ell(c, 28, -10, 11, 12); c.fillStyle = horn; [20, 26, 32].forEach((x) => poly(c, [x, -1, x + 3, 5, x + 5, -1]));
    wing(false);
    for (let i = 0; i <= 6; i++) { const t = i / 6; c.fillStyle = body; circ(c, 34 + 26 * t, -44 - 30 * t, 15 - 4 * t); c.fillStyle = belly; circ(c, 40 + 26 * t, -38 - 30 * t, 7 - 2 * t); }
    c.save(); c.translate(66, -80);
    const open = d.state === 'breath' ? 0.45 : d.state === 'windBreath' ? 0.15 : d.state === 'windBall' || d.state === 'roar' ? 0.3 : 0;
    c.fillStyle = horn; poly(c, [-8, -10, -32, -30, -27, -21, -4, -4]); poly(c, [-2, -12, -21, -37, -15, -28, 2, -8]);
    c.save(); c.translate(-2, 4); c.rotate(open); c.fillStyle = bodyD; poly(c, [0, 0, 34, 2, 30, 9, 0, 8]); c.restore();
    if (open > 0.1) { c.fillStyle = '#ffb347'; poly(c, [6, 4, 32, 4 + open * 14, 30, 6]); }
    c.fillStyle = body; ell(c, 0, 0, 20, 14); ell(c, 18, 2, 18, 9);
    c.fillStyle = bodyD; ell(c, 30, -1, 3, 2);
    c.fillStyle = bone; poly(c, [-6, -9, 10, -12, 14, -6, -2, -5]);
    c.fillStyle = d.state === 'stun' ? '#ffffff' : '#ffd84a'; ell(c, 4, -4, 5, 3.6);
    c.fillStyle = '#1a0a05'; if (d.state === 'stun') { c.fillRect(1, -5, 6, 1.5); } else c.fillRect(3.2, -7.4, 1.8, 7);
    c.fillStyle = '#fff'; [12, 18, 24].forEach((x) => poly(c, [x, 7, x + 2, 11, x + 4, 7]));
    if (['windBreath', 'breath', 'windBall'].includes(d.state)) { const gg = c.createRadialGradient(34, 6, 1, 34, 6, 24); gg.addColorStop(0, 'rgba(255,220,120,.95)'); gg.addColorStop(1, 'rgba(255,90,20,0)'); c.fillStyle = gg; circ(c, 34, 6, 24); }
    c.restore();
    if (d.state === 'stun') { c.font = '15px serif'; c.textAlign = 'center'; for (let k = 0; k < 3; k++) { const a = gt * 4 + k * 2.1; c.fillStyle = '#ffe14a'; c.fillText('★', 66 + Math.cos(a) * 22, -108 + Math.sin(a) * 6); } }
    if (d.state === 'windCharge') { c.font = '800 26px Nunito, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#ff4a3a'; c.fillText('!', 66 * 1, -118); }
    c.restore();
  }

  /* ---------- Dialogue ---------- */
  const dlg = { open: false, who: null, lines: [], i: 0, shown: 0, choices: null, onEnd: null, acc: 0 };
  function say(who, lines, choices, onEnd) {
    dlg.open = true; dlg.who = who; dlg.lines = lines; dlg.i = 0; dlg.shown = 0; dlg.choices = choices || null; dlg.onEnd = onEnd || null; dlg.acc = 0;
    $('#dlg-portrait').textContent = who.portrait || '💬';
    $('#dlg-name').textContent = who.name; $('#dlg-role').textContent = who.role || '';
    $('#dialog').classList.remove('hidden');
    $('#dlg-choices').innerHTML = '';
    player.fishing = null; actHeld = false;
    renderDlg();
  }
  function renderDlg() {
    const line = dlg.lines[dlg.i] || '';
    $('#dlg-text').textContent = line.slice(0, Math.floor(dlg.shown));
    const full = dlg.shown >= line.length;
    const last = dlg.i >= dlg.lines.length - 1;
    $('#dlg-next').classList.toggle('hidden', !full || (last && !!dlg.choices));
    const box = $('#dlg-choices');
    if (full && last && dlg.choices && !box.children.length) {
      dlg.choices.forEach((ch, k) => {
        const b = document.createElement('button'); b.className = 'btn ' + (ch.cls || (k === 0 ? 'btn-gold' : ''));
        b.textContent = (dlg.choices.length > 1 ? (k + 1) + '. ' : '') + ch.label;
        b.onclick = (e) => { e.stopPropagation(); chooseDlg(k); };
        box.appendChild(b);
      });
    }
  }
  function chooseDlg(k) { const ch = dlg.choices && dlg.choices[k]; if (!ch) return; closeDlg(); if (ch.fn) ch.fn(); }
  function advanceDlg() {
    if (!dlg.open) return;
    const line = dlg.lines[dlg.i] || '';
    if (dlg.shown < line.length) { dlg.shown = line.length; renderDlg(); return; }
    if (dlg.i < dlg.lines.length - 1) { dlg.i++; dlg.shown = 0; $('#dlg-choices').innerHTML = ''; renderDlg(); return; }
    if (dlg.choices) return;
    const cb = dlg.onEnd; closeDlg(); if (cb) cb();
  }
  function closeDlg() { dlg.open = false; $('#dialog').classList.add('hidden'); $('#dlg-choices').innerHTML = ''; }
  function updateDlg(dt) {
    if (!dlg.open) return;
    const line = dlg.lines[dlg.i] || '';
    if (dlg.shown < line.length) { const before = Math.floor(dlg.shown); dlg.shown = Math.min(line.length, dlg.shown + dt * 48); if (Math.floor(dlg.shown) !== before && before % 3 === 0 && line[before] !== ' ') SFX.blip(); renderDlg(); }
  }

  /* ---------- PNJ et quêtes ---------- */
  function talk(npc) {
    faceTo(npc);
    const dx = player.x - npc.x, dy = player.y - npc.y;
    npc.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
    const q = questFor(npc.id);
    const extra = extraChoices(npc);
    if (q && qState(q.id) === 'active') {
      if (canComplete(q)) { completeQuest(q, npc); return; }
      const miss = Object.entries(q.needs).filter(([k, v]) => (S.inv[k] || 0) < v).map(([k, v]) => `${v - (S.inv[k] || 0)} ${ITEMS[k].icon} ${ITEMS[k].name.toLowerCase()}`).join(', ');
      say(npc, [q.remind || `Alors, « ${q.title} » ? Il me manque encore : ${miss}.`], extra.length ? extra.concat([{ label: 'Au revoir' }]) : null);
      return;
    }
    if (q && qState(q.id) === 'available') {
      say(npc, q.intro, [{ label: 'Accepter la quête', fn: () => acceptQuest(q) }, { label: 'Plus tard' }]);
      return;
    }
    if (npc.id === 'barnabe' && qState('q2') !== 'done') { say(npc, ['Hmpf. Ma forge est froide. Reviens quand tu auras aidé Ondine.']); return; }
    say(npc, [npc.idle[Math.floor(Math.random() * npc.idle.length)]], extra.length ? extra.concat([{ label: 'Au revoir' }]) : null);
  }
  function extraChoices(npc) {
    const ch = [];
    if (npc.shop === 'gus') { ch.push({ label: '🛒 Boutique', fn: () => openShop('gus') }); if (qState('q1') === 'done') ch.push({ label: '📦 Commande', fn: orderTalk }); }
    if (npc.shop === 'forge' && qState('q2') === 'done') ch.push({ label: '⚒️ Forge', fn: () => openShop('forge') });
    return ch;
  }
  function acceptQuest(q) {
    S.quests[q.id] = 'active'; SFX.quest();
    toast('📜', 'Nouvelle quête : ' + q.title, q.goal);
    hudDirty = true; objTimer = 0;
    if (canComplete(q)) { S.notified[q.id] = true; toast('✅', 'Tu as déjà tout !', `Parle encore à ${npcById(q.giver).name}.`, 'gold'); }
  }
  function completeQuest(q, npc) {
    for (const [k, v] of Object.entries(q.needs)) S.inv[k] -= v;
    S.quests[q.id] = 'done';
    const r = q.reward, parts = [];
    if (r.coins) { S.coins += r.coins; parts.push(`+${r.coins} 🪙`); }
    if (r.tool === 'pickaxe') { S.tools.pickaxe = Math.max(1, S.tools.pickaxe); parts.push('⛏️ Pioche'); }
    if (r.tool === 'steel') { S.tools.pickaxe = 2; parts.push('⛏️ Pioche d’acier'); }
    if (r.tool === 'rod') { S.tools.rod = 1; parts.push('🎣 Canne à pêche'); }
    if (r.upgrade === 'boots') { S.up.boots = true; parts.push('👢 Bottes de vent'); }
    if (r.sword) { S.sword = r.sword; parts.push('⚔️ Lame de Cristal'); }
    if (r.potions) { S.potions += r.potions; parts.push(`🧪 ${r.potions} élixirs`); }
    (q.unlock || []).forEach((id) => { if (qState(id) === 'locked') S.quests[id] = 'available'; });
    if (qState('q8') === 'done' && qState('q9') === 'done' && qState('q10') === 'locked') S.quests.q10 = 'available';
    hudDirty = true;
    say(npc, q.done, null, () => {
      SFX.big(); fireworks(player.x, player.y - 40);
      toast('🏆', 'Quête terminée : ' + q.title, parts.join(' · '), 'gold');
      if (r.flag === 'bridge') { S.flags.bridge = true; camFocus = { x: (bridge.x0 + bridge.x1 + 1) * T / 2, y: (bridge.y0 + 1) * T, until: gt + 2.6 }; setTimeout(() => { fireworks(camFocus.x, camFocus.y - 20); SFX.boom(); }, 600); }
      if (r.flag === 'ending') ending();
      if (r.flag === 'hero') heroEnding();
      hudDirty = true; save();
    });
  }
  function heroEnding() {
    S.flags.hero = true;
    camFocus = { x: monument.x, y: monument.y - 40, until: gt + 4 };
    let k = 0; const iv = setInterval(() => { fireworks(monument.x + rand(-160, 160), monument.y - rand(80, 200)); SFX.coin(); if (++k > 14) clearInterval(iv); }, 300);
    setTimeout(() => {
      const mins = Math.round(S.played / 60);
      openModal('⚔️ Héros de Brumeval !', `<div class="center"><div style="font-size:60px">🐉💨</div>
        <p>Ignar, le Dragon des Cendres, a fui la vallée pour toujours. Brumeval est en paix, et ton nom sera chanté pendant des siècles !</p>
        <div class="end-stats"><div>⏱️ ${mins} min de jeu</div><div>🪙 ${S.coins} pièces</div><div>📜 ${QUESTS.length} quêtes</div></div>
        <p>Merci d’avoir joué ! Tu peux continuer à explorer et à remplir les commandes de Gus.</p>
        <button class="btn btn-gold btn-big" id="end-ok">Continuer</button></div>`);
      $('#end-ok').onclick = closeModal;
    }, 3600);
  }
  function ending() {
    S.flags.ending = true; S.flags.dragonPending = true;
    camFocus = { x: monument.x, y: monument.y - 40, until: gt + 6 };
    let k = 0; const iv = setInterval(() => { fireworks(monument.x + rand(-120, 120), monument.y - rand(80, 180)); SFX.coin(); if (++k > 10) clearInterval(iv); }, 380);
    setTimeout(() => {
      const mins = Math.round(S.played / 60);
      openModal('🎉 Brumeval est sauvé !', `<div class="center"><div style="font-size:60px">💎</div>
        <p>Le Cristal brille à nouveau et la Brume se dissipe. Les villageois n’oublieront jamais ton aide !</p>
        <div class="end-stats"><div>⏱️ ${mins} min de jeu</div><div>🪙 ${S.coins} pièces</div><div>📜 ${QUESTS.length} quêtes</div></div>
        <p>Tu peux continuer à explorer, remplir les commandes de Gus et améliorer tes outils.</p>
        <button class="btn btn-gold btn-big" id="end-ok">Continuer l’aventure</button></div>`);
      $('#end-ok').onclick = closeModal;
    }, 4200);
  }

  /* ---------- Commandes de Gus ---------- */
  function orderPool() {
    const p = ['bois', 'baies'];
    if (S.tools.pickaxe) p.push('pierre');
    if (S.flags.bridge) p.push('fer', 'champignon');
    if (S.tools.rod) p.push('poisson');
    if (S.tools.pickaxe >= 2) p.push('cristal');
    return p;
  }
  function orderTalk() {
    const gus = npcById('gus');
    if (!S.order) {
      const pool = orderPool(), item = pool[Math.floor(Math.random() * pool.length)];
      const qty = item === 'cristal' ? 2 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 6);
      S.order = { item, qty, reward: Math.round(ITEMS[item].price * qty * 2 + 5) };
    }
    const o = S.order, it = ITEMS[o.item], have = S.inv[o.item] || 0;
    const line = `Un client me réclame ${o.qty} ${it.icon} ${it.name.toLowerCase()}. Je te paie ${o.reward} 🪙 ! (tu en as ${have})`;
    const ch = [];
    if (have >= o.qty) ch.push({ label: 'Livrer la commande', fn: () => { S.inv[o.item] -= o.qty; S.coins += o.reward; S.order = null; S.stats = S.stats || {}; S.stats.orders = (S.stats.orders || 0) + 1; SFX.coin(); SFX.quest(); toast('📦', 'Commande livrée !', `+${o.reward} 🪙`, 'gold'); bumpCoins(); hudDirty = true; } });
    ch.push({ label: 'Plus tard' });
    say(gus, [line], ch);
  }

  /* ---------- Boutiques ---------- */
  let modalOpen = false;
  function openModal(title, html) { $('#modal-title').innerHTML = title; $('#modal-body').innerHTML = html; $('#modal').classList.remove('hidden'); modalOpen = true; actHeld = false; SFX.open(); }
  function closeModal() { $('#modal').classList.add('hidden'); modalOpen = false; if (S.hp <= 0 && state === 'play') revive(); }
  const costTxt = (cost) => Object.entries(cost).map(([k, v]) => (k === 'coins' ? `${v} 🪙` : `${v} ${ITEMS[k].icon}`)).join(' + ');
  const canAfford = (cost) => Object.entries(cost).every(([k, v]) => (k === 'coins' ? S.coins : S.inv[k] || 0) >= v);
  function openShop(id) {
    const sh = SHOPS[id];
    let html = sh.items.filter((it) => !it.show || it.show()).map((it) => {
      const owned = !it.repeat && !!S.up[it.id];
      return `<div class="row ${owned ? 'done' : ''}"><span class="ico">${it.icon}</span><div class="txt"><b>${it.name}${it.repeat ? ` <small>(tu en as ${S.potions})</small>` : ''}</b><small>${it.desc}</small></div>
        ${owned ? '<span class="btn">✅ Acheté</span>' : `<button class="btn btn-gold" data-buy="${it.id}" ${canAfford(it.cost) ? '' : 'disabled'}>${costTxt(it.cost)}</button>`}</div>`;
    }).join('');
    if (sh.sell) {
      html += `<h4>Vendre tes ressources</h4>`;
      const sellable = ITEM_KEYS.filter((k) => (S.inv[k] || 0) > 0);
      if (!sellable.length) html += '<p style="color:var(--muted)">Tu n’as rien à vendre pour l’instant.</p>';
      html += sellable.map((k) => `<div class="row"><span class="ico">${ITEMS[k].icon}</span><div class="txt"><b>${ITEMS[k].name} × ${S.inv[k]}</b><small>${ITEMS[k].price} 🪙 pièce</small></div>
        <button class="btn" data-sell="${k}" data-n="1">Vendre 1</button><button class="btn btn-green" data-sell="${k}" data-n="all">Tout (${S.inv[k] * ITEMS[k].price} 🪙)</button></div>`).join('');
    }
    openModal(sh.title + ` <small style="font-size:15px;color:var(--muted)">· ${S.coins} 🪙</small>`, html);
    $('#modal-body').querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => {
      const it = sh.items.find((x) => x.id === b.dataset.buy);
      if (!canAfford(it.cost)) return;
      for (const [k, v] of Object.entries(it.cost)) { if (k === 'coins') S.coins -= v; else S.inv[k] -= v; }
      if (it.repeat) { S.potions++; SFX.coin(); } else { S.up[it.id] = true; SFX.big(); toast(it.icon, it.name + ' obtenu !', it.desc, 'gold'); }
      hudDirty = true; openShop(id);
    });
    $('#modal-body').querySelectorAll('[data-sell]').forEach((b) => b.onclick = () => {
      const k = b.dataset.sell, n = b.dataset.n === 'all' ? S.inv[k] : 1;
      if (!(S.inv[k] >= n) || n <= 0) return;
      S.inv[k] -= n; S.coins += n * ITEMS[k].price; SFX.coin(); bumpCoins(); hudDirty = true; openShop(id);
    });
  }

  /* ---------- Journal / sac / carte / options ---------- */
  function openJournal() {
    const rows = (st) => QUESTS.filter((q) => qState(q.id) === st);
    const needTxt = (q) => Object.entries(q.needs).map(([k, v]) => `${ITEMS[k].icon} ${Math.min(S.inv[k] || 0, v)}/${v}`).join(' · ') + (q.flagNeed ? `⚔️ Ignar vaincu : ${S.flags[q.flagNeed] ? 'oui ✓' : 'non'}` : '');
    let html = '';
    const act = rows('active'), av = rows('available'), dn = rows('done');
    if (act.length) html += '<h4>En cours</h4>' + act.map((q) => `<div class="row active"><span class="ico">📜</span><div class="txt"><b>${q.title}</b><small>${q.goal} — ${npcById(q.giver).name}</small><br><small>${needTxt(q)}</small></div></div>`).join('');
    if (av.length) html += '<h4>Disponibles</h4>' + av.map((q) => `<div class="row"><span class="ico">❗</span><div class="txt"><b>${q.title}</b><small>Parle à ${npcById(q.giver).name} (${npcById(q.giver).role.toLowerCase()})</small></div></div>`).join('');
    if (dn.length) html += '<h4>Terminées</h4>' + dn.map((q) => `<div class="row done"><span class="ico">✅</span><div class="txt"><b>${q.title}</b></div></div>`).join('');
    if (S.flags.ending) html += '<p class="center">✨ L’histoire principale est terminée. Gus a toujours des commandes pour toi !</p>';
    openModal('📜 Journal de quêtes', html);
  }
  function openBag() {
    const tools = [];
    tools.push({ i: '⚔️', n: S.sword >= 2 ? 'Lame de Cristal' : 'Épée rouillée', d: S.sword >= 2 ? 'Frappe deux fois plus fort' : 'Une vieille épée (F)' });
    if (S.potions) tools.push({ i: '🧪', n: 'Élixirs × ' + S.potions, d: 'Rend 3 cœurs (H)' });
    tools.push({ i: '🪓', n: S.up.sharp ? 'Hache affûtée' : 'Hache', d: 'Coupe les arbres' });
    if (S.tools.pickaxe) tools.push({ i: '⛏️', n: S.up.golden ? 'Pioche dorée' : S.tools.pickaxe >= 2 ? 'Pioche d’acier' : 'Pioche', d: S.tools.pickaxe >= 2 ? 'Mine tout, même les cristaux' : 'Mine pierre et fer' });
    if (S.tools.rod) tools.push({ i: '🎣', n: 'Canne à pêche', d: 'Pêche dans les remous' });
    if (S.up.boots) tools.push({ i: '👢', n: 'Bottes de vent', d: 'Course rapide' });
    if (S.up.lantern) tools.push({ i: '🏮', n: 'Lanterne', d: 'Grande lumière' });
    if (S.up.gloves) tools.push({ i: '🧤', n: 'Gants de bûcheron', d: '+1 bois' });
    if (S.up.fertil) tools.push({ i: '✨', n: 'Poudre des fées', d: 'Repousse rapide' });
    const html = `<h4>Ressources</h4><div class="grid">${ITEM_KEYS.map((k) => `<div class="cell" style="${S.inv[k] ? '' : 'opacity:.4'}"><div class="ico">${ITEMS[k].icon}</div><b>${ITEMS[k].name}</b><small>× ${S.inv[k] || 0}</small></div>`).join('')}</div>
      <h4>Équipement</h4><div class="grid">${tools.map((t) => `<div class="cell"><div class="ico">${t.i}</div><b>${t.n}</b><small>${t.d}</small></div>`).join('')}</div>
      <p class="center" style="margin-top:14px">🪙 <b>${S.coins}</b> pièces</p>`;
    openModal('🎒 Mon sac', html);
  }
  let mapBase = null;
  function buildMapBase() {
    mapBase = document.createElement('canvas'); mapBase.width = W * 4; mapBase.height = H * 4;
    const c = mapBase.getContext('2d');
    const col = { [G]: '#7cc35b', [WA]: '#58aee0', [SA]: '#e7d39b', [PA]: '#dcbb87', [FO]: '#2f6a35', [CF]: '#4a4250', [CL]: '#7d6f63', [BU]: '#5b4a3e' };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { c.fillStyle = col[tile(x, y)]; c.fillRect(x * 4, y * 4, 4, 4); }
    for (const o of objs) if (o.kind === 'node' && (o.type === 'tree' || o.type === 'pine')) { c.fillStyle = '#3d8a3f'; c.fillRect(o.x / T * 4 - 1, o.y / T * 4 - 2, 3, 3); }
    for (const o of objs) if (o.kind === 'house' || o.kind === 'tent' || o.kind === 'stall') { c.fillStyle = '#b8574a'; c.fillRect(o.x / T * 4 - 4, o.y / T * 4 - 6, 8, 6); }
  }
  function drawMap(c, w, h, big) {
    c.clearRect(0, 0, w, h);
    c.imageSmoothingEnabled = false;
    c.drawImage(mapBase, 0, 0, w, h);
    const sx = w / (W * T), sy = h / (H * T);
    if (S.flags.bridge) { c.fillStyle = '#a77a4f'; c.fillRect(bridge.x0 * T * sx, bridge.y0 * T * sy, (bridge.x1 - bridge.x0 + 1) * T * sx, 2 * T * sy); }
    boulders.forEach((b) => { if (!b.gone) { c.fillStyle = '#5e5955'; c.fillRect(b.x * sx - 3, b.y * sy - 3, 6, 6); } });
    c.fillStyle = S.flags.ending ? '#7bd3f2' : '#bbb'; c.beginPath(); c.arc(monument.x * sx, monument.y * sy, big ? 6 : 3, 0, 7); c.fill();
    npcs.forEach((n) => { c.fillStyle = '#ffd84a'; c.beginPath(); c.arc(n.x * sx, n.y * sy, big ? 5 : 2.5, 0, 7); c.fill(); c.strokeStyle = '#6b4a2f'; c.lineWidth = 1; c.stroke(); });
    if (objective) { c.fillStyle = '#ff5a4a'; const ox = objective.x * sx, oy = objective.y * sy, r = big ? 9 : 5; c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr2 = k % 2 ? r * 0.45 : r; c.lineTo(ox + Math.cos(a) * rr2, oy + Math.sin(a) * rr2); } c.fill(); }
    c.fillStyle = '#fff'; c.strokeStyle = '#1d3a5a'; c.lineWidth = 2; c.beginPath(); c.arc(player.x * sx, player.y * sy, big ? 6 : 3.5, 0, 7); c.fill(); c.stroke();
    if (big) {
      c.font = '700 14px Nunito, sans-serif'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#fff';
      [['Village', 18.5, 21], ['Lac', 14, 44.5], ['Forêt des Pins', 50, 33], ['Mines', 46, 23.5], ['Grotte de Cristal', 60, 10], ['Rivière', 38, 8], ['Clairière Brûlée', 58, 44.5]].forEach(([t, x, y]) => { c.strokeText(t, x * T * sx, y * T * sy); c.fillText(t, x * T * sx, y * T * sy); });
    }
  }
  function openMap() {
    openModal('🗺️ Carte de Brumeval', '<div class="map-wrap"><canvas id="bigmap" width="576" height="432"></canvas></div><p class="center" style="color:var(--muted);margin:10px 0 0">⚪ Toi · 🟡 Villageois · ⭐ Objectif</p>');
    drawMap($('#bigmap').getContext('2d'), 576, 432, true);
  }
  function openMenu() {
    openModal('⚙️ Options', `<div class="options">
      <button class="btn" id="o-sound">${S.sound ? '🔊 Sons : oui' : '🔇 Sons : non'}</button>
      <button class="btn" id="o-music">${S.music ? '🎵 Musique : oui' : '🎵 Musique : non'}</button>
      <button class="btn" id="o-save">💾 Sauvegarder</button>
      <button class="btn" id="o-title">🏠 Écran titre</button>
      <button class="btn" id="o-reset" style="color:#b23a26">🗑️ Effacer la partie</button></div>
      <h4>Commandes</h4><p>${isTouch ? 'Joystick à gauche pour bouger, gros bouton à droite pour agir (maintiens pour récolter).' : '<kbd>ZQSD</kbd>/<kbd>WASD</kbd>/flèches pour bouger · <kbd>E</kbd> ou <kbd>Espace</kbd> pour agir (maintiens pour récolter) · <kbd>J</kbd> journal · <kbd>I</kbd> sac · <kbd>M</kbd> carte.'}</p>`);
    $('#o-sound').onclick = () => { S.sound = !S.sound; openMenu(); };
    $('#o-music').onclick = () => { S.music = !S.music; openMenu(); };
    $('#o-save').onclick = () => { save(); toast('💾', 'Partie sauvegardée'); };
    $('#o-title').onclick = () => { save(); closeModal(); showTitle(); };
    $('#o-reset').onclick = () => {
      $('#modal-body').innerHTML = '<p>Effacer définitivement ta partie ? Toute ta progression sera perdue.</p><div class="options"><button class="btn" id="r-no">Annuler</button><button class="btn btn-gold" id="r-yes">Oui, effacer</button></div>';
      $('#r-no').onclick = openMenu;
      $('#r-yes').onclick = () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } location.reload(); };
    };
  }

  /* ---------- HUD ---------- */
  let hudDirty = true, hudT = 0;
  const slotEls = {};
  function buildHotbar() {
    const hb = $('#hotbar'); hb.innerHTML = '';
    ITEM_KEYS.forEach((k) => { const d = document.createElement('div'); d.className = 'slot'; d.title = ITEMS[k].name; d.innerHTML = `${ITEMS[k].icon}<b></b>`; hb.appendChild(d); slotEls[k] = d; });
  }
  function bumpSlot(k) { const el = slotEls[k]; if (!el) return; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  function bumpCoins() { const el = $('#coins').parentElement; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  function updateHUD() {
    $('#coins').textContent = S.coins;
    let hh = ''; for (let i = 0; i < MAXHP; i++) hh += `<span class="${i < S.hp ? '' : 'lost'}">❤️</span>`;
    $('#hearts').innerHTML = hh;
    $('#potion-n').textContent = S.potions; $('#potions').classList.toggle('none', !S.potions);
    if (isTouch) $('#pot-btn').classList.toggle('dim', !S.potions);
    ITEM_KEYS.forEach((k) => { const n = S.inv[k] || 0; slotEls[k].querySelector('b').textContent = n || ''; slotEls[k].classList.toggle('empty', !n); });
    const card = $('#quest-card');
    const q = QUESTS.find((x) => qState(x.id) === 'active');
    if (q) {
      const ok = canComplete(q);
      card.innerHTML = `<h3>📜 ${q.title}</h3><div class="goal">${q.goal}</div>` +
        Object.entries(q.needs).map(([k, v]) => `<div class="need ${(S.inv[k] || 0) >= v ? 'ok' : ''}"><span>${ITEMS[k].icon} ${ITEMS[k].name}</span><b>${Math.min(S.inv[k] || 0, v)}/${v}</b></div>`).join('') +
        (q.flagNeed ? `<div class="need ${S.flags[q.flagNeed] ? 'ok' : ''}"><span>⚔️ Vaincre Ignar</span><b>${S.flags[q.flagNeed] ? 1 : 0}/1</b></div>` : '') +
        (ok ? `<div class="back">➜ Retourne voir ${npcById(q.giver).name}</div>` : '');
    } else {
      const a = QUESTS.find((x) => qState(x.id) === 'available');
      if (a) { const n = npcById(a.giver); card.innerHTML = `<h3>❗ Quelqu’un a besoin de toi</h3><div class="goal">Parle à <b>${n.name}</b>, ${n.role.toLowerCase()}.</div>`; }
      else card.innerHTML = `<h3>✨ Brumeval est sauvé !</h3><div class="goal">Explore, améliore tes outils et remplis les commandes de Gus.</div>`;
    }
  }
  function updateClock() {
    const h = Math.floor(S.time / 60), m = Math.floor(S.time % 60);
    $('#clock').textContent = String(h).padStart(2, '0') + ':' + String(m - (m % 10)).padStart(2, '0');
    $('#clock-ico').textContent = h >= 20 || h < 6 ? '🌙' : h < 8 ? '🌅' : h >= 18 ? '🌇' : '☀️';
  }

  /* ---------- Objectif (boussole) ---------- */
  function computeObjective() {
    objective = null;
    const q = QUESTS.find((x) => qState(x.id) === 'active');
    if (!q) { const a = QUESTS.find((x) => qState(x.id) === 'available'); if (a) { const n = npcById(a.giver); objective = { x: n.x, y: n.y - 20 }; } return; }
    const giver = npcById(q.giver);
    if (canComplete(q)) { objective = { x: giver.x, y: giver.y - 20 }; return; }
    if (q.flagNeed) { objective = dragon.active ? null : { x: ARENA.x, y: ARENA.y }; return; }
    if (q.id === 'q7' && boulders.some((b) => !b.gone) && S.tools.pickaxe >= 2) { const b = boulders.find((x) => !x.gone); objective = { x: b.x, y: b.y }; return; }
    let best = null, bd = 1e9;
    for (const [k, v] of Object.entries(q.needs)) {
      if ((S.inv[k] || 0) >= v) continue;
      for (const o of objs) {
        if (!alive(o) || NODE[o.type].item !== k || o.type === 'boulder' || !hasTool(NODE[o.type].tool)) continue;
        if (!S.flags.bridge && o.x > (riverX(o.y / T) - 1) * T) continue;
        if (o.type === 'crystal' && boulders.some((b) => !b.gone)) continue;
        const d = dist(o.x, o.y, player.x, player.y); if (d < bd) { bd = d; best = o; }
      }
    }
    objective = best ? { x: best.x, y: best.y - 10, node: true } : { x: giver.x, y: giver.y - 20 };
  }

  /* ---------- Mise à jour ---------- */
  function updateTarget() {
    let best = null, bd = 1e9;
    for (const o of objs) {
      if (Math.abs(o.x - player.x) > 130 || Math.abs(o.y - player.y) > 130) continue;
      let d, ok = false;
      if (alive(o)) { const def = NODE[o.type]; d = dist(o.x, o.y - 6, player.x, player.y); ok = d < (def.range || def.r + 34); d -= def.range ? 30 : def.r; }
      else if (o.kind === 'npc') { d = dist(o.x, o.y, player.x, player.y); ok = d < 52; d -= 14; }
      else if (o.kind === 'sign') { d = dist(o.x, o.y, player.x, player.y); ok = d < 44; }
      else if (o.kind === 'monument') { d = dist(o.x, o.y, player.x, player.y); ok = d < 58; d -= 20; }
      if (ok && d < bd) { bd = d; best = o; }
    }
    target = best;
  }
  function update(dt) {
    gt += dt; S.played += dt;
    S.time = (S.time + dt * 2.4) % 1440;
    const h = S.time / 60;
    night = h < 5 ? 1 : h < 7 ? 1 - (h - 5) / 2 : h < 18 ? 0 : h < 20 ? (h - 18) / 2 : 1;
    const ptx = Math.floor(player.x / T), pty = Math.floor(player.y / T);
    inCave = tile(ptx, pty) === CF && pty <= corridorY - 1;
    const wantDark = Math.max(night * 0.62, inCave ? 0.78 : 0);
    darkness += (wantDark - darkness) * Math.min(1, dt * 2.5);

    updateDlg(dt);
    // déplacement
    let ix = 0, iy = 0;
    if (!dlg.open && !modalOpen && S.hp > 0) {
      if (keys.left) ix -= 1; if (keys.right) ix += 1; if (keys.up) iy -= 1; if (keys.down) iy += 1;
      if (joy.active) { ix = joy.dx; iy = joy.dy; }
    }
    const mag = Math.hypot(ix, iy);
    if (mag > 1) { ix /= mag; iy /= mag; }
    const moving = mag > 0.15;
    if (moving && player.fishing) player.fishing = null;
    if (moving) {
      const sp = (S.up.boots ? 205 : 150) * Math.min(1, mag);
      const nx = player.x + ix * sp * dt, ny = player.y + iy * sp * dt;
      if (!blocked(nx, player.y, 11)) player.x = nx;
      if (!blocked(player.x, ny, 11)) player.y = ny;
      player.dir = Math.abs(ix) > Math.abs(iy) ? (ix < 0 ? 'left' : 'right') : iy < 0 ? 'up' : 'down';
      player.walk += dt * (S.up.boots ? 1.3 : 1);
      if (Math.random() < dt * 6) particles.push({ x: player.x + rand(-6, 6), y: player.y, vx: rand(-15, 15), vy: rand(-25, -5), life: 0.4, max: 0.4, color: 'rgba(200,180,140,.6)', size: 3, g: 0, shape: 'circle' });
    }
    player.moving = moving;
    if (player.kx || player.ky) {
      const nx = player.x + player.kx * dt, ny = player.y + player.ky * dt;
      if (!blocked(nx, player.y, 11)) player.x = nx;
      if (!blocked(player.x, ny, 11)) player.y = ny;
      const f = Math.exp(-dt * 9); player.kx *= f; player.ky *= f;
      if (Math.abs(player.kx) + Math.abs(player.ky) < 6) player.kx = player.ky = 0;
    }
    if (player.swing > 0) player.swing = Math.max(0, player.swing - dt * 4);
    if (player.attack > 0) player.attack = Math.max(0, player.attack - dt * 4);
    if (invuln > 0) invuln -= dt;
    actCd -= dt; atkCd -= dt;
    // pêche
    if (player.fishing) {
      const f = player.fishing; f.t += dt;
      if (f.o.dead) player.fishing = null;
      else if (f.t >= f.need) { SFX.splash(); burst(f.o.x, f.o.y, ['#cfeff2', '#ffffff'], 12, { g: 260 }); addItem('poisson', 1, player.x, player.y - 50); f.o.dead = gt + NODE.fish.respawn * (S.up.fertil ? 0.5 : 1); player.fishing = null; }
    }
    updateTarget();
    updateDragon(dt);
    updateCombatFx(dt);
    if (actHeld && !dlg.open && !modalOpen && target && target.kind === 'node') act(false);
    // ressources
    for (const o of objs) {
      if (o.kind !== 'node') continue;
      if (o.shake > 0) o.shake = Math.max(0, o.shake - dt * 4);
      if (o.pop > 0) o.pop = Math.max(0, o.pop - dt * 3);
      if (o.dead && gt >= o.dead) { o.dead = 0; o.pop = 1; }
    }
    // PNJ regardent le joueur
    for (const n of npcs) {
      const d = dist(n.x, n.y, player.x, player.y);
      if (d < 120 && !(dlg.open && dlg.who === n)) { const dx = player.x - n.x, dy = player.y - n.y; n.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down'; }
      else if (d >= 120) n.dir = 'down';
    }
    // poules
    for (const c of chickens) {
      if (c.wait > 0) { c.wait -= dt; continue; }
      if (!c.tx) { c.tx = P(16 + Math.random() * 9); c.ty = P(31.5 + Math.random() * 3.5); }
      const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
      if (d < 3) { c.tx = 0; c.wait = rand(0.5, 3); continue; }
      const nx = c.x + dx / d * 40 * dt, ny = c.y + dy / d * 40 * dt;
      if (blocked(nx, ny, 6)) { c.tx = 0; c.wait = 0.5; continue; }
      c.x = nx; c.y = ny; c.dir = dx < 0 ? 1 : -1; c.hop += dt;
    }
    // particules
    for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.life -= dt; if (p.life <= 0) { particles.splice(i, 1); continue; } p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; f.life -= dt; f.y -= 32 * dt; if (f.life <= 0) floats.splice(i, 1); }
    // fumée de la forge
    for (const ho of objs) {
      if (ho.kind !== 'house' || Math.abs(ho.x - cam.x) > 900 || Math.abs(ho.y - cam.y) > 700) continue;
      if (ho.forge && qState('q2') !== 'done') continue;
      if (Math.random() < dt * (ho.forge ? 3 : 1.2)) { const cp = chimneyPos(ho); particles.push({ x: cp.x + rand(-2, 2), y: cp.y, vx: rand(-6, 10), vy: rand(-30, -18), life: 2.4, max: 2.4, color: 'rgba(215,215,215,.45)', size: rand(5, 9), g: -4, shape: 'smoke' }); }
    }
    // papillons / lucioles
    ambient(dt);
    // caméra
    let tx = player.x, ty = player.y - 20;
    if (camFocus) { if (gt < camFocus.until) { tx = camFocus.x; ty = camFocus.y; } else camFocus = null; }
    const k = 1 - Math.exp(-dt * (camFocus ? 2.5 : 6));
    cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
    const hw = vw / 2 / zoom, hh = vh / 2 / zoom;
    cam.x = clamp(cam.x, hw, W * T - hw); cam.y = clamp(cam.y, hh, H * T - hh);
    if (shakeCam > 0) shakeCam -= dt;
    // divers
    objTimer -= dt; if (objTimer <= 0) { objTimer = 0.5; computeObjective(); }
    hudT -= dt; if (hudT <= 0) { hudT = 0.25; if (hudDirty) { updateHUD(); hudDirty = false; } updateClock(); drawMap(mctx, 216, 162, false); updateActBtn(); updateBoss(); }
    saveT -= dt; if (saveT <= 0) { saveT = 6; save(); }
    musicTick(dt);
  }
  let saveT = 6;
  function ambient(dt) {
    while (butterflies.length < 7) butterflies.push({ x: cam.x + rand(-500, 500), y: cam.y + rand(-350, 350), a: rand(0, 6), c: ['#ffd84a', '#ff8fb1', '#fff', '#9fd3ff'][Math.floor(Math.random() * 4)], t: rand(0, 5) });
    while (fireflies.length < 26) fireflies.push({ x: cam.x + rand(-600, 600), y: cam.y + rand(-400, 400), a: rand(0, 6), t: rand(0, 6) });
    for (const b of butterflies) { b.t += dt; b.a += rand(-2, 2) * dt; b.x += Math.cos(b.a) * 40 * dt; b.y += Math.sin(b.a) * 30 * dt; if (Math.abs(b.x - cam.x) > 700 || Math.abs(b.y - cam.y) > 500) { b.x = cam.x + rand(-500, 500); b.y = cam.y + rand(-350, 350); } }
    for (const f of fireflies) { f.t += dt; f.a += rand(-1.5, 1.5) * dt; f.x += Math.cos(f.a) * 18 * dt; f.y += Math.sin(f.a) * 18 * dt; if (Math.abs(f.x - cam.x) > 750 || Math.abs(f.y - cam.y) > 550) { f.x = cam.x + rand(-600, 600); f.y = cam.y + rand(-400, 400); } }
  }

  /* ---------- Rendu ---------- */
  const DRAW = {
    node: (c, o) => { const t = o.type; if (t === 'tree' || t === 'pine') drawTree(c, o); else if (t === 'rock' || t === 'iron' || t === 'boulder') { if (!o.gone) drawRock(c, o); } else if (t === 'crystal') drawCrystal(c, o); else if (t === 'bush') drawBush(c, o); else if (t === 'mushroom') drawMushroom(c, o); },
    house: drawHouse, lamp: drawLamp, monument: drawMonument, well: drawWell, stall: drawStall, tent: drawTent, sign: drawSign, anvil: drawSmall, barrel: drawSmall,
    npc: drawChar, player: drawChar, chicken: drawChicken,
    tower: drawTower, banner: drawBanner, hay: drawHay, deco: drawDeco,
    dragon: (c, o) => { if (o.active) drawDragon(c, o); },
  };
  const visible = [];
  function render() {
    const c = ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#1d3a30'; c.fillRect(0, 0, cv.width, cv.height);
    const sh = shakeCam > 0 ? rand(-4, 4) : 0;
    const ox = Math.round((vw / 2 - cam.x * zoom + sh) * dpr) / dpr, oy = Math.round((vh / 2 - cam.y * zoom + sh) * dpr) / dpr;
    c.setTransform(dpr * zoom, 0, 0, dpr * zoom, ox * dpr, oy * dpr);
    const vx0 = cam.x - vw / 2 / zoom, vy0 = cam.y - vh / 2 / zoom, vx1 = cam.x + vw / 2 / zoom, vy1 = cam.y + vh / 2 / zoom;
    // sol
    const S0 = CH * T;
    for (let ky = Math.max(0, Math.floor(vy0 / S0)); ky <= Math.min(Math.ceil(H / CH) - 1, Math.floor(vy1 / S0)); ky++)
      for (let kx = Math.max(0, Math.floor(vx0 / S0)); kx <= Math.min(Math.ceil(W / CH) - 1, Math.floor(vx1 / S0)); kx++) {
        const ch = chunks.get(kx + ',' + ky) || renderChunk(kx, ky);
        c.drawImage(ch, kx * S0, ky * S0);
      }
    // reflets de l'eau
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2;
    for (let ty = Math.max(0, Math.floor(vy0 / T)); ty <= Math.min(H - 1, Math.floor(vy1 / T)); ty++)
      for (let tx = Math.max(0, Math.floor(vx0 / T)); tx <= Math.min(W - 1, Math.floor(vx1 / T)); tx++) {
        if (tile(tx, ty) !== WA) continue; const v = hn(tx * 3, ty * 7); if (v < 0.55) continue;
        const a = 0.5 + 0.5 * Math.sin(gt * 1.6 + v * 20); c.globalAlpha = a * 0.7;
        const sx = tx * T + v * 20 + Math.sin(gt + v * 9) * 4, sy = ty * T + 10 + hn(ty, tx) * 20;
        c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + 10, sy); c.stroke();
      }
    c.globalAlpha = 1;
    drawBridge(c);
    drawCloudShadows(c, vx0, vy0, vx1, vy1);
    // objets plats
    for (const o of objs) if (o.kind === 'node' && o.type === 'fish' && o.x > vx0 - 60 && o.x < vx1 + 60 && o.y > vy0 - 60 && o.y < vy1 + 60) drawFish(c, o);
    drawFireMarkers(c);
    // objets triés
    visible.length = 0;
    for (const o of objs) { if (o.kind === 'node' && o.type === 'fish') continue; if (o.x > vx0 - 120 && o.x < vx1 + 120 && o.y > vy0 - 40 && o.y < vy1 + 160) visible.push(o); }
    visible.sort((a, b) => a.y - b.y);
    for (const o of visible) { const f = DRAW[o.kind]; if (f) f(c, o); }
    // papillons (jour)
    if (darkness < 0.35) for (const b of butterflies) { const fl = Math.abs(Math.sin(b.t * 14)); c.fillStyle = b.c; c.globalAlpha = 1 - darkness * 2; ell(c, b.x - 3 * fl, b.y, 3.5 * fl + 0.5, 3); ell(c, b.x + 3 * fl, b.y, 3.5 * fl + 0.5, 3); c.globalAlpha = 1; }
    // particules
    for (const p of particles) {
      const a = clamp(p.life / p.max, 0, 1); c.globalAlpha = a; c.fillStyle = p.color;
      if (p.shape === 'leaf') ell(c, p.x, p.y, p.size, p.size * 0.5);
      else if (p.shape === 'spark' || p.shape === 'circle') circ(c, p.x, p.y, p.size * (p.shape === 'spark' ? a : 1));
      else if (p.shape === 'smoke') circ(c, p.x, p.y, p.size * (1.6 - a));
      else c.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    c.globalAlpha = 1;
    drawFireFx(c);
    // marqueurs de quête
    for (const n of npcs) {
      const q = questFor(n.id); if (!q) continue;
      const st = qState(q.id), ready = st === 'active' && canComplete(q);
      if (st === 'active' && !ready) continue;
      const by = n.y - 66 + Math.sin(gt * 4) * 3;
      c.fillStyle = '#3e2a19'; rr(c, n.x - 11, by - 14, 22, 26, 8); c.fillStyle = '#ffd84a'; rr(c, n.x - 9, by - 12, 18, 22, 7);
      c.fillStyle = '#3e2a19'; c.font = '800 18px Nunito, sans-serif'; c.textAlign = 'center'; c.fillText(ready ? '?' : '!', n.x, by + 5);
    }
    // textes flottants
    c.font = '800 16px Nunito, sans-serif'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = 'rgba(40,25,10,.75)';
    for (const f of floats) { c.globalAlpha = clamp(f.life, 0, 1); c.strokeText(f.text, f.x, f.y); c.fillStyle = f.color; c.fillText(f.text, f.x, f.y); }
    c.globalAlpha = 1;
    // invite d'action
    if (target && !dlg.open && !modalOpen && state === 'play') drawPrompt(c);
    if (player.fishing) { const f = player.fishing, p = clamp(f.t / f.need, 0, 1); c.fillStyle = 'rgba(40,25,10,.7)'; rr(c, player.x - 22, player.y - 74, 44, 8, 4); c.fillStyle = '#7bd3f2'; rr(c, player.x - 20, player.y - 72, 40 * p, 4, 2); }
    // lumière
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (darkness > 0.02) drawLights(ox, oy);
    // brume, rayons, étalonnage
    drawMist();
    drawGrade();
    // flèche objectif
    if (objective && state === 'play' && !dlg.open) drawCompass(ox, oy);
  }
  function drawPrompt(c) {
    const t = target;
    let label = 'Parler';
    if (t.kind === 'node') { const d = NODE[t.type]; label = d.label; if (!hasTool(d.tool)) label = '🔒 ' + label; }
    else if (t.kind === 'sign') label = 'Lire';
    else if (t.kind === 'monument') label = 'Observer';
    const y = t.kind === 'npc' ? t.y - (questFor(t.id) ? 92 : 66) : t.kind === 'node' && (t.type === 'tree' || t.type === 'pine') ? t.y - 92 : t.kind === 'monument' ? t.y - 110 : t.y - 50;
    c.font = '800 14px Nunito, sans-serif'; c.textAlign = 'left';
    const key = isTouch ? '' : 'E';
    const tw = c.measureText(label).width, w = tw + (key ? 34 : 18), x = t.x - w / 2;
    c.fillStyle = 'rgba(40,25,10,.82)'; rr(c, x, y - 15, w, 26, 13);
    if (key) { c.fillStyle = '#fff6e3'; rr(c, x + 5, y - 11, 19, 18, 5); c.fillStyle = '#3e2a19'; c.fillText(key, x + 9.5, y + 3); }
    c.fillStyle = '#fff'; c.fillText(label, x + (key ? 29 : 9), y + 3);
  }
  function drawLights(ox, oy) {
    const L = lctx, sc = 0.5;
    L.globalCompositeOperation = 'source-over';
    L.clearRect(0, 0, lightCv.width, lightCv.height);
    L.fillStyle = `rgba(14,18,48,${darkness})`; L.fillRect(0, 0, lightCv.width, lightCv.height);
    L.globalCompositeOperation = 'destination-out';
    const light = (wx, wy, r, a = 1) => {
      const sx = (wx * zoom + ox) * sc, sy = (wy * zoom + oy) * sc, sr = r * zoom * sc;
      if (sx < -sr || sy < -sr || sx > lightCv.width + sr || sy > lightCv.height + sr) return;
      const g = L.createRadialGradient(sx, sy, 0, sx, sy, sr);
      g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.55, `rgba(0,0,0,${a * 0.6})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      L.fillStyle = g; L.beginPath(); L.arc(sx, sy, sr, 0, Math.PI * 2); L.fill();
    };
    light(player.x, player.y - 20, S.up.lantern ? 260 : 150, 0.95);
    if (night > 0.1) {
      for (const o of objs) {
        if (o.kind === 'lamp') light(o.x, o.y - 52, 140, 0.9 * night);
        else if (o.kind === 'house') light(o.x, o.y - o.h + 26, 110, 0.6 * night);
        else if (o.kind === 'tent') light(o.x + 7, o.y + 14, 120, 0.8 * night);
      }
    }
    for (const o of objs) if (o.kind === 'node' && o.type === 'crystal' && !o.dead) light(o.x, o.y - 18, 90, 0.7);
    for (const fb of fireballs) if (fb.t >= 0) { const q = fbPos(fb); light(q.x, q.y, 100, 0.9); }
    if (dragon.active && dragon.state === 'breath') { const m = mouthPos(); light(m.x + Math.cos(dragon.ba) * 80, m.y + Math.sin(dragon.ba) * 80, 200, 0.95); }
    if (dist(player.x, player.y, ARENA.x, ARENA.y) < 900) light(ARENA.x, ARENA.y, 160, 0.35);
    if (S.flags.ending) light(monument.x, monument.y - 50, 300, 1);
    ctx.drawImage(lightCv, 0, 0, cv.width, cv.height);
    // lueurs chaudes
    if (night > 0.1) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, ox * dpr, oy * dpr);
      for (const o of objs) if (o.kind === 'lamp' && Math.abs(o.x - cam.x) < 900 && Math.abs(o.y - cam.y) < 700) { const g = ctx.createRadialGradient(o.x, o.y - 52, 0, o.x, o.y - 52, 60); g.addColorStop(0, `rgba(255,190,90,${0.35 * night})`); g.addColorStop(1, 'rgba(255,190,90,0)'); ctx.fillStyle = g; circ(ctx, o.x, o.y - 52, 60); }
      for (const f of fireflies) { const a = (0.5 + 0.5 * Math.sin(f.t * 3)) * night; ctx.fillStyle = `rgba(220,255,140,${a})`; circ(ctx, f.x, f.y, 2.2); ctx.fillStyle = `rgba(220,255,140,${a * 0.25})`; circ(ctx, f.x, f.y, 7); }
      ctx.globalCompositeOperation = 'source-over';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
  const mist = Array.from({ length: 7 }, (_, k) => ({ x: Math.random(), y: Math.random(), r: rand(0.35, 0.6), s: rand(0.006, 0.014) * (k % 2 ? 1 : -1) }));
  function drawMist() {
    const a = (S.flags.ending ? 0.03 : 0.075) + (inCave ? 0 : 0.02) * (1 - night);
    for (const m of mist) {
      m.x += m.s / 60; if (m.x > 1.4) m.x = -0.4; if (m.x < -0.4) m.x = 1.4;
      const x = m.x * cv.width, y = m.y * cv.height, r = m.r * Math.max(cv.width, cv.height);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(235,245,250,${a})`); g.addColorStop(1, 'rgba(235,245,250,0)');
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
  const cloudShadows = Array.from({ length: 6 }, () => ({ x: Math.random() * W * T, y: Math.random() * H * T, r: rand(160, 280), sx: rand(10, 18), sy: rand(2, 6) }));
  function drawCloudShadows(c, vx0, vy0, vx1, vy1) {
    const a = 0.13 * (1 - Math.min(1, darkness * 2));
    if (a <= 0.01) return;
    for (const cl of cloudShadows) {
      cl.x += cl.sx / 60; cl.y += cl.sy / 60;
      if (cl.x > W * T + 300) cl.x = -300; if (cl.y > H * T + 300) cl.y = -300;
      if (cl.x + cl.r < vx0 || cl.x - cl.r > vx1 || cl.y + cl.r < vy0 || cl.y - cl.r > vy1) continue;
      c.save(); c.translate(cl.x, cl.y); c.scale(1.6, 1);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, cl.r);
      g.addColorStop(0, `rgba(10,35,30,${a})`); g.addColorStop(0.6, `rgba(10,35,30,${a * 0.7})`); g.addColorStop(1, 'rgba(10,35,30,0)');
      c.fillStyle = g; circ(c, 0, 0, cl.r); c.restore();
    }
  }
  function drawGrade() {
    const w = cv.width, h = cv.height;
    const hr = S.time / 60;
    const day = 1 - Math.min(1, darkness * 2.2);
    // rayons de soleil
    if (day > 0.05 && !inCave) {
      ctx.save(); ctx.translate(w * 0.5, -h * 0.1); ctx.rotate(0.45);
      for (let k = 0; k < 4; k++) {
        const bw = w * (0.08 + k * 0.03), bx = ((gt * 10 + k * w * 0.42) % (w * 1.8)) - w * 0.9;
        const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
        const al = 0.05 * day * (0.6 + 0.4 * Math.sin(gt * 0.4 + k));
        g.addColorStop(0, 'rgba(255,248,215,0)'); g.addColorStop(0.5, `rgba(255,248,215,${al})`); g.addColorStop(1, 'rgba(255,248,215,0)');
        ctx.fillStyle = g; ctx.fillRect(bx, -h, bw, h * 3);
      }
      ctx.restore();
    }
    // lumière dorée aube / crépuscule
    const golden = hr >= 5.5 && hr < 8.5 ? 1 - Math.abs(hr - 7) / 1.5 : hr >= 16.5 && hr < 19.5 ? 1 - Math.abs(hr - 18) / 1.5 : 0;
    if (golden > 0) { ctx.fillStyle = `rgba(255,140,50,${0.11 * golden})`; ctx.fillRect(0, 0, w, h); }
    // légère chaleur en journée
    // vignettage
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.38, w / 2, h / 2, Math.hypot(w, h) * 0.55);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(8,22,18,0.42)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  function drawCompass(ox, oy) {
    const sx = objective.x * zoom + ox, sy = objective.y * zoom + oy;
    const px = player.x * zoom + ox, py = (player.y - 24) * zoom + oy;
    const margin = 40;
    const onScreen = sx > margin && sy > margin && sx < vw - margin && sy < vh - margin;
    ctx.save(); ctx.scale(dpr, dpr);
    if (onScreen) {
      if (dist(sx, sy, px, py) > 60) {
        const b = Math.sin(gt * 5) * 4;
        ctx.fillStyle = 'rgba(255,90,74,.95)'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sx, sy - 18 + b); ctx.lineTo(sx - 8, sy - 32 + b); ctx.lineTo(sx + 8, sy - 32 + b); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    } else {
      const a = Math.atan2(sy - py, sx - px);
      const r = 62 * zoom;
      const ax = px + Math.cos(a) * r, ay = py + Math.sin(a) * r;
      ctx.translate(ax, ay); ctx.rotate(a);
      ctx.fillStyle = 'rgba(255,90,74,.92)'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -10); ctx.lineTo(-3, 0); ctx.lineTo(-8, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------- Bouton tactile ---------- */
  function updateActBtn() {
    if (!isTouch) return;
    const b = $('#act-btn'); let ic = '✋';
    if (target) {
      if (target.kind === 'npc') ic = '💬';
      else if (target.kind === 'sign' || target.kind === 'monument') ic = '👀';
      else { const d = NODE[target.type]; ic = d.tool === 'axe' ? '🪓' : d.tool === 'rod' ? '🎣' : d.tool ? '⛏️' : '🤲'; }
    }
    if (b.textContent !== ic) b.textContent = ic;
    b.classList.toggle('dim', !target);
  }

  /* ===================== Entrées ===================== */
  const KEYMAP = { ArrowUp: 'up', KeyW: 'up', KeyZ: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', KeyQ: 'left', ArrowRight: 'right', KeyD: 'right' };
  window.addEventListener('keydown', (e) => {
    if (state !== 'play') return;
    const k = KEYMAP[e.code];
    if (k) { keys[k] = true; e.preventDefault(); return; }
    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      if (e.repeat) return;
      if (modalOpen) return;
      if (dlg.open) { advanceDlg(); return; }
      actHeld = true; act(true); return;
    }
    if (e.code === 'KeyF' || e.code === 'KeyK') { if (!e.repeat) attack(); return; }
    if (e.code === 'KeyH') { drinkPotion(); return; }
    if (dlg.open && /^Digit[1-9]$/.test(e.code)) { chooseDlg(+e.code.slice(5) - 1); return; }
    if (e.code === 'Escape') { if (modalOpen) closeModal(); else if (dlg.open) { if (!dlg.choices) advanceDlg(); else closeDlg(); } else openMenu(); return; }
    if (dlg.open) return;
    if (e.code === 'KeyJ') { modalOpen ? closeModal() : openJournal(); }
    if (e.code === 'KeyI' || e.code === 'Tab') { e.preventDefault(); modalOpen ? closeModal() : openBag(); }
    if (e.code === 'KeyM') { modalOpen ? closeModal() : openMap(); }
  });
  window.addEventListener('keyup', (e) => {
    const k = KEYMAP[e.code]; if (k) keys[k] = false;
    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') actHeld = false;
  });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; actHeld = false; save(); });
  $('#dialog').addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; advanceDlg(); });
  // joystick
  cv.addEventListener('pointerdown', (e) => {
    if (state !== 'play') return;
    ac();
    if (dlg.open) { advanceDlg(); return; }
    if (e.pointerType === 'mouse') { if (e.button === 0) attack(); return; }
    if (e.clientX < vw * 0.6 && !joy.active) {
      joy.active = true; joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; joy.dx = joy.dy = 0;
      const j = $('#joy'); j.classList.remove('hidden'); j.style.left = e.clientX + 'px'; j.style.top = e.clientY + 'px'; $('#joy-knob').style.transform = '';
    }
  });
  window.addEventListener('pointermove', (e) => {
    if (!joy.active || e.pointerId !== joy.id) return;
    let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const m = Math.hypot(dx, dy), max = 50;
    if (m > max) { dx = dx / m * max; dy = dy / m * max; }
    joy.dx = dx / max; joy.dy = dy / max;
    $('#joy-knob').style.transform = `translate(${dx}px,${dy}px)`;
  });
  const endJoy = (e) => { if (joy.active && e.pointerId === joy.id) { joy.active = false; joy.dx = joy.dy = 0; $('#joy').classList.add('hidden'); } };
  window.addEventListener('pointerup', endJoy); window.addEventListener('pointercancel', endJoy);
  const ab = $('#act-btn');
  ab.addEventListener('pointerdown', (e) => { e.preventDefault(); ac(); ab.classList.add('down'); if (dlg.open) { advanceDlg(); return; } actHeld = true; act(true); });
  const abUp = () => { ab.classList.remove('down'); actHeld = false; };
  ab.addEventListener('pointerup', abUp); ab.addEventListener('pointerleave', abUp); ab.addEventListener('pointercancel', abUp);
  $('#atk-btn').addEventListener('pointerdown', (e) => { e.preventDefault(); ac(); if (dlg.open) { advanceDlg(); return; } attack(); });
  $('#pot-btn').addEventListener('pointerdown', (e) => { e.preventDefault(); ac(); drinkPotion(); });
  $('#potions').onclick = () => { ac(); drinkPotion(); };
  // boutons HUD
  $('#btn-journal').onclick = () => { ac(); openJournal(); };
  $('#btn-bag').onclick = () => { ac(); openBag(); };
  $('#btn-map').onclick = () => { ac(); openMap(); };
  $('#minimap').onclick = () => { ac(); openMap(); };
  $('#btn-menu').onclick = () => { ac(); openMenu(); };
  $('#modal-close').onclick = closeModal;
  $('#modal').addEventListener('pointerdown', (e) => { if (e.target.id === 'modal') closeModal(); });
  const mctx = $('#minimap').getContext('2d');

  /* ===================== Démarrage ===================== */
  function showTitle() {
    state = 'title';
    $('#title').classList.remove('hidden'); $('#hud').classList.add('hidden'); $('#touch').classList.add('hidden'); closeDlg();
    $('#btn-continue').classList.toggle('hidden', !loadSave());
    $('#btn-new').classList.toggle('btn-gold', !loadSave());
  }
  function applyState() {
    player.x = S.px || P(18.9); player.y = S.py || P(30.4);
    if (blocked(player.x, player.y, 11)) { player.x = P(18.9); player.y = P(30.4); }
    boulders.forEach((b) => { b.gone = !!S.flags['b' + b.bid]; });
    for (const o of objs) if (o.kind === 'node') { o.dead = 0; o.hp = NODE[o.type].hp; }
    if (!(S.hp > 0)) S.hp = MAXHP;
    if (S.flags.ending && !S.flags.dragonSeen) S.flags.dragonPending = true;
    resetDragon(); flyover = null; pendT = 0; invuln = 0; player.kx = player.ky = 0;
    cam.x = player.x; cam.y = player.y;
    hudDirty = true; objTimer = 0;
  }
  function start(fresh) {
    ac();
    if (fresh) { S = newState(); S.px = P(18.9); S.py = P(30.4); }
    else S = loadSave() || newState();
    applyState();
    state = 'play';
    $('#title').classList.add('hidden'); $('#hud').classList.remove('hidden');
    if (isTouch) $('#touch').classList.remove('hidden');
    updateHUD(); updateClock();
    save();
    if (fresh) {
      setTimeout(() => say({ name: 'Brumeval', role: '', portrait: '🌫️' }, [
        'Après des jours de marche dans la brume, tu arrives enfin dans un petit village endormi…',
        isTouch ? 'Utilise le joystick (pose ton pouce à gauche de l’écran) pour te déplacer, et le gros bouton à droite pour agir.' : 'Déplace-toi avec ZQSD, WASD ou les flèches. Appuie sur E ou Espace pour parler ou récolter.',
        'Les villageois avec un ❗ ont besoin de toi. La flèche rouge t’indique où aller. Bonne aventure !',
      ]), 400);
    } else toast('🌫️', 'Bon retour à Brumeval !', 'Ta partie a été chargée.');
  }
  $('#btn-new').onclick = () => {
    if (loadSave()) {
      openModal('Nouvelle partie ?', '<p>Une partie existe déjà. La remplacer par une nouvelle aventure ?</p><div class="options"><button class="btn" id="n-no">Annuler</button><button class="btn btn-gold" id="n-yes">Nouvelle partie</button></div>');
      $('#n-no').onclick = closeModal; $('#n-yes').onclick = () => { closeModal(); start(true); };
    } else start(true);
  };
  $('#btn-continue').onclick = () => start(false);

  buildSprites(); generate(); populate(); buildSolidCache(); buildMapBase(); buildHotbar();
  resize(); window.addEventListener('resize', resize);
  cam.x = P(19); cam.y = P(28);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  window.addEventListener('pagehide', save);

  let last = performance.now(), titleT = 0;
  function frame() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (state === 'play') update(dt);
    else {
      gt += dt; titleT += dt;
      cam.x = P(19) + Math.sin(titleT * 0.08) * 380; cam.y = P(29) + Math.sin(titleT * 0.05) * 160;
      for (const o of objs) if (o.kind === 'node' && o.shake > 0) o.shake = 0;
      ambient(dt);
    }
    render();
  }
  function loop() { frame(); requestAnimationFrame(loop); }
  setInterval(() => { if (performance.now() - last > 150) frame(); }, 100);
  showTitle();
  requestAnimationFrame(loop);

  window.__brume = { drawChar, get S() { return S; }, player, objs, npcs, QUESTS, addItem, talk, get state() { return state; }, start, get target() { return target; }, act, advanceDlg, get dlg() { return dlg; }, completeQuest, chooseDlg, openShop, tile, bridge };
})();
