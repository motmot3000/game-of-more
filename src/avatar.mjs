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

export const INK = "#2A2119";

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
  lin:      { base: "#A8865A", dark: "#846741", lite: "#C4A377", line: "#4E3A22" },
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

/* Traduction du modèle de données de l'app vers la garde-robe.
   Chaque tenue n'est qu'un jeu d'options : la silhouette ne change jamais,
   seule la quantité d'équipement monte. */
const OUTFITS = {
  starter:        { cloth: "lin",     cape: false,   mail: false, emblem: false, greaves: false, pathfinder: true },
  "vocab-ranger": { cloth: "sinople",  mantle: true,  mail: false, emblem: false, greaves: false },
  "grammar-mage": { cloth: "pourpre",  cape: true,    mail: false, emblem: true,  greaves: false },
  "story-keeper": { cloth: "ecarlate", cape: true,    mail: true,  emblem: true,  greaves: true  }
};
const HEADGEAR = { "no-hat": "none", "explorer-cap": "goggles", "wizard-hat": "wizard", "gold-crown": "crown" };
const HANDGEAR = { "no-weapon": "none", "pencil-sword": "sword", "word-wand": "staff", "star-shield": "shield" };
const HAIRCUTS = { short: "court", long: "longue", curly: "boucle", spiky: "epis" };

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
  const sc = s.stroke || INK;
  return `<${s.tag} ${attrs(s.a)} fill="${s.fill}" stroke="${sc}" stroke-width="${s.sw || stroke}" stroke-linejoin="round" stroke-linecap="round"/>`;
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

  /* --- bras arrière, légèrement plié : la main près de la hanche donne une
         attitude sûre sans transformer le héros en adulte martial. */
  S.push(p("M67,108 C56,111 48,119 44,132 L52,157 L66,149 L72,121 Z", sleeve));
  S.push(p("M48,150 L64,144 L70,158 L54,165 Z", LEATHER.dark));
  S.push(fold("M52,153 L63,149", LEATHER.line, 1.4, 0.55));
  S.push(p("M55,162 C60,160 66,164 70,170 L76,178 C78,182 75,187 70,188 C66,189 63,185 62,181 L56,174 C52,170 51,165 55,162 Z", T.dark));

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
    a: { ...shape.a, transform: `${shape.a.transform || ""} translate(-16 -9) scale(1.16)`.trim() }
  })));

  /* --- bras avant, détaché du torse : il porte l'objet au lieu de pendre. */
  S.push(p("M133,109 C145,112 154,121 157,135 L153,183 C152,192 143,195 137,188 L135,137 Z", sleeve));
  S.push(p("M136,178 L154,178 L154,193 L137,194 Z", LEATHER.base));
  S.push(fold("M140,185 L151,184", LEATHER.line, 1.3, 0.55));

  if (hand === "staff") {
    S.push(p("M143,88 L152,88 L156,362 L147,362 Z", WOOD.base));
    S.push(fold("M146,110 C147,190 149,280 150,352", WOOD.line, 1.4, 0.5));
    S.push(p("M142,120 L153,120 L153,132 L142,132 Z", LEATHER.dark));
    S.push(p("M136,74 C136,60 158,60 158,74 C158,86 148,92 147,92 C146,92 136,86 136,74 Z", GOLD.dark));
    S.push(c(147, 72, 12, "#7FC7D9"));
    S.push(c(143, 68, 4, "#DCF3F8", { noStroke: true }));
  }

  S.push(c(147, 204, 11, T.base));
  S.push(fold("M140,201 C144,198 150,198 154,201", T.line, 1.4, 0.55));

  if (hand === "sword") {
    S.push(p("M141,222 L149,222 L149,194 L141,194 Z", LEATHER.dark));
    S.push(c(145, 227, 6, GOLD.base));
    S.push(p("M128,189 C136,186 154,186 162,189 L162,197 C154,194 136,194 128,197 Z", GOLD.base));
    S.push(p("M138,188 L152,188 L150,112 L145,97 L140,112 Z", STEEL.base));
    S.push(fold("M145,184 L145,116", STEEL.dark, 2.2, 0.55));
    S.push(fold("M141.5,184 L143,118", STEEL.lite, 1.8, 0.85));
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
  const brow = (x, dir) => p(`M${x - 5.5},44.5 Q${x},${41.8 + dir} ${x + 5.5},44.5`, "none", { sw: 2, stroke: HAIR.dark });
  const eye = (x) => [
    e(x, 52, 3.45, 4.15, INK, { noStroke: true }),
    c(x + 1.25, 50.3, 1.35, "#FFFFFF", { noStroke: true })
  ];
  const lashes = girl
    ? [p("M86,48.5 L83.5,46.3", "none", { sw: 1.45, stroke: INK }),
       p("M114,48.5 L116.5,46.3", "none", { sw: 1.45, stroke: INK })]
    : [];

  if (face === "cool") {
    /* Regard déterminé + cicatrice : l'équivalent aventurier du « cool ». */
    S.push(p("M86.5,52 L97.5,52", "none", { sw: 3.6, stroke: INK }));
    S.push(p("M102.5,52 L113.5,52", "none", { sw: 3.6, stroke: INK }));
    S.push(brow(92, -2), brow(108, -2));
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
  } else if (head === "wizard") {
    S.push(p("M54,34 C74,25 126,25 146,34 C126,43 74,43 54,34 Z", CLOAK.dark));
    S.push(p("M80,32 C82,16 92,2 104,0 C106,12 103,24 117,32 Z", CLOAK.base));
    S.push(p("M79,26 C88,31 112,31 121,26 L121,34 C112,39 88,39 79,34 Z", GOLD.dark));
    S.push(p("M100,26 L104,31 L100,36 L96,31 Z", "#7FC7D9"));
    S.push(fold("M86,28 C88,18 93,8 100,3", CLOAK.lite, 2, 0.45));
  } else if (head === "crown") {
    S.push(p("M78,34 L78,14 L89,24 L100,7 L111,24 L122,14 L122,34 Z", GOLD.base));
    S.push(p("M78,29 C87,35 113,35 122,29 L122,38 C113,44 87,44 78,38 Z", GOLD.dark));
    S.push(c(89, 22, 2.6, "#8E3230", { sw: 1.1 }));
    S.push(c(100, 14, 3, "#7FC7D9", { sw: 1.1 }));
    S.push(c(111, 22, 2.6, "#2F5C43", { sw: 1.1 }));
    S.push(fold("M83,35 C90,39 98,40 104,40", GOLD.lite, 1.6, 0.7));
  }
  return S;
}

/* ---------- rendu ---------- */

function renderFigure(opt) {
  const S = heroShapes(opt);
  const stroke = opt.stroke ?? 2.2;
  const id = opt.id;

  /* La maille est une trame, pas un aplat : c'est ce détail qui fait
     basculer la lecture de « vecteur plat » à « armure ». */
  const defs = `<defs><pattern id="mail-${id}" width="6" height="6" patternUnits="userSpaceOnUse">
      <rect width="6" height="6" fill="${MAIL.base}"/>
      <circle cx="1.5" cy="1.5" r="1.6" fill="none" stroke="${MAIL.dark}" stroke-width="1"/>
      <circle cx="4.5" cy="4.5" r="1.6" fill="none" stroke="${MAIL.dark}" stroke-width="1"/>
      <circle cx="4.5" cy="1.5" r="1.6" fill="none" stroke="${MAIL.lite}" stroke-width="0.7"/>
      <circle cx="1.5" cy="4.5" r="1.6" fill="none" stroke="${MAIL.lite}" stroke-width="0.7"/>
    </pattern></defs>`;

  const body = S.map((s) => draw(s, stroke)).join("");

  const shading = `
    <clipPath id="clip-${id}">${S.filter((s) => s.fill !== "none").map(clipGeom).join("")}</clipPath>
    <g clip-path="url(#clip-${id})">
      <path d="M112,0 L200,0 L200,390 L94,390 Z" fill="#160F0B" opacity="0.20"/>
      <path d="M0,0 L58,0 L44,390 L0,390 Z" fill="#FFF6E6" opacity="0.20"/>
      <rect x="0" y="262" width="200" height="128" fill="#160F0B" opacity="0.13"/>
    </g>`;

  const ground = opt.ground === false ? ""
    : `<ellipse cx="100" cy="348" rx="58" ry="8" fill="${INK}" opacity="0.18"/>`;

  const mirrored = opt.mirror ? "translate(200 0) scale(-1 1)" : "";
  const figure = `<g transform="${mirrored}"><g transform="translate(-8 8) scale(1.08 0.91)">${body}${shading}</g></g>`;

  return `<svg class="${opt.cls || "avatar"}" viewBox="${opt.viewBox || "0 0 200 360"}" role="img" aria-label="${opt.alt || "hero"}">
    ${defs}${ground}${figure}
  </svg>`;
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
    cls: `avatar ${pupil.skin === "grammar-mage" ? "magic" : ""}`
  });
}

/* L'aperçu boutique est la MÊME figure, simplement recadrée sur la pièce.
   Aucune géométrie dupliquée : ce qu'on achète est ce qu'on portera. */
const ITEM_CROPS = {
  outfit: "44 84 112 214",
  hat: "58 0 84 76",
  face: "76 30 48 52",
  "pencil-sword": "116 86 62 156",
  "word-wand": "126 50 48 168",
  "star-shield": "8 128 84 116",
  short: "68 6 64 64",
  long: "60 6 80 152",
  curly: "60 2 80 64",
  spiky: "62 0 76 68"
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
