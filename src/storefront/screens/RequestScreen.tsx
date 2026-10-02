import React, { useState } from 'react';
import { Headset, Check } from 'lucide-react';
import { DEMAND_OCCASIONS } from '../../data/cityDemand';
import { ALL_CITIES_LABEL } from '../../data/saudiPlaces';
import { PlaceSearchSelect } from '../../components/PlaceSearchSelect';
import { cn } from '../../components/ui/cn';
import { useLang } from '../lang';
import { useStorefront } from '../context';
import { money } from '../money';
import { ArrowIcon } from '../primitives';

const inputCls =
  'h-[46px] px-3.5 rounded-control border border-navy-300 bg-surface text-[15px] text-navy outline-none focus:border-action focus:ring-4 focus:ring-action/10 w-full';

const OCCASION_EN: Record<string, string> = {
  'عرس': 'Wedding',
  'ملكة': 'Milcha',
  'تخرج': 'Graduation',
  'مؤتمر / إطلاق': 'Conference / launch',
  'استقبال رمضاني': 'Ramadan reception',
  'عزاء': 'Condolence',
  'ضيافة وقهوة': 'Hospitality & coffee',
  'بوفيه ومأكولات': 'Buffet & food',
  'تصوير وتوثيق': 'Photography',
  'قاعة أو استراحة': 'Hall or lounge',
  'أخرى': 'Other',
};

/**
 * «طلب خاص» — the design's custom request form, posted to the real city-demand
 * queue (`POST /api/city-requests`). Guests, budget and the description travel
 * in the request note.
 */
export function RequestScreen() {
  const { t, ar } = useLang();
  const sf = useStorefront();
  const [name, setName] = useState(sf.user?.name || '');
  const [phone, setPhone] = useState(sf.user?.phone || '');
  const [place, setPlace] = useState(sf.selectedCity && sf.selectedCity !== ALL_CITIES_LABEL ? sf.selectedCity : 'الرياض');
  const [occasion, setOccasion] = useState<string>(DEMAND_OCCASIONS[0]);
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState('50 – 150');
  const [budget, setBudget] = useState(3000);
  const [desc, setDesc] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');
  const [error, setError] = useState('');

  const guestOptions = [t.guestsUnder, '50 – 150', '150 – 500', t.guestsOver];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('saving');
    const notes = [
      `${t.rGuests}: ${guests}`,
      `${t.rBudget}: ${money(budget, ar)}`,
      desc.trim() ? `${t.rDesc}: ${desc.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n')
      .slice(0, 500);
    try {
      const res = await fetch('/api/city-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, city: place, occasion, eventDate: date, notes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setStatus('err');
        setError(data.error || t.rErr);
        return;
      }
      setStatus('ok');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setStatus('err');
      setError(t.rErrNet);
    }
  };

  const steps = [
    { n: '01', title: t.rH1, sub: t.rH1s },
    { n: '02', title: t.rH2, sub: t.rH2s },
    { n: '03', title: t.rH3, sub: t.rH3s },
  ];

  return (
    <main className="max-w-[1100px] mx-auto px-[clamp(16px,4vw,40px)] pt-8 pb-16">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_340px] gap-[clamp(24px,4vw,48px)] items-start">
        <div>
          <div className="flex items-center gap-2.5 text-[13px] font-semibold text-action tracking-[.04em]">
            <span className="w-6 h-0.5 bg-action" aria-hidden />
            {t.navRequest}
          </div>
          <h1 className="mt-2.5 mb-2 text-[clamp(28px,4vw,46px)] font-bold tracking-[-0.03em] leading-[1.1]">{t.reqTitle}</h1>
          <p className="mb-[26px] text-[15px] leading-[1.7] text-ink-1 max-w-[520px]">{t.reqSub}</p>

          {status === 'ok' ? (
            <div className="bg-surface border border-line rounded-card p-[clamp(18px,3vw,28px)] text-center">
              <span className="inline-grid place-items-center w-[72px] h-[72px] rounded-panel bg-action text-white" style={{ animation: 'lm-wiggle 1.2s ease-in-out' }}>
                <Check className="w-[34px] h-[34px]" aria-hidden />
              </span>
              <h2 className="mt-5 mb-2 text-[clamp(24px,3vw,34px)] font-bold tracking-[-0.03em]">{t.rDoneTitle}</h2>
              <p className="mx-auto max-w-[420px] text-[15px] leading-[1.7] text-ink-1">{t.rDoneSub}</p>
              <div className="flex gap-2.5 justify-center mt-[22px] flex-wrap">
                <button type="button" onClick={() => sf.goCatalog()} className="h-12 px-[22px] rounded-xl bg-navy text-white text-[15px] font-semibold">
                  {t.browse}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatus('idle');
                    setDesc('');
                  }}
                  className="h-12 px-[22px] rounded-xl border border-navy-300 bg-surface text-navy text-[15px] font-semibold"
                >
                  {t.rAnother}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-surface border border-line rounded-card p-[clamp(18px,3vw,28px)] flex flex-col gap-5">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3.5">
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                  {t.rName}
                  <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} autoComplete="name" />
                </label>
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                  {t.rPhone}
                  <input required value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" inputMode="tel" placeholder="05XXXXXXXX" className={cn(inputCls, 'text-start tnum')} />
                </label>
              </div>
              <div className="flex flex-col gap-1.5 text-[13px] font-semibold">
                {t.rCity}
                <PlaceSearchSelect value={place} onChange={setPlace} includeAll={false} boxed aria-label={t.rCity} />
              </div>
              <div>
                <div className="text-[13px] font-semibold mb-2.5">{t.rOcc}</div>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.rOcc}>
                  {DEMAND_OCCASIONS.map((o) => {
                    const on = occasion === o;
                    return (
                      <button
                        key={o}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setOccasion(o)}
                        className={cn('h-[38px] px-3.5 rounded-control border text-sm font-medium transition-all min-h-0', on ? 'bg-navy border-navy text-white' : 'bg-surface border-line text-navy hover:border-action')}
                      >
                        {ar ? o : OCCASION_EN[o] || o}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3.5">
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                  {t.rDate}
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
                </label>
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                  {t.rGuests}
                  <select value={guests} onChange={(e) => setGuests(e.target.value)} className={cn(inputCls, 'cursor-pointer')}>
                    {guestOptions.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <div className="flex justify-between text-[13px] font-semibold mb-2.5">
                  <span>{t.rBudget}</span>
                  <span className="text-action tnum">{money(budget, ar)}</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={50000}
                  step={500}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full accent-action"
                  aria-label={t.rBudget}
                />
              </div>
              <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                {t.rDesc}
                <textarea rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t.rDescPh} maxLength={400} className={cn(inputCls, 'h-auto py-3 resize-y')} />
              </label>
              {error ? (
                <p role="alert" className="text-sm text-danger font-medium">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={status === 'saving'}
                className="h-[52px] px-[26px] rounded-xl bg-action text-white text-base font-bold inline-flex items-center justify-center gap-2 transition-colors hover:bg-action-hover disabled:opacity-70 self-start"
              >
                {status === 'saving' ? t.rSending : t.rSend}
                <ArrowIcon className="w-[18px] h-[18px]" />
              </button>
            </form>
          )}
        </div>

        <aside className="md:sticky md:top-[84px] bg-navy text-white rounded-card p-[26px]">
          <div className="text-[17px] font-bold">{t.rHow}</div>
          <div className="flex flex-col mt-2">
            {steps.map((s) => (
              <div key={s.n} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3.5 py-4 border-b border-white/10">
                <span className="text-2xl font-bold text-sky leading-none tnum">{s.n}</span>
                <span>
                  <span className="block text-[15px] font-semibold">{s.title}</span>
                  <span className="block text-[13px] text-on-navy-muted mt-[3px] leading-[1.6]">{s.sub}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2.5 mt-[18px] text-[13px] text-on-navy-muted">
            <Headset className="w-[18px] h-[18px] text-sky" aria-hidden />
            {t.mSupport} · {ar ? 'الأحد – الخميس، 9ص – 11م' : 'Sun – Thu, 9am – 11pm'}
          </div>
        </aside>
      </div>
    </main>
  );
}
