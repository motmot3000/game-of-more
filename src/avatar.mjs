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
  starter:          { cloth: "lin",      role: "scout",     cape: false,  mail: false, emblem: false, greaves: false, pathfinder: true },
  "vocab-ranger":   { cloth: "sinople",  role: "ranger",    mantle: true, mail: false, emblem: false, greaves: false },
  "grammar-mage":   { cloth: "pourpre",  role: "mage",      cape: true,   mail: false, emblem: true,  greaves: false },
  "story-keeper":   { cloth: "ecarlate", role: "keeper",    cape: true,   mail: true,  emblem: true,  greaves: true  },
  "honor-knight":   { cloth: "azur",     role: "knight",    cape: true,   mail: true,  emblem: true,  greaves: true },
  "grand-archmage": { cloth: "pourpre",  role: "archmage",  mantle: true, cape: true,  emblem: true,  greaves: false },
  "realm-sovereign":{ cloth: "ecarlate", role: "sovereign", cape: true,   mail: true,  emblem: true,  greaves: true }
};
const HEADGEAR = {
  "no-hat": "none",
  "explorer-cap": "goggles",
  sunglasses: "sunglasses",
  "feather-beret": "beret",
  "wizard-hat": "wizard",
  "shadow-hood": "hood",
  "gold-crown": "crown",
  "steel-helm": "helm",
  "winged-circlet": "circlet",
  "star-cowl": "starcowl",
  "celestial-crown": "celestial"
};
const HANDGEAR = {
  "no-weapon": "none",
  "pencil-sword": "sword",
  "word-wand": "staff",
  "star-shield": "shield",
  "lore-lantern": "lantern",
  "spell-grimoire": "grimoire",
  "dual-daggers": "daggers",
  "astral-scepter": "scepter",
  "wisdom-relic": "relic",
  "custom-bespoke": "bespoke"
};
const HAIRCUTS = {
  short: "court",
  long: "longue",
  curly: "boucle",
  spiky: "epis",
  ponytail: "queue",
  braided: "tresse",
  flowing: "flottant",
  "celestial-hair": "couronne"
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

  /* Manches : maille pour la tenue la plus haute, tissu sinon. */
  const sleeve = opt.mail ? mailFill : C.dark;

  const S = [];

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

  /* --- bras arrière : sans objet il tombe naturellement; avec équipement,
         il se replie pour tenir le bouclier ou stabiliser la posture. */
  if (hand === "none") {
    S.push(p("M68,107 C57,109 50,117 47,130 C45,141 46,154 48,166 L63,168 C64,155 64,143 64,133 C65,126 69,121 74,119 Z", sleeve));
    S.push(fold("M53,122 C49,136 51,151 54,163", C.line, 1.25, 0.42));
    S.push(p("M47,161 C52,164 58,164 64,161 L65,176 C60,179 53,179 48,176 Z", LEATHER.dark));
    S.push(fold("M50,169 C54,171 60,171 63,169", LEATHER.lite, 1.2, 0.5));
    S.push(p("M50,174 C53,172 60,173 62,176 L63,187 L62,201 C61,206 58,209 55,209 C51,209 48,206 48,201 L49,187 L47,181 C46,178 47,176 50,174 Z", T.dark));
    S.push(fold("M52,190 L52,204", T.line, 0.95, 0.56));
    S.push(fold("M56,189 L56,206", T.line, 0.95, 0.5));
    S.push(fold("M60,188 L60,202", T.line, 0.9, 0.44));
    S.push(p("M49,178 C45,178 43,182 45,185 C46,187 49,186 51,184 Z", T.dark, { sw: 1.25 }));
  } else {
    S.push(p("M68,107 C57,109 49,116 45,128 C42,137 46,148 51,157 L65,151 C62,144 60,137 62,131 C64,125 69,121 74,119 Z", sleeve));
    S.push(fold("M51,124 C48,133 51,143 56,151", C.line, 1.25, 0.42));
    S.push(p("M49,152 L64,146 L70,158 L55,166 Z", LEATHER.dark));
    S.push(fold("M53,155 L64,151", LEATHER.lite, 1.3, 0.5));
    S.push(p("M56,163 C60,160 65,161 68,165 L73,174 L78,178 C81,181 81,185 78,188 C75,191 70,190 68,187 L64,182 L60,178 C56,175 53,170 54,167 C54,165 55,164 56,163 Z", T.dark));
    S.push(fold("M69,176 C72,178 75,180 78,181", T.line, 1.15, 0.6));
    S.push(fold("M66,181 C69,184 72,185 75,185", T.line, 1.05, 0.46));
  }

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

  /* --- écu, tenu par le bras arrière */
  if (hand === "shield") {
    S.push(p("M18,140 L78,140 L76,181 C76,207 60,223 48,231 C36,223 20,207 20,181 Z", C.dark));
    S.push(p("M24,146 L72,146 L70,180 C70,201 58,214 48,221 C38,214 26,201 26,180 Z", "none", { stroke: GOLD.base, sw: 3.2 }));
    S.push(p("M26,158 L48,172 L70,158 L70,168 L48,182 L26,168 Z", C.lite));
    S.push(c(48, 190, 9, STEEL.base));
    S.push(c(45.5, 187.5, 3.2, STEEL.lite, { noStroke: true }));
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
  if (head !== "helm") H.push(...backHair(cut, opt.girl));

  if (head === "hood") H.push(p("M72,58 C68,24 84,6 100,6 C116,6 132,24 128,58 C128,76 121,94 112,102 L88,102 C79,94 72,76 72,58 Z", CLOAK.base));
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
    H.push(e(78, 55, 3.8, 5.4, T.base, { sw: 1.8 }));
    H.push(e(122, 55, 3.8, 5.4, T.base, { sw: 1.8 }));
    H.push(fold("M78,52 C81,54 81,57 79,59", T.line, 1.2, 0.6));
    H.push(fold("M122,52 C119,54 119,57 121,59", T.line, 1.2, 0.6));
  }

  /* --- visage */
  H.push(...faceShapes(opt.face, opt.girl, T));

  /* --- couvre-chef par-dessus le visage */
  H.push(...headgearShapes(head));
  S.push(...H.map((shape) => ({
    ...shape,
    a: { ...shape.a, transform: `${shape.a.transform || ""} translate(-8 -4) scale(1.08)`.trim() }
  })));

  /* La paume du bras arrière repose SUR la ceinture. Le bras reste derrière
     le torse, mais cette dernière petite forme doit passer au premier plan. */
  if (hand === "sword" || hand === "staff") {
    S.push(p("M66,176 C68,172 73,171 77,174 L79,187 C76,190 70,190 67,186 C65,183 64,179 66,176 Z", T.dark));
    S.push(p("M74,174 L84,174 C87,174 87,178 84,179 L75,179 Z", T.dark, { sw: 1.1 }));
    S.push(p("M75,179 L85,179 C88,179 88,183 85,184 L75,184 Z", T.dark, { sw: 1.1 }));
    S.push(p("M75,184 L83,184 C86,184 86,188 83,189 L75,189 Z", T.dark, { sw: 1.1 }));
    S.push(fold("M76,179 L84,179", T.line, 0.85, 0.55));
    S.push(fold("M76,184 L84,184", T.line, 0.85, 0.48));
  }

  /* --- bras avant : main libre repliée vers la ceinture, bras porteur plus
         vertical. Cette différence de pose rend l'équipement lisible. */
  const gripping = hand !== "none" && hand !== "shield";
  if (gripping) {
    S.push(p("M132,108 C144,109 152,116 156,127 C160,138 158,151 156,162 L154,178 C152,185 143,188 137,181 C135,174 136,164 136,154 L134,135 C133,127 130,118 132,108 Z", sleeve));
    S.push(fold("M147,119 C153,131 153,146 150,161", C.line, 1.25, 0.4));
    S.push(p("M136,176 C141,178 149,178 155,175 L155,191 C150,194 143,195 137,192 Z", LEATHER.base));
    S.push(fold("M140,184 C144,186 150,185 153,183", LEATHER.lite, 1.3, 0.55));
  } else {
    S.push(p("M132,108 C144,109 153,117 156,129 C159,140 155,151 148,160 L134,177 L121,164 C127,157 134,150 138,143 C141,136 138,127 133,121 Z", sleeve));
    S.push(fold("M148,121 C153,133 151,145 144,154", C.line, 1.25, 0.42));
    S.push(p("M120,160 L136,173 L129,185 L113,172 Z", LEATHER.base));
    S.push(fold("M119,167 L130,177", LEATHER.lite, 1.3, 0.55));
  }

  if (hand === "staff") {
    S.push(p("M145,88 L153,88 L155,362 L147,362 Z", WOOD.base));
    S.push(fold("M148,110 C148,190 150,280 150,352", WOOD.line, 1.3, 0.55));
    S.push(p("M143,120 L154,120 L154,132 L143,132 Z", LEATHER.dark));
    S.push(p("M136,74 C136,60 158,60 158,74 C158,86 148,92 147,92 C146,92 136,86 136,74 Z", GOLD.dark));
    S.push(c(147, 72, 12, "#7FC7D9"));
    S.push(c(143, 68, 4, "#DCF3F8", { noStroke: true }));
  }

  if (gripping && hand !== "sword" && hand !== "staff") {
    S.push(c(147, 204, 10, T.base));
    S.push(fold("M140,201 C144,198 150,198 154,201", T.line, 1.3, 0.55));
  }

  if (hand === "sword") {
    S.push(p("M141,222 L149,222 L149,194 L141,194 Z", LEATHER.dark));
    S.push(c(145, 227, 6, GOLD.base));
    S.push(p("M128,189 C136,186 154,186 162,189 L162,197 C154,194 136,194 128,197 Z", GOLD.base));
    S.push(p("M138,188 L152,188 L150,112 L145,97 L140,112 Z", STEEL.base));
    S.push(fold("M145,184 L145,116", STEEL.dark, 2.2, 0.55));
    S.push(fold("M141.5,184 L143,118", STEEL.lite, 1.8, 0.85));
  } else if (hand === "lantern") {
    S.push(p("M144,182 L150,182 L152,242 L142,242 Z", STEEL.dark));
    S.push(c(147, 212, 11, "#FFD54F"));
    S.push(c(147, 212, 5.5, "#FFF9C4", { noStroke: true }));
    S.push(p("M139,200 L155,200 L153,224 L141,224 Z", "none", { sw: 1.5, stroke: GOLD.base }));
    S.push(p("M147,176 C142,176 140,184 147,186", "none", { sw: 2, stroke: GOLD.dark }));
  } else if (hand === "grimoire") {
    S.push(p("M136,170 L162,180 L154,236 L128,224 Z", LEATHER.base));
    S.push(p("M138,172 L160,181 L153,233 L131,223 Z", "#EDE4D0"));
    S.push(p("M132,176 L158,186 L150,238 L124,228 Z", LEATHER.dark));
    S.push(c(144, 206, 5, GOLD.base));
    S.push(p("M144,212 L144,242", "#8E3230", { sw: 2 }));
  } else if (hand === "daggers") {
    S.push(p("M138,188 L146,188 L142,126 Z", STEEL.base));
    S.push(p("M134,188 L150,188", GOLD.dark, { sw: 2 }));
    S.push(p("M140,188 L144,210", LEATHER.dark, { sw: 2.4 }));
    S.push(p("M148,194 L154,194 L158,150 Z", STEEL.base));
  } else if (hand === "scepter") {
    S.push(p("M144,70 L150,70 L153,350 L147,350 Z", GOLD.base));
    S.push(c(147, 62, 12, "#7FC7D9"));
    S.push(c(147, 62, 5, "#FFFFFF", { noStroke: true }));
    S.push(e(147, 62, 16, 6, "none", { sw: 1.8, stroke: GOLD.lite }));
  } else if (hand === "relic") {
    S.push(p("M132,180 L160,180 L146,155 Z", GOLD.base));
    S.push(p("M132,180 L160,180 L146,205 Z", GOLD.dark));
    S.push(c(146, 180, 6, "#7FC7D9"));
    S.push(c(146, 180, 2.5, "#FFFFFF", { noStroke: true }));
  } else if (hand === "bespoke") {
    S.push(p("M134,178 L158,178 L146,152 Z", GOLD.base));
    S.push(p("M134,178 L158,178 L146,204 Z", GOLD.dark));
    S.push(c(146, 178, 6.5, "#FF5A5F"));
    S.push(c(146, 178, 2.5, "#FFF6E6", { noStroke: true }));
  }

  if (hand === "sword") {
    S.push(p("M137,194 C139,191 143,190 147,192 L149,209 C147,213 141,214 138,210 C136,206 135,198 137,194 Z", T.base));
    S.push(p("M145,194 L153,194 C156,194 156,198 153,199 L146,199 Z", T.base, { sw: 1.25 }));
    S.push(p("M146,199 L154,199 C157,199 157,203 154,204 L146,204 Z", T.base, { sw: 1.25 }));
    S.push(p("M146,204 L153,204 C156,204 156,208 153,209 L146,209 Z", T.base, { sw: 1.25 }));
    S.push(fold("M147,199 L152,199", T.line, 0.9, 0.55));
    S.push(fold("M147,204 L153,204", T.line, 0.9, 0.5));
    S.push(p("M138,195 C134,196 132,200 134,203 C136,205 139,204 141,202 Z", T.dark, { sw: 1.3 }));
  } else if (hand === "staff") {
    S.push(p("M138,193 C140,190 145,190 148,192 L150,210 C147,214 141,214 138,210 C136,206 135,197 138,193 Z", T.base));
    S.push(p("M146,193 L154,193 C158,193 158,197 155,198 L146,198 Z", T.base, { sw: 1.25 }));
    S.push(p("M146,198 L155,198 C158,198 158,202 155,203 L146,203 Z", T.base, { sw: 1.25 }));
    S.push(p("M146,203 L155,203 C158,203 158,207 155,208 L146,208 Z", T.base, { sw: 1.25 }));
    S.push(p("M146,208 L153,208 C156,208 156,212 153,213 L146,213 Z", T.base, { sw: 1.25 }));
    S.push(fold("M147,198 L154,198", T.line, 0.9, 0.55));
    S.push(fold("M147,203 L154,203", T.line, 0.9, 0.5));
    S.push(fold("M147,208 L153,208", T.line, 0.9, 0.44));
    S.push(p("M138,194 C134,195 132,199 134,202 C136,204 139,203 141,201 Z", T.dark, { sw: 1.3 }));
  } else {
    S.push(p("M114,169 C118,167 123,169 127,173 L132,178 C135,181 135,185 132,188 C129,191 124,190 121,187 L116,183 C112,181 109,177 110,174 C110,172 112,170 114,169 Z", T.base));
    S.push(fold("M119,174 C122,177 126,180 130,181", T.line, 1, 0.58));
    S.push(fold("M116,178 C120,181 124,184 128,185", T.line, 0.95, 0.5));
    S.push(p("M113,170 C109,169 106,172 107,175 C108,178 112,178 115,176 Z", T.dark, { sw: 1.3 }));
  }

  return S;
}

/* ---------- coiffures ----------
   Les cheveux se posent SUR le crâne : le volume déborde de l'ovale, la
   racine suit le front sans toucher le sourcil, et une raie donne la
   direction. Sous un couvre-chef on ne dessine QUE ce qui dépasse du bord,
   sinon la coiffe flotte sur une masse qu'elle devrait écraser.          */

function backHair(cut, girl) {
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
    const S = underHat(girl);
    if (cut === "boucle") {
      S.push(c(74, 46, 7, HAIR.base), c(126, 46, 7, HAIR.dark));
      S.push(c(77, 58, 5.5, HAIR.base), c(123, 58, 5.5, HAIR.dark));
    } else if (cut === "epis" && !girl) {
      S.push(p("M76,36 C68,34 63,38 62,43 C68,41 73,42 76,45 Z", HAIR.base));
      S.push(p("M124,36 C132,34 137,38 138,43 C132,41 127,42 124,45 Z", HAIR.dark));
    }
    return S;
  }

  const S = [];

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

  if (cut === "queue") {
    S.push(p("M78,58 C74,38 80,18 100,18 C120,18 126,38 122,58 C121,48 118,40 112,36 C105,32 95,32 88,36 C82,40 79,48 78,58 Z", HAIR.base));
    S.push(p("M96,16 C92,4 102,0 112,2 C124,5 132,16 128,30 C124,20 118,14 110,12 Z", HAIR.dark));
    S.push(c(106, 12, 3.5, GOLD.base));
    return S;
  }

  if (cut === "tresse") {
    S.push(p("M78,58 C74,38 82,18 100,18 C118,18 126,38 122,58 C120,48 116,40 110,36 C104,32 96,32 90,36 C84,40 80,48 78,58 Z", HAIR.base));
    S.push(p("M76,54 C72,66 74,80 78,92 C80,94 84,94 84,90 C80,80 78,66 82,54 Z", HAIR.base));
    S.push(p("M124,54 C128,66 126,80 122,92 C120,94 116,94 116,90 C120,80 122,66 118,54 Z", HAIR.dark));
    S.push(c(78, 86, 2, STEEL.lite));
    S.push(c(122, 86, 2, STEEL.lite));
    return S;
  }

  if (cut === "flottant") {
    S.push(p("M74,68 C68,48 70,22 86,14 C94,10 106,10 114,14 C130,22 132,48 126,68 C124,56 120,46 114,40 C108,34 92,34 86,40 C80,46 76,56 74,68 Z", HAIR.base));
    S.push(p("M68,54 C58,74 56,102 62,126 C66,130 72,128 72,122 C68,102 68,76 76,56 Z", HAIR.base));
    S.push(p("M132,54 C142,74 144,102 138,126 C134,130 128,128 128,122 C132,102 132,76 124,56 Z", HAIR.dark));
    return S;
  }

  if (cut === "couronne") {
    S.push(p("M76,56 C72,36 82,16 100,16 C118,16 128,36 124,56 C122,46 118,38 112,34 C104,30 96,30 88,34 C82,38 78,46 76,56 Z", HAIR.base));
    S.push(p("M78,28 C88,22 112,22 122,28", "none", { sw: 3.5, stroke: GOLD.base }));
    S.push(c(100, 24, 2.5, "#8E3230"));
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

  if (face === "cool") {
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
  } else if (face === "smirk") {
    S.push(...eye(92), ...eye(108));
    S.push(brow(92, -1), brow(108, 2));
    S.push(p("M96,69 Q103,67 107,72", "none", { sw: 2, stroke: T.line }));
  } else if (face === "evil") {
    S.push(p("M86,49 L98,54", "none", { sw: 3.4, stroke: INK }));
    S.push(p("M114,49 L102,54", "none", { sw: 3.4, stroke: INK }));
    S.push(p("M88,45 L98,50", "none", { sw: 2.2, stroke: HAIR.dark }));
    S.push(p("M112,45 L102,50", "none", { sw: 2.2, stroke: HAIR.dark }));
    S.push(c(94, 53, 1.8, "#FF2A2A", { noStroke: true }));
    S.push(c(106, 53, 1.8, "#FF2A2A", { noStroke: true }));
    S.push(p("M93,68 Q100,74 107,67", "none", { sw: 2.4, stroke: T.line }));
  } else if (face === "fierce") {
    S.push(p("M87,51.5 L97,53", "none", { sw: 3.4, stroke: INK }));
    S.push(p("M103,53 L113,51.5", "none", { sw: 3.4, stroke: INK }));
    S.push(brow(92, 3), brow(108, 3));
    S.push(p("M96,70 L104,70", "none", { sw: 2, stroke: T.line }));
  } else if (face === "star-eyes") {
    S.push(p("M92,49 L93.5,52 L96.5,52 L94,54 L95,57 L92,55 L89,57 L90,54 L87.5,52 L90.5,52 Z", "#FFD54F"));
    S.push(p("M108,49 L109.5,52 L112.5,52 L110,54 L111,57 L108,55 L105,57 L106,54 L103.5,52 L106.5,52 Z", "#FFD54F"));
    S.push(brow(92, 0), brow(108, 0));
    S.push(p("M95.5,69 Q100,73 104.5,69", "none", { sw: 2, stroke: T.line }));
  } else if (face === "transcendent") {
    S.push(c(92, 52, 3.5, "#E2BC70", { noStroke: true }));
    S.push(c(108, 52, 3.5, "#E2BC70", { noStroke: true }));
    S.push(c(92, 52, 1.5, "#FFFFFF", { noStroke: true }));
    S.push(c(108, 52, 1.5, "#FFFFFF", { noStroke: true }));
    S.push(c(100, 44, 2, "#7FC7D9", { noStroke: true }));
    S.push(brow(92, -1), brow(108, -1));
    S.push(p("M96,69 Q100,71 104,69", "none", { sw: 1.8, stroke: T.line }));
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
  } else if (face !== "smirk" && face !== "fierce" && face !== "star-eyes" && face !== "transcendent") {
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
    S.push(p("M76,52 C74,24 86,10 100,10 C114,10 126,24 124,52 C124,59 122,65 119,69 L112,58 C115,42 111,30 100,30 C89,30 85,42 88,58 L81,69 C78,65 76,59 76,52 Z", CLOAK.base));
    S.push(fold("M84,54 C82,36 89,26 100,24 C111,26 118,36 116,54", CLOAK.line, 1.5, 0.6));
    S.push(ao("M86,50 C86,34 92,26 100,24 C108,26 114,34 114,50 L110,50 C110,38 106,31 100,29 C94,31 90,38 90,50 Z", 0.18));
  } else if (head === "helm") {
    S.push(p("M77,38 C77,16 88,8 100,8 C112,8 123,16 123,38 Z", STEEL.base));
    S.push(p("M75,33 L125,33 L125,43 L75,43 Z", STEEL.dark));
    S.push(p("M96.5,41 L103.5,41 L103.5,62 C103.5,64.5 96.5,64.5 96.5,62 Z", STEEL.base));
    S.push(fold("M84,32 C83,20 89,13 95,10", STEEL.lite, 2.6, 0.8));
    S.push(c(83, 38, 2, GOLD.base, { sw: 1 }));
    S.push(c(117, 38, 2, GOLD.base, { sw: 1 }));
  } else if (head === "goggles") {
    S.push(p("M74,29 C87,25 113,25 126,29", "none", { sw: 4.2, stroke: LEATHER.dark }));
    S.push(c(89, 29, 9.5, GOLD.dark, { sw: 1.8 }));
    S.push(c(111, 29, 9.5, GOLD.dark, { sw: 1.8 }));
    S.push(c(89, 29, 6.2, "#80C8D8", { sw: 1.2 }));
    S.push(c(111, 29, 6.2, "#80C8D8", { sw: 1.2 }));
    S.push(p("M84,26 C86,23 89,22 92,23", "none", { sw: 1.8, stroke: "#DDF5F8" }));
    S.push(p("M106,26 C108,23 111,22 114,23", "none", { sw: 1.8, stroke: "#DDF5F8" }));
  } else if (head === "sunglasses") {
    S.push(p("M76,46 L124,46", "none", { sw: 2.4, stroke: "#111111" }));
    S.push(p("M83,44 L98,44 L97,57 C97,60 84,60 84,57 Z", "#161616", { stroke: "#000000", sw: 1.5 }));
    S.push(p("M102,44 L117,44 L116,57 C116,60 103,60 103,57 Z", "#161616", { stroke: "#000000", sw: 1.5 }));
    S.push(fold("M86,46 L95,54", "#FFFFFF", 1.2, 0.45));
    S.push(fold("M105,46 L114,54", "#FFFFFF", 1.2, 0.45));
  } else if (head === "beret") {
    S.push(p("M70,36 C70,22 90,14 116,18 C128,20 134,28 130,36 C124,40 76,40 70,36 Z", CLOTHS.sinople.base));
    S.push(p("M76,37 C88,41 116,41 126,37", "none", { sw: 2.2, stroke: LEATHER.dark }));
    S.push(p("M118,22 C126,10 138,4 144,2 C140,8 134,18 126,24 Z", "#DC5040"));
    S.push(fold("M82,28 C94,22 110,22 122,26", CLOTHS.sinople.lite, 1.4, 0.5));
  } else if (head === "wizard") {
    S.push(p("M54,34 C74,25 126,25 146,34 C126,43 74,43 54,34 Z", CLOAK.dark));
    S.push(p("M80,32 C82,16 92,2 104,0 C106,12 103,24 117,32 Z", CLOAK.base));
    S.push(p("M79,26 C88,31 112,31 121,26 L121,34 C112,39 88,39 79,34 Z", GOLD.dark));
    S.push(p("M100,26 L104,31 L100,36 L96,31 Z", "#7FC7D9"));
    S.push(fold("M86,28 C88,18 93,8 100,3", CLOAK.lite, 2, 0.45));
  } else if (head === "circlet") {
    S.push(p("M76,36 C86,41 114,41 124,36", "none", { sw: 3.2, stroke: STEEL.base }));
    S.push(p("M94,36 L100,26 L106,36 Z", GOLD.base));
    S.push(c(100, 32, 2.2, "#7FC7D9"));
    S.push(p("M75,37 C70,30 68,20 72,14 C75,22 78,30 81,36 Z", STEEL.lite));
    S.push(p("M125,37 C130,30 132,20 128,14 C125,22 122,30 119,36 Z", STEEL.lite));
  } else if (head === "starcowl") {
    S.push(p("M74,52 C72,22 86,8 100,8 C114,8 128,22 126,52 C125,60 122,66 118,70 L112,58 C115,40 111,26 100,26 C89,26 85,40 88,58 L82,70 C78,66 75,60 74,52 Z", CLOTHS.pourpre.dark));
    S.push(c(94, 20, 1.8, "#FFE58A"));
    S.push(c(106, 16, 2.2, "#7FC7D9"));
    S.push(c(102, 24, 1.5, "#FFE58A"));
    S.push(fold("M83,54 C81,34 88,22 100,20 C112,22 119,34 117,54", GOLD.base, 1.4, 0.6));
  } else if (head === "crown") {
    S.push(p("M78,34 L78,14 L89,24 L100,7 L111,24 L122,14 L122,34 Z", GOLD.base));
    S.push(p("M78,29 C87,35 113,35 122,29 L122,38 C113,44 87,44 78,38 Z", GOLD.dark));
    S.push(c(89, 22, 2.6, "#8E3230", { sw: 1.1 }));
    S.push(c(100, 14, 3, "#7FC7D9", { sw: 1.1 }));
    S.push(c(111, 22, 2.6, "#2F5C43", { sw: 1.1 }));
    S.push(fold("M83,35 C90,39 98,40 104,40", GOLD.lite, 1.6, 0.7));
  } else if (head === "celestial") {
    S.push(p("M74,34 L72,8 L86,22 L100,2 L114,22 L128,8 L126,34 Z", GOLD.base));
    S.push(p("M74,30 C86,36 114,36 126,30 L126,38 C114,44 86,44 74,38 Z", GOLD.dark));
    S.push(c(86, 18, 3, "#8E3230"));
    S.push(c(100, 10, 3.8, "#7FC7D9"));
    S.push(c(114, 18, 3, "#2F5C43"));
    S.push(fold("M80,33 C90,38 110,38 120,33", "#FFFFFF", 1.8, 0.8));
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
  sunglasses: "70 30 60 45",
  face: "76 30 48 52",
  evil: "76 30 48 52",
  hair: "60 2 80 80",
  weapon: "116 50 72 200",
  bespoke: "40 40 120 120",
  "pencil-sword": "116 86 62 156",
  "word-wand": "126 50 48 168",
  "star-shield": "8 128 84 116",
  "lore-lantern": "118 160 60 100",
  "spell-grimoire": "116 160 64 90",
  "dual-daggers": "124 110 54 110",
  "astral-scepter": "120 40 60 180",
  "wisdom-relic": "116 130 64 90",
  "custom-bespoke": "40 40 120 120",
  short: "68 4 64 84",
  long: "60 2 80 144",
  curly: "60 0 80 88",
  spiky: "62 0 76 90",
  ponytail: "60 2 80 80",
  braided: "60 2 80 100",
  flowing: "58 2 84 140",
  "celestial-hair": "58 2 84 90"
};

export function renderItemArt(item) {
  if (item.type === "bespoke" || item.id === "custom-bespoke") {
    return `<svg class="avatar item-art bespoke-art" viewBox="0 0 100 100" role="img" aria-label="${item.name}">
      <defs>
        <radialGradient id="bespoke-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFE082" stop-opacity="0.95"/>
          <stop offset="60%" stop-color="#FFB300" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#FF8F00" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#bespoke-glow)"/>
      <circle cx="50" cy="50" r="34" fill="#241D15" stroke="#C0913E" stroke-width="2.5"/>
      <polygon points="50,22 58,38 76,42 63,55 66,73 50,64 34,73 37,55 24,42 42,38" fill="#E2BC70" stroke="#8F692A" stroke-width="1.5"/>
      <circle cx="50" cy="50" r="9" fill="#8E3230" stroke="#E2BC70" stroke-width="1.2"/>
      <circle cx="50" cy="50" r="3.5" fill="#FFF6E6"/>
    </svg>`;
  }

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
