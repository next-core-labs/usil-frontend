import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const resources = {
  ar: {
    translation: {
      appName: 'يوصل',
      brandSubtitle: 'سوق مدار لتوريد المناسبات',
      vendorOSBadge: 'نظام تشغيل المورّد (Usil Vendor OS) — الفواتير، مسير الأجور، والمصروفات',
      searchPlaceholder: 'ابحث عن قهوة سعودية، بوفيه، تنسيق قاعات، مباشرين...',
      searchPlaceholderMobile: 'ابحث عن خدمة أو مورّد...',
      allCities: 'جميع المدن',
      liveTrack: 'تتبع المناسبة',
      crewPortal: 'بوابة الطاقم',
      aiTools: 'أدوات الذكاء الاصطناعي',
      voiceAgent: 'وكيل يوصل الصوتي',
      smartBundles: 'باقات توفير يوصل',
      calculator: 'الحاسبة',
      loginOtp: 'تسجيل دخول',
      logout: 'تسجيل الخروج',
      vendorPortal: 'بوابة المورّد',
      clientStore: 'سوق العملاء',
      bookingCart: 'سلة الحجز',
      myAccount: 'حسابي',
      welcome: 'مرحباً',
      langArabic: 'العربية',
      langEnglish: 'English',
      switchLang: 'تغيير اللغة',
      selectCurrency: 'العملة',
      currencyRateNotice: 'الأسعار محولة وفق سعر الصرف التقريبي',
      currencySAR: 'ريال سعودي (SAR)',
      currencyUSD: 'دولار أمريكي (USD)',
      currencyEUR: 'يورو أوروبي (EUR)',
    },
  },
  en: {
    translation: {
      appName: 'Usil',
      brandSubtitle: 'The operating marketplace for event supply',
      vendorOSBadge: 'Usil Vendor OS — Invoicing, Crew Payroll & Financial Operations',
      searchPlaceholder: 'Search coffee service, buffet, hall setup, crew...',
      searchPlaceholderMobile: 'Search a service or supplier...',
      allCities: 'All Cities',
      liveTrack: 'Live Track',
      crewPortal: 'Crew Portal',
      aiTools: 'AI tools',
      voiceAgent: 'Usil Voice Concierge',
      smartBundles: 'Usil AI Bundles',
      calculator: 'Cost Calculator',
      loginOtp: 'Sign in',
      logout: 'Sign Out',
      vendorPortal: 'Vendor OS',
      clientStore: 'Client marketplace',
      bookingCart: 'Booking Cart',
      myAccount: 'My Account',
      welcome: 'Welcome',
      langArabic: 'العربية',
      langEnglish: 'English',
      switchLang: 'Change Language',
      selectCurrency: 'Currency',
      currencyRateNotice: 'Prices converted based on approximate exchange rates',
      currencySAR: 'Saudi Riyal (SAR)',
      currencyUSD: 'US Dollar (USD)',
      currencyEUR: 'Euro (EUR)',
    },
  },
};

const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('usil_language') || 'ar' : 'ar';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
  });

if (typeof document !== 'undefined') {
  const applyDirection = (lng: string) => {
    const isRtl = lng === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
    try {
      localStorage.setItem('usil_language', lng);
    } catch {
      // ignore
    }
  };

  applyDirection(i18n.language || 'ar');

  i18n.on('languageChanged', (lng) => {
    applyDirection(lng);
  });
}

export default i18n;
