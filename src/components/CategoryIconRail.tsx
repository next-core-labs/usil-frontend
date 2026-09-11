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

export function CategoryIconRail({ selectedCategory, onSelectCategory }: CategoryIconRailProps) {
  return (
    <nav className="border-t border-[#E4E7EC] bg-white" aria-label="أقسام المتجر">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8 flex items-start gap-1 overflow-x-auto scrollbar-none py-2.5">
        {CATEGORIES.map((cat) => {
          const Icon = ICONS[cat.icon] || Sparkles;
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                onSelectCategory(cat.id);
                document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="shrink-0 w-[4.5rem] sm:w-[4.85rem] flex flex-col items-center gap-1.5 min-h-[44px]"
            >
              <span
                className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  active
                    ? 'bg-[#0A1A33] text-white'
                    : 'bg-[#EAF0FE] text-[#155EEF] hover:bg-[#d9e6fd]'
                }`}
              >
                <Icon className="w-5 h-5" />
              </span>
              <span
                className={`text-[11px] font-extrabold leading-tight text-center ${
                  active ? 'text-[#0A1A33]' : 'text-[#475467]'
                }`}
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
