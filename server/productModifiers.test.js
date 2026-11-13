const assert = require('assert');
const {
  doublesDefaultModifierGroups,
  streetFoodDefaultModifierGroups,
  defaultModifierGroupsForStarter,
  parseModifierGroups,
  validateModifierSelection,
  sumModifierDeltas,
  formatSelectedModifiers,
  normalizeOrderLineItems,
  lineSubtotalCents,
} = require('./productModifiers');

const doubles = doublesDefaultModifierGroups();
assert.ok(doubles.some((g) => g.id === 'pepper'));
assert.ok(doubles.some((g) => g.id === 'chutneys'));
const pepper = doubles.find((g) => g.id === 'pepper');
assert.strictEqual(pepper.mode, 'single');
assert.ok(pepper.options.some((o) => /Slight/i.test(o.label)));
const chutney = doubles.find((g) => g.id === 'chutneys');
assert.ok(chutney.options.some((o) => /chadon beni/i.test(o.label)));
assert.ok(chutney.options.every((o) => o.priceDelta === 0));

const street = streetFoodDefaultModifierGroups();
assert.ok(street.some((g) => g.id === 'size'));
assert.ok(street.some((g) => g.id === 'spice'));
assert.deepStrictEqual(defaultModifierGroupsForStarter('food'), []);
assert.strictEqual(defaultModifierGroupsForStarter('doubles').length, doubles.length);

assert.deepStrictEqual(parseModifierGroups(null), []);
assert.deepStrictEqual(parseModifierGroups([{ id: 'x', name: 'X', options: [] }]), []);

const selected = [
  { groupId: 'pepper', groupName: 'Pepper', optionId: 'pepper_medium', optionLabel: 'Medium', priceDelta: 0 },
  { groupId: 'chutneys', groupName: 'Chutneys & sauces', optionId: 'tamarind', optionLabel: 'Tamarind', priceDelta: 1 },
];
assert.strictEqual(validateModifierSelection(doubles, selected).ok, true);
assert.strictEqual(validateModifierSelection(doubles, []).ok, false);
assert.strictEqual(sumModifierDeltas(selected), 1);
assert.ok(formatSelectedModifiers(selected).includes('Pepper: Medium'));

const lines = normalizeOrderLineItems([
  { name: 'Doubles', price: 10, quantity: 2, selected_modifiers: selected },
]);
assert.strictEqual(lines[0].unit_price_with_modifiers, 11);
assert.strictEqual(lineSubtotalCents(lines), 2200);
assert.ok(lines[0].modifiers_label.includes('Tamarind'));

console.log('productModifiers.test.js OK');
