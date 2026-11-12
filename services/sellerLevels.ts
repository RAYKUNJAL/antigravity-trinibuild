/** Client types for GET /api/seller/level. Computation lives in server/sellerLevels.js. */
export type SellerLevelId = 'starter' | 'rising' | 'pro' | 'market_leader';

export interface SellerLevelResponse {
  store_id?: string;
  slug?: string;
  name?: string;
  level: SellerLevelId;
  label: string;
  wam_verified?: boolean;
  verified_badge_free: boolean;
  earned_not_bought: boolean;
  refuse_rate: number;
  confirm_dispatch_rate: number | null;
  tenth_order_prompt: string | null;
  next: SellerLevelId | null;
  next_label: string | null;
  next_reasons: string[];
  stats: {
    completedOrders: number;
    completedOrders90d: number;
    refusedOrders: number;
    decidedOrders: number;
    confirmDispatchEligible: number;
    confirmDispatchDone: number;
    onlineGmv90dCents: number;
    wamVerified: boolean;
    reviewCount: number;
    ratingAverage: number | null;
  };
}

export const LEVEL_BLURBS: Record<SellerLevelId, string> = {
  starter: 'Every shop starts here. Unlimited listings, 0% on cash, and a free stall QR sign.',
  rising: 'Earned at 10 completed orders, with a refuse rate under 20%.',
  pro: 'Earned at 25 completed orders when the shop is Wam verified. Confirm-dispatch must be at least 80% when there are COD dispatches to measure.',
  market_leader: 'Earned at 100 completed orders in 90 days, or TT$15,000 in online Wam sales in 90 days, with Wam verified and a refuse rate under 10%.',
};
