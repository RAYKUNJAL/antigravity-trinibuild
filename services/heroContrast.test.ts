import assert from 'assert';
import { STORE_STARTERS, STARTER_IDS, type HeroLayout } from './storeStarters';
import { contrastRatio, AA_BODY, compositeOver } from './storeDesignTokens';

/** Layouts whose copy sits on a solid heroBg (or surface) panel after Round 2. */
const ON_HERO_BG: HeroLayout[] = ['split', 'split_reverse', 'desk', 'bleed', 'rail', 'overlay'];
const ON_SURFACE: HeroLayout[] = ['stack', 'card'];

for (const id of STARTER_IDS) {
  const starter = STORE_STARTERS[id];
  const p = starter.palette;
  const hero = contrastRatio(p.heroText, p.heroBg);
  assert.ok(hero >= AA_BODY, `${id} heroText on heroBg ${hero.toFixed(2)} < ${AA_BODY}`);
  const textBg = contrastRatio(p.text, p.bg);
  assert.ok(textBg >= AA_BODY, `${id} text on bg ${textBg.toFixed(2)}`);
  const textSurface = contrastRatio(p.text, p.surface);
  assert.ok(textSurface >= AA_BODY, `${id} text on surface ${textSurface.toFixed(2)}`);
  const mutedBg = contrastRatio(p.muted, p.bg);
  assert.ok(mutedBg >= AA_BODY, `${id} muted on bg ${mutedBg.toFixed(2)}`);
  const mutedSurface = contrastRatio(p.muted, p.surface);
  assert.ok(mutedSurface >= AA_BODY, `${id} muted on surface ${mutedSurface.toFixed(2)}`);

  if (ON_HERO_BG.includes(starter.heroLayout)) {
    const sub = compositeOver(p.heroText, p.heroBg, 0.85);
    const subRatio = contrastRatio(sub, p.heroBg);
    assert.ok(subRatio >= AA_BODY, `${id} hero sub 0.85 on heroBg ${subRatio.toFixed(2)}`);
    const kicker = compositeOver(p.heroText, p.heroBg, 0.7);
    const kickerRatio = contrastRatio(kicker, p.heroBg);
    assert.ok(kickerRatio >= AA_BODY, `${id} hero kicker 0.7 on heroBg ${kickerRatio.toFixed(2)}`);
    const cta = contrastRatio(p.heroBg, p.heroText);
    assert.ok(cta >= AA_BODY, `${id} panel CTA ${cta.toFixed(2)}`);
  }

  if (ON_SURFACE.includes(starter.heroLayout)) {
    // stack/card set kicker and sub to muted at full opacity on surface
    assert.ok(mutedSurface >= AA_BODY, `${id} stack/card muted on surface`);
  }

  console.log(
    `${id.padEnd(14)} layout=${starter.heroLayout.padEnd(14)} hero ${hero.toFixed(2)}:1  text/surface ${textSurface.toFixed(2)}:1  muted/surface ${mutedSurface.toFixed(2)}:1`,
  );
}

console.log('heroContrast.test.ts ok — all 10 starters AA on solid hero panels');
