/**
 * GA4 Analytics Service
 * 
 * Tracks CRO landing page conversions:
 * - signup_start: User clicks "Start My Free Store"
 * - signup_complete: User completes store creation
 * - store_created: Store is live
 * - first_product_added: Merchant adds first product
 * - first_order: Merchant receives first order
 * - pro_upgrade: Upgrade from Free → Pro
 * 
 * Also tracks funnel events for optimization:
 * - page_view (with landing_page_variant for A/B testing)
 * - scroll_depth
 * - button_click
 * - form_start / form_complete
 * - cta_impression
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export interface GA4Event {
  event_name: string;
  parameters: Record<string, any>;
}

class GA4AnalyticsService {
  private GA4_ID: string;
  private initialized: boolean = false;

  constructor() {
    // Get GA4 ID from environment or use default
    this.GA4_ID = import.meta.env.VITE_GA4_ID || 'G-XXXXXXXXXX';
  }

  /**
   * Initialize GA4 tracking
   */
  initializeGA4() {
    if (this.initialized) return;

    // Add gtag script dynamically
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.GA4_ID}`;
    document.head.appendChild(script);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    // Configure GA4
    window.gtag('js', new Date());
    window.gtag('config', this.GA4_ID, {
      'anonymize_ip': true,
      'cookie_flags': 'SameSite=None;Secure'
    });

    this.initialized = true;
    console.log('✅ GA4 initialized:', this.GA4_ID);
  }

  /**
   * Track page view with landing page variant for A/B testing
   */
  trackPageView(variant?: string) {
    if (!this.initialized) this.initializeGA4();

    window.gtag('event', 'page_view', {
      'page_path': window.location.pathname,
      'page_title': document.title,
      'landing_page_variant': variant || 'control',
      'timestamp': new Date().toISOString()
    });
  }

  /**
   * Track signup start (user clicks CTA button)
   */
  trackSignupStart(buttonText?: string, section?: string) {
    if (!this.initialized) this.initializeGA4();

    window.gtag('event', 'signup_start', {
      'button_text': buttonText || 'Start My Free Store',
      'section': section || 'hero',
      'timestamp': new Date().toISOString()
    });
  }

  /**
   * Track signup completion (user finishes onboarding)
   */
  trackSignupComplete(storeCategory?: string) {
    if (!this.initialized) this.initializeGA4();

    window.gtag('event', 'signup_complete', {
      'store_category': storeCategory || 'other',
      'timestamp': new Date().toISOString()
    });
  }

  /**
   * Track store creation (store goes live)
   */
  trackStoreCreated(storeName: string, category: string) {
    if (!this.initialized) this.initializeGA4();

    window.gtag('event', 'store_created', {
      'store_name': storeName,
      'store_category': category,
      'timestamp': new Date().toISOString()
    });
  }

  /**
   * Track first product added
   */
  trackFirstProductAdded(productName: string, price: number) {
    if (!this.initialized) this.initializeGA4();

    window.gtag('event', 'first_product_added', {
      'product_name': productName,
      'product_price': price,
      'currency': 'TTD',
      'timestamp': new Date().toISOString()
    });
  }

  /**
   * Track first order received
   */
  trackFirstOrder(orderValue: number, orderItems: number) {
    if (!this.initialized) this.initializeGA4();

    window.gtag('event', 'first_order', {
      'order_value': orderValue,
      'order_items': orderItems,
      'currency': 'TTD',
      'timestamp': new Date().toISOString()
    });
  }

  /**
   * Track Pro subscription upgrade
   */
  trackProUpgrade(fromPlan: string, toPlan: string = 'pro', monthlyValue: number = 199) {
    if (!this.initialized) this.initializeGA4();

    window.gtag('event', 'pro_upgrade', {
      'from_plan': fromPlan,
      'to_plan': toPlan,
      'monthly_value': monthlyValue,
      'currency': 'TTD',
      'timestamp': new Date().toISOString()
    });
  }

  /**
   * Track scroll depth (how far user scrolls)
   */
  trackScrollDepth(depth: number) {
    if (!this.initialized) this.initializeGA4();

    window.gtag('event', 'scroll_depth', {
      'percent_scrolled': depth,
      'timestamp': new Date().toISOString()
    });
  }

  /**
   * Track button clicks for funnel analysis
   */
  trackButtonClick(buttonId: string, buttonText: string, section: string) {
    if (!this.initialized) this.initializeGA4();

    window.gtag('event', 'button_click', {
      'button_id': buttonId,
      'button_text': buttonText,
      'section': section,
      'timestamp': new Date().toISOString()
    });
  }

  /**
   * Track CTA impression (when CTA becomes visible)
   */
  trackCTAImpression(ctaId: string, ctaText: string, section: string) {
    if (!this.initialized) this.initializeGA4();

    window.gtag('event', 'cta_impression', {
      'cta_id': ctaId,
      'cta_text': ctaText,
      'section': section,
      'timestamp': new Date().toISOString()
    });
  }

  /**
   * Track form engagement
   */
  trackFormStart(formId: string) {
    if (!this.initialized) this.initializeGA4();

    window.gtag('event', 'form_start', {
      'form_id': formId,
      'timestamp': new Date().toISOString()
    });
  }

  /**
   * Track form submission
   */
  trackFormComplete(formId: string, success: boolean) {
    if (!this.initialized) this.initializeGA4();

    window.gtag('event', 'form_complete', {
      'form_id': formId,
      'form_success': success,
      'timestamp': new Date().toISOString()
    });
  }

  /**
   * Set user properties for segmentation
   */
  setUserProperty(propertyName: string, propertyValue: string | number | boolean) {
    if (!this.initialized) this.initializeGA4();

    window.gtag('set', 'user_properties', {
      [propertyName]: propertyValue
    });
  }

  /**
   * Track custom event with flexible parameters
   */
  trackCustomEvent(eventName: string, parameters: Record<string, any>) {
    if (!this.initialized) this.initializeGA4();

    window.gtag('event', eventName, {
      ...parameters,
      'timestamp': new Date().toISOString()
    });
  }

  /**
   * Track Facebook Pixel events (for retargeting)
   */
  trackFacebookPixelEvent(eventName: string, parameters?: Record<string, any>) {
    if (!window.fbq) {
      console.warn('Facebook Pixel not loaded');
      return;
    }

    const standardEvents = [
      'PageView',
      'ViewContent',
      'AddToCart',
      'AddPaymentInfo',
      'Purchase',
      'Lead',
      'CompleteRegistration'
    ];

    if (standardEvents.includes(eventName)) {
      window.fbq('track', eventName, parameters || {});
    } else {
      window.fbq('trackCustom', eventName, parameters || {});
    }
  }

  /**
   * Enable debug mode for development
   */
  enableDebugMode() {
    if (window.gtag) {
      window.gtag('config', this.GA4_ID, {
        'debug_mode': true
      });
    }
  }
}

// Create singleton instance
export const ga4Analytics = new GA4AnalyticsService();

// Auto-initialize on import
if (typeof window !== 'undefined') {
  ga4Analytics.initializeGA4();
}

export default ga4Analytics;
