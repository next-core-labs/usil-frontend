import React, { useState } from 'react';
import { CATEGORIES } from '../data/services';
import { PlaceSearchSelect } from './PlaceSearchSelect';
import { AUDIENCE_OPTIONS, PRICE_RANGES } from '../data/saudiMarket';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';

interface CategoryFilterBarProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  selectedCity?: string;
  onSelectCity?: (city: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  totalServicesCount: number;
  selectedAudience?: string;
  onSelectAudience?: (audienceId: string) => void;
  selectedPrice?: string;
  onSelectPrice?: (priceId: string) => void;
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedCity = 'جميع المدن',
  onSelectCity,
  sortBy,
  onSortChange,
  totalServicesCount,
  selectedAudience = 'all',
  onSelectAudience,
  selectedPrice = 'all',
  onSelectPrice,
}) => {
  const [open, setOpen] = useState(false);
  const selectClass =
    'w-full h-9 px-2.5 rounded-lg bg-white border border-[#E4E7EC] text-[#101828] text-xs font-bold focus:outline-none focus:border-[#155EEF] cursor-pointer';

  return (
    <aside className="rounded-xl border border-[#E4E7EC] bg-white p-3 sm:p-4 text-right lg:sticky lg:top-52">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-2 lg:pointer-events-none"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="inline-flex items-center gap-1.5 text-[#0A1A33]">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#155EEF]" />
          <p className="text-xs font-extrabold">فلاتر</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-[#155EEF]">{totalServicesCount} منتج</span>
          <ChevronDown className={`w-4 h-4 text-slate-400 lg:hidden transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <div className={`${open ? 'block' : 'hidden'} lg:block space-y-3 mt-3`} >

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-[#667085]">القسم</span>
        <select
          value={selectedCategory}
          onChange={(e) => onSelectCategory(e.target.value)}
          aria-label="القسم"
          className={selectClass}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </label>

      {onSelectCity ? (
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-[#667085]">المدينة</span>
          <PlaceSearchSelect
            value={selectedCity}
            onChange={onSelectCity}
            boxed
            className="w-full"
            aria-label="المدينة"
          />
        </label>
      ) : null}

      {onSelectAudience ? (
        <div className="space-y-1.5" role="group" aria-label="الجمهور">
          <span className="text-[11px] font-bold text-[#667085]">الجمهور</span>
          <div className="flex flex-wrap gap-1">
            {AUDIENCE_OPTIONS.map((opt) => {
              const isActive = selectedAudience === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSelectAudience(opt.id)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold border ${
                    isActive
                      ? 'bg-[#155EEF] border-[#155EEF] text-white'
                      : 'bg-[#F7F8FA] border-[#E4E7EC] text-[#475467] hover:border-[#155EEF]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {onSelectPrice ? (
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-[#667085]">السعر</span>
          <select
            value={selectedPrice}
            onChange={(e) => onSelectPrice(e.target.value)}
            aria-label="السعر"
            className={selectClass}
          >
            {PRICE_RANGES.map((range) => (
              <option key={range.id} value={range.id}>
                {range.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-[#667085]">الترتيب</span>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          aria-label="الترتيب حسب"
          className={selectClass}
        >
          <option value="popular">الأكثر طلباً</option>
          <option value="rating">الأعلى تقييماً</option>
          <option value="price-asc">السعر: من الأقل</option>
          <option value="price-desc">السعر: من الأعلى</option>
        </select>
      </label>
      </div>
    </aside>
  );
};
