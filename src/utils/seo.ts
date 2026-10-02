import { PAGE_SEO as FALLBACK, type SeoPage as FallbackPage } from './seoFallbacks';
import { normalizeSeoPath, seoMetaForPath } from '../contracts/seo/seo-meta';

export type SeoPage =
  | FallbackPage
  | 'hospitality'
  | 'about'
  | 'courier'
  | 'catalog'
  | 'compare'
  | 'cart'
  | 'checkout'
  | 'orders'
  | 'account'
  | 'chat'
  | 'login'
  | 'request'
  | 'providers'
  | 'payment-success'
  | 'payment-cancelled';

export type PublicSeo = {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogSiteName?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalBaseUrl?: string;
  googleSiteVerification?: string;
  analyticsId?: string;
  pages?: Record<string, { title?: string; description?: string }>;
};

export const PAGE_SEO: Record<SeoPage, { title: string; description: string }> = {
  ...FALLBACK,
  hospitality: {
    title: 'ضيافة وقهوة عربية | يوصل',
    description:
      'اطلب ركن القهوة العربية والضيافة من مزودين موثّقين في الرياض وجدة وباقي مدن السعودية، بسعر نهائي شامل الضريبة.',
  },
  about: {
    title: 'عن يوصل | سوق توريد المناسبات',
    description:
      'يوصل (Usil) سوق إلكتروني لتوريد المناسبات في السعودية: مورّدون موثّقون، سعر نهائي شامل الضريبة، ووسيط يتابع التنفيذ.',
  },
  catalog: {
    title: 'كل الخدمات | يوصل',
    description: 'تصفّح خدمات المناسبات من مورّدين موثّقين في 15 فئة و13 منطقة سعودية، بسعر نهائي شامل الضريبة.',
  },
  compare: { title: 'قارن بين خدمتين | يوصل', description: 'قارن السعر والتقييم والتغطية وطريقة التأكيد بين خدمتين قبل الحجز.' },
  cart: { title: 'سلة الحجز | يوصل', description: 'راجع خدمات مناسبتك قبل إتمام الحجز والدفع الآمن عبر ميسر.' },
  checkout: { title: 'إتمام الحجز | يوصل', description: 'بيانات المناسبة ثم الدفع الآمن عبر ميسر: مدى، Apple Pay، البطاقات، وSTC Pay.' },
  orders: { title: 'طلباتي | يوصل', description: 'تابع حالة طلباتك والدفع والإلغاء حسب سياسة الاسترجاع.' },
  account: { title: 'حسابي | يوصل', description: 'حسابك في يوصل: الطلبات، المحادثات، المفضلة، واللغة.' },
  chat: { title: 'المحادثات | يوصل', description: 'راسل المورّدين قبل الحجز وبعده من مكان واحد.' },
  login: { title: 'تسجيل الدخول | يوصل', description: 'سجّل دخولك إلى يوصل أو أنشئ حساب عميل جديد.' },
  request: { title: 'طلب خاص | يوصل', description: 'احكِ لنا عن مناسبتك ونطابق طلبك مع مورّد يغطي مدينتك.' },
  providers: { title: 'انضم كمزوّد | يوصل', description: 'سجّل كمورّد معتمد في يوصل واستقبل حجوزات مدفوعة عبر ميسر.' },
  'payment-success': { title: 'تم تأكيد حجزك | يوصل', description: 'ميسر أكّد الدفع. تابع طلبك من حسابك.' },
  'payment-cancelled': { title: 'أُلغيت عملية الدفع | يوصل', description: 'ما خصمنا شيئاً. ارجع للسلة وادفع متى ما جاهز.' },
};

let remote: PublicSeo | null = null;
let remoteLoaded = false;

function upsertMeta(selector: string, attr: 'name' | 'property' | 'rel', key: string, content: string, tag: 'meta' | 'link' = 'meta') {
  if (typeof document === 'undefined' || !content) return;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement(tag);
    if (tag === 'meta') el.setAttribute(attr === 'property' ? 'property' : 'name', key);
    else el.setAttribute('rel', key);
    document.head.appendChild(el);
  }
  if (tag === 'link') el.setAttribute('href', content);
  else el.setAttribute('content', content);
}

// نفس ترتيب الخادم: تعديل الأدمن، ثم خريطة الميتا لكل مسار، ثم الافتراضي.
// قيمة الأدمن المطابقة للافتراضي تعني أن الصفحة لم تُحرَّر، فالخريطة أدق منها.
function adminEdit(value: string | undefined, builtIn: string): string {
  const current = (value || '').trim();
  return !current || current === builtIn.trim() ? '' : current;
}

function resolved(page: string, pathname: string): { title: string; description: string } {
  const fallback = PAGE_SEO[(page as SeoPage)] || PAGE_SEO.home;
  const override = remote?.pages?.[page] || (page === 'home' ? remote : undefined);
  // الخريطة تُطابق المسار الكامل، فتغطي صفحات الخدمات التي لا مفتاح أدمن لها
  const meta = seoMetaForPath(pathname);
  return {
    title: adminEdit(override?.title, fallback.title) || meta?.title || override?.title || remote?.title || fallback.title,
    description:
      adminEdit(override?.description, fallback.description) ||
      meta?.description ||
      override?.description ||
      remote?.description ||
      fallback.description,
  };
}

export function applySeo(page: SeoPage | string = 'home', pathname?: string) {
  if (typeof document === 'undefined') return;
  // المسار الحقيقي لا اسم الصفحة: صفحات الخدمات تسقط كلها على مفتاح home،
  // فبدونه تُكتب عناوين الرئيسية فوق ما حقنه الخادم.
  const path = normalizeSeoPath(pathname ?? window.location.pathname);
  const seo = resolved(page, path);
  document.title = seo.title;
  upsertMeta('meta[name="description"]', 'name', 'description', seo.description);
  upsertMeta('meta[name="keywords"]', 'name', 'keywords', remote?.keywords || '');
  upsertMeta('meta[property="og:title"]', 'property', 'og:title', remote?.ogTitle || seo.title);
  upsertMeta('meta[property="og:description"]', 'property', 'og:description', remote?.ogDescription || seo.description);
  upsertMeta('meta[property="og:image"]', 'property', 'og:image', remote?.ogImage || '');
  upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', remote?.ogSiteName || 'يوصل');
  upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', remote?.twitterCard || 'summary_large_image');
  upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', remote?.twitterTitle || seo.title);
  upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', remote?.twitterDescription || seo.description);
  upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', remote?.twitterImage || remote?.ogImage || '');
  const canonicalBase = (remote?.canonicalBaseUrl || 'https://usil.app').replace(/\/$/, '');
  upsertMeta('link[rel="canonical"]', 'rel', 'canonical', `${canonicalBase}${path}`, 'link');
  if (remote?.googleSiteVerification) {
    upsertMeta('meta[name="google-site-verification"]', 'name', 'google-site-verification', remote.googleSiteVerification);
  }
}

export async function loadRemoteSeo(): Promise<PublicSeo | null> {
  if (remoteLoaded) return remote;
  remoteLoaded = true;
  try {
    const res = await fetch('/api/seo/public');
    const data = await res.json();
    if (data?.success && data.data) {
      remote = data.data as PublicSeo;
    }
  } catch {
    remote = null;
  }
  return remote;
}

export function applySeoFromPath(pathname?: string) {
  const path = normalizeSeoPath(pathname || (typeof window !== 'undefined' ? window.location.pathname : '/'));
  const key = path.replace(/^\//, '');
  const page = key && key in PAGE_SEO ? key : 'home';
  return applySeo(page, path);
}
