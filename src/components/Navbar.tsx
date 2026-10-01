import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency, CurrencyCode } from '../context/CurrencyContext';
import {
  ShoppingBag,
  LayoutDashboard,
  Store,
  User,
  UserPlus,
  LogOut,
  Clock,
  Users,
  Languages,
  Coins,
  Scale,
  Search,
  FileText,
  MapPin,
  ChevronDown,
  MessagesSquare,
} from 'lucide-react';
import { ALL_CITIES_LABEL } from '../data/saudiPlaces';
import { CategoryIconRail } from './CategoryIconRail';
import {
  CATALOG_SEARCH_CHIPS,
  FULFILLMENT_FILTER_CHIPS,
  FulfillmentFilter,
  SEARCH_PLACEHOLDER,
} from '../data/saudiMarket';
import { UserProfile } from '../types';
import { UsilLockup } from './UsilLockup';
import { Button } from './ui/Button';
import { CountBadge } from './ui/Badge';
import { cn } from './ui/cn';

interface NavbarProps {
  selectedCity: string;
  onSelectCity: (city: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (categoryId: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenCalculator: () => void;
  onOpenTracker?: () => void;
  /** Signed-in clients: open «رسائلي». */
  onOpenChats?: () => void;
  chatUnread?: number;
  onOpenCrewPortal?: () => void;
  onOpenCompare?: () => void;
  compareCount?: number;
  viewMode: 'client' | 'vendor' | 'admin';
  onToggleViewMode: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenVoiceAI: () => void;
  onLogout: () => void;
  onOpenVendorHub?: () => void;
  onOpenVendorRegister?: () => void;
  onOpenSupport?: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onOpenAbout?: () => void;
  onGoHome?: () => void;
  selectedFulfillment?: FulfillmentFilter;
  onSelectFulfillment?: (lane: FulfillmentFilter) => void;
  onOpenRegionPicker?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedCity,
  onSelectCity,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  selectedCategory = 'all',
  onSelectCategory,
  cartCount,
  onOpenCart,
  onOpenTracker,
  onOpenChats,
  chatUnread = 0,
  onOpenCrewPortal,
  onOpenCompare,
  compareCount = 0,
  viewMode,
  onToggleViewMode,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenVendorHub,
  onOpenVendorRegister,
  onOpenSupport,
  onOpenPrivacy,
  onOpenTerms,
  onOpenAbout,
  onGoHome,
  selectedFulfillment = 'all',
  onSelectFulfillment,
  onOpenRegionPicker,
}) => {
  const { t, i18n } = useTranslation();
  const { currency, setCurrency, availableCurrencies } = useCurrency();
  const currentLang = i18n.language || 'ar';
  const isArabic = currentLang.startsWith('ar');

  const toggleLanguage = () => {
    i18n.changeLanguage(isArabic ? 'en' : 'ar');
  };

  const [legalOpen, setLegalOpen] = useState(false);
  const legalRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // The app bar's height is still variable (the category rail wraps on some
  // widths), so anchor-scrolling needs the live value rather than a guess.
  // It is far smaller on mobile now that the lane rail moved into the filter
  // panel, but the measurement stays — it is what keeps #services-section from
  // scrolling underneath the bar.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const publish = () => {
      document.documentElement.style.setProperty(
        '--usil-header-h',
        `${Math.round(el.getBoundingClientRect().height)}px`,
      );
    };
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const applySearch = (raw: string) => {
    const next = raw.trim();
    onSearchChange(next);
    onSearchSubmit?.(next);
    document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!legalRef.current?.contains(event.target as Node)) setLegalOpen(false);
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLegalOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const searchField = (id: string, compact?: boolean) => (
    <form
      className={cn('relative flex-1 min-w-0', !compact && 'max-w-3xl')}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        applySearch(searchQuery);
      }}
    >
      <Search
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
        aria-hidden
      />
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={SEARCH_PLACEHOLDER}
        list={id}
        aria-label="ابحث في المتجر"
        className="w-full h-11 pr-10 pl-3 rounded-control bg-paper border border-line text-sm text-ink placeholder:text-muted transition-colors focus:outline-none focus:border-action focus:bg-surface focus:ring-4 focus:ring-action/10"
      />
      <datalist id={id}>
        {CATALOG_SEARCH_CHIPS.map((chip) => (
          <option key={chip} value={chip} />
        ))}
      </datalist>
    </form>
  );

  const citySelect = (compact?: boolean) => (
    <button
      type="button"
      onClick={() => (onOpenRegionPicker ? onOpenRegionPicker() : onSelectCity(selectedCity))}
      aria-label={`المنطقة الحالية: ${selectedCity === ALL_CITIES_LABEL ? 'كل المناطق' : selectedCity}. اضغط للتغيير`}
      className={cn(
        'shrink-0 h-11 px-2.5 rounded-control bg-surface border border-line',
        'inline-flex items-center gap-1.5 text-right transition-colors',
        'hover:border-action focus:outline-none focus:border-action focus:ring-4 focus:ring-action/10',
        compact ? 'max-w-[8.5rem]' : 'max-w-[13.5rem]',
      )}
    >
      <MapPin className="w-4 h-4 text-action shrink-0" aria-hidden />
      <span className="min-w-0 truncate text-sm font-semibold text-navy">
        {selectedCity === ALL_CITIES_LABEL ? 'كل المناطق' : selectedCity || 'اختر المنطقة'}
      </span>
      <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden />
    </button>
  );

  const legalLinks = [
    onOpenAbout ? { label: 'عن يوصل', onClick: onOpenAbout } : null,
    onOpenSupport ? { label: 'الدعم', onClick: onOpenSupport } : null,
    onOpenPrivacy ? { label: 'سياسة الخصوصية', onClick: onOpenPrivacy } : null,
    onOpenTerms ? { label: 'شروط الاستخدام', onClick: onOpenTerms } : null,
  ].filter(Boolean) as { label: string; onClick: () => void }[];

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 w-full bg-surface border-b border-line pointer-events-auto"
    >
      {/* Keeps the light status-bar icons readable where the system bar draws
          over the web view (Android 15 edge-to-edge, iOS notch). 0px on web. */}
      <div aria-hidden className="usil-statusbar-scrim" />

      <div className="container mx-auto px-3 sm:px-4 lg:px-8 h-16 flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="flex items-center gap-2 shrink-0 min-w-0 rounded-control"
          onClick={() => {
            if (viewMode !== 'client') onToggleViewMode();
            else onGoHome?.();
          }}
          aria-label="يوصل — الصفحة الرئيسية"
        >
          <UsilLockup compact />
        </button>

        {viewMode === 'client' ? (
          <div className="hidden md:flex items-center flex-1 min-w-0 gap-2">
            {citySelect()}
            {searchField('usil-nav-suggest')}
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-3 flex-1 justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-action-100 text-action text-xs font-semibold border border-action-200">
              <LayoutDashboard className="w-3.5 h-3.5" aria-hidden />
              <span>{t('vendorOSBadge', 'نظام تشغيل المورّد')}</span>
            </span>
          </div>
        )}

        <div className="relative z-[60] flex items-center gap-1.5 min-w-0 ms-auto pointer-events-auto">
          {/* Currency — a native select layered over the trigger so it uses the
              platform picker on mobile instead of a custom dropdown. */}
          <div className="relative w-9 h-9 shrink-0 hidden lg:block">
            <div className="w-9 h-9 rounded-control bg-paper border border-line flex items-center justify-center pointer-events-none">
              <Coins className="w-4 h-4 text-action" aria-hidden />
            </div>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label={t('selectCurrency', 'العملة')}
            >
              {availableCurrencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} ({isArabic ? c.symbolAr : c.symbolEn})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={toggleLanguage}
            className="hidden lg:inline-flex px-2.5 h-9 rounded-control bg-paper border border-line text-ink-2 text-xs font-semibold items-center gap-1.5 hover:border-navy-300 transition-colors"
            aria-label={t('switchLang', 'تغيير اللغة')}
          >
            <Languages className="w-3.5 h-3.5 text-action" aria-hidden />
            <span>{isArabic ? 'EN' : 'عربي'}</span>
          </button>

          {legalLinks.length ? (
            <div className="relative hidden lg:block" ref={legalRef}>
              <button
                type="button"
                onClick={() => setLegalOpen((open) => !open)}
                className="w-9 h-9 rounded-control bg-paper border border-line text-ink-2 flex items-center justify-center hover:border-navy-300 transition-colors"
                aria-label="الدعم والصفحات القانونية"
                aria-expanded={legalOpen}
                aria-haspopup="menu"
              >
                <FileText className="w-4 h-4 text-action" aria-hidden />
              </button>
              {legalOpen ? (
                <div
                  role="menu"
                  className="absolute top-full mt-1.5 end-0 z-50 w-48 rounded-card bg-surface border border-line shadow-e3 p-1.5 text-right usil-pop-in"
                >
                  {legalLinks.map((link) => (
                    <button
                      key={link.label}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        link.onClick();
                        setLegalOpen(false);
                      }}
                      className="w-full px-3 py-2.5 rounded-control text-sm font-medium text-ink hover:bg-action-100 hover:text-action transition-colors"
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {onOpenTracker && (
            <Button
              size="sm"
              variant="secondary"
              icon={Clock}
              onClick={onOpenTracker}
              className="hidden xl:inline-flex"
            >
              {t('liveTrack', 'تتبع')}
            </Button>
          )}

          {onOpenChats && (
            <Button
              size="sm"
              variant="secondary"
              icon={MessagesSquare}
              onClick={onOpenChats}
              className="hidden md:inline-flex"
              aria-label={chatUnread ? `رسائلي — ${chatUnread} رسائل غير مقروءة` : 'رسائلي'}
            >
              رسائلي
              <CountBadge count={chatUnread} tone="action" label="رسائل غير مقروءة" />
            </Button>
          )}

          {onOpenCrewPortal && currentUser?.role === 'vendor' && (
            <Button
              size="sm"
              variant="secondary"
              icon={Users}
              onClick={onOpenCrewPortal}
              className="hidden xl:inline-flex"
            >
              {t('crewPortal', 'الطاقم')}
            </Button>
          )}

          {viewMode === 'client' && onOpenCompare && (
            <button
              onClick={onOpenCompare}
              className={cn(
                'relative w-9 h-9 rounded-control border hidden md:flex items-center justify-center transition-colors',
                compareCount > 0
                  ? 'bg-action-100 border-action-200 text-action'
                  : 'bg-paper border-line text-ink-2 hover:border-navy-300',
              )}
              aria-label={
                compareCount > 0
                  ? `مقارنة المنتجات — ${compareCount} محدد`
                  : 'مقارنة المنتجات'
              }
            >
              <Scale className="w-4 h-4" aria-hidden />
              {compareCount > 0 && (
                <span className="absolute -top-1.5 -start-1.5">
                  <CountBadge count={compareCount} label="منتج للمقارنة" tone="action" />
                </span>
              )}
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-2 p-1 rounded-control bg-paper border border-line">
                {currentUser.avatarUrl || currentUser.avatar ? (
                  <img
                    src={currentUser.avatarUrl || currentUser.avatar}
                    alt=""
                    className="w-7 h-7 rounded-md object-cover bg-navy"
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-md bg-navy text-sand flex items-center justify-center text-sm font-bold"
                    aria-hidden
                  >
                    {(currentUser.name || 'ي').trim()[0] || 'ي'}
                  </div>
                )}
                <div className="hidden sm:block text-right pe-1">
                  <span className="font-semibold text-ink block leading-tight text-xs">
                    {currentUser.name}
                  </span>
                  <span className="text-2xs text-action font-medium">
                    {currentUser.loyaltyTier}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                aria-label={t('logout', 'تسجيل الخروج')}
                className="w-9 h-9 min-h-9 hover:text-danger hover:bg-danger-bg"
              >
                <LogOut className="w-4 h-4" aria-hidden />
              </Button>
            </div>
          ) : (
            <>
              <Button
                size="sm"
                variant="secondary"
                icon={User}
                onClick={() => onOpenAuth('login')}
                aria-label="تسجيل الدخول"
                className="min-h-11 h-11"
              >
                <span className="hidden sm:inline">دخول</span>
              </Button>
              <Button
                size="sm"
                variant="primary"
                icon={UserPlus}
                onClick={() => onOpenAuth('register')}
                aria-label="إنشاء حساب جديد"
                className="min-h-11 h-11"
              >
                <span className="hidden sm:inline">إنشاء حساب</span>
                <span className="sm:hidden">تسجيل</span>
              </Button>
            </>
          )}

          {onOpenVendorHub &&
          currentUser &&
          (currentUser.role === 'admin' || currentUser.role === 'accounts_manager') &&
          viewMode !== 'vendor' ? (
            <Button size="sm" variant="navy" icon={LayoutDashboard} onClick={onOpenVendorHub}>
              <span className="hidden sm:inline">لوحة المورد</span>
            </Button>
          ) : null}

          {currentUser && currentUser.role !== 'client' ? (
            <Button
              size="sm"
              variant={viewMode !== 'client' ? 'secondary' : 'navy'}
              icon={viewMode !== 'client' ? Store : LayoutDashboard}
              onClick={onToggleViewMode}
            >
              <span className="hidden sm:inline">
                {viewMode !== 'client'
                  ? t('clientStore', 'المتجر')
                  : currentUser.role === 'admin' || currentUser.role === 'accounts_manager'
                    ? 'الإدارة'
                    : t('vendorPortal', 'المورّد')}
              </span>
            </Button>
          ) : null}

          {viewMode === 'client' && (
            <button
              onClick={onOpenCart}
              className="relative h-9 px-3 rounded-control bg-navy hover:bg-navy-700 text-white text-xs font-semibold hidden sm:inline-flex items-center gap-2 shrink-0 transition-colors"
              aria-label={cartCount > 0 ? `سلة الحجز — ${cartCount} عنصر` : 'سلة الحجز'}
            >
              <ShoppingBag className="w-4 h-4" aria-hidden />
              <span>السلة</span>
              {cartCount > 0 && (
                <span className="min-w-5 h-5 px-1 rounded-md bg-action text-white text-2xs font-semibold flex items-center justify-center tnum">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile: city + search on one row. The lane rail that used to sit here
          moved into the filter panel — four stacked rails put the app bar at
          ~280px, roughly 40% of an iPhone SE viewport before any content. */}
      {viewMode === 'client' && (
        <div className="md:hidden px-3 pb-2.5 flex items-center gap-2">
          {citySelect(true)}
          {searchField('usil-nav-suggest-mobile', true)}
        </div>
      )}

      {viewMode === 'client' && onSelectCategory ? (
        <CategoryIconRail selectedCategory={selectedCategory} onSelectCategory={onSelectCategory} />
      ) : null}

      {/* Fulfillment lanes stay in the bar on desktop, where there is room and
          they are a headline part of the proposition. */}
      {viewMode === 'client' && onSelectFulfillment ? (
        <div className="hidden md:block border-t border-line bg-surface">
          <div
            className="container mx-auto px-3 sm:px-4 lg:px-8 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-2"
            role="group"
            aria-label="مسارات التوريد"
          >
            {FULFILLMENT_FILTER_CHIPS.map((chip) => {
              const active = selectedFulfillment === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    onSelectFulfillment(chip.id);
                    document
                      .getElementById('services-section')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 border transition-colors',
                    active
                      ? 'bg-action border-action text-white'
                      : 'bg-paper border-line text-ink-2 hover:border-action hover:text-action',
                  )}
                >
                  {chip.chip}
                </button>
              );
            })}
            {!currentUser && onOpenVendorRegister ? (
              <button
                type="button"
                onClick={onOpenVendorRegister}
                className="ms-auto px-3 py-1.5 rounded-full text-xs font-semibold text-ink-3 hover:text-action whitespace-nowrap shrink-0 transition-colors"
              >
                تسجيل مورد
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
};
