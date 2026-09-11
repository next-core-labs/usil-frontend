import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import {
  ALL_CITIES_LABEL,
  findPlace,
  placeKindLabel,
  searchPlaces,
  type SaudiPlace,
} from '../data/saudiPlaces';

type Props = {
  value: string;
  onChange: (value: string) => void;
  includeAll?: boolean;
  placeholder?: string;
  'aria-label'?: string;
  className?: string;
  hideIcon?: boolean;
  boxed?: boolean;
};

export function PlaceSearchSelect({
  value,
  onChange,
  includeAll = true,
  placeholder = 'ابحث مدينة أو محافظة أو قرية',
  'aria-label': ariaLabel = 'المدينة',
  className = '',
  hideIcon = false,
  boxed = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const results = useMemo(() => {
    const found = searchPlaces(query, 50);
    if (!includeAll) return found;
    if (!query || ALL_CITIES_LABEL.includes(query)) {
      return [{ name: ALL_CITIES_LABEL, region: 'المملكة', kind: 'region' as const }, ...found];
    }
    return found;
  }, [query, includeAll]);

  const current = value === ALL_CITIES_LABEL ? ALL_CITIES_LABEL : findPlace(value)?.name || value;

  function pick(name: string) {
    onChange(name);
    setQuery('');
    setOpen(false);
  }

  return (
    <div ref={box} className={`relative ${className}`}>
      <div
        className={`flex items-center gap-1.5 min-w-0 ${
          boxed ? 'h-11 px-2.5 rounded-xl bg-white border border-slate-200 focus-within:border-[#155EEF]' : ''
        }`}
      >
        {hideIcon ? null : <MapPin className="w-3.5 h-3.5 text-[#155EEF] shrink-0" />}
        <input
          value={open ? query : current}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery('');
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false);
            if (event.key === 'Enter') {
              event.preventDefault();
              const first = results[0];
              if (first) pick(first.name);
            }
          }}
          placeholder={placeholder}
          aria-label={ariaLabel}
          autoComplete="off"
          className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none min-w-0"
        />
        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </div>
      {open ? (
        <ul
          role="listbox"
          className="absolute z-[80] mt-1 max-h-64 w-full min-w-[14rem] overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg text-right"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-xs text-slate-500">لا توجد نتيجة لهذا الاسم</li>
          ) : (
            results.map((place: SaudiPlace | { name: string; region: string; kind: 'region' }) => (
              <li key={`${place.kind}-${place.region}-${place.name}`}>
                <button
                  type="button"
                  className={`w-full px-3 py-2 text-right hover:bg-slate-50 ${
                    place.name === value ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => pick(place.name)}
                >
                  <span className="block text-sm font-bold text-[#0A1A33]">{place.name}</span>
                  <span className="block text-[11px] text-slate-500">
                    {place.name === ALL_CITIES_LABEL
                      ? 'كل مناطق ومحافظات وقرى المملكة'
                      : `${place.region} · ${placeKindLabel(place.kind)}`}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
