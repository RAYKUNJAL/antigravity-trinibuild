/**
 * 🎰 GAMIFICATION INTEGRATION SERVICE
 * Centralized hook for awarding points, badges, and tracking engagement
 * Use throughout app to reward user actions
 */

import { useEffect, useCallback, useState } from 'react';
import { supabase } from './supabaseClient';
import { gamificationEngine } from '../services/gamificationEngineV2';

// ============================================================================
// ACTION TYPES WITH POINTS
// ============================================================================

export enum GamificationAction {
  // Account & Auth
  SIGNUP = 'signup',
  LOGIN = 'login',
  COMPLETE_PROFILE = 'complete_profile',
  VERIFY_EMAIL = 'verify_email',
  
  // Merchant Actions
  CREATE_STORE = 'create_store',
  ADD_FIRST_PRODUCT = 'add_first_product',
  ADD_PRODUCT = 'add_product',
  CUSTOMIZE_STORE = 'customize_store',
  UPLOAD_LOGO = 'upload_logo',
  
  // Selling Actions
  FIRST_SALE = 'first_sale',
  SALE = 'sale',
  CUSTOMER_REVIEW = 'customer_review',
  RESPOND_TO_REVIEW = 'respond_to_review',
  
  // Engagement
  WRITE_BLOG_POST = 'write_blog_post',
  SHARE_STORE = 'share_store',
  REFER_MERCHANT = 'refer_merchant',
  PLAY_GAME = 'play_game',
  
  // Special Events
  ACHIEVEMENT_UNLOCK = 'achievement_unlock',
}

const POINTS_MAP: Record<GamificationAction, number> = {
  [GamificationAction.SIGNUP]: 50,
  [GamificationAction.LOGIN]: 5,
  [GamificationAction.COMPLETE_PROFILE]: 50,
  [GamificationAction.VERIFY_EMAIL]: 25,
  
  [GamificationAction.CREATE_STORE]: 100,
  [GamificationAction.ADD_FIRST_PRODUCT]: 50,
  [GamificationAction.ADD_PRODUCT]: 10,
  [GamificationAction.CUSTOMIZE_STORE]: 25,
  [GamificationAction.UPLOAD_LOGO]: 25,
  
  [GamificationAction.FIRST_SALE]: 100,
  [GamificationAction.SALE]: 0,
  [GamificationAction.CUSTOMER_REVIEW]: 25,
  [GamificationAction.RESPOND_TO_REVIEW]: 10,
  
  [GamificationAction.WRITE_BLOG_POST]: 75,
  [GamificationAction.SHARE_STORE]: 15,
  [GamificationAction.REFER_MERCHANT]: 500,
  [GamificationAction.PLAY_GAME]: 10,
  
  [GamificationAction.ACHIEVEMENT_UNLOCK]: 0,
};

// ============================================================================
// GAMIFICATION INTEGRATION HOOK
// ============================================================================

export function useGamification() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const awardPoints = useCallback(
    async (action: GamificationAction, customPoints?: number) => {
      if (!userId) return;

      const points = customPoints ?? POINTS_MAP[action];
      const reason = action.replace(/_/g, ' ').toLowerCase();

      try {
        await gamificationEngine.addPoints(userId, points, reason);
        console.log(`✅ Awarded ${points} points for: ${reason}`);
      } catch (error) {
        console.error(`Error awarding points for ${action}:`, error);
      }
    },
    [userId]
  );

  const recordAction = useCallback(
    async (action: GamificationAction, customPoints?: number) => {
      await awardPoints(action, customPoints);
    },
    [awardPoints]
  );

  const tryUnlockBadge = useCallback(
    async (badgeCode: string) => {
      if (!userId) return;

      try {
        const unlocked = await gamificationEngine.unlockBadge(userId, badgeCode);
        if (unlocked) {
          console.log(`🏆 Badge unlocked: ${badgeCode}`);
        }
      } catch (error) {
        console.error(`Error unlocking badge ${badgeCode}:`, error);
      }
    },
    [userId]
  );

  const recordLogin = useCallback(async () => {
    if (!userId) return;

    try {
      const streak = await gamificationEngine.updateLoginStreak(userId);
      console.log(`📅 Streak updated: ${streak.current_streak} days`);
      return streak;
    } catch (error) {
      console.error('Error updating login streak:', error);
    }
  }, [userId]);

  const getOrCreateReferralLink = useCallback(async () => {
    if (!userId) return null;

    try {
      const refLink = await gamificationEngine.createReferralLink(userId);
      console.log(`📱 Referral link created:`, refLink);
      return refLink;
    } catch (error) {
      console.error('Error creating referral link:', error);
      return null;
    }
  }, [userId]);

  return {
    userId,
    awardPoints,
    recordAction,
    tryUnlockBadge,
    recordLogin,
    getOrCreateReferralLink,
  };
}

// ============================================================================
// INITIALIZATION HOOK
// ============================================================================

export function useGamificationInit() {
  useEffect(() => {
    const initializeGamification = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      const userId = user.id;

      try {
        await gamificationEngine.initializeLoyalty(userId);
      } catch (error: any) {
        if (!error.message?.includes('duplicate')) {
          console.error('Error initializing gamification:', error);
        }
      }

      try {
        await gamificationEngine.updateLoginStreak(userId);
      } catch (error) {
        console.error('Error updating login streak:', error);
      }
    };

    initializeGamification();
  }, []);
}

// ============================================================================
// MERCHANT HELPERS
// ============================================================================

export const MerchantGamification = {
  recordStoreCreation: async (userId: string) => {
    await gamificationEngine.addPoints(userId, POINTS_MAP[GamificationAction.CREATE_STORE], 'Created store');
  },

  recordFirstProduct: async (userId: string) => {
    await gamificationEngine.addPoints(userId, POINTS_MAP[GamificationAction.ADD_FIRST_PRODUCT], 'Added first product');
  },

  recordSale: async (userId: string, orderAmount: number) => {
    const orderPoints = Math.floor(orderAmount);
    if (orderPoints > 0) {
      await gamificationEngine.addPoints(userId, orderPoints, `Sale of TT$${orderAmount}`);
    }
  },
};

export type { GamificationAction };
export { POINTS_MAP };
