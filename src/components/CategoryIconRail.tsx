import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Sparkles,
  Coffee,
  Utensils,
  Palette,
  Camera,
  PartyPopper,
  Building2,
  Armchair,
  Users,
  Speaker,
  Tent,
  Music,
  Cake,
  Gift,
  Car,
  Flower2,
} from 'lucide-react';
import { CATEGORIES } from '../data/services';
import { cn } from './ui/cn';

const ICONS: Record<string, LucideIcon> = {
  Sparkles,
  Coffee,
  Utensils,
  Palette,
  Camera,
  PartyPopper,
  Building2,
  Armchair,
  Users,
  Speaker,
  Tent,
  Music,
  Cake,
  Gift,
  Car,
  Flower2,
};

type CategoryIconRailProps = {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
};

/**
 * Category rail.
 *
 * Mobile shows icon+label pills in a single 44px-tall row. It used to stack a
 * 56px circle above a caption, which cost ~86px of a phone viewport for a
 * control the filter panel also offers. Desktop keeps the roomier circles,
 * where the vertical budget is not scarce.
 */
export function CategoryIconRail({ selectedCategory, onSelectCategory }: CategoryIconRailProps) {
  const select = (id: string) => {
    onSelectCategory(id);
    document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="border-t border-line bg-surface" aria-label="أقسام المتجر">
      {/* Mobile — compact pills */}
      <div className="sm:hidden container mx-auto px-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-2">
        {CATEGORIES.map((cat) => {
          const Icon = ICONS[cat.icon] || Sparkles;
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              aria-pressed={active}
              onClick={() => select(cat.id)}
              className={cn(
                'shrink-0 h-10 px-3 rounded-full border inline-flex items-center gap-1.5 transition-colors',
                'text-xs font-medium whitespace-nowrap',
                active
                  ? 'bg-navy border-navy text-white'
                  : 'bg-paper border-line text-ink-2 hover:border-action hover:text-action',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden />
              {cat.short}
            </button>
          );
        })}
      </div>

      {/* Desktop — icon tiles */}
      <div className="hidden sm:flex container mx-auto px-4 lg:px-8 items-start gap-1 overflow-x-auto scrollbar-none py-2.5">
        {CATEGORIES.map((cat) => {
          const Icon = ICONS[cat.icon] || Sparkles;
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              aria-pressed={active}
              onClick={() => select(cat.id)}
              className="shrink-0 w-[4.85rem] flex flex-col items-center gap-1.5 group rounded-control py-0.5"
            >
              <span
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                  active
                    ? 'bg-navy text-white'
                    : 'bg-action-100 text-action group-hover:bg-action-200',
                )}
              >
                <Icon className="w-5 h-5" aria-hidden />
              </span>
              <span
                className={cn(
                  'text-2xs font-semibold leading-tight text-center',
                  active ? 'text-navy' : 'text-ink-2',
                )}
              >
                {cat.short}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
