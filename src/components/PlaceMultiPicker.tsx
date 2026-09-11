import { useMemo, useState } from 'react';
import {
  ALL_CITIES_LABEL,
  SAUDI_REGIONS,
  coveringRegion,
  findPlace,
  formatRegionCoverage,
  formatSelectionCoverage,
  placeKindLabel,
  searchPlaces,
  selectionCoversPlace,
} from '../data/saudiPlaces';

type Props = {
  value: string[];
  onToggle: (name: string) => void;
};

export function PlaceMultiPicker({ value, onToggle }: Props) {
  const [query, setQuery] = useState('');
  const searchHits = useMemo(() => {
    if (!query.trim()) return [];
    return searchPlaces(query, 40).filter((place) => place.name !== ALL_CITIES_LABEL);
  }, [query]);

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-slate-500 leading-relaxed">
        اضغط المنطقة لتغطية كل محافظاتها وقراها. ابحث إذا تغطي محافظة أو قرية فقط.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {SAUDI_REGIONS.map((region) => {
          const selected = value.includes(region);
          return (
            <button
              key={region}
              type="button"
              onClick={() => onToggle(region)}
              className={`px-3 py-2 rounded-xl text-right border ${
                selected
                  ? 'bg-[#155EEF] border-[#155EEF] text-white'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-[#155EEF]'
              }`}
            >
              <span className="block text-xs font-extrabold">{region}</span>
              <span className={`block text-[10px] ${selected ? 'text-white/80' : 'text-slate-500'}`}>
                {selected ? 'المنطقة كاملة' : formatRegionCoverage(region)}
              </span>
            </button>
          );
        })}
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="أو ابحث محافظة أو قرية محددة"
        className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
      />

      {value.length ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-slate-600">{formatSelectionCoverage(value)}</p>
          <div className="flex flex-wrap gap-1.5">
            {value.map((city) => {
              const place = findPlace(city);
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => onToggle(city)}
                  className="px-2.5 min-h-8 rounded-full text-[11px] font-bold border bg-[#155EEF] border-[#155EEF] text-white"
                >
                  {place?.kind === 'region' ? `${city} · كاملة` : city} ×
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-amber-700 font-bold">اختر منطقة أو مكاناً واحداً على الأقل.</p>
      )}

      {query.trim() ? (
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-auto">
          {searchHits.length === 0 ? (
            <p className="text-[11px] text-slate-500">لا توجد نتيجة لهذا الاسم</p>
          ) : (
            searchHits.map((place) => {
              const selected = value.includes(place.name);
              const parent = coveringRegion(value, place.name);
              const covered = !selected && selectionCoversPlace(value, place.name);
              return (
                <button
                  key={place.name}
                  type="button"
                  onClick={() => onToggle(place.name)}
                  disabled={covered}
                  title={covered && parent ? `مغطاة ضمن ${parent}` : undefined}
                  className={`px-2.5 min-h-8 rounded-full text-[11px] font-bold border ${
                    selected
                      ? 'bg-[#155EEF] border-[#155EEF] text-white'
                      : covered
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-default'
                        : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  {place.name}
                  <span className="opacity-70">
                    {' '}
                    · {covered && parent ? `ضمن ${parent}` : placeKindLabel(place.kind)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
