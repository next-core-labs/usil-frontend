import React, { useEffect, useState } from 'react';
import { SAUDI_REGIONS } from '../../data/saudiPlaces';
import { applySeo } from '../../utils/seo';

interface SupportPageProps {
  onBack: () => void;
  onSelectCity?: (city: string) => void;
}

export const SupportPage: React.FC<SupportPageProps> = ({ onBack, onSelectCity }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    applySeo('support');
    return () => applySeo('home');
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setStatus('saving');
    try {
      const res = await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message }),
      });
      const data = await res.json();
      if (!data.success) {
        setStatus('err');
        setError(data.error || 'تعذر إرسال الرسالة');
        return;
      }
      setStatus('ok');
      setMessage('');
    } catch {
      setStatus('err');
      setError('تعذر الاتصال بالخادم');
    }
  };

  return (
    <article className="container mx-auto px-4 lg:px-8 py-10 max-w-3xl text-right" dir="rtl">
      <button type="button" onClick={onBack} className="text-sm font-bold text-[#155EEF] mb-6">
        ← العودة للسوق
      </button>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A1A33] mb-2">الدعم والتواصل</h1>
      <p className="text-xs text-[#667085] mb-8">يوصل / Usil · وسيط توريد مناسبات · السعودية</p>
      <div className="space-y-5 text-sm text-[#344054] leading-relaxed">
        <p>
          للاستفسار عن حجز، مطابقة مورّد، أو شكوى تنفيذ: اكتب رسالتك هنا وتُحفظ مباشرة لدى إدارة يوصل. لا نعرض رقم جوال تجريبي.
        </p>
        <p>
          البريد:{' '}
          <a href="mailto:hello@usil.app" className="text-[#155EEF] font-bold hover:underline">
            hello@usil.app
          </a>
        </p>

        <form onSubmit={submit} className="p-4 rounded-2xl border border-[#E4E7EC] bg-white space-y-3">
          <h2 className="text-sm font-black text-[#0A1A33]">أرسل رسالة للإدارة</h2>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="الاسم"
            className="w-full px-3 py-2.5 rounded-xl bg-[#F7F8FA] border border-[#E4E7EC] text-sm"
          />
          <div className="grid sm:grid-cols-2 gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              className="w-full px-3 py-2.5 rounded-xl bg-[#F7F8FA] border border-[#E4E7EC] text-sm"
              dir="ltr"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="رقم الجوال"
              className="w-full px-3 py-2.5 rounded-xl bg-[#F7F8FA] border border-[#E4E7EC] text-sm"
              dir="ltr"
            />
          </div>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب استفسارك أو ملاحظتك"
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl bg-[#F7F8FA] border border-[#E4E7EC] text-sm"
          />
          {error ? <p className="text-xs text-rose-700 font-bold">{error}</p> : null}
          {status === 'ok' ? (
            <p className="text-xs text-emerald-700 font-bold">وصلت رسالتك لإدارة يوصل وسنرد عبر البريد أو الجوال.</p>
          ) : null}
          <button
            type="submit"
            disabled={status === 'saving'}
            className="px-4 py-2.5 rounded-xl bg-[#0A1A33] text-white text-sm font-bold disabled:opacity-60"
          >
            {status === 'saving' ? 'جارٍ الإرسال…' : 'إرسال الرسالة'}
          </button>
        </form>

        <div>
          <p className="font-bold text-[#0A1A33] mb-2">المناطق المغطاة</p>
          <p className="text-[11px] text-[#667085] mb-2">ابحث في شريط المدن عن أي محافظة أو قرية داخل هذه المناطق.</p>
          <div className="flex flex-wrap gap-1.5">
            {SAUDI_REGIONS.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => {
                  onSelectCity?.(city);
                  onBack();
                }}
                className="px-2.5 py-1 rounded-lg bg-[#F7F8FA] border border-[#E4E7EC] text-xs font-bold text-[#0A1A33] hover:border-[#155EEF]"
              >
                {city}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-[#667085]">
          ساعات الرد المعتادة: الأحد–الخميس 9 صباحًا – 11 مساءً، والجمعة–السبت حسب الحجوزات النشطة.
        </p>
      </div>
    </article>
  );
};
