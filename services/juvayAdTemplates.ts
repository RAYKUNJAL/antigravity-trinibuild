// services/juvayAdTemplates.ts
// Ready-to-use campaign templates for Juvay's own merchant acquisition.

export const JUVAY_AD_TEMPLATES = [
  {
    id: 'merchant-acquisition-tt',
    name: 'Merchant Acquisition — T&T',
    objective: 'OUTCOME_LEADS',
    target_country: 'TT',
    target_age_min: 22,
    target_age_max: 55,
    target_interests: ['small business', 'entrepreneurship', 'online selling', 'ecommerce'],
    headline: 'Sell Online in Trinidad — Free Store',
    body: 'Create your free online store in 5 minutes. Accept cash on delivery. No credit card needed. Juvay.app',
    cta: 'LEARN_MORE',
    daily_budget_usd: 10,
    recommended_duration_days: 30,
  },
  {
    id: 'merchant-acquisition-food',
    name: 'Food Business — T&T',
    objective: 'OUTCOME_LEADS',
    target_country: 'TT',
    target_age_min: 22,
    target_age_max: 55,
    target_interests: ['small business', 'entrepreneurship', 'online selling', 'ecommerce'],
    headline: 'Take Your Food Business Online 🍽️',
    body: 'Doubles, roti, catering — sell online with COD. Free store on Juvay. No tech skills needed.',
    cta: 'SIGN_UP',
    daily_budget_usd: 8,
    recommended_duration_days: 30,
  },
  {
    id: 'merchant-acquisition-fashion',
    name: 'Fashion Business — T&T',
    objective: 'OUTCOME_LEADS',
    target_country: 'TT',
    target_age_min: 22,
    target_age_max: 55,
    target_interests: ['small business', 'entrepreneurship', 'online selling', 'ecommerce'],
    headline: 'Show Off Yuh Designs Online 👗',
    body: 'Caribbean fashion deserves a real online store. Create yours free on Juvay. Sell locally, ship anywhere.',
    cta: 'SIGN_UP',
    daily_budget_usd: 8,
    recommended_duration_days: 30,
  },
  {
    id: 'brand-awareness-tt',
    name: 'Juvay Brand Awareness — T&T',
    objective: 'OUTCOME_AWARENESS',
    target_country: 'TT',
    target_age_min: 18,
    target_age_max: 55,
    target_interests: ['entrepreneurship', 'small business', 'shopping'],
    headline: 'Juvay — Built for Caribbean Business',
    body: 'The Caribbean commerce platform. Build your store. Accept COD. Grow your business. 🇹🇹',
    cta: 'LEARN_MORE',
    daily_budget_usd: 5,
    recommended_duration_days: 21,
  },
];

export const CARIBBEAN_AUDIENCES = {
  tt_entrepreneurs: {
    name: 'T&T Entrepreneurs 22-50',
    country: 'TT',
    age_min: 22, age_max: 50,
    interests: ['entrepreneurship', 'small business', 'online selling']
  },
  tt_youth: {
    name: 'T&T Young Adults 18-35',
    country: 'TT',
    age_min: 18, age_max: 35,
    interests: ['fashion', 'food', 'social media', 'side hustle']
  },
  jm_entrepreneurs: {
    name: 'Jamaica Entrepreneurs',
    country: 'JM',
    age_min: 22, age_max: 50,
    interests: ['entrepreneurship', 'small business']
  }
};
