/**
 * TriniBuild Location Database
 * Comprehensive list of cities, towns, villages, and settlements in Trinidad & Tobago
 * Used for SEO-optimized location-specific blog generation
 */

export interface TrinidadLocation {
    name: string;
    region_or_municipality: string;
    island: 'Trinidad' | 'Tobago';
    slug: string;
    population_estimate?: number;
    latitude?: number;
    longitude?: number;
    isCapital?: boolean;
    isMajorCity?: boolean;
}

export const TRINIDAD_LOCATIONS: TrinidadLocation[] = [
    // ============================================
    // PORT OF SPAIN & SURROUNDS
    // ============================================
    {
        name: "Port of Spain",
        region_or_municipality: "Port of Spain",
        island: "Trinidad",
        slug: "port-of-spain",
        population_estimate: 37074,
        latitude: 10.6596,
        longitude: -61.5086,
        isCapital: true,
        isMajorCity: true
    },
    {
        name: "Woodbrook",
        region_or_municipality: "Port of Spain",
        island: "Trinidad",
        slug: "woodbrook",
        latitude: 10.6568,
        longitude: -61.5205
    },
    {
        name: "St. James",
        region_or_municipality: "Port of Spain",
        island: "Trinidad",
        slug: "st-james",
        latitude: 10.6551,
        longitude: -61.5285
    },
    {
        name: "Newtown",
        region_or_municipality: "Port of Spain",
        island: "Trinidad",
        slug: "newtown",
        latitude: 10.6589,
        longitude: -61.5201
    },
    {
        name: "St. Clair",
        region_or_municipality: "Port of Spain",
        island: "Trinidad",
        slug: "st-clair",
        latitude: 10.6720,
        longitude: -61.5190
    },
    {
        name: "Belmont",
        region_or_municipality: "Port of Spain",
        island: "Trinidad",
        slug: "belmont",
        latitude: 10.6608,
        longitude: -61.5041
    },
    {
        name: "Laventille",
        region_or_municipality: "Port of Spain",
        island: "Trinidad",
        slug: "laventille",
        latitude: 10.6500,
        longitude: -61.4967
    },
    {
        name: "Morvant",
        region_or_municipality: "Port of Spain",
        island: "Trinidad",
        slug: "morvant",
        latitude: 10.6481,
        longitude: -61.4858
    },
    {
        name: "Barataria",
        region_or_municipality: "San Juan-Laventille",
        island: "Trinidad",
        slug: "barataria",
        latitude: 10.6378,
        longitude: -61.4539
    },

    // ============================================
    // SAN JUAN-LAVENTILLE
    // ============================================
    {
        name: "San Juan",
        region_or_municipality: "San Juan-Laventille",
        island: "Trinidad",
        slug: "san-juan",
        population_estimate: 56428,
        latitude: 10.6469,
        longitude: -61.4533,
        isMajorCity: true
    },
    {
        name: "El Socorro",
        region_or_municipality: "San Juan-Laventille",
        island: "Trinidad",
        slug: "el-socorro",
        latitude: 10.6353,
        longitude: -61.4436
    },

    // ============================================
    // DIEGO MARTIN
    // ============================================
    {
        name: "Diego Martin",
        region_or_municipality: "Diego Martin",
        island: "Trinidad",
        slug: "diego-martin",
        population_estimate: 105720,
        latitude: 10.6842,
        longitude: -61.5603,
        isMajorCity: true
    },
    {
        name: "Petit Valley",
        region_or_municipality: "Diego Martin",
        island: "Trinidad",
        slug: "petit-valley",
        latitude: 10.6997,
        longitude: -61.5467
    },
    {
        name: "Carenage",
        region_or_municipality: "Diego Martin",
        island: "Trinidad",
        slug: "carenage",
        latitude: 10.6886,
        longitude: -61.5750
    },
    {
        name: "Maraval",
        region_or_municipality: "Diego Martin",
        island: "Trinidad",
        slug: "maraval",
        latitude: 10.6797,
        longitude: -61.5367
    },
    {
        name: "St. Ann's",
        region_or_municipality: "Diego Martin",
        island: "Trinidad",
        slug: "st-anns",
        latitude: 10.6722,
        longitude: -61.5189
    },
    {
        name: "Westmoorings",
        region_or_municipality: "Diego Martin",
        island: "Trinidad",
        slug: "westmoorings",
        latitude: 10.6714,
        longitude: -61.5525
    },

    // ============================================
    // SAN FERNANDO
    // ============================================
    {
        name: "San Fernando",
        region_or_municipality: "San Fernando",
        island: "Trinidad",
        slug: "san-fernando",
        population_estimate: 55419,
        latitude: 10.2803,
        longitude: -61.4692,
        isMajorCity: true
    },
    {
        name: "Marabella",
        region_or_municipality: "San Fernando",
        island: "Trinidad",
        slug: "marabella",
        latitude: 10.2997,
        longitude: -61.4625
    },
    {
        name: "Vistabella",
        region_or_municipality: "San Fernando",
        island: "Trinidad",
        slug: "vistabella",
        latitude: 10.2703,
        longitude: -61.4572
    },
    {
        name: "Gulf View",
        region_or_municipality: "San Fernando",
        island: "Trinidad",
        slug: "gulf-view",
        latitude: 10.2617,
        longitude: -61.4778
    },

    // ============================================
    // CHAGUANAS
    // ============================================
    {
        name: "Chaguanas",
        region_or_municipality: "Chaguanas",
        island: "Trinidad",
        slug: "chaguanas",
        population_estimate: 83516,
        latitude: 10.5167,
        longitude: -61.4000,
        isMajorCity: true
    },
    {
        name: "Charlieville",
        region_or_municipality: "Chaguanas",
        island: "Trinidad",
        slug: "charlieville",
        latitude: 10.5125,
        longitude: -61.3889
    },
    {
        name: "Enterprise",
        region_or_municipality: "Chaguanas",
        island: "Trinidad",
        slug: "enterprise",
        latitude: 10.4917,
        longitude: -61.4236
    },
    {
        name: "Felicity",
        region_or_municipality: "Chaguanas",
        island: "Trinidad",
        slug: "felicity",
        latitude: 10.5172,
        longitude: -61.4214
    },
    {
        name: "Montrose",
        region_or_municipality: "Chaguanas",
        island: "Trinidad",
        slug: "montrose",
        latitude: 10.5258,
        longitude: -61.3919
    },
    {
        name: "Lange Park",
        region_or_municipality: "Chaguanas",
        island: "Trinidad",
        slug: "lange-park",
        latitude: 10.5008,
        longitude: -61.3892
    },

    // ============================================
    // ARIMA
    // ============================================
    {
        name: "Arima",
        region_or_municipality: "Arima",
        island: "Trinidad",
        slug: "arima",
        population_estimate: 33606,
        latitude: 10.6361,
        longitude: -61.2839,
        isMajorCity: true
    },
    {
        name: "Malabar",
        region_or_municipality: "Arima",
        island: "Trinidad",
        slug: "malabar",
        latitude: 10.6308,
        longitude: -61.2706
    },
    {
        name: "O'Meara",
        region_or_municipality: "Arima",
        island: "Trinidad",
        slug: "omeara",
        latitude: 10.6453,
        longitude: -61.2958
    },

    // ============================================
    // POINT FORTIN
    // ============================================
    {
        name: "Point Fortin",
        region_or_municipality: "Point Fortin",
        island: "Trinidad",
        slug: "point-fortin",
        population_estimate: 20235,
        latitude: 10.1833,
        longitude: -61.6833,
        isMajorCity: true
    },
    {
        name: "Cap-de-Ville",
        region_or_municipality: "Point Fortin",
        island: "Trinidad",
        slug: "cap-de-ville",
        latitude: 10.1750,
        longitude: -61.6667
    },

    // ============================================
    // COUVA-TABAQUITE-TALPARO
    // ============================================
    {
        name: "Couva",
        region_or_municipality: "Couva-Tabaquite-Talparo",
        island: "Trinidad",
        slug: "couva",
        population_estimate: 178410,
        latitude: 10.4167,
        longitude: -61.4667,
        isMajorCity: true
    },
    {
        name: "California",
        region_or_municipality: "Couva-Tabaquite-Talparo",
        island: "Trinidad",
        slug: "california",
        latitude: 10.4000,
        longitude: -61.4500
    },
    {
        name: "Preysal",
        region_or_municipality: "Couva-Tabaquite-Talparo",
        island: "Trinidad",
        slug: "preysal",
        latitude: 10.3739,
        longitude: -61.4525
    },
    {
        name: "Claxton Bay",
        region_or_municipality: "Couva-Tabaquite-Talparo",
        island: "Trinidad",
        slug: "claxton-bay",
        latitude: 10.3500,
        longitude: -61.4667
    },
    {
        name: "Tabaquite",
        region_or_municipality: "Couva-Tabaquite-Talparo",
        island: "Trinidad",
        slug: "tabaquite",
        latitude: 10.4333,
        longitude: -61.3000
    },
    {
        name: "Talparo",
        region_or_municipality: "Couva-Tabaquite-Talparo",
        island: "Trinidad",
        slug: "talparo",
        latitude: 10.5500,
        longitude: -61.2667
    },
    {
        name: "Freeport",
        region_or_municipality: "Couva-Tabaquite-Talparo",
        island: "Trinidad",
        slug: "freeport",
        latitude: 10.4525,
        longitude: -61.4142
    },

    // ============================================
    // TUNAPUNA-PIARCO
    // ============================================
    {
        name: "Tunapuna",
        region_or_municipality: "Tunapuna-Piarco",
        island: "Trinidad",
        slug: "tunapuna",
        population_estimate: 215119,
        latitude: 10.6500,
        longitude: -61.3833,
        isMajorCity: true
    },
    {
        name: "Piarco",
        region_or_municipality: "Tunapuna-Piarco",
        island: "Trinidad",
        slug: "piarco",
        latitude: 10.5833,
        longitude: -61.3500
    },
    {
        name: "Curepe",
        region_or_municipality: "Tunapuna-Piarco",
        island: "Trinidad",
        slug: "curepe",
        latitude: 10.6333,
        longitude: -61.4000
    },
    {
        name: "St. Augustine",
        region_or_municipality: "Tunapuna-Piarco",
        island: "Trinidad",
        slug: "st-augustine",
        latitude: 10.6333,
        longitude: -61.4000
    },
    {
        name: "St. Joseph",
        region_or_municipality: "Tunapuna-Piarco",
        island: "Trinidad",
        slug: "st-joseph",
        latitude: 10.6500,
        longitude: -61.4167
    },
    {
        name: "Arouca",
        region_or_municipality: "Tunapuna-Piarco",
        island: "Trinidad",
        slug: "arouca",
        latitude: 10.6333,
        longitude: -61.3500
    },
    {
        name: "Trincity",
        region_or_municipality: "Tunapuna-Piarco",
        island: "Trinidad",
        slug: "trincity",
        latitude: 10.6244,
        longitude: -61.3472
    },
    {
        name: "Tacarigua",
        region_or_municipality: "Tunapuna-Piarco",
        island: "Trinidad",
        slug: "tacarigua",
        latitude: 10.6167,
        longitude: -61.3333
    },
    {
        name: "Macoya",
        region_or_municipality: "Tunapuna-Piarco",
        island: "Trinidad",
        slug: "macoya",
        latitude: 10.6375,
        longitude: -61.3333
    },
    {
        name: "La Horquetta",
        region_or_municipality: "Tunapuna-Piarco",
        island: "Trinidad",
        slug: "la-horquetta",
        latitude: 10.6083,
        longitude: -61.3250
    },
    {
        name: "Wallerfield",
        region_or_municipality: "Tunapuna-Piarco",
        island: "Trinidad",
        slug: "wallerfield",
        latitude: 10.6000,
        longitude: -61.3000
    },

    // ============================================
    // SANGRE GRANDE
    // ============================================
    {
        name: "Sangre Grande",
        region_or_municipality: "Sangre Grande",
        island: "Trinidad",
        slug: "sangre-grande",
        population_estimate: 71820,
        latitude: 10.5833,
        longitude: -61.1333,
        isMajorCity: true
    },
    {
        name: "Valencia",
        region_or_municipality: "Sangre Grande",
        island: "Trinidad",
        slug: "valencia",
        latitude: 10.6500,
        longitude: -61.2167
    },
    {
        name: "Matura",
        region_or_municipality: "Sangre Grande",
        island: "Trinidad",
        slug: "matura",
        latitude: 10.7167,
        longitude: -61.0333
    },
    {
        name: "Toco",
        region_or_municipality: "Sangre Grande",
        island: "Trinidad",
        slug: "toco",
        latitude: 10.8333,
        longitude: -60.9333
    },
    {
        name: "Manzanilla",
        region_or_municipality: "Sangre Grande",
        island: "Trinidad",
        slug: "manzanilla",
        latitude: 10.4833,
        longitude: -61.0500
    },

    // ============================================
    // PRINCES TOWN
    // ============================================
    {
        name: "Princes Town",
        region_or_municipality: "Princes Town",
        island: "Trinidad",
        slug: "princes-town",
        population_estimate: 101218,
        latitude: 10.2667,
        longitude: -61.3667,
        isMajorCity: true
    },
    {
        name: "Rio Claro",
        region_or_municipality: "Princes Town",
        island: "Trinidad",
        slug: "rio-claro",
        latitude: 10.3000,
        longitude: -61.1667
    },
    {
        name: "Tableland",
        region_or_municipality: "Princes Town",
        island: "Trinidad",
        slug: "tableland",
        latitude: 10.3167,
        longitude: -61.3167
    },
    {
        name: "Lengua",
        region_or_municipality: "Princes Town",
        island: "Trinidad",
        slug: "lengua",
        latitude: 10.3167,
        longitude: -61.2333
    },

    // ============================================
    // PENAL-DEBE
    // ============================================
    {
        name: "Penal",
        region_or_municipality: "Penal-Debe",
        island: "Trinidad",
        slug: "penal",
        population_estimate: 83609,
        latitude: 10.1667,
        longitude: -61.4667,
        isMajorCity: true
    },
    {
        name: "Debe",
        region_or_municipality: "Penal-Debe",
        island: "Trinidad",
        slug: "debe",
        latitude: 10.2167,
        longitude: -61.4500
    },
    {
        name: "Barrackpore",
        region_or_municipality: "Penal-Debe",
        island: "Trinidad",
        slug: "barrackpore",
        latitude: 10.2333,
        longitude: -61.3667
    },
    {
        name: "Siparia",
        region_or_municipality: "Penal-Debe",
        island: "Trinidad",
        slug: "siparia",
        latitude: 10.1500,
        longitude: -61.5000
    },

    // ============================================
    // SIPARIA
    // ============================================
    {
        name: "La Brea",
        region_or_municipality: "Siparia",
        island: "Trinidad",
        slug: "la-brea",
        latitude: 10.2333,
        longitude: -61.6167
    },
    {
        name: "Erin",
        region_or_municipality: "Siparia",
        island: "Trinidad",
        slug: "erin",
        latitude: 10.0833,
        longitude: -61.5833
    },
    {
        name: "Fyzabad",
        region_or_municipality: "Siparia",
        island: "Trinidad",
        slug: "fyzabad",
        latitude: 10.1833,
        longitude: -61.5167
    },
    {
        name: "Palo Seco",
        region_or_municipality: "Siparia",
        island: "Trinidad",
        slug: "palo-seco",
        latitude: 10.1500,
        longitude: -61.6000
    },

    // ============================================
    // MAYARO-RIO CLARO
    // ============================================
    {
        name: "Mayaro",
        region_or_municipality: "Mayaro-Rio Claro",
        island: "Trinidad",
        slug: "mayaro",
        population_estimate: 35000,
        latitude: 10.3000,
        longitude: -61.0000
    },
    {
        name: "Guayaguayare",
        region_or_municipality: "Mayaro-Rio Claro",
        island: "Trinidad",
        slug: "guayaguayare",
        latitude: 10.1500,
        longitude: -61.0333
    },

    // ============================================
    // TOBAGO
    // ============================================
    {
        name: "Scarborough",
        region_or_municipality: "Tobago",
        island: "Tobago",
        slug: "scarborough",
        population_estimate: 17537,
        latitude: 11.1833,
        longitude: -60.7333,
        isMajorCity: true
    },
    {
        name: "Crown Point",
        region_or_municipality: "Tobago",
        island: "Tobago",
        slug: "crown-point",
        latitude: 11.1500,
        longitude: -60.8333
    },
    {
        name: "Canaan",
        region_or_municipality: "Tobago",
        island: "Tobago",
        slug: "canaan",
        latitude: 11.1667,
        longitude: -60.8000
    },
    {
        name: "Bon Accord",
        region_or_municipality: "Tobago",
        island: "Tobago",
        slug: "bon-accord",
        latitude: 11.1611,
        longitude: -60.8125
    },
    {
        name: "Lowlands",
        region_or_municipality: "Tobago",
        island: "Tobago",
        slug: "lowlands",
        latitude: 11.1500,
        longitude: -60.8000
    },
    {
        name: "Buccoo",
        region_or_municipality: "Tobago",
        island: "Tobago",
        slug: "buccoo",
        latitude: 11.1833,
        longitude: -60.8333
    },
    {
        name: "Plymouth",
        region_or_municipality: "Tobago",
        island: "Tobago",
        slug: "plymouth",
        latitude: 11.2167,
        longitude: -60.7667
    },
    {
        name: "Moriah",
        region_or_municipality: "Tobago",
        island: "Tobago",
        slug: "moriah",
        latitude: 11.2500,
        longitude: -60.7333
    },
    {
        name: "Castara",
        region_or_municipality: "Tobago",
        island: "Tobago",
        slug: "castara",
        latitude: 11.2667,
        longitude: -60.7000
    },
    {
        name: "Roxborough",
        region_or_municipality: "Tobago",
        island: "Tobago",
        slug: "roxborough",
        latitude: 11.2667,
        longitude: -60.5833
    },
    {
        name: "Speyside",
        region_or_municipality: "Tobago",
        island: "Tobago",
        slug: "speyside",
        latitude: 11.3000,
        longitude: -60.5333
    },
    {
        name: "Charlotteville",
        region_or_municipality: "Tobago",
        island: "Tobago",
        slug: "charlotteville",
        latitude: 11.3167,
        longitude: -60.5500
    },
    {
        name: "Mason Hall",
        region_or_municipality: "Tobago",
        island: "Tobago",
        slug: "mason-hall",
        latitude: 11.2333,
        longitude: -60.6833
    }
];

// Helper functions
export const getLocationsByIsland = (island: 'Trinidad' | 'Tobago'): TrinidadLocation[] => {
    return TRINIDAD_LOCATIONS.filter(loc => loc.island === island);
};

export const getMajorCities = (): TrinidadLocation[] => {
    return TRINIDAD_LOCATIONS.filter(loc => loc.isMajorCity);
};

export const getLocationBySlug = (slug: string): TrinidadLocation | undefined => {
    return TRINIDAD_LOCATIONS.find(loc => loc.slug === slug);
};

export const getLocationsByRegion = (region: string): TrinidadLocation[] => {
    return TRINIDAD_LOCATIONS.filter(loc => loc.region_or_municipality === region);
};

export const getAllRegions = (): string[] => {
    return [...new Set(TRINIDAD_LOCATIONS.map(loc => loc.region_or_municipality))];
};
