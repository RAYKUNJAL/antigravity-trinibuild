/** CommonJS mirror of services/productModifiers.ts for node tests. Keep in sync. */

function sumModifierDeltas(selected) {
  return (selected || []).reduce((s, row) => s + (Number(row.priceDelta) || 0), 0);
}

function formatSelectedModifiers(selected) {
  if (!selected || !selected.length) return '';
  const byGroup = new Map();
  for (const row of selected) {
    const list = byGroup.get(row.groupName) || [];
    list.push(row.optionLabel);
    byGroup.set(row.groupName, list);
  }
  return Array.from(byGroup.entries())
    .map(([g, opts]) => `${g}: ${opts.join(', ')}`)
    .join(' · ');
}

function doublesDefaultModifierGroups() {
  return [
    {
      id: 'pepper',
      name: 'Pepper',
      mode: 'single',
      required: true,
      ui: 'levels',
      options: [
        { id: 'pepper_none', label: 'None', priceDelta: 0 },
        { id: 'pepper_slight', label: 'Slight', priceDelta: 0 },
        { id: 'pepper_medium', label: 'Medium', priceDelta: 0 },
        { id: 'pepper_heavy', label: 'Heavy', priceDelta: 0 },
      ],
    },
    {
      id: 'chutneys',
      name: 'Chutneys & sauces',
      mode: 'multi',
      ui: 'checkboxes',
      options: [
        { id: 'chadon_beni', label: 'Shadon beni (chadon beni)', priceDelta: 0 },
        { id: 'tamarind', label: 'Tamarind', priceDelta: 0 },
        { id: 'mango_kuchela', label: 'Mango / kuchela', priceDelta: 0 },
        { id: 'cucumber', label: 'Cucumber', priceDelta: 0 },
        { id: 'coconut', label: 'Coconut chutney', priceDelta: 0 },
        { id: 'sweet_sauce', label: 'Sweet sauce', priceDelta: 0 },
      ],
    },
  ];
}

function streetFoodDefaultModifierGroups() {
  return [
    {
      id: 'size',
      name: 'Size',
      mode: 'single',
      required: true,
      ui: 'chips',
      options: [
        { id: 'size_reg', label: 'Regular', priceDelta: 0 },
        { id: 'size_large', label: 'Large', priceDelta: 0 },
      ],
    },
    {
      id: 'spice',
      name: 'Spice',
      mode: 'single',
      required: true,
      ui: 'levels',
      options: [
        { id: 'spice_mild', label: 'Mild', priceDelta: 0 },
        { id: 'spice_med', label: 'Medium', priceDelta: 0 },
        { id: 'spice_hot', label: 'Hot', priceDelta: 0 },
      ],
    },
    {
      id: 'addons',
      name: 'Add-ons',
      mode: 'multi',
      ui: 'checkboxes',
      options: [
        { id: 'extra_pepper', label: 'Extra pepper', priceDelta: 0 },
        { id: 'extra_sauce', label: 'Extra sauce', priceDelta: 0 },
        { id: 'bread', label: 'Bread on the side', priceDelta: 0 },
      ],
    },
  ];
}

function defaultModifierGroupsForStarter(starterId) {
  if (starterId === 'doubles') return doublesDefaultModifierGroups();
  if (starterId === 'street_food') return streetFoodDefaultModifierGroups();
  return [];
}

function validateModifierSelection(groups, selected) {
  for (const g of groups || []) {
    const picks = (selected || []).filter((s) => s.groupId === g.id);
    if (g.required && picks.length === 0) return { ok: false, error: `Choose ${g.name}` };
    if (g.mode === 'single' && picks.length > 1) return { ok: false, error: `${g.name} allows one choice` };
  }
  return { ok: true };
}

function parseModifierGroups(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const id = String(row.id || '').trim();
    const name = String(row.name || '').trim();
    if (!id || !name) continue;
    const mode = row.mode === 'multi' ? 'multi' : 'single';
    const optionsRaw = Array.isArray(row.options) ? row.options : [];
    const options = [];
    for (const opt of optionsRaw) {
      if (!opt || typeof opt !== 'object') continue;
      const oid = String(opt.id || '').trim();
      const label = String(opt.label || '').trim();
      if (!oid || !label) continue;
      const priceDelta = Number(opt.priceDelta ?? opt.price_delta ?? 0);
      options.push({
        id: oid,
        label,
        priceDelta: Number.isFinite(priceDelta) ? priceDelta : 0,
        soldOut: !!opt.soldOut,
      });
    }
    if (!options.length) continue;
    out.push({
      id,
      name,
      mode,
      required: !!row.required,
      options,
      ui: row.ui === 'levels' || row.ui === 'checkboxes' || row.ui === 'chips' ? row.ui : undefined,
    });
  }
  return out;
}

/** Normalize order-line items so selected modifiers travel with the line. */
function normalizeOrderLineItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((row) => {
    const selected = Array.isArray(row.selected_modifiers)
      ? row.selected_modifiers
      : Array.isArray(row.selectedModifiers)
        ? row.selectedModifiers
        : [];
    const cleaned = selected
      .filter((s) => s && s.groupId && s.optionId)
      .map((s) => ({
        groupId: String(s.groupId),
        groupName: String(s.groupName || s.groupId),
        optionId: String(s.optionId),
        optionLabel: String(s.optionLabel || s.optionId),
        priceDelta: Number(s.priceDelta) || 0,
      }));
    const base = Number(row.price) || 0;
    const unit = base + sumModifierDeltas(cleaned);
    return {
      ...row,
      price: base,
      unit_price_with_modifiers: unit,
      quantity: Number(row.quantity || 1),
      selected_modifiers: cleaned,
      modifiers_label: formatSelectedModifiers(cleaned),
    };
  });
}

function lineSubtotalCents(items) {
  return normalizeOrderLineItems(items).reduce(
    (s, i) => s + Math.round(Number(i.unit_price_with_modifiers) * 100) * Number(i.quantity || 1),
    0,
  );
}

module.exports = {
  sumModifierDeltas,
  formatSelectedModifiers,
  doublesDefaultModifierGroups,
  streetFoodDefaultModifierGroups,
  defaultModifierGroupsForStarter,
  validateModifierSelection,
  parseModifierGroups,
  normalizeOrderLineItems,
  lineSubtotalCents,
};
