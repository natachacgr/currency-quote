export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'AUD',
  'CHF',
  'CNY',
  'ARS',
  'MXN',
] as const;

export type SupportedCurrency =
  (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCIES: SupportedCurrency[] = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'AUD',
  'CHF',
  'CNY',
  'ARS',
  'MXN',
];