import assert from 'assert';
import { STARTER_IDS, type StarterId } from '../../services/storeStarters';
import { illustrativeSampleItems } from '../../services/illustrativeSamples';
import type { StorefrontModel } from '../../services/storefrontHonesty';
import { itemsInCategory, categoryDisplayName, decodeCategorySlug } from './CollectionPage';

function model(id: StarterId): StorefrontModel {
  return {
    templateId: id,
    storeName: id,
    mode: 'illustrative',
    items: illustrativeSampleItems(id),
    reviewCount: 0,
  };
}

assert.equal(decodeCategorySlug('The%20rack'), 'The rack');
assert.equal(decodeCategorySlug('Wraps'), 'Wraps');

for (const id of STARTER_IDS) {
  const m = model(id);
  const cats = Array.from(new Set((m.items || []).map((i) => (i.category || '').trim()).filter(Boolean)));
  assert.ok(cats.length > 0, `${id} samples should have categories`);
  for (const cat of cats) {
    const found = itemsInCategory(m, encodeURIComponent(cat));
    assert.ok(found.length > 0, `${id} category ${cat} should have items`);
    assert.equal(categoryDisplayName(m, encodeURIComponent(cat)), cat);
    assert.ok(found.every((i) => (i.category || '').trim() === cat));
  }
  const featured = itemsInCategory(m, 'Featured');
  assert.ok(featured.length >= 1, `${id} featured should have at least one sample`);
  const empty = itemsInCategory(m, 'No-Such-Collection');
  assert.equal(empty.length, 0, `${id} unknown collection is empty`);
}

console.log('CollectionPage.test.ts ok');
