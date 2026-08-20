import assert from "node:assert/strict";
import test from "node:test";
import { SHOP_ITEMS, createInitialState, getCurrentClass } from "../src/domain.mjs";
import { renderHero, renderItemArt } from "../src/avatar.mjs";

function samplePupil(overrides = {}) {
  return { ...getCurrentClass(createInitialState()).pupils[0], ...overrides };
}

test("renderHero produces unique valid SVG ids for the same pupil", () => {
  const pupil = samplePupil({ id: "7p-1", name: "Alex <hero>" });
  const first = renderHero(pupil);
  const second = renderHero(pupil);
  const ids = [...first.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(ids.length > 0);
  for (const id of ids) {
    assert.match(id, /^[A-Za-z][A-Za-z0-9_-]*$/);
  }
  assert.equal(new Set(ids).size, ids.length);
  assert.notEqual(first, second);
  assert.match(first, /aria-label="Alex &lt;hero&gt; the hero"/);
});

test("numeric pupil ids still produce valid SVG ids", () => {
  const svg = renderHero(samplePupil({ id: "123" }));
  const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(ids.every((id) => /^[A-Za-z]/.test(id)));
});

test("shop item previews render without throwing", () => {
  assert.ok(SHOP_ITEMS.length > 0);
  for (const item of SHOP_ITEMS) {
    const svg = renderItemArt(item);
    assert.match(svg, /^<svg /);
    assert.doesNotMatch(svg, /undefined/);
  }
});
