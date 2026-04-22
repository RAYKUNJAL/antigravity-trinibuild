/**
 * Facebook Pixel Service
 * 
 * Tracks conversions and user behavior for Facebook/Instagram retargeting
 * Audience segments:
 * - Page viewers (retarget with demo video)
 * - Signup starters (retarget with social proof)
 * - Signup completers (retarget with features/pricing)
 */

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

class FacebookPixelService {
  private PIXEL_ID: string;
  private initialized: boolean = false;

  constructor() {
    // Get Pixel ID from environment or use placeholder
    this.PIXEL_ID = import.meta.env.VITE_FACEBOOK_PIXEL_ID || '1234567890123456';
  }

  /**
   * Initialize Facebook Pixel
   */
  initializePixel() {
    if (this.initialized) return;

    // Prevent duplicate initialization
    if (window.fbq) {
      this.initialized = true;
      return;
    }

    // Initialize fbq array
    (window as any).fbq = (window as any).fbq || function() {
      ((window as any).fbq.q = (window as any).fbq.q || []).push(arguments);
    };

    // Mark that pixel is loaded
    (window as any)._fbq = (window as any)._fbq || [];

    // Add script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);

    // Initialize pixel
    window.fbq('init', this.PIXEL_ID);

    // Track initial page view
    window.fbq('track', 'PageView');

    this.initialized = true;
    console.log('✅ Facebook Pixel initialized:', this.PIXEL_ID);
  }

  /**
   * Track page view
   */
  trackPageView() {
    if (!this.initialized) this.initializePixel();
    window.fbq('track', 'PageView');
  }

  /**
   * Track signup start
   */
  trackSignupStart(source?: string) {
    if (!this.initialized) this.initializePixel();
    window.fbq('track', 'Lead', {
      content_name: 'Signup Started',
      source: source || 'landing_page'
    });
  }

  /**
   * Track signup completion
   */
  trackSignupComplete() {
    if (!this.initialized) this.initializePixel();
    window.fbq('track', 'CompleteRegistration', {
      content_name: 'Store Created',
      status: 'completed'
    });
  }

  /**
   * Track view content (pricing/features)
   */
  trackViewContent(contentName: string, contentId?: string) {
    if (!this.initialized) this.initializePixel();
    window.fbq('track', 'ViewContent', {
      content_name: contentName,
      content_id: contentId || contentName,
      content_category: 'product'
    });
  }

  /**
   * Track add to cart (when user adds product)
   */
  trackAddToCart(productName: string, price: number) {
    if (!this.initialized) this.initializePixel();
    window.fbq('track', 'AddToCart', {
      content_name: productName,
      content_type: 'product',
      value: price,
      currency: 'TTD'
    });
  }

  /**
   * Track purchase (when merchant receives order)
   */
  trackPurchase(value: number, currency: string = 'TTD') {
    if (!this.initialized) this.initializePixel();
    window.fbq('track', 'Purchase', {
      value: value,
      currency: currency,
      content_type: 'product'
    });
  }

  /**
   * Track pro upgrade
   */
  trackSubscription(plan: string, value: number) {
    if (!this.initialized) this.initializePixel();
    window.fbq('track', 'Subscribe', {
      content_name: `${plan} Plan`,
      value: value,
      currency: 'TTD'
    });
  }

  /**
   * Track custom event
   */
  trackCustom(eventName: string, data?: Record<string, any>) {
    if (!this.initialized) this.initializePixel();
    window.fbq('trackCustom', eventName, data || {});
  }

  /**
   * Create custom audience based on user properties
   */
  setUserData(userData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  }) {
    if (!this.initialized) this.initializePixel();

    const hashedData = Object.entries(userData).reduce((acc, [key, value]) => {
      if (value) {
        // In production, values should be hashed
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    window.fbq('setUserData', hashedData);
  }

  /**
   * Create dynamic audience for retargeting
   */
  trackViewForRetargeting(itemId: string, itemName: string, category: string) {
    if (!this.initialized) this.initializePixel();
    window.fbq('track', 'ViewContent', {
      content_ids: [itemId],
      content_name: itemName,
      content_type: 'product_group',
      content_category: category
    });
  }

  /**
   * Add pixel to noscript for analytics without JS
   */
  addNoScriptPixel() {
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${this.PIXEL_ID}&ev=PageView&noscript=1" />`;
    document.body.appendChild(noscript);
  }
}

// Create singleton
export const facebookPixel = new FacebookPixelService();

// Auto-initialize
if (typeof window !== 'undefined') {
  facebookPixel.initializePixel();
  facebookPixel.addNoScriptPixel();
}

export default facebookPixel;
