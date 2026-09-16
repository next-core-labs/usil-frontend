import React, { useState } from 'react';
import { CATEGORIES } from '../data/services';
import { PlaceSearchSelect } from './PlaceSearchSelect';
import {
  AUDIENCE_OPTIONS,
  PRICE_RANGES,
  FULFILLMENT_FILTER_CHIPS,
  type FulfillmentFilter,
} from '../data/saudiMarket';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Select } from './ui/Field';
import { cn } from './ui/cn';

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
  /** Present on mobile, where the lane rail is no longer in the app bar. */
  selectedFulfillment?: FulfillmentFilter;
  onSelectFulfillment?: (lane: FulfillmentFilter) => void;
  /** Number of filters currently narrowing the grid, for the collapsed header. */
  activeFilterCount?: number;
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-ink-3">{label}</span>
      {children}
    </div>
  );
}

/** Pill group used for the short, tappable option sets (audience, lanes). */
function PillGroup<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={ariaLabel}>
      {options.map((opt) => {
        const isActive = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(opt.id)}
            className={cn(
              'px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors',
              isActive
                ? 'bg-action border-action text-white'
                : 'bg-paper border-line text-ink-2 hover:border-action hover:text-action',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
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
  selectedFulfillment = 'all',
  onSelectFulfillment,
  activeFilterCount = 0,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <aside
      /* Pins below the app bar using the height the Navbar measures, instead of
         the old hardcoded `top-52` that drifted whenever the bar changed. */
      className="rounded-card border border-line bg-surface p-4 text-right lg:sticky lg:top-[calc(var(--usil-header-h,11rem)+1rem)]"
      aria-label="فلاتر المنتجات"
    >
      <button
        type="button"
        className="w-full flex items-center justify-between gap-2 lg:pointer-events-none"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="usil-filter-body"
      >
        <span className="inline-flex items-center gap-2 text-navy">
          <SlidersHorizontal className="w-4 h-4 text-action" aria-hidden />
          <span className="text-sm font-bold">فلاتر</span>
          {activeFilterCount > 0 ? (
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-action text-white text-2xs font-semibold inline-flex items-center justify-center tnum">
              {activeFilterCount}
            </span>
          ) : null}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-xs text-ink-3 tnum">{totalServicesCount} منتج</span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-muted lg:hidden transition-transform',
              open && 'rotate-180',
            )}
            aria-hidden
          />
        </span>
      </button>

      <div
        id="usil-filter-body"
        className={cn(open ? 'block' : 'hidden', 'lg:block space-y-4 mt-4')}
      >
        <FilterGroup label="القسم">
          <Select
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            aria-label="القسم"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </FilterGroup>

        {onSelectCity ? (
          <FilterGroup label="المدينة">
            <PlaceSearchSelect
              value={selectedCity}
              onChange={onSelectCity}
              boxed
              className="w-full"
              aria-label="المدينة"
            />
          </FilterGroup>
        ) : null}

        {/* Lanes live here on mobile, where the app bar no longer carries them.
            Hidden on desktop to avoid a second control for the same state. */}
        {onSelectFulfillment ? (
          <div className="md:hidden">
            <FilterGroup label="مسار التوريد">
              <PillGroup
                options={FULFILLMENT_FILTER_CHIPS.map((c) => ({ id: c.id, label: c.chip }))}
                value={selectedFulfillment}
                onChange={onSelectFulfillment}
                ariaLabel="مسار التوريد"
              />
            </FilterGroup>
          </div>
        ) : null}

        {onSelectAudience ? (
          <FilterGroup label="الجمهور">
            <PillGroup
              options={AUDIENCE_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
              value={selectedAudience}
              onChange={onSelectAudience}
              ariaLabel="الجمهور"
            />
          </FilterGroup>
        ) : null}

        {onSelectPrice ? (
          <FilterGroup label="السعر">
            <Select
              value={selectedPrice}
              onChange={(e) => onSelectPrice(e.target.value)}
              aria-label="السعر"
            >
              {PRICE_RANGES.map((range) => (
                <option key={range.id} value={range.id}>
                  {range.label}
                </option>
              ))}
            </Select>
          </FilterGroup>
        ) : null}

        <FilterGroup label="الترتيب">
          <Select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="الترتيب حسب"
          >
            <option value="popular">الأكثر طلباً</option>
            <option value="rating">الأعلى تقييماً</option>
            <option value="price-asc">السعر: من الأقل</option>
            <option value="price-desc">السعر: من الأعلى</option>
          </Select>
        </FilterGroup>
      </div>
    </aside>
  );
};
