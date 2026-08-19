export const STORAGE_KEY = "game-of-more:v1";

export const SKINS = [
  {
    id: "starter",
    name: "Scout",
    minLevel: 1,
    colors: ["#64d2ff", "#f7d65a", "#24233a"],
    reward: "Scout outfit",
    description: "Field gear with compass and expedition scarf.",
    price: 0
  },
  {
    id: "vocab-ranger",
    name: "Ranger",
    minLevel: 2,
    colors: ["#1fbf92", "#f4c64e", "#1b2f3f"],
    reward: "Ranger outfit",
    description: "A leaf-cut mantle made for quick explorers.",
    price: 20
  },
  {
    id: "grammar-mage",
    name: "Mage",
    minLevel: 3,
    colors: ["#8f6cff", "#ff7b92", "#241a3a"],
    reward: "Mage outfit",
    description: "Scholar robes marked with a living rune.",
    price: 35
  },
  {
    id: "story-keeper",
    name: "Keeper",
    minLevel: 4,
    colors: ["#ffb545", "#3f8cff", "#2d2638"],
    reward: "Keeper outfit",
    description: "Mail, cloak and crest of a veteran storyteller.",
    price: 55
  },
  {
    id: "honor-knight",
    name: "Knight",
    minLevel: 6,
    colors: ["#33507e", "#e2bc70", "#152036"],
    reward: "Knight armor",
    description: "Gilded steel plates and chivalric crest of honor.",
    price: 75
  },
  {
    id: "grand-archmage",
    name: "Archmage",
    minLevel: 8,
    colors: ["#573566", "#7fc7d9", "#25142b"],
    reward: "Archmage robes",
    description: "Star-woven mantle shimmering with celestial runes.",
    price: 90
  },
  {
    id: "realm-sovereign",
    name: "Sovereign",
    minLevel: 10,
    colors: ["#8e3230", "#e2bc70", "#211b16"],
    reward: "Sovereign regalia",
    description: "Legendary royal attire worn by masters of lore.",
    price: 100
  }
];

export const TITLES = [
  { id: "rookie", name: "Rookie", minLevel: 1, price: 0, description: "The first mark on a new adventure." },
  { id: "perfect-pupil", name: "Pupil", minLevel: 2, price: 20, description: "A badge for steady progress." },
  { id: "pathfinder", name: "Pathfinder", minLevel: 3, price: 30, description: "Always finding the right words." },
  { id: "grammar-master", name: "Master", minLevel: 4, price: 45, description: "Reserved for skilled wordsmiths." },
  { id: "class-legend", name: "Legend", minLevel: 5, price: 60, description: "A revered figure across the classroom." },
  { id: "scholar-virtuoso", name: "Scholar", minLevel: 6, price: 70, description: "Deep knowledge of tales and grammar." },
  { id: "realm-champion", name: "Champion", minLevel: 7, price: 80, description: "Fearless defender of learning." },
  { id: "grand-archon", name: "Grand Archon", minLevel: 8, price: 90, description: "Wise counselor and linguistic master." },
  { id: "paragon-sovereign", name: "Sovereign", minLevel: 10, price: 100, description: "The summit of achievement and wisdom." }
];

export const HATS = [
  { id: "no-hat", name: "No headgear", minLevel: 1, price: 0, description: "Travel with your hair uncovered." },
  { id: "explorer-cap", name: "Skyglass Goggles", minLevel: 1, price: 15, description: "Brass lenses for distant discoveries." },
  { id: "feather-beret", name: "Feathered Cap", minLevel: 2, price: 20, description: "A jaunty travel cap with a falcon feather." },
  { id: "wizard-hat", name: "Runesmith Hat", minLevel: 3, price: 30, description: "A scholar's hat set with an azure rune." },
  { id: "shadow-hood", name: "Explorer Hood", minLevel: 4, price: 40, description: "A deep cowl shielding from wind and rain." },
  { id: "gold-crown", name: "Legend Crown", minLevel: 5, price: 55, description: "A three-gem crown earned at the summit." },
  { id: "steel-helm", name: "Knight's Helm", minLevel: 6, price: 65, description: "Polished steel helm with a noble visor." },
  { id: "winged-circlet", name: "Winged Diadem", minLevel: 7, price: 75, description: "Silver wings etched with ancient symbols." },
  { id: "star-cowl", name: "Starfall Cowl", minLevel: 8, price: 85, description: "Constellation hood imbued with celestial light." },
  { id: "celestial-crown", name: "Crown of Ancients", minLevel: 10, price: 100, description: "Radiant golden crown blazing with jewels." }
];

export const WEAPONS = [
  { id: "no-weapon", name: "Empty hands", minLevel: 1, price: 0, description: "Ready for the next discovery." },
  { id: "pencil-sword", name: "Quillblade", minLevel: 2, price: 20, description: "A bright steel blade for sharp ideas." },
  { id: "word-wand", name: "Lexicon Staff", minLevel: 3, price: 35, description: "A crystal staff charged with new words." },
  { id: "star-shield", name: "Story Shield", minLevel: 4, price: 45, description: "A star-crested shield for loyal allies." },
  { id: "lore-lantern", name: "Lantern of Lore", minLevel: 5, price: 55, description: "A guiding beacon through complex tales." },
  { id: "spell-grimoire", name: "Runic Grimoire", minLevel: 6, price: 65, description: "An ancient leather tome of secret grammar." },
  { id: "dual-daggers", name: "Quill-Daggers", minLevel: 7, price: 75, description: "Twin swift daggers for agile heroes." },
  { id: "astral-scepter", name: "Astral Scepter", minLevel: 8, price: 85, description: "Channel the celestial power of storytelling." },
  { id: "wisdom-relic", name: "Relic of Wisdom", minLevel: 10, price: 100, description: "The ultimate artifact of the Game of More." }
];

export const FACES = [
  { id: "smile", name: "Calm", minLevel: 1, price: 0, description: "Focused and ready for class." },
  { id: "grin", name: "Bright grin", minLevel: 1, price: 10, description: "A confident adventurer's smile." },
  { id: "wink", name: "Quick wink", minLevel: 2, price: 20, description: "For heroes with a clever plan." },
  { id: "cool", name: "Determined", minLevel: 3, price: 30, description: "A battle-tested look with a small scar." },
  { id: "smirk", name: "Clever Smirk", minLevel: 4, price: 35, description: "A knowing glance from a sharp mind." },
  { id: "fierce", name: "Heroic Gaze", minLevel: 6, price: 50, description: "Eyes burning with unyielding resolve." },
  { id: "star-eyes", name: "Starry Vision", minLevel: 8, price: 70, description: "A glowing look filled with inspiration." },
  { id: "transcendent", name: "Master's Aura", minLevel: 10, price: 90, description: "Serene golden gaze of a true legend." }
];

export const HAIRS = [
  { id: "short", name: "Side sweep", minLevel: 1, price: 0, description: "A practical explorer cut." },
  { id: "long", name: "Long trail", minLevel: 1, price: 0, description: "Long hair shaped for the road." },
  { id: "curly", name: "Cloud curls", minLevel: 2, price: 20, description: "A bold crown of natural curls." },
  { id: "spiky", name: "Wind swept", minLevel: 3, price: 30, description: "Styled by high-altitude adventures." },
  { id: "ponytail", name: "High Ponytail", minLevel: 4, price: 35, description: "Tied back for action and focus." },
  { id: "braided", name: "Warrior Braids", minLevel: 6, price: 50, description: "Intricate braids adorned with silver beads." },
  { id: "flowing", name: "Flowing Locks", minLevel: 8, price: 70, description: "Majestic waves carried by the wind." },
  { id: "celestial-hair", name: "Crown Braids", minLevel: 10, price: 90, description: "Gilded woven braids of a champion." }
];

export const BESPOKE_ITEMS = [
  {
    id: "custom-bespoke",
    name: "Item sur mesure",
    minLevel: 10,
    price: 100,
    type: "bespoke",
    reward: "Item sur mesure",
    description: "Pour 100 pièces au niveau 10 : création exclusive forgée spécialement pour votre héros par le créateur du jeu !"
  }
];

export const SKIN_TONES = [
  { id: "light", name: "Light", color: "#ffd7b0" },
  { id: "medium", name: "Medium", color: "#f2c193" },
  { id: "tan", name: "Tan", color: "#d9a06b" },
  { id: "brown", name: "Brown", color: "#b07a4f" },
  { id: "dark", name: "Dark", color: "#7d4f33" }
];

export const SHOP_ITEMS = [
  ...SKINS.map((item) => ({ ...item, type: "outfit" })),
  ...HATS.map((item) => ({ ...item, type: "hat" })),
  ...WEAPONS.map((item) => ({ ...item, type: "weapon" })),
  ...FACES.map((item) => ({ ...item, type: "face" })),
  ...HAIRS.map((item) => ({ ...item, type: "hair" })),
  ...TITLES.map((item) => ({ ...item, type: "title" })),
  ...BESPOKE_ITEMS
];

const CLASS_NAMES = ["7P", "8P"];

// Maps the original class ids/names ("CP"/"VIP") to the renamed ones ("7P"/"8P").
const LEGACY_CLASS_MAP = { cp: "7p", vip: "8p", CP: "7P", VIP: "8P" };

export function createInitialState() {
  return {
    activeClassId: "7p",
    selectedPupilId: null,
    selectMode: false,
    selectedPupilIds: [],
    classes: [
      { id: "7p", name: "7P", pupils: samplePupils("7p", [["Alex", "boy"], ["Mia", "girl"], ["Noah", "boy"], ["Lina", "girl"]]) },
      { id: "8p", name: "8P", pupils: samplePupils("8p", [["Emma", "girl"], ["Leo", "boy"], ["Sara", "girl"], ["Niko", "boy"]]) }
    ],
    events: []
  };
}

export function normalizeState(rawState) {
  if (!rawState || !Array.isArray(rawState.classes)) {
    return createInitialState();
  }

  const state = {
    ...rawState,
    activeClassId: LEGACY_CLASS_MAP[rawState.activeClassId] || rawState.activeClassId || rawState.classes[0]?.id || "7p",
    selectedPupilId: rawState.selectedPupilId || null,
    selectMode: Boolean(rawState.selectMode),
    selectedPupilIds: Array.isArray(rawState.selectedPupilIds) ? [...new Set(rawState.selectedPupilIds)] : [],
    classes: rawState.classes.map((classroom, index) => {
      const fallbackId = CLASS_NAMES[index]?.toLowerCase() || cryptoId();
      const fallbackName = CLASS_NAMES[index] || "Class";
      return {
        id: LEGACY_CLASS_MAP[classroom.id] || classroom.id || fallbackId,
        name: LEGACY_CLASS_MAP[classroom.name] || classroom.name || fallbackName,
        pupils: Array.isArray(classroom.pupils)
          ? classroom.pupils.map(normalizePupil)
          : []
      };
    }),
    events: Array.isArray(rawState.events) ? rawState.events : []
  };

  if (!getClassById(state, state.activeClassId)) {
    state.activeClassId = state.classes[0]?.id || "7p";
  }

  if (state.selectedPupilId && !getPupilById(state, state.selectedPupilId)) {
    state.selectedPupilId = null;
  }

  state.selectedPupilIds = state.selectedPupilIds.filter((id) => getPupilById(state, id));

  return state;
}

export function addPupil(state, classId, { name, gender, skinTone } = {}) {
  const trimmedName = String(name || "").trim();
  if (!trimmedName) return state;

  return updateClass(state, classId, (classroom) => ({
    ...classroom,
    pupils: [
      ...classroom.pupils,
      normalizePupil({
        id: cryptoId(),
        name: trimmedName,
        hp: 5,
        maxHp: 5,
        xp: 0,
        level: 1,
        skin: "starter",
        title: "rookie",
        gender,
        skinTone
      })
    ]
  }));
}

export function removePupil(state, pupilId) {
  return {
    ...state,
    selectedPupilId: state.selectedPupilId === pupilId ? null : state.selectedPupilId,
    classes: state.classes.map((classroom) => ({
      ...classroom,
      pupils: classroom.pupils.filter((pupil) => pupil.id !== pupilId)
    }))
  };
}

export function renamePupil(state, pupilId, name) {
  const trimmedName = String(name || "").trim();
  if (!trimmedName) return state;

  return mapPupil(state, pupilId, (pupil) => ({
    ...pupil,
    name: trimmedName
  }));
}

export function restoreHpAll(state, classId) {
  return updateClass(state, classId, (classroom) => ({
    ...classroom,
    pupils: classroom.pupils.map((pupil) => ({ ...pupil, hp: pupil.maxHp }))
  }));
}

export function importState(jsonText) {
  let raw;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    throw new Error("The file is not valid JSON.");
  }

  if (!raw || !Array.isArray(raw.classes)) {
    throw new Error("This file is not a Game of More backup.");
  }

  const state = normalizeState(raw);
  if (!state.classes.length) {
    throw new Error("No classes found in the file.");
  }
  return state;
}

export function awardXp(state, pupilIds, amount, reason = "XP") {
  const xpAmount = Number(amount);
  if (!Number.isFinite(xpAmount) || xpAmount <= 0 || pupilIds.length === 0) return state;

  const idSet = new Set(pupilIds);
  const nextState = {
    ...state,
    classes: state.classes.map((classroom) => ({
      ...classroom,
      pupils: classroom.pupils.map((pupil) =>
        idSet.has(pupil.id) ? applyXp(pupil, xpAmount) : pupil
      )
    }))
  };

  return appendEvent(nextState, {
    type: "xp",
    pupilIds: [...idSet],
    amount: xpAmount,
    reason
  });
}

export function changeHp(state, pupilId, delta) {
  const hpDelta = Number(delta);
  if (!Number.isFinite(hpDelta) || hpDelta === 0) return state;

  const nextState = mapPupil(state, pupilId, (pupil) => ({
    ...pupil,
    hp: clamp(pupil.hp + hpDelta, 0, pupil.maxHp)
  }));

  return appendEvent(nextState, {
    type: "hp",
    pupilIds: [pupilId],
    amount: hpDelta,
    reason: hpDelta > 0 ? "HP restored" : "HP lost"
  });
}

export function changeHpMany(state, pupilIds, delta) {
  const hpDelta = Number(delta);
  if (!Number.isFinite(hpDelta) || hpDelta === 0 || pupilIds.length === 0) return state;

  const idSet = new Set(pupilIds);
  const nextState = {
    ...state,
    classes: state.classes.map((classroom) => ({
      ...classroom,
      pupils: classroom.pupils.map((pupil) =>
        idSet.has(pupil.id) ? { ...pupil, hp: clamp(pupil.hp + hpDelta, 0, pupil.maxHp) } : pupil
      )
    }))
  };

  return appendEvent(nextState, {
    type: "hp",
    pupilIds: [...idSet],
    amount: hpDelta,
    reason: hpDelta > 0 ? "HP restored" : "HP lost"
  });
}

export function setSelectMode(state, enabled) {
  return {
    ...state,
    selectMode: Boolean(enabled),
    selectedPupilIds: enabled ? state.selectedPupilIds : [],
    selectedPupilId: enabled ? null : state.selectedPupilId
  };
}

export function toggleSelection(state, pupilId) {
  const set = new Set(state.selectedPupilIds);
  if (set.has(pupilId)) set.delete(pupilId);
  else set.add(pupilId);
  return { ...state, selectedPupilIds: [...set] };
}

export function selectAllInClass(state, classId) {
  const classroom = getClassById(state, classId);
  if (!classroom) return state;
  return { ...state, selectedPupilIds: classroom.pupils.map((pupil) => pupil.id) };
}

export function clearSelection(state) {
  if (state.selectedPupilIds.length === 0) return state;
  return { ...state, selectedPupilIds: [] };
}

export function updateCosmetics(state, pupilId, changes) {
  return mapPupil(state, pupilId, (pupil) => {
    const next = { ...pupil };
    for (const [type, itemId] of Object.entries(changes)) {
      const item = getShopItem(itemId);
      if (item?.type === type && isItemOwned(pupil, item.id)) {
        next[cosmeticField(type)] = item.id;
      }
    }
    return next;
  });
}

export function awardMoney(state, pupilIds, amount, reason = "Money") {
  const moneyAmount = Number(amount);
  if (!Number.isFinite(moneyAmount) || moneyAmount <= 0 || pupilIds.length === 0) return state;
  const idSet = new Set(pupilIds);
  const nextState = {
    ...state,
    classes: state.classes.map((classroom) => ({
      ...classroom,
      pupils: classroom.pupils.map((pupil) => (
        idSet.has(pupil.id) ? { ...pupil, money: pupil.money + Math.floor(moneyAmount) } : pupil
      ))
    }))
  };
  return appendEvent(nextState, { type: "money", pupilIds: [...idSet], amount: Math.floor(moneyAmount), reason });
}

export function purchaseItem(state, pupilId, itemId, note = "") {
  const pupil = getPupilById(state, pupilId);
  const item = getShopItem(itemId);
  if (!pupil || !item || !canBuyItem(pupil, item)) return state;

  if (item.type === "bespoke") {
    const nextState = mapPupil(state, pupilId, (current) => {
      const customOrders = Array.isArray(current.customOrders) ? [...current.customOrders] : [];
      customOrders.push({
        id: cryptoId(),
        orderedAt: new Date().toISOString(),
        note: String(note || "").trim() || "Item sur mesure",
        cost: item.price
      });
      return {
        ...current,
        money: current.money - item.price,
        ownedItems: [...new Set([...current.ownedItems, item.id])],
        customOrders
      };
    });
    return appendEvent(nextState, {
      type: "bespoke_order",
      pupilIds: [pupilId],
      amount: -item.price,
      reason: note ? `Sur-mesure order: "${note}"` : "Sur-mesure item ordered"
    });
  }

  const nextState = mapPupil(state, pupilId, (current) => ({
    ...current,
    money: current.money - item.price,
    ownedItems: [...new Set([...current.ownedItems, item.id])],
    [cosmeticField(item.type)]: item.id
  }));
  return appendEvent(nextState, { type: "purchase", pupilIds: [pupilId], amount: -item.price, reason: `Bought ${item.name}` });
}

export function getShopItem(itemId) {
  return SHOP_ITEMS.find((item) => item.id === itemId) || null;
}

export function getShopItems(type) {
  return SHOP_ITEMS.filter((item) => item.type === type);
}

export function isItemOwned(pupil, itemId) {
  return pupil.ownedItems.includes(itemId);
}

export function canBuyItem(pupil, item) {
  if (item.type !== "bespoke" && isItemOwned(pupil, item.id)) return false;
  return pupil.level >= item.minLevel && pupil.money >= item.price;
}

export function getClassById(state, classId) {
  return state.classes.find((classroom) => classroom.id === classId) || null;
}

export function getPupilById(state, pupilId) {
  for (const classroom of state.classes) {
    const pupil = classroom.pupils.find((candidate) => candidate.id === pupilId);
    if (pupil) return pupil;
  }
  return null;
}

export function getCurrentClass(state) {
  return getClassById(state, state.activeClassId) || state.classes[0];
}

export function xpNeededForLevel(level) {
  return 1000 + Math.max(0, level - 1) * 500;
}

export function xpProgress(pupil) {
  const needed = xpNeededForLevel(pupil.level);
  return {
    current: pupil.xp,
    needed,
    percent: Math.min(100, Math.round((pupil.xp / needed) * 100))
  };
}

export function getUnlockedSkins(level) {
  return SKINS.filter((skin) => skin.minLevel <= level);
}

export function getUnlockedTitles(level) {
  return TITLES.filter((title) => title.minLevel <= level);
}

export function getRewardsForLevel(level) {
  const rewards = SHOP_ITEMS.filter((item) => item.minLevel === level).map((item) =>
    item.type === "title" ? `${item.name} title` : item.name
  );
  if (level > 1) rewards.push("HP restored");
  return rewards;
}

export function getNextReward(level) {
  const upcomingLevels = SHOP_ITEMS.map((item) => item.minLevel).filter((minLevel) => minLevel > level);
  if (!upcomingLevels.length) return null;
  const nextLevel = Math.min(...upcomingLevels);
  return { level: nextLevel, rewards: getRewardsForLevel(nextLevel) };
}

export function isEliminated(pupil) {
  return pupil.hp <= 0;
}

const SAMPLE_TONES = ["light", "medium", "tan", "brown", "dark"];

function samplePupils(prefix, entries) {
  return entries.map(([name, gender], index) =>
    normalizePupil({
      id: `${prefix}-${index + 1}`,
      name,
      hp: 5,
      maxHp: 5,
      xp: index * 120,
      level: 1,
      skin: "starter",
      title: "rookie",
      gender,
      skinTone: SAMPLE_TONES[index % SAMPLE_TONES.length]
    })
  );
}

function normalizePupil(pupil) {
  const level = positiveInteger(pupil.level, 1);
  const maxHp = positiveInteger(pupil.maxHp, 5);
  const skin = SKINS.some((item) => item.id === pupil.skin) ? pupil.skin : "starter";
  const title = TITLES.some((item) => item.id === pupil.title) ? pupil.title : "rookie";
  const hat = HATS.some((item) => item.id === pupil.hat) ? pupil.hat : "no-hat";
  const weapon = WEAPONS.some((item) => item.id === pupil.weapon) ? pupil.weapon : "no-weapon";
  const gender = pupil.gender === "girl" ? "girl" : "boy";
  const skinTone = SKIN_TONES.some((tone) => tone.id === pupil.skinTone) ? pupil.skinTone : "light";
  const face = FACES.some((item) => item.id === pupil.face) ? pupil.face : "smile";
  const defaultHair = gender === "girl" ? "long" : "short";
  const hair = HAIRS.some((item) => item.id === pupil.hair) ? pupil.hair : defaultHair;
  const ownedItems = [...new Set([
    "starter",
    "rookie",
    "no-hat",
    "no-weapon",
    "smile",
    "short",
    "long",
    skin,
    title,
    ...(Array.isArray(pupil.ownedItems) ? pupil.ownedItems.filter((id) => getShopItem(id)) : [])
  ])];
  const customOrders = Array.isArray(pupil.customOrders) ? pupil.customOrders : [];
  return {
    id: pupil.id || cryptoId(),
    name: String(pupil.name || "New hero").trim() || "New hero",
    hp: clamp(positiveInteger(pupil.hp, maxHp), 0, maxHp),
    maxHp,
    xp: Math.max(0, positiveInteger(pupil.xp, 0)),
    level,
    money: Math.max(0, positiveInteger(pupil.money ?? pupil.coins, 0)),
    ownedItems,
    customOrders,
    skin,
    title,
    hat: ownedItems.includes(hat) ? hat : "no-hat",
    weapon: ownedItems.includes(weapon) ? weapon : "no-weapon",
    gender,
    skinTone,
    face: ownedItems.includes(face) ? face : "smile",
    hair: ownedItems.includes(hair) ? hair : defaultHair,
    lastLevelUpAt: pupil.lastLevelUpAt || null
  };
}

function applyXp(pupil, amount) {
  let xp = pupil.xp + amount;
  let level = pupil.level;
  let didLevelUp = false;

  while (xp >= xpNeededForLevel(level)) {
    xp -= xpNeededForLevel(level);
    level += 1;
    didLevelUp = true;
  }

  return {
    ...pupil,
    xp,
    level,
    hp: didLevelUp ? pupil.maxHp : pupil.hp,
    lastLevelUpAt: didLevelUp ? new Date().toISOString() : pupil.lastLevelUpAt
  };
}

function cosmeticField(type) {
  return type === "outfit" ? "skin" : type;
}

function updateClass(state, classId, updater) {
  return {
    ...state,
    classes: state.classes.map((classroom) =>
      classroom.id === classId ? updater(classroom) : classroom
    )
  };
}

function mapPupil(state, pupilId, updater) {
  return {
    ...state,
    classes: state.classes.map((classroom) => ({
      ...classroom,
      pupils: classroom.pupils.map((pupil) => (pupil.id === pupilId ? updater(pupil) : pupil))
    }))
  };
}

function appendEvent(state, event) {
  return {
    ...state,
    events: [
      {
        id: cryptoId(),
        at: new Date().toISOString(),
        ...event
      },
      ...state.events
    ].slice(0, 80)
  };
}

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function cryptoId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
