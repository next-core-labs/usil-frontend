import React, { useEffect } from 'react';
import { Search, Store } from 'lucide-react';
import { CATEGORIES } from '../../data/services';

interface NotFoundPageProps {
  onBack: () => void;
  onSearch?: (query: string) => void;
  onSelectCategory?: (categoryId: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onBack, onSearch, onSelectCategory }) => {
  const [query, setQuery] = React.useState('');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'الصفحة غير موجودة | يوصل';
    }
  }, []);

  return (
    <article className="container mx-auto px-4 lg:px-8 py-14 max-w-2xl text-right" dir="rtl">
      <p className="text-2xs font-mono font-medium text-action mb-2">404</p>
      <h1 className="text-2xl sm:text-3xl font-bold text-navy mb-2">هذه الصفحة غير موجودة</h1>
      <p className="text-sm text-ink-2 leading-relaxed mb-6">
        الرابط الذي فتحته ليس صفحة في متجر يوصل. ابحث عن منتج، أو ارجع للسوق، أو اختر قسماً.
      </p>

      <form
        className="relative mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          const next = query.trim();
          if (next) onSearch?.(next);
          else onBack();
        }}
      >
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث في المتجر: قهوة، قاعة، تصوير…"
          aria-label="ابحث في المتجر"
          className="w-full h-12 pr-10 pl-3 rounded-xl bg-white border border-line text-sm font-medium focus:outline-none focus:border-action"
        />
      </form>

      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.filter((c) => c.id !== 'all').slice(0, 8).map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory?.(cat.id)}
            className="px-3 h-9 rounded-lg bg-white border border-line text-xs font-medium text-navy hover:border-action"
          >
            {cat.name}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold"
      >
        <Store className="w-4 h-4" />
        العودة لمتجر يوصل
      </button>
    </article>
  );
};
