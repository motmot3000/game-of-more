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
  renderEmblem,
  renderCoinIcon,
  renderHeartIcon,
  renderMascot
} from "./avatar.mjs";

const app = document.querySelector("#app");
const toasts = document.querySelector("#toasts");
const modalRoot = document.querySelector("#modal-root");
function apiUrl(path) {
  return new URL(`api/${path}`, document.baseURI).toString();
}

let state = loadState();
let history = [];
let shopCategory = "outfit";
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
  return location.hash === "#rules" ? "rules" : "board";
}

function render() {
  if (currentView() === "rules") {
    renderRulesPage();
    return;
  }

  const classroom = getCurrentClass(state);
  const selectedPupil = state.selectedPupilId ? getPupilById(state, state.selectedPupilId) : null;

  app.innerHTML = `
    <main class="shell">
      <section class="stage" data-density="${classroom.pupils.length > 24 ? "list" : "grid"}">
        <header class="stage-header">
          <div class="brand">
            ${renderEmblem()}
            <div class="brand-text">
              <p class="eyebrow">The hero classroom quest</p>
              <span class="brand-title">GAME <span class="accent">OF MORE</span></span>
            </div>
          </div>
          <nav class="header-nav">
            <div class="class-tabs" role="tablist" aria-label="Classes">
              ${state.classes.map(renderClassTab).join("")}
            </div>
            <button class="rules-button" data-action="show-rules" type="button">Rules</button>
          </nav>
        </header>
        ${renderStats(classroom)}
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
          ${renderEmblem()}
          <div class="brand-text">
            <p class="eyebrow">The hero classroom quest</p>
            <span class="brand-title">GAME <span class="accent">OF MORE</span></span>
          </div>
        </div>
        <button class="rules-button" data-action="show-board" type="button">← Back to class</button>
      </header>
      <div class="rules-content">
        <p class="eyebrow">Rules</p>
        <h1>How does it work?</h1>
        <p class="rules-intro">Every pupil has a character with HP, XP and LVL.</p>

        <ul class="rules-list">
          <li>When you have a <strong>good behaviour</strong>, you get <strong>XP</strong> and <strong>money</strong>.</li>
          <li>When you have a <strong>bad behaviour</strong>, you lose <strong>HP</strong>.</li>
          <li>Everybody starts at <strong>LVL 1</strong> with <strong>5 HP</strong>.</li>
          <li>If you reach <strong>0 HP</strong>, you are <strong>out of the game</strong>!</li>
          <li><strong>Level up</strong> and you get your <strong>HP back</strong>.</li>
          <li>Every level <strong>unlocks new rewards</strong>.</li>
          <li>You can <strong>buy items</strong> with your money.</li>
        </ul>

        <section class="rules-section">
          <h2>How to get XP?</h2>
          <ul class="rules-list">
            <li>Do your homework.</li>
            <li>Learn your vocabulary.</li>
          </ul>
        </section>

        <section class="rules-section">
          <h2>How to get money?</h2>
          <ul class="rules-list">
            <li>Be nice.</li>
            <li>Work well.</li>
          </ul>
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
      <div class="avatar-wrap">
        ${renderHero(pupil)}
        ${isEliminated(pupil) ? `<div class="out-badge">OUT</div>` : ""}
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
      <div class="mini-avatar">${renderHero(pupil)}</div>
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
    ? `— ${targets.length} selected`
    : selectedPupil
      ? `— ${selectedPupil.name}`
      : "";

  return `
    <div class="panel-header">
      <div>
        <p class="eyebrow">Console</p>
        <h2>${escapeHtml(classroom.name)}</h2>
      </div>
      <div class="header-actions">
        <button class="icon-button ${state.selectMode ? "active" : ""}" data-action="toggle-select-mode" title="Select multiple characters" aria-label="Select multiple characters" aria-pressed="${state.selectMode}">☑</button>
        <button class="icon-button" data-action="undo" title="Undo" aria-label="Undo">↺</button>
        <button class="icon-button" data-action="import" title="Import data" aria-label="Import data">⬆</button>
        <button class="icon-button" data-action="export" title="Export data" aria-label="Export data">⬇</button>
      </div>
    </div>

    <form class="add-form" data-action="add-pupil">
      <label for="pupil-name">New student</label>
      <div>
        <input id="pupil-name" name="name" autocomplete="off" placeholder="First name" />
        <button type="submit">Add</button>
      </div>
      <div class="add-fields">
        <label for="pupil-gender">Gender
          <select id="pupil-gender" name="gender">
            <option value="boy">Boy</option>
            <option value="girl">Girl</option>
          </select>
        </label>
        <label for="pupil-tone">Skin
          <select id="pupil-tone" name="skinTone">
            ${SKIN_TONES.map((tone) => `<option value="${tone.id}">${tone.name}</option>`).join("")}
          </select>
        </label>
      </div>
    </form>

    <section class="quick-actions">
      <h3>Quick XP ${targetLabel}</h3>
      <div class="button-grid">
        ${renderXpButton(100, "Homework")}
        ${renderXpButton(150, "Vocabulary")}
        ${renderXpButton(50, "Nice")}
        ${renderXpButton(500, "Bonus")}
      </div>
      <form class="custom-xp" data-action="custom-xp">
        <input name="amount" type="number" min="1" step="10" value="100" aria-label="Custom XP" />
        <button type="submit">Give XP</button>
        <button type="button" data-action="xp-all">Give all</button>
      </form>
      <button class="heal-all" type="button" data-action="heal-all">Heal class HP</button>
    </section>

    ${state.selectMode ? renderBulkPanel(classroom) : selectedPupil ? renderSelectedPupil(selectedPupil) : renderNoSelection()}

    <section class="events">
      <h3>Activity</h3>
      ${state.events.slice(0, 8).map(renderEvent).join("") || "<p class=\"muted\">No activity yet.</p>"}
    </section>

    <section class="danger-zone">
      <button class="danger" type="button" data-action="reset-all">Reset all data</button>
    </section>
  `;
}

function renderBulkPanel(classroom) {
  const ids = state.selectedPupilIds;
  const names = classroom.pupils.filter((pupil) => ids.includes(pupil.id)).map((pupil) => pupil.name);
  const disabled = ids.length ? "" : "disabled";

  return `
    <section class="selected-panel">
      <h3>${ids.length} selected</h3>
      <p class="muted">${names.length ? names.map(escapeHtml).join(", ") : "Tap characters on the board to select them."}</p>

      <div class="stat-line">
        <button type="button" data-action="select-all">Select all in class</button>
        <button type="button" data-action="clear-selection" ${disabled}>Clear selection</button>
      </div>

      <div class="hp-controls">
        <span>Bulk HP</span>
        <button type="button" data-action="bulk-hp-minus" ${disabled}>-1</button>
        <button type="button" data-action="bulk-hp-plus" ${disabled}>+1</button>
      </div>

      <div class="money-actions">
        <span>Teacher money</span>
        <button type="button" data-action="bulk-money" data-amount="5" ${disabled}>+5</button>
        <button type="button" data-action="bulk-money" data-amount="10" ${disabled}>+10</button>
      </div>
    </section>
  `;
}

function renderXpButton(amount, reason) {
  return `
    <button type="button" data-action="award-xp" data-amount="${amount}" data-reason="${reason}">
      +${amount}<span>${reason}</span>
    </button>
  `;
}

function renderSelectedPupil(pupil) {
  const progress = xpProgress(pupil);
  return `
    <section class="selected-panel">
      <div class="selected-top">
        <div class="mini-avatar">${renderHero(pupil)}</div>
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
        <button type="button" data-action="award-money" data-amount="5">+5</button>
        <button type="button" data-action="award-money" data-amount="10">+10</button>
      </div>

      ${renderRewards(pupil)}

      ${renderShop(pupil)}

      <button class="danger" type="button" data-action="remove-pupil">Remove student</button>
    </section>
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
      <h4>Hero shop</h4>
      <p class="muted">Buy an item once, then equip it whenever you want.</p>
      <label class="shop-filter" for="shop-category">Category</label>
      <select id="shop-category" data-action="shop-category">
        ${SHOP_CATEGORIES.map((category) => (
          `<option value="${category.type}" ${category.type === active.type ? "selected" : ""}>${category.label}</option>`
        )).join("")}
      </select>
      <section class="shop-category">
        <h5>${active.label}</h5>
        <div class="shop-items">
          ${getShopItems(active.type).map((item) => renderShopItem(item, pupil)).join("")}
        </div>
      </section>
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

function openPreview(itemId) {
  const pupil = state.selectedPupilId ? getPupilById(state, state.selectedPupilId) : null;
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
    <section class="selected-panel no-selection">
      <h3>Select a character</h3>
      <p>Tap a card on the board to manage their XP, HP, skin and rewards.</p>
    </section>
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

  app.querySelector("[data-action='shop-category']")?.addEventListener("change", (event) => {
    shopCategory = event.currentTarget.value;
    const panel = app.querySelector(".control-panel");
    const scrollTop = panel?.scrollTop ?? 0;
    render();
    const nextPanel = app.querySelector(".control-panel");
    if (nextPanel) nextPanel.scrollTop = scrollTop;
  });

  app.querySelectorAll("[data-action='preview-item']").forEach((button) => {
    button.addEventListener("click", () => {
      openPreview(button.dataset.itemId);
    });
  });

  app.querySelectorAll("[data-action='shop-item']").forEach((button) => {
    button.addEventListener("click", () => {
      const itemId = button.dataset.itemId;
      const pupil = getPupilById(state, state.selectedPupilId);
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
