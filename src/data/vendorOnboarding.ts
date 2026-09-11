export const PROJECT_TYPES = [
  'تنظيم حفلات ومناسبات',
  'حفلات زواج وملكة',
  'حفلات تخرج ونجاح',
  'أعياد ميلاد ومولود',
  'حفلات خطوبة وشبّكة',
  'عزاء ومآتم',
  'ضيافة قهوة وشاي',
  'بوفيه وتموين مناسبات',
  'تموين معارض ومؤتمرات',
  'تنظيم معارض وبوثات',
  'تنظيم مؤتمرات وملتقيات',
  'قاعات واستراحات',
  'تصوير فوتوغرافي وفيديو',
  'تصوير أعراس ومناسبات',
  'صوتيات وإضاءة وشاشات',
  'مسارح ومنصات عرض',
  'ورد وتنسيق طاولات',
  'كوش أفراح وديكور حفلات',
  'حلويات وكيك وعصائر',
  'صبابين وطاقم تقديم',
  'تأجير أثاث وديكور',
  'تأجير خيام ومظلات',
  'فرق تراثية وفنون شعبية',
  'دي جي وفقرات ترفيه',
  'حراسات وتنظيم دخول',
  'طباعة دعوات وهدايا تذكارية',
  'نقل وتوصيل مستلزمات',
  'أخرى',
] as const;

export const SAUDI_BANKS = [
  'مصرف الراجحي',
  'البنك الأهلي السعودي',
  'بنك الرياض',
  'مصرف الإنماء',
  'بنك البلاد',
  'بنك الجزيرة',
  'البنك العربي الوطني',
  'بنك ساب',
  'البنك السعودي للاستثمار',
  'بنك الخليج الدولي',
  'بنك الإمارات دبي الوطني',
  'بنك الكويت الوطني',
  'بنك قطر الوطني',
  'البنك الأهلي المصري',
  'ستاندرد تشارترد',
  'دويتشه بنك',
  'بنك مسقط',
  'بنك البحرين الوطني',
  'جي بي مورغان',
  'بنك الصين',
] as const;

export type VendorRegisterForm = {
  firstName: string;
  fatherName: string;
  familyName: string;
  projectName: string;
  nationalId: string;
  email: string;
  phone: string;
  commercialRegister: string;
  password: string;
  passwordConfirm: string;
  projectType: string;
  projectTypeOther: string;
  bankName: string;
  iban: string;
  accountHolderName: string;
  logoDataUrl?: string;
  fulfillment: Array<'hour' | 'same_day' | 'tomorrow' | 'instant'>;
  instagram: string;
  tiktok: string;
  snapchat: string;
  x: string;
  youtube: string;
  whatsapp: string;
  confirmedOwn: boolean;
};

export const emptyVendorRegisterForm = (): VendorRegisterForm => ({
  firstName: '',
  fatherName: '',
  familyName: '',
  projectName: '',
  nationalId: '',
  email: '',
  phone: '',
  commercialRegister: '',
  password: '',
  passwordConfirm: '',
  projectType: '',
  projectTypeOther: '',
  bankName: '',
  iban: '',
  accountHolderName: '',
  logoDataUrl: '',
  fulfillment: [],
  instagram: '',
  tiktok: '',
  snapchat: '',
  x: '',
  youtube: '',
  whatsapp: '',
  confirmedOwn: false,
});
