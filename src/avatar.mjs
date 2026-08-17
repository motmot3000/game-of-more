/* ============================================================
   Game of More — hero system
   Clean, friendly SVG people: simple rounded shapes, soft warm
   outlines, human proportions, and a strict layering order so
   hair, hats, outfits and items always sit well together.
   ============================================================ */

const OUTLINE = "#3a2e50"; // soft dark outline (not harsh black)

const OUTFITS = {
  starter: {
    base: "#5f83a6", dark: "#3f5d78", light: "#9db6cd",
    accent: "#e8b64d", accentDark: "#b9852e", trim: "#2f4757", badge: "S"
  },
  "vocab-ranger": {
    base: "#8a9a6b", dark: "#61704a", light: "#b9c69b",
    accent: "#e8b64d", accentDark: "#b9852e", trim: "#3f4a2c", badge: "R"
  },
  "grammar-mage": {
    base: "#8a76a0", dark: "#5d4c73", light: "#bcabc9",
    accent: "#d9a1a8", accentDark: "#a87a82", trim: "#453856", badge: "M"
  },
  "story-keeper": {
    base: "#c2744a", dark: "#96502f", light: "#e0a983",
    accent: "#6f92ad", accentDark: "#4c6886", trim: "#5f3623", badge: "K"
  }
};

const SKIN_TONES = {
  light: { base: "#ffd7b0", dark: "#e7b78c", shade: "#eec09a" },
  medium: { base: "#f2c193", dark: "#d9a674", shade: "#dfae7c" },
  tan: { base: "#d9a06b", dark: "#bf8552", shade: "#c78f5a" },
  brown: { base: "#b07a4f", dark: "#94623a", shade: "#9f6a42" },
  dark: { base: "#7d4f33", dark: "#653c24", shade: "#6f442c" }
};

const HAIR_COLOR = { base: "#5f402e", dark: "#422c1e", light: "#7d5a42" };

const BOOT = "#4a3320";
const BOOT_DARK = "#2e1f12";

/* ---------- Public API ---------- */

export function renderHero(pupil) {
  const outfit = OUTFITS[pupil.skin] || OUTFITS.starter;
  const tone = SKIN_TONES[pupil.skinTone] || SKIN_TONES.light;
  const girl = pupil.gender === "girl";
  const hasHat = Boolean(pupil.hat && pupil.hat !== "no-hat");

  return `
    <svg class="avatar ${pupil.skin === "grammar-mage" ? "magic" : ""}" viewBox="0 0 180 210" role="img" aria-label="hero avatar" shape-rendering="crispEdges">
      <ellipse cx="90" cy="193" rx="50" ry="9" fill="#0a0618" opacity=".28"/>
      ${renderCape(pupil.skin, outfit)}
      ${renderBackWeapon(pupil.weapon, outfit)}
      ${renderLegs(outfit)}
      ${renderNeck(tone)}
      ${renderTorso(pupil.skin, outfit)}
      ${renderArms(pupil.skinTone, outfit)}
      ${renderHead(tone)}
      ${renderHair(pupil.hair, hasHat)}
      ${renderFace(pupil.face, girl)}
      ${renderHat(pupil.hat, outfit)}
      ${renderFrontWeapon(pupil.weapon, outfit)}
    </svg>
  `;
}

export function renderItemArt(item) {
  const outfit = OUTFITS[item.id] || OUTFITS.starter;
  let inner = "";
  let viewBox = "0 0 80 80";

  switch (item.type) {
    case "outfit":
      inner = renderTorso(item.id, outfit);
      viewBox = "56 78 68 58";
      break;
    case "hat":
      inner = renderHat(item.id, outfit);
      viewBox = "36 0 108 64";
      break;
    case "weapon":
      inner = renderBackWeapon(item.id, outfit) + renderFrontWeapon(item.id, outfit);
      viewBox = weaponViewBox(item.id);
      break;
    case "face":
      inner = `${renderHead(SKIN_TONES.light)}${renderFace(item.id, false)}`;
      viewBox = "62 32 56 40";
      break;
    case "hair":
      inner = `${renderHead(SKIN_TONES.light)}${renderHair(item.id, false)}`;
      viewBox = hairViewBox(item.id);
      break;
    default:
      break;
  }

  if (!inner.trim()) {
    return `<svg class="avatar item-art none" viewBox="0 0 80 80" role="img" aria-label="${item.name}" shape-rendering="crispEdges"><line x1="26" y1="40" x2="54" y2="40" stroke="#96857a" stroke-width="6" stroke-linecap="round"/></svg>`;
  }

  return `<svg class="avatar item-art" viewBox="${viewBox}" role="img" aria-label="${item.name}" shape-rendering="crispEdges">${inner}</svg>`;
}

/* Brand emblem + icons (inline SVG, reused across the UI) */

export function renderEmblem() {
  return `
    <svg class="brand-emblem" viewBox="0 0 64 64" role="img" aria-label="Game of More" shape-rendering="crispEdges">
      <path d="M32 2 L58 12 V34 C58 49 47 59 32 62 C17 59 6 49 6 34 V12 Z" fill="#7a4a12" stroke="#3a2508" stroke-width="3" stroke-linejoin="round"/>
      <path d="M32 6 L54 15 V34 C54 46 45 55 32 58 C19 55 10 46 10 34 V15 Z" fill="#ffd84d"/>
      <path d="M32 6 L44 14 V34 C44 42 39 48 32 51 C25 48 20 42 20 34 V14 Z" fill="#ffe88a"/>
      <path d="M32 16 L37 27 L49 27 L40 33 L44 44 L32 37 L20 44 L24 33 L15 27 L27 27 Z" fill="#ff8b1a" stroke="#7a4a12" stroke-width="2" stroke-linejoin="round"/>
      <rect x="26" y="29" width="4" height="5" fill="#3a2508"/>
      <rect x="34" y="29" width="4" height="5" fill="#3a2508"/>
      <rect x="29" y="36" width="6" height="3" rx="1" fill="#3a2508"/>
    </svg>
  `;
}

export function renderCoinIcon() {
  return `
    <svg class="coin" viewBox="0 0 20 20" role="img" aria-hidden="true" shape-rendering="crispEdges">
      <circle cx="10" cy="10" r="9" fill="#ffd84d" stroke="#7a4a12" stroke-width="2"/>
      <circle cx="10" cy="10" r="6" fill="none" stroke="#d99a14" stroke-width="1.5"/>
      <path d="M10 6 L11 9 L14 9 L11.5 11 L12.5 14 L10 12 L7.5 14 L8.5 11 L6 9 L9 9 Z" fill="#ff8b1a"/>
    </svg>
  `;
}

export function renderHeartIcon(filled) {
  const fill = filled ? "#ff5c7a" : "rgba(255,255,255,0.08)";
  const stroke = filled ? "#ff9ab0" : "#5b5385";
  return `
    <svg class="hp-heart ${filled ? "" : "empty"}" viewBox="0 0 20 19" role="img" aria-hidden="true" shape-rendering="crispEdges">
      <path d="M10 17.5 C3.5 12.5 1 9 1 5.5 C1 2.8 3.2 1 5.5 1 C7.4 1 9 2.6 10 4.2 C11 2.6 12.6 1 14.5 1 C16.8 1 19 2.8 19 5.5 C19 9 16.5 12.5 10 17.5 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.8" stroke-linejoin="round"/>
      ${filled ? `<rect x="5" y="5.5" width="3" height="3" rx="1" fill="#ffd6de"/>` : ""}
    </svg>
  `;
}

/* A friendly mascot (matches the hero style). */
export function renderMascot() {
  const o = OUTFITS.starter;
  const tone = SKIN_TONES.light;
  return `
    <svg class="mascot" viewBox="0 0 200 210" role="img" aria-label="hero mascot" shape-rendering="crispEdges">
      <ellipse cx="100" cy="194" rx="60" ry="10" fill="#0a0618" opacity=".3"/>
      ${sparkle(42, 60)}
      ${sparkle(162, 46)}
      <rect x="82" y="126" width="16" height="34" rx="7" fill="${o.dark}" stroke="${OUTLINE}" stroke-width="4"/>
      <rect x="102" y="126" width="16" height="34" rx="7" fill="${o.dark}" stroke="${OUTLINE}" stroke-width="4"/>
      <rect x="76" y="156" width="28" height="14" rx="7" fill="${BOOT}" stroke="${OUTLINE}" stroke-width="4"/>
      <rect x="96" y="156" width="28" height="14" rx="7" fill="${BOOT}" stroke="${OUTLINE}" stroke-width="4"/>
      <rect x="76" y="166" width="28" height="4" rx="2" fill="${BOOT_DARK}"/>
      <rect x="96" y="166" width="28" height="4" rx="2" fill="${BOOT_DARK}"/>
      <rect x="92" y="71" width="16" height="20" rx="6" fill="${tone.shade}" stroke="${OUTLINE}" stroke-width="3"/>
      <path d="M66 88 L134 88 L125 128 L75 128 Z" fill="${o.base}" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M70 92 L130 92 L124 106 L76 106 Z" fill="#ffffff" opacity=".09"/>
      <path d="M75 118 L125 118 L124 128 L76 128 Z" fill="${o.trim}" stroke="${OUTLINE}" stroke-width="3"/>
      <rect x="95" y="117" width="10" height="11" rx="2" fill="${o.accent}"/>
      <g transform="rotate(-150 64 92)">
        <rect x="56" y="86" width="16" height="38" rx="8" fill="${o.base}" stroke="${OUTLINE}" stroke-width="4"/>
        <circle cx="64" cy="136" r="9" fill="${tone.base}" stroke="${OUTLINE}" stroke-width="3"/>
      </g>
      <rect x="128" y="88" width="15" height="38" rx="7" fill="${o.dark}" stroke="${OUTLINE}" stroke-width="4"/>
      <circle cx="136" cy="134" r="8" fill="${tone.base}" stroke="${OUTLINE}" stroke-width="3"/>
      <ellipse cx="100" cy="48" rx="29" ry="29" fill="${tone.base}" stroke="${OUTLINE}" stroke-width="4"/>
      <path d="M72 44 L71 30 L77 20 L87 13 L100 10 L113 13 L123 20 L129 30 L128 44 L120 40 L110 36 L100 34 L90 36 L80 40 Z" fill="${HAIR_COLOR.base}" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M76 30 L82 19 L90 13 L100 11 L92 17 L84 24 L76 30 Z" fill="${HAIR_COLOR.light}" opacity=".75"/>
      ${faceEyes(90, 47)}
      ${faceEyes(110, 47)}
      <path d="M86 41 q4 -2.4 8 0" stroke="#5a4334" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M106 41 q4 -2.4 8 0" stroke="#5a4334" stroke-width="2" fill="none" stroke-linecap="round"/>
      <ellipse cx="86" cy="57" rx="5.5" ry="3.2" fill="#ff9db4" opacity=".45"/>
      <ellipse cx="114" cy="57" rx="5.5" ry="3.2" fill="#ff9db4" opacity=".45"/>
      <path d="M94 62 q6 4.5 12 0" stroke="#a34d5a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    </svg>
  `;
}

function sparkle(x, y) {
  return `<path d="M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2} Z" fill="#ffe88a" stroke="#d9a13e" stroke-width="1.5" stroke-linejoin="round"/>`;
}

/* ---------- Body pieces ---------- */

function renderCape(skinId, o) {
  if (skinId === "grammar-mage") {
    return `<path d="M70 90 L34 112 Q26 116 32 126 L46 138 L88 106 Z" fill="${o.dark}" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>`;
  }
  if (skinId === "story-keeper") {
    return `<path d="M70 90 L34 112 Q26 116 32 126 L46 138 L88 106 Z" fill="#4c6886" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>`;
  }
  return "";
}

function renderLegs(o) {
  return `
    <rect x="74" y="126" width="15" height="34" rx="7" fill="${o.dark}" stroke="${OUTLINE}" stroke-width="4"/>
    <rect x="91" y="126" width="15" height="34" rx="7" fill="${o.dark}" stroke="${OUTLINE}" stroke-width="4"/>
    <rect x="67" y="156" width="27" height="14" rx="7" fill="${BOOT}" stroke="${OUTLINE}" stroke-width="4"/>
    <rect x="86" y="156" width="27" height="14" rx="7" fill="${BOOT}" stroke="${OUTLINE}" stroke-width="4"/>
    <rect x="67" y="166" width="27" height="4" rx="2" fill="${BOOT_DARK}"/>
    <rect x="86" y="166" width="27" height="4" rx="2" fill="${BOOT_DARK}"/>
  `;
}

function renderArms(skinTone, o) {
  const tone = SKIN_TONES[skinTone] || SKIN_TONES.light;
  return `
    <rect x="57" y="88" width="15" height="38" rx="7" fill="${o.dark}" stroke="${OUTLINE}" stroke-width="4"/>
    <circle cx="64" cy="134" r="8" fill="${tone.base}" stroke="${OUTLINE}" stroke-width="3"/>
    <rect x="108" y="88" width="15" height="38" rx="7" fill="${o.base}" stroke="${OUTLINE}" stroke-width="4"/>
    <circle cx="116" cy="134" r="8" fill="${tone.base}" stroke="${OUTLINE}" stroke-width="3"/>
  `;
}

function renderNeck(tone) {
  return `<rect x="82" y="71" width="16" height="20" rx="6" fill="${tone.shade}" stroke="${OUTLINE}" stroke-width="3"/>`;
}

function renderHead(tone) {
  return `
    <ellipse cx="90" cy="48" rx="29" ry="29" fill="${tone.base}" stroke="${OUTLINE}" stroke-width="4"/>
    <ellipse cx="90" cy="66" rx="18" ry="7" fill="${tone.dark}" opacity=".16"/>
  `;
}

function renderTorso(id, o) {
  const body = `<path d="M66 88 L114 88 L105 128 L75 128 Z" fill="${o.base}" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>`;
  const sheen = `<path d="M70 92 L110 92 L104 106 L76 106 Z" fill="#ffffff" opacity=".09"/>`;
  const collar = `<path d="M82 86 L90 96 L98 86 Z" fill="${o.light}" opacity=".55"/>`;
  const crest = `<rect x="81" y="98" width="18" height="18" rx="4" fill="${o.accent}" stroke="${OUTLINE}" stroke-width="2.5"/><text x="90" y="112" text-anchor="middle" fill="#3a2508" font-size="12" font-weight="900" font-family="monospace">${o.badge}</text>`;
  const belt = `<path d="M75 118 L105 118 L104 128 L76 128 Z" fill="${o.trim}" stroke="${OUTLINE}" stroke-width="3"/><rect x="86" y="117" width="8" height="11" rx="2" fill="${o.accent}"/>`;
  return `${body}${sheen}${collar}${crest}${belt}`;
}

function renderFace(faceId, girl) {
  const lashes = girl
    ? `<path d="M74 44 v-4 M80 44 v-4 M100 44 v-4 M106 44 v-4" stroke="#5a4334" stroke-width="1.6" stroke-linecap="round"/>`
    : "";

  if (faceId === "cool") {
    return `${lashes}
      <rect x="72" y="43" width="20" height="11" rx="4" fill="#33263a"/>
      <rect x="88" y="43" width="20" height="11" rx="4" fill="#33263a"/>
      <rect x="86" y="47" width="8" height="3" fill="#33263a"/>
      <rect x="74" y="45" width="5" height="3" fill="#a9c4d8"/>
      <rect x="90" y="45" width="5" height="3" fill="#a9c4d8"/>
      ${faceBlush()}
      ${faceMouth()}`;
  }

  if (faceId === "wink") {
    return `${lashes}
      <path d="M76 47 q4 -2 8 0" stroke="#4a3526" stroke-width="2" fill="none" stroke-linecap="round"/>
      ${faceEyes(100, 47)}
      <path d="M100 41 q4 -2.4 8 0" stroke="#5a4334" stroke-width="2" fill="none" stroke-linecap="round"/>
      ${faceBlush()}
      ${faceMouth()}`;
  }

  if (faceId === "grin") {
    return `${lashes}
      ${faceEyes(80, 47)}${faceEyes(100, 47)}
      ${faceBrows(80)}${faceBrows(100)}
      ${faceBlush()}
      <path d="M82 60 q8 8 16 0 l0 3 q-8 7 -16 0 Z" fill="#a34d5a"/>
      <rect x="82" y="60" width="16" height="4" rx="2" fill="#ffffff"/>`;
  }

  return `${lashes}
    ${faceEyes(80, 47)}${faceEyes(100, 47)}
    ${faceBrows(80)}${faceBrows(100)}
    ${faceBlush()}
    ${faceMouth()}`;
}

function faceEyes(cx, cy) {
  return `
    <ellipse cx="${cx}" cy="${cy}" rx="3.6" ry="5" fill="#4a3526"/>
    <circle cx="${cx - 1.2}" cy="${cy - 1.8}" r="1.4" fill="#ffffff"/>
  `;
}

function faceBrows(cx) {
  return `<path d="M${cx - 4} 40 q4 -2.4 8 0" stroke="#5a4334" stroke-width="2" fill="none" stroke-linecap="round"/>`;
}

function faceBlush() {
  return `
    <ellipse cx="76" cy="57" rx="5.5" ry="3.2" fill="#ff9db4" opacity=".45"/>
    <ellipse cx="104" cy="57" rx="5.5" ry="3.2" fill="#ff9db4" opacity=".45"/>
  `;
}

function faceMouth() {
  return `<path d="M84 62 q6 4.5 12 0" stroke="#a34d5a" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
}

/* --- Hair: a tight cap hugging the head + one clean distinctive
       feature per style. When a hat is worn, the top feature is
       dropped so the hat always sits cleanly over the hair. --- */

function renderHair(hairId, underHat) {
  if (hairId === "long") return `${hairCap()}${hairShine()}${longLocks()}`;
  if (hairId === "curly") return underHat ? `${hairCap()}${hairShine()}` : `${hairCap()}${hairShine()}${hairCurls()}`;
  if (hairId === "spiky") return underHat ? `${hairCap()}${hairShine()}` : `${hairCap()}${hairShine()}${hairSpikes()}`;
  return `${hairCap()}${hairShine()}`;
}

function hairCap() {
  return `
    <path d="M62 44 L61 30 L67 20 L77 13 L90 10 L103 13 L113 20 L119 30 L118 44 L110 40 L100 36 L90 34 L80 36 L70 40 Z" fill="${HAIR_COLOR.base}" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
  `;
}

function hairShine() {
  return `<path d="M66 30 L72 19 L80 13 L90 10 L82 17 L74 24 L66 30 Z" fill="${HAIR_COLOR.light}" opacity=".7"/>`;
}

function longLocks() {
  return `
    <path d="M63 44 L54 44 L50 100 L58 108 L66 102 L68 46 Z" fill="${HAIR_COLOR.base}" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M117 44 L126 44 L130 100 L122 108 L114 102 L112 46 Z" fill="${HAIR_COLOR.base}" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
  `;
}

function hairCurls() {
  return `
    <circle cx="66" cy="34" r="11" fill="${HAIR_COLOR.base}" stroke="${OUTLINE}" stroke-width="3"/>
    <circle cx="80" cy="22" r="10" fill="${HAIR_COLOR.base}" stroke="${OUTLINE}" stroke-width="3"/>
    <circle cx="100" cy="22" r="10" fill="${HAIR_COLOR.base}" stroke="${OUTLINE}" stroke-width="3"/>
    <circle cx="114" cy="34" r="11" fill="${HAIR_COLOR.base}" stroke="${OUTLINE}" stroke-width="3"/>
    <circle cx="90" cy="18" r="9" fill="${HAIR_COLOR.base}" stroke="${OUTLINE}" stroke-width="3"/>
    <circle cx="60" cy="46" r="8" fill="${HAIR_COLOR.base}" stroke="${OUTLINE}" stroke-width="3"/>
    <circle cx="120" cy="46" r="8" fill="${HAIR_COLOR.base}" stroke="${OUTLINE}" stroke-width="3"/>
    <circle cx="82" cy="20" r="4" fill="${HAIR_COLOR.light}"/>
    <circle cx="98" cy="20" r="4" fill="${HAIR_COLOR.light}"/>
  `;
}

function hairSpikes() {
  return `
    <path d="M62 40 L66 16 L74 32 L82 12 L90 30 L98 12 L106 32 L114 16 L118 40 L112 36 L104 32 L90 30 L76 32 L68 36 Z" fill="${HAIR_COLOR.base}" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
  `;
}

function renderHat(id, o) {
  if (id === "explorer-cap") {
    return `
      <path d="M56 44 C54 20 72 12 90 12 C108 12 126 20 124 44 Z" fill="#6f92ad" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M62 42 L118 42 L112 52 L68 52 Z" fill="#4c6886" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="90" cy="14" r="4" fill="#4c6886"/>`;
  }
  if (id === "wizard-hat") {
    return `
      <path d="M58 42 L88 6 L96 40 L108 18 L122 42 Z" fill="#8a76a0" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M62 40 L88 10 L90 28 Z" fill="#bcabc9" opacity=".8"/>
      <path d="M46 44 L134 44 L122 56 L58 56 Z" fill="#d9a1a8" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
      <rect x="80" y="40" width="20" height="7" rx="3" fill="#e8b64d" stroke="${OUTLINE}" stroke-width="2.5"/>`;
  }
  if (id === "gold-crown") {
    return `
      <path d="M54 46 V24 L70 38 L90 14 L110 38 L126 24 V46 Z" fill="#ffd84d" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M58 42 L70 36 L90 16 L110 36 L122 42 Z" fill="#ffe88a"/>
      <rect x="58" y="42" width="64" height="10" fill="#ff8b1a" stroke="${OUTLINE}" stroke-width="3"/>
      <circle cx="70" cy="32" r="4" fill="#ff5c7a"/>
      <circle cx="90" cy="22" r="4" fill="#6f92ad"/>
      <circle cx="110" cy="32" r="4" fill="#93b083"/>`;
  }
  return "";
}

function renderBackWeapon(id, o) {
  if (id === "star-shield") {
    return `
      <path d="M28 96 L44 84 L60 96 L60 122 C60 139 50 150 44 154 C38 150 28 139 28 122 Z" fill="#6f92ad" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M44 98 L48 107 L57 108 L50 115 L52 124 L44 119 L36 124 L38 115 L31 108 L40 107 Z" fill="${o.accent}"/>
      <path d="M28 96 L36 90 L46 96 L46 118 C46 131 42 140 42 140 C42 140 38 131 38 118 L38 96 Z" fill="#a9c4d8" opacity=".4"/>`;
  }
  return "";
}

function renderFrontWeapon(id, o) {
  if (id === "pencil-sword") {
    return `
      <g transform="rotate(22 120 130)">
        <rect x="114" y="70" width="9" height="64" rx="2" fill="#ffd84d" stroke="${OUTLINE}" stroke-width="3.5"/>
        <rect x="114" y="70" width="9" height="22" fill="#ffe88a"/>
        <path d="M114 70 L118.5 56 L123 70 Z" fill="#d9a17a" stroke="${OUTLINE}" stroke-width="3.5"/>
        <rect x="107" y="130" width="22" height="9" rx="3" fill="#c97a88" stroke="${OUTLINE}" stroke-width="3"/>
      </g>`;
  }
  if (id === "word-wand") {
    return `
      <g transform="rotate(16 122 132)">
        <rect x="118" y="80" width="8" height="60" rx="4" fill="#6a5590" stroke="${OUTLINE}" stroke-width="3.5"/>
        <rect x="118" y="80" width="8" height="16" fill="#bcabc9"/>
        <path d="M122 50 L128 66 L144 72 L128 78 L122 94 L116 78 L100 72 L116 66 Z" fill="${o.accent}" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
        <circle cx="122" cy="72" r="5" fill="#ffffff"/>
      </g>`;
  }
  return "";
}

function weaponViewBox(id) {
  if (id === "star-shield") return "18 76 52 84";
  if (id === "word-wand") return "94 44 56 108";
  return "100 50 52 90";
}

function hairViewBox(id) {
  if (id === "long") return "46 2 88 112";
  if (id === "curly") return "54 4 72 54";
  if (id === "spiky") return "54 6 72 48";
  return "56 4 68 50";
}
