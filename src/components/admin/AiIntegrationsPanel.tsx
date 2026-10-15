import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Save, Sparkles, Zap } from 'lucide-react';
import { requestApi } from '../../utils/adminBookings';

const PROVIDERS = ['gemini', 'anthropic', 'openai'] as const;
type ProviderId = (typeof PROVIDERS)[number];

const PROVIDER_LABEL: Record<ProviderId, string> = {
  gemini: 'Google Gemini',
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI (ChatGPT)',
};

const MODEL_PLACEHOLDER: Record<ProviderId, string> = {
  gemini: 'اتركه فارغاً لموديل كل خدمة الافتراضي',
  anthropic: 'claude-sonnet-4-5',
  openai: 'gpt-4o',
};

type ProviderStatus = {
  configured: boolean;
  /** Prefix + last 4 only — the server never returns a full key. */
  keyMasked: string;
  keySource: 'saved' | 'env' | 'none';
  model: string;
};

type IntegrationsStatus = {
  defaultProvider: ProviderId;
  activeProvider: ProviderId | null;
  providers: Record<ProviderId, ProviderStatus>;
  cursor?: { supported: boolean; note?: string };
  updatedAt?: string;
};

type Draft = Record<ProviderId, { apiKey: string; model: string; clearKey: boolean }>;

type TestResult = { ok: boolean; message: string };

const KEY_SOURCE_LABEL: Record<ProviderStatus['keySource'], string> = {
  saved: 'محفوظ من اللوحة',
  env: 'من متغير بيئة على الخادم',
  none: 'غير مُعد',
};

function draftFrom(status: IntegrationsStatus | null): Draft {
  const draft = {} as Draft;
  for (const provider of PROVIDERS) {
    draft[provider] = { apiKey: '', model: status?.providers?.[provider]?.model || '', clearKey: false };
  }
  return draft;
}

export function AiIntegrationsPanel() {
  const [status, setStatus] = useState<IntegrationsStatus | null>(null);
  const [defaultProvider, setDefaultProvider] = useState<ProviderId>('gemini');
  const [draft, setDraft] = useState<Draft>(() => draftFrom(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<ProviderId | null>(null);
  const [tests, setTests] = useState<Partial<Record<ProviderId, TestResult>>>({});
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  const apply = (next: IntegrationsStatus) => {
    setStatus(next);
    setDefaultProvider(next.defaultProvider);
    setDraft(draftFrom(next));
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    const result = await requestApi<{ success?: boolean; error?: string; data?: IntegrationsStatus }>(
      '/api/admin/integrations',
      undefined,
      'تعذر قراءة إعدادات الذكاء الاصطناعي.',
    );
    if (result.ok && result.data?.data) {
      apply(result.data.data);
    } else {
      setError(result.status === 403 ? 'إعدادات الذكاء الاصطناعي لمدير كل الحسابات فقط.' : result.error);
      setStatus(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const setField = (provider: ProviderId, patch: Partial<Draft[ProviderId]>) => {
    setDraft((prev) => ({ ...prev, [provider]: { ...prev[provider], ...patch } }));
    setOkMessage(null);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setOkMessage(null);
    const body: Record<string, unknown> = { defaultProvider };
    for (const provider of PROVIDERS) {
      const row = draft[provider];
      body[provider] = {
        // Blank keeps the saved key; the server never receives the masked value.
        apiKey: row.apiKey.trim() || undefined,
        model: row.model.trim(),
        ...(row.clearKey ? { clearKey: true } : {}),
      };
    }
    const result = await requestApi<{ success?: boolean; error?: string; data?: IntegrationsStatus }>(
      '/api/admin/integrations',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      'تعذر حفظ مفاتيح الذكاء الاصطناعي.',
    );
    if (result.ok && result.data?.data) {
      apply(result.data.data);
      setTests({});
      setOkMessage('انحفظت إعدادات الذكاء الاصطناعي. اختبر المزوّد للتأكد أن المفتاح يشتغل.');
    } else {
      setError(result.status === 403 ? 'إعدادات الذكاء الاصطناعي لمدير كل الحسابات فقط.' : result.error);
    }
    setSaving(false);
  };

  const test = async (provider: ProviderId) => {
    setTesting(provider);
    setTests((prev) => ({ ...prev, [provider]: undefined }));
    const result = await requestApi<{ success?: boolean; error?: string; message?: string }>(
      '/api/admin/integrations/test',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      },
      'فشل اختبار المزوّد.',
    );
    const message = result.ok ? result.data?.message || 'المزوّد يرد بنجاح.' : result.data?.message || result.error;
    setTests((prev) => ({ ...prev, [provider]: { ok: result.ok, message: String(message) } }));
    setTesting(null);
  };

  const active = status?.activeProvider;

  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold inline-flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-action" />
            الذكاء الاصطناعي — مفاتيح المزوّدين
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            المساعد والبحث الذكي يستخدمون المزوّد الافتراضي، وإن ما كان له مفتاح ينتقلون لأول مزوّد مُعد. المفاتيح تُحفظ على
            الخادم فقط، وتظهر هنا مقنّعة — اترك خانة المفتاح فارغة للإبقاء على المفتاح الحالي.
          </p>
        </div>
        {active ? (
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700">
            مفعّل — {PROVIDER_LABEL[active]}
          </span>
        ) : status ? (
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-rose-50 text-rose-700">غير مفعّل</span>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 inline-flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          جارٍ التحميل…
        </p>
      ) : null}

      {status && !loading ? (
        <div className="space-y-4">
          <label className="block max-w-sm">
            <span className="text-xs font-medium text-slate-600">المزوّد الافتراضي</span>
            <select
              value={defaultProvider}
              onChange={(e) => {
                setDefaultProvider(e.target.value as ProviderId);
                setOkMessage(null);
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
            >
              {PROVIDERS.map((provider) => (
                <option key={provider} value={provider}>
                  {PROVIDER_LABEL[provider]}
                  {status.providers?.[provider]?.configured ? '' : ' — بدون مفتاح'}
                </option>
              ))}
            </select>
          </label>

          <div className="grid lg:grid-cols-3 gap-3">
            {PROVIDERS.map((provider) => {
              const info = status.providers?.[provider];
              const row = draft[provider];
              const result = tests[provider];
              return (
                <article key={provider} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">{PROVIDER_LABEL[provider]}</p>
                      <p className="text-2xs text-slate-500 mt-0.5">{KEY_SOURCE_LABEL[info?.keySource || 'none']}</p>
                    </div>
                    {info?.configured ? (
                      <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 whitespace-nowrap">
                        مُعد
                      </span>
                    ) : (
                      <span className="text-2xs font-medium px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 whitespace-nowrap">
                        بدون مفتاح
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-slate-800" dir="ltr">
                    {info?.keyMasked || '—'}
                  </p>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600">API Key</span>
                    <input
                      type="password"
                      autoComplete="off"
                      spellCheck={false}
                      value={row.apiKey}
                      onChange={(e) => setField(provider, { apiKey: e.target.value, clearKey: false })}
                      placeholder={info?.keySource === 'saved' ? 'اتركه فارغاً للإبقاء على المفتاح' : 'الصق المفتاح هنا'}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-mono"
                      dir="ltr"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600">الموديل</span>
                    <input
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      value={row.model}
                      onChange={(e) => setField(provider, { model: e.target.value })}
                      placeholder={MODEL_PLACEHOLDER[provider]}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-mono"
                      dir="ltr"
                    />
                  </label>
                  {info?.keySource === 'saved' ? (
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-action"
                        checked={row.clearKey}
                        onChange={(e) => setField(provider, { clearKey: e.target.checked, apiKey: '' })}
                      />
                      احذف المفتاح المحفوظ عند الحفظ
                    </label>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void test(provider)}
                    disabled={testing !== null || !info?.configured}
                    title={info?.configured ? 'يختبر المفتاح المحفوظ على الخادم' : 'احفظ مفتاحاً أولاً'}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium hover:bg-slate-100 disabled:opacity-50"
                  >
                    {testing === provider ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    اختبار الاتصال
                  </button>
                  {result ? (
                    <p
                      role="status"
                      className={`text-xs rounded-xl border p-2.5 ${
                        result.ok
                          ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                          : 'text-rose-700 bg-rose-50 border-rose-200'
                      }`}
                    >
                      {result.message}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>

          {status.cursor?.note ? <p className="text-2xs text-slate-500">{status.cursor.note}</p> : null}

          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-action text-white text-sm font-bold hover:bg-[#1248c9] disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ إعدادات الذكاء الاصطناعي
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      ) : null}

      {okMessage ? (
        <div className="flex items-start gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{okMessage}</p>
        </div>
      ) : null}
    </section>
  );
}
