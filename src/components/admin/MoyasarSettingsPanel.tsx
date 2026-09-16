import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, CreditCard, Loader2, Save } from 'lucide-react';

type MoyasarStatus = {
  configured: boolean;
  form: boolean;
  live: boolean;
  secretMasked: string;
  secretSource: 'saved' | 'env' | 'none';
  publishableMasked: string;
  publishableSource: 'saved' | 'env' | 'none';
  webhookUrl: string;
  webhookSecretSet: boolean;
  updatedAt: string | null;
};

type WebhookResult = { ok: boolean; status?: string; error?: string };

export function MoyasarSettingsPanel() {
  const [status, setStatus] = useState<MoyasarStatus | null>(null);
  const [secretKey, setSecretKey] = useState('');
  const [publishableKey, setPublishableKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const [webhook, setWebhook] = useState<WebhookResult | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/moyasar', { credentials: 'include' });
      const json = (await res.json()) as { success?: boolean; data?: MoyasarStatus; error?: string };
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'تعذر قراءة حالة ميسر.');
      }
      setStatus(json.data);
    } catch (err) {
      setError((err as Error).message);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    setOkMessage(null);
    setWebhook(null);
    try {
      const res = await fetch('/api/admin/moyasar', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secretKey: secretKey.trim() || undefined,
          publishableKey: publishableKey.trim() || undefined,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        data?: MoyasarStatus;
        webhook?: WebhookResult;
      };
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'تعذر حفظ مفاتيح ميسر.');
      }
      setStatus(json.data);
      setSecretKey('');
      setPublishableKey('');
      setWebhook(json.webhook || null);
      setOkMessage(
        json.data.live
          ? 'ميسر مفعّل على الوضع الحي (sk_live_). العملاء يقدرون يدفعون بمدى وآبل باي وSTC Pay.'
          : 'ميسر مفعّل على وضع التجربة (sk_test_). بدّله بـ sk_live_ قبل استقبال دفعات حقيقية.',
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold inline-flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-action" />
            ميسر — الدفع الإلكتروني
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            من لوحة ميسر: Secret Keys → اضغط العين بجانب Secret Key وانسخ القيمة الكاملة التي تبدأ بـ
            {' '}
            <span dir="ltr">sk_live_</span>
            {' '}
            أو
            {' '}
            <span dir="ltr">sk_test_</span>
            . لا تنسخ المعرّف الذي فيه نجوم، ولا المفتاح العام
            {' '}
            <span dir="ltr">pk_</span>
            .
          </p>
        </div>
        {status?.configured ? (
          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-full ${
              status.live ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
            }`}
          >
            {status.live ? 'مفعّل — وضع حي' : 'مفعّل — وضع تجربة'}
          </span>
        ) : (
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-rose-50 text-rose-700">غير مفعّل</span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 inline-flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          جارٍ التحميل…
        </p>
      ) : null}

      {status && !loading ? (
        <dl className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <dt className="text-xs font-medium text-slate-500">المفتاح السري</dt>
            <dd className="font-mono text-slate-900 mt-1" dir="ltr">
              {status.secretMasked || 'غير محفوظ'}
            </dd>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <dt className="text-xs font-medium text-slate-500">المفتاح العام (اختياري)</dt>
            <dd className="font-mono text-slate-900 mt-1" dir="ltr">
              {status.publishableMasked || 'غير مطلوب لفاتورة ميسر المستضافة'}
            </dd>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:col-span-2">
            <dt className="text-xs font-medium text-slate-500">ويبهوك ميسر</dt>
            <dd className="font-mono text-sm text-slate-800 mt-1 break-all" dir="ltr">
              {status.webhookUrl}
            </dd>
            <dd className="text-xs text-slate-500 mt-2">
              {status.webhookSecretSet
                ? 'سر الويبهوك موجود على الخادم. سجّل Cloudflare سجل A اسم hooks على 8.213.85.166 و DNS only (سحابة رمادية) حتى تصل إشعارات الدفع.'
                : 'سر الويبهوك ناقص على الخادم. الدفع بالفاتورة يشتغل، والتأكيد الفوري يتم عند رجوع العميل من ميسر.'}
            </dd>
          </div>
        </dl>
      ) : null}

      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Secret Key</span>
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder={status?.secretMasked ? 'اتركه فارغاً للإبقاء على المفتاح الحالي' : 'sk_live_…'}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-mono"
            dir="ltr"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Publishable Key — اختياري</span>
          <input
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={publishableKey}
            onChange={(e) => setPublishableKey(e.target.value)}
            placeholder="pk_live_… إن رغبت بنموذج البطاقة داخل الصفحة"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-mono"
            dir="ltr"
          />
        </label>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || (!secretKey.trim() && !status?.configured)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-action text-white text-sm font-bold hover:bg-[#1248c9] disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          تفعيل ميسر
        </button>
      </div>

      {error ? (
        <div className="flex items-start gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      ) : null}

      {okMessage ? (
        <div className="flex items-start gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p>{okMessage}</p>
            {webhook?.ok === false ? (
              <p className="text-amber-800">المفتاح انحفظ. تسجيل الويبهوك: {webhook.error}</p>
            ) : webhook?.status === 'created' ? (
              <p>سُجّل ويبهوك ميسر على hooks.usil.app.</p>
            ) : webhook?.status === 'existing' ? (
              <p>ويبهوك ميسر كان مسجّلاً مسبقاً.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
