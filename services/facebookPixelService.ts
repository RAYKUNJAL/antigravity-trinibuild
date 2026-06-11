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
  private enabled: boolean = false;

  constructor() {
    this.PIXEL_ID = import.meta.env.VITE_FACEBOOK_PIXEL_ID || '';
    this.enabled = /^[0-9]{8,32}$/.test(this.PIXEL_ID);
  }

  /**
   * Initialize Facebook Pixel
   */
  initializePixel() {
    if (this.initialized || !this.enabled || typeof window === 'undefined') return;

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
    if (!document.getElementById('facebook-pixel-script')) {
      const script = document.createElement('script');
      script.id = 'facebook-pixel-script';
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(script);
    }

    // Initialize pixel
    window.fbq('init', this.PIXEL_ID);

    this.initialized = true;
    console.log('✅ Facebook Pixel initialized:', this.PIXEL_ID);
  }

  private safeTrack(callback: () => void) {
    this.initializePixel();
    if (!this.initialized || !window.fbq) return;

    try {
      callback();
    } catch (error) {
      console.warn('Facebook Pixel tracking skipped:', error);
    }
  }

  /**
   * Track page view
   */
  trackPageView() {
    this.safeTrack(() => window.fbq('track', 'PageView'));
  }

  /**
   * Track signup start
   */
  trackSignupStart(source?: string) {
    this.safeTrack(() => window.fbq('track', 'Lead', {
      content_name: 'Signup Started',
      source: source || 'landing_page'
    }));
  }

  /**
   * Track signup completion
   */
  trackSignupComplete() {
    this.safeTrack(() => window.fbq('track', 'CompleteRegistration', {
      content_name: 'Store Created',
      status: 'completed'
    }));
  }

  /**
   * Track view content (pricing/features)
   */
  trackViewContent(contentName: string, contentId?: string) {
    this.safeTrack(() => window.fbq('track', 'ViewContent', {
      content_name: contentName,
      content_id: contentId || contentName,
      content_category: 'product'
    }));
  }

  /**
   * Track add to cart (when user adds product)
   */
  trackAddToCart(productName: string, price: number) {
    this.safeTrack(() => window.fbq('track', 'AddToCart', {
      content_name: productName,
      content_type: 'product',
      value: price,
      currency: 'TTD'
    }));
  }

  /**
   * Track purchase (when merchant receives order)
   */
  trackPurchase(value: number, currency: string = 'TTD') {
    this.safeTrack(() => window.fbq('track', 'Purchase', {
      value: value,
      currency: currency,
      content_type: 'product'
    }));
  }

  /**
   * Track pro upgrade
   */
  trackSubscription(plan: string, value: number) {
    this.safeTrack(() => window.fbq('track', 'Subscribe', {
      content_name: `${plan} Plan`,
      value: value,
      currency: 'TTD'
    }));
  }

  /**
   * Track custom event
   */
  trackCustom(eventName: string, data?: Record<string, any>) {
    this.safeTrack(() => window.fbq('trackCustom', eventName, data || {}));
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

    this.safeTrack(() => window.fbq('setUserData', hashedData));
  }

  /**
   * Create dynamic audience for retargeting
   */
  trackViewForRetargeting(itemId: string, itemName: string, category: string) {
    this.safeTrack(() => window.fbq('track', 'ViewContent', {
      content_ids: [itemId],
      content_name: itemName,
      content_type: 'product_group',
      content_category: category
    }));
  }

  /**
   * Add pixel to noscript for analytics without JS
   */
  addNoScriptPixel() {
    if (!this.enabled || document.getElementById('facebook-pixel-noscript')) return;
    const noscript = document.createElement('noscript');
    noscript.id = 'facebook-pixel-noscript';
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
