// TriniBuild Performance Optimization System
// Fast-loading, SEO-optimized, CRO-focused page architecture

export interface PerformanceConfig {
  lazyLoad: boolean;
  prefetch: boolean;
  imageOptimization: boolean;
  codesplitting: boolean;
  criticalCSS: boolean;
}

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: Record<string, any>;
}

export interface CROOptimization {
  aboveTheFoldCTA: boolean;
  trustBadges: boolean;
  socialProof: boolean;
  urgencyTimers: boolean;
  exitIntent: boolean;
}

/**
 * PERFORMANCE TARGETS
 * - First Contentful Paint: <1.5s
 * - Time to Interactive: <3s
 * - Lighthouse Score: >90
 * - Core Web Vitals: All green
 */

export const PERFORMANCE_DEFAULTS: PerformanceConfig = {
  lazyLoad: true,
  prefetch: true,
  imageOptimization: true,
  codeSplitting: true,
  criticalCSS: true
};

/**
 * Image Optimization
 */
export const optimizeImage = (src: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg';
}): string => {
  const { width, height, quality = 85, format = 'webp' } = options || {};
  
  // Use Next.js Image optimization or similar
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', quality.toString());
  params.set('fm', format);
  
  return `/api/image?url=${encodeURIComponent(src)}&${params.toString()}`;
};

/**
 * Lazy Loading Component Wrapper
 */
export const lazyLoadComponent = async (importFn: () => Promise<any>) => {
  const component = await importFn();
  return component.default || component;
};

/**
 * Critical CSS Extraction
 */
export const extractCriticalCSS = (html: string): string => {
  // Extract above-the-fold CSS
  const criticalSelectors = [
    'header', 'nav', '.hero', '.above-fold',
    'h1', 'h2', '.cta-primary'
  ];
  
  // This would use a tool like critical or penthouse
  // For now, return inline critical CSS
  return `
    /* Critical CSS - Above the fold */
    body { margin: 0; font-family: Inter, sans-serif; }
    header { background: #000; color: #fff; }
    .hero { min-height: 100vh; }
    .cta-primary { background: #E61E2B; color: #fff; }
  `;
};

/**
 * SEO Metadata Generator
 */
export const generateSEOMetadata = (page: {
  title: string;
  description: string;
  path: string;
  type?: string;
}): SEOMetadata => {
  const baseUrl = 'https://trinibuild.com';
  const fullTitle = `${page.title} | TriniBuild - Trinidad's #1 E-Commerce Platform`;
  
  return {
    title: fullTitle,
    description: page.description,
    keywords: [
      'Trinidad e-commerce',
      'Trinidad online store',
      'TriniBuild',
      'sell online Trinidad',
      'Trinidad marketplace',
      'COD Trinidad',
      'Trinidad delivery'
    ],
    ogImage: `${baseUrl}/og-images/${page.path}.png`,
    canonicalUrl: `${baseUrl}${page.path}`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': page.type || 'WebPage',
      name: page.title,
      description: page.description,
      url: `${baseUrl}${page.path}`
    }
  };
};

/**
 * CRO Optimization Rules
 */
export const CRO_RULES = {
  // Above-the-fold CTA within 800px
  aboveTheFoldCTA: {
    maxHeight: 800,
    ctaText: ['Start Free', 'Get Started', 'Try Now', 'Sign Up Free'],
    position: 'hero-section'
  },
  
  // Trust badges
  trustBadges: {
    ssl: true,
    payments: ['WiPay', 'PayPal', 'Credit Card'],
    guarantees: ['100% Secure', 'Trinidad Local', 'COD Available']
  },
  
  // Social proof
  socialProof: {
    testimonialCount: 3,
    statsDisplay: true,
    trustScore: true,
    userPhotos: true
  },
  
  // Urgency elements
  urgency: {
    limitedTimeOffers: true,
    stockIndicators: true,
    countdownTimers: false // Don't overuse
  }
};

/**
 * Page Speed Optimization
 */
export const optimizePageSpeed = {
  // Preload critical resources
  preload: [
    { rel: 'preload', href: '/fonts/inter.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: 'https://cdn.trinibuild.com' }
  ],
  
  // Defer non-critical scripts
  defer: [
    '/scripts/analytics.js',
    '/scripts/chat-widget.js',
    '/scripts/third-party.js'
  ],
  
  // Resource hints
  prefetch: [
    '/api/products',
    '/api/categories',
    '/dashboard'
  ]
};

/**
 * Skeleton Loader Generator (NO SPINNERS!)
 */
export const generateSkeleton = (type: 'card' | 'list' | 'table' | 'dashboard'): string => {
  const skeletons = {
    card: `
      <div class="animate-pulse">
        <div class="h-48 bg-gray-200 rounded-t"></div>
        <div class="p-4 space-y-3">
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="h-4 bg-gray-200 rounded"></div>
          <div class="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    `,
    list: `
      <div class="animate-pulse space-y-4">
        ${Array(5).fill(0).map(() => `
          <div class="flex items-center space-x-4">
            <div class="h-12 w-12 bg-gray-200 rounded-full"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              <div class="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `,
    table: `
      <div class="animate-pulse">
        <div class="h-10 bg-gray-200 rounded mb-4"></div>
        ${Array(8).fill(0).map(() => `
          <div class="h-16 bg-gray-100 rounded mb-2"></div>
        `).join('')}
      </div>
    `,
    dashboard: `
      <div class="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-6">
        ${Array(6).fill(0).map(() => `
          <div class="bg-white p-6 rounded-lg shadow">
            <div class="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div class="h-10 bg-gray-200 rounded w-3/4"></div>
          </div>
        `).join('')}
      </div>
    `
  };
  
  return skeletons[type];
};

/**
 * Mobile-First Responsive Breakpoints
 */
export const BREAKPOINTS = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px'
} as const;

/**
 * Core Web Vitals Monitoring
 */
export const monitorWebVitals = () => {
  if (typeof window === 'undefined') return;
  
  // Largest Contentful Paint (LCP)
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
  });
  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  
  // First Input Delay (FID)
  const fidObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach(entry => {
      console.log('FID:', entry.processingStart - entry.startTime);
    });
  });
  fidObserver.observe({ entryTypes: ['first-input'] });
  
  // Cumulative Layout Shift (CLS)
  let clsScore = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsScore += (entry as any).value;
        console.log('CLS:', clsScore);
      }
    }
  });
  clsObserver.observe({ entryTypes: ['layout-shift'] });
};

/**
 * Cache Strategy
 */
export const CACHE_STRATEGY = {
  static: {
    maxAge: 31536000, // 1 year
    staleWhileRevalidate: 86400 // 1 day
  },
  api: {
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 600 // 10 minutes
  },
  images: {
    maxAge: 2592000, // 30 days
    staleWhileRevalidate: 86400 // 1 day
  }
};

/**
 * Font Loading Strategy (FOUT prevention)
 */
export const fontLoadingCSS = `
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url('/fonts/inter-regular.woff2') format('woff2');
  }
  
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: url('/fonts/inter-bold.woff2') format('woff2');
  }
`;

export default {
  PERFORMANCE_DEFAULTS,
  CRO_RULES,
  BREAKPOINTS,
  CACHE_STRATEGY,
  optimizeImage,
  generateSEOMetadata,
  generateSkeleton,
  monitorWebVitals
};
