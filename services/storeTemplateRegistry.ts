export type BuilderTemplateId = 'professional' | 'fashion' | 'restaurant' | 'beauty' | 'ecommerce';
export type BuilderBusinessType = 'fashion' | 'food' | 'beauty' | 'retail' | 'services' | 'other';

export interface StoreTemplateSelection {
  sourceTemplateId: string;
  builderTemplateId: BuilderTemplateId;
  businessType: BuilderBusinessType;
  customerTemplateKey: BuilderTemplateId;
  name: string;
  category: string;
  islandUseCase: string;
}

const STORE_TEMPLATE_REGISTRY: Record<string, StoreTemplateSelection> = {
  basic_storefront: {
    sourceTemplateId: 'basic_storefront',
    builderTemplateId: 'professional',
    businessType: 'other',
    customerTemplateKey: 'professional',
    name: 'Basic Storefront',
    category: 'General',
    islandUseCase: 'General Trinidad and Tobago store',
  },
  roti_shop_pro: {
    sourceTemplateId: 'roti_shop_pro',
    builderTemplateId: 'restaurant',
    businessType: 'food',
    customerTemplateKey: 'restaurant',
    name: 'Roti Shop Premium',
    category: 'Food & Beverage',
    islandUseCase: 'Roti shops, doubles vendors, and lunch counters',
  },
  restaurant_premium: {
    sourceTemplateId: 'restaurant_premium',
    builderTemplateId: 'restaurant',
    businessType: 'food',
    customerTemplateKey: 'restaurant',
    name: 'Restaurant Premium',
    category: 'Food & Beverage',
    islandUseCase: 'Restaurants, bars, lounges, cafes, and caterers',
  },
  doubles_breakfast_pro: {
    sourceTemplateId: 'doubles_breakfast_pro',
    builderTemplateId: 'restaurant',
    businessType: 'food',
    customerTemplateKey: 'restaurant',
    name: 'Doubles & Breakfast Spot',
    category: 'Food & Beverage',
    islandUseCase: 'Doubles vendors, breakfast spots, and street food',
  },
  bakery_sweets_pro: {
    sourceTemplateId: 'bakery_sweets_pro',
    builderTemplateId: 'restaurant',
    businessType: 'food',
    customerTemplateKey: 'restaurant',
    name: 'Bakery & Sweets',
    category: 'Food & Beverage',
    islandUseCase: 'Bakeries, cake makers, sweet shops, and custom orders',
  },
  clothing_store_pro: {
    sourceTemplateId: 'clothing_store_pro',
    builderTemplateId: 'fashion',
    businessType: 'fashion',
    customerTemplateKey: 'fashion',
    name: 'Fashion Boutique',
    category: 'Retail',
    islandUseCase: 'Boutiques, clothing stores, shoes, jewelry, and accessories',
  },
  jewelry_luxury_pro: {
    sourceTemplateId: 'jewelry_luxury_pro',
    builderTemplateId: 'fashion',
    businessType: 'fashion',
    customerTemplateKey: 'fashion',
    name: 'Jewelry Luxury',
    category: 'Retail',
    islandUseCase: 'Jewelry, luxury gifts, watches, and premium accessories',
  },
  salon_barber_pro: {
    sourceTemplateId: 'salon_barber_pro',
    builderTemplateId: 'beauty',
    businessType: 'beauty',
    customerTemplateKey: 'beauty',
    name: 'Salon & Barbershop',
    category: 'Services',
    islandUseCase: 'Salons, barbers, nail techs, spas, and beauty services',
  },
  gym_fitness_pro: {
    sourceTemplateId: 'gym_fitness_pro',
    builderTemplateId: 'beauty',
    businessType: 'services',
    customerTemplateKey: 'beauty',
    name: 'Gym & Fitness Studio',
    category: 'Services',
    islandUseCase: 'Gyms, trainers, wellness studios, and classes',
  },
  pharmacy_medical_pro: {
    sourceTemplateId: 'pharmacy_medical_pro',
    builderTemplateId: 'ecommerce',
    businessType: 'retail',
    customerTemplateKey: 'ecommerce',
    name: 'Pharmacy & Health Store',
    category: 'Retail',
    islandUseCase: 'Pharmacies, health shops, and medical supply stores',
  },
  electronics_tech_pro: {
    sourceTemplateId: 'electronics_tech_pro',
    builderTemplateId: 'ecommerce',
    businessType: 'retail',
    customerTemplateKey: 'ecommerce',
    name: 'Electronics & Tech',
    category: 'Retail',
    islandUseCase: 'Phone shops, electronics, gaming, and repair stores',
  },
  auto_parts_pro: {
    sourceTemplateId: 'auto_parts_pro',
    builderTemplateId: 'ecommerce',
    businessType: 'retail',
    customerTemplateKey: 'ecommerce',
    name: 'Auto Parts Pro',
    category: 'Automotive',
    islandUseCase: 'Auto parts, mechanics, accessories, and service shops',
  },
  hardware_home_pro: {
    sourceTemplateId: 'hardware_home_pro',
    builderTemplateId: 'ecommerce',
    businessType: 'retail',
    customerTemplateKey: 'ecommerce',
    name: 'Hardware & Home',
    category: 'Retail',
    islandUseCase: 'Hardware, home goods, tools, and building supplies',
  },
  multi_location_enterprise: {
    sourceTemplateId: 'multi_location_enterprise',
    builderTemplateId: 'professional',
    businessType: 'services',
    customerTemplateKey: 'professional',
    name: 'Multi-Location Enterprise',
    category: 'Enterprise',
    islandUseCase: 'Multi-branch businesses across Trinidad and Tobago',
  },
};

const BUILDER_TEMPLATE_REGISTRY: Record<BuilderTemplateId, StoreTemplateSelection> = {
  professional: STORE_TEMPLATE_REGISTRY.basic_storefront,
  fashion: STORE_TEMPLATE_REGISTRY.clothing_store_pro,
  restaurant: STORE_TEMPLATE_REGISTRY.restaurant_premium,
  beauty: STORE_TEMPLATE_REGISTRY.salon_barber_pro,
  ecommerce: STORE_TEMPLATE_REGISTRY.electronics_tech_pro,
};

export const resolveStoreTemplateSelection = (templateId?: string | null): StoreTemplateSelection => {
  const normalizedId = templateId?.toLowerCase();
  if (!normalizedId) return BUILDER_TEMPLATE_REGISTRY.professional;

  return (
    STORE_TEMPLATE_REGISTRY[normalizedId] ||
    BUILDER_TEMPLATE_REGISTRY[normalizedId as BuilderTemplateId] ||
    BUILDER_TEMPLATE_REGISTRY.professional
  );
};

export const getStoreTemplateProfile = (store: any): StoreTemplateSelection => {
  const config = store?.theme_config || {};
  return resolveStoreTemplateSelection(
    config.source_template_id ||
    config.customer_template_key ||
    config.template_id ||
    store?.template_id
  );
};

export const allStoreTemplateSelections = Object.values(STORE_TEMPLATE_REGISTRY);
