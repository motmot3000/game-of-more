/* ============================================================
   modals.mjs — les deux seules fenêtres de l'app
   `<dialog>` natif : piège de focus, Esc et fond inerte gratuits, donc
   rien à réinventer.
   ============================================================ */

import { getNextReward, isItemOwned, xpProgress } from "../domain.mjs";
import { renderHero, renderItemArt } from "../avatar.mjs";
import {
  escapeHtml,
  gearOf,
  icon,
  renderHearts,
  renderLevel,
  renderMoney,
  renderOutBadge,
  renderTitle,
  renderXpBar,
  statusClass
} from "../ui.mjs";

const TYPE_LABEL = {
  outfit: "Outfit",
  hat: "Hat",
  weapon: "Item",
  face: "Face",
  hair: "Hair",
  title: "Title"
};

/* Vue « plein tableau » d'un héros : lecture seule. On montre un élève à
   toute la classe sans risquer de modifier ses stats d'un doigt posé. */
export function renderPupilDialog(pupil) {
  const progress = xpProgress(pupil);
  const next = getNextReward(pupil.level);

  return `
    <dialog class="dialog dialog-hero ${statusClass(pupil)}" aria-label="${escapeHtml(pupil.name)}">
      <button class="dialog-close" type="button" data-action="close-dialog" aria-label="Close">${icon("close")}</button>
      <div class="dialog-hero-art">
        ${renderHero(pupil)}
        ${renderOutBadge(pupil)}
      </div>
      <div class="dialog-hero-facts">
        <header class="locker-name">
          <h2>${escapeHtml(pupil.name)}</h2>
          ${renderLevel(pupil.level)}
        </header>
        ${renderTitle(pupil)}
        ${renderHearts(pupil)}
        ${renderXpBar(pupil)}
        <p class="panel-note">${progress.needed - progress.current} XP to level ${pupil.level + 1}.</p>
        ${renderMoney(pupil.money)}
        <dl class="gear">
          ${gearOf(pupil).map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
        </dl>
        <p class="panel-note">${next
          ? `Level ${next.level} unlocks ${next.rewards.map(escapeHtml).join(", ")}.`
          : "Every reward is unlocked."}</p>
      </div>
    </dialog>
  `;
}

export function renderItemDialog(item, pupil) {
  const field = item.type === "outfit" ? "skin" : item.type;
  const equipped = pupil[field] === item.id;
  const owned = isItemOwned(pupil, item.id);
  const locked = pupil.level < item.minLevel;

  const status = equipped
    ? "Worn right now."
    : owned
      ? "Owned. Equip it whenever you like."
      : locked
        ? `Unlocks at level ${item.minLevel}.`
        : `Costs ${item.price} coins. You have ${pupil.money}.`;

  const visual = item.type === "title"
    ? `<span class="title-chip title-chip-lg title-${item.id}">${escapeHtml(item.name)}</span>`
    : renderItemArt(item);

  return `
    <dialog class="dialog dialog-item" aria-label="${escapeHtml(item.name)}">
      <button class="dialog-close" type="button" data-action="close-dialog" aria-label="Close">${icon("close")}</button>
      <div class="dialog-item-art">${visual}</div>
      <h2>${escapeHtml(item.name)}</h2>
      <p class="panel-note">${TYPE_LABEL[item.type] || "Item"} · level ${item.minLevel} · ${item.price ? `${item.price} coins` : "free"}</p>
      <p class="dialog-status">${status}</p>
    </dialog>
  `;
}
