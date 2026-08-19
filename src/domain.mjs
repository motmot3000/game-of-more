export const STORAGE_KEY = "game-of-more:v1";

export const SKINS = [
  {
    id: "starter",
    name: "Scout",
    minLevel: 1,
    colors: ["#64d2ff", "#f7d65a", "#24233a"],
    reward: "Scout outfit",
    price: 0
  },
  {
    id: "vocab-ranger",
    name: "Ranger",
    minLevel: 2,
    colors: ["#1fbf92", "#f4c64e", "#1b2f3f"],
    reward: "Ranger outfit",
    price: 20
  },
  {
    id: "grammar-mage",
    name: "Mage",
    minLevel: 3,
    colors: ["#8f6cff", "#ff7b92", "#241a3a"],
    reward: "Mage outfit",
    price: 35
  },
  {
    id: "story-keeper",
    name: "Keeper",
    minLevel: 4,
    colors: ["#ffb545", "#3f8cff", "#2d2638"],
    reward: "Keeper outfit",
    price: 55
  }
];

export const TITLES = [
  { id: "rookie", name: "Rookie", minLevel: 1, price: 0 },
  { id: "perfect-pupil", name: "Pupil", minLevel: 2, price: 20 },
  { id: "grammar-master", name: "Master", minLevel: 3, price: 35 },
  { id: "class-legend", name: "Legend", minLevel: 5, price: 60 }
];

export const HATS = [
  { id: "no-hat", name: "None", minLevel: 1, price: 0 },
  { id: "explorer-cap", name: "Goggles", minLevel: 1, price: 15 },
  { id: "wizard-hat", name: "Wizard", minLevel: 3, price: 30 },
  { id: "gold-crown", name: "Crown", minLevel: 5, price: 55 }
];

export const WEAPONS = [
  { id: "no-weapon", name: "None", minLevel: 1, price: 0 },
  { id: "pencil-sword", name: "Sword", minLevel: 2, price: 20 },
  { id: "word-wand", name: "Wand", minLevel: 3, price: 35 },
  { id: "star-shield", name: "Shield", minLevel: 4, price: 45 }
];

export const FACES = [
  { id: "smile", name: "Smile", minLevel: 1, price: 0 },
  { id: "grin", name: "Grin", minLevel: 1, price: 10 },
  { id: "wink", name: "Wink", minLevel: 2, price: 20 },
  { id: "cool", name: "Cool", minLevel: 3, price: 30 }
];

export const HAIRS = [
  { id: "short", name: "Short", minLevel: 1, price: 0 },
  { id: "long", name: "Long", minLevel: 1, price: 0 },
  { id: "curly", name: "Curly", minLevel: 2, price: 20 },
  { id: "spiky", name: "Spiky", minLevel: 3, price: 30 }
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
  ...TITLES.map((item) => ({ ...item, type: "title" }))
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

export function purchaseItem(state, pupilId, itemId) {
  const pupil = getPupilById(state, pupilId);
  const item = getShopItem(itemId);
  if (!pupil || !item || !canBuyItem(pupil, item)) return state;

  const nextState = mapPupil(state, pupilId, (current) => ({
    ...current,
    money: current.money - item.price,
    ownedItems: [...current.ownedItems, item.id],
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
  return !isItemOwned(pupil, item.id) && pupil.level >= item.minLevel && pupil.money >= item.price;
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
  return {
    id: pupil.id || cryptoId(),
    name: String(pupil.name || "New hero").trim() || "New hero",
    hp: clamp(positiveInteger(pupil.hp, maxHp), 0, maxHp),
    maxHp,
    xp: Math.max(0, positiveInteger(pupil.xp, 0)),
    level,
    money: Math.max(0, positiveInteger(pupil.money ?? pupil.coins, 0)),
    ownedItems,
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
