/**
 * 🎰 GAMIFICATION ENGINE V2
 * Spin wheel, loyalty points, streaks, badges, mini-games
 * Integrated with Supabase + Claude AI for game logic
 */

import { supabase } from './supabaseClient';
import { aiService } from './aiService';

// ============================================================================
// TYPES
// ============================================================================

export interface UserLoyalty {
  user_id: string;
  total_points: number;
  available_points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  lifetime_purchases: number;
  streak_count: number;
  last_activity: string;
}

export interface SpinWheelResult {
  id: string;
  user_id: string;
  result: 'win' | 'big_win' | 'mega_win' | 'consolation';
  discount_percentage: number;
  coupon_code: string;
  expires_at: string;
  claimed: boolean;
}

export interface DailyStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_login: string;
  freeze_count: number; // Days they can miss and keep streak
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlock_condition: string;
}

export interface MiniGame {
  id: string;
  type: 'scratch_card' | 'lucky_pick' | 'trivia' | 'daily_spin';
  name: string;
  description: string;
  plays_remaining: number;
  max_plays: number;
  reward_type: 'points' | 'coupon' | 'badge';
  reward_amount: number;
}

// ============================================================================
// GAMIFICATION ENGINE
// ============================================================================

class GamificationEngine {
  // =========================================================================
  // LOYALTY POINTS SYSTEM
  // =========================================================================

  async initializeLoyalty(userId: string): Promise<UserLoyalty> {
    try {
      // Idempotent: safe to call on every login. If row exists, returns it; otherwise creates with defaults.
      const { data, error } = await supabase
        .from('user_loyalty_points')
        .upsert(
          {
            user_id: userId,
            total_points: 0,
            available_points: 0,
            tier: 'bronze',
            lifetime_purchases: 0,
            streak_count: 0,
            last_activity: new Date().toISOString(),
          },
          { onConflict: 'user_id', ignoreDuplicates: true }
        )
        .select()
        .maybeSingle();

      if (error && error.code !== '23505') throw error; // 23505 = unique violation, expected on duplicates

      // If ignoreDuplicates returned null, fetch the existing row
      if (!data) {
        const { data: existing, error: fetchErr } = await supabase
          .from('user_loyalty_points')
          .select('*')
          .eq('user_id', userId)
          .single();
        if (fetchErr) throw fetchErr;
        return existing;
      }
      return data;
    } catch (error) {
      console.error('Loyalty init error:', error);
      throw error;
    }
  }

  async addPoints(userId: string, points: number, reason: string): Promise<UserLoyalty> {
    try {
      // Get current loyalty record
      const { data: loyalty, error: fetchError } = await supabase
        .from('user_loyalty_points')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const currentPoints = loyalty?.total_points || 0;
      const newTotal = currentPoints + points;

      // Update loyalty
      const { data, error } = await supabase
        .from('user_loyalty_points')
        .upsert(
          {
            user_id: userId,
            total_points: newTotal,
            available_points: newTotal,
            tier: this.calculateTier(newTotal),
            last_activity: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('loyalty_activities').insert({
        user_id: userId,
        action: 'points_earned',
        points_change: points,
        reason: reason,
        new_balance: newTotal,
        created_at: new Date().toISOString(),
      });

      return data;
    } catch (error) {
      console.error('Add points error:', error);
      throw error;
    }
  }

  async redeemPoints(userId: string, points: number, item: string): Promise<UserLoyalty> {
    try {
      const { data: loyalty, error: fetchError } = await supabase
        .from('user_loyalty_points')
        .select('available_points')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;
      if ((loyalty?.available_points || 0) < points) {
        throw new Error('Insufficient points');
      }

      const newBalance = (loyalty?.available_points || 0) - points;

      const { data, error } = await supabase
        .from('user_loyalty_points')
        .update({ available_points: newBalance })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Log redemption
      await supabase.from('loyalty_activities').insert({
        user_id: userId,
        action: 'points_redeemed',
        points_change: -points,
        reason: `Redeemed for ${item}`,
        new_balance: newBalance,
        created_at: new Date().toISOString(),
      });

      return data;
    } catch (error) {
      console.error('Redeem points error:', error);
      throw error;
    }
  }

  private calculateTier(points: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
    if (points >= 10000) return 'platinum';
    if (points >= 5000) return 'gold';
    if (points >= 2000) return 'silver';
    return 'bronze';
  }

  // =========================================================================
  // SPIN WHEEL SYSTEM
  // =========================================================================

  async spinWheel(userId: string): Promise<SpinWheelResult> {
    try {
      // Check if user spun today (1 spin per day free)
      const today = new Date().toISOString().split('T')[0];
      const { count: spins } = await supabase
        .from('spin_wheel_results')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00`);

      if ((spins || 0) >= 1) {
        throw new Error('Already spun today. Come back tomorrow!');
      }

      // Determine result (weighted probabilities)
      const result = this.determineWheelResult();

      // Generate coupon code
      const couponCode = `SPIN${Date.now().toString(36).toUpperCase()}`;

      // Calculate discount
      const discountMap = {
        consolation: 5,
        win: 10,
        big_win: 20,
        mega_win: 50,
      };

      const discount = discountMap[result];

      // Expire in 7 days
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await supabase
        .from('spin_wheel_results')
        .insert({
          user_id: userId,
          result,
          discount_percentage: discount,
          coupon_code: couponCode,
          expires_at: expiresAt.toISOString(),
          claimed: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Award points on EVERY spin (was only big/mega before — 70% of spins gave nothing)
      const pointsMap = {
        consolation: 10,
        win: 25,
        big_win: 75,
        mega_win: 150,
      };
      try {
        await this.addPoints(userId, pointsMap[result], `Spin wheel: ${result}`);
      } catch (pointsErr) {
        console.warn('Spin reward saved but points failed (non-blocking):', pointsErr);
      }

      return data;
    } catch (error) {
      console.error('Spin wheel error:', error);
      throw error;
    }
  }

  private determineWheelResult(): 'consolation' | 'win' | 'big_win' | 'mega_win' {
    const random = Math.random();

    // 10% mega win, 20% big win, 40% win, 30% consolation
    if (random < 0.1) return 'mega_win';
    if (random < 0.3) return 'big_win';
    if (random < 0.7) return 'win';
    return 'consolation';
  }

  async claimSpinReward(userId: string, spinId: string): Promise<{ success: boolean; coupon: string }> {
    try {
      const { data: spin, error: fetchError } = await supabase
        .from('spin_wheel_results')
        .select('*')
        .eq('id', spinId)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;
      if (spin.claimed) throw new Error('Reward already claimed');

      const { error } = await supabase
        .from('spin_wheel_results')
        .update({ claimed: true })
        .eq('id', spinId);

      if (error) throw error;

      return {
        success: true,
        coupon: spin.coupon_code,
      };
    } catch (error) {
      console.error('Claim reward error:', error);
      throw error;
    }
  }

  // =========================================================================
  // DAILY STREAKS
  // =========================================================================

  async updateLoginStreak(userId: string): Promise<DailyStreak> {
    try {
      const { data: existing } = await supabase
        .from('daily_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      const today = new Date().toISOString().split('T')[0];
      const lastLogin = existing?.last_login?.split('T')[0];

      let newStreak = 1;
      let freezeCount = existing?.freeze_count || 0;

      if (lastLogin === today) {
        // Already logged in today
        newStreak = existing?.current_streak || 1;
      } else if (lastLogin) {
        const lastDate = new Date(lastLogin);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
          // Consecutive day
          newStreak = (existing?.current_streak || 1) + 1;
        } else if (daysDiff > 1 && freezeCount > 0) {
          // Used freeze token
          newStreak = (existing?.current_streak || 1);
          freezeCount--;
        } else {
          // Streak broken
          newStreak = 1;
        }
      }

      const longest = Math.max(newStreak, existing?.longest_streak || 0);

      const { data, error } = await supabase
        .from('daily_streaks')
        .upsert(
          {
            user_id: userId,
            current_streak: newStreak,
            longest_streak: longest,
            last_login: new Date().toISOString(),
            freeze_count: freezeCount,
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;

      // Award points for streaks
      const streakBonus = Math.min(newStreak * 5, 100); // Max 100 points
      await this.addPoints(userId, streakBonus, `${newStreak}-day streak bonus`);

      return data;
    } catch (error) {
      console.error('Update streak error:', error);
      throw error;
    }
  }

  // =========================================================================
  // BADGES & ACHIEVEMENTS
  // =========================================================================

  async unlockBadge(userId: string, badgeCode: string): Promise<boolean> {
    try {
      // Check if already unlocked
      const { count } = await supabase
        .from('achievement_badges')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('badge_id', badgeCode);

      if ((count || 0) > 0) {
        return false; // Already unlocked
      }

      const { error } = await supabase
        .from('achievement_badges')
        .insert({
          user_id: userId,
          badge_id: badgeCode,
          earned_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Award points
      await this.addPoints(userId, 100, `Unlocked ${badgeCode} badge`);

      return true;
    } catch (error) {
      console.error('Unlock badge error:', error);
      throw error;
    }
  }

  // =========================================================================
  // MINI GAMES
  // =========================================================================

  async playScratchCard(userId: string): Promise<{ result: string; reward: number; badge?: string }> {
    try {
      // Check plays remaining
      const { data: game } = await supabase
        .from('mini_games')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'scratch_card')
        .single();

      const plays = game?.plays_remaining || 1;
      if (plays <= 0) {
        throw new Error('No plays remaining. Come back tomorrow!');
      }

      // Determine win
      const isWin = Math.random() < 0.7;
      const reward = isWin ? Math.floor(Math.random() * 50) + 10 : 0;

      // Update plays
      await supabase
        .from('mini_games')
        .update({ plays_remaining: Math.max(0, plays - 1) })
        .eq('user_id', userId)
        .eq('type', 'scratch_card');

      // Award points
      if (reward > 0) {
        await this.addPoints(userId, reward, 'Scratch card win');
      }

      return {
        result: isWin ? 'win' : 'try_again',
        reward,
      };
    } catch (error) {
      console.error('Scratch card error:', error);
      throw error;
    }
  }

  // =========================================================================
  // REFERRAL REWARDS
  // =========================================================================

  async createReferralLink(userId: string): Promise<string> {
    const refCode = `REF${Date.now().toString(36).toUpperCase()}`;

    await supabase.from('referral_rewards').insert({
      referrer_id: userId,
      referral_code: refCode,
      created_at: new Date().toISOString(),
    });

    return `https://trinibuild.com/signup?ref=${refCode}`;
  }

  async redeemReferral(refCode: string, newUserId: string): Promise<boolean> {
    try {
      const { data: referral } = await supabase
        .from('referral_rewards')
        .select('referrer_id')
        .eq('referral_code', refCode)
        .single();

      if (!referral) return false;

      const referrerId = referral.referrer_id;

      // Update referral record
      await supabase
        .from('referral_rewards')
        .update({ referee_id: newUserId, status: 'completed' })
        .eq('referral_code', refCode);

      // Award both parties
      await this.addPoints(referrerId, 500, 'Referral reward');
      await this.addPoints(newUserId, 100, 'Signup bonus from referral');

      return true;
    } catch (error) {
      console.error('Redeem referral error:', error);
      throw error;
    }
  }
}

export const gamificationEngine = new GamificationEngine();
