/**
 * Generic product option-group (modifiers) system for island niche menus.
 * Doubles condiments, street-food sizes/spice/add-ons — merchant-editable defaults.
 * No invented prices on catalog items; option add-on price defaults to 0.
 */

export type ModifierSelectMode = 'single' | 'multi';

export interface ProductModifierOption {
  id: string;
  label: string;
  /** Add-on in major currency units (TT$). Default 0. */
  priceDelta?: number;
  soldOut?: boolean;
}

export interface ProductModifierGroup {
  id: string;
  name: string;
  mode: ModifierSelectMode;
  required?: boolean;
  /** single: one of these ids; multi: zero or more */
  options: ProductModifierOption[];
  /** Hint for UI — e.g. levels for pepper */
  ui?: 'chips' | 'levels' | 'checkboxes';
}

/** Chosen selections on a cart / order line */
export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionLabel: string;
  priceDelta: number;
}

export function sumModifierDeltas(selected: SelectedModifier[] | undefined): number {
  return (selected || []).reduce((s, row) => s + (Number(row.priceDelta) || 0), 0);
}

export function formatSelectedModifiers(selected: SelectedModifier[] | undefined): string {
  if (!selected?.length) return '';
  const byGroup = new Map<string, string[]>();
  for (const row of selected) {
    const list = byGroup.get(row.groupName) || [];
    list.push(row.optionLabel);
    byGroup.set(row.groupName, list);
  }
  return Array.from(byGroup.entries())
    .map(([g, opts]) => `${g}: ${opts.join(', ')}`)
    .join(' · ');
}

/** Editable defaults for a doubles wrap — labels only, prices 0 unless merchant sets. */
export function doublesDefaultModifierGroups(): ProductModifierGroup[] {
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

/** Street food: size + spice + add-ons */
export function streetFoodDefaultModifierGroups(): ProductModifierGroup[] {
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

export function defaultModifierGroupsForStarter(starterId: string): ProductModifierGroup[] {
  if (starterId === 'doubles') return doublesDefaultModifierGroups();
  if (starterId === 'street_food') return streetFoodDefaultModifierGroups();
  return [];
}

export function validateModifierSelection(
  groups: ProductModifierGroup[],
  selected: SelectedModifier[],
): { ok: true } | { ok: false; error: string } {
  for (const g of groups) {
    const picks = selected.filter((s) => s.groupId === g.id);
    if (g.required && picks.length === 0) {
      return { ok: false, error: `Choose ${g.name}` };
    }
    if (g.mode === 'single' && picks.length > 1) {
      return { ok: false, error: `${g.name} allows one choice` };
    }
  }
  return { ok: true };
}

/** Normalize merchant JSON into groups (fail soft). */
export function parseModifierGroups(raw: unknown): ProductModifierGroup[] {
  if (!Array.isArray(raw)) return [];
  const out: ProductModifierGroup[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const id = String(r.id || '').trim();
    const name = String(r.name || '').trim();
    if (!id || !name) continue;
    const mode = r.mode === 'multi' ? 'multi' : 'single';
    const optionsRaw = Array.isArray(r.options) ? r.options : [];
    const options: ProductModifierOption[] = [];
    for (const opt of optionsRaw) {
      if (!opt || typeof opt !== 'object') continue;
      const o = opt as Record<string, unknown>;
      const oid = String(o.id || '').trim();
      const label = String(o.label || '').trim();
      if (!oid || !label) continue;
      const priceDelta = Number(o.priceDelta ?? o.price_delta ?? 0);
      options.push({
        id: oid,
        label,
        priceDelta: Number.isFinite(priceDelta) ? priceDelta : 0,
        soldOut: !!o.soldOut,
      });
    }
    if (!options.length) continue;
    out.push({
      id,
      name,
      mode,
      required: !!r.required,
      options,
      ui: r.ui === 'levels' || r.ui === 'checkboxes' || r.ui === 'chips' ? r.ui : undefined,
    });
  }
  return out;
}


/** Normalize order-line items so selected modifiers travel with the line (API + COD views). */
export function normalizeOrderLineItems(items: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(items)) return [];
  return items.map((row) => {
    const r = (row && typeof row === 'object' ? row : {}) as Record<string, unknown>;
    const raw = r.selected_modifiers ?? r.selectedModifiers;
    const selected = Array.isArray(raw) ? (raw as SelectedModifier[]) : [];
    const cleaned: SelectedModifier[] = selected
      .filter((s) => s && s.groupId && s.optionId)
      .map((s) => ({
        groupId: String(s.groupId),
        groupName: String(s.groupName || s.groupId),
        optionId: String(s.optionId),
        optionLabel: String(s.optionLabel || s.optionId),
        priceDelta: Number(s.priceDelta) || 0,
      }));
    const base = Number(r.price) || 0;
    const unit = base + sumModifierDeltas(cleaned);
    return {
      ...r,
      price: base,
      unit_price_with_modifiers: unit,
      quantity: Number(r.quantity || 1),
      selected_modifiers: cleaned,
      modifiers_label: formatSelectedModifiers(cleaned),
    };
  });
}

export function lineSubtotalCents(items: unknown): number {
  return normalizeOrderLineItems(items).reduce(
    (s, i) => s + Math.round(Number(i.unit_price_with_modifiers) * 100) * Number(i.quantity || 1),
    0,
  );
}
