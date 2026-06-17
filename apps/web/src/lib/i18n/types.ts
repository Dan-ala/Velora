export type Locale = 'en' | 'es';

export type TranslationValue = string | { [key: string]: TranslationValue };

export type Translations = {
  [K in string]: TranslationValue;
};
