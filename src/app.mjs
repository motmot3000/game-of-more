import {
  SKIN_TONES,
  STORAGE_KEY,
  addPupil,
  awardMoney,
  awardXp,
  canBuyItem,
  changeHp,
  changeHpMany,
  clearSelection,
  createInitialState,
  getCurrentClass,
  getNextReward,
  getPupilById,
  getRewardsForLevel,
  getShopItem,
  getShopItems,
  importState,
  isEliminated,
  normalizeState,
  removePupil,
  renamePupil,
  restoreHpAll,
  isItemOwned,
  purchaseItem,
  selectAllInClass,
  setSelectMode,
  toggleSelection,
  updateCosmetics,
  xpProgress
} from "./domain.mjs";
import {
  renderHero,
  renderItemArt,
  renderCoinIcon,
  renderHeartIcon,
  renderMascot
} from "./avatar.mjs";

const app = document.querySelector("#app");
const toasts = document.querySelector("#toasts");
const modalRoot = document.querySelector("#modal-root");
// The backend only runs on cagipi. Other domains that mirror the app (e.g. a
// static git-pull deploy) reverse-proxy /api/ back to it server-side, so the
// browser always sees it as same-origin — see BACKEND.md.
function apiUrl(path) {
  return new URL(`api/${path}`, document.baseURI).toString();
}

// Remembers which hero a student picked on this device, so their locker
// reopens directly on the next visit. Device-local, never synced to the server.
const STUDENT_KEY = "game-of-more:student";

let state = loadState();
let history = [];
let shopCategory = "outfit";
let studentPupilId = loadStudentId();
let persistTimer = null;

const SHOP_CATEGORIES = [
  { type: "outfit", label: "Outfits" },
  { type: "hat", label: "Hats" },
  { type: "weapon", label: "Items" },
  { type: "face", label: "Faces" },
  { type: "hair", label: "Hair" },
  { type: "title", label: "Titles" }
];

window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY || !event.newValue) return;
  try {
    state = normalizeState(JSON.parse(event.newValue));
    history = [];
    render();
  } catch {
    // Ignore malformed writes from another tab.
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closePreview();
});

window.addEventListener("hashchange", () => {
  closePreview();
  render();
});

function currentView() {
  if (location.hash === "#rules") return "rules";
  if (location.hash.startsWith("#student")) return "student";
  return "board";
}

function render() {
  if (currentView() === "rules") {
    renderRulesPage();
    return;
  }

  if (currentView() === "student") {
    renderStudentView();
    return;
  }

  const classroom = getCurrentClass(state);
  const selectedPupil = state.selectedPupilId ? getPupilById(state, state.selectedPupilId) : null;

  app.innerHTML = `
    <main class="shell">
      <section class="stage" data-density="${classroom.pupils.length > 24 ? "list" : "grid"}">
        ${renderHeroBanner()}
        <header class="stage-header stage-header--hud">
          <nav class="header-nav">
            <div class="class-tabs" role="tablist" aria-label="Classes">
              ${state.classes.map(renderClassTab).join("")}
            </div>
          </nav>
          <div class="header-nav">
            ${renderStats(classroom)}
            ${renderModeSwitch("board")}
            <button class="rules-button" data-action="show-rules" type="button">Rules</button>
          </div>
        </header>
        ${renderStage(classroom)}
      </section>
      <aside class="control-panel" aria-label="Teacher console">
        ${renderControlPanel(classroom, selectedPupil)}
      </aside>
    </main>
    <input type="file" id="import-file" accept="application/json,.json" hidden />
  `;

  bindEvents();
}

function renderHeroBanner() {
  return `
    <div class="hero-banner">
      <img class="hero-banner-img" src="./assets/banner.png" alt="Game of More — adventure banner" />
      <div class="hero-banner-copy">
        <h1 class="hero-title">GAME <span class="accent">OF MORE</span></h1>
      </div>
    </div>
  `;
}

/* The single switch between the two interfaces, living in the header of
   both views next to the class tabs. */
function renderModeSwitch(active) {
  return `
    <div class="class-tabs mode-switch" role="tablist" aria-label="Interface">
      <button class="tab ${active === "board" ? "active" : ""}" data-action="show-board" role="tab" aria-selected="${active === "board"}">Teacher</button>
      <button class="tab ${active === "student" ? "active" : ""}" data-action="show-student" role="tab" aria-selected="${active === "student"}">Students</button>
    </div>
  `;
}

function renderClassTab(classroom) {
  const active = classroom.id === state.activeClassId;
  return `
    <button class="tab ${active ? "active" : ""}" data-action="select-class" data-class-id="${classroom.id}" role="tab" aria-selected="${active}">
      ${escapeHtml(classroom.name)}
    </button>
  `;
}

function renderRulesPage() {
  app.innerHTML = `
    <main class="rules-shell">
      <header class="stage-header">
        <div class="brand">
          <div class="brand-text">
            <p class="eyebrow">The hero classroom quest</p>
            <span class="brand-title">GAME <span class="accent">OF MORE</span></span>
          </div>
        </div>
        <button class="rules-button" data-action="show-board" type="button">← Back to class</button>
      </header>
      <div class="rules-content">
        <h1>How does it work?</h1>
        <p class="rules-intro">Every student is a hero with HP, XP and a level.</p>

        <div class="rules-grid">
          <section class="rules-card">
            <div class="rules-icon">${renderHeartIcon(true)}</div>
            <h2>HP — Hit Points</h2>
            <p>Bad behaviour costs HP. Reach 0 and the hero is out until they level up.</p>
          </section>

          <section class="rules-card">
            <div class="rules-icon">⚡</div>
            <h2>XP — Experience</h2>
            <p>Homework, vocabulary and good behaviour earn XP. Level up to unlock rewards.</p>
          </section>

          <section class="rules-card">
            <div class="rules-icon">${renderCoinIcon()}</div>
            <h2>Money</h2>
            <p>Good grades and nice actions earn money. Spend it in the hero shop.</p>
          </section>

          <section class="rules-card">
            <div class="rules-icon">🏆</div>
            <h2>Level up</h2>
            <p>Level up to heal HP and unlock new outfits, hats, items and titles.</p>
          </section>
        </div>

        <section class="rules-section">
          <h2>Quick reference</h2>
          <div class="rules-table">
            <div class="rules-row"><span class="rules-action">Do homework</span><span class="rules-result">+100 XP</span></div>
            <div class="rules-row"><span class="rules-action">Learn vocabulary</span><span class="rules-result">+150 XP</span></div>
            <div class="rules-row"><span class="rules-action">Be nice</span><span class="rules-result">+50 XP</span></div>
            <div class="rules-row"><span class="rules-action">Good grade</span><span class="rules-result">+Money</span></div>
            <div class="rules-row"><span class="rules-action">Bad behaviour</span><span class="rules-result">-1 HP</span></div>
          </div>
        </section>
      </div>
    </main>
  `;
  bindEvents();
}

function navigate(hash) {
  if (location.hash === hash) {
    render();
    return;
  }
  location.hash = hash;
}

/* ---------- Student view ----------
   Reached via #student. Each pupil finds their hero, reads their stats and
   spends THEIR money in the shop. No XP/HP/money attribution here — that
   stays in the teacher console. */

function renderStudentView() {
  const classroom = getCurrentClass(state);
  const pupil = studentPupilId ? getPupilById(state, studentPupilId) : null;
  if (studentPupilId && !pupil) rememberStudent(null);

  app.innerHTML = `
    <main class="student-shell">
      <section class="stage">
        ${renderHeroBanner()}
        <header class="stage-header stage-header--hud">
          <nav class="header-nav">
            <div class="class-tabs" role="tablist" aria-label="Classes">
              ${state.classes.map(renderClassTab).join("")}
            </div>
          </nav>
          <div class="header-nav">
            ${renderModeSwitch("student")}
            <button class="rules-button" data-action="show-rules" type="button">Rules</button>
          </div>
        </header>
        ${pupil ? renderStudentLocker(pupil) : renderStudentPicker(classroom)}
      </section>
    </main>
  `;
  bindEvents();
}

function renderStudentPicker(classroom) {
  if (classroom.pupils.length === 0) {
    return `
      <div class="empty-state">
        ${renderMascot()}
        <h2>No heroes yet!</h2>
        <p>Your teacher has not summoned any hero in ${escapeHtml(classroom.name)} yet.</p>
      </div>
    `;
  }

  return `
    <section class="student-picker">
      <div class="student-picker-head">
        <h2>Who is your hero?</h2>
        <p class="muted">Tap your card to see your hero and change your gear.</p>
      </div>
      <div class="roster-grid">
        ${classroom.pupils.map(renderStudentCard).join("")}
      </div>
    </section>
  `;
}

function renderStudentCard(pupil) {
  return `
    <article class="avatar-card student-card ${isEliminated(pupil) ? "eliminated" : ""}" data-action="student-pick" data-pupil-id="${pupil.id}" role="button" tabindex="0" aria-label="Open ${escapeHtml(pupil.name)}'s hero">
      <div class="name-row">
        <strong>${escapeHtml(pupil.name)}</strong>
        <span class="level-badge">LVL ${pupil.level}</span>
      </div>
      <div class="avatar-wrap">
        ${renderHero(pupil)}
        ${isEliminated(pupil) ? `<div class="out-badge">OUT</div>` : ""}
      </div>
      <p class="title title-${pupil.title}">${escapeHtml(getItemName("title", pupil.title))}</p>
      <div class="money-badge" aria-label="${pupil.money} money"><span>Money</span>${renderCoinIcon()}<strong>${pupil.money}</strong></div>
    </article>
  `;
}

function renderStudentLocker(pupil) {
  const progress = xpProgress(pupil);
  const next = getNextReward(pupil.level);
  const gear = [
    ["Outfit", getItemName("outfit", pupil.skin)],
    ["Hat", getItemName("hat", pupil.hat)],
    ["Item", getItemName("weapon", pupil.weapon)],
    ["Hair", getItemName("hair", pupil.hair)],
    ["Face", getItemName("face", pupil.face)]
  ];

  return `
    <section class="locker ${isEliminated(pupil) ? "eliminated" : ""}">
      <div class="locker-hero">
        <div class="locker-stage">
          ${renderHero(pupil)}
          ${isEliminated(pupil) ? `<div class="out-badge">OUT</div>` : ""}
        </div>
        <div class="locker-id">
          <div class="pupil-modal-head">
            <h3>${escapeHtml(pupil.name)}</h3>
            <span class="level-badge big">LVL ${pupil.level}</span>
          </div>
          <p class="title title-${pupil.title}">${escapeHtml(getItemName("title", pupil.title))}</p>
          <div class="hp-row big" aria-label="${pupil.hp} hit points out of ${pupil.maxHp}">${renderHpHearts(pupil)}</div>
          <div class="xp-track large" aria-label="${progress.current} XP out of ${progress.needed}"><span style="width:${progress.percent}%"></span></div>
          <div class="xp-label">${progress.current}/${progress.needed} XP</div>
          <div class="money-badge big"><span>Money</span>${renderCoinIcon()}<strong>${pupil.money}</strong></div>
          <dl class="gear-list">
            ${gear.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
          </dl>
          ${isEliminated(pupil) ? `<p class="locker-warning">You are out of HP! Level up to get back in the game.</p>` : ""}
          <p class="muted next-reward">${next
            ? `Next at LVL ${next.level}: ${next.rewards.map(escapeHtml).join(", ")}`
            : "Max rewards unlocked!"}</p>
          <button class="ghost-button" type="button" data-action="change-hero">← Not you? Pick another hero</button>
        </div>
      </div>
      <div class="locker-shop">
        ${renderShop(pupil)}
      </div>
    </section>
  `;
}

function loadStudentId() {
  try {
    return localStorage.getItem(STUDENT_KEY);
  } catch {
    return null;
  }
}

function rememberStudent(pupilId) {
  studentPupilId = pupilId;
  try {
    if (pupilId) localStorage.setItem(STUDENT_KEY, pupilId);
    else localStorage.removeItem(STUDENT_KEY);
  } catch {
    // Storage unavailable (private mode…): the choice just won't persist.
  }
}

/* The hero the shop acts on: the teacher's board selection in teacher view,
   the student's own hero in student view. */
function getShopPupilId() {
  return currentView() === "student" ? studentPupilId : state.selectedPupilId;
}

function renderStats(classroom) {
  const total = classroom.pupils.length;
  if (!total) return "";
  const out = classroom.pupils.filter(isEliminated).length;
  const average = (classroom.pupils.reduce((sum, pupil) => sum + pupil.level, 0) / total).toFixed(1);
  return `
    <div class="stats-bar">
      <span class="stat-pill"><span class="dot" style="background:var(--amber)"></span><strong>${escapeHtml(classroom.name)}</strong></span>
      <span class="stat-pill"><strong>${total}</strong> heroes</span>
      <span class="stat-pill"><span class="dot" style="background:var(--coral)"></span><strong>${out}</strong> out</span>
      <span class="stat-pill">avg level <strong>${average}</strong></span>
    </div>
  `;
}

function renderStage(classroom) {
  if (classroom.pupils.length === 0) {
    return `
      <div class="empty-state">
        ${renderMascot()}
        <h2>Your quest begins!</h2>
        <p>Add your students from the teacher console to summon their heroes.</p>
      </div>
    `;
  }

  if (classroom.pupils.length > 24) {
    return `
      <div class="pupil-list">
        ${classroom.pupils.map(renderListRow).join("")}
      </div>
    `;
  }

  return `
    <div class="roster-grid">
      ${classroom.pupils.map(renderAvatarCard).join("")}
    </div>
  `;
}

function renderAvatarCard(pupil) {
  const progress = xpProgress(pupil);
  const title = getItemName("title", pupil.title);
  const selected = isCardSelected(pupil.id);

  return `
    <article class="avatar-card ${selected ? "selected" : ""} ${isEliminated(pupil) ? "eliminated" : ""}" data-action="select-pupil" data-pupil-id="${pupil.id}">
      <div class="name-row">
        <strong>${escapeHtml(pupil.name)}</strong>
        <span class="level-badge">${state.selectMode && selected ? "✓" : `LVL ${pupil.level}`}</span>
      </div>
      <div class="avatar-wrap" data-action="zoom-pupil" data-pupil-id="${pupil.id}" role="button" tabindex="0" aria-label="Show ${escapeHtml(pupil.name)} in full size">
        ${renderHero(pupil)}
        ${isEliminated(pupil) ? `<div class="out-badge">OUT</div>` : ""}
        <span class="zoom-hint" aria-hidden="true">⤢</span>
      </div>
      <p class="title title-${pupil.title}">${escapeHtml(title)}</p>
      <div class="money-badge" aria-label="${pupil.money} money"><span>Money</span>${renderCoinIcon()}<strong>${pupil.money}</strong></div>
      <div class="hp-row" aria-label="${pupil.hp} hit points out of ${pupil.maxHp}">
        ${renderHpHearts(pupil)}
      </div>
      <div class="xp-track" aria-label="${progress.current} XP out of ${progress.needed}">
        <span style="width:${progress.percent}%"></span>
      </div>
      <div class="xp-label">${progress.current}/${progress.needed} XP</div>
    </article>
  `;
}

function renderListRow(pupil) {
  const progress = xpProgress(pupil);
  const selected = isCardSelected(pupil.id);
  return `
    <article class="list-row ${selected ? "selected" : ""} ${isEliminated(pupil) ? "eliminated" : ""}" data-action="select-pupil" data-pupil-id="${pupil.id}">
      <div class="mini-avatar" data-action="zoom-pupil" data-pupil-id="${pupil.id}" role="button" tabindex="0" aria-label="Show ${escapeHtml(pupil.name)} in full size">${renderHero(pupil)}</div>
      <strong>${escapeHtml(pupil.name)}</strong>
      <span>${state.selectMode && selected ? "✓" : `LVL ${pupil.level}`}</span>
      <span>${pupil.hp}/${pupil.maxHp} HP</span>
      <span class="money">${renderCoinIcon()} ${pupil.money}</span>
      <div class="xp-track"><span style="width:${progress.percent}%"></span></div>
      <span>${progress.current}/${progress.needed} XP</span>
    </article>
  `;
}

function isCardSelected(pupilId) {
  return state.selectMode ? state.selectedPupilIds.includes(pupilId) : pupilId === state.selectedPupilId;
}

function getXpTargets() {
  if (state.selectMode) return state.selectedPupilIds;
  return state.selectedPupilId ? [state.selectedPupilId] : [];
}

function renderControlPanel(classroom, selectedPupil) {
  const targets = getXpTargets();
  const targetLabel = state.selectMode
    ? `${targets.length} selected`
    : selectedPupil
      ? selectedPupil.name
      : "No one selected";

  return `
    <div class="panel-header">
      <div>
        <h2>${escapeHtml(classroom.name)}</h2>
        <p class="panel-subtitle">${targetLabel}</p>
      </div>
      <div class="header-actions">
        <button class="icon-button ${state.selectMode ? "active" : ""}" data-action="toggle-select-mode" title="Select multiple" aria-label="Select multiple" aria-pressed="${state.selectMode}">☑</button>
        <button class="icon-button" data-action="undo" title="Undo" aria-label="Undo">↺</button>
        <button class="icon-button" data-action="import" title="Import" aria-label="Import">⬆</button>
        <button class="icon-button" data-action="export" title="Export" aria-label="Export">⬇</button>
      </div>
    </div>

    <details class="panel-section" open>
      <summary>Quick actions</summary>
      <div class="button-grid">
        ${renderXpButton(100, "Homework")}
        ${renderXpButton(150, "Vocabulary")}
        ${renderXpButton(50, "Nice")}
        ${renderXpButton(500, "Bonus")}
      </div>
      <form class="custom-xp" data-action="custom-xp">
        <input name="amount" type="number" min="1" step="1" value="100" aria-label="Custom XP" />
        <button type="submit">Give XP</button>
        <button type="button" data-action="xp-all">Give all</button>
      </form>
      <div class="class-actions">
        <form class="money-all" data-action="money-all">
          <input name="amount" type="number" min="1" step="1" value="10" aria-label="Money amount" />
          <button type="submit">Money to all</button>
        </form>
        <button class="heal-all" type="button" data-action="heal-all">Heal all HP</button>
      </div>
    </details>

    ${state.selectMode ? renderBulkPanel(classroom) : selectedPupil ? renderSelectedPupil(selectedPupil) : renderNoSelection()}

    <details class="panel-section">
      <summary>Add student</summary>
      <form class="add-form" data-action="add-pupil">
        <div class="add-row">
          <input id="pupil-name" name="name" autocomplete="off" placeholder="First name" />
          <button type="submit">Add</button>
        </div>
        <div class="add-fields">
          <label>Gender
            <select name="gender">
              <option value="boy">Boy</option>
              <option value="girl">Girl</option>
            </select>
          </label>
          <label>Skin
            <select name="skinTone">
              ${SKIN_TONES.map((tone) => `<option value="${tone.id}">${tone.name}</option>`).join("")}
            </select>
          </label>
        </div>
      </form>
    </details>

    <details class="panel-section">
      <summary>Activity</summary>
      <div class="events">
        ${state.events.slice(0, 6).map(renderEvent).join("") || "<p class=\"muted\">No activity yet.</p>"}
      </div>
    </details>

    <details class="panel-section danger-zone">
      <summary>Danger zone</summary>
      <button class="danger" type="button" data-action="reset-all">Reset all data</button>
    </details>
  `;
}

function renderBulkPanel(classroom) {
  const ids = state.selectedPupilIds;
  const names = classroom.pupils.filter((pupil) => ids.includes(pupil.id)).map((pupil) => pupil.name);
  const disabled = ids.length ? "" : "disabled";

  return `
    <details class="panel-section selected-panel" open>
      <summary>${ids.length} selected</summary>
      <p class="muted">${names.length ? names.map(escapeHtml).join(", ") : "Tap characters on the board to select them."}</p>

      <div class="stat-line">
        <button type="button" data-action="select-all">Select all</button>
        <button type="button" data-action="clear-selection" ${disabled}>Clear</button>
      </div>

      <div class="hp-controls">
        <span>Bulk HP</span>
        <button type="button" data-action="bulk-hp-minus" ${disabled}>-1</button>
        <button type="button" data-action="bulk-hp-plus" ${disabled}>+1</button>
      </div>

      <div class="money-actions">
        <span>Teacher money</span>
        ${renderMoneyButtons("bulk-money", disabled)}
      </div>
    </details>
  `;
}

function renderXpButton(amount, reason) {
  return `
    <button type="button" data-action="award-xp" data-amount="${amount}" data-reason="${reason}">
      +${amount}<span>${reason}</span>
    </button>
  `;
}

function renderMoneyButtons(action, disabled = "") {
  return [10, 20, 30, 40, 50, 60].map((amount) => (
    `<button type="button" data-action="${action}" data-amount="${amount}" ${disabled}>+${amount}</button>`
  )).join("");
}

function renderSelectedPupil(pupil) {
  const progress = xpProgress(pupil);
  return `
    <details class="panel-section selected-panel" open>
      <summary>Selected hero</summary>
      <div class="selected-top">
        <div class="mini-avatar" data-action="zoom-pupil" data-pupil-id="${pupil.id}" role="button" tabindex="0" aria-label="Show ${escapeHtml(pupil.name)} in full size">${renderHero(pupil)}</div>
        <div>
          <h3>${escapeHtml(pupil.name)}</h3>
          <p class="title-${pupil.title}">${escapeHtml(getItemName("title", pupil.title))} · LVL ${pupil.level}</p>
          <p class="money-balance">${pupil.money} money</p>
        </div>
      </div>

      <form class="rename-form" data-action="rename-pupil">
        <input name="name" value="${escapeHtml(pupil.name)}" aria-label="Rename student" />
        <button type="submit">Rename</button>
      </form>

      <div class="stat-line">
        <span>XP</span>
        <strong>${progress.current}/${progress.needed}</strong>
      </div>
      <div class="xp-track large"><span style="width:${progress.percent}%"></span></div>

      <div class="hp-controls">
        <span>HP ${pupil.hp}/${pupil.maxHp}</span>
        <button type="button" data-action="hp-minus">-1</button>
        <button type="button" data-action="hp-plus">+1</button>
      </div>

      <div class="money-actions">
        <span>Teacher money</span>
        ${renderMoneyButtons("award-money")}
      </div>

      ${renderRewards(pupil)}

      <button class="danger" type="button" data-action="remove-pupil">Remove student</button>
    </details>

    <details class="panel-section">
      <summary>Hero shop</summary>
      ${renderShop(pupil)}
    </details>
  `;
}

function renderRewards(pupil) {
  const unlockedThisLevel = getRewardsForLevel(pupil.level);
  const next = getNextReward(pupil.level);

  return `
    <div class="rewards">
      <h4>Rewards</h4>
      ${unlockedThisLevel.length
        ? unlockedThisLevel.map((reward) => `<span>${escapeHtml(reward)}</span>`).join("")
        : `<p class="muted">No new unlock at this level.</p>`}
      ${next
        ? `<p class="muted next-reward">Next at LVL ${next.level}: ${next.rewards.map(escapeHtml).join(", ")}</p>`
        : `<p class="muted next-reward">Max rewards unlocked!</p>`}
    </div>
  `;
}

function renderShop(pupil) {
  const active = SHOP_CATEGORIES.find((category) => category.type === shopCategory) || SHOP_CATEGORIES[0];
  return `
    <div class="shop">
      <p class="muted">Buy once, equip anytime.</p>
      <div class="shop-tabs">
        ${SHOP_CATEGORIES.map((category) => (
          `<button type="button" class="shop-tab ${category.type === active.type ? "active" : ""}" data-action="shop-category" data-category="${category.type}">${category.label}</button>`
        )).join("")}
      </div>
      <div class="shop-items">
        ${getShopItems(active.type).map((item) => renderShopItem(item, pupil)).join("")}
      </div>
    </div>
  `;
}

function renderShopItem(item, pupil) {
  const field = item.type === "outfit" ? "skin" : item.type;
  const equipped = pupil[field] === item.id;
  const owned = isItemOwned(pupil, item.id);
  const locked = pupil.level < item.minLevel;
  const affordable = canBuyItem(pupil, item);
  let label = "Buy";
  let disabled = "";
  if (equipped) { label = "Equipped"; disabled = "disabled"; }
  else if (owned) label = "Equip";
  else if (locked) { label = `LVL ${item.minLevel}`; disabled = "disabled"; }
  else if (!affordable) { label = `${item.price} money`; disabled = "disabled"; }
  else label = `Buy ${item.price}`;

  return `
    <article class="shop-item ${equipped ? "equipped" : ""} ${locked ? "locked" : ""}">
      <button class="shop-thumb-button" type="button" data-action="preview-item" data-item-id="${item.id}" aria-label="Preview ${escapeHtml(item.name)}">
        ${renderItemThumb(item)}
      </button>
      <div class="shop-item-info">
        <strong>${escapeHtml(item.name)}</strong>
        <small>LVL ${item.minLevel} · ${item.price ? `${item.price} money` : "Free"}</small>
      </div>
      <button type="button" data-action="shop-item" data-item-id="${item.id}" ${disabled}>${label}</button>
    </article>
  `;
}

function renderItemThumb(item) {
  if (item.type === "title") {
    return `<span class="title-badge title-${item.id}">${escapeHtml(item.name)}</span>`;
  }
  return `<span class="shop-thumb">${renderItemArt(item)}</span>`;
}

function renderItemModal(item, pupil) {
  const typeLabel = { outfit: "Outfit", hat: "Hat", weapon: "Item", face: "Face", hair: "Hair", title: "Title" }[item.type] || "Item";
  const field = item.type === "outfit" ? "skin" : item.type;
  const equipped = pupil[field] === item.id;
  const owned = isItemOwned(pupil, item.id);
  const locked = pupil.level < item.minLevel;
  const status = equipped
    ? "Equipped"
    : owned
      ? "Owned"
      : locked
        ? `Unlocks at LVL ${item.minLevel}`
        : "Available to buy";

  const visual = item.type === "title"
    ? `<div class="preview-stage"><span class="title-badge big title-${item.id}">${escapeHtml(item.name)}</span></div>`
    : `<div class="preview-stage">${renderItemArt(item)}</div>`;

  return `
    <div class="modal-backdrop">
      <div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(item.name)}">
        <button class="modal-close" type="button" data-action="close-preview" aria-label="Close preview">×</button>
        <h3>${escapeHtml(item.name)}</h3>
        <p class="muted">${typeLabel} · LVL ${item.minLevel} · ${item.price ? `${item.price} money` : "Free"}</p>
        ${visual}
        <p class="muted status">${status}</p>
      </div>
    </div>
  `;
}

/* Vue « en grand » d'un élève : pensée pour être projetée au tableau, donc
   grande figure et chiffres lisibles du fond de la classe. Lecture seule —
   les actions restent dans la console, on ne modifie rien par mégarde en
   montrant un héros à toute la classe. */
function renderPupilModal(pupil) {
  const progress = xpProgress(pupil);
  const next = getNextReward(pupil.level);
  const gear = [
    ["Outfit", getItemName("outfit", pupil.skin)],
    ["Hat", getItemName("hat", pupil.hat)],
    ["Item", getItemName("weapon", pupil.weapon)],
    ["Hair", getItemName("hair", pupil.hair)],
    ["Face", getItemName("face", pupil.face)]
  ];

  return `
    <div class="modal-backdrop">
      <div class="modal pupil-modal ${isEliminated(pupil) ? "eliminated" : ""}" role="dialog" aria-modal="true" aria-label="${escapeHtml(pupil.name)}">
        <button class="modal-close" type="button" data-action="close-preview" aria-label="Close">×</button>
        <div class="pupil-modal-stage">
          ${renderHero(pupil)}
          ${isEliminated(pupil) ? `<div class="out-badge">OUT</div>` : ""}
        </div>
        <div class="pupil-modal-info">
          <div class="pupil-modal-head">
            <h3>${escapeHtml(pupil.name)}</h3>
            <span class="level-badge big">LVL ${pupil.level}</span>
          </div>
          <p class="title title-${pupil.title}">${escapeHtml(getItemName("title", pupil.title))}</p>

          <div class="hp-row big" aria-label="${pupil.hp} hit points out of ${pupil.maxHp}">${renderHpHearts(pupil)}</div>

          <div class="xp-track large"><span style="width:${progress.percent}%"></span></div>
          <div class="xp-label">${progress.current}/${progress.needed} XP</div>

          <div class="money-badge big"><span>Money</span>${renderCoinIcon()}<strong>${pupil.money}</strong></div>

          <dl class="gear-list">
            ${gear.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
          </dl>

          <p class="muted next-reward">${next
            ? `Next at LVL ${next.level}: ${next.rewards.map(escapeHtml).join(", ")}`
            : "Max rewards unlocked!"}</p>
        </div>
      </div>
    </div>
  `;
}

function openPupilView(pupilId) {
  const pupil = getPupilById(state, pupilId);
  if (!pupil) return;
  modalRoot.innerHTML = renderPupilModal(pupil);
  modalRoot.querySelector(".modal-backdrop")?.addEventListener("click", closePreview);
  modalRoot.querySelector(".modal")?.addEventListener("click", (event) => event.stopPropagation());
  modalRoot.querySelector("[data-action='close-preview']")?.addEventListener("click", closePreview);
}

function openPreview(itemId) {
  const pupilId = getShopPupilId();
  const pupil = pupilId ? getPupilById(state, pupilId) : null;
  const item = getShopItem(itemId);
  if (!pupil || !item) return;
  modalRoot.innerHTML = renderItemModal(item, pupil);
  modalRoot.querySelector(".modal-backdrop")?.addEventListener("click", closePreview);
  modalRoot.querySelector(".modal")?.addEventListener("click", (event) => event.stopPropagation());
  modalRoot.querySelector("[data-action='close-preview']")?.addEventListener("click", closePreview);
}

function closePreview() {
  modalRoot.innerHTML = "";
}

function renderNoSelection() {
  return `
    <details class="panel-section no-selection" open>
      <summary>Selected hero</summary>
      <p class="muted">Tap a character on the board to manage their XP, HP, money and shop.</p>
    </details>
  `;
}

function renderEvent(event) {
  const time = new Date(event.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `
    <p class="event-line">
      <span>${time}</span>
      ${escapeHtml(event.reason)} ${event.amount > 0 ? "+" : ""}${event.amount}
    </p>
  `;
}

function renderHpHearts(pupil) {
  return Array.from({ length: pupil.maxHp }, (_, index) => (
    renderHeartIcon(index < pupil.hp)
  )).join("");
}

function bindEvents() {
  app.querySelector("[data-action='show-rules']")?.addEventListener("click", () => {
    navigate("#rules");
  });

  app.querySelector("[data-action='show-board']")?.addEventListener("click", () => {
    navigate("#board");
  });

  app.querySelectorAll("[data-action='show-student']").forEach((button) => {
    button.addEventListener("click", () => {
      navigate("#student");
    });
  });

  app.querySelectorAll("[data-action='student-pick']").forEach((card) => {
    const pick = () => {
      rememberStudent(card.dataset.pupilId);
      render();
      window.scrollTo(0, 0);
    };
    card.addEventListener("click", pick);
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      pick();
    });
  });

  app.querySelector("[data-action='change-hero']")?.addEventListener("click", () => {
    rememberStudent(null);
    render();
  });

  app.querySelectorAll("[data-action='select-class']").forEach((button) => {
    button.addEventListener("click", () => {
      commit(
        { ...state, activeClassId: button.dataset.classId, selectedPupilId: null, selectedPupilIds: [] },
        { record: false }
      );
    });
  });

  app.querySelectorAll("[data-action='select-pupil']").forEach((card) => {
    card.addEventListener("click", () => {
      if (state.selectMode) {
        commit(toggleSelection(state, card.dataset.pupilId), { record: false });
      } else {
        commit({ ...state, selectedPupilId: card.dataset.pupilId }, { record: false });
      }
    });
  });

  app.querySelectorAll("[data-action='zoom-pupil']").forEach((zone) => {
    const open = () => {
      if (state.selectMode) return;   // en sélection multiple, le clic coche
      openPupilView(zone.dataset.pupilId);
    };
    zone.addEventListener("click", open);
    zone.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      commit({ ...state, selectedPupilId: zone.dataset.pupilId }, { record: false });
      openPupilView(zone.dataset.pupilId);
    });
  });

  app.querySelector("[data-action='toggle-select-mode']")?.addEventListener("click", () => {
    commit(setSelectMode(state, !state.selectMode), { record: false });
  });

  app.querySelector("[data-action='select-all']")?.addEventListener("click", () => {
    commit(selectAllInClass(state, state.activeClassId), { record: false });
  });

  app.querySelector("[data-action='clear-selection']")?.addEventListener("click", () => {
    commit(clearSelection(state), { record: false });
  });

  app.querySelector("[data-action='bulk-hp-minus']")?.addEventListener("click", () => {
    commit(changeHpMany(state, state.selectedPupilIds, -1));
  });

  app.querySelector("[data-action='bulk-hp-plus']")?.addEventListener("click", () => {
    commit(changeHpMany(state, state.selectedPupilIds, 1));
  });

  app.querySelectorAll("[data-action='bulk-money']").forEach((button) => {
    button.addEventListener("click", () => {
      commit(awardMoney(state, state.selectedPupilIds, Number(button.dataset.amount), "Teacher money"));
    });
  });

  app.querySelector("[data-action='add-pupil']")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    commit(addPupil(state, state.activeClassId, {
      name: String(form.get("name") || ""),
      gender: String(form.get("gender") || "boy"),
      skinTone: String(form.get("skinTone") || "light")
    }));
  });

  app.querySelectorAll("[data-action='award-xp']").forEach((button) => {
    button.addEventListener("click", () => {
      const targets = getXpTargets();
      if (!targets.length) {
        showToast("Select at least one character first.", "info");
        return;
      }
      commit(awardXp(state, targets, Number(button.dataset.amount), button.dataset.reason));
    });
  });

  app.querySelector("[data-action='custom-xp']")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const targets = getXpTargets();
    if (!targets.length) {
      showToast("Select at least one character first.", "info");
      return;
    }
    const amount = Number(new FormData(event.currentTarget).get("amount"));
    commit(awardXp(state, targets, amount, "Custom XP"));
  });

  app.querySelector("[data-action='xp-all']")?.addEventListener("click", () => {
    const classroom = getCurrentClass(state);
    const input = app.querySelector(".custom-xp input[name='amount']");
    commit(awardXp(state, classroom.pupils.map((pupil) => pupil.id), Number(input?.value || 0), "Class XP"));
  });

  app.querySelector("[data-action='money-all']")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const classroom = getCurrentClass(state);
    const amount = Number(new FormData(event.currentTarget).get("amount"));
    commit(awardMoney(state, classroom.pupils.map((pupil) => pupil.id), amount, "Class money"));
  });

  app.querySelector("[data-action='heal-all']")?.addEventListener("click", () => {
    commit(restoreHpAll(state, state.activeClassId));
  });

  app.querySelector("[data-action='hp-minus']")?.addEventListener("click", () => {
    commit(changeHp(state, state.selectedPupilId, -1));
  });

  app.querySelector("[data-action='hp-plus']")?.addEventListener("click", () => {
    commit(changeHp(state, state.selectedPupilId, 1));
  });

  app.querySelector("[data-action='rename-pupil']")?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.selectedPupilId) return;
    const name = new FormData(event.currentTarget).get("name");
    commit(renamePupil(state, state.selectedPupilId, String(name || "")));
  });

  app.querySelectorAll("[data-action='award-money']").forEach((button) => {
    button.addEventListener("click", () => {
      commit(awardMoney(state, [state.selectedPupilId], Number(button.dataset.amount), "Teacher money"));
    });
  });

  app.querySelectorAll("[data-action='shop-category']").forEach((button) => {
    button.addEventListener("click", () => {
      shopCategory = button.dataset.category;
      const panel = app.querySelector(".control-panel");
      const scrollTop = panel?.scrollTop ?? 0;
      render();
      const nextPanel = app.querySelector(".control-panel");
      if (nextPanel) nextPanel.scrollTop = scrollTop;
    });
  });

  app.querySelectorAll("[data-action='preview-item']").forEach((button) => {
    button.addEventListener("click", () => {
      openPreview(button.dataset.itemId);
    });
  });

  app.querySelectorAll("[data-action='shop-item']").forEach((button) => {
    button.addEventListener("click", () => {
      const itemId = button.dataset.itemId;
      const pupil = getPupilById(state, getShopPupilId());
      const item = getShopItem(itemId);
      if (!pupil || !item) return;
      if (isItemOwned(pupil, itemId)) {
        commit(updateCosmetics(state, pupil.id, { [item.type]: itemId }));
        showToast(`${item.name} equipped.`, "success");
      } else {
        const next = purchaseItem(state, pupil.id, itemId);
        if (next === state) {
          showToast("This item is locked or needs more money.", "error");
        } else {
          commit(next);
          showToast(`${item.name} unlocked!`, "levelup");
        }
      }
    });
  });

  app.querySelector("[data-action='remove-pupil']")?.addEventListener("click", () => {
    const pupil = getPupilById(state, state.selectedPupilId);
    if (pupil && confirm(`Remove ${pupil.name}?`)) {
      commit(removePupil(state, pupil.id));
    }
  });

  app.querySelector("[data-action='undo']")?.addEventListener("click", () => {
    undo();
  });

  app.querySelector("[data-action='import']")?.addEventListener("click", () => {
    app.querySelector("#import-file")?.click();
  });

  app.querySelector("#import-file")?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then(handleImport).catch(() => showToast("Could not read the file.", "error"));
    event.target.value = "";
  });

  app.querySelector("[data-action='export']")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "game-of-more-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("Data exported.", "success");
  });

  app.querySelector("[data-action='reset-all']")?.addEventListener("click", () => {
    if (!confirm("Reset ALL data? This erases every class, student and reward.")) return;
    commit(createInitialState());
    showToast("Data reset.", "info");
  });
}

function commit(nextState, { record = true, notify = true } = {}) {
  const previous = state;
  if (record) {
    history.push(previous);
    if (history.length > 60) history.shift();
  }
  state = nextState;

  if (notify) {
    const changes = describeChanges(previous, state);
    changes.levelUps.forEach((message) => showToast(message, "levelup"));
    changes.eliminations.forEach((message) => showToast(message, "warn"));
    changes.revives.forEach((message) => showToast(message, "success"));
  }

  saveAndRender();
}

function undo() {
  if (!history.length) {
    showToast("Nothing to undo.", "info");
    return;
  }
  state = history.pop();
  saveAndRender();
}

function describeChanges(previous, next) {
  const levelUps = [];
  const eliminations = [];
  const revives = [];

  for (const classroom of next.classes) {
    for (const pupil of classroom.pupils) {
      const before = getPupilById(previous, pupil.id);
      if (!before) continue;

      if (before.level < pupil.level) {
        const rewards = [];
        for (let level = before.level + 1; level <= pupil.level; level += 1) {
          rewards.push(...getRewardsForLevel(level));
        }
        const uniqueRewards = [...new Set(rewards)];
        const rewardText = uniqueRewards.length ? ` Unlocked: ${uniqueRewards.join(", ")}.` : "";
        levelUps.push(`${pupil.name} reached level ${pupil.level}!${rewardText}`);
      }
      if (before.hp > 0 && pupil.hp <= 0) {
        eliminations.push(`${pupil.name} is out of HP!`);
      }
      if (before.hp <= 0 && pupil.hp > 0) {
        revives.push(`${pupil.name} is back in the game!`);
      }
    }
  }

  return { levelUps, eliminations, revives };
}

function handleImport(text) {
  try {
    const imported = importState(text);
    const total = imported.classes.reduce((sum, classroom) => sum + classroom.pupils.length, 0);
    commit(imported, { record: true, notify: false });
    showToast(`Import successful: ${total} heroes.`, "success");
  } catch (error) {
    showToast(error.message, "error");
  }
}

function showToast(message, kind = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${kind}`;
  toast.textContent = message;
  toasts.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

function saveAndRender() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    showToast("Could not save data (storage full or unavailable).", "error");
  }
  scheduleServerSave();
  render();
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createInitialState();

  try {
    return normalizeState(JSON.parse(raw));
  } catch {
    showToast("Saved data was invalid, starting fresh.", "error");
    return createInitialState();
  }
}

// ---- Server persistence ---------------------------------------------
// The app is served by the same origin as the backend, so the API lives at
// /api/state. If it is unreachable (offline, or running the static file
// locally), we silently keep using localStorage only.

function scheduleServerSave() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    saveToServer();
  }, 300);
}

async function saveToServer() {
  try {
    const response = await fetch(apiUrl("state"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state)
    });
    if (!response.ok) throw new Error(`save failed: ${response.status}`);
  } catch {
    // Offline or no backend: data stays in localStorage and will be pushed
    // on the next successful load.
  }
}

async function bootstrapFromServer() {
  try {
    const response = await fetch(apiUrl("state"), { cache: "no-store" });
    if (response.status === 404) {
      // Nothing stored server-side yet: push the local state up as a seed.
      saveToServer();
      return;
    }
    if (!response.ok) return;
    const remote = await response.json();
    if (!remote || !Array.isArray(remote.classes)) return;
    state = normalizeState(remote);
    history = [];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore cache write failures; the server copy is authoritative.
    }
    render();
  } catch {
    // Offline: keep whatever localStorage had.
  }
}

function getItemName(type, id) {
  return getShopItems(type).find((item) => item.id === id)?.name || "Rookie";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();

// Pull the server copy on startup (authoritative) after the local first paint.
// Falls back to localStorage when the backend is unreachable or empty.
bootstrapFromServer();
