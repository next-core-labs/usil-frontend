import { FormEvent, useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { DEMAND_OCCASIONS } from '../data/cityDemand';
import { ALL_CITIES_LABEL } from '../data/saudiPlaces';
import { PlaceSearchSelect } from './PlaceSearchSelect';

type Props = {
  city: string;
  onCityChange?: (city: string) => void;
  defaultOccasion?: string;
};

export function CityDemandForm({ city, onCityChange, defaultOccasion }: Props) {
  const initialOccasion = DEMAND_OCCASIONS.includes(defaultOccasion as (typeof DEMAND_OCCASIONS)[number])
    ? defaultOccasion
    : 'عرس';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [place, setPlace] = useState(city && city !== ALL_CITIES_LABEL ? city : 'الرياض');
  const [occasion, setOccasion] = useState(initialOccasion || 'عرس');
  const [eventDate, setEventDate] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (city && city !== ALL_CITIES_LABEL) setPlace(city);
  }, [city]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setStatus('saving');
    try {
      const res = await fetch('/api/city-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          city: place,
          occasion,
          eventDate,
          notes,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setStatus('err');
        setError(data.error || 'تعذر إرسال الطلب');
        return;
      }
      setStatus('ok');
      setNotes('');
    } catch {
      setStatus('err');
      setError('تعذر الاتصال بالخادم');
    }
  };

  return (
    <form
      onSubmit={submit}
      className="text-right rounded-2xl border border-line bg-paper p-4 sm:p-5 space-y-3 max-w-lg mx-auto"
    >
      <div className="flex items-start gap-2">
        <MapPin className="w-4 h-4 text-action mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-navy">طلب مورّد في مدينتك</p>
          <p className="text-2xs text-slate-500 mt-0.5 leading-relaxed">
            ما فيه منتج ظاهر هنا. اترك اسمك وجوالك ونوع المناسبة ونطابقه مع مورّد يغطي هذا المكان.
          </p>
        </div>
      </div>

      <label className="block">
        <span className="text-2xs font-medium text-slate-600 mb-1 block">الاسم</span>
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full h-10 px-3 rounded-xl bg-white border border-line text-sm font-bold"
          placeholder="اسمك"
        />
      </label>

      <label className="block">
        <span className="text-2xs font-medium text-slate-600 mb-1 block">الجوال</span>
        <input
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="w-full h-10 px-3 rounded-xl bg-white border border-line text-sm font-mono font-bold"
          placeholder="05xxxxxxxx"
          inputMode="numeric"
          dir="ltr"
        />
      </label>

      <div className="space-y-1">
        <span className="text-2xs font-medium text-slate-600 block">المدينة / المحافظة / القرية</span>
        <PlaceSearchSelect
          value={place}
          onChange={(next) => {
            setPlace(next);
            onCityChange?.(next);
          }}
          includeAll={false}
          boxed
          aria-label="مدينة الطلب"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block">
          <span className="text-2xs font-medium text-slate-600 mb-1 block">نوع المناسبة</span>
          <select
            value={occasion}
            onChange={(event) => setOccasion(event.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-white border border-line text-sm font-bold"
          >
            {DEMAND_OCCASIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-2xs font-medium text-slate-600 mb-1 block">التاريخ (اختياري)</span>
          <input
            type="date"
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-white border border-line text-sm font-bold"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-2xs font-medium text-slate-600 mb-1 block">ملاحظة (اختياري)</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
          maxLength={500}
          placeholder="عدد الضيوف أو أي تفصيل يفيد المطابقة"
          className="w-full px-3 py-2 rounded-xl bg-white border border-line text-sm"
        />
      </label>

      {error ? <p className="text-xs text-rose-700 font-medium">{error}</p> : null}
      {status === 'ok' ? (
        <p className="text-xs text-emerald-700 font-medium">وصل طلبك لإدارة يوصل وسنتواصل للمطابقة.</p>
      ) : null}

      <button
        type="submit"
        disabled={status === 'saving'}
        className="w-full sm:w-auto px-5 h-11 rounded-xl bg-action hover:bg-action-hover text-white text-sm font-bold disabled:opacity-60"
      >
        {status === 'saving' ? 'جارٍ الإرسال…' : 'أرسل طلب المطابقة'}
      </button>
    </form>
  );
}
