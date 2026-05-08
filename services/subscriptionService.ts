/**
 * subscriptionService.ts
 * Free-for-Life accounts + Bank Pay (pay at the bank) subscriptions
 * No credit card required — walk into any T&T bank and pay
 */

import { supabase } from './supabaseClient';

export interface PlanTier {
  slug: string;
  name: string;
  price_ttd: number;
  is_free_for_life: boolean;
  features: string[];
  max_products: number;
  max_stores: number;
  ai_documents: boolean;
  ai_listing: boolean;
}

export interface BankPaymentDetails {
  account_name: string;
  account_number: string;
  bank_name: string;
  branch: string;
  reference_code: string;
  amount_ttd: number;
  plan_name: string;
  months: number;
}

export const BANK_ACCOUNTS = [
  { bank: 'Republic Bank', branch: 'Park Street, Port of Spain', account: '200-456-7890', routing: 'REPBTTPS' },
  { bank: 'First Citizens Bank', branch: 'Frederick Street, Port of Spain', account: '010-234-5678', routing: 'FCIETTPS' },
  { bank: 'Scotiabank T&T', branch: 'Independence Square, Port of Spain', account: '006-123-4567', routing: 'NOSCTTPS' },
  { bank: 'RBC Royal Bank', branch: 'Park Street, Port of Spain', account: '105-789-0123', routing: 'ROYCTTPS' },
];

export const subscriptionService = {
  async getPlans(): Promise<PlanTier[]> {
    const { data } = await supabase.from('plan_tiers').select('*').order('price_ttd');
    return (data || []).map(p => ({ ...p, features: Array.isArray(p.features) ? p.features : JSON.parse(p.features || '[]') }));
  },

  async getUserPlan(user_id: string): Promise<{ plan: PlanTier | null; subscription: Record<string, unknown> | null }> {
    const { data: sub } = await supabase
      .from('user_plan_subscriptions')
      .select('*, plan_tiers(*)')
      .eq('user_id', user_id)
      .single();

    if (!sub) {
      // Auto-create free plan
      await supabase.from('user_plan_subscriptions').upsert({ user_id, plan_slug: 'free', source: 'free', status: 'active' });
      const { data: plans } = await supabase.from('plan_tiers').select('*').eq('slug', 'free').single();
      return { plan: plans, subscription: null };
    }

    return { plan: sub.plan_tiers as PlanTier, subscription: sub };
  },

  generateReferenceCode(user_id: string, plan_slug: string): string {
    const uid = user_id.replace(/-/g, '').substring(0, 6).toUpperCase();
    const plan = plan_slug.toUpperCase().substring(0, 3);
    const ts = Date.now().toString(36).toUpperCase().slice(-4);
    return `TB-${plan}-${uid}-${ts}`;
  },

  async createBankPaymentRequest(
    user_id: string,
    plan_slug: string,
    months: number,
    chosen_bank: string
  ): Promise<BankPaymentDetails> {
    const { data: plan } = await supabase.from('plan_tiers').select('*').eq('slug', plan_slug).single();
    if (!plan) throw new Error('Plan not found');

    const amount_ttd = plan.price_ttd * months;
    const reference_code = this.generateReferenceCode(user_id, plan_slug);
    const period_start = new Date();
    const period_end = new Date(period_start);
    period_end.setMonth(period_end.getMonth() + months);

    const bank = BANK_ACCOUNTS.find(b => b.bank === chosen_bank) || BANK_ACCOUNTS[0];

    const { error } = await supabase.from('bank_subscription_payments').insert({
      user_id,
      plan_slug,
      amount_ttd,
      bank_name: bank.bank,
      branch: bank.branch,
      account_number: bank.account,
      account_name: 'R&R Digital Solutions Ltd',
      reference_code,
      status: 'pending',
      months_paid: months,
      period_start: period_start.toISOString().split('T')[0],
      period_end: period_end.toISOString().split('T')[0],
    });

    if (error) throw error;

    return {
      account_name: 'R&R Digital Solutions Ltd',
      account_number: bank.account,
      bank_name: bank.bank,
      branch: bank.branch,
      reference_code,
      amount_ttd,
      plan_name: plan.name,
      months,
    };
  },

  async submitBankPaymentProof(reference_code: string, proof_url: string, bank_name: string): Promise<void> {
    const { error } = await supabase
      .from('bank_subscription_payments')
      .update({ status: 'submitted', proof_url, bank_name, updated_at: new Date().toISOString() })
      .eq('reference_code', reference_code);
    if (error) throw error;
  },

  async upgradePlanPayPal(user_id: string, plan_slug: string, paypal_subscription_id: string): Promise<void> {
    const now = new Date();
    const expires = new Date(now);
    expires.setMonth(expires.getMonth() + 1);

    const { error } = await supabase.from('user_plan_subscriptions').upsert({
      user_id,
      plan_slug,
      source: 'paypal',
      paypal_subscription_id,
      status: 'active',
      started_at: now.toISOString(),
      expires_at: expires.toISOString(),
    }, { onConflict: 'user_id' });

    if (error) throw error;
  },

  async checkFeatureAccess(user_id: string, feature: keyof PlanTier): Promise<boolean> {
    const { plan } = await this.getUserPlan(user_id);
    if (!plan) return false;
    return !!plan[feature];
  },
};
