import { useTranslation } from 'react-i18next';
import { CATEGORY_EN, STOREFRONT_COPY, type StorefrontCopy, type StorefrontLang } from './copy';

export type Lang = {
  lang: StorefrontLang;
  ar: boolean;
  dir: 'rtl' | 'ltr';
  t: StorefrontCopy;
  /** Pick the Arabic or English variant of a pair. */
  L: (arText: string, enText: string) => string;
  /** `scaleX(-1)` in Arabic so directional chevrons point the right way. */
  flip: string;
  flipInv: string;
  toggle: () => void;
  categoryName: (id: string, arName: string) => string;
};

export function useLang(): Lang {
  const { i18n } = useTranslation();
  const lang: StorefrontLang = String(i18n.language || 'ar').startsWith('en') ? 'en' : 'ar';
  const ar = lang === 'ar';
  return {
    lang,
    ar,
    dir: ar ? 'rtl' : 'ltr',
    t: STOREFRONT_COPY[lang] as StorefrontCopy,
    L: (arText, enText) => (ar ? arText : enText),
    flip: ar ? 'scaleX(-1)' : 'none',
    flipInv: ar ? 'none' : 'scaleX(-1)',
    toggle: () => void i18n.changeLanguage(ar ? 'en' : 'ar'),
    categoryName: (id, arName) => (ar ? arName : CATEGORY_EN[id] || arName),
  };
}
