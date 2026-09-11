/**
 * Client locked-copy fallback when /api/onboard/draft or /patch 5xxs or the
 * network drops. Same spirit as vision locked: show the form, do not invent
 * products, mark agentWrote false, tell the merchant Grok did not write.
 */

import {
  STORE_STARTERS,
  isStarterId,
  defaultFaq,
  defaultHowSteps,
  type StarterId,
} from './storeStarters';

export const DRAFT_FAIL_WARNING =
  'Draft failed. Grok is not writing this site. Locked copy is shown instead.';

export const PATCH_FAIL_WARNING =
  'Patch failed. Grok did not change any copy. Locked copy is unchanged.';

export type LockedDraftCopy = {
  templateId: StarterId;
  hero: { headline: string; sub?: string };
  about: string;
  trustChips: string[];
  faq: Array<{ q: string; a: string }>;
  how: Array<{ title: string; body: string }>;
  agentWrote: boolean;
};

export type LockedDraftInput = {
  storeName?: unknown;
  name?: unknown;
  templateId?: unknown;
  type?: unknown;
  chat?: unknown;
  specialty?: unknown;
  island?: unknown;
  hours?: unknown;
  pickupAddress?: unknown;
  acceptsCashPickup?: unknown;
  acceptsCod?: unknown;
  whatsappE164?: unknown;
};

export class OnboardClientError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'OnboardClientError';
    this.status = status;
  }
}

/** Same keyword map as server/onboardDraft.recommendFromText. */
export function recommendStarterFromText(text: string): StarterId {
  const t = String(text || '').toLowerCase();
  if (/\b(roti|doubles|food|cook|bake|menu|kitchen|lunch|dinner|breakfast)\b/.test(t)) return 'food';
  if (/\b(dress|fashion|cloth|boutique|apparel|wear|garment)\b/.test(t)) return 'fashion';
  if (/\b(barber|salon|fade|chair|book|repair|lesson|service)\b/.test(t)) return 'services';
  if (/\b(lipstick|makeup|cosmetic|shade|serum|kit|skincare)\b/.test(t)) return 'beauty';
  if (/\b(sofa|table|furniture|mattress|home decor)\b/.test(t)) return 'home';
  if (/\b(phone|laptop|gadget|electronics|storage|pixel)\b/.test(t)) return 'electronics';
  if (/\b(auto|car|parts|brake|tyre|tire|vehicle)\b/.test(t)) return 'auto';
  return 'general';
}

export function isTransientOnboardFail(status: number | null | undefined): boolean {
  return status == null || status >= 500;
}

export function buildLockedDraft(input: LockedDraftInput): LockedDraftCopy {
  const storeName = String(input.storeName || input.name || '').trim() || 'Your store';
  const rawId = String(input.templateId || input.type || '').trim();
  const templateId = isStarterId(rawId)
    ? rawId
    : recommendStarterFromText(String(input.chat || input.specialty || storeName));
  const starter = STORE_STARTERS[templateId];
  const specialty = String(input.specialty || '').trim();
  const island = String(input.island || '').trim();
  const hours = String(input.hours || '').trim();
  const pickupAddress = String(input.pickupAddress || '').trim();
  const acceptsCashPickup = !!input.acceptsCashPickup;
  const acceptsCod = !!input.acceptsCod;
  const whatsappE164 = String(input.whatsappE164 || '').trim();

  const spec = specialty ? ` ${specialty}.` : '';
  const loc = island ? ` ${island}.` : '';
  const about = `${storeName}.${spec}${loc} ${starter.heroHeadline}`.replace(/\s+/g, ' ').trim();

  const trustChips: string[] = [];
  if (acceptsCashPickup) trustChips.push('Cash / pickup');
  if (acceptsCod) trustChips.push('Cash on delivery');
  if (hours) trustChips.push(hours);
  if (whatsappE164) trustChips.push('WhatsApp');

  return {
    templateId,
    hero: {
      headline: starter.heroHeadline,
      sub: [specialty, island].filter(Boolean).join(' · '),
    },
    about,
    trustChips,
    faq: defaultFaq({
      acceptsPickup: acceptsCashPickup,
      acceptsCod,
      hours,
      pickupAddress,
    }),
    how: defaultHowSteps({
      templateId,
      acceptsPickup: acceptsCashPickup,
      acceptsCod,
    }),
    agentWrote: false,
  };
}

export function resolveDraftResponse(
  status: number | null,
  data: { draft?: LockedDraftCopy; warning?: string; error?: string },
  payload: LockedDraftInput,
): { draft: LockedDraftCopy; warning?: string } {
  if (status != null && status >= 200 && status < 300 && data.draft) {
    return { draft: data.draft, warning: data.warning };
  }
  if (isTransientOnboardFail(status)) {
    return {
      draft: buildLockedDraft(payload),
      warning: data.warning || DRAFT_FAIL_WARNING,
    };
  }
  throw new OnboardClientError(data.error || `Draft failed (${status})`, status as number);
}

export type LockedPatchResult = {
  proposed?: LockedDraftCopy & { hours?: string };
  changedFields: string[];
  conflicts: string[];
  agentWrote: boolean;
  warning?: string;
};

export function resolvePatchResponse(
  status: number | null,
  data: {
    error?: string;
    warning?: string;
    proposed?: LockedPatchResult['proposed'];
    changedFields?: string[];
    conflicts?: string[];
    agentWrote?: boolean;
  },
): LockedPatchResult {
  if (status != null && status >= 200 && status < 300) {
    return {
      proposed: data.proposed,
      changedFields: Array.isArray(data.changedFields) ? data.changedFields : [],
      conflicts: Array.isArray(data.conflicts) ? data.conflicts : [],
      agentWrote: data.agentWrote === true,
      warning: data.warning,
    };
  }
  if (isTransientOnboardFail(status)) {
    return {
      changedFields: [],
      conflicts: [],
      agentWrote: false,
      warning: data.warning || PATCH_FAIL_WARNING,
    };
  }
  throw new OnboardClientError(data.error || `Patch failed (${status})`, status as number);
}
