/* ============================================================
   rules.mjs — la page projetée en début d'année
   Les règles du jeu sont celles du projet, mot pour mot ; seule leur
   mise en page change, avec les composants réels du plateau pour que
   l'élève apprenne à lire sa carte en lisant les règles.
   ============================================================ */

import { renderCoinIcon, renderHeartIcon } from "../avatar.mjs";
import { escapeHtml, icon, renderLevel } from "../ui.mjs";

const QUICK_REFERENCE = [
  ["Do homework", "+100 XP"],
  ["Learn vocabulary", "+150 XP"],
  ["Be nice", "+50 XP"],
  ["Good grade", "+Coins"],
  ["Bad behaviour", "-1 HP"]
];

export function renderRules() {
  return `
    <article class="rules">
      <header class="rules-head">
        <h1>How does it work?</h1>
        <p class="lede">Every student is a hero with HP, XP and a level.</p>
      </header>

      <section class="rules-section">
        <dl class="rules-stats">
          <div>
            <dt>
              <span class="rules-demo">${Array.from({ length: 5 }, (_, i) => renderHeartIcon(i < 4)).join("")}</span>
              HP — Hit Points
            </dt>
            <dd>Bad behaviour costs HP. Reach 0 and the hero is out until they level up.</dd>
          </div>
          <div>
            <dt>
              <span class="rules-demo"><span class="xp-track"><span class="xp-fill" style="width:62%"></span></span></span>
              XP — Experience
            </dt>
            <dd>Homework, vocabulary and good behaviour earn XP. Level up to unlock rewards.</dd>
          </div>
          <div>
            <dt>
              <span class="rules-demo">${renderCoinIcon()}</span>
              Coins
            </dt>
            <dd>Good grades and nice actions earn coins. Spend them in the hero shop.</dd>
          </div>
          <div>
            <dt>
              <span class="rules-demo">${renderLevel(2)}</span>
              Level up
            </dt>
            <dd>Level up to heal HP and unlock new outfits, hats, items and titles.</dd>
          </div>
        </dl>
      </section>

      <section class="rules-section">
        <h2>Quick reference</h2>
        <table class="rules-table">
          <tbody>
            ${QUICK_REFERENCE.map(([action, result]) => `
              <tr>
                <th scope="row">${escapeHtml(action)}</th>
                <td>${escapeHtml(result)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </section>

      <p class="rules-back">
        <button class="btn btn-primary" type="button" data-action="show-board">${icon("back")}<span>Back to class</span></button>
      </p>
    </article>
  `;
}
