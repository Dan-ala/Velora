export const BRAND = {
  NAME: 'VELORA',
  SLOGAN: 'Wear your identity',
  DESCRIPTION: 'Premium clothing for the modern individual.',
} as const;

export const CURRENCY = {
  COP: 'COP',
  USD: 'USD',
} as const;

export const DEFAULT_LOCALE = 'es-CO';

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
} as const;

export const CLOUDINARY = {
  BASE_URL: 'https://res.cloudinary.com',
  F_QUALITY: 'q_auto',
  F_FORMAT: 'f_auto',
};

export const SHIPPING = {
  FREE_THRESHOLD: 200000,
  STANDARD_COST: 15000,
};

export const STOCK_THRESHOLDS = {
  LOW: 10,
  OUT_OF_STOCK: 0,
};
