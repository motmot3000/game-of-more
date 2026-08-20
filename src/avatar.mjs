/* ============================================================
   Game of More — héros d'aventure
   Figures vectorielles, ~5.5 têtes, palette sourde.

   Principe : la tenue de départ est SIMPLE (tunique, ceinture,
   bottes). Ce sont les objets achetés qui ajoutent la cape, le
   cuir, la maille, les armoiries — la progression se voit.

   L'API publique est inchangée pour app.mjs : renderHero /
   renderItemArt / renderCoinIcon / renderHeartIcon / renderMascot.

   Chaque forme est déclarée UNE fois comme donnée ({tag, a, fill}),
   puis émise DEUX fois — remplie pour le dessin, et géométrie nue
   dans un <clipPath> — pour que les calques d'ombrage restent
   confinés à la silhouette. Un nouvel accessoire prend donc la
   lumière gratuitement : il suffit de l'ajouter à la liste.
   Ne pas peindre d'ombres à la main, ça casserait cette propriété.

   L'ORDRE DE LA LISTE EST L'ORDRE DE PROFONDEUR. Tout volume qui
   entoure le crâne (capuche) se pousse AVANT l'ovale du visage,
   son bord APRÈS.
   ============================================================ */

export const INK = "#241D19";

const TONES = {
  light:  { base: "#F0C9A4", dark: "#D5A47C", lite: "#FBDDC0", line: "#8A5C3C" },
  medium: { base: "#DFAE7E", dark: "#BC8757", lite: "#F0C9A4", line: "#7A4B2C" },
  tan:    { base: "#C68A55", dark: "#A16A3A", lite: "#DFAE7E", line: "#63381C" },
  brown:  { base: "#9A6440", dark: "#77482B", lite: "#B98056", line: "#472817" },
  dark:   { base: "#6B452F", dark: "#4C2E1E", lite: "#875A3F", line: "#2E1810" }
};

const HAIR = { base: "#402D1D", dark: "#291C11", lite: "#5F4530", line: "#1B1209" };

/* Couleurs de tunique, tenues en sourdine : c'est la sourdine qui donne
   l'effet « classe ». Pas de primaires saturées. */
const CLOTHS = {
  /* Lin brut pour la tenue de départ : humble, et surtout ça se détache du
     fond bleu nuit — l'azur s'y noyait, or c'est la tenue de tous les LVL 1. */
  lin:      { base: "#536776", dark: "#3C4D59", lite: "#738796", line: "#26353F" },
  azur:     { base: "#33507E", dark: "#223757", lite: "#4A6A99", line: "#152036" },
  sinople:  { base: "#2F5C43", dark: "#20422F", lite: "#427659", line: "#132B1E" },
  pourpre:  { base: "#573566", dark: "#3C2449", lite: "#714C81", line: "#25142B" },
  ecarlate: { base: "#8E3230", dark: "#65211F", lite: "#AC4D48", line: "#3D1211" }
};

/* La laine du manteau est fixe et neutre : elle unifie la palette quelle que
   soit la tunique. L'ourlet, lui, reprend la couleur de la tunique. */
const CLOAK   = { base: "#4A4038", dark: "#332C26", lite: "#63564B", line: "#211B16" };
const MAIL    = { base: "#79818E", dark: "#565E6A", lite: "#9BA3AE", line: "#2E343D" };
const STEEL   = { base: "#8E97A4", dark: "#646E7C", lite: "#B9C1CB", line: "#333A45" };
const GOLD    = { base: "#C0913E", dark: "#8F692A", lite: "#E2BC70", line: "#5A3F13" };
const LEATHER = { base: "#6B4A2E", dark: "#4A3220", lite: "#8A6440", line: "#2A1B10" };
const HOSE    = { base: "#5A4C3E", dark: "#40352A", lite: "#75654F", line: "#241D15" };
const WOOD    = { base: "#7A5A38", dark: "#573F26", lite: "#96754C", line: "#2E2013" };

const MATERIAL_LINES = new Map();
for (const material of [
  ...Object.values(TONES), HAIR, ...Object.values(CLOTHS), CLOAK,
  MAIL, STEEL, GOLD, LEATHER, HOSE, WOOD
]) {
  for (const color of [material.base, material.dark, material.lite]) {
    MATERIAL_LINES.set(color, material.line);
  }
}

/* Traduction du modèle de données de l'app vers la garde-robe.
   Chaque tenue n'est qu'un jeu d'options : la silhouette ne change jamais,
   seule la quantité d'équipement monte. */
const OUTFITS = {
  starter:         { cloth: "lin",      role: "scout",  cape: false,  mail: false, emblem: false, greaves: false, pathfinder: true },
  "vocab-ranger": { cloth: "sinople",  role: "ranger", mantle: true, mail: false, emblem: false, greaves: false },
  "grammar-mage": { cloth: "pourpre",  role: "mage",   cape: true,   mail: false, emblem: true,  greaves: false },
  "story-keeper": { cloth: "ecarlate", role: "keeper", cape: true,   mail: true,  emblem: true,  greaves: true  }
};
const HEADGEAR = {
  "no-hat": "none",
  "explorer-cap": "hood",
  "wizard-hat": "wizard",
  helmet: "helm",
  "gold-crown": "crown"
};
const HANDGEAR = {
  "no-weapon": "none",
  "pencil-sword": "sword",
  "word-wand": "wand",
  "star-shield": "shield",
  lantern: "lantern",
  "magic-book": "book",
  daggers: "daggers",
  scepter: "scepter",
  "custom-item": "custom"
};
const HAIRCUTS = {
  short: "court",
  long: "longue",
  curly: "boucle",
  spiky: "epis",
  ponytail: "queue",
  braids: "tresses"
};

/* ---------- helpers ---------- */

const p = (d, fill, o = {}) => ({ tag: "path", a: { d }, fill, ...o });
const e = (cx, cy, rx, ry, fill, o = {}) => ({ tag: "ellipse", a: { cx, cy, rx, ry }, fill, ...o });
const c = (cx, cy, r, fill, o = {}) => ({ tag: "circle", a: { cx, cy, r }, fill, ...o });

/* Un pli : trait seul, jamais rempli — donc exclu du clipPath. */
const fold = (d, stroke, sw = 1.3, opacity = 0.5) =>
  ({ tag: "path", a: { d, opacity }, fill: "none", stroke, sw });

/* Occlusion douce : tache sombre translucide, sans contour. */
const ao = (d, opacity = 0.16) =>
  ({ tag: "path", a: { d, opacity }, fill: "#160F0B", noStroke: true });

function attrs(a) {
  return Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(" ");
}

function draw(s, stroke) {
  if (s.noStroke) return `<${s.tag} ${attrs(s.a)} fill="${s.fill}"/>`;
  const sc = s.stroke || (String(s.fill).startsWith("url(") ? MAIL.line : MATERIAL_LINES.get(s.fill)) || INK;
  return `<${s.tag} ${attrs(s.a)} fill="${s.fill}" stroke="${sc}" stroke-width="${s.sw || stroke}" stroke-opacity="0.94" stroke-linejoin="round" stroke-linecap="round"/>`;
}

function clipGeom(s) {
  return `<${s.tag} ${attrs(s.a)}/>`;
}

function mirroredShape(shape) {
  return {
    ...shape,
    a: { ...shape.a, transform: "translate(200 0) scale(-1 1)" }
  };
}

let artSeq = 0;
function safeId(value) {
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "") || `h${++artSeq}`;
}

/* Une inversion gauche/droite suffit à casser l'effet « armée de clones »
   sans déplacer les points d'ancrage des accessoires. Elle reste stable pour
   un même élève, y compris après rechargement d'une sauvegarde. */
function mirrorFor(value) {
  return [...String(value || "")].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 2 === 1;
}

/* ---------- repères du visage ----------
   Tout couvre-chef doit s'arrêter AU-DESSUS du sourcil, sinon il mange
   le regard. Crâne 24 · racine 36 · sourcil 45 · œil 52 · nez 62 ·
   bouche 68 · menton 79. Les oreilles occupent y 49–59.               */

/* ---------- la figure ---------- */

function heroShapes(opt) {
  const T = TONES[opt.tone] || TONES.light;
  const C = CLOTHS[opt.cloth] || CLOTHS.lin;
  const mailFill = `url(#mail-${opt.id})`;
  const head = opt.head || "none";
  const hand = opt.hand || "none";
  const cut = opt.hairStyle || "court";
  const armed = hand !== "none";
  const gripGear = ["sword", "wand", "staff", "lantern", "scepter", "custom"].includes(hand);

  /* Manches : maille pour la tenue la plus haute, tissu sinon. */
  const sleeve = opt.mail ? mailFill : C.dark;

  const S = [];
  const foreground = [];

  /* --- manteau, tout derrière : c'est lui qui donne la silhouette */
  if (opt.cape) {
    S.push(p("M74,98 C44,140 32,246 38,316 C72,328 128,328 162,316 C168,246 156,140 126,98 Z", CLOAK.base));
    S.push(p("M38,301 C72,315 128,315 162,301 L162,316 C128,328 72,328 38,316 Z", C.dark));
    S.push(fold("M85,104 C70,170 62,250 58,313", CLOAK.line, 1.5, 0.55));
    S.push(fold("M93,104 C84,180 78,252 76,320", CLOAK.line, 1.2, 0.4));
    S.push(fold("M100,104 C98,180 98,252 98,322", CLOAK.line, 1.5, 0.5));
    S.push(fold("M107,104 C116,180 122,252 124,320", CLOAK.line, 1.2, 0.4));
    S.push(fold("M115,104 C130,170 138,250 142,313", CLOAK.line, 1.5, 0.55));
    S.push(fold("M44,300 C74,312 126,312 156,300", CLOAK.lite, 1.4, 0.35));
  }

  /* --- épaules et manches. Les deux côtés partagent exactement la même
         géométrie miroir et le même plan de profondeur. */
  const sleeveShape = p("M68,109 C59,110 53,117 51,130 C49,148 51,169 53,183 L67,183 C67,166 67,150 68,134 C69,127 73,122 77,120 Z", sleeve);
  const sleeveFold = fold("M57,123 C53,143 55,165 58,179", C.line, 1.2, 0.4);
  S.push(sleeveShape, mirroredShape(sleeveShape), sleeveFold, mirroredShape(sleeveFold));

  /* --- chausses. Sans grèves la botte s'arrête au mollet : une tige qui
         monte au genou lit comme une cuissarde, pas comme un aventurier. */
  const legEnd = opt.greaves ? 272 : 296;
  S.push(p(`M72,182 L68,${legEnd} L92,${legEnd} L94,182 Z`, HOSE.base));
  S.push(p(`M128,182 L132,${legEnd} L108,${legEnd} L106,182 Z`, HOSE.dark));
  S.push(fold(`M80,196 C78,224 77,${legEnd - 22} 78,${legEnd - 4}`, HOSE.line, 1.2, 0.45));
  S.push(fold(`M120,196 C122,224 123,${legEnd - 22} 122,${legEnd - 4}`, HOSE.line, 1.2, 0.45));

  /* --- fourreau, glissé derrière le pan de tunique : seule la bouterolle
         dépasse sous l'ourlet, la hanche reste lisible. */
  if (hand === "sword") {
    S.push(p("M70,196 L80,193 L56,300 C55,307 50,310 46,309 C42,308 40,303 42,297 Z", LEATHER.base));
    S.push(p("M47,288 L59,291 L56,300 C55,307 50,310 46,309 C42,308 40,303 42,297 Z", STEEL.base));
  }

  /* --- bottes */
  const bootTop = opt.greaves ? 252 : 290;
  S.push(p(`M65,${bootTop} L62,342 C62,352 69,357 78,357 L88,357 C92,352 92,344 91,338 L92,${bootTop} Z`, LEATHER.base));
  S.push(p(`M108,${bootTop} L109,338 C108,344 108,352 112,357 L122,357 C131,357 138,352 138,342 L135,${bootTop} Z`, LEATHER.dark));

  if (opt.greaves) {
    /* Grèves d'acier : réservées à la tenue la plus haute. */
    S.push(p("M64,256 L93,256 L91,326 C91,335 84,340 77.5,340 C71,340 65,335 65,326 Z", STEEL.base));
    S.push(p("M107,256 L136,256 L135,326 C135,335 129,340 122.5,340 C116,340 109,335 109,326 Z", STEEL.dark));
    S.push(fold("M70,264 C68,290 68,312 71,332", STEEL.lite, 2.2, 0.75));
    S.push(fold("M113,264 C111,290 111,312 114,332", STEEL.lite, 1.6, 0.4));
  } else {
    /* Sinon : un simple revers rabattu. */
    S.push(p("M62,284 L94,284 L94,298 L62,298 Z", LEATHER.dark));
    S.push(p("M106,284 L138,284 L138,298 L106,298 Z", "#3F2A1A"));
    S.push(fold("M72,306 C70,318 70,330 72,340", LEATHER.lite, 1.8, 0.4));
  }

  S.push(p("M59,342 L94,342 L94,358 C94,363 90,365 84,365 L69,365 C63,365 59,363 59,358 Z", "#3A2A1C"));
  S.push(p("M106,342 L141,342 L141,358 C141,363 137,365 131,365 L116,365 C110,365 106,363 106,358 Z", "#3A2A1C"));

  /* --- haubert de mailles, sous la tunique */
  if (opt.mail) S.push(p("M64,111 C70,96 82,90 100,90 C118,90 130,96 136,111 L130,192 L70,192 Z", mailFill));

  /* --- tunique : épaules souples, taille marquée, ourlet moins rectangulaire. */
  S.push(p("M66,113 C71,98 83,92 100,92 C117,92 129,98 134,113 L130,178 C121,184 111,187 100,187 C89,187 79,184 70,178 Z", C.base));
  /* Creux de l'aisselle : c'est cette ombre qui fait lire le bras DEVANT le
     torse plutôt que collé à côté. */
  S.push(ao("M66,114 C74,108 80,117 82,129 L68,133 Z", 0.24));
  S.push(ao("M134,114 C126,108 120,117 118,129 L132,133 Z", 0.24));
  S.push(fold("M84,112 C82,138 82,160 84,178", C.line, 1.3, 0.45));
  S.push(fold("M116,112 C118,138 118,160 116,178", C.line, 1.3, 0.45));
  S.push(p("M89,96 L100,116 L111,96 Z", opt.mail ? mailFill : C.dark));

  /* Sangle d'expédition commune à toutes les tenues. Elle donne une histoire
     au niveau 1, tout en restant assez simple pour la lecture sur une carte. */
  S.push(p("M76,104 L84,99 L133,183 L124,189 Z", LEATHER.base));
  S.push(fold("M82,107 L126,181", LEATHER.lite, 1.3, 0.5));

  if (opt.pathfinder) {
    /* Foulard court + boussole : deux masses simples qui identifient le rôle
       sans concurrencer les futurs objets achetés. */
    S.push(p("M78,99 C89,104 111,104 122,99 L118,115 L105,109 L100,124 L94,109 L82,115 Z", CLOTHS.sinople.base));
    S.push(fold("M84,105 C94,109 106,109 116,105", CLOTHS.sinople.lite, 1.5, 0.55));
    S.push(c(121, 162, 8.5, GOLD.base));
    S.push(c(121, 162, 5.6, "#D8E8DA", { sw: 1.2 }));
    S.push(p("M121,157 L123,162 L121,167 L119,162 Z", CLOTHS.sinople.dark, { sw: 1 }));
  }

  /* --- armoiries : étoile à huit rais, seulement sur les tenues hautes */
  if (opt.emblem) {
    S.push(p("M100,125 L102.3,134.5 L110.6,129.4 L105.5,137.7 L115,140 L105.5,142.3 L110.6,150.6 L102.3,145.5 L100,155 L97.7,145.5 L89.4,150.6 L94.5,142.3 L85,140 L94.5,137.7 L89.4,129.4 L97.7,134.5 Z", GOLD.base, { sw: 1.6 }));
    S.push(p("M100,131 L103,138 L100,140 L97,138 Z", GOLD.lite, { noStroke: true }));
  }

  /* --- ceinture. Le ceinturon de hanche n'apparaît qu'avec une arme :
         c'est lui qui porte le fourreau. */
  S.push(p("M66,174 L134,174 L134,194 L66,194 Z", LEATHER.dark));
  S.push(fold("M68,179 L132,179", LEATHER.line, 1.2, 0.5));
  S.push(p("M92,170 L108,170 L108,198 L92,198 Z", GOLD.base));
  S.push(p("M96,177 L104,177 L104,191 L96,191 Z", LEATHER.dark, { sw: 1.4 }));

  if (armed) {
    S.push(p("M62,198 L138,187 L138,201 L62,212 Z", LEATHER.base));
    S.push(c(78, 205, 2.6, GOLD.dark, { sw: 1.2 }));
    S.push(c(100, 202, 2.6, GOLD.dark, { sw: 1.2 }));
    S.push(c(122, 199, 2.6, GOLD.dark, { sw: 1.2 }));
  }

  S.push(p("M112,197 L134,193 L138,220 L116,226 Z", LEATHER.base));
  S.push(p("M111,195 L135,191 L136,202 L113,207 Z", LEATHER.dark));
  S.push(c(126, 211, 2.4, GOLD.dark, { sw: 1 }));

  /* --- pans de la tunique, fendus au centre pour laisser lire les jambes */
  S.push(p("M70,190 C62,224 58,250 60,274 C74,278 88,279 98,278 L99,190 Z", C.dark));
  S.push(p("M130,190 C138,224 142,250 140,274 C126,278 112,279 102,278 L101,190 Z", C.base));
  S.push(fold("M78,200 C72,230 69,254 70,273", C.line, 1.3, 0.5));
  S.push(fold("M122,200 C128,230 131,254 130,273", C.line, 1.3, 0.5));

  /* Une dague à chaque hanche garde la paire visible sur toutes les tenues,
     sans transformer les mains au repos en pose de combat. */
  if (hand === "daggers") {
    foreground.push(p("M62,196 L74,201 L62,238 L54,250 L51,237 Z", STEEL.dark));
    foreground.push(p("M138,196 L126,201 L138,238 L146,250 L149,237 Z", STEEL.base));
    foreground.push(p("M53,191 L78,199 L75,208 L50,200 Z", GOLD.dark));
    foreground.push(p("M147,191 L122,199 L125,208 L150,200 Z", GOLD.base));
    foreground.push(p("M61,181 L69,183 L65,199 L57,197 Z", LEATHER.base));
    foreground.push(p("M139,181 L131,183 L135,199 L143,197 Z", LEATHER.dark));
    foreground.push(fold("M69,207 L57,238", STEEL.lite, 1.5, 0.72));
    foreground.push(fold("M131,207 L143,238", STEEL.lite, 1.5, 0.72));
  }

  /* --- mantelet d'épaules : la marque du rôdeur */
  if (opt.mantle) {
    /* Un ourlet découpé, pas un bord rond : c'est le découpage qui fait lire
       « mantelet de rôdeur » plutôt que « bavoir ». */
    S.push(p("M100,90 C120,90 134,99 140,113 L133,133 L124,117 L112,138 L100,120 L88,138 L76,117 L67,133 L60,113 C66,99 80,90 100,90 Z", LEATHER.base));
    S.push(p("M86,88 C86,80 114,80 114,88 L119,102 L81,102 Z", LEATHER.dark));
    S.push(fold("M72,106 C76,116 80,124 84,130", LEATHER.line, 1.4, 0.5));
    S.push(fold("M128,106 C124,116 120,124 116,130", LEATHER.line, 1.4, 0.5));
    S.push(fold("M66,110 C74,104 84,101 100,101 C116,101 126,104 134,110", LEATHER.lite, 1.6, 0.45));
    S.push(c(100, 94, 4.5, GOLD.base));
  }

  /* --- écu : héraldique nette, l'avant-bras reste caché derrière. */
  if (hand === "shield") {
    foreground.push(p("M18,140 L78,140 L76,181 C76,207 60,223 48,231 C36,223 20,207 20,181 Z", C.dark));
    foreground.push(p("M24,146 L72,146 L70,180 C70,201 58,214 48,221 C38,214 26,201 26,180 Z", "none", { stroke: GOLD.base, sw: 3.2 }));
    foreground.push(p("M48,157 L51,169 L61,163 L55,174 L67,178 L55,182 L61,193 L51,187 L48,199 L45,187 L35,193 L41,182 L29,178 L41,174 L35,163 L45,169 Z", STEEL.base, { sw: 1.5 }));
    foreground.push(c(48, 178, 5.5, STEEL.dark));
    foreground.push(c(46.5, 176.5, 1.8, STEEL.lite, { noStroke: true }));
  }

  /* --- col, cou, tête */
  S.push(p("M88,82 C88,75 112,75 112,82 L122,108 L78,108 Z", opt.mail ? mailFill : C.dark));
  S.push(p("M91,68 L109,68 L109,92 L91,92 Z", T.dark));
  S.push(ao("M88,78 C94,86 106,86 112,78 L112,88 L88,88 Z", 0.22));

  /* Le bloc tête est agrandi autour de son centre. Les cheveux, expressions
     et couvre-chefs gardent ainsi exactement les mêmes points d'ancrage. */
  const H = [];

  /* Les longueurs tombent DERRIÈRE la tête : la nuque les cache à la racine
     et elles n'empiètent jamais sur le visage. */
  if (head !== "helm" && head !== "hood") H.push(...backHair(cut, opt.girl));

  if (head === "hood") H.push(p("M73,59 C69,29 82,9 100,8 C118,9 131,29 127,59 C127,77 121,92 113,101 L87,101 C79,92 73,77 73,59 Z", CLOAK.base));
  H.push(p("M100,22 C116,22 124,35 123,51 C122,68 113,80 100,84 C87,80 78,68 77,51 C76,35 84,22 100,22 Z", T.base));
  H.push(ao("M121,51 C124,62 121,72 115,79 L111,74 C115,67 116,59 115,51 Z", 0.18));

  /* --- chevelure, posée SUR le crâne */
  H.push(...hairShapes(cut, head, opt.girl));

  /* Oreilles par-dessus la coiffure : une coupe courte dégage l'oreille,
     elle ne l'avale pas. Masquées sous capuche et sous heaume. */
  /* Un carré, un afro ou des longueurs couvrent l'oreille : la dessiner
     par-dessus la ferait traverser les cheveux. */
  const earsShow = !opt.girl && cut !== "boucle";
  if (earsShow && head !== "hood" && head !== "helm") {
    H.push(e(78.2, 57, 2.8, 4.2, T.base, { sw: 1.5 }));
    H.push(e(121.8, 57, 2.8, 4.2, T.base, { sw: 1.5 }));
    H.push(fold("M78,55 C80,56 80,58 79,60", T.line, 1, 0.55));
    H.push(fold("M122,55 C120,56 120,58 121,60", T.line, 1, 0.55));
  }

  /* --- visage */
  H.push(...faceShapes(opt.face, opt.girl, T));

  /* --- couvre-chef par-dessus le visage */
  H.push(...headgearShapes(head));
  S.push(...H.map((shape) => ({
    ...shape,
    a: { ...shape.a, transform: `${shape.a.transform || ""} translate(-8 -4) scale(1.08)`.trim() }
  })));

  if (hand === "staff") {
    foreground.push(p("M145,88 L153,88 L155,362 L147,362 Z", WOOD.base));
    foreground.push(fold("M148,110 C148,190 150,280 150,352", WOOD.line, 1.3, 0.55));
    foreground.push(p("M143,120 L154,120 L154,132 L143,132 Z", LEATHER.dark));
    foreground.push(p("M136,74 C136,60 158,60 158,74 C158,86 148,92 147,92 C146,92 136,86 136,74 Z", GOLD.dark));
    foreground.push(c(147, 72, 12, "#7FC7D9"));
    foreground.push(c(143, 68, 4, "#DCF3F8", { noStroke: true }));
  }

  if (hand === "wand") {
    foreground.push(p("M142,145 L150,145 L149,218 L143,218 Z", WOOD.base));
    foreground.push(fold("M146,151 L146,211", WOOD.lite, 1.2, 0.55));
    foreground.push(p("M138,141 L154,141 L152,150 L140,150 Z", GOLD.dark));
    foreground.push(p("M146,120 L154,133 L149,145 L142,145 L137,133 Z", "#65CBE0", { sw: 1.5, stroke: "#275C72" }));
    foreground.push(p("M145,124 L149,133 L146,141 L142,133 Z", "#DDF7FF", { noStroke: true }));
  }

  if (hand === "lantern") {
    foreground.push(p("M137,204 C137,184 156,184 156,204", "none", { sw: 2.8, stroke: GOLD.dark }));
    foreground.push(p("M135,201 L158,201 L156,209 L137,209 Z", GOLD.dark));
    foreground.push(p("M139,209 L154,209 L158,244 L135,244 Z", GOLD.base));
    foreground.push(p("M142,213 L151,213 L153,239 L139,239 Z", "#F7C95F", { sw: 1.2, stroke: GOLD.dark }));
    foreground.push(p("M144,217 L150,217 L151,236 L142,236 Z", "#FFF1B8", { noStroke: true }));
    foreground.push(fold("M146.5,211 L146.5,241", GOLD.lite, 1.2, 0.65));
    foreground.push(p("M133,243 L160,243 L156,252 L137,252 Z", GOLD.dark));
  }

  if (hand === "book") {
    foreground.push(p("M76,158 C85,154 94,157 100,163 L100,201 C92,196 84,195 76,198 Z", "#D9C9A9", { sw: 1.6, stroke: "#6E5F44" }));
    foreground.push(p("M100,163 C106,157 115,154 124,158 L124,198 C116,195 108,196 100,201 Z", "#E8DCC2", { sw: 1.6, stroke: "#6E5F44" }));
    foreground.push(p("M72,154 C84,150 94,153 100,158 C106,153 116,150 128,154 L128,202 C116,199 107,201 100,207 C93,201 84,199 72,202 Z", "none", { sw: 2.6, stroke: CLOTHS.pourpre.lite }));
    foreground.push(fold("M81,168 C87,166 93,167 97,171", "#8A7A60", 1.1, 0.68));
    foreground.push(fold("M103,171 C108,167 114,166 120,168", "#8A7A60", 1.1, 0.68));
    foreground.push(p("M100,174 L102.5,180 L109,181 L104,185 L105.5,192 L100,188 L94.5,192 L96,185 L91,181 L97.5,180 Z", GOLD.base, { sw: 1 }));
  }

  if (hand === "scepter") {
    foreground.push(p("M145,102 L153,102 L153,278 L146,278 Z", GOLD.dark));
    foreground.push(fold("M149,113 L150,268", GOLD.lite, 1.4, 0.72));
    foreground.push(p("M136,98 Q149,108 162,98 L159,82 L153,90 L149,72 L145,90 L139,82 Z", GOLD.base, { sw: 1.6 }));
    foreground.push(c(149, 92, 6, "#68CDE4", { sw: 1.3, stroke: "#275C72" }));
    foreground.push(c(147, 90, 1.8, "#E5FAFF", { noStroke: true }));
    foreground.push(c(149.5, 278, 4.5, GOLD.base));
  }

  if (hand === "custom") {
    foreground.push(p("M142,154 L151,154 L150,220 L143,220 Z", LEATHER.base));
    foreground.push(fold("M146,160 L146,213", LEATHER.lite, 1.2, 0.58));
    foreground.push(p("M146,121 L157,135 L151,154 L141,154 L135,135 Z", "#6FAFC2", { sw: 1.7, stroke: "#315F88" }));
    foreground.push(p("M146,125 L151,136 L147,149 L141,136 Z", "#DDF8FF", { noStroke: true }));
    foreground.push(p("M135,135 L141,136 L146,154 L141,154 Z", "#7667A8", { noStroke: true }));
    foreground.push(p("M137,151 L156,151 L153,160 L140,160 Z", GOLD.dark));
    foreground.push(c(132, 126, 1.8, GOLD.lite, { noStroke: true }));
    foreground.push(c(161, 140, 2.2, "#AFA0D8", { noStroke: true }));
  }

  if (hand === "sword") {
    foreground.push(p("M145,222 L153,222 L153,194 L145,194 Z", LEATHER.dark));
    foreground.push(c(149, 227, 6, GOLD.base));
    foreground.push(p("M132,188 C141,186 157,186 166,188 L166,196 C157,194 141,194 132,196 Z", GOLD.base));
    foreground.push(p("M143,188 L155,188 L154,111 L149,95 L144,111 Z", STEEL.base));
    foreground.push(fold("M149,184 L149,115", STEEL.dark, 2, 0.55));
    foreground.push(fold("M146,184 L147,114", STEEL.lite, 1.7, 0.82));
  }

  /* Poignets au premier plan. Hors prise spéciale, les deux côtés sont des
     miroirs exacts; le livre est tenu au centre par deux avant-bras égaux. */
  const cuff = p("M52,177 C57,180 63,180 68,177 L68,190 C63,193 57,193 52,190 Z", LEATHER.dark);
  const cuffFold = fold("M55,184 C58,186 63,186 65,184", LEATHER.lite, 1.1, 0.48);
  S.push(cuff, mirroredShape(cuff), cuffFold, mirroredShape(cuffFold));

  if (hand === "book") {
    const forearm = p("M56,188 C60,186 65,188 67,192 L76,200 L72,208 L61,202 C57,199 54,193 56,188 Z", T.base);
    const bookFist = c(76, 202, 7.5, T.base);
    const bookFistFold = fold("M70,201 Q76,205 82,201", T.line, 0.9, 0.5);
    S.push(forearm, mirroredShape(forearm), bookFist, mirroredShape(bookFist), bookFistFold, mirroredShape(bookFistFold));
  } else {
    const restingFist = c(60, 199, 8, T.base);
    const restingFistFold = fold("M54,198 Q60,202 66,198", T.line, 0.9, 0.5);
    S.push(restingFist, restingFistFold);

    if (gripGear) {
      S.push(c(144, 199, 8, T.base));
      S.push(fold("M138,198 Q144,202 150,198", T.line, 0.9, 0.5));
    } else {
      S.push(mirroredShape(restingFist), mirroredShape(restingFistFold));
    }
  }

  S.push(...foreground);
  return S;
}

/* ---------- coiffures ----------
   Les cheveux se posent SUR le crâne : le volume déborde de l'ovale, la
   racine suit le front sans toucher le sourcil, et une raie donne la
   direction. Sous un couvre-chef on ne dessine QUE ce qui dépasse du bord,
   sinon la coiffe flotte sur une masse qu'elle devrait écraser.          */

function backHair(cut, girl) {
  if (cut === "queue") {
    return [
      p("M112,35 C130,38 139,54 135,71 C132,84 124,96 128,117 C130,128 124,139 114,137 C105,135 103,125 107,116 C113,101 116,91 111,78 Z", HAIR.dark),
      p("M116,50 C128,56 130,68 125,80 C122,88 119,99 121,111 C115,101 116,88 119,77 C122,66 120,58 116,50 Z", HAIR.base, { noStroke: true }),
      p("M111,43 C118,40 125,43 128,49 L124,57 C119,53 114,52 109,55 Z", GOLD.dark)
    ];
  }

  if (cut === "tresses") {
    return [
      p("M75,43 C68,62 67,81 72,98 C65,109 67,124 77,134 C88,125 89,109 82,98 C87,77 85,59 81,43 Z", HAIR.base),
      p("M125,43 C132,62 133,81 128,98 C135,109 133,124 123,134 C112,125 111,109 118,98 C113,77 115,59 119,43 Z", HAIR.dark),
      fold("M76,57 C70,66 82,73 75,82 C69,91 82,99 75,108 C70,115 78,123 80,127", HAIR.lite, 2, 0.55),
      fold("M124,57 C130,66 118,73 125,82 C131,91 118,99 125,108 C130,115 122,123 120,127", HAIR.line, 2, 0.48),
      p("M70,96 L84,96 L85,104 L71,104 Z", GOLD.dark),
      p("M116,96 L130,96 L129,104 L115,104 Z", GOLD.dark)
    ];
  }

  if (cut === "longue") {
    /* Fille : longueurs qui encadrent le visage et tombent devant l'épaule. */
    if (girl) {
      return [
        p("M86,36 C74,62 68,104 74,142 C80,151 92,152 98,144 C90,112 87,68 92,40 Z", HAIR.base),
        p("M114,36 C126,62 132,104 126,142 C120,151 108,152 102,144 C110,112 113,68 108,40 Z", HAIR.dark),
        fold("M82,64 C77,96 76,120 80,140", HAIR.lite, 1.7, 0.35),
        fold("M118,64 C123,96 124,120 120,140", HAIR.line, 1.7, 0.35)
      ];
    }
    /* Garçon : cheveux tirés en arrière et noués en catogan sur la nuque. */
    return [
      p("M106,50 C120,58 127,78 123,104 C119,116 107,117 101,109 C109,90 109,68 100,54 Z", HAIR.dark),
      p("M103,52 C112,58 116,70 115,82 C111,74 107,64 100,56 Z", HAIR.base, { noStroke: true }),
      fold("M110,68 C115,82 116,94 113,104", HAIR.line, 1.6, 0.4)
    ];
  }

  /* Version fille des épis : la même coupe, prolongée. C'est ce qui la rend
     personnelle sans doubler le nombre de dessins. */
  if (cut === "epis" && girl) {
    return [
      p("M84,44 C74,68 72,96 78,118 C84,124 93,123 97,116 C90,96 88,68 92,46 Z", HAIR.base),
      p("M116,44 C126,68 128,96 122,118 C116,124 107,123 103,116 C110,96 112,68 108,46 Z", HAIR.dark),
      fold("M82,70 C79,92 79,106 82,116", HAIR.lite, 1.6, 0.35)
    ];
  }

  /* L'afro est volontairement identique pour tout le monde : c'est la coupe
     commune, elle n'a pas besoin d'être genrée. */
  return [];
}

/* Ce qui reste visible sous un chapeau : pattes pour une coupe garçon,
   côtés du carré pour une coupe fille. Sans ça la coiffe flotte sur une
   masse qu'elle devrait écraser. */
function underHat(girl) {
  if (girl) {
    return [
      p("M75,68 C70,56 70,46 73,36 L86,38 C84,48 81,59 75,68 Z", HAIR.base),
      p("M125,68 C130,56 130,46 127,36 L114,38 C116,48 119,59 125,68 Z", HAIR.dark)
    ];
  }
  return [
    p("M79,62 C74,52 72,44 75,35 L87,36 C86,45 83,54 79,62 Z", HAIR.base),
    p("M121,62 C126,52 128,44 125,35 L113,36 C114,45 117,54 121,62 Z", HAIR.dark)
  ];
}

function hairShapes(cut, head, girl) {
  /* Heaume et capuche enferment la tête : rien ne dépasse. */
  if (head === "helm" || head === "hood") return [];

  const capped = head === "wizard" || head === "crown";
  if (capped) {
    const S = cut === "boucle" ? [] : underHat(girl);
    if (cut === "boucle") {
      S.push(c(74, 46, 7, HAIR.base), c(126, 46, 7, HAIR.dark));
      S.push(c(77, 58, 5.5, HAIR.base), c(123, 58, 5.5, HAIR.dark));
    }
    return S;
  }

  const S = [];

  if (cut === "queue") {
    S.push(p("M77,58 C73,42 78,24 91,18 C101,13 116,17 123,27 C127,34 127,45 123,57 C119,48 115,41 108,37 C99,33 89,37 84,45 C81,49 79,54 77,58 Z", HAIR.base));
    S.push(p("M91,20 C102,16 114,20 120,28 C111,24 101,24 93,29 C87,33 82,40 80,49 C80,36 83,26 91,20 Z", HAIR.lite, { noStroke: true }));
    S.push(fold("M84,45 C92,35 104,29 117,29", HAIR.lite, 1.8, 0.5));
    S.push(fold("M92,48 C101,38 111,34 121,35", HAIR.line, 1.5, 0.4));
    return S;
  }

  if (cut === "tresses") {
    S.push(p("M76,58 C72,43 76,25 89,18 C96,14 104,14 111,18 C124,25 128,43 124,58 C121,48 117,40 110,36 C103,32 97,32 90,36 C83,40 79,48 76,58 Z", HAIR.base));
    S.push(fold("M100,17 L100,34", HAIR.line, 1.7, 0.58));
    S.push(fold("M95,20 C87,27 82,36 80,48", HAIR.lite, 1.8, 0.5));
    S.push(fold("M105,20 C113,27 118,36 120,48", HAIR.line, 1.6, 0.42));
    return S;
  }

  /* ----- Afro : la coupe commune, identique garçon et fille -----
     Le contour festonné vient de boucles posées AVANT la masse : leurs arcs
     extérieurs dépassent, leurs contours intérieurs sont recouverts. Une
     grappe de cercles visibles ferait perruque de clown. */
  if (cut === "boucle") {
    [[76, 30, 10], [83, 17, 10], [95, 11, 10.5], [108, 12, 10],
     [120, 20, 10], [126, 33, 10], [123, 47, 9], [75, 45, 9]]
      .forEach(([x, y, r]) => S.push(c(x, y, r, HAIR.base)));
    S.push(p("M100,12 C118,12 130,22 130,36 C130,46 127,54 122,58 C121,48 117,41 109,38 C101,35 93,36 87,41 C81,45 79,50 78,58 C73,54 70,46 70,36 C70,22 82,12 100,12 Z", HAIR.base));
    S.push(c(73, 48, 5.5, HAIR.base));
    S.push(c(127, 48, 5.5, HAIR.dark));
    S.push(fold("M80,26 C84,21 90,21 93,26", HAIR.lite, 1.7, 0.5));
    S.push(fold("M99,19 C104,15 110,16 113,21", HAIR.lite, 1.7, 0.5));
    S.push(fold("M84,38 C89,33 96,32 101,35", HAIR.lite, 1.6, 0.42));
    S.push(fold("M112,26 C117,23 122,25 124,30", HAIR.line, 1.5, 0.4));
    S.push(fold("M73,36 C77,32 82,33 84,38", HAIR.line, 1.5, 0.35));
    return S;
  }

  /* ----- Épis : mèches effilées, balayées. La calotte doit couvrir le
     sommet du crâne (y=24), sinon le cuir chevelu apparaît entre les
     mèches et ça fait crête de punk sur un front nu. ----- */
  if (cut === "epis") {
    S.push(p("M76,36 C70,27 72,15 81,10 C79,20 80,28 85,35 Z", HAIR.base));
    S.push(p("M85,28 C84,17 90,8 99,4 C96,13 94,21 95,28 Z", HAIR.base));
    S.push(p("M98,26 C102,15 110,7 119,6 C113,13 108,21 108,29 Z", HAIR.dark));
    S.push(p("M108,31 C116,24 125,24 131,29 C124,31 118,35 115,39 Z", HAIR.dark));
    S.push(p("M78,56 C74,38 82,17 100,17 C118,17 126,38 122,56 C121,48 118,41 113,38 C105,33 94,34 87,39 C83,42 79,48 78,56 Z", HAIR.base));
    S.push(fold("M86,34 C93,29 101,28 108,31", HAIR.lite, 1.8, 0.5));
    S.push(fold("M90,22 C94,16 99,12 104,10", HAIR.lite, 1.6, 0.42));
    S.push(fold("M83,30 C81,38 80,46 80,54", HAIR.line, 1.5, 0.35));
    return S;
  }

  if (cut === "longue") {
    if (girl) {
      /* Raie au milieu, deux bandeaux qui encadrent le front. */
      S.push(p("M78,58 C73,44 75,24 88,17 C95,13 105,13 112,17 C125,24 127,44 122,58 C121,50 119,44 115,41 C110,36 105,34 100,34 C95,34 90,36 85,41 C81,44 79,50 78,58 Z", HAIR.base));
      S.push(fold("M100,18 L100,33", HAIR.line, 1.6, 0.55));
      S.push(fold("M94,20 C88,26 84,34 82,44", HAIR.lite, 1.8, 0.45));
      S.push(fold("M106,20 C112,26 116,34 118,44", HAIR.line, 1.8, 0.4));
      return S;
    }
    /* Garçon : tout tiré en arrière, front dégagé, pas de frange — le
       catogan derrière fait le reste du travail. */
    S.push(p("M78,58 C74,38 80,18 100,18 C120,18 126,38 122,58 C121,48 118,40 112,36 C105,32 95,32 88,36 C82,40 79,48 78,58 Z", HAIR.base));
    S.push(fold("M84,50 C86,38 92,29 100,25", HAIR.lite, 1.8, 0.5));
    S.push(fold("M92,52 C94,40 99,31 106,26", HAIR.lite, 1.5, 0.35));
    S.push(fold("M114,50 C112,38 107,30 100,26", HAIR.line, 1.6, 0.4));
    return S;
  }

  /* ----- Court ----- */
  if (girl) {
    /* Carré court : la masse descend le long des joues jusqu'à la mâchoire
       et couvre l'oreille. Une frange nette au-dessus du sourcil. */
    S.push(p("M74,70 C68,52 70,28 82,19 C89,14 111,14 118,19 C130,28 132,52 126,70 C124,62 123,54 121,46 C118,36 108,31 98,34 C90,36 85,42 83,50 C81,58 79,64 74,70 Z", HAIR.base));
    S.push(p("M88,20 C94,16 108,16 114,20 C106,17 95,17 88,20 Z", HAIR.lite, { noStroke: true }));
    S.push(fold("M78,40 C76,52 76,62 78,68", HAIR.line, 1.5, 0.4));
    S.push(fold("M122,40 C124,52 124,62 122,68", HAIR.line, 1.5, 0.4));
    S.push(fold("M104,24 C97,27 91,32 88,38", HAIR.lite, 1.8, 0.45));
    return S;
  }

  /* Garçon : raie sur le côté, frange balayée. La racine descend à 42 à
     droite et 48 à gauche — juste au-dessus du sourcil (45). */
  S.push(p("M79,61 C74,51 72,33 81,21 C87,13 113,13 119,21 C128,33 126,51 121,61 C120,53 119,46 117,42 C113,35 105,32 97,34 C91,36 87,42 85,48 C83,52 81,56 79,61 Z", HAIR.base));
  S.push(p("M88,21 C94,16 108,16 114,20 C106,17 95,17 88,21 Z", HAIR.lite, { noStroke: true }));
  S.push(fold("M108,22 C102,28 96,35 92,44", HAIR.lite, 2, 0.5));
  S.push(fold("M114,26 C110,32 106,38 104,44", HAIR.lite, 1.5, 0.32));
  S.push(fold("M85,30 C82,38 81,47 81,55", HAIR.line, 1.5, 0.4));
  return S;
}

/* ---------- visage ---------- */

function faceShapes(face, girl, T) {
  const S = [];
  const brow = (x, dir) => p(`M${x - 5},44.5 Q${x},${42.2 + dir} ${x + 5},44.5`, "none", { sw: 1.65, stroke: HAIR.dark });
  const eye = (x) => [
    e(x, 52, 2.8, 3.35, INK, { noStroke: true }),
    c(x + 1, 50.7, 0.9, "#FFFFFF", { noStroke: true })
  ];
  const lashes = girl
    ? [p("M86,48.5 L83.5,46.3", "none", { sw: 1.45, stroke: INK }),
       p("M114,48.5 L116.5,46.3", "none", { sw: 1.45, stroke: INK })]
    : [];

  if (face === "star-eyes") {
    const star = (x) => p(`M${x},46.5 L${x + 1.7},50 L${x + 5.5},50.5 L${x + 2.7},53.2 L${x + 3.4},57 L${x},55.2 L${x - 3.4},57 L${x - 2.7},53.2 L${x - 5.5},50.5 L${x - 1.7},50 Z`, GOLD.base, { sw: 1.25, stroke: GOLD.line });
    S.push(star(92), star(108));
    S.push(c(90.8, 49.8, 0.8, "#FFF7CF", { noStroke: true }));
    S.push(c(106.8, 49.8, 0.8, "#FFF7CF", { noStroke: true }));
    S.push(brow(92, 0), brow(108, 0));
  } else if (face === "cool") {
    /* Regard déterminé, mais toujours vivant : iris aplatis et sourcils
       inclinés plutôt que deux traits qui donnent l'impression d'yeux fermés. */
    S.push(e(92, 52.5, 3.1, 2.45, INK, { noStroke: true }));
    S.push(e(108, 52.5, 3.1, 2.45, INK, { noStroke: true }));
    S.push(c(93, 51.7, 0.8, "#FFFFFF", { noStroke: true }));
    S.push(c(109, 51.7, 0.8, "#FFFFFF", { noStroke: true }));
    S.push(p("M87,43 L97,45.5", "none", { sw: 1.8, stroke: HAIR.dark }));
    S.push(p("M103,45.5 L113,43", "none", { sw: 1.8, stroke: HAIR.dark }));
    S.push(p("M114,42 L111,60", "none", { sw: 1.6, stroke: T.line }));
  } else if (face === "wink") {
    S.push(p("M86.5,52 Q92,55.5 97.5,52", "none", { sw: 2.6, stroke: INK }));
    S.push(...eye(108));
    S.push(brow(92, 0), brow(108, 0));
  } else {
    S.push(...eye(92), ...eye(108));
    S.push(brow(92, 0), brow(108, 0));
  }

  S.push(...lashes);
  S.push(p("M100,56.5 L100,63", "none", { sw: 1.6, stroke: T.line }));
  S.push(p("M100,63 C102.5,63.5 104,62.5 104.5,61", "none", { sw: 1.4, stroke: T.line }));

  if (face === "grin") {
    S.push(p("M93.5,68 C97,73.5 103,73.5 106.5,68 Z", "#8A4048", { sw: 1.6 }));
    S.push(p("M94.5,67.5 L105.5,67.5", "none", { sw: 1.6, stroke: "#F7EEDD" }));
  } else {
    S.push(p("M95.5,69 Q100,72 104.5,69", "none", { sw: 2, stroke: T.line }));
  }
  return S;
}

/* ---------- couvre-chefs ----------
   Tous s'arrêtent au-dessus du sourcil (y=45). Une version antérieure
   posait le bandeau à y=52 : il passait sur les yeux.                  */

function headgearShapes(head) {
  const S = [];

  if (head === "hood") {
    S.push(p("M77,53 C75,28 86,14 100,14 C114,14 125,28 123,53 C123,61 121,67 117,73 L111,59 C113,44 109,33 100,31 C91,33 87,44 89,59 L83,73 C79,67 77,61 77,53 Z", CLOAK.base));
    S.push(fold("M84,55 C82,37 89,27 100,25 C111,27 118,37 116,55", CLOAK.line, 1.5, 0.6));
    S.push(ao("M86,51 C86,36 92,28 100,25 C108,28 114,36 114,51 L110,51 C110,40 106,33 100,31 C94,33 90,40 90,51 Z", 0.18));
  } else if (head === "helm") {
    S.push(p("M76,39 C76,17 87,7 100,7 C113,7 124,17 124,39 Z", STEEL.base));
    S.push(p("M74,34 L126,34 L125,43 L75,43 Z", STEEL.dark));
    S.push(p("M75,41 L84,42 L83,57 L78,62 L75,55 Z", STEEL.dark));
    S.push(p("M125,41 L116,42 L117,57 L122,62 L125,55 Z", STEEL.dark));
    S.push(p("M97.5,40 L102.5,40 L102.5,57 C102.5,60 97.5,60 97.5,57 Z", STEEL.base));
    S.push(fold("M84,33 C83,21 89,13 95,9", STEEL.lite, 2.6, 0.8));
    S.push(fold("M100,9 L100,33", STEEL.dark, 1.4, 0.48));
    S.push(c(82, 38.5, 2, GOLD.base, { sw: 1 }));
    S.push(c(118, 38.5, 2, GOLD.base, { sw: 1 }));
  } else if (head === "goggles") {
    S.push(p("M74,29 C87,25 113,25 126,29", "none", { sw: 4.2, stroke: LEATHER.dark }));
    S.push(c(89, 29, 9.5, GOLD.dark, { sw: 1.8 }));
    S.push(c(111, 29, 9.5, GOLD.dark, { sw: 1.8 }));
    S.push(c(89, 29, 6.2, "#80C8D8", { sw: 1.2 }));
    S.push(c(111, 29, 6.2, "#80C8D8", { sw: 1.2 }));
    S.push(p("M84,26 C86,23 89,22 92,23", "none", { sw: 1.8, stroke: "#DDF5F8" }));
    S.push(p("M106,26 C108,23 111,22 114,23", "none", { sw: 1.8, stroke: "#DDF5F8" }));
  } else if (head === "wizard") {
    S.push(p("M58,35 C76,28 124,28 142,35 C126,43 74,43 58,35 Z", CLOAK.dark));
    S.push(p("M79,33 C81,17 90,3 104,0 C105,9 101,15 108,20 C113,23 116,27 119,33 Z", CLOAK.base));
    S.push(p("M79,27 C89,31 111,31 121,27 L120,35 C111,39 89,39 80,35 Z", GOLD.dark));
    S.push(p("M100,26 L104,31 L100,36 L96,31 Z", "#7FC7D9"));
    S.push(fold("M86,28 C88,18 93,8 100,3", CLOAK.lite, 2, 0.5));
  } else if (head === "crown") {
    S.push(p("M80,35 L80,17 L90,25 L100,10 L110,25 L120,17 L120,35 Z", GOLD.base));
    S.push(p("M80,30 C88,35 112,35 120,30 L120,38 C112,43 88,43 80,38 Z", GOLD.dark));
    S.push(c(90, 23, 2.4, "#8E3230", { sw: 1.1 }));
    S.push(c(100, 17, 2.8, "#7FC7D9", { sw: 1.1 }));
    S.push(c(110, 23, 2.4, "#2F5C43", { sw: 1.1 }));
    S.push(fold("M84,35 C91,39 98,40 104,40", GOLD.lite, 1.6, 0.7));
  }
  return S;
}

/* ---------- rendu ---------- */

function renderFigure(opt) {
  const S = heroShapes(opt);
  const stroke = opt.stroke ?? 1.7;
  const id = opt.id;

  /* La maille est une trame, pas un aplat : c'est ce détail qui fait
     basculer la lecture de « vecteur plat » à « armure ». */
  const defs = `<defs><pattern id="mail-${id}" width="6" height="6" patternUnits="userSpaceOnUse">
      <rect width="6" height="6" fill="${MAIL.base}"/>
      <circle cx="1.5" cy="1.5" r="1.6" fill="none" stroke="${MAIL.dark}" stroke-width="1"/>
      <circle cx="4.5" cy="4.5" r="1.6" fill="none" stroke="${MAIL.dark}" stroke-width="1"/>
      <circle cx="4.5" cy="1.5" r="1.6" fill="none" stroke="${MAIL.lite}" stroke-width="0.7"/>
      <circle cx="1.5" cy="4.5" r="1.6" fill="none" stroke="${MAIL.lite}" stroke-width="0.7"/>
    </pattern>
    <linearGradient id="light-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFF8EA" stop-opacity=".20"/>
      <stop offset=".42" stop-color="#FFF8EA" stop-opacity="0"/>
      <stop offset="1" stop-color="#120D0A" stop-opacity=".24"/>
    </linearGradient>
    <radialGradient id="depth-${id}" cx="48%" cy="25%" r="76%">
      <stop offset=".54" stop-color="#120D0A" stop-opacity="0"/>
      <stop offset="1" stop-color="#120D0A" stop-opacity=".16"/>
    </radialGradient></defs>`;

  const body = S.map((s) => draw(s, stroke)).join("");

  const shading = `
    <clipPath id="clip-${id}">${S.filter((s) => s.fill !== "none").map(clipGeom).join("")}</clipPath>
    <g clip-path="url(#clip-${id})">
      <rect width="200" height="390" fill="url(#light-${id})"/>
      <rect width="200" height="390" fill="url(#depth-${id})"/>
    </g>`;

  const ground = opt.ground === false ? ""
    : `<ellipse cx="100" cy="348" rx="58" ry="8" fill="${INK}" opacity="0.18"/>`;

  const atmosphere = opt.ground === false ? "" : roleAtmosphere(opt.role);

  const mirrored = opt.mirror ? "translate(200 0) scale(-1 1)" : "";
  const figure = `<g transform="${mirrored}"><g transform="translate(-3 2) scale(1.03 0.96)">${body}${shading}</g></g>`;

  return `<svg class="${opt.cls || "avatar"}" data-role="${opt.role || "scout"}" viewBox="${opt.viewBox || "0 0 200 360"}" role="img" aria-label="${opt.alt || "hero"}">
    ${defs}${atmosphere}${ground}${figure}
  </svg>`;
}

function roleAtmosphere(role) {
  if (role === "ranger") {
    return `<g class="hero-fx hero-fx-ranger" fill="#7BCB9B" stroke="none">
      <path d="M29 152 Q40 145 45 157 Q34 161 29 152Z" opacity=".28"/>
      <path d="M167 221 Q177 215 182 226 Q171 229 167 221Z" opacity=".22"/>
    </g>`;
  }
  if (role === "mage") {
    return `<g class="hero-fx hero-fx-mage" fill="none" stroke="#C7B8FF" stroke-linecap="round">
      <path d="M39 194 C27 181 28 164 39 152" opacity=".20" stroke-width="1.5"/>
      <circle cx="35" cy="146" r="2.8" fill="#D9CCFF" stroke="none" opacity=".52"/>
      <circle cx="166" cy="205" r="3.4" fill="#8FDDF0" stroke="none" opacity=".42"/>
    </g>`;
  }
  if (role === "keeper") {
    return `<g class="hero-fx hero-fx-keeper" fill="none" stroke="#FFE58A">
      <circle cx="100" cy="176" r="82" opacity=".10" stroke-width="1.5"/>
      <circle cx="100" cy="176" r="70" opacity=".06" stroke-width="1"/>
    </g>`;
  }
  return "";
}

/* ---------- API publique ---------- */

export function renderHero(pupil) {
  const outfit = OUTFITS[pupil.skin] || OUTFITS.starter;
  return renderFigure({
    id: safeId(pupil.id),
    tone: pupil.skinTone,
    ...outfit,
    hairStyle: HAIRCUTS[pupil.hair] || "court",
    head: HEADGEAR[pupil.hat] || "none",
    hand: HANDGEAR[pupil.weapon] || "none",
    face: pupil.face,
    girl: pupil.gender === "girl",
    mirror: mirrorFor(pupil.id),
    alt: `${pupil.name || "hero"} the hero`,
    cls: `avatar hero-${outfit.role} ${pupil.skin === "grammar-mage" ? "magic" : ""}`
  });
}

/* L'aperçu boutique est la MÊME figure, simplement recadrée sur la pièce.
   Aucune géométrie dupliquée : ce qu'on achète est ce qu'on portera. */
const ITEM_CROPS = {
  outfit: "44 84 112 214",
  hat: "58 0 84 76",
  face: "76 30 48 52",
  "pencil-sword": "122 88 54 150",
  "word-wand": "130 112 40 112",
  "star-shield": "10 134 76 104",
  lantern: "128 180 42 82",
  "magic-book": "66 146 68 70",
  daggers: "44 176 112 84",
  scepter: "134 64 34 94",
  "custom-item": "130 112 42 114",
  short: "68 4 64 84",
  long: "60 2 80 144",
  curly: "60 0 80 88",
  spiky: "62 0 76 90",
  ponytail: "62 0 96 148",
  braids: "58 0 84 146"
};

export function renderItemArt(item) {
  const base = {
    id: safeId(`art-${item.id}-${++artSeq}`),
    tone: "light",
    ...OUTFITS.starter,
    hairStyle: "court",
    head: "none",
    hand: "none",
    face: "smile",
    girl: false,
    mirror: false,
    ground: false,
    alt: item.name,
    cls: "avatar item-art"
  };

  if (item.type === "outfit") Object.assign(base, OUTFITS[item.id] || OUTFITS.starter);
  else if (item.type === "hat") base.head = HEADGEAR[item.id] || "none";
  else if (item.type === "weapon") base.hand = HANDGEAR[item.id] || "none";
  else if (item.type === "face") base.face = item.id;
  else if (item.type === "hair") base.hairStyle = HAIRCUTS[item.id] || "court";

  /* « Aucun » n'a rien à montrer : un tiret vaut mieux qu'un aperçu trompeur. */
  if (item.id === "no-hat" || item.id === "no-weapon") {
    return `<svg class="avatar item-art none" viewBox="0 0 80 80" role="img" aria-label="${item.name}"><line x1="26" y1="40" x2="54" y2="40" stroke="#9A8B78" stroke-width="6" stroke-linecap="round"/></svg>`;
  }

  return renderFigure({ ...base, viewBox: ITEM_CROPS[item.id] || ITEM_CROPS[item.type] });
}

export function renderCoinIcon() {
  return `
    <svg class="coin" viewBox="0 0 20 20" role="img" aria-hidden="true">
      <circle cx="10" cy="10" r="8.6" fill="${GOLD.base}" stroke="${GOLD.line}" stroke-width="1.8"/>
      <circle cx="10" cy="10" r="6" fill="none" stroke="${GOLD.dark}" stroke-width="1.2"/>
      <path d="M10 5.4 L11.2 8.8 L14.6 10 L11.2 11.2 L10 14.6 L8.8 11.2 L5.4 10 L8.8 8.8 Z" fill="${GOLD.lite}"/>
    </svg>
  `;
}

export function renderHeartIcon(filled) {
  /* Couleurs HUD (pas le personnage) : un cœur plein vif + un contour
     pâle lisible sur le fond bleu nuit. */
  const fill = filled ? "#FF5A5F" : "rgba(150, 180, 215, 0.16)";
  const stroke = filled ? "#C41E2A" : "rgba(150, 180, 215, 0.55)";
  return `
    <svg class="hp-heart ${filled ? "" : "empty"}" viewBox="0 0 20 19" role="img" aria-hidden="true">
      <path d="M10 17.5 C3.5 12.5 1 9 1 5.5 C1 2.8 3.2 1 5.5 1 C7.4 1 9 2.6 10 4.2 C11 2.6 12.6 1 14.5 1 C16.8 1 19 2.8 19 5.5 C19 9 16.5 12.5 10 17.5 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.8" stroke-linejoin="round"/>
      ${filled ? `<path d="M5.5 5 C5.5 4 6.3 3.4 7.2 3.6" stroke="#FF9B9B" stroke-width="1.6" fill="none" stroke-linecap="round"/>` : ""}
    </svg>
  `;
}

/* La mascotte est un héros comme les autres, équipé à fond. */
export function renderMascot() {
  return renderFigure({
    id: "mascot",
    tone: "medium",
    ...OUTFITS["story-keeper"],
    hairStyle: "court",
    head: "crown",
    hand: "sword",
    face: "smile",
    girl: false,
    mirror: false,
    alt: "hero mascot",
    cls: "mascot"
  });
}
