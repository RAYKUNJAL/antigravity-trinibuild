/**
 * A/B Testing Service
 * 
 * Manages landing page variants for CRO optimization
 * Tests to run (12 weeks):
 * 
 * Week 1-4: Foundation
 * - Hero headline: "Sell Online with COD" vs "Get Your Free T&T Store in 5 Minutes"
 * - Setup GA4, Facebook Pixel, baselines
 * 
 * Week 5-8: Quick Wins
 * - CTA button: Red (#E61E2B) vs Neon Green (#00FF00)
 * - Social proof: Real-time notification vs static testimonials
 * - Hero image: Current vs merchant story video
 * 
 * Week 9-12: Scale & Refine
 * - Merchant video testimonials (60s each)
 * - COD explainer interactive
 * - FAQ videos (2 min each)
 * - Value prop: "Build in 5 min" vs "First order in 5 days"
 */

export interface Variant {
  id: string;
  name: string;
  weight: number; // 0-100, sum should equal 100
  description: string;
}

export interface ABTest {
  testId: string;
  testName: string;
  startDate: Date;
  endDate: Date;
  hypothesis: string;
  variants: Variant[];
  primaryMetric: string;
  minimumSampleSize: number;
  status: 'draft' | 'running' | 'completed' | 'archived';
}

class ABTestingService {
  private currentVariant: string = 'control';
  private variants: Map<string, Variant> = new Map();
  private testHistory: ABTest[] = [];

  constructor() {
    this.initializeVariants();
  }

  /**
   * Initialize default variants
   */
  private initializeVariants() {
    // Default control variant
    this.variants.set('control', {
      id: 'control',
      name: 'Control (Original)',
      weight: 50,
      description: 'Original landing page design'
    });

    // Variant A: Simplified headline
    this.variants.set('variant-a', {
      id: 'variant-a',
      name: 'Simplified Headline',
      weight: 50,
      description: 'Get Your Free T&T Store in 5 Minutes'
    });
  }

  /**
   * Get user's assigned variant from localStorage
   */
  getUserVariant(): string {
    if (typeof window === 'undefined') return 'control';

    // Check if user already has variant assignment
    const storedVariant = localStorage.getItem('ab_test_variant');
    if (storedVariant) {
      return storedVariant;
    }

    // Assign new variant based on weights
    const assignedVariant = this.assignVariant();
    localStorage.setItem('ab_test_variant', assignedVariant);
    localStorage.setItem('ab_test_variant_assigned_at', new Date().toISOString());

    return assignedVariant;
  }

  /**
   * Randomly assign variant based on weights
   */
  private assignVariant(): string {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const [id, variant] of this.variants) {
      cumulative += variant.weight;
      if (random < cumulative) {
        return id;
      }
    }

    return 'control';
  }

  /**
   * Track variant assignment event
   */
  trackVariantAssignment(variant: string) {
    if (typeof window === 'undefined') return;

    // Send to GA4
    if (window.gtag) {
      window.gtag('event', 'ab_test_assigned', {
        'test_id': 'landing_page_hero',
        'variant': variant,
        'variant_name': this.variants.get(variant)?.name || 'unknown'
      });
    }

    // Send to Facebook Pixel
    if (window.fbq) {
      window.fbq('trackCustom', 'ABTestAssigned', {
        'test_id': 'landing_page_hero',
        'variant': variant
      });
    }
  }

  /**
   * Get variant configuration
   */
  getVariantConfig(variant: string): Variant | undefined {
    return this.variants.get(variant);
  }

  /**
   * Create new A/B test
   */
  createTest(test: ABTest): void {
    // Validate variants sum to 100
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) {
      throw new Error(`Variant weights must sum to 100, got ${totalWeight}`);
    }

    // Store test
    this.testHistory.push(test);

    // Update variants
    test.variants.forEach(variant => {
      this.variants.set(variant.id, variant);
    });

    console.log(`✅ A/B Test created: ${test.testName}`);
  }

  /**
   * Get all active tests
   */
  getActiveTests(): ABTest[] {
    return this.testHistory.filter(test => test.status === 'running');
  }

  /**
   * Get test by ID
   */
  getTestById(testId: string): ABTest | undefined {
    return this.testHistory.find(test => test.testId === testId);
  }

  /**
   * Complete test and archive
   */
  completeTest(testId: string, winnerVariant: string, notes: string): void {
    const test = this.getTestById(testId);
    if (test) {
      test.status = 'completed';
      console.log(`✅ Test completed: ${test.testName}, Winner: ${winnerVariant}, Notes: ${notes}`);
    }
  }

  /**
   * Get variant-specific content
   */
  getVariantContent(variant: string, contentKey: string): any {
    const variantContent: Record<string, Record<string, any>> = {
      'control': {
        'hero_headline': 'Sell Online with Cash on Delivery — No Credit Card',
        'hero_subheadline': 'Create your free store in 5 minutes. Add products with AI.',
        'cta_button_color': '#E61E2B', // trini-red
        'cta_button_text': 'Start My Free Store'
      },
      'variant-a': {
        'hero_headline': 'Get Your Free T&T Store in 5 Minutes',
        'hero_subheadline': 'No credit card, no fees. Start selling today.',
        'cta_button_color': '#00FF00', // neon green
        'cta_button_text': 'Create My Store Now'
      }
    };

    return variantContent[variant]?.[contentKey] || variantContent['control'][contentKey];
  }

  /**
   * Generate A/B test report
   */
  generateReport(testId: string, variant: string, metrics: {
    impressions: number;
    signups: number;
    completions: number;
    upgrades: number;
  }) {
    const conversionRate = (metrics.signups / metrics.impressions) * 100;
    const completionRate = (metrics.completions / metrics.signups) * 100;
    const upgradeRate = (metrics.upgrades / metrics.completions) * 100;

    return {
      testId,
      variant,
      ...metrics,
      conversionRate: conversionRate.toFixed(2) + '%',
      completionRate: completionRate.toFixed(2) + '%',
      upgradeRate: upgradeRate.toFixed(2) + '%',
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Initialize week 1-4 foundation tests
   */
  initializeFoundationTests(): void {
    const test1: ABTest = {
      testId: 'hero-headline-w1',
      testName: 'Hero Headline Test (Week 1-4)',
      startDate: new Date(),
      endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      hypothesis: 'Simplified headline increases conversion by 25%',
      variants: [
        {
          id: 'control',
          name: 'Control',
          weight: 50,
          description: 'Sell Online with Cash on Delivery — No Credit Card'
        },
        {
          id: 'variant-a',
          name: 'Simplified',
          weight: 50,
          description: 'Get Your Free T&T Store in 5 Minutes'
        }
      ],
      primaryMetric: 'signup_conversion_rate',
      minimumSampleSize: 1000,
      status: 'running'
    };

    this.createTest(test1);
  }

  /**
   * Get variant stats for dashboard
   */
  getVariantStats(testId: string): Record<string, any> {
    const test = this.getTestById(testId);
    if (!test) return {};

    return {
      testId,
      testName: test.testName,
      status: test.status,
      variants: test.variants.map(v => ({
        id: v.id,
        name: v.name,
        weight: v.weight
      })),
      primaryMetric: test.primaryMetric,
      minimumSampleSize: test.minimumSampleSize
    };
  }

  /**
   * Calculate statistical significance
   */
  calculateSignificance(
    control: { conversions: number; trials: number },
    variant: { conversions: number; trials: number }
  ): { significant: boolean; pValue: number; confidence: string } {
    // Simplified chi-square test
    // In production, use proper statistical library

    const controlRate = control.conversions / control.trials;
    const variantRate = variant.conversions / variant.trials;
    const pooledRate = (control.conversions + variant.conversions) / (control.trials + variant.trials);

    const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / control.trials + 1 / variant.trials));
    const zScore = (variantRate - controlRate) / se;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    return {
      significant: pValue < 0.05,
      pValue: parseFloat(pValue.toFixed(4)),
      confidence: pValue < 0.05 ? '95%' : pValue < 0.10 ? '90%' : '< 90%'
    };
  }

  /**
   * Normal distribution CDF (for statistical calculations)
   */
  private normalCDF(x: number): number {
    return (1 + Math.erf(x / Math.sqrt(2))) / 2;
  }

  /**
   * Math.erf polyfill (error function)
   */
  private erf(x: number): number {
    // Approximation of error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const t2 = t * t;
    const t3 = t2 * t;
    const t4 = t3 * t;
    const t5 = t4 * t;

    return sign * (1.0 - (((((a5 * t5 + a4 * t4) + a3 * t3) + a2 * t2) + a1 * t) * t) * Math.exp(-x * x));
  }
}

// Create singleton instance
export const abTesting = new ABTestingService();

// Auto-initialize foundation tests on first load
if (typeof window !== 'undefined') {
  abTesting.initializeFoundationTests();
  const variant = abTesting.getUserVariant();
  abTesting.trackVariantAssignment(variant);
}

export default abTesting;
