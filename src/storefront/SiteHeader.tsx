import React, { useEffect, useState } from 'react';
import { MapPin, ChevronDown, MessageCircle, ShoppingBag, User, Menu, X } from 'lucide-react';
import { UsilMark } from '../components/UsilMark';
import { cn } from '../components/ui/cn';
import { ALL_CITIES_LABEL } from '../data/saudiPlaces';
import { useLang } from './lang';
import { useStorefront } from './context';
import { ChevronForward } from './primitives';

/**
 * Sticky white app bar from the design: mark + wordmark, desktop nav, region
 * button, language toggle, chat and cart icon buttons with count badges, the
 * navy account button on desktop and a menu toggle on mobile.
 */
export function SiteHeader() {
  const { t, toggle } = useLang();
  const sf = useStorefront();
  const [menuOpen, setMenuOpen] = useState(false);
  const page = sf.sitePage;

  // Close the mobile menu on any navigation.
  useEffect(() => setMenuOpen(false), [sf.pathname]);

  const navItems: Array<{ id: string; label: string; go: () => void; active: boolean }> = [
    { id: 'home', label: t.navHome, go: sf.goHome, active: page === null },
    { id: 'catalog', label: t.navCatalog, go: () => sf.goCatalog(), active: page === 'catalog' || page === 'product' },
    { id: 'request', label: t.navRequest, go: () => sf.navigate('/request'), active: page === 'request' },
    { id: 'providers', label: t.navProviders, go: () => sf.navigate('/providers'), active: page === 'providers' },
  ];
  const menuItems = [
    ...navItems,
    { id: 'orders', label: t.navOrders, go: () => sf.navigate('/orders'), active: page === 'orders' },
    { id: 'chat', label: t.navChat, go: () => sf.navigate('/chat'), active: page === 'chat' },
    {
      id: 'account',
      label: sf.user ? t.account : t.signIn,
      go: () => sf.navigate(sf.user ? '/account' : '/login'),
      active: page === 'account' || page === 'login',
    },
  ];

  const cityLabel = sf.selectedCity === ALL_CITIES_LABEL || !sf.selectedCity ? t.allRegions : sf.selectedCity;
  const cartCount = sf.cart.reduce((sum, item) => sum + item.quantity, 0);

  const iconBtn =
    'relative w-10 h-10 rounded-control border border-line bg-surface text-navy grid place-items-center text-[18px] cursor-pointer transition-colors hover:border-action';

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-line">
      <div aria-hidden className="usil-statusbar-scrim" />
      <div className="sf-wrap h-[68px] flex items-center gap-2.5">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            sf.goHome();
          }}
          className="flex items-center gap-2 no-underline text-navy me-2 shrink-0"
          aria-label={t.brand}
        >
          <UsilMark className="w-[34px] h-[34px]" />
          <span className="font-bold text-2xl tracking-[-0.02em] leading-none">{t.brand}</span>
        </a>

        <nav className="hidden lg:flex h-[68px] gap-1" aria-label={t.menu}>
          {navItems.map((n) => (
            <a
              key={n.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                n.go();
              }}
              className={cn(
                'flex items-center px-3.5 text-[15px] font-medium no-underline whitespace-nowrap transition-colors hover:text-action',
                n.active ? 'text-action shadow-[inset_0_-2px_0_#155EEF]' : 'text-ink-1',
              )}
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex-1" />

        <button
          type="button"
          onClick={sf.openRegionPicker}
          className="hidden lg:flex items-center gap-1.5 h-10 px-3 rounded-control border border-line bg-paper text-navy text-sm font-medium whitespace-nowrap cursor-pointer hover:border-action transition-colors max-w-[220px]"
          aria-label={`${t.changeRegion}: ${cityLabel}`}
        >
          <MapPin className="w-4 h-4 text-action shrink-0" aria-hidden />
          <span className="truncate">{cityLabel}</span>
          <ChevronDown className="w-3.5 h-3.5 text-ink-3 shrink-0" aria-hidden />
        </button>

        <button
          type="button"
          onClick={toggle}
          className="h-10 min-w-10 px-3 rounded-control border border-line bg-surface text-navy text-sm font-semibold cursor-pointer hover:bg-paper transition-colors"
          aria-label="Switch language / تغيير اللغة"
        >
          {t.langBtn}
        </button>

        <button
          type="button"
          onClick={() => sf.navigate('/chat')}
          className={iconBtn}
          aria-label={sf.chatUnread ? `${t.navChat} — ${sf.chatUnread} ${t.unreadWord}` : t.navChat}
        >
          <MessageCircle className="w-[18px] h-[18px]" aria-hidden />
          {sf.chatUnread > 0 ? (
            <span className="absolute -top-1.5 -end-1.5 min-w-5 h-5 px-1.5 rounded-full bg-danger text-white text-[11px] font-bold grid place-items-center border-2 border-surface tnum">
              {sf.chatUnread > 99 ? '99+' : sf.chatUnread}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => sf.navigate('/cart')}
          className={iconBtn}
          aria-label={cartCount ? `${t.cartTitle} — ${cartCount}` : t.cartTitle}
        >
          <ShoppingBag className="w-[18px] h-[18px]" aria-hidden />
          {cartCount > 0 ? (
            <span className="absolute -top-1.5 -end-1.5 min-w-5 h-5 px-1.5 rounded-full bg-action text-white text-[11px] font-bold grid place-items-center border-2 border-surface tnum">
              {cartCount}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => sf.navigate(sf.user ? '/account' : '/login')}
          className="hidden md:flex items-center gap-2 h-10 px-4 rounded-control bg-navy text-white text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors hover:bg-action"
        >
          <User className="w-4 h-4" aria-hidden />
          <span className="max-w-[140px] truncate">{sf.user ? sf.user.name?.split(' ')[0] || t.account : t.account}</span>
        </button>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden w-10 h-10 rounded-control border border-line bg-surface text-navy grid place-items-center cursor-pointer"
          aria-expanded={menuOpen}
          aria-label={t.menu}
        >
          {menuOpen ? <X className="w-5 h-5" aria-hidden /> : <Menu className="w-5 h-5" aria-hidden />}
        </button>
      </div>

      {menuOpen ? (
        <div className="md:hidden border-t border-line bg-surface sf-wrap pt-2 pb-4 flex flex-col gap-0.5 usil-pop-in">
          {menuItems.map((n) => (
            <a
              key={n.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                n.go();
              }}
              className={cn(
                'flex items-center justify-between py-3 px-1 text-base font-medium no-underline border-b border-line-soft min-h-11',
                n.active ? 'text-action' : 'text-navy',
              )}
            >
              {n.label}
              <ChevronForward className="w-4 h-4 text-ink-3" />
            </a>
          ))}
          <button
            type="button"
            onClick={sf.openRegionPicker}
            className="flex items-center gap-2 mt-2.5 h-11 px-3.5 rounded-control border border-line bg-paper text-sm font-medium text-navy"
          >
            <MapPin className="w-4 h-4 text-action" aria-hidden />
            {cityLabel}
          </button>
        </div>
      ) : null}
    </header>
  );
}
