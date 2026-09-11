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

  // The mobile app bar stacks a search row, a category rail and a lane rail
  // under the brand row, so its height swings between ~64px and ~280px.
  // Anchor scrolling (#services-section) needs the live value, not a guess.
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
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const searchField = (id: string, compact?: boolean) => (
    <form
      className={`relative flex-1 min-w-0 ${compact ? '' : 'max-w-3xl'}`}
      onSubmit={(e) => {
        e.preventDefault();
        applySearch(searchQuery);
      }}
    >
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            applySearch((e.target as HTMLInputElement).value);
          }
        }}
        placeholder={SEARCH_PLACEHOLDER}
        list={id}
        aria-label="ابحث في المتجر"
        className="w-full h-11 pr-10 pl-3 rounded-lg bg-[#F7F8FA] border border-[#E4E7EC] text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#155EEF] focus:bg-white"
      />
      <datalist id={id}>
        {CATALOG_SEARCH_CHIPS.map((chip) => (
          <option key={chip} value={chip} />
        ))}
      </datalist>
    </form>
  );

  const citySelect = () => (
    <button
      type="button"
      onClick={() => (onOpenRegionPicker ? onOpenRegionPicker() : onSelectCity(selectedCity))}
      aria-label="اختر المنطقة"
      className="shrink-0 h-11 max-w-[11.5rem] sm:max-w-[13.5rem] px-2.5 rounded-xl bg-white border border-[#E4E7EC] hover:border-[#155EEF] inline-flex items-center gap-1.5 text-right"
    >
      <MapPin className="w-4 h-4 text-[#155EEF] shrink-0" />
      <span className="min-w-0 truncate text-xs sm:text-sm font-extrabold text-[#0A1A33]">
        {selectedCity === ALL_CITIES_LABEL ? 'كل المناطق' : selectedCity || 'اختر المنطقة'}
      </span>
      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
    </button>
  );

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 w-full bg-white border-b border-[#E4E7EC] pointer-events-auto"
    >
      {/* Keeps the light status-bar icons readable where the system bar draws
          over the web view (Android 15 edge-to-edge, iOS notch). 0px on web. */}
      <div aria-hidden className="usil-statusbar-scrim" />
      <div className="container mx-auto px-3 sm:px-4 lg:px-8 h-16 flex items-center gap-2 sm:gap-3">
        <div
          className="flex items-center gap-2 shrink-0 min-w-0 cursor-pointer"
          onClick={() => {
            if (viewMode !== 'client') onToggleViewMode();
            else onGoHome?.();
          }}
          role="link"
          aria-label="يوصل — الصفحة الرئيسية"
        >
          <UsilLockup compact />
        </div>

        {viewMode === 'client' ? (
          <div className="hidden md:flex items-center flex-1 min-w-0 gap-2">
            {citySelect()}
            {searchField('usil-nav-suggest')}
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-3 flex-1 justify-center">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 text-[#155EEF] text-xs font-bold border border-blue-200">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{t('vendorOSBadge', 'نظام تشغيل المورّد')}</span>
            </span>
          </div>
        )}

        <div className="relative z-[60] flex items-center gap-1 sm:gap-2 min-w-0 ms-auto pointer-events-auto">
          <div className="relative w-9 h-9 shrink-0 hidden sm:block" title={currency}>
            <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center pointer-events-none">
              <Coins className="w-4 h-4 text-[#155EEF]" />
            </div>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title={t('selectCurrency', 'Currency')}
              aria-label={t('selectCurrency', 'Currency')}
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
            className="hidden sm:inline-flex px-2 h-9 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold items-center gap-1"
            title={t('switchLang', 'تغيير اللغة')}
            aria-label={t('switchLang', 'تغيير اللغة')}
          >
            <Languages className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>{isArabic ? 'EN' : 'عربي'}</span>
          </button>

          {onOpenSupport || onOpenPrivacy || onOpenTerms || onOpenAbout ? (
            <div className="relative hidden sm:block" ref={legalRef}>
              <button
                type="button"
                onClick={() => setLegalOpen((open) => !open)}
                className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-center"
                title="الدعم والقانوني"
                aria-label="الدعم والقانوني"
                aria-expanded={legalOpen}
              >
                <FileText className="w-4 h-4 text-[#155EEF]" />
              </button>
              {legalOpen ? (
                <div role="menu" className="absolute top-full mt-1.5 end-0 z-50 w-44 rounded-xl bg-white border border-[#E4E7EC] shadow-lg p-1.5 text-right">
                  {onOpenAbout ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onOpenAbout();
                        setLegalOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-lg text-xs font-bold text-[#101828] hover:bg-[#EAF0FE]"
                    >
                      عن يوصل
                    </button>
                  ) : null}
                  {onOpenSupport ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onOpenSupport();
                        setLegalOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-lg text-xs font-bold text-[#101828] hover:bg-[#EAF0FE]"
                    >
                      الدعم
                    </button>
                  ) : null}
                  {onOpenPrivacy ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onOpenPrivacy();
                        setLegalOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-lg text-xs font-bold text-[#101828] hover:bg-[#EAF0FE]"
                    >
                      سياسة الخصوصية
                    </button>
                  ) : null}
                  {onOpenTerms ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onOpenTerms();
                        setLegalOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-lg text-xs font-bold text-[#101828] hover:bg-[#EAF0FE]"
                    >
                      شروط الاستخدام
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {onOpenTracker && (
            <button
              onClick={onOpenTracker}
              className="hidden lg:inline-flex px-2.5 h-9 rounded-lg bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-bold items-center gap-1.5"
              title={t('liveTrack', 'تتبع مناسبتك المباشرة')}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t('liveTrack', 'تتبع')}</span>
            </button>
          )}

          {onOpenCrewPortal && currentUser?.role === 'vendor' && (
            <button
              onClick={onOpenCrewPortal}
              className="hidden lg:inline-flex px-2.5 h-9 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-amber-700" />
              <span>{t('crewPortal', 'الطاقم')}</span>
            </button>
          )}

          {viewMode === 'client' && onOpenCompare && (
            <button
              onClick={onOpenCompare}
              className={`relative w-9 h-9 rounded-lg border hidden md:flex items-center justify-center ${
                compareCount > 0
                  ? 'bg-blue-50 border-blue-300 text-[#155EEF]'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
              title="Compare services"
              aria-label="Compare services"
            >
              <Scale className="w-4 h-4 text-[#155EEF]" />
              {compareCount > 0 && (
                <span className="absolute -top-1 -start-1 w-4 h-4 rounded-full bg-[#155EEF] text-white text-[10px] flex items-center justify-center font-mono">
                  {compareCount}
                </span>
              )}
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-2 p-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                {currentUser.avatarUrl || currentUser.avatar ? (
                  <img
                    src={currentUser.avatarUrl || currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-md object-cover bg-[#0A1A33]"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-md bg-[#0A1A33] text-[#C0A16B] flex items-center justify-center font-bold">
                    {(currentUser.name || 'ي').trim()[0] || 'ي'}
                  </div>
                )}
                <div className="hidden sm:block text-right">
                  <span className="font-bold text-slate-900 block leading-tight text-[11px]">{currentUser.name}</span>
                  <span className="text-[9px] text-[#155EEF] font-bold">{currentUser.loyaltyTier}</span>
                </div>
              </div>
              <button
                onClick={onLogout}
                title={t('logout', 'تسجيل الخروج')}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 flex items-center justify-center"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="relative z-[60] shrink-0 whitespace-nowrap min-h-[44px] h-11 px-2 sm:px-2.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold inline-flex items-center gap-1 pointer-events-auto touch-manipulation"
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span>حساب</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="relative z-[60] shrink-0 whitespace-nowrap min-h-[44px] h-11 px-2 sm:px-3 rounded-lg bg-[#155EEF] hover:bg-[#0F45B5] text-white text-xs font-bold inline-flex items-center gap-1 pointer-events-auto touch-manipulation"
              >
                <UserPlus className="w-3.5 h-3.5 shrink-0" />
                <span>إنشاء حساب</span>
              </button>
            </>
          )}

          {onOpenVendorHub && currentUser && (currentUser.role === 'admin' || currentUser.role === 'accounts_manager') && viewMode !== 'vendor' ? (
            <button
              type="button"
              onClick={onOpenVendorHub}
              className="h-9 px-2.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 border bg-[#0A1A33] text-white border-transparent"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#C0A16B]" />
              <span className="hidden sm:inline">لوحة المورد</span>
            </button>
          ) : null}

          {currentUser && currentUser.role !== 'client' ? (
            <button
              onClick={onToggleViewMode}
              className={`h-9 px-2.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 border ${
                viewMode !== 'client'
                  ? 'bg-blue-50 text-blue-900 border-blue-200'
                  : 'bg-[#0A1A33] text-white border-transparent'
              }`}
            >
              {viewMode !== 'client' ? (
                <>
                  <Store className="w-3.5 h-3.5 text-[#C0A16B]" />
                  <span className="hidden sm:inline">{t('clientStore', 'المتجر')}</span>
                </>
              ) : currentUser.role === 'admin' || currentUser.role === 'accounts_manager' ? (
                <>
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#C0A16B]" />
                  <span className="hidden sm:inline">الإدارة</span>
                </>
              ) : (
                <>
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#C0A16B]" />
                  <span className="hidden sm:inline">{t('vendorPortal', 'المورّد')}</span>
                </>
              )}
            </button>
          ) : null}

          {viewMode === 'client' && (
            <button
              onClick={onOpenCart}
              className="relative h-9 px-3 rounded-lg bg-[#0A1A33] hover:bg-[#20304C] text-white font-bold text-xs hidden sm:inline-flex items-center gap-1.5 shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">السلة</span>
              {cartCount > 0 && (
                <span className="min-w-5 h-5 px-1 rounded-md bg-[#155EEF] text-white text-[11px] font-bold flex items-center justify-center font-mono">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {viewMode === 'client' && (
        <div className="md:hidden px-3 pb-2 flex items-center gap-2">
          {citySelect()}
          {searchField('usil-nav-suggest-mobile', true)}
        </div>
      )}

      {viewMode === 'client' && onSelectCategory ? (
        <CategoryIconRail selectedCategory={selectedCategory} onSelectCategory={onSelectCategory} />
      ) : null}

      {viewMode === 'client' && onSelectFulfillment ? (
        <div className="border-t border-[#E4E7EC] bg-white" aria-label="مسارات التوريد">
          <div className="container mx-auto px-3 sm:px-4 lg:px-8 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1.5">
            {FULFILLMENT_FILTER_CHIPS.map((chip) => {
              const active = selectedFulfillment === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => {
                    onSelectFulfillment(chip.id);
                    document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`px-3 py-2 min-h-[44px] rounded-full text-[12px] font-bold whitespace-nowrap shrink-0 border flex items-center ${
                    active
                      ? 'bg-[#155EEF] border-[#155EEF] text-white'
                      : 'bg-[#F7F8FA] border-[#E4E7EC] text-[#344054] hover:border-[#155EEF] hover:text-[#155EEF]'
                  }`}
                >
                  {chip.chip}
                </button>
              );
            })}
            {!currentUser && onOpenVendorRegister ? (
              <button
                type="button"
                onClick={onOpenVendorRegister}
                className="ms-auto px-3 py-2 min-h-[44px] rounded-full text-[12px] font-bold text-[#667085] hover:text-[#155EEF] whitespace-nowrap shrink-0"
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
