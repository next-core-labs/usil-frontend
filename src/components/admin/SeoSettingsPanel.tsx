import React, { useEffect, useMemo, useState } from 'react';
import { controlClass } from '../ui/Field';
import { AlertCircle, CheckCircle2, Loader2, Search, Save, RefreshCw } from 'lucide-react';

type PageKey =
  | 'home'
  | 'privacy'
  | 'terms'
  | 'refund'
  | 'support'
  | 'hospitality'
  | 'about'
  | 'courier';

type PageOverride = {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
};

type SeoForm = {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  keywords: string;
  keywordsEn: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogSiteName: string;
  twitterCard: 'summary' | 'summary_large_image';
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  canonicalBaseUrl: string;
  robotsTxt: string;
  googleSiteVerification: string;
  googleHtmlFileToken: string;
  analyticsId: string;
  pages: Record<PageKey, PageOverride>;
};

const PAGE_META: { key: PageKey; label: string; path: string }[] = [
  { key: 'home', label: 'الصفحة الرئيسية', path: '/' },
  { key: 'about', label: 'عن يوصل', path: '/about' },
  { key: 'hospitality', label: 'ضيافة وقهوة', path: '/hospitality' },
  { key: 'courier', label: 'مندوب التوصيل', path: '/courier' },
  { key: 'privacy', label: 'سياسة الخصوصية', path: '/privacy' },
  { key: 'terms', label: 'شروط الاستخدام', path: '/terms' },
  { key: 'refund', label: 'سياسة الاسترجاع', path: '/refund' },
  { key: 'support', label: 'الدعم والتواصل', path: '/support' },
];

const emptyPage = (): PageOverride => ({ title: '', titleEn: '', description: '', descriptionEn: '' });

const emptyForm = (): SeoForm => ({
  title: '',
  titleEn: '',
  description: '',
  descriptionEn: '',
  keywords: '',
  keywordsEn: '',
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  ogSiteName: 'يوصل',
  twitterCard: 'summary_large_image',
  twitterTitle: '',
  twitterDescription: '',
  twitterImage: '',
  canonicalBaseUrl: 'https://usil.app',
  robotsTxt: '',
  googleSiteVerification: '',
  googleHtmlFileToken: '',
  analyticsId: '',
  pages: {
    home: emptyPage(),
    privacy: emptyPage(),
    terms: emptyPage(),
    refund: emptyPage(),
    support: emptyPage(),
    hospitality: emptyPage(),
    about: emptyPage(),
    courier: emptyPage(),
  },
});

function Field({
  label,
  hint,
  value,
  onChange,
  textarea,
  dir,
  max,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  dir?: 'rtl' | 'ltr';
  max?: number;
}) {
  const inputClass = controlClass;
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between gap-3 text-sm font-bold text-slate-800">
        {label}
        {max ? (
          <span className={`text-2xs font-medium ${value.length > max ? 'text-rose-600' : 'text-slate-400'}`}>
            {value.length}/{max}
          </span>
        ) : null}
      </span>
      {textarea ? (
        <textarea className={`${inputClass} min-h-[88px]`} value={value} dir={dir} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={inputClass} value={value} dir={dir} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint ? <span className="block text-2xs text-slate-500 leading-relaxed">{hint}</span> : null}
    </label>
  );
}

export function SeoSettingsPanel() {
  const [form, setForm] = useState<SeoForm>(emptyForm);
  const [pageKey, setPageKey] = useState<PageKey>('home');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const showToast = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4200);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/seo', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'تعذر تحميل إعدادات الظهور. تأكد أنك داخل حساب المدير.');
        return;
      }
      setForm({ ...emptyForm(), ...data.data, pages: { ...emptyForm().pages, ...(data.data.pages || {}) } });
    } catch {
      setError('تعذر الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const preview = useMemo(() => {
    const page = form.pages[pageKey];
    return {
      title: page?.title || form.title,
      description: page?.description || form.description,
      path: PAGE_META.find((item) => item.key === pageKey)?.path || '/',
    };
  }, [form, pageKey]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const message = data.error || 'تعذر حفظ إعدادات الظهور.';
        setError(message);
        showToast('err', message);
        return;
      }
      setForm({ ...emptyForm(), ...data.data, pages: { ...emptyForm().pages, ...(data.data.pages || {}) } });
      showToast('ok', 'تم حفظ إعدادات الظهور. حدّث الصفحة بقوة لترى العنوان في المتصفح.');
    } catch {
      const message = 'تعذر الاتصال بالخادم أثناء الحفظ.';
      setError(message);
      showToast('err', message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = controlClass;

  if (loading) {
    return (
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm" dir="rtl">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-action" />
          جارٍ تحميل إعدادات تحسين الظهور…
        </div>
      </section>
    );
  }

  if (error && !form.title) {
    return (
      <section className="bg-white border border-rose-200 rounded-3xl p-8 shadow-sm space-y-4" dir="rtl">
        <div className="flex items-start gap-2 text-rose-700">
          <AlertCircle className="w-5 h-5 mt-0.5" />
          <p className="font-bold">{error}</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-action text-white text-sm font-bold"
        >
          <RefreshCw className="w-4 h-4" />
          إعادة المحاولة
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={save} className="space-y-6" dir="rtl">
      {toast ? (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] px-4 py-3 rounded-2xl shadow-lg text-sm font-bold flex items-center gap-2 ${
            toast.type === 'ok' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {toast.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      ) : null}

      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-navy">تحسين الظهور / SEO</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              من هنا تضبط عنوان الموقع ووصفه وبطاقات المشاركة وخريطة الموقع. هذا لا يرفع الترتيب بين ليلة وضحاها —
              بعد الحفظ أرسل <span dir="ltr">sitemap.xml</span> من حساب Search Console.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            إعادة التحميل
          </button>
        </div>
        {error ? (
          <div className="flex items-start gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl p-3">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            {error}
          </div>
        ) : null}
      </section>

      <section className="bg-paper border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Search className="w-4 h-4 text-action" />
          معاينة نتيجة بحث جوجل
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 max-w-xl">
          {/* Google SERP colours on purpose — this block previews how the
              listing looks on Google, so it must match their palette, not ours. */}
          <div className="text-sm text-[#202124]" dir="ltr">
            https://usil.app{preview.path === '/' ? '' : preview.path}
          </div>
          <div className="text-xl text-[#1a0dab] font-medium leading-snug mt-1 line-clamp-2">{preview.title || '—'}</div>
          <div className="text-sm text-[#4d5156] mt-1 leading-relaxed line-clamp-2">{preview.description || '—'}</div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold">العنوان والوصف الافتراضي</h3>
        <Field label="عنوان الموقع (عربي)" value={form.title} max={60} onChange={(title) => setForm({ ...form, title })} />
        <Field
          label="وصف الموقع (عربي)"
          textarea
          max={160}
          value={form.description}
          onChange={(description) => setForm({ ...form, description })}
        />
        <Field
          label="كلمات مفتاحية"
          hint="افصل بفاصلة: يوصل, ضيافة, مناسبات…"
          value={form.keywords}
          onChange={(keywords) => setForm({ ...form, keywords })}
        />
        <details className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
          <summary className="cursor-pointer font-bold text-sm">نسخة إنجليزية اختيارية</summary>
          <div className="mt-3 space-y-3">
            <Field label="Title (English)" dir="ltr" value={form.titleEn} onChange={(titleEn) => setForm({ ...form, titleEn })} />
            <Field
              label="Description (English)"
              textarea
              dir="ltr"
              value={form.descriptionEn}
              onChange={(descriptionEn) => setForm({ ...form, descriptionEn })}
            />
            <Field
              label="Keywords (English)"
              dir="ltr"
              value={form.keywordsEn}
              onChange={(keywordsEn) => setForm({ ...form, keywordsEn })}
            />
          </div>
        </details>
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold">Open Graph — مشاركة واتساب / تويتر / لينكدإن</h3>
        <Field label="عنوان OG" value={form.ogTitle} onChange={(ogTitle) => setForm({ ...form, ogTitle })} />
        <Field label="وصف OG" textarea value={form.ogDescription} onChange={(ogDescription) => setForm({ ...form, ogDescription })} />
        <Field
          label="صورة OG (رابط كامل)"
          dir="ltr"
          hint="يفضّل صورة 1200×630. اترك الافتراضي إن لم ترفع صورة بعد."
          value={form.ogImage}
          onChange={(ogImage) => setForm({ ...form, ogImage })}
        />
        <Field label="اسم الموقع" value={form.ogSiteName} onChange={(ogSiteName) => setForm({ ...form, ogSiteName })} />
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold">بطاقة تويتر / X</h3>
        <label className="block space-y-1.5">
          <span className="text-sm font-bold">نوع البطاقة</span>
          <select
            className={inputClass}
            value={form.twitterCard}
            onChange={(e) => setForm({ ...form, twitterCard: e.target.value as SeoForm['twitterCard'] })}
          >
            <option value="summary_large_image">صورة كبيرة</option>
            <option value="summary">ملخص صغير</option>
          </select>
        </label>
        <Field label="عنوان البطاقة" value={form.twitterTitle} onChange={(twitterTitle) => setForm({ ...form, twitterTitle })} />
        <Field
          label="وصف البطاقة"
          textarea
          value={form.twitterDescription}
          onChange={(twitterDescription) => setForm({ ...form, twitterDescription })}
        />
        <Field
          label="صورة البطاقة"
          dir="ltr"
          value={form.twitterImage}
          onChange={(twitterImage) => setForm({ ...form, twitterImage })}
        />
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold">الرابط الأساسي وrobots.txt</h3>
        <Field
          label="Canonical base URL"
          dir="ltr"
          value={form.canonicalBaseUrl}
          onChange={(canonicalBaseUrl) => setForm({ ...form, canonicalBaseUrl })}
          hint="الافتراضي https://usil.app"
        />
        <Field
          label="محتوى robots.txt"
          textarea
          dir="ltr"
          value={form.robotsTxt}
          onChange={(robotsTxt) => setForm({ ...form, robotsTxt })}
          hint="يُنشر على https://usil.app/robots.txt — اترك السماح للجميع مع رابط الخريطة ما لم تحتاج حجب مسار."
        />
        <p className="text-2xs text-slate-500">
          خريطة الموقع تُولَّد تلقائياً:{' '}
          <a className="text-action font-bold" href="/sitemap.xml" target="_blank" rel="noreferrer">
            /sitemap.xml
          </a>
        </p>
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold">تحقق Search Console وتحليلات جوجل</h3>
        <Field
          label="رمز تحقق Google (meta)"
          dir="ltr"
          value={form.googleSiteVerification}
          onChange={(googleSiteVerification) => setForm({ ...form, googleSiteVerification })}
          hint="الصق قيمة content من وسم google-site-verification. يوصل لا يدخل حساب جوجل نيابة عنك."
        />
        <Field
          label="ملف تحقق HTML"
          dir="ltr"
          value={form.googleHtmlFileToken}
          onChange={(googleHtmlFileToken) => setForm({ ...form, googleHtmlFileToken })}
          hint="مثال: google123abc.html — يُخدم على نفس المسار بعد الحفظ."
        />
        <Field
          label="معرّف Analytics أو GTM (اختياري)"
          dir="ltr"
          value={form.analyticsId}
          onChange={(analyticsId) => setForm({ ...form, analyticsId })}
          hint="G-XXXXXXXX أو GTM-XXXXXXX فقط. يُحقن في الصفحة إن وُجد."
        />
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold">تخصيص الصفحات</h3>
        <div className="flex flex-wrap gap-2">
          {PAGE_META.map((page) => (
            <button
              key={page.key}
              type="button"
              onClick={() => setPageKey(page.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                pageKey === page.key
                  ? 'bg-navy text-white border-navy'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {page.label}
            </button>
          ))}
        </div>
        <p className="text-2xs text-slate-500" dir="ltr">
          {PAGE_META.find((item) => item.key === pageKey)?.path}
        </p>
        <Field
          label="عنوان الصفحة"
          value={form.pages[pageKey].title}
          max={60}
          onChange={(title) => setForm({ ...form, pages: { ...form.pages, [pageKey]: { ...form.pages[pageKey], title } } })}
        />
        <Field
          label="وصف الصفحة"
          textarea
          max={160}
          value={form.pages[pageKey].description}
          onChange={(description) =>
            setForm({ ...form, pages: { ...form.pages, [pageKey]: { ...form.pages[pageKey], description } } })
          }
        />
        <details className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
          <summary className="cursor-pointer font-bold text-sm">English for this page</summary>
          <div className="mt-3 space-y-3">
            <Field
              label="Title"
              dir="ltr"
              value={form.pages[pageKey].titleEn}
              onChange={(titleEn) =>
                setForm({ ...form, pages: { ...form.pages, [pageKey]: { ...form.pages[pageKey], titleEn } } })
              }
            />
            <Field
              label="Description"
              textarea
              dir="ltr"
              value={form.pages[pageKey].descriptionEn}
              onChange={(descriptionEn) =>
                setForm({ ...form, pages: { ...form.pages, [pageKey]: { ...form.pages[pageKey], descriptionEn } } })
              }
            />
          </div>
        </details>
      </section>

      <div className="sticky bottom-4 z-10">
        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-action hover:bg-[#1249c7] text-white font-bold disabled:opacity-60 shadow-lg"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'جارٍ الحفظ…' : 'حفظ إعدادات الظهور'}
        </button>
      </div>
    </form>
  );
}
